"use client";

// Zona de Desarrollador: acceso solo para la cuenta administradora
// (vcadenaa@fidena.edu.mx). Reutiliza el login con Google ya existente. Si entra
// otra cuenta institucional, se muestra "acceso denegado". El servidor vuelve a
// verificar que sea el administrador en cada llamada a la IA.

import Link from "next/link";

import { useAuth } from "../lib/authContext";
import { LoginScreen } from "../components/LoginScreen";
import { CorrectorPlaneaciones } from "./CorrectorPlaneaciones";

export default function DesarrolladorPage() {
  const { usuario, cargando, esAdmin, salir } = useAuth();

  if (cargando) {
    return (
      <main className="grid min-h-screen place-items-center text-sm text-slate-500">
        Cargando…
      </main>
    );
  }

  // Sin sesión: mostrar el login institucional existente.
  if (!usuario) {
    return <LoginScreen />;
  }

  // Con sesión pero no es el administrador: acceso denegado.
  if (!esAdmin) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-[#071a33]">
            Acceso restringido
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Esta zona es solo para el administrador del sistema. Tu cuenta{" "}
            <span className="font-medium">{usuario.email}</span> no tiene
            permiso.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => void salir()}
              type="button"
            >
              Cerrar sesión
            </button>
            <Link
              className="rounded-lg bg-[#071a33] px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-[#0d2a52]"
              href="/"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Administrador: herramienta de corrección de planeaciones.
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Zona de Desarrollador
          </p>
          <h1 className="mt-0.5 text-xl font-semibold text-[#071a33]">
            Corregir planeaciones
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Sube la planeación de un docente, la IA sugiere correcciones y tú
            apruebas cuáles se aplican.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-right text-xs text-slate-500 sm:block">
            {usuario.email}
          </span>
          <Link
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
            href="/"
          >
            Inicio
          </Link>
        </div>
      </header>

      <CorrectorPlaneaciones />
    </main>
  );
}
