Pre-flight scan for Plan 2 is done. Summary:

**Checked:** every identifier Plan 2's Consumes lines and task briefs pull from Plan 1 — `game.Game`, `Event`, `Board`, `Piece`, `PieceKind`, `GhostY`, `New`, `CellFor`, `Width`, `VisibleRows`, `HiddenRows`, plus the field names used in tests (`Score`, `Lines`, `Level`, `Combo`, `Active`, `Hold`, `Next`, `Over`) — against `internal/game` as actually built (verified with `go build ./...` and `go test ./...`, both clean).

**Changed:** one mismatch. Plan 2 said it consumes a method called `Tick`, but Plan 1 built `Advance(dt time.Duration) []Event` (and Plan 1's own file already calls it `Advance` in its Consumes line). Fixed both occurrences — the Plan 2 Consumes line and the `FrameMsg` handling rule in Task 6 (`m.Game.Tick(dt)` → `m.Game.Advance(dt)`). Everything else checked out as written.

Logged the fix as a ruling in `plans/RULINGS.md` (new file — no ledger convention existed yet, so I started one to carry forward through the remaining plans). Stopping here, before Task 1's first test, per instructions.
