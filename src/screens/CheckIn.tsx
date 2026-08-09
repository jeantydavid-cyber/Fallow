// The check-in — SCREENS.md §2. Three steps, 20-second default path.
//
// "Yes" on step one commits the week as a quick check-in and returns home:
// recoveryKnown stays FALSE — unknown, never zero. The full path (via
// "Fix it") adds the three Raymaker markers and recovery entries, and only
// "Done" sets recoveryKnown: true.

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HOME, CHECKIN, CATEGORY_NAMES, RECOVERY_NAMES, WEEK_DETAIL } from '../copy';
import type { Entry, MarkerValue, RecoveryCategory, Week } from '../model/types';
import { LOAD_CATEGORIES, RECOVERY_CATEGORIES } from '../model/types';
import { emptyWeek } from '../model/checkin';
import { useStore } from '../state/store';
import { Button, FullnessScale, HoursStepper, IconTile, ProgressDots } from '../components/controls';
import { Icon, CATEGORY_ICONS } from '../components/Icon';
import { normaliseTitle } from '../calendar/classify';

type Step = 'sound-right' | 'fix' | 'fullness' | 'harder' | 'noise' | 'helped';

let seq = 0;
const newId = () => `e-${Date.now()}-${++seq}`;

export function CheckIn() {
  const { weekId } = useParams();
  const nav = useNavigate();
  const { weeks, saveWeek, addRule } = useStore();

  const stored = useMemo(
    () => weeks.find((w) => w.id === weekId) ?? emptyWeek(weekId ?? ''),
    [weeks, weekId],
  );

  const [step, setStep] = useState<Step>('sound-right');
  const [entries, setEntries] = useState<Entry[]>(stored.entries);
  const [emptiness, setEmptiness] = useState<MarkerValue | null>(null);
  const [skillLoss, setSkillLoss] = useState<MarkerValue | null>(null);
  const [stimulus, setStimulus] = useState<MarkerValue | null>(null);
  const [helped, setHelped] = useState<Partial<Record<RecoveryCategory, number>>>({});
  const [classifying, setClassifying] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (!weekId) return null;

  const loadEntries = entries.filter((e) => e.kind === 'load');
  const unconfirmed = loadEntries.filter((e) => !e.confirmed);

  const commitQuick = async () => {
    const week: Week = {
      ...stored,
      entries: entries.map((e) => ({ ...e, confirmed: true })),
      checkIn: 'quick',
      recoveryKnown: false, // unknown, never zero
      markers: null,
    };
    await saveWeek(week);
    nav('/');
  };

  const commitFull = async () => {
    const recoveryEntries: Entry[] = Object.entries(helped).map(([cat, hours]) => ({
      id: newId(),
      weekId,
      kind: 'recovery',
      category: cat as RecoveryCategory,
      hours: hours ?? 1,
      label: null,
      source: 'manual',
      sourceEventId: null,
      confirmed: true,
    }));
    const week: Week = {
      ...stored,
      entries: [...entries.filter((e) => e.kind === 'load').map((e) => ({ ...e, confirmed: true })), ...recoveryEntries],
      checkIn: 'full',
      recoveryKnown: true,
      markers: {
        emptiness: emptiness ?? 0,
        skillLoss: skillLoss ?? 0,
        stimulusTolerance: stimulus ?? 1,
      },
    };
    await saveWeek(week);
    nav('/');
  };

  const back = () => {
    const order: Step[] = ['sound-right', 'fix', 'fullness', 'harder', 'noise', 'helped'];
    const i = order.indexOf(step);
    if (i <= 0) nav('/');
    else setStep(order[i - 1]);
  };

  const header = (dotStep: number | null) => (
    <div className="checkin-header">
      <button type="button" className="btn-quiet btn back-btn" onClick={back} aria-label={CHECKIN.back}>
        <Icon name="chevron-left" size={22} />
        <span>{CHECKIN.back}</span>
      </button>
      {dotStep !== null && <ProgressDots step={dotStep} total={3} />}
    </div>
  );

  const entryRow = (e: Entry, editable: boolean) => (
    <div key={e.id} className={`frow${e.confirmed ? '' : ' frow-guess'}`}>
      <span className="frow-icon"><Icon name={CATEGORY_ICONS[e.category]} size={26} /></span>
      <span className="frow-main">
        <span className="frow-title row-title">{e.label ?? CATEGORY_NAMES[e.category]}</span>
        {e.label && <span className="frow-sub">{CATEGORY_NAMES[e.category]}</span>}
      </span>
      <span className="frow-trailing">
        {editable ? (
          <HoursStepper
            label=""
            value={e.hours}
            onChange={(h) => setEntries((prev) => prev.map((p) => (p.id === e.id ? { ...p, hours: h } : p)))}
          />
        ) : (
          WEEK_DETAIL.hours(e.hours)
        )}
      </span>
    </div>
  );

  // --- Step 1: Sound right? ---
  if (step === 'sound-right') {
    return (
      <main className="screen">
        {header(null)}
        <h1 className="screen-title">{loadEntries.length ? CHECKIN.step1Title : CHECKIN.noCalendarTitle}</h1>

        <div className="stack">
          {loadEntries.filter((e) => e.confirmed).map((e) => entryRow(e, false))}
          {unconfirmed.map((e) =>
            classifying === e.id ? (
              <div key={e.id} className="card">
                <p className="body-text" style={{ marginBottom: 10 }}>{CHECKIN.unknownRow(e.label ?? '')}</p>
                <div className="tile-grid">
                  {[...LOAD_CATEGORIES, ...RECOVERY_CATEGORIES].map((cat) => (
                    <IconTile
                      key={cat}
                      icon={<Icon name={CATEGORY_ICONS[cat]} size={28} />}
                      label={CATEGORY_NAMES[cat]}
                      recovery={(RECOVERY_CATEGORIES as string[]).includes(cat)}
                      onClick={() => {
                        setEntries((prev) =>
                          prev.map((p) =>
                            p.id === e.id
                              ? { ...p, category: cat, kind: (RECOVERY_CATEGORIES as string[]).includes(cat) ? 'recovery' : 'load', confirmed: true }
                              : p,
                          ),
                        );
                        if (e.label) {
                          void addRule({
                            id: newId(),
                            titleKey: normaliseTitle(e.label),
                            kind: (RECOVERY_CATEGORIES as string[]).includes(cat) ? 'recovery' : 'load',
                            category: cat,
                            hours: null,
                          });
                        }
                        setClassifying(null);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <button key={e.id} type="button" className="frow frow-guess" onClick={() => setClassifying(e.id)}>
                <span className="frow-main">
                  <span className="frow-title row-title">{CHECKIN.unknownRow(e.label ?? CATEGORY_NAMES[e.category])}</span>
                </span>
                <span className="frow-trailing">{WEEK_DETAIL.hours(e.hours)}</span>
              </button>
            ),
          )}
        </div>

        <div className="btn-pair">
          <Button icon="check" onClick={commitQuick}>{CHECKIN.yes}</Button>
          <Button rank="secondary" onClick={() => setStep('fix')}>{CHECKIN.fixIt}</Button>
        </div>
        <div className="centered">
          <Button rank="quiet" onClick={() => nav('/')}>{HOME.notThisWeek}</Button>
        </div>
      </main>
    );
  }

  // --- Fix it: edit rows, then continue into the full path ---
  if (step === 'fix') {
    return (
      <main className="screen">
        {header(0)}
        <h1 className="screen-title">{loadEntries.length ? CHECKIN.step1Title : CHECKIN.noCalendarTitle}</h1>

        <div className="stack">
          {loadEntries.map((e) => entryRow(e, true))}

          {adding ? (
            <div className="card">
              <div className="tile-grid">
                {LOAD_CATEGORIES.map((cat) => (
                  <IconTile
                    key={cat}
                    icon={<Icon name={CATEGORY_ICONS[cat]} size={28} />}
                    label={CATEGORY_NAMES[cat]}
                    onClick={() => {
                      setEntries((prev) => [
                        ...prev,
                        { id: newId(), weekId, kind: 'load', category: cat, hours: 2, label: null, source: 'manual', sourceEventId: null, confirmed: true },
                      ]);
                      setAdding(false);
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Button rank="secondary" onClick={() => setAdding(true)}>{CHECKIN.addSomething}</Button>
          )}
        </div>

        <div className="btn-pair">
          <Button icon="check" onClick={() => setStep('fullness')}>{CHECKIN.yes}</Button>
        </div>
        <div className="centered">
          <Button rank="quiet" onClick={() => nav('/')}>{HOME.notThisWeek}</Button>
        </div>
      </main>
    );
  }

  // --- Step 2: the three Raymaker markers, one question per screen ---
  if (step === 'fullness') {
    return (
      <main className="screen">
        {header(1)}
        <h1 className="screen-title">{CHECKIN.step2Title}</h1>
        <FullnessScale
          labels={CHECKIN.fullnessTiles}
          caption={CHECKIN.fullnessCaption}
          value={emptiness}
          onChange={(v) => { setEmptiness(v); setStep('harder'); }}
        />
        <div className="centered">
          <Button rank="quiet" onClick={() => { setEmptiness(null); setStep('harder'); }}>{CHECKIN.skipThisOne}</Button>
        </div>
      </main>
    );
  }

  if (step === 'harder') {
    return (
      <main className="screen">
        {header(1)}
        <h1 className="screen-title">{CHECKIN.harderTitle}</h1>
        <p className="body-text">{CHECKIN.harderSub}</p>
        <FullnessScale
          labels={CHECKIN.harderTiles}
          caption={CHECKIN.harderSub}
          value={skillLoss}
          onChange={(v) => { setSkillLoss(v); setStep('noise'); }}
        />
        <div className="centered">
          <Button rank="quiet" onClick={() => { setSkillLoss(null); setStep('noise'); }}>{CHECKIN.skipThisOne}</Button>
        </div>
      </main>
    );
  }

  if (step === 'noise') {
    return (
      <main className="screen">
        {header(1)}
        <h1 className="screen-title">{CHECKIN.noiseTitle}</h1>
        <FullnessScale
          labels={CHECKIN.noiseTiles}
          caption={CHECKIN.noiseTitle}
          value={stimulus}
          onChange={(v) => { setStimulus(v); setStep('helped'); }}
        />
        <div className="centered">
          <Button rank="quiet" onClick={() => { setStimulus(null); setStep('helped'); }}>{CHECKIN.skipThisOne}</Button>
        </div>
      </main>
    );
  }

  // --- Step 3: What helped? ---
  const helpedTiles: { cat: RecoveryCategory; wide?: boolean }[] = [
    { cat: 'solitude' },
    { cat: 'sensory_relief' },
    { cat: 'unmasked_time' },
    { cat: 'flow' },
    { cat: 'unstructured', wide: true },
  ];

  return (
    <main className="screen">
      {header(2)}
      <h1 className="screen-title">{CHECKIN.step3Title}</h1>
      <div className="tile-grid">
        {helpedTiles.map(({ cat, wide }) => {
          const selected = helped[cat] !== undefined;
          return (
            <div key={cat} className={wide ? 'tile-wide stack-sm' : 'stack-sm'}>
              <IconTile
                icon={<Icon name={CATEGORY_ICONS[cat]} size={30} />}
                label={cat === 'unstructured' ? 'A day with nothing in it' : RECOVERY_NAMES[cat]}
                selected={selected}
                recovery
                multi
                onClick={() =>
                  setHelped((prev) => {
                    const next = { ...prev };
                    if (selected) delete next[cat];
                    else next[cat] = cat === 'unstructured' ? 8 : 2;
                    return next;
                  })
                }
              />
              {selected && (
                <HoursStepper
                  label={CHECKIN.stepper}
                  value={helped[cat] ?? 1}
                  onChange={(h) => setHelped((prev) => ({ ...prev, [cat]: h }))}
                />
              )}
            </div>
          );
        })}
      </div>
      <Button icon="check" onClick={commitFull}>{CHECKIN.done}</Button>
    </main>
  );
}
