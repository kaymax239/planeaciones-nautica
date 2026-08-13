// PRIORIDAD 1 — Ningún placeholder de la plantilla puede salir impreso como
// "undefined", "null", "[object Object]" o "NaN" en un documento oficial.
//
// Modo de fallo real que estas pruebas capturan (commit 6e9c412):
// "CRÉDITOS TOTALES: undefined" salió impreso en toda planeación de PN y MN
// durante días. No hubo excepción, ni log, ni 500: docxtemplater imprime la
// cadena literal "undefined" para cualquier placeholder que la plantilla declara
// y los datos no alimentan. Se detectó a mano, leyendo un documento entregado.
//
// El render de estas pruebas es ESTRICTO (sin el `nullGetter` de
// app/lib/opcionesDocx.ts) a propósito: comprueba que el constructor de datos
// cubre la plantilla ENTERA por sí solo, en vez de apoyarse en la red de
// seguridad. Si un día se quita el nullGetter, el documento sigue limpio.

import { describe, expect, it } from "vitest";
import { construirDatosF32DesdeIngles } from "../app/lib/planeacionInglesF32.js";
import { construirDatosAvanceF51 } from "../app/lib/avanceF51";
import {
  metaF32DesdeAlmacenada,
  planeacionDesdeAlmacenada,
} from "../app/data/inglesMaritimo";
import {
  basuraEn,
  placeholdersDe,
  renderEstricto,
  textoDocx,
  valoresNoImprimibles,
} from "./ayudas/docx";
import { META_FORMULARIO, planeacionGeneradaFalsa } from "./ayudas/fixtures";

// VII (Maritime English 1) también se sirve almacenado, con horas propias
// (90/20/70/30/5/7.5). Entra en las mismas pruebas: sus cifras pasan por el
// mismo `hStr()` que mató a los créditos en 6e9c412, y 7.5 no es entero.
const NIVELES_ALMACENADOS = ["1", "2", "3", "VII"];
const NIVELES_GENERADOS = ["4", "5", "6", "7", "8"];

/** Cifras que la plantilla F-32 tiene que imprimir, POR NIVEL, ya en texto. */
const CIFRAS_IMPRESAS: Record<string, Record<string, string>> = {
  "1": {
    creditos: "9",
    horasTotales: "112",
    horasTeoricas: "32",
    horasPracticas: "80",
    horasIndependientes: "32",
    horasPorSemana: "7",
  },
  "2": {
    creditos: "9",
    horasTotales: "112",
    horasTeoricas: "32",
    horasPracticas: "80",
    horasIndependientes: "32",
    horasPorSemana: "7",
  },
  "3": {
    creditos: "9",
    horasTotales: "112",
    horasTeoricas: "32",
    horasPracticas: "80",
    horasIndependientes: "32",
    horasPorSemana: "7",
  },
  VII: {
    creditos: "7.5",
    horasTotales: "90",
    horasTeoricas: "20",
    horasPracticas: "70",
    horasIndependientes: "30",
    horasPorSemana: "5",
  },
};

function f32DeNivelAlmacenado(nivel: string) {
  const planeacion = planeacionDesdeAlmacenada(nivel, {
    grupo: META_FORMULARIO.grupo,
  })!;
  const meta = metaF32DesdeAlmacenada(nivel);
  return construirDatosF32DesdeIngles(planeacion, {
    ...META_FORMULARIO,
    ...meta,
    nivel,
    horasPorSemana: meta?.horas?.porSemana,
  });
}

function f32DeNivelGenerado(nivel: string) {
  return construirDatosF32DesdeIngles(planeacionGeneradaFalsa(nivel), {
    ...META_FORMULARIO,
    nivel,
  });
}

describe("F-32 de Inglés — el documento nunca imprime basura", () => {
  for (const nivel of NIVELES_ALMACENADOS) {
    it(`nivel ${nivel} (contenido almacenado) se renderiza sin basura`, () => {
      const texto = textoDocx(renderEstricto("F-32.docx", f32DeNivelAlmacenado(nivel)));
      expect(basuraEn(texto)).toEqual([]);
      // Prueba de que la prueba sirve: el documento tiene contenido real.
      expect(texto).toMatch(/Semana 18/);
    });
  }

  for (const nivel of NIVELES_GENERADOS) {
    it(`nivel ${nivel} (generado por espejeo) se renderiza sin basura`, () => {
      const texto = textoDocx(renderEstricto("F-32.docx", f32DeNivelGenerado(nivel)));
      expect(basuraEn(texto)).toEqual([]);
      expect(texto).toMatch(/Semana 18/);
    });
  }

  // El caso que produjo el bug de los créditos: la IA devuelve un JSON al que le
  // faltan claves, o el formulario llega vacío. Nada debe imprimirse como dato.
  it("una planeación VACÍA no imprime un solo 'undefined'", () => {
    const texto = textoDocx(renderEstricto("F-32.docx", construirDatosF32DesdeIngles({}, {})));
    expect(basuraEn(texto)).toEqual([]);
  });

  it("una planeación NULA (fallo de la IA) no imprime un solo 'undefined'", () => {
    const texto = textoDocx(
      renderEstricto("F-32.docx", construirDatosF32DesdeIngles(null as never)),
    );
    expect(basuraEn(texto)).toEqual([]);
  });

  it("una planeación con claves de tipo equivocado no imprime basura", () => {
    // Gemini devuelve a veces strings donde el esquema pide arreglos, u objetos
    // donde pide strings. Ninguna de esas formas puede llegar al papel.
    const deforme = {
      asignatura: { nombre: "Inglés" },
      nivel: 5,
      secuenciaSemanal: "Semana 1: algo",
      bibliografia: "Un solo string, no un arreglo",
      objetivoGeneral: ["a", "b"],
      evaluacion: { instrumento: "Examen" },
      horas: { total: "x", creditos: null },
    };
    const texto = textoDocx(
      renderEstricto("F-32.docx", construirDatosF32DesdeIngles(deforme as never, { nivel: "5" })),
    );
    expect(basuraEn(texto)).toEqual([]);
  });
});

describe("F-32 — el constructor cubre TODOS los placeholders de la plantilla", () => {
  // Guarda contra el origen exacto del bug: alguien añade un placeholder a la
  // plantilla compartida (la usan PN, MN e Inglés) y el constructor de Inglés no
  // lo alimenta. Sin esta prueba el síntoma es una celda que dice "undefined".
  it("cada {placeholder} simple de F-32.docx tiene clave en el objeto de render", () => {
    const datos = f32DeNivelAlmacenado("1") as Record<string, unknown>;
    const anidados = new Set([
      // Viven dentro de {#unidadBloques} y {#semanas}, no en la raíz.
      "objetivoEspecifico", "estrategia", "semana", "tema", "secuencia",
      "recursos", "producto", "evaluacion",
    ]);
    const faltantes = placeholdersDe("F-32.docx")
      .filter((p) => !anidados.has(p))
      .filter((p) => !(p in datos));
    expect(faltantes).toEqual([]);
  });

  it("ningún valor del objeto de render es undefined, null ni NaN", () => {
    for (const nivel of [...NIVELES_ALMACENADOS, ...NIVELES_GENERADOS]) {
      const datos = NIVELES_ALMACENADOS.includes(nivel)
        ? f32DeNivelAlmacenado(nivel)
        : f32DeNivelGenerado(nivel);
      expect(valoresNoImprimibles(datos), `nivel ${nivel}`).toEqual([]);
    }
  });

  // Regresión directa del commit 6e9c412: `creditos` existía en la plantilla y
  // no en los datos. Se exige además la CIFRA de cada nivel, no solo que haya
  // algo: 9/112 en los niveles 1-3 y 7.5/90 en VII, con la misma dureza.
  for (const nivel of NIVELES_ALMACENADOS) {
    it(`nivel ${nivel}: créditos y horas salen con su cifra oficial, no vacíos`, () => {
      const esperado = CIFRAS_IMPRESAS[nivel];
      const datos = f32DeNivelAlmacenado(nivel) as unknown as Record<string, string>;
      for (const [campo, valor] of Object.entries(esperado)) {
        expect(datos[campo], `${campo} del nivel ${nivel}`).toBe(valor);
      }
      const texto = textoDocx(renderEstricto("F-32.docx", datos));
      expect(texto).toContain(esperado.horasTotales);
      expect(texto).toContain(esperado.creditos);
      // Y NO la cifra del otro molde: un F-32 de VII con 112 horas, o uno del
      // nivel 1 con 90, sería el encabezado de la asignatura equivocada.
      const ajeno = nivel === "VII" ? "112" : "90";
      expect(datos.horasTotales).not.toBe(ajeno);
    });
  }
});

describe("Avance programático F-51 — mismo modo de fallo, misma prueba", () => {
  it("se renderiza sin basura con semanas reales", () => {
    const semanas = [1, 2, 3, 4].map((n) => ({
      numero: n,
      tema: `Unidad ${n}\nContenido de la semana ${n}`,
    }));
    const datos = construirDatosAvanceF51(semanas, {
      asignatura: "Inglés Marítimo I — Nivel 1",
      licenciatura: "Inglés",
      semestre: "Nivel 1",
      docente: "",
      grupo: "I A PN",
      objetivosCompetencias: "Objetivo general del nivel 1.",
    });
    expect(valoresNoImprimibles(datos)).toEqual([]);
    expect(basuraEn(textoDocx(renderEstricto("Avance-Programatico-F51.docx", datos)))).toEqual([]);
  });

  it("se renderiza sin basura SIN semanas seleccionadas (huecos vacíos)", () => {
    const datos = construirDatosAvanceF51([], {
      asignatura: "Inglés Marítimo I — Nivel 1",
      licenciatura: "Inglés",
      semestre: "Nivel 1",
      docente: "",
      grupo: "",
      objetivosCompetencias: "",
    });
    expect(basuraEn(textoDocx(renderEstricto("Avance-Programatico-F51.docx", datos)))).toEqual([]);
  });

  it("cada {placeholder} de la plantilla F-51 tiene clave en el objeto de render", () => {
    const datos = construirDatosAvanceF51([{ numero: 1, tema: "Unidad 1" }], {
      asignatura: "Inglés",
      licenciatura: "Inglés",
      semestre: "Nivel 1",
      docente: "",
      grupo: "A",
      objetivosCompetencias: "x",
    }) as Record<string, unknown>;
    const faltantes = placeholdersDe("Avance-Programatico-F51.docx").filter(
      (p) => !(p in datos),
    );
    expect(faltantes).toEqual([]);
  });
});
