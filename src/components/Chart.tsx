// Rest / demands chart — COMPONENTS.md §4, DESIGN-TOKENS.md §7.
//
// Rules that must not soften:
// - the horizon line is ONE continuous element (segments read as dashed,
//   and dashed means "not sure")
// - demands hang downward and never grow up
// - zero rest is a bare line; not-sure is a dashed ghost at the last known
//   height — confusing them manufactures droughts
// - scales are the person's own 26-week maximum; no axis, no numbers

import { useMemo, useRef } from 'react';
import type { Week, Weights } from '../model/types';
import { continuousWeeks, deriveWeek } from '../model/week';
import { HOME } from '../copy';

const ABOVE = 64;
const BELOW = 56;
const MINI_ABOVE = 26;
const MINI_BELOW = 27;

export type ColumnState = 'known' | 'zero-rest' | 'not-sure' | 'skipped' | 'projected';

export interface ChartColumn {
  weekId: string;
  state: ColumnState;
  rest: number; // weighted
  demands: number; // weighted
  /** For not-sure columns: ghost height source (last known rest). */
  ghostRest: number;
}

export function columnsFromWeeks(weeks: Week[], weights: Weights, windowSize = 12): ChartColumn[] {
  const filled = continuousWeeks(weeks).slice(-windowSize);
  let lastKnownRest = 0;
  // Seed the ghost height from history before the window.
  const all = continuousWeeks(weeks);
  for (const w of all.slice(0, Math.max(0, all.length - windowSize))) {
    if (w.recoveryKnown) lastKnownRest = deriveWeek(w, weights).weightedRecovery;
  }
  return filled.map((w) => {
    const d = deriveWeek(w, weights);
    const skipped = w.checkIn === 'none' && w.entries.length === 0;
    let state: ColumnState;
    if (skipped) state = 'skipped';
    else if (!w.recoveryKnown) state = 'not-sure';
    else if (d.weightedRecovery === 0) state = 'zero-rest';
    else state = 'known';
    const col: ChartColumn = {
      weekId: w.id,
      state,
      rest: d.weightedRecovery,
      demands: d.weightedLoad,
      ghostRest: lastKnownRest,
    };
    if (w.recoveryKnown) lastKnownRest = d.weightedRecovery;
    return col;
  });
}

/** The person's own maximum over up to 26 weeks — the only scale there is. */
export function chartScale(weeks: Week[], weights: Weights): { maxRest: number; maxDemand: number } {
  const recent = continuousWeeks(weeks).slice(-26);
  let maxRest = 1;
  let maxDemand = 1;
  for (const w of recent) {
    const d = deriveWeek(w, weights);
    if (w.recoveryKnown) maxRest = Math.max(maxRest, d.weightedRecovery);
    maxDemand = Math.max(maxDemand, d.weightedLoad);
  }
  return { maxRest, maxDemand };
}

interface ChartProps {
  columns: ChartColumn[];
  maxRest: number;
  maxDemand: number;
  mini?: boolean;
  onSelect?: (weekId: string) => void;
}

export function Chart({ columns, maxRest, maxDemand, mini, onSelect }: ChartProps) {
  const above = mini ? MINI_ABOVE : ABOVE;
  const below = mini ? MINI_BELOW : BELOW;
  const listRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(
    () =>
      columns.map((c) => ({
        week: c.weekId,
        rest: c.state === 'not-sure' ? 'not recorded' : c.state === 'skipped' ? 'nothing recorded' : `${Math.round(c.rest)}`,
        demands: c.state === 'skipped' ? 'nothing recorded' : `${Math.round(c.demands)}`,
        status: c.state,
      })),
    [columns],
  );

  const moveFocus = (from: number, delta: number) => {
    const next = Math.min(columns.length - 1, Math.max(0, from + delta));
    const el = listRef.current?.children[next] as HTMLElement | undefined;
    el?.focus();
  };

  return (
    <div className={mini ? 'chart-mini' : undefined}>
      {/* The frame keeps its full height even with no columns, so the horizon
          line stays inside the chart. With no history the line alone is the
          empty state (SCREENS.md §8) — it must never escape the card. */}
      <div
        className="chart"
        ref={listRef}
        style={{ height: above + 2 + below }}
        role={onSelect ? undefined : 'img'}
        aria-label="Rest and demands by week"
      >
        {columns.map((c, i) => {
          const restH = Math.round((Math.min(c.rest, maxRest) / maxRest) * above);
          const ghostH = Math.round((Math.min(c.ghostRest, maxRest) / maxRest) * above);
          const demandH = Math.round((Math.min(c.demands, maxDemand) / maxDemand) * below);
          const interactive = Boolean(onSelect);
          return (
            <div
              key={c.weekId}
              className="chart-col"
              tabIndex={interactive ? (i === columns.length - 1 ? 0 : -1) : undefined}
              role={interactive ? 'button' : undefined}
              aria-label={interactive ? `Week of ${c.weekId}, ${c.state === 'not-sure' ? 'rest not recorded' : c.state === 'skipped' ? 'nothing recorded' : 'recorded'}` : undefined}
              onClick={interactive ? () => onSelect?.(c.weekId) : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === 'ArrowLeft') { e.preventDefault(); moveFocus(i, -1); }
                      if (e.key === 'ArrowRight') { e.preventDefault(); moveFocus(i, 1); }
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(c.weekId); }
                    }
                  : undefined
              }
            >
              <div className="chart-above">
                {c.state === 'known' && restH > 0 && <div className="bar-rest" style={{ height: restH }} />}
                {c.state === 'not-sure' && ghostH > 2 && <div className="bar-unknown" style={{ height: ghostH }} />}
                {c.state === 'projected' && restH > 0 && <div className="bar-projected-rest" style={{ height: restH }} />}
              </div>
              <div className="chart-spacer" />
              <div className="chart-below">
                {(c.state === 'known' || c.state === 'zero-rest' || c.state === 'not-sure') && demandH > 0 && (
                  <div className="bar-demand" style={{ height: demandH }} />
                )}
                {c.state === 'projected' && demandH > 0 && <div className="bar-projected-demand" style={{ height: demandH }} />}
              </div>
            </div>
          );
        })}
        <div className="chart-line" style={{ top: above }} />
      </div>

      {!mini && (
        <div className="chart-legend legend-text">
          <span className="legend-item"><span className="swatch swatch-rest" /> {HOME.legendRest}</span>
          <span className="legend-item"><span className="swatch swatch-demand" /> {HOME.legendDemands}</span>
          <span className="legend-item"><span className="swatch swatch-unknown" /> {HOME.legendNotSure}</span>
        </div>
      )}

      {/* Wrapped: a bare table ignores the 1px clip and widens the page. */}
      <div className="visually-hidden">
      <table>
        <caption>Rest and demands by week</caption>
        <thead>
          <tr><th>Week</th><th>Rest</th><th>Demands</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.week}>
              <td>{r.week}</td><td>{r.rest}</td><td>{r.demands}</td><td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
