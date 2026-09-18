Setup for Plan 2 is done. Summary:

**Checked:** ran `plan-boundary` against Plan 2 (`plans/2026-09-18-cosmic-tetris-2-playable-terminal.md`) against the built `internal/game` code. It flagged two names.

**Changed:**
1. `Tick` — Plan 1's engine has no such method; the real one is `Advance(dt time.Duration) []Event`. Fixed the Plan Set consumes-list and the `FrameMsg` update rule to call `m.Game.Advance(dt)`.
2. `Rect` — the plan referenced it (`Fill(r Rect, ...)`, Task 2's "Consumes: Rect (Task 1)") but never actually defined its fields anywhere. Added `type Rect struct{ X, Y, W, H int }` to Task 1's Produces block and cleaned up the surrounding hedging prose (which also had a wording accident that made the checker flag `canvas`/`layout` too).

Both rulings are logged in the ledger at `.superpowers/sdd/2026-09-18-cosmic-tetris-2-playable-terminal/progress.md`. Re-running `plan-boundary` now prints `boundary: clean (8 consumed names found in code)`. No Go was written; stopping before Task 1's first test as instructed.
