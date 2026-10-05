import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading infrastructure data...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3 text-center">
      <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
      <p className="text-xs font-mono text-zinc-400">{message}</p>
    </div>
  );
}
