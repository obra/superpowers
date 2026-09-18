# Cosmic Tetris — Cosmic Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the universe lose its shit around the player — starfield, animated border, ion trails, hard-drop impact, supernova line clears, hyperdrive, shockwaves, banners, mission-control commentary, boot sequence, and a game-over black hole — without ever touching game state or delaying input.

**Architecture:** `internal/fx` is a second, independent simulation. It observes a `[]game.Event` plus an immutable `fx.Snapshot` value and advances on the same `dt` as the engine; it exposes its results through read-only getters. It holds **no pointer to `game.Game`**, which is how §14's "may never modify GameState" becomes a property of the type system rather than a promise. `internal/render` imports `fx` and paints its output onto the existing `Canvas`; `fx` never imports `render`. `internal/flavor` holds the message tables.

**Tech Stack:** Go 1.26, `charm.land/lipgloss/v2` (via `render` only), `charm.land/bubbles/v2/spinner` for the boot sequence, standard library `math` and `math/rand`.

**Spec:** `design.md` (repo root). §14–§28, §30, §43–§45, §42 Phases 3–5, §47, §49.4, §49.5 are binding here.

## Global Constraints

- `internal/fx` imports `internal/game` and `internal/flavor` and the standard
  library — never `internal/render` or `internal/app`. Because `fx` imports
  `flavor`, nothing in `flavor` may reference an `fx` type.
- §33's file tree lists four files under `fx/`; this plan adds one small file per
  effect (`border.go`, `trails.go`, `impact.go`, `lineclear.go`, `hyperdrive.go`,
  `shockwave.go`, `banner.go`, `mission.go`, `boot.go`, `collapse.go`) and one
  `render/fxdraw.go`. That is the same architecture, not more of it: each file is
  one effect with its own test file, which is what keeps §48's "understandable in
  an afternoon" true. Do not add packages beyond `fx` and `flavor`.
- `fx` holds no `*game.Game` and no `game.Board`. Game context arrives as
  `fx.Snapshot`, a value copy. Task 1 adds a source audit test for this.
- `fx` never calls `time.Now()`. Like the engine, it advances on `dt`.
- FX randomness uses `fx.World`'s own `*rand.Rand`, seeded independently of the
  game's (§35, §49.6). It must never be possible for particle counts to change
  piece order; Task 13 tests exactly that.
- `Config.Enabled == false` (`--no-fx`) means every getter returns empty and
  `Advance` does no work beyond bookkeeping. The no-FX game must still be good
  (§32, §47).
- `--reduced-motion` (§49.5) suppresses **screen shake, hyperdrive acceleration,
  and shockwaves** and nothing else: color, trails, and particles stay.
- Restraint rules (§44), each of which gets a test in the task that could break
  it: never obscure the active piece; never lag controls; never delay gameplay
  for animation; never let an effect alter gameplay; screen shake never exceeds
  one cell; particles never permanently alter the rendered board.
- Effect glyphs (ASCII-mode alternative in brackets):
  stars `. · ˚ ✦ ✧ *` [`. . + * *`]; trails `▓▓ ▒▒ ░░` [`## ++ ..`];
  impact debris `· * ✦ +` [`. * + o`]; shockwave rings `· ○ ◌ ◯` [`. o O 0`].
- Pinned timings, as `internal/fx` constants:
  `TrailLife 140ms` (§17), `HoldFlashLife 120ms` (§9), `ShakeDuration 80ms` (§18),
  `LineClearTotal 220ms` (§19), `BannerLife 700ms` (§20), `ShockwaveLife 300ms` (§24),
  `LevelCardLife 1200ms` (§22), `HyperdriveTotal 1100ms` (§16),
  `StatusMinLife 2500ms` (§27), `BootTotal 1000ms` (§29), `CollapseTotal 1300ms` (§28),
  `MaxParticles 600` (§38).
- Board readability is sacred (§15, §21). Background star brightness stays below
  piece brightness, and no effect writes inside the board box except trails,
  the line-clear animation, and board-layer particles.

## Review Focus

Inputs the spec implies but never spells out. Each line's test is added to the task that owns the code.

- **Sustained heavy play** (back-to-back four-line clears) must cap particles at
  `MaxParticles` and drop the oldest rather than growing without bound — Task 2.
- **Particles at negative or off-screen coordinates** must be culled, and
  compositing must clip rather than index outside the canvas — Task 2.
- **A line-clear animation still running when the next piece locks** must not
  delay gameplay, drop the second animation, or resurrect cleared rows — Task 7.
- **`--no-fx` and `--reduced-motion` together**, and each alone, must produce a
  stable, readable frame — no half-suppressed effect, no shake of any size — Task 13.
- **A terminal resize mid-effect** must not leave particles or stars outside the
  new bounds or panic while a banner is on screen — Task 3.

## Plan Set

Run these in order. A ruling in an earlier plan that changes a name, signature, or value a later plan consumes is applied to that later plan before the next task starts.

1. `plans/2026-09-18-cosmic-tetris-engine/` — headless `internal/game` engine. Consumes: nothing.
2. `plans/2026-09-18-cosmic-tetris-terminal/` — Bubble Tea app, renderer, layout, CLI. Consumes plan 1's engine API.
3. `plans/2026-09-18-cosmic-tetris-fx/` — this plan. Consumes: `game.Event`, `game.EventKind`, `game.PieceKind`, board geometry (plan 1); `render.Canvas`, `render.Paint`, `render.Frame`, `render.Layout`, `render.Options`, `render.CellOrigin`, `render.BorderPaint`, `app.Model`, `app.AppState`, and the `--no-fx` / `--reduced-motion` flags (plan 2). It adds fields to `render.Frame`, a `StateBoot` constant to `app.AppState`, and new goldens alongside plan 2's.

---
