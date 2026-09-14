// Route Handler (servidor) — genera con Claude (Anthropic) las PREGUNTAS REALES
// de un examen (parcial u ordinario), por tema, a partir del índice académico que
// envía el cliente: para PN/MN son los subtemas del programa oficial; para
// Inglés, la secuencia semanal espejada de las históricas. Sirve a los tres
// ámbitos (PN, MN, INGLES) con una sola ruta.
//
// Devuelve los MISMOS 4 bloques de preguntas que el motor determinista
// (opcionMultiple, verdaderoFalso, relacionarColumnas, preguntasAbiertas), ya
// formateados como strings, para que la plantilla Word institucional
// (examen-parcial.docx / examen-ordinario.docx) NO cambie.
//
// TOLERANTE A FALLOS: si falta la key, la IA falla, hay timeout o el JSON es
// inválido tras un reintento, devuelve `preguntas: null` con HTTP 200 y un
// `motivo`. El cliente cae entonces al banco determinista, de modo que el examen
// NUNCA se descarga en blanco.
//
// La API key vive SOLO aquí (servidor); nunca llega al navegador.

import {
  examenIASchema,
  formatearPreguntasIA,
  tienePreguntas,
} from "../../lib/esquemaExamen";
import type { PreguntasExamen } from "../../lib/examen";
import { resolverPuntaje } from "../../lib/puntajeExamen";
import { claveCache, leerCache, escribirCache } from "../../lib/cacheExamen";
import {
  modeloClaude,
  tieneClaveAnthropic,
  generarJSONEstructuradoClaude,
  ErrorJSONClaude,
} from "../../lib/claudeIA";
import {
  PLANEACIONES_INGLES_ALMACENADAS,
  tienePlaneacionAlmacenada,
  type PlaneacionInglesAlmacenada,
} from "../../data/inglesMaritimo";
import { verificarAuth } from "../../lib/server/auth";
import { verificarLimite, contarUso } from "../../lib/server/limites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Modelo de exámenes. Configurable sin tocar código y sin afectar al resto de
// tareas (ANTHROPIC_MODEL_EXAMENES); si no está, usa ANTHROPIC_MODEL.
const MODELO = modeloClaude("examenes");
const TIMEOUT_MS = 90000;
// Techo de salida generoso: en Claude el razonamiento también consume max_tokens.
const MAX_TOKENS = 16000;

type Ambito = "PN" | "MN" | "INGLES";

type Cuerpo = {
  ambito?: Ambito;
  materia?: string;
  tipo?: string;
  /** Temas EXACTOS a evaluar (ya acotados al rango del examen por el cliente). */
  temas?: string[];
  /** Valor total del examen en puntos (lo calcula el cliente según el esquema). */
  total?: number;
  /** Solo Inglés: nivel del que sale el LIBRO del examen. Opcional — si el
   *  cliente no lo manda, se deduce de `materia` ("Inglés Nivel N"). */
  nivel?: string | number;
  /** Solo Inglés: habilidad del examen (Gram/Vocab, Listening, …). */
  habilidad?: string;
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

- El campo "introduccion" va SIEMPRE como cadena vacía.

SALIDA: responde SOLO con el objeto JSON del esquema, sin markdown ni texto adicional.`;

// Reglas comunes a los dos moldes de Inglés. Se extrajeron TAL CUAL del prompt
// original: el molde de iDiscover se compone abajo y sigue produciendo el MISMO
// texto que antes, byte a byte, para no alterar los exámenes de los niveles 4-8.
const REGLAS_COMUNES_INGLES = `RULES:
- Every item is based STRICTLY on the topics provided. Do not invent topics beyond that list.
- Spread the questions across the different topics; don't focus on just one.
- The exam evaluates ENGLISH, so write the items (questions, options, statements, prompts) IN ENGLISH, at a level consistent with the topics (vocabulary, grammar, communication).
- Multiple choice: exactly one correct option and 3 plausible distractors (not absurd). Mark the correct one with its index (0=A, 1=B, 2=C, 3=D).
- True/False: unambiguous statements; alternate true and false.
- Matching columns: concept ↔ meaning/use pairs from the same field.
- Open questions: require producing or using English (explain, describe, respond), not rote definitions.
- "introduccion": text printed BEFORE the items (reading passage, listening script or exam instructions) ONLY when the SKILL block asks for it; otherwise an empty string.

TARGET COUNTS: up to 10 multiple choice, 8 true/false, 6 matching pairs, 5 open questions. Fewer if there are few topics, but each item must map to a real topic from the list.

OUTPUT: reply ONLY with the JSON object of the schema, no markdown, no extra text.`;

// Molde de los niveles que siguen con iDiscover (Express Publishing): hoy 4-8.
// Idéntico al de siempre.
const SYSTEM_PROMPT_INGLES = `You write real, institutional English-exam items for cadets at a Mexican merchant-marine academy (iDiscover / communicative approach). Do NOT use STCW or Piloto Naval / Máquinas Navales content.

${REGLAS_COMUNES_INGLES}`;

// Molde de los niveles ALMACENADOS (1, 2 y 3 — StartUp, Pearson). D3 de
// DEUDA-TECNICA-INGLES.md: el libro sale del NIVEL, no de una constante. Mismo
// precedente que /api/presentacion-ingles: la mención a iDiscover se sustituye
// por una PROHIBICIÓN explícita, porque nombrarlo sería el libro equivocado en
// un examen oficial.
function systemPromptInglesAlmacenado(e: PlaneacionInglesAlmacenada): string {
  return `You write real, institutional English-exam items for cadets at a Mexican merchant-marine academy. The course book for this level is ${e.libro} (Pearson) and the approach is: ${e.enfoque}. Do NOT use STCW or Piloto Naval / Máquinas Navales content. FORBIDDEN: do not mention, imitate or draw content from iDiscover or Express Publishing — this level changed course books and that reference would be incorrect.

${REGLAS_COMUNES_INGLES}`;
}

/** Nivel de Inglés del examen. Prioriza el campo explícito del cuerpo; si no
 *  viene (el cliente actual no lo manda), lo deduce de `materia`, que la UI
 *  construye siempre como "Inglés Nivel N". */
function nivelIngles(cuerpo: Cuerpo, materia: string): string {
  const explicito = (cuerpo.nivel ?? "").toString().trim();
  if (explicito) return explicito;
  const m = materia.match(/nivel\s*0*(\d+)/i);
  return m ? m[1] : "";
}

/** System prompt del ámbito. En Inglés, el LIBRO sale del nivel. */
function systemPrompt(ambito: Ambito, nivel: string): string {
  if (ambito !== "INGLES") return SYSTEM_PROMPT_ES;
  if (tienePlaneacionAlmacenada(nivel)) {
    return systemPromptInglesAlmacenado(PLANEACIONES_INGLES_ALMACENADAS[nivel]);
  }
  return SYSTEM_PROMPT_INGLES;
}

type HabilidadIngles =
  | "Gram/Vocab"
  | "Listening"
  | "Speaking"
  | "Reading"
  | "Writing";

const HABILIDADES: HabilidadIngles[] = [
  "Gram/Vocab",
  "Listening",
  "Speaking",
  "Reading",
  "Writing",
];

function normalizarHabilidad(v: unknown): HabilidadIngles | undefined {
  const s = (v ?? "").toString().trim();
  return HABILIDADES.find((h) => h.toLowerCase() === s.toLowerCase());
}

// Cómo se adapta cada habilidad a las 4 secciones fijas de la plantilla Word
// (opción múltiple · V/F · relacionar · abiertas). La plantilla no cambia.
const INSTRUCCIONES_HABILIDAD: Record<HabilidadIngles, string> = {
  "Gram/Vocab": `SKILL: GRAMMAR & VOCABULARY. Items test the grammar structures and vocabulary of the topics. "introduccion" must be an empty string.`,
  Reading: `SKILL: READING. Write in "introduccion" an ORIGINAL reading passage (150-220 words, level-appropriate, with a title, related to the topics; daily-life or nautical context). EVERY item (multiple choice, true/false, matching, open questions) must be answerable ONLY by reading that passage: main idea, details, inference, vocabulary in context, reference words.`,
  Listening: `SKILL: LISTENING. Write in "introduccion" a listening script headed "LISTENING SCRIPT (teacher reads aloud twice - do not print for students)": an ORIGINAL dialogue or monologue of 120-180 words, level-appropriate, related to the topics. EVERY item must be answerable only by listening to that script (gist, specific details, numbers, names, speaker attitude). Do NOT quote long parts of the script inside the items.`,
  Speaking: `SKILL: SPEAKING. "introduccion" = short instructions for the oral exam (individual interview, time per cadet, assessed: fluency, pronunciation, grammar, vocabulary, interaction). Multiple choice: choose the most appropriate spoken response in a short conversation. True/False: whether a given spoken response is appropriate/correct for the situation. Matching: question or situation <-> appropriate spoken reply/expression. Open questions: SPEAKING PROMPTS the cadet answers orally (describe, role-play, give an opinion, narrate); the teacher marks them with the points shown.`,
  Writing: `SKILL: WRITING. "introduccion" = short instructions for the writing exam (assessed: task completion, organization, grammar, vocabulary, spelling/punctuation). Multiple choice: choose the correct sentence, connector, punctuation or word order. True/False: whether a written sentence is correct/appropriate for the task. Matching: linking word or expression <-> its function or the sentence it completes. Open questions: WRITING TASKS with a required length in words (40-60 words for basic levels, 80-120 for higher) and a clear purpose (email, message, description, short paragraph).`,
};

function construirMensajeUsuario(
  ambito: Ambito,
  materia: string,
  tipo: string,
  temas: string[],
  habilidad?: HabilidadIngles,
): string {
  const lista = temas.map((t, i) => `${i + 1}. ${t}`).join("\n");
  if (ambito === "INGLES") {
    const bloqueHabilidad = habilidad
      ? `\n${INSTRUCCIONES_HABILIDAD[habilidad]}\n`
      : "";
    return `Generate the questions for "${tipo}" of the subject "${materia}".
${bloqueHabilidad}
Topics to assess (base every item on these, in English):
${lista}

Return the JSON with real items covering these topics.`;
  }
  return `Genera las preguntas para el "${tipo}" de la asignatura "${materia}".

Temas a evaluar (basa cada reactivo en estos):
${lista}

Devuelve el JSON con reactivos reales que cubran estos temas.`;
}

export async function POST(request: Request) {
  const sesionAuth = await verificarAuth(request);
  if (!sesionAuth.ok) return sesionAuth.respuesta;

  const limite = await verificarLimite(sesionAuth.sesion, "examenes");
  if (!limite.ok) return limite.respuesta;

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

  const habilidad =
    ambito === "INGLES" ? normalizarHabilidad(cuerpo.habilidad) : undefined;
  // La clave de caché distingue habilidad aunque `tipo` no la traiga.
  const tipoCache = habilidad ? `${tipo} · ${habilidad}` : tipo;

  // Sin temas o sin materia no hay nada que generar → fallback determinista.
  if (!materia || temas.length === 0) {
    return respuesta(null, { motivo: "sin_temas" });
  }

  // Cache: mismo alcance (mismos temas) + mismo total = mismo examen. `materia`
  // ya incluye el nivel de Inglés ("Inglés Nivel N"), así que dos niveles con
  // libros distintos nunca comparten entrada.
  const clave = claveCache({ modelo: MODELO, ambito, materia, tipo: tipoCache, temas, total });
  if (!cuerpo.forzar) {
    const cacheado = await leerCache(clave);
    if (cacheado) {
      await contarUso(sesionAuth.sesion, "examenes");
      return respuesta(cacheado, { cacheado: true });
    }
  }

  if (!tieneClaveAnthropic()) {
    return respuesta(null, { motivo: "sin_api_key" });
  }

  const system = systemPrompt(ambito, nivelIngles(cuerpo, materia));
  const mensaje = construirMensajeUsuario(ambito, materia, tipo, temas, habilidad);

  // Hasta 2 intentos: timeout + reintento. El JSON lo fuerza Claude con el
  // esquema (structured outputs) y se revalida con el MISMO esquema Zod.
  let preguntas: PreguntasExamen | null = null;
  let motivo = "fallo_ia";
  for (let intento = 1; intento <= 2 && !preguntas; intento++) {
    try {
      const { datos } = await conTimeout(
        generarJSONEstructuradoClaude(system, mensaje, examenIASchema, {
          modelo: MODELO,
          maxTokens: MAX_TOKENS,
          esfuerzo: "medium",
        }),
        TIMEOUT_MS,
      );
      if (!tienePreguntas(datos)) {
        motivo = "sin_preguntas";
        continue;
      }
      // Aplica el puntaje por sección (baked-in). El reparto se resuelve por
      // ámbito+tipo (Inglés usa su esquema por habilidades; PN/MN 40/20/20/20).
      // Si fuera inválido (p. ej. IA devolvió una sección vacía), lanza → se
      // reintenta/cae a fallback determinista, que sí completa las 4 secciones.
      const puntaje = resolverPuntaje({ total, ambito, tipo });
      preguntas = formatearPreguntasIA(datos, puntaje);
    } catch (e) {
      if (e instanceof ErrorJSONClaude) {
        // "respuesta_vacia" | "json_invalido" — mismos motivos que antes.
        motivo = e.motivo;
      } else {
        motivo =
          e instanceof Error && e.message === "timeout" ? "timeout" : "fallo_ia";
      }
      console.error(`examen intento ${intento}:`, e);
    }
  }

  if (!preguntas) {
    // Fallback: el cliente generará el examen con el banco determinista.
    return respuesta(null, { motivo });
  }

  await escribirCache(clave, preguntas);
  await contarUso(sesionAuth.sesion, "examenes");
  return respuesta(preguntas, { cacheado: false, modelo: MODELO });
}
