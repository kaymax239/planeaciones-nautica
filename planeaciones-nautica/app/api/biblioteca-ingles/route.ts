// Endpoint de la Biblioteca de Inglés. Devuelve el resumen del corpus histórico
// (conteo, tipos y listado) leyendo el filesystem en el servidor. La interfaz de
// Inglés (componente cliente) lo consume; el navegador nunca accede al FS.
//
// Aislado del flujo PN/MN y de las presentaciones (Gemini). No genera nada.

import { BibliotecaIngles } from "../../lib/bibliotecaIngles";
import { NIVELES_CON_TEMARIO } from "../../data/temarioInglesOficial";
import { NIVELES_ALMACENADOS } from "../../data/inglesMaritimo";
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
    // Niveles con planeación almacenada. Sin esto, un nivel que solo existe en
    // PLANEACIONES_INGLES_ALMACENADAS jamás aparecería en el selector: es el
    // caso de VII, que no tiene históricas indexadas ni temario oficial. Para
    // 1/2/3 es no-op, ya entran por las otras dos fuentes; el Set deduplica.
    for (const n of NIVELES_ALMACENADOS) set.add(n);

    // Orden explícito: primero los numerados por VALOR (1..8), después los no
    // numéricos (VII) alfabéticamente. Antes se ordenaba con localeCompare
    // numérico y locale del host: daba el mismo resultado, pero por un detalle
    // de la collation ICU (los dígitos van antes que las letras), no porque el
    // código lo dijera. Con locale fijo el orden tampoco depende de la máquina.
    const esNumerico = (s: string) =>
      s.trim() !== "" && Number.isFinite(Number(s));
    const nivelesDisponibles = [...set].sort((a, b) => {
      const an = esNumerico(a);
      const bn = esNumerico(b);
      if (an && bn) return Number(a) - Number(b);
      if (an) return -1;
      if (bn) return 1;
      return a.localeCompare(b, "es");
    });
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
