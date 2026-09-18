# Cosmic Tetris — Game Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the headless, deterministic falling-block engine in `internal/game`: pieces, board, 7-bag, movement, wall kicks, gravity, lock delay, line clearing, hold, scoring, and game over, with no rendering and no clock reads.

**Architecture:** One Go package, `internal/game`, holding plain structs and pure-ish functions. `Game` owns all mutable state plus its own `*rand.Rand`. Two entry points drive it: `Apply(Input)` for player actions and `Advance(dt)` for elapsed time. Both return `[]Event`, which is the engine's only outbound channel — later plans (renderer, FX) consume events and never reach into state. Nothing in this package imports Bubble Tea, Lip Gloss, or `time.Now()`.

**Tech Stack:** Go 1.26, standard library only (`math/rand`, `time` for `time.Duration` arithmetic).

**Spec:** `design.md` (build order Phase 1, §42; pinned decisions §49)

## Global Constraints

- Go module path: `cosmic-tetris`. `go.mod` declares `go 1.26`.
- Third-party dependencies for the whole project are exactly `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`. This plan adds none of them — `internal/game` is standard library only.
- Repository layout is fixed by §33. The one addition is `internal/game/events.go`, so event types do not crowd `game.go`.
- Board: width 10, height 22, visible rows 20 (`y=2..21`), hidden spawn rows `y=0..1`. `y` increases downward.
- `internal/game` never calls `time.Now()`. All time enters through `Advance(dt time.Duration)` (§49.2).
- Game RNG drives the 7-bag and nothing else. `Seed int64` is recorded for display and restart; `rng *rand.Rand` is unexported (§49.6).
- Combo counts consecutive placements that clear ≥1 line; first clearing placement sets combo to 1; a placement clearing nothing resets it to 0. Bonus = `50 × (combo - 1) × level` (§49.1).
- Base clear values: 1 line `100 × level`, 2 lines `300 × level`, 3 lines `500 × level`, 4 lines `800 × level` (§13).
- Gravity interval = `800ms × 0.86^(level-1)`, clamped to a floor of `60ms`. Level = `lines/10 + 1` (§11).
- Lock delay `500ms`. A successful move or rotation while grounded resets the lock timer. Max lock resets `15` (§12).
- Soft drop `+1` point per cell; hard drop `+2` points per cell (§11).
- Wall-kick offsets, tried in exactly this order, first valid wins: `(0,0) (-1,0) (1,0) (-2,0) (2,0) (0,-1) (-1,-1) (1,-1)` (§7).
- Hold: one slot, once per active piece, held pieces return to spawn rotation (§9).
- `go test ./...` must pass at the end of every task.

## Review Focus

- A single `Advance(dt)` carrying more than one gravity interval (a lag spike or a slow terminal) must apply every drop the elapsed time earns, not one — otherwise the game silently slows down whenever the host stutters. Test in Task 6.
- `Advance(0)` and `Advance(-1)` (clock skew, duplicate frame) must be no-ops that return no events rather than looping or rewinding accumulators. Test in Task 6.
- Input and time arriving after `GameOver` must be ignored, not panic and not move a piece inside a full board. Test in Task 8.
- A very high level (say 99) must not drive the gravity interval to zero — `Advance` loops on the interval, and a zero interval hangs the process. Test in Task 4.
- Non-contiguous completed rows (rows 5 and 9 complete, 6–8 not) must collapse to the right result; a naive shift-by-one loop gets this wrong. Test in Task 2.

## Plan Set

1. `plans/2026-09-18-cosmic-tetris-engine/` — headless deterministic engine, `internal/game`. Consumes: nothing.
2. `plans/2026-09-18-cosmic-tetris-terminal/` — CLI, Bubble Tea app, renderer, layouts, pause/restart/game-over panel, golden tests (`cmd/cosmic-tetris`, `internal/app`, `internal/render`). Consumes from plan 1: `game.New`, `Game.Apply`, `Game.Advance`, `Game.Ghost`, `Game.Reset`, `Event`, `Board`, `Piece`.
3. `plans/2026-09-18-cosmic-tetris-fx-foundation/` — `internal/fx` (world, particles, starfield), animated border, piece trails, `internal/flavor` mission control. Consumes from plans 1–2: `game.Event`, `render.Scene`, `render.Render`.
4. `plans/2026-09-18-cosmic-tetris-fx-violence-polish/` — hard-drop impact, supernova line clears, shockwaves, hyperdrive, four-line sequence, combo/level escalation, boot sequence, black-hole game over, help overlay, ASCII / `--no-fx` / `--reduced-motion` goldens, README. Consumes from plans 1–3: `fx.World` accessors, `render.Render` pipeline, `flavor.Channel`.

Executors run the set in this order. A ruling that changes a name, signature, or pinned value a later plan consumes is applied to that plan's files before the next task starts.

---
