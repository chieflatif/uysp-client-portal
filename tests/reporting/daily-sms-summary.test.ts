import {
  buildBookingsFilter,
  buildLeadsFilter,
  buildSmsFilter,
  parseRange,
  resolveRangeWindow,
} from '../../scripts/reporting/daily-sms-summary';

describe('resolveRangeWindow', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('prioritizes hours override when provided', () => {
    const now = new Date('2025-01-01T12:00:00Z');
    jest.setSystemTime(now);

    const range = resolveRangeWindow({
      rangeArg: 'day',
      daysOverride: undefined,
      hoursOverride: 12,
    });

    expect(range.label).toBe('Last 12 hours');
    expect(range.end.toISOString()).toBe(now.toISOString());
    expect(range.start.toISOString()).toBe('2025-01-01T00:00:00.000Z');
  });

  it('falls back to days override when hours not set', () => {
    const now = new Date('2025-01-10T10:00:00Z');
    jest.setSystemTime(now);

    const range = resolveRangeWindow({
      rangeArg: 'day',
      daysOverride: 3,
      hoursOverride: undefined,
    });

    expect(range.label).toBe('Last 3 days');
    expect(range.start.toISOString()).toBe('2025-01-07T10:00:00.000Z');
    expect(range.end.toISOString()).toBe(now.toISOString());
  });

  it('uses predefined labels when no overrides exist', () => {
    const now = new Date('2025-02-01T08:00:00Z');
    jest.setSystemTime(now);

    const range = resolveRangeWindow({
      rangeArg: 'threeweeks',
      daysOverride: undefined,
      hoursOverride: undefined,
    });

    expect(range.label).toBe('Last 21 days');
    expect(range.start.toISOString()).toBe('2025-01-11T08:00:00.000Z');
  });
});

describe('daily sms summary helpers', () => {
  const startIso = '2025-01-01T00:00:00.000Z';
  const endIso = '2025-01-02T00:00:00.000Z';

  it('uses Imported At for lead filters', () => {
    const filter = buildLeadsFilter(startIso, endIso);
    expect(filter).toContain('{Imported At}');
    expect(filter).not.toContain('CREATED_TIME');
    expect(filter).toContain(startIso);
    expect(filter).toContain(endIso);
  });

  it('uses Booked At for booking filters', () => {
    const filter = buildBookingsFilter(startIso, endIso);
    expect(filter).toContain('{Booked At}');
    expect(filter).toContain(startIso);
    expect(filter).toContain(endIso);
  });

  it('uses Sent At for sms filters', () => {
    const filter = buildSmsFilter(startIso, endIso);
    expect(filter).toContain('{Sent At}');
  });
});

describe('parseRange', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-02-01T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns 21 day window for threeweeks option', () => {
    const result = parseRange('threeweeks');
    expect(result.label).toBe('Last 21 days');
    expect(result.end.toISOString()).toBe('2025-02-01T00:00:00.000Z');
    expect(result.start.toISOString()).toBe('2025-01-11T00:00:00.000Z');
  });
});

