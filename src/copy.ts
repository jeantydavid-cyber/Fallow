// Fallow copy deck — COPY.md (v2). Every user-facing string in the app lives
// here. If a string is not in this file, it does not ship. Observations are
// template-based and deterministic; no generated text anywhere.

import type { Category, LoadCategory, RecoveryCategory } from './model/types';

// §7 Names — plain language, everywhere. Taxonomy keys never appear on screen.
export const LOAD_NAMES: Record<LoadCategory, string> = {
  masked_social: 'Meetings & masking',
  unexpected_change: 'Plans changing',
  sensory: 'Loud & busy places',
  executive: 'Admin & decisions',
  transition: 'Travel',
  conflict: 'Falling out',
};

export const RECOVERY_NAMES: Record<RecoveryCategory, string> = {
  solitude: 'Time alone',
  sensory_relief: 'Quiet & dark',
  unmasked_time: 'Safe company',
  flow: 'Deep in a thing',
  unstructured: 'Clear days',
};

export const CATEGORY_NAMES: Record<Category, string> = {
  ...LOAD_NAMES,
  ...RECOVERY_NAMES,
};

// Lower-case names used inside observations.
export const OBSERVATION_NAMES: Record<RecoveryCategory, string> = {
  solitude: 'time to yourself',
  sensory_relief: 'quiet',
  unmasked_time: 'easy company',
  flow: 'time deep in something',
  unstructured: 'clear days',
};

// §1 Observations — one line, max ~28ch, only one ever shows.
export const OBSERVATIONS = {
  skillLoss2: 'Things have been harder lately.',
  skillLossN: (n: string) => `Things have been harder for ${n} weeks.`,
  skillLossSince: (month: string) => `Things have been harder since ${month}.`,
  drought: (thing: string) => `Not much ${thing} lately.`,
  droughtN: (thing: string, n: string) => `Hardly any ${thing} for ${n} weeks.`,
  droughtSince: (thing: string, month: string) => `Hardly any ${thing} since ${month}.`,
  collapse: (thing: string, month: string) => `No ${thing} since ${month}.`,
  collapseTop: (thing: string, month: string) =>
    `No ${thing} since ${month} — it's what helps you most.`,
  deficit: (n: string) => `More going out than coming in, ${n} weeks now.`,
  steady: (thing: string) => `${thing[0].toUpperCase()}${thing.slice(1)} has held steady.`,
  lighter: (month: string) => `Lighter than ${month}.`,
  steadyFewWeeks: 'A steady few weeks.',
  busyButFine: 'Full weeks, but the time to yourself is still there.',
} as const;

// §2 Home
export const HOME = {
  appName: 'Fallow',
  weeksLabel: (n: number) => `${n} week${n === 1 ? '' : 's'}`,
  legendRest: 'rest',
  legendDemands: 'demands',
  legendNotSure: 'not sure',
  checkInTitle: 'How was last week?',
  look: 'Look',
  notThisWeek: 'Not this week',
  leverEntry: 'A couple of things could move.',
  leverAction: 'Have a look',
} as const;

// §3 Check-in
export const CHECKIN = {
  step1Title: 'Sound right?',
  unknownRow: (label: string) => `${label} — what was this?`,
  yes: 'Yes',
  fixIt: 'Fix it',
  noCalendarTitle: 'What filled last week?',
  addSomething: 'Add something',
  step2Title: 'Running on empty this week?',
  fullnessTiles: ['Not really', 'Some days', 'Most days', 'All week'],
  fullnessCaption: 'The circle is how full you felt.',
  skipThisOne: 'Skip this one',
  harderTitle: 'Was anything harder than usual?',
  harderSub: 'Cooking, replying, going out.',
  harderTiles: ['Not really', 'One thing', 'A few things', 'Lots'],
  noiseTitle: 'How were noise, light, and people?',
  noiseTiles: ['Fine', 'Normal', 'Harder', 'Much harder'],
  step3Title: 'What helped?',
  stepper: 'Roughly how long?',
  done: 'Done',
  thatsIt: "That's it.",
  back: 'Back',
} as const;

// §4 Empty & sparse
export const EMPTY = {
  firstRun: (month: string) => `One week in. Something to see around ${month}.`,
  firstRunFinding: (finding: string) => `${finding}. That much is already known.`,
  seeTheList: 'See the list',
  // What a brand-new person sees before any week exists.
  nothingYet: 'Nothing here yet. The chart fills in a week at a time.',
  whenAWeekEnds: 'When a week ends, this is where you look back on it.',
  returnAfterGap: (month: string) => `The last week here is from ${month}.`,
  weekUnknown: 'Rest not recorded this week.',
  weekSkipped: 'Nothing recorded this week.',
  leverEmpty: 'Nothing booked for two weeks.',
} as const;

// §5 The lever
export const LEVER = {
  title: 'Coming up',
  heaviest: (day: string) => `${day} · the heaviest thing`,
  writeDecline: 'Write a decline',
  goForHalf: 'Go for half',
  protectIt: 'Protect it',
  undo: 'Undo',
  freeDay: (day: string) => `${day} — nothing yet`,
  freeDaySub: 'A whole clear day',
  protectedDay: (day: string) => `${day} — kept clear`,
  protectedSub: 'Kept clear',
  declined: 'Declined. Draft copied.',
  projection: (day: string) => `Protecting ${day} changes the picture.`,
  projectionFirstClear: (month: string) => `That's the first clear day since ${month}.`,
  drafts: {
    work: "I'm not going to make this one — too much on that week. Happy to catch up on what I miss.",
    half: "I'll come for the morning and head off after lunch.",
    personal: "Going to sit this one out — I need a quiet weekend. Let's do something soon.",
    noReason: "Can't make it this time. Hope it's a good one.",
    recurring: "Stepping back from these for a few weeks. I'll let you know when I'm back.",
  },
} as const;

// §6 Low-capacity mode
export const LOW_CAPACITY = {
  lineOneHeavy: "It's been a heavy few weeks.",
  lineOneHarder: 'Things have been harder for a while.',
  lineOneDrought: (thing: string) => `Not much ${thing} for a long time.`,
  lineTwoFree: (day: string) => `${day} is still free. It could stay that way.`,
  lineTwoBiggest: (title: string) => `${title} is the biggest thing coming up.`,
  lineTwoNothing: 'Nothing obvious to move right now.',
  buttonKeepClear: (day: string) => `Keep ${day} clear`,
  buttonWriteDecline: 'Write a decline',
  buttonHaveALook: 'Have a look',
  showEverything: 'Show me everything',
} as const;

// §8 Errors & system — never failed, invalid, error, or blame.
export const SYSTEM = {
  calendarUnreachable: "Can't reach your calendar right now. You can add things yourself.",
  storageBlocked: "This browser isn't letting anything be saved. Private browsing is the usual reason.",
  badImport: "Couldn't read that file. It needs to be a .ics or a Fallow export.",
  wrongPassword: "That password doesn't open this file.",
} as const;

// §9 Onboarding, weights & settings
export const ONBOARDING = {
  pairwiseLoad: 'Which leaves you more wiped?',
  pairwiseRecovery: 'Which fills you back up more?',
  aboutTheSame: 'About the same',
  or: 'or',
  counter: (n: number, total: number) => `${n} / ${total}`,
  payoff: (thing: string) => `${thing} costs you more than anything else you do.`,
  // Same finding without the full stop, for sentences that continue.
  findingBare: (thing: string) => `${thing} costs you more than anything else you do`,
  pairwiseHelpLoad: 'No right answers. Pick the one that would take more out of you.',
  pairwiseHelpRecovery: 'No right answers. Pick the one that would leave you more restored.',
  payoffRecovery: (thing: string) => `${thing} fills you back up more than anything else.`,
  payoffRatio: (n: string, lowest: string) => `About ${n}× an hour of ${lowest}.`,
  saveAsPage: 'Save this as a page',
  start: 'Start',
} as const;

export const WEIGHTS_SCREEN = {
  title: 'What costs you most',
  restores: 'What fills you back up',
  heaviest: 'the heaviest thing',
  pinned: 'Set by you. Left alone.',
  refitTrace: (n: string, month: string) => `Was ${n} until ${month}.`,
  costsMore: 'Costs more',
  costsLess: 'Costs less',
} as const;

export const SETTINGS_SCREEN = {
  title: 'Settings',
  checkInDay: 'Which day suits you to look back?',
  theme: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeNote: 'Stays how you set it.',
  calendars: 'Calendars',
  calendarsNote: 'Read-only. Nothing leaves this device.',
  importIcs: 'Import a calendar file',
  notificationsLabel: 'Notifications',
  notificationsNote: 'There are none. There never will be.',
  exportJson: 'Export everything',
  exportSummary: 'Print a summary',
  deleteAll: 'Delete everything',
  deleteConfirmBody:
    "Removes every week, weight, and setting from this device. There's no copy anywhere else.",
  deleteConfirm: 'Delete it all',
  keep: 'Keep it',
  days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
} as const;

// §10 Printable summary
export const SUMMARY = {
  opening: (name: string, n: number) =>
    `This is a record of ${name}'s demands and rest over ${n} weeks, kept weekly. It isn't a diagnosis and wasn't produced by a clinician.`,
  closing:
    'The three things tracked — exhaustion, things becoming harder, and reduced tolerance to noise, light, and people — come from community-based research into autistic burnout (Raymaker et al., 2020).',
} as const;

// Week detail
export const WEEK_DETAIL = {
  restFirst: 'Rest',
  demandsSecond: 'Demands',
  youSaid: 'You said',
  changeSomething: 'Change something here',
  hours: (h: number) => `${h % 1 === 0 ? h : h.toFixed(1)}h`,
} as const;

// Markers rendered back as one plain sentence under "You said".
export const MARKER_SENTENCES = {
  emptiness: ['', 'Running low some days', 'Running on empty most days', 'Running on empty all week'],
  skillLoss: ['', 'One thing was harder than usual', 'A few things were harder than usual', 'Lots was harder than usual'],
  stimulusTolerance: ['Noise and light easier than usual', '', 'Noise, light, and people were harder', 'Noise, light, and people were much harder'],
} as const;
