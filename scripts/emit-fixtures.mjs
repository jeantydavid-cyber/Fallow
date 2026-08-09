// Emits the three acceptance fixtures from FALLOW-SPEC.md §11 into
// src/fixtures/. Deterministic; run `node scripts/emit-fixtures.mjs` to
// regenerate.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'fixtures');
mkdirSync(out, { recursive: true });

let entrySeq = 0;
function entry(weekId, kind, category, hours, label = null) {
  return {
    id: `fx-${++entrySeq}`,
    weekId,
    kind,
    category,
    hours,
    label,
    source: 'manual',
    sourceEventId: null,
    confirmed: true,
  };
}

// Monday of ISO week (year, week)
function weekStart(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  return monday.toISOString().slice(0, 10);
}

function week(year, num, { load = [], recovery = [], markers = null, checkIn = 'full', recoveryKnown = true } = {}) {
  const id = `${year}-W${String(num).padStart(2, '0')}`;
  return {
    id,
    startDate: weekStart(year, num),
    entries: [
      ...load.map(([cat, h, label]) => entry(id, 'load', cat, h, label ?? null)),
      ...recovery.map(([cat, h, label]) => entry(id, 'recovery', cat, h, label ?? null)),
    ],
    markers,
    checkIn,
    recoveryKnown,
  };
}

// ---------------------------------------------------------------------------
// drought.json — 12 weeks, load rising, recovery falling to near-zero over
// the last six. Markers set: skillLoss reaches 2 in the last three weeks, so
// with markers this fires skill-loss drift; with markers stripped it must
// fire drought. The happy path.
const drought = { weeks: [] };
for (let i = 0; i < 12; i++) {
  const w = 10 + i; // 2026-W10 … 2026-W21
  const rising = i / 11;
  const loadHours = [
    ['masked_social', 6 + Math.round(rising * 8)],
    ['executive', 3 + Math.round(rising * 4)],
    ['sensory', 2 + Math.round(rising * 3)],
  ];
  // Healthy early, collapsing over the last six weeks.
  const rec =
    i < 6
      ? [
          ['solitude', 6],
          ['sensory_relief', 3],
          ['flow', 4],
        ]
      : [
          ['solitude', Math.max(0.5, 6 - (i - 5) * 1.2)],
          ['flow', Math.max(0, 4 - (i - 5) * 1.0)],
        ].filter(([, h]) => h > 0);
  const markers = {
    emptiness: i < 6 ? 0 : Math.min(3, Math.floor((i - 5) / 2) + 1),
    skillLoss: i < 9 ? (i < 7 ? 0 : 1) : 2,
    stimulusTolerance: i < 6 ? 1 : 2,
  };
  drought.weeks.push(
    week(2026, w, { load: loadHours, recovery: rec, markers, checkIn: 'full', recoveryKnown: true }),
  );
}

// ---------------------------------------------------------------------------
// sparse.json — 12 weeks, six skipped, the known weeks healthy.
// Expected: NO warning of any kind. If this produces a drought, unknown-vs-
// zero handling is broken and the app is inventing crises.
const sparse = { weeks: [] };
for (let i = 0; i < 12; i++) {
  const w = 10 + i;
  const skipped = [1, 3, 4, 6, 8, 10].includes(i);
  if (skipped) {
    sparse.weeks.push(week(2026, w, { checkIn: 'none', recoveryKnown: false }));
  } else {
    sparse.weeks.push(
      week(2026, w, {
        load: [
          ['masked_social', 8],
          ['executive', 4],
        ],
        recovery: [
          ['solitude', 6],
          ['flow', 5],
          ['sensory_relief', 2],
        ],
        markers: { emptiness: 0, skillLoss: 0, stimulusTolerance: 1 },
        checkIn: 'full',
        recoveryKnown: true,
      }),
    );
  }
}

// ---------------------------------------------------------------------------
// busy-but-fine.json — 12 weeks of consistently high load AND consistently
// high recovery. Expected: NO warning. Load alone is not the signal.
const busy = { weeks: [] };
for (let i = 0; i < 12; i++) {
  const w = 10 + i;
  busy.weeks.push(
    week(2026, w, {
      load: [
        ['masked_social', 10, 'Full week of meetings'],
        ['executive', 6],
        ['sensory', 4],
        ['transition', 3],
      ],
      recovery: [
        ['solitude', 10],
        ['flow', 6],
        ['sensory_relief', 4],
        ['unmasked_time', 3],
      ],
      markers: { emptiness: 1, skillLoss: 0, stimulusTolerance: 1 },
      checkIn: 'full',
      recoveryKnown: true,
    }),
  );
}

writeFileSync(join(out, 'drought.json'), JSON.stringify(drought, null, 2));
writeFileSync(join(out, 'sparse.json'), JSON.stringify(sparse, null, 2));
writeFileSync(join(out, 'busy-but-fine.json'), JSON.stringify(busy, null, 2));
console.log('fixtures written to', out);
