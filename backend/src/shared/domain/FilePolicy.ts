import { AppError } from './errors.js';

export class UnsupportedFileTypeError extends AppError {
  readonly code = 'UNSUPPORTED_FILE_TYPE';
}

export class FileTooLargeError extends AppError {
  readonly code = 'FILE_TOO_LARGE';
}

/**
 * Regla de negocio: qué tipos de archivo y qué tamaño se aceptan.
 * La extensión final se deriva del tipo MIME (no del nombre que envía el
 * usuario), así un archivo nunca se publica con una extensión arbitraria.
 */
export class FilePolicy {
  constructor(
    readonly label: string,
    private readonly extensionsByMime: Readonly<Record<string, string>>,
    readonly maxBytes: number,
  ) {}

  get allowedMimeTypes(): string[] {
    return Object.keys(this.extensionsByMime);
  }

  isAllowedMime(mimeType: string): boolean {
    return Object.hasOwn(this.extensionsByMime, mimeType);
  }

  /** Lanza un error de dominio si el archivo no cumple la política. Devuelve la extensión. */
  assertAcceptable(mimeType: string, sizeBytes: number): string {
    if (!this.isAllowedMime(mimeType)) {
      throw new UnsupportedFileTypeError(
        `Tipo de archivo no permitido para ${this.label}. Permitidos: ${this.allowedMimeTypes.join(', ')}`,
      );
    }
    if (sizeBytes <= 0) {
      throw new UnsupportedFileTypeError('El archivo está vacío');
    }
    if (sizeBytes > this.maxBytes) {
      throw new FileTooLargeError(
        `El archivo supera el máximo de ${Math.round(this.maxBytes / 1024 / 1024)} MB`,
      );
    }
    return this.extensionsByMime[mimeType]!;
  }
}

export const IMAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

export const DOCUMENT_EXTENSIONS: Readonly<Record<string, string>> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
};

export function createImagePolicy(maxBytes: number): FilePolicy {
  return new FilePolicy('imágenes', IMAGE_EXTENSIONS, maxBytes);
}

export function createDocumentPolicy(maxBytes: number): FilePolicy {
  return new FilePolicy('cartillas', DOCUMENT_EXTENSIONS, maxBytes);
}
