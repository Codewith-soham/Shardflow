import { Collection, ObjectId, type Db } from 'mongodb';

import { getDatabase } from '../../database/client.js';
import type { TenantMapping, CreateTenantMappingData } from '../models/tenant-mapping.model.js';

export const TENANT_MAPPINGS_COLLECTION = 'tenantShardMappings';

export class TenantMappingRepository {
  private readonly db?: Db;

  constructor(db?: Db) {
    this.db = db;
  }

  private get collection(): Collection<TenantMapping> {
    return (this.db ?? getDatabase()).collection<TenantMapping>(TENANT_MAPPINGS_COLLECTION);
  }

  /**
   * Creates required indexes according to database-design.md §16:
   * - unique compound index on projectId + tenantId (a tenant has at most 1 active shard mapping per project)
   * - index on projectId
   * - index on shardId
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex(
      { projectId: 1, tenantId: 1 },
      { unique: true, name: 'idx_tenantMappings_projectId_tenantId_unique' }
    );
    await this.collection.createIndex(
      { projectId: 1 },
      { name: 'idx_tenantMappings_projectId' }
    );
    await this.collection.createIndex(
      { shardId: 1 },
      { name: 'idx_tenantMappings_shardId' }
    );
  }

  /**
   * Creates and persists a tenant-to-shard mapping.
   */
  async create(data: CreateTenantMappingData): Promise<TenantMapping> {
    const now = new Date();
    const projectObjectId =
      typeof data.projectId === 'string' ? new ObjectId(data.projectId) : data.projectId;
    const shardObjectId =
      typeof data.shardId === 'string' ? new ObjectId(data.shardId) : data.shardId;

    const doc: TenantMapping = {
      _id: new ObjectId(),
      projectId: projectObjectId,
      tenantId: data.tenantId,
      shardId: shardObjectId,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(doc as any);
    return doc;
  }

  /**
   * Finds a tenant mapping by project and tenant ID.
   */
  async findByProjectAndTenant(
    projectId: string | ObjectId,
    tenantId: string
  ): Promise<TenantMapping | null> {
    const projectObjectId =
      typeof projectId === 'string' ? new ObjectId(projectId) : projectId;
    return this.collection.findOne({ projectId: projectObjectId, tenantId });
  }

  /**
   * Finds all tenant mappings belonging to a project.
   */
  async findByProjectId(projectId: string | ObjectId): Promise<TenantMapping[]> {
    const projectObjectId =
      typeof projectId === 'string' ? new ObjectId(projectId) : projectId;
    return this.collection.find({ projectId: projectObjectId }).toArray();
  }

  /**
   * Finds a tenant mapping by ID.
   */
  async findById(id: string | ObjectId): Promise<TenantMapping | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return this.collection.findOne({ _id: objectId });
  }

  /**
   * Updates the target shard for a tenant mapping.
   */
  async updateShard(
    id: string | ObjectId,
    shardId: string | ObjectId
  ): Promise<TenantMapping | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const shardObjectId =
      typeof shardId === 'string' ? new ObjectId(shardId) : shardId;
    const now = new Date();

    return this.collection.findOneAndUpdate(
      { _id: objectId },
      { $set: { shardId: shardObjectId, updatedAt: now } },
      { returnDocument: 'after' }
    );
  }

  /**
   * Deletes a tenant mapping.
   */
  async delete(id: string | ObjectId): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await this.collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }
}
