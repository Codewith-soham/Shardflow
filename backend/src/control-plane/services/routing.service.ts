import { ObjectId } from 'mongodb';

import { ErrorCode } from '../../errors/codes.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ServiceUnavailableError,
} from '../../errors/app-error.js';
import type { TenantMapping, CreateTenantMappingInput } from '../models/tenant-mapping.model.js';
import type { RoutingConfig, RoutingStrategy } from '../models/routing-config.model.js';
import { TenantMappingRepository } from '../repositories/tenant-mapping.repository.js';
import { RoutingConfigRepository } from '../repositories/routing-config.repository.js';
import { ShardRepository } from '../repositories/shard.repository.js';
import { ShardStatus } from '../models/shard.model.js';
import { ProjectService } from './project.service.js';

export interface UpdateTenantMappingInput {
  shardId: string;
}

export class RoutingService {
  private readonly tenantMappingRepository: TenantMappingRepository;
  private readonly routingConfigRepository: RoutingConfigRepository;
  private readonly shardRepository: ShardRepository;
  private readonly projectService: ProjectService;

  constructor(
    tenantMappingRepository?: TenantMappingRepository,
    routingConfigRepository?: RoutingConfigRepository,
    shardRepository?: ShardRepository,
    projectService?: ProjectService
  ) {
    this.tenantMappingRepository = tenantMappingRepository ?? new TenantMappingRepository();
    this.routingConfigRepository = routingConfigRepository ?? new RoutingConfigRepository();
    this.shardRepository = shardRepository ?? new ShardRepository();
    this.projectService = projectService ?? new ProjectService();
  }

  // ─── Tenant Mapping Operations ─────────────────────────────────────────────

  /**
   * Creates a new tenant-to-shard mapping.
   * Enforces project ownership, unique tenant mapping per project, and active shard validation.
   */
  async createTenantMapping(
    projectId: string | ObjectId,
    ownerId: string | ObjectId,
    input: CreateTenantMappingInput
  ): Promise<TenantMapping> {
    // 1. Verify project ownership
    await this.projectService.getProjectById(projectId, ownerId);

    // 2. Verify target shard exists and belongs to this project
    const shard = await this.shardRepository.findByIdAndProjectId(input.shardId, projectId);
    if (!shard) {
      throw new NotFoundError('Target shard not found in project', ErrorCode.SHARD_NOT_FOUND);
    }
    if (shard.status !== ShardStatus.ACTIVE) {
      throw new ServiceUnavailableError('Target shard is currently disabled', ErrorCode.SHARD_DISABLED);
    }

    // 3. Check for existing mapping for this tenant
    const existing = await this.tenantMappingRepository.findByProjectAndTenant(
      projectId,
      input.tenantId
    );
    if (existing) {
      throw new ConflictError(
        `Tenant "${input.tenantId}" is already mapped to a shard in this project`,
        ErrorCode.TENANT_MAPPING_ALREADY_EXISTS
      );
    }

    // 4. Create mapping
    return this.tenantMappingRepository.create({
      projectId,
      tenantId: input.tenantId,
      shardId: input.shardId,
    });
  }

  /**
   * Lists all tenant mappings belonging to a project.
   */
  async listTenantMappings(
    projectId: string | ObjectId,
    ownerId: string | ObjectId
  ): Promise<TenantMapping[]> {
    await this.projectService.getProjectById(projectId, ownerId);
    return this.tenantMappingRepository.findByProjectId(projectId);
  }

  /**
   * Gets a specific tenant mapping by ID.
   */
  async getTenantMapping(
    projectId: string | ObjectId,
    mappingId: string | ObjectId,
    ownerId: string | ObjectId
  ): Promise<TenantMapping> {
    await this.projectService.getProjectById(projectId, ownerId);

    const mapping = await this.tenantMappingRepository.findById(mappingId);
    if (!mapping || mapping.projectId.toString() !== projectId.toString()) {
      throw new NotFoundError('Tenant mapping not found', ErrorCode.TENANT_MAPPING_NOT_FOUND);
    }

    return mapping;
  }

  /**
   * Updates the target shard for an existing tenant mapping.
   */
  async updateTenantMapping(
    projectId: string | ObjectId,
    mappingId: string | ObjectId,
    ownerId: string | ObjectId,
    input: UpdateTenantMappingInput
  ): Promise<TenantMapping> {
    const existing = await this.getTenantMapping(projectId, mappingId, ownerId);

    // Verify new shard exists and is active
    const shard = await this.shardRepository.findByIdAndProjectId(input.shardId, projectId);
    if (!shard) {
      throw new NotFoundError('Target shard not found in project', ErrorCode.SHARD_NOT_FOUND);
    }
    if (shard.status !== ShardStatus.ACTIVE) {
      throw new ServiceUnavailableError('Target shard is currently disabled', ErrorCode.SHARD_DISABLED);
    }

    const updated = await this.tenantMappingRepository.updateShard(existing._id, input.shardId);
    if (!updated) {
      throw new NotFoundError('Tenant mapping not found', ErrorCode.TENANT_MAPPING_NOT_FOUND);
    }

    return updated;
  }

  /**
   * Deletes a tenant mapping.
   */
  async deleteTenantMapping(
    projectId: string | ObjectId,
    mappingId: string | ObjectId,
    ownerId: string | ObjectId
  ): Promise<boolean> {
    await this.getTenantMapping(projectId, mappingId, ownerId);
    return this.tenantMappingRepository.delete(mappingId);
  }

  // ─── Routing Configuration Operations ─────────────────────────────────────

  /**
   * Retrieves the active routing strategy for a project.
   */
  async getRoutingConfig(
    projectId: string | ObjectId,
    ownerId: string | ObjectId
  ): Promise<RoutingConfig> {
    await this.projectService.getProjectById(projectId, ownerId);

    const config = await this.routingConfigRepository.findByProjectId(projectId);
    if (config) {
      return config;
    }

    // Return default TENANT_BASED config
    return this.routingConfigRepository.upsert({
      projectId,
      strategy: 'TENANT_BASED',
      routingKey: 'tenantId',
    });
  }

  /**
   * Updates the routing configuration for a project.
   */
  async updateRoutingConfig(
    projectId: string | ObjectId,
    ownerId: string | ObjectId,
    strategy: RoutingStrategy
  ): Promise<RoutingConfig> {
    await this.projectService.getProjectById(projectId, ownerId);

    if (strategy !== 'TENANT_BASED') {
      throw new BadRequestError(
        `Routing strategy "${strategy}" is not supported in V1`,
        ErrorCode.ROUTING_STRATEGY_NOT_SUPPORTED
      );
    }

    return this.routingConfigRepository.upsert({
      projectId,
      strategy: 'TENANT_BASED',
      routingKey: 'tenantId',
    });
  }
}
