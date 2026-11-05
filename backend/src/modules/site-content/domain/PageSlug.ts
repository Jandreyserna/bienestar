import { ValidationError } from '../../../shared/domain/errors.js';

/** Páginas públicas del sitio, en el orden del menú principal. */
export const PAGE_SLUGS = ['home', 'about', 'services', 'human-values', 'team', 'contact'] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export function toPageSlug(value: string): PageSlug {
  if ((PAGE_SLUGS as readonly string[]).includes(value)) return value as PageSlug;
  throw ValidationError.field('page', `Página desconocida. Valores válidos: ${PAGE_SLUGS.join(', ')}`);
}

/**
 * Secciones estructurales de cada página. El sitio público tiene una presentación fija
 * para ellas, por eso el dominio no permite eliminarlas (solo editarlas). "intro" es el
 * encabezado de cada página interna.
 */
export const CORE_SECTION_KEYS: Readonly<Record<PageSlug, readonly string[]>> = {
  home: ['hero', 'history', 'founders', 'mission-vision'],
  about: ['intro'],
  services: ['intro'],
  'human-values': ['intro', 'worksheets'],
  team: ['intro'],
  contact: ['intro'],
};
