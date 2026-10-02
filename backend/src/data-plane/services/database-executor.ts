import { ObjectId } from 'mongodb';
import { ErrorCode } from '../../errors/codes.js';
import { BadRequestError, DatabaseError } from '../../errors/app-error.js';
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
} from '../models/data-request.model.js';

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

  constructor(connManager?: ConnectionManager) {
    this.connManager = connManager ?? connectionManager;
  }

  /**
   * Executes a validated Data Plane request against the resolved MongoDB shard.
   * Enforces operation-specific driver options and error mapping.
   */
  async execute(shard: Shard, request: DataPlaneRequest): Promise<DataPlaneResponse> {
    try {
      const db = await this.connManager.getConnection(shard);
      const collection = db.collection(request.collection);

      switch (request.operation) {
        case 'find':
          return await this.executeFind(collection, request as FindRequest);

        case 'find-one':
          return await this.executeFindOne(collection, request as FindOneRequest);

        case 'insert-one':
          return await this.executeInsertOne(collection, request as InsertOneRequest);

        case 'update-one':
          return await this.executeUpdateOne(collection, request as UpdateOneRequest);

        case 'delete-one':
          return await this.executeDeleteOne(collection, request as DeleteOneRequest);

        default:
          throw new BadRequestError(
            `Unsupported operation: ${(request as any).operation}`,
            ErrorCode.UNSUPPORTED_OPERATION
          );
      }
    } catch (err) {
      if (err instanceof BadRequestError || err instanceof DatabaseError) {
        throw err;
      }

      const mongoErr = err as { code?: number; name?: string; message?: string };

      // Duplicate key error (E11000)
      if (mongoErr.code === 11000) {
        throw new BadRequestError(
          `Duplicate key error: ${mongoErr.message ?? 'Document already exists'}`,
          ErrorCode.DATABASE_DUPLICATE_KEY
        );
      }

      // Mongo query timeout (MaxTimeMSExpired = 50)
      if (mongoErr.code === 50 || mongoErr.name === 'MongoTimeoutError' || mongoErr.name === 'MongoServerSelectionError') {
        throw new DatabaseError(
          `Database operation timed out: ${mongoErr.message ?? 'Operation timed out'}`,
          ErrorCode.DATABASE_OPERATION_TIMEOUT
        );
      }

      throw new DatabaseError(
        `Database operation failed: ${mongoErr.message ?? String(err)}`,
        ErrorCode.DATABASE_OPERATION_FAILED
      );
    }
  }

  private async executeFind(
    collection: ReturnType<import('mongodb').Db['collection']>,
    request: FindRequest
  ) {
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
    request: FindOneRequest
  ) {
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
    request: InsertOneRequest
  ) {
    const result = await collection.insertOne(request.document);
    return { insertedId: result.insertedId.toString() };
  }

  private async executeUpdateOne(
    collection: ReturnType<import('mongodb').Db['collection']>,
    request: UpdateOneRequest
  ) {
    const filter = normalizeFilter(request.filter ?? {});
    const result = await collection.updateOne(filter, request.update);
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  private async executeDeleteOne(
    collection: ReturnType<import('mongodb').Db['collection']>,
    request: DeleteOneRequest
  ) {
    const filter = normalizeFilter(request.filter ?? {});
    const result = await collection.deleteOne(filter);
    return { deletedCount: result.deletedCount };
  }
}
