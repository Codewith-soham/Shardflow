import { apiClient } from '@/lib/api/client';
import { TenantMapping, RoutingConfig } from '@/types';

export async function getRoutingConfig(projectId: string): Promise<RoutingConfig> {
  try {
    return await apiClient<RoutingConfig>(`/projects/${projectId}/routing`);
  } catch {
    return { strategy: 'TENANT_BASED' };
  }
}

export async function getTenantMappings(projectId: string): Promise<TenantMapping[]> {
  try {
    const res = await apiClient<{ tenantMappings: TenantMapping[] } | TenantMapping[]>(
      `/projects/${projectId}/tenant-mappings`
    );
    if (res && 'tenantMappings' in res && Array.isArray((res as { tenantMappings: TenantMapping[] }).tenantMappings)) {
      return (res as { tenantMappings: TenantMapping[] }).tenantMappings;
    }
    if (Array.isArray(res)) {
      return res;
    }
    return [];
  } catch (err) {
    console.error(`Failed to fetch tenant mappings for project ${projectId}:`, err);
    throw err;
  }
}

export async function createTenantMapping(
  projectId: string,
  payload: { tenantId: string; shardId: string }
): Promise<TenantMapping> {
  const res = await apiClient<TenantMapping>(`/projects/${projectId}/tenant-mappings`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res;
}

export async function updateTenantMapping(
  projectId: string,
  tenantId: string,
  payload: { shardId: string }
): Promise<TenantMapping> {
  const res = await apiClient<TenantMapping>(
    `/projects/${projectId}/tenant-mappings/${tenantId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
  return res;
}

export async function deleteTenantMapping(
  projectId: string,
  tenantId: string
): Promise<{ success: boolean; tenantId: string }> {
  return await apiClient<{ success: boolean; tenantId: string }>(
    `/projects/${projectId}/tenant-mappings/${tenantId}`,
    {
      method: 'DELETE',
    }
  );
}
