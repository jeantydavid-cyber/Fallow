// Core controls — COMPONENTS.md §1–§3, §5–§7.

import type { ReactNode } from 'react';
import { Icon, type IconName, FullnessIcon } from './Icon';

/* --- Button, three ranks --- */

interface ButtonProps {
  rank?: 'primary' | 'secondary' | 'quiet';
  big?: boolean;
  icon?: IconName;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  type?: 'button' | 'submit';
}

export function Button({ rank = 'primary', big, icon, onClick, disabled, children, type = 'button' }: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn-${rank}${big ? ' btn-big' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <Icon name={icon} size={20} />}
      {children}
    </button>
  );
}

/* --- Icon tile --- */

interface IconTileProps {
  icon: ReactNode;
  label: string;
  /** One plain line saying what this option covers, so the name never has to
      carry the definition on its own. */
  sub?: string;
  selected?: boolean;
  recovery?: boolean;
  wide?: boolean;
  multi?: boolean;
  onClick?: () => void;
}

export function IconTile({ icon, label, sub, selected = false, recovery, wide, multi, onClick }: IconTileProps) {
  const pressedProps = multi ? { 'aria-pressed': selected } : { 'aria-checked': selected, role: 'radio' };
  return (
    <button
      type="button"
      className={`tile${recovery ? ' tile-recovery' : ''}${wide ? ' tile-wide' : ''}`}
      onClick={onClick}
      {...pressedProps}
    >
      <span className="tile-icon">{icon}</span>
      <span>{label}</span>
      {sub && <span className="tile-sub">{sub}</span>}
    </button>
  );
}

/* --- Progress dots --- */

export function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="dots" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i <= step ? 'done' : ''} />
      ))}
    </div>
  );
}

/* --- Weight glyph: always paired with a text subtitle --- */

export function WeightGlyph({ weight }: { weight: number }) {
  const on = weight >= 2.9 ? 3 : weight >= 1.8 ? 2 : 1;
  return (
    <span className="weight-glyph" aria-hidden="true">
      <span className={on >= 1 ? 'on' : ''} />
      <span className={on >= 2 ? 'on' : ''} />
      <span className={on >= 3 ? 'on' : ''} />
    </span>
  );
}

/* --- Fullness scale --- */

interface FullnessScaleProps {
  labels: readonly string[];
  caption: string;
  value: number | null;
  onChange: (v: 0 | 1 | 2 | 3) => void;
  /** Some scales run empty→full, others fine→much harder; the icon level
      shown for index i. */
  levelFor?: (index: number) => 0 | 1 | 2 | 3;
}

export function FullnessScale({ labels, caption, value, onChange, levelFor }: FullnessScaleProps) {
  return (
    <div>
      <div className="tile-grid-4" role="radiogroup" aria-label={caption}>
        {labels.map((label, i) => (
          <IconTile
            key={label}
            icon={<FullnessIcon level={levelFor ? levelFor(i) : ((3 - i) as 0 | 1 | 2 | 3)} />}
            label={label}
            selected={value === i}
            onClick={() => onChange(i as 0 | 1 | 2 | 3)}
          />
        ))}
      </div>
      <p className="caption" style={{ marginTop: 8, textAlign: 'center' }}>{caption}</p>
    </div>
  );
}

/* --- Hours stepper (roughly how long?) --- */

export function HoursStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const dec = () => onChange(Math.max(0.5, value - (value <= 2 ? 0.5 : 1)));
  const inc = () => onChange(Math.min(40, value + (value < 2 ? 0.5 : 1)));
  return (
    <div className="stepper">
      <span className="caption">{label}</span>
      <button type="button" onClick={dec} aria-label={`Less time, now ${value} hours`}>−</button>
      <span className="stepper-value" aria-hidden="true">{value % 1 === 0 ? value : value.toFixed(1)}h</span>
      <button type="button" onClick={inc} aria-label={`More time, now ${value} hours`}>+</button>
    </div>
  );
}
