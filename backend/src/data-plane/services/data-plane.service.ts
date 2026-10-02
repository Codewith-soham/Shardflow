import { parseAndValidateDataRequest } from './request-validator.js';
import { DatabaseExecutor } from './database-executor.js';
import { RoutingEngine } from './routing-engine.js';
import type { Project } from '../../control-plane/index.js';
import type { DataPlaneResponse } from '../models/data-request.model.js';

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
   * 2. Tenant → Shard resolution using RoutingEngine
   * 3. Operation execution against target MongoDB connection pool
   */
  async processRequest(
    project: Project,
    rawBody: unknown
  ): Promise<ExecuteOperationResult> {
    // 1. Validate request body
    const request = parseAndValidateDataRequest(rawBody);

    // 2. Resolve target shard via Routing Engine
    const shard = await this.routingEngine.resolveShard(project._id, request.tenantId);

    // 3. Execute database operation
    const data = await this.databaseExecutor.execute(shard, request);

    // 4. Success message synthesis
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
