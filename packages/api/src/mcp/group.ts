import mongoose from 'mongoose';
import { logger, runAsSystem } from '@librechat/data-schemas';
import type { Model } from 'mongoose';
import type { IGroup, IUser } from '@librechat/data-schemas';
import type { IUserGroup } from './types';

async function loadGroupContext(userId: string): Promise<{ groupId: string; groupName: string }> {
  try {
    const connection = mongoose.connections.find((conn: { readyState: number }) => conn.readyState === 1);
    if (!connection) {
      logger.warn(`[MCP][groups] no active mongoose connection for user ${userId}`);
      return { groupId: '', groupName: '' };
    }

    const User = connection.models.User as Model<IUser>;
    const Group = connection.models.Group as Model<IGroup>;
    if (!User || !Group) {
      logger.warn(`[MCP][groups] missing User/Group model on active connection for user ${userId}`);
      return { groupId: '', groupName: '' };
    }

    const user = await runAsSystem(async () =>
      User.findById(userId, { idOnTheSource: 1 }).lean<{ idOnTheSource?: string } | null>(),
    );
    if (!user) {
      logger.debug('[MCP][groups] user not found while resolving groups', { userId });
      return { groupId: '', groupName: '' };
    }

    const memberId = user.idOnTheSource || userId;
    const groups = await runAsSystem(async () =>
      Group.find({ memberIds: memberId }, { _id: 1, name: 1 }).lean<IGroup[]>(),
    );
    const groupId = groups.map((group: IGroup) => String(group._id)).join(',');
    const groupName = groups.map((group: IGroup) => group.name).filter(Boolean).join(',');
    logger.debug('[MCP][groups] resolved group context for user', {
      userId,
      memberId,
      groupCount: groups.length,
      groupIdLen: groupId.length,
      groupNameLen: groupName.length,
    });
    return { groupId, groupName };
  } catch (error) {
    logger.warn(`[MCP] Failed to resolve group context for user ${userId}`, error);
    return { groupId: '', groupName: '' };
  }
}

export type { IUserGroup };

export async function enrichUserForMcpGroups(
  user?: IUser | IUserGroup,
): Promise<IUserGroup | undefined> {
  if (!user?.id) {
    return user === undefined ? undefined : { ...user };
  }

  const { groupId, groupName } = await loadGroupContext(user.id);
  return { ...user, groupId, groupName };
}
