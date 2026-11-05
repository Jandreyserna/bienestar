import type { PageSlug } from './PageSlug.js';
import type { Section } from './Section.js';

/** Vista de solo lectura de una sección: lo necesario para construir el menú del sitio. */
export interface SectionSummary {
  page: PageSlug;
  key: string;
  title: string;
  position: number;
}

/** Repository (ARQ-05): el dominio solo conoce esta interfaz, no MySQL. */
export interface SectionRepository {
  findById(id: string): Promise<Section | null>;
  findByPage(page: PageSlug): Promise<Section[]>;
  findByPageAndKey(page: PageSlug, key: string): Promise<Section | null>;
  /** Todas las secciones (sin sus items), ordenadas por posición dentro de cada página. */
  findSummaries(): Promise<SectionSummary[]>;
  /** Inserta o actualiza la sección completa junto con sus items. */
  save(section: Section): Promise<void>;
  delete(id: string): Promise<void>;
}
