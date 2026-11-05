import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_CONFIG } from '../config/api-config';
import { apiErrorMessage } from '../http/api-error';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from './auth-service';

const API = 'http://api.test/api';

describe('Autenticación del panel', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let client: HttpClient;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'admin/login', children: [] }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: API } },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });

  function login(expiresAt = new Date(Date.now() + 3600_000).toISOString()): void {
    auth.login('admin@test.org', 'clave').subscribe();
    http.expectOne(`${API}/auth/login`).flush({ token: 'jwt-123', expiresAt, admin: { id: '1', email: 'admin@test.org' } });
  }

  it('guarda la sesión y adjunta el token solo a peticiones de la API', () => {
    login();
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.adminEmail()).toBe('admin@test.org');

    client.get(`${API}/sections`).subscribe();
    expect(http.expectOne(`${API}/sections`).request.headers.get('Authorization')).toBe('Bearer jwt-123');

    client.get('https://otro-sitio.com/data').subscribe();
    expect(http.expectOne('https://otro-sitio.com/data').request.headers.has('Authorization')).toBe(false);
  });

  it('una sesión expirada no cuenta como autenticada', () => {
    login(new Date(Date.now() - 1000).toISOString());
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.token()).toBeNull();
  });

  it('cierra la sesión si la API responde 401', () => {
    login();
    client.get(`${API}/auth/me`).subscribe({ error: () => undefined });
    http.expectOne(`${API}/auth/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('traduce el formato de error estándar de la API', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son válidos',
          details: { fields: [{ field: 'title', message: 'El campo "title" es obligatorio' }] },
        },
      },
    });
    expect(apiErrorMessage(error)).toBe('Los datos enviados no son válidos: El campo "title" es obligatorio');
    expect(apiErrorMessage(new HttpErrorResponse({ status: 0 }))).toContain('No hay conexión');
  });
});
