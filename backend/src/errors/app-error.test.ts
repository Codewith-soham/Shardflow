import { describe, it, expect } from 'vitest';

import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  PayloadTooLargeError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalServerError,
  BadGatewayError,
  ServiceUnavailableError,
  GatewayTimeoutError,
} from './app-error.js';
import { ErrorCode } from './codes.js';

describe('AppError Hierarchy', () => {
  it('instantiates base AppError with correct status and code', () => {
    const error = new AppError(418, ErrorCode.INVALID_REQUEST, "I'm a teapot", { foo: 'bar' });
    expect(error.statusCode).toBe(418);
    expect(error.code).toBe(ErrorCode.INVALID_REQUEST);
    expect(error.message).toBe("I'm a teapot");
    expect(error.details).toEqual({ foo: 'bar' });
    expect(error.toResponse()).toEqual({
      success: false,
      message: 'Request failed',
      error: {
        code: ErrorCode.INVALID_REQUEST,
        message: "I'm a teapot",
      },
    });
  });

  it('correctly sets defaults for each subclass', () => {
    const badRequest = new BadRequestError();
    expect(badRequest.statusCode).toBe(400);
    expect(badRequest.code).toBe(ErrorCode.INVALID_REQUEST);

    const unauthorized = new UnauthorizedError();
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.code).toBe(ErrorCode.AUTHENTICATION_REQUIRED);

    const forbidden = new ForbiddenError();
    expect(forbidden.statusCode).toBe(403);
    expect(forbidden.code).toBe(ErrorCode.ACCESS_DENIED);

    const notFound = new NotFoundError();
    expect(notFound.statusCode).toBe(404);
    expect(notFound.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);

    const conflict = new ConflictError();
    expect(conflict.statusCode).toBe(409);
    expect(conflict.code).toBe(ErrorCode.RESOURCE_STATE_CONFLICT);

    const tooLarge = new PayloadTooLargeError();
    expect(tooLarge.statusCode).toBe(413);
    expect(tooLarge.code).toBe(ErrorCode.REQUEST_TOO_LARGE);

    const unprocessable = new UnprocessableEntityError();
    expect(unprocessable.statusCode).toBe(422);
    expect(unprocessable.code).toBe(ErrorCode.DATABASE_QUERY_INVALID);

    const rateLimit = new TooManyRequestsError();
    expect(rateLimit.statusCode).toBe(429);
    expect(rateLimit.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);

    const internal = new InternalServerError();
    expect(internal.statusCode).toBe(500);
    expect(internal.code).toBe(ErrorCode.INTERNAL_ERROR);

    const badGateway = new BadGatewayError();
    expect(badGateway.statusCode).toBe(502);
    expect(badGateway.code).toBe(ErrorCode.DATABASE_OPERATION_FAILED);

    const unavailable = new ServiceUnavailableError();
    expect(unavailable.statusCode).toBe(503);
    expect(unavailable.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);

    const timeout = new GatewayTimeoutError();
    expect(timeout.statusCode).toBe(504);
    expect(timeout.code).toBe(ErrorCode.DATABASE_OPERATION_TIMEOUT);
  });
});
