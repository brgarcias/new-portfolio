// Dates like "2025-10" are parsed as midnight UTC, so they are read and
// formatted in UTC too. Otherwise a build west of Greenwich would show the
// month before.

// I18N
import { format } from '@/src/i18n/messages';

// The words of the duration, such as "{count}y" and "{count}m".
interface DurationUnits {
  years: string;
  months: string;
}

export function calculateDuration(
  start: string,
  end: string | undefined,
  units: DurationUnits,
) {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  const months =
    (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
    (endDate.getUTCMonth() - startDate.getUTCMonth());

  if (months < 0) return '';

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  const yearLabel = years > 0 ? format(units.years, { count: years }) : '';

  const monthLabel =
    remainingMonths > 0 ? format(units.months, { count: remainingMonths }) : '';

  return [yearLabel, monthLabel].filter(Boolean).join(' ');
}

// Such as "Oct 2025 — Present", with the month in the page's language.
export function formatDateRange(
  start: string,
  end: string | undefined,
  { dateLocale, present }: { dateLocale: string; present: string },
) {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  };

  const startFormatted = startDate.toLocaleDateString(dateLocale, options);

  const endFormatted = endDate
    ? endDate.toLocaleDateString(dateLocale, options)
    : present;

  return `${startFormatted} — ${endFormatted}`;
}
