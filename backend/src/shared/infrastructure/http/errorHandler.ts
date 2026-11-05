import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { AppError, NotFoundError } from '../../domain/errors.js';
import type { Logger } from '../../application/ports/Logger.js';

/**
 * ARQ-04: único punto donde los errores de dominio/aplicación/infraestructura
 * se traducen a HTTP. Respuesta estándar:
 *   { "error": { "code": "NOT_FOUND", "message": "...", "details": {...} } }
 */
const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  FILE_TOO_LARGE: 413,
  UNSUPPORTED_FILE_TYPE: 415,
  BUSINESS_RULE_VIOLATION: 422,
  STORAGE_ERROR: 502,
};

interface ErrorBody {
  error: { code: string; message: string; details?: Record<string, unknown> };
}

function body(code: string, message: string, details?: Record<string, unknown>): ErrorBody {
  return { error: details ? { code, message, details } : { code, message } };
}

export function notFoundHandler(): RequestHandler {
  return (req, _res, next) => {
    next(new NotFoundError(`Ruta no encontrada: ${req.method} ${req.path}`));
  };
}

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof AppError) {
      const status = STATUS_BY_CODE[error.code] ?? 500;
      if (status >= 500) {
        // El mensaje de estos errores es seguro, pero la causa (p. ej. error FTP) solo va al log.
        logger.error(`${req.method} ${req.originalUrl} -> ${error.code}`, { error, cause: error.cause });
      }
      res.status(status).json(body(error.code, error.message, error.details));
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json(body('FILE_TOO_LARGE', 'El archivo supera el tamaño máximo permitido'));
        return;
      }
      res.status(400).json(body('VALIDATION_ERROR', `Carga de archivo inválida (${error.code})`));
      return;
    }

    // JSON mal formado enviado por el cliente (body-parser).
    if (isBodyParserError(error)) {
      res.status(400).json(body('VALIDATION_ERROR', 'El cuerpo de la petición no es JSON válido'));
      return;
    }

    // Cualquier otra cosa es un fallo no previsto: se registra completo y se responde genérico,
    // sin exponer mensajes de MySQL, rutas de disco ni stack traces.
    logger.error(`Error no controlado en ${req.method} ${req.originalUrl}`, { error });
    res.status(500).json(body('INTERNAL_ERROR', 'Ocurrió un error interno. Intenta de nuevo más tarde.'));
  };
}

function isBodyParserError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { type?: string }).type === 'entity.parse.failed'
  );
}
