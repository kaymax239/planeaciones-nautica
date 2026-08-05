// Prueba E2E — Planeación de Inglés a .docx con la MISMA plantilla institucional
// F-32 y el MISMO generador (Docxtemplater) que usan PN/MN.
//
// Flujo: nivel -> /api/planeacion-ingles -> JSON -> construirDatosF32DesdeIngles
// -> public/templates/F-32.docx -> .docx, y AFIRMA sobre el documento resultante.
//
// Antes esto solo imprimía a consola: no tenía una sola aserción, así que podía
// producir un F-32 con "CRÉDITOS TOTALES: undefined" o con la bibliografía del
// libro equivocado y terminar con éxito. Ahora comprueba el documento y sale con
// código 1 si algo no cuadra.
//
// Lo que este script aporta y la suite de vitest no: recorre el endpoint REAL
// (auth, límites, desvío, modelo) y escribe un .docx que se puede abrir. Lo que
// NO aporta: cobertura — exige servidor levantado y, para los niveles 4-8, una
// API key. Esa parte vive en `npm test`, que es pura y siempre ejecutable.
//
// Uso: con el server corriendo (npx next start -p 3140 o next dev):
//   BASE_URL=http://localhost:3140 node scripts/generar-planeacion-ingles-docx.mjs
//   NIVEL=1 BASE_URL=… node scripts/generar-planeacion-ingles-docx.mjs
//   INGLES_JSON=salidas/nivel3.json node scripts/generar-planeacion-ingles-docx.mjs
//     (modo offline: reutiliza un JSON ya generado, sin servidor ni modelo)
//
// Salida: planeaciones-nautica/salidas/F32_INGLES_NIVEL<n>_PRUEBA.docx (git-ignored).
//
// No toca PN/MN, presentaciones, exámenes ni F-32 existente. No define plantilla
// nueva: reutiliza public/templates/F-32.docx tal cual.

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { construirDatosF32DesdeIngles } from "../app/lib/planeacionInglesF32.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..");
const BASE_URL = process.env.BASE_URL || "http://localhost:3140";
const NIVEL = (process.env.NIVEL || "3").trim();

// Niveles 1/2/3 cambiaron a StartUp (Pearson); 4-8 siguen en iDiscover
// (Express Publishing). El documento tiene que llevar el libro de SU nivel.
const LIBRO_ESPERADO = { 1: "startup", 2: "startup", 3: "startup" }[NIVEL] ?? "idiscover";

// Datos NEUTROS de prueba (no son datos reales de ningún docente).
const PETICION = {
  nivel: NIVEL,
  grupo: "II A PN",
  semanas: Number(process.env.SEMANAS) || 18,
  // 0 = no sobrescribir: si el nivel trae horas oficiales, se usan tal cual.
  horasPorSemana: Number(process.env.HORAS_POR_SEMANA) || 0,
  observaciones:
    "Planeación institucional de prueba. Mantener estructura, secuencia, actividades, evaluación y estilo del nivel. No usar STCW.",
};

/* ------------------------------------------------------------ aserciones -- */

let fallos = 0;
let pasadas = 0;

function esperar(nombre, condicion, detalle = "") {
  if (condicion) {
    pasadas++;
    console.log(`  ok    ${nombre}`);
  } else {
    fallos++;
    console.error(`  FALLA ${nombre}${detalle ? `\n        ${detalle}` : ""}`);
  }
}

/** Texto visible del .docx: concatena todos los <w:t>, de modo que una palabra
 *  partida entre runs se vuelve a leer entera. */
function textoDocx(buffer) {
  const zip = new PizZip(buffer);
  let texto = "";
  for (const nombre of Object.keys(zip.files)) {
    if (!/^word\/(document|header\d*|footer\d*)\.xml$/.test(nombre)) continue;
    const xml = zip.files[nombre].asText();
    for (const m of xml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)) texto += m[1];
    texto += "\n";
  }
  return texto
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Basura que jamás debe salir impresa. "NaN" sensible a mayúsculas: en
 *  minúsculas es una sílaba corriente del español ("combinando"). */
function basuraEn(texto) {
  const hallazgos = [];
  const bajo = texto.toLowerCase();
  for (const aguja of ["undefined", "[object object]", "no especificad"]) {
    const i = bajo.indexOf(aguja);
    if (i !== -1) {
      hallazgos.push(`"${aguja}" en …${texto.slice(Math.max(0, i - 60), i + 40)}…`);
    }
  }
  for (const re of [/\bNaN\b/, /\bnull\b/i]) {
    const m = texto.match(re);
    if (m) hallazgos.push(`"${m[0]}" en …${texto.slice(Math.max(0, m.index - 60), m.index + 40)}…`);
  }
  return hallazgos;
}

const CLAVES_PLANEACION = [
  "asignatura", "nivel", "grupo", "tema", "enfoque", "objetivoGeneral",
  "objetivosEspecificos", "competencias", "secuenciaSemanal", "evaluacion",
  "recursos", "bibliografia", "observaciones",
];

/* ------------------------------------------------------------------ flujo -- */

async function obtenerPlaneacion() {
  // Modo offline: si INGLES_JSON apunta a un archivo, reutiliza ese JSON ya
  // generado (no llama al modelo). El JSON puede ser la respuesta completa del
  // endpoint ({planeacion,...}) o directamente el objeto planeación.
  if (process.env.INGLES_JSON) {
    const ruta = process.env.INGLES_JSON;
    console.log(`Leyendo planeación desde archivo (sin modelo): ${ruta}`);
    const data = JSON.parse(readFileSync(ruta, "utf8"));
    return {
      planeacion: data.planeacion || data,
      modelo: data.modelo || "(archivo)",
      referenciasUsadas: data.referenciasUsadas || [],
    };
  }

  console.log(`POST ${BASE_URL}/api/planeacion-ingles (nivel ${PETICION.nivel})…`);
  const res = await fetch(`${BASE_URL}/api/planeacion-ingles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(PETICION),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("✗ Error del endpoint:", data.error, "-", data.mensaje);
    if (data.respuestaOriginal) {
      console.error("\n=== respuestaOriginal ===\n", data.respuestaOriginal);
    }
    process.exit(1);
  }
  return data;
}

async function main() {
  const data = await obtenerPlaneacion();
  const planeacion = data.planeacion;
  console.log("✓ Planeación recibida. Modelo:", data.modelo);
  console.log(
    "  referencias:",
    (data.referenciasUsadas || []).map((r) => r.nombre).join(" | ") || "(n/d)",
  );

  console.log("\nA) Contrato del JSON devuelto por el endpoint\n");
  esperar("la respuesta trae `planeacion`", !!planeacion && typeof planeacion === "object");
  for (const clave of CLAVES_PLANEACION) {
    esperar(`planeacion.${clave} presente`, planeacion && clave in planeacion);
  }
  esperar(
    "secuenciaSemanal es un arreglo no vacío",
    Array.isArray(planeacion?.secuenciaSemanal) && planeacion.secuenciaSemanal.length > 0,
    `es ${JSON.stringify(planeacion?.secuenciaSemanal)?.slice(0, 80)}`,
  );
  esperar(
    "el nivel devuelto es el pedido",
    String(planeacion?.nivel ?? NIVEL) === NIVEL,
    `pedido ${NIVEL}, devuelto ${planeacion?.nivel}`,
  );
  esperar(
    "los niveles almacenados NO pasan por un modelo",
    LIBRO_ESPERADO !== "startup" || data.modelo === "almacenado",
    `modelo declarado: ${data.modelo}`,
  );

  // Mismo generador que PN/MN: plantilla F-32 + Docxtemplater. SIN `nullGetter`
  // a propósito: así, un placeholder que el constructor no alimente sale como
  // "undefined" y la aserción de abajo lo caza, en vez de quedar en blanco.
  const plantilla = readFileSync(path.join(RAIZ, "public/templates/F-32.docx"));
  const doc = new Docxtemplater(new PizZip(plantilla), {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(
    construirDatosF32DesdeIngles(planeacion, {
      nivel: NIVEL,
      grupo: PETICION.grupo,
      semanas: PETICION.semanas,
      horasPorSemana: PETICION.horasPorSemana,
      docente: "Docente de prueba",
      cadetes: "28",
      periodo: "Julio-Diciembre 2026",
    }),
  );

  const buf = doc.getZip().generate({ type: "nodebuffer" });
  const destDir = path.join(RAIZ, "salidas");
  mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, `F32_INGLES_NIVEL${NIVEL}_PRUEBA.docx`);
  writeFileSync(dest, buf);
  console.log(`\n✓ Archivo escrito: ${path.relative(RAIZ, dest)} (${buf.length} bytes)`);

  const texto = textoDocx(buf);

  console.log("\nB) El documento que se entregaría\n");
  const basura = basuraEn(texto);
  esperar(
    "ningún placeholder salió como undefined / null / [object Object] / NaN",
    basura.length === 0,
    basura.join("\n        "),
  );
  esperar("el documento trae las semanas de la dosificación", /Semana 1\b/.test(texto));
  esperar("el documento trae el grupo capturado", texto.includes(PETICION.grupo));
  esperar("el documento trae al docente", texto.includes("Docente de prueba"));

  console.log("\nC) El libro impreso corresponde al nivel\n");
  const hayStartUp = /startup|pearson/i.test(texto);
  const hayIDiscover = /i\s?discover|express publishing/i.test(texto);
  if (LIBRO_ESPERADO === "startup") {
    esperar(`nivel ${NIVEL}: el documento cita StartUp (Pearson)`, hayStartUp);
    esperar(
      `nivel ${NIVEL}: el documento NO cita iDiscover / Express Publishing`,
      !hayIDiscover,
      "es el fallo de la ficha D1: el F-32 sale firmado con el libro del que el nivel se está saliendo",
    );
  } else {
    esperar(`nivel ${NIVEL}: el documento cita iDiscover`, hayIDiscover);
    esperar(`nivel ${NIVEL}: el documento NO cita StartUp (Pearson)`, !hayStartUp);
    esperar(
      `nivel ${NIVEL}: el número de libro es el del nivel`,
      !/I Discover (\d+)/i.test(texto) ||
        [...texto.matchAll(/I Discover (\d+)/gi)].every((m) => m[1] === NIVEL),
      "aparece un iDiscover de otro nivel",
    );
  }

  console.log(`\n${pasadas} aserciones ok, ${fallos} fallas.\n`);
  process.exit(fallos > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
