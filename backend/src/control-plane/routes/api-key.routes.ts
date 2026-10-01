import type { FastifyInstance } from 'fastify';

import { createAuthMiddleware, type AuthService } from '../../auth/index.js';
import { validateRequest } from '../../validation/index.js';
import { createApiKeyBodySchema } from '../models/api-key.model.js';
import { ApiKeyController } from '../controllers/api-key.controller.js';

export interface ApiKeyRoutesOptions {
  authService: AuthService;
  apiKeyController?: ApiKeyController;
}

/**
 * Registers API Key Management routes:
 * - POST   /api/v1/projects/:projectId/api-keys             (Generate API key)
 * - GET    /api/v1/projects/:projectId/api-keys             (List API keys)
 * - DELETE /api/v1/projects/:projectId/api-keys/:apiKeyId   (Revoke API key)
 *
 * Contract: docs/api.md Section 13 (API Key APIs)
 */
export function registerApiKeyRoutes(
  app: FastifyInstance,
  authService: AuthService,
  apiKeyController: ApiKeyController = new ApiKeyController()
): void {
  const requireAuth = createAuthMiddleware(authService);

  // POST /api/v1/projects/:projectId/api-keys
  app.post<{ Params: { projectId: string }; Body: any }>(
    '/api/v1/projects/:projectId/api-keys',
    {
      preHandler: [requireAuth, validateRequest({ body: createApiKeyBodySchema })],
    },
    (request, reply) => apiKeyController.createApiKey(request, reply)
  );

  // GET /api/v1/projects/:projectId/api-keys
  app.get<{ Params: { projectId: string } }>(
    '/api/v1/projects/:projectId/api-keys',
    {
      preHandler: [requireAuth],
    },
    (request, reply) => apiKeyController.listApiKeys(request, reply)
  );

  // DELETE /api/v1/projects/:projectId/api-keys/:apiKeyId
  app.delete<{ Params: { projectId: string; apiKeyId: string } }>(
    '/api/v1/projects/:projectId/api-keys/:apiKeyId',
    {
      preHandler: [requireAuth],
    },
    (request, reply) => apiKeyController.revokeApiKey(request, reply)
  );
}
