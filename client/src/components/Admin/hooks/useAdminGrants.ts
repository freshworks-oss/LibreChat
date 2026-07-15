import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ADMIN_QUERY_KEYS } from '../constants';
import { grantsApi } from '../api';
import type { AdminSystemGrant, AssignGrantRequest } from '../types';

/* ── Queries ────────────────────────────────────────────────────────── */

export function useAdminGrants() {
  return useQuery(ADMIN_QUERY_KEYS.grants, () => grantsApi.listGrants(), {
    refetchOnWindowFocus: false,
  });
}

export function usePrincipalGrants(principalType: string, principalId: string) {
  return useQuery(
    ADMIN_QUERY_KEYS.principalGrants(principalType, principalId),
    () => grantsApi.getPrincipalGrants(principalType, principalId),
    {
      enabled: !!principalType && !!principalId,
      refetchOnWindowFocus: false,
    },
  );
}

/* ── Mutations ──────────────────────────────────────────────────────── */

export function useAssignGrant() {
  const queryClient = useQueryClient();
  return useMutation((data: AssignGrantRequest) => grantsApi.assignGrant(data), {
    onSuccess: (_result, { principalType, principalId }) => {
      queryClient.invalidateQueries(ADMIN_QUERY_KEYS.grants);
      queryClient.invalidateQueries(
        ADMIN_QUERY_KEYS.principalGrants(principalType, principalId),
      );
    },
  });
}

export function useRevokeGrant() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ principalType, principalId, capability }: {
      principalType: string;
      principalId: string;
      capability: string;
    }) => grantsApi.revokeGrant(principalType, principalId, capability),
    {
      onMutate: async ({ principalType, principalId, capability }) => {
        await queryClient.cancelQueries(ADMIN_QUERY_KEYS.grants);
        const previous = queryClient.getQueryData<AdminSystemGrant[]>(ADMIN_QUERY_KEYS.grants);
        queryClient.setQueryData<AdminSystemGrant[]>(ADMIN_QUERY_KEYS.grants, (old) =>
          old?.filter(
            (g) =>
              !(
                g.principalType === principalType &&
                g.principalId === principalId &&
                g.capability === capability
              ),
          ),
        );
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(ADMIN_QUERY_KEYS.grants, context.previous);
        }
      },
      onSettled: (_data, _err, { principalType, principalId }) => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.grants);
        queryClient.invalidateQueries(
          ADMIN_QUERY_KEYS.principalGrants(principalType, principalId),
        );
      },
    },
  );
}
