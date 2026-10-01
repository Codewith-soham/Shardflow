import { ObjectId } from 'mongodb';

import { ErrorCode } from '../../errors/codes.js';
import { NotFoundError, ForbiddenError } from '../../errors/app-error.js';
import {
  type ApiKey,
  generateApiKey,
  isApiKeyActive,
} from '../models/api-key.model.js';
import { ApiKeyRepository } from '../repositories/api-key.repository.js';
import { ProjectService } from './project.service.js';
import { ProjectStatus } from '../models/project.model.js';

export interface CreateApiKeyInput {
  name: string;
  expiresAt?: Date | null;
}

export interface CreateApiKeyResult {
  apiKey: ApiKey;
  rawKey: string;
}

export class ApiKeyService {
  private readonly apiKeyRepository: ApiKeyRepository;
  private readonly projectService: ProjectService;

  constructor(apiKeyRepository?: ApiKeyRepository, projectService?: ProjectService) {
    this.apiKeyRepository = apiKeyRepository ?? new ApiKeyRepository();
    this.projectService = projectService ?? new ProjectService();
  }

  /**
   * Generates a new cryptographically secure API key for a project.
   * Enforces project ownership and active project state.
   */
  async createApiKey(
    projectId: string | ObjectId,
    ownerId: string | ObjectId,
    input: CreateApiKeyInput
  ): Promise<CreateApiKeyResult> {
    // 1. Verify project exists and is owned by the user
    const project = await this.projectService.getProjectById(projectId, ownerId);

    // 2. Cannot generate API keys for disabled projects
    if (project.status === ProjectStatus.DISABLED) {
      throw new ForbiddenError(
        'Cannot generate API keys for a disabled project',
        ErrorCode.PROJECT_DISABLED
      );
    }

    // 3. Generate high-entropy raw key and deterministic SHA-256 hash
    const { rawKey, keyHash } = generateApiKey('sf_live_');

    // 4. Persist in database
    const apiKey = await this.apiKeyRepository.create({
      projectId,
      name: input.name.trim(),
      keyHash,
      expiresAt: input.expiresAt ?? null,
    });

    return { apiKey, rawKey };
  }

  /**
   * Lists all API keys for a given project (verifying project ownership).
   */
  async listApiKeys(
    projectId: string | ObjectId,
    ownerId: string | ObjectId
  ): Promise<ApiKey[]> {
    await this.projectService.getProjectById(projectId, ownerId);
    return this.apiKeyRepository.findByProjectId(projectId, true);
  }

  /**
   * Revokes an API key, immediately rendering it invalid for Data Plane requests.
   */
  async revokeApiKey(
    projectId: string | ObjectId,
    apiKeyId: string | ObjectId,
    ownerId: string | ObjectId
  ): Promise<ApiKey> {
    await this.projectService.getProjectById(projectId, ownerId);

    const apiKey = await this.apiKeyRepository.findByIdAndProjectId(apiKeyId, projectId);
    if (!apiKey) {
      throw new NotFoundError('API key not found', ErrorCode.API_KEY_NOT_FOUND);
    }

    const revoked = await this.apiKeyRepository.revoke(apiKeyId, projectId);
    if (!revoked) {
      throw new NotFoundError('API key not found', ErrorCode.API_KEY_NOT_FOUND);
    }

    return revoked;
  }
}
