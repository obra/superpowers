Setup for Plan 2 is done. Summary:

**Checked:** ran `plan-boundary` on plan 2; it flagged `Rect` and `Tick` as consumed-but-missing. Traced both against `internal/game` as actually built and against the plan's own text. Also read Tasks 1–6 in full and cross-checked every other Consumes/Produces pair (Task1↔2 `Rect`/`Paint`, Task2↔4 `Layout`, Task3↔4 `Options`, Task5↔6 `Render`/`Snapshot`/`Phase`, and Plan1's `game.Board`/`Piece`/`Event`/`GhostY`/`Game`/`HiddenRows`/`CellFor`/`KindT`/`Board.String`) directly against the source — all consistent.

**Changed (plans/2026-09-18-cosmic-tetris-2-playable-terminal.md only, no Go):**
- Added a concrete `type Rect struct{ X, Y, W, H int }` to Task 1's Produces block (`canvas.go`), resolving the plan's own unresolved either/or note; Task 2 now only adds methods (`Empty`/`Intersects`/`Contains`) and `Compute` on top of it.
- Renamed `Tick` → `Advance` in the Plan Set summary line and Task 6's `Update` rule, matching the engine's actual `Game.Advance(dt time.Duration) []Event` (the plan's own Architecture line already said `Advance`, so this was a stale name, not a design choice).
- Re-ran `plan-boundary`: prints `boundary: clean (8 consumed names found in code)`.

Created the sdd workspace/ledger at `.superpowers/sdd/2026-09-18-cosmic-tetris-2-playable-terminal/progress.md` with the two boundary rulings and a pre-flight table of every shared-interface pair across this plan's own tasks — no further conflicts found. Stopped before Task 1 Step 1.
