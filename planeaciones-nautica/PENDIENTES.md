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

> **Revisado 2026-08-05.** Sigue siendo exacto: `manifest.json` tiene exactamente 7 documentos
> con `contenidoExtraible: false`, y son estos 7. No se intentó OCR (no hay tesseract y no se
> instaló nada). Único matiz: el de **Trigonometría PN 2 B** está registrado en el manifest con
> `materia: "(sin identificar)"`, no con su nombre — al no haber texto, no hubo de dónde
> sacarlo y el nombre de archivo tampoco traía etiqueta humana.

## 2. Materia sin identificar (nombre no resuelto por el nombre de archivo)

| Detectado | Carrera | Sem | Grupo | Archivo | Estado |
|---|---|---|---|---|---|
| (sin identificar) → **Sistema de Posicionamiento Dinámico** | PN | 8 | A (ver nota) | `plan_sistemadeposicionamientodinamico_8bpn_enmt.pdf` | ✅ confirmada |
| (sin identificar) — es **Trigonometría Plana y Esférica** | PN | 2 | B | `plan_trigonometria8plana8y8esferica_ii_b_pn_enmt GRUPO II B PN.pdf` | ⛔ sin texto (§1) |

**Confirmación del primero (2026-08-05).** Se leyó el texto extraído
(`app/data/planeaciones-historicas/corpus/LPN_Sem08_sin-identificar_A_698b0867.json`). El F-32
declara en su encabezado:

- Asignatura: **Sistema de posicionamiento dinámico** · Clave: **C0113**
- Docente: Cap. Pedro Alanís Gallardo · Periodo: Enero-junio 2026
- 40 horas totales (34 HT / 6 HP) · 5 h/semana · 2.5 créditos
- Objetivo general: *"Proporciona el conocimiento de los Sistemas de Posicionamiento Dinámico
  (DP…), que permita discernir sobre el uso práctico y las limitaciones … en la Industria
  Petrolera mar adentro."*

Coincide con la materia ya inventariada en `INVENTARIO-PROGRAMAS.md:105` (clave `C0113`), así
que **no es una materia nueva: es una tercera copia** de Posicionamiento Dinámico PN 8. Las
otras dos son `lpn_dp_viiibpn POSCIONAMIENTO DINAMICO GRUPO VIII A PN.pdf` y
`plan_sdp_viii_a_pn_enmt POSICIONAMIENTO DINAMICO VIII A PN.pdf`.

**Por qué el manifest sigue diciendo "(sin identificar)".** No es un error de lectura del PDF:
`scripts/ingestar-enero-jun-2026.mjs:588-591` toma el nombre de materia de la **etiqueta humana
del nombre de archivo** y solo usa el encabezado del documento como respaldo. Este archivo no
trae etiqueta, y el respaldo tampoco sirvió porque en este PDF el encabezado sale con las
columnas entrelazadas (`ASIGNATURA/CURSO: ESCUELA NÁUTICA MERCANTE … HORAS TOTALES: Sistema de
posicionamiento dinámico`), de modo que el valor no queda pegado a su etiqueta.

**Queda abierto** (requiere tocar el manifest y el corpus, que no son de este flujo):

- Corregir `materia` de `sin-identificar_698b0867` a "Sistema de posicionamiento dinámico" y
  `clave` a `C0113`. Ojo: el `id` y el nombre del archivo de corpus incorporan
  `slugify(materia)`, así que cambiarlo renombra ambos.
- **Grupo A vs B**: el manifest le asigna grupo **A**, pero el nombre de archivo dice `8bpn`
  (→ B). La misma ambigüedad ya está anotada en `INVENTARIO.md` para el archivo `lpn_dp_viiibpn`
  (archivo dice `viiib`, etiqueta dice "A"). Las tres copias quedaron como grupo A; si alguna es
  del grupo B, hoy no hay ninguna forma de distinguirlo sin abrir los PDF.

## 3. Notas de calidad de extracción (revisión recomendada)

- **Nombres de materia con typos heredados del archivo.** Al reestructurar con Claude se
  normalizan, pero conviene verificar el `nombre` final.

  **Evaluado 2026-08-05 — decisión: NO normalizar en el indexador (por ahora).** Son
  exactamente 7 entradas de `manifest.json`, y hay una familia más de las que estaban
  anotadas ("Poscionamiento"):

  | Materia registrada | Carrera | Sem | Grupo | Corpus |
  |---|---|---|---|---|
  | `Eduacacion Fisica 11` | PN | 2 | B | `LPN_Sem02_Eduacacion-Fisica-11_B_e80ffefe.json` |
  | `Trigonmetria` | PN | 2 | A | `LPN_Sem02_Trigonmetria_A_5959ccbc.json` |
  | `Eduacacion Fisica` | PN | 4 | A | `LPN_Sem04_Eduacacion-Fisica_A_703fa84d.json` |
  | `Meterologia` | PN | 4 | B | `LPN_Sem04_MET425_B_ae70bf8d.json` |
  | `Resitencia Materiales` | PN | 4 | A | `LPN_Sem04_Resitencia-Materiales_A_233fdafe.json` |
  | `Adminsitracion Naviera` | PN | 8 | B | `LPN_Sem08_Adminsitracion-Naviera_B_88127289.json` |
  | `Poscionamiento Dinamico` | PN | 8 | A | `LPN_Sem08_Poscionamiento-Dinamico_A_059be9e9.json` |

  El typo entra en `scripts/ingestar-enero-jun-2026.mjs:588-591`, que prefiere la etiqueta
  humana del nombre de archivo sobre el encabezado del documento. Un diccionario de
  normalización ahí es fácil de escribir, pero **no es un cambio local**: el `id` del
  documento y el nombre del archivo de corpus se construyen con `slugify(materia)`
  (líneas 513, 540, 622, 676), así que normalizar renombra 7 archivos de corpus y sus ids
  dentro de un manifest de 215 documentos, y rompe cualquier referencia por id ya escrita
  (`INVENTARIO-PROGRAMAS.md` las cita por nombre de archivo, ej. líneas 96 y 105).

  Recomendación para cuando se retome: normalizar **junto con** una reingesta completa, y
  en la misma pasada invertir la precedencia (encabezado del documento primero, nombre de
  archivo como respaldo) — eso arregla los typos y el "(sin identificar)" de §2 de raíz, en
  vez de parchear una lista de palabras.
- **~61 de 105 materias con texto** tienen estructura de unidades parcial (prácticas marineras,
  educación física y materias sin numeración "UNIDAD"). El texto completo sí está en el corpus;
  la reestructuración con Claude debe reconstruir las unidades — **verificar** esas materias.
- **Estrategias/técnicas de enseñanza**: el template F-32 2026 usa encabezados distintos y esos
  sub-campos quedaron vacíos en la extracción por regex (el texto completo los conserva).

## 4. Corpus histórico de Inglés (`.indice-ingles/indice.json`)

Corpus distinto del anterior: son los 44 `.docx` de `planeaciones historicas ingles`, indexados
por `scripts/indexar-ingles.mjs`. Revisado 2026-08-05 al reabrir la ficha D4 de
`DEUDA-TECNICA-INGLES.md`.

**El campo `nivel` sale del NOMBRE DE ARCHIVO, y en 15 de 44 documentos el nombre no lo dice.**
Al leer el campo ASIGNATURA/CURSO de esos 15 (índice v2, campo `asignaturaTexto`) resulta que
**ninguno es del nivel 2**:

| Qué son | Cuántos | Asignatura declarada | Libro |
|---|---|---|---|
| Inglés Marítimo VIII (clave ING 853) | 9 | `Inglés Marítimo VIII ( MARITIME ENGLISH 2)` | Career Paths **Merchant Navy** |
| Inglés Marítimo VI | 4 | `Inglés Marítimo VI ( Level 6)` | iDiscover 6 |
| No son planeaciones | 2 | (sin campo ASIGNATURA) | plantilla F-32 en blanco · reporte F-26 de observación de clase |

El "2" de `merchantnavy2` / `MARITIME ENGLISH 2` es el número del **curso de Inglés Marítimo**
(el segundo), no el del nivel. Etiquetarlos como nivel 2 por ese "2" sería un error de datos.

**Pendientes reales de este corpus** (ninguno se corrigió, todos cambian qué históricas espeja
el generador y por eso necesitan una decisión explícita del propietario del flujo):

1. **`Copia de INGLES MARITIMO Lvl.7 (1).docx` está mal etiquetado y sí se usa.** El nombre dice
   `Lvl.7`, pero el documento declara `ASIGNATURA/CURSO: NIVEL 3`, clave `ING317/ING315` y
   bibliografía "I Discover 3". Hoy es la **primera** de las 3 referencias del nivel 7 — y, vía
   `NIVEL_ESPEJO["8"]="7"`, también del nivel 8. Es peor que un documento sin etiqueta: es una
   etiqueta falsa que sí alimenta el prompt. El indexador ya lo delata al ejecutarse (aviso
   `⚠ nombre ≠ contenido`).
2. **9 documentos de Inglés Marítimo VIII sin usar.** Son de Career Paths Merchant Navy,
   mientras que el temario oficial del nivel 8 (`app/data/temarioInglesOficial.ts`) declara
   **iDiscover 8**. Darles `nivel: "8"` haría que el nivel 8 dejara de espejear al 7 y pasara a
   espejear un curso de otro libro — el mismo fallo de "libro equivocado" que ya documenta D1.
3. **4 documentos de Inglés Marítimo VI sin usar.** Estos sí son iDiscover 6 legítimo, pero
   pasarían el nivel 6 de 4 a 8 documentos y **desplazarían por completo su top-3 actual**
   (los 4 nuevos tienen más palabras que los 4 actuales). Además dos de ellos son copias
   byte a byte (`INGLES VI C PN MN.docx` aparece en dos carpetas), así que el generador
   recibiría el mismo documento dos veces como referencias 1 y 2.
4. **2 archivos que no son planeaciones** siguen contando como documentos del corpus
   (`FID-FOR-F-32_Planeación_Didáctica_original.docx`, la plantilla en blanco, y
   `FID-FOR-F-26 Teaching Observation Report (8).docx`). Correcto que queden en `nivel: null`;
   convendría excluirlos del conteo.
5. **El corpus tiene 42 documentos únicos, no 44**: dos pares son idénticos byte a byte
   (`INGLES VI C PN MN.docx` y `INGLES VIII C MN New.docx`, cada uno en dos carpetas).

Cualquier cambio a `nivel` debe ejecutar `node scripts/verificar-no-regresion-ingles.mjs`
después: sus comprobaciones A1/A2/C6 fijan el reparto por nivel y el top-3 de cada nivel.

---
_Generado durante la construcción de la biblioteca espejo 2026. Ver `INVENTARIO.md` y
`app/data/planeaciones-historicas/README.md`._
