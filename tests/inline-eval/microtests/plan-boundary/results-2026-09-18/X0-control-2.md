Setup for Plan 2 is done. Summary:

**Checked:** baseline `go build`/`go test` on main (green, no deps yet); module proxy reachability and that `lipgloss/v2@v2.0.6` exists on it; every `game.*` symbol Plan 2's Task 1–8 claim to consume, cross-referenced against `internal/game/*.go` and design.md.

**Changed:** fixed a real bug in the plan file itself — two references to a nonexistent `game.Game.Tick(dt)` (Plan Set §2, and Task 6's `FrameMsg` rule) corrected to the engine's actual method, `Advance(dt)` (confirmed in `internal/game/game.go:146` and design.md §49.2). Wrote `plans/LEDGER.md` recording that fix plus one open, non-blocking item to flag when Task 3/6 start: the plan never states the import path for the `colorprofile` package it uses in `ModeFor`/`tea.ColorProfileMsg`.

Task 1 (Canvas) itself checked out clean — no other concerns. Stopping here, before writing its first test.
