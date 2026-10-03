import type { FastifyInstance } from 'fastify';

import { createAuthMiddleware, type AuthService } from '../auth/index.js';
import { HealthController } from './health.controller.js';

/**
 * Registers Health routes:
 * - GET /api/v1/projects/:projectId/health (Get project shard health)
 *
 * Contract: docs/task.md §19 (Health APIs)
 */
export function registerHealthRoutes(
  app: FastifyInstance,
  authService: AuthService,
  healthController: HealthController = new HealthController()
): void {
  const requireAuth = createAuthMiddleware(authService);

  app.get<{ Params: { projectId: string } }>(
    '/api/v1/projects/:projectId/health',
    {
      preHandler: [requireAuth],
    },
    (request, reply) => healthController.getProjectHealth(request, reply)
  );
}
