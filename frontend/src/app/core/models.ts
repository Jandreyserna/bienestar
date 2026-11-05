/** Tipos compartidos que reflejan los DTO de la API. */

export type PageSlug = 'home' | 'human-values';

export const PAGES: readonly { slug: PageSlug; label: string; route: string }[] = [
  { slug: 'home', label: 'Inicio', route: '/' },
  { slug: 'human-values', label: 'Valores humanos', route: '/valores-humanos' },
];

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
  position?: number;
  /** Si se envía, reemplaza todos los items en ese orden. */
  items?: SectionItemPayload[];
}

export interface NewSectionPayload extends SectionPayload {
  page: PageSlug;
  key: string;
}

export type EducationLevel = 'primary' | 'secondary';

export const LEVEL_LABELS: Readonly<Record<EducationLevel, string>> = {
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
