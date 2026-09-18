# Cosmic Tetris — Playable Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the engine into a genuinely good playable terminal game: CLI flags, Bubble Tea event loop, immediate keyboard input, board/ghost/hold/next/stats rendering, three responsive layouts, pause, restart, and a game-over panel — with golden snapshot tests. No cosmic effects yet.

**Architecture:** `cmd/cosmic-tetris/main.go` parses flags and starts the Bubble Tea program. `internal/app` owns the Bubble Tea `Model`: one 60 Hz frame clock, elapsed-time `dt` fed to `game.Advance`, and key messages applied to `game.Apply` the instant they arrive. `internal/render` is a pure function of a `render.Scene` value to a string — it imports `internal/game` but never `internal/app`, which keeps the dependency graph acyclic and makes every layout snapshot-testable without a terminal.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`.

**Spec:** `design.md` (build order Phase 2, §42; layout §4/§31/§49.3; glyphs §49.4; CLI §46/§49.5)

## Global Constraints

- Go module path: `cosmic-tetris`, `go 1.26`. Dependencies are exactly `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2` — nothing else beyond the standard library.
- Layout is fixed by §33. Additions beyond that file list, both deliberate: `internal/game/events.go` (plan 1) and `internal/app/config.go` (flag parsing, kept out of `model.go`).
- `internal/render` must not import `internal/app`. `internal/game` imports nothing of ours.
- The renderer never mutates game state (§37). `Render` takes `Scene` by value and only reads through its `*game.Game`.
- One logical cell = 2 terminal columns × 1 row. Block glyph `██` in full/reduced mode, `[]` in ASCII. Ghost glyph `░░` in full/reduced, `··` in ASCII (§49.4). Pieces use a bright foreground on filled glyphs, never a background pair; the active piece renders one step brighter than locked cells.
- Visible board = rows `y=2..21` of the 22-row board, 20 rows × 10 cells (§5).
- Render targets ~60 Hz from a single animation clock: one `tea.Tick` at `16 * time.Millisecond`. Gravity is elapsed-time based through `game.Advance(dt)`; input never waits for a tick (§36, §44).
- CLI surface is exactly: `cosmic-tetris`, `--seed N`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help` (§49.5). No other flags.
- Minimum usable terminal ~40×24; below that show the too-small notice (§31). Resize is handled live and never panics.
- Golden tests compare ANSI-stripped output (§41). §4's mockup is mood, not geometry — the goldens are the binding layout contract (§49.7).
- Key bindings are exactly §8, including the WASD aliases.
- `go test ./...` must pass at the end of every task.

## Review Focus

- A `WindowSizeMsg` of `0×0` or `1×1` (some terminals and multiplexers send one on startup or while detaching) must produce the too-small notice, not a panic or a negative-width string build. Test in Task 6.
- A very large terminal (300×100) must keep the board at its fixed cell size and centre it, rather than stretching the board or leaving the HUD floating at a stale position. Test in Task 7.
- Several key messages arriving between two frames (key repeat, a held arrow, a paste) must each apply to the game in order — dropping to one input per frame is exactly the control lag §44 forbids. Test in Task 2.
- An odd terminal width with a 2-column cell grid must not shear the board border; the layout has to round down to whole cells. Test in Task 6.
- Unrecognized keys and `ctrl+c` must be handled — unknown keys ignored with no state change, `ctrl+c` quitting like `q`. Test in Task 2.

## Plan Set

1. `plans/2026-09-18-cosmic-tetris-engine/` — headless deterministic engine, `internal/game`. Consumes: nothing.
2. `plans/2026-09-18-cosmic-tetris-terminal/` — CLI, Bubble Tea app, renderer, layouts, pause/restart/game-over panel, golden tests (`cmd/cosmic-tetris`, `internal/app`, `internal/render`). Consumes from plan 1: `game.New`, `Game.Apply`, `Game.Advance`, `Game.Ghost`, `Game.Reset`, `Game.Snapshot`, `Event`, `Board`, `Piece`.
3. `plans/2026-09-18-cosmic-tetris-fx-foundation/` — `internal/fx` (world, particles, starfield), animated border, piece trails, `internal/flavor` mission control. Consumes from plans 1–2: `game.Event`, `render.Scene`, `render.Render`.
4. `plans/2026-09-18-cosmic-tetris-fx-violence-polish/` — hard-drop impact, supernova line clears, shockwaves, hyperdrive, four-line sequence, combo/level escalation, boot sequence, black-hole game over, help overlay, ASCII / `--no-fx` / `--reduced-motion` goldens, README. Consumes from plans 1–3: `fx.World` accessors, `render.Render` pipeline, `flavor.Channel`.

Executors run the set in this order. A ruling that changes a name, signature, or pinned value a later plan consumes is applied to that plan's files before the next task starts.

---
