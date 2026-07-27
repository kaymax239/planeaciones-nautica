import type { ProgramaOficial } from "./tipos";
// Piloto Naval (PN) — contenido oficial de los PDFs FIDENA.
import { contenidosSemestre1 } from "./contenidos/semestre1";
import { contenidosSemestre2 } from "./contenidos/semestre2";
import { contenidosSemestre3 } from "./contenidos/semestre3";
import { contenidosSemestre4 } from "./contenidos/semestre4";
import { contenidosSemestre5 } from "./contenidos/semestre5";
import { contenidosSemestre6 } from "./contenidos/semestre6";
import { contenidosSemestre7 } from "./contenidos/semestre7";
import { contenidosSemestre8 } from "./contenidos/semestre8";
// Maquinista/Mecánico Naval (MN) — contenido oficial de los PDFs FIDENA.
import { contenidosMN1 } from "./contenidos/mn1";
import { contenidosMN2 } from "./contenidos/mn2";
import { contenidosMN3 } from "./contenidos/mn3";
import { contenidosMN5 } from "./contenidos/mn5";
import { contenidosMN6 } from "./contenidos/mn6";
import { contenidosMN7 } from "./contenidos/mn7";
import { contenidosMN8 } from "./contenidos/mn8";

export const contenidosMaterias: Record<string, ProgramaOficial> = {
  ...contenidosSemestre1,
  ...contenidosSemestre2,
  ...contenidosSemestre3,
  ...contenidosSemestre4,
  ...contenidosSemestre5,
  ...contenidosSemestre6,
  ...contenidosSemestre7,
  ...contenidosSemestre8,
};

// MN se mantiene en un espacio de nombres separado porque comparte nombres de
// materia con PN (p. ej. "Electricidad", "Álgebra" en el 1.er año común).
// (MN no tiene semestre 4 en el lote 2026 → no hay mn4.)
export const contenidosMateriasMN: Record<string, ProgramaOficial> = {
  ...contenidosMN1,
  ...contenidosMN2,
  ...contenidosMN3,
  ...contenidosMN5,
  ...contenidosMN6,
  ...contenidosMN7,
  ...contenidosMN8,
};
