Setup for Plan 2 is done. I'm stopping here, before Task 1's first test.

What I checked:
- Read the full Plan 2 file and the relevant `design.md` sections it cites (§8, §31, §36, §37, §46, §49.x) — the layout tiers, render pipeline order, CLI surface, and copy all line up with the plan text.
- Cross-checked every Plan-1 symbol Plan 2 claims to consume (`game.Game`, `Board`, `Piece`, `Event`, `GhostY`, `Width`, `VisibleRows`, `HiddenRows`, `PieceKind`, `CellFor`, `New`, `HardDrop`, `HoldPiece`, etc.) against the actual `internal/game` source — all present with matching signatures.
- Verified the four new module paths/versions the plan will `go get` (`charm.land/lipgloss/v2@v2.0.6`, `charm.land/bubbletea/v2@v2.0.9`, `charm.land/bubbles/v2@v2.2.1`, `github.com/charmbracelet/x/ansi@v0.11.8`) actually resolve.

What I changed (per the plan set's own governance rule — "a ruling that changes a name... is applied to that plan's file before the next task starts"):
- Plan 1's engine method is `Advance(dt time.Duration) []Event`, but Plan 2 twice referenced a nonexistent `Tick` method (in the Plan Set summary line and in Task 6's `FrameMsg` update rule). Fixed both references to `Advance` in `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md`.

No Go code was written. Ready for Task 1 (Canvas) whenever you want to proceed.
