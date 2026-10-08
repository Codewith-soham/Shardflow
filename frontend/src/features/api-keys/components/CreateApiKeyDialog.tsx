import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiKeyCreatedResponse } from '@/types';
import { Copy, Check, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';

interface CreateApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; expiresAt?: string | null }) => Promise<ApiKeyCreatedResponse>;
}

export function CreateApiKeyDialog({ isOpen, onClose, onSubmit }: CreateApiKeyDialogProps) {
  const [name, setName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [createdResult, setCreatedResult] = useState<ApiKeyCreatedResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('API Key name is required');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const res = await onSubmit({
        name: name.trim(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      setCreatedResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate API Key';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (createdResult?.key) {
      navigator.clipboard.writeText(createdResult.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDone = () => {
    setName('');
    setExpiresAt('');
    setCreatedResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={createdResult ? handleDone : onClose}
      title={createdResult ? 'API Key Generated' : 'Create New API Key'}
    >
      {createdResult ? (
        <div className="space-y-5 pt-2">
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Copy your secret key now!</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-300/90">
              For security purposes, this secret key will <strong>never be displayed again</strong>. Store it safely in your environment variables or password manager.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Generated Raw Key</label>
            <div className="flex items-center space-x-2">
              <input
                readOnly
                value={createdResult.key}
                className="flex-1 bg-black border border-emerald-800/80 text-emerald-300 font-mono text-xs px-3 py-2 rounded-lg selection:bg-emerald-500 selection:text-black focus:outline-none"
              />
              <Button onClick={handleCopy} variant="outline" size="sm" className="space-x-1 shrink-0">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Key'}</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-zinc-800">
            <Button onClick={handleDone} className="space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>I Have Saved My Key</span>
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {error && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Key Identifier / Name</label>
            <Input
              placeholder="e.g. production-backend-service"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Expiration Date (Optional)</label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={isSubmitting}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-zinc-500">Leave blank for a key that never expires.</p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Generate Key
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
