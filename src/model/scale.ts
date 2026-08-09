// Points for the two scales on home.
//
// The same discipline as the old chart applies, and matters more here: a week
// nobody answered for is NOT a low week. It has no mark of its own, it never
// joins the line, and it is excluded from every comparison. Rendering an
// unanswered week as "empty" would be the app inventing a bad week.

import type { Week, Weights } from './types';
import { continuousWeeks, deriveWeek } from './week';

export interface FeelingPoint {
  weekId: string;
  /** 3 = full, 0 = running on empty all week. null = never answered. */
  level: 0 | 1 | 2 | 3 | null;
  skipped: boolean;
}

export interface BalancePoint {
  weekId: string;
  /** Positive = more rest than demands. */
  value: number;
  known: boolean;
  skipped: boolean;
}

function isSkipped(w: Week): boolean {
  return w.checkIn === 'none' && w.entries.length === 0;
}

/** How full the person said they felt, week by week.
    The check-in stores emptiness (0 = not really running on empty), so the
    fullness shown is its mirror. */
export function feelingPoints(weeks: Week[], windowSize = 12): FeelingPoint[] {
  return continuousWeeks(weeks)
    .slice(-windowSize)
    .map((w) => ({
      weekId: w.id,
      level: w.markers ? ((3 - w.markers.emptiness) as 0 | 1 | 2 | 3) : null,
      skipped: isSkipped(w),
    }));
}

export function balancePoints(weeks: Week[], weights: Weights, windowSize = 12): BalancePoint[] {
  return continuousWeeks(weeks)
    .slice(-windowSize)
    .map((w) => ({
      weekId: w.id,
      value: w.recoveryKnown ? deriveWeek(w, weights).balance : 0,
      known: w.recoveryKnown,
      skipped: isSkipped(w),
    }));
}

/** The person's own largest swing, so the scale is never against a norm.
    Never returns 0, so a flat run cannot divide by nothing. */
export function balanceExtent(points: BalancePoint[]): number {
  return Math.max(1, ...points.filter((p) => p.known).map((p) => Math.abs(p.value)));
}
