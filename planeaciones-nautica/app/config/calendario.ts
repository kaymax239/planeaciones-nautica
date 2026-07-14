// FUENTE ÚNICA de fechas del generador F-32, POR PERIODO.
//
// - Agosto–Diciembre 2026 (semestres impares): fechas OFICIALES, tomadas del
//   calendario ya cargado en app/data/calendario.ts (oficio vigente).
// - Enero–Junio 2027 (semestres pares): MARCADORES "(por definir)" /
//   "(fechas por publicar)" hasta que se publique el oficio del ciclo 2027.
//
// Cuando salga el calendario oficial 2027, se actualiza SOLO el bloque
// ENE_JUN_2027 de este archivo y todos los documentos saldrán con las fechas
// correctas. El generador NO debe tomar fechas de ningún otro lado.

import {
  distribuirFechas,
  etiquetaSemanaF32,
  EXAMENES,
  formatearRango,
} from "../data/calendario";

export type PeriodoEscolar = "ago-dic" | "ene-jun";

export type CalendarioPeriodo = {
  clave: PeriodoEscolar;
  /** Periodo de impartición (celda del F-32). */
  etiqueta: string;
  /** true = fechas oficiales; false = por publicar (marcadores). */
  definido: boolean;
  /** Etiqueta lista para la celda "Semana" del F-32 (número 1-indexado). */
  etiquetaSemana: (numero: number) => string;
  /** Rango de la 1.ª Evaluación Parcial (texto). */
  fechaParcial1: string;
  /** Rango de la 2.ª Evaluación Parcial (texto). */
  fechaParcial2: string;
};

// Ago–Dic 2026: fechas reales derivadas del calendario oficial vigente.
const FECHAS_AGO_DIC = distribuirFechas(18);
const AGO_DIC_2026: CalendarioPeriodo = {
  clave: "ago-dic",
  etiqueta: "Agosto-Diciembre 2026",
  definido: true,
  etiquetaSemana: (numero) => {
    const f = FECHAS_AGO_DIC[numero - 1];
    return f ? etiquetaSemanaF32(f) : `Semana ${numero}`;
  },
  fechaParcial1: formatearRango(EXAMENES.parcial1),
  fechaParcial2: formatearRango(EXAMENES.parcial2),
};

// Ene–Jun 2027: PENDIENTE de oficio. Marcadores hasta publicación.
// TODO(oficio-2027): llenar semanas (fechas reales) y parciales al publicarse.
const ENE_JUN_2027: CalendarioPeriodo = {
  clave: "ene-jun",
  etiqueta: "Enero-Junio 2027",
  definido: false,
  etiquetaSemana: (numero) => `SEMANA ${numero} (por definir)`,
  fechaParcial1: "(fechas por publicar)",
  fechaParcial2: "(fechas por publicar)",
};

const POR_PERIODO: Record<PeriodoEscolar, CalendarioPeriodo> = {
  "ago-dic": AGO_DIC_2026,
  "ene-jun": ENE_JUN_2027,
};

/** Devuelve el calendario del periodo seleccionado en el flujo. */
export const calendarioDe = (periodo: PeriodoEscolar): CalendarioPeriodo =>
  POR_PERIODO[periodo];
