# Fallow — handoff (v2 · warm & visual)

Build contract. The surface is defined by the four files beside this one plus the rendered reference `Fallow - Screens v2.dc.html`; the machine underneath is `FALLOW-SPEC.md` (data model, weights, calibration, signal logic, calendar, storage) and it is yours to build as written.

## 1. Stack

- **React + TypeScript + Vite** (the spec's data model is already TS)
- **CSS custom properties + plain CSS**; if Tailwind, the token file IS the theme — no default scale, no shadcn defaults survive
- **Dexie / IndexedDB** for storage (spec §9)
- **Chart hand-built** from divs/flex — no chart library; the horizon-line geometry, dashed-unknown state, hatch fill, and no-animation rules will fight every library default
- **Icons hand-built inline SVG** per `DESIGN-TOKENS.md` §4 — no icon library; the set is ~14 glyphs of circles, arcs, and lines
- **Nunito self-hosted** — no font CDN
- Static bundle, no server

**All data stays on-device.** No accounts, no sync by default, no analytics on content. Calendar via OAuth PKCE in the browser (public client, tokens in IndexedDB, contents never transmitted) + `.ics` import as a first-class path. This is a product feature — say it in the interface, not only a policy.

## 2. Build order

M0–M2 from `FALLOW-SPEC.md` §12 first (fixtures, signal logic, calibration — no UI). Then: **the check-in** (the product lives or dies here; the 20-second path is the acceptance test), icon tile + buttons as real components, home + chart with unknown-vs-zero rendering, calendar + taught rules, lever/week detail/weights/export, low-capacity + empty states, accessibility audit.

## 3. Acceptance criteria — each independently checkable

**Accessibility**
- [ ] Greyscale test: `grayscale(1)` screenshots of every screen lose nothing (solid/hatch/dashed/absent carry the chart; border+fill+weight carry selection)
- [ ] No red or orange in the built CSS — no saturated hue under ~40° or above ~330°; muted golds (`#94793A`, `#C0A557`) are the warm ceiling. No `--danger` token exists.
- [ ] No `#000`/`#FFF` in either theme
- [ ] Contrast: every shipped fg/bg pair measured, both themes — body ≥4.5:1, large/non-text ≥3:1. Baseline tables in `DESIGN-TOKENS.md`; re-measure anything you change. Decorative-only tokens (`--gold`, hairlines) must never be the sole carrier of meaning.
- [ ] Full keyboard operability; focus ring visible everywhere; DOM order = visual order
- [ ] `prefers-reduced-motion`: zero animation; lever projection still legible
- [ ] Tap targets ≥48px with ≥8px gaps (audit the built DOM)
- [ ] 320px and 200% zoom together: no horizontal scroll, nothing clipped, nothing under 12px
- [ ] Every icon has a visible text label — no icon-only controls
- [ ] Both themes authored and manually switchable; dark re-measured on the styleguide before shipping

**Product correctness**
- [ ] 20-second path: time it on a phone, from "Look" to back on home via "Yes"
- [ ] Zero notification permissions — grep for `Notification`, `requestPermission`, push registration: no results
- [ ] `sparse.json` → **no warning of any kind** (the most important test: unknown ≠ zero)
- [ ] `busy-but-fine.json` → no warning (load alone is not the signal)
- [ ] `drought.json` → exactly **one** observation, never a list
- [ ] No demand bar ever grows upward; no week is ever called productive or good
- [ ] Every user-facing string resolves to `COPY.md`; banned-word grep of the bundle is clean on screen
- [ ] "Not this week" four times in a row leaves no trace anywhere
- [ ] Same state loaded twice → identical DOM order on every screen

## 4. `/styleguide` route

Ships in dev builds, kept current: all tokens as swatches with **runtime-computed** contrast ratios; every component in every state (including the *n/a* states shown as explicit "does not exist"); the chart in all seven column states; the full icon set with labels; greyscale, reduced-motion, 320px, and 200%-zoom toggles.

## 5. Screenshot and self-critique at every milestone

Never declare a milestone done from reading code. Screenshot every touched screen (both themes, 390 + 1280, plus greyscale), compare against `SCREENS.md` and the rendered reference, write down what's wrong, fix or record why not. Watch for: a bar growing upward, a radius creeping past 16px, a library shadow, a tap target shrinking under a text change, a clipped focus ring, a string not in `COPY.md`, an element that moved between sessions.

## 6. Tempting and wrong

- A check-in reminder notification → never; the check-in is pulled
- Colour-coding severity → wording may firm up; the palette never changes
- Any number on home (balance, index, %) → invites a target
- Showing all live patterns → one observation, always
- "8 of 12 weeks logged" → missing data is normal and displays as normal
- Reordering home by relevance → fixed order is load-bearing
- Auto-entering low-capacity mode → offered, chosen, never imposed
- LLM-written observations → templates only; data never leaves the device
- Treating a quick check-in as zero rest → the worst bug available; it invents crises
- An illustration of a calm person meditating → no
- Cute mascot / seasonal decorations to add warmth → warmth is the palette and the icons, not a character

## 7. Fixed vs yours

**Fixed:** token values and measured ratios, the icon construction rules, fixed ordering, the copy deck, no red/orange, no notifications, three effort levels, unknown-vs-zero, one-observation rule, demands-hang-down geometry.
**Yours:** everything in `FALLOW-SPEC.md` — model, weights, refit, calendar classification, storage, export, fixtures.
**Ask first:** any new number on screen, a second observation, a new colour, any conditional element ordering, any new icon that needs more than circles/arcs/lines.
