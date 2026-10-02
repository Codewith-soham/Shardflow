import type { FastifyRequest, FastifyReply } from 'fastify';

import { RoutingService } from '../services/routing.service.js';
import { createTenantMappingSchema } from '../models/tenant-mapping.model.js';
import { BadRequestError } from '../../errors/app-error.js';
import { ErrorCode } from '../../errors/codes.js';

export class TenantMappingController {
  private readonly routingService: RoutingService;

  constructor(routingService?: RoutingService) {
    this.routingService = routingService ?? new RoutingService();
  }

  async createTenantMapping(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user!;
    const { projectId } = request.params as { projectId: string };

    const validation = createTenantMappingSchema.safeParse(request.body);
    if (!validation.success) {
      throw new BadRequestError(
        validation.error.issues[0]?.message ?? 'Invalid tenant mapping payload',
        ErrorCode.INVALID_REQUEST
      );
    }

    const mapping = await this.routingService.createTenantMapping(
      projectId,
      user._id,
      validation.data
    );

    return reply.status(201).send({
      success: true,
      data: {
        id: mapping._id.toString(),
        projectId: mapping.projectId.toString(),
        tenantId: mapping.tenantId,
        shardId: mapping.shardId.toString(),
        createdAt: mapping.createdAt.toISOString(),
        updatedAt: mapping.updatedAt.toISOString(),
      },
      message: 'Tenant mapping created successfully',
    });
  }

  async listTenantMappings(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user!;
    const { projectId } = request.params as { projectId: string };

    const mappings = await this.routingService.listTenantMappings(projectId, user._id);

    return reply.status(200).send({
      success: true,
      data: {
        tenantMappings: mappings.map((m) => ({
          id: m._id.toString(),
          projectId: m.projectId.toString(),
          tenantId: m.tenantId,
          shardId: m.shardId.toString(),
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })),
      },
      message: 'Tenant mappings retrieved successfully',
    });
  }

  async getTenantMapping(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user!;
    const { projectId, mappingId } = request.params as { projectId: string; mappingId: string };

    const mapping = await this.routingService.getTenantMapping(projectId, mappingId, user._id);

    return reply.status(200).send({
      success: true,
      data: {
        id: mapping._id.toString(),
        projectId: mapping.projectId.toString(),
        tenantId: mapping.tenantId,
        shardId: mapping.shardId.toString(),
        createdAt: mapping.createdAt.toISOString(),
        updatedAt: mapping.updatedAt.toISOString(),
      },
      message: 'Tenant mapping retrieved successfully',
    });
  }

  async updateTenantMapping(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user!;
    const { projectId, mappingId } = request.params as { projectId: string; mappingId: string };

    const body = request.body as { shardId?: string };
    if (!body || typeof body.shardId !== 'string' || body.shardId.trim() === '') {
      throw new BadRequestError('shardId is required', ErrorCode.INVALID_REQUEST);
    }

    const mapping = await this.routingService.updateTenantMapping(
      projectId,
      mappingId,
      user._id,
      { shardId: body.shardId.trim() }
    );

    return reply.status(200).send({
      success: true,
      data: {
        id: mapping._id.toString(),
        projectId: mapping.projectId.toString(),
        tenantId: mapping.tenantId,
        shardId: mapping.shardId.toString(),
        createdAt: mapping.createdAt.toISOString(),
        updatedAt: mapping.updatedAt.toISOString(),
      },
      message: 'Tenant mapping updated successfully',
    });
  }

  async deleteTenantMapping(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user!;
    const { projectId, mappingId } = request.params as { projectId: string; mappingId: string };

    await this.routingService.deleteTenantMapping(projectId, mappingId, user._id);

    return reply.status(200).send({
      success: true,
      data: {},
      message: 'Tenant mapping deleted successfully',
    });
  }
}
