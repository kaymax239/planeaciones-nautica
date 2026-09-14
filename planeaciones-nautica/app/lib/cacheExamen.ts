// Cache en disco del banco de preguntas generado por IA para un examen, por
// (ámbito · materia/nivel · tipo · temas · modelo). Mismo patrón que
// cachePresentacion.ts / cachePlaneacion.ts.
//
// El temario es fijo, así que un examen del mismo alcance (mismos temas) se
// genera con IA UNA vez y se reutiliza gratis en cada descarga posterior.
// Cubre por igual las materias PN/MN y las de Inglés (el ámbito entra en la
// clave), así que las rutas de Inglés también quedan cacheadas.
//
// Persiste entre reinicios donde el disco persista (local / `next start`). En
// Vercel el FS del proyecto es de solo lectura y /tmp es efímero: ahí el cache
// solo dura la vida de la instancia.

import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { createHash } from "crypto";
import type { PreguntasExamen } from "./examen";

const CACHE_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "examenes-cache")
  : path.join(process.cwd(), ".examenes-cache");

// Súbela si cambias el prompt o el esquema: invalida entradas anteriores.
export const CACHE_VERSION = "v2"; // v2: 5 habilidades + contexto cotidiano (no náutico)

export interface DatosClaveExamen {
  modelo: string;
  /** "PN" | "MN" | "INGLES" — mantiene separados los bancos por flujo. */
  ambito: string;
  /** Materia (PN/MN) o "Inglés Nivel N". */
  materia: string;
  /** "Examen Parcial 1" | "Examen Parcial 2" | "Examen Ordinario", etc. */
  tipo: string;
  /** Temas exactos a evaluar (definen el alcance real del examen). */
  temas: string[];
  /** Valor total en puntos (define el puntaje por sección/pregunta baked-in). */
  total?: number;
}

export function claveCache(d: DatosClaveExamen): string {
  return [
    CACHE_VERSION,
    d.modelo,
    d.ambito,
    d.materia,
    d.tipo,
    d.temas.map((t) => t.trim()).join("¬"),
    d.total ?? "sin-total",
  ].join("|");
}

function archivoDeClave(clave: string): string {
  const hash = createHash("sha1").update(clave).digest("hex").slice(0, 32);
  return path.join(CACHE_DIR, `${hash}.json`);
}

/** Devuelve las preguntas cacheadas, o null si no existen / no se pueden leer. */
export async function leerCache(
  clave: string,
): Promise<PreguntasExamen | null> {
  try {
    const txt = await fs.readFile(archivoDeClave(clave), "utf8");
    return JSON.parse(txt) as PreguntasExamen;
  } catch {
    return null;
  }
}

/** Guarda las preguntas. Nunca lanza: si falla, solo registra el aviso. */
export async function escribirCache(
  clave: string,
  preguntas: PreguntasExamen,
): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(archivoDeClave(clave), JSON.stringify(preguntas), "utf8");
  } catch (e) {
    console.warn("No se pudo escribir el cache de exámenes:", e);
  }
}
