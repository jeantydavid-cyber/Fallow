import { describe, expect, it } from 'vitest';
import { calibrate, PAIRWISE_QUESTIONS, type PairwiseAnswer } from '../model/calibration';
import { GEOMETRIC_SCALE, snapToScale, stepWeight } from '../model/weights';
import { refit } from '../model/refit';
import { defaultWeights } from '../model/weights';
import busyFx from '../fixtures/busy-but-fine.json';
import type { Week } from '../model/types';

describe('calibration', () => {
  it('asks 12 pairwise questions', () => {
    expect(PAIRWISE_QUESTIONS.length).toBe(12);
    expect(PAIRWISE_QUESTIONS.filter((q) => q.kind === 'load').length).toBe(7);
  });

  it('maps win counts onto the fixed geometric scale, never a fitted model', () => {
    // Always pick 'a': categories appearing more often as 'a' win more.
    const answers: PairwiseAnswer[] = PAIRWISE_QUESTIONS.map(() => 'a');
    const w = calibrate(answers, 123);
    const allValues = [...Object.values(w.load), ...Object.values(w.recovery)];
    for (const v of allValues) {
      expect(GEOMETRIC_SCALE).toContain(v);
    }
    expect(w.calibratedAt).toBe(123);
    expect(w.refittedAt).toBeNull();
  });

  it('is deterministic for identical answers', () => {
    const answers: PairwiseAnswer[] = PAIRWISE_QUESTIONS.map((_, i) => (i % 2 ? 'a' : 'b'));
    expect(calibrate(answers, 0)).toEqual(calibrate(answers, 0));
  });

  it('ranks a consistent winner highest', () => {
    // masked_social wins every comparison it appears in.
    const answers: PairwiseAnswer[] = PAIRWISE_QUESTIONS.map((q) => {
      if (q.a === 'masked_social') return 'a';
      if (q.b === 'masked_social') return 'b';
      return 'same';
    });
    const w = calibrate(answers, 0);
    const top = Math.max(...Object.values(w.load));
    expect(w.load.masked_social).toBe(top);
  });
});

describe('weight stepping', () => {
  it('steps along the fixed scale and stops at the ends', () => {
    expect(stepWeight(1.8, 1)).toBe(2.3);
    expect(stepWeight(1.8, -1)).toBe(1.4);
    expect(stepWeight(3.6, 1)).toBe(3.6);
    expect(stepWeight(1.0, -1)).toBe(1.0);
  });
  it('snaps arbitrary values onto the scale', () => {
    expect(snapToScale(2.0)).toBe(1.8);
    expect(snapToScale(3.4)).toBe(3.6);
  });
});

describe('refit', () => {
  const weeks = busyFx.weeks as Week[];

  it('does nothing under 8 marker weeks', () => {
    const prior = defaultWeights();
    const result = refit(weeks.slice(0, 5), prior, 999);
    expect(result).toBe(prior);
  });

  it('never moves a weight beyond ±40% of its calibrated value', () => {
    const prior = defaultWeights();
    const result = refit(weeks, prior, 999);
    for (const cat of Object.keys(prior.load) as (keyof typeof prior.load)[]) {
      expect(result.load[cat]).toBeGreaterThanOrEqual(prior.load[cat] * 0.6 - 1e-9);
      expect(result.load[cat]).toBeLessThanOrEqual(prior.load[cat] * 1.4 + 1e-9);
    }
  });

  it('never touches a pinned weight', () => {
    const prior = { ...defaultWeights(), pinned: { masked_social: true } };
    // Vary the data so a refit could plausibly move weights.
    const varied = weeks.map((w, i) => ({
      ...w,
      markers: { emptiness: (i % 4) as 0 | 1 | 2 | 3, skillLoss: 0 as const, stimulusTolerance: 1 as const },
    }));
    const result = refit(varied, prior, 999);
    expect(result.load.masked_social).toBe(prior.load.masked_social);
  });
});
