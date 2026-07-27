// PASO 5 — Integra los 62 programas de _generados-pares/ a los módulos
// contenidos/semestre{2,4,6,8}.ts (PN) y contenidos/mn{2,4,6,8}.ts (MN),
// keyed por nombre de materia, tipados como ProgramaOficial.
//
// Quita metadatos internos (__origen) y sinClasificar vacío. Idempotente:
// regenera los .ts desde los JSON (fuente de verdad: _generados-pares/).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..");
const GEN = path.join(RAIZ, "app/data/contenidos/_generados-pares");
const OUT = path.join(RAIZ, "app/data/contenidos");

function limpiar(o) {
  const { __origen, ...resto } = o;
  const prog = {
    clave: resto.clave,
    nombre: resto.nombre,
    tipo: resto.tipo,
    horas: resto.horas,
    objetivoGeneral: resto.objetivoGeneral,
    unidades: resto.unidades,
    bibliografia: resto.bibliografia,
    fuente: resto.fuente,
  };
  if (resto.evaluacion) {
    const ev = JSON.parse(JSON.stringify(resto.evaluacion));
    if (Array.isArray(ev.parciales)) ev.parciales.forEach((p) => { if (p && "sinClasificar" in p) delete p.sinClasificar; });
    prog.evaluacion = ev;
  }
  return prog;
}

const files = fs.readdirSync(GEN).filter((f) => f.endsWith(".json") && f !== "_index.json");
const grupos = {}; // "PN|2" -> { nombre: prog }
for (const f of files) {
  const m = f.match(/^(MN|PN)_Sem(\d+)_/);
  if (!m) continue;
  const key = `${m[1]}|${+m[2]}`;
  const o = JSON.parse(fs.readFileSync(path.join(GEN, f), "utf8"));
  (grupos[key] ??= {});
  if (grupos[key][o.nombre]) console.warn(`⚠️ COLISIÓN de nombre en ${key}: "${o.nombre}"`);
  grupos[key][o.nombre] = limpiar(o);
}

let generados = [];
for (const [key, obj] of Object.entries(grupos)) {
  const [car, sem] = key.split("|");
  const esMN = car === "MN";
  const nombreExport = esMN ? `contenidosMN${sem}` : `contenidosSemestre${sem}`;
  const archivo = esMN ? `mn${sem}.ts` : `semestre${sem}.ts`;
  const header = `// Programas oficiales semestre ${sem} ${esMN ? "Maquinista/Mecánico Naval (MN)" : "Piloto Naval (PN)"}.\n` +
    `// Generado por scripts/integrar-contenidos-pares.mjs desde _generados-pares/ (biblioteca espejo\n` +
    `// F-32 Ene–Jun 2026). Evaluación normalizada a DEN-526-2025 / DEN-065-2026. NO editar a mano:\n` +
    `// re-generar desde los JSON fuente.\n` +
    `import type { ProgramaOficial } from "../tipos";\n\n`;
  const cuerpo = `export const ${nombreExport}: Record<string, ProgramaOficial> = ${JSON.stringify(obj, null, 2)};\n`;
  fs.writeFileSync(path.join(OUT, archivo), header + cuerpo, "utf8");
  generados.push({ archivo, export: nombreExport, materias: Object.keys(obj).length });
}

generados.sort((a, b) => a.archivo.localeCompare(b.archivo));
console.log("Generados:");
generados.forEach((g) => console.log(`  ${g.archivo} → ${g.export} (${g.materias} materias)`));
console.log(`Total: ${generados.length} archivos, ${generados.reduce((a, g) => a + g.materias, 0)} materias.`);
