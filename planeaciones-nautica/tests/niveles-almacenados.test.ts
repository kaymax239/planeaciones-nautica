// PRIORIDAD 3 — Los desvíos de contenido almacenado (1/2/3 y VII) y el espejo
// del nivel 8 siguen en su sitio.
//
// Modo de fallo real (commit 04d3f56): los niveles 1 y 3 generaban diapositivas
// del libro abandonado, sin error visible. Tienen históricas de iDiscover en el
// corpus, así que el generador NO daba 404: producía contenido plausible del
// libro equivocado. El nivel 2, sin históricas, daba 404. Los tres síntomas
// vienen de lo mismo: el desvío a contenido almacenado no estaba puesto.
//
// Pruebas de datos y funciones puras. Los desvíos DENTRO de los endpoints se
// comprueban en tests/contratos-endpoints.test.ts.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  NIVELES_ALMACENADOS,
  PLANEACIONES_INGLES_ALMACENADAS,
  metaF32DesdeAlmacenada,
  planeacionDesdeAlmacenada,
  tienePlaneacionAlmacenada,
} from "../app/data/inglesMaritimo";
import {
  NIVEL_ESPEJO,
  NIVELES_CON_TEMARIO,
  tieneTemarioOficial,
} from "../app/data/temarioInglesOficial";
import { claveCache } from "../app/lib/cachePresentacionIngles";

/** Los niveles numerados de StartUp (primer semestre, molde común). */
const STARTUP = ["1", "2", "3"];
/** VII — Maritime English 1 (séptimo semestre). NO comparte el molde. */
const VII = "VII";
/** TODOS los niveles servidos desde contenido almacenado. */
const ALMACENADOS = [...STARTUP, VII];
const ESPEJEADOS = ["4", "5", "6", "7", "8"];

// ---------------------------------------------------------------------------
// Ficha oficial POR NIVEL. Cada nivel se comprueba contra SUS cifras, con la
// misma dureza (igualdad exacta) con la que antes se comprobaban las de los
// niveles 1-3. VII no es una excepción a la que se le baje el listón: es una
// fila más de la tabla, con sus propios valores exigidos al carácter.
//
//   1/2/3 → ING 208, semestre 1, StartUp N, 112 = 32 + 80, 32 indep., 7/sem, 9 cr.
//   VII   → ING746,  semestre 7, Career Paths: Merchant Navy 1,
//           90 = 20 + 70, 30 indep., 5/sem, 7.5 cr.
//
// Los literales se duplican aquí a propósito (misma razón que la nota de
// antología en libro-por-nivel.test.ts): si la prueba importara las constantes
// del módulo, una edición de esas constantes se auto-aprobaría.
// ---------------------------------------------------------------------------
type FichaOficial = {
  horas: {
    total: number;
    teoricas: number;
    practicas: number;
    independientes: number;
    porSemana: number;
    creditos: number;
  };
  clave: string;
  semestre: number;
  libro: string;
  /** Exacto, no "no vacío": VII lo deja en blanco a propósito (lo pone el grupo). */
  docente: string;
  id: string;
};

const HORAS_STARTUP = {
  total: 112,
  teoricas: 32,
  practicas: 80,
  independientes: 32,
  porSemana: 7,
  creditos: 9,
};

const OFICIAL: Record<string, FichaOficial> = {
  "1": {
    horas: HORAS_STARTUP,
    clave: "ING 208",
    semestre: 1,
    libro: "StartUp 1",
    docente: "Víctor Cadena",
    id: "ingles-maritimo-n1-sem1-2026b",
  },
  "2": {
    horas: HORAS_STARTUP,
    clave: "ING 208",
    semestre: 1,
    libro: "StartUp 2",
    docente: "Víctor Cadena",
    id: "ingles-maritimo-n2-sem1-2026b",
  },
  "3": {
    horas: HORAS_STARTUP,
    clave: "ING 208",
    semestre: 1,
    libro: "StartUp 3",
    docente: "Víctor Cadena",
    id: "ingles-maritimo-n3-sem1-2026b",
  },
  VII: {
    horas: {
      total: 90,
      teoricas: 20,
      practicas: 70,
      independientes: 30,
      porSemana: 5,
      creditos: 7.5,
    },
    clave: "ING746",
    semestre: 7,
    libro: "Career Paths: Merchant Navy 1",
    docente: "",
    id: "ingles-maritimo-nVII-sem1-2026b",
  },
};

// Contrato del JSON `planeacion` que declara el SYSTEM_PROMPT del generador.
// El camino almacenado tiene que devolver LO MISMO para que ni el cliente ni
// construirDatosF32DesdeIngles distingan el origen.
const CLAVES_PLANEACION = [
  "asignatura", "nivel", "grupo", "tema", "enfoque", "objetivoGeneral",
  "objetivosEspecificos", "competencias", "secuenciaSemanal", "evaluacion",
  "recursos", "bibliografia", "observaciones",
];

describe("El desvío cubre exactamente los niveles 1, 2, 3 y VII", () => {
  it("NIVELES_ALMACENADOS son 1, 2, 3 y VII", () => {
    expect([...NIVELES_ALMACENADOS].sort()).toEqual([...ALMACENADOS].sort());
  });

  it("cada nivel almacenado tiene ficha oficial declarada en la prueba", () => {
    // Si alguien da de alta un quinto nivel almacenado sin decir sus horas,
    // clave y semestre, esta prueba falla ANTES que las de abajo: la tabla
    // OFICIAL no puede quedarse atrás del módulo en silencio.
    expect([...NIVELES_ALMACENADOS].sort()).toEqual(Object.keys(OFICIAL).sort());
  });

  it("tienePlaneacionAlmacenada acierta en los dos sentidos", () => {
    for (const n of ALMACENADOS) expect(tienePlaneacionAlmacenada(n), n).toBe(true);
    // Un nivel espejeado que cayera en el desvío dejaría de generarse. Ojo con
    // el 7: VII (romano) es otra asignatura, el nivel "7" sigue espejeando.
    for (const n of ESPEJEADOS) expect(tienePlaneacionAlmacenada(n), n).toBe(false);
    for (const n of ["", " ", "0", "10", "uno", "1.0"]) {
      expect(tienePlaneacionAlmacenada(n), JSON.stringify(n)).toBe(false);
    }
    // El endpoint pasa el nivel ya en string, pero con espacios de sobra.
    expect(tienePlaneacionAlmacenada(" 2 ")).toBe(true);
    expect(tienePlaneacionAlmacenada(" VII ")).toBe(true);
  });

  it("planeacionDesdeAlmacenada devuelve null para un nivel que no es suyo", () => {
    for (const n of [...ESPEJEADOS, "", "9"]) {
      expect(planeacionDesdeAlmacenada(n, {}), n).toBeNull();
      expect(metaF32DesdeAlmacenada(n), n).toBeNull();
    }
  });
});

describe("Contrato del JSON del camino almacenado", () => {
  for (const nivel of ALMACENADOS) {
    it(`nivel ${nivel}: devuelve las 13 claves del esquema del generador`, () => {
      const p = planeacionDesdeAlmacenada(nivel, { grupo: "I A PN" })!;
      for (const clave of CLAVES_PLANEACION) {
        expect(Object.keys(p), `falta "${clave}"`).toContain(clave);
      }
      // Solo se admite una clave extra: `horas`, que el camino generado no trae.
      const extra = Object.keys(p).filter((k) => !CLAVES_PLANEACION.includes(k));
      expect(extra.sort()).toEqual(["horas"]);
      expect(p.nivel).toBe(nivel);
      expect(p.grupo).toBe("I A PN");
      expect(p.competencias).toHaveProperty("disciplinares");
      expect(p.competencias.genericas).toHaveProperty("instrumentales");
      expect(Array.isArray(p.evaluacion)).toBe(true);
      expect(p.evaluacion.length).toBeGreaterThan(0);
      for (const e of p.evaluacion) {
        expect(e.instrumento.trim()).not.toBe("");
        expect(e.ponderacion.trim()).not.toBe("");
      }
    });
  }
});

describe("Dosificación almacenada — 18 semanas completas y propias del nivel", () => {
  for (const nivel of ALMACENADOS) {
    it(`nivel ${nivel}: 18 semanas correlativas con sus cinco campos`, () => {
      const { secuenciaSemanal } = planeacionDesdeAlmacenada(nivel, {})!;
      expect(secuenciaSemanal).toHaveLength(18);
      expect(secuenciaSemanal.map((s) => s.semana)).toEqual(
        Array.from({ length: 18 }, (_, i) => i + 1),
      );
      for (const s of secuenciaSemanal) {
        expect(s.contenido.trim(), `semana ${s.semana}`).not.toBe("");
        expect(s.evidencias.trim(), `semana ${s.semana}`).not.toBe("");
        expect(s.actividades.length, `semana ${s.semana}`).toBeGreaterThan(0);
        expect(s.recursos.length, `semana ${s.semana}`).toBeGreaterThan(0);
        // Marcador de contenido sin redactar: no puede llegar al documento.
        expect(s.contenido, `semana ${s.semana}`).not.toMatch(/^\s*PENDIENTE\b/i);
      }
    });
  }

  it("cada nivel tiene su propia dosificación (ninguno hereda la de otro)", () => {
    const firmas = ALMACENADOS.map((n) =>
      planeacionDesdeAlmacenada(n, {})!
        .secuenciaSemanal.map((s) => s.contenido)
        .join("|"),
    );
    expect(new Set(firmas).size).toBe(ALMACENADOS.length);
  });

  it("cada nivel tiene su propio objetivo general", () => {
    const objetivos = ALMACENADOS.map(
      (n) => planeacionDesdeAlmacenada(n, {})!.objetivoGeneral,
    );
    expect(new Set(objetivos).size).toBe(ALMACENADOS.length);
    for (const o of objetivos) expect(o.trim().length).toBeGreaterThan(20);
  });
});

describe("Datos institucionales del F-32 de los niveles almacenados", () => {
  for (const nivel of ALMACENADOS) {
    const ficha = OFICIAL[nivel];

    it(`nivel ${nivel}: horas oficiales y metadatos de portada`, () => {
      const e = PLANEACIONES_INGLES_ALMACENADAS[nivel];
      // Igualdad EXACTA contra la fila del nivel. Las cifras de 1/2/3 siguen
      // siendo las mismas de siempre (112/32/80/32/7/9); VII se exige con la
      // misma dureza contra las suyas (90/20/70/30/5/7.5).
      expect(e.horas).toEqual(ficha.horas);
      // El total oficial es la descomposición teóricas+prácticas, no un
      // producto horas/semana × 18: en los niveles 1-3, 7×18 = 126 ≠ 112.
      expect(e.horas.teoricas + e.horas.practicas).toBe(e.horas.total);

      expect(e.id).toBe(ficha.id);
      expect(e.nivel).toBe(nivel);
      expect(e.clave).toBe(ficha.clave);
      expect(e.semestre).toBe(ficha.semestre);
      expect(e.libro).toBe(ficha.libro);
      expect(e.docente).toBe(ficha.docente);
      expect(e.nombre.trim()).not.toBe("");
      expect(e.enfoque.trim()).not.toBe("");
      // Alimenta {objetivoGeneral} y el {objetivoEspecifico} del primer bloque.
      expect(e.objetivoGeneral.trim().length).toBeGreaterThan(20);
      // Ninguna referencia vacía, y la lista nunca vacía (D1).
      expect(e.bibliografia.length).toBeGreaterThan(0);
      for (const ref of e.bibliografia) expect(ref.trim()).not.toBe("");

      const meta = metaF32DesdeAlmacenada(nivel)!;
      expect(meta.clave).toBe(ficha.clave);
      // Exacto, no "no vacío": el docente de 1/2/3 es el titular y el de VII va
      // en blanco a propósito (la entrada sirve a todos los grupos de VII).
      expect(meta.docente).toBe(ficha.docente);
      expect(meta.periodo.trim()).not.toBe("");
      expect(meta.fechaParcial1.trim()).not.toBe("");
      expect(meta.fechaParcial2.trim()).not.toBe("");
      expect(meta.escuelaNautica).toMatch(/Escuela Náutica Mercante/);
      expect(meta.horas).toEqual(e.horas);
      expect(meta.horas).toEqual(ficha.horas);
    });

    it(`nivel ${nivel}: esquema de evaluación de Inglés (mínima 7, 15% = 3+6+6)`, () => {
      const { evaluacion } = PLANEACIONES_INGLES_ALMACENADAS[nivel];
      expect(evaluacion.esquema).toBe("ingles");
      expect(evaluacion.calificacionMinima).toBe(7);
      expect(evaluacion.parciales).toHaveLength(2);
      for (const p of evaluacion.parciales) {
        expect(p.examen.puntos + p.participacionProyectosLibro.puntos).toBe(p.total);
        const suma = p.participacionProyectosLibro.desglose.reduce(
          (a, d) => a + d.puntos,
          0,
        );
        expect(suma).toBe(p.participacionProyectosLibro.puntos);
        expect(p.examen.habilidades.reduce((a, h) => a + h.puntos, 0)).toBe(
          p.examen.puntos,
        );
        // Marlin's es del molde de iDiscover: no aplica a StartUp.
        expect(JSON.stringify(p)).not.toMatch(/marlin/i);
      }
      expect(
        evaluacion.ordinario.examen.habilidades.reduce((a, h) => a + h.puntos, 0),
      ).toBe(evaluacion.ordinario.total);
    });
  }

  it("los niveles 1/2/3 comparten el molde de StartUp: 112/7/9, ING 208, semestre 1", () => {
    // La contrapartida de tabular: que la tabla no se haya podido "arreglar"
    // relajando la fila de los niveles 1-3. Aquí se exige que los tres sigan
    // siendo IDÉNTICOS entre sí y valgan exactamente lo de siempre.
    for (const nivel of STARTUP) {
      const e = PLANEACIONES_INGLES_ALMACENADAS[nivel];
      expect(e.horas, `nivel ${nivel}`).toEqual({
        total: 112,
        teoricas: 32,
        practicas: 80,
        independientes: 32,
        porSemana: 7,
        creditos: 9,
      });
      expect(e.clave, `nivel ${nivel}`).toBe("ING 208");
      expect(e.semestre, `nivel ${nivel}`).toBe(1);
      expect(e.libro, `nivel ${nivel}`).toBe(`StartUp ${nivel}`);
    }
  });

  it("VII NO hereda nada del molde de StartUp: 90/5/7.5, ING746, semestre 7", () => {
    const e = PLANEACIONES_INGLES_ALMACENADAS[VII];
    const n1 = PLANEACIONES_INGLES_ALMACENADAS["1"];
    expect(e.horas).toEqual({
      total: 90,
      teoricas: 20,
      practicas: 70,
      independientes: 30,
      porSemana: 5,
      creditos: 7.5,
    });
    // Y, campo por campo, distinto de lo que traen los niveles 1-3: un `??`
    // que dejara de tomar el override caería aquí aunque la tabla de arriba
    // se hubiera editado a la vez.
    expect(e.horas).not.toEqual(n1.horas);
    expect(e.clave).toBe("ING746");
    expect(e.clave).not.toBe(n1.clave);
    expect(e.semestre).toBe(7);
    expect(e.semestre).not.toBe(n1.semestre);
    expect(e.libro).toBe("Career Paths: Merchant Navy 1");
    expect(e.libro).not.toMatch(/startup/i);
    expect(e.libro).not.toMatch(/i\s?discover/i);
    // "StartUp VII" es lo que saldría si el libro se derivara del nivel.
    expect(e.libro).not.toBe(`StartUp ${VII}`);
    // Y el enfoque tampoco es el de StartUp (alimenta la celda ESTRATEGIA).
    expect(e.enfoque).not.toBe(n1.enfoque);
    expect(e.enfoque).not.toMatch(/startup/i);
  });
});

describe("Cache de presentaciones — el origen forma parte de la clave", () => {
  // Un mismo (nivel, tema) generado desde las históricas de iDiscover y desde la
  // dosificación de StartUp NO es la misma presentación. Si compartieran clave,
  // el nivel 3 seguiría sirviendo del cache el deck del libro abandonado incluso
  // después de arreglar el desvío: el bug de 04d3f56, resucitado sin código.
  it("dos orígenes distintos no comparten entrada de cache", () => {
    const base = { modelo: "modelo-x", nivel: "3", tema: "Unit 1" };
    const almacenado = claveCache({ ...base, origen: "almacenado" });
    const historicas = claveCache(base);
    const temario = claveCache({ ...base, origen: "temario" });
    expect(new Set([almacenado, historicas, temario]).size).toBe(3);
  });

  it("dos niveles distintos no comparten entrada de cache", () => {
    const clave = (nivel: string) =>
      claveCache({ modelo: "modelo-x", nivel, origen: "almacenado" });
    expect(new Set(ALMACENADOS.map(clave)).size).toBe(ALMACENADOS.length);
  });
});

describe("Nivel 8 — el espejo sigue en su sitio", () => {
  it("NIVEL_ESPEJO es exactamente { 8: 7 }", () => {
    expect(NIVEL_ESPEJO).toEqual({ "8": "7" });
  });

  it("el 8 aparece en el selector aunque no tenga históricas propias", () => {
    expect(NIVELES_CON_TEMARIO).toContain("8");
    expect(tieneTemarioOficial("8")).toBe(true);
  });

  it("el corpus indexado justifica el espejo: el 8 no tiene históricas y el 7 sí", () => {
    const indice = JSON.parse(
      readFileSync(path.join(process.cwd(), ".indice-ingles/indice.json"), "utf8"),
    ) as { documentos: Array<{ nivel: string | null }> };
    const del = (n: string) => indice.documentos.filter((d) => d.nivel === n).length;
    expect(indice.documentos.length).toBeGreaterThan(0);
    expect(del("8")).toBe(0);
    expect(del(NIVEL_ESPEJO["8"])).toBeGreaterThan(0);
  });

  it("ningún nivel almacenado tiene espejo configurado", () => {
    // Un espejo sobre 1/2/3 los devolvería al corpus de iDiscover.
    for (const n of ALMACENADOS) expect(NIVEL_ESPEJO[n]).toBeUndefined();
  });
});
