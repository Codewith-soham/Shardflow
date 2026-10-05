import React from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon, trend, className }: MetricCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-mono">{title}</p>
          <div className="text-2xl font-bold text-zinc-100 font-mono tracking-tight">{value}</div>
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-zinc-800/60 text-zinc-300 border border-zinc-700/50">
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
          {subtitle && <span className="text-zinc-500">{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                'font-mono font-medium',
                trend.positive ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
