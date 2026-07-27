// Temario oficial por nivel para los niveles de Inglés que NO tienen
// planeaciones históricas propias en el corpus (p. ej. el Nivel 8, que es nuevo:
// es el primer semestre que se imparte). Para estos niveles:
//
//   - La SECUENCIA DE TEMAS (módulos, gramática, vocabulario, destrezas) se toma
//     de este temario oficial. No se inventa.
//   - La ESTRUCTURA/ESTILO/COMPETENCIAS/EVALUACIÓN/FORMATO se ESPEJAN de las
//     planeaciones históricas del nivel indicado en NIVEL_ESPEJO (p. ej. el 8 se
//     espeja del 7, el nivel más avanzado con históricas).
//
// Fuente del temario: índice ("Contents") del libro iDiscover 8 (Express
// Publishing), ISBN 978-1-4715-1824-9 — mismo libro de texto de la serie de los
// niveles 1–7. Es el alcance/temario oficial del curso.

/** Nivel del que se toman ESTRUCTURA y ESTILO cuando el nivel destino no tiene
 *  planeaciones históricas propias. */
export const NIVEL_ESPEJO: Record<string, string> = {
  "8": "7",
};

export type ModuloTemario = {
  /** Número del módulo dentro del libro. */
  numero: number;
  /** Título del módulo tal como aparece en el libro. */
  titulo: string;
  /** Rango de páginas del módulo (informativo). */
  paginas: string;
  /** Puntos gramaticales del módulo (en orden). */
  gramatica: string[];
  /** Campos de vocabulario del módulo (en orden). */
  vocabulario: string[];
  /** Destrezas de Reading & Listening. */
  lecturaEscucha: string[];
  /** Speaking & Functions. */
  produccionOral: string[];
  /** Writing. */
  escritura: string[];
  /** Culture / Cross-curricular. */
  cultura: string[];
  /** Cierre del módulo (Skills Practice / Language in Use / Revision). */
  cierre: string[];
};

export type TemarioNivel = {
  /** Libro de texto y ISBN. */
  libro: string;
  /** Módulos del libro, en orden. */
  modulos: ModuloTemario[];
};

// iDiscover 8 — Contents (Express Publishing), ISBN 978-1-4715-1824-9.
export const TEMARIO_OFICIAL: Record<string, TemarioNivel> = {
  "8": {
    libro: "iDiscover 8 (Express Publishing), Evans, Dooley — ISBN 978-1-4715-1824-9",
    modulos: [
      {
        numero: 1,
        titulo: "Extreme facts",
        paginas: "pp. 5–17",
        gramatica: [
          "Future tenses",
          "Clauses of Time",
          "Future perfect / Future progressive / Future perfect progressive",
          "-ing / (to-)infinitive",
        ],
        vocabulario: [
          "Extreme people, places",
          "Insects / Bugs",
          "Ways of cooking",
          "Extraordinary lifestyles",
          "Extreme Sports",
          "Phrasal verbs",
          "Prepositional phrases",
          "Word formation",
        ],
        lecturaEscucha: [
          "“Waiter, there’s a Scorpion in my soup!” (missing sentences)",
          "“Pushing the Limits” (multiple matching)",
          "“The Shark Whisperer” (multiple choice)",
          "Fill in missing information (listening)",
        ],
        produccionOral: [
          "Give opinions",
          "Intonation: showing hesitation",
          "Inviting a friend to an event",
          "An interview",
        ],
        escritura: [
          "Sentences expressing your opinion on eating insects",
          "Description of a scene",
          "A paragraph about inventions",
          "A paragraph about an extreme/dangerous sport",
          "An opinion essay",
        ],
        cultura: [
          "The Swamp People of Louisiana (multiple choice cloze)",
          "History: Jousting (open cloze)",
        ],
        cierre: [
          "Skills Practice 1 (p. 18)",
          "Language in Use 1 (p. 19)",
          "Revision 1 (p. 20)",
        ],
      },
      {
        numero: 2,
        titulo: "Still a mystery",
        paginas: "pp. 21–33",
        gramatica: [
          "The passive (personal / impersonal constructions)",
          "Question tags",
          "Reflexive / Emphatic pronouns",
          "Causative (have + object + past participle)",
        ],
        vocabulario: [
          "Mysterious events",
          "UFO tour",
          "Strange Creatures",
          "Ways of looking",
          "Recreating Monsters",
          "Types of books",
          "Phrasal verbs",
          "Word formation (verbs / adjectives)",
        ],
        lecturaEscucha: [
          "“The Truth isn’t Out There … or is it?” (missing sentences)",
          "“In Search of Monsters” (multiple choice)",
          "“Back to Life!” (missing sentences)",
          "Multiple matching (listening)",
        ],
        produccionOral: [
          "Intonation: question tags",
          "Booking tickets for a guided tour",
          "Give opinions",
        ],
        escritura: [
          "A paragraph about a tour",
          "A summary",
          "Sentences expressing your opinion on extinct species",
          "A presentation on dinosaurs",
          "A description of an experience",
          "A book review",
        ],
        cultura: [
          "A Room with a Boo (multiple choice cloze)",
          "Literature: The Day of the Triffids (multiple matching)",
        ],
        cierre: [
          "Skills Practice 2 (p. 34)",
          "Language in Use 2 (p. 35)",
          "Revision 2 (p. 36)",
        ],
      },
      {
        numero: 3,
        titulo: "Lifelong learning",
        paginas: "pp. 37–49",
        gramatica: [
          "Reported speech (statements)",
          "Reported questions / commands",
          "Relative clauses",
          "Special introductory verbs",
          "Linkers",
        ],
        vocabulario: [
          "Learning experiences",
          "Martial art skills",
          "School subjects",
          "Technology in education",
          "Achievements",
          "Higher education",
          "Phrasal verbs",
          "Word formation",
        ],
        lecturaEscucha: [
          "“Training with the Shaolin Monks” (missing sentences)",
          "“Khan Academy” (multiple choice)",
          "“The Boy who Harnessed the Wind” (multiple choice)",
          "Fill in missing information (listening)",
        ],
        produccionOral: [
          "Give opinions",
          "A radio interview",
          "Intonation: emphatic stress",
          "Borrowing library books",
          "Describe impressions from text",
          "Compare photos",
        ],
        escritura: [
          "What someone learned from an experience",
          "An interview",
          "How an inventor feels",
          "A story",
        ],
        cultura: [
          "Youth Leadership Program (open cloze)",
          "PSHE: Train your Brain! (open cloze)",
        ],
        cierre: [
          "Skills Practice 3 (p. 50)",
          "Language in Use 3 (p. 51)",
          "Revision 3 (p. 52)",
        ],
      },
    ],
  },
};

/** ¿El nivel tiene temario oficial configurado (para niveles sin históricas)? */
export function tieneTemarioOficial(nivel: string): boolean {
  return Object.prototype.hasOwnProperty.call(TEMARIO_OFICIAL, String(nivel).trim());
}

/** Niveles con temario oficial (p. ej. ["8"]). Se muestran en el menú aunque no
 *  tengan planeaciones históricas propias. */
export const NIVELES_CON_TEMARIO = Object.keys(TEMARIO_OFICIAL);

/**
 * Devuelve el temario oficial del nivel como texto plano ordenado, listo para
 * inyectar en el prompt del generador. Null si el nivel no tiene temario.
 */
export function temarioOficialTexto(nivel: string): string | null {
  const t = TEMARIO_OFICIAL[String(nivel).trim()];
  if (!t) return null;
  const lineas: string[] = [];
  lineas.push(`Libro de texto: ${t.libro}.`);
  for (const m of t.modulos) {
    lineas.push("");
    lineas.push(`MÓDULO ${m.numero}: ${m.titulo} (${m.paginas})`);
    lineas.push(`  Gramática: ${m.gramatica.join("; ")}.`);
    lineas.push(`  Vocabulario: ${m.vocabulario.join("; ")}.`);
    lineas.push(`  Reading & Listening: ${m.lecturaEscucha.join("; ")}.`);
    lineas.push(`  Speaking & Functions: ${m.produccionOral.join("; ")}.`);
    lineas.push(`  Writing: ${m.escritura.join("; ")}.`);
    lineas.push(`  Culture / Cross-curricular: ${m.cultura.join("; ")}.`);
    lineas.push(`  Cierre: ${m.cierre.join("; ")}.`);
  }
  return lineas.join("\n");
}
