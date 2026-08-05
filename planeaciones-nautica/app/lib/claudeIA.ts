// Cliente IA de Claude (Anthropic) para el servidor. Punto único donde vive la
// clave ANTHROPIC_API_KEY. Reemplaza a Gemini en TODAS las rutas de IA
// (presentaciones, planeaciones, exámenes y revisión de planeaciones).
//
// La clave nunca llega al navegador: solo se usa en Route Handlers (servidor).

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type * as z from "zod/v4";

// Modelo por defecto: el Opus vigente de la familia Claude 5. Configurable por
// entorno sin tocar código (p. ej. para bajar de tier o fijar una versión
// concreta). ANTHROPIC_MODEL sigue mandando sobre TODAS las tareas, igual que
// antes; las variables por tarea (abajo) solo afinan una tarea concreta.
export const MODELO_CLAUDE = process.env.ANTHROPIC_MODEL || "claude-opus-5";

/** Tareas con presupuesto/latencia distintos; cada una puede fijar su modelo. */
export type TareaClaude = "presentaciones" | "planeaciones" | "examenes";

// Espejo del patrón que ya usaba Gemini (GEMINI_MODEL_EXAMENES || GEMINI_MODEL
// || defecto). Si la variable por tarea no está puesta, se usa MODELO_CLAUDE.
const ENV_POR_TAREA: Record<TareaClaude, string | undefined> = {
  presentaciones: process.env.ANTHROPIC_MODEL_PRESENTACIONES,
  planeaciones: process.env.ANTHROPIC_MODEL_PLANEACIONES,
  examenes: process.env.ANTHROPIC_MODEL_EXAMENES,
};

/** Modelo efectivo de una tarea (también es lo que entra en la clave de cache). */
export function modeloClaude(tarea: TareaClaude): string {
  return (ENV_POR_TAREA[tarea] ?? "").trim() || MODELO_CLAUDE;
}

/** true si la clave de Anthropic está configurada en el entorno del servidor. */
export function tieneClaveAnthropic(): boolean {
  return (
    typeof process.env.ANTHROPIC_API_KEY === "string" &&
    process.env.ANTHROPIC_API_KEY.trim().length > 0
  );
}

/** Nivel de esfuerzo (profundidad de razonamiento) admitido por Claude 5. */
export type EsfuerzoClaude = "low" | "medium" | "high" | "xhigh" | "max";

export type OpcionesClaude = {
  /** Modelo concreto; por defecto MODELO_CLAUDE. */
  modelo?: string;
  /** Tope de tokens de salida (incluye el razonamiento del modelo). */
  maxTokens?: number;
  /** Presupuesto de razonamiento: "low" para rutas con timeout apretado. */
  esfuerzo?: EsfuerzoClaude;
};

/**
 * Genera texto con Claude a partir de un system prompt + un mensaje de usuario.
 * Usa streaming (get de finalMessage) para no chocar con los timeouts de HTTP
 * en respuestas largas (los guiones de presentaciones pueden ser extensos).
 * Devuelve el texto concatenado de los bloques de texto de la respuesta.
 */
export async function generarTextoClaude(
  system: string,
  mensaje: string,
  maxTokens = 32000,
  opciones: OpcionesClaude = {},
): Promise<string> {
  return textoDeClaude(system, mensaje, null, {
    ...opciones,
    maxTokens: opciones.maxTokens ?? maxTokens,
  });
}

/**
 * Aísla el objeto JSON de una respuesta: quita ```json ... ``` y texto sobrante,
 * quedándose con el primer "{" hasta el último "}". Tolerante a que el modelo
 * añada prosa antes o después del JSON.
 */
export function extraerJSON(texto: string): string {
  let t = texto.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const ini = t.indexOf("{");
  const fin = t.lastIndexOf("}");
  if (ini !== -1 && fin !== -1 && fin > ini) t = t.slice(ini, fin + 1);
  return t;
}

/** Motivos con los que puede fallar una generación de JSON. Las rutas los
 *  mapean 1:1 al campo `motivo`/`error` que ya devuelven hoy. */
export type MotivoJSONClaude = "respuesta_vacia" | "json_invalido";

/** Error tipado para que cada ruta conserve SU contrato de errores sin duplicar
 *  el parseo. `texto` es la respuesta cruda (la usa /api/planeacion-ingles). */
export class ErrorJSONClaude extends Error {
  constructor(
    readonly motivo: MotivoJSONClaude,
    readonly texto: string,
    readonly detalle?: string,
  ) {
    super(detalle ? `${motivo}: ${detalle}` : motivo);
    this.name = "ErrorJSONClaude";
  }
}

/**
 * Pide JSON SIN esquema (equivalente al `responseMimeType: "application/json"`
 * de Gemini sin `responseSchema`): el system prompt es el que fija la forma.
 * Devuelve el texto crudo y el objeto ya parseado.
 */
export async function generarJSONClaude(
  system: string,
  mensaje: string,
  opciones: OpcionesClaude = {},
): Promise<{ texto: string; datos: unknown }> {
  const texto = await textoDeClaude(system, mensaje, null, opciones);
  return { texto, datos: parsearJSON(texto) };
}

/**
 * Pide JSON ESTRUCTURADO validado contra un esquema Zod. Sustituye al
 * `responseSchema` de Gemini: el esquema se envía a Claude como
 * `output_config.format` (structured outputs), así que el modelo no puede
 * devolver otra forma; después se revalida con el MISMO esquema Zod.
 *
 * Si el modelo configurado no admite structured outputs (p. ej. si alguien fija
 * ANTHROPIC_MODEL a un modelo antiguo), reintenta una vez sin `output_config`:
 * el system prompt de cada ruta ya pide "solo el objeto JSON del esquema".
 */
export async function generarJSONEstructuradoClaude<T>(
  system: string,
  mensaje: string,
  esquema: z.ZodType<T>,
  opciones: OpcionesClaude = {},
): Promise<{ texto: string; datos: T }> {
  const formato = zodOutputFormat(esquema);

  let texto: string;
  try {
    texto = await textoDeClaude(system, mensaje, formato, opciones);
  } catch (e) {
    if (!esErrorDeEsquemaNoSoportado(e)) throw e;
    console.warn(
      "claudeIA: el modelo no admite output_config.format; se reintenta sin esquema.",
    );
    texto = await textoDeClaude(system, mensaje, null, opciones);
  }

  const crudo = parsearJSON(texto);
  const validado = esquema.safeParse(crudo);
  if (!validado.success) {
    throw new ErrorJSONClaude("json_invalido", texto, validado.error.message);
  }
  return { texto, datos: validado.data };
}

/* ------------------------------- internos ------------------------------- */

function parsearJSON(texto: string): unknown {
  if (!texto.trim()) throw new ErrorJSONClaude("respuesta_vacia", texto);
  try {
    return JSON.parse(extraerJSON(texto));
  } catch (e) {
    throw new ErrorJSONClaude(
      "json_invalido",
      texto,
      e instanceof Error ? e.message : String(e),
    );
  }
}

/** Llamada única a la API. Streaming para no chocar con los timeouts de HTTP. */
async function textoDeClaude(
  system: string,
  mensaje: string,
  formato: Anthropic.JSONOutputFormat | null,
  opciones: OpcionesClaude,
): Promise<string> {
  const client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno

  const modelo = opciones.modelo || MODELO_CLAUDE;

  // output_config solo se envía si hay algo que configurar: así las llamadas
  // que no lo necesitan siguen siendo idénticas a las de antes.
  const outputConfig: Anthropic.OutputConfig = {};
  if (formato) outputConfig.format = formato;
  // `effort` solo existe en la familia Claude 5. Se omite en modelos anteriores
  // para que la vía de reversión documentada (ANTHROPIC_MODEL=claude-opus-4-8,
  // por si la cuenta no tuviera acceso a Opus 5) no muera con un 400.
  if (opciones.esfuerzo && admiteEsfuerzo(modelo)) {
    outputConfig.effort = opciones.esfuerzo;
  }

  const stream = client.messages.stream({
    model: modelo,
    max_tokens: opciones.maxTokens ?? 32000,
    system,
    messages: [{ role: "user", content: mensaje }],
    ...(Object.keys(outputConfig).length ? { output_config: outputConfig } : {}),
  });
  const message = await stream.finalMessage();
  return message.content
    .filter((bloque): bloque is Anthropic.TextBlock => bloque.type === "text")
    .map((bloque) => bloque.text)
    .join("");
}

/** true si el modelo admite `output_config.effort` (familia Claude 5 en
 *  adelante). Los modelos 4.x devuelven 400 si se les envía. */
function admiteEsfuerzo(modelo: string): boolean {
  return !/^claude-(opus|sonnet|haiku)-4/.test(modelo.trim());
}

/** 400 del API por pedir structured outputs a un modelo que no los admite. */
function esErrorDeEsquemaNoSoportado(e: unknown): boolean {
  if (!(e instanceof Anthropic.APIError) || e.status !== 400) return false;
  const msg = (e.message || "").toLowerCase();
  return msg.includes("output_config") || msg.includes("output format");
}
