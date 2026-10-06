import { apiClient } from '@/lib/api/client';
import { Shard } from '@/types';

// In-memory initial store scoped by projectId for dev testing
let MOCK_SHARDS: Shard[] = [
  // Production Shard Cluster (proj_prod_shard_01)
  {
    id: 'shard_prod_01',
    projectId: 'proj_prod_shard_01',
    name: 'Primary US-East Mongo Shard',
    status: 'ACTIVE',
    healthStatus: 'HEALTHY',
    lastHealthCheckAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    lastSuccessfulHealthCheckAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'shard_prod_02',
    projectId: 'proj_prod_shard_01',
    name: 'Secondary EU-Central Mongo Shard',
    status: 'ACTIVE',
    healthStatus: 'HEALTHY',
    lastHealthCheckAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lastSuccessfulHealthCheckAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'shard_prod_03',
    projectId: 'proj_prod_shard_01',
    name: 'APAC High-Throughput Shard',
    status: 'ACTIVE',
    healthStatus: 'DEGRADED',
    lastHealthCheckAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    lastSuccessfulHealthCheckAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Staging E-Commerce Mesh (proj_staging_mesh_02)
  {
    id: 'shard_staging_01',
    projectId: 'proj_staging_mesh_02',
    name: 'Staging Test Cluster Shard',
    status: 'ACTIVE',
    healthStatus: 'HEALTHY',
    lastHealthCheckAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    lastSuccessfulHealthCheckAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Dev Analytics Engine (proj_dev_analytics_03)
  {
    id: 'shard_dev_01',
    projectId: 'proj_dev_analytics_03',
    name: 'Dev Telemetry Mongo Shard',
    status: 'ACTIVE',
    healthStatus: 'HEALTHY',
    lastHealthCheckAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    lastSuccessfulHealthCheckAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export interface RegisterShardPayload {
  name: string;
  connectionUri: string;
}

export interface UpdateShardPayload {
  name?: string;
  status?: 'ACTIVE' | 'DISABLED';
}

export async function fetchShards(projectId: string): Promise<Shard[]> {
  try {
    const data = await apiClient<{ shards: Shard[] } | Shard[]>(`/projects/${projectId}/shards`);
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray((data as { shards: Shard[] }).shards)) {
      return (data as { shards: Shard[] }).shards;
    }
    return MOCK_SHARDS.filter((s) => s.projectId === projectId);
  } catch (err) {
    console.warn('Backend API unaccessible for shards, returning project shards dataset:', err);
    return MOCK_SHARDS.filter((s) => s.projectId === projectId);
  }
}

export async function registerShard(
  projectId: string,
  payload: RegisterShardPayload
): Promise<Shard> {
  try {
    const newShard = await apiClient<Shard>(`/projects/${projectId}/shards`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    MOCK_SHARDS = [newShard, ...MOCK_SHARDS];
    return newShard;
  } catch (err) {
    console.warn('Backend API unaccessible, registering shard locally for project:', projectId, err);
    const newShard: Shard = {
      id: `shard_${Math.random().toString(36).substring(2, 9)}`,
      projectId,
      name: payload.name,
      status: 'ACTIVE',
      healthStatus: 'UNKNOWN',
      lastHealthCheckAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_SHARDS = [newShard, ...MOCK_SHARDS];
    return newShard;
  }
}

export async function getShardById(projectId: string, shardId: string): Promise<Shard | null> {
  try {
    const shard = await apiClient<Shard>(`/projects/${projectId}/shards/${shardId}`);
    return shard;
  } catch {
    return MOCK_SHARDS.find((s) => s.id === shardId && (!s.projectId || s.projectId === projectId)) || null;
  }
}

export async function updateShard(
  projectId: string,
  shardId: string,
  payload: UpdateShardPayload
): Promise<Shard> {
  try {
    const updated = await apiClient<Shard>(`/projects/${projectId}/shards/${shardId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    MOCK_SHARDS = MOCK_SHARDS.map((s) => (s.id === shardId ? updated : s));
    return updated;
  } catch (err) {
    console.warn('Backend API unaccessible, updating shard locally:', err);
    MOCK_SHARDS = MOCK_SHARDS.map((s) => {
      if (s.id === shardId) {
        return {
          ...s,
          ...(payload.name && { name: payload.name }),
          ...(payload.status && { status: payload.status }),
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    return MOCK_SHARDS.find((s) => s.id === shardId)!;
  }
}

export async function disableShard(projectId: string, shardId: string): Promise<Shard> {
  return updateShard(projectId, shardId, { status: 'DISABLED' });
}
