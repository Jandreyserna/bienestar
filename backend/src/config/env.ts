import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';

const MB = 1024 * 1024;

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGINS: z.string().default('http://localhost:4200'),
  TRUST_PROXY: z.stringbool().default(false),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1),
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),
  DB_MIGRATE_ON_START: z.stringbool().default(true),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),

  STORAGE_DRIVER: z.enum(['local', 'ftp']).default('local'),
  PUBLIC_FILES_BASE_URL: z.url().optional(),
  LOCAL_STORAGE_DIR: z.string().default('./storage/public'),
  FTP_HOST: z.string().optional(),
  FTP_PORT: z.coerce.number().int().positive().default(21),
  FTP_USER: z.string().optional(),
  FTP_PASSWORD: z.string().optional(),
  FTP_SECURE: z.enum(['true', 'false', 'implicit']).default('true'),
  FTP_BASE_DIR: z.string().default('public_html/uploads'),
  FTP_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

  FILE_WORKERS: z.coerce.number().int().min(1).max(8).default(2),
  FILE_JOB_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
  DOWNLOAD_CACHE_DIR: z.string().default('./storage/cache'),
  UPLOAD_TMP_DIR: z.string().optional(),
  MAX_IMAGE_SIZE_MB: z.coerce.number().positive().default(5),
  MAX_DOCUMENT_SIZE_MB: z.coerce.number().positive().default(20),
});

export type FtpSecureMode = boolean | 'implicit';

/** Configuración que necesita el Worker; debe ser serializable (viaja por workerData). */
export type StorageConfig =
  | { driver: 'local'; rootDir: string; publicBaseUrl: string }
  | {
      driver: 'ftp';
      publicBaseUrl: string;
      ftp: {
        host: string;
        port: number;
        user: string;
        password: string;
        secure: FtpSecureMode;
        baseDir: string;
        timeoutMs: number;
      };
    };

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  http: { corsOrigins: string[]; trustProxy: boolean };
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionLimit: number;
    migrateOnStart: boolean;
  };
  auth: { jwtSecret: string; jwtExpiresIn: string };
  admin: { email?: string; password?: string };
  storage: StorageConfig;
  files: {
    workers: number;
    jobTimeoutMs: number;
    downloadCacheDir: string;
    uploadTmpDir: string;
    maxImageBytes: number;
    maxDocumentBytes: number;
  };
}

export class ConfigError extends Error {}

function buildStorageConfig(env: z.infer<typeof EnvSchema>): StorageConfig {
  if (env.STORAGE_DRIVER === 'local') {
    return {
      driver: 'local',
      rootDir: path.resolve(env.LOCAL_STORAGE_DIR),
      publicBaseUrl: env.PUBLIC_FILES_BASE_URL ?? `http://localhost:${env.PORT}/uploads`,
    };
  }
  const missing = (['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD', 'PUBLIC_FILES_BASE_URL'] as const).filter(
    (key) => !env[key],
  );
  if (missing.length > 0) {
    throw new ConfigError(`STORAGE_DRIVER=ftp requiere: ${missing.join(', ')}`);
  }
  return {
    driver: 'ftp',
    publicBaseUrl: env.PUBLIC_FILES_BASE_URL!,
    ftp: {
      host: env.FTP_HOST!,
      port: env.FTP_PORT,
      user: env.FTP_USER!,
      password: env.FTP_PASSWORD!,
      secure: env.FTP_SECURE === 'implicit' ? 'implicit' : env.FTP_SECURE === 'true',
      baseDir: env.FTP_BASE_DIR,
      timeoutMs: env.FTP_TIMEOUT_MS,
    },
  };
}

/**
 * Lee y valida la configuración. Recibe el objeto de entorno como parámetro
 * para poder construir configuraciones de prueba sin tocar `process.env`.
 */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new ConfigError(`Configuración inválida en variables de entorno:\n${problems}`);
  }
  const env = parsed.data;

  return {
    env: env.NODE_ENV,
    port: env.PORT,
    http: {
      corsOrigins: env.CORS_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
      trustProxy: env.TRUST_PROXY,
    },
    db: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      connectionLimit: env.DB_CONNECTION_LIMIT,
      migrateOnStart: env.DB_MIGRATE_ON_START,
    },
    auth: { jwtSecret: env.JWT_SECRET, jwtExpiresIn: env.JWT_EXPIRES_IN },
    admin: { email: env.ADMIN_EMAIL || undefined, password: env.ADMIN_PASSWORD || undefined },
    storage: buildStorageConfig(env),
    files: {
      workers: env.FILE_WORKERS,
      jobTimeoutMs: env.FILE_JOB_TIMEOUT_MS,
      downloadCacheDir: path.resolve(env.DOWNLOAD_CACHE_DIR),
      uploadTmpDir: path.resolve(env.UPLOAD_TMP_DIR ?? path.join(os.tmpdir(), 'bienestar-uploads')),
      maxImageBytes: Math.round(env.MAX_IMAGE_SIZE_MB * MB),
      maxDocumentBytes: Math.round(env.MAX_DOCUMENT_SIZE_MB * MB),
    },
  };
}

/** Carga `.env` (si existe) en process.env usando el soporte nativo de Node. */
export function loadDotEnv(file = '.env'): void {
  if (existsSync(file)) process.loadEnvFile(file);
}
