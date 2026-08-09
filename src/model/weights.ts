// Weight model — FALLOW-SPEC.md §5. Ranks map onto a fixed geometric scale;
// nothing here pretends twelve answers are a fitted model.

import type { LoadCategory, RecoveryCategory, Weights } from './types';
import { LOAD_CATEGORIES, RECOVERY_CATEGORIES } from './types';

export const GEOMETRIC_SCALE: readonly number[] = [1.0, 1.4, 1.8, 2.3, 2.9, 3.6];
export const SCALE_MIN = 1.0;
export const SCALE_MAX = 3.6;

/** Snap an arbitrary value to the nearest step of the fixed scale. */
export function snapToScale(v: number): number {
  let best = GEOMETRIC_SCALE[0];
  for (const s of GEOMETRIC_SCALE) {
    if (Math.abs(s - v) < Math.abs(best - v)) best = s;
  }
  return best;
}

export function stepWeight(current: number, direction: 1 | -1): number {
  const idx = GEOMETRIC_SCALE.findIndex((s) => Math.abs(s - current) < 1e-9);
  const from = idx === -1 ? GEOMETRIC_SCALE.indexOf(snapToScale(current)) : idx;
  const next = Math.min(GEOMETRIC_SCALE.length - 1, Math.max(0, from + direction));
  return GEOMETRIC_SCALE[next];
}

/** Sensible defaults before calibration — used only until onboarding runs. */
export function defaultWeights(now = 0): Weights {
  return {
    load: {
      masked_social: 2.3,
      unexpected_change: 1.8,
      sensory: 1.8,
      executive: 1.4,
      transition: 1.4,
      conflict: 2.9,
    },
    recovery: {
      solitude: 2.3,
      sensory_relief: 1.8,
      unmasked_time: 1.4,
      flow: 1.8,
      unstructured: 1.4,
    },
    pinned: {},
    calibratedAt: now,
    refittedAt: null,
  };
}

/** What a typical instance of each kind of rest is worth, in plain hours.
    The check-in asks only whether something happened, not for how long: a
    depleted person should not be dialling in numbers, and the drought signal
    compares a week against the person's OWN median anyway, so a consistent
    typical amount carries the same information as a measured one. */
export const TYPICAL_RECOVERY_HOURS: Record<RecoveryCategory, number> = {
  solitude: 4,
  sensory_relief: 3,
  unmasked_time: 4,
  flow: 4,
  unstructured: 10, // a whole day with nothing in it
};

/** Calibrated default recovery floor, used before 8 known weeks exist:
    a modest weekly recovery under the person's own weights. */
export function calibratedDefaultFloor(weights: Weights): number {
  const mean =
    RECOVERY_CATEGORIES.reduce((s, c) => s + weights.recovery[c], 0) /
    RECOVERY_CATEGORIES.length;
  return 6 * mean; // ~6 plain hours of typical recovery a week
}

/** Map win counts to weights: rank order onto the geometric scale.
    Ties resolve by the fixed category order, so results are deterministic. */
export function winsToWeights<C extends string>(
  wins: Record<C, number>,
  order: readonly C[],
): Record<C, number> {
  const ranked = [...order].sort((a, b) => wins[a] - wins[b] || order.indexOf(a) - order.indexOf(b));
  const out = {} as Record<C, number>;
  ranked.forEach((cat, i) => {
    out[cat] = GEOMETRIC_SCALE[Math.min(i, GEOMETRIC_SCALE.length - 1)];
  });
  return out;
}

export function rankedLoad(weights: Weights): LoadCategory[] {
  return [...LOAD_CATEGORIES].sort((a, b) => weights.load[b] - weights.load[a]);
}

export function rankedRecovery(weights: Weights): RecoveryCategory[] {
  return [...RECOVERY_CATEGORIES].sort((a, b) => weights.recovery[b] - weights.recovery[a]);
}
