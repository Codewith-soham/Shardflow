import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';

import { ErrorCode } from '../../errors/codes.js';
import { ShardStatus, ShardHealthStatus, type Shard } from '../../control-plane/models/shard.model.js';
import type { TenantMapping } from '../../control-plane/models/tenant-mapping.model.js';
import type { RoutingConfig } from '../../control-plane/models/routing-config.model.js';
import { RoutingEngine } from './routing-engine.js';

describe('RoutingEngine (Tasks 5.1, 5.2, 5.5, 5.6, 5.8)', () => {
  const projectId = new ObjectId();
  const shardId = new ObjectId();
  const tenantId = 'tenant_globex';

  const shard: Shard = {
    _id: shardId,
    projectId,
    name: 'Globex Shard',
    encryptedConnectionUri: 'encrypted_uri',
    status: ShardStatus.ACTIVE,
    healthStatus: ShardHealthStatus.HEALTHY,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tenantMapping: TenantMapping = {
    _id: new ObjectId(),
    projectId,
    tenantId,
    shardId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const routingConfig: RoutingConfig = {
    _id: new ObjectId(),
    projectId,
    strategy: 'TENANT_BASED',
    routingKey: 'tenantId',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let mockTenantMappingRepo: any;
  let mockShardRepo: any;
  let mockRoutingConfigRepo: any;

  beforeEach(() => {
    mockTenantMappingRepo = {
      findByProjectAndTenant: async (pId: any, tId: string) => {
        if (pId.toString() === projectId.toString() && tId === tenantId) {
          return tenantMapping;
        }
        return null;
      },
    };

    mockShardRepo = {
      findByIdAndProjectId: async (sId: any, pId: any) => {
        if (sId.toString() === shardId.toString() && pId.toString() === projectId.toString()) {
          return shard;
        }
        return null;
      },
    };

    mockRoutingConfigRepo = {
      findByProjectId: async (pId: any) => {
        if (pId.toString() === projectId.toString()) {
          return routingConfig;
        }
        return null;
      },
    };
  });

  it('resolves active shard successfully for valid mapped tenant', async () => {
    const engine = new RoutingEngine(
      mockTenantMappingRepo,
      mockShardRepo,
      mockRoutingConfigRepo
    );

    const resolved = await engine.resolveShard(projectId, tenantId);
    expect(resolved._id.toString()).toBe(shardId.toString());
    expect(resolved.name).toBe('Globex Shard');
  });

  it('throws TENANT_MAPPING_NOT_FOUND when tenant has no active mapping', async () => {
    const engine = new RoutingEngine(
      mockTenantMappingRepo,
      mockShardRepo,
      mockRoutingConfigRepo
    );

    await expect(engine.resolveShard(projectId, 'unknown_tenant')).rejects.toThrow(
      /has no active shard mapping/i
    );
  });

  it('throws SHARD_UNAVAILABLE when mapped shard is disabled', async () => {
    const disabledShard = { ...shard, status: ShardStatus.DISABLED };
    mockShardRepo.findByIdAndProjectId = async () => disabledShard;

    const engine = new RoutingEngine(
      mockTenantMappingRepo,
      mockShardRepo,
      mockRoutingConfigRepo
    );

    await expect(engine.resolveShard(projectId, tenantId)).rejects.toThrow(
      /is currently disabled/i
    );
  });

  it('throws ROUTING_STRATEGY_NOT_SUPPORTED when routing config strategy is invalid', async () => {
    const invalidConfig = { ...routingConfig, strategy: 'INVALID_STRATEGY' as any };
    mockRoutingConfigRepo.findByProjectId = async () => invalidConfig;

    const engine = new RoutingEngine(
      mockTenantMappingRepo,
      mockShardRepo,
      mockRoutingConfigRepo
    );

    await expect(engine.resolveShard(projectId, tenantId)).rejects.toThrow(
      /Unsupported routing strategy/i
    );
  });
});
