import { describe, expect, it } from 'vitest';
import { eventHours, parseIcs } from '../calendar/ics';
import { classifyEvent, eventsToWeeks, normaliseTitle } from '../calendar/classify';
import type { TaughtRule, Week } from '../model/types';

const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
X-WR-CALNAME:Work
BEGIN:VEVENT
UID:ev-1
SUMMARY:Standup
DTSTART:20260803T090000Z
DTEND:20260803T093000Z
RRULE:FREQ=WEEKLY
END:VEVENT
BEGIN:VEVENT
UID:ev-2
SUMMARY:Dinner with the team
DTSTART:20260805T180000Z
DTEND:20260805T210000Z
END:VEVENT
BEGIN:VEVENT
UID:ev-3
SUMMARY:Pottery
DTSTART:20260807T100000Z
DTEND:20260807T120000Z
END:VEVENT
END:VCALENDAR`;

describe('ics parsing', () => {
  it('parses events with duration and recurrence', () => {
    const events = parseIcs(SAMPLE_ICS);
    expect(events).toHaveLength(3);
    expect(events[0].title).toBe('Standup');
    expect(events[0].recurring).toBe(true);
    expect(eventHours(events[0])).toBe(0.5);
    expect(events[0].calendarName).toBe('Work');
  });

  it('rejects non-ics files', () => {
    expect(() => parseIcs('hello')).toThrow();
  });
});

describe('classification', () => {
  const rules: TaughtRule[] = [
    { id: 'r1', titleKey: 'standup', kind: 'load', category: 'masked_social', hours: 0.5 },
  ];

  it('applies taught rules with confidence', () => {
    const events = parseIcs(SAMPLE_ICS);
    const c = classifyEvent(events[0], rules);
    expect(c.category).toBe('masked_social');
    expect(c.confident).toBe(true);
    expect(c.hours).toBe(0.5);
  });

  it('heuristics produce guesses, not confirmations', () => {
    const events = parseIcs(SAMPLE_ICS);
    const dinner = classifyEvent(events[1], []);
    expect(dinner.category).toBe('masked_social');
    expect(dinner.confident).toBe(false); // asked about in the check-in
  });

  it('unfamiliar events arrive as unconfirmed guesses', () => {
    const events = parseIcs(SAMPLE_ICS);
    const pottery = classifyEvent(events[2], []);
    expect(pottery.confident).toBe(false);
  });

  it('normalises titles so recurring events match once taught', () => {
    expect(normaliseTitle('  Standup ')).toBe('standup');
    expect(normaliseTitle('STANDUP')).toBe('standup');
  });
});

describe('eventsToWeeks', () => {
  it('creates guess entries in the right ISO weeks, never duplicating', () => {
    const events = parseIcs(SAMPLE_ICS);
    const once = eventsToWeeks(events, [], [], []);
    expect(once).toHaveLength(1);
    expect(once[0].id).toBe('2026-W32');
    expect(once[0].entries).toHaveLength(3);
    expect(once[0].recoveryKnown).toBe(false);
    const twice = eventsToWeeks(events, [], once, []);
    expect(twice[0].entries).toHaveLength(3);
  });

  it('never touches a reviewed week', () => {
    const reviewed: Week = {
      id: '2026-W32', startDate: '2026-08-03', entries: [], markers: null,
      checkIn: 'full', recoveryKnown: true,
    };
    const events = parseIcs(SAMPLE_ICS);
    const out = eventsToWeeks(events, [], [reviewed], []);
    expect(out[0].entries).toHaveLength(0);
  });

  it('respects excluded calendars', () => {
    const events = parseIcs(SAMPLE_ICS);
    const out = eventsToWeeks(events, [], [], ['Work']);
    expect(out).toHaveLength(0);
  });
});
