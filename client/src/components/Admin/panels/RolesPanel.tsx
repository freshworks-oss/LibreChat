import React, { useState } from 'react';
import { Plus, ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Checkbox,
  OGDialog,
  OGDialogTrigger,
  OGDialogTemplate,
  useToastContext,
} from '@librechat/client';
import {
  useAdminRoles,
  useAdminRole,
  useAdminRoleMembers,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useUpdateRolePermissions,
  useAddRoleMember,
  useRemoveRoleMember,
  useHasCapability,
} from '../hooks';
import MemberList from '../components/MemberList';
import PrincipalPicker from '../components/PrincipalPicker';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import { getErrorMessage, parseApiError } from '../utils';
import type { AdminRoleDetail } from '../types';

export default function RolesPanel() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (selectedRole) {
    return <RoleDetail roleName={selectedRole} onBack={() => setSelectedRole(null)} />;
  }

  return (
    <RoleList
      onSelect={setSelectedRole}
      showCreateForm={showCreateForm}
      setShowCreateForm={setShowCreateForm}
    />
  );
}

/* ── Role List ──────────────────────────────────────────────────────── */

function RoleList({
  onSelect,
  showCreateForm,
  setShowCreateForm,
}: {
  onSelect: (name: string) => void;
  showCreateForm: boolean;
  setShowCreateForm: (v: boolean) => void;
}) {
  const { data: roles, isLoading, error } = useAdminRoles();
  const canManage = useHasCapability('manage:roles');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Roles</h2>
        {canManage && !showCreateForm && (
          <Button size="sm" onClick={() => setShowCreateForm(true)} aria-label="Create role">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Create Role
          </Button>
        )}
      </div>

      {showCreateForm && <CreateRoleForm onClose={() => setShowCreateForm(false)} />}

      {error && parseApiError(error).status === 403 ? (
        <ErrorMessage variant="forbidden" />
      ) : error ? (
        <ErrorMessage variant="inline" message={getErrorMessage(error, 'Roles')} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : !roles || roles.length === 0 ? (
        <EmptyState message="No roles yet" icon={ShieldCheck} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-light bg-surface-secondary">
              <tr>
                <th className="px-4 py-2 font-medium text-text-secondary">Name</th>
                <th className="px-4 py-2 font-medium text-text-secondary">Description</th>
                <th className="px-4 py-2 font-medium text-text-secondary">Members</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {roles.map((role) => (
                <tr
                  key={role.name}
                  className="cursor-pointer hover:bg-surface-hover"
                  onClick={() => onSelect(role.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(role.name);
                    }
                  }}
                  aria-label={`View role ${role.name}`}
                >
                  <td className="px-4 py-2 font-medium text-text-primary">{role.name}</td>
                  <td className="px-4 py-2 text-text-secondary">{role.description || '—'}</td>
                  <td className="px-4 py-2 text-text-secondary">{role.memberCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


/* ── Create Role Form ───────────────────────────────────────────────── */

function CreateRoleForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { showToast } = useToastContext();
  const createRole = useCreateRole();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setFormError(null);
    setFieldErrors({});
    createRole.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          showToast({ message: 'Role created', status: 'success' });
          onClose();
        },
        onError: (error) => {
          const parsed = parseApiError(error);
          if (parsed.status === 409) {
            setFormError(parsed.message || 'A role with that name already exists.');
          } else if (parsed.status === 422 && parsed.fieldErrors) {
            setFieldErrors(parsed.fieldErrors);
          } else {
            showToast({ message: getErrorMessage(error, 'Role'), status: 'error' });
          }
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border-light bg-surface-secondary p-4 space-y-3"
    >
      {formError && <ErrorMessage variant="inline" message={formError} />}
      <div>
        <Label htmlFor="role-name" className="mb-1 block text-sm text-text-primary">Name</Label>
        <Input
          id="role-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Role name"
          required
          aria-label="Role name"
          aria-invalid={!!fieldErrors.name}
        />
        {fieldErrors.name && (
          <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.name}</p>
        )}
      </div>
      <div>
        <Label htmlFor="role-desc" className="mb-1 block text-sm text-text-primary">Description</Label>
        <Input
          id="role-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          aria-label="Role description"
          aria-invalid={!!fieldErrors.description}
        />
        {fieldErrors.description && (
          <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={createRole.isLoading} aria-label="Save role">
          {createRole.isLoading ? 'Creating…' : 'Create'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose} aria-label="Cancel">
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* ── Role Detail ────────────────────────────────────────────────────── */

function RoleDetail({ roleName, onBack }: { roleName: string; onBack: () => void }) {
  const { data: role, isLoading: roleLoading, error: roleError } = useAdminRole(roleName);
  const { data: members = [], isLoading: membersLoading } = useAdminRoleMembers(roleName);
  const canManage = useHasCapability('manage:roles');
  const { showToast } = useToastContext();

  const [showAddMember, setShowAddMember] = useState(false);

  const deleteRole = useDeleteRole();
  const addMember = useAddRoleMember();
  const removeMember = useRemoveRoleMember();

  const handleDelete = () => {
    deleteRole.mutate(roleName, {
      onSuccess: () => {
        showToast({ message: 'Role deleted', status: 'success' });
        onBack();
      },
      onError: (error) => {
        showToast({ message: getErrorMessage(error, 'Role'), status: 'error' });
      },
    });
  };

  const handleAddMember = (_type: string, userId: string) => {
    addMember.mutate(
      { roleName, userId },
      {
        onSuccess: () => {
          showToast({ message: 'Member added', status: 'success' });
          setShowAddMember(false);
        },
        onError: (error) => {
          showToast({ message: getErrorMessage(error, 'Member'), status: 'error' });
        },
      },
    );
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate(
      { roleName, userId },
      {
        onSuccess: () => showToast({ message: 'Member removed', status: 'success' }),
        onError: (error) => {
          showToast({ message: getErrorMessage(error, 'Member'), status: 'error' });
        },
      },
    );
  };

  if (roleLoading) {
    return <LoadingState variant="card" rows={3} />;
  }

  if (roleError && parseApiError(roleError).status === 403) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={onBack} aria-label="Back to roles">
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <ErrorMessage variant="forbidden" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={onBack} aria-label="Back to roles">
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <ErrorMessage variant="not-found" message="Role not found" onBack={onBack} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack} aria-label="Back to roles">
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Role info */}
      <div className="rounded-lg border border-border-light p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{role.name}</h2>
            <p className="text-sm text-text-secondary">{role.description || 'No description'}</p>
          </div>
          {canManage && (
            <OGDialog>
              <OGDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                  aria-label="Delete role"
                  disabled={deleteRole.isLoading}
                >
                  {deleteRole.isLoading ? 'Deleting…' : 'Delete'}
                </Button>
              </OGDialogTrigger>
              <OGDialogTemplate
                title="Delete Role"
                className="max-w-[450px]"
                main={
                  <div className="space-y-2">
                    <p className="text-sm text-text-secondary">
                      Are you sure you want to delete{' '}
                      <span className="font-medium text-text-primary">{role.name}</span>?
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      This will also remove all associated config overrides, ACL entries, and
                      grants. This action cannot be undone.
                    </p>
                  </div>
                }
                selection={{
                  selectHandler: handleDelete,
                  selectClasses: 'bg-red-600 hover:bg-red-700 dark:hover:bg-red-800 text-white',
                  selectText: 'Delete',
                }}
              />
            </OGDialog>
          )}
        </div>
      </div>

      {/* Permissions editor */}
      <div className="rounded-lg border border-border-light p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Permissions</h3>
        <PermissionsGrid role={role} canManage={canManage} />
      </div>

      {/* Members */}
      <div className="rounded-lg border border-border-light p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Members</h3>

        {showAddMember && (
          <div className="mb-3">
            <PrincipalPicker
              onSelect={handleAddMember}
              exclude={members.map((m) => ({ type: 'user' as const, id: m.userId }))}
            />
          </div>
        )}

        {membersLoading ? (
          <LoadingState variant="inline" />
        ) : (
          <MemberList
            members={members}
            onRemove={handleRemoveMember}
            canManage={canManage}
            onAddClick={() => setShowAddMember((v) => !v)}
          />
        )}
      </div>
    </div>
  );
}

/* ── Permissions Grid ───────────────────────────────────────────────── */

function PermissionsGrid({ role, canManage }: { role: AdminRoleDetail; canManage: boolean }) {
  const { showToast } = useToastContext();
  const updatePermissions = useUpdateRolePermissions();

  // Full permission schema — all resource types with their available permission keys
  const PERMISSION_SCHEMA: Record<string, string[]> = {
    BOOKMARKS: ['USE'],
    PROMPTS: ['USE', 'CREATE', 'SHARE', 'SHARE_PUBLIC'],
    MEMORIES: ['USE', 'CREATE', 'UPDATE', 'READ', 'OPT_OUT'],
    AGENTS: ['USE', 'CREATE', 'SHARE', 'SHARE_PUBLIC'],
    MULTI_CONVO: ['USE'],
    TEMPORARY_CHAT: ['USE'],
    RUN_CODE: ['USE'],
    WEB_SEARCH: ['USE'],
    PEOPLE_PICKER: ['VIEW_USERS', 'VIEW_GROUPS', 'VIEW_ROLES'],
    MARKETPLACE: ['USE'],
    FILE_SEARCH: ['USE'],
    FILE_CITATIONS: ['USE'],
    MCP_SERVERS: ['USE', 'CREATE', 'SHARE', 'SHARE_PUBLIC'],
    REMOTE_AGENTS: ['USE', 'CREATE', 'SHARE', 'SHARE_PUBLIC'],
  };

  const resources = Object.keys(PERMISSION_SCHEMA);
  const allPermKeys = Array.from(
    new Set(resources.flatMap((r) => PERMISSION_SCHEMA[r])),
  );

  // Merge existing role permissions with the full schema (default false for missing)
  const [localPerms, setLocalPerms] = useState<Record<string, Record<string, boolean>>>(() => {
    const merged: Record<string, Record<string, boolean>> = {};
    for (const resource of resources) {
      merged[resource] = {};
      for (const perm of PERMISSION_SCHEMA[resource]) {
        merged[resource][perm] = role.permissions?.[resource]?.[perm] ?? false;
      }
    }
    return merged;
  });

  const handleToggle = (resource: string, perm: string, checked: boolean) => {
    setLocalPerms((prev) => ({
      ...prev,
      [resource]: { ...prev[resource], [perm]: checked },
    }));
  };

  const handleSave = () => {
    updatePermissions.mutate(
      { name: role.name, permissions: localPerms },
      {
        onSuccess: () => showToast({ message: 'Permissions updated', status: 'success' }),
        onError: (error) => {
          showToast({ message: getErrorMessage(error, 'Permissions'), status: 'error' });
        },
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-3 py-1.5 text-xs font-medium text-text-secondary">Resource</th>
              {allPermKeys.map((perm) => (
                <th key={perm} className="px-3 py-1.5 text-center text-xs font-medium text-text-secondary">
                  {perm}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {resources.map((resource) => (
              <tr key={resource}>
                <td className="px-3 py-1.5 font-medium text-text-primary">{resource}</td>
                {allPermKeys.map((perm) => {
                  const applicable = PERMISSION_SCHEMA[resource]?.includes(perm);
                  if (!applicable) {
                    return <td key={perm} className="px-3 py-1.5 text-center text-text-secondary">—</td>;
                  }
                  return (
                    <td key={perm} className="px-3 py-1.5 text-center">
                      <Checkbox
                        checked={localPerms[resource]?.[perm] ?? false}
                        disabled={!canManage}
                        onCheckedChange={(v) => handleToggle(resource, perm, v === true)}
                        aria-label={`${resource} ${perm}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canManage && (
        <Button
          size="sm"
          onClick={handleSave}
          disabled={updatePermissions.isLoading}
          aria-label="Save permissions"
        >
          <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {updatePermissions.isLoading ? 'Saving…' : 'Save Permissions'}
        </Button>
      )}
    </div>
  );
}
