import type { FastifyInstance } from 'fastify';

import { createAuthMiddleware, type AuthService } from '../../auth/index.js';
import { RoutingController } from '../controllers/routing.controller.js';

export function registerRoutingRoutes(
  app: FastifyInstance,
  authService: AuthService,
  controller?: RoutingController
): void {
  const routingController = controller ?? new RoutingController();
  const authMiddleware = createAuthMiddleware(authService);

  app.get(
    '/api/v1/projects/:projectId/routing',
    { preHandler: authMiddleware },
    async (request, reply) => {
      await routingController.getRoutingConfig(request, reply);
    }
  );

  app.patch(
    '/api/v1/projects/:projectId/routing',
    { preHandler: authMiddleware },
    async (request, reply) => {
      await routingController.updateRoutingConfig(request, reply);
    }
  );
}
