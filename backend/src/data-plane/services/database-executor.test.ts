import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';

import { DatabaseExecutor, type ExecutionLogger } from './database-executor.js';
import { ErrorCode } from '../../errors/codes.js';
import { ForbiddenError, BadRequestError, DatabaseError } from '../../errors/app-error.js';
import { ShardStatus, ShardHealthStatus, type Shard } from '../../control-plane/models/shard.model.js';
import type { TenantContext } from '../models/data-request.model.js';

describe('DatabaseExecutor — Tenant Context & Execution Invariant', () => {
  const shardId = new ObjectId();
  const projectId = new ObjectId();

  const mockShard: Shard = {
    _id: shardId,
    projectId,
    name: 'Shard Alpha',
    encryptedConnectionUri: 'encrypted',
    status: ShardStatus.ACTIVE,
    healthStatus: ShardHealthStatus.HEALTHY,
    lastHealthCheckAt: new Date(),
    lastSuccessfulHealthCheckAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validTenantContext: TenantContext = {
    tenantId: 'tenant_omega',
    projectId: projectId.toString(),
  };

  let mockCollection: any;
  let mockDb: any;
  let mockConnManager: any;
  let mockLogger: ExecutionLogger;
  let loggedInfo: Array<{ obj: Record<string, unknown>; msg?: string }>;
  let loggedError: Array<{ obj: Record<string, unknown>; msg?: string }>;

  beforeEach(() => {
    loggedInfo = [];
    loggedError = [];

    mockLogger = {
      info: vi.fn((obj, msg) => {
        loggedInfo.push({ obj, msg });
      }),
      error: vi.fn((obj, msg) => {
        loggedError.push({ obj, msg });
      }),
    };

    mockCollection = {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        project: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([{ _id: new ObjectId(), tenantId: 'tenant_omega', name: 'Doc 1' }]),
      }),
      findOne: vi.fn().mockResolvedValue({ _id: new ObjectId(), tenantId: 'tenant_omega', name: 'Doc 1' }),
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      updateOne: vi.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    };

    mockDb = {
      collection: vi.fn().mockReturnValue(mockCollection),
    };

    mockConnManager = {
      getConnection: vi.fn().mockResolvedValue(mockDb),
    };
  });

  describe('Fail Closed: Tenant Context Requirement', () => {
    it('throws TENANT_ACCESS_DENIED when tenantContext is missing entirely', async () => {
      const executor = new DatabaseExecutor(mockConnManager, mockLogger);

      await expect(
        executor.execute(
          mockShard,
          { tenantId: 'tenant_omega', operation: 'find', collection: 'items', filter: {} } as any,
          undefined as any
        )
      ).rejects.toThrow(ForbiddenError);

      try {
        await executor.execute(
          mockShard,
          { tenantId: 'tenant_omega', operation: 'find', collection: 'items', filter: {} } as any,
          undefined as any
        );
      } catch (err: any) {
        expect(err.code).toBe(ErrorCode.TENANT_ACCESS_DENIED);
        expect(err.message).toMatch(/missing required tenant context/i);
      }
    });

    it('throws TENANT_ACCESS_DENIED when tenantId is empty or whitespace', async () => {
      const executor = new DatabaseExecutor(mockConnManager, mockLogger);

      await expect(
        executor.execute(
          mockShard,
          { tenantId: '', operation: 'find', collection: 'items', filter: {} } as any,
          { tenantId: '   ', projectId: projectId.toString() }
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws PROJECT_ACCESS_DENIED when projectId is missing from context', async () => {
      const executor = new DatabaseExecutor(mockConnManager, mockLogger);

      try {
        await executor.execute(
          mockShard,
          { tenantId: 'tenant_omega', operation: 'find', collection: 'items', filter: {} } as any,
          { tenantId: 'tenant_omega', projectId: '' }
        );
        expect.unreachable('Should have thrown');
      } catch (err: any) {
        expect(err.code).toBe(ErrorCode.PROJECT_ACCESS_DENIED);
      }
    });

    it('throws TENANT_ACCESS_DENIED when request tenantId does not match execution context tenantId', async () => {
      const executor = new DatabaseExecutor(mockConnManager, mockLogger);

      try {
        await executor.execute(
          mockShard,
          { tenantId: 'tenant_other', operation: 'find', collection: 'items', filter: {} } as any,
          validTenantContext
        );
        expect.unreachable('Should have thrown');
      } catch (err: any) {
        expect(err.code).toBe(ErrorCode.TENANT_ACCESS_DENIED);
        expect(err.message).toMatch(/tenant context mismatch/i);
      }
    });
  });

  describe('Data Plane Operations with Context Availability', () => {
    it('executes `find` with tenant context available at the point of call', async () => {
      const executor = new DatabaseExecutor(mockConnManager, mockLogger);

      const res = await executor.execute(
        mockShard,
        {
          tenantId: 'tenant_omega',
          operation: 'find',
          collection: 'orders',
          filter: { status: 'pending' },
          options: { limit: 10, skip: 0 },
        },
        validTenantContext
      );

      expect(mockDb.collection).toHaveBeenCalledWith('orders');
      expect(mockCollection.find).toHaveBeenCalledWith({ status: 'pending' });
      expect((res as any).documents).toHaveLength(1);
    });

    it('executes `find-one` with tenant context available at the point of call', async () => {
      const executor = new DatabaseExecutor(mockConnManager, mockLogger);

      const res = await executor.execute(
        mockShard,
        {
          tenantId: 'tenant_omega',
          operation: 'find-one',
          collection: 'orders',
          filter: { status: 'active' },
        },
        validTenantContext
      );

      expect(mockCollection.findOne).toHaveBeenCalledWith({ status: 'active' }, {});
      expect((res as any).document).toBeDefined();
    });

    it('executes `insert-one` with tenant context available at the point of call', async () => {
      const executor = new DatabaseExecutor(mockConnManager, mockLogger);

      const res = await executor.execute(
        mockShard,
        {
          tenantId: 'tenant_omega',
          operation: 'insert-one',
          collection: 'orders',
          document: { customer: 'Omega Corp', total: 500 },
        },
        validTenantContext
      );

      expect(mockCollection.insertOne).toHaveBeenCalledWith({ customer: 'Omega Corp', total: 500 });
      expect((res as any).insertedId).toBeDefined();
    });

    it('executes `update-one` with tenant context available at the point of call', async () => {
      const executor = new DatabaseExecutor(mockConnManager, mockLogger);

      const res = await executor.execute(
        mockShard,
        {
          tenantId: 'tenant_omega',
          operation: 'update-one',
          collection: 'orders',
          filter: { status: 'pending' },
          update: { $set: { status: 'completed' } },
        },
        validTenantContext
      );

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { status: 'pending' },
        { $set: { status: 'completed' } }
      );
      expect((res as any).matchedCount).toBe(1);
    });

    it('executes `delete-one` with tenant context available at the point of call', async () => {
      const executor = new DatabaseExecutor(mockConnManager, mockLogger);

      const res = await executor.execute(
        mockShard,
        {
          tenantId: 'tenant_omega',
          operation: 'delete-one',
          collection: 'orders',
          filter: { status: 'archived' },
        },
        validTenantContext
      );

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ status: 'archived' });
      expect((res as any).deletedCount).toBe(1);
    });
  });

  describe('Observability: Logs Contain Identifiers But No Data Contents', () => {
    it('logs tenant and project identifiers on start and completion without logging query data', async () => {
      const executor = new DatabaseExecutor(mockConnManager, mockLogger);

      const sensitivePayload = {
        secretNote: 'Top secret customer data',
        nestedData: { ssn: '000-00-0000' },
      };

      await executor.execute(
        mockShard,
        {
          tenantId: 'tenant_omega',
          operation: 'insert-one',
          collection: 'classified',
          document: sensitivePayload,
        },
        validTenantContext
      );

      expect(loggedInfo.length).toBeGreaterThanOrEqual(2);

      for (const entry of loggedInfo) {
        expect(entry.obj.tenantId).toBe('tenant_omega');
        expect(entry.obj.projectId).toBe(projectId.toString());
        expect(entry.obj.shardId).toBe(shardId.toString());
        expect(entry.obj.operation).toBe('insert-one');
        expect(entry.obj.collection).toBe('classified');

        // Verify strictly that data contents are NOT present in logs
        expect(entry.obj).not.toHaveProperty('document');
        expect(entry.obj).not.toHaveProperty('filter');
        expect(entry.obj).not.toHaveProperty('update');
        expect(entry.obj).not.toHaveProperty('secretNote');
        expect(JSON.stringify(entry.obj)).not.toContain('Top secret');
        expect(JSON.stringify(entry.obj)).not.toContain('000-00-0000');
      }
    });

    it('sanitizes duplicate key error messages without leaking data contents', async () => {
      mockCollection.insertOne.mockRejectedValueOnce({
        code: 11000,
        message: 'E11000 duplicate key error collection: test.users index: email_1 dup key: { email: "alice@secret.com" }',
      });

      const executor = new DatabaseExecutor(mockConnManager, mockLogger);

      try {
        await executor.execute(
          mockShard,
          {
            tenantId: 'tenant_omega',
            operation: 'insert-one',
            collection: 'users',
            document: { email: 'alice@secret.com' },
          },
          validTenantContext
        );
        expect.unreachable('Should have thrown duplicate key error');
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadRequestError);
        expect(err.code).toBe(ErrorCode.DATABASE_DUPLICATE_KEY);
        // Ensure email or sensitive payload wasn't echoed in error message
        expect(err.message).not.toContain('alice@secret.com');
        expect(err.message).toContain('collection "users"');
      }

      // Check error logs do not contain raw document data
      expect(loggedError.length).toBe(1);
      expect(loggedError[0].obj.tenantId).toBe('tenant_omega');
      expect(loggedError[0].obj.projectId).toBe(projectId.toString());
      expect(JSON.stringify(loggedError[0].obj)).not.toContain('alice@secret.com');
    });
  });
});
