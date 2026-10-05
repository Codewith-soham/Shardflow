import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Check } from 'lucide-react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  hint?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, hint, id, checked, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex items-start space-x-2.5">
        <div className="relative flex items-center mt-0.5">
          <input
            id={checkboxId}
            type="checkbox"
            ref={ref}
            checked={checked}
            className={cn(
              'peer h-4 w-4 shrink-0 rounded border border-zinc-700 bg-[#111113] appearance-none checked:bg-sky-500 checked:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
              className
            )}
            {...props}
          />
          <Check className="pointer-events-none absolute left-0.5 top-0.5 h-3 w-3 text-zinc-950 opacity-0 peer-checked:opacity-100 transition-opacity stroke-[3]" />
        </div>
        {label && (
          <div className="text-xs">
            <label htmlFor={checkboxId} className="font-medium text-zinc-300 cursor-pointer select-none">
              {label}
            </label>
            {hint && <p className="text-zinc-500 mt-0.5">{hint}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
