import { useState, useMemo } from 'react';
import { useProject } from '@/app/providers/ProjectProvider';
import { useActivity } from '../hooks/useActivity';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ActivityItem as ActivityItemUI } from '@/components/ui/ActivityItem';
import { ActivityLogItem } from '../api/activity.api';
import { Activity, Search, RefreshCw, Filter } from 'lucide-react';

export function ActivityPage() {
  const { activeProject } = useProject();
  const { data: activities = [], isLoading, isError, error, refetch } = useActivity(
    activeProject?.id
  );

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedActivity, setSelectedActivity] = useState<ActivityLogItem | null>(null);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesSearch =
        !search.trim() ||
        act.description.toLowerCase().includes(search.toLowerCase()) ||
        act.type.toLowerCase().includes(search.toLowerCase()) ||
        act.resourceId.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === 'ALL' || act.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [activities, search, typeFilter]);

  if (isLoading) {
    return <LoadingState message="Loading infrastructure audit logs..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Activity Log"
        message={error instanceof Error ? error.message : 'Could not fetch project audit trail.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Infrastructure Activity Log</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Immutable audit log of Control Plane configuration updates, shard registration, and health events.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="space-x-1 shrink-0">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search by event type, resource ID, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs font-mono"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Event Types' },
              { value: 'PROJECT_INITIALIZED', label: 'Project Initialized' },
              { value: 'ROUTING_CONFIGURED', label: 'Routing Configured' },
              { value: 'SHARD_REGISTERED', label: 'Shard Registered' },
              { value: 'TENANT_MAPPED', label: 'Tenant Mapped' },
              { value: 'API_KEY_CREATED', label: 'API Key Created' },
              { value: 'HEALTH_SWEEP_EXECUTED', label: 'Health Sweep' },
            ]}
          />
        </div>
      </div>

      {/* Activity Log List */}
      {filteredActivities.length === 0 ? (
        <EmptyState
          icon={<Activity className="w-6 h-6 text-zinc-400" />}
          title="No Activity Records Found"
          description={
            search || typeFilter !== 'ALL'
              ? 'Try clearing your search or filter parameters.'
              : 'Audit log events will appear here as infrastructure updates occur.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((act) => (
            <div
              key={act.id}
              onClick={() => setSelectedActivity(act)}
              className="cursor-pointer transition-all hover:translate-x-1"
            >
              <ActivityItemUI
                event={{
                  id: act.id,
                  shardId: act.resourceId,
                  status: 'HEALTHY',
                  createdAt: act.timestamp,
                }}
                shardName={act.description}
              />
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog
        isOpen={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        title="Activity Details"
      >
        {selectedActivity && (
          <div className="space-y-4 pt-2 font-mono text-xs">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500">EVENT TYPE</span>
              <p className="text-emerald-400 font-bold">{selectedActivity.type}</p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500">RESOURCE TARGET ID</span>
              <p className="text-white">{selectedActivity.resourceId}</p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500">DESCRIPTION</span>
              <p className="text-zinc-300 font-sans text-xs">{selectedActivity.description}</p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500">TIMESTAMP</span>
              <p className="text-zinc-400">{new Date(selectedActivity.timestamp).toLocaleString()}</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setSelectedActivity(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
