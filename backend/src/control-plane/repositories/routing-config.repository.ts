import { Collection, ObjectId, type Db } from 'mongodb';

import { getDatabase } from '../../database/client.js';
import {
  type RoutingConfig,
  type CreateRoutingConfigData,
  RoutingStrategy,
} from '../models/routing-config.model.js';

export const ROUTING_CONFIGS_COLLECTION = 'routingConfigs';

export class RoutingConfigRepository {
  private readonly db?: Db;

  constructor(db?: Db) {
    this.db = db;
  }

  private get collection(): Collection<RoutingConfig> {
    return (this.db ?? getDatabase()).collection<RoutingConfig>(ROUTING_CONFIGS_COLLECTION);
  }

  /**
   * Creates required indexes according to database-design.md §14.2:
   * - unique index on projectId (one active routing config per project)
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex(
      { projectId: 1 },
      { unique: true, name: 'idx_routingConfigs_projectId_unique' }
    );
  }

  /**
   * Finds the routing config for a project.
   */
  async findByProjectId(projectId: string | ObjectId): Promise<RoutingConfig | null> {
    const projectObjectId =
      typeof projectId === 'string' ? new ObjectId(projectId) : projectId;
    return this.collection.findOne({ projectId: projectObjectId });
  }

  /**
   * Upserts the routing configuration for a project.
   * Creates a default TENANT_BASED config if none exists.
   */
  async upsert(data: CreateRoutingConfigData): Promise<RoutingConfig> {
    const now = new Date();
    const projectObjectId =
      typeof data.projectId === 'string' ? new ObjectId(data.projectId) : data.projectId;

    const strategy = data.strategy ?? RoutingStrategy.TENANT_BASED;
    const routingKey = data.routingKey ?? 'tenantId';

    const result = await this.collection.findOneAndUpdate(
      { projectId: projectObjectId },
      {
        $set: {
          strategy,
          routingKey,
          updatedAt: now,
        },
        $setOnInsert: {
          _id: new ObjectId(),
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    return result!;
  }
}
