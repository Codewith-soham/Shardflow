import { ErrorCode } from '../errors/codes.js';
import {
  BadRequestError,
  ServiceUnavailableError,
  TooManyRequestsError,
} from '../errors/app-error.js';
import { verifySupabaseToken, type SupabaseAuthClient } from './supabase.client.js';

/** Subset of Supabase auth used for the password-recovery lifecycle. */
export interface PasswordResetAuthClient extends SupabaseAuthClient {
  resetPasswordForEmail(
    email: string,
    options?: { redirectTo?: string }
  ): Promise<{ data: unknown; error: { message: string; status?: number } | null }>;
}

export interface PasswordResetAdminClient {
  updateUserById(
    uid: string,
    attributes: { password: string }
  ): Promise<{ data: unknown; error: { message: string; status?: number } | null }>;
  signOut(jwt: string, scope?: 'global' | 'local' | 'others'): Promise<{ error: { message: string } | null }>;
}

export interface PasswordResetServiceOptions {
  auth: PasswordResetAuthClient;
  /** Admin API (service-role key). When absent, completing a reset is unavailable. */
  admin?: PasswordResetAdminClient;
  redirectTo?: string;
}

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 72;

/**
 * Password recovery lifecycle:
 *  1. requestReset  — Supabase emails a single-use recovery link to the frontend.
 *  2. (frontend)    — the link carries a short-lived recovery access token.
 *  3. completeReset — the token is verified, the password is changed, and every session is revoked.
 */
export class PasswordResetService {
  private readonly auth: PasswordResetAuthClient;
  private readonly admin?: PasswordResetAdminClient;
  private readonly redirectTo?: string;

  constructor(options: PasswordResetServiceOptions) {
    this.auth = options.auth;
    this.admin = options.admin;
    this.redirectTo = options.redirectTo;
  }

  /**
   * Triggers a reset email. Succeeds silently whether or not the account exists
   * so the endpoint cannot be used to enumerate registered emails.
   */
  async requestReset(email: string): Promise<void> {
    let result: Awaited<ReturnType<PasswordResetAuthClient['resetPasswordForEmail']>>;
    try {
      result = await this.auth.resetPasswordForEmail(
        email,
        this.redirectTo ? { redirectTo: this.redirectTo } : undefined
      );
    } catch (err: unknown) {
      throw new ServiceUnavailableError(
        'Password reset is temporarily unavailable',
        ErrorCode.EMAIL_PROVIDER_UNAVAILABLE,
        err instanceof Error ? err.message : err
      );
    }

    const { error } = result;
    if (!error) return;

    if (error.status === 429) {
      throw new TooManyRequestsError('Too many reset emails requested. Try again later.');
    }
    if (error.status === undefined || error.status >= 500) {
      throw new ServiceUnavailableError(
        'Password reset is temporarily unavailable',
        ErrorCode.EMAIL_PROVIDER_UNAVAILABLE,
        error.message
      );
    }
    // Other 4xx (unknown email, etc.) are deliberately indistinguishable from success.
  }

  /** Sets a new password using the recovery access token from the emailed link. */
  async completeReset(accessToken: string, newPassword: string): Promise<void> {
    if (!this.admin) {
      throw new ServiceUnavailableError(
        'Password reset is not configured on this server',
        ErrorCode.AUTH_PROVIDER_UNAVAILABLE
      );
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
      throw new BadRequestError(
        `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`,
        ErrorCode.INVALID_FIELD
      );
    }

    const supabaseUser = await verifySupabaseToken(this.auth, accessToken);

    const { error } = await this.admin.updateUserById(supabaseUser.id, { password: newPassword });
    if (error) {
      if (error.status !== undefined && error.status >= 400 && error.status < 500) {
        throw new BadRequestError(error.message, ErrorCode.INVALID_FIELD);
      }
      throw new ServiceUnavailableError(
        'Authentication provider is temporarily unavailable',
        ErrorCode.AUTH_PROVIDER_UNAVAILABLE,
        error.message
      );
    }

    // Revoke the recovery session and any other session holding the old password (best effort).
    try {
      await this.admin.signOut(accessToken, 'global');
    } catch {
      // The password is already changed; failing to revoke must not fail the request.
    }
  }
}
