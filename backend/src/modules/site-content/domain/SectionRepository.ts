import type { PageSlug } from './PageSlug.js';
import type { Section } from './Section.js';

/** Repository (ARQ-05): el dominio solo conoce esta interfaz, no MySQL. */
export interface SectionRepository {
  findById(id: string): Promise<Section | null>;
  findByPage(page: PageSlug): Promise<Section[]>;
  findByPageAndKey(page: PageSlug, key: string): Promise<Section | null>;
  /** Inserta o actualiza la sección completa junto con sus items. */
  save(section: Section): Promise<void>;
  delete(id: string): Promise<void>;
}
