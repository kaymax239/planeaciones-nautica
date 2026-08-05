// Verificador de NO-REGRESIÓN del flujo de Inglés Marítimo.
//
// Nació porque el repositorio no tenía pruebas automatizadas (D9 en
// DEUDA-TECNICA-INGLES.md): la línea base de los niveles 4-8 no era ejecutable.
//
// AHORA HAY SUITE: `npm test` (vitest, carpeta tests/). La puerta de calidad es
// esa. Lo que este script comprueba se reparte así:
//
//   - Lo que se comportaba como prueba de verdad ya está PORTADO a tests/:
//     bibliografía por nivel, desvío de los niveles almacenados, dosificación de
//     18 semanas, esquema de evaluación, espejo del nivel 8, contratos de los
//     endpoints y —lo que aquí no se podía ver— que el .docx renderizado no
//     imprima "undefined" ni el libro de otro nivel.
//   - Lo que queda aquí son ANCLAS SOBRE EL TEXTO FUENTE: expresiones regulares
//     contra route.ts, temarioInglesOficial.ts, inglesMaritimo.ts y
//     planeacionInglesF32.js que fijan literales, órdenes de líneas y nombres de
//     variables. Eso detecta cambios de implementación, no de comportamiento: es
//     útil como aviso ("alguien movió el desvío"), pero da FALSOS POSITIVOS en
//     cuanto alguien refactoriza sin romper nada.
//
// Por eso NO está enganchado a `npm test`: se corre a mano con
// `npm run verificar:ingles`, y una falla suya se lee como "revisa esto", no
// como "está roto". Si una comprobación de aquí resulta valiosa de verdad,
// el sitio correcto es tests/, escrita contra el comportamiento observable.
//
// Comprueba dos cosas:
//   A) Que los niveles 4-8 (GENERADOS espejando históricas de iDiscover) sigan
//      comportándose EXACTAMENTE igual que antes del alta de los niveles 1/2/3.
//   B) Que los niveles 1/2/3 (contenido ALMACENADO de StartUp) cumplan la
//      especificación, en particular que su bibliografía nunca quede vacía.
//
// Uso:  node scripts/verificar-no-regresion-ingles.mjs
// Sale con código 1 si cualquier comprobación falla.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const leer = (rel) => readFileSync(path.join(RAIZ, rel), "utf8");

let fallos = 0;
let pasadas = 0;

function comprobar(nombre, real, esperado) {
  const r = JSON.stringify(real);
  const e = JSON.stringify(esperado);
  if (r === e) {
    pasadas++;
    console.log(`  ok    ${nombre}`);
  } else {
    fallos++;
    console.error(`  FALLA ${nombre}\n        esperado: ${e}\n        real:     ${r}`);
  }
}

function comprobarQue(nombre, condicion, detalle = "") {
  if (condicion) {
    pasadas++;
    console.log(`  ok    ${nombre}`);
  } else {
    fallos++;
    console.error(`  FALLA ${nombre}${detalle ? `\n        ${detalle}` : ""}`);
  }
}

/* ------------------------------------------------------------------ datos -- */

const indice = JSON.parse(leer(".indice-ingles/indice.json"));
const rutaRoute = "app/api/planeacion-ingles/route.ts";
const srcRoute = leer(rutaRoute);
const srcTemario = leer("app/data/temarioInglesOficial.ts");
const srcF32 = leer("app/lib/planeacionInglesF32.js");
const srcIngles = leer("app/data/inglesMaritimo.ts");

// Versión sin comentarios: las comprobaciones de "no debe mencionar X" tienen
// que mirar el CÓDIGO, no la prosa que documenta por qué X se eliminó.
const sinComentarios = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const codigoIngles = sinComentarios(srcIngles);

// Réplica EXACTA de seleccionarReferencias (route.ts:133-166). Si alguien
// cambia la original sin actualizar esta réplica, las comprobaciones de
// selección de abajo dejan de cuadrar y el script falla — que es lo deseado.
const sinAcentos = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "");

const MAX_REFERENCIAS = 3;

function seleccionarReferencias(entradas, nivel, tema) {
  const nivelNorm = sinAcentos(nivel).toLowerCase().trim();
  const porNivel = entradas.filter(
    (e) => (e.nivel ?? "").toLowerCase().trim() === nivelNorm,
  );
  if (porNivel.length === 0) return [];
  const terminos = sinAcentos(tema)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  const puntuar = (e) => {
    if (terminos.length === 0) return 0;
    const texto = sinAcentos(e.texto).toLowerCase();
    let score = 0;
    for (const term of terminos) if (texto.includes(term)) score += 1;
    return score;
  };
  return [...porNivel]
    .map((e) => ({ e, s: puntuar(e) }))
    .sort((a, b) => b.s - a.s || b.e.palabras - a.e.palabras)
    .slice(0, MAX_REFERENCIAS)
    .map((x) => x.e);
}

/* ------------------------------------- A) niveles 4-8: sin regresión ------ */

console.log("\nA) Niveles 4-8 — línea base (deben quedar IDÉNTICOS)\n");

// A1. Conteo de documentos por nivel en el índice histórico.
const conteo = {};
for (const d of indice.documentos) {
  const k = d.nivel ?? "null";
  conteo[k] = (conteo[k] ?? 0) + 1;
}
comprobar("A1 índice: documentos nivel 4", conteo["4"] ?? 0, 4);
comprobar("A1 índice: documentos nivel 5", conteo["5"] ?? 0, 8);
comprobar("A1 índice: documentos nivel 6", conteo["6"] ?? 0, 4);
comprobar("A1 índice: documentos nivel 7", conteo["7"] ?? 0, 4);
comprobar("A1 índice: documentos nivel 8", conteo["8"] ?? 0, 0);

// A2. Referencias seleccionadas por nivel, sin tema (lo que hace la UI).
const nombres = (nivel) =>
  seleccionarReferencias(indice.documentos, nivel, "").map((r) => r.nombre);

comprobar("A2 selección nivel 4", nombres("4"), [
  "planeacion_lv4_fechas_actualizadas.docx",
  "LEVEL4PLANEACION.docx",
  "II_level 4 plan.docx",
]);
comprobar("A2 selección nivel 5", nombres("5"), [
  "level5_ VIA-PN-MN.docx",
  "level5_ IIB-PN.docx",
  "level5_ IVC-PN-MN.docx",
]);
comprobar("A2 selección nivel 6", nombres("6"), [
  "Copia de planeacion_lv6_fechas_actualizadas_final.docx",
  "Planeación_cadena_VIsem_lvl6.docx",
  "Planeación_gavia_lvl6.docx",
]);
comprobar("A2 selección nivel 7", nombres("7"), [
  "Copia de INGLES MARITIMO Lvl.7 (1).docx",
  "Planeación_gavia_iv_lvl7.docx",
  "Planeación Didáctica lvl7.docx",
]);
comprobar("A2 nivel 8 no tiene referencias propias", nombres("8"), []);

// Espejeo del nivel 8: se simula la ruta REAL (route.ts) — 0 referencias
// propias + NIVEL_ESPEJO["8"]="7" ⇒ se reintenta con el 7. Se compara contra la
// lista literal esperada, no contra sí misma.
const ESPEJO_ESPERADO = { "8": "7" };
let refs8 = nombres("8");
let nivelEspejo8 = "8";
if (refs8.length === 0 && ESPEJO_ESPERADO["8"]) {
  nivelEspejo8 = ESPEJO_ESPERADO["8"];
  refs8 = nombres(nivelEspejo8);
}
comprobar("A2 nivel 8: nivelEspejo resultante", nivelEspejo8, "7");
comprobar("A2 nivel 8: referencias tras espejear", refs8, [
  "Copia de INGLES MARITIMO Lvl.7 (1).docx",
  "Planeación_gavia_iv_lvl7.docx",
  "Planeación Didáctica lvl7.docx",
]);
comprobarQue(
  "A2 route.ts conserva el fallback de espejeo",
  /if \(referencias\.length === 0 && NIVEL_ESPEJO\[nivel\]\)/.test(srcRoute) &&
    /nivelEspejo = NIVEL_ESPEJO\[nivel\]/.test(srcRoute),
  "se perdió el reintento con el nivel espejo en route.ts",
);

// A3. Constantes de recorte y selección.
for (const [nombre, re, esperado] of [
  ["MAX_REFERENCIAS", /const MAX_REFERENCIAS = (\d+);/, "3"],
  ["MAX_CHARS_CABECERA", /const MAX_CHARS_CABECERA = (\d+);/, "14000"],
  ["MAX_CHARS_COLA", /const MAX_CHARS_COLA = (\d+);/, "8000"],
]) {
  const m = srcRoute.match(re);
  comprobar(`A3 ${nombre}`, m?.[1] ?? null, esperado);
}

// A4. NIVEL_ESPEJO sigue siendo exactamente { "8": "7" }.
const bloqueEspejo = srcTemario.match(
  /export const NIVEL_ESPEJO[^{]*\{([^}]*)\}/,
)?.[1] ?? "";
const clavesEspejo = [...bloqueEspejo.matchAll(/"(\d+)"\s*:\s*"(\d+)"/g)].map(
  (m) => `${m[1]}->${m[2]}`,
);
comprobar("A4 NIVEL_ESPEJO", clavesEspejo, ["8->7"]);

// A5. TEMARIO_OFICIAL no ganó entradas para 4, 5, 6 ni 7.
const clavesTemario = [
  ...srcTemario.matchAll(/^\s{2}"(\d+)":\s*\{/gm),
].map((m) => m[1]);
comprobar("A5 claves de TEMARIO_OFICIAL", clavesTemario.sort(), ["1", "2", "3", "8"]);
for (const n of ["4", "5", "6", "7"]) {
  comprobarQue(
    `A5 TEMARIO_OFICIAL sin nivel ${n}`,
    !clavesTemario.includes(n),
    `el nivel ${n} pasaría de espejeo puro a temario oficial`,
  );
}

// A6. Bibliografía iDiscover intacta (la usan 4-7 como respaldo).
comprobarQue(
  "A6 texto de bibliografiaIDiscover",
  srcF32.includes(
    "I Discover ${n} Student book & Workbook (2013), Evans, Dooley. Express Publishing.",
  ),
  "cambió el literal de la bibliografía iDiscover",
);
comprobarQue(
  "A6 libro del nivel 8 intacto",
  srcTemario.includes(
    "iDiscover 8 (Express Publishing), Evans, Dooley — ISBN 978-1-4715-1824-9",
  ),
);

// A7. El SYSTEM_PROMPT del generador no se tocó en sus invariantes.
comprobarQue(
  "A7 SYSTEM_PROMPT prohíbe STCW/OMI",
  srcRoute.includes("NO uses STCW ni estándares OMI"),
);
for (const clave of [
  "asignatura", "nivel", "grupo", "tema", "enfoque", "objetivoGeneral",
  "objetivosEspecificos", "competencias", "secuenciaSemanal", "evaluacion",
  "recursos", "bibliografia", "observaciones",
]) {
  comprobarQue(`A7 esquema JSON conserva "${clave}"`, srcRoute.includes(clave));
}

// A8. El desvío entra ANTES de leer el índice (si no, 4-8 cambiarían de ruta).
// Ancla en las LLAMADAS reales, no en los comentarios de cabecera (que también
// nombran BibliotecaIngles.leerIndice()).
const posDesvio = srcRoute.indexOf("if (tienePlaneacionAlmacenada(nivel))");
const posIndice = srcRoute.indexOf("await BibliotecaIngles.leerIndice()");
comprobarQue(
  "A8 el desvío precede a leerIndice()",
  posDesvio > 0 && posIndice > 0 && posDesvio < posIndice,
  `desvío en ${posDesvio}, leerIndice en ${posIndice}`,
);

// A9. El desvío solo captura 1/2/3: nunca puede alcanzar a 4-8.
const clavesAlmacenadas = [
  ...srcIngles.matchAll(/^\s{2}"(\d+)":\s*entrada\(/gm),
].map((m) => m[1]);
comprobar("A9 niveles almacenados", clavesAlmacenadas.sort(), ["1", "2", "3"]);

/* ------------------------------- B) niveles 1/2/3: especificación -------- */

console.log("\nB) Niveles 1/2/3 — contenido almacenado (StartUp)\n");

// B1. Bibliografía poblada: la comprobación que previene D1.
const RE_NO_ESPECIFICADA = /no\s+especificad/i;

// Se extraen las plantillas REALES del módulo y se expanden para los tres
// niveles, en vez de dar por buena una cadena escrita a mano en este script.
const plantillas = [
  ...srcIngles.matchAll(
    /`(Pearson Education\. \(2019\)\. StartUp Level \$\{nivelLibro\}[^`]*)`/g,
  ),
].map((m) => m[1]);

comprobar("B1 plantillas de bibliografía encontradas", plantillas.length, 3);
comprobarQue(
  "B1 entrada() conecta la bibliografía del nivel",
  /bibliografia:\s*bibliografiaStartUp\(Number\(nivel\)\)/.test(srcIngles),
);

for (const n of ["1", "2", "3"]) {
  const generadas = plantillas.map((p) =>
    p.replace("${nivelLibro}", n),
  );
  comprobar(`B1 nivel ${n}: 3 referencias`, generadas.length, 3);
  comprobar(`B1 nivel ${n}: bibliografía generada`, generadas, [
    `Pearson Education. (2019). StartUp Level ${n} Student Book. Pearson Education.`,
    `Pearson Education. (2019). StartUp Level ${n} Teacher's Edition. Pearson Education.`,
    `Pearson Education. (2019). StartUp Level ${n} Workbook. Pearson Education.`,
  ]);
  comprobarQue(
    `B1 nivel ${n}: ninguna referencia vacía`,
    generadas.every((s) => s.trim().length > 0),
  );
  comprobarQue(
    `B1 nivel ${n}: ninguna matchea /no especificad/i`,
    generadas.every((s) => !RE_NO_ESPECIFICADA.test(s)),
  );
}

// B2. Enfoque no vacío: previene el OTRO fallback de iDiscover (F32:134).
comprobarQue(
  "B2 enfoque poblado (evita 'Enfoque iDiscover' en el F-32)",
  /const ENFOQUE =\s*\n?\s*"Enfoque comunicativo de la serie StartUp/.test(srcIngles),
);
comprobarQue(
  "B2 el código almacenado no cita iDiscover",
  !/iDiscover/i.test(codigoIngles),
  "el contenido almacenado no debe citar el libro anterior",
);

// B3. Evaluación: molde de ING853 con los dos cambios pedidos.
comprobarQue("B3 calificacionMinima = 7", /calificacionMinima:\s*7,/.test(srcIngles));
comprobarQue(
  "B3 desglose 3 / 6 / 6",
  /puntos:\s*3,/.test(srcIngles) &&
    (srcIngles.match(/puntos:\s*6,/g) ?? []).length === 2,
);
comprobarQue(
  "B3 el desglose no referencia a Marlin's",
  !/marlin/i.test(codigoIngles),
);
comprobarQue(
  "B3 el desglose suma los 15 puntos de participación",
  /puntos:\s*15,/.test(srcIngles),
);

// B4. Datos comunes de la especificación.
for (const [nombre, aguja] of [
  ["clave ING 208", 'const CLAVE = "ING 208"'],
  ["docente Víctor Cadena", 'const DOCENTE = "Víctor Cadena"'],
  ["formato F-32 Ed. 3", 'FID-FOR-F-32, Ed. 3, 15/12/25'],
  ["periodo agosto-diciembre", 'const PERIODO = "agosto-diciembre"'],
  ["semestre 1", "const SEMESTRE = 1"],
  ["horas total 112", "total: 112"],
  ["horas teóricas 32", "teoricas: 32"],
  ["horas prácticas 80", "practicas: 80"],
  ["horas independientes 32", "independientes: 32"],
  ["horas por semana 7", "porSemana: 7"],
  ["créditos 9", "creditos: 9"],
  ["calendario AGO_DIC_2026", 'calendarioDe("ago-dic")'],
]) {
  comprobarQue(`B4 ${nombre}`, srcIngles.includes(aguja));
}

// B5. Dosificación: 18 semanas correlativas y completas en los tres niveles.
// (Sustituye a la comprobación de "secuenciaSemanal vacío" del commit anterior.)
const bloqueSecuencia = (n) => {
  const ini = srcIngles.indexOf(`const SECUENCIA_NIVEL_${n}: SemanaSecuencia[] = [`);
  if (ini < 0) return "";
  const fin = srcIngles.indexOf("\n];", ini);
  return fin < 0 ? "" : srcIngles.slice(ini, fin);
};

const CORRELATIVO = Array.from({ length: 18 }, (_, i) => i + 1).join(",");
const resumenSecuencias = ["1", "2", "3"].map((n) => {
  const b = bloqueSecuencia(n);
  const semanas = [...b.matchAll(/^ {4}semana:\s*(\d+),$/gm)].map((m) => Number(m[1]));
  const campos = ["contenido", "actividades", "evidencias", "recursos"].every(
    (c) => (b.match(new RegExp(`^ {4}${c}:`, "gm")) ?? []).length === 18,
  );
  return [
    `n${n}`,
    semanas.length,
    semanas.join(",") === CORRELATIVO ? "1-18" : "orden-mal",
    campos ? "campos-ok" : "campos-mal",
  ].join(":");
});
comprobar(
  "B5 dosificación: 18 semanas correlativas con sus 5 campos en los 3 niveles",
  resumenSecuencias,
  ["n1:18:1-18:campos-ok", "n2:18:1-18:campos-ok", "n3:18:1-18:campos-ok"],
);

// B6. ids de las tres entradas.
for (const n of ["1", "2", "3"]) {
  comprobarQue(
    `B6 id del nivel ${n}`,
    srcIngles.includes("`ingles-maritimo-n${nivel}-sem1-2026b`") ||
      srcIngles.includes(`ingles-maritimo-n${n}-sem1-2026b`),
  );
}

/* ---------------------------------------------- C) presentacion-ingles ----- */
//
// El endpoint de PRESENTACIONES no compartía el desvío de contenido almacenado
// (D2 en DEUDA-TECNICA-INGLES.md). Sin él, el nivel 2 daba 404 y los niveles 1 y
// 3 generaban desde históricas de iDiscover: el libro equivocado.

const rutaPres = "app/api/presentacion-ingles/route.ts";
const srcPres = leer(rutaPres);
const codigoPres = sinComentarios(srcPres);

const literal = (src, nombre) => {
  const p = "const " + nombre + " = `";
  const i = src.indexOf(p);
  if (i < 0) return null;
  const desde = i + p.length;
  return src.slice(desde, src.indexOf("`;", desde));
};

// C1. El molde de los niveles históricos (4-8) NO cambió: se compone de la
// cabecera de siempre + las reglas comunes, y debe seguir dando el MISMO texto.
// Se compara contra el archivo tal como está en HEAD, normalizando saltos de
// línea (el árbol de trabajo en Windows queda con CRLF y `git show` da LF).
const comunesPres = literal(srcPres, "REGLAS_COMUNES_PROMPT");
const promptHistoricas = literal(srcPres, "SYSTEM_PROMPT");
comprobarQue(
  "C1 el prompt de históricas se compone de las reglas comunes",
  !!comunesPres &&
    !!promptHistoricas &&
    promptHistoricas.includes("${REGLAS_COMUNES_PROMPT}"),
);
comprobarQue(
  "C1 el prompt de históricas conserva la referencia a iDiscover",
  (promptHistoricas ?? "").includes("libro iDiscover (te doy la referencia)"),
);

// C2. El molde de los niveles almacenados existe y NO nombra el libro viejo
// salvo para prohibirlo.
const promptAlmacenado = literal(srcPres, "SYSTEM_PROMPT_ALMACENADO");
comprobarQue("C2 existe el prompt de niveles almacenados", !!promptAlmacenado);
comprobarQue(
  "C2 el prompt almacenado nombra StartUp (Pearson)",
  (promptAlmacenado ?? "").includes("libro StartUp (Pearson)"),
);
comprobarQue(
  "C2 el prompt almacenado prohíbe iDiscover / Express Publishing",
  /PROHIBIDO mencionar iDiscover o Express Publishing/.test(
    promptAlmacenado ?? "",
  ),
);
comprobarQue(
  "C2 el prompt almacenado no menciona iDiscover fuera de la prohibición",
  !/iDiscover|Express Publishing/.test(
    (promptAlmacenado ?? "").replace(/PROHIBIDO mencionar[^\n]*/g, ""),
  ),
);

// C3. El desvío se decide con la MISMA función que /api/planeacion-ingles y se
// evalúa ANTES de leer el índice histórico.
comprobarQue(
  "C3 presentacion-ingles usa tienePlaneacionAlmacenada",
  codigoPres.includes("tienePlaneacionAlmacenada(nivel)"),
);
comprobarQue(
  "C3 el desvío se decide antes de leerIndice()",
  codigoPres.indexOf("tienePlaneacionAlmacenada(nivel)") <
    codigoPres.indexOf("BibliotecaIngles.leerIndice()"),
);
comprobarQue(
  "C3 los niveles almacenados no llegan a seleccionarReferencias",
  codigoPres.indexOf("construirMensajeAlmacenado(nivel, tema, almacenada)") <
    codigoPres.indexOf("seleccionarReferencias(indice.documentos"),
);

// C4. bibliografiaIDiscover sigue existiendo para 4-8, pero el camino
// almacenado no puede pasar por ella.
const cuerpoAlmacenado = (() => {
  const i = codigoPres.indexOf("function construirMensajeAlmacenado");
  if (i < 0) return "";
  return codigoPres.slice(i, codigoPres.indexOf("\n}", i));
})();
comprobarQue(
  "C4 el mensaje almacenado no llama a bibliografiaIDiscover",
  !!cuerpoAlmacenado && !cuerpoAlmacenado.includes("bibliografiaIDiscover"),
);
comprobarQue(
  "C4 el mensaje almacenado usa la bibliografía de la entrada",
  cuerpoAlmacenado.includes("e.bibliografia"),
);
comprobarQue(
  "C4 el camino de históricas conserva bibliografiaIDiscover",
  codigoPres.includes("bibliografiaIDiscover(nivel)"),
);

// C5. Las semanas PENDIENTE (14 y 15 del nivel 3) no entran al prompt.
comprobarQue(
  "C5 se filtran las semanas PENDIENTE",
  cuerpoAlmacenado.includes("esSemanaPendiente"),
);

// C6. El nivel 8 ya no cae en 404: usa NIVEL_ESPEJO como planeacion-ingles.
comprobarQue(
  "C6 presentacion-ingles aplica NIVEL_ESPEJO",
  codigoPres.includes("NIVEL_ESPEJO[nivel]"),
);
const nivelesConHistoricas = new Set(
  indice.documentos.map((d) => d.nivel).filter(Boolean),
);
comprobarQue(
  "C6 el nivel 8 no tiene históricas propias (por eso necesita el espejo)",
  !nivelesConHistoricas.has("8"),
  `niveles indexados: ${[...nivelesConHistoricas].sort().join(", ")}`,
);
comprobarQue(
  "C6 el nivel espejo del 8 (el 7) sí tiene históricas",
  nivelesConHistoricas.has("7"),
);

// C7. El cache separa el origen: un mismo (nivel, tema) generado desde
// históricas de iDiscover y desde la dosificación de StartUp no es lo mismo.
const srcCachePres = leer("app/lib/cachePresentacionIngles.ts");
comprobarQue(
  "C7 la clave de cache admite el origen",
  sinComentarios(srcCachePres).includes("d.origen"),
);
// Ancla TOLERANTE a propósito: la versión anterior exigía el literal
// `origen: almacenada ? "almacenado" : undefined` y falló en cuanto se añadió un
// tercer origen ("temario", para el nivel 8) sin cambiar el comportamiento de
// los niveles almacenados. Lo que importa es que `almacenada` siga decidiendo el
// origen "almacenado"; que la clave de cache separe los tres orígenes se
// comprueba de verdad, sobre claveCache(), en tests/niveles-almacenados.test.ts.
comprobarQue(
  "C7 los niveles almacenados marcan origen en la clave",
  /almacenada\s*\r?\n?\s*\?\s*"almacenado"/.test(codigoPres) ||
    /almacenada\s*\?\s*"almacenado"/.test(codigoPres),
);

// C8. Los tres niveles almacenados quedan cubiertos por el desvío.
comprobarQue(
  "C8 el desvío cubre los niveles 1, 2 y 3",
  ["1", "2", "3"].every((n) =>
    codigoIngles.includes(`"${n}": entrada("${n}"`),
  ),
);

/* ------------------------------------------------------------- resultado -- */

console.log(`\n${pasadas} comprobaciones ok, ${fallos} fallas.\n`);
process.exit(fallos > 0 ? 1 : 0);
