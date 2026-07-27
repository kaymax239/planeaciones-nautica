// Tipos para los programas oficiales FIDENA (fuente de verdad: PDFs de programa).
// Estructura fiel al "Programa de Asignatura": clave, nombre, tipo, horas,
// objetivo general, unidades (con temas/subtemas/objetivo específico) y bibliografía.

export type HorasPrograma = {
  semanas: number;
  porSemana: number;
  teoricas: number;
  practicas: number;
  independientes: number;
  total: number;
};

export type UnidadOficial = {
  numero: number;
  /** Título del tema de la unidad (verbatim del PDF). */
  tema: string;
  /** Objetivo específico de la unidad ("Pendiente de revisión" si no se pudo extraer). */
  objetivoEspecifico: string;
  /** Subtemas verbatim del PDF (incluyen su numeración, p. ej. "1.1 ..."). */
  subtemas: string[];
  /** true para la unidad transversal "Contenidos de actualidad...". */
  transversal: boolean;
};

/** Un criterio dentro de una categoría oficial (desglose informativo). */
export type CriterioDesglose = {
  criterio: string;
  instrumento: string | null;
  /** Solo para casos especiales (p. ej. evaluación diagnóstica con peso 0). */
  peso?: number;
  nota?: string;
};

/** Categoría oficial de evaluación (Conocimiento / Prácticas / Participación). */
export type CategoriaEvaluacion = {
  categoria: string;
  /** Porcentaje oficial de la categoría (los 3 suman 100 por parcial). */
  porcentaje: number;
  desglose: CriterioDesglose[];
};

export type ParcialOficial = { nombre: string; categorias: CategoriaEvaluacion[] };

export type HabilidadIngles = { habilidad: string; puntos: number };
export type ParcialIngles = {
  nombre: string;
  total: number;
  examen: { puntos: number; habilidades: HabilidadIngles[] };
  participacionProyectosLibro: { puntos: number; desglose: CriterioDesglose[] };
};

/**
 * Evaluación normalizada al esquema oficial (oficios DEN-526-2025 / DEN-065-2026).
 * Ver docs/criterios-evaluacion-oficiales.md.
 */
export type EvaluacionOficial =
  | {
      esquema: "oficial";
      oficio: string;
      tipoMateria: string;
      calificacionMinima: number;
      parciales: ParcialOficial[];
      acreditacion: string;
    }
  | {
      esquema: "ingles";
      oficio: string;
      calificacionMinima: number;
      parciales: ParcialIngles[];
      ordinario: { total: number; examen: { puntos: number; habilidades: HabilidadIngles[] } };
      acreditacion: string;
    };

export type ProgramaOficial = {
  clave: string;
  nombre: string;
  tipo: string;
  horas: HorasPrograma;
  objetivoGeneral: string;
  unidades: UnidadOficial[];
  /** Líneas de "FUENTES DE CONSULTA" (mejor esfuerzo; revisión recomendada). */
  bibliografia: string[];
  /** Archivo PDF de origen. */
  fuente: string;
  /** Evaluación oficial (semestres pares 2026→2027). Opcional en programas legacy. */
  evaluacion?: EvaluacionOficial;
};

/** Type guard: distingue un programa oficial (nuevo) del contenido genérico (legacy). */
export const esProgramaOficial = (v: unknown): v is ProgramaOficial =>
  !!v && typeof v === "object" && Array.isArray((v as ProgramaOficial).unidades);
