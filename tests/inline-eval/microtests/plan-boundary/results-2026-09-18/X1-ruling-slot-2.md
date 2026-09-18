Setup for Plan 2 is done. Summary:

**Checked:** every `game.*`/`g.*` symbol Plan 2 references against the actual `internal/game` source (not just Plan 1's text) — constants, `Board`, `Piece`, `PieceKind`, `GhostY`, `Game` fields all match exactly. Verified the four pinned Charm module versions actually resolve and confirmed their real APIs (`tea.Model`/`View`/`KeyPressMsg`/`WindowSizeMsg`/`ColorProfileMsg`, `lipgloss.Color`, `bubbles/key.Matches`, `bubbles/help`, `colorprofile.Profile.Convert`) match what Plan 2's Global Constraints assert. Checked Plan 2's 8 tasks for internal interface consistency, and cross-checked its Plan Set line against Plans 1/3/4/5 and `design.md`.

**Found one defect:** Plan 2 contradicted itself — its architecture line correctly says `Game.Advance`, but its Plan Set line and the Task 6 `Update` spec said `m.Game.Tick(dt)`, a method that doesn't exist (the real, and Plan 1/3/4/5-consistent, name is `Advance`). Fixed both spots in `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md`. No other plan file needed changes — Plan 3's Plan Set line already said `Advance`.

**Wrote:** `plans/progress.md`, the ledger, with the full conflict-scan table and the ruling.

Stopped before Task 1 Step 1 (the Canvas tests) as instructed — no Go written.
