import { ObjectId } from 'mongodb';
import { describe, it, expect } from 'vitest';
import {
  UserStatus,
  createUserSchema,
  updateUserSchema,
} from './user.model.js';
import {
  ProjectStatus,
  createProjectSchema,
  createProjectBodySchema,
  updateProjectSchema,
} from './project.model.js';

describe('Control Plane Models - Generalized Unit Test Suite', () => {
  describe('User Model', () => {
    it('validates a valid user creation payload with default status', () => {
      const payload = {
        supabaseUserId: 'sub_12345',
        email: 'dev@shardflow.io',
      };

      const parsed = createUserSchema.parse(payload);
      expect(parsed.supabaseUserId).toBe('sub_12345');
      expect(parsed.email).toBe('dev@shardflow.io');
      expect(parsed.status).toBe(UserStatus.ACTIVE);
      expect(parsed.name).toBeUndefined();
    });

    it('validates a valid user creation payload with explicit status and optional name', () => {
      const payload = {
        supabaseUserId: 'sub_67890',
        email: 'alice@shardflow.io',
        name: 'Alice Cooper',
        status: UserStatus.DISABLED,
      };

      const parsed = createUserSchema.parse(payload);
      expect(parsed.name).toBe('Alice Cooper');
      expect(parsed.status).toBe(UserStatus.DISABLED);
    });

    it('rejects user creation with an empty supabaseUserId', () => {
      const payload = {
        supabaseUserId: '',
        email: 'dev@shardflow.io',
      };

      expect(() => createUserSchema.parse(payload)).toThrow();
    });

    it('rejects user creation with an invalid email address', () => {
      const payload = {
        supabaseUserId: 'sub_123',
        email: 'invalid-email-format',
      };

      expect(() => createUserSchema.parse(payload)).toThrow();
    });

    it('rejects user creation with an invalid status', () => {
      const payload = {
        supabaseUserId: 'sub_123',
        email: 'dev@shardflow.io',
        status: 'PENDING_VERIFICATION',
      };

      expect(() => createUserSchema.parse(payload)).toThrow();
    });

    it('validates a partial update payload', () => {
      const payload = {
        name: 'Updated Name',
        status: UserStatus.DISABLED,
      };

      const parsed = updateUserSchema.parse(payload);
      expect(parsed.name).toBe('Updated Name');
      expect(parsed.status).toBe(UserStatus.DISABLED);
      expect(parsed.email).toBeUndefined();
    });

    it('rejects user update with an invalid email', () => {
      const payload = {
        email: 'not-an-email',
      };

      expect(() => updateUserSchema.parse(payload)).toThrow();
    });
  });

  describe('Project Model', () => {
    const validOwnerId = new ObjectId();

    it('validates a valid project creation payload with string ownerId and default status', () => {
      const payload = {
        ownerId: validOwnerId.toHexString(),
        name: 'Primary E-commerce Cluster',
      };

      const parsed = createProjectSchema.parse(payload);
      expect(parsed.ownerId).toBe(validOwnerId.toHexString());
      expect(parsed.name).toBe('Primary E-commerce Cluster');
      expect(parsed.status).toBe(ProjectStatus.ACTIVE);
      expect(parsed.description).toBeUndefined();
    });

    it('validates a valid project creation payload with ObjectId ownerId, explicit status, and description', () => {
      const payload = {
        ownerId: validOwnerId,
        name: 'Analytics Warehouse',
        description: 'Metadata and event tracking pipeline',
        status: ProjectStatus.DISABLED,
      };

      const parsed = createProjectSchema.parse(payload);
      expect(parsed.ownerId).toBe(validOwnerId);
      expect(parsed.name).toBe('Analytics Warehouse');
      expect(parsed.description).toBe('Metadata and event tracking pipeline');
      expect(parsed.status).toBe(ProjectStatus.DISABLED);
    });

    it('rejects project creation with an empty name', () => {
      const payload = {
        ownerId: validOwnerId.toHexString(),
        name: '',
      };

      expect(() => createProjectSchema.parse(payload)).toThrow();
    });

    it('rejects project creation with an empty ownerId', () => {
      const payload = {
        ownerId: '',
        name: 'Valid Project Name',
      };

      expect(() => createProjectSchema.parse(payload)).toThrow();
    });

    it('rejects project creation with an invalid status', () => {
      const payload = {
        ownerId: validOwnerId.toHexString(),
        name: 'Valid Project Name',
        status: 'ARCHIVED',
      };

      expect(() => createProjectSchema.parse(payload)).toThrow();
    });

    it('validates createProjectBodySchema with valid name and optional description', () => {
      const payload = {
        name: 'Fastify Service DB',
        description: 'Dedicated routing cluster',
      };

      const parsed = createProjectBodySchema.parse(payload);
      expect(parsed.name).toBe('Fastify Service DB');
      expect(parsed.description).toBe('Dedicated routing cluster');
    });

    it('rejects createProjectBodySchema with an empty name', () => {
      const payload = {
        name: '',
      };

      expect(() => createProjectBodySchema.parse(payload)).toThrow();
    });

    it('validates a partial update payload for project', () => {
      const payload = {
        name: 'Renamed Project',
        description: 'New description',
        status: ProjectStatus.DISABLED,
      };

      const parsed = updateProjectSchema.parse(payload);
      expect(parsed.name).toBe('Renamed Project');
      expect(parsed.description).toBe('New description');
      expect(parsed.status).toBe(ProjectStatus.DISABLED);
    });

    it('rejects project update with an empty name', () => {
      const payload = {
        name: '',
      };

      expect(() => updateProjectSchema.parse(payload)).toThrow();
    });

    it('rejects project update with an invalid status', () => {
      const payload = {
        status: 'DELETED',
      };

      expect(() => updateProjectSchema.parse(payload)).toThrow();
    });
  });
});

