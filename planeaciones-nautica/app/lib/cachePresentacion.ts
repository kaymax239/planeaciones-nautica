// Cache en disco del guion de IA por (carrera · materia · unidad · tema · modelo).
//
// El currículo es fijo, así que cada unidad se genera con IA UNA sola vez y se
// reutiliza gratis. Guardamos un JSON pequeño (la PresentacionV2), NO archivos
// PPTX: el .pptx se sigue renderizando bajo demanda en el navegador.
//
// Persiste entre reinicios mientras el disco persista (p. ej. `next start` en tu
// equipo o un servidor con almacenamiento). En despliegues efímeros (Vercel) el
// disco no persiste; ahí el cache solo dura la vida de la instancia.

import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { createHash } from "crypto";
import type { PresentacionV2 } from "../data/presentaciones/tiposV2";

// En Vercel el filesystem del proyecto es de solo lectura; solo /tmp permite
// escritura (y es efímero: dura lo que viva la instancia). En local usamos un
// directorio del proyecto, que persiste entre reinicios.
const CACHE_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "presentaciones-cache")
  : path.join(process.cwd(), ".presentaciones-cache");

// Súbela si cambias el prompt o el esquema: invalida las entradas anteriores
// (cambia el hash del archivo), evitando servir guiones viejos.
export const CACHE_VERSION = "v1";

export type DatosClave = {
  /** Identidad del GENERADOR: `<proveedor>:<modelo>` para Gemini y el nombre de
   *  modelo pelado para Claude (así las entradas ya guardadas siguen valiendo).
   *  Va en la clave para que cambiar de proveedor NO sirva un guion generado por
   *  el otro: son modelos distintos y el deck no es el mismo. */
  modelo: string;
  carrera: string;
  materia: string;
  unidadNumero: number;
  tema?: string; // undefined = unidad completa
};

export function claveCache(d: DatosClave): string {
  return [
    CACHE_VERSION,
    d.modelo,
    d.carrera,
    d.materia,
    d.unidadNumero,
    d.tema ?? "__completa__",
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
 * el cache no acertaría nunca y cada docente volvería a pagar la misma unidad.
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
    console.warn("No se pudo escribir el cache de presentaciones:", e);
  }
}
