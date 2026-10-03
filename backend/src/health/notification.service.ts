/**
 * ShardFlow Notification Service
 * Task 6.7 — Notification mechanism
 *
 * Implements email notification abstraction for operational shard events:
 * - Shard became unhealthy
 * - Shard recovered
 *
 * Interacts with Brevo as the underlying delivery provider without exposing
 * Brevo credentials to clients or logs.
 *
 * See: docs/prd.md §20 (FR-21)
 */

export interface ShardNotificationPayload {
  recipientEmail: string;
  shardId: string;
  shardName: string;
  projectId: string;
  error?: string;
}

export interface NotificationRecord {
  type: 'SHARD_UNHEALTHY' | 'SHARD_RECOVERED';
  payload: ShardNotificationPayload;
  timestamp: Date;
}

export interface NotificationService {
  notifyShardUnhealthy(payload: ShardNotificationPayload): Promise<boolean>;
  notifyShardRecovered(payload: ShardNotificationPayload): Promise<boolean>;
}

export class BrevoNotificationService implements NotificationService {
  private readonly apiKey?: string;
  private readonly senderEmail: string;
  /** In-memory log of dispatched notifications for audit/testing */
  public readonly notificationsSent: NotificationRecord[] = [];

  constructor(apiKey?: string, senderEmail: string = 'notifications@shardflow.io') {
    this.apiKey = apiKey ?? process.env['BREVO_API_KEY'];
    this.senderEmail = senderEmail;
  }

  async notifyShardUnhealthy(payload: ShardNotificationPayload): Promise<boolean> {
    const record: NotificationRecord = {
      type: 'SHARD_UNHEALTHY',
      payload,
      timestamp: new Date(),
    };
    this.notificationsSent.push(record);

    const subject = `[ALERT] ShardFlow Shard "${payload.shardName}" is Unhealthy`;
    const textContent = `Attention: Shard "${payload.shardName}" (ID: ${payload.shardId}) for project ${payload.projectId} has failed health checks and is marked UNHEALTHY.\n\nError: ${payload.error || 'Connection ping failed'}\n\nRequests to this shard are temporarily blocked. No automatic failover is performed to prevent data corruption.`;

    return this.sendEmail(payload.recipientEmail, subject, textContent);
  }

  async notifyShardRecovered(payload: ShardNotificationPayload): Promise<boolean> {
    const record: NotificationRecord = {
      type: 'SHARD_RECOVERED',
      payload,
      timestamp: new Date(),
    };
    this.notificationsSent.push(record);

    const subject = `[RECOVERY] ShardFlow Shard "${payload.shardName}" has Recovered`;
    const textContent = `Notice: Shard "${payload.shardName}" (ID: ${payload.shardId}) for project ${payload.projectId} has passed health checks and recovered to HEALTHY state.\n\nNormal request routing to this shard has been restored.`;

    return this.sendEmail(payload.recipientEmail, subject, textContent);
  }

  private async sendEmail(to: string, subject: string, textContent: string): Promise<boolean> {
    if (!this.apiKey) {
      // Brevo API key not configured — fallback to mock delivery for dev/test
      return true;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          sender: { email: this.senderEmail, name: 'ShardFlow Monitor' },
          to: [{ email: to }],
          subject,
          textContent,
        }),
      });

      return response.ok;
    } catch {
      // Email failure must not throw or crash the health check loop, nor leak credentials
      return false;
    }
  }
}
