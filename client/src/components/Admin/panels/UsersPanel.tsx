import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { Button } from '@librechat/client';
import { useAdminUsers, useSearchUsers } from '../hooks';
import SearchInput from '../components/SearchInput';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import { getErrorMessage, parseApiError } from '../utils';
import type { AdminUserListItem, AdminUserSearchResult } from '../types';

const PAGE_SIZE = 25;

export default function UsersPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const isSearching = searchQuery.length >= 2;

  const { data: listData, isLoading: listLoading, error: listError } = useAdminUsers({
    limit: PAGE_SIZE,
    cursor,
  });

  const { data: searchResults, isLoading: searchLoading, error: searchError } = useSearchUsers(searchQuery);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCursor(undefined);
    setExpandedUserId(null);
  }, []);

  const users: (AdminUserListItem | AdminUserSearchResult)[] = isSearching
    ? searchResults ?? []
    : listData?.users ?? [];

  const isLoading = isSearching ? searchLoading : listLoading;
  const error = isSearching ? searchError : listError;

  const toggleExpand = (userId: string) => {
    setExpandedUserId((prev) => (prev === userId ? null : userId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Users</h2>
      </div>

      <SearchInput onSearch={handleSearch} placeholder="Search users by name or email…" />

      {error && parseApiError(error).status === 403 ? (
        <ErrorMessage variant="forbidden" />
      ) : error ? (
        <ErrorMessage variant="inline" message={getErrorMessage(error, 'Users')} />
      ) : isLoading && users.length === 0 ? (
        <LoadingState rows={5} />
      ) : !isLoading && users.length === 0 ? (
        <EmptyState
          message={isSearching ? 'No users match your search' : 'No users found'}
          icon={Users}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-border-light">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-light bg-surface-secondary">
                <tr>
                  <th className="px-4 py-2 font-medium text-text-secondary">Name</th>
                  <th className="px-4 py-2 font-medium text-text-secondary">Email</th>
                  <th className="px-4 py-2 font-medium text-text-secondary">Role</th>
                  <th className="px-4 py-2 font-medium text-text-secondary">Provider</th>
                  <th className="w-10 px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {users.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr
                      className="cursor-pointer hover:bg-surface-hover"
                      onClick={() => toggleExpand(user.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleExpand(user.id);
                        }
                      }}
                      aria-expanded={expandedUserId === user.id}
                      aria-label={`View details for ${user.name}`}
                    >
                      <td className="px-4 py-2 font-medium text-text-primary">{user.name}</td>
                      <td className="px-4 py-2 text-text-secondary">{user.email}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex rounded-full bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-text-primary">
                          {'role' in user ? user.role : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-text-secondary">{'provider' in user ? user.provider : '—'}</td>
                      <td className="px-4 py-2 text-text-secondary">
                        {expandedUserId === user.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </td>
                    </tr>
                    {expandedUserId === user.id && (
                      <tr>
                        <td colSpan={5} className="bg-surface-secondary px-4 py-3">
                          <UserDetail user={user} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {!isSearching && listData?.nextCursor && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCursor(listData.nextCursor)}
                disabled={listLoading}
                aria-label="Load more users"
              >
                {listLoading ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UserDetail({ user }: { user: AdminUserListItem | AdminUserSearchResult }) {
  const full = 'role' in user ? (user as AdminUserListItem) : null;
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
      <div>
        <span className="font-medium text-text-secondary">ID:</span>{' '}
        <span className="text-text-primary">{user.id}</span>
      </div>
      <div>
        <span className="font-medium text-text-secondary">Username:</span>{' '}
        <span className="text-text-primary">{user.username ?? '—'}</span>
      </div>
      {full && (
        <>
          <div>
            <span className="font-medium text-text-secondary">Created:</span>{' '}
            <span className="text-text-primary">
              {full.createdAt ? new Date(full.createdAt).toLocaleDateString() : '—'}
            </span>
          </div>
          <div>
            <span className="font-medium text-text-secondary">Updated:</span>{' '}
            <span className="text-text-primary">
              {full.updatedAt ? new Date(full.updatedAt).toLocaleDateString() : '—'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
