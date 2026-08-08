// Planeaciones almacenadas de Inglés Marítimo I (Semestre I).
// A diferencia de los niveles 4-8, que se GENERAN espejando
// .docx históricos de iDiscover, estos tres cambiaron de libro
// (StartUp, Pearson) y su contenido es fijo.
//
// No toca contenidosMaterias ni el flujo PN/MN: es un módulo aparte, consumido
// solo por el desvío de /api/planeacion-ingles para los niveles "1", "2" y "3".
//
// Fechas y etiqueta de periodo salen de app/config/calendario.ts (AGO_DIC_2026),
// la fuente única del generador F-32. Los niveles 4-8 siguen leyendo el
// PERIODO_ESCOLAR heredado de app/data/calendario.ts: unificarlos cambiaría su
// salida (ver D8 en DEUDA-TECNICA-INGLES.md).

import { calendarioDe } from "../config/calendario";

/* --------------------------------- tipos ---------------------------------- */

/** Criterio del 15% de participación/proyectos/libro, con su puntaje. */
export type CriterioParticipacion = {
  criterio: string;
  instrumento: string;
  puntos: number;
};

export type HabilidadExamen = {
  habilidad: string;
  puntos: number;
};

export type ParcialIngles = {
  nombre: string;
  total: number;
  examen: { puntos: number; habilidades: HabilidadExamen[] };
  participacionProyectosLibro: {
    puntos: number;
    desglose: CriterioParticipacion[];
  };
};

/** Esquema de evaluación de Inglés (molde de ING853, semestre8.ts). */
export type EvaluacionIngles = {
  esquema: "ingles";
  oficio: string;
  calificacionMinima: number;
  parciales: ParcialIngles[];
  ordinario: { total: number; examen: { puntos: number; habilidades: HabilidadExamen[] } };
  acreditacion: string;
};

/**
 * Una semana de la dosificación, en el MISMO formato que consume el
 * `secuencia.map(...)` de planeacionInglesF32.js → columnas Semana / Tema /
 * Secuencia didáctica / Recursos / Producto / Evaluación del F-32 (la de
 * Evaluación es común a las 18 semanas y no sale de aquí: la arma
 * `evaluacionSesion` desde el bloque `evaluacion` de nivel superior).
 * `semana` va como número: el mapper le antepone
 * "Semana ". Los otros tres flujos (avance F-51, examen, presentación) solo
 * leen `semana` y `contenido`.
 */
export type SemanaSecuencia = {
  semana: number;
  contenido: string;
  actividades: string[];
  evidencias: string;
  recursos: string[];
};

export type HorasIngles = {
  total: number;
  teoricas: number;
  practicas: number;
  independientes: number;
  porSemana: number;
  creditos: number;
};

export type PlaneacionInglesAlmacenada = {
  id: string;
  nivel: string;
  nombre: string;
  libro: string;
  programa: string;
  semestre: number;
  periodo: string;
  clave: string;
  docente: string;
  formato: string;
  escuela: string;
  horas: HorasIngles;
  /** Enfoque pedagógico. Si tanto este campo como objetivoGeneral van vacíos,
   *  la celda ESTRATEGIA del F-32 cae al respaldo de
   *  `enfoquePorDefectoDeNivel` en planeacionInglesF32.js. Ese respaldo ya
   *  deriva del nivel (para 1/2/3 dice StartUp, no iDiscover), así que dejarlo
   *  vacío ya no imprime el libro equivocado — pero sí una frase genérica en
   *  lugar del enfoque real del curso. Manténlo poblado. */
  enfoque: string;
  objetivoGeneral: string;
  objetivosEspecificos: string[];
  competencias: {
    disciplinares: string[];
    genericas: {
      instrumentales: string[];
      interpersonales: string[];
      sistemicas: string[];
    };
  };
  /** Dosificación semanal: 18 semanas, todas con contenido definitivo. */
  secuenciaSemanal: SemanaSecuencia[];
  recursos: string[];
  /** Bibliografía real del nivel. Desde el arreglo de D1, dejarla vacía ya no
   *  estampa iDiscover: `bibliografiaDeNivel` en planeacionInglesF32.js deriva
   *  el libro DEL NIVEL y para 1/2/3 devuelve las mismas referencias de StartUp
   *  que hay aquí. Aun así este es el dato bueno y el que de verdad se imprime;
   *  aquella función es solo la red de seguridad. */
  bibliografia: string[];
  evaluacion: EvaluacionIngles;
};

/* -------------------------------- comunes --------------------------------- */

const CALENDARIO = calendarioDe("ago-dic");

const PROGRAMA = "Inglés Marítimo";
const SEMESTRE = 1;
const PERIODO = "agosto-diciembre";
const CLAVE = "ING 208";
const DOCENTE = "Víctor Cadena";
const FORMATO = "FID-FOR-F-32, Ed. 3, 15/12/25";
const ESCUELA =
  'Escuela Náutica Mercante "Cap. Alt. Luis Gonzaga Priego González", Tampico, Tamaulipas';

const HORAS: HorasIngles = {
  total: 112,
  teoricas: 32,
  practicas: 80,
  independientes: 32,
  porSemana: 7,
  creditos: 9,
};

/** Enfoque comunicativo de la serie StartUp. Ver nota del campo `enfoque`. */
const ENFOQUE =
  "Enfoque comunicativo de la serie StartUp (Pearson): aprendizaje activo y " +
  "contextualizado del inglés, con integración de las cuatro habilidades " +
  "(listening, reading, writing, speaking) y práctica de gramática y " +
  "vocabulario aplicada al contexto marítimo.";

const HABILIDADES_PARCIAL: HabilidadExamen[] = [
  { habilidad: "Listening", puntos: 17 },
  { habilidad: "Reading", puntos: 17 },
  { habilidad: "Writing", puntos: 17 },
  { habilidad: "Speaking", puntos: 17 },
  { habilidad: "Grammar & Vocabulary", puntos: 17 },
];

const HABILIDADES_ORDINARIO: HabilidadExamen[] = [
  { habilidad: "Listening", puntos: 20 },
  { habilidad: "Reading", puntos: 20 },
  { habilidad: "Writing", puntos: 20 },
  { habilidad: "Speaking", puntos: 20 },
  { habilidad: "Grammar & Vocabulary", puntos: 20 },
];

// Desglose del 15%: 3 + 6 + 6. Sustituye al de ING853, que repartía el puntaje
// entre workbook y Marlin's; Marlin's no aplica a estos niveles (StartUp).
const DESGLOSE_PARTICIPACION: CriterioParticipacion[] = [
  {
    criterio: "Quiz de gramática y vocabulario",
    instrumento: "Lista de cotejo",
    puntos: 3,
  },
  {
    criterio: "Expresión escrita",
    instrumento: "Rúbrica de expresión escrita",
    puntos: 6,
  },
  {
    criterio: "Expresión oral",
    instrumento: "Rúbrica de expresión oral",
    puntos: 6,
  },
];

const parcial = (nombre: string): ParcialIngles => ({
  nombre,
  total: 100,
  examen: { puntos: 85, habilidades: HABILIDADES_PARCIAL },
  participacionProyectosLibro: {
    puntos: 15,
    desglose: DESGLOSE_PARTICIPACION,
  },
});

// Molde de ING853 (semestre8.ts, esquema "ingles") con dos cambios:
// calificacionMinima 6 → 7, y el desglose de participación reemplazado.
const EVALUACION: EvaluacionIngles = {
  esquema: "ingles",
  oficio: "DEN-526-2025 / DEN-065-2026",
  calificacionMinima: 7,
  parciales: [parcial("1er Parcial"), parcial("2do Parcial")],
  ordinario: {
    total: 100,
    examen: { puntos: 100, habilidades: HABILIDADES_ORDINARIO },
  },
  acreditacion:
    "2 parciales con examen escrito; la suma aprobatoria da derecho a ordinario; si no, extraordinario.",
};

/** Las tres referencias de StartUp del nivel. Ninguna debe matchear
 *  /no\s+especificad/i, que planeacionInglesF32.js descarta al filtrar
 *  `bibValida`.
 *
 *  Estas tres cadenas están DUPLICADAS en `refsStartUp`, dentro de
 *  planeacionInglesF32.js, que es .js a propósito y no puede importar este .ts
 *  (lo carga node directo en scripts/*.mjs). Si cambian aquí, cambian allá. */
const bibliografiaStartUp = (nivelLibro: number): string[] => [
  `Pearson Education. (2019). StartUp Level ${nivelLibro} Student Book. Pearson Education.`,
  `Pearson Education. (2019). StartUp Level ${nivelLibro} Teacher's Edition. Pearson Education.`,
  `Pearson Education. (2019). StartUp Level ${nivelLibro} Workbook. Pearson Education.`,
];

/** Indicaciones de derechos de autor de la antología (Pedagogía y Formación,
 *  3 de agosto de 2026). Va en `bibliografia` —no en `observaciones`— porque
 *  ese campo no existe y no se imprime; ver DEUDA-TECNICA-INGLES.md.
 *
 *  Como el resto de `bibliografia`, no debe matchear /no\s+especificad/i:
 *  planeacionInglesF32.js la descartaría al filtrar `bibValida`. */
const NOTA_ANTOLOGIA =
  "Antología: elaborada por el docente. Cada ejercicio, imagen o texto lleva " +
  "cita; se utiliza menos del 10% de cada obra; la primera página incluye la " +
  "leyenda institucional de uso académico (Pedagogía y Formación, 3 de " +
  "agosto de 2026).";

/** Objetivo general por nivel, redactado desde la dosificación. NO puede quedar
 *  vacío: alimenta {objetivoGeneral} del F-32 y, vía el `unidadBloques` de
 *  planeacionInglesF32.js, el {objetivoEspecifico} del primer bloque. */
const OBJETIVO_GENERAL: Record<"1" | "2" | "3", string> = {
  "1":
    "Desarrollar en el estudiante habilidades comunicativas para el dominio " +
    "del idioma inglés que le permitan solventar situaciones de su " +
    "cotidianidad y adquirir un vocabulario básico de la vida a bordo.",
  "2":
    "Consolidar en el estudiante las habilidades comunicativas del idioma " +
    "inglés en situaciones cotidianas y profesionales, ampliando el " +
    "vocabulario técnico de la vida a bordo y la descripción de personas, " +
    "rutinas y experiencias.",
  "3":
    "Ampliar en el estudiante el dominio del idioma inglés hacia la " +
    "descripción de experiencias, la expresión de opiniones y el reporte de " +
    "situaciones operativas, incorporando vocabulario técnico del entorno " +
    "marítimo portuario.",
};

const entrada = (
  nivel: "1" | "2" | "3",
  nombre: string,
  secuenciaSemanal: SemanaSecuencia[],
): PlaneacionInglesAlmacenada => ({
  id: `ingles-maritimo-n${nivel}-sem1-2026b`,
  nivel,
  nombre,
  libro: `StartUp ${nivel}`,
  programa: PROGRAMA,
  semestre: SEMESTRE,
  periodo: PERIODO,
  clave: CLAVE,
  docente: DOCENTE,
  formato: FORMATO,
  escuela: ESCUELA,
  horas: HORAS,
  enfoque: ENFOQUE,
  objetivoGeneral: OBJETIVO_GENERAL[nivel],
  objetivosEspecificos: [],
  competencias: {
    disciplinares: [],
    genericas: { instrumentales: [], interpersonales: [], sistemicas: [] },
  },
  secuenciaSemanal,
  recursos: [],
  bibliografia: [...bibliografiaStartUp(Number(nivel)), NOTA_ANTOLOGIA],
  evaluacion: EVALUACION,
});

/* ------------------------------ dosificación ------------------------------ */
//
// 18 semanas, misma estructura en los tres niveles:
//   - 1er parcial: semanas 1-10, unidades 1 a 6
//   - 2do parcial: semanas 11-16, unidades 7 a 10
//   - Semana 17: repaso general (3 días) · Semana 18: evaluación semestral
//
// Asuetos en semana de clase (5, 7, 13 y 15; la 15 pierde dos días) marcados
// como viñeta en `actividades`: el elemento de semana no tiene campo de
// observaciones y planeacionInglesF32.js está fuera de alcance.
//
// Actividades del 15% en `evidencias` (columna Producto): la columna Evaluación
// del F-32 es la misma en las 18 semanas — sale del `evaluacion` de nivel
// superior, no de la semana. Quiz sem 2 y 11, escrita sem 6 y 14, oral sem 9 y 15.

// NIVEL 1 — StartUp 1 (Pearson) · CEFR A1
const SECUENCIA_NIVEL_1: SemanaSecuencia[] = [
  {
    semana: 1,
    contenido:
      "Encuadre del curso · Unit 1: Verbo to be. Meet and greet, occupations, countries and nationalities. Maritime alphabet and numbers.",
    actividades: [
      "Inicio: encuadre — contenidos, criterios de evaluación, fechas de parciales y porcentajes. Diagnóstico oral breve.",
      "Desarrollo: presentación del verbo to be en afirmativo; artículos a/an y plurales regulares. Práctica de saludos y despedidas en parejas.",
      "Desarrollo: introducción del Alfabeto Marítimo Internacional (Alfa, Bravo, Charlie…) aplicado a deletrear nombres propios.",
      "Cierre: ronda de presentaciones personales usando to be y nacionalidad.",
    ],
    evidencias: "Ficha de datos personales completada en inglés",
    recursos: [
      "StartUp 1 Student Book, Unit 1",
      "StartUp 1 Workbook",
      "Audios SB Unit 1",
      "Tabla del Alfabeto Marítimo Internacional",
    ],
  },
  {
    semana: 2,
    contenido:
      "Unit 1 (cierre): listening y writing. · Unit 2: Adjetivos posesivos, oraciones interrogativas y negativas. Family relationships. Parts of a ship: external structural parts.",
    actividades: [
      "Inicio: repaso del alfabeto marítimo mediante dictado de nombres de buques y distintivos de llamada (call signs).",
      "Desarrollo: comprensión auditiva sobre información de embarcaciones; lectura de datos de contacto y llenado de formulario.",
      "Desarrollo: adjetivos posesivos; preguntas con who y what; negativos y yes/no questions con be.",
      "Desarrollo: vocabulario de partes externas del buque apoyado en diagrama.",
      "Cierre: quiz de gramática y vocabulario de las unidades 1 y 2.",
    ],
    evidencias: "Quiz de gramática y vocabulario (3 pts del 1er parcial)",
    recursos: [
      "StartUp 1 Student Book, Units 1-2",
      "StartUp 1 Workbook",
      "Audios SB Units 1-2",
      "Diagrama de partes del buque",
    ],
  },
  {
    semana: 3,
    contenido:
      "Unit 2 (cierre): descripción de la familia y del entorno. Pronunciación del sonido /ð/ y enlace de palabras.",
    actividades: [
      "Inicio: repaso de adjetivos posesivos con imágenes de tripulación.",
      "Desarrollo: comprensión auditiva describiendo la estructura de un buque; lectura sobre la familia.",
      "Desarrollo: práctica del sonido /ð/ y del enlace entre palabras.",
      "Cierre: redacción breve sobre la familia usando el caso posesivo.",
    ],
    evidencias: "Párrafo descriptivo sobre la familia",
    recursos: [
      "StartUp 1 Student Book, Unit 2",
      "StartUp 1 Workbook",
      "Audios SB Unit 2",
    ],
  },
  {
    semana: 4,
    contenido:
      "Unit 3: Estructura there is / there are. Places in the home and neighborhood. Places on a ship: main areas and decks.",
    actividades: [
      "Inicio: lluvia de ideas sobre espacios de la vivienda y su equivalente a bordo.",
      "Desarrollo: there is / there are en afirmativo, negativo e interrogativo; preposiciones de lugar.",
      "Desarrollo: colocación de adjetivo + sustantivo; preguntas con where + be.",
      "Desarrollo: vocabulario de cubiertas y compartimentos de una embarcación.",
      "Cierre: descripción oral en parejas de un plano de cubierta.",
    ],
    evidencias: "Descripción escrita de espacios a bordo",
    recursos: [
      "StartUp 1 Student Book, Unit 3",
      "StartUp 1 Workbook",
      "Audios SB Unit 3",
      "Plano general de cubiertas",
    ],
  },
  {
    semana: 5,
    contenido:
      "Unit 3 (cierre): anuncios inmobiliarios, mensajes telefónicos y pasatiempos de la gente de mar.",
    actividades: [
      "Asueto: 2 de septiembre — semana de cinco días.",
      "Inicio: repaso de preposiciones de lugar mediante descripción de imágenes.",
      "Desarrollo: escucha de mensajes telefónicos sobre una vivienda; lectura de un anuncio de renta.",
      "Cierre: redacción de un anuncio propio con oraciones completas.",
    ],
    evidencias: "Anuncio inmobiliario redactado en inglés",
    recursos: [
      "StartUp 1 Student Book, Unit 3",
      "StartUp 1 Workbook",
      "Audios SB Unit 3",
    ],
  },
  {
    semana: 6,
    contenido:
      "Unit 4: Preposiciones de tiempo y modo imperativo. The calendar, getting around town. Telling the time — maritime. Crew positions: roles and responsibilities.",
    actividades: [
      "Inicio: presentación del sistema horario marítimo frente al convencional.",
      "Desarrollo: preguntas con when + be y what time; preposiciones de tiempo in/on/at.",
      "Desarrollo: imperativo afirmativo y negativo aplicado a órdenes básicas a bordo.",
      "Desarrollo: puestos de la tripulación y sus responsabilidades.",
      "Cierre: redacción de una nota de coordinación para una actividad.",
    ],
    evidencias:
      "Actividad de expresión escrita: nota de coordinación de guardia (6 pts del 1er parcial)",
    recursos: [
      "StartUp 1 Student Book, Unit 4",
      "StartUp 1 Workbook",
      "Audios SB Unit 4",
      "Organigrama de tripulación",
    ],
  },
  {
    semana: 7,
    contenido:
      "Unit 4 (cierre): dar y seguir indicaciones. Pronunciación del sonido /ɚ/ y acentuación de números.",
    actividades: [
      "Asueto: 16 de septiembre — semana de cinco días.",
      "Inicio: repaso del imperativo mediante instrucciones en cadena.",
      "Desarrollo: escucha de indicaciones para llegar a un lugar; lectura de un plan de encuentro.",
      "Cierre: redacción de un plan de encuentro con puntuación final correcta.",
    ],
    evidencias: "Plan de encuentro redactado",
    recursos: [
      "StartUp 1 Student Book, Unit 4",
      "StartUp 1 Workbook",
      "Audios SB Unit 4",
    ],
  },
  {
    semana: 8,
    contenido:
      "Unit 5: Sustantivos plurales regulares e irregulares. Weather, temperature, seasons, clothing. Vocabulary related to a weather forecast in the maritime area.",
    actividades: [
      "Inicio: presentación de vocabulario meteorológico y escalas de temperatura.",
      "Desarrollo: plurales regulares e irregulares; pronunciación de la terminación plural.",
      "Desarrollo: escucha de reportes meteorológicos marítimos; lectura de mensajes sobre el clima.",
      "Cierre: recomendación oral de vestimenta y equipo de protección según condiciones.",
    ],
    evidencias: "Reporte meteorológico marítimo redactado",
    recursos: [
      "StartUp 1 Student Book, Unit 5",
      "StartUp 1 Workbook",
      "Audios SB Unit 5",
      "Ejemplos de pronóstico marítimo",
    ],
  },
  {
    semana: 9,
    contenido:
      "Unit 6: Presente simple afirmativo, negativo e interrogativo. Music, interests, free-time activities. Diseases and injuries.",
    actividades: [
      "Inicio: encuesta de intereses personales entre compañeros.",
      "Desarrollo: presente simple en sus tres formas; yes/no questions y respuestas cortas; wh- questions.",
      "Desarrollo: vocabulario de enfermedades y lesiones comunes en el entorno laboral marítimo.",
      "Cierre: presentación oral individual sobre rutinas e intereses.",
    ],
    evidencias:
      "Actividad de expresión oral: presentación de rutinas e intereses (6 pts del 1er parcial)",
    recursos: [
      "StartUp 1 Student Book, Unit 6",
      "StartUp 1 Workbook",
      "Audios SB Unit 6",
    ],
  },
  {
    semana: 10,
    contenido:
      "Repaso general de las unidades 1 a 6. Preparación para la primera evaluación parcial.",
    actividades: [
      "Inicio: diagnóstico rápido de dominio por unidad.",
      "Desarrollo: tareas integradas combinando las cinco habilidades.",
      "Desarrollo: resolución de dudas y práctica del formato de examen.",
      "Cierre: simulacro breve de las cinco secciones del examen parcial.",
    ],
    evidencias: "Guía de repaso resuelta",
    recursos: [
      "StartUp 1 Student Book, Units 1-6",
      "StartUp 1 Workbook",
      "Guía de repaso",
    ],
  },
  {
    semana: 11,
    contenido:
      "Retroalimentación del 1er parcial. · Unit 7: Sustantivos contables y no contables; can y could para peticiones. Food groups. Restaurant items, in the messroom.",
    actividades: [
      "Inicio: retroalimentación de resultados del primer parcial; los cadetes reflexionan sobre sus áreas de mejora.",
      "Desarrollo: contables y no contables; some y any; can y could para peticiones formales.",
      "Desarrollo: vocabulario de alimentos y del comedor a bordo (messroom).",
      "Cierre: quiz de gramática y vocabulario de la unidad 7.",
    ],
    evidencias: "Quiz de gramática y vocabulario (3 pts del 2do parcial)",
    recursos: [
      "StartUp 1 Student Book, Unit 7",
      "StartUp 1 Workbook",
      "Audios SB Unit 7",
    ],
  },
  {
    semana: 12,
    contenido:
      "Unit 7 (cierre): reseña de restaurante. · Unit 8: Estructuras con want / need. Personal care items. Ship's directions: port, starboard, bow, stern, amidships.",
    actividades: [
      "Inicio: role play de pedido de alimentos en el comedor a bordo.",
      "Desarrollo: escucha de marinos hablando sobre la comida; lectura y redacción de una reseña.",
      "Desarrollo: like, want, need + infinitivo; preposiciones at, on, in.",
      "Desarrollo: terminología náutica de dirección — port, starboard, bow, stern, amidships, ahead, astern.",
      "Cierre: práctica de ubicación de objetos y compartimentos usando terminología náutica.",
    ],
    evidencias: "Reseña de restaurante redactada",
    recursos: [
      "StartUp 1 Student Book, Units 7-8",
      "StartUp 1 Workbook",
      "Audios SB Units 7-8",
      "Diagrama de direcciones a bordo",
    ],
  },
  {
    semana: 13,
    contenido:
      "Unit 8 (cierre): dar y seguir indicaciones a bordo y en instalaciones. Pronunciación del sonido /ʃ/.",
    actividades: [
      "Asueto: 2 de noviembre — semana de cinco días.",
      "Inicio: repaso de terminología náutica de dirección.",
      "Desarrollo: escucha de preguntas sobre ubicaciones; lectura sobre instalaciones y toma de notas.",
      "Cierre: redacción descriptiva usando abreviaturas.",
    ],
    evidencias: "Descripción de instalaciones con indicaciones de ubicación",
    recursos: [
      "StartUp 1 Student Book, Unit 8",
      "StartUp 1 Workbook",
      "Audios SB Unit 8",
    ],
  },
  {
    semana: 14,
    contenido:
      "Unit 9: Presente continuo, adjetivos descriptivos y adverbios de frecuencia. Technology, daily activities. Types of ships based on functions.",
    actividades: [
      "Inicio: descripción de imágenes de operaciones en curso.",
      "Desarrollo: presente continuo en afirmativo e interrogativo; adverbios de frecuencia.",
      "Desarrollo: caso posesivo; this/that/these/those.",
      "Desarrollo: clasificación de tipos de buque según su función.",
      "Cierre: redacción sobre actividades en progreso a bordo.",
    ],
    evidencias:
      "Actividad de expresión escrita: reporte de operaciones en curso (6 pts del 2do parcial)",
    recursos: [
      "StartUp 1 Student Book, Unit 9",
      "StartUp 1 Workbook",
      "Audios SB Unit 9",
      "Catálogo de tipos de buque",
    ],
  },
  {
    semana: 15,
    contenido:
      "Unit 9 (cierre). · Unit 10: Pasado simple, verbos regulares e irregulares. Weekend and vacation activities. Safety equipment on board.",
    actividades: [
      "Asueto: 16 y 20 de noviembre — semana de cuatro días.",
      "Inicio: repaso del presente continuo mediante descripción de fotografías.",
      "Desarrollo: pasado simple con be; afirmativo, negativo e interrogativo; verbos irregulares.",
      "Desarrollo: pronunciación de la terminación -ed; vocabulario de equipo de seguridad a bordo.",
      "Cierre: exposición oral individual sobre una experiencia pasada.",
    ],
    evidencias:
      "Actividad de expresión oral: relato de experiencia pasada (6 pts del 2do parcial)",
    recursos: [
      "StartUp 1 Student Book, Units 9-10",
      "StartUp 1 Workbook",
      "Audios SB Units 9-10",
      "Inventario de equipo de seguridad",
    ],
  },
  {
    semana: 16,
    contenido:
      "Unit 10 (cierre): narración de experiencias. Repaso general de las unidades 7 a 10.",
    actividades: [
      "Inicio: repaso del pasado simple con verbos irregulares de uso frecuente.",
      "Desarrollo: escucha de un programa radiofónico; lectura y redacción sobre unas vacaciones.",
      "Desarrollo: tareas integradas de las unidades 7 a 10.",
      "Cierre: simulacro breve del examen del segundo parcial.",
    ],
    evidencias: "Guía de repaso de las unidades 7 a 10 resuelta",
    recursos: [
      "StartUp 1 Student Book, Units 7-10",
      "StartUp 1 Workbook",
      "Guía de repaso",
    ],
  },
  {
    semana: 17,
    contenido:
      "Repaso general de las unidades 1 a 10. Preparación para la evaluación semestral.",
    actividades: [
      "Semana de tres días (7 al 9 de diciembre).",
      "Inicio: repaso integrado de estructuras gramaticales del semestre.",
      "Desarrollo: práctica de las cinco habilidades en formato de evaluación semestral.",
      "Cierre: resolución de dudas finales.",
    ],
    evidencias: "Guía de repaso semestral resuelta",
    recursos: [
      "StartUp 1 Student Book, Units 1-10",
      "Guía de repaso semestral",
    ],
  },
  {
    semana: 18,
    contenido:
      "Evaluación semestral. Listening, Reading, Writing, Speaking y Grammar & Vocabulary, 20 puntos cada habilidad.",
    actividades: [
      "Aplicación de la evaluación semestral en sus cinco secciones.",
      "Registro de resultados y entrega de retroalimentación.",
    ],
    evidencias: "Examen semestral aplicado",
    recursos: ["Examen semestral institucional"],
  },
];

// NIVEL 2 — StartUp 2 (Pearson) · CEFR A2
const SECUENCIA_NIVEL_2: SemanaSecuencia[] = [
  {
    semana: 1,
    contenido:
      "Encuadre del curso · Unit 1 — What do you do? Jobs, commuting, work activities. Ranks and departments on board: deck, engine and catering. Joining a vessel.",
    actividades: [
      "Inicio: encuadre — contenidos, criterios de evaluación, fechas de parciales y porcentajes.",
      "Desarrollo: repaso del presente simple de be y del presente simple; yes/no y wh- questions.",
      "Desarrollo: vocabulario de oficios aplicado a rangos y departamentos a bordo (cubierta, máquinas, fonda).",
      "Cierre: conversación en parejas sobre funciones y responsabilidades a bordo.",
    ],
    evidencias: "Cuadro de rangos y departamentos completado en inglés",
    recursos: [
      "StartUp 2 Student Book, Unit 1",
      "StartUp 2 Workbook",
      "Audios SB Unit 1",
      "Organigrama de tripulación",
    ],
  },
  {
    semana: 2,
    contenido:
      "Unit 1 (cierre): résumé. · Unit 2 — Who's that? Family relationships, personality, appearance, skills. Crew competencies and STCW certificates.",
    actividades: [
      "Inicio: repaso del presente simple mediante descripción de rutinas laborales.",
      "Desarrollo: lectura sobre desplazamientos largos al trabajo; redacción de un currículum breve.",
      "Desarrollo: preguntas con who y what; be frente a have para descripción; can para habilidad.",
      "Desarrollo: competencias de la tripulación y certificados STCW.",
      "Cierre: quiz de gramática y vocabulario de las unidades 1 y 2.",
    ],
    evidencias: "Quiz de gramática y vocabulario (3 pts del 1er parcial)",
    recursos: [
      "StartUp 2 Student Book, Units 1-2",
      "StartUp 2 Workbook",
      "Audios SB Units 1-2",
      "Listado de certificados STCW",
    ],
  },
  {
    semana: 3,
    contenido:
      "Unit 2 (cierre): descripción de personas y llenado de solicitud. Pronunciación de /ʌ/ y de can/can't.",
    actividades: [
      "Inicio: descripción oral de un compañero de tripulación.",
      "Desarrollo: escucha de un podcast sobre un programa de televisión; lectura sobre una empresa familiar.",
      "Desarrollo: práctica de la pronunciación de can y can't en oraciones.",
      "Cierre: llenado de una solicitud con autodescripción y puntuación correcta.",
    ],
    evidencias: "Solicitud de embarque con autodescripción",
    recursos: [
      "StartUp 2 Student Book, Unit 2",
      "StartUp 2 Workbook",
      "Audios SB Unit 2",
    ],
  },
  {
    semana: 4,
    contenido:
      "Unit 3 — What are you doing today? Household chores, types of movies, free-time activities. Daily duties on board. Watchkeeping routine. Recreation at sea.",
    actividades: [
      "Inicio: contraste entre tareas domésticas y tareas diarias a bordo.",
      "Desarrollo: repaso del presente continuo para eventos en curso; verbos + infinitivo y gerundio.",
      "Desarrollo: rutina de guardia (watchkeeping) y actividades recreativas a bordo.",
      "Cierre: lectura sobre un problema con la tecnología y redacción sobre formas de descansar.",
    ],
    evidencias: "Descripción escrita de la rutina de guardia",
    recursos: [
      "StartUp 2 Student Book, Unit 3",
      "StartUp 2 Workbook",
      "Audios SB Unit 3",
    ],
  },
  {
    semana: 5,
    contenido:
      "Unit 3 (cierre). · Unit 4 — Whose phone is this? Personal possessions, technology adjectives. Personal protective equipment (PPE). Comparing vessel types.",
    actividades: [
      "Asueto: 2 de septiembre — semana de cinco días.",
      "Inicio: repaso del presente continuo aplicado a operaciones en curso.",
      "Desarrollo: preguntas con whose; posesivos; adjetivos comparativos regulares e irregulares.",
      "Desarrollo: equipo de protección personal (PPE) y comparación de tipos de buque por tamaño y función.",
      "Cierre: comparación oral de dos embarcaciones.",
    ],
    evidencias: "Cuadro comparativo de tipos de buque",
    recursos: [
      "StartUp 2 Student Book, Units 3-4",
      "StartUp 2 Workbook",
      "Audios SB Units 3-4",
      "Catálogo de PPE",
    ],
  },
  {
    semana: 6,
    contenido:
      "Unit 4 (cierre): objetos perdidos y anuncios de producto. Acentuación en sustantivos compuestos y en comparativos.",
    actividades: [
      "Inicio: repaso de comparativos mediante descripción de equipo.",
      "Desarrollo: lectura sobre un objeto perdido y orden cronológico del relato.",
      "Desarrollo: práctica de acentuación en sustantivos compuestos.",
      "Cierre: redacción de un anuncio de producto con detalles.",
    ],
    evidencias:
      "Actividad de expresión escrita: anuncio de producto con especificaciones (6 pts del 1er parcial)",
    recursos: [
      "StartUp 2 Student Book, Unit 4",
      "StartUp 2 Workbook",
      "Audios SB Unit 4",
    ],
  },
  {
    semana: 7,
    contenido:
      "Unit 5 — Any plans for the weekend? Time expressions, offers, problems with plans. Voyage plan and port call schedule. Delays and weather routing.",
    actividades: [
      "Asueto: 16 de septiembre — semana de cinco días.",
      "Inicio: presentación del plan de viaje y del itinerario de escalas.",
      "Desarrollo: presente continuo con valor de futuro; pronombres objeto; will para intención.",
      "Desarrollo: retrasos y derrota meteorológica (weather routing).",
      "Cierre: escucha de mensajes telefónicos sobre problemas con planes.",
    ],
    evidencias: "Itinerario de escalas redactado en inglés",
    recursos: [
      "StartUp 2 Student Book, Unit 5",
      "StartUp 2 Workbook",
      "Audios SB Unit 5",
      "Ejemplo de voyage plan",
    ],
  },
  {
    semana: 8,
    contenido:
      "Unit 5 (cierre): cuestionario de personalidad y correo para hacer planes. Uso de or para describir opciones.",
    actividades: [
      "Inicio: repaso del futuro con be going to y will.",
      "Desarrollo: resolución de un cuestionario de personalidad.",
      "Cierre: redacción de un correo para coordinar una actividad, usando or para presentar opciones.",
    ],
    evidencias: "Correo de coordinación redactado",
    recursos: [
      "StartUp 2 Student Book, Unit 5",
      "StartUp 2 Workbook",
      "Audios SB Unit 5",
    ],
  },
  {
    semana: 9,
    contenido:
      "Unit 6 — Are you OK? Daily routines, parts of the body, illnesses, remedies. Watch routine. Common shipboard injuries. Elementary first aid on board.",
    actividades: [
      "Inicio: repaso de rutinas diarias aplicado al régimen de guardias.",
      "Desarrollo: adverbios de frecuencia; should para consejo y sugerencia.",
      "Desarrollo: lesiones frecuentes a bordo y primeros auxilios elementales.",
      "Cierre: dramatización oral de una situación de atención a un lesionado.",
    ],
    evidencias:
      "Actividad de expresión oral: reporte de lesión y primeros auxilios (6 pts del 1er parcial)",
    recursos: [
      "StartUp 2 Student Book, Unit 6",
      "StartUp 2 Workbook",
      "Audios SB Unit 6",
      "Guía de primeros auxilios a bordo",
    ],
  },
  {
    semana: 10,
    contenido:
      "Repaso general de las unidades 1 a 6. Preparación para la primera evaluación parcial.",
    actividades: [
      "Inicio: diagnóstico rápido de dominio por unidad.",
      "Desarrollo: tareas integradas combinando las cinco habilidades.",
      "Desarrollo: resolución de dudas y práctica del formato de examen.",
      "Cierre: simulacro breve de las cinco secciones del examen parcial.",
    ],
    evidencias: "Guía de repaso resuelta",
    recursos: [
      "StartUp 2 Student Book, Units 1-6",
      "StartUp 2 Workbook",
      "Guía de repaso",
    ],
  },
  {
    semana: 11,
    contenido:
      "Retroalimentación del 1er parcial. · Unit 7 — How do I get there? Tourist attractions, public transportation, directions. VHF radio call and standard phrases.",
    actividades: [
      "Inicio: retroalimentación de resultados del primer parcial.",
      "Desarrollo: repaso de there is / there are; preposiciones de movimiento.",
      "Desarrollo: llamada por radio VHF y frases normalizadas de comunicación.",
      "Cierre: quiz de gramática y vocabulario de la unidad 7.",
    ],
    evidencias: "Quiz de gramática y vocabulario (3 pts del 2do parcial)",
    recursos: [
      "StartUp 2 Student Book, Unit 7",
      "StartUp 2 Workbook",
      "Audios SB Unit 7",
      "Frases normalizadas VHF",
    ],
  },
  {
    semana: 12,
    contenido:
      "Unit 7 (cierre). · Unit 8 — How was your vacation? Weather, travel experience, hotel activities. Shore leave. Weather reports at sea. Describing a port of call.",
    actividades: [
      "Inicio: práctica de indicaciones a bordo y en puerto.",
      "Desarrollo: lectura de un relato sobre extraviarse; redacción de indicaciones con conectores de orden.",
      "Desarrollo: repaso del pasado simple con be y con verbos regulares e irregulares.",
      "Desarrollo: permisos en tierra (shore leave) y descripción de un puerto de escala.",
      "Cierre: relato oral breve de una escala.",
    ],
    evidencias: "Descripción escrita de un puerto de escala",
    recursos: [
      "StartUp 2 Student Book, Units 7-8",
      "StartUp 2 Workbook",
      "Audios SB Units 7-8",
    ],
  },
  {
    semana: 13,
    contenido:
      "Unit 8 (cierre): reseña de hotel. Conectores so y that's why. Pronunciación de was/wasn't y were/weren't.",
    actividades: [
      "Asueto: 2 de noviembre — semana de cinco días.",
      "Inicio: repaso del pasado simple mediante narración de una escala.",
      "Desarrollo: lectura sobre un oficio poco común; identificación de detalles.",
      "Cierre: redacción de una reseña usando so y that's why.",
    ],
    evidencias: "Reseña redactada con conectores de causa",
    recursos: [
      "StartUp 2 Student Book, Unit 8",
      "StartUp 2 Workbook",
      "Audios SB Unit 8",
    ],
  },
  {
    semana: 14,
    contenido:
      "Unit 9 — What's for dinner? Common foods, measurements, cooking verbs, menu items. Galley and messroom. Provisioning and stores. Dietary requirements on board.",
    actividades: [
      "Inicio: vocabulario de cocina y comedor a bordo (galley, messroom).",
      "Desarrollo: preguntas con how much y how many; some/any; would like para peticiones corteses.",
      "Desarrollo: aprovisionamiento, pañoles y requerimientos dietéticos de la tripulación.",
      "Cierre: redacción de una reseña o de una solicitud de aprovisionamiento.",
    ],
    evidencias:
      "Actividad de expresión escrita: solicitud de aprovisionamiento (6 pts del 2do parcial)",
    recursos: [
      "StartUp 2 Student Book, Unit 9",
      "StartUp 2 Workbook",
      "Audios SB Unit 9",
      "Formato de requisición de víveres",
    ],
  },
  {
    semana: 15,
    contenido:
      "Unit 10 — Where are you going? Milestones, past and future time markers. Sea service record. Career path at sea. Signing on for the next contract.",
    actividades: [
      "Asueto: 16 y 20 de noviembre — semana de cuatro días.",
      "Desarrollo: pasado simple en yes/no y wh- questions; planes futuros con be going to.",
      "Desarrollo: libreta de mar (sea service record) y trayectoria profesional a bordo.",
      "Cierre: exposición oral individual sobre metas profesionales y próximo contrato.",
    ],
    evidencias:
      "Actividad de expresión oral: exposición de trayectoria y metas profesionales (6 pts del 2do parcial)",
    recursos: [
      "StartUp 2 Student Book, Unit 10",
      "StartUp 2 Workbook",
      "Audios SB Unit 10",
      "Ejemplo de libreta de mar",
    ],
  },
  {
    semana: 16,
    contenido:
      "Unit 10 (cierre): carta de presentación. Repaso general de las unidades 7 a 10.",
    actividades: [
      "Inicio: repaso de marcadores temporales de pasado y futuro.",
      "Desarrollo: lectura de recomendaciones para buscar empleo; redacción de una carta de presentación.",
      "Desarrollo: tareas integradas de las unidades 7 a 10.",
      "Cierre: simulacro breve del examen del segundo parcial.",
    ],
    evidencias: "Carta de presentación para embarque",
    recursos: [
      "StartUp 2 Student Book, Units 7-10",
      "StartUp 2 Workbook",
      "Guía de repaso",
    ],
  },
  {
    semana: 17,
    contenido:
      "Repaso general de las unidades 1 a 10. Preparación para la evaluación semestral.",
    actividades: [
      "Semana de tres días (7 al 9 de diciembre).",
      "Inicio: repaso integrado de estructuras gramaticales del semestre.",
      "Desarrollo: práctica de las cinco habilidades en formato de evaluación semestral.",
      "Cierre: resolución de dudas finales.",
    ],
    evidencias: "Guía de repaso semestral resuelta",
    recursos: [
      "StartUp 2 Student Book, Units 1-10",
      "Guía de repaso semestral",
    ],
  },
  {
    semana: 18,
    contenido:
      "Evaluación semestral. Listening, Reading, Writing, Speaking y Grammar & Vocabulary, 20 puntos cada habilidad.",
    actividades: [
      "Aplicación de la evaluación semestral en sus cinco secciones.",
      "Registro de resultados y entrega de retroalimentación.",
    ],
    evidencias: "Examen semestral aplicado",
    recursos: ["Examen semestral institucional"],
  },
];

// NIVEL 3 — StartUp 3 (Pearson) · CEFR A2+
// Semanas 14 y 15 (units 9 y 10) tomadas del Teacher's Edition de StartUp 3;
// injerto marítimo aprobado por el docente titular.
const SECUENCIA_NIVEL_3: SemanaSecuencia[] = [
  {
    semana: 1,
    contenido:
      "Encuadre del curso · Unit 1 — What's going on with you? Activities, life events. Reporting current operations on board. Chronology of an incident.",
    actividades: [
      "Inicio: encuadre — contenidos, criterios de evaluación, fechas de parciales y porcentajes.",
      "Desarrollo: presente continuo para situaciones temporales; pasado simple con when, before y after.",
      "Desarrollo: sugerencias con Let's y Why don't.",
      "Desarrollo: reporte de operaciones en curso a bordo y cronología de un incidente.",
      "Cierre: redacción de un correo para coordinar una actividad, con conectores temporales.",
    ],
    evidencias: "Reporte de operaciones en curso redactado",
    recursos: [
      "StartUp 3 Student Book, Unit 1",
      "StartUp 3 Workbook",
      "Audios SB Unit 1",
    ],
  },
  {
    semana: 2,
    contenido:
      "Unit 1 (cierre). · Unit 2 — What do you think? Sensory verbs, attitudes, adverbs of manner. Describing equipment condition. Reporting how a manoeuvre was performed.",
    actividades: [
      "Inicio: repaso de la cronología de eventos con conectores temporales.",
      "Desarrollo: verbos sensoriales + like; be + adjetivo + infinitivo; adverbios de grado y de modo.",
      "Desarrollo: descripción del estado de los equipos y reporte de cómo se ejecutó una maniobra.",
      "Cierre: quiz de gramática y vocabulario de las unidades 1 y 2.",
    ],
    evidencias: "Quiz de gramática y vocabulario (3 pts del 1er parcial)",
    recursos: [
      "StartUp 3 Student Book, Units 1-2",
      "StartUp 3 Workbook",
      "Audios SB Units 1-2",
    ],
  },
  {
    semana: 3,
    contenido:
      "Unit 2 (cierre): recomendaciones y escritura formal. Pronunciación de la letra s; sílabas y acentuación.",
    actividades: [
      "Inicio: escucha de un podcast sobre retroalimentación.",
      "Desarrollo: lectura sobre consejos que cambian la vida; identificación de la idea principal.",
      "Cierre: redacción de una recomendación con oraciones completas en registro formal.",
    ],
    evidencias: "Recomendación redactada en registro formal",
    recursos: [
      "StartUp 3 Student Book, Unit 2",
      "StartUp 3 Workbook",
      "Audios SB Unit 2",
    ],
  },
  {
    semana: 4,
    contenido:
      "Unit 3 — How was your weekend? Participial adjectives, past participles, feelings. Sea service experience. Describing hazardous conditions encountered.",
    actividades: [
      "Inicio: expresión de estados de ánimo mediante adjetivos participiales.",
      "Desarrollo: presente perfecto para experiencias pasadas; habilidad e inhabilidad en pasado.",
      "Desarrollo: experiencia de embarque previa y descripción de condiciones peligrosas.",
      "Cierre: redacción descriptiva de un viaje o travesía.",
    ],
    evidencias: "Descripción de experiencia de embarque",
    recursos: [
      "StartUp 3 Student Book, Unit 3",
      "StartUp 3 Workbook",
      "Audios SB Unit 3",
    ],
  },
  {
    semana: 5,
    contenido:
      "Unit 3 (cierre). · Unit 4 — Would you like something to eat? Lunch foods, partitives. Cargo quantities. Bunkering. Stores and provisions on board.",
    actividades: [
      "Asueto: 2 de septiembre — semana de cinco días.",
      "Inicio: repaso del presente perfecto aplicado a experiencia de mar.",
      "Desarrollo: contables y no contables con some, any y no; much/many/a lot of; enough y too much/too many.",
      "Desarrollo: cantidades de carga, toma de combustible (bunkering) y pañoles.",
      "Cierre: cálculo y expresión oral de cantidades de aprovisionamiento.",
    ],
    evidencias: "Reporte de cantidades de carga y aprovisionamiento",
    recursos: [
      "StartUp 3 Student Book, Units 3-4",
      "StartUp 3 Workbook",
      "Audios SB Units 3-4",
    ],
  },
  {
    semana: 6,
    contenido:
      "Unit 4 (cierre): identificación de detalles de apoyo y variedad sintáctica. Sílabas elididas y frases con of.",
    actividades: [
      "Inicio: repaso de expresiones de cantidad.",
      "Desarrollo: lectura sobre la ciencia de los postres; identificación de detalles de apoyo.",
      "Cierre: redacción sobre una comida festiva con variedad en la estructura de las oraciones.",
    ],
    evidencias:
      "Actividad de expresión escrita: texto descriptivo con variedad sintáctica (6 pts del 1er parcial)",
    recursos: [
      "StartUp 3 Student Book, Unit 4",
      "StartUp 3 Workbook",
      "Audios SB Unit 4",
    ],
  },
  {
    semana: 7,
    contenido:
      "Unit 5 — When can we meet? Technology at work, tech issues, meeting preparation. Safety recommendations and risk assessment. Obligations under SOLAS and MARPOL.",
    actividades: [
      "Asueto: 16 de septiembre — semana de cinco días.",
      "Inicio: identificación de problemas técnicos y sus soluciones.",
      "Desarrollo: could y should para sugerencias; will, may y might para probabilidad; have to y need to para obligación.",
      "Desarrollo: recomendaciones de seguridad, evaluación de riesgos y obligaciones bajo SOLAS y MARPOL.",
      "Cierre: escucha de mensajes con instrucciones técnicas.",
    ],
    evidencias: "Lista de recomendaciones de seguridad redactada",
    recursos: [
      "StartUp 3 Student Book, Unit 5",
      "StartUp 3 Workbook",
      "Audios SB Unit 5",
      "Extractos de SOLAS y MARPOL",
    ],
  },
  {
    semana: 8,
    contenido:
      "Unit 5 (cierre): estructura problema-solución y uso de matizadores. Grupos consonánticos y pronunciación débil de to.",
    actividades: [
      "Inicio: repaso de modales de obligación y probabilidad.",
      "Desarrollo: lectura sobre impresión 3D; identificación de la estructura problema-solución.",
      "Cierre: redacción de recomendaciones para administrar el tiempo, usando matizadores.",
    ],
    evidencias: "Texto de recomendaciones con estructura problema-solución",
    recursos: [
      "StartUp 3 Student Book, Unit 5",
      "StartUp 3 Workbook",
      "Audios SB Unit 5",
    ],
  },
  {
    semana: 9,
    contenido:
      "Unit 6 — How's your lunch? Adjectives to describe food, gift items, storytelling. Near-miss reporting. Describing what was happening at the time of an event.",
    actividades: [
      "Inicio: narración breve de un suceso inesperado.",
      "Desarrollo: too y enough + adjetivo; verbos con dos objetos; pasado continuo y pasado continuo con when.",
      "Desarrollo: reporte de cuasi-accidentes (near-miss) y descripción de lo que ocurría en el momento del evento.",
      "Cierre: exposición oral de un reporte de cuasi-accidente.",
    ],
    evidencias:
      "Actividad de expresión oral: reporte oral de cuasi-accidente (6 pts del 1er parcial)",
    recursos: [
      "StartUp 3 Student Book, Unit 6",
      "StartUp 3 Workbook",
      "Audios SB Unit 6",
      "Formato de near-miss report",
    ],
  },
  {
    semana: 10,
    contenido:
      "Repaso general de las unidades 1 a 6. Preparación para la primera evaluación parcial.",
    actividades: [
      "Inicio: diagnóstico rápido de dominio por unidad.",
      "Desarrollo: tareas integradas combinando las cinco habilidades.",
      "Desarrollo: resolución de dudas y práctica del formato de examen.",
      "Cierre: simulacro breve de las cinco secciones del examen parcial.",
    ],
    evidencias: "Guía de repaso resuelta",
    recursos: [
      "StartUp 3 Student Book, Units 1-6",
      "StartUp 3 Workbook",
      "Guía de repaso",
    ],
  },
  {
    semana: 11,
    contenido:
      "Retroalimentación del 1er parcial. · Unit 7 — Where are you going? Verbs and adjectives + prepositions, geographical features. Passage planning. Describing coastlines and navigational hazards.",
    actividades: [
      "Inicio: retroalimentación de resultados del primer parcial.",
      "Desarrollo: gerundios como objeto de preposición; would like/love/hate + infinitivo; adjetivos superlativos.",
      "Desarrollo: planeación de la derrota (passage planning); descripción de costas y peligros a la navegación.",
      "Cierre: quiz de gramática y vocabulario de la unidad 7.",
    ],
    evidencias: "Quiz de gramática y vocabulario (3 pts del 2do parcial)",
    recursos: [
      "StartUp 3 Student Book, Unit 7",
      "StartUp 3 Workbook",
      "Audios SB Unit 7",
      "Cartas náuticas de referencia",
    ],
  },
  {
    semana: 12,
    contenido:
      "Unit 7 (cierre). · Unit 8 — What are you doing tonight? Instruments and musicians, evening events, healthy habits. Root cause analysis. Accident investigation: cause and effect.",
    actividades: [
      "Inicio: escucha de un programa de preguntas sobre geografía.",
      "Desarrollo: preguntas sobre el sujeto y sobre el objeto; so y because (of) para causa y efecto.",
      "Desarrollo: análisis de causa raíz e investigación de accidentes.",
      "Cierre: análisis oral de causa y efecto sobre un caso.",
    ],
    evidencias: "Análisis de causa raíz de un incidente",
    recursos: [
      "StartUp 3 Student Book, Units 7-8",
      "StartUp 3 Workbook",
      "Audios SB Units 7-8",
    ],
  },
  {
    semana: 13,
    contenido:
      "Unit 8 (cierre): expresiones de tiempo y hábitos saludables.",
    actividades: [
      "Asueto: 2 de noviembre — semana de cinco días.",
      "Inicio: repaso de preguntas sobre sujeto y objeto.",
      "Desarrollo: expresiones de tiempo; descripción de hábitos.",
      "Cierre: redacción sobre hábitos saludables a bordo.",
    ],
    evidencias: "Texto descriptivo sobre hábitos a bordo",
    recursos: [
      "StartUp 3 Student Book, Unit 8",
      "StartUp 3 Workbook",
      "Audios SB Unit 8",
    ],
  },
  {
    semana: 14,
    contenido:
      "Unit 9 — Where do you want to meet? Living room furniture and decor, reasons for being late, places in and around the house. Coordinating port operations. Reporting delays. Accommodation areas on board.",
    actividades: [
      "Inicio: repaso de las formas de futuro aplicadas a la planeación de operaciones.",
      "Desarrollo: futuro con will, be going to, presente continuo y presente simple; preguntas indirectas.",
      "Desarrollo: adverbios y frases adverbiales de lugar; vocabulario de espacios y mobiliario.",
      "Desarrollo: coordinación de operaciones en puerto, reporte de retrasos y sus causas, áreas de alojamiento a bordo.",
      "Cierre: redacción descriptiva aplicando estructura paralela.",
    ],
    evidencias:
      "Actividad de expresión escrita: reporte de coordinación y retrasos en puerto (6 pts del 2do parcial)",
    recursos: [
      "StartUp 3 Student Book, Unit 9",
      "StartUp 3 Workbook",
      "Audios SB Unit 9",
      "Plano de áreas de alojamiento",
    ],
  },
  {
    semana: 15,
    contenido:
      "Unit 10 — How long did you work there? Job interviews, work experience, soft skills. Crewing agency interview. Sea service record. Cover letter for embarkation.",
    actividades: [
      "Asueto: 16 y 20 de noviembre — semana de cuatro días.",
      "Desarrollo: tag questions; presente perfecto con for y since, how long y ever; preguntas informativas con presente perfecto.",
      "Desarrollo: entrevista en agencia de tripulaciones y descripción de la experiencia embarcada.",
      "Desarrollo: lectura de recomendaciones para entrevista; redacción de carta de presentación.",
      "Cierre: dramatización oral de una entrevista de embarque.",
    ],
    evidencias:
      "Actividad de expresión oral: simulacro de entrevista de embarque (6 pts del 2do parcial)",
    recursos: [
      "StartUp 3 Student Book, Unit 10",
      "StartUp 3 Workbook",
      "Audios SB Unit 10",
      "Modelo de libreta de mar y carta de presentación",
    ],
  },
  {
    semana: 16,
    contenido:
      "Repaso general de las unidades 7 a 10. Preparación para la segunda evaluación parcial.",
    actividades: [
      "Inicio: repaso de las estructuras del segundo parcial.",
      "Desarrollo: tareas integradas de las unidades 7 a 10.",
      "Cierre: simulacro breve del examen del segundo parcial.",
    ],
    evidencias: "Guía de repaso de las unidades 7 a 10 resuelta",
    recursos: [
      "StartUp 3 Student Book, Units 7-10",
      "StartUp 3 Workbook",
      "Guía de repaso",
    ],
  },
  {
    semana: 17,
    contenido:
      "Repaso general de las unidades 1 a 10. Preparación para la evaluación semestral.",
    actividades: [
      "Semana de tres días (7 al 9 de diciembre).",
      "Inicio: repaso integrado de estructuras gramaticales del semestre.",
      "Desarrollo: práctica de las cinco habilidades en formato de evaluación semestral.",
      "Cierre: resolución de dudas finales.",
    ],
    evidencias: "Guía de repaso semestral resuelta",
    recursos: [
      "StartUp 3 Student Book, Units 1-10",
      "Guía de repaso semestral",
    ],
  },
  {
    semana: 18,
    contenido:
      "Evaluación semestral. Listening, Reading, Writing, Speaking y Grammar & Vocabulary, 20 puntos cada habilidad.",
    actividades: [
      "Aplicación de la evaluación semestral en sus cinco secciones.",
      "Registro de resultados y entrega de retroalimentación.",
    ],
    evidencias: "Examen semestral aplicado",
    recursos: ["Examen semestral institucional"],
  },
];

/* -------------------------------- entradas -------------------------------- */

export const PLANEACIONES_INGLES_ALMACENADAS: Record<
  string,
  PlaneacionInglesAlmacenada
> = {
  "1": entrada("1", "Inglés Marítimo I — Nivel 1", SECUENCIA_NIVEL_1),
  "2": entrada("2", "Inglés Marítimo I — Nivel 2", SECUENCIA_NIVEL_2),
  "3": entrada("3", "Inglés Marítimo I — Nivel 3", SECUENCIA_NIVEL_3),
};

/** Niveles servidos desde contenido almacenado (no se generan con IA). */
export const NIVELES_ALMACENADOS = Object.keys(
  PLANEACIONES_INGLES_ALMACENADAS,
);

/** ¿El nivel se sirve desde contenido almacenado? `nivel` llega como string
 *  desde el endpoint (route.ts:323 lo fuerza con .toString()). */
export function tienePlaneacionAlmacenada(nivel: string): boolean {
  return Object.prototype.hasOwnProperty.call(
    PLANEACIONES_INGLES_ALMACENADAS,
    String(nivel).trim(),
  );
}

/**
 * Traduce una entrada almacenada al MISMO objeto `planeacion` que devuelve el
 * camino generado (13 claves), para que el cliente y construirDatosF32DesdeIngles
 * no distingan el origen. Los instrumentos de evaluación se derivan del molde;
 * no se inventa ninguno.
 */
export function planeacionDesdeAlmacenada(
  nivel: string,
  datos: { grupo?: string; tema?: string; observaciones?: string } = {},
) {
  const e = PLANEACIONES_INGLES_ALMACENADAS[String(nivel).trim()];
  if (!e) return null;

  const evaluacion = [
    ...e.evaluacion.parciales.map((p) => ({
      instrumento: `Examen escrito — ${p.nombre}`,
      ponderacion: `${p.examen.puntos} / ${p.total} pts`,
      descripcion: p.examen.habilidades
        .map((h) => `${h.habilidad} (${h.puntos} pts)`)
        .join(", "),
    })),
    ...e.evaluacion.parciales[0].participacionProyectosLibro.desglose.map(
      (d) => ({
        instrumento: d.instrumento,
        ponderacion: `${d.puntos} pts`,
        descripcion: d.criterio,
      }),
    ),
  ];

  return {
    asignatura: e.nombre,
    nivel: e.nivel,
    grupo: (datos.grupo ?? "").toString().trim(),
    tema: (datos.tema ?? "").toString().trim(),
    enfoque: e.enfoque,
    horas: e.horas,
    objetivoGeneral: e.objetivoGeneral,
    objetivosEspecificos: e.objetivosEspecificos,
    competencias: e.competencias,
    secuenciaSemanal: e.secuenciaSemanal,
    evaluacion,
    recursos: e.recursos,
    bibliografia: e.bibliografia,
    observaciones: (datos.observaciones ?? "").toString().trim(),
  };
}

/**
 * Metadatos de portada del F-32 para un nivel almacenado. Se pasan como `meta`
 * a construirDatosF32DesdeIngles, cuyo segundo parámetro ya es opcional.
 *
 * Solo campos institucionales que hoy salen VACÍOS en el F-32 de Inglés. No
 * incluye `nivel`, que lo captura el usuario en el formulario.
 *
 * Las horas oficiales SÍ van aquí, pero el llamador las coloca ANTES de lo que
 * teclee el docente (ver SeccionIngles.tsx): si captura un valor, ese manda.
 */
export function metaF32DesdeAlmacenada(nivel: string) {
  const e = PLANEACIONES_INGLES_ALMACENADAS[String(nivel).trim()];
  if (!e) return null;
  return {
    clave: e.clave,
    docente: e.docente,
    periodo: CALENDARIO.etiqueta,
    fechaParcial1: CALENDARIO.fechaParcial1,
    fechaParcial2: CALENDARIO.fechaParcial2,
    escuelaNautica: e.escuela,
    horas: e.horas,
  };
}
