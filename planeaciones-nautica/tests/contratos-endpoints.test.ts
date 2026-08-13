// PRIORIDAD 4 — Los contratos de salida de los endpoints (claves del JSON y
// códigos de error) no cambian, y el desvío de contenido almacenado se decide
// ANTES de leer el corpus histórico.
//
// Las pruebas llaman al handler POST directamente, con la autenticación y los
// límites simulados. NO hay servidor, NO hay red y NO hay API key: las claves se
// vacían a propósito, de modo que cada camino se detiene en la comprobación de
// clave sin llamar a ningún modelo. Una prueba que necesitara GEMINI_API_KEY no
// se ejecutaría nunca y no protegería nada.

import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../app/lib/server/auth", () => ({
  verificarAuth: vi.fn(async () => ({
    ok: true,
    sesion: {
      uid: "prueba",
      email: "prueba@fidena.edu.mx",
      nombre: "Prueba",
      esAdmin: false,
    },
  })),
}));

vi.mock("../app/lib/server/limites", () => ({
  verificarLimite: vi.fn(async () => ({ ok: true })),
  contarUso: vi.fn(async () => {}),
}));

// Se conserva la implementación real (lee .indice-ingles/indice.json del disco)
// y solo se envuelve para poder comprobar SI se llamó. El desvío de los niveles
// almacenados se define justamente por no llegar aquí.
vi.mock("../app/lib/bibliotecaIngles", async (importOriginal) => {
  const real = await importOriginal<typeof import("../app/lib/bibliotecaIngles")>();
  return {
    ...real,
    BibliotecaIngles: {
      ...real.BibliotecaIngles,
      leerIndice: vi.fn(real.BibliotecaIngles.leerIndice),
    },
  };
});

const peticion = (cuerpo: unknown) =>
  new Request("http://localhost/api/x", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
  });

async function leerIndiceMock(): Promise<Mock> {
  const { BibliotecaIngles } = await import("../app/lib/bibliotecaIngles");
  return BibliotecaIngles.leerIndice as unknown as Mock;
}

beforeEach(async () => {
  // Sin claves: ningún camino puede alcanzar a un modelo desde las pruebas.
  vi.stubEnv("GEMINI_API_KEY", "");
  vi.stubEnv("ANTHROPIC_API_KEY", "");
  (await leerIndiceMock()).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/api/planeacion-ingles — contrato de salida", () => {
  it("cuerpo no-JSON → 400 json_invalido", async () => {
    const { POST } = await import("../app/api/planeacion-ingles/route");
    const res = await POST(peticion("esto no es json"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: "json_invalido" });
  });

  it("sin nivel → 400 faltan_datos", async () => {
    const { POST } = await import("../app/api/planeacion-ingles/route");
    const res = await POST(peticion({ grupo: "I A PN" }));
    expect(res.status).toBe(400);
    const datos = await res.json();
    expect(datos.error).toBe("faltan_datos");
    expect(typeof datos.mensaje).toBe("string");
  });

  // El libro que tiene que salir en la bibliografía servida, POR NIVEL. VII no
  // es StartUp: es Career Paths: Merchant Navy 1, cuya editorial SÍ es Express
  // Publishing, así que su prohibición es el TÍTULO del libro abandonado.
  const LIBRO_SERVIDO: Record<string, { debe: RegExp; noDebe: RegExp }> = {
    "1": { debe: /StartUp Level 1 /, noDebe: /i\s?discover|express publishing/i },
    "2": { debe: /StartUp Level 2 /, noDebe: /i\s?discover|express publishing/i },
    "3": { debe: /StartUp Level 3 /, noDebe: /i\s?discover|express publishing/i },
    VII: {
      debe: /Career Paths: Merchant Navy, Book 1/,
      noDebe: /i\s?discover|startup|pearson/i,
    },
  };

  for (const nivel of ["1", "2", "3", "VII"]) {
    it(`nivel ${nivel} → 200 servido desde contenido almacenado, sin tocar el corpus`, async () => {
      const { POST } = await import("../app/api/planeacion-ingles/route");
      const res = await POST(peticion({ nivel, grupo: "I A PN" }));
      expect(res.status).toBe(200);
      const datos = await res.json();

      // Las tres claves que consume la UI.
      expect(Object.keys(datos).sort()).toEqual([
        "modelo",
        "planeacion",
        "referenciasUsadas",
      ]);
      // No miente diciendo que lo generó un modelo.
      expect(datos.modelo).toBe("almacenado");
      expect(datos.referenciasUsadas).toEqual([]);
      expect(datos.planeacion.nivel).toBe(nivel);
      expect(datos.planeacion.secuenciaSemanal).toHaveLength(18);
      // El libro correcto, el de SU nivel, nunca el corpus de iDiscover.
      const bib = JSON.stringify(datos.planeacion.bibliografia);
      expect(bib).toMatch(LIBRO_SERVIDO[nivel].debe);
      expect(bib).not.toMatch(LIBRO_SERVIDO[nivel].noDebe);

      // La comprobación que fija el desvío: no se leyó el índice histórico.
      expect((await leerIndiceMock()).mock.calls.length).toBe(0);
    });
  }

  it("un nivel espejeado SÍ lee el corpus y se detiene sin API key (503 sin_api_key)", async () => {
    const { POST } = await import("../app/api/planeacion-ingles/route");
    const res = await POST(peticion({ nivel: "4", grupo: "IV A PN" }));
    expect((await leerIndiceMock()).mock.calls.length).toBe(1);
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ error: "sin_api_key" });
  });

  it("nivel sin históricas ni espejo → 404 sin_historicas_nivel con la lista de niveles", async () => {
    const { POST } = await import("../app/api/planeacion-ingles/route");
    const res = await POST(peticion({ nivel: "97" }));
    expect(res.status).toBe(404);
    const datos = await res.json();
    expect(datos.error).toBe("sin_historicas_nivel");
    expect(Array.isArray(datos.nivelesDisponibles)).toBe(true);
    expect(datos.nivelesDisponibles.length).toBeGreaterThan(0);
  });

  it("el nivel 8 no cae en 404: el espejo le presta las históricas del 7", async () => {
    const { POST } = await import("../app/api/planeacion-ingles/route");
    const res = await POST(peticion({ nivel: "8" }));
    // Llega hasta la comprobación de clave, que es la SIGUIENTE al 404.
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ error: "sin_api_key" });
  });
});

describe("/api/presentacion-ingles — contrato de salida", () => {
  it("sin nivel → 400 faltan_datos", async () => {
    const { POST } = await import("../app/api/presentacion-ingles/route");
    const res = await POST(peticion({ tema: "Puerto" }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: "faltan_datos" });
  });

  it("cuerpo no-JSON → 400 json_invalido", async () => {
    const { POST } = await import("../app/api/presentacion-ingles/route");
    const res = await POST(peticion("{{{"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: "json_invalido" });
  });

  for (const nivel of ["1", "2", "3", "VII"]) {
    it(`nivel ${nivel}: la presentación tampoco lee el corpus de iDiscover`, async () => {
      // D2/04d3f56: sin este desvío el nivel 2 daba 404 y los niveles 1 y 3
      // generaban diapositivas del libro abandonado, sin error visible.
      const { POST } = await import("../app/api/presentacion-ingles/route");
      const res = await POST(peticion({ nivel, tema: "Unit 1", forzar: true }));
      expect((await leerIndiceMock()).mock.calls.length).toBe(0);
      // Sin clave no se genera: el contrato aquí es el código, no el contenido.
      expect(res.status).toBe(503);
      await expect(res.json()).resolves.toMatchObject({ error: "sin_api_key" });
    });
  }

  it("un nivel espejeado sí lee el corpus", async () => {
    const { POST } = await import("../app/api/presentacion-ingles/route");
    const res = await POST(peticion({ nivel: "5", tema: "Safety", forzar: true }));
    expect((await leerIndiceMock()).mock.calls.length).toBe(1);
    expect(res.status).toBe(503);
  });

  it("el nivel 8 no cae en 404 (espejo del 7)", async () => {
    const { POST } = await import("../app/api/presentacion-ingles/route");
    const res = await POST(peticion({ nivel: "8", forzar: true }));
    expect(res.status).not.toBe(404);
  });
});

describe("/api/examen — degradación silenciosa, nunca un 500", () => {
  // Contrato deliberado de este endpoint: SIEMPRE 200 con { preguntas, motivo }.
  // La UI cae al banco determinista cuando `preguntas` es null; si empezara a
  // devolver 4xx/5xx, el docente vería un error en vez de su examen.
  it("sin materia ni temas → 200 { preguntas: null, motivo: 'sin_temas' }", async () => {
    const { POST } = await import("../app/api/examen/route");
    const res = await POST(peticion({ ambito: "INGLES" }));
    expect(res.status).toBe(200);
    const datos = await res.json();
    expect(datos.preguntas).toBeNull();
    expect(datos.motivo).toBe("sin_temas");
  });

  it("cuerpo no-JSON → 200 { preguntas: null, motivo: 'json_invalido' }", async () => {
    const { POST } = await import("../app/api/examen/route");
    const res = await POST(peticion("nada"));
    expect(res.status).toBe(200);
    const datos = await res.json();
    expect(datos.preguntas).toBeNull();
    expect(datos.motivo).toBe("json_invalido");
  });

  it("con temas pero sin API key → 200 y preguntas nulas, no una excepción", async () => {
    const { POST } = await import("../app/api/examen/route");
    const res = await POST(
      peticion({
        ambito: "INGLES",
        materia: "Inglés Nivel 1",
        tipo: "Examen Parcial",
        temas: ["Verb to be", "Numbers"],
        total: 17,
        forzar: true,
      }),
    );
    expect(res.status).toBe(200);
    const datos = await res.json();
    expect(datos).toHaveProperty("preguntas");
    if (datos.preguntas === null) expect(typeof datos.motivo).toBe("string");
  });
});
