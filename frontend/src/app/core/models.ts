/** Tipos compartidos que reflejan los DTO de la API. */

export type PageSlug = 'home' | 'about' | 'services' | 'human-values' | 'team' | 'contact';

/** Páginas del sitio en el orden del menú principal (`short`: etiqueta de la barra superior). */
export const PAGES: readonly { slug: PageSlug; label: string; short: string; route: string }[] = [
  { slug: 'home', label: 'Inicio', short: 'Inicio', route: '/' },
  { slug: 'about', label: 'Quiénes somos', short: 'Quiénes somos', route: '/quienes-somos' },
  { slug: 'services', label: 'Servicios de apoyo', short: 'Servicios', route: '/servicios' },
  { slug: 'human-values', label: 'Valores humanos', short: 'Valores humanos', route: '/valores-humanos' },
  { slug: 'team', label: 'Equipo de trabajo', short: 'Equipo', route: '/equipo' },
  { slug: 'contact', label: 'Contáctenos', short: 'Contáctenos', route: '/contacto' },
];

export function pageRoute(slug: PageSlug): string {
  return PAGES.find((p) => p.slug === slug)?.route ?? '/';
}

/** Cómo presenta el sitio los elementos de una sección no estructural. */
export type SectionLayout = 'cards' | 'people' | 'timeline' | 'numbered' | 'tags' | 'contact';

export const SECTION_LAYOUTS: readonly { value: SectionLayout; label: string; hint: string }[] = [
  { value: 'cards', label: 'Tarjetas', hint: 'Texto con imagen opcional y elementos en tarjetas.' },
  { value: 'people', label: 'Personas', hint: 'Foto circular, nombre y cargo o formación.' },
  { value: 'timeline', label: 'Línea de tiempo', hint: 'Etapas en orden cronológico, con imagen opcional.' },
  { value: 'numbered', label: 'Lista numerada', hint: 'Elementos numerados con su descripción (valores, talleres...).' },
  { value: 'tags', label: 'Etiquetas', hint: 'Palabras o frases cortas (solo el título de cada elemento).' },
  { value: 'contact', label: 'Datos de contacto', hint: 'Correos, teléfonos, direcciones y enlaces con acceso directo.' },
];

/** Menú del sitio: secciones de cada página (GET /api/navigation). */
export interface NavigationPage {
  page: PageSlug;
  sections: { key: string; title: string }[];
}

export interface SectionItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  position: number;
}

export interface Section {
  id: string;
  page: PageSlug;
  key: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  imageUrl: string | null;
  layout: SectionLayout;
  position: number;
  isCore: boolean;
  items: SectionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SectionItemPayload {
  id?: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
}

export interface SectionPayload {
  title: string;
  subtitle: string | null;
  body: string | null;
  imageUrl: string | null;
  layout?: SectionLayout;
  position?: number;
  /** Si se envía, reemplaza todos los items en ese orden. */
  items?: SectionItemPayload[];
}

export interface NewSectionPayload extends SectionPayload {
  page: PageSlug;
  key: string;
}

export type EducationLevel = 'preschool' | 'primary' | 'secondary';

export const LEVEL_LABELS: Readonly<Record<EducationLevel, string>> = {
  preschool: 'Preescolar',
  primary: 'Primaria',
  secondary: 'Secundaria',
};

export interface Worksheet {
  id: string;
  title: string;
  description: string;
  humanValue: string;
  level: EducationLevel;
  file: { url: string; name: string; mimeType: string; sizeBytes: number };
  createdAt: string;
  updatedAt: string;
}

export interface WorksheetPayload {
  title: string;
  description: string;
  humanValue: string;
  level: EducationLevel;
  file?: File | null;
}

export interface StoredImage {
  url: string;
  path: string;
}

export interface Session {
  token: string;
  expiresAt: string;
  admin: { id: string; email: string };
}
