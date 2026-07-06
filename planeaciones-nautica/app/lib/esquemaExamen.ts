// Esquema del banco de reactivos que devuelve Gemini para un examen, + el
// formateador que lo convierte a los MISMOS 4 strings que produce el motor
// determinista (construirPreguntasExamen). Así la plantilla Word institucional
// (examen-parcial.docx / examen-ordinario.docx) no cambia: solo se le inyecta
// contenido REAL por tema en lugar del texto genérico.
//
// Dos representaciones del MISMO contrato:
//  - `examenIASchema` (Zod v4): validación estricta en el servidor.
//  - `responseSchemaExamen` (Type de @google/genai): fuerza JSON estructurado
//    por constrained decoding (responseMimeType "application/json").

import * as z from "zod/v4";
import { Type } from "@google/genai";
import {
  componerPreguntasExamen,
  type PreguntasExamen,
  type PuntajeExamen,
  type SeccionesCrudas,
} from "./puntajeExamen";

/* ------------------------------ Zod (validación) ------------------------------ */

const reactivoOpcionMultiple = z.object({
  pregunta: z.string().min(1),
  // 4 opciones idealmente; toleramos 2–6 y el formateador recorta/rellena.
  opciones: z.array(z.string().min(1)).min(2),
  // Índice (0-based) de la opción correcta. No se renderiza al Word; sirve para
  // validez interna y por si más adelante se agrega hoja de respuestas.
  correcta: z.number().int().min(0),
});

const reactivoVerdaderoFalso = z.object({
  afirmacion: z.string().min(1),
  respuesta: z.boolean(),
});

const parRelacion = z.object({
  concepto: z.string().min(1),
  descripcion: z.string().min(1),
});

export const examenIASchema = z.object({
  opcionMultiple: z.array(reactivoOpcionMultiple),
  verdaderoFalso: z.array(reactivoVerdaderoFalso),
  relacionarColumnas: z.array(parRelacion),
  preguntasAbiertas: z.array(z.string().min(1)),
});

export type ExamenIA = z.infer<typeof examenIASchema>;

/** true si el banco trae al menos algo de contenido usable. */
export function tienePreguntas(datos: ExamenIA): boolean {
  return (
    datos.opcionMultiple.length > 0 ||
    datos.verdaderoFalso.length > 0 ||
    datos.relacionarColumnas.length > 0 ||
    datos.preguntasAbiertas.length > 0
  );
}

/**
 * Convierte el banco de reactivos de la IA a los 4 strings que la plantilla Word
 * espera. Arma las preguntas "crudas" y delega en componerPreguntasExamen, que
 * numera, recorta y —si se da `total`— antepone el puntaje por sección con el
 * MISMO formato y las MISMAS reglas que el motor determinista.
 */
export function formatearPreguntasIA(
  datos: ExamenIA,
  puntaje?: PuntajeExamen,
): PreguntasExamen {
  const crudas: SeccionesCrudas = {
    opcionMultiple: datos.opcionMultiple.map((r) => {
      const opciones = r.opciones.slice(0, 4);
      while (opciones.length < 4) opciones.push("—"); // rellena si vinieron <4
      const letras = ["A", "B", "C", "D"];
      const lineasOpciones = opciones
        .map((op, i) => `${letras[i]}) ${op}`)
        .join("\n");
      return `${r.pregunta}\n${lineasOpciones}`;
    }),
    verdaderoFalso: datos.verdaderoFalso.map((r) => `${r.afirmacion} (V/F)`),
    relacionarColumnas: datos.relacionarColumnas.map((p) => ({
      concepto: p.concepto,
      descripcion: p.descripcion,
    })),
    preguntasAbiertas: [...datos.preguntasAbiertas],
  };

  return componerPreguntasExamen(crudas, puntaje);
}

/* ------------------------ responseSchema (Gemini) ------------------------ */

/** Espejo del esquema Zod en el formato que exige Gemini para forzar el JSON. */
export const responseSchemaExamen = {
  type: Type.OBJECT,
  properties: {
    opcionMultiple: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pregunta: { type: Type.STRING },
          opciones: { type: Type.ARRAY, items: { type: Type.STRING } },
          correcta: { type: Type.INTEGER },
        },
        required: ["pregunta", "opciones", "correcta"],
        propertyOrdering: ["pregunta", "opciones", "correcta"],
      },
    },
    verdaderoFalso: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          afirmacion: { type: Type.STRING },
          respuesta: { type: Type.BOOLEAN },
        },
        required: ["afirmacion", "respuesta"],
        propertyOrdering: ["afirmacion", "respuesta"],
      },
    },
    relacionarColumnas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          concepto: { type: Type.STRING },
          descripcion: { type: Type.STRING },
        },
        required: ["concepto", "descripcion"],
        propertyOrdering: ["concepto", "descripcion"],
      },
    },
    preguntasAbiertas: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    "opcionMultiple",
    "verdaderoFalso",
    "relacionarColumnas",
    "preguntasAbiertas",
  ],
  propertyOrdering: [
    "opcionMultiple",
    "verdaderoFalso",
    "relacionarColumnas",
    "preguntasAbiertas",
  ],
} as const;
