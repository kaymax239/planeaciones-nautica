// Endpoint AISLADO — genera una planeación didáctica de Inglés con Gemini,
// usando como base el corpus histórico indexado (BibliotecaIngles.leerIndice()).
//
// Inglés NO usa STCW ni los programas oficiales PN/MN. Se apoya en el enfoque
// iDiscover, los niveles y las planeaciones históricas reales: la IA debe
// ESPEJEAR su estructura, estilo, actividades, secuencia, evaluación y formato.
//
// La API key vive SOLO aquí (servidor). No guarda archivos: devuelve JSON a la
// UI. Independiente del flujo PN/MN, de presentaciones, F-32, F-51 y exámenes.

import { GoogleGenAI } from "@google/genai";
import {
  BibliotecaIngles,
  type EntradaIndiceIngles,
} from "../../lib/bibliotecaIngles";
import { bibliografiaIDiscover } from "../../lib/planeacionInglesF32.js";
import { verificarAuth } from "../../lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Modelo propio de Inglés. Por defecto flash (plan gratuito); configurable sin
// afectar a presentaciones (GEMINI_MODEL_PRESENTACIONES) ni a F-32 (GEMINI_MODEL).
const MODELO =
  process.env.GEMINI_MODEL_INGLES ||
  process.env.GEMINI_MODEL ||
  "gemini-2.5-flash";
const TIMEOUT_MS = 120000;

// Cuántas planeaciones históricas se incluyen como referencia y cuánto texto de
// cada una. Se toma cabecera + cola para captar tanto las competencias/objetivos
// (al inicio) como la bibliografía/evaluación (al final) sin inflar el prompt.
const MAX_REFERENCIAS = 3;
const MAX_CHARS_CABECERA = 14000;
const MAX_CHARS_COLA = 8000;

/** Recorta una referencia conservando inicio y final (donde viven competencias,
 *  objetivos, bibliografía y ponderaciones). */
function recortarReferencia(t: string): string {
  if (t.length <= MAX_CHARS_CABECERA + MAX_CHARS_COLA) return t;
  const ini = t.slice(0, MAX_CHARS_CABECERA);
  const fin = t.slice(t.length - MAX_CHARS_COLA);
  return `${ini}\n[…]\n${fin}`;
}

type Cuerpo = {
  nivel?: string;
  grupo?: string;
  /** Opcional: solo afina el orden de las referencias del nivel. */
  tema?: string;
  semanas?: number | string;
  horasPorSemana?: number | string;
  observaciones?: string;
};

function error(
  codigo: string,
  mensaje: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return Response.json({ error: codigo, mensaje, ...extra }, { status });
}

function conTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

const sinAcentos = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "");

// Texto institucional de relleno que NUNCA debe aparecer como competencia
// disciplinar en una planeación generada (p. ej. "Estas competencias las
// integrará el docente o instructor").
const RE_DISCIPLINARES_RELLENO = /integrar[aá][^.]*?(docente|instructor)/i;

// Elimina del JSON cualquier "competencia disciplinar" que en realidad sea el
// texto institucional de relleno. Si tras filtrar no queda ninguna, deja []. No
// afecta a genéricas, objetivos ni al resto del flujo.
function sanearDisciplinares(planeacion: unknown): void {
  if (!planeacion || typeof planeacion !== "object") return;
  const comp = (planeacion as { competencias?: unknown }).competencias;
  if (!comp || typeof comp !== "object") return;
  const c = comp as { disciplinares?: unknown };
  if (!Array.isArray(c.disciplinares)) return;
  c.disciplinares = c.disciplinares.filter(
    (x) =>
      typeof x === "string" &&
      x.trim().length > 0 &&
      !RE_DISCIPLINARES_RELLENO.test(x),
  );
}

// Aísla el objeto JSON: quita ```json ... ``` y texto sobrante, quedándose con
// el primer "{" hasta el último "}".
function extraerJSON(texto: string): string {
  let t = texto.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const ini = t.indexOf("{");
  const fin = t.lastIndexOf("}");
  if (ini !== -1 && fin !== -1 && fin > ini) t = t.slice(ini, fin + 1);
  return t;
}

/**
 * Selecciona las planeaciones históricas del MISMO nivel para espejearlas. El
 * nivel es la base principal: si no hay históricas de ese nivel, devuelve [].
 * Si se da un tema (opcional), lo usa solo para ordenar dentro del nivel; sin
 * tema, prioriza las más completas (mayor número de palabras).
 */
function seleccionarReferencias(
  entradas: EntradaIndiceIngles[],
  nivel: string,
  tema: string,
): EntradaIndiceIngles[] {
  const nivelNorm = sinAcentos(nivel).toLowerCase().trim();
  // Coincidencia por nivel exacto o por el número de nivel contenido en el texto
  // del nivel histórico (p. ej. "5" ~ "5").
  const porNivel = entradas.filter(
    (e) => (e.nivel ?? "").toLowerCase().trim() === nivelNorm,
  );
  if (porNivel.length === 0) return [];

  const terminos = sinAcentos(tema)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);

  const puntuar = (e: EntradaIndiceIngles): number => {
    if (terminos.length === 0) return 0;
    const texto = sinAcentos(e.texto).toLowerCase();
    let score = 0;
    for (const term of terminos) {
      if (texto.includes(term)) score += 1;
    }
    return score;
  };

  return [...porNivel]
    .map((e) => ({ e, s: puntuar(e) }))
    .sort((a, b) => b.s - a.s || b.e.palabras - a.e.palabras)
    .slice(0, MAX_REFERENCIAS)
    .map((x) => x.e);
}

/** Lista de niveles disponibles en el corpus (para mensajes de error claros). */
function nivelesDisponibles(entradas: EntradaIndiceIngles[]): string[] {
  const set = new Set<string>();
  for (const e of entradas) if (e.nivel) set.add(e.nivel);
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

const SYSTEM_PROMPT = `Eres el MISMO docente de inglés de una escuela náutica mercante mexicana que redactó las planeaciones históricas. Tu tarea NO es escribir una planeación desde cero, sino ACTUALIZAR una planeación existente del nivel: parte de las planeaciones históricas del nivel y produce una versión nueva que sea prácticamente INDISTINGUIBLE de las que ya elaboró el docente. Conserva su voz, su estilo institucional y su formato.

FLUJO POR ESPEJEO (regla central):
- Trabajas POR NIVEL. La base son las PLANEACIONES HISTÓRICAS reales del MISMO NIVEL que se te entregan.
- TEMAS, UNIDADES, SECUENCIA, OBJETIVOS, COMPETENCIAS, EVALUACIÓN, RECURSOS y BIBLIOGRAFÍA se EXTRAEN/DERIVAN de esas históricas. No inventes desde cero.
- Comportarte como si actualizaras un documento existente: mismo tono, mismas frases institucionales, misma longitud y dificultad de actividades.

REGLAS POR APARTADO:
1) COMPETENCIAS — NO inventes competencias propias. Extrae las que aparecen en las históricas del nivel, conservando su categorización tal como ellas la usan:
   - "disciplinares": las competencias disciplinares de las históricas.
   - "genericas": { "instrumentales": [...], "interpersonales": [...], "sistemicas": [...] } con las competencias genéricas de las históricas.
   - Si varias históricas difieren, usa las MÁS REPETIDAS o representativas. NO uses competencias STCW.
   - Competencias disciplinares: localiza en las históricas del nivel el apartado COMPETENCIAS DISCIPLINARES (p. ej. "COMPETENCIAS DISCIPLINARES QUE SE FAVORECEN") y EXTRAE las competencias disciplinares reales que ahí aparezcan (son las propias del inglés: comprender/expresar/comunicar, etc.). Si varias históricas las traen, usa las MÁS REPETIDAS o representativas. PROHIBIDO devolver textos institucionales de relleno como "Estas competencias las integrará el docente o instructor" o cualquier variante: NUNCA los escribas. Si tras revisar las históricas no hay competencias disciplinares reales, devuelve un arreglo vacío []. No inventes competencias.
2) OBJETIVO GENERAL y OBJETIVOS ESPECÍFICOS — no los inventes; derívalos del patrón y la redacción de las históricas del mismo nivel.
3) ACTIVIDADES — antes de redactarlas, identifica las actividades más frecuentes del nivel y MANTÉN su estructura, longitud, redacción, dificultad y secuencia.
4) EVALUACIÓN — no inventes ponderaciones. Si las históricas usan una distribución determinada (p. ej. Workbook, exámenes parciales, etc.), RESPÉTALA.
5) RECURSOS — tómalos preferentemente de las históricas; agrega nuevos solo si son necesarios.
6) BIBLIOGRAFÍA — usa la bibliografía de las históricas. Si no aparece, usa la bibliografía institucional del libro iDiscover del nivel (te la indico en el mensaje). NUNCA escribas "No especificada…".

REGLAS DURAS:
- NO uses STCW ni estándares OMI. NO uses programas oficiales de Piloto Naval ni Máquinas Navales.
- Base conceptual: enfoque iDiscover + planeaciones históricas del nivel.
- Respeta nivel, grupo, semanas y horas por semana; ajusta la secuencia histórica a ese número de semanas.

SALIDA:
- Devuelve ÚNICAMENTE un objeto JSON válido (sin texto adicional, sin markdown):
{
  "asignatura": string,
  "nivel": string,
  "grupo": string,
  "tema": string,
  "enfoque": string,
  "objetivoGeneral": string,
  "objetivosEspecificos": string[],
  "competencias": {
    "disciplinares": string[],
    "genericas": {
      "instrumentales": string[],
      "interpersonales": string[],
      "sistemicas": string[]
    }
  },
  "secuenciaSemanal": [
    { "semana": number, "contenido": string, "actividades": string[], "evidencias": string, "recursos": string[] }
  ],
  "evaluacion": [
    { "instrumento": string, "ponderacion": string, "descripcion": string }
  ],
  "recursos": string[],
  "bibliografia": string[],
  "observaciones": string
}
- "secuenciaSemanal" debe tener exactamente tantas entradas como semanas indicadas.`;

function construirMensajeUsuario(
  datos: {
    nivel: string;
    grupo: string;
    semanas: number;
    horasPorSemana: number;
    observaciones: string;
  },
  referencias: EntradaIndiceIngles[],
): string {
  const bloquesRef = referencias
    .map((r, i) => {
      const recorte = recortarReferencia(r.texto);
      return `--- REFERENCIA ${i + 1} (origen: ${r.origen}; nivel: ${
        r.nivel ?? "n/d"
      }; archivo: ${r.nombre}) ---\n${recorte}`;
    })
    .join("\n\n");

  return `DATOS PARA ACTUALIZAR LA PLANEACIÓN DE INGLÉS (flujo por nivel):
- Nivel: ${datos.nivel}
- Grupo: ${datos.grupo || "(no especificado)"}
- Semanas: ${datos.semanas || "(deriva de las referencias)"}
- Horas por semana: ${datos.horasPorSemana || "(deriva de las referencias)"}
- Observaciones: ${datos.observaciones || "(ninguna)"}

Bibliografía institucional del nivel (úsala SOLO si las históricas no traen bibliografía): ${bibliografiaIDiscover(
    datos.nivel,
  )}

Tema, unidades, secuencia, objetivos, competencias, evaluación y recursos se EXTRAEN/DERIVAN de las históricas del nivel ${datos.nivel} de abajo. Compórtate como si ACTUALIZARAS estas planeaciones, conservando voz, estilo y formato del docente.

PLANEACIONES HISTÓRICAS DEL NIVEL ${datos.nivel}:

${bloquesRef || "(sin referencias disponibles)"}

Genera ahora la planeación didáctica de Inglés en el JSON solicitado. Espeja estas históricas (competencias categorizadas, objetivos, actividades con su misma longitud/dificultad/secuencia, evaluación con su misma distribución, recursos y bibliografía). NO uses STCW. NO inventes desde cero.`;
}

async function generarTexto(
  client: GoogleGenAI,
  system: string,
  mensaje: string,
): Promise<string> {
  const resp = await client.models.generateContent({
    model: MODELO,
    contents: mensaje,
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      temperature: 0.5,
      maxOutputTokens: 32000,
    },
  });
  return resp.text ?? "";
}

export async function POST(request: Request) {
  const sesionAuth = await verificarAuth(request);
  if (!sesionAuth.ok) return sesionAuth.respuesta;

  let cuerpo: Cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return error("json_invalido", "Cuerpo de la solicitud inválido.", 400);
  }

  const nivel = (cuerpo.nivel ?? "").toString().trim();
  const grupo = (cuerpo.grupo ?? "").toString().trim();
  // tema es OPCIONAL: solo afina el orden de las referencias del nivel.
  const tema = (cuerpo.tema ?? "").toString().trim();
  const observaciones = (cuerpo.observaciones ?? "").toString().trim();
  const semanas = Number(cuerpo.semanas) || 0;
  const horasPorSemana = Number(cuerpo.horasPorSemana) || 0;

  // Flujo por espejeo: el ÚNICO dato obligatorio es el nivel.
  if (!nivel) {
    return error("faltan_datos", "Se requiere el nivel.", 400);
  }

  // 1. Leer el índice del corpus histórico.
  const indice = await BibliotecaIngles.leerIndice();
  if (!indice || indice.documentos.length === 0) {
    return error(
      "sin_corpus",
      "No hay índice de planeaciones históricas de inglés. Ejecuta la indexación primero.",
      503,
    );
  }

  // 2-3. Base principal: planeaciones históricas del MISMO nivel.
  const referencias = seleccionarReferencias(indice.documentos, nivel, tema);
  if (referencias.length === 0) {
    const niveles = nivelesDisponibles(indice.documentos);
    return error(
      "sin_historicas_nivel",
      `No hay planeaciones históricas del nivel "${nivel}". Niveles disponibles: ${
        niveles.join(", ") || "ninguno detectado"
      }.`,
      404,
      { nivelesDisponibles: niveles },
    );
  }

  // 5. API key (solo servidor).
  if (!process.env.GEMINI_API_KEY) {
    return error("sin_api_key", "GEMINI_API_KEY no está configurada.", 503);
  }

  // 4. Construir prompt (tema/objetivo se derivan de las históricas del nivel).
  const mensajeUsuario = construirMensajeUsuario(
    { nivel, grupo, semanas, horasPorSemana, observaciones },
    referencias,
  );

  // 6-9. Llamar a Gemini, limpiar y parsear (con reintento por timeout).
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let textoCrudo = "";
  let motivo = "fallo_ia";
  for (let intento = 1; intento <= 2; intento++) {
    try {
      textoCrudo = await conTimeout(
        generarTexto(client, SYSTEM_PROMPT, mensajeUsuario),
        TIMEOUT_MS,
      );
      if (textoCrudo.trim()) break;
      motivo = "respuesta_vacia";
    } catch (e) {
      motivo =
        e instanceof Error && e.message === "timeout" ? "timeout" : "fallo_ia";
      console.error(`Error generando planeación de inglés (intento ${intento}):`, e);
    }
  }

  if (!textoCrudo.trim()) {
    return error(motivo, "No se pudo generar la planeación de inglés.", 502);
  }

  // 8. Limpiar texto extra. 9. Si falla JSON.parse, devolver respuesta original.
  const limpio = extraerJSON(textoCrudo);
  let planeacion: unknown;
  try {
    planeacion = JSON.parse(limpio);
  } catch (e) {
    return error(
      "json_invalido_ia",
      "Gemini devolvió un JSON no parseable.",
      502,
      {
        detalle: e instanceof Error ? e.message : String(e),
        respuestaOriginal: textoCrudo,
      },
    );
  }

  // El texto institucional de relleno nunca debe salir como competencia.
  sanearDisciplinares(planeacion);

  // 10. Devolver JSON a la UI (no se guardan archivos).
  return Response.json({
    planeacion,
    referenciasUsadas: referencias.map((r) => ({
      nombre: r.nombre,
      origen: r.origen,
      nivel: r.nivel,
      rutaRelativa: r.rutaRelativa,
    })),
    modelo: MODELO,
  });
}
