import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { Shard } from '@/types';
import { Database, Server } from 'lucide-react';

export interface ShardCardProps {
  shard: Shard;
  onClick?: () => void;
}

export function ShardCard({ shard, onClick }: ShardCardProps) {
  return (
    <Card hoverable={Boolean(onClick)} onClick={onClick} className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-zinc-800/80 text-sky-400 border border-zinc-700/60">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">{shard.name}</h4>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">ID: {shard.id}</p>
          </div>
        </div>
        <HealthBadge status={shard.healthStatus} size="sm" />
      </div>

      <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5 text-zinc-400">
          <Server className="w-3.5 h-3.5 text-zinc-500" />
          <span>MongoDB Engine</span>
        </div>
        <StatusBadge status={shard.status} size="sm" />
      </div>
    </Card>
  );
}
