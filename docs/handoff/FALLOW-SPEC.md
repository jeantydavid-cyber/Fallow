# Fallow — product spec

The companion to `FALLOW-BRIEF.md`. That file defines the surface; this one defines the machine underneath it.

**Claude Design:** read this for context, not for instruction. It tells you what a week actually contains, what calibration produces, and what triggers an observation — all of which you need in order to design the right screens. The data model and algorithms are not yours to change.

**Claude Code:** this is yours. Build from it.

---

## 1. What it does

Tracks the load going into a person's life and the recovery going in, week by week, and shows the gap over months. The goal is that someone heading into autistic or ADHD burnout notices it while there is still time to cancel something.

Not a mood tracker, not a habit tracker, not a diagnostic tool. See `FALLOW-BRIEF.md` section 2 for the research this is built on.

---

## 2. The model

A bathtub. Load flows in, recovery drains. Burnout is sustained inflow over drain.

The primary signal is **not high load** — it's recovery approaching zero for several consecutive weeks. High load with intact recovery is survivable more or less indefinitely; low load with no recovery is not. There is a test for exactly this in section 11 and it must pass.

Three data streams: load, recovery, and function markers.

---

## 3. Taxonomies

**Load** — six categories. Definitions matter; these are what the check-in and calibration both refer to.

| Key | Means |
|---|---|
| `masked_social` | Time spent performing, monitoring yourself, managing an impression. Not "time with people" — time with people you mask around. |
| `unexpected_change` | Plans altered, routine broken, something sprung on you. Counted in events, converted to an hour-equivalent by weight. |
| `sensory` | Loud, bright, crowded, smelly, unpredictable environments. |
| `executive` | Admin, forms, phone calls, decisions, anything requiring initiation. |
| `transition` | Travel, novel environments, moving between contexts. |
| `conflict` | Interpersonal rupture, confrontation, being misread or dismissed. |

**Recovery** — five categories. Not "leisure." A relaxing dinner with friends is usually net *negative* here — it's social, masked, and sensory-loaded — and the model must be able to represent that.

| Key | Means |
|---|---|
| `solitude` | Genuinely alone and unobligated. Alone-but-anxious-about-Monday does not count; the check-in wording must make this distinction. |
| `sensory_relief` | Deliberate reduction — dark, quiet, weighted, outdoors. |
| `unmasked_time` | With people you don't perform around. Parallel presence counts. |
| `flow` | Special interest, hyperfocus on something chosen. |
| `unstructured` | Predictable days with nothing scheduled and no transitions. |

**Function markers** — the three from Raymaker et al. (2020). These are the burnout signature; do not substitute mood questions.

| Key | Scale |
|---|---|
| `emptiness` | 0 none / 1 some of the week / 2 most / 3 all of it |
| `skillLoss` | 0 nothing / 1 one thing / 2 several / 3 a lot |
| `stimulusTolerance` | 0 better than usual / 1 normal / 2 worse / 3 much worse |

`skillLoss` — "was anything harder than it usually is?" — is the most sensitive early indicator in the whole system. Weight it accordingly in section 7.

---

## 4. Data model

```ts
type LoadCategory = 'masked_social' | 'unexpected_change' | 'sensory'
                  | 'executive' | 'transition' | 'conflict';

type RecoveryCategory = 'solitude' | 'sensory_relief' | 'unmasked_time'
                      | 'flow' | 'unstructured';

interface Entry {
  id: string;
  weekId: string;
  kind: 'load' | 'recovery';
  category: LoadCategory | RecoveryCategory;
  hours: number;
  label: string | null;          // "Saturday with family" — the user's words
  source: 'calendar' | 'manual' | 'inferred';
  sourceEventId: string | null;
  confirmed: boolean;            // false = app's guess, not yet reviewed
}

interface FunctionMarkers {
  emptiness: 0|1|2|3;
  skillLoss: 0|1|2|3;
  stimulusTolerance: 0|1|2|3;
}

interface Week {
  id: string;                    // ISO week: "2026-W32"
  startDate: string;
  entries: Entry[];
  markers: FunctionMarkers | null;
  checkIn: 'none' | 'quick' | 'full';
  recoveryKnown: boolean;        // see section 6 — critical
}

interface Weights {
  load: Record<LoadCategory, number>;        // relative cost per hour
  recovery: Record<RecoveryCategory, number>;
  pinned: Record<string, boolean>;           // user-edited; never auto-overwrite
  calibratedAt: number;
  refittedAt: number | null;
}
```

Derived per week: `weightedLoad = Σ hours × weights.load[cat]`, `weightedRecovery` likewise, `balance = weightedRecovery − weightedLoad`.

---

## 5. Calibration

Onboarding, 10–12 pairwise comparisons, one per screen, two large tap targets: *"Which would leave you more wiped — three hours of meetings, or three hours at a party with friends?"*

Do **not** fit a model to twelve datapoints and pretend it's personalised. Count wins per category, derive a rank order, and map ranks onto a fixed geometric scale (roughly 1.0, 1.4, 1.8, 2.3, 2.9, 3.6). Simple, inspectable, honest about its own precision. Recovery categories are calibrated the same way with "which would leave you more restored."

Output a ranked list of what costs this person most. This is the week-one payoff — the only thing the app can offer before any history exists — so it has to read as a genuine insight rather than a horoscope.

**Refit** after ≥8 weeks that have markers: ridge regression of weighted balance against a marker composite, regularised toward the calibrated prior, each weight bounded to ±40% of its calibrated value, movement capped per week so nothing lurches. Never touch a weight the user has pinned. If the refit doesn't beat the prior on held-out weeks, discard it and keep the prior. Weights are always visible and hand-editable.

---

## 6. Missing data — get this right

The three effort levels: **quick** (~20s, confirm what the calendar already knows, no markers), **full** (~2 min, adds recovery entries and the three markers), **skipped** (nothing).

**A quick week has unknown recovery, not zero recovery.** This is the single most important correctness detail in the app. Treating unknown as zero would manufacture droughts out of nothing but the user being busy, and the app would then warn someone about a crisis it invented. Drought detection reads only weeks where `recoveryKnown === true`. Unknown weeks render as unknown in the chart — visually distinct from a genuine zero — and are excluded from all consecutive-week counts.

Skipped weeks are normal. Never counted, never highlighted, never mentioned.

---

## 7. Signal logic

Compute `recoveryFloor` = median weighted recovery across the first 8 known weeks, or the calibrated default before then.

Patterns, in priority order. **Only ever surface one.** Never a list, never a dashboard of concerns.

1. **Skill-loss drift** — `skillLoss ≥ 2` for 2+ consecutive weeks with markers. Strongest single signal; it's a defining feature of the syndrome, not a proxy.
2. **Drought** — 3+ consecutive known weeks with `weightedRecovery < 0.35 × recoveryFloor`.
3. **Category collapse** — a recovery category that was regularly present has been absent for 4+ known weeks. Produces the most specific and most actionable observation: *"no flow time since April."*
4. **Sustained deficit** — 4+ consecutive known weeks with negative balance.
5. **Neutral** — none of the above. Say something plain and factual about the period, or say nothing.

Severity may escalate the wording but is **never rendered as a number, score, percentage, or risk level**.

**Observations are template-based, not LLM-generated.** Templates with slots, deterministic, offline, reviewable. Three reasons: tone is unenforceable if the strings aren't written down, an LLM narrating someone's mental state is a tone risk that cannot be tested, and this data must never leave the device. The full string list belongs in `COPY.md` from the design handoff.

Shape: `"Three weeks with almost no solitude — the longest stretch since March."` Past and present tense only. Never a prediction, never a date, never a probability.

---

## 8. Calendar

Read-only. Google Calendar and Microsoft Graph via **OAuth PKCE in the browser** — public client, no secret, no server. Tokens in IndexedDB. Calendar contents fetched client-side and never transmitted anywhere. Plus `.ics` file import as a fallback and for anyone who won't grant OAuth.

Classification is heuristic plus taught rules: recurring event titles are remembered after the user classifies them once, so "Standup" becomes `masked_social, 0.5h` permanently. Unfamiliar events are asked about once, in the check-in, never in a separate flow. Users can exclude whole calendars.

Calendar-derived entries arrive `confirmed: false` and render as the app's guess until reviewed. The check-in is a review of guesses — never an empty form.

---

## 9. Storage and privacy

Local-first. Everything in IndexedDB via Dexie. No accounts, no server-side database, no analytics on user content. This is a detailed map of someone's social, sensory, and functional life; the architecture is what makes it safe to write down.

Export: JSON for portability, plus a printable plain-language summary. That second one has a real use — people take it to a GP, an OT, or an employer to explain themselves — so it deserves proper design.

Optional user-initiated encrypted backup file. No automatic sync.

---

## 10. Non-goals

No notifications of any kind. No streaks, scores, or risk percentages. No accounts or social features. No journaling or mood tracking. No AI chat. No prediction with a date attached. No comparison to other users or to population norms. No gauge, dial, or battery metaphor for capacity — all of them imply a number and imply you're meant to be at 100%.

And the one that matters most: **never make a high-load week look like a good week.** The ADHD boom-bust pattern is push-through-then-crash; a chart that renders a heavy week as an impressive tall bar is reinforcing the mechanism that breaks people.

---

## 11. Test fixtures

Build these three before the UI. They encode the thesis.

**`drought.json`** — 12 weeks, load rising, recovery falling to near-zero over the last six. Expected: a drought observation, or skill-loss drift if markers are set. This is the happy path.

**`sparse.json`** — 12 weeks, six of them skipped, the known weeks healthy. **Expected: no warning of any kind.** If this produces a drought, the unknown-versus-zero handling in section 6 is broken, and the app is capable of inventing a crisis.

**`busy-but-fine.json`** — 12 weeks of consistently high load *and* consistently high recovery. **Expected: no warning.** This is the core thesis as an assertion: load alone is not the signal. If this fires, the model is wrong, not the fixture.

---

## 12. Build order

- **M0** — Data model, Dexie schema, week rollover. Load the three fixtures and print derived values. No UI.
- **M1** — Signal logic. All three fixtures passing. Still no UI.
- **M2** — Calibration flow and the weight model.
- **M3** — The check-in. Build this before the home screen; it's the screen the product lives or dies on.
- **M4** — Home and the load/recovery view.
- **M5** — Calendar OAuth, classification, taught rules.
- **M6** — The lever, week detail, weights editor, export.
- **M7** — Low-capacity mode, empty and sparse states, accessibility audit.

Low-capacity mode is a real designed state, not a variant: when the signal is strong, the app must get *simpler* — one sentence, one lever, and a control to hide everything else. The person it fires for has the least capacity to use a dashboard.
