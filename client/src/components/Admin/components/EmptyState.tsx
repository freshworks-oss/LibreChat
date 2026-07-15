import React from 'react';
import { Inbox } from 'lucide-react';

type EmptyStateProps = {
  message: string;
  icon?: React.ElementType;
};

export default function EmptyState({ message, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <Icon className="h-10 w-10 text-text-secondary opacity-50" aria-hidden="true" />
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}
