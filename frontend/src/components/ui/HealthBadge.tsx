import { Badge } from '@/components/ui/Badge';
import { ShardHealthStatus } from '@/types';

export interface HealthBadgeProps {
  status: ShardHealthStatus | string;
  size?: 'sm' | 'md';
}

export function HealthBadge({ status, size = 'md' }: HealthBadgeProps) {
  const configs: Record<string, { variant: 'emerald' | 'amber' | 'red' | 'zinc'; dot: string }> = {
    HEALTHY: { variant: 'emerald', dot: 'bg-emerald-400 animate-pulse' },
    DEGRADED: { variant: 'amber', dot: 'bg-amber-400' },
    UNHEALTHY: { variant: 'red', dot: 'bg-red-400' },
    UNKNOWN: { variant: 'zinc', dot: 'bg-zinc-500' },
  };

  const config = configs[status] || configs.UNKNOWN;

  return (
    <Badge variant={config.variant} size={size}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{status}</span>
    </Badge>
  );
}
