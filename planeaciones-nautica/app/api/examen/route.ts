// Route Handler (servidor) — genera con Gemini 2.5 Flash las PREGUNTAS REALES de
// un examen (parcial u ordinario), por tema, a partir del índice académico que
// envía el cliente: para PN/MN son los subtemas del programa oficial; para
// Inglés, la secuencia semanal espejada de las históricas. Sirve a los tres
// ámbitos (PN, MN, INGLES) con una sola ruta.
//
// Devuelve los MISMOS 4 bloques de preguntas que el motor determinista
// (opcionMultiple, verdaderoFalso, relacionarColumnas, preguntasAbiertas), ya
// formateados como strings, para que la plantilla Word institucional
// (examen-parcial.docx / examen-ordinario.docx) NO cambie.
//
// TOLERANTE A FALLOS: si falta la key, Gemini falla, hay timeout o el JSON es
// inválido tras un reintento, devuelve `preguntas: null` con HTTP 200 y un
// `motivo`. El cliente cae entonces al banco determinista, de modo que el examen
// NUNCA se descarga en blanco.
//
// La API key vive SOLO aquí (servidor); nunca llega al navegador.

import { GoogleGenAI } from "@google/genai";
import {
  examenIASchema,
  responseSchemaExamen,
  formatearPreguntasIA,
  tienePreguntas,
} from "../../lib/esquemaExamen";
import type { PreguntasExamen } from "../../lib/examen";
import { resolverPuntaje } from "../../lib/puntajeExamen";
import { claveCache, leerCache, escribirCache } from "../../lib/cacheExamen";
import { verificarAuth } from "../../lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Mismo modelo que las planeaciones. Configurable sin tocar código; por defecto
// Gemini 2.5 Flash (funciona en el plan gratuito actual de la key).
const MODELO =
  process.env.GEMINI_MODEL_EXAMENES ||
  process.env.GEMINI_MODEL ||
  "gemini-2.5-flash";
const TIMEOUT_MS = 90000;

type Ambito = "PN" | "MN" | "INGLES";

type Cuerpo = {
  ambito?: Ambito;
  materia?: string;
  tipo?: string;
  /** Temas EXACTOS a evaluar (ya acotados al rango del examen por el cliente). */
  temas?: string[];
  /** Valor total del examen en puntos (lo calcula el cliente según el esquema). */
  total?: number;
  forzar?: boolean;
};

function respuesta(
  preguntas: PreguntasExamen | null,
  extra: Record<string, unknown> = {},
) {
  return Response.json({ preguntas, ...extra });
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

// Aísla el objeto JSON: quita ```json ... ``` y texto sobrante, quedándose con
// el primer "{" hasta el último "}".
function extraerJSON(texto: string): string {
  let t = texto.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const ini = t.indexOf("{");
  const fin = t.lastIndexOf("}");
  if (ini !== -1 && fin !== -1 && fin > ini) t = t.slice(ini, fin + 1);
  return t;
}

const SYSTEM_PROMPT_ES = `Eres un docente de una escuela náutica mercante mexicana que elabora exámenes institucionales. Redactas REACTIVOS REALES por tema, evaluables, claros y de dificultad apropiada para cadetes de nivel superior.

REGLAS:
- Cada reactivo se basa ESTRICTAMENTE en los temas que se te entregan. No inventes temas fuera de esa lista ni evalúes contenidos ajenos a la materia.
- Cubre los temas de forma balanceada: reparte las preguntas entre los distintos temas de la lista, no te concentres en uno solo.
- Opción múltiple: 1 sola opción correcta y 3 distractores plausibles (que un estudiante desprevenido podría elegir), no absurdos. Marca la correcta con su índice (0=A, 1=B, 2=C, 3=D).
- Verdadero/Falso: afirmaciones inequívocas (ni tramposas ni triviales); alterna verdaderas y falsas.
- Relacionar columnas: pares concepto ↔ definición/aplicación, todos del mismo campo para que exija comprensión.
- Preguntas abiertas: exigen explicar, aplicar o analizar (no memorizar una definición).
- Redacción en ESPAÑOL, terminología náutica/técnica correcta.

CANTIDAD OBJETIVO: hasta 10 de opción múltiple, 8 de verdadero/falso, 6 pares para relacionar y 5 preguntas abiertas. Si hay pocos temas, genera menos, pero cada reactivo debe corresponder a un tema real de la lista.

SALIDA: responde SOLO con el objeto JSON del esquema, sin markdown ni texto adicional.`;

const SYSTEM_PROMPT_INGLES = `You write real, institutional English-exam items for cadets at a Mexican merchant-marine academy (iDiscover / communicative approach). Do NOT use STCW or Piloto Naval / Máquinas Navales content.

RULES:
- Every item is based STRICTLY on the topics provided. Do not invent topics beyond that list.
- Spread the questions across the different topics; don't focus on just one.
- The exam evaluates ENGLISH, so write the items (questions, options, statements, prompts) IN ENGLISH, at a level consistent with the topics (vocabulary, grammar, communication).
- Multiple choice: exactly one correct option and 3 plausible distractors (not absurd). Mark the correct one with its index (0=A, 1=B, 2=C, 3=D).
- True/False: unambiguous statements; alternate true and false.
- Matching columns: concept ↔ meaning/use pairs from the same field.
- Open questions: require producing or using English (explain, describe, respond), not rote definitions.

TARGET COUNTS: up to 10 multiple choice, 8 true/false, 6 matching pairs, 5 open questions. Fewer if there are few topics, but each item must map to a real topic from the list.

OUTPUT: reply ONLY with the JSON object of the schema, no markdown, no extra text.`;

function construirMensajeUsuario(
  ambito: Ambito,
  materia: string,
  tipo: string,
  temas: string[],
): string {
  const lista = temas.map((t, i) => `${i + 1}. ${t}`).join("\n");
  if (ambito === "INGLES") {
    return `Generate the questions for "${tipo}" of the subject "${materia}".

Topics to assess (base every item on these, in English):
${lista}

Return the JSON with real items covering these topics.`;
  }
  return `Genera las preguntas para el "${tipo}" de la asignatura "${materia}".

Temas a evaluar (basa cada reactivo en estos):
${lista}

Devuelve el JSON con reactivos reales que cubran estos temas.`;
}

async function generarTexto(
  client: GoogleGenAI,
  system: string,
  mensaje: string,
): Promise<string> {
  const resp = await client.models.generateContent({
    model: MODELO,
    contents: mensaje,
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      responseSchema: responseSchemaExamen as never,
      temperature: 0.4,
      maxOutputTokens: 8000,
    },
  });
  return resp.text ?? "";
}

export async function POST(request: Request) {
  const sesionAuth = await verificarAuth(request);
  if (!sesionAuth.ok) return sesionAuth.respuesta;

  let cuerpo: Cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return respuesta(null, { motivo: "json_invalido" });
  }

  const ambito: Ambito =
    cuerpo.ambito === "MN" || cuerpo.ambito === "INGLES" ? cuerpo.ambito : "PN";
  const materia = (cuerpo.materia ?? "").toString().trim();
  const tipo = (cuerpo.tipo ?? "Examen").toString().trim();
  const temas = Array.isArray(cuerpo.temas)
    ? cuerpo.temas
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter((t) => t.length > 0)
    : [];
  const total =
    typeof cuerpo.total === "number" && cuerpo.total > 0
      ? cuerpo.total
      : undefined;

  // Sin temas o sin materia no hay nada que generar → fallback determinista.
  if (!materia || temas.length === 0) {
    return respuesta(null, { motivo: "sin_temas" });
  }

  // Cache: mismo alcance (mismos temas) + mismo total = mismo examen.
  const clave = claveCache({ modelo: MODELO, ambito, materia, tipo, temas, total });
  if (!cuerpo.forzar) {
    const cacheado = await leerCache(clave);
    if (cacheado) {
      return respuesta(cacheado, { cacheado: true });
    }
  }

  if (!process.env.GEMINI_API_KEY) {
    return respuesta(null, { motivo: "sin_api_key" });
  }

  const system = ambito === "INGLES" ? SYSTEM_PROMPT_INGLES : SYSTEM_PROMPT_ES;
  const mensaje = construirMensajeUsuario(ambito, materia, tipo, temas);
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Hasta 2 intentos: timeout + reintento. Validación estricta con Zod.
  let preguntas: PreguntasExamen | null = null;
  let motivo = "fallo_ia";
  for (let intento = 1; intento <= 2 && !preguntas; intento++) {
    try {
      const texto = await conTimeout(
        generarTexto(client, system, mensaje),
        TIMEOUT_MS,
      );
      if (!texto.trim()) {
        motivo = "respuesta_vacia";
        continue;
      }
      let datos: unknown;
      try {
        datos = JSON.parse(extraerJSON(texto));
      } catch {
        motivo = "json_invalido";
        continue;
      }
      const parsed = examenIASchema.safeParse(datos);
      if (!parsed.success) {
        motivo = "json_invalido";
        continue;
      }
      if (!tienePreguntas(parsed.data)) {
        motivo = "sin_preguntas";
        continue;
      }
      // Aplica el puntaje por sección (baked-in). El reparto se resuelve por
      // ámbito+tipo (Inglés usa su esquema por habilidades; PN/MN 40/20/20/20).
      // Si fuera inválido (p. ej. IA devolvió una sección vacía), lanza → se
      // reintenta/cae a fallback determinista, que sí completa las 4 secciones.
      const puntaje = resolverPuntaje({ total, ambito, tipo });
      preguntas = formatearPreguntasIA(parsed.data, puntaje);
    } catch (e) {
      motivo =
        e instanceof Error && e.message === "timeout" ? "timeout" : "fallo_ia";
      console.error(`examen intento ${intento}:`, e);
    }
  }

  if (!preguntas) {
    // Fallback: el cliente generará el examen con el banco determinista.
    return respuesta(null, { motivo });
  }

  await escribirCache(clave, preguntas);
  return respuesta(preguntas, { cacheado: false, modelo: MODELO });
}
