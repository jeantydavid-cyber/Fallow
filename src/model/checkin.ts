// Which week is ready to look back on, and empty-week construction.
// The check-in is pulled, never pushed: no reminder exists anywhere.

import type { Week } from './types';
import { addWeeks, isoWeekId, weekStartDate } from './week';

/** The most recently finished ISO week. */
export function lastFinishedWeekId(today = new Date()): string {
  return addWeeks(isoWeekId(today), -1);
}

/** A week is ready for check-in when the last finished week hasn't been
    looked at. Skipping leaves no trace — a 'none' week older than the most
    recent one is never offered again. */
export function readyWeekId(weeks: Week[], today = new Date()): string | null {
  const target = lastFinishedWeekId(today);
  const existing = weeks.find((w) => w.id === target);
  if (!existing) return target;
  return existing.checkIn === 'none' && !existing.entries.some((e) => e.confirmed) ? target : null;
}

export function emptyWeek(id: string): Week {
  return {
    id,
    startDate: weekStartDate(id),
    entries: [],
    markers: null,
    checkIn: 'none',
    recoveryKnown: false,
  };
}
