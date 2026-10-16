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

export async function fetchProjectHealth(projectId: string): Promise<ProjectHealthOverview> {
  try {
    const data = await apiClient<ProjectHealthOverview | { shards?: ShardHealthSummaryItem[] }>(`/projects/${projectId}/health`);
    if (data && 'shards' in data && Array.isArray(data.shards)) {
      return {
        projectId,
        overallHealth: (data as ProjectHealthOverview).overallHealth || 'HEALTHY',
        shards: data.shards,
        recentEvents: (data as ProjectHealthOverview).recentEvents || [],
      };
    }
    return {
      projectId,
      overallHealth: 'HEALTHY',
      shards: [],
      recentEvents: [],
    };
  } catch (err) {
    console.error(`Failed to fetch health for project ${projectId}:`, err);
    return {
      projectId,
      overallHealth: 'HEALTHY',
      shards: [],
      recentEvents: [],
    };
  }
}

export async function triggerHealthCheck(projectId: string): Promise<ProjectHealthOverview> {
  try {
    return await apiClient<ProjectHealthOverview>(`/projects/${projectId}/health/check`, {
      method: 'POST',
    });
  } catch {
    return fetchProjectHealth(projectId);
  }
}
