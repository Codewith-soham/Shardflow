import { describe, it, expect, beforeEach } from 'vitest';

import {
  getDatabase,
  getMongoClient,
  isDatabaseConnected,
  closeDatabase,
} from './client.js';

describe('Database Client Module', () => {
  beforeEach(async () => {
    await closeDatabase();
  });

  it('starts in disconnected state', () => {
    expect(isDatabaseConnected()).toBe(false);
  });

  it('throws an error if getDatabase is called before connecting', () => {
    expect(() => getDatabase()).toThrow(
      'Metadata database is not initialized. Call connectDatabase(config) before accessing the database.'
    );
  });

  it('throws an error if getMongoClient is called before connecting', () => {
    expect(() => getMongoClient()).toThrow(
      'MongoClient is not initialized. Call connectDatabase(config) before accessing the client.'
    );
  });

  it('closeDatabase safely runs even if already disconnected', async () => {
    await expect(closeDatabase()).resolves.toBeUndefined();
    expect(isDatabaseConnected()).toBe(false);
  });
});
