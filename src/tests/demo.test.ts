// The example weeks are a demo, but they still have to behave like real data:
// if they tripped a false warning or crashed the signal logic, the first
// thing anyone sees would be wrong.

import { describe, expect, it } from 'vitest';
import { demoWeeks } from '../model/demo';
import { detectSignal } from '../model/signals';
import { observationText } from '../model/observations';
import { defaultWeights } from '../model/weights';
import { isoWeekId } from '../model/week';
import { readyWeekId } from '../model/checkin';
import { upcomingItems } from '../model/lever';

const weights = defaultWeights();
const today = new Date('2026-08-09T12:00:00Z');
const weeks = demoWeeks(today);
const past = weeks.filter((w) => w.id < isoWeekId(today));

describe('example weeks', () => {
  it('produce a single observation on home', () => {
    const signal = detectSignal(past, weights);
    const text = observationText(signal, weights);
    expect(text).toBeTruthy();
    expect(text!.split('\n')).toHaveLength(1);
  });

  it('leave the last finished week ready to check in, with rows to confirm', () => {
    const ready = readyWeekId(weeks, today);
    expect(ready).not.toBeNull();
    const week = weeks.find((w) => w.id === ready)!;
    expect(week.entries.length).toBeGreaterThan(0);
    expect(week.entries.every((e) => !e.confirmed)).toBe(true);
  });

  it('include a skipped week and an unknown-rest week, and never fake zero rest', () => {
    expect(past.some((w) => w.checkIn === 'none' && w.entries.length === 0)).toBe(true);
    const quick = past.find((w) => w.checkIn === 'quick');
    expect(quick).toBeDefined();
    expect(quick!.recoveryKnown).toBe(false);
    expect(quick!.entries.some((e) => e.kind === 'recovery')).toBe(false);
  });

  it('give the lever something to move', () => {
    const items = upcomingItems(weeks, weights, today);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].cost).toBeGreaterThanOrEqual(items[items.length - 1].cost);
  });

  it('regenerate relative to whatever today is', () => {
    const later = new Date('2027-01-18T12:00:00Z');
    const other = demoWeeks(later);
    expect(other.at(-1)!.id).not.toBe(weeks.at(-1)!.id);
    expect(readyWeekId(other, later)).not.toBeNull();
  });
});
