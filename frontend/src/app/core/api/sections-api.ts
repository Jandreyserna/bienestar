import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config';
import type { NewSectionPayload, PageSlug, Section, SectionPayload } from '../models';

/** Acceso a /api/sections. Las lecturas son recursos reactivos; las escrituras, Observables. */
@Injectable({ providedIn: 'root' })
export class SectionsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_CONFIG).baseUrl}/sections`;

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
