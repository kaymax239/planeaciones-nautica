// Ingestión del lote Enero–Junio 2026 (semestres PARES: 2,4,6,8).
//
// Extiende el corpus histórico existente (Fase 0, Jul–Dic 2025) con las 113
// planeaciones F-32 de `planeaciones enerojunio26/` (111 PDF + 1 docx + 1 .m).
// Reutiliza EXACTAMENTE el mismo esquema, parser y redacción de PII que
// scripts/ingestar-historicas.mjs, para que sea consumible por
// seleccionHistoricas.ts sin cambios.
//
//   Salida:
//   - app/data/planeaciones-historicas/corpus/<slug>.json   (uno por archivo)
//   - app/data/planeaciones-historicas/manifest.json        (fusiona ambos lotes)
//
// Reproducible: volver a correrlo regenera el lote 2026 y refunde el manifest.
// NO borra ni modifica las 103 entradas Jul–Dic 2025.
//
// Uso:  node scripts/ingestar-enero-jun-2026.mjs

import { promises as fs } from "fs";
import { createHash } from "crypto";
import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..");

const PERIODO = "Enero-Junio 2026";
const LOTE = "enero-junio-2026";

const ORIGEN = path.join(RAIZ, "planeaciones enerojunio26");
const DEST = path.join(RAIZ, "app", "data", "planeaciones-historicas");
const DEST_CORPUS = path.join(DEST, "corpus");
const CONTENIDOS = path.join(RAIZ, "app", "data", "contenidos");

/* --------------------------- utilidades de texto --------------------------- */

const sinAcentos = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

const decodeXml = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

/** Texto de un .docx (o .m que en realidad es docx) vía PizZip. */
function textoDeDocx(buf) {
  const zip = new PizZip(buf);
  const xml = zip.file("word/document.xml")?.asText() || "";
  const conSaltos = xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<\/w:tr>/g, "\n")
    .replace(/<\/w:tc>/g, " · ")
    .replace(/<[^>]+>/g, "");
  return decodeXml(conSaltos)
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Texto de un PDF vía pdftotext (-layout preserva la estructura de la tabla F-32).
 *  Los acentos salen bien en UTF-8; el parser usa sinAcentos igualmente. */
function textoDePdf(abs) {
  try {
    // Modo CRUDO (orden de lectura): desentrelaza la tabla F-32 mucho mejor que
    // -layout para títulos de UNIDAD, objetivos y bibliografía.
    const out = execFileSync("pdftotext", ["-enc", "UTF-8", abs, "-"], {
      maxBuffer: 40 * 1024 * 1024,
    }).toString("utf8");
    return out
      .replace(/ /g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return "";
  }
}

/** Enruta por magic bytes: %PDF → pdf, PK(zip) → docx. (El `.m` del lote es PDF.) */
function leerTexto(abs, buf) {
  const magic = buf.slice(0, 4).toString("latin1");
  if (magic.startsWith("%PDF")) return { txt: textoDePdf(abs), formato: "pdf" };
  if (magic.startsWith("PK")) {
    try {
      return { txt: textoDeDocx(buf), formato: "docx" };
    } catch {
      return { txt: "", formato: "docx" };
    }
  }
  const pdf = textoDePdf(abs);
  if (pdf) return { txt: pdf, formato: "pdf" };
  try {
    return { txt: textoDeDocx(buf), formato: "docx" };
  } catch {
    return { txt: "", formato: "desconocido" };
  }
}

/* --------------------------- parser de campos --------------------------- */

const campo = (txt, etiqueta) => {
  const re = new RegExp(etiqueta + "[:\\s·]*([^\\n]+)", "i");
  const plano = sinAcentos(txt);
  const m = plano.match(re);
  if (!m) return "";
  const ini = m.index + m[0].length - m[1].length;
  return txt
    .slice(ini, ini + m[1].length)
    .replace(/^[\s·:]+/, "")
    .replace(/\s{2,}.*$/, "") // corta en el siguiente bloque de columna (layout)
    .replace(/\s*·\s*$/, "")
    .trim();
};

function bloque(txt, etiquetas, idx) {
  const plano = sinAcentos(txt);
  const desde = plano.indexOf(sinAcentos(etiquetas[idx]));
  if (desde < 0) return "";
  let hasta = plano.length;
  for (let j = 0; j < etiquetas.length; j++) {
    if (j === idx) continue;
    const p = plano.indexOf(sinAcentos(etiquetas[j]), desde + 1);
    if (p > desde && p < hasta) hasta = p;
  }
  return txt
    .slice(desde, hasta)
    .replace(
      new RegExp("^" + etiquetas[idx].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      "",
    )
    .replace(/^[:\s·]+/, "")
    .trim();
}

const ETIQUETAS = [
  "COMPETENCIAS DISCIPLINARES",
  "COMPETENCIAS GENERICAS",
  "ESTRATEGIAS DE ENSENANZA",
  "TECNICAS DE ENSENANZA",
  "SECUENCIA DIDACTICA",
  "RECURSOS DIDACTICOS",
  "PRODUCTOS",
  "INSTRUMENTO DE EVALUACION",
];

const STOP = [
  "QUE SE FAVORECEN",
  "A UTILIZAR",
  "SESIONES",
  "CONTENIDO",
  "FACTICOS",
  "PROCEDIMENTALES",
  "ACTITUDINALES",
  "SECUENCIA DIDACTICA",
  "INICIO, DESARROLLO",
  "RECURSOS DIDACTICOS",
  "PRODUCTOS O DESEMPENOS",
  "O DESEMPENOS",
  "INSTRUMENTO DE EVALUACION",
  "COMPETENCIAS DISCIPLINARES",
  "COMPETENCIAS GENERICAS",
  "ESTRATEGIAS DE ENSENANZA",
  "TECNICAS DE ENSENANZA",
  "COMPETENCIAS INSTRUMENTALES",
  "COMPETENCIAS INTERPERSONALES",
  "COMPETENCIAS SISTEMATICAS",
];

const aLista = (s) =>
  (s || "")
    .split(/\s*[*•▪◦·]\s*|\n+|\s{2,}/)
    .map((x) => x.replace(/^[-·:\s]+/, "").replace(/\s*·\s*$/, "").trim())
    .filter((x) => x.length > 3 && x.length < 240)
    .filter((x) => {
      const u = sinAcentos(x).toUpperCase();
      return !STOP.some((h) => u.startsWith(h) || (u.length < 40 && u.includes(h)));
    })
    .slice(0, 14);

/** Competencias en el template F-32 2026: vienen bajo "Competencias
 *  instrumentales/interpersonales/sistemáticas/disciplinares" (distinto del
 *  template histórico "COMPETENCIAS DISCIPLINARES/GENÉRICAS"). */
function competencias2026(txt) {
  const ini = txt.search(/Competencias\s+(instrumentales|gen[eé]ricas|disciplinares)/i);
  if (ini < 0) return [];
  let resto = txt.slice(ini);
  const fin = resto.search(/ESTRATEGIAS DE ENSE|T[EÉ]CNICAS DE ENSE|SESIONES\b|SECUENCIA DID|OBJETIVO DE LA UNIDAD/i);
  const blk = fin > 8 ? resto.slice(0, fin) : resto.slice(0, 3000);
  return aLista(
    blk.replace(
      /Competencias\s+(instrumentales|interpersonales|sistem[aá]ticas|disciplinares|gen[eé]ricas)/gi,
      "\n",
    ),
  );
}

/* --------------------------- redacción de PII --------------------------- */

function redactar(txt, docente) {
  let t = txt;
  if (docente) {
    const partes = docente.split(/\s+/).filter((p) => p.length > 2);
    for (const p of partes) {
      t = t.replace(
        new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
        "[DOCENTE]",
      );
    }
  }
  return t
    .replace(/NOMBRE DEL DOCENTE[^\n]*/gi, "NOMBRE DEL DOCENTE [REDACTADO]")
    .replace(/N[ÚU]MERO DE (?:ESTUDIANTES|CADETES)[^\n]*/gi, "NÚMERO DE CADETES [REDACTADO]")
    .replace(/\bGRUPO[:\s][^\n]*/gi, "GRUPO [REDACTADO]")
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, "[FECHA]")
    .replace(/ESCUELA N[ÁA]UTICA MERCANTE[^\n]*/gi, "ESCUELA NÁUTICA MERCANTE [REDACTADO]");
}

/* --------------------------- clasificación --------------------------- */

const ROMANO = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };

/** Extrae carrera/semestre/grupo del NOMBRE del archivo (muy fiable en este lote).
 *  Tolera el "mojibake" (acentos/espacios → "8") y prefijos lmn_/lpn_. */
function parseNombre(rel) {
  const base = path.basename(rel).replace(/\.[^.]+$/, "");
  const u = sinAcentos(base).toUpperCase();
  // Forma compacta: solo A-Z y dígitos (así "VI8B8PN" → "VI8B8PN", "IIAPN" queda).
  const compact = u.replace(/[^A-Z0-9]/g, "");
  let sem = 0,
    grupo = "",
    carrera = "";
  // ROMANO/dígito + (opcional "8" separador) + grupo A/B + (opcional "8") + PN/MN.
  const rx = /(VIII|VII|VI|IV|V|III|II|I|[1-8])8?([AB])8?(PN|MN)/g;
  let m,
    last = null;
  while ((m = rx.exec(compact))) last = m;
  if (last) {
    sem = ROMANO[last[1]] || Number(last[1]) || 0;
    grupo = last[2];
    carrera = last[3];
  }
  // Carrera de respaldo: prefijo lmn_/lpn_, sufijo PN/MN, o palabra completa.
  if (!carrera) {
    if (/^LMN/.test(compact)) carrera = "MN";
    else if (/^LPN/.test(compact)) carrera = "PN";
    else {
      const cs = compact.match(/(PN|MN)/g);
      if (cs) carrera = cs[cs.length - 1];
      else if (/MAQUINISTA/.test(u)) carrera = "MN";
      else if (/PILOTO/.test(u)) carrera = "PN";
    }
  }
  // Semestre de respaldo: romano suelto seguido de grupo/carrera aunque sin PN/MN pegado.
  if (!sem) {
    const r = compact.match(/(VIII|VII|VI|IV|V|III|II|I)8?[AB]?8?(?:PN|MN|MYN|$)/);
    if (r) sem = ROMANO[r[1]] || 0;
  }
  return { sem, grupo, carrera };
}

/** Lee la línea "GRUPO: II A MN" del encabezado F-32 (lo más fiable si hay texto). */
function parseGrupoHeader(txt) {
  const m = sinAcentos(txt).match(/GRUPO[\s:|·]*([IVX]+)\s*([AB])?\s*(PN|MN)?/i);
  if (!m) return { sem: 0, grupo: "", carrera: "" };
  return {
    sem: ROMANO[m[1].toUpperCase()] || 0,
    grupo: (m[2] || "").toUpperCase(),
    carrera: (m[3] || "").toUpperCase(),
  };
}

function detectarCarrera(txt, rel) {
  const h = parseGrupoHeader(txt).carrera;
  if (h) return h;
  const n = parseNombre(rel).carrera;
  if (n) return n;
  const u = sinAcentos(txt).toUpperCase();
  if (/MAQUINISTA|MECANICO NAVAL/.test(u)) return "MN";
  if (/PILOTO NAVAL/.test(u)) return "PN";
  return "ND";
}

function detectarSemestre(txt, rel) {
  const h = parseGrupoHeader(txt).sem;
  if (h) return h;
  return parseNombre(rel).sem || 0;
}

function detectarGrupo(txt, rel) {
  const h = parseGrupoHeader(txt).grupo;
  if (h) return h;
  return parseNombre(rel).grupo || "";
}

function detectarArea(clave, materia) {
  const s = sinAcentos(clave + " " + materia).toUpperCase();
  if (
    /NAV|CART|HIDR|METEO|MANIOBR|CARGA|ESTIBA|TEB|TEORIA DEL BUQUE|OMI|CONVENIO|SIM|GMDSS|POSICIONAMIENTO|DINAMICO|EMBARCACION|EMERGENCIA|LEGISLACION|ADMINISTRACION NAVIERA|ECONOMIA MARIT/.test(
      s,
    )
  )
    return "nautica";
  if (
    /MOT|MEF|FLUIDOS|MMA|MAQ\.? MAR|MAQUINARIA|ELECTRO|ELECTRIC|AUTO|LAB|TALLER|REFRIG|ESTAB|MOTOR|DIESEL|TURBINA|GENERADOR|VAPOR/.test(
      s,
    )
  )
    return "maquinas";
  if (
    /ALG|CALCULO|FIS|DIN|GEOGRAF|GEO|DIBUJO|QUIM|TRIGONOMETR|TOPOGRAF|ESTATICA|RESISTENCIA/.test(
      s,
    )
  )
    return "basica";
  if (
    /ETICA|LIDER|EXPRE|REDACC|ARGUMENTAC|PENSAMIENTO|METODOLOGIA|HOMBRE Y SU ENTORNO|INGLES|PRIMEROS AUXILIOS/.test(
      s,
    )
  )
    return "humanidades";
  if (/PMR|PRACTICAS MARINER|MARINERAS/.test(s)) return "practicas-marineras";
  if (/E\.?\s?F|EDUC.*FISICA|EDUCACION FISICA/.test(s)) return "educacion-fisica";
  return "otra";
}

/* --------------------------- parser de PROGRAMA (espejo) --------------------------- */

const ROMANO_RX = "(VIII|VII|VI|IV|III|II|IX|X|I|V)";
const romanoAnum = (r) =>
  ({ I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 })[
    (r || "").toUpperCase()
  ] || 0;

/** Extrae las UNIDADES (número, tema, objetivo, subtemas) del texto CRUDO del F-32.
 *  Best-effort: la tabla F-32 no siempre extrae perfecto; se deduplica por número
 *  conservando la variante con más contenido. */
function parsearUnidades(txt) {
  const re = new RegExp("UNIDAD\\s+" + ROMANO_RX + "\\b[ \\t]*([^\\n]{0,120})", "gi");
  const marcas = [];
  let m;
  while ((m = re.exec(txt))) {
    marcas.push({ idx: m.index, fin: m.index + m[0].length, num: romanoAnum(m[1]), tema: (m[2] || "").trim() });
  }
  if (!marcas.length) return [];
  const porNum = new Map();
  for (let i = 0; i < marcas.length; i++) {
    const desde = marcas[i].fin;
    const hasta = i + 1 < marcas.length ? marcas[i + 1].idx : Math.min(txt.length, desde + 4000);
    const bloque = txt.slice(desde, hasta);
    // Objetivo de la unidad.
    const om = bloque.match(/OBJETIVO(?:\s+DE\s+LA\s+UNIDAD|\s+ESPEC[IÍ]FICO)?[:\s]*([^\n]{15,400})/i);
    const objetivo = om ? om[1].replace(/\s+/g, " ").trim() : "";
    // Subtemas "N.M ...": limpia y recorta en el primer separador de columna.
    const subtemas = [];
    const vistos = new Set();
    for (const sm of bloque.matchAll(/(\d+\.\d+)\s+([^\n]{2,120})/g)) {
      let s = sm[2]
        .replace(/\s{2,}.*$/, "")
        .replace(/\b(INICIO|DESARROLLO|CIERRE|Presentaci[oó]n\s+PPT|N\/A|Apuntes|Video|Papel|L[aá]piz).*$/i, "")
        .replace(/\s+/g, " ")
        .trim();
      const key = sm[1];
      if (s.length >= 3 && !vistos.has(key)) {
        vistos.add(key);
        subtemas.push(`${sm[1]} ${s}`);
      }
    }
    const cand = { numero: marcas[i].num, tema: marcas[i].tema.replace(/\s+/g, " ").trim(), objetivoEspecifico: objetivo, subtemas };
    const prev = porNum.get(cand.numero);
    const peso = (c) => c.tema.length + c.objetivoEspecifico.length + c.subtemas.length * 20;
    if (cand.numero && (!prev || peso(cand) > peso(prev))) porNum.set(cand.numero, cand);
  }
  return [...porNum.values()].sort((a, b) => a.numero - b.numero);
}

/** Bibliografía: bloque tras la última etiqueta BIBLIOGRAFÍA. */
function parsearBibliografia(txt) {
  const idx = sinAcentos(txt).toUpperCase().lastIndexOf("BIBLIOGRAF");
  if (idx < 0) return [];
  let bloque = txt.slice(idx).replace(/^[^\n]*\n/, "");
  bloque = bloque.split(/RETROALIMENTACI|OBSERVACIONES|UNIDAD\s+[IVX]|FID-FOR-F-32/i)[0];
  return bloque
    .split(/\n+/)
    .map((x) => x.replace(/^[-·•*\s]+/, "").replace(/\s+/g, " ").trim())
    .filter((x) => x.length > 8 && x.length < 300 && /[a-záéíóú]/i.test(x))
    .slice(0, 15);
}

/** Porcentajes de evaluación detectados (best-effort; sin asociar a criterio). */
function parsearPorcentajes(txt) {
  const set = new Set();
  for (const m of txt.matchAll(/(\d{1,3})\s?%/g)) {
    const n = Number(m[1]);
    if (n > 0 && n <= 100) set.add(n);
  }
  return [...set].sort((a, b) => a - b);
}

/** Nombre limpio de la materia desde la etiqueta humana del nombre de archivo. */
function materiaDeNombre(rel) {
  const base = path.basename(rel).replace(/\.[^.]+$/, "");
  // La etiqueta humana suele venir tras el código: tomamos la parte con MAYÚSCULAS.
  const partes = base.split(/\s+/);
  const humanas = [];
  for (const p of partes) {
    // Descarta tokens-código (contienen minúsculas o guiones bajos).
    if (/^[A-ZÁÉÍÓÚÑ0-9().-]+$/.test(p)) humanas.push(p);
  }
  let etq = humanas.join(" ");
  // Quita el sufijo "VIII A MN" / "GRUPO IV B PN" / "II A PN".
  etq = etq
    .replace(/\bGRUPO\b/gi, "")
    .replace(/\b(VIII|VII|VI|IV|V|III|II|I)\s*[AB]?\s*(PN|MN)\b/gi, "")
    .replace(/\b(VIII|VII|VI|IV|V|III|II|I)\b\s*[AB]?\s*$/i, "")
    .replace(/\b[AB]\s+(PN|MN)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return etq;
}

const slugify = (s) =>
  sinAcentos(s)
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "doc";

/** Segmento SEGURO para nombre de archivo en Windows (sin : * ? " < > | / \\ ni acentos). */
const sanitizar = (s) =>
  sinAcentos(String(s || ""))
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "doc";

const titleCase = (s) =>
  s
    .toLowerCase()
    .replace(/\b([a-záéíóúñ])/g, (c) => c.toUpperCase())
    .trim();

/* --------------------------- recorrido --------------------------- */

async function listar(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listar(p)));
    else if (/\.(pdf|docx|doc|m)$/i.test(e.name)) out.push(p);
  }
  return out;
}

async function main() {
  const archivos = await listar(ORIGEN);
  const contenidosTxt = (
    await Promise.all(
      (await fs.readdir(CONTENIDOS))
        .filter((f) => f.endsWith(".ts"))
        .map((f) => fs.readFile(path.join(CONTENIDOS, f), "utf8")),
    )
  ).join("\n");

  await fs.mkdir(DEST_CORPUS, { recursive: true });

  // Limpieza idempotente: borra SOLO los JSON del lote 2026 de corridas previas
  // (evita huérfanos al cambiar nomenclatura). NO toca el corpus Jul–Dic 2025.
  let limpiados = 0;
  for (const f of await fs.readdir(DEST_CORPUS)) {
    if (!f.endsWith(".json")) continue;
    const fp = path.join(DEST_CORPUS, f);
    try {
      const j = JSON.parse(await fs.readFile(fp, "utf8"));
      if (j.lote === LOTE) {
        await fs.unlink(fp);
        limpiados++;
      }
    } catch {}
  }

  // Dedup exacto por SHA-1 (copias byte-idénticas). Se conservan variantes.
  const porHash = new Map();
  for (const abs of archivos) {
    const buf = await fs.readFile(abs);
    const h = createHash("sha1").update(buf).digest("hex");
    if (!porHash.has(h)) porHash.set(h, { abs, buf, h });
  }
  const dupExactos = archivos.length - porHash.size;

  const nuevos = [];
  let okPdf = 0,
    okDocx = 0,
    sinTexto = 0;
  const problemas = [];

  for (const { abs, buf, h } of porHash.values()) {
    const rel = path.relative(ORIGEN, abs);
    const { txt, formato } = leerTexto(abs, buf);

    // Sin capa de texto (PDF escaneado) → entrada SOLO-METADATOS desde el nombre.
    // El Paso 4 caerá al flujo IA para estas materias (no hay contenido que espejar).
    if (!txt || txt.length < 200) {
      sinTexto++;
      problemas.push({ archivo: rel, motivo: "escaneado/sin capa de texto → solo metadatos" });
      const carrera = detectarCarrera("", rel);
      const semestre = detectarSemestre("", rel);
      const grupo = detectarGrupo("", rel);
      const materia = titleCase(materiaDeNombre(rel)) || "(sin identificar)";
      const area = detectarArea("", materia);
      const corpus = {
        id: `${slugify(materia)}_${h.slice(0, 8)}`,
        clave: "",
        materia,
        carrera,
        semestre,
        grupo,
        periodo: PERIODO,
        lote: LOTE,
        area,
        contenidoExtraible: false,
        claveCoincideConProgramaOficial: false,
        origen: { archivo: rel, formato, sha1: h },
        datosGenerales: {},
        pedagogia: {
          competencias: [],
          estrategiasEnsenanza: [],
          tecnicasEnsenanza: [],
          secuenciaDidactica: "",
          productosEvidencias: [],
          instrumentosEvaluacion: [],
        },
        textoReferenciaRedactado: "",
        textoCompletoRedactado: "",
      };
      const carreraDir = carrera === "MN" ? "LMN" : carrera === "PN" ? "LPN" : "ND";
      const sem = semestre ? String(semestre).padStart(2, "0") : "00";
      const gsuf = grupo ? `_${grupo}` : "";
      const nombre = `${carreraDir}_Sem${sem}_${sanitizar(slugify(materia))}${gsuf}_${h.slice(0, 8)}.json`;
      await fs.writeFile(
        path.join(DEST_CORPUS, nombre),
        JSON.stringify(corpus, null, 2),
        "utf8",
      );
      nuevos.push({
        id: corpus.id,
        clave: "",
        materia,
        carrera,
        semestre,
        grupo,
        periodo: PERIODO,
        lote: LOTE,
        area,
        docente: "(no identificado)",
        archivoOrigen: rel,
        formato,
        corpus: `corpus/${nombre}`,
        contenidoExtraible: false,
        claveCoincideConProgramaOficial: false,
      });
      continue;
    }
    formato === "pdf" ? okPdf++ : okDocx++;

    // clave SOLO si hay patrón limpio tipo "EST212"; nunca basura del encabezado.
    const claveRaw = campo(txt, "CLAVE\\s*DE\\s*LA\\s*ASIGNATURA\\/?\\s?CURSO");
    const claveM = claveRaw.match(/[A-Z]{2,4}\s?\d{2,4}/i);
    const clave = claveM ? claveM[0].replace(/\s+/g, "").toUpperCase() : "";

    // Materia: se PREFIERE la etiqueta del nombre de archivo (fiable en estructura,
    // aunque con typos como "Trigonmetria"); el encabezado del PDF se usa solo como
    // respaldo y VALIDADO, porque en modo crudo a veces captura basura contigua
    // ("Número de cadetes", "Periodo", "Docente"...).
    const materiaHeader = campo(txt, "ASIGNATURA\\/?\\s?CURSO")
      .replace(/CLAVE.*/i, "")
      .replace(/\s+/g, " ")
      .replace(/^[\s:·|]+/, "")
      .trim();
    const BASURA_HEADER =
      /ASIGNATURA|CLAVE|CURS|ESCUELA|N[UÚ]MERO|CADETES|ESTUDIANTES|DOCENTE|INSTRUCTOR|PERIODO|HORAS|MODALIDAD|CR[EÉ]DITOS|GRUPO|OBJETIVO|TIPO DE/i;
    const headerValido =
      materiaHeader.length >= 3 &&
      materiaHeader.length <= 60 &&
      !BASURA_HEADER.test(materiaHeader) &&
      /[A-Za-zÁÉÍÓÚÑñ]/.test(materiaHeader);
    const materiaNombre = titleCase(materiaDeNombre(rel));
    const materia =
      materiaNombre ||
      (headerValido ? titleCase(materiaHeader) : "") ||
      "(sin identificar)";

    const docente = campo(txt, "NOMBRE DEL DOCENTE(?:\\s*O\\s*INSTRUCTOR\\s*ACAD[EÉ]MICO)?")
      .replace(/\s*(HORAS|INSTRUCTOR).*/i, "")
      .trim();

    const carrera = detectarCarrera(txt, rel);
    const semestre = detectarSemestre(txt, rel);
    const grupo = detectarGrupo(txt, rel);
    const area = detectarArea(clave, materia);
    const claveOficial = !!clave && contenidosTxt.includes(clave);

    // Datos generales adicionales (para el espejo del Paso 4).
    const objetivo = campo(txt, "OBJETIVO GENERAL DE LA ASIGNATURA").slice(0, 600);
    const horasTotales = campo(txt, "HORAS TOTALES").match(/\d{1,3}/)?.[0] || "";
    const horasSemana = campo(txt, "HORAS POR SEMANA").match(/\d{1,2}/)?.[0] || "";

    // Programa ESPEJO (forma ProgramaOficial) — base estructurada del Paso 4.
    const unidades = parsearUnidades(txt);
    const bibliografia = parsearBibliografia(txt);
    const porcentajes = parsearPorcentajes(txt);

    const txtR = redactar(txt, docente);
    let competencias = aLista(
      bloque(txtR, ETIQUETAS, 0) + "\n" + bloque(txtR, ETIQUETAS, 1),
    );
    // Template 2026: encabezados de competencias distintos → extractor específico.
    if (competencias.length === 0) competencias = competencias2026(txtR);

    const corpus = {
      id: `${clave || slugify(materia)}_${h.slice(0, 8)}`,
      clave,
      materia,
      carrera,
      semestre,
      grupo,
      periodo: PERIODO,
      lote: LOTE,
      area,
      contenidoExtraible: true,
      claveCoincideConProgramaOficial: claveOficial,
      origen: { archivo: rel, formato, sha1: h },
      datosGenerales: {
        objetivoGeneral: objetivo,
        horasTotales,
        horasPorSemana: horasSemana,
      },
      // Base estructurada para ESPEJAR (Paso 4): misma forma que ProgramaOficial.
      // best-effort: la tabla F-32 en PDF no siempre extrae perfecto (ver `calidad`).
      programaEspejo: {
        clave,
        nombre: materia,
        horas: {
          total: Number(horasTotales) || 0,
          porSemana: Number(horasSemana) || 0,
        },
        objetivoGeneral: objetivo,
        unidades,
        bibliografia,
        evaluacion: { porcentajesDetectados: porcentajes },
        calidad: {
          unidades: unidades.length,
          subtemas: unidades.reduce((a, u) => a + u.subtemas.length, 0),
          conObjetivo: unidades.filter((u) => u.objetivoEspecifico).length,
          bibliografia: bibliografia.length,
        },
      },
      pedagogia: {
        competencias,
        estrategiasEnsenanza: aLista(bloque(txtR, ETIQUETAS, 2)),
        tecnicasEnsenanza: aLista(bloque(txtR, ETIQUETAS, 3)),
        secuenciaDidactica: bloque(txtR, ETIQUETAS, 4).slice(0, 2500),
        productosEvidencias: aLista(bloque(txtR, ETIQUETAS, 6)),
        instrumentosEvaluacion: aLista(bloque(txtR, ETIQUETAS, 7)),
      },
      // Referencia de estilo (compatibilidad con corpus Jul–Dic 2025).
      textoReferenciaRedactado: txtR.slice(0, 9000),
      // Texto COMPLETO redactado: base del ESPEJO (Paso 4) — solo cambian fechas/ciclo.
      textoCompletoRedactado: txtR,
    };

    const carreraDir = carrera === "MN" ? "LMN" : carrera === "PN" ? "LPN" : "ND";
    const sem = semestre ? String(semestre).padStart(2, "0") : "00";
    const gsuf = grupo ? `_${grupo}` : "";
    const nombre = `${carreraDir}_Sem${sem}_${sanitizar(clave || slugify(materia))}${gsuf}_${h.slice(0, 8)}.json`;
    await fs.writeFile(
      path.join(DEST_CORPUS, nombre),
      JSON.stringify(corpus, null, 2),
      "utf8",
    );

    nuevos.push({
      id: corpus.id,
      clave,
      materia,
      carrera,
      semestre,
      grupo,
      periodo: PERIODO,
      lote: LOTE,
      area,
      docente: docente || "(no identificado)",
      archivoOrigen: rel,
      formato,
      corpus: `corpus/${nombre}`,
      contenidoExtraible: true,
      claveCoincideConProgramaOficial: claveOficial,
    });
  }

  // ---- Fusión con el manifest existente (conserva Jul–Dic 2025) ----
  const manifestPath = path.join(DEST, "manifest.json");
  let previo = { documentos: [] };
  try {
    previo = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch {}
  const previos = (previo.documentos || []).filter((d) => d.lote !== LOTE); // idempotente
  const documentos = [...previos, ...nuevos].sort(
    (a, b) =>
      (a.carrera || "").localeCompare(b.carrera || "") ||
      (a.semestre || 0) - (b.semestre || 0) ||
      (a.materia || "").localeCompare(b.materia || ""),
  );

  const lotesPrev = (previo.lotes || []).filter((l) => l.id !== LOTE);
  const manifest = {
    generado: previo.generado || "fase-0",
    // Compatibilidad: se conserva el periodo original arriba.
    periodo: previo.periodo || "Julio-Diciembre 2025",
    lotes: [
      ...(lotesPrev.length
        ? lotesPrev
        : [
            {
              id: "julio-dic-2025",
              periodo: previo.periodo || "Julio-Diciembre 2025",
              semestres: "impares (1,3,5,7)",
              total: previos.length,
            },
          ]),
      {
        id: LOTE,
        periodo: PERIODO,
        semestres: "pares (2,4,6,8)",
        total: nuevos.length,
        origen: "planeaciones enerojunio26/",
      },
    ],
    totalCorpus: documentos.length,
    documentos,
  };
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  console.log("=== INGESTIÓN ENERO–JUNIO 2026 ===");
  console.log("Huérfanos 2026 limpiados :", limpiados);
  console.log("Archivos origen          :", archivos.length);
  console.log("Duplicados exactos (SHA) :", dupExactos);
  console.log("  pdf OK:", okPdf, "| docx OK:", okDocx, "| sin texto:", sinTexto);
  console.log("Nuevas entradas 2026     :", nuevos.length);
  console.log("Total corpus (ambos lotes):", documentos.length);
  if (problemas.length) {
    console.log("--- PROBLEMAS ---");
    for (const p of problemas) console.log("  ", p.archivo, "→", p.motivo);
  }
  // Resumen de clasificación para revisión.
  const sinSem = nuevos.filter((d) => !d.semestre).map((d) => d.archivoOrigen);
  const sinCar = nuevos.filter((d) => d.carrera === "ND").map((d) => d.archivoOrigen);
  if (sinSem.length) console.log("Sin semestre:", sinSem.length, sinSem);
  if (sinCar.length) console.log("Sin carrera:", sinCar.length, sinCar);
}

main().catch((e) => {
  console.error("ERROR ingestión 2026:", e);
  process.exit(1);
});
