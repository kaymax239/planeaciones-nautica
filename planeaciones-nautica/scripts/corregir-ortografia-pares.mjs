// NIVEL 1 — Corrige ORTOGRAFÍA/REDACCIÓN (acentos, erratas, mayúsculas
// inconsistentes, redacción evidentemente mal escrita) en los campos de TEXTO
// de los programas de _generados-pares/. NO cambia terminología técnica náutica,
// números, estructura ni significado. Registra cada cambio en CORRECCIONES.md.
//
// SEGURIDAD:
//  - Solo se envían a la IA los campos de texto (nunca números/pesos/estructura).
//  - Se preservan los dígitos: si un valor corregido altera la secuencia de
//    números del original (p. ej. "1.1", pesos), ese cambio se RECHAZA.
//  - Se reensambla el JSON localmente; la IA nunca reescribe la estructura.
//
// Uso:
//   node scripts/corregir-ortografia-pares.mjs --limite=4   (prueba)
//   node scripts/corregir-ortografia-pares.mjs              (los 62)

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..");
const GEN = path.join(RAIZ, "app/data/contenidos/_generados-pares");
const CORR = path.join(GEN, "CORRECCIONES.md");

const MODELO = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const CONCURRENCIA = 3;
const REINTENTOS = 2;
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

function extraerJSON(t) {
  t = (t || "").trim();
  const f = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (f) t = f[1].trim();
  const i = t.indexOf("{"), j = t.lastIndexOf("}");
  return i !== -1 && j > i ? t.slice(i, j + 1) : t;
}

// Extrae los campos de texto como { clave -> {get, set, texto} }
function camposTexto(o) {
  const campos = [];
  const push = (path, get, set) => {
    const v = get();
    if (typeof v === "string" && v.trim()) campos.push({ path, get, set, texto: v });
  };
  push("nombre", () => o.nombre, (x) => (o.nombre = x));
  push("tipo", () => o.tipo, (x) => (o.tipo = x));
  push("objetivoGeneral", () => o.objetivoGeneral, (x) => (o.objetivoGeneral = x));
  (o.unidades || []).forEach((u, i) => {
    push(`unidades.${i}.tema`, () => u.tema, (x) => (u.tema = x));
    push(`unidades.${i}.objetivoEspecifico`, () => u.objetivoEspecifico, (x) => (u.objetivoEspecifico = x));
    (u.subtemas || []).forEach((s, j) => push(`unidades.${i}.subtemas.${j}`, () => u.subtemas[j], (x) => (u.subtemas[j] = x)));
  });
  (o.bibliografia || []).forEach((b, i) => push(`bibliografia.${i}`, () => o.bibliografia[i], (x) => (o.bibliografia[i] = x)));
  (o.evaluacion?.parciales || []).forEach((par, i) => {
    push(`evaluacion.parciales.${i}.nombre`, () => par.nombre, (x) => (par.nombre = x));
    (par.criterios || []).forEach((c, j) => {
      push(`evaluacion.parciales.${i}.criterios.${j}.criterio`, () => c.criterio, (x) => (c.criterio = x));
      push(`evaluacion.parciales.${i}.criterios.${j}.instrumento`, () => c.instrumento, (x) => (c.instrumento = x));
    });
  });
  return campos;
}

const digitos = (s) => (String(s).match(/\d/g) || []).join("");

// Guardián a nivel palabra: acepta un cambio SOLO si es ortografía pura
// (acentos, mayúsculas, puntuación o UNA errata de letra). Rechaza cambios de
// palabra: preposiciones (al→del), abreviaturas expandidas, palabras
// agregadas/quitadas, cambios de nombre, etc.
const soloLetras = (s) =>
  String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-zñü ]/g, " ").replace(/\s+/g, " ").trim();
function lev(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function esSoloOrtografia(antes, despues) {
  const a = soloLetras(antes), b = soloLetras(despues);
  const d = lev(a.replace(/ /g, ""), b.replace(/ /g, "")); // distancia de letras (sin espacios)
  if (d === 0) return true; // solo acentos/mayúsculas/puntuación/espacios
  const wa = a.split(" ").filter(Boolean).length, wb = b.split(" ").filter(Boolean).length;
  return d === 1 && Math.abs(wa - wb) <= 1; // 1 errata de letra (incluye unir/partir palabra)
}

const SYSTEM = `Eres corrector ORTOGRÁFICO de la Escuela Náutica Mercante (FIDENA).
Corrige ÚNICAMENTE: (a) acentos faltantes o incorrectos, (b) erratas de letras
(p. ej. "EVALUCION"→"Evaluación", "LEGILSACION"→"Legislación", "MANIOBAS"→
"Maniobras", "Meguer"→"Megger"), (c) mayúsculas inconsistentes (TODO EN
MAYÚSCULAS → Capitalización normal).
PROHIBIDO ABSOLUTO (déjalo TAL CUAL aunque suene mal):
- NO cambies NINGUNA palabra por otra (p. ej. "al"→"del", "en base a"→"con base en").
- NO expandas abreviaturas ni siglas (deja "CONV. INTAL" como está).
- NO agregues ni quites palabras (no completes frases: "que componen" se queda así).
- NO cambies terminología técnica náutica/marítima ni el SIGNIFICADO.
- NO toques NÚMEROS ni la numeración "1.1", "2.3", %.
- NO traduzcas, resumas, reordenes ni alteres la estructura.
Solo tocas ACENTOS, ERRATAS DE LETRAS y MAYÚSCULAS. Si un texto ya está bien
en esos tres aspectos, devuélvelo idéntico.
Recibirás un objeto JSON { "clave": "texto", ... }. Devuelve un objeto JSON con
LAS MISMAS CLAVES y el texto corregido. SOLO JSON, sin markdown ni explicaciones.`;

async function corregirLote(client, mapa) {
  const mensaje = `Corrige la ortografía/redacción de estos textos (mismas claves):\n${JSON.stringify(mapa, null, 1)}`;
  let ultimo = "fallo";
  for (let intento = 1; intento <= REINTENTOS + 1; intento++) {
    try {
      const stream = client.messages.stream({
        model: MODELO, max_tokens: 16000, system: SYSTEM,
        messages: [{ role: "user", content: mensaje }],
      });
      const msg = await stream.finalMessage();
      const t = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      return JSON.parse(extraerJSON(t));
    } catch (e) {
      ultimo = e?.message || String(e);
      await new Promise((r) => setTimeout(r, 1500 * intento));
    }
  }
  throw new Error(ultimo);
}

async function main() {
  await cargarEnvLocal();
  if (!process.env.ANTHROPIC_API_KEY?.trim()) { console.error("\nFALTA ANTHROPIC_API_KEY\n"); process.exit(2); }

  const files = (await fs.readdir(GEN)).filter((f) => f.endsWith(".json") && f !== "_index.json").sort();
  const objetivo = files.slice(0, LIMITE);
  console.log(`Archivos a corregir: ${objetivo.length}${LIMITE < Infinity ? ` (limitado de ${files.length})` : ` de ${files.length}`}`);
  console.log(`Modelo: ${MODELO} | concurrencia: ${CONCURRENCIA}\n`);

  const client = new Anthropic();
  const cambiosPorArchivo = []; // { archivo, cambios:[{path,antes,despues}], rechazados:[...] }
  let cursor = 0, totalCambios = 0, totalRechazos = 0;

  async function worker() {
    while (cursor < objetivo.length) {
      const f = objetivo[cursor++];
      const p = path.join(GEN, f);
      const rawOrig = await fs.readFile(p, "utf8");
      const o = JSON.parse(rawOrig);
      const orig = JSON.parse(rawOrig);
      const campos = camposTexto(o);
      const mapa = {};
      campos.forEach((c, i) => (mapa["f" + i] = c.texto));
      let corregido;
      try { corregido = await corregirLote(client, mapa); }
      catch (e) { console.log(`  [ERR]  ${f} → ${e.message}`); continue; }

      const cambios = [], rechazados = [];
      campos.forEach((c, i) => {
        const nuevo = corregido["f" + i];
        if (typeof nuevo !== "string" || nuevo === c.texto) return;
        // GUARDA 1: dígitos idénticos (no tocar números/numeración/%)
        if (digitos(nuevo) !== digitos(c.texto)) {
          rechazados.push({ path: c.path, antes: c.texto, despues: nuevo, motivo: "cambió dígitos" });
          return;
        }
        // GUARDA 2: solo ortografía (acentos/mayúsculas/1 errata) — rechaza cambios de palabra
        if (!esSoloOrtografia(c.texto, nuevo)) {
          rechazados.push({ path: c.path, antes: c.texto, despues: nuevo, motivo: "cambió palabra(s)" });
          return;
        }
        c.set(nuevo);
        cambios.push({ path: c.path, antes: c.texto, despues: nuevo });
      });

      if (cambios.length) {
        // Respaldo del original ANTES de sobrescribir (para reversión trivial).
        const bak = path.join(GEN, "_orig-backup", f);
        await fs.mkdir(path.dirname(bak), { recursive: true });
        await fs.access(bak).catch(async () => { await fs.writeFile(bak, JSON.stringify(orig, null, 2), "utf8"); });
        await fs.writeFile(p, JSON.stringify(o, null, 2), "utf8");
      }
      cambiosPorArchivo.push({ archivo: f, cambios, rechazados });
      totalCambios += cambios.length; totalRechazos += rechazados.length;
      console.log(`  [ok]   ${f} → ${cambios.length} cambios${rechazados.length ? `, ${rechazados.length} RECHAZADOS (dígitos)` : ""}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCIA }, () => worker()));

  // Log a CORRECCIONES.md (append a la sección de contenido)
  let md = await fs.readFile(CORR, "utf8").catch(() =>
    `# CORRECCIONES — auditoría (ortografía y redacción)\n\nSolo ortografía/erratas/mayúsculas. NO se cambió terminología técnica ni significado.\n`);
  md += `\n## Contenido — ortografía (${totalCambios} cambios en ${cambiosPorArchivo.filter((a) => a.cambios.length).length} archivos)\n`;
  for (const a of cambiosPorArchivo.sort((x, y) => x.archivo.localeCompare(y.archivo))) {
    if (!a.cambios.length && !a.rechazados.length) continue;
    md += `\n### ${a.archivo}\n`;
    for (const c of a.cambios) md += `- \`${c.path}\`: "${c.antes}" → "${c.despues}"\n`;
    for (const r of a.rechazados) md += `- ⚠️ RECHAZADO \`${r.path}\` (${r.motivo}): "${r.antes}" → "${r.despues}"\n`;
  }
  await fs.writeFile(CORR, md, "utf8");

  console.log(`\n=== RESUMEN ORTOGRAFÍA ===`);
  console.log(`Cambios aplicados: ${totalCambios}`);
  console.log(`Rechazados por guardián (dígitos o cambio de palabra): ${totalRechazos}`);
  console.log(`Log: ${path.relative(RAIZ, CORR)}`);
}

main().catch((e) => { console.error("ERROR:", e); process.exit(1); });
