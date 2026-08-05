// Protección del currículo oficial — verifica que una presentación generada por
// IA no contenga temario inventado.
//
// POR QUÉ EXISTE
// --------------
// Un .pptx de esta app se proyecta en aula como si fuera el plan de estudios.
// El modelo (Claude/Gemini) recibe el programa oficial en el prompt y se le
// PIDE que no invente; pero "se lo pedimos en el prompt" no es una garantía:
// un módulo inventado, un objetivo redactado de más o una cita bibliográfica
// ajena no producen ningún error, ni log, ni 500. Salen impresos. Es el mismo
// modo de fallo que el "CRÉDITOS TOTALES: undefined" del F-32 (commit 6e9c412):
// el hueco no rompe nada, solo se proyecta.
//
// Este módulo es la comprobación ejecutable de esa regla. Es PURO: no hace red,
// no lee la API key, no toca el sistema de archivos. Se puede llamar desde una
// ruta y desde una prueba con el mismo resultado.
//
// QUÉ VALIDA (y qué NO)
// ---------------------
// Valida la ESTRUCTURA CURRICULAR que la presentación AFIRMA estar impartiendo:
//   - unidades   → "Unidad 7" tiene que existir en el programa.
//   - temas      → títulos de diapositiva, etiquetas, subtítulos, el centro y
//                  las ramas del mapa conceptual (la "agenda") y la raíz de un
//                  diagrama de árbol.
//   - objetivos  → lo que una diapositiva rotulada "Objetivos" declara.
//   - bibliografía → lo que la presentación cita como fuente.
//
// NO valida cada sustantivo de cada explicación. Un `definicion.titulo`
// ("Punto de inflamación"), un ejemplo o un ejercicio son DESARROLLO del tema
// oficial: exigir que aparezcan verbatim en el PDF marcaría como inventada
// cualquier clase bien dada. Un validador con ese ruido se desactiva a la
// semana, y entonces no protege nada. La línea es: reorganizar, reformular,
// acortar, traducir y ejemplificar es admisible; ANUNCIAR un tema, una unidad,
// un objetivo o una fuente que el programa no contiene, no.
//
// CÓMO COMPARA (y por qué no por igualdad de cadenas)
// ---------------------------------------------------
// Una comparación exacta produce falsos positivos inservibles: el programa dice
// "3.1 conceptos generales y efectos de la toxicidad" y la diapositiva dice
// "Efectos de la toxicidad". Aquí se normaliza (acentos, mayúsculas,
// puntuación, numeración "1.2 ") y se puntúa de 0 a 1:
//
//   1.0  si una cadena está contenida en la otra;
//   si no, COBERTURA DE TOKENS: qué fracción de las palabras con contenido de
//   la afirmación aparece en el elemento oficial más parecido. Dos palabras
//   "coinciden" si son iguales, si una es prefijo de la otra (buque/buques) o
//   si su similitud de bigramas ≥ 0.65 (gas/gases). Las palabras vacías
//   (de, la, the, of…) y las de armazón docente (agenda, práctica, cierre,
//   vocabulary, grammar…) se descartan antes de puntuar.
//
// UMBRALES (documentados a propósito; cambiarlos cambia qué se bloquea)
//   ≥ 0.60  UMBRAL_OK        → variación admisible. No se reporta.
//   ≥ 0.30  UMBRAL_SOSPECHA  → desviación BLANDA: se parece a algo oficial pero
//                              no lo suficiente. Se reporta, no bloquea.
//   < 0.30                   → desviación DURA: no guarda relación con ningún
//                              elemento del programa. Es temario inventado.
//
// 0.60 = "más de la mitad de las palabras con contenido salen del programa".
// Con títulos de 2–5 palabras (el caso real) eso significa que a lo sumo una
// palabra es aportación del modelo. 0.30 es el suelo por debajo del cual la
// coincidencia es casual (una palabra compartida de tres o más).
//
// CUANDO NO HAY PROGRAMA OFICIAL
// ------------------------------
// El veredicto NO es "válido". Es `estado: "sin_fuente"` con `valido: false`.
// Una materia sin programa cargado es exactamente el caso en el que el modelo
// tiene libertad total, es decir, el más peligroso: no se puede certificar como
// currículo oficial algo que no se comparó contra nada.

import type { ProgramaOficial } from "../data/tipos";
import { esProgramaOficial } from "../data/tipos";
import { TEMARIO_OFICIAL } from "../data/temarioInglesOficial";
import { PLANEACIONES_INGLES_ALMACENADAS } from "../data/inglesMaritimo";

/* ============================== Umbrales ================================== */

/** Cobertura a partir de la cual la afirmación se considera contenido oficial
 *  reformulado (variación admisible). */
export const UMBRAL_OK = 0.6;
/** Por debajo de esto no hay relación con el programa: temario inventado. */
export const UMBRAL_SOSPECHA = 0.3;
/**
 * Similitud de bigramas para dar dos palabras por equivalentes. 0.75 y no menos:
 * con 0.65, "trading" y "reading" (0.67, comparten -ading) contaban como la
 * misma palabra y una diapositiva de finanzas pasaba por temario de inglés.
 */
const UMBRAL_TOKEN = 0.75;

/* ================================ Tipos =================================== */

export type CategoriaOficial = "unidad" | "tema" | "objetivo" | "bibliografia";
export type Severidad = "dura" | "blanda";

export type Desviacion = {
  categoria: CategoriaOficial;
  severidad: Severidad;
  /** Código estable, para decidir en la ruta sin parsear textos. */
  motivo:
    | "unidad_inexistente"
    | "tema_inventado"
    | "tema_dudoso"
    | "tema_fuera_de_la_unidad"
    | "objetivo_inventado"
    | "objetivo_dudoso"
    | "sin_objetivos_oficiales"
    | "bibliografia_ajena"
    | "bibliografia_dudosa"
    | "bibliografia_no_verificable";
  /** Texto tal cual aparece en la presentación. */
  elemento: string;
  /** Índice 0-based de la diapositiva; -1 si no cuelga de ninguna. */
  diapositiva: number;
  /** Título de esa diapositiva (para localizarla sin contar). */
  tituloDiapositiva: string;
  /** Dónde dentro de la diapositiva: "titulo", "mapaConceptual.ramas[2]"… */
  ubicacion: string;
  /** Elemento oficial más parecido. null si esa categoría no tiene corpus. */
  comparadoCon: string | null;
  /** Similitud [0,1] contra `comparadoCon`. */
  similitud: number;
};

export type CorpusOficial = {
  /** Origen legible, para el log y el veredicto. */
  descripcion: string;
  /** Números de unidad/módulo válidos. Vacío ⇒ no se valida numeración. */
  unidades: number[];
  /** Unidad seleccionada, si la petición fijó una. */
  unidadSeleccionada: number | null;
  /** Temario oficial de la unidad seleccionada (o de todo el programa). */
  temasUnidad: string[];
  /** Resto del temario oficial del programa/nivel. */
  temasPrograma: string[];
  /** Objetivos oficiales aplicables (ya filtrados de "Pendiente de revisión"). */
  objetivos: string[];
  /** Bibliografía oficial. */
  bibliografia: string[];
};

export type FuenteOficial =
  | { ok: true; corpus: CorpusOficial }
  | { ok: false; motivo: string; detalle: string };

export type VeredictoOficial = {
  /** false si hay desviaciones DURAS o si no hubo contra qué comparar. */
  valido: boolean;
  estado: "ok" | "revisar" | "desviaciones" | "sin_fuente";
  fuente: string;
  desviaciones: Desviacion[];
  resumen: {
    /** Afirmaciones curriculares extraídas y puntuadas. */
    elementosRevisados: number;
    /** Afirmaciones descartadas por ser armazón docente (Agenda, Practice…). */
    elementosEstructurales: number;
    duras: number;
    blandas: number;
  };
};

/* ============================ Normalización =============================== */

/** Numeración de temario al principio de una cadena: "1.2 ", "3) ", "10.- ". */
const NUMERACION = /^\s*\d+(?:\.\d+)*\s*[.)\-–—]?\s+/;

/** Minúsculas, sin acentos, sin puntuación, sin numeración de temario. */
export function normalizar(s: string): string {
  return s
    .replace(NUMERACION, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Palabras vacías ES/EN de 3+ letras (las de 1–2 caen solas por longitud). */
const VACIAS = new Set([
  "del", "las", "los", "una", "unos", "unas", "con", "para", "por", "sus",
  "que", "como", "sobre", "entre", "otro", "otra", "otros", "otras", "mas",
  "sin", "ante", "tras", "son", "ser", "este", "esta", "estos", "estas",
  "cada", "todo", "toda", "todos", "todas", "sus", "the", "and", "for",
  "with", "from", "are", "was", "were", "this", "that", "these", "those",
  "its", "their", "you", "your", "our", "not", "any", "all", "into", "than",
  "then", "when", "what", "how", "why", "who",
]);

/**
 * Palabras de ARMAZÓN docente. No son temario: son cómo se organiza una clase.
 * Se quitan antes de puntuar, porque si no, "AGENDA" o "PRACTICE" arrastran la
 * cobertura hacia arriba o hacia abajo según qué haya en el PDF, que es ruido.
 * Una afirmación que se queda sin palabras tras este filtro es una diapositiva
 * de armazón (Agenda, Cierre, Thank you) y no se valida en absoluto.
 */
const ARMAZON = new Set([
  // Español
  "agenda", "objetivo", "objetivos", "proposito", "meta", "metas",
  "introduccion", "contenido", "contenidos", "temario", "indice", "desarrollo",
  "practica", "practicas", "ejercicio", "ejercicios", "evaluacion",
  "autoevaluacion", "cierre", "conclusion", "conclusiones", "resumen",
  "repaso", "recapitulacion", "bibliografia", "fuentes", "consulta",
  "referencias", "recursos", "materiales", "glosario", "notas", "nota",
  "preguntas", "pregunta", "dudas", "gracias", "aprendimos", "clave", "claves",
  "puntos", "tarea", "tareas", "actividad", "actividades", "ejemplo",
  "ejemplos", "aplicacion", "caso", "casos", "practico", "unidad", "unidades",
  "tema", "temas", "subtema", "subtemas", "semana", "semanas", "modulo",
  "modulos", "clase", "clases", "sesion", "leccion", "bienvenida", "portada",
  "presentacion", "inicio", "final", "siguiente", "anterior", "hoy",
  "criterios", "competencias", "instrucciones", "consigna", "diapositiva",
  "guiada", "guiado", "guiadas", "guiados", "dirigida", "dirigido",
  "individual", "parejas", "equipo", "grupal", "apertura", "encuadre",
  "diagnostico", "reflexion", "retroalimentacion", "manos", "obra",
  "mapa", "mapas", "conceptual", "esquema", "organizador", "diagrama",
  "parte", "partes", "participacion", "programa", "programas", "oficial",
  "oficiales", "fuente", "archivo", "documento", "pdf", "asignatura",
  // Inglés
  "objective", "objectives", "learning", "aim", "aims", "goal", "goals",
  "introduction", "outline", "contents", "overview", "warm", "lead", "wrap",
  "practice", "guided", "exercise", "exercises", "assessment", "evaluation",
  "closing", "summary", "recap", "review", "revision", "bibliography",
  "references", "sources", "resources", "materials", "glossary", "notes",
  "questions", "question", "thank", "thanks", "homework", "activity",
  "activities", "example", "examples", "application", "quiz", "test", "unit",
  "units", "topic", "topics", "week", "module", "modules", "lesson", "class",
  "session", "welcome", "today", "next", "key", "points", "vocabulary",
  "grammar", "speaking", "listening", "reading", "writing", "pronunciation",
  "functions", "skills", "language", "use", "culture", "cultural", "cross",
  "curricular", "instructions", "slide", "pair", "pairs", "group", "individual",
  "closure", "warmer", "starter", "exit", "ticket", "checkpoint", "part",
  "map", "concept", "chart", "syllabus", "official", "file", "document",
]);

/** Palabras con contenido de una cadena (sin vacías, sin números sueltos). */
function tokens(s: string, quitarArmazon: boolean): string[] {
  return normalizar(s)
    .split(" ")
    .filter(
      (t) =>
        t.length >= 3 &&
        !/^\d+$/.test(t) &&
        !VACIAS.has(t) &&
        (!quitarArmazon || !ARMAZON.has(t)),
    );
}

function bigramas(s: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + 1 < s.length; i++) out.add(s.slice(i, i + 2));
  return out;
}

function dice(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return (2 * inter) / (a.size + b.size);
}

/** ¿Dos palabras son la misma palabra? (plural, derivación, tilde perdida). */
function tokensCoinciden(a: string, b: string): boolean {
  if (a === b) return true;
  const corto = a.length <= b.length ? a : b;
  const largo = corto === a ? b : a;
  // Prefijo: buque/buques, carga/cargamento, gas/gases. El límite de 3 letras
  // extra evita que una raíz corta se coma media lengua ("mar"/"marketing").
  if (largo.startsWith(corto) && corto.length >= 4) return true;
  if (largo.startsWith(corto) && corto.length === 3 && largo.length - corto.length <= 3)
    return true;
  return dice(bigramas(a), bigramas(b)) >= UMBRAL_TOKEN;
}

/**
 * Similitud [0,1] de una afirmación contra UN elemento oficial.
 * 1.0 si una contiene a la otra; si no, fracción de palabras con contenido de
 * la afirmación que aparecen en el elemento oficial.
 */
export function similitud(afirmacion: string, oficial: string): number {
  const a = normalizar(afirmacion);
  const o = normalizar(oficial);
  if (!a || !o) return 0;
  if (o.includes(a) || a.includes(o)) return 1;

  const ta = tokens(afirmacion, true);
  const to = tokens(oficial, false);
  if (ta.length === 0 || to.length === 0) return 0;

  let aciertos = 0;
  for (const x of ta) if (to.some((y) => tokensCoinciden(x, y))) aciertos++;
  return aciertos / ta.length;
}

/** Mejor coincidencia de una afirmación dentro de un corpus. */
function mejorCoincidencia(
  afirmacion: string,
  corpus: readonly string[],
): { texto: string | null; puntaje: number } {
  let texto: string | null = null;
  let puntaje = 0;
  for (const c of corpus) {
    const s = similitud(afirmacion, c);
    if (s > puntaje) {
      puntaje = s;
      texto = c;
    }
    if (puntaje >= 1) break;
  }
  return { texto, puntaje };
}

/**
 * ¿TODAS las palabras con contenido de la afirmación aparecen en algún punto
 * del programa, aunque no juntas en un mismo renglón?
 *
 * Es la diferencia entre RECOMBINAR y INVENTAR, y hace falta por un caso real:
 * la dosificación de Inglés está redactada en español y reparte los términos
 * entre 18 semanas, mientras que la presentación va English-only y agrupa. Un
 * título cuyas palabras salen todas del programa es, como mucho, dudoso; nunca
 * es temario nuevo. Se usa SOLO para rebajar una desviación dura a blanda,
 * nunca para dar por buena una afirmación.
 */
function todasLasPalabrasSonOficiales(
  afirmacion: string,
  vocabulario: Set<string>,
): boolean {
  const ta = tokens(afirmacion, true);
  if (ta.length === 0) return false;
  const todos = [...vocabulario];
  return ta.every((x) => todos.some((y) => tokensCoinciden(x, y)));
}

/* ======================== Construcción del corpus ========================= */

/** "Pendiente de revisión" es un hueco del extractor de PDFs, no un objetivo. */
const esRelleno = (s: string): boolean =>
  !s.trim() || /^pendiente de revisi/i.test(s.trim());

const limpio = (xs: readonly string[]): string[] =>
  xs.map((x) => (x ?? "").trim()).filter((x) => !esRelleno(x));

/**
 * Corpus oficial de una materia PN/MN. `unidadNumero` acota el temario de la
 * unidad; el resto del programa queda como "temasPrograma" para poder
 * distinguir un tema oficial de OTRA unidad (desviación blanda: es currículo
 * real, solo mal colocado) de uno inventado (dura).
 */
export function fuenteDesdePrograma(
  programa: unknown,
  unidadNumero?: number,
): FuenteOficial {
  if (!esProgramaOficial(programa)) {
    return {
      ok: false,
      motivo: "sin_programa_oficial",
      detalle:
        "La materia no tiene programa oficial cargado: no hay contra qué comparar.",
    };
  }
  const p = programa as ProgramaOficial;
  const unidades = p.unidades.map((u) => u.numero);
  const sel =
    typeof unidadNumero === "number"
      ? (p.unidades.find((u) => u.numero === unidadNumero) ?? null)
      : null;

  if (typeof unidadNumero === "number" && !sel) {
    return {
      ok: false,
      motivo: "unidad_inexistente",
      detalle: `La unidad ${unidadNumero} no existe en el programa ${p.clave}.`,
    };
  }

  const temasDe = (u: ProgramaOficial["unidades"][number]) => [
    u.tema,
    ...u.subtemas,
  ];

  // La unidad transversal ("Contenidos de actualidad del sector marítimo
  // portuario") no trae subtemas a propósito: su contenido lo elige el docente.
  // Validar un deck suyo contra un corpus de una línea marcaría todo como
  // inventado, así que se apoya en el programa entero.
  const temasUnidad = sel
    ? sel.transversal
      ? limpio([...temasDe(sel), p.nombre, ...p.unidades.flatMap(temasDe)])
      : limpio(temasDe(sel))
    : limpio([p.nombre, ...p.unidades.flatMap(temasDe)]);

  const temasPrograma = limpio([
    p.nombre,
    ...p.unidades.flatMap(temasDe),
  ]).filter((t) => !temasUnidad.includes(t));

  return {
    ok: true,
    corpus: {
      descripcion: `Programa oficial ${p.clave} — ${p.nombre}${sel ? ` · Unidad ${sel.numero}` : ""}`,
      unidades,
      unidadSeleccionada: sel?.numero ?? null,
      temasUnidad,
      temasPrograma,
      objetivos: limpio([
        p.objetivoGeneral,
        ...(sel ? [sel.objetivoEspecifico] : p.unidades.map((u) => u.objetivoEspecifico)),
      ]),
      bibliografia: limpio(p.bibliografia),
    },
  };
}

/**
 * Corpus oficial de un nivel de Inglés. Dos orígenes, en el mismo orden de
 * precedencia que /api/presentacion-ingles:
 *   1. dosificación ALMACENADA (niveles 1–3, StartUp);
 *   2. TEMARIO_OFICIAL por módulos (hoy el 8, iDiscover).
 * Un nivel que se espeja de históricas (4–7) NO tiene temario declarado en el
 * repo: no hay fuente de verdad estructurada y el veredicto es "sin_fuente".
 */
export function fuenteDesdeNivelIngles(nivel: string): FuenteOficial {
  const n = String(nivel ?? "").trim();
  const alm = Object.prototype.hasOwnProperty.call(
    PLANEACIONES_INGLES_ALMACENADAS,
    n,
  )
    ? PLANEACIONES_INGLES_ALMACENADAS[n]
    : null;

  if (alm) {
    const temas = limpio(
      alm.secuenciaSemanal.flatMap((s) => [
        s.contenido,
        ...s.actividades,
        s.evidencias,
        ...s.recursos,
      ]),
    );
    return {
      ok: true,
      corpus: {
        descripcion: `Dosificación oficial almacenada — ${alm.nombre} (${alm.libro})`,
        unidades: alm.secuenciaSemanal.map((s) => s.semana),
        unidadSeleccionada: null,
        temasUnidad: temas,
        temasPrograma: [],
        objetivos: limpio([alm.objetivoGeneral, ...alm.objetivosEspecificos]),
        bibliografia: limpio([...alm.bibliografia, alm.libro]),
      },
    };
  }

  const t = Object.prototype.hasOwnProperty.call(TEMARIO_OFICIAL, n)
    ? TEMARIO_OFICIAL[n]
    : null;
  if (!t || t.modulos.length === 0) {
    return {
      ok: false,
      motivo: "sin_temario_oficial",
      detalle: `El nivel "${n}" no tiene temario oficial ni dosificación almacenada en el repositorio.`,
    };
  }

  const temas = limpio(
    t.modulos.flatMap((m) => [
      m.titulo,
      ...m.gramatica,
      ...m.vocabulario,
      ...m.lecturaEscucha,
      ...m.produccionOral,
      ...m.escritura,
      ...m.cultura,
      ...m.cierre,
    ]),
  );

  return {
    ok: true,
    corpus: {
      descripcion: `Temario oficial del Nivel ${n} — ${t.libro}`,
      unidades: t.modulos.map((m) => m.numero),
      unidadSeleccionada: null,
      temasUnidad: temas,
      temasPrograma: [],
      objetivos: [],
      bibliografia: limpio([t.libro]),
    },
  };
}

/* ====================== Extracción de afirmaciones ======================== */

type Afirmacion = {
  categoria: Exclude<CategoriaOficial, "unidad">;
  texto: string;
  diapositiva: number;
  tituloDiapositiva: string;
  ubicacion: string;
};

const REGEX_BIBLIOGRAFIA =
  /\b(bibliograf|fuentes de consulta|referencias|bibliography|references|sources|works cited)/;
const REGEX_OBJETIVOS =
  /\b(objetivo|objetivos|proposito|objective|objectives|learning aims?|goals?)\b/;
const REGEX_UNIDAD = /\b(?:unidad|unit|modulo|module)\s+(\d{1,2})\b/g;

/** ¿Este texto suelto es una cita bibliográfica? (ISBN, año entre paréntesis,
 *  o una editorial reconocible). Sirve para cazar una fuente ajena colada en
 *  una diapositiva que no se llama "Bibliografía". */
function pareceCita(s: string): boolean {
  if (/\bisbn\b/i.test(s)) return true;
  if (/\(\s*(?:1[5-9]|20)\d{2}[a-z]?\s*\)/.test(s)) return true;
  return /\b(editorial|publishing|press|mcgraw|prentice|pearson|elsevier|wiley|springer|routledge)\b/i.test(
    s,
  );
}

const esTexto = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

const comoArreglo = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const comoRegistro = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

/**
 * Extrae de la presentación lo que AFIRMA sobre el currículo. Tolera entrada
 * arbitraria (`unknown`) porque también debe poder correr sobre el JSON crudo
 * del modelo, antes del saneamiento de esquemaPresentacion.
 */
export function extraerAfirmaciones(presentacion: unknown): Afirmacion[] {
  const root = comoRegistro(presentacion);
  const diapositivas = comoArreglo(root.diapositivas);
  const out: Afirmacion[] = [];

  diapositivas.forEach((dRaw, i) => {
    const d = comoRegistro(dRaw);
    const titulo = esTexto(d.titulo) ? d.titulo.trim() : "";
    const layout = esTexto(d.layout) ? d.layout : "contenido";
    const etiqueta = esTexto(d.etiqueta) ? d.etiqueta.trim() : "";
    const subtitulo = esTexto(d.subtitulo) ? d.subtitulo.trim() : "";
    const rotulo = normalizar(`${titulo} ${etiqueta}`);

    const esBiblio = REGEX_BIBLIOGRAFIA.test(rotulo);
    const esObjetivos = !esBiblio && REGEX_OBJETIVOS.test(rotulo);

    const push = (
      categoria: Afirmacion["categoria"],
      texto: string,
      ubicacion: string,
    ) => {
      if (!esTexto(texto)) return;
      out.push({
        categoria,
        texto: texto.trim(),
        diapositiva: i,
        tituloDiapositiva: titulo || `(diapositiva ${i + 1})`,
        ubicacion,
      });
    };

    // La portada y el cierre no anuncian temario: son marco.
    const marco = layout === "portada" || layout === "cierre";
    if (!marco && !esBiblio && !esObjetivos) {
      push("tema", titulo, "titulo");
      push("tema", subtitulo, "subtitulo");
      push("tema", etiqueta, "etiqueta");
    }

    comoArreglo(d.bloques).forEach((bRaw, j) => {
      const b = comoRegistro(bRaw);
      const tipo = esTexto(b.tipo) ? b.tipo : "";
      const donde = `bloques[${j}].`;

      const textosPlanos: string[] = [];
      if (esTexto(b.texto)) textosPlanos.push(b.texto);
      for (const it of comoArreglo(b.items)) if (esTexto(it)) textosPlanos.push(it);
      for (const et of comoArreglo(b.etapas)) if (esTexto(et)) textosPlanos.push(et);
      for (const f of comoArreglo(b.filas))
        for (const c of comoArreglo(f)) if (esTexto(c)) textosPlanos.push(c);

      if (esBiblio) {
        // En una diapositiva de bibliografía, las ENTRADAS son la lista (bullets,
        // tabla, definición). Un bloque `nota` es el aviso al pie ("Referencias
        // del programa oficial (…pdf)"), no una fuente: tratarlo como cita
        // marcaba como "bibliografía ajena" el propio pie de página del
        // generador determinista. Si la nota SÍ contiene una cita, la caza el
        // heurístico `pareceCita` de abajo.
        textosPlanos.forEach((t, k) => {
          if (tipo === "nota" && !pareceCita(t)) return;
          push("bibliografia", t, `${donde}${tipo}[${k}]`);
        });
        return;
      }
      if (esObjetivos) {
        textosPlanos.forEach((t, k) =>
          push("objetivo", t, `${donde}${tipo}[${k}]`),
        );
        return;
      }

      // Cita bibliográfica colada fuera de la diapositiva de bibliografía.
      textosPlanos.forEach((t, k) => {
        if (pareceCita(t)) push("bibliografia", t, `${donde}${tipo}[${k}]`);
      });

      // La agenda de la clase — el índice de lo que se va a impartir.
      if (tipo === "mapaConceptual") {
        push("tema", esTexto(b.centro) ? b.centro : "", `${donde}centro`);
        comoArreglo(b.ramas).forEach((rRaw, k) => {
          const r = comoRegistro(rRaw);
          push("tema", esTexto(r.titulo) ? r.titulo : "", `${donde}ramas[${k}]`);
        });
      }
      if (tipo === "diagramaArbol") {
        push("tema", esTexto(b.raiz) ? b.raiz : "", `${donde}raiz`);
      }
    });
  });

  return out;
}

/** Números de unidad que la presentación dice estar impartiendo. */
function unidadesAfirmadas(
  presentacion: unknown,
): { numero: number; diapositiva: number; tituloDiapositiva: string; ubicacion: string }[] {
  const root = comoRegistro(presentacion);
  const out: ReturnType<typeof unidadesAfirmadas> = [];
  comoArreglo(root.diapositivas).forEach((dRaw, i) => {
    const d = comoRegistro(dRaw);
    const titulo = esTexto(d.titulo) ? d.titulo.trim() : "";
    for (const campo of ["titulo", "subtitulo", "etiqueta"] as const) {
      const v = d[campo];
      if (!esTexto(v)) continue;
      const texto = normalizar(v);
      REGEX_UNIDAD.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = REGEX_UNIDAD.exec(texto)) !== null) {
        out.push({
          numero: Number(m[1]),
          diapositiva: i,
          tituloDiapositiva: titulo || `(diapositiva ${i + 1})`,
          ubicacion: campo,
        });
      }
    }
  });
  return out;
}

/* =============================== Veredicto ================================ */

/**
 * Contrasta una presentación generada contra el contenido oficial de su
 * materia/unidad (o nivel de Inglés). Pura: mismo entrada ⇒ misma salida.
 *
 * @param presentacion  PresentacionV2, PresentacionIA o el JSON crudo del modelo.
 * @param fuente        corpus oficial (ver `fuenteDesdePrograma` /
 *                      `fuenteDesdeNivelIngles`).
 */
export function validarPresentacionOficial(
  presentacion: unknown,
  fuente: FuenteOficial,
): VeredictoOficial {
  if (!fuente.ok) {
    return {
      valido: false,
      estado: "sin_fuente",
      fuente: fuente.detalle,
      desviaciones: [],
      resumen: {
        elementosRevisados: 0,
        elementosEstructurales: 0,
        duras: 0,
        blandas: 0,
      },
    };
  }

  const c = fuente.corpus;
  const desviaciones: Desviacion[] = [];
  let revisados = 0;
  let estructurales = 0;

  // Vocabulario oficial completo (temario + objetivos): ver
  // `todasLasPalabrasSonOficiales`.
  const vocabulario = new Set<string>();
  for (const t of [...c.temasUnidad, ...c.temasPrograma, ...c.objetivos])
    for (const w of tokens(t, false)) vocabulario.add(w);

  /* --- 1. Unidades: comprobación exacta, no hay nada difuso que ponderar --- */
  if (c.unidades.length > 0) {
    for (const u of unidadesAfirmadas(presentacion)) {
      if (c.unidades.includes(u.numero)) continue;
      revisados++;
      desviaciones.push({
        categoria: "unidad",
        severidad: "dura",
        motivo: "unidad_inexistente",
        elemento: `Unidad ${u.numero}`,
        diapositiva: u.diapositiva,
        tituloDiapositiva: u.tituloDiapositiva,
        ubicacion: u.ubicacion,
        comparadoCon: `Unidades del programa: ${c.unidades.join(", ")}`,
        similitud: 0,
      });
    }
  }

  /* --- 2/3/4. Temas, objetivos y bibliografía: cobertura contra su corpus -- */
  const vistas = new Set<string>();
  let objetivosSinCorpusAvisado = false;

  for (const a of extraerAfirmaciones(presentacion)) {
    // Sin palabras con contenido tras quitar el armazón docente, la afirmación
    // es "AGENDA", "Practice", "Thank you": marco de la clase, no temario.
    // "Pendiente de revisión" es un hueco del extractor de PDFs que el generador
    // determinista arrastra a los títulos: es un dato que falta, no un tema
    // inventado, y llamarlo invención esconde el problema real.
    if (esRelleno(a.texto) || tokens(a.texto, true).length === 0) {
      estructurales++;
      continue;
    }
    const huella = `${a.categoria}|${a.diapositiva}|${normalizar(a.texto)}`;
    if (vistas.has(huella)) continue;
    vistas.add(huella);
    revisados++;

    const base = {
      elemento: a.texto,
      diapositiva: a.diapositiva,
      tituloDiapositiva: a.tituloDiapositiva,
      ubicacion: a.ubicacion,
    };

    if (a.categoria === "tema") {
      const enUnidad = mejorCoincidencia(a.texto, c.temasUnidad);
      if (enUnidad.puntaje >= UMBRAL_OK) continue;

      // ¿Es currículo real, pero de otra unidad? Eso no es inventar: es un tema
      // oficial mal colocado. Se reporta blando para que se vea, no se bloquea.
      const enPrograma = mejorCoincidencia(a.texto, c.temasPrograma);
      if (enPrograma.puntaje >= UMBRAL_OK) {
        desviaciones.push({
          ...base,
          categoria: "tema",
          severidad: "blanda",
          motivo: "tema_fuera_de_la_unidad",
          comparadoCon: enPrograma.texto,
          similitud: enPrograma.puntaje,
        });
        continue;
      }

      const mejor =
        enPrograma.puntaje > enUnidad.puntaje ? enPrograma : enUnidad;
      const dura =
        mejor.puntaje < UMBRAL_SOSPECHA &&
        !todasLasPalabrasSonOficiales(a.texto, vocabulario);
      desviaciones.push({
        ...base,
        categoria: "tema",
        severidad: dura ? "dura" : "blanda",
        motivo: dura ? "tema_inventado" : "tema_dudoso",
        comparadoCon: mejor.texto,
        similitud: mejor.puntaje,
      });
      continue;
    }

    if (a.categoria === "objetivo") {
      if (c.objetivos.length === 0) {
        // El programa no registra objetivos (o dice "Pendiente de revisión").
        // No se puede llamar inventado a lo que no tiene contra qué medirse,
        // pero tampoco se da por bueno: un aviso, una sola vez.
        if (!objetivosSinCorpusAvisado) {
          objetivosSinCorpusAvisado = true;
          desviaciones.push({
            ...base,
            categoria: "objetivo",
            severidad: "blanda",
            motivo: "sin_objetivos_oficiales",
            comparadoCon: null,
            similitud: 0,
          });
        }
        continue;
      }
      const m = mejorCoincidencia(a.texto, [...c.objetivos, ...c.temasUnidad]);
      if (m.puntaje >= UMBRAL_OK) continue;
      const dura =
        m.puntaje < UMBRAL_SOSPECHA &&
        !todasLasPalabrasSonOficiales(a.texto, vocabulario);
      desviaciones.push({
        ...base,
        categoria: "objetivo",
        severidad: dura ? "dura" : "blanda",
        motivo: dura ? "objetivo_inventado" : "objetivo_dudoso",
        comparadoCon: m.texto,
        similitud: m.puntaje,
      });
      continue;
    }

    // bibliografia
    if (c.bibliografia.length === 0) {
      desviaciones.push({
        ...base,
        categoria: "bibliografia",
        severidad: "blanda",
        motivo: "bibliografia_no_verificable",
        comparadoCon: null,
        similitud: 0,
      });
      continue;
    }
    const m = mejorCoincidencia(a.texto, c.bibliografia);
    if (m.puntaje >= UMBRAL_OK) continue;
    const dura = m.puntaje < UMBRAL_SOSPECHA;
    desviaciones.push({
      ...base,
      categoria: "bibliografia",
      severidad: dura ? "dura" : "blanda",
      motivo: dura ? "bibliografia_ajena" : "bibliografia_dudosa",
      comparadoCon: m.texto,
      similitud: m.puntaje,
    });
  }

  const duras = desviaciones.filter((d) => d.severidad === "dura").length;
  const blandas = desviaciones.length - duras;

  return {
    valido: duras === 0,
    estado: duras > 0 ? "desviaciones" : blandas > 0 ? "revisar" : "ok",
    fuente: c.descripcion,
    desviaciones,
    resumen: {
      elementosRevisados: revisados,
      elementosEstructurales: estructurales,
      duras,
      blandas,
    },
  };
}

/** Resumen de una línea por desviación, para `console.warn` en la ruta. */
export function resumirVeredicto(v: VeredictoOficial): string {
  if (v.estado === "sin_fuente") return `sin fuente oficial: ${v.fuente}`;
  if (v.desviaciones.length === 0) return `sin desviaciones (${v.fuente})`;
  return v.desviaciones
    .map(
      (d) =>
        `[${d.severidad}/${d.motivo}] diapositiva ${d.diapositiva + 1} "${d.tituloDiapositiva}" · ${d.ubicacion} · "${d.elemento}" ` +
        `(mejor coincidencia oficial: ${d.comparadoCon ? `"${d.comparadoCon}" ${d.similitud.toFixed(2)}` : "ninguna"})`,
    )
    .join("\n");
}
