import type { FastifyInstance, FastifyRequest } from 'fastify';

import { TooManyRequestsError } from '../errors/app-error.js';
import { validateData, z } from '../validation/index.js';
import { RateLimiter } from './rate-limiter.js';
import { PasswordResetService, MAX_PASSWORD_LENGTH } from './password-reset.service.js';

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

const resetPasswordSchema = z.object({
  accessToken: z.string().trim().min(1),
  password: z.string().max(MAX_PASSWORD_LENGTH),
});

/**
 * Registers the public password-recovery routes:
 *  POST /api/v1/auth/forgot-password
 *  POST /api/v1/auth/reset-password
 */
export function registerPasswordResetRoutes(
  app: FastifyInstance,
  service: PasswordResetService,
  limiter: { forgot: RateLimiter; reset: RateLimiter } = {
    forgot: new RateLimiter(5, 15 * 60_000),
    reset: new RateLimiter(10, 15 * 60_000),
  }
): void {
  const enforce = (rl: RateLimiter, request: FastifyRequest, scope: string) => {
    if (!rl.consume(`${scope}:${request.ip}`)) {
      throw new TooManyRequestsError('Too many attempts. Please try again later.');
    }
  };

  app.post('/api/v1/auth/forgot-password', async (request, reply) => {
    enforce(limiter.forgot, request, 'forgot');
    const { email } = validateData(forgotPasswordSchema, request.body);

    await service.requestReset(email);

    reply.status(202);
    return {
      success: true,
      data: null,
      message: 'If an account exists for that email, a password reset link has been sent',
    };
  });

  app.post('/api/v1/auth/reset-password', async (request) => {
    enforce(limiter.reset, request, 'reset');
    const { accessToken, password } = validateData(resetPasswordSchema, request.body);

    await service.completeReset(accessToken, password);

    return { success: true, data: null, message: 'Password updated successfully' };
  });
}
