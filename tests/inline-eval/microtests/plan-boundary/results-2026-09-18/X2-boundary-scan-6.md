Pre-flight scan for Plan 2 is done. What I checked:

- Read the as-built `internal/game` package (`game.go`, `board.go`, `piece.go`) and diffed every symbol Plan 2's Consumes lines and task briefs reference (`Game`, `Board`, `Piece`, `Cell`, `PieceKind`, `Width`/`Height`/`VisibleRows`/`HiddenRows`, `New`, `GhostY`, `HardDrop`, `SoftDrop`, `HoldPiece`, `Next`, `Score`/`Lines`/`Level`/`Combo`/`Over`/`Seed`) against the real signatures.
- Confirmed the pinned Bubble Tea v2/Lip Gloss v2/Bubbles v2/colorprofile/x-ansi versions still resolve on the proxy, and fetched them into a scratch module to verify the exact API shapes the plan's Global Constraints assert as "verified" (`tea.Model`, `tea.NewView`, `View.AltScreen`, `KeyPressMsg`, `WindowSizeMsg`, `ColorProfileMsg`, `key.Matches`, `help.KeyMap`, `lipgloss.Color`, `colorprofile.Profile.Convert`, `ansi.Strip`/`StringWidth`) — all matched.

What I changed: Plan 1's engine exposes `Advance(dt time.Duration) []Event`, not `Tick`. Plan 2's own Architecture line already said `Game.Advance` correctly, but its Plan Set Consumes entry and the Task 6 `FrameMsg` handling rule said `Tick`/`m.Game.Tick(dt)`. Fixed both occurrences to `Advance` and logged the ruling (with everything else that checked out clean) in a new "Pre-flight Ledger" section at the top of `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md`.

Stopping here, before Task 1's first test, as instructed. No Go was written.
