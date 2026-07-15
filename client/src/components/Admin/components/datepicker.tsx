import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Popover from '@radix-ui/react-popover';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';

import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseYmd(ymd: string): Date | null {
  if (!ISO_DATE.test(ymd)) {
    return null;
  }
  const [y, m, d] = ymd.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? dt : null;
}

type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function weekStartsOnForLocale(language: string): WeekStartsOn {
  try {
    const locale = new Intl.Locale(language) as Intl.Locale & {
      weekInfo?: { firstDay?: number };
    };
    const firstDay = locale.weekInfo?.firstDay;
    if (firstDay === 7) {
      return 0;
    }
    if (firstDay != null && firstDay >= 1 && firstDay <= 6) {
      return firstDay as WeekStartsOn;
    }
  } catch {
    // ignore invalid locale tags
  }
  return 1;
}

export type DatepickerProps = {
  id: string;
  value: string;
  onChange: (ymd: string) => void;
  placeholder: string;
};

export default function Datepicker({ id, value, onChange, placeholder }: DatepickerProps) {
  const localize = useLocalize();
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(() => new Date());

  const selected = useMemo(() => (value ? parseYmd(value) : null), [value]);

  const weekStartsOn = useMemo(() => weekStartsOnForLocale(i18n.language), [i18n.language]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setDisplayMonth(selected ?? new Date());
    }
  };

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(
        displayMonth,
      ),
    [displayMonth, i18n.language],
  );

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, monthIndex) => ({
        value: monthIndex,
        label: new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(
          new Date(2025, monthIndex, 1),
        ),
      })),
    [i18n.language],
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 141 }, (_, index) => currentYear - 100 + index);
  }, []);

  const weekDayLabels = useMemo(() => {
    const ref = startOfWeek(new Date(2025, 5, 15), { weekStartsOn });
    return Array.from({ length: 7 }, (_, i) => addDays(ref, i)).map((d) =>
      d.toLocaleDateString(i18n.language, { weekday: 'narrow' }),
    );
  }, [i18n.language, weekStartsOn]);

  const calendarDays = useMemo(() => {
    const ms = startOfMonth(displayMonth);
    const me = endOfMonth(displayMonth);
    return eachDayOfInterval({
      start: startOfWeek(ms, { weekStartsOn }),
      end: endOfWeek(me, { weekStartsOn }),
    });
  }, [displayMonth, weekStartsOn]);

  const displayValue =
    selected != null ? selected.toLocaleDateString(i18n.language, { dateStyle: 'medium' }) : null;

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-md border border-border-light bg-surface-primary px-3 py-2 text-left text-sm text-text-primary outline-none ring-ring focus-visible:ring-2',
            !displayValue && 'text-text-secondary',
          )}
        >
          <span className="truncate">{displayValue ?? placeholder}</span>
          <CalendarIcon className="size-4 shrink-0 opacity-70" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={8}
          className="z-[10000] w-[min(100vw-1rem,20rem)] rounded-2xl border border-border-light bg-surface-secondary p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              className="rounded-md p-1 text-text-primary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={localize('com_ui_admin_users_stats_calendar_prev')}
              onClick={() => setDisplayMonth((d) => subMonths(d, 1))}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
              <label className="sr-only" htmlFor={`${id}-month-select`}>
                {localize('com_ui_admin_users_stats_calendar_month')}
              </label>
              <select
                id={`${id}-month-select`}
                aria-label="Month"
                className="w-[8.5rem] rounded-md border border-border-light bg-surface-primary px-2 py-1 text-sm text-text-primary outline-none ring-ring focus-visible:ring-2"
                value={displayMonth.getMonth()}
                onChange={(event) => {
                  const month = Number(event.target.value);
                  setDisplayMonth(
                    new Date(displayMonth.getFullYear(), Number.isNaN(month) ? 0 : month, 1),
                  );
                }}
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor={`${id}-year-select`}>
                {localize('com_ui_admin_users_stats_calendar_year')}
              </label>
              <select
                id={`${id}-year-select`}
                aria-label="Year"
                className="w-[5.25rem] rounded-md border border-border-light bg-surface-primary px-2 py-1 text-sm text-text-primary outline-none ring-ring focus-visible:ring-2"
                value={displayMonth.getFullYear()}
                onChange={(event) => {
                  const year = Number(event.target.value);
                  setDisplayMonth(
                    new Date(
                      Number.isNaN(year) ? displayMonth.getFullYear() : year,
                      displayMonth.getMonth(),
                      1,
                    ),
                  );
                }}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-text-primary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={localize('com_ui_admin_users_stats_calendar_next')}
              onClick={() => setDisplayMonth((d) => addMonths(d, 1))}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mb-1 text-center text-xs text-text-secondary">{monthLabel}</div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-secondary">
            {weekDayLabels.map((label, i) => (
              <div key={i} className="py-1 font-medium">
                {label}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const inMonth = isSameMonth(day, displayMonth);
              const isSelected = selected != null && isSameDay(day, selected);
              const label = day.toLocaleDateString(i18n.language, { dateStyle: 'full' });
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  aria-label={label}
                  aria-current={isSelected ? 'date' : undefined}
                  className={cn(
                    'flex h-8 items-center justify-center rounded-md text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    inMonth ? 'text-text-primary' : 'text-text-secondary opacity-50',
                    isSelected &&
                      'bg-surface-primary font-medium text-text-primary ring-1 ring-border-medium',
                    !isSelected && inMonth && 'hover:bg-surface-hover',
                    !isSelected && !inMonth && 'hover:bg-surface-hover/60',
                  )}
                  onClick={() => {
                    onChange(format(day, 'yyyy-MM-dd'));
                    setDisplayMonth(startOfMonth(day));
                    setOpen(false);
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
