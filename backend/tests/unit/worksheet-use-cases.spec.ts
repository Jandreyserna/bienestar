import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDocumentPolicy, UnsupportedFileTypeError } from '../../src/shared/domain/FilePolicy.js';
import { ValidationError } from '../../src/shared/domain/errors.js';
import type { UploadedFile } from '../../src/shared/application/ports/FileStorage.js';
import type { Logger } from '../../src/shared/application/ports/Logger.js';
import {
  CreateWorksheet,
  DeleteWorksheet,
  UpdateWorksheet,
} from '../../src/modules/worksheets/application/WorksheetUseCases.js';
import { FakeFileStorage, InMemoryWorksheetRepository } from '../support/fakes.js';

const silentLogger: Logger = { debug() {}, info() {}, warn() {}, error() {} };
const details = { title: 'Respeto', description: 'Actividades sobre respeto', humanValue: 'Respeto', level: 'primary' };

describe('Casos de uso de cartillas', () => {
  let dir: string;
  let pdf: UploadedFile;
  let repository: InMemoryWorksheetRepository;
  let storage: FakeFileStorage;
  const policy = createDocumentPolicy(1024 * 1024);

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'bm-unit-'));
    const tempPath = path.join(dir, 'upload.tmp');
    await writeFile(tempPath, '%PDF-1.4 contenido');
    pdf = { tempPath, originalName: 'respeto.pdf', mimeType: 'application/pdf', sizeBytes: 18 };
    repository = new InMemoryWorksheetRepository();
    storage = await FakeFileStorage.create();
  });

  afterEach(async () => {
    await storage.dispose();
    await rm(dir, { recursive: true, force: true });
  });

  it('valida los datos antes de subir el archivo (no deja huérfanos)', async () => {
    const useCase = new CreateWorksheet(repository, policy, storage, silentLogger);
    await expect(useCase.execute({ ...details, title: '' }, pdf)).rejects.toThrow(ValidationError);
    await expect(useCase.execute({ ...details, level: 'universidad' }, pdf)).rejects.toThrow(ValidationError);
    await expect(useCase.execute(details, { ...pdf, mimeType: 'text/html' })).rejects.toThrow(
      UnsupportedFileTypeError,
    );
    expect(storage.uploaded).toHaveLength(0);
  });

  it('si la BD falla tras subir, elimina el archivo subido (compensación)', async () => {
    const useCase = new CreateWorksheet(repository, policy, storage, silentLogger);
    repository.failNextSave = true;
    await expect(useCase.execute(details, pdf)).rejects.toThrow('BD caída');
    expect(storage.uploaded).toHaveLength(1);
    expect(storage.deleted).toEqual(storage.uploaded);
  });

  it('al reemplazar el archivo borra el anterior; al eliminar la cartilla borra su archivo', async () => {
    const created = await new CreateWorksheet(repository, policy, storage, silentLogger).execute(details, pdf);
    const [firstPath] = storage.uploaded;

    const updated = await new UpdateWorksheet(repository, policy, storage, silentLogger).execute(
      created.id,
      { ...details, level: 'secondary' },
      pdf,
    );
    expect(updated.level).toBe('secondary');
    expect(storage.deleted).toEqual([firstPath]);

    await new DeleteWorksheet(repository, storage, silentLogger).execute(created.id);
    expect(repository.rows.size).toBe(0);
    expect(storage.deleted).toEqual([firstPath, storage.uploaded[1]]);
  });
});
