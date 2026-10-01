import type { FastifyInstance } from 'fastify';

import { createAuthMiddleware, type AuthService } from '../../auth/index.js';
import { validateRequest } from '../../validation/index.js';
import { createProjectBodySchema, updateProjectSchema } from '../models/project.model.js';
import { ProjectController } from '../controllers/project.controller.js';

export interface ProjectRoutesOptions {
  authService: AuthService;
  projectController?: ProjectController;
}

/**
 * Registers Project Management routes:
 * - POST   /api/v1/projects             (Create project)
 * - GET    /api/v1/projects             (List projects)
 * - GET    /api/v1/projects/:projectId  (Get project)
 * - PATCH  /api/v1/projects/:projectId  (Update project)
 * - DELETE /api/v1/projects/:projectId  (Disable project)
 *
 * Contract: docs/api.md Section 12 (Project APIs)
 */
export function registerProjectRoutes(
  app: FastifyInstance,
  authService: AuthService,
  projectController: ProjectController = new ProjectController()
): void {
  const requireAuth = createAuthMiddleware(authService);

  // POST /api/v1/projects
  app.post(
    '/api/v1/projects',
    {
      preHandler: [requireAuth, validateRequest({ body: createProjectBodySchema })],
    },
    (request, reply) => projectController.createProject(request, reply)
  );

  // GET /api/v1/projects
  app.get(
    '/api/v1/projects',
    {
      preHandler: [requireAuth],
    },
    (request, reply) => projectController.listProjects(request, reply)
  );

  // GET /api/v1/projects/:projectId
  app.get<{ Params: { projectId: string } }>(
    '/api/v1/projects/:projectId',
    {
      preHandler: [requireAuth],
    },
    (request, reply) => projectController.getProject(request, reply)
  );

  // PATCH /api/v1/projects/:projectId
  app.patch<{ Params: { projectId: string }; Body: any }>(
    '/api/v1/projects/:projectId',
    {
      preHandler: [requireAuth, validateRequest({ body: updateProjectSchema })],
    },
    (request, reply) => projectController.updateProject(request, reply)
  );

  // DELETE /api/v1/projects/:projectId
  app.delete<{ Params: { projectId: string } }>(
    '/api/v1/projects/:projectId',
    {
      preHandler: [requireAuth],
    },
    (request, reply) => projectController.disableProject(request, reply)
  );
}
