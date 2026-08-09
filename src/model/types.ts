// Fallow data model — FALLOW-SPEC.md §4. Not to be changed casually:
// the signal logic, calibration, and fixtures all build on these shapes.

export type LoadCategory =
  | 'masked_social'
  | 'unexpected_change'
  | 'sensory'
  | 'executive'
  | 'transition'
  | 'conflict';

export type RecoveryCategory =
  | 'solitude'
  | 'sensory_relief'
  | 'unmasked_time'
  | 'flow'
  | 'unstructured';

export type Category = LoadCategory | RecoveryCategory;

export const LOAD_CATEGORIES: LoadCategory[] = [
  'masked_social',
  'unexpected_change',
  'sensory',
  'executive',
  'transition',
  'conflict',
];

export const RECOVERY_CATEGORIES: RecoveryCategory[] = [
  'solitude',
  'sensory_relief',
  'unmasked_time',
  'flow',
  'unstructured',
];

export interface Entry {
  id: string;
  weekId: string;
  kind: 'load' | 'recovery';
  category: Category;
  hours: number;
  label: string | null; // "Saturday with family" — the user's words
  source: 'calendar' | 'manual' | 'inferred';
  sourceEventId: string | null;
  confirmed: boolean; // false = app's guess, not yet reviewed
  /** 0 = Monday … 6 = Sunday. Presentation only (the lever names days);
      not part of the spec's derived math. */
  dayOfWeek?: number | null;
}

export type MarkerValue = 0 | 1 | 2 | 3;

export interface FunctionMarkers {
  emptiness: MarkerValue;
  skillLoss: MarkerValue;
  stimulusTolerance: MarkerValue;
}

export interface Week {
  id: string; // ISO week: "2026-W32"
  startDate: string;
  entries: Entry[];
  markers: FunctionMarkers | null;
  checkIn: 'none' | 'quick' | 'full';
  recoveryKnown: boolean; // unknown is never zero — FALLOW-SPEC.md §6
}

export interface Weights {
  load: Record<LoadCategory, number>; // relative cost per hour
  recovery: Record<RecoveryCategory, number>;
  pinned: Record<string, boolean>; // user-edited; never auto-overwrite
  calibratedAt: number;
  refittedAt: number | null;
}

export interface WeekDerived {
  weightedLoad: number;
  weightedRecovery: number;
  balance: number;
}

/** A recurring-title classification the user taught the app once. */
export interface TaughtRule {
  id: string;
  titleKey: string; // normalised event title
  kind: 'load' | 'recovery' | 'ignore';
  category: Category | null;
  hours: number | null; // null = use the event's own duration
}

export interface Settings {
  theme: 'light' | 'dark';
  checkInDay: number; // 0 = Sunday … 6 = Saturday
  lowCapacity: boolean; // offered, chosen, never imposed
  onboarded: boolean;
  excludedCalendars: string[];
}
