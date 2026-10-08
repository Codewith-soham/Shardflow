import { useState, useMemo } from 'react';
import { useProject } from '@/app/providers/ProjectProvider';
import { useHealth } from '../hooks/useHealth';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import {
  Activity,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Server,
  Filter,
} from 'lucide-react';

export function HealthPage() {
  const { activeProject } = useProject();
  const { healthData, isLoading, isError, error, refetch, triggerCheck, isChecking } = useHealth(
    activeProject?.id
  );

  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const shards = healthData?.shards || [];
  const events = healthData?.recentEvents || [];

  const counts = useMemo(() => {
    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;
    let unknown = 0;

    shards.forEach((s) => {
      if (s.healthStatus === 'HEALTHY') healthy++;
      else if (s.healthStatus === 'DEGRADED') degraded++;
      else if (s.healthStatus === 'UNHEALTHY') unhealthy++;
      else unknown++;
    });

    return { healthy, degraded, unhealthy, unknown, total: shards.length };
  }, [shards]);

  const filteredShards = useMemo(() => {
    if (statusFilter === 'ALL') return shards;
    return shards.filter((s) => s.healthStatus === statusFilter);
  }, [shards, statusFilter]);

  const handleManualCheck = async () => {
    await triggerCheck();
  };

  if (isLoading) {
    return <LoadingState message="Connecting to health monitoring daemon..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Health Status"
        message={error instanceof Error ? error.message : 'Could not reach health check service.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-white tracking-tight">Shard Health Monitor</h1>
            <HealthBadge status={healthData?.overallHealth || 'UNKNOWN'} />
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time ping latency, socket connection health, and availability monitoring for MongoDB shards.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualCheck}
            isLoading={isChecking}
            className="space-x-1.5 border-emerald-800/60 hover:bg-emerald-950/40 text-emerald-300"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Run Health Check</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="space-x-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Healthy Nodes"
          value={counts.healthy}
          subtitle={`out of ${counts.total} total shards`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        />
        <MetricCard
          title="Degraded Nodes"
          value={counts.degraded}
          subtitle="experiencing high latency"
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
        />
        <MetricCard
          title="Unhealthy Nodes"
          value={counts.unhealthy}
          subtitle="failing ping checks"
          icon={<XCircle className="w-5 h-5 text-red-400" />}
        />
        <MetricCard
          title="Unknown State"
          value={counts.unknown}
          subtitle="awaiting initial check"
          icon={<HelpCircle className="w-5 h-5 text-zinc-400" />}
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400">Filter by Status:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {['ALL', 'HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg border text-[11px] transition-colors ${
                statusFilter === st
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Shard Health Cards */}
      {filteredShards.length === 0 ? (
        <EmptyState
          icon={<Server className="w-6 h-6 text-zinc-400" />}
          title="No Shards Found for Selected Filter"
          description="Try switching the status filter tab above to view all database shards."
          actionLabel="Show All Shards"
          onAction={() => setStatusFilter('ALL')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShards.map((shard) => (
            <div
              key={shard.shardId}
              className="p-5 rounded-2xl bg-[#090D0B] border border-zinc-800 hover:border-emerald-800/60 transition-all space-y-4 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Server className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{shard.name}</span>
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-500 mt-0.5">{shard.shardId}</p>
                </div>
                <HealthBadge status={shard.healthStatus} />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 block">ADMIN STATUS</span>
                  <StatusBadge status={shard.status} />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">LAST CHECK</span>
                  <span className="text-zinc-300 text-[11px]">
                    {shard.lastCheckAt ? new Date(shard.lastCheckAt).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
              </div>

              {shard.latency !== undefined && (
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-zinc-400">Ping Latency:</span>
                  <span
                    className={
                      shard.latency < 50
                        ? 'text-emerald-400 font-bold'
                        : shard.latency < 200
                        ? 'text-amber-400 font-bold'
                        : 'text-red-400 font-bold'
                    }
                  >
                    {shard.latency} ms
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent Health Events Timeline */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Health Event History & Audit Log</span>
        </h3>

        {events.length === 0 ? (
          <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-400 font-mono">
            No health state changes recorded yet. Runs automatically every 30 seconds.
          </div>
        ) : (
          <div className="space-y-2 font-mono text-xs">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between gap-4 hover:border-zinc-700"
              >
                <div className="flex items-center space-x-3">
                  <HealthBadge status={ev.status} />
                  <div>
                    <span className="text-white font-semibold">{ev.shardId}</span>
                    {ev.error && typeof ev.error === 'string' && (
                      <p className="text-[11px] text-red-400 mt-0.5">{ev.error}</p>
                    )}
                  </div>
                </div>
                <div className="text-right text-[11px] text-zinc-500 shrink-0">
                  {new Date(ev.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
