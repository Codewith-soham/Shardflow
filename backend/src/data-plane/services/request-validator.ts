import { ErrorCode } from '../../errors/codes.js';
import { BadRequestError } from '../../errors/app-error.js';
import {
  ALL_ALLOWED_FILTER_OPERATORS,
  ALLOWED_UPDATE_OPERATORS,
  type DataPlaneRequest,
  type FindRequest,
  type FindOneRequest,
  type InsertOneRequest,
  type UpdateOneRequest,
  type DeleteOneRequest,
  findRequestSchema,
  findOneRequestSchema,
  insertOneRequestSchema,
  updateOneRequestSchema,
  deleteOneRequestSchema,
  baseDataRequestSchema,
} from '../models/data-request.model.js';

// ─── Operator Validation ──────────────────────────────────────────────────────

/**
 * Recursively validates all MongoDB operators in a filter object.
 * Rejects any operator not in the V1 allowlist (docs/api.md §31-34, §36).
 *
 * Throws BadRequestError on first violation.
 */
export function validateFilterOperators(filter: Record<string, unknown>, depth = 0): void {
  if (depth > 10) {
    throw new BadRequestError('Filter nesting depth exceeded', ErrorCode.DATABASE_QUERY_INVALID);
  }

  for (const [key, value] of Object.entries(filter)) {
    if (key.startsWith('$')) {
      if (!ALL_ALLOWED_FILTER_OPERATORS.has(key)) {
        throw new BadRequestError(
          `Operator "${key}" is not permitted in V1 filter queries`,
          ErrorCode.OPERATOR_NOT_ALLOWED
        );
      }
    }

    // Recurse into nested objects and arrays
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== null && typeof item === 'object') {
            validateFilterOperators(item as Record<string, unknown>, depth + 1);
          }
        }
      } else {
        validateFilterOperators(value as Record<string, unknown>, depth + 1);
      }
    }
  }
}

/**
 * Validates all top-level keys in an update document are allowed operators.
 * Source: docs/api.md §35
 */
export function validateUpdateOperators(update: Record<string, unknown>): void {
  for (const key of Object.keys(update)) {
    if (key.startsWith('$') && !ALLOWED_UPDATE_OPERATORS.has(key)) {
      throw new BadRequestError(
        `Update operator "${key}" is not permitted in V1`,
        ErrorCode.OPERATOR_NOT_ALLOWED
      );
    }
  }
}

// ─── Request Parser & Dispatcher ─────────────────────────────────────────────

/**
 * Parses and validates an incoming raw Data Plane request body.
 *
 * Validation order follows docs/api.md §48:
 *  1. Parse operation + tenantId + collection (base schema)
 *  2. Dispatch to operation-specific schema
 *  3. Validate operators
 *  4. Validate options
 *
 * Throws BadRequestError or UnauthorizedError on any violation.
 */
export function parseAndValidateDataRequest(body: unknown): DataPlaneRequest {
  // Step 1 — Base validation: tenantId, operation, collection
  const base = baseDataRequestSchema.safeParse(body);
  if (!base.success) {
    const first = base.error.issues[0];
    throw new BadRequestError(
      first?.message ?? 'Invalid request',
      ErrorCode.INVALID_REQUEST
    );
  }

  const { operation } = base.data;

  // Step 2 — Operation-specific parsing
  switch (operation) {
    case 'find': {
      const result = findRequestSchema.safeParse(body);
      if (!result.success) {
        throw new BadRequestError(result.error.issues[0]?.message ?? 'Invalid find request', ErrorCode.INVALID_REQUEST);
      }
      // Step 3 — Operator validation
      validateFilterOperators(result.data.filter as Record<string, unknown>);
      return result.data as FindRequest;
    }

    case 'find-one': {
      const result = findOneRequestSchema.safeParse(body);
      if (!result.success) {
        throw new BadRequestError(result.error.issues[0]?.message ?? 'Invalid find-one request', ErrorCode.INVALID_REQUEST);
      }
      validateFilterOperators(result.data.filter as Record<string, unknown>);
      return result.data as FindOneRequest;
    }

    case 'insert-one': {
      const result = insertOneRequestSchema.safeParse(body);
      if (!result.success) {
        throw new BadRequestError(result.error.issues[0]?.message ?? 'Invalid insert-one request', ErrorCode.INVALID_REQUEST);
      }
      return result.data as InsertOneRequest;
    }

    case 'update-one': {
      const result = updateOneRequestSchema.safeParse(body);
      if (!result.success) {
        throw new BadRequestError(result.error.issues[0]?.message ?? 'Invalid update-one request', ErrorCode.INVALID_REQUEST);
      }
      validateFilterOperators(result.data.filter as Record<string, unknown>);
      validateUpdateOperators(result.data.update as Record<string, unknown>);
      return result.data as UpdateOneRequest;
    }

    case 'delete-one': {
      const result = deleteOneRequestSchema.safeParse(body);
      if (!result.success) {
        throw new BadRequestError(result.error.issues[0]?.message ?? 'Invalid delete-one request', ErrorCode.INVALID_REQUEST);
      }
      validateFilterOperators(result.data.filter as Record<string, unknown>);
      return result.data as DeleteOneRequest;
    }

    default: {
      throw new BadRequestError(
        `Unsupported operation: "${operation}"`,
        ErrorCode.UNSUPPORTED_OPERATION
      );
    }
  }
}
