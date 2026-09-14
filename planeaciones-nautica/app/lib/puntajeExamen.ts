// Puntaje de los exámenes: total por materia, reparto por sección y valor por
// pregunta — todo con FRACCIONES LIMPIAS (múltiplos de 0.5) y con validación en
// código de que la suma de las 4 secciones (y de todas las respuestas correctas)
// dé EXACTAMENTE el total.
//
// PN/MN (AGO-DIC 2026, oficios DEN-526-2025 y DEN-065-2026): el total del examen
// es el % de "Conocimiento" del esquema FASE 1 de la materia (mismo mapeo que
// textoPonderacionEvaluacion):
//   teórica + nuevo ingreso   → 70   ·  práctica + nuevo ingreso  → 20
//   teórica + en curso        → 50   ·  práctica + en curso       → 25
//
// INGLÉS (evaluación por habilidades): cada habilidad (Gram/Vocab, Listening,
// Speaking, Reading, Writing) vale 17 en parciales (85 Conocimiento + 15
// Participación y Libro = 100) y 20 en el ordinario (5×20 = 100). El examen Word
// que genera la página es el de Gram/Vocab, así que su total es 17 (parcial) o
// 20 (ordinario).
//
// Todos los valores viven en CONSTANTES DE CONFIGURACIÓN editables (abajo).

import {
  criteriosEvaluacion,
  type Generacion,
  type TipoMateria,
} from "../data/evaluacion";

/* =========================== Configuración editable =========================== */

// Reparto del total del examen entre las 4 secciones para PN/MN. DEBE sumar 1.
// (aprox. 40% opción múltiple, 20% cada una de las otras tres).
export const REPARTO_SECCIONES = {
  opcionMultiple: 0.4,
  verdaderoFalso: 0.2,
  relacionarColumnas: 0.2,
  preguntasAbiertas: 0.2,
} as const;

// Tope de preguntas por sección (coincide con el motor determinista y la IA).
export const MAX_PREGUNTAS_SECCION = {
  opcionMultiple: 10,
  verdaderoFalso: 8,
  relacionarColumnas: 6,
  preguntasAbiertas: 5,
} as const;

// Esquema oficial de Inglés (por habilidades). Editable en un solo lugar.
export const INGLES_EVALUACION = {
  habilidades: [
    "Gram/Vocab",
    "Listening",
    "Speaking",
    "Reading",
    "Writing",
  ] as const,
  // Puntos por habilidad según el tipo de examen.
  puntosPorHabilidad: { parcial: 17, ordinario: 20 },
  // Puntos de Participación y Libro (workbook); solo en parciales.
  participacionYLibro: 15,
  // Reparto del examen Word (Gram/Vocab) entre las 4 secciones, por tipo.
  // Deben sumar el total de la habilidad (17 y 20 respectivamente) y dar
  // fracciones limpias al repartir por pregunta.
  seccionesParcial: {
    opcionMultiple: 6,
    verdaderoFalso: 4,
    relacionarColumnas: 4,
    preguntasAbiertas: 3,
  }, // = 17
  seccionesOrdinario: {
    opcionMultiple: 8,
    verdaderoFalso: 4,
    relacionarColumnas: 4,
    preguntasAbiertas: 4,
  }, // = 20
} as const;

/* ================================== Tipos ================================== */

export type SeccionExamen =
  | "opcionMultiple"
  | "verdaderoFalso"
  | "relacionarColumnas"
  | "preguntasAbiertas";

export type AmbitoExamen = "PN" | "MN" | "INGLES";

/** Puntaje resuelto de un examen: total + puntos de cada sección (suman total). */
export type PuntajeExamen = {
  total: number;
  puntosSeccion: Record<SeccionExamen, number>;
};

// Los 4 bloques ya formateados que rellenan la plantilla Word.
export type PreguntasExamen = {
  opcionMultiple: string;
  verdaderoFalso: string;
  relacionarColumnas: string;
  preguntasAbiertas: string;
};

// Preguntas "crudas" (una por elemento, SIN numerar), listas para componer.
export type SeccionesCrudas = {
  /** Cada elemento: "pregunta\nA) ..\nB) ..\nC) ..\nD) .." (sin nº). */
  opcionMultiple: string[];
  /** Cada elemento: "afirmación (V/F)" (sin nº). */
  verdaderoFalso: string[];
  /** Pares concepto ↔ descripción para las dos columnas. */
  relacionarColumnas: { concepto: string; descripcion: string }[];
  /** Cada elemento: la pregunta abierta (sin nº). */
  preguntasAbiertas: string[];
};

/* ================================ Utilidades ================================ */

const EPS = 1e-9;
const ORDEN: SeccionExamen[] = [
  "opcionMultiple",
  "verdaderoFalso",
  "relacionarColumnas",
  "preguntasAbiertas",
];

/** true si x es múltiplo de 0.5 (fracción "limpia"). */
export function esFraccionLimpia(x: number): boolean {
  return Math.abs(x * 2 - Math.round(x * 2)) < EPS;
}

/** Formatea sin decimales sobrantes: 0.5, 1, 2, 3.5, 14. */
export function fmtPuntos(x: number): string {
  return Number.isInteger(x) ? String(x) : x.toFixed(2).replace(/\.?0+$/, "");
}

const esOrdinario = (tipo: string): boolean => /ordinari/i.test(tipo);

/* ============================== PN/MN: total ============================== */

/**
 * Total del examen PN/MN = % de "Conocimiento" del esquema FASE 1 de la materia
 * (mismo mapeo tipo×generación que textoPonderacionEvaluacion).
 */
export function totalExamenDesdeEsquema(
  tipo: TipoMateria,
  generacion: Generacion,
): number {
  const conocimiento = criteriosEvaluacion(tipo, generacion).find((c) =>
    /conocimiento/i.test(c.nombre),
  );
  if (!conocimiento) {
    throw new Error("El esquema FASE 1 no tiene criterio de 'Conocimiento'.");
  }
  return conocimiento.porcentaje;
}

/* ============================== Inglés ============================== */

/** Total del examen Word de Inglés (Gram/Vocab): 17 en parcial, 20 en ordinario. */
export function totalExamenIngles(tipo: string): number {
  return esOrdinario(tipo)
    ? INGLES_EVALUACION.puntosPorHabilidad.ordinario
    : INGLES_EVALUACION.puntosPorHabilidad.parcial;
}

export type HabilidadIngles =
  (typeof INGLES_EVALUACION.habilidades)[number];

/**
 * Texto del esquema COMPLETO de Inglés por habilidades. `habilidad` indica
 * cuál de las 5 es este Word (antes siempre era Gram/Vocab).
 */
export function esquemaInglesTexto(
  tipo: string,
  habilidad: HabilidadIngles = "Gram/Vocab",
): string {
  const ord = esOrdinario(tipo);
  const p = ord
    ? INGLES_EVALUACION.puntosPorHabilidad.ordinario
    : INGLES_EVALUACION.puntosPorHabilidad.parcial;
  const habilidades = INGLES_EVALUACION.habilidades
    .map((h) => `${h} ${p}`)
    .join(" · ");
  const conocimiento = p * INGLES_EVALUACION.habilidades.length;
  if (ord) {
    return `Esquema de evaluación de Inglés (Ordinario, por habilidades): ${habilidades} = ${conocimiento}. Este examen es ${habilidad} (${p} pts).`;
  }
  const totalCien = conocimiento + INGLES_EVALUACION.participacionYLibro;
  return `Esquema de evaluación de Inglés (por habilidades): ${habilidades} = ${conocimiento} Conocimiento + ${INGLES_EVALUACION.participacionYLibro} Participación y Libro = ${totalCien}. Este examen es ${habilidad} (${p} pts).`;
}

/* ========================= Reparto por sección ========================= */

/**
 * Reparte un total entre las 4 secciones con REPARTO_SECCIONES (40/20/20/20),
 * redondeando a fracciones limpias (múltiplos de 0.5) y ajustando el sobrante en
 * la sección de mayor peso para que la suma sea EXACTA. Uso PN/MN.
 */
export function puntosPorSeccion(total: number): Record<SeccionExamen, number> {
  const totalHp = Math.round(total * 2); // trabajamos en medios puntos (enteros)
  const hp: Record<SeccionExamen, number> = {
    opcionMultiple: 0,
    verdaderoFalso: 0,
    relacionarColumnas: 0,
    preguntasAbiertas: 0,
  };
  for (const s of ORDEN) hp[s] = Math.round(totalHp * REPARTO_SECCIONES[s]);
  const suma = ORDEN.reduce((a, s) => a + hp[s], 0);
  hp.opcionMultiple += totalHp - suma; // ajuste en la sección de mayor peso
  const res = {} as Record<SeccionExamen, number>;
  for (const s of ORDEN) {
    if (hp[s] < 1) {
      throw new Error(
        `La sección ${s} quedó con <0.5 pts para un total de ${total}.`,
      );
    }
    res[s] = hp[s] / 2;
  }
  return res;
}

/**
 * Resuelve los puntos por sección según el ámbito y el tipo de examen:
 *  - INGLES: reparto oficial por tipo (seccionesParcial / seccionesOrdinario).
 *  - PN/MN: 40/20/20/20 sobre el total (puntosPorSeccion).
 * Valida que sumen EXACTAMENTE el total y que cada valor sea fracción limpia.
 */
export function repartoDeSeccion(args: {
  total: number;
  ambito?: AmbitoExamen;
  tipo?: string;
}): Record<SeccionExamen, number> {
  const reparto =
    args.ambito === "INGLES"
      ? { ...(esOrdinario(args.tipo ?? "")
          ? INGLES_EVALUACION.seccionesOrdinario
          : INGLES_EVALUACION.seccionesParcial) }
      : puntosPorSeccion(args.total);

  const suma = ORDEN.reduce((a, s) => a + reparto[s], 0);
  if (Math.abs(suma - args.total) > EPS) {
    throw new Error(
      `El reparto por sección (${suma}) no suma el total (${args.total}).`,
    );
  }
  for (const s of ORDEN) {
    if (!esFraccionLimpia(reparto[s])) {
      throw new Error(
        `El puntaje de ${s} (${reparto[s]}) no es fracción limpia para total ${args.total}.`,
      );
    }
  }
  return reparto;
}

/** Resuelve el puntaje completo (total + secciones), o undefined si no aplica. */
export function resolverPuntaje(args: {
  total?: number;
  ambito?: AmbitoExamen;
  tipo?: string;
}): PuntajeExamen | undefined {
  if (typeof args.total !== "number" || args.total <= 0) return undefined;
  return {
    total: args.total,
    puntosSeccion: repartoDeSeccion({
      total: args.total,
      ambito: args.ambito,
      tipo: args.tipo,
    }),
  };
}

/**
 * Elige cuántas preguntas usar en una sección para que el valor POR PREGUNTA sea
 * una fracción limpia y nº × valor = total de la sección EXACTO. Aprovecha el
 * máximo de preguntas disponibles (mayor divisor de 2·S dentro del límite), y
 * nunca deja preguntas de 0 pts (n ≤ 2·S ⇒ p ≥ 0.5).
 */
export function distribuirSeccion(
  totalSeccion: number,
  disponibles: number,
  maxCap: number,
): { n: number; porPregunta: number } {
  const limite = Math.min(disponibles, maxCap, Math.floor(totalSeccion * 2));
  if (limite < 1) return { n: 0, porPregunta: 0 };
  const dosS = Math.round(totalSeccion * 2);
  let n = 1;
  for (let k = 1; k <= limite; k++) if (dosS % k === 0) n = k; // mayor divisor
  return { n, porPregunta: totalSeccion / n };
}

/* ================================ Composición ================================ */

const CAP = MAX_PREGUNTAS_SECCION;

function numerar(bloques: string[], sep: string): string {
  return bloques.map((b, i) => `${i + 1}. ${b}`).join(sep);
}

function renderRelacionar(
  pares: { concepto: string; descripcion: string }[],
): string {
  if (pares.length === 0) return "";
  return [
    "Columna A",
    ...pares.map((p, i) => `${i + 1}. ${p.concepto}`),
    "",
    "Columna B",
    ...pares.map((p, i) => `${String.fromCharCode(65 + i)}. ${p.descripcion}`),
  ].join("\n");
}

function encabezadoPuntaje(
  d: { n: number; porPregunta: number },
  unidad: string,
): string {
  const totalSeccion = d.n * d.porPregunta;
  return `(${d.n} ${unidad} · ${fmtPuntos(d.porPregunta)} pts c/u · ${fmtPuntos(totalSeccion)} pts)\n\n`;
}

/**
 * Compone los 4 strings finales para la plantilla Word.
 *  - Sin `puntaje`: formato histórico (sin puntos), solo capado a los máximos.
 *  - Con `puntaje`: antepone a cada sección "(N preguntas · p pts c/u · S pts)",
 *    recorta al nº de preguntas que hace limpio el reparto, y VALIDA que la suma
 *    de todas las respuestas correctas dé exactamente el total.
 *
 * El encabezado va como primera línea del contenido (bajo el rótulo literal
 * "I. OPCIÓN MÚLTIPLE" de la plantilla): la plantilla Word no se toca.
 */
export function componerPreguntasExamen(
  secc: SeccionesCrudas,
  puntaje?: PuntajeExamen,
): PreguntasExamen {
  if (!puntaje) {
    return {
      opcionMultiple: numerar(secc.opcionMultiple.slice(0, CAP.opcionMultiple), "\n\n"),
      verdaderoFalso: numerar(secc.verdaderoFalso.slice(0, CAP.verdaderoFalso), "\n"),
      relacionarColumnas: renderRelacionar(
        secc.relacionarColumnas.slice(0, CAP.relacionarColumnas),
      ),
      preguntasAbiertas: numerar(secc.preguntasAbiertas.slice(0, CAP.preguntasAbiertas), "\n"),
    };
  }

  const S = puntaje.puntosSeccion;
  const dOM = distribuirSeccion(S.opcionMultiple, secc.opcionMultiple.length, CAP.opcionMultiple);
  const dVF = distribuirSeccion(S.verdaderoFalso, secc.verdaderoFalso.length, CAP.verdaderoFalso);
  const dREL = distribuirSeccion(
    S.relacionarColumnas,
    secc.relacionarColumnas.length,
    CAP.relacionarColumnas,
  );
  const dAB = distribuirSeccion(S.preguntasAbiertas, secc.preguntasAbiertas.length, CAP.preguntasAbiertas);

  // Validación dura: la suma de TODAS las respuestas correctas = total exacto.
  const suma =
    dOM.n * dOM.porPregunta +
    dVF.n * dVF.porPregunta +
    dREL.n * dREL.porPregunta +
    dAB.n * dAB.porPregunta;
  if (Math.abs(suma - puntaje.total) > EPS) {
    throw new Error(
      `La suma de las secciones (${suma}) no cuadra con el total (${puntaje.total}). ` +
        `¿Alguna sección quedó sin preguntas?`,
    );
  }

  return {
    opcionMultiple:
      encabezadoPuntaje(dOM, "preguntas") +
      numerar(secc.opcionMultiple.slice(0, dOM.n), "\n\n"),
    verdaderoFalso:
      encabezadoPuntaje(dVF, "preguntas") +
      numerar(secc.verdaderoFalso.slice(0, dVF.n), "\n"),
    relacionarColumnas:
      encabezadoPuntaje(dREL, "pares") +
      renderRelacionar(secc.relacionarColumnas.slice(0, dREL.n)),
    preguntasAbiertas:
      encabezadoPuntaje(dAB, "preguntas") +
      numerar(secc.preguntasAbiertas.slice(0, dAB.n), "\n"),
  };
}
