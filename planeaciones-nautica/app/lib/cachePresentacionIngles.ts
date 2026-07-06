// Cache en disco del guion de IA de PRESENTACIONES DE INGLÉS por
// (nivel · tema · modelo · versión). Independiente del cache de PN/MN
// (cachePresentacion.ts): tiene su propio directorio y su propia CACHE_VERSION,
// para poder invalidarlo sin afectar a las presentaciones de PN/MN.
//
// El temario por nivel es estable, así que cada (nivel, tema) se genera con
// Claude UNA sola vez y se reutiliza gratis. Guarda solo la PresentacionV2 (JSON
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
  modelo: string;
  nivel: string;
  /** undefined = nivel completo (sin enfocar en un tema). */
  tema?: string;
}

export function claveCache(d: DatosClavePresIngles): string {
  return [
    CACHE_VERSION,
    d.modelo,
    d.nivel,
    d.tema ?? "__completo__",
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
