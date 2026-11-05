import { randomUUID } from 'node:crypto';
import { access, mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import type { AppConfig } from '../../../config/env.js';
import type {
  FileStorage,
  StorageFolder,
  StoredLocation,
} from '../../../shared/application/ports/FileStorage.js';
import { assertSafeRelativePath } from './storage/StorageProvider.js';
import type { FileTransferWorkerPool } from './worker/FileTransferWorkerPool.js';

/**
 * Adaptador del puerto FileStorage: delega toda transferencia al pool de Workers
 * y mantiene una caché local de descargas para no ir a Hostinger en cada petición.
 */
export class WorkerFileStorage implements FileStorage {
  private readonly inFlightDownloads = new Map<string, Promise<string>>();

  constructor(
    private readonly fileTransferPool: FileTransferWorkerPool,
    private readonly config: AppConfig,
  ) {}

  async upload(input: { localPath: string; folder: StorageFolder; fileName: string }): Promise<StoredLocation> {
    const remotePath = `${input.folder}/${input.fileName}`;
    assertSafeRelativePath(remotePath);
    await this.fileTransferPool.run({ kind: 'upload', localPath: input.localPath, remotePath });
    return { path: remotePath, url: this.publicUrl(remotePath) };
  }

  async fetchToLocal(remotePath: string): Promise<string> {
    assertSafeRelativePath(remotePath);
    // Si dos personas piden el mismo archivo a la vez, se descarga una sola vez.
    let download = this.inFlightDownloads.get(remotePath);
    if (!download) {
      download = this.downloadToCache(remotePath).finally(() => this.inFlightDownloads.delete(remotePath));
      this.inFlightDownloads.set(remotePath, download);
    }
    return download;
  }

  async delete(remotePath: string): Promise<void> {
    assertSafeRelativePath(remotePath);
    await this.fileTransferPool.run({ kind: 'delete', remotePath });
    await rm(this.cachePath(remotePath), { force: true });
  }

  private async downloadToCache(remotePath: string): Promise<string> {
    const cached = this.cachePath(remotePath);
    if (await exists(cached)) return cached;

    await mkdir(path.dirname(cached), { recursive: true });
    // Se descarga a un archivo temporal y luego se renombra, para no servir archivos a medias.
    const partial = `${cached}.${randomUUID()}.part`;
    try {
      await this.fileTransferPool.run({ kind: 'download', remotePath, localPath: partial });
      await rename(partial, cached);
    } catch (error) {
      await rm(partial, { force: true });
      throw error;
    }
    return cached;
  }

  private cachePath(remotePath: string): string {
    return path.join(this.config.files.downloadCacheDir, ...remotePath.split('/'));
  }

  private publicUrl(remotePath: string): string {
    return `${this.config.storage.publicBaseUrl.replace(/\/+$/, '')}/${remotePath}`;
  }
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}
