import { describe, it, expect, vi, beforeAll } from 'vitest';
import { ObjectId } from 'mongodb';
import type { FastifyInstance } from 'fastify';

vi.mock('../../connection-manager/index.js', () => ({
  connectionManager: {
    ping: vi.fn().mockResolvedValue(5),
    closeConnection: vi.fn().mockResolvedValue(undefined),
    hasConnection: vi.fn().mockReturnValue(false),
    closeAll: vi.fn().mockResolvedValue(undefined),
  },
}));

import { buildApp } from '../../app.js';
import type { AppConfig } from '../../config/index.js';
import { ErrorCode } from '../../errors/codes.js';
import { AuthService } from '../../auth/auth.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { ShardRepository } from '../repositories/shard.repository.js';
import { ApiKeyRepository } from '../repositories/api-key.repository.js';
import { TenantMappingRepository } from '../repositories/tenant-mapping.repository.js';
import { RoutingConfigRepository } from '../repositories/routing-config.repository.js';
import { HealthEventRepository } from '../repositories/health-event.repository.js';
import { ProjectService } from '../services/project.service.js';
import { ApiKeyService } from '../services/api-key.service.js';
import { ShardService } from '../services/shard.service.js';
import { RoutingService } from '../services/routing.service.js';
import { HealthService } from '../../health/health.service.js';
import { createFakeDb } from '../../test-utils/fake-db.js';

// ─── App wiring: real stack, fake database, fake Supabase token verification ─

const testConfig: AppConfig = {
  port: 3000,
  host: '127.0.0.1',
  nodeEnv: 'test',
  mongodbUri: 'mongodb://localhost:27017',
  mongodbDatabase: 'shardflow_test',
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key',
};

const SUPABASE_USERS: Record<string, { id: string; email: string }> = {
  'token-a': { id: 'supabase-a', email: 'a@example.com' },
  'token-b': { id: 'supabase-b', email: 'b@example.com' },
};

function buildStack(): Promise<FastifyInstance> {
  const db = createFakeDb();
  const userRepository = new UserRepository(db);
  const projectRepository = new ProjectRepository(db);
  const shardRepository = new ShardRepository(db);
  const apiKeyRepository = new ApiKeyRepository(db);

  const projectService = new ProjectService(projectRepository);

  return buildApp(testConfig, {
    authService: new AuthService({
      userRepository,
      supabaseAuth: {
        getUser: async (token: string) => {
          const user = SUPABASE_USERS[token];
          return user
            ? { data: { user: { ...user, user_metadata: {} } }, error: null }
            : { data: { user: null }, error: new Error('invalid JWT') };
        },
      } as any,
    }),
    projectService,
    apiKeyService: new ApiKeyService(apiKeyRepository, projectService),
    shardService: new ShardService(shardRepository, projectService),
    routingService: new RoutingService(
      new TenantMappingRepository(db),
      new RoutingConfigRepository(db),
      shardRepository,
      projectService
    ),
    healthService: new HealthService(
      shardRepository,
      new HealthEventRepository(db),
      projectRepository,
      userRepository
    ),
  });
}

// ─── Test ─────────────────────────────────────────────────────────────────────

interface Ids {
  projectId: string;
  shardId: string;
  apiKeyId: string;
  mappingId: string;
}

const A_MARKERS = ['a-secret-project', 'a-secret-shard', 'a-secret-key', 'a-secret-tenant'];

describe('project ownership: two-user isolation across every project-scoped endpoint', () => {
  let app: FastifyInstance;
  let a: Ids; // user A's resources
  let b: Ids; // user B's own resources

  const call = async (
    token: string,
    method: string,
    url: string,
    payload?: unknown
  ) =>
    app.inject({
      method: method as 'GET',
      url,
      headers: { authorization: `Bearer ${token}` },
      ...(payload !== undefined ? { payload: payload as any } : {}),
    });

  async function seed(token: string, prefix: string): Promise<Ids> {
    const project = await call(token, 'POST', '/api/v1/projects', { name: `${prefix}-secret-project` });
    const projectId = project.json().data.id;

    const shard = await call(token, 'POST', `/api/v1/projects/${projectId}/shards`, {
      name: `${prefix}-secret-shard`,
      connectionUri: 'mongodb://localhost:27017/secret',
    });
    const shardId = shard.json().data.id;

    const key = await call(token, 'POST', `/api/v1/projects/${projectId}/api-keys`, {
      name: `${prefix}-secret-key`,
    });
    const apiKeyId = key.json().data.id;

    const mapping = await call(token, 'POST', `/api/v1/projects/${projectId}/tenant-mappings`, {
      tenantId: `${prefix}-secret-tenant`,
      shardId,
    });
    const mappingId = mapping.json().data.id;

    expect([projectId, shardId, apiKeyId, mappingId].every(Boolean)).toBe(true);
    return { projectId, shardId, apiKeyId, mappingId };
  }

  beforeAll(async () => {
    app = await buildStack();
    a = await seed('token-a', 'a');
    b = await seed('token-b', 'b');
  });

  /** Every project-scoped operation, parameterised by (project, child ids). */
  const operations: Array<[string, (p: Ids) => [string, string, unknown?]]> = [
    ['get project', (p) => ['GET', `/api/v1/projects/${p.projectId}`]],
    ['update project', (p) => ['PATCH', `/api/v1/projects/${p.projectId}`, { name: 'hijacked' }]],
    ['disable project', (p) => ['DELETE', `/api/v1/projects/${p.projectId}`]],
    ['project health', (p) => ['GET', `/api/v1/projects/${p.projectId}/health`]],
    ['create api key', (p) => ['POST', `/api/v1/projects/${p.projectId}/api-keys`, { name: 'evil' }]],
    ['list api keys', (p) => ['GET', `/api/v1/projects/${p.projectId}/api-keys`]],
    ['revoke api key', (p) => ['DELETE', `/api/v1/projects/${p.projectId}/api-keys/${p.apiKeyId}`]],
    ['register shard', (p) => ['POST', `/api/v1/projects/${p.projectId}/shards`, { name: 'evil', connectionUri: 'mongodb://evil:27017/x' }]],
    ['list shards', (p) => ['GET', `/api/v1/projects/${p.projectId}/shards`]],
    ['get shard', (p) => ['GET', `/api/v1/projects/${p.projectId}/shards/${p.shardId}`]],
    ['update shard', (p) => ['PATCH', `/api/v1/projects/${p.projectId}/shards/${p.shardId}`, { name: 'hijacked' }]],
    ['disable shard', (p) => ['DELETE', `/api/v1/projects/${p.projectId}/shards/${p.shardId}`]],
    ['get routing', (p) => ['GET', `/api/v1/projects/${p.projectId}/routing`]],
    ['update routing', (p) => ['PATCH', `/api/v1/projects/${p.projectId}/routing`, { strategy: 'TENANT_BASED' }]],
    ['create mapping', (p) => ['POST', `/api/v1/projects/${p.projectId}/tenant-mappings`, { tenantId: 'evil', shardId: p.shardId }]],
    ['list mappings', (p) => ['GET', `/api/v1/projects/${p.projectId}/tenant-mappings`]],
    ['get mapping', (p) => ['GET', `/api/v1/projects/${p.projectId}/tenant-mappings/${p.mappingId}`]],
    ['update mapping', (p) => ['PATCH', `/api/v1/projects/${p.projectId}/tenant-mappings/${p.mappingId}`, { shardId: p.shardId }]],
    ['delete mapping', (p) => ['DELETE', `/api/v1/projects/${p.projectId}/tenant-mappings/${p.mappingId}`]],
  ];

  describe.each(operations)('%s', (_name, build) => {
    it("user B is denied (403 PROJECT_ACCESS_DENIED) on user A's project and sees none of A's data", async () => {
      const [method, url, payload] = build(a);
      const res = await call('token-b', method, url, payload);

      expect(res.statusCode).toBe(403);
      expect(res.json().success).toBe(false);
      expect(res.json().error.code).toBe(ErrorCode.PROJECT_ACCESS_DENIED);
      for (const marker of A_MARKERS) expect(res.body).not.toContain(marker);
    });

    it("user B gets 404 for a guessed (non-existent) project id", async () => {
      const ghost: Ids = {
        projectId: new ObjectId().toString(),
        shardId: new ObjectId().toString(),
        apiKeyId: new ObjectId().toString(),
        mappingId: new ObjectId().toString(),
      };
      const [method, url, payload] = build(ghost);
      const res = await call('token-b', method, url, payload);

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe(ErrorCode.PROJECT_NOT_FOUND);
    });
  });

  describe("ID guessing: B's own project combined with A's child ids", () => {
    const crossed: Array<[string, (own: Ids, other: Ids) => [string, string, unknown?]]> = [
      ['get shard', (o, x) => ['GET', `/api/v1/projects/${o.projectId}/shards/${x.shardId}`]],
      ['update shard', (o, x) => ['PATCH', `/api/v1/projects/${o.projectId}/shards/${x.shardId}`, { name: 'hijacked' }]],
      ['disable shard', (o, x) => ['DELETE', `/api/v1/projects/${o.projectId}/shards/${x.shardId}`]],
      ['revoke api key', (o, x) => ['DELETE', `/api/v1/projects/${o.projectId}/api-keys/${x.apiKeyId}`]],
      ['get mapping', (o, x) => ['GET', `/api/v1/projects/${o.projectId}/tenant-mappings/${x.mappingId}`]],
      ['update mapping', (o, x) => ['PATCH', `/api/v1/projects/${o.projectId}/tenant-mappings/${x.mappingId}`, { shardId: o.shardId }]],
      ['delete mapping', (o, x) => ['DELETE', `/api/v1/projects/${o.projectId}/tenant-mappings/${x.mappingId}`]],
      ['create mapping onto A shard', (o, x) => ['POST', `/api/v1/projects/${o.projectId}/tenant-mappings`, { tenantId: 'steal', shardId: x.shardId }]],
    ];

    it.each(crossed)('%s returns 404 and leaks nothing', async (_name, build) => {
      const [method, url, payload] = build(b, a);
      const res = await call('token-b', method, url, payload);

      expect(res.statusCode).toBe(404);
      for (const marker of A_MARKERS) expect(res.body).not.toContain(marker);
    });
  });

  describe('list endpoints return only the caller’s data', () => {
    it('GET /projects', async () => {
      const resA = await call('token-a', 'GET', '/api/v1/projects');
      const resB = await call('token-b', 'GET', '/api/v1/projects');

      expect(resA.json().data.projects.map((p: any) => p.id)).toEqual([a.projectId]);
      expect(resB.json().data.projects.map((p: any) => p.id)).toEqual([b.projectId]);
      expect(resB.body).not.toContain('a-secret-project');
    });

    it('shards, api keys and mappings of own project contain only own resources', async () => {
      const shards = await call('token-b', 'GET', `/api/v1/projects/${b.projectId}/shards`);
      const keys = await call('token-b', 'GET', `/api/v1/projects/${b.projectId}/api-keys`);
      const mappings = await call('token-b', 'GET', `/api/v1/projects/${b.projectId}/tenant-mappings`);

      expect(shards.json().data.shards.map((s: any) => s.id)).toEqual([b.shardId]);
      expect(keys.json().data.apiKeys.map((k: any) => k.id)).toEqual([b.apiKeyId]);
      expect(mappings.json().data.tenantMappings.map((m: any) => m.id)).toEqual([b.mappingId]);
      for (const res of [shards, keys, mappings]) {
        for (const marker of A_MARKERS) expect(res.body).not.toContain(marker);
      }
    });
  });

  it("A's resources are unchanged after all of B's attempts", async () => {
    const project = await call('token-a', 'GET', `/api/v1/projects/${a.projectId}`);
    const shard = await call('token-a', 'GET', `/api/v1/projects/${a.projectId}/shards/${a.shardId}`);
    const keys = await call('token-a', 'GET', `/api/v1/projects/${a.projectId}/api-keys`);
    const mapping = await call('token-a', 'GET', `/api/v1/projects/${a.projectId}/tenant-mappings/${a.mappingId}`);

    expect(project.json().data.name).toBe('a-secret-project');
    expect(project.json().data.status).toBe('ACTIVE');
    expect(shard.json().data.name).toBe('a-secret-shard');
    expect(shard.json().data.status).toBe('ACTIVE');
    expect(keys.json().data.apiKeys).toHaveLength(1);
    expect(keys.json().data.apiKeys[0].revokedAt ?? null).toBeNull();
    expect(mapping.json().data.shardId).toBe(a.shardId);
  });
});
