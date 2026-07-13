// Límites mensuales de uso con IA por docente, guardados en Firestore y
// validados EN EL SERVIDOR. La cuenta administradora no tiene límite.
//
// Modelo de datos — colección "usage", un documento por usuario (id = uid):
//   { uid, email, nombre, meses: { "YYYY-MM": { presentaciones, examenes, planeaciones } } }
//
// El reinicio es por mes calendario (zona horaria de México): al cambiar de mes
// se escribe en una clave de mes distinta, de modo que los contadores del mes
// anterior quedan en cero automáticamente.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";
import {
  LIMITES,
  ETIQUETA_CATEGORIA,
  CONTACTO_SOPORTE,
  type CategoriaUso,
} from "../config";
import type { Sesion } from "./auth";

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

/** Mes calendario actual ("YYYY-MM") en la zona horaria de México. */
export function mesActual(fecha = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(fecha);
  const y = partes.find((p) => p.type === "year")?.value ?? "0000";
  const m = partes.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}`;
}

/** Nombre en español del mes SIGUIENTE al indicado (para el mensaje de reinicio). */
export function nombreMesSiguiente(mes = mesActual()): string {
  const m = Number(mes.split("-")[1]) || 1; // 1..12
  return MESES[m % 12]; // m%12: julio(7)→agosto, diciembre(12)→enero
}

type Contadores = Record<CategoriaUso, number>;

function contadoresDe(datos: unknown, mes: string): Contadores {
  const meses =
    (datos as { meses?: Record<string, Partial<Contadores>> } | undefined)
      ?.meses ?? {};
  const m = meses[mes] ?? {};
  return {
    presentaciones: m.presentaciones ?? 0,
    examenes: m.examenes ?? 0,
    planeaciones: m.planeaciones ?? 0,
  };
}

export type ResultadoLimite =
  | { ok: true }
  | { ok: false; respuesta: Response };

/**
 * Verifica (sin incrementar) si el docente puede consumir una unidad de la
 * categoría este mes. El administrador nunca tiene límite. Devuelve una Response
 * 429 lista para retornar si el límite está alcanzado.
 */
export async function verificarLimite(
  sesion: Sesion,
  categoria: CategoriaUso,
): Promise<ResultadoLimite> {
  if (sesion.esAdmin) return { ok: true };

  const mes = mesActual();
  const snap = await adminDb().collection("usage").doc(sesion.uid).get();
  const actual = contadoresDe(snap.data(), mes)[categoria];
  const limite = LIMITES[categoria];

  if (actual >= limite) {
    return {
      ok: false,
      respuesta: Response.json(
        {
          error: "limite_alcanzado",
          categoria,
          mensaje: `Alcanzaste tu límite mensual de ${ETIQUETA_CATEGORIA[categoria]}. Se renueva el 1 de ${nombreMesSiguiente(
            mes,
          )}. Si necesitas más, contacta al ${CONTACTO_SOPORTE}.`,
        },
        { status: 429 },
      ),
    };
  }
  return { ok: true };
}

/**
 * Suma 1 al contador del mes para la categoría (atómico). No hace nada para el
 * administrador. Se llama SOLO tras una generación exitosa.
 */
export async function contarUso(
  sesion: Sesion,
  categoria: CategoriaUso,
): Promise<void> {
  if (sesion.esAdmin) return;
  const mes = mesActual();
  await adminDb()
    .collection("usage")
    .doc(sesion.uid)
    .set(
      {
        uid: sesion.uid,
        email: sesion.email,
        nombre: sesion.nombre,
        meses: { [mes]: { [categoria]: FieldValue.increment(1) } },
      },
      { merge: true },
    );
}

/** Consumo del mes actual de un docente (0 si no hay registro). */
export async function leerUso(uid: string): Promise<Contadores> {
  const snap = await adminDb().collection("usage").doc(uid).get();
  return contadoresDe(snap.data(), mesActual());
}

export type UsoDocente = {
  uid: string;
  email: string;
  nombre: string;
  uso: Contadores;
};

/** Consumo del mes actual de TODOS los docentes (para la vista de administrador). */
export async function leerTodos(): Promise<UsoDocente[]> {
  const mes = mesActual();
  const snaps = await adminDb().collection("usage").get();
  return snaps.docs
    .map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: (data?.email as string) ?? "",
        nombre: (data?.nombre as string) ?? "",
        uso: contadoresDe(data, mes),
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
