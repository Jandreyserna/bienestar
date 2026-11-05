import { HttpClient, type HttpEvent, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config';
import type { EducationLevel, Worksheet, WorksheetPayload } from '../models';

/** Acceso a /api/worksheets (cartillas). */
@Injectable({ providedIn: 'root' })
export class WorksheetsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_CONFIG).baseUrl}/worksheets`;

  listResource(level: () => EducationLevel | undefined = () => undefined) {
    return httpResource<Worksheet[]>(
      () => {
        const value = level();
        const params: Record<string, string> = value ? { level: value } : {};
        return { url: this.url, params };
      },
      { defaultValue: [] },
    );
  }

  worksheetResource(id: () => string | undefined) {
    return httpResource<Worksheet>(() => {
      const value = id();
      return value ? `${this.url}/${value}` : undefined;
    });
  }

  /** Emite eventos de progreso de subida y al final la respuesta. */
  create(payload: WorksheetPayload): Observable<HttpEvent<Worksheet>> {
    return this.http.post<Worksheet>(this.url, toFormData(payload), {
      reportProgress: true,
      observe: 'events',
    });
  }

  update(id: string, payload: WorksheetPayload): Observable<HttpEvent<Worksheet>> {
    return this.http.put<Worksheet>(`${this.url}/${id}`, toFormData(payload), {
      reportProgress: true,
      observe: 'events',
    });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** Enlace directo de descarga (lo sirve la API a través del Worker de archivos). */
  downloadUrl(id: string): string {
    return `${this.url}/${id}/download`;
  }
}

function toFormData(payload: WorksheetPayload): FormData {
  const data = new FormData();
  data.append('title', payload.title);
  data.append('description', payload.description);
  data.append('humanValue', payload.humanValue);
  data.append('level', payload.level);
  if (payload.file) data.append('file', payload.file, payload.file.name);
  return data;
}
