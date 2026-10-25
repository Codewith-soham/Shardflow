import type { FastifyRequest, FastifyReply } from 'fastify';

import { ErrorCode } from '../../errors/codes.js';
import { UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError } from '../../errors/app-error.js';
import { markAuthGuard } from '../../auth/route-guard.js';
import {
  hashApiKey,
  verifyApiKeyHash,
  isApiKeyActive,
  type ApiKey,
  type Project,
  ProjectStatus,
  ApiKeyRepository,
  ProjectRepository,
} from '../../control-plane/index.js';
import type { TenantContext } from '../models/data-request.model.js';

export interface DataPlaneContext {
  apiKey: ApiKey;
  project: Project;
  tenantContext?: TenantContext;
}

declare module 'fastify' {
  interface FastifyRequest {
    dataPlaneContext?: DataPlaneContext;
  }
}

export interface DataPlaneAuthOptions {
  apiKeyRepository?: ApiKeyRepository;
  projectRepository?: ProjectRepository;
}

/**
 * Fastify preHandler hook for Data Plane API key authentication.
 * Enforces docs/api.md §21 & §48 rules:
 * 1. Extract X-API-Key header
 * 2. Hash key & lookup in database
 * 3. Validate active status (not revoked, not expired)
 * 4. Resolve owning project & verify status (ACTIVE)
 * 5. Update lastUsedAt asynchronously
 * 6. Attach dataPlaneContext to request
 */
export function createDataPlaneAuthMiddleware(options: DataPlaneAuthOptions = {}) {
  const apiKeyRepo = options.apiKeyRepository ?? new ApiKeyRepository();
  const projectRepo = options.projectRepository ?? new ProjectRepository();

  return markAuthGuard(async function dataPlaneAuthMiddleware(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    const rawApiKey = request.headers['x-api-key'];

    if (!rawApiKey || typeof rawApiKey !== 'string' || rawApiKey.trim() === '') {
      throw new UnauthorizedError(
        'API key is required in X-API-Key header',
        ErrorCode.AUTHENTICATION_REQUIRED
      );
    }

    const presentedKey = rawApiKey.trim();
    const apiKey = await apiKeyRepo.findByKeyHash(hashApiKey(presentedKey));

    if (!apiKey || !verifyApiKeyHash(presentedKey, apiKey.keyHash)) {
      throw new UnauthorizedError(
        'Invalid API key',
        ErrorCode.INVALID_API_KEY
      );
    }

    if (apiKey.revokedAt != null) {
      throw new UnauthorizedError(
        'API key has been revoked',
        ErrorCode.API_KEY_REVOKED
      );
    }

    if (!isApiKeyActive(apiKey)) {
      throw new UnauthorizedError(
        'API key has expired',
        ErrorCode.API_KEY_EXPIRED
      );
    }

    const project = await projectRepo.findById(apiKey.projectId);
    if (!project) {
      throw new NotFoundError(
        'Associated project not found',
        ErrorCode.PROJECT_NOT_FOUND
      );
    }

    if (project.status === ProjectStatus.DISABLED) {
      throw new ForbiddenError(
        'Associated project is disabled',
        ErrorCode.PROJECT_DISABLED
      );
    }

    // Record key usage asynchronously (fire-and-forget)
    apiKeyRepo.updateLastUsed(apiKey._id).catch(() => {});

    const rawHeaderTenantId = request.headers['x-tenant-id'];
    let tenantContext: TenantContext | undefined;

    if (rawHeaderTenantId !== undefined) {
      if (typeof rawHeaderTenantId !== 'string' || rawHeaderTenantId.trim() === '' || rawHeaderTenantId.trim().length > 256) {
        throw new BadRequestError('Invalid X-Tenant-Id header format', ErrorCode.INVALID_TENANT_ID);
      }
      const tenantId = rawHeaderTenantId.trim();
      const bodyTenantId = (request.body as Record<string, unknown> | undefined)?.tenantId;
      if (typeof bodyTenantId === 'string' && bodyTenantId.trim() !== '' && bodyTenantId.trim() !== tenantId) {
        throw new ForbiddenError(
          'Tenant context mismatch between X-Tenant-Id header and request payload',
          ErrorCode.TENANT_ACCESS_DENIED
        );
      }
      tenantContext = {
        tenantId,
        projectId: project._id.toString(),
      };
    } else {
      const bodyTenantId = (request.body as Record<string, unknown> | undefined)?.tenantId;
      if (typeof bodyTenantId === 'string' && bodyTenantId.trim() !== '') {
        tenantContext = {
          tenantId: bodyTenantId.trim(),
          projectId: project._id.toString(),
        };
      }
    }

    request.dataPlaneContext = {
      apiKey,
      project,
      tenantContext,
    };
  });
}
