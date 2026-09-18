# Cosmic Tetris — Cosmic Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the game a living universe: an independent FX simulation (`internal/fx`) with its own RNG, a three-layer starfield, a particle system, an animated board border, short-lived piece trails, and the Mission Control commentary channel (`internal/flavor`).

**Architecture:** `internal/fx` is a standalone simulation that observes `game.Event` values plus a read-only `fx.Snapshot` and exposes its state through accessors. It imports `internal/game` for event types and imports nothing else of ours — in particular not `internal/render`, so it cannot be tempted to reach back into presentation or state. `internal/render` gains one primitive, `composite`, that stamps glyphs onto an already-rendered frame, only over blank cells by default. That is how effects stay strictly additive: they can never overwrite a board cell, a HUD number, or the active piece.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`.

**Spec:** `design.md` (build order Phase 3, §42; FX contract §14; starfield §15; trails §17; particles §23; border §25; Mission Control §27; restraint rules §44)

## Global Constraints

- Go module path: `cosmic-tetris`, `go 1.26`. Dependencies are exactly `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`.
- **`fx.World` may observe game events and must never modify game state** (§14). It receives events and a value `Snapshot`, never a `*game.Game`.
- RNG isolation (§35, §49.6): the game RNG is seeded with `Seed`, the FX RNG with `Seed + 1`, the flavor RNG with `Seed + 2`. `fx` and `flavor` each own their `*rand.Rand` and never touch the game's.
- `internal/fx` must not import `internal/render` or `internal/app`. `internal/flavor` imports only `internal/game`.
- Effects are additive only: `composite` writes over blank cells unless a caller explicitly opts out, and no effect ever removes or recolors a locked block, the ghost, the active piece, or HUD text (§44).
- Never delay gameplay for animation and never let an effect alter game state (§44). FX reads `dt` from the same single frame clock the app already owns; it starts no goroutines and no timers (§38).
- Particle budget: `MaxParticles = 400`, enforced by dropping new emissions, never by growing the slice (§38).
- Starfield must never make the board harder to read (§15): stars render only outside the board box and only over blank cells.
- Layout additions beyond §33, all deliberate: `internal/game/events.go` (plan 1), `internal/app/config.go` (plan 2), `internal/render/overlay.go` (plan 2), and from this plan `internal/render/composite.go`, `internal/render/starfield.go`, `internal/fx/trail.go`. §33's rule is about packages, not file count: every one of these lives in a package §33 already names, and splitting effects into one file each is what keeps them readable (§2's "easy for an agent to understand and modify").
- With `--no-fx`, `Scene.FX` is `nil` and every FX step in the pipeline is skipped; the game must stay fully playable.
- Golden tests compare ANSI-stripped output. FX-bearing goldens are rendered from a fixed seed and a fixed elapsed time so they are reproducible.
- `go test ./...` must pass at the end of every task.

## Review Focus

- `--no-fx` leaves `Scene.FX == nil`, and every composite step must check it — a nil dereference here crashes the mode whose whole point is to be the safe one. Test in Task 4.
- Long play with constant events must not grow the particle or trail slices without bound; the cap has to hold under a thousand emissions. Test in Task 2.
- Particles drift off-screen and to fractional coordinates; converting them to cells must clip rather than index, including for negative coordinates and a 1×1 viewport. Test in Task 4.
- A huge `dt` (a resumed laptop) or a zero `dt` must not send particle positions to infinity or NaN, and must not resurrect dead particles. Test in Task 2.
- Twenty events arriving in a single frame (a four-line clear plus a level-up plus a combo) must leave one readable Mission Control line for its full hold time, not a flicker of twenty. Test in Task 7.

## Plan Set

1. `plans/2026-09-18-cosmic-tetris-engine/` — headless deterministic engine, `internal/game`. Consumes: nothing.
2. `plans/2026-09-18-cosmic-tetris-terminal/` — CLI, Bubble Tea app, renderer, layouts, pause/restart/game-over panel, golden tests. Consumes from plan 1: `game.New`, `Game.Apply`, `Game.Advance`, `Game.Ghost`, `Game.Reset`, `Game.Snapshot`, `Event`.
3. `plans/2026-09-18-cosmic-tetris-fx-foundation/` — `internal/fx` (world, particles, starfield), animated border, piece trails, `internal/flavor` mission control. Consumes from plans 1–2: `game.Event`, `render.Scene`, `render.Render`, `render.Palette`, `app.Model`.
4. `plans/2026-09-18-cosmic-tetris-fx-violence-polish/` — hard-drop impact, supernova line clears, shockwaves, hyperdrive, four-line sequence, combo/level escalation, boot sequence, black-hole game over, help overlay, ASCII / `--no-fx` / `--reduced-motion` goldens, README. Consumes from plans 1–3: `fx.World` accessors and `Emit`, `render.composite`, `flavor.Channel`.

Executors run the set in this order. A ruling that changes a name, signature, or pinned value a later plan consumes is applied to that plan's files before the next task starts.

---
