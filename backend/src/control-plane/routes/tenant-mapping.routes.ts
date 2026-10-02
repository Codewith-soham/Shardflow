import type { FastifyInstance } from 'fastify';

import { createAuthMiddleware, type AuthService } from '../../auth/index.js';
import { TenantMappingController } from '../controllers/tenant-mapping.controller.js';

export function registerTenantMappingRoutes(
  app: FastifyInstance,
  authService: AuthService,
  controller?: TenantMappingController
): void {
  const tenantMappingController = controller ?? new TenantMappingController();
  const authMiddleware = createAuthMiddleware(authService);

  app.post(
    '/api/v1/projects/:projectId/tenant-mappings',
    { preHandler: authMiddleware },
    async (request, reply) => {
      await tenantMappingController.createTenantMapping(request, reply);
    }
  );

  app.get(
    '/api/v1/projects/:projectId/tenant-mappings',
    { preHandler: authMiddleware },
    async (request, reply) => {
      await tenantMappingController.listTenantMappings(request, reply);
    }
  );

  app.get(
    '/api/v1/projects/:projectId/tenant-mappings/:mappingId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      await tenantMappingController.getTenantMapping(request, reply);
    }
  );

  app.patch(
    '/api/v1/projects/:projectId/tenant-mappings/:mappingId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      await tenantMappingController.updateTenantMapping(request, reply);
    }
  );

  app.delete(
    '/api/v1/projects/:projectId/tenant-mappings/:mappingId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      await tenantMappingController.deleteTenantMapping(request, reply);
    }
  );
}
