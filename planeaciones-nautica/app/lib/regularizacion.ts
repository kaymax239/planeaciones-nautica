// Regularización académica (FID-FOR-IT-07): arma los datos del Plan Estratégico
// de Recuperación (FID-FOR-F-05) y de la Lista de Asistencia de Regularización
// (FID-FOR-F-04) a partir de las semanas de la planeación que el cadete no cursó.
//
// Caso que lo motivó: los cadetes comisionados un mes a Operación Patria
// (ago–sep 2026) regularizan en todas las materias. Es GENÉRICO: recibe las
// semanas ya resueltas (PN/MN desde el programa oficial, o Inglés desde su
// secuencia) y no sabe de dónde salen. Los temas NO se inventan: son los mismos
// que imprime el F-32 para esas semanas.
//
// Plantillas: public/templates/Regularizacion-F05.docx y -F04.docx, generadas
// con scripts/crear-plantillas-regularizacion.mjs desde los formatos del Drive.

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { OPCIONES_DOCX } from "./opcionesDocx";

/** Semana de la planeación candidata a recuperarse. */
export type SemanaRegularizacion = {
  numero: number;
  /** Etiqueta de fechas, p. ej. "Semana 3\n17–22 ago 2026". */
  etiqueta: string;
  /** Tema tal como sale en el F-32 ("Unidad 1: …\n1.1 …\n1.2 …"). */
  tema: string;
  /** Objetivo específico de la unidad a la que pertenece la semana. */
  objetivoUnidad?: string;
};

export type DatosRegularizacion = {
  asignatura: string;
  docente: string;
  /** Texto de la columna "Semestre" del F-04 (grupo o semestre). */
  grupo: string;
  estudiantes: string[];
  semanas: SemanaRegularizacion[];
  /** Fechas de las sesiones de regularización, en orden. */
  sesiones: Date[];
  /** Horario libre, p. ej. "10:00 a 13:00 hrs". Opcional. */
  horario: string;
  /** Periodo de evaluación al que se integra: 1, 2 o 3. */
  periodoEvaluacion: 1 | 2 | 3;
  objetivoGeneral: string;
  /** Ponderación oficial (DEN) de la materia, si se conoce. */
  ponderacion?: string;
  jefeCarrera: string;
  subdirector: string;
};

/** Firmantes por carrera (editables en la pantalla). Fuente: F-05 firmados
 *  en 2026 (Drive, carpeta Regularizaciones académicas E-J_2026-ENMT). */
export const FIRMANTES_REGULARIZACION = {
  PN: { jefeCarrera: "Cap. Alt. Agustín Álvarez Medina" },
  MN: { jefeCarrera: "IMN Gerardo García González" },
  subdirector: "Ing. M.N. Eduardo Asunción Jiménez Lino",
};

/** Semanas no cursadas por los cadetes de Operación Patria (≈17 ago–16 sep
 *  2026): semanas 3 a 7 del calendario Ago–Dic. El docente puede ajustarlas. */
export const SEMANAS_PATRIA = [3, 4, 5, 6, 7];

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Lunes 21, martes 22 y miércoles 23 de septiembre de 2026" (agrupa por mes). */
export function textoFechasSesiones(fechas: Date[]): string {
  if (fechas.length === 0) return "";
  const orden = [...fechas].sort((a, b) => a.getTime() - b.getTime());
  const grupos: Date[][] = [];
  for (const f of orden) {
    const g = grupos[grupos.length - 1];
    if (g && g[0].getMonth() === f.getMonth() && g[0].getFullYear() === f.getFullYear()) g.push(f);
    else grupos.push([f]);
  }
  const partes = grupos.map((g) => {
    const dias = g.map((f) => `${DIAS[f.getDay()]} ${f.getDate()}`);
    const lista =
      dias.length > 1 ? `${dias.slice(0, -1).join(", ")} y ${dias[dias.length - 1]}` : dias[0];
    return `${lista} de ${MESES[g[0].getMonth()]} de ${g[0].getFullYear()}`;
  });
  return cap(partes.join("; "));
}

/** "21/09/26" para la columna Fecha del F-04 (angosta: el año largo se parte). */
export const fechaCorta = (f: Date) =>
  `${String(f.getDate()).padStart(2, "0")}/${String(f.getMonth() + 1).padStart(2, "0")}/${String(f.getFullYear()).slice(-2)}`;

/** Primera línea del tema sin el sufijo "(cont.)" → título de la unidad. */
const tituloTema = (t: string) => t.split("\n")[0]?.trim() ?? "";

/** Líneas de subtemas del tema (todo menos el título). */
const subtemas = (t: string) =>
  t
    .split("\n")
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean);

/** Primera línea de la etiqueta ("Semana 3") + rango de fechas si lo trae. */
const semanaCorta = (s: SemanaRegularizacion) =>
  s.etiqueta.split("\n").filter(Boolean).slice(0, 2).join(", ");

/**
 * Reparte las semanas a recuperar entre las sesiones, en bloques contiguos lo
 * más parejos posible. Si hay más sesiones que semanas, las sesiones sobrantes
 * se dedican a repaso integrador y entrega de productos.
 */
export function repartirEnSesiones(
  semanas: SemanaRegularizacion[],
  numSesiones: number,
): SemanaRegularizacion[][] {
  if (numSesiones <= 0) return [];
  const orden = [...semanas].sort((a, b) => a.numero - b.numero);
  const n = Math.min(numSesiones, Math.max(orden.length, 1));
  const res: SemanaRegularizacion[][] = [];
  const base = Math.floor(orden.length / n);
  let extra = orden.length % n;
  let i = 0;
  for (let g = 0; g < n; g++) {
    const size = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    res.push(orden.slice(i, i + size));
    i += size;
  }
  while (res.length < numSesiones) res.push([]);
  return res;
}

const REPASO = "Repaso integrador, resolución de dudas y entrega de productos de recuperación.";

/** Tema de UNA sesión para la columna Tema del F-04 (breve, una línea por semana). */
export function temaSesion(bloque: SemanaRegularizacion[]): string {
  if (bloque.length === 0) return REPASO;
  return bloque
    .map((s) => {
      const titulo = tituloTema(s.tema).replace(/\s*\(cont\.\)\s*$/, "");
      const subs = subtemas(s.tema);
      const detalle = subs.length ? ` — ${subs.map((x) => x.replace(/^\d+(\.\d+)*\.?\s*/, "").replace(/\.\s*$/, "")).join("; ")}` : "";
      return `${titulo}${detalle}`;
    })
    .join("\n");
}

const ESTRATEGIAS_ENSENANZA =
  "Activación de conocimientos previos, exposición guiada de los temas no cursados, resolución de ejercicios modelo, aprendizaje situado, asesoría individual y retroalimentación continua.";
const ESTRATEGIAS_APRENDIZAJE =
  "Repaso dirigido de los contenidos, resolución de ejercicios y cuestionarios, elaboración de resúmenes u organizadores gráficos, trabajo colaborativo y autoevaluación.";
const PRODUCTOS =
  "Por cada tema recuperado: ejercicios resueltos, cuestionario o resumen y evidencia de la sesión, integrados al portafolio del cadete.";

const ORDINAL = { 1: "primer", 2: "segundo", 3: "tercer" } as const;

/** Objeto de render para Regularizacion-F05.docx (Plan Estratégico de Recuperación). */
export function construirDatosF05(d: DatosRegularizacion) {
  const semanas = [...d.semanas].sort((a, b) => a.numero - b.numero);

  const objetivos = [
    ...new Set(
      semanas
        .map((s) => s.objetivoUnidad?.trim() ?? "")
        .filter((o) => o && !/pendiente de revisi/i.test(o)),
    ),
  ];
  const resultadoAprendizaje = objetivos.length
    ? objetivos.join("\n")
    : d.objetivoGeneral || `Recuperar los aprendizajes de ${d.asignatura}.`;

  const contenidos = semanas
    .map((s) => `${semanaCorta(s)}: ${s.tema.trim()}`)
    .join("\n");

  const planEvaluacion = [
    "Lista de cotejo de los productos de recuperación.",
    `Los resultados se integran al ${ORDINAL[d.periodoEvaluacion]} periodo de evaluación` +
      (d.ponderacion ? ` conforme a la ponderación oficial: ${d.ponderacion}.` : "."),
  ].join("\n");

  const horario = d.horario.trim();
  const diasSesiones = [textoFechasSesiones(d.sesiones), horario].filter(Boolean).join(".\n") + (d.sesiones.length ? "." : "");

  const nombres: Record<string, string> = {};
  d.estudiantes.forEach((e, i) => {
    nombres[`e${i + 1}`] = e;
  });

  return {
    ...nombres,
    asignatura: d.asignatura,
    marca1: d.periodoEvaluacion === 1 ? "☒" : "☐",
    marca2: d.periodoEvaluacion === 2 ? "☒" : "☐",
    marca3: d.periodoEvaluacion === 3 ? "☒" : "☐",
    diasSesiones,
    numSesiones: String(d.sesiones.length),
    docente: d.docente,
    resultadoAprendizaje,
    contenidos,
    competencias: d.objetivoGeneral,
    estrategiasEnsenanza: ESTRATEGIAS_ENSENANZA,
    estrategiasAprendizaje: ESTRATEGIAS_APRENDIZAJE,
    productos: PRODUCTOS,
    planEvaluacion,
    jefeCarrera: d.jefeCarrera,
    subdirector: d.subdirector,
  };
}

/** Objeto de render para Regularizacion-F04.docx: un renglón por sesión × cadete,
 *  agrupado por sesión (así cada sesión se firma en bloque). */
export function construirDatosF04(d: DatosRegularizacion) {
  const sesiones = [...d.sesiones].sort((a, b) => a.getTime() - b.getTime());
  const bloques = repartirEnSesiones(d.semanas, sesiones.length);
  const filas = sesiones.flatMap((fecha, i) =>
    d.estudiantes.map((nombre) => ({
      nombre,
      semestre: d.grupo,
      fecha: fechaCorta(fecha),
      tema: temaSesion(bloques[i] ?? []),
    })),
  );
  return { docente: d.docente, asignatura: d.asignatura, filas };
}

/**
 * La plantilla F-05 trae 8 renglones de estudiantes. Para grupos más grandes se
 * clona el renglón 8 (sus celdas derechas son continuación de celdas
 * combinadas, así que la combinación se extiende sola) y se numeran 9, 10, …
 */
export function ampliarFilasF05(xml: string, total: number): string {
  if (total <= 8) return xml;
  const tbl = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)?.[0];
  if (!tbl) return xml;
  const fila8 = [...tbl.matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)]
    .map((m) => m[0])
    .find((tr) => tr.includes("{e8}"));
  if (!fila8) return xml;
  const extra = Array.from({ length: total - 8 }, (_, k) => {
    const n = 9 + k;
    return fila8
      .replace("{e8}", `{e${n}}`)
      .replace(/(<w:t(?: [^>]*)?>)8(<\/w:t>)/, `$1${n}$2`);
  }).join("");
  return xml.replace(tbl, tbl.replace(fila8, fila8 + extra));
}

const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Rellena ambas plantillas y devuelve los .docx listos (bytes). */
export function renderizarRegularizacion(
  plantillaF05: ArrayBuffer,
  plantillaF04: ArrayBuffer,
  d: DatosRegularizacion,
): { f05: Uint8Array; f04: Uint8Array } {
  const zip05 = new PizZip(plantillaF05);
  const xml05 = zip05.file("word/document.xml")?.asText() ?? "";
  zip05.file("word/document.xml", ampliarFilasF05(xml05, d.estudiantes.length));
  const doc05 = new Docxtemplater(zip05, { ...OPCIONES_DOCX });
  doc05.render(construirDatosF05(d));

  const doc04 = new Docxtemplater(new PizZip(plantillaF04), { ...OPCIONES_DOCX });
  doc04.render(construirDatosF04(d));

  const opts = { type: "uint8array" as const, mimeType: MIME_DOCX, compression: "DEFLATE" as const };
  return {
    f05: doc05.getZip().generate(opts),
    f04: doc04.getZip().generate(opts),
  };
}

/** Lista de nombres pegada (uno por renglón; tolera numeración y tabuladores). */
export function parsearEstudiantes(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((l) =>
      l
        .replace(/^\s*\d+[.)-]?\s+/, "")
        .split("\t")
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

/** Lunes de la semana de `hoy` y los cinco días hábiles. */
export function diasHabilesDeLaSemana(hoy: Date): Date[] {
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dow = lunes.getDay();
  lunes.setDate(lunes.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 5 }, (_, i) => {
    const f = new Date(lunes);
    f.setDate(lunes.getDate() + i);
    return f;
  });
}
