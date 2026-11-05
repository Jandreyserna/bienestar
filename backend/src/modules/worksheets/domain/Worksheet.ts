import { randomUUID } from 'node:crypto';
import { ValidationError } from '../../../shared/domain/errors.js';
import { StoredFile, type StoredFileProps } from '../../../shared/domain/StoredFile.js';
import { requiredText } from '../../../shared/domain/text.js';
import { toEducationLevel, type EducationLevel } from './EducationLevel.js';

export interface WorksheetDetails {
  title: string;
  description: string;
  humanValue: string;
  level: string;
}

export interface WorksheetSnapshot {
  id: string;
  title: string;
  description: string;
  humanValue: string;
  level: EducationLevel;
  file: StoredFileProps;
  createdAt: Date;
  updatedAt: Date;
}

interface WorksheetState extends Omit<WorksheetSnapshot, 'file'> {
  file: StoredFile;
}

type NormalizedDetails = Pick<WorksheetState, 'title' | 'description' | 'humanValue' | 'level'>;

/**
 * Agregado raíz: cartilla de trabajo descargable asociada a un valor humano
 * y a un nivel (primaria/secundaria).
 */
export class Worksheet {
  private constructor(private state: WorksheetState) {}

  static builder(): WorksheetBuilder {
    return new WorksheetBuilder();
  }

  static reconstitute(snapshot: WorksheetSnapshot): Worksheet {
    return new Worksheet({ ...snapshot, file: StoredFile.create(snapshot.file) });
  }

  /** Valida los datos descriptivos sin construir el agregado (útil antes de subir el archivo). */
  static normalizeDetails(details: WorksheetDetails): NormalizedDetails {
    return {
      title: requiredText(details.title, 'title', 200),
      description: requiredText(details.description, 'description', 2000),
      humanValue: requiredText(details.humanValue, 'humanValue', 100),
      level: toEducationLevel(details.level),
    };
  }

  get id(): string {
    return this.state.id;
  }
  get title(): string {
    return this.state.title;
  }
  get file(): StoredFile {
    return this.state.file;
  }

  updateDetails(details: WorksheetDetails, now: Date): void {
    this.state = { ...this.state, ...Worksheet.normalizeDetails(details), updatedAt: now };
  }

  /** Cambia el archivo y devuelve el anterior para que la aplicación lo elimine del almacenamiento. */
  replaceFile(file: StoredFile, now: Date): StoredFile {
    const previous = this.state.file;
    this.state = { ...this.state, file, updatedAt: now };
    return previous;
  }

  toSnapshot(): WorksheetSnapshot {
    return { ...this.state, file: this.state.file.toSnapshot() };
  }

  /** Solo para el Builder. */
  static fromState(state: WorksheetState): Worksheet {
    return new Worksheet(state);
  }
}

/**
 * Builder (ARQ-05): arma una cartilla nueva paso a paso y valida todo en `build()`.
 *   Worksheet.builder().withDetails(...).withFile(file).build(now)
 */
export class WorksheetBuilder {
  private id: string = randomUUID();
  private details?: WorksheetDetails;
  private file?: StoredFile;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withDetails(details: WorksheetDetails): this {
    this.details = details;
    return this;
  }

  withFile(file: StoredFile): this {
    this.file = file;
    return this;
  }

  build(now: Date): Worksheet {
    if (!this.details) throw new ValidationError('La cartilla necesita título, descripción, valor y nivel');
    if (!this.file) throw ValidationError.field('file', 'La cartilla necesita un archivo descargable');
    return Worksheet.fromState({
      id: this.id,
      ...Worksheet.normalizeDetails(this.details),
      file: this.file,
      createdAt: now,
      updatedAt: now,
    });
  }
}
