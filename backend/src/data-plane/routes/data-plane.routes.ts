import type { FastifyInstance } from 'fastify';

import {
  createDataPlaneAuthMiddleware,
  type DataPlaneAuthOptions,
} from '../middleware/data-plane-auth.middleware.js';
import { DataPlaneController } from '../controllers/data-plane.controller.js';

export function registerDataPlaneRoutes(
  app: FastifyInstance,
  controller?: DataPlaneController,
  authOptions?: DataPlaneAuthOptions
): void {
  const dataPlaneController = controller ?? new DataPlaneController();
  const authMiddleware = createDataPlaneAuthMiddleware(authOptions);

  app.post(
    '/api/v1/data',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      await dataPlaneController.execute(request, reply);
    }
  );
}
