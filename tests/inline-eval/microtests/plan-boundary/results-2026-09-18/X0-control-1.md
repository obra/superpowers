I did the setup/review step for plan 2 (executing-plans Step 1) and stopped before Task 1's first test.

**Checked:** every `game.*` symbol plan 2 relies on against the actual committed engine (`Game`, `Advance`, `Event`, `Board`, `Piece`, `GhostY`, `Width`, `VisibleRows`, `HiddenRows`, etc.) — all present with matching signatures; `go.mod`/`go.sum` state; every design.md section plan 2 cites (§4–§49.x) exists and matches; board hidden-row indexing lines up with the `CellOrigin` formula in Task 4.

**Changed:** found a real drafting bug — plan 2 said `Tick` (in the Plan Set consumed-symbols line and in Task 6's `Update` rules, `m.Game.Tick(dt)`), but the engine method is `Advance`, and plan 1's own text plus plan 2's Architecture paragraph already agree on `Advance`. Fixed both spots in `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md`. Also created `plans/LEDGER.md` recording this review and the correction (there was no prior ledger convention, so I started one, matching the "rulings applied to the plan file" language the plans themselves use).

**Not fixed, flagged instead:** the Bubble Tea v2 API shapes plan 2 asserts (`tea.KeyPressMsg`, `colorprofile.Profile`, etc.) can't be checked yet — none of those modules are in `go.sum` until Task 1/6 run `go get`. Noted in the ledger to re-verify once fetched, before writing code against them.

No Go was written. Ready for Task 1, Step 1 (write the failing canvas tests) on your go-ahead.
