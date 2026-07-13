"use client";

import { useEffect, useState } from "react";
import { materiasPorSemestre, materiasPorSemestreMN } from "./data/materias";
import {
  contenidosMaterias,
  contenidosMateriasMN,
} from "./data/contenidosMaterias";
import {
  distribuirFechas,
  etiquetaSemanaF32,
  EXAMENES,
  formatearRango,
} from "./data/calendario";
import {
  criteriosEvaluacion,
  generacionPorSemestre,
  textoPonderacionEvaluacion,
  textoPuntuacionesF32,
  tipoMateriaDesdePrograma,
} from "./data/evaluacion";
import { distribuirPrograma } from "./data/distribucion";
import { esProgramaOficial } from "./data/tipos";
// V1 conservada como respaldo en ./data/presentaciones/algebra-u1.ts y ./lib/pptxOficial.ts.
// El botón usa la versión visual V2, resuelta bajo demanda desde el registro.
import { obtenerPresentacion } from "./data/presentaciones/registro";
import { generarPresentacionOficialV2 } from "./lib/pptxOficialV2";
import {
  construirPresentacionV2,
  TEMA_UNIDAD_COMPLETA,
} from "./lib/construirPresentacionV2";
import type { PresentacionV2 } from "./data/presentaciones/tiposV2";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { SeccionIngles } from "./components/SeccionIngles";
import { Monograma } from "./components/Monograma";
import { Stepper, type PasoStepper } from "./components/Stepper";
import { LoadingIA } from "./components/LoadingIA";
import { LoginScreen } from "./components/LoginScreen";
import { useAuth } from "./lib/authContext";
import { construirDatosAvanceF51, periodoDesdeSemanas } from "./lib/avanceF51";
import { construirDatosExamen, semanasDesdePrograma } from "./lib/examen";
import { pedirPreguntasExamenIA } from "./lib/pedirPreguntasExamen";
import { totalExamenDesdeEsquema, resolverPuntaje } from "./lib/puntajeExamen";

type SemanaMateria = {
  semana: string;
  tema: string;
};

type DatosMateria = {
  unidad?: string;
  objetivoGeneral?: string;
  objetivoEspecifico?: string;
  estrategia?: string;
  fuentes?: string;
  semanas?: SemanaMateria[];
};

type RangoSemanas = {
  inicio: number;
  fin: number;
};

const limpiarTema = (tema: string) => tema.trim().replace(/\.$/, "");

const nombreArchivoSeguro = (valor: string) =>
  valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const contieneAlgunaPalabra = (texto: string, palabras: string[]) => {
  const textoNormalizado = texto.toLowerCase();

  return palabras.some((palabra) => textoNormalizado.includes(palabra));
};

const obtenerContextoDidactico = (materia: string, tema: string) => {
  const textoBase = `${materia} ${tema}`;

  if (
    contieneAlgunaPalabra(textoBase, [
      "naveg",
      "marít",
      "maritim",
      "náut",
      "naut",
      "buque",
      "maniobra",
      "cartograf",
      "meteorolog",
      "puerto",
      "portuar",
      "transporte",
      "guardia",
      "radar",
      "ecdis",
      "seguridad",
      "pmr",
    ])
  ) {
    return "el contexto de navegación, operaciones portuarias, seguridad marítima o vida a bordo";
  }

  if (
    contieneAlgunaPalabra(textoBase, [
      "álgebra",
      "algebra",
      "geometr",
      "física",
      "fisica",
      "dinámica",
      "dinamica",
      "química",
      "quimica",
      "electric",
      "electrotecnia",
    ])
  ) {
    return "la solución de problemas técnicos y académicos vinculados con la formación náutica";
  }

  if (
    contieneAlgunaPalabra(textoBase, [
      "inglés",
      "ingles",
      "expresión",
      "expresion",
      "comunicación",
      "comunicacion",
      "liderazgo",
      "derecho",
    ])
  ) {
    return "situaciones profesionales, comunicativas y colaborativas propias del entorno marítimo";
  }

  return "la formación académica y profesional del cadete";
};

const generarSecuenciaDidactica = (
  materia: string,
  semana: SemanaMateria,
  datosMateria?: DatosMateria,
  siguienteTema?: string,
) => {
  const tema = limpiarTema(semana.tema);
  const contexto = obtenerContextoDidactico(materia, tema);
  const objetivo =
    datosMateria?.objetivoEspecifico ||
    datosMateria?.objetivoGeneral ||
    `comprender y aplicar el tema de ${tema} en ${materia}`;
  const estrategia =
    datosMateria?.estrategia ||
    "aprendizaje guiado, práctica supervisada y trabajo colaborativo";
  const enlaceSiguiente = siguienteTema
    ? `Se vincula el aprendizaje con la siguiente sesión sobre ${limpiarTema(
        siguienteTema,
      )}.`
    : "Se integran los aprendizajes de la sesión como base para la evaluación o actividad integradora.";

  return [
    `Inicio: Pregunta detonadora: ¿cómo se relaciona ${tema} con ${contexto}? El docente recupera conocimientos previos mediante preguntas breves, ejemplos cercanos a la experiencia del cadete y una contextualización del tema dentro de ${materia}.`,
    `Desarrollo: Se realiza una explicación guiada de ${tema}, alineada con el propósito de ${objetivo}. Los cadetes desarrollan una actividad práctica basada en ${estrategia}, alternando trabajo individual y colaborativo para resolver ejercicios, analizar casos o elaborar productos aplicados a ${contexto}.`,
    `Cierre: Se socializan resultados y se brinda retroalimentación puntual sobre aciertos, áreas de mejora y criterios de desempeño. La evidencia de aprendizaje será una actividad, ejercicio, reporte breve o participación argumentada relacionada con ${tema}. Cada cadete formula una reflexión final sobre la utilidad del tema. ${enlaceSiguiente}`,
  ].join("\n\n");
};


export default function Home() {
  const { usuario, cargando: cargandoSesion } = useAuth();
  const [carrera, setCarrera] = useState<"PN" | "MN">("PN");
  // Sección activa. "general" = flujo PN/MN actual (sin cambios); "ingles" =
  // sección independiente de Inglés. No afecta al estado `carrera`.
  const [seccion, setSeccion] = useState<"general" | "ingles">("general");
  const [materiaSeleccionada, setMateriaSeleccionada] = useState("");
  const [semestreSeleccionado, setSemestreSeleccionado] = useState("");
  // Presentación PN/MN: unidades marcadas con casillas (multi-selección). Cada
  // unidad marcada se genera COMPLETA y como un PPTX independiente.
  const [unidadesSeleccionadas, setUnidadesSeleccionadas] = useState<number[]>(
    [],
  );

  const [docente, setDocente] = useState("");
  const [grupo, setGrupo] = useState("");
  const [cadetes, setCadetes] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  // Flujo del Avance Programático F-51 (en pasos): "no" oculto; "semanas" elige
  // las semanas; "preview" muestra la vista previa antes de generar el Word.
  const [avancePaso, setAvancePaso] = useState<"no" | "semanas" | "preview">(
    "no",
  );
  const [semanasAvance, setSemanasAvance] = useState<number[]>([]);
  const [generandoPresOficial, setGenerandoPresOficial] = useState(false);
  const [mensajePresOficial, setMensajePresOficial] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);
  const [generandoPlaneacion, setGenerandoPlaneacion] = useState(false);
  const [mensajePlaneacion, setMensajePlaneacion] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);
  const [mensajeExamen, setMensajeExamen] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);
  const [generandoExamen, setGenerandoExamen] = useState(false);
  // Pestaña activa dentro de la materia seleccionada. El formulario de datos
  // generales queda arriba y es común a todas las pestañas.
  const [tabMateria, setTabMateria] = useState<
    "f32" | "f51" | "examenes" | "presentaciones"
  >("f32");

  const periodo = "Julio-Diciembre 2026";
  const escuelaNautica =
    'Escuela Náutica Mercante de Tampico "Cap. de Altura Luis Gonzaga Priego González"';

  const horasPorSemana = "1";
  const horasTotales = "18";
  const horasTeoricas = "18";
  const horasIndependientes = "0";

  const menu = carrera === "MN" ? materiasPorSemestreMN : materiasPorSemestre;
  const fuenteContenidos =
    carrera === "MN" ? contenidosMateriasMN : contenidosMaterias;
  // Horas reales de la materia seleccionada (del programa oficial PDF).
  const horasMateria = fuenteContenidos[materiaSeleccionada]?.horas;

  // Unidades oficiales de la materia (del programa oficial). Fallback: una unidad.
  const programaMateria = fuenteContenidos[materiaSeleccionada];
  const unidadesMateria =
    esProgramaOficial(programaMateria) && programaMateria.unidades.length
      ? programaMateria.unidades.map((u) => ({ numero: u.numero, tema: u.tema }))
      : [{ numero: 1, tema: "Unidad 1" }];

  // El botón se muestra para toda materia con programa oficial.
  const materiaTienePrograma = esProgramaOficial(programaMateria);

  // Semanas disponibles del Avance Programático: cada semana del temario oficial
  // (mismo cálculo que el F-32) con su número, fechas reales y tema derivado
  // AUTOMÁTICAMENTE. Es la lista que el usuario elige en el paso "Seleccionar
  // semanas"; el tema no se captura a mano.
  const semanasDisponibles = esProgramaOficial(programaMateria)
    ? distribuirPrograma(
        programaMateria,
        textoPuntuacionesF32(
          "teorico-practica",
          generacionPorSemestre(semestreSeleccionado),
        ),
      )
        .flatMap((bloque) => bloque.semanas)
        .map((s, i) => ({
          numero: i + 1,
          etiqueta: s.semana,
          tema: s.tema,
        }))
    : [];

  // Al cambiar de materia o carrera, limpiar la selección de unidades de la
  // presentación y los mensajes/estados del flujo.
  useEffect(() => {
    setUnidadesSeleccionadas([]);
    setMensajePresOficial(null);
    setAvancePaso("no");
    setSemanasAvance([]);
    setTabMateria("f32");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaSeleccionada, carrera]);

  const licenciatura =
    carrera === "MN"
      ? "Licenciatura en Maquinista Naval"
      : "Licenciatura en Piloto Naval";

  // "I SEMESTRE" -> "I Semestre" para mostrar en la portada.
  const semestreBonito = semestreSeleccionado
    ? semestreSeleccionado.replace(/\s*SEMESTRE\s*$/i, "").trim() + " Semestre"
    : "";

  const seleccionarCarrera = (c: "PN" | "MN") => {
    setCarrera(c);
    setSemestreSeleccionado("");
    setMateriaSeleccionada("");
  };

  // Pide a la IA (servidor) el guion premium de la unidad/tema. Devuelve la
  // presentación o null si la IA falla o no está configurada (para caer al
  // generador determinista). Nunca lanza: registra el motivo y devuelve null.
  const generarPresentacionConIA = async (
    unidadNumero: number,
    tema: string,
  ): Promise<{
    pres: PresentacionV2;
    cacheado: boolean;
  } | null> => {
    // Límite de espera: si Claude tarda demasiado (timeout / proveedor lento) se
    // aborta la solicitud y se cae al generador determinista, para que la demo
    // nunca se quede colgada esperando a la IA.
    const controlador = new AbortController();
    const limite = setTimeout(() => controlador.abort(), 120000);
    try {
      const res = await fetch("/api/presentacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrera,
          materia: materiaSeleccionada,
          unidadNumero,
          tema,
          carreraDisplay: licenciatura,
          semestreDisplay: semestreBonito,
        }),
        signal: controlador.signal,
      });
      if (!res.ok) {
        const detalle = await res.json().catch(() => null);
        console.warn("IA no disponible, usando generador oficial:", detalle);
        return null;
      }
      const data = (await res.json()) as {
        presentacion?: PresentacionV2;
        cacheado?: boolean;
      };
      return data.presentacion
        ? { pres: data.presentacion, cacheado: !!data.cacheado }
        : null;
    } catch (e) {
      console.warn("Error consultando la IA, usando generador oficial:", e);
      return null;
    } finally {
      clearTimeout(limite);
    }
  };

  // Alterna una unidad en la selección de la presentación (multi-selección).
  const alternarUnidad = (n: number) => {
    setUnidadesSeleccionadas((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n],
    );
  };

  // Genera el PPTX de UNA unidad (completa), con la MISMA prioridad de siempre:
  // premium → IA → generador oficial. No cambia el generador compartido; solo se
  // invoca por unidad. Devuelve el nombre de archivo o null si no se pudo.
  const generarUnaUnidad = async (
    unidadNumero: number,
  ): Promise<string | null> => {
    let pres: PresentacionV2 | null =
      obtenerPresentacion(carrera, materiaSeleccionada, unidadNumero) ?? null;

    if (!pres && esProgramaOficial(programaMateria)) {
      const ia = await generarPresentacionConIA(
        unidadNumero,
        TEMA_UNIDAD_COMPLETA,
      );
      if (ia) pres = ia.pres;
    }

    if (!pres && esProgramaOficial(programaMateria)) {
      pres = construirPresentacionV2({
        programa: programaMateria,
        carrera: licenciatura,
        semestre: semestreBonito,
        unidadNumero,
        tema: TEMA_UNIDAD_COMPLETA,
      });
    }

    if (!pres) return null;

    return generarPresentacionOficialV2(pres, {
      docente,
      grupo,
      periodo,
      escuela: escuelaNautica,
    });
  };

  // Genera un PPTX por cada unidad MARCADA (en orden). Cada unidad va completa y
  // como archivo independiente. No genera nada si no hay casillas marcadas.
  const generarPresentacionUnidad = async () => {
    if (unidadesSeleccionadas.length === 0) return;
    setGenerandoPresOficial(true);
    setMensajePresOficial(null);
    const unidades = [...unidadesSeleccionadas].sort((a, b) => a - b);
    const generadas: string[] = [];
    const fallidas: number[] = [];
    try {
      for (const n of unidades) {
        try {
          const archivo = await generarUnaUnidad(n);
          if (archivo) generadas.push(archivo);
          else fallidas.push(n);
        } catch (error) {
          console.error("Error generando presentación de la unidad", n, error);
          fallidas.push(n);
        }
      }

      if (generadas.length === 0) {
        setMensajePresOficial({
          tipo: "error",
          texto:
            "No se pudo generar la presentación en este momento. Intenta de nuevo o cambia de materia.",
        });
        return;
      }

      const base =
        generadas.length === 1
          ? `Presentación generada y descargada: ${generadas[0]}`
          : `${generadas.length} presentaciones generadas y descargadas.`;
      const aviso =
        fallidas.length > 0
          ? ` No se pudieron generar las unidades: ${fallidas.join(", ")}.`
          : "";
      setMensajePresOficial({ tipo: "exito", texto: base + aviso });
    } finally {
      setGenerandoPresOficial(false);
    }
  };
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#c8a45d] focus:ring-2 focus:ring-[#c8a45d]/30";
  const readOnlyClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm";
  const labelClass =
    "mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#0b1f3a]";
  const semestres = Object.keys(menu);
  const materiasDelSemestre = semestreSeleccionado
    ? menu[semestreSeleccionado as keyof typeof menu] || []
    : [];

  const seleccionarSemestre = (semestre: string) => {
    setSemestreSeleccionado(semestre);
    setMateriaSeleccionada("");
  };

  const regresarASemestres = () => {
    setSemestreSeleccionado("");
    setMateriaSeleccionada("");
  };

  const regresarAMaterias = () => {
    setMateriaSeleccionada("");
  };

  const generarWord = async () => {
    setGenerandoPlaneacion(true);
    setMensajePlaneacion(null);
    try {
      if (!materiaSeleccionada) {
        throw new Error("Selecciona una asignatura antes de generar la planeación.");
      }

      const response = await fetch("/templates/F-32.docx");
      if (!response.ok) {
        throw new Error(
          `No se pudo cargar la plantilla F-32 (HTTP ${response.status}). Verifica que exista en public/templates/F-32.docx.`,
        );
      }
      const content = await response.arrayBuffer();

      const zip = new PizZip(content);

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const datosMateria =
        fuenteContenidos[materiaSeleccionada] as unknown;

      const generacion = generacionPorSemestre(semestreSeleccionado);
      // Tipo REAL de la materia (teórica/práctica; las T-P se resuelven por
      // horas). Para materias legacy sin programa oficial se usa "teorica" como
      // neutro (coincide con el comportamiento previo en 2.º-4.º año).
      const tipoMateria = esProgramaOficial(programaMateria)
        ? tipoMateriaDesdePrograma(programaMateria)
        : "teorica";
      const puntuaciones = textoPuntuacionesF32(tipoMateria, generacion);
      const criterios = criteriosEvaluacion(tipoMateria, generacion);
      const porcentaje = (incluye: string) =>
        String(
          criterios.find((c) => c.nombre.includes(incluye))?.porcentaje ?? "",
        );

      type DatosRender = {
        asignatura: string;
        clave: string;
        claveAsignatura: string;
        claveAsignaturaCurso: string;
        horasTotales: string;
        horasTeoricas: string;
        horasPracticas: string;
        horasIndependientes: string;
        horasPorSemana: string;
        horasSemana: string;
        horasXSemana: string;
        objetivoGeneral: string;
        unidadBloques: unknown;
        fuentes: string;
      };

      let datosRender: DatosRender;

      if (esProgramaOficial(datosMateria)) {
        // FUENTE DE VERDAD: programa oficial PDF (1.er semestre PN).
        const p = datosMateria;
        datosRender = {
          asignatura: p.nombre,
          clave: p.clave,
          claveAsignatura: p.clave,
          claveAsignaturaCurso: p.clave,
          horasTotales: String(p.horas.total),
          horasTeoricas: String(p.horas.teoricas),
          horasPracticas: String(p.horas.practicas),
          horasIndependientes: String(p.horas.independientes),
          horasPorSemana: String(p.horas.porSemana),
          horasSemana: String(p.horas.porSemana),
          horasXSemana: String(p.horas.porSemana),
          objetivoGeneral: p.objetivoGeneral,
          unidadBloques: distribuirPrograma(p, puntuaciones),
          fuentes: p.bibliografia.length
            ? p.bibliografia.join("\n")
            : "Pendiente de revisión.",
        };
      } else {
        // Legacy: contenido genérico (semestres III, V y VII).
        const dm = datosMateria as DatosMateria | undefined;
        const fechasSemanas = distribuirFechas(dm?.semanas?.length || 0);
        const semanas = (dm?.semanas || []).map(
          (s: SemanaMateria, index, semanasMateria) => ({
            semana: fechasSemanas[index]
              ? etiquetaSemanaF32(fechasSemanas[index])
              : s.semana,
            tema: s.tema,
            secuencia: generarSecuenciaDidactica(
              materiaSeleccionada,
              s,
              dm,
              semanasMateria[index + 1]?.tema,
            ),
            recursos:
              "Computadora, presentación, material didáctico y recursos digitales.",
            producto: "Actividad, evidencia y participación.",
            evaluacion: puntuaciones,
          }),
        );
        datosRender = {
          asignatura: materiaSeleccionada,
          clave: materiaSeleccionada,
          claveAsignatura: materiaSeleccionada,
          claveAsignaturaCurso: materiaSeleccionada,
          horasTotales,
          horasTeoricas,
          horasPracticas: "0",
          horasIndependientes,
          horasPorSemana,
          horasSemana: horasPorSemana,
          horasXSemana: horasPorSemana,
          objetivoGeneral:
            dm?.objetivoEspecifico || "Objetivo general de la asignatura.",
          unidadBloques: [
            {
              unidad: dm?.unidad || "I",
              objetivoEspecifico:
                dm?.objetivoEspecifico || "Objetivo específico de la unidad.",
              estrategia:
                dm?.estrategia ||
                "Aprendizaje guiado, explicación docente y actividades colaborativas.",
              semanas,
            },
          ],
          fuentes: "Bibliografía y materiales de consulta.",
        };
      }

      doc.render({
        escuela: "Tampico",
        licenciatura,
        periodo,
        escuelaNautica,
        ...datosRender,
        docente,
        grupo,
        grupoAsignatura: grupo,
        cadetes,
        fechaInicio,
        nombreDocente: docente,
        numeroCadetes: cadetes,
        fecha: fechaInicio,

        // Plan de evaluación (hoja de fechas de exámenes del F-32)
        fechaParcial1: formatearRango(EXAMENES.parcial1),
        fechaParcial2: formatearRango(EXAMENES.parcial2),
        pctConocimiento: porcentaje("Conocimiento"),
        pctActividades: porcentaje("Actividades"),
        pctParticipacion: porcentaje("Participaciones"),
      });

      const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const partesNombre = [semestreSeleccionado, materiaSeleccionada, grupo, periodo]
        .map((parte) => nombreArchivoSeguro(parte || ""))
        .filter(Boolean);
      const nombreArchivo = `F32_${partesNombre.join("_") || "planeacion"}.docx`;

      saveAs(blob, nombreArchivo);

      setMensajePlaneacion({
        tipo: "exito",
        texto: `Planeación generada y descargada: ${nombreArchivo}`,
      });
    } catch (error) {
      console.error("Error generando F-32:", error);
      const detalle =
        error instanceof Error ? error.message : "Error desconocido.";
      setMensajePlaneacion({
        tipo: "error",
        texto: `No se pudo generar la planeación F-32. ${detalle}`,
      });
    } finally {
      setGenerandoPlaneacion(false);
    }
  };

  // Abre el flujo en pasos del Avance Programático (no genera directo).
  const abrirAvance = () => {
    setMensajePlaneacion(null);
    setSemanasAvance([]);
    setAvancePaso("semanas");
  };

  const cerrarAvance = () => {
    setAvancePaso("no");
    setSemanasAvance([]);
  };

  // Marca/desmarca una semana (tope de 4: el F-51 tiene 4 huecos).
  const alternarSemanaAvance = (numero: number) => {
    setSemanasAvance((prev) =>
      prev.includes(numero)
        ? prev.filter((n) => n !== numero)
        : prev.length >= 4
          ? prev
          : [...prev, numero],
    );
  };

  // Genera el F-51 con las semanas seleccionadas. El tema de cada semana se toma
  // AUTOMÁTICAMENTE del programa oficial (sin selección manual de temas) y el
  // periodo se deriva de las semanas elegidas (ya no se usa "Mes reportado").
  const generarAvanceProgramatico = async () => {
    setMensajePlaneacion(null);
    try {
      if (semanasAvance.length === 0) {
        throw new Error("Selecciona al menos una semana.");
      }

      const seleccionadas = semanasDisponibles
        .filter((s) => semanasAvance.includes(s.numero))
        .sort((a, b) => a.numero - b.numero)
        .map((s) => ({ numero: s.numero, tema: s.tema }));

      // Ponderación oficial según tipo REAL de la materia (T-P por horas) y la
      // generación (derivada del semestre). Se inyecta como texto en el F-51.
      const generacionAvance = generacionPorSemestre(semestreSeleccionado);
      const ponderacionAvance = esProgramaOficial(programaMateria)
        ? textoPonderacionEvaluacion(
            tipoMateriaDesdePrograma(programaMateria),
            generacionAvance,
          )
        : "";

      const response = await fetch("/templates/Avance-Programatico-F51.docx");
      if (!response.ok) {
        throw new Error(
          `No se pudo cargar la plantilla F-51 (HTTP ${response.status}).`,
        );
      }
      const content = await response.arrayBuffer();
      const doc = new Docxtemplater(new PizZip(content), {
        paragraphLoop: true,
        linebreaks: true,
      });

      doc.render(
        construirDatosAvanceF51(seleccionadas, {
          asignatura: materiaSeleccionada,
          licenciatura,
          semestre: semestreSeleccionado,
          docente,
          grupo,
          objetivosCompetencias: esProgramaOficial(programaMateria)
            ? programaMateria.objetivoGeneral
            : "",
          ponderacion: ponderacionAvance,
        }),
      );

      const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      saveAs(
        blob,
        `F51_${nombreArchivoSeguro(materiaSeleccionada) || "Avance"}.docx`,
      );

      cerrarAvance();
      setMensajePlaneacion({
        tipo: "exito",
        texto: "Avance Programático F-51 generado y descargado.",
      });
    } catch (error) {
      console.error("Error generando F-51:", error);
      const detalle =
        error instanceof Error ? error.message : "Error desconocido.";
      setMensajePlaneacion({
        tipo: "error",
        texto: `No se pudo generar el Avance Programático F-51. ${detalle}`,
      });
    }
  };

  const generarExamen = async (
    tipo: string,
    templatePath: string,
    rango: RangoSemanas,
  ) => {
    setMensajeExamen(null);
    setGenerandoExamen(true);
    try {
      if (!materiaSeleccionada) {
        throw new Error("Selecciona una asignatura antes de generar el examen.");
      }

      let response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(
          `No se pudo cargar la plantilla (HTTP ${response.status}).`,
        );
      }
      let content = await response.arrayBuffer();
      let zip = new PizZip(content);
      const documentXml = zip.file("word/document.xml")?.asText() || "";

      // Red de seguridad: si la plantilla elegida no tiene placeholders (caso del
      // examen ordinario), usamos la de parcial (que sí los tiene) para que el
      // examen NUNCA se descargue en blanco. El alcance lo define el rango.
      if (!/\{[^{}]+\}/.test(documentXml)) {
        response = await fetch("/templates/examen-parcial.docx");
        if (!response.ok) {
          throw new Error(
            `No se pudo cargar la plantilla de examen (HTTP ${response.status}).`,
          );
        }
        content = await response.arrayBuffer();
        zip = new PizZip(content);
      }

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Las materias con programa oficial no exponen `semanas`; derivamos los
      // subtemas reales para que las preguntas correspondan a la materia.
      const programa = fuenteContenidos[materiaSeleccionada];
      const datosMateria: DatosMateria | undefined = esProgramaOficial(programa)
        ? { semanas: semanasDesdePrograma(programa) }
        : (programa as unknown as DatosMateria | undefined);

      // Ponderación oficial (tipo REAL por horas + generación del semestre). Se
      // inyecta como texto; la plantilla de examen no tiene celda de % propia.
      const ponderacionExamen = esProgramaOficial(programa)
        ? textoPonderacionEvaluacion(
            tipoMateriaDesdePrograma(programa),
            generacionPorSemestre(semestreSeleccionado),
          )
        : "";

      // Valor total del examen = % de "Conocimiento" del esquema FASE 1 de la
      // materia (mismo mapeo tipo×generación que la ponderación). Si la materia
      // no tiene programa oficial (sin clasificación teórica/práctica), queda
      // undefined y el examen sale sin puntos.
      const totalExamen = esProgramaOficial(programa)
        ? totalExamenDesdeEsquema(
            tipoMateriaDesdePrograma(programa),
            generacionPorSemestre(semestreSeleccionado),
          )
        : undefined;
      // Puntaje completo (total + puntos por sección) para el motor determinista.
      const puntajeExamen = resolverPuntaje({
        total: totalExamen,
        ambito: carrera,
        tipo,
      });

      // Preguntas REALES por tema con IA (Gemini). Se acotan al mismo rango que
      // usa el motor y se piden al servidor; si la IA no está disponible/falla,
      // `preguntasIA` es undefined y construirDatosExamen cae al banco
      // determinista. El resto del examen (temas, objetivo, ponderación) es igual.
      const temasExamen = (datosMateria?.semanas ?? [])
        .slice(rango.inicio, rango.fin)
        .map((s) => limpiarTema(s.tema))
        .filter((t) => t.length > 0);
      const preguntasIA = await pedirPreguntasExamenIA({
        ambito: carrera,
        materia: materiaSeleccionada,
        tipo,
        temas: temasExamen,
        total: totalExamen,
      });

      doc.render(
        construirDatosExamen({
          tipo,
          materia: materiaSeleccionada,
          datosMateria,
          docente,
          grupo,
          semestre: semestreSeleccionado,
          fecha: fechaInicio,
          periodoEscolar: periodo,
          rango,
          ponderacion: ponderacionExamen,
          preguntas: preguntasIA,
          puntaje: puntajeExamen,
        }),
      );

      const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      saveAs(
        blob,
        `${nombreArchivoSeguro(tipo)}_${nombreArchivoSeguro(materiaSeleccionada) || "examen"}.docx`,
      );

      setMensajeExamen({
        tipo: "exito",
        texto: `${tipo} generado y descargado para ${materiaSeleccionada}.`,
      });
    } catch (error) {
      console.error(`Error generando ${tipo}:`, error);
      const detalle =
        error instanceof Error ? error.message : "Error desconocido.";
      setMensajeExamen({
        tipo: "error",
        texto: `No se pudo generar el ${tipo}. ${detalle}`,
      });
    } finally {
      setGenerandoExamen(false);
    }
  };

  // Verdadero mientras cualquier generación está en curso: se usa para
  // deshabilitar los demás botones y evitar solicitudes simultáneas.
  const ocupado =
    generandoPlaneacion || generandoPresOficial || generandoExamen;

  // Pasos del stepper del flujo general (PN/MN): Carrera → Semestre → Materia →
  // Documentos. El estado se deriva de la selección actual; los pasos ya
  // completados son clicables para regresar.
  const pasosGeneral: PasoStepper[] = [
    {
      etiqueta: "Carrera",
      estado: "completado",
      onClick: regresarASemestres,
    },
    {
      etiqueta: "Semestre",
      estado: semestreSeleccionado ? "completado" : "activo",
      onClick: semestreSeleccionado ? regresarASemestres : undefined,
    },
    {
      etiqueta: "Materia",
      estado: !semestreSeleccionado
        ? "pendiente"
        : materiaSeleccionada
          ? "completado"
          : "activo",
      onClick: materiaSeleccionada ? regresarAMaterias : undefined,
    },
    {
      etiqueta: "Documentos",
      estado: materiaSeleccionada ? "activo" : "pendiente",
    },
  ];

  // Puerta de acceso: mientras se resuelve la sesión, un estado de carga; sin
  // sesión válida, la pantalla de login; con sesión, la aplicación.
  if (cargandoSesion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#071a33] text-white">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white"
          />
          <p className="text-sm font-semibold">Cargando…</p>
        </div>
      </main>
    );
  }

  if (!usuario) {
    return <LoginScreen />;
  }

  return (
    <main className="min-h-screen bg-[#eef2f7] text-slate-900">
      {/* Barra superior delgada: monograma + identidad institucional. */}
      <header className="sticky top-0 z-20 border-b-2 border-[#c8a45d] bg-[#071a33] text-white shadow-lg shadow-black/10">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-8">
          <Monograma className="h-11 w-11" textClassName="text-[11px]" />
          <div className="leading-tight">
            <p className="text-base font-black sm:text-lg">
              Planeaciones Náuticas
            </p>
            <p className="text-[11px] text-slate-300 sm:text-xs">
              Escuela Náutica Mercante de Tampico
            </p>
          </div>
        </div>
      </header>

        <section className="p-4 sm:p-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/60">
            {seccion === "general" && (
              <div className="px-6 pt-6 sm:px-10">
                <Stepper pasos={pasosGeneral} />
              </div>
            )}

            {seccion === "ingles" ? (
              <SeccionIngles onVolver={() => setSeccion("general")} />
            ) : !semestreSeleccionado ? (
              <div className="px-6 py-10 sm:px-10">
                <div className="rounded-3xl border border-dashed border-[#c8a45d] bg-[#fffaf0] p-6 text-center sm:p-8">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#071a33] text-xs font-black uppercase tracking-[0.18em] text-[#d7bd7a]">
                    F-32
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
                    Paso 1
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#071a33] sm:text-3xl">
                    Selecciona un semestre
                  </h2>
                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Elige la carrera y el semestre para consultar únicamente sus
                    asignaturas y continuar con la captura de la planeación F-32.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {(
                      [
                        ["PN", "Piloto Naval"],
                        ["MN", "Maquinista Naval"],
                      ] as const
                    ).map(([valor, etiqueta]) => (
                      <button
                        key={valor}
                        type="button"
                        onClick={() => seleccionarCarrera(valor)}
                        aria-pressed={carrera === valor}
                        className={`rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-[0.16em] shadow-sm transition ${
                          carrera === valor
                            ? "bg-[#071a33] text-white"
                            : "border border-[#071a33]/30 bg-white text-[#071a33] hover:border-[#071a33]"
                        }`}
                      >
                        {etiqueta}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSeccion("ingles")}
                      className="rounded-2xl border border-[#071a33]/30 bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] shadow-sm transition hover:border-[#071a33]"
                    >
                      Inglés
                    </button>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {semestres.map((semestre) => (
                      <button
                        key={semestre}
                        type="button"
                        onClick={() => seleccionarSemestre(semestre)}
                        className="rounded-2xl border border-[#c8a45d]/40 bg-white px-5 py-6 text-lg font-black text-[#071a33] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c8a45d] hover:bg-[#071a33] hover:text-white hover:shadow-xl"
                      >
                        {semestre.replace(" SEMESTRE", "")}
                        <span className="mt-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#c8a45d]">
                          Semestre
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : !materiaSeleccionada ? (
              <div className="px-6 py-8 sm:px-10">
                <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
                      Paso 2
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-[#071a33]">
                      Materias de {semestreSeleccionado}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Selecciona una asignatura para abrir el formulario de
                      datos generales.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={regresarASemestres}
                    className="rounded-2xl border border-[#071a33] px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] transition hover:bg-[#071a33] hover:text-white"
                  >
                    Regresar a semestres
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {materiasDelSemestre.map((materia) => (
                    <button
                      key={materia}
                      type="button"
                      onClick={() => setMateriaSeleccionada(materia)}
                      className="rounded-2xl border border-slate-200 bg-white p-5 text-left text-sm font-bold text-[#071a33] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c8a45d] hover:shadow-lg"
                    >
                      <span className="mb-3 block h-1 w-12 rounded-full bg-[#c8a45d]" />
                      {materia}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-6 py-8 sm:px-10">
                {/* Navegación entre semestres/materias */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={regresarASemestres}
                      className="rounded-xl border border-[#071a33] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#071a33] transition hover:bg-[#071a33] hover:text-white"
                    >
                      Regresar a semestres
                    </button>
                    <button
                      type="button"
                      onClick={regresarAMaterias}
                      className="rounded-xl border border-[#c8a45d] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#071a33] transition hover:bg-[#c8a45d]"
                    >
                      Regresar a materias
                    </button>
                  </div>
                  <div className="hidden rounded-2xl bg-[#071a33] px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em] text-white sm:block">
                    {semestreSeleccionado}
                  </div>
                </div>

                {/* Datos generales de la portada — comunes a todas las pestañas */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
                    Formato F-32 · {materiaSeleccionada}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#071a33]">
                    Datos generales de la portada
                  </h2>

                  <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <label className="md:col-span-2">
                      <span className={labelClass}>Nombre del docente</span>
                      <input
                        className={inputClass}
                        placeholder="Nombre completo del docente"
                        value={docente}
                        onChange={(e) => setDocente(e.target.value)}
                      />
                    </label>

                    <label className="md:col-span-2">
                      <span className={labelClass}>Asignatura</span>
                      <input
                        className={readOnlyClass}
                        value={materiaSeleccionada}
                        readOnly
                      />
                    </label>

                    <label>
                      <span className={labelClass}>Grupo</span>
                      <input
                        className={inputClass}
                        placeholder="Ej. 101-A"
                        value={grupo}
                        onChange={(e) => setGrupo(e.target.value)}
                      />
                    </label>

                    <label>
                      <span className={labelClass}>Número de cadetes</span>
                      <input
                        className={inputClass}
                        placeholder="Ej. 28"
                        value={cadetes}
                        onChange={(e) => setCadetes(e.target.value)}
                      />
                    </label>

                    <label>
                      <span className={labelClass}>Periodo escolar</span>
                      <input className={readOnlyClass} value={periodo} readOnly />
                    </label>

                    <label>
                      <span className={labelClass}>Fecha de inicio</span>
                      <input
                        className={inputClass}
                        placeholder="Fecha de inicio"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                      />
                    </label>

                    <label className="md:col-span-2">
                      <span className={labelClass}>Escuela</span>
                      <input
                        className={readOnlyClass}
                        value={escuelaNautica}
                        readOnly
                      />
                    </label>
                  </div>
                </div>

                {/* Pestañas de documentos */}
                <div className="mt-6 flex flex-wrap gap-1 border-b border-slate-200">
                  {(
                    [
                      ["f32", "Planeación F-32"],
                      ["f51", "Avance F-51"],
                      ["examenes", "Exámenes"],
                      ["presentaciones", "Presentaciones"],
                    ] as const
                  ).map(([id, etiqueta]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setTabMateria(id);
                        if (
                          id === "f51" &&
                          materiaTienePrograma &&
                          avancePaso === "no"
                        ) {
                          abrirAvance();
                        }
                      }}
                      aria-current={tabMateria === id ? "page" : undefined}
                      className={`-mb-px rounded-t-xl border-b-2 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition sm:text-sm ${
                        tabMateria === id
                          ? "border-[#c8a45d] text-[#071a33]"
                          : "border-transparent text-slate-400 hover:text-[#071a33]"
                      }`}
                    >
                      {etiqueta}
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  {/* ── Pestaña: Planeación F-32 ─────────────────────────── */}
                  {tabMateria === "f32" && (
                    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                      <div className="flex flex-col gap-6">
                        <div className="rounded-3xl bg-[#071a33] p-6 text-white shadow-xl shadow-slate-300/60">
                          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d7bd7a]">
                            Vista institucional
                          </p>
                          <h3 className="mt-3 text-2xl font-black leading-tight">
                            {materiaSeleccionada}
                          </h3>
                          <div className="mt-6 space-y-4 rounded-2xl border border-white/15 bg-white/10 p-5">
                            <div className="flex justify-between gap-4 border-b border-white/10 pb-3 text-sm">
                              <span className="text-slate-300">Docente</span>
                              <span className="font-bold text-right">
                                {docente || "Por definir"}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4 border-b border-white/10 pb-3 text-sm">
                              <span className="text-slate-300">Grupo</span>
                              <span className="font-bold">
                                {grupo || "Por definir"}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4 border-b border-white/10 pb-3 text-sm">
                              <span className="text-slate-300">Cadetes</span>
                              <span className="font-bold">
                                {cadetes || "Por definir"}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4 text-sm">
                              <span className="text-slate-300">Periodo</span>
                              <span className="font-bold">{periodo}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <input
                            className={readOnlyClass}
                            value={`Horas/semana: ${horasMateria?.porSemana ?? horasPorSemana}`}
                            readOnly
                          />
                          <input
                            className={readOnlyClass}
                            value={`Horas totales: ${horasMateria?.total ?? horasTotales}`}
                            readOnly
                          />
                          <input
                            className={readOnlyClass}
                            value={`Horas teóricas: ${horasMateria?.teoricas ?? horasTeoricas}`}
                            readOnly
                          />
                          <input
                            className={readOnlyClass}
                            value={`Horas prácticas: ${horasMateria?.practicas ?? "0"}`}
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
                          Planeación F-32
                        </p>
                        <p className="text-sm text-slate-600">
                          Genera la planeación didáctica F-32 de la asignatura con
                          los datos capturados arriba.
                        </p>
                        <button
                          type="button"
                          onClick={generarWord}
                          disabled={ocupado}
                          className="rounded-2xl bg-[#c8a45d] px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] shadow-lg shadow-[#c8a45d]/30 transition hover:bg-[#d7bd7a] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {generandoPlaneacion
                            ? "Generando planeación..."
                            : "Generar planeación F-32"}
                        </button>
                        {generandoPlaneacion && <LoadingIA />}
                        {mensajePlaneacion && (
                          <div
                            role="alert"
                            className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${
                              mensajePlaneacion.tipo === "exito"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-red-200 bg-red-50 text-red-800"
                            }`}
                          >
                            {mensajePlaneacion.texto}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Pestaña: Avance F-51 ─────────────────────────────── */}
                  {tabMateria === "f51" &&
                    (!materiaTienePrograma ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-center text-sm font-semibold text-slate-500">
                        El Avance Programático F-51 solo está disponible para
                        materias con programa oficial.
                      </div>
                    ) : avancePaso === "preview" ? (
                      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
                            Temas y semanas del avance
                          </p>
                          <ol className="mt-4 space-y-3">
                            {semanasDisponibles
                              .filter((s) => semanasAvance.includes(s.numero))
                              .sort((a, b) => a.numero - b.numero)
                              .map((s) => (
                                <li
                                  key={s.numero}
                                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                  <p className="whitespace-pre-line text-sm font-black text-[#071a33]">
                                    {s.etiqueta}
                                  </p>
                                  <p className="mt-1 whitespace-pre-line text-xs text-slate-600">
                                    {s.tema}
                                  </p>
                                </li>
                              ))}
                          </ol>
                        </div>

                        <div className="flex flex-col gap-6">
                          <div className="rounded-3xl bg-[#071a33] p-6 text-white shadow-xl shadow-slate-300/60">
                            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d7bd7a]">
                              Datos del avance
                            </p>
                            <div className="mt-5 space-y-3 text-sm">
                              <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                                <span className="text-slate-300">Carrera</span>
                                <span className="text-right font-bold">
                                  {licenciatura}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                                <span className="text-slate-300">Semestre</span>
                                <span className="font-bold">
                                  {semestreSeleccionado}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                                <span className="text-slate-300">Docente</span>
                                <span className="text-right font-bold">
                                  {docente || "Por definir"}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                                <span className="text-slate-300">Grupo</span>
                                <span className="font-bold">
                                  {grupo || "Por definir"}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-300">Periodo</span>
                                <span className="text-right font-bold">
                                  {periodoDesdeSemanas(semanasAvance)
                                    .periodoReportado || "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => setAvancePaso("semanas")}
                              className="rounded-2xl border border-[#071a33] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] transition hover:bg-[#071a33] hover:text-white"
                            >
                              Regresar a semanas
                            </button>
                            <button
                              type="button"
                              onClick={generarAvanceProgramatico}
                              disabled={ocupado}
                              className="rounded-2xl bg-[#c8a45d] px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] shadow-lg shadow-[#c8a45d]/30 transition hover:bg-[#d7bd7a] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Generar avance en Word
                            </button>
                          </div>

                          {mensajePlaneacion && (
                            <div
                              role="alert"
                              className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${
                                mensajePlaneacion.tipo === "exito"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-red-200 bg-red-50 text-red-800"
                              }`}
                            >
                              {mensajePlaneacion.texto}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <p className="text-sm font-bold text-[#071a33]">
                            Selecciona las semanas (hasta 4). Los temas se toman
                            automáticamente del programa.
                          </p>
                          <span className="shrink-0 rounded-full bg-[#071a33] px-3 py-1 text-xs font-black text-white">
                            {semanasAvance.length}/4
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {semanasDisponibles.map((s) => {
                            const activa = semanasAvance.includes(s.numero);
                            const bloqueada =
                              !activa && semanasAvance.length >= 4;
                            return (
                              <button
                                key={s.numero}
                                type="button"
                                onClick={() => alternarSemanaAvance(s.numero)}
                                disabled={bloqueada}
                                className={`rounded-2xl border p-4 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  activa
                                    ? "border-[#c8a45d] bg-[#071a33] text-white"
                                    : "border-slate-200 bg-white text-[#071a33] hover:border-[#c8a45d]"
                                }`}
                              >
                                <span
                                  className={`text-xs font-bold uppercase tracking-[0.16em] ${
                                    activa ? "text-[#d7bd7a]" : "text-[#c8a45d]"
                                  }`}
                                >
                                  {activa ? "✓ Seleccionada" : "Semana"}
                                </span>
                                <span className="mt-1 block whitespace-pre-line text-sm font-black">
                                  {s.etiqueta}
                                </span>
                                <span
                                  className={`mt-2 block whitespace-pre-line text-xs ${
                                    activa ? "text-slate-200" : "text-slate-500"
                                  }`}
                                >
                                  {s.tema}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => setAvancePaso("preview")}
                            disabled={semanasAvance.length === 0}
                            className="rounded-2xl bg-[#c8a45d] px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] shadow-sm transition hover:bg-[#d7bd7a] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Continuar a vista previa
                          </button>
                        </div>
                        {mensajePlaneacion && (
                          <div
                            role="alert"
                            className={`mt-6 rounded-2xl border px-5 py-4 text-sm font-semibold ${
                              mensajePlaneacion.tipo === "exito"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-red-200 bg-red-50 text-red-800"
                            }`}
                          >
                            {mensajePlaneacion.texto}
                          </div>
                        )}
                      </>
                    ))}

                  {/* ── Pestaña: Exámenes ────────────────────────────────── */}
                  {tabMateria === "examenes" && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
                        Exámenes
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Genera documentos de evaluación usando las plantillas
                        institucionales existentes.
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <button
                          type="button"
                          onClick={() =>
                            generarExamen(
                              "Examen Parcial 1",
                              "/templates/examen-parcial.docx",
                              { inicio: 0, fin: 10 },
                            )
                          }
                          disabled={ocupado}
                          className="rounded-2xl border border-[#071a33] px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] shadow-sm transition hover:bg-[#071a33] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Generar Examen Parcial 1
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            generarExamen(
                              "Examen Parcial 2",
                              "/templates/examen-parcial.docx",
                              { inicio: 10, fin: 18 },
                            )
                          }
                          disabled={ocupado}
                          className="rounded-2xl border border-[#071a33] px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] shadow-sm transition hover:bg-[#071a33] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Generar Examen Parcial 2
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            generarExamen(
                              "Examen Ordinario",
                              "/templates/examen-ordinario.docx",
                              { inicio: 0, fin: 18 },
                            )
                          }
                          disabled={ocupado}
                          className="rounded-2xl border border-[#c8a45d] bg-[#fffaf0] px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] shadow-sm transition hover:bg-[#c8a45d] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Generar Examen Ordinario
                        </button>
                      </div>
                      {generandoExamen && (
                        <LoadingIA
                          className="mt-4"
                          nota="Puede tardar hasta ~1 minuto. No cierres la página."
                        />
                      )}
                      {mensajeExamen && (
                        <div
                          role="alert"
                          className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                            mensajeExamen.tipo === "exito"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-red-200 bg-red-50 text-red-800"
                          }`}
                        >
                          {mensajeExamen.texto}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Pestaña: Presentaciones ──────────────────────────── */}
                  {tabMateria === "presentaciones" && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
                        Presentaciones
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Genera una presentación profesional con IA (Claude Opus),
                        elaborada a partir del programa oficial de estudios. La
                        primera vez puede tardar hasta ~1 minuto.
                      </p>

                      <label className="mt-4 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Unidades a generar
                      </label>
                      <div className="mt-2 space-y-2">
                        {unidadesMateria.map((u) => {
                          const marcada =
                            unidadesSeleccionadas.includes(u.numero);
                          return (
                            <label
                              key={u.numero}
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                                marcada
                                  ? "border-[#c8a45d] bg-[#fffaf0]"
                                  : "border-slate-200 bg-white hover:border-[#c8a45d]"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={marcada}
                                onChange={() => alternarUnidad(u.numero)}
                                className="mt-0.5 h-4 w-4 accent-[#c8a45d]"
                              />
                              <span className="font-semibold text-[#071a33]">
                                {`Unidad ${u.numero} — ${u.tema}`}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      {materiaTienePrograma ? (
                        <>
                          <button
                            type="button"
                            onClick={generarPresentacionUnidad}
                            disabled={
                              ocupado || unidadesSeleccionadas.length === 0
                            }
                            className="mt-4 w-full rounded-2xl bg-[#c8a45d] px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] shadow-lg shadow-[#c8a45d]/30 transition hover:bg-[#d7bd7a] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {generandoPresOficial
                              ? "Generando presentación..."
                              : unidadesSeleccionadas.length > 1
                                ? `Generar ${unidadesSeleccionadas.length} presentaciones`
                                : "Generar Presentación"}
                          </button>
                          {unidadesSeleccionadas.length === 0 &&
                            !generandoPresOficial && (
                              <p className="mt-2 text-xs font-semibold text-slate-500">
                                Selecciona al menos una unidad.
                              </p>
                            )}
                          {generandoPresOficial && (
                            <LoadingIA
                              className="mt-3"
                              nota="Cada unidad puede tardar ~1 minuto. No cierres la página."
                            />
                          )}
                          {mensajePresOficial && (
                            <div
                              role="alert"
                              className={`mt-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                                mensajePresOficial.tipo === "exito"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-red-200 bg-red-50 text-red-800"
                              }`}
                            >
                              {mensajePresOficial.texto}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="mt-4 w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-4 text-center text-sm font-semibold text-slate-500">
                          Selecciona una materia con programa oficial
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
    </main>
  );
}