// Home. Header, the two scales, one observation, check-in card, quiet
// dismissal. Nothing else, in that order, in every state: element order never
// varies between sessions, only presence may change.
//
// Home leads with a weighing scale: demands in one pan, rest in the other,
// tipping toward whichever weighed more. The bar chart it replaced showed
// the same quantities but asked the reader to compare two bar lengths; a
// scale shows which way the week went at a glance, which is the whole
// question. That week's bars now live on the week detail screen.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { detectSignal } from '../model/signals';
import { observationText } from '../model/observations';
import { readyWeekId } from '../model/checkin';
import { BalanceView } from '../components/Balance';
import { Button } from '../components/controls';
import { Icon } from '../components/Icon';
import { CATEGORY_MEANINGS, CATEGORY_NAMES, EMPTY, HOME, ONBOARDING, SYSTEM } from '../copy';
import { rankedLoad } from '../model/weights';
import { balanceExtent, balancePoints } from '../model/scale';
import { db } from '../db/db';
import { monthNameOf, addWeeks, isoWeekId } from '../model/week';
import { upcomingItems } from '../model/lever';

export function Home() {
  const nav = useNavigate();
  const { weeks, weights, storageBlocked } = useStore();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [dismissedLoaded, setDismissedLoaded] = useState(false);

  useEffect(() => {
    db.kv.get('dismissedWeek')
      .then((row) => setDismissed((row?.value as string) ?? null))
      .catch(() => undefined)
      .finally(() => setDismissedLoaded(true));
  }, []);

  // Future weeks (upcoming calendar guesses) belong to the lever, not the
  // chart or the signal.
  const pastWeeks = useMemo(() => {
    const current = isoWeekId(new Date());
    return weeks.filter((w) => w.id < current);
  }, [weeks]);

  const signal = useMemo(() => detectSignal(pastWeeks, weights), [pastWeeks, weights]);
  const observation = useMemo(() => observationText(signal, weights), [signal, weights]);
  const balance = useMemo(() => balancePoints(pastWeeks, weights), [pastWeeks, weights]);
  const extent = useMemo(() => balanceExtent(balance), [balance]);
  const ready = readyWeekId(weeks);
  const showCheckIn = dismissedLoaded && ready !== null && dismissed !== ready;
  const hasLever = useMemo(() => upcomingItems(weeks, weights).length > 0, [weeks, weights]);

  const knownCount = weeks.filter((w) => w.checkIn !== 'none').length;
  const firstRun = knownCount <= 1;
  const lastWeek = weeks.filter((w) => w.checkIn !== 'none').at(-1);
  const gapWeeks = lastWeek ? weeksSince(lastWeek.id) : 0;

  const dismiss = async () => {
    if (!ready) return;
    setDismissed(ready);
    // Stored only so the card stays away; never counted, never mentioned.
    try { await db.kv.put({ key: 'dismissedWeek', value: ready }); } catch { /* quiet */ }
  };

  return (
    <main className="screen">
      <header className="home-header">
        <span className="home-mark">
          <Icon name="fallow" size={26} />
          <span className="home-name">{HOME.appName}</span>
        </span>
        {knownCount > 0 && <span className="caption">{HOME.weeksLabel(knownCount)}</span>}
      </header>

      <section className="card chart-card">
        <BalanceView
          points={balance}
          extent={extent}
          onSelect={(id) => nav(`/week/${id}`)}
        />
      </section>

      {storageBlocked && <p className="body-text">{SYSTEM.storageBlocked}</p>}

      {knownCount === 0 && <p className="observation">{EMPTY.nothingYet}</p>}
      {firstRun && knownCount === 1 && (
        <p className="observation">{EMPTY.firstRun(monthNameOf(addWeeks(isoWeekId(new Date()), 8)))}</p>
      )}
      {!firstRun && gapWeeks >= 4 && lastWeek && (
        <p className="observation">{EMPTY.returnAfterGap(monthNameOf(lastWeek.id))}</p>
      )}
      {!firstRun && gapWeeks < 4 && observation && <p className="observation">{observation}</p>}

      {/* First run: the calibration finding restated (SCREENS.md §8) — the one
          thing the app can offer before any history exists. */}
      {firstRun && (
        <section className="card lever-entry">
          <p className="row-title">
            {EMPTY.firstRunFinding(ONBOARDING.findingBare(CATEGORY_NAMES[rankedLoad(weights)[0]]))}
          </p>
          <p className="caption">{CATEGORY_MEANINGS[rankedLoad(weights)[0]]}</p>
          <p className="caption">{EMPTY.findingSource}</p>
          <Button rank="secondary" onClick={() => nav('/weights')}>{EMPTY.seeTheList}</Button>
        </section>
      )}

      {hasLever && (
        <section className="card lever-entry">
          <p className="row-title">{HOME.leverEntry}</p>
          <Button rank="secondary" onClick={() => nav(signal.strong ? '/low' : '/lever')}>
            {HOME.leverAction}
          </Button>
        </section>
      )}

      {showCheckIn && (
        <section className="card checkin-card">
          <span className="checkin-card-icon"><Icon name="sun-ring" size={30} /></span>
          <p className="row-title">{HOME.checkInTitle}</p>
          {knownCount === 0 && <p className="caption">{EMPTY.whenAWeekEnds}</p>}
          <Button onClick={() => nav(`/checkin/${ready}`)}>{HOME.look}</Button>
        </section>
      )}

      {showCheckIn && (
        <div className="centered">
          <Button rank="quiet" onClick={dismiss}>{HOME.notThisWeek}</Button>
        </div>
      )}
    </main>
  );
}

function weeksSince(weekId: string): number {
  const current = isoWeekId(new Date());
  let count = 0;
  let id = weekId;
  while (id < current && count < 60) {
    id = addWeeks(id, 1);
    count++;
  }
  return count;
}
