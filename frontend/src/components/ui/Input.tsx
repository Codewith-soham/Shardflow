import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-3 text-zinc-400 pointer-events-none">{icon}</div>}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'w-full h-9 rounded-md bg-[#111113] border border-zinc-800 text-zinc-100 text-sm px-3 placeholder:text-zinc-500 transition-colors focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed',
              icon && 'pl-9',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-red-400 font-mono">{error}</p>
        ) : hint ? (
          <p className="text-xs text-zinc-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
