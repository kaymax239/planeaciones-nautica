// Servicio BibliotecaIngles — biblioteca oficial de planeaciones históricas de
// Inglés. Lee (solo lectura) la carpeta del corpus, lista los documentos, los
// tipa por extensión y cuenta cuántos hay. NO mueve, renombra ni modifica los
// archivos. NO genera embeddings ni llama a Gemini todavía: deja la estructura
// preparada para que una fase posterior los indexe y los consulte antes de
// generar nuevas planeaciones de inglés.
//
// Independiente del flujo PN/MN y sin relación con STCW.

import { promises as fs } from "fs";
import path from "path";

// Carpeta del corpus, relativa a la raíz de la app (process.cwd() === la app
// "planeaciones-nautica" en build/start/dev). Nombre EXACTO con espacios.
export const RUTA_BIBLIOTECA_INGLES = "planeaciones historicas ingles";

// Índice local generado por scripts/indexar-ingles.mjs (carpeta ignorada por
// git). Contiene el texto extraído de cada .docx para que una fase posterior lo
// use como base con Gemini.
export const RUTA_INDICE_INGLES = ".indice-ingles/indice.json";

export type TipoDocumento =
  | "word"
  | "pdf"
  | "comprimido"
  | "texto"
  | "presentacion"
  | "otro";

export type DocumentoIngles = {
  /** Identificador estable dentro de la biblioteca (su ruta relativa). */
  id: string;
  /** Nombre del archivo (basename). */
  nombre: string;
  /** Ruta relativa desde la raíz de la biblioteca. */
  rutaRelativa: string;
  /** Extensión en minúsculas, sin punto (p. ej. "docx"). */
  extension: string;
  /** Categoría de alto nivel del documento. */
  tipo: TipoDocumento;
  /** Tamaño en bytes. */
  tamano: number;
  /**
   * Preparado para la fase de indexación. Siempre false por ahora: aún no se
   * extrae texto, no se generan embeddings ni se consulta con Gemini.
   */
  indexado: boolean;
};

/** Entrada del índice: incluye el texto extraído (para la fase Gemini). */
export type EntradaIndiceIngles = {
  id: string;
  nombre: string;
  rutaRelativa: string;
  /** Docente / carpeta de origen (subcarpeta inmediata del archivo). */
  origen: string;
  /** Nivel inferido del NOMBRE del archivo (p. ej. "5"), o null si no se pudo.
   *  Es el único campo de nivel que se usa para seleccionar referencias. */
  nivel: string | null;
  /**
   * DIAGNÓSTICO (índice v2, opcional en índices v1). Valor literal del campo
   * "ASIGNATURA/CURSO" del F-32 dentro del documento. Nadie lo consume para
   * generar: sirve para saber de qué curso es realmente cada documento.
   */
  asignaturaTexto?: string | null;
  /**
   * DIAGNÓSTICO (índice v2, opcional en índices v1). Nivel que el propio
   * documento declara en `asignaturaTexto`, solo si lo marca explícitamente
   * ("lvl 4", "Level 6", "NIVEL 3"). No se deduce del romano del semestre:
   * en este corpus semestre y nivel no coinciden. Cuando discrepa de `nivel`,
   * el nombre del archivo está mintiendo sobre su contenido.
   */
  nivelSegunTexto?: string | null;
  /** Conteo de palabras del texto extraído. */
  palabras: number;
  /** Texto plano extraído del .docx. */
  texto: string;
};

/** Forma del archivo .indice-ingles/indice.json. */
export type IndiceIngles = {
  version: number;
  generadoEn: string;
  ruta: string;
  totalDocumentos: number;
  documentos: EntradaIndiceIngles[];
};

export type ResumenBibliotecaIngles = {
  /** false si la carpeta no existe en el entorno actual. */
  existe: boolean;
  /** Ruta de visualización (la que se muestra en la interfaz). */
  ruta: string;
  /** Ruta absoluta resuelta (diagnóstico). */
  rutaAbsoluta: string;
  /** Total de archivos encontrados (incluye comprimidos). */
  totalArchivos: number;
  /** Total de documentos de planeación detectados (excluye comprimidos .zip). */
  totalDocumentos: number;
  /** Documentos efectivamente indexados (con texto extraído). */
  totalIndexados: number;
  /** Conteo por extensión, p. ej. { docx: 43, zip: 3 }. */
  porTipo: Record<string, number>;
  /** Listado completo de documentos detectados. */
  documentos: DocumentoIngles[];
  /** Fecha ISO de generación del índice, o null si no hay índice. */
  fechaIndice: string | null;
  /**
   * Indica si el índice está listo para consultarse: existe y cubre todos los
   * documentos detectados.
   */
  indiceListo: boolean;
};

function clasificarTipo(extension: string): TipoDocumento {
  switch (extension) {
    case "doc":
    case "docx":
    case "rtf":
    case "odt":
      return "word";
    case "pdf":
      return "pdf";
    case "zip":
    case "rar":
    case "7z":
      return "comprimido";
    case "txt":
    case "md":
      return "texto";
    case "ppt":
    case "pptx":
      return "presentacion";
    default:
      return "otro";
  }
}

// Recorre la carpeta de forma recursiva acumulando los archivos (no directorios).
async function listarArchivos(
  raiz: string,
  dir: string,
  acc: DocumentoIngles[],
): Promise<void> {
  const entradas = await fs.readdir(dir, { withFileTypes: true });
  for (const entrada of entradas) {
    const abs = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      await listarArchivos(raiz, abs, acc);
      continue;
    }
    if (!entrada.isFile()) continue;

    const rutaRelativa = path.relative(raiz, abs).split(path.sep).join("/");
    const extension = path.extname(entrada.name).slice(1).toLowerCase();
    let tamano = 0;
    try {
      tamano = (await fs.stat(abs)).size;
    } catch {
      tamano = 0;
    }

    acc.push({
      id: rutaRelativa,
      nombre: entrada.name,
      rutaRelativa,
      extension,
      tipo: clasificarTipo(extension),
      tamano,
      indexado: false,
    });
  }
}

/**
 * Lee el índice local (.indice-ingles/indice.json) si existe. Devuelve null si
 * no hay índice o está corrupto. Incluye el texto extraído de cada documento,
 * pensado para que una fase posterior lo use como base con Gemini.
 */
async function leerIndice(): Promise<IndiceIngles | null> {
  const abs = path.join(process.cwd(), RUTA_INDICE_INGLES);
  try {
    const crudo = await fs.readFile(abs, "utf8");
    const data = JSON.parse(crudo) as IndiceIngles;
    if (!Array.isArray(data?.documentos)) return null;
    return data;
  } catch {
    return null; // sin índice en este entorno
  }
}

/**
 * Lee la biblioteca histórica de inglés y devuelve un resumen estructurado.
 * Combina la detección de archivos en disco con el índice generado (si existe).
 * Tolerante: si la carpeta no existe, devuelve existe:false con cero documentos
 * (la interfaz lo maneja sin romperse).
 */
async function leer(): Promise<ResumenBibliotecaIngles> {
  const rutaAbsoluta = path.join(process.cwd(), RUTA_BIBLIOTECA_INGLES);

  const base: ResumenBibliotecaIngles = {
    existe: false,
    ruta: RUTA_BIBLIOTECA_INGLES,
    rutaAbsoluta,
    totalArchivos: 0,
    totalDocumentos: 0,
    totalIndexados: 0,
    porTipo: {},
    documentos: [],
    fechaIndice: null,
    indiceListo: false,
  };

  try {
    const stat = await fs.stat(rutaAbsoluta);
    if (!stat.isDirectory()) return base;
  } catch {
    return base; // carpeta ausente en este entorno
  }

  const documentos: DocumentoIngles[] = [];
  await listarArchivos(rutaAbsoluta, rutaAbsoluta, documentos);

  // Orden estable por ruta para una lista determinista.
  documentos.sort((a, b) => a.rutaRelativa.localeCompare(b.rutaRelativa));

  // Cruce con el índice: marca como indexados los documentos presentes en él.
  const indice = await leerIndice();
  const idsIndexados = new Set(indice?.documentos.map((d) => d.id) ?? []);
  for (const d of documentos) {
    if (idsIndexados.has(d.id)) d.indexado = true;
  }

  const porTipo: Record<string, number> = {};
  for (const d of documentos) {
    const clave = d.extension || "sin-extension";
    porTipo[clave] = (porTipo[clave] ?? 0) + 1;
  }

  // "Documentos" = planeaciones reales; los comprimidos (.zip) no se cuentan.
  const totalDocumentos = documentos.filter(
    (d) => d.tipo !== "comprimido",
  ).length;
  const totalIndexados = documentos.filter((d) => d.indexado).length;

  // El índice está "listo" si existe y cubre todos los documentos detectados.
  const indiceListo =
    !!indice && totalDocumentos > 0 && totalIndexados >= totalDocumentos;

  return {
    ...base,
    existe: true,
    totalArchivos: documentos.length,
    totalDocumentos,
    totalIndexados,
    porTipo,
    documentos,
    fechaIndice: indice?.generadoEn ?? null,
    indiceListo,
  };
}

/**
 * Servicio independiente de la biblioteca de inglés. Punto único de acceso al
 * corpus histórico para esta fase y las siguientes (indexación / Gemini).
 */
export const BibliotecaIngles = {
  ruta: RUTA_BIBLIOTECA_INGLES,
  leer,
  leerIndice,
  clasificarTipo,
};
