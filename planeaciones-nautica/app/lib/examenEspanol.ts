// Exámenes en ESPAÑOL (PN / MN) con el machote oficial vigente (07-oct-2026):
// public/templates/examen-es-pn.docx y examen-es-mn.docx.
//
//   "TIEMPO DE EVALUACIÓN UNA HORA. VALOR TOTAL {valorTotal} PUNTOS, CADA
//    PREGUNTA VALE {valorPregunta} PUNTOS, SE INCLUYEN {numPreguntas} PREGUNTAS."
//
// El machote trae 70 / 7 / 10. El total sale del esquema de la materia
// (totalExamenDesdeEsquema: 70, 50, 25 o 20) y se reparte entre 10 preguntas
// del mismo valor (7, 5, 2.5 o 2). Inglés NO usa este módulo: sigue con
// examen-parcial.docx / examen-ordinario.docx y sus 5 habilidades.

import type { ExamenIA } from "./esquemaExamen";
import { fmtPuntos, type PreguntasExamen } from "./puntajeExamen";

export const MACHOTE_ES = {
  numPreguntas: 10,
  /** Reactivos de opción múltiple (van primero). */
  opcionMultiple: 6,
  /** Preguntas de desarrollo: explicar, aplicar, analizar o resolver. */
  desarrollo: 4,
  /** Total del machote si la materia no tiene esquema de evaluación. */
  totalPorDefecto: 70,
  /** Renglones en blanco para contestar cada pregunta de desarrollo. */
  renglonesRespuesta: 6,
} as const;

export const plantillaExamenES = (carrera: "PN" | "MN") =>
  `/templates/examen-es-${carrera.toLowerCase()}.docx`;

/** "Examen Parcial 1" → "PRIMER PARCIAL"; ordinario → "ORDINARIA". */
export function periodoEvaluacion(tipo: string): string {
  if (/ordinari/i.test(tipo)) return "ORDINARIA";
  if (/2|segund/i.test(tipo)) return "SEGUNDO PARCIAL";
  if (/3|tercer/i.test(tipo)) return "TERCER PARCIAL";
  return "PRIMER PARCIAL";
}

/** Grupo como lo pide el formato ("V A PN"); si no lo trae, agrega la carrera. */
export function grupoTexto(grupo: string, carrera: "PN" | "MN"): string {
  const g = (grupo ?? "").trim();
  if (!g) return carrera;
  return /\b(PN|MN)\b/i.test(g) ? g : `${g} ${carrera}`;
}

export function valoresMachote(total?: number) {
  const valorTotal =
    typeof total === "number" && total > 0 ? total : MACHOTE_ES.totalPorDefecto;
  return {
    valorTotal,
    valorPregunta: valorTotal / MACHOTE_ES.numPreguntas,
  };
}

type Reactivo =
  | { tipo: "om"; pregunta: string; opciones: string[] }
  | { tipo: "desarrollo"; pregunta: string };

function renderReactivos(reactivos: Reactivo[], total?: number): string {
  const { valorPregunta } = valoresMachote(total);
  const pts = `(${fmtPuntos(valorPregunta)} pts)`;
  const letras = ["A", "B", "C", "D"];
  const blanco = "\n".repeat(MACHOTE_ES.renglonesRespuesta);
  return reactivos
    .map((r, i) => {
      const cab = `${i + 1}. ${pts} ${r.pregunta.trim()}`;
      if (r.tipo === "om") {
        const ops = r.opciones.slice(0, 4);
        while (ops.length < 4) ops.push("—");
        return `${cab}\n${ops.map((o, k) => `     ${letras[k]}) ${o.trim()}`).join("\n")}`;
      }
      return `${cab}${blanco}`;
    })
    .join("\n\n");
}

/** Elige 6 OM + 4 desarrollo (completa con la otra si falta). Lanza si < 10. */
function seleccionar(om: Reactivo[], des: Reactivo[]): Reactivo[] {
  const N = MACHOTE_ES.numPreguntas;
  if (om.length + des.length < N) {
    throw new Error(
      `El examen trae ${om.length + des.length} preguntas; el machote pide ${N}.`,
    );
  }
  const nDes = Math.min(des.length, Math.max(MACHOTE_ES.desarrollo, N - om.length));
  const nOm = N - nDes;
  return [...om.slice(0, nOm), ...des.slice(0, nDes)];
}

/**
 * Banco de la IA → texto de las 10 preguntas (todo en `opcionMultiple`; las
 * otras 3 secciones van vacías: el machote no tiene secciones).
 */
export function formatearExamenES(datos: ExamenIA, total?: number): PreguntasExamen {
  const om: Reactivo[] = datos.opcionMultiple.map((r) => ({
    tipo: "om",
    pregunta: r.pregunta,
    opciones: r.opciones,
  }));
  const des: Reactivo[] = datos.preguntasAbiertas.map((p) => ({
    tipo: "desarrollo",
    pregunta: p,
  }));
  return {
    opcionMultiple: renderReactivos(seleccionar(om, des), total),
    verdaderoFalso: "",
    relacionarColumnas: "",
    preguntasAbiertas: "",
  };
}

/** Respaldo sin IA: 10 preguntas genéricas sobre los temas del rango. */
export function construirPreguntasES(
  materia: string,
  temas: string[],
  total?: number,
): PreguntasExamen {
  const base = temas.length > 0 ? temas : [`contenidos esenciales de ${materia}`];
  const tema = (i: number) => base[i % base.length];
  const om: Reactivo[] = Array.from({ length: MACHOTE_ES.opcionMultiple }, (_, i) => ({
    tipo: "om",
    pregunta: `¿Cuál es la importancia de ${tema(i)} dentro de ${materia}?`,
    opciones: [
      "Permite aplicar el contenido en situaciones académicas o náuticas.",
      "Sustituye todos los demás temas de la asignatura.",
      "No tiene relación con la formación profesional.",
      "Solo se utiliza para actividades administrativas.",
    ],
  }));
  const des: Reactivo[] = Array.from({ length: MACHOTE_ES.desarrollo }, (_, i) => ({
    tipo: "desarrollo",
    pregunta: `Explica cómo se aplica ${tema(MACHOTE_ES.opcionMultiple + i)} en el contexto académico o profesional de ${materia}.`,
  }));
  return {
    opcionMultiple: renderReactivos([...om, ...des], total),
    verdaderoFalso: "",
    relacionarColumnas: "",
    preguntasAbiertas: "",
  };
}

/** Campos del machote que se agregan a los de construirDatosExamen. */
export function datosMachoteES(args: {
  tipo: string;
  materia: string;
  grupo: string;
  carrera: "PN" | "MN";
  total?: number;
  preguntas: PreguntasExamen;
}) {
  const { valorTotal, valorPregunta } = valoresMachote(args.total);
  return {
    periodoEvaluacion: periodoEvaluacion(args.tipo),
    asignaturaMayus: args.materia.toLocaleUpperCase("es-MX"),
    grupoTexto: grupoTexto(args.grupo, args.carrera),
    valorTotal: fmtPuntos(valorTotal),
    valorPregunta: fmtPuntos(valorPregunta),
    numPreguntas: String(MACHOTE_ES.numPreguntas),
    preguntas: [
      args.preguntas.opcionMultiple,
      args.preguntas.verdaderoFalso,
      args.preguntas.relacionarColumnas,
      args.preguntas.preguntasAbiertas,
    ]
      .filter((s) => s && s.trim().length > 0)
      .join("\n\n"),
  };
}
