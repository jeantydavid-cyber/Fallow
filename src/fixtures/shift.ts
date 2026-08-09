// Dev helper: re-date fixture weeks so the newest fixture week is the most
// recently finished week, letting fixtures drive the live screens.

import type { Week } from '../model/types';
import { addWeeks, isoWeekId, sortWeekIds, weekStartDate } from '../model/week';

export function shiftToRecent(weeks: Week[]): Week[] {
  if (!weeks.length) return weeks;
  const ids = sortWeekIds(weeks.map((w) => w.id));
  const last = ids[ids.length - 1];
  const target = addWeeks(isoWeekId(new Date()), -1);
  // Walk the offset out week by week (ISO week arithmetic has no subtraction).
  let offset = 0;
  let cursor = last;
  while (cursor < target && offset < 520) {
    cursor = addWeeks(cursor, 1);
    offset++;
  }
  while (cursor > target && offset > -520) {
    cursor = addWeeks(cursor, -1);
    offset--;
  }
  return weeks.map((w) => {
    const id = addWeeks(w.id, offset);
    return {
      ...w,
      id,
      startDate: weekStartDate(id),
      entries: w.entries.map((e) => ({ ...e, weekId: id })),
    };
  });
}
