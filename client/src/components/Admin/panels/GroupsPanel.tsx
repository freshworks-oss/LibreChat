import React, { useState } from 'react';
import { Plus, ArrowLeft, Pencil, Check, X, Users } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  OGDialog,
  OGDialogTrigger,
  OGDialogTemplate,
  useToastContext,
} from '@librechat/client';
import {
  useAdminGroups,
  useAdminGroup,
  useAdminGroupMembers,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useAddGroupMember,
  useRemoveGroupMember,
  useHasCapability,
} from '../hooks';
import MemberList from '../components/MemberList';
import PrincipalPicker from '../components/PrincipalPicker';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import { getErrorMessage, parseApiError } from '../utils';

export default function GroupsPanel() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (selectedGroupId) {
    return (
      <GroupDetail
        groupId={selectedGroupId}
        onBack={() => setSelectedGroupId(null)}
      />
    );
  }

  return (
    <GroupList
      onSelect={setSelectedGroupId}
      showCreateForm={showCreateForm}
      setShowCreateForm={setShowCreateForm}
    />
  );
}

/* ── Group List ─────────────────────────────────────────────────────── */

function GroupList({
  onSelect,
  showCreateForm,
  setShowCreateForm,
}: {
  onSelect: (id: string) => void;
  showCreateForm: boolean;
  setShowCreateForm: (v: boolean) => void;
}) {
  const { data: groups, isLoading, error } = useAdminGroups();
  const canManage = useHasCapability('manage:groups');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Groups</h2>
        {canManage && !showCreateForm && (
          <Button size="sm" onClick={() => setShowCreateForm(true)} aria-label="Create group">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Create Group
          </Button>
        )}
      </div>

      {showCreateForm && (
        <CreateGroupForm onClose={() => setShowCreateForm(false)} />
      )}

      {error && parseApiError(error).status === 403 ? (
        <ErrorMessage variant="forbidden" />
      ) : error ? (
        <ErrorMessage variant="inline" message={getErrorMessage(error, 'Groups')} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : !groups || groups.length === 0 ? (
        <EmptyState message="No groups yet" icon={Users} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-light bg-surface-secondary">
              <tr>
                <th className="px-4 py-2 font-medium text-text-secondary">Name</th>
                <th className="px-4 py-2 font-medium text-text-secondary">Source</th>
                <th className="px-4 py-2 font-medium text-text-secondary">Description</th>
                <th className="px-4 py-2 font-medium text-text-secondary">Members</th>
                <th className="px-4 py-2 font-medium text-text-secondary">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {groups.map((group) => (
                <tr
                  key={group.id}
                  className="cursor-pointer hover:bg-surface-hover"
                  onClick={() => onSelect(group.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(group.id);
                    }
                  }}
                  aria-label={`View group ${group.name}`}
                >
                  <td className="px-4 py-2 font-medium text-text-primary">{group.name}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      group.source === 'entra'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {group.source === 'entra' ? 'Entra' : 'Local'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-text-secondary">{group.description || '—'}</td>
                  <td className="px-4 py-2 text-text-secondary">{group.memberCount}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        group.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {group.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


/* ── Create Group Form ──────────────────────────────────────────────── */

function CreateGroupForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState<'local' | 'entra'>('local');
  const [idOnTheSource, setIdOnTheSource] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { showToast } = useToastContext();
  const createGroup = useCreateGroup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (source === 'entra' && !idOnTheSource.trim()) {
      setFieldErrors({ idOnTheSource: 'Entra ID Object ID is required for Entra groups' });
      return;
    }
    setFormError(null);
    setFieldErrors({});
    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || undefined,
      source,
    };
    if (source === 'entra' && idOnTheSource.trim()) {
      body.idOnTheSource = idOnTheSource.trim();
    }
    createGroup.mutate(
      body as { name: string; description?: string },
      {
        onSuccess: () => {
          showToast({ message: 'Group created', status: 'success' });
          onClose();
        },
        onError: (error) => {
          const parsed = parseApiError(error);
          if (parsed.status === 409) {
            setFormError(parsed.message || 'A group with that name already exists.');
          } else if (parsed.status === 422 && parsed.fieldErrors) {
            setFieldErrors(parsed.fieldErrors);
          } else {
            showToast({ message: getErrorMessage(error, 'Group'), status: 'error' });
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
        <Label htmlFor="group-name" className="mb-1 block text-sm text-text-primary">
          Name
        </Label>
        <Input
          id="group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          required
          aria-label="Group name"
          aria-invalid={!!fieldErrors.name}
        />
        {fieldErrors.name && (
          <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.name}</p>
        )}
      </div>
      <div>
        <Label htmlFor="group-desc" className="mb-1 block text-sm text-text-primary">
          Description
        </Label>
        <Input
          id="group-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          aria-label="Group description"
          aria-invalid={!!fieldErrors.description}
        />
        {fieldErrors.description && (
          <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.description}</p>
        )}
      </div>
      <div>
        <Label htmlFor="group-source" className="mb-1 block text-sm text-text-primary">
          Source
        </Label>
        <select
          id="group-source"
          value={source}
          onChange={(e) => setSource(e.target.value as 'local' | 'entra')}
          className="w-full rounded-md border border-border-light bg-surface-primary px-3 py-2 text-sm text-text-primary"
          aria-label="Group source"
        >
          <option value="local">Local</option>
          <option value="entra">Entra ID (Azure AD)</option>
        </select>
      </div>
      {source === 'entra' && (
        <div>
          <Label htmlFor="group-entra-id" className="mb-1 block text-sm text-text-primary">
            Entra ID Object ID
          </Label>
          <Input
            id="group-entra-id"
            value={idOnTheSource}
            onChange={(e) => setIdOnTheSource(e.target.value)}
            placeholder="e.g. fd57e6ef-a334-486a-8062-57a80b254bb9"
            aria-label="Entra ID Object ID"
            aria-invalid={!!fieldErrors.idOnTheSource}
          />
          <p className="mt-1 text-xs text-text-secondary">
            The Azure AD group Object ID from Entra ID portal
          </p>
          {fieldErrors.idOnTheSource && (
            <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.idOnTheSource}</p>
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={createGroup.isLoading} aria-label="Save group">
          {createGroup.isLoading ? 'Creating…' : 'Create'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose} aria-label="Cancel">
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* ── Group Detail ───────────────────────────────────────────────────── */

function GroupDetail({ groupId, onBack }: { groupId: string; onBack: () => void }) {
  const { data: group, isLoading: groupLoading, error: groupError } = useAdminGroup(groupId);
  const { data: members = [], isLoading: membersLoading } = useAdminGroupMembers(groupId);
  const canManage = useHasCapability('manage:groups');
  const { showToast } = useToastContext();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [showAddMember, setShowAddMember] = useState(false);

  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const addMember = useAddGroupMember();
  const removeMember = useRemoveGroupMember();

  const startEdit = () => {
    if (!group) return;
    setEditName(group.name);
    setEditDesc(group.description || '');
    setEditError(null);
    setEditFieldErrors({});
    setEditing(true);
  };

  const saveEdit = () => {
    setEditError(null);
    setEditFieldErrors({});
    updateGroup.mutate(
      { id: groupId, data: { name: editName.trim(), description: editDesc.trim() } },
      {
        onSuccess: () => {
          showToast({ message: 'Group updated', status: 'success' });
          setEditing(false);
        },
        onError: (error) => {
          const parsed = parseApiError(error);
          if (parsed.status === 409) {
            setEditError(parsed.message || 'A group with that name already exists.');
          } else if (parsed.status === 422 && parsed.fieldErrors) {
            setEditFieldErrors(parsed.fieldErrors);
          } else {
            showToast({ message: getErrorMessage(error, 'Group'), status: 'error' });
          }
        },
      },
    );
  };

  const handleDelete = () => {
    deleteGroup.mutate(groupId, {
      onSuccess: () => {
        showToast({ message: 'Group deleted', status: 'success' });
        onBack();
      },
      onError: (error) => {
        showToast({ message: getErrorMessage(error, 'Group'), status: 'error' });
      },
    });
  };

  const handleAddMember = (
    _principalType: string,
    principalId: string,
    _displayName: string,
  ) => {
    addMember.mutate(
      { groupId, userId: principalId },
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
      { groupId, userId },
      {
        onSuccess: () => showToast({ message: 'Member removed', status: 'success' }),
        onError: (error) => {
          showToast({ message: getErrorMessage(error, 'Member'), status: 'error' });
        },
      },
    );
  };

  if (groupLoading) {
    return <LoadingState variant="card" rows={2} />;
  }

  if (groupError && parseApiError(groupError).status === 403) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={onBack} aria-label="Back to groups">
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <ErrorMessage variant="forbidden" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={onBack} aria-label="Back to groups">
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <ErrorMessage variant="not-found" message="Group not found" onBack={onBack} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack} aria-label="Back to groups">
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Group info */}
      <div className="rounded-lg border border-border-light p-4 space-y-3">
        {editing ? (
          <>
            {editError && <ErrorMessage variant="inline" message={editError} />}
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="text-lg font-semibold"
              aria-label="Edit group name"
              aria-invalid={!!editFieldErrors.name}
            />
            {editFieldErrors.name && (
              <p className="text-xs text-red-500" role="alert">{editFieldErrors.name}</p>
            )}
            <Input
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description"
              aria-label="Edit group description"
              aria-invalid={!!editFieldErrors.description}
            />
            {editFieldErrors.description && (
              <p className="text-xs text-red-500" role="alert">{editFieldErrors.description}</p>
            )}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={saveEdit} disabled={updateGroup.isLoading} aria-label="Save changes">
                <Check className="mr-1 h-4 w-4" aria-hidden="true" />
                {updateGroup.isLoading ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} aria-label="Cancel editing">
                <X className="mr-1 h-4 w-4" aria-hidden="true" />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">{group.name}</h2>
              <div className="flex items-center gap-2">
                {canManage && (
                  <Button variant="outline" size="sm" onClick={startEdit} aria-label="Edit group">
                    <Pencil className="mr-1 h-4 w-4" aria-hidden="true" />
                    Edit
                  </Button>
                )}
                {canManage && (
                  <OGDialog>
                    <OGDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                        aria-label="Delete group"
                        disabled={deleteGroup.isLoading}
                      >
                        {deleteGroup.isLoading ? 'Deleting…' : 'Delete'}
                      </Button>
                    </OGDialogTrigger>
                    <OGDialogTemplate
                      title="Delete Group"
                      className="max-w-[450px]"
                      main={
                        <div className="space-y-2">
                          <p className="text-sm text-text-secondary">
                            Are you sure you want to delete{' '}
                            <span className="font-medium text-text-primary">{group.name}</span>?
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
            <p className="text-sm text-text-secondary">{group.description || 'No description'}</p>
            {group.source && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${
                  group.source === 'entra'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {group.source === 'entra' ? 'Entra ID' : 'Local'}
                </span>
                {group.source === 'entra' && 'idOnTheSource' in (group as object) && (
                  <span>ID: {String((group as unknown as Record<string, string>).idOnTheSource)}</span>
                )}
              </div>
            )}
            <p className="text-xs text-text-secondary">{group.memberCount} members</p>
          </>
        )}
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
