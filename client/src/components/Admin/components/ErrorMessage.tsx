import React from 'react';
import { AlertTriangle, ShieldOff, FileQuestion } from 'lucide-react';
import { Button } from '@librechat/client';

type ErrorMessageProps = {
  /** The error type to display */
  variant: 'forbidden' | 'not-found' | 'inline';
  /** Error message text */
  message?: string;
  /** Callback for "Go back" action */
  onBack?: () => void;
};

export default function ErrorMessage({ variant, message, onBack }: ErrorMessageProps) {
  if (variant === 'forbidden') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <ShieldOff className="h-10 w-10 text-red-400" aria-hidden="true" />
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {message || 'You do not have permission to access this resource.'}
        </p>
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            Go back
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'not-found') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <FileQuestion className="h-10 w-10 text-text-secondary opacity-50" aria-hidden="true" />
        <p className="text-sm text-text-secondary">
          {message || 'The requested resource was not found.'}
        </p>
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            Go back
          </Button>
        )}
      </div>
    );
  }

  // inline variant
  return (
    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950" role="alert">
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
      <p className="text-sm text-red-700 dark:text-red-300">
        {message || 'An error occurred.'}
      </p>
    </div>
  );
}
