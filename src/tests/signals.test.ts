// M1 acceptance — FALLOW-SPEC.md §11. These three fixtures encode the
// thesis and must pass before any UI is built.

import { describe, expect, it } from 'vitest';
import droughtFx from '../fixtures/drought.json';
import sparseFx from '../fixtures/sparse.json';
import busyFx from '../fixtures/busy-but-fine.json';
import type { Week } from '../model/types';
import { defaultWeights } from '../model/weights';
import { detectSignal } from '../model/signals';
import { observationText } from '../model/observations';

const weights = defaultWeights();
const droughtWeeks = droughtFx.weeks as Week[];
const sparseWeeks = sparseFx.weeks as Week[];
const busyWeeks = busyFx.weeks as Week[];

const WARNING_PATTERNS = ['skill_loss', 'drought', 'collapse', 'deficit'];

describe('drought.json — the happy path', () => {
  it('fires exactly one observation: skill-loss drift (markers are set)', () => {
    const signal = detectSignal(droughtWeeks, weights);
    expect(signal.pattern).toBe('skill_loss');
    const text = observationText(signal, weights);
    expect(text).toBeTruthy();
  });

  it('fires drought when markers are stripped', () => {
    const noMarkers = droughtWeeks.map((w) => ({ ...w, markers: null }));
    const signal = detectSignal(noMarkers, weights);
    expect(signal.pattern).toBe('drought');
    expect(signal.runLength).toBeGreaterThanOrEqual(3);
  });

  it('only ever surfaces one observation — the result is a single pattern, never a list', () => {
    const signal = detectSignal(droughtWeeks, weights);
    expect(typeof signal.pattern).toBe('string');
    expect(observationText(signal, weights)?.split('\n')).toHaveLength(1);
  });
});

describe('sparse.json — unknown is never zero', () => {
  it('produces no warning of any kind', () => {
    const signal = detectSignal(sparseWeeks, weights);
    expect(WARNING_PATTERNS).not.toContain(signal.pattern);
  });

  it('still produces no warning if all known weeks were quick check-ins', () => {
    const quick = sparseWeeks.map((w) =>
      w.recoveryKnown
        ? { ...w, checkIn: 'quick' as const, markers: null, recoveryKnown: false,
            entries: w.entries.filter((e) => e.kind === 'load') }
        : w,
    );
    const signal = detectSignal(quick, weights);
    expect(WARNING_PATTERNS).not.toContain(signal.pattern);
  });

  it('excludes unknown weeks from consecutive-week counts without breaking runs', () => {
    // Interleave unknown weeks into a genuine drought: the run must still count.
    const drought = droughtWeeks
      .map((w) => ({ ...w, markers: null }))
      .map((w, i) =>
        i === 7 || i === 9
          ? { ...w, recoveryKnown: false, checkIn: 'quick' as const,
              entries: w.entries.filter((e) => e.kind === 'load') }
          : w,
      );
    const signal = detectSignal(drought, weights);
    expect(signal.pattern).toBe('drought');
  });
});

describe('busy-but-fine.json — load alone is not the signal', () => {
  it('produces no warning', () => {
    const signal = detectSignal(busyWeeks, weights);
    expect(WARNING_PATTERNS).not.toContain(signal.pattern);
  });

  it('renders the busy-but-fine neutral line, which is never a warning', () => {
    const signal = detectSignal(busyWeeks, weights);
    const text = observationText(signal, weights);
    expect(text).toBe('Full weeks, but the time to yourself is still there.');
  });
});

describe('signal details', () => {
  it('says nothing under 3 known weeks', () => {
    const few = busyWeeks.slice(0, 2);
    const signal = detectSignal(few, weights);
    expect(observationText(signal, weights)).toBeNull();
  });

  it('never renders severity as a number, score, percentage, or risk level', () => {
    for (const weeks of [droughtWeeks, sparseWeeks, busyWeeks]) {
      const text = observationText(detectSignal(weeks, weights), weights) ?? '';
      expect(text).not.toMatch(/\d+%/);
      expect(text.toLowerCase()).not.toMatch(/\b(risk|score|level)\b/);
    }
  });

  it('detects category collapse with a since-month observation', () => {
    // Flow regularly present for 8 weeks, then absent for the last 4.
    const weeks: Week[] = busyWeeks.map((w, i) => ({
      ...w,
      markers: null,
      entries:
        i >= 8
          ? w.entries.filter((e) => e.category !== 'flow')
          : w.entries,
    }));
    const signal = detectSignal(weeks, weights);
    expect(signal.pattern).toBe('collapse');
    expect(signal.category).toBe('flow');
    const text = observationText(signal, weights) ?? '';
    expect(text).toMatch(/^No time deep in something since [A-Z]/);
  });

  it('detects sustained deficit after 4 consecutive negative-balance known weeks', () => {
    const weeks: Week[] = busyWeeks.map((w, i) => ({
      ...w,
      markers: null,
      entries:
        i >= 8
          ? w.entries.map((e) => (e.kind === 'recovery' ? { ...e, hours: e.hours * 0.45 } : e))
          : w.entries,
    }));
    const signal = detectSignal(weeks, weights);
    expect(signal.pattern).toBe('deficit');
    expect(observationText(signal, weights)).toBe('More going out than coming in, four weeks now.');
  });
});
