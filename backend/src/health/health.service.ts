import { ObjectId } from 'mongodb';

import {
  ShardRepository,
  HealthEventRepository,
  ProjectRepository,
  UserRepository,
  ShardHealthStatus,
  HealthEventStatus,
  type Shard,
  type HealthEvent,
} from '../control-plane/index.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/codes.js';
import { ShardHealthChecker, type HealthChecker } from './health-check.js';
import { BrevoNotificationService, type NotificationService } from './notification.service.js';

export interface ShardHealthSummary {
  shardId: string;
  status: Shard['status'];
  healthStatus: Shard['healthStatus'];
  lastHealthCheckAt: string | null;
}

export interface ProjectHealthResponse {
  shards: ShardHealthSummary[];
}

export class HealthService {
  private readonly shardRepository: ShardRepository;
  private readonly healthEventRepository: HealthEventRepository;
  private readonly projectRepository: ProjectRepository;
  private readonly userRepository: UserRepository;
  private readonly healthChecker: HealthChecker;
  private readonly notificationService: NotificationService;

  constructor(
    shardRepository?: ShardRepository,
    healthEventRepository?: HealthEventRepository,
    projectRepository?: ProjectRepository,
    userRepository?: UserRepository,
    healthChecker?: HealthChecker,
    notificationService?: NotificationService
  ) {
    this.shardRepository = shardRepository ?? new ShardRepository();
    this.healthEventRepository = healthEventRepository ?? new HealthEventRepository();
    this.projectRepository = projectRepository ?? new ProjectRepository();
    this.userRepository = userRepository ?? new UserRepository();
    this.healthChecker = healthChecker ?? new ShardHealthChecker();
    this.notificationService = notificationService ?? new BrevoNotificationService();
  }

  /**
   * Performs a health check against a single shard, updates its state,
   * detects failure/recovery state transitions, creates a HealthEvent, and sends notifications.
   *
   * Tasks 6.3 (State Management), 6.4 (Failure Detection), 6.5 (Recovery Detection), 6.7 (Notifications)
   */
  async checkShardHealth(
    shard: Shard,
    recipientEmail?: string
  ): Promise<{ shard: Shard; event: HealthEvent | null }> {
    const previousStatus = shard.healthStatus;
    const checkResult = await this.healthChecker.checkShard(shard);
    const newStatus = checkResult.status;

    // Update shard health status in database
    const updatedShard = await this.shardRepository.updateHealth(
      shard._id,
      newStatus,
      checkResult.checkedAt
    );

    const currentShard = updatedShard ?? {
      ...shard,
      healthStatus: newStatus,
      lastHealthCheckAt: checkResult.checkedAt,
    };

    let event: HealthEvent | null = null;
    let eventStatusToCreate: HealthEventStatus | null = null;

    // Task 6.4: Failure Detection — Shard transitioned to UNHEALTHY
    if (previousStatus !== ShardHealthStatus.UNHEALTHY && newStatus === ShardHealthStatus.UNHEALTHY) {
      eventStatusToCreate = HealthEventStatus.SHARD_UNHEALTHY;
    }
    // Task 6.5: Recovery Detection — Previously UNHEALTHY shard recovered to HEALTHY
    else if (previousStatus === ShardHealthStatus.UNHEALTHY && newStatus === ShardHealthStatus.HEALTHY) {
      eventStatusToCreate = HealthEventStatus.SHARD_RECOVERED;
    }
    // Transition to DEGRADED
    else if (previousStatus !== ShardHealthStatus.DEGRADED && newStatus === ShardHealthStatus.DEGRADED) {
      eventStatusToCreate = HealthEventStatus.SHARD_DEGRADED;
    }
    // Initial health check resolution (UNKNOWN -> HEALTHY)
    else if (previousStatus === ShardHealthStatus.UNKNOWN && newStatus === ShardHealthStatus.HEALTHY) {
      eventStatusToCreate = HealthEventStatus.SHARD_HEALTHY;
    }

    // Persist health event if a transition occurred
    if (eventStatusToCreate) {
      event = await this.healthEventRepository.create({
        projectId: shard.projectId,
        shardId: shard._id,
        status: eventStatusToCreate,
        latency: checkResult.latencyMs,
        error: checkResult.error,
      });

      // Resolve recipient email if not explicitly passed
      let emailToNotify = recipientEmail;
      if (!emailToNotify) {
        try {
          const project = await this.projectRepository.findById(shard.projectId);
          if (project) {
            const user = await this.userRepository.findById(project.ownerId);
            if (user) {
              emailToNotify = user.email;
            }
          }
        } catch {
          // Swallow lookup error if user/project missing
        }
      }

      if (emailToNotify) {
        const payload = {
          recipientEmail: emailToNotify,
          shardId: shard._id.toString(),
          shardName: shard.name,
          projectId: shard.projectId.toString(),
          error: checkResult.error?.message,
        };

        if (eventStatusToCreate === HealthEventStatus.SHARD_UNHEALTHY) {
          await this.notificationService.notifyShardUnhealthy(payload);
        } else if (eventStatusToCreate === HealthEventStatus.SHARD_RECOVERED) {
          await this.notificationService.notifyShardRecovered(payload);
        }
      }
    }

    return { shard: currentShard, event };
  }

  /**
   * Retrieves current health for all shards in a project.
   * Runs active health checks on demand and returns project health summary.
   *
   * Endpoint: GET /api/v1/projects/:projectId/health (Task 3.8 / Task 6.8)
   */
  async getProjectHealth(
    projectId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<ProjectHealthResponse> {
    if (!projectId || !ObjectId.isValid(projectId.toString())) {
      throw new BadRequestError('Invalid project ID format', ErrorCode.INVALID_PROJECT_ID);
    }

    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found', ErrorCode.PROJECT_NOT_FOUND);
    }

    if (project.ownerId.toString() !== userId.toString()) {
      throw new ForbiddenError(
        'Access denied: You do not own this project',
        ErrorCode.PROJECT_ACCESS_DENIED
      );
    }

    // Retrieve user for notifications
    const user = await this.userRepository.findById(userId);
    const recipientEmail = user?.email;

    const shards = await this.shardRepository.findByProjectId(projectId);

    const checkedSummaries: ShardHealthSummary[] = [];

    for (const shard of shards) {
      const { shard: updated } = await this.checkShardHealth(shard, recipientEmail);
      checkedSummaries.push({
        shardId: updated._id.toString(),
        status: updated.status,
        healthStatus: updated.healthStatus,
        lastHealthCheckAt: updated.lastHealthCheckAt
          ? updated.lastHealthCheckAt.toISOString()
          : null,
      });
    }

    return { shards: checkedSummaries };
  }
}
