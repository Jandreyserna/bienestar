import { BusinessRuleViolationError, ValidationError } from '../../../shared/domain/errors.js';
import { MediaUrl } from '../../../shared/domain/MediaUrl.js';
import { optionalText, requiredText } from '../../../shared/domain/text.js';
import { CORE_SECTION_KEYS, type PageSlug } from './PageSlug.js';
import type { SectionKey } from './SectionKey.js';
import { SectionItem, type SectionItemInput, type SectionItemSnapshot } from './SectionItem.js';

export interface SectionContent {
  title: string;
  subtitle?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  position?: number;
}

export interface SectionSnapshot {
  id: string;
  page: PageSlug;
  key: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  imageUrl: string | null;
  position: number;
  items: SectionItemSnapshot[];
  createdAt: Date;
  updatedAt: Date;
}

interface SectionState extends Omit<SectionSnapshot, 'items' | 'key'> {
  key: SectionKey;
  items: SectionItem[];
}

/** Item a guardar: con `id` si ya existía (se conserva), sin `id` si es nuevo. */
export type SectionItemDraft = SectionItemInput & { id?: string };

/**
 * Agregado raíz: una sección de una página pública (portada, historia, fundadores,
 * misión/visión...). Sus items solo se modifican a través de la sección, que
 * garantiza el límite de items y el orden.
 */
export class Section {
  static readonly MAX_ITEMS = 30;

  private constructor(private state: SectionState) {}

  /** Usado por SectionFactory; no llamar directamente desde la aplicación. */
  static fromState(state: SectionState): Section {
    return new Section(state);
  }

  get id(): string {
    return this.state.id;
  }
  get page(): PageSlug {
    return this.state.page;
  }
  get key(): SectionKey {
    return this.state.key;
  }
  get position(): number {
    return this.state.position;
  }

  get isCore(): boolean {
    return CORE_SECTION_KEYS[this.state.page].includes(this.state.key.value);
  }

  updateContent(content: SectionContent, now: Date): void {
    const normalized = Section.normalizeContent(content);
    this.state = {
      ...this.state,
      ...normalized,
      position: normalized.position ?? this.state.position,
      updatedAt: now,
    };
  }

  /**
   * Reemplaza la lista completa de items en el orden recibido.
   * Los items con `id` deben pertenecer a esta sección; los nuevos reciben id con `newId`.
   */
  replaceItems(drafts: SectionItemDraft[], newId: () => string, now: Date): void {
    if (drafts.length > Section.MAX_ITEMS) {
      throw ValidationError.field('items', `Una sección admite máximo ${Section.MAX_ITEMS} elementos`);
    }
    const existingIds = new Set(this.state.items.map((item) => item.id));
    const seen = new Set<string>();
    const items = drafts.map((draft, index) => {
      if (draft.id !== undefined) {
        if (!existingIds.has(draft.id)) {
          throw ValidationError.field('items.id', `El elemento ${draft.id} no pertenece a esta sección`);
        }
        if (seen.has(draft.id)) {
          throw ValidationError.field('items.id', `El elemento ${draft.id} está repetido`);
        }
        seen.add(draft.id);
      }
      return SectionItem.create(draft.id ?? newId(), draft, index);
    });
    this.state = { ...this.state, items, updatedAt: now };
  }

  assertCanBeDeleted(): void {
    if (this.isCore) {
      throw new BusinessRuleViolationError(
        `La sección "${this.state.key.value}" es parte de la estructura de la página y no se puede eliminar; puedes editar su contenido.`,
      );
    }
  }

  toSnapshot(): SectionSnapshot {
    return {
      ...this.state,
      key: this.state.key.value,
      items: this.state.items.map((item) => item.toSnapshot()),
    };
  }

  static normalizeContent(content: SectionContent): {
    title: string;
    subtitle: string | null;
    body: string | null;
    imageUrl: string | null;
    position: number | undefined;
  } {
    if (content.position !== undefined && (!Number.isInteger(content.position) || content.position < 0)) {
      throw ValidationError.field('position', 'La posición debe ser un entero mayor o igual a 0');
    }
    return {
      title: requiredText(content.title, 'title', 200),
      subtitle: optionalText(content.subtitle, 'subtitle', 300),
      body: optionalText(content.body, 'body', 5000),
      imageUrl: MediaUrl.optional(content.imageUrl)?.value ?? null,
      position: content.position,
    };
  }
}
