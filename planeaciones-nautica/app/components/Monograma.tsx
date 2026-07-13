// Marca institucional de la ENMT.
//
// Mientras no exista el archivo oficial se muestra un MONOGRAMA: un círculo azul
// marino (#071a33) con borde dorado (#c8a45d) y las siglas "ENMT" en blanco.
//
// Para sustituirlo por el escudo real, coloca el archivo en `public/escudo.png`
// y cambia `ESCUDO_SRC` a "/escudo.png": el componente mostrará la imagen (con
// el mismo tamaño que reciba por `className`) sin tocar nada más.
const ESCUDO_SRC: string | null = null;

type MonogramaProps = {
  /** Clases de tamaño del círculo/imagen (ej. "h-12 w-12"). */
  className?: string;
  /** Tamaño de las siglas del monograma (ej. "text-xs"). */
  textClassName?: string;
};

export function Monograma({
  className = "h-12 w-12",
  textClassName = "text-xs",
}: MonogramaProps) {
  if (ESCUDO_SRC) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={ESCUDO_SRC}
        alt="Escudo de la Escuela Náutica Mercante de Tampico"
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      aria-label="Escuela Náutica Mercante de Tampico"
      className={`${className} flex shrink-0 items-center justify-center rounded-full border-2 border-[#c8a45d] bg-[#071a33] font-black uppercase tracking-[0.1em] text-white ${textClassName}`}
    >
      ENMT
    </div>
  );
}
