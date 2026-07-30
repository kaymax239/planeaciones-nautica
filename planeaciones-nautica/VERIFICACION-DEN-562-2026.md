# Verificación de planeaciones/avances/exámenes vs. Oficio DEN/562/2026

**Fecha:** 2026-07-30 · **Ciclo:** Agosto–Diciembre 2026 (semestres I, III, V, VII y Mecatrónica I)
**Fuente normativa:** Oficio DEN/562/2026 (retoma DEN/526/2025 para criterios y DEN/482/2025 para tipo de asignatura).
**Alcance de esta revisión:** solo análisis y comprobación. **No se modificó ningún archivo.**

---

## 1. Criterios que establece el oficio

**Art. 25 — criterio general (aplica salvo excepción):**
- Materias **teóricas**: Conocimiento 70 % · Prácticas y Actividades 20 % · Participaciones/TIC's 10 %
- Materias **prácticas**: Conocimiento 20 % · Prácticas y Actividades 70 % · Participaciones/TIC's 10 %

**Excepción — 3er y 4to año (generaciones 2024‑2028 y 2023‑2027):**
- **teóricas**: 50 / 25 / 25
- **prácticas**: 25 / 50 / 25

**Art. 26 — Inglés** (parcial, semestral, extraordinario y regularización):
- 4 habilidades a **25 % cada una**: Escuchar (Listening), Leer (Reading), Hablar (Speaking), Escribir (Writing).

**Mínimo aprobatorio:** 6.0 (según generación/año). El promedio aprobatorio de las parciales da derecho a la ordinaria.

**Tipo de asignatura (teórica/práctica):** se define con la tabla del oficio DEN/482/2025 (transcrita más abajo). No aplica a inglés.

---

## 2. Lo que SÍ coincide con la app

- Esquema teóricas 70/20/10 y prácticas 20/70/10 (1er año / general) → **coincide** (`evaluacion.ts` → `CRITERIOS_NUEVO_INGRESO`).
- Esquema 50/25/25 y 25/50/25 (3er/4to año) → **coincide** (`CRITERIOS_EN_CURSO`).
- Mínimas aprobatorias 7.0 (nuevo ingreso) y 6.0 (en curso) → consistentes con el oficio.
- El total del examen = % de "Conocimiento" del esquema de la materia → método correcto (`puntajeExamen.ts`).

---

## 3. Discrepancia A — INGLÉS (estructural)

| | Oficio DEN/562/2026 (Art. 26) | App (`puntajeExamen.ts` → `INGLES_EVALUACION`) |
|---|---|---|
| Habilidades | **4**: Listening, Reading, Speaking, Writing | **5**: Gram/Vocab, Listening, Speaking, Reading, Writing |
| Ponderación parcial | 25 % c/u (= 100 %) | 17 pts c/u (= 85) **+ 15 Participación y Libro** = 100 |
| Ponderación ordinario | 25 % c/u (= 100 %) | 20 pts c/u (5×20 = 100) |

**No concuerda.** El oficio pide 4 habilidades iguales al 25 %; la app usa 5 habilidades (añade Gram/Vocab) y en parciales mete un bloque de 15 de Participación/Libro que el oficio no contempla en la ponderación.

⚠️ **Importante:** el correo remisor dice *"Se hará alcance para definir la evaluación de inglés."* Es decir, viene un documento posterior que puede afinar/cambiar esto. **Recomendación: no tocar inglés hasta recibir el alcance**, pero dejar registrado que el esquema actual ya difiere del Art. 26.

---

## 4. Discrepancia B — Clasificación Teórica/Práctica

El tipo de asignatura decide qué esquema (70/20/10 vs 20/70/10, o 50/25/25 vs 25/50/25) y qué total de examen aplica. Estas materias tienen en la app un tipo **contrario** al del oficio DEN/482/2025, lo que **invierte los puntajes** de la planeación, el avance y el examen:

| Carrera / Sem | Materia | Oficio | App | Efecto en puntaje (planeación y examen) |
|---|---|---|---|---|
| PN I | Álgebra | Práctica | Teórica | 20/70/10 → app pone 70/20/10 · examen 20 → **70** |
| MN I | Álgebra | Práctica | Teórica | igual que arriba |
| MN I | Transporte Marítimo | Teórica | Práctica | 70/20/10 → app pone 20/70/10 · examen 70 → **20** |
| PN III | Navegación I | Teórica | Práctica | 50/25/25 → app pone 25/50/25 · examen 50 → **25** |
| PN III | Hidrografía | Teórica | Práctica | igual |
| PN III | Cartografía | Teórica | Práctica | igual |
| PN III | Dinámica | Teórica | Práctica | igual |
| PN III | Técnicas Avanzadas de Lucha Contra Incendios | Práctica | Teórica | 25/50/25 → app pone 50/25/25 · examen 25 → **50** |
| MN III | Dinámica | Teórica | Práctica | 50/25/25 → app pone 25/50/25 · examen 50 → **25** |
| MN III | Tecnología de Materiales | Teórica | Práctica | igual |
| MN III | Técnicas Avanzadas de Lucha Contra Incendios | Práctica | Teórica | 25/50/25 → app pone 50/25/25 · examen 25 → **50** |
| MN V | Motores I | Práctica | Teórica | igual (empate de horas 36/36, el código resuelve a Teórica) |
| MN V | Mecánica de Fluidos | Práctica | Teórica | igual (empate 27/27) |
| PN VII | Teoría del Buque II | Práctica | Teórica | 25/50/25 → app pone 50/25/25 · examen 25 → **50** (empate 27/27) |

**Semestres sin discrepancia de tipo:** PN V (todo coincide).

Origen técnico: la app deriva el tipo del campo `tipo`/horas del PPE FIDENA 2022 (`app/data/contenidos/*.ts` + `tipoMateriaDesdePrograma`). Donde el PPE 2022 dice "Práctica" o marca empate de horas, no coincide con la reclasificación del oficio DEN/482/2025.

---

## 5. Punto C — Semestre III (2do año): esquema a confirmar

El oficio asigna el 50/25/25 **explícitamente solo a 3er y 4to año** (gen 2024‑2028 y 2023‑2027 = Sem V y VII). No menciona el 2do año (Sem III = gen 2025‑2029) en esa excepción, por lo que por lectura literal le tocaría el **Art. 25 general (70/20/10)**.

La app, en cambio, trata **Sem III como "en curso" → 50/25/25**.

➡️ **Requiere tu confirmación:** ¿Sem III (2do año) va con 50/25/25 (como está hoy, respaldado por DEN‑065‑2026) o con 70/20/10 (lectura literal de este oficio)? Esto afecta a **todas** las materias de Sem III, no solo a las de la tabla B.

---

## 6. Punto D — Maquinista Naval Sem VII: revisar lista completa

La tabla del oficio para MN VII quedó partida entre las páginas 5 y 6. En la app, MN VII incluye además **"Automática"** y **"Laboratorio de Máquinas"**, que no aparecen en la parte visible del oficio. Conviene cotejar la lista completa de MN VII (y su tipo) contra el oficio impreso.

---

## 7. Impacto en exámenes parciales y ordinarios

Como el total del examen = % de Conocimiento del esquema de la materia, **todas las discrepancias de la sección 4 arrastran el total del examen** (ej.: una materia mal clasificada como práctica en Sem III genera examen de 25 pts en lugar de 50). Inglés (sección 3) afecta el examen Word de Gram/Vocab (17/20) y el reparto por habilidades.

---

## 8. Resumen

- ✅ Núcleo de porcentajes (70/20/10, 20/70/10, 50/25/25, 25/50/25) y mínimas: correcto.
- ❌ **Inglés:** 5 habilidades + 15 de participación vs. 4×25 % del oficio (esperar alcance).
- ❌ **14 materias** con tipo teórica/práctica invertido → puntajes y exámenes invertidos.
- ❓ **Sem III:** confirmar si es 50/25/25 o 70/20/10.
- ❓ **MN VII:** cotejar lista completa (Automática, Laboratorio de Máquinas).

---

## 9. Actualización — cambios APLICADOS (2026-07-30)

Se actualizó el proyecto para usar los criterios de **este** oficio (ya no los del año pasado):

**`app/data/evaluacion.ts`**
- Nueva generación **`segundo-ano`** (2.º Año / III SEMESTRE): usa el criterio general 70/20/10 y 20/70/10, con **mínima 6.0**.
- `generacionPorSemestre`: I → `nuevo-ingreso` (7.0) · **III → `segundo-ano` (70/20/10, 6.0)** · V y VII → `en-curso` (50/25/25, 6.0).
- `criteriosEvaluacion` y `ESCALA` ajustados para las tres generaciones.

**Clasificación teórica/práctica corregida a DEN/482/2025 (14 materias):**
- `semestre1.ts`: Álgebra → Práctica
- `semestre3.ts`: Navegación I, Hidrografía, Cartografía, Dinámica → Teórica · Técnicas Avanzadas de Lucha Contra Incendios → Práctica
- `semestre7.ts`: Teoría del Buque II → Práctica
- `mn1.ts`: Transporte Marítimo → Teórica · Álgebra → Práctica
- `mn3.ts`: Dinámica, Tecnología de Materiales → Teórica · Técnicas Avanzadas → Práctica
- `mn5.ts`: Motores I, Mecánica de Fluidos → Práctica

**Verificación:** 0 discrepancias de tipo restantes contra el oficio · `npx tsc --noEmit` sin errores · el esquema resultante por semestre coincide con el oficio.

**Inglés:** NO se tocó (a la espera del alcance).

**Pendiente de tu revisión manual:** MN VII incluye "Automática" y "Laboratorio de Máquinas", que no aparecían en la parte visible del oficio — cotejar contra el impreso. Además, las planeaciones/avances/exámenes ya exportados antes de hoy conservan los valores viejos y habría que regenerarlos.

## 10. Exámenes parciales y ordinarios — valor total y por pregunta

El valor total del examen se deriva del mismo esquema corregido (`totalExamenDesdeEsquema` = % de **Conocimiento** de la materia), tanto para parcial como para ordinario, y se reparte 40/20/20/20 con valor por pregunta en fracciones limpias que suman EXACTO. Con los cambios ya aplicados:

| Caso (según oficio) | Valor total examen | Reparto por sección → valor por pregunta | Suma |
|---|---:|---|---:|
| Teórica 1er/2do año (Sem I, III) | **70** | OM 8×3.5=28 · VF 7×2=14 · REL 4×3.5=14 · AB 4×3.5=14 | 70 ✓ |
| Práctica 1er/2do año (Sem I, III) | **20** | OM 8×1=8 · VF 8×0.5=4 · REL 4×1=4 · AB 4×1=4 | 20 ✓ |
| Teórica 3er/4to año (Sem V, VII) | **50** | OM 10×2=20 · VF 5×2=10 · REL 5×2=10 · AB 5×2=10 | 50 ✓ |
| Práctica 3er/4to año (Sem V, VII) | **25** | OM 10×1=10 · VF 5×1=5 · REL 5×1=5 · AB 5×1=5 | 25 ✓ |

El examen imprime el encabezado por sección "(N preguntas · p pts c/u · S pts)", así que el valor por pregunta queda a la vista. Inglés mantiene su propio esquema (sin tocar).
