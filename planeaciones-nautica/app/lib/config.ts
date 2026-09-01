// Configuración compartida de acceso y límites. NO contiene secretos, así que
// puede importarse tanto en el cliente como en el servidor.

/** Único dominio institucional permitido para iniciar sesión. */
export const DOMINIO_PERMITIDO = "fidena.edu.mx";

/** Cuenta administradora: sin límites y con acceso a la vista /admin. */
export const ADMIN_EMAIL = "vcadenaa@fidena.edu.mx";

/** Persona de contacto que aparece en los mensajes de límite alcanzado. */
export const CONTACTO_SOPORTE = "Ing. Víctor Cadena";

/** Categorías de uso con IA y su límite mensual por docente. */
export const LIMITES = {
  presentaciones: 10,
  examenes: 25,
  planeaciones: 25,
  worksheets: 25,
} as const;

export type CategoriaUso = keyof typeof LIMITES;

/** Etiqueta legible (femenina/plural) de cada categoría para los mensajes. */
export const ETIQUETA_CATEGORIA: Record<CategoriaUso, string> = {
  presentaciones: "presentaciones",
  examenes: "exámenes",
  planeaciones: "planeaciones",
  worksheets: "worksheets",
};

/** ¿El correo pertenece al dominio institucional permitido? */
export function esDominioPermitido(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${DOMINIO_PERMITIDO}`);
}

/** ¿El correo es el de la cuenta administradora? */
export function esAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/** Docentes externos autorizados por la Coordinación, correo por correo. No es
 *  un dominio: cada dirección se aprueba de forma individual. Un invitado entra
 *  como docente (mismos LIMITES) y NUNCA como administrador. */
export const CORREOS_INVITADOS = [
  "kasoriano@hotmail.com",
] as const;

/** ¿El correo está en la lista blanca de docentes invitados? */
export function esInvitado(email?: string | null) {
  return !!email && CORREOS_INVITADOS.includes(
    email.toLowerCase() as (typeof CORREOS_INVITADOS)[number]
  );
}
