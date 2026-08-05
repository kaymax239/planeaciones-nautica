// PRIORIDAD 3 — Los desvíos de contenido almacenado (1/2/3) y el espejo del
// nivel 8 siguen en su sitio.
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

const ALMACENADOS = ["1", "2", "3"];
const ESPEJEADOS = ["4", "5", "6", "7", "8"];

// Contrato del JSON `planeacion` que declara el SYSTEM_PROMPT del generador.
// El camino almacenado tiene que devolver LO MISMO para que ni el cliente ni
// construirDatosF32DesdeIngles distingan el origen.
const CLAVES_PLANEACION = [
  "asignatura", "nivel", "grupo", "tema", "enfoque", "objetivoGeneral",
  "objetivosEspecificos", "competencias", "secuenciaSemanal", "evaluacion",
  "recursos", "bibliografia", "observaciones",
];

describe("El desvío cubre exactamente los niveles 1, 2 y 3", () => {
  it("NIVELES_ALMACENADOS son 1, 2 y 3", () => {
    expect([...NIVELES_ALMACENADOS].sort()).toEqual(ALMACENADOS);
  });

  it("tienePlaneacionAlmacenada acierta en los dos sentidos", () => {
    for (const n of ALMACENADOS) expect(tienePlaneacionAlmacenada(n), n).toBe(true);
    // Un nivel espejeado que cayera en el desvío dejaría de generarse.
    for (const n of ESPEJEADOS) expect(tienePlaneacionAlmacenada(n), n).toBe(false);
    for (const n of ["", " ", "0", "10", "uno", "1.0"]) {
      expect(tienePlaneacionAlmacenada(n), JSON.stringify(n)).toBe(false);
    }
    // El endpoint pasa el nivel ya en string, pero con espacios de sobra.
    expect(tienePlaneacionAlmacenada(" 2 ")).toBe(true);
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
    it(`nivel ${nivel}: horas oficiales y metadatos de portada`, () => {
      const e = PLANEACIONES_INGLES_ALMACENADAS[nivel];
      expect(e.horas).toEqual({
        total: 112,
        teoricas: 32,
        practicas: 80,
        independientes: 32,
        porSemana: 7,
        creditos: 9,
      });
      // 112 no es 7×18: el total oficial no se recalcula desde las horas/semana.
      expect(e.horas.teoricas + e.horas.practicas).toBe(e.horas.total);

      const meta = metaF32DesdeAlmacenada(nivel)!;
      expect(meta.clave).toBe("ING 208");
      expect(meta.docente.trim()).not.toBe("");
      expect(meta.periodo.trim()).not.toBe("");
      expect(meta.fechaParcial1.trim()).not.toBe("");
      expect(meta.fechaParcial2.trim()).not.toBe("");
      expect(meta.escuelaNautica).toMatch(/Escuela Náutica Mercante/);
      expect(meta.horas).toEqual(e.horas);
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
