import { Collection, ObjectId, type Db, type Filter } from 'mongodb';

import { getDatabase } from '../../database/client.js';
import {
  type Shard,
  type CreateShardData,
  type UpdateShardData,
  ShardStatus,
  ShardHealthStatus,
} from '../models/shard.model.js';

export const SHARDS_COLLECTION = 'shards';

export class ShardRepository {
  private readonly db?: Db;

  constructor(db?: Db) {
    this.db = db;
  }

  private get collection(): Collection<Shard> {
    return (this.db ?? getDatabase()).collection<Shard>(SHARDS_COLLECTION);
  }

  /**
   * Creates the required indexes for the shards collection as specified in database-design.md §12:
   * - index on projectId
   * - compound index on projectId + status (for active shard lookups)
   * - unique compound index on projectId + name (shard names unique per project)
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex(
      { projectId: 1 },
      { name: 'idx_shards_projectId' }
    );
    await this.collection.createIndex(
      { projectId: 1, status: 1 },
      { name: 'idx_shards_projectId_status' }
    );
    await this.collection.createIndex(
      { projectId: 1, name: 1 },
      { unique: true, name: 'idx_shards_projectId_name_unique' }
    );
  }

  /**
   * Persists a new shard document with default ACTIVE status and UNKNOWN health.
   */
  async create(data: CreateShardData): Promise<Shard> {
    const now = new Date();
    const projectObjectId =
      typeof data.projectId === 'string' ? new ObjectId(data.projectId) : data.projectId;

    const doc: Shard = {
      _id: new ObjectId(),
      projectId: projectObjectId,
      name: data.name,
      encryptedConnectionUri: data.encryptedConnectionUri,
      status: data.status ?? ShardStatus.ACTIVE,
      healthStatus: data.healthStatus ?? ShardHealthStatus.UNKNOWN,
      lastHealthCheckAt: null,
      lastSuccessfulHealthCheckAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(doc as any);
    return doc;
  }

  /**
   * Finds a shard by internal MongoDB ObjectId.
   */
  async findById(id: string | ObjectId): Promise<Shard | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return this.collection.findOne({ _id: objectId });
  }

  /**
   * Finds a shard scoped by its ObjectId and owning projectId (authorization scope).
   */
  async findByIdAndProjectId(
    id: string | ObjectId,
    projectId: string | ObjectId
  ): Promise<Shard | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const projectObjectId =
      typeof projectId === 'string' ? new ObjectId(projectId) : projectId;
    return this.collection.findOne({ _id: objectId, projectId: projectObjectId });
  }

  /**
   * Finds all shards belonging to a project, optionally filtering by status.
   */
  async findByProjectId(
    projectId: string | ObjectId,
    statusFilter?: string
  ): Promise<Shard[]> {
    const projectObjectId =
      typeof projectId === 'string' ? new ObjectId(projectId) : projectId;

    const filter: Filter<Shard> = { projectId: projectObjectId };
    if (statusFilter) {
      filter.status = statusFilter as Shard['status'];
    }

    return this.collection.find(filter).toArray();
  }

  /**
   * Finds only ACTIVE shards belonging to a project.
   * Used by the Connection Manager and Routing Engine.
   */
  async findActiveByProjectId(projectId: string | ObjectId): Promise<Shard[]> {
    return this.findByProjectId(projectId, ShardStatus.ACTIVE);
  }

  /**
   * Finds a shard by project and name (enforcing uniqueness).
   */
  async findByProjectIdAndName(
    projectId: string | ObjectId,
    name: string
  ): Promise<Shard | null> {
    const projectObjectId =
      typeof projectId === 'string' ? new ObjectId(projectId) : projectId;
    return this.collection.findOne({ projectId: projectObjectId, name });
  }

  /**
   * Updates shard fields and refreshes updatedAt.
   */
  async update(
    id: string | ObjectId,
    data: UpdateShardData
  ): Promise<Shard | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const now = new Date();

    const updateFields: Partial<Shard> = {
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
   * Updates shard fields scoped by projectId (authorization scope).
   */
  async updateByIdAndProjectId(
    id: string | ObjectId,
    projectId: string | ObjectId,
    data: UpdateShardData
  ): Promise<Shard | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const projectObjectId =
      typeof projectId === 'string' ? new ObjectId(projectId) : projectId;
    const now = new Date();

    const updateFields: Partial<Shard> = {
      ...data,
      updatedAt: now,
    };

    const result = await this.collection.findOneAndUpdate(
      { _id: objectId, projectId: projectObjectId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return result;
  }

  /**
   * Records a health check result — updates healthStatus and timing fields.
   */
  async updateHealth(
    id: string | ObjectId,
    healthStatus: Shard['healthStatus'],
    checkedAt: Date = new Date()
  ): Promise<Shard | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const now = new Date();

    const update: Partial<Shard> = {
      healthStatus,
      lastHealthCheckAt: checkedAt,
      updatedAt: now,
    };

    if (
      healthStatus === ShardHealthStatus.HEALTHY ||
      healthStatus === ShardHealthStatus.DEGRADED
    ) {
      update.lastSuccessfulHealthCheckAt = checkedAt;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: objectId },
      { $set: update },
      { returnDocument: 'after' }
    );

    return result;
  }

  /**
   * Disables a shard (soft-delete). Does NOT migrate tenant data.
   */
  async disable(
    id: string | ObjectId,
    projectId?: string | ObjectId
  ): Promise<Shard | null> {
    if (projectId) {
      return this.updateByIdAndProjectId(id, projectId, { status: ShardStatus.DISABLED });
    }
    return this.update(id, { status: ShardStatus.DISABLED });
  }

  /**
   * Counts the number of shards belonging to a project (used for auto-placement heuristics).
   */
  async countActiveByProjectId(projectId: string | ObjectId): Promise<number> {
    const projectObjectId =
      typeof projectId === 'string' ? new ObjectId(projectId) : projectId;
    return this.collection.countDocuments({
      projectId: projectObjectId,
      status: ShardStatus.ACTIVE,
    });
  }

  /**
   * Physically deletes a shard document. Only used in tests/cleanup.
   */
  async delete(id: string | ObjectId): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await this.collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }
}
