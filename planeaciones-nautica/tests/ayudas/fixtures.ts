// Fixtures de las pruebas. NO son datos reales de ningún docente ni de ningún
// grupo: sirven para ejercitar los constructores de datos de los documentos.

/** Forma del JSON que /api/planeacion-ingles devuelve para los niveles 4-8
 *  (GENERADOS espejando las históricas de iDiscover). Las 13 claves del contrato
 *  del SYSTEM_PROMPT. Sin `horas`: el camino generado nunca las trae. */
export function planeacionGeneradaFalsa(nivel: string, semanas = 18) {
  return {
    asignatura: `Inglés Nivel ${nivel}`,
    nivel,
    grupo: "IV A PN",
    tema: "",
    enfoque: "Enfoque comunicativo iDiscover.",
    objetivoGeneral: `Objetivo general del nivel ${nivel}.`,
    objetivosEspecificos: [`Objetivo específico 1 del nivel ${nivel}.`],
    competencias: {
      disciplinares: ["Comunicarse en inglés en contextos marítimos."],
      genericas: {
        instrumentales: ["Comprensión lectora."],
        interpersonales: ["Trabajo colaborativo."],
        sistemicas: ["Autoaprendizaje."],
      },
    },
    secuenciaSemanal: Array.from({ length: semanas }, (_, i) => ({
      semana: i + 1,
      contenido: `Unidad ${i + 1} — contenido del nivel ${nivel}.`,
      actividades: [`Actividad A de la semana ${i + 1}`, "Actividad B"],
      evidencias: `Evidencia de la semana ${i + 1}`,
      recursos: ["Libro de texto", "Audio"],
    })),
    evaluacion: [
      {
        instrumento: "Examen escrito",
        ponderacion: "60%",
        descripcion: "Parcial",
      },
    ],
    recursos: ["Pizarrón", "Proyector"],
    bibliografia: [
      `I Discover ${nivel} Student book & Workbook (2013), Evans, Dooley. Express Publishing.`,
    ],
    observaciones: "",
  };
}

/** Metadatos de portada que teclea el docente en el formulario. */
export const META_FORMULARIO = {
  grupo: "IV A PN",
  docente: "Docente de prueba",
  cadetes: "28",
  semanas: 18,
  horasPorSemana: 4,
  periodo: "Julio-Diciembre 2026",
};
