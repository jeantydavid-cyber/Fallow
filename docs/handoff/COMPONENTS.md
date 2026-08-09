# Fallow — components (v2 · warm & visual)

Shared rules for everything here: tap targets ≥48px with ≥8px gaps; the focus ring from `DESIGN-TOKENS.md` §6 on every focusable element, never removed; every icon has a visible text label; nothing reachable only by gesture; no red/orange, no shadows, no radius above 16px. States a component cannot reach are marked *n/a* deliberately.

---

## 1. Icon tile

The signature control. Check-in answers, recovery picks, and onboarding choices are all this: a rounded card with a geometric icon on top and a short label under it.

Structure: `--card` fill, 1px `--hairline`, radius 14px, column layout, icon (32–44px) + label (`tile-label`), min-height 96px (answer grid) to 150px (onboarding). Grid: 2-up for recovery picks, 4-up for the fullness scale, full-width span allowed for the odd item out.

| State | Treatment |
|---|---|
| **default** | as above, label 700 in `--body` |
| **hover** | border → `--moss-bar` |
| **focus-visible** | focus ring, 2px offset |
| **pressed** | fill → `--card-selected`, 120ms |
| **selected** | 2.5px `--gold-border` (padding compensates 1.5px), `--card-selected` fill, label → 800 `--heading` |
| **disabled / loading / error** | *n/a — an unavailable answer is not rendered* |

Selection is border + fill + label weight: two of the three survive greyscale.

Multi-select (What helped?) is identical; single-select (fullness, pairwise) advances or commits on tap.

## 2. Row (calendar entry, lever item)

Icon left, title (+ optional one-line subtitle in `--muted`) middle, trailing slot right (hours figure, weight glyph, or an inline button). `--card` fill, 1px `--hairline`, radius 12–14px, min-height 56px.

The **weight glyph** in the trailing slot is three tiny bars of rising height; filled bars show how heavy this item is *for this person*. It is always paired with a text subtitle ("the heaviest thing") — the glyph alone never carries the meaning.

States mirror the icon tile. The free-day row variant uses a 2px dashed `--moss-text`-family border (`#77875C`) and its own green text tokens — dashed here means "nothing here yet", visually consistent with "not sure".

| Acted state | Treatment |
|---|---|
| **declined** | 55% opacity, struck title, subtitle → "Declined. Draft copied.", stays in place |
| **protected** | dashed border → solid 2.5px `--moss-bar`, subtitle → "Kept clear" |
| **undo** | visible *Undo* on the row for the whole session |

## 3. Button

**Primary**: `--moss` fill, `--cream-on-moss` text at 16–18px/800, radius 12–16px, min-height 48–60px, optional leading icon. **Secondary**: `--card-selected` fill, 1px `#CBBD9E` border, `--heading` text. **Quiet**: text-only, `--muted`, 15px/700, min-height 44px — used for *Not this week*, *Skip this one*, *About the same*.

The quiet rank is deliberate: "Not this week" must be always present and never nagging. It is one visual step down, never hidden, and tapping it produces no consequence and no comment, then or ever.

| State | Primary | Secondary | Quiet |
|---|---|---|---|
| hover | fill → `#4E5F38` | border → `--gold-border` | text → `--heading` |
| focus-visible | ring | ring | ring |
| pressed | fill → `#42502D` | fill → `--card` | — |
| disabled | 45% opacity, still focusable | same | *n/a* |
| loading | label → "Saving", width held, no spinner | *n/a* | *n/a* |

## 4. Rest / demands chart

Rounded bars around a single continuous horizon line (geometry in `DESIGN-TOKENS.md` §7).

| Column state | Rendering |
|---|---|
| known | solid moss bar up, hatched sand bar down |
| zero rest | bare line above that column |
| not sure (`recoveryKnown: false`) | 2px dashed `--unknown` outline up, at last known height, no fill |
| skipped | nothing; empty column |
| projected (lever) | dashed outlines both sides |
| empty (no history) | the line alone |
| hover / focus | column bg → `--card-selected`; arrow keys move columns |

Legend (rest · demands · not sure) always visible under the chart, 12px/700 `--muted`, each with its swatch. Screen-reader layer: a visually-hidden table with week, rest, demands, status per row.

**Zero is a bare line; not-sure is a dashed ghost.** Confusing them manufactures droughts — see acceptance tests.

## 5. Fullness scale

Four icon tiles in a row, each a 36px circle with a horizontal fill level: full / two-thirds / one-quarter / empty, filled with `--moss-bar`. Labels: *Not really / Some days / Most days / All week*. Caption under the row: "The circle is how full you felt."

Fills are always horizontal levels (never vertical halves, never pie wedges — those read as phases or portions). Not a gauge: no ticks, no needle, no percentage, no target.

## 6. Pairwise card (onboarding)

Two stacked cards, each min-height 150px, icon 44px + one short line at 17px/800, hairline "or" divider between, quiet *About the same* at the foot. Tapping advances after a 120ms pressed state; *Back* is always present and answers are revisable.

## 7. Check-in progress dots

Three 8px dots, `--moss` for done/current, `#D8CCAF` for ahead. Not a progress bar, no percentage, no step names. Dots because a depleted person needs "nearly there" at a glance, not a count to read.

## 8. Errors

No alarm colour exists, so no error is coloured or iconed with warning marks. The three real failures (calendar unreachable, storage unavailable, unreadable import) render as `--body` text in place with a secondary action; strings in `COPY.md` §8. Never a toast, banner, or modal. The check-in never depends on the calendar working.

## 9. Build order

1. Icon tile (the states everything else inherits)
2. Button (all three ranks)
3. Check-in shell + fullness scale
4. Chart
5. Row + weight glyph
6. Pairwise card
7. Lever card + projection
