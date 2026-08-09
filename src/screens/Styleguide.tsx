// /styleguide — HANDOFF.md §4. Ships in dev builds: tokens with runtime-
// computed contrast, every component in every state (n/a states named as
// such), the chart in all seven column states, the icon set with labels.

import { useEffect, useMemo, useState } from 'react';
import { Button, FullnessScale, HoursStepper, IconTile, ProgressDots, WeightGlyph } from '../components/controls';
import { Icon, CATEGORY_ICONS, type IconName } from '../components/Icon';
import { Chart, type ChartColumn } from '../components/Chart';
import { HOME, CATEGORY_NAMES, CHECKIN } from '../copy';
import { LOAD_CATEGORIES, RECOVERY_CATEGORIES } from '../model/types';
import { useStore } from '../state/store';

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function parseColor(css: string): [number, number, number] | null {
  const m = css.match(/#([0-9a-f]{6})/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = css.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/);
  if (rgb) return [+rgb[1], +rgb[2], +rgb[3]];
  return null;
}

function contrast(a: string, b: string): number | null {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return null;
  const la = luminance(ca);
  const lb = luminance(cb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const TEXT_TOKENS = ['--ink', '--heading', '--body', '--muted', '--moss-text'];
const NONTEXT_TOKENS = ['--moss-bar', '--moss-deep', '--gold-border', '--sand-hatch', '--unknown', '--groundline'];

export function Styleguide() {
  const { settings, setSettings } = useStore();
  const [grayscale, setGrayscale] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [tokens, setTokens] = useState<{ name: string; value: string; ratio: number | null; vs: string; min: number }[]>([]);

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const get = (t: string) => cs.getPropertyValue(t).trim();
    const ground = get('--ground');
    const card = get('--card');
    const rows = [
      ...TEXT_TOKENS.map((t) => ({ name: t, value: get(t), ratio: contrast(get(t), ground), vs: '--ground', min: 4.5 })),
      { name: '--cream-on-moss', value: get('--cream-on-moss'), ratio: contrast(get('--cream-on-moss'), get('--moss')), vs: '--moss', min: 4.5 },
      ...NONTEXT_TOKENS.map((t) => ({ name: t, value: get(t), ratio: contrast(get(t), card), vs: '--card', min: 3 })),
    ];
    setTokens(rows);
  }, [settings.theme]);

  const chartStates: ChartColumn[] = useMemo(
    () => [
      { weekId: 'known', state: 'known', rest: 20, demands: 18, ghostRest: 0 },
      { weekId: 'zero', state: 'zero-rest', rest: 0, demands: 14, ghostRest: 0 },
      { weekId: 'not-sure', state: 'not-sure', rest: 0, demands: 16, ghostRest: 18 },
      { weekId: 'skipped', state: 'skipped', rest: 0, demands: 0, ghostRest: 0 },
      { weekId: 'projected', state: 'projected', rest: 12, demands: 10, ghostRest: 0 },
      { weekId: 'heavy', state: 'known', rest: 6, demands: 24, ghostRest: 0 },
      { weekId: 'light', state: 'known', rest: 24, demands: 4, ghostRest: 0 },
    ],
    [],
  );

  const icons: IconName[] = [
    'fallow', 'sun-ring', 'solitude', 'sensory_relief', 'unmasked_time', 'flow', 'unstructured',
    'masked_social', 'sensory', 'people', 'executive', 'unexpected_change', 'transition', 'conflict',
    'check', 'chevron-left',
  ];

  const [fullness, setFullness] = useState<number | null>(1);
  const [hours, setHours] = useState(2);

  return (
    <main className="screen" style={{ maxWidth: narrow ? 320 : 720, filter: grayscale ? 'grayscale(1)' : undefined }}>
      <h1 className="screen-title">Styleguide</h1>

      <div className="btn-pair" style={{ flexWrap: 'wrap' }}>
        <Button rank="secondary" onClick={() => void setSettings({ ...settings, theme: settings.theme === 'light' ? 'dark' : 'light' })}>
          Theme: {settings.theme}
        </Button>
        <Button rank="secondary" onClick={() => setGrayscale((g) => !g)}>Greyscale: {grayscale ? 'on' : 'off'}</Button>
        <Button rank="secondary" onClick={() => setNarrow((n) => !n)}>320px: {narrow ? 'on' : 'off'}</Button>
      </div>

      <h2 className="row-title">Tokens: runtime-computed contrast ({settings.theme})</h2>
      <div className="stack">
        {tokens.map((t) => (
          <div key={t.name} className="frow">
            <span className="swatch-lg" style={{ background: t.value }} />
            <span className="frow-main">
              <span className="frow-title row-title">{t.name}</span>
              <span className="frow-sub">{t.value} vs {t.vs}</span>
            </span>
            <span className="frow-trailing">
              {t.ratio ? `${t.ratio.toFixed(1)}:1 ${t.ratio >= t.min ? '·' : 'under'} ${t.min}:1` : '·'}
            </span>
          </div>
        ))}
      </div>

      <h2 className="row-title">Chart: all seven column states</h2>
      <section className="card chart-card">
        <Chart columns={chartStates} maxRest={24} maxDemand={24} />
        <p className="caption">known · zero rest · not sure · skipped · projected · heavy · light</p>
      </section>

      <h2 className="row-title">Icons: every glyph has a visible label</h2>
      <div className="tile-grid-4">
        {icons.map((name) => (
          <div key={name} className="tile" style={{ minHeight: 80 }}>
            <Icon name={name} size={28} />
            <span className="caption">{name}</span>
          </div>
        ))}
      </div>

      <h2 className="row-title">Icon tile: default / selected</h2>
      <div className="tile-grid">
        {RECOVERY_CATEGORIES.slice(0, 2).map((cat, i) => (
          <IconTile
            key={cat}
            icon={<Icon name={CATEGORY_ICONS[cat]} size={30} />}
            label={CATEGORY_NAMES[cat]}
            selected={i === 1}
            recovery
            multi
          />
        ))}
      </div>
      <p className="caption">disabled / loading / error: does not exist. An unavailable answer is not rendered</p>

      <h2 className="row-title">Buttons: three ranks</h2>
      <div className="stack">
        <Button icon="check">{CHECKIN.yes}</Button>
        <Button rank="secondary">{CHECKIN.fixIt}</Button>
        <Button rank="quiet">{HOME.notThisWeek}</Button>
        <Button disabled>Saving</Button>
      </div>
      <p className="caption">quiet disabled / quiet loading: does not exist</p>

      <h2 className="row-title">Fullness scale</h2>
      <FullnessScale
        labels={CHECKIN.fullnessTiles}
        caption={CHECKIN.fullnessCaption}
        value={fullness}
        onChange={setFullness}
      />

      <h2 className="row-title">Rows</h2>
      <div className="stack">
        <div className="frow">
          <span className="frow-icon"><Icon name="masked_social" size={26} /></span>
          <span className="frow-main">
            <span className="frow-title row-title">{CATEGORY_NAMES[LOAD_CATEGORIES[0]]}</span>
            <span className="frow-sub">the heaviest thing</span>
          </span>
          <span className="frow-trailing"><WeightGlyph weight={3.6} /></span>
        </div>
        <div className="frow frow-guess">
          <span className="frow-main"><span className="frow-title row-title">Thursday 7pm: what was this?</span></span>
        </div>
        <div className="frow frow-free">
          <span className="frow-icon"><Icon name="unstructured" size={26} /></span>
          <span className="frow-main">
            <span className="frow-title row-title">Saturday, nothing yet</span>
            <span className="frow-sub">A whole clear day</span>
          </span>
        </div>
        <div className="frow frow-free frow-protected">
          <span className="frow-icon"><Icon name="unstructured" size={26} /></span>
          <span className="frow-main">
            <span className="frow-title row-title">Saturday, kept clear</span>
            <span className="frow-sub">Kept clear</span>
          </span>
        </div>
        <div className="frow frow-declined">
          <span className="frow-main">
            <span className="frow-title row-title">Team dinner</span>
            <span className="frow-sub">Declined. Draft copied.</span>
          </span>
        </div>
      </div>

      <h2 className="row-title">Progress dots · stepper</h2>
      <ProgressDots step={1} total={3} />
      <HoursStepper label={CHECKIN.stepper} value={hours} onChange={setHours} />
    </main>
  );
}
