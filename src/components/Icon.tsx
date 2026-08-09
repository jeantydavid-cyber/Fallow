// The Fallow icon set — DESIGN-TOKENS.md §4. Built only from circles, arcs,
// lines, and rounded rectangles; stroke 2–2.5, round caps, 24px grid.
// Icons are decorative: every use has a visible text label beside it, so
// they are aria-hidden here.

import type { Category } from '../model/types';

export type IconName =
  | 'fallow' // sun on horizon
  | 'sun-ring'
  | 'solitude' // circle + centre dot
  | 'sensory_relief' // moon
  | 'unmasked_time' // two overlapping circles
  | 'flow' // three concentric circles
  | 'unstructured' // horizon + circle above
  | 'masked_social' // two circles + base line
  | 'sensory' // circle + 4 radiating lines
  | 'people' // three circle outlines
  | 'executive' // rounded rect + 2 lines
  | 'unexpected_change' // path that forks
  | 'transition' // two points joined by a line
  | 'conflict' // two circles pulled apart
  | 'check'
  | 'chevron-left';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

const STROKE = 2;

export function Icon({ name, size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {glyph(name)}
    </svg>
  );
}

function glyph(name: IconName) {
  switch (name) {
    case 'fallow': // line + gold semicircle sitting on it
      return (
        <>
          <path d="M 5 15 A 7 7 0 0 1 19 15 Z" fill="var(--gold)" stroke="none" />
          <line x1="2.5" y1="15" x2="21.5" y2="15" />
        </>
      );
    case 'sun-ring':
      return (
        <>
          <circle cx="12" cy="12" r="6.5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </>
      );
    case 'solitude':
      return (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
        </>
      );
    case 'sensory_relief': // moon: filled circle + offset background circle
      return (
        <>
          <circle cx="11" cy="12" r="7.5" fill="currentColor" stroke="none" />
          <circle cx="15" cy="9.5" r="6" fill="var(--icon-bg, var(--card))" stroke="none" />
        </>
      );
    case 'unmasked_time':
      return (
        <>
          <circle cx="9" cy="12" r="6" />
          <circle cx="15" cy="12" r="6" />
        </>
      );
    case 'flow':
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="5.2" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
        </>
      );
    case 'unstructured':
      return (
        <>
          <circle cx="12" cy="9" r="5" />
          <line x1="3" y1="19" x2="21" y2="19" />
        </>
      );
    case 'masked_social':
      return (
        <>
          <circle cx="8.5" cy="9" r="4" />
          <circle cx="15.5" cy="9" r="4" />
          <line x1="4" y1="19" x2="20" y2="19" />
        </>
      );
    case 'sensory':
      return (
        <>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="2.5" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="21.5" />
          <line x1="2.5" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="21.5" y2="12" />
        </>
      );
    case 'people':
      return (
        <>
          <circle cx="7" cy="14" r="4" />
          <circle cx="17" cy="14" r="4" />
          <circle cx="12" cy="7.5" r="4" />
        </>
      );
    case 'executive':
      return (
        <>
          <rect x="5" y="4" width="14" height="16" rx="2.5" />
          <line x1="9" y1="10" x2="15" y2="10" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </>
      );
    case 'unexpected_change': // a path that forks away
      return (
        <>
          <line x1="3" y1="16" x2="12" y2="16" />
          <line x1="12" y1="16" x2="20" y2="8" />
          <line x1="12" y1="16" x2="20" y2="16" strokeDasharray="1 4" />
        </>
      );
    case 'transition':
      return (
        <>
          <circle cx="5.5" cy="17" r="2.8" />
          <circle cx="18.5" cy="7" r="2.8" />
          <line x1="8" y1="15" x2="16" y2="9" />
        </>
      );
    case 'conflict':
      return (
        <>
          <circle cx="6" cy="12" r="4" />
          <circle cx="18" cy="12" r="4" />
          <line x1="12" y1="7" x2="12" y2="17" />
        </>
      );
    case 'check':
      return <polyline points="5 12.5 10 17.5 19 7" />;
    case 'chevron-left':
      return <polyline points="14.5 6 8.5 12 14.5 18" />;
  }
}

/** The icon for a taxonomy category. */
export const CATEGORY_ICONS: Record<Category, IconName> = {
  masked_social: 'masked_social',
  unexpected_change: 'unexpected_change',
  sensory: 'sensory',
  executive: 'executive',
  transition: 'transition',
  conflict: 'conflict',
  solitude: 'solitude',
  sensory_relief: 'sensory_relief',
  unmasked_time: 'unmasked_time',
  flow: 'flow',
  unstructured: 'unstructured',
};

/** Fullness scale glyph — a circle with a horizontal fill level. Never a
    gauge: no ticks, no needle, no target. level: 0 empty … 3 full. */
export function FullnessIcon({ level, size = 36 }: { level: 0 | 1 | 2 | 3; size?: number }) {
  const fills = [0, 0.25, 0.66, 1][level];
  const r = 9;
  const cy = 12;
  const clipId = `full-${level}`;
  const top = cy + r - 2 * r * fills;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={12 - r} y={top} width={2 * r} height={2 * r} />
        </clipPath>
      </defs>
      {fills > 0 && (
        <circle cx="12" cy={cy} r={r - 1} fill="var(--moss-bar)" stroke="none" clipPath={`url(#${clipId})`} />
      )}
      <circle cx="12" cy={cy} r={r} />
    </svg>
  );
}
