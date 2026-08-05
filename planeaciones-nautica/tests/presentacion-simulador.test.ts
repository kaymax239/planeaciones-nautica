// QA del flujo de presentaciones — caso de referencia:
// VII SEMESTRE (Piloto Naval) → "Simulador de Navegación I" (SMV747) → Unidad 1.
//
// Regla de la suite (ver vitest.config.mts): PURA y SIN RED. Aquí no hay
// servidor, ni API key, ni IA: se ejercita el generador determinista y el
// renderer .pptx REALES, los mismos que usa el docente, y se abre el archivo
// resultante para comprobar qué quedó dentro.

import { describe, expect, it } from "vitest";
import { contenidosMaterias } from "../app/data/contenidosMaterias";
import { materiasPorSemestre } from "../app/data/materias";
import { esProgramaOficial } from "../app/data/tipos";
import {
  construirPresentacionV2,
  TEMA_UNIDAD_COMPLETA,
} from "../app/lib/construirPresentacionV2";
import { validarPresentacionTolerante } from "../app/lib/esquemaPresentacion";
import type {
  DiapositivaV2,
  PresentacionV2,
} from "../app/data/presentaciones/tiposV2";
import {
  normalizar,
  numeroDiapositivas,
  problemasPptx,
  renderizarPptx,
  textoPorDiapositiva,
  textoPptx,
} from "./ayudas/pptx";
import { basuraEn } from "./ayudas/docx";

const MATERIA = "Simulador de Navegación I";
const CARRERA = "Licenciatura en Piloto Naval";
const SEMESTRE = "VII Semestre";

const programa = contenidosMaterias[MATERIA];

describe("el caso de referencia existe de verdad en los datos oficiales", () => {
  it(`"${MATERIA}" está en el VII SEMESTRE de Piloto Naval`, () => {
    expect(materiasPorSemestre["VII SEMESTRE"]).toContain(MATERIA);
  });

  it("tiene programa oficial con clave SMV747", () => {
    expect(esProgramaOficial(programa)).toBe(true);
    expect(programa.clave).toBe("SMV747");
    expect(programa.nombre).toBe(MATERIA);
  });

  it("la Unidad 1 es 'Introducción al uso del simulador Full Mission' con 9 subtemas", () => {
    const u1 = programa.unidades.find((u) => u.numero === 1);
    expect(u1).toBeDefined();
    expect(u1!.tema).toBe("Introducción al uso del simulador Full Mission");
    expect(u1!.subtemas).toHaveLength(9);
    expect(u1!.subtemas[0]).toMatch(/^1\.1 /);
    expect(u1!.objetivoEspecifico).toMatch(/simulador full misión/i);
  });
});

/* --------------------------------------------------------------------------
 * PPT — la presentación de la Unidad 1 se construye y el .pptx es abrible y
 * trae el contenido oficial esperado.
 * ------------------------------------------------------------------------ */

describe("PPT · Simulador de Navegación I · Unidad 1 (generador determinista)", () => {
  const unidad = programa.unidades.find((u) => u.numero === 1)!;
  const pres = construirPresentacionV2({
    programa,
    carrera: CARRERA,
    semestre: SEMESTRE,
    unidadNumero: 1,
    tema: TEMA_UNIDAD_COMPLETA,
  });

  it("se construye la PresentacionV2 con la portada y el cierre", () => {
    expect(pres).not.toBeNull();
    expect(pres!.clave).toBe("SMV747");
    expect(pres!.unidad).toBe(`Unidad 1: ${unidad.tema}`);
    expect(pres!.diapositivas[0].layout).toBe("portada");
    expect(pres!.diapositivas.some((d) => d.layout === "cierre")).toBe(true);
    // 9 subtemas → 2 diapositivas de temario (máx. 6 por diapositiva) + portada,
    // objetivo, mapa, divisor, actividad, cierre y bibliografía.
    expect(pres!.diapositivas.length).toBeGreaterThanOrEqual(9);
  });

  it("el .pptx generado es un archivo válido y abrible", async () => {
    const buffer = await renderizarPptx(pres!, {
      docente: "Docente de prueba",
      grupo: "VII A PN",
      periodo: "Jul–Dic 2026",
    });
    expect(problemasPptx(buffer)).toEqual([]);
    // La paginación puede partir una diapositiva en varias páginas, nunca perder
    // ninguna: el archivo trae AL MENOS una página por diapositiva del guion.
    expect(numeroDiapositivas(buffer)).toBeGreaterThanOrEqual(
      pres!.diapositivas.length,
    );
  });

  it("la portada lleva asignatura, clave, carrera y semestre", async () => {
    const buffer = await renderizarPptx(pres!, {
      docente: "Docente de prueba",
      grupo: "VII A PN",
      periodo: "Jul–Dic 2026",
    });
    const portada = textoPorDiapositiva(buffer)[0];
    expect(portada).toContain(MATERIA);
    expect(portada).toContain("Clave SMV747");
    expect(portada).toContain(CARRERA);
    expect(portada).toContain(SEMESTRE);
    expect(portada).toContain("Docente de prueba");
    expect(portada).toContain("VII A PN");
  });

  it("los 9 subtemas oficiales quedan impresos, con su numeración", async () => {
    const buffer = await renderizarPptx(pres!);
    const texto = normalizar(textoPptx(buffer));
    for (const subtema of unidad.subtemas) {
      expect(texto, `no se imprimió el subtema: ${subtema}`).toContain(
        normalizar(subtema),
      );
    }
  });

  it("imprime el objetivo específico y la bibliografía del programa oficial", async () => {
    const buffer = await renderizarPptx(pres!);
    const texto = normalizar(textoPptx(buffer));
    expect(texto).toContain(normalizar(unidad.objetivoEspecifico));
    expect(texto).toContain(normalizar(programa.objetivoGeneral));
    expect(texto).toContain(normalizar(programa.bibliografia[0]));
  });

  it("no inventa temario: todo bullet numerado del deck sale del programa", async () => {
    const buffer = await renderizarPptx(pres!);
    const texto = textoPptx(buffer);
    const numerados = [...texto.matchAll(/\b(\d+\.\d+)\s+[^\n]{4,}/g)].map(
      (m) => m[1],
    );
    const oficiales = new Set(
      programa.unidades.flatMap((u) =>
        u.subtemas.map((s) => s.match(/^(\d+(?:\.\d+)*)/)?.[1] ?? ""),
      ),
    );
    for (const n of numerados) {
      expect(oficiales.has(n), `numeración ${n} no existe en el programa`).toBe(
        true,
      );
    }
  });

  it("no imprime basura (undefined / [object Object] / NaN)", async () => {
    const buffer = await renderizarPptx(pres!);
    expect(basuraEn(textoPptx(buffer))).toEqual([]);
  });

  it("ninguna diapositiva sale en blanco", async () => {
    const buffer = await renderizarPptx(pres!);
    textoPorDiapositiva(buffer).forEach((t, i) => {
      expect(t.length, `la diapositiva ${i + 1} no tiene texto`).toBeGreaterThan(
        0,
      );
    });
  });
});

/* --------------------------------------------------------------------------
 * PPT — el camino de IA: lo que valida el esquema tiene que llegar al .pptx.
 * Se usa un guion FIJO (no hay llamada a ningún proveedor) que pasa por la
 * misma validación tolerante y el mismo ensamblado que hace /api/presentacion.
 * ------------------------------------------------------------------------ */

const GUION_IA = {
  kicker: "SIMULADOR FULL MISSION",
  subtituloPortada: "Introducción al uso del simulador Full Mission",
  diapositivas: [
    { layout: "portada", titulo: "Introducción al uso del simulador", bloques: [] },
    {
      etiqueta: "Panel de información",
      titulo: "Partes comunes de la pantalla",
      bloques: [
        {
          tipo: "definicion",
          titulo: "Pantalla del simulador",
          texto: "Área de trabajo del puente virtual Full Mission.",
        },
        { tipo: "bullets", items: ["Panel de información", "Panel de alarmas"] },
        {
          tipo: "tabla",
          headers: ["Panel", "Función"],
          filas: [["Piloto automático", "Gobierno del rumbo"]],
        },
      ],
    },
    // Ruido que el esquema DEBE descartar sin tirar el resto del deck.
    { titulo: "Diapositiva vacía", bloques: [] },
    {
      titulo: "Bloques inválidos",
      bloques: [
        { tipo: "inexistente", cosa: 1 },
        { tipo: "bullets", items: ["   ", ""] },
        { tipo: "nota", texto: "Verifica los instrumentos antes de zarpar." },
      ],
    },
    {
      layout: "cierre",
      titulo: "Síntesis",
      mensajeFinal: "¡Gracias por su atención!",
      bloques: [{ tipo: "bullets", items: ["Controles del simulador"] }],
    },
  ],
};

describe("PPT · camino de IA (guion fijo, sin proveedor)", () => {
  const r = validarPresentacionTolerante(GUION_IA);

  it("la validación tolerante conserva lo bueno y descarta lo inválido", () => {
    expect(r.pres.diapositivas.map((d) => d.titulo)).toEqual([
      "Introducción al uso del simulador",
      "Partes comunes de la pantalla",
      "Bloques inválidos",
      "Síntesis",
    ]);
    // El bloque de tipo inexistente y el de bullets en blanco.
    expect(r.bloquesDescartados).toBeGreaterThanOrEqual(2);
    // La diapositiva de contenido sin bloques.
    expect(r.diapositivasDescartadas).toBeGreaterThanOrEqual(1);
    // Y lo que sobrevive es exactamente lo bueno: nada vacío llega al renderer.
    const bloques = r.pres.diapositivas.flatMap((d) => d.bloques);
    expect(bloques.map((b) => b.tipo)).toEqual([
      "definicion",
      "bullets",
      "tabla",
      "nota",
      "bullets",
    ]);
  });

  it("el deck ensamblado como en /api/presentacion rinde un .pptx válido", async () => {
    const unidad = programa.unidades.find((u) => u.numero === 1)!;
    const pres: PresentacionV2 = {
      asignatura: programa.nombre,
      clave: programa.clave,
      unidad: `Unidad ${unidad.numero}: ${unidad.tema}`,
      carrera: CARRERA,
      semestre: SEMESTRE,
      kicker: r.pres.kicker,
      subtituloPortada: r.pres.subtituloPortada ?? unidad.tema,
      nombreArchivo: `Presentacion_${programa.clave}_U1_IA.pptx`,
      diapositivas: r.pres.diapositivas as DiapositivaV2[],
    };
    const buffer = await renderizarPptx(pres);
    expect(problemasPptx(buffer)).toEqual([]);

    const texto = textoPptx(buffer);
    expect(texto).toContain("Gobierno del rumbo"); // celda de la tabla
    expect(texto).toContain("Verifica los instrumentos antes de zarpar.");
    expect(texto).toContain("¡Gracias por su atención!");
    expect(basuraEn(texto)).toEqual([]);
  });
});
