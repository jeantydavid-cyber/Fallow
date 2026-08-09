// Example weeks — a made-up person's history, generated relative to today so
// the app has something to show before you have lived twelve weeks with it.
// Loaded from Settings and removable from the same place. Nothing here is
// real data and none of it is used by the tests.

import type { Entry, Week } from './types';
import { addWeeks, isoWeekId, weekStartDate } from './week';

let seq = 0;
const id = () => `demo-${++seq}`;

interface Spec {
  load: [string, Entry['category'], number, number?][]; // label, category, hours, dayOfWeek
  recovery: [Entry['category'], number][];
  markers: Week['markers'];
  checkIn: Week['checkIn'];
  recoveryKnown: boolean;
  /** Calendar-style rows the check-in will ask you to confirm. */
  unconfirmed?: boolean;
}

function makeWeek(weekId: string, spec: Spec): Week {
  const entries: Entry[] = [
    ...spec.load.map(([label, category, hours, dayOfWeek]) => ({
      id: id(),
      weekId,
      kind: 'load' as const,
      category,
      hours,
      label,
      source: spec.unconfirmed ? ('calendar' as const) : ('manual' as const),
      sourceEventId: spec.unconfirmed ? id() : null,
      confirmed: !spec.unconfirmed,
      dayOfWeek: dayOfWeek ?? null,
      // A title with no obvious meaning is the one the check-in asks about.
      needsReview: spec.unconfirmed === true && label.startsWith('Thursday'),
    })),
    ...spec.recovery.map(([category, hours]) => ({
      id: id(),
      weekId,
      kind: 'recovery' as const,
      category,
      hours,
      label: null,
      source: 'manual' as const,
      sourceEventId: null,
      confirmed: true,
      dayOfWeek: null,
    })),
  ];
  return {
    id: weekId,
    startDate: weekStartDate(weekId),
    entries,
    markers: spec.markers,
    checkIn: spec.checkIn,
    recoveryKnown: spec.recoveryKnown,
  };
}

const healthy = (variant: number): Spec => ({
  load: [
    ['Team meetings', 'masked_social', 6 + (variant % 3)],
    ['Admin catch-up', 'executive', 3],
    ['Weekly shop', 'sensory', 2],
  ],
  recovery: [
    ['solitude', 4],
    ['flow', 4],
    ['sensory_relief', 3],
    ...(variant % 2 === 0 ? ([['unstructured', 10]] as [Entry['category'], number][]) : []),
  ],
  markers: { emptiness: variant % 2 as 0 | 1, skillLoss: 0, stimulusTolerance: 1 },
  checkIn: 'full',
  recoveryKnown: true,
});

const stretched = (variant: number): Spec => ({
  load: [
    ['Project deadline', 'masked_social', 11 + variant],
    ['Forms and phone calls', 'executive', 5],
    ['Trip to the office', 'transition', 4],
    ...(variant === 2 ? ([['A row that went badly', 'conflict', 2]] as [string, Entry['category'], number][]) : []),
  ],
  recovery: [['solitude', 1]],
  markers: { emptiness: 2, skillLoss: 1, stimulusTolerance: 2 },
  checkIn: 'full',
  recoveryKnown: true,
});

/** Twelve weeks of history plus two weeks ahead.
    - the last finished week is left unreviewed, with calendar-style rows, so
      the check-in has something real to confirm
    - one week is skipped and one was a quick check-in, so the chart shows an
      empty column and a dashed "not sure" column
    - rest tails off over the last three reviewed weeks, so an observation
      appears instead of an empty home screen
    - the two weeks ahead carry named events, so "Coming up" has something to
      move and a free Saturday to protect */
export function demoWeeks(today = new Date()): Week[] {
  const last = addWeeks(isoWeekId(today), -1); // most recent finished week
  const at = (back: number) => addWeeks(last, -back);
  const weeks: Week[] = [];

  // Oldest first: six steady weeks.
  for (let i = 11; i >= 6; i--) weeks.push(makeWeek(at(i), healthy(i)));

  // A skipped week — normal, never counted, never mentioned.
  weeks.push({
    id: at(5), startDate: weekStartDate(at(5)), entries: [],
    markers: null, checkIn: 'none', recoveryKnown: false,
  });

  // A quick check-in: demands recorded, rest unknown — not zero.
  weeks.push(
    makeWeek(at(4), {
      load: [['Back-to-back meetings', 'masked_social', 9], ['Admin', 'executive', 4]],
      recovery: [],
      markers: null,
      checkIn: 'quick',
      recoveryKnown: false,
    }),
  );

  // Three stretched weeks: rest drops away.
  for (let i = 3; i >= 1; i--) weeks.push(makeWeek(at(i), stretched(i)));

  // Last finished week: not looked at yet, rows waiting to be confirmed.
  weeks.push(
    makeWeek(last, {
      load: [
        ['Monday standup', 'masked_social', 0.5, 0],
        ['Quarterly review', 'masked_social', 3, 2],
        ['Dentist', 'executive', 1, 3],
        ['Thursday 7pm', 'masked_social', 2, 3],
        ['Friday drinks', 'masked_social', 4, 4],
      ],
      recovery: [],
      markers: null,
      checkIn: 'none',
      recoveryKnown: false,
      unconfirmed: true,
    }),
  );

  // Two weeks ahead, for "Coming up". Saturday and Sunday stay clear.
  const thisWeek = isoWeekId(today);
  weeks.push(
    makeWeek(thisWeek, {
      load: [
        ['Monday standup', 'masked_social', 0.5, 0],
        ['All-day workshop', 'masked_social', 8, 2],
        ['Train to head office', 'transition', 3, 3],
      ],
      recovery: [],
      markers: null,
      checkIn: 'none',
      recoveryKnown: false,
    }),
  );
  weeks.push(
    makeWeek(addWeeks(thisWeek, 1), {
      load: [
        ["Sam's birthday dinner", 'masked_social', 4, 4],
        ['Renewal paperwork', 'executive', 2, 1],
      ],
      recovery: [],
      markers: null,
      checkIn: 'none',
      recoveryKnown: false,
    }),
  );

  return weeks;
}
