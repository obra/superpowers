Setup for Plan 2 is done. Summary:

**Checked:**
- Plan 1 is complete and its actual API (`internal/game`: `Game`, `Board`, `Piece`, `PieceKind`, `Event`, `GhostY`, `Width`/`Height`/`VisibleRows`/`HiddenRows`, `Advance`) against everything Plan 2 declares it consumes.
- `go.mod` module name (`cosmic-tetris`) and Go version (`1.26`) against Plan 2's Global Constraints — match, and `go1.26.1` is installed.
- Plan 2's cited design.md sections (§8 controls, §26 colors, §28 game-over card, §30 pause, §31 adaptive layout/too-small notice, §32 modes, §33 architecture, §36/§37 event model and render pipeline) against the plan's copy strings, draw order, and file layout — all consistent.
- No pre-existing `plans/ledger.md` or "Ruling:" convention existed yet, so I started one.

**Found and fixed:** Plan 2 called a nonexistent `game.Game.Tick(dt)` (Plan Set consumes-line and the Task 6 `FrameMsg` rule) — the committed engine's method is `Advance`, which Plan 2's own Architecture paragraph already named correctly. This would have failed to compile at Task 6. Edited both spots in `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md` to say `Advance`, and confirmed no other plan file references `Tick`. Logged the ruling in new `plans/ledger.md`.

No Go was written. Stopping here, before Task 1's failing-tests step.
