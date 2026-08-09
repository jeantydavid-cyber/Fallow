# Fallow — copy deck (v2)

Every string in the app. If a string is not here, it does not ship. v2 is deliberately terse: icons carry meaning, words are labels. But the few sentences that remain do the emotional work, so their rules are strict.

## 0. Tone rules

- Second person, warm, plain, contractions. No exclamation marks anywhere.
- The app observes, never assesses: "Not much time to yourself lately." — never "your burnout risk is elevated."
- Past and present tense only. No predictions, dates, or probabilities.
- No praise for logging, no encouragement, no "great job".
- No advice unless the user opened the lever.
- Compare only to the user's own history, never to a norm or other users.
- Banned on screen: **should, just, simply, easy, failed, invalid, required, streak, score, risk, progress, goal, target, achievement, wellness, journey, mindful, self-care**.
- Observations are **template-based and deterministic** — no LLM writes anything about the user's state.

## 1. Observations (home, one line, max ~28ch)

Only one ever shows; priority order from `FALLOW-SPEC.md` §7. Slots: `{n}` count in words, `{month}`, `{thing}` from the names table (§7).

**Skill-loss drift** (priority 1)
- "Things have been harder lately." (2 wks)
- "Things have been harder for {n} weeks." (3–4)
- "Things have been harder since {month}." (5+)

**Drought** (2)
- "Not much {thing} lately."
- "Hardly any {thing} for {n} weeks." (4–7)
- "Hardly any {thing} since {month}." (8+)

**Category collapse** (3)
- "No {thing} since {month}."
- "No {thing} since {month} — it's what helps you most." (if top-weighted)

**Sustained deficit** (4)
- "More going out than coming in, {n} weeks now."

**Neutral** (5)
- "{thing} has held steady." · "Lighter than {month}." · "A steady few weeks."
- Busy-but-fine: "Full weeks, but the time to yourself is still there." — **this case is never a warning.**
- Under 3 known weeks: no observation.

## 2. Home

"Fallow" · "12 weeks" · legend "rest / demands / not sure" · card "How was last week?" · primary "Look" · quiet "Not this week" · lever entry "A couple of things could move." + "Have a look"

The check-in card never changes with waiting time — no urgency, ever.

## 3. Check-in

**Step 1** — "Sound right?" · rows from calendar (user's own words + hours) · unknown row "Thursday 7pm — what was this?" · primary "Yes" · secondary "Fix it" · quiet "Not this week" ·
No calendar: "What filled last week?" · "Add something"

**Step 2** — "Running on empty this week?" · tiles "Not really / Some days / Most days / All week" · caption "The circle is how full you felt." · quiet "Skip this one"

**Harder?** — "Was anything harder than usual?" · sub "Cooking, replying, going out." · tiles "Not really / One thing / A few things / Lots"

**Noise & light** — "How were noise, light, and people?" · tiles "Fine / Normal / Harder / Much harder"

**Step 3** — "What helped?" · tiles "Time alone / Quiet & dark / Safe company / Deep in a thing / A day with nothing in it" · stepper "Roughly how long?" · primary "Done"

After Done: "That's it." Nothing more. Skipping produces no consequence and no comment, then or ever.

## 4. Empty & sparse

- First run: "One week in. Something to see around {month}." · "{finding}. That much is already known." · "See the list"
- Return: "The last week here is from {month}."
- Week detail, unknown: "Rest not recorded this week." · skipped: "Nothing recorded this week."
- Lever, nothing booked: "Nothing booked for two weeks."

## 5. The lever — "Coming up"

Rows: "{title}" + "{day} · the heaviest thing" (top row only) · actions "Write a decline" / "Go for half" / "Protect it" / "Undo" · free day "{day} — nothing yet" + "A whole clear day" · protected "{day} — kept clear" · declined "Declined. Draft copied." · projection line "Protecting {day} changes the picture." / "That's the first clear day since {month}."

Decline drafts (copyable, user always edits and sends themself):
- Work: "I'm not going to make this one — too much on that week. Happy to catch up on what I miss."
- Half: "I'll come for the morning and head off after lunch."
- Personal: "Going to sit this one out — I need a quiet weekend. Let's do something soon."
- No reason: "Can't make it this time. Hope it's a good one."
- Recurring: "Stepping back from these for a few weeks. I'll let you know when I'm back."

None apologise twice or name a health reason — that disclosure is the user's call, never a default.

## 6. Low-capacity mode

Line one: "It's been a heavy few weeks." / "Things have been harder for a while." / "Not much {thing} for a long time."
Line two: "{day} is still free. It could stay that way." / "{title} is the biggest thing coming up." / "Nothing obvious to move right now."
Button: "Keep {day} clear" / "Write a decline" / "Have a look" · always: quiet "Show me everything"

## 7. Names (plain language, everywhere)

Load: Meetings & masking · Plans changing · Loud & busy places · Admin & decisions · Travel · Falling out
Recovery: Time alone · Quiet & dark · Safe company · Deep in a thing · Clear days
In observations (lower case): "time to yourself" (solitude) · "quiet" · "easy company" · "time deep in something" · "clear days"
Taxonomy keys (`masked_social` etc.) never appear on screen.

## 8. Errors & system

- Calendar unreachable: "Can't reach your calendar right now. You can add things yourself." · "Add something"
- Storage blocked: "This browser isn't letting anything be saved. Private browsing is the usual reason."
- Bad import: "Couldn't read that file. It needs to be a .ics or a Fallow export."
- Wrong backup password: "That password doesn't open this file."

Never *failed*, *invalid*, *error*, or blame. No toasts, banners, or modals.

## 9. Onboarding & weights & settings

Pairwise: "Which leaves you more wiped?" / "Which fills you back up more?" · quiet "About the same" · counter "{n} / 12"
Payoff: "{Thing} costs you more than anything else you do." · "About {n}× an hour of {lowest}." · "Save this as a page" · "Start"
Weights: "What costs you most" · pinned "Set by you. Left alone." · refit trace "Was {n} until {month}." · stepper "Costs more / Costs less"
Settings: check-in day "Which day suits you to look back?" · theme "Light / Dark" + "Stays how you set it." · calendars "Read-only. Nothing leaves this device." · notifications row (a statement, not a control): "There are none. There never will be." · delete "Delete everything" → "Removes every week, weight, and setting from this device. There's no copy anywhere else." → "Delete it all"

## 10. Printable summary

Opens: "This is a record of {name}'s demands and rest over {n} weeks, kept weekly. It isn't a diagnosis and wasn't produced by a clinician."
Closes: "The three things tracked — exhaustion, things becoming harder, and reduced tolerance to noise, light, and people — come from community-based research into autistic burnout (Raymaker et al., 2020)."
Plain page, no app chrome, no icons required — written for a GP, an OT, or an employer who has never seen the app.
