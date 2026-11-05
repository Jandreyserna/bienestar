import { loadConfig, loadDotEnv } from '../../../config/env.js';
import { ConsoleLogger } from '../logging/ConsoleLogger.js';
import { MySqlDatabase } from './MySqlDatabase.js';
import { runMigrations } from './migrator.js';

/** `npm run migrate`: aplica migraciones sin levantar el servidor. */
loadDotEnv();
const config = loadConfig();
const logger = new ConsoleLogger(config);
const db = new MySqlDatabase(config);

try {
  await runMigrations(db, logger);
  logger.info('Migraciones al día');
} catch (error) {
  logger.error('Error aplicando migraciones', { error });
  process.exitCode = 1;
} finally {
  await db.close();
}
