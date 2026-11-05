import { AppError } from '../domain/errors.js';

/** Credenciales inválidas, token ausente o expirado. */
export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED';
}

/**
 * Falla del almacenamiento externo (FTP de Hostinger, disco, etc.).
 * El mensaje es seguro para el cliente; la causa real va en `cause` y solo se registra en logs.
 */
export class StorageError extends AppError {
  readonly code = 'STORAGE_ERROR';

  constructor(message: string, options?: { cause?: unknown; notFound?: boolean }) {
    super(message);
    this.cause = options?.cause;
    this.notFound = options?.notFound ?? false;
  }

  readonly notFound: boolean;
}
