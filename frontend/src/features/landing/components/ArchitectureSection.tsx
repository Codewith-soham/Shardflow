import { Server, Database, Shield, Cpu, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function ArchitectureSection() {
  return (
    <section id="architecture" className="py-20 border-b border-emerald-950/80 bg-[#050807]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-3">
          <div className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider">System Architecture</div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Clean decoupling of control metadata and customer data.
          </h2>
          <p className="text-sm text-emerald-100/70 leading-relaxed">
            ShardFlow maintains strict isolation between infrastructure metadata and customer application database shards.
          </p>
        </div>

        {/* Architecture Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Control Plane */}
          <div className="p-6 rounded-xl bg-[#08120D] border border-teal-500/40 space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-teal-400">
                <Cpu className="w-5 h-5" />
                <h3 className="text-base font-semibold text-white">Control Plane</h3>
              </div>
              <Badge variant="emerald" size="sm">Supabase Auth</Badge>

            </div>

            <p className="text-xs text-emerald-200/60 leading-relaxed">
              Manages infrastructure configuration, user accounts, API key generation, shard registration, and health monitoring.
            </p>

            <div className="p-3 rounded-lg bg-[#050B08] border border-emerald-900/40 text-xs font-mono text-emerald-200 space-y-1">
              <div className="text-emerald-400/60">// Stores Infrastructure Metadata Only</div>
              <div>• users, projects, apiKeys</div>
              <div>• shards, routingConfigs, tenantShardMappings</div>
              <div>• healthEvents, auditLogs</div>
            </div>
          </div>

          {/* Data Plane */}
          <div className="p-6 rounded-xl bg-[#08120D] border border-emerald-500/40 space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Server className="w-5 h-5" />
                <h3 className="text-base font-semibold text-white">Data Plane</h3>
              </div>
              <Badge variant="emerald" size="sm">API Key Auth</Badge>
            </div>

            <p className="text-xs text-emerald-200/60 leading-relaxed">
              Executes application database queries against customer MongoDB shards using connection pooling and tenant resolution.
            </p>

            <div className="p-3 rounded-lg bg-[#050B08] border border-emerald-900/40 text-xs font-mono text-emerald-200 space-y-1">
              <div className="text-emerald-400/60">// Interacts With Customer Databases</div>
              <div>• customer application data</div>
              <div>• users, orders, products, etc.</div>
              <div>• isolated connection pools per shard</div>
            </div>
          </div>
        </div>

        {/* Security Principles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-emerald-950/80 text-xs">
          <div className="flex items-start space-x-3">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-emerald-100">AES-256 Encryption</h4>
              <p className="text-emerald-300/60 leading-relaxed">Database connection strings are encrypted at rest and never returned in API payloads.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Shield className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-emerald-100">One-Time API Keys</h4>
              <p className="text-emerald-300/60 leading-relaxed">Raw API keys are returned once upon creation. Only secure key hashes are stored.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Database className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-emerald-100">Customer Data Ownership</h4>
              <p className="text-emerald-300/60 leading-relaxed">Your application data remains inside your own MongoDB databases.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

