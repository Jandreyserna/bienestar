import { copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { assertSafeRelativePath, type StorageProvider } from './StorageProvider.js';

/**
 * Estrategia de desarrollo: guarda en una carpeta local que Express sirve en /uploads.
 * Permite trabajar sin credenciales de Hostinger.
 */
export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly rootDir: string) {}

  async put(localPath: string, remotePath: string): Promise<void> {
    const target = this.resolve(remotePath);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(localPath, target);
  }

  async get(remotePath: string, localPath: string): Promise<void> {
    await mkdir(path.dirname(localPath), { recursive: true });
    await copyFile(this.resolve(remotePath), localPath);
  }

  async remove(remotePath: string): Promise<void> {
    await rm(this.resolve(remotePath));
  }

  isNotFound(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'ENOENT';
  }

  private resolve(remotePath: string): string {
    assertSafeRelativePath(remotePath);
    return path.join(this.rootDir, ...remotePath.split('/'));
  }
}
