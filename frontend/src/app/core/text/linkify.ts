/** Fragmento de texto; si tiene `href` se muestra como enlace. */
export interface TextPart {
  text: string;
  href?: string;
  external?: boolean;
}

// URL http(s) sin la puntuación final de la frase, o un correo electrónico.
const LINK_PATTERN = /(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]'»])|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

/**
 * Divide un texto plano en fragmentos, convirtiendo URLs y correos en enlaces.
 * Se usa en lugar de innerHTML: el contenido del panel nunca se interpreta como HTML.
 */
export function linkify(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    const index = match.index;
    if (index > last) parts.push({ text: text.slice(last, index) });
    const [value, url, email] = match;
    parts.push(
      url ? { text: displayUrl(url), href: url, external: true } : { text: value, href: `mailto:${email}` },
    );
    last = index + value.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/**
 * "https://www.sitio.org/ruta/" -> "sitio.org/ruta". Añade un espacio de ancho cero tras cada "/"
 * para que, si no cabe, la línea se corte entre segmentos y no a mitad de una palabra.
 */
export function displayUrl(url: string): string {
  return url
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/\/$/, '')
    .replace(/\//g, '/​');
}
