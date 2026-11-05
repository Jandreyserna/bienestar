import { ValidationError } from '../../../shared/domain/errors.js';

const PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Value Object: identificador legible y único de una sección dentro de su página ("mission-vision"). */
export class SectionKey {
  private constructor(readonly value: string) {}

  static from(raw: string): SectionKey {
    const value = raw.trim().toLowerCase();
    if (value.length < 2 || value.length > 60 || !PATTERN.test(value)) {
      throw ValidationError.field(
        'key',
        'La clave debe tener 2-60 caracteres: minúsculas, números y guiones (ej. "nuestra-historia")',
      );
    }
    return new SectionKey(value);
  }

  equals(other: SectionKey): boolean {
    return this.value === other.value;
  }
}
