# Fase A — Inventario de Programas de Estudio localizados

## Hallazgo estructural (leer primero)

En el corpus histórico (`app/data/planeaciones-historicas/`, 215 documentos) **no existe
ningún archivo que sea un _programa de estudios_ suelto**. Los 215 documentos son
**planeaciones didácticas (F-32)**: 103 impares (Jul–Dic 2025) y 112 pares (Ene–Jun 2026).

El contenido del **programa oficial** de cada materia par quedó capturado durante la
ingesta como el bloque **`programaEspejo`** dentro de su planeación par correspondiente:

- `programaEspejo.unidades[]` → **temario oficial**: tema, `objetivoEspecifico` por unidad y `subtemas`.
- `pedagogia.competencias[]` → **competencias** (disciplinares + interdisciplinares, en tabla a dos columnas).
- `programaEspejo.bibliografia` viene **vacía** en todos los casos (0 entradas) → la bibliografía
  a comparar es la que ya generó la biblioteca espejo, no la del programa.

Es decir: la comparación de Fase B (programa oficial vs biblioteca espejo) es viable para
**competencias**, **objetivos específicos** y **unidades/temas**, tomando el programa oficial
de `programaEspejo` + `pedagogia.competencias` del doc par del corpus. **No** hay fuente de
programa para bibliografía.

> ⚠️ **Nota de circularidad a validar:** `programaEspejo` fue _extraído de la misma planeación_
> par que sirvió para generar la biblioteca espejo. Puede reflejar el temario oficial fielmente,
> pero conviene que confirmes si lo tomamos como "fuente oficial" o si prefieres cotejar contra
> el PDF/original del programa (que conseguirías tú).

## Resumen de cobertura

**Las 62 materias pares tienen doc par en el corpus** — ninguna falta. La única brecha real
es la **extracción de temario**: en 33 de 62 el `programaEspejo.unidades` quedó vacío durante
la ingesta (concentrado en Semestres 6 y 8). No hay que "conseguir" esos programas por fuera;
hay que **re-extraerlos** del documento original (el PDF/DOC ya está en el corpus).

| Métrica | Valor |
|---|---:|
| Materias pares en la biblioteca | 62 |
| ✅ CON temario extraído (programaEspejo con unidades) | 29 |
| 🟡 Doc en corpus pero temario VACÍO (re-extraer) | 33 |
| ❌ SIN doc par en el corpus | 0 |

**Leyenda de estado**
- ✅ **con temario** — hay `programaEspejo` con unidades/objetivos → listo para Fase B.
- 🟡 **vacío** — existe el doc par en el corpus (columna _Doc(s) fuente_) pero su
  `programaEspejo.unidades` está vacío: la extracción de temario falló. Recuperable
  re-extrayendo del original; hoy **no** sirve para comparar tal cual.
- ❌ **sin doc** — no hay planeación par en el corpus (no ocurrió en ninguna materia).

> Nota: cuando una materia se impartió en grupos **A** y **B**, aparecen varios docs con el
> mismo temario; se toma el de mejor extracción. Eso **no** es un conflicto.

### Piloto Naval — Semestre 2

| Materia | Clave | Estado | Unid. prog. | Unid. biblio | Compet. | Doc(s). fuente |
|---|---|:--:|--:|--:|--:|---|
| Educación Física II | C0011 | ✅ | 6 | 6 | 14 | `LPN_Sem02_Educacion-Fisica_A_42fc12e8.json` |
| Estática | EST212 | ✅ <sub>(A/B ×2)</sub> | 10 | 10 | 14 | `LPN_Sem02_Estatica_A_97a10cf7.json`<br>`LPN_Sem02_Estatica_B_2c2da181.json` |
| Formación Básica al STCW | C0089 | ✅ <sub>(A/B ×2)</sub> | 5 | 5 | 14 | `LPN_Sem02_Formacion-Basica-Stcw_A_d9241197.json`<br>`LPN_Sem02_Formacion-Basica-Stcw_B_10fba9d3.json` |
| Geografía | GEO209 | ✅ <sub>(A/B ×2)</sub> | 7 | 7 | 14 | `LPN_Sem02_GEO209_A_b83f17c2.json`<br>`LPN_Sem02_GEO209_B_bd1209a9.json` |
| Metodología de la investigación | MEI212 | ✅ | 10 | 10 | 14 | `LPN_Sem02_MEI212_B_08a375fd.json` |
| Practicas Marineras II | PMR215 | ✅ <sub>(A/B ×4)</sub> | 10 | 11 | 14 | `LPN_Sem02_PMR215_B_7c1d1fa1.json`<br>`LPN_Sem02_PMR215_B_63609028.json`<br>`LPN_Sem02_PMR215_A_ba1cea23.json`<br>`LPN_Sem02_PMR215_B_20ab5adf.json` |
| Taller | TAL214 | ✅ <sub>(A/B ×2)</sub> | 9 | 9 | 14 | `LPN_Sem02_TAL214_A_9dde6b68.json`<br>`LPN_Sem02_TAL214_B_96859e43.json` |
| Topografía | TOP210 | ✅ | 7 | 7 | 14 | `LPN_Sem02_Topografia_A_7ab2eb19.json` |

### Piloto Naval — Semestre 4

| Materia | Clave | Estado | Unid. prog. | Unid. biblio | Compet. | Doc(s). fuente |
|---|---|:--:|--:|--:|--:|---|
| Cálculo Diferencial e Integral | CAL425 | ✅ | 5 | 5 | 14 | `LPN_Sem04_Calculo_A_68bd8acc.json` |
| Educación Física | CO011 | 🟡 | 0 | 4 | 14 | `LPN_Sem04_Educacion-Fisica_B_2051cd3c.json` |
| Manejo de embarcaciones de supervivencia y botes de rescate que no sean botes de rescate rápidos | C0036 | ✅ <sub>(A/B ×2)</sub> | 10 | 11 | 14 | `LPN_Sem04_Manejo-Embarcaciones_A_e4781c5b.json`<br>`LPN_Sem04_Manejo-Embarcaciones_B_b660c9a4.json` |
| Maquinaria Marítima Auxiliar | MMA428 | ✅ <sub>(A/B ×2)</sub> | 10 | 10 | 14 | `LPN_Sem04_MMA428_A_dff78d8b.json`<br>`LPN_Sem04_MMA428_B_3ff614d2.json` |
| Meteorología I | MET425 | ✅ <sub>(A/B ×2)</sub> | 10 | 12 | 14 | `LPN_Sem04_MET425_A_904094cb.json`<br>`LPN_Sem04_MET425_B_ae70bf8d.json` |
| Navegación II | NAV423 | ✅ <sub>(A/B ×2)</sub> | 10 | 10 | 14 | `LPN_Sem04_Navegacion_A_6c1b3270.json`<br>`LPN_Sem04_Navegacion_B_76471856.json` |
| Practicas Marineras IV | TAL427 | ✅ <sub>(A/B ×2)</sub> | 8 | 8 | 14 | `LPN_Sem04_TAL427_A_f248c56b.json`<br>`LPN_Sem04_TAL427_B_b3e5d4b6.json` |
| Técnicas de argumentación | C0102 | ✅ | 5 | 5 | 14 | `LPN_Sem04_Tecnicas-De-Argumentacion_B_7d648c91.json` |

### Piloto Naval — Semestre 6

| Materia | Clave | Estado | Unid. prog. | Unid. biblio | Compet. | Doc(s). fuente |
|---|---|:--:|--:|--:|--:|---|
| Educación Física | CO011 | ✅ <sub>(A/B ×2)</sub> | 2 | 4 | 14 | `LPN_Sem06_Educacion-Fisica_B_c19d2b2a.json`<br>`LPN_Sem06_Educacion-Fisica_A_df93654c.json` |
| Electrónica | ELC642 | 🟡 <sub>(A/B ×3)</sub> | 0 | 8 | 14 | `LPN_Sem06_UNIO2026_A_04ddca84.json`<br>`LPN_Sem06_UNIO2026_A_32f06728.json`<br>`LPN_Sem06_UNIO2026_B_a0166cc4.json` |
| Laboratorio de Navegación | LNV639 | 🟡 <sub>(A/B ×2)</sub> | 0 | 7 | 14 | `LPN_Sem06_UNIO2026_B_7ef3068d.json`<br>`LPN_Sem06_UNIO2026_A_7144db86.json` |
| Maniobras II | MAN640 | 🟡 <sub>(A/B ×2)</sub> | 0 | 10 | 14 | `LPN_Sem06_UNIO2026_A_467f4b0c.json`<br>`LPN_Sem06_UNIO2026_B_28a6dbe5.json` |
| Navegación IV | NAV637 | 🟡 <sub>(A/B ×2)</sub> | 0 | 7 | 14 | `LPN_Sem06_Navegacion_A_c10d0188.json`<br>`LPN_Sem06_Navegacion_B_b5bd1718.json` |
| Pensamiento Crítico | C0106 | ✅ <sub>(A/B ×2)</sub> | 2 | 4 | 14 | `LPN_Sem06_Pensamiento-Critico_A_96a3295c.json`<br>`LPN_Sem06_Pensamiento-Critico_B_ffcc5b42.json` |
| Prácticas Marineras VI | PMR644 | 🟡 <sub>(A/B ×2)</sub> | 0 | 8 | 14 | `LPN_Sem06_UNIO2026_A_36581417.json`<br>`LPN_Sem06_PrACticas-Marineras-Vi_B_ae84cb83.json` |
| Primeros Auxilios Médicos | C0039 | 🟡 | 0 | 10 | 14 | `LPN_Sem06_UNIO2026_B_87b5c565.json` |
| Situaciones de emergencia | INS643 | 🟡 <sub>(A/B ×2)</sub> | 0 | 4 | 14 | `LPN_Sem06_UNIO2026_A_869d58df.json`<br>`LPN_Sem06_UNIO2026_A_59774fa6.json` |
| Teoría del Buque I | TEB641 | 🟡 <sub>(A/B ×2)</sub> | 0 | 9 | 12 | `LPN_Sem06_UNIO2026_A_fac41495.json`<br>`LPN_Sem06_UNIO2026_B_70a689e6.json` |

### Piloto Naval — Semestre 8

| Materia | Clave | Estado | Unid. prog. | Unid. biblio | Compet. | Doc(s). fuente |
|---|---|:--:|--:|--:|--:|---|
| Administración Naviera y Portuaria | ADM858 | 🟡 <sub>(A/B ×2)</sub> | 0 | 9 | 10 | `LPN_Sem08_Administracion-Naviera_A_81f88715.json`<br>`LPN_Sem08_Adminsitracion-Naviera_B_88127289.json` |
| Carga y Estiba II | CYE855 | 🟡 | 0 | 5 | 14 | `LPN_Sem08_UNIO2026_A_7dcd9d67.json` |
| Convenios Organización Marítima Internacional II | OMI859 | 🟡 <sub>(A/B ×2)</sub> | 0 | 3 | 14 | `LPN_Sem08_Convenios_B_3a05dba9.json`<br>`LPN_Sem08_Convenios_A_dc874bf6.json` |
| Economía Marítima | ECM860 | 🟡 <sub>(A/B ×2)</sub> | 0 | 5 | 14 | `LPN_Sem08_Economia-Maritima_A_9858893c.json`<br>`LPN_Sem08_Economia-Maritima_4b5dc8f3.json` |
| Educación Física | CO011 | 🟡 | 0 | 4 | 14 | `LPN_Sem08_Educacion-Fisica_A_8967aec6.json` |
| Inglés Marítimo VIII (Maritime English 2) | 853 | 🟡 | 0 | 4 | 14 | `LPN_Sem08_Ingles-Maritimo_A_8458d5f5.json` |
| Legislación Marítima y Laboral | LRM856 | 🟡 <sub>(A/B ×2)</sub> | 0 | 9 | 13 | `LPN_Sem08_Legislacion-Maritima_A_9715ce5d.json`<br>`LPN_Sem08_Legislacion-Maritima_B_e5d75068.json` |
| Practicas marineras VIII | PMR860 | ✅ <sub>(A/B ×2)</sub> | 6 | 6 | 14 | `LPN_Sem08_PMR860_A_35e50d59.json`<br>`LPN_Sem08_PMR860_B_b685be7f.json` |
| Simuladores de Navegación II | SNV854 | 🟡 <sub>(A/B ×2)</sub> | 0 | 6 | 14 | `LPN_Sem08_Simulador-Navegacion_A_ddfd3624.json`<br>`LPN_Sem08_Simulador-Navegacion_A_0e1a0441.json` |
| Sistema de posicionamiento dinámico | C0113 | 🟡 <sub>(A/B ×2)</sub> | 0 | 10 | 14 | `LPN_Sem08_Poscionamiento-Dinamico_A_059be9e9.json`<br>`LPN_Sem08_UNIO2026_A_7496011c.json` |
| Sistema Mundial de Socorro y Salvamento Marítimo | SMS857 | 🟡 <sub>(A/B ×2)</sub> | 0 | 5 | 14 | `LPN_Sem08_UNIO2026_A_eb6cdc3f.json`<br>`LPN_Sem08_UNIO2026_B_1c7a7dc5.json` |

### Maquinista Naval — Semestre 2

| Materia | Clave | Estado | Unid. prog. | Unid. biblio | Compet. | Doc(s). fuente |
|---|---|:--:|--:|--:|--:|---|
| Educación Física II | C0011 | ✅ | 6 | 6 | 14 | `LMN_Sem02_Educacion-Fisica_A_0b85132a.json` |
| Electricidad II | ELE209 | ✅ <sub>(A/B ×2)</sub> | 5 | 5 | 14 | `LMN_Sem02_ELE209_A_e7fe7074.json`<br>`LMN_Sem02_ELE209_A_dff98fed.json` |
| Estática | EST212 | ✅ | 10 | 10 | 14 | `LMN_Sem02_Estatica_A_8ec8ff29.json` |
| Formación Básica al STCW | C0089 | ✅ | 5 | 5 | 14 | `LMN_Sem02_Formacion-Basica_A_4568c617.json` |
| Metodología de la investigación | MEI213 | ✅ | 10 | 10 | 14 | `LMN_Sem02_MetodologIA-De-La-InvestigaciON_A_68476a15.json` |
| Prácticas Marineras II | PMR215 | ✅ | 10 | 12 | 14 | `LMN_Sem02_PMR215_A_a5b46443.json` |
| Taller I | TAL213 | ✅ | 9 | 9 | 14 | `LMN_Sem02_TAL213_A_952aa701.json` |

### Maquinista Naval — Semestre 6

| Materia | Clave | Estado | Unid. prog. | Unid. biblio | Compet. | Doc(s). fuente |
|---|---|:--:|--:|--:|--:|---|
| Electrónica | ELA641 | 🟡 | 0 | 7 | 14 | `LMN_Sem06_Electronica_A_3f49b04e.json` |
| Generadores y máquinas de vapor | GMV639 | 🟡 | 0 | 7 | 14 | `LMN_Sem06_Generadores-Y-Maquinaria_A_9fae6e9e.json` |
| Motores II | MOT637 | 🟡 | 0 | 6 | 14 | `LMN_Sem06_Motores_A_87e5d6d5.json` |
| Pensamiento Crítico | C0106 | ✅ | 2 | 4 | 14 | `LMN_Sem06_Pensamiento-Critico_A_9cebfcb5.json` |
| Practicas Marineras VI | PMR644 | ✅ | 7 | 7 | 14 | `LMN_Sem06_PMR644_A_d25b2781.json` |
| Primeros Auxilios Médicos | C0039 | 🟡 | 0 | 10 | 14 | `LMN_Sem06_UNIO2026_A_4ed811ee.json` |
| Refrigeración I | REF640 | 🟡 | 0 | 5 | 14 | `LMN_Sem06_Refrigeracion_A_d4c4124b.json` |
| Taller V | TAL642 | 🟡 | 0 | 9 | 14 | `LMN_Sem06_UNIO2026_A_ec6ec3de.json` |

### Maquinista Naval — Semestre 8

| Materia | Clave | Estado | Unid. prog. | Unid. biblio | Compet. | Doc(s). fuente |
|---|---|:--:|--:|--:|--:|---|
| Administración Naviera y Portuaria | ADM857 | 🟡 | 0 | 9 | 10 | `LMN_Sem08_Administracion-Naviera_A_4f15ca2f.json` |
| Convenios Organización Marítima Internacional II | OMI858 | 🟡 | 0 | 3 | 14 | `LMN_Sem08_Convenios-Omi_A_ae020355.json` |
| Economía Marítima | ECM859 | 🟡 | 0 | 5 | 14 | `LMN_Sem08_Economia-Maritima_A_8cabbc85.json` |
| Educación Física VIII A MN | CO011 | 🟡 | 0 | 4 | 14 | `LMN_Sem08_Eduacion-Fisica_A_8bd8f879.json` |
| Laboratorio Diesel | LDO854 | 🟡 | 0 | 3 | 14 | `LMN_Sem08_Laboratorio-Diesel_A_2608af26.json` |
| Legislación Marítima y Laboral | LRM856 | 🟡 | 0 | 9 | 13 | `LMN_Sem08_Legilsacion-Maritima_A_370b103e.json` |
| Metodología de la investigación | MEI212 | ✅ | 10 | 10 | 14 | `LMN_Sem08_Metodologia-Investigacion_A_3ed62665.json` |
| Practicas marineras VIII | PMR860 | ✅ | 6 | 6 | 14 | `LMN_Sem08_PMR860_A_85d578e8.json` |
| Simulador de Máquinas | SIM852 | 🟡 | 0 | 5 | 14 | `LMN_Sem08_Simulador-De-Maquinas_A_21d723bc.json` |
| Turbinas de Combustión | TUC855 | 🟡 | 0 | 6 | 14 | `LMN_Sem08_Turbinas-De-CombustiON_A_6ab53b82.json` |

## 🟡 Temario vacío — re-extraer del original (no es brecha de documento)

El doc par SÍ está en el corpus (se indica el original de origen); solo falló la extracción
del temario. Recuperable re-procesando ese original. Ordenado por carrera/semestre:

- **Electrónica** (Maquinista Naval · Sem 6, clave ELA641) — `LMN_Sem06_Electronica_A_3f49b04e.json` · origen `plan_195 ELECTRONICA GRUPO VI A MN.pdf`
- **Generadores y máquinas de vapor** (Maquinista Naval · Sem 6, clave GMV639) — `LMN_Sem06_Generadores-Y-Maquinaria_A_9fae6e9e.json` · origen `plan_generadores8y8m8quinas8de8vapor_vimn_enmt GENERADORES  Y MAQUINARIA GRUPO VI A MN.pdf`
- **Motores II** (Maquinista Naval · Sem 6, clave MOT637) — `LMN_Sem06_Motores_A_87e5d6d5.json` · origen `plan_motores_viamn_enmt MOTORES II GRUPO VI A MN.pdf`
- **Primeros Auxilios Médicos** (Maquinista Naval · Sem 6, clave C0039) — `LMN_Sem06_UNIO2026_A_4ed811ee.json` · origen `plan_92 PRIMEROS AUXILIOS MEDICOS VI A MN.pdf`
- **Refrigeración I** (Maquinista Naval · Sem 6, clave REF640) — `LMN_Sem06_Refrigeracion_A_d4c4124b.json` · origen `plan_171 REFRIGERACION VI A MN.pdf`
- **Taller V** (Maquinista Naval · Sem 6, clave TAL642) — `LMN_Sem06_UNIO2026_A_ec6ec3de.json` · origen `plan_248 TALLER GRUPO VI A MN.pdf`
- **Administración Naviera y Portuaria** (Maquinista Naval · Sem 8, clave ADM857) — `LMN_Sem08_Administracion-Naviera_A_4f15ca2f.json` · origen `admnavyport_viiiamn_enmt ADMINISTRACION NAVIERA VIII A MN.pdf`
- **Convenios Organización Marítima Internacional II** (Maquinista Naval · Sem 8, clave OMI858) — `LMN_Sem08_Convenios-Omi_A_ae020355.json` · origen `lmn_convenios8o.m.i.8ii_8viiia_m.n_enmt CONVENIOS OMI VII MN.pdf`
- **Economía Marítima** (Maquinista Naval · Sem 8, clave ECM859) — `LMN_Sem08_Economia-Maritima_A_8cabbc85.json` · origen `plan_economia8mar8tima_viiia_imn ECONOMIA MARITIMA VIII A MN.pdf`
- **Educación Física VIII A MN** (Maquinista Naval · Sem 8, clave CO011) — `LMN_Sem08_Eduacion-Fisica_A_8bd8f879.json` · origen `plan_vii8a8mn EDUACION FISICA VIII A MN.pdf`
- **Laboratorio Diesel** (Maquinista Naval · Sem 8, clave LDO854) — `LMN_Sem08_Laboratorio-Diesel_A_2608af26.json` · origen `plan_laboratorio8diesel_viii_amn_enmt GRUPO VIII A MN.pdf`
- **Legislación Marítima y Laboral** (Maquinista Naval · Sem 8, clave LRM856) — `LMN_Sem08_Legilsacion-Maritima_A_370b103e.json` · origen `lmn_legislaci8n8mar8tima8y8laboral_8viiia8mn8 LEGILSACION MARITIMA VIII A MN.pdf`
- **Simulador de Máquinas** (Maquinista Naval · Sem 8, clave SIM852) — `LMN_Sem08_Simulador-De-Maquinas_A_21d723bc.json` · origen `plan_172 SIMULADOR DE MAQUINAS VIII A MN.pdf`
- **Turbinas de Combustión** (Maquinista Naval · Sem 8, clave TUC855) — `LMN_Sem08_Turbinas-De-CombustiON_A_6ab53b82.json` · origen `lmn_turbinas8de8combusti8n_viiiamn_enmt VIII MN.pdf`
- **Educación Física** (Piloto Naval · Sem 4, clave CO011) — `LPN_Sem04_Educacion-Fisica_B_2051cd3c.json` · origen `plan_ef_iv8b8pn EDUCACION FISICA IV B PN.pdf`
- **Electrónica** (Piloto Naval · Sem 6, clave ELC642) — `LPN_Sem06_UNIO2026_A_04ddca84.json` · origen `plan_14 ELECTRONICA GRUPO VI A PN.pdf`
- **Laboratorio de Navegación** (Piloto Naval · Sem 6, clave LNV639) — `LPN_Sem06_UNIO2026_B_7ef3068d.json` · origen `plan_149 LABORATORIO NAVEGACION VI B PN.pdf`
- **Maniobras II** (Piloto Naval · Sem 6, clave MAN640) — `LPN_Sem06_UNIO2026_A_467f4b0c.json` · origen `planeaci8n8didactica_maniobra8ii_via8pn8_enmt MANIOBAS II GRUPO VI A PN.pdf`
- **Navegación IV** (Piloto Naval · Sem 6, clave NAV637) — `LPN_Sem06_Navegacion_A_c10d0188.json` · origen `planeacion_2 NAVEGACION IV VIA PN.pdf`
- **Prácticas Marineras VI** (Piloto Naval · Sem 6, clave PMR644) — `LPN_Sem06_UNIO2026_A_36581417.json` · origen `plan8practicasmarineras_1.pdf`
- **Primeros Auxilios Médicos** (Piloto Naval · Sem 6, clave C0039) — `LPN_Sem06_UNIO2026_B_87b5c565.json` · origen `lmn_primeros8auxilios8m8dicos_vi_bpn PRIMEROS AUXILISO GRUPO VI B PN.pdf`
- **Situaciones de emergencia** (Piloto Naval · Sem 6, clave INS643) — `LPN_Sem06_UNIO2026_A_869d58df.json` · origen `plan_situaciones8de8emergencia_vi_b_pn_enmt SIT EMERGENCIA GRUPO VI B PN.pdf`
- **Teoría del Buque I** (Piloto Naval · Sem 6, clave TEB641) — `LPN_Sem06_UNIO2026_A_fac41495.json` · origen `plan_23 TEORIA DEL BUQUE VI A PN.pdf`
- **Administración Naviera y Portuaria** (Piloto Naval · Sem 8, clave ADM858) — `LPN_Sem08_Administracion-Naviera_A_81f88715.json` · origen `admvavypot_viiiapn_enmt ADMINISTRACION NAVIERA  VIII A PN.pdf`
- **Carga y Estiba II** (Piloto Naval · Sem 8, clave CYE855) — `LPN_Sem08_UNIO2026_A_7dcd9d67.json` · origen `plan_cye_viii_a_pn_enmt CARGA Y ESTIBA VIII A PN.pdf`
- **Convenios Organización Marítima Internacional II** (Piloto Naval · Sem 8, clave OMI859) — `LPN_Sem08_Convenios_B_3a05dba9.json` · origen `lpn_5 CONVENIOS GRUPO VIII B PN.m`
- **Economía Marítima** (Piloto Naval · Sem 8, clave ECM860) — `LPN_Sem08_Economia-Maritima_A_9858893c.json` · origen `plan_economia8maritima_viii_grupo_a8pn_enmt ECONOMIA MARITIMA VIII A PN.pdf`
- **Educación Física** (Piloto Naval · Sem 8, clave CO011) — `LPN_Sem08_Educacion-Fisica_A_8967aec6.json` · origen `plan_ef8vii8a8pn8- EDUCACION FISICA VIII A PN.pdf`
- **Inglés Marítimo VIII (Maritime English 2)** (Piloto Naval · Sem 8, clave 853) — `LPN_Sem08_Ingles-Maritimo_A_8458d5f5.json` · origen `planeaci8n8viibfirmada INGLES MARITIMO VIII B PN.pdf`
- **Legislación Marítima y Laboral** (Piloto Naval · Sem 8, clave LRM856) — `LPN_Sem08_Legislacion-Maritima_A_9715ce5d.json` · origen `lpn_legislaci8n8mar8tima8y8laboral_8viiia8pn8 LEGISLACION MARITIMA VIII A PN.pdf`
- **Simuladores de Navegación II** (Piloto Naval · Sem 8, clave SNV854) — `LPN_Sem08_Simulador-Navegacion_A_ddfd3624.json` · origen `plan_152 SIMULADOR NAVEGACION VIII A PN.pdf`
- **Sistema de posicionamiento dinámico** (Piloto Naval · Sem 8, clave C0113) — `LPN_Sem08_Poscionamiento-Dinamico_A_059be9e9.json` · origen `lpn_dp_viiibpn POSCIONAMIENTO DINAMICO GRUPO VIII A PN.pdf`
- **Sistema Mundial de Socorro y Salvamento Marítimo** (Piloto Naval · Sem 8, clave SMS857) — `LPN_Sem08_UNIO2026_A_eb6cdc3f.json` · origen `planeaci8n8didactica_3 GMDSS GRUPO VIII A PN.pdf`
