import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObjectId, type Db, type Collection } from 'mongodb';

import { UserRepository } from './user.repository.js';
import { UserStatus, type User } from '../models/user.model.js';

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
});
