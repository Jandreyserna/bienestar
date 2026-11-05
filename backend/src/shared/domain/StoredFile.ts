import { ValidationError } from './errors.js';

export interface StoredFileProps {
  /** Ruta relativa dentro del almacenamiento (p. ej. "worksheets/uuid.pdf"). */
  path: string;
  /** URL pública desde la que se sirve el archivo. */
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/** Value Object: archivo ya guardado en el almacenamiento externo (Hostinger). */
export class StoredFile {
  private constructor(private readonly props: StoredFileProps) {}

  static create(props: StoredFileProps): StoredFile {
    if (!props.path || props.path.includes('..') || props.path.startsWith('/')) {
      throw ValidationError.field('file', 'Ruta de archivo inválida');
    }
    if (!props.url) throw ValidationError.field('file', 'El archivo no tiene URL pública');
    if (!Number.isInteger(props.sizeBytes) || props.sizeBytes <= 0) {
      throw ValidationError.field('file', 'El archivo está vacío');
    }
    return new StoredFile({ ...props, originalName: props.originalName.slice(0, 255) });
  }

  get path(): string {
    return this.props.path;
  }
  get url(): string {
    return this.props.url;
  }
  get originalName(): string {
    return this.props.originalName;
  }
  get mimeType(): string {
    return this.props.mimeType;
  }
  get sizeBytes(): number {
    return this.props.sizeBytes;
  }

  /** Extensión con punto, tomada de la ruta almacenada (".pdf"). */
  get extension(): string {
    const dot = this.props.path.lastIndexOf('.');
    return dot >= 0 ? this.props.path.slice(dot) : '';
  }

  toSnapshot(): StoredFileProps {
    return { ...this.props };
  }
}
