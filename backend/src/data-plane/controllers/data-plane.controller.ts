import type { FastifyRequest, FastifyReply } from 'fastify';

import { DataPlaneService } from '../services/data-plane.service.js';
import { BadRequestError, ForbiddenError } from '../../errors/app-error.js';
import { ErrorCode } from '../../errors/codes.js';
import type { TenantContext } from '../models/data-request.model.js';

export class DataPlaneController {
  private readonly dataPlaneService: DataPlaneService;

  constructor(dataPlaneService?: DataPlaneService) {
    this.dataPlaneService = dataPlaneService ?? new DataPlaneService();
  }

  async execute(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const context = request.dataPlaneContext;

    if (!context) {
      throw new BadRequestError(
        'Request missing authentication context',
        ErrorCode.AUTHENTICATION_REQUIRED
      );
    }

    // Resolve tenant identity from header or request body
    const rawHeaderTenantId = request.headers['x-tenant-id'];
    const rawBody = request.body as Record<string, unknown> | undefined;
    const bodyTenantId = typeof rawBody?.tenantId === 'string' ? rawBody.tenantId.trim() : undefined;

    let resolvedTenantId: string | undefined;

    if (rawHeaderTenantId !== undefined) {
      if (typeof rawHeaderTenantId !== 'string' || rawHeaderTenantId.trim() === '' || rawHeaderTenantId.trim().length > 256) {
        throw new BadRequestError('Invalid X-Tenant-Id header format', ErrorCode.INVALID_TENANT_ID);
      }
      const headerTenantId = rawHeaderTenantId.trim();

      if (bodyTenantId && bodyTenantId !== headerTenantId) {
        throw new ForbiddenError(
          'Tenant context mismatch between X-Tenant-Id header and request payload',
          ErrorCode.TENANT_ACCESS_DENIED
        );
      }

      resolvedTenantId = headerTenantId;

      // If body didn't specify tenantId, populate it from header
      if (rawBody && typeof rawBody === 'object' && !bodyTenantId) {
        rawBody.tenantId = headerTenantId;
      }
    } else if (bodyTenantId) {
      resolvedTenantId = bodyTenantId;
    }

    if (!resolvedTenantId) {
      throw new BadRequestError(
        'Tenant identity could not be resolved from request',
        ErrorCode.TENANT_RESOLUTION_FAILED
      );
    }

    const tenantContext: TenantContext = context.tenantContext ?? {
      tenantId: resolvedTenantId,
      projectId: context.project._id.toString(),
    };
    context.tenantContext = tenantContext;

    const result = await this.dataPlaneService.processRequest(
      context.project,
      request.body,
      tenantContext,
      request.log
    );

    return reply.status(200).send({
      success: true,
      data: result.data,
      message: result.message,
    });
  }
}
