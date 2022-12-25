/** Date formatting used by the cards and the detail page. */

const FORMATS = {
  long: { month: 'long', day: 'numeric', year: 'numeric' },
  short: { month: 'short', day: 'numeric' },
  withTime: { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' },
};

/**
 * Formats an ISO date from the API. Returns `'Date TBC'` for a missing or
 * unparseable value rather than rendering "Invalid Date" to a user.
 */
export const formatEventDate = (value, format = 'long', locale = 'en-GB') => {
  if (!value) return 'Date TBC';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date TBC';
  return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...FORMATS[format] }).format(date);
};

/** `true` when the event's date is in the past. */
export const isPast = (value, now = new Date()) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date < now;
};
