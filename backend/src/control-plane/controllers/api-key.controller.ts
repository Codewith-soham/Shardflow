import type { FastifyRequest, FastifyReply } from 'fastify';
import { ObjectId } from 'mongodb';

import { UnauthorizedError, BadRequestError } from '../../errors/app-error.js';
import { ErrorCode } from '../../errors/codes.js';
import { type ApiKey, isApiKeyActive } from '../models/api-key.model.js';
import { ApiKeyService, type CreateApiKeyInput } from '../services/api-key.service.js';

function getApiKeyStatus(apiKey: ApiKey): 'ACTIVE' | 'REVOKED' | 'EXPIRED' {
  if (apiKey.revokedAt != null) return 'REVOKED';
  if (apiKey.expiresAt != null && apiKey.expiresAt.getTime() <= Date.now()) return 'EXPIRED';
  return 'ACTIVE';
}

function formatApiKeyForList(apiKey: ApiKey) {
  return {
    id: apiKey._id.toString(),
    name: apiKey.name,
    status: getApiKeyStatus(apiKey),
    expiresAt: apiKey.expiresAt ?? null,
    lastUsedAt: apiKey.lastUsedAt ?? null,
    createdAt: apiKey.createdAt,
  };
}

export class ApiKeyController {
  private readonly apiKeyService: ApiKeyService;

  constructor(apiKeyService?: ApiKeyService) {
    this.apiKeyService = apiKeyService ?? new ApiKeyService();
  }

  /**
   * POST /api/v1/projects/:projectId/api-keys
   */
  async createApiKey(
    request: FastifyRequest<{ Params: { projectId: string }; Body: CreateApiKeyInput }>,
    reply: FastifyReply
  ) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedError('Authentication required', ErrorCode.AUTHENTICATION_REQUIRED);
    }

    const { projectId } = request.params;
    if (!projectId || !ObjectId.isValid(projectId)) {
      throw new BadRequestError('Invalid project ID format', ErrorCode.INVALID_PROJECT_ID);
    }

    const { apiKey, rawKey } = await this.apiKeyService.createApiKey(
      projectId,
      user._id,
      request.body
    );

    reply.status(201);
    return {
      success: true,
      data: {
        id: apiKey._id.toString(),
        name: apiKey.name,
        key: rawKey,
        expiresAt: apiKey.expiresAt ?? null,
      },
      message: 'API key created successfully',
    };
  }

  /**
   * GET /api/v1/projects/:projectId/api-keys
   */
  async listApiKeys(
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

    const apiKeys = await this.apiKeyService.listApiKeys(projectId, user._id);

    return {
      success: true,
      data: {
        apiKeys: apiKeys.map(formatApiKeyForList),
      },
      message: 'API keys retrieved successfully',
    };
  }

  /**
   * DELETE /api/v1/projects/:projectId/api-keys/:apiKeyId
   */
  async revokeApiKey(
    request: FastifyRequest<{ Params: { projectId: string; apiKeyId: string } }>,
    _reply: FastifyReply
  ) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedError('Authentication required', ErrorCode.AUTHENTICATION_REQUIRED);
    }

    const { projectId, apiKeyId } = request.params;
    if (!projectId || !ObjectId.isValid(projectId)) {
      throw new BadRequestError('Invalid project ID format', ErrorCode.INVALID_PROJECT_ID);
    }
    if (!apiKeyId || !ObjectId.isValid(apiKeyId)) {
      throw new BadRequestError('Invalid API key ID format', ErrorCode.INVALID_ID);
    }

    const revoked = await this.apiKeyService.revokeApiKey(projectId, apiKeyId, user._id);

    return {
      success: true,
      data: {
        id: revoked._id.toString(),
        name: revoked.name,
        status: 'REVOKED',
        revokedAt: revoked.revokedAt,
      },
      message: 'API key revoked successfully',
    };
  }
}
