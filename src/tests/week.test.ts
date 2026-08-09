import { describe, expect, it } from 'vitest';
import { addWeeks, continuousWeeks, countInWords, deriveWeek, isoWeekId, monthNameOf, weekStartDate } from '../model/week';
import { defaultWeights } from '../model/weights';
import type { Week } from '../model/types';

describe('ISO week arithmetic', () => {
  it('computes ISO week ids', () => {
    expect(isoWeekId(new Date(2026, 0, 1))).toBe('2026-W01');
    expect(isoWeekId(new Date(2026, 7, 9))).toBe('2026-W32');
    expect(isoWeekId(new Date(2027, 0, 1))).toBe('2026-W53');
  });

  it('round-trips week start dates', () => {
    expect(weekStartDate('2026-W32')).toBe('2026-08-03');
    expect(isoWeekId(new Date('2026-08-03T12:00:00'))).toBe('2026-W32');
  });

  it('adds weeks across year boundaries', () => {
    expect(addWeeks('2026-W52', 1)).toBe('2026-W53');
    expect(addWeeks('2026-W53', 1)).toBe('2027-W01');
    expect(addWeeks('2027-W01', -1)).toBe('2026-W53');
  });

  it('fills calendar gaps with skipped placeholder weeks', () => {
    const mk = (id: string): Week => ({
      id, startDate: weekStartDate(id), entries: [], markers: null, checkIn: 'full', recoveryKnown: true,
    });
    const filled = continuousWeeks([mk('2026-W10'), mk('2026-W14')]);
    expect(filled.map((w) => w.id)).toEqual(['2026-W10', '2026-W11', '2026-W12', '2026-W13', '2026-W14']);
    expect(filled[1].checkIn).toBe('none');
    expect(filled[1].recoveryKnown).toBe(false);
  });
});

describe('derived values', () => {
  it('computes weighted load, recovery, and balance', () => {
    const weights = defaultWeights();
    const week: Week = {
      id: '2026-W10', startDate: '2026-03-02', markers: null, checkIn: 'full', recoveryKnown: true,
      entries: [
        { id: '1', weekId: '2026-W10', kind: 'load', category: 'masked_social', hours: 10, label: null, source: 'manual', sourceEventId: null, confirmed: true },
        { id: '2', weekId: '2026-W10', kind: 'recovery', category: 'solitude', hours: 4, label: null, source: 'manual', sourceEventId: null, confirmed: true },
      ],
    };
    const d = deriveWeek(week, weights);
    expect(d.weightedLoad).toBeCloseTo(10 * 2.3);
    expect(d.weightedRecovery).toBeCloseTo(4 * 2.3);
    expect(d.balance).toBeCloseTo(4 * 2.3 - 10 * 2.3);
  });
});

describe('copy helpers', () => {
  it('renders counts in words', () => {
    expect(countInWords(3)).toBe('three');
    expect(countInWords(12)).toBe('twelve');
  });
  it('names months from week ids', () => {
    expect(monthNameOf('2026-W10')).toBe('March');
  });
});
