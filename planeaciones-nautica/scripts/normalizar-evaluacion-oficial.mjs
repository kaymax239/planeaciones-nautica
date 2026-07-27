// NIVEL 2 — Normaliza el campo `evaluacion` de los 62 programas al esquema
// OFICIAL (oficios DEN-526-2025 y DEN-065-2026). Ver docs/criterios-evaluacion-oficiales.md
//
// DETERMINÍSTICO: los porcentajes por (tipo, año) los fija el oficio; NO se usa
// IA para los números. Los criterios ya extraídos se conservan como `desglose`
// dentro de las 3 categorías oficiales (mapeo por prefijo/palabra clave). Lo que
// no se puede mapear se lista como `sinClasificar` (no se fuerza).
//
// Uso:
//   node scripts/normalizar-evaluacion-oficial.mjs           (dry run: resumen)
//   node scripts/normalizar-evaluacion-oficial.mjs --apply   (escribe archivos + logs)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..");
const GEN = path.join(RAIZ, "app/data/contenidos/_generados-pares");
const INDEX = path.join(GEN, "_index.json");
const PEND = path.join(GEN, "PENDIENTES.md");
const CORR = path.join(GEN, "CORRECCIONES.md");
const APPLY = process.argv.includes("--apply");
const OFICIO = "DEN-526-2025 / DEN-065-2026";

const CAT = { CON: "Conocimiento", PAA: "Prácticas y actividades de aprendizaje", PT: "Participación y TIC's" };

// Distribución oficial por (año, tipo)
function distribucion(sem, tipo) {
  const primerAnio = sem === 2;
  if (tipo === "práctica")
    return primerAnio ? { [CAT.CON]: 20, [CAT.PAA]: 70, [CAT.PT]: 10 } : { [CAT.CON]: 25, [CAT.PAA]: 50, [CAT.PT]: 25 };
  return primerAnio ? { [CAT.CON]: 70, [CAT.PAA]: 20, [CAT.PT]: 10 } : { [CAT.CON]: 50, [CAT.PAA]: 25, [CAT.PT]: 25 };
}
const califMin = (sem) => (sem === 2 ? 7.0 : 6.0);

function clasificar(nombre) {
  const n = nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/ingles/.test(n)) return "Inglés";
  if (/taller|practicas? marineras?|laboratorio|simulador|educacion fisica/.test(n)) return "práctica";
  return "teórica";
}

// Mapea un criterio a una categoría oficial (o null si no embona claro)
function categoriaDe(criterio, instrumento) {
  const t = (criterio + " " + (instrumento || "")).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  // 1) prefijos oficiales explícitos del F-32
  if (/participacion|uso de tic|tic's|\btics?\b|exposicion|asistencia|actitud/.test(t)) return CAT.PT;
  if (/practicas? y actividades|actividades de aprendizaje/.test(t)) return CAT.PAA;
  if (/conocimiento|examen|prueba escrita|evaluacion parcial|cuestionario/.test(t)) return CAT.CON;
  // 2) palabras clave de instrumentos/actividades prácticas y productos de aprendizaje
  if (/practica|reporte|portafolio|laboratorio|proyecto|ejercicio|bitacora|maniobra|simulacro|rubrica|lista de (cotejo|verificacion)|lista cotejo|lista verificacion|resumen|mapa (conceptual|mental)|esquema|cuadro sinoptico|discusion|cuestionamiento/.test(t)) return CAT.PAA;
  // 3) participación
  if (/participa|tarea|investiga|mesa redonda|debate/.test(t)) return CAT.PT;
  // diagnóstica u otros sin peso en las 3 categorías → sin clasificar (no se fuerza)
  return null;
}

// Parsea PENDIENTES.md -> { archivo: [ {nombre, criterios:[{criterio,peso,instrumento}]}, ... ] }
function parsePendientes() {
  const map = {};
  if (!fs.existsSync(PEND)) return map;
  const txt = fs.readFileSync(PEND, "utf8");
  for (const bloque of txt.split(/^## /m).slice(1)) {
    const arch = bloque.match(/- archivo: `([^`]+)`/);
    if (!arch) continue;
    const json = bloque.match(/```json\s*([\s\S]*?)```/);
    if (json) {
      try {
        const o = JSON.parse(json[1]);
        map[arch[1]] = o?.parciales || (o?.evaluacion?.parciales) || [];
      } catch { map[arch[1]] = []; }
    } else map[arch[1]] = [];
  }
  return map;
}

// Construye los desglose de las 3 categorías a partir de una lista de criterios extraídos
function desgloseDeCriterios(criterios) {
  const d = { [CAT.CON]: [], [CAT.PAA]: [], [CAT.PT]: [] };
  const sinClasificar = [];
  for (const c of criterios || []) {
    const cat = categoriaDe(c.criterio || "", c.instrumento);
    const item = { criterio: c.criterio, instrumento: c.instrumento ?? null };
    if (cat) d[cat].push(item);
    else sinClasificar.push(item);
  }
  return { d, sinClasificar };
}

const HABILIDADES = ["Listening", "Reading", "Writing", "Speaking", "Grammar & Vocabulary"];
function evaluacionIngles(sem, criteriosPorParcial) {
  const parciales = [0, 1].map((i) => {
    const crit = criteriosPorParcial[i] || criteriosPorParcial[0] || [];
    const participacion = (crit || []).filter((c) => !/examen|listening|reading|writing|speaking|grammar/i.test(c.criterio || ""))
      .map((c) => ({ criterio: c.criterio, instrumento: c.instrumento ?? null }));
    return {
      nombre: i === 0 ? "1er Parcial" : "2do Parcial",
      total: 100,
      examen: { puntos: 85, habilidades: HABILIDADES.map((h) => ({ habilidad: h, puntos: 17 })) },
      participacionProyectosLibro: { puntos: 15, desglose: participacion },
    };
  });
  return {
    esquema: "ingles",
    oficio: OFICIO,
    calificacionMinima: califMin(sem),
    parciales,
    ordinario: { total: 100, examen: { puntos: 100, habilidades: HABILIDADES.map((h) => ({ habilidad: h, puntos: 20 })) } },
    acreditacion: "2 parciales con examen escrito; la suma aprobatoria da derecho a ordinario; si no, extraordinario.",
  };
}

function evaluacionOficial(sem, tipo, extraidos) {
  const dist = distribucion(sem, tipo);
  const parciales = [0, 1].map((i) => {
    const crit = (extraidos[i] || {}).criterios || [];
    const { d, sinClasificar } = desgloseDeCriterios(crit);
    const categorias = Object.keys(dist).map((cat) => ({ categoria: cat, porcentaje: dist[cat], desglose: d[cat] }));
    return { nombre: i === 0 ? "1er Parcial" : "2do Parcial", categorias, sinClasificar };
  });
  return {
    esquema: "oficial",
    oficio: OFICIO,
    tipoMateria: tipo,
    calificacionMinima: califMin(sem),
    parciales,
    acreditacion: "2 parciales con examen escrito; la suma aprobatoria da derecho a ordinario; si no, extraordinario.",
  };
}

// Distribución anterior (agrupada por categoría) para el log — informativa
function distAnterior(extraidos) {
  const parciales = (extraidos || []).map((p) => {
    const g = { [CAT.CON]: 0, [CAT.PAA]: 0, [CAT.PT]: 0, sin: 0 };
    for (const c of p.criterios || []) {
      const cat = categoriaDe(c.criterio || "", c.instrumento);
      g[cat || "sin"] += Number(c.peso) || 0;
    }
    return g;
  });
  return parciales;
}

function main() {
  const pendMap = parsePendientes();
  const files = fs.readdirSync(GEN).filter((f) => f.endsWith(".json") && f !== "_index.json").sort();
  const index = JSON.parse(fs.readFileSync(INDEX, "utf8"));
  const logLines = [];
  let nOficial = 0, nIngles = 0, nConSinClasif = 0, totalCriterios = 0, totalSin = 0;
  const resumen = { teórica: 0, práctica: 0, "Inglés": 0 };
  const cambios = [];

  for (const f of files) {
    const o = JSON.parse(fs.readFileSync(path.join(GEN, f), "utf8"));
    const m = f.match(/^(MN|PN)_Sem(\d+)_/);
    const sem = +m[2];
    const tipo = clasificar(o.nombre);
    resumen[tipo]++;
    // criterios de origen: de la evaluación válida o del PENDIENTES.md
    const extraidos = o.evaluacion?.parciales || pendMap[f] || [];
    const antes = distAnterior(extraidos);

    let nueva;
    if (tipo === "Inglés") {
      nueva = evaluacionIngles(sem, extraidos.map((p) => p.criterios || []));
      nIngles++;
    } else {
      nueva = evaluacionOficial(sem, tipo, extraidos);
      nOficial++;
      const sinCount = nueva.parciales.reduce((a, p) => a + (p.sinClasificar?.length || 0), 0);
      const critCount = extraidos.reduce((a, p) => a + (p.criterios?.length || 0), 0);
      totalCriterios += critCount; totalSin += sinCount;
      if (sinCount) nConSinClasif++;
      cambios.push({ f, tipo, sem, sinCount, critCount });
    }

    if (APPLY) {
      o.evaluacion = nueva;
      fs.writeFileSync(path.join(GEN, f), JSON.stringify(o, null, 2), "utf8");
    }
    // log
    const distTxt = tipo === "Inglés" ? "esquema Inglés (85+15 / ord 100)" :
      Object.entries(distribucion(sem, tipo)).map(([k, v]) => `${k.split(" ")[0]}=${v}`).join("/");
    const antesTxt = antes.length ? antes.map((g) => `[C${g[CAT.CON]}/P${g[CAT.PAA]}/T${g[CAT.PT]}${g.sin ? "/sin" + g.sin : ""}]`).join(" ") : "(sin extracción previa)";
    logLines.push(`- \`${f}\` — ${tipo}, sem${sem} (${sem === 2 ? "1er año, min 7.0" : "2º-4º, min 6.0"}) — anterior ${antesTxt} → oficial ${distTxt}  [${OFICIO}]`);

    // columna eval en índice
    const im = index.materias.find((x) => x.archivo === f);
    if (im) im.eval = tipo === "Inglés" ? "oficial-ingles" : "oficial";
  }

  console.log(APPLY ? "=== APLICADO ===" : "=== DRY RUN ===");
  console.log("Clasificación:", JSON.stringify(resumen));
  console.log(`Normalizadas a esquema oficial: ${nOficial} | Inglés: ${nIngles}`);
  console.log(`Criterios mapeados a categorías: ${totalCriterios - totalSin}/${totalCriterios} | sinClasificar: ${totalSin} (en ${nConSinClasif} materias)`);
  console.log("\nMaterias con criterios sinClasificar (revisar desglose, el % oficial NO se afecta):");
  cambios.filter((c) => c.sinCount).sort((a, b) => b.sinCount - a.sinCount)
    .forEach((c) => console.log(`  ${c.f}: ${c.sinCount}/${c.critCount} sin clasificar`));

  if (APPLY) {
    // _index
    index.evalResumen = { esquema: "oficial", oficio: OFICIO, teoricas: resumen.teórica, practicas: resumen.práctica, ingles: resumen["Inglés"] };
    fs.writeFileSync(INDEX, JSON.stringify(index, null, 2), "utf8");
    // CORRECCIONES.md
    let md = fs.readFileSync(CORR, "utf8");
    md += `\n## Evaluación — normalización al esquema oficial (${OFICIO})\n\n`;
    md += `Los porcentajes por (tipo, año) los fija el oficio. Criterios extraídos conservados\n`;
    md += `como desglose dentro de las 3 categorías. Ver docs/criterios-evaluacion-oficiales.md.\n\n`;
    md += logLines.join("\n") + "\n";
    fs.writeFileSync(CORR, md, "utf8");
    console.log("\nEscrito: 62 archivos, _index.json (columna eval), CORRECCIONES.md.");
  }
}
main();
