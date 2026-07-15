import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ADMIN_QUERY_KEYS } from '../constants';
import { configApi } from '../api';
import type { AdminConfig, UpsertConfigRequest, FieldPatchEntry } from '../types';

/* ── Queries ────────────────────────────────────────────────────────── */

export function useAdminConfigs() {
  return useQuery(ADMIN_QUERY_KEYS.configs, () => configApi.listConfigs(), {
    refetchOnWindowFocus: false,
  });
}

export function useAdminBaseConfig() {
  return useQuery(ADMIN_QUERY_KEYS.baseConfig, () => configApi.getBaseConfig(), {
    refetchOnWindowFocus: false,
  });
}

export function useAdminConfig(principalType: string, principalId: string) {
  return useQuery(
    ADMIN_QUERY_KEYS.config(principalType, principalId),
    () => configApi.getConfig(principalType, principalId),
    {
      enabled: !!principalType && !!principalId,
      refetchOnWindowFocus: false,
    },
  );
}

/* ── Mutations ──────────────────────────────────────────────────────── */

export function useUpsertConfig() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ principalType, principalId, data }: {
      principalType: string;
      principalId: string;
      data: UpsertConfigRequest;
    }) => configApi.upsertConfig(principalType, principalId, data),
    {
      onSuccess: (_result, { principalType, principalId }) => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.configs);
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.config(principalType, principalId));
      },
    },
  );
}

export function usePatchConfigFields() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ principalType, principalId, entries }: {
      principalType: string;
      principalId: string;
      entries: FieldPatchEntry[];
    }) => configApi.patchConfigFields(principalType, principalId, entries),
    {
      onSuccess: (_result, { principalType, principalId }) => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.configs);
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.config(principalType, principalId));
      },
    },
  );
}

export function useDeleteConfigField() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ principalType, principalId, fieldPath }: {
      principalType: string;
      principalId: string;
      fieldPath: string;
    }) => configApi.deleteConfigField(principalType, principalId, fieldPath),
    {
      onSuccess: (_data, { principalType, principalId }) => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.configs);
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.config(principalType, principalId));
      },
    },
  );
}

export function useDeleteConfig() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ principalType, principalId }: { principalType: string; principalId: string }) =>
      configApi.deleteConfig(principalType, principalId),
    {
      onMutate: async ({ principalType, principalId }) => {
        await queryClient.cancelQueries(ADMIN_QUERY_KEYS.configs);
        const previous = queryClient.getQueryData<AdminConfig[]>(ADMIN_QUERY_KEYS.configs);
        queryClient.setQueryData<AdminConfig[]>(ADMIN_QUERY_KEYS.configs, (old) => {
          if (!old) {
            return old;
          }
          return old.filter(
            (c) => !(c.principalType === principalType && c.principalId === principalId),
          );
        });
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(ADMIN_QUERY_KEYS.configs, context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.configs);
      },
    },
  );
}

export function useToggleConfigActive() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ principalType, principalId, isActive }: {
      principalType: string;
      principalId: string;
      isActive: boolean;
    }) => configApi.toggleConfigActive(principalType, principalId, isActive),
    {
      onMutate: async ({ principalType, principalId, isActive }) => {
        const configKey = ADMIN_QUERY_KEYS.config(principalType, principalId);
        await queryClient.cancelQueries(configKey);
        const previous = queryClient.getQueryData<AdminConfig>(configKey);
        if (previous) {
          queryClient.setQueryData<AdminConfig>(configKey, { ...previous, isActive });
        }
        return { previous, configKey };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous && context.configKey) {
          queryClient.setQueryData(context.configKey, context.previous);
        }
      },
      onSettled: (_data, _err, { principalType, principalId }) => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.configs);
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.config(principalType, principalId));
      },
    },
  );
}
