// Fase 2 — Endpoint del Modo Premium: enriquecimiento pedagógico con Claude
// (Anthropic).
//
// Recibe la materia, toma el PROGRAMA OFICIAL como fuente de verdad, selecciona
// planeaciones históricas de referencia (seleccionHistoricas) y los lineamientos
// DEN, y pide a la IA SOLO la parte pedagógica (competencias, estrategias,
// técnicas, secuencia, productos, instrumentos). Valida con esquema estricto y
// fusiona garantizando que temas/objetivos/bibliografía vengan del programa.
//
// TOLERANTE A FALLOS: si falta la key, la IA falla, hay timeout o el JSON es
// inválido tras un reintento, devuelve `enriquecimiento: null` con HTTP 200 y un
// `motivo`. El cliente (Fase 3) cae entonces al F-32 determinista ACTUAL, de modo
// que el usuario obtiene exactamente la misma planeación que hoy.
//
// No modifica generarWord, F-32.docx ni app/data/contenidos (solo los lee).

import { promises as fs } from "fs";
import path from "path";
import {
  contenidosMaterias,
  contenidosMateriasMN,
} from "../../data/contenidosMaterias";
import { esProgramaOficial, type ProgramaOficial } from "../../data/tipos";
import {
  textoPuntuacionesF32,
  generacionPorSemestre,
  tipoMateriaDesdePrograma,
} from "../../data/evaluacion";
import {
  seleccionarHistoricas,
  rutaCorpus,
  type Carrera,
} from "../../lib/seleccionHistoricas";
import { verificarAuth } from "../../lib/server/auth";
import {
  SYSTEM_PROMPT,
  construirMensajeUsuario,
  type ReferenciaHistorica,
} from "../../lib/promptPlaneacion";
import {
  planeacionEnriquecidaSchema,
  type PlaneacionEnriquecida,
} from "../../lib/esquemaPlaneacion";
import { mergePlaneacion } from "../../lib/mergePlaneacion";
import {
  claveCache,
  leerCache,
  escribirCache,
} from "../../lib/cachePlaneacion";
import {
  modeloClaude,
  tieneClaveAnthropic,
  generarJSONEstructuradoClaude,
  ErrorJSONClaude,
} from "../../lib/claudeIA";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Mismo modelo que el resto de planeaciones (ANTHROPIC_MODEL_PLANEACIONES ||
// ANTHROPIC_MODEL). Entra en la clave de cache, así que cambiarlo regenera.
const MODELO = modeloClaude("planeaciones");
// maxDuration = 120 s y hasta 2 intentos: el timeout por intento tiene que
// dejar margen para que la ruta responda `enriquecimiento: null` (fallback
// determinista) en lugar de que Vercel mate la función con un 504.
const TIMEOUT_MS = 50000;
const MAX_TOKENS = 16000;

type Cuerpo = {
  carrera?: Carrera;
  materia?: string;
  /** Si se indica, enriquece solo esa unidad; si no, todas las del programa. */
  unidadNumero?: number;
  carreraDisplay?: string;
  semestreDisplay?: string;
  forzar?: boolean;
};

function respuesta(
  enriquecimiento: PlaneacionEnriquecida | null,
  extra: Record<string, unknown> = {},
) {
  return Response.json({ enriquecimiento, ...extra });
}

const ROMANO: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8,
};
function semestreDeDisplay(display: string): number | undefined {
  const m = display.toUpperCase().match(/\b(VIII|VII|VI|IV|III|II|I|V)\b/);
  return m ? ROMANO[m[1]] : undefined;
}

/** Carga el corpus de una entrada histórica como referencia de estilo. */
async function cargarReferencia(
  entrada: { corpus: string; clave: string; materia: string },
  etiquetaNivel: string,
): Promise<ReferenciaHistorica | null> {
  try {
    const abs = path.join(process.cwd(), rutaCorpus(entrada as never));
    const j = JSON.parse(await fs.readFile(abs, "utf8"));
    const p = j.pedagogia ?? {};
    return {
      clave: entrada.clave,
      materia: entrada.materia,
      etiquetaNivel,
      pedagogia: {
        competencias: p.competencias,
        estrategiasEnsenanza: p.estrategiasEnsenanza,
        tecnicasEnsenanza: p.tecnicasEnsenanza,
        secuenciaDidactica: p.secuenciaDidactica,
        productosEvidencias: p.productosEvidencias,
        instrumentosEvaluacion: p.instrumentosEvaluacion,
      },
    };
  } catch {
    return null;
  }
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

export async function POST(request: Request) {
  const sesionAuth = await verificarAuth(request);
  if (!sesionAuth.ok) return sesionAuth.respuesta;

  let cuerpo: Cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ error: "json_invalido" }, { status: 400 });
  }

  const { carrera, materia, unidadNumero } = cuerpo;
  if (!carrera || !materia) {
    return Response.json({ error: "faltan_datos" }, { status: 400 });
  }

  const fuente = carrera === "MN" ? contenidosMateriasMN : contenidosMaterias;
  const programa = fuente[materia] as ProgramaOficial | undefined;
  if (!esProgramaOficial(programa)) {
    // Sin programa oficial no hay nada que enriquecer con garantía → fallback.
    return respuesta(null, { motivo: "sin_programa" });
  }

  const unidades =
    typeof unidadNumero === "number"
      ? programa.unidades.filter((u) => u.numero === unidadNumero)
      : programa.unidades;
  if (!unidades.length) return respuesta(null, { motivo: "sin_unidad" });

  // Cache: el currículo es fijo, no se vuelve a pagar la misma materia/unidades.
  const clave = claveCache({
    modelo: MODELO,
    carrera,
    clave: programa.clave,
    unidades: unidades.map((u) => u.numero),
  });
  if (!cuerpo.forzar) {
    const cacheado = await leerCache(clave);
    if (cacheado) {
      return respuesta(cacheado, {
        cacheado: true,
        merge: mergePlaneacion(programa, cacheado),
      });
    }
  }

  if (!tieneClaveAnthropic()) {
    return respuesta(null, { motivo: "sin_api_key" });
  }

  // Referencias históricas (estilo institucional) vía la cascada de la Fase 1.
  const semestre = cuerpo.semestreDisplay
    ? semestreDeDisplay(cuerpo.semestreDisplay)
    : undefined;
  const seleccion = seleccionarHistoricas(
    { clave: programa.clave, materia: programa.nombre, carrera, semestre },
    { maximo: 2 },
  );
  const referencias = (
    await Promise.all(
      seleccion.map((s) => cargarReferencia(s.entrada, s.etiquetaNivel)),
    )
  ).filter((r): r is ReferenciaHistorica => r !== null);

  const lineamientosDEN = textoPuntuacionesF32(
    tipoMateriaDesdePrograma(programa),
    generacionPorSemestre(cuerpo.semestreDisplay || ""),
  );

  const mensaje = construirMensajeUsuario({
    programa,
    unidades,
    carreraDisplay: cuerpo.carreraDisplay || programa.nombre,
    semestreDisplay: cuerpo.semestreDisplay || "",
    lineamientosDEN,
    historicas: referencias,
  });

  // Hasta 2 intentos: timeout + reintento. El JSON lo fuerza Claude con el
  // esquema (structured outputs, derivado del MISMO esquema Zod) y se revalida
  // con Zod antes de aceptarlo.
  let validado: PlaneacionEnriquecida | null = null;
  let motivo = "fallo_ia";
  for (let intento = 1; intento <= 2 && !validado; intento++) {
    try {
      const { datos } = await conTimeout(
        generarJSONEstructuradoClaude(
          SYSTEM_PROMPT,
          mensaje,
          planeacionEnriquecidaSchema,
          { modelo: MODELO, maxTokens: MAX_TOKENS, esfuerzo: "low" },
        ),
        TIMEOUT_MS,
      );
      if (datos.unidades.length === 0) {
        motivo = "sin_unidades";
        continue;
      }
      validado = datos;
    } catch (e) {
      if (e instanceof ErrorJSONClaude) {
        // "respuesta_vacia" | "json_invalido" — mismos motivos que antes.
        motivo = e.motivo;
      } else {
        motivo =
          e instanceof Error && e.message === "timeout" ? "timeout" : "fallo_ia";
      }
      console.error(`planeacion-enriquecida intento ${intento}:`, e);
    }
  }

  if (!validado) {
    // Fallback: el cliente generará el F-32 determinista actual.
    return respuesta(null, { motivo });
  }

  await escribirCache(clave, validado);

  return respuesta(validado, {
    cacheado: false,
    historicasUsadas: referencias.map((r) => ({
      clave: r.clave,
      materia: r.materia,
      relacion: r.etiquetaNivel,
    })),
    merge: mergePlaneacion(programa, validado),
  });
}
