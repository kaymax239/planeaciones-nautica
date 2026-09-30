// Mapea la planeación de Inglés (JSON de /api/planeacion-ingles) a los datos que
// espera la MISMA plantilla institucional F-32 (public/templates/F-32.docx) que
// usan PN/MN. No define una plantilla nueva ni un generador nuevo: solo traduce
// el contenido de Inglés a los placeholders existentes de F-32.
//
// Plantilla JS (no TS) a propósito: así la importan sin duplicar tanto la UI
// (TS, allowJs) como el script de Node (.mjs). No toca el flujo PN/MN.
//
// Placeholders reales de F-32.docx (D7):
//   {escuela}{escuelaNautica}{licenciatura}{periodo}{asignatura}{clave}
//   {claveAsignatura}{claveAsignaturaCurso}{cadetes}{numeroCadetes}
//   {docente}{nombreDocente}{grupo}{grupoAsignatura}{fecha}{fechaInicio}
//   {horasTotales}{horasTeoricas}{horasPracticas}{horasIndependientes}{creditos}
//   {horasPorSemana}{horasSemana}{horasXSemana}
//   {objetivoGeneral}{fuentes}
//   {#unidadBloques}{unidad}{objetivoEspecifico}{estrategia}
//     {#semanas}{semana}{tema}{secuencia}{recursos}{producto}{evaluacion}{/semanas}
//   {/unidadBloques}
//   {fechaParcial1}{fechaParcial2}{pctConocimiento}{pctActividades}{pctParticipacion}
//
// La lista se comprueba contra el objeto que devuelve construirDatosF32DesdeIngles:
// toda clave emitida aparece aquí, y `evaluacion` es la que faltaba (se produce
// por semana; ver `evaluacionSesion`). Los alias (claveAsignatura/
// claveAsignaturaCurso, docente/nombreDocente, horasSemana/horasXSemana…) existen
// porque la plantilla institucional no usa un nombre único para el mismo dato.

/** Une una lista de strings en viñetas separadas por salto de línea. */
function vinetas(lista) {
  if (!Array.isArray(lista)) return "";
  const items = lista.filter((x) => typeof x === "string" && x.trim());
  return items.map((x) => `• ${x.trim()}`).join("\n");
}

function texto(v) {
  return typeof v === "string" ? v : "";
}

/* ------------------------------------------------------ bibliografía (D1) --
 *
 * Qué libro usa cada nivel. Es un dato INSTITUCIONAL, no una preferencia del
 * generador: los niveles 1-3 cambiaron a StartUp (Pearson) y los 4-8 siguen en
 * iDiscover (Express Publishing).
 *
 * Existe porque el fallback anterior estampaba iDiscover para CUALQUIER nivel:
 * si la planeación llegaba sin bibliografía, un F-32 del nivel 3 salía firmado
 * con el libro del que ese nivel se está saliendo, y sin ninguna señal de que
 * algo hubiera fallado (ver D1 en DEUDA-TECNICA-INGLES.md, y el .docx
 * F32_INGLES_NIVEL3_VERIF donde eso ya ocurrió de verdad).
 *
 * Un nivel que no esté en esta tabla NO hereda el libro de otro: ver
 * `avisoSinBibliografia`.
 */
const LIBRO_POR_NIVEL = {
  "1": "startup",
  "2": "startup",
  "3": "startup",
  "4": "idiscover",
  "5": "idiscover",
  "6": "idiscover",
  "7": "idiscover",
  "8": "idiscover",
  // VII semestre (Inglés Marítimo VII / Maritime English 1). Guía institucional:
  // planeación de Lic. Lorenzo F. Marsili, Ago–Dic 2026, igual para todos los VII.
  MN1: "merchantnavy",
};

/** Referencias del VII semestre (tal como las usa la planeación guía). */
function refsMerchantNavy() {
  return [
    "Nisbet, A., Whitcher, A. & Logie, C. (1997). Marlins English for Seafarers Study Pack 1. Marlins. Edinburgh, UK.",
    "Evans, V., & Dooley, J. (2015). Career Paths: Merchant Navy (Book 1). Express Publishing.",
  ];
}

/** Referencia iDiscover del nivel. `n` ya viene normalizado (string, trim). */
function refIDiscover(n) {
  return n
    ? `I Discover ${n} Student book & Workbook (2013), Evans, Dooley. Express Publishing.`
    : "I Discover Student book & Workbook (2013), Evans, Dooley. Express Publishing.";
}

// Las tres referencias de StartUp del nivel.
//
// Duplican, a propósito, las de `bibliografiaStartUp` en
// app/data/inglesMaritimo.ts. No se importan de allí porque este módulo es .js
// deliberadamente (lo carga node directo en scripts/*.mjs, donde un import de
// un .ts no resuelve). Si una de las dos cambia, la otra tiene que cambiar:
// scripts/verificar-no-regresion-ingles.mjs (bloque B1) fija el texto del lado
// de los datos, que es el que de verdad se imprime; esto es solo la red.
function refsStartUp(n) {
  return [
    `Pearson Education. (2019). StartUp Level ${n} Student Book. Pearson Education.`,
    `Pearson Education. (2019). StartUp Level ${n} Teacher's Edition. Pearson Education.`,
    `Pearson Education. (2019). StartUp Level ${n} Workbook. Pearson Education.`,
  ];
}

/**
 * Bibliografía institucional que le corresponde AL NIVEL, como lista.
 * Devuelve `[]` para un nivel desconocido o ausente: eso NO es un hueco que
 * rellenar con un valor plausible, es la señal de que no hay dato.
 *
 * @param {string|number} nivel
 * @returns {string[]}
 */
export function bibliografiaDeNivel(nivel) {
  const n = String(nivel == null ? "" : nivel).trim();
  const libro = LIBRO_POR_NIVEL[n];
  if (!libro) return [];
  if (libro === "merchantnavy") return refsMerchantNavy();
  return libro === "startup" ? refsStartUp(n) : [refIDiscover(n)];
}

/**
 * Enfoque de respaldo para la celda ESTRATEGIA, cuando la planeación no trae ni
 * `enfoque` ni `objetivoGeneral`. Mismo fallo de clase que D1: el texto fijo
 * anterior nombraba iDiscover para cualquier nivel.
 *
 * Aquí no hace falta aviso ni bloqueo: si el nivel no tiene libro registrado se
 * devuelve una frase que NO nombra libro alguno. Una estrategia genérica es una
 * omisión; una estrategia que nombra el libro equivocado es un dato falso.
 */
function enfoquePorDefectoDeNivel(nivel) {
  const libro = LIBRO_POR_NIVEL[String(nivel == null ? "" : nivel).trim()];
  if (libro === "idiscover") {
    return "Enfoque iDiscover; aprendizaje activo y contextualizado del inglés.";
  }
  if (libro === "merchantnavy") {
    return "Enfoque de inglés marítimo (Marlins / Career Paths Merchant Navy); aprendizaje activo y situado a bordo.";
  }
  if (libro === "startup") {
    return "Enfoque StartUp (Pearson); aprendizaje activo y contextualizado del inglés.";
  }
  return "Aprendizaje activo y contextualizado del inglés.";
}

/**
 * Texto que ocupa la celda FUENTES cuando no hay bibliografía ni en la
 * planeación ni en la tabla del nivel.
 *
 * Se deja CONSTANCIA en el documento en vez de lanzar una excepción. El
 * criterio: esto corre en el último paso del flujo (doc.render, ya en el
 * navegador, sobre una planeación que costó una llamada al modelo). Lanzar
 * dejaría al docente sin documento y con un error genérico, y el incentivo
 * inmediato sería reintentar hasta que "saliera" — no completar el dato. Un
 * F-32 con esta celda es imposible de entregar sin verla: dice a quién le toca
 * completarla y prohíbe firmarlo. Lo que NUNCA vuelve a pasar es lo de D1:
 * imprimir una referencia plausible y equivocada, que sí se firma sin mirar.
 */
function avisoSinBibliografia(nivel) {
  const n = String(nivel == null ? "" : nivel).trim();
  const causa = n
    ? `no hay bibliografía registrada para el nivel ${n}`
    : "la planeación no indica de qué nivel es, así que no se puede determinar el libro";
  return (
    `*** FALTA LA BIBLIOGRAFÍA: ${causa}. ` +
    "Captúrala aquí con el libro vigente ANTES de firmar o entregar este F-32. " +
    "No se rellena automáticamente para no imprimir un libro equivocado. ***"
  );
}

/** Deja rastro fuera del documento, para que el fallo también sea diagnosticable. */
function avisar(mensaje) {
  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn(`[F-32 Inglés] ${mensaje}`);
  }
}

/**
 * Bibliografía institucional del libro iDiscover para el nivel dado.
 *
 * @deprecated Usa `bibliografiaDeNivel(nivel)`. Esta función NO discrimina
 * nivel: le devuelve iDiscover a cualquiera, incluidos 1/2/3, que son de
 * StartUp (Pearson), y sin nivel devuelve la referencia SIN número — el fallo
 * silencioso que documenta D1.
 *
 * Ya no la consume nada de `app/`. Las dos rutas que la importaban
 * (`planeacion-ingles` y `presentacion-ingles`) pasaron a `bibliografiaDeNivel`
 * en `61a5f9e`; para los niveles 4-8 el resultado es idéntico, así que el
 * cambio no alteró su prompt. Hoy sus únicos consumidores son
 * `tests/libro-por-nivel.test.ts` y el verificador, que fijan su texto para que
 * un borrado accidental no pase inadvertido.
 *
 * Se conserva por eso, y porque es la referencia contra la que se compara el
 * comportamiento histórico. Si se elimina, caen esas comprobaciones a propósito.
 */
export function bibliografiaIDiscover(nivel) {
  return refIDiscover(String(nivel || "").trim());
}

/**
 * Construye el objeto de render para F-32.docx a partir de la planeación de
 * Inglés y unos metadatos de portada/evaluación.
 *
 * @param {object} planeacion  JSON devuelto por /api/planeacion-ingles
 * @param {object} [meta]      { nivel, grupo, docente, cadetes, periodo, clave,
 *                               fechaParcial1, fechaParcial2,
 *                               pctConocimiento, pctActividades, pctParticipacion }
 */
export function construirDatosF32DesdeIngles(planeacion, meta = {}) {
  const p = planeacion || {};
  const nivel = texto(meta.nivel) || texto(p.nivel);

  // Texto de evaluación por sesión: instrumentos de la rúbrica del JSON (mismos
  // para todas las semanas) o un texto estándar si no hay rúbrica.
  const instrumentos = Array.isArray(p.evaluacion)
    ? p.evaluacion.map((e) => texto(e && e.instrumento)).filter(Boolean)
    : [];
  const evaluacionSesion = instrumentos.length
    ? instrumentos.join("; ")
    : "Participación, evidencias y productos de la sesión.";

  const secuencia = Array.isArray(p.secuenciaSemanal) ? p.secuenciaSemanal : [];
  const semanas = secuencia.map((s, i) => ({
    semana: `Semana ${s && s.semana != null ? s.semana : i + 1}`,
    tema: texto(s && s.contenido),
    secuencia: vinetas(s && s.actividades),
    recursos: Array.isArray(s && s.recursos)
      ? s.recursos.filter((x) => typeof x === "string").join(", ")
      : "",
    // En F-32 "producto" es la evidencia de la sesión.
    producto: texto(s && s.evidencias),
    // Columna de evaluación por sesión (PN/MN también la llena).
    evaluacion: evaluacionSesion,
  }));

  // Bibliografía/fuentes (D1). Tres orígenes, en este orden:
  //
  //  1. La del JSON, salvo que esté vacía o sea el texto genérico
  //     "No especificada…". Nunca se muestra "No especificada".
  //  2. La que le corresponde AL NIVEL (`bibliografiaDeNivel`). Deriva del
  //     nivel, así que ningún nivel puede heredar el libro de otro.
  //  3. Si el nivel no está en la tabla —o no llegó nivel— NO se rellena: la
  //     celda lleva un aviso que impide firmar el documento a ciegas.
  const bibJSON = Array.isArray(p.bibliografia)
    ? p.bibliografia.filter((x) => typeof x === "string" && x.trim())
    : [];
  const bibValida = bibJSON.filter((x) => !/no\s+especificad/i.test(x));
  let fuentes;
  if (bibValida.length) {
    fuentes = bibValida.join("\n");
  } else {
    const bibNivel = bibliografiaDeNivel(nivel);
    if (bibNivel.length) {
      fuentes = bibNivel.join("\n");
      avisar(
        `la planeación no traía bibliografía; se usó la del nivel ${nivel}. ` +
          "Revisa la celda FUENTES antes de entregar.",
      );
    } else {
      fuentes = avisoSinBibliografia(nivel);
      avisar(
        `sin bibliografía y sin libro registrado para el nivel "${nivel}": ` +
          "el F-32 sale con la celda FUENTES marcada como pendiente.",
      );
    }
  }

  // Estrategia de la unidad: enfoque de la planeación + objetivo general.
  const estrategiaPartes = [texto(p.enfoque), texto(p.objetivoGeneral)].filter(
    Boolean,
  );

  const asignatura =
    texto(p.asignatura) || (nivel ? `Inglés Nivel ${nivel}` : "Inglés");
  const clave = texto(meta.clave) || (nivel ? `INGLES-N${nivel}` : "INGLES");
  const grupo = texto(meta.grupo) || texto(p.grupo);
  const docente = texto(meta.docente);
  const cadetes = texto(meta.cadetes);
  const fechaInicio = texto(meta.fechaInicio);
  const objetivoGeneral = texto(p.objetivoGeneral);

  // Horas. Dos orígenes, en este orden de prioridad:
  //
  //  1. Lo que teclee el docente en el formulario. Siempre manda.
  //  2. Las horas oficiales del nivel, si la planeación las trae (`p.horas`) o
  //     si llegan en el meta (`meta.horas`). Solo los niveles almacenados
  //     (1/2/3) las tienen; los niveles 4-8 se generan desde las históricas y
  //     nunca traen `horas`, así que caen al cálculo de siempre.
  //
  // El total almacenado se usa TAL CUAL, no se recalcula: 112 no es 7×18=126,
  // y `teoricas` (32) no es derivable de las horas por semana.
  const horas = p.horas || meta.horas || null;
  const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0);

  const hpwForm = Number(meta.horasPorSemana) || 0;
  const hpw = hpwForm || (horas ? num(horas.porSemana) : 0);
  const sem = Number(meta.semanas) || semanas.length || 0;
  const totalCalculado = hpw && sem ? hpw * sem : 0;

  // total/teóricas/prácticas/independientes son UNA descomposición: 112 = 32+80.
  // Si el docente CAMBIA las horas/semana, el total se recalcula desde su dato
  // y el grupo entero vuelve al cálculo histórico; mezclar un total de 54 con
  // 80 horas prácticas imprimiría un encabezado que se contradice.
  //
  // El formulario viene precargado con la cifra oficial del nivel, así que
  // recibirla NO es un override: solo cuenta como tal un valor DISTINTO. Sin
  // esto, dejar el 7 precargado daría 7×18=126 en vez de las 112 oficiales.
  const oficiales =
    !!horas && (!hpwForm || hpwForm === num(horas.porSemana));
  const total = oficiales ? num(horas.total) || totalCalculado : totalCalculado;
  const teoricas = oficiales ? num(horas.teoricas) : total;
  const practicas = oficiales ? num(horas.practicas) : 0;
  const independientes = oficiales ? num(horas.independientes) : 0;

  // Los créditos no dependen del horario: son constante de la asignatura, así
  // que sobreviven aunque el docente ajuste las horas por semana.
  const creditos = horas ? num(horas.creditos) : 0;

  const hStr = (n) => (n ? String(n) : "");

  // Mismo conjunto de campos que pasa el flujo PN/MN (page.tsx -> doc.render),
  // para que la plantilla F-32 se rellene sin dejar placeholders en "undefined".
  return {
    escuela: texto(meta.escuela) || "Tampico",
    licenciatura: texto(meta.licenciatura) || "Inglés",
    periodo: texto(meta.periodo),
    escuelaNautica:
      texto(meta.escuelaNautica) ||
      'Escuela Náutica Mercante de Tampico "Cap. de Altura Luis Gonzaga Priego González"',

    asignatura,
    clave,
    claveAsignatura: clave,
    claveAsignaturaCurso: clave,

    horasTotales: hStr(total),
    horasTeoricas: hStr(teoricas),

    // Sin horas almacenadas (niveles 4-8) se conserva LO QUE HOY SE IMPRIME,
    // no lo que hoy se emite: "0" en prácticas, que la plantilla ya pinta, y
    // vacío en independientes y créditos, cuyas celdas salen hoy en blanco
    // porque hasta ahora no tenían placeholder. Emitir "0" ahí haría aparecer
    // un cero nuevo en el F-32 de los niveles 4-8.
    horasPracticas: oficiales ? hStr(practicas) : "0",
    horasIndependientes: oficiales ? hStr(independientes) : "",
    creditos: hStr(creditos),

    horasPorSemana: hStr(hpw),
    horasSemana: hStr(hpw),
    horasXSemana: hStr(hpw),

    objetivoGeneral,
    fuentes,
    unidadBloques: [
      {
        unidad: "I",
        objetivoEspecifico: objetivoGeneral,
        estrategia:
          estrategiaPartes.join("\n\n") || enfoquePorDefectoDeNivel(nivel),
        semanas,
      },
    ],

    docente,
    nombreDocente: docente,
    grupo,
    grupoAsignatura: grupo,
    cadetes,
    numeroCadetes: cadetes,
    fechaInicio,
    fecha: fechaInicio,

    // Hoja de evaluación: opcional para Inglés (la rúbrica real va en el JSON).
    fechaParcial1: texto(meta.fechaParcial1),
    fechaParcial2: texto(meta.fechaParcial2),
    pctConocimiento: texto(meta.pctConocimiento),
    pctActividades: texto(meta.pctActividades),
    pctParticipacion: texto(meta.pctParticipacion),
  };
}
