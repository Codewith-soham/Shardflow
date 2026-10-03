import { describe, it, expect } from 'vitest';
import { BrevoNotificationService, type ShardNotificationPayload } from './notification.service.js';

describe('BrevoNotificationService (Task 6.7)', () => {
  const payload: ShardNotificationPayload = {
    recipientEmail: 'admin@company.com',
    shardId: 'shard_123',
    shardName: 'Shard Alpha',
    projectId: 'project_456',
    error: 'Connection timeout',
  };

  it('records unhealthy notification cleanly without throwing', async () => {
    const service = new BrevoNotificationService();
    const success = await service.notifyShardUnhealthy(payload);

    expect(success).toBe(true);
    expect(service.notificationsSent).toHaveLength(1);
    expect(service.notificationsSent[0]?.type).toBe('SHARD_UNHEALTHY');
    expect(service.notificationsSent[0]?.payload.shardName).toBe('Shard Alpha');
  });

  it('records recovery notification cleanly without throwing', async () => {
    const service = new BrevoNotificationService();
    const success = await service.notifyShardRecovered(payload);

    expect(success).toBe(true);
    expect(service.notificationsSent).toHaveLength(1);
    expect(service.notificationsSent[0]?.type).toBe('SHARD_RECOVERED');
    expect(service.notificationsSent[0]?.payload.recipientEmail).toBe('admin@company.com');
  });
});
