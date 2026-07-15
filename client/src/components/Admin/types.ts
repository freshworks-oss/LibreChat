import type { LucideIcon } from 'lucide-react';

// Re-export types from @librechat/data-schemas for convenience
export type {
  AdminConfig,
  AdminConfigListResponse,
  AdminGroup,
  AdminMember,
  AdminSystemGrant,
  AdminUserListItem,
  AdminUserSearchResult,
} from '@librechat/data-schemas';

/* ── Request types ──────────────────────────────────────────────────── */

export type UpsertConfigRequest = {
  overrides: Record<string, unknown>;
  priority: number;
};

export type FieldPatchEntry = {
  fieldPath: string;
  value: unknown;
};

export type AssignGrantRequest = {
  principalType: 'role';
  principalId: string;
  capability: string;
};

/* ── Response types ─────────────────────────────────────────────────── */

export type AdminUsersResponse = {
  users: import('@librechat/data-schemas').AdminUserListItem[];
  total: number;
  nextCursor?: string;
};

export type AdminGroupDetail = import('@librechat/data-schemas').AdminGroup & {
  source: 'local' | 'entra';
  memberIds: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type AdminRoleListItem = {
  name: string;
  description?: string;
  memberCount: number;
};

export type AdminRoleDetail = {
  name: string;
  description?: string;
  permissions: Record<string, Record<string, boolean>>;
};

export type AdminConfigListResponse_Local = {
  configs: import('@librechat/data-schemas').AdminConfig[];
};

/* ── UI types ───────────────────────────────────────────────────────── */

export type AdminTab = {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  requiredCapability: string;
};
