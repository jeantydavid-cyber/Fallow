// Reads and writes between the Dexie tables and the in-memory Week shape.

import { db, type WeekRecord } from './db';
import type { Entry, Week } from '../model/types';

export async function loadWeeks(): Promise<Week[]> {
  const [records, entries] = await Promise.all([db.weeks.toArray(), db.entries.toArray()]);
  const byWeek = new Map<string, Entry[]>();
  for (const e of entries) {
    const list = byWeek.get(e.weekId) ?? [];
    list.push(e);
    byWeek.set(e.weekId, list);
  }
  return records
    .map((r) => ({ ...r, entries: byWeek.get(r.id) ?? [] }))
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

export async function saveWeek(week: Week): Promise<void> {
  const record: WeekRecord = {
    id: week.id,
    startDate: week.startDate,
    markers: week.markers,
    checkIn: week.checkIn,
    recoveryKnown: week.recoveryKnown,
  };
  await db.transaction('rw', db.weeks, db.entries, async () => {
    await db.weeks.put(record);
    await db.entries.where('weekId').equals(week.id).delete();
    if (week.entries.length) await db.entries.bulkPut(week.entries);
  });
}

export async function replaceAllWeeks(weeks: Week[]): Promise<void> {
  await db.transaction('rw', db.weeks, db.entries, async () => {
    await db.weeks.clear();
    await db.entries.clear();
    for (const w of weeks) {
      await db.weeks.put({
        id: w.id,
        startDate: w.startDate,
        markers: w.markers,
        checkIn: w.checkIn,
        recoveryKnown: w.recoveryKnown,
      });
      if (w.entries.length) await db.entries.bulkPut(w.entries);
    }
  });
}
