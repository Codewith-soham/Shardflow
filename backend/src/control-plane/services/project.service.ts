import { ObjectId } from 'mongodb';

import { ErrorCode } from '../../errors/codes.js';
import { ConflictError, NotFoundError, ForbiddenError } from '../../errors/app-error.js';
import {
  type Project,
  type ProjectStatus,
  ProjectStatus as ProjectStatusEnum,
} from '../models/project.model.js';
import { ProjectRepository } from '../repositories/project.repository.js';

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export class ProjectService {
  private readonly projectRepository: ProjectRepository;

  constructor(projectRepository?: ProjectRepository) {
    this.projectRepository = projectRepository ?? new ProjectRepository();
  }

  /**
   * Creates a new project for an authenticated owner.
   * Enforces uniqueness of (ownerId, name) per database-design.md.
   */
  async createProject(ownerId: string | ObjectId, input: CreateProjectInput): Promise<Project> {
    const trimmedName = input.name.trim();

    // Check if user already has a project with this name
    const existing = await this.projectRepository.findByOwnerIdAndName(ownerId, trimmedName);
    if (existing) {
      throw new ConflictError(
        `Project with name '${trimmedName}' already exists`,
        ErrorCode.PROJECT_ALREADY_EXISTS
      );
    }

    return this.projectRepository.create({
      ownerId,
      name: trimmedName,
      description: input.description?.trim(),
      status: ProjectStatusEnum.ACTIVE,
    });
  }

  /**
   * Retrieves all projects owned by an authenticated user.
   */
  async listProjectsByOwner(ownerId: string | ObjectId): Promise<Project[]> {
    return this.projectRepository.findByOwnerId(ownerId);
  }

  /**
   * Retrieves a specific project by ID ensuring ownership access.
   */
  async getProjectById(projectId: string | ObjectId, ownerId: string | ObjectId): Promise<Project> {
    const project = await this.projectRepository.findByIdAndOwnerId(projectId, ownerId);

    if (!project) {
      // Check if project exists at all to differentiate 403 vs 404
      const anyProject = await this.projectRepository.findById(projectId);
      if (anyProject) {
        throw new ForbiddenError('Access to this project is denied', ErrorCode.PROJECT_ACCESS_DENIED);
      }
      throw new NotFoundError('Project not found', ErrorCode.PROJECT_NOT_FOUND);
    }

    return project;
  }

  /**
   * Updates a project's mutable attributes.
   */
  async updateProject(
    projectId: string | ObjectId,
    ownerId: string | ObjectId,
    input: UpdateProjectInput
  ): Promise<Project> {
    // Ensure project exists and is owned by user
    await this.getProjectById(projectId, ownerId);

    if (input.name) {
      const trimmedName = input.name.trim();
      const existing = await this.projectRepository.findByOwnerIdAndName(ownerId, trimmedName);
      if (existing && existing._id.toString() !== projectId.toString()) {
        throw new ConflictError(
          `Another project with name '${trimmedName}' already exists`,
          ErrorCode.PROJECT_ALREADY_EXISTS
        );
      }
    }

    const updated = await this.projectRepository.updateByIdAndOwnerId(projectId, ownerId, {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.status ? { status: input.status } : {}),
    });

    if (!updated) {
      throw new NotFoundError('Project not found', ErrorCode.PROJECT_NOT_FOUND);
    }

    return updated;
  }

  /**
   * Disables/deactivates a project (soft delete/disable in V1).
   */
  async disableProject(projectId: string | ObjectId, ownerId: string | ObjectId): Promise<Project> {
    await this.getProjectById(projectId, ownerId);

    const disabled = await this.projectRepository.disable(projectId, ownerId);
    if (!disabled) {
      throw new NotFoundError('Project not found', ErrorCode.PROJECT_NOT_FOUND);
    }

    return disabled;
  }
}
