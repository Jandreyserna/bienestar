import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Section, SectionItem } from '../../../core/models';
import { type ContactEntry, toContactEntry } from '../../../core/text/contact';
import { RichText } from '../rich-text';

/** Enlace opcional que una página puede añadir a cada elemento (p. ej. "Ver cartillas" de un valor). */
export interface ItemLink {
  label: string;
  route: string;
  queryParams?: Record<string, string>;
  fragment?: string;
}

interface ItemView {
  item: SectionItem;
  number: string;
  /** people: primera línea de la descripción (cargo); timeline: periodo antes de " · ". */
  lead: string | null;
  /** people: resto de líneas; timeline: título sin el periodo. */
  rest: string | null;
  initials: string;
  link: ItemLink | null;
}

/**
 * Presenta cualquier sección no estructural con el diseño elegido en el panel
 * (tarjetas, personas, línea de tiempo, lista numerada, etiquetas o contacto).
 */
@Component({
  selector: 'app-section-block',
  imports: [RouterLink, RichText],
  templateUrl: './section-block.html',
  styleUrl: './section-block.css',
})
export class SectionBlock {
  readonly section = input.required<Section>();
  /** Fondo blanco para alternar con la sección anterior. */
  readonly alt = input(false);
  readonly itemLink = input<((item: SectionItem) => ItemLink | null) | null>(null);

  protected readonly items = computed<ItemView[]>(() => {
    const { layout, items } = this.section();
    const link = this.itemLink();
    return items.map((item, index) => {
      let lead: string | null = null;
      let rest: string | null = null;
      if (layout === 'people') {
        const [first, ...others] = (item.description ?? '').split('\n').map((line) => line.trim());
        lead = first || null;
        rest = others.filter(Boolean).join('\n') || null;
      } else if (layout === 'timeline') {
        const separator = item.title.indexOf(' · ');
        lead = separator > 0 ? item.title.slice(0, separator) : null;
        rest = separator > 0 ? item.title.slice(separator + 3) : item.title;
      }
      return {
        item,
        number: String(index + 1).padStart(2, '0'),
        lead,
        rest,
        initials: initials(item.title),
        link: link ? link(item) : null,
      };
    });
  });

  /** Texto largo sin imagen ni elementos: título a la izquierda y texto a la derecha. */
  protected readonly prose = computed(() => {
    const s = this.section();
    return !s.imageUrl && s.items.length === 0 && (s.body?.length ?? 0) > 350;
  });

  protected readonly contacts = computed<ContactEntry[]>(() =>
    this.section().items.map((item) => toContactEntry(item.title, item.description)),
  );
}

/** "Fernando y María Elena Gaviria" -> "FM" (ignora conectores en minúscula). */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => /^\p{Lu}/u.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('');
}
