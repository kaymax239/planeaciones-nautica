// Biblioteca ESPEJO — planeaciones F-32 del ciclo Enero–Junio 2026 (semestres
// PARES 2,4,6,8), extraídas de los PDFs oficiales e integradas al manifest
// histórico (lote "enero-junio-2026"). Sirven de ESPEJO para generar el ciclo
// Enero–Junio 2027: misma estructura y contenido, cambiando solo fechas y ciclo.
//
// A diferencia de `seleccionHistoricas` (que elige 1–3 referencias de ESTILO),
// aquí se busca la coincidencia EXACTA de una materia para reproducirla.
//
// - `CATALOGO_ESPEJO`   : lista de todas las materias disponibles (para la UI).
// - `buscarEnEspejo()`  : localiza la entrada espejo de una materia concreta.
// - `cargarProgramaEspejo()` : lee (server-only) el programa estructurado + texto.

import manifestData from "../data/planeaciones-historicas/manifest.json";
import { normalizar, raizMateria, type Carrera } from "./seleccionHistoricas";

export const LOTE_ESPEJO = "enero-junio-2026";
export const PERIODO_ESPEJO = "Enero-Junio 2026";
export const PERIODO_DESTINO = "Enero-Junio 2027";

/** Entrada del manifest para el lote espejo (superset de EntradaHistorica). */
export interface EntradaEspejo {
  id: string;
  clave: string;
  materia: string;
  carrera: string; // "PN" | "MN"
  semestre: number; // 2 | 4 | 6 | 8
  grupo?: string; // "A" | "B" | ""
  area: string;
  lote?: string;
  periodo?: string;
  docente?: string;
  archivoOrigen: string;
  formato: string;
  corpus: string; // ruta relativa dentro de app/data/planeaciones-historicas/
  /** false = PDF escaneado sin capa de texto → no hay contenido que espejar. */
  contenidoExtraible?: boolean;
}

interface ManifestLike {
  documentos?: EntradaEspejo[];
}

const DOCUMENTOS: EntradaEspejo[] =
  (manifestData as unknown as ManifestLike).documentos ?? [];

/** Todas las entradas del lote espejo (2026), incluidas las solo-metadatos. */
export const CATALOGO_ESPEJO: EntradaEspejo[] = DOCUMENTOS.filter(
  (d) => d.lote === LOTE_ESPEJO,
).sort(
  (a, b) =>
    (a.carrera || "").localeCompare(b.carrera || "") ||
    (a.semestre || 0) - (b.semestre || 0) ||
    (a.materia || "").localeCompare(b.materia || "") ||
    (a.grupo || "").localeCompare(b.grupo || ""),
);

/** Solo las que tienen contenido real (PDF con texto) — las espejables. */
export const CATALOGO_ESPEJO_UTIL: EntradaEspejo[] = CATALOGO_ESPEJO.filter(
  (d) => d.contenidoExtraible !== false,
);

/** Catálogo agrupado carrera → semestre → materias (para listar en la UI). */
export function catalogoAgrupado(): Record<
  string,
  Record<number, EntradaEspejo[]>
> {
  const out: Record<string, Record<number, EntradaEspejo[]>> = {};
  for (const d of CATALOGO_ESPEJO) {
    (out[d.carrera] ??= {});
    (out[d.carrera][d.semestre] ??= []).push(d);
  }
  return out;
}

export interface CriterioEspejo {
  carrera: Carrera | string;
  semestre?: number;
  materia: string;
  /** Grupo preferido ("A"/"B"); si coincide, desempata. */
  grupo?: string;
}

/**
 * Busca en la biblioteca espejo la entrada que corresponde a una materia.
 * Coincidencia por carrera + raíz de materia (ignorando romanos), afinando por
 * semestre y grupo si se conocen. Devuelve `null` si no hay espejo (el llamador
 * cae entonces al flujo de generación con IA).
 */
export function buscarEnEspejo(criterio: CriterioEspejo): EntradaEspejo | null {
  const raiz = raizMateria(criterio.materia);
  const norm = normalizar(criterio.materia);
  const carrera = String(criterio.carrera).toUpperCase();

  const candidatos = CATALOGO_ESPEJO_UTIL.filter((d) => {
    if (String(d.carrera).toUpperCase() !== carrera) return false;
    const rd = raizMateria(d.materia);
    return rd === raiz || normalizar(d.materia) === norm || (!!raiz && rd.includes(raiz)) || (!!raiz && raiz.includes(rd));
  });
  if (!candidatos.length) return null;

  const puntua = (d: EntradaEspejo) => {
    let s = 0;
    if (raizMateria(d.materia) === raiz) s += 4;
    if (normalizar(d.materia) === norm) s += 3;
    if (criterio.semestre && d.semestre === criterio.semestre) s += 3;
    if (criterio.grupo && (d.grupo || "").toUpperCase() === criterio.grupo.toUpperCase())
      s += 1;
    return s;
  };
  return candidatos.slice().sort((a, b) => puntua(b) - puntua(a))[0] ?? null;
}

/* ------------------------- carga (server-only) ------------------------- */

export interface UnidadEspejo {
  numero: number;
  tema: string;
  objetivoEspecifico: string;
  subtemas: string[];
}

export interface ProgramaEspejo {
  clave: string;
  nombre: string;
  horas: { total: number; porSemana: number };
  objetivoGeneral: string;
  unidades: UnidadEspejo[];
  bibliografia: string[];
  evaluacion: { porcentajesDetectados: number[] };
  calidad: {
    unidades: number;
    subtemas: number;
    conObjetivo: number;
    bibliografia: number;
  };
}

export interface CorpusEspejo {
  id: string;
  clave: string;
  materia: string;
  carrera: string;
  semestre: number;
  grupo?: string;
  periodo?: string;
  area: string;
  contenidoExtraible?: boolean;
  datosGenerales?: {
    objetivoGeneral?: string;
    horasTotales?: string;
    horasPorSemana?: string;
  };
  programaEspejo?: ProgramaEspejo;
  pedagogia?: {
    competencias: string[];
    estrategiasEnsenanza: string[];
    tecnicasEnsenanza: string[];
    secuenciaDidactica: string;
    productosEvidencias: string[];
    instrumentosEvaluacion: string[];
  };
  textoReferenciaRedactado?: string;
  textoCompletoRedactado?: string;
}

/**
 * Lee el JSON de corpus de una entrada espejo (programa + pedagogía + texto).
 * SOLO servidor (usa fs). Devuelve `null` si no se puede leer.
 */
export async function cargarProgramaEspejo(
  entrada: EntradaEspejo,
): Promise<CorpusEspejo | null> {
  try {
    const { promises: fs } = await import("fs");
    const path = await import("path");
    const abs = path.join(
      process.cwd(),
      "app",
      "data",
      "planeaciones-historicas",
      entrada.corpus,
    );
    return JSON.parse(await fs.readFile(abs, "utf8")) as CorpusEspejo;
  } catch {
    return null;
  }
}
