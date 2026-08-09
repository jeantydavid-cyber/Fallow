// App state — a thin context over Dexie. All data stays on-device.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Settings, TaughtRule, Week, Weights } from '../model/types';
import { defaultWeights } from '../model/weights';
import { db, deleteEverything, DEFAULT_SETTINGS, getSettings, getWeights, putSettings, putWeights } from '../db/db';
import { loadWeeks, replaceAllWeeks, saveWeek as repoSaveWeek } from '../db/repo';

interface Store {
  ready: boolean;
  storageBlocked: boolean;
  weeks: Week[];
  weights: Weights;
  settings: Settings;
  rules: TaughtRule[];
  saveWeek: (w: Week) => Promise<void>;
  setWeights: (w: Weights) => Promise<void>;
  setSettings: (s: Settings) => Promise<void>;
  addRule: (r: TaughtRule) => Promise<void>;
  importWeeks: (weeks: Week[], mode: 'replace' | 'merge') => Promise<void>;
  wipe: () => Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [weights, setWeightsState] = useState<Weights>(() => defaultWeights(Date.now()));
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [rules, setRules] = useState<TaughtRule[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // Dev-only: ?fixture=drought|sparse|busy-but-fine seeds the store so
        // screens can be reviewed against the acceptance fixtures.
        const fixture = new URLSearchParams(window.location.search).get('fixture');
        if (fixture && ['drought', 'sparse', 'busy-but-fine', 'empty', 'first-run'].includes(fixture)) {
          const shift = (await import('../fixtures/shift')).shiftToRecent;
          let fxWeeks: Week[] = [];
          if (fixture !== 'empty') {
            const name = fixture === 'first-run' ? 'busy-but-fine' : fixture;
            const data = await import(`../fixtures/${name}.json`);
            fxWeeks = shift(data.weeks as Week[]);
            if (fixture === 'first-run') fxWeeks = fxWeeks.slice(-1);
          }
          setWeeks(fxWeeks);
          setSettingsState({ ...DEFAULT_SETTINGS, onboarded: true });
          setReady(true);
          return;
        }
        const [w, wt, s, r] = await Promise.all([
          loadWeeks(),
          getWeights(),
          getSettings(),
          db.rules.toArray(),
        ]);
        setWeeks(w);
        if (wt) setWeightsState(wt);
        setSettingsState(s);
        setRules(r);
      } catch {
        setStorageBlocked(true);
      }
      setReady(true);
    })();
  }, []);

  // Theme is manual and sticky — it does not follow the system.
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  const saveWeek = useCallback(async (w: Week) => {
    setWeeks((prev) => {
      const rest = prev.filter((p) => p.id !== w.id);
      return [...rest, w].sort((a, b) => (a.id < b.id ? -1 : 1));
    });
    try { await repoSaveWeek(w); } catch { setStorageBlocked(true); }
  }, []);

  const setWeights = useCallback(async (w: Weights) => {
    setWeightsState(w);
    try { await putWeights(w); } catch { setStorageBlocked(true); }
  }, []);

  const setSettings = useCallback(async (s: Settings) => {
    setSettingsState(s);
    try { await putSettings(s); } catch { setStorageBlocked(true); }
  }, []);

  const addRule = useCallback(async (r: TaughtRule) => {
    setRules((prev) => [...prev.filter((p) => p.titleKey !== r.titleKey), r]);
    try { await db.rules.put(r); } catch { setStorageBlocked(true); }
  }, []);

  const importWeeks = useCallback(async (incoming: Week[], mode: 'replace' | 'merge') => {
    let next: Week[] = [];
    setWeeks((prev) => {
      if (mode === 'replace') next = [...incoming];
      else {
        const byId = new Map(prev.map((w) => [w.id, w]));
        for (const w of incoming) {
          const existing = byId.get(w.id);
          if (!existing || existing.checkIn === 'none') byId.set(w.id, w);
        }
        next = [...byId.values()];
      }
      next.sort((a, b) => (a.id < b.id ? -1 : 1));
      return next;
    });
    try { await replaceAllWeeks(next); } catch { setStorageBlocked(true); }
  }, []);

  const wipe = useCallback(async () => {
    setWeeks([]);
    setWeightsState(defaultWeights(Date.now()));
    setSettingsState(DEFAULT_SETTINGS);
    setRules([]);
    try { await deleteEverything(); } catch { setStorageBlocked(true); }
  }, []);

  const value = useMemo<Store>(
    () => ({ ready, storageBlocked, weeks, weights, settings, rules, saveWeek, setWeights, setSettings, addRule, importWeeks, wipe }),
    [ready, storageBlocked, weeks, weights, settings, rules, saveWeek, setWeights, setSettings, addRule, importWeeks, wipe],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside StoreProvider');
  return ctx;
}
