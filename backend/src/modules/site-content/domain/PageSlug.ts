import { ValidationError } from '../../../shared/domain/errors.js';

/** Páginas públicas del sitio. */
export const PAGE_SLUGS = ['home', 'human-values'] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export function toPageSlug(value: string): PageSlug {
  if ((PAGE_SLUGS as readonly string[]).includes(value)) return value as PageSlug;
  throw ValidationError.field('page', `Página desconocida. Valores válidos: ${PAGE_SLUGS.join(', ')}`);
}

/**
 * Secciones estructurales de cada página. El sitio público depende de ellas,
 * por eso el dominio no permite eliminarlas (solo editarlas).
 */
export const CORE_SECTION_KEYS: Readonly<Record<PageSlug, readonly string[]>> = {
  home: ['hero', 'history', 'founders', 'mission-vision'],
  'human-values': ['intro'],
};
