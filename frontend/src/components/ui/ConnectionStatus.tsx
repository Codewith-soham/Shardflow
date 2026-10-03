import { ShardHealthStatus } from '@/types';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

export interface ConnectionStatusProps {
  status: ShardHealthStatus;
  lastChecked?: string | null;
}

export function ConnectionStatus({ status, lastChecked }: ConnectionStatusProps) {
  const icons = {
    HEALTHY: <Wifi className="w-3.5 h-3.5 text-emerald-400" />,
    DEGRADED: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    UNHEALTHY: <WifiOff className="w-3.5 h-3.5 text-red-400" />,
    UNKNOWN: <WifiOff className="w-3.5 h-3.5 text-zinc-500" />,
  };

  const labels = {
    HEALTHY: 'Connected',
    DEGRADED: 'Degraded Connection',
    UNHEALTHY: 'Connection Failed',
    UNKNOWN: 'Not Verified',
  };

  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className="shrink-0">{icons[status] || icons.UNKNOWN}</div>
      <span className="font-mono text-zinc-300">{labels[status] || labels.UNKNOWN}</span>
      {lastChecked && (
        <span className="text-[11px] text-zinc-500 font-mono">
          ({new Date(lastChecked).toLocaleTimeString()})
        </span>
      )}
    </div>
  );
}
