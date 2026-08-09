// Signal logic — FALLOW-SPEC.md §7.
//
// The single most important correctness rule (spec §6): a quick week has
// UNKNOWN recovery, not zero. Every consecutive-week count below reads only
// weeks where recoveryKnown === true (markers runs read only weeks that have
// markers). Unknown and skipped weeks neither count toward a run nor break
// one — they are simply not part of the sequence being counted.

import type { RecoveryCategory, Week, Weights } from './types';
import { RECOVERY_CATEGORIES } from './types';
import { calibratedDefaultFloor, rankedRecovery } from './weights';
import { continuousWeeks, deriveWeek, sortWeekIds } from './week';

export type PatternKind = 'skill_loss' | 'drought' | 'collapse' | 'deficit' | 'neutral';

export interface Signal {
  pattern: PatternKind;
  /** Length of the run that fired the pattern, in known weeks. */
  runLength: number;
  /** Week id where the run started, for "{since month}" wording. */
  runStartWeekId: string | null;
  /** The recovery category involved (drought/collapse). */
  category: RecoveryCategory | null;
  /** Strong signals are what the low-capacity offer keys off. Never a number
      on screen — wording only. */
  strong: boolean;
  /** Neutral flavour: the busy-but-fine case is never a warning. */
  neutralKind: 'busy_but_fine' | 'steady' | 'none';
  knownWeekCount: number;
}

const NEUTRAL: Omit<Signal, 'neutralKind' | 'knownWeekCount'> = {
  pattern: 'neutral',
  runLength: 0,
  runStartWeekId: null,
  category: null,
  strong: false,
};

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function recoveryFloor(weeks: Week[], weights: Weights): number {
  const known = weeks
    .filter((w) => w.recoveryKnown)
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .slice(0, 8)
    .map((w) => deriveWeek(w, weights).weightedRecovery);
  if (known.length < 8) return calibratedDefaultFloor(weights);
  return median(known);
}

/** Trailing run length over a filtered, chronologically sorted sequence:
    how many of the most recent items satisfy the predicate consecutively. */
function trailingRun<T>(items: T[], pred: (t: T) => boolean): { length: number; start: T | null } {
  let length = 0;
  let start: T | null = null;
  for (let i = items.length - 1; i >= 0; i--) {
    if (!pred(items[i])) break;
    start = items[i];
    length++;
  }
  return { length, start };
}

export function detectSignal(allWeeks: Week[], weights: Weights): Signal {
  const weeks = continuousWeeks(allWeeks).sort((a, b) => (a.id < b.id ? -1 : 1));
  const knownWeeks = weeks.filter((w) => w.recoveryKnown);
  const knownWeekCount = knownWeeks.length;

  // 1. Skill-loss drift — skillLoss ≥ 2 for 2+ consecutive weeks with markers.
  const markerWeeks = weeks.filter((w) => w.markers !== null);
  const skillRun = trailingRun(markerWeeks, (w) => (w.markers?.skillLoss ?? 0) >= 2);
  if (skillRun.length >= 2) {
    return {
      pattern: 'skill_loss',
      runLength: skillRun.length,
      runStartWeekId: skillRun.start?.id ?? null,
      category: null,
      strong: skillRun.length >= 3,
      neutralKind: 'none',
      knownWeekCount,
    };
  }

  const floor = recoveryFloor(weeks, weights);

  // 2. Drought — 3+ consecutive known weeks with recovery < 0.35 × floor.
  const droughtRun = trailingRun(
    knownWeeks,
    (w) => deriveWeek(w, weights).weightedRecovery < 0.35 * floor,
  );
  if (droughtRun.length >= 3) {
    return {
      pattern: 'drought',
      runLength: droughtRun.length,
      runStartWeekId: droughtRun.start?.id ?? null,
      category: scarcestRecovery(knownWeeks, weights),
      strong: droughtRun.length >= 5,
      neutralKind: 'none',
      knownWeekCount,
    };
  }

  // 3. Category collapse — a recovery category that was regularly present
  //    has been absent for 4+ known weeks.
  const collapse = detectCollapse(knownWeeks);
  if (collapse) {
    return {
      pattern: 'collapse',
      runLength: collapse.absentFor,
      runStartWeekId: collapse.sinceWeekId,
      category: collapse.category,
      strong: false,
      neutralKind: 'none',
      knownWeekCount,
    };
  }

  // 4. Sustained deficit — 4+ consecutive known weeks with negative balance.
  const deficitRun = trailingRun(knownWeeks, (w) => deriveWeek(w, weights).balance < 0);
  if (deficitRun.length >= 4) {
    return {
      pattern: 'deficit',
      runLength: deficitRun.length,
      runStartWeekId: deficitRun.start?.id ?? null,
      category: null,
      strong: deficitRun.length >= 6,
      neutralKind: 'none',
      knownWeekCount,
    };
  }

  // 5. Neutral. Busy-but-fine is stated plainly and is never a warning.
  const recent = knownWeeks.slice(-3);
  if (recent.length === 3) {
    const loads = knownWeeks.map((w) => deriveWeek(w, weights).weightedLoad);
    const loadMedian = median(loads);
    const busy = recent.every((w) => {
      const d = deriveWeek(w, weights);
      return d.weightedLoad >= loadMedian && d.weightedRecovery >= 0.8 * floor;
    });
    if (busy && loadMedian > 0) {
      return { ...NEUTRAL, neutralKind: 'busy_but_fine', knownWeekCount };
    }
  }
  return { ...NEUTRAL, neutralKind: knownWeekCount >= 3 ? 'steady' : 'none', knownWeekCount };
}

/** The recovery category most missing lately, for drought wording — the
    person's top-weighted category if it's scarce, else the scarcest one. */
function scarcestRecovery(knownWeeks: Week[], weights: Weights): RecoveryCategory {
  const recent = knownWeeks.slice(-4);
  const hours = Object.fromEntries(RECOVERY_CATEGORIES.map((c) => [c, 0])) as Record<RecoveryCategory, number>;
  for (const w of recent) {
    for (const e of w.entries) {
      if (e.kind === 'recovery') hours[e.category as RecoveryCategory] += e.hours;
    }
  }
  const topWeighted = rankedRecovery(weights)[0];
  if (hours[topWeighted] === 0) return topWeighted;
  return RECOVERY_CATEGORIES.reduce((min, c) => (hours[c] < hours[min] ? c : min), 'solitude' as RecoveryCategory);
}

interface Collapse {
  category: RecoveryCategory;
  absentFor: number;
  sinceWeekId: string;
}

function detectCollapse(knownWeeks: Week[]): Collapse | null {
  if (knownWeeks.length < 8) return null;
  let best: Collapse | null = null;
  for (const cat of RECOVERY_CATEGORIES) {
    const present = knownWeeks.map((w) =>
      w.entries.some((e) => e.kind === 'recovery' && e.category === cat && e.hours > 0),
    );
    const absentRun = trailingRun(present, (p) => !p);
    if (absentRun.length < 4 || absentRun.length >= knownWeeks.length) continue;
    const before = present.slice(0, present.length - absentRun.length);
    const presentCount = before.filter(Boolean).length;
    // "Regularly present": at least 3 appearances covering half the prior weeks.
    if (presentCount >= 3 && presentCount >= before.length / 2) {
      if (!best || absentRun.length > best.absentFor) {
        const sinceIdx = knownWeeks.length - absentRun.length;
        best = { category: cat, absentFor: absentRun.length, sinceWeekId: knownWeeks[sinceIdx].id };
      }
    }
  }
  return best;
}

/** Recent known weeks were lighter than the given month's weeks. */
export function isLighterThan(weeks: Week[], weights: Weights): string | null {
  const known = weeks.filter((w) => w.recoveryKnown).sort((a, b) => (a.id < b.id ? -1 : 1));
  if (known.length < 6) return null;
  const recent = known.slice(-3).map((w) => deriveWeek(w, weights).weightedLoad);
  const earlier = known.slice(0, -3).map((w) => deriveWeek(w, weights).weightedLoad);
  const recentMean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierMax = Math.max(...earlier);
  if (recentMean < 0.6 * earlierMax) {
    const idx = earlier.indexOf(earlierMax);
    return sortWeekIds(known.slice(0, -3).map((w) => w.id))[idx] ?? null;
  }
  return null;
}
