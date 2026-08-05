// QA del flujo de presentaciones — el VOCABULARIO de bloques, de punta a punta.
//
// Hay tres descripciones del mismo contrato y las tres tienen que decir lo
// mismo:
//   1. el esquema que se le impone al modelo (`responseSchemaPresentacion`,
//      dialecto OpenAPI de Gemini);
//   2. el esquema Zod con el que se valida la respuesta (`bloqueIASchema`);
//   3. el renderer, que es quien sabe dibujar cada bloque.
// Si (1) y (2) divergen, el modelo emite bloques que la validación descarta en
// silencio: el docente recibe un deck más pobre y nada falla. Si (2) y (3)
// divergen, el bloque llega al .pptx y se dibuja mal o no se dibuja.
//
// Sin red y sin API key: aquí no se llama a ningún modelo, se comparan esquemas
// y se dibuja de verdad un ejemplar de cada bloque.

import { describe, expect, it } from "vitest";
import {
  bloqueIASchema,
  responseSchemaPresentacion,
  validarPresentacionTolerante,
  type BloqueIA,
} from "../app/lib/esquemaPresentacion";
import type { DiapositivaV2, PresentacionV2 } from "../app/data/presentaciones/tiposV2";
import { problemasPptx, renderizarPptx, textoPorDiapositiva, textoPptx } from "./ayudas/pptx";
import { basuraEn } from "./ayudas/docx";

/** Vista mínima y sin dependencias del dialecto OpenAPI que usa Gemini. */
type EsquemaG = {
  type?: string;
  properties?: Record<string, EsquemaG>;
  required?: string[];
  items?: EsquemaG;
  anyOf?: EsquemaG[];
  enum?: string[];
};

const raiz = responseSchemaPresentacion as EsquemaG;
const miembrosBloque =
  raiz.properties!.diapositivas.items!.properties!.bloques.items!.anyOf ?? [];

/** `tipo` que fija cada miembro de la unión (su discriminante). */
const tipoDe = (m: EsquemaG): string => m.properties?.tipo?.enum?.[0] ?? "";

/** Fabrica el ejemplar más pequeño que satisface un esquema. Con
 *  `soloRequeridos` se omiten los campos opcionales: así se comprueba que lo que
 *  el modelo puede legítimamente omitir sigue validando en Zod. */
function ejemplar(esquema: EsquemaG, soloRequeridos: boolean): unknown {
  if (esquema.anyOf) return ejemplar(esquema.anyOf[0], soloRequeridos);
  if (esquema.enum?.length) return esquema.enum[0];
  switch (esquema.type) {
    case "ARRAY":
      return [ejemplar(esquema.items!, soloRequeridos)];
    case "OBJECT": {
      const req = esquema.required ?? [];
      const obj: Record<string, unknown> = {};
      for (const [clave, sub] of Object.entries(esquema.properties ?? {})) {
        if (soloRequeridos && !req.includes(clave)) continue;
        obj[clave] = ejemplar(sub, soloRequeridos);
      }
      return obj;
    }
    default:
      return "Texto de ejemplo";
  }
}

describe("el esquema que se impone al modelo y el que valida la respuesta coinciden", () => {
  it("los dos declaran exactamente los mismos tipos de bloque", () => {
    const zod = (
      bloqueIASchema as unknown as {
        options: { shape: { tipo: { value?: string; values?: string[] } } }[];
      }
    ).options.map(
      (o) => o.shape.tipo.value ?? o.shape.tipo.values?.[0] ?? "",
    );
    expect(miembrosBloque.length).toBeGreaterThan(0);
    expect(miembrosBloque.map(tipoDe).sort()).toEqual([...zod].sort());
  });

  it("cada bloque en su versión MÍNIMA (solo campos requeridos) valida en Zod", () => {
    for (const miembro of miembrosBloque) {
      const r = bloqueIASchema.safeParse(ejemplar(miembro, true));
      expect(
        r.success,
        `el bloque "${tipoDe(miembro)}" mínimo no valida: ${
          r.success ? "" : JSON.stringify(r.error.issues)
        }`,
      ).toBe(true);
    }
  });

  it("cada bloque en su versión COMPLETA (todos los campos) valida en Zod", () => {
    for (const miembro of miembrosBloque) {
      const r = bloqueIASchema.safeParse(ejemplar(miembro, false));
      expect(
        r.success,
        `el bloque "${tipoDe(miembro)}" completo no valida: ${
          r.success ? "" : JSON.stringify(r.error.issues)
        }`,
      ).toBe(true);
    }
  });

  it("una diapositiva mínima del esquema del modelo sobrevive a la validación tolerante", () => {
    const diapositiva = ejemplar(
      raiz.properties!.diapositivas.items!,
      true,
    ) as Record<string, unknown>;
    const r = validarPresentacionTolerante({ diapositivas: [diapositiva] });
    expect(r.diapositivasDescartadas).toBe(0);
    expect(r.bloquesDescartados).toBe(0);
    expect(r.pres.diapositivas).toHaveLength(1);
  });
});

describe("el renderer sabe dibujar TODO el vocabulario que la IA puede emitir", () => {
  it("un deck con un ejemplar de cada bloque produce un .pptx válido", async () => {
    const diapositivas = miembrosBloque.map((miembro) => ({
      titulo: `Bloque ${tipoDe(miembro)}`,
      bloques: [ejemplar(miembro, false)],
    }));

    const r = validarPresentacionTolerante({ diapositivas });
    // Ningún bloque del vocabulario puede caerse en la validación.
    expect(r.bloquesDescartados).toBe(0);
    expect(r.diapositivasDescartadas).toBe(0);
    expect(r.pres.diapositivas).toHaveLength(miembrosBloque.length);

    const pres: PresentacionV2 = {
      asignatura: "Simulador de Navegación I",
      clave: "SMV747",
      unidad: "Unidad 1: Introducción al uso del simulador Full Mission",
      carrera: "Licenciatura en Piloto Naval",
      semestre: "VII Semestre",
      diapositivas: r.pres.diapositivas as DiapositivaV2[],
    };
    const buffer = await renderizarPptx(pres);

    expect(problemasPptx(buffer)).toEqual([]);
    expect(basuraEn(textoPptx(buffer))).toEqual([]);
    // Cada bloque deja rastro visible: ninguno se dibuja "en blanco".
    const porDiapositiva = textoPorDiapositiva(buffer);
    for (const miembro of miembrosBloque) {
      const titulo = `Bloque ${tipoDe(miembro)}`;
      const suya = porDiapositiva.find((t) => t.includes(titulo));
      expect(suya, `no se dibujó la diapositiva de ${titulo}`).toBeDefined();
      expect(
        suya!.replace(titulo, "").trim().length,
        `la diapositiva de ${titulo} solo tiene el título`,
      ).toBeGreaterThan(0);
    }
  });

  it("un bloque fuera del vocabulario no llega nunca al renderer", () => {
    const r = validarPresentacionTolerante({
      diapositivas: [
        {
          titulo: "Con intruso",
          bloques: [
            { tipo: "grafico", clase: "parabola", etiqueta: "y=x²", labels: [], valores: [] },
            { tipo: "bullets", items: ["esto sí"] },
          ],
        },
      ],
    });
    const tipos = r.pres.diapositivas.flatMap((d) =>
      d.bloques.map((b: BloqueIA) => b.tipo),
    );
    expect(tipos).toEqual(["bullets"]);
    expect(r.bloquesDescartados).toBe(1);
  });
});
