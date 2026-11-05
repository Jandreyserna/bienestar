import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import type { StorageConfig } from '../../../../config/env.js';
import { StorageError } from '../../../../shared/application/errors.js';
import type { Logger } from '../../../../shared/application/ports/Logger.js';
import type { FileJob, JobRequest, JobResponse, WorkerInit } from './protocol.js';

export interface WorkerPoolOptions {
  size: number;
  jobTimeoutMs: number;
  storage: StorageConfig;
  /** Flags de Node para los workers (por defecto hereda los del proceso; los tests pasan `--import tsx`). */
  execArgv?: string[];
}

interface PendingJob {
  request: JobRequest;
  resolve: () => void;
  reject: (error: Error) => void;
}

interface Slot {
  worker: Worker;
  current?: PendingJob;
  timer?: NodeJS.Timeout;
}

// El worker se compila junto a este archivo: .ts en desarrollo (tsx) y .js en dist.
const here = fileURLToPath(import.meta.url);
const WORKER_FILE = path.join(path.dirname(here), `file-transfer.worker${path.extname(here)}`);

/**
 * Pool de Workers para transferencias de archivos.
 * - Encola trabajos y los reparte entre N workers (se crean bajo demanda).
 * - Si un worker se cae o excede el tiempo límite, se rechaza su trabajo y se reemplaza.
 * El hilo principal solo intercambia mensajes: nunca hace la transferencia.
 */
export class FileTransferWorkerPool {
  private readonly slots: Slot[] = [];
  private readonly queue: PendingJob[] = [];
  private nextId = 1;
  private closed = false;

  constructor(
    private readonly options: WorkerPoolOptions,
    private readonly logger: Logger,
  ) {}

  run(job: FileJob): Promise<void> {
    if (this.closed) return Promise.reject(new StorageError('El servicio de archivos se está cerrando'));
    return new Promise<void>((resolve, reject) => {
      this.queue.push({ request: { id: this.nextId++, job }, resolve, reject });
      this.dispatch();
    });
  }

  async close(): Promise<void> {
    this.closed = true;
    for (const pending of this.queue.splice(0)) {
      pending.reject(new StorageError('El servicio de archivos se cerró'));
    }
    await Promise.all(this.slots.splice(0).map((slot) => slot.worker.terminate()));
  }

  private dispatch(): void {
    while (this.queue.length > 0) {
      const slot = this.slots.find((candidate) => !candidate.current) ?? this.spawnIfPossible();
      if (!slot) return;
      const pending = this.queue.shift()!;
      slot.current = pending;
      slot.timer = setTimeout(() => this.onTimeout(slot), this.options.jobTimeoutMs);
      slot.worker.postMessage(pending.request);
    }
  }

  private spawnIfPossible(): Slot | undefined {
    if (this.slots.length >= this.options.size) return undefined;
    const init: WorkerInit = { storage: this.options.storage };
    const worker = new Worker(WORKER_FILE, {
      workerData: init,
      ...(this.options.execArgv ? { execArgv: this.options.execArgv } : {}),
    });
    const slot: Slot = { worker };
    worker.on('message', (response: JobResponse) => this.onMessage(slot, response));
    worker.on('error', (error) => this.onWorkerFailure(slot, error));
    worker.on('exit', (code) => {
      if (code !== 0) this.onWorkerFailure(slot, new Error(`El worker terminó con código ${code}`));
    });
    worker.unref();
    this.slots.push(slot);
    this.logger.debug('Worker de archivos iniciado', { workers: this.slots.length });
    return slot;
  }

  private onMessage(slot: Slot, response: JobResponse): void {
    const pending = slot.current;
    if (!pending || pending.request.id !== response.id) return;
    this.release(slot);
    if (response.ok) {
      pending.resolve();
    } else {
      const operation = pending.request.job.kind;
      pending.reject(
        new StorageError(
          response.error.notFound
            ? 'El archivo no existe en el almacenamiento'
            : `No fue posible completar la operación de archivo (${operation})`,
          { cause: new Error(response.error.message), notFound: response.error.notFound },
        ),
      );
    }
    this.dispatch();
  }

  private onTimeout(slot: Slot): void {
    const pending = slot.current;
    this.logger.warn('Trabajo de archivo excedió el tiempo límite; se reinicia el worker', {
      job: pending?.request.job.kind,
    });
    this.discard(slot);
    pending?.reject(new StorageError('El almacenamiento tardó demasiado en responder'));
    void slot.worker.terminate();
    this.dispatch();
  }

  private onWorkerFailure(slot: Slot, error: Error): void {
    if (!this.slots.includes(slot)) return;
    this.logger.error('Worker de archivos falló', { error });
    const pending = slot.current;
    this.discard(slot);
    pending?.reject(new StorageError('Falló el proceso de archivos', { cause: error }));
    if (!this.closed) this.dispatch();
  }

  private release(slot: Slot): void {
    clearTimeout(slot.timer);
    slot.current = undefined;
    slot.timer = undefined;
  }

  private discard(slot: Slot): void {
    this.release(slot);
    const index = this.slots.indexOf(slot);
    if (index >= 0) this.slots.splice(index, 1);
  }
}
