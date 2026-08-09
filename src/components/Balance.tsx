// A weighing scale. Demands in one pan, rest in the other; the beam tilts
// toward whichever weighed more that week.
//
// Rules that hold from the old chart:
// - the TILT carries the meaning, so greyscale loses nothing
// - a week with no rest recorded is never drawn level. Level means weighed
//   and balanced. An unweighed week shows an empty stand instead, because
//   the app must not claim a week came out even when nobody said so
// - no numbers, no ticks, no target: there is no angle you are meant to be at

import { SCALE } from '../copy';
import type { BalancePoint } from '../model/scale';

/** How far the beam can swing. Past this, more weight reads the same: the
    point is the direction and roughly how far, never a measurement. */
const MAX_ANGLE = 20;

/** -1 (all demands) … +1 (all rest). */
export function tiltOf(value: number, extent: number): number {
  return Math.max(-1, Math.min(1, value / extent));
}

interface BeamProps {
  /** -1 … +1, or null when the week was never weighed. */
  tilt: number | null;
  size?: 'big' | 'mini';
}

/** The scale itself: stand, beam, two pans. */
export function Beam({ tilt, size = 'big' }: BeamProps) {
  const big = size === 'big';
  const W = big ? 240 : 28;
  const H = big ? 112 : 30;
  const cx = W / 2;
  const cy = big ? 30 : 10;
  const arm = big ? 84 : 11;
  const baseY = big ? 100 : 25;

  const angle = ((tilt ?? 0) * MAX_ANGLE * Math.PI) / 180;
  const lx = cx - arm * Math.cos(angle);
  const ly = cy - arm * Math.sin(angle);
  const rx = cx + arm * Math.cos(angle);
  const ry = cy + arm * Math.sin(angle);

  const stroke = big ? 2.5 : 1.75;
  const hang = big ? 15 : 5;
  const panW = big ? 44 : 10;
  const panH = big ? 12 : 3.5;

  return (
    <svg
      className={big ? 'beam beam-big' : 'beam beam-mini'}
      viewBox={`0 0 ${W} ${H}`}
      width={big ? '100%' : W}
      height={big ? undefined : H}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Stand */}
      <line x1={cx} y1={cy} x2={cx} y2={baseY} stroke="var(--body)" strokeWidth={stroke} strokeLinecap="round" />
      <line
        x1={cx - (big ? 26 : 7)} y1={baseY} x2={cx + (big ? 26 : 7)} y2={baseY}
        stroke="var(--groundline)" strokeWidth={stroke} strokeLinecap="round"
      />

      {tilt === null ? (
        // Never weighed: the stand waits, empty. Drawing a level beam here
        // would say the week came out even, which nobody ever said.
        <circle cx={cx} cy={cy} r={big ? 5 : 2.5} stroke="var(--unknown)" strokeWidth={stroke} strokeDasharray="3 3" />
      ) : (
        <>
          {/* Beam */}
          <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="var(--body)" strokeWidth={stroke} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={big ? 4 : 2} fill="var(--body)" />

          {/* Demands pan, left: hatched, the same fill the demands bars use */}
          <line x1={lx} y1={ly} x2={lx} y2={ly + hang} stroke="var(--body)" strokeWidth={big ? 1.5 : 1} />
          <rect
            x={lx - panW / 2} y={ly + hang} width={panW} height={panH} rx={big ? 4 : 2}
            fill="var(--sand-hatch)" stroke="var(--sand-hatch)" strokeWidth={1}
          />

          {/* Rest pan, right: solid moss */}
          <line x1={rx} y1={ry} x2={rx} y2={ry + hang} stroke="var(--body)" strokeWidth={big ? 1.5 : 1} />
          <rect
            x={rx - panW / 2} y={ry + hang} width={panW} height={panH} rx={big ? 4 : 2}
            fill="var(--moss-bar)"
          />
        </>
      )}
    </svg>
  );
}

interface BalanceViewProps {
  points: BalancePoint[];
  extent: number;
  onSelect?: (weekId: string) => void;
}

/** The big scale for the most recent weighed week, then one small scale per
    week so the drift over months is visible. */
export function BalanceView({ points, extent, onSelect }: BalanceViewProps) {
  const latest = [...points].reverse().find((p) => p.known) ?? null;
  const latestTilt = latest ? tiltOf(latest.value, extent) : null;

  const describe = (p: BalancePoint) =>
    p.skipped
      ? SCALE.srSkipped
      : !p.known
        ? SCALE.srUnanswered
        : p.value > 0
          ? SCALE.srRestHeavier
          : p.value < 0
            ? SCALE.srDemandsHeavier
            : SCALE.srEven;

  return (
    <div className="balance-view">
      <Beam tilt={latestTilt} />

      <div className="balance-pan-labels legend-text">
        <span>{SCALE.panDemands}</span>
        <span>{SCALE.panRest}</span>
      </div>

      <p className="caption balance-history-title">{SCALE.historyTitle}</p>
      <div className="balance-history">
        {points.map((p) => {
          const tilt = p.known ? tiltOf(p.value, extent) : null;
          const content = p.skipped ? (
            <span className="balance-mini-empty" />
          ) : (
            <Beam tilt={tilt} size="mini" />
          );
          return onSelect ? (
            <button
              key={p.weekId}
              type="button"
              className="balance-mini"
              onClick={() => onSelect(p.weekId)}
            >
              {content}
              <span className="visually-hidden">{SCALE.weekLabel(p.weekId)}</span>
            </button>
          ) : (
            <span key={p.weekId} className="balance-mini">{content}</span>
          );
        })}
      </div>

      {/* Wrapped: a bare table ignores the 1px clip and widens the page. */}
      <div className="visually-hidden">
        <table>
          <caption>{SCALE.srCaption}</caption>
          <thead>
            <tr><th>Week</th><th>{SCALE.srWhichWayHeader}</th></tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.weekId}>
                <td>{p.weekId}</td>
                <td>{describe(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
