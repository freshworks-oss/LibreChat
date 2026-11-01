import { logger } from '@librechat/data-schemas';
import type { IUser } from '@librechat/data-schemas';
import type { MCPOptions } from 'librechat-data-provider';

const GROUP_ID_HEADER = 'x-user-group-id';
const GROUP_NAME_HEADER = 'x-user-group-name';

type GroupHeaderUser = Partial<IUser> & { groupId?: string; groupName?: string };

type ApiKeyConfig = Partial<NonNullable<MCPOptions['apiKey']>> | null | undefined;

/** Injects mandatory Freshworks group headers for MCP upstream routing. */
export function injectMandatoryGroupHeaders(
  headers: Record<string, string> | undefined,
  user?: GroupHeaderUser,
): Record<string, string> | undefined {
  const groupId =
    typeof user?.groupId === 'string' && user.groupId.trim().length > 0 ? user.groupId.trim() : '';
  const groupName =
    typeof user?.groupName === 'string' && user.groupName.trim().length > 0
      ? user.groupName.trim()
      : '';

  if (!groupId && !groupName) {
    return headers;
  }

  const merged = { ...(headers ?? {}) };
  if (groupId) {
    merged[GROUP_ID_HEADER] = groupId;
  }
  if (groupName) {
    merged[GROUP_NAME_HEADER] = groupName;
  }

  logger.debug('[MCP][headers] injected mandatory group headers', {
    userId: user?.id ?? null,
    groupIdLen: groupId.length,
    groupNameLen: groupName.length,
    headerNames: Object.keys(merged).sort(),
  });

  return merged;
}

/** Recognizes only server-generated API key fields, not similarly named explicit variables. */
export function isGeneratedUserApiKeyVariable(name: string): boolean {
  return /^MCP_API_KEY(?:_[a-f0-9]{64})?$/.test(name);
}

function getApiKeyHeaderName(apiKey: ApiKeyConfig): string {
  return apiKey?.authorization_type === 'custom'
    ? apiKey.custom_header || 'X-Api-Key'
    : 'Authorization';
}

/** The header injected by an operator-provided API key, before placeholder resolution. */
export function getAdminApiKeyHeader(
  apiKey: ApiKeyConfig,
): { name: string; value: string } | undefined {
  if (apiKey?.source !== 'admin' || !apiKey.key) {
    return;
  }
  const { key, authorization_type } = apiKey;
  const name = getApiKeyHeaderName(apiKey);
  const prefixes = { basic: 'Basic ', bearer: 'Bearer ', custom: '' };
  const prefix = prefixes[authorization_type ?? 'custom'];
  return { name, value: `${prefix}${key}` };
}

/** A shadowed catalog credential must not be injected or required by a chat connection. */
export function isApiKeyHeaderOverridden(
  apiKey: ApiKeyConfig,
  requestHeaders?: Record<string, string | undefined>,
): boolean {
  const injected = apiKey?.source === 'user' || getAdminApiKeyHeader(apiKey) != null;
  return (
    injected &&
    requestHeaders != null &&
    Object.keys(requestHeaders).some(
      (name) => name.toLowerCase() === getApiKeyHeaderName(apiKey).toLowerCase(),
    )
  );
}
