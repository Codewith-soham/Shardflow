import { ObjectId } from 'mongodb';
import { ErrorCode } from '../../errors/codes.js';
import { BadRequestError, DatabaseError, ForbiddenError } from '../../errors/app-error.js';
import { connectionManager, type ConnectionManager } from '../../connection-manager/index.js';
import type { Shard } from '../../control-plane/models/shard.model.js';
import type {
  DataPlaneRequest,
  DataPlaneResponse,
  FindRequest,
  FindOneRequest,
  InsertOneRequest,
  UpdateOneRequest,
  DeleteOneRequest,
  TenantContext,
} from '../models/data-request.model.js';

export interface ExecutionLogger {
  info: (obj: Record<string, unknown>, msg?: string) => void;
  error: (obj: Record<string, unknown>, msg?: string) => void;
  warn?: (obj: Record<string, unknown>, msg?: string) => void;
  debug?: (obj: Record<string, unknown>, msg?: string) => void;
}

/**
 * Normalizes filter query fields.
 * Specifically converts 24-character hex string `_id` fields to MongoDB `ObjectId` instances
 * so queries match documents stored with ObjectId primary keys.
 */
export function normalizeFilter(filter: Record<string, unknown>): Record<string, unknown> {
  if (!filter || typeof filter !== 'object') {
    return {};
  }

  const result: Record<string, unknown> = { ...filter };

  if (typeof result._id === 'string' && result._id.length === 24 && ObjectId.isValid(result._id)) {
    result._id = new ObjectId(result._id);
  } else if (result._id && typeof result._id === 'object' && !Array.isArray(result._id)) {
    const _idObj = { ...(result._id as Record<string, unknown>) };
    if (Array.isArray(_idObj.$in)) {
      _idObj.$in = _idObj.$in.map((val) =>
        typeof val === 'string' && val.length === 24 && ObjectId.isValid(val) ? new ObjectId(val) : val
      );
    }
    if (Array.isArray(_idObj.$nin)) {
      _idObj.$nin = _idObj.$nin.map((val) =>
        typeof val === 'string' && val.length === 24 && ObjectId.isValid(val) ? new ObjectId(val) : val
      );
    }
    result._id = _idObj;
  }

  return result;
}

export class DatabaseExecutor {
  private readonly connManager: ConnectionManager;
  private readonly logger?: ExecutionLogger;

  constructor(connManager?: ConnectionManager, logger?: ExecutionLogger) {
    this.connManager = connManager ?? connectionManager;
    this.logger = logger;
  }

  /**
   * Executes a validated Data Plane request against the resolved MongoDB shard.
   * Enforces operation-specific driver options, fail-closed tenant context verification,
   * safe observability (tenant & project identifiers only; no customer data contents),
   * and error mapping.
   */
  async execute(
    shard: Shard,
    request: DataPlaneRequest,
    context?: TenantContext,
    logger?: ExecutionLogger
  ): Promise<DataPlaneResponse> {
    const activeLogger = logger ?? this.logger;

    // Fail closed if tenant context is missing or invalid
    if (!context || !context.tenantId || typeof context.tenantId !== 'string' || context.tenantId.trim() === '') {
      throw new ForbiddenError(
        'Database operation rejected: missing required tenant context at execution boundary',
        ErrorCode.TENANT_ACCESS_DENIED
      );
    }

    if (!context.projectId || typeof context.projectId !== 'string' || context.projectId.trim() === '') {
      throw new ForbiddenError(
        'Database operation rejected: missing required project context at execution boundary',
        ErrorCode.PROJECT_ACCESS_DENIED
      );
    }

    // Fail closed if tenant context conflicts with request payload tenantId
    if (request.tenantId && request.tenantId.trim() !== context.tenantId.trim()) {
      throw new ForbiddenError(
        'Database operation rejected: tenant context mismatch between request payload and execution context',
        ErrorCode.TENANT_ACCESS_DENIED
      );
    }

    // Log operation initiation: only tenant and project identifiers (no data contents)
    activeLogger?.info(
      {
        tenantId: context.tenantId,
        projectId: context.projectId,
        shardId: shard._id.toString(),
        operation: request.operation,
        collection: request.collection,
      },
      'Executing data-plane database operation'
    );

    try {
      const db = await this.connManager.getConnection(shard);
      const collection = db.collection(request.collection);

      let response: DataPlaneResponse;

      switch (request.operation) {
        case 'find':
          response = await this.executeFind(collection, request as FindRequest, context);
          break;

        case 'find-one':
          response = await this.executeFindOne(collection, request as FindOneRequest, context);
          break;

        case 'insert-one':
          response = await this.executeInsertOne(collection, request as InsertOneRequest, context);
          break;

        case 'update-one':
          response = await this.executeUpdateOne(collection, request as UpdateOneRequest, context);
          break;

        case 'delete-one':
          response = await this.executeDeleteOne(collection, request as DeleteOneRequest, context);
          break;

        default:
          throw new BadRequestError(
            `Unsupported operation: ${(request as any).operation}`,
            ErrorCode.UNSUPPORTED_OPERATION
          );
      }

      // Log operation completion: only identifiers (no data contents)
      activeLogger?.info(
        {
          tenantId: context.tenantId,
          projectId: context.projectId,
          shardId: shard._id.toString(),
          operation: request.operation,
          collection: request.collection,
        },
        'Database operation completed successfully'
      );

      return response;
    } catch (err) {
      // Log operation failure: only identifiers and error code (no data contents)
      activeLogger?.error(
        {
          tenantId: context.tenantId,
          projectId: context.projectId,
          shardId: shard._id.toString(),
          operation: request.operation,
          collection: request.collection,
        },
        'Database operation failed'
      );

      if (err instanceof BadRequestError || err instanceof DatabaseError || err instanceof ForbiddenError) {
        throw err;
      }

      const mongoErr = err as { code?: number; name?: string; message?: string };

      // Duplicate key error (E11000) — sanitize message to prevent customer data leak
      if (mongoErr.code === 11000) {
        throw new BadRequestError(
          `Duplicate key error: A document with that unique key already exists in collection "${request.collection}"`,
          ErrorCode.DATABASE_DUPLICATE_KEY
        );
      }

      // Mongo query timeout (MaxTimeMSExpired = 50)
      if (mongoErr.code === 50 || mongoErr.name === 'MongoTimeoutError' || mongoErr.name === 'MongoServerSelectionError') {
        throw new DatabaseError(
          `Database operation timed out on collection "${request.collection}"`,
          ErrorCode.DATABASE_OPERATION_TIMEOUT
        );
      }

      throw new DatabaseError(
        `Database operation failed on collection "${request.collection}"`,
        ErrorCode.DATABASE_OPERATION_FAILED
      );
    }
  }

  private async executeFind(
    collection: ReturnType<import('mongodb').Db['collection']>,
    request: FindRequest,
    context: TenantContext
  ) {
    if (!context?.tenantId) {
      throw new ForbiddenError(
        'Tenant context missing at point of database call',
        ErrorCode.TENANT_ACCESS_DENIED
      );
    }
    const filter = normalizeFilter(request.filter ?? {});
    let cursor = collection.find(filter);

    if (request.options?.sort) {
      cursor = cursor.sort(request.options.sort);
    }
    if (request.options?.skip !== undefined && request.options.skip > 0) {
      cursor = cursor.skip(request.options.skip);
    }
    if (request.options?.limit !== undefined) {
      cursor = cursor.limit(request.options.limit);
    }
    if (request.options?.projection) {
      cursor = cursor.project(request.options.projection);
    }

    const documents = await cursor.toArray();
    return { documents };
  }

  private async executeFindOne(
    collection: ReturnType<import('mongodb').Db['collection']>,
    request: FindOneRequest,
    context: TenantContext
  ) {
    if (!context?.tenantId) {
      throw new ForbiddenError(
        'Tenant context missing at point of database call',
        ErrorCode.TENANT_ACCESS_DENIED
      );
    }
    const filter = normalizeFilter(request.filter ?? {});
    const findOptions: { projection?: Record<string, 0 | 1> } = {};
    if (request.options?.projection) {
      findOptions.projection = request.options.projection;
    }
    const document = await collection.findOne(filter, findOptions);
    return { document: document ?? null };
  }

  private async executeInsertOne(
    collection: ReturnType<import('mongodb').Db['collection']>,
    request: InsertOneRequest,
    context: TenantContext
  ) {
    if (!context?.tenantId) {
      throw new ForbiddenError(
        'Tenant context missing at point of database call',
        ErrorCode.TENANT_ACCESS_DENIED
      );
    }
    const result = await collection.insertOne(request.document);
    return { insertedId: result.insertedId.toString() };
  }

  private async executeUpdateOne(
    collection: ReturnType<import('mongodb').Db['collection']>,
    request: UpdateOneRequest,
    context: TenantContext
  ) {
    if (!context?.tenantId) {
      throw new ForbiddenError(
        'Tenant context missing at point of database call',
        ErrorCode.TENANT_ACCESS_DENIED
      );
    }
    const filter = normalizeFilter(request.filter ?? {});
    const result = await collection.updateOne(filter, request.update);
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  private async executeDeleteOne(
    collection: ReturnType<import('mongodb').Db['collection']>,
    request: DeleteOneRequest,
    context: TenantContext
  ) {
    if (!context?.tenantId) {
      throw new ForbiddenError(
        'Tenant context missing at point of database call',
        ErrorCode.TENANT_ACCESS_DENIED
      );
    }
    const filter = normalizeFilter(request.filter ?? {});
    const result = await collection.deleteOne(filter);
    return { deletedCount: result.deletedCount };
  }
}
