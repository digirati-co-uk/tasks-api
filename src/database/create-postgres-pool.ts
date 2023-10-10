import { createPool } from 'slonik';
import { DBConfig } from '../types';

export function createPostgresPool(config: DBConfig) {
  return createPool(
    typeof config === 'string'
      ? config
      : `postgres://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`,
    {
      connectionTimeout: 'DISABLE_TIMEOUT',
    }
  );
}
