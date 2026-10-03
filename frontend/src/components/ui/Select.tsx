import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, hint, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-zinc-300">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full h-9 rounded-md bg-[#111113] border border-zinc-800 text-zinc-100 text-sm px-3 transition-colors focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
            error && 'border-red-500 focus:border-red-500',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled} className="bg-[#111113] text-zinc-100">
              {option.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="text-xs text-red-400 font-mono">{error}</p>
        ) : hint ? (
          <p className="text-xs text-zinc-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
