"use client";

// Sección INGLÉS — flujo paralelo al de PN/MN: Carrera → Nivel → Generar Word.
//
// La pantalla replica la experiencia del flujo principal de Planeaciones: el
// usuario elige un NIVEL (como elige un semestre en PN/MN) y luego captura los
// datos para generar la planeación de Inglés en Word (formato F-32).
//
// No expone detalles internos (corpus, índice, rutas, errores técnicos): toda
// la mecánica (biblioteca histórica + Gemini) ocurre en el servidor. Aquí solo
// se muestra una experiencia institucional para el usuario final.

import { useEffect, useState } from "react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { construirDatosF32DesdeIngles } from "../lib/planeacionInglesF32.js";
import { construirDatosAvanceF51, periodoDesdeSemanas } from "../lib/avanceF51";
import { generarPresentacionOficialV2 } from "../lib/pptxOficialV2";
import {
  construirDatosExamen,
  limpiarTema,
  nombreArchivoSeguro,
  type SemanaMateria,
} from "../lib/examen";
import { pedirPreguntasExamenIA } from "../lib/pedirPreguntasExamen";
import {
  totalExamenIngles,
  esquemaInglesTexto,
  resolverPuntaje,
} from "../lib/puntajeExamen";
import type { PresentacionV2 } from "../data/presentaciones/tiposV2";

type Props = {
  onVolver: () => void;
};

// Estilos alineados al diseño institucional actual (navy #071a33, dorado #c8a45d).
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#c8a45d] focus:ring-2 focus:ring-[#c8a45d]/30";
const readOnlyClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm";
const labelClass =
  "mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#0b1f3a]";

// Niveles de Inglés de respaldo si la API no responde. La lista REAL se carga
// del índice (los niveles con planeaciones históricas) en un useEffect: así, al
// subir nuevos niveles y reindexar, aparecen solos sin tocar el código.
const NIVELES_FALLBACK = ["3", "4", "5", "6", "7"];

const MENSAJE_BIBLIOTECA_NO_DISPONIBLE =
  "La biblioteca académica de este nivel aún no está disponible.";
const MENSAJE_ERROR_GENERICO =
  "No se pudo generar la planeación en este momento. Inténtalo de nuevo.";

// Texto institucional de relleno del cuadro "Competencias disciplinares" en la
// plantilla F-32 (es texto ESTÁTICO, sin placeholder). Nunca debe aparecer en
// una planeación generada de Inglés: se reemplaza por las disciplinares reales
// o se deja vacío. Tolerante al acento ("integrará"/"integrara").
const RE_RUN_DISCIPLINARES_DEFECTO =
  /<w:t[^>]*>Estas competencias las integrar[^<]*<\/w:t>/;
const RE_DISCIPLINARES_RELLENO = /integrar[aá][^<]*?(docente|instructor)/i;

function escaparXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Extrae las competencias disciplinares REALES del JSON, descartando vacíos y el
// texto institucional de relleno.
function disciplinaresReales(planeacion: unknown): string[] {
  if (!planeacion || typeof planeacion !== "object") return [];
  const comp = (planeacion as { competencias?: unknown }).competencias;
  if (!comp || typeof comp !== "object") return [];
  const arr = (comp as { disciplinares?: unknown }).disciplinares;
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter((x) => x.length > 0 && !RE_DISCIPLINARES_RELLENO.test(x));
}

// Rellena el cuadro "Competencias disciplinares" del F-32 ya renderizado con las
// disciplinares históricas (una por línea) o lo deja VACÍO. El texto de relleno
// por defecto nunca permanece. Solo se aplica al Word de Inglés; no toca PN/MN
// ni la plantilla original.
function rellenarDisciplinaresDocx(
  zip: InstanceType<typeof PizZip>,
  disciplinares: string[],
): void {
  const ruta = "word/document.xml";
  const archivo = zip.file(ruta);
  if (!archivo) return;
  let xml = archivo.asText();
  if (!RE_RUN_DISCIPLINARES_DEFECTO.test(xml)) return;
  const reemplazo = disciplinares.length
    ? disciplinares
        .map((d) => `<w:t xml:space="preserve">${escaparXml(d)}</w:t>`)
        .join("<w:br/>")
    : "<w:t></w:t>";
  xml = xml.replace(RE_RUN_DISCIPLINARES_DEFECTO, reemplazo);
  zip.file(ruta, xml);
}

// Traduce cualquier código interno del servidor a un mensaje amable. El usuario
// nunca ve "sin_corpus", rutas ni detalles técnicos.
function mensajeAmigable(codigo?: string): string {
  switch (codigo) {
    case "sin_corpus":
    case "sin_historicas_nivel":
    case "sin_api_key":
      return MENSAJE_BIBLIOTECA_NO_DISPONIBLE;
    default:
      return MENSAJE_ERROR_GENERICO;
  }
}

export function SeccionIngles({ onVolver }: Props) {
  // Nivel elegido (null = pantalla de tarjetas de niveles).
  const [nivel, setNivel] = useState<string | null>(null);

  // Niveles disponibles (los que tienen planeaciones históricas en el índice).
  const [niveles, setNiveles] = useState<string[]>(NIVELES_FALLBACK);
  const [generandoPres, setGenerandoPres] = useState(false);

  // Carga los niveles reales del corpus. Si falla, se queda con el respaldo.
  useEffect(() => {
    let activo = true;
    fetch("/api/biblioteca-ingles")
      .then((r) => r.json())
      .then((d) => {
        if (
          activo &&
          Array.isArray(d?.nivelesDisponibles) &&
          d.nivelesDisponibles.length > 0
        ) {
          setNiveles(d.nivelesDisponibles as string[]);
        }
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  // Datos del formulario de generación.
  const [grupo, setGrupo] = useState("");
  const [semanas, setSemanas] = useState("");
  const [horasPorSemana, setHorasPorSemana] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Estado de la generación.
  const [generando, setGenerando] = useState(false);
  const [generandoExamen, setGenerandoExamen] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);

  // Flujo del Avance Programático F-51 (en pasos). El "pool" de semanas viene de
  // la secuencia espejada de las históricas del nivel (secuenciaSemanal).
  const [avancePaso, setAvancePaso] = useState<"no" | "semanas" | "preview">(
    "no",
  );
  const [cargandoAvance, setCargandoAvance] = useState(false);
  const [poolSemanas, setPoolSemanas] = useState<
    { numero: number; tema: string }[]
  >([]);
  const [semanasAvance, setSemanasAvance] = useState<number[]>([]);
  const [metaAvance, setMetaAvance] = useState<{
    asignatura: string;
    objetivoGeneral: string;
  }>({ asignatura: "", objetivoGeneral: "" });

  // Flujo de Presentación de Inglés (en pasos): "no" oculto; "temas" muestra las
  // casillas de temas/semanas del nivel. Cada tema marcado se genera como un PPTX
  // independiente (enfocado en ese tema vía /api/presentacion-ingles).
  const [presentacionPaso, setPresentacionPaso] = useState<"no" | "temas">("no");
  const [cargandoPresPool, setCargandoPresPool] = useState(false);
  const [poolTemasPres, setPoolTemasPres] = useState<
    { numero: number; tema: string }[]
  >([]);
  const [temasPres, setTemasPres] = useState<number[]>([]);

  const seleccionarNivel = (n: string) => {
    setNivel(n);
    setMensaje(null);
    setAvancePaso("no");
    setSemanasAvance([]);
    setPoolSemanas([]);
    setPresentacionPaso("no");
    setTemasPres([]);
    setPoolTemasPres([]);
  };

  const regresarANiveles = () => {
    setNivel(null);
    setMensaje(null);
    setAvancePaso("no");
    setSemanasAvance([]);
    setPoolSemanas([]);
    setPresentacionPaso("no");
    setTemasPres([]);
    setPoolTemasPres([]);
  };

  const cerrarAvance = () => {
    setAvancePaso("no");
    setSemanasAvance([]);
  };

  const cerrarPresentacion = () => {
    setPresentacionPaso("no");
    setTemasPres([]);
  };

  const alternarTemaPres = (numero: number) => {
    setTemasPres((prev) =>
      prev.includes(numero)
        ? prev.filter((n) => n !== numero)
        : [...prev, numero],
    );
  };

  const alternarSemanaAvance = (numero: number) => {
    setSemanasAvance((prev) =>
      prev.includes(numero)
        ? prev.filter((n) => n !== numero)
        : prev.length >= 4
          ? prev
          : [...prev, numero],
    );
  };

  // Abre el flujo del avance: obtiene la secuencia semanal del nivel (espejo de
  // las históricas) para ofrecer las semanas/temas a elegir. Sin JSON ni errores
  // técnicos a la vista.
  const abrirAvance = async () => {
    if (!nivel) return;
    setMensaje(null);
    setCargandoAvance(true);
    try {
      const res = await fetch("/api/planeacion-ingles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nivel,
          grupo,
          semanas,
          horasPorSemana,
          observaciones,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.planeacion) {
        setMensaje({ tipo: "error", texto: mensajeAmigable(data?.error) });
        return;
      }
      const secuencia = Array.isArray(data.planeacion.secuenciaSemanal)
        ? (data.planeacion.secuenciaSemanal as Record<string, unknown>[])
        : [];
      const pool = secuencia.map((s, i) => ({
        numero: Number(s?.semana) || i + 1,
        tema:
          typeof s?.contenido === "string" && s.contenido.trim()
            ? s.contenido.trim()
            : `Semana ${Number(s?.semana) || i + 1}`,
      }));
      if (pool.length === 0) {
        setMensaje({ tipo: "error", texto: MENSAJE_BIBLIOTECA_NO_DISPONIBLE });
        return;
      }
      setPoolSemanas(pool);
      setSemanasAvance([]);
      setMetaAvance({
        asignatura:
          typeof data.planeacion.asignatura === "string"
            ? data.planeacion.asignatura
            : `Inglés Nivel ${nivel}`,
        objetivoGeneral:
          typeof data.planeacion.objetivoGeneral === "string"
            ? data.planeacion.objetivoGeneral
            : "",
      });
      setAvancePaso("semanas");
    } catch {
      setMensaje({ tipo: "error", texto: MENSAJE_ERROR_GENERICO });
    } finally {
      setCargandoAvance(false);
    }
  };

  // Genera el Avance Programático F-51 con las semanas elegidas (temas tomados
  // automáticamente de la secuencia del nivel). Reutiliza la plantilla F-51.
  const generarAvanceWord = async () => {
    if (!nivel || semanasAvance.length === 0) return;
    setMensaje(null);
    try {
      const seleccionadas = poolSemanas
        .filter((s) => semanasAvance.includes(s.numero))
        .sort((a, b) => a.numero - b.numero);

      const plantilla = await fetch("/templates/Avance-Programatico-F51.docx");
      if (!plantilla.ok) {
        setMensaje({ tipo: "error", texto: MENSAJE_ERROR_GENERICO });
        return;
      }
      const content = await plantilla.arrayBuffer();
      const doc = new Docxtemplater(new PizZip(content), {
        paragraphLoop: true,
        linebreaks: true,
      });
      doc.render(
        construirDatosAvanceF51(seleccionadas, {
          asignatura: metaAvance.asignatura || `Inglés Nivel ${nivel}`,
          licenciatura: "Inglés",
          semestre: `Nivel ${nivel}`,
          docente: "",
          grupo,
          objetivosCompetencias: metaAvance.objetivoGeneral,
        }),
      );
      const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const nombreArchivo = `F51_INGLES_NIVEL${nivel}.docx`;
      saveAs(blob, nombreArchivo);

      cerrarAvance();
      setMensaje({
        tipo: "exito",
        texto: `Avance Programático generado y descargado: ${nombreArchivo}`,
      });
    } catch {
      setMensaje({ tipo: "error", texto: MENSAJE_ERROR_GENERICO });
    }
  };

  // Genera la planeación de Inglés y descarga el Word automáticamente. Toda la
  // lógica de IA/biblioteca vive en /api/planeacion-ingles (servidor). El usuario
  // nunca ve JSON ni errores técnicos.
  const generarWord = async () => {
    if (!nivel) return;
    setGenerando(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/planeacion-ingles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nivel,
          grupo,
          semanas,
          horasPorSemana,
          observaciones,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.planeacion) {
        setMensaje({ tipo: "error", texto: mensajeAmigable(data?.error) });
        return;
      }

      // Rellena la MISMA plantilla institucional F-32 (sin tocar PN/MN).
      const plantilla = await fetch("/templates/F-32.docx");
      if (!plantilla.ok) {
        setMensaje({ tipo: "error", texto: MENSAJE_ERROR_GENERICO });
        return;
      }
      const content = await plantilla.arrayBuffer();
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });
      doc.render(
        construirDatosF32DesdeIngles(data.planeacion, {
          nivel,
          grupo,
          semanas,
          horasPorSemana,
        }),
      );
      // El cuadro de competencias disciplinares del F-32 es texto estático: se
      // sustituye por las disciplinares históricas reales (o se deja vacío).
      const zipFinal = doc.getZip();
      rellenarDisciplinaresDocx(zipFinal, disciplinaresReales(data.planeacion));
      const blob = zipFinal.generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const nombreArchivo = `F32_INGLES_NIVEL${nivel}.docx`;
      saveAs(blob, nombreArchivo);

      setMensaje({
        tipo: "exito",
        texto: `Planeación generada y descargada: ${nombreArchivo}`,
      });
    } catch {
      setMensaje({ tipo: "error", texto: MENSAJE_ERROR_GENERICO });
    } finally {
      setGenerando(false);
    }
  };

  // Genera un EXAMEN (Parcial 1, Parcial 2 u Ordinario) para el nivel usando el
  // MISMO motor de la FASE 1 (construirDatosExamen), alimentado con el índice
  // académico de Inglés del nivel: la secuencia semanal espejada de las
  // planeaciones históricas (igual fuente que el Avance y la Presentación).
  // Ponderación por defecto: teórica + nuevo ingreso (uno de los 4 esquemas de
  // puntaje de la FASE 1); Inglés es una materia teórica.
  const generarExamenIngles = async (
    tipo: string,
    templatePath: string,
    rango: { inicio: number; fin: number },
  ) => {
    if (!nivel) return;
    setGenerandoExamen(true);
    setMensaje(null);
    try {
      // 1. Índice académico del nivel (temario espejado de las históricas).
      const res = await fetch("/api/planeacion-ingles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nivel,
          grupo,
          semanas,
          horasPorSemana,
          observaciones,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.planeacion) {
        setMensaje({ tipo: "error", texto: mensajeAmigable(data?.error) });
        return;
      }
      const secuencia = Array.isArray(data.planeacion.secuenciaSemanal)
        ? (data.planeacion.secuenciaSemanal as Record<string, unknown>[])
        : [];
      const semanasExamen: SemanaMateria[] = secuencia.map((s, i) => ({
        semana: `Semana ${Number(s?.semana) || i + 1}`,
        tema:
          typeof s?.contenido === "string" && s.contenido.trim()
            ? s.contenido.trim()
            : `Semana ${Number(s?.semana) || i + 1}`,
      }));
      if (semanasExamen.length === 0) {
        setMensaje({ tipo: "error", texto: MENSAJE_BIBLIOTECA_NO_DISPONIBLE });
        return;
      }

      const materia = `Inglés Nivel ${nivel}`;
      const objetivoGeneral =
        typeof data.planeacion.objetivoGeneral === "string"
          ? data.planeacion.objetivoGeneral
          : "";
      // Esquema oficial de Inglés por habilidades (muestra dónde encaja este
      // examen de Gram/Vocab: 17 pts en parcial / 20 en ordinario, dentro de las
      // 5 habilidades). Ver lib/puntajeExamen.ts → INGLES_EVALUACION.
      const ponderacion = esquemaInglesTexto(tipo);

      // 2. Cargar la plantilla del examen. Red de seguridad: si la elegida no
      // tiene placeholders (caso del ordinario), usa la de parcial.
      let response = await fetch(templatePath);
      if (!response.ok) {
        setMensaje({ tipo: "error", texto: MENSAJE_ERROR_GENERICO });
        return;
      }
      let content = await response.arrayBuffer();
      let zip = new PizZip(content);
      const documentXml = zip.file("word/document.xml")?.asText() || "";
      if (!/\{[^{}]+\}/.test(documentXml)) {
        response = await fetch("/templates/examen-parcial.docx");
        if (!response.ok) {
          setMensaje({ tipo: "error", texto: MENSAJE_ERROR_GENERICO });
          return;
        }
        content = await response.arrayBuffer();
        zip = new PizZip(content);
      }

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Preguntas REALES por tema con IA (Gemini), en inglés (ámbito INGLES).
      // Se acotan al mismo rango que usa el motor; si la IA no está
      // disponible/falla, `preguntasIA` es undefined y se cae al banco
      // determinista. Formato Word idéntico en ambos casos.
      // Total oficial del examen Gram/Vocab: 17 (parcial) / 20 (ordinario).
      const totalExamen = totalExamenIngles(tipo);
      const puntajeExamen = resolverPuntaje({
        total: totalExamen,
        ambito: "INGLES",
        tipo,
      });
      const temasExamen = semanasExamen
        .slice(rango.inicio, rango.fin)
        .map((s) => limpiarTema(s.tema))
        .filter((t) => t.length > 0);
      const preguntasIA = await pedirPreguntasExamenIA({
        ambito: "INGLES",
        materia,
        tipo,
        temas: temasExamen,
        total: totalExamen,
      });

      doc.render(
        construirDatosExamen({
          tipo,
          materia,
          datosMateria: {
            semanas: semanasExamen,
            objetivoGeneral,
            unidad: "I",
          },
          docente: "",
          grupo,
          semestre: `Nivel ${nivel}`,
          fecha: "",
          periodoEscolar: "Julio-Diciembre 2026",
          rango,
          ponderacion,
          preguntas: preguntasIA,
          puntaje: puntajeExamen,
        }),
      );

      const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const nombreArchivo = `${nombreArchivoSeguro(tipo)}_ingles_nivel${nivel}.docx`;
      saveAs(blob, nombreArchivo);

      setMensaje({
        tipo: "exito",
        texto: `${tipo} generado y descargado: ${nombreArchivo}`,
      });
    } catch {
      setMensaje({ tipo: "error", texto: MENSAJE_ERROR_GENERICO });
    } finally {
      setGenerandoExamen(false);
    }
  };

  // Abre el flujo de presentación: obtiene los temas/semanas del nivel (secuencia
  // espejada de las históricas, igual que el Avance) para ofrecerlos como
  // casillas. Sin JSON ni errores técnicos a la vista.
  const abrirPresentacion = async () => {
    if (!nivel) return;
    setMensaje(null);
    setCargandoPresPool(true);
    try {
      const res = await fetch("/api/planeacion-ingles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nivel,
          grupo,
          semanas,
          horasPorSemana,
          observaciones,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.planeacion) {
        setMensaje({ tipo: "error", texto: mensajeAmigable(data?.error) });
        return;
      }
      const secuencia = Array.isArray(data.planeacion.secuenciaSemanal)
        ? (data.planeacion.secuenciaSemanal as Record<string, unknown>[])
        : [];
      const pool = secuencia.map((s, i) => ({
        numero: Number(s?.semana) || i + 1,
        tema:
          typeof s?.contenido === "string" && s.contenido.trim()
            ? s.contenido.trim()
            : `Semana ${Number(s?.semana) || i + 1}`,
      }));
      if (pool.length === 0) {
        setMensaje({ tipo: "error", texto: MENSAJE_BIBLIOTECA_NO_DISPONIBLE });
        return;
      }
      setPoolTemasPres(pool);
      setTemasPres([]);
      setPresentacionPaso("temas");
    } catch {
      setMensaje({ tipo: "error", texto: MENSAJE_ERROR_GENERICO });
    } finally {
      setCargandoPresPool(false);
    }
  };

  // Genera una PRESENTACIÓN (PPTX) por cada tema marcado, enfocada en ese tema
  // vía /api/presentacion-ingles. Un archivo por tema. No genera nada si no hay
  // casillas marcadas.
  const generarPresentacionSeleccion = async () => {
    if (!nivel || temasPres.length === 0) return;
    setGenerandoPres(true);
    setMensaje(null);
    const seleccionados = poolTemasPres
      .filter((t) => temasPres.includes(t.numero))
      .sort((a, b) => a.numero - b.numero);
    const generadas: string[] = [];
    let huboError = false;
    try {
      for (const t of seleccionados) {
        try {
          const res = await fetch("/api/presentacion-ingles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nivel, tema: t.tema }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.presentacion) {
            huboError = true;
            continue;
          }
          const archivo = await generarPresentacionOficialV2(
            data.presentacion as PresentacionV2,
            {
              grupo,
              periodo: "Julio-Diciembre 2026",
              escuela: "Escuela Náutica Mercante de Tampico",
            },
          );
          generadas.push(archivo);
        } catch {
          huboError = true;
        }
      }
      if (generadas.length === 0) {
        setMensaje({ tipo: "error", texto: MENSAJE_ERROR_GENERICO });
        return;
      }
      cerrarPresentacion();
      const base =
        generadas.length === 1
          ? `Presentación generada y descargada: ${generadas[0]}`
          : `${generadas.length} presentaciones generadas y descargadas.`;
      setMensaje({
        tipo: "exito",
        texto: huboError ? `${base} Algunas no se pudieron generar.` : base,
      });
    } finally {
      setGenerandoPres(false);
    }
  };

  // Verdadero mientras cualquier generación está en curso: bloquea los botones
  // para evitar solicitudes simultáneas.
  const ocupado =
    generando ||
    cargandoAvance ||
    generandoPres ||
    cargandoPresPool ||
    generandoExamen;

  // ── Pantalla 1: tarjetas de niveles (como los semestres en PN/MN) ──────────
  if (!nivel) {
    return (
      <div className="px-6 py-10 sm:px-10">
        <div className="rounded-3xl border border-dashed border-[#c8a45d] bg-[#fffaf0] p-6 text-center sm:p-8">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#071a33] text-xs font-black uppercase tracking-[0.18em] text-[#d7bd7a]">
            ENG
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
            Inglés
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#071a33] sm:text-3xl">
            Selecciona un nivel
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Elige el nivel de Inglés para capturar los datos y generar la
            planeación en Word.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {niveles.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => seleccionarNivel(n)}
                className="rounded-2xl border border-[#c8a45d]/40 bg-white px-5 py-6 text-lg font-black text-[#071a33] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c8a45d] hover:bg-[#071a33] hover:text-white hover:shadow-xl"
              >
                Nivel {n}
                <span className="mt-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#c8a45d]">
                  Inglés
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onVolver}
            className="mt-8 rounded-2xl border border-[#071a33] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] transition hover:bg-[#071a33] hover:text-white"
          >
            Regresar al inicio
          </button>
        </div>
      </div>
    );
  }

  // ── Pantalla de Avance Programático (en pasos) ─────────────────────────────
  if (avancePaso !== "no") {
    const seleccionadas = poolSemanas
      .filter((s) => semanasAvance.includes(s.numero))
      .sort((a, b) => a.numero - b.numero);
    return (
      <div className="px-6 py-8 sm:px-10">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
              Avance Programático F-51 · Inglés
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#071a33]">
              Nivel {nivel}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {avancePaso === "semanas"
                ? "Paso 1 · Selecciona las semanas (hasta 4). Los temas se toman automáticamente de las planeaciones históricas del nivel."
                : "Paso 2 · Vista previa antes de generar el Word."}
            </p>
          </div>
          <button
            type="button"
            onClick={cerrarAvance}
            className="shrink-0 rounded-2xl border border-[#071a33] px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] transition hover:bg-[#071a33] hover:text-white"
          >
            Cancelar
          </button>
        </div>

        {avancePaso === "semanas" ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-[#071a33]">
                Semanas seleccionadas
              </p>
              <span className="rounded-full bg-[#071a33] px-3 py-1 text-xs font-black text-white">
                {semanasAvance.length}/4
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {poolSemanas.map((s) => {
                const activa = semanasAvance.includes(s.numero);
                const bloqueada = !activa && semanasAvance.length >= 4;
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
                      {activa ? "✓ Seleccionada" : `Semana ${s.numero}`}
                    </span>
                    <span className="mt-1 block text-sm font-black">
                      Semana {s.numero}
                    </span>
                    <span
                      className={`mt-2 block text-xs ${
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
          </>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
                Temas y semanas del avance
              </p>
              <ol className="mt-4 space-y-3">
                {seleccionadas.map((s) => (
                  <li
                    key={s.numero}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-black text-[#071a33]">
                      Semana {s.numero}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{s.tema}</p>
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
                    <span className="text-slate-300">Asignatura</span>
                    <span className="text-right font-bold">
                      {metaAvance.asignatura || `Inglés Nivel ${nivel}`}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                    <span className="text-slate-300">Nivel</span>
                    <span className="font-bold">Nivel {nivel}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                    <span className="text-slate-300">Grupo</span>
                    <span className="font-bold">{grupo || "Por definir"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-300">Periodo</span>
                    <span className="text-right font-bold">
                      {periodoDesdeSemanas(semanasAvance).periodoReportado ||
                        "—"}
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
                  onClick={generarAvanceWord}
                  className="rounded-2xl bg-[#c8a45d] px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] shadow-lg shadow-[#c8a45d]/30 transition hover:bg-[#d7bd7a]"
                >
                  Generar avance en Word
                </button>
              </div>
            </div>
          </div>
        )}

        {mensaje && (
          <div
            role="alert"
            className={`mt-6 rounded-2xl border px-5 py-4 text-sm font-semibold ${
              mensaje.tipo === "exito"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {mensaje.texto}
          </div>
        )}
      </div>
    );
  }

  // ── Pantalla de Presentación (selección de temas con casillas) ─────────────
  if (presentacionPaso !== "no") {
    return (
      <div className="px-6 py-8 sm:px-10">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
              Presentación (PowerPoint) · Inglés
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#071a33]">
              Nivel {nivel}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Marca los temas a generar. Cada tema se descarga como una
              presentación independiente.
            </p>
          </div>
          <button
            type="button"
            onClick={cerrarPresentacion}
            className="shrink-0 rounded-2xl border border-[#071a33] px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] transition hover:bg-[#071a33] hover:text-white"
          >
            Cancelar
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-[#071a33]">Temas seleccionados</p>
          <span className="rounded-full bg-[#071a33] px-3 py-1 text-xs font-black text-white">
            {temasPres.length}
          </span>
        </div>
        <div className="space-y-2">
          {poolTemasPres.map((t) => {
            const marcado = temasPres.includes(t.numero);
            return (
              <label
                key={t.numero}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                  marcado
                    ? "border-[#c8a45d] bg-[#fffaf0]"
                    : "border-slate-200 bg-white hover:border-[#c8a45d]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => alternarTemaPres(t.numero)}
                  className="mt-0.5 h-4 w-4 accent-[#c8a45d]"
                />
                <span>
                  <span className="block font-black text-[#071a33]">
                    Semana {t.numero}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-600">
                    {t.tema}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={generarPresentacionSeleccion}
            disabled={generandoPres || temasPres.length === 0}
            className="rounded-2xl bg-[#c8a45d] px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] shadow-lg shadow-[#c8a45d]/30 transition hover:bg-[#d7bd7a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generandoPres
              ? "Generando presentación…"
              : temasPres.length > 1
                ? `Generar ${temasPres.length} presentaciones`
                : "Generar presentación"}
          </button>
          {temasPres.length === 0 && !generandoPres && (
            <p className="text-xs font-semibold text-slate-500">
              Selecciona al menos un tema.
            </p>
          )}
        </div>

        {generandoPres && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Generando con IA… cada tema puede tardar ~1 minuto. No cierres la
            página.
          </div>
        )}

        {mensaje && (
          <div
            role="alert"
            className={`mt-6 rounded-2xl border px-5 py-4 text-sm font-semibold ${
              mensaje.tipo === "exito"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {mensaje.texto}
          </div>
        )}
      </div>
    );
  }

  // ── Pantalla 2: generación de la planeación del nivel elegido ──────────────
  return (
    <div className="px-6 py-8 sm:px-10">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={regresarANiveles}
              className="rounded-xl border border-[#071a33] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#071a33] transition hover:bg-[#071a33] hover:text-white"
            >
              Regresar a niveles
            </button>
            <button
              type="button"
              onClick={onVolver}
              className="rounded-xl border border-[#c8a45d] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#071a33] transition hover:bg-[#c8a45d]"
            >
              Regresar al inicio
            </button>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
            Inglés
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#071a33]">
            Planeación de Inglés · Nivel {nivel}
          </h2>
        </div>
        <div className="hidden rounded-2xl bg-[#071a33] px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em] text-white sm:block">
          Nivel {nivel}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Formulario de datos */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
            Datos de la planeación
          </p>
          <h3 className="mt-2 text-xl font-black text-[#071a33]">
            Captura los datos del grupo
          </h3>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <label>
              <span className={labelClass}>Nivel</span>
              <input className={readOnlyClass} value={`Nivel ${nivel}`} readOnly />
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
              <span className={labelClass}>Semanas</span>
              <input
                className={inputClass}
                type="number"
                min={1}
                placeholder="Ej. 18"
                value={semanas}
                onChange={(e) => setSemanas(e.target.value)}
              />
            </label>
            <label>
              <span className={labelClass}>Horas por semana</span>
              <input
                className={inputClass}
                type="number"
                min={1}
                placeholder="Ej. 3"
                value={horasPorSemana}
                onChange={(e) => setHorasPorSemana(e.target.value)}
              />
            </label>
            <label className="md:col-span-2">
              <span className={labelClass}>Observaciones (opcional)</span>
              <textarea
                className={`${inputClass} min-h-20 resize-y`}
                placeholder="Indicaciones adicionales para la planeación…"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* Panel de acción */}
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl bg-[#071a33] p-6 text-white shadow-xl shadow-slate-300/60">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d7bd7a]">
              Vista institucional
            </p>
            <h3 className="mt-3 text-2xl font-black leading-tight">
              Inglés · Nivel {nivel}
            </h3>
            <div className="mt-6 space-y-4 rounded-2xl border border-white/15 bg-white/10 p-5">
              <div className="flex justify-between gap-4 border-b border-white/10 pb-3 text-sm">
                <span className="text-slate-300">Grupo</span>
                <span className="font-bold">{grupo || "Por definir"}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/10 pb-3 text-sm">
                <span className="text-slate-300">Semanas</span>
                <span className="font-bold">{semanas || "Por definir"}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-300">Horas por semana</span>
                <span className="font-bold">{horasPorSemana || "Por definir"}</span>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-300">
              La biblioteca académica de Inglés se utiliza automáticamente para
              generar la planeación del nivel seleccionado.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={generarWord}
              disabled={
                generando || cargandoAvance || generandoPres || cargandoPresPool
              }
              className="rounded-2xl bg-[#c8a45d] px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] shadow-lg shadow-[#c8a45d]/30 transition hover:bg-[#d7bd7a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generando
                ? "Generando planeación…"
                : "Generar planeación en Word"}
            </button>
            <button
              type="button"
              onClick={abrirAvance}
              disabled={
                generando || cargandoAvance || generandoPres || cargandoPresPool
              }
              className="rounded-2xl bg-[#071a33] px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-slate-300/70 transition hover:bg-[#0b2a52] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargandoAvance
                ? "Preparando avance…"
                : "Generar Avance Programático"}
            </button>
          </div>

          <button
            type="button"
            onClick={abrirPresentacion}
            disabled={
              generando || cargandoAvance || generandoPres || cargandoPresPool
            }
            className="rounded-2xl border-2 border-[#c8a45d] bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] shadow-sm transition hover:bg-[#fffaf0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargandoPresPool
              ? "Preparando presentación…"
              : "Generar Presentación (PowerPoint)"}
          </button>

          {/* Exámenes — mismo motor de la FASE 1 (Parcial 1, Parcial 2 y
              Ordinario), alimentado con el índice académico del nivel. */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
              Exámenes
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Genera los exámenes del nivel (Parcial 1, Parcial 2 y Ordinario)
              con las plantillas institucionales.
            </p>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() =>
                  generarExamenIngles(
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
                  generarExamenIngles(
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
                  generarExamenIngles(
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
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Generando el examen… puede tardar hasta ~1 minuto. No cierres la
                página.
              </div>
            )}
          </div>

          {(generando || cargandoAvance || generandoPres || cargandoPresPool) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {generando
                ? "Generando la planeación"
                : cargandoPresPool
                  ? "Preparando la presentación"
                  : generandoPres
                    ? "Generando la presentación con IA"
                    : "Preparando el avance"}
              … puede tardar hasta ~1 minuto. No cierres la página.
            </div>
          )}

          {mensaje && (
            <div
              role="alert"
              className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${
                mensaje.tipo === "exito"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {mensaje.texto}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
