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
import {
  createApiKeySchema,
  createApiKeyBodySchema,
  updateApiKeySchema,
  hashApiKey,
  generateApiKey,
  isApiKeyActive,
} from './api-key.model.js';

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

  describe('ApiKey Model', () => {
    const validProjectId = new ObjectId();

    describe('hashApiKey & generateApiKey helpers', () => {
      it('consistently hashes an API key using SHA-256', () => {
        const rawKey = 'sf_live_abc123xyz456';
        const hash1 = hashApiKey(rawKey);
        const hash2 = hashApiKey(rawKey);

        expect(hash1).toBe(hash2);
        expect(hash1).toHaveLength(64); // SHA-256 64-char hex string
      });

      it('generates a unique API key with default prefix and valid SHA-256 hash', () => {
        const generated = generateApiKey();

        expect(generated.rawKey.startsWith('sf_live_')).toBe(true);
        expect(generated.keyHash).toHaveLength(64);
        expect(hashApiKey(generated.rawKey)).toBe(generated.keyHash);
      });
    });

    describe('isApiKeyActive helper', () => {
      it('returns true when key is not revoked and has no expiration', () => {
        const active = isApiKeyActive({
          revokedAt: null,
          expiresAt: null,
        });

        expect(active).toBe(true);
      });

      it('returns true when expiration is in the future', () => {
        const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
        const active = isApiKeyActive({
          revokedAt: null,
          expiresAt: futureDate,
        });

        expect(active).toBe(true);
      });

      it('returns false when key has been revoked', () => {
        const active = isApiKeyActive({
          revokedAt: new Date(),
          expiresAt: null,
        });

        expect(active).toBe(false);
      });

      it('returns false when key has expired', () => {
        const pastDate = new Date(Date.now() - 1000 * 60);
        const active = isApiKeyActive({
          revokedAt: null,
          expiresAt: pastDate,
        });

        expect(active).toBe(false);
      });
    });

    describe('Validation schemas', () => {
      it('validates a valid createApiKeySchema payload with string projectId', () => {
        const payload = {
          projectId: validProjectId.toHexString(),
          name: 'Backend Microservice Key',
          keyHash: hashApiKey('sf_live_dummy_secret'),
        };

        const parsed = createApiKeySchema.parse(payload);
        expect(parsed.projectId).toBe(validProjectId.toHexString());
        expect(parsed.name).toBe('Backend Microservice Key');
        expect(parsed.expiresAt).toBeUndefined();
      });

      it('validates a valid createApiKeySchema payload with ObjectId projectId and expiresAt', () => {
        const expiry = new Date('2028-01-01T00:00:00.000Z');
        const payload = {
          projectId: validProjectId,
          name: 'CI/CD Key',
          keyHash: hashApiKey('sf_live_ci_key'),
          expiresAt: expiry.toISOString(),
        };

        const parsed = createApiKeySchema.parse(payload);
        expect(parsed.projectId).toBe(validProjectId);
        expect(parsed.expiresAt).toEqual(expiry);
      });

      it('rejects createApiKeySchema with empty projectId', () => {
        const payload = {
          projectId: '',
          name: 'Valid Name',
          keyHash: 'some_hash',
        };

        expect(() => createApiKeySchema.parse(payload)).toThrow();
      });

      it('rejects createApiKeySchema with empty name', () => {
        const payload = {
          projectId: validProjectId.toHexString(),
          name: '',
          keyHash: 'some_hash',
        };

        expect(() => createApiKeySchema.parse(payload)).toThrow();
      });

      it('rejects createApiKeySchema with empty keyHash', () => {
        const payload = {
          projectId: validProjectId.toHexString(),
          name: 'Valid Name',
          keyHash: '',
        };

        expect(() => createApiKeySchema.parse(payload)).toThrow();
      });

      it('validates createApiKeyBodySchema with valid name and optional expiresAt', () => {
        const payload = {
          name: 'Web Client Key',
          expiresAt: '2027-12-31T23:59:59.999Z',
        };

        const parsed = createApiKeyBodySchema.parse(payload);
        expect(parsed.name).toBe('Web Client Key');
        expect(parsed.expiresAt).toEqual(new Date('2027-12-31T23:59:59.999Z'));
      });

      it('rejects createApiKeyBodySchema with empty name', () => {
        const payload = {
          name: '',
        };

        expect(() => createApiKeyBodySchema.parse(payload)).toThrow();
      });

      it('validates updateApiKeySchema partial fields', () => {
        const payload = {
          name: 'Updated Key Label',
          lastUsedAt: new Date().toISOString(),
          revokedAt: new Date().toISOString(),
        };

        const parsed = updateApiKeySchema.parse(payload);
        expect(parsed.name).toBe('Updated Key Label');
        expect(parsed.lastUsedAt).toBeInstanceOf(Date);
        expect(parsed.revokedAt).toBeInstanceOf(Date);
      });

      it('rejects updateApiKeySchema with empty name', () => {
        const payload = {
          name: '',
        };

        expect(() => updateApiKeySchema.parse(payload)).toThrow();
      });
    });
  });
});


