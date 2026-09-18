Pre-flight scan on plan 2 against the code as built:

- Read `internal/game/{game,board,piece,events,scoring,rules}.go` in full and cross-checked every identifier plan 2's Plan Set entry and task briefs consume from Plan 1: `Board`, `Piece`, `Point`, `Cell`/`CellFor`, `PieceKind`/`KindCount`, board dimensions, all `Game` fields, `GhostY`, `SoftDrop`, `HardDrop`, `HoldPiece`, `MoveLeft/Right`, `RotateCW/CCW`, `NextCount`, scoring/rules constants, `KickOffsets`.
- Found one real mismatch: plan 2 named the engine's frame-advance method `Tick` (in its Plan Set line and in Task 6's `FrameMsg` handling rule), but the engine as built — and design.md §49.2 — name it `Advance(dt time.Duration) []Event`. `Tick` doesn't exist on `game.Game`.
- Fixed both occurrences in `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md` to say `Advance`.
- Also verified the pinned Bubble Tea ecosystem versions Task 1/6 will `go get` (bubbletea v2.0.9, lipgloss v2.0.6, bubbles v2.2.1, x/ansi v0.11.8) all exist in the module proxy, and that `go.mod`'s module path/go directive match plan 2's Global Constraints.
- Logged the fix as a ruling in new `plans/LEDGER.md` (no prior ledger existed).

Everything else in plan 2 lined up with the code as built. Stopping here, before Task 1's first test, as instructed — no Go written.
