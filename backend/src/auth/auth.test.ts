import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';

import { ErrorCode } from '../errors/codes.js';
import { UnauthorizedError, ForbiddenError, ServiceUnavailableError } from '../errors/app-error.js';
import { UserStatus, type User } from '../control-plane/models/user.model.js';
import { UserRepository } from '../control-plane/repositories/user.repository.js';
import { verifySupabaseToken, type SupabaseAuthClient } from './supabase.client.js';
import { AuthService } from './auth.service.js';
import { createAuthMiddleware } from './auth.middleware.js';

describe('Supabase Client & Token Verification (Task 2.1)', () => {
  it('throws UnauthorizedError if token is empty', async () => {
    const mockSupabase: SupabaseAuthClient = {
      getUser: vi.fn(),
    };

    await expect(verifySupabaseToken(mockSupabase, '')).rejects.toThrow(UnauthorizedError);
    await expect(verifySupabaseToken(mockSupabase, '   ')).rejects.toThrow(UnauthorizedError);
    expect(mockSupabase.getUser).not.toHaveBeenCalled();
  });

  it('returns the user when token is valid', async () => {
    const mockUser = { id: 'sb_123', email: 'test@example.com', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' };
    const mockSupabase: SupabaseAuthClient = {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    };

    const user = await verifySupabaseToken(mockSupabase, 'valid-token');
    expect(user).toEqual(mockUser);
    expect(mockSupabase.getUser).toHaveBeenCalledWith('valid-token');
  });

  it('throws AUTH_TOKEN_EXPIRED when Supabase indicates token expired', async () => {
    const mockSupabase: SupabaseAuthClient = {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('JWT expired') }),
    };

    await expect(verifySupabaseToken(mockSupabase, 'expired-token')).rejects.toMatchObject({
      code: ErrorCode.AUTH_TOKEN_EXPIRED,
      statusCode: 401,
    });
  });

  it('throws INVALID_AUTH_TOKEN when Supabase indicates invalid token', async () => {
    const mockSupabase: SupabaseAuthClient = {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Invalid signature') }),
    };

    await expect(verifySupabaseToken(mockSupabase, 'bad-token')).rejects.toMatchObject({
      code: ErrorCode.INVALID_AUTH_TOKEN,
      statusCode: 401,
    });
  });

  it('throws AUTH_PROVIDER_UNAVAILABLE when Supabase client encounters network error', async () => {
    const mockSupabase: SupabaseAuthClient = {
      getUser: vi.fn().mockRejectedValue(new Error('Network connection timeout')),
    };

    await expect(verifySupabaseToken(mockSupabase, 'token')).rejects.toMatchObject({
      code: ErrorCode.AUTH_PROVIDER_UNAVAILABLE,
      statusCode: 503,
    });
  });
});

describe('AuthService & User Synchronization (Task 2.3)', () => {
  let mockUserRepo: Partial<UserRepository>;
  let mockSupabase: SupabaseAuthClient;

  beforeEach(() => {
    mockUserRepo = {
      findBySupabaseUserId: vi.fn(),
      create: vi.fn(),
    };
    mockSupabase = {
      getUser: vi.fn(),
    };
  });

  it('creates and returns a new user when not found in database (JIT sync)', async () => {
    const mockSupabaseUser = {
      id: 'sb_new_123',
      email: 'newuser@example.com',
      user_metadata: { full_name: 'New User' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: '',
    };
    mockSupabase.getUser = vi.fn().mockResolvedValue({ data: { user: mockSupabaseUser }, error: null });
    (mockUserRepo.findBySupabaseUserId as any).mockResolvedValue(null);

    const createdDbUser: User = {
      _id: 'db_obj_id' as any,
      supabaseUserId: 'sb_new_123',
      email: 'newuser@example.com',
      name: 'New User',
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (mockUserRepo.create as any).mockResolvedValue(createdDbUser);

    const authService = new AuthService({
      userRepository: mockUserRepo as UserRepository,
      supabaseAuth: mockSupabase,
    });

    const result = await authService.authenticateAndSyncUser('valid-jwt');

    expect(result.user).toEqual(createdDbUser);
    expect(result.supabaseUser).toEqual(mockSupabaseUser);
    expect(mockUserRepo.findBySupabaseUserId).toHaveBeenCalledWith('sb_new_123');
    expect(mockUserRepo.create).toHaveBeenCalledWith({
      supabaseUserId: 'sb_new_123',
      email: 'newuser@example.com',
      name: 'New User',
      status: UserStatus.ACTIVE,
    });
  });

  it('returns existing user without creating a duplicate', async () => {
    const mockSupabaseUser = {
      id: 'sb_existing_123',
      email: 'existing@example.com',
      user_metadata: {},
      app_metadata: {},
      aud: 'authenticated',
      created_at: '',
    };
    mockSupabase.getUser = vi.fn().mockResolvedValue({ data: { user: mockSupabaseUser }, error: null });

    const existingUser: User = {
      _id: 'db_obj_id' as any,
      supabaseUserId: 'sb_existing_123',
      email: 'existing@example.com',
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (mockUserRepo.findBySupabaseUserId as any).mockResolvedValue(existingUser);

    const authService = new AuthService({
      userRepository: mockUserRepo as UserRepository,
      supabaseAuth: mockSupabase,
    });

    const result = await authService.authenticateAndSyncUser('valid-jwt');

    expect(result.user).toEqual(existingUser);
    expect(mockUserRepo.create).not.toHaveBeenCalled();
  });

  it('throws ForbiddenError if user status is DISABLED', async () => {
    const mockSupabaseUser = {
      id: 'sb_disabled_123',
      email: 'disabled@example.com',
      user_metadata: {},
      app_metadata: {},
      aud: 'authenticated',
      created_at: '',
    };
    mockSupabase.getUser = vi.fn().mockResolvedValue({ data: { user: mockSupabaseUser }, error: null });

    const disabledUser: User = {
      _id: 'db_obj_id' as any,
      supabaseUserId: 'sb_disabled_123',
      email: 'disabled@example.com',
      status: UserStatus.DISABLED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (mockUserRepo.findBySupabaseUserId as any).mockResolvedValue(disabledUser);

    const authService = new AuthService({
      userRepository: mockUserRepo as UserRepository,
      supabaseAuth: mockSupabase,
    });

    await expect(authService.authenticateAndSyncUser('valid-jwt')).rejects.toMatchObject({
      code: ErrorCode.ACCESS_DENIED,
      statusCode: 403,
    });
  });
});

describe('Authentication Middleware (Task 2.2)', () => {
  it('throws AUTHENTICATION_REQUIRED when Authorization header is missing', async () => {
    const mockAuthService = {
      authenticateAndSyncUser: vi.fn(),
    } as unknown as AuthService;

    const middleware = createAuthMiddleware(mockAuthService);
    const req = { headers: {} } as FastifyRequest;
    const reply = {} as FastifyReply;

    await expect(middleware(req, reply)).rejects.toMatchObject({
      code: ErrorCode.AUTHENTICATION_REQUIRED,
      statusCode: 401,
    });
  });

  it('throws INVALID_AUTH_TOKEN when header format is not Bearer <token>', async () => {
    const mockAuthService = {
      authenticateAndSyncUser: vi.fn(),
    } as unknown as AuthService;

    const middleware = createAuthMiddleware(mockAuthService);
    const reply = {} as FastifyReply;

    await expect(middleware({ headers: { authorization: 'Basic 12345' } } as FastifyRequest, reply)).rejects.toMatchObject({
      code: ErrorCode.INVALID_AUTH_TOKEN,
      statusCode: 401,
    });

    await expect(middleware({ headers: { authorization: 'Bearer' } } as FastifyRequest, reply)).rejects.toMatchObject({
      code: ErrorCode.INVALID_AUTH_TOKEN,
      statusCode: 401,
    });
  });

  it('populates request.user and request.supabaseUser upon valid token', async () => {
    const mockUser: User = {
      _id: 'db_obj_id' as any,
      supabaseUserId: 'sb_123',
      email: 'user@example.com',
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockSupabaseUser = { id: 'sb_123', email: 'user@example.com' } as any;

    const mockAuthService = {
      authenticateAndSyncUser: vi.fn().mockResolvedValue({ user: mockUser, supabaseUser: mockSupabaseUser }),
    } as unknown as AuthService;

    const middleware = createAuthMiddleware(mockAuthService);
    const req = { headers: { authorization: 'Bearer my-secret-jwt' } } as FastifyRequest;
    const reply = {} as FastifyReply;

    await middleware(req, reply);

    expect(req.user).toEqual(mockUser);
    expect(req.supabaseUser).toEqual(mockSupabaseUser);
    expect(mockAuthService.authenticateAndSyncUser).toHaveBeenCalledWith('my-secret-jwt');
  });
});
