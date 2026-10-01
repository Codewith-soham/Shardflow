import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';

import { buildApp } from '../../app.js';
import type { AppConfig } from '../../config/index.js';
import { ProjectStatus, type Project } from '../models/project.model.js';
import { type ApiKey } from '../models/api-key.model.js';
import { UserStatus, type User } from '../models/user.model.js';
import { AuthService } from '../../auth/auth.service.js';
import { ProjectService } from '../services/project.service.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { ApiKeyService } from '../services/api-key.service.js';
import { ApiKeyRepository } from '../repositories/api-key.repository.js';

describe('API Key Management Routes (Tasks 2.8 - 2.9)', () => {
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
    supabaseUserId: 'sb_test_owner_123',
    email: 'owner@example.com',
    name: 'Project Owner',
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let inMemoryProjects: Map<string, Project>;
  let inMemoryApiKeys: Map<string, ApiKey>;
  let mockProjectRepo: Partial<ProjectRepository>;
  let mockApiKeyRepo: Partial<ApiKeyRepository>;
  let mockAuthService: Partial<AuthService>;

  beforeEach(() => {
    inMemoryProjects = new Map<string, Project>();
    inMemoryApiKeys = new Map<string, ApiKey>();

    mockProjectRepo = {
      findById: vi.fn(async (id) => inMemoryProjects.get(id.toString()) ?? null),

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

    mockApiKeyRepo = {
      create: vi.fn(async (data) => {
        const id = new ObjectId();
        const keyDoc: ApiKey = {
          _id: id,
          projectId: typeof data.projectId === 'string' ? new ObjectId(data.projectId) : data.projectId,
          name: data.name,
          keyHash: data.keyHash,
          lastUsedAt: null,
          expiresAt: data.expiresAt ?? null,
          revokedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryApiKeys.set(id.toString(), keyDoc);
        return keyDoc;
      }),

      findByProjectId: vi.fn(async (projectId) => {
        const results: ApiKey[] = [];
        for (const k of inMemoryApiKeys.values()) {
          if (k.projectId.toString() === projectId.toString()) results.push(k);
        }
        return results;
      }),

      findByIdAndProjectId: vi.fn(async (id, projectId) => {
        const k = inMemoryApiKeys.get(id.toString());
        if (k && k.projectId.toString() === projectId.toString()) return k;
        return null;
      }),

      revoke: vi.fn(async (id, projectId) => {
        const k = inMemoryApiKeys.get(id.toString());
        if (k && (!projectId || k.projectId.toString() === projectId.toString())) {
          const revoked: ApiKey = { ...k, revokedAt: new Date(), updatedAt: new Date() };
          inMemoryApiKeys.set(id.toString(), revoked);
          return revoked;
        }
        return null;
      }),
    };

    mockAuthService = {
      authenticateAndSyncUser: vi.fn().mockResolvedValue({
        user: testUser,
        supabaseUser: { id: testUser.supabaseUserId, email: testUser.email },
      }),
    };
  });

  describe('POST /api/v1/projects/:projectId/api-keys (Task 2.8)', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = await buildApp(testConfig);

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${new ObjectId().toString()}/api-keys`,
        payload: { name: 'Prod Key' },
      });

      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe('AUTHENTICATION_REQUIRED');
      await app.close();
    });

    it('returns 400 for invalid projectId format', async () => {
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects/invalid-id/api-keys',
        headers: { authorization: 'Bearer test_token' },
        payload: { name: 'Prod Key' },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('INVALID_PROJECT_ID');
      await app.close();
    });

    it('returns 403 when project is owned by another user', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const apiKeyService = new ApiKeyService(mockApiKeyRepo as ApiKeyRepository, projectService);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
        apiKeyService,
      });

      const otherOwnerProject = await projectService.createProject(new ObjectId(), { name: 'Other App' });

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${otherOwnerProject._id.toString()}/api-keys`,
        headers: { authorization: 'Bearer test_token' },
        payload: { name: 'My Key' },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('PROJECT_ACCESS_DENIED');
      await app.close();
    });

    it('generates a raw API key and returns 201 Created', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const apiKeyService = new ApiKeyService(mockApiKeyRepo as ApiKeyRepository, projectService);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
        apiKeyService,
      });

      const project = await projectService.createProject(testUser._id, { name: 'My App' });

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${project._id.toString()}/api-keys`,
        headers: { authorization: 'Bearer test_token' },
        payload: {
          name: 'Server API Key',
          expiresAt: '2028-01-01T00:00:00.000Z',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('API key created successfully');
      expect(body.data.name).toBe('Server API Key');
      expect(body.data.key).toMatch(/^sf_live_[a-f0-9]{48}$/);
      expect(body.data.id).toBeDefined();

      await app.close();
    });
  });

  describe('GET /api/v1/projects/:projectId/api-keys (Task 2.9)', () => {
    it('lists all project API keys without leaking raw key or keyHash', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const apiKeyService = new ApiKeyService(mockApiKeyRepo as ApiKeyRepository, projectService);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
        apiKeyService,
      });

      const project = await projectService.createProject(testUser._id, { name: 'My App' });
      await apiKeyService.createApiKey(project._id, testUser._id, { name: 'Key 1' });
      await apiKeyService.createApiKey(project._id, testUser._id, { name: 'Key 2' });

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${project._id.toString()}/api-keys`,
        headers: { authorization: 'Bearer test_token' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.apiKeys).toHaveLength(2);

      const first = body.data.apiKeys[0];
      expect(first.name).toBe('Key 1');
      expect(first.status).toBe('ACTIVE');
      expect(first.key).toBeUndefined(); // NEVER leaked
      expect(first.keyHash).toBeUndefined(); // NEVER leaked

      await app.close();
    });
  });

  describe('DELETE /api/v1/projects/:projectId/api-keys/:apiKeyId (Task 2.9)', () => {
    it('returns 404 if API key does not exist', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const apiKeyService = new ApiKeyService(mockApiKeyRepo as ApiKeyRepository, projectService);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
        apiKeyService,
      });

      const project = await projectService.createProject(testUser._id, { name: 'My App' });
      const nonExistentKeyId = new ObjectId().toString();

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/projects/${project._id.toString()}/api-keys/${nonExistentKeyId}`,
        headers: { authorization: 'Bearer test_token' },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('API_KEY_NOT_FOUND');
      await app.close();
    });

    it('revokes the API key successfully', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const apiKeyService = new ApiKeyService(mockApiKeyRepo as ApiKeyRepository, projectService);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
        apiKeyService,
      });

      const project = await projectService.createProject(testUser._id, { name: 'My App' });
      const { apiKey } = await apiKeyService.createApiKey(project._id, testUser._id, { name: 'Key to Revoke' });

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/projects/${project._id.toString()}/api-keys/${apiKey._id.toString()}`,
        headers: { authorization: 'Bearer test_token' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('API key revoked successfully');
      expect(body.data.status).toBe('REVOKED');
      expect(body.data.revokedAt).toBeDefined();

      await app.close();
    });
  });
});
