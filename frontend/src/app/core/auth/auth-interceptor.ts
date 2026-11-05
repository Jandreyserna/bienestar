import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_CONFIG } from '../config/api-config';
import { AuthService } from './auth-service';

/** Adjunta el token a las peticiones hacia la API y cierra la sesión si la API responde 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const { baseUrl } = inject(API_CONFIG);
  if (!req.url.startsWith(baseUrl)) return next(req);

  const token = auth.token();
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  const isLogin = req.url.endsWith('/auth/login');

  return next(request).pipe(
    catchError((error: unknown) => {
      if (token && !isLogin && error instanceof HttpErrorResponse && error.status === 401) {
        auth.logout('expired');
      }
      return throwError(() => error);
    }),
  );
};
