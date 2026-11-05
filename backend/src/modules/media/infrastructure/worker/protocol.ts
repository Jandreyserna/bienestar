import type { StorageConfig } from '../../../../config/env.js';

/** Trabajos que el hilo principal le encarga al Worker de archivos. */
export type FileJob =
  | { kind: 'upload'; localPath: string; remotePath: string }
  | { kind: 'download'; remotePath: string; localPath: string }
  | { kind: 'delete'; remotePath: string };

export interface JobRequest {
  id: number;
  job: FileJob;
}

export type JobResponse =
  | { id: number; ok: true }
  | { id: number; ok: false; error: { message: string; notFound: boolean } };

export interface WorkerInit {
  storage: StorageConfig;
}
