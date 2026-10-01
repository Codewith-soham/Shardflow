import { createClient, type SupabaseClient, type User as SupabaseUser } from '@supabase/supabase-js';

import { ErrorCode } from '../errors/codes.js';
import { ServiceUnavailableError, UnauthorizedError } from '../errors/app-error.js';

export interface SupabaseAuthClient {
  getUser(token: string): Promise<{ data: { user: SupabaseUser | null }; error: Error | null }>;
}

/**
 * Creates a configured Supabase client instance.
 */
export function createSupabaseClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Verifies a Supabase JWT and returns the authenticated Supabase user entity.
 * Translates errors into canonical ShardFlow AppErrors.
 */
export async function verifySupabaseToken(
  supabase: SupabaseAuthClient,
  token: string
): Promise<SupabaseUser> {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    throw new UnauthorizedError('Authentication token is required', ErrorCode.AUTHENTICATION_REQUIRED);
  }

  try {
    const { data, error } = await supabase.getUser(token.trim());

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('expired')) {
        throw new UnauthorizedError('Authentication token has expired', ErrorCode.AUTH_TOKEN_EXPIRED);
      }
      throw new UnauthorizedError('Invalid authentication token', ErrorCode.INVALID_AUTH_TOKEN);
    }

    if (!data || !data.user) {
      throw new UnauthorizedError('Invalid authentication token', ErrorCode.INVALID_AUTH_TOKEN);
    }

    return data.user;
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      throw err;
    }

    // Network / external service errors
    throw new ServiceUnavailableError(
      'Authentication provider is temporarily unavailable',
      ErrorCode.AUTH_PROVIDER_UNAVAILABLE,
      err instanceof Error ? err.message : err
    );
  }
}
