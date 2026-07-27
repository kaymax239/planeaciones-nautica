// Endpoint de la Biblioteca de Inglés. Devuelve el resumen del corpus histórico
// (conteo, tipos y listado) leyendo el filesystem en el servidor. La interfaz de
// Inglés (componente cliente) lo consume; el navegador nunca accede al FS.
//
// Aislado del flujo PN/MN y de las presentaciones (Gemini). No genera nada.

import { BibliotecaIngles } from "../../lib/bibliotecaIngles";
import { NIVELES_CON_TEMARIO } from "../../data/temarioInglesOficial";
import { verificarAuth } from "../../lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sesionAuth = await verificarAuth(request);
  if (!sesionAuth.ok) return sesionAuth.respuesta;

  try {
    const resumen = await BibliotecaIngles.leer();
    // Niveles realmente disponibles en el índice (los que tienen planeaciones
    // históricas). La UI muestra SOLO estos: así, al subir nuevos niveles y
    // reindexar, aparecen automáticamente sin tocar el código.
    const indice = await BibliotecaIngles.leerIndice();
    const set = new Set<string>();
    for (const d of indice?.documentos ?? []) {
      if (d.nivel) set.add(d.nivel);
    }
    // Niveles nuevos con temario oficial pero sin históricas propias (p. ej. el
    // 8): se generan espejando otro nivel, así que también deben aparecer.
    for (const n of NIVELES_CON_TEMARIO) set.add(n);
    const nivelesDisponibles = [...set].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
    return Response.json({ ...resumen, nivelesDisponibles });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";
    return Response.json(
      { error: "lectura_fallida", mensaje },
      { status: 500 },
    );
  }
}
