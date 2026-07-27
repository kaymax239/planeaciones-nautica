# INVENTARIO — Planeaciones F-32 Enero–Junio 2026 (referencia espejo para Ene–Jun 2027)

> **Estado:** Paso 1 (exploración). Clasificación derivada de los **nombres de archivo**.
> La clasificación fina (materia/carrera/semestre/grupo definitivos, unidades, %) se
> confirmará al abrir cada PDF en el Paso 2. **Pendiente de tu validación antes de continuar.**

## 1. Resumen y hallazgos

- **Ubicación:** `planeaciones-nautica/planeaciones enerojunio26/`
- **Total real: 113 archivos planos** (no 103 carpetas). Cada archivo = una planeación F-32.
  - `111` **PDF**
  - `1` **DOCX** (`plan_53 (2)METDOLOGIA DE LA INVESTIACION GRUPO II B PN.docx`)
  - `1` **`.m`** → `lpn_5 CONVENIOS GRUPO VIII B PN.m` (extensión rota; casi seguro un `.docx`/`.doc` mal renombrado — **a revisar**)
- **No hay subcarpetas.** Todos los documentos son del tipo **planeación F-32**; en este lote **no** hay avances F-51, exámenes ni presentaciones sueltos.
- **Periodo:** Enero–Junio 2026 → semestres **pares**: **II (2º), IV (4º), VI (6º), VIII (8º)**.
- **Carreras presentes:** **PN** (Piloto Naval) y **MN** (Maquinista Naval). **Inglés** aparece solo como *materia* (1 archivo: Inglés Marítimo VIII B PN), no como carrera con lote propio aquí.

### Discrepancias vs. el planteamiento inicial (a validar)
1. **"103 carpetas" → 113 archivos.** El número 103 coincide, de hecho, con el corpus **ya existente** de Jul–Dic 2025 (ver abajo), no con este lote.
2. **Ya hay infraestructura de biblioteca histórica.** `app/data/planeaciones-historicas/` contiene **103 planeaciones de Julio–Diciembre 2025** (semestres impares) ya extraídas a JSON, con `manifest.json` + `seleccionHistoricas.ts` (se usan como *referencia de estilo* para Gemini, con PII redactada). Este lote de Ene–Jun 2026 es el **complemento de semestres pares** y es el que sirve de **espejo exacto** para Ene–Jun 2027.
3. **Nombres con PII y "mojibake":** acentos/espacios aparecen como `8` (`planeaci8n` = "planeación", `mar8tima` = "marítima"). La clasificación por nombre es fiable pero requiere confirmar en el PDF los datos internos.
4. **Duplicados/typos aparentes** (mismo materia+grupo con dos archivos, o número romano mal escrito): ver §5.

## 2. Cobertura por carrera y semestre (conteo aproximado por nombre)

| Carrera | 2º (II) | 4º (IV) | 6º (VI) | 8º (VIII) | Total aprox. |
|---|---|---|---|---|---|
| **PN** (Piloto Naval) | ~18 | ~16 | ~20 | ~22 | ~76 |
| **MN** (Maquinista Naval) | ~9 | — | ~11 | ~9 | ~29 |
| **Sin clasificar** (nombres genéricos) | — | — | — | — | ~8 |

> Los ~8 "sin clasificar" son prácticas marineras y estática con nombre incompleto (§5). El total cuadra en 113.

## 3. Catálogo de materias — PILOTO NAVAL (PN)

Formato: **Materia** — semestre — grupos disponibles.

### Náutica / especialidad
- **Navegación II** — 4º — A, B
- **Navegación IV** — 6º — A, B
- **Laboratorio de Navegación** — 6º — A, B
- **Simulador de Navegación** — 8º — A, B
- **Meteorología** — 4º — A, B
- **Maniobras II** — 6º — A, B
- **Teoría del Buque** — 6º — A, B
- **Carga y Estiba** — 8º — A, B
- **GMDSS** — 8º — A, B
- **Posicionamiento Dinámico** — 8º — A (y 2 archivos "B" a deduplicar, §5)
- **Manejo de Embarcaciones** — 4º — A, B
- **Situaciones de Emergencia** — 6º — A, B
- **Convenios OMI** — 8º — A, B *(B es el `.m` a revisar)*
- **Legislación Marítima y Laboral** — 8º — A, B
- **Administración Naviera** — 8º — A, B
- **Economía Marítima** — 8º — A, B
- **Inglés Marítimo** — 8º — B
- **Prácticas Marineras** — 2º (A,B), 4º (A,B), 6º (A,B), 8º (A,B) *(+ archivos sueltos §5)*
- **Primeros Auxilios Médicos** — 6º — B

### Básicas / ingeniería
- **Cálculo** — 4º — A, B
- **Trigonometría (plana y esférica)** — 2º — A, B
- **Estática** — 2º — B *(+ 1 archivo sin grupo, §5)*
- **Resistencia de Materiales** — 4º — A, B
- **Topografía** — 2º — A, B
- **Geografía** — 2º — A, B
- **Electrónica** — 6º — A, B
- **Maquinaria Marítima** — 4º — A, B

### Humanidades
- **Metodología de la Investigación** — 2º — A, B *(B es el `.docx`)*
- **El Hombre y su Entorno** — 4º — A, B
- **Pensamiento Crítico** — 6º — A, B
- **Técnicas de Argumentación** — 4º — A, B

### Formación / taller / cultura física
- **Taller** — 2º — A, B
- **Formación Básica STCW** — 2º — A, B
- **Educación Física** — 2º (A,B), 4º (A,B), 6º (A,B), 8º (A,B)

## 4. Catálogo de materias — MAQUINISTA NAVAL (MN)

### Máquinas / especialidad
- **Electricidad** — 2º — A
- **Electrónica** — 6º — A
- **Motores II** — 6º — A
- **Refrigeración** — 6º — A
- **Generadores y Máquinas de Vapor** — 6º — A
- **Turbinas de Combustión** — 8º — A
- **Laboratorio Diesel** — 8º — A
- **Simulador de Máquinas** — 8º — A
- **Taller** — 2º (A), 6º (A)

### Básicas
- **Estática** — 2º — A
- **Trigonometría** — 2º — A

### Marítimo-legal / gestión (8º)
- **Administración Naviera** — 8º — A
- **Legislación Marítima y Laboral** — 8º — A
- **Convenios OMI** — 8º — A
- **Economía Marítima** — 8º — A

### Humanidades / comunes
- **Metodología de la Investigación** — 2º — A
- **Formación Básica STCW** — 2º — A
- **Pensamiento Crítico** — 6º — A
- **Primeros Auxilios Médicos** — 6º — A
- **Educación Física** — 2º (A), 8º (A)
- **Prácticas Marineras** — 2º (A), 6º (A), 8º (A)

## 5. Archivos que requieren abrir el PDF para confirmar (ambigüedades)

| # | Archivo | Problema | Acción |
|---|---|---|---|
| 43 | `plan_244 ESTATICA.pdf` | Sin carrera ni grupo en el nombre | Abrir para asignar |
| 27 | `plan8practicasmarineras_1.pdf` | Sin materia clara / grupo | Abrir |
| 28 | `plan8practicasmarineras_2.pdf` | Ídem | Abrir |
| 77 | `plan_practicasmarineras_2bpn_enmt.pdf` | Semestre no explícito (¿2º B PN?) | Abrir |
| 102 | `planpracticasmarineras_2apn_enmt.pdf` | Semestre no explícito (¿2º A PN?) | Abrir |
| 81 | `plan_sistemadeposicionamientodinamico_8bpn_enmt.pdf` | ¿Duplicado de Pos. Dinámico VIII B PN? | Deduplicar |
| 13 | `lpn_dp_viiibpn POSCIONAMIENTO DINAMICO GRUPO VIII A PN.pdf` | Nombre-archivo dice `viiib`, etiqueta dice "A" | Confirmar grupo |
| 11 | `lpn_5 CONVENIOS ... VIII B PN.m` | Extensión `.m` rota | Confirmar formato real |
| 88 | `plan_vii8a8mn EDUCACION FISICA VIII MN.pdf` | ¿Duplicado de #87 (VIII A MN)? | Deduplicar |
| 106 | `practicas8marineras8viii8a8pn8ok ... VII A PN.pdf` | Etiqueta "VII" vs archivo "viii" | Confirmar semestre (prob. 8º) |

**Posibles duplicados de materia+grupo** (dos archivos): Electrónica VI A PN (#29, #37), Electricidad II A MN (#39, #64), Electrónica VI A MN (#40, #65). Se conservará uno tras comparar contenido en el Paso 2.

## 6. Qué se extraerá en el Paso 2 (por cada F-32)

Datos generales · Unidades → temas/subtemas · Competencias y resultados de aprendizaje ·
Estrategias/técnicas de enseñanza y actividades · Criterios e instrumentos de evaluación **con %** ·
Distribución de horas/sesiones por unidad · Bibliografía.
Herramienta disponible: `pdftotext` (mingw64) para los 111 PDF; `mammoth`/similar para el `.docx`.

## 7. Propuesta de ubicación de la biblioteca (a confirmar en Paso 3)

El repo ya usa `app/data/planeaciones-historicas/` (JSON por documento + `manifest.json`) para
*estilo* con PII redactada. Para el **espejo estructurado** propongo una biblioteca nueva y
separada, p. ej. `app/data/biblioteca/<carrera>/<semestre>/<materia>.json` + `index.ts` con el
catálogo, sin tocar el corpus histórico existente. (El ejemplo del enunciado `3er-semestre` no
aplica: aquí los semestres son pares 2º/4º/6º/8º.)

---
### Preguntas para validar antes del Paso 2
1. ¿Confirmas que el lote correcto es `planeaciones enerojunio26/` (113 archivos) y que sirve de espejo para **Ene–Jun 2027**?
2. ¿La biblioteca nueva va en `app/data/biblioteca/` (separada del corpus histórico) o prefieres integrarla al `manifest.json` existente?
3. ¿Extraigo **una materia por (carrera+semestre)** consolidando A/B, o **un JSON por archivo** (grupo incluido)?
4. ¿Redacto PII (docente/fechas) como el corpus histórico, o al ser espejo interno conservo todo salvo lo que cambia por ciclo?
