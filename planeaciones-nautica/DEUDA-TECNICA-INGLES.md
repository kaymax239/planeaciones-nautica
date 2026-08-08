# Deuda técnica — flujo de Inglés Marítimo

Levantado durante el alta de los niveles 1, 2 y 3 (StartUp, Pearson) en la rama
`feat/ingles-niveles-1-2-3-startup`, sobre `main` en `9fb86e8`.

Ninguno de estos puntos se corrigió en ese trabajo: el alta de los tres niveles
no exige modificar el flujo de los niveles 4-8, y la regla del cambio era no
refactorizar de paso. Este documento existe para que la deuda quede localizada
con `archivo:línea` y con la decisión que se tomó sobre cada punto.

Contexto imprescindible: los niveles 4-8 **generan** su planeación espejeando
`.docx` históricos de iDiscover (Express Publishing). Los niveles 1, 2 y 3
cambiaron de libro a StartUp (Pearson), así que su contenido es **almacenado**,
no generado, y se desvía antes de tocar el índice histórico.

---

## Resumen

| # | Deuda | Severidad | Decisión |
|---|---|---|---|
| D1 | Fallback iDiscover en el F-32 de cualquier nivel | Alta | **Cerrado en código** (bibliografía derivada del nivel) |
| D2 | `presentacion-ingles` sin espejo → 404 en niveles 1/2/3 | Alta | **Cerrado** en `04d3f56` |
| D3 | Prompt de exámenes hardcodea iDiscover | Media | **Cerrado** (libro derivado del nivel) |
| D4 | `inferirNivel` pierde 15 documentos | Media | **`nivel` no se toca** — la premisa original era falsa |
| D4-bis | Una etiqueta de nivel FALSA alimenta los niveles 7 y 8 | Alta | Abierto |
| D5 | El nivel 1 genera contenido equivocado hoy | Media | Resuelto como efecto colateral |
| D6 | `NIVELES_FALLBACK` desincronizado con la API | Baja | Corregido en el alta |
| D7 | Comentario de placeholders incompleto | Baja | **Cerrado** |
| D8 | Periodo de Inglés desconectado del calendario oficial | Baja | Corregido solo para 1/2/3 |
| D9 | Cero pruebas automatizadas | Baja / riesgo alto | **Suite en vitest** (90 pruebas); PN/MN y `.pptx` sin cubrir |
| D11 | Desbordamiento silencioso de diapositivas en el `.pptx` | Alta | **Cerrado** (paginación real) |
| D10 | Dos proyectos de Vercel enlazados en el mismo repo | Media / riesgo alto | Solo documentado |
| D12 | `observaciones` no existe como campo y no llega al F-32 | Media | Solo documentado — la nota de antología va en `bibliografia` |

---

## D1 — `bibliografiaIDiscover` se estampa como fallback en cualquier nivel

**Severidad: alta.** `app/lib/planeacionInglesF32.js:79-81`

```js
const fuentes = bibValida.length
  ? bibValida.join("\n")
  : bibliografiaIDiscover(nivel);
```

`bibliografiaIDiscover` (líneas 29-34) no discrimina nivel:

```js
return n
  ? `I Discover ${n} Student book & Workbook (2013), Evans, Dooley. Express Publishing.`
  : "I Discover Student book & Workbook (2013), Evans, Dooley. Express Publishing.";
```

Si la planeación llega con `bibliografia` vacía —o con un texto que matchee
`/no\s+especificad/i`, que la línea 78 descarta— el F-32 sale firmado con el
libro de iDiscover. Para los niveles 1/2/3 eso significa imprimir en el
documento oficial exactamente el libro del que esos niveles se están saliendo.

Falla en el `.docx` final, no en el endpoint: nadie se entera hasta que el
documento ya está entregado.

**Decisión: neutralizado por datos.** Las tres entradas de
`app/data/inglesMaritimo.ts` llevan `bibliografia` poblada con tres referencias
de StartUp cada una, así que la línea 81 nunca se dispara para esos niveles.
El archivo no se tocó, y el comportamiento de los niveles 4-8 queda idéntico.

La deuda sigue abierta: cualquier nivel futuro cuya bibliografía llegue vacía
volverá a heredar iDiscover en silencio.

### Evidencia de que el fallback sí se dispara (2026-08-04)

Ya no es un riesgo teórico. `F32_INGLES_NIVEL3_VERIF.docx` —generado antes del
alta de niveles almacenados y sin trackear en la raíz del repo— trae impreso en
la celda FUENTES:

```
I Discover 3 Student book & Workbook (2013), Evans, Dooley. Express Publishing.
```

Cero apariciones de "Pearson". Es un F-32 del nivel 3 con la editorial de la que
ese nivel se está saliendo, y la sección no sale vacía: sale **mal**, que es peor,
porque no hay señal visible de que algo falló.

Contraste con los tres documentos generados por el camino de contenido almacenado
(`F32_INGLES_NIVEL1/2/3.docx`, 2026-08-03): 7 apariciones de "Pearson" cada uno,
las tres referencias de StartUp separadas por `<w:br/>` dentro de la celda.

Dos notas para quien retome esto:

- El texto dice `Student book` (b minúscula). Una búsqueda de `Student Book`
  sensible a mayúsculas no lo encuentra, y la celda parece vacía.
- Iterar celdas con python-docx tampoco muestra el contenido separado por
  `<w:br/>` como líneas distintas; conviene verificar sobre `word/document.xml`.

Refuerza la conclusión: neutralizar por datos no basta, porque el camino que
produjo el `_VERIF` sigue existiendo.

### Cierre en código (2026-08-05)

El camino ya no existe. `app/lib/planeacionInglesF32.js` incorpora una tabla
`LIBRO_POR_NIVEL` —1/2/3 → StartUp (Pearson), 4/5/6/7/8 → iDiscover (Express
Publishing)— y la celda FUENTES se resuelve en tres escalones:

1. La bibliografía del JSON, filtrando vacíos y `/no\s+especificad/i` (igual que antes).
2. Si no hay, `bibliografiaDeNivel(nivel)`: **deriva del nivel**, así que ningún
   nivel puede heredar el libro de otro.
3. Si el nivel no está en la tabla, o no llegó nivel, **no se rellena**. La celda
   sale con un aviso en mayúsculas que nombra la causa, dice qué hay que capturar
   y prohíbe firmar el documento; además se emite un `console.warn`.

**Constancia en el documento, no excepción.** Se eligió dejar rastro visible en
vez de lanzar porque esto corre en el último paso del flujo (`doc.render`, ya en
el navegador, sobre una planeación que costó una llamada al modelo): lanzar
dejaría al docente sin documento y con un error genérico, y el incentivo
inmediato sería reintentar hasta que "saliera", no completar el dato. El aviso,
en cambio, viaja dentro del F-32 y es imposible de entregar sin verlo. Lo que ya
no puede ocurrir es lo que produjo el `_VERIF`: una referencia plausible y
equivocada, que sí se firma sin mirar.

`bibliografiaIDiscover` se conserva **exportada e intacta**, marcada
`@deprecated`, porque la importan `app/api/planeacion-ingles/route.ts` y
`app/api/presentacion-ingles/route.ts`, donde solo alimenta el prompt del camino
de históricas (4-8) — uso legítimo, ese corpus sí es de iDiscover.

**No-regresión de los niveles 4-8, demostrada:** se comparó la salida de
`construirDatosF32DesdeIngles` contra la versión de `HEAD` sobre 375 casos
(niveles 4-8 × 15 variantes de planeación —bibliografía normal / vacía /
ausente / `null` / "No especificada" / mixta, con y sin `enfoque`,
`objetivoGeneral`, `horas` y `evaluacion`— × 5 variantes de `meta`), comparando
el JSON completo del objeto de render. **0 diferencias.** El verificador del
repo sigue en 95 ok / 0 fallas.

Cambia deliberadamente **un** caso que no es de los niveles 4-8: cuando la
planeación llega **sin nivel**, antes se imprimía `I Discover Student book &
Workbook…` sin número; ahora sale el aviso. Ese era precisamente el fallo.

Nota de duplicación: las tres referencias de StartUp viven a la vez en
`refsStartUp` (planeacionInglesF32.js) y en `bibliografiaStartUp`
(app/data/inglesMaritimo.ts). No se unifican porque el módulo del F-32 es `.js`
a propósito —lo carga node directo en `scripts/*.mjs`, donde un import de un
`.ts` no resuelve— y porque `verificar-no-regresion-ingles.mjs` (bloque B1) fija
el texto del lado de los datos. Ambos sitios lo dicen en comentario.

### Efecto colateral: el mismo fallo en la celda ESTRATEGIA

El respaldo de `estrategia` decía, fijo, `"Enfoque iDiscover; aprendizaje activo
y contextualizado del inglés."` para cualquier nivel — mismo fallo de clase, y
solo se dispara si la planeación llega sin `enfoque` **y** sin `objetivoGeneral`.
Ahora pasa por `enfoquePorDefectoDeNivel(nivel)`: 4-8 conservan el texto anterior
carácter por carácter, 1/2/3 dicen StartUp (Pearson), y un nivel desconocido cae
a `"Aprendizaje activo y contextualizado del inglés."`, que **no nombra libro
alguno**. Aquí no hace falta bloquear: una estrategia genérica es una omisión;
una que nombra el libro equivocado es un dato falso.

---

## D2 — `presentacion-ingles` no comparte el mecanismo de espejo

**Severidad: alta.** `app/api/presentacion-ingles/route.ts`

A diferencia de `planeacion-ingles`, sus imports (líneas 9-34) **no incluyen**
`NIVEL_ESPEJO` ni `temarioOficialTexto`. Sí importa `bibliografiaIDiscover`
(línea 13). Y falla duro cuando no hay referencias:

```ts
229	  const referencias = seleccionarReferencias(indice.documentos, nivel, tema);
230	  if (referencias.length === 0) {
231	    const niveles = nivelesDisponibles(indice.documentos);
232	    return error("sin_historicas_nivel", ..., 404, { nivelesDisponibles: niveles });
```

Su prompt hardcodea el libro (línea 127):

```
- Enfoque comunicativo + libro iDiscover (te doy la referencia). NO uses STCW …
```

Con los niveles 1/2/3 ya visibles en el selector, el botón de presentación
devuelve **404** para los tres.

**Decisión original: fuera de alcance.** Era una asimetría preexistente —al
nivel 8 ya le ocurría, por la misma causa— y el alcance del alta se limitó a
`/api/planeacion-ingles`.

### Cerrado en `04d3f56` (verificado 2026-08-05)

`fix(ingles): presentaciones de los niveles almacenados y espejo del nivel 8 (D2)`.
Comprobado contra el código actual de `app/api/presentacion-ingles/route.ts`:

- importa `tienePlaneacionAlmacenada` y `NIVEL_ESPEJO`;
- desvía con `tienePlaneacionAlmacenada(nivel)` **antes** de `leerIndice()`, así
  que 1/2/3 no tocan el corpus histórico (verificador, bloque C3);
- `SYSTEM_PROMPT_ALMACENADO` + `construirMensajeAlmacenado()` arman el prompt
  desde la dosificación oficial y no llaman a `bibliografiaIDiscover` (C4);
- aplica `NIVEL_ESPEJO` para que el nivel 8 se espeje del 7 (C6).

El diagnóstico del commit corrige además el síntoma que esta ficha reportaba: el
404 solo afectaba a los niveles 2 y 8. Los niveles 1 y 3 **sí** respondían, con
diapositivas generadas del libro que acababan de abandonar — el fallo silencioso
de siempre, no un 404.

Sigue abierta la parte de esta ficha que toca a `route.ts:127`
(`- Enfoque comunicativo + libro iDiscover…`) en el prompt del camino de
históricas: ahí es correcto, porque ese camino solo lo recorren los niveles 4-8.

---

## D3 — El prompt de exámenes hardcodea iDiscover

**Severidad: media.** `app/api/examen/route.ts:107`

```ts
const SYSTEM_PROMPT_INGLES = `You write real, institutional English-exam items for cadets at a Mexican merchant-marine academy (iDiscover / communicative approach). …
```

Los exámenes de los niveles 1/2/3 se generarían declarando el enfoque del libro
equivocado en el system prompt.

**Decisión original: fuera de alcance**, junto con D2.

### Cerrado 2026-08-05

El libro sale ahora del nivel, no de una constante. `nivelIngles()` toma
`cuerpo.nivel` si viene y, si no, lo deduce de `materia` (la UI la construye
siempre como `Inglés Nivel N`), así que no hizo falta tocar el cliente:

- niveles almacenados (1/2/3) → prompt con su libro y su enfoque reales, más una
  **prohibición explícita** de mencionar iDiscover o Express Publishing (mismo
  precedente que `presentacion-ingles`);
- niveles 4-8 → el prompt de iDiscover **byte a byte idéntico** al anterior.

**La duda que esta ficha dejaba abierta queda resuelta, y era infundada:**
`/api/examen` **no** exige referencias históricas y **no** puede devolver 404.
No lee el índice — recibe los `temas` ya construidos por el cliente, que los
pide antes a `/api/planeacion-ingles` (`app/components/SeccionIngles.tsx:458`),
donde el desvío 1/2/3 y `NIVEL_ESPEJO` ya actuaron. No hay nada que tratar
"junto con D2".

Con esto, las tres apariciones del libro hardcodeado en caminos que alcanzan a
los niveles 1/2/3 (F-32, presentaciones y exámenes) quedan cerradas.

---

## D4 — `inferirNivel` deja 15 de 44 documentos sin etiquetar

**Severidad: media.** `scripts/indexar-ingles.mjs:65-68`

```js
function inferirNivel(nombre) {
  const base = sinAcentos(nombre).toLowerCase();
  const m = base.match(/(?:lvl|lv|level|nivel)\s*\.?\s*([1-9]\d?)/);
  return m ? m[1] : null;
}
```

Exige `lvl|lv|level|nivel` pegado al número, así que 15 documentos caen a `null`.

Reparto real de `.indice-ingles/indice.json` (44 documentos):

| Nivel | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | `null` |
|---|---|---|---|---|---|---|---|---|---|
| Docs | 1 | 0 | 8 | 4 | 8 | 4 | 4 | 0 | 15 |

**Decisión original: no tocar.** Arreglar la regex le daría al nivel 2
referencias históricas de iDiscover, y el generador empezaría a producir
contenido del libro equivocado.

### Revisión 2026-08-05: la premisa de esta ficha era falsa

La ficha afirmaba, por los nombres de archivo, que había documentos de nivel 2
sin etiquetar. Se leyó el campo ASIGNATURA/CURSO de los 15 (índice v2, campo
`asignaturaTexto`): **ninguno de los 15 es del nivel 2.**

| Qué son | Cuántos | Asignatura declarada | Libro |
|---|---|---|---|
| Inglés Marítimo VIII, clave ING 853 | 9 | `Inglés Marítimo VIII ( MARITIME ENGLISH 2)` | Career Paths **Merchant Navy** |
| Inglés Marítimo VI | 4 | `Inglés Marítimo VI ( Level 6)` | iDiscover 6 |
| No son planeaciones | 2 | (sin campo ASIGNATURA) | plantilla F-32 en blanco · reporte F-26 de observación |

El "2" de `merchantnavy2` / `MARITIME ENGLISH 2` es el número del **curso** de
Inglés Marítimo, no el del nivel.

El desvío {1,2,3} sí está hoy en su sitio y cubre los tres caminos
(`planeacion-ingles/route.ts:359`, `presentacion-ingles/route.ts:296`, y
`examen/route.ts` que no lee el índice en absoluto). Pero eso ya no es lo que
decide este arreglo, porque el nivel 2 no gana ni un documento.

**Decisión: `nivel` NO se toca. Motivo nuevo, no el de antes.**

- Etiquetar los 9 de ING 853 como nivel 8 haría que el nivel 8 dejara de
  espejear al 7 y pasara a espejear **Career Paths Merchant Navy**, mientras su
  temario oficial declara **iDiscover 8** (`app/data/temarioInglesOficial.ts:64`).
  Es D1 otra vez, mudado de nivel.
- Etiquetar los 4 del nivel 6 (iDiscover 6, legítimos) lo pasaría de 4 a 8
  documentos y **desplazaría su top-3 completo**; además dos son copias byte a
  byte, así que el generador recibiría el mismo documento como referencias 1 y 2.
- Los 2 restantes deben quedarse en `null`: no son planeaciones.

**Lo que sí se hizo.** Los 15 se recuperaron como DATO, no como etiqueta. El
índice pasa a **v2** con dos campos de diagnóstico que nadie consume para
seleccionar referencias: `asignaturaTexto` y `nivelSegunTexto` (solo con marca
explícita "lvl/level/nivel N" — nunca deducido del romano del semestre, porque
en este corpus semestre ≠ nivel). El indexador imprime el reparto por nivel, los
documentos sin etiquetar con su asignatura real, y un aviso `⚠ nombre ≠ contenido`.

De propina se corrigió una no-determinación latente: el orden del índice usaba
`localeCompare` (depende del ICU del Node que ejecute el indexador) y ese orden
desempata `seleccionarReferencias`; reindexar en otra máquina podía mover qué
históricas se espejean. Ahora ordena por punto de código.

Reindexado y verificado: reparto por nivel idéntico, los 7 campos de v1 byte a
byte iguales en los 44 documentos, verificador en 95/95.

---

## D4-bis — Una etiqueta de nivel FALSA alimenta los niveles 7 y 8

**Severidad: alta.** Detectado 2026-08-05, **abierto**.

`Copia de INGLES MARITIMO Lvl.7 (1).docx` se etiqueta nivel 7 por su nombre,
pero el documento declara `ASIGNATURA/CURSO: NIVEL 3`, clave `ING317/ING315` y
bibliografía "I Discover 3".

Hoy es la **primera** de las 3 referencias del nivel 7 y, vía
`NIVEL_ESPEJO["8"]="7"`, también del **nivel 8**. Es decir: el nivel 8 se
construye sobre una planeación de nivel 3 mal etiquetada.

Una etiqueta ausente hace que el documento no se use. Una etiqueta falsa hace
que se use **como si fuera otra cosa**, y eso sí llega al prompt.

Está fijado así en la línea base (`verificar-no-regresion-ingles.mjs`, A2 nivel
7), de modo que corregirlo exige actualizar la línea base a la vez. Por eso no
se tocó: el cambio mueve qué históricas se espejean en dos niveles.

---

## D5 — El nivel 1 generaba contenido equivocado en producción

**Severidad: media.** No es deuda estructural, es un bug que ya estaba vivo.

El índice tiene 1 documento con `nivel:"1"` (`Planeación_Didáctica_lvl1.docx`),
así que `app/api/biblioteca-ingles/route.ts:24-27` ya lo incluía en
`nivelesDisponibles`. El selector real devolvía `["1","3","4","5","6","7","8"]`.
Un usuario podía pedir nivel 1 y recibir una planeación espejeada de iDiscover
construida sobre una sola referencia.

**Decisión: resuelto como efecto colateral.** El desvío de los niveles 1/2/3
intercepta antes de leer el índice, así que ese documento ya no alimenta nada.

---

## D6 — `NIVELES_FALLBACK` desincronizado con la API

**Severidad: baja.** `app/components/SeccionIngles.tsx:55`

La constante valía `["3","4","5","6","7","8"]` mientras la API devolvía
`["1","3","4","5","6","7","8"]`. Solo aplica si el `fetch` a
`/api/biblioteca-ingles` falla, pero era una constante que mentía.

**Decisión: corregido en el alta**, por ser una constante de una línea y estar
directamente en el camino del cambio.

---

## D7 — El comentario de placeholders del F-32 está incompleto

**Severidad: baja.** `app/lib/planeacionInglesF32.js`, comentario de cabecera.

El comentario listaba los placeholders de la plantilla y **omitía `evaluacion`**,
que sí se produce dentro de cada semana (`evaluacion: evaluacionSesion`). Quien
lo leyera para saber qué llena la plantilla se perdía una columna.

**Decisión: cerrado (2026-08-05).** Al completarlo se contrastó la lista entera
contra el objeto que devuelve `construirDatosF32DesdeIngles` (42 claves entre
las de primer nivel, las del bloque de unidad y las de cada semana). Faltaban
**22** en total, no solo `evaluacion`: `escuela`, `escuelaNautica`, `licenciatura`,
`claveAsignatura`, `claveAsignaturaCurso`, `numeroCadetes`, `nombreDocente`,
`grupoAsignatura`, `fecha`, `fechaInicio`, `horasTotales`, `horasTeoricas`,
`horasPracticas`, `horasIndependientes`, `creditos`, `horasPorSemana`,
`horasSemana`, `horasXSemana`, `objetivoGeneral`, `unidad` y
`objetivoEspecifico`. El comentario ahora las lista todas y explica por qué hay
alias (`clave`/`claveAsignatura`/`claveAsignaturaCurso`,
`docente`/`nombreDocente`, `horasPorSemana`/`horasSemana`/`horasXSemana`…): la
plantilla institucional no usa un nombre único para el mismo dato.

Ningún elemento de la lista anterior resultó falso; el problema era solo de
omisión.

---

## D8 — El periodo de Inglés está desconectado del calendario oficial

**Severidad: baja.** `app/data/calendario.ts:23`

```ts
export const PERIODO_ESCOLAR = "Julio-Diciembre 2026";
```

Consumido en `app/components/SeccionIngles.tsx:550,660`. Existe
`app/config/calendario.ts` con `AGO_DIC_2026` y las fechas oficiales reales,
pero el flujo de Inglés no lo usa: ni el módulo, ni el tipo `PeriodoEscolar`,
ni el selector de periodo de PN/MN.

**Decisión: corregido solo para los niveles 1/2/3**, que leen de
`app/config/calendario.ts` (`AGO_DIC_2026`). Los niveles 4-8 siguen con
`"Julio-Diciembre 2026"` — corregirlos habría cambiado su salida, que es
justo lo que el alta debía dejar intacto.

Queda, por tanto, una **inconsistencia deliberada**: dentro del mismo módulo de
Inglés conviven dos fuentes de periodo. Unificarlas es trabajo aparte, y toca
la salida de los niveles 4-8.

---

## D9 — Cero pruebas automatizadas en todo el flujo

**Severidad: baja como deuda, alta como riesgo operativo.**

`package.json` no tiene script `test`. No hay `jest`, `vitest`, `mocha`,
`playwright` ni `cypress` en dependencias. No hay archivos `*.test.*` fuera de
`node_modules`. No hay fixtures versionadas para los niveles 4-8.

Lo único cercano es `scripts/generar-planeacion-ingles-docx.mjs`, descrito en su
cabecera como "Prueba E2E — Planeación de Inglés (Nivel 3) a .docx": hardcodea
`nivel = "3"`, necesita el servidor levantado y una API key, y **no tiene una
sola aserción** — solo imprime a consola.

Consecuencia directa: la línea base de no-regresión de los niveles 4-8 no era
ejecutable. Hubo que escribir el script de comparación como parte del alta.

**Decisión original: mitigado, no resuelto.**

### Suite instalada 2026-08-05 — vitest, 90 pruebas

`npm test` (`vitest run`) corre 4 ficheros en `tests/`, sin red, sin servidor y
sin API key (las claves se vacían con `vi.stubEnv`). Cubre:

- **`undefined` silencioso**: el F-32 se renderiza **a propósito sin
  `nullGetter`**, así que un placeholder no alimentado sale como la cadena
  `"undefined"` y la prueba lo caza. Regresión directa de `6e9c412`.
- **Libro por nivel**: sobre el texto del `.docx` real, 1/2/3 no contienen **ni
  una** aparición de iDiscover/Express Publishing; 4-8 llevan el número que les
  toca y nunca el de otro nivel.
- **Desvíos y espejo**: comprobados espiando `leerIndice`, no leyendo el fuente.
- **Contratos de los endpoints**: claves y códigos de error.

**Lo que la suite NO cubre, y conviene no olvidar:**

- **El F-32 de PN/MN**, que es donde nació el bug de los créditos. Su objeto de
  render se arma *inline* dentro de `app/page.tsx` (componente cliente), no en
  una función importable. **Extraer esa lógica a `app/lib/` es la condición para
  poder cubrirlo**, y sigue pendiente.
- El generador de exámenes y todo el camino `.pptx`.
- Cualquier cosa aguas abajo de una llamada real al modelo.
- El **layout** del documento: se verifica el texto, no que cada dato caiga en su
  celda.

`scripts/verificar-no-regresion-ingles.mjs` queda como herramienta manual
(`npm run verificar:ingles`), **fuera** de `npm test`: se apoya en anclas
textuales sobre el fuente y ya produjo un falso positivo al refactorizarse un
literal. Un script de anclas no sirve como puerta de calidad.

---

## D10 — Dos proyectos de Vercel enlazados en el mismo repositorio

**Severidad: media / riesgo alto de despliegue equivocado.** Detectado 2026-08-04.

El repositorio tiene dos enlaces de Vercel superpuestos:

| Ruta | `.vercel/project.json` | Proyecto |
|---|---|---|
| `rutas-tampico/` (raíz git) | `prj_MmCg6EvUQe8PNejwcssNyRUEYkjV` | `rutas-tampico` |
| `rutas-tampico/planeaciones-nautica/` | `prj_zsNRwiOgRjfb36dKeAmkhzjJnsZE` | `planeaciones-nautica` |

Ambos bajo el team `team_8C1NtOVRRxW95wpRAOzYQaYX` (scope `victors-projects-cfa2b71b`).

El proyecto `planeaciones-nautica` tiene **Root Directory = `planeaciones-nautica`**.
De ahí salen dos fallas distintas, y ninguna avisa de forma clara:

1. **Desde el subdirectorio**, `vercel deploy` toma el enlace correcto pero le
   vuelve a aplicar el Root Directory, y busca
   `planeaciones-nautica/planeaciones-nautica`. Falla con
   `Error: The provided path ... does not exist`. Molesto pero visible.

2. **Desde la raíz del repo** —que es la ruta correcta para este proyecto—
   `vercel deploy` toma el enlace de la raíz y despliega **`rutas-tampico`**,
   el proyecto equivocado. Termina con éxito. Ese es el peligro real: no hay
   error, y quien lo corra creerá que publicó planeaciones.

Hoy se esquiva pasando el proyecto explícito por variables de entorno, sin
tocar configuración ni los `.vercel`:

```bash
cd "D:/Disco C/Proyectos/rutas-tampico"
VERCEL_ORG_ID=team_8C1NtOVRRxW95wpRAOzYQaYX \
VERCEL_PROJECT_ID=prj_zsNRwiOgRjfb36dKeAmkhzjJnsZE \
vercel deploy --scope victors-projects-cfa2b71b
```

### Nota adicional sobre `vercel promote`

`vercel promote` sobre un deployment de **preview** no reasigna el alias:
construye uno nuevo con las variables de entorno de producción. El artefacto
publicado no es el mismo binario que se revisó en el preview, que se construyó
con env de preview. Además el deployment resultante quedó `target: production`
y `Ready` pero **sin tomar el alias de producción**; hizo falta un segundo
`promote`, ya sobre el deployment de producción, para moverlo. Un `READY` en
Vercel no prueba que el alias haya cambiado: hay que resolver
`vercel inspect <dominio>` y comparar el id.

**Decisión: solo documentado.** No se tocó ningún `.vercel` ni la configuración
de ninguno de los dos proyectos.

**Actualización 2026-08-05:** el proyecto `planeaciones-nautica` **ya tiene
integración Git**, con `main` como rama de producción. Producción corre hoy el
HEAD de `main` desplegado por push, no por `vercel --prod` manual. El riesgo de
desplegar el proyecto equivocado desde la raíz del repo **sigue existiendo** si
alguien vuelve a lanzar `vercel deploy` a mano, pero ya no hace falta hacerlo.

---

## D11 — Desbordamiento silencioso de diapositivas en el `.pptx`

**Severidad: alta.** Detectado y **cerrado** 2026-08-05.
`app/lib/pptxOficialV2.ts`

El renderer apilaba bloques sumando alturas **sin comprobar nunca el borde
inferior** de la diapositiva. Una diapositiva que cumple exactamente lo que el
prompt autoriza (`tabla` de 6 filas + `bullets` de 6 + `nota`) terminaba en
**y = 8.84 pulgadas sobre un lienzo de 7.5**: la `nota` quedaba entera fuera de
la diapositiva. No falla, no avisa, no recorta — simplemente no se proyecta.

No era teórico ni exclusivo del contenido generado por IA: el deck determinista
ya versionado en el repo (`app/data/presentaciones/algebra-u1-v2.ts`) tenía **2
diapositivas desbordadas**.

Mismo fallo de clase que D1 y que el `CRÉDITOS TOTALES: undefined`: el documento
sale mal sin ninguna señal.

**Cerrado con paginación real**: lo que no cabe pasa a una página *(cont.)*, con
listas y tablas partidas por ítems/filas (la tabla repite encabezados) y
numeración recalculada. Medido A/B contra el renderer anterior sobre el deck de
Álgebra: **ni un texto perdido**; las únicas diferencias son las 3 páginas
*(cont.)* que rescatan lo que se salía. Un deck que hoy cabe sale igual.

Se cerraron a la vez otros cuatro fallos silenciosos del mismo camino: el
literal *"Continuamos con la Unidad 2"* que salía en cualquier deck (incluidos
los de Inglés English-only), el `subtitulo` de diapositiva que el renderer nunca
dibujaba, los separadores de portada con el hueco de un campo vacío, y los
bloques/diapositivas sin contenido real que llegaban como cajas vacías.

**Abierto:** las alturas se estiman por número de caracteres (`estLineas`), sin
medir la fuente. Un texto muy largo puede aún desbordar *su caja* y solaparse
con el bloque siguiente — no salirse de la diapositiva, que era lo grave.
Medirlo bien exige una API de medición de texto que `pptxgenjs` no ofrece.

---

## D12 — `observaciones` no existe como campo y nunca llega al F-32

**Severidad: media.** Detectado 2026-08-08, **abierto — solo documentado**.

Al recibir las indicaciones oficiales de derechos de autor de la antología
(Pedagogía y Formación, 3 de agosto de 2026) se intentó alojarlas en
`observaciones`, que es donde semánticamente van. No se pudo: **ese campo no
existe en los datos**, y la cadena está rota en cuatro eslabones a la vez.

| Eslabón | Estado |
|---|---|
| Campo en `PlaneacionInglesAlmacenada` (`app/data/inglesMaritimo.ts:77-117`) | **no declarado** |
| `planeacionDesdeAlmacenada` (`inglesMaritimo.ts:1310`) | lee `datos.observaciones` —el formulario— nunca la entrada |
| `construirDatosF32DesdeIngles` (`app/lib/planeacionInglesF32.js:291-347`) | **no emite** la clave |
| `public/templates/F-32.docx` | **sin placeholder** `{observaciones}` |

`observaciones` es en realidad un input de la UI
(`app/components/SeccionIngles.tsx:160`, textarea *"Indicaciones adicionales
para la planeación…"*) cuyo único efecto es condicionar el prompt del modelo.
Para los niveles 1/2/3, que se desvían antes de la IA, **no tiene ningún
efecto observable**: se escribe, se envía y se descarta en silencio.

**El detalle que lo vuelve una trampa:** la plantilla **sí trae el rótulo**
`OBSERVACIONES` —texto literal, justo después de `{/unidadBloques}` y antes de
`PLAN DE EVALUACIÓN`— con la celda de contenido **vacía**. Quien abra el F-32
ve la sección rotulada y asume que se llena sola. Es exactamente el patrón de
`creditos` (ficha D7 y commit `0f90ba3`), con la diferencia de que `creditos`
ya se cerró y hoy imprime.

Los 32 placeholders reales de la plantilla, verificados concatenando **todos**
los runs `<w:t>` antes de buscar (sin concatenar, varios salen partidos —
`{ / escuelaNautica / }`, `{ / horasTotales / }`, `{ / objetivoGeneral / }`— y
se concluye por error que no existen):

```
periodo asignatura clave escuelaNautica cadetes docente horasTotales
horasTeoricas horasPracticas horasIndependientes horasSemana creditos grupo
objetivoGeneral fuentes | #unidadBloques objetivoEspecifico estrategia
#semanas semana tema secuencia recursos producto evaluacion /semanas
/unidadBloques | fechaParcial1 fechaParcial2 pctActividades pctParticipacion
pctConocimiento
```

**Decisión: no se arregla; la nota se aloja en `bibliografia`.** Repararlo
exige cuatro cambios, uno de ellos **binario sobre la plantilla que comparten
los ocho niveles** — desproporcionado frente a añadir una cadena al arreglo que
ya viaja por una ruta viva y probada (`inglesMaritimo.ts:268 →
planeacionDesdeAlmacenada:1309 → planeacionInglesF32.js:212-218 → {fuentes}`).
La nota sale como cuarto renglón bajo *FUENTES DE INFORMACIÓN DE REFERENCIA Y
CONSULTA DE LA ASIGNATURA*, que es un sitio defendible para una nota sobre la
antología y sus derechos.

**`recursos` se evaluó y se descartó**, pese a ser el candidato intuitivo. El
`recursos` de primer nivel está muerto por triplicado: vale `[]`
(`inglesMaritimo.ts:267`), el constructor nunca lo lee, y no tiene placeholder
de primer nivel. El `{recursos}` que sí imprime vive **dentro del loop
`{#semanas}`**: la nota se repetiría 18 veces por documento, intercalada entre
"StartUp 1 Workbook" y los audios.

**Riesgo que queda vivo:** cualquiera que en el futuro escriba en el textarea
de observaciones esperando verlo en el F-32 no lo verá, y no habrá ninguna
señal. Es el mismo fallo de clase que D1 y D11 — el documento sale mal, o
incompleto, sin avisar. El arreglo completo sería: declarar el campo en el
tipo, leerlo de la entrada en `:1310`, emitirlo en el constructor, e insertar
`{observaciones}` en la celda huérfana de la plantilla.
