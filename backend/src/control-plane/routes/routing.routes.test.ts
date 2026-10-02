import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';

import { buildApp } from '../../app.js';
import type { AppConfig } from '../../config/index.js';
import { ErrorCode } from '../../errors/codes.js';
import { ProjectStatus, type Project } from '../models/project.model.js';
import { UserStatus, type User } from '../models/user.model.js';
import { ShardStatus, ShardHealthStatus, type Shard } from '../models/shard.model.js';
import type { TenantMapping } from '../models/tenant-mapping.model.js';
import type { RoutingConfig } from '../models/routing-config.model.js';
import { AuthService } from '../../auth/auth.service.js';

describe('Routing & Metadata Routes (Phase 5 - Tasks 5.1-5.9)', () => {
  const testConfig: AppConfig = {
    port: 3000,
    host: '127.0.0.1',
    nodeEnv: 'test',
    mongodbUri: 'mongodb://localhost:27017',
    mongodbDatabase: 'shardflow_test',
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-anon-key',
  };

  const ownerUser: User = {
    _id: new ObjectId('65123456789abcdef0123456'),
    supabaseUserId: 'sb_test_owner_routing',
    email: 'owner_routing@example.com',
    name: 'Routing Owner',
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const project: Project = {
    _id: new ObjectId('659999999999999999999999'),
    ownerId: ownerUser._id,
    name: 'Routing Test Project',
    status: ProjectStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const shard: Shard = {
    _id: new ObjectId('658888888888888888888888'),
    projectId: project._id,
    name: 'Primary Shard',
    encryptedConnectionUri: 'encrypted_uri',
    status: ShardStatus.ACTIVE,
    healthStatus: ShardHealthStatus.HEALTHY,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function createMockAuthService() {
    return {
      authenticateAndSyncUser: async () => ({
        user: ownerUser,
        supabaseUser: { id: ownerUser.supabaseUserId, email: ownerUser.email },
      }),
    } as unknown as AuthService;
  }

  function createMockProjectService() {
    return {
      getProjectById: async (projectId: string | ObjectId, ownerId: string | ObjectId) => {
        if (
          projectId.toString() === project._id.toString() &&
          ownerId.toString() === ownerUser._id.toString()
        ) {
          return project;
        }
        const { NotFoundError } = await import('../../errors/app-error.js');
        throw new NotFoundError('Project not found', ErrorCode.PROJECT_NOT_FOUND);
      },
    } as any;
  }

  function createMockRoutingRepositories() {
    const tenantMappings = new Map<string, TenantMapping>();
    const routingConfigs = new Map<string, RoutingConfig>();
    const shards = new Map<string, Shard>([
      [shard._id.toString(), shard],
    ]);

    const mockTenantMappingRepo = {
      findByProjectAndTenant: async (projectId: string | ObjectId, tenantId: string) => {
        for (const tm of tenantMappings.values()) {
          if (tm.projectId.toString() === projectId.toString() && tm.tenantId === tenantId) {
            return tm;
          }
        }
        return null;
      },
      findByProjectId: async (projectId: string | ObjectId) => {
        return Array.from(tenantMappings.values()).filter(
          (tm) => tm.projectId.toString() === projectId.toString()
        );
      },
      findById: async (id: string | ObjectId) => {
        return tenantMappings.get(id.toString()) ?? null;
      },
      create: async (data: any) => {
        const id = new ObjectId();
        const doc: TenantMapping = {
          _id: id,
          projectId: new ObjectId(data.projectId),
          tenantId: data.tenantId,
          shardId: new ObjectId(data.shardId),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        tenantMappings.set(id.toString(), doc);
        return doc;
      },
      updateShard: async (id: string | ObjectId, shardId: string | ObjectId) => {
        const tm = tenantMappings.get(id.toString());
        if (tm) {
          tm.shardId = new ObjectId(shardId);
          tm.updatedAt = new Date();
          return tm;
        }
        return null;
      },
      delete: async (id: string | ObjectId) => {
        return tenantMappings.delete(id.toString());
      },
    };

    const mockRoutingConfigRepo = {
      findByProjectId: async (projectId: string | ObjectId) => {
        return routingConfigs.get(projectId.toString()) ?? null;
      },
      upsert: async (data: any) => {
        const key = data.projectId.toString();
        const doc: RoutingConfig = {
          _id: new ObjectId(),
          projectId: new ObjectId(data.projectId),
          strategy: data.strategy ?? 'TENANT_BASED',
          routingKey: data.routingKey ?? 'tenantId',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        routingConfigs.set(key, doc);
        return doc;
      },
    };

    const mockShardRepo = {
      findByIdAndProjectId: async (id: string | ObjectId, projectId: string | ObjectId) => {
        const s = shards.get(id.toString());
        if (s && s.projectId.toString() === projectId.toString()) {
          return s;
        }
        return null;
      },
    };

    return {
      tenantMappings,
      routingConfigs,
      shards,
      mockTenantMappingRepo,
      mockRoutingConfigRepo,
      mockShardRepo,
    };
  }

  let repos: ReturnType<typeof createMockRoutingRepositories>;
  let mockAuthService: AuthService;
  let mockProjectService: any;
  let routingService: any;

  beforeEach(async () => {
    repos = createMockRoutingRepositories();
    mockAuthService = createMockAuthService();
    mockProjectService = createMockProjectService();

    const { RoutingService } = await import('../services/routing.service.js');
    routingService = new RoutingService(
      repos.mockTenantMappingRepo as any,
      repos.mockRoutingConfigRepo as any,
      repos.mockShardRepo as any,
      mockProjectService
    );
  });

  it('GET /api/v1/projects/:projectId/routing returns default routing config', async () => {
    const app = await buildApp(testConfig, {
      authService: mockAuthService,
      routingService,
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project._id.toString()}/routing`,
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.strategy).toBe('TENANT_BASED');
    expect(body.data.routingKey).toBe('tenantId');
  });

  it('PATCH /api/v1/projects/:projectId/routing accepts valid TENANT_BASED strategy', async () => {
    const app = await buildApp(testConfig, {
      authService: mockAuthService,
      routingService,
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/projects/${project._id.toString()}/routing`,
      headers: { authorization: 'Bearer token' },
      payload: { strategy: 'TENANT_BASED' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.strategy).toBe('TENANT_BASED');
  });

  it('POST /api/v1/projects/:projectId/tenant-mappings creates a valid tenant mapping', async () => {
    const app = await buildApp(testConfig, {
      authService: mockAuthService,
      routingService,
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${project._id.toString()}/tenant-mappings`,
      headers: { authorization: 'Bearer token' },
      payload: {
        tenantId: 'tenant_acme_corp',
        shardId: shard._id.toString(),
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.tenantId).toBe('tenant_acme_corp');
    expect(body.data.shardId).toBe(shard._id.toString());
  });

  it('POST /api/v1/projects/:projectId/tenant-mappings rejects duplicate mapping with 409', async () => {
    const app = await buildApp(testConfig, {
      authService: mockAuthService,
      routingService,
    });

    // Create first mapping
    await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${project._id.toString()}/tenant-mappings`,
      headers: { authorization: 'Bearer token' },
      payload: {
        tenantId: 'tenant_acme_corp',
        shardId: shard._id.toString(),
      },
    });

    // Attempt duplicate mapping
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${project._id.toString()}/tenant-mappings`,
      headers: { authorization: 'Bearer token' },
      payload: {
        tenantId: 'tenant_acme_corp',
        shardId: shard._id.toString(),
      },
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.payload);
    expect(body.error.code).toBe(ErrorCode.TENANT_MAPPING_ALREADY_EXISTS);
  });

  it('GET /api/v1/projects/:projectId/tenant-mappings lists all tenant mappings', async () => {
    const app = await buildApp(testConfig, {
      authService: mockAuthService,
      routingService,
    });

    await routingService.createTenantMapping(project._id, ownerUser._id, {
      tenantId: 'tenant_1',
      shardId: shard._id.toString(),
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project._id.toString()}/tenant-mappings`,
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.tenantMappings).toHaveLength(1);
  });

  it('DELETE /api/v1/projects/:projectId/tenant-mappings/:mappingId deletes mapping', async () => {
    const app = await buildApp(testConfig, {
      authService: mockAuthService,
      routingService,
    });

    const created = await routingService.createTenantMapping(project._id, ownerUser._id, {
      tenantId: 'tenant_to_delete',
      shardId: shard._id.toString(),
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/projects/${project._id.toString()}/tenant-mappings/${created._id.toString()}`,
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
  });
});
