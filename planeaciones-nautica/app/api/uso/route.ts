// Devuelve el consumo del mes actual del docente autenticado y los límites, para
// mostrar "Presentaciones: 3 de 10" en la barra superior. Protegido: requiere
// sesión válida.

import { verificarAuth } from "../../lib/server/auth";
import { leerUso } from "../../lib/server/limites";
import { LIMITES } from "../../lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sesionAuth = await verificarAuth(request);
  if (!sesionAuth.ok) return sesionAuth.respuesta;

  const uso = await leerUso(sesionAuth.sesion.uid);
  return Response.json({
    uso,
    limites: LIMITES,
    esAdmin: sesionAuth.sesion.esAdmin,
    nombre: sesionAuth.sesion.nombre,
  });
}
