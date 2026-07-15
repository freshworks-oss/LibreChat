import React, { useState } from 'react';
import { Plus, ArrowLeft, Eye, Settings } from 'lucide-react';
import {
  Button,
  Switch,
  OGDialog,
  OGDialogTrigger,
  OGDialogTemplate,
  useToastContext,
} from '@librechat/client';
import {
  useAdminConfigs,
  useAdminBaseConfig,
  useUpsertConfig,
  useDeleteConfig,
  useToggleConfigActive,
  useHasCapability,
  usePrincipalNames,
} from '../hooks';
import ConfigEditor from '../components/ConfigEditor';
import PrincipalPicker from '../components/PrincipalPicker';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import { getErrorMessage, parseApiError } from '../utils';
import type { AdminConfig, UpsertConfigRequest } from '../types';

type ViewMode = 'list' | 'detail' | 'create' | 'base';

export default function ConfigOverridesPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedConfig, setSelectedConfig] = useState<AdminConfig | null>(null);
  const [createPrincipal, setCreatePrincipal] = useState<{
    type: string;
    id: string;
    name: string;
  } | null>(null);

  const canManage = useHasCapability('manage:configs');

  const goToList = () => {
    setViewMode('list');
    setSelectedConfig(null);
    setCreatePrincipal(null);
  };

  if (viewMode === 'base') {
    return <BaseConfigView onBack={goToList} />;
  }

  if (viewMode === 'detail' && selectedConfig) {
    return (
      <ConfigDetailView
        config={selectedConfig}
        onBack={goToList}
        canManage={canManage}
      />
    );
  }

  if (viewMode === 'create') {
    return (
      <CreateConfigView
        principal={createPrincipal}
        setPrincipal={setCreatePrincipal}
        onBack={goToList}
      />
    );
  }

  return (
    <ConfigListView
      onSelectConfig={(c) => {
        setSelectedConfig(c);
        setViewMode('detail');
      }}
      onCreateNew={() => setViewMode('create')}
      onViewBase={() => setViewMode('base')}
      canManage={canManage}
    />
  );
}

/* ── Config List ────────────────────────────────────────────────────── */

function ConfigListView({
  onSelectConfig,
  onCreateNew,
  onViewBase,
  canManage,
}: {
  onSelectConfig: (c: AdminConfig) => void;
  onCreateNew: () => void;
  onViewBase: () => void;
  canManage: boolean;
}) {
  const { data, isLoading, error } = useAdminConfigs();
  const { resolveName } = usePrincipalNames();
  const toggleActive = useToggleConfigActive();
  const { showToast } = useToastContext();

  const configs = data ?? [];

  const handleToggle = (config: AdminConfig, isActive: boolean) => {
    toggleActive.mutate(
      { principalType: config.principalType, principalId: config.principalId, isActive },
      {
        onError: (err) => showToast({ message: getErrorMessage(err, 'Config'), status: 'error' }),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Config Overrides</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onViewBase} aria-label="View base config">
            <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Base Config
          </Button>
          {canManage && (
            <Button size="sm" onClick={onCreateNew} aria-label="Create config override">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Create Override
            </Button>
          )}
        </div>
      </div>

      {error && parseApiError(error).status === 403 ? (
        <ErrorMessage variant="forbidden" />
      ) : error ? (
        <ErrorMessage variant="inline" message={getErrorMessage(error, 'Config overrides')} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : configs.length === 0 ? (
        <EmptyState message="No config overrides" icon={Settings} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-light">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-light bg-surface-secondary">
              <tr>
                <th className="px-4 py-2 font-medium text-text-secondary">Principal Type</th>
                <th className="px-4 py-2 font-medium text-text-secondary">Principal Name</th>
                <th className="px-4 py-2 font-medium text-text-secondary">Priority</th>
                <th className="px-4 py-2 font-medium text-text-secondary">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {configs.map((config) => (
                <tr
                  key={config._id}
                  className="cursor-pointer hover:bg-surface-hover"
                  onClick={() => onSelectConfig(config)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectConfig(config);
                    }
                  }}
                  aria-label={`View config for ${config.principalType} ${config.principalId}`}
                >
                  <td className="px-4 py-2">
                    <span className="inline-flex rounded-full bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-text-primary">
                      {config.principalType}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-medium text-text-primary">
                    {resolveName(config.principalType, config.principalId)}
                    {resolveName(config.principalType, config.principalId) !== config.principalId && (
                      <span className="ml-1.5 text-xs text-text-secondary">({config.principalId})</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-text-secondary">{config.priority}</td>
                  <td className="px-4 py-2">
                    <Switch
                      checked={config.isActive}
                      onCheckedChange={(v) => handleToggle(config, v)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={toggleActive.isLoading}
                      aria-label={`Toggle active for ${config.principalId}`}
                    />
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


/* ── Config Detail ──────────────────────────────────────────────────── */

function ConfigDetailView({
  config,
  onBack,
  canManage,
}: {
  config: AdminConfig;
  onBack: () => void;
  canManage: boolean;
}) {
  const { showToast } = useToastContext();
  const { resolveName } = usePrincipalNames();
  const upsertConfig = useUpsertConfig();
  const deleteConfig = useDeleteConfig();
  const toggleActive = useToggleConfigActive();

  const handleSave = (data: UpsertConfigRequest) => {
    upsertConfig.mutate(
      { principalType: config.principalType, principalId: config.principalId, data },
      {
        onSuccess: () => {
          showToast({ message: 'Config saved', status: 'success' });
          onBack();
        },
        onError: (error) => {
          showToast({ message: getErrorMessage(error, 'Config'), status: 'error' });
        },
      },
    );
  };

  const handleToggle = (isActive: boolean) => {
    toggleActive.mutate(
      { principalType: config.principalType, principalId: config.principalId, isActive },
      {
        onError: (error) => showToast({ message: getErrorMessage(error, 'Config'), status: 'error' }),
      },
    );
  };

  const handleDelete = () => {
    deleteConfig.mutate(
      { principalType: config.principalType, principalId: config.principalId },
      {
        onSuccess: () => {
          showToast({ message: 'Config deleted', status: 'success' });
          onBack();
        },
        onError: (error) => {
          showToast({ message: getErrorMessage(error, 'Config'), status: 'error' });
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack} aria-label="Back to configs">
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <span className="text-sm text-text-secondary">
          {config.principalType} / {resolveName(config.principalType, config.principalId)}
        </span>
      </div>

      {canManage ? (
        <div className="space-y-4">
          <ConfigEditor
            config={config}
            onSave={handleSave}
            onToggleActive={handleToggle}
            onDelete={() => {}}
          />
          {/* Delete with confirmation dialog */}
          <OGDialog>
            <OGDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 dark:text-red-400"
                aria-label="Delete config override"
                disabled={deleteConfig.isLoading}
              >
                {deleteConfig.isLoading ? 'Deleting…' : 'Delete Config Override'}
              </Button>
            </OGDialogTrigger>
            <OGDialogTemplate
              title="Delete Config Override"
              className="max-w-[450px]"
              main={
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary">
                    Are you sure you want to delete the config override for{' '}
                    <span className="font-medium text-text-primary">
                      {config.principalType}:{resolveName(config.principalType, config.principalId)}
                    </span>
                    ?
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    This action cannot be undone.
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
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">
            Priority: {config.priority} · {config.isActive ? 'Active' : 'Inactive'}
          </p>
          <pre className="rounded-lg border border-border-light bg-surface-secondary p-3 text-xs text-text-primary overflow-auto">
            {JSON.stringify(config.overrides, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ── Create Config ──────────────────────────────────────────────────── */

function CreateConfigView({
  principal,
  setPrincipal,
  onBack,
}: {
  principal: { type: string; id: string; name: string } | null;
  setPrincipal: (p: { type: string; id: string; name: string } | null) => void;
  onBack: () => void;
}) {
  const { showToast } = useToastContext();
  const upsertConfig = useUpsertConfig();

  const handleSave = (data: UpsertConfigRequest) => {
    if (!principal) return;
    upsertConfig.mutate(
      { principalType: principal.type, principalId: principal.id, data },
      {
        onSuccess: () => {
          showToast({ message: 'Config override created', status: 'success' });
          onBack();
        },
        onError: (error) => {
          showToast({ message: getErrorMessage(error, 'Config'), status: 'error' });
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack} aria-label="Back to configs">
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <span className="text-sm text-text-secondary">Create Config Override</span>
      </div>

      {!principal ? (
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">Select a principal to create a config override for:</p>
          <PrincipalPicker
            onSelect={(type, id, name) => setPrincipal({ type, id, name })}
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
          <ConfigEditor
            config={null}
            onSave={handleSave}
            onToggleActive={() => {}}
            onDelete={() => {}}
          />
        </div>
      )}
    </div>
  );
}

/* ── Base Config View ───────────────────────────────────────────────── */

function BaseConfigView({ onBack }: { onBack: () => void }) {
  const { data: baseConfig, isLoading, error } = useAdminBaseConfig();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack} aria-label="Back to configs">
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <span className="text-sm text-text-secondary">Base Configuration (read-only)</span>
      </div>

      {error && parseApiError(error).status === 403 ? (
        <ErrorMessage variant="forbidden" />
      ) : error ? (
        <ErrorMessage variant="inline" message={getErrorMessage(error, 'Base config')} />
      ) : isLoading ? (
        <LoadingState variant="card" rows={3} />
      ) : baseConfig ? (
        <pre className="max-h-[75vh] overflow-auto rounded-lg border border-border-light bg-surface-secondary p-4 font-mono text-xs text-text-primary whitespace-pre-wrap break-words">
          {JSON.stringify(baseConfig, null, 2)}
        </pre>
      ) : (
        <EmptyState message="No base config available" icon={Settings} />
      )}
    </div>
  );
}
