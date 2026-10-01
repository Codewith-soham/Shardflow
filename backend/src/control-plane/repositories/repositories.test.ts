import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObjectId, type Db, type Collection } from 'mongodb';

import { UserRepository } from './user.repository.js';
import { UserStatus, type User } from '../models/user.model.js';
import { ProjectRepository } from './project.repository.js';
import { ProjectStatus, type Project } from '../models/project.model.js';
import { ApiKeyRepository } from './api-key.repository.js';
import { type ApiKey, hashApiKey, generateApiKey } from '../models/api-key.model.js';
import { initControlPlaneIndexes } from '../index.js';

describe('Control Plane Repositories - Generalized Test Suite', () => {
  describe('UserRepository', () => {
    let mockCollection: Partial<Collection<User>>;
    let mockDb: Db;
    let userRepo: UserRepository;
    let inMemoryStore: Map<string, User>;
    let createdIndexes: Array<{ spec: Record<string, number>; options?: any }>;

    beforeEach(() => {
      inMemoryStore = new Map<string, User>();
      createdIndexes = [];

      mockCollection = {
        createIndex: vi.fn(async (spec: any, options: any) => {
          createdIndexes.push({ spec, options });
          return 'index_created';
        }) as any,

        insertOne: vi.fn(async (doc: any) => {
          inMemoryStore.set(doc._id.toString(), { ...doc });
          return { acknowledged: true, insertedId: doc._id };
        }) as any,

        findOne: vi.fn(async (filter: any) => {
          for (const item of inMemoryStore.values()) {
            if (filter._id && filter._id.equals(item._id)) {
              return item;
            }
            if (filter.supabaseUserId && item.supabaseUserId === filter.supabaseUserId) {
              return item;
            }
            if (filter.email && item.email === filter.email) {
              return item;
            }
          }
          return null;
        }) as any,

        findOneAndUpdate: vi.fn(async (filter: any, update: any) => {
          for (const [id, item] of inMemoryStore.entries()) {
            if (filter._id && filter._id.equals(item._id)) {
              const updated = {
                ...item,
                ...update.$set,
              };
              inMemoryStore.set(id, updated);
              return updated;
            }
          }
          return null;
        }) as any,
      };

      mockDb = {
        collection: vi.fn().mockReturnValue(mockCollection),
      } as unknown as Db;

      userRepo = new UserRepository(mockDb);
    });

    it('creates unique supabaseUserId and email indexes in ensureIndexes', async () => {
      await userRepo.ensureIndexes();

      expect(mockCollection.createIndex).toHaveBeenCalledTimes(2);
      expect(createdIndexes).toEqual([
        {
          spec: { supabaseUserId: 1 },
          options: { unique: true, name: 'idx_users_supabaseUserId_unique' },
        },
        {
          spec: { email: 1 },
          options: { name: 'idx_users_email' },
        },
      ]);
    });

    it('creates a user with generated _id, timestamps, and default status', async () => {
      const user = await userRepo.create({
        supabaseUserId: 'sup_user_1',
        email: 'user1@shardflow.io',
        name: 'User One',
      });

      expect(user._id).toBeInstanceOf(ObjectId);
      expect(user.supabaseUserId).toBe('sup_user_1');
      expect(user.email).toBe('user1@shardflow.io');
      expect(user.name).toBe('User One');
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
    });

    it('finds user by ObjectId and string ID', async () => {
      const created = await userRepo.create({
        supabaseUserId: 'sup_user_2',
        email: 'user2@shardflow.io',
      });

      const foundByObjectId = await userRepo.findById(created._id);
      expect(foundByObjectId).not.toBeNull();
      expect(foundByObjectId?.supabaseUserId).toBe('sup_user_2');

      const foundByStringId = await userRepo.findById(created._id.toString());
      expect(foundByStringId).not.toBeNull();
      expect(foundByStringId?.email).toBe('user2@shardflow.io');

      const nonExistent = await userRepo.findById(new ObjectId());
      expect(nonExistent).toBeNull();
    });

    it('finds user by supabaseUserId', async () => {
      await userRepo.create({
        supabaseUserId: 'sup_unique_100',
        email: 'unique@shardflow.io',
      });

      const found = await userRepo.findBySupabaseUserId('sup_unique_100');
      expect(found).not.toBeNull();
      expect(found?.email).toBe('unique@shardflow.io');

      const notFound = await userRepo.findBySupabaseUserId('non_existent');
      expect(notFound).toBeNull();
    });

    it('finds user by email', async () => {
      await userRepo.create({
        supabaseUserId: 'sup_email_test',
        email: 'findme@shardflow.io',
      });

      const found = await userRepo.findByEmail('findme@shardflow.io');
      expect(found).not.toBeNull();
      expect(found?.supabaseUserId).toBe('sup_email_test');

      const notFound = await userRepo.findByEmail('notfound@shardflow.io');
      expect(notFound).toBeNull();
    });

    it('updates user fields and modifies updatedAt', async () => {
      const created = await userRepo.create({
        supabaseUserId: 'sup_update_test',
        email: 'old@shardflow.io',
        name: 'Old Name',
      });

      const updated = await userRepo.update(created._id, {
        name: 'New Name',
        status: UserStatus.DISABLED,
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('New Name');
      expect(updated?.status).toBe(UserStatus.DISABLED);
      expect(updated?.email).toBe('old@shardflow.io');
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.createdAt.getTime());
    });
  });

  describe('ProjectRepository', () => {
    let mockCollection: Partial<Collection<Project>>;
    let mockDb: Db;
    let projectRepo: ProjectRepository;
    let inMemoryStore: Map<string, Project>;
    let createdIndexes: Array<{ spec: Record<string, number>; options?: any }>;

    beforeEach(() => {
      inMemoryStore = new Map<string, Project>();
      createdIndexes = [];

      mockCollection = {
        createIndex: vi.fn(async (spec: any, options: any) => {
          createdIndexes.push({ spec, options });
          return 'index_created';
        }) as any,

        insertOne: vi.fn(async (doc: any) => {
          inMemoryStore.set(doc._id.toString(), { ...doc });
          return { acknowledged: true, insertedId: doc._id };
        }) as any,

        findOne: vi.fn(async (filter: any) => {
          for (const item of inMemoryStore.values()) {
            let matches = true;

            if (filter._id && !filter._id.equals(item._id)) {
              matches = false;
            }
            if (filter.ownerId && !filter.ownerId.equals(item.ownerId)) {
              matches = false;
            }
            if (filter.name && item.name !== filter.name) {
              matches = false;
            }

            if (matches) return item;
          }
          return null;
        }) as any,

        find: vi.fn((filter: any) => {
          const results: Project[] = [];
          for (const item of inMemoryStore.values()) {
            let matches = true;
            if (filter.ownerId && !filter.ownerId.equals(item.ownerId)) {
              matches = false;
            }
            if (matches) results.push(item);
          }
          return {
            toArray: async () => results,
          } as any;
        }) as any,

        findOneAndUpdate: vi.fn(async (filter: any, update: any) => {
          for (const [id, item] of inMemoryStore.entries()) {
            let matches = true;
            if (filter._id && !filter._id.equals(item._id)) {
              matches = false;
            }
            if (filter.ownerId && !filter.ownerId.equals(item.ownerId)) {
              matches = false;
            }

            if (matches) {
              const updated = {
                ...item,
                ...update.$set,
              };
              inMemoryStore.set(id, updated);
              return updated;
            }
          }
          return null;
        }) as any,

        deleteOne: vi.fn(async (filter: any) => {
          for (const [id, item] of inMemoryStore.entries()) {
            if (filter._id && filter._id.equals(item._id)) {
              inMemoryStore.delete(id);
              return { acknowledged: true, deletedCount: 1 };
            }
          }
          return { acknowledged: true, deletedCount: 0 };
        }) as any,
      };

      mockDb = {
        collection: vi.fn().mockReturnValue(mockCollection),
      } as unknown as Db;

      projectRepo = new ProjectRepository(mockDb);
    });

    it('creates ownerId and compound unique ownerId + name indexes in ensureIndexes', async () => {
      await projectRepo.ensureIndexes();

      expect(mockCollection.createIndex).toHaveBeenCalledTimes(2);
      expect(createdIndexes).toEqual([
        {
          spec: { ownerId: 1 },
          options: { name: 'idx_projects_ownerId' },
        },
        {
          spec: { ownerId: 1, name: 1 },
          options: { unique: true, name: 'idx_projects_ownerId_name_unique' },
        },
      ]);
    });

    it('creates a project with generated _id, timestamps, and default status', async () => {
      const ownerId = new ObjectId();
      const project = await projectRepo.create({
        ownerId: ownerId.toHexString(),
        name: 'Production Cluster',
        description: 'Primary customer shard group',
      });

      expect(project._id).toBeInstanceOf(ObjectId);
      expect(project.ownerId).toBeInstanceOf(ObjectId);
      expect(project.ownerId.equals(ownerId)).toBe(true);
      expect(project.name).toBe('Production Cluster');
      expect(project.description).toBe('Primary customer shard group');
      expect(project.status).toBe(ProjectStatus.ACTIVE);
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
    });

    it('finds project by ObjectId and string ID', async () => {
      const ownerId = new ObjectId();
      const created = await projectRepo.create({
        ownerId,
        name: 'Staging Cluster',
      });

      const foundByObjectId = await projectRepo.findById(created._id);
      expect(foundByObjectId).not.toBeNull();
      expect(foundByObjectId?.name).toBe('Staging Cluster');

      const foundByStringId = await projectRepo.findById(created._id.toString());
      expect(foundByStringId).not.toBeNull();
      expect(foundByStringId?.name).toBe('Staging Cluster');

      const nonExistent = await projectRepo.findById(new ObjectId());
      expect(nonExistent).toBeNull();
    });

    it('finds project by id and ownerId ensuring scope isolation', async () => {
      const ownerId = new ObjectId();
      const otherOwnerId = new ObjectId();

      const created = await projectRepo.create({
        ownerId,
        name: 'Scoped Project',
      });

      const found = await projectRepo.findByIdAndOwnerId(created._id, ownerId);
      expect(found).not.toBeNull();
      expect(found?.name).toBe('Scoped Project');

      const unauthorized = await projectRepo.findByIdAndOwnerId(created._id, otherOwnerId);
      expect(unauthorized).toBeNull();
    });

    it('finds all projects belonging to an owner', async () => {
      const ownerA = new ObjectId();
      const ownerB = new ObjectId();

      await projectRepo.create({ ownerId: ownerA, name: 'Project A1' });
      await projectRepo.create({ ownerId: ownerA, name: 'Project A2' });
      await projectRepo.create({ ownerId: ownerB, name: 'Project B1' });

      const ownerAProjects = await projectRepo.findByOwnerId(ownerA);
      expect(ownerAProjects).toHaveLength(2);
      expect(ownerAProjects.map((p) => p.name)).toEqual(['Project A1', 'Project A2']);

      const ownerBProjects = await projectRepo.findByOwnerId(ownerB.toHexString());
      expect(ownerBProjects).toHaveLength(1);
      expect(ownerBProjects[0]?.name).toBe('Project B1');
    });

    it('finds project by ownerId and name', async () => {
      const ownerId = new ObjectId();
      await projectRepo.create({ ownerId, name: 'Unique Name' });

      const found = await projectRepo.findByOwnerIdAndName(ownerId, 'Unique Name');
      expect(found).not.toBeNull();
      expect(found?.name).toBe('Unique Name');

      const notFound = await projectRepo.findByOwnerIdAndName(ownerId, 'Other Name');
      expect(notFound).toBeNull();
    });

    it('updates project fields and refreshes updatedAt', async () => {
      const ownerId = new ObjectId();
      const created = await projectRepo.create({
        ownerId,
        name: 'Initial Name',
        description: 'Old description',
      });

      const updated = await projectRepo.update(created._id, {
        name: 'Updated Name',
        description: 'New description',
        status: ProjectStatus.DISABLED,
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.description).toBe('New description');
      expect(updated?.status).toBe(ProjectStatus.DISABLED);
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.createdAt.getTime());
    });

    it('updates project scoped by ownerId and prevents cross-owner updates', async () => {
      const ownerId = new ObjectId();
      const unauthorizedOwnerId = new ObjectId();

      const created = await projectRepo.create({
        ownerId,
        name: 'Scoped Update Target',
      });

      const failedUpdate = await projectRepo.updateByIdAndOwnerId(
        created._id,
        unauthorizedOwnerId,
        { name: 'Hacked Name' }
      );
      expect(failedUpdate).toBeNull();

      const successfulUpdate = await projectRepo.updateByIdAndOwnerId(
        created._id,
        ownerId,
        { name: 'Authorized Update' }
      );
      expect(successfulUpdate).not.toBeNull();
      expect(successfulUpdate?.name).toBe('Authorized Update');
    });

    it('disables a project via disable helper', async () => {
      const ownerId = new ObjectId();
      const created = await projectRepo.create({
        ownerId,
        name: 'To Be Disabled',
      });

      const disabled = await projectRepo.disable(created._id, ownerId);
      expect(disabled).not.toBeNull();
      expect(disabled?.status).toBe(ProjectStatus.DISABLED);
    });

    it('deletes a project document', async () => {
      const ownerId = new ObjectId();
      const created = await projectRepo.create({
        ownerId,
        name: 'To Be Deleted',
      });

      const deleted = await projectRepo.delete(created._id);
      expect(deleted).toBe(true);

      const foundAfterDelete = await projectRepo.findById(created._id);
      expect(foundAfterDelete).toBeNull();

      const secondDelete = await projectRepo.delete(created._id);
      expect(secondDelete).toBe(false);
    });
  });

  describe('ApiKeyRepository', () => {
    let mockCollection: Partial<Collection<ApiKey>>;
    let mockDb: Db;
    let apiKeyRepo: ApiKeyRepository;
    let inMemoryStore: Map<string, ApiKey>;
    let createdIndexes: Array<{ spec: Record<string, number>; options?: any }>;

    beforeEach(() => {
      inMemoryStore = new Map<string, ApiKey>();
      createdIndexes = [];

      mockCollection = {
        createIndex: vi.fn(async (spec: any, options: any) => {
          createdIndexes.push({ spec, options });
          return 'index_created';
        }) as any,

        insertOne: vi.fn(async (doc: any) => {
          inMemoryStore.set(doc._id.toString(), { ...doc });
          return { acknowledged: true, insertedId: doc._id };
        }) as any,

        findOne: vi.fn(async (filter: any) => {
          for (const item of inMemoryStore.values()) {
            let matches = true;

            if (filter._id && !filter._id.equals(item._id)) {
              matches = false;
            }
            if (filter.projectId && !filter.projectId.equals(item.projectId)) {
              matches = false;
            }
            if (filter.keyHash && item.keyHash !== filter.keyHash) {
              matches = false;
            }
            if (filter.revokedAt === null && item.revokedAt !== null) {
              matches = false;
            }
            if (filter.$or) {
              // $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
              const passesOr = filter.$or.some((clause: any) => {
                if (clause.expiresAt === null && item.expiresAt === null) return true;
                if (
                  clause.expiresAt?.$gt &&
                  item.expiresAt &&
                  item.expiresAt.getTime() > clause.expiresAt.$gt.getTime()
                ) {
                  return true;
                }
                return false;
              });
              if (!passesOr) matches = false;
            }

            if (matches) return item;
          }
          return null;
        }) as any,

        find: vi.fn((filter: any) => {
          const results: ApiKey[] = [];
          for (const item of inMemoryStore.values()) {
            let matches = true;
            if (filter.projectId && !filter.projectId.equals(item.projectId)) {
              matches = false;
            }
            if (filter.revokedAt === null && item.revokedAt !== null) {
              matches = false;
            }
            if (matches) results.push(item);
          }
          return {
            toArray: async () => results,
          } as any;
        }) as any,

        findOneAndUpdate: vi.fn(async (filter: any, update: any) => {
          for (const [id, item] of inMemoryStore.entries()) {
            let matches = true;
            if (filter._id && !filter._id.equals(item._id)) {
              matches = false;
            }
            if (filter.projectId && !filter.projectId.equals(item.projectId)) {
              matches = false;
            }

            if (matches) {
              const updated = {
                ...item,
                ...update.$set,
              };
              inMemoryStore.set(id, updated);
              return updated;
            }
          }
          return null;
        }) as any,

        deleteOne: vi.fn(async (filter: any) => {
          for (const [id, item] of inMemoryStore.entries()) {
            if (filter._id && filter._id.equals(item._id)) {
              inMemoryStore.delete(id);
              return { acknowledged: true, deletedCount: 1 };
            }
          }
          return { acknowledged: true, deletedCount: 0 };
        }) as any,
      };

      mockDb = {
        collection: vi.fn().mockReturnValue(mockCollection),
      } as unknown as Db;

      apiKeyRepo = new ApiKeyRepository(mockDb);
    });

    it('creates projectId, unique keyHash, and compound projectId+revokedAt indexes in ensureIndexes', async () => {
      await apiKeyRepo.ensureIndexes();

      expect(mockCollection.createIndex).toHaveBeenCalledTimes(3);
      expect(createdIndexes).toEqual([
        {
          spec: { projectId: 1 },
          options: { name: 'idx_apiKeys_projectId' },
        },
        {
          spec: { keyHash: 1 },
          options: { unique: true, name: 'idx_apiKeys_keyHash_unique' },
        },
        {
          spec: { projectId: 1, revokedAt: 1 },
          options: { name: 'idx_apiKeys_projectId_revokedAt' },
        },
      ]);
    });

    it('creates an API key with generated _id, timestamps, and null initial state fields', async () => {
      const projectId = new ObjectId();
      const hash = hashApiKey('sf_live_initial_token_123');
      const apiKey = await apiKeyRepo.create({
        projectId: projectId.toHexString(),
        name: 'Default Production Key',
        keyHash: hash,
      });

      expect(apiKey._id).toBeInstanceOf(ObjectId);
      expect(apiKey.projectId).toBeInstanceOf(ObjectId);
      expect(apiKey.projectId.equals(projectId)).toBe(true);
      expect(apiKey.name).toBe('Default Production Key');
      expect(apiKey.keyHash).toBe(hash);
      expect(apiKey.lastUsedAt).toBeNull();
      expect(apiKey.expiresAt).toBeNull();
      expect(apiKey.revokedAt).toBeNull();
      expect(apiKey.createdAt).toBeInstanceOf(Date);
      expect(apiKey.updatedAt).toBeInstanceOf(Date);
      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
    });

    it('finds API key by ObjectId and string ID', async () => {
      const projectId = new ObjectId();
      const created = await apiKeyRepo.create({
        projectId,
        name: 'Lookup Key',
        keyHash: hashApiKey('sf_live_lookup_key'),
      });

      const foundByObjectId = await apiKeyRepo.findById(created._id);
      expect(foundByObjectId).not.toBeNull();
      expect(foundByObjectId?.name).toBe('Lookup Key');

      const foundByStringId = await apiKeyRepo.findById(created._id.toString());
      expect(foundByStringId).not.toBeNull();
      expect(foundByStringId?.name).toBe('Lookup Key');

      const nonExistent = await apiKeyRepo.findById(new ObjectId());
      expect(nonExistent).toBeNull();
    });

    it('finds API key by id and projectId ensuring project isolation', async () => {
      const projectId = new ObjectId();
      const otherProjectId = new ObjectId();

      const created = await apiKeyRepo.create({
        projectId,
        name: 'Scoped Key',
        keyHash: hashApiKey('sf_live_scoped_key'),
      });

      const found = await apiKeyRepo.findByIdAndProjectId(created._id, projectId);
      expect(found).not.toBeNull();
      expect(found?.name).toBe('Scoped Key');

      const unauthorized = await apiKeyRepo.findByIdAndProjectId(created._id, otherProjectId);
      expect(unauthorized).toBeNull();
    });

    it('finds API key by deterministic keyHash', async () => {
      const projectId = new ObjectId();
      const hash = hashApiKey('sf_live_find_hash_secret');

      await apiKeyRepo.create({
        projectId,
        name: 'Secret Key',
        keyHash: hash,
      });

      const found = await apiKeyRepo.findByKeyHash(hash);
      expect(found).not.toBeNull();
      expect(found?.name).toBe('Secret Key');

      const notFound = await apiKeyRepo.findByKeyHash('non_existent_hash');
      expect(notFound).toBeNull();
    });

    it('finds active API key via findActiveByKeyHash and excludes revoked or expired keys', async () => {
      const projectId = new ObjectId();
      const activeHash = hashApiKey('sf_live_active_key');
      const futureExpiry = new Date(Date.now() + 1000 * 60 * 60);

      await apiKeyRepo.create({
        projectId,
        name: 'Active Key',
        keyHash: activeHash,
        expiresAt: futureExpiry,
      });

      const foundActive = await apiKeyRepo.findActiveByKeyHash(activeHash);
      expect(foundActive).not.toBeNull();
      expect(foundActive?.name).toBe('Active Key');

      // Revoke the key and check
      await apiKeyRepo.revoke(foundActive!._id);
      const foundRevoked = await apiKeyRepo.findActiveByKeyHash(activeHash);
      expect(foundRevoked).toBeNull();

      // Expired key check
      const expiredHash = hashApiKey('sf_live_expired_key');
      const pastExpiry = new Date(Date.now() - 1000 * 60);
      await apiKeyRepo.create({
        projectId,
        name: 'Expired Key',
        keyHash: expiredHash,
        expiresAt: pastExpiry,
      });

      const foundExpired = await apiKeyRepo.findActiveByKeyHash(expiredHash);
      expect(foundExpired).toBeNull();
    });

    it('finds all API keys by projectId with optional revoked filtering', async () => {
      const projectId = new ObjectId();

      const key1 = await apiKeyRepo.create({
        projectId,
        name: 'Key 1',
        keyHash: hashApiKey('key_1'),
      });
      await apiKeyRepo.create({
        projectId,
        name: 'Key 2',
        keyHash: hashApiKey('key_2'),
      });

      // Revoke key1
      await apiKeyRepo.revoke(key1._id);

      const allKeys = await apiKeyRepo.findByProjectId(projectId, true);
      expect(allKeys).toHaveLength(2);

      const activeKeysOnly = await apiKeyRepo.findByProjectId(projectId, false);
      expect(activeKeysOnly).toHaveLength(1);
      expect(activeKeysOnly[0]?.name).toBe('Key 2');
    });

    it('updates API key fields and lastUsedAt timestamp', async () => {
      const projectId = new ObjectId();
      const created = await apiKeyRepo.create({
        projectId,
        name: 'Old Label',
        keyHash: hashApiKey('sf_live_usage_test'),
      });

      const updated = await apiKeyRepo.update(created._id, {
        name: 'Renamed Key Label',
      });
      expect(updated?.name).toBe('Renamed Key Label');

      const usedTime = new Date();
      const used = await apiKeyRepo.updateLastUsed(created._id, usedTime);
      expect(used?.lastUsedAt).toEqual(usedTime);
    });

    it('revokes an API key scoped by projectId', async () => {
      const projectId = new ObjectId();
      const unauthorizedProjectId = new ObjectId();

      const created = await apiKeyRepo.create({
        projectId,
        name: 'Revocation Target',
        keyHash: hashApiKey('sf_live_revoke_secret'),
      });

      const failedRevoke = await apiKeyRepo.revoke(created._id, unauthorizedProjectId);
      expect(failedRevoke).toBeNull();

      const successfulRevoke = await apiKeyRepo.revoke(created._id, projectId);
      expect(successfulRevoke).not.toBeNull();
      expect(successfulRevoke?.revokedAt).toBeInstanceOf(Date);
    });

    it('deletes an API key document', async () => {
      const projectId = new ObjectId();
      const created = await apiKeyRepo.create({
        projectId,
        name: 'Delete Target',
        keyHash: hashApiKey('sf_live_delete_secret'),
      });

      const deleted = await apiKeyRepo.delete(created._id);
      expect(deleted).toBe(true);

      const foundAfter = await apiKeyRepo.findById(created._id);
      expect(foundAfter).toBeNull();

      const secondDelete = await apiKeyRepo.delete(created._id);
      expect(secondDelete).toBe(false);
    });
  });

  describe('End-to-End Persistence Lifecycle & Cross-Repository Integrity', () => {
    it('initializes all control plane indexes concurrently across repositories', async () => {
      const mockCreatedIndexes: Record<string, any[]> = {
        users: [],
        projects: [],
        apiKeys: [],
      };

      const mockDb = {
        collection: vi.fn((colName: string) => ({
          createIndex: vi.fn(async (spec: any, options: any) => {
            mockCreatedIndexes[colName]?.push({ spec, options });
            return 'index_created';
          }),
        })),
      } as unknown as Db;

      await initControlPlaneIndexes(mockDb);

      expect(mockDb.collection).toHaveBeenCalledWith('users');
      expect(mockDb.collection).toHaveBeenCalledWith('projects');
      expect(mockDb.collection).toHaveBeenCalledWith('apiKeys');

      // Users: 2 indexes (supabaseUserId unique, email)
      expect(mockCreatedIndexes.users).toHaveLength(2);
      // Projects: 2 indexes (ownerId, ownerId + name unique)
      expect(mockCreatedIndexes.projects).toHaveLength(2);
      // ApiKeys: 3 indexes (projectId, keyHash unique, projectId + revokedAt)
      expect(mockCreatedIndexes.apiKeys).toHaveLength(3);
    });

    it('executes complete cross-entity persistence workflow: User -> Project -> API Key', async () => {
      // In-memory collections to simulate multi-collection MongoDB DB
      const userStore = new Map<string, User>();
      const projectStore = new Map<string, Project>();
      const apiKeyStore = new Map<string, ApiKey>();

      const mockDb = {
        collection: vi.fn((colName: string) => {
          if (colName === 'users') {
            return {
              createIndex: vi.fn(),
              insertOne: vi.fn(async (doc: any) => {
                userStore.set(doc._id.toString(), { ...doc });
                return { acknowledged: true, insertedId: doc._id };
              }),
              findOne: vi.fn(async (filter: any) => {
                for (const item of userStore.values()) {
                  if (filter._id && filter._id.equals(item._id)) return item;
                  if (filter.supabaseUserId && item.supabaseUserId === filter.supabaseUserId) return item;
                }
                return null;
              }),
              findOneAndUpdate: vi.fn(async (filter: any, update: any) => {
                for (const [id, item] of userStore.entries()) {
                  if (filter._id && filter._id.equals(item._id)) {
                    const updated = { ...item, ...update.$set };
                    userStore.set(id, updated);
                    return updated;
                  }
                }
                return null;
              }),
            };
          }
          if (colName === 'projects') {
            return {
              createIndex: vi.fn(),
              insertOne: vi.fn(async (doc: any) => {
                projectStore.set(doc._id.toString(), { ...doc });
                return { acknowledged: true, insertedId: doc._id };
              }),
              findOne: vi.fn(async (filter: any) => {
                for (const item of projectStore.values()) {
                  let matches = true;
                  if (filter._id && !filter._id.equals(item._id)) matches = false;
                  if (filter.ownerId && !filter.ownerId.equals(item.ownerId)) matches = false;
                  if (matches) return item;
                }
                return null;
              }),
              find: vi.fn((filter: any) => {
                const results: Project[] = [];
                for (const item of projectStore.values()) {
                  if (filter.ownerId && filter.ownerId.equals(item.ownerId)) {
                    results.push(item);
                  }
                }
                return { toArray: async () => results };
              }),
              findOneAndUpdate: vi.fn(async (filter: any, update: any) => {
                for (const [id, item] of projectStore.entries()) {
                  let matches = true;
                  if (filter._id && !filter._id.equals(item._id)) matches = false;
                  if (filter.ownerId && !filter.ownerId.equals(item.ownerId)) matches = false;
                  if (matches) {
                    const updated = { ...item, ...update.$set };
                    projectStore.set(id, updated);
                    return updated;
                  }
                }
                return null;
              }),
            };
          }
          if (colName === 'apiKeys') {
            return {
              createIndex: vi.fn(),
              insertOne: vi.fn(async (doc: any) => {
                apiKeyStore.set(doc._id.toString(), { ...doc });
                return { acknowledged: true, insertedId: doc._id };
              }),
              findOne: vi.fn(async (filter: any) => {
                for (const item of apiKeyStore.values()) {
                  let matches = true;
                  if (filter._id && !filter._id.equals(item._id)) matches = false;
                  if (filter.projectId && !filter.projectId.equals(item.projectId)) matches = false;
                  if (filter.keyHash && item.keyHash !== filter.keyHash) matches = false;
                  if (filter.revokedAt === null && item.revokedAt !== null) matches = false;
                  if (filter.$or) {
                    const passes = filter.$or.some((c: any) => {
                      if (c.expiresAt === null && item.expiresAt === null) return true;
                      if (c.expiresAt?.$gt && item.expiresAt && item.expiresAt > c.expiresAt.$gt) return true;
                      return false;
                    });
                    if (!passes) matches = false;
                  }
                  if (matches) return item;
                }
                return null;
              }),
              find: vi.fn((filter: any) => {
                const results: ApiKey[] = [];
                for (const item of apiKeyStore.values()) {
                  if (filter.projectId && filter.projectId.equals(item.projectId)) {
                    if (filter.revokedAt === null && item.revokedAt !== null) continue;
                    results.push(item);
                  }
                }
                return { toArray: async () => results };
              }),
              findOneAndUpdate: vi.fn(async (filter: any, update: any) => {
                for (const [id, item] of apiKeyStore.entries()) {
                  let matches = true;
                  if (filter._id && !filter._id.equals(item._id)) matches = false;
                  if (filter.projectId && !filter.projectId.equals(item.projectId)) matches = false;
                  if (matches) {
                    const updated = { ...item, ...update.$set };
                    apiKeyStore.set(id, updated);
                    return updated;
                  }
                }
                return null;
              }),
            };
          }
          throw new Error(`Unknown collection: ${colName}`);
        }),
      } as unknown as Db;

      const userRepo = new UserRepository(mockDb);
      const projectRepo = new ProjectRepository(mockDb);
      const apiKeyRepo = new ApiKeyRepository(mockDb);

      // 1. User registers via Supabase auth identity
      const user = await userRepo.create({
        supabaseUserId: 'supabase_auth_id_999',
        email: 'founder@saas.com',
        name: 'Saas Founder',
      });
      expect(user._id).toBeInstanceOf(ObjectId);
      expect(user.status).toBe(UserStatus.ACTIVE);

      // 2. User creates a Project
      const project = await projectRepo.create({
        ownerId: user._id,
        name: 'Production ShardFlow Cluster',
        description: 'Multi-tenant routing instance',
      });
      expect(project._id).toBeInstanceOf(ObjectId);
      expect(project.ownerId.equals(user._id)).toBe(true);

      // 3. Unauthorized access check: Another user cannot view or mutate the project
      const unauthorizedUserId = new ObjectId();
      const unauthorizedLookup = await projectRepo.findByIdAndOwnerId(project._id, unauthorizedUserId);
      expect(unauthorizedLookup).toBeNull();

      const unauthorizedUpdate = await projectRepo.updateByIdAndOwnerId(
        project._id,
        unauthorizedUserId,
        { name: 'Hijacked' }
      );
      expect(unauthorizedUpdate).toBeNull();

      // 4. Project generates an API key
      const { rawKey, keyHash } = generateApiKey();
      const apiKey = await apiKeyRepo.create({
        projectId: project._id,
        name: 'Production Data-Plane Key',
        keyHash,
      });
      expect(apiKey.projectId.equals(project._id)).toBe(true);
      expect(apiKey.revokedAt).toBeNull();

      // 5. Data plane authenticates incoming request with rawKey
      const incomingHash = hashApiKey(rawKey);
      const resolvedKey = await apiKeyRepo.findActiveByKeyHash(incomingHash);
      expect(resolvedKey).not.toBeNull();
      expect(resolvedKey?.projectId.equals(project._id)).toBe(true);

      // 6. Data plane records successful invocation
      const usedTimestamp = new Date();
      const updatedKey = await apiKeyRepo.updateLastUsed(resolvedKey!._id, usedTimestamp);
      expect(updatedKey?.lastUsedAt).toEqual(usedTimestamp);

      // 7. Security: Another project cannot revoke this key
      const otherProjectId = new ObjectId();
      const unauthorizedRevocation = await apiKeyRepo.revoke(apiKey._id, otherProjectId);
      expect(unauthorizedRevocation).toBeNull();

      // 8. Legitimate owner revokes the key
      const revoked = await apiKeyRepo.revoke(apiKey._id, project._id);
      expect(revoked).not.toBeNull();
      expect(revoked?.revokedAt).toBeInstanceOf(Date);

      // 9. Subsequent Data Plane requests immediately fail auth
      const rejectedKey = await apiKeyRepo.findActiveByKeyHash(incomingHash);
      expect(rejectedKey).toBeNull();

      // 10. User disables the project
      const disabledProject = await projectRepo.disable(project._id, user._id);
      expect(disabledProject?.status).toBe(ProjectStatus.DISABLED);
    });
  });
});



