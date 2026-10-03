import { ObjectId } from 'mongodb';

export const HealthEventStatus = {
  SHARD_HEALTHY: 'SHARD_HEALTHY',
  SHARD_DEGRADED: 'SHARD_DEGRADED',
  SHARD_UNHEALTHY: 'SHARD_UNHEALTHY',
  SHARD_RECOVERED: 'SHARD_RECOVERED',
} as const;

export type HealthEventStatus = (typeof HealthEventStatus)[keyof typeof HealthEventStatus];

/**
 * HealthEvent model tracking significant shard health transitions and checks.
 * See: docs/database_design.md §19 & §20
 */
export interface HealthEvent {
  _id: ObjectId;
  projectId: ObjectId;
  shardId: ObjectId;
  status: HealthEventStatus;
  latency?: number | null;
  error?: Record<string, any> | string | null;
  createdAt: Date;
}

export interface CreateHealthEventData {
  projectId: ObjectId | string;
  shardId: ObjectId | string;
  status: HealthEventStatus;
  latency?: number | null;
  error?: Record<string, any> | string | null;
}
