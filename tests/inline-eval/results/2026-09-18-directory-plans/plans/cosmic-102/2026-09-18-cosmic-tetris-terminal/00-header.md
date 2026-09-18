# Cosmic Tetris — Playable Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the headless engine into a genuinely good terminal game: Bubble Tea event loop, adaptive layout, board/ghost/hold/next/stats rendering, help, pause, game over, resize handling, and the CLI — all before a single particle exists.

**Architecture:** Two packages plus a `main`. `internal/render` is pure: it takes a `Frame` value (game pointer, layout, options, status line) and returns a string; it never mutates game state and never reads a clock. All drawing goes through a `Canvas` — a fixed grid of `(rune, Paint)` cells that composites by coordinate, which is what lets plan 3 paint particles over the same buffer without touching the renderer's layout logic. `internal/app` owns the Bubble Tea `Model`: one 60 Hz frame clock feeding `game.Advance(dt)`, with key presses applied immediately on arrival rather than queued to the tick.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2` (key + help + spinner only), standard library `flag`.

**Spec:** `design.md` (repo root). §4, §5, §8, §10, §26, §29–§32, §34, §36, §37, §39, §41, §42 Phase 2, §46, §49.3, §49.4, §49.5 are binding here.

## Global Constraints

- Module path `cosmic-tetris`, Go 1.26. Add dependencies with
  `go get charm.land/bubbletea/v2 charm.land/lipgloss/v2 charm.land/bubbles/v2`.
  If those vanity paths do not resolve, fall back to
  `github.com/charmbracelet/{bubbletea,lipgloss,bubbles}/v2` and note the
  substitution in the commit message.
- **Bubble Tea v2's interfaces differ from v1** (`Init` returns `(Model, Cmd)`;
  key presses arrive as `tea.KeyPressMsg`; `View` may return a `fmt.Stringer`).
  The signatures in this plan state intent. Before Task 5, run
  `go doc charm.land/bubbletea/v2 Model` and `go doc charm.land/bubbletea/v2 KeyPressMsg`
  and conform to the installed version.
- Do not wrap Bubble Tea in a homegrown framework (§3).
- `internal/render` must not import `internal/app`. `internal/render` and
  `internal/app` must not be imported by `internal/game`.
- Rendering never mutates game state (§37). `internal/render` never calls
  `time.Now()` — animation phase arrives as a parameter, so goldens are stable.
- Coordinate convention from plan 1: `x` right, `y` down; visible board rows are
  `y=2..21`.
- One logical cell is **2 terminal columns × 1 terminal row** (§5). Board inner
  area is therefore 20 columns × 20 rows; with its border, 22 × 22.
- Glyphs (§49.4): blocks `██` in full/reduced, `[]` in ASCII. Ghost `░░` in
  full/reduced, `··` in ASCII. Pieces use a bright foreground on filled glyphs —
  never a background pair. The active piece renders one step brighter than
  locked cells.
- Minimum usable terminal: 40 columns × 24 rows. Below that, the too-small
  notice (§31). Never crash on resize (§31).
- Small-terminal drop order (§49.3): title border, then mission control, then
  stat labels. NEXT never stacks above or below the board; at small sizes it
  sits beside the board and truncates to 3 upcoming pieces.
- CLI surface is exactly (§49.5): `cosmic-tetris`, `--seed N`, `--ascii`,
  `--no-fx`, `--reduced-motion`, `--help`. Nothing else.
- The §4 mockup is mood and element placement, not geometry (§49.7). The
  ANSI-stripped goldens in Task 9 are the binding layout contract.

## Review Focus

Inputs the spec implies but never spells out. Each line's test is added to the task that owns the code.

- **Degenerate terminal sizes** — 0×0, 1×1, and a 200-column × 3-row window must
  render the too-small notice without dividing by zero or panicking — Task 2.
- **Every rendered line must fit the terminal width** in every layout and mode;
  a single over-wide line wraps and corrupts the whole board — Task 9.
- **Several key presses inside one frame interval** must all apply, in order,
  without waiting for the next tick (§8, §44) — Task 6.
- **Keys during pause and after game over** — only the keys the overlay offers
  may act; movement keys must not quietly mutate a paused or dead game — Task 7.
- **A terminal that shrinks below minimum mid-game and grows back** must resume
  the same game, not restart it or leave a stale-size frame — Task 6.

## Plan Set

Run these in order. A ruling in an earlier plan that changes a name, signature, or value a later plan consumes is applied to that later plan before the next task starts.

1. `plans/2026-09-18-cosmic-tetris-engine/` — headless `internal/game` engine. Consumes: nothing.
2. `plans/2026-09-18-cosmic-tetris-terminal/` — this plan. Consumes: `game.New`, `game.Game.Advance`, the input methods, `game.Event`, `game.GhostY`, and plan 1's coordinate convention.
3. `plans/2026-09-18-cosmic-tetris-fx/` — cosmic effects, flavor text, boot and game-over theatre. Consumes: `game.Event`/`game.EventKind` from plan 1; from this plan: `render.Canvas`, `render.Paint`, `render.Frame` (it adds an `FX` field), `render.Layout`, `render.Options`, `app.Model`, `app.AppState` (it adds `StateBoot`), and the `--no-fx` / `--reduced-motion` flag values.

---
