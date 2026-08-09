// ISO week arithmetic and per-week derived values.

import type { Week, Weights, WeekDerived, LoadCategory, RecoveryCategory } from './types';

/** ISO week id ("2026-W32") for a date. Weeks start Monday. */
export function isoWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Monday of the given ISO week id, as an ISO date string. */
export function weekStartDate(weekId: string): string {
  const [y, w] = weekId.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (w - 1) * 7);
  return monday.toISOString().slice(0, 10);
}

/** The week id n weeks after (or before, negative) the given one. */
export function addWeeks(weekId: string, n: number): string {
  const start = new Date(weekStartDate(weekId) + 'T00:00:00Z');
  start.setUTCDate(start.getUTCDate() + n * 7 + 3); // Thursday keeps ISO year right
  return isoWeekId(new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
}

/** Sort week ids chronologically (lexicographic works for zero-padded ISO ids). */
export function sortWeekIds(ids: string[]): string[] {
  return [...ids].sort();
}

export function monthNameOf(weekId: string): string {
  const d = new Date(weekStartDate(weekId) + 'T00:00:00Z');
  return d.toLocaleString('en', { month: 'long', timeZone: 'UTC' });
}

export function deriveWeek(week: Week, weights: Weights): WeekDerived {
  let weightedLoad = 0;
  let weightedRecovery = 0;
  for (const e of week.entries) {
    if (e.kind === 'load') {
      weightedLoad += e.hours * (weights.load[e.category as LoadCategory] ?? 1);
    } else {
      weightedRecovery += e.hours * (weights.recovery[e.category as RecoveryCategory] ?? 1);
    }
  }
  return { weightedLoad, weightedRecovery, balance: weightedRecovery - weightedLoad };
}

/** Continuous run of week ids from first to last present id, gaps filled with
    skipped placeholder weeks, sorted ascending. The chart and the signal
    logic both need real calendar continuity, not array adjacency. */
export function continuousWeeks(weeks: Week[]): Week[] {
  if (weeks.length === 0) return [];
  const byId = new Map(weeks.map((w) => [w.id, w]));
  const ids = sortWeekIds([...byId.keys()]);
  const out: Week[] = [];
  let id = ids[0];
  const last = ids[ids.length - 1];
  while (id <= last) {
    out.push(
      byId.get(id) ?? {
        id,
        startDate: weekStartDate(id),
        entries: [],
        markers: null,
        checkIn: 'none',
        recoveryKnown: false,
      },
    );
    if (id === last) break;
    id = addWeeks(id, 1);
  }
  return out;
}

const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve',
];

/** Counts render in words on screen ("three weeks"), per COPY.md. */
export function countInWords(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}
