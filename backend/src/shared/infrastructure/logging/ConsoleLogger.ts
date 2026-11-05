import type { AppConfig } from '../../../config/env.js';
import type { LogMeta, Logger } from '../../application/ports/Logger.js';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof LEVELS;

/** Implementación simple del puerto Logger sobre la consola. */
export class ConsoleLogger implements Logger {
  private readonly minLevel: number;

  constructor(config: AppConfig) {
    const level: Level = config.env === 'production' ? 'info' : config.env === 'test' ? 'warn' : 'debug';
    this.minLevel = LEVELS[level];
  }

  debug(message: string, meta?: LogMeta): void {
    this.write('debug', message, meta);
  }
  info(message: string, meta?: LogMeta): void {
    this.write('info', message, meta);
  }
  warn(message: string, meta?: LogMeta): void {
    this.write('warn', message, meta);
  }
  error(message: string, meta?: LogMeta): void {
    this.write('error', message, meta);
  }

  private write(level: Level, message: string, meta?: LogMeta): void {
    if (LEVELS[level] < this.minLevel) return;
    const line = `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} ${message}`;
    const out = level === 'error' || level === 'warn' ? console.error : console.log;
    if (meta && Object.keys(meta).length > 0) out(line, serialize(meta));
    else out(line);
  }
}

function serialize(meta: LogMeta): LogMeta {
  const result: LogMeta = {};
  for (const [key, value] of Object.entries(meta)) {
    result[key] = value instanceof Error ? { name: value.name, message: value.message, stack: value.stack } : value;
  }
  return result;
}
