// Cliente IA de Gemini (Google) para el servidor. Espejo de `claudeIA.ts`:
// mismo patrón de streaming, mismo `extraerJSON`, mismo error tipado y misma
// resolución de modelo por entorno (global + por tarea).
//
// La clave (GEMINI_API_KEY) nunca llega al navegador: solo se usa en Route
// Handlers (servidor).
//
// POR QUÉ VUELVE GEMINI, Y POR QUÉ CLAUDE SIGUE AQUÍ
// --------------------------------------------------
// Este repo ya estuvo en Gemini y se migró a Claude porque el plan gratuito
// limitaba a 0 el modelo *pro* y la ruta moría con 429. Ese fallo no era del
// código: era de cuota, y puede volver en cualquier momento sin aviso. Un
// docente no se puede quedar sin presentación porque se agotó una cuota, así
// que Claude NO se retira: queda como FALLBACK AUTOMÁTICO. Si Gemini responde
// 429 / cuota agotada / no hay clave, la misma petición se reintenta con Claude
// y el endpoint responde igual. En consola queda SIEMPRE quién sirvió la
// respuesta: sin esa línea, una cuota agotada es invisible y la factura de
// Claude aparece sin explicación.
//
// El proveedor se elige con PROVEEDOR_PRESENTACIONES (gemini | claude);
// por defecto, gemini.

import { GoogleGenAI, type Schema } from "@google/genai";
import type * as z from "zod/v4";
import {
  generarTextoClaude,
  modeloClaude,
  tieneClaveAnthropic,
} from "./claudeIA";

// Modelo por defecto. gemini-2.5-flash a propósito: es el que funcionaba en el
// plan gratuito de la key. NO se pone un *pro* por defecto — ese fue justo el
// modelo que devolvía 429 y provocó la migración a Claude. Quien tenga cuota de
// pago puede subirlo por entorno sin tocar código.
export const MODELO_GEMINI = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/** Tareas con presupuesto/latencia distintos; cada una puede fijar su modelo. */
export type TareaGemini = "presentaciones" | "planeaciones" | "examenes";

// Mismo patrón que claudeIA (GEMINI_MODEL_<TAREA> || GEMINI_MODEL || defecto).
const ENV_POR_TAREA: Record<TareaGemini, string | undefined> = {
  presentaciones: process.env.GEMINI_MODEL_PRESENTACIONES,
  planeaciones: process.env.GEMINI_MODEL_PLANEACIONES,
  examenes: process.env.GEMINI_MODEL_EXAMENES,
};

/** Modelo efectivo de una tarea (también es lo que entra en la clave de cache). */
export function modeloGemini(tarea: TareaGemini): string {
  return (ENV_POR_TAREA[tarea] ?? "").trim() || MODELO_GEMINI;
}

/** true si la clave de Gemini está configurada en el entorno del servidor. */
export function tieneClaveGemini(): boolean {
  return (
    typeof process.env.GEMINI_API_KEY === "string" &&
    process.env.GEMINI_API_KEY.trim().length > 0
  );
}

export type OpcionesGemini = {
  /** Modelo concreto; por defecto MODELO_GEMINI. */
  modelo?: string;
  /** Tope de tokens de salida. */
  maxTokens?: number;
  /** Esquema OpenAPI que obliga la forma del JSON (constrained decoding).
   *  Equivale a `output_config.format` en Claude. */
  responseSchema?: Schema;
  /** Temperatura; se omite si no se indica (deja el defecto del modelo). */
  temperatura?: number;
  /** Pide `responseMimeType: "application/json"` SIN esquema (la forma la fija
   *  el system prompt). Se ignora si se pasa `responseSchema`. */
  forzarJSON?: boolean;
};

/**
 * Genera texto con Gemini a partir de un system prompt + un mensaje de usuario.
 * Usa streaming (igual que claudeIA) para no chocar con los timeouts de HTTP en
 * respuestas largas: los guiones de presentaciones pueden ser extensos.
 */
export async function generarTextoGemini(
  system: string,
  mensaje: string,
  maxTokens = 32000,
  opciones: OpcionesGemini = {},
): Promise<string> {
  return textoDeGemini(system, mensaje, {
    ...opciones,
    maxTokens: opciones.maxTokens ?? maxTokens,
  });
}

/**
 * Aísla el objeto JSON de una respuesta: quita ```json ... ``` y texto sobrante,
 * quedándose con el primer "{" hasta el último "}". Idéntico al de claudeIA:
 * aunque `responseMimeType: "application/json"` ya debería devolver JSON puro,
 * el camino de fallback (sin esquema) puede traer prosa alrededor.
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
export type MotivoJSONGemini = "respuesta_vacia" | "json_invalido";

/** Error tipado para que cada ruta conserve SU contrato de errores sin duplicar
 *  el parseo. `texto` es la respuesta cruda. */
export class ErrorJSONGemini extends Error {
  constructor(
    readonly motivo: MotivoJSONGemini,
    readonly texto: string,
    readonly detalle?: string,
  ) {
    super(detalle ? `${motivo}: ${detalle}` : motivo);
    this.name = "ErrorJSONGemini";
  }
}

/** Falta la clave del proveedor. Se distingue de un fallo de red para que el
 *  fallback sepa que no tiene sentido reintentar con el MISMO proveedor. */
export class ErrorSinClaveIA extends Error {
  constructor(readonly variable: string) {
    super(`${variable} no está configurada.`);
    this.name = "ErrorSinClaveIA";
  }
}

/**
 * Pide JSON SIN esquema: el system prompt es el que fija la forma.
 * Devuelve el texto crudo y el objeto ya parseado.
 */
export async function generarJSONGemini(
  system: string,
  mensaje: string,
  opciones: OpcionesGemini = {},
): Promise<{ texto: string; datos: unknown }> {
  const texto = await textoDeGemini(system, mensaje, {
    ...opciones,
    responseSchema: undefined,
    // Sin esquema pero con MIME de JSON: es el equivalente exacto de
    // generarJSONClaude (que tampoco manda formato).
    forzarJSON: true,
  });
  return { texto, datos: parsearJSON(texto) };
}

/**
 * Pide JSON ESTRUCTURADO: Gemini lo fuerza con `responseMimeType` +
 * `responseSchema` (decodificación restringida) y después se revalida con el
 * esquema Zod equivalente. Los dos esquemas describen el MISMO contrato; el que
 * manda es Zod.
 *
 * Si el modelo o la API rechazan el esquema (400), reintenta una vez sin él: el
 * system prompt de cada ruta ya describe el JSON esperado.
 */
export async function generarJSONEstructuradoGemini<T>(
  system: string,
  mensaje: string,
  esquemaZod: z.ZodType<T>,
  responseSchema: Schema,
  opciones: OpcionesGemini = {},
): Promise<{ texto: string; datos: T }> {
  let texto: string;
  try {
    texto = await textoDeGemini(system, mensaje, { ...opciones, responseSchema });
  } catch (e) {
    if (!esErrorDeEsquemaNoSoportado(e)) throw e;
    console.warn(
      "geminiIA: el modelo rechazó responseSchema; se reintenta sin esquema.",
    );
    texto = await textoDeGemini(system, mensaje, {
      ...opciones,
      responseSchema: undefined,
      forzarJSON: true,
    });
  }

  const crudo = parsearJSON(texto);
  const validado = esquemaZod.safeParse(crudo);
  if (!validado.success) {
    throw new ErrorJSONGemini("json_invalido", texto, validado.error.message);
  }
  return { texto, datos: validado.data };
}

/* ------------------- Proveedor de PRESENTACIONES + fallback ---------------- */

export type ProveedorPresentaciones = "gemini" | "claude";

/** Proveedor configurado para las presentaciones. Gemini por defecto. */
export function proveedorPresentaciones(): ProveedorPresentaciones {
  const v = (process.env.PROVEEDOR_PRESENTACIONES ?? "").trim().toLowerCase();
  return v === "claude" ? "claude" : "gemini";
}

/**
 * Orden en que se intentan los proveedores. Con Gemini configurado, Claude va
 * detrás como red de seguridad ante una cuota agotada. Con Claude configurado
 * a mano NO se cae a Gemini: es una elección explícita del operador.
 */
export function cadenaProveedores(): ProveedorPresentaciones[] {
  return proveedorPresentaciones() === "claude" ? ["claude"] : ["gemini", "claude"];
}

/**
 * Identidad del generador que entra en la clave de cache. Gemini lleva prefijo
 * de proveedor; Claude conserva el modelo "pelado" que ya usaban las entradas
 * guardadas, para no invalidar de golpe todo el cache existente. Como los
 * nombres de modelo de una y otra familia no colisionan, la clave sigue siendo
 * inequívoca: un deck generado por Gemini nunca se sirve como si fuera de
 * Claude ni al revés.
 */
export function generadorPresentaciones(p: ProveedorPresentaciones): string {
  return p === "gemini"
    ? `gemini:${modeloGemini("presentaciones")}`
    : modeloClaude("presentaciones");
}

/** Identidades de cache a consultar, en el mismo orden en que se intentarían
 *  los proveedores: así una caída de cuota de Gemini no obliga a re-pagar a
 *  Claude la misma presentación una y otra vez. */
export function generadoresPresentaciones(): string[] {
  return cadenaProveedores().map(generadorPresentaciones);
}

/** true si ALGÚN proveedor de la cadena tiene clave. Si es false, la ruta no
 *  tiene con qué generar y devuelve `sin_api_key` (503), como siempre. */
export function hayClavePresentaciones(): boolean {
  return cadenaProveedores().some((p) =>
    p === "gemini" ? tieneClaveGemini() : tieneClaveAnthropic(),
  );
}

/**
 * Genera el guion de una presentación con el proveedor configurado y, si este
 * falla por CUOTA (429), clave ausente o modelo no disponible, con el
 * siguiente de la cadena. Devuelve el texto crudo (las rutas lo parsean y lo
 * pasan por la validación tolerante, igual que antes) y quién lo generó.
 *
 * El timeout se aplica POR PROVEEDOR y se propaga como `Error("timeout")`, que
 * es lo que las rutas ya distinguen. Un timeout NO dispara el fallback: no es
 * un problema de cuota y el reintento de la propia ruta lo cubre.
 */
export async function generarTextoPresentacion(
  system: string,
  mensaje: string,
  responseSchema: Schema,
  opciones: { timeoutMs?: number } = {},
): Promise<{ texto: string; proveedor: ProveedorPresentaciones }> {
  const cadena = cadenaProveedores();

  for (let i = 0; i < cadena.length; i++) {
    const proveedor = cadena[i];
    const ultimo = i === cadena.length - 1;
    try {
      const texto = await conTimeout(
        proveedor === "gemini"
          ? textoPresentacionGemini(system, mensaje, responseSchema)
          : textoPresentacionClaude(system, mensaje),
        opciones.timeoutMs,
      );
      console.info(
        `Presentaciones: respuesta servida por ${proveedor} (${generadorPresentaciones(proveedor)}).`,
      );
      return { texto, proveedor };
    } catch (e) {
      if (ultimo || !justificaFallback(e)) throw e;
      console.warn(
        `Presentaciones: ${proveedor} no pudo responder (${descripcionError(e)}); se cae a ${cadena[i + 1]}.`,
      );
    }
  }

  // Inalcanzable: la cadena nunca está vacía y el último intento relanza.
  throw new Error("sin_proveedores");
}

async function textoPresentacionGemini(
  system: string,
  mensaje: string,
  responseSchema: Schema,
): Promise<string> {
  if (!tieneClaveGemini()) throw new ErrorSinClaveIA("GEMINI_API_KEY");
  const modelo = modeloGemini("presentaciones");
  try {
    return await generarTextoGemini(system, mensaje, 32000, {
      modelo,
      responseSchema,
    });
  } catch (e) {
    // El esquema de la presentación es una unión de 15 bloques (`anyOf`). Si el
    // modelo configurado no la admite, perder la generación por eso sería
    // absurdo: el system prompt ya describe el JSON pieza por pieza, y la
    // validación tolerante descarta lo que no encaje.
    if (!esErrorDeEsquemaNoSoportado(e)) throw e;
    console.warn(
      `geminiIA: ${modelo} rechazó responseSchema; se reintenta pidiendo JSON sin esquema.`,
    );
    return generarTextoGemini(system, mensaje, 32000, {
      modelo,
      forzarJSON: true,
    });
  }
}

async function textoPresentacionClaude(
  system: string,
  mensaje: string,
): Promise<string> {
  if (!tieneClaveAnthropic()) throw new ErrorSinClaveIA("ANTHROPIC_API_KEY");
  return generarTextoClaude(system, mensaje, 32000, {
    modelo: modeloClaude("presentaciones"),
  });
}

/* ------------------------------- internos ------------------------------- */

function parsearJSON(texto: string): unknown {
  if (!texto.trim()) throw new ErrorJSONGemini("respuesta_vacia", texto);
  try {
    return JSON.parse(extraerJSON(texto));
  } catch (e) {
    throw new ErrorJSONGemini(
      "json_invalido",
      texto,
      e instanceof Error ? e.message : String(e),
    );
  }
}

/** Llamada única a la API. Streaming para no chocar con los timeouts de HTTP. */
async function textoDeGemini(
  system: string,
  mensaje: string,
  opciones: OpcionesGemini,
): Promise<string> {
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const stream = await client.models.generateContentStream({
    model: opciones.modelo || MODELO_GEMINI,
    contents: mensaje,
    config: {
      systemInstruction: system,
      maxOutputTokens: opciones.maxTokens ?? 32000,
      ...(opciones.temperatura !== undefined
        ? { temperature: opciones.temperatura }
        : {}),
      ...(opciones.responseSchema
        ? {
            responseMimeType: "application/json",
            responseSchema: opciones.responseSchema,
          }
        : opciones.forzarJSON
          ? { responseMimeType: "application/json" }
          : {}),
    },
  });

  let texto = "";
  for await (const trozo of stream) texto += trozo.text ?? "";
  return texto;
}

function conTimeout<T>(p: Promise<T>, ms?: number): Promise<T> {
  if (!ms || ms <= 0) return p;
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function estado(e: unknown): number | undefined {
  const s = (e as { status?: unknown } | null)?.status;
  return typeof s === "number" ? s : undefined;
}

function descripcionError(e: unknown): string {
  if (e instanceof ErrorSinClaveIA) return "sin clave";
  const s = estado(e);
  const msg = e instanceof Error ? e.message : String(e);
  return s ? `${s}: ${msg.slice(0, 200)}` : msg.slice(0, 200);
}

/**
 * ¿Este fallo debe caer al siguiente proveedor? Solo los que NO se arreglan
 * reintentando con el mismo: cuota/límite de ratio (429), clave ausente, o el
 * modelo no disponible para la cuenta (403/404). Un 500 o un timeout se dejan
 * al reintento de la propia ruta.
 */
function justificaFallback(e: unknown): boolean {
  if (e instanceof ErrorSinClaveIA) return true;
  const s = estado(e);
  if (s === 429 || s === 403 || s === 404) return true;
  const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return (
    /\b429\b/.test(msg) ||
    msg.includes("resource_exhausted") ||
    msg.includes("resource exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("api key")
  );
}

/** 400 de la API por un responseSchema que no admite (p. ej. `anyOf` en un
 *  modelo antiguo). Se reintenta sin esquema en vez de perder la generación. */
function esErrorDeEsquemaNoSoportado(e: unknown): boolean {
  const s = estado(e);
  const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
  if (s !== 400 && !/\b400\b/.test(msg)) return false;
  return (
    msg.includes("schema") ||
    msg.includes("anyof") ||
    msg.includes("response_mime_type") ||
    msg.includes("responsemimetype")
  );
}
