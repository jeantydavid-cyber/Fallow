// The scales inherit the chart's hardest rule: an unanswered week is not a
// low week. If these fail, home is capable of showing someone a bad month
// they never reported.

import { describe, expect, it } from 'vitest';
import { balanceExtent, balancePoints, feelingPoints } from '../model/scale';
import { defaultWeights } from '../model/weights';
import type { Week } from '../model/types';
import { weekStartDate } from '../model/week';
import droughtFx from '../fixtures/drought.json';
import sparseFx from '../fixtures/sparse.json';

const weights = defaultWeights();

const week = (id: string, over: Partial<Week> = {}): Week => ({
  id,
  startDate: weekStartDate(id),
  entries: [],
  markers: null,
  checkIn: 'full',
  recoveryKnown: true,
  ...over,
});

describe('feeling points', () => {
  it('mirror the emptiness answer, so a full week sits at the top', () => {
    const weeks = [
      week('2026-W10', { markers: { emptiness: 0, skillLoss: 0, stimulusTolerance: 1 } }),
      week('2026-W11', { markers: { emptiness: 3, skillLoss: 0, stimulusTolerance: 1 } }),
    ];
    const pts = feelingPoints(weeks);
    expect(pts[0].level).toBe(3); // "Not really" running on empty = full
    expect(pts[1].level).toBe(0); // "All week" = empty
  });

  it('give an unanswered week no level at all, never a low one', () => {
    const weeks = [week('2026-W10', { checkIn: 'quick', recoveryKnown: false, markers: null })];
    expect(feelingPoints(weeks)[0].level).toBeNull();
  });

  it('mark skipped weeks as skipped rather than unanswered', () => {
    const weeks = [
      week('2026-W10', { markers: { emptiness: 1, skillLoss: 0, stimulusTolerance: 1 } }),
      week('2026-W12', { markers: { emptiness: 1, skillLoss: 0, stimulusTolerance: 1 } }),
    ];
    const pts = feelingPoints(weeks);
    expect(pts).toHaveLength(3); // the gap is filled in
    expect(pts[1].skipped).toBe(true);
    expect(pts[1].level).toBeNull();
  });

  it('never invent a level for the sparse fixture', () => {
    const pts = feelingPoints(sparseFx.weeks as Week[]);
    const unanswered = pts.filter((p) => p.level === null);
    expect(unanswered.length).toBeGreaterThan(0);
    expect(pts.every((p) => p.level === null || p.level >= 0)).toBe(true);
  });
});

describe('balance points', () => {
  it('are marked unknown when rest was never recorded, and carry no value', () => {
    const weeks = [
      week('2026-W10', {
        checkIn: 'quick',
        recoveryKnown: false,
        entries: [
          { id: 'a', weekId: '2026-W10', kind: 'load', category: 'masked_social', hours: 20, label: null, source: 'manual', sourceEventId: null, confirmed: true },
        ],
      }),
    ];
    const pts = balancePoints(weeks, weights);
    expect(pts[0].known).toBe(false);
    // A heavy unknown week must not read as a deep negative.
    expect(pts[0].value).toBe(0);
  });

  it('scale against the person own largest swing, never zero', () => {
    expect(balanceExtent([])).toBe(1);
    const pts = balancePoints(droughtFx.weeks as Week[], weights);
    expect(balanceExtent(pts)).toBeGreaterThan(1);
  });

  it('put more rest than demands above the middle', () => {
    const weeks = [
      week('2026-W10', {
        entries: [
          { id: 'r', weekId: '2026-W10', kind: 'recovery', category: 'solitude', hours: 10, label: null, source: 'manual', sourceEventId: null, confirmed: true },
          { id: 'l', weekId: '2026-W10', kind: 'load', category: 'executive', hours: 1, label: null, source: 'manual', sourceEventId: null, confirmed: true },
        ],
      }),
    ];
    expect(balancePoints(weeks, weights)[0].value).toBeGreaterThan(0);
  });
});
