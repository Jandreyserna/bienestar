import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { type ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth-interceptor';
import { API_CONFIG } from './core/config/api-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Los parámetros de ruta y query llegan como input() a los componentes.
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    // XHR (no fetch) para poder mostrar el progreso de subida de las cartillas.
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    { provide: API_CONFIG, useValue: { baseUrl: environment.apiUrl.replace(/\/+$/, '') } },
    { provide: LOCALE_ID, useValue: 'es' },
  ],
};
