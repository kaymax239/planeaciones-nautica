// Verificación de sesión en el SERVIDOR (segunda capa, infalsificable). Cada
// ruta de /api la usa antes de procesar: exige un ID token de Firebase válido en
// el header Authorization y comprueba SIEMPRE que el correo pertenezca al
// dominio institucional o a la lista blanca de docentes invitados. La
// restricción del cliente se puede burlar; esta no.

import { adminAuth, adminConfigurado } from "./firebaseAdmin";
import {
  DOMINIO_PERMITIDO,
  esAdminEmail,
  esDominioPermitido,
  esInvitado,
} from "../config";

export type Sesion = {
  uid: string;
  email: string;
  nombre: string;
  esAdmin: boolean;
};

export type ResultadoAuth =
  | { ok: true; sesion: Sesion }
  | { ok: false; respuesta: Response };

function json(codigo: string, mensaje: string, status: number): Response {
  return Response.json({ error: codigo, mensaje }, { status });
}

/**
 * Verifica el token de la solicitud. Devuelve la sesión o una Response de error
 * lista para retornar desde el handler (401 sin token/ token inválido; 403 si el
 * dominio no es el institucional; 503 si el servidor de auth no está configurado).
 */
export async function verificarAuth(request: Request): Promise<ResultadoAuth> {
  if (!adminConfigurado()) {
    return {
      ok: false,
      respuesta: json(
        "auth_no_configurada",
        "El servidor de autenticación no está configurado.",
        503,
      ),
    };
  }

  const header = request.headers.get("authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return {
      ok: false,
      respuesta: json("sin_token", "Falta el token de sesión.", 401),
    };
  }

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(m[1].trim());
  } catch {
    return {
      ok: false,
      respuesta: json(
        "token_invalido",
        "Sesión inválida o expirada. Vuelve a iniciar sesión.",
        401,
      ),
    };
  }

  const email = (decoded.email || "").toLowerCase();
  if (!esDominioPermitido(email) && !esInvitado(email)) {
    return {
      ok: false,
      respuesta: json(
        "dominio_no_permitido",
        `Debes usar tu correo institucional de FIDENA (@${DOMINIO_PERMITIDO}) o un correo de docente invitado registrado por la Coordinación.`,
        403,
      ),
    };
  }

  return {
    ok: true,
    sesion: {
      uid: decoded.uid,
      email,
      nombre: decoded.name || email,
      esAdmin: esAdminEmail(email),
    },
  };
}
