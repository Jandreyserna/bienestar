import { ValidationError } from './errors.js';

const MAX_LENGTH = 500;

/**
 * Value Object: ruta pública de una imagen o archivo.
 * Acepta URLs absolutas http(s) (p. ej. el dominio de Hostinger) o rutas
 * relativas al sitio que empiecen por "/".
 */
export class MediaUrl {
  private constructor(readonly value: string) {}

  static from(raw: string, field = 'imageUrl'): MediaUrl {
    const value = raw.trim();
    if (value.length === 0 || value.length > MAX_LENGTH) {
      throw ValidationError.field(field, `La URL debe tener entre 1 y ${MAX_LENGTH} caracteres`);
    }
    if (value.startsWith('/') && !value.startsWith('//')) {
      return new MediaUrl(value);
    }
    try {
      const url = new URL(value);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return new MediaUrl(value);
      }
    } catch {
      // se reporta abajo
    }
    throw ValidationError.field(field, 'La URL debe ser http(s) o una ruta que empiece por "/"');
  }

  /** Igual que `from`, pero acepta vacío/null y devuelve null. */
  static optional(raw: string | null | undefined, field = 'imageUrl'): MediaUrl | null {
    if (raw === undefined || raw === null || raw.trim() === '') return null;
    return MediaUrl.from(raw, field);
  }
}
