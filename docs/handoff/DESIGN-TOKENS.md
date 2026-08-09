# Fallow — design tokens (v2 · warm & visual)

Direction: warm cream and sand, moss and gold, rounded shapes, icons over words. Rendered reference: `Fallow - Screens v2.dc.html`.

All contrast ratios are computed, not estimated. Re-verify any value you change.

---

## 1. Colour

No `#000`, no `#FFF`, **no red, no orange**, anywhere — including errors and destructive actions. There is no `--danger` token and there must never be one. Warmth comes from cream, sand, moss, and gold instead.

### Light (default)

| Token | Value | Use |
|---|---|---|
| `--ground` | `#F7F1E3` | Screen background |
| `--card` | `#FBF6EA` | Cards, tiles, option rows |
| `--card-selected` | `#F2EBD8` | Selected tile fill |
| `--hairline` | `#E7DDC6` | Card borders (decorative) |
| `--hairline-strong` | `#E0D5BC` | Screen-level borders |
| `--ink` | `#423A2C` | Body text |
| `--heading` | `#4E4636` | Headings, emphasized labels |
| `--body` | `#6E624E` | Secondary text, icon strokes |
| `--muted` | `#75684F` | Quiet controls, captions, legends |
| `--moss` | `#5C6E42` | Primary buttons |
| `--moss-bar` | `#6B7C4F` | Rest bars, circle fills |
| `--moss-deep` | `#4E5F38` | Recovery icons |
| `--moss-text` | `#42502D` / `#55613F` | Text on the green dashed card |
| `--gold` | `#C0A557` | Decorative sun fills only |
| `--gold-border` | `#94793A` | Selected-state borders |
| `--sand-hatch` | `#9C8A5F` | Demand-bar hatch stripes |
| `--unknown` | `#8F8265` | Dashed "not sure" outlines |
| `--groundline` | `#97876A` | The horizon rule in charts |
| `--cream-on-moss` | `#F7F1E3` | Text/icons on primary buttons |

### Dark (to be rendered — values specified, verify on the styleguide)

| Token | Value |
|---|---|
| `--ground` | `#26221A` |
| `--card` | `#2E2921` |
| `--card-selected` | `#37311F` |
| `--hairline` | `#3E3729` |
| `--ink` | `#EFE7D2` |
| `--body` | `#CFC3A8` |
| `--muted` | `#B5A98F` |
| `--moss` / `--moss-bar` | `#8FA268` |
| `--gold-border` | `#D3B872` |
| `--sand-hatch` | `#8A7A55` |
| `--unknown` / `--groundline` | `#8A7C5F` |

Light is the default (a deliberate change from the original brief's dark default — the warm direction is a light-first identity). Dark remains a real, manually-switchable, tested mode.

### Measured contrast — light theme

Text, against `--ground` `#F7F1E3` (against `--card` is always slightly higher):

| Pair | Ratio | Requirement |
|---|---|---|
| `--ink` `#423A2C` | **10.0:1** | 4.5:1 ✓ |
| `--heading` `#4E4636` | **8.3:1** | 4.5:1 ✓ |
| `--body` `#6E624E` | **5.3:1** | 4.5:1 ✓ |
| `--muted` `#75684F` | **4.9:1** | 4.5:1 ✓ |
| `--moss-text` `#42502D` | **7.6:1** | 4.5:1 ✓ |
| `--cream-on-moss` on `--moss` | **5.0:1** | 4.5:1 ✓ |

Non-text, against `--card` `#FBF6EA`:

| Pair | Ratio | Requirement |
|---|---|---|
| `--moss-bar` `#6B7C4F` | **4.2:1** | 3:1 ✓ |
| `--moss-deep` `#4E5F38` | **6.5:1** | 3:1 ✓ |
| `--gold-border` `#94793A` | **3.9:1** | 3:1 ✓ |
| `--sand-hatch` `#9C8A5F` | **3.1:1** | 3:1 ✓ |
| `--unknown` `#8F8265` | **3.5:1** | 3:1 ✓ |
| `--groundline` `#97876A` | **3.3:1** | 3:1 ✓ |

`--gold` `#C0A557` and `--hairline` do not pass 3:1 and are therefore **decorative only** — the gold sun fills and card edges never carry meaning. Ceiling is ~10:1; full-range contrast is deliberately avoided (halation).

### Colour never carries meaning alone

| Series | Colour | Also encoded by |
|---|---|---|
| Rest (recovery) | `--moss-bar`, solid | rounded-top bar, **above** the horizon line |
| Demands (load) | `--sand-hatch`, 45° stripes | rounded-bottom bar, **below** the line |
| Not sure | `--unknown` | 2px **dashed** outline, no fill |
| Skipped | — | no mark; empty column |
| Selected | `--gold-border` | 2.5px border + `--card-selected` fill + bolder label |

Greyscale test: `filter: grayscale(1)` on any screen must lose nothing. Solid vs hatch vs dashed vs absent does the work.

---

## 2. Type

One family: **Nunito** (400, 600, 700, 800). Rounded, warm, and it stays out of the icons' way. No second face, no monospace — numbers are rare in v2 and set in Nunito 800.

| Role | Size | Line-height | Weight |
|---|---|---|---|
| `screen-title` | 24px | 1.35 | 800 |
| `statement` (low-capacity) | 26px | 1.4 | 800 |
| `observation` | 20px | 1.5 | 700 |
| `row-title` | 16px | 1.4 | 800 |
| `body` | 16px | 1.5 | 700 |
| `quiet-control` | 15px | 1.4 | 700 |
| `tile-label` | 13–14px | 1.4 | 700 (800 selected) |
| `caption` / `legend` | 12–13px | 1.5 | 600–700 |

Weights run heavy (600 minimum) because Nunito's rounded forms need the weight to stay crisp on cream. Text left-aligned (centred only inside buttons and tiles), max 62ch, `text-wrap: pretty`. Nothing below 12px, and 12px only for the chart legend.

Fewer words is a rule, not a vibe: screen titles are 1–4 words ("Sound right?", "What helped?", "Coming up"), and anything an icon can say, an icon says — with its small label kept underneath.

---

## 3. Spacing, shape, elevation

Spacing scale: **4, 8, 10, 12, 16, 20, 24, 28, 48**. Screen padding 20px at 390px, 28px in low-capacity mode.

| Token | Value | Use |
|---|---|---|
| `--r-screen` | 16px | Screen surface, big choice cards |
| `--r-card` | 12–14px | Cards, tiles, buttons |
| `--r-bar` | 6px (top or bottom only) | Chart bars |
| `--r-glyph` | 4px | Legend swatches, small marks |

Radii stop at 16px — no full pills, no `rounded-2xl` and beyond. **No drop shadows anywhere**; elevation is card lightness + a 1px hairline. Softness comes from radius, palette, and air, not blur.

Selection = 2.5px `--gold-border` + `--card-selected` fill + label weight 700→800. Tap targets ≥48px (56–110px on answer tiles), ≥8px between targets.

---

## 4. Iconography

The icon set is geometric — built only from circles, arcs, lines, and rounded rectangles, stroke 2–2.5px, round caps, drawn on 24–44px grids. It must stay this simple; no illustrative or filled icon packs.

| Meaning | Construction |
|---|---|
| Fallow / sun-on-horizon | line + gold semicircle sitting on it |
| Time alone | circle outline + centre dot |
| Quiet & dark | moon: filled circle + offset bg-colour circle |
| Safe company | two overlapping circle outlines |
| Deep in a thing | three concentric circles |
| A day with nothing / clear day | horizon line + circle outline above |
| Meetings / masked social | two circle outlines + a base line |
| Sensory | circle + 4 radiating lines |
| People (dinner, party) | three circle outlines |
| Document / admin | rounded rect + 2 lines |
| Fullness scale | circle outline with a horizontal fill level: full / ⅔ / ¼ / empty |
| Confirm | polyline check |
| Back | polyline chevron |

**Every icon has a visible text label.** No icon-only controls, ever — the icons reduce reading, the labels remove guessing. Icon strokes use `--body` (load/neutral) or `--moss-deep` (recovery); the fullness scale fills with `--moss-bar`.

No emoji anywhere. No gauges, dials, speedometers, or battery shapes — the fullness circle is a level, has no needle, no ticks, and no implied 100% target.

---

## 5. Motion

Unchanged from the accessibility floor: transitions ≤180ms, `opacity` and `height` only, easing `cubic-bezier(0.2, 0, 0.2, 1)`, no looping or ambient motion, no shimmer. `prefers-reduced-motion: reduce` removes all transitions entirely. The lever's projection change must be legible with motion disabled.

---

## 6. Focus

```css
:focus-visible {
  outline: 3px solid var(--moss);      /* #5C6E42 light · #8FA268 dark */
  outline-offset: 2px;
  border-radius: 12px;
}
```

`#5C6E42` on `--ground` measures **5.0:1** (needs 3:1). Never removed, never replaced by a fill change. DOM order = visual order on every screen.

---

## 7. Chart geometry

| Token | Home (390px) | Lever mini |
|---|---|---|
| above-line height (rest) | 64px | 26px |
| below-line height (demands) | 56px | 27px |
| line | 2px `--groundline`, full-width, **one element** | same |
| bar gap | 6px | 5px |
| bar radius | 6px top (rest) / 6px bottom (demands) | 3px |

The line is a single continuous element spanning the chart — never per-column segments (segments read as dashed, and dashed means "not sure"). Bars butt against the line exactly: the columns reserve a 2px spacer row and the overlay sits in it.

Rest gets more headroom than demands get depth. **Demands hang downward and never grow up** — a heavy week must never render as a tall proud bar. Scales are the person's own 26-week maximum; no y-axis, no gridlines, no numbers on bars.
