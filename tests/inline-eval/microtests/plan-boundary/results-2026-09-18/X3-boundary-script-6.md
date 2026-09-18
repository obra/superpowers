Setup for Plan 2 is done. Summary:

**Checked:** ran `plan-boundary` against Plan 2, which flagged `Rect` and `Tick` as consumed-but-missing from the built `internal/game`. Traced each: `Tick` was a plan typo for the engine's real method `Advance(dt time.Duration) []Event`; `Rect` was never actually declared anywhere in the plan's code blocks despite being used throughout Tasks 1–2 (a plan-internal gap, not a Plan 1 mismatch). While reading the full plan for the required pre-flight interface scan, I also found Task 3 imports `colorprofile.Profile` but never `go get`s that module (it's a separate module from lipgloss/ansi, confirmed via the local module cache), and Task 6 is the only later `go get`.

**Changed** (all in `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md`):
- Plan Set line and Task 6's `Update` rule: `Tick`/`m.Game.Tick(dt)` → `Advance`/`m.Game.Advance(dt)`.
- Task 1: added `type Rect struct{ X, Y, W, H int }` to its Produces block; reworded the ambiguous ownership prose to say Task 1 owns the type, Task 2 owns its methods.
- Task 3: added a `go get github.com/charmbracelet/colorprofile` step and added `go.mod`/`go.sum` to its commit.
- Ledgered all three as rulings, plus a full pre-flight shared-interface table across Tasks 1–8, in `.superpowers/sdd/2026-09-18-cosmic-tetris-2-playable-terminal/progress.md`.

`plan-boundary` now prints `boundary: clean`. Stopped before Task 1's first test — no Go written.
