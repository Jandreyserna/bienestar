import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { asValue } from 'awilix';
import type { Express } from 'express';
import { createApp } from '../../src/app.js';
import { loadConfig, type AppConfig } from '../../src/config/env.js';
import { buildContainer, type AppContainer } from '../../src/container.js';
import {
  FakeFileStorage,
  InMemoryAdminUserRepository,
  InMemorySectionRepository,
  InMemoryWorksheetRepository,
} from './fakes.js';

export const ADMIN = { email: 'admin@bienestarmoral.org', password: 'clave-super-segura' };

export function testConfig(overrides: Record<string, string> = {}): AppConfig {
  return loadConfig({
    NODE_ENV: 'test',
    DB_USER: 'test',
    DB_NAME: 'test',
    JWT_SECRET: 'test-secret-de-al-menos-treinta-y-dos-caracteres',
    UPLOAD_TMP_DIR: path.join(os.tmpdir(), 'bm-test-uploads'),
    ...overrides,
  });
}

export interface TestApp {
  app: Express;
  container: AppContainer;
  sections: InMemorySectionRepository;
  worksheets: InMemoryWorksheetRepository;
  storage: FakeFileStorage;
  dispose(): Promise<void>;
}

/**
 * Mismo contenedor que producción, reemplazando solo los adaptadores de
 * infraestructura (MySQL y almacenamiento) por dobles en memoria.
 */
export async function buildTestApp(): Promise<TestApp> {
  const cacheDir = await mkdtemp(path.join(os.tmpdir(), 'bm-test-cache-'));
  const container = buildContainer(testConfig({ DOWNLOAD_CACHE_DIR: cacheDir }));
  const sections = new InMemorySectionRepository();
  const worksheets = new InMemoryWorksheetRepository();
  const storage = await FakeFileStorage.create();

  container.register({
    sectionRepository: asValue(sections),
    worksheetRepository: asValue(worksheets),
    adminUserRepository: asValue(new InMemoryAdminUserRepository()),
    fileStorage: asValue(storage),
    database: asValue({ ping: async () => true } as never),
  });

  await container.cradle.seedDefaultSections.execute();
  await container.cradle.ensureAdminUser.execute(ADMIN);

  return {
    app: createApp(container),
    container,
    sections,
    worksheets,
    storage,
    async dispose() {
      await storage.dispose();
      await rm(cacheDir, { recursive: true, force: true });
    },
  };
}
