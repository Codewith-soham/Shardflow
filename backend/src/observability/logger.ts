import type { FastifyServerOptions } from 'fastify';

import type { AppConfig } from '../config/index.js';

/**
 * Creates Pino logger configuration options for Fastify.
 * Enforces sensitive data redaction as mandated by docs/rules.md Rule 8.4.
 */
export function createLoggerOptions(config: AppConfig): FastifyServerOptions['logger'] {
  if (config.nodeEnv === 'test') {
    return false; // Silent during unit tests unless explicitly enabled
  }

  return {
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers["x-api-key"]',
        'req.headers["X-API-Key"]',
        'headers.authorization',
        'headers["x-api-key"]',
        'headers["X-API-Key"]',
        '*.password',
        '*.key',
        '*.apiKey',
        '*.keyHash',
        '*.token',
        '*.connectionUri',
        '*.mongodbUri',
        '*.secret',
      ],
      censor: '[REDACTED]',
    },
  };
}
