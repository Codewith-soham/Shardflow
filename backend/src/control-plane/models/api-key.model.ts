import { createHash, randomBytes } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

export interface ApiKey {
  _id: ObjectId;
  projectId: ObjectId;
  name: string;
  keyHash: string;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyData {
  projectId: ObjectId | string;
  name: string;
  keyHash: string;
  expiresAt?: Date | null;
}

export interface UpdateApiKeyData {
  name?: string;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
}

export const createApiKeySchema = z.object({
  projectId: z.union([
    z.string().min(1, 'Project ID cannot be empty'),
    z.instanceof(ObjectId),
  ]),
  name: z.string().min(1, 'API key name cannot be empty'),
  keyHash: z.string().min(1, 'Key hash cannot be empty'),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const createApiKeyBodySchema = z.object({
  name: z.string().min(1, 'API key name cannot be empty'),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const updateApiKeySchema = z.object({
  name: z.string().min(1, 'API key name cannot be empty').optional(),
  lastUsedAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  revokedAt: z.coerce.date().optional().nullable(),
});

/**
 * Computes a deterministic SHA-256 hash of a raw API key for storage and index lookup.
 */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Generates a high-entropy cryptographically secure raw API key and its corresponding SHA-256 hash.
 */
export function generateApiKey(prefix = 'sf_live_'): { rawKey: string; keyHash: string } {
  const entropy = randomBytes(24).toString('hex');
  const rawKey = `${prefix}${entropy}`;
  const keyHash = hashApiKey(rawKey);
  return { rawKey, keyHash };
}

/**
 * Determines whether an API key is currently active per database-design.md Section 7.4:
 * - revokedAt == null
 * - expiresAt == null OR expiresAt > currentTime
 */
export function isApiKeyActive(
  apiKey: Pick<ApiKey, 'revokedAt' | 'expiresAt'>,
  now: Date = new Date()
): boolean {
  if (apiKey.revokedAt != null) {
    return false;
  }
  if (apiKey.expiresAt != null && apiKey.expiresAt.getTime() <= now.getTime()) {
    return false;
  }
  return true;
}
