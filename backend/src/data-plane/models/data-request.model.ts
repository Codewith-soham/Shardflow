import { z } from 'zod';

// ─── Supported Operations ─────────────────────────────────────────────────────

/**
 * Enumeration of all V1 Data Plane supported operations.
 * Source of truth: docs/api.md §25
 *
 * No other operation is accepted unless this document and api.md are updated.
 */
export const DataOperation = {
  FIND: 'find',
  FIND_ONE: 'find-one',
  INSERT_ONE: 'insert-one',
  UPDATE_ONE: 'update-one',
  DELETE_ONE: 'delete-one',
} as const;

export type DataOperation = (typeof DataOperation)[keyof typeof DataOperation];

// ─── Operator Allowlists ──────────────────────────────────────────────────────

/**
 * V1 permitted filter operators — docs/api.md §32
 */
export const ALLOWED_FILTER_OPERATORS = new Set([
  '$eq', '$ne', '$gt', '$gte', '$lt', '$lte',
  '$in', '$nin', '$exists',
]);

/**
 * V1 permitted logical operators — docs/api.md §33
 */
export const ALLOWED_LOGICAL_OPERATORS = new Set([
  '$and', '$or', '$not',
]);

/**
 * V1 permitted array operators — docs/api.md §34
 */
export const ALLOWED_ARRAY_OPERATORS = new Set([
  '$elemMatch',
]);

/**
 * V1 permitted update operators — docs/api.md §35
 */
export const ALLOWED_UPDATE_OPERATORS = new Set([
  '$set', '$unset', '$inc', '$min', '$max', '$mul',
]);

/**
 * All allowed operators in filter context (filter + logical + array).
 */
export const ALL_ALLOWED_FILTER_OPERATORS = new Set([
  ...ALLOWED_FILTER_OPERATORS,
  ...ALLOWED_LOGICAL_OPERATORS,
  ...ALLOWED_ARRAY_OPERATORS,
]);

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum number of documents returnable by a single `find` — docs/api.md §39 */
export const MAX_FIND_LIMIT = 100;

/** Maximum request body size in bytes (1 MB) — docs/api.md §52 */
export const MAX_REQUEST_BODY_BYTES = 1_048_576;

/** Valid MongoDB collection name pattern — docs/api.md §40 */
const COLLECTION_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_.]{0,119}$/;

// ─── Shared Field Schemas ─────────────────────────────────────────────────────

const tenantIdSchema = z
  .string()
  .min(1, 'tenantId is required')
  .max(256, 'tenantId is too long');

const collectionSchema = z
  .string()
  .min(1, 'collection is required')
  .max(120, 'collection name too long')
  .regex(COLLECTION_NAME_PATTERN, 'Invalid collection name — must start with a letter or underscore and contain only letters, digits, underscores, or dots');

const filterSchema = z.record(z.string(), z.unknown()).default({});

const projectionSchema = z
  .record(z.string(), z.union([z.literal(0), z.literal(1)]))
  .optional();

const sortSchema = z
  .record(z.string(), z.union([z.literal(1), z.literal(-1)]))
  .optional();

// ─── Per-Operation Schemas ────────────────────────────────────────────────────

export const findRequestSchema = z.object({
  tenantId: tenantIdSchema,
  operation: z.literal('find'),
  collection: collectionSchema,
  filter: filterSchema,
  options: z
    .object({
      limit: z.number().int().min(1).max(MAX_FIND_LIMIT).default(20),
      skip: z.number().int().min(0).default(0),
      sort: sortSchema,
      projection: projectionSchema,
    })
    .default({ limit: 20, skip: 0 }),
});

export const findOneRequestSchema = z.object({
  tenantId: tenantIdSchema,
  operation: z.literal('find-one'),
  collection: collectionSchema,
  filter: filterSchema,
  options: z
    .object({
      projection: projectionSchema,
    })
    .optional(),
});

export const insertOneRequestSchema = z.object({
  tenantId: tenantIdSchema,
  operation: z.literal('insert-one'),
  collection: collectionSchema,
  document: z.record(z.string(), z.unknown()),
});

export const updateOneRequestSchema = z.object({
  tenantId: tenantIdSchema,
  operation: z.literal('update-one'),
  collection: collectionSchema,
  filter: filterSchema,
  update: z.record(z.string(), z.unknown()),
});

export const deleteOneRequestSchema = z.object({
  tenantId: tenantIdSchema,
  operation: z.literal('delete-one'),
  collection: collectionSchema,
  filter: filterSchema,
});

// ─── Base Schema (used for initial parse + operation dispatch) ────────────────

export const baseDataRequestSchema = z.object({
  tenantId: tenantIdSchema,
  operation: z.enum(['find', 'find-one', 'insert-one', 'update-one', 'delete-one']),
  collection: collectionSchema,
});

// ─── Typed Request Interfaces ─────────────────────────────────────────────────

export type FindRequest = z.infer<typeof findRequestSchema>;
export type FindOneRequest = z.infer<typeof findOneRequestSchema>;
export type InsertOneRequest = z.infer<typeof insertOneRequestSchema>;
export type UpdateOneRequest = z.infer<typeof updateOneRequestSchema>;
export type DeleteOneRequest = z.infer<typeof deleteOneRequestSchema>;

export type DataPlaneRequest =
  | FindRequest
  | FindOneRequest
  | InsertOneRequest
  | UpdateOneRequest
  | DeleteOneRequest;

// ─── Response Shapes ──────────────────────────────────────────────────────────

export interface FindResponse {
  documents: unknown[];
}

export interface FindOneResponse {
  document: unknown | null;
}

export interface InsertOneResponse {
  insertedId: string;
}

export interface UpdateOneResponse {
  matchedCount: number;
  modifiedCount: number;
}

export interface DeleteOneResponse {
  deletedCount: number;
}

export type DataPlaneResponse =
  | FindResponse
  | FindOneResponse
  | InsertOneResponse
  | UpdateOneResponse
  | DeleteOneResponse;
