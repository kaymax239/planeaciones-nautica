# PENDIENTES — Biblioteca espejo Enero–Junio 2026 → 2027

Materias que **no** pudieron extraerse automáticamente y requieren **revisión / captura manual**
antes de poder espejarse al ciclo Enero–Junio 2027.

## 1. PDFs escaneados (sin capa de texto — no hay OCR disponible)

Estos 7 archivos son imágenes escaneadas: `pdftotext` no devuelve texto y no hay
tesseract instalado. Están en el corpus **solo como metadatos** (`contenidoExtraible: false`);
el generador caerá al flujo de IA para ellas hasta que se capturen a mano o se
consiga un PDF con texto.

| Materia | Carrera | Sem | Grupo | Archivo origen |
|---|---|---|---|---|
| Trigonometría | MN | 2 | A | `plan_trigonometria8plana8y8esferica_ii_a_mn_enmt … II A MN.pdf` |
| Trigonometría | PN | 2 | B | `plan_trigonometria8plana8y8esferica_ii_b_pn_enmt … II B PN.pdf` |
| Trigonometría | PN | 2 | A | `plan_4 TRIGONMETRIA II A PN.pdf` |
| El Hombre y su Entorno | PN | 4 | A | `pd8el8hombre8y8su8entorno8iva8pn_1 … IV A PN.pdf` |
| El Hombre y su Entorno | PN | 4 | B | `pd8el8hombre8y8su8entorno8ivb8pn_2 … IV B PN.pdf` |
| Resistencia de Materiales | PN | 4 | A | `plan_resistencia8de8materiales_iv_a_pn_enmt … IV A PN.pdf` |
| Resistencia de Materiales | PN | 4 | B | `plan_5 RESISTENCIA DE MATERIALES IV B PN.pdf` |

> Materias afectadas (por carrera/semestre): **Trigonometría** (MN2, PN2) · **El Hombre y su
> Entorno** (PN4) · **Resistencia de Materiales** (PN4). Sus dos grupos A/B están escaneados,
> así que **no hay ninguna variante con texto** para estas materias.

**Acciones posibles:** (a) conseguir el PDF con texto o el `.docx` original; (b) OCR con
tesseract (español) si se instala; (c) captura manual del programa oficial.

## 2. Materia sin identificar (nombre no resuelto por el nombre de archivo)

| Detectado | Carrera | Sem | Grupo | Archivo |
|---|---|---|---|---|
| (sin identificar) — probablemente **Sistema de Posicionamiento Dinámico** | PN | 8 | B | `plan_sistemadeposicionamientodinamico_8bpn_enmt.pdf` |

El nombre de archivo no traía etiqueta humana; el semestre/grupo se dedujo del código
(`8bpn` → 8º B PN). Sí tiene texto extraíble; confirmar el nombre de la materia al revisar
el programa generado.

## 3. Notas de calidad de extracción (revisión recomendada)

- **Nombres de materia con typos heredados del archivo** (ej. "Trigonmetria", "Adminsitracion",
  "Resitencia", "Meterologia", "Eduacacion"). Al reestructurar con Claude se normalizan, pero
  conviene verificar el `nombre` final.
- **~61 de 105 materias con texto** tienen estructura de unidades parcial (prácticas marineras,
  educación física y materias sin numeración "UNIDAD"). El texto completo sí está en el corpus;
  la reestructuración con Claude debe reconstruir las unidades — **verificar** esas materias.
- **Estrategias/técnicas de enseñanza**: el template F-32 2026 usa encabezados distintos y esos
  sub-campos quedaron vacíos en la extracción por regex (el texto completo los conserva).

---
_Generado durante la construcción de la biblioteca espejo 2026. Ver `INVENTARIO.md` y
`app/data/planeaciones-historicas/README.md`._
