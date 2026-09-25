import type { FastifyRequest, preHandlerHookHandler } from 'fastify';
import { z, ZodError, type ZodType } from 'zod';

import { BadRequestError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/codes.js';

export { z };

export interface RequestValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Maps a ZodError to an appropriate ShardFlow BadRequestError with matching canonical ErrorCode.
 */
export function formatZodError(error: ZodError): BadRequestError {
  const issues = error.issues;
  if (!issues || issues.length === 0) {
    return new BadRequestError('Validation failed', ErrorCode.INVALID_REQUEST);
  }

  const firstIssue = issues[0]!;
  const fieldPath = firstIssue.path.length > 0 ? firstIssue.path.join('.') : 'request';

  // Missing required field
  if (firstIssue.code === 'invalid_type' && firstIssue.message.includes('received undefined')) {
    return new BadRequestError(
      `Field '${fieldPath}' is required`,
      ErrorCode.MISSING_REQUIRED_FIELD,
      issues
    );
  }

  // Invalid field type
  if (firstIssue.code === 'invalid_type') {
    const rawIssue = firstIssue as unknown as { expected?: string };
    return new BadRequestError(
      `Field '${fieldPath}' has invalid type: ${firstIssue.message}`,
      ErrorCode.INVALID_FIELD_TYPE,
      issues
    );
  }

  // Invalid field format or other custom validation error
  return new BadRequestError(
    `Validation error for '${fieldPath}': ${firstIssue.message}`,
    ErrorCode.INVALID_FIELD,
    issues
  );
}

/**
 * Validates data against a Zod schema synchronously or throws a mapped BadRequestError.
 */
export function validateData<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw formatZodError(result.error);
  }
  return result.data;
}

/**
 * Fastify preHandler hook for declarative schema validation of body, query, and params.
 *
 * Example:
 * app.post('/api/v1/projects', {
 *   preHandler: validateRequest({ body: createProjectSchema })
 * }, handler);
 */
export function validateRequest(schemas: RequestValidationSchemas): preHandlerHookHandler {
  return async (request: FastifyRequest) => {
    if (schemas.params) {
      request.params = validateData(schemas.params, request.params);
    }
    if (schemas.query) {
      request.query = validateData(schemas.query, request.query);
    }
    if (schemas.body) {
      request.body = validateData(schemas.body, request.body);
    }
  };
}
