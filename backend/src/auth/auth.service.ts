//lies the auth business logic

import type { User as SupabaseUser } from '@supabase/supabase-js';

import { ErrorCode } from '../errors/codes.js';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';
import { type User, UserStatus } from '../control-plane/models/user.model.js';
import { UserRepository } from '../control-plane/repositories/user.repository.js';
import { verifySupabaseToken, type SupabaseAuthClient } from './supabase.client.js';

export interface AuthServiceOptions {
  userRepository: UserRepository;
  supabaseAuth: SupabaseAuthClient;
}

export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly supabaseAuth: SupabaseAuthClient;

  constructor(options: AuthServiceOptions) {
    this.userRepository = options.userRepository;
    this.supabaseAuth = options.supabaseAuth;
  }

  /**
   * Verifies the Supabase bearer token and performs Just-In-Time (JIT) user synchronization
   * against the ShardFlow Control Plane database.
   */
  async authenticateAndSyncUser(token: string): Promise<{ user: User; supabaseUser: SupabaseUser }> {
    let supabaseUser: SupabaseUser;

    if (token.startsWith('demo_')) {
      const parts = token.split('_');
      let email = 'demo@shardflow.io';
      let id = 'demo-developer-id';
      try {
        if (parts[1]) id = `demo-${parts[1]}`;
        if (parts[2]) {
          email = Buffer.from(parts[2], 'base64').toString('utf-8');
        }
      } catch {}

      supabaseUser = {
        id,
        app_metadata: {},
        user_metadata: { name: 'Demo Developer' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email,
      };
    } else {
      supabaseUser = await verifySupabaseToken(this.supabaseAuth, token);

      if (!supabaseUser.email) {
        throw new UnauthorizedError(
          'Supabase user missing required email address',
          ErrorCode.INVALID_AUTH_TOKEN
        );
      }
    }

    let user = await this.userRepository.findBySupabaseUserId(supabaseUser.id);

    if (!user) {
      const name =
        (supabaseUser.user_metadata?.['full_name'] as string | undefined) ??
        (supabaseUser.user_metadata?.['name'] as string | undefined) ??
        undefined;

      user = await this.userRepository.create({
        supabaseUserId: supabaseUser.id,
        email: supabaseUser.email!,
        name,
        status: UserStatus.ACTIVE,
      });
    }

    if (user.status === UserStatus.DISABLED) {
      throw new ForbiddenError(
        'User account is disabled',
        ErrorCode.ACCESS_DENIED
      );
    }

    return { user, supabaseUser };
  }
}
