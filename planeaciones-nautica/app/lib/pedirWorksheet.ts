// Helper de CLIENTE: pide a /api/worksheet los ejercicios generados por IA para
// UNA unidad. Devuelve el worksheet ya validado por el servidor.
//
// A diferencia de `pedirPreguntasExamenIA` —que devuelve `undefined` y deja que
// el llamador caiga al banco determinista— aquí NO hay respaldo: si la IA falla
// no hay hoja que descargar, así que este helper LANZA y la pestaña muestra el
// mensaje. El 429 sigue viajando como LimiteError, igual que en el resto de la
// app.
//
// Solo importa el TIPO del worksheet (se borra en compilación), así que no
// arrastra Zod ni el SDK de Anthropic al bundle del navegador.

import type { WorksheetIA } from "./esquemaWorksheet";
import { authFetch } from "./authFetch";
import { lanzarSiLimite } from "./limiteCliente";

/** Fallo de generación con mensaje ya listo para mostrar al docente. */
export class WorksheetError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "WorksheetError";
  }
}

export type ParamsWorksheet = {
  carrera: "PN" | "MN";
  materia: string;
  semestre: string;
  unidadNumero: number;
  unidadTema: string;
  subtemas: string[];
  cantidad?: number;
};

const TIMEOUT_MS = 120000;

export async function pedirWorksheetIA(
  params: ParamsWorksheet,
): Promise<WorksheetIA> {
  const controlador = new AbortController();
  const limite = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await authFetch("/api/worksheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: controlador.signal,
    });
  } catch (e) {
    // AbortError (timeout del cliente) o red caída.
    throw new WorksheetError(
      e instanceof DOMException && e.name === "AbortError"
        ? "La generación tardó demasiado. Intenta de nuevo."
        : "No hay conexión con el servidor. Revisa tu red e intenta de nuevo.",
    );
  } finally {
    clearTimeout(limite);
  }

  // Límite mensual alcanzado: se propaga con el mensaje exacto del servidor.
  await lanzarSiLimite(res);

  const data = (await res.json().catch(() => null)) as {
    worksheet?: WorksheetIA;
    mensaje?: string;
  } | null;

  if (!res.ok || !data?.worksheet) {
    throw new WorksheetError(
      data?.mensaje ||
        "No se pudo generar la hoja de trabajo en este momento. Intenta de nuevo.",
    );
  }

  return data.worksheet;
}
