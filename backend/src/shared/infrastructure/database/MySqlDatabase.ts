import mysql from 'mysql2/promise';
import type { Pool, PoolConnection, ResultSetHeader } from 'mysql2/promise';
import type { AppConfig } from '../../../config/env.js';

/** Operaciones SQL mínimas que usan los repositorios (dentro o fuera de una transacción). */
export interface SqlExecutor {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<{ affectedRows: number }>;
}

class ConnectionExecutor implements SqlExecutor {
  constructor(private readonly connection: Pool | PoolConnection) {}

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const [rows] = await this.connection.query(sql, params);
    return rows as T[];
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ affectedRows: number }> {
    const [result] = await this.connection.query<ResultSetHeader>(sql, params);
    return { affectedRows: result.affectedRows };
  }
}

/** Adaptador de base de datos MySQL (pool de conexiones + transacciones). */
export class MySqlDatabase implements SqlExecutor {
  private readonly pool: Pool;
  private readonly executor: ConnectionExecutor;

  constructor(config: AppConfig) {
    this.pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      connectionLimit: config.db.connectionLimit,
      charset: 'utf8mb4',
      timezone: 'Z',
      waitForConnections: true,
    });
    this.executor = new ConnectionExecutor(this.pool);
  }

  query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    return this.executor.query<T>(sql, params);
  }

  execute(sql: string, params?: unknown[]): Promise<{ affectedRows: number }> {
    return this.executor.execute(sql, params);
  }

  async transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(new ConnectionExecutor(connection));
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

/** Detecta violaciones de índice único de MySQL. */
export function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'ER_DUP_ENTRY';
}
