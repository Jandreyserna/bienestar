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
  itemUsesImage: boolean;
  itemImageLabel: string;
}

const DEFAULT_PROFILE: SectionProfile = {
  hint: 'Sección adicional: se muestra al final de la página con su texto, imagen y elementos en tarjetas.',
  usesImage: true,
  usesItems: true,
  itemLabel: 'Elemento',
  itemLabelPlural: 'Elementos',
  itemTitleLabel: 'Título',
  itemDescriptionLabel: 'Descripción',
  itemUsesImage: true,
  itemImageLabel: 'Imagen',
};

const PROFILES: Record<string, Partial<SectionProfile>> = {
  hero: {
    hint: 'Portada del sitio. El título, el subtítulo y el texto se muestran sobre la imagen.',
    imageHint: 'Imagen horizontal, ideal 1600×900 px (p. ej. la ilustración del profesor con sus alumnos).',
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
    hint: 'Encabezado de la página Valores humanos, sobre el catálogo de cartillas.',
    imageHint: 'Opcional. Se muestra junto al texto de presentación.',
    usesItems: false,
  },
};

export function profileFor(key: string | undefined): SectionProfile {
  return { ...DEFAULT_PROFILE, ...(key ? PROFILES[key] : undefined) };
}
