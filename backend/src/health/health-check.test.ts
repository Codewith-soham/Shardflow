import { describe, it, expect, vi } from 'vitest';
import { ObjectId } from 'mongodb';

import { ShardStatus, ShardHealthStatus, type Shard } from '../control-plane/models/shard.model.js';
import { ShardHealthChecker, DEGRADED_LATENCY_THRESHOLD_MS } from './health-check.js';

describe('ShardHealthChecker (Task 6.1 & 6.2)', () => {
  const dummyShard: Shard = {
    _id: new ObjectId(),
    projectId: new ObjectId(),
    name: 'Test Shard',
    encryptedConnectionUri: 'encrypted_uri',
    status: ShardStatus.ACTIVE,
    healthStatus: ShardHealthStatus.UNKNOWN,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('returns HEALTHY status when ping succeeds with normal latency', async () => {
    const mockConnManager = {
      ping: vi.fn().mockResolvedValue(50),
    } as any;

    const checker = new ShardHealthChecker(mockConnManager);
    const result = await checker.checkShard(dummyShard);

    expect(result.status).toBe(ShardHealthStatus.HEALTHY);
    expect(result.latencyMs).toBe(50);
    expect(result.error).toBeNull();
  });

  it('returns DEGRADED status when ping latency exceeds threshold', async () => {
    const mockConnManager = {
      ping: vi.fn().mockResolvedValue(DEGRADED_LATENCY_THRESHOLD_MS + 100),
    } as any;

    const checker = new ShardHealthChecker(mockConnManager);
    const result = await checker.checkShard(dummyShard);

    expect(result.status).toBe(ShardHealthStatus.DEGRADED);
    expect(result.latencyMs).toBe(DEGRADED_LATENCY_THRESHOLD_MS + 100);
    expect(result.error).toBeNull();
  });

  it('returns UNHEALTHY status and sanitized error when ping fails', async () => {
    const mockConnManager = {
      ping: vi.fn().mockRejectedValue(new Error('Failed connection to mongodb://admin:secret123@shard1.local:27017/db')),
    } as any;

    const checker = new ShardHealthChecker(mockConnManager);
    const result = await checker.checkShard(dummyShard);

    expect(result.status).toBe(ShardHealthStatus.UNHEALTHY);
    expect(result.latencyMs).toBe(0);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('SHARD_HEALTH_CHECK_FAILED');
    expect(result.error?.message).not.toContain('secret123');
    expect(result.error?.message).toContain('[REDACTED_URI]');
  });
});
