import { HealthEvent } from '@/types';
import { Activity, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export interface ActivityItemProps {
  event: HealthEvent;
  shardName?: string;
}

export function ActivityItem({ event, shardName }: ActivityItemProps) {
  const icons = {
    HEALTHY: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
    DEGRADED: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
    UNHEALTHY: <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />,
    UNKNOWN: <Activity className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />,
  };

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg bg-[#111113] border border-zinc-800/60 text-xs">
      {icons[event.status] || icons.UNKNOWN}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-200">
            Shard {shardName || event.shardId} transitioned to{' '}
            <span className="font-mono text-sky-400">{event.status}</span>
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">
            {new Date(event.createdAt).toLocaleTimeString()}
          </span>
        </div>
        {event.latency !== undefined && (
          <p className="text-[11px] text-zinc-400 font-mono">
            Response latency: {event.latency}ms
          </p>
        )}
        {event.error && (
          <p className="text-[11px] text-red-400 font-mono bg-red-500/10 p-1.5 rounded border border-red-500/20">
            {typeof event.error === 'string' ? event.error : JSON.stringify(event.error)}
          </p>
        )}
      </div>
    </div>
  );
}
