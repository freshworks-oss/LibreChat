import axios from 'axios';
import type { AdminSystemGrant } from '@librechat/data-schemas';
import type { AssignGrantRequest } from '../types';

const BASE = '/api/admin/grants';

/** Raw grant shape returned by the backend (Mongoose lean documents). */
type RawGrant = {
  _id?: string;
  id?: string;
  principalType: string;
  principalId: string;
  capability: string;
  grantedBy?: string;
  grantedAt?: string | Date;
  expiresAt?: string | Date;
};

function mapGrant(raw: RawGrant): AdminSystemGrant {
  return {
    id: raw.id ?? raw._id ?? '',
    principalType: raw.principalType as AdminSystemGrant['principalType'],
    principalId: String(raw.principalId),
    capability: raw.capability,
    grantedBy: raw.grantedBy ? String(raw.grantedBy) : undefined,
    grantedAt: raw.grantedAt ? String(raw.grantedAt) : '',
    expiresAt: raw.expiresAt ? String(raw.expiresAt) : undefined,
  };
}

export async function listGrants(): Promise<AdminSystemGrant[]> {
  const { data } = await axios.get<{ grants: RawGrant[] }>(BASE);
  return (data.grants ?? []).map(mapGrant);
}

export async function getEffectiveCapabilities(): Promise<{ capabilities: string[] }> {
  const { data } = await axios.get<{ capabilities: string[] }>(`${BASE}/effective`);
  return data;
}

export async function getPrincipalGrants(
  principalType: string,
  principalId: string,
): Promise<AdminSystemGrant[]> {
  const { data } = await axios.get<{ grants: RawGrant[] }>(
    `${BASE}/${encodeURIComponent(principalType)}/${encodeURIComponent(principalId)}`,
  );
  return (data.grants ?? []).map(mapGrant);
}

export async function assignGrant(body: AssignGrantRequest): Promise<AdminSystemGrant> {
  const { data } = await axios.post<{ grant: RawGrant }>(BASE, body);
  return mapGrant(data.grant);
}

export async function revokeGrant(
  principalType: string,
  principalId: string,
  capability: string,
): Promise<void> {
  await axios.delete(
    `${BASE}/${encodeURIComponent(principalType)}/${encodeURIComponent(principalId)}/${encodeURIComponent(capability)}`,
  );
}
