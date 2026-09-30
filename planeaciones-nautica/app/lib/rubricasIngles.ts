// Rúbricas de Speaking y Writing (Inglés) y su render a Word.
//
// Speaking: Fluency · Accuracy · Pronunciation · Interaction & task.
// Writing:  Task & content · Organization · Grammar · Vocabulary · Mechanics.
// Los pesos de cada criterio SUMAN el total de la habilidad (17 parcial /
// 20 ordinario); se valida al construir la tabla.
//
// Además adapta la plantilla examen-parcial.docx para Inglés:
//  - quita "TEMAS EVALUADOS" en los 5 exámenes;
//  - en Speaking/Writing deja una sola sección (tarea + rúbrica) en lugar de
//    las 4 de reactivos.

import type { HabilidadIngles } from "./puntajeExamen";

type Criterio = {
  nombre: string;
  /** Descriptores: Excellent · Good · Fair · Poor. */
  niveles: [string, string, string, string];
};

const CRITERIOS_SPEAKING: Criterio[] = [
  {
    nombre: "Fluency",
    niveles: [
      "Speaks with ease; natural pace; only brief pauses to think.",
      "Some hesitation, but keeps going and completes ideas.",
      "Frequent pauses; short answers; needs prompting.",
      "Isolated words or memorized phrases; cannot continue.",
    ],
  },
  {
    nombre: "Accuracy (grammar & vocabulary)",
    niveles: [
      "Uses the unit structures and vocabulary correctly; very few errors.",
      "Some errors, but meaning is always clear.",
      "Frequent errors; meaning sometimes unclear; limited vocabulary.",
      "Errors prevent communication; very limited vocabulary.",
    ],
  },
  {
    nombre: "Pronunciation",
    niveles: [
      "Clear and easy to understand; good stress and intonation.",
      "Generally clear; some errors that do not block meaning.",
      "Often unclear; the listener must make an effort.",
      "Mostly unintelligible.",
    ],
  },
  {
    nombre: "Interaction & task completion",
    niveles: [
      "Answers every question fully and develops the card.",
      "Answers most questions; develops the card partly.",
      "Short or incomplete answers; needs a lot of help.",
      "Does not answer or answers off topic.",
    ],
  },
];

const CRITERIOS_WRITING: Criterio[] = [
  {
    nombre: "Task completion & content",
    niveles: [
      "Includes every required point; required length; purpose is clear.",
      "Includes most points; length close to the requirement.",
      "Includes some points; too short or partly off topic.",
      "Does not answer the task.",
    ],
  },
  {
    nombre: "Organization (paragraph structure & connectors)",
    niveles: [
      "Topic sentence, supporting details and conclusion; good connectors.",
      "Clear order; some connectors; weak conclusion.",
      "Ideas listed without clear order; few connectors.",
      "No paragraph structure.",
    ],
  },
  {
    nombre: "Grammar accuracy",
    niveles: [
      "Unit structures used correctly; very few errors.",
      "Some errors; meaning is clear.",
      "Frequent errors; meaning sometimes unclear.",
      "Errors prevent understanding.",
    ],
  },
  {
    nombre: "Vocabulary",
    niveles: [
      "Varied, accurate unit vocabulary.",
      "Adequate vocabulary; some repetition.",
      "Limited or repetitive vocabulary.",
      "Very limited vocabulary.",
    ],
  },
  {
    nombre: "Mechanics (spelling, capitals, punctuation)",
    niveles: [
      "Almost no mistakes.",
      "A few mistakes.",
      "Frequent mistakes.",
      "Mistakes make the text hard to read.",
    ],
  },
];

// Peso de cada criterio (mismo orden que arriba). Suman 17 y 20.
const PESOS: Record<"Speaking" | "Writing", Record<17 | 20, number[]>> = {
  Speaking: { 17: [5, 5, 4, 3], 20: [6, 6, 4, 4] },
  Writing: { 17: [5, 4, 4, 2, 2], 20: [5, 5, 4, 3, 3] },
};

const medio = (x: number) => Math.round(x * 2) / 2;
const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));

/** Puntos de cada banda: Excellent = máx, Good ≈ 75 %, Fair ≈ 50 %, Poor 0–25 %. */
function bandas(max: number): [string, string, string, string] {
  return [
    fmt(max),
    fmt(medio(max * 0.75)),
    fmt(medio(max * 0.5)),
    `0–${fmt(medio(max * 0.25))}`,
  ];
}

/* ============================== XML Word ============================== */

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function run(texto: string, sz: number, negrita: boolean): string {
  const b = negrita ? "<w:b/><w:bCs/>" : "";
  return `<w:r><w:rPr>${b}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${esc(texto)}</w:t></w:r>`;
}

function parrafo(
  runs: string,
  opts: { centrado?: boolean; antes?: number; despues?: number; lineaInferior?: boolean } = {},
): string {
  const jc = opts.centrado ? `<w:jc w:val="center"/>` : "";
  const borde = opts.lineaInferior
    ? `<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="000000"/></w:pBdr>`
    : "";
  return `<w:p><w:pPr>${borde}<w:spacing w:before="${opts.antes ?? 0}" w:after="${opts.despues ?? 0}"/>${jc}</w:pPr>${runs}</w:p>`;
}

function celda(
  ancho: number,
  contenido: string,
  opts: { sombra?: boolean; centrado?: boolean; sz?: number; negrita?: boolean } = {},
): string {
  const shd = opts.sombra ? `<w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/>` : "";
  const lineas = contenido.split("\n");
  const ps = lineas
    .map((l, i) =>
      parrafo(run(l, opts.sz ?? 16, !!opts.negrita || (i === 0 && lineas.length > 1)), {
        centrado: opts.centrado,
      }),
    )
    .join("");
  return `<w:tc><w:tcPr><w:tcW w:w="${ancho}" w:type="dxa"/>${shd}<w:vAlign w:val="center"/></w:tcPr>${ps}</w:tc>`;
}

// Ancho útil de la plantilla: 12240 − 709 − 900 = 10631 twips.
const ANCHOS = [2100, 1900, 1900, 1900, 1900, 900]; // = 10600

function tablaRubrica(
  titulo: string,
  criterios: Criterio[],
  pesos: number[],
  total: number,
): string {
  const suma = pesos.reduce((a, b) => a + b, 0);
  if (suma !== total || pesos.length !== criterios.length) {
    throw new Error(`Rúbrica ${titulo}: los pesos suman ${suma}, no ${total}.`);
  }
  const bordes = ["top", "left", "bottom", "right", "insideH", "insideV"]
    .map((b) => `<w:${b} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`)
    .join("");
  const grid = ANCHOS.map((w) => `<w:gridCol w:w="${w}"/>`).join("");
  const fila = (celdas: string) =>
    `<w:tr><w:trPr><w:cantSplit/></w:trPr>${celdas}</w:tr>`;

  const encabezado = fila(
    [
      celda(ANCHOS[0], "Criterion", { sombra: true, negrita: true, centrado: true }),
      celda(ANCHOS[1], "Excellent", { sombra: true, negrita: true, centrado: true }),
      celda(ANCHOS[2], "Good", { sombra: true, negrita: true, centrado: true }),
      celda(ANCHOS[3], "Fair", { sombra: true, negrita: true, centrado: true }),
      celda(ANCHOS[4], "Poor", { sombra: true, negrita: true, centrado: true }),
      celda(ANCHOS[5], "Score", { sombra: true, negrita: true, centrado: true }),
    ].join(""),
  );

  const filas = criterios
    .map((c, i) => {
      const b = bandas(pesos[i]);
      return fila(
        [
          celda(ANCHOS[0], `${c.nombre}\n(${pesos[i]} pts)`, { negrita: true }),
          ...c.niveles.map((d, j) =>
            celda(ANCHOS[j + 1], `${b[j]} pts\n${d}`),
          ),
          celda(ANCHOS[5], `____ / ${pesos[i]}`, { centrado: true }),
        ].join(""),
      );
    })
    .join("");

  const totalFila = fila(
    [
      `<w:tc><w:tcPr><w:tcW w:w="${ANCHOS.slice(0, 5).reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:gridSpan w:val="5"/><w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/></w:tcPr>${parrafo(run("TOTAL", 18, true), { centrado: false })}</w:tc>`,
      celda(ANCHOS[5], `____ / ${total}`, { centrado: true, negrita: true, sz: 18, sombra: true }),
    ].join(""),
  );

  const tabla = `<w:tbl><w:tblPr><w:tblW w:w="10600" w:type="dxa"/><w:tblBorders>${bordes}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="60" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${encabezado}${filas}${totalFila}</w:tbl>`;

  return (
    parrafo(run(titulo, 20, true), { antes: 200, despues: 80 }) + tabla
  );
}

/** Renglones para que el cadete escriba su párrafo. */
function renglones(n: number): string {
  const r = Array.from({ length: n }, () =>
    parrafo(run(" ", 20, false), { antes: 220, lineaInferior: true }),
  ).join("");
  return (
    parrafo(run("Write your paragraph here:", 20, true), { antes: 160 }) +
    r +
    parrafo(run("Word count: ______", 18, true), { antes: 120 })
  );
}

/**
 * XML crudo ({@bloqueProduccion}) que va DESPUÉS de la tarea: renglones de
 * escritura (solo Writing) + tabla de rúbrica + total. undefined si la
 * habilidad no es de producción.
 */
export function bloqueProduccionXml(
  habilidad: HabilidadIngles,
  total: number,
): string | undefined {
  if (habilidad !== "Speaking" && habilidad !== "Writing") return undefined;
  const t = (total === 20 ? 20 : 17) as 17 | 20;
  if (habilidad === "Speaking") {
    return tablaRubrica(
      `SPEAKING RUBRIC — ${t} points (circle the band and write the score)`,
      CRITERIOS_SPEAKING,
      PESOS.Speaking[t],
      t,
    );
  }
  return (
    renglones(14) +
    tablaRubrica(
      `WRITING RUBRIC — ${t} points (teacher use)`,
      CRITERIOS_WRITING,
      PESOS.Writing[t],
      t,
    )
  );
}

/* ======================= Adaptación de la plantilla ======================= */

// Un párrafo completo (<w:p …>…</w:p>) que contiene `texto`, sin cruzar a otro.
const parrafoCon = (texto: string) =>
  new RegExp(
    `<w:p(?=[\\s>])(?:(?!</w:p>)[\\s\\S])*?${texto.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}(?:(?!</w:p>)[\\s\\S])*?</w:p>`,
  );

/**
 * Ajusta word/document.xml de examen-parcial.docx para un examen de Inglés.
 * Todas las habilidades: sin "TEMAS EVALUADOS". Speaking/Writing: una sola
 * sección con la tarea ({opcionMultiple}) y el bloque de rúbrica
 * ({@bloqueProduccion}).
 */
export function adaptarPlantillaIngles(
  xml: string,
  habilidad: HabilidadIngles,
  total: number,
): string {
  let x = xml
    .replace(parrafoCon("TEMAS EVALUADOS:"), "")
    .replace(parrafoCon("{temasEvaluar}"), "");

  if (habilidad !== "Speaking" && habilidad !== "Writing") return x;

  const titulo =
    habilidad === "Speaking"
      ? `SPEAKING EXAM — ORAL INTERVIEW (3 MIN MAX.) · ${total} PTS`
      : `WRITING EXAM — PARAGRAPH · ${total} PTS`;
  x = x
    .replace("I. OPCIÓN MÚLTIPLE", titulo)
    .replace(parrafoCon("II. VERDADERO / FALSO"), "")
    .replace(parrafoCon("{verdaderoFalso}"), "")
    .replace(parrafoCon("III. RELACIONAR COLUMNAS"), "")
    .replace(parrafoCon("{relacionarColumnas}"), "")
    .replace(parrafoCon("IV. PREGUNTAS ABIERTAS"), "")
    .replace("{preguntasAbiertas}", "{@bloqueProduccion}");
  return x;
}
