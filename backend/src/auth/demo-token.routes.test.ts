import { describe, it, expect, vi, beforeEach } from 'vitest';

import { buildApp } from '../app.js';
import type { AppConfig } from '../config/index.js';
import { ErrorCode } from '../errors/codes.js';
import type { UserRepository } from '../control-plane/repositories/user.repository.js';
import { AuthService } from './auth.service.js';

const testConfig: AppConfig = {
  port: 3000,
  host: '127.0.0.1',
  nodeEnv: 'test',
  mongodbUri: 'mongodb://localhost:27017',
  mongodbDatabase: 'shardflow_test',
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key',
};

const demoToken = `demo_x_${Buffer.from('attacker@example.com').toString('base64')}`;

describe('demo_ bearer tokens are rejected on every route (no auth bypass)', () => {
  const getUser = vi.fn();
  const userRepo = { findBySupabaseUserId: vi.fn(), create: vi.fn() };
  const apiKeyRepo = { findByKeyHash: vi.fn(), updateLastUsedAt: vi.fn() };
  const projectRepo = { findById: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid JWT') });
    apiKeyRepo.findByKeyHash.mockResolvedValue(null);
  });

  const build = () =>
    buildApp(testConfig, {
      authService: new AuthService({
        userRepository: userRepo as unknown as UserRepository,
        supabaseAuth: { getUser },
      }),
      dataPlaneAuthOptions: {
        apiKeyRepository: apiKeyRepo as any,
        projectRepository: projectRepo as any,
      },
    });

  it.each([
    ['GET', '/api/v1/me'],
    ['GET', '/api/v1/projects'],
    ['GET', '/api/v1/projects/65123456789abcdef0123456/health'],
  ])('control plane %s %s returns 401', async (method, url) => {
    const app = await build();
    const res = await app.inject({
      method: method as 'GET',
      url,
      headers: { authorization: `Bearer ${demoToken}` },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe(ErrorCode.INVALID_AUTH_TOKEN);
    expect(getUser).toHaveBeenCalledWith(demoToken);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('data plane rejects a demo_ bearer token (no API key) with 401', async () => {
    const app = await build();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/data',
      headers: { authorization: `Bearer ${demoToken}` },
      payload: { tenantId: 't1', operation: 'find', collection: 'users' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe(ErrorCode.AUTHENTICATION_REQUIRED);
  });

  it('data plane rejects a demo_ value sent as X-API-Key with 401', async () => {
    const app = await build();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/data',
      headers: { 'x-api-key': demoToken },
      payload: { tenantId: 't1', operation: 'find', collection: 'users' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe(ErrorCode.INVALID_API_KEY);
  });
});
