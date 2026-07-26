'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  // Base
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-glow-brand hover:shadow-glow-brand',
        secondary:
          'bg-surface-card border border-surface-border text-white hover:bg-surface-elevated hover:border-brand-500/60',
        ghost:
          'text-gray-300 hover:text-white hover:bg-surface-card',
        danger:
          'bg-accent-rose/20 border border-accent-rose/40 text-accent-rose hover:bg-accent-rose hover:text-white',
        success:
          'bg-accent-emerald/20 border border-accent-emerald/40 text-accent-emerald hover:bg-accent-emerald hover:text-surface',
      },
      size: {
        sm:  'h-8  px-3  text-xs',
        md:  'h-10 px-4  text-sm',
        lg:  'h-12 px-6  text-base',
        xl:  'h-14 px-8  text-lg',
        icon:'h-9  w-9   text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
