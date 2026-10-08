import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Shard, TenantMapping } from '@/types';
import { AlertCircle } from 'lucide-react';

interface UpdateMappingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mapping: TenantMapping | null;
  onSuccess: (tenantId: string, shardId: string) => Promise<void>;
  shards: Shard[];
}

export function UpdateMappingDialog({
  isOpen,
  onClose,
  mapping,
  onSuccess,
  shards,
}: UpdateMappingDialogProps) {
  const [shardId, setShardId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mapping) {
      setShardId(mapping.shardId);
      setError(null);
    }
  }, [mapping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapping) return;
    if (!shardId) {
      setError('Please select a shard');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await onSuccess(mapping.tenantId, shardId);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update tenant mapping';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Reassign Tenant to New Shard">
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        {error && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1 font-mono text-xs">
          <span className="text-zinc-500">Tenant Target ID:</span>
          <p className="text-emerald-400 font-bold">{mapping?.tenantId}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Reassign Shard Node</label>
          <Select
            value={shardId}
            onChange={(e) => setShardId(e.target.value)}
            disabled={isSubmitting}
            options={shards.map((s) => ({
              value: s.id,
              label: `${s.name} (${s.healthStatus})`,
            }))}
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save New Mapping
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
