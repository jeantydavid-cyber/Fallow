# Fallow — build package (v2)

Hand this folder to Claude Code. Read in this order:

1. **HANDOFF.md** — the build contract: stack, build order, acceptance criteria.
2. **FALLOW-SPEC.md** — the machine: data model, taxonomies, calibration, signal logic, calendar, storage, test fixtures. Build it as written.
3. **DESIGN-TOKENS.md** — colour (with measured contrast), type, spacing, icons, motion, focus, chart geometry.
4. **COMPONENTS.md** — every component, every state.
5. **SCREENS.md** — every screen, fixed ordering rules, breakpoints.
6. **COPY.md** — every string in the app. No user-facing string exists outside it.

The rendered visual reference is `Fallow - Screens v2.dc.html` in the design project (screenshots of it work as reference too).

Non-negotiables, verified by the acceptance checklist in HANDOFF.md: no red/orange, no notifications, no scores or streaks, unknown recovery is never treated as zero, only one observation at a time, demand bars never grow upward, fixed element ordering, and the three test fixtures (drought / sparse / busy-but-fine) must pass before any UI is built.
