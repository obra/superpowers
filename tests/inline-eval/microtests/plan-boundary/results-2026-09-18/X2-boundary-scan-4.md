I ran the pre-flight scan for Plan 2 against `internal/game` as actually built (read `game.go`, `board.go`, `piece.go`, `events.go`, `bag.go`, `scoring.go`, `rules.go` and cross-checked every name/signature Plan 2's Consumes lines and task briefs cite: `Game`, `Board`, `Piece`, `PieceKind`, `Cell`/`CellFor`, `Width`/`VisibleRows`/`HiddenRows`, `NextCount`, `GhostY`, field names on `Game`).

Found one real mismatch: Plan 2 said it consumes `game.Game.Tick(dt)`, but Plan 1 built (and its own plan file names) `Advance(dt) []Event` — there is no `Tick` method on `game.Game`. Fixed both occurrences in the plan file (the Plan Set consumes-list line, and Task 6's `Update` rules prose for the `FrameMsg` handler), and logged the ruling in a new `plans/ledger.md`. Everything else Plan 2 pulls from Plan 1 — types, constants, field names, method signatures — matched the code as built exactly.

Stopping here, before Task 1's first test, as instructed. No Go code was written.
