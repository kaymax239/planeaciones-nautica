"use client";

// Herramienta de revisión: el administrador sube la planeación (.docx) de un
// docente, opcionalmente anota errores/sugerencias, la IA propone correcciones
// puntuales y él aprueba cuáles se aplican. Genera un .docx corregido conservando
// el formato original.

import { useRef, useState, type ChangeEvent } from "react";
import { saveAs } from "file-saver";

import { authFetch } from "../lib/authFetch";
import {
  aplicarCorreccionesDocx,
  extraerTextoDocx,
  type Reemplazo,
} from "../lib/docxTexto";

type Sugerencia = {
  original: string;
  sugerido: string;
  motivo: string;
  categoria?: string;
  aprobada: boolean;
};

type Estado = "vacio" | "listo-para-analizar" | "analizando" | "revisando";

const COLOR_CATEGORIA: Record<string, string> = {
  ortografía: "bg-rose-100 text-rose-700",
  gramática: "bg-amber-100 text-amber-700",
  redacción: "bg-sky-100 text-sky-700",
  formato: "bg-violet-100 text-violet-700",
  contenido: "bg-emerald-100 text-emerald-700",
};

function badgeCategoria(cat?: string): string {
  return (cat && COLOR_CATEGORIA[cat]) || "bg-slate-100 text-slate-600";
}

export function CorrectorPlaneaciones() {
  const bufferRef = useRef<ArrayBuffer | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [texto, setTexto] = useState("");
  const [notas, setNotas] = useState("");
  const [estado, setEstado] = useState<Estado>("vacio");
  const [error, setError] = useState("");
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [resumen, setResumen] = useState<string>("");

  async function alElegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    setError("");
    setResumen("");
    setSugerencias([]);
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.name.toLowerCase().endsWith(".docx")) {
      setError("Solo se aceptan archivos Word (.docx).");
      return;
    }

    try {
      const buffer = await archivo.arrayBuffer();
      const plano = extraerTextoDocx(buffer);
      if (plano.trim().length < 20) {
        setError("No pude leer texto suficiente del documento.");
        return;
      }
      bufferRef.current = buffer;
      setNombreArchivo(archivo.name);
      setTexto(plano);
      setEstado("listo-para-analizar");
    } catch {
      setError("No pude leer el archivo. ¿Es un .docx válido?");
    }
  }

  async function analizar() {
    setError("");
    setResumen("");
    setEstado("analizando");
    try {
      const res = await authFetch("/api/corregir-planeacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, notas }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.mensaje || "No se pudo analizar el documento.");
        setEstado("listo-para-analizar");
        return;
      }
      const lista: Sugerencia[] = (data.sugerencias || []).map(
        (s: Omit<Sugerencia, "aprobada">) => ({ ...s, aprobada: true }),
      );
      setSugerencias(lista);
      setEstado("revisando");
    } catch {
      setError("Error de conexión al analizar. Intenta de nuevo.");
      setEstado("listo-para-analizar");
    }
  }

  function alternar(i: number) {
    setSugerencias((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, aprobada: !s.aprobada } : s)),
    );
  }

  function generar() {
    if (!bufferRef.current) return;
    setError("");
    const aprobadas: Reemplazo[] = sugerencias
      .filter((s) => s.aprobada)
      .map((s) => ({ original: s.original, sugerido: s.sugerido }));

    if (aprobadas.length === 0) {
      setError("No hay ninguna corrección aprobada para aplicar.");
      return;
    }

    const { blob, aplicadas, noAplicadas } = aplicarCorreccionesDocx(
      bufferRef.current,
      aprobadas,
    );
    const nombreSalida = nombreArchivo.replace(/\.docx$/i, "") + " - corregida.docx";
    saveAs(blob, nombreSalida);

    let msg = `Se aplicaron ${aplicadas} de ${aprobadas.length} correcciones y se descargó "${nombreSalida}".`;
    if (noAplicadas.length > 0) {
      msg += ` ${noAplicadas.length} no se localizaron automáticamente (el texto estaba dividido por estilos en el Word) — revísalas a mano.`;
    }
    setResumen(msg);
  }

  const aprobadasCount = sugerencias.filter((s) => s.aprobada).length;

  return (
    <div className="space-y-6">
      {/* Paso 1: subir archivo */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#071a33]">
          1 · Sube la planeación del docente (.docx)
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#071a33] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d2a52]">
            Elegir archivo Word
            <input
              type="file"
              accept=".docx"
              className="hidden"
              onChange={alElegirArchivo}
            />
          </label>
          {nombreArchivo ? (
            <span className="text-sm text-slate-600">
              📄 {nombreArchivo}
            </span>
          ) : (
            <span className="text-sm text-slate-400">Ningún archivo aún</span>
          )}
        </div>
      </div>

      {/* Paso 2: notas + analizar */}
      {estado !== "vacio" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#071a33]">
            2 · Errores o sugerencias (opcional)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Anota lo que notaste; la IA les dará prioridad. Si lo dejas vacío,
            revisa el documento completo.
          </p>
          <textarea
            className="mt-3 h-24 w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 focus:border-[#071a33] focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Ej.: revisar ortografía del objetivo general; la unidad 2 tiene fechas mal; homologar 'Inglés Marítimo'…"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
          <button
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
            onClick={() => void analizar()}
            disabled={estado === "analizando"}
            type="button"
          >
            {estado === "analizando"
              ? "Analizando con IA…"
              : "Analizar con IA"}
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          {error}
        </div>
      ) : null}

      {/* Paso 3: revisar sugerencias */}
      {estado === "revisando" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#071a33]">
              3 · Revisa y aprueba ({aprobadasCount}/{sugerencias.length}{" "}
              seleccionadas)
            </h2>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              onClick={generar}
              disabled={aprobadasCount === 0}
              type="button"
            >
              Generar Word corregido
            </button>
          </div>

          {sugerencias.length === 0 ? (
            <p className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              ✅ La IA no encontró errores. El documento se ve bien.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {sugerencias.map((s, i) => (
                <li
                  key={i}
                  className={`rounded-lg border p-4 transition-colors ${
                    s.aprobada
                      ? "border-slate-200 bg-white"
                      : "border-slate-200 bg-slate-50 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
                      checked={s.aprobada}
                      onChange={() => alternar(i)}
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeCategoria(
                          s.categoria,
                        )}`}
                      >
                        {s.categoria || "corrección"}
                      </span>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="rounded bg-rose-50 px-2 py-1 text-rose-800 line-through decoration-rose-400">
                          {s.original}
                        </p>
                        <p className="rounded bg-emerald-50 px-2 py-1 text-emerald-800">
                          {s.sugerido}
                        </p>
                      </div>
                      {s.motivo ? (
                        <p className="mt-1.5 text-xs text-slate-500">
                          {s.motivo}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {resumen ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
          {resumen}
        </div>
      ) : null}
    </div>
  );
}
