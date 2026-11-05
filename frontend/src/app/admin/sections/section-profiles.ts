import type { SectionLayout } from '../../core/models';

/**
 * Cómo se usa cada campo según la sección, para que el editor muestre solo lo relevante
 * y con etiquetas en el lenguaje de la organización.
 */
export interface SectionProfile {
  hint: string;
  usesImage: boolean;
  imageHint?: string;
  usesItems: boolean;
  itemLabel: string;
  itemLabelPlural: string;
  itemTitleLabel: string;
  itemDescriptionLabel: string;
  itemDescriptionHint?: string;
  itemUsesDescription: boolean;
  itemUsesImage: boolean;
  itemImageLabel: string;
}

const DEFAULT_PROFILE: SectionProfile = {
  hint: 'Texto con imagen opcional; los elementos se muestran como tarjetas.',
  usesImage: true,
  imageHint: 'Opcional. Se muestra junto al texto de la sección.',
  usesItems: true,
  itemLabel: 'Elemento',
  itemLabelPlural: 'Elementos',
  itemTitleLabel: 'Título',
  itemDescriptionLabel: 'Descripción',
  itemUsesDescription: true,
  itemUsesImage: true,
  itemImageLabel: 'Imagen',
};

/** Secciones estructurales: tienen un diseño fijo en el sitio. */
const CORE_PROFILES: Record<string, Partial<SectionProfile>> = {
  hero: {
    hint: 'Portada del sitio. El título, el subtítulo (eslogan) y el texto se muestran sobre la imagen.',
    imageHint: 'Imagen horizontal, ideal 1600×900 px (p. ej. un docente con sus estudiantes).',
    usesItems: false,
  },
  history: {
    hint: 'Cada elemento es una diapositiva del carrusel de Historia (imagen + título + descripción).',
    usesImage: false,
    itemLabel: 'Diapositiva',
    itemLabelPlural: 'Diapositivas',
    itemImageLabel: 'Imagen de la diapositiva',
  },
  founders: {
    hint: 'Cada elemento es un fundador en el carrusel: su foto y su nombre completo.',
    usesImage: false,
    itemLabel: 'Fundador',
    itemLabelPlural: 'Fundadores',
    itemTitleLabel: 'Nombre completo',
    itemDescriptionLabel: 'Rol o reseña breve (opcional)',
    itemImageLabel: 'Foto',
  },
  'mission-vision': {
    hint: 'Usa un elemento para la Misión y otro para la Visión, cada uno con su explicación.',
    usesImage: false,
    itemLabel: 'Bloque',
    itemLabelPlural: 'Bloques',
    itemDescriptionLabel: 'Explicación',
    itemUsesImage: false,
  },
  intro: {
    hint: 'Encabezado de la página: título, subtítulo y texto de presentación.',
    imageHint: 'Opcional. Se muestra junto al texto de presentación.',
    usesItems: false,
  },
  worksheets: {
    hint: 'Encabezado del catálogo de cartillas. Las cartillas se cargan en la opción «Cartillas» del panel.',
    usesImage: false,
    usesItems: false,
  },
};

/** Secciones adicionales: las etiquetas cambian según el diseño elegido. */
const LAYOUT_PROFILES: Record<SectionLayout, Partial<SectionProfile>> = {
  cards: {},
  people: {
    hint: 'Cada elemento es una persona con foto circular, nombre, cargo y formación.',
    itemLabel: 'Persona',
    itemLabelPlural: 'Personas',
    itemTitleLabel: 'Nombre completo',
    itemDescriptionLabel: 'Cargo y formación',
    itemDescriptionHint: 'La primera línea (cargo o especialidad) se destaca; las siguientes muestran la formación.',
    itemImageLabel: 'Foto',
  },
  timeline: {
    hint: 'Cada elemento es una etapa, en orden cronológico.',
    itemLabel: 'Etapa',
    itemLabelPlural: 'Etapas',
    itemTitleLabel: 'Periodo · título',
    itemDescriptionLabel: 'Relato',
    itemDescriptionHint: 'Escribe el título como «2001 – 2003 · Los comienzos» para mostrar el periodo aparte. Deja una línea en blanco entre párrafos.',
    itemImageLabel: 'Imagen de la etapa (opcional)',
  },
  numbered: {
    hint: 'Elementos numerados en el orden de la lista (valores, talleres...).',
    itemTitleLabel: 'Nombre',
    itemDescriptionLabel: 'Descripción u objetivo (opcional)',
    itemUsesImage: false,
  },
  tags: {
    hint: 'Etiquetas cortas: solo se muestra el título de cada elemento.',
    itemLabel: 'Etiqueta',
    itemLabelPlural: 'Etiquetas',
    itemTitleLabel: 'Texto',
    itemUsesDescription: false,
    itemUsesImage: false,
  },
  contact: {
    hint: 'Datos de contacto con acceso directo: correo, WhatsApp, teléfono, dirección (abre el mapa) o enlace.',
    itemLabel: 'Dato',
    itemLabelPlural: 'Datos de contacto',
    itemTitleLabel: 'Etiqueta (ej. Correo electrónico, WhatsApp, Dirección)',
    itemDescriptionLabel: 'Valor',
    itemDescriptionHint: 'Un correo, un teléfono, una dirección o una dirección web. Si la etiqueta dice «WhatsApp», el número abre un chat.',
    itemUsesImage: false,
  },
};

export function profileFor(section: { key: string; isCore: boolean } | undefined, layout: SectionLayout): SectionProfile {
  const specific = section?.isCore ? CORE_PROFILES[section.key] : LAYOUT_PROFILES[layout];
  return { ...DEFAULT_PROFILE, ...specific };
}
