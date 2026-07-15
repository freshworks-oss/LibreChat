import axios from 'axios';
import type { AdminRoleDetail } from '../types';
import type { AdminMember } from '@librechat/data-schemas';

const BASE = '/api/admin/roles';

/** Raw role shape returned by the backend (Mongoose lean documents). */
type RawRole = {
  _id?: string;
  name: string;
  description?: string;
  permissions?: Record<string, Record<string, boolean>>;
  tenantId?: string;
};

function mapRoleListItem(raw: RawRole): { name: string; description?: string; memberCount: number } {
  return {
    name: raw.name,
    description: raw.description,
    memberCount: 0, // not returned by list endpoint
  };
}

function mapRoleDetail(raw: RawRole): AdminRoleDetail {
  return {
    name: raw.name,
    description: raw.description,
    permissions: raw.permissions ?? {},
  };
}

export async function listRoles(): Promise<{ name: string; description?: string; memberCount: number }[]> {
  const { data } = await axios.get<{ roles: RawRole[] }>(BASE);
  return (data.roles ?? []).map(mapRoleListItem);
}

export async function getRole(name: string): Promise<AdminRoleDetail> {
  const { data } = await axios.get<{ role: RawRole }>(`${BASE}/${encodeURIComponent(name)}`);
  return mapRoleDetail(data.role);
}

export async function createRole(body: {
  name: string;
  description?: string;
}): Promise<AdminRoleDetail> {
  const { data } = await axios.post<{ role: RawRole }>(BASE, body);
  return mapRoleDetail(data.role);
}

export async function updateRole(
  name: string,
  body: { name?: string; description?: string },
): Promise<AdminRoleDetail> {
  const { data } = await axios.patch<{ role: RawRole }>(
    `${BASE}/${encodeURIComponent(name)}`,
    body,
  );
  return mapRoleDetail(data.role);
}

export async function deleteRole(name: string): Promise<void> {
  await axios.delete(`${BASE}/${encodeURIComponent(name)}`);
}

export async function updateRolePermissions(
  name: string,
  permissions: Record<string, Record<string, boolean>>,
): Promise<void> {
  await axios.patch(`${BASE}/${encodeURIComponent(name)}/permissions`, { permissions });
}

export async function getRoleMembers(name: string): Promise<AdminMember[]> {
  const { data } = await axios.get<{ members: AdminMember[] }>(
    `${BASE}/${encodeURIComponent(name)}/members`,
  );
  return data.members ?? [];
}

export async function addRoleMember(roleName: string, userId: string): Promise<void> {
  await axios.post(`${BASE}/${encodeURIComponent(roleName)}/members`, { userId });
}

export async function removeRoleMember(roleName: string, userId: string): Promise<void> {
  await axios.delete(`${BASE}/${encodeURIComponent(roleName)}/members/${userId}`);
}
