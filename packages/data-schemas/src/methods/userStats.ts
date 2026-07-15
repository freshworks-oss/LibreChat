import type { Model, PipelineStage } from 'mongoose';
import type { AdminUserStatsRow } from '~/types/admin';
import type { IUser } from '~/types';

type ResourceCreatedAtRange = { $gte?: Date; $lte?: Date };

function hasResourceCreatedAtRange(range?: ResourceCreatedAtRange): range is ResourceCreatedAtRange {
  return range != null && (range.$gte != null || range.$lte != null);
}

export function createUserStatsMethods(mongoose: typeof import('mongoose')) {
  /**
   * User stats: all users with conversation and message counts.
   * When `resourceCreatedAtRange` is set, counts only conversations/messages whose `createdAt` falls in range.
   */
  async function getAdminUsersStats(
    resourceCreatedAtRange?: ResourceCreatedAtRange,
  ): Promise<AdminUserStatsRow[]> {
    const User = mongoose.models.User as Model<IUser>;
    const Conversation = mongoose.models.Conversation;
    const Message = mongoose.models.Message;

    type UserStatsDoc = Pick<IUser, '_id' | 'name' | 'email'>;
    const users = (await User.find({}).select('name email _id').lean()) as UserStatsDoc[];

    const matchStages: PipelineStage[] = [];
    if (hasResourceCreatedAtRange(resourceCreatedAtRange)) {
      matchStages.push({ $match: { createdAt: resourceCreatedAtRange } });
    }

    const groupStage: PipelineStage = {
      $group: { _id: '$user', count: { $sum: 1 } },
    };

    const pipeline: PipelineStage[] = [...matchStages, groupStage];

    const [convoGroups, msgGroups] = await Promise.all([
      Conversation.aggregate<{ _id: string | null; count: number }>(pipeline),
      Message.aggregate<{ _id: string | null; count: number }>(pipeline),
    ]);

    const convoByUser = new Map<string, number>();
    for (const row of convoGroups) {
      if (row._id != null && row._id !== '') {
        convoByUser.set(String(row._id), row.count);
      }
    }
    const msgByUser = new Map<string, number>();
    for (const row of msgGroups) {
      if (row._id != null && row._id !== '') {
        msgByUser.set(String(row._id), row.count);
      }
    }

    const rows: AdminUserStatsRow[] = users.map((u) => {
      const id = u._id?.toString() ?? '';
      return {
        userId: id,
        name: u.name ?? '',
        email: u.email,
        conversationsCount: convoByUser.get(id) ?? 0,
        messagesCount: msgByUser.get(id) ?? 0,
      };
    });

    rows.sort((a, b) => {
      if (a.conversationsCount !== b.conversationsCount) {
        return b.conversationsCount - a.conversationsCount;
      }
      return b.messagesCount - a.messagesCount;
    });

    return rows;
  }

  return { getAdminUsersStats };
}

export type UserStatsMethods = ReturnType<typeof createUserStatsMethods>;
