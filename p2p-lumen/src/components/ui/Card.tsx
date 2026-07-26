'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a glowing border accent */
  glow?: 'brand' | 'cyan' | 'violet' | 'none';
}

export function Card({ className, glow = 'none', children, ...props }: CardProps) {
  const glowClass =
    glow === 'brand' ? 'border-brand-500/40 shadow-glow-brand' :
    glow === 'cyan'  ? 'border-accent-cyan/40 shadow-glow-cyan' :
    glow === 'violet'? 'border-accent-violet/40 shadow-glow-violet' :
    'border-surface-border';

  return (
    <div
      className={cn(
        'rounded-2xl border bg-surface-card p-6 shadow-card transition-all duration-300',
        glowClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
