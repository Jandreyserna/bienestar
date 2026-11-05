import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { StorageError } from '../../src/shared/application/errors.js';
import type { Logger } from '../../src/shared/application/ports/Logger.js';
import { WorkerFileStorage } from '../../src/modules/media/infrastructure/WorkerFileStorage.js';
import { FileTransferWorkerPool } from '../../src/modules/media/infrastructure/worker/FileTransferWorkerPool.js';
import { testConfig } from '../support/testApp.js';

const silentLogger: Logger = { debug() {}, info() {}, warn() {}, error() {} };

/**
 * Prueba real del Worker (hilos de worker_threads) con la estrategia de almacenamiento local.
 * El worker es TypeScript, así que se le pasa el loader de tsx.
 */
describe('Pool de workers de archivos (integración)', () => {
  let dir: string;
  let pool: FileTransferWorkerPool;
  let storage: WorkerFileStorage;

  beforeAll(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'bm-worker-'));
    const config = testConfig({
      LOCAL_STORAGE_DIR: path.join(dir, 'public'),
      DOWNLOAD_CACHE_DIR: path.join(dir, 'cache'),
      PUBLIC_FILES_BASE_URL: 'https://midominio.com/uploads',
    });
    pool = new FileTransferWorkerPool(
      { size: 2, jobTimeoutMs: 10_000, storage: config.storage, execArgv: ['--import', 'tsx'] },
      silentLogger,
    );
    storage = new WorkerFileStorage(pool, config);
  });

  afterAll(async () => {
    await pool.close();
    await rm(dir, { recursive: true, force: true });
  });

  it('sube, descarga (con caché) y elimina archivos en paralelo', async () => {
    const sources = await Promise.all(
      [1, 2, 3].map(async (n) => {
        const file = path.join(dir, `src-${n}.pdf`);
        await writeFile(file, `contenido ${n}`);
        return file;
      }),
    );

    const stored = await Promise.all(
      sources.map((localPath, i) => storage.upload({ localPath, folder: 'worksheets', fileName: `f${i}.pdf` })),
    );
    expect(stored[0]).toEqual({ path: 'worksheets/f0.pdf', url: 'https://midominio.com/uploads/worksheets/f0.pdf' });

    const local = await storage.fetchToLocal('worksheets/f2.pdf');
    expect(await readFile(local, 'utf8')).toBe('contenido 3');

    await storage.delete('worksheets/f2.pdf');
    await expect(storage.fetchToLocal('worksheets/f2.pdf')).rejects.toMatchObject({ notFound: true });
  });

  it('traduce fallos del worker a StorageError sin tumbar el pool', async () => {
    await expect(storage.delete('worksheets/no-existe.pdf')).rejects.toBeInstanceOf(StorageError);
    await expect(storage.fetchToLocal('../fuera.txt')).rejects.toThrow('no permitida');

    const file = path.join(dir, 'ok.pdf');
    await writeFile(file, 'sigue vivo');
    await expect(storage.upload({ localPath: file, folder: 'images', fileName: 'ok.png' })).resolves.toBeTruthy();
  });
});
