/**
 * Jerarquía base de errores de la aplicación.
 *
 * Las capas de dominio y aplicación lanzan estos errores sin saber nada de HTTP.
 * El manejador global (shared/infrastructure/http/errorHandler.ts) es el único
 * que traduce cada `code` a un código de estado HTTP.
 */
export abstract class AppError extends Error {
  abstract readonly code: string;

  constructor(
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Datos de entrada que violan una invariante o formato del dominio. */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';

  static field(field: string, message: string): ValidationError {
    return new ValidationError(message, { fields: [{ field, message }] });
  }
}

/** El recurso solicitado no existe. */
export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';

  static entity(entity: string, id: string): NotFoundError {
    return new NotFoundError(`${entity} no encontrado`, { id });
  }
}

/** La operación choca con el estado actual (p. ej. clave duplicada). */
export class ConflictError extends AppError {
  readonly code = 'CONFLICT';
}

/** La operación es válida en forma, pero una regla de negocio la impide. */
export class BusinessRuleViolationError extends AppError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
}
