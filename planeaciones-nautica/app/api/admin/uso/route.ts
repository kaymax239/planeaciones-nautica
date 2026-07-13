// Consumo mensual de TODOS los docentes. Solo la cuenta administradora puede
// leerlo (se verifica en el servidor, no solo en la UI).

import { verificarAuth } from "../../../lib/server/auth";
import { leerTodos, mesActual } from "../../../lib/server/limites";
import { LIMITES } from "../../../lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sesionAuth = await verificarAuth(request);
  if (!sesionAuth.ok) return sesionAuth.respuesta;

  if (!sesionAuth.sesion.esAdmin) {
    return Response.json(
      { error: "no_admin", mensaje: "Acceso solo para el administrador." },
      { status: 403 },
    );
  }

  const docentes = await leerTodos();
  return Response.json({ mes: mesActual(), docentes, limites: LIMITES });
}
