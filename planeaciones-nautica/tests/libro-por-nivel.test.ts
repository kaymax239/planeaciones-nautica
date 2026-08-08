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
const IDISCOVER = /i\s?discover|express publishing|marlin'?s/i;

/** La nota de derechos de autor de la antología, CUARTA y última entrada de
 *  `bibliografia` en los tres niveles almacenados (ficha D12). El literal se
 *  duplica aquí a propósito, igual que las referencias de StartUp en el bloque
 *  B1 de verificar-no-regresion-ingles.mjs: es lo que hace que la guarda cache
 *  una edición accidental del texto, y no solo su ausencia. */
const NOTA_ANTOLOGIA_ESPERADA =
  "Antología: elaborada por el docente. Cada ejercicio, imagen o texto lleva " +
  "cita; se utiliza menos del 10% de cada obra; la primera página incluye la " +
  "leyenda institucional de uso académico (Pedagogía y Formación, 3 de " +
  "agosto de 2026).";

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

      // EXACTAMENTE cuatro: 3 referencias de StartUp + la nota de antología.
      // Ni más (una cuarta referencia colada) ni menos (la nota borrada).
      expect(bibliografia).toHaveLength(4);

      // Las TRES PRIMERAS son las referencias del libro, en ese orden.
      for (const ref of bibliografia.slice(0, 3)) {
        expect(ref.trim().length).toBeGreaterThan(0);
        expect(ref).toMatch(STARTUP);
        // Que no herede el libro de OTRO nivel: la referencia nombra su nivel.
        expect(ref).toMatch(new RegExp(`StartUp Level ${nivel}\\b`));
      }

      // La CUARTA es la nota de antología, carácter por carácter (D12).
      expect(bibliografia[3]).toBe(NOTA_ANTOLOGIA_ESPERADA);

      // Ninguna de las cuatro puede colar el libro abandonado.
      for (const ref of bibliografia) {
        expect(ref.trim().length).toBeGreaterThan(0);
        expect(ref).not.toMatch(IDISCOVER);
      }
    });

    it(`nivel ${nivel}: la celda FUENTES del F-32 no menciona el libro abandonado`, () => {
      const fuentes = fuentesDeNivelAlmacenado(nivel);
      expect(fuentes).toMatch(/pearson/i);
      expect(fuentes).not.toMatch(IDISCOVER);
    });

    it(`nivel ${nivel}: la nota de antología llega ÍNTEGRA a la celda FUENTES`, () => {
      const fuentes = fuentesDeNivelAlmacenado(nivel);
      // Aquí es donde murió `creditos` y donde muere `observaciones` (D12):
      // el dato existe pero no llega al documento. Se comprueba el texto
      // completo, no un fragmento, y que sea el ÚLTIMO de los cuatro renglones.
      expect(fuentes).toContain(NOTA_ANTOLOGIA_ESPERADA);
      const renglones = fuentes.split("\n");
      expect(renglones).toHaveLength(4);
      expect(renglones[3]).toBe(NOTA_ANTOLOGIA_ESPERADA);
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

  it("la nota de antología es IDÉNTICA en los tres niveles", () => {
    // Los tres documentos oficiales tienen que declarar lo mismo sobre los
    // derechos de la antología. Tres redacciones distintas serían un defecto,
    // no una variante, así que se comparan entre sí y contra el literal.
    const notas = ALMACENADOS.map(
      (n) => planeacionDesdeAlmacenada(n, {})!.bibliografia[3],
    );
    expect(new Set(notas).size).toBe(1);
    for (const nota of notas) expect(nota).toBe(NOTA_ANTOLOGIA_ESPERADA);
  });
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
