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
| D1 | Fallback iDiscover en el F-32 de cualquier nivel | Alta | Neutralizado por datos, no por código |
| D2 | `presentacion-ingles` sin espejo → 404 en niveles 1/2/3 | Alta | Fuera de alcance |
| D3 | Prompt de exámenes hardcodea iDiscover | Media | Fuera de alcance |
| D4 | `inferirNivel` pierde 15 documentos | Media | No tocar deliberadamente |
| D5 | El nivel 1 genera contenido equivocado hoy | Media | Resuelto como efecto colateral |
| D6 | `NIVELES_FALLBACK` desincronizado con la API | Baja | Corregido en el alta |
| D7 | Comentario de placeholders incompleto | Baja | Abierto |
| D8 | Periodo de Inglés desconectado del calendario oficial | Baja | Corregido solo para 1/2/3 |
| D9 | Cero pruebas automatizadas | Baja / riesgo alto | Mitigado con script de comparación |

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

**Decisión: fuera de alcance.** Es una asimetría preexistente —al nivel 8 ya le
ocurre hoy, por la misma causa— y el alcance del alta se limitó a
`/api/planeacion-ingles`. Queda documentada aquí porque un usuario la va a leer
como "el alta quedó rota", no como una limitación anterior.

---

## D3 — El prompt de exámenes hardcodea iDiscover

**Severidad: media.** `app/api/examen/route.ts:107`

```ts
const SYSTEM_PROMPT_INGLES = `You write real, institutional English-exam items for cadets at a Mexican merchant-marine academy (iDiscover / communicative approach). …
```

Los exámenes de los niveles 1/2/3 se generarían declarando el enfoque del libro
equivocado en el system prompt.

**Decisión: fuera de alcance**, junto con D2. No se auditó si este endpoint
además exige referencias históricas; si las exige, el síntoma será el mismo 404
de D2 y habrá que tratarlos juntos.

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

Exige `lvl|lv|level|nivel` pegado al número. Documentos que son claramente de
nivel 2 caen a `null`: `merchantnavy2.docx`,
`INGLES maritimo 2(merchant navy) C MN New.docx`,
`Planeación_cadena_VIIB_merchantnavy2.docx`, entre otros.

Reparto real de `.indice-ingles/indice.json` (44 documentos):

| Nivel | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | `null` |
|---|---|---|---|---|---|---|---|---|---|
| Docs | 1 | 0 | 8 | 4 | 8 | 4 | 4 | 0 | 15 |

**Decisión: no tocar, deliberadamente.** Arreglar la regex le daría al nivel 2
referencias históricas de iDiscover; con referencias, el generador dejaría de
dar 404 y empezaría a producir contenido del libro equivocado — el escenario
exacto que el desvío evita. Este arreglo solo tiene sentido *después* de que el
desvío {1,2,3} esté en su lugar, y aun entonces solo si alguien quiere recuperar
ese corpus para otro fin.

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

**Severidad: baja.** `app/lib/planeacionInglesF32.js:9-12`

El comentario lista los placeholders de la plantilla y **omite `evaluacion`**,
que sí se produce dentro de cada semana (línea 69, `evaluacion: evaluacionSesion`).
Quien lea el comentario para saber qué llena la plantilla se pierde una columna.

**Decisión: abierto.** Corrección puramente documental.

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

**Decisión: mitigado, no resuelto.** El script cubre el flujo de Inglés; el
resto del repositorio sigue sin pruebas.
