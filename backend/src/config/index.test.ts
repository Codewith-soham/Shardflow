import { describe, it, expect, beforeEach } from 'vitest';

import { loadConfig } from './index.js';

describe('Config loader', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('loads valid configuration successfully', () => {
    process.env['PORT'] = '4000';
    process.env['HOST'] = '127.0.0.1';
    process.env['NODE_ENV'] = 'production';
    process.env['MONGODB_URI'] = 'mongodb://localhost:27017';
    process.env['MONGODB_DATABASE'] = 'custom_db';

    const config = loadConfig();
    expect(config.port).toBe(4000);
    expect(config.host).toBe('127.0.0.1');
    expect(config.nodeEnv).toBe('production');
    expect(config.mongodbUri).toBe('mongodb://localhost:27017');
    expect(config.mongodbDatabase).toBe('custom_db');
  });

  it('applies defaults for HOST, NODE_ENV, and MONGODB_DATABASE', () => {
    delete process.env['HOST'];
    delete process.env['NODE_ENV'];
    delete process.env['MONGODB_DATABASE'];
    process.env['PORT'] = '3000';
    process.env['MONGODB_URI'] = 'mongodb://localhost:27017';

    const config = loadConfig();
    expect(config.port).toBe(3000);
    expect(config.host).toBe('0.0.0.0');
    expect(config.nodeEnv).toBe('development');
    expect(config.mongodbDatabase).toBe('shardflow');
  });

  it('throws an error if PORT is invalid', () => {
    process.env['PORT'] = 'invalid-port';
    process.env['MONGODB_URI'] = 'mongodb://localhost:27017';

    expect(() => loadConfig()).toThrow(/Invalid PORT/);
  });

  it('throws an error if MONGODB_URI is missing', () => {
    process.env['PORT'] = '3000';
    delete process.env['MONGODB_URI'];

    expect(() => loadConfig()).toThrow(/Missing required environment variable: MONGODB_URI/);
  });
});
