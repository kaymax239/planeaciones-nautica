// Utilidades de las pruebas para inspeccionar lo que REALMENTE queda dentro de
// un .pptx generado por el renderer oficial. Sin red, sin servidor y sin API key.
//
// El renderer de producción (`generarPresentacionOficialV2`) escribe el archivo
// en disco (`pptx.writeFile`): en el navegador dispara la descarga y en Node
// escribe la ruta que se le pase. Las pruebas le pasan una ruta ABSOLUTA dentro
// del temporal del sistema y leen el resultado, de modo que se ejercita el
// MISMO camino que usa el docente y no una variante paralela solo-para-tests.

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import PizZip from "pizzip";
import type { PresentacionV2 } from "../../app/data/presentaciones/tiposV2";
import {
  generarPresentacionOficialV2,
  type MetaPresentacion,
} from "../../app/lib/pptxOficialV2";

/** Renderiza una PresentacionV2 con el renderer de producción y devuelve el
 *  .pptx como Buffer. El archivo temporal se borra siempre. */
export async function renderizarPptx(
  pres: PresentacionV2,
  meta: MetaPresentacion = {},
): Promise<Buffer> {
  const destino = path.join(
    await fs.mkdtemp(path.join(os.tmpdir(), "pptx-prueba-")),
    `${randomUUID()}.pptx`,
  );
  try {
    await generarPresentacionOficialV2({ ...pres, nombreArchivo: destino }, meta);
    return await fs.readFile(destino);
  } finally {
    await fs.rm(path.dirname(destino), { recursive: true, force: true });
  }
}

/** Partes que TODO .pptx debe traer para que PowerPoint lo abra. Si falta
 *  cualquiera de ellas el archivo se descarga igual y revienta al abrirlo. */
const PARTES_OBLIGATORIAS = [
  "[Content_Types].xml",
  "_rels/.rels",
  "ppt/presentation.xml",
  "ppt/_rels/presentation.xml.rels",
];

export type ProblemaPptx = string;

/**
 * Comprueba que el buffer es un OOXML de presentación abrible: firma ZIP,
 * partes obligatorias, al menos una diapositiva y XML bien formado en cada una.
 * Devuelve la lista de problemas (vacía = válido) para que el fallo sea legible.
 */
export function problemasPptx(buffer: Buffer): ProblemaPptx[] {
  const problemas: ProblemaPptx[] = [];
  if (buffer.length === 0) return ["el archivo está vacío (0 bytes)"];
  // Firma de un archivo ZIP ("PK\x03\x04"). Un .pptx es un ZIP.
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    return [`no es un ZIP: empieza por ${buffer.subarray(0, 4).toString("hex")}`];
  }

  let zip: PizZip;
  try {
    zip = new PizZip(buffer);
  } catch (e) {
    return [`el ZIP no se puede abrir: ${e instanceof Error ? e.message : e}`];
  }

  for (const parte of PARTES_OBLIGATORIAS) {
    if (!zip.files[parte]) problemas.push(`falta la parte obligatoria ${parte}`);
  }

  const slides = rutasDiapositivas(zip);
  if (slides.length === 0) problemas.push("no contiene ninguna diapositiva");

  const tipos = zip.files["[Content_Types].xml"]?.asText() ?? "";
  if (
    tipos &&
    !tipos.includes(
      "application/vnd.openxmlformats-officedocument.presentationml.slide+xml",
    )
  ) {
    problemas.push("[Content_Types].xml no declara el tipo de las diapositivas");
  }

  for (const ruta of slides) {
    const xml = zip.files[ruta].asText();
    if (!xml.startsWith("<?xml")) problemas.push(`${ruta} no empieza por <?xml`);
    if (!/<p:sld[\s>]/.test(xml)) problemas.push(`${ruta} no tiene raíz <p:sld>`);
    problemas.push(...desbalances(ruta, xml));
  }
  return problemas;
}

/** Comprobación de anidamiento: recorre las etiquetas con una pila. Un .pptx con
 *  XML mal cerrado se descarga igual y solo falla al abrirlo en PowerPoint. */
function desbalances(ruta: string, xml: string): string[] {
  const sinRuido = xml
    .replace(/<\?[\s\S]*?\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");
  const pila: string[] = [];
  const etiqueta = /<(\/?)([A-Za-z_][\w.\-]*(?::[A-Za-z_][\w.\-]*)?)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
  for (const m of sinRuido.matchAll(etiqueta)) {
    const [, cierre, nombre, , auto] = m;
    if (auto) continue;
    if (cierre) {
      const abierta = pila.pop();
      if (abierta !== nombre) {
        return [`${ruta}: </${nombre}> cierra a <${abierta ?? "nada"}>`];
      }
    } else {
      pila.push(nombre);
    }
  }
  return pila.length ? [`${ruta}: quedan sin cerrar ${pila.join(", ")}`] : [];
}

function rutasDiapositivas(zip: PizZip): string[] {
  return Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort(
      (a, b) =>
        Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]),
    );
}

const decodificar = (s: string): string =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");

/** Texto visible de cada diapositiva, en orden. Concatena los <a:t>, que es
 *  donde vive TODO el texto de un pptx (títulos, bullets, tablas y diagramas). */
export function textoPorDiapositiva(buffer: Buffer): string[] {
  const zip = new PizZip(buffer);
  return rutasDiapositivas(zip).map((ruta) => {
    const xml = zip.files[ruta].asText();
    let texto = "";
    for (const m of xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)) texto += m[1] + " ";
    return decodificar(texto).replace(/\s+/g, " ").trim();
  });
}

/** Todo el texto del .pptx en una sola cadena. */
export function textoPptx(buffer: Buffer): string {
  return textoPorDiapositiva(buffer).join("\n");
}

/** Nº de diapositivas del archivo. */
export function numeroDiapositivas(buffer: Buffer): number {
  return rutasDiapositivas(new PizZip(buffer)).length;
}

/** Normaliza para comparar texto que el renderer puede haber partido en varios
 *  <a:t> o al que ha cambiado espacios/comillas tipográficas. */
export const normalizar = (s: string): string =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
