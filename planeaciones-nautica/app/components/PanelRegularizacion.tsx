"use client";

// Pestaña "Regularización": genera en un ZIP el Plan Estratégico de
// Recuperación (FID-FOR-F-05) y la Lista de Asistencia de Regularización
// (FID-FOR-F-04), prellenados con los temas de las semanas no cursadas. Es
// genérico: la página le pasa las semanas ya resueltas de la planeación.

import { useMemo, useState } from "react";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import {
  diasHabilesDeLaSemana,
  parsearEstudiantes,
  renderizarRegularizacion,
  repartirEnSesiones,
  SEMANAS_PATRIA,
  temaSesion,
  textoFechasSesiones,
  type SemanaRegularizacion,
} from "../lib/regularizacion";

type Props = {
  semanas: SemanaRegularizacion[];
  asignatura: string;
  docente: string;
  /** Texto de la columna "Semestre" del F-04 (grupo, o semestre si no hay grupo). */
  grupo: string;
  objetivoGeneral: string;
  ponderacion?: string;
  jefeCarreraInicial: string;
  subdirectorInicial: string;
  /** Trozo seguro para el nombre del archivo. */
  nombreArchivo: string;
};

const aISO = (f: Date) =>
  `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
const deISO = (s: string) => {
  const [a, m, d] = s.split("-").map(Number);
  return new Date(a, m - 1, d);
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#c8a45d] focus:ring-2 focus:ring-[#c8a45d]/30";
const etiquetaClass =
  "mb-2 mt-5 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500";

export function PanelRegularizacion(p: Props) {
  const disponibles = p.semanas;
  const [semanasSel, setSemanasSel] = useState<number[]>(() =>
    SEMANAS_PATRIA.filter((n) => disponibles.some((s) => s.numero === n)),
  );
  const [estudiantesTexto, setEstudiantesTexto] = useState("");
  const [fechas, setFechas] = useState<string[]>(() =>
    diasHabilesDeLaSemana(new Date()).map(aISO),
  );
  const [fechaNueva, setFechaNueva] = useState("");
  const [horario, setHorario] = useState("");
  const [periodo, setPeriodo] = useState<1 | 2 | 3>(1);
  // El docente viene de los datos generales (PN/MN); aquí se puede corregir, y en
  // Inglés —que no tiene ese campo— se captura aquí mismo.
  const [docenteEditado, setDocenteEditado] = useState<string | null>(null);
  const docente = docenteEditado ?? p.docente;
  const [jefeCarrera, setJefeCarrera] = useState(p.jefeCarreraInicial);
  const [subdirector, setSubdirector] = useState(p.subdirectorInicial);
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  const estudiantes = useMemo(() => parsearEstudiantes(estudiantesTexto), [estudiantesTexto]);
  const semanasElegidas = useMemo(
    () => disponibles.filter((s) => semanasSel.includes(s.numero)).sort((a, b) => a.numero - b.numero),
    [disponibles, semanasSel],
  );
  const sesiones = useMemo(() => [...fechas].sort().map(deISO), [fechas]);
  const reparto = useMemo(
    () => repartirEnSesiones(semanasElegidas, sesiones.length),
    [semanasElegidas, sesiones.length],
  );

  const alternarSemana = (n: number) =>
    setSemanasSel((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  const agregarFecha = () => {
    if (!fechaNueva || fechas.includes(fechaNueva)) return;
    setFechas((prev) => [...prev, fechaNueva].sort());
    setFechaNueva("");
  };

  const faltantes = [
    !docente.trim() && "el nombre del docente",
    semanasElegidas.length === 0 && "al menos una semana a recuperar",
    sesiones.length === 0 && "al menos una fecha de sesión",
    estudiantes.length === 0 && "la lista de cadetes",
  ].filter(Boolean) as string[];

  const generar = async () => {
    if (faltantes.length) return;
    setGenerando(true);
    setMensaje(null);
    try {
      const [r05, r04] = await Promise.all([
        fetch("/templates/Regularizacion-F05.docx"),
        fetch("/templates/Regularizacion-F04.docx"),
      ]);
      if (!r05.ok || !r04.ok) {
        throw new Error(`No se pudieron cargar las plantillas (HTTP ${r05.status}/${r04.status}).`);
      }
      const { f05, f04 } = renderizarRegularizacion(
        await r05.arrayBuffer(),
        await r04.arrayBuffer(),
        {
          asignatura: p.asignatura,
          docente: docente.trim(),
          grupo: p.grupo,
          estudiantes,
          semanas: semanasElegidas,
          sesiones,
          horario,
          periodoEvaluacion: periodo,
          objetivoGeneral: p.objetivoGeneral,
          ponderacion: p.ponderacion,
          jefeCarrera: jefeCarrera.trim(),
          subdirector: subdirector.trim(),
        },
      );
      const zip = new PizZip();
      zip.file(`F05_Plan_Recuperacion_${p.nombreArchivo}.docx`, f05);
      zip.file(`F04_Asistencia_Regularizacion_${p.nombreArchivo}.docx`, f04);
      saveAs(
        zip.generate({ type: "blob", mimeType: "application/zip" }),
        `Regularizacion_${p.nombreArchivo}.zip`,
      );
      setMensaje({
        tipo: "exito",
        texto: `Listo: F-05 y F-04 de ${estudiantes.length} cadete(s), ${sesiones.length} sesión(es), ${semanasElegidas.length} semana(s) recuperadas. Revisa y firma.`,
      });
    } catch (error) {
      console.error("Error generando regularización:", error);
      setMensaje({
        tipo: "error",
        texto: `No se pudieron generar los formatos. ${error instanceof Error ? error.message : ""}`,
      });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8a45d]">
          Regularización académica
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Genera el <strong>Plan Estratégico de Recuperación (F-05)</strong> y la{" "}
          <strong>Lista de Asistencia de Regularización (F-04)</strong> con los
          temas de la planeación de las semanas que los cadetes no cursaron. Por
          defecto vienen marcadas las semanas 3 a 7 (17 ago – 19 sep), el periodo
          de Operación Patria; ajústalas si tu caso es otro.
        </p>

        <label className={etiquetaClass}>Semanas a recuperar</label>
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {disponibles.map((s) => {
            const marcada = semanasSel.includes(s.numero);
            return (
              <label
                key={s.numero}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                  marcada ? "border-[#c8a45d] bg-[#fffaf0]" : "border-slate-200 bg-white hover:border-[#c8a45d]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcada}
                  onChange={() => alternarSemana(s.numero)}
                  className="mt-0.5 h-4 w-4 accent-[#c8a45d]"
                />
                <span>
                  <span className="block font-bold text-[#071a33]">
                    {s.etiqueta.split("\n").slice(0, 2).join(" · ")}
                  </span>
                  <span className="block text-xs text-slate-600">{s.tema.split("\n")[0]}</span>
                </span>
              </label>
            );
          })}
        </div>

        <label className={etiquetaClass}>
          Cadetes a regularizar ({estudiantes.length})
        </label>
        <textarea
          value={estudiantesTexto}
          onChange={(e) => setEstudiantesTexto(e.target.value)}
          rows={7}
          placeholder={"Un nombre por renglón (puedes pegarlo de Excel):\nAPELLIDO APELLIDO NOMBRE\nAPELLIDO APELLIDO NOMBRE"}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Fechas de las sesiones ({sesiones.length})
          </label>
          <ul className="space-y-2">
            {sesiones.map((f, i) => (
              <li key={aISO(f)} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#071a33]">{textoFechasSesiones([f])}</span>
                  <button
                    type="button"
                    onClick={() => setFechas((prev) => prev.filter((x) => x !== aISO(f)))}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                </div>
                <p className="mt-1 whitespace-pre-line text-xs text-slate-600">
                  {temaSesion(reparto[i] ?? [])}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input
              type="date"
              value={fechaNueva}
              onChange={(e) => setFechaNueva(e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={agregarFecha}
              className="shrink-0 rounded-xl border border-[#c8a45d] px-4 text-xs font-black uppercase tracking-[0.12em] text-[#071a33] hover:bg-[#fffaf0]"
            >
              Agregar
            </button>
          </div>

          <label className={etiquetaClass}>Nombre del docente</label>
          <input
            value={docente}
            onChange={(e) => setDocenteEditado(e.target.value)}
            placeholder="Nombre y grado del docente"
            className={inputClass}
          />

          <label className={etiquetaClass}>Horario (opcional)</label>
          <input
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            placeholder="p. ej. 14:00 a 16:00 hrs"
            className={inputClass}
          />

          <label className={etiquetaClass}>Periodo de evaluación</label>
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPeriodo(n)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                  periodo === n
                    ? "border-[#c8a45d] bg-[#fffaf0] text-[#071a33]"
                    : "border-slate-200 text-slate-500 hover:border-[#c8a45d]"
                }`}
              >
                {n === 1 ? "1er" : n === 2 ? "2do" : "3er"}
              </button>
            ))}
          </div>

          <label className={etiquetaClass}>Vo. Bo. Jefe de Carrera</label>
          <input value={jefeCarrera} onChange={(e) => setJefeCarrera(e.target.value)} className={inputClass} />
          <label className={etiquetaClass}>Vo. Bo. Subdirector de Formación</label>
          <input value={subdirector} onChange={(e) => setSubdirector(e.target.value)} className={inputClass} />
        </div>

        <div className="rounded-3xl bg-[#071a33] p-6 text-white shadow-xl shadow-slate-300/60">
          <button
            type="button"
            onClick={generar}
            disabled={generando || faltantes.length > 0}
            className="w-full rounded-2xl bg-[#c8a45d] px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#071a33] shadow-lg shadow-[#c8a45d]/30 transition hover:bg-[#d7bd7a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generando ? "Generando..." : "Generar F-05 y F-04 (ZIP)"}
          </button>
          {faltantes.length > 0 && (
            <p className="mt-3 text-xs font-semibold text-[#d7bd7a]">
              Falta: {faltantes.join(", ")}.
            </p>
          )}
          {mensaje && (
            <div
              role="alert"
              className={`mt-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
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
