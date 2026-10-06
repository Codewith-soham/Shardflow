import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/app/providers/ProjectProvider';
import { useShards } from '../hooks/useShards';
import { Shard } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { AddShardDialog } from '../components/AddShardDialog';
import { EditShardDialog } from '../components/EditShardDialog';
import { DisableShardDialog } from '../components/DisableShardDialog';
import {
  Server,
  Plus,
  Search,
  LayoutGrid,
  List,
  RefreshCw,
  Database,
  Activity,
  ShieldAlert,
  ExternalLink,
  Edit,
  Power,
  Boxes,
} from 'lucide-react';

const HEALTH_OPTIONS = [
  { value: 'ALL', label: 'All Health States' },
  { value: 'HEALTHY', label: 'Healthy Only' },
  { value: 'DEGRADED', label: 'Degraded Only' },
  { value: 'UNHEALTHY', label: 'Unhealthy Only' },
  { value: 'UNKNOWN', label: 'Unknown Status' },
];

export function ShardsPage() {
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const {
    shards,
    isLoading,
    isError,
    error,
    refetch,
    registerShard,
    isRegistering,
    updateShard,
    isUpdating,
    disableShard,
    isDisabling,
  } = useShards(activeProject?.id);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingShard, setEditingShard] = useState<Shard | null>(null);
  const [disablingShard, setDisablingShard] = useState<Shard | null>(null);

  // Filtered Shards
  const filteredShards = useMemo(() => {
    return shards.filter((shard) => {
      const matchesSearch =
        shard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shard.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesHealth =
        healthFilter === 'ALL' || shard.healthStatus === healthFilter;

      return matchesSearch && matchesHealth;
    });
  }, [shards, searchQuery, healthFilter]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = shards.length;
    const healthy = shards.filter((s) => s.healthStatus === 'HEALTHY').length;
    const degraded = shards.filter((s) => s.healthStatus === 'DEGRADED' || s.healthStatus === 'UNHEALTHY').length;
    const active = shards.filter((s) => s.status === 'ACTIVE').length;
    return { total, healthy, degraded, active };
  }, [shards]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-950">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400 font-semibold mb-1">
            <Boxes className="w-3.5 h-3.5 text-emerald-400" />
            <span className="uppercase tracking-wider">Project Context:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
              {activeProject?.name || 'Default Workspace'}
            </span>
            <span className="text-zinc-600 font-mono">({activeProject?.id})</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Project MongoDB Shard Registry
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Register and manage target MongoDB database shards specifically bound to project{' '}
            <strong className="text-emerald-300 font-medium">{activeProject?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-emerald-900/60 hover:bg-emerald-950/40 text-emerald-200"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Register Shard
          </Button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#06100B] border border-emerald-900/60 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Project Shards</div>
            <div className="text-base font-bold text-white font-mono">{metrics.total}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#06100B] border border-emerald-900/60 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Healthy Nodes</div>
            <div className="text-base font-bold text-emerald-400 font-mono">{metrics.healthy}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#06100B] border border-emerald-900/60 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-950/80 text-amber-400 border border-emerald-800/60">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Degraded / Issues</div>
            <div className="text-base font-bold text-amber-400 font-mono">{metrics.degraded}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#06100B] border border-emerald-900/60 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-950/80 text-teal-400 border border-emerald-800/60">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Active Status</div>
            <div className="text-base font-bold text-teal-300 font-mono">{metrics.active} / {metrics.total}</div>
          </div>
        </div>
      </div>

      {/* Filter and View Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-[#06100B] border border-emerald-900/50">
        <div className="flex items-center space-x-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeProject?.name || 'project'} shards by name or ID...`}
              className="pl-9 text-xs bg-[#08150F] border-emerald-900/60 focus:border-emerald-500"
            />
          </div>

          <div className="w-48 shrink-0">
            <Select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              options={HEALTH_OPTIONS}
              className="text-xs bg-[#08150F] border-emerald-900/60"
            />
          </div>
        </div>

        <div className="flex items-center space-x-1 border border-emerald-900/60 rounded-lg p-0.5 bg-[#08150F] shrink-0 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-emerald-900/60 text-emerald-200' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'table' ? 'bg-emerald-900/60 text-emerald-200' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content States */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 rounded-xl bg-emerald-950/20 border border-emerald-900/30" />
          <Skeleton className="h-44 rounded-xl bg-emerald-950/20 border border-emerald-900/30" />
          <Skeleton className="h-44 rounded-xl bg-emerald-950/20 border border-emerald-900/30" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to Load Shard Infrastructure"
          message={error instanceof Error ? error.message : 'An error occurred while fetching shard registry data.'}
          onRetry={() => refetch()}
        />
      ) : filteredShards.length === 0 ? (
        <EmptyState
          title={
            searchQuery || healthFilter !== 'ALL'
              ? 'No Shards Match Filters'
              : `No Shards Registered for ${activeProject?.name || 'Project'}`
          }
          description={
            searchQuery || healthFilter !== 'ALL'
              ? 'Try adjusting your search query or health status filter.'
              : `Project "${activeProject?.name || 'Workspace'}" does not have any MongoDB shards registered yet. Register a shard to enable tenant-to-database routing.`
          }
          actionLabel={searchQuery || healthFilter !== 'ALL' ? 'Reset Filters' : `Register Shard for ${activeProject?.name || 'Project'}`}
          onAction={
            searchQuery || healthFilter !== 'ALL'
              ? () => {
                  setSearchQuery('');
                  setHealthFilter('ALL');
                }
              : () => setIsAddOpen(true)
          }
          icon={<Server className="w-6 h-6 text-emerald-400" />}
        />
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShards.map((shard) => (
            <div
              key={shard.id}
              className="p-5 rounded-2xl bg-[#06100B] border border-emerald-900/60 hover:border-emerald-700/80 transition-all shadow-lg hover:shadow-emerald-950/40 space-y-4 relative group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-800/80 text-emerald-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-emerald-200 transition-colors">
                      {shard.name}
                    </h3>
                    <p className="text-[11px] font-mono text-zinc-400 mt-0.5">{shard.id}</p>
                  </div>
                </div>
                <HealthBadge status={shard.healthStatus} size="sm" />
              </div>

              <div className="space-y-2 pt-2 border-t border-emerald-950 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-zinc-500 font-mono text-[11px]">ADMIN STATUS</span>
                  <StatusBadge status={shard.status} size="sm" />
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-zinc-500 font-mono text-[11px]">PROJECT</span>
                  <span className="text-emerald-300 font-mono text-[11px] truncate max-w-[140px]">
                    {activeProject?.name || shard.projectId}
                  </span>
                </div>
                {shard.lastHealthCheckAt && (
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-zinc-500 font-mono text-[11px]">LAST CHECK</span>
                    <span className="text-zinc-300 text-[11px]">
                      {new Date(shard.lastHealthCheckAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-emerald-950 flex items-center justify-between space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/app/shards/${shard.id}`)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 flex-1 justify-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Details
                </Button>
                <button
                  onClick={() => setEditingShard(shard)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-emerald-950/60 transition-colors"
                  title="Edit Shard"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                {shard.status === 'ACTIVE' && (
                  <button
                    onClick={() => setDisablingShard(shard)}
                    className="p-1.5 rounded-lg text-red-400/80 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                    title="Disable Shard"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shard Name & ID</TableHead>
              <TableHead>Bound Project</TableHead>
              <TableHead>Health Status</TableHead>
              <TableHead>Admin Status</TableHead>
              <TableHead>Last Ping</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShards.map((shard) => (
              <TableRow key={shard.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800/80 text-emerald-400 shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-xs">{shard.name}</div>
                      <div className="font-mono text-[10px] text-zinc-400">{shard.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-emerald-300">{activeProject?.name}</span>
                </TableCell>
                <TableCell>
                  <HealthBadge status={shard.healthStatus} size="sm" />
                </TableCell>
                <TableCell>
                  <StatusBadge status={shard.status} size="sm" />
                </TableCell>
                <TableCell>
                  <span className="text-xs text-zinc-400">
                    {shard.lastHealthCheckAt ? new Date(shard.lastHealthCheckAt).toLocaleString() : 'N/A'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/app/shards/${shard.id}`)}
                      className="text-xs text-emerald-400 hover:bg-emerald-950/50"
                    >
                      View
                    </Button>
                    <button
                      onClick={() => setEditingShard(shard)}
                      className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-emerald-950/50"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {shard.status === 'ACTIVE' && (
                      <button
                        onClick={() => setDisablingShard(shard)}
                        className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-950/40"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog Modals */}
      <AddShardDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={registerShard}
        isSubmitting={isRegistering}
      />

      <EditShardDialog
        isOpen={Boolean(editingShard)}
        shard={editingShard}
        onClose={() => setEditingShard(null)}
        onSubmit={(shardId, payload) => updateShard({ shardId, payload })}
        isSubmitting={isUpdating}
      />

      <DisableShardDialog
        isOpen={Boolean(disablingShard)}
        shard={disablingShard}
        onClose={() => setDisablingShard(null)}
        onConfirm={(shardId) => disableShard(shardId)}
        isDisabling={isDisabling}
      />
    </div>
  );
}
