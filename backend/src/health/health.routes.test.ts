import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObjectId } from 'mongodb';

import { buildApp } from '../app.js';
import type { AppConfig } from '../config/index.js';
import { ShardStatus, ShardHealthStatus } from '../control-plane/models/shard.model.js';
import { UnauthorizedError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/codes.js';

const mockConfig: AppConfig = {
  port: 3000,
  host: '127.0.0.1',
  nodeEnv: 'test',
  mongodbUri: 'mongodb://localhost:27017',
  mongodbDatabase: 'shardflow_test',
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key',
};

describe('Health Routes — GET /api/v1/projects/:projectId/health (Task 3.8 & Task 6.8)', () => {
  const userId = new ObjectId();
  const projectId = new ObjectId();
  const shardId = new ObjectId();

  const user = {
    _id: userId,
    email: 'dev@shardflow.io',
    supabaseUid: 'sub_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let mockAuthService: any;
  let mockHealthService: any;

  beforeEach(() => {
    mockAuthService = {
      authenticateAndSyncUser: vi.fn(async (token: string) => {
        if (token === 'valid_token') {
          return { user, supabaseUser: { id: 'sub_123', email: user.email } };
        }
        throw new UnauthorizedError('Invalid authentication token', ErrorCode.INVALID_AUTH_TOKEN);
      }),
    };

    mockHealthService = {
      getProjectHealth: vi.fn(async (pId: string, uId: ObjectId) => {
        if (pId === projectId.toString() && uId.toString() === userId.toString()) {
          return {
            shards: [
              {
                shardId: shardId.toString(),
                status: ShardStatus.ACTIVE,
                healthStatus: ShardHealthStatus.HEALTHY,
                lastHealthCheckAt: '2026-09-21T00:00:00.000Z',
              },
            ],
          };
        }
        throw new Error('Not found or unauthorized');
      }),
    };
  });

  it('rejects unauthenticated request with 401', async () => {
    const app = await buildApp(mockConfig, {
      authService: mockAuthService,
      healthService: mockHealthService,
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId.toString()}/health`,
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('returns project shard health summary with 200 for authenticated owner', async () => {
    const app = await buildApp(mockConfig, {
      authService: mockAuthService,
      healthService: mockHealthService,
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId.toString()}/health`,
      headers: {
        authorization: 'Bearer valid_token',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.shards).toHaveLength(1);
    expect(body.data.shards[0].shardId).toBe(shardId.toString());
    expect(body.data.shards[0].healthStatus).toBe('HEALTHY');
    expect(body.message).toBe('Shard health retrieved successfully');
  });

  it('returns 400 for invalid project ID format', async () => {
    const app = await buildApp(mockConfig, {
      authService: mockAuthService,
      healthService: mockHealthService,
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/invalid-id/health',
      headers: {
        authorization: 'Bearer valid_token',
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('INVALID_PROJECT_ID');
  });
});
