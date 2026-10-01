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
    process.env['SUPABASE_URL'] = 'https://custom.supabase.co';
    process.env['SUPABASE_ANON_KEY'] = 'custom-anon-key';
    process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'custom-service-key';
    process.env['SUPABASE_JWT_SECRET'] = 'custom-jwt-secret';

    const config = loadConfig();
    expect(config.port).toBe(4000);
    expect(config.host).toBe('127.0.0.1');
    expect(config.nodeEnv).toBe('production');
    expect(config.mongodbUri).toBe('mongodb://localhost:27017');
    expect(config.mongodbDatabase).toBe('custom_db');
    expect(config.supabaseUrl).toBe('https://custom.supabase.co');
    expect(config.supabaseAnonKey).toBe('custom-anon-key');
    expect(config.supabaseServiceRoleKey).toBe('custom-service-key');
    expect(config.supabaseJwtSecret).toBe('custom-jwt-secret');
  });

  it('applies defaults for HOST, NODE_ENV, and MONGODB_DATABASE', () => {
    delete process.env['HOST'];
    delete process.env['NODE_ENV'];
    delete process.env['MONGODB_DATABASE'];
    process.env['PORT'] = '3000';
    process.env['MONGODB_URI'] = 'mongodb://localhost:27017';
    process.env['SUPABASE_URL'] = 'https://example.supabase.co';
    process.env['SUPABASE_ANON_KEY'] = 'example-anon-key';

    const config = loadConfig();
    expect(config.port).toBe(3000);
    expect(config.host).toBe('0.0.0.0');
    expect(config.nodeEnv).toBe('development');
    expect(config.mongodbDatabase).toBe('shardflow');
    expect(config.supabaseUrl).toBe('https://example.supabase.co');
    expect(config.supabaseAnonKey).toBe('example-anon-key');
  });

  it('throws an error if PORT is invalid', () => {
    process.env['PORT'] = 'invalid-port';
    process.env['MONGODB_URI'] = 'mongodb://localhost:27017';
    process.env['SUPABASE_URL'] = 'https://example.supabase.co';
    process.env['SUPABASE_ANON_KEY'] = 'example-anon-key';

    expect(() => loadConfig()).toThrow(/Invalid PORT/);
  });

  it('throws an error if MONGODB_URI is missing', () => {
    process.env['PORT'] = '3000';
    delete process.env['MONGODB_URI'];
    process.env['SUPABASE_URL'] = 'https://example.supabase.co';
    process.env['SUPABASE_ANON_KEY'] = 'example-anon-key';

    expect(() => loadConfig()).toThrow(/Missing required environment variable: MONGODB_URI/);
  });

  it('throws an error if SUPABASE_URL is missing in non-test env', () => {
    process.env['PORT'] = '3000';
    process.env['NODE_ENV'] = 'development';
    process.env['MONGODB_URI'] = 'mongodb://localhost:27017';
    delete process.env['SUPABASE_URL'];
    process.env['SUPABASE_ANON_KEY'] = 'key';

    expect(() => loadConfig()).toThrow(/Missing required environment variable: SUPABASE_URL/);
  });

  it('throws an error if SUPABASE_ANON_KEY is missing in non-test env', () => {
    process.env['PORT'] = '3000';
    process.env['NODE_ENV'] = 'development';
    process.env['MONGODB_URI'] = 'mongodb://localhost:27017';
    process.env['SUPABASE_URL'] = 'https://example.supabase.co';
    delete process.env['SUPABASE_ANON_KEY'];

    expect(() => loadConfig()).toThrow(/Missing required environment variable: SUPABASE_ANON_KEY/);
  });
});
