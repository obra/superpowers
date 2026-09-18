Setup for Plan 2 is done. Summary:

**Checked:** Plan 2 against Plan 1's actual shipped API in `internal/game` (method signatures, `Game`/`Board`/`Piece`/`Event` fields, `game.Width`/`VisibleRows`/`HiddenRows`), and against design.md §33–§37, §39, §46, §49.3–§49.7 for consistency with the file layout, render pipeline order, CLI surface, and pinned decisions. Also confirmed `go1.26.1` satisfies the `go 1.26` directive.

**Found and fixed one real bug:** Plan 2 called a nonexistent `game.Game.Tick(dt)` in two places (the Plan Set consumes-list, and the Task 6 `FrameMsg` update-rule prose), while Plan 1's engine only exposes `Advance(dt)` — matching Plan 2's own architecture line and design.md §35/§49.2. Left as written, Task 6 would have specified a call that doesn't compile. Both spots are now `Advance`.

Everything else checked out — no other deviations. Logged the ruling in new `plans/LEDGER.md`. No Go code was written; stopping before Task 1's first test as instructed.
