import { randomUUID } from 'node:crypto';
import type { FilePolicy } from '../../../shared/domain/FilePolicy.js';
import type {
  FileStorage,
  StoredLocation,
  UploadedFile,
} from '../../../shared/application/ports/FileStorage.js';

/**
 * Caso de uso RF-02.2: subir una imagen (portada, historia, fundadores...) a Hostinger
 * y devolver su URL pública para vincularla luego a una sección.
 */
export class UploadImage {
  constructor(
    private readonly imagePolicy: FilePolicy,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(file: UploadedFile): Promise<StoredLocation> {
    const extension = this.imagePolicy.assertAcceptable(file.mimeType, file.sizeBytes);
    return this.fileStorage.upload({
      localPath: file.tempPath,
      folder: 'images',
      fileName: `${randomUUID()}${extension}`,
    });
  }
}
