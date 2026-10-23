// Dates like "2025-10" are parsed as midnight UTC, so they are read and
// formatted in UTC too. Otherwise a build west of Greenwich would show the
// month before.
export function calculateDuration(start: string, end?: string) {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  const months =
    (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
    (endDate.getUTCMonth() - startDate.getUTCMonth());

  if (months < 0) return '';

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  const yearLabel = years > 0 ? `${years}y` : '';

  const monthLabel = remainingMonths > 0 ? `${remainingMonths}m` : '';

  return [yearLabel, monthLabel].filter(Boolean).join(' ');
}

export function formatDateRange(start: string, end?: string) {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  };

  const startFormatted = startDate.toLocaleDateString('en-US', options);

  const endFormatted = endDate
    ? endDate.toLocaleDateString('en-US', options)
    : 'Present';

  return `${startFormatted} — ${endFormatted}`;
}
