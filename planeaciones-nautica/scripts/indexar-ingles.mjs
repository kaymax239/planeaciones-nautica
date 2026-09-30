// Indexador del corpus histórico de Inglés.
//
// Lee (SOLO LECTURA) los .docx de la carpeta "planeaciones historicas ingles",
// extrae su texto con PizZip (un .docx es un zip; el texto vive en
// word/document.xml) y construye un índice JSON local. NO mueve, renombra ni
// modifica ningún documento original. Ignora .zip. No usa STCW. No toca PN/MN,
// presentaciones, F-32, F-51 ni exámenes. No llama a Gemini.
//
// Salida: .indice-ingles/indice.json (carpeta ignorada por git). Se regenera
// con: node scripts/indexar-ingles.mjs
//
// La extracción reutiliza el mismo enfoque probado de scripts/ingestar-historicas.mjs.

import { promises as fs } from "fs";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..");
const NOMBRE_BIBLIOTECA = "planeaciones historicas ingles";
const BIBLIOTECA = path.join(RAIZ, NOMBRE_BIBLIOTECA);
const DEST_DIR = path.join(RAIZ, ".indice-ingles");
const DEST_FILE = path.join(DEST_DIR, "indice.json");

// v2: añade `asignaturaTexto` y `nivelSegunTexto` (diagnóstico). `nivel` NO
// cambió de criterio: sigue saliendo del nombre de archivo, byte a byte igual
// que en v1, para no alterar la selección de referencias de los niveles 4-8.
const VERSION_INDICE = 2;

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

/** Extrae texto preservando saltos de párrafo/fila y separadores de celda. */
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

/** Cuenta palabras de forma simple (tokens separados por espacios). */
function contarPalabras(texto) {
  const t = texto.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

/**
 * Nivel a partir del NOMBRE DEL ARCHIVO (best-effort). Es el campo `nivel` que
 * consume la selección de referencias de /api/planeacion-ingles y
 * /api/presentacion-ingles, así que su criterio NO se cambia a la ligera:
 * tocarlo mueve qué históricas se espejean en los niveles 4-8.
 *
 * Deja 15 de 44 documentos en null (ficha D4 de DEUDA-TECNICA-INGLES.md). Ver
 * `nivelSegunTexto` más abajo para saber por qué ampliarlo NO es la solución.
 */
function inferirNivel(nombre) {
  const base = sinAcentos(nombre).toLowerCase();
  // VII semestre — Inglés Marítimo VII / Maritime English 1 (Marlins Study Pack 1
  // + Career Paths Merchant Navy). Nivel propio "MN1": NO es iDiscover. Solo
  // matchea "merchantnavy1" / "maritime english 1" explícitos en el nombre; los
  // "merchantnavy2" (VIII sem, ING 853) siguen sin nivel a propósito.
  if (/merchant\s*navy\s*1(?!\d)|maritime\s*english\s*1(?!\d)/.test(base)) return "MN1";
  const m = base.match(/(?:lvl|lv|level|nivel)\s*\.?\s*([1-9]\d?)/);
  return m ? m[1] : null;
}

/**
 * Valor literal del campo "ASIGNATURA/CURSO" del F-32, tal como está escrito
 * dentro del documento. Es un dato crudo, sin interpretar: sirve para saber de
 * qué curso es realmente cada documento sin volver a abrir el .docx.
 */
function asignaturaDeTexto(texto) {
  const m = texto.match(/ASIGNATURA\s*\/?\s*CURSO\s*:*\s*·\s*([^·\n]{0,120})/i);
  const v = (m?.[1] ?? "").replace(/\s+/g, " ").trim();
  return v || null;
}

/**
 * Nivel DECLARADO por el propio documento en su campo ASIGNATURA/CURSO.
 *
 * Solo acepta una marca EXPLÍCITA de nivel ("lvl 4", "Level 6", "NIVEL 3"). No
 * deduce el nivel del número romano del semestre a propósito: en este corpus
 * semestre y nivel NO coinciden ("Ingles Marítimo II C PN/MN lvl 4",
 * "Ingles Marítimo VI C PN MN lvl 7"), así que inferirlo del romano produciría
 * etiquetas falsas.
 *
 * Campo de DIAGNÓSTICO: nadie lo consume para seleccionar referencias. Existe
 * para dos cosas que el nombre de archivo no puede dar:
 *   1. Explicar los documentos sin nivel (los 9 "Inglés Marítimo VIII /
 *      MARITIME ENGLISH 2", clave ING 853, que son del libro Career Paths
 *      Merchant Navy — NO del iDiscover de los niveles 4-8 — y los 4 "Inglés
 *      Marítimo VI (Level 6)").
 *   2. Delatar los documentos cuyo nombre de archivo MIENTE sobre su contenido
 *      (ver el aviso "nombre ≠ contenido" al final de la ejecución).
 */
function nivelSegunTexto(asignatura) {
  if (!asignatura) return null;
  const base = sinAcentos(asignatura).toLowerCase();
  const m = base.match(/(?:lvl|lv|level|nivel)\s*\.?\s*([1-9]\d?)/);
  return m ? m[1] : null;
}

/* ------------------------------- recorrido --------------------------------- */

async function listarDocx(dir, raiz, acc) {
  const entradas = await fs.readdir(dir, { withFileTypes: true });
  for (const entrada of entradas) {
    const abs = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      await listarDocx(abs, raiz, acc);
      continue;
    }
    if (!entrada.isFile()) continue;
    const ext = path.extname(entrada.name).slice(1).toLowerCase();
    if (ext !== "docx") continue; // ignora .zip y cualquier otro formato
    acc.push(abs);
  }
}

async function main() {
  // Carpeta presente?
  try {
    const st = await fs.stat(BIBLIOTECA);
    if (!st.isDirectory()) throw new Error("no es carpeta");
  } catch {
    console.error(`✗ No se encontró la carpeta: ${BIBLIOTECA}`);
    process.exit(1);
  }

  const rutasDocx = [];
  await listarDocx(BIBLIOTECA, BIBLIOTECA, rutasDocx);
  // Orden por punto de código, NO localeCompare: el orden del índice decide el
  // desempate de seleccionarReferencias (Array.sort es estable), y localeCompare
  // depende del ICU del Node que ejecute el indexador. Reindexar en otra máquina
  // reordenaba el índice y podía mover qué históricas se espejean.
  rutasDocx.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  console.log(`Encontrados ${rutasDocx.length} .docx. Extrayendo texto…`);

  const documentos = [];
  let fallidos = 0;
  for (const abs of rutasDocx) {
    const rutaRelativa = path.relative(BIBLIOTECA, abs).split(path.sep).join("/");
    const nombre = path.basename(abs);
    const origen = path.basename(path.dirname(abs)); // docente / carpeta origen
    try {
      const buf = await fs.readFile(abs);
      const texto = textoDeDocx(buf);
      const asignaturaTexto = asignaturaDeTexto(texto);
      documentos.push({
        id: rutaRelativa,
        nombre,
        rutaRelativa,
        origen,
        nivel: inferirNivel(nombre),
        asignaturaTexto,
        nivelSegunTexto: nivelSegunTexto(asignaturaTexto),
        palabras: contarPalabras(texto),
        texto,
      });
      console.log(`  ✓ ${rutaRelativa} (${contarPalabras(texto)} palabras)`);
    } catch (e) {
      fallidos++;
      console.warn(`  ✗ ${rutaRelativa}: ${e instanceof Error ? e.message : e}`);
    }
  }

  const indice = {
    version: VERSION_INDICE,
    generadoEn: new Date().toISOString(),
    ruta: NOMBRE_BIBLIOTECA,
    totalDocumentos: documentos.length,
    documentos,
  };

  mkdirSync(DEST_DIR, { recursive: true });
  await fs.writeFile(DEST_FILE, JSON.stringify(indice, null, 2), "utf8");

  const palabrasTotales = documentos.reduce((s, d) => s + d.palabras, 0);
  console.log("");
  console.log(`Índice escrito: ${path.relative(RAIZ, DEST_FILE)}`);
  console.log(`  documentos indexados: ${documentos.length}`);
  console.log(`  fallidos: ${fallidos}`);
  console.log(`  palabras totales: ${palabrasTotales}`);

  // Reparto por nivel (el campo que consume la selección de referencias).
  const conteo = {};
  for (const d of documentos) {
    const k = d.nivel ?? "null";
    conteo[k] = (conteo[k] ?? 0) + 1;
  }
  const clavesNivel = Object.keys(conteo).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
  console.log("");
  console.log("Reparto por nivel (según nombre de archivo):");
  for (const k of clavesNivel) console.log(`  nivel ${k}: ${conteo[k]}`);

  // Documentos que el nombre de archivo no logra etiquetar. Se listan con la
  // asignatura que declaran para que se vea de qué curso son en realidad.
  const sinNivel = documentos.filter((d) => !d.nivel);
  if (sinNivel.length) {
    console.log("");
    console.log(`Sin nivel (${sinNivel.length}) — asignatura declarada en el documento:`);
    for (const d of sinNivel) {
      console.log(`  ${d.nombre} → ${d.asignaturaTexto ?? "(sin campo ASIGNATURA)"}`);
    }
  }

  // Aviso fuerte: el nombre de archivo dice un nivel y el documento dice otro.
  // Estos SÍ son referencias equivocadas en el generador, porque `nivel` sale
  // del nombre. Es un fallo peor que quedarse sin etiqueta.
  const discrepantes = documentos.filter(
    (d) => d.nivel && d.nivelSegunTexto && d.nivel !== d.nivelSegunTexto,
  );
  if (discrepantes.length) {
    console.log("");
    console.log(
      `⚠ nombre ≠ contenido (${discrepantes.length}) — el nombre etiqueta un nivel que el documento contradice:`,
    );
    for (const d of discrepantes) {
      console.log(
        `  ${d.nombre}: nombre dice nivel ${d.nivel}, el documento dice "${d.asignaturaTexto}" (nivel ${d.nivelSegunTexto})`,
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
