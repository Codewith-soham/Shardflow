import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchShards,
  registerShard,
  getShardById,
  updateShard,
  disableShard,
  RegisterShardPayload,
  UpdateShardPayload,
} from '../api/shardsApi';
import { Shard } from '@/types';

export function useShards(projectId?: string | null) {
  const queryClient = useQueryClient();
  const effectiveProjectId = projectId || 'proj_default';

  const shardsQuery = useQuery<Shard[]>({
    queryKey: ['shards', effectiveProjectId],
    queryFn: () => fetchShards(effectiveProjectId),
    enabled: Boolean(effectiveProjectId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterShardPayload) => registerShard(effectiveProjectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shards', effectiveProjectId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ shardId, payload }: { shardId: string; payload: UpdateShardPayload }) =>
      updateShard(effectiveProjectId, shardId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shards', effectiveProjectId] });
      queryClient.invalidateQueries({ queryKey: ['shard', effectiveProjectId, variables.shardId] });
    },
  });

  const disableMutation = useMutation({
    mutationFn: (shardId: string) => disableShard(effectiveProjectId, shardId),
    onSuccess: (_, shardId) => {
      queryClient.invalidateQueries({ queryKey: ['shards', effectiveProjectId] });
      queryClient.invalidateQueries({ queryKey: ['shard', effectiveProjectId, shardId] });
    },
  });

  return {
    shards: shardsQuery.data || [],
    isLoading: shardsQuery.isLoading,
    isError: shardsQuery.isError,
    error: shardsQuery.error,
    refetch: shardsQuery.refetch,
    registerShard: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    updateShard: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    disableShard: disableMutation.mutateAsync,
    isDisabling: disableMutation.isPending,
  };
}

export function useShardDetail(projectId: string | null, shardId: string | undefined) {
  const effectiveProjectId = projectId || 'proj_default';

  return useQuery<Shard | null>({
    queryKey: ['shard', effectiveProjectId, shardId],
    queryFn: () => (shardId ? getShardById(effectiveProjectId, shardId) : Promise.resolve(null)),
    enabled: Boolean(effectiveProjectId && shardId),
  });
}
