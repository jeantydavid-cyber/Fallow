// The lever — SCREENS.md §4. Items heaviest first by this person's weights;
// acting on a row updates the projection within 180ms and never re-sorts
// the list under the user's finger. Decline drafts are copyable text the
// user sends themself.

import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { ensureWeek, findFreeDay, projectionWeeks, upcomingItems, type LeverItem } from '../model/lever';
import { deriveWeek, monthNameOf } from '../model/week';
import { Chart, chartScale, type ChartColumn } from '../components/Chart';
import { Button } from '../components/controls';
import { Icon, CATEGORY_ICONS } from '../components/Icon';
import { CATEGORY_NAMES, CHECKIN, EMPTY, LEVER, WEEK_DETAIL } from '../copy';
import type { Entry, RecoveryCategory, Week } from '../model/types';

type Acted =
  | { kind: 'declined' }
  | { kind: 'half'; originalHours: number };

export function Lever() {
  const nav = useNavigate();
  const { weeks, weights, saveWeek } = useStore();

  // Frozen at mount: the order never changes under the user's finger.
  const initialItems = useRef<LeverItem[] | null>(null);
  if (initialItems.current === null) initialItems.current = upcomingItems(weeks, weights);
  const items = initialItems.current;

  const [acted, setActed] = useState<Record<string, Acted>>({});
  const [protectedDay, setProtectedDay] = useState(false);
  const freeDay = useMemo(() => findFreeDay(weeks), [weeks]);

  const persistHours = async (item: LeverItem, hours: number) => {
    const week = ensureWeek(weeks, item.weekId);
    const next: Week = {
      ...week,
      entries: week.entries.map((e) => (e.id === item.entry.id ? { ...e, hours } : e)),
    };
    await saveWeek(next);
  };

  const decline = async (item: LeverItem) => {
    const draft = item.entry.label && /standup|meeting|review|work|sync/i.test(item.entry.label)
      ? LEVER.drafts.work
      : LEVER.drafts.personal;
    try { await navigator.clipboard.writeText(draft); } catch { /* still shown below */ }
    setActed((a) => ({ ...a, [item.entry.id]: { kind: 'declined' } }));
    await persistHours(item, 0);
  };

  const goForHalf = async (item: LeverItem) => {
    setActed((a) => ({ ...a, [item.entry.id]: { kind: 'half', originalHours: item.entry.hours } }));
    await persistHours(item, Math.max(0.5, item.entry.hours / 2));
  };

  const undo = async (item: LeverItem) => {
    const was = acted[item.entry.id];
    setActed((a) => {
      const next = { ...a };
      delete next[item.entry.id];
      return next;
    });
    await persistHours(item, was?.kind === 'half' ? was.originalHours : item.entry.hours);
  };

  const protect = async () => {
    if (!freeDay) return;
    setProtectedDay(true);
    const week = ensureWeek(weeks, freeDay.weekId);
    const entry: Entry = {
      id: `protect-${freeDay.weekId}-${freeDay.dayName}`,
      weekId: freeDay.weekId,
      kind: 'recovery',
      category: 'unstructured' as RecoveryCategory,
      hours: 8,
      label: null,
      source: 'manual',
      sourceEventId: null,
      confirmed: false,
      dayOfWeek: null,
    };
    await saveWeek({ ...week, entries: [...week.entries.filter((e) => e.id !== entry.id), entry] });
  };

  // Mini projection: two past weeks solid, this week and next dashed.
  const projection = useMemo(() => {
    const cols = projectionWeeks();
    return cols.map(({ weekId, future }): ChartColumn => {
      const w = weeks.find((x) => x.id === weekId);
      const d = w ? deriveWeek(w, weights) : { weightedRecovery: 0, weightedLoad: 0, balance: 0 };
      if (future) {
        return { weekId, state: 'projected', rest: d.weightedRecovery, demands: d.weightedLoad, ghostRest: 0 };
      }
      if (!w || (w.checkIn === 'none' && w.entries.length === 0)) {
        return { weekId, state: 'skipped', rest: 0, demands: 0, ghostRest: 0 };
      }
      if (!w.recoveryKnown) {
        return { weekId, state: 'not-sure', rest: 0, demands: d.weightedLoad, ghostRest: d.weightedRecovery || 8 };
      }
      return { weekId, state: 'known', rest: d.weightedRecovery, demands: d.weightedLoad, ghostRest: 0 };
    });
  }, [weeks, weights]);

  const scale = useMemo(() => chartScale(weeks, weights), [weeks, weights]);
  const anyActed = protectedDay || Object.keys(acted).length > 0;

  if (items.length === 0 && !freeDay) {
    return (
      <main className="screen">
        <BackRow onBack={() => nav('/')} />
        <h1 className="screen-title">{LEVER.title}</h1>
        <p className="body-text">{EMPTY.leverEmpty}</p>
      </main>
    );
  }

  return (
    <main className="screen">
      <BackRow onBack={() => nav('/')} />
      <h1 className="screen-title">{LEVER.title}</h1>

      <div className="stack">
        {items.map((item, i) => {
          const state = acted[item.entry.id];
          const title = item.entry.label ?? CATEGORY_NAMES[item.entry.category];
          return (
            <div key={item.entry.id} className={`frow${state?.kind === 'declined' ? ' frow-declined' : ''}`}>
              <span className="frow-icon"><Icon name={CATEGORY_ICONS[item.entry.category]} size={26} /></span>
              <span className="frow-main">
                <span className="frow-title row-title">{title}</span>
                <span className="frow-sub">
                  {state?.kind === 'declined'
                    ? LEVER.declined
                    : i === 0 && item.dayName
                      ? LEVER.heaviest(item.dayName)
                      : CATEGORY_NAMES[item.entry.category]}
                </span>
                {i === 0 && !state && (
                  <span className="lever-actions">
                    <Button rank="secondary" onClick={() => decline(item)}>{LEVER.writeDecline}</Button>
                    <Button rank="secondary" onClick={() => goForHalf(item)}>{LEVER.goForHalf}</Button>
                  </span>
                )}
                {state && (
                  <span className="lever-actions">
                    <Button rank="quiet" onClick={() => undo(item)}>{LEVER.undo}</Button>
                  </span>
                )}
              </span>
              <span className="frow-trailing">
                {WEEK_DETAIL.hours(state?.kind === 'half' ? Math.max(0.5, item.entry.hours / 2) : item.entry.hours)}
              </span>
            </div>
          );
        })}

        {freeDay && !protectedDay && (
          <div className="frow frow-free">
            <span className="frow-icon"><Icon name="unstructured" size={26} /></span>
            <span className="frow-main">
              <span className="frow-title row-title">{LEVER.freeDay(freeDay.dayName)}</span>
              <span className="frow-sub">{LEVER.freeDaySub}</span>
            </span>
            <span className="frow-trailing">
              <Button rank="secondary" onClick={protect}>{LEVER.protectIt}</Button>
            </span>
          </div>
        )}
        {freeDay && protectedDay && (
          <div className="frow frow-free frow-protected">
            <span className="frow-icon"><Icon name="unstructured" size={26} /></span>
            <span className="frow-main">
              <span className="frow-title row-title">{LEVER.protectedDay(freeDay.dayName)}</span>
              <span className="frow-sub">{LEVER.protectedSub}</span>
            </span>
            <span className="frow-trailing">
              <Button rank="quiet" onClick={() => setProtectedDay(false)}>{LEVER.undo}</Button>
            </span>
          </div>
        )}
      </div>

      <section className="card">
        <Chart columns={projection} maxRest={scale.maxRest} maxDemand={scale.maxDemand} mini />
        {anyActed && freeDay && (
          <p className="caption" style={{ marginTop: 8 }}>
            {firstClearSince(weeks) ? LEVER.projectionFirstClear(firstClearSince(weeks)!) : LEVER.projection(freeDay.dayName)}
          </p>
        )}
      </section>
    </main>
  );
}

function firstClearSince(weeks: Week[]): string | null {
  // A clear day claim needs history: the last week with an unstructured entry.
  const withClear = weeks.filter((w) =>
    w.recoveryKnown && w.entries.some((e) => e.category === 'unstructured' && e.hours > 0),
  );
  const last = withClear.at(-1);
  if (!last) return null;
  const gap = weeks.filter((w) => w.id > last.id && w.recoveryKnown).length;
  return gap >= 6 ? monthNameOf(last.id) : null;
}

export function BackRow({ onBack }: { onBack: () => void }) {
  return (
    <div className="checkin-header">
      <button type="button" className="btn btn-quiet back-btn" onClick={onBack}>
        <Icon name="chevron-left" size={22} />
        <span>{CHECKIN.back}</span>
      </button>
    </div>
  );
}
