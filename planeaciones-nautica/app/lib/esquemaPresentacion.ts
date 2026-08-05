// Esquema de validación (zod v4) de la presentación generada por IA.
//
// Refleja EXACTAMENTE el subconjunto de bloques que el renderer premium V2 ya
// sabe dibujar (ver `pptxOficialV2.ts` → renderBloqueV2 / renderBloque). La IA
// SOLO puede emitir estos bloques; cualquier cosa fuera del esquema se rechaza
// en validación y se descarta, de modo que el renderer nunca recibe basura.
//
// Se omiten a propósito los gráficos matemáticos muy específicos (parábola,
// triángulo de Pascal, recta numérica, área del cuadrado): son útiles solo para
// álgebra y no para el resto de materias. El resto del vocabulario cubre todo lo
// que pide la especificación (conceptos, definiciones, tablas, diagramas,
// procesos, casos prácticos, participación y evaluación).

import * as z from "zod/v4";
import { Type, type Schema } from "@google/genai";

/* ------------------------------ Bloques V1 ------------------------------- */

const bullets = z.object({
  tipo: z.literal("bullets"),
  items: z.array(z.string()),
});

const definicion = z.object({
  tipo: z.literal("definicion"),
  titulo: z.string(),
  texto: z.string(),
});

const nota = z.object({
  tipo: z.literal("nota"),
  texto: z.string(),
});

const tabla = z.object({
  tipo: z.literal("tabla"),
  headers: z.array(z.string()),
  filas: z.array(z.array(z.string())),
});

const proceso = z.object({
  tipo: z.literal("proceso"),
  etapas: z.array(z.string()),
});

const pasos = z.object({
  tipo: z.literal("pasos"),
  enunciado: z.string(),
  pasos: z.array(z.string()),
  resultado: z.string().optional(),
});

const ejemplo = z.object({
  tipo: z.literal("ejemplo"),
  enunciado: z.string(),
  pasos: z.array(z.string()),
});

const aplicacion = z.object({
  tipo: z.literal("aplicacion"),
  titulo: z.string(),
  enunciado: z.string(),
  pasos: z.array(z.string()),
  resultado: z.string().optional(),
});

const ejercicio = z.object({
  tipo: z.literal("ejercicio"),
  items: z.array(z.string()),
});

const ejercicioGuiado = z.object({
  tipo: z.literal("ejercicioGuiado"),
  enunciado: z.string(),
  pista: z.string().optional(),
  items: z.array(z.string()),
});

const formulaDestacada = z.object({
  tipo: z.literal("formulaDestacada"),
  etiqueta: z.string().optional(),
  formula: z.string(),
});

const comparacion = z.object({
  tipo: z.literal("comparacion"),
  izq: z.object({ titulo: z.string(), items: z.array(z.string()) }),
  der: z.object({ titulo: z.string(), items: z.array(z.string()) }),
});

/* ------------------------------ Bloques V2 ------------------------------- */

const flujo = z.object({
  tipo: z.literal("flujo"),
  nodos: z.array(z.string()),
  resultado: z.string().optional(),
  orientacion: z.enum(["vertical", "horizontal"]).optional(),
});

const mapaConceptual = z.object({
  tipo: z.literal("mapaConceptual"),
  centro: z.string(),
  ramas: z.array(
    z.object({ titulo: z.string(), detalle: z.string().optional() }),
  ),
});

const diagramaArbol = z.object({
  tipo: z.literal("diagramaArbol"),
  raiz: z.string(),
  ramas: z.array(
    z.object({ titulo: z.string(), ejemplo: z.string().optional() }),
  ),
});

export const bloqueIASchema = z.discriminatedUnion("tipo", [
  bullets,
  definicion,
  nota,
  tabla,
  proceso,
  pasos,
  ejemplo,
  aplicacion,
  ejercicio,
  ejercicioGuiado,
  formulaDestacada,
  comparacion,
  flujo,
  mapaConceptual,
  diagramaArbol,
]);

export const diapositivaIASchema = z.object({
  layout: z
    .enum(["portada", "contenido", "divisor", "transicion", "cierre"])
    .optional(),
  etiqueta: z.string().optional(),
  titulo: z.string(),
  subtitulo: z.string().optional(),
  bloques: z.array(bloqueIASchema),
  mensajeFinal: z.string().optional(),
});

/**
 * Lo que la IA debe devolver: las diapositivas y, opcionalmente, los textos de
 * portada. Los metadatos (asignatura, clave, carrera, semestre, nombre de
 * archivo) NO los genera la IA: los fija el servidor de forma determinista.
 */
export const presentacionIASchema = z.object({
  kicker: z.string().optional(),
  subtituloPortada: z.string().optional(),
  diapositivas: z.array(diapositivaIASchema),
});

export type PresentacionIA = z.infer<typeof presentacionIASchema>;
export type DiapositivaIA = z.infer<typeof diapositivaIASchema>;
export type BloqueIA = z.infer<typeof bloqueIASchema>;

/* ----------------------- responseSchema de Gemini ------------------------- */
//
// MISMO contrato que los esquemas Zod de arriba, en el dialecto OpenAPI que
// entiende Gemini (`responseMimeType: "application/json"` + `responseSchema`):
// el modelo queda obligado por decodificación restringida a devolver esta forma,
// igual que `output_config.format` en Claude.
//
// Es un ESPEJO, no un sustituto: la respuesta se sigue validando con Zod y
// saneando con `validarPresentacionTolerante` (abajo). Forzar la forma en el
// modelo evita la mayoría de los descartes; la validación posterior es la que
// impide que un bloque vacío llegue al .pptx, y NO se puede quitar.
//
// Si algún día divergen, manda Zod: lo que no valide se descarta.

const gStr: Schema = { type: Type.STRING };
const gStrArr: Schema = { type: Type.ARRAY, items: { type: Type.STRING } };
const gEnum = (valores: string[]): Schema => ({
  type: Type.STRING,
  format: "enum",
  enum: valores,
});

/** Un miembro de la unión discriminada: `tipo` fijo + sus campos. */
function gBloque(
  tipo: BloqueIA["tipo"],
  propiedades: Record<string, Schema>,
  requeridos: string[],
): Schema {
  return {
    type: Type.OBJECT,
    properties: { tipo: gEnum([tipo]), ...propiedades },
    required: ["tipo", ...requeridos],
  };
}

const gColumnaComparacion: Schema = {
  type: Type.OBJECT,
  properties: { titulo: gStr, items: gStrArr },
  required: ["titulo", "items"],
};

const gBloqueSchema: Schema = {
  anyOf: [
    gBloque("bullets", { items: gStrArr }, ["items"]),
    gBloque("definicion", { titulo: gStr, texto: gStr }, ["titulo", "texto"]),
    gBloque("nota", { texto: gStr }, ["texto"]),
    gBloque(
      "tabla",
      { headers: gStrArr, filas: { type: Type.ARRAY, items: gStrArr } },
      ["headers", "filas"],
    ),
    gBloque("proceso", { etapas: gStrArr }, ["etapas"]),
    gBloque(
      "pasos",
      { enunciado: gStr, pasos: gStrArr, resultado: gStr },
      ["enunciado", "pasos"],
    ),
    gBloque("ejemplo", { enunciado: gStr, pasos: gStrArr }, [
      "enunciado",
      "pasos",
    ]),
    gBloque(
      "aplicacion",
      { titulo: gStr, enunciado: gStr, pasos: gStrArr, resultado: gStr },
      ["titulo", "enunciado", "pasos"],
    ),
    gBloque("ejercicio", { items: gStrArr }, ["items"]),
    gBloque("ejercicioGuiado", { enunciado: gStr, pista: gStr, items: gStrArr }, [
      "enunciado",
      "items",
    ]),
    gBloque("formulaDestacada", { etiqueta: gStr, formula: gStr }, ["formula"]),
    gBloque(
      "comparacion",
      { izq: gColumnaComparacion, der: gColumnaComparacion },
      ["izq", "der"],
    ),
    gBloque(
      "flujo",
      {
        nodos: gStrArr,
        resultado: gStr,
        orientacion: gEnum(["vertical", "horizontal"]),
      },
      ["nodos"],
    ),
    gBloque(
      "mapaConceptual",
      {
        centro: gStr,
        ramas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { titulo: gStr, detalle: gStr },
            required: ["titulo"],
          },
        },
      },
      ["centro", "ramas"],
    ),
    gBloque(
      "diagramaArbol",
      {
        raiz: gStr,
        ramas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { titulo: gStr, ejemplo: gStr },
            required: ["titulo"],
          },
        },
      },
      ["raiz", "ramas"],
    ),
  ],
};

const gDiapositivaSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    layout: gEnum(["portada", "contenido", "divisor", "transicion", "cierre"]),
    etiqueta: gStr,
    titulo: gStr,
    subtitulo: gStr,
    bloques: { type: Type.ARRAY, items: gBloqueSchema },
    mensajeFinal: gStr,
  },
  required: ["titulo", "bloques"],
};

/** Esquema que se pasa a Gemini como `responseSchema` para las presentaciones. */
export const responseSchemaPresentacion: Schema = {
  type: Type.OBJECT,
  properties: {
    kicker: gStr,
    subtituloPortada: gStr,
    diapositivas: { type: Type.ARRAY, items: gDiapositivaSchema },
  },
  required: ["diapositivas"],
};

/* --------------------------- Validación tolerante ------------------------- */

export type ResultadoTolerante = {
  pres: PresentacionIA;
  /** Nº de bloques individuales descartados por no validar contra el esquema
   *  o por quedar SIN contenido real (arrays vacíos, textos en blanco). */
  bloquesDescartados: number;
  /** Nº de diapositivas descartadas (sin título válido, sin bloques, etc.). */
  diapositivasDescartadas: number;
};

/* ------------------------------ Saneamiento ------------------------------- */
//
// El esquema acepta `z.string()` y `z.array(...)`, así que "" y [] validan: un
// bloque `{"tipo":"bullets","items":[]}` o `{"tipo":"nota","texto":"   "}` pasa
// la validación y llega al renderer, que dibuja una caja vacía —o una
// diapositiva entera en blanco— sin que nada falle ni avise. Es el mismo modo
// de fallo que el `nullGetter` del F-32 (commit 6e9c412): el hueco sin dato no
// rompe nada, solo se proyecta. Aquí se corta antes: lo que no tiene contenido
// real no llega al .pptx.

const limpiar = (xs: string[]): string[] =>
  xs.map((x) => x.trim()).filter((x) => x.length > 0);

/**
 * Normaliza las filas de una tabla al ancho de sus encabezados. Una fila corta
 * desplaza las celdas siguientes bajo el encabezado equivocado (dato correcto,
 * columna equivocada: el error que nadie ve); una fila larga descuadra el
 * ancho de columna. Se rellena con "" y el excedente se pliega en la última
 * celda, de modo que no se pierde texto.
 */
function normalizarFilas(headers: string[], filas: string[][]): string[][] {
  const n = headers.length;
  return filas
    .map((f) => f.map((c) => c.trim()))
    .filter((f) => f.some((c) => c.length > 0))
    .map((f) => {
      if (f.length === n) return f;
      if (f.length < n) return [...f, ...Array(n - f.length).fill("")];
      return [...f.slice(0, n - 1), f.slice(n - 1).filter(Boolean).join(" · ")];
    });
}

/** Devuelve el bloque con sus textos recortados, o null si se queda sin
 *  contenido que dibujar. */
function sanearBloque(b: BloqueIA): BloqueIA | null {
  switch (b.tipo) {
    case "bullets":
    case "ejercicio": {
      const items = limpiar(b.items);
      return items.length ? { ...b, items } : null;
    }
    case "nota": {
      const texto = b.texto.trim();
      return texto ? { ...b, texto } : null;
    }
    case "definicion": {
      const texto = b.texto.trim();
      return texto ? { ...b, titulo: b.titulo.trim(), texto } : null;
    }
    case "formulaDestacada": {
      const formula = b.formula.trim();
      return formula
        ? { ...b, formula, etiqueta: b.etiqueta?.trim() || undefined }
        : null;
    }
    case "tabla": {
      const headers = b.headers.map((h) => h.trim());
      if (!headers.some((h) => h.length > 0)) return null;
      const filas = normalizarFilas(headers, b.filas);
      return filas.length ? { ...b, headers, filas } : null;
    }
    case "proceso": {
      const etapas = limpiar(b.etapas);
      return etapas.length ? { ...b, etapas } : null;
    }
    case "flujo": {
      const nodos = limpiar(b.nodos);
      return nodos.length
        ? { ...b, nodos, resultado: b.resultado?.trim() || undefined }
        : null;
    }
    case "pasos": {
      const pasos = limpiar(b.pasos);
      const enunciado = b.enunciado.trim();
      return pasos.length || enunciado
        ? { ...b, enunciado, pasos, resultado: b.resultado?.trim() || undefined }
        : null;
    }
    case "ejemplo": {
      const pasos = limpiar(b.pasos);
      const enunciado = b.enunciado.trim();
      return pasos.length || enunciado ? { ...b, enunciado, pasos } : null;
    }
    case "aplicacion": {
      const pasos = limpiar(b.pasos);
      const enunciado = b.enunciado.trim();
      return pasos.length || enunciado
        ? {
            ...b,
            titulo: b.titulo.trim(),
            enunciado,
            pasos,
            resultado: b.resultado?.trim() || undefined,
          }
        : null;
    }
    case "ejercicioGuiado": {
      const items = limpiar(b.items);
      const enunciado = b.enunciado.trim();
      return items.length || enunciado
        ? { ...b, enunciado, items, pista: b.pista?.trim() || undefined }
        : null;
    }
    case "comparacion": {
      const izq = { titulo: b.izq.titulo.trim(), items: limpiar(b.izq.items) };
      const der = { titulo: b.der.titulo.trim(), items: limpiar(b.der.items) };
      return izq.items.length || der.items.length ? { ...b, izq, der } : null;
    }
    case "mapaConceptual": {
      const centro = b.centro.trim();
      const ramas = b.ramas
        .map((r) => ({
          titulo: r.titulo.trim(),
          detalle: r.detalle?.trim() || undefined,
        }))
        .filter((r) => r.titulo.length > 0);
      return centro && ramas.length ? { ...b, centro, ramas } : null;
    }
    case "diagramaArbol": {
      const raiz = b.raiz.trim();
      const ramas = b.ramas
        .map((r) => ({
          titulo: r.titulo.trim(),
          ejemplo: r.ejemplo?.trim() || undefined,
        }))
        .filter((r) => r.titulo.length > 0);
      return raiz && ramas.length ? { ...b, raiz, ramas } : null;
    }
  }
}

/** Una diapositiva de contenido sin bloques se proyecta como un título sobre
 *  una diapositiva en blanco. Las portadas/divisores/transiciones/cierres sí
 *  viven sin bloques: son su propio contenido. */
function tieneSustancia(d: DiapositivaIA): boolean {
  if (d.layout && d.layout !== "contenido") return true;
  return d.bloques.length > 0;
}

/**
 * Valida la respuesta cruda de la IA SIN tirar todo el deck si algo no encaja:
 *  - Cada bloque se valida por separado; los inválidos se descartan.
 *  - Cada diapositiva se valida con sus bloques ya saneados; si su "cáscara"
 *    (título requerido) no valida, se descarta esa diapositiva.
 *  - kicker/subtituloPortada solo se conservan si son strings.
 * Garantiza que el renderer V2 nunca reciba bloques fuera de su vocabulario.
 */
export function validarPresentacionTolerante(raw: unknown): ResultadoTolerante {
  const root = (raw ?? {}) as Record<string, unknown>;
  const diapositivasRaw = Array.isArray(root.diapositivas)
    ? root.diapositivas
    : [];

  let bloquesDescartados = 0;
  let diapositivasDescartadas = 0;
  const diapositivas: DiapositivaIA[] = [];

  for (const d of diapositivasRaw) {
    const obj = (d ?? {}) as Record<string, unknown>;
    const bloquesRaw = Array.isArray(obj.bloques) ? obj.bloques : [];
    const bloques: BloqueIA[] = [];
    for (const b of bloquesRaw) {
      const r = bloqueIASchema.safeParse(b);
      const saneado = r.success ? sanearBloque(r.data) : null;
      if (saneado) bloques.push(saneado);
      else bloquesDescartados++;
    }
    const titulo = typeof obj.titulo === "string" ? obj.titulo.trim() : "";
    const opcional = (v: unknown): string | undefined =>
      typeof v === "string" && v.trim() ? v.trim() : undefined;
    const r = diapositivaIASchema.safeParse({
      ...obj,
      titulo,
      etiqueta: opcional(obj.etiqueta),
      subtitulo: opcional(obj.subtitulo),
      mensajeFinal: opcional(obj.mensajeFinal),
      bloques,
    });
    // Sin título no hay diapositiva que proyectar (salvo la portada, cuyos
    // textos los fija el servidor); sin bloques, una de contenido sale en
    // blanco. En ambos casos es preferible que falte a que se proyecte vacía.
    if (r.success && (titulo || r.data.layout === "portada") && tieneSustancia(r.data))
      diapositivas.push(r.data);
    else diapositivasDescartadas++;
  }

  // En blanco NO es lo mismo que ausente: el renderer solo deriva el kicker y
  // el subtítulo de portada cuando llegan `undefined` (`pres.kicker ?? …`), así
  // que un " " los dejaba en blanco en la portada en vez de caer al derivado.
  const textoOpcional = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;

  const pres = presentacionIASchema.parse({
    kicker: textoOpcional(root.kicker),
    subtituloPortada: textoOpcional(root.subtituloPortada),
    diapositivas,
  });

  return { pres, bloquesDescartados, diapositivasDescartadas };
}
