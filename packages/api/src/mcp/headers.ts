import { logger } from '@librechat/data-schemas';
import type { IUser } from '@librechat/data-schemas';

const GROUP_ID_HEADER = 'x-user-group-id';
const GROUP_NAME_HEADER = 'x-user-group-name';

type GroupHeaderUser = Partial<IUser> & { groupId?: string; groupName?: string };

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
