import pptxgen from "pptxgenjs";
import type { Bloque } from "../data/presentaciones/tipos";
import type { BloqueV2, DiapositivaV2, PresentacionV2 } from "../data/presentaciones/tiposV2";
import { C, CW, estLineas, LX, PAGE_W, renderBloque, TOP, type MetaPresentacion } from "./pptxOficial";

export type { MetaPresentacion };

/** Última cota vertical utilizable del área de contenido: por debajo empieza el
 *  pie (la regla gris va en y = 7.02) y, a partir de 7.5, la diapositiva se
 *  acaba. Lo que se dibuje más abajo NO se proyecta: se pierde sin aviso. */
const FONDO = 6.95;

/**
 * Renderer V2 (capa visual). Reutiliza el contenido oficial de V1 y los bloques
 * base (vía renderBloque), añadiendo diagramas, mapas conceptuales, gráficos
 * matemáticos y diapositivas de transición. Descarga `..._U1_V2.pptx`.
 */
export async function generarPresentacionOficialV2(
  pres: PresentacionV2,
  meta: MetaPresentacion = {},
): Promise<string> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = meta.docente || "Planeaciones Náutica";
  pptx.company = "Universidad Marítima y Portuaria de México";
  pptx.subject = pres.asignatura;
  pptx.title = `${pres.asignatura} — ${pres.unidad} (V2)`;
  pptx.theme = { headFontFace: "Arial", bodyFontFace: "Arial" };

  // Las diapositivas de contenido que no caben se reparten en varias páginas
  // ANTES de numerar, para que el "n / total" del pie siga cuadrando. Cuando
  // todo cabe —el caso normal— hay una página por diapositiva y el resultado es
  // idéntico al de siempre.
  const paginas = paginarDeck(pres);
  const total = paginas.length;
  paginas.forEach((p, i) => {
    const d = p.diapositiva;
    if (d.layout === "portada") renderPortadaModerna(pptx, pres, meta);
    else if (d.layout === "divisor") renderDivisor(pptx, d, i + 1, total);
    else if (d.layout === "transicion") renderTransicion(pptx, d, i + 1, total);
    else if (d.layout === "cierre") renderCierre(pptx, d, meta);
    else renderContenido(pptx, d, pres, i + 1, total, p.bloques, p.continuacion);
  });

  const archivo = pres.nombreArchivo || `Presentacion_${pres.clave}_U${numeroUnidad(pres.unidad)}_V2.pptx`;
  await pptx.writeFile({ fileName: archivo });
  return archivo;
}

/* ------------------------- Paginación del contenido ----------------------- */
//
// El renderer apila bloques sumando alturas y NO comprueba nunca si se sale de
// la diapositiva: con lo que el propio prompt autoriza (3 bloques, 6 ítems por
// bloque) una diapositiva de tabla + bullets + nota terminaba en y = 8.84 sobre
// un lienzo de 7.5 pulgadas. El texto no se recorta ni falla: simplemente no
// aparece al proyectar. Aquí se mide antes de dibujar y lo que no cabe pasa a
// una página de continuación.

type PaginaDeck = {
  diapositiva: DiapositivaV2;
  /** Bloques que van en ESTA página (solo aplica a las de contenido). */
  bloques: BloqueV2[];
  /** true si es la 2ª página o posterior de una misma diapositiva. */
  continuacion: boolean;
};

function paginarDeck(pres: PresentacionV2): PaginaDeck[] {
  const paginas: PaginaDeck[] = [];
  for (const d of pres.diapositivas) {
    const especial = d.layout && d.layout !== "contenido";
    if (especial) {
      paginas.push({ diapositiva: d, bloques: d.bloques, continuacion: false });
      continue;
    }
    for (const [i, bloques] of repartirBloques(d).entries())
      paginas.push({ diapositiva: d, bloques, continuacion: i > 0 });
  }
  return paginas;
}

/** Reparte los bloques de una diapositiva de contenido en páginas que caben. */
function repartirBloques(d: DiapositivaV2): BloqueV2[][] {
  const inicio = (cont: boolean) => (d.subtitulo && !cont ? TOP + 0.25 : TOP);
  const paginas: BloqueV2[][] = [];
  let actual: BloqueV2[] = [];
  let y = inicio(false);

  const cerrar = () => {
    paginas.push(actual);
    actual = [];
    y = inicio(true); // las páginas 2ª y siguientes no repiten el subtítulo
  };

  for (const bloque of d.bloques) {
    let resto: BloqueV2 | null = bloque;
    while (resto) {
      const alto = altoBloqueV2(resto);
      if (y + alto <= FONDO) {
        actual.push(resto);
        y += alto;
        break;
      }
      const partido = partirBloque(resto, FONDO - y);
      if (partido) {
        actual.push(partido[0]);
        cerrar();
        resto = partido[1];
        continue;
      }
      if (actual.length === 0) {
        // Ni siquiera cabe en una página vacía y no es divisible (un mapa
        // conceptual, p. ej.): se dibuja igual, sola. Es lo máximo que puede
        // hacerse sin inventar contenido.
        actual.push(resto);
        cerrar();
        break;
      }
      cerrar(); // se reintenta el mismo bloque en una página limpia
    }
  }
  if (actual.length > 0 || paginas.length === 0) paginas.push(actual);
  return paginas;
}

/**
 * Altura que consume un bloque, incluido su margen inferior. Réplica exacta de
 * la aritmética de `renderBloque` (pptxOficial.ts) y de los render V2 de abajo:
 * si allí cambia una constante, hay que cambiarla aquí (no hay forma de medir
 * sin dibujar). Solo se usa para decidir el salto de página.
 */
function altoBloqueV2(b: BloqueV2): number {
  switch (b.tipo) {
    /* V2 */
    case "flujo": {
      const n = b.nodos.length + (b.resultado ? 1 : 0);
      if (n === 0) return 0;
      return b.orientacion === "horizontal"
        ? 1.9
        : 0.15 + n * 0.6 + (n - 1) * 0.34 + 0.2;
    }
    case "mapaConceptual":
      return b.ramas.length ? 4.6 : 0;
    case "diagramaArbol":
      return b.ramas.length ? 3.35 : 0;
    case "grafico":
      if (b.clase === "areaCuadrado") return 4.6;
      if (b.clase === "parabola") return 4.3;
      if (b.clase === "pascal") return 0.35 + b.filas.length * 0.72 + 0.7;
      return 1.8;

    /* V1 (renderBloque) */
    case "bullets":
      return Math.max(0.6, b.items.length * 0.52) + 0.15;
    case "nota":
      return Math.max(0.55, estLineas(b.texto, 110) * 0.32 + 0.3) + 0.2;
    case "formulas":
      return Math.max(0.9, b.items.length * 0.5 + 0.35) + 0.2;
    case "formulaDestacada":
      return 1.15 + 0.22;
    case "tabla":
      return (b.filas.length + 1) * 0.44 + 0.25;
    case "definicion":
      return 0.55 + estLineas(b.texto, 92) * 0.32 + 0.2 + 0.2;
    case "pasos":
      return (
        0.2 + 0.4 + 0.42 + b.pasos.length * 0.5 + (b.resultado ? 0.6 : 0) + 0.2 + 0.22
      );
    case "ejercicioGuiado":
      return (
        0.42 + 0.4 + (b.pista ? 0.4 : 0) + b.items.length * 0.42 + 0.45 + 0.22
      );
    case "proceso":
      return 0.95 + 0.25;
    case "comparacion":
      return (
        0.55 + Math.max(b.izq.items.length, b.der.items.length) * 0.42 + 0.3 + 0.25
      );
    case "aplicacion":
      return (
        0.45 + 0.42 + b.pasos.length * 0.4 + (b.resultado ? 0.55 : 0) + 0.3 + 0.22
      );
    case "ejemplo":
      return 0.55 + (b.pasos.length + 1) * 0.42 + 0.2;
    case "ejercicio":
      return 0.55 + b.items.length * 0.42 + 0.2;
  }
}

/**
 * Parte en dos un bloque de lista o tabla para que la primera mitad quepa en
 * `disponible`. Devuelve null si no es divisible o si no cabe ni un ítem: en
 * ese caso el bloque entero salta de página, nunca se recorta.
 */
function partirBloque(
  b: BloqueV2,
  disponible: number,
): [BloqueV2, BloqueV2] | null {
  const corte = (n: number, cabidas: number): number =>
    Math.min(n - 1, Math.max(0, Math.floor(cabidas)));

  if (b.tipo === "bullets" || b.tipo === "ejercicio") {
    const holgura = b.tipo === "bullets" ? 0.15 : 0.75;
    const paso = b.tipo === "bullets" ? 0.52 : 0.42;
    const k = corte(b.items.length, (disponible - holgura) / paso);
    if (k < 1) return null;
    return [
      { ...b, items: b.items.slice(0, k) },
      { ...b, items: b.items.slice(k) },
    ];
  }
  if (b.tipo === "tabla") {
    const k = corte(b.filas.length, (disponible - 0.25) / 0.44 - 1);
    if (k < 1) return null;
    // La continuación repite los encabezados: una tabla sin cabecera en la
    // página siguiente son datos sin nombre de columna.
    return [
      { ...b, filas: b.filas.slice(0, k) },
      { ...b, filas: b.filas.slice(k) },
    ];
  }
  return null;
}

/* Deriva el número de unidad desde el texto "Unidad 1: ..." (fallback "1"). */
function numeroUnidad(unidad: string): string {
  return unidad.match(/unidad\s+(\d+)/i)?.[1] ?? "1";
}

/* Kicker y subtítulo de portada: usa los del deck si existen; si no, los deriva. */
function portadaTextos(pres: PresentacionV2): { kicker: string; subtitulo: string } {
  const m = pres.unidad.match(/unidad\s+(\d+)\s*[:.-]?\s*(.*)$/i);
  const numero = m?.[1];
  const temaUnidad = m?.[2]?.trim();
  const kicker =
    pres.kicker ??
    `${pres.asignatura.toUpperCase()}${numero ? ` · UNIDAD ${numero}` : ""}`;
  const subtitulo = pres.subtituloPortada ?? temaUnidad ?? pres.asignatura;
  return { kicker, subtitulo };
}

/* ----------------------------- Portada moderna ---------------------------- */

function compass(pptx: pptxgen, s: pptxgen.Slide, cx: number, cy: number, r: number) {
  [r, r * 0.72, r * 0.44].forEach((rr, i) => {
    s.addShape(pptx.ShapeType.ellipse, {
      x: cx - rr, y: cy - rr, w: rr * 2, h: rr * 2,
      fill: { type: "solid", color: C.azul, transparency: 100 },
      line: { color: C.dorado, width: 1, transparency: i === 0 ? 50 : 70 },
    });
  });
  // Cruz + diagonales (rosa de los vientos)
  const arms: [number, number, number, number][] = [
    [cx - r, cy, cx + r, cy],
    [cx, cy - r, cx, cy + r],
    [cx - r * 0.7, cy - r * 0.7, cx + r * 0.7, cy + r * 0.7],
    [cx - r * 0.7, cy + r * 0.7, cx + r * 0.7, cy - r * 0.7],
  ];
  arms.forEach((a) => linea(pptx, s, a[0], a[1], a[2], a[3], C.dorado, 0.75, 70));
  // Aguja
  s.addShape(pptx.ShapeType.triangle, { x: cx - 0.14, y: cy - r * 0.62, w: 0.28, h: r * 0.62, fill: { color: C.dorado, transparency: 30 }, line: { type: "none" } });
}

function renderPortadaModerna(pptx: pptxgen, pres: PresentacionV2, meta: MetaPresentacion) {
  const s = pptx.addSlide();
  s.background = { color: C.azul };

  // Panel derecho con la rosa de los vientos
  s.addShape(pptx.ShapeType.rect, { x: 8.4, y: 0, w: 4.933, h: 7.5, fill: { color: C.azulMedio }, line: { type: "none" } });
  compass(pptx, s, 10.85, 3.75, 2.35);

  // Línea vertical dorada divisoria
  s.addShape(pptx.ShapeType.rect, { x: 8.4, y: 0, w: 0.04, h: 7.5, fill: { color: C.dorado }, line: { type: "none" } });

  // Escudo + institución
  s.addShape(pptx.ShapeType.ellipse, { x: 0.85, y: 0.8, w: 0.95, h: 0.95, fill: { color: C.azulMedio }, line: { color: C.dorado, width: 1.5 } });
  s.addText("UMPM", { x: 0.85, y: 0.8, w: 0.95, h: 0.95, fontSize: 12, bold: true, color: C.dorado, align: "center", valign: "middle" });
  s.addText("UNIVERSIDAD MARÍTIMA Y PORTUARIA DE MÉXICO", { x: 1.95, y: 0.9, w: 6.2, h: 0.35, fontSize: 12, bold: true, color: C.dorado, charSpacing: 1 });
  s.addText(meta.escuela || "Escuela Náutica Mercante de Tampico", { x: 1.95, y: 1.26, w: 6.2, h: 0.3, fontSize: 11, color: "CBD5E1" });

  // Kicker + título grande
  const { kicker, subtitulo } = portadaTextos(pres);
  s.addText(kicker, { x: 0.85, y: 2.7, w: 7.2, h: 0.35, fontSize: 14, bold: true, color: C.dorado, charSpacing: 3 });
  s.addText(pres.asignatura, { x: 0.8, y: 3.05, w: 7.4, h: 1.3, fontSize: 60, bold: true, color: C.blanco, fit: "shrink" });
  s.addShape(pptx.ShapeType.rect, { x: 0.88, y: 4.45, w: 2.2, h: 0.05, fill: { color: C.dorado }, line: { type: "none" } });
  s.addText(subtitulo, { x: 0.85, y: 4.62, w: 7.2, h: 0.55, fontSize: 22, color: "E2E8F0" });

  // Metadatos. Los campos vacíos NO dejan su separador (p. ej. `semestre` llega
  // como "" desde /api/presentacion cuando no hay semestreDisplay).
  const metadatos = unir(
    "   ·   ",
    pres.carrera,
    pres.semestre,
    pres.clave ? `Clave ${pres.clave}` : "",
  );
  if (metadatos)
    s.addText(metadatos, { x: 0.85, y: 5.5, w: 7.2, h: 0.35, fontSize: 12, color: "94A3B8" });

  // Banda inferior
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 6.85, w: 8.4, h: 0.65, fill: { color: C.azulMedio }, line: { type: "none" } });
  const pie = `Docente: ${meta.docente || "Por definir"}     ·     Grupo: ${meta.grupo || "—"}     ·     ${meta.periodo || "Jul–Dic 2026"}`;
  s.addText(pie, { x: 0.85, y: 6.85, w: 7.4, h: 0.65, fontSize: 11, color: "E2E8F0", valign: "middle" });
}

/* ------------------------- Divisor / Transición / Cierre ------------------ */

function renderDivisor(pptx: pptxgen, d: DiapositivaV2, num: number, total: number) {
  const s = pptx.addSlide();
  s.background = { color: C.azul };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.28, h: 7.5, fill: { color: C.dorado }, line: { type: "none" } });
  compass(pptx, s, 11.7, 1.0, 2.4);
  if (d.etiqueta)
    s.addText(d.etiqueta.toUpperCase(), { x: 1.0, y: 2.55, w: 11, h: 0.45, fontSize: 16, bold: true, color: C.dorado, charSpacing: 3 });
  s.addText(d.titulo, { x: 1.0, y: 3.05, w: 11.3, h: 1.4, fontSize: 38, bold: true, color: C.blanco, fit: "shrink" });
  s.addShape(pptx.ShapeType.rect, { x: 1.04, y: 4.55, w: 3.2, h: 0.06, fill: { color: C.dorado }, line: { type: "none" } });
  if (d.subtitulo)
    s.addText(d.subtitulo, { x: 1.04, y: 4.8, w: 10.5, h: 0.7, fontSize: 16, color: "CBD5E1", italic: true });
  s.addText(`${num} / ${total}`, { x: 11.9, y: 6.95, w: 1.0, h: 0.35, fontSize: 10, color: C.dorado, align: "right" });
}

function renderTransicion(pptx: pptxgen, d: DiapositivaV2, num: number, total: number) {
  const s = pptx.addSlide();
  s.background = { color: C.gris };
  // Número gigante fantasma
  s.addText(String(num).padStart(2, "0"), { x: 7.6, y: 1.2, w: 5.4, h: 5.0, fontSize: 220, bold: true, color: "E4E9F0", align: "right", valign: "middle" });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.28, h: 7.5, fill: { color: C.dorado }, line: { type: "none" } });
  if (d.etiqueta)
    s.addText(d.etiqueta.toUpperCase(), { x: 1.0, y: 2.7, w: 8, h: 0.4, fontSize: 14, bold: true, color: C.dorado, charSpacing: 3 });
  s.addText(d.titulo, { x: 1.0, y: 3.1, w: 8.5, h: 1.1, fontSize: 40, bold: true, color: C.azul, fit: "shrink" });
  s.addShape(pptx.ShapeType.rect, { x: 1.04, y: 4.35, w: 2.6, h: 0.06, fill: { color: C.dorado }, line: { type: "none" } });
  if (d.subtitulo)
    s.addText(d.subtitulo, { x: 1.04, y: 4.55, w: 7.5, h: 0.6, fontSize: 16, color: C.tenue, italic: true });
}

/** Despedida por defecto cuando la diapositiva de cierre no trae
 *  `mensajeFinal`. El literal anterior ("¡Gracias!  Continuamos con la Unidad
 *  2.") se imprimía en CUALQUIER deck: en el de la Unidad 5 anunciaba una
 *  unidad que ya pasó, y en los de Inglés —English-only por regla del prompt—
 *  metía español. Es la misma frase que ya usa el generador determinista
 *  (construirPresentacionV2), y no afirma nada que pueda ser falso. */
const DESPEDIDA = "¡Gracias por su atención!";

function renderCierre(pptx: pptxgen, d: DiapositivaV2, meta: MetaPresentacion) {
  const s = pptx.addSlide();
  s.background = { color: C.azul };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: PAGE_W, h: 0.32, fill: { color: C.dorado }, line: { type: "none" } });
  compass(pptx, s, 11.9, 5.4, 2.3);
  if (d.etiqueta)
    s.addText(d.etiqueta.toUpperCase(), { x: 0.85, y: 0.75, w: 11, h: 0.4, fontSize: 13, bold: true, color: C.dorado, charSpacing: 2 });
  s.addText(d.titulo, { x: 0.85, y: 1.15, w: 11.6, h: 0.8, fontSize: 32, bold: true, color: C.blanco, fit: "shrink" });
  // El cierre termina en la banda del mensaje final (y = 6.55): por debajo de
  // esa cota el texto se pierde. Si los bloques no caben, el cuadro se ciñe al
  // hueco y PowerPoint encoge la letra (fit: "shrink") en vez de escribir
  // fuera de la diapositiva.
  const TECHO_CIERRE = 6.45;
  let y = 2.35;
  for (const b of d.bloques) {
    if (y >= TECHO_CIERRE) break;
    if (b.tipo === "nota") {
      const h = Math.min(0.8, TECHO_CIERRE - y);
      s.addText(b.texto, {
        x: 1.0, y, w: 9.8, h, fontSize: 14, italic: true, color: C.azul, valign: "middle",
        shape: pptx.ShapeType.roundRect, rectRadius: 0.08, fill: { color: C.dorado }, align: "left", inset: 0.12, fit: "shrink",
      });
      y += h + 0.2;
    } else {
      // Cualquier otro bloque se reduce a sus líneas de texto: este layout solo
      // sabe pintar viñetas, y hasta ahora lo que no fuera bullets/nota se caía
      // del cierre sin dejar rastro.
      const items = b.tipo === "bullets" ? b.items : lineasDeBloque(b);
      if (items.length === 0) continue;
      const h = Math.min(items.length * 0.55, TECHO_CIERRE - y);
      s.addText(
        items.map((t) => ({ text: t, options: { bullet: { code: "25B8" }, color: "E2E8F0", fontSize: 16, paraSpaceAfter: 10 } })),
        { x: 1.0, y, w: 9.6, h, valign: "top", fit: "shrink" },
      );
      y += h + 0.2;
    }
  }
  s.addText(d.mensajeFinal ?? DESPEDIDA,{ x: 0.85, y: 6.55, w: 8, h: 0.5, fontSize: 15, bold: true, color: C.dorado, valign: "middle" });
  s.addText(`Docente: ${meta.docente || "Por definir"}`, { x: 8.5, y: 6.55, w: 4.0, h: 0.5, fontSize: 12, color: "CBD5E1", align: "right", valign: "middle" });
}

/* -------------------------------- Contenido ------------------------------- */

function renderContenido(
  pptx: pptxgen,
  d: DiapositivaV2,
  pres: PresentacionV2,
  num: number,
  total: number,
  bloques: BloqueV2[] = d.bloques,
  continuacion = false,
) {
  const s = pptx.addSlide();
  s.background = { color: C.blanco };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: PAGE_W, h: 0.2, fill: { color: C.dorado }, line: { type: "none" } });
  s.addShape(pptx.ShapeType.rect, { x: LX, y: 0.55, w: 0.12, h: 0.62, fill: { color: C.dorado }, line: { type: "none" } });
  if (d.etiqueta)
    s.addText(d.etiqueta.toUpperCase(), { x: LX + 0.25, y: 0.5, w: 11, h: 0.3, fontSize: 11, bold: true, color: C.dorado, charSpacing: 2 });
  const titulo = continuacion ? `${d.titulo} (cont.)` : d.titulo;
  s.addText(titulo, { x: LX + 0.25, y: 0.74, w: CW - 0.25, h: 0.6, fontSize: 25, bold: true, color: C.azul, fit: "shrink" });
  // El subtítulo lo dibuja V1 desde siempre; V2 lo ignoraba, así que el texto
  // que la IA pone ahí (y el esquema admite) desaparecía del .pptx sin rastro.
  if (d.subtitulo && !continuacion)
    s.addText(d.subtitulo, { x: LX + 0.25, y: 1.3, w: CW - 0.25, h: 0.3, fontSize: 13, italic: true, color: C.tenue });

  let y = d.subtitulo && !continuacion ? TOP + 0.25 : TOP;
  for (const b of bloques) y = renderBloqueV2(pptx, s, b, y);

  s.addShape(pptx.ShapeType.rect, { x: LX, y: 7.02, w: CW, h: 0.012, fill: { color: C.grisBorde }, line: { type: "none" } });
  s.addText(unir(" · ", pres.asignatura, pres.unidad), { x: LX, y: 7.08, w: 9, h: 0.3, fontSize: 9, color: C.tenue });
  s.addText(`${num} / ${total}`, { x: 11.9, y: 7.08, w: 1.0, h: 0.3, fontSize: 9, color: C.tenue, align: "right" });
}

/* --------------------------- Bloques V2 (visuales) ------------------------ */

function renderBloqueV2(pptx: pptxgen, s: pptxgen.Slide, b: BloqueV2, y: number): number {
  switch (b.tipo) {
    // Un diagrama sin ramas/nodos no es un diagrama vacío: es un hueco de 3-4
    // pulgadas en medio de la diapositiva (y, en la recta numérica, una
    // división por cero que manda las marcas al infinito). Se omite.
    case "flujo":
      return b.nodos.length ? renderFlujo(pptx, s, b, y) : y;
    case "mapaConceptual":
      return b.ramas.length ? renderMapa(pptx, s, b, y) : y;
    case "diagramaArbol":
      return b.ramas.length ? renderArbol(pptx, s, b, y) : y;
    case "grafico":
      if (b.clase === "areaCuadrado") return renderAreaCuadrado(pptx, s, b.etiqueta, y);
      if (b.clase === "parabola")
        return b.labels.length && b.valores.length ? renderParabola(pptx, s, b, y) : y;
      if (b.clase === "pascal") return b.filas.length ? renderPascal(pptx, s, b, y) : y;
      return b.marcas.length > 1 ? renderRecta(pptx, s, b, y) : y;
    default: {
      // Bloques base de V1 (mismo contenido académico). Si llegara un tipo que
      // renderBloque no conoce (un deck cacheado con un esquema anterior, p.
      // ej.) devuelve undefined: sin esta red, `y` se vuelve NaN y TODO lo que
      // sigue en la diapositiva se dibuja en coordenadas basura.
      const siguiente = renderBloque(pptx, s, b as Bloque, y);
      if (typeof siguiente === "number" && Number.isFinite(siguiente))
        return siguiente;
      console.warn("Presentación V2: bloque no renderizable, se omite:", b);
      return y;
    }
  }
}

function renderFlujo(
  pptx: pptxgen, s: pptxgen.Slide,
  b: Extract<BloqueV2, { tipo: "flujo" }>, y: number,
): number {
  const nodes = [
    ...b.nodos.map((t) => ({ t, res: false })),
    ...(b.resultado ? [{ t: b.resultado, res: true }] : []),
  ];
  if (b.orientacion === "horizontal") {
    const n = nodes.length;
    const gap = 0.55;
    const bw = (CW - gap * (n - 1)) / n;
    const bh = 1.0;
    const yy = y + 0.5;
    nodes.forEach((nd, i) => {
      const x = LX + i * (bw + gap);
      s.addText(nd.t, {
        x, y: yy, w: bw, h: bh, fontSize: 14, bold: nd.res, color: nd.res ? C.verde : C.texto,
        align: "center", valign: "middle", inset: 0.08,
        shape: pptx.ShapeType.roundRect, rectRadius: 0.08,
        fill: { color: nd.res ? C.verdeClaro : C.gris }, line: { color: nd.res ? C.verde : C.azulMedio, width: nd.res ? 1.5 : 1 },
      });
      if (i < n - 1)
        s.addShape(pptx.ShapeType.rightArrow, { x: x + bw + 0.08, y: yy + bh / 2 - 0.12, w: gap - 0.16, h: 0.24, fill: { color: C.dorado }, line: { type: "none" } });
    });
    return yy + bh + 0.4;
  }
  // vertical
  const bw = 8.0;
  const bx = (PAGE_W - bw) / 2;
  const bh = 0.6;
  const gap = 0.34;
  let cy = y + 0.15;
  nodes.forEach((nd, i) => {
    s.addText(nd.t, {
      x: bx, y: cy, w: bw, h: bh, fontSize: 14, bold: nd.res, color: nd.res ? C.verde : C.texto,
      align: "center", valign: "middle",
      shape: pptx.ShapeType.roundRect, rectRadius: 0.08,
      fill: { color: nd.res ? C.verdeClaro : C.gris }, line: { color: nd.res ? C.verde : C.azulMedio, width: nd.res ? 1.5 : 1 },
    });
    cy += bh;
    if (i < nodes.length - 1) {
      s.addShape(pptx.ShapeType.downArrow, { x: PAGE_W / 2 - 0.13, y: cy + 0.02, w: 0.26, h: gap - 0.06, fill: { color: C.dorado }, line: { type: "none" } });
      cy += gap;
    }
  });
  return cy + 0.2;
}

function renderMapa(
  pptx: pptxgen, s: pptxgen.Slide,
  b: Extract<BloqueV2, { tipo: "mapaConceptual" }>, y: number,
): number {
  const H = 4.4;
  const cx = PAGE_W / 2;
  const cyc = y + H / 2;
  const cw = 2.9;
  const ch = 1.1;
  const half = Math.ceil(b.ramas.length / 2);
  const izq = b.ramas.slice(0, half);
  const der = b.ramas.slice(half);
  const bw = 3.0;
  const bh = 0.85;

  const place = (arr: typeof b.ramas, side: -1 | 1) => {
    const x = side < 0 ? 0.85 : PAGE_W - 0.85 - bw;
    arr.forEach((r, i) => {
      const ry = y + (H / (arr.length + 1)) * (i + 1) - bh / 2;
      // conector
      const x1 = side < 0 ? cx - cw / 2 : cx + cw / 2;
      const x2 = side < 0 ? x + bw : x;
      linea(pptx, s, x1, cyc, x2, ry + bh / 2, C.dorado, 1.5);
      // nodo
      s.addShape(pptx.ShapeType.roundRect, { x, y: ry, w: bw, h: bh, rectRadius: 0.08, fill: { color: C.doradoClaro }, line: { color: C.dorado, width: 1.25 } });
      s.addText(r.titulo, { x: x + 0.1, y: ry + 0.08, w: bw - 0.2, h: r.detalle ? 0.45 : bh - 0.16, fontSize: 14, bold: true, color: C.azul, align: "center", valign: "middle" });
      if (r.detalle)
        s.addText(r.detalle, { x: x + 0.1, y: ry + 0.5, w: bw - 0.2, h: 0.3, fontSize: 11, color: C.tenue, align: "center" });
    });
  };
  place(izq, -1);
  place(der, 1);

  // nodo central (encima de los conectores)
  s.addShape(pptx.ShapeType.roundRect, { x: cx - cw / 2, y: cyc - ch / 2, w: cw, h: ch, rectRadius: 0.12, fill: { color: C.azul }, line: { color: C.dorado, width: 2 } });
  s.addText(b.centro, { x: cx - cw / 2, y: cyc - ch / 2, w: cw, h: ch, fontSize: 16, bold: true, color: C.blanco, align: "center", valign: "middle" });
  return y + H + 0.2;
}

function renderArbol(
  pptx: pptxgen, s: pptxgen.Slide,
  b: Extract<BloqueV2, { tipo: "diagramaArbol" }>, y: number,
): number {
  const rootW = 4.0;
  const rootH = 0.8;
  const rx = (PAGE_W - rootW) / 2;
  const ry = y + 0.2;
  s.addShape(pptx.ShapeType.roundRect, { x: rx, y: ry, w: rootW, h: rootH, rectRadius: 0.1, fill: { color: C.azul }, line: { color: C.dorado, width: 1.5 } });
  s.addText(b.raiz, { x: rx, y: ry, w: rootW, h: rootH, fontSize: 16, bold: true, color: C.blanco, align: "center", valign: "middle" });

  const n = b.ramas.length;
  const gap = 0.3;
  const cw = (CW - gap * (n - 1)) / n;
  const childY = ry + rootH + 0.9;
  const childH = 1.15;
  b.ramas.forEach((r, i) => {
    const x = LX + i * (cw + gap);
    linea(pptx, s, PAGE_W / 2, ry + rootH, x + cw / 2, childY, C.dorado, 1.25);
    s.addShape(pptx.ShapeType.roundRect, { x, y: childY, w: cw, h: childH, rectRadius: 0.08, fill: { color: C.gris }, line: { color: C.azulMedio, width: 1 } });
    s.addShape(pptx.ShapeType.rect, { x, y: childY, w: cw, h: 0.1, fill: { color: C.dorado }, line: { type: "none" } });
    s.addText(r.titulo, { x: x + 0.1, y: childY + 0.22, w: cw - 0.2, h: 0.4, fontSize: 15, bold: true, color: C.azul, align: "center" });
    if (r.ejemplo)
      s.addText(r.ejemplo, { x: x + 0.1, y: childY + 0.64, w: cw - 0.2, h: 0.42, fontSize: 12, italic: true, color: C.texto, align: "center", valign: "top" });
  });
  return childY + childH + 0.3;
}

function renderAreaCuadrado(pptx: pptxgen, s: pptxgen.Slide, etiqueta: string, y: number): number {
  const side = 3.3;
  const sa = 1.95;
  const sb = side - sa;
  const x = (PAGE_W - side) / 2;
  const yy = y + 0.5;
  const cuad = (cx: number, cy: number, w: number, h: number, color: string, label: string, txtColor: string) => {
    s.addShape(pptx.ShapeType.rect, { x: cx, y: cy, w, h, fill: { color }, line: { color: C.blanco, width: 1.5 } });
    s.addText(label, { x: cx, y: cy, w, h, fontSize: 20, bold: true, color: txtColor, align: "center", valign: "middle" });
  };
  cuad(x, yy, sa, sa, C.azul, "a²", C.blanco);
  cuad(x + sa, yy, sb, sa, C.dorado, "ab", C.azul);
  cuad(x, yy + sa, sa, sb, C.dorado, "ab", C.azul);
  cuad(x + sa, yy + sa, sb, sb, C.doradoClaro, "b²", C.azul);
  // etiquetas de lado
  s.addText("a", { x: x, y: yy - 0.34, w: sa, h: 0.3, fontSize: 14, bold: true, color: C.tenue, align: "center" });
  s.addText("b", { x: x + sa, y: yy - 0.34, w: sb, h: 0.3, fontSize: 14, bold: true, color: C.tenue, align: "center" });
  s.addText("a", { x: x - 0.4, y: yy, w: 0.3, h: sa, fontSize: 14, bold: true, color: C.tenue, align: "center", valign: "middle" });
  s.addText("b", { x: x - 0.4, y: yy + sa, w: 0.3, h: sb, fontSize: 14, bold: true, color: C.tenue, align: "center", valign: "middle" });
  // fórmula
  s.addText(etiqueta, { x: 2.0, y: yy + side + 0.2, w: 9.3, h: 0.5, fontSize: 18, bold: true, color: C.azul, align: "center" });
  return yy + side + 0.8;
}

function renderParabola(
  pptx: pptxgen, s: pptxgen.Slide,
  b: Extract<BloqueV2, { tipo: "grafico"; clase: "parabola" }>, y: number,
): number {
  s.addChart(
    pptx.ChartType.line,
    [{ name: b.etiqueta, labels: b.labels, values: b.valores }],
    {
      x: 3.2, y: y + 0.1, w: 6.9, h: 4.0,
      showLegend: false, showTitle: false,
      lineSmooth: true, lineSize: 3, chartColors: [C.dorado],
      lineDataSymbol: "circle", lineDataSymbolSize: 8,
      catAxisLabelColor: C.tenue, valAxisLabelColor: C.tenue, catAxisLabelFontSize: 12, valAxisLabelFontSize: 12,
      showCatAxisTitle: true, catAxisTitle: "x", catAxisTitleColor: C.azul,
      showValAxisTitle: true, valAxisTitle: "P(x)", valAxisTitleColor: C.azul,
      chartArea: { fill: { color: C.gris } },
      plotArea: { fill: { color: C.blanco } },
    },
  );
  return y + 4.3;
}

function renderPascal(
  pptx: pptxgen, s: pptxgen.Slide,
  b: Extract<BloqueV2, { tipo: "grafico"; clase: "pascal" }>, y: number,
): number {
  const d = 0.56;
  const gx = 0.2;
  const rowH = 0.72;
  const yy = y + 0.35;
  b.filas.forEach((row, i) => {
    const n = row.length;
    const tw = n * d + (n - 1) * gx;
    const sx = (PAGE_W - tw) / 2;
    row.forEach((num, j) => {
      const x = sx + j * (d + gx);
      s.addText(num, {
        x, y: yy + i * rowH, w: d, h: d, fontSize: 16, bold: true, color: C.azul, align: "center", valign: "middle",
        shape: pptx.ShapeType.ellipse, fill: { color: i % 2 ? C.gris : C.doradoClaro }, line: { color: C.dorado, width: 1.25 },
      });
    });
  });
  s.addText(b.etiqueta, { x: 2, y: yy + b.filas.length * rowH + 0.15, w: 9.3, h: 0.4, fontSize: 14, italic: true, color: C.tenue, align: "center" });
  return yy + b.filas.length * rowH + 0.7;
}

function renderRecta(
  pptx: pptxgen, s: pptxgen.Slide,
  b: Extract<BloqueV2, { tipo: "grafico"; clase: "rectaNumerica" }>, y: number,
): number {
  const lx = 1.5;
  const rx = 11.8;
  const ly = y + 1.0;
  const resaltar = new Set(b.resaltar ?? []);
  s.addShape(pptx.ShapeType.line, { x: lx, y: ly, w: rx - lx, h: 0.001, line: { color: C.azul, width: 2.5 } });
  const n = b.marcas.length;
  b.marcas.forEach((m, i) => {
    const x = lx + ((rx - lx) / (n - 1)) * i;
    const on = resaltar.has(m);
    s.addShape(pptx.ShapeType.ellipse, { x: x - 0.09, y: ly - 0.09, w: 0.18, h: 0.18, fill: { color: on ? C.dorado : C.azul }, line: { type: "none" } });
    s.addText(m, { x: x - 0.5, y: ly + 0.18, w: 1.0, h: 0.32, fontSize: 13, bold: on, color: on ? C.azul : C.tenue, align: "center" });
  });
  s.addText(b.etiqueta, { x: 1.5, y: y + 0.1, w: 10.3, h: 0.4, fontSize: 14, italic: true, color: C.tenue });
  return y + 1.8;
}

/* ------------------------------- utilidades ------------------------------- */

/** Une partes con un separador saltándose las vacías: un campo sin dato dejaba
 *  el separador huérfano ("Licenciatura   ·      ·   Clave X"), que es la
 *  versión .pptx del placeholder sin valor del F-32. */
function unir(sep: string, ...partes: (string | undefined)[]): string {
  return partes.map((p) => (p ?? "").trim()).filter(Boolean).join(sep);
}

/** Texto plano de un bloque, para layouts que solo saben pintar viñetas. */
function lineasDeBloque(b: BloqueV2): string[] {
  const limpio = (xs: (string | undefined)[]) =>
    xs.map((x) => (x ?? "").trim()).filter(Boolean);
  switch (b.tipo) {
    case "bullets":
    case "ejercicio":
      return limpio(b.items);
    case "nota":
      return limpio([b.texto]);
    case "definicion":
      return limpio([unir(": ", b.titulo, b.texto)]);
    case "formulas":
      return limpio(b.items);
    case "formulaDestacada":
      return limpio([unir(": ", b.etiqueta, b.formula)]);
    case "tabla":
      return limpio(b.filas.map((f) => f.join(" — ")));
    case "proceso":
      return limpio(b.etapas);
    case "flujo":
      return limpio([...b.nodos, b.resultado]);
    case "pasos":
    case "ejemplo":
      return limpio([b.enunciado, ...b.pasos, "resultado" in b ? b.resultado : undefined]);
    case "aplicacion":
      return limpio([unir(": ", b.titulo, b.enunciado), ...b.pasos, b.resultado]);
    case "ejercicioGuiado":
      return limpio([b.enunciado, b.pista, ...b.items]);
    case "comparacion":
      return limpio([
        unir(": ", b.izq.titulo, b.izq.items.join("; ")),
        unir(": ", b.der.titulo, b.der.items.join("; ")),
      ]);
    case "mapaConceptual":
      return limpio([b.centro, ...b.ramas.map((r) => unir(": ", r.titulo, r.detalle))]);
    case "diagramaArbol":
      return limpio([b.raiz, ...b.ramas.map((r) => unir(": ", r.titulo, r.ejemplo))]);
    case "grafico":
      return limpio([b.etiqueta]);
  }
}

function linea(
  pptx: pptxgen, s: pptxgen.Slide,
  x1: number, y1: number, x2: number, y2: number,
  color: string, w = 1.25, transparency?: number,
) {
  s.addShape(pptx.ShapeType.line, {
    x: Math.min(x1, x2), y: Math.min(y1, y2),
    w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
    line: { color, width: w, transparency },
    flipH: x2 < x1, flipV: y2 < y1,
  });
}
