// Printable plain-language summary — FALLOW-SPEC.md §9, COPY.md §10.
// Written for a GP, an OT, or an employer who has never seen the app.
// Plain page, no app chrome.

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { CATEGORY_NAMES, OBSERVATION_NAMES, SUMMARY } from '../copy';
import { detectSignal } from '../model/signals';
import { observationText } from '../model/observations';
import { deriveWeek, isoWeekId, monthNameOf } from '../model/week';
import { rankedLoad, rankedRecovery } from '../model/weights';
import { Button } from '../components/controls';
import { BackRow } from './Lever';

export function PrintSummary() {
  const nav = useNavigate();
  const { weeks, weights } = useStore();

  const pastWeeks = useMemo(() => {
    const current = isoWeekId(new Date());
    return weeks.filter((w) => w.id < current && w.checkIn !== 'none');
  }, [weeks]);

  const knownWeeks = pastWeeks.filter((w) => w.recoveryKnown);
  const signal = detectSignal(pastWeeks, weights);
  const observation = observationText(signal, weights);
  const topLoad = rankedLoad(weights)[0];
  const topRecovery = rankedRecovery(weights)[0];

  const markerWeeks = pastWeeks.filter((w) => w.markers);
  const harderWeeks = markerWeeks.filter((w) => (w.markers?.skillLoss ?? 0) >= 2).length;
  const emptyWeeks = markerWeeks.filter((w) => (w.markers?.emptiness ?? 0) >= 2).length;

  const deficitWeeks = knownWeeks.filter((w) => deriveWeek(w, weights).balance < 0).length;
  const first = pastWeeks[0];
  const last = pastWeeks.at(-1);

  return (
    <main className="screen print-page">
      <div className="no-print">
        <BackRow onBack={() => nav('/settings')} />
        <Button rank="secondary" onClick={() => window.print()}>Print</Button>
      </div>

      <h1 className="screen-title">Fallow: weekly record</h1>
      <p className="body-text">{SUMMARY.opening('this person', pastWeeks.length)}</p>

      {first && last && (
        <p className="body-text">
          The record runs from {monthNameOf(first.id)} to {monthNameOf(last.id)}. Of {pastWeeks.length} recorded
          weeks, {knownWeeks.length} include detail on rest as well as demands.
        </p>
      )}

      <p className="body-text">
        The heaviest kind of demand for this person is {CATEGORY_NAMES[topLoad].toLowerCase()}. What restores them
        most is {OBSERVATION_NAMES[topRecovery]}.
      </p>

      {knownWeeks.length > 0 && (
        <p className="body-text">
          In {deficitWeeks} of the {knownWeeks.length} detailed weeks, demands outweighed rest.
          {harderWeeks > 0 && ` In ${harderWeeks} week${harderWeeks === 1 ? '' : 's'}, everyday things were noticeably harder than usual.`}
          {emptyWeeks > 0 && ` In ${emptyWeeks} week${emptyWeeks === 1 ? '' : 's'}, they described running on empty for most of the week or more.`}
        </p>
      )}

      {observation && <p className="body-text">Most recently: {observation.toLowerCase()}</p>}

      <p className="body-text">{SUMMARY.closing}</p>
    </main>
  );
}
