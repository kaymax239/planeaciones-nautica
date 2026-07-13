// Genera los PROGRAMAS OFICIALES de semestres PARES (2,4,6,8) a partir de las
// planeaciones F-32 del ciclo Enero–Junio 2026 ya extraídas al corpus.
//
// Usa Claude (ANTHROPIC_API_KEY) para REESTRUCTURAR (no inventar) el contenido
// de cada F-32 al esquema `ProgramaOficial` (app/data/tipos.ts). Consolida los
// grupos A/B en un solo programa por (carrera, semestre, materia).
//
// SALIDA (para REVISIÓN — NO se integra automáticamente al generador):
//   app/data/contenidos/_generados-pares/<CARRERA>_Sem<NN>_<slug>.json
//   app/data/contenidos/_generados-pares/_index.json   (estado por materia)
//
// Procesa POR LOTES (concurrencia limitada + reintentos) para no saturar la API.
// Idempotente: omite las materias ya generadas (usa --force para rehacerlas).
//
// Uso:
//   ANTHROPIC_API_KEY=... node scripts/generar-programas-pares.mjs
//   ... node scripts/generar-programas-pares.mjs --force
//   ... node scripts/generar-programas-pares.mjs --limite=5   (prueba: solo 5)

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..");

// Carga .env.local (node plano no lo hace como Next). Solo define variables aún
// no presentes en el entorno. Formato KEY=VALUE (comillas opcionales).
async function cargarEnvLocal() {
  try {
    const txt = await fs.readFile(path.join(RAIZ, ".env.local"), "utf8");
    for (const linea of txt.split(/\r?\n/)) {
      const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || linea.trim().startsWith("#")) continue;
      const val = m[2].replace(/^["']|["']$/g, "");
      if (val && process.env[m[1]] === undefined) process.env[m[1]] = val;
    }
  } catch {}
}
const DIR_CORPUS = path.join(RAIZ, "app", "data", "planeaciones-historicas");
const DIR_SALIDA = path.join(RAIZ, "app", "data", "contenidos", "_generados-pares");

const MODELO = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const CONCURRENCIA = 3;
const REINTENTOS = 2;
const FORCE = process.argv.includes("--force");
const LIMITE = Number((process.argv.find((a) => a.startsWith("--limite=")) || "").split("=")[1]) || Infinity;

const sinAcentos = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const raizMateria = (s) =>
  sinAcentos(s)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(viii|vii|vi|iv|iii|ii|i|v|ix|x)\b/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const slugify = (s) =>
  sinAcentos(s).replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "doc";

function extraerJSON(texto) {
  let t = (texto || "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const ini = t.indexOf("{");
  const fin = t.lastIndexOf("}");
  if (ini !== -1 && fin !== -1 && fin > ini) t = t.slice(ini, fin + 1);
  return t;
}

const SYSTEM = `Eres un asistente académico de la Escuela Náutica Mercante (FIDENA).
Tu tarea es REESTRUCTURAR una planeación didáctica F-32 YA EXISTENTE al esquema
oficial "ProgramaOficial". NO inventes contenido: usa EXCLUSIVAMENTE lo que
aparece en el texto fuente. Si un dato no está, usa "Pendiente de revisión"
(texto) o 0 (números). Las fechas concretas déjalas como el literal "[FECHA]".
Conserva los subtemas VERBATIM, con su numeración (p. ej. "1.1 ..."). Responde
SOLO con un objeto JSON válido, sin explicaciones ni markdown.`;

function construirMensaje(corpus) {
  const pe = corpus.programaEspejo || {};
  const unidadesHint = (pe.unidades || [])
    .map((u) => `  U${u.numero}: ${u.tema} | subtemas: ${(u.subtemas || []).join(" · ") || "(?)"}`)
    .join("\n");
  return `MATERIA: ${corpus.materia}
CARRERA: ${corpus.carrera}  SEMESTRE: ${corpus.semestre}
CLAVE (si se conoce): ${corpus.clave || "(desconocida)"}

Devuelve un JSON con EXACTAMENTE esta forma (TypeScript ProgramaOficial):
{
  "clave": string,                // "" si no aparece
  "nombre": string,               // nombre oficial de la materia
  "tipo": string,                 // "Teórica" | "Práctica" | "Teórico-práctica"
  "horas": { "semanas": number, "porSemana": number, "teoricas": number, "practicas": number, "independientes": number, "total": number },
  "objetivoGeneral": string,
  "unidades": [ { "numero": number, "tema": string, "objetivoEspecifico": string, "subtemas": string[], "transversal": boolean } ],
  "bibliografia": string[],
  "fuente": ${JSON.stringify(corpus.origen?.archivo || corpus.materia)}
}

PISTAS de la extracción automática (best-effort; corrige/completa con el texto):
horas≈ total ${pe.horas?.total || "?"}, porSemana ${pe.horas?.porSemana || "?"}
${unidadesHint || "  (sin unidades detectadas — dedúcelas del texto)"}

TEXTO FUENTE (F-32 2026, con PII ya redactada como [REDACTADO]/[FECHA]):
"""
${(corpus.textoCompletoRedactado || corpus.textoReferenciaRedactado || "").slice(0, 26000)}
"""`;
}

function validarPrograma(o) {
  if (!o || typeof o !== "object") return "no es objeto";
  if (!Array.isArray(o.unidades)) return "sin arreglo unidades";
  if (o.unidades.length === 0) return "0 unidades";
  if (typeof o.nombre !== "string" || !o.nombre.trim()) return "sin nombre";
  return null;
}

async function generarUno(client, corpus) {
  const mensaje = construirMensaje(corpus);
  let ultimoError = "fallo";
  for (let intento = 1; intento <= REINTENTOS + 1; intento++) {
    try {
      const stream = client.messages.stream({
        model: MODELO,
        max_tokens: 16000,
        system: SYSTEM,
        messages: [{ role: "user", content: mensaje }],
      });
      const msg = await stream.finalMessage();
      const texto = msg.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");
      const obj = JSON.parse(extraerJSON(texto));
      const err = validarPrograma(obj);
      if (err) {
        ultimoError = err;
        continue;
      }
      return { ok: true, programa: obj };
    } catch (e) {
      ultimoError = e?.message || String(e);
      // Backoff simple ante rate-limit / errores transitorios.
      await new Promise((r) => setTimeout(r, 1500 * intento));
    }
  }
  return { ok: false, error: ultimoError };
}

async function main() {
  await cargarEnvLocal();
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    console.error(
      "\nFALTA ANTHROPIC_API_KEY. Configúrala en .env.local (o en el entorno) y reejecuta:\n" +
        "  ANTHROPIC_API_KEY=sk-ant-... node scripts/generar-programas-pares.mjs\n",
    );
    process.exit(2);
  }

  const manifest = JSON.parse(await fs.readFile(path.join(DIR_CORPUS, "manifest.json"), "utf8"));
  const lote = (manifest.documentos || []).filter(
    (d) => d.lote === "enero-junio-2026" && d.contenidoExtraible !== false,
  );

  // Consolida A/B por (carrera, semestre, raízMateria); elige la fuente más rica.
  const grupos = new Map();
  for (const d of lote) {
    const k = `${d.carrera}|${d.semestre}|${raizMateria(d.materia)}`;
    (grupos.get(k) || grupos.set(k, []).get(k)).push(d);
  }
  const materias = [];
  for (const [k, entradas] of grupos) {
    // Carga corpus de cada variante, elige la de mayor calidad estructural.
    const cargadas = [];
    for (const e of entradas) {
      try {
        const c = JSON.parse(await fs.readFile(path.join(DIR_CORPUS, e.corpus), "utf8"));
        cargadas.push({ e, c });
      } catch {}
    }
    if (!cargadas.length) continue;
    cargadas.sort((a, b) => {
      const q = (x) =>
        (x.c.programaEspejo?.calidad?.unidades || 0) * 10 +
        (x.c.programaEspejo?.calidad?.subtemas || 0) +
        (x.c.textoCompletoRedactado?.length || 0) / 5000;
      return q(b) - q(a);
    });
    materias.push({ k, mejor: cargadas[0].c, variantes: entradas.length });
  }

  materias.sort(
    (a, b) =>
      a.mejor.carrera.localeCompare(b.mejor.carrera) ||
      a.mejor.semestre - b.mejor.semestre ||
      a.mejor.materia.localeCompare(b.mejor.materia),
  );

  await fs.mkdir(DIR_SALIDA, { recursive: true });
  const client = new Anthropic();

  const objetivo = materias.slice(0, LIMITE);
  console.log(`Materias únicas a generar: ${materias.length}${LIMITE < Infinity ? ` (limitado a ${objetivo.length})` : ""}`);
  console.log(`Modelo: ${MODELO} | concurrencia: ${CONCURRENCIA} | force: ${FORCE}\n`);

  const indice = [];
  let hechos = 0,
    fallos = 0,
    omitidos = 0;

  // Pool de concurrencia simple.
  let cursor = 0;
  async function worker() {
    while (cursor < objetivo.length) {
      const i = cursor++;
      const m = objetivo[i];
      const c = m.mejor;
      const nombreArchivo = `${c.carrera}_Sem${String(c.semestre).padStart(2, "0")}_${slugify(c.materia)}.json`;
      const destino = path.join(DIR_SALIDA, nombreArchivo);
      if (!FORCE) {
        try {
          await fs.access(destino);
          omitidos++;
          indice.push({ materia: c.materia, carrera: c.carrera, semestre: c.semestre, archivo: nombreArchivo, estado: "omitido (ya existe)" });
          console.log(`  [skip] ${c.carrera}${c.semestre} ${c.materia}`);
          continue;
        } catch {}
      }
      const r = await generarUno(client, c);
      if (r.ok) {
        // Anota procedencia para la revisión.
        r.programa.__origen = {
          lote: "enero-junio-2026",
          archivoFuente: c.origen?.archivo,
          variantesAB: m.variantes,
          calidadExtraccion: c.programaEspejo?.calidad,
          revisar: true,
        };
        await fs.writeFile(destino, JSON.stringify(r.programa, null, 2), "utf8");
        hechos++;
        indice.push({ materia: c.materia, carrera: c.carrera, semestre: c.semestre, archivo: nombreArchivo, estado: "generado", unidades: r.programa.unidades.length });
        console.log(`  [ok]   ${c.carrera}${c.semestre} ${c.materia} → ${r.programa.unidades.length} unidades`);
      } else {
        fallos++;
        indice.push({ materia: c.materia, carrera: c.carrera, semestre: c.semestre, archivo: nombreArchivo, estado: "FALLO", error: r.error });
        console.log(`  [FALLO] ${c.carrera}${c.semestre} ${c.materia} → ${r.error}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCIA }, () => worker()));

  indice.sort((a, b) => a.carrera.localeCompare(b.carrera) || a.semestre - b.semestre || a.materia.localeCompare(b.materia));
  await fs.writeFile(
    path.join(DIR_SALIDA, "_index.json"),
    JSON.stringify({ generado: MODELO, total: indice.length, hechos, fallos, omitidos, materias: indice }, null, 2),
    "utf8",
  );

  console.log(`\n=== RESUMEN ===`);
  console.log(`Generados: ${hechos} | Fallos: ${fallos} | Omitidos: ${omitidos}`);
  console.log(`Salida (REVISAR antes de integrar): ${path.relative(RAIZ, DIR_SALIDA)}`);
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
