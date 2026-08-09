// Event classification — heuristic plus taught rules (FALLOW-SPEC.md §8).
// Recurring titles the user classifies once are remembered permanently.
// Anything unfamiliar arrives as a guess (confirmed: false) and is asked
// about inside the check-in, never in a separate flow.

import type { Category, Entry, TaughtRule, Week } from '../model/types';
import { RECOVERY_CATEGORIES } from '../model/types';
import { isoWeekId, weekStartDate } from '../model/week';
import { eventHours, type IcsEvent } from './ics';

export function normaliseTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim();
}

interface Heuristic {
  pattern: RegExp;
  category: Category;
}

const HEURISTICS: Heuristic[] = [
  { pattern: /\b(standup|stand-up|1:1|one on one|sync|meeting|review|retro|planning|interview|presentation|demo|all.hands|town.hall)\b/i, category: 'masked_social' },
  { pattern: /\b(party|dinner|drinks|wedding|reception|birthday|bbq|barbecue)\b/i, category: 'masked_social' },
  { pattern: /\b(concert|festival|gig|market|fair|game|match|stadium)\b/i, category: 'sensory' },
  { pattern: /\b(dentist|doctor|gp|bank|tax|form|admin|paperwork|call|phone|appointment|errand)\b/i, category: 'executive' },
  { pattern: /\b(flight|train|travel|drive|airport|trip|commute|move|moving)\b/i, category: 'transition' },
];

export interface Classified {
  category: Category;
  kind: 'load' | 'recovery';
  confident: boolean; // false → rendered as the app's guess until reviewed
  hours: number;
  ignored: boolean;
  /** True only when nothing matched and the app genuinely does not know. */
  needsReview?: boolean;
}

export function classifyEvent(event: IcsEvent, rules: TaughtRule[]): Classified {
  const key = normaliseTitle(event.title);
  const rule = rules.find((r) => r.titleKey === key);
  if (rule) {
    if (rule.kind === 'ignore' || rule.category === null) {
      return { category: 'masked_social', kind: 'load', confident: true, hours: 0, ignored: true };
    }
    return {
      category: rule.category,
      kind: rule.kind,
      confident: true,
      hours: rule.hours ?? eventHours(event),
      ignored: false,
      needsReview: false,
    };
  }
  for (const h of HEURISTICS) {
    if (h.pattern.test(event.title)) {
      const kind = (RECOVERY_CATEGORIES as string[]).includes(h.category) ? 'recovery' : 'load';
      // A guess, shown as a guess — but not a question.
      return { category: h.category, kind, confident: false, hours: eventHours(event), ignored: false, needsReview: false };
    }
  }
  // Nothing matched: the check-in asks about this one, once.
  return { category: 'masked_social', kind: 'load', confident: false, hours: eventHours(event), ignored: false, needsReview: true };
}

/** Turn calendar events into per-week guess entries, merged into existing
    weeks. Never overwrites a reviewed week and never duplicates an event. */
export function eventsToWeeks(
  events: IcsEvent[],
  rules: TaughtRule[],
  existing: Week[],
  excludedCalendars: string[],
): Week[] {
  const byId = new Map(existing.map((w) => [w.id, { ...w, entries: [...w.entries] }]));
  let seq = 0;
  for (const ev of events) {
    if (ev.calendarName && excludedCalendars.includes(ev.calendarName)) continue;
    const c = classifyEvent(ev, rules);
    if (c.ignored) continue;
    const weekId = isoWeekId(ev.start);
    const week =
      byId.get(weekId) ??
      ({ id: weekId, startDate: weekStartDate(weekId), entries: [], markers: null, checkIn: 'none', recoveryKnown: false } as Week);
    if (week.checkIn !== 'none') continue; // reviewed weeks are settled
    if (week.entries.some((e) => e.sourceEventId === ev.uid)) continue;
    const entry: Entry = {
      id: `cal-${ev.uid}-${++seq}`,
      weekId,
      kind: c.kind,
      category: c.category,
      hours: c.hours,
      label: ev.title,
      source: 'calendar',
      sourceEventId: ev.uid,
      confirmed: c.confident,
      dayOfWeek: (ev.start.getDay() + 6) % 7,
      needsReview: c.needsReview ?? false,
    };
    week.entries.push(entry);
    byId.set(weekId, week);
  }
  return [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
}
