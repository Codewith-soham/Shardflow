import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shard } from '@/types';
import { useToast } from '@/components/feedback/Toast';
import { Edit3 } from 'lucide-react';

export interface EditShardDialogProps {
  isOpen: boolean;
  shard: Shard | null;
  onClose: () => void;
  onSubmit: (shardId: string, payload: { name: string }) => Promise<unknown>;
  isSubmitting?: boolean;
}

export function EditShardDialog({
  isOpen,
  shard,
  onClose,
  onSubmit,
  isSubmitting = false,
}: EditShardDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (shard) {
      setName(shard.name);
      setError(null);
    }
  }, [shard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shard) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Shard name cannot be empty.');
      return;
    }

    try {
      await onSubmit(shard.id, { name: trimmedName });
      toast('success', 'Shard updated', `Shard renamed to "${trimmedName}".`);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update shard';
      setError(msg);
      toast('error', 'Update failed', msg);
    }
  };

  if (!shard) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Shard Configuration"
      description={`Update metadata and operational details for ${shard.name}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-200">Shard ID</label>
          <div className="px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-400 select-all">
            {shard.id}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-200">Shard Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Shard Name"
            disabled={isSubmitting}
          />
        </div>

        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end space-x-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Edit3 className="w-4 h-4 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
