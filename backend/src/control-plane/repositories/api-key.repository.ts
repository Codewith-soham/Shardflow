import { Collection, ObjectId, type Db, type Filter } from 'mongodb';

import { getDatabase } from '../../database/client.js';
import {
  type ApiKey,
  type CreateApiKeyData,
  type UpdateApiKeyData,
} from '../models/api-key.model.js';

export const API_KEYS_COLLECTION = 'apiKeys';

export class ApiKeyRepository {
  private readonly db: Db;
  private readonly collection: Collection<ApiKey>;

  constructor(db?: Db) {
    this.db = db ?? getDatabase();
    this.collection = this.db.collection<ApiKey>(API_KEYS_COLLECTION);
  }

  /**
   * Creates the required indexes for the apiKeys collection as specified in database-design.md:
   * - index on projectId
   * - unique index on keyHash (required for Data Plane authentication lookup)
   * - compound index on projectId + revokedAt
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex(
      { projectId: 1 },
      { name: 'idx_apiKeys_projectId' }
    );
    await this.collection.createIndex(
      { keyHash: 1 },
      { unique: true, name: 'idx_apiKeys_keyHash_unique' }
    );
    await this.collection.createIndex(
      { projectId: 1, revokedAt: 1 },
      { name: 'idx_apiKeys_projectId_revokedAt' }
    );
  }

  /**
   * Persists a new API key document.
   */
  async create(data: CreateApiKeyData): Promise<ApiKey> {
    const now = new Date();
    const projectObjectId =
      typeof data.projectId === 'string' ? new ObjectId(data.projectId) : data.projectId;

    const doc: ApiKey = {
      _id: new ObjectId(),
      projectId: projectObjectId,
      name: data.name,
      keyHash: data.keyHash,
      lastUsedAt: null,
      expiresAt: data.expiresAt ?? null,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(doc as any);
    return doc;
  }

  /**
   * Finds an API key by internal MongoDB ObjectId.
   */
  async findById(id: string | ObjectId): Promise<ApiKey | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return this.collection.findOne({ _id: objectId });
  }

  /**
   * Finds an API key scoped by its ObjectId and owning projectId.
   */
  async findByIdAndProjectId(
    id: string | ObjectId,
    projectId: string | ObjectId
  ): Promise<ApiKey | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const projectObjectId =
      typeof projectId === 'string' ? new ObjectId(projectId) : projectId;
    return this.collection.findOne({ _id: objectId, projectId: projectObjectId });
  }

  /**
   * Finds an API key by its deterministic SHA-256 key hash (used in Data Plane auth).
   */
  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    return this.collection.findOne({ keyHash });
  }

  /**
   * Finds an active API key by its keyHash directly via database query.
   * A key is active when revokedAt is null and (expiresAt is null or expiresAt > now).
   */
  async findActiveByKeyHash(keyHash: string, now: Date = new Date()): Promise<ApiKey | null> {
    const filter: Filter<ApiKey> = {
      keyHash,
      revokedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    };
    return this.collection.findOne(filter);
  }

  /**
   * Finds all API keys belonging to a project, optionally filtering active keys only.
   */
  async findByProjectId(
    projectId: string | ObjectId,
    includeRevoked: boolean = true
  ): Promise<ApiKey[]> {
    const projectObjectId =
      typeof projectId === 'string' ? new ObjectId(projectId) : projectId;

    const filter: Filter<ApiKey> = { projectId: projectObjectId };
    if (!includeRevoked) {
      filter.revokedAt = null;
    }

    return this.collection.find(filter).toArray();
  }

  /**
   * Updates API key fields and refreshes updatedAt.
   */
  async update(id: string | ObjectId, data: UpdateApiKeyData): Promise<ApiKey | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const now = new Date();

    const updateFields: Partial<ApiKey> = {
      ...data,
      updatedAt: now,
    };

    const result = await this.collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return result;
  }

  /**
   * Records key usage by updating lastUsedAt.
   */
  async updateLastUsed(id: string | ObjectId, lastUsedAt: Date = new Date()): Promise<ApiKey | null> {
    return this.update(id, { lastUsedAt });
  }

  /**
   * Revokes an API key, rendering it invalid for all future Data Plane requests.
   */
  async revoke(
    id: string | ObjectId,
    projectId?: string | ObjectId,
    revokedAt: Date = new Date()
  ): Promise<ApiKey | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const now = new Date();

    const filter: Filter<ApiKey> = { _id: objectId };
    if (projectId) {
      filter.projectId =
        typeof projectId === 'string' ? new ObjectId(projectId) : projectId;
    }

    const result = await this.collection.findOneAndUpdate(
      filter,
      { $set: { revokedAt, updatedAt: now } },
      { returnDocument: 'after' }
    );

    return result;
  }

  /**
   * Physically deletes an API key document.
   */
  async delete(id: string | ObjectId): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await this.collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }
}
