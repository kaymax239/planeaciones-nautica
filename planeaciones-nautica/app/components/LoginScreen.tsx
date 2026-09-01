"use client";

// Pantalla de acceso, pensada para docentes mayores y poco habituados a la
// computadora: un solo botón grande, texto claro y grande, y un mensaje de error
// evidente si el correo no es institucional. Estilo azul marino / dorado.

import { useState } from "react";
import { useAuth } from "../lib/authContext";
import { Monograma } from "./Monograma";

export function LoginScreen() {
  const { entrar, error, noConfigurado } = useAuth();
  const [ocupado, setOcupado] = useState(false);

  const manejarEntrar = async () => {
    setOcupado(true);
    try {
      await entrar();
    } finally {
      setOcupado(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071a33] px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border-2 border-[#c8a45d]/40 bg-white p-8 text-center shadow-2xl sm:p-10">
        <div className="mb-6 flex justify-center">
          <Monograma
            className="h-28 w-28 sm:h-32 sm:w-32"
            textClassName="text-xl sm:text-2xl"
          />
        </div>

        <h1 className="text-3xl font-black leading-tight text-[#071a33] sm:text-4xl">
          Planeaciones Náuticas
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Escuela Náutica Mercante de Tampico
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border-2 border-red-300 bg-red-50 px-5 py-4 text-base font-semibold text-red-800"
          >
            {error}
          </div>
        )}

        {noConfigurado && (
          <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
            El acceso aún no está configurado. Contacta al administrador del
            sistema.
          </div>
        )}

        <button
          type="button"
          onClick={manejarEntrar}
          disabled={ocupado || noConfigurado}
          className="mt-8 w-full rounded-2xl bg-[#c8a45d] px-6 py-5 text-lg font-black uppercase tracking-[0.08em] text-[#071a33] shadow-lg shadow-[#c8a45d]/30 transition hover:bg-[#d7bd7a] disabled:cursor-not-allowed disabled:opacity-60 sm:text-xl"
        >
          {ocupado ? "Entrando…" : "Entrar con mi correo de FIDENA"}
        </button>

        <p className="mt-6 text-sm leading-relaxed text-slate-500">
          Usa tu correo institucional{" "}
          <span className="font-bold text-[#071a33]">@fidena.edu.mx</span>. Si
          eres docente invitado, entra con el correo que la Coordinación
          registró.
        </p>
      </div>
    </main>
  );
}
