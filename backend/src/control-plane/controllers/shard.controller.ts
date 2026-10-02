import type { FastifyRequest, FastifyReply } from 'fastify';
import { ObjectId } from 'mongodb';

import { UnauthorizedError, BadRequestError } from '../../errors/app-error.js';
import { ErrorCode } from '../../errors/codes.js';
import type { Shard } from '../models/shard.model.js';
import {
  ShardService,
  type RegisterShardInput,
  type UpdateShardInput,
} from '../services/shard.service.js';

// ─── Format Helper ────────────────────────────────────────────────────────────

/**
 * Safe public view of a shard — connection credentials are NEVER included.
 * Architecture constraint: docs/architecture.md §29, §Principle 4.
 */
function formatShard(shard: Shard) {
  return {
    id: shard._id.toString(),
    projectId: shard.projectId.toString(),
    name: shard.name,
    status: shard.status,
    healthStatus: shard.healthStatus,
    lastHealthCheckAt: shard.lastHealthCheckAt ?? null,
    lastSuccessfulHealthCheckAt: shard.lastSuccessfulHealthCheckAt ?? null,
    createdAt: shard.createdAt,
    updatedAt: shard.updatedAt,
  };
}

// ─── Controller ───────────────────────────────────────────────────────────────

export class ShardController {
  private readonly shardService: ShardService;

  constructor(shardService?: ShardService) {
    this.shardService = shardService ?? new ShardService();
  }

  /**
   * POST /api/v1/projects/:projectId/shards
   * Registers a new shard and performs initial connection validation.
   */
  async registerShard(
    request: FastifyRequest<{ Params: { projectId: string }; Body: RegisterShardInput }>,
    reply: FastifyReply
  ) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedError('Authentication required', ErrorCode.AUTHENTICATION_REQUIRED);
    }

    const { projectId } = request.params;
    if (!projectId || !ObjectId.isValid(projectId)) {
      throw new BadRequestError('Invalid project ID format', ErrorCode.INVALID_PROJECT_ID);
    }

    const shard = await this.shardService.registerShard(projectId, user._id, request.body);

    reply.status(201);
    return {
      success: true,
      data: formatShard(shard),
      message: 'Shard registered successfully',
    };
  }

  /**
   * GET /api/v1/projects/:projectId/shards
   * Lists all shards for a project (no credentials in response).
   */
  async listShards(
    request: FastifyRequest<{ Params: { projectId: string } }>,
    _reply: FastifyReply
  ) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedError('Authentication required', ErrorCode.AUTHENTICATION_REQUIRED);
    }

    const { projectId } = request.params;
    if (!projectId || !ObjectId.isValid(projectId)) {
      throw new BadRequestError('Invalid project ID format', ErrorCode.INVALID_PROJECT_ID);
    }

    const shards = await this.shardService.listShards(projectId, user._id);

    return {
      success: true,
      data: { shards: shards.map(formatShard) },
      message: 'Shards retrieved successfully',
    };
  }

  /**
   * GET /api/v1/projects/:projectId/shards/:shardId
   * Returns a single shard by ID (no credentials in response).
   */
  async getShard(
    request: FastifyRequest<{ Params: { projectId: string; shardId: string } }>,
    _reply: FastifyReply
  ) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedError('Authentication required', ErrorCode.AUTHENTICATION_REQUIRED);
    }

    const { projectId, shardId } = request.params;
    if (!projectId || !ObjectId.isValid(projectId)) {
      throw new BadRequestError('Invalid project ID format', ErrorCode.INVALID_PROJECT_ID);
    }
    if (!shardId || !ObjectId.isValid(shardId)) {
      throw new BadRequestError('Invalid shard ID format', ErrorCode.INVALID_SHARD_ID);
    }

    const shard = await this.shardService.getShardById(projectId, shardId, user._id);

    return {
      success: true,
      data: formatShard(shard),
      message: 'Shard retrieved successfully',
    };
  }

  /**
   * PATCH /api/v1/projects/:projectId/shards/:shardId
   * Updates shard name and/or connection URI.
   */
  async updateShard(
    request: FastifyRequest<{ Params: { projectId: string; shardId: string }; Body: UpdateShardInput }>,
    _reply: FastifyReply
  ) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedError('Authentication required', ErrorCode.AUTHENTICATION_REQUIRED);
    }

    const { projectId, shardId } = request.params;
    if (!projectId || !ObjectId.isValid(projectId)) {
      throw new BadRequestError('Invalid project ID format', ErrorCode.INVALID_PROJECT_ID);
    }
    if (!shardId || !ObjectId.isValid(shardId)) {
      throw new BadRequestError('Invalid shard ID format', ErrorCode.INVALID_SHARD_ID);
    }

    const updated = await this.shardService.updateShard(
      projectId,
      shardId,
      user._id,
      request.body
    );

    return {
      success: true,
      data: formatShard(updated),
      message: 'Shard updated successfully',
    };
  }

  /**
   * DELETE /api/v1/projects/:projectId/shards/:shardId
   * Disables a shard (does NOT automatically migrate tenant data).
   */
  async disableShard(
    request: FastifyRequest<{ Params: { projectId: string; shardId: string } }>,
    _reply: FastifyReply
  ) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedError('Authentication required', ErrorCode.AUTHENTICATION_REQUIRED);
    }

    const { projectId, shardId } = request.params;
    if (!projectId || !ObjectId.isValid(projectId)) {
      throw new BadRequestError('Invalid project ID format', ErrorCode.INVALID_PROJECT_ID);
    }
    if (!shardId || !ObjectId.isValid(shardId)) {
      throw new BadRequestError('Invalid shard ID format', ErrorCode.INVALID_SHARD_ID);
    }

    const disabled = await this.shardService.disableShard(projectId, shardId, user._id);

    return {
      success: true,
      data: formatShard(disabled),
      message: 'Shard disabled successfully',
    };
  }
}
