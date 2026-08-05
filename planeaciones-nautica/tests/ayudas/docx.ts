// Utilidades de las pruebas para inspeccionar lo que REALMENTE queda impreso en
// un .docx generado con la plantilla institucional. Sin red y sin servidor.

import { readFileSync } from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const RAIZ = process.cwd();

export function leerPlantilla(nombre: string): Buffer {
  return readFileSync(path.join(RAIZ, "public/templates", nombre));
}

/** Texto visible de un .docx: concatena el contenido de todos los <w:t> de
 *  document.xml, cabeceras y pies. Reconstruye las palabras partidas entre runs,
 *  que es justo donde un `undefined` se escondería de un grep ingenuo. */
export function textoDocx(buffer: Buffer): string {
  const zip = new PizZip(buffer);
  const partes = Object.keys(zip.files).filter(
    (f) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(f),
  );
  let texto = "";
  for (const parte of partes) {
    const xml = zip.files[parte].asText();
    for (const m of xml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)) {
      texto += m[1];
    }
    texto += "\n";
  }
  return texto
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Render ESTRICTO: usa docxtemplater SIN `nullGetter`, es decir, con el que trae
 * por defecto, que imprime la cadena literal "undefined" para cada placeholder
 * que la plantilla declara y los datos no alimentan.
 *
 * Es deliberado. `app/lib/opcionesDocx.ts` pone una red de seguridad
 * (`nullGetter: () => ""`) que en producción convierte ese "undefined" en celda
 * vacía; si las pruebas usaran esa red, no detectarían nunca que el constructor
 * de datos dejó de alimentar un placeholder. Aquí se comprueba lo de abajo: que
 * el constructor cubre la plantilla entera por sí solo.
 */
export function renderEstricto(plantilla: string, datos: unknown): Buffer {
  const doc = new Docxtemplater(new PizZip(leerPlantilla(plantilla)), {
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render(datos as Record<string, unknown>);
  return doc.getZip().generate({ type: "nodebuffer" }) as Buffer;
}

/** Placeholders simples declarados por una plantilla (`{clave}`), sin las
 *  marcas de sección `{#…}` / `{/…}`. */
export function placeholdersDe(plantilla: string): string[] {
  const zip = new PizZip(leerPlantilla(plantilla));
  const xml = zip.files["word/document.xml"].asText().replace(/<[^>]+>/g, "");
  const encontrados = [...xml.matchAll(/\{([^{}]+)\}/g)].map((m) => m[1]);
  return [...new Set(encontrados.filter((p) => !/^[#/^]/.test(p)))];
}

/** Textos que jamás deben salir impresos en un documento oficial. Son el modo de
 *  fallo característico de esta app: no revienta, imprime un dato equivocado. */
export const BASURA = [
  "undefined",
  "[object Object]",
  "no especificada",
  "no especificado",
];

/** Basura que solo cuenta como PALABRA SUELTA. "NaN" va sensible a mayúsculas:
 *  en minúsculas es una sílaba corriente del español ("combinando",
 *  "reflexionan") y daría falsos positivos en cada planeación. */
const BASURA_PALABRA: Array<[string, RegExp]> = [
  ["NaN", /\bNaN\b/g],
  ["null", /\bnull\b/gi],
];

/** Comprueba que el texto de un documento no contiene ninguna basura. Devuelve
 *  la lista de hallazgos con su contexto, para que el fallo sea legible. */
export function basuraEn(texto: string): string[] {
  const hallazgos: string[] = [];
  const bajo = texto.toLowerCase();
  for (const aguja of BASURA) {
    let i = bajo.indexOf(aguja.toLowerCase());
    while (i !== -1) {
      hallazgos.push(
        `"${aguja}" en …${texto.slice(Math.max(0, i - 60), i + aguja.length + 20).replace(/\s+/g, " ")}…`,
      );
      i = bajo.indexOf(aguja.toLowerCase(), i + 1);
    }
  }
  for (const [etiqueta, re] of BASURA_PALABRA) {
    for (const m of texto.matchAll(re)) {
      hallazgos.push(
        `"${etiqueta}" en …${texto.slice(Math.max(0, m.index - 60), m.index + 24).replace(/\s+/g, " ")}…`,
      );
    }
  }
  return hallazgos;
}

/** Recorre un objeto de render y devuelve las rutas cuyo valor es undefined,
 *  null, NaN o un objeto que se imprimiría como "[object Object]". */
export function valoresNoImprimibles(datos: unknown, ruta = ""): string[] {
  const malos: string[] = [];
  if (datos === undefined) return [`${ruta || "(raíz)"} === undefined`];
  if (datos === null) return [`${ruta || "(raíz)"} === null`];
  if (typeof datos === "number") {
    return Number.isFinite(datos) ? [] : [`${ruta} === ${datos}`];
  }
  if (typeof datos !== "object") return [];
  if (Array.isArray(datos)) {
    datos.forEach((v, i) => malos.push(...valoresNoImprimibles(v, `${ruta}[${i}]`)));
    return malos;
  }
  for (const [k, v] of Object.entries(datos as Record<string, unknown>)) {
    malos.push(...valoresNoImprimibles(v, ruta ? `${ruta}.${k}` : k));
  }
  return malos;
}
