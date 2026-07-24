// Revisión de planeaciones con IA. Recibe el texto plano del .docx del docente
// (extraído en el cliente) y notas opcionales del revisor, y devuelve una lista
// de correcciones PUNTUALES para que el administrador apruebe o rechace.
// Solo la cuenta administradora puede usar esta ruta (se verifica en servidor).

import { verificarAuth } from "../../lib/server/auth";
import {
  generarTextoClaude,
  extraerJSON,
  tieneClaveAnthropic,
} from "../../lib/claudeIA";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Sugerencia = {
  original: string;
  sugerido: string;
  motivo: string;
  categoria?: string;
};

const SYSTEM = `Eres un revisor experto de planeaciones docentes de la Escuela Náutica Mercante de Tampico (ENMT / FIDENA). Revisas ortografía, gramática, redacción, coherencia pedagógica y formato.

Propones correcciones PUNTUALES y conservadoras: no reescribas párrafos completos si no hace falta, no cambies el sentido, no inventes contenido nuevo y respeta la terminología náutica y los formatos oficiales.

Cada corrección debe basarse en un fragmento EXACTO del texto original, copiado tal cual aparece (mismas mayúsculas, tildes y signos), en fragmentos cortos (una frase o menos) para poder localizarlos dentro del documento.

Responde ÚNICAMENTE con un objeto JSON válido con esta forma exacta:
{"sugerencias":[{"original":"fragmento exacto del texto original","sugerido":"fragmento ya corregido","motivo":"explicación breve","categoria":"ortografía|gramática|redacción|formato|contenido"}]}

Si el texto no tiene errores, responde {"sugerencias":[]}.`;

export async function POST(request: Request) {
  const auth = await verificarAuth(request);
  if (!auth.ok) return auth.respuesta;

  if (!auth.sesion.esAdmin) {
    return Response.json(
      { error: "no_admin", mensaje: "Acceso solo para el administrador." },
      { status: 403 },
    );
  }

  if (!tieneClaveAnthropic()) {
    return Response.json(
      {
        error: "sin_ia",
        mensaje: "Falta configurar ANTHROPIC_API_KEY en el servidor.",
      },
      { status: 503 },
    );
  }

  let body: { texto?: string; notas?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "json_invalido", mensaje: "Cuerpo de la solicitud inválido." },
      { status: 400 },
    );
  }

  const texto = (body.texto || "").trim();
  const notas = (body.notas || "").trim();

  if (texto.length < 20) {
    return Response.json(
      {
        error: "texto_corto",
        mensaje: "El documento no tiene texto suficiente para analizar.",
      },
      { status: 400 },
    );
  }

  const contextoNotas = notas
    ? `\n\nErrores o sugerencias señalados por el revisor (dales prioridad):\n${notas}`
    : "";
  const mensaje = `Planeación a revisar:\n"""\n${texto}\n"""${contextoNotas}`;

  let jsonTexto: string;
  try {
    const salida = await generarTextoClaude(SYSTEM, mensaje, 8000);
    jsonTexto = extraerJSON(salida);
  } catch {
    return Response.json(
      {
        error: "ia_error",
        mensaje: "La IA no pudo procesar el documento. Intenta de nuevo.",
      },
      { status: 502 },
    );
  }

  let parsed: { sugerencias?: Sugerencia[] };
  try {
    parsed = JSON.parse(jsonTexto);
  } catch {
    return Response.json(
      {
        error: "ia_formato",
        mensaje: "La IA devolvió un formato inesperado. Intenta de nuevo.",
      },
      { status: 502 },
    );
  }

  const sugerencias = Array.isArray(parsed.sugerencias)
    ? parsed.sugerencias.filter(
        (s) =>
          s &&
          typeof s.original === "string" &&
          typeof s.sugerido === "string" &&
          s.original.length > 0,
      )
    : [];

  return Response.json({ sugerencias });
}
