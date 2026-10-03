import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'sky' | 'emerald' | 'amber' | 'red' | 'zinc' | 'outline';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  icon,
  children,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-mono font-medium rounded-full border transition-colors select-none';

  const variants = {
    default: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
    zinc: 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50',
    outline: 'bg-transparent text-zinc-300 border-zinc-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
