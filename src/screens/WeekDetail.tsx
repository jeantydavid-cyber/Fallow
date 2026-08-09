// Week detail — SCREENS.md §5. Rest first, demands second — always.
// Named before quantified. An unknown week says "Rest not recorded this
// week." — never "0h".

import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../state/store';
import { CATEGORY_NAMES, EMPTY, MARKER_SENTENCES, WEEK_DETAIL } from '../copy';
import { Icon, CATEGORY_ICONS } from '../components/Icon';
import { Button } from '../components/controls';
import { BackRow } from './Lever';
import { deriveWeek, monthNameOf, weekStartDate } from '../model/week';
import { chartScale } from '../components/Chart';

export function WeekDetail() {
  const { weekId } = useParams();
  const nav = useNavigate();
  const { weeks, weights } = useStore();
  const week = useMemo(() => weeks.find((w) => w.id === weekId), [weeks, weekId]);

  if (!weekId) return null;

  const title = `${monthNameOf(weekId)} ${Number(weekStartDate(weekId).slice(8, 10))}`;
  const skipped = !week || (week.checkIn === 'none' && week.entries.length === 0);
  const rest = week?.entries.filter((e) => e.kind === 'recovery' && e.hours > 0) ?? [];
  const demands = week?.entries.filter((e) => e.kind === 'load' && e.hours > 0) ?? [];

  const derived = week ? deriveWeek(week, weights) : null;
  const scale = chartScale(weeks, weights);
  const restWidth = derived ? Math.min(100, (derived.weightedRecovery / scale.maxRest) * 100) : 0;
  const demandWidth = derived ? Math.min(100, (derived.weightedLoad / scale.maxDemand) * 100) : 0;

  const markerSentence = (() => {
    if (!week?.markers) return null;
    const parts = [
      MARKER_SENTENCES.emptiness[week.markers.emptiness],
      MARKER_SENTENCES.skillLoss[week.markers.skillLoss],
      MARKER_SENTENCES.stimulusTolerance[week.markers.stimulusTolerance],
    ].filter(Boolean);
    if (!parts.length) return null;
    return `${parts.join(', ').toLowerCase().replace(/^./, (c) => c.toUpperCase())}.`;
  })();

  return (
    <main className="screen">
      <BackRow onBack={() => nav('/')} />
      <h1 className="screen-title">{title}</h1>

      {skipped ? (
        <p className="body-text">{EMPTY.weekSkipped}</p>
      ) : (
        <>
          {/* This week's rest and demands, in the same language the home
              chart used: solid for rest, hatched for demands, dashed when
              rest was never recorded. Lengths are against the person's own
              biggest week, never a norm. */}
          <section className="card stack">
            <div className="week-bars">
              <span className="week-bar-label caption">{WEEK_DETAIL.restFirst}</span>
              <span className="week-bar-track">
                {week!.recoveryKnown ? (
                  <span className="week-bar-rest" style={{ width: `${restWidth}%` }} />
                ) : (
                  <span className="week-bar-unknown" />
                )}
              </span>
            </div>
            <div className="week-bars">
              <span className="week-bar-label caption">{WEEK_DETAIL.demandsSecond}</span>
              <span className="week-bar-track">
                <span className="week-bar-demand" style={{ width: `${demandWidth}%` }} />
              </span>
            </div>
            {!week!.recoveryKnown && <p className="caption">{EMPTY.weekUnknown}</p>}
          </section>

          <section className="stack">
            <h2 className="row-title">{WEEK_DETAIL.restFirst}</h2>
            {week!.recoveryKnown ? (
              rest.map((e) => (
                <div key={e.id} className="frow frow-recovery">
                  <span className="frow-icon"><Icon name={CATEGORY_ICONS[e.category]} size={26} /></span>
                  <span className="frow-main">
                    <span className="frow-title row-title">{e.label ?? CATEGORY_NAMES[e.category]}</span>
                    {e.label && <span className="frow-sub">{CATEGORY_NAMES[e.category]}</span>}
                  </span>
                  <span className="frow-trailing">{WEEK_DETAIL.hours(e.hours)}</span>
                </div>
              ))
            ) : (
              <p className="body-text">{EMPTY.weekUnknown}</p>
            )}
          </section>

          <section className="stack">
            <h2 className="row-title">{WEEK_DETAIL.demandsSecond}</h2>
            {demands.map((e) => (
              <div key={e.id} className="frow">
                <span className="frow-icon"><Icon name={CATEGORY_ICONS[e.category]} size={26} /></span>
                <span className="frow-main">
                  <span className="frow-title row-title">{e.label ?? CATEGORY_NAMES[e.category]}</span>
                  {e.label && <span className="frow-sub">{CATEGORY_NAMES[e.category]}</span>}
                </span>
                <span className="frow-trailing">{WEEK_DETAIL.hours(e.hours)}</span>
              </div>
            ))}
          </section>

          {markerSentence && (
            <section className="stack">
              <h2 className="row-title">{WEEK_DETAIL.youSaid}</h2>
              <p className="body-text">{markerSentence}</p>
            </section>
          )}

          {/* This edits the week you are looking at. It used to open "Coming
              up", which is about the weeks ahead — a different thing
              entirely, and not what the label promises. */}
          <div className="centered">
            <Button rank="secondary" onClick={() => nav(`/checkin/${weekId}`)}>
              {WEEK_DETAIL.changeSomething}
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
