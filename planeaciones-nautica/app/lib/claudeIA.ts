// Cliente IA de Claude (Anthropic) para el servidor. Punto único donde vive la
// clave ANTHROPIC_API_KEY. Reemplaza a Gemini en las rutas de presentaciones
// (el plan gratuito de Gemini limitaba a 0 el modelo pro → error 429).
//
// La clave nunca llega al navegador: solo se usa en Route Handlers (servidor).

import Anthropic from "@anthropic-ai/sdk";

// Modelo por defecto: el más capaz de Anthropic. Configurable por entorno sin
// tocar código (p. ej. para bajar de tier o fijar una versión concreta).
export const MODELO_CLAUDE = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

/** true si la clave de Anthropic está configurada en el entorno del servidor. */
export function tieneClaveAnthropic(): boolean {
  return (
    typeof process.env.ANTHROPIC_API_KEY === "string" &&
    process.env.ANTHROPIC_API_KEY.trim().length > 0
  );
}

/**
 * Genera texto con Claude a partir de un system prompt + un mensaje de usuario.
 * Usa streaming (get de finalMessage) para no chocar con los timeouts de HTTP
 * en respuestas largas (los guiones de presentaciones pueden ser extensos).
 * Devuelve el texto concatenado de los bloques de texto de la respuesta.
 */
export async function generarTextoClaude(
  system: string,
  mensaje: string,
  maxTokens = 32000,
): Promise<string> {
  const client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno
  const stream = client.messages.stream({
    model: MODELO_CLAUDE,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: mensaje }],
  });
  const message = await stream.finalMessage();
  return message.content
    .filter((bloque): bloque is Anthropic.TextBlock => bloque.type === "text")
    .map((bloque) => bloque.text)
    .join("");
}

/**
 * Aísla el objeto JSON de una respuesta: quita ```json ... ``` y texto sobrante,
 * quedándose con el primer "{" hasta el último "}". Tolerante a que el modelo
 * añada prosa antes o después del JSON.
 */
export function extraerJSON(texto: string): string {
  let t = texto.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const ini = t.indexOf("{");
  const fin = t.lastIndexOf("}");
  if (ini !== -1 && fin !== -1 && fin > ini) t = t.slice(ini, fin + 1);
  return t;
}
