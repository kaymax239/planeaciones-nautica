// Route Handler (servidor) — genera bajo demanda el guion de una presentación
// premium con Claude (Anthropic) y lo devuelve como PresentacionV2 lista para
// el renderer.
//
// La API key vive SOLO aquí (servidor); nunca llega al navegador. Si falla la
// IA o falta la key, devuelve un error con código y el cliente cae al generador
// determinista existente (construirPresentacionV2).
//
// Proveedor: Claude (ANTHROPIC_API_KEY). El temario SIEMPRE proviene del
// programa oficial (app/data/contenidos); la IA desarrolla, NUNCA inventa temas.
// La salida se valida con Zod TOLERANTE: los bloques inválidos se descartan y
// se conservan los válidos.

import {
  contenidosMaterias,
  contenidosMateriasMN,
} from "../../data/contenidosMaterias";
import { esProgramaOficial } from "../../data/tipos";
import { TEMA_UNIDAD_COMPLETA } from "../../lib/construirPresentacionV2";
import {
  validarPresentacionTolerante,
  type PresentacionIA,
} from "../../lib/esquemaPresentacion";
import {
  SYSTEM_PROMPT,
  construirMensajeUsuario,
} from "../../lib/promptPresentacion";
import {
  claveCache,
  leerCache,
  escribirCache,
} from "../../lib/cachePresentacion";
import {
  MODELO_CLAUDE,
  tieneClaveAnthropic,
  generarTextoClaude,
  extraerJSON,
} from "../../lib/claudeIA";
import type { DiapositivaV2, PresentacionV2 } from "../../data/presentaciones/tiposV2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Claude puede tardar en generar un deck completo. Damos holgura
// (requiere plan Pro en Vercel; en Hobby se limita a 60).
export const maxDuration = 300;

// Modelo dedicado a presentaciones. Se resuelve en app/lib/claudeIA.ts.
const MODELO = MODELO_CLAUDE;
const TIMEOUT_MS = 180000;

type Cuerpo = {
  carrera?: "PN" | "MN";
  materia?: string;
  unidadNumero?: number;
  tema?: string;
  carreraDisplay?: string;
  semestreDisplay?: string;
  /** Si es true, ignora el cache y regenera con IA. */
  forzar?: boolean;
};

function error(codigo: string, mensaje: string, status: number) {
  return Response.json({ error: codigo, mensaje }, { status });
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
  let cuerpo: Cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return error("json_invalido", "Cuerpo de la solicitud inválido.", 400);
  }

  const { carrera, materia, unidadNumero, carreraDisplay, semestreDisplay } =
    cuerpo;
  if (!carrera || !materia || typeof unidadNumero !== "number") {
    return error(
      "faltan_datos",
      "Se requieren carrera, materia y unidadNumero.",
      400,
    );
  }

  const temaCompleto =
    !cuerpo.tema || cuerpo.tema === TEMA_UNIDAD_COMPLETA
      ? undefined
      : cuerpo.tema;

  // El currículo es fijo: si ya generamos esta unidad, la servimos del cache
  // (gratis, incluso sin API key). `forzar` lo regenera.
  const clave = claveCache({
    modelo: MODELO,
    carrera,
    materia,
    unidadNumero,
    tema: temaCompleto,
  });
  if (!cuerpo.forzar) {
    const cacheado = await leerCache(clave);
    if (cacheado) {
      return Response.json({ presentacion: cacheado, cacheado: true });
    }
  }

  // A partir de aquí hay que generar con IA: se requiere la API key.
  if (!tieneClaveAnthropic()) {
    return error("sin_api_key", "ANTHROPIC_API_KEY no está configurada.", 503);
  }

  const fuente = carrera === "MN" ? contenidosMateriasMN : contenidosMaterias;
  const programa = fuente[materia];
  if (!esProgramaOficial(programa)) {
    return error("sin_programa", "La materia no tiene programa oficial.", 404);
  }

  const unidad = programa.unidades.find((u) => u.numero === unidadNumero);
  if (!unidad) {
    return error("sin_unidad", "La unidad no existe en el programa.", 404);
  }

  const mensajeUsuario = construirMensajeUsuario({
    programa,
    unidad,
    carreraDisplay: carreraDisplay || programa.nombre,
    semestreDisplay: semestreDisplay || "",
    tema: temaCompleto,
  });

  // Hasta 2 intentos: timeout + reintento. La validación es tolerante: descarta
  // bloques inválidos y conserva los válidos (el renderer nunca recibe basura).
  let validado: PresentacionIA | null = null;
  let motivo = "fallo_ia";
  for (let intento = 1; intento <= 2 && !validado; intento++) {
    try {
      const texto = await conTimeout(
        generarTextoClaude(SYSTEM_PROMPT, mensajeUsuario),
        TIMEOUT_MS,
      );
      if (!texto.trim()) {
        motivo = "respuesta_vacia";
        continue;
      }
      let datos: unknown;
      try {
        datos = JSON.parse(extraerJSON(texto));
      } catch {
        motivo = "json_invalido";
        continue;
      }
      const r = validarPresentacionTolerante(datos);
      if (r.bloquesDescartados || r.diapositivasDescartadas) {
        console.warn(
          `Presentación IA: descartados ${r.bloquesDescartados} bloque(s) y ${r.diapositivasDescartadas} diapositiva(s) inválidos.`,
        );
      }
      if (r.pres.diapositivas.length === 0) {
        motivo = "sin_diapositivas";
        continue;
      }
      validado = r.pres;
    } catch (e) {
      motivo =
        e instanceof Error && e.message === "timeout" ? "timeout" : "fallo_ia";
      console.error(`Error generando presentación con IA (intento ${intento}):`, e);
    }
  }

  if (!validado) {
    return error(
      motivo,
      "No se pudo generar la presentación con IA.",
      502,
    );
  }

  const sufijo = temaCompleto ? `U${unidad.numero}_tema` : `U${unidad.numero}`;
  const presentacion: PresentacionV2 = {
    asignatura: programa.nombre,
    clave: programa.clave,
    unidad: `Unidad ${unidad.numero}: ${unidad.tema}`,
    carrera: carreraDisplay || programa.nombre,
    semestre: semestreDisplay || "",
    tema: temaCompleto,
    kicker: validado.kicker,
    subtituloPortada: validado.subtituloPortada ?? unidad.tema,
    nombreArchivo: `Presentacion_${programa.clave}_${sufijo}_IA.pptx`,
    diapositivas: validado.diapositivas as DiapositivaV2[],
  };

  // Guarda el guion para que esta unidad no se vuelva a pagar.
  await escribirCache(clave, presentacion);

  return Response.json({ presentacion, cacheado: false });
}
