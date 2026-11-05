/**
 * ARQ-02 / RNF-02: Worker dedicado a la carga y descarga de archivos.
 *
 * Corre en un hilo independiente (worker_threads). Recibe trabajos del pool por
 * mensajes, ejecuta la transferencia con la estrategia configurada (FTP Hostinger
 * o local) y responde con el resultado. Procesa un trabajo a la vez.
 */
import { parentPort, workerData } from 'node:worker_threads';
import { createStorageProvider } from '../storage/createStorageProvider.js';
import type { FileJob, JobRequest, JobResponse, WorkerInit } from './protocol.js';

if (!parentPort) {
  throw new Error('file-transfer.worker debe ejecutarse como worker_thread');
}

const port = parentPort;
const { storage } = workerData as WorkerInit;
const provider = createStorageProvider(storage);

async function run(job: FileJob): Promise<void> {
  switch (job.kind) {
    case 'upload':
      return provider.put(job.localPath, job.remotePath);
    case 'download':
      return provider.get(job.remotePath, job.localPath);
    case 'delete':
      return provider.remove(job.remotePath);
  }
}

port.on('message', async (request: JobRequest) => {
  let response: JobResponse;
  try {
    await run(request.job);
    response = { id: request.id, ok: true };
  } catch (error) {
    response = {
      id: request.id,
      ok: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
        notFound: provider.isNotFound(error),
      },
    };
  }
  port.postMessage(response);
});
