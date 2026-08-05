import type { PresentacionV2 } from "./tiposV2";

// V2 — Álgebra (ALG103) · Unidad 1: Álgebra Elemental.
// MISMO contenido académico oficial que la V1 (PPE_LPN_FIDENA_2022): temario,
// objetivo, fórmulas, ejemplos y bibliografía son idénticos en texto.
// Solo cambia la EXPERIENCIA VISUAL: diagramas de flujo, mapas conceptuales,
// gráficos matemáticos, árboles y diapositivas de transición. Sin IA.

export const presentacionAlgebraU1V2: PresentacionV2 = {
  asignatura: "Álgebra",
  clave: "ALG103",
  unidad: "Unidad 1: Álgebra Elemental",
  carrera: "Licenciatura en Piloto Naval",
  semestre: "I Semestre",
  diapositivas: [
    /* 1 — Portada moderna */
    {
      layout: "portada",
      titulo: "Álgebra",
      subtitulo: "Unidad 1 · Álgebra Elemental",
      bloques: [],
    },

    /* 2 — Objetivo */
    {
      etiqueta: "Propósito de la unidad",
      titulo: "¿Qué lograremos en esta unidad?",
      bloques: [
        {
          tipo: "definicion",
          titulo: "Objetivo específico (programa oficial)",
          texto:
            "Relacionar la aritmética y el álgebra mediante letras y números, interpretando fórmulas y utilizando el lenguaje algebraico, para la correcta resolución de problemas.",
        },
        {
          tipo: "bullets",
          items: [
            "Traducir situaciones al lenguaje algebraico y operar con expresiones.",
            "Dominar exponentes, radicales, productos notables y factorización.",
            "Aplicar el álgebra a problemas inherentes a la profesión náutica.",
          ],
        },
      ],
    },

    /* 3 — Agenda como mapa mental */
    {
      etiqueta: "Agenda",
      titulo: "Mapa de la Unidad 1",
      bloques: [
        {
          tipo: "mapaConceptual",
          centro: "Unidad 1\nÁlgebra Elemental",
          ramas: [
            { titulo: "Bloque I · Fundamentos", detalle: "1.1 · 1.2 · 1.3" },
            { titulo: "Bloque II · Operaciones", detalle: "1.4 · 1.5 · 1.6" },
            { titulo: "Bloque III · Cierre", detalle: "1.7 · 1.8" },
          ],
        },
      ],
    },

    /* 4 — Divisor Bloque I */
    {
      layout: "divisor",
      etiqueta: "Bloque I",
      titulo: "Fundamentos del lenguaje algebraico",
      subtitulo: "Subtemas 1.1 a 1.3 — del número a la literal",
      bloques: [],
    },

    /* 5 — 1.1 Conceptos */
    {
      etiqueta: "Subtema 1.1",
      titulo: "Conceptos fundamentales de álgebra",
      bloques: [
        {
          tipo: "comparacion",
          izq: {
            titulo: "Aritmética",
            items: ["Trabaja con números concretos", "3 + 5 = 8", "Doble de 7 = 14", "Área = 4 × 6"],
          },
          der: {
            titulo: "Álgebra (lenguaje simbólico)",
            items: ["Generaliza con literales", "a + b", "2x", "A = b · h"],
          },
        },
      ],
    },

    /* 6 — 1.1 Términos clave (árbol) */
    {
      etiqueta: "Subtema 1.1",
      titulo: "Términos clave",
      bloques: [
        {
          tipo: "diagramaArbol",
          raiz: "Términos del álgebra",
          ramas: [
            { titulo: "Variable", ejemplo: "x, y, t" },
            { titulo: "Constante", ejemplo: "valor fijo" },
            { titulo: "Coeficiente", ejemplo: "factor numérico" },
            { titulo: "Término", ejemplo: "se separa por + o −" },
          ],
        },
      ],
    },

    /* 7 — 1.1 Lenguaje algebraico (flujo) */
    {
      etiqueta: "Subtema 1.1",
      titulo: "Lenguaje algebraico",
      bloques: [
        {
          tipo: "bullets",
          items: [
            "«El doble de un número» → 2x",
            "«Un número disminuido en 5» → x − 5",
            "«El cuadrado de la suma de dos números» → (a + b)²",
          ],
        },
        {
          tipo: "flujo",
          nodos: ["Un número: x", "El triple del número: 3x", "Aumentado en 7: 3x + 7"],
          resultado: "3x + 7",
        },
      ],
    },

    /* 8 — 1.2 Expresiones (árbol de clasificación) */
    {
      etiqueta: "Subtema 1.2",
      titulo: "Expresiones algebraicas",
      bloques: [
        {
          tipo: "diagramaArbol",
          raiz: "Expresiones algebraicas",
          ramas: [
            { titulo: "Monomio", ejemplo: "1 término · 5x²" },
            { titulo: "Binomio", ejemplo: "2 términos · x + 3" },
            { titulo: "Trinomio", ejemplo: "3 términos · x² + 5x + 6" },
            { titulo: "Polinomio", ejemplo: "varios términos" },
          ],
        },
        { tipo: "formulaDestacada", etiqueta: "Forma general de un polinomio", formula: "P(x) = aₙxⁿ + … + a₁x + a₀" },
      ],
    },

    /* 9 — 1.2 Práctica (flujo) */
    {
      etiqueta: "Subtema 1.2",
      titulo: "Práctica: evaluar P(x)",
      bloques: [
        {
          tipo: "flujo",
          nodos: ["P(2) = 2(2)² − 3(2) + 1", "= 2·4 − 6 + 1", "= 8 − 6 + 1"],
          resultado: "P(2) = 3",
        },
      ],
    },

    /* 10 — Gráfico de la parábola P(x) */
    {
      etiqueta: "Visualización",
      titulo: "Gráfico de P(x) = 2x² − 3x + 1",
      bloques: [
        {
          tipo: "grafico",
          clase: "parabola",
          etiqueta: "P(x)",
          labels: ["-1", "0", "1", "2", "3"],
          valores: [6, 1, 0, 3, 10],
        },
      ],
    },

    /* 11 — 1.2 Ejercicio */
    {
      etiqueta: "Subtema 1.2",
      titulo: "Tu turno",
      bloques: [
        {
          tipo: "ejercicioGuiado",
          enunciado: "Clasifica y evalúa los siguientes polinomios.",
          pista: "Cuenta los términos para clasificar; sustituye con cuidado los signos.",
          items: ["Clasifica y da el grado de 5x³ − 2x + 7.", "Evalúa Q(x) = x² + 4x − 5 para x = −1."],
        },
      ],
    },

    /* 12 — 1.3 Exponentes */
    {
      etiqueta: "Subtema 1.3",
      titulo: "Leyes de los exponentes",
      bloques: [
        {
          tipo: "formulas",
          items: [
            "aᵐ · aⁿ = aᵐ⁺ⁿ          aᵐ ÷ aⁿ = aᵐ⁻ⁿ          (aᵐ)ⁿ = aᵐⁿ",
            "(a·b)ⁿ = aⁿ · bⁿ          a⁰ = 1  (a ≠ 0)          a⁻ⁿ = 1 / aⁿ",
          ],
        },
      ],
    },

    /* 13 — 1.3 Radicales (flujo) */
    {
      etiqueta: "Subtema 1.3",
      titulo: "Radicales",
      bloques: [
        { tipo: "formulas", items: ["√(a·b) = √a · √b          ⁿ√(aᵐ) = a^(m/n)          1/√a = √a / a"] },
        {
          tipo: "flujo",
          orientacion: "horizontal",
          nodos: ["√50", "√(25·2)", "√25 · √2"],
          resultado: "5√2",
        },
      ],
    },

    /* 14 — Divisor Bloque II */
    {
      layout: "divisor",
      etiqueta: "Bloque II",
      titulo: "Operaciones y estructura algebraica",
      subtitulo: "Subtemas 1.4 a 1.6 — operar, multiplicar y factorizar",
      bloques: [],
    },

    /* 15 — 1.4 Operaciones */
    {
      etiqueta: "Subtema 1.4",
      titulo: "Operaciones algebraicas básicas",
      bloques: [
        { tipo: "proceso", etapas: ["Suma y resta", "Multiplicación", "División"] },
        {
          tipo: "bullets",
          items: [
            "Suma y resta: reducir términos semejantes (sumar coeficientes).",
            "Multiplicación: propiedad distributiva + ley de exponentes.",
            "División: entre monomios o división larga de polinomios.",
          ],
        },
      ],
    },

    /* 16 — 1.4 Práctica suma (flujo) */
    {
      etiqueta: "Subtema 1.4",
      titulo: "Práctica: suma de polinomios",
      bloques: [
        {
          tipo: "flujo",
          nodos: ["(2x² + 3x − 5) + (x² − x + 2)", "Agrupar semejantes: (2x² + x²) + (3x − x) + (−5 + 2)", "Sumar coeficientes en cada grupo"],
          resultado: "3x² + 2x − 3",
        },
      ],
    },

    /* 17 — 1.4 Práctica división (flujo) */
    {
      etiqueta: "Subtema 1.4",
      titulo: "Práctica: división de polinomios",
      bloques: [
        {
          tipo: "flujo",
          nodos: ["(x² + 5x + 6) ÷ (x + 2)", "Factorizar: x² + 5x + 6 = (x + 2)(x + 3)", "Cancelar el factor (x + 2)"],
          resultado: "x + 3",
        },
      ],
    },

    /* 18 — 1.5 Productos notables + gráfico de áreas */
    {
      etiqueta: "Subtema 1.5",
      titulo: "Productos notables",
      bloques: [
        {
          tipo: "formulas",
          items: [
            "(a + b)² = a² + 2ab + b²          (a − b)² = a² − 2ab + b²",
            "(a + b)(a − b) = a² − b²          (a + b)³ = a³ + 3a²b + 3ab² + b³",
          ],
        },
      ],
    },

    /* 19 — 1.5 Modelo de área (gráfico) */
    {
      etiqueta: "Subtema 1.5",
      titulo: "Visual: (a + b)² como área",
      bloques: [
        { tipo: "grafico", clase: "areaCuadrado", etiqueta: "(a + b)² = a² + 2ab + b²" },
      ],
    },

    /* 20 — 1.5 Práctica (flujo) */
    {
      etiqueta: "Subtema 1.5",
      titulo: "Práctica: productos notables",
      bloques: [
        {
          tipo: "flujo",
          orientacion: "horizontal",
          nodos: ["(x + 4)²", "x² + 2(x)(4) + 4²"],
          resultado: "x² + 8x + 16",
        },
        {
          tipo: "ejercicioGuiado",
          enunciado: "Aplica el patrón correcto en cada caso.",
          pista: "Identifica primero si es cuadrado de un binomio o suma por diferencia.",
          items: ["Desarrolla (3x − 2)².", "Desarrolla (x + 5)(x − 5)."],
        },
      ],
    },

    /* 21 — 1.6 Factorización */
    {
      etiqueta: "Subtema 1.6",
      titulo: "Factorización",
      bloques: [
        { tipo: "proceso", etapas: ["Identificar la forma", "Elegir el método", "Verificar el producto"] },
        {
          tipo: "bullets",
          items: [
            "Factor común: ax + ay = a(x + y).",
            "Diferencia de cuadrados: a² − b² = (a + b)(a − b).",
            "Trinomio cuadrado perfecto y trinomio x² + bx + c.",
            "Suma / diferencia de cubos: a³ ± b³.",
          ],
        },
      ],
    },

    /* 22 — 1.6 Práctica (flujo) */
    {
      etiqueta: "Subtema 1.6",
      titulo: "Práctica: factorización",
      bloques: [
        {
          tipo: "flujo",
          nodos: ["x² + 5x + 6", "Dos números que sumen 5 y multipliquen 6", "→ 2 y 3"],
          resultado: "(x + 2)(x + 3)",
        },
        {
          tipo: "ejercicioGuiado",
          enunciado: "Factoriza completamente.",
          pista: "Revisa primero si hay factor común; luego identifica el patrón.",
          items: ["Factoriza 4x² − 25.", "Factoriza x² − 7x + 12."],
        },
      ],
    },

    /* 23 — Divisor Bloque III */
    {
      layout: "divisor",
      etiqueta: "Bloque III",
      titulo: "Fracciones algebraicas y teorema del binomio",
      subtitulo: "Subtemas 1.7 y 1.8 — generalizar y expandir",
      bloques: [],
    },

    /* 24 — 1.7 Fracciones (flujo) */
    {
      etiqueta: "Subtema 1.7",
      titulo: "Operaciones con fracciones algebraicas",
      bloques: [
        {
          tipo: "bullets",
          items: [
            "Simplificar: factorizar y cancelar factores comunes.",
            "Suma / resta: usar común denominador.",
            "Multiplicación: numerador × numerador, denominador × denominador.",
            "División: multiplicar por el recíproco.",
          ],
        },
        {
          tipo: "flujo",
          orientacion: "horizontal",
          nodos: ["(x² − 9)/(x + 3)", "[(x + 3)(x − 3)]/(x + 3)"],
          resultado: "x − 3   (x ≠ −3)",
        },
      ],
    },

    /* 25 — 1.7 Práctica */
    {
      etiqueta: "Subtema 1.7",
      titulo: "Práctica: fracciones algebraicas",
      bloques: [
        {
          tipo: "ejercicioGuiado",
          enunciado: "Opera y simplifica.",
          pista: "Para simplificar, factoriza antes de cancelar; para sumar, busca el común denominador.",
          items: ["Simplifica (x² − 4)/(x − 2).", "Suma 1/x + 1/(x + 1)."],
        },
        {
          tipo: "nota",
          texto: "Recuerda indicar las restricciones del dominio: los valores que anulan el denominador no son válidos.",
        },
      ],
    },

    /* 26 — 1.8 Binomio + triángulo de Pascal (gráfico) */
    {
      etiqueta: "Subtema 1.8",
      titulo: "Teorema del binomio",
      bloques: [
        { tipo: "formulaDestacada", etiqueta: "Desarrollo de una potencia de binomio", formula: "(a + b)ⁿ = Σ C(n,k) · aⁿ⁻ᵏ · bᵏ" },
        {
          tipo: "grafico",
          clase: "pascal",
          etiqueta: "Triángulo de Pascal",
          filas: [["1", "1"], ["1", "2", "1"], ["1", "3", "3", "1"], ["1", "4", "6", "4", "1"]],
        },
      ],
    },

    /* 27 — 1.8 Práctica (flujo) */
    {
      etiqueta: "Subtema 1.8",
      titulo: "Práctica: desarrollar (x + 2)³",
      bloques: [
        {
          tipo: "flujo",
          nodos: [
            "Coeficientes (n = 3): 1, 3, 3, 1",
            "1·x³ + 3·x²·2 + 3·x·2² + 1·2³",
            "x³ + 3·2·x² + 3·4·x + 8",
          ],
          resultado: "x³ + 6x² + 12x + 8",
        },
        {
          tipo: "ejercicioGuiado",
          enunciado: "Desarrolla usando los coeficientes de Pascal.",
          pista: "Para (2x − 1)³ recuerda que el segundo término es negativo: alterna los signos.",
          items: ["Desarrolla (x + 1)⁴.", "Desarrolla (2x − 1)³."],
        },
      ],
    },

    /* 28 — Transición: aplicación */
    {
      layout: "transicion",
      etiqueta: "Del álgebra a la práctica",
      titulo: "Aplicación profesional",
      subtitulo: "El lenguaje algebraico a bordo",
      bloques: [],
    },

    /* 29 — Aplicación combustible */
    {
      etiqueta: "Aplicación profesional",
      titulo: "El álgebra en el ámbito marítimo (I)",
      bloques: [
        {
          tipo: "aplicacion",
          titulo: "Consumo de combustible (proporcionalidad)",
          enunciado: "El consumo es proporcional a la distancia: C = k·d. Un buque consume 1 200 L en 300 mn.",
          pasos: ["Calcular la constante: k = C / d = 1200 / 300 = 4 L/mn", "Estimar para 450 mn: C = 4 · 450"],
          resultado: "C = 1 800 L",
        },
      ],
    },

    /* 30 — Aplicación velocidad */
    {
      etiqueta: "Aplicación profesional",
      titulo: "El álgebra en el ámbito marítimo (II)",
      bloques: [
        {
          tipo: "aplicacion",
          titulo: "Velocidad, distancia y tiempo (despeje)",
          enunciado: "De la fórmula v = d / t se despeja la incógnita requerida en la navegación.",
          pasos: ["Recorrer 120 mn a 15 nudos: t = d / v = 120 / 15", "El lenguaje algebraico permite despejar t, d o v según el dato buscado"],
          resultado: "t = 8 h",
        },
      ],
    },

    /* 31 — Transición: síntesis */
    {
      layout: "transicion",
      etiqueta: "Síntesis",
      titulo: "Cerramos la unidad",
      subtitulo: "Formulario, mapa conceptual y evaluación",
      bloques: [],
    },

    /* 32 — Formulario */
    {
      etiqueta: "Síntesis",
      titulo: "Formulario de la unidad",
      bloques: [
        {
          tipo: "formulas",
          items: [
            "Exponentes:  aᵐ·aⁿ = aᵐ⁺ⁿ    (aᵐ)ⁿ = aᵐⁿ    a⁻ⁿ = 1/aⁿ",
            "Productos notables:  (a ± b)² = a² ± 2ab + b²    (a + b)(a − b) = a² − b²",
            "Factorización:  a² − b² = (a + b)(a − b)",
            "Binomio:  (a + b)ⁿ = Σ C(n,k) aⁿ⁻ᵏ bᵏ",
          ],
        },
      ],
    },

    /* 33 — Resumen como mapa conceptual */
    {
      etiqueta: "Resumen",
      titulo: "Mapa conceptual de la Unidad 1",
      bloques: [
        {
          tipo: "mapaConceptual",
          centro: "Álgebra\nElemental",
          ramas: [
            { titulo: "Lenguaje", detalle: "1.1 – 1.2" },
            { titulo: "Reglas y operaciones", detalle: "1.3 – 1.4" },
            { titulo: "Productos y factorización", detalle: "1.5 – 1.6" },
            { titulo: "Fracciones y binomio", detalle: "1.7 – 1.8" },
          ],
        },
      ],
    },

    /* 34 — Evaluación */
    {
      etiqueta: "Evaluación",
      titulo: "Plan de evaluación (DEN/526/2025)",
      bloques: [
        {
          tipo: "tabla",
          headers: ["Criterio", "Ponderación"],
          filas: [
            ["Prácticas y actividades de aprendizaje", "70%"],
            ["Conocimiento", "20%"],
            ["Participaciones y uso de las TIC's", "10%"],
          ],
        },
        {
          tipo: "nota",
          texto:
            "Escala: 7.0 a 10.0 Competente (aprobatorio); 0.0 a 6.9 Aún no competente. Mínima aprobatoria: 7.0.",
        },
      ],
    },

    /* 35 — Cierre */
    {
      layout: "cierre",
      etiqueta: "Cierre de la sesión",
      titulo: "Lo esencial que te llevas",
      // Este deck SÍ continúa en la Unidad 2, así que lo dice explícitamente.
      // Antes lo ponía el renderer para cualquier presentación (también las de
      // la Unidad 5 o las de Inglés, donde era falso); ahora el texto vive
      // donde se sabe verdadero.
      mensajeFinal: "¡Gracias!  Continuamos con la Unidad 2.",
      bloques: [
        {
          tipo: "bullets",
          items: [
            "El álgebra generaliza la aritmética con literales y fórmulas.",
            "Productos notables y factorización son operaciones inversas.",
            "El despeje de fórmulas resuelve problemas reales de navegación.",
          ],
        },
        {
          tipo: "nota",
          texto: "Para la próxima sesión: repasar el formulario y resolver los ejercicios guiados de cada subtema.",
        },
      ],
    },

    /* 36 — Bibliografía */
    {
      etiqueta: "Fuentes de consulta",
      titulo: "Bibliografía oficial",
      bloques: [
        {
          tipo: "definicion",
          titulo: "Bibliografía básica",
          texto:
            "Swokowski, Earl W. Álgebra y Trigonometría con Geometría Analítica. Grupo Iberoamérica, 1988.",
        },
        {
          tipo: "bullets",
          items: [
            "Baldor, Aurelio. Álgebra. Publicaciones Culturales, 2009.",
            "Rees, Paul; Sparks, Fred. Álgebra. Reverté, 2003.",
          ],
        },
        {
          tipo: "nota",
          texto: "Referencias del programa oficial de la asignatura (PPE_LPN_FIDENA_2022).",
        },
      ],
    },
  ],
};
