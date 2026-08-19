// Maquetación de CLIENTE de la hoja de trabajo (worksheet) a .docx, con la
// librería `docx` (construcción programática, sin plantilla).
//
// Por qué sin plantilla: a diferencia del F-32, el F-51 y los exámenes —que
// rellenan un .docx institucional con Docxtemplater— no existe un formato
// oficial FIDENA de hoja de trabajo. Mientras no lo haya, el documento se arma
// aquí con los colores y la tipografía de la app. Si más adelante llega la
// plantilla oficial, este módulo se sustituye por el patrón Docxtemplater sin
// tocar la ruta de IA ni la pestaña: el contrato es `WorksheetIA`.
//
// Se ejecuta en el navegador (la ruta /api/worksheet solo devuelve el JSON), de
// modo que el ZIP de varias unidades se arma sin que el servidor mande binarios.

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { WorksheetIA } from "./esquemaWorksheet";

const AZUL = "071A33"; // institucional (mismo que la UI)
const ORO = "C8A45D";
const GRIS = "64748B";

/** Datos de encabezado que NO vienen de la IA: los pone el docente en la app. */
export type MetaWorksheet = {
  escuela: string;
  materia: string;
  licenciatura: string;
  semestre: string;
  unidadNumero: number;
  unidadTema: string;
  docente: string;
  grupo: string;
  periodo: string;
};

export type OpcionesWorksheet = {
  /** Añade al final, en página aparte, la hoja de respuestas del docente. */
  incluirRespuestas?: boolean;
};

/**
 * Construye el .docx y devuelve sus bytes. Se devuelve ArrayBuffer (no Blob)
 * porque es lo que necesita el ZIP cuando se generan varias unidades; para una
 * sola, el llamador lo envuelve en un Blob.
 */
export async function worksheetADocx(
  w: WorksheetIA,
  meta: MetaWorksheet,
  opciones: OpcionesWorksheet = {},
): Promise<ArrayBuffer> {
  const cuerpo: Paragraph[] = [
    ...encabezado(meta),
    ...titulo(w, meta),
    ...datosCadete(),
    ...objetivo(w),
    ...conceptosClave(w),
    ...instrucciones(w),
  ];

  // Las secciones se numeran en romano SOLO sobre las que traen reactivos: una
  // hoja sin problemas no debe mostrar un "Sección IV" vacío ni saltarse el III.
  const secciones: (Paragraph | Table)[] = [];
  const romanos = ["I", "II", "III", "IV"];
  let n = 0;

  if (w.opcionMultiple.length > 0) {
    secciones.push(
      ...tituloSeccion(
        romanos[n++],
        "Opción múltiple",
        "Subraya o encierra la respuesta correcta.",
      ),
      ...seccionOpcionMultiple(w),
    );
  }
  if (w.completar.length > 0) {
    secciones.push(
      ...tituloSeccion(
        romanos[n++],
        "Completa",
        "Escribe en cada espacio el término que corresponde.",
      ),
      ...seccionCompletar(w),
    );
  }
  if (w.relacionarColumnas.length > 0) {
    secciones.push(
      ...tituloSeccion(
        romanos[n++],
        "Relaciona las columnas",
        "Escribe dentro del paréntesis la letra que corresponde.",
      ),
      tablaRelacionar(w),
      espacio(),
    );
  }
  if (w.problemas.length > 0) {
    secciones.push(
      ...tituloSeccion(
        romanos[n++],
        "Resuelve",
        "Desarrolla tu procedimiento en el espacio indicado.",
      ),
      ...seccionProblemas(w),
    );
  }

  const doc = new Document({
    creator: meta.docente || "FIDENA",
    title: w.titulo,
    description: `Hoja de trabajo — ${meta.materia}, Unidad ${meta.unidadNumero}`,
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } }, // 11 pt
      },
    },
    sections: [
      {
        properties: {
          page: {
            // Márgenes en twips (1440 = 1 pulgada).
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children: [...cuerpo, ...secciones],
      },
      ...(opciones.incluirRespuestas
        ? [
            {
              properties: {
                page: {
                  margin: {
                    top: 1134,
                    right: 1134,
                    bottom: 1134,
                    left: 1134,
                  },
                },
              },
              children: hojaRespuestas(w, meta),
            },
          ]
        : []),
    ],
  });

  return Packer.toArrayBuffer(doc);
}

/* ------------------------------ bloques del documento ---------------------- */

function encabezado(meta: MetaWorksheet): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: meta.escuela,
          bold: true,
          size: 18, // 9 pt
          color: AZUL,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: [meta.licenciatura, meta.semestre, meta.periodo]
            .filter(Boolean)
            .join("  ·  "),
          size: 18,
          color: GRIS,
        }),
      ],
    }),
    reglaHorizontal(),
  ];
}

function titulo(w: WorksheetIA, meta: MetaWorksheet): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 240, after: 40 },
      children: [
        new TextRun({
          text: "HOJA DE TRABAJO",
          bold: true,
          size: 18,
          color: ORO,
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: w.titulo, bold: true, size: 32, color: AZUL }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `${meta.materia}  —  Unidad ${meta.unidadNumero}: ${meta.unidadTema}`,
          size: 20,
          color: GRIS,
        }),
      ],
    }),
  ];
}

/** Renglones que llena el cadete a mano al recibir la hoja. */
function datosCadete(): Paragraph[] {
  return [
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "Nombre: ", bold: true, size: 20 }),
        new TextRun({ text: "_".repeat(46), size: 20 }),
        new TextRun({ text: "   Fecha: ", bold: true, size: 20 }),
        new TextRun({ text: "_".repeat(16), size: 20 }),
      ],
    }),
  ];
}

function objetivo(w: WorksheetIA): Paragraph[] {
  return [
    etiqueta("Objetivo"),
    new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({ text: w.objetivo, size: 20 })],
    }),
  ];
}

function conceptosClave(w: WorksheetIA): Paragraph[] {
  if (w.conceptosClave.length === 0) return [];
  return [
    etiqueta("Conceptos clave"),
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({ text: w.conceptosClave.join("  ·  "), size: 20 }),
      ],
    }),
  ];
}

function instrucciones(w: WorksheetIA): Paragraph[] {
  return [
    etiqueta("Instrucciones"),
    new Paragraph({
      spacing: { after: 240 },
      children: [new TextRun({ text: w.instruccionesGenerales, size: 20 })],
    }),
  ];
}

function tituloSeccion(
  romano: string,
  nombre: string,
  instruccion: string,
): Paragraph[] {
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 40 },
      children: [
        new TextRun({
          text: `${romano}. ${nombre.toUpperCase()}`,
          bold: true,
          size: 24,
          color: AZUL,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({ text: instruccion, italics: true, size: 18, color: GRIS }),
      ],
    }),
  ];
}

function seccionOpcionMultiple(w: WorksheetIA): Paragraph[] {
  const out: Paragraph[] = [];
  w.opcionMultiple.forEach((r, i) => {
    out.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: `${i + 1}. `, bold: true, size: 20 }),
          new TextRun({ text: r.enunciado, size: 20 }),
        ],
      }),
    );
    r.opciones.forEach((op, j) => {
      out.push(
        new Paragraph({
          indent: { left: 480 },
          spacing: { after: 30 },
          children: [
            new TextRun({ text: `${letra(j)}) `, size: 20 }),
            new TextRun({ text: op, size: 20 }),
          ],
        }),
      );
    });
    out.push(espacio(80));
  });
  return out;
}

function seccionCompletar(w: WorksheetIA): Paragraph[] {
  return w.completar.map(
    (r, i) =>
      new Paragraph({
        spacing: { after: 140 },
        children: [
          new TextRun({ text: `${i + 1}. `, bold: true, size: 20 }),
          new TextRun({ text: r.enunciado, size: 20 }),
        ],
      }),
  );
}

/**
 * Tabla de dos columnas. Las descripciones se muestran ROTADAS respecto a los
 * conceptos para que la correspondencia no sea la trivial 1-A, 2-B, 3-C…, pero
 * con una rotación fija (no aleatoria) para que el mismo worksheet genere
 * siempre el mismo documento y la hoja de respuestas cuadre.
 */
function tablaRelacionar(w: WorksheetIA): Table {
  const pares = w.relacionarColumnas;
  const orden = ordenRotado(pares.length);

  const filas = pares.map((par, i) => {
    const derecha = pares[orden[i]];
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "(     )  ", size: 20 }),
                new TextRun({ text: `${i + 1}. `, bold: true, size: 20 }),
                new TextRun({ text: par.concepto, size: 20 }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `${letra(i)}) `, bold: true, size: 20 }),
                new TextRun({ text: derecha.descripcion, size: 20 }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: sinBordes(),
    rows: filas,
  });
}

function seccionProblemas(w: WorksheetIA): Paragraph[] {
  const out: Paragraph[] = [];
  w.problemas.forEach((p, i) => {
    out.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: `${i + 1}. `, bold: true, size: 20 }),
          new TextRun({ text: p.enunciado, size: 20 }),
        ],
      }),
    );
    for (let l = 0; l < p.lineasRespuesta; l++) out.push(renglon());
    out.push(espacio(120));
  });
  return out;
}

/* ----------------------------- hoja de respuestas -------------------------- */

function hojaRespuestas(w: WorksheetIA, meta: MetaWorksheet): Paragraph[] {
  const out: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: "USO EXCLUSIVO DEL DOCENTE",
          bold: true,
          size: 18,
          color: ORO,
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "Hoja de respuestas",
          bold: true,
          size: 30,
          color: AZUL,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `${meta.materia} — Unidad ${meta.unidadNumero}: ${meta.unidadTema}`,
          size: 20,
          color: GRIS,
        }),
      ],
    }),
  ];

  if (w.opcionMultiple.length > 0) {
    out.push(etiqueta("Opción múltiple"));
    out.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: w.opcionMultiple
              .map((r, i) => `${i + 1}. ${letra(r.correcta)}`)
              .join("     "),
            size: 20,
          }),
        ],
      }),
    );
  }

  if (w.completar.length > 0) {
    out.push(etiqueta("Completa"));
    w.completar.forEach((r, i) => {
      out.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true, size: 20 }),
            new TextRun({ text: r.respuesta, size: 20 }),
          ],
        }),
      );
    });
    out.push(espacio(160));
  }

  if (w.relacionarColumnas.length > 0) {
    const orden = ordenRotado(w.relacionarColumnas.length);
    // orden[i] = índice del par cuya descripción se imprimió en la fila i con la
    // letra `letra(i)`. Para el concepto j, su descripción está en la fila i tal
    // que orden[i] === j: esa es la letra que va en el paréntesis.
    const letraDe = new Map<number, string>();
    orden.forEach((j, i) => letraDe.set(j, letra(i)));

    out.push(etiqueta("Relaciona las columnas"));
    out.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: w.relacionarColumnas
              .map((_, j) => `${j + 1}. ${letraDe.get(j) ?? "?"}`)
              .join("     "),
            size: 20,
          }),
        ],
      }),
    );
  }

  if (w.problemas.length > 0) {
    out.push(etiqueta("Resuelve"));
    w.problemas.forEach((p, i) => {
      out.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true, size: 20 }),
            new TextRun({ text: p.respuestaModelo, size: 20 }),
          ],
        }),
      );
    });
  }

  return out;
}

/* --------------------------------- utilidades ------------------------------ */

/** "a", "b", "c"… para las opciones e incisos. */
function letra(i: number): string {
  return String.fromCharCode(97 + (i % 26));
}

/**
 * Permutación fija sin puntos fijos (para n > 1): rota una posición. Evita que
 * la columna derecha quede alineada con la izquierda sin usar aleatoriedad, que
 * haría irreproducible la hoja de respuestas.
 */
function ordenRotado(n: number): number[] {
  if (n <= 1) return [0].slice(0, n);
  // Desplazamiento ~1/3 de la lista: para n pequeños cae en 1 (rotación simple).
  const salto = Math.max(1, Math.floor(n / 3));
  return Array.from({ length: n }, (_, i) => (i + salto) % n);
}

function etiqueta(texto: string): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 40 },
    children: [
      new TextRun({
        text: texto.toUpperCase(),
        bold: true,
        size: 18,
        color: ORO,
      }),
    ],
  });
}

function espacio(after = 200): Paragraph {
  return new Paragraph({ spacing: { after }, children: [] });
}

/** Renglón en blanco para que el cadete escriba encima. */
function renglon(): Paragraph {
  return new Paragraph({
    spacing: { after: 220 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1", space: 1 },
    },
    children: [],
  });
}

function reglaHorizontal(): Paragraph {
  return new Paragraph({
    spacing: { after: 0 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: ORO, space: 1 },
    },
    children: [],
  });
}

function sinBordes() {
  const nada = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return {
    top: nada,
    bottom: nada,
    left: nada,
    right: nada,
    insideHorizontal: nada,
    insideVertical: nada,
  };
}
