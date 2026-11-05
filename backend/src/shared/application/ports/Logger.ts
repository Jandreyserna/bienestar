export type LogMeta = Record<string, unknown>;

/** Puerto de logging: las capas internas no dependen de una librería concreta. */
export interface Logger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
}
