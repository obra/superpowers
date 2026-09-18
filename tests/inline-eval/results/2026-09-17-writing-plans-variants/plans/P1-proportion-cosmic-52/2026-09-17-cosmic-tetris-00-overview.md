# Cosmic Tetris — Plan Index

**Spec:** `design.md`

The spec's own build order (§42) is the plan boundary. Each plan below ends with
software you can run and enjoy; later plans only add spectacle.

| # | Plan | Spec sections | Ends with |
|---|------|---------------|-----------|
| 01 | [Engine](2026-09-17-cosmic-tetris-01-engine.md) | §5–13, §34–35, §40, §49.1, §49.2, §49.6 | Headless deterministic game, `go test ./internal/game` green |
| 02 | [Playable terminal](2026-09-17-cosmic-tetris-02-playable-terminal.md) | §4, §8–10, §31–33, §36–37, §39, §41, §46, §49.3–49.5 | A genuinely good terminal Tetris with no FX |
| 03 | [Cosmic foundation](2026-09-17-cosmic-tetris-03-cosmic-foundation.md) | §14–15, §17, §25–27, §45 | Living background, animated border, trails, Mission Control |
| 04 | [Violence](2026-09-17-cosmic-tetris-04-violence.md) | §16, §18–24, §44 | Hard-drop impact, supernova clears, hyperdrive, four-line event |
| 05 | [Polish](2026-09-17-cosmic-tetris-05-polish.md) | §28–30, §32, §43, §45, §47 | Boot sequence, black-hole game over, mode matrix, README |

Read them in order. Plan 02 assumes plan 01's exported API exists exactly as
written there; each plan's **Interfaces** blocks name what crosses the seam.

One deliberate deviation from §33, stated once here so it is not mistaken for
drift: the plans add small files *inside* the four packages §33 names — one per
subsystem, e.g. `internal/fx/starfield.go`, `internal/fx/shake.go` — rather than
squeezing every subsystem into the exact filenames §33 lists. No package boundary
moves, no fifth package appears, and no file grows past a few hundred lines. That
is §33's "unless genuinely necessary" clause spent on file granularity, which is
also what §48's "understandable in an afternoon" wants.

Two rules hold across all five and are repeated in each plan's Global
Constraints because they are the ones that quietly rot: `internal/game` never
reads a clock (§49.2), and `internal/fx` never writes to game state (§14).
