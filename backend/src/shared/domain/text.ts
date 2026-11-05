import { ValidationError } from './errors.js';

/** Valida un texto obligatorio y lo devuelve recortado. */
export function requiredText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ValidationError.field(field, `El campo "${field}" es obligatorio`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw ValidationError.field(field, `El campo "${field}" admite máximo ${maxLength} caracteres`);
  }
  return trimmed;
}

/** Valida un texto opcional; las cadenas vacías se normalizan a `null`. */
export function optionalText(value: unknown, field: string, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw ValidationError.field(field, `El campo "${field}" debe ser texto`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > maxLength) {
    throw ValidationError.field(field, `El campo "${field}" admite máximo ${maxLength} caracteres`);
  }
  return trimmed;
}

/** Convierte un título en un nombre de archivo legible: "Respeto y Paz" -> "respeto-y-paz". */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
