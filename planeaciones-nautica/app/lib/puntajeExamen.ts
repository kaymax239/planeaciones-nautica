// Puntaje de los exámenes: total por materia, reparto por sección y valor por
// pregunta — todo con FRACCIONES LIMPIAS (múltiplos de 0.5) y con validación en
// código de que la suma de las 4 secciones (y de todas las respuestas correctas)
// dé EXACTAMENTE el total.
//
// Base oficial (AGO-DIC 2026, oficios DEN-526-2025 y DEN-065-2026): el valor
// total del examen es el % de "Conocimiento" del esquema FASE 1 que ya aplica a
// cada materia (mismo mapeo que textoPonderacionEvaluacion):
//   teórica + nuevo ingreso   → 70   ·  práctica + nuevo ingreso  → 20
//   teórica + en curso        → 50   ·  práctica + en curso       → 25
//
// Todos los valores viven en CONSTANTES DE CONFIGURACIÓN editables (abajo).

import {
  criteriosEvaluacion,
  type Generacion,
  type TipoMateria,
} from "../data/evaluacion";

/* =========================== Configuración editable =========================== */

// Reparto del total del examen entre las 4 secciones. DEBE sumar 1.
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

// PROVISIONAL: Inglés aún no tiene valores oficiales de puntaje. Se usa este
// total hasta que se definan (se cambia aquí, en un solo lugar).
export const TOTAL_EXAMEN_INGLES_PROVISIONAL = 10;

/* ================================== Tipos ================================== */

export type SeccionExamen =
  | "opcionMultiple"
  | "verdaderoFalso"
  | "relacionarColumnas"
  | "preguntasAbiertas";

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

/** true si x es múltiplo de 0.5 (fracción "limpia"). */
export function esFraccionLimpia(x: number): boolean {
  return Math.abs(x * 2 - Math.round(x * 2)) < EPS;
}

/** Formatea sin decimales sobrantes: 0.5, 1, 2, 3.5, 14. */
export function fmtPuntos(x: number): string {
  return Number.isInteger(x) ? String(x) : x.toFixed(2).replace(/\.?0+$/, "");
}

/**
 * Total del examen = % de "Conocimiento" del esquema FASE 1 de la materia
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

/**
 * Reparte el total entre las 4 secciones. Valida que cada valor sea una fracción
 * limpia y que la suma dé EXACTAMENTE el total (si no, lanza — evita repartos
 * con decimales raros como 0.4166).
 */
export function puntosPorSeccion(total: number): Record<SeccionExamen, number> {
  const secciones: Record<SeccionExamen, number> = {
    opcionMultiple: total * REPARTO_SECCIONES.opcionMultiple,
    verdaderoFalso: total * REPARTO_SECCIONES.verdaderoFalso,
    relacionarColumnas: total * REPARTO_SECCIONES.relacionarColumnas,
    preguntasAbiertas: total * REPARTO_SECCIONES.preguntasAbiertas,
  };
  const suma =
    secciones.opcionMultiple +
    secciones.verdaderoFalso +
    secciones.relacionarColumnas +
    secciones.preguntasAbiertas;
  if (Math.abs(suma - total) > EPS) {
    throw new Error(
      `El reparto por sección (${suma}) no suma el total (${total}).`,
    );
  }
  for (const [nombre, valor] of Object.entries(secciones)) {
    if (!esFraccionLimpia(valor)) {
      throw new Error(
        `El puntaje de la sección ${nombre} (${valor}) no es una fracción limpia para un total de ${total}. Ajusta el total o REPARTO_SECCIONES.`,
      );
    }
  }
  return secciones;
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
 *  - Sin `total`: formato histórico (sin puntos), solo capado a los máximos.
 *  - Con `total`: antepone a cada sección su encabezado de puntaje
 *    "(N preguntas · p pts c/u · S pts)", recorta al nº de preguntas que hace
 *    limpio el reparto, y VALIDA que la suma de todas las respuestas correctas
 *    dé exactamente el total.
 *
 * El encabezado va como primera línea del contenido (bajo el rótulo literal
 * "I. OPCIÓN MÚLTIPLE" de la plantilla): la plantilla Word no se toca.
 */
export function componerPreguntasExamen(
  secc: SeccionesCrudas,
  total?: number,
): PreguntasExamen {
  if (total == null) {
    return {
      opcionMultiple: numerar(secc.opcionMultiple.slice(0, CAP.opcionMultiple), "\n\n"),
      verdaderoFalso: numerar(secc.verdaderoFalso.slice(0, CAP.verdaderoFalso), "\n"),
      relacionarColumnas: renderRelacionar(
        secc.relacionarColumnas.slice(0, CAP.relacionarColumnas),
      ),
      preguntasAbiertas: numerar(secc.preguntasAbiertas.slice(0, CAP.preguntasAbiertas), "\n"),
    };
  }

  const S = puntosPorSeccion(total);
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
  if (Math.abs(suma - total) > EPS) {
    throw new Error(
      `La suma de las secciones (${suma}) no cuadra con el total (${total}). ` +
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
