import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../../app.js';
import type { AppConfig } from '../../config/index.js';
import { ErrorCode } from '../../errors/codes.js';
import { AuthService } from '../../auth/auth.service.js';
import { UserRepository } from '../../control-plane/repositories/user.repository.js';
import { ProjectRepository } from '../../control-plane/repositories/project.repository.js';
import {
  ApiKeyRepository,
  API_KEYS_COLLECTION,
} from '../../control-plane/repositories/api-key.repository.js';
import { ProjectService } from '../../control-plane/services/project.service.js';
import { ApiKeyService } from '../../control-plane/services/api-key.service.js';
import { hashApiKey } from '../../control-plane/models/api-key.model.js';
import { createFakeDb } from '../../test-utils/fake-db.js';

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

describe('API key lifecycle: create, use, revoke, cross-project', () => {
  const db = createFakeDb();
  let app: FastifyInstance;

  const call = (token: string, method: string, url: string, payload?: unknown) =>
    app.inject({
      method: method as 'GET',
      url,
      headers: { authorization: `Bearer ${token}` },
      ...(payload !== undefined ? { payload: payload as any } : {}),
    });

  /** Hits the data plane; the stub controller echoes the project the key resolved to. */
  const useKey = (key: string) =>
    app.inject({
      method: 'POST',
      url: '/api/v1/data',
      headers: { 'x-api-key': key },
      payload: { tenantId: 't1', operation: 'find', collection: 'users' },
    });

  let projectA: string;
  let projectB: string;
  let keyA: { id: string; key: string };
  let keyB: { id: string; key: string };

  async function createProjectWithKey(token: string, name: string) {
    const project = await call(token, 'POST', '/api/v1/projects', { name });
    const projectId = project.json().data.id as string;
    const created = await call(token, 'POST', `/api/v1/projects/${projectId}/api-keys`, {
      name: `${name}-key`,
    });
    expect(created.statusCode).toBe(201);
    return { projectId, key: created.json().data as { id: string; key: string } };
  }

  beforeAll(async () => {
    const userRepository = new UserRepository(db);
    const projectService = new ProjectService(new ProjectRepository(db));
    const apiKeyRepository = new ApiKeyRepository(db);

    app = await buildApp(testConfig, {
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
      dataPlaneController: {
        execute: async (request: any, reply: any) =>
          reply.send({ projectId: request.dataPlaneContext.project._id.toString() }),
      } as any,
      dataPlaneAuthOptions: {
        apiKeyRepository,
        projectRepository: new ProjectRepository(db),
      },
    });

    const a = await createProjectWithKey('token-a', 'project-a');
    const b = await createProjectWithKey('token-b', 'project-b');
    projectA = a.projectId;
    projectB = b.projectId;
    keyA = a.key;
    keyB = b.key;
  });

  describe('creation and storage', () => {
    it('returns the full key in the create response', () => {
      expect(keyA.key).toMatch(/^sf_live_[0-9a-f]{48}$/);
    });

    it('stores only the hash: the raw key is nowhere in the database', async () => {
      const docs = await db.collection(API_KEYS_COLLECTION).find({}).toArray();
      const serialized = JSON.stringify(docs);

      expect(docs).toHaveLength(2);
      expect(serialized).not.toContain(keyA.key);
      expect(serialized).not.toContain(keyB.key);
      expect(docs.map((d: any) => d.keyHash)).toContain(hashApiKey(keyA.key));
    });
  });

  describe('list responses never expose key material', () => {
    it('contains neither the raw key nor its hash', async () => {
      const res = await call('token-a', 'GET', `/api/v1/projects/${projectA}/api-keys`);

      expect(res.statusCode).toBe(200);
      expect(res.body).not.toContain(keyA.key);
      expect(res.body).not.toContain(hashApiKey(keyA.key));
      expect(res.json().data.apiKeys[0]).not.toHaveProperty('key');
      expect(res.json().data.apiKeys[0]).not.toHaveProperty('keyHash');
    });
  });

  describe('use and project binding', () => {
    it('a key authenticates and resolves only to its own project', async () => {
      const resA = await useKey(keyA.key);
      const resB = await useKey(keyB.key);

      expect(resA.statusCode).toBe(200);
      expect(resA.json().projectId).toBe(projectA);
      expect(resB.statusCode).toBe(200);
      expect(resB.json().projectId).toBe(projectB);
    });

    it('ignores client-supplied project hints: key A cannot be pointed at project B', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/data?projectId=' + projectB,
        headers: { 'x-api-key': keyA.key, 'x-project-id': projectB },
        payload: { projectId: projectB, tenantId: 't1', operation: 'find', collection: 'users' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().projectId).toBe(projectA);
    });

    it('project A key is rejected on project B control-plane resources', async () => {
      for (const headers of [{ 'x-api-key': keyA.key }, { authorization: `Bearer ${keyA.key}` }]) {
        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/projects/${projectB}/shards`,
          headers,
        });

        expect(res.statusCode).toBe(401);
      }
    });

    it('rejects an unknown key with 401 INVALID_API_KEY and does not echo it', async () => {
      const unknown = 'sf_live_' + '0'.repeat(48);
      const res = await useKey(unknown);

      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe(ErrorCode.INVALID_API_KEY);
      expect(res.body).not.toContain(unknown);
    });

    it('rejects the stored hash presented as a key', async () => {
      const res = await useKey(hashApiKey(keyA.key));

      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe(ErrorCode.INVALID_API_KEY);
    });

    it('rejects an expired key with 401 API_KEY_EXPIRED', async () => {
      const created = await call('token-a', 'POST', `/api/v1/projects/${projectA}/api-keys`, {
        name: 'expired',
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      });
      const res = await useKey(created.json().data.key);

      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe(ErrorCode.API_KEY_EXPIRED);
    });
  });

  describe('revocation', () => {
    it('user B cannot revoke project A key', async () => {
      const created = await call('token-a', 'POST', `/api/v1/projects/${projectA}/api-keys`, {
        name: 'another',
      });
      const { id, key } = created.json().data;

      const res = await call('token-b', 'DELETE', `/api/v1/projects/${projectA}/api-keys/${id}`);

      expect(res.statusCode).toBe(403);
      expect((await useKey(key)).statusCode).toBe(200);
    });

    it('stops the key working immediately, and only that key', async () => {
      expect((await useKey(keyA.key)).statusCode).toBe(200);

      const revoke = await call(
        'token-a',
        'DELETE',
        `/api/v1/projects/${projectA}/api-keys/${keyA.id}`
      );
      expect(revoke.statusCode).toBe(200);
      expect(revoke.body).not.toContain(keyA.key);

      const after = await useKey(keyA.key);
      expect(after.statusCode).toBe(401);
      expect(after.json().error.code).toBe(ErrorCode.API_KEY_REVOKED);

      expect((await useKey(keyB.key)).statusCode).toBe(200);
    });
  });
});
