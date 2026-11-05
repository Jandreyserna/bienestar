import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { API_CONFIG } from './core/config/api-config';
import type { Section, SectionItem, Worksheet } from './core/models';

const API = 'http://api.test/api';

function section(partial: Partial<Section>): Section {
  return {
    id: crypto.randomUUID(),
    page: 'home',
    key: 'x',
    title: 'X',
    subtitle: null,
    body: null,
    imageUrl: null,
    layout: 'cards',
    position: 0,
    isCore: true,
    items: [],
    createdAt: '',
    updatedAt: '',
    ...partial,
  };
}

function item(title: string, description: string | null = null, imageUrl: string | null = null): SectionItem {
  return { id: crypto.randomUUID(), title, description, imageUrl, position: 0 };
}

function worksheet(partial: Partial<Worksheet>): Worksheet {
  return {
    id: crypto.randomUUID(),
    title: 'Cartilla',
    description: 'Descripción',
    humanValue: 'Respeto',
    level: 'primary',
    file: { url: 'https://x/a.pdf', name: 'a.pdf', mimeType: 'application/pdf', sizeBytes: 2048 },
    createdAt: '',
    updatedAt: '',
    ...partial,
  };
}

describe('Sitio público', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
        // DI: la URL de la API se inyecta, así el test no depende del environment.
        { provide: API_CONFIG, useValue: { baseUrl: API } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('el inicio muestra portada, historia, fundadores, misión/visión y las secciones agregadas', async () => {
    const harness = await RouterTestingHarness.create('/');
    http.expectOne(`${API}/navigation`).flush([]);
    http.expectOne(`${API}/sections?page=home`).flush([
      section({ key: 'hero', title: 'Bienestar Moral', subtitle: 'Sembrando principios' }),
      section({ key: 'history', title: 'Nuestra historia', items: [item('2001 · El comienzo', 'Primer taller')] }),
      section({ key: 'founders', title: 'Fundadores', items: [item('Fernando y María Elena Gaviria')] }),
      section({
        key: 'mission-vision',
        title: 'Misión y visión',
        items: [item('Misión', 'Formar en valores'), item('Visión', 'Ser referente')],
      }),
      section({ key: 'aliados', title: 'Aliados', isCore: false, layout: 'tags', items: [item('Colegio San José')] }),
    ]);
    await harness.fixture.whenStable();

    const root = harness.routeNativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Sembrando principios');
    expect(text).toContain('2001 · El comienzo');
    expect(text).toContain('Formar en valores');
    // Sin foto, el fundador muestra sus iniciales (sin el conector "y").
    expect(root.querySelector('#founders .placeholder')?.textContent?.trim()).toBe('FM');
    // Una sección creada en el panel se presenta con el diseño elegido y su ancla para el menú.
    expect(root.querySelector('#aliados .tag')?.textContent).toContain('Colegio San José');
  });

  it('el menú lista cada página con sus secciones, que enlazan a su ancla', async () => {
    const harness = await RouterTestingHarness.create('/');
    http.expectOne(`${API}/navigation`).flush([
      { page: 'home', sections: [{ key: 'history', title: 'Nuestra historia' }] },
      { page: 'team', sections: [{ key: 'speakers', title: 'Conferencistas' }] },
    ]);
    http.expectOne(`${API}/sections?page=home`).flush([]);
    await harness.fixture.whenStable();

    const nav = document.querySelector('#site-nav') as HTMLElement;
    const labels = Array.from(nav.querySelectorAll('.nav-link')).map((a) => a.textContent?.trim());
    expect(labels).toEqual(['Inicio', 'Quiénes somos', 'Servicios', 'Valores humanos', 'Equipo', 'Contáctenos']);
    const speakers = nav.querySelector('#sub-team a') as HTMLAnchorElement;
    expect(speakers.textContent).toContain('Conferencistas');
    expect(speakers.getAttribute('href')).toBe('/equipo#speakers');
  });

  it('equipo de trabajo muestra a las personas con su cargo destacado', async () => {
    const harness = await RouterTestingHarness.create('/equipo');
    http.expectOne(`${API}/navigation`).flush([]);
    http.expectOne(`${API}/sections?page=team`).flush([
      section({ page: 'team', key: 'intro', title: 'Equipo de trabajo', body: 'Nuestro equipo' }),
      section({
        page: 'team',
        key: 'speakers',
        title: 'Conferencistas',
        isCore: false,
        layout: 'people',
        items: [item('Heydi Trejos', 'Psicóloga\nEspecialista en Psicología Clínica', '/contenido/equipo/heydi.jpg')],
      }),
    ]);
    await harness.fixture.whenStable();

    const root = harness.routeNativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent).toContain('Equipo de trabajo');
    const person = root.querySelector('#speakers .person') as HTMLElement;
    expect(person.querySelector('h3')?.textContent).toContain('Heydi Trejos');
    expect(person.querySelector('.role')?.textContent).toContain('Psicóloga');
    expect(person.querySelector('.details')?.textContent).toContain('Especialista en Psicología Clínica');
  });

  it('contáctenos convierte correo, WhatsApp y enlaces en accesos directos', async () => {
    const harness = await RouterTestingHarness.create('/contacto');
    http.expectOne(`${API}/navigation`).flush([]);
    http.expectOne(`${API}/sections?page=contact`).flush([
      section({ page: 'contact', key: 'intro', title: 'Contáctenos' }),
      section({
        page: 'contact',
        key: 'contact-info',
        title: 'Información de contacto',
        isCore: false,
        layout: 'contact',
        items: [
          item('Correo electrónico', 'info@bienestar.org'),
          item('WhatsApp', '320 730 5719'),
          item('Sitio web', 'https://fundasemillas.org/'),
        ],
      }),
    ]);
    await harness.fixture.whenStable();

    const links = Array.from((harness.routeNativeElement as HTMLElement).querySelectorAll('#contact-info a')).map(
      (a) => a.getAttribute('href'),
    );
    expect(links).toEqual(['mailto:info@bienestar.org', 'https://wa.me/573207305719', 'https://fundasemillas.org/']);
  });

  it('valores humanos separa las cartillas por nivel y enlaza cada valor con sus cartillas', async () => {
    const harness = await RouterTestingHarness.create('/valores-humanos');
    http.expectOne(`${API}/navigation`).flush([]);
    http.expectOne(`${API}/sections?page=human-values`).flush([
      section({ page: 'human-values', key: 'intro', title: 'Valores humanos' }),
      section({
        page: 'human-values',
        key: 'value-bank',
        title: 'Banco de valores',
        isCore: false,
        layout: 'numbered',
        items: [item('La amistad', 'Crear un vínculo duradero'), item('El perdón', 'Liberarse de la ofensa')],
      }),
      section({ page: 'human-values', key: 'worksheets', title: 'Cartillas y materiales' }),
    ]);
    http.expectOne(`${API}/worksheets`).flush([
      worksheet({ id: 'w1', title: 'El valor de la amistad', humanValue: 'La amistad', level: 'preschool' }),
      worksheet({ id: 'w2', title: 'El valor de la amistad', humanValue: 'Amistad', level: 'primary' }),
    ]);
    await harness.fixture.whenStable();

    const root = harness.routeNativeElement as HTMLElement;
    expect(root.querySelector('#preescolar')?.textContent).toContain('El valor de la amistad');
    expect(root.querySelector('#primaria a[download]')?.getAttribute('href')).toBe(`${API}/worksheets/w2/download`);
    expect(root.querySelector('#secundaria')?.textContent).toContain('Aún no hay cartillas');

    const links = root.querySelectorAll('#value-bank .item-link');
    expect(links).toHaveLength(1); // "El perdón" aún no tiene cartillas
    expect(links[0].textContent).toContain('Ver 2 cartillas');
    expect(links[0].getAttribute('href')).toBe('/valores-humanos?valor=La%20amistad#worksheets');
  });
});
