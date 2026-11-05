/**
 * Strategy (ARQ-05): cada proveedor sabe mover archivos hacia/desde un destino concreto.
 * Hoy existen Hostinger (FTP) y disco local; un CDN futuro sería otra implementación
 * sin tocar dominio ni casos de uso.
 *
 * Las implementaciones se ejecutan DENTRO del Worker, nunca en el hilo principal.
 */
export interface StorageProvider {
  /** Sube `localPath` a `remotePath` (relativa a la raíz del almacenamiento). */
  put(localPath: string, remotePath: string): Promise<void>;
  /** Descarga `remotePath` a `localPath`. */
  get(remotePath: string, localPath: string): Promise<void>;
  remove(remotePath: string): Promise<void>;
  /** Indica si el error significa "el archivo no existe". */
  isNotFound(error: unknown): boolean;
}

/** Evita rutas que escapen de la raíz del almacenamiento. */
export function assertSafeRelativePath(remotePath: string): void {
  if (
    remotePath.length === 0 ||
    remotePath.startsWith('/') ||
    remotePath.includes('\\') ||
    remotePath.split('/').some((segment) => segment === '..' || segment === '')
  ) {
    throw new Error(`Ruta de almacenamiento no permitida: ${remotePath}`);
  }
}
