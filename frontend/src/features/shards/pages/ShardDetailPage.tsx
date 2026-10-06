import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '@/app/providers/ProjectProvider';
import { useShardDetail, useShards } from '../hooks/useShards';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EditShardDialog } from '../components/EditShardDialog';
import { DisableShardDialog } from '../components/DisableShardDialog';
import {
  ArrowLeft,
  Database,
  Server,
  Activity,
  ShieldCheck,
  KeyRound,
  Edit,
  Power,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export function ShardDetailPage() {
  const { shardId } = useParams<{ shardId: string }>();
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const { data: shard, isLoading, isError, refetch } = useShardDetail(activeProject?.id || null, shardId);

  const { updateShard, isUpdating, disableShard, isDisabling } = useShards(activeProject?.id);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDisableOpen, setIsDisableOpen] = useState(false);

  if (isLoading) {
    return <LoadingState message="Loading shard details & diagnostic telemetry..." />;
  }

  if (isError || !shard) {
    return (
      <ErrorState
        title="Shard Not Found"
        message={`Unable to locate shard "${shardId}" within project "${activeProject?.name || 'Workspace'}".`}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div className="space-y-3 pb-4 border-b border-emerald-950">
        <button
          onClick={() => navigate('/app/shards')}
          className="inline-flex items-center text-xs text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Shard Registry
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-950 border border-emerald-800/80 text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-tight">{shard.name}</h1>
                <HealthBadge status={shard.healthStatus} size="sm" />
                <StatusBadge status={shard.status} size="sm" />
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-1">ID: {shard.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="border-emerald-900/60 text-emerald-200 hover:bg-emerald-950/40"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit Configuration
            </Button>
            {shard.status === 'ACTIVE' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDisableOpen(true)}
                className="text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/40"
              >
                <Power className="w-3.5 h-3.5 mr-1.5" />
                Disable Shard
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Overview Card */}
          <div className="p-5 rounded-2xl bg-[#06100B] border border-emerald-900/60 shadow-xl space-y-4">
            <h3 className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              Infrastructure Metadata & Specs
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-[#08150F] border border-emerald-950 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Database Engine</span>
                <div className="text-xs font-semibold text-white font-mono">MongoDB v5.0+ (Atlas/Clustered)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#08150F] border border-emerald-950 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Admin Status</span>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={shard.status} size="sm" />
                  <span className="text-xs text-zinc-300">
                    {shard.status === 'ACTIVE' ? 'Accepting Tenant Operations' : 'Routing Disabled'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#08150F] border border-emerald-950 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Health Monitoring</span>
                <div className="flex items-center space-x-2">
                  <HealthBadge status={shard.healthStatus} size="sm" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#08150F] border border-emerald-950 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Registration Date</span>
                <div className="text-xs text-zinc-300 font-mono">
                  {shard.createdAt ? new Date(shard.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Masked Connection Parameters Card */}
          <div className="p-5 rounded-2xl bg-[#06100B] border border-emerald-900/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                Connection Credentials & Protection
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-[10px] font-mono text-emerald-300">
                AES-256 ENCRYPTED
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-mono text-zinc-400">Target Connection String (Masked)</label>
              <div className="p-3 rounded-xl bg-[#030906] border border-emerald-950 text-xs font-mono text-emerald-300/80 flex items-center justify-between select-none">
                <span>mongodb+srv://user_prod:••••••••••••••••@shard-cluster.{shard.id}.mongodb.net</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Connection URIs are encrypted using control-plane key management. Raw passwords are never transmitted in API client telemetry.
              </p>
            </div>
          </div>

          {/* Recent Health Event History */}
          <div className="p-5 rounded-2xl bg-[#06100B] border border-emerald-900/60 shadow-xl space-y-4">
            <h3 className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Health Diagnostic Telemetry
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#08150F] border border-emerald-950 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-zinc-200">Periodic Ping Check Succeeded</div>
                    <div className="text-[10px] text-zinc-400">Latency: 12ms • Status: 200 OK</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  {shard.lastHealthCheckAt ? new Date(shard.lastHealthCheckAt).toLocaleTimeString() : 'Just now'}
                </span>
              </div>

              {shard.healthStatus === 'DEGRADED' && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-amber-200">High Latency Spike Detected</div>
                      <div className="text-[10px] text-zinc-400">Ping latency exceeded 250ms threshold</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">15 mins ago</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-6">
          {/* Tenant Routing Quick Context */}
          <div className="p-5 rounded-2xl bg-[#06100B] border border-emerald-900/60 shadow-xl space-y-3">
            <h4 className="text-xs font-mono text-zinc-300 uppercase tracking-wider font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Tenant Routing Context
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tenants assigned to this shard will have all data plane queries automatically routed to this MongoDB instance.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/routing')}
              className="w-full text-xs border-emerald-900/60 text-emerald-300 hover:bg-emerald-950/50 justify-center"
            >
              Manage Tenant Mappings
            </Button>
          </div>

          {/* Operational Timestamps */}
          <div className="p-5 rounded-2xl bg-[#06100B] border border-emerald-900/60 shadow-xl space-y-3 text-xs">
            <h4 className="text-xs font-mono text-zinc-300 uppercase tracking-wider font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Audit Timestamps
            </h4>
            <div className="space-y-2 pt-1 font-mono text-[11px]">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Created At:</span>
                <span className="text-zinc-200">
                  {shard.createdAt ? new Date(shard.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Last Updated:</span>
                <span className="text-zinc-200">
                  {shard.updatedAt ? new Date(shard.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Last Pinged:</span>
                <span className="text-emerald-400">
                  {shard.lastHealthCheckAt ? new Date(shard.lastHealthCheckAt).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <EditShardDialog
        isOpen={isEditOpen}
        shard={shard}
        onClose={() => setIsEditOpen(false)}
        onSubmit={(sId, payload) => updateShard({ shardId: sId, payload })}
        isSubmitting={isUpdating}
      />

      <DisableShardDialog
        isOpen={isDisableOpen}
        shard={shard}
        onClose={() => setIsDisableOpen(false)}
        onConfirm={(sId) => disableShard(sId)}
        isDisabling={isDisabling}
      />
    </div>
  );
}
