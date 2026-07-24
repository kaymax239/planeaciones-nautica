// Utilidades de CLIENTE para trabajar con el texto de un archivo Word (.docx).
// Un .docx es un ZIP; el texto vive en word/document.xml dentro de nodos <w:t>.
// - extraerTextoDocx: saca el texto plano (por párrafos) para mandarlo a la IA.
// - aplicarCorreccionesDocx: reemplaza SOLO los fragmentos aprobados dentro de
//   cada nodo de texto, conservando el formato original del documento.

import PizZip from "pizzip";

const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function encodeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Texto plano del documento, un párrafo por línea. */
export function extraerTextoDocx(buffer: ArrayBuffer): string {
  const zip = new PizZip(buffer);
  const xml = zip.file("word/document.xml")?.asText() ?? "";
  const parrafos = xml.split(/<\/w:p>/).map((p) => {
    const textos = Array.from(
      p.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g),
    ).map((m) => decodeXml(m[1]));
    return textos.join("");
  });
  return parrafos
    .map((t) => t.trimEnd())
    .filter((t) => t.length > 0)
    .join("\n");
}

export type Reemplazo = { original: string; sugerido: string };

export type ResultadoCorreccion = {
  blob: Blob;
  aplicadas: number;
  noAplicadas: Reemplazo[];
};

/**
 * Aplica los reemplazos aprobados dentro de cada nodo <w:t>. Devuelve el .docx
 * corregido y cuáles reemplazos no se pudieron localizar (por ejemplo, cuando el
 * fragmento quedó partido entre varios estilos dentro del Word).
 */
export function aplicarCorreccionesDocx(
  buffer: ArrayBuffer,
  reemplazos: Reemplazo[],
): ResultadoCorreccion {
  const zip = new PizZip(buffer);
  const xml = zip.file("word/document.xml")?.asText() ?? "";
  const aplicadas = new Set<number>();

  const nuevoXml = xml.replace(
    /(<w:t[^>]*>)([\s\S]*?)(<\/w:t>)/g,
    (_full, apertura: string, contenido: string, cierre: string) => {
      let texto = decodeXml(contenido);
      reemplazos.forEach((r, i) => {
        if (r.original && texto.includes(r.original)) {
          texto = texto.split(r.original).join(r.sugerido);
          aplicadas.add(i);
        }
      });
      return apertura + encodeXml(texto) + cierre;
    },
  );

  zip.file("word/document.xml", nuevoXml);
  const blob = zip.generate({ type: "blob", mimeType: MIME_DOCX }) as Blob;
  const noAplicadas = reemplazos.filter((_, i) => !aplicadas.has(i));

  return { blob, aplicadas: aplicadas.size, noAplicadas };
}
