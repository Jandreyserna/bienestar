import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: { fields?: { field: string; message: string }[] };
  };
}

/** Convierte cualquier error HTTP en un mensaje legible usando el formato estándar de la API. */
export function apiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 0) {
    return 'No hay conexión con el servidor. Verifica que la API esté en línea.';
  }
  const body = (error.error ?? {}) as ApiErrorBody;
  const message = body.error?.message;
  if (!message) return fallback;
  const fields = body.error?.details?.fields ?? [];
  return fields.length > 0 ? `${message}: ${fields.map((f) => f.message).join('; ')}` : message;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function fileKind(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.includes('word')) return 'Word';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PowerPoint';
  return 'Documento';
}
