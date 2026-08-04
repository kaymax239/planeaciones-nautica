/**
 * Opciones comunes de Docxtemplater para todas las plantillas del proyecto.
 *
 * `nullGetter` NO es opcional. Sin él aplica el de docxtemplater por defecto,
 * que devuelve la cadena literal "undefined" para cualquier placeholder que la
 * plantilla declare y los datos no alimenten. Eso no falla ni avisa: imprime
 * "CRÉDITOS TOTALES: undefined" o "GRUPO: undefined" en un documento oficial,
 * que es peor que dejar la celda vacía porque parece un dato.
 *
 * Las plantillas se comparten entre flujos (F-32 la usan PN, MN e Inglés), así
 * que un placeholder añadido para un flujo aparece en los demás. Con esto, el
 * que no lo alimente deja la celda en blanco en vez de ensuciar el documento.
 */
export const OPCIONES_DOCX = {
  paragraphLoop: true,
  linebreaks: true,
  nullGetter: () => "",
};
