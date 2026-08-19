// Route Handler (servidor) — genera con Claude (Anthropic) los EJERCICIOS de
// una hoja de trabajo (worksheet) para UNA unidad del programa oficial PN/MN,
// a partir del tema y los subtemas que envía el cliente.
//
// La API key vive SOLO aquí (servidor); nunca llega al navegador. El .docx NO se
// arma aquí: la ruta devuelve el contenido en JSON y el cliente lo maqueta con
// la librería `docx` (ver app/lib/worksheetDocx.ts). Así el servidor no manda
// binarios y el ZIP de varias unidades se arma en el navegador, igual que el de
// presentaciones.
//
// A DIFERENCIA de /api/examen, aquí NO hay generador determinista de respaldo:
// un worksheet sin ejercicios no sirve de nada, así que cuando la IA falla la
// ruta responde con un error explícito (no 200 con `null`) y el cliente muestra
// el mensaje en lugar de descargar una hoja vacía.

import {
  worksheetIASchema,
  tieneEjercicios,
  type WorksheetIA,
} from "../../lib/esquemaWorksheet";
import {
  modeloClaude,
  tieneClaveAnthropic,
  generarJSONEstructuradoClaude,
  ErrorJSONClaude,
} from "../../lib/claudeIA";
import { verificarAuth } from "../../lib/server/auth";
import { verificarLimite, contarUso } from "../../lib/server/limites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Modelo de worksheets. Configurable sin tocar código y sin afectar al resto de
// tareas (ANTHROPIC_MODEL_WORKSHEETS); si no está, usa ANTHROPIC_MODEL.
const MODELO = modeloClaude("worksheets");
const TIMEOUT_MS = 90000;
// Techo de salida generoso: en Claude el razonamiento también consume max_tokens.
const MAX_TOKENS = 16000;

type Carrera = "PN" | "MN";

type Cuerpo = {
  carrera?: Carrera;
  materia?: string;
  semestre?: string;
  unidadNumero?: number;
  unidadTema?: string;
  /** Subtemas EXACTOS de la unidad, tomados del programa oficial. */
  subtemas?: string[];
  /** Cuántos reactivos pedir en total (el prompt los reparte). */
  cantidad?: number;
};

const LICENCIATURA: Record<Carrera, string> = {
  PN: "Licenciatura en Piloto Naval",
  MN: "Licenciatura en Maquinista Naval",
};

export async function POST(request: Request) {
  const sesionAuth = await verificarAuth(request);
  if (!sesionAuth.ok) return sesionAuth.respuesta;

  const limite = await verificarLimite(sesionAuth.sesion, "worksheets");
  if (!limite.ok) return limite.respuesta;

  let cuerpo: Cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return error("json_invalido", "No se pudo leer la solicitud.", 400);
  }

  const carrera: Carrera = cuerpo.carrera === "MN" ? "MN" : "PN";
  const materia = (cuerpo.materia ?? "").toString().trim();
  const semestre = (cuerpo.semestre ?? "").toString().trim();
  const unidadTema = (cuerpo.unidadTema ?? "").toString().trim();
  const unidadNumero =
    typeof cuerpo.unidadNumero === "number" && cuerpo.unidadNumero > 0
      ? cuerpo.unidadNumero
      : 1;
  const subtemas = Array.isArray(cuerpo.subtemas)
    ? cuerpo.subtemas
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter((t) => t.length > 0)
    : [];
  // 12 reactivos ≈ una sesión de práctica; se acota para no reventar max_tokens.
  const cantidad =
    typeof cuerpo.cantidad === "number" &&
    cuerpo.cantidad >= 4 &&
    cuerpo.cantidad <= 30
      ? Math.round(cuerpo.cantidad)
      : 12;

  if (!materia || !unidadTema) {
    return error(
      "sin_tema",
      "Falta la materia o el tema de la unidad.",
      400,
    );
  }

  if (!tieneClaveAnthropic()) {
    return error(
      "sin_api_key",
      "La generación con IA no está configurada en el servidor.",
      503,
    );
  }

  const system = systemPrompt(carrera);
  const mensaje = mensajeUsuario({
    carrera,
    materia,
    semestre,
    unidadNumero,
    unidadTema,
    subtemas,
    cantidad,
  });

  // Hasta 2 intentos: timeout + reintento. El JSON lo fuerza Claude con el
  // esquema (structured outputs) y se revalida con el MISMO esquema Zod.
  let worksheet: WorksheetIA | null = null;
  let motivo = "fallo_ia";
  for (let intento = 1; intento <= 2 && !worksheet; intento++) {
    try {
      const { datos } = await conTimeout(
        generarJSONEstructuradoClaude(system, mensaje, worksheetIASchema, {
          modelo: MODELO,
          maxTokens: MAX_TOKENS,
          esfuerzo: "medium",
        }),
        TIMEOUT_MS,
      );
      if (!tieneEjercicios(datos)) {
        motivo = "sin_ejercicios";
        continue;
      }
      worksheet = datos;
    } catch (e) {
      if (e instanceof ErrorJSONClaude) {
        motivo = e.motivo; // "respuesta_vacia" | "json_invalido"
      } else {
        motivo =
          e instanceof Error && e.message === "timeout" ? "timeout" : "fallo_ia";
      }
      console.error(`worksheet intento ${intento}:`, e);
    }
  }

  if (!worksheet) {
    return error(
      motivo,
      motivo === "timeout"
        ? "La generación tardó demasiado. Intenta de nuevo."
        : "No se pudo generar la hoja de trabajo en este momento. Intenta de nuevo.",
      502,
    );
  }

  await contarUso(sesionAuth.sesion, "worksheets");
  return Response.json({ worksheet, modelo: MODELO });
}

/* -------------------------------- internos -------------------------------- */

function error(codigo: string, mensaje: string, status: number): Response {
  return Response.json({ error: codigo, mensaje }, { status });
}

function systemPrompt(carrera: Carrera): string {
  return [
    `Eres docente de la Escuela Náutica Mercante de Tampico (FIDENA) y preparas material de práctica para cadetes de la ${LICENCIATURA[carrera]}.`,
    "",
    "Tu tarea es redactar una HOJA DE TRABAJO (worksheet) impresa sobre UNA unidad del programa oficial, para que el cadete la resuelva a mano en clase o de tarea.",
    "",
    "Reglas:",
    "- Escribe TODO en español de México, con el registro técnico propio de la marina mercante.",
    "- Los reactivos deben evaluar la unidad indicada y NADA más: no metas contenido de otras unidades.",
    "- Usa la terminología náutica correcta (babor/estribor, proa/popa, arqueo, calado, guardia, etc.) cuando el tema lo pida.",
    "- Cuando el tema sea cuantitativo, incluye problemas con datos numéricos concretos y unidades del SI (o las náuticas de uso: nudos, millas náuticas, brazas).",
    "- En 'completar', marca SIEMPRE el hueco con exactamente cinco guiones bajos: _____",
    "- En 'opcionMultiple', las opciones incorrectas deben ser plausibles, no absurdas.",
    "- 'lineasRespuesta' es el espacio en renglones que necesita el cadete: 2–4 para una definición, 6–12 para un problema con desarrollo.",
    "- 'respuestaModelo' es para el docente: la solución o el criterio de evaluación, en 1–3 frases.",
    "- No uses Markdown, ni asteriscos, ni numeración manual: el documento se numera solo.",
    "",
    "Devuelve SOLO el objeto JSON del esquema, sin texto adicional.",
  ].join("\n");
}

function mensajeUsuario(p: {
  carrera: Carrera;
  materia: string;
  semestre: string;
  unidadNumero: number;
  unidadTema: string;
  subtemas: string[];
  cantidad: number;
}): string {
  const lineas = [
    `Materia: ${p.materia}`,
    `Carrera: ${LICENCIATURA[p.carrera]}`,
  ];
  if (p.semestre) lineas.push(`Semestre: ${p.semestre}`);
  lineas.push(`Unidad ${p.unidadNumero}: ${p.unidadTema}`);

  if (p.subtemas.length > 0) {
    lineas.push("", "Subtemas oficiales de la unidad:");
    for (const s of p.subtemas) lineas.push(`- ${s}`);
  }

  lineas.push(
    "",
    `Genera la hoja de trabajo con ${p.cantidad} reactivos en total, repartidos así:`,
    `- opcionMultiple: ~${Math.max(2, Math.round(p.cantidad * 0.34))}`,
    `- completar: ~${Math.max(2, Math.round(p.cantidad * 0.25))}`,
    `- relacionarColumnas: ~${Math.max(3, Math.round(p.cantidad * 0.25))}`,
    `- problemas: ~${Math.max(2, Math.round(p.cantidad * 0.16))}`,
    "",
    "Incluye además 4–8 'conceptosClave' (términos que el cadete debe repasar antes de resolver).",
  );

  return lineas.join("\n");
}

function conTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
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
