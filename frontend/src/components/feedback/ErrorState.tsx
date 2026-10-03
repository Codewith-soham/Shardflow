import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the Control Plane API.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-red-500/20 bg-red-500/5 space-y-3">
      <div className="p-3 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed font-mono">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} icon={<RefreshCw className="w-3.5 h-3.5" />} className="mt-2">
          Retry Request
        </Button>
      )}
    </div>
  );
}
