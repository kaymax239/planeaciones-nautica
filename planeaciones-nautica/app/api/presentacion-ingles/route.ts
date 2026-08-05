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
import { bibliografiaDeNivel } from "../../lib/planeacionInglesF32.js";
import {
  NIVEL_ESPEJO,
  temarioOficialTexto,
  tieneTemarioOficial,
} from "../../data/temarioInglesOficial";
import {
  PLANEACIONES_INGLES_ALMACENADAS,
  tienePlaneacionAlmacenada,
  type PlaneacionInglesAlmacenada,
} from "../../data/inglesMaritimo";
import {
  validarPresentacionTolerante,
  type PresentacionIA,
} from "../../lib/esquemaPresentacion";
import {
  MODELO_CLAUDE,
  tieneClaveAnthropic,
  generarTextoClaude,
  extraerJSON,
} from "../../lib/claudeIA";
import {
  claveCache,
  leerCache,
  escribirCache,
} from "../../lib/cachePresentacionIngles";
import type {
  DiapositivaV2,
  PresentacionV2,
} from "../../data/presentaciones/tiposV2";
import { verificarAuth } from "../../lib/server/auth";
import { verificarLimite, contarUso } from "../../lib/server/limites";

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
  /** Si es true, ignora el cache y regenera con IA. */
  forzar?: boolean;
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

/** Trozo de nombre de archivo derivado del tema (ASCII, sin espacios). */
const sufijoArchivo = (s: string) =>
  sinAcentos(s)
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "tema";

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

// Reglas compartidas por los dos moldes de prompt (históricas y almacenado).
// Se extrajeron TAL CUAL del prompt original: el molde de históricas se compone
// abajo y sigue produciendo el MISMO texto que antes, byte a byte, para no
// alterar lo que ya genera Claude en los niveles 4-8.
const REGLAS_COMUNES_PROMPT = `- IDIOMA (regla dura): TODO el contenido visible de las diapositivas va en INGLÉS, sin excepción. Esto incluye kicker, subtítulo de portada, TÍTULOS de cada diapositiva, ENCABEZADOS/ETIQUETAS de sección (usa "AGENDA", "VOCABULARY", "GRAMMAR", "PRACTICE", "ASSESSMENT", "REVIEW", "EXAMPLES", etc., NUNCA "VOCABULARIO"/"GRAMÁTICA"/"AGENDA" en español), las EXPLICACIONES gramaticales, las DEFINICIONES, las INSTRUCCIONES de actividades y ejercicios, las notas y los ejemplos. NO escribas NADA en español: es una clase de inglés impartida íntegramente en inglés (English-only / immersion). Los nombres de campo del JSON ("titulo", "bloques", "tipo", etc.) permanecen igual; lo que va en inglés es su CONTENIDO de texto.
- COMPLEJIDAD POR NIVEL: adapta la dificultad del inglés al nivel indicado. Nivel 1 = principiante (vocabulario básico, oraciones cortas y simples, presente simple, instrucciones muy claras y breves). Niveles intermedios = más estructuras gramaticales y vocabulario. Niveles altos = avanzado (tiempos y estructuras complejas, vocabulario rico, consignas y textos más largos). Mantén siempre la gramática correcta y natural para un hablante nativo.
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

// Molde de los niveles que SÍ tienen planeaciones históricas (4-8). Idéntico al
// de siempre.
const SYSTEM_PROMPT = `Eres el MISMO docente de inglés de una escuela náutica mercante mexicana que redactó las planeaciones históricas. Diseñas una PRESENTACIÓN de clase (diapositivas) para un nivel, BASÁNDOTE en las planeaciones históricas reales del nivel que se te entregan. No inventas un temario nuevo: tomas los temas, vocabulario, gramática, actividades y secuencia que aparecen en esas históricas y los conviertes en diapositivas didácticas.

REGLAS:
- Trabajas POR NIVEL y por ESPEJEO: temas, contenidos, actividades y orden salen de las históricas del nivel. No inventes contenido fuera de ellas.
- Enfoque comunicativo + libro iDiscover (te doy la referencia). NO uses STCW ni programas oficiales de Piloto Naval / Máquinas Navales.
${REGLAS_COMUNES_PROMPT}`;

// Molde de los niveles ALMACENADOS (1, 2 y 3 — StartUp, Pearson). No hay
// espejeo: la fuente de los temas es la dosificación semanal oficial que se
// entrega en el mensaje. La mención a iDiscover se sustituye por una PROHIBICIÓN
// explícita: esos niveles cambiaron de libro y nombrarlo sería el libro
// equivocado en un material que se proyecta en clase.
const SYSTEM_PROMPT_ALMACENADO = `Eres el MISMO docente de inglés de una escuela náutica mercante mexicana que redactó la planeación del nivel. Diseñas una PRESENTACIÓN de clase (diapositivas) para un nivel, BASÁNDOTE en la DOSIFICACIÓN SEMANAL OFICIAL del nivel que se te entrega. No inventas un temario nuevo: tomas los temas, vocabulario, gramática, actividades y evidencias que aparecen en esa dosificación y los conviertes en diapositivas didácticas.

REGLAS:
- Trabajas POR NIVEL sobre la DOSIFICACIÓN OFICIAL: temas, contenidos, actividades y orden salen de las semanas que se te entregan. No inventes contenido fuera de ellas.
- Enfoque comunicativo + libro StartUp (Pearson) (te doy la referencia). NO uses STCW ni programas oficiales de Piloto Naval / Máquinas Navales. PROHIBIDO mencionar iDiscover o Express Publishing: este nivel cambió de libro y esa referencia sería incorrecta.
- Si una semana viene marcada como PENDIENTE, IGNÓRALA por completo: no inventes su contenido ni la conviertas en diapositiva.
${REGLAS_COMUNES_PROMPT}`;

/** Mensaje de los niveles que se espejan de las históricas (4-8).
 *
 *  `opciones` gobierna el caso del nivel NUEVO: cuando las históricas son de
 *  otro nivel (NIVEL_ESPEJO) el mensaje tiene que decirlo, y los TEMAS salen
 *  del temario oficial del nivel destino. Sin eso, el nivel 8 recibía las
 *  históricas del 7 presentadas como "las planeaciones históricas del nivel 8"
 *  y devolvía un deck del temario del 7 rotulado como Nivel 8 — el contenido
 *  del curso equivocado, proyectado en clase, sin ningún síntoma.
 *
 *  Sin `opciones` (niveles 4-7: histórica propia y sin temario configurado) el
 *  texto resultante es EL MISMO de siempre, byte a byte. */
function construirMensajeUsuario(
  nivel: string,
  tema: string,
  referencias: EntradaIndiceIngles[],
  opciones: { nivelEspejo?: string; temario?: string | null } = {},
): string {
  const nivelEspejo = opciones.nivelEspejo ?? nivel;
  const espejando = nivelEspejo !== nivel;
  const temario = opciones.temario ?? null;

  const bloques = referencias
    .map(
      (r, i) =>
        `--- REFERENCIA ${i + 1} (origen: ${r.origen}; nivel: ${r.nivel ?? "n/d"}; archivo: ${r.nombre}) ---\n${recortarReferencia(r.texto)}`,
    )
    .join("\n\n");

  const encabezado = espejando
    ? `Genera una PRESENTACIÓN de clase de Inglés del NIVEL ${nivel}. El nivel ${nivel} es NUEVO y todavía no tiene planeaciones históricas propias: las que se te entregan son del NIVEL ESPEJO ${nivelEspejo}.`
    : `Genera una PRESENTACIÓN de clase de Inglés del NIVEL ${nivel}, basada en las planeaciones históricas del nivel.`;

  const bloqueTemario = temario
    ? `TEMARIO OFICIAL DEL NIVEL ${nivel} (fuente de los TEMAS, vocabulario y gramática de las diapositivas; síguelo en orden):\n${temario}\n\n`
    : "";

  const origenTemas = temario
    ? `Los TEMAS, vocabulario y gramática salen del TEMARIO OFICIAL del nivel ${nivel} (arriba). De las planeaciones históricas ${espejando ? `del NIVEL ESPEJO ${nivelEspejo}` : `del nivel ${nivel}`} de abajo se ESPEJAN únicamente la estructura, la voz, el tipo de actividades y el formato${espejando ? `; sus temas son los del nivel ${nivelEspejo} y NO deben aparecer como temario del nivel ${nivel}` : ""}:`
    : espejando
      ? `Las planeaciones de abajo son del NIVEL ESPEJO ${nivelEspejo}: espeja su estructura, voz, tipo de actividades y formato, y ADAPTA los temas al nivel ${nivel}. No las presentes como el temario del nivel ${nivel}:`
      : `Los temas, vocabulario, gramática, actividades y secuencia se TOMAN de estas planeaciones históricas del nivel ${nivel}:`;

  const enfoque = tema
    ? `Enfoca la presentación en el tema: "${tema}" (usa el resto del nivel solo como contexto).`
    : temario
      ? "Cubre los temas principales del nivel tal como aparecen en el temario oficial."
      : "Cubre los temas principales del nivel tal como aparecen en las históricas.";

  const cierre = temario
    ? `Convierte ese contenido en diapositivas didácticas en el JSON solicitado. Sigue el TEMARIO OFICIAL del nivel ${nivel} (módulos en orden). NO uses STCW. NO inventes temas fuera del temario oficial.`
    : "Convierte ese contenido en diapositivas didácticas en el JSON solicitado. NO uses STCW. NO inventes temas fuera de las históricas.";

  // Este camino es SOLO el de las históricas (niveles 4-8), que sí son de
  // iDiscover; los niveles de StartUp se desvían antes y traen su propia
  // bibliografía. Aun así, si algún día la función no devuelve nada, la línea
  // entera se omite: una etiqueta con el hueco detrás invita al modelo a
  // rellenarlo por su cuenta.
  const bibliografia = bibliografiaDeNivel(nivel).join("\n").trim();
  const lineaBibliografia = bibliografia
    ? `Bibliografía institucional del nivel (úsala como referencia del libro): ${bibliografia}\n`
    : "";

  return `${encabezado}

${lineaBibliografia}${enfoque}

${bloqueTemario}${origenTemas}

${bloques || "(sin referencias disponibles)"}

${cierre}

RECUERDA: TODO el texto visible de las diapositivas debe estar en INGLÉS — títulos, encabezados de sección (AGENDA, VOCABULARY, GRAMMAR, PRACTICE, ASSESSMENT…), explicaciones gramaticales, instrucciones y ejemplos — con la dificultad del inglés adaptada al Nivel ${nivel}. No dejes nada en español.`;
}

/** Una semana sin contenido real no debe llegar al prompt como si fuera temario.
 *  Hoy no matchea ninguna semana: las 14 y 15 del nivel 3 ya tienen contenido
 *  definitivo. Se conserva como red para dosificaciones futuras. */
const esSemanaPendiente = (s: { contenido: string }) =>
  /^\s*PENDIENTE\b/i.test(s.contenido);

/** Dosificación oficial del nivel en texto plano para el prompt. Si `tema`
 *  coincide con el contenido de una semana (así la manda la UI, que arma las
 *  casillas con `secuenciaSemanal[].contenido`), esa semana va primero y el
 *  resto queda como contexto. */
function construirMensajeAlmacenado(
  nivel: string,
  tema: string,
  e: PlaneacionInglesAlmacenada,
): string {
  const semanas = e.secuenciaSemanal.filter((s) => !esSemanaPendiente(s));

  const enfocada = tema
    ? semanas.find((s) => s.contenido.trim() === tema.trim())
    : undefined;

  const comoTexto = (s: (typeof semanas)[number]) =>
    [
      `--- SEMANA ${s.semana} ---`,
      `Contenido: ${s.contenido}`,
      s.actividades.length ? `Actividades: ${s.actividades.join("; ")}` : "",
      s.evidencias ? `Evidencias: ${s.evidencias}` : "",
      s.recursos.length ? `Recursos: ${s.recursos.join("; ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

  const bloques = (
    enfocada ? [enfocada, ...semanas.filter((s) => s !== enfocada)] : semanas
  )
    .map(comoTexto)
    .join("\n\n");

  return `Genera una PRESENTACIÓN de clase de Inglés del NIVEL ${nivel} (${e.nombre}), basada en la dosificación semanal oficial del nivel.

Libro del nivel: ${e.libro}
Bibliografía institucional del nivel (úsala como referencia del libro): ${e.bibliografia.join(" | ")}
Enfoque: ${e.enfoque}
Objetivo general: ${e.objetivoGeneral}
${
  enfocada
    ? `Enfoca la presentación en la SEMANA ${enfocada.semana}: "${enfocada.contenido}" (usa el resto de las semanas solo como contexto).`
    : tema
      ? `Enfoca la presentación en el tema: "${tema}" (usa el resto de la dosificación solo como contexto).`
      : "Cubre los temas principales del nivel tal como aparecen en la dosificación."
}

Los temas, vocabulario, gramática, actividades y secuencia se TOMAN de esta dosificación oficial del nivel ${nivel}:

${bloques || "(sin dosificación disponible)"}

Convierte ese contenido en diapositivas didácticas en el JSON solicitado. NO uses STCW. NO inventes temas fuera de la dosificación. NO menciones iDiscover ni Express Publishing.

RECUERDA: TODO el texto visible de las diapositivas debe estar en INGLÉS — títulos, encabezados de sección (AGENDA, VOCABULARY, GRAMMAR, PRACTICE, ASSESSMENT…), explicaciones gramaticales, instrucciones y ejemplos — con la dificultad del inglés adaptada al Nivel ${nivel}. No dejes nada en español.`;
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

  const nivel = (cuerpo.nivel ?? "").toString().trim();
  const tema = (cuerpo.tema ?? "").toString().trim();
  if (!nivel) return error("faltan_datos", "Se requiere el nivel.", 400);

  // Niveles 1, 2 y 3: su contenido está ALMACENADO (cambiaron de iDiscover a
  // StartUp). No hay históricas propias del libro nuevo, así que no se espejan.
  const almacenada: PlaneacionInglesAlmacenada | null =
    tienePlaneacionAlmacenada(nivel)
      ? PLANEACIONES_INGLES_ALMACENADAS[nivel]
      : null;

  // El temario por nivel es estable: si ya generamos este nivel/tema, lo
  // servimos del cache (gratis, incluso sin API key). `forzar` lo regenera.
  // "temario" marca los niveles cuyo prompt lleva el TEMARIO OFICIAL (hoy el 8).
  // Va en la clave porque un deck del nivel 8 generado ANTES —cuando el prompt
  // presentaba las históricas del nivel 7 como si fueran el temario del 8— no
  // es la misma presentación, y servirlo del cache repetiría el error ya
  // corregido. Los niveles 4-7 no tienen temario: su clave no cambia y su cache
  // sigue siendo válido.
  const origenCache = almacenada
    ? "almacenado"
    : tieneTemarioOficial(nivel)
      ? "temario"
      : undefined;

  const claveCacheIngles = claveCache({
    modelo: MODELO_CLAUDE,
    nivel,
    tema: tema || undefined,
    origen: origenCache,
  });
  if (!cuerpo.forzar) {
    const cacheado = await leerCache(claveCacheIngles);
    if (cacheado) {
      await contarUso(sesionAuth.sesion, "presentaciones");
      return Response.json({ presentacion: cacheado, cacheado: true });
    }
  }

  // Los niveles almacenados NO leen el índice histórico: su temario sale de la
  // dosificación oficial. El desvío va antes de leerIndice() para que la ruta de
  // los niveles que sí se espejan quede intacta. Sin él, el nivel 2 daba 404
  // (no tiene históricas) y los niveles 1 y 3 generaban del libro equivocado
  // (sí las tienen, pero de iDiscover).
  let systemPrompt = SYSTEM_PROMPT;
  let mensajeUsuario: string;

  if (almacenada) {
    systemPrompt = SYSTEM_PROMPT_ALMACENADO;
    mensajeUsuario = construirMensajeAlmacenado(nivel, tema, almacenada);
  } else {
    const indice = await BibliotecaIngles.leerIndice();
    if (!indice || indice.documentos.length === 0) {
      return error(
        "sin_corpus",
        "No hay índice de planeaciones históricas de inglés.",
        503,
      );
    }

    let referencias = seleccionarReferencias(indice.documentos, nivel, tema);

    // Nivel nuevo sin históricas propias (hoy solo el 8): se toman las del nivel
    // espejo para estructura y estilo, igual que en /api/planeacion-ingles, que
    // ya usaba NIVEL_ESPEJO. Aquí faltaba, y por eso el 8 devolvía 404.
    let nivelEspejo = nivel;
    if (referencias.length === 0 && NIVEL_ESPEJO[nivel]) {
      nivelEspejo = NIVEL_ESPEJO[nivel];
      referencias = seleccionarReferencias(indice.documentos, nivelEspejo, tema);
    }

    if (referencias.length === 0) {
      const niveles = nivelesDisponibles(indice.documentos);
      return error(
        "sin_historicas_nivel",
        `No hay planeaciones históricas del nivel "${nivel}". Niveles disponibles: ${niveles.join(", ") || "ninguno"}.`,
        404,
        { nivelesDisponibles: niveles },
      );
    }

    // Los TEMAS del nivel nuevo salen de su temario oficial, no de las
    // históricas del espejo (mismo criterio que /api/planeacion-ingles:380-400).
    mensajeUsuario = construirMensajeUsuario(nivel, tema, referencias, {
      nivelEspejo,
      temario: temarioOficialTexto(nivel),
    });
  }

  if (!tieneClaveAnthropic()) {
    return error("sin_api_key", "ANTHROPIC_API_KEY no está configurada.", 503);
  }

  let validado: PresentacionIA | null = null;
  let motivo = "fallo_ia";
  for (let intento = 1; intento <= 2 && !validado; intento++) {
    try {
      const texto = await conTimeout(
        generarTextoClaude(systemPrompt, mensajeUsuario),
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
      // Mismo aviso que /api/presentacion: si la IA emite bloques o
      // diapositivas que no llegan al .pptx, tiene que quedar en el log.
      if (r.bloquesDescartados || r.diapositivasDescartadas) {
        console.warn(
          `Presentación de inglés (nivel ${nivel}): descartados ${r.bloquesDescartados} bloque(s) y ${r.diapositivasDescartadas} diapositiva(s) sin contenido válido.`,
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
      console.error(`Error generando presentación de inglés (intento ${intento}):`, e);
    }
  }

  if (!validado) {
    return error(motivo, "No se pudo generar la presentación de inglés.", 502);
  }

  const tituloUnidad = tema || `Inglés Nivel ${nivel}`;

  // El renderer despide con una frase en ESPAÑOL cuando la diapositiva de
  // cierre no trae `mensajeFinal` (y el prompt lo declara opcional). En un deck
  // English-only eso rompe la regla dura del idioma en la última diapositiva
  // que ve el grupo, así que aquí se rellena en inglés.
  const diapositivas = validado.diapositivas.map((d) =>
    d.layout === "cierre" && !d.mensajeFinal?.trim()
      ? { ...d, mensajeFinal: "Thank you!" }
      : d,
  );
  const presentacion: PresentacionV2 = {
    // Los niveles almacenados llevan su nombre institucional, el mismo que
    // firma su F-32; el resto conserva la etiqueta genérica de siempre.
    asignatura: almacenada ? almacenada.nombre : `Inglés Nivel ${nivel}`,
    clave: almacenada ? almacenada.clave : `INGLES-N${nivel}`,
    unidad: tituloUnidad,
    carrera: "Inglés — Escuela Náutica Mercante de Tampico",
    semestre: `Nivel ${nivel}`,
    tema: tema || undefined,
    kicker: validado.kicker,
    subtituloPortada: validado.subtituloPortada ?? tituloUnidad,
    // Con el nombre fijo por nivel, generar varios temas de un mismo nivel
    // descargaba N archivos llamados igual (el navegador los renumera y el aviso
    // de la UI repite el mismo nombre): el docente no puede saber cuál es cuál.
    nombreArchivo: `Presentacion_INGLES_N${nivel}${tema ? `_${sufijoArchivo(tema)}` : ""}.pptx`,
    diapositivas: diapositivas as DiapositivaV2[],
  };

  // Guarda el guion para que este nivel/tema no se vuelva a pagar.
  await escribirCache(claveCacheIngles, presentacion);

  await contarUso(sesionAuth.sesion, "presentaciones");
  return Response.json({ presentacion, cacheado: false });
}
