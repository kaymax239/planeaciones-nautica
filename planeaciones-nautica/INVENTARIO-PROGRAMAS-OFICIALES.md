# Fase A (revisada) — Programas de estudio OFICIALES localizados en disco

## Hallazgo

Los programas de estudio oficiales **sí estaban en el disco**, fuera del corpus: en
`public/templates/biblioteca/` como **PPE (Plan y Programas de Estudio) FIDENA 2022**,
un PDF por asignatura, para ambas carreras y los 8 semestres:

- `PPE_LMN_FIDENA_2022-/0{n}SEM/LMN_S{n}.{i}_{CLAVE}.pdf` (Maquinista Naval)
- `PPE_LPN_FIDENA_2022-/0{n}-SEM/LPN_S{n}.{i}_{CLAVE}.pdf` (Piloto Naval)
- Planes maestros sellados por DGMM: `Planes de estudio MN/PN 2022 Sellos-DGMM.pdf` + mapa curricular.

**Estructura confirmada** (ej. `LPN_S4.1_NAV423.pdf`): encabezado `PROGRAMA DE ASIGNATURA`
(Secretaría de Marina / FIDENA), Licenciatura, Clave, Semestre, Carácter, Tipo, Créditos,
Objetivo General y **CONTENIDO TEMÁTICO** (unidades + subtemas + objetivo específico por
unidad). **Sin grupo, sin calendario, sin docente, sin evaluación con fechas** → es un
programa de estudios, no un F-32. La ingesta no los tomó porque buscaba planeaciones en las
carpetas de docentes; estos viven en `public/templates/`.

> ✅ **Resuelve la circularidad de Fase B:** son fuente oficial independiente de las
> planeaciones que generaron la biblioteca. No hace falta esperar a la subdirección (salvo
> que quieras una versión más reciente que la de 2022).

## Cobertura sobre las 62 materias pares

| Métrica | Valor |
|---|---:|
| Materias pares en la biblioteca | 62 |
| ✅ CON programa oficial PPE localizado | 61 |
| ❌ SIN programa PPE localizado | 1 |
| PPE pares en disco (ambas carreras, incl. MN S4 que la biblioteca no tiene) | 83 |

> Nota: donde la clave de la biblioteca no coincide con la del PPE se marca la discrepancia
> (la biblioteca extrajo algunas claves con error; el emparejamiento se resolvió por nombre).

### Piloto Naval — Semestre 2

| Materia (biblioteca) | Clave | Programa oficial (PPE) | Vía | Nota clave |
|---|---|---|:--:|---|
| Educación Física II | C0011 | `PPE_LPN_FIDENA_2022-/02-SEM/LPN_S2.9_C0011-.pdf` | clave |  |
| Estática | EST212 | `PPE_LPN_FIDENA_2022-/02-SEM/LPN_S2.5_EST212.pdf` | clave |  |
| Formación Básica al STCW | C0089 | `PPE_LPN_FIDENA_2022-/02-SEM/LPN_S2.10_C0089.pdf` | clave |  |
| Geografía | GEO209 | `PPE_LPN_FIDENA_2022-/02-SEM/LPN_S2.2_GEO209.pdf` | clave |  |
| Metodología de la investigación | MEI212 | `PPE_LPN_FIDENA_2022-/02-SEM/LPN_S2.6_MEI213.pdf` | nombre | biblio:MEI212≠ppe:MEI213 |
| Practicas Marineras II | PMR215 | `PPE_LPN_FIDENA_2022-/02-SEM/LPN_S2.8_PMR215.pdf` | clave |  |
| Taller | TAL214 | `PPE_LPN_FIDENA_2022-/02-SEM/LPN_S2.7_TAL214.pdf` | clave |  |
| Topografía | TOP210 | `PPE_LPN_FIDENA_2022-/02-SEM/LPN_S2.3_TOP210.pdf` | clave |  |

### Piloto Naval — Semestre 4

| Materia (biblioteca) | Clave | Programa oficial (PPE) | Vía | Nota clave |
|---|---|---|:--:|---|
| Cálculo Diferencial e Integral | CAL425 | `PPE_LPN_FIDENA_2022-/04-SEM/LPN_S4.4_ CAL426.pdf` | nombre | biblio:CAL425≠ppe:CAL426 |
| Educación Física | C0011 | `PPE_LPN_FIDENA_2022-/04-SEM/LPN_S4.8_C0011-.pdf` | clave |  |
| Manejo de embarcaciones de supervivencia y botes de rescate que no sean botes de rescate rápidos | C0036 | `PPE_LPN_FIDENA_2022-/04-SEM/LPN_S4.9_C0036.pdf` | clave |  |
| Maquinaria Marítima Auxiliar | MMA428 | `PPE_LPN_FIDENA_2022-/04-SEM/LPN_S4.6_MMA428.pdf` | clave |  |
| Meteorología I | MET425 | `PPE_LPN_FIDENA_2022-/04-SEM/LPN_S4.3_MET425-.pdf` | clave |  |
| Navegación II | NAV423 | `PPE_LPN_FIDENA_2022-/04-SEM/LPN_S4.1_NAV423.pdf` | clave |  |
| Practicas Marineras IV | TAL427 | `PPE_LPN_FIDENA_2022-/04-SEM/LPN_S4.7_PMR429.pdf` | nombre | biblio:TAL427≠ppe:PMR429 |
| Técnicas de argumentación | C0102 | `PPE_LPN_FIDENA_2022-/04-SEM/LPN_S4.10_C0102.pdf` | clave |  |

### Piloto Naval — Semestre 6

| Materia (biblioteca) | Clave | Programa oficial (PPE) | Vía | Nota clave |
|---|---|---|:--:|---|
| Educación Física | C0011 | `PPE_LPN_FIDENA_2022-/06-SEM/LPN_S6.9_CO011.pdf` | clave |  |
| Electrónica | ELC642 | `PPE_LPN_FIDENA_2022-/06-SEM/LPN_S6.6_ELC642-.pdf` | clave |  |
| Laboratorio de Navegación | LNV639 | `PPE_LPN_FIDENA_2022-/06-SEM/LPN_S6.3_LNV639.pdf` | clave |  |
| Maniobras II | MAN640 | `PPE_LPN_FIDENA_2022-/06-SEM/LPN_S6.4_MAN640-.pdf` | clave |  |
| Navegación IV | NAV637 | `PPE_LPN_FIDENA_2022-/06-SEM/LPN_S6.1_NAV637.pdf` | clave |  |
| Pensamiento Crítico | C0106 | `PPE_LPN_FIDENA_2022-/06-SEM/LPN_S6.11_C0106.pdf` | clave |  |
| Prácticas Marineras VI | PMR644 | `PPE_LPN_FIDENA_2022-/06-SEM/LPN_S6.8_PMR644.pdf` | clave |  |
| Primeros Auxilios Médicos | C0039 | `PPE_LPN_FIDENA_2022-/06-SEM/LPN_S6.10_C0039.pdf` | clave |  |
| Situaciones de emergencia | INS643 | `PPE_LPN_FIDENA_2022-/06-SEM/LPN_S6.7_INS643.pdf` | clave |  |
| Teoría del Buque I | TEB641 | `PPE_LPN_FIDENA_2022-/06-SEM/LPN_S6.5_TEB641-.pdf` | clave |  |

### Piloto Naval — Semestre 8

| Materia (biblioteca) | Clave | Programa oficial (PPE) | Vía | Nota clave |
|---|---|---|:--:|---|
| Administración Naviera y Portuaria | ADM858 | `PPE_LPN_FIDENA_2022-/08-SEM/LPN_S8.6_ADM858.pdf` | clave |  |
| Carga y Estiba II | CYE855 | `PPE_LPN_FIDENA_2022-/08-SEM/LPN_S8.3_CYE855.pdf` | clave |  |
| Convenios Organización Marítima Internacional II | OMI859 | `PPE_LPN_FIDENA_2022-/08-SEM/LPN_S8.7_OMI859.pdf` | clave |  |
| Economía Marítima | ECM860 | `PPE_LPN_FIDENA_2022-/08-SEM/LPN_S8.8_ECM860.pdf` | clave |  |
| Educación Física | C0011 | `PPE_LPN_FIDENA_2022-/08-SEM/LPN_S8.10_CO011.pdf` | clave |  |
| Inglés Marítimo VIII (Maritime English 2) | 853 | `PPE_LPN_FIDENA_2022-/08-SEM/LPN_S8.1_ING853.pdf` | nombre | biblio:853≠ppe:ING853 |
| Legislación Marítima y Laboral | LRM856 | `PPE_LPN_FIDENA_2022-/08-SEM/LPN_S8.4_LRM856.pdf` | clave |  |
| Practicas marineras VIII | PMR860 | `PPE_LPN_FIDENA_2022-/08-SEM/LPN_S8.9_PMR861.pdf` | nombre | biblio:PMR860≠ppe:PMR861 |
| Simuladores de Navegación II | SNV854 | `PPE_LPN_FIDENA_2022-/08-SEM/LPN_S8.2_SNV854.pdf` | clave |  |
| Sistema de posicionamiento dinámico | C0113 | `PPE_LPN_FIDENA_2022-/08-SEM/LPN_S8.11_C0113.pdf` | clave |  |
| Sistema Mundial de Socorro y Salvamento Marítimo | SMS857 | `PPE_LPN_FIDENA_2022-/08-SEM/LPN_S8.5_SMS857.pdf` | clave |  |

### Maquinista Naval — Semestre 2

| Materia (biblioteca) | Clave | Programa oficial (PPE) | Vía | Nota clave |
|---|---|---|:--:|---|
| Educación Física II | C0011 | `PPE_LMN_FIDENA_2022-/02SEM/LMN_S2.8_C0011.pdf` | clave |  |
| Electricidad II | ELE209 | `PPE_LMN_FIDENA_2022-/02SEM/LMN_S2.2_ELE209 - .pdf` | clave |  |
| Estática | EST212 | `PPE_LMN_FIDENA_2022-/02SEM/LMN_S2.4_EST212.pdf` | clave |  |
| Formación Básica al STCW | C0089 | `PPE_LMN_FIDENA_2022-/02SEM/LMN_S2.9_C0089.pdf` | clave |  |
| Metodología de la investigación | MEI213 | `PPE_LMN_FIDENA_2022-/02SEM/LMN_S2.5_MEI212.pdf` | nombre | biblio:MEI213≠ppe:MEI212 |
| Prácticas Marineras II | PMR215 | `PPE_LMN_FIDENA_2022-/02SEM/LMN_S2.7_PMR214 - .pdf` | nombre | biblio:PMR215≠ppe:PMR214 |
| Taller I | TAL213 | `PPE_LMN_FIDENA_2022-/02SEM/LMN_S2.6_TAL213 - .pdf` | clave |  |

### Maquinista Naval — Semestre 6

| Materia (biblioteca) | Clave | Programa oficial (PPE) | Vía | Nota clave |
|---|---|---|:--:|---|
| Electrónica | ELA641 | `PPE_LMN_FIDENA_2022-/06SEM/LMN_S6.5_ELA641.pdf` | clave |  |
| Generadores y máquinas de vapor | GMV639 | `PPE_LMN_FIDENA_2022-/06SEM/LMN_S6.3_GMV639.pdf` | clave |  |
| Motores II | MOT637 | `PPE_LMN_FIDENA_2022-/06SEM/LMN_S6.1_MOT367 - .pdf` | nombre | biblio:MOT637≠ppe:MOT367 |
| Pensamiento Crítico | C0106 | `PPE_LMN_FIDENA_2022-/06SEM/LMN_S6.10_C0106.pdf` | clave |  |
| Practicas Marineras VI | PMR644 | `PPE_LMN_FIDENA_2022-/06SEM/LMN_S6.7_PMR643.pdf` | nombre | biblio:PMR644≠ppe:PMR643 |
| Primeros Auxilios Médicos | C0039 | `PPE_LMN_FIDENA_2022-/06SEM/LMN_S6.9_C0039.pdf` | clave |  |
| Refrigeración I | REF640 | `PPE_LMN_FIDENA_2022-/06SEM/LMN_S6.4_REF640.pdf` | clave |  |
| Taller V | TAL642 | `PPE_LMN_FIDENA_2022-/06SEM/LMN_S6.6_TAL642 - .pdf` | clave |  |

### Maquinista Naval — Semestre 8

| Materia (biblioteca) | Clave | Programa oficial (PPE) | Vía | Nota clave |
|---|---|---|:--:|---|
| Administración Naviera y Portuaria | ADM857 | `PPE_LMN_FIDENA_2022-/08SEM/LMN_S8.6_ADM857.pdf` | clave |  |
| Convenios Organización Marítima Internacional II | OMI858 | `PPE_LMN_FIDENA_2022-/08SEM/LMN_S8.7_OMI858.pdf` | clave |  |
| Economía Marítima | ECM859 | `PPE_LMN_FIDENA_2022-/08SEM/LMN_S8.8_ECM859.pdf` | clave |  |
| Educación Física VIII A MN | C0011 | `PPE_LMN_FIDENA_2022-/08SEM/LMN_S8.10_CO011.pdf` | clave |  |
| Laboratorio Diesel | LDO854 | `PPE_LMN_FIDENA_2022-/08SEM/LMN_S8.3_LDO854.pdf` | clave |  |
| Legislación Marítima y Laboral | LRM856 | `PPE_LMN_FIDENA_2022-/08SEM/LMN_S8.5_LRM856.pdf` | clave |  |
| Metodología de la investigación | MEI212 | 🔶 ARTEFACTO — sin PPE oficial (ver nota) | — | duplicado de MN S2 |
| Practicas marineras VIII | PMR860 | `PPE_LMN_FIDENA_2022-/08SEM/LMN_S8.9_PMR860.pdf` | clave |  |
| Simulador de Máquinas | SIM852 | `PPE_LMN_FIDENA_2022-/08SEM/LMN_S8.1_SIM852 - .pdf` | clave |  |
| Turbinas de Combustión | TUC855 | `PPE_LMN_FIDENA_2022-/08SEM/LMN_S8.4_TUC855 - .pdf` | clave |  |

## 🔶 Artefacto marcado — Metodología MN S8 (sin PPE oficial)

- **Metodología de la investigación** (Maquinista Naval · Sem 8, clave MEI212) — `MN_Sem08_Metodologia-Investigacion.json`

**Estado (decisión Victor, Opción A):** marcado como **artefacto de la biblioteca; sin PPE
oficial**. Metodología de la Investigación existe en el plan oficial de Maquinista Naval
**solo en Semestre 2** (`LMN_S2.5_MEI212`), no en el 8º; la biblioteca la duplicó en MN S8
(misma clave MEI212). **No es una brecha de documento y no es una de las 9 correcciones de
clave.** **Eliminación diferida** a la limpieza de Fase B/D — no se borra nada por ahora.

## Discrepancias de clave (biblioteca vs PPE) — ✅ CORREGIDAS

Las 9 claves mal extraídas se corrigieron según el PPE oficial, en **ambas capas**: el campo
`clave` de los JSON espejo (`_generados-pares/`) y su entrada integrada en `contenidos/*.ts`
(mn2, mn6, semestre2, semestre4, semestre8). Edición quirúrgica por ocurrencia única; las 4
ocurrencias legítimas homónimas (`semestre2.ts:1053`, `semestre6.ts:1168`, `mn8.ts:1040`,
`mn8.ts:1232`) se dejaron intactas.

| Materia | Clave errónea (antes) | Clave oficial (PPE, ahora) | Estado |
|---|---|---|:--:|
| Metodología de la investigación (MN S2) | MEI213 | MEI212 | ✅ |
| Prácticas Marineras II (MN S2) | PMR215 | PMR214 | ✅ |
| Motores II (MN S6) | MOT637 | MOT367 | ✅ |
| Practicas Marineras VI (MN S6) | PMR644 | PMR643 | ✅ |
| Metodología de la investigación (PN S2) | MEI212 | MEI213 | ✅ |
| Cálculo Diferencial e Integral (PN S4) | CAL425 | CAL426 | ✅ |
| Practicas Marineras IV (PN S4) | TAL427 | PMR429 | ✅ |
| Inglés Marítimo VIII (Maritime English 2) (PN S8) | 853 | ING853 | ✅ |
| Practicas marineras VIII (PN S8) | PMR860 | PMR861 | ✅ |

## Próximos pasos sugeridos

1. **Fase B ya es viable sin circularidad** usando estos PPE como fuente oficial: comparar
   competencias / objetivos específicos / unidades del PPE vs la biblioteca espejo, por materia.
2. Estos PPE son de **2022 (FIDENA/DGMM)**. Si la subdirección entrega una versión más nueva,
   se sustituye la fuente y se re-corre la comparación.
3. De paso: corregir las 9 claves erróneas de la biblioteca (tabla anterior) y revisar el
   duplicado de Metodología en MN S8.
