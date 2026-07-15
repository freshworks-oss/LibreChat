import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ADMIN_QUERY_KEYS } from '../constants';
import { rolesApi } from '../api';
import type { AdminRoleListItem } from '../types';

/* ── Queries ────────────────────────────────────────────────────────── */

export function useAdminRoles() {
  return useQuery(ADMIN_QUERY_KEYS.roles, () => rolesApi.listRoles(), {
    refetchOnWindowFocus: false,
  });
}

export function useAdminRole(name: string) {
  return useQuery(ADMIN_QUERY_KEYS.role(name), () => rolesApi.getRole(name), {
    enabled: !!name,
    refetchOnWindowFocus: false,
  });
}

export function useAdminRoleMembers(name: string) {
  return useQuery(ADMIN_QUERY_KEYS.roleMembers(name), () => rolesApi.getRoleMembers(name), {
    enabled: !!name,
    refetchOnWindowFocus: false,
  });
}

/* ── Mutations ──────────────────────────────────────────────────────── */

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation(
    (data: { name: string; description?: string }) => rolesApi.createRole(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.roles);
      },
    },
  );
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ name, data }: { name: string; data: { name?: string; description?: string } }) =>
      rolesApi.updateRole(name, data),
    {
      onSuccess: (_result, { name }) => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.roles);
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.role(name));
      },
    },
  );
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation((name: string) => rolesApi.deleteRole(name), {
    onMutate: async (name) => {
      await queryClient.cancelQueries(ADMIN_QUERY_KEYS.roles);
      const previous = queryClient.getQueryData<AdminRoleListItem[]>(ADMIN_QUERY_KEYS.roles);
      queryClient.setQueryData<AdminRoleListItem[]>(ADMIN_QUERY_KEYS.roles, (old) =>
        old?.filter((r) => r.name !== name),
      );
      return { previous };
    },
    onError: (_err, _name, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ADMIN_QUERY_KEYS.roles, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(ADMIN_QUERY_KEYS.roles);
    },
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ name, permissions }: { name: string; permissions: Record<string, Record<string, boolean>> }) =>
      rolesApi.updateRolePermissions(name, permissions),
    {
      onSuccess: (_data, { name }) => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.role(name));
      },
    },
  );
}

export function useAddRoleMember() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ roleName, userId }: { roleName: string; userId: string }) =>
      rolesApi.addRoleMember(roleName, userId),
    {
      onSuccess: (_data, { roleName }) => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.roleMembers(roleName));
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.roles);
      },
    },
  );
}

export function useRemoveRoleMember() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ roleName, userId }: { roleName: string; userId: string }) =>
      rolesApi.removeRoleMember(roleName, userId),
    {
      onSuccess: (_data, { roleName }) => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.roleMembers(roleName));
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.roles);
      },
    },
  );
}
