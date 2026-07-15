import React from 'react';
import { Skeleton } from '@librechat/client';

type LoadingStateProps = {
  /** Number of skeleton rows to render */
  rows?: number;
  /** Whether to show a table-like skeleton */
  variant?: 'table' | 'card' | 'inline';
};

export default function LoadingState({ rows = 5, variant = 'table' }: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-text-secondary border-t-transparent" />
          Loading…
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border-light p-4 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-light">
      <div className="border-b border-border-light bg-surface-secondary px-4 py-2">
        <Skeleton className="h-4 w-full" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-border-light px-4 py-3 last:border-b-0">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
        </div>
      ))}
    </div>
  );
}
