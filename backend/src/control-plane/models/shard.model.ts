import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

// ─── Administrative Status ────────────────────────────────────────────────────

export const ShardStatus = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
} as const;

export type ShardStatus = (typeof ShardStatus)[keyof typeof ShardStatus];

// ─── Operational Health State ─────────────────────────────────────────────────

export const ShardHealthStatus = {
  UNKNOWN: 'UNKNOWN',
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
} as const;

export type ShardHealthStatus = (typeof ShardHealthStatus)[keyof typeof ShardHealthStatus];

// ─── Domain Interface ─────────────────────────────────────────────────────────

/**
 * A Shard represents a customer-owned MongoDB database that ShardFlow manages.
 * Connection credentials are stored encrypted. Only the Connection Manager
 * decrypts them at runtime — they are never returned through normal API responses.
 *
 * See: docs/database_design.md §8, docs/architecture.md §29
 */
export interface Shard {
  _id: ObjectId;
  projectId: ObjectId;
  name: string;
  /** AES-256-GCM encrypted connection URI. Format: "iv:authTag:ciphertext" (hex-encoded). */
  encryptedConnectionUri: string;
  status: ShardStatus;
  healthStatus: ShardHealthStatus;
  lastHealthCheckAt?: Date | null;
  lastSuccessfulHealthCheckAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Repository Data Interfaces ───────────────────────────────────────────────

export interface CreateShardData {
  projectId: ObjectId | string;
  name: string;
  encryptedConnectionUri: string;
  status?: ShardStatus;
  healthStatus?: ShardHealthStatus;
}

export interface UpdateShardData {
  name?: string;
  encryptedConnectionUri?: string;
  status?: ShardStatus;
  healthStatus?: ShardHealthStatus;
  lastHealthCheckAt?: Date | null;
  lastSuccessfulHealthCheckAt?: Date | null;
}

// ─── Zod Validation Schemas ───────────────────────────────────────────────────

export const shardStatusSchema = z.enum([ShardStatus.ACTIVE, ShardStatus.DISABLED]);

export const shardHealthStatusSchema = z.enum([
  ShardHealthStatus.UNKNOWN,
  ShardHealthStatus.HEALTHY,
  ShardHealthStatus.DEGRADED,
  ShardHealthStatus.UNHEALTHY,
]);

/** Body schema for POST /api/v1/projects/:projectId/shards */
export const createShardBodySchema = z.object({
  name: z
    .string()
    .min(1, 'Shard name cannot be empty')
    .max(100, 'Shard name too long'),
  connectionUri: z
    .string()
    .min(1, 'Connection URI cannot be empty')
    .refine(
      (uri) => uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
      'Connection URI must be a valid MongoDB connection string (mongodb:// or mongodb+srv://)'
    ),
});

/** Body schema for PATCH /api/v1/projects/:projectId/shards/:shardId */
export const updateShardBodySchema = z
  .object({
    name: z.string().min(1, 'Shard name cannot be empty').max(100, 'Shard name too long').optional(),
    connectionUri: z
      .string()
      .min(1, 'Connection URI cannot be empty')
      .refine(
        (uri) => uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
        'Connection URI must be a valid MongoDB connection string'
      )
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// ─── Credential Encryption Utilities ─────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const KEY_LENGTH = 32; // 256-bit key

/**
 * Derives a 32-byte encryption key from the SHARD_ENCRYPTION_KEY env variable.
 * Falls back to a test-only key in test environments.
 *
 * Security: Never log or return the key.
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env['SHARD_ENCRYPTION_KEY'];
  if (envKey && envKey.length >= 64) {
    // Accept 64-char hex string → 32 bytes
    return Buffer.from(envKey.slice(0, 64), 'hex');
  }
  if (envKey && envKey.length >= KEY_LENGTH) {
    return Buffer.from(envKey.slice(0, KEY_LENGTH));
  }
  // In test mode only — never in production
  if (process.env['NODE_ENV'] === 'test') {
    return Buffer.alloc(KEY_LENGTH, 0x42); // deterministic test key
  }
  throw new Error('Missing or invalid SHARD_ENCRYPTION_KEY environment variable. Must be a 64-char hex string.');
}

/**
 * Encrypts a MongoDB connection URI using AES-256-GCM.
 * Returns a compact string: "iv:authTag:ciphertext" (all hex-encoded).
 *
 * The raw URI is never persisted.
 */
export function encryptConnectionUri(rawUri: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(rawUri, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an encrypted connection URI. Used only by the Connection Manager
 * at connection time — never surfaced through API responses.
 */
export function decryptConnectionUri(encryptedData: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted connection URI format');
  }

  const [ivHex, authTagHex, ciphertextHex] = parts as [string, string, string];
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
}
