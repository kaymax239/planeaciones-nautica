import { readFileSync } from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import { describe, expect, it } from "vitest";
import {
  construirDatosF04,
  diasHabilesDeLaSemana,
  parsearEstudiantes,
  renderizarRegularizacion,
  repartirEnSesiones,
  textoFechasSesiones,
  type DatosRegularizacion,
} from "../app/lib/regularizacion";
import { distribuirPrograma } from "../app/data/distribucion";
import { contenidosMateriasMN } from "../app/data/contenidosMaterias";
import { esProgramaOficial } from "../app/data/tipos";

const plantilla = (n: string) => {
  const b = readFileSync(path.join(__dirname, "../public/templates", n));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};
const texto = (bytes: Uint8Array) =>
  (new PizZip(bytes).file("word/document.xml")?.asText() ?? "")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "");

const semanas = [3, 4, 5, 6, 7].map((n) => ({
  numero: n,
  etiqueta: `Semana ${n}\n${n}–${n + 5} ago 2026`,
  tema: `Unidad 1: Tema ${n}\n1.${n} Subtema ${n}`,
  objetivoUnidad: "Objetivo de la unidad 1",
}));

const base = (estudiantes: string[]): DatosRegularizacion => ({
  asignatura: "Tecnología de Materiales",
  docente: "Ing. Docente Prueba",
  grupo: "3MN-A",
  estudiantes,
  semanas,
  sesiones: diasHabilesDeLaSemana(new Date(2026, 8, 23)),
  horario: "14:00 a 16:00 hrs",
  periodoEvaluacion: 1,
  objetivoGeneral: "Objetivo general de la asignatura",
  ponderacion: "Conocimiento 50%",
  jefeCarrera: "Jefe Prueba",
  subdirector: "Subdirector Prueba",
});

describe("regularización F-05 / F-04", () => {
  it("días hábiles parten del lunes", () => {
    const d = diasHabilesDeLaSemana(new Date(2026, 8, 23));
    expect(d.map((x) => x.getDate())).toEqual([21, 22, 23, 24, 25]);
    expect(textoFechasSesiones(d.slice(0, 3))).toBe(
      "Lunes 21, martes 22 y miércoles 23 de septiembre de 2026",
    );
  });

  it("reparte semanas en sesiones sin perder ninguna", () => {
    const r = repartirEnSesiones(semanas, 3);
    expect(r.map((b) => b.length)).toEqual([2, 2, 1]);
    const r2 = repartirEnSesiones(semanas.slice(0, 2), 4);
    expect(r2.map((b) => b.length)).toEqual([1, 1, 0, 0]);
  });

  it("limpia listas pegadas", () => {
    expect(parsearEstudiantes("1. PEREZ LOPEZ JUAN\n\n2)\tGARCIA  RUIZ ANA\n")).toEqual([
      "PEREZ LOPEZ JUAN",
      "GARCIA RUIZ ANA",
    ]);
  });

  it("llena ambas plantillas sin marcadores sueltos ni 'undefined'", () => {
    const nombres = Array.from({ length: 11 }, (_, i) => `CADETE ${i + 1}`);
    const { f05, f04 } = renderizarRegularizacion(
      plantilla("Regularizacion-F05.docx"),
      plantilla("Regularizacion-F04.docx"),
      base(nombres),
    );
    const t05 = texto(f05);
    const t04 = texto(f04);
    for (const t of [t05, t04]) {
      expect(t).not.toMatch(/undefined|\{|\}/);
    }
    // 11 cadetes: las filas 9–11 se clonan del renglón 8.
    expect(t05).toContain("CADETE 11");
    expect(t05).toMatch(/\n11\n/);
    expect(t05).toContain("Tecnología de Materiales");
    expect(t05).toContain("☒ 1er");
    expect(t05).toContain("Semana 3");
    expect(t05).toContain("Jefe Prueba");
    // F-04: 5 sesiones × 11 cadetes.
    expect(construirDatosF04(base(nombres)).filas).toHaveLength(55);
    expect(t04).toContain("21/09/26");
    expect(t04).toContain("Ing. Docente Prueba");
  });

  it("funciona con una materia real del programa oficial", () => {
    const programa = Object.values(contenidosMateriasMN).find(esProgramaOficial)!;
    const reales = distribuirPrograma(programa, "")
      .flatMap((b) => b.semanas.map((s) => ({ etiqueta: s.semana, tema: s.tema, objetivoUnidad: b.objetivoEspecifico })))
      .map((s, i) => ({ ...s, numero: i + 1 }))
      .filter((s) => s.numero >= 3 && s.numero <= 7);
    const { f05 } = renderizarRegularizacion(
      plantilla("Regularizacion-F05.docx"),
      plantilla("Regularizacion-F04.docx"),
      { ...base(["A"]), semanas: reales, asignatura: programa.nombre },
    );
    expect(texto(f05)).toContain(programa.nombre);
  });
});
