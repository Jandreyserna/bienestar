import { createApp } from './app.js';
import { ConfigError, loadConfig, loadDotEnv } from './config/env.js';
import { buildContainer } from './container.js';
import { runMigrations } from './shared/infrastructure/database/migrator.js';

async function bootstrap(): Promise<void> {
  loadDotEnv();
  const config = loadConfig();
  const container = buildContainer(config);
  const { logger, database } = container.cradle;

  try {
    if (config.db.migrateOnStart) await runMigrations(database, logger);
    await container.cradle.seedDefaultSections.execute();
    await container.cradle.ensureAdminUser.execute(config.admin);
  } catch (error) {
    logger.error('No se pudo preparar la base de datos. ¿Está MySQL corriendo y es correcta la configuración DB_*?', {
      error,
    });
    await container.dispose();
    process.exit(1);
  }

  const server = createApp(container).listen(config.port, () => {
    logger.info(`API de Bienestar Moral escuchando en http://localhost:${config.port}/api`, {
      storage: config.storage.driver,
      fileWorkers: config.files.workers,
    });
  });

  const shutdown = (signal: string) => {
    logger.info(`Recibido ${signal}, cerrando...`);
    server.close(() => {
      void container.dispose().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error: unknown) => {
  if (error instanceof ConfigError) {
    console.error(error.message);
  } else {
    console.error('Error fatal al iniciar', error);
  }
  process.exit(1);
});
