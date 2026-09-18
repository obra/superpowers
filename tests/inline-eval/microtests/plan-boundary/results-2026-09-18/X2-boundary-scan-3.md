Pre-flight scan for Plan 2 is done. I checked every symbol its Plan Set line and task briefs pull from Plan 1 against the actual `internal/game` code: `game.Game`, `Event`, `Board`, `Piece`, `PieceKind`, `Cell`, `GhostY`, `CellFor`, `Board.Set/At/String`, the `Width`/`VisibleRows`/`HiddenRows` constants, `New(seed) *Game`, and the `Kind*` constants — all match as built.

One mismatch: the plan assumed a `Game.Tick(dt)` method, but Plan 1 built `(g *Game) Advance(dt time.Duration) []Event` — there's no `Tick` anywhere in the package. I fixed both occurrences (the Plan Set "Consumes" line and Task 6's `Update` rules for `FrameMsg`) to `Advance`, leaving `tea.Tick` (an unrelated Bubble Tea API mentioned in a comment) alone. Recorded the ruling in a new `plans/LEDGER.md`.

Stopping here, before Task 1's first test, as instructed.
