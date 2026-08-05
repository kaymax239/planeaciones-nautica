// QA del flujo de presentaciones — FALLBACK: qué recibe el docente cuando la IA
// no puede responder (cuota agotada / 429, clave ausente, proveedor caído).
//
// Regla de la suite: PURA y SIN RED. Aquí NO se llama a ningún proveedor: se
// sustituyen los SDK (`@google/genai` y `@anthropic-ai/sdk`) por dobles que
// devuelven lo que cada prueba decide. Se hace a nivel de SDK a propósito, no
// del envoltorio (`geminiIA` / `claudeIA`): así la prueba describe el
// comportamiento del endpoint y no la forma concreta del envoltorio.
//
// Lo que se protege: el docente NUNCA se queda sin presentación. O la sirve el
// proveedor principal, o el de respaldo, o el cache, o —si todo falla— el
// endpoint devuelve un error JSON limpio y la UI cae al generador determinista.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { contenidosMaterias, contenidosMateriasMN } from "../app/data/contenidosMaterias";
import { esProgramaOficial } from "../app/data/tipos";
import {
  construirPresentacionV2,
  TEMA_UNIDAD_COMPLETA,
} from "../app/lib/construirPresentacionV2";
import { problemasPptx, renderizarPptx, textoPptx } from "./ayudas/pptx";

// El cache va al temporal del sistema, no al proyecto (ver cachePresentacion.ts).
vi.stubEnv("VERCEL", "1");

const MATERIA = "Simulador de Navegación I";

/* ------------------------------ Dobles de IA ------------------------------ */

/** Guion mínimo VÁLIDO: una diapositiva con un bloque real. La marca permite
 *  saber QUIÉN respondió. */
const guion = (marca: string) =>
  JSON.stringify({
    diapositivas: [
      {
        titulo: "Introducción al uso del simulador Full Mission",
        bloques: [{ tipo: "bullets", items: [marca] }],
      },
    ],
  });

/** Error con `status`, como los que lanzan los SDK ante cuota agotada. */
function errorHttp(status: number, mensaje: string): Error {
  return Object.assign(new Error(mensaje), { status });
}

// vi.hoisted: la fábrica de vi.mock se eleva por encima de las constantes del
// módulo, así que el estado que comparten tiene que crearse antes.
const respuesta = vi.hoisted(() => ({
  gemini: null as null | (() => string),
  claude: null as null | (() => string),
}));

vi.mock("@google/genai", async (importOriginal) => {
  // `Type` lo usa el esquema de respuesta de la ruta: se conservan los exports
  // reales y solo se sustituye el cliente.
  const real = await importOriginal<typeof import("@google/genai")>();
  class GoogleGenAI {
    models = {
      generateContentStream: async function* () {
        if (!respuesta.gemini) throw errorHttp(429, "RESOURCE_EXHAUSTED: quota");
        yield { text: respuesta.gemini() };
      },
      generateContent: async () => {
        if (!respuesta.gemini) throw errorHttp(429, "RESOURCE_EXHAUSTED: quota");
        return { text: respuesta.gemini() };
      },
    };
  }
  return { ...real, GoogleGenAI };
});

vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {
    status?: number;
  }
  const mensaje = () => {
    if (!respuesta.claude) throw errorHttp(429, "rate limit exceeded");
    return { content: [{ type: "text", text: respuesta.claude() }] };
  };
  class Anthropic {
    static APIError = APIError;
    messages = {
      stream: () => ({ finalMessage: async () => mensaje() }),
      create: async () => mensaje(),
    };
  }
  return { default: Anthropic, APIError };
});

/* ----------------------- Autenticación y límites: off ---------------------- */

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

const peticion = (cuerpo: unknown) =>
  new Request("http://localhost/api/presentacion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
  });

/** Cuerpo del caso de referencia: VII semestre → Simulador I → Unidad 1. */
const CASO = {
  carrera: "PN",
  materia: MATERIA,
  unidadNumero: 1,
  tema: TEMA_UNIDAD_COMPLETA,
  carreraDisplay: "Licenciatura en Piloto Naval",
  semestreDisplay: "VII Semestre",
  // Siempre `forzar`: estas pruebas hablan de la GENERACIÓN, no del cache (que
  // además vive en un temporal compartido entre ejecuciones).
  forzar: true,
};

async function postPresentacion(cuerpo: unknown) {
  const { POST } = await import("../app/api/presentacion/route");
  return POST(peticion(cuerpo));
}

beforeEach(() => {
  respuesta.gemini = null;
  respuesta.claude = null;
  vi.stubEnv("GEMINI_API_KEY", "");
  vi.stubEnv("ANTHROPIC_API_KEY", "");
  vi.stubEnv("PROVEEDOR_PRESENTACIONES", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/api/presentacion — el proveedor falla y el docente NO se queda sin nada", () => {
  it("cuota agotada (429) en el proveedor principal → responde el de respaldo", async () => {
    vi.stubEnv("GEMINI_API_KEY", "clave-de-prueba");
    vi.stubEnv("ANTHROPIC_API_KEY", "clave-de-prueba");
    respuesta.gemini = null; // 429
    respuesta.claude = () => guion("servido-por-el-respaldo");

    const res = await postPresentacion(CASO);
    expect(res.status).toBe(200);
    const datos = await res.json();
    expect(datos.presentacion).toBeTruthy();
    expect(JSON.stringify(datos.presentacion)).toContain(
      "servido-por-el-respaldo",
    );
  });

  it("clave del proveedor principal ausente → responde el de respaldo", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "clave-de-prueba");
    respuesta.claude = () => guion("servido-por-el-respaldo");

    const res = await postPresentacion(CASO);
    expect(res.status).toBe(200);
    expect(JSON.stringify(await res.json())).toContain("servido-por-el-respaldo");
  });

  it("los DOS proveedores caídos → error JSON con código, nunca una excepción", async () => {
    vi.stubEnv("GEMINI_API_KEY", "clave-de-prueba");
    vi.stubEnv("ANTHROPIC_API_KEY", "clave-de-prueba");

    const res = await postPresentacion(CASO);
    expect(res.status).toBeGreaterThanOrEqual(400);
    const datos = await res.json();
    // El cliente distingue este cuerpo y cae al generador determinista.
    expect(typeof datos.error).toBe("string");
    expect(datos.error.length).toBeGreaterThan(0);
    expect(datos.presentacion).toBeUndefined();
  });

  it("respuesta sin diapositivas útiles → error, no un deck vacío", async () => {
    vi.stubEnv("GEMINI_API_KEY", "clave-de-prueba");
    respuesta.gemini = () =>
      JSON.stringify({ diapositivas: [{ titulo: "", bloques: [] }] });

    const res = await postPresentacion(CASO);
    expect(res.status).toBeGreaterThanOrEqual(400);
    const datos = await res.json();
    expect(typeof datos.error).toBe("string");
    expect(datos.presentacion).toBeUndefined();
  });

  it("respuesta que no es JSON → error, no un 500 sin cuerpo", async () => {
    vi.stubEnv("GEMINI_API_KEY", "clave-de-prueba");
    respuesta.gemini = () => "lo siento, no puedo generar eso";

    const res = await postPresentacion(CASO);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(typeof (await res.json()).error).toBe("string");
  });

  it("sin ninguna clave configurada → 503 sin_api_key", async () => {
    const res = await postPresentacion(CASO);
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ error: "sin_api_key" });
  });

  it("la basura del deck se descarta pero lo válido llega al docente", async () => {
    vi.stubEnv("GEMINI_API_KEY", "clave-de-prueba");
    respuesta.gemini = () =>
      JSON.stringify({
        diapositivas: [
          { titulo: "Válida", bloques: [{ tipo: "bullets", items: ["ok"] }] },
          { titulo: "Inválida", bloques: [{ tipo: "no-existe", x: 1 }] },
        ],
      });

    const res = await postPresentacion(CASO);
    expect(res.status).toBe(200);
    const { presentacion } = await res.json();
    expect(presentacion.diapositivas).toHaveLength(1);
    expect(presentacion.diapositivas[0].titulo).toBe("Válida");
  });
});

describe("/api/presentacion — el cache es la otra red de seguridad", () => {
  it("una unidad ya generada se sirve aunque NINGÚN proveedor tenga clave", async () => {
    // Marca única por ejecución: si la prueba pasara por leer una entrada vieja
    // del temporal, el contenido no coincidiría y se vería.
    const marca = `deck-${randomUUID()}`;
    vi.stubEnv("GEMINI_API_KEY", "clave-de-prueba");
    vi.stubEnv("ANTHROPIC_API_KEY", "clave-de-prueba");
    respuesta.gemini = () => guion(marca);

    const generado = await postPresentacion(CASO);
    expect(generado.status).toBe(200);
    expect((await generado.json()).cacheado).toBe(false);

    // Segunda petición: sin claves, sin `forzar` y sin proveedor que responda.
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    respuesta.gemini = null;
    respuesta.claude = null;

    const res = await postPresentacion({ ...CASO, forzar: false });
    expect(res.status).toBe(200);
    const datos = await res.json();
    expect(datos.cacheado).toBe(true);
    expect(JSON.stringify(datos.presentacion)).toContain(marca);
  });
});

describe("/api/presentacion — contrato de errores de entrada", () => {
  it("cuerpo no-JSON → 400 json_invalido", async () => {
    const res = await postPresentacion("{{{");
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: "json_invalido" });
  });

  it("sin materia → 400 faltan_datos", async () => {
    const res = await postPresentacion({ carrera: "PN", unidadNumero: 1 });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: "faltan_datos" });
  });

  it("materia sin programa oficial → 404 sin_programa", async () => {
    vi.stubEnv("GEMINI_API_KEY", "clave-de-prueba");
    const res = await postPresentacion({ ...CASO, materia: "Materia Inventada" });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ error: "sin_programa" });
  });

  it("unidad inexistente → 404 sin_unidad", async () => {
    vi.stubEnv("GEMINI_API_KEY", "clave-de-prueba");
    const res = await postPresentacion({ ...CASO, unidadNumero: 99 });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ error: "sin_unidad" });
  });
});

/* --------------------------------------------------------------------------
 * La última red: el generador determinista. Es lo que la UI usa cuando el
 * endpoint devuelve error, así que tiene que funcionar SIEMPRE y sin IA.
 * ------------------------------------------------------------------------ */

describe("red de seguridad · el generador determinista cubre todo el currículo", () => {
  it("Simulador de Navegación I: todas sus unidades producen un deck con contenido", () => {
    const programa = contenidosMaterias[MATERIA];
    for (const u of programa.unidades) {
      const pres = construirPresentacionV2({
        programa,
        carrera: "Licenciatura en Piloto Naval",
        semestre: "VII Semestre",
        unidadNumero: u.numero,
        tema: TEMA_UNIDAD_COMPLETA,
      });
      expect(pres, `unidad ${u.numero} sin presentación`).not.toBeNull();
      expect(
        pres!.diapositivas.length,
        `unidad ${u.numero} con muy pocas diapositivas`,
      ).toBeGreaterThanOrEqual(3);
      expect(pres!.diapositivas[0].layout).toBe("portada");
    }
  });

  it("y también cada tema suelto de la Unidad 1", () => {
    const programa = contenidosMaterias[MATERIA];
    const u1 = programa.unidades.find((u) => u.numero === 1)!;
    for (const tema of u1.subtemas) {
      const pres = construirPresentacionV2({
        programa,
        carrera: "Licenciatura en Piloto Naval",
        semestre: "VII Semestre",
        unidadNumero: 1,
        tema,
      });
      expect(pres, `sin presentación para el tema ${tema}`).not.toBeNull();
      expect(pres!.diapositivas.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("ninguna materia oficial (PN y MN) se queda sin deck en ninguna unidad", () => {
    const fallos: string[] = [];
    for (const [nombre, fuente] of [
      ["PN", contenidosMaterias],
      ["MN", contenidosMateriasMN],
    ] as const) {
      for (const [materia, programa] of Object.entries(fuente)) {
        if (!esProgramaOficial(programa)) continue;
        for (const u of programa.unidades) {
          const pres = construirPresentacionV2({
            programa,
            carrera: nombre,
            semestre: "—",
            unidadNumero: u.numero,
            tema: TEMA_UNIDAD_COMPLETA,
          });
          if (!pres || pres.diapositivas.length < 3)
            fallos.push(`${nombre} · ${materia} · unidad ${u.numero}`);
        }
      }
    }
    expect(fallos).toEqual([]);
  });

  it("el deck de respaldo de la Unidad 1 rinde un .pptx abrible y con temario", async () => {
    const programa = contenidosMaterias[MATERIA];
    const pres = construirPresentacionV2({
      programa,
      carrera: "Licenciatura en Piloto Naval",
      semestre: "VII Semestre",
      unidadNumero: 1,
      tema: TEMA_UNIDAD_COMPLETA,
    })!;
    const buffer = await renderizarPptx(pres);
    expect(problemasPptx(buffer)).toEqual([]);
    expect(textoPptx(buffer)).toContain("Panel de las alarmas");
  });
});
