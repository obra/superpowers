Setup for Plan 2 is done. Summary:

**Checked:** confirmed `go test ./...` passes cleanly on the committed Plan 1 engine; read every exported signature in `internal/game/*.go` and cross-checked it against everything Plan 2's tasks consume; verified the four pinned module versions (lipgloss/v2@v2.0.6, bubbletea/v2@v2.0.9, bubbles/v2@v2.2.1, x/ansi@v0.11.8) resolve via the proxy without touching `go.mod`/`go.sum`.

**Found and fixed:** Plan 2 called Plan 1's time-advance method `Tick` in two places (its consumes-list and the `app.Update`/`FrameMsg` rule), but the actual, committed method is `Advance(dt) []Event` — matching what Plan 1's own header already said. Corrected both spots in `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md`. No other drift found.

**Wrote:** `plans/ledger.md` recording that ruling and the setup checks, per the plan set's "apply rulings before the next task starts" instruction.

Stopping here, before Plan 2 Task 1's first failing test (`internal/render/canvas_test.go`). No Go was written.
