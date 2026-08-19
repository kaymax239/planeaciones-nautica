// La hoja de trabajo (worksheet) se maqueta correctamente a .docx.
//
// Prueba PURA y SIN RED: `worksheetADocx` solo recibe el objeto que ya validó la
// ruta y devuelve los bytes del Word, así que no hace falta servidor ni
// ANTHROPIC_API_KEY. No se llama a la IA en ningún momento.
//
// Lo que se protege aquí:
//  1. El documento es un .docx real (ZIP con word/document.xml) y trae el
//     contenido del cadete.
//  2. Las respuestas NO se filtran a la hoja del cadete cuando no se piden. Es
//     el fallo caro: un worksheet repartido en clase con el solucionario dentro.
//  3. La hoja de respuestas de "relacionar columnas" CUADRA con las letras que
//     realmente se imprimieron. La columna derecha se rota (ordenRotado) para
//     que la correspondencia no sea 1-a, 2-b, 3-c…, y el mapa inverso que arma
//     el solucionario es justo la clase de lógica que se rompe en silencio.

import { describe, expect, it } from "vitest";
import PizZip from "pizzip";
import { worksheetADocx, type MetaWorksheet } from "../app/lib/worksheetDocx";
import type { WorksheetIA } from "../app/lib/esquemaWorksheet";

const META: MetaWorksheet = {
  escuela: 'Escuela Náutica Mercante de Tampico "Cap. de Altura Luis Gonzaga Priego González"',
  materia: "Transporte Marítimo",
  licenciatura: "Licenciatura en Piloto Naval",
  semestre: "I Semestre",
  unidadNumero: 2,
  unidadTema: "Tipos de buques",
  docente: "Ing. Víctor Cadena",
  grupo: "1-A",
  periodo: "Agosto–Diciembre 2026",
};

/** Worksheet de prueba con marcas únicas y rastreables en el documento. */
function worksheetFixture(pares = 4): WorksheetIA {
  return {
    titulo: "TITULO_MARCA",
    objetivo: "OBJETIVO_MARCA",
    instruccionesGenerales: "INSTRUCCIONES_MARCA",
    conceptosClave: ["CONCEPTOCLAVE_MARCA"],
    opcionMultiple: [
      {
        enunciado: "OPCMULT_ENUNCIADO_MARCA",
        opciones: ["OPCION_A", "OPCION_B", "OPCION_C", "OPCION_D"],
        correcta: 2,
      },
    ],
    completar: [
      { enunciado: "El buque _____ transporta crudo.", respuesta: "COMPLETAR_RESPUESTA_MARCA" },
    ],
    relacionarColumnas: Array.from({ length: pares }, (_, i) => ({
      concepto: `CONC${i}`,
      descripcion: `DESC${i}`,
    })),
    problemas: [
      {
        enunciado: "PROBLEMA_ENUNCIADO_MARCA",
        lineasRespuesta: 3,
        respuestaModelo: "PROBLEMA_MODELO_MARCA",
      },
    ],
  };
}

/** Texto plano del .docx, un párrafo por entrada (mismo criterio que docxTexto). */
function parrafosDe(bytes: ArrayBuffer): string[] {
  const zip = new PizZip(bytes);
  const xml = zip.file("word/document.xml")?.asText() ?? "";
  return xml
    .split(/<\/w:p>/)
    .map((p) =>
      Array.from(p.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g))
        .map((m) => m[1])
        .join("")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim(),
    )
    .filter((t) => t.length > 0);
}

describe("worksheetADocx", () => {
  it("produce un .docx válido con el contenido del cadete", async () => {
    const bytes = await worksheetADocx(worksheetFixture(), META);

    // Un .docx es un ZIP: si no abre, no es un Word.
    const zip = new PizZip(bytes);
    expect(zip.file("word/document.xml")).toBeTruthy();

    const texto = parrafosDe(bytes).join("\n");
    expect(texto).toContain("TITULO_MARCA");
    expect(texto).toContain("OBJETIVO_MARCA");
    expect(texto).toContain("INSTRUCCIONES_MARCA");
    expect(texto).toContain("CONCEPTOCLAVE_MARCA");
    expect(texto).toContain("OPCMULT_ENUNCIADO_MARCA");
    expect(texto).toContain("PROBLEMA_ENUNCIADO_MARCA");
    // Datos de encabezado que pone el docente, no la IA.
    expect(texto).toContain(META.materia);
    expect(texto).toContain(`Unidad ${META.unidadNumero}`);
  });

  it("NO filtra las respuestas cuando no se pide la hoja del docente", async () => {
    const bytes = await worksheetADocx(worksheetFixture(), META, {
      incluirRespuestas: false,
    });
    const texto = parrafosDe(bytes).join("\n");

    expect(texto).not.toContain("COMPLETAR_RESPUESTA_MARCA");
    expect(texto).not.toContain("PROBLEMA_MODELO_MARCA");
    expect(texto).not.toContain("USO EXCLUSIVO DEL DOCENTE");
  });

  it("incluye la hoja de respuestas cuando se pide", async () => {
    const bytes = await worksheetADocx(worksheetFixture(), META, {
      incluirRespuestas: true,
    });
    const texto = parrafosDe(bytes).join("\n");

    expect(texto).toContain("USO EXCLUSIVO DEL DOCENTE");
    expect(texto).toContain("COMPLETAR_RESPUESTA_MARCA");
    expect(texto).toContain("PROBLEMA_MODELO_MARCA");
  });

  it("omite las secciones vacías y renumera los romanos sin saltos", async () => {
    // Solo "completar": debe salir como sección I, no como II ni III.
    const soloCompletar: WorksheetIA = {
      ...worksheetFixture(),
      opcionMultiple: [],
      relacionarColumnas: [],
      problemas: [],
    };
    const texto = parrafosDe(await worksheetADocx(soloCompletar, META)).join("\n");

    expect(texto).toContain("I. COMPLETA");
    expect(texto).not.toContain("II.");
    expect(texto).not.toContain("RELACIONA LAS COLUMNAS");
    expect(texto).not.toContain("RESUELVE");
  });

  // El caso que de verdad importa: el solucionario de relacionar columnas debe
  // apuntar a la letra REALMENTE impresa junto a cada descripción.
  it.each([2, 3, 4, 5, 7, 10])(
    "la hoja de respuestas de relacionar columnas cuadra con lo impreso (%i pares)",
    async (n) => {
      const bytes = await worksheetADocx(worksheetFixture(n), META, {
        incluirRespuestas: true,
      });
      const parrafos = parrafosDe(bytes);
      const texto = parrafos.join("\n");

      // 1. Qué letra recibió realmente la descripción de cada par: "c) DESC2".
      const letraImpresa = new Map<number, string>();
      for (const m of texto.matchAll(/([a-z])\)\s*DESC(\d+)/g)) {
        letraImpresa.set(Number(m[2]), m[1]);
      }
      expect(letraImpresa.size).toBe(n);

      // 2. Qué dice el solucionario: "1. d     2. a     3. b …". Se ancla a SU
      //    etiqueta: la de opción múltiple tiene el mismo formato y, con un solo
      //    reactivo, también encajaría en el patrón.
      const iEtiqueta = parrafos.indexOf("RELACIONA LAS COLUMNAS");
      expect(
        iEtiqueta,
        "no se encontró la etiqueta de relacionar en la hoja de respuestas",
      ).toBeGreaterThan(-1);
      const linea = parrafos[iEtiqueta + 1];
      expect(linea, "no se encontró la línea de respuestas de relacionar").toMatch(
        /^1\.\s*[a-z]/,
      );

      const solucionario = new Map<number, string>();
      for (const m of linea.matchAll(/(\d+)\.\s*([a-z])/g)) {
        solucionario.set(Number(m[1]), m[2]);
      }
      expect(solucionario.size).toBe(n);

      // 3. Para el concepto j (impreso como j+1), la respuesta debe ser la letra
      //    que lleva SU propia descripción DESCj.
      for (let j = 0; j < n; j++) {
        expect(
          solucionario.get(j + 1),
          `concepto ${j + 1} (CONC${j}) debía apuntar a DESC${j}`,
        ).toBe(letraImpresa.get(j));
      }
    },
  );

  it("desalinea la columna derecha para que relacionar no sea trivial", async () => {
    // Con 1 solo par la rotación no puede evitar el punto fijo; desde 2 sí.
    const bytes = await worksheetADocx(worksheetFixture(4), META, {
      incluirRespuestas: true,
    });
    const texto = parrafosDe(bytes).join("\n");

    const letraImpresa = new Map<number, string>();
    for (const m of texto.matchAll(/([a-z])\)\s*DESC(\d+)/g)) {
      letraImpresa.set(Number(m[2]), m[1]);
    }
    // Ningún concepto j debe caer en la letra de su misma posición (1-a, 2-b…).
    for (let j = 0; j < 4; j++) {
      expect(letraImpresa.get(j)).not.toBe(String.fromCharCode(97 + j));
    }
  });
});
