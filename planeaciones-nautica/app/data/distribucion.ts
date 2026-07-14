// Distribuye un programa oficial en las sesiones semanales del F-32.
// Estrategia: POR UNIDAD, proporcional al número de subtemas (no hay
// planeaciones históricas confiables para espejar). Las fechas vienen de
// calendario.ts; las puntuaciones (instrumento de evaluación) se pasan ya
// resueltas desde evaluacion.ts. NO inventa temas ni subtemas.

import { distribuirFechas, etiquetaSemanaF32 } from "./calendario";
import type { ProgramaOficial, UnidadOficial } from "./tipos";

export type SemanaRender = {
  semana: string;
  tema: string;
  secuencia: string;
  recursos: string;
  producto: string;
  evaluacion: string;
};

export type BloqueRender = {
  unidad: string;
  objetivoEspecifico: string;
  estrategia: string;
  semanas: SemanaRender[];
};

// Estrategias didácticas: estilo de redacción tomado del patrón de las
// planeaciones históricas (lista separada por comas de estrategias docentes).
// No es contenido académico; aplica por igual a cualquier materia.
const ESTRATEGIA =
  "Activación de conocimientos previos, exposición del docente, aprendizaje situado, resolución de ejercicios y análisis de casos, trabajo individual y colaborativo, elaboración de productos y prácticas supervisadas.";
const RECURSOS =
  "Computadora, presentación, material didáctico y recursos digitales.";
const PRODUCTO = "Actividad, ejercicio o evidencia de la sesión y participación.";

/** Reparte un arreglo en n grupos contiguos lo más equilibrados posible. */
function repartirContiguo<T>(arr: T[], n: number): T[][] {
  const res: T[][] = [];
  const base = Math.floor(arr.length / n);
  let extra = arr.length % n;
  let i = 0;
  for (let g = 0; g < n; g++) {
    const size = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    res.push(arr.slice(i, i + size));
    i += size;
  }
  return res;
}

/** Número de semanas por unidad, proporcional a subtemas, que suma `total`. */
function semanasPorUnidad(unidades: UnidadOficial[], total: number): number[] {
  const pesos = unidades.map((u) => Math.max(1, u.subtemas.length));
  const suma = pesos.reduce((a, b) => a + b, 0);
  const wpu = pesos.map((w) => Math.max(1, Math.round((total * w) / suma)));
  let diff = total - wpu.reduce((a, b) => a + b, 0);
  // Ajuste: la carga por semana = pesos[i]/wpu[i].
  while (diff !== 0 && unidades.length > 0) {
    if (diff > 0) {
      let idx = 0;
      for (let i = 1; i < wpu.length; i++)
        if (pesos[i] / wpu[i] > pesos[idx] / wpu[idx]) idx = i;
      wpu[idx]++;
      diff--;
    } else {
      let idx = -1;
      for (let i = 0; i < wpu.length; i++)
        if (wpu[i] > 1 && (idx < 0 || pesos[i] / wpu[i] < pesos[idx] / wpu[idx]))
          idx = i;
      if (idx < 0) break;
      wpu[idx]--;
      diff++;
    }
  }
  return wpu;
}

// Secuencia didáctica con el ESTILO de redacción de las planeaciones históricas
// (El docente explica… los cadetes practican… cierre con rúbrica y
// retroalimentación). El CONTENIDO académico (tema y subtemas) proviene del PDF.
function secuencia(unidad: UnidadOficial, subtemas: string[]): string {
  const foco =
    subtemas.length > 0
      ? subtemas
          .map((s) => s.replace(/^\d+(\.\d+)*\.?\s*/, "").replace(/\.\s*$/, ""))
          .join("; ")
      : unidad.tema;
  return [
    `Inicio: El docente activa los conocimientos previos mediante preguntas detonadoras sobre "${unidad.tema}" y su relación con el ámbito marítimo; los cadetes comparten lo que conocen y se encuadra el propósito de la sesión.`,
    `Desarrollo: El docente explica ${foco}, con exposición y ejemplos aplicados; los cadetes desarrollan ejercicios y actividades —individuales y en equipo— aplicando los contenidos, con acompañamiento y resolución de dudas.`,
    `Cierre: Se socializan los resultados y, con base en una rúbrica o lista de cotejo, se proporciona retroalimentación identificando fortalezas y áreas de mejora; se registra la evidencia de aprendizaje de la sesión.`,
  ].join("\n\n");
}

/** Convierte un programa oficial en los bloques de unidad/semanas del F-32. */
export function distribuirPrograma(
  programa: ProgramaOficial,
  puntuaciones: string,
  // Etiqueta de la celda "Semana" (1-indexada). Por defecto, calendario
  // Ago–Dic 2026. El generador pasa la del periodo elegido (ver app/config/calendario).
  etiquetaSemana?: (numero: number) => string,
): BloqueRender[] {
  const total = programa.horas.semanas;
  const fechas = distribuirFechas(total);
  const etiqueta =
    etiquetaSemana ??
    ((n: number) => {
      const f = fechas[n - 1];
      return f ? etiquetaSemanaF32(f) : `Semana ${n}`;
    });
  const wpu = semanasPorUnidad(programa.unidades, total);

  let slot = 0;
  return programa.unidades.map((u, ui) => {
    const grupos = repartirContiguo(u.subtemas, wpu[ui]);
    const semanas: SemanaRender[] = grupos.map((g, k) => {
      slot++;
      const numeroSemana = slot;
      const titulo =
        k === 0 ? `Unidad ${u.numero}: ${u.tema}` : `Unidad ${u.numero} (cont.)`;
      const contenido = g.length
        ? g.join("\n")
        : u.transversal
          ? "Contenidos de actualidad del sector marítimo portuario (selección a cargo del docente)."
          : u.tema;
      return {
        semana: etiqueta(numeroSemana),
        tema: `${titulo}\n${contenido}`,
        secuencia: secuencia(u, g),
        recursos: RECURSOS,
        producto: PRODUCTO,
        evaluacion: puntuaciones,
      };
    });
    return {
      unidad: String(u.numero),
      objetivoEspecifico: u.objetivoEspecifico,
      estrategia: ESTRATEGIA,
      semanas,
    };
  });
}
