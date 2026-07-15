import { useQuery } from '@tanstack/react-query';
import { ADMIN_QUERY_KEYS } from '../constants';
import { usersApi } from '../api';

/**
 * Query hook for listing admin users with cursor-based pagination.
 */
export function useAdminUsers(params: { limit?: number; cursor?: string } = {}) {
  return useQuery([...ADMIN_QUERY_KEYS.users, params] as const, () => usersApi.listUsers(params), {
    refetchOnWindowFocus: false,
  });
}

/**
 * Query hook for searching users. Only fires when the query is at least 2 characters.
 */
export function useSearchUsers(query: string) {
  return useQuery(ADMIN_QUERY_KEYS.userSearch(query), () => usersApi.searchUsers(query), {
    enabled: query.length >= 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Query hook for getting user stats.
 */
export function useAdminUsersStats(filters: { startDate?: string; endDate?: string }) {
  return useQuery(ADMIN_QUERY_KEYS.userStats(filters), () => usersApi.getUsersStats(filters), {
    refetchOnWindowFocus: false,
  });
}
