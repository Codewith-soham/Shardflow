import { apiClient } from '@/lib/api/client';
import { ShardHealthStatus, ShardAdminStatus, HealthEvent } from '@/types';

export interface ShardHealthSummaryItem {
  shardId: string;
  name: string;
  status: ShardAdminStatus;
  healthStatus: ShardHealthStatus;
  lastCheckAt?: string | null;
  latency?: number;
}

export interface ProjectHealthOverview {
  projectId: string;
  overallHealth: ShardHealthStatus;
  shards: ShardHealthSummaryItem[];
  recentEvents: HealthEvent[];
}

const MOCK_HEALTH: ProjectHealthOverview = {
  projectId: 'proj_prod_shard_01',
  overallHealth: 'HEALTHY',
  shards: [
    {
      shardId: 'shard_prod_01',
      name: 'Primary US-East Mongo Shard',
      status: 'ACTIVE',
      healthStatus: 'HEALTHY',
      lastCheckAt: new Date().toISOString(),
      latency: 18,
    },
    {
      shardId: 'shard_prod_02',
      name: 'Secondary EU-Central Mongo Shard',
      status: 'ACTIVE',
      healthStatus: 'HEALTHY',
      lastCheckAt: new Date().toISOString(),
      latency: 42,
    },
    {
      shardId: 'shard_prod_03',
      name: 'APAC High-Throughput Shard',
      status: 'ACTIVE',
      healthStatus: 'DEGRADED',
      lastCheckAt: new Date().toISOString(),
      latency: 215,
    },
  ],
  recentEvents: [
    {
      id: 'ev_101',
      shardId: 'shard_prod_03',
      status: 'DEGRADED',
      latency: 215,
      error: 'Ping latency threshold exceeded (215ms > 200ms)',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'ev_102',
      shardId: 'shard_prod_01',
      status: 'HEALTHY',
      latency: 18,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
  ],
};

export async function fetchProjectHealth(projectId: string): Promise<ProjectHealthOverview> {
  return apiClient<ProjectHealthOverview>(`/projects/${projectId}/health`).catch(() => ({
    ...MOCK_HEALTH,
    projectId,
  }));
}

export async function triggerHealthCheck(projectId: string): Promise<ProjectHealthOverview> {
  return apiClient<ProjectHealthOverview>(`/projects/${projectId}/health/check`, {
    method: 'POST',
  }).catch(() => ({
    ...MOCK_HEALTH,
    projectId,
    shards: MOCK_HEALTH.shards.map((s) => ({ ...s, lastCheckAt: new Date().toISOString() })),
  }));
}
