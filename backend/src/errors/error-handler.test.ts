import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';

import { errorHandler, notFoundHandler } from './error-handler.js';
import { BadRequestError, NotFoundError } from './app-error.js';
import { ErrorCode } from './codes.js';

describe('Fastify Error Handler & Not Found Handler', () => {
  it('formats AppError properly', async () => {
    const app = Fastify({ logger: false });
    app.setErrorHandler(errorHandler);

    app.get('/test-error', async () => {
      throw new BadRequestError('Custom bad request', ErrorCode.INVALID_FIELD);
    });

    const res = await app.inject({
      method: 'GET',
      url: '/test-error',
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body).toEqual({
      success: false,
      message: 'Request failed',
      error: {
        code: ErrorCode.INVALID_FIELD,
        message: 'Custom bad request',
      },
    });
  });

  it('formats unhandled errors as 500 without leaking stack traces or internal messages', async () => {
    const app = Fastify({ logger: false });
    app.setErrorHandler(errorHandler);

    app.get('/crash', async () => {
      throw new Error('Secret DB connection uri string: mongodb://user:pass@secret.com');
    });

    const res = await app.inject({
      method: 'GET',
      url: '/crash',
    });

    expect(res.statusCode).toBe(500);
    const body = res.json();
    expect(body).toEqual({
      success: false,
      message: 'Request failed',
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected internal server error occurred',
      },
    });
    expect(res.payload).not.toContain('mongodb://user:pass@secret.com');
  });

  it('handles unmatched routes using notFoundHandler', async () => {
    const app = Fastify({ logger: false });
    app.setNotFoundHandler(notFoundHandler);

    const res = await app.inject({
      method: 'GET',
      url: '/non-existent-route',
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body).toEqual({
      success: false,
      message: 'Request failed',
      error: {
        code: ErrorCode.ROUTE_NOT_FOUND,
        message: 'Route not found: GET /non-existent-route',
      },
    });
  });
});
