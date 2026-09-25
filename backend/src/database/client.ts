import { MongoClient, type Db } from 'mongodb';

import type { AppConfig } from '../config/index.js';

/**
 * Module-level state holding the active MongoClient and metadata Db instances.
 * This guarantees a single, reusable connection pool for the ShardFlow metadata database.
 */
let client: MongoClient | null = null;
let database: Db | null = null;
let connectionPromise: Promise<Db> | null = null;

/**
 * Initializes and connects the reusable MongoDB client for the ShardFlow metadata database.
 * If already connected, the existing Db instance is returned.
 * Concurrent calls will await the same connection attempt.
 *
 * @param config - The application configuration containing MongoDB URI and database name.
 * @returns Promise resolving to the metadata Db instance.
 */
export async function connectDatabase(config: AppConfig): Promise<Db> {
  if (database && client) {
    return database;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const mongoClient = new MongoClient(config.mongodbUri);
      await mongoClient.connect();

      client = mongoClient;
      database = mongoClient.db(config.mongodbDatabase);

      return database;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

/**
 * Returns the connected ShardFlow metadata database instance.
 *
 * @throws Error if the database connection has not been initialized.
 */
export function getDatabase(): Db {
  if (!database) {
    throw new Error(
      'Metadata database is not initialized. Call connectDatabase(config) before accessing the database.'
    );
  }
  return database;
}

/**
 * Returns the underlying MongoClient instance for the metadata database.
 * Useful for cluster operations, pinging, transactions, or session management.
 *
 * @throws Error if the MongoClient has not been initialized.
 */
export function getMongoClient(): MongoClient {
  if (!client) {
    throw new Error(
      'MongoClient is not initialized. Call connectDatabase(config) before accessing the client.'
    );
  }
  return client;
}

/**
 * Cleanly closes the metadata database MongoClient and resets state.
 *
 * @param force - If true, forces the connection pool to close immediately.
 */
export async function closeDatabase(force = false): Promise<void> {
  if (connectionPromise) {
    try {
      await connectionPromise;
    } catch {
      // Ignore connection failure when closing
    }
  }

  if (client) {
    const clientToClose = client;
    client = null;
    database = null;
    await clientToClose.close(force);
  }
}

/**
 * Returns whether the metadata database client is currently initialized and connected.
 */
export function isDatabaseConnected(): boolean {
  return client !== null && database !== null;
}
