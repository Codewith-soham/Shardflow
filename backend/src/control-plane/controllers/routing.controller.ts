import type { FastifyRequest, FastifyReply } from 'fastify';

import { RoutingService } from '../services/routing.service.js';
import { updateRoutingConfigSchema } from '../models/routing-config.model.js';
import { BadRequestError } from '../../errors/app-error.js';
import { ErrorCode } from '../../errors/codes.js';

export class RoutingController {
  private readonly routingService: RoutingService;

  constructor(routingService?: RoutingService) {
    this.routingService = routingService ?? new RoutingService();
  }

  async getRoutingConfig(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user!;
    const { projectId } = request.params as { projectId: string };

    const config = await this.routingService.getRoutingConfig(projectId, user._id);

    return reply.status(200).send({
      success: true,
      data: {
        id: config._id.toString(),
        projectId: config.projectId.toString(),
        strategy: config.strategy,
        routingKey: config.routingKey,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      },
      message: 'Routing configuration retrieved successfully',
    });
  }

  async updateRoutingConfig(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user!;
    const { projectId } = request.params as { projectId: string };

    const validation = updateRoutingConfigSchema.safeParse(request.body);
    if (!validation.success) {
      throw new BadRequestError(
        validation.error.issues[0]?.message ?? 'Invalid routing config payload',
        ErrorCode.INVALID_REQUEST
      );
    }

    const config = await this.routingService.updateRoutingConfig(
      projectId,
      user._id,
      validation.data.strategy
    );

    return reply.status(200).send({
      success: true,
      data: {
        id: config._id.toString(),
        projectId: config.projectId.toString(),
        strategy: config.strategy,
        routingKey: config.routingKey,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      },
      message: 'Routing configuration updated successfully',
    });
  }
}
