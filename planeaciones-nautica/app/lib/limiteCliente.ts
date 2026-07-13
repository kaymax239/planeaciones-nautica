// Ayuda de CLIENTE para el límite mensual. Cuando el servidor responde 429, se
// lanza un LimiteError con el mensaje exacto para mostrarlo al docente (en lugar
// de caer al generador determinista o mostrar un error genérico).

export class LimiteError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "LimiteError";
  }
}

/** Lanza LimiteError si la respuesta es 429; en cualquier otro caso no hace nada. */
export async function lanzarSiLimite(res: Response): Promise<void> {
  if (res.status !== 429) return;
  const data = await res.json().catch(() => null);
  const mensaje =
    data && typeof data.mensaje === "string" && data.mensaje
      ? data.mensaje
      : "Alcanzaste tu límite mensual de uso.";
  throw new LimiteError(mensaje);
}
