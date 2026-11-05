import { randomUUID } from 'node:crypto';
import type { PageSlug } from './PageSlug.js';
import { Section, type SectionContent, type SectionItemDraft, type SectionSnapshot } from './Section.js';
import { SectionItem } from './SectionItem.js';
import { SectionKey } from './SectionKey.js';
import { DEFAULT_SECTION_LAYOUT } from './SectionLayout.js';

export interface NewSectionInput extends SectionContent {
  page: PageSlug;
  key: string;
  items?: SectionItemDraft[];
}

/**
 * Factory (ARQ-05): concentra la construcción del agregado Section, tanto al crearlo
 * (validando todas las invariantes) como al reconstruirlo desde la base de datos.
 */
export class SectionFactory {
  constructor(private readonly newId: () => string = randomUUID) {}

  create(input: NewSectionInput, defaultPosition: number, now: Date): Section {
    const content = Section.normalizeContent(input);
    const section = Section.fromState({
      id: this.newId(),
      page: input.page,
      key: SectionKey.from(input.key),
      ...content,
      layout: content.layout ?? DEFAULT_SECTION_LAYOUT,
      position: content.position ?? defaultPosition,
      items: [],
      createdAt: now,
      updatedAt: now,
    });
    if (input.items && input.items.length > 0) {
      // Al crear, todos los items son nuevos: se ignora cualquier id que venga del cliente.
      section.replaceItems(
        input.items.map(({ id: _ignored, ...item }) => item),
        this.newId,
        now,
      );
    }
    return section;
  }

  reconstitute(snapshot: SectionSnapshot): Section {
    return Section.fromState({
      ...snapshot,
      key: SectionKey.from(snapshot.key),
      items: [...snapshot.items]
        .sort((a, b) => a.position - b.position)
        .map((item) => SectionItem.reconstitute(item)),
    });
  }

  /** Identificador para items nuevos (lo usan los casos de uso al reemplazar items). */
  nextId(): string {
    return this.newId();
  }
}
