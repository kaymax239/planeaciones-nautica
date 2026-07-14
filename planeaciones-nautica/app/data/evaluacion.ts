// Criterios de evaluación y escala de calificación oficiales.
// Fuente: Oficio DEN/526/2025 (Calificaciones en evaluaciones parciales, semestrales,
// extraordinarias y de regularización), ratificado por DEN/773/2025 y DEN/065/2026.
// Vigente para el ciclo Agosto-Diciembre 2026 (semestres I, III, V y VII).

import type { ProgramaOficial } from "./tipos";

export type TipoMateria = "teorica" | "practica" | "teorico-practica";

// La generación define tanto los porcentajes como la escala aprobatoria.
//  - "nuevo-ingreso": generación 2025-2029 y subsecuentes (1.er Año). Mínima 7.0.
//  - "en-curso": generaciones 2021-2025 (2.º, 3.º y 4.º Año). Mínima 6.0.
export type Generacion = "nuevo-ingreso" | "en-curso";

export type Criterio = { nombre: string; porcentaje: number };

const CONOCIMIENTO = "Conocimiento";
const ACTIVIDADES = "Prácticas y Actividades de Aprendizaje";
const PARTICIPACION = "Participaciones y uso de las TIC's";

// Generación nuevo ingreso (1.er Año, Gen 2025-2029), mínima 7.0. El reparto SÍ
// depende del tipo de materia (DEN/526/2025 + DEN/065/2026).
const CRITERIOS_NUEVO_INGRESO: Record<TipoMateria, Criterio[]> = {
  teorica: [
    { nombre: CONOCIMIENTO, porcentaje: 70 },
    { nombre: ACTIVIDADES, porcentaje: 20 },
    { nombre: PARTICIPACION, porcentaje: 10 },
  ],
  practica: [
    { nombre: CONOCIMIENTO, porcentaje: 20 },
    { nombre: ACTIVIDADES, porcentaje: 70 },
    { nombre: PARTICIPACION, porcentaje: 10 },
  ],
  // El oficio solo define teóricas y prácticas. Las "teórico-prácticas" se
  // resuelven a uno de esos dos esquemas por horas (ver tipoMateriaDesdePrograma),
  // así que esta fila es solo un respaldo neutro = esquema teórico.
  "teorico-practica": [
    { nombre: CONOCIMIENTO, porcentaje: 70 },
    { nombre: ACTIVIDADES, porcentaje: 20 },
    { nombre: PARTICIPACION, porcentaje: 10 },
  ],
};

// Generaciones en curso (2021-2025): el reparto sí depende del tipo de materia.
const CRITERIOS_EN_CURSO: Record<TipoMateria, Criterio[]> = {
  teorica: [
    { nombre: CONOCIMIENTO, porcentaje: 50 },
    { nombre: ACTIVIDADES, porcentaje: 25 },
    { nombre: PARTICIPACION, porcentaje: 25 },
  ],
  practica: [
    { nombre: CONOCIMIENTO, porcentaje: 25 },
    { nombre: ACTIVIDADES, porcentaje: 50 },
    { nombre: PARTICIPACION, porcentaje: 25 },
  ],
  // El oficio solo define teóricas y prácticas; para teórico-prácticas se toma
  // el esquema teórico como predeterminado (ajustar con la clasificación DEN-065).
  "teorico-practica": [
    { nombre: CONOCIMIENTO, porcentaje: 50 },
    { nombre: ACTIVIDADES, porcentaje: 25 },
    { nombre: PARTICIPACION, porcentaje: 25 },
  ],
};

export const ESCALA = {
  "nuevo-ingreso": {
    minimaAprobatoria: 7.0,
    noCompetente: "0.0 a 6.9",
    competente: "7.0 a 10.0",
  },
  "en-curso": {
    minimaAprobatoria: 6.0,
    noCompetente: "0.0 a 5.9",
    competente: "6.0 a 10.0",
  },
} as const;

// Evaluaciones del periodo (su calendarización vive en ./calendario.ts).
export const EVALUACIONES = [
  "Primera Evaluación Parcial",
  "Segunda Evaluación Parcial",
  "Evaluación Semestral (Ordinaria)",
] as const;

/** Semestre I = nuevo ingreso (1.er Año); III, V y VII = generaciones en curso. */
export const generacionPorSemestre = (semestre: string): Generacion =>
  /\bI\s+SEMESTRE\b/i.test(semestre.trim()) ? "nuevo-ingreso" : "en-curso";

export const criteriosEvaluacion = (
  tipo: TipoMateria = "teorico-practica",
  generacion: Generacion = "nuevo-ingreso",
): Criterio[] =>
  (generacion === "nuevo-ingreso" ? CRITERIOS_NUEVO_INGRESO : CRITERIOS_EN_CURSO)[
    tipo
  ];

/** Texto compacto de puntuaciones para la celda de evaluación del F-32. */
export const textoPuntuacionesF32 = (
  tipo: TipoMateria = "teorico-practica",
  generacion: Generacion = "nuevo-ingreso",
) => {
  const criterios = criteriosEvaluacion(tipo, generacion)
    .map((c) => `${c.nombre} ${c.porcentaje}%`)
    .join(" · ");
  const escala = ESCALA[generacion];

  return (
    `Criterios de evaluación (DEN/526/2025): ${criterios}. ` +
    `Instrumentos: lista de cotejo y rúbrica de desempeño. ` +
    `Escala: ${escala.competente} Competente (aprobatorio); ` +
    `${escala.noCompetente} Aún no competente. ` +
    `Mínima aprobatoria: ${escala.minimaAprobatoria.toFixed(1)}.`
  );
};

/**
 * Resuelve el TipoMateria OFICIAL (solo "teorica" o "practica", como el oficio)
 * a partir del programa de la materia:
 *  - Si `tipo` es claramente "Teórica" o "Práctica", lo usa.
 *  - Si es "Teórico-práctica" (o no se reconoce), DECIDE POR HORAS: más horas
 *    prácticas que teóricas => práctica; en empate o más teóricas => teórica.
 */
export const tipoMateriaDesdePrograma = (
  programa: ProgramaOficial,
): "teorica" | "practica" => {
  const t = (programa?.tipo ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  const teo = programa?.horas?.teoricas ?? 0;
  const pra = programa?.horas?.practicas ?? 0;
  const porHoras = (): "teorica" | "practica" =>
    pra > teo ? "practica" : "teorica"; // empate => teorica

  // "Teórico-práctica" (contiene ambas palabras): se decide por horas.
  if (/teor/.test(t) && /pract/.test(t)) return porHoras();
  if (/pract/.test(t)) return "practica";
  if (/teor/.test(t)) return "teorica";
  return porHoras(); // tipo desconocido => por horas
};

/**
 * Porcentajes y mínima aprobatoria para el PLAN DE EVALUACIÓN del F-32.
 * PRIORIZA `programa.evaluacion` (biblioteca oficial 2026→2027, ya normalizada a
 * DEN-526-2025 / DEN-065-2026 por semestre/tipo). Solo si el programa NO trae ese
 * campo (materias legacy) usa la lógica por semestre/generación.
 */
export const porcentajesDocx = (
  programa: ProgramaOficial | undefined,
  tipo: TipoMateria,
  generacion: Generacion,
): {
  pctConocimiento: string;
  pctActividades: string;
  pctParticipacion: string;
  calificacionMinima: string;
} => {
  const norm = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const ev = programa?.evaluacion;
  if (ev && ev.esquema === "oficial" && ev.parciales[0]?.categorias) {
    const cats = ev.parciales[0].categorias;
    const pct = (frag: string) => {
      const c = cats.find((x) => norm(x.categoria).includes(frag));
      return c ? String(c.porcentaje) : "";
    };
    return {
      pctConocimiento: pct("conocimiento"),
      pctActividades: pct("practic") || pct("actividad"),
      pctParticipacion: pct("participac"),
      calificacionMinima: ev.calificacionMinima.toFixed(1),
    };
  }
  // Legacy (semestres impares sin campo evaluacion).
  const criterios = criteriosEvaluacion(tipo, generacion);
  const p = (incluye: string) =>
    String(criterios.find((c) => c.nombre.includes(incluye))?.porcentaje ?? "");
  return {
    pctConocimiento: p("Conocimiento"),
    pctActividades: p("Actividades"),
    pctParticipacion: p("Participaciones"),
    calificacionMinima: ESCALA[generacion].minimaAprobatoria.toFixed(1),
  };
};

/** Línea compacta de ponderación para meter como TEXTO en F-51 y exámenes
 *  (sin tocar las plantillas .docx). */
export const textoPonderacionEvaluacion = (
  tipo: TipoMateria,
  generacion: Generacion,
): string => {
  const criterios = criteriosEvaluacion(tipo, generacion)
    .map((c) => `${c.nombre} ${c.porcentaje}%`)
    .join(" · ");
  const escala = ESCALA[generacion];
  return (
    `Ponderación (DEN/526/2025): ${criterios}. ` +
    `Mínima aprobatoria: ${escala.minimaAprobatoria.toFixed(1)}.`
  );
};
