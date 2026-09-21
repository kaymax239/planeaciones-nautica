// Convierte los formatos institucionales de Regularización (descargados del
// Drive de FIDENA) en plantillas Docxtemplater para public/templates/.
//
//   node scripts/crear-plantillas-regularizacion.mjs <F-04.docx> <F-05.docx>
//
// Origen de los formatos (Drive compartido FIDENA):
//   - FID-FOR-F-04_Lista_asistencia_Regularizacion_Academicas (2).docx (Rev.2, 05/04/16)
//   - FID-FOR-F-05_Plan_Estrategico_ Recuperacion.docx (Rev.1, 05/04/17)
//
// Solo se sustituye el TEXTO de las celdas de datos por marcadores; encabezado,
// pie, logotipos, bordes y anchos quedan intactos. Se puede volver a correr si
// llega una revisión nueva del formato.

import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";

const [, , rutaF04, rutaF05] = process.argv;
if (!rutaF04 || !rutaF05) {
  console.error("Uso: node scripts/crear-plantillas-regularizacion.mjs <F-04.docx> <F-05.docx>");
  process.exit(1);
}
const destino = path.resolve(import.meta.dirname, "../public/templates");

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const tablas = (xml) => [...xml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)].map((m) => m[0]);
const filas = (tbl) => [...tbl.matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map((m) => m[0]);
const celdas = (tr) => [...tr.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((m) => m[0]);

// Formato uniforme para todo lo que llena la app: Montserrat 9 pt, la del propio
// formato (el ejemplo de origen mezclaba Times y Montserrat en varios tamaños).
const RPR_DATO =
  '<w:rPr><w:rFonts w:ascii="Montserrat" w:hAnsi="Montserrat" w:cs="Montserrat" w:eastAsia="Montserrat"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>';

/** Reescribe una celda con un solo párrafo/run que contiene `texto`,
 *  conservando las propiedades de celda y del primer párrafo. `rPrFijo` fuerza
 *  el formato del texto; si no se da, se hereda el del primer run. */
function celdaCon(tc, texto, rPrFijo = RPR_DATO, { sinViñeta = false } = {}) {
  const tcPr = tc.match(/<w:tcPr>[\s\S]*?<\/w:tcPr>/)?.[0] ?? "";
  const p = tc.match(/<w:p[ >][\s\S]*?<\/w:p>/)?.[0] ?? "";
  let pPr = p.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)?.[0] ?? "";
  if (sinViñeta) pPr = pPr.replace(/<w:numPr>[\s\S]*?<\/w:numPr>/, "").replace(/<w:ind [^>]*\/>/, "");
  const runs = [...tc.matchAll(/<w:r[ >][\s\S]*?<\/w:r>/g)].map((m) => m[0]);
  let rPr = runs.map((r) => r.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)?.[0]).find(Boolean);
  if (!rPr) rPr = pPr.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)?.[0] ?? "";
  if (rPrFijo) rPr = rPrFijo;
  return `<w:tc>${tcPr}<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${esc(texto)}</w:t></w:r></w:p></w:tc>`;
}

/** Aplica `fn(celdas) → celdas` a la fila `i` de la tabla. */
function editarFila(tbl, i, fn) {
  const trs = filas(tbl);
  const tr = trs[i];
  const tcs = celdas(tr);
  const nuevas = fn(tcs);
  // Reconstrucción posicional: dos celdas vacías pueden tener XML idéntico, así
  // que un replace() por contenido podría tocar la celda equivocada.
  let nuevo = "";
  let cursor = 0;
  tcs.forEach((tc, k) => {
    const ini = tr.indexOf(tc, cursor);
    nuevo += tr.slice(cursor, ini) + nuevas[k];
    cursor = ini + tc.length;
  });
  nuevo += tr.slice(cursor);
  return tbl.replace(tr, nuevo);
}

function quitarFilas(tbl, desde, hasta) {
  const trs = filas(tbl);
  for (let i = desde; i <= hasta; i++) tbl = tbl.replace(trs[i], "");
  return tbl;
}

function procesar(ruta, transformar, salida) {
  const zip = new PizZip(fs.readFileSync(ruta));
  let xml = zip.file("word/document.xml").asText();
  const ts = tablas(xml);
  const nuevas = transformar(ts);
  ts.forEach((t, i) => {
    if (nuevas[i] !== t) xml = xml.replace(t, nuevas[i]);
  });
  zip.file("word/document.xml", xml);
  fs.writeFileSync(path.join(destino, salida), zip.generate({ type: "nodebuffer", compression: "DEFLATE" }));
  console.log("✔", salida);
}

// ── F-04 Lista de asistencia ────────────────────────────────────────────────
procesar(
  rutaF04,
  ([encabezado, lista, ...resto]) => {
    encabezado = editarFila(encabezado, 0, ([a, b]) => [a, celdaCon(b, "{docente}")]);
    encabezado = editarFila(encabezado, 1, ([a, b]) => [a, celdaCon(b, "{asignatura}")]);
    // Fila 1 = renglón que se repite por (sesión × estudiante); el resto se quita.
    const total = filas(lista).length;
    lista = quitarFilas(lista, 2, total - 1);
    lista = editarFila(lista, 1, ([n, s, f, t, fi]) => [
      celdaCon(n, "{#filas}{nombre}"),
      celdaCon(s, "{semestre}"),
      celdaCon(f, "{fecha}"),
      celdaCon(t, "{tema}"),
      celdaCon(fi, "{/filas}"),
    ]);
    // Fecha: 850 → 1150 twips (con 850 hasta "21/09/26" se parte en dos
    // renglones); se toma de Tema, la columna más ancha. Sin tcW en las celdas.
    lista = lista.replaceAll(
      '<w:gridCol w:w="850"/><w:gridCol w:w="5353"/>',
      '<w:gridCol w:w="1150"/><w:gridCol w:w="5053"/>',
    );
    return [encabezado, lista, ...resto];
  },
  "Regularizacion-F04.docx",
);

// ── F-05 Plan Estratégico de Recuperación ───────────────────────────────────
procesar(
  rutaF05,
  ([alumnos, contenidos, estrategias, firmas]) => {
    // Filas 1..8: número (se deja) | nombre | columnas derechas combinadas.
    for (let i = 1; i <= 8; i++) {
      alumnos = editarFila(alumnos, i, (tcs) => {
        const out = [...tcs];
        out[1] = celdaCon(tcs[1], `{e${i}}`);
        if (i === 1) {
          out[2] = celdaCon(tcs[2], "{asignatura}");
          // La plantilla dibuja la casilla con una viñeta de lista; se quita
          // para marcar con ☒/☐ según el periodo elegido.
          out[3] = celdaCon(tcs[3], "{marca1} 1er", RPR_DATO, { sinViñeta: true });
          out[4] = celdaCon(tcs[4], "{marca2} 2do", RPR_DATO, { sinViñeta: true });
          out[5] = celdaCon(tcs[5], "{marca3} 3er", RPR_DATO, { sinViñeta: true });
        }
        out[0] = celdaCon(tcs[0], String(i));
        if (i === 2) out[3] = celdaCon(tcs[3], "Día(s) asignados para las sesiones", null);
        if (i === 4) out[3] = celdaCon(tcs[3], "{diasSesiones}");
        if (i === 6) out[2] = celdaCon(tcs[2], "{numSesiones}");
        if (i === 7) out[3] = celdaCon(tcs[3], "{docente}");
        return out;
      });
    }
    // Resultado de aprendizaje | Contenidos: una sola fila con todo el texto.
    contenidos = editarFila(contenidos, 1, ([a, b]) => [
      celdaCon(a, "{resultadoAprendizaje}"),
      celdaCon(b, "{contenidos}"),
    ]);
    contenidos = editarFila(contenidos, 7, ([a]) => [celdaCon(a, "{competencias}")]);
    contenidos = quitarFilas(contenidos, 2, 5);

    estrategias = editarFila(estrategias, 1, ([a, b]) => [
      celdaCon(a, "{estrategiasEnsenanza}"),
      celdaCon(b, "{estrategiasAprendizaje}"),
    ]);
    estrategias = editarFila(estrategias, 3, ([a, b]) => [
      celdaCon(a, "{productos}"),
      celdaCon(b, "{planEvaluacion}"),
    ]);

    firmas = editarFila(firmas, 0, ([a, b, c]) => [
      celdaCon(a, "{jefeCarrera}"),
      b,
      celdaCon(c, "{subdirector}"),
    ]);
    // Columna del número: 392 → 560 twips, para que "10", "11"… no se partan
    // (se toma del nombre, que sobra). Las celdas no traen tcW: basta la rejilla
    // (aparece dos veces: la vigente y la de tblGridChange).
    alumnos = alumnos.replaceAll(
      '<w:gridCol w:w="392"/><w:gridCol w:w="3118"/>',
      '<w:gridCol w:w="560"/><w:gridCol w:w="2950"/>',
    );
    return [alumnos, contenidos, estrategias, firmas];
  },
  "Regularizacion-F05.docx",
);
