import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProjectHealth, triggerHealthCheck, ProjectHealthOverview } from '../api/health.api';

export function useHealth(projectId?: string | null) {
  const queryClient = useQueryClient();
  const effectiveProjectId = projectId || 'proj_default';

  const healthQuery = useQuery<ProjectHealthOverview>({
    queryKey: ['projectHealth', effectiveProjectId],
    queryFn: () => fetchProjectHealth(effectiveProjectId),
    enabled: Boolean(effectiveProjectId),
    refetchInterval: 1000 * 30, // Auto-refresh health every 30 seconds
  });

  const checkMutation = useMutation({
    mutationFn: () => triggerHealthCheck(effectiveProjectId),
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['projectHealth', effectiveProjectId], updatedData);
      queryClient.invalidateQueries({ queryKey: ['shards', effectiveProjectId] });
    },
  });

  return {
    healthData: healthQuery.data,
    isLoading: healthQuery.isLoading,
    isError: healthQuery.isError,
    error: healthQuery.error,
    refetch: healthQuery.refetch,
    triggerCheck: checkMutation.mutateAsync,
    isChecking: checkMutation.isPending,
  };
}
