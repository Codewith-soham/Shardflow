import { Collection, ObjectId, type Db } from 'mongodb';

import { getDatabase } from '../../database/client.js';
import {
  type HealthEvent,
  type CreateHealthEventData,
} from '../models/health-event.model.js';

export const HEALTH_EVENTS_COLLECTION = 'healthEvents';

export class HealthEventRepository {
  private readonly db?: Db;

  constructor(db?: Db) {
    this.db = db;
  }

  private get collection(): Collection<HealthEvent> {
    return (this.db ?? getDatabase()).collection<HealthEvent>(HEALTH_EVENTS_COLLECTION);
  }

  /**
   * Creates indexes for healthEvents collection as specified in database-design.md §19:
   * - index on shardId
   * - index on projectId
   * - index on createdAt
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex(
      { shardId: 1 },
      { name: 'idx_health_events_shardId' }
    );
    await this.collection.createIndex(
      { projectId: 1 },
      { name: 'idx_health_events_projectId' }
    );
    await this.collection.createIndex(
      { createdAt: -1 },
      { name: 'idx_health_events_createdAt' }
    );
  }

  /**
   * Persists a new health event record.
   */
  async create(data: CreateHealthEventData): Promise<HealthEvent> {
    const now = new Date();
    const projectObjectId =
      typeof data.projectId === 'string' ? new ObjectId(data.projectId) : data.projectId;
    const shardObjectId =
      typeof data.shardId === 'string' ? new ObjectId(data.shardId) : data.shardId;

    const doc: HealthEvent = {
      _id: new ObjectId(),
      projectId: projectObjectId,
      shardId: shardObjectId,
      status: data.status,
      latency: data.latency ?? null,
      error: data.error ?? null,
      createdAt: now,
    };

    await this.collection.insertOne(doc as any);
    return doc;
  }

  /**
   * Returns recent health events for a specific shard.
   */
  async findByShardId(shardId: string | ObjectId, limit: number = 20): Promise<HealthEvent[]> {
    const shardObjectId = typeof shardId === 'string' ? new ObjectId(shardId) : shardId;
    return this.collection
      .find({ shardId: shardObjectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Returns recent health events for a specific project.
   */
  async findByProjectId(projectId: string | ObjectId, limit: number = 50): Promise<HealthEvent[]> {
    const projectObjectId =
      typeof projectId === 'string' ? new ObjectId(projectId) : projectId;
    return this.collection
      .find({ projectId: projectObjectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Finds the latest health event for a given shard.
   */
  async findLatestByShardId(shardId: string | ObjectId): Promise<HealthEvent | null> {
    const shardObjectId = typeof shardId === 'string' ? new ObjectId(shardId) : shardId;
    return this.collection.findOne(
      { shardId: shardObjectId },
      { sort: { createdAt: -1 } }
    );
  }
}
