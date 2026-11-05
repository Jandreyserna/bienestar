import { copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { StorageError } from '../../src/shared/application/errors.js';
import type { FileStorage, StorageFolder, StoredLocation } from '../../src/shared/application/ports/FileStorage.js';
import type { AdminUser, AdminUserRepository } from '../../src/modules/auth/domain/AdminUser.js';
import type { PageSlug } from '../../src/modules/site-content/domain/PageSlug.js';
import type { Section, SectionSnapshot } from '../../src/modules/site-content/domain/Section.js';
import { SectionFactory } from '../../src/modules/site-content/domain/SectionFactory.js';
import type { SectionRepository, SectionSummary } from '../../src/modules/site-content/domain/SectionRepository.js';
import type { EducationLevel } from '../../src/modules/worksheets/domain/EducationLevel.js';
import { Worksheet, type WorksheetSnapshot } from '../../src/modules/worksheets/domain/Worksheet.js';
import type { WorksheetRepository } from '../../src/modules/worksheets/domain/WorksheetRepository.js';

/** Los repositorios guardan snapshots (no referencias) para comportarse como una BD real. */
export class InMemorySectionRepository implements SectionRepository {
  readonly rows = new Map<string, SectionSnapshot>();
  private readonly factory = new SectionFactory();

  async findById(id: string): Promise<Section | null> {
    const row = this.rows.get(id);
    return row ? this.factory.reconstitute(structuredClone(row)) : null;
  }
  async findByPage(page: PageSlug): Promise<Section[]> {
    return [...this.rows.values()]
      .filter((row) => row.page === page)
      .sort((a, b) => a.position - b.position)
      .map((row) => this.factory.reconstitute(structuredClone(row)));
  }
  async findByPageAndKey(page: PageSlug, key: string): Promise<Section | null> {
    const row = [...this.rows.values()].find((r) => r.page === page && r.key === key);
    return row ? this.factory.reconstitute(structuredClone(row)) : null;
  }
  async findSummaries(): Promise<SectionSummary[]> {
    return [...this.rows.values()]
      .sort((a, b) => a.page.localeCompare(b.page) || a.position - b.position)
      .map(({ page, key, title, position }) => ({ page, key, title, position }));
  }
  async save(section: Section): Promise<void> {
    this.rows.set(section.id, structuredClone(section.toSnapshot()));
  }
  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }
}

export class InMemoryWorksheetRepository implements WorksheetRepository {
  readonly rows = new Map<string, WorksheetSnapshot>();
  failNextSave = false;

  async findById(id: string): Promise<Worksheet | null> {
    const row = this.rows.get(id);
    return row ? Worksheet.reconstitute(structuredClone(row)) : null;
  }
  async findAll(level?: EducationLevel): Promise<Worksheet[]> {
    return [...this.rows.values()]
      .filter((row) => !level || row.level === level)
      .map((row) => Worksheet.reconstitute(structuredClone(row)));
  }
  async save(worksheet: Worksheet): Promise<void> {
    if (this.failNextSave) {
      this.failNextSave = false;
      throw new Error('BD caída (simulada)');
    }
    this.rows.set(worksheet.id, structuredClone(worksheet.toSnapshot()));
  }
  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }
}

export class InMemoryAdminUserRepository implements AdminUserRepository {
  private readonly users = new Map<string, AdminUser>();

  async findByEmail(email: string): Promise<AdminUser | null> {
    return this.users.get(email) ?? null;
  }
  async save(user: AdminUser): Promise<void> {
    this.users.set(user.email, user);
  }
}

/** Almacenamiento falso sobre una carpeta temporal; registra lo que se sube y se borra. */
export class FakeFileStorage implements FileStorage {
  readonly uploaded: string[] = [];
  readonly deleted: string[] = [];

  private constructor(private readonly root: string) {}

  static async create(): Promise<FakeFileStorage> {
    // El punto inicial reproduce rutas reales como "Desktop/.bienestar/backend/storage".
    return new FakeFileStorage(await mkdtemp(path.join(os.tmpdir(), '.bm-fake-storage-')));
  }

  async upload(input: { localPath: string; folder: StorageFolder; fileName: string }): Promise<StoredLocation> {
    const remotePath = `${input.folder}/${input.fileName}`;
    await mkdir(path.join(this.root, input.folder), { recursive: true });
    await copyFile(input.localPath, path.join(this.root, remotePath));
    this.uploaded.push(remotePath);
    return { path: remotePath, url: `https://cdn.test/${remotePath}` };
  }

  async fetchToLocal(remotePath: string): Promise<string> {
    if (this.deleted.includes(remotePath)) {
      throw new StorageError('El archivo no existe en el almacenamiento', { notFound: true });
    }
    return path.join(this.root, remotePath);
  }

  async delete(remotePath: string): Promise<void> {
    this.deleted.push(remotePath);
    await rm(path.join(this.root, remotePath), { force: true });
  }

  async dispose(): Promise<void> {
    await rm(this.root, { recursive: true, force: true });
  }
}
