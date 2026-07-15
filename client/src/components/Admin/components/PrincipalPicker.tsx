import React, { useState } from 'react';
import { User, Users, ShieldCheck } from 'lucide-react';
import { useSearchUsers, useAdminGroups, useAdminRoles } from '../hooks';
import SearchInput from './SearchInput';

type PrincipalType = 'user' | 'group' | 'role';

type PrincipalPickerProps = {
  onSelect: (principalType: PrincipalType, principalId: string, displayName: string) => void;
  exclude?: { type: PrincipalType; id: string }[];
  /** Restrict which principal types are shown. Defaults to all types. */
  allowedTypes?: PrincipalType[];
};

const TYPE_META: Record<PrincipalType, { label: string; icon: React.ElementType; color: string }> =
  {
    user: { label: 'User', icon: User, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    group: { label: 'Group', icon: Users, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    role: { label: 'Role', icon: ShieldCheck, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  };

export default function PrincipalPicker({ onSelect, exclude = [], allowedTypes }: PrincipalPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const showUsers = !allowedTypes || allowedTypes.includes('user');
  const showGroups = !allowedTypes || allowedTypes.includes('group');
  const showRoles = !allowedTypes || allowedTypes.includes('role');

  const { data: users } = useSearchUsers(showUsers ? query : '');
  const { data: groups } = useAdminGroups();
  const { data: roles } = useAdminRoles();

  const excludeSet = new Set(exclude.map((e) => `${e.type}:${e.id}`));

  const lowerQuery = query.toLowerCase();

  const filteredGroups = showGroups
    ? (groups ?? []).filter(
        (g) => !excludeSet.has(`group:${g.id}`) && g.name.toLowerCase().includes(lowerQuery),
      )
    : [];

  const filteredRoles = showRoles
    ? (roles ?? []).filter(
        (r) => !excludeSet.has(`role:${r.name}`) && r.name.toLowerCase().includes(lowerQuery),
      )
    : [];

  const filteredUsers = showUsers
    ? (users ?? []).filter((u) => !excludeSet.has(`user:${u.id}`))
    : [];

  const hasResults = filteredUsers.length > 0 || filteredGroups.length > 0 || filteredRoles.length > 0;

  const handleSelect = (type: PrincipalType, id: string, name: string) => {
    onSelect(type, id, name);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <SearchInput
        onSearch={(q) => {
          setQuery(q);
          setOpen(q.length >= 2);
        }}
        placeholder="Search users, groups, or roles…"
      />

      {open && query.length >= 2 && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border-light bg-surface-primary shadow-lg">
          {!hasResults && (
            <p className="px-3 py-2 text-sm text-text-secondary">No results</p>
          )}

          {filteredUsers.length > 0 && (
            <ResultSection label="Users">
              {filteredUsers.map((u) => (
                <ResultRow
                  key={u.id}
                  type="user"
                  name={u.name}
                  detail={u.email}
                  onClick={() => handleSelect('user', u.id, u.name)}
                />
              ))}
            </ResultSection>
          )}

          {filteredGroups.length > 0 && (
            <ResultSection label="Groups">
              {filteredGroups.map((g) => (
                <ResultRow
                  key={g.id}
                  type="group"
                  name={g.name}
                  detail={`${g.memberCount} members`}
                  onClick={() => handleSelect('group', g.id, g.name)}
                />
              ))}
            </ResultSection>
          )}

          {filteredRoles.length > 0 && (
            <ResultSection label="Roles">
              {filteredRoles.map((r) => (
                <ResultRow
                  key={r.name}
                  type="role"
                  name={r.name}
                  detail={r.description}
                  onClick={() => handleSelect('role', r.name, r.name)}
                />
              ))}
            </ResultSection>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase text-text-secondary">
        {label}
      </p>
      {children}
    </div>
  );
}

function ResultRow({
  type,
  name,
  detail,
  onClick,
}: {
  type: PrincipalType;
  name: string;
  detail?: string;
  onClick: () => void;
}) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-hover"
    >
      <Icon className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${meta.color}`}>
        {meta.label}
      </span>
      <span className="truncate font-medium text-text-primary">{name}</span>
      {detail && <span className="ml-auto truncate text-xs text-text-secondary">{detail}</span>}
    </button>
  );
}
