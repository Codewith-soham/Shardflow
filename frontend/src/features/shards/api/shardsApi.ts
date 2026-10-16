import { apiClient } from '@/lib/api/client';
import { Shard } from '@/types';

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
    if (data && 'shards' in data && Array.isArray((data as { shards: Shard[] }).shards)) {
      return (data as { shards: Shard[] }).shards;
    }
    return [];
  } catch (err) {
    console.error(`Failed to fetch shards for project ${projectId}:`, err);
    throw err;
  }
}

export async function registerShard(
  projectId: string,
  payload: RegisterShardPayload
): Promise<Shard> {
  const newShard = await apiClient<Shard>(`/projects/${projectId}/shards`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return newShard;
}

export async function getShardById(projectId: string, shardId: string): Promise<Shard | null> {
  try {
    const shard = await apiClient<Shard>(`/projects/${projectId}/shards/${shardId}`);
    return shard;
  } catch {
    return null;
  }
}

export async function updateShard(
  projectId: string,
  shardId: string,
  payload: UpdateShardPayload
): Promise<Shard> {
  const updated = await apiClient<Shard>(`/projects/${projectId}/shards/${shardId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return updated;
}

export async function disableShard(projectId: string, shardId: string): Promise<Shard> {
  return updateShard(projectId, shardId, { status: 'DISABLED' });
}
