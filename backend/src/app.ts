import Fastify, { type FastifyInstance } from 'fastify';

import type { AppConfig } from './config/index.js';
import { closeDatabase, isDatabaseConnected } from './database/index.js';
import { errorHandler, notFoundHandler } from './errors/index.js';
import { createLoggerOptions } from './observability/index.js';

/**
 * Creates and configures the Fastify application instance.
 *
 * This function is the application construction boundary.
 * It configures logging, error handling, not found handling, lifecycle hooks, and baseline routes.
 * It does NOT start the HTTP server — that responsibility belongs to server.ts.
 */
export async function buildApp(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: createLoggerOptions(config),
  });

  // Register centralized error handler and 404 handler
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  
  // Cleanly close database connections when Fastify server is closed
  app.addHook('onClose', async () => {
    await closeDatabase();
  });

  // Health endpoint — reports service and metadata database connection status
  app.get('/health', async (_request, _reply) => {
    return {
      status: 'ok',
      database: isDatabaseConnected() ? 'connected' : 'disconnected',
    };
  });

  return app;
}
