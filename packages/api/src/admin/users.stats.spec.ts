import { Types } from 'mongoose';
import type { ServerRequest } from '~/types/http';
import type { Response } from 'express';
import type { AdminUserStatsDeps } from './user.stats';
import { createAdminUserStatsHandlers } from './user.stats';

jest.mock('@librechat/data-schemas', () => ({
  ...jest.requireActual('@librechat/data-schemas'),
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

function createReqRes(
  overrides: {
    params?: Record<string, string>;
    query?: Record<string, string | string[]>;
    user?: { _id?: Types.ObjectId; id?: string; role?: string; tenantId?: string };
  } = {},
) {
  const req = {
    params: overrides.params ?? {},
    query: overrides.query ?? {},
    body: {},
    user: overrides.user ?? { _id: new Types.ObjectId(), role: 'admin' },
  } as unknown as ServerRequest;

  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res = { status, json } as unknown as Response;

  return { req, res, status, json };
}

function createStatsDeps(overrides: Partial<AdminUserStatsDeps> = {}): AdminUserStatsDeps {
  return {
    getAdminUsersStats: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('createAdminUserStatsHandlers', () => {
  it('returns stats and calls getAdminUsersStats with no range when no query dates', async () => {
    const statsRows = [
      { userId: 'u1', name: 'A', email: 'a@x.com', conversationsCount: 1, messagesCount: 2 },
    ];
    const getAdminUsersStats = jest.fn().mockResolvedValue(statsRows);
    const deps = createStatsDeps({ getAdminUsersStats });
    const handlers = createAdminUserStatsHandlers(deps);
    const { req, res, status, json } = createReqRes();

    await handlers.getUsersStats(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(getAdminUsersStats).toHaveBeenCalledWith(undefined);
    expect(json).toHaveBeenCalledWith({ stats: statsRows, filters: {} });
  });

  it('passes $gte and $lte when both dates are valid', async () => {
    const getAdminUsersStats = jest.fn().mockResolvedValue([]);
    const deps = createStatsDeps({ getAdminUsersStats });
    const handlers = createAdminUserStatsHandlers(deps);
    const start = '2024-01-01T00:00:00.000Z';
    const end = '2024-12-31T23:59:59.000Z';
    const { req, res } = createReqRes({ query: { startDate: start, endDate: end } });

    await handlers.getUsersStats(req, res);

    expect(getAdminUsersStats).toHaveBeenCalledWith({
      $gte: new Date(start),
      $lte: new Date(end),
    });
  });

  it('passes only $gte when startDate is provided', async () => {
    const getAdminUsersStats = jest.fn().mockResolvedValue([]);
    const deps = createStatsDeps({ getAdminUsersStats });
    const handlers = createAdminUserStatsHandlers(deps);
    const start = '2024-03-01T12:00:00.000Z';
    const { req, res } = createReqRes({ query: { startDate: start } });

    await handlers.getUsersStats(req, res);

    expect(getAdminUsersStats).toHaveBeenCalledWith({ $gte: new Date(start) });
  });

  it('passes only $lte when endDate is provided', async () => {
    const getAdminUsersStats = jest.fn().mockResolvedValue([]);
    const deps = createStatsDeps({ getAdminUsersStats });
    const handlers = createAdminUserStatsHandlers(deps);
    const end = '2024-06-15T00:00:00.000Z';
    const { req, res } = createReqRes({ query: { endDate: end } });

    await handlers.getUsersStats(req, res);

    expect(getAdminUsersStats).toHaveBeenCalledWith({ $lte: new Date(end) });
  });

  it('returns 400 for invalid startDate', async () => {
    const getAdminUsersStats = jest.fn();
    const deps = createStatsDeps({ getAdminUsersStats });
    const handlers = createAdminUserStatsHandlers(deps);
    const { req, res, status } = createReqRes({ query: { startDate: 'not-a-date' } });

    await handlers.getUsersStats(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(getAdminUsersStats).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid endDate', async () => {
    const getAdminUsersStats = jest.fn();
    const deps = createStatsDeps({ getAdminUsersStats });
    const handlers = createAdminUserStatsHandlers(deps);
    const { req, res, status } = createReqRes({ query: { endDate: 'invalid' } });

    await handlers.getUsersStats(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(getAdminUsersStats).not.toHaveBeenCalled();
  });

  it('returns 400 when startDate is after endDate', async () => {
    const deps = createStatsDeps();
    const handlers = createAdminUserStatsHandlers(deps);
    const { req, res, status } = createReqRes({
      query: { startDate: '2025-06-01T00:00:00.000Z', endDate: '2025-01-01T00:00:00.000Z' },
    });

    await handlers.getUsersStats(req, res);

    expect(status).toHaveBeenCalledWith(400);
  });
});
