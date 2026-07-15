import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ADMIN_QUERY_KEYS } from '../constants';
import { groupsApi } from '../api';
import type { AdminGroup } from '../types';

/* ── Queries ────────────────────────────────────────────────────────── */

export function useAdminGroups() {
  return useQuery(ADMIN_QUERY_KEYS.groups, () => groupsApi.listGroups(), {
    refetchOnWindowFocus: false,
  });
}

export function useAdminGroup(id: string) {
  return useQuery(ADMIN_QUERY_KEYS.group(id), () => groupsApi.getGroup(id), {
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

export function useAdminGroupMembers(id: string) {
  return useQuery(ADMIN_QUERY_KEYS.groupMembers(id), () => groupsApi.getGroupMembers(id), {
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

/* ── Mutations ──────────────────────────────────────────────────────── */

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation(
    (data: { name: string; description?: string }) => groupsApi.createGroup(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.groups);
      },
    },
  );
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      groupsApi.updateGroup(id, data),
    {
      onSuccess: (_result, { id }) => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.groups);
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.group(id));
      },
    },
  );
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation((id: string) => groupsApi.deleteGroup(id), {
    onMutate: async (id) => {
      await queryClient.cancelQueries(ADMIN_QUERY_KEYS.groups);
      const previous = queryClient.getQueryData<AdminGroup[]>(ADMIN_QUERY_KEYS.groups);
      queryClient.setQueryData<AdminGroup[]>(ADMIN_QUERY_KEYS.groups, (old) =>
        old?.filter((g) => g.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ADMIN_QUERY_KEYS.groups, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(ADMIN_QUERY_KEYS.groups);
    },
  });
}

export function useAddGroupMember() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupsApi.addGroupMember(groupId, userId),
    {
      onSuccess: (_data, { groupId }) => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.groupMembers(groupId));
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.group(groupId));
      },
    },
  );
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupsApi.removeGroupMember(groupId, userId),
    {
      onSuccess: (_data, { groupId }) => {
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.groupMembers(groupId));
        queryClient.invalidateQueries(ADMIN_QUERY_KEYS.group(groupId));
      },
    },
  );
}
