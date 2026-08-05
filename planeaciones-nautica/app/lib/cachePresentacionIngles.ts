// Cache en disco del guion de IA de PRESENTACIONES DE INGLÉS por
// (nivel · tema · modelo · versión). Independiente del cache de PN/MN
// (cachePresentacion.ts): tiene su propio directorio y su propia CACHE_VERSION,
// para poder invalidarlo sin afectar a las presentaciones de PN/MN.
//
// El temario por nivel es estable, así que cada (nivel, tema) se genera con IA
// UNA sola vez y se reutiliza gratis. Guarda solo la PresentacionV2 (JSON
// pequeño); el .pptx se sigue renderizando bajo demanda en el navegador.
//
// Persiste entre reinicios donde el disco persista (local / `next start`). En
// Vercel el FS del proyecto es de solo lectura y /tmp es efímero: ahí el cache
// solo dura la vida de la instancia.

import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { createHash } from "crypto";
import type { PresentacionV2 } from "../data/presentaciones/tiposV2";

const CACHE_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "presentaciones-ingles-cache")
  : path.join(process.cwd(), ".presentaciones-ingles-cache");

// Súbela si cambias el prompt o el esquema: invalida las entradas anteriores
// (cambia el hash del archivo), evitando servir guiones viejos. Es INDEPENDIENTE
// de la versión del cache de PN/MN (cachePresentacion.ts).
export const CACHE_VERSION = "v1";

export interface DatosClavePresIngles {
  /** Identidad del GENERADOR: `<proveedor>:<modelo>` para Gemini y el nombre de
   *  modelo pelado para Claude (así las entradas ya guardadas siguen valiendo).
   *  Va en la clave para que cambiar de proveedor NO sirva un guion generado por
   *  el otro: son modelos distintos y el deck no es el mismo. */
  modelo: string;
  nivel: string;
  /** undefined = nivel completo (sin enfocar en un tema). */
  tema?: string;
  /** Fuente del contenido: "almacenado" para los niveles servidos desde la
   *  dosificación oficial (1, 2 y 3 — StartUp). Se omite en los niveles que se
   *  espejan de las históricas, para no invalidar sus entradas ya guardadas.
   *  Existe porque un mismo (nivel, tema) generado desde históricas de iDiscover
   *  y desde la dosificación de StartUp NO es la misma presentación. */
  origen?: string;
}

export function claveCache(d: DatosClavePresIngles): string {
  return [
    CACHE_VERSION,
    d.modelo,
    d.nivel,
    d.tema ?? "__completo__",
    ...(d.origen ? [d.origen] : []),
  ].join("|");
}

function archivoDeClave(clave: string): string {
  const hash = createHash("sha1").update(clave).digest("hex").slice(0, 32);
  return path.join(CACHE_DIR, `${hash}.json`);
}

/** Devuelve la presentación cacheada, o null si no existe / no se puede leer. */
export async function leerCache(clave: string): Promise<PresentacionV2 | null> {
  try {
    const txt = await fs.readFile(archivoDeClave(clave), "utf8");
    return JSON.parse(txt) as PresentacionV2;
  } catch {
    return null;
  }
}

/**
 * Primera entrada disponible entre varias claves, en orden de preferencia.
 *
 * Existe por el fallback de proveedor: con Gemini configurado, la cadena real
 * es [gemini, claude]. Si Gemini está sin cuota, TODAS las generaciones acaban
 * en Claude y se guardan bajo la clave de Claude; consultando solo la de Gemini
 * el cache no acertaría nunca y cada docente volvería a pagar el mismo nivel.
 * Se consultan las claves en el MISMO orden en que se intentarían los
 * proveedores, así que la del proveedor configurado siempre gana.
 */
export async function leerCachePrimero(
  claves: string[],
): Promise<PresentacionV2 | null> {
  for (const clave of claves) {
    const pres = await leerCache(clave);
    if (pres) return pres;
  }
  return null;
}

/** Guarda la presentación. Nunca lanza: si falla, solo registra el aviso. */
export async function escribirCache(
  clave: string,
  pres: PresentacionV2,
): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(archivoDeClave(clave), JSON.stringify(pres), "utf8");
  } catch (e) {
    console.warn("No se pudo escribir el cache de presentaciones de Inglés:", e);
  }
}
