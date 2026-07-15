import { logger } from '@librechat/data-schemas';
import type { AdminUsersStatsResponse } from '@librechat/data-schemas';
import type { ServerRequest } from '~/types/http';
import type { Response } from 'express';

export interface AdminUserStatsDeps {
  getAdminUsersStats: (resourceCreatedAtRange?: {
    $gte?: Date;
    $lte?: Date;
  }) => Promise<AdminUsersStatsResponse['stats']>;
}
const STATS_SLASH_DATETIME = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

function firstQueryString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  return undefined;
}

function parseStatsDateQueryValue(raw: string | undefined): Date | undefined | 'invalid' {
  if (raw == null) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parts = STATS_SLASH_DATETIME.exec(trimmed);
  if (parts) {
    const y = Number(parts[1]);
    const monthIndex = Number(parts[2]) - 1;
    const day = Number(parts[3]);
    const hour = Number(parts[4]);
    const minute = Number(parts[5]);
    const second = Number(parts[6]);
    if (
      parts[2].length !== 2 ||
      parts[3].length !== 2 ||
      parts[4].length !== 2 ||
      parts[5].length !== 2 ||
      parts[6].length !== 2 ||
      Number.isNaN(y) ||
      monthIndex < 0 ||
      monthIndex > 11 ||
      day < 1 ||
      day > 31 ||
      hour > 23 ||
      minute > 59 ||
      second > 59
    ) {
      return 'invalid';
    }
    const local = new Date(y, monthIndex, day, hour, minute, second);
    if (
      local.getFullYear() !== y ||
      local.getMonth() !== monthIndex ||
      local.getDate() !== day
    ) {
      return 'invalid';
    }
    return local;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return 'invalid';
  }
  return parsed;
}

function createGetUsersStatsHandler(deps: AdminUserStatsDeps) {
  const { getAdminUsersStats } = deps;

  return   async function getUsersStatsHandler(req: ServerRequest, res: Response) {
    try {
      const startRaw = firstQueryString(req.query.startDate);
      const endRaw = firstQueryString(req.query.endDate);
      const startParsed = parseStatsDateQueryValue(startRaw);
      const endParsed = parseStatsDateQueryValue(endRaw);

      if (startParsed === 'invalid') {
        return res.status(400).json({
          error:
            'Invalid startDate: use YYYY/MM/DD HH:mm:ss (e.g. 2026/04/15 00:00:00) or ISO 8601',
        });
      }
      if (endParsed === 'invalid') {
        return res.status(400).json({
          error:
            'Invalid endDate: use YYYY/MM/DD HH:mm:ss (e.g. 2026/04/16 23:59:59) or ISO 8601',
        });
      }

      if (startParsed && endParsed && startParsed.getTime() > endParsed.getTime()) {
        return res.status(400).json({ error: 'startDate must be before or equal to endDate' });
      }

      const resourceCreatedAtRange =
        startParsed != null || endParsed != null
          ? {
              ...(startParsed != null ? { $gte: startParsed } : {}),
              ...(endParsed != null ? { $lte: endParsed } : {}),
            }
          : undefined;

      const stats = await getAdminUsersStats(resourceCreatedAtRange);

      const body: AdminUsersStatsResponse = {
        stats,
        filters: {
          ...(startParsed != null ? { startDate: startParsed.toISOString() } : {}),
          ...(endParsed != null ? { endDate: endParsed.toISOString() } : {}),
        },
      };

      return res.status(200).json(body);
    } catch (error) {
      logger.error('[adminUsers] getUsersStats error:', error);
      return res.status(500).json({ error: 'Failed to load user stats' });
    }
  };
}

export function createAdminUserStatsHandlers(deps: AdminUserStatsDeps) {
  return {
    getUsersStats: createGetUsersStatsHandler(deps),
  };
}
