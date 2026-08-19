// Esquema de la HOJA DE TRABAJO (worksheet) que devuelve la IA para una unidad
// del programa oficial PN/MN. Mismo patrón que `esquemaExamen`: UNA sola
// representación del contrato en Zod v4 que sirve a la vez para (a) forzar el
// JSON estructurado de Claude (`output_config.format`) y (b) revalidar la
// respuesta en el servidor.
//
// Diferencia con el examen: el worksheet NO se califica ni se acota a un rango
// de semanas. Es material de práctica en clase sobre UNA unidad completa, así
// que incluye conceptos clave (repaso previo) y ejercicios con espacio para
// resolver a mano. Las respuestas viajan aparte del enunciado para que el
// generador de Word pueda armar —o no— la hoja de respuestas del docente.

import * as z from "zod/v4";

/* ------------------------------ Zod (validación) ----------------------------- */

const reactivoOpcionMultiple = z.object({
  enunciado: z.string().min(1),
  // 4 opciones idealmente; se toleran 2–6 como en el examen.
  opciones: z.array(z.string().min(1)).min(2).max(6),
  /** Índice (0-based) de la opción correcta; alimenta la hoja de respuestas. */
  correcta: z.number().int().min(0),
});

const reactivoCompletar = z.object({
  /** El hueco se marca con "_____" dentro del propio enunciado. */
  enunciado: z.string().min(1),
  respuesta: z.string().min(1),
});

const parRelacion = z.object({
  concepto: z.string().min(1),
  descripcion: z.string().min(1),
});

const problemaAbierto = z.object({
  enunciado: z.string().min(1),
  /** Renglones en blanco a dejar bajo el enunciado para resolver a mano. */
  lineasRespuesta: z.number().int().min(1).max(20),
  /** Respuesta modelo / criterio de solución, para la hoja del docente. */
  respuestaModelo: z.string().min(1),
});

export const worksheetIASchema = z.object({
  titulo: z.string().min(1),
  objetivo: z.string().min(1),
  instruccionesGenerales: z.string().min(1),
  conceptosClave: z.array(z.string().min(1)),
  opcionMultiple: z.array(reactivoOpcionMultiple),
  completar: z.array(reactivoCompletar),
  relacionarColumnas: z.array(parRelacion),
  problemas: z.array(problemaAbierto),
});

export type WorksheetIA = z.infer<typeof worksheetIASchema>;

/**
 * ¿La hoja trae al menos un ejercicio? Un worksheet con título y objetivo pero
 * sin un solo reactivo es basura para el docente: la ruta lo trata como fallo en
 * lugar de descargar una hoja vacía.
 */
export function tieneEjercicios(w: WorksheetIA | null | undefined): boolean {
  if (!w) return false;
  return (
    w.opcionMultiple.length +
      w.completar.length +
      w.relacionarColumnas.length +
      w.problemas.length >
    0
  );
}

/** Número total de reactivos (para el mensaje de éxito y el RESUMEN.txt del ZIP). */
export function contarReactivos(w: WorksheetIA): number {
  return (
    w.opcionMultiple.length +
    w.completar.length +
    w.relacionarColumnas.length +
    w.problemas.length
  );
}
