// Helper de CLIENTE: pide a /api/examen las preguntas generadas por IA (Gemini).
// Devuelve los 4 bloques ya formateados, o `undefined` si la IA no está
// disponible / falla / hay timeout — en cuyo caso el llamador cae al banco
// determinista (construirPreguntasExamen). Nunca lanza.
//
// Solo importa el TIPO (se borra en compilación), así que no arrastra el SDK de
// Gemini al bundle del navegador.

import type { PreguntasExamen } from "./examen";
import { authFetch } from "./authFetch";
import { lanzarSiLimite, LimiteError } from "./limiteCliente";

export type AmbitoExamen = "PN" | "MN" | "INGLES";

export async function pedirPreguntasExamenIA(params: {
  ambito: AmbitoExamen;
  materia: string;
  tipo: string;
  temas: string[];
  /** Valor total del examen en puntos (para el puntaje por sección). */
  total?: number;
  /** Solo Inglés: habilidad del examen (Gram/Vocab, Listening, …). */
  habilidad?: string;
  /** Solo Inglés: nivel ("1".."8", "MN1"); define la extensión del Writing. */
  nivel?: string;
}): Promise<PreguntasExamen | undefined> {
  // Sin temas no hay nada que pedir: fallback directo al determinista.
  if (!params.materia || params.temas.length === 0) return undefined;
  try {
    const controlador = new AbortController();
    const limite = setTimeout(() => controlador.abort(), 120000);
    try {
      const res = await authFetch("/api/examen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: controlador.signal,
      });
      // Límite mensual alcanzado: propaga el mensaje al llamador (no cae al
      // banco determinista).
      await lanzarSiLimite(res);
      if (!res.ok) return undefined;
      const data = (await res.json().catch(() => null)) as {
        preguntas?: PreguntasExamen | null;
      } | null;
      return data?.preguntas ?? undefined;
    } finally {
      clearTimeout(limite);
    }
  } catch (e) {
    if (e instanceof LimiteError) throw e;
    return undefined;
  }
}
