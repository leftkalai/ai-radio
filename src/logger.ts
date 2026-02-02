import pino from 'pino';
import { AppEnv } from './env.ts';

export function createLogger(env: Pick<AppEnv, 'LOG_LEVEL'>) {
  return pino({
    level: env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'production'
        ? undefined
        : {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:standard' }
          }
  });
}
