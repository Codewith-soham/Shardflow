import { describe, it, expect, vi } from 'vitest';
import { ObjectId } from 'mongodb';

import { buildApp } from '../../app.js';
import type { AppConfig } from '../../config/index.js';
import { UserStatus, type User } from '../models/user.model.js';
import { AuthService } from '../../auth/auth.service.js';

describe('Current User Endpoint (GET /api/v1/me) — Task 2.4', () => {
  const testConfig: AppConfig = {
    port: 3000,
    host: '127.0.0.1',
    nodeEnv: 'test',
    mongodbUri: 'mongodb://localhost:27017',
    mongodbDatabase: 'shardflow_test',
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-anon-key',
  };

  it('returns 401 AUTHENTICATION_REQUIRED if Authorization header is missing', async () => {
    const app = await buildApp(testConfig);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('AUTHENTICATION_REQUIRED');

    await app.close();
  });

  it('returns 401 INVALID_AUTH_TOKEN if token format is not Bearer', async () => {
    const app = await buildApp(testConfig);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: {
        authorization: 'InvalidFormat xyz',
      },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_AUTH_TOKEN');

    await app.close();
  });

  it('returns 200 and user profile data on valid authenticated request', async () => {
    const mockUser: User = {
      _id: new ObjectId('65123456789abcdef0123456'),
      supabaseUserId: 'sb_user_abc_123',
      email: 'alex@example.com',
      name: 'Alex Doe',
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockAuthService = {
      authenticateAndSyncUser: vi.fn().mockResolvedValue({
        user: mockUser,
        supabaseUser: { id: 'sb_user_abc_123', email: 'alex@example.com' },
      }),
    } as unknown as AuthService;

    const app = await buildApp(testConfig, { authService: mockAuthService });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: {
        authorization: 'Bearer valid_test_jwt',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toEqual({
      success: true,
      data: {
        id: '65123456789abcdef0123456',
        supabaseUserId: 'sb_user_abc_123',
        email: 'alex@example.com',
        name: 'Alex Doe',
      },
      message: 'User retrieved successfully',
    });

    expect(mockAuthService.authenticateAndSyncUser).toHaveBeenCalledWith('valid_test_jwt');

    await app.close();
  });
});
