import { ShardHealthStatus } from '@/types';

export interface HealthIndicatorProps {
  status: ShardHealthStatus;
  showLabel?: boolean;
}

export function HealthIndicator({ status, showLabel = true }: HealthIndicatorProps) {
  const dots: Record<string, string> = {
    HEALTHY: 'bg-emerald-400 shadow-emerald-400/50 shadow-sm',
    DEGRADED: 'bg-amber-400 shadow-amber-400/50 shadow-sm',
    UNHEALTHY: 'bg-red-400 shadow-red-400/50 shadow-sm',
    UNKNOWN: 'bg-zinc-500',
  };

  return (
    <div className="inline-flex items-center space-x-2">
      <span className={`w-2 h-2 rounded-full ${dots[status] || dots.UNKNOWN}`} />
      {showLabel && (
        <span className="text-xs font-mono text-zinc-300 capitalize">{status.toLowerCase()}</span>
      )}
    </div>
  );
}
