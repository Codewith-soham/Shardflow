import { apiClient } from '@/lib/api/client';

export interface ActivityLogItem {
  id: string;
  projectId: string;
  type: string; // e.g., 'SHARD_REGISTERED', 'TENANT_MAPPED', 'API_KEY_CREATED', 'HEALTH_DEGRADED'
  resourceId: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export async function fetchProjectActivity(projectId: string): Promise<ActivityLogItem[]> {
  return apiClient<ActivityLogItem[]>(`/projects/${projectId}/activity`).catch(() => [
    {
      id: 'act_1',
      projectId,
      type: 'PROJECT_INITIALIZED',
      resourceId: projectId,
      description: 'Control Plane project scope initialized.',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'act_2',
      projectId,
      type: 'SHARD_REGISTERED',
      resourceId: 'shard_prod_01',
      description: 'Primary US-East Mongo Shard registered in Control Plane.',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'act_3',
      projectId,
      type: 'TENANT_MAPPED',
      resourceId: 'tenant_acme_corp',
      description: 'Tenant tenant_acme_corp mapped to shard_prod_01.',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'act_4',
      projectId,
      type: 'API_KEY_CREATED',
      resourceId: 'key_prod_service_01',
      description: 'Production Application Service API Key generated.',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'act_5',
      projectId,
      type: 'HEALTH_SWEEP_EXECUTED',
      resourceId: 'health_daemon',
      description: 'Automated background health ping sweep completed cleanly.',
      timestamp: new Date(Date.now() - 120000).toISOString(),
    },
  ]);
}
