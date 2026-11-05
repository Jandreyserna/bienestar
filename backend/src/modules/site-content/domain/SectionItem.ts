import { MediaUrl } from '../../../shared/domain/MediaUrl.js';
import { optionalText, requiredText } from '../../../shared/domain/text.js';

export interface SectionItemSnapshot {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  position: number;
}

export interface SectionItemInput {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
}

/**
 * Entidad hija del agregado Section: una diapositiva del carrusel de Historia,
 * un fundador (title = nombre completo), o un bloque como "Misión"/"Visión".
 */
export class SectionItem {
  private constructor(private readonly props: SectionItemSnapshot) {}

  static create(id: string, input: SectionItemInput, position: number): SectionItem {
    return new SectionItem({
      id,
      title: requiredText(input.title, 'items.title', 200),
      description: optionalText(input.description, 'items.description', 3000),
      imageUrl: MediaUrl.optional(input.imageUrl, 'items.imageUrl')?.value ?? null,
      position,
    });
  }

  static reconstitute(snapshot: SectionItemSnapshot): SectionItem {
    return new SectionItem({ ...snapshot });
  }

  get id(): string {
    return this.props.id;
  }

  toSnapshot(): SectionItemSnapshot {
    return { ...this.props };
  }
}
