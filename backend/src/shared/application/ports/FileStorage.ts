/** Archivo recibido por la API y guardado temporalmente en disco local. */
export interface UploadedFile {
  tempPath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface StoredLocation {
  /** Ruta relativa dentro del almacenamiento (p. ej. "images/uuid.webp"). */
  path: string;
  /** URL pública definitiva. */
  url: string;
}

export type StorageFolder = 'images' | 'worksheets';

/**
 * Puerto de almacenamiento de archivos (ARQ-02).
 * La implementación delega el trabajo pesado a un Worker para no bloquear la API.
 */
export interface FileStorage {
  upload(input: { localPath: string; folder: StorageFolder; fileName: string }): Promise<StoredLocation>;
  /** Trae el archivo remoto a disco local (con caché) y devuelve la ruta local. */
  fetchToLocal(path: string): Promise<string>;
  delete(path: string): Promise<void>;
}
