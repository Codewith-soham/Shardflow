import type { FastifyInstance } from 'fastify';

import { createAuthMiddleware, type AuthService } from '../../auth/index.js';
import { UserController } from '../controllers/user.controller.js';

export interface MeRoutesOptions {
  authService: AuthService;
  userController?: UserController;
}

/**
 * Registers the Current User (/api/v1/me) route.
 *
 * Route -> Controller -> Service -> Repository
 */
export function registerMeRoutes(
  app: FastifyInstance,
  authService: AuthService,
  userController: UserController = new UserController()
): void {
  const requireAuth = createAuthMiddleware(authService);

  app.get(
    '/api/v1/me',
    { preHandler: [requireAuth] },
    (request, reply) => userController.getCurrentUser(request, reply)
  );
}

