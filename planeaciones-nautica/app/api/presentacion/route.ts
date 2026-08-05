// Route Handler (servidor) — genera bajo demanda el guion de una presentación
// premium con IA y lo devuelve como PresentacionV2 lista para el renderer.
//
// La API key vive SOLO aquí (servidor); nunca llega al navegador. Si falla la
// IA o falta la key, devuelve un error con código y el cliente cae al generador
// determinista existente (construirPresentacionV2).
//
// Proveedor: Gemini por defecto (GEMINI_API_KEY), con Claude (ANTHROPIC_API_KEY)
// como FALLBACK AUTOMÁTICO ante 429/cuota/clave ausente. Se configura con
// PROVEEDOR_PRESENTACIONES. Ver app/lib/geminiIA.ts: la cadena de proveedores,
// el registro en consola de quién sirvió y la identidad que entra en el cache
// viven allí, no aquí.
//
// El temario SIEMPRE proviene del programa oficial (app/data/contenidos); la IA
// desarrolla, NUNCA inventa temas. La salida se valida con Zod TOLERANTE: los
// bloques inválidos se descartan y se conservan los válidos.

import {
  contenidosMaterias,
  contenidosMateriasMN,
} from "../../data/contenidosMaterias";
import { esProgramaOficial } from "../../data/tipos";
import { TEMA_UNIDAD_COMPLETA } from "../../lib/construirPresentacionV2";
import {
  responseSchemaPresentacion,
  validarPresentacionTolerante,
  type PresentacionIA,
} from "../../lib/esquemaPresentacion";
import {
  SYSTEM_PROMPT,
  construirMensajeUsuario,
} from "../../lib/promptPresentacion";
import {
  claveCache,
  leerCachePrimero,
  escribirCache,
} from "../../lib/cachePresentacion";
import {
  extraerJSON,
  generadorPresentaciones,
  generadoresPresentaciones,
  generarTextoPresentacion,
  hayClavePresentaciones,
  proveedorPresentaciones,
  type ProveedorPresentaciones,
} from "../../lib/geminiIA";
import {
  fuenteDesdePrograma,
  validarPresentacionOficial,
  resumirVeredicto,
  type VeredictoOficial,
} from "../../lib/validarPresentacionOficial";
import type { DiapositivaV2, PresentacionV2 } from "../../data/presentaciones/tiposV2";
import { verificarAuth } from "../../lib/server/auth";
import { verificarLimite, contarUso } from "../../lib/server/limites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Generar un deck completo puede tardar. Damos holgura
// (requiere plan Pro en Vercel; en Hobby se limita a 60).
export const maxDuration = 300;

// El modelo dedicado a presentaciones se resuelve en app/lib/geminiIA.ts
// (proveedor configurado + su fallback).
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

export async function POST(request: Request) {
  const sesionAuth = await verificarAuth(request);
  if (!sesionAuth.ok) return sesionAuth.respuesta;

  const limite = await verificarLimite(sesionAuth.sesion, "presentaciones");
  if (!limite.ok) return limite.respuesta;

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
  // (gratis, incluso sin API key). `forzar` lo regenera. La identidad del
  // generador entra en la clave, así que se consultan las de la cadena de
  // proveedores en su orden de preferencia.
  const alcance = { carrera, materia, unidadNumero, tema: temaCompleto };
  if (!cuerpo.forzar) {
    const cacheado = await leerCachePrimero(
      generadoresPresentaciones().map((modelo) =>
        claveCache({ modelo, ...alcance }),
      ),
    );
    if (cacheado) {
      await contarUso(sesionAuth.sesion, "presentaciones");
      return Response.json({ presentacion: cacheado, cacheado: true });
    }
  }

  // A partir de aquí hay que generar con IA: se requiere la API key de algún
  // proveedor de la cadena (Gemini o, como fallback, Anthropic).
  if (!hayClavePresentaciones()) {
    return error(
      "sin_api_key",
      "No hay clave de IA configurada (GEMINI_API_KEY o ANTHROPIC_API_KEY).",
      503,
    );
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

  // Segunda red, distinta de la de Zod: Zod comprueba la FORMA del guion; esto
  // comprueba que su CONTENIDO salga del programa oficial. La IA desarrolla el
  // temario, nunca lo inventa.
  const fuenteOficial = fuenteDesdePrograma(programa, unidad.numero);
  let ultimoVeredicto: VeredictoOficial | null = null;
  let veredictoServido: VeredictoOficial | null = null;

  // Hasta 2 intentos: timeout + reintento. La validación es tolerante: descarta
  // bloques inválidos y conserva los válidos (el renderer nunca recibe basura).
  let validado: PresentacionIA | null = null;
  let proveedorUsado: ProveedorPresentaciones | null = null;
  let motivo = "fallo_ia";
  for (let intento = 1; intento <= 2 && !validado; intento++) {
    try {
      const { texto, proveedor } = await generarTextoPresentacion(
        SYSTEM_PROMPT,
        mensajeUsuario,
        responseSchemaPresentacion,
        { timeoutMs: TIMEOUT_MS },
      );
      proveedorUsado = proveedor;
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
      const veredicto = validarPresentacionOficial(r.pres, fuenteOficial);
      if (veredicto.desviaciones.length) {
        console.warn(
          `Presentación IA (${programa.clave} U${unidad.numero}) intento ${intento}:\n${resumirVeredicto(veredicto)}`,
        );
      }
      // Solo las desviaciones DURAS bloquean. Una blanda (reformulación dudosa,
      // tema de otra unidad) se sirve con aviso: bloquearla rompería trabajo
      // legítimo. Una dura no se sirve NI se cachea — el cache es permanente por
      // unidad, así que un tema inventado quedaría fijado para todos los docentes.
      if (veredicto.estado === "desviaciones") {
        motivo = "curriculo_desviado";
        ultimoVeredicto = veredicto;
        continue;
      }
      veredictoServido = veredicto;
      validado = r.pres;
    } catch (e) {
      motivo =
        e instanceof Error && e.message === "timeout" ? "timeout" : "fallo_ia";
      console.error(`Error generando presentación con IA (intento ${intento}):`, e);
    }
  }

  if (!validado) {
    if (motivo === "curriculo_desviado") {
      return Response.json(
        {
          error: "curriculo_desviado",
          mensaje:
            "La presentación generada contiene temario que no está en el programa oficial.",
          desviaciones: ultimoVeredicto?.desviaciones ?? [],
        },
        { status: 502 },
      );
    }
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

  // Guarda el guion para que esta unidad no se vuelva a pagar. Se archiva bajo
  // la identidad del proveedor que REALMENTE generó (no la del configurado):
  // así una entrada nunca se atribuye al modelo equivocado.
  await escribirCache(
    claveCache({
      modelo: generadorPresentaciones(proveedorUsado ?? proveedorPresentaciones()),
      ...alcance,
    }),
    presentacion,
  );

  await contarUso(sesionAuth.sesion, "presentaciones");
  return Response.json({
    presentacion,
    cacheado: false,
    avisos: veredictoServido?.desviaciones ?? [],
    curriculoVerificado: veredictoServido?.estado !== "sin_fuente",
  });
}
