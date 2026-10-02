import { ErrorCode } from '../../errors/codes.js';
import { NotFoundError, ServiceUnavailableError } from '../../errors/app-error.js';
import { parseAndValidateDataRequest } from './request-validator.js';
import { DatabaseExecutor } from './database-executor.js';
import {
  TenantMappingRepository,
  ShardRepository,
  ShardStatus,
  type Project,
} from '../../control-plane/index.js';
import type { DataPlaneResponse } from '../models/data-request.model.js';

export interface ExecuteOperationResult {
  data: DataPlaneResponse;
  message: string;
}

export class DataPlaneService {
  private readonly tenantMappingRepository: TenantMappingRepository;
  private readonly shardRepository: ShardRepository;
  private readonly databaseExecutor: DatabaseExecutor;

  constructor(
    tenantMappingRepository?: TenantMappingRepository,
    shardRepository?: ShardRepository,
    databaseExecutor?: DatabaseExecutor
  ) {
    this.tenantMappingRepository = tenantMappingRepository ?? new TenantMappingRepository();
    this.shardRepository = shardRepository ?? new ShardRepository();
    this.databaseExecutor = databaseExecutor ?? new DatabaseExecutor();
  }

  /**
   * Processes a Data Plane request:
   * 1. Request validation (operators, options, collection)
   * 2. Tenant → Shard resolution
   * 3. Shard health & active status verification
   * 4. Operation execution against target MongoDB connection pool
   */
  async processRequest(
    project: Project,
    rawBody: unknown
  ): Promise<ExecuteOperationResult> {
    // 1. Validate request body
    const request = parseAndValidateDataRequest(rawBody);

    // 2. Resolve tenant mapping for project
    const mapping = await this.tenantMappingRepository.findByProjectAndTenant(
      project._id,
      request.tenantId
    );

    if (!mapping) {
      throw new NotFoundError(
        `Tenant "${request.tenantId}" has no active shard mapping`,
        ErrorCode.TENANT_MAPPING_NOT_FOUND
      );
    }

    // 3. Resolve target shard
    const shard = await this.shardRepository.findByIdAndProjectId(
      mapping.shardId,
      project._id
    );

    if (!shard) {
      throw new NotFoundError(
        `Mapped shard not found for tenant "${request.tenantId}"`,
        ErrorCode.SHARD_NOT_FOUND
      );
    }

    if (shard.status !== ShardStatus.ACTIVE) {
      throw new ServiceUnavailableError(
        `Mapped shard "${shard.name}" is currently disabled`,
        ErrorCode.SHARD_UNAVAILABLE
      );
    }

    // 4. Execute operation
    const data = await this.databaseExecutor.execute(shard, request);

    // 5. Success message synthesis
    const message = this.getSuccessMessage(request.operation);

    return { data, message };
  }

  private getSuccessMessage(operation: string): string {
    switch (operation) {
      case 'find':
        return 'Documents retrieved successfully';
      case 'find-one':
        return 'Document retrieved successfully';
      case 'insert-one':
        return 'Document inserted successfully';
      case 'update-one':
        return 'Document updated successfully';
      case 'delete-one':
        return 'Document deleted successfully';
      default:
        return 'Operation completed successfully';
    }
  }
}
