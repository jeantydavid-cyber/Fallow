// Weights — SCREENS.md §6, "What costs you most". An explanation, not a
// settings page. Editing steps along the fixed 1.0–3.6 scale; a hand-edited
// weight is pinned and never auto-overwritten.

import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { CATEGORY_MEANINGS, CATEGORY_NAMES, ONBOARDING, WEIGHTS_SCREEN } from '../copy';
import { rankedLoad, rankedRecovery, stepWeight } from '../model/weights';
import { Icon, CATEGORY_ICONS } from '../components/Icon';
import { WeightGlyph } from '../components/controls';
import { BackRow } from './Lever';
import type { Category } from '../model/types';

export function Weights() {
  const nav = useNavigate();
  const { weights, setWeights } = useStore();

  const adjust = (cat: Category, kind: 'load' | 'recovery', dir: 1 | -1) => {
    const table = kind === 'load' ? weights.load : weights.recovery;
    const next = stepWeight(table[cat as keyof typeof table], dir);
    void setWeights({
      ...weights,
      [kind]: { ...table, [cat]: next },
      pinned: { ...weights.pinned, [cat]: true },
    });
  };

  const row = (cat: Category, kind: 'load' | 'recovery', weight: number, heaviest: boolean) => (
    <div key={cat} className={`frow${kind === 'recovery' ? ' frow-recovery' : ''}`}>
      <span className="frow-icon"><Icon name={CATEGORY_ICONS[cat]} size={26} /></span>
      <span className="frow-main">
        <span className="frow-title row-title">{CATEGORY_NAMES[cat]}</span>
        <span className="frow-sub">{CATEGORY_MEANINGS[cat]}</span>
        <span className="frow-sub">
          {weights.pinned[cat] ? WEIGHTS_SCREEN.pinned : heaviest ? WEIGHTS_SCREEN.heaviest : ' '}
        </span>
        <span className="lever-actions">
          <button type="button" className="btn btn-secondary weight-step" onClick={() => adjust(cat, kind, 1)}>
            {WEIGHTS_SCREEN.costsMore}
          </button>
          <button type="button" className="btn btn-secondary weight-step" onClick={() => adjust(cat, kind, -1)}>
            {WEIGHTS_SCREEN.costsLess}
          </button>
        </span>
      </span>
      <span className="frow-trailing"><WeightGlyph weight={weight} /></span>
    </div>
  );

  return (
    <main className="screen">
      <BackRow onBack={() => nav('/settings')} />
      <h1 className="screen-title">{WEIGHTS_SCREEN.title}</h1>
      <p className="body-text">{ONBOARDING.payoff(CATEGORY_NAMES[rankedLoad(weights)[0]])}</p>

      <div className="stack">
        {rankedLoad(weights).map((cat, i) => row(cat, 'load', weights.load[cat], i === 0))}
      </div>

      <h2 className="row-title">{WEIGHTS_SCREEN.restores}</h2>
      <div className="stack">
        {rankedRecovery(weights).map((cat) => row(cat, 'recovery', weights.recovery[cat], false))}
      </div>
    </main>
  );
}
