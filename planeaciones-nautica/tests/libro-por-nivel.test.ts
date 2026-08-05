// PRIORIDAD 2 — El libro que sale impreso tiene que ser el del nivel.
//
//   Niveles 1, 2 y 3 → StartUp (Pearson Education)
//   Niveles 4 a 8    → iDiscover (Express Publishing)
//
// Modo de fallo real (ficha D1 de DEUDA-TECNICA-INGLES.md): el
// F32_INGLES_NIVEL3_VERIF.docx salió firmado con
// "I Discover 3 Student book & Workbook (2013) … Express Publishing", el libro
// del que ese nivel se está saliendo. La celda FUENTES no salió vacía: salió
// MAL, que es peor, porque no hay señal visible de que algo falló. Cero
// apariciones de "Pearson" en un documento del nivel 3.
//
// Nota de la ficha que aquí se respeta: el literal dice "Student book" con b
// minúscula. Cualquier búsqueda sensible a mayúsculas de "Student Book" no lo
// encuentra y la celda PARECE vacía. Estas pruebas comparan sin distinguir caja.

import { describe, expect, it } from "vitest";
import {
  bibliografiaIDiscover,
  construirDatosF32DesdeIngles,
} from "../app/lib/planeacionInglesF32.js";
import {
  PLANEACIONES_INGLES_ALMACENADAS,
  metaF32DesdeAlmacenada,
  planeacionDesdeAlmacenada,
} from "../app/data/inglesMaritimo";
import { TEMARIO_OFICIAL, temarioOficialTexto } from "../app/data/temarioInglesOficial";
import { renderEstricto, textoDocx } from "./ayudas/docx";
import { META_FORMULARIO, planeacionGeneradaFalsa } from "./ayudas/fixtures";

const STARTUP = /startup|pearson/i;
const IDISCOVER = /i\s?discover|express publishing/i;

const ALMACENADOS = ["1", "2", "3"];
const GENERADOS = ["4", "5", "6", "7", "8"];

/** Texto que acaba en la celda FUENTES del F-32 de un nivel almacenado. */
function fuentesDeNivelAlmacenado(nivel: string): string {
  const meta = metaF32DesdeAlmacenada(nivel);
  const datos = construirDatosF32DesdeIngles(
    planeacionDesdeAlmacenada(nivel, {})!,
    { ...META_FORMULARIO, ...meta, nivel },
  ) as { fuentes: string };
  return datos.fuentes;
}

describe("Niveles 1/2/3 — el libro es StartUp (Pearson), nunca iDiscover", () => {
  for (const nivel of ALMACENADOS) {
    it(`nivel ${nivel}: la bibliografía almacenada es de StartUp ${nivel}`, () => {
      const { bibliografia } = planeacionDesdeAlmacenada(nivel, {})!;
      expect(bibliografia.length).toBeGreaterThanOrEqual(1);
      for (const ref of bibliografia) {
        expect(ref.trim().length).toBeGreaterThan(0);
        expect(ref).toMatch(STARTUP);
        expect(ref).not.toMatch(IDISCOVER);
        // Que no herede el libro de OTRO nivel: la referencia nombra su nivel.
        expect(ref).toMatch(new RegExp(`StartUp Level ${nivel}\\b`));
      }
    });

    it(`nivel ${nivel}: la celda FUENTES del F-32 no menciona el libro abandonado`, () => {
      const fuentes = fuentesDeNivelAlmacenado(nivel);
      expect(fuentes).toMatch(/pearson/i);
      expect(fuentes).not.toMatch(IDISCOVER);
    });

    it(`nivel ${nivel}: el .docx generado dice Pearson y NO Express Publishing`, () => {
      const meta = metaF32DesdeAlmacenada(nivel);
      const texto = textoDocx(
        renderEstricto(
          "F-32.docx",
          construirDatosF32DesdeIngles(planeacionDesdeAlmacenada(nivel, {})!, {
            ...META_FORMULARIO,
            ...meta,
            nivel,
          }),
        ),
      );
      expect(texto).toMatch(/pearson/i);
      expect(texto).not.toMatch(IDISCOVER);
    });

    it(`nivel ${nivel}: no se cuela la bibliografía de otro nivel`, () => {
      const otros = ALMACENADOS.filter((n) => n !== nivel);
      const fuentes = fuentesDeNivelAlmacenado(nivel);
      for (const otro of otros) {
        expect(fuentes).not.toMatch(new RegExp(`StartUp Level ${otro}\\b`));
      }
      expect(PLANEACIONES_INGLES_ALMACENADAS[nivel].libro).toBe(`StartUp ${nivel}`);
    });
  }
});

describe("Niveles 4-8 — el libro sigue siendo iDiscover (Express Publishing)", () => {
  for (const nivel of GENERADOS) {
    it(`nivel ${nivel}: la bibliografía institucional es la de iDiscover ${nivel}`, () => {
      const ref = bibliografiaIDiscover(nivel);
      expect(ref).toMatch(IDISCOVER);
      expect(ref).not.toMatch(STARTUP);
      expect(ref).toContain(`I Discover ${nivel} `);
    });

    it(`nivel ${nivel}: el F-32 generado imprime el libro de SU nivel`, () => {
      const texto = textoDocx(
        renderEstricto(
          "F-32.docx",
          construirDatosF32DesdeIngles(planeacionGeneradaFalsa(nivel), {
            ...META_FORMULARIO,
            nivel,
          }),
        ),
      );
      expect(texto).toMatch(new RegExp(`I Discover ${nivel}\\b`, "i"));
      expect(texto).not.toMatch(STARTUP);
      // Ningún otro número de libro iDiscover puede aparecer.
      for (const otro of GENERADOS.filter((n) => n !== nivel)) {
        expect(texto).not.toMatch(new RegExp(`I Discover ${otro}\\b`, "i"));
      }
    });
  }

  it("bibliografiaIDiscover sin nivel no inventa un número", () => {
    expect(bibliografiaIDiscover("")).not.toMatch(/I Discover \d/i);
    expect(bibliografiaIDiscover(undefined as never)).not.toMatch(/I Discover \d/i);
  });
});

describe("Temario oficial — cada nivel declara su propio libro", () => {
  it("los niveles con temario son exactamente 1, 2, 3 y 8", () => {
    expect(Object.keys(TEMARIO_OFICIAL).sort()).toEqual(["1", "2", "3", "8"]);
  });

  for (const nivel of ALMACENADOS) {
    it(`el temario del nivel ${nivel} nombra StartUp y no iDiscover`, () => {
      const texto = temarioOficialTexto(nivel)!;
      expect(texto).toMatch(STARTUP);
      expect(texto).not.toMatch(IDISCOVER);
    });
  }

  it("el temario del nivel 8 nombra iDiscover 8 y no StartUp", () => {
    const texto = temarioOficialTexto("8")!;
    expect(texto).toContain("iDiscover 8");
    expect(texto).toContain("978-1-4715-1824-9");
    expect(texto).not.toMatch(STARTUP);
  });

  it("un nivel sin temario devuelve null, no un texto de otro nivel", () => {
    for (const nivel of ["4", "5", "6", "7", "9", ""]) {
      expect(temarioOficialTexto(nivel), `nivel ${nivel}`).toBeNull();
    }
  });
});

describe("D1 — el fallback del libro no puede alcanzar al nivel equivocado", () => {
  // Estas son las pruebas que habrían cazado el F32_INGLES_NIVEL3_VERIF.docx.
  //
  // El fallback histórico era `bibValida.length ? … : bibliografiaIDiscover(nivel)`:
  // con la bibliografía vacía —o con un texto que matchee /no\s+especificad/i—,
  // CUALQUIER nivel salía firmado con el libro de iDiscover. Estaba neutralizado
  // por datos (las entradas almacenadas traen bibliografía poblada), no por
  // código, así que el camino seguía vivo.
  //
  // Verificado en esta suite el 2026-08-05: el fallback ya deriva del nivel, así
  // que el nivel 3 no puede heredar el libro del 4-8. Estas pruebas lo fijan;
  // si alguien reintroduce un literal de libro que no dependa del nivel, fallan.
  //
  // Camino residual NO cubierto: si el JSON de la planeación trae bibliografía
  // no vacía, esa gana siempre. Un JSON de nivel 3 que trajera referencias de
  // iDiscover se imprimiría tal cual. Hoy es inalcanzable —los niveles 1/2/3 no
  // pasan por un modelo, su bibliografía sale de la tabla almacenada— y no se
  // puede cerrar sin romper a los niveles 4-8, cuya bibliografía sí viene del
  // JSON derivado de las históricas.
  it("una planeación del nivel 3 SIN bibliografía no imprime iDiscover", () => {
    const datos = construirDatosF32DesdeIngles(
      { ...planeacionDesdeAlmacenada("3", {})!, bibliografia: [] },
      { ...META_FORMULARIO, nivel: "3" },
    ) as { fuentes: string };
    expect(datos.fuentes).not.toMatch(IDISCOVER);
  });

  it("una planeación del nivel 1 con bibliografía 'No especificada' no imprime iDiscover", () => {
    const datos = construirDatosF32DesdeIngles(
      {
        ...planeacionDesdeAlmacenada("1", {})!,
        bibliografia: ["No especificada en las históricas."],
      },
      { ...META_FORMULARIO, nivel: "1" },
    ) as { fuentes: string };
    expect(datos.fuentes).not.toMatch(IDISCOVER);
  });

  it("el 'Enfoque iDiscover' de respaldo tampoco alcanza a un nivel de StartUp", () => {
    // Misma forma de fallo en la celda de estrategia: sin `enfoque` ni
    // `objetivoGeneral`, el constructor escribe "Enfoque iDiscover; …".
    const datos = construirDatosF32DesdeIngles(
      { nivel: "2", secuenciaSemanal: [] },
      { ...META_FORMULARIO, nivel: "2" },
    ) as { unidadBloques: Array<{ estrategia: string }> };
    expect(datos.unidadBloques[0].estrategia).not.toMatch(IDISCOVER);
  });
});
