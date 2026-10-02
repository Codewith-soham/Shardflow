import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';

// ─── Module-level mock — must be at top level (Vitest hoisting requirement) ──
vi.mock('../../connection-manager/index.js', () => ({
  connectionManager: {
    ping: vi.fn().mockResolvedValue(5),
    closeConnection: vi.fn().mockResolvedValue(undefined),
    hasConnection: vi.fn().mockReturnValue(false),
    closeAll: vi.fn().mockResolvedValue(undefined),
  },
}));

// ─── Import after mock declarations ──────────────────────────────────────────
import { buildApp } from '../../app.js';
import type { AppConfig } from '../../config/index.js';
import { ProjectStatus, type Project } from '../models/project.model.js';
import {
  ShardStatus,
  ShardHealthStatus,
  type Shard,
  encryptConnectionUri,
  decryptConnectionUri,
} from '../models/shard.model.js';
import { UserStatus, type User } from '../models/user.model.js';
import { AuthService } from '../../auth/auth.service.js';
import { ProjectService } from '../services/project.service.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { ShardService } from '../services/shard.service.js';
import { ShardRepository } from '../repositories/shard.repository.js';
import { connectionManager } from '../../connection-manager/index.js';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

const TEST_MONGO_URI = 'mongodb://localhost:27017/test';

function makeTestShard(projectId: ObjectId, overrides: Partial<Shard> = {}): Shard {
  return {
    _id: new ObjectId(),
    projectId,
    name: 'Primary Shard',
    encryptedConnectionUri: encryptConnectionUri(TEST_MONGO_URI),
    status: ShardStatus.ACTIVE,
    healthStatus: ShardHealthStatus.UNKNOWN,
    lastHealthCheckAt: null,
    lastSuccessfulHealthCheckAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── Shared Test Config ───────────────────────────────────────────────────────

const testConfig: AppConfig = {
  port: 3000,
  host: '127.0.0.1',
  nodeEnv: 'test',
  mongodbUri: 'mongodb://localhost:27017',
  mongodbDatabase: 'shardflow_test',
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key',
};

const testUser: User = {
  _id: new ObjectId('65123456789abcdef0123456'),
  supabaseUserId: 'sb_test_owner_shard',
  email: 'shardowner@example.com',
  name: 'Shard Owner',
  status: UserStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Shard Management Routes (Phase 3 — Tasks 3.1–3.9)', () => {
  let inMemoryProjects: Map<string, Project>;
  let inMemoryShards: Map<string, Shard>;
  let mockProjectRepo: Partial<ProjectRepository>;
  let mockShardRepo: Partial<ShardRepository>;
  let mockAuthService: Partial<AuthService>;

  beforeEach(() => {
    inMemoryProjects = new Map<string, Project>();
    inMemoryShards = new Map<string, Shard>();

    // Reset connection manager to success state by default
    vi.mocked(connectionManager.ping).mockResolvedValue(5);
    vi.mocked(connectionManager.closeConnection).mockResolvedValue(undefined);

    // ── Project repo mock ──────────────────────────────────────────────────
    mockProjectRepo = {
      findById: vi.fn(async (id) => {
        return inMemoryProjects.get(id.toString()) ?? null;
      }),

      findByIdAndOwnerId: vi.fn(async (id, ownerId) => {
        const p = inMemoryProjects.get(id.toString());
        if (p && p.ownerId.toString() === ownerId.toString()) return p;
        return null;
      }),

      findByOwnerIdAndName: vi.fn(async (ownerId, name) => {
        for (const p of inMemoryProjects.values()) {
          if (p.ownerId.toString() === ownerId.toString() && p.name === name) return p;
        }
        return null;
      }),

      create: vi.fn(async (data) => {
        const id = new ObjectId();
        const project: Project = {
          _id: id,
          ownerId: typeof data.ownerId === 'string' ? new ObjectId(data.ownerId) : data.ownerId,
          name: data.name,
          description: data.description,
          status: data.status ?? ProjectStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryProjects.set(id.toString(), project);
        return project;
      }),
    };

    // ── Shard repo mock ────────────────────────────────────────────────────
    mockShardRepo = {
      create: vi.fn(async (data) => {
        const id = new ObjectId();
        const shard: Shard = {
          _id: id,
          projectId: typeof data.projectId === 'string' ? new ObjectId(data.projectId) : data.projectId,
          name: data.name,
          encryptedConnectionUri: data.encryptedConnectionUri,
          status: data.status ?? ShardStatus.ACTIVE,
          healthStatus: data.healthStatus ?? ShardHealthStatus.UNKNOWN,
          lastHealthCheckAt: null,
          lastSuccessfulHealthCheckAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryShards.set(id.toString(), shard);
        return shard;
      }),

      findByProjectId: vi.fn(async (projectId) => {
        const results: Shard[] = [];
        for (const s of inMemoryShards.values()) {
          if (s.projectId.toString() === projectId.toString()) results.push(s);
        }
        return results;
      }),

      findByIdAndProjectId: vi.fn(async (id, projectId) => {
        const s = inMemoryShards.get(id.toString());
        if (s && s.projectId.toString() === projectId.toString()) return s;
        return null;
      }),

      findByProjectIdAndName: vi.fn(async (projectId, name) => {
        for (const s of inMemoryShards.values()) {
          if (s.projectId.toString() === projectId.toString() && s.name === name) return s;
        }
        return null;
      }),

      updateByIdAndProjectId: vi.fn(async (id, projectId, data) => {
        const s = inMemoryShards.get(id.toString());
        if (s && s.projectId.toString() === projectId.toString()) {
          const updated: Shard = { ...s, ...data, updatedAt: new Date() };
          inMemoryShards.set(id.toString(), updated);
          return updated;
        }
        return null;
      }),

      updateHealth: vi.fn(async (id, healthStatus) => {
        const s = inMemoryShards.get(id.toString());
        if (s) {
          const updated: Shard = { ...s, healthStatus, updatedAt: new Date() };
          inMemoryShards.set(id.toString(), updated);
          return updated;
        }
        return null;
      }),

      disable: vi.fn(async (id, projectId) => {
        const s = inMemoryShards.get(id.toString());
        if (s && (!projectId || s.projectId.toString() === projectId.toString())) {
          const updated: Shard = { ...s, status: ShardStatus.DISABLED, updatedAt: new Date() };
          inMemoryShards.set(id.toString(), updated);
          return updated;
        }
        return null;
      }),
    };

    // ── Auth service mock ──────────────────────────────────────────────────
    mockAuthService = {
      authenticateAndSyncUser: vi.fn().mockResolvedValue({
        user: testUser,
        supabaseUser: { id: testUser.supabaseUserId, email: testUser.email },
      }),
    };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/v1/projects/:projectId/shards — Task 3.4
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/v1/projects/:projectId/shards — Task 3.4 (Shard Registration)', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = await buildApp(testConfig);
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${new ObjectId().toString()}/shards`,
        payload: { name: 'Shard 1', connectionUri: TEST_MONGO_URI },
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe('AUTHENTICATION_REQUIRED');
      await app.close();
    });

    it('returns 400 for invalid project ID format', async () => {
      const app = await buildApp(testConfig, { authService: mockAuthService as AuthService });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects/not-a-valid-id/shards',
        headers: { authorization: 'Bearer test_token' },
        payload: { name: 'Shard 1', connectionUri: TEST_MONGO_URI },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('INVALID_PROJECT_ID');
      await app.close();
    });

    it('returns 400 for an invalid connectionUri (not mongodb:// scheme)', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const shardService = new ShardService(mockShardRepo as ShardRepository, projectService);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
        shardService,
      });
      const project = await projectService.createProject(testUser._id, { name: 'My App' });
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${project._id.toString()}/shards`,
        headers: { authorization: 'Bearer test_token' },
        payload: { name: 'Bad Shard', connectionUri: 'http://not-a-mongo-uri' },
      });
      expect(res.statusCode).toBe(400);
      await app.close();
    });

    it('registers a shard successfully — returns 201 with no credentials in response', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const shardService = new ShardService(mockShardRepo as ShardRepository, projectService);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
        shardService,
      });
      const project = await projectService.createProject(testUser._id, { name: 'My App' });
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${project._id.toString()}/shards`,
        headers: { authorization: 'Bearer test_token' },
        payload: { name: 'Primary Shard', connectionUri: TEST_MONGO_URI },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('Shard registered successfully');
      expect(body.data.name).toBe('Primary Shard');
      expect(body.data.status).toBe('ACTIVE');
      // Architecture Principle 4: credentials MUST NOT appear in any API response
      expect(body.data.encryptedConnectionUri).toBeUndefined();
      expect(body.data.connectionUri).toBeUndefined();
      expect(body.data.id).toBeDefined();
      await app.close();
    });

    it('returns 403 when project is owned by another user', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const shardService = new ShardService(mockShardRepo as ShardRepository, projectService);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
        shardService,
      });
      const otherOwner = new ObjectId();
      const otherProject = await projectService.createProject(otherOwner, { name: 'Other App' });
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${otherProject._id.toString()}/shards`,
        headers: { authorization: 'Bearer test_token' },
        payload: { name: 'Shard', connectionUri: TEST_MONGO_URI },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('PROJECT_ACCESS_DENIED');
      await app.close();
    });

    it('marks shard UNHEALTHY when initial connection ping fails — Task 3.8', async () => {
      // Simulate connection failure for this one test only
      vi.mocked(connectionManager.ping).mockRejectedValueOnce(new Error('Connection refused'));

      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const shardService = new ShardService(mockShardRepo as ShardRepository, projectService);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
        shardService,
      });
      const project = await projectService.createProject(testUser._id, { name: 'My App' });
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${project._id.toString()}/shards`,
        headers: { authorization: 'Bearer test_token' },
        payload: { name: 'Unreachable Shard', connectionUri: 'mongodb://does-not-exist:27017/db' },
      });
      // Shard is still registered even when ping fails
      expect(res.statusCode).toBe(201);
      expect(res.json().data.healthStatus).toBe('UNHEALTHY');
      await app.close();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/v1/projects/:projectId/shards — Task 3.5
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/v1/projects/:projectId/shards — Task 3.5 (List Shards)', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = await buildApp(testConfig);
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${new ObjectId().toString()}/shards`,
      });
      expect(res.statusCode).toBe(401);
      await app.close();
    });

    it('lists all shards without exposing encrypted credentials', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const shardService = new ShardService(mockShardRepo as ShardRepository, projectService);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
        shardService,
      });
      const project = await projectService.createProject(testUser._id, { name: 'My App' });
      const s1 = makeTestShard(project._id, { name: 'Shard A' });
      const s2 = makeTestShard(project._id, { name: 'Shard B' });
      inMemoryShards.set(s1._id.toString(), s1);
      inMemoryShards.set(s2._id.toString(), s2);

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${project._id.toString()}/shards`,
        headers: { authorization: 'Bearer test_token' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.shards).toHaveLength(2);
      const first = body.data.shards[0];
      expect(first.id).toBeDefined();
      expect(first.status).toBe('ACTIVE');
      expect(first.encryptedConnectionUri).toBeUndefined();
      expect(first.connectionUri).toBeUndefined();
      await app.close();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/v1/projects/:projectId/shards/:shardId — Task 3.5
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/v1/projects/:projectId/shards/:shardId — Task 3.5 (Get Shard)', () => {
    it('returns 404 for a non-existent shard', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const shardService = new ShardService(mockShardRepo as ShardRepository, projectService);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
        shardService,
      });
      const project = await projectService.createProject(testUser._id, { name: 'My App' });
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${project._id.toString()}/shards/${new ObjectId().toString()}`,
        headers: { authorization: 'Bearer test_token' },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('SHARD_NOT_FOUND');
      await app.close();
    });

    it('returns 400 for invalid shard ID format', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const shardService = new ShardService(mockShardRepo as ShardRepository, projectService);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
        shardService,
      });
      const project = await projectService.createProject(testUser._id, { name: 'My App' });
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${project._id.toString()}/shards/not-a-valid-id`,
        headers: { authorization: 'Bearer test_token' },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('INVALID_SHARD_ID');
      await app.close();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE /api/v1/projects/:projectId/shards/:shardId — Task 3.7
  // ═══════════════════════════════════════════════════════════════════════════

  describe('DELETE /api/v1/projects/:projectId/shards/:shardId — Task 3.7 (Disable Shard)', () => {
    it('disables a shard and returns DISABLED status', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const shardService = new ShardService(mockShardRepo as ShardRepository, projectService);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
        shardService,
      });
      const project = await projectService.createProject(testUser._id, { name: 'My App' });
      const shard = makeTestShard(project._id);
      inMemoryShards.set(shard._id.toString(), shard);

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/projects/${project._id.toString()}/shards/${shard._id.toString()}`,
        headers: { authorization: 'Bearer test_token' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('Shard disabled successfully');
      expect(body.data.status).toBe('DISABLED');
      await app.close();
    });

    it('returns 404 for a non-existent shard', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const shardService = new ShardService(mockShardRepo as ShardRepository, projectService);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
        shardService,
      });
      const project = await projectService.createProject(testUser._id, { name: 'My App' });
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/projects/${project._id.toString()}/shards/${new ObjectId().toString()}`,
        headers: { authorization: 'Bearer test_token' },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('SHARD_NOT_FOUND');
      await app.close();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Credential Security — Task 3.8 & Architecture Principle 4
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Credential Security — encryptConnectionUri / decryptConnectionUri', () => {
    it('round-trips correctly in test environment', () => {
      const original = 'mongodb+srv://user:password@cluster.example.com/db?retryWrites=true';
      const encrypted = encryptConnectionUri(original);
      expect(encrypted).not.toContain('password');
      expect(encrypted).not.toContain(original);
      expect(encrypted).toMatch(/^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
      expect(decryptConnectionUri(encrypted)).toBe(original);
    });

    it('produces different ciphertext for the same input (random IV per call)', () => {
      const uri = 'mongodb://localhost:27017/test';
      const enc1 = encryptConnectionUri(uri);
      const enc2 = encryptConnectionUri(uri);
      // Different IVs → different ciphertext even for identical plaintext
      expect(enc1).not.toBe(enc2);
    });
  });
});
