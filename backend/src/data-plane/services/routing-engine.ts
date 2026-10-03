import { ObjectId } from 'mongodb';

import { ErrorCode } from '../../errors/codes.js';
import { NotFoundError, ServiceUnavailableError, BadRequestError } from '../../errors/app-error.js';
import {
  TenantMappingRepository,
  ShardRepository,
  RoutingConfigRepository,
  ShardStatus,
  ShardHealthStatus,
  type Shard,
} from '../../control-plane/index.js';

export class RoutingEngine {
  private readonly tenantMappingRepository: TenantMappingRepository;
  private readonly shardRepository: ShardRepository;
  private readonly routingConfigRepository: RoutingConfigRepository;

  constructor(
    tenantMappingRepository?: TenantMappingRepository,
    shardRepository?: ShardRepository,
    routingConfigRepository?: RoutingConfigRepository
  ) {
    this.tenantMappingRepository = tenantMappingRepository ?? new TenantMappingRepository();
    this.shardRepository = shardRepository ?? new ShardRepository();
    this.routingConfigRepository = routingConfigRepository ?? new RoutingConfigRepository();
  }

  /**
   * Resolves the target active database shard for a request given a projectId and tenantId.
   *
   * Flow (docs/architecture.md §14):
   * 1. Retrieve project routing configuration (defaults to TENANT_BASED)
   * 2. Query tenant-to-shard mapping
   * 3. Fetch shard metadata and verify active operational status and health state
   */
  async resolveShard(projectId: string | ObjectId, tenantId: string): Promise<Shard> {
    // 1. Verify routing strategy configuration
    const config = await this.routingConfigRepository.findByProjectId(projectId);
    if (config && config.strategy !== 'TENANT_BASED') {
      throw new BadRequestError(
        `Unsupported routing strategy: "${config.strategy}"`,
        ErrorCode.ROUTING_STRATEGY_NOT_SUPPORTED
      );
    }

    // 2. Resolve tenant mapping
    const mapping = await this.tenantMappingRepository.findByProjectAndTenant(
      projectId,
      tenantId
    );

    if (!mapping) {
      throw new NotFoundError(
        `Tenant "${tenantId}" has no active shard mapping`,
        ErrorCode.TENANT_MAPPING_NOT_FOUND
      );
    }

    // 3. Resolve target shard metadata
    const shard = await this.shardRepository.findByIdAndProjectId(
      mapping.shardId,
      projectId
    );

    if (!shard) {
      throw new NotFoundError(
        `Mapped shard not found for tenant "${tenantId}"`,
        ErrorCode.SHARD_NOT_FOUND
      );
    }

    if (shard.status !== ShardStatus.ACTIVE) {
      throw new ServiceUnavailableError(
        `Mapped shard "${shard.name}" is currently disabled`,
        ErrorCode.SHARD_UNAVAILABLE
      );
    }

    if (shard.healthStatus === ShardHealthStatus.UNHEALTHY) {
      throw new ServiceUnavailableError(
        `Mapped shard "${shard.name}" is currently unhealthy`,
        ErrorCode.MAPPED_SHARD_UNAVAILABLE
      );
    }

    return shard;
  }
}
