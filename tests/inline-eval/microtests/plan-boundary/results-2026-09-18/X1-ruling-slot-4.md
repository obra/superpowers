No `go.sum` yet — that's expected, Task 1 Step 3 creates it via `go get`. Setup is done. Stopping before Task 1's first test as instructed.

What I checked:
- Read `design.md` and both Plan 1 and Plan 2 in full.
- Verified Plan 1's engine is actually complete and matches its own spec: `go test ./...` and `go vet ./...` pass clean, and every exported symbol Plan 2 depends on (`game.Game`, `Board`, `Piece`, `PieceKind`, `Width`/`VisibleRows`/`HiddenRows`, `CellFor`, `New(seed)`, `GhostY`) exists exactly as documented.
- Confirmed the Go toolchain (`go1.26.1`) and every pinned UI dependency version (`charm.land/lipgloss/v2@v2.0.6`, `bubbletea/v2@v2.0.9`, `bubbles/v2@v2.2.1`, `charmbracelet/x/ansi@v0.11.8`) resolve against the module proxy.

What I changed:
- Found that Plan 2 named the engine's tick method `Tick` in two places (its Plan-Set consumer line and the `FrameMsg` rule in Task 6), but Plan 1 actually implemented and committed it as `Advance(dt time.Duration) []Event` — there is no `Tick` anywhere in `internal/game`. Fixed both spots in `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md` to say `Advance`.
- Logged that as a ruling in a new `plans/RULINGS.md` (no prior ledger existed to append to).

Ready to start Plan 2 Task 1 (the Canvas) on your go-ahead.
