import { formatEventDate, isPast } from './formatters';

describe('formatEventDate', () => {
  it('formats an ISO date from the API', () => {
    expect(formatEventDate('2026-11-02T18:00:00.000Z', 'long')).toBe('2 November 2026');
    expect(formatEventDate('2026-11-02T18:00:00.000Z', 'short')).toBe('2 Nov');
  });

  it('renders a placeholder instead of "Invalid Date"', () => {
    expect(formatEventDate(null)).toBe('Date TBC');
    expect(formatEventDate('not-a-date')).toBe('Date TBC');
  });
});

describe('isPast', () => {
  it('compares against the supplied clock', () => {
    const now = new Date('2026-06-01T00:00:00.000Z');
    expect(isPast('2026-01-01T00:00:00.000Z', now)).toBe(true);
    expect(isPast('2026-12-01T00:00:00.000Z', now)).toBe(false);
    expect(isPast(null, now)).toBe(false);
  });
});
