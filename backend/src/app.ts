import Fastify, { type FastifyInstance } from 'fastify';

import type { AppConfig } from './config/index.js';

/**
 * Creates and configures the Fastify application instance.
 *
 * This function is the application construction boundary.
 * It does NOT start the HTTP server — that responsibility belongs to server.ts.
 */
export async function buildApp(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.nodeEnv !== 'test',
  });

  // Health / root endpoint — minimal verification that the server is running
  app.get('/health', async (_request, _reply) => {
    return { status: 'ok' };
  });

  return app;
}
