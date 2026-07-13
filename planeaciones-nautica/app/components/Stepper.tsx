"use client";

// Stepper horizontal persistente del flujo. Es puramente presentacional: recibe
// la lista de pasos con su estado ya calculado. El paso activo se pinta en
// dorado; los pasos completados muestran palomita y, si traen `onClick`, son
// clicables para regresar a ese punto del flujo.

export type EstadoPaso = "completado" | "activo" | "pendiente";

export type PasoStepper = {
  etiqueta: string;
  estado: EstadoPaso;
  /** Si se define, el paso es clicable (para regresar a un paso ya completado). */
  onClick?: () => void;
};

export function Stepper({ pasos }: { pasos: PasoStepper[] }) {
  return (
    <nav
      aria-label="Progreso"
      className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <ol className="flex min-w-max items-center gap-2">
        {pasos.map((paso, i) => {
          const clicable = typeof paso.onClick === "function";
          const cuerpo = (
            <>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  paso.estado === "activo"
                    ? "bg-[#c8a45d] text-[#071a33] ring-2 ring-[#c8a45d]/40"
                    : paso.estado === "completado"
                      ? "bg-[#071a33] text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {paso.estado === "completado" ? "✓" : i + 1}
              </span>
              <span
                className={`text-xs font-black uppercase tracking-[0.12em] sm:text-sm ${
                  paso.estado === "activo"
                    ? "text-[#c8a45d]"
                    : paso.estado === "completado"
                      ? "text-[#071a33]"
                      : "text-slate-400"
                }`}
              >
                {paso.etiqueta}
              </span>
            </>
          );

          return (
            <li key={paso.etiqueta} className="flex items-center gap-2">
              {clicable ? (
                <button
                  type="button"
                  onClick={paso.onClick}
                  className="flex items-center gap-2 rounded-full px-1 py-0.5 transition hover:opacity-70"
                >
                  {cuerpo}
                </button>
              ) : (
                <span
                  className="flex items-center gap-2 px-1 py-0.5"
                  aria-current={paso.estado === "activo" ? "step" : undefined}
                >
                  {cuerpo}
                </span>
              )}
              {i < pasos.length - 1 && (
                <span
                  className={`h-0.5 w-6 rounded-full sm:w-10 ${
                    pasos[i + 1].estado === "pendiente"
                      ? "bg-slate-200"
                      : "bg-[#c8a45d]"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
