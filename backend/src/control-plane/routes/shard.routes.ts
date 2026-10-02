import type { FastifyInstance } from 'fastify';

import { createAuthMiddleware, type AuthService } from '../../auth/index.js';
import { validateRequest } from '../../validation/index.js';
import { createShardBodySchema, updateShardBodySchema } from '../models/shard.model.js';
import { ShardController } from '../controllers/shard.controller.js';

/**
 * Registers Shard Management routes:
 * - POST   /api/v1/projects/:projectId/shards             (Register shard — Task 3.4)
 * - GET    /api/v1/projects/:projectId/shards             (List shards — Task 3.5)
 * - GET    /api/v1/projects/:projectId/shards/:shardId    (Get shard — Task 3.5)
 * - PATCH  /api/v1/projects/:projectId/shards/:shardId    (Update shard — Task 3.6)
 * - DELETE /api/v1/projects/:projectId/shards/:shardId    (Disable shard — Task 3.7)
 *
 * Contract: docs/api.md Section 14 (Shard APIs)
 * Security: Connection credentials are NEVER returned through any of these routes.
 */
export function registerShardRoutes(
  app: FastifyInstance,
  authService: AuthService,
  shardController: ShardController = new ShardController()
): void {
  const requireAuth = createAuthMiddleware(authService);

  // POST /api/v1/projects/:projectId/shards
  app.post<{ Params: { projectId: string }; Body: any }>(
    '/api/v1/projects/:projectId/shards',
    {
      preHandler: [requireAuth, validateRequest({ body: createShardBodySchema })],
    },
    (request, reply) => shardController.registerShard(request, reply)
  );

  // GET /api/v1/projects/:projectId/shards
  app.get<{ Params: { projectId: string } }>(
    '/api/v1/projects/:projectId/shards',
    {
      preHandler: [requireAuth],
    },
    (request, reply) => shardController.listShards(request, reply)
  );

  // GET /api/v1/projects/:projectId/shards/:shardId
  app.get<{ Params: { projectId: string; shardId: string } }>(
    '/api/v1/projects/:projectId/shards/:shardId',
    {
      preHandler: [requireAuth],
    },
    (request, reply) => shardController.getShard(request, reply)
  );

  // PATCH /api/v1/projects/:projectId/shards/:shardId
  app.patch<{ Params: { projectId: string; shardId: string }; Body: any }>(
    '/api/v1/projects/:projectId/shards/:shardId',
    {
      preHandler: [requireAuth, validateRequest({ body: updateShardBodySchema })],
    },
    (request, reply) => shardController.updateShard(request, reply)
  );

  // DELETE /api/v1/projects/:projectId/shards/:shardId
  app.delete<{ Params: { projectId: string; shardId: string } }>(
    '/api/v1/projects/:projectId/shards/:shardId',
    {
      preHandler: [requireAuth],
    },
    (request, reply) => shardController.disableShard(request, reply)
  );
}
