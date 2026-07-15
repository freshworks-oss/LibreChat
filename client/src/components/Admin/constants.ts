import { Users, Group, KeyRound, Settings, ShieldCheck, BarChart2 } from 'lucide-react';
import type { AdminTab } from './types';

/* ── React Query key factories ──────────────────────────────────────── */

export const ADMIN_QUERY_KEYS = {
  users: ['admin', 'users'] as const,
  userSearch: (q: string) => ['admin', 'users', 'search', q] as const,
  userStats: (filters: { startDate?: string; endDate?: string }) =>
    ['admin', 'users', 'stats', filters.startDate ?? '', filters.endDate ?? ''] as const,
  groups: ['admin', 'groups'] as const,
  group: (id: string) => ['admin', 'groups', id] as const,
  groupMembers: (id: string) => ['admin', 'groups', id, 'members'] as const,
  roles: ['admin', 'roles'] as const,
  role: (name: string) => ['admin', 'roles', name] as const,
  roleMembers: (name: string) => ['admin', 'roles', name, 'members'] as const,
  configs: ['admin', 'configs'] as const,
  config: (type: string, id: string) => ['admin', 'configs', type, id] as const,
  baseConfig: ['admin', 'configs', 'base'] as const,
  grants: ['admin', 'grants'] as const,
  principalGrants: (type: string, id: string) => ['admin', 'grants', type, id] as const,
  effectiveCapabilities: ['admin', 'grants', 'effective'] as const,
};

/* ── Sidebar tab definitions ────────────────────────────────────────── */

export const ADMIN_TABS: AdminTab[] = [
  {
    id: 'users',
    label: 'Users',
    path: 'users',
    icon: Users,
    requiredCapability: 'read:users',
  },
  {
    id: 'stats',
    label: 'Stats',
    path: 'stats',
    icon: BarChart2,
    requiredCapability: 'read:users',
  },
  {
    id: 'groups',
    label: 'Groups',
    path: 'groups',
    icon: Group,
    requiredCapability: 'read:groups',
  },
  {
    id: 'roles',
    label: 'Roles',
    path: 'roles',
    icon: ShieldCheck,
    requiredCapability: 'read:roles',
  },
  {
    id: 'config',
    label: 'Config',
    path: 'config',
    icon: Settings,
    requiredCapability: 'read:configs',
  },
  {
    id: 'grants',
    label: 'Grants',
    path: 'grants',
    icon: KeyRound,
    requiredCapability: 'access:admin',
  },
];
