import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config';
import type { NavigationPage, NewSectionPayload, PageSlug, Section, SectionPayload } from '../models';

/** Acceso a /api/sections. Las lecturas son recursos reactivos; las escrituras, Observables. */
@Injectable({ providedIn: 'root' })
export class SectionsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;
  private readonly url = `${this.baseUrl}/sections`;

  /** Menú del sitio con las secciones de cada página. */
  navigationResource() {
    return httpResource<NavigationPage[]>(() => `${this.baseUrl}/navigation`, { defaultValue: [] });
  }

  /** Secciones de una página. Debe llamarse en contexto de inyección (p. ej. al declarar un campo). */
  pageResource(page: () => PageSlug) {
    return httpResource<Section[]>(() => ({ url: this.url, params: { page: page() } }), {
      defaultValue: [],
    });
  }

  sectionResource(id: () => string | undefined) {
    return httpResource<Section>(() => {
      const value = id();
      return value ? `${this.url}/${value}` : undefined;
    });
  }

  create(payload: NewSectionPayload): Observable<Section> {
    return this.http.post<Section>(this.url, payload);
  }

  update(id: string, payload: SectionPayload): Observable<Section> {
    return this.http.put<Section>(`${this.url}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
