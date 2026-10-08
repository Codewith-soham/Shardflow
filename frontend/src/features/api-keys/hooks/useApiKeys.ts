import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApiKeys, createApiKey, revokeApiKey } from '../api/apiKeys.api';
import { ApiKey } from '@/types';

export function useApiKeys(projectId?: string | null) {
  const queryClient = useQueryClient();
  const effectiveProjectId = projectId || 'proj_default';

  const keysQuery = useQuery<ApiKey[]>({
    queryKey: ['apiKeys', effectiveProjectId],
    queryFn: () => fetchApiKeys(effectiveProjectId),
    enabled: Boolean(effectiveProjectId),
    staleTime: 1000 * 60 * 2,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; expiresAt?: string | null }) =>
      createApiKey(effectiveProjectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys', effectiveProjectId] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (keyId: string) => revokeApiKey(effectiveProjectId, keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys', effectiveProjectId] });
    },
  });

  return {
    apiKeys: keysQuery.data || [],
    isLoading: keysQuery.isLoading,
    isError: keysQuery.isError,
    error: keysQuery.error,
    refetch: keysQuery.refetch,
    createApiKey: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    revokeApiKey: revokeMutation.mutateAsync,
    isRevoking: revokeMutation.isPending,
  };
}
