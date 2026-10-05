import { Badge } from '@/components/ui/Badge';
import { ShardAdminStatus, ProjectStatus } from '@/types';

export interface StatusBadgeProps {
  status: ShardAdminStatus | ProjectStatus | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const isEnabled = status === 'ACTIVE';

  return (
    <Badge
      variant={isEnabled ? 'sky' : 'zinc'}
      size={size}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-sky-400' : 'bg-zinc-500'}`} />
      <span>{status}</span>
    </Badge>
  );
}
