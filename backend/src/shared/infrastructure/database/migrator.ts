import type { Logger } from '../../application/ports/Logger.js';
import type { SqlExecutor } from './MySqlDatabase.js';
import { migrations as defaultMigrations, type Migration } from './migrations.js';

/** Aplica, en orden, las migraciones que aún no estén registradas en `schema_migrations`. */
export async function runMigrations(
  db: SqlExecutor,
  logger: Logger,
  migrations: Migration[] = defaultMigrations,
): Promise<void> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(190) NOT NULL PRIMARY KEY,
      applied_at DATETIME(3) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );
  const rows = await db.query<{ name: string }>('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.name));

  for (const migration of migrations) {
    if (applied.has(migration.name)) continue;
    logger.info(`Aplicando migración ${migration.name}`);
    // En MySQL las sentencias DDL hacen commit implícito, por eso no se envuelven en transacción.
    for (const statement of migration.statements) {
      await db.execute(statement);
    }
    await db.execute('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)', [
      migration.name,
      new Date(),
    ]);
  }
}
