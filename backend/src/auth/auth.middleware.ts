import type { FastifyRequest, FastifyReply } from 'fastify';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { ErrorCode } from '../errors/codes.js';
import { UnauthorizedError } from '../errors/app-error.js';
import type { User } from '../control-plane/models/user.model.js';
import type { AuthService } from './auth.service.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
    supabaseUser?: SupabaseUser;
  }
}

/**
 * Creates a Fastify preHandler hook for Supabase authentication.
 */
export function createAuthMiddleware(authService: AuthService) {
  return async function requireAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError(
        'Authentication required: Authorization header is missing',
        ErrorCode.AUTHENTICATION_REQUIRED
      );
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer' || !parts[1]?.trim()) {
      throw new UnauthorizedError(
        'Invalid authentication token format. Expected Bearer <token>',
        ErrorCode.INVALID_AUTH_TOKEN
      );
    }

    const token = parts[1].trim();
    const { user, supabaseUser } = await authService.authenticateAndSyncUser(token);

    request.user = user;
    request.supabaseUser = supabaseUser;
  };
}
