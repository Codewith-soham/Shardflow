import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRoutingConfig,
  getTenantMappings,
  createTenantMapping,
  updateTenantMapping,
  deleteTenantMapping,
} from '../api/routing.api';
import { TenantMapping, RoutingConfig } from '@/types';

export function useRouting(projectId?: string | null) {
  const queryClient = useQueryClient();
  const effectiveProjectId = projectId || 'proj_default';

  const configQuery = useQuery<RoutingConfig>({
    queryKey: ['routingConfig', effectiveProjectId],
    queryFn: () => getRoutingConfig(effectiveProjectId),
    enabled: Boolean(effectiveProjectId),
    staleTime: 1000 * 60 * 5,
  });

  const mappingsQuery = useQuery<TenantMapping[]>({
    queryKey: ['tenantMappings', effectiveProjectId],
    queryFn: () => getTenantMappings(effectiveProjectId),
    enabled: Boolean(effectiveProjectId),
    staleTime: 1000 * 60 * 2,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { tenantId: string; shardId: string }) =>
      createTenantMapping(effectiveProjectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantMappings', effectiveProjectId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ tenantId, shardId }: { tenantId: string; shardId: string }) =>
      updateTenantMapping(effectiveProjectId, tenantId, { shardId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantMappings', effectiveProjectId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tenantId: string) => deleteTenantMapping(effectiveProjectId, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantMappings', effectiveProjectId] });
    },
  });

  return {
    config: configQuery.data,
    isConfigLoading: configQuery.isLoading,
    mappings: mappingsQuery.data || [],
    isMappingsLoading: mappingsQuery.isLoading,
    isError: mappingsQuery.isError || configQuery.isError,
    error: mappingsQuery.error || configQuery.error,
    refetch: () => {
      configQuery.refetch();
      mappingsQuery.refetch();
    },
    createMapping: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateMapping: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteMapping: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
