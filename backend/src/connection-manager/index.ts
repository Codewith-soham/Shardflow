import { MongoClient, type Db } from 'mongodb';

import { decryptConnectionUri } from '../control-plane/models/shard.model.js';
import type { Shard } from '../control-plane/models/shard.model.js';

// ─── Pool Entry ───────────────────────────────────────────────────────────────

interface PoolEntry {
  client: MongoClient;
  db: Db;
  shardId: string;
  createdAt: Date;
  lastUsedAt: Date;
}

// ─── Connection Manager ───────────────────────────────────────────────────────

/**
 * ShardFlow Connection Manager
 *
 * Maintains an isolated MongoDB connection pool per shard.
 * Connections are created lazily on first use and reused on subsequent requests.
 *
 * Architecture contract (docs/architecture.md §15):
 * - Each shard has its own independent pool.
 * - A failure in one pool must not affect connections to other shards.
 * - Credentials are decrypted ONLY at connection time and never logged.
 *
 * Usage:
 *   const db = await connectionManager.getConnection(shard);
 *   await db.collection('users').find(...);
 */
export class ConnectionManager {
  /** Map of shardId → active pool entry */
  private readonly pools = new Map<string, PoolEntry>();

  /**
   * Returns a connected MongoDB Db handle for the given shard.
   * Creates a new pool if one does not already exist.
   * Reuses the existing pool if already connected.
   */
  async getConnection(shard: Shard): Promise<Db> {
    const shardId = shard._id.toString();

    const existing = this.pools.get(shardId);
    if (existing) {
      existing.lastUsedAt = new Date();
      return existing.db;
    }

    return this.createPool(shard);
  }

  /**
   * Creates a new MongoDB connection pool for the given shard.
   * Decrypts credentials, connects, and stores the pool entry.
   *
   * Throws if the connection cannot be established.
   */
  private async createPool(shard: Shard): Promise<Db> {
    const shardId = shard._id.toString();

    // Decrypt the stored URI — credentials never logged
    let rawUri: string;
    try {
      rawUri = decryptConnectionUri(shard.encryptedConnectionUri);
    } catch (err) {
      throw new Error(`Failed to decrypt credentials for shard "${shard.name}": ${(err as Error).message}`);
    }

    const client = new MongoClient(rawUri, {
      // Reasonable defaults for a managed connection pool
      maxPoolSize: 10,
      minPoolSize: 1,
      connectTimeoutMS: 10_000,
      socketTimeoutMS: 30_000,
      serverSelectionTimeoutMS: 10_000,
    });

    await client.connect();

    // Use the database name from the URI, falling back to a safe default
    const db = client.db();

    const entry: PoolEntry = {
      client,
      db,
      shardId,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    };

    this.pools.set(shardId, entry);
    return db;
  }

  /**
   * Performs a lightweight ping against the shard to verify connectivity.
   * Returns latency in milliseconds if successful, throws on failure.
   * Used by the initial connection validation (Task 3.8) and Health Monitor.
   */
  async ping(shard: Shard): Promise<number> {
    const start = Date.now();
    const db = await this.getConnection(shard);
    await db.command({ ping: 1 });
    return Date.now() - start;
  }

  /**
   * Closes and removes the connection pool for a specific shard.
   * Called when a shard is disabled or during cleanup.
   */
  async closeConnection(shardId: string): Promise<void> {
    const entry = this.pools.get(shardId);
    if (entry) {
      try {
        await entry.client.close();
      } catch {
        // Swallow close errors — the entry will be removed regardless
      }
      this.pools.delete(shardId);
    }
  }

  /**
   * Returns true if an active connection pool exists for the given shard.
   */
  hasConnection(shardId: string): boolean {
    return this.pools.has(shardId);
  }

  /**
   * Returns the number of currently maintained connection pools.
   */
  get poolCount(): number {
    return this.pools.size;
  }

  /**
   * Gracefully closes ALL managed shard connections.
   * Called during application shutdown (docs/architecture.md §46).
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.pools.keys()).map((id) =>
      this.closeConnection(id)
    );
    await Promise.allSettled(closePromises);
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

/**
 * Module-level singleton Connection Manager instance.
 * Shared across the entire backend process so pools are reused between requests.
 */
export const connectionManager = new ConnectionManager();
