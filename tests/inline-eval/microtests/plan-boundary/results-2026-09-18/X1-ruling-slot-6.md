Setup for Plan 2 is done. Summary:

**Checked:**
- Read Plan 2 in full and cross-checked every Plan-1 API it consumes (`game.Game`, `Board`, `Piece`, `PieceKind`, `Event`, `GhostY`, `CellFor`, field names/types) against the actual `internal/game` source — all matched except one.
- Verified the pinned dependency versions (`bubbletea/v2@v2.0.9`, `lipgloss/v2@v2.0.6`, `bubbles/v2@v2.2.1`, `x/ansi@v0.11.8`) exist and are the latest in that line, then fetched them into a scratch module and confirmed the specific API surface Plan 2 relies on — `tea.Model`/`tea.NewView`/`View.AltScreen`, `KeyPressMsg`, `WindowSizeMsg{Width,Height}`, `ColorProfileMsg{colorprofile.Profile}`, `colorprofile.Profile` constants (`TrueColor`/`ANSI256`/`ANSI`/`NoTTY`/`ASCII`/`Ascii`), `key.Matches[Key fmt.Stringer]`, `lipgloss.Color(string) color.Color` — all matched the plan's claims exactly.
- Confirmed the repo is still clean with only `internal/game` present, so Task 1 starts from a blank `internal/render`.

**Changed:**
- Plan 2 called the engine's frame-advance method `Tick` in two spots (Plan Set line, Task 6 `Update` rules) while its own Architecture section and `design.md` §49.2 both name it `Advance`. `internal/game/game.go` only has `Advance(dt time.Duration) []Event`, no `Tick`. Fixed both occurrences in `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md` to `Advance`.
- Logged this as a ruling in new `plans/RULINGS.md` (no prior ledger existed, so I created one). Checked Plans 3–5 for the same typo — none found, so no other plan needed a change.

Stopping here, before Task 1 Step 1's failing tests.
