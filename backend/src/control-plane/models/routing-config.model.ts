import { ObjectId } from 'mongodb';
import { z } from 'zod';

export const RoutingStrategy = {
  TENANT_BASED: 'TENANT_BASED',
} as const;

export type RoutingStrategy = (typeof RoutingStrategy)[keyof typeof RoutingStrategy];

export interface RoutingConfig {
  _id: ObjectId;
  projectId: ObjectId;
  strategy: RoutingStrategy;
  routingKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoutingConfigData {
  projectId: string | ObjectId;
  strategy?: RoutingStrategy;
  routingKey?: string;
}

export const updateRoutingConfigSchema = z.object({
  strategy: z.enum(['TENANT_BASED'], {
    message: 'Only TENANT_BASED routing strategy is supported in V1',
  }),
});

export type UpdateRoutingConfigInput = z.infer<typeof updateRoutingConfigSchema>;
