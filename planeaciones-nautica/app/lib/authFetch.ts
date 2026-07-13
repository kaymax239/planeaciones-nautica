// Helper de CLIENTE: envuelve fetch para adjuntar el ID token de Firebase del
// usuario actual en el header Authorization. Todas las llamadas a /api/* deben
// usarlo para que el servidor pueda verificar la sesión.

import { auth } from "./firebaseClient";

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const usuario = auth?.currentUser ?? null;
  const token = usuario ? await usuario.getIdToken() : null;

  const headers = new Headers(init.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, { ...init, headers });
}
