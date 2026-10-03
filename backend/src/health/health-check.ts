import { ConnectionManager, connectionManager as defaultConnectionManager } from '../connection-manager/index.js';
import { ShardHealthStatus, type Shard } from '../control-plane/models/shard.model.js';
import { ErrorCode } from '../errors/codes.js';

export const DEGRADED_LATENCY_THRESHOLD_MS = 1000;

export interface HealthCheckError {
  code: string;
  message: string;
}

export interface HealthCheckResult {
  status: ShardHealthStatus;
  latencyMs: number;
  checkedAt: Date;
  error?: HealthCheckError | null;
}

/**
 * Interface representing a health checker strategy.
 * Task 6.1 — Health-check abstraction
 */
export interface HealthChecker {
  checkShard(shard: Shard): Promise<HealthCheckResult>;
}

/**
 * Concrete MongoDB Shard Health Checker.
 * Task 6.2 — Shard health checker
 *
 * Uses ConnectionManager.ping(shard) to measure round-trip connectivity.
 * - Latency <= DEGRADED_LATENCY_THRESHOLD_MS => HEALTHY
 * - Latency > DEGRADED_LATENCY_THRESHOLD_MS => DEGRADED
 * - Connection exception => UNHEALTHY (sanitizes sensitive error details)
 */
export class ShardHealthChecker implements HealthChecker {
  private readonly connectionManager: ConnectionManager;

  constructor(connManager?: ConnectionManager) {
    this.connectionManager = connManager ?? defaultConnectionManager;
  }

  async checkShard(shard: Shard): Promise<HealthCheckResult> {
    const checkedAt = new Date();
    try {
      const latencyMs = await this.connectionManager.ping(shard);
      const status: ShardHealthStatus =
        latencyMs > DEGRADED_LATENCY_THRESHOLD_MS
          ? ShardHealthStatus.DEGRADED
          : ShardHealthStatus.HEALTHY;

      return {
        status,
        latencyMs,
        checkedAt,
        error: null,
      };
    } catch (err) {
      const rawMessage = (err as Error).message || 'Connection failed';
      // Sanitize raw message — strip mongo URIs / passwords if present
      const sanitizedMessage = rawMessage.replace(/mongodb(\+srv)?:\/\/[^\s]+/g, '[REDACTED_URI]');

      return {
        status: ShardHealthStatus.UNHEALTHY,
        latencyMs: 0,
        checkedAt,
        error: {
          code: ErrorCode.SHARD_HEALTH_CHECK_FAILED,
          message: sanitizedMessage,
        },
      };
    }
  }
}
