import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Shard } from '@/types';
import { GitFork, AlertCircle } from 'lucide-react';

interface CreateMappingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tenantId: string, shardId: string) => Promise<void>;
  shards: Shard[];
}

export function CreateMappingDialog({
  isOpen,
  onClose,
  onSuccess,
  shards,
}: CreateMappingDialogProps) {
  const [tenantId, setTenantId] = useState('');
  const [shardId, setShardId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId.trim()) {
      setError('Tenant ID is required');
      return;
    }
    if (!shardId) {
      setError('Target Shard selection is required');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await onSuccess(tenantId.trim(), shardId);
      setTenantId('');
      setShardId('');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create tenant mapping';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Map Tenant to Database Shard">
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs">
          <GitFork className="w-5 h-5 shrink-0 text-emerald-400" />
          <p>
            Requests with header <code className="text-emerald-200 bg-emerald-900/50 px-1 py-0.5 rounded font-mono">X-Tenant-Id</code> matching this identifier will be deterministically routed to the selected shard.
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Tenant Identifier</label>
          <Input
            placeholder="e.g. tenant_acme_corp or user_10284"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            disabled={isSubmitting}
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Target Shard Node</label>
          <Select
            value={shardId}
            onChange={(e) => setShardId(e.target.value)}
            disabled={isSubmitting}
            options={[
              { value: '', label: '-- Select a Shard --' },
              ...shards.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.healthStatus})`,
              })),
            ]}
          />
          {shards.length === 0 && (
            <p className="text-[11px] text-amber-400 font-mono">
              No registered shards found for this project. Please register a shard first.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={shards.length === 0}>
            Create Mapping
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
