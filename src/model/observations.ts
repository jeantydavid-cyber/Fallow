// Observation rendering — templates from COPY.md §1, deterministic, offline.
// Only ever one observation. Past and present tense only; never a
// prediction, a date, or a probability. Severity escalates wording, never a
// number.

import { OBSERVATIONS, OBSERVATION_NAMES } from '../copy';
import type { Signal } from './signals';
import type { RecoveryCategory, Weights } from './types';
import { rankedRecovery } from './weights';
import { countInWords, monthNameOf } from './week';

export function observationText(signal: Signal, weights: Weights): string | null {
  const month = signal.runStartWeekId ? monthNameOf(signal.runStartWeekId) : '';
  const n = countInWords(signal.runLength);

  switch (signal.pattern) {
    case 'skill_loss':
      if (signal.runLength <= 2) return OBSERVATIONS.skillLoss2;
      if (signal.runLength <= 4) return OBSERVATIONS.skillLossN(n);
      return OBSERVATIONS.skillLossSince(month);

    case 'drought': {
      const thing = OBSERVATION_NAMES[signal.category ?? 'solitude'];
      if (signal.runLength <= 3) return OBSERVATIONS.drought(thing);
      if (signal.runLength <= 7) return OBSERVATIONS.droughtN(thing, n);
      return OBSERVATIONS.droughtSince(thing, month);
    }

    case 'collapse': {
      const cat = signal.category ?? 'solitude';
      const thing = OBSERVATION_NAMES[cat];
      const topWeighted: RecoveryCategory = rankedRecovery(weights)[0];
      return cat === topWeighted
        ? OBSERVATIONS.collapseTop(thing, month)
        : OBSERVATIONS.collapse(thing, month);
    }

    case 'deficit':
      return OBSERVATIONS.deficit(n);

    case 'neutral':
      if (signal.knownWeekCount < 3) return null; // under 3 known weeks: nothing
      if (signal.neutralKind === 'busy_but_fine') return OBSERVATIONS.busyButFine;
      if (signal.neutralKind === 'steady') return OBSERVATIONS.steadyFewWeeks;
      return null;
  }
}
