
import { describe, it, expect } from 'vitest';

import { buildApp } from './app.js';
import type { AppConfig } from './config/index.js';

describe('Application Foundation (app.ts)', () => {
  const testConfig: AppConfig = {
    port: 3000,
    host: '127.0.0.1',
    nodeEnv: 'test',
    mongodbUri: 'mongodb://localhost:27017',
    mongodbDatabase: 'shardflow_test',
  };

  it('builds the Fastify app instance and responds to /health', async () => {
    const app = await buildApp(testConfig);

    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toEqual({
      status: 'ok',
      database: 'disconnected',
    });

    await app.close();
  });
});
