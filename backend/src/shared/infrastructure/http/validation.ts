import { z } from 'zod';
import { ValidationError } from '../../domain/errors.js';

z.config(z.locales.es());

/** Valida la entrada HTTP con un esquema zod y la convierte en ValidationError del dominio. */
export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError('Los datos enviados no son válidos', {
      fields: result.error.issues.map((issue) => ({
        field: issue.path.join('.') || '(body)',
        message: issue.message,
      })),
    });
  }
  return result.data;
}

export const idParamSchema = z.object({ id: z.uuid() });
