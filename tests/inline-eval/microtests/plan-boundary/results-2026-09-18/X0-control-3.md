The diff is clean and self-consistent. Setup for Plan 2 is done and I'm stopping before Task 1's first test, as instructed.

**What I checked:** read plan 2 in full plus every design.md section it cites (§4–§49.7), cross-checked plan 2's claimed Plan-1 interfaces (`game.Game`, `Event`, `Board`, `Piece`, `GhostY`) against the actual `internal/game` source, and traced every producer/consumer pair across plan 2's 8 tasks. Also verified all five pinned module versions resolve in the local module cache.

**What I changed** (`plans/2026-09-18-cosmic-tetris-2-playable-terminal.md`, no Go written):
- **Ruling:** replaced two `Tick`/`m.Game.Tick(dt)` references with `Advance`/`m.Game.Advance(dt)` — Plan 1 never produced `Tick`; `Advance(dt) []Event` is what it actually built, matching design.md §49.2.
- **Ruling:** Task 3 (`palette.go`) uses `colorprofile.Profile` but had no `go get` for `github.com/charmbracelet/colorprofile`, and the Tech Stack line never named it — added `go get github.com/charmbracelet/colorprofile@v0.4.3` to Task 3 (the exact version bubbletea/bubbles already pin, so no later bump), plus updated the Tech Stack line and Task 3's commit `git add`.
- **Ruling:** resolved a self-contradiction about where `Rect` lives (Task 1's prose vs. the File Structure table) — `Rect` stays in `canvas.go` (Task 1); reworded both spots to say so plainly.

Full detail and cost-if-wrong for each ruling is in the ledger at `.superpowers/sdd/2026-09-18-cosmic-tetris-2-playable-terminal/progress.md`. Next step is Task 1 Step 1: write the failing canvas tests.
