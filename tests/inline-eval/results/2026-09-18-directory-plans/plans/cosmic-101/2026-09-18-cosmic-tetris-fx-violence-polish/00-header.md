# Cosmic Tetris — Violence and Absurd Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the irresponsible special-effects budget: hard-drop impacts with screen shake, supernova line clears, shockwaves, hyperdrive, the four-line spectacle, combo and level-up escalation, the boot sequence, the black-hole game over, the help overlay, and the ASCII / `--no-fx` / `--reduced-motion` guarantees — then confirm the whole thing against §43 and §47.

**Architecture:** Every effect in this plan is a new piece of state on `fx.World`, raised by an observed `game.Event` and decayed by `Step`, plus a `[]mark` producer in `internal/render` that composites it into the frame. No task touches `internal/game`. Screen shake is the one effect that moves existing content, and it does so by translating the board box inside a fixed-size frame, so the frame's dimensions never change.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`.

**Spec:** `design.md` (build order Phases 4–5, §42; impact §18; line clear §19; four-line §20; combos §21; level-up §22; shockwaves §24; game over §28; boot §29; help §39; restraint §44; details §45; done §47)

## Global Constraints

- Go module path: `cosmic-tetris`, `go 1.26`. Dependencies are exactly `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`.
- `fx.World` still never modifies game state, and `internal/fx` still imports neither `internal/render` nor `internal/app` (§14).
- Restraint rules (§44), all binding and all testable: never obscure the active piece; never make controls lag; never delay gameplay for animation; never let a random effect alter gameplay; screen shake never exceeds one terminal cell; particles never permanently alter the rendered board.
- `--reduced-motion` suppresses screen shake, hyperdrive acceleration, and shockwaves, and leaves color, trails, and particles alone (§49.5).
- `--no-fx` leaves `Scene.FX == nil`; every effect step is skipped and the game stays fully playable and fun (§32, §47).
- `--ascii` renders every effect through `asciiFold`; no output byte outside ASCII, with the one pinned exception of the ghost glyph `··` (§49.4).
- Animations never block input: the four-line banner, the boot sequence, and the game-over collapse all accept keys throughout (§20, §28, §29).
- The particle budget stays `MaxParticles = 400`; new effects share it rather than raising it (§38).
- Golden tests compare ANSI-stripped output from a fixed seed and a fixed elapsed time.
- This plan adds one file per effect inside the packages §33 already names (`internal/fx/shake.go`, `lineanim.go`, `shockwave.go`, `hyperdrive.go`, `banner.go`, `escalation.go`, `collapse.go`; `internal/render/shake.go`, `lineanim.go`, `shockwave.go`, `banner.go`, `collapse.go`, `boot.go`, `help.go`). No new packages, no plugin system, no engine abstraction (§1, §33).
- `go test ./...` must pass at the end of every task.

## Review Focus

- `--reduced-motion` must actually suppress all three of shake, hyperdrive acceleration, and shockwaves — this is the flag that keeps the game usable for someone who gets motion sick, and a partial implementation is worse than none. Tests in Tasks 1, 3, and 4.
- Two line clears in quick succession (fast play, or a clear during the previous clear's 220ms animation) must not leave a stale animation band drawn over rows that have already collapsed. Test in Task 2.
- Screen shake translating the board must clip at the frame edge instead of growing the frame or pushing the HUD — at the 40×24 minimum there is no spare column. Test in Task 1.
- A banner or level-up notice wider than the terminal must truncate to one line per row, not wrap and shove the layout down. Test in Task 5.
- During the game-over sequence and the boot sequence, `r` and `q` must take effect on the keystroke, not after the animation finishes. Tests in Tasks 7 and 8.

## Plan Set

1. `plans/2026-09-18-cosmic-tetris-engine/` — headless deterministic engine, `internal/game`. Consumes: nothing.
2. `plans/2026-09-18-cosmic-tetris-terminal/` — CLI, Bubble Tea app, renderer, layouts, pause/restart/game-over panel, golden tests. Consumes from plan 1: the `game` public API.
3. `plans/2026-09-18-cosmic-tetris-fx-foundation/` — `internal/fx` (world, particles, starfield), animated border, piece trails, `internal/flavor` mission control. Consumes from plans 1–2: `game.Event`, `render.Scene`, `render.Render`, `render.Palette`.
4. `plans/2026-09-18-cosmic-tetris-fx-violence-polish/` — this plan. Consumes from plans 1–3: `fx.World`, `Emit`, `EmitBurst`, `Observe`, `Step`, `BorderEnergy`, `RaiseEnergy`, `SetStarBoost`, `Trails`, `render.composite`, `render.mark`, `render.asciiFold`, `render.Layout`, `render.overlayCentre`, `render.Phase`, `app.Model`, `flavor.Channel`.

Executors run the set in this order. A ruling that changes a name, signature, or pinned value a later plan consumes is applied to that plan's files before the next task starts.

---
