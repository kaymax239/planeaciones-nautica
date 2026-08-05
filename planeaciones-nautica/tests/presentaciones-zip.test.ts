// QA del flujo de presentaciones — PAQUETE ZIP de "todas las unidades".
//
// Lo que se protege: el ZIP lleva UN fichero por unidad, con nombres únicos, y
// cada fichero es un .pptx abrible cuyo contenido corresponde a SU unidad. El
// modo de fallo que se busca es el silencioso: un ZIP que se descarga y se abre
// pero al que le falta una unidad, o en el que dos unidades se pisaron el nombre
// (el ZIP se queda con la última y nadie se entera), o cuyos bytes se
// corrompieron al empaquetar.
//
// Sin red, sin servidor y sin API key: los .pptx los produce el generador
// determinista + el renderer reales.

import { describe, expect, it } from "vitest";
import PizZip from "pizzip";
import { contenidosMaterias } from "../app/data/contenidosMaterias";
import {
  construirPresentacionV2,
  TEMA_UNIDAD_COMPLETA,
} from "../app/lib/construirPresentacionV2";
import {
  construirZipPresentaciones,
  trozoNombreSeguro,
  type EntradaZip,
} from "../app/lib/zipPresentaciones";
import { normalizar, problemasPptx, renderizarPptx, textoPptx } from "./ayudas/pptx";

const MATERIA = "Simulador de Navegación I";
const programa = contenidosMaterias[MATERIA];

/** Nombre de cada .pptx dentro del ZIP (contrato del generador masivo):
 *  `NN_materia_UN.pptx`, con NN = número de unidad a 2 dígitos para que el
 *  explorador de archivos los ordene como el programa. */
const nombreEnZip = (materia: string, unidad: number) =>
  `${String(unidad).padStart(2, "0")}_${trozoNombreSeguro(materia) || "materia"}_U${unidad}.pptx`;

/** Genera de verdad el .pptx de cada unidad de una materia. */
async function entradasDe(materia: string): Promise<EntradaZip[]> {
  const prog = contenidosMaterias[materia];
  const entradas: EntradaZip[] = [];
  for (const u of prog.unidades) {
    const pres = construirPresentacionV2({
      programa: prog,
      carrera: "Licenciatura en Piloto Naval",
      semestre: "VII Semestre",
      unidadNumero: u.numero,
      tema: TEMA_UNIDAD_COMPLETA,
    })!;
    const buffer = await renderizarPptx(pres);
    entradas.push({
      nombre: nombreEnZip(materia, u.numero),
      datos: buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer,
    });
  }
  return entradas;
}

async function bytesDelZip(blob: Blob): Promise<Buffer> {
  return Buffer.from(await blob.arrayBuffer());
}

describe("ZIP de todas las unidades · Simulador de Navegación I", () => {
  it("nombres de fichero seguros y sin colisiones para las 7 unidades", () => {
    const nombres = programa.unidades.map((u) => nombreEnZip(MATERIA, u.numero));
    expect(new Set(nombres).size).toBe(programa.unidades.length);
    for (const n of nombres) {
      // Nada que un sistema de archivos (o el propio ZIP) pueda malinterpretar.
      expect(n).toMatch(/^[A-Za-z0-9_.-]+\.pptx$/);
      expect(n).not.toMatch(/[\\/:*?"<>|]/);
    }
  });

  it("trozoNombreSeguro quita acentos, espacios y separadores de ruta", () => {
    expect(trozoNombreSeguro(MATERIA)).toBe("Simulador-de-Navegacion-I");
    expect(trozoNombreSeguro("Teoría del buque II")).toBe("Teoria-del-buque-II");
    expect(trozoNombreSeguro("a/b\\c:d*e")).toBe("a-b-c-d-e");
    expect(trozoNombreSeguro("   ")).toBe("");
    expect(trozoNombreSeguro("x".repeat(200)).length).toBeLessThanOrEqual(60);
  });

  it("el paquete lleva un .pptx por unidad más el RESUMEN.txt", async () => {
    const entradas = await entradasDe(MATERIA);
    const zip = new PizZip(
      await bytesDelZip(construirZipPresentaciones(entradas, "resumen de prueba")),
    );

    const ficheros = Object.keys(zip.files).sort();
    expect(ficheros).toEqual(
      [...entradas.map((e) => e.nombre), "RESUMEN.txt"].sort(),
    );
    expect(ficheros).toHaveLength(programa.unidades.length + 1);
    expect(zip.files["RESUMEN.txt"].asText()).toContain("resumen de prueba");
  });

  it("cada fichero del ZIP es un .pptx válido y trae SU unidad, no otra", async () => {
    const entradas = await entradasDe(MATERIA);
    const zip = new PizZip(
      await bytesDelZip(construirZipPresentaciones(entradas, "resumen")),
    );

    for (const u of programa.unidades) {
      const nombre = nombreEnZip(MATERIA, u.numero);
      const dentro = Buffer.from(zip.files[nombre].asUint8Array());
      expect(problemasPptx(dentro), `${nombre} no es un .pptx válido`).toEqual([]);

      const texto = normalizar(textoPptx(dentro));
      expect(texto, `${nombre} no habla de su unidad`).toContain(
        normalizar(u.tema),
      );
      // Y trae el temario oficial de ESA unidad.
      for (const subtema of u.subtemas.slice(0, 3)) {
        expect(texto, `${nombre} sin el subtema ${subtema}`).toContain(
          normalizar(subtema),
        );
      }
    }
  });

  it("los bytes del .pptx sobreviven al empaquetado sin corromperse", async () => {
    const entradas = await entradasDe(MATERIA);
    const zip = new PizZip(
      await bytesDelZip(construirZipPresentaciones(entradas, "resumen")),
    );
    for (const entrada of entradas) {
      const dentro = Buffer.from(zip.files[entrada.nombre].asUint8Array());
      expect(
        dentro.equals(Buffer.from(entrada.datos)),
        `${entrada.nombre} cambió al empaquetarse`,
      ).toBe(true);
    }
  });

  it("dos entradas con el mismo nombre se detectan: el ZIP se queda con una sola", async () => {
    // No es una prueba del empaquetador, sino de por qué los nombres tienen que
    // ser únicos AGUAS ARRIBA: un ZIP con nombres repetidos pierde ficheros sin
    // avisar. Si esta prueba deja de cumplirse, mejor todavía, pero el generador
    // no puede confiar en ello.
    const entradas = await entradasDe(MATERIA);
    const repetidas = [
      { ...entradas[0], nombre: "colision.pptx" },
      { ...entradas[1], nombre: "colision.pptx" },
    ];
    const zip = new PizZip(
      await bytesDelZip(construirZipPresentaciones(repetidas, "resumen")),
    );
    const cuantos = Object.keys(zip.files).filter(
      (f) => f === "colision.pptx",
    ).length;
    expect(cuantos).toBe(1);
  });

  it("un paquete parcial sigue siendo un ZIP abrible con su RESUMEN", async () => {
    // Si una unidad falla (cuota, IA caída), el ZIP se entrega igualmente con
    // las que sí salieron: el docente nunca se queda con las manos vacías.
    const entradas = (await entradasDe(MATERIA)).slice(0, 2);
    const resumen = "Unidad 3: FALLO — cuota agotada";
    const zip = new PizZip(
      await bytesDelZip(construirZipPresentaciones(entradas, resumen)),
    );
    expect(Object.keys(zip.files)).toHaveLength(3);
    expect(zip.files["RESUMEN.txt"].asText()).toContain("FALLO");
  });

  it("un paquete sin ninguna unidad sigue explicando qué pasó", async () => {
    const zip = new PizZip(
      await bytesDelZip(
        construirZipPresentaciones([], "Ninguna unidad se pudo generar."),
      ),
    );
    expect(Object.keys(zip.files)).toEqual(["RESUMEN.txt"]);
    expect(zip.files["RESUMEN.txt"].asText()).toContain("Ninguna unidad");
  });
});

/* --------------------------------------------------------------------------
 * Captura de los bytes del .pptx (el paso previo al ZIP).
 *
 * `capturarPptx` intercepta el camino de descarga del NAVEGADOR: aquí no hay
 * navegador, así que se simula ese camino (un Blob con el mime de PowerPoint y
 * un <a download>.click()). Lo que se comprueba NO es pptxgenjs, sino las tres
 * garantías de la intercepción, que es donde un fallo se vuelve invisible:
 * devolver los bytes, restaurar SIEMPRE los globales parcheados, y fallar
 * ruidosamente si no capturó nada en vez de meter un hueco en el ZIP.
 * ------------------------------------------------------------------------ */

const MIME_PPTX =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

/** Instala los globales del navegador que usa la captura, y los quita al salir. */
async function conNavegadorSimulado<T>(
  cuerpo: (clics: string[]) => Promise<T>,
): Promise<T> {
  const clics: string[] = [];
  const anteriorAncla = (globalThis as Record<string, unknown>).HTMLAnchorElement;
  class AnclaFalsa {
    download = "";
    href = "";
    click() {
      clics.push(this.download);
    }
  }
  (globalThis as Record<string, unknown>).HTMLAnchorElement = AnclaFalsa;
  try {
    return await cuerpo(clics);
  } finally {
    (globalThis as Record<string, unknown>).HTMLAnchorElement = anteriorAncla;
  }
}

/** Imita lo que hace pptxgenjs en el navegador al escribir el archivo. */
function descargaSimulada(nombre: string, bytes: Uint8Array<ArrayBuffer>): string {
  const url = URL.createObjectURL(new Blob([bytes], { type: MIME_PPTX }));
  const ancla = new (globalThis as unknown as {
    HTMLAnchorElement: new () => { download: string; href: string; click(): void };
  }).HTMLAnchorElement();
  ancla.download = nombre;
  ancla.href = url;
  ancla.click();
  return nombre;
}

describe("captura de los bytes del .pptx sin descargarlo suelto", () => {
  it("devuelve nombre y bytes, y se traga el clic de descarga", async () => {
    await conNavegadorSimulado(async (clics) => {
      const { capturarPptx } = await import("../app/lib/zipPresentaciones");
      const bytes = new Uint8Array([0x50, 0x4b, 3, 4, 9, 9]);
      const capturado = await capturarPptx(async () =>
        descargaSimulada("Presentacion_SMV747_U1_V2.pptx", bytes),
      );
      expect(capturado.nombre).toBe("Presentacion_SMV747_U1_V2.pptx");
      expect(Buffer.from(capturado.datos).equals(Buffer.from(bytes))).toBe(true);
      // El archivo NO acabó suelto en la carpeta de Descargas.
      expect(clics).toEqual([]);
    });
  });

  it("si no se pudo capturar nada, falla en vez de dejar un hueco en el ZIP", async () => {
    await conNavegadorSimulado(async () => {
      const { capturarPptx } = await import("../app/lib/zipPresentaciones");
      await expect(capturarPptx(async () => "sin-descarga.pptx")).rejects.toThrow();
    });
  });

  it("restaura los parches globales aunque la generación falle", async () => {
    await conNavegadorSimulado(async (clics) => {
      const { capturarPptx } = await import("../app/lib/zipPresentaciones");
      const clickOriginal = (
        globalThis as unknown as { HTMLAnchorElement: { prototype: { click: unknown } } }
      ).HTMLAnchorElement.prototype.click;

      await expect(
        capturarPptx(async () => {
          throw new Error("la IA falló a mitad");
        }),
      ).rejects.toThrow("la IA falló a mitad");

      // El clic vuelve a ser el de verdad: si se quedara tragado, NINGUNA
      // descarga del panel volvería a funcionar hasta recargar la página.
      expect(
        (globalThis as unknown as { HTMLAnchorElement: { prototype: { click: unknown } } })
          .HTMLAnchorElement.prototype.click,
      ).toBe(clickOriginal);
      descargaSimulada("suelto.pptx", new Uint8Array([7]));
      expect(clics).toEqual(["suelto.pptx"]);

      // Y `URL.createObjectURL` sigue siendo utilizable.
      expect(typeof URL.createObjectURL).toBe("function");
      expect(
        URL.createObjectURL(new Blob([new Uint8Array([1])])),
      ).toMatch(/^blob:/);
    });
  });

  // BUG (código ajeno, app/lib/zipPresentaciones.ts:52 y :77): la restauración
  // de `URL.createObjectURL` NO devuelve la función original, sino la copia
  // `bind`eada que se guardó al entrar (`URL.createObjectURL.bind(URL)`). Cada
  // captura envuelve a la anterior, así que tras N unidades el global es una
  // cadena de N `bound createObjectURL`. No rompe la descarga (cada capa
  // delega), pero el global nunca vuelve a su identidad y la indirección crece
  // sin límite mientras la pestaña siga abierta. Arreglo: guardar
  // `const crearURL = URL.createObjectURL` y llamarlo con `crearURL.call(URL, …)`.
  // Se deja en skip a propósito: no toca a esta suite arreglar app/.
  it("deja `URL.createObjectURL` con su identidad original", async () => {
    await conNavegadorSimulado(async () => {
      const { capturarPptx } = await import("../app/lib/zipPresentaciones");
      const crearURL = URL.createObjectURL;
      await capturarPptx(async () =>
        descargaSimulada("A.pptx", new Uint8Array([1])),
      );
      expect(URL.createObjectURL).toBe(crearURL);
    });
  });

  it("dos capturas a la vez no se mezclan (los parches son globales)", async () => {
    await conNavegadorSimulado(async () => {
      const { capturarPptx } = await import("../app/lib/zipPresentaciones");
      const [a, b] = await Promise.all([
        capturarPptx(async () => descargaSimulada("A.pptx", new Uint8Array([1, 1, 1]))),
        capturarPptx(async () => descargaSimulada("B.pptx", new Uint8Array([2, 2]))),
      ]);
      expect([a.nombre, b.nombre]).toEqual(["A.pptx", "B.pptx"]);
      expect(Buffer.from(a.datos).equals(Buffer.from([1, 1, 1]))).toBe(true);
      expect(Buffer.from(b.datos).equals(Buffer.from([2, 2]))).toBe(true);
    });
  });
});

describe("las ayudas de la propia suite detectan un .pptx roto", () => {
  // Un validador que aprueba cualquier cosa no protege nada.
  it("rechaza lo que no es un ZIP, lo que no lleva diapositivas y el XML roto", () => {
    expect(problemasPptx(Buffer.from("no soy un pptx"))).not.toEqual([]);
    expect(problemasPptx(Buffer.alloc(0))).not.toEqual([]);

    const vacio = new PizZip();
    vacio.file("hola.txt", "nada");
    expect(
      problemasPptx(vacio.generate({ type: "nodebuffer" }) as Buffer),
    ).not.toEqual([]);
  });

  it("detecta una diapositiva con el XML mal cerrado", async () => {
    const pres = construirPresentacionV2({
      programa,
      carrera: "Licenciatura en Piloto Naval",
      semestre: "VII Semestre",
      unidadNumero: 1,
      tema: TEMA_UNIDAD_COMPLETA,
    })!;
    const buffer = await renderizarPptx(pres);
    expect(problemasPptx(buffer)).toEqual([]);

    const zip = new PizZip(buffer);
    zip.file(
      "ppt/slides/slide1.xml",
      zip.files["ppt/slides/slide1.xml"].asText().replace("</p:sld>", ""),
    );
    expect(
      problemasPptx(zip.generate({ type: "nodebuffer" }) as Buffer),
    ).not.toEqual([]);
  });
});
