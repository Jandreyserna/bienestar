import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { type Observable, tap } from 'rxjs';
import { API_CONFIG } from '../config/api-config';
import type { Session } from '../models';

const STORAGE_KEY = 'bm.admin.session';

/** Sesión del panel de administración (token JWT emitido por la API). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly url = `${inject(API_CONFIG).baseUrl}/auth`;

  private readonly session = signal<Session | null>(readStoredSession());

  readonly adminEmail = computed(() => this.session()?.admin.email ?? null);

  /** Se evalúa en cada llamada porque la expiración depende de la hora actual. */
  isAuthenticated(): boolean {
    const session = this.session();
    return session !== null && Date.parse(session.expiresAt) > Date.now();
  }

  token(): string | null {
    return this.isAuthenticated() ? this.session()!.token : null;
  }

  login(email: string, password: string): Observable<Session> {
    return this.http.post<Session>(`${this.url}/login`, { email, password }).pipe(
      tap((session) => {
        this.session.set(session);
        writeStoredSession(session);
      }),
    );
  }

  logout(reason?: 'expired'): void {
    this.session.set(null);
    writeStoredSession(null);
    void this.router.navigate(['/admin/login'], reason ? { queryParams: { motivo: reason } } : {});
  }
}

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: Session | null): void {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Almacenamiento no disponible (modo privado): la sesión dura lo que dure la pestaña.
  }
}
