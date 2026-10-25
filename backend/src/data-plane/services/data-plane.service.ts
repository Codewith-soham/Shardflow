import { parseAndValidateDataRequest } from './request-validator.js';
import { DatabaseExecutor, type ExecutionLogger } from './database-executor.js';
import { RoutingEngine } from './routing-engine.js';
import type { Project } from '../../control-plane/index.js';
import type { DataPlaneResponse, TenantContext } from '../models/data-request.model.js';
import { BadRequestError, ForbiddenError } from '../../errors/app-error.js';
import { ErrorCode } from '../../errors/codes.js';

export interface ExecuteOperationResult {
  data: DataPlaneResponse;
  message: string;
}

export class DataPlaneService {
  private readonly routingEngine: RoutingEngine;
  private readonly databaseExecutor: DatabaseExecutor;

  constructor(
    routingEngine?: RoutingEngine,
    databaseExecutor?: DatabaseExecutor
  ) {
    this.routingEngine = routingEngine ?? new RoutingEngine();
    this.databaseExecutor = databaseExecutor ?? new DatabaseExecutor();
  }

  /**
   * Processes a Data Plane request:
   * 1. Request validation (operators, options, collection)
   * 2. Tenant Context resolution & Fail-Closed verification
   * 3. Tenant → Shard resolution using RoutingEngine
   * 4. Operation execution carrying explicit tenant context against target MongoDB connection pool
   */
  async processRequest(
    project: Project,
    rawBody: unknown,
    tenantContext?: TenantContext,
    logger?: ExecutionLogger
  ): Promise<ExecuteOperationResult> {
    // 1. Validate request body
    const request = parseAndValidateDataRequest(rawBody);

    // 2. Resolve & verify tenant context
    const effectiveTenantId = tenantContext?.tenantId ?? request.tenantId;

    if (!effectiveTenantId || typeof effectiveTenantId !== 'string' || effectiveTenantId.trim() === '') {
      throw new BadRequestError(
        'Tenant identity could not be resolved from request',
        ErrorCode.TENANT_RESOLUTION_FAILED
      );
    }

    if (tenantContext && request.tenantId && tenantContext.tenantId.trim() !== request.tenantId.trim()) {
      throw new ForbiddenError(
        'Tenant identifier in request body does not match authenticated tenant context',
        ErrorCode.TENANT_ACCESS_DENIED
      );
    }

    if (tenantContext && tenantContext.projectId !== project._id.toString()) {
      throw new ForbiddenError(
        'Project mismatch in tenant context',
        ErrorCode.PROJECT_ACCESS_DENIED
      );
    }

    const resolvedTenantContext: TenantContext = tenantContext ?? {
      tenantId: effectiveTenantId.trim(),
      projectId: project._id.toString(),
    };

    // 3. Resolve target shard via Routing Engine
    const shard = await this.routingEngine.resolveShard(project._id, resolvedTenantContext.tenantId);

    // 4. Execute database operation with explicit tenant context
    const data = await this.databaseExecutor.execute(shard, request, resolvedTenantContext, logger);

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
