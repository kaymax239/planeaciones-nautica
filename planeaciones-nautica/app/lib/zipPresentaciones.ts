// Utilidades de CLIENTE para el generador masivo del panel de Desarrollador.
//
// El renderer compartido (`generarPresentacionOficialV2`) termina llamando a
// `pptx.writeFile()`, que en el navegador dispara la descarga del .pptx y solo
// devuelve el nombre del archivo: nunca expone los bytes. Para meter N unidades
// en un ZIP necesitamos esos bytes SIN provocar N descargas sueltas, y sin
// tocar `app/lib/pptxOficialV2.ts` (lo comparten otras vistas).
//
// La solución es interceptar, durante la llamada y solo durante la llamada, el
// único camino de descarga que usa pptxgenjs v4 (ver
// node_modules/pptxgenjs/dist/pptxgen.es.js → `writeFileToBrowser`):
//   1. crea un Blob con el mime-type de PowerPoint y lo pasa por
//      `URL.createObjectURL()`  → de ahí sacamos el contenido;
//   2. hace `<a download>.click()` → ese clic lo tragamos para que el fichero
//      no acabe suelto en la carpeta de Descargas.
// Ambos parches son globales, así que las capturas se serializan (ver `cola`).

import PizZip from "pizzip";

const MIME_PPTX =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

/** Los parches son globales: solo puede haber una captura en vuelo a la vez. */
let cola: Promise<unknown> = Promise.resolve();

export type PptxCapturado = { nombre: string; datos: ArrayBuffer };

/**
 * Ejecuta `generar` (típicamente `generarPresentacionOficialV2`) y devuelve el
 * .pptx como bytes en lugar de descargarlo. Si no se pudo interceptar nada,
 * lanza: preferimos un fallo ruidoso a un ZIP con un hueco silencioso.
 */
export async function capturarPptx(
  generar: () => Promise<string>,
): Promise<PptxCapturado> {
  const anterior = cola;
  let liberar!: () => void;
  cola = new Promise<void>((resolver) => {
    liberar = resolver;
  });
  await anterior.catch(() => undefined);
  try {
    return await ejecutarCaptura(generar);
  } finally {
    liberar();
  }
}

async function ejecutarCaptura(
  generar: () => Promise<string>,
): Promise<PptxCapturado> {
  // Se guarda la función TAL CUAL, sin .bind(): restaurar una copia bindeada
  // deja el global con otra identidad, así que cada captura envolvería a la
  // anterior y la cadena crecería mientras la pestaña siguiera abierta.
  const crearURL = URL.createObjectURL;
  const clickOriginal = HTMLAnchorElement.prototype.click;

  let blob: Blob | null = null;
  let nombreDescarga = "";

  URL.createObjectURL = ((objeto: Blob | MediaSource): string => {
    // Solo nos interesa el Blob final del .pptx; cualquier otro objeto (medios
    // embebidos, etc.) pasa de largo sin tocarse.
    if (objeto instanceof Blob && objeto.type === MIME_PPTX) blob = objeto;
    return crearURL.call(URL, objeto as Blob);
  }) as typeof URL.createObjectURL;

  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    if (this.download && this.href.startsWith("blob:")) {
      nombreDescarga = this.download;
      return; // descarga tragada: los bytes ya están capturados
    }
    clickOriginal.call(this);
  };

  let nombreDevuelto: string;
  try {
    nombreDevuelto = await generar();
  } finally {
    URL.createObjectURL = crearURL;
    HTMLAnchorElement.prototype.click = clickOriginal;
  }

  if (!blob) {
    throw new Error(
      "No se pudo capturar el .pptx: el renderer no pasó por la descarga esperada.",
    );
  }
  const datos = await (blob as Blob).arrayBuffer();
  return { nombre: nombreDescarga || nombreDevuelto, datos };
}

/* --------------------------------- ZIP ----------------------------------- */

export type EntradaZip = { nombre: string; datos: ArrayBuffer };

/**
 * Empaqueta los .pptx generados más un RESUMEN.txt. Los .pptx ya son ZIP
 * comprimidos, así que se guardan con STORE (recomprimirlos solo cuesta tiempo).
 */
export function construirZipPresentaciones(
  entradas: EntradaZip[],
  resumen: string,
): Blob {
  const zip = new PizZip();
  for (const entrada of entradas) {
    zip.file(entrada.nombre, entrada.datos, {
      binary: true,
      compression: "STORE",
    });
  }
  // Siempre presente, incluso si todo salió bien: el usuario que abre el ZIP
  // debe poder contrastar cuántas unidades esperaba contra cuántas hay.
  zip.file("RESUMEN.txt", resumen, { compression: "DEFLATE" });

  return zip.generate({
    type: "blob",
    mimeType: "application/zip",
    compression: "STORE",
  });
}

/** Trocito de nombre de archivo seguro (sin acentos, espacios ni separadores). */
export function trozoNombreSeguro(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
