// Onboarding — SCREENS.md §7. 10–12 pairwise icon-card screens, then the
// payoff: the one thing the app can offer before any history exists.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { calibrate, PAIRWISE_QUESTIONS, type PairwiseAnswer } from '../model/calibration';
import { rankedLoad, rankedRecovery } from '../model/weights';
import { CATEGORY_NAMES, CHECKIN, ONBOARDING } from '../copy';
import { Icon, CATEGORY_ICONS } from '../components/Icon';
import { Button, WeightGlyph } from '../components/controls';
import type { Weights } from '../model/types';

export function Onboarding() {
  const nav = useNavigate();
  const { setWeights, settings, setSettings } = useStore();
  const [answers, setAnswers] = useState<PairwiseAnswer[]>([]);
  const [result, setResult] = useState<Weights | null>(null);

  const i = answers.length;
  const done = i >= PAIRWISE_QUESTIONS.length;

  const answer = (a: PairwiseAnswer) => {
    const next = [...answers, a];
    setAnswers(next);
    if (next.length >= PAIRWISE_QUESTIONS.length) {
      const w = calibrate(next, Date.now());
      setResult(w);
      void setWeights(w);
    }
  };

  const back = () => setAnswers((prev) => prev.slice(0, -1));

  if (done && result) {
    const topLoad = rankedLoad(result)[0];
    const lowLoad = rankedLoad(result).at(-1)!;
    const ratio = (result.load[topLoad] / result.load[lowLoad]).toFixed(1).replace(/\.0$/, '');
    return (
      <main className="screen">
        <h1 className="screen-title">{ONBOARDING.payoff(CATEGORY_NAMES[topLoad])}</h1>
        <p className="body-text">{ONBOARDING.payoffRatio(ratio, CATEGORY_NAMES[lowLoad].toLowerCase())}</p>

        <div className="stack">
          {rankedLoad(result).map((cat) => (
            <div key={cat} className="frow">
              <span className="frow-icon"><Icon name={CATEGORY_ICONS[cat]} size={26} /></span>
              <span className="frow-main"><span className="frow-title row-title">{CATEGORY_NAMES[cat]}</span></span>
              <span className="frow-trailing"><WeightGlyph weight={result.load[cat]} /></span>
            </div>
          ))}
          {rankedRecovery(result).slice(0, 2).map((cat) => (
            <div key={cat} className="frow frow-recovery">
              <span className="frow-icon"><Icon name={CATEGORY_ICONS[cat]} size={26} /></span>
              <span className="frow-main"><span className="frow-title row-title">{CATEGORY_NAMES[cat]}</span></span>
              <span className="frow-trailing"><WeightGlyph weight={result.recovery[cat]} /></span>
            </div>
          ))}
        </div>

        <div className="btn-pair">
          <Button
            onClick={async () => {
              await setSettings({ ...settings, onboarded: true });
              nav('/');
            }}
          >
            {ONBOARDING.start}
          </Button>
          <Button rank="secondary" onClick={() => window.print()}>{ONBOARDING.saveAsPage}</Button>
        </div>
      </main>
    );
  }

  const q = PAIRWISE_QUESTIONS[i];
  return (
    <main className="screen">
      <div className="checkin-header">
        {i > 0 ? (
          <button type="button" className="btn btn-quiet back-btn" onClick={back}>
            <Icon name="chevron-left" size={22} />
            <span>{CHECKIN.back}</span>
          </button>
        ) : <span />}
        <span className="caption">{ONBOARDING.counter(i + 1, PAIRWISE_QUESTIONS.length)}</span>
      </div>

      <h1 className="screen-title">
        {q.kind === 'load' ? ONBOARDING.pairwiseLoad : ONBOARDING.pairwiseRecovery}
      </h1>
      <p className="caption">
        {q.kind === 'load' ? ONBOARDING.pairwiseHelpLoad : ONBOARDING.pairwiseHelpRecovery}
      </p>

      <button type="button" className={`pair-card${q.kind === 'recovery' ? ' tile-recovery' : ''}`} onClick={() => answer('a')}>
        <Icon name={CATEGORY_ICONS[q.a]} size={44} />
        <span>{q.aText}</span>
      </button>
      <div className="pair-divider" aria-hidden="true">{ONBOARDING.or}</div>
      <button type="button" className={`pair-card${q.kind === 'recovery' ? ' tile-recovery' : ''}`} onClick={() => answer('b')}>
        <Icon name={CATEGORY_ICONS[q.b]} size={44} />
        <span>{q.bText}</span>
      </button>

      <div className="centered">
        <Button rank="quiet" onClick={() => answer('same')}>{ONBOARDING.aboutTheSame}</Button>
      </div>
    </main>
  );
}
