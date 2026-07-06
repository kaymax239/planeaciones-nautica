# Análisis completo de la estrategia de IA del proyecto

> Solo análisis. No se modificó código. Fecha: 2026-07-06.
> Precios verificados el 2026-07-06 (API de Anthropic y de Google Gemini).

---

## 0. Resumen ejecutivo (léelo primero)

1. **El costo NO es el problema.** A la escala del proyecto (10–40 maestros, 1 presentación + 3 exámenes al mes), el gasto mensual de IA va de **~$0.17 (Gemini Flash)** a **~$7.50 (Claude Opus)** en el peor caso, para **40 maestros**. Con el caché ya implementado, el costo real recurrente tiende a **casi $0**. La decisión debe tomarse por **calidad y confiabilidad**, no por dinero.

2. **Los exámenes ya son gratis y así deben quedarse.** El motor de exámenes ([app/lib/examen.ts](app/lib/examen.ts)) es 100% determinista: arma las preguntas desde los subtemas del programa oficial, sin una sola llamada a IA. Costo = **$0**. Conectarlos a IA sería un retroceso (se pierde la garantía de que las preguntas salen del temario oficial).

3. **Verificación de facturación de Gemini (hecha en vivo hoy):** la `GEMINI_API_KEY` actual está en **plan gratuito**. `gemini-2.5-pro` devuelve **429 `limit: 0`** (sin cuota); `gemini-2.5-flash` responde **200 OK**. Volver a Gemini con `pro` exige **habilitar facturación** en Google Cloud primero.

4. **Recomendación: híbrido, ya prácticamente en su sitio.** Exámenes deterministas ($0) + Gemini Flash para planeaciones (F-32 e Inglés) + Claude para presentaciones. La única acción de valor real es **habilitar facturación en Gemini** para quitar los topes del free tier (429) cuando haya varios maestros a la vez, y **decidir Opus vs Sonnet** para presentaciones (Sonnet ahorra ~40% con calidad casi igual).

---

## 1. Inventario de IA en el código

### 1.1 Puntos que SÍ llaman a IA

| # | Ruta / archivo | Proveedor | Modelo (variable de entorno) | Qué genera | ¿Caché? |
|---|---|---|---|---|---|
| 1 | [app/api/presentacion/route.ts](app/api/presentacion/route.ts) | **Claude** | `ANTHROPIC_MODEL` → `claude-opus-4-8` | Guion de presentación PN/MN (JSON de diapositivas) a partir del programa oficial | **Sí** (`cachePresentacion`) |
| 2 | [app/api/presentacion-ingles/route.ts](app/api/presentacion-ingles/route.ts) | **Claude** | `claude-opus-4-8` | Presentación de Inglés espejeando planeaciones históricas del nivel (RAG) | **No** (paga en cada clic) |
| 3 | [app/api/planeacion-enriquecida/route.ts](app/api/planeacion-enriquecida/route.ts) | **Gemini** | `GEMINI_MODEL` → `gemini-2.5-flash` | Enriquecimiento pedagógico del F-32 (competencias, estrategias, secuencia) con `responseSchema` estricto | **Sí** (`cachePlaneacion`) |
| 4 | [app/api/planeacion-ingles/route.ts](app/api/planeacion-ingles/route.ts) | **Gemini** | `GEMINI_MODEL_INGLES` ‖ `GEMINI_MODEL` → `gemini-2.5-flash` | Planeación didáctica de Inglés espejeando históricas del nivel (RAG) | **No** (paga en cada clic) |

**Clientes/utilerías compartidas:**
- [app/lib/claudeIA.ts](app/lib/claudeIA.ts) — único punto donde vive `ANTHROPIC_API_KEY`. `generarTextoClaude()` usa streaming + `finalMessage()`. `extraerJSON()` aísla el JSON de la respuesta.
- El cliente de Gemini se instancia inline en cada ruta (`new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })`), no hay un `geminiIA.ts` central.
- Prompts: [app/lib/promptPresentacion.ts](app/lib/promptPresentacion.ts), [app/lib/promptPlaneacion.ts](app/lib/promptPlaneacion.ts) (los de Inglés están inline en sus rutas).
- Selección RAG: [app/lib/seleccionHistoricas.ts](app/lib/seleccionHistoricas.ts), [app/lib/bibliotecaIngles.ts](app/lib/bibliotecaIngles.ts).

### 1.2 Puntos DETERMINISTAS (sin IA, costo $0)

| Componente | Archivo | Qué hace |
|---|---|---|
| **Motor de exámenes (FASE 1)** | [app/lib/examen.ts](app/lib/examen.ts) | Arma preguntas de examen parcial/ordinario desde los **subtemas del programa oficial**. Sin llamadas a IA. |
| **Esquemas de puntaje / ponderación** | [app/data/evaluacion.ts](app/data/evaluacion.ts) | Los 4 esquemas de puntaje por tipo+generación (F-32/F-51/exámenes). Texto oficial, no IA. |
| **F-32 determinista** | `construirPresentacionV2` / generador Word | Es el **fallback** cuando la IA falla o no hay key: produce exactamente la planeación de hoy. |
| **F-51 / avance** | [app/lib/avanceF51.ts](app/lib/avanceF51.ts), [app/data/calendario.ts](app/data/calendario.ts) | Cálculo de avance y calendario, determinista. |
| **Render PPTX/DOCX** | [app/lib/pptxOficialV2.ts](app/lib/pptxOficialV2.ts), plantillas `.docx` | Renderizado local en el navegador/servidor, sin IA. |

> **Dato clave del inventario:** el temario **siempre** proviene del programa oficial o de las históricas; la IA solo *desarrolla*, nunca inventa temas. Y los exámenes ni siquiera tocan IA.

### 1.3 Estado actual de las claves

- `.env.local`: `GEMINI_API_KEY` presente (**free tier**), `GEMINI_MODEL=gemini-2.5-flash`. `ANTHROPIC_API_KEY` **comentada**.
- ⚠️ Esto implica que **las presentaciones (Claude) no funcionan en local** a menos que `ANTHROPIC_API_KEY` esté configurada en Vercel (producción). Verificar en el dashboard de Vercel.

---

## 2. Costos comparados por documento

### 2.1 Precios oficiales (por millón de tokens, USD)

| Modelo | Entrada | Salida | Nota |
|---|---|---|---|
| **Claude Opus 4.8** (`claude-opus-4-8`) | $5.00 | $25.00 | El más capaz de Anthropic |
| **Claude Sonnet 4.6** (`claude-sonnet-4-6`) | $3.00 | $15.00 | Calidad alta, ~40% más barato que Opus |
| **Gemini 2.5 Pro** (≤200k tokens) | $1.25 | $10.00 | >200k: $2.50 / $15.00. **Sin cuota en free tier.** |
| **Gemini 2.5 Flash** | $0.30 | $2.50 | Texto. Funciona en free tier. |

### 2.2 Tokens estimados por generación

> Estimación: ~4 caracteres/token. Los tokenizadores de Anthropic y Google difieren, pero para estimar costo el margen es despreciable. Los rangos reflejan que las presentaciones PN/MN son ligeras (solo programa+unidad) y las de Inglés son pesadas (hasta 3 planeaciones históricas de ~4,500 tokens c/u como contexto RAG).

| Documento | Entrada (tokens) | Salida (tokens) | Comentario |
|---|---|---|---|
| Presentación PN/MN | ~3,000 | ~5,000 | System + unidad del programa |
| Presentación Inglés | ~15,000 | ~5,000 | System + 3 históricas (RAG pesado) |
| **Presentación (representativa)** | **~10,000** | **~5,500** | Valor usado en las tablas de abajo |
| Planeación F-32 enriquecida | ~6,000 | ~4,000 | Solo la parte pedagógica |
| Planeación Inglés | ~18,000 | ~6,000 | RAG pesado, `maxOutputTokens=32000` |
| **Examen (parcial/ordinario)** | **0** | **0** | Determinista — no usa IA |

### 2.3 Costo por documento (perfil representativo: 10k entrada / 5.5k salida)

| Modelo | Costo por presentación | Costo por examen |
|---|---|---|
| Claude Opus 4.8 | **$0.19** | $0 |
| Claude Sonnet 4.6 | **$0.11** | $0 |
| Gemini 2.5 Pro | **$0.068** | $0 |
| Gemini 2.5 Flash | **$0.017** | $0 |

Cálculo Opus: `10,000 × $5/1M + 5,500 × $25/1M = $0.050 + $0.1375 = $0.1875`.

### 2.4 Costo por planeación F-32 enriquecida (6k / 4k) — dato extra

| Modelo | Costo |
|---|---|
| Gemini 2.5 Flash | $0.012 |
| Gemini 2.5 Pro | $0.048 |
| Claude Sonnet 4.6 | $0.078 |
| Claude Opus 4.8 | $0.13 |

---

## 3. Escenario mensual

**Supuesto del escenario:** cada maestro genera **1 presentación + 3 exámenes** al mes.
Como los **exámenes cuestan $0** (deterministas), el gasto mensual es, en la práctica, **solo el de la presentación**.

### 3.1 Peor caso (sin caché — cada presentación se genera fresca)

| Modelo | Costo/presentación | N=10 | N=20 | N=40 |
|---|---|---|---|---|
| Claude Opus 4.8 | $0.19 | **$1.90** | **$3.75** | **$7.50** |
| Claude Sonnet 4.6 | $0.11 | $1.13 | $2.25 | $4.50 |
| Gemini 2.5 Pro | $0.068 | $0.68 | $1.35 | $2.70 |
| Gemini 2.5 Flash | $0.017 | $0.17 | $0.34 | $0.67 |

*(Exámenes = $0 en todas las columnas.)*

### 3.2 Caso realista (con el caché ya implementado)

El currículo es **fijo**. La presentación de una unidad/nivel se genera **una vez** y queda en caché ([cachePresentacion](app/lib/cachePresentacion.ts) / [cachePlaneacion](app/lib/cachePlaneacion.ts)); todos los maestros que pidan esa misma unidad después la reciben **gratis**. Por lo tanto:

- El costo total de por vida ≈ (nº de unidades/niveles únicos del currículo) × (costo por presentación), **no** × nº de maestros.
- Tras "calentar" el caché, el costo mensual recurrente tiende a **casi $0** (solo unidades nuevas o regeneraciones con `forzar`).

> ⚠️ **Excepción:** las rutas de **Inglés** (`presentacion-ingles` y `planeacion-ingles`) **no cachean** — pagan en cada clic. Si el uso de Inglés crece, ahí conviene agregar caché (ver §6).

### 3.3 Si se incluyeran también planeaciones F-32 con IA (no pedido, pero realista)

Añadir 1 planeación F-32 enriquecida/mes por maestro suma, para N=40: **+$0.48/mes** (Gemini Flash) o **+$5.20/mes** (Opus). Sigue siendo trivial.

---

## 4. Volver a Gemini: cambios exactos y riesgos

### 4.1 Verificación de facturación (hecha hoy, en vivo)

Llamada mínima con la `GEMINI_API_KEY` actual:

```
POST .../models/gemini-2.5-pro:generateContent   → 429 RESOURCE_EXHAUSTED
   "limit: 0, model: gemini-2.5-pro"  (free_tier_input_token_count / requests)
POST .../models/gemini-2.5-flash:generateContent → 200 OK  (serviceTier: standard)
```

**Conclusión:** la key **NO tiene facturación activa**. `pro` está bloqueado (cuota 0). Solo `flash` funciona, y con los topes del free tier (RPM/RPD). Esto confirma el comentario en el código: *"el plan gratuito de Gemini limitaba a 0 el modelo pro → error 429"*.

### 4.2 Cambios para migrar las **presentaciones** de Claude → Gemini

En [app/api/presentacion/route.ts](app/api/presentacion/route.ts) y [app/api/presentacion-ingles/route.ts](app/api/presentacion-ingles/route.ts):

1. **Cliente:** reemplazar el import de `claudeIA` por `GoogleGenAI` (como ya hacen las rutas de planeación). Idealmente crear `app/lib/geminiIA.ts` (espejo de `claudeIA.ts`) con `generarTextoGemini()` y `tieneClaveGemini()`.
2. **Llamada:** cambiar `generarTextoClaude(system, mensaje)` por `client.models.generateContent({ model, contents: mensaje, config: { systemInstruction: system, responseMimeType: "application/json", temperature, maxOutputTokens } })`.
3. **Guard de key:** `tieneClaveAnthropic()` → chequeo de `GEMINI_API_KEY`.
4. **Modelo:** definir `GEMINI_MODEL_PRESENTACIONES` (ya previsto en los comentarios del código).
5. **Clave de caché:** el `modelo` entra en `claveCache(...)`; al cambiar de modelo se invalida el caché existente (se regenerará una vez por unidad). No rompe nada, solo re-paga el "calentamiento".
6. `extraerJSON()` ya existe y sirve igual. `maxDuration=300` se mantiene.

**Esfuerzo:** bajo (2 rutas + 1 lib opcional). El patrón ya está probado en las 2 rutas de planeación.

### 4.3 Cambios para "conectar los exámenes a Gemini"

Hoy los exámenes son deterministas y **no necesitan IA**. "Conectarlos a Gemini" significaría **generar los reactivos con IA** en lugar del motor actual. Requeriría:
- Nueva ruta `app/api/examen/route.ts` + prompt + esquema Zod/`responseSchema`.
- Cliente Gemini, validación tolerante y fallback al motor determinista.

**Recomendación: NO hacerlo.** Riesgo alto de perder la garantía de que las preguntas salen del temario oficial (el motor determinista sí lo garantiza). Mantener exámenes deterministas ($0, 100% alineados al programa).

### 4.4 Riesgos de volver a Gemini

| Riesgo | Detalle |
|---|---|
| **Sin facturación, `pro` = 429** | Verificado hoy. Volver a `pro` exige habilitar billing en Google Cloud primero. |
| **Topes del free tier en `flash`** | Con N=40 maestros generando a la vez se pueden pegar los límites RPM/RPD → 429 intermitentes. Habilitar billing los elimina. |
| **Calidad de JSON complejo** | Los decks de presentación (JSON con muchos tipos de bloque) salen más consistentes en Claude Opus. Flash puede requerir más reintentos/validación tolerante. |
| **Diferencias de `responseSchema`** | El modo estructurado de Gemini tiene reglas propias; hay que revisar el esquema de presentaciones si se fuerza JSON estricto. |
| **Regresión conocida** | La migración a Claude se hizo justamente porque Gemini free daba 429 en `pro`. Volver sin billing repite el problema. |

---

## 5. Límites de uso (1 presentación/maestro/mes, equivalente para exámenes)

### 5.1 ¿Cómo identificar al maestro? — **hoy no hay login**

No existe autenticación (ni librería de auth en `package.json`, ni formulario en `page.tsx`). Opciones, de menor a mayor esfuerzo:

| Opción | Esfuerzo | Robustez | Comentario |
|---|---|---|---|
| **Código de maestro / PIN** en la UI | Bajo | Media | El maestro escribe su código; se envía en el body. Sin passwords. Suficiente para un tope "de cortesía". |
| **Email + allowlist** | Bajo-medio | Media | Email institucional (`@fidena.edu.mx`) validado contra una lista. |
| **Login real** (Vercel/NextAuth con Google institucional) | Medio | Alta | Recomendado si el tope debe ser inviolable. Aprovecha las cuentas `@fidena.edu.mx`. |
| IP/dispositivo | Bajo | Baja | No confiable (IPs compartidas, VPN). No recomendado. |

**Recomendación:** para un límite "de cortesía" que evite abuso, basta **código de maestro o email institucional**. Si se quiere un tope estricto de facturación, **login con Google institucional**.

### 5.2 ¿Dónde guardar el contador? (opciones en Vercel)

| Opción | Idoneidad | Por qué |
|---|---|---|
| **Vercel KV / Upstash Redis** | ⭐ **Recomendado** | `INCR` atómico + `TTL` para reseteo mensual. Serverless-friendly, latencia mínima, casi gratis a esta escala. |
| **Upstash Redis (directo)** | Igual de bueno | Lo mismo que Vercel KV (Vercel KV *es* Upstash por debajo). Útil si ya tienes cuenta Upstash. |
| **Vercel Postgres** | Funciona, sobredimensionado | Solo si además quieres **historial/auditoría** (quién generó qué y cuándo). Más lento para un simple contador. |

### 5.3 Lógica del contador

```
clave = `presentaciones:${maestroId}:${YYYY-MM}`   // p. ej. presentaciones:vcadenaa:2026-07
al generar (solo generación REAL con IA, no cache-hit):
    n = INCR(clave)
    if n == 1: EXPIRE(clave, segundos_hasta_fin_de_mes)
    if n > LIMITE: rechazar (no llamar a IA)
```

- **Reseteo mensual:** vía la clave con el mes (`YYYY-MM`) o `TTL` al primer día del mes siguiente.
- **No contar cache-hits:** una regeneración que se sirve del caché es gratis → **no debe** consumir cuota. Solo cuenta la generación real (IA) o `forzar`.
- **Equivalente para exámenes:** los exámenes son gratis (deterministas), así que un tope ahí es **opcional** (solo tiene sentido para limitar carga del servidor, no costo). Si se quiere: `examenes:${maestroId}:${YYYY-MM}` con límite 3.

### 5.4 ¿Qué pasa al agotar el límite?

- Devolver HTTP **429/403** con `{ error: "limite_mensual", mensaje: "Alcanzaste tu límite de 1 presentación este mes. Disponible de nuevo el 1 de <mes>." }`.
- **Fallback grácil** (ya existe el patrón): en F-32, el cliente cae al **generador determinista** (misma planeación de hoy). En presentaciones, mostrar el mensaje y ofrecer las ya cacheadas.
- Mostrar en la UI el contador ("1/1 usado este mes") para que sea transparente.

---

## 6. Recomendación final

**Híbrido (ya casi implementado), con dos ajustes.** Justificación por los números: a esta escala el costo es trivial en cualquier proveedor (§3), así que se optimiza por **calidad + confiabilidad + simplicidad**, no por precio.

| Flujo | Proveedor recomendado | Por qué |
|---|---|---|
| **Exámenes** | **Determinista (sin IA)** | $0, 100% alineado al temario oficial. No tocar. |
| **Presentaciones** | **Claude** (Opus 4.8, o **Sonnet 4.6** para ahorrar ~40%) | Mejor JSON estructurado y menos reintentos. Costo: incluso Opus para 40 maestros = **~$7.50/mes peor caso**, casi $0 con caché. |
| **Planeaciones F-32 e Inglés** | **Gemini 2.5 Flash** | Casi gratis (~$0.01/doc) y calidad suficiente para texto pedagógico. |

**Acciones concretas (por prioridad):**

1. **Habilitar facturación en Gemini** (Google Cloud). Elimina los 429 del free tier bajo concurrencia y desbloquea `pro` si algún día se quiere subir la calidad de planeaciones. Costo esperado: **céntimos al mes**.
2. **Confirmar `ANTHROPIC_API_KEY` en Vercel** (en local está comentada) para que las presentaciones funcionen en producción.
3. **Decidir Opus vs Sonnet para presentaciones.** Si el presupuesto asusta, `claude-sonnet-4-6` recorta ~40% con calidad casi igual. Se cambia con una variable de entorno (`ANTHROPIC_MODEL`), sin tocar código.
4. **Agregar caché a las rutas de Inglés** (`presentacion-ingles`, `planeacion-ingles`) — hoy pagan en cada clic. Es la única fuente de gasto que escala con el uso.
5. **Límite de uso:** implementarlo solo si preocupa el abuso; con **Vercel KV + código de maestro/email institucional** (§5). Dado que el costo es trivial, es más una medida de orden que de ahorro.

**Por qué NO "todo Gemini" ni "todo Claude":**
- *Todo Gemini*: la calidad del JSON de presentaciones baja y, sin billing, `pro` está bloqueado y `flash` topa en free tier. Ahorra centavos a cambio de más reintentos y riesgo de 429.
- *Todo Claude*: perfectamente viable en costo (sigue siendo <$10/mes para 40 maestros), pero pagar Opus para texto pedagógico simple (planeaciones) es gastar ~10× de más sin ganancia perceptible frente a Flash.

**Cifra de cierre:** con el híbrido recomendado y facturación de Gemini activa, el gasto mensual de IA para **40 maestros** (peor caso, sin caché) es **< $15**; con el caché ya implementado, **prácticamente $0** recurrente.
