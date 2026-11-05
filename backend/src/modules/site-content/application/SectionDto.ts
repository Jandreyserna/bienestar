import type { Section } from '../domain/Section.js';

export interface SectionItemDto {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  position: number;
}

export interface SectionDto {
  id: string;
  page: string;
  key: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  imageUrl: string | null;
  layout: string;
  position: number;
  isCore: boolean;
  items: SectionItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface NavigationPageDto {
  page: string;
  sections: { key: string; title: string }[];
}

export function toSectionDto(section: Section): SectionDto {
  const snapshot = section.toSnapshot();
  return {
    id: snapshot.id,
    page: snapshot.page,
    key: snapshot.key,
    title: snapshot.title,
    subtitle: snapshot.subtitle,
    body: snapshot.body,
    imageUrl: snapshot.imageUrl,
    layout: snapshot.layout,
    position: snapshot.position,
    isCore: section.isCore,
    items: snapshot.items.map((item) => ({ ...item })),
    createdAt: snapshot.createdAt.toISOString(),
    updatedAt: snapshot.updatedAt.toISOString(),
  };
}
