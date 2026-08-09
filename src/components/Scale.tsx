// The scales on home: how full the week felt, and demands against rest.
//
// Rules carried over from the chart and not to be softened:
// - a mark's meaning is carried by its POSITION, so greyscale loses nothing
// - an unanswered week gets NO position on the scale. It sits in its own lane
//   underneath, as a dashed ring. Putting it mid-scale would read as "middling",
//   which is a value the person never gave; putting it at the bottom would read
//   as their worst week. It is neither.
// - the joining line only ever spans two weeks that were both answered, so it
//   never draws a value across a gap
// - no numbers, no ticks, no target line: the top of the scale is not
//   somewhere you are meant to be

import { SCALE } from '../copy';
import type { BalancePoint, FeelingPoint } from '../model/scale';

const FEEL_H = 84; // where answered weeks are plotted
const FEEL_PAD = 10; // half a mark, so top and bottom marks sit inside
const BAL_H = 54;
const BAL_PAD = 7;
const LANE_H = 20; // the unanswered lane, underneath the scale proper

/** Percent x of a column centre, so marks stay put at any width. */
function centreX(i: number, n: number): number {
  return ((i + 0.5) / n) * 100;
}

function Gutter({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="scale-gutter legend-text">
      <span>{top}</span>
      <span>{bottom}</span>
    </div>
  );
}

export function FeelingScale({ points }: { points: FeelingPoint[] }) {
  const n = Math.max(points.length, 1);
  const y = (level: number) => FEEL_PAD + (1 - level / 3) * (FEEL_H - FEEL_PAD * 2);

  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  points.forEach((p, i) => {
    const next = points[i + 1];
    if (p.level === null || !next || next.level === null) return;
    segments.push({ x1: centreX(i, n), y1: y(p.level), x2: centreX(i + 1, n), y2: y(next.level) });
  });

  return (
    <div className="scale-block">
      <p className="row-title scale-title">{SCALE.feelingTitle}</p>
      <div className="scale-body">
        <Gutter top={SCALE.feelingHigh} bottom={SCALE.feelingLow} />
        <div className="scale-plot" style={{ height: FEEL_H + LANE_H }}>
          <svg
            className="scale-lines"
            width="100%"
            height={FEEL_H}
            viewBox={`0 0 100 ${FEEL_H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            {segments.map((s, i) => (
              <line
                key={i}
                x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                stroke="var(--moss-bar)"
                strokeWidth={2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {points.map((p, i) => {
            if (p.skipped) return null;
            const x = `${centreX(i, n)}%`;
            return p.level === null ? (
              <span key={p.weekId} className="scale-mark scale-mark-unknown" style={{ left: x, top: FEEL_H + LANE_H / 2 }} />
            ) : (
              <span key={p.weekId} className="scale-mark" style={{ left: x, top: y(p.level) }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function BalanceScale({ points, extent }: { points: BalancePoint[]; extent: number }) {
  const n = Math.max(points.length, 1);
  const mid = BAL_H / 2;
  const y = (value: number) => mid - Math.max(-1, Math.min(1, value / extent)) * (mid - BAL_PAD);

  return (
    <div className="scale-block">
      <p className="caption scale-title">{SCALE.balanceTitle}</p>
      <div className="scale-body">
        <Gutter top={SCALE.balanceHigh} bottom={SCALE.balanceLow} />
        <div className="scale-plot" style={{ height: BAL_H + LANE_H }}>
          <span className="scale-middle" style={{ top: mid }} />
          {points.map((p, i) => {
            if (p.skipped) return null;
            const x = `${centreX(i, n)}%`;
            return p.known ? (
              <span
                key={p.weekId}
                className={`scale-tick ${p.value >= 0 ? 'scale-tick-in' : 'scale-tick-out'}`}
                style={{ left: x, top: y(p.value) }}
              />
            ) : (
              <span key={p.weekId} className="scale-tick scale-tick-unknown" style={{ left: x, top: BAL_H + LANE_H / 2 }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Both scales, the legend, and the screen-reader table. */
export function WeekScales({
  feeling,
  balance,
  extent,
  onSelect,
}: {
  feeling: FeelingPoint[];
  balance: BalancePoint[];
  extent: number;
  onSelect?: (weekId: string) => void;
}) {
  const n = Math.max(feeling.length, 1);
  return (
    <div className="scales">
      <FeelingScale points={feeling} />
      <BalanceScale points={balance} extent={extent} />

      <div className="chart-legend legend-text">
        <span className="legend-item"><span className="swatch swatch-rest" /> {SCALE.legendAnswered}</span>
        <span className="legend-item"><span className="swatch swatch-unknown" /> {SCALE.legendUnanswered}</span>
      </div>

      {onSelect && (
        <div className="scale-hits">
          {feeling.map((p, i) => (
            <button
              key={p.weekId}
              type="button"
              className="scale-hit"
              style={{ left: `${(i / n) * 100}%`, width: `${100 / n}%` }}
              onClick={() => onSelect(p.weekId)}
            >
              <span className="visually-hidden">{SCALE.weekLabel(p.weekId)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Wrapped: a bare table ignores the 1px clip and widens the page. */}
      <div className="visually-hidden">
      <table>
        <caption>{SCALE.srCaption}</caption>
        <thead>
          <tr><th>Week</th><th>{SCALE.feelingTitle}</th><th>{SCALE.balanceTitle}</th></tr>
        </thead>
        <tbody>
          {feeling.map((p, i) => (
            <tr key={p.weekId}>
              <td>{p.weekId}</td>
              <td>{p.skipped ? SCALE.srSkipped : p.level === null ? SCALE.srUnanswered : SCALE.srLevels[p.level]}</td>
              <td>
                {balance[i]?.skipped
                  ? SCALE.srSkipped
                  : balance[i]?.known
                    ? balance[i].value >= 0 ? SCALE.balanceHigh : SCALE.balanceLow
                    : SCALE.srUnanswered}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
