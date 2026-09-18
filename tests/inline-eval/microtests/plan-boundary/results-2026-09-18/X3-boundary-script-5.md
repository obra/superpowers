Setup for Plan 2 is done. Summary:

**Checked:** confirmed Plan 1 is complete and committed (`internal/game` matches what Plan 2 expects to consume), created Plan 2's workspace/ledger, read the plan in full, and traced its own task-to-task interfaces (Rect, Paint, Canvas, Layout, Options/Mode, Snapshot/Render) for internal consistency.

**Changed (in `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md`):**
- `plan-boundary` first failed on `Rect` and `Tick`. Added `type Rect struct{ X, Y, W, H int }` to Task 1's Produces block (it was only ever mentioned in prose, never actually declared).
- Renamed `Tick` → `Advance` everywhere it meant `*game.Game`'s advance-by-duration method — the real method on `internal/game/game.go` is `Advance(dt time.Duration) []Event`, not `Tick`. Left `tea.Tick` (Bubble Tea's own ticker) alone.
- Fixed Task 6's Consumes line, which attributed `render.ModeFor` to Task 5; it's actually Task 3's.

All three are ledgered as rulings in `.superpowers/sdd/2026-09-18-cosmic-tetris-2-playable-terminal/progress.md`. `plan-boundary` now prints `boundary: clean`. Stopping here, before Task 1's first test, as instructed — no Go written.
