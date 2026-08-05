// Fase 2 — Esquema del enriquecimiento pedagógico que devuelve la IA.
//
// Define EXACTAMENTE lo único que la IA puede producir. NO incluye temas,
// subtemas, unidades, objetivos ni bibliografía: esos campos viven solo en el
// programa oficial (app/data/contenidos) y el merge los inyecta aparte. Cada
// bloque se ancla a una unidad oficial mediante `unidadNumero` (entero); si la
// IA referencia un número inexistente, el merge lo descarta.
//
// UNA sola representación del contrato: `planeacionEnriquecidaSchema` (Zod v4).
// Sirve a la vez para (a) validar en el servidor y (b) forzar el JSON
// estructurado de Claude: `generarJSONEstructuradoClaude` deriva el JSON Schema
// del esquema Zod y lo manda como `output_config.format` (structured outputs).
// Antes había que mantener a mano un espejo con `Type` de @google/genai.

import * as z from "zod/v4";

/* ------------------------------ Zod (validación) ------------------------------ */

export const TIPOS_INSTRUMENTO = ["diagnostica", "formativa", "sumativa"] as const;

const instrumento = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(TIPOS_INSTRUMENTO),
});

const secuencia = z.object({
  inicio: z.string().min(1),
  desarrollo: z.string().min(1),
  cierre: z.string().min(1),
});

const unidadEnriquecida = z.object({
  /** Referencia a la unidad OFICIAL. El merge valida que exista. */
  unidadNumero: z.number().int(),
  competenciasDisciplinares: z.array(z.string()),
  estrategiasEnsenanza: z.array(z.string()),
  tecnicasEnsenanza: z.array(z.string()),
  secuencia,
  productosEvidencias: z.array(z.string()),
  instrumentosEvaluacion: z.array(instrumento),
});

export const planeacionEnriquecidaSchema = z.object({
  /** Competencias genéricas a nivel asignatura. */
  competenciasGenericas: z.array(z.string()),
  /** Enriquecimiento por unidad (anclado por unidadNumero oficial). */
  unidades: z.array(unidadEnriquecida),
});

export type PlaneacionEnriquecida = z.infer<typeof planeacionEnriquecidaSchema>;
export type UnidadEnriquecida = z.infer<typeof unidadEnriquecida>;
export type InstrumentoEvaluacion = z.infer<typeof instrumento>;