# Corpus de planeaciones históricas (Fase 0 — plan Gemini)

Corpus **derivado y redactado** de las planeaciones didácticas reales del ciclo
**Julio–Diciembre 2025**, para usarse **más adelante** como *referencia de estilo*
por la integración de IA (Gemini) del botón "Generar Planeación F-32".

> 🔵 **Lote adicional "enero-junio-2026" (semestres PARES 2,4,6,8).** El manifest
> ahora incluye 112 planeaciones F-32 del ciclo **Enero–Junio 2026** (campo
> `lote: "enero-junio-2026"`), extraídas de PDFs por
> [`scripts/ingestar-enero-jun-2026.mjs`](../../../scripts/ingestar-enero-jun-2026.mjs).
> Sirven de **ESPEJO** para generar el ciclo **Enero–Junio 2027**. Cada entrada
> añade `grupo`, `periodo`, `contenidoExtraible` y un `programaEspejo` (estructura
> tipo `ProgramaOficial`, best-effort) además de `pedagogia` y el texto redactado.
> 7 son PDFs escaneados sin texto → solo metadatos (ver `PENDIENTES.md`).
> Servicio de acceso: [`app/lib/bibliotecaEspejo.ts`](../../lib/bibliotecaEspejo.ts).
> Los programas oficiales de semestres pares se generan (para revisión) con
> [`scripts/generar-programas-pares.mjs`](../../../scripts/generar-programas-pares.mjs).

> ⚠️ **Fase 0 = solo construcción de datos.** Nada de esto se consume todavía en
> la app. No se modificó `generarWord()`, ni los programas oficiales, ni
> `F-32.docx`, ni el flujo actual.

## Origen y reproducibilidad

- **Fuente cruda:** `importacines/planeaciones-julio-dic-2025/` (143 documentos
  `.doc`/`.docx`). **No se versiona** (datos personales, ~57 MB) → ver `.gitignore`.
- **Generador:** [`scripts/ingestar-historicas.mjs`](../../../scripts/ingestar-historicas.mjs).
  Reejecutarlo regenera este corpus de forma determinista:
  ```
  node scripts/ingestar-historicas.mjs
  ```

## Qué se hizo

1. **Deduplicación por contenido (SHA-1):** de 143 → **103 únicas**. Se
   descartaron **40 copias** (la carpeta-coordinador "PEDRO ALANIS GALLARDO" y
   subcarpetas espejo); ante un duplicado se conserva la del autor real.
2. **Ignorados:** 23 `desktop.ini` (no son documentos).
3. **Extracción** de campos pedagógicos: competencias, estrategias de enseñanza,
   técnicas de enseñanza, secuencia didáctica (inicio-desarrollo-cierre),
   productos/evidencias e instrumentos de evaluación.
4. **Redacción de PII** ANTES de derivar cualquier campo: nombre del docente,
   número de estudiantes, grupo, fechas y encabezado de escuela quedan como
   `[REDACTADO]` en todo el contenido. (El nombre del docente se conserva **solo**
   en `manifest.json` como metadato de procedencia.)

## Estructura

```
app/data/planeaciones-historicas/
├── manifest.json        Índice de las 103 entradas (metadatos + ruta al corpus)
├── corpus/              Un JSON por planeación, con pedagogía + texto redactado
│   └── <CARRERA>_Sem<NN>_<CLAVE>_<hash8>.json
└── README.md
```

### `manifest.json` (por documento)
`id`, `clave`, `materia`, `carrera` (PN/MN), `semestre` (1–8), `area`
(nautica · maquinas · basica · humanidades · practicas-marineras ·
educacion-fisica · otra), `docente`, `archivoOrigen`, `formato`,
`corpus` (ruta), `claveCoincideConProgramaOficial`.

### `corpus/*.json` (por documento)
Metadatos + `pedagogia` (`competencias`, `estrategiasEnsenanza`,
`tecnicasEnsenanza`, `secuenciaDidactica`, `productosEvidencias`,
`instrumentosEvaluacion`) + `textoReferenciaRedactado` (texto completo redactado,
≤ 9000 caracteres, como respaldo de estilo para el prompt).

## Limitaciones conocidas (revisión manual sugerida)

- **8 documentos sin `clave`**: en su mayoría `.doc` heredados (extraídos con
  `antiword`, cuyo encabezado en tablas no expone la clave limpia) + 1 docx de
  Refrigeración II. Conservan materia y pedagogía.
- **Competencias disciplinares vs. genéricas**: la plantilla las maqueta en dos
  columnas que al aplanarse se mezclan; por eso se consolidan en un único campo
  `competencias` (separarlas con fiabilidad requiere OCR de layout).
- **Secuencia didáctica**: el cuerpo está en una tabla por sesión; se captura el
  bloque como referencia de estilo, no como inicio/desarrollo/cierre ya separados.
- **2 casos de semestre ambiguo** (Comunicación Visual "COM VIS"): nombre sin
  token claro; revisar manualmente (corresponde a 5.º semestre, COV535).

## Uso futuro (Fases siguientes — NO en esta fase)

`seleccionHistoricas.ts` consultará este `manifest.json` por la cascada
clave → materia → área/semestre, y `promptPlaneacion.ts` inyectará la `pedagogia`
y/o `textoReferenciaRedactado` de 1–3 documentos como **referencia de estilo**,
sin que Gemini pueda alterar temas/subtemas (que siguen viniendo de
`app/data/contenidos/`).
