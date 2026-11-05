import type { SectionItemDraft } from './Section.js';
import type { NewSectionInput } from './SectionFactory.js';

/**
 * Contenido inicial del sitio, tomado de los documentos de Bienestar Moral ("WEB BM Estructura y
 * Contenido", reseña histórica, equipo de trabajo y observaciones de agosto de 2025).
 *
 * Se crea solo si la sección no existe, así que nunca sobrescribe lo que el administrador haya
 * editado. Las imágenes viven en `frontend/public/contenido`; al reemplazarlas desde el panel,
 * las nuevas se suben al almacenamiento configurado (Hostinger en producción).
 */

const IMG = '/contenido';

/** Persona del equipo: la primera línea de la descripción es el cargo o especialidad. */
function person(name: string, photo: string, ...lines: string[]): SectionItemDraft {
  return { title: name, description: lines.join('\n'), imageUrl: `${IMG}/equipo/${photo}.jpg` };
}

function value(title: string, objective: string): SectionItemDraft {
  return { title, description: objective };
}

const paragraphs = (...text: string[]) => text.join('\n\n');

// --------------------------------------------------------------------------------------------
// Inicio
// --------------------------------------------------------------------------------------------

const HOME: NewSectionInput[] = [
  {
    page: 'home',
    key: 'hero',
    position: 0,
    title: 'Bienestar Moral',
    subtitle: 'Sembrando principios que transforman vidas',
    body:
      'Proyecto de la Fundación Semillas que fomenta y fortalece los valores humanos y las competencias ' +
      'ciudadanas de niños, adolescentes y sus familias en las instituciones educativas de Colombia.',
    imageUrl: `${IMG}/portada/clase-pilar-acevedo.jpg`,
  },
  {
    page: 'home',
    key: 'overview',
    position: 1,
    layout: 'cards',
    title: '¿Qué es Bienestar Moral?',
    subtitle: 'Educación ética para la paz',
    body: paragraphs(
      'Bienestar Moral es un proyecto con enfoque integral que fomenta y fortalece los valores humanos y las ' +
        'competencias ciudadanas, basados en principios éticos cristianos, en la vida de los niños y adolescentes ' +
        'participantes de esta iniciativa. Asimismo, se extiende a sus familias para contribuir a la construcción ' +
        'de una sociedad más justa, solidaria y empática, impactando positivamente el tejido social colombiano.',
      'La Ley 1620 de 2013 del Congreso de la República creó el Sistema Nacional de Convivencia Escolar y ' +
        'Formación para el Ejercicio de los Derechos Humanos, la Educación para la Sexualidad y la Prevención y ' +
        'Mitigación de la Violencia Escolar. Con este encargo social, la Fundación Semillas, mediante el proyecto ' +
        'Bienestar Moral, patrocina profesores y material educativo con el propósito de fortalecer la educación ' +
        'para la paz en el marco de la asignatura «Cátedra de la Paz» en los establecimientos oficiales o privados ' +
        'de educación preescolar, básica y media, en el área de ética y valores humanos y de formación y ' +
        'desarrollo de competencias ciudadanas.',
      'El proyecto Bienestar Moral impulsa una vida con propósito, fundamentada en sembrar principios que ' +
        'transforman vidas. Esto implica educar y formar el carácter de los niños y adolescentes desde una ' +
        'perspectiva ética, en donde se fomenta la paz interior, la prevención de conductas destructivas, la toma ' +
        'de conciencia individual y colectiva, y la toma de decisiones con integridad y sentido de pertenencia, ' +
        'impactando positivamente su entorno escolar y familiar.',
    ),
  },
  {
    page: 'home',
    key: 'history',
    position: 2,
    title: 'Nuestra historia',
    subtitle: 'Evolución de la visión',
    body: 'De un pequeño grupo de voluntarios a un proyecto que acompaña escuelas y colegios en diversas regiones de Colombia.',
    items: [
      {
        title: '2001 · Un comienzo en el Quindío',
        description:
          'A comienzos de 2001, el matrimonio de Paula Andrea López y Salomón Bejarano ofreció su tiempo para ' +
          'apoyar a los docentes de una escuela del Quindío en sus clases de religión y de ética y valores. Al ver ' +
          'cambios positivos en varios niños, las directivas preguntaron si conocían a otras personas que pudieran ' +
          'apoyar de manera similar.',
        imageUrl: `${IMG}/historia/2001-salomon-y-paula.jpg`,
      },
      {
        title: '2001 – 2003 · Una red de docentes voluntarios',
        description:
          'Se sumaron María Eugenia Barrero y Giomar Restrepo; Daisy Valencia y Adriana Soto, del norte del Valle; ' +
          'Pilar Acevedo y Lorena Bejarano, en Armenia; y el matrimonio de profesores María Elena Alzate y Fernando ' +
          'Gaviria, en Manizales. Todos ofrecían su tiempo de manera voluntaria, varias horas por semana.',
        imageUrl: `${IMG}/historia/2001-2003-red-de-docentes.jpg`,
      },
      {
        title: '2003 · Nace la Fundación Semillas',
        description:
          'La red crecía de manera natural y espontánea. Cuatro matrimonios formaron la Fundación Semillas, ' +
          'entidad sin ánimo de lucro que dio cobertura formal a esta red de docentes, que desde entonces asumió ' +
          'el nombre de proyecto Bienestar Moral.',
        imageUrl: `${IMG}/historia/2003-fundacion-semillas.jpg`,
      },
      {
        title: '2003 – hoy · Al servicio de Dios y de la comunidad',
        description:
          'Por medio de la Fundación Semillas se recogen fondos y se proveen coordinación y logística, apoyando de ' +
          'una forma más completa a los docentes en sus labores en escuelas y colegios de diversas partes de Colombia.',
        imageUrl: `${IMG}/historia/2007-equipo-bienestar-moral.jpg`,
      },
    ],
  },
  {
    page: 'home',
    key: 'founders',
    position: 3,
    title: 'Fundadores',
    subtitle: 'Evolución informal entre 2001 y 2003',
    body: 'Las personas que, con su tiempo y su vocación, dieron origen a Bienestar Moral.',
    items: [
      { title: 'Daisy Valencia', imageUrl: `${IMG}/fundadores/daisy-valencia.jpg` },
      { title: 'María Eugenia Barrero', imageUrl: `${IMG}/fundadores/maria-eugenia-barrero.jpg` },
      { title: 'Pilar Acevedo', imageUrl: `${IMG}/fundadores/pilar-acevedo.jpg` },
      { title: 'Giomar Restrepo', imageUrl: `${IMG}/fundadores/giomar-restrepo.jpg` },
      { title: 'Adriana Soto', imageUrl: `${IMG}/fundadores/adriana-soto.jpg` },
      { title: 'Lorena Bejarano', imageUrl: `${IMG}/fundadores/lorena-bejarano.jpg` },
      { title: 'Salomón y Paula Andrea Bejarano', imageUrl: `${IMG}/fundadores/salomon-y-paula-bejarano.jpg` },
      // La única foto disponible de María Elena está borrosa (observaciones de agosto de 2025): pendiente.
      { title: 'Fernando y María Elena Gaviria' },
      { title: 'Felipe y Johanna Nunn', imageUrl: `${IMG}/fundadores/felipe-y-johanna-nunn.jpg` },
    ],
  },
  {
    page: 'home',
    key: 'mission-vision',
    position: 4,
    title: 'Misión y visión',
    subtitle: 'Propósito',
    body: 'Lo que nos mueve y hacia dónde vamos.',
    items: [
      {
        title: 'Misión',
        description:
          'Formar a las nuevas generaciones en los principios y valores cristianos mediante la educación ética y el ' +
          'desarrollo del pensamiento analítico y reflexivo, proporcionándoles actividades formativas y experiencias ' +
          'vivenciales que fortalezcan su compromiso con una vida íntegra, con propósito y una convivencia basada en ' +
          'el respeto y la responsabilidad social.',
      },
      {
        title: 'Visión',
        description:
          'Ser un guía en el crecimiento y formación espiritual y moral de niños y adolescentes, mediante principios ' +
          'y valores, para que se conviertan en gestores de amor, paz, esperanza y transformación en sus comunidades.',
      },
    ],
  },
];

// --------------------------------------------------------------------------------------------
// Quiénes somos
// --------------------------------------------------------------------------------------------

const ABOUT: NewSectionInput[] = [
  {
    page: 'about',
    key: 'intro',
    position: 0,
    title: 'Quiénes somos',
    subtitle: 'Bienestar Moral · Fundación Semillas',
    body:
      'Somos un proyecto de la Fundación Semillas que, desde 2001, acompaña a las instituciones educativas ' +
      'colombianas con docentes-misioneros y material didáctico para la formación ética, humana y ciudadana de ' +
      'niños y adolescentes.',
  },
  {
    page: 'about',
    key: 'legal-nature',
    position: 1,
    layout: 'cards',
    title: 'Naturaleza jurídica',
    subtitle: 'Fundación Semillas',
    body: paragraphs(
      'El proyecto Bienestar Moral es una dependencia de la Fundación Semillas, creada mediante acta oficial de ' +
        'fundadores n.º 001 del 10 de mayo de 2003 y registrada ante la Cámara de Comercio de Pereira el 11 de junio ' +
        'de 2003, con NIT 816007589-8, e inscrita bajo el libro I de las personerías sin ánimo de lucro.',
      'Su función principal es ser guía en el crecimiento y la formación espiritual y moral de niños y adolescentes ' +
        'en las instituciones educativas colombianas de formación inicial, básica y media.',
    ),
  },
  {
    page: 'about',
    key: 'historical-review',
    position: 2,
    layout: 'timeline',
    title: 'Reseña histórica',
    subtitle: 'De 2001 a hoy',
    items: [
      {
        title: '2001 – 2003 · Evolución de la visión',
        description: paragraphs(
          'A comienzos del año 2001, el matrimonio de Paula Andrea López y Salomón Bejarano ofreció su tiempo para ' +
            'ayudar y apoyar a los docentes de una escuela en el Quindío, donde estudiaban dos de sus tres hijos. ' +
            'Inicialmente apoyaron y complementaron a los docentes en sus clases de religión y en las de ética y ' +
            'valores. Viendo cambios positivos en las actitudes y el comportamiento de varios niños, las directivas ' +
            'del plantel preguntaron si conocían a otras personas que pudieran apoyar de manera similar. Sus amigos ' +
            'María Eugenia Barrero y Giomar Restrepo empezaron a apoyarles en estos esfuerzos.',
          'Por medio de contactos informales entre las directivas de planteles educativos de la zona, otras escuelas ' +
            'y colegios solicitaron el apoyo de estas personas. Las maestras Daisy Valencia y Adriana Soto, del norte ' +
            'del Valle, empezaron a apoyar en el Quindío, pero con el tiempo encontraron planteles educativos en el ' +
            'Valle donde su apoyo fue solicitado. Pilar Acevedo y Lorena Bejarano se trasladaron a Armenia y empezaron ' +
            'también a apoyar estas iniciativas en unos colegios del Quindío. Viendo los cambios positivos logrados al ' +
            'enseñar valores éticos y morales usando la Biblia como base, el matrimonio de profesores María Elena ' +
            'Alzate y Fernando Gaviria encontró planteles educativos muy dispuestos a recibir este tipo de apoyo en la ' +
            'ciudad de Manizales.',
          'Durante este período, todos estos docentes ofrecían su tiempo de manera voluntaria, normalmente varias ' +
            'horas por semana. Los esposos Johanna Lemkes y Felipe Nunn, que vivían entonces en Armenia, notaron la ' +
            'efectividad de este apoyo escolar y se dedicaron a buscar patrocinadores para cubrir algunos de los ' +
            'gastos de estos docentes, para que quienes así lo desearan pudieran dedicar más tiempo a esta hermosa labor.',
        ),
        imageUrl: `${IMG}/historia/resena-clase-pilar-acevedo.jpg`,
      },
      {
        title: '2003 · Cobertura de una fundación',
        description:
          'Para 2003 esta red informal de docentes estaba creciendo de manera natural y espontánea. Las parejas ' +
          'María Elena y Fernando (Manizales), Johanna y Felipe (Armenia), junto con otros dos matrimonios, Elizabeth ' +
          'Martínez y Gregorio Taborda (Pereira), y Allison y Héctor Fabio Aguirre (Riopaila), vieron la necesidad y ' +
          'juntos formaron una fundación sin ánimo de lucro llamada Fundación Semillas. Esta daría cobertura más ' +
          'formal a esta red informal de docentes, que desde 2003 asumió el nombre de proyecto Bienestar Moral. La ' +
          'Fundación también tiene otras dependencias.',
        imageUrl: `${IMG}/historia/resena-familia-nunn.jpg`,
      },
      {
        title: '2003 – hoy · Al servicio de Dios y de la comunidad',
        description: paragraphs(
          'Por medio de la Fundación Semillas, y bajo el nombre de Bienestar Moral, se ha podido recoger fondos y ' +
            'proveer coordinación y logística, apoyando así de una forma más completa a los docentes en sus labores en ' +
            'escuelas y colegios en diversas partes de Colombia. Cada docente es un cristiano comprometido con el ' +
            'Señor Jesucristo que busca vivir en armonía con la revelación de Dios en las Sagradas Escrituras. Estamos ' +
            'convencidos de que es Dios quien transforma la vida del ser humano, también la de niños y jóvenes, si le ' +
            'abrimos nuestro corazón.',
          'Los docentes de Bienestar Moral no promueven ni critican ninguna religión o agrupación religiosa. Buscan ' +
            'servir a Dios, a las familias y a la comunidad mostrando el amor de Dios y explicando y promoviendo los ' +
            'valores eternos consignados en la Santa Biblia. Como cantamos en la primera estrofa del Himno Nacional de ' +
            'Colombia, la noche pasa, la luz llega y el alma encuentra libertad al comprender y responder a «las ' +
            'palabras del que murió en la cruz».',
          '«¡Cesó la horrible noche! La libertad sublime\nderrama las auroras de su invencible luz.\nLa humanidad ' +
            'entera, que entre cadenas gime,\ncomprende las palabras del que murió en la cruz».',
        ),
        imageUrl: `${IMG}/historia/2007-equipo-bienestar-moral.jpg`,
      },
    ],
  },
];

// --------------------------------------------------------------------------------------------
// Servicios de apoyo
// --------------------------------------------------------------------------------------------

const SERVICES: NewSectionInput[] = [
  {
    page: 'services',
    key: 'intro',
    position: 0,
    title: 'Servicios de apoyo',
    subtitle: 'Acompañamiento a instituciones educativas',
    body:
      'Ponemos a disposición de las instituciones educativas de Colombia acompañamiento en el aula, talleres para ' +
      'estudiantes y espacios de formación para padres de familia, con docentes-misioneros y material didáctico propio.',
  },
  {
    page: 'services',
    key: 'class-support',
    position: 1,
    layout: 'cards',
    title: 'Refuerzo de valores en clase',
    subtitle: 'Valores éticos, humanos y de formación ciudadana',
    body: paragraphs(
      'El fortalecimiento y desarrollo de los valores éticos y humanos y de las competencias ciudadanas en los ' +
        'estudiantes de educación inicial, básica y media es fundamental para la formación integral de niños y ' +
        'adolescentes de nuestro país. El proyecto Bienestar Moral fortalece las habilidades para la vida e impulsa ' +
        'a los educandos a una sana convivencia con los demás, a la toma de decisiones responsables y a la ' +
        'participación activa y solidaria en su comunidad.',
      'Para ello dispone de docentes-misioneros cualificados en el área de ética y valores y de formación ' +
        'ciudadana, que ofrecen apoyo a las instituciones educativas colombianas de formación preescolar, básica y ' +
        'media. Los maestros cuentan con material didáctico para el desarrollo de las clases, y los niños y ' +
        'adolescentes también reciben material impreso para cada encuentro con el docente-misionero. En este ' +
        'sentido, nuestros docentes-misioneros refuerzan y apoyan lo enseñado por el profesor titular de cada curso.',
    ),
    imageUrl: `${IMG}/historia/resena-clase-pilar-acevedo.jpg`,
  },
  {
    page: 'services',
    key: 'student-workshops',
    position: 2,
    layout: 'numbered',
    title: 'Talleres para estudiantes',
    subtitle: 'Carácter sólido y hábitos saludables',
    body:
      'El proyecto Bienestar Moral ofrece a los estudiantes talleres para el fortalecimiento de un carácter sólido ' +
      'y el desarrollo de hábitos saludables que se reflejen en su vida diaria, mediante actividades dinámicas, ' +
      'reflexivas y prácticas en donde cada participante descubra su potencial, fortalezca su autoestima y asuma con ' +
      'responsabilidad la construcción de su bienestar integral.',
    items: [
      { title: 'El peligro de las adicciones', description: 'Alcohol, drogas y redes sociales. Hábitos sanos.' },
      { title: 'La salud mental y la autoestima' },
      { title: 'Sexualidad', description: 'La importancia de respetar y hacer respetar su cuerpo.' },
    ],
  },
  {
    page: 'services',
    key: 'parent-workshops',
    position: 3,
    layout: 'numbered',
    title: 'Talleres para escuela de padres',
    subtitle: 'La familia, pilar del desarrollo integral',
    body:
      'El proyecto Bienestar Moral pone a disposición de las instituciones a nivel nacional espacios de encuentro y ' +
      'formación para padres de familia y acudientes de los niños y adolescentes de los diferentes niveles ' +
      'educativos, diseñados para el fortalecimiento del rol familiar como pilar fundamental en el desarrollo ' +
      'integral de los hijos e hijas y en la construcción de relaciones basadas en el respeto, el diálogo y el ' +
      'acompañamiento consciente, que favorezcan un ambiente familiar armónico y de apoyo mutuo, mediante ' +
      'actividades prácticas, reflexiones y herramientas pedagógicas.',
    items: [
      { title: 'El valor de la familia' },
      { title: 'Crianza de hijos' },
      { title: 'Relación de pareja' },
      { title: 'Manejando las finanzas del hogar' },
    ],
  },
];

// --------------------------------------------------------------------------------------------
// Valores humanos
// --------------------------------------------------------------------------------------------

const HUMAN_VALUES: NewSectionInput[] = [
  {
    page: 'human-values',
    key: 'intro',
    position: 0,
    title: 'Valores humanos',
    subtitle: 'Valores éticos, humanos y de formación ciudadana',
    body:
      'Trabajamos un banco de más de cuarenta valores, cada uno con un objetivo de formación claro. Descarga gratis ' +
      'las cartillas de trabajo, organizadas por nivel educativo.',
  },
  {
    page: 'human-values',
    key: 'value-bank',
    position: 1,
    layout: 'numbered',
    title: 'Banco de valores',
    subtitle: 'Valores y objetivos de formación',
    body: 'Estos son los valores con los que contamos actualmente y el objetivo con el que trabajamos cada uno.',
    items: [
      value('La amistad', 'Crear un vínculo duradero basado en la confianza, el respeto y la comunicación, para el apoyo mutuo y el disfrute compartido.'),
      value('El perdón', 'Elegir liberarse del peso de la ofensa para la reconciliación y la paz interior.'),
      value('El compartir', 'Crear un ambiente de empatía y cooperación, de generosidad y de apoyo mutuo para el logro del bienestar común y el fortalecimiento de la comunidad.'),
      value('La obediencia', 'Promover la obediencia como fortalecimiento de la disciplina personal y el respeto a las autoridades, para el desarrollo de una sociedad más ordenada y respetuosa.'),
      value('La valentía', 'Enfocarse en acciones firmes para la toma de decisiones en momentos difíciles en defensa de una causa justa.'),
      value('La verdad', 'Fomentar en los niños la práctica de la verdad como principio fundamental para el desarrollo de una conducta honesta, transparente y coherente en sus relaciones personales, escolares y sociales.'),
      value('La paciencia', 'Fomentar relaciones interpersonales más empáticas en la convivencia familiar y escolar, para la comprensión y las conversaciones calmadas en busca de soluciones constructivas.'),
      value('La justicia', 'Contribuir al desarrollo de una comunidad respetuosa de las reglas, las normas éticas y los principios democráticos, para el bienestar común y la convivencia pacífica en condiciones de equidad, dignidad y libertad.'),
      value('El amor', 'Expresar el amor de forma consciente con palabras de gratitud o afecto a una persona importante cada día, para el fortalecimiento de las relaciones interpersonales.'),
      value('El respeto', 'Promover la consideración, la tolerancia y el reconocimiento de la dignidad de uno mismo, de los demás y del entorno para la generación de un ambiente de tolerancia y empatía.'),
      value('La gratitud', 'Practicar expresiones de gratitud por la vida, la salud, la amistad y por todo aquello que nos rodea, para el fomento del reconocimiento por todo lo recibido día a día.'),
      value('El prestar atención', 'Fomentar la práctica diaria de escuchar activamente en las conversaciones para el mejoramiento de la empatía y la comprensión.'),
      value('La fidelidad', 'Demostrar lealtad a los amigos, con manifestaciones de apoyo y ayuda en momentos de necesidad, para el fortalecimiento del sentido de unión y compromiso mutuo.'),
      value('La confianza', 'Interiorizar y aplicar el valor de la confianza en la vida escolar y personal para la transparencia, la coherencia, la credibilidad y el fortalecimiento de las relaciones interpersonales.'),
      value('El gozo', 'Incorporar el valor del gozo en el desarrollo integral de cada uno de los niños, para un desarrollo emocionalmente equilibrado y feliz.'),
      value('La humildad y la mansedumbre', 'Promover la mansedumbre como un valor esencial en la convivencia escolar, para el fomento de actitudes de respeto, paciencia y autocontrol en las relaciones interpersonales.'),
      value('El dominio propio', 'Autodisciplina y autocontrol: desarrollar el dominio de las emociones, comportamientos e impulsos de manera autónoma y constructiva, para el fomento de un ambiente escolar positivo y enriquecedor.'),
      value('El orden y la limpieza', 'Promover el desarrollo del valor del orden y la limpieza en los niños escolares para el mejoramiento de su entorno personal, académico y social.'),
      value('La compasión', 'Fomentar en los niños la comprensión, el respeto y una actitud positiva ante las necesidades y emociones de los demás, para un entorno inclusivo y solidario.'),
      value('La creatividad', 'Explorar nuevas ideas y las capacidades creativas de los estudiantes para la expresión de sus pensamientos de manera innovadora y efectiva.'),
      value('La responsabilidad', 'Desarrollar actividades de aprendizaje para la enseñanza de la importancia de asumir las consecuencias de las acciones y el compromiso hacia uno mismo y los demás.'),
      value('El contentamiento', 'Desarrollar una actitud de satisfacción interior y agradecimiento a Dios por las bendiciones diarias.'),
      value('La cortesía', 'Practicar acciones amables hacia los demás para el fortalecimiento de las relaciones interpersonales con la familia, los amigos y la comunidad en general.'),
      value('La generosidad', 'Establecer diferencias entre actos generosos y egoístas para la participación en actividades de servicio comunitario.'),
    ],
  },
  {
    page: 'human-values',
    key: 'more-values',
    position: 2,
    layout: 'tags',
    title: 'Valores que buscamos cubrir',
    subtitle: 'Nuestro banco sigue creciendo',
    body: 'Estos son los siguientes valores en los que estamos trabajando.',
    items: [
      'La solidaridad', 'La bondad', 'La honestidad', 'La autoestima', 'La convivencia', 'La integridad',
      'La perseverancia', 'La empatía', 'La resiliencia', 'La identidad individual y colectiva', 'La libertad',
      'La fe', 'La sinceridad', 'La armonía', 'La igualdad', 'La equidad', 'La honradez', 'La paz', 'El altruismo',
      'El sentido de pertenencia', 'La consideración',
    ].map((title) => ({ title })),
  },
  {
    page: 'human-values',
    key: 'worksheets',
    position: 3,
    title: 'Cartillas y materiales',
    subtitle: 'Descarga gratuita',
    body:
      'Descubre nuestra colección de material didáctico diseñado para el fortalecimiento y desarrollo ético, ' +
      'emocional y social de los estudiantes.',
  },
];

// --------------------------------------------------------------------------------------------
// Equipo de trabajo
// --------------------------------------------------------------------------------------------

const ZONE = 'Zona de labores:';

const TEAM: NewSectionInput[] = [
  {
    page: 'team',
    key: 'intro',
    position: 0,
    title: 'Equipo de trabajo',
    subtitle: 'Las personas detrás de Bienestar Moral',
    body:
      'Docentes-misioneros, conferencistas, directivos y asesores que, con vocación de servicio, acompañan a ' +
      'estudiantes, docentes y familias en diferentes regiones de Colombia.',
  },
  {
    page: 'team',
    key: 'missionary-teachers',
    position: 1,
    layout: 'people',
    title: 'Docentes misioneros activos',
    subtitle: 'En las aulas',
    items: [
      person('María Marleny Rubio', 'maria-marleny-rubio', 'Maestra – Bachiller', `${ZONE} Boyacá`),
      person('Jorge Humberto Reyes', 'jorge-reyes', 'Maestro – Bachiller', `${ZONE} Antioquia`),
      person('María Hercilia Ariza', 'maria-hercilia-ariza', 'Maestra – Técnica auxiliar de droguería', `${ZONE} Cauca`),
      person('Durley Cristina Castañeda', 'durley-castaneda', 'Licenciada en Pedagogía Infantil', `${ZONE} Cauca`),
      person('Olga Lucía Batero', 'olga-batero', 'Técnico en Primera Infancia', `${ZONE} Risaralda`),
      person('Edward Alberto Tapasco', 'edward-tapasco', 'Técnico en Primera Infancia', `${ZONE} Risaralda`),
      person('Juan Esteban Tapasco', 'juan-esteban-tapasco', 'Maestro, zootecnista en formación', `${ZONE} Risaralda`),
      person('Martha Cecilia Villa', 'martha-villa', 'Maestra – Bachiller', `${ZONE} Valle del Cauca`),
      person('Daisy Valencia', 'daisy-valencia', 'Normalista Superior', `${ZONE} Valle del Cauca`),
      person(
        'Adriana Soto',
        'adriana-soto',
        'Técnico en preescolar y en contabilidad',
        'Diplomado en didáctica de la lectoescritura',
        `${ZONE} Valle del Cauca`,
      ),
      person(
        'Lida Solange Villamizar',
        'lida-villamizar',
        'Técnica en competencias de primera infancia y preescolar',
        'Experiencia con lengua de señas. Técnica auxiliar contable',
        `${ZONE} Valle del Cauca`,
      ),
      person(
        'Paola Liliana Tapasco',
        'paola-liliana-tapasco',
        'Estudiante de Licenciatura en Educación Infantil',
        `${ZONE} Caldas y Risaralda`,
      ),
      person('Pilar Acevedo', 'pilar-acevedo', 'Maestra – Bachiller, Pedagogía Infantil (SENA)', `${ZONE} Valle del Magdalena`),
    ],
  },
  {
    page: 'team',
    key: 'speakers',
    position: 2,
    layout: 'people',
    title: 'Conferencistas',
    subtitle: 'Talleres y conferencias',
    items: [
      person('Julieth Manjarres', 'julieth-manjarres', 'Psicóloga', 'Psicóloga Educativa (Universidad Antonio Nariño)'),
      person(
        'Heydi Trejos',
        'heydi-trejos',
        'Psicóloga',
        'Psicóloga (Universidad de Ibagué)',
        'Especialista en Psicología Clínica (Universidad Católica de Colombia)',
      ),
      person('Salomón Bejarano', 'salomon-bejarano', 'Juventud', 'Asesor vivencial especializado en adicciones'),
      person(
        'Julio Villamizar',
        'julio-villamizar',
        'Educador y teólogo',
        'Estudios teológicos BEREA, Colombia',
        'Técnico laboral por competencias en educación preescolar (Instituto Ser Internacional)',
        'Derechos de los niños en el proceso de formación deportiva (UTP)',
        'Humanización en la prestación de servicios de salud (SENA)',
        'Manejo básico de herramientas ofimáticas (SENA)',
      ),
      person(
        'Felipe Nunn',
        'felipe-nunn',
        'Educador, teólogo y especializado en la familia',
        'BSc. MSc. Maestría en Teología (Universidad Católica de Tilburg, Países Bajos)',
      ),
    ],
  },
  {
    page: 'team',
    key: 'direction',
    position: 3,
    layout: 'people',
    title: 'Dirección',
    subtitle: 'Liderazgo del proyecto',
    items: [
      person(
        'Julio César Villamizar',
        'julio-villamizar',
        'Director',
        'Docente de FEB, Colombia',
        'Presidente de la Personería Jurídica HCECJ',
      ),
      person('Daisy Valencia', 'daisy-valencia', 'Coordinadora', 'Normalista Superior (Normal Superior Zarzal)'),
      person(
        'Felipe Nunn',
        'felipe-nunn',
        'Visión y logística',
        'BSc en Matemáticas, MSc en Estadística (Londres, Reino Unido)',
        'Maestría en Teología (Universidad Católica de Tilburg, Países Bajos)',
      ),
    ],
  },
  {
    page: 'team',
    key: 'support-team',
    position: 4,
    layout: 'people',
    title: 'Equipo de apoyo',
    subtitle: 'Asesoría y administración',
    items: [
      person(
        'Dámaris Saavedra Lozano',
        'damaris-saavedra',
        'Asesora pedagógica',
        'Licenciada en Lenguas Extranjeras (UNIVALLE)',
        'Especialista en Gerencia de Proyectos (UNITOLIMA)',
        'Doctorado en Ciencias Pedagógicas (La Habana, Cuba)',
      ),
      person('Julieth Manjarres', 'julieth-manjarres', 'Asesora en psicología', 'Psicóloga Educativa (Universidad Antonio Nariño)'),
      person(
        'Heydi Trejos',
        'heydi-trejos',
        'Asesora en psicología',
        'Psicóloga (Universidad de Ibagué)',
        'Especialista en Psicología Clínica (Universidad Católica de Colombia)',
      ),
      person(
        'Gregorio Taborda',
        'gregorio-taborda',
        'Asesor en teología',
        'Director de FEB y Emmaús Colombia',
        'Coordinador de Emmaús para Centroamérica',
      ),
      person(
        'Felipe Nunn',
        'felipe-nunn',
        'Asesor en teología',
        "Estudios teológicos en OTS (Canadá) y Spurgeon's College (Reino Unido)",
        'Maestría en Cristianismo y Sociedad (Universidad Católica de Tilburg, Países Bajos)',
      ),
      person('Jésica Fernanda Guzmán', 'jesica-guzman', 'Finanzas', 'Contadora pública (Universidad Cooperativa de Colombia)'),
      person(
        'Melissa Martínez',
        'melissa-martinez',
        'Administradora financiera',
        'Administradora Ambiental (Universidad Tecnológica de Pereira)',
      ),
    ],
  },
];

// --------------------------------------------------------------------------------------------
// Contáctenos
// --------------------------------------------------------------------------------------------

const CONTACT: NewSectionInput[] = [
  {
    page: 'contact',
    key: 'intro',
    position: 0,
    title: 'Contáctenos',
    subtitle: 'Estamos para servirle',
    body:
      '¿Quiere llevar Bienestar Moral a su institución educativa o conocer más sobre nuestros talleres? ' +
      'Escríbanos o visítenos en nuestra oficina principal.',
  },
  {
    page: 'contact',
    key: 'contact-info',
    position: 1,
    layout: 'contact',
    title: 'Información de contacto',
    subtitle: 'Oficina principal',
    items: [
      { title: 'Dirección', description: 'Carrera 3 # 22-47, Pereira, Risaralda' },
      { title: 'Correo electrónico', description: 'jucesarvh77@hotmail.com' },
      { title: 'WhatsApp', description: '320 730 5719' },
      { title: 'Persona de contacto', description: 'Julio César Villamizar, director' },
    ],
  },
  {
    page: 'contact',
    key: 'legal-representation',
    position: 2,
    layout: 'contact',
    title: 'Representación legal',
    subtitle: 'Fundación Semillas',
    body:
      'Bienestar Moral es una de las varias dependencias de la Fundación Semillas, entidad sin ánimo de lucro con ' +
      'domicilio en la ciudad de Pereira, Risaralda, inscrita en la Cámara de Comercio de Pereira el 11 de junio de ' +
      '2003 (inscripción n.º S0502444), con NIT 816007589-8.',
    items: [
      { title: 'Sitio web de la Fundación Semillas', description: 'https://fundasemillas.org/' },
      { title: 'Representación legal', description: 'https://fundasemillas.org/representacion/' },
    ],
  },
];

export const DEFAULT_SECTIONS: NewSectionInput[] = [...HOME, ...ABOUT, ...SERVICES, ...HUMAN_VALUES, ...TEAM, ...CONTACT];
