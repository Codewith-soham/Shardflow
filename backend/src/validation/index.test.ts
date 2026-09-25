import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { z } from 'zod';

import { validateData, validateRequest } from './index.js';
import { errorHandler } from '../errors/error-handler.js';
import { ErrorCode } from '../errors/codes.js';
import { BadRequestError } from '../errors/app-error.js';

describe('Validation Infrastructure', () => {
  const schema = z.object({
    name: z.string().min(1),
    limit: z.number().int().positive(),
  });

  it('validates correct data successfully with validateData', () => {
    const valid = { name: 'ShardFlow', limit: 10 };
    const result = validateData(schema, valid);
    expect(result).toEqual(valid);
  });

  it('throws BadRequestError with MISSING_REQUIRED_FIELD when a field is missing', () => {
    const invalid = { limit: 10 };
    expect(() => validateData(schema, invalid)).toThrowError(BadRequestError);

    try {
      validateData(schema, invalid);
    } catch (err) {
      const appErr = err as BadRequestError;
      expect(appErr.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
      expect(appErr.message).toContain("Field 'name' is required");
    }
  });

  it('throws BadRequestError with INVALID_FIELD_TYPE when a field has wrong type', () => {
    const invalid = { name: 'ShardFlow', limit: 'not-a-number' };
    expect(() => validateData(schema, invalid)).toThrowError(BadRequestError);

    try {
      validateData(schema, invalid);
    } catch (err) {
      const appErr = err as BadRequestError;
      expect(appErr.code).toBe(ErrorCode.INVALID_FIELD_TYPE);
      expect(appErr.message).toContain("Field 'limit' has invalid type");
    }
  });

  it('works with Fastify preHandler hook via validateRequest', async () => {
    const app = Fastify({ logger: false });
    app.setErrorHandler(errorHandler);

    app.post(
      '/test-validate',
      {
        preHandler: validateRequest({ body: schema }),
      },
      async (req) => {
        return { success: true, data: req.body };
      }
    );

    // Valid request
    const validRes = await app.inject({
      method: 'POST',
      url: '/test-validate',
      payload: { name: 'test', limit: 5 },
    });
    expect(validRes.statusCode).toBe(200);
    expect(validRes.json()).toEqual({ success: true, data: { name: 'test', limit: 5 } });

    // Missing field
    const invalidRes = await app.inject({
      method: 'POST',
      url: '/test-validate',
      payload: { limit: 5 },
    });
    expect(invalidRes.statusCode).toBe(400);
    expect(invalidRes.json()).toEqual({
      success: false,
      message: 'Request failed',
      error: {
        code: ErrorCode.MISSING_REQUIRED_FIELD,
        message: "Field 'name' is required",
      },
    });
  });
});
