import type { FastifyRequest, FastifyReply } from 'fastify';
import { ObjectId } from 'mongodb';

import { UnauthorizedError, BadRequestError } from '../../errors/app-error.js';
import { ErrorCode } from '../../errors/codes.js';
import { type Project } from '../models/project.model.js';
import { ProjectService, type CreateProjectInput, type UpdateProjectInput } from '../services/project.service.js';

function formatProject(project: Project) {
  return {
    id: project._id.toString(),
    name: project.name,
    description: project.description,
    status: project.status,
  };
}

export class ProjectController {
  private readonly projectService: ProjectService;

  constructor(projectService?: ProjectService) {
    this.projectService = projectService ?? new ProjectService();
  }

  /**
   * POST /api/v1/projects
   */
  async createProject(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedError('Authentication required', ErrorCode.AUTHENTICATION_REQUIRED);
    }

    const body = request.body as CreateProjectInput;
    const project = await this.projectService.createProject(user._id, body);

    reply.status(201);
    return {
      success: true,
      data: formatProject(project),
      message: 'Project created successfully',
    };
  }

  /**
   * GET /api/v1/projects
   */
  async listProjects(request: FastifyRequest, _reply: FastifyReply) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedError('Authentication required', ErrorCode.AUTHENTICATION_REQUIRED);
    }

    const projects = await this.projectService.listProjectsByOwner(user._id);

    return {
      success: true,
      data: {
        projects: projects.map(formatProject),
      },
      message: 'Projects retrieved successfully',
    };
  }

  /**
   * GET /api/v1/projects/:projectId
   */
  async getProject(request: FastifyRequest<{ Params: { projectId: string } }>, _reply: FastifyReply) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedError('Authentication required', ErrorCode.AUTHENTICATION_REQUIRED);
    }

    const { projectId } = request.params;
    if (!projectId || !ObjectId.isValid(projectId)) {
      throw new BadRequestError('Invalid project ID format', ErrorCode.INVALID_PROJECT_ID);
    }

    const project = await this.projectService.getProjectById(projectId, user._id);

    return {
      success: true,
      data: formatProject(project),
      message: 'Project retrieved successfully',
    };
  }

  /**
   * PATCH /api/v1/projects/:projectId
   */
  async updateProject(
    request: FastifyRequest<{ Params: { projectId: string }; Body: UpdateProjectInput }>,
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

    const updated = await this.projectService.updateProject(projectId, user._id, request.body);

    return {
      success: true,
      data: formatProject(updated),
      message: 'Project updated successfully',
    };
  }

  /**
   * DELETE /api/v1/projects/:projectId
   */
  async disableProject(request: FastifyRequest<{ Params: { projectId: string } }>, _reply: FastifyReply) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedError('Authentication required', ErrorCode.AUTHENTICATION_REQUIRED);
    }

    const { projectId } = request.params;
    if (!projectId || !ObjectId.isValid(projectId)) {
      throw new BadRequestError('Invalid project ID format', ErrorCode.INVALID_PROJECT_ID);
    }

    const disabled = await this.projectService.disableProject(projectId, user._id);

    return {
      success: true,
      data: formatProject(disabled),
      message: 'Project disabled successfully',
    };
  }
}
