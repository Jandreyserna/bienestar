import { randomUUID } from 'node:crypto';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { FilePolicy } from '../../../shared/domain/FilePolicy.js';
import { StoredFile } from '../../../shared/domain/StoredFile.js';
import { slugify } from '../../../shared/domain/text.js';
import { StorageError } from '../../../shared/application/errors.js';
import type { FileStorage, UploadedFile } from '../../../shared/application/ports/FileStorage.js';
import type { Logger } from '../../../shared/application/ports/Logger.js';
import { toEducationLevel } from '../domain/EducationLevel.js';
import { Worksheet, type WorksheetDetails } from '../domain/Worksheet.js';
import type { WorksheetRepository } from '../domain/WorksheetRepository.js';
import { toWorksheetDto, type WorksheetDto } from './WorksheetDto.js';

/** Casos de uso de cartillas (RF-01.3 y RF-02.2). */

export class ListWorksheets {
  constructor(private readonly worksheetRepository: WorksheetRepository) {}

  async execute(level?: string): Promise<WorksheetDto[]> {
    const worksheets = await this.worksheetRepository.findAll(level ? toEducationLevel(level) : undefined);
    return worksheets.map(toWorksheetDto);
  }
}

export class GetWorksheet {
  constructor(private readonly worksheetRepository: WorksheetRepository) {}

  async execute(id: string): Promise<WorksheetDto> {
    const worksheet = await this.worksheetRepository.findById(id);
    if (!worksheet) throw NotFoundError.entity('Cartilla', id);
    return toWorksheetDto(worksheet);
  }
}

/** Sube el documento al almacenamiento y lo envuelve como Value Object del dominio. */
async function storeDocument(
  file: UploadedFile,
  policy: FilePolicy,
  storage: FileStorage,
): Promise<StoredFile> {
  const extension = policy.assertAcceptable(file.mimeType, file.sizeBytes);
  const location = await storage.upload({
    localPath: file.tempPath,
    folder: 'worksheets',
    fileName: `${randomUUID()}${extension}`,
  });
  return StoredFile.create({
    ...location,
    originalName: file.originalName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
  });
}

/** Borra un archivo del almacenamiento sin interrumpir la operación principal si falla. */
async function deleteQuietly(storage: FileStorage, logger: Logger, path: string): Promise<void> {
  try {
    await storage.delete(path);
  } catch (error) {
    logger.warn('No se pudo eliminar un archivo del almacenamiento', { path, error });
  }
}

export class CreateWorksheet {
  constructor(
    private readonly worksheetRepository: WorksheetRepository,
    private readonly documentPolicy: FilePolicy,
    private readonly fileStorage: FileStorage,
    private readonly logger: Logger,
  ) {}

  async execute(details: WorksheetDetails, file: UploadedFile): Promise<WorksheetDto> {
    // Se validan los datos ANTES de subir, para no dejar archivos huérfanos por un título vacío
    // (storeDocument valida tipo y tamaño del archivo antes de transferirlo).
    Worksheet.normalizeDetails(details);
    const stored = await storeDocument(file, this.documentPolicy, this.fileStorage);
    const worksheet = Worksheet.builder().withDetails(details).withFile(stored).build(new Date());
    try {
      await this.worksheetRepository.save(worksheet);
    } catch (error) {
      // Compensación: si la BD falla, el archivo recién subido no debe quedar huérfano.
      await deleteQuietly(this.fileStorage, this.logger, stored.path);
      throw error;
    }
    return toWorksheetDto(worksheet);
  }
}

export class UpdateWorksheet {
  constructor(
    private readonly worksheetRepository: WorksheetRepository,
    private readonly documentPolicy: FilePolicy,
    private readonly fileStorage: FileStorage,
    private readonly logger: Logger,
  ) {}

  async execute(id: string, details: WorksheetDetails, file?: UploadedFile): Promise<WorksheetDto> {
    const worksheet = await this.worksheetRepository.findById(id);
    if (!worksheet) throw NotFoundError.entity('Cartilla', id);

    const now = new Date();
    worksheet.updateDetails(details, now);
    if (!file) {
      await this.worksheetRepository.save(worksheet);
      return toWorksheetDto(worksheet);
    }

    const stored = await storeDocument(file, this.documentPolicy, this.fileStorage);
    const previous = worksheet.replaceFile(stored, now);
    try {
      await this.worksheetRepository.save(worksheet);
    } catch (error) {
      await deleteQuietly(this.fileStorage, this.logger, stored.path);
      throw error;
    }
    await deleteQuietly(this.fileStorage, this.logger, previous.path);
    return toWorksheetDto(worksheet);
  }
}

export class DeleteWorksheet {
  constructor(
    private readonly worksheetRepository: WorksheetRepository,
    private readonly fileStorage: FileStorage,
    private readonly logger: Logger,
  ) {}

  async execute(id: string): Promise<void> {
    const worksheet = await this.worksheetRepository.findById(id);
    if (!worksheet) throw NotFoundError.entity('Cartilla', id);
    await this.worksheetRepository.delete(id);
    await deleteQuietly(this.fileStorage, this.logger, worksheet.file.path);
  }
}

export interface DownloadableFile {
  localPath: string;
  downloadName: string;
  mimeType: string;
}

/** RF-01.3: descarga pública. El Worker trae el archivo de Hostinger a la caché local. */
export class DownloadWorksheet {
  constructor(
    private readonly worksheetRepository: WorksheetRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(id: string): Promise<DownloadableFile> {
    const worksheet = await this.worksheetRepository.findById(id);
    if (!worksheet) throw NotFoundError.entity('Cartilla', id);
    try {
      const localPath = await this.fileStorage.fetchToLocal(worksheet.file.path);
      return {
        localPath,
        downloadName: `${slugify(worksheet.title) || 'cartilla'}${worksheet.file.extension}`,
        mimeType: worksheet.file.mimeType,
      };
    } catch (error) {
      if (error instanceof StorageError && error.notFound) {
        throw new NotFoundError('El archivo de esta cartilla ya no está disponible', { id });
      }
      throw error;
    }
  }
}
