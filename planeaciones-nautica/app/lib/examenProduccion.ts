// Exámenes de PRODUCCIÓN de Inglés: Speaking y Writing.
//
// A diferencia de Gram/Vocab, Listening y Reading, estos dos NO llevan
// reactivos (opción múltiple, V/F, relacionar): son una tarea de desempeño
// calificada con rúbrica que suma el total de la habilidad (17 en parcial,
// 20 en ordinario).
//
//  - Speaking: entrevista oral individual de 3 minutos máximo (3 partes).
//  - Writing: UN párrafo, con la extensión y estructura que el plan de
//    estudios pide al cierre del Semestre I para el nivel.
//
// Módulo compartido cliente/servidor: sin dependencias de Node ni de Zod.

export type HabilidadProduccion = "Speaking" | "Writing";

export function esHabilidadProduccion(h: unknown): h is HabilidadProduccion {
  return h === "Speaking" || h === "Writing";
}

/* ============================ Meta de Writing ============================ */

export type MetaWriting = {
  cefr: string;
  minPalabras: number;
  maxPalabras: number;
  /** Estructura del párrafo que se exige (en inglés, se imprime). */
  estructura: string;
  /** Conectores esperados (en inglés, se imprimen). */
  conectores: string;
  /** Estructuras gramaticales esperadas (solo para el prompt de la IA). */
  gramatica: string;
};

// Estándar de escritura al cierre del Semestre I (StartUp 1-3, Pearson) según
// la dosificación de app/data/inglesMaritimo.ts: N1 = A1 (párrafo descriptivo
// sobre la familia, rutinas, lugares), N2 = A2 (autodescripción, rutina,
// correo para coordinar, carta de presentación), N3 = A2+ (recomendaciones,
// experiencias, estructura problema-solución). Niveles 4-8 y MN1 = B1.
const META_WRITING: Record<string, MetaWriting> = {
  "1": {
    cefr: "A1",
    minPalabras: 50,
    maxPalabras: 70,
    estructura:
      "a topic sentence and 4-5 simple sentences with details about the topic",
    conectores: "and, but, because",
    gramatica:
      "present simple, verb be, have, can/can't, there is/there are, possessive adjectives and 's, present continuous",
  },
  "2": {
    cefr: "A2",
    minPalabras: 70,
    maxPalabras: 90,
    estructura:
      "a topic sentence, supporting sentences with details and examples, and a concluding sentence",
    conectores: "and, but, because, so, or, first, then, after that",
    gramatica:
      "present simple vs. present continuous, can/can't for ability, comparatives, possessive pronouns, future plans (be going to / present continuous), time expressions, simple past",
  },
  "3": {
    cefr: "A2+",
    minPalabras: 90,
    maxPalabras: 110,
    estructura:
      "a topic sentence, two or three supporting ideas with examples, and a concluding sentence",
    conectores: "also, however, so, that's why, for example, finally",
    gramatica:
      "simple past vs. past continuous, present perfect, should/have to for advice and obligation, quantifiers, varied sentence structure",
  },
};

const META_WRITING_B1: MetaWriting = {
  cefr: "B1",
  minPalabras: 100,
  maxPalabras: 130,
  estructura:
    "a clear topic sentence, well-developed supporting ideas with examples, and a concluding sentence",
  conectores: "however, although, in addition, for example, as a result, finally",
  gramatica:
    "a range of present, past and future forms, modals, comparatives and complex sentences",
};

export function metaWriting(nivel: string): MetaWriting {
  return META_WRITING[(nivel ?? "").trim()] ?? META_WRITING_B1;
}

/* ======================= Contenido que genera la IA ======================= */

export type ExamenSpeaking = {
  /** Parte 1: preguntas personales cortas (el docente elige 3). */
  parte1: string[];
  /** Parte 2: tarjetas de turno largo (una por cadete). */
  parte2: { tema: string; indicaciones: string[] }[];
  /** Parte 3: preguntas de seguimiento (el docente elige 2). */
  parte3: string[];
};

export type ExamenWriting = {
  titulo: string;
  situacion: string;
  puntos: string[];
};

/* ============================== Formateo ============================== */

const LETRAS = ["A", "B", "C", "D", "E"];

export function textoSpeaking(d: ExamenSpeaking, total: number): string {
  const p1 = d.parte1.slice(0, 6);
  const p2 = d.parte2.slice(0, 3);
  const p3 = d.parte3.slice(0, 4);
  return [
    `ORAL INTERVIEW — individual · 3 minutes MAXIMUM per cadet · ${total} points (rubric below).`,
    `The teacher asks the questions; the cadet answers in English. Stop the interview at 3:00.`,
    ``,
    `PART 1 · About you (about 45 seconds) — ask 3 of these questions:`,
    ...p1.map((q, i) => `   ${i + 1}. ${q}`),
    ``,
    `PART 2 · Talk about it (about 1 minute 15 seconds) — give the cadet ONE card; he/she speaks without interruption:`,
    ...p2.flatMap((c, i) => [
      `   Card ${LETRAS[i]}: ${c.tema}`,
      ...c.indicaciones.slice(0, 4).map((x) => `      • ${x}`),
    ]),
    ``,
    `PART 3 · Follow-up (about 1 minute) — ask 2 of these questions:`,
    ...p3.map((q, i) => `   ${i + 1}. ${q}`),
    ``,
    `Card used:  A   B   C          Time: ____ min ____ s`,
  ].join("\n");
}

export function textoWriting(
  d: ExamenWriting,
  nivel: string,
  total: number,
): string {
  const m = metaWriting(nivel);
  return [
    `WRITING TASK — write ONE paragraph in English (${m.minPalabras}-${m.maxPalabras} words) · ${total} points (rubric below).`,
    ``,
    `Topic: ${d.titulo}`,
    d.situacion,
    ``,
    `In your paragraph, include:`,
    ...d.puntos.slice(0, 5).map((x) => `   • ${x}`),
    ``,
    `Your paragraph must have ${m.estructura}. Use connectors (${m.conectores}). Check capital letters, punctuation and spelling. Answers in Spanish are not graded.`,
  ].join("\n");
}

/* ===================== Respaldo sin IA (determinista) ===================== */

/** Recorta un tema de la dosificación a algo imprimible ("Unit 1 — What do you do? Jobs…"). */
function temaCorto(t: string): string {
  const s = t.replace(/\s+/g, " ").trim();
  const m = s.match(/Unit\s*\d+\s*[—–-]\s*([^.]+)/i);
  return (m ? m[1] : s.split(".")[0]).trim();
}

export function respaldoSpeaking(temas: string[]): ExamenSpeaking {
  const cortos = temas.map(temaCorto).filter(Boolean);
  const tarjetas = (cortos.length ? cortos : ["your daily life"]).slice(0, 3);
  return {
    parte1: [
      "What do you do? Where do you study?",
      "How do you get to school every day?",
      "Tell me about your family.",
      "What do you usually do in your free time?",
      "What are your plans for this weekend?",
      "Describe your daily routine.",
    ],
    parte2: tarjetas.map((t) => ({
      tema: `Talk about: ${t}`,
      indicaciones: [
        "Say what it is and give examples",
        "Say how it is part of your life",
        "Give your opinion and explain why",
      ],
    })),
    parte3: [
      "Why do you think that?",
      "Can you give me another example?",
      "How is it different from before?",
      "What would you like to change? Why?",
    ],
  };
}

export function respaldoWriting(temas: string[]): ExamenWriting {
  const t = temaCorto(temas[0] ?? "") || "your daily life";
  return {
    titulo: "About me and my life",
    situacion: `Write a paragraph for a new classmate about you and your daily life (topic: ${t}).`,
    puntos: [
      "who you are and what you do",
      "your daily routine and how you get to school",
      "a person in your family: appearance and personality",
      "your plans for next weekend",
    ],
  };
}
