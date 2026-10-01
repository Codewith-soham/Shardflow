import type { FastifyRequest, FastifyReply } from 'fastify';

import { UnauthorizedError } from '../../errors/app-error.js';
import { ErrorCode } from '../../errors/codes.js';

export class UserController {
  /**
   * Handles GET /api/v1/me
   */
  async getCurrentUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user;

    if (!user) {
      throw new UnauthorizedError(
        'User identity not resolved from authentication context',
        ErrorCode.AUTHENTICATION_REQUIRED
      );
    }

    const response = {
      success: true,
      data: {
        id: user._id.toString(),
        supabaseUserId: user.supabaseUserId,
        email: user.email,
        ...(user.name ? { name: user.name } : {}),
      },
      message: 'User retrieved successfully',
    };

    reply.status(200).send(response);
  }
}
