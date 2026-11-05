import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { API_CONFIG } from './core/config/api-config';
import type { Section } from './core/models';

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
    position: 0,
    isCore: true,
    items: [],
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
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        // DI: la URL de la API se inyecta, así el test no depende del environment.
        { provide: API_CONFIG, useValue: { baseUrl: API } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('el inicio muestra portada, historia, fundadores y misión/visión desde la API', async () => {
    const harness = await RouterTestingHarness.create('/');
    http.expectOne(`${API}/sections?page=home`).flush([
      section({ key: 'hero', title: 'Bienestar Moral', subtitle: 'Educamos en valores' }),
      section({
        key: 'history',
        title: 'Nuestra historia',
        items: [{ id: 'h1', title: '2019: el comienzo', description: 'Primer taller', imageUrl: null, position: 0 }],
      }),
      section({
        key: 'founders',
        title: 'Fundadores',
        items: [{ id: 'f1', title: 'Ana María Ruiz', description: null, imageUrl: null, position: 0 }],
      }),
      section({
        key: 'mission-vision',
        title: 'Misión y visión',
        items: [
          { id: 'm', title: 'Misión', description: 'Formar en valores', imageUrl: null, position: 0 },
          { id: 'v', title: 'Visión', description: 'Ser referente', imageUrl: null, position: 1 },
        ],
      }),
    ]);
    await harness.fixture.whenStable();

    const text = (harness.routeNativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Educamos en valores');
    expect(text).toContain('2019: el comienzo');
    expect(text).toContain('Ana María Ruiz');
    expect(text).toContain('Formar en valores');
  });

  it('valores humanos separa las cartillas en primaria y secundaria con enlace de descarga', async () => {
    const harness = await RouterTestingHarness.create('/valores-humanos');
    http.expectOne(`${API}/sections?page=human-values`).flush([]);
    http.expectOne(`${API}/worksheets`).flush([
      {
        id: 'w1',
        title: 'Aprendo a escuchar',
        description: 'Juegos de escucha',
        humanValue: 'Respeto',
        level: 'primary',
        file: { url: 'https://x/a.pdf', name: 'a.pdf', mimeType: 'application/pdf', sizeBytes: 2048 },
        createdAt: '',
        updatedAt: '',
      },
    ]);
    await harness.fixture.whenStable();

    const root = harness.routeNativeElement as HTMLElement;
    const primary = root.querySelector('#primaria')!;
    const secondary = root.querySelector('#secundaria')!;
    expect(primary.textContent).toContain('Aprendo a escuchar');
    expect(secondary.textContent).toContain('Aún no hay cartillas');
    expect(primary.querySelector('a[download]')?.getAttribute('href')).toBe(`${API}/worksheets/w1/download`);
  });
});
