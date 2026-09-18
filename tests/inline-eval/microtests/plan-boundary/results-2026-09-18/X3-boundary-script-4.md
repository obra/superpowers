Setup for plan 2 is done. Summary:

**Checked:** ran `plan-boundary` against `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md`, which flagged two names as missing from the built code: `Tick` and `Rect`.

**Changed:**
- `Tick` → `Advance`: Plan 1's engine has no `Tick` — the real method is `Game.Advance(dt time.Duration) []Event` (`internal/game/game.go:146`). Renamed both the Plan Set summary and the Task 6 frame-clock text to `Game.Advance`.
- `Rect`: this was a false positive from an unresolved ambiguity the plan itself flagged — Task 1's prose said to put `Rect` in `canvas.go` but never actually declared it in a code block, so nothing in the plan visibly produced it. Added `type Rect struct{ X, Y, W, H int }` to Task 1's `Produces` block and removed the now-redundant ambiguity paragraph. Task 2 still consumes `Rect` from Task 1 within this same plan.

Both rulings are recorded in `.superpowers/sdd/2026-09-18-cosmic-tetris-2-playable-terminal/progress.md` (new ledger for this plan). Re-ran `plan-boundary` — now prints `boundary: clean (8 consumed names found in code)`. Stopping here, before Task 1's first test, as instructed.
