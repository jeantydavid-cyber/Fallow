# Fallow — screens (v2 · warm & visual)

Rendered reference: `Fallow - Screens v2.dc.html` (home, three check-in steps, onboarding pairwise, low-capacity, lever). Week detail, weights, empty states, and dark theme follow the same language and are specified here in tokens.

---

## Fixed ordering — read first

**Element order within every screen is identical across every session, in every state.** Nothing reorders by recency, severity, or usage. Predictability is load-bearing for this audience; any adaptive reordering is a severity-one bug. The only permitted variation is *presence* (the check-in card, the lever entry) — what remains never moves.

## Breakpoints

390px reference; 320px drops screen padding to 16px and chart gap to 4px, type unchanged; ≥768px caps the column at 560px centred; 1280px pads to 64px and lets the chart breathe — same single column, never a dashboard, never a sidebar. Must work at 200% zoom at 320px with no horizontal scroll.

---

## 1. Home

1. Header — sun-on-horizon mark + "Fallow" (18px/800) left, "12 weeks" (`--muted`) right
2. Chart card — bars, then legend (rest · demands · not sure), centred
3. Observation — one short sentence, 20px/700 `--heading`, max 28ch. **Only ever one.**
4. Check-in card — sun-ring icon, "How was last week?", primary **Look** — present only when a week is ready
5. Quiet *Not this week*, centred

Nothing else. No week counts, no streaks, no scores, no second concern. Readable in two seconds by someone exhausted: bars, one line, one button.

## 2. Check-in (three steps, 20-second default)

**Step 1 — "Sound right?"** Icon rows of the app's calendar guesses (icon, label, hours). Primary **Yes** (with check icon) beside secondary **Fix it**, quiet *Not this week* below. **Yes** ends the check-in: `checkIn: 'quick'`, `recoveryKnown: false` — *unknown, never zero*. Unrecognised events get a dashed row, asked about here, never in a separate flow.

**Step 2 — "Running on empty this week?"** The fullness scale (4 tiles), caption, quiet *Skip this one*. Back chevron + progress dots in the header.

(Full path also asks "Was anything harder than usual?" and "How were noise, light, and people?" as 4 icon tiles each — same layout as step 2. These are the burnout markers; never replace them with mood questions, never use sliders or 1–10 scales.)

**Step 3 — "What helped?"** 2-up icon tile grid: Time alone · Quiet & dark · Safe company · Deep in a thing · A day with nothing in it (full-width). Multi-select; selected tiles gain a small "roughly how long?" stepper. Primary **Done**.

After **Done**: return to home, no celebration, no summary, no thanks.

## 3. Low-capacity mode

A separate route, not a hidden-elements home. 48px top padding, one big sun-on-horizon icon (56px), one statement (26px/800, max 16ch), one softer line (17px/600 `--body`), spacer, one primary lever button with icon ("Keep Saturday clear"), quiet *Show me everything*.

Absent: chart, check-in, lists, numbers, navigation. Offered, never auto-entered; leaving is one tap.

## 4. The lever — "Coming up"

1. Title
2. Item rows, heaviest first *by this person's weights*, top row expanded with **Write a decline** / **Go for half**
3. Free-day row (dashed green) with inline **Protect it**
4. Mini projection card — 4 columns, future weeks dashed, one line of text ("Protecting Sunday changes the picture.")

Acting on a row updates the projection within 180ms and never re-sorts the list under the user's finger. Decline drafts are copyable text the user sends themself (strings in `COPY.md` §5).

## 5. Week detail

Rest first, demands second — always. Icon rows named before quantified ("Time alone · 2h"). Markers rendered back as one plain sentence under "You said". Unknown week: "Rest not recorded this week." — never "0h". One secondary *Change something here*.

## 6. Weights — "What costs you most"

Ranked icon rows (icon, plain-language name, weight glyph), one short lead line. Editing = a Costs more / Costs less stepper over the fixed scale 1.0–3.6; pinned rows say "Set by you. Left alone." and are never auto-overwritten. It reads as an explanation, not a settings page.

## 7. Onboarding

10–12 pairwise icon-card screens, then the payoff: one finding as a headline ("Masking costs you more than anything else you do."), ranked bars with icons, **Save this as a page** (plain printable, no branding) + primary **Start**.

## 8. Empty and sparse — normal, not errors

- **First run**: bare horizon line, one bar at the right; "One week in. There'll be something to see around {month}." + the calibration finding restated on a card.
- **Sparse**: skipped weeks are empty columns; the line runs through unbroken; nothing counts or mentions them. Against `sparse.json` this screen produces **no warning of any kind** — if it does, unknown-vs-zero is broken and the app is inventing crises.
- **Return after a gap**: "The last week here is from {month}." Nothing else. No welcome back, no missed-weeks summary.
- **No calendar**: everything works; step 1 becomes "add what you remember" with the icon rows empty.

## 9. Dark theme

Token swap per `DESIGN-TOKENS.md`; identical geometry. Manually switchable, does not follow the system. Render it on the styleguide and re-measure every pair before shipping.
