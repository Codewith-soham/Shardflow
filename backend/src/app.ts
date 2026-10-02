import Fastify, { type FastifyInstance } from 'fastify';

import type { AppConfig } from './config/index.js';
import { closeDatabase, isDatabaseConnected } from './database/index.js';
import { errorHandler, notFoundHandler } from './errors/index.js';
import { createLoggerOptions } from './observability/index.js';

import { createSupabaseClient, AuthService } from './auth/index.js';
import {
  UserRepository,
  ProjectRepository,
  ApiKeyRepository,
  ShardRepository,
  ProjectService,
  ApiKeyService,
  ShardService,
  ProjectController,
  ApiKeyController,
  ShardController,
  registerMeRoutes,
  registerProjectRoutes,
  registerApiKeyRoutes,
  registerShardRoutes,
} from './control-plane/index.js';

export interface AppDependencies {
  authService?: AuthService;
  projectService?: ProjectService;
  projectController?: ProjectController;
  apiKeyService?: ApiKeyService;
  apiKeyController?: ApiKeyController;
  shardService?: ShardService;
  shardController?: ShardController;
}

/**
 * Creates and configures the Fastify application instance.
 *
 * This function is the application construction boundary.
 * It configures logging, error handling, not found handling, lifecycle hooks, and baseline routes.
 * It does NOT start the HTTP server — that responsibility belongs to server.ts.
 */
export async function buildApp(
  config: AppConfig,
  dependencies: AppDependencies = {}
): Promise<FastifyInstance> {
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

  // Initialize Auth Service & Control Plane Routes
  const supabaseAuth = createSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);
  const authService =
    dependencies.authService ??
    new AuthService({
      userRepository: new UserRepository(),
      supabaseAuth: supabaseAuth.auth,
    });

  const projectService =
    dependencies.projectService ?? new ProjectService(new ProjectRepository());
  const projectController =
    dependencies.projectController ?? new ProjectController(projectService);

  const apiKeyService =
    dependencies.apiKeyService ??
    new ApiKeyService(new ApiKeyRepository(), projectService);
  const apiKeyController =
    dependencies.apiKeyController ?? new ApiKeyController(apiKeyService);

  const shardService =
    dependencies.shardService ??
    new ShardService(new ShardRepository(), projectService);
  const shardController =
    dependencies.shardController ?? new ShardController(shardService);

  registerMeRoutes(app, authService);
  registerProjectRoutes(app, authService, projectController);
  registerApiKeyRoutes(app, authService, apiKeyController);
  registerShardRoutes(app, authService, shardController);

  return app;
}

