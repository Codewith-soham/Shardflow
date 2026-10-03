import type { FastifyRequest, FastifyReply } from 'fastify';
import { ObjectId } from 'mongodb';

import { UnauthorizedError, BadRequestError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/codes.js';
import { HealthService } from './health.service.js';

export class HealthController {
  private readonly healthService: HealthService;

  constructor(healthService?: HealthService) {
    this.healthService = healthService ?? new HealthService();
  }

  /**
   * GET /api/v1/projects/:projectId/health
   * Retrieves shard health status for all shards in the given project.
   *
   * Contract: docs/task.md §19 (Get Project Shard Health)
   */
  async getProjectHealth(
    request: FastifyRequest<{ Params: { projectId: string } }>,
    _reply: FastifyReply
  ) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedError('Authentication required', ErrorCode.AUTHENTICATION_REQUIRED);
    }

    const { projectId } = request.params;
    if (!projectId || !ObjectId.isValid(projectId)) {
      throw new BadRequestError('Invalid project ID format', ErrorCode.INVALID_PROJECT_ID);
    }

    const healthData = await this.healthService.getProjectHealth(projectId, user._id);

    return {
      success: true,
      data: healthData,
      message: 'Shard health retrieved successfully',
    };
  }
}
