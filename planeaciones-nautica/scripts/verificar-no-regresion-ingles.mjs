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

/** Igual que `comprobar`, pero el ORDEN de las propiedades de un objeto no
 *  cuenta. `comprobar` compara JSON.stringify, que sí distingue
 *  {total,teoricas} de {teoricas,total}: reordenar campos dentro de un objeto
 *  es un refactor puro y no puede poner el verificador en rojo. Los ARREGLOS
 *  siguen comparándose en orden, que ahí sí es dato (la bibliografía). */
const ordenarClaves = (v) =>
  Array.isArray(v)
    ? v.map(ordenarClaves)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, ordenarClaves(v[k])]),
        )
      : v;

function comprobarObjeto(nombre, real, esperado) {
  comprobar(nombre, ordenarClaves(real), ordenarClaves(esperado));
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

/* -------------------------------------------------- carga en runtime del .ts */
//
// Las anclas de texto de este script fijan CÓMO está escrito el código, no qué
// hace, y por eso dan falsos positivos al refactorizar (ver la nota de arriba y
// la ficha D9). Donde se pueda, es mejor evaluar el módulo de verdad.
//
// `app/data/inglesMaritimo.ts` no se puede importar con node a secas: es
// TypeScript —lo resuelve el type stripping nativo de Node ≥22.6— pero importa
// `../config/calendario` SIN extensión, y el resolutor de ESM no completa ".ts".
// El hook de abajo solo interviene cuando la resolución normal ya falló, así que
// no altera ninguna otra importación. Sin dependencias: `jiti` y `tsx` existen
// en node_modules, pero solo como TRANSITIVAS (eslint/vitest/tailwind), y este
// script no debe apoyarse en algo que un dedupe puede llevarse.

async function cargarModuloTs(rel) {
  const { registerHooks } = await import("node:module");
  const { existsSync } = await import("node:fs");
  const { pathToFileURL, fileURLToPath: aRuta } = await import("node:url");
  if (typeof registerHooks !== "function") return null; // Node < 22.15

  // El type stripping avisa de package.json sin "type": ruido, no un problema.
  const silenciado = process.listeners("warning");
  process.removeAllListeners("warning");
  process.on("warning", (w) => {
    if (!/MODULE_TYPELESS_PACKAGE_JSON/.test(w.message)) console.warn(w);
  });

  try {
    registerHooks({
      resolve(especificador, contexto, siguiente) {
        try {
          return siguiente(especificador, contexto);
        } catch (err) {
          if (!especificador.startsWith(".") || !contexto.parentURL) throw err;
          const base = new URL(especificador, contexto.parentURL);
          for (const ext of [".ts", ".tsx", "/index.ts"]) {
            const candidato = new URL(base.href + ext);
            if (existsSync(aRuta(candidato))) {
              return { url: candidato.href, shortCircuit: true };
            }
          }
          throw err;
        }
      },
    });
    return await import(pathToFileURL(path.join(RAIZ, rel)).href);
  } catch (err) {
    console.error(`  aviso: no se pudo cargar ${rel} en runtime (${err.code ?? err.message})`);
    return null;
  } finally {
    process.removeAllListeners("warning");
    for (const l of silenciado) process.on("warning", l);
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

// A6. Bibliografía iDiscover intacta (la usan 4-8 como respaldo).
//
// EN RUNTIME. Antes esto buscaba el literal con `${n}` dentro del fuente, o sea
// fijaba cómo está ESCRITA la plantilla, no qué devuelve. Pasaba en verde por
// casualidad: seguía existiendo una plantilla con esa forma exacta. Reescribirla
// con concatenación, o renombrar la variable de interpolación, la habría puesto
// en rojo sin cambiar una coma de la salida — el mismo defecto que tenía C4.
const modF32 = await cargarModuloTs("app/lib/planeacionInglesF32.js");
comprobarQue(
  "A6 planeacionInglesF32.js se evalúa en runtime",
  Boolean(modF32?.bibliografiaDeNivel && modF32?.bibliografiaIDiscover),
);

for (const n of ["4", "5", "6", "7", "8"]) {
  const esperado = `I Discover ${n} Student book & Workbook (2013), Evans, Dooley. Express Publishing.`;
  comprobar(
    `A6 nivel ${n}: bibliografiaDeNivel devuelve la referencia de iDiscover`,
    modF32?.bibliografiaDeNivel(n) ?? null,
    [esperado],
  );
  comprobar(
    `A6 nivel ${n}: bibliografiaIDiscover conserva su texto`,
    modF32?.bibliografiaIDiscover(n) ?? null,
    esperado,
  );
}

// El caso que cerró 61a5f9e: sin nivel no se puede inventar una referencia.
comprobar(
  "A6 sin nivel, bibliografiaDeNivel no inventa libro",
  modF32?.bibliografiaDeNivel("") ?? null,
  [],
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

// A9. El desvío captura 1/2/3 y VII, y NUNCA puede alcanzar a 4-8.
//
// La versión anterior enumeraba con `"(\d+)"`, o sea SOLO claves numéricas.
// Con VII dada de alta eso dejaba de ser "la lista de niveles almacenados" y
// pasaba a ser "los numerados", en silencio: la entrada nueva no aparecía ni
// para bien ni para mal. Ahora se enumeran TODAS las claves y se compara la
// lista completa.
const clavesAlmacenadas = [
  ...srcIngles.matchAll(/^\s{2}"([^"]+)":\s*entrada\(/gm),
].map((m) => m[1]);
comprobar("A9 niveles almacenados", clavesAlmacenadas.sort(), ["1", "2", "3", "VII"]);
for (const n of ["4", "5", "6", "7", "8"]) {
  comprobarQue(
    `A9 el nivel ${n} NO está almacenado (sigue espejeando históricas)`,
    !clavesAlmacenadas.includes(n),
  );
}

/* --------------------------- B) niveles almacenados: especificación ------ */

console.log(
  "\nB) Niveles almacenados — 1/2/3 (StartUp) y VII (Merchant Navy)\n",
);

// B1. Bibliografía poblada: la comprobación que previene D1.
//
// EN RUNTIME, no por ancla de texto. Antes esto era un regex contra el fuente
// (`/bibliografia:\s*bibliografiaStartUp\(Number\(nivel\)\)/`) que dejó de
// matchear en cuanto la línea pasó a un spread para añadir la nota de antología
// — sin que nada se hubiera roto. Es el falso positivo que describe D9. Ahora se
// llama a `planeacionDesdeAlmacenada` y se mira el arreglo que de verdad sale.
const RE_NO_ESPECIFICADA = /no\s+especificad/i;
const RE_LIBRO_ABANDONADO = /i\s?discover|express publishing|marlin'?s/i;

// La nota de antología (D12) es la CUARTA entrada, idéntica en los tres niveles.
const NOTA_ESPERADA =
  "Antología: elaborada por el docente. Cada ejercicio, imagen o texto lleva " +
  "cita; se utiliza menos del 10% de cada obra; la primera página incluye la " +
  "leyenda institucional de uso académico (Pedagogía y Formación, 3 de " +
  "agosto de 2026).";

const modIngles = await cargarModuloTs("app/data/inglesMaritimo.ts");
comprobarQue(
  "B1 inglesMaritimo.ts se evalúa en runtime (no por ancla de texto)",
  Boolean(modIngles?.planeacionDesdeAlmacenada),
  "sin esto B1 no puede comprobar comportamiento; revisa la versión de Node",
);

/** Bibliografía REAL del nivel, tal como la recibe el generador del F-32. */
const bibliografiaReal = (n) =>
  modIngles?.planeacionDesdeAlmacenada(n, {})?.bibliografia ?? null;

const notas = [];

for (const n of ["1", "2", "3"]) {
  const generadas = bibliografiaReal(n);
  comprobarQue(`B1 nivel ${n}: planeacionDesdeAlmacenada devuelve bibliografía`, Array.isArray(generadas));
  if (!Array.isArray(generadas)) continue;
  notas.push(generadas[3]);

  comprobar(`B1 nivel ${n}: 4 entradas (3 referencias + nota)`, generadas.length, 4);
  comprobar(`B1 nivel ${n}: bibliografía generada`, generadas, [
    `Pearson Education. (2019). StartUp Level ${n} Student Book. Pearson Education.`,
    `Pearson Education. (2019). StartUp Level ${n} Teacher's Edition. Pearson Education.`,
    `Pearson Education. (2019). StartUp Level ${n} Workbook. Pearson Education.`,
    NOTA_ESPERADA,
  ]);
  comprobar(`B1 nivel ${n}: la 4a entrada es la nota de antología`, generadas[3], NOTA_ESPERADA);
  comprobarQue(
    `B1 nivel ${n}: ninguna referencia vacía`,
    generadas.every((s) => typeof s === "string" && s.trim().length > 0),
  );
  comprobarQue(
    `B1 nivel ${n}: ninguna matchea /no especificad/i`,
    generadas.every((s) => !RE_NO_ESPECIFICADA.test(s)),
  );
  comprobarQue(
    `B1 nivel ${n}: ninguna nombra el libro abandonado`,
    generadas.every((s) => !RE_LIBRO_ABANDONADO.test(s)),
  );
}

// Los tres documentos oficiales tienen que declarar LO MISMO sobre los derechos
// de la antología: tres redacciones distintas serían un defecto, no una variante.
comprobar("B1 la nota se leyó en los tres niveles", notas.length, 3);
comprobarQue(
  "B1 la nota de antología es idéntica en los tres niveles",
  notas.length === 3 && new Set(notas).size === 1,
  `variantes distintas: ${new Set(notas).size}`,
);

// B1-VII. Misma comprobación, con las referencias que le tocan a VII. No es un
// caso especial exento: es otra fila con sus propios literales exigidos enteros.
// Ojo: la editorial de VII SÍ es Express Publishing (Career Paths lo es) y sí
// cita a Marlins, así que RE_LIBRO_ABANDONADO no le aplica; lo que no puede
// aparecer es el TÍTULO del libro abandonado ni nada de StartUp/Pearson.
const RE_TITULO_IDISCOVER = /i\s?discover/i;
const RE_STARTUP = /startup|pearson/i;

const BIBLIOGRAFIA_VII_ESPERADA = [
  "Evans, V., & Dooley, J. Career Paths: Merchant Navy, Book 1. Express Publishing.",
  "Nisbet, A., Whitcher, A., & Logie, C. (1997). Marlins English for Seafarers " +
    "Study Pack 1. Marlins, Edinburgh, UK.",
];

const bibVII = bibliografiaReal("VII");
comprobarQue(
  "B1 VII: planeacionDesdeAlmacenada devuelve bibliografía",
  Array.isArray(bibVII),
);
comprobar("B1 VII: 2 entradas (Merchant Navy + Marlins)", bibVII?.length ?? null, 2);
comprobar("B1 VII: bibliografía íntegra", bibVII ?? null, BIBLIOGRAFIA_VII_ESPERADA);
comprobarQue(
  "B1 VII: ninguna referencia vacía",
  Array.isArray(bibVII) &&
    bibVII.every((s) => typeof s === "string" && s.trim().length > 0),
);
comprobarQue(
  "B1 VII: ninguna matchea /no especificad/i",
  Array.isArray(bibVII) && bibVII.every((s) => !RE_NO_ESPECIFICADA.test(s)),
);
comprobarQue(
  "B1 VII: ninguna nombra el título del libro abandonado",
  Array.isArray(bibVII) && bibVII.every((s) => !RE_TITULO_IDISCOVER.test(s)),
);
comprobarQue(
  "B1 VII: ninguna nombra StartUp / Pearson",
  Array.isArray(bibVII) && bibVII.every((s) => !RE_STARTUP.test(s)),
);
comprobarQue(
  "B1 VII: no hereda la nota de antología de los niveles 1-3",
  Array.isArray(bibVII) && !bibVII.includes(NOTA_ESPERADA),
);

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
// Lo que esta comprobación protege es el DESGLOSE del 15%: el molde de ING853
// repartía esos puntos entre workbook y Marlin's, y aquí se sustituyó por
// 3/6/6. Se comprobaba sobre el archivo entero, lo cual funcionaba mientras
// todos los niveles almacenados fueran StartUp. VII es Marlins English for
// Seafarers Study Pack 1: la palabra aparece legítimamente en su bibliografía,
// su enfoque y su dosificación. Se acota al bloque del desglose, que es lo que
// de verdad se quería vigilar. Si el bloque no aparece, falla.
const bloqueDesglose = (codigoIngles.match(
  /const DESGLOSE_PARTICIPACION[^=]*=\s*\[[\s\S]*?\n\];/,
) ?? [""])[0];
comprobarQue(
  "B3 el desglose no referencia a Marlin's",
  bloqueDesglose !== "" && !/marlin/i.test(bloqueDesglose),
);
comprobarQue(
  "B3 el desglose suma los 15 puntos de participación",
  /puntos:\s*15,/.test(srcIngles),
);

// B4. Datos comunes de la especificación (molde de StartUp, niveles 1-3).
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

// B4-bis. Las anclas de arriba miran el FUENTE: dicen que en algún sitio del
// archivo existe `total: 112`, no que el nivel 1 tenga 112 horas. Mientras
// todos los almacenados compartían el molde eso alcanzaba; con VII ya no, y
// además `total: 90` existe ahora en el mismo archivo sin que ninguna
// comprobación lo ate a ningún nivel.
//
// Aquí se evalúa el módulo y se compara la FICHA COMPLETA de cada nivel contra
// su fila. Nada de listas de exclusión: VII se exige igual de fuerte que 1/2/3,
// contra sus propias cifras.
const FICHA_OFICIAL = {
  "1": { clave: "ING 208", semestre: 1, libro: "StartUp 1", docente: "Víctor Cadena",
    horas: { total: 112, teoricas: 32, practicas: 80, independientes: 32, porSemana: 7, creditos: 9 } },
  "2": { clave: "ING 208", semestre: 1, libro: "StartUp 2", docente: "Víctor Cadena",
    horas: { total: 112, teoricas: 32, practicas: 80, independientes: 32, porSemana: 7, creditos: 9 } },
  "3": { clave: "ING 208", semestre: 1, libro: "StartUp 3", docente: "Víctor Cadena",
    horas: { total: 112, teoricas: 32, practicas: 80, independientes: 32, porSemana: 7, creditos: 9 } },
  VII: { clave: "ING746", semestre: 7, libro: "Career Paths: Merchant Navy 1", docente: "",
    horas: { total: 90, teoricas: 20, practicas: 70, independientes: 30, porSemana: 5, creditos: 7.5 } },
};

const entradas = modIngles?.PLANEACIONES_INGLES_ALMACENADAS ?? null;
comprobarQue("B4 PLANEACIONES_INGLES_ALMACENADAS accesible en runtime", !!entradas);
comprobar(
  "B4 los niveles almacenados en runtime son 1, 2, 3 y VII",
  entradas ? Object.keys(entradas).sort() : null,
  ["1", "2", "3", "VII"],
);

for (const [n, ficha] of Object.entries(FICHA_OFICIAL)) {
  const e = entradas?.[n] ?? null;
  comprobarQue(`B4 nivel ${n}: la entrada existe`, !!e);
  if (!e) continue;
  // Igualdad EXACTA de las seis cifras, en bloque: cambiar una sola falla, y
  // sobrar o faltar un campo también. Solo el orden de las propiedades da igual.
  comprobarObjeto(`B4 nivel ${n}: horas oficiales`, e.horas, ficha.horas);
  comprobar(`B4 nivel ${n}: clave`, e.clave, ficha.clave);
  comprobar(`B4 nivel ${n}: semestre`, e.semestre, ficha.semestre);
  comprobar(`B4 nivel ${n}: libro`, e.libro, ficha.libro);
  comprobar(`B4 nivel ${n}: docente`, e.docente, ficha.docente);
  comprobarQue(
    `B4 nivel ${n}: total = teóricas + prácticas`,
    e.horas.teoricas + e.horas.practicas === e.horas.total,
    `${e.horas.teoricas} + ${e.horas.practicas} ≠ ${e.horas.total}`,
  );
  comprobarQue(
    `B4 nivel ${n}: objetivo general poblado`,
    typeof e.objetivoGeneral === "string" && e.objetivoGeneral.trim().length > 20,
  );
  comprobarQue(
    `B4 nivel ${n}: enfoque poblado`,
    typeof e.enfoque === "string" && e.enfoque.trim().length > 0,
  );
}

// Y que las dos fichas no se hayan fundido en una: si un `??` dejara de tomar
// el override de VII, la entrada saldría con las cifras de los niveles 1-3.
comprobarQue(
  "B4 VII no hereda el molde de StartUp (horas, clave, semestre y libro propios)",
  !!entradas &&
    JSON.stringify(ordenarClaves(entradas.VII?.horas)) !==
      JSON.stringify(ordenarClaves(entradas["1"]?.horas)) &&
    entradas.VII?.clave !== entradas["1"]?.clave &&
    entradas.VII?.semestre !== entradas["1"]?.semestre &&
    !/startup/i.test(entradas.VII?.libro ?? "startup"),
);

// B5. Dosificación: 18 semanas correlativas y completas en los tres niveles.
// (Sustituye a la comprobación de "secuenciaSemanal vacío" del commit anterior.)
const bloqueSecuencia = (n) => {
  const ini = srcIngles.indexOf(`const SECUENCIA_NIVEL_${n}: SemanaSecuencia[] = [`);
  if (ini < 0) return "";
  const fin = srcIngles.indexOf("\n];", ini);
  return fin < 0 ? "" : srcIngles.slice(ini, fin);
};

const CORRELATIVO = Array.from({ length: 18 }, (_, i) => i + 1).join(",");
const resumenSecuencias = ["1", "2", "3", "VII"].map((n) => {
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
  "B5 dosificación: 18 semanas correlativas con sus 5 campos en los 4 niveles",
  resumenSecuencias,
  [
    "n1:18:1-18:campos-ok",
    "n2:18:1-18:campos-ok",
    "n3:18:1-18:campos-ok",
    "nVII:18:1-18:campos-ok",
  ],
);

// B5-bis. Lo de arriba cuenta líneas del FUENTE. En runtime se comprueba lo que
// de verdad recibe el generador del F-32: 18 semanas correlativas, con los cinco
// campos poblados, en los CUATRO niveles.
for (const n of ["1", "2", "3", "VII"]) {
  const sem = modIngles?.planeacionDesdeAlmacenada(n, {})?.secuenciaSemanal ?? null;
  comprobar(`B5 nivel ${n}: 18 semanas en runtime`, sem?.length ?? null, 18);
  comprobar(
    `B5 nivel ${n}: numeradas 1..18 sin huecos`,
    (sem ?? []).map((s) => s.semana).join(","),
    CORRELATIVO,
  );
  comprobarQue(
    `B5 nivel ${n}: las 18 semanas traen sus cinco campos poblados`,
    Array.isArray(sem) &&
      sem.every(
        (s) =>
          typeof s.contenido === "string" && s.contenido.trim() !== "" &&
          typeof s.evidencias === "string" && s.evidencias.trim() !== "" &&
          Array.isArray(s.actividades) && s.actividades.length > 0 &&
          Array.isArray(s.recursos) && s.recursos.length > 0,
      ),
  );
}

// B6. ids de las cuatro entradas. El literal es una plantilla con `${nivel}`, así
// que se comprueba el id REAL de cada entrada, no que el archivo la contenga.
const ID_ESPERADO = {
  "1": "ingles-maritimo-n1-sem1-2026b",
  "2": "ingles-maritimo-n2-sem1-2026b",
  "3": "ingles-maritimo-n3-sem1-2026b",
  VII: "ingles-maritimo-nVII-sem1-2026b",
};
for (const [n, id] of Object.entries(ID_ESPERADO)) {
  comprobar(`B6 id del nivel ${n}`, entradas?.[n]?.id ?? null, id);
}
comprobarQue(
  "B6 los ids son distintos entre sí (ninguna entrada pisa a otra)",
  new Set(Object.values(ID_ESPERADO)).size === Object.keys(ID_ESPERADO).length,
);

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
// La tercera comprobación de C4 —"el camino de históricas conserva
// bibliografiaIDiscover", que buscaba `bibliografiaIDiscover(nivel)` en este
// fuente— YA NO VIVE AQUÍ, y no por indulgencia: fijaba el NOMBRE de la función
// que produce la referencia del libro, no el hecho de que la referencia salga.
// En 61a5f9e esa llamada pasó a `bibliografiaDeNivel(nivel)` —idéntica para los
// niveles 4-8, y además arregla 1/2/3 y el caso sin nivel— y el ancla llevaba
// desde entonces en rojo sin que nada estuviera roto.
//
// El comportamiento se comprueba ahora donde SÍ se puede ejecutar el prompt,
// en tests/libro-por-nivel.test.ts:
//   "El prompt de presentaciones lleva el libro de SU nivel"
//     · niveles 4-8: el prompt de históricas nombra I Discover N, y no el de
//       otro nivel;
//     · niveles 1-3: el prompt almacenado no lleva la referencia del libro
//       abandonado y sí la de StartUp.
// Este script no puede hacerlo: importar el route arrastra dependencias con
// sintaxis que el type stripping de Node no soporta (parameter properties).

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

// C8. Los cuatro niveles almacenados quedan cubiertos por el desvío.
comprobarQue(
  "C8 el desvío cubre los niveles 1, 2, 3 y VII",
  // La entrada de VII está formateada en varias líneas (lleva `extras`), así
  // que el ancla tolera el salto de línea — pero sigue exigiendo que la clave
  // del mapa y el nivel que se le pasa a `entrada()` sean EL MISMO.
  ["1", "2", "3", "VII"].every((n) =>
    new RegExp(`"${n}":\\s*entrada\\(\\s*"${n}"`).test(codigoIngles),
  ),
);
comprobarQue(
  "C8 tienePlaneacionAlmacenada acierta en los cuatro niveles y falla en 4-8",
  ["1", "2", "3", "VII"].every((n) => modIngles?.tienePlaneacionAlmacenada(n)) &&
    ["4", "5", "6", "7", "8"].every(
      (n) => !modIngles?.tienePlaneacionAlmacenada(n),
    ),
);

/* ------------------------------------------------------------- resultado -- */

console.log(`\n${pasadas} comprobaciones ok, ${fallos} fallas.\n`);
process.exit(fallos > 0 ? 1 : 0);
