import { ObjectId } from 'mongodb';

import { ErrorCode } from '../../errors/codes.js';
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../errors/app-error.js';
import {
  type Shard,
  ShardStatus,
  ShardHealthStatus,
  encryptConnectionUri,
  decryptConnectionUri,
} from '../models/shard.model.js';
import { ShardRepository } from '../repositories/shard.repository.js';
import { ProjectService } from './project.service.js';
import { connectionManager } from '../../connection-manager/index.js';

// ─── Service Input Interfaces ─────────────────────────────────────────────────

export interface RegisterShardInput {
  name: string;
  connectionUri: string;
}

export interface UpdateShardInput {
  name?: string;
  connectionUri?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ShardService {
  private readonly shardRepository: ShardRepository;
  private readonly projectService: ProjectService;

  constructor(
    shardRepository?: ShardRepository,
    projectService?: ProjectService
  ) {
    this.shardRepository = shardRepository ?? new ShardRepository();
    this.projectService = projectService ?? new ProjectService();
  }

  /**
   * Registers a new shard for the given project.
   *
   * Flow (docs/architecture.md §27 — Shard Registration Lifecycle):
   * 1. Verify project exists and is owned by the user.
   * 2. Enforce uniqueness of shard name within the project.
   * 3. Encrypt the raw connection URI before persistence.
   * 4. Persist the shard document (status=ACTIVE, health=UNKNOWN).
   * 5. Perform an initial connection validation ping.
   * 6. Update health status to HEALTHY or UNHEALTHY based on ping result.
   */
  async registerShard(
    projectId: string | ObjectId,
    ownerId: string | ObjectId,
    input: RegisterShardInput
  ): Promise<Shard> {
    // 1. Verify project ownership
    const project = await this.projectService.getProjectById(projectId, ownerId);

    if (project.status !== 'ACTIVE') {
      throw new ForbiddenError(
        'Cannot register shards for a disabled project',
        ErrorCode.PROJECT_DISABLED
      );
    }

    const trimmedName = input.name.trim();

    // 2. Enforce shard name uniqueness within project
    const existing = await this.shardRepository.findByProjectIdAndName(projectId, trimmedName);
    if (existing) {
      throw new ConflictError(
        `A shard named "${trimmedName}" already exists in this project`,
        ErrorCode.SHARD_ALREADY_EXISTS
      );
    }

    // 3. Encrypt the connection URI before storing
    const encryptedConnectionUri = encryptConnectionUri(input.connectionUri);

    // 4. Persist the shard (health starts as UNKNOWN)
    const shard = await this.shardRepository.create({
      projectId,
      name: trimmedName,
      encryptedConnectionUri,
    });

    // 5 & 6. Validate the connection — update health based on result
    try {
      await connectionManager.ping(shard);
      return (
        (await this.shardRepository.updateHealth(
          shard._id,
          ShardHealthStatus.HEALTHY
        )) ?? shard
      );
    } catch {
      // Connection failed — mark UNHEALTHY but still return the shard record.
      // The shard is registered; health monitoring will retry later.
      return (
        (await this.shardRepository.updateHealth(
          shard._id,
          ShardHealthStatus.UNHEALTHY
        )) ?? shard
      );
    }
  }

  /**
   * Returns all shards for a project (verifying project ownership).
   */
  async listShards(
    projectId: string | ObjectId,
    ownerId: string | ObjectId
  ): Promise<Shard[]> {
    await this.projectService.getProjectById(projectId, ownerId);
    return this.shardRepository.findByProjectId(projectId);
  }

  /**
   * Returns a specific shard by ID (verifying project ownership).
   */
  async getShardById(
    projectId: string | ObjectId,
    shardId: string | ObjectId,
    ownerId: string | ObjectId
  ): Promise<Shard> {
    await this.projectService.getProjectById(projectId, ownerId);

    const shard = await this.shardRepository.findByIdAndProjectId(shardId, projectId);
    if (!shard) {
      throw new NotFoundError('Shard not found', ErrorCode.SHARD_NOT_FOUND);
    }

    return shard;
  }

  /**
   * Updates shard name and/or re-encrypts a new connection URI.
   * If connectionUri is updated, invalidates the existing connection pool
   * so the next request creates a fresh connection with the new credentials.
   */
  async updateShard(
    projectId: string | ObjectId,
    shardId: string | ObjectId,
    ownerId: string | ObjectId,
    input: UpdateShardInput
  ): Promise<Shard> {
    const shard = await this.getShardById(projectId, shardId, ownerId);

    const updateData: {
      name?: string;
      encryptedConnectionUri?: string;
      healthStatus?: ShardHealthStatus;
    } = {};

    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      // Check uniqueness only if name is actually changing
      if (trimmedName !== shard.name) {
        const conflict = await this.shardRepository.findByProjectIdAndName(
          projectId,
          trimmedName
        );
        if (conflict) {
          throw new ConflictError(
            `A shard named "${trimmedName}" already exists in this project`,
            ErrorCode.SHARD_ALREADY_EXISTS
          );
        }
        updateData.name = trimmedName;
      }
    }

    if (input.connectionUri !== undefined) {
      updateData.encryptedConnectionUri = encryptConnectionUri(input.connectionUri);
      updateData.healthStatus = ShardHealthStatus.UNKNOWN;

      // Close the old pool so next request creates a fresh connection
      await connectionManager.closeConnection(shard._id.toString());
    }

    if (Object.keys(updateData).length === 0) {
      return shard; // Nothing to update
    }

    const updated = await this.shardRepository.updateByIdAndProjectId(
      shardId,
      projectId,
      updateData
    );

    if (!updated) {
      throw new NotFoundError('Shard not found', ErrorCode.SHARD_NOT_FOUND);
    }

    // If connection URI changed, re-validate the new connection
    if (input.connectionUri !== undefined) {
      try {
        await connectionManager.ping(updated);
        return (
          (await this.shardRepository.updateHealth(
            updated._id,
            ShardHealthStatus.HEALTHY
          )) ?? updated
        );
      } catch {
        return (
          (await this.shardRepository.updateHealth(
            updated._id,
            ShardHealthStatus.UNHEALTHY
          )) ?? updated
        );
      }
    }

    return updated;
  }

  /**
   * Disables a shard (soft-delete — does NOT migrate tenant data).
   *
   * Architecture note (docs/architecture.md §ADR-006):
   * Disabling a shard does not automatically reroute tenants mapped to it.
   * Any active tenant mappings will begin failing until the admin remaps them.
   */
  async disableShard(
    projectId: string | ObjectId,
    shardId: string | ObjectId,
    ownerId: string | ObjectId
  ): Promise<Shard> {
    await this.getShardById(projectId, shardId, ownerId);

    const disabled = await this.shardRepository.disable(shardId, projectId);
    if (!disabled) {
      throw new NotFoundError('Shard not found', ErrorCode.SHARD_NOT_FOUND);
    }

    // Close the connection pool for the disabled shard
    await connectionManager.closeConnection(shardId.toString());

    return disabled;
  }
}
