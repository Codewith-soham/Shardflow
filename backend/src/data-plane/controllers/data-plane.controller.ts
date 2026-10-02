import type { FastifyRequest, FastifyReply } from 'fastify';

import { DataPlaneService } from '../services/data-plane.service.js';
import { BadRequestError } from '../../errors/app-error.js';
import { ErrorCode } from '../../errors/codes.js';

export class DataPlaneController {
  private readonly dataPlaneService: DataPlaneService;

  constructor(dataPlaneService?: DataPlaneService) {
    this.dataPlaneService = dataPlaneService ?? new DataPlaneService();
  }

  async execute(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const context = request.dataPlaneContext;

    if (!context) {
      throw new BadRequestError(
        'Request missing authentication context',
        ErrorCode.AUTHENTICATION_REQUIRED
      );
    }

    const result = await this.dataPlaneService.processRequest(
      context.project,
      request.body
    );

    return reply.status(200).send({
      success: true,
      data: result.data,
      message: result.message,
    });
  }
}
