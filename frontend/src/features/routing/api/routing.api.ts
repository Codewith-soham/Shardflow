import { apiClient } from '@/lib/api/client';
import { TenantMapping, RoutingConfig } from '@/types';

let MOCK_MAPPINGS: TenantMapping[] = [
  {
    id: 'map_001',
    tenantId: 'tenant_acme_corp',
    shardId: 'shard_prod_01',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'map_002',
    tenantId: 'tenant_globex_inc',
    shardId: 'shard_prod_02',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'map_003',
    tenantId: 'tenant_stark_ind',
    shardId: 'shard_prod_01',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function getRoutingConfig(projectId: string): Promise<RoutingConfig> {
  return apiClient<RoutingConfig>(`/projects/${projectId}/routing`).catch(() => ({
    strategy: 'TENANT_BASED',
  }));
}

export async function getTenantMappings(projectId: string): Promise<TenantMapping[]> {
  return apiClient<TenantMapping[]>(`/projects/${projectId}/tenant-mappings`).catch(() => MOCK_MAPPINGS);
}

export async function createTenantMapping(
  projectId: string,
  payload: { tenantId: string; shardId: string }
): Promise<TenantMapping> {
  try {
    const res = await apiClient<TenantMapping>(`/projects/${projectId}/tenant-mappings`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    MOCK_MAPPINGS = [res, ...MOCK_MAPPINGS];
    return res;
  } catch {
    const newMapping: TenantMapping = {
      id: `map_${Math.random().toString(36).substring(2, 9)}`,
      tenantId: payload.tenantId,
      shardId: payload.shardId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_MAPPINGS = [newMapping, ...MOCK_MAPPINGS];
    return newMapping;
  }
}

export async function updateTenantMapping(
  projectId: string,
  tenantId: string,
  payload: { shardId: string }
): Promise<TenantMapping> {
  try {
    const res = await apiClient<TenantMapping>(
      `/projects/${projectId}/tenant-mappings/${tenantId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
    MOCK_MAPPINGS = MOCK_MAPPINGS.map((m) => (m.tenantId === tenantId ? res : m));
    return res;
  } catch {
    MOCK_MAPPINGS = MOCK_MAPPINGS.map((m) =>
      m.tenantId === tenantId ? { ...m, shardId: payload.shardId, updatedAt: new Date().toISOString() } : m
    );
    return MOCK_MAPPINGS.find((m) => m.tenantId === tenantId)!;
  }
}

export async function deleteTenantMapping(
  projectId: string,
  tenantId: string
): Promise<{ success: boolean; tenantId: string }> {
  try {
    return await apiClient<{ success: boolean; tenantId: string }>(
      `/projects/${projectId}/tenant-mappings/${tenantId}`,
      {
        method: 'DELETE',
      }
    );
  } catch {
    MOCK_MAPPINGS = MOCK_MAPPINGS.filter((m) => m.tenantId !== tenantId);
    return { success: true, tenantId };
  }
}
