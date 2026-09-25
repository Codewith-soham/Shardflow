import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

import { AppError, type ErrorResponse } from './app-error.js';
import { ErrorCode } from './codes.js';

/**
 * Global Fastify error handler.
 * Formats errors into ShardFlow's standardized error contract:
 * {
 *   "success": false,
 *   "message": "Request failed",
 *   "error": {
 *     "code": "...",
 *     "message": "..."
 *   }
 * }
 */
export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // 1. Controlled AppError instance
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      request.log.error(
        { err: error, code: error.code, details: error.details },
        `Controlled server error: ${error.message}`
      );
    } else {
      request.log.warn(
        { err: error, code: error.code, details: error.details },
        `Client error: ${error.message}`
      );
    }

    reply.status(error.statusCode).send(error.toResponse());
    return;
  }

  // 2. Fastify validation error (schema validation)
  const fastifyError = error as FastifyError;
  if (fastifyError.validation) {
    request.log.warn({ validation: fastifyError.validation }, 'Fastify schema validation error');
    const response: ErrorResponse = {
      success: false,
      message: 'Request failed',
      error: {
        code: ErrorCode.INVALID_REQUEST,
        message: fastifyError.message,
      },
    };
    reply.status(400).send(response);
    return;
  }

  // 3. Fastify payload too large (413)
  if (fastifyError.statusCode === 413) {
    const response: ErrorResponse = {
      success: false,
      message: 'Request failed',
      error: {
        code: ErrorCode.REQUEST_TOO_LARGE,
        message: 'Request body exceeds maximum permitted size',
      },
    };
    reply.status(413).send(response);
    return;
  }

  // 4. Rate limit exceeded (429)
  if (fastifyError.statusCode === 429) {
    const response: ErrorResponse = {
      success: false,
      message: 'Request failed',
      error: {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Rate limit exceeded. Please try again later.',
      },
    };
    reply.status(429).send(response);
    return;
  }

  // 5. Fastify 404 or missing route
  if (fastifyError.statusCode === 404) {
    const response: ErrorResponse = {
      success: false,
      message: 'Request failed',
      error: {
        code: ErrorCode.ROUTE_NOT_FOUND,
        message: `Route not found: ${request.method} ${request.url}`,
      },
    };
    reply.status(404).send(response);
    return;
  }

  // 6. Unhandled / Internal Server Error (500)
  // CRITICAL: Never leak internal stack traces or connection credentials to clients
  request.log.error(error, `Unhandled internal error: ${error.message}`);

  const response: ErrorResponse = {
    success: false,
    message: 'Request failed',
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected internal server error occurred',
    },
  };
  reply.status(500).send(response);
}

/**
 * 404 Handler for unmatched routes.
 */
export function notFoundHandler(request: FastifyRequest, reply: FastifyReply): void {
  const response: ErrorResponse = {
    success: false,
    message: 'Request failed',
    error: {
      code: ErrorCode.ROUTE_NOT_FOUND,
      message: `Route not found: ${request.method} ${request.url}`,
    },
  };
  reply.status(404).send(response);
}
