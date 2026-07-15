import React from 'react';
import { UserPlus, X } from 'lucide-react';
import { Button } from '@librechat/client';
import type { AdminMember } from '../types';

type MemberListProps = {
  members: AdminMember[];
  onRemove: (userId: string) => void;
  canManage: boolean;
  onAddClick?: () => void;
};

export default function MemberList({ members, onRemove, canManage, onAddClick }: MemberListProps) {
  if (members.length === 0 && !canManage) {
    return <p className="py-4 text-center text-sm text-text-secondary">No members</p>;
  }

  return (
    <div className="space-y-1">
      {canManage && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAddClick}
          className="mb-2"
          aria-label="Add member"
        >
          <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Add member
        </Button>
      )}

      {members.length === 0 ? (
        <p className="py-4 text-center text-sm text-text-secondary">No members yet</p>
      ) : (
        <ul className="divide-y divide-border-light" role="list">
          {members.map((member) => (
            <li
              key={member.userId}
              className="flex items-center justify-between py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text-primary">{member.name}</p>
                <p className="truncate text-text-secondary">{member.email}</p>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => onRemove(member.userId)}
                  className="ml-2 rounded p-1 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  aria-label={`Remove ${member.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
