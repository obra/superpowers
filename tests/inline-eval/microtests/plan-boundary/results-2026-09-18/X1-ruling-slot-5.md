Setup for Plan 2 is done. Summary:

**Checked:** Read `design.md` and `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md` in full, then cross-checked every `game.*` identifier Plan 2 names — `Game`, `Board`, `Piece`, `PieceKind`, `Event`, `GhostY`, `Width`, `HiddenRows`, `VisibleRows`, `New`, and the field names on `Game`/`Board` — against the real `internal/game` source built in Plan 1. All match. I also confirmed the four pinned dependency versions (`bubbletea/v2@v2.0.9`, `lipgloss/v2@v2.0.6`, `bubbles/v2@v2.2.1`, `x/ansi@v0.11.8`) exist on the module proxy, so Task 1's and Task 6's `go get` steps won't stall.

**Found and fixed:** Plan 2 twice referenced `game.Game.Tick(dt)`, but Plan 1 built (per design.md §49.2) `Advance(dt time.Duration) []Event` — no `Tick` method exists. Plan 1's own Plan Set table already listed Plan 2 as consuming `Advance`, so this was a pre-existing inconsistency, not a new call I'm making. Fixed both occurrences (the Plan Set consumes-line and the `FrameMsg` handling rule in Task 6) directly in `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md`.

**Recorded:** Wrote `plans/LEDGER.md` with the ruling (what changed, why, cost if wrong, plans touched) plus a note on what was verified with no changes needed.

Stopping here, before Task 1's first test (`TestCanvasPlainRendersGrid` in `internal/render/canvas_test.go`). No Go was written.
