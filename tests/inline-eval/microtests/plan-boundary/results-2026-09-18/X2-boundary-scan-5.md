I did the pre-flight setup for plan 2, stopping before Task 1's first test.

**Checked:** Read plan 1 (as committed) and plan 2 in full, then diffed plan 2's every Consumes line and task-brief reference against the actual `internal/game` code (`game.go`, `board.go`, `piece.go`, `events.go`, `bag.go`, `rules.go`) — field names, method signatures, and constants. Also scanned plan 2's own tasks against each other for intra-plan interface conflicts.

**Found and fixed in `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md`:**
- Plan 2 named a `game.Tick` method (Plan Set list + Task 6's `Update` rules) that doesn't exist — Plan 1 built `Advance(dt time.Duration) []Event`. Plan 1's own copy of the cross-plan list already said `Advance`; only plan 2's copy had drifted. Fixed both occurrences to `Advance`.
- Task 6's Consumes line attributed `render.ModeFor` to Task 5, but it's Task 3's product (`palette.go`). Reattributed it — no functional break since Task 3 runs first, but it was misleading.
- Everything else Plan 2 consumes from Plan 1 (`Game` fields, `Board`, `Piece`, `Event`, `GhostY`, `HardDrop`, `HoldPiece`, movement/rotation methods, `Width`/`Height`/`VisibleRows`/`HiddenRows`, `PieceKind`) matches the built code exactly — no changes needed there.

Both rulings are ledgered at `.superpowers/sdd/2026-09-18-cosmic-tetris-2-playable-terminal/progress.md` (new `.gitignore` added for `.superpowers/`). No Go was written. Ready for Task 1 whenever you want to proceed.
