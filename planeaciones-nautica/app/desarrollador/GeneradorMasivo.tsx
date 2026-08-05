"use client";

// Generación masiva de presentaciones (solo panel de Desarrollador).
//
// Elige carrera → semestre → materia y genera UNA presentación por cada unidad
// del programa oficial, empaquetadas en un solo ZIP.
//
// Orquestación EN EL CLIENTE (no en una ruta de API), por tres razones:
//  1. el renderer compartido `generarPresentacionOficialV2` es de navegador
//     (pptxgenjs escribe vía Blob + <a download>); en el servidor escribiría a
//     disco, que en serverless no sirve;
//  2. N unidades × hasta 180 s de IA cada una revienta el maxDuration de una
//     función serverless (300 s), mientras que aquí cada unidad es una llamada
//     independiente a `/api/presentacion`, que ya tiene su propio presupuesto;
//  3. así el progreso por unidad es real y un fallo aislado no tira el lote.
//
// Reutiliza tal cual: `/api/presentacion` (contrato HTTP), el registro de
// presentaciones premium, el generador determinista y el renderer V2. No
// modifica ninguno.

import { useMemo, useState } from "react";
import { saveAs } from "file-saver";

import { calendarioDe } from "../config/calendario";
import {
  contenidosMaterias,
  contenidosMateriasMN,
} from "../data/contenidosMaterias";
import { materiasPorSemestre, materiasPorSemestreMN } from "../data/materias";
import { obtenerPresentacion } from "../data/presentaciones/registro";
import type { PresentacionV2 } from "../data/presentaciones/tiposV2";
import { esProgramaOficial, type ProgramaOficial } from "../data/tipos";
import { authFetch } from "../lib/authFetch";
import {
  construirPresentacionV2,
  TEMA_UNIDAD_COMPLETA,
} from "../lib/construirPresentacionV2";
import { LimiteError, lanzarSiLimite } from "../lib/limiteCliente";
import { generarPresentacionOficialV2 } from "../lib/pptxOficialV2";
import {
  capturarPptx,
  construirZipPresentaciones,
  trozoNombreSeguro,
  type EntradaZip,
} from "../lib/zipPresentaciones";

const ESCUELA =
  'Escuela Náutica Mercante de Tampico "Cap. de Altura Luis Gonzaga Priego González"';

/** Espera máxima por unidad al pedirle el guion a la IA. */
const TIMEOUT_IA_MS = 240000;

type Carrera = "PN" | "MN";
type EstadoUnidad = "pendiente" | "generando" | "ok" | "fallo" | "cancelada";
type Origen = "premium" | "cache" | "ia" | "plantilla";

type FilaUnidad = {
  numero: number;
  tema: string;
  estado: EstadoUnidad;
  origen?: Origen;
  detalle?: string;
  archivo?: string;
};

const ETIQUETA_ORIGEN: Record<Origen, string> = {
  premium: "deck premium del repositorio",
  cache: "guion de IA servido del cache",
  ia: "guion generado con IA",
  plantilla: "generador determinista (sin IA)",
};

/** "VII SEMESTRE" → impar → periodo Ago–Dic; par → Ene–Jun. */
const ROMANOS: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
};

function numeroSemestre(clave: string): number {
  const romano = clave.replace(/\s*SEMESTRE\s*$/i, "").trim().toUpperCase();
  return ROMANOS[romano] ?? 1;
}

function semestreBonito(clave: string): string {
  return clave ? `${clave.replace(/\s*SEMESTRE\s*$/i, "").trim()} Semestre` : "";
}

export function GeneradorMasivo() {
  const [carrera, setCarrera] = useState<Carrera>("PN");
  const [semestre, setSemestre] = useState("VII SEMESTRE");
  const [materia, setMateria] = useState("Simulador de Navegación I");
  const [docente, setDocente] = useState("");
  const [grupo, setGrupo] = useState("");
  const [concurrencia, setConcurrencia] = useState(2);
  const [forzarIA, setForzarIA] = useState(false);

  const [filas, setFilas] = useState<FilaUnidad[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{
    tipo: "exito" | "error" | "info";
    texto: string;
  } | null>(null);

  const menu = carrera === "MN" ? materiasPorSemestreMN : materiasPorSemestre;
  const fuente = carrera === "MN" ? contenidosMateriasMN : contenidosMaterias;

  const semestres = useMemo(() => Object.keys(menu), [menu]);
  const materias: string[] = useMemo(
    () => (menu as Record<string, string[]>)[semestre] ?? [],
    [menu, semestre],
  );

  const programa: ProgramaOficial | null = useMemo(() => {
    const p = (fuente as Record<string, unknown>)[materia];
    return esProgramaOficial(p) ? p : null;
  }, [fuente, materia]);

  const unidades = programa?.unidades ?? [];
  const licenciatura =
    carrera === "MN"
      ? "Licenciatura en Maquinista Naval"
      : "Licenciatura en Piloto Naval";
  const periodo = calendarioDe(
    numeroSemestre(semestre) % 2 === 1 ? "ago-dic" : "ene-jun",
  ).etiqueta;

  const cambiarCarrera = (c: Carrera) => {
    setCarrera(c);
    setSemestre("");
    setMateria("");
    setFilas([]);
    setAviso(null);
  };

  const cambiarSemestre = (s: string) => {
    setSemestre(s);
    setMateria("");
    setFilas([]);
    setAviso(null);
  };

  const cambiarMateria = (m: string) => {
    setMateria(m);
    setFilas([]);
    setAviso(null);
  };

  /* ------------------------- Generación de una unidad --------------------- */

  // Misma prioridad que la vista del docente: premium → IA → determinista.
  // Devuelve también de dónde salió, para que el RESUMEN.txt no mienta.
  const obtenerGuion = async (
    prog: ProgramaOficial,
    unidadNumero: number,
  ): Promise<{ pres: PresentacionV2; origen: Origen }> => {
    const premium = obtenerPresentacion(carrera, materia, unidadNumero);
    if (premium) return { pres: premium, origen: "premium" };

    const controlador = new AbortController();
    const limite = setTimeout(() => controlador.abort(), TIMEOUT_IA_MS);
    let motivoIA = "";
    try {
      const res = await authFetch("/api/presentacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrera,
          materia,
          unidadNumero,
          tema: TEMA_UNIDAD_COMPLETA,
          carreraDisplay: licenciatura,
          semestreDisplay: semestreBonito(semestre),
          forzar: forzarIA,
        }),
        signal: controlador.signal,
      });
      // 429 = límite mensual: se propaga para cancelar el resto del lote.
      await lanzarSiLimite(res);
      if (res.ok) {
        const data = (await res.json()) as {
          presentacion?: PresentacionV2;
          cacheado?: boolean;
        };
        if (data.presentacion) {
          return {
            pres: data.presentacion,
            origen: data.cacheado ? "cache" : "ia",
          };
        }
        motivoIA = "la API respondió sin presentación";
      } else {
        const detalle = (await res.json().catch(() => null)) as {
          error?: string;
          mensaje?: string;
        } | null;
        motivoIA = detalle?.error
          ? `${detalle.error}${detalle.mensaje ? ` — ${detalle.mensaje}` : ""}`
          : `HTTP ${res.status}`;
      }
    } catch (e) {
      if (e instanceof LimiteError) throw e;
      motivoIA =
        e instanceof DOMException && e.name === "AbortError"
          ? "la IA superó el tiempo de espera"
          : e instanceof Error
            ? e.message
            : "error desconocido";
    } finally {
      clearTimeout(limite);
    }

    const determinista = construirPresentacionV2({
      programa: prog,
      carrera: licenciatura,
      semestre: semestreBonito(semestre),
      unidadNumero,
      tema: TEMA_UNIDAD_COMPLETA,
    });
    if (determinista) {
      console.warn(
        `Unidad ${unidadNumero}: IA no disponible (${motivoIA}); se usó el generador determinista.`,
      );
      return { pres: determinista, origen: "plantilla" };
    }
    throw new Error(
      `sin guion para la unidad ${unidadNumero} (IA: ${motivoIA || "no disponible"})`,
    );
  };

  /* ------------------------------ Lote completo --------------------------- */

  const generarTodas = async () => {
    if (!programa || unidades.length === 0 || ocupado) return;
    const prog = programa;

    setOcupado(true);
    setAviso({
      tipo: "info",
      texto: `Generando ${unidades.length} unidad(es) de ${materia}. No cierres esta pestaña.`,
    });
    setFilas(
      unidades.map((u) => ({
        numero: u.numero,
        tema: u.tema,
        estado: "pendiente" as EstadoUnidad,
      })),
    );

    const actualizar = (numero: number, cambio: Partial<FilaUnidad>) =>
      setFilas((prev) =>
        prev.map((f) => (f.numero === numero ? { ...f, ...cambio } : f)),
      );

    const meta = { docente, grupo, periodo, escuela: ESCUELA };
    const baseNombre = trozoNombreSeguro(materia) || "materia";
    const resultados = new Map<number, FilaUnidad>();
    const entradas = new Map<number, EntradaZip>();
    let cancelado: string | null = null;

    const ordenadas = [...unidades].sort((a, b) => a.numero - b.numero);
    let siguiente = 0;

    const trabajador = async () => {
      for (;;) {
        const i = siguiente++;
        if (i >= ordenadas.length) return;
        const u = ordenadas[i];

        if (cancelado) {
          const fila: FilaUnidad = {
            numero: u.numero,
            tema: u.tema,
            estado: "cancelada",
            detalle: cancelado,
          };
          resultados.set(u.numero, fila);
          actualizar(u.numero, fila);
          continue;
        }

        actualizar(u.numero, { estado: "generando" });
        try {
          const { pres, origen } = await obtenerGuion(prog, u.numero);
          // La captura serializa internamente (parches globales del navegador);
          // solo el paso lento —la IA— corre en paralelo.
          const { datos } = await capturarPptx(() =>
            generarPresentacionOficialV2(pres, meta),
          );
          const archivo = `${String(u.numero).padStart(2, "0")}_${baseNombre}_U${u.numero}.pptx`;
          entradas.set(u.numero, { nombre: archivo, datos });
          const fila: FilaUnidad = {
            numero: u.numero,
            tema: u.tema,
            estado: "ok",
            origen,
            archivo,
          };
          resultados.set(u.numero, fila);
          actualizar(u.numero, fila);
        } catch (e) {
          const detalle =
            e instanceof Error ? e.message : "error desconocido";
          if (e instanceof LimiteError) cancelado = detalle;
          const fila: FilaUnidad = {
            numero: u.numero,
            tema: u.tema,
            estado: "fallo",
            detalle,
          };
          resultados.set(u.numero, fila);
          actualizar(u.numero, fila);
          console.error(`Unidad ${u.numero} falló:`, e);
        }
      }
    };

    const hilos = Math.max(1, Math.min(concurrencia, ordenadas.length));
    await Promise.all(Array.from({ length: hilos }, () => trabajador()));

    // El ZIP se entrega SIEMPRE con lo que sí se generó, y el RESUMEN.txt
    // explica unidad por unidad qué pasó: nunca un ZIP corto sin explicación.
    const ordenFinal = ordenadas.map((u) => u.numero);
    const archivos = ordenFinal
      .map((n) => entradas.get(n))
      .filter((x): x is EntradaZip => !!x);
    const resumen = construirResumen({
      programa: prog,
      materia,
      carrera,
      licenciatura,
      semestre: semestreBonito(semestre),
      periodo,
      filas: ordenFinal.map(
        (n) =>
          resultados.get(n) ?? {
            numero: n,
            tema: "",
            estado: "pendiente" as EstadoUnidad,
          },
      ),
    });

    try {
      const zip = construirZipPresentaciones(archivos, resumen);
      const nombreZip = `Presentaciones_${prog.clave}_${baseNombre}.zip`;
      saveAs(zip, nombreZip);
      const fallidas = ordenFinal.length - archivos.length;
      setAviso({
        tipo: fallidas > 0 ? "error" : "exito",
        texto:
          fallidas > 0
            ? `${nombreZip}: ${archivos.length} de ${ordenFinal.length} unidades. ${fallidas} sin generar — el detalle está en RESUMEN.txt dentro del ZIP.`
            : `${nombreZip}: las ${archivos.length} unidades se generaron correctamente.`,
      });
    } catch (e) {
      console.error("Error armando el ZIP:", e);
      setAviso({
        tipo: "error",
        texto: `No se pudo armar el ZIP: ${e instanceof Error ? e.message : "error desconocido"}`,
      });
    } finally {
      setOcupado(false);
    }
  };

  /* ---------------------------------- UI ---------------------------------- */

  const hechas = filas.filter((f) => f.estado === "ok").length;
  const terminadas = filas.filter(
    (f) => f.estado !== "pendiente" && f.estado !== "generando",
  ).length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-[#071a33]">
        Generar todas las unidades → ZIP
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Genera una presentación por cada unidad del programa oficial y las
        descarga en un único ZIP. Cada unidad es una llamada a la IA (lenta y de
        pago): se limita la concurrencia y se reutiliza el cache del servidor.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Carrera</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            disabled={ocupado}
            onChange={(e) => cambiarCarrera(e.target.value as Carrera)}
            value={carrera}
          >
            <option value="PN">Piloto Naval (PN)</option>
            <option value="MN">Maquinista Naval (MN)</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Semestre</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            disabled={ocupado}
            onChange={(e) => cambiarSemestre(e.target.value)}
            value={semestre}
          >
            <option value="">— Elige —</option>
            {semestres.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-slate-700">Materia</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            disabled={ocupado || materias.length === 0}
            onChange={(e) => cambiarMateria(e.target.value)}
            value={materia}
          >
            <option value="">— Elige —</option>
            {materias.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Docente (portada, opcional)
          </span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            disabled={ocupado}
            onChange={(e) => setDocente(e.target.value)}
            value={docente}
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Grupo (portada, opcional)
          </span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            disabled={ocupado}
            onChange={(e) => setGrupo(e.target.value)}
            value={grupo}
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Unidades en paralelo
          </span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            disabled={ocupado}
            onChange={(e) => setConcurrencia(Number(e.target.value))}
            value={concurrencia}
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-end gap-2 text-sm text-slate-700">
          <input
            checked={forzarIA}
            className="mb-2.5 h-4 w-4"
            disabled={ocupado}
            onChange={(e) => setForzarIA(e.target.checked)}
            type="checkbox"
          />
          <span className="mb-2 leading-tight">
            Regenerar con IA (ignora el cache del servidor)
          </span>
        </label>
      </div>

      {materia && !programa && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          «{materia}» no tiene programa oficial cargado en{" "}
          <code>app/data/contenidos</code>: no hay unidades que generar.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="rounded-lg bg-[#071a33] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={ocupado || !programa || unidades.length === 0}
          onClick={() => void generarTodas()}
          type="button"
        >
          {ocupado
            ? `Generando… ${terminadas}/${filas.length}`
            : `Generar ${unidades.length || ""} unidad(es) → ZIP`}
        </button>
        {programa && (
          <span className="text-xs text-slate-500">
            {programa.clave} · {unidades.length} unidad(es) · {periodo}
          </span>
        )}
      </div>

      {aviso && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            aviso.tipo === "exito"
              ? "bg-emerald-50 text-emerald-800"
              : aviso.tipo === "error"
                ? "bg-rose-50 text-rose-800"
                : "bg-sky-50 text-sky-800"
          }`}
        >
          {aviso.texto}
        </p>
      )}

      {filas.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {filas.map((f) => (
            <li
              className="flex items-start gap-3 px-3 py-2 text-sm"
              key={f.numero}
            >
              <span className="mt-0.5 w-16 shrink-0 font-mono text-xs text-slate-500">
                U{f.numero}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-slate-700">{f.tema}</span>
                {f.estado === "ok" && f.origen && (
                  <span className="block text-xs text-slate-500">
                    {ETIQUETA_ORIGEN[f.origen]} · {f.archivo}
                  </span>
                )}
                {(f.estado === "fallo" || f.estado === "cancelada") &&
                  f.detalle && (
                    <span className="block text-xs text-rose-600">
                      {f.detalle}
                    </span>
                  )}
              </span>
              <span className="shrink-0 text-xs font-semibold">
                {f.estado === "pendiente" && (
                  <span className="text-slate-400">en cola</span>
                )}
                {f.estado === "generando" && (
                  <span className="text-sky-600">generando…</span>
                )}
                {f.estado === "ok" && (
                  <span className="text-emerald-600">listo</span>
                )}
                {f.estado === "fallo" && (
                  <span className="text-rose-600">falló</span>
                )}
                {f.estado === "cancelada" && (
                  <span className="text-amber-600">cancelada</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {filas.length > 0 && !ocupado && (
        <p className="mt-2 text-xs text-slate-500">
          {hechas} de {filas.length} unidades en el ZIP.
        </p>
      )}
    </section>
  );
}

/* ------------------------------ RESUMEN.txt ------------------------------- */

function construirResumen(opts: {
  programa: ProgramaOficial;
  materia: string;
  carrera: Carrera;
  licenciatura: string;
  semestre: string;
  periodo: string;
  filas: FilaUnidad[];
}): string {
  const { programa, materia, licenciatura, semestre, periodo, filas } = opts;
  const ok = filas.filter((f) => f.estado === "ok");
  const problemas = filas.filter((f) => f.estado !== "ok");

  const lineas: string[] = [
    "RESUMEN DE GENERACIÓN MASIVA DE PRESENTACIONES",
    "==============================================",
    "",
    `Materia:     ${materia} (${programa.clave})`,
    `Carrera:     ${licenciatura}`,
    `Semestre:    ${semestre}`,
    `Periodo:     ${periodo}`,
    `Generado:    ${new Date().toLocaleString("es-MX")}`,
    "",
    `Unidades del programa oficial: ${filas.length}`,
    `Presentaciones incluidas en este ZIP: ${ok.length}`,
    `Unidades sin presentación: ${problemas.length}`,
    "",
    "DETALLE POR UNIDAD",
    "------------------",
  ];

  for (const f of filas) {
    if (f.estado === "ok") {
      lineas.push(
        `[OK]       Unidad ${f.numero} — ${f.tema}`,
        `           archivo: ${f.archivo}`,
        `           origen:  ${f.origen ? ETIQUETA_ORIGEN[f.origen] : "desconocido"}`,
      );
    } else if (f.estado === "cancelada") {
      lineas.push(
        `[CANCELADA] Unidad ${f.numero} — ${f.tema}`,
        `           motivo:  ${f.detalle ?? "el lote se detuvo antes de llegar a esta unidad"}`,
      );
    } else {
      lineas.push(
        `[FALLÓ]    Unidad ${f.numero} — ${f.tema}`,
        `           motivo:  ${f.detalle ?? "error desconocido"}`,
      );
    }
    lineas.push("");
  }

  if (problemas.length > 0) {
    lineas.push(
      "QUÉ HACER CON LAS UNIDADES QUE FALTAN",
      "-------------------------------------",
      "Vuelve a lanzar la generación masiva de esta materia: las unidades que",
      "ya se generaron salen del cache del servidor (sin coste ni espera) y solo",
      "se reintentan las que faltan.",
      "",
    );
  }

  return lineas.join("\r\n");
}
