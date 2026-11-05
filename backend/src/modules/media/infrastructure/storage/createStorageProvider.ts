import type { StorageConfig } from '../../../../config/env.js';
import { FtpStorageProvider } from './FtpStorageProvider.js';
import { LocalStorageProvider } from './LocalStorageProvider.js';
import type { StorageProvider } from './StorageProvider.js';

/** Factory que elige la estrategia de almacenamiento según la configuración. */
export function createStorageProvider(config: StorageConfig): StorageProvider {
  switch (config.driver) {
    case 'ftp':
      return new FtpStorageProvider(config.ftp);
    case 'local':
      return new LocalStorageProvider(config.rootDir);
  }
}
