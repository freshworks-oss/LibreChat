import { useState } from 'react';
import type { ReactNode } from 'react';
import { BarChart2 } from 'lucide-react';
import { Button } from '@librechat/client';
import { useLocalize } from '~/hooks';

import ErrorMessage from '../components/ErrorMessage';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Datepicker from '../components/datepicker';
import { useAdminUsersStats } from '../hooks';
import { getErrorMessage, parseApiError } from '../utils';

type AppliedFilters = { startDate?: string; endDate?: string };

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateInput(value: string): boolean {
  if (!DATE_INPUT_PATTERN.test(value)) {
    return false;
  }
  const [y, m, d] = value.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function toApiStartDate(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return `${y}/${m}/${d} 00:00:00`;
}

function toApiEndDate(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return `${y}/${m}/${d} 23:59:59`;
}

export default function UsersStatsView() {
  const localize = useLocalize();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applied, setApplied] = useState<AppliedFilters>({});
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading: loading, error: statsLoadError } = useAdminUsersStats(applied);

  const handleApply = () => {
    setError(null);
    const next: AppliedFilters = {};

    if (startDate.trim().length > 0) {
      if (!isValidDateInput(startDate.trim())) {
        setError(localize('com_ui_admin_users_stats_error_invalid_start'));
        return;
      }
      next.startDate = toApiStartDate(startDate.trim());
    }

    if (endDate.trim().length > 0) {
      if (!isValidDateInput(endDate.trim())) {
        setError(localize('com_ui_admin_users_stats_error_invalid_end'));
        return;
      }
      next.endDate = toApiEndDate(endDate.trim());
    }

    if (next.startDate && next.endDate && startDate.trim() > endDate.trim()) {
      setError(localize('com_ui_admin_users_stats_error_range'));
      return;
    }

    setApplied(next);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setApplied({});
    setError(null);
  };

  const rows = data?.stats ?? [];
  const showTable = !loading && !statsLoadError && !error;

  let statsMainContent: ReactNode = null;
  if (statsLoadError && parseApiError(statsLoadError).status === 403) {
    statsMainContent = <ErrorMessage variant="forbidden" />;
  } else if (statsLoadError) {
    statsMainContent = (
      <ErrorMessage
        variant="inline"
        message={getErrorMessage(statsLoadError, localize('com_ui_admin_users_stats_load_error'))}
      />
    );
  } else if (loading && rows.length === 0) {
    statsMainContent = <LoadingState rows={6} />;
  } else if (showTable && rows.length === 0) {
    statsMainContent = (
      <EmptyState message={localize('com_ui_admin_users_stats_empty')} icon={BarChart2} />
    );
  } else if (showTable) {
    statsMainContent = (
      <div className="overflow-hidden rounded-lg border border-border-light">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-light bg-surface-secondary">
            <tr>
              <th className="px-4 py-2 font-medium text-text-secondary">
                {localize('com_ui_admin_users_stats_col_name')}
              </th>
              <th className="px-4 py-2 font-medium text-text-secondary">
                {localize('com_ui_admin_users_stats_col_email')}
              </th>
              <th className="px-4 py-2 text-right font-medium text-text-secondary">
                {localize('com_ui_admin_users_stats_col_conversations')}
              </th>
              <th className="px-4 py-2 text-right font-medium text-text-secondary">
                {localize('com_ui_admin_users_stats_col_messages')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {rows.map((row) => (
              <tr key={row.userId} className="hover:bg-surface-hover">
                <td className="px-4 py-2 font-medium text-text-primary">{row.name}</td>
                <td className="px-4 py-2 text-text-secondary">{row.email ?? '—'}</td>
                <td className="px-4 py-2 text-right tabular-nums text-text-primary">
                  {row.conversationsCount.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-text-primary">
                  {row.messagesCount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        {localize('com_ui_admin_users_stats_description')}
      </p>

      <div
        className="flex flex-col gap-3 rounded-lg border border-border-light bg-surface-secondary p-4 sm:flex-row sm:flex-wrap sm:items-end"
        role="search"
        aria-label={localize('com_ui_admin_users_stats_filters_aria')}
      >
        <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <label
            htmlFor="admin-users-stats-start"
            className="text-xs font-medium text-text-secondary"
          >
            {localize('com_ui_admin_users_stats_start_label')}
          </label>
          <Datepicker
            id="admin-users-stats-start"
            value={startDate}
            onChange={setStartDate}
            placeholder={localize('com_ui_admin_users_stats_date_placeholder')}
          />
        </div>
        <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <label
            htmlFor="admin-users-stats-end"
            className="text-xs font-medium text-text-secondary"
          >
            {localize('com_ui_admin_users_stats_end_label')}
          </label>
          <Datepicker
            id="admin-users-stats-end"
            value={endDate}
            onChange={setEndDate}
            placeholder={localize('com_ui_admin_users_stats_date_placeholder')}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            aria-label={localize('com_ui_admin_users_stats_apply')}
          >
            {localize('com_ui_admin_users_stats_apply')}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleClear}>
            {localize('com_ui_admin_users_stats_clear')}
          </Button>
        </div>
      </div>

      {(data?.filters?.startDate != null || data?.filters?.endDate != null) && (
        <p className="text-xs text-text-secondary">
          {data.filters.startDate != null &&
            localize('com_ui_admin_users_stats_active_start', {
              value: new Date(data.filters.startDate).toLocaleString(),
            })}
          {data.filters.startDate != null && data.filters.endDate != null ? ' · ' : ''}
          {data.filters.endDate != null &&
            localize('com_ui_admin_users_stats_active_end', {
              value: new Date(data.filters.endDate).toLocaleString(),
            })}
        </p>
      )}

      {error && <ErrorMessage variant="inline" message={error} />}

      {statsMainContent}
    </div>
  );
}
