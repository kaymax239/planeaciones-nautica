"use client";

// Vista de administrador: lista el consumo mensual con IA de cada docente. Solo
// accesible para la cuenta administradora (se verifica también en el servidor).

import { useEffect, useState } from "react";
import { useAuth } from "../lib/authContext";
import { authFetch } from "../lib/authFetch";
import { LIMITES } from "../lib/config";
import { LoginScreen } from "../components/LoginScreen";
import { Monograma } from "../components/Monograma";

type UsoDocente = {
  uid: string;
  email: string;
  nombre: string;
  uso: { presentaciones: number; examenes: number; planeaciones: number };
};

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function mesLegible(mes: string): string {
  const [y, m] = mes.split("-");
  const nombre = MESES[(Number(m) || 1) - 1] ?? mes;
  return `${nombre} de ${y}`;
}

function Celda({ n, max }: { n: number; max: number }) {
  const alLimite = n >= max;
  return (
    <td className="px-4 py-3 text-center">
      <span
        className={`font-black ${alLimite ? "text-red-600" : "text-[#071a33]"}`}
      >
        {n}
      </span>
      <span className="text-slate-400"> / {max}</span>
    </td>
  );
}

export default function AdminPage() {
  const { usuario, cargando, esAdmin } = useAuth();
  const [datos, setDatos] = useState<{
    mes: string;
    docentes: UsoDocente[];
  } | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario || !esAdmin) return;
    setCargandoDatos(true);
    setError(null);
    authFetch("/api/admin/uso")
      .then(async (res) => {
        if (!res.ok) {
          setError("No se pudo cargar el consumo de los docentes.");
          return;
        }
        setDatos(await res.json());
      })
      .catch(() => setError("No se pudo cargar el consumo de los docentes."))
      .finally(() => setCargandoDatos(false));
  }, [usuario, esAdmin]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#071a33] text-white">
        <p className="text-sm font-semibold">Cargando…</p>
      </main>
    );
  }

  if (!usuario) return <LoginScreen />;

  if (!esAdmin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#eef2f7] px-4 text-center">
        <h1 className="text-2xl font-black text-[#071a33]">Acceso restringido</h1>
        <p className="mt-3 max-w-md text-sm text-slate-600">
          Esta sección es solo para el administrador del sistema.
        </p>
        <a
          href="/"
          className="mt-6 rounded-2xl bg-[#c8a45d] px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-[#071a33] transition hover:bg-[#d7bd7a]"
        >
          Volver al inicio
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef2f7] text-slate-900">
      <header className="border-b-2 border-[#c8a45d] bg-[#071a33] text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-8">
          <Monograma className="h-11 w-11" textClassName="text-[11px]" />
          <div className="leading-tight">
            <p className="text-base font-black sm:text-lg">Panel de administrador</p>
            <p className="text-[11px] text-slate-300 sm:text-xs">
              Consumo mensual con IA por docente
            </p>
          </div>
          <a
            href="/"
            className="ml-auto rounded-full border border-[#c8a45d]/50 px-4 py-2 text-xs font-bold text-[#d7bd7a] transition hover:bg-white/10"
          >
            Volver al inicio
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-black text-[#071a33]">
            Consumo de {datos ? mesLegible(datos.mes) : "este mes"}
          </h1>
          <p className="text-xs text-slate-500">
            Límites: Presentaciones {LIMITES.presentaciones} · Exámenes{" "}
            {LIMITES.examenes} · Planeaciones {LIMITES.planeaciones}
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800">
            {error}
          </div>
        )}

        {cargandoDatos && !datos && (
          <p className="text-sm text-slate-500">Cargando consumo…</p>
        )}

        {datos && datos.docentes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500">
            Aún no hay consumo registrado este mes.
          </div>
        )}

        {datos && datos.docentes.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-[#f8fafc] text-left text-xs font-bold uppercase tracking-[0.12em] text-[#c8a45d]">
                  <th className="px-4 py-3">Docente</th>
                  <th className="px-4 py-3 text-center">Presentaciones</th>
                  <th className="px-4 py-3 text-center">Exámenes</th>
                  <th className="px-4 py-3 text-center">Planeaciones</th>
                </tr>
              </thead>
              <tbody>
                {datos.docentes.map((d) => (
                  <tr key={d.uid} className="border-b border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#071a33]">
                        {d.nombre || d.email}
                      </p>
                      <p className="text-xs text-slate-500">{d.email}</p>
                    </td>
                    <Celda
                      n={d.uso.presentaciones}
                      max={LIMITES.presentaciones}
                    />
                    <Celda n={d.uso.examenes} max={LIMITES.examenes} />
                    <Celda n={d.uso.planeaciones} max={LIMITES.planeaciones} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
