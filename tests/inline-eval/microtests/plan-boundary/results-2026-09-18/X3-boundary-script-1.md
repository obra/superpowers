Setup for Plan 2 is done. Summary:

**Checked:** ran `plan-boundary` against Plan 2 — it initially flagged `Rect` and `Tick` as consumed names missing from the built engine. Verified against `internal/game` and design.md §49.2: the engine's method is `Advance(dt) []Event`, not `Tick` (Plan 2's own Architecture line already said `Advance` — `Tick` was a leftover inconsistency). `Rect` turned out to be a false positive — it's internal to Plan 2 itself, but the plan never actually declared its fields anywhere and had contradictory prose about where it lives.

**Changed:**
- Renamed `Tick`→`Advance` in the Plan Set line and Task 6's `Update` rules (2 spots).
- Added `type Rect struct{ X, Y, W, H int }` to Task 1's Produces block and replaced the contradictory placement prose with a single clear statement (Rect lives in `canvas.go`, Task 2 uses it).
- Re-ran `plan-boundary` → `boundary: clean (8 consumed names found in code)`.
- Did a pre-flight scan of Plan 2's own task-to-task interfaces (all consistent, no further rulings needed) and wrote both rulings plus the scan into a fresh ledger at `.superpowers/sdd/2026-09-18-cosmic-tetris-2-playable-terminal/progress.md`.

Stopped before Task 1's first test (`TestCanvasPlainRendersGrid`) as instructed — no Go written.
