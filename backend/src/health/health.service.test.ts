import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';

import { ShardStatus, ShardHealthStatus, type Shard } from '../control-plane/models/shard.model.js';
import { HealthEventStatus } from '../control-plane/models/health-event.model.js';
import { HealthService } from './health.service.js';

describe('HealthService (Tasks 6.3, 6.4, 6.5, 6.7)', () => {
  const projectId = new ObjectId();
  const userId = new ObjectId();
  const shardId = new ObjectId();

  const shard: Shard = {
    _id: shardId,
    projectId,
    name: 'Primary Shard',
    encryptedConnectionUri: 'encrypted_uri',
    status: ShardStatus.ACTIVE,
    healthStatus: ShardHealthStatus.HEALTHY,
    lastHealthCheckAt: null,
    lastSuccessfulHealthCheckAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let mockShardRepo: any;
  let mockHealthEventRepo: any;
  let mockProjectRepo: any;
  let mockUserRepo: any;
  let mockHealthChecker: any;
  let mockNotificationService: any;

  beforeEach(() => {
    mockShardRepo = {
      updateHealth: vi.fn(async (id, healthStatus, checkedAt) => ({
        ...shard,
        healthStatus,
        lastHealthCheckAt: checkedAt,
      })),
      findByProjectId: vi.fn(async () => [shard]),
    };

    mockHealthEventRepo = {
      create: vi.fn(async (data) => ({
        _id: new ObjectId(),
        ...data,
        createdAt: new Date(),
      })),
    };

    mockProjectRepo = {
      findById: vi.fn(async () => ({
        _id: projectId,
        ownerId: userId,
        name: 'Test Project',
      })),
    };

    mockUserRepo = {
      findById: vi.fn(async () => ({
        _id: userId,
        email: 'owner@example.com',
      })),
    };

    mockHealthChecker = {
      checkShard: vi.fn().mockResolvedValue({
        status: ShardHealthStatus.HEALTHY,
        latencyMs: 30,
        checkedAt: new Date(),
        error: null,
      }),
    };

    mockNotificationService = {
      notifyShardUnhealthy: vi.fn().mockResolvedValue(true),
      notifyShardRecovered: vi.fn().mockResolvedValue(true),
    };
  });

  it('detects failure when shard transitions to UNHEALTHY and dispatches alert notification', async () => {
    mockHealthChecker.checkShard.mockResolvedValueOnce({
      status: ShardHealthStatus.UNHEALTHY,
      latencyMs: 0,
      checkedAt: new Date(),
      error: { code: 'SHARD_HEALTH_CHECK_FAILED', message: 'Connection refused' },
    });

    const service = new HealthService(
      mockShardRepo,
      mockHealthEventRepo,
      mockProjectRepo,
      mockUserRepo,
      mockHealthChecker,
      mockNotificationService
    );

    const healthyShard = { ...shard, healthStatus: ShardHealthStatus.HEALTHY };
    const { shard: resultShard, event } = await service.checkShardHealth(healthyShard, 'admin@test.com');

    expect(resultShard.healthStatus).toBe(ShardHealthStatus.UNHEALTHY);
    expect(mockHealthEventRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HealthEventStatus.SHARD_UNHEALTHY,
      })
    );
    expect(mockNotificationService.notifyShardUnhealthy).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'admin@test.com',
        shardName: 'Primary Shard',
      })
    );
  });

  it('detects recovery when previously UNHEALTHY shard becomes HEALTHY and dispatches recovery notification', async () => {
    mockHealthChecker.checkShard.mockResolvedValueOnce({
      status: ShardHealthStatus.HEALTHY,
      latencyMs: 45,
      checkedAt: new Date(),
      error: null,
    });

    const service = new HealthService(
      mockShardRepo,
      mockHealthEventRepo,
      mockProjectRepo,
      mockUserRepo,
      mockHealthChecker,
      mockNotificationService
    );

    const unhealthyShard = { ...shard, healthStatus: ShardHealthStatus.UNHEALTHY };
    const { shard: resultShard } = await service.checkShardHealth(unhealthyShard, 'admin@test.com');

    expect(resultShard.healthStatus).toBe(ShardHealthStatus.HEALTHY);
    expect(mockHealthEventRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HealthEventStatus.SHARD_RECOVERED,
      })
    );
    expect(mockNotificationService.notifyShardRecovered).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'admin@test.com',
        shardName: 'Primary Shard',
      })
    );
  });

  it('returns project health list for owner via getProjectHealth', async () => {
    const service = new HealthService(
      mockShardRepo,
      mockHealthEventRepo,
      mockProjectRepo,
      mockUserRepo,
      mockHealthChecker,
      mockNotificationService
    );

    const res = await service.getProjectHealth(projectId, userId);

    expect(res.shards).toHaveLength(1);
    expect(res.shards[0]?.shardId).toBe(shardId.toString());
    expect(res.shards[0]?.healthStatus).toBe(ShardHealthStatus.HEALTHY);
  });
});
