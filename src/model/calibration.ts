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

// Concrete, everyday situations — the comparison is between things that
// actually happen to a person, never between category names. Each side names
// a real scene, roughly matched for length of time, so the only difference
// being weighed is the kind of demand or the kind of rest.
export const PAIRWISE_QUESTIONS: PairwiseQuestion[] = [
  { kind: 'load', a: 'masked_social', b: 'sensory',
    aText: 'Three hours of back-to-back meetings',
    bText: 'Three hours in a loud, crowded shopping centre' },
  { kind: 'load', a: 'masked_social', b: 'executive',
    aText: 'An afternoon at a work party, making conversation',
    bText: 'An afternoon of paperwork and phone calls you keep putting off' },
  { kind: 'load', a: 'unexpected_change', b: 'transition',
    aText: 'A friend cancels on the day and your plans fall apart',
    bText: 'A long journey to somewhere you have never been' },
  { kind: 'load', a: 'sensory', b: 'transition',
    aText: 'A big supermarket on a Saturday: bright, loud, busy',
    bText: 'Home, then across town, then somewhere else, all in one day' },
  { kind: 'load', a: 'executive', b: 'unexpected_change',
    aText: 'A morning of forms, passwords, and decisions',
    bText: 'Your week gets rearranged with no warning' },
  { kind: 'load', a: 'conflict', b: 'masked_social',
    aText: 'An argument with someone close that does not get resolved',
    bText: 'A three-hour dinner where you have to be "on" the whole time' },
  { kind: 'load', a: 'conflict', b: 'sensory',
    aText: 'Someone takes what you said the wrong way and you have to explain yourself',
    bText: 'A packed rush-hour train with no seat' },

  { kind: 'recovery', a: 'solitude', b: 'flow',
    aText: 'An evening completely on your own, nobody to answer to',
    bText: 'An evening lost in something you love doing' },
  { kind: 'recovery', a: 'sensory_relief', b: 'solitude',
    aText: 'An hour in a dark, quiet room',
    bText: 'An hour alone, with nothing you have to do afterwards' },
  { kind: 'recovery', a: 'unmasked_time', b: 'unstructured',
    aText: 'Time with the one person you never have to pretend around',
    bText: 'A day with absolutely nothing in the diary' },
  { kind: 'recovery', a: 'flow', b: 'unstructured',
    aText: 'A whole afternoon on your favourite subject, losing track of time',
    bText: 'A slow day at home, nowhere to be, no getting ready' },
  { kind: 'recovery', a: 'unmasked_time', b: 'sensory_relief',
    aText: 'Sitting in the same room as someone comfortable, both doing your own thing',
    bText: 'Headphones on, lights low, nobody talking to you' },
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
