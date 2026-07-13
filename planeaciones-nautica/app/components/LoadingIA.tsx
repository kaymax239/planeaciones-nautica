"use client";

import { useEffect, useState } from "react";

// Indicador de carga para las generaciones con IA: un spinner animado junto a un
// mensaje que rota cada 4 segundos para transmitir avance durante la espera.
// Es puramente presentacional; no dispara ninguna generación.

const MENSAJES_DEFAULT = [
  "Analizando el programa oficial...",
  "Redactando el contenido...",
  "Armando el documento...",
];

type LoadingIAProps = {
  /** Mensajes que rotan cada 4 s. */
  mensajes?: string[];
  /** Nota fija adicional (ej. "No cierres la página"). */
  nota?: string;
  className?: string;
};

export function LoadingIA({
  mensajes = MENSAJES_DEFAULT,
  nota,
  className = "",
}: LoadingIAProps) {
  const [i, setI] = useState(0);

  // Avanza el índice cada 4 s; el módulo al renderizar mantiene el mensaje
  // dentro del rango aunque cambie la cantidad de mensajes.
  useEffect(() => {
    const id = setInterval(() => setI((prev) => prev + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const mensaje = mensajes[i % mensajes.length];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 ${className}`}
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{mensaje}</p>
        {nota && <p className="mt-0.5 text-xs text-amber-700/80">{nota}</p>}
      </div>
    </div>
  );
}
