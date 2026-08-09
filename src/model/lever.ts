// The lever — what's coming up, heaviest first by this person's weights.

import type { Entry, LoadCategory, Week, Weights } from './types';
import { addWeeks, isoWeekId, weekStartDate } from './week';

export interface LeverItem {
  entry: Entry;
  weekId: string;
  dayName: string | null;
  cost: number; // hours × this person's weight
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function dayNameOf(entry: Entry): string | null {
  if (entry.dayOfWeek === undefined || entry.dayOfWeek === null) return null;
  return DAY_NAMES[entry.dayOfWeek] ?? null;
}

/** Load entries in the current and next ISO week, heaviest first by the
    person's own weights. Sorted once; the caller must never re-sort under
    the user's finger. */
export function upcomingItems(weeks: Week[], weights: Weights, today = new Date()): LeverItem[] {
  const thisWeek = isoWeekId(today);
  const nextWeek = addWeeks(thisWeek, 1);
  const items: LeverItem[] = [];
  for (const w of weeks) {
    if (w.id !== thisWeek && w.id !== nextWeek) continue;
    for (const e of w.entries) {
      if (e.kind !== 'load' || e.hours <= 0) continue;
      items.push({
        entry: e,
        weekId: w.id,
        dayName: dayNameOf(e),
        cost: e.hours * (weights.load[e.category as LoadCategory] ?? 1),
      });
    }
  }
  return items.sort((a, b) => b.cost - a.cost);
}

/** A day in the next two weeks with nothing on it, preferring weekends. */
export function findFreeDay(weeks: Week[], today = new Date()): { dayName: string; weekId: string } | null {
  const thisWeek = isoWeekId(today);
  const nextWeek = addWeeks(thisWeek, 1);
  const busy = new Set<string>();
  for (const w of weeks) {
    if (w.id !== thisWeek && w.id !== nextWeek) continue;
    for (const e of w.entries) {
      if (e.dayOfWeek !== undefined && e.dayOfWeek !== null && e.hours > 0) {
        busy.add(`${w.id}:${e.dayOfWeek}`);
      }
    }
  }
  const todayIdx = (today.getDay() + 6) % 7; // 0 = Monday
  const candidates: { dayName: string; weekId: string; score: number }[] = [];
  for (const [weekId, fromDay] of [[thisWeek, todayIdx + 1], [nextWeek, 0]] as [string, number][]) {
    for (let d = fromDay; d < 7; d++) {
      if (busy.has(`${weekId}:${d}`)) continue;
      const weekend = d >= 5;
      candidates.push({ dayName: DAY_NAMES[d], weekId, score: (weekend ? 10 : 0) - candidates.length });
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  return { dayName: candidates[0].dayName, weekId: candidates[0].weekId };
}

/** Future weeks for the mini projection, as plain totals. */
export function projectionWeeks(today = new Date()): { weekId: string; future: boolean }[] {
  const current = isoWeekId(today);
  return [addWeeks(current, -2), addWeeks(current, -1), current, addWeeks(current, 1)].map((id) => ({
    weekId: id,
    future: id >= current,
  }));
}

export function ensureWeek(weeks: Week[], id: string): Week {
  return (
    weeks.find((w) => w.id === id) ?? {
      id,
      startDate: weekStartDate(id),
      entries: [],
      markers: null,
      checkIn: 'none',
      recoveryKnown: false,
    }
  );
}
