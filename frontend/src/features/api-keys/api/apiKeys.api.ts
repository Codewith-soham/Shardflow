import { apiClient } from '@/lib/api/client';
import { ApiKey, ApiKeyCreatedResponse } from '@/types';

export async function fetchApiKeys(projectId: string): Promise<ApiKey[]> {
  try {
    const res = await apiClient<{ apiKeys: ApiKey[] } | ApiKey[]>(`/projects/${projectId}/api-keys`);
    if (res && 'apiKeys' in res && Array.isArray((res as { apiKeys: ApiKey[] }).apiKeys)) {
      return (res as { apiKeys: ApiKey[] }).apiKeys;
    }
    if (Array.isArray(res)) {
      return res;
    }
    return [];
  } catch (err) {
    console.error(`Failed to fetch API keys for project ${projectId}:`, err);
    throw err;
  }
}

export async function createApiKey(
  projectId: string,
  payload: { name: string; expiresAt?: string | null }
): Promise<ApiKeyCreatedResponse> {
  const res = await apiClient<ApiKeyCreatedResponse>(`/projects/${projectId}/api-keys`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res;
}

export async function revokeApiKey(
  projectId: string,
  keyId: string
): Promise<{ success: boolean; keyId: string }> {
  return await apiClient<{ success: boolean; keyId: string }>(
    `/projects/${projectId}/api-keys/${keyId}`,
    {
      method: 'DELETE',
    }
  );
}
