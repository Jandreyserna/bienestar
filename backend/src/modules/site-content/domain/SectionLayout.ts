import { ValidationError } from '../../../shared/domain/errors.js';

/**
 * Cómo presenta el sitio público los elementos de una sección no estructural:
 * - cards: tarjetas con imagen, título y descripción (por defecto).
 * - people: personas con foto circular, nombre y cargo/formación.
 * - timeline: etapas en orden cronológico con imagen opcional.
 * - numbered: lista numerada (valores, talleres...).
 * - tags: etiquetas cortas (solo el título de cada elemento).
 * - contact: datos de contacto; correos, teléfonos y enlaces se vuelven accionables.
 */
export const SECTION_LAYOUTS = ['cards', 'people', 'timeline', 'numbered', 'tags', 'contact'] as const;
export type SectionLayout = (typeof SECTION_LAYOUTS)[number];

export const DEFAULT_SECTION_LAYOUT: SectionLayout = 'cards';

export function toSectionLayout(value: string): SectionLayout {
  if ((SECTION_LAYOUTS as readonly string[]).includes(value)) return value as SectionLayout;
  throw ValidationError.field('layout', `Diseño desconocido. Valores válidos: ${SECTION_LAYOUTS.join(', ')}`);
}
