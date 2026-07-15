import axios from 'axios';
import type { AdminConfig, AdminConfigListResponse } from '@librechat/data-schemas';
import type { UpsertConfigRequest, FieldPatchEntry } from '../types';

const BASE = '/api/admin/config';

export async function listConfigs(): Promise<AdminConfig[]> {
  const { data } = await axios.get<{ configs: AdminConfig[] }>(BASE);
  return data.configs;
}

export async function getBaseConfig(): Promise<Record<string, unknown>> {
  const { data } = await axios.get<{ config: Record<string, unknown> }>(`${BASE}/base`);
  return data.config;
}

export async function getConfig(
  principalType: string,
  principalId: string,
): Promise<AdminConfig> {
  const { data } = await axios.get<{ config: AdminConfig }>(
    `${BASE}/${encodeURIComponent(principalType)}/${encodeURIComponent(principalId)}`,
  );
  return data.config;
}

export async function upsertConfig(
  principalType: string,
  principalId: string,
  body: UpsertConfigRequest,
): Promise<AdminConfig> {
  const { data } = await axios.put<{ config: AdminConfig }>(
    `${BASE}/${encodeURIComponent(principalType)}/${encodeURIComponent(principalId)}`,
    body,
  );
  return data.config;
}

export async function patchConfigFields(
  principalType: string,
  principalId: string,
  entries: FieldPatchEntry[],
): Promise<AdminConfig> {
  const { data } = await axios.patch<{ config: AdminConfig }>(
    `${BASE}/${encodeURIComponent(principalType)}/${encodeURIComponent(principalId)}/fields`,
    { entries },
  );
  return data.config;
}

export async function deleteConfigField(
  principalType: string,
  principalId: string,
  fieldPath: string,
): Promise<void> {
  await axios.delete(
    `${BASE}/${encodeURIComponent(principalType)}/${encodeURIComponent(principalId)}/fields?fieldPath=${encodeURIComponent(fieldPath)}`,
  );
}

export async function deleteConfig(
  principalType: string,
  principalId: string,
): Promise<void> {
  await axios.delete(
    `${BASE}/${encodeURIComponent(principalType)}/${encodeURIComponent(principalId)}`,
  );
}

export async function toggleConfigActive(
  principalType: string,
  principalId: string,
  isActive: boolean,
): Promise<AdminConfig> {
  const { data } = await axios.patch<{ config: AdminConfig }>(
    `${BASE}/${encodeURIComponent(principalType)}/${encodeURIComponent(principalId)}/active`,
    { isActive },
  );
  return data.config;
}
