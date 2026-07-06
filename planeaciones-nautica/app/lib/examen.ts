// Motor de exámenes (FASE 1) — extraído de app/page.tsx para poder reutilizarlo
// desde el flujo PN/MN y desde el flujo de Inglés sin duplicar lógica.
//
// Construye las preguntas y el objeto de datos que rellena las plantillas
// institucionales examen-parcial.docx / examen-ordinario.docx. La ponderación
// oficial (los 4 esquemas de puntaje) se inyecta como TEXTO por quien llama
// (ver app/data/evaluacion.ts → textoPonderacionEvaluacion); este módulo no
// decide el esquema, solo lo coloca en la celda de temas a evaluar.

import type { ProgramaOficial } from "../data/tipos";
import {
  componerPreguntasExamen,
  fmtPuntos,
  type PreguntasExamen,
  type PuntajeExamen,
  type SeccionesCrudas,
} from "./puntajeExamen";

// Re-exporta los tipos para que el resto del código los siga importando de aquí.
export type { PreguntasExamen, PuntajeExamen };

export type SemanaMateria = {
  semana: string;
  tema: string;
};

export type DatosMateria = {
  unidad?: string;
  objetivoGeneral?: string;
  objetivoEspecifico?: string;
  estrategia?: string;
  fuentes?: string;
  semanas?: SemanaMateria[];
};

export type RangoSemanas = {
  inicio: number;
  fin: number;
};


export const limpiarTema = (tema: string) => tema.trim().replace(/\.$/, "");

// Convierte los subtemas oficiales del programa en "semanas" (un subtema por
// entrada) para alimentar los exámenes con preguntas basadas en el contenido
// REAL de la materia. Sin esto, un ProgramaOficial no expone `semanas` y el
// examen cae a una sola pregunta genérica.
export const semanasDesdePrograma = (
  programa: ProgramaOficial,
): SemanaMateria[] => {
  const limpio = (s: string) =>
    limpiarTema(s.replace(/^\d+(?:\.\d+)*\.?\s*/, ""));

  return programa.unidades
    .flatMap((u) => u.subtemas)
    .map((subtema, index) => ({
      semana: `Semana ${index + 1}`,
      tema: limpio(subtema),
    }))
    .filter((s) => s.tema.trim().length > 0);
};

export const nombreArchivoSeguro = (valor: string) =>
  valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const contieneAlgunaPalabra = (texto: string, palabras: string[]) => {
  const textoNormalizado = texto.toLowerCase();

  return palabras.some((palabra) => textoNormalizado.includes(palabra));
};

export const obtenerContextoDidactico = (materia: string, tema: string) => {
  const textoBase = `${materia} ${tema}`;

  if (
    contieneAlgunaPalabra(textoBase, [
      "naveg",
      "marít",
      "maritim",
      "náut",
      "naut",
      "buque",
      "maniobra",
      "cartograf",
      "meteorolog",
      "puerto",
      "portuar",
      "transporte",
      "guardia",
      "radar",
      "ecdis",
      "seguridad",
      "pmr",
    ])
  ) {
    return "el contexto de navegación, operaciones portuarias, seguridad marítima o vida a bordo";
  }

  if (
    contieneAlgunaPalabra(textoBase, [
      "álgebra",
      "algebra",
      "geometr",
      "física",
      "fisica",
      "dinámica",
      "dinamica",
      "química",
      "quimica",
      "electric",
      "electrotecnia",
    ])
  ) {
    return "la solución de problemas técnicos y académicos vinculados con la formación náutica";
  }

  if (
    contieneAlgunaPalabra(textoBase, [
      "inglés",
      "ingles",
      "expresión",
      "expresion",
      "comunicación",
      "comunicacion",
      "liderazgo",
      "derecho",
    ])
  ) {
    return "situaciones profesionales, comunicativas y colaborativas propias del entorno marítimo";
  }

  return "la formación académica y profesional del cadete";
};

export const construirPreguntasExamen = (
  materia: string,
  temas: SemanaMateria[],
  puntaje?: PuntajeExamen,
): PreguntasExamen => {
  const temasLimpios = temas.map((semana) => limpiarTema(semana.tema));
  const temasBase =
    temasLimpios.length > 0
      ? temasLimpios
      : [`contenidos esenciales de ${materia}`];

  // Preguntas "crudas" (sin numerar); el compositor numera, recorta y —si hay
  // total— antepone el puntaje de cada sección. Mismo texto genérico de antes.
  const crudas: SeccionesCrudas = {
    opcionMultiple: temasBase.map(
      (tema) =>
        `¿Cuál es la importancia de ${tema} dentro de ${materia}?\n` +
        `A) Permite aplicar el contenido en situaciones académicas o náuticas.\n` +
        `B) Sustituye todos los demás temas de la asignatura.\n` +
        `C) No tiene relación con la formación profesional.\n` +
        `D) Solo se utiliza para actividades administrativas.`,
    ),
    verdaderoFalso: temasBase.map(
      (tema) =>
        `${tema} debe analizarse considerando conceptos, procedimientos y aplicaciones propias de ${materia}. (V/F)`,
    ),
    relacionarColumnas: temasBase.map((tema) => ({
      concepto: tema,
      descripcion: `Aplicación, concepto o procedimiento relacionado con ${tema}.`,
    })),
    preguntasAbiertas: temasBase.map(
      (tema) =>
        `Explica cómo se aplica ${tema} en el contexto académico o profesional de ${materia}.`,
    ),
  };

  return componerPreguntasExamen(crudas, puntaje);
};

export const construirDatosExamen = ({
  tipo,
  materia,
  datosMateria,
  docente,
  grupo,
  semestre,
  fecha,
  periodoEscolar,
  rango,
  ponderacion,
  preguntas,
  puntaje,
}: {
  tipo: string;
  materia: string;
  datosMateria?: DatosMateria;
  docente: string;
  grupo: string;
  semestre: string;
  fecha: string;
  periodoEscolar: string;
  rango: RangoSemanas;
  ponderacion?: string;
  /**
   * Preguntas generadas por IA (Gemini). Si se proveen, se usan tal cual (ya
   * traen el puntaje por sección); si no, se cae al banco determinista
   * (construirPreguntasExamen), que aplica el mismo puntaje.
   */
  preguntas?: PreguntasExamen;
  /**
   * Puntaje del examen (total + puntos por sección). Si se provee: agrega
   * "Este examen vale N puntos" y reparte el total entre las 4 secciones. Si es
   * undefined (materia sin clasificación), el examen sale sin puntos.
   */
  puntaje?: PuntajeExamen;
}) => {
  const semanas = datosMateria?.semanas?.slice(rango.inicio, rango.fin) || [];
  const temasTexto = semanas
    .map((semana, index) => {
      const numeroSemana = rango.inicio + index + 1;

      return `Semana ${numeroSemana}. ${limpiarTema(semana.tema)}`;
    })
    .join("\n");
  const temas = semanas.map((semana) => limpiarTema(semana.tema));
  const objetivo =
    datosMateria?.objetivoEspecifico ||
    datosMateria?.objetivoGeneral ||
    `Evaluar los aprendizajes de ${materia}.`;
  // IA si viene (ya trae puntaje); determinista si no (mismo puntaje). Defensivo:
  // si el reparto de puntos fuera inválido, se genera sin puntos antes que fallar.
  let preguntasFinales: PreguntasExamen;
  if (preguntas) {
    preguntasFinales = preguntas;
  } else {
    try {
      preguntasFinales = construirPreguntasExamen(materia, semanas, puntaje);
    } catch (e) {
      console.warn("Puntaje de examen inválido; se genera sin puntos:", e);
      preguntasFinales = construirPreguntasExamen(materia, semanas);
    }
  }

  return {
    tipoExamen: tipo,
    examen: tipo,
    materia,
    asignatura: materia,
    asignaturaCurso: materia,
    curso: materia,
    semestre,
    docente,
    profesor: docente,
    grupo,
    fecha,
    fechaInicio: fecha,
    periodo: periodoEscolar,
    periodoEscolar,
    unidad: datosMateria?.unidad || "I",
    objetivo,
    objetivosCompetencias: objetivo,
    temas: temasTexto,
    temasMateria: temasTexto,
    temasEvaluar: [
      temasTexto,
      puntaje ? `Este examen vale ${fmtPuntos(puntaje.total)} puntos.` : "",
      ponderacion,
    ]
      .filter((s) => s && s.trim().length > 0)
      .join("\n\n"),
    opcionMultiple: preguntasFinales.opcionMultiple,
    verdaderoFalso: preguntasFinales.verdaderoFalso,
    relacionarColumnas: preguntasFinales.relacionarColumnas,
    preguntasAbiertas: preguntasFinales.preguntasAbiertas,
    tema1: temas[0] || "",
    tema2: temas[1] || "",
    tema3: temas[2] || "",
    tema4: temas[3] || "",
    tema5: temas[4] || "",
    tema6: temas[5] || "",
    tema7: temas[6] || "",
    tema8: temas[7] || "",
    tema9: temas[8] || "",
    tema10: temas[9] || "",
    tema11: temas[10] || "",
    tema12: temas[11] || "",
    tema13: temas[12] || "",
    tema14: temas[13] || "",
    tema15: temas[14] || "",
    tema16: temas[15] || "",
    tema17: temas[16] || "",
    tema18: temas[17] || "",
  };
};
