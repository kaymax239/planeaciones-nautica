// PRIORIDAD — Ninguna presentación puede contener temario inventado.
//
// Estas pruebas corren contra las FUENTES DE VERDAD REALES del repo
// (app/data/contenidos, app/data/inglesMaritimo, app/data/temarioInglesOficial),
// no contra fixtures inventados: si mañana alguien reescribe un programa, la
// prueba se entera. Son puras y sin red (sin API key), como exige
// vitest.config.mts.
//
// La pareja de casos que importa en cada bloque es: uno LEGÍTIMO que NO debe
// marcarse (el validador tiene que sobrevivir a que el docente reformule,
// acorte y ponga ejemplos) y uno INVENTADO que SÍ. Un validador que solo
// acierta el segundo es un validador que se apaga a la semana.

import { describe, expect, it } from "vitest";
import {
  UMBRAL_OK,
  UMBRAL_SOSPECHA,
  extraerAfirmaciones,
  fuenteDesdeNivelIngles,
  fuenteDesdePrograma,
  normalizar,
  resumirVeredicto,
  similitud,
  validarPresentacionOficial,
  type VeredictoOficial,
} from "../app/lib/validarPresentacionOficial";
import { contenidosMaterias } from "../app/data/contenidosMaterias";
import { construirPresentacionV2 } from "../app/lib/construirPresentacionV2";

/* ------------------------------ utilidades ------------------------------- */

type BloqueTest = Record<string, unknown>;
type DiapoTest = {
  layout?: string;
  etiqueta?: string;
  titulo: string;
  subtitulo?: string;
  bloques?: BloqueTest[];
  mensajeFinal?: string;
};

const deck = (...diapositivas: DiapoTest[]) => ({ diapositivas });

const portada = (titulo: string): DiapoTest => ({
  layout: "portada",
  titulo,
  bloques: [],
});

const cierre = (): DiapoTest => ({
  layout: "cierre",
  titulo: "Cierre",
  bloques: [{ tipo: "bullets", items: ["Repaso de lo visto en clase"] }],
  mensajeFinal: "¡Gracias!",
});

const duras = (v: VeredictoOficial) =>
  v.desviaciones.filter((d) => d.severidad === "dura");

const BUQUES_TANQUE = contenidosMaterias["Familiarización con buques tanque"];
const CARGA_Y_ESTIBA = contenidosMaterias["Carga y Estiba I"];
const CONVENIOS =
  contenidosMaterias["Convenios de la Organización Marítima Internacional"];

/* --------------------------- Sanidad del corpus --------------------------- */
// Si estas premisas dejan de cumplirse, las pruebas de abajo dejan de probar lo
// que dicen probar, así que se comprueban explícitamente.

describe("premisas sobre los datos oficiales", () => {
  it("los programas usados existen y tienen unidades", () => {
    expect(BUQUES_TANQUE?.unidades.length).toBeGreaterThan(0);
    expect(CARGA_Y_ESTIBA?.unidades.length).toBeGreaterThan(0);
    expect(CONVENIOS?.unidades.length).toBeGreaterThan(0);
  });

  it("Carga y Estiba I trae bibliografía oficial y Convenios objetivo general", () => {
    expect(CARGA_Y_ESTIBA.bibliografia.length).toBeGreaterThan(0);
    expect(CONVENIOS.objetivoGeneral).not.toMatch(/^Pendiente de revisión/);
  });
});

/* ---------------------------- Normalización ------------------------------ */

describe("normalización y similitud", () => {
  it("iguala acentos, mayúsculas, puntuación y numeración de temario", () => {
    expect(normalizar("3.1 Toxicidad y otros PELIGROS.")).toBe(
      "toxicidad y otros peligros",
    );
    expect(normalizar("  ¿Qué es la ESTIBA?  ")).toBe("que es la estiba");
  });

  it("una comparación exacta daría falso positivo; la contención no", () => {
    const oficial = "3.1 conceptos generales y efectos de la toxicidad";
    expect(normalizar("Efectos de la toxicidad")).not.toBe(normalizar(oficial));
    expect(similitud("Efectos de la toxicidad", oficial)).toBe(1);
  });

  it("tolera plural y derivación (buque/buques, gas/gases)", () => {
    expect(
      similitud("Equipos del buque", "Equipo para la manipulación en buques"),
    ).toBeGreaterThanOrEqual(UMBRAL_OK);
    expect(similitud("Peligro del gas", "peligro de gases")).toBeGreaterThanOrEqual(
      UMBRAL_OK,
    );
  });

  it("no relaciona temas ajenos", () => {
    expect(
      similitud(
        "Criptomonedas y contratos inteligentes",
        "6.2 Prevención de la contaminación marina",
      ),
    ).toBeLessThan(UMBRAL_SOSPECHA);
  });
});

/* --------------------- Sin programa oficial: NO válido -------------------- */

describe("sin fuente oficial", () => {
  it("una materia sin programa NO se da por válida por defecto", () => {
    const v = validarPresentacionOficial(
      deck(portada("Lo que sea"), { titulo: "Tema libre" }),
      fuenteDesdePrograma(undefined),
    );
    expect(v.estado).toBe("sin_fuente");
    expect(v.valido).toBe(false);
    expect(resumirVeredicto(v)).toMatch(/sin fuente oficial/);
  });

  it("un objeto que no es ProgramaOficial tampoco pasa", () => {
    const v = validarPresentacionOficial(
      deck(portada("x")),
      fuenteDesdePrograma({ nombre: "Materia inventada" }),
    );
    expect(v.valido).toBe(false);
    expect(v.estado).toBe("sin_fuente");
  });

  it("pedir una unidad que no existe es fuente inválida, no deck válido", () => {
    const f = fuenteDesdePrograma(BUQUES_TANQUE, 99);
    expect(f.ok).toBe(false);
    expect(validarPresentacionOficial(deck(portada("x")), f).valido).toBe(false);
  });
});

/* ------------------------- Casos LEGÍTIMOS (verdes) ----------------------- */

describe("presentaciones legítimas que NO deben marcarse", () => {
  const fuente = fuenteDesdePrograma(BUQUES_TANQUE, 3); // Toxicidad y otros peligros

  it("reformular, acortar y ejemplificar el temario oficial es admisible", () => {
    const v = validarPresentacionOficial(
      deck(
        portada("Toxicidad y otros peligros"),
        {
          titulo: "Agenda de la sesión",
          bloques: [
            {
              tipo: "mapaConceptual",
              centro: "Toxicidad y otros peligros",
              ramas: [
                { titulo: "Conceptos generales de la toxicidad" },
                { titulo: "Peligro de incendio" },
                { titulo: "Peligro para la salud" },
                { titulo: "Peligro al medio ambiente" },
              ],
            },
          ],
        },
        {
          etiqueta: "Subtema 3.1",
          titulo: "Efectos de la toxicidad",
          bloques: [
            {
              tipo: "definicion",
              titulo: "Dosis umbral",
              texto:
                "Concentración mínima a partir de la cual una sustancia produce efecto tóxico.",
            },
            {
              tipo: "ejemplo",
              enunciado: "Un ejemplo de exposición a bordo",
              pasos: ["Se detecta el vapor", "Se evacúa el área"],
            },
          ],
        },
        {
          titulo: "Peligro de incendio",
          bloques: [
            { tipo: "bullets", items: ["Triángulo del fuego", "Punto de inflamación"] },
          ],
        },
        {
          titulo: "Práctica guiada",
          bloques: [{ tipo: "ejercicio", items: ["Clasifica estos peligros"] }],
        },
        cierre(),
      ),
      fuente,
    );
    expect(duras(v)).toEqual([]);
    expect(v.valido).toBe(true);
  });

  it("las diapositivas de armazón (Agenda, Práctica, Cierre) no se puntúan", () => {
    const v = validarPresentacionOficial(
      deck(
        { titulo: "AGENDA" },
        { titulo: "Objetivos de la clase", bloques: [] },
        { titulo: "Práctica guiada" },
        { titulo: "Evaluación" },
        { titulo: "Resumen y conclusiones" },
        cierre(),
      ),
      fuente,
    );
    expect(v.desviaciones).toEqual([]);
    expect(v.resumen.elementosEstructurales).toBeGreaterThan(0);
    expect(v.resumen.elementosRevisados).toBe(0);
  });

  it("la unidad transversal se valida contra el programa entero, no contra su línea", () => {
    const transversal = BUQUES_TANQUE.unidades.find((u) => u.transversal)!;
    const v = validarPresentacionOficial(
      deck(
        portada("Contenidos de actualidad"),
        { titulo: "Prevención de la contaminación marina" },
        { titulo: "Operaciones de emergencia a bordo" },
        cierre(),
      ),
      fuenteDesdePrograma(BUQUES_TANQUE, transversal.numero),
    );
    expect(duras(v)).toEqual([]);
  });
});

/* ---------------------------- Tema inventado ------------------------------ */

describe("tema inventado", () => {
  const fuente = fuenteDesdePrograma(BUQUES_TANQUE, 3);

  it("un tema ajeno al programa es desviación DURA y bloquea", () => {
    const v = validarPresentacionOficial(
      deck(
        portada("Toxicidad y otros peligros"),
        { titulo: "Peligro de incendio" },
        { titulo: "Criptomonedas aplicadas al comercio marítimo" },
        cierre(),
      ),
      fuente,
    );
    const d = duras(v);
    expect(d).toHaveLength(1);
    expect(d[0].motivo).toBe("tema_inventado");
    expect(d[0].categoria).toBe("tema");
    expect(v.valido).toBe(false);
    expect(v.estado).toBe("desviaciones");
  });

  it("el reporte dice qué elemento, en qué diapositiva y contra qué se comparó", () => {
    const v = validarPresentacionOficial(
      deck(
        portada("Toxicidad y otros peligros"),
        { titulo: "Peligro de incendio" },
        {
          titulo: "Astrología náutica predictiva",
          bloques: [{ tipo: "bullets", items: ["Signos y derrota"] }],
        },
      ),
      fuente,
    );
    const d = duras(v)[0];
    expect(d.elemento).toBe("Astrología náutica predictiva");
    expect(d.diapositiva).toBe(2);
    expect(d.tituloDiapositiva).toBe("Astrología náutica predictiva");
    expect(d.ubicacion).toBe("titulo");
    // comparadoCon es null cuando NADA del programa se le parece: es el peor
    // caso posible, no un dato que falte.
    expect(d.comparadoCon).toBeNull();
    expect(d.similitud).toBeLessThan(UMBRAL_SOSPECHA);
    expect(resumirVeredicto(v)).toContain("diapositiva 3");
  });

  it("caza también lo PLAUSIBLE: un tema náutico real pero ajeno a esta materia", () => {
    // El riesgo verdadero no es "criptomonedas": es un tema que suena a náutica
    // y que un lector no experto daría por bueno proyectado en pantalla.
    const v = validarPresentacionOficial(
      deck(
        portada("Toxicidad y otros peligros"),
        { titulo: "Peligro de radioactividad" }, // sí es del programa
        { titulo: "Estabilidad transversal y altura metacéntrica" },
        { titulo: "Uso del sextante en navegación astronómica" },
      ),
      fuente,
    );
    expect(duras(v).map((d) => d.elemento)).toEqual([
      "Estabilidad transversal y altura metacéntrica",
      "Uso del sextante en navegación astronómica",
    ]);
  });

  it("una rama inventada de la agenda (mapa conceptual) también se caza", () => {
    const v = validarPresentacionOficial(
      deck(
        portada("Toxicidad y otros peligros"),
        {
          titulo: "Agenda",
          bloques: [
            {
              tipo: "mapaConceptual",
              centro: "Toxicidad y otros peligros",
              ramas: [
                { titulo: "Peligro de incendio" },
                { titulo: "Diseño de menús gastronómicos" },
              ],
            },
          ],
        },
      ),
      fuente,
    );
    const d = duras(v);
    expect(d).toHaveLength(1);
    expect(d[0].elemento).toBe("Diseño de menús gastronómicos");
    expect(d[0].ubicacion).toMatch(/mapaConceptual|ramas\[1\]/);
  });

  it("un tema oficial de OTRA unidad es blando, no bloquea (está mal colocado, no inventado)", () => {
    const v = validarPresentacionOficial(
      deck(
        portada("Toxicidad y otros peligros"),
        { titulo: "Peligro de incendio" },
        { titulo: "Prevención de la contaminación marina" }, // unidad 6
      ),
      fuente,
    );
    expect(duras(v)).toEqual([]);
    expect(v.valido).toBe(true);
    expect(v.estado).toBe("revisar");
    expect(v.desviaciones.map((x) => x.motivo)).toContain(
      "tema_fuera_de_la_unidad",
    );
  });
});

/* ---------------------------- Unidad inventada ---------------------------- */

describe("unidad inventada", () => {
  it("anunciar una unidad que el programa no tiene es DURO", () => {
    const v = validarPresentacionOficial(
      deck(
        portada("Buques tanque"),
        { titulo: "Unidad 47: Propulsión nuclear", subtitulo: "Unidad 47" },
      ),
      fuenteDesdePrograma(BUQUES_TANQUE),
    );
    const u = v.desviaciones.filter((d) => d.categoria === "unidad");
    expect(u.length).toBeGreaterThan(0);
    expect(u[0].severidad).toBe("dura");
    expect(u[0].motivo).toBe("unidad_inexistente");
    expect(u[0].comparadoCon).toMatch(/Unidades del programa/);
    expect(v.valido).toBe(false);
  });

  it("una unidad que sí existe no se reporta", () => {
    const v = validarPresentacionOficial(
      deck({ titulo: "Unidad 3: Toxicidad y otros peligros" }),
      fuenteDesdePrograma(BUQUES_TANQUE, 3),
    );
    expect(v.desviaciones.filter((d) => d.categoria === "unidad")).toEqual([]);
  });
});

/* --------------------------- Objetivo inventado --------------------------- */

describe("objetivo inventado", () => {
  it("un objetivo ajeno al programa es DURO", () => {
    const v = validarPresentacionOficial(
      deck(
        portada("Convenios de la OMI"),
        {
          titulo: "Objetivos de la unidad",
          bloques: [
            {
              tipo: "bullets",
              items: [
                "Diseñar campañas publicitarias para agencias de viajes de lujo",
              ],
            },
          ],
        },
      ),
      fuenteDesdePrograma(CONVENIOS, 1),
    );
    const d = duras(v);
    expect(d).toHaveLength(1);
    expect(d[0].categoria).toBe("objetivo");
    expect(d[0].motivo).toBe("objetivo_inventado");
    expect(v.valido).toBe(false);
  });

  it("el objetivo general oficial, reformulado y acortado, NO se marca", () => {
    // Se recorta el objetivo oficial a su primera oración: reformular/acortar
    // es exactamente la variación admisible que el validador debe tolerar.
    const acortado = CONVENIOS.objetivoGeneral.split(",")[0];
    expect(acortado.length).toBeLessThan(CONVENIOS.objetivoGeneral.length);
    const v = validarPresentacionOficial(
      deck(
        portada("Convenios de la OMI"),
        {
          titulo: "Objetivos de la unidad",
          bloques: [{ tipo: "bullets", items: [acortado] }],
        },
      ),
      fuenteDesdePrograma(CONVENIOS, 1),
    );
    expect(v.desviaciones.filter((d) => d.categoria === "objetivo")).toEqual([]);
  });

  it("si el programa no registra objetivos ('Pendiente de revisión'), avisa una vez y NO inventa un veredicto duro", () => {
    // Buques tanque tiene objetivoGeneral y objetivoEspecífico "Pendiente de
    // revisión": no hay contra qué medir. Ni pasa en silencio ni bloquea.
    const v = validarPresentacionOficial(
      deck({
        titulo: "Objetivos",
        bloques: [
          { tipo: "bullets", items: ["Identificar los efectos de la toxicidad", "Reconocer los peligros de la carga"] },
        ],
      }),
      fuenteDesdePrograma(BUQUES_TANQUE, 3),
    );
    const obj = v.desviaciones.filter((d) => d.categoria === "objetivo");
    expect(obj).toHaveLength(1);
    expect(obj[0].motivo).toBe("sin_objetivos_oficiales");
    expect(obj[0].severidad).toBe("blanda");
    expect(duras(v)).toEqual([]);
  });
});

/* --------------------------- Bibliografía ajena --------------------------- */

describe("bibliografía", () => {
  const fuente = fuenteDesdePrograma(CARGA_Y_ESTIBA, 1);

  it("una fuente que no está en el programa es DURA", () => {
    const v = validarPresentacionOficial(
      deck({
        titulo: "Bibliografía",
        bloques: [
          {
            tipo: "bullets",
            items: [
              "Hawking, S. (1988). Breve historia del tiempo. Bantam Books.",
            ],
          },
        ],
      }),
      fuente,
    );
    const d = duras(v);
    expect(d).toHaveLength(1);
    expect(d[0].categoria).toBe("bibliografia");
    expect(d[0].motivo).toBe("bibliografia_ajena");
    expect(v.valido).toBe(false);
  });

  it("la bibliografía oficial del programa NO se marca", () => {
    const v = validarPresentacionOficial(
      deck({
        titulo: "Fuentes de consulta",
        bloques: [{ tipo: "bullets", items: [CARGA_Y_ESTIBA.bibliografia[0]] }],
      }),
      fuente,
    );
    expect(v.desviaciones.filter((d) => d.categoria === "bibliografia")).toEqual(
      [],
    );
  });

  it("caza una cita colada en una diapositiva que no se llama 'Bibliografía'", () => {
    const v = validarPresentacionOficial(
      deck({
        titulo: "Tipos de contenedores y sus etiquetas de identificación",
        bloques: [
          {
            tipo: "nota",
            texto: "Ver Melville, H. (1851). Moby Dick. Harper & Brothers.",
          },
        ],
      }),
      fuenteDesdePrograma(CARGA_Y_ESTIBA, 10),
    );
    const bib = v.desviaciones.filter((d) => d.categoria === "bibliografia");
    expect(bib).toHaveLength(1);
    expect(bib[0].severidad).toBe("dura");
  });

  it("si el programa no registra bibliografía, la cita queda como no verificable (blanda), no como válida", () => {
    expect(BUQUES_TANQUE.bibliografia).toEqual([]);
    const v = validarPresentacionOficial(
      deck({
        titulo: "Bibliografía",
        bloques: [{ tipo: "bullets", items: ["ISGOTT, 6.ª edición (2020)."] }],
      }),
      fuenteDesdePrograma(BUQUES_TANQUE, 3),
    );
    const bib = v.desviaciones.filter((d) => d.categoria === "bibliografia");
    expect(bib).toHaveLength(1);
    expect(bib[0].motivo).toBe("bibliografia_no_verificable");
    expect(bib[0].severidad).toBe("blanda");
    expect(v.valido).toBe(true);
    expect(v.estado).toBe("revisar");
  });
});

/* --------------------------------- Inglés --------------------------------- */

describe("inglés — dosificación almacenada (niveles 1-3)", () => {
  const fuente = fuenteDesdeNivelIngles("1");

  it("hay fuente oficial y describe el libro real del nivel", () => {
    expect(fuente.ok).toBe(true);
    if (fuente.ok) expect(fuente.corpus.descripcion).toMatch(/StartUp/i);
  });

  it("un deck English-only sobre la dosificación real NO se marca en duro", () => {
    const v = validarPresentacionOficial(
      deck(
        portada("Unit 1: Verb to be"),
        {
          titulo: "Meet and greet",
          bloques: [
            {
              tipo: "mapaConceptual",
              centro: "Verb to be",
              ramas: [
                { titulo: "Occupations" },
                { titulo: "Countries and nationalities" },
                { titulo: "Maritime alphabet and numbers" },
              ],
            },
          ],
        },
        { titulo: "Parts of a ship: external structural parts" },
        { titulo: "PRACTICE", bloques: [{ tipo: "ejercicio", items: ["Spell the call sign"] }] },
        cierre(),
      ),
      fuente,
    );
    expect(duras(v)).toEqual([]);
    expect(v.valido).toBe(true);
  });

  it("un módulo inventado sí se marca en duro", () => {
    const v = validarPresentacionOficial(
      deck(
        portada("Unit 1: Verb to be"),
        { titulo: "Advanced derivatives trading vocabulary" },
      ),
      fuente,
    );
    const d = duras(v);
    expect(d).toHaveLength(1);
    expect(d[0].motivo).toBe("tema_inventado");
  });
});

describe("inglés — temario oficial por módulos (nivel 8)", () => {
  const fuente = fuenteDesdeNivelIngles("8");

  it("hay temario oficial y cita el libro iDiscover 8", () => {
    expect(fuente.ok).toBe(true);
    if (fuente.ok) expect(fuente.corpus.descripcion).toMatch(/iDiscover 8/);
  });

  it("los contenidos del temario NO se marcan", () => {
    const v = validarPresentacionOficial(
      deck(
        portada("Extreme facts"),
        {
          titulo: "Future tenses",
          bloques: [
            { tipo: "tabla", headers: ["Form", "Use"], filas: [["will + verb", "predictions"]] },
          ],
        },
        { titulo: "Extreme Sports" },
        { titulo: "GRAMMAR PRACTICE", bloques: [{ tipo: "ejercicio", items: ["Complete"] }] },
        cierre(),
      ),
      fuente,
    );
    expect(duras(v)).toEqual([]);
  });

  it("un tema fuera del temario del libro se marca", () => {
    const v = validarPresentacionOficial(
      deck(portada("Extreme facts"), { titulo: "Mortgage refinancing paperwork" }),
      fuente,
    );
    expect(duras(v)).toHaveLength(1);
  });
});

describe("inglés — nivel sin fuente estructurada", () => {
  it("un nivel que solo se espeja de históricas (5) NO es válido por defecto", () => {
    const f = fuenteDesdeNivelIngles("5");
    expect(f.ok).toBe(false);
    const v = validarPresentacionOficial(deck(portada("Level 5")), f);
    expect(v.estado).toBe("sin_fuente");
    expect(v.valido).toBe(false);
  });
});

/* -------------------- Contraprueba: el generador SIN IA -------------------- */
//
// La prueba de falsos positivos más dura que existe en el repo: el generador
// determinista `construirPresentacionV2` construye las diapositivas a partir
// del temario verbatim del PDF, así que por definición NO inventa nada. Si el
// validador marcara una sola de sus diapositivas como tema inventado, el
// validador estaría roto — y al cablearlo en la ruta bloquearía trabajo legítimo.
// Se recorre el catálogo PN entero: ~cientos de unidades reales.

describe("contraprueba contra el generador determinista (sin IA)", () => {
  it("ninguna presentación construida del PDF oficial produce desviaciones duras", () => {
    const fallos: string[] = [];
    let comprobadas = 0;

    for (const [nombre, programa] of Object.entries(contenidosMaterias)) {
      for (const unidad of programa.unidades) {
        const pres = construirPresentacionV2({
          programa,
          carrera: "Licenciatura en Piloto Naval",
          semestre: "VII Semestre",
          unidadNumero: unidad.numero,
        });
        if (!pres) continue;
        comprobadas++;
        const v = validarPresentacionOficial(
          pres,
          fuenteDesdePrograma(programa, unidad.numero),
        );
        for (const d of duras(v))
          fallos.push(`${nombre} U${unidad.numero}: ${d.motivo} · "${d.elemento}"`);
      }
    }

    expect(comprobadas).toBeGreaterThan(100);
    expect(fallos).toEqual([]);
  });
});

/* ------------------------------ Extracción -------------------------------- */

describe("extracción de afirmaciones", () => {
  it("tolera JSON crudo del modelo (campos ausentes o del tipo equivocado)", () => {
    expect(() => extraerAfirmaciones(null)).not.toThrow();
    expect(extraerAfirmaciones({ diapositivas: "no es un arreglo" })).toEqual([]);
    expect(
      extraerAfirmaciones({
        diapositivas: [{ titulo: 42, bloques: [{ tipo: "bullets", items: [7, null] }] }],
      }),
    ).toEqual([]);
  });

  it("no confunde el desarrollo (definiciones, ejemplos) con temario declarado", () => {
    const afirmaciones = extraerAfirmaciones(
      deck({
        titulo: "Peligro de incendio",
        bloques: [
          { tipo: "definicion", titulo: "Punto de inflamación", texto: "…" },
          { tipo: "ejemplo", enunciado: "Caso del tanque 3", pasos: ["…"] },
        ],
      }),
    );
    expect(afirmaciones.map((a) => a.texto)).toEqual(["Peligro de incendio"]);
  });

  it("la portada y el cierre no cuentan como temario declarado", () => {
    expect(
      extraerAfirmaciones(deck(portada("Un título cualquiera"), cierre())),
    ).toEqual([]);
  });
});
