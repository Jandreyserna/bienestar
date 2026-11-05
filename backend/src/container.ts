/**
 * Composition Root (ARQ-03): el ÚNICO lugar donde se decide qué implementación
 * concreta recibe cada puerto. El resto del código solo declara en su constructor
 * lo que necesita (por nombre) y awilix lo inyecta.
 *
 * En pruebas se reemplazan piezas con `container.register({ x: asValue(fake) })`.
 */
import { asClass, asFunction, asValue, createContainer, InjectionMode, type AwilixContainer } from 'awilix';
import type { RequestHandler } from 'express';
import type { AppConfig } from './config/env.js';
import { createDocumentPolicy, createImagePolicy, type FilePolicy } from './shared/domain/FilePolicy.js';
import type { FileStorage } from './shared/application/ports/FileStorage.js';
import type { Logger } from './shared/application/ports/Logger.js';
import { MySqlDatabase } from './shared/infrastructure/database/MySqlDatabase.js';
import { singleFileUpload } from './shared/infrastructure/http/upload.js';
import { ConsoleLogger } from './shared/infrastructure/logging/ConsoleLogger.js';
import { EnsureAdminUser, Login } from './modules/auth/application/AuthUseCases.js';
import type { PasswordHasher, TokenService } from './modules/auth/application/ports.js';
import type { AdminUserRepository } from './modules/auth/domain/AdminUser.js';
import { JwtTokenService } from './modules/auth/infrastructure/JwtTokenService.js';
import { MySqlAdminUserRepository } from './modules/auth/infrastructure/MySqlAdminUserRepository.js';
import { ScryptPasswordHasher } from './modules/auth/infrastructure/ScryptPasswordHasher.js';
import { AuthController, requireAdmin } from './modules/auth/interface/http/AuthController.js';
import { UploadImage } from './modules/media/application/UploadImage.js';
import { WorkerFileStorage } from './modules/media/infrastructure/WorkerFileStorage.js';
import { FileTransferWorkerPool } from './modules/media/infrastructure/worker/FileTransferWorkerPool.js';
import { MediaController } from './modules/media/interface/http/MediaController.js';
import {
  CreateSection,
  DeleteSection,
  GetPageSections,
  GetSection,
  SeedDefaultSections,
  UpdateSection,
} from './modules/site-content/application/SectionUseCases.js';
import { SectionFactory } from './modules/site-content/domain/SectionFactory.js';
import type { SectionRepository } from './modules/site-content/domain/SectionRepository.js';
import { MySqlSectionRepository } from './modules/site-content/infrastructure/MySqlSectionRepository.js';
import { SectionController } from './modules/site-content/interface/http/SectionController.js';
import {
  CreateWorksheet,
  DeleteWorksheet,
  DownloadWorksheet,
  GetWorksheet,
  ListWorksheets,
  UpdateWorksheet,
} from './modules/worksheets/application/WorksheetUseCases.js';
import type { WorksheetRepository } from './modules/worksheets/domain/WorksheetRepository.js';
import { MySqlWorksheetRepository } from './modules/worksheets/infrastructure/MySqlWorksheetRepository.js';
import { WorksheetController } from './modules/worksheets/interface/http/WorksheetController.js';

export interface Cradle {
  config: AppConfig;
  logger: Logger;
  database: MySqlDatabase;

  // Dominio: factories y políticas
  sectionFactory: SectionFactory;
  imagePolicy: FilePolicy;
  documentPolicy: FilePolicy;

  // Puertos -> adaptadores
  sectionRepository: SectionRepository;
  worksheetRepository: WorksheetRepository;
  adminUserRepository: AdminUserRepository;
  fileTransferPool: FileTransferWorkerPool;
  fileStorage: FileStorage;
  passwordHasher: PasswordHasher;
  tokenService: TokenService;

  // Casos de uso
  getPageSections: GetPageSections;
  getSection: GetSection;
  createSection: CreateSection;
  updateSection: UpdateSection;
  deleteSection: DeleteSection;
  seedDefaultSections: SeedDefaultSections;
  listWorksheets: ListWorksheets;
  getWorksheet: GetWorksheet;
  createWorksheet: CreateWorksheet;
  updateWorksheet: UpdateWorksheet;
  deleteWorksheet: DeleteWorksheet;
  downloadWorksheet: DownloadWorksheet;
  uploadImage: UploadImage;
  login: Login;
  ensureAdminUser: EnsureAdminUser;

  // Interfaz HTTP
  adminGuard: RequestHandler;
  imageUpload: RequestHandler[];
  documentUpload: RequestHandler[];
  sectionController: SectionController;
  worksheetController: WorksheetController;
  mediaController: MediaController;
  authController: AuthController;
}

export type AppContainer = AwilixContainer<Cradle>;

export function buildContainer(config: AppConfig): AppContainer {
  const container = createContainer<Cradle>({ injectionMode: InjectionMode.CLASSIC, strict: true });

  container.register({
    config: asValue(config),
    logger: asClass(ConsoleLogger).singleton(),
    database: asClass(MySqlDatabase)
      .singleton()
      .disposer((db) => db.close()),

    sectionFactory: asFunction(() => new SectionFactory()).singleton(),
    imagePolicy: asFunction(() => createImagePolicy(config.files.maxImageBytes)).singleton(),
    documentPolicy: asFunction(() => createDocumentPolicy(config.files.maxDocumentBytes)).singleton(),

    sectionRepository: asClass(MySqlSectionRepository).singleton(),
    worksheetRepository: asClass(MySqlWorksheetRepository).singleton(),
    adminUserRepository: asClass(MySqlAdminUserRepository).singleton(),
    fileTransferPool: asFunction(
      (logger: Logger) =>
        new FileTransferWorkerPool(
          { size: config.files.workers, jobTimeoutMs: config.files.jobTimeoutMs, storage: config.storage },
          logger,
        ),
    )
      .singleton()
      .disposer((pool) => pool.close()),
    fileStorage: asClass(WorkerFileStorage).singleton(),
    passwordHasher: asClass(ScryptPasswordHasher).singleton(),
    tokenService: asClass(JwtTokenService).singleton(),

    getPageSections: asClass(GetPageSections).singleton(),
    getSection: asClass(GetSection).singleton(),
    createSection: asClass(CreateSection).singleton(),
    updateSection: asClass(UpdateSection).singleton(),
    deleteSection: asClass(DeleteSection).singleton(),
    seedDefaultSections: asClass(SeedDefaultSections).singleton(),
    listWorksheets: asClass(ListWorksheets).singleton(),
    getWorksheet: asClass(GetWorksheet).singleton(),
    createWorksheet: asClass(CreateWorksheet).singleton(),
    updateWorksheet: asClass(UpdateWorksheet).singleton(),
    deleteWorksheet: asClass(DeleteWorksheet).singleton(),
    downloadWorksheet: asClass(DownloadWorksheet).singleton(),
    uploadImage: asClass(UploadImage).singleton(),
    login: asClass(Login).singleton(),
    ensureAdminUser: asClass(EnsureAdminUser).singleton(),

    adminGuard: asFunction((tokenService: TokenService) => requireAdmin(tokenService)).singleton(),
    imageUpload: asFunction((imagePolicy: FilePolicy) =>
      singleFileUpload(imagePolicy, config.files.uploadTmpDir),
    ).singleton(),
    documentUpload: asFunction((documentPolicy: FilePolicy) =>
      singleFileUpload(documentPolicy, config.files.uploadTmpDir),
    ).singleton(),
    sectionController: asClass(SectionController).singleton(),
    worksheetController: asClass(WorksheetController).singleton(),
    mediaController: asClass(MediaController).singleton(),
    authController: asClass(AuthController).singleton(),
  });

  return container;
}
