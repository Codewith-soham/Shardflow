import { describe, it, expect } from 'vitest';
import {
  UserStatus,
  createUserSchema,
  updateUserSchema,
} from './user.model.js';

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
});
