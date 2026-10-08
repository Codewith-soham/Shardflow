import { useState } from 'react';
import { useProject } from '@/app/providers/ProjectProvider';
import { useShards } from '@/features/shards/hooks/useShards';
import { useRouting } from '@/features/routing/hooks/useRouting';
import { useApiKeys } from '@/features/api-keys/hooks/useApiKeys';
import { useHealth } from '@/features/health/hooks/useHealth';
import { MetricCard } from '@/components/ui/MetricCard';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { Button } from '@/components/ui/Button';
import { CreateProjectDialog } from '../components/CreateProjectDialog';
import {
  Boxes,
  Database,
  GitFork,
  Key,
  Activity,
  ArrowRight,
  Sparkles,
  Server,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function OverviewPage() {
  const { activeProject } = useProject();
  const { shards } = useShards(activeProject?.id);
  const { mappings, config } = useRouting(activeProject?.id);
  const { apiKeys } = useApiKeys(activeProject?.id);
  const { healthData } = useHealth(activeProject?.id);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();

  const healthyShardsCount = shards.filter((s) => s.healthStatus === 'HEALTHY').length;

  return (
    <div className="space-y-6">
      {/* Active Project Hero Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#06100B] border border-emerald-900/60 shadow-xl relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-[10px] font-mono text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Active Control Plane Scope</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {activeProject ? activeProject.name : 'Production Shard Cluster'}
            </h1>
            <p className="text-xs text-zinc-400">
              {activeProject?.description ||
                'Multi-tenant MongoDB database sharding control plane for automated tenant resolution and request routing.'}
            </p>
            {activeProject && (
              <div className="pt-1 flex items-center space-x-2 font-mono text-[11px] text-zinc-400">
                <span className="text-zinc-500">Scope Key:</span>
                <span className="px-2 py-0.5 rounded bg-[#050B08] border border-emerald-950 text-emerald-300">
                  {activeProject.id}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={() => navigate('/app/shards')}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-2"
            >
              <span>Manage Shards</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              variant="outline"
              className="px-4 py-2.5 border-emerald-900/60 hover:bg-emerald-950/60 text-emerald-300 text-xs rounded-xl flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Infrastructure Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Target Shards"
          value={`${shards.length} Shards`}
          trend={{ value: `${healthyShardsCount}/${shards.length} Healthy`, positive: healthyShardsCount === shards.length }}
          icon={<Database className="w-4 h-4 text-emerald-400" />}
          subtitle="Registered database nodes"
        />
        <MetricCard
          title="Tenant Mappings"
          value={`${mappings.length} Tenants`}
          trend={{ value: config?.strategy || 'TENANT_BASED', positive: true }}
          icon={<GitFork className="w-4 h-4 text-teal-400" />}
          subtitle="Active routing table"
        />
        <MetricCard
          title="Active API Keys"
          value={`${apiKeys.length} Keys`}
          trend={{ value: 'Project Scoped', positive: true }}
          icon={<Key className="w-4 h-4 text-amber-400" />}
          subtitle="Data Plane secrets"
        />
        <MetricCard
          title="Cluster Health"
          value={healthData?.overallHealth || 'HEALTHY'}
          trend={{ value: 'Ping Sweep Active', positive: true }}
          icon={<Activity className="w-4 h-4 text-cyan-400" />}
          subtitle="30s health daemon"
        />
      </div>

      {/* Quick Navigation Cards & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Control Plane Shortcuts */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
            <Boxes className="w-4 h-4 text-emerald-400" />
            <span>Infrastructure Quick Modules</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => navigate('/app/shards')}
              className="p-5 rounded-2xl bg-[#06100B] border border-emerald-950 hover:border-emerald-800/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/80 group-hover:scale-105 transition-transform">
                  <Database className="w-5 h-5" />
                </div>
                <HealthBadge status={healthData?.overallHealth || 'HEALTHY'} />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Shard Registry
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Register connection strings, admin statuses, and monitor MongoDB target nodes.
              </p>
            </div>

            <div
              onClick={() => navigate('/app/routing')}
              className="p-5 rounded-2xl bg-[#06100B] border border-emerald-950 hover:border-emerald-800/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-950 text-teal-400 border border-emerald-800/80 group-hover:scale-105 transition-transform">
                  <GitFork className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-[10px] font-mono text-emerald-400">
                  {config?.strategy || 'TENANT_BASED'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Tenant Routing Table
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Deterministic mapping of tenant IDs to target MongoDB database shards.
              </p>
            </div>

            <div
              onClick={() => navigate('/app/api-keys')}
              className="p-5 rounded-2xl bg-[#06100B] border border-emerald-950 hover:border-emerald-800/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-950 text-amber-400 border border-emerald-800/80 group-hover:scale-105 transition-transform">
                  <Key className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-amber-400">{apiKeys.length} Active Keys</span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                API Key Lifecycle
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Generate and revoke secret API keys used by applications for Data Plane authentication.
              </p>
            </div>

            <div
              onClick={() => navigate('/app/integration')}
              className="p-5 rounded-2xl bg-[#06100B] border border-emerald-950 hover:border-emerald-800/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-950 text-sky-400 border border-emerald-800/80 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-sky-400">cURL / Node / Python</span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Developer Integration
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Explore interactive code snippets and environment configuration for Data Plane requests.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Shards Overview List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Registered Shards</span>
            </h2>
            <button
              onClick={() => navigate('/app/shards')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-mono"
            >
              View All →
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#06100B] border border-emerald-950 space-y-3">
            {shards.length === 0 ? (
              <p className="text-xs text-zinc-500 font-mono">No shards registered for this project scope.</p>
            ) : (
              shards.map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/app/shards/${s.id}`)}
                  className="p-3 rounded-xl bg-[#040806] border border-emerald-950 hover:border-emerald-800/60 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">{s.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500 block">{s.id}</span>
                  </div>
                  <HealthBadge status={s.healthStatus} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CreateProjectDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
