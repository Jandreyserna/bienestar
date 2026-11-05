import type { NewSectionInput } from './SectionFactory.js';

/**
 * Contenido inicial de cada página. Se crea solo si la sección no existe, así que
 * nunca sobrescribe lo que el administrador haya editado.
 */
export const DEFAULT_SECTIONS: NewSectionInput[] = [
  {
    page: 'home',
    key: 'hero',
    position: 0,
    title: 'Bienestar Moral',
    subtitle: 'Educamos en valores para transformar comunidades',
    body: 'Acompañamos a docentes y estudiantes con recursos y experiencias que fortalecen la convivencia y el desarrollo humano.',
    imageUrl: null,
  },
  {
    page: 'home',
    key: 'history',
    position: 1,
    title: 'Nuestra historia',
    subtitle: 'El camino que nos trajo hasta aquí',
    items: [
      {
        title: 'El comienzo',
        description: 'Edita esta diapositiva desde el panel de administración para contar cómo nació el proyecto.',
      },
    ],
  },
  {
    page: 'home',
    key: 'founders',
    position: 2,
    title: 'Fundadores',
    subtitle: 'Las personas que hicieron posible Bienestar Moral',
    items: [],
  },
  {
    page: 'home',
    key: 'mission-vision',
    position: 3,
    title: 'Misión y visión',
    body: 'Lo que nos mueve y hacia dónde vamos.',
    items: [
      { title: 'Misión', description: 'Describe aquí la misión del proyecto desde el panel de administración.' },
      { title: 'Visión', description: 'Describe aquí la visión del proyecto desde el panel de administración.' },
    ],
  },
  {
    page: 'human-values',
    key: 'intro',
    position: 0,
    title: 'Valores humanos',
    subtitle: 'Cartillas de trabajo para el aula',
    body: 'Descarga gratuitamente las cartillas para trabajar los valores humanos con estudiantes de primaria y secundaria.',
  },
];
