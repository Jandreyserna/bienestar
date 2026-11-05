import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config';
import type { StoredImage } from '../models';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Injectable({ providedIn: 'root' })
export class MediaApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_CONFIG).baseUrl}/media`;

  uploadImage(file: File): Observable<StoredImage> {
    const data = new FormData();
    data.append('file', file, file.name);
    return this.http.post<StoredImage>(`${this.url}/images`, data);
  }
}
