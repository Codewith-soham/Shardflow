import { useQuery } from '@tanstack/react-query';
import { fetchProjectActivity, ActivityLogItem } from '../api/activity.api';

export function useActivity(projectId?: string | null) {
  const effectiveProjectId = projectId || 'proj_default';

  return useQuery<ActivityLogItem[]>({
    queryKey: ['projectActivity', effectiveProjectId],
    queryFn: () => fetchProjectActivity(effectiveProjectId),
    enabled: Boolean(effectiveProjectId),
    staleTime: 1000 * 60,
  });
}
