import axios from 'axios';
import type { AdminUsersResponse } from '../types';
import type { AdminUserSearchResult, AdminUsersStatsResponse } from '@librechat/data-schemas';

const BASE = '/api/admin/users';

export async function listUsers(params: {
  limit?: number;
  cursor?: string;
}): Promise<AdminUsersResponse> {
  const searchParams = new URLSearchParams();
  if (params.limit != null) {
    searchParams.set('limit', String(params.limit));
  }
  if (params.cursor) {
    searchParams.set('cursor', params.cursor);
  }
  const query = searchParams.toString();
  const url = query ? `${BASE}?${query}` : BASE;
  const { data } = await axios.get<AdminUsersResponse>(url);
  return data;
}

export async function searchUsers(query: string): Promise<AdminUserSearchResult[]> {
  const { data } = await axios.get<{ users: AdminUserSearchResult[] }>(
    `${BASE}/search?q=${encodeURIComponent(query)}`,
  );
  return data.users;
}

export async function getUsersStats(
  params: {
    startDate?: string;
    endDate?: string;
  } = {},
): Promise<AdminUsersStatsResponse> {
  const searchParams = new URLSearchParams();
  if (params.startDate) {
    searchParams.set('startDate', params.startDate);
  }
  if (params.endDate) {
    searchParams.set('endDate', params.endDate);
  }
  const query = searchParams.toString();
  const url = query ? `${BASE}/stats?${query}` : `${BASE}/stats`;
  const { data } = await axios.get<AdminUsersStatsResponse>(url);
  return data;
}
