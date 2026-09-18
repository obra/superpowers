# Cosmic Tetris — Game Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the headless, deterministic falling-block engine in `internal/game` — pieces, board, 7-bag, movement, rotation, gravity, locking, line clearing, hold, scoring, game over — with comprehensive unit tests and a replay test.

**Architecture:** One package, `internal/game`, with no dependencies outside the standard library. The engine never reads a clock: all time enters through `Advance(dt time.Duration)`. Every state change returns a `[]Event` slice describing what happened; the engine itself has no notion of rendering or effects. The board is a fixed-size array, so no allocation happens during play.

**Tech Stack:** Go 1.26, standard library only (`math/rand`, `time`, `testing`).

**Spec:** `design.md` (this repo root). §5–§13, §34, §35, §40, §42 Phase 1, §49.1, §49.2, §49.6 are the binding sections for this plan.

## Global Constraints

- Module path: `cosmic-tetris`. Go directive: `go 1.26`.
- `internal/game` imports **only** the standard library — no Bubble Tea, no Lip Gloss, no `internal/fx`, no `internal/render`.
- Nothing under `internal/game` calls `time.Now()` (§49.2). All time arrives as `dt`.
- `Game` owns one `*rand.Rand` used **only** by the 7-bag (§49.6). `Seed int64` is stored for display and restart.
- Board geometry (§5): width 10, total height 22, visible rows 20, hidden spawn rows 2.
- Coordinate convention (pinned here, referenced by every later plan): `x` grows right from 0, `y` grows **down** from 0. Rows `y=0,1` are the hidden spawn rows; rows `y=2..21` are visible. Gravity increases `y`.
- Level: `level = lines/10 + 1` (§11). Level 1 is the starting level.
- Drop interval: `800ms * 0.86^(level-1)`, clamped to a 60ms floor (§11).
- Lock delay 500ms; max 15 lock resets (§12).
- Soft drop +1 point/cell, hard drop +2 points/cell (§11).
- Clear values `100/300/500/800 × level`; combo bonus `50 × (combo-1) × level` (§13, §49.1).
- Wall-kick offsets, in order: `(0,0) (-1,0) (1,0) (-2,0) (2,0) (0,-1) (-1,-1) (1,-1)` (§7). Note `(0,-1)` means one row **up** under the y-down convention.
- Every exported type and function in this plan is consumed verbatim by plans 2 and 3. Renaming one requires updating the consuming plan before the next task starts.

## Review Focus

These are inputs the spec implies but never spells out. Each line's test is added to the task that owns the code.

- **A long stalled frame** (`Advance(2s)` at level 1) must apply gravity repeatedly rather than dropping one row and losing the rest, and must still respect lock delay — Task 5.
- **Zero or negative `dt`** must be a no-op that returns no events and never moves a piece upward — Task 5.
- **Hold swap whose incoming piece cannot fit at spawn** must end the game cleanly, not commit a piece overlapping locked cells — Task 7.
- **Hard drop of a piece already resting on the stack** must lock it with 0 drop points, never a negative score — Task 5.
- **Extreme level values** (lines in the thousands) must keep the drop interval at the 60ms floor and never reach zero or negative — Task 6.
- **Lock-reset exhaustion**: a player who keeps sliding a grounded piece must see it lock after the 15th reset — Task 5.

## Plan Set

Run these in order. A ruling in an earlier plan that changes a name, signature, or value a later plan consumes is applied to that later plan before the next task starts.

1. `plans/2026-09-18-cosmic-tetris-engine/` — this plan. The headless `internal/game` engine. Consumes: nothing.
2. `plans/2026-09-18-cosmic-tetris-terminal/` — Bubble Tea app, renderer, layout, CLI (`internal/app`, `internal/render`, `cmd/cosmic-tetris`). Consumes: `game.New`, `game.Game.Advance`, the input methods, `game.Event`, `game.GhostY`, and the coordinate convention above.
3. `plans/2026-09-18-cosmic-tetris-fx/` — cosmic effects, flavor text, boot and game-over theatre (`internal/fx`, `internal/flavor`, render compositing). Consumes: `game.Event` and `game.EventKind` from this plan; `render.Canvas`, `render.Layout`, `app.Model`, and the CLI flags from plan 2.

---
