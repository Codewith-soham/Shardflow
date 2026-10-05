import React, { useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  maxWidth = 'md',
}: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={cn(
          'w-full rounded-lg bg-[#111113] border border-zinc-800 p-6 shadow-2xl shadow-black/80 space-y-4 relative animate-in zoom-in-95 duration-150',
          maxWidths[maxWidth],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-100 rounded-md p-1 transition-colors hover:bg-zinc-800"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {title && (
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
            {description && <p className="text-xs text-zinc-400">{description}</p>}
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
}
