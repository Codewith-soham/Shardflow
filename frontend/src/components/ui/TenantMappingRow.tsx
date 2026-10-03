import { TableRow, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { TenantMapping } from '@/types';
import { ArrowRight, Database } from 'lucide-react';

export interface TenantMappingRowProps {
  mapping: TenantMapping;
  shardName?: string;
  onEdit?: (mapping: TenantMapping) => void;
  onDelete?: (mapping: TenantMapping) => void;
}

export function TenantMappingRow({ mapping, shardName, onEdit, onDelete }: TenantMappingRowProps) {
  return (
    <TableRow>
      <TableCell className="font-mono text-zinc-100 font-semibold">
        {mapping.tenantId}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2 text-zinc-400">
          <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <div className="flex items-center space-x-1.5 text-zinc-200">
            <Database className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="font-mono">{shardName || mapping.shardId}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="emerald" size="sm">Mapped</Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(mapping)}
              className="text-xs text-zinc-400 hover:text-sky-400 font-medium transition-colors"
            >
              Reassign
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(mapping)}
              className="text-xs text-zinc-400 hover:text-red-400 font-medium transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
