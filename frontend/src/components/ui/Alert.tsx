import React from 'react';
import { cn } from '@/lib/utils/cn';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  icon?: React.ReactNode;
}

export function Alert({
  className,
  variant = 'info',
  title,
  icon,
  children,
  ...props
}: AlertProps) {
  const defaultIcons = {
    info: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
    success: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-400 shrink-0" />,
  };

  const variants = {
    info: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    error: 'bg-red-500/10 border-red-500/30 text-red-300',
  };

  return (
    <div
      className={cn('flex items-start space-x-3 p-3.5 rounded-lg border text-xs', variants[variant], className)}
      {...props}
    >
      {icon || defaultIcons[variant]}
      <div className="space-y-0.5 flex-1">
        {title && <h4 className="font-semibold text-zinc-100">{title}</h4>}
        <div className="text-zinc-300 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
