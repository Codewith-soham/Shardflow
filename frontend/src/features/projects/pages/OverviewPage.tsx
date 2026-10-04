import { useState } from 'react';
import { useProject } from '@/app/providers/ProjectProvider';
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
  CheckCircle2,
  Server,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function OverviewPage() {
  const { activeProject } = useProject();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();

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
          value="4 MongoDB Nodes"
          trend={{ value: '+1 Added', positive: true }}
          icon={<Database className="w-4 h-4 text-emerald-400" />}
          subtitle="All nodes HEALTHY"
        />
        <MetricCard
          title="Tenant Mappings"
          value="128 Tenants"
          trend={{ value: 'Dynamic Hash', positive: true }}
          icon={<GitFork className="w-4 h-4 text-teal-400" />}
          subtitle="Tenant ID strategy"
        />
        <MetricCard
          title="Active API Keys"
          value="3 Keys"
          trend={{ value: '100% Valid', positive: true }}
          icon={<Key className="w-4 h-4 text-amber-400" />}
          subtitle="Project scoped"
        />
        <MetricCard
          title="Cluster Health"
          value="100% Operational"
          trend={{ value: '2ms Latency', positive: true }}
          icon={<Activity className="w-4 h-4 text-cyan-400" />}
          subtitle="Last check 1m ago"
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
                <HealthBadge status="HEALTHY" />
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
                <span className="px-2 py-0.5 text-[10px] font-mono text-teal-300 bg-teal-950 border border-teal-800 rounded-full font-semibold">
                  TENANT_BASED
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Tenant Mappings
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Configure explicit tenant-to-shard rules and assign fallback shard clusters.
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
                <span className="px-2 py-0.5 text-[10px] font-mono text-amber-300 bg-amber-950 border border-amber-800 rounded-full font-semibold">
                  Secured
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                API Key Management
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Issue X-API-Key credentials for client application routing verification.
              </p>
            </div>

            <div
              onClick={() => navigate('/app/integration')}
              className="p-5 rounded-2xl bg-[#06100B] border border-emerald-950 hover:border-emerald-800/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-950 text-cyan-400 border border-emerald-800/80 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 text-[10px] font-mono text-cyan-300 bg-cyan-950 border border-cyan-800 rounded-full font-semibold">
                  SDK Docs
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Developer Integration
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Copy HTTP headers, Node.js / Python snippets, and tenant resolution code.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Shard Mesh Telemetry */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Shard Mesh Telemetry</span>
          </h2>

          <div className="p-5 rounded-2xl bg-[#06100B] border border-emerald-950 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950">
              <span className="text-xs font-semibold text-zinc-200">System Ping</span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">Operational</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-300">mongo-shard-01</span>
                </div>
                <span className="font-mono text-[11px] text-zinc-400">1.8ms</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-300">mongo-shard-02</span>
                </div>
                <span className="font-mono text-[11px] text-zinc-400">2.4ms</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-300">mongo-shard-03</span>
                </div>
                <span className="font-mono text-[11px] text-zinc-400">2.1ms</span>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-950">
              <Button
                onClick={() => navigate('/app/health')}
                variant="ghost"
                className="w-full text-center text-xs text-emerald-400 hover:text-emerald-300 py-1"
              >
                View Full Health Diagnostics →
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CreateProjectDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
