// Endpoint AISLADO — genera con Claude (Anthropic) el guion de una PRESENTACIÓN
// de clase de Inglés (por nivel), espejeando las planeaciones históricas reales
// del nivel (BibliotecaIngles.leerIndice()) + enfoque iDiscover. NUNCA usa STCW
// ni los programas oficiales PN/MN.
//
// Devuelve una PresentacionV2 lista para el renderer cliente (pptxOficialV2).
// La key vive SOLO aquí. No guarda archivos: se genera al hacer clic.

import {
  BibliotecaIngles,
  type EntradaIndiceIngles,
} from "../../lib/bibliotecaIngles";
import { bibliografiaIDiscover } from "../../lib/planeacionInglesF32.js";
import {
  validarPresentacionTolerante,
  type PresentacionIA,
} from "../../lib/esquemaPresentacion";
import {
  tieneClaveAnthropic,
  generarTextoClaude,
  extraerJSON,
} from "../../lib/claudeIA";
import type {
  DiapositivaV2,
  PresentacionV2,
} from "../../data/presentaciones/tiposV2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TIMEOUT_MS = 180000;

const MAX_REFERENCIAS = 3;
const MAX_CHARS_CABECERA = 12000;
const MAX_CHARS_COLA = 6000;

type Cuerpo = {
  nivel?: string;
  /** Opcional: enfoca la presentación en un tema/semana del nivel. */
  tema?: string;
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

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

function recortarReferencia(t: string): string {
  if (t.length <= MAX_CHARS_CABECERA + MAX_CHARS_COLA) return t;
  return `${t.slice(0, MAX_CHARS_CABECERA)}\n[…]\n${t.slice(t.length - MAX_CHARS_COLA)}`;
}

/** Planeaciones históricas del MISMO nivel; ordena por tema (si se da) o por las
 *  más completas. Igual criterio que /api/planeacion-ingles. */
function seleccionarReferencias(
  entradas: EntradaIndiceIngles[],
  nivel: string,
  tema: string,
): EntradaIndiceIngles[] {
  const nivelNorm = sinAcentos(nivel).toLowerCase().trim();
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
    return terminos.reduce((acc, t) => acc + (texto.includes(t) ? 1 : 0), 0);
  };

  return [...porNivel]
    .map((e) => ({ e, s: puntuar(e) }))
    .sort((a, b) => b.s - a.s || b.e.palabras - a.e.palabras)
    .slice(0, MAX_REFERENCIAS)
    .map((x) => x.e);
}

function nivelesDisponibles(entradas: EntradaIndiceIngles[]): string[] {
  const set = new Set<string>();
  for (const e of entradas) if (e.nivel) set.add(e.nivel);
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

const SYSTEM_PROMPT = `Eres el MISMO docente de inglés de una escuela náutica mercante mexicana que redactó las planeaciones históricas. Diseñas una PRESENTACIÓN de clase (diapositivas) para un nivel, BASÁNDOTE en las planeaciones históricas reales del nivel que se te entregan. No inventas un temario nuevo: tomas los temas, vocabulario, gramática, actividades y secuencia que aparecen en esas históricas y los conviertes en diapositivas didácticas.

REGLAS:
- Trabajas POR NIVEL y por ESPEJEO: temas, contenidos, actividades y orden salen de las históricas del nivel. No inventes contenido fuera de ellas.
- Enfoque comunicativo + libro iDiscover (te doy la referencia). NO uses STCW ni programas oficiales de Piloto Naval / Máquinas Navales.
- Explicaciones e instrucciones en español; los ejemplos del idioma en inglés (vocabulario, frases, mini-diálogos).
- Nada de muros de texto: prefiere tablas de vocabulario/gramática, comparaciones, mapas conceptuales, ejemplos y ejercicios.

ESTRUCTURA (en orden):
1. Portada: layout "portada" (titulo = tema del nivel; bloques []).
2. Agenda: un "mapaConceptual" con el tema al centro y los puntos a cubrir (tomados de las históricas).
3. Desarrollo: varias diapositivas de contenido con definiciones, tablas, ejemplos y comparaciones.
4. Práctica: al menos una diapositiva con actividad o preguntas ("ejercicioGuiado", "ejercicio" o "nota").
5. Evaluación: al menos una diapositiva con preguntas/ejercicios de comprensión.
6. Cierre: layout "cierre" con resumen en "bullets" (opcional "mensajeFinal").

PRESUPUESTO (16:9): 10 a 18 diapositivas. Máx 3 bloques por diapositiva. Máx 6 ítems por bloque, frases cortas (< 90 caracteres). Títulos < 60 caracteres. mapaConceptual máx 6 ramas; tabla máx 5 columnas y 6 filas.

SALIDA (obligatoria): responde SOLO con un objeto JSON válido, sin markdown:
{ "kicker": "opcional", "subtituloPortada": "opcional", "diapositivas": [ Diapositiva, ... ] }
Cada Diapositiva: { "layout":"portada"|"contenido"|"divisor"|"transicion"|"cierre" (opcional), "etiqueta":"opcional", "titulo":"requerido", "subtitulo":"opcional", "bloques":[Bloque,...], "mensajeFinal":"opcional" }
Cada Bloque es UNO de:
- {"tipo":"bullets","items":["..."]}
- {"tipo":"definicion","titulo":"...","texto":"..."}
- {"tipo":"nota","texto":"..."}
- {"tipo":"tabla","headers":["..."],"filas":[["..."]]}
- {"tipo":"proceso","etapas":["..."]}
- {"tipo":"pasos","enunciado":"...","pasos":["..."],"resultado":"opcional"}
- {"tipo":"ejemplo","enunciado":"...","pasos":["..."]}
- {"tipo":"aplicacion","titulo":"...","enunciado":"...","pasos":["..."],"resultado":"opcional"}
- {"tipo":"ejercicio","items":["..."]}
- {"tipo":"ejercicioGuiado","enunciado":"...","pista":"opcional","items":["..."]}
- {"tipo":"comparacion","izq":{"titulo":"...","items":["..."]},"der":{"titulo":"...","items":["..."]}}
- {"tipo":"flujo","nodos":["..."],"resultado":"opcional"}
- {"tipo":"mapaConceptual","centro":"...","ramas":[{"titulo":"...","detalle":"opcional"}]}
- {"tipo":"diagramaArbol","raiz":"...","ramas":[{"titulo":"...","ejemplo":"opcional"}]}
No inventes otros tipos ni campos. La portada lleva "bloques": [].`;

function construirMensajeUsuario(
  nivel: string,
  tema: string,
  referencias: EntradaIndiceIngles[],
): string {
  const bloques = referencias
    .map(
      (r, i) =>
        `--- REFERENCIA ${i + 1} (origen: ${r.origen}; nivel: ${r.nivel ?? "n/d"}; archivo: ${r.nombre}) ---\n${recortarReferencia(r.texto)}`,
    )
    .join("\n\n");

  return `Genera una PRESENTACIÓN de clase de Inglés del NIVEL ${nivel}, basada en las planeaciones históricas del nivel.

Bibliografía institucional del nivel (úsala como referencia del libro): ${bibliografiaIDiscover(nivel)}
${tema ? `Enfoca la presentación en el tema: "${tema}" (usa el resto del nivel solo como contexto).` : "Cubre los temas principales del nivel tal como aparecen en las históricas."}

Los temas, vocabulario, gramática, actividades y secuencia se TOMAN de estas planeaciones históricas del nivel ${nivel}:

${bloques || "(sin referencias disponibles)"}

Convierte ese contenido en diapositivas didácticas en el JSON solicitado. NO uses STCW. NO inventes temas fuera de las históricas.`;
}

export async function POST(request: Request) {
  let cuerpo: Cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return error("json_invalido", "Cuerpo de la solicitud inválido.", 400);
  }

  const nivel = (cuerpo.nivel ?? "").toString().trim();
  const tema = (cuerpo.tema ?? "").toString().trim();
  if (!nivel) return error("faltan_datos", "Se requiere el nivel.", 400);

  const indice = await BibliotecaIngles.leerIndice();
  if (!indice || indice.documentos.length === 0) {
    return error(
      "sin_corpus",
      "No hay índice de planeaciones históricas de inglés.",
      503,
    );
  }

  const referencias = seleccionarReferencias(indice.documentos, nivel, tema);
  if (referencias.length === 0) {
    const niveles = nivelesDisponibles(indice.documentos);
    return error(
      "sin_historicas_nivel",
      `No hay planeaciones históricas del nivel "${nivel}". Niveles disponibles: ${niveles.join(", ") || "ninguno"}.`,
      404,
      { nivelesDisponibles: niveles },
    );
  }

  if (!tieneClaveAnthropic()) {
    return error("sin_api_key", "ANTHROPIC_API_KEY no está configurada.", 503);
  }

  const mensajeUsuario = construirMensajeUsuario(nivel, tema, referencias);

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
      if (r.pres.diapositivas.length === 0) {
        motivo = "sin_diapositivas";
        continue;
      }
      validado = r.pres;
    } catch (e) {
      motivo =
        e instanceof Error && e.message === "timeout" ? "timeout" : "fallo_ia";
      console.error(`Error generando presentación de inglés (intento ${intento}):`, e);
    }
  }

  if (!validado) {
    return error(motivo, "No se pudo generar la presentación de inglés.", 502);
  }

  const tituloUnidad = tema || `Inglés Nivel ${nivel}`;
  const presentacion: PresentacionV2 = {
    asignatura: `Inglés Nivel ${nivel}`,
    clave: `INGLES-N${nivel}`,
    unidad: tituloUnidad,
    carrera: "Inglés — Escuela Náutica Mercante de Tampico",
    semestre: `Nivel ${nivel}`,
    tema: tema || undefined,
    kicker: validado.kicker,
    subtituloPortada: validado.subtituloPortada ?? tituloUnidad,
    nombreArchivo: `Presentacion_INGLES_N${nivel}.pptx`,
    diapositivas: validado.diapositivas as DiapositivaV2[],
  };

  return Response.json({ presentacion });
}
