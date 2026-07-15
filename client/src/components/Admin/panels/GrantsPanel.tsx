import React, { useState, useMemo } from 'react';
import { Plus, Shield } from 'lucide-react';
import {
  Button,
  OGDialog,
  OGDialogTrigger,
  OGDialogTemplate,
  useToastContext,
} from '@librechat/client';
import {
  useAdminGrants,
  useAssignGrant,
  useRevokeGrant,
  useHasCapability,
  usePrincipalNames,
} from '../hooks';
import SearchInput from '../components/SearchInput';
import PrincipalPicker from '../components/PrincipalPicker';
import CapabilityEditor from '../components/CapabilityEditor';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import { getErrorMessage, parseApiError } from '../utils';
import type { AdminSystemGrant } from '../types';

export default function GrantsPanel() {
  const { data: grants, isLoading, error } = useAdminGrants();
  const canManage = useHasCapability('manage:grants');
  const { resolveName } = usePrincipalNames();
  const { showToast } = useToastContext();

  const [filterQuery, setFilterQuery] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);

  const revokeGrant = useRevokeGrant();

  const filteredGrants = useMemo(() => {
    if (!grants) return [];
    if (!filterQuery) return grants;
    const q = filterQuery.toLowerCase();
    return grants.filter(
      (g) =>
        g.principalType.toLowerCase().includes(q) ||
        g.principalId.toLowerCase().includes(q) ||
        g.capability.toLowerCase().includes(q),
    );
  }, [grants, filterQuery]);

  const handleRevoke = (grant: AdminSystemGrant) => {
    revokeGrant.mutate(
      {
        principalType: grant.principalType,
        principalId: grant.principalId,
        capability: grant.capability,
      },
      {
        onSuccess: () => showToast({ message: 'Grant revoked', status: 'success' }),
        onError: (err) => showToast({ message: getErrorMessage(err, 'Grant'), status: 'error' }),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Grants</h2>
        {canManage && (
          <Button
            size="sm"
            onClick={() => setShowAssignForm((v) => !v)}
            aria-label="Assign grant"
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Assign Grant
          </Button>
        )}
      </div>

      {showAssignForm && (
        <AssignGrantForm onClose={() => setShowAssignForm(false)} />
      )}

      <SearchInput
        onSearch={setFilterQuery}
        placeholder="Filter by principal or capability…"
      />

      {error && parseApiError(error).status === 403 ? (
        <ErrorMessage variant="forbidden" />
      ) : error ? (
        <ErrorMessage variant="inline" message={getErrorMessage(error, 'Grants')} />
      ) : isLoading ? (
        <LoadingState rows={5} />
      ) : filteredGrants.length === 0 ? (
        <EmptyState
          message={filterQuery ? 'No grants match your filter' : 'No grants assigned'}
          icon={Shield}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-light bg-surface-secondary">
              <tr>
                <th className="px-4 py-2 font-medium text-text-secondary">Principal Type</th>
                <th className="px-4 py-2 font-medium text-text-secondary">Principal Name</th>
                <th className="px-4 py-2 font-medium text-text-secondary">Capability</th>
                <th className="px-4 py-2 font-medium text-text-secondary">Granted</th>
                {canManage && <th className="w-24 px-4 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filteredGrants.map((grant) => (
                <tr key={`${grant.principalType}-${grant.principalId}-${grant.capability}`}>
                  <td className="px-4 py-2">
                    <span className="inline-flex rounded-full bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-text-primary">
                      {grant.principalType}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-medium text-text-primary">
                    {resolveName(grant.principalType, grant.principalId)}
                    {resolveName(grant.principalType, grant.principalId) !== grant.principalId && (
                      <span className="ml-1.5 text-xs text-text-secondary">({grant.principalId})</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-text-secondary">{grant.capability}</td>
                  <td className="px-4 py-2 text-xs text-text-secondary">
                    {grant.grantedAt ? new Date(grant.grantedAt).toLocaleDateString() : '—'}
                  </td>
                  {canManage && (
                    <td className="px-4 py-2">
                      <OGDialog>
                        <OGDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                            aria-label={`Revoke ${grant.capability} from ${grant.principalId}`}
                            disabled={revokeGrant.isLoading}
                          >
                            Revoke
                          </Button>
                        </OGDialogTrigger>
                        <OGDialogTemplate
                          title="Revoke Grant"
                          className="max-w-[450px]"
                          main={
                            <div className="space-y-2">
                              <p className="text-sm text-text-secondary">
                                Are you sure you want to revoke{' '}
                                <span className="font-medium text-text-primary">{grant.capability}</span>{' '}
                                from{' '}
                                <span className="font-medium text-text-primary">
                                  {grant.principalType}:{grant.principalId}
                                </span>
                                ?
                              </p>
                              <p className="text-xs text-text-secondary">
                                The principal will lose this capability immediately.
                              </p>
                            </div>
                          }
                          selection={{
                            selectHandler: () => handleRevoke(grant),
                            selectClasses:
                              'bg-red-600 hover:bg-red-700 dark:hover:bg-red-800 text-white',
                            selectText: 'Revoke',
                          }}
                        />
                      </OGDialog>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


/* ── Assign Grant Form ──────────────────────────────────────────────── */

function AssignGrantForm({ onClose }: { onClose: () => void }) {
  const { showToast } = useToastContext();
  const assignGrant = useAssignGrant();

  const [principal, setPrincipal] = useState<{
    type: 'role';
    id: string;
    name: string;
  } | null>(null);
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);

  const handleCapabilityChange = (capability: string, checked: boolean) => {
    setSelectedCapability(checked ? capability : null);
  };

  const handleAssign = () => {
    if (!principal || !selectedCapability) return;
    assignGrant.mutate(
      {
        principalType: principal.type,
        principalId: principal.id,
        capability: selectedCapability,
      },
      {
        onSuccess: () => {
          showToast({ message: 'Grant assigned', status: 'success' });
          onClose();
        },
        onError: (error) => {
          showToast({ message: getErrorMessage(error, 'Grant'), status: 'error' });
        },
      },
    );
  };

  return (
    <div className="rounded-lg border border-border-light bg-surface-secondary p-4 space-y-4">
      <h3 className="text-sm font-semibold text-text-primary">Assign Grant</h3>

      {!principal ? (
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">Select a role:</p>
          <PrincipalPicker
            allowedTypes={['role']}
            onSelect={(type, id, name) =>
              setPrincipal({ type: 'role', id, name })
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-full bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-text-primary">
              {principal.type}
            </span>
            <span className="text-sm font-medium text-text-primary">{principal.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrincipal(null)}
              aria-label="Change principal"
            >
              Change
            </Button>
          </div>

          <div>
            <p className="mb-2 text-sm text-text-secondary">Select a capability:</p>
            <CapabilityEditor
              held={selectedCapability ? [selectedCapability] : []}
              onChange={handleCapabilityChange}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAssign}
              disabled={!selectedCapability || assignGrant.isLoading}
              aria-label="Assign grant"
            >
              {assignGrant.isLoading ? 'Assigning…' : 'Assign'}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose} aria-label="Cancel">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
