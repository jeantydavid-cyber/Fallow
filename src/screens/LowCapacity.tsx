// Low-capacity mode — SCREENS.md §3. A separate route, not a hidden-elements
// home. One statement, one softer line, one lever button, one way out.
// Offered, never auto-entered; leaving is one tap.

import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { detectSignal } from '../model/signals';
import { findFreeDay, upcomingItems } from '../model/lever';
import { Icon } from '../components/Icon';
import { Button } from '../components/controls';
import { CATEGORY_NAMES, LEVER, LOW_CAPACITY, OBSERVATION_NAMES } from '../copy';
import { isoWeekId } from '../model/week';

export function LowCapacity() {
  const nav = useNavigate();
  const { weeks, weights } = useStore();
  const [kept, setKept] = useState(false);

  const pastWeeks = useMemo(() => {
    const current = isoWeekId(new Date());
    return weeks.filter((w) => w.id < current);
  }, [weeks]);

  const signal = useMemo(() => detectSignal(pastWeeks, weights), [pastWeeks, weights]);
  const freeDay = useMemo(() => findFreeDay(weeks), [weeks]);
  const items = useRef(upcomingItems(weeks, weights)).current;
  const heaviest = items[0] ?? null;

  const lineOne =
    signal.pattern === 'skill_loss'
      ? LOW_CAPACITY.lineOneHarder
      : signal.pattern === 'drought' || signal.pattern === 'collapse'
        ? LOW_CAPACITY.lineOneDrought(OBSERVATION_NAMES[signal.category ?? 'solitude'])
        : LOW_CAPACITY.lineOneHeavy;

  const lineTwo = freeDay
    ? LOW_CAPACITY.lineTwoFree(freeDay.dayName)
    : heaviest
      ? LOW_CAPACITY.lineTwoBiggest(heaviest.entry.label ?? CATEGORY_NAMES[heaviest.entry.category])
      : LOW_CAPACITY.lineTwoNothing;

  const act = () => {
    if (freeDay && !kept) {
      setKept(true);
      return;
    }
    nav('/lever');
  };

  return (
    <main className="screen low-capacity">
      <span className="low-mark"><Icon name="fallow" size={56} /></span>
      <h1 className="statement">{lineOne}</h1>
      <p className="low-soft">{kept && freeDay ? LEVER.protectedDay(freeDay.dayName) : lineTwo}</p>
      <div className="low-spacer" />
      {!kept && (
        <Button big icon={freeDay ? 'unstructured' : undefined} onClick={act}>
          {freeDay
            ? LOW_CAPACITY.buttonKeepClear(freeDay.dayName)
            : heaviest
              ? LOW_CAPACITY.buttonWriteDecline
              : LOW_CAPACITY.buttonHaveALook}
        </Button>
      )}
      <div className="centered">
        <Button rank="quiet" onClick={() => nav('/')}>{LOW_CAPACITY.showEverything}</Button>
      </div>
    </main>
  );
}
