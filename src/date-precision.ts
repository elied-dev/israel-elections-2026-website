export type DatePrecision = 'day' | 'month' | 'year' | 'unknown';

export function formatDatePrecision(date: Date | null, precision: DatePrecision) {
  if (precision === 'unknown' || !date) return 'Date unknown';
  if (precision === 'day') return date.toISOString().slice(0, 10);
  if (precision === 'year') return String(date.getUTCFullYear());
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}
