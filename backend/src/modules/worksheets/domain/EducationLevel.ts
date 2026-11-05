import { ValidationError } from '../../../shared/domain/errors.js';

/** Nivel educativo al que va dirigida una cartilla (RF-01.3: Primaria / Secundaria, más Preescolar). */
export const EDUCATION_LEVELS = ['preschool', 'primary', 'secondary'] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export function toEducationLevel(value: string): EducationLevel {
  if ((EDUCATION_LEVELS as readonly string[]).includes(value)) return value as EducationLevel;
  throw ValidationError.field('level', 'El nivel debe ser "preschool" (preescolar), "primary" (primaria) o "secondary" (secundaria)');
}
