// Storage — FALLOW-SPEC.md §9. Local-first, everything in IndexedDB via
// Dexie. No accounts, no server, no analytics on content.

import Dexie, { type EntityTable } from 'dexie';
import type { Entry, FunctionMarkers, Settings, TaughtRule, Weights } from '../model/types';

export interface WeekRecord {
  id: string;
  startDate: string;
  markers: FunctionMarkers | null;
  checkIn: 'none' | 'quick' | 'full';
  recoveryKnown: boolean;
}

export interface KV {
  key: string;
  value: unknown;
}

export const db = new Dexie('fallow') as Dexie & {
  weeks: EntityTable<WeekRecord, 'id'>;
  entries: EntityTable<Entry, 'id'>;
  rules: EntityTable<TaughtRule, 'id'>;
  kv: EntityTable<KV, 'key'>;
};

db.version(1).stores({
  weeks: 'id',
  entries: 'id, weekId, sourceEventId',
  rules: 'id, titleKey',
  kv: 'key',
});

export async function getWeights(): Promise<Weights | null> {
  const row = await db.kv.get('weights');
  return (row?.value as Weights) ?? null;
}

export async function putWeights(w: Weights): Promise<void> {
  await db.kv.put({ key: 'weights', value: w });
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  checkInDay: 0,
  lowCapacity: false,
  onboarded: false,
  excludedCalendars: [],
};

export async function getSettings(): Promise<Settings> {
  const row = await db.kv.get('settings');
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) };
}

export async function putSettings(s: Settings): Promise<void> {
  await db.kv.put({ key: 'settings', value: s });
}

export async function deleteEverything(): Promise<void> {
  await db.transaction('rw', db.weeks, db.entries, db.rules, db.kv, async () => {
    await Promise.all([db.weeks.clear(), db.entries.clear(), db.rules.clear(), db.kv.clear()]);
  });
}
