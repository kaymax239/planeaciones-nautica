// Rúbricas de evaluación para los exámenes de Inglés de Speaking y Writing.
// Se anexan al final de la sección de preguntas abiertas (prompts orales /
// tareas de redacción) del Word. Texto fijo: no depende de la IA ni del caché.
//
// Cada tarea se califica con la rúbrica: puntos de la tarea × % del criterio.
// Cuatro criterios de 25 % cada uno y cuatro niveles de desempeño.

import type { HabilidadIngles } from "./puntajeExamen";

const RUBRICA_SPEAKING = `SPEAKING RUBRIC — apply to each speaking prompt (task points × criterion %). Four criteria, 25 % each.
Levels: 4 = Excellent (100 %) · 3 = Good (75 %) · 2 = Developing (50 %) · 1 = Limited (25 %) · 0 = No response.

1. Fluency & interaction (25 %)
   4 Speaks with ease, natural pauses, responds and keeps the exchange going.
   3 Some hesitation; responds appropriately with minor prompting.
   2 Frequent pauses; short answers; needs support to continue.
   1 Isolated words or memorized phrases; communication breaks down.

2. Pronunciation & intelligibility (25 %)
   4 Clear and easy to understand; stress and intonation appropriate.
   3 Generally clear; occasional errors that do not block meaning.
   2 Often unclear; listener must make an effort.
   1 Mostly unintelligible.

3. Grammar accuracy (25 %)
   4 Uses the target structures correctly and consistently.
   3 Minor errors; meaning is clear.
   2 Frequent errors that sometimes affect meaning.
   1 Errors prevent understanding.

4. Vocabulary & task completion (25 %)
   4 Uses the unit vocabulary accurately and completes the whole task.
   3 Adequate vocabulary; task mostly completed.
   2 Limited vocabulary; task partly completed.
   1 Very limited vocabulary; task not completed.

Score per task = task points × (level 1 % + level 2 % + level 3 % + level 4 %) ÷ 4.`;

const RUBRICA_WRITING = `WRITING RUBRIC — apply to each writing task (task points × criterion %). Four criteria, 25 % each.
Levels: 4 = Excellent (100 %) · 3 = Good (75 %) · 2 = Developing (50 %) · 1 = Limited (25 %) · 0 = No text / off task.

1. Task completion & content (25 %)
   4 Covers every point of the task within the required length; purpose is clear.
   3 Covers most points; length close to the requirement.
   2 Covers some points; too short or partly off task.
   1 Does not address the task.

2. Organization & coherence (25 %)
   4 Clear structure (opening, body, closing); ideas linked with connectors.
   3 Mostly organized; some connectors.
   2 Ideas listed without clear order; few or wrong connectors.
   1 No recognizable organization.

3. Grammar accuracy (25 %)
   4 Target structures used correctly; almost no errors.
   3 Minor errors; meaning is clear.
   2 Frequent errors that sometimes affect meaning.
   1 Errors prevent understanding.

4. Vocabulary, spelling & punctuation (25 %)
   4 Unit vocabulary used accurately; spelling and punctuation correct.
   3 Adequate vocabulary; occasional spelling/punctuation slips.
   2 Limited or repetitive vocabulary; frequent slips.
   1 Very limited vocabulary; spelling makes the text hard to read.

Score per task = task points × (level 1 % + level 2 % + level 3 % + level 4 %) ÷ 4.`;

/** Rúbrica de la habilidad, o undefined si no aplica (Gram/Vocab, Listening, Reading). */
export function rubricaHabilidad(habilidad: HabilidadIngles): string | undefined {
  if (habilidad === "Speaking") return RUBRICA_SPEAKING;
  if (habilidad === "Writing") return RUBRICA_WRITING;
  return undefined;
}
