import path from 'node:path';
import ftp from 'basic-ftp';
import type { StorageConfig } from '../../../../config/env.js';
import { assertSafeRelativePath, type StorageProvider } from './StorageProvider.js';

type FtpConfig = Extract<StorageConfig, { driver: 'ftp' }>['ftp'];

/**
 * Estrategia Hostinger: sube/descarga por FTP(S) a la carpeta pública del hosting.
 * Ejemplo: FTP_BASE_DIR=public_html/uploads  +  PUBLIC_FILES_BASE_URL=https://tudominio.com/uploads
 *
 * Se abre una conexión por operación: los planes compartidos de Hostinger limitan
 * las conexiones simultáneas y así no quedan sesiones colgadas entre trabajos.
 */
export class FtpStorageProvider implements StorageProvider {
  constructor(private readonly config: FtpConfig) {}

  async put(localPath: string, remotePath: string): Promise<void> {
    assertSafeRelativePath(remotePath);
    const fullPath = this.remote(remotePath);
    await this.withClient(async (client) => {
      await client.ensureDir(path.posix.dirname(fullPath));
      await client.uploadFrom(localPath, path.posix.basename(fullPath));
    });
  }

  async get(remotePath: string, localPath: string): Promise<void> {
    assertSafeRelativePath(remotePath);
    await this.withClient((client) => client.downloadTo(localPath, this.remote(remotePath)));
  }

  async remove(remotePath: string): Promise<void> {
    assertSafeRelativePath(remotePath);
    await this.withClient((client) => client.remove(this.remote(remotePath)));
  }

  isNotFound(error: unknown): boolean {
    // 550 = "Requested action not taken. File unavailable".
    return typeof error === 'object' && error !== null && (error as { code?: number }).code === 550;
  }

  private remote(relativePath: string): string {
    return path.posix.join(this.config.baseDir, relativePath);
  }

  private async withClient<T>(work: (client: ftp.Client) => Promise<T>): Promise<T> {
    const client = new ftp.Client(this.config.timeoutMs);
    try {
      await client.access({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        secure: this.config.secure,
      });
      return await work(client);
    } finally {
      client.close();
    }
  }
}
