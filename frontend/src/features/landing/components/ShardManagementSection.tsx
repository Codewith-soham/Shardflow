import { ShardCard } from '@/components/ui/ShardCard';
import { Shard } from '@/types';
import { Server } from 'lucide-react';

export function ShardManagementSection() {
  const sampleShards: Shard[] = [
    {
      id: 'shard_us_east_01',
      name: 'shard-us-east-primary',
      status: 'ACTIVE',
      healthStatus: 'HEALTHY',
    },
    {
      id: 'shard_eu_central_01',
      name: 'shard-eu-central-primary',
      status: 'ACTIVE',
      healthStatus: 'HEALTHY',
    },
    {
      id: 'shard_us_west_01',
      name: 'shard-us-west-backup',
      status: 'ACTIVE',
      healthStatus: 'DEGRADED',
    },
  ];

  return (
    <section id="shards" className="py-20 border-b border-emerald-950/80 bg-[#06100B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-3">
          <div className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider">Shard Registry</div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Centralized database topology management.
          </h2>
          <p className="text-sm text-emerald-100/70 leading-relaxed">
            Register your customer-owned MongoDB database clusters with secure AES-256 encrypted credential storage and per-shard connection isolation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleShards.map((shard) => (
            <ShardCard key={shard.id} shard={shard} />
          ))}

        </div>

        <div className="p-4 rounded-xl bg-[#0A1610] border border-emerald-900/60 flex items-center justify-between text-xs text-emerald-300/80 font-mono">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Connection credentials are encrypted at rest and never exposed in API responses.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

