import { ErrorCode } from './codes.js';

export interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Base Application Error class for ShardFlow.
 * All operational/controlled errors extend AppError.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Capture stack trace excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  public toResponse(): ErrorResponse {
    return {
      success: false,
      message: 'Request failed',
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends AppError {
  constructor(message = 'Invalid request', code: ErrorCode = ErrorCode.INVALID_REQUEST, details?: unknown) {
    super(400, code, message, details);
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code: ErrorCode = ErrorCode.AUTHENTICATION_REQUIRED, details?: unknown) {
    super(401, code, message, details);
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', code: ErrorCode = ErrorCode.ACCESS_DENIED, details?: unknown) {
    super(403, code, message, details);
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND, details?: unknown) {
    super(404, code, message, details);
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource state conflict', code: ErrorCode = ErrorCode.RESOURCE_STATE_CONFLICT, details?: unknown) {
    super(409, code, message, details);
  }
}

/**
 * 413 Payload Too Large
 */
export class PayloadTooLargeError extends AppError {
  constructor(message = 'Request payload too large', code: ErrorCode = ErrorCode.REQUEST_TOO_LARGE, details?: unknown) {
    super(413, code, message, details);
  }
}

/**
 * 422 Unprocessable Entity
 */
export class UnprocessableEntityError extends AppError {
  constructor(message = 'Semantic validation failed', code: ErrorCode = ErrorCode.DATABASE_QUERY_INVALID, details?: unknown) {
    super(422, code, message, details);
  }
}

/**
 * 429 Too Many Requests
 */
export class TooManyRequestsError extends AppError {
  constructor(message = 'Rate limit exceeded', code: ErrorCode = ErrorCode.RATE_LIMIT_EXCEEDED, details?: unknown) {
    super(429, code, message, details);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', code: ErrorCode = ErrorCode.INTERNAL_ERROR, details?: unknown) {
    super(500, code, message, details);
  }
}

/**
 * 502 Bad Gateway (Upstream customer MongoDB error)
 */
export class BadGatewayError extends AppError {
  constructor(message = 'Database operation failed', code: ErrorCode = ErrorCode.DATABASE_OPERATION_FAILED, details?: unknown) {
    super(502, code, message, details);
  }
}

/**
 * 503 Service Unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', code: ErrorCode = ErrorCode.SERVICE_UNAVAILABLE, details?: unknown) {
    super(503, code, message, details);
  }
}

/**
 * 504 Gateway Timeout (Customer database timeout)
 */
export class GatewayTimeoutError extends AppError {
  constructor(message = 'Database operation timed out', code: ErrorCode = ErrorCode.DATABASE_OPERATION_TIMEOUT, details?: unknown) {
    super(504, code, message, details);
  }
}
