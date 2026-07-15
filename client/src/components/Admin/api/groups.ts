import axios from 'axios';
import type { AdminGroupDetail, AdminMember } from '../types';

const BASE = '/api/admin/groups';

/** Raw group shape returned by the backend (Mongoose lean documents). */
type RawGroup = {
  _id: string;
  name: string;
  description?: string;
  email?: string;
  avatar?: string;
  memberIds?: string[];
  source: 'local' | 'entra';
  idOnTheSource?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function mapGroup(raw: RawGroup): AdminGroupDetail {
  return {
    id: raw._id,
    name: raw.name,
    description: raw.description ?? '',
    memberCount: raw.memberIds?.length ?? 0,
    topMembers: [],
    isActive: raw.isActive ?? true,
    source: raw.source ?? 'local',
    memberIds: raw.memberIds ?? [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export async function listGroups(): Promise<AdminGroupDetail[]> {
  const { data } = await axios.get<{ groups: RawGroup[] }>(BASE);
  return (data.groups ?? []).map(mapGroup);
}

export async function getGroup(id: string): Promise<AdminGroupDetail> {
  const { data } = await axios.get<{ group: RawGroup }>(`${BASE}/${id}`);
  return mapGroup(data.group);
}

export async function createGroup(body: {
  name: string;
  description?: string;
}): Promise<AdminGroupDetail> {
  const { data } = await axios.post<{ group: RawGroup }>(BASE, body);
  return mapGroup(data.group);
}

export async function updateGroup(
  id: string,
  body: { name?: string; description?: string },
): Promise<AdminGroupDetail> {
  const { data } = await axios.patch<{ group: RawGroup }>(`${BASE}/${id}`, body);
  return mapGroup(data.group);
}

export async function deleteGroup(id: string): Promise<void> {
  await axios.delete(`${BASE}/${id}`);
}

export async function getGroupMembers(id: string): Promise<AdminMember[]> {
  const { data } = await axios.get<{ members: AdminMember[] }>(`${BASE}/${id}/members`);
  return data.members ?? [];
}

export async function addGroupMember(groupId: string, userId: string): Promise<void> {
  await axios.post(`${BASE}/${groupId}/members`, { userId });
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await axios.delete(`${BASE}/${groupId}/members/${userId}`);
}
