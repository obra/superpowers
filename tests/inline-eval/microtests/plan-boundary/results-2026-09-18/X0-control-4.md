Setup for Plan 2 is done. Summary:

**Checked:** every `internal/game` symbol Plan 2's Task interfaces consume (`Game`, `Board`, `Piece`, `PieceKind`, `GhostY`, `Advance`, `Event`, dimension consts, `CellFor`, score/lines/level/combo/over/hold/next fields) against the actual Plan-1 code — all present and matching. Cross-checked the tech-stack import paths, adaptive-layout rules, Bubble Tea event model, render pipeline order, and key bindings against design.md §3/§8/§31/§36/§37/§49.3 — consistent. Confirmed no TUI dependencies are in go.mod yet (expected; Task 1/6 add them) and confirmed there's no existing ledger convention in the repo.

**Changed:**
- Fixed a stale reference: Plan 2 said `game.Game.Tick`/`Tick` in its Plan-Set line and Task 6's `Update` rule, but Plan 1 shipped `Advance(dt)` (also what design.md §49.2 and Plan 1's own file already say). Corrected both spots in the plan file per its own "apply the ruling before the next task starts" rule.
- Wrote `plans/2026-09-18-cosmic-tetris-2-playable-terminal.ledger.md` recording what was checked, the fix above, and one open question I did *not* resolve by guessing: Task 2's fixed layout table (`Mission` at h≥25, `ShowStatLabels` at h≥26) reads backwards from design.md §49.3's prose ("title, then mission, then stats labels" drop order), but the plan's own Step-1 test is self-consistent with the table as written. Worth a quick human call before/during Task 2.

No Go code was written; Task 1's first test is next, pending your go-ahead.
