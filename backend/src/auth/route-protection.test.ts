import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';

import { buildApp } from '../app.js';
import type { AppConfig } from '../config/index.js';
import { ErrorCode } from '../errors/codes.js';
import type { UserRepository } from '../control-plane/repositories/user.repository.js';
import { AuthService } from './auth.service.js';
import { PUBLIC_ROUTES, enforceRouteProtection } from './route-guard.js';

const testConfig: AppConfig = {
  port: 3000,
  host: '127.0.0.1',
  nodeEnv: 'test',
  mongodbUri: 'mongodb://localhost:27017',
  mongodbDatabase: 'shardflow_test',
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key',
};

const ID = '65123456789abcdef0123456';

/** Route inventory: every protected route and the credential scheme it expects. */
const CONTROL_PLANE_ROUTES: Array<[string, string]> = [
  ['GET', '/api/v1/me'],
  ['POST', '/api/v1/projects'],
  ['GET', '/api/v1/projects'],
  ['GET', `/api/v1/projects/${ID}`],
  ['PATCH', `/api/v1/projects/${ID}`],
  ['DELETE', `/api/v1/projects/${ID}`],
  ['POST', `/api/v1/projects/${ID}/api-keys`],
  ['GET', `/api/v1/projects/${ID}/api-keys`],
  ['DELETE', `/api/v1/projects/${ID}/api-keys/${ID}`],
  ['POST', `/api/v1/projects/${ID}/shards`],
  ['GET', `/api/v1/projects/${ID}/shards`],
  ['GET', `/api/v1/projects/${ID}/shards/${ID}`],
  ['PATCH', `/api/v1/projects/${ID}/shards/${ID}`],
  ['DELETE', `/api/v1/projects/${ID}/shards/${ID}`],
  ['GET', `/api/v1/projects/${ID}/routing`],
  ['PATCH', `/api/v1/projects/${ID}/routing`],
  ['POST', `/api/v1/projects/${ID}/tenant-mappings`],
  ['GET', `/api/v1/projects/${ID}/tenant-mappings`],
  ['GET', `/api/v1/projects/${ID}/tenant-mappings/${ID}`],
  ['PATCH', `/api/v1/projects/${ID}/tenant-mappings/${ID}`],
  ['DELETE', `/api/v1/projects/${ID}/tenant-mappings/${ID}`],
  ['GET', `/api/v1/projects/${ID}/health`],
];

describe('route protection (default deny)', () => {
  const getUser = vi.fn();
  const userRepo = { findBySupabaseUserId: vi.fn(), create: vi.fn() };
  const apiKeyRepo = { findByKeyHash: vi.fn(), updateLastUsed: vi.fn() };
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

  describe.each(CONTROL_PLANE_ROUTES)('control plane %s %s', (method, url) => {
    it('returns 401 AUTHENTICATION_REQUIRED with no credentials', async () => {
      const app = await build();
      const res = await app.inject({ method: method as 'GET', url, payload: {} });

      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe(ErrorCode.AUTHENTICATION_REQUIRED);
    });

    it('returns 401 INVALID_AUTH_TOKEN with an invalid bearer token', async () => {
      const app = await build();
      const res = await app.inject({
        method: method as 'GET',
        url,
        headers: { authorization: 'Bearer not-a-real-token' },
        payload: {},
      });

      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe(ErrorCode.INVALID_AUTH_TOKEN);
    });
  });

  describe('malformed and expired credentials are rejected on every control-plane route', () => {
    const malformedHeaders = [
      'Basic dXNlcjpwYXNz',
      'Bearer',
      'Bearer ',
      'Bearer two tokens',
      'token-without-scheme',
    ];

    it.each(CONTROL_PLANE_ROUTES)('%s %s', async (method, url) => {
      const app = await build();

      for (const authorization of malformedHeaders) {
        const res = await app.inject({
          method: method as 'GET',
          url,
          headers: { authorization },
          payload: {},
        });

        expect(res.statusCode, `Authorization: ${authorization}`).toBe(401);
        expect(res.json().error.code).toBe(ErrorCode.INVALID_AUTH_TOKEN);
      }

      getUser.mockResolvedValue({ data: { user: null }, error: new Error('JWT expired') });
      const expired = await app.inject({
        method: method as 'GET',
        url,
        headers: { authorization: 'Bearer expired-token' },
        payload: {},
      });

      expect(expired.statusCode).toBe(401);
      expect(expired.json().error.code).toBe(ErrorCode.AUTH_TOKEN_EXPIRED);
    });
  });

  describe('data plane POST /api/v1/data', () => {
    const payload = { tenantId: 't1', operation: 'find', collection: 'users' };

    it.each([[' '], ['   ']])('returns 401 for a blank API key %j', async (blank) => {
      const app = await build();
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/data',
        headers: { 'x-api-key': blank },
        payload,
      });

      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe(ErrorCode.AUTHENTICATION_REQUIRED);
    });

    it('returns 401 with no credentials', async () => {
      const app = await build();
      const res = await app.inject({ method: 'POST', url: '/api/v1/data', payload });

      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe(ErrorCode.AUTHENTICATION_REQUIRED);
    });

    it('returns 401 with an invalid API key', async () => {
      const app = await build();
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/data',
        headers: { 'x-api-key': 'sf_invalid' },
        payload,
      });

      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe(ErrorCode.INVALID_API_KEY);
    });
  });

  describe('public allowlist', () => {
    it('is exactly the reviewed set', () => {
      expect(PUBLIC_ROUTES.map((r) => `${r.method} ${r.url}`).sort()).toEqual([
        'GET /health',
        'POST /api/v1/auth/forgot-password',
        'POST /api/v1/auth/reset-password',
      ]);
    });

    it('GET /health is reachable without credentials', async () => {
      const app = await build();
      const res = await app.inject({ method: 'GET', url: '/health' });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('enforceRouteProtection', () => {
    it('refuses to register a route that has no auth guard and is not public', async () => {
      const app = Fastify();
      enforceRouteProtection(app);

      expect(() => app.get('/api/v1/forgotten', async () => ({ ok: true }))).toThrow(
        /Unprotected route GET \/api\/v1\/forgotten/
      );
    });

    it('refuses a route whose preHandler is not an auth guard', async () => {
      const app = Fastify();
      enforceRouteProtection(app);

      expect(() =>
        app.get('/api/v1/logging-only', { preHandler: async () => {} }, async () => ({ ok: true }))
      ).toThrow(/Unprotected route/);
    });

    it('allows allowlisted public routes', async () => {
      const app = Fastify();
      enforceRouteProtection(app);

      expect(() => app.get('/health', async () => ({ ok: true }))).not.toThrow();
    });
  });
});
