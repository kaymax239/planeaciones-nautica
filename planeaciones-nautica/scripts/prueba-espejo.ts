// PRUEBA ESPEJO — usa los módulos REALES integrados (contenidos/*.ts vía el
// agregador) tal como los consume route.ts, y arma la "planeación 2027" espejo
// de una materia para compararla contra el programa oficial.
//
// Ejecutar: npx tsx scripts/prueba-espejo.ts "Estática" PN VIII... (args opcionales)

import { contenidosMaterias, contenidosMateriasMN } from "../app/data/contenidosMaterias";
import { esProgramaOficial } from "../app/data/tipos";

const materia = process.argv[2] || "Estática";
const carrera = (process.argv[3] || "PN") as "PN" | "MN";
const CICLO_2027 = "Enero–Junio 2027";

// Réplica EXACTA de la búsqueda de route.ts:
const fuente = carrera === "MN" ? contenidosMateriasMN : contenidosMaterias;
const programa = fuente[materia];

console.log(`Búsqueda igual que route.ts: fuente["${materia}"] (carrera ${carrera})`);
if (!esProgramaOficial(programa)) {
  console.log(`❌ RESULTADO: sin_programa (NO integrado).`);
  process.exit(1);
}
console.log(`✅ RESULTADO: programa encontrado — route.ts YA NO devuelve sin_programa.\n`);

console.log("══════════════════════════════════════════════════════════════");
console.log(`PLANEACIÓN ESPEJO — ${CICLO_2027}  ·  ${carrera}`);
console.log("══════════════════════════════════════════════════════════════");
console.log(`Materia: ${programa.nombre}   (clave ${programa.clave || "s/clave"})`);
console.log(`Tipo: ${programa.tipo}   Horas: ${programa.horas.total} (${programa.horas.teoricas}T/${programa.horas.practicas}P/${programa.horas.independientes}I), ${programa.horas.semanas} sem`);
console.log(`\nObjetivo general:\n  ${programa.objetivoGeneral}`);

console.log(`\nUNIDADES (${programa.unidades.length}) — espejo fiel del programa oficial:`);
for (const u of programa.unidades) {
  console.log(`\n  Unidad ${u.numero}: ${u.tema}${u.transversal ? "  [transversal]" : ""}`);
  console.log(`    Objetivo: ${u.objetivoEspecifico}`);
  if (u.subtemas.length) console.log(`    Subtemas: ${u.subtemas.join("  ")}`);
}

console.log(`\nEVALUACIÓN (oficial):`);
const ev = programa.evaluacion;
if (!ev) console.log("  (sin campo evaluacion)");
else if (ev.esquema === "oficial") {
  console.log(`  Esquema oficial [${ev.oficio}] · tipo ${ev.tipoMateria} · mínima aprobatoria ${ev.calificacionMinima}`);
  for (const p of ev.parciales) {
    const linea = p.categorias.map((c) => `${c.categoria} ${c.porcentaje}%`).join(" · ");
    console.log(`    ${p.nombre}: ${linea}`);
    for (const c of p.categorias)
      for (const d of c.desglose)
        console.log(`        - [${c.categoria.split(" ")[0]}] ${d.criterio}${d.peso === 0 ? " (peso 0 — " + (d.nota || "") + ")" : ""}${d.instrumento ? "  ·  " + d.instrumento : ""}`);
  }
  console.log(`    Acreditación: ${ev.acreditacion}`);
} else {
  console.log(`  Esquema Inglés · mínima ${ev.calificacionMinima}`);
  for (const p of ev.parciales) console.log(`    ${p.nombre}: examen ${p.examen.puntos} (${p.examen.habilidades.map((h) => h.habilidad + " " + h.puntos).join(", ")}) + participación ${p.participacionProyectosLibro.puntos}`);
  console.log(`    Ordinario: examen ${ev.ordinario.examen.puntos} (${ev.ordinario.examen.habilidades.map((h) => h.puntos).join("+")})`);
}

console.log(`\nBIBLIOGRAFÍA (${programa.bibliografia.length}):`);
programa.bibliografia.forEach((b) => console.log(`  - ${b}`));
console.log(`\nFuente PDF original 2026: ${programa.fuente}`);
console.log("══════════════════════════════════════════════════════════════");
console.log("Nota: contenido idéntico al programa oficial 2026 (espejo). En la app,");
console.log("la generación cambia solo el ciclo/fechas a 2027 y añade la capa pedagógica (Gemini).");
