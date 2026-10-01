import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';

import { buildApp } from '../../app.js';
import type { AppConfig } from '../../config/index.js';
import { ProjectStatus, type Project } from '../models/project.model.js';
import { UserStatus, type User } from '../models/user.model.js';
import { AuthService } from '../../auth/auth.service.js';
import { ProjectService } from '../services/project.service.js';
import { ProjectRepository } from '../repositories/project.repository.js';

describe('Project Management Routes (Tasks 2.5 - 2.7)', () => {
  const testConfig: AppConfig = {
    port: 3000,
    host: '127.0.0.1',
    nodeEnv: 'test',
    mongodbUri: 'mongodb://localhost:27017',
    mongodbDatabase: 'shardflow_test',
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-anon-key',
  };

  const testUser: User = {
    _id: new ObjectId('65123456789abcdef0123456'),
    supabaseUserId: 'sb_test_owner_123',
    email: 'owner@example.com',
    name: 'Project Owner',
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let inMemoryProjects: Map<string, Project>;
  let mockProjectRepo: Partial<ProjectRepository>;
  let mockAuthService: Partial<AuthService>;

  beforeEach(() => {
    inMemoryProjects = new Map<string, Project>();

    mockProjectRepo = {
      findByOwnerIdAndName: vi.fn(async (ownerId, name) => {
        const ownerObjId = typeof ownerId === 'string' ? ownerId : ownerId.toString();
        for (const p of inMemoryProjects.values()) {
          if (p.ownerId.toString() === ownerObjId && p.name === name) return p;
        }
        return null;
      }),

      create: vi.fn(async (data) => {
        const id = new ObjectId();
        const project: Project = {
          _id: id,
          ownerId: typeof data.ownerId === 'string' ? new ObjectId(data.ownerId) : data.ownerId,
          name: data.name,
          description: data.description,
          status: data.status ?? ProjectStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryProjects.set(id.toString(), project);
        return project;
      }),

      findByOwnerId: vi.fn(async (ownerId) => {
        const ownerObjId = typeof ownerId === 'string' ? ownerId : ownerId.toString();
        const results: Project[] = [];
        for (const p of inMemoryProjects.values()) {
          if (p.ownerId.toString() === ownerObjId) results.push(p);
        }
        return results;
      }),

      findById: vi.fn(async (id) => {
        return inMemoryProjects.get(id.toString()) ?? null;
      }),

      findByIdAndOwnerId: vi.fn(async (id, ownerId) => {
        const p = inMemoryProjects.get(id.toString());
        if (p && p.ownerId.toString() === ownerId.toString()) return p;
        return null;
      }),

      updateByIdAndOwnerId: vi.fn(async (id, ownerId, data) => {
        const p = inMemoryProjects.get(id.toString());
        if (p && p.ownerId.toString() === ownerId.toString()) {
          const updated: Project = { ...p, ...data, updatedAt: new Date() };
          inMemoryProjects.set(id.toString(), updated);
          return updated;
        }
        return null;
      }),

      disable: vi.fn(async (id, ownerId) => {
        const p = inMemoryProjects.get(id.toString());
        if (p && (!ownerId || p.ownerId.toString() === ownerId.toString())) {
          const disabled: Project = { ...p, status: ProjectStatus.DISABLED, updatedAt: new Date() };
          inMemoryProjects.set(id.toString(), disabled);
          return disabled;
        }
        return null;
      }),
    };

    mockAuthService = {
      authenticateAndSyncUser: vi.fn().mockResolvedValue({
        user: testUser,
        supabaseUser: { id: testUser.supabaseUserId, email: testUser.email },
      }),
    };
  });

  describe('POST /api/v1/projects (Task 2.5)', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = await buildApp(testConfig);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        payload: { name: 'New App' },
      });

      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe('AUTHENTICATION_REQUIRED');
      await app.close();
    });

    it('returns 400 when name is missing from body', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: { authorization: 'Bearer test_token' },
        payload: { description: 'No name provided' },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('MISSING_REQUIRED_FIELD');
      await app.close();
    });

    it('creates project and returns 201 Created', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: { authorization: 'Bearer test_token' },
        payload: {
          name: 'Ecommerce App',
          description: 'Production cluster for shop',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('Project created successfully');
      expect(body.data.name).toBe('Ecommerce App');
      expect(body.data.description).toBe('Production cluster for shop');
      expect(body.data.status).toBe('ACTIVE');
      expect(body.data.id).toBeDefined();

      await app.close();
    });

    it('returns 409 Conflict when project with same name already exists for user', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
      });

      // 1. Create first project
      await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: { authorization: 'Bearer test_token' },
        payload: { name: 'Duplicate Name' },
      });

      // 2. Try to create second project with identical name
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: { authorization: 'Bearer test_token' },
        payload: { name: 'Duplicate Name' },
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error.code).toBe('PROJECT_ALREADY_EXISTS');

      await app.close();
    });
  });

  describe('GET /api/v1/projects (Task 2.6)', () => {
    it('lists all projects owned by the authenticated user', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
      });

      // Create two projects
      await projectService.createProject(testUser._id, { name: 'App 1' });
      await projectService.createProject(testUser._id, { name: 'App 2' });

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/projects',
        headers: { authorization: 'Bearer test_token' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.projects).toHaveLength(2);
      expect(body.data.projects[0].name).toBe('App 1');
      expect(body.data.projects[1].name).toBe('App 2');

      await app.close();
    });
  });

  describe('GET /api/v1/projects/:projectId (Task 2.6)', () => {
    it('returns 400 for invalid ObjectId format', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/projects/invalid-id',
        headers: { authorization: 'Bearer test_token' },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('INVALID_PROJECT_ID');
      await app.close();
    });

    it('returns 404 when project does not exist', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
      });

      const nonExistentId = new ObjectId().toString();
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${nonExistentId}`,
        headers: { authorization: 'Bearer test_token' },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('PROJECT_NOT_FOUND');
      await app.close();
    });

    it('returns 403 when project is owned by a different user', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
      });

      const otherOwnerId = new ObjectId();
      const otherProject = await projectService.createProject(otherOwnerId, { name: 'Other User App' });

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${otherProject._id.toString()}`,
        headers: { authorization: 'Bearer test_token' },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('PROJECT_ACCESS_DENIED');
      await app.close();
    });

    it('returns project details when owner matches', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
      });

      const created = await projectService.createProject(testUser._id, { name: 'My Main App' });

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${created._id.toString()}`,
        headers: { authorization: 'Bearer test_token' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(created._id.toString());
      expect(body.data.name).toBe('My Main App');

      await app.close();
    });
  });

  describe('PATCH /api/v1/projects/:projectId (Task 2.7)', () => {
    it('updates project name and description', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
      });

      const created = await projectService.createProject(testUser._id, { name: 'Initial Name' });

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/projects/${created._id.toString()}`,
        headers: { authorization: 'Bearer test_token' },
        payload: {
          name: 'Updated Name',
          description: 'Updated Description',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Updated Name');
      expect(body.data.description).toBe('Updated Description');

      await app.close();
    });
  });

  describe('DELETE /api/v1/projects/:projectId (Task 2.7)', () => {
    it('disables the project', async () => {
      const projectService = new ProjectService(mockProjectRepo as ProjectRepository);
      const app = await buildApp(testConfig, {
        authService: mockAuthService as AuthService,
        projectService,
      });

      const created = await projectService.createProject(testUser._id, { name: 'To Disable' });

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/projects/${created._id.toString()}`,
        headers: { authorization: 'Bearer test_token' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('DISABLED');

      await app.close();
    });
  });
});
