import { TableRow, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { ApiKey } from '@/types';
import { Key, Trash2 } from 'lucide-react';

export interface ApiKeyRowProps {
  apiKey: ApiKey;
  onRevoke?: (apiKey: ApiKey) => void;
}

export function ApiKeyRow({ apiKey, onRevoke }: ApiKeyRowProps) {
  const isRevoked = apiKey.status === 'REVOKED';

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-2.5">
          <Key className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="font-semibold text-zinc-100">{apiKey.name}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-zinc-400">
        sf_live_••••••••••••
      </TableCell>
      <TableCell>
        <Badge variant={isRevoked ? 'red' : 'sky'} size="sm">
          {apiKey.status}
        </Badge>
      </TableCell>
      <TableCell className="text-zinc-400 font-mono text-[11px]">
        {new Date(apiKey.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        {onRevoke && !isRevoked && (
          <button
            onClick={() => onRevoke(apiKey)}
            className="inline-flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Revoke</span>
          </button>
        )}
      </TableCell>
    </TableRow>
  );
}
