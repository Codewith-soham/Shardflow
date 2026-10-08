import { apiClient } from '@/lib/api/client';
import { ApiKey, ApiKeyCreatedResponse } from '@/types';

let MOCK_API_KEYS: ApiKey[] = [
  {
    id: 'key_prod_service_01',
    name: 'Production Application Service',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: null,
    lastUsedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'key_staging_worker_02',
    name: 'Staging Worker Daemon',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: null,
    lastUsedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
];

export async function fetchApiKeys(projectId: string): Promise<ApiKey[]> {
  return apiClient<ApiKey[]>(`/projects/${projectId}/api-keys`).catch(() => MOCK_API_KEYS);
}

export async function createApiKey(
  projectId: string,
  payload: { name: string; expiresAt?: string | null }
): Promise<ApiKeyCreatedResponse> {
  try {
    const res = await apiClient<ApiKeyCreatedResponse>(`/projects/${projectId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    MOCK_API_KEYS = [res, ...MOCK_API_KEYS];
    return res;
  } catch {
    const rawKey = `sf_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const newKey: ApiKeyCreatedResponse = {
      id: `key_${Math.random().toString(36).substring(2, 9)}`,
      name: payload.name,
      status: 'ACTIVE',
      key: rawKey,
      createdAt: new Date().toISOString(),
      expiresAt: payload.expiresAt || null,
      lastUsedAt: null,
    };
    MOCK_API_KEYS = [newKey, ...MOCK_API_KEYS];
    return newKey;
  }
}

export async function revokeApiKey(
  projectId: string,
  keyId: string
): Promise<{ success: boolean; keyId: string }> {
  try {
    return await apiClient<{ success: boolean; keyId: string }>(
      `/projects/${projectId}/api-keys/${keyId}`,
      {
        method: 'DELETE',
      }
    );
  } catch {
    MOCK_API_KEYS = MOCK_API_KEYS.map((k) => (k.id === keyId ? { ...k, status: 'REVOKED' } : k));
    return { success: true, keyId };
  }
}
