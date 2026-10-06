import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Database, ShieldAlert, KeyRound, Server } from 'lucide-react';
import { useToast } from '@/components/feedback/Toast';
import { RegisterShardPayload } from '../api/shardsApi';

export interface AddShardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: RegisterShardPayload) => Promise<unknown>;
  isSubmitting?: boolean;
}

export function AddShardDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AddShardDialogProps) {
  const [name, setName] = useState('');
  const [connectionUri, setConnectionUri] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleReset = () => {
    setName('');
    setConnectionUri('');
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedUri = connectionUri.trim();

    if (!trimmedName) {
      setError('Shard name is required.');
      return;
    }

    if (!trimmedUri) {
      setError('MongoDB connection URI is required.');
      return;
    }

    if (!trimmedUri.startsWith('mongodb://') && !trimmedUri.startsWith('mongodb+srv://')) {
      setError('Connection URI must be a valid Mongo URI starting with mongodb:// or mongodb+srv://');
      return;
    }

    try {
      await onSubmit({ name: trimmedName, connectionUri: trimmedUri });
      toast('success', 'Shard registered', `MongoDB shard "${trimmedName}" registered successfully.`);
      handleClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to register shard';
      setError(msg);
      toast('error', 'Shard registration failed', msg);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Register MongoDB Shard"
      description="Connect a new target MongoDB database shard to your ShardFlow infrastructure."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>Shard Name</span>
            <span className="text-[10px] font-mono text-zinc-500">REQUIRED</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. US-East-Primary-Shard-01"
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>Database Engine</span>
          </label>
          <div className="px-3 py-2 rounded-lg bg-[#06100B] border border-emerald-900/60 text-xs text-emerald-300 flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">MongoDB Shard (v5.0+ / Atlas)</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>MongoDB Connection URI</span>
            <span className="text-[10px] font-mono text-emerald-400/80">ENCRYPTED AT REST</span>
          </label>
          <div className="relative">
            <Input
              type="password"
              value={connectionUri}
              onChange={(e) => setConnectionUri(e.target.value)}
              placeholder="mongodb+srv://<username>:<password>@cluster.mongodb.net/dbname"
              disabled={isSubmitting}
              className="font-mono text-xs pr-10"
            />
            <div className="absolute right-3 top-2.5 text-zinc-500 pointer-events-none">
              <KeyRound className="w-4 h-4 text-emerald-500/70" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Database credentials are encrypted prior to persistence and are never exposed in logs or API responses.
          </p>
        </div>

        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end space-x-3">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Database className="w-4 h-4 mr-1.5" />
            Register Shard
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
