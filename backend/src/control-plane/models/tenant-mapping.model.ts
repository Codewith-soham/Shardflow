import { ObjectId } from 'mongodb';
import { z } from 'zod';

export interface TenantMapping {
  _id: ObjectId;
  projectId: ObjectId;
  tenantId: string;
  shardId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantMappingData {
  projectId: string | ObjectId;
  tenantId: string;
  shardId: string | ObjectId;
}

export const createTenantMappingSchema = z.object({
  tenantId: z.string().min(1, 'tenantId is required').max(256, 'tenantId is too long'),
  shardId: z.string().min(1, 'shardId is required'),
});

export type CreateTenantMappingInput = z.infer<typeof createTenantMappingSchema>;
