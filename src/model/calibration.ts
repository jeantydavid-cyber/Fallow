// Onboarding calibration — FALLOW-SPEC.md §5.
// 12 pairwise comparisons (7 load, 5 recovery), one per screen. Count wins,
// derive a rank order, map ranks onto the fixed geometric scale.

import type { LoadCategory, RecoveryCategory, Weights } from './types';
import { LOAD_CATEGORIES, RECOVERY_CATEGORIES } from './types';
import { winsToWeights } from './weights';

export interface PairwiseQuestion {
  kind: 'load' | 'recovery';
  a: LoadCategory | RecoveryCategory;
  b: LoadCategory | RecoveryCategory;
  aText: string;
  bText: string;
}

// Concrete, everyday scenarios — the comparison is between lived situations,
// not category names.
export const PAIRWISE_QUESTIONS: PairwiseQuestion[] = [
  { kind: 'load', a: 'masked_social', b: 'sensory', aText: 'Three hours of meetings', bText: 'Three hours in a loud, crowded shop' },
  { kind: 'load', a: 'masked_social', b: 'executive', aText: 'An afternoon at a work social', bText: 'An afternoon of forms and phone calls' },
  { kind: 'load', a: 'unexpected_change', b: 'transition', aText: 'Plans changing at the last minute', bText: 'A day of travel somewhere new' },
  { kind: 'load', a: 'sensory', b: 'transition', aText: 'A bright, noisy supermarket run', bText: 'Two changes of place in one day' },
  { kind: 'load', a: 'executive', b: 'unexpected_change', aText: 'Sorting out admin all morning', bText: 'Something sprung on you mid-week' },
  { kind: 'load', a: 'conflict', b: 'masked_social', aText: 'A disagreement that got tense', bText: 'A long dinner where you had to perform' },
  { kind: 'load', a: 'conflict', b: 'sensory', aText: 'Being misread and having to explain', bText: 'A packed, noisy train ride' },
  { kind: 'recovery', a: 'solitude', b: 'flow', aText: 'An evening completely alone', bText: 'An evening deep in your thing' },
  { kind: 'recovery', a: 'sensory_relief', b: 'solitude', aText: 'A dark, quiet room for an hour', bText: 'An hour alone with nothing owed' },
  { kind: 'recovery', a: 'unmasked_time', b: 'unstructured', aText: 'Time with someone easy to be around', bText: 'A day with nothing planned at all' },
  { kind: 'recovery', a: 'flow', b: 'unstructured', aText: 'A whole afternoon of hyperfocus', bText: 'A slow day with no transitions' },
  { kind: 'recovery', a: 'unmasked_time', b: 'sensory_relief', aText: 'Sitting quietly alongside a safe person', bText: 'Noise-cancelling and a dim room' },
];

/** 'a' | 'b' | 'same' per question, in order. */
export type PairwiseAnswer = 'a' | 'b' | 'same';

export function calibrate(answers: PairwiseAnswer[], now: number): Weights {
  const loadWins = Object.fromEntries(LOAD_CATEGORIES.map((c) => [c, 0])) as Record<LoadCategory, number>;
  const recoveryWins = Object.fromEntries(RECOVERY_CATEGORIES.map((c) => [c, 0])) as Record<RecoveryCategory, number>;

  PAIRWISE_QUESTIONS.forEach((q, i) => {
    const ans = answers[i];
    if (!ans || ans === 'same') {
      // Half a win each keeps ties symmetric.
      if (q.kind === 'load') {
        loadWins[q.a as LoadCategory] += 0.5;
        loadWins[q.b as LoadCategory] += 0.5;
      } else {
        recoveryWins[q.a as RecoveryCategory] += 0.5;
        recoveryWins[q.b as RecoveryCategory] += 0.5;
      }
      return;
    }
    const winner = ans === 'a' ? q.a : q.b;
    if (q.kind === 'load') loadWins[winner as LoadCategory] += 1;
    else recoveryWins[winner as RecoveryCategory] += 1;
  });

  return {
    load: winsToWeights(loadWins, LOAD_CATEGORIES),
    recovery: winsToWeights(recoveryWins, RECOVERY_CATEGORIES),
    pinned: {},
    calibratedAt: now,
    refittedAt: null,
  };
}
