import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';

import { buildApp } from '../../app.js';
const testConfig = {
  port: 3000,
  host: '127.0.0.1',
  nodeEnv: 'test' as const,
  mongodbUri: 'mongodb://localhost:27017',
  mongodbDatabase: 'shardflow_test',
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key',
};
import { ErrorCode } from '../../errors/codes.js';
import {
  generateApiKey,
  ProjectStatus,
  ShardStatus,
  ShardHealthStatus,
  type ApiKey,
  type Project,
  type Shard,
  type TenantMapping,
} from '../../control-plane/index.js';
import { parseAndValidateDataRequest } from '../services/request-validator.js';

// ─── Mock Repositories ────────────────────────────────────────────────────────

function createMockRepositories() {
  const apiKeys = new Map<string, ApiKey>();
  const projects = new Map<string, Project>();
  const shards = new Map<string, Shard>();
  const tenantMappings = new Map<string, TenantMapping>();

  const mockApiKeyRepo = {
    findByKeyHash: async (keyHash: string) => {
      for (const key of apiKeys.values()) {
        if (key.keyHash === keyHash) return key;
      }
      return null;
    },
    updateLastUsed: async () => null,
  };

  const mockProjectRepo = {
    findById: async (id: string | ObjectId) => {
      return projects.get(id.toString()) ?? null;
    },
  };

  const mockTenantMappingRepo = {
    findByProjectAndTenant: async (projectId: string | ObjectId, tenantId: string) => {
      const key = `${projectId.toString()}:${tenantId}`;
      return tenantMappings.get(key) ?? null;
    },
  };

  const mockShardRepo = {
    findByIdAndProjectId: async (id: string | ObjectId, projectId: string | ObjectId) => {
      const shard = shards.get(id.toString());
      if (shard && shard.projectId.toString() === projectId.toString()) {
        return shard;
      }
      return null;
    },
  };

  return {
    apiKeys,
    projects,
    shards,
    tenantMappings,
    mockApiKeyRepo,
    mockProjectRepo,
    mockTenantMappingRepo,
    mockShardRepo,
  };
}

describe('Data Plane Core — Phase 4', () => {
  // ─── 1. Request Validator Unit Tests ────────────────────────────────────────

  describe('Request Validator (Task 4.4 & 4.5)', () => {
    it('validates a correct `find` request', () => {
      const body = {
        tenantId: 'tenant_123',
        operation: 'find',
        collection: 'orders',
        filter: { status: 'active', total: { $gt: 100 } },
        options: { limit: 10, skip: 0 },
      };
      const validated = parseAndValidateDataRequest(body);
      expect(validated.operation).toBe('find');
      expect(validated.tenantId).toBe('tenant_123');
      expect(validated.collection).toBe('orders');
    });

    it('validates a correct `insert-one` request', () => {
      const body = {
        tenantId: 'tenant_123',
        operation: 'insert-one',
        collection: 'users',
        document: { name: 'Alice', role: 'admin' },
      };
      const validated = parseAndValidateDataRequest(body);
      expect(validated.operation).toBe('insert-one');
    });

    it('rejects unsupported operation', () => {
      const body = {
        tenantId: 'tenant_123',
        operation: 'aggregate',
        collection: 'users',
      };
      expect(() => parseAndValidateDataRequest(body)).toThrow(
        /Invalid/i
      );
    });

    it('rejects disallowed filter operators ($where, $expr)', () => {
      const bodyWhere = {
        tenantId: 'tenant_123',
        operation: 'find',
        collection: 'users',
        filter: { $where: 'this.age > 21' },
      };
      expect(() => parseAndValidateDataRequest(bodyWhere)).toThrow(
        /Operator "\$where" is not permitted/i
      );

      const bodyExpr = {
        tenantId: 'tenant_123',
        operation: 'find',
        collection: 'users',
        filter: { $expr: { $gt: ['$balance', 100] } },
      };
      expect(() => parseAndValidateDataRequest(bodyExpr)).toThrow(
        /Operator "\$expr" is not permitted/i
      );
    });

    it('rejects disallowed update operators ($rename)', () => {
      const body = {
        tenantId: 'tenant_123',
        operation: 'update-one',
        collection: 'users',
        filter: { _id: '123' },
        update: { $rename: { oldName: 'newName' } },
      };
      expect(() => parseAndValidateDataRequest(body)).toThrow(
        /Update operator "\$rename" is not permitted/i
      );
    });

    it('rejects limit exceeding MAX_FIND_LIMIT (100)', () => {
      const body = {
        tenantId: 'tenant_123',
        operation: 'find',
        collection: 'users',
        filter: {},
        options: { limit: 500 },
      };
      expect(() => parseAndValidateDataRequest(body)).toThrow();
    });

    it('rejects invalid collection names', () => {
      const body = {
        tenantId: 'tenant_123',
        operation: 'find',
        collection: 'invalid-collection-name!',
      };
      expect(() => parseAndValidateDataRequest(body)).toThrow(
        /Invalid collection name/i
      );
    });
  });

  // ─── 2. API Key Authentication & Route Integration Tests ────────────────────

  describe('API Key Authentication & Endpoints (Task 4.1, 4.2, 4.3)', () => {
    let mocks: ReturnType<typeof createMockRepositories>;
    let project: Project;
    let rawApiKey: string;
    let apiKeyDoc: ApiKey;
    let shard: Shard;
    let tenantMapping: TenantMapping;

    beforeEach(() => {
      mocks = createMockRepositories();

      // Create test project
      const projectId = new ObjectId();
      project = {
        _id: projectId,
        ownerId: new ObjectId(),
        name: 'Test Project',
        description: 'Test application',
        status: ProjectStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mocks.projects.set(projectId.toString(), project);

      // Create test API key
      const generated = generateApiKey('sf_live_');
      rawApiKey = generated.rawKey;
      const apiKeyId = new ObjectId();
      apiKeyDoc = {
        _id: apiKeyId,
        projectId,
        name: 'Test Key',
        keyHash: generated.keyHash,
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mocks.apiKeys.set(apiKeyId.toString(), apiKeyDoc);

      // Create test shard
      const shardId = new ObjectId();
      shard = {
        _id: shardId,
        projectId,
        name: 'Shard 1',
        encryptedConnectionUri: 'encrypted_uri',
        status: ShardStatus.ACTIVE,
        healthStatus: ShardHealthStatus.HEALTHY,
        lastHealthCheckAt: new Date(),
        lastSuccessfulHealthCheckAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mocks.shards.set(shardId.toString(), shard);

      // Create test tenant mapping
      const mappingId = new ObjectId();
      tenantMapping = {
        _id: mappingId,
        projectId,
        tenantId: 'tenant_acme',
        shardId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mocks.tenantMappings.set(`${projectId.toString()}:tenant_acme`, tenantMapping);
    });

    it('returns 401 when X-API-Key header is missing', async () => {
      const app = await buildApp(testConfig, {
        dataPlaneAuthOptions: {
          apiKeyRepository: mocks.mockApiKeyRepo as any,
          projectRepository: mocks.mockProjectRepo as any,
        },
      });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/data',
        payload: {
          tenantId: 'tenant_acme',
          operation: 'find',
          collection: 'users',
        },
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe(ErrorCode.AUTHENTICATION_REQUIRED);
    });

    it('returns 401 when X-API-Key is invalid', async () => {
      const app = await buildApp(testConfig, {
        dataPlaneAuthOptions: {
          apiKeyRepository: mocks.mockApiKeyRepo as any,
          projectRepository: mocks.mockProjectRepo as any,
        },
      });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/data',
        headers: {
          'x-api-key': 'sf_live_invalidkey1234567890',
        },
        payload: {
          tenantId: 'tenant_acme',
          operation: 'find',
          collection: 'users',
        },
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe(ErrorCode.INVALID_API_KEY);
    });

    it('returns 401 when API key is revoked', async () => {
      apiKeyDoc.revokedAt = new Date();

      const mockDataPlaneService = {
        processRequest: async () => ({
          data: { documents: [] },
          message: 'OK',
        }),
      } as any;

      const app = await buildApp(testConfig, {
        dataPlaneService: mockDataPlaneService,
      });

      // Override dependencies via custom route setup for middleware testing
      const { createDataPlaneAuthMiddleware } = await import('../middleware/data-plane-auth.middleware.js');
      const authMiddleware = createDataPlaneAuthMiddleware({
        apiKeyRepository: mocks.mockApiKeyRepo as any,
        projectRepository: mocks.mockProjectRepo as any,
      });

      app.post('/api/v1/test-data', { preHandler: authMiddleware }, async () => ({ success: true }));

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/test-data',
        headers: { 'x-api-key': rawApiKey },
        payload: {},
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe(ErrorCode.API_KEY_REVOKED);
    });

    it('returns 401 when API key is expired', async () => {
      apiKeyDoc.expiresAt = new Date(Date.now() - 10000); // expired 10s ago

      const { createDataPlaneAuthMiddleware } = await import('../middleware/data-plane-auth.middleware.js');
      const authMiddleware = createDataPlaneAuthMiddleware({
        apiKeyRepository: mocks.mockApiKeyRepo as any,
        projectRepository: mocks.mockProjectRepo as any,
      });

      const app = await buildApp(testConfig);
      app.post('/api/v1/test-data-expired', { preHandler: authMiddleware }, async () => ({ success: true }));

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/test-data-expired',
        headers: { 'x-api-key': rawApiKey },
        payload: {},
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe(ErrorCode.API_KEY_EXPIRED);
    });

    it('returns 403 when associated project is disabled', async () => {
      project.status = ProjectStatus.DISABLED;

      const { createDataPlaneAuthMiddleware } = await import('../middleware/data-plane-auth.middleware.js');
      const authMiddleware = createDataPlaneAuthMiddleware({
        apiKeyRepository: mocks.mockApiKeyRepo as any,
        projectRepository: mocks.mockProjectRepo as any,
      });

      const app = await buildApp(testConfig);
      app.post('/api/v1/test-data-disabled', { preHandler: authMiddleware }, async () => ({ success: true }));

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/test-data-disabled',
        headers: { 'x-api-key': rawApiKey },
        payload: {},
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe(ErrorCode.PROJECT_DISABLED);
    });

    it('returns 404 when tenant has no active shard mapping', async () => {
      const { DataPlaneService } = await import('../services/data-plane.service.js');
      const service = new DataPlaneService(
        mocks.mockTenantMappingRepo as any,
        mocks.mockShardRepo as any,
        { execute: async () => ({ documents: [] }) } as any
      );

      await expect(
        service.processRequest(project, {
          tenantId: 'unmapped_tenant',
          operation: 'find',
          collection: 'users',
        })
      ).rejects.toThrow(/has no active shard mapping/i);
    });

    it('executes operation successfully when authenticated and mapped', async () => {
      const mockDatabaseExecutor = {
        execute: async () => ({
          documents: [{ _id: '1', name: 'Acme User' }],
        }),
      };

      const { DataPlaneService } = await import('../services/data-plane.service.js');
      const service = new DataPlaneService(
        mocks.mockTenantMappingRepo as any,
        mocks.mockShardRepo as any,
        mockDatabaseExecutor as any
      );

      const result = await service.processRequest(project, {
        tenantId: 'tenant_acme',
        operation: 'find',
        collection: 'users',
      });

      expect(result.message).toBe('Documents retrieved successfully');
      expect(result.data).toEqual({
        documents: [{ _id: '1', name: 'Acme User' }],
      });
    });
  });
});
