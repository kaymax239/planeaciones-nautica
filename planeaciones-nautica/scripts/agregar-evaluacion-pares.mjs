// Añade el campo `evaluacion` (criterios + % + instrumento) a los programas ya
// generados en _generados-pares/, extrayéndolo del textoCompletoRedactado del
// corpus (F-32 Enero–Junio 2026). REESTRUCTURA, NO INVENTA.
//
// CANDADOS (acordados con el usuario):
//  1. Validación post-extracción: si los % no suman EXACTAMENTE 100, o algún
//     criterio quedó sin %, NO se guarda `evaluacion`; la materia va a
//     PENDIENTES.md con lo que devolvió la IA. Prohibido redondear/ajustar.
//  2. Prompt estricto: extraer criterio+%+instrumento TAL CUAL aparecen. Si el
//     documento no tiene tabla de evaluación o es ilegible → devolver null.
//  3. Al terminar: resumen (válidas / pendientes / sin-tabla) y _index.json con
//     columna `eval` por materia.
//
// Uso:
//   node scripts/agregar-evaluacion-pares.mjs            (las 62)
//   node scripts/agregar-evaluacion-pares.mjs --limite=5 (prueba)
//   node scripts/agregar-evaluacion-pares.mjs --force    (rehace las que ya tienen evaluacion)

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..");
const DIR_CORPUS = path.join(RAIZ, "app", "data", "planeaciones-historicas", "corpus");
const DIR_SALIDA = path.join(RAIZ, "app", "data", "contenidos", "_generados-pares");
const INDEX = path.join(DIR_SALIDA, "_index.json");
const PENDIENTES = path.join(DIR_SALIDA, "PENDIENTES.md");

const MODELO = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const CONCURRENCIA = 3;
const REINTENTOS = 2;
const FORCE = process.argv.includes("--force");
const LIMITE = Number((process.argv.find((a) => a.startsWith("--limite=")) || "").split("=")[1]) || Infinity;

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
Tu ÚNICA tarea es EXTRAER los CRITERIOS DE EVALUACIÓN de una planeación
didáctica F-32 ya existente. NO hay una tabla estándar: cada materia tiene sus
propios criterios y porcentajes, y varían según sea teórica, práctica o mixta.
La evaluación suele organizarse POR PARCIAL (1er Parcial, 2do Parcial, ...),
y CADA parcial suele sumar 100% por separado, con distribuciones que pueden
DIFERIR entre parciales.

Reglas ESTRICTAS (obligatorias):
- Usa EXCLUSIVAMENTE lo que aparece literalmente en ESTE texto fuente.
- PROHIBIDO inventar, completar, inferir o redondear criterios, % o instrumentos.
- PROHIBIDO copiar la distribución de un parcial a otro: extrae cada parcial de
  SU propio texto. Nunca asumas que el 2do parcial = el 1er parcial.
- PROHIBIDO homologar nombres: copia el criterio y el instrumento TAL CUAL
  aparecen (examen/portafolio/práctica/proyecto/cuestionario/etc.).
- Si un parcial se menciona pero su tabla está incompleta o ilegible, devuelve
  ese parcial con "criterios": null (NO lo completes con un patrón "típico").
- Si el documento NO contiene ninguna tabla/desglose de evaluación con %,
  devuelve {"evaluacion": null}.
- NO ajustes los porcentajes para que sumen 100. Devuélvelos como están.
Responde SOLO con un objeto JSON válido, sin explicaciones ni markdown.`;

function construirMensaje(materia, tipo, texto) {
  return `MATERIA: ${materia}
TIPO (referencia): ${tipo || "(desconocido)"}

Extrae la EVALUACIÓN del siguiente texto F-32. Devuelve EXACTAMENTE esta forma:
{
  "evaluacion": {
    "parciales": [
      {
        "nombre": string,                 // p. ej. "1er Parcial" (como aparezca)
        "criterios": [                     // o null si el parcial está incompleto/ilegible
          { "criterio": string, "peso": number, "instrumento": string|null }
        ]
      }
    ]
  }
}
Donde "peso" es el porcentaje numérico (sin el signo %) TAL COMO aparece en ese
parcial. Incluye un objeto por cada parcial que aparezca. Si un parcial está
incompleto → "criterios": null. Si NO hay ninguna tabla de evaluación con % →
devuelve { "evaluacion": null }. NO copies entre parciales ni entre materias.

TEXTO FUENTE (F-32 2026; PII redactada como [REDACTADO]/[FECHA]):
"""
${(texto || "").slice(0, 26000)}
"""`;
}

// Devuelve { estado, evaluacion?, raw?, motivo? } — estado: "valida" | "pendiente" | "sin-tabla" | "error"
function validar(obj) {
  if (!obj || typeof obj !== "object" || !("evaluacion" in obj)) return { estado: "error", raw: obj };
  const ev = obj.evaluacion;
  if (ev === null) return { estado: "sin-tabla" };
  if (typeof ev !== "object" || !Array.isArray(ev.parciales) || ev.parciales.length === 0)
    return { estado: "pendiente", raw: obj, motivo: "sin arreglo parciales" };

  const parcialesOk = [];
  for (const par of ev.parciales) {
    const nombre = par?.nombre || `Parcial ${parcialesOk.length + 1}`;
    if (!par || par.criterios === null)
      return { estado: "pendiente", raw: obj, motivo: `parcial "${nombre}" incompleto (null)` };
    if (!Array.isArray(par.criterios) || par.criterios.length === 0)
      return { estado: "pendiente", raw: obj, motivo: `parcial "${nombre}" sin criterios` };
    let suma = 0;
    for (const c of par.criterios) {
      let p = c?.peso;
      if (typeof p === "string") p = Number(p.replace(/[^0-9.]/g, "")); // "20%"->20 (parseo, no ajuste)
      if (typeof p !== "number" || !isFinite(p) || p <= 0)
        return { estado: "pendiente", raw: obj, motivo: `parcial "${nombre}": criterio sin % válido ("${c?.criterio}")` };
      c.peso = p;
      suma += p;
    }
    // cada parcial debe sumar EXACTAMENTE 100 (prohibido redondear para forzarlo)
    if (Math.abs(suma - 100) > 1e-9)
      return { estado: "pendiente", raw: obj, motivo: `parcial "${nombre}" suma ${suma}, no 100` };
    parcialesOk.push({ nombre, criterios: par.criterios, suma: 100 });
  }

  return {
    estado: "valida",
    evaluacion: { parciales: parcialesOk, fuente: "F-32-2026 (extraído por IA, sin inventar)" },
  };
}

async function extraerUno(client, materia, tipo, texto) {
  const mensaje = construirMensaje(materia, tipo, texto);
  let ultimoError = "fallo";
  for (let intento = 1; intento <= REINTENTOS + 1; intento++) {
    try {
      const stream = client.messages.stream({
        model: MODELO,
        max_tokens: 4000,
        system: SYSTEM,
        messages: [{ role: "user", content: mensaje }],
      });
      const msg = await stream.finalMessage();
      const t = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const obj = JSON.parse(extraerJSON(t));
      return validar(obj);
    } catch (e) {
      ultimoError = e?.message || String(e);
      await new Promise((r) => setTimeout(r, 1500 * intento));
    }
  }
  return { estado: "error", motivo: ultimoError };
}

async function main() {
  await cargarEnvLocal();
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    console.error("\nFALTA ANTHROPIC_API_KEY en .env.local\n");
    process.exit(2);
  }

  // Índice corpus por PDF fuente -> textoCompletoRedactado
  const corpusFiles = (await fs.readdir(DIR_CORPUS)).filter((f) => f.endsWith(".json"));
  const byPdf = new Map();
  for (const cf of corpusFiles) {
    const o = JSON.parse(await fs.readFile(path.join(DIR_CORPUS, cf), "utf8"));
    const pdf = o?.origen?.archivo;
    if (!pdf) continue;
    if (!byPdf.has(pdf)) byPdf.set(pdf, []);
    byPdf.get(pdf).push(o);
  }

  const genFiles = (await fs.readdir(DIR_SALIDA))
    .filter((f) => f.endsWith(".json") && f !== "_index.json")
    .sort();
  const objetivo = genFiles.slice(0, LIMITE);
  console.log(`Materias a procesar: ${objetivo.length}${LIMITE < Infinity ? ` (limitado de ${genFiles.length})` : ` de ${genFiles.length}`}`);
  console.log(`Modelo: ${MODELO} | concurrencia: ${CONCURRENCIA} | force: ${FORCE}\n`);

  const client = new Anthropic();
  const resultados = new Map(); // archivo -> estado
  const pendientes = []; // { archivo, materia, motivo, raw }
  const metaValidas = []; // { archivo, materia, tipo, parciales } para el resumen por patrón

  let cursor = 0;
  async function worker() {
    while (cursor < objetivo.length) {
      const gf = objetivo[cursor++];
      const gpath = path.join(DIR_SALIDA, gf);
      const g = JSON.parse(await fs.readFile(gpath, "utf8"));
      if (!FORCE && g.evaluacion) {
        resultados.set(gf, "ya-tenia");
        console.log(`  [skip] ${gf}`);
        continue;
      }
      const pdf = g.__origen?.archivoFuente || g.fuente;
      const corpus = (byPdf.get(pdf) || []).find((o) => o.textoCompletoRedactado) || (byPdf.get(pdf) || [])[0];
      const texto = corpus?.textoCompletoRedactado || corpus?.textoReferenciaRedactado || "";
      if (!texto) {
        resultados.set(gf, "sin-tabla");
        pendientes.push({ archivo: gf, materia: g.nombre, motivo: "sin texto fuente en corpus", raw: null });
        console.log(`  [no-src] ${gf}`);
        continue;
      }
      const r = await extraerUno(client, g.nombre, g.tipo, texto);
      if (r.estado === "valida") {
        g.evaluacion = r.evaluacion;
        await fs.writeFile(gpath, JSON.stringify(g, null, 2), "utf8");
        resultados.set(gf, "valida");
        metaValidas.push({ archivo: gf, materia: g.nombre, tipo: g.tipo || "?", parciales: r.evaluacion.parciales });
        const dist = r.evaluacion.parciales.map((p) => `${p.nombre}: ${p.criterios.map((c) => c.peso).join("/")}`).join(" · ");
        console.log(`  [ok]   ${gf} → ${r.evaluacion.parciales.length} parcial(es) [${dist}]`);
      } else if (r.estado === "sin-tabla") {
        resultados.set(gf, "sin-tabla");
        pendientes.push({ archivo: gf, materia: g.nombre, motivo: "IA no halló tabla de evaluación (null)", raw: null });
        console.log(`  [null] ${gf} → sin tabla`);
      } else {
        resultados.set(gf, "pendiente");
        pendientes.push({ archivo: gf, materia: g.nombre, motivo: r.motivo || r.estado, raw: r.raw });
        console.log(`  [PEND] ${gf} → ${r.motivo || r.estado}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCIA }, () => worker()));

  // PENDIENTES.md
  if (pendientes.length) {
    let md = `# PENDIENTES — Evaluación (captura/revisión manual)\n\n`;
    md += `Generado por \`scripts/agregar-evaluacion-pares.mjs\`. Estas materias NO recibieron\n`;
    md += `campo \`evaluacion\` porque los % no sumaban 100, faltaba %, o no había tabla.\n`;
    md += `Los porcentajes NO se ajustaron para forzar la suma.\n\n`;
    for (const p of pendientes) {
      md += `## ${p.materia}\n`;
      md += `- archivo: \`${p.archivo}\`\n`;
      md += `- motivo: ${p.motivo}\n`;
      if (p.raw) md += `- lo que devolvió la IA (revisar a mano):\n\n\`\`\`json\n${JSON.stringify(p.raw.evaluacion ?? p.raw, null, 2)}\n\`\`\`\n`;
      md += `\n`;
    }
    await fs.writeFile(PENDIENTES, md, "utf8");
  }

  // Actualiza _index.json con columna eval
  const index = JSON.parse(await fs.readFile(INDEX, "utf8"));
  for (const m of index.materias) {
    const st = resultados.get(m.archivo);
    if (st) m.eval = st === "ya-tenia" ? "valida" : st;
  }
  index.evalResumen = {
    validas: [...resultados.values()].filter((v) => v === "valida" || v === "ya-tenia").length,
    pendientes: [...resultados.values()].filter((v) => v === "pendiente").length,
    sinTabla: [...resultados.values()].filter((v) => v === "sin-tabla").length,
  };
  await fs.writeFile(INDEX, JSON.stringify(index, null, 2), "utf8");

  const val = index.evalResumen;
  console.log(`\n=== RESUMEN EVALUACIÓN ===`);
  console.log(`Válidas (cada parcial suma 100, guardadas): ${val.validas}`);
  console.log(`A PENDIENTES (algún parcial ≠100 o sin %): ${val.pendientes}`);
  console.log(`Sin tabla (IA devolvió null): ${val.sinTabla}`);
  if (pendientes.length) console.log(`PENDIENTES.md: ${path.relative(RAIZ, PENDIENTES)}`);

  // Resumen por PATRÓN de evaluación (tipo de materia) para revisión de coherencia.
  const esIngles = (m) => /ingl[eé]s|maritime english/i.test(m);
  const patron = (mv) => (esIngles(mv.materia) ? "Inglés" : (mv.tipo || "Sin tipo"));
  const grupos = new Map();
  for (const mv of metaValidas) {
    const k = patron(mv);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(mv);
  }
  console.log(`\n=== VÁLIDAS POR PATRÓN (revisa coherencia con el tipo) ===`);
  for (const [k, arr] of [...grupos].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n▸ ${k} (${arr.length})`);
    for (const mv of arr.sort((a, b) => a.materia.localeCompare(b.materia))) {
      const dist = mv.parciales
        .map((p) => `${p.nombre}=${p.criterios.map((c) => c.peso).join("+")}`)
        .join(" | ");
      console.log(`   ${mv.materia}: ${dist}`);
    }
  }
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
