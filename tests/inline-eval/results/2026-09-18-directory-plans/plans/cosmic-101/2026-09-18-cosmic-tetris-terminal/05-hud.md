### Task 5: HUD — hold, next, stats, title, mission, controls

**Files:**
- Create: `internal/render/hud.go`
- Test: `internal/render/hud_test.go`

**Interfaces:**
- Consumes: `Scene`, `Palette`, `Glyphs` (Task 2); `Layout` (Task 3); `borderBox` (Task 4); `game.PieceKind`, `Game.Hold`, `Game.Next`, `Game.Score/Lines/Level`, `Game.Seed` (plan 1).
- Produces:
```go
func holdPanel(s Scene, p Palette, l Layout) string   // label + 4×8 mini-cell area; empty area when Hold == nil
func nextPanel(s Scene, p Palette, l Layout) string   // label + l.NextCount previews, top-down
func statsPanel(s Scene, p Palette, l Layout) string  // SCORE / LINES / LEVEL, labels per l.ShowStatLabels
func titleLine(s Scene, p Palette, width int) string
func missionLine(s Scene, p Palette, width int) string
func controlsLine(s Scene, p Palette, width int) string
func pieceMini(k game.PieceKind, p Palette, m Mode) string  // 2 lines × 8 columns, piece drawn at rotation 0
```

Pinned copy and formatting (§4, §27, §49.3):

```text
title:     ╭─ ✦ COSMIC TETRIS ─── LOCAL UNIVERSE <ID> ─── ╮   ID = fmt.Sprintf("%04X", uint16(s.Game.Seed))
score:     8 digits, zero padded      "00129340"
lines:     3 digits, zero padded      "042"
level:     2 digits, zero padded      "07"
mission:   "☄ MISSION CONTROL: " + s.Mission      ("* MISSION CONTROL: " in ModeASCII)
controls:  "←→ move   ↑ rotate   ↓ descend   SPACE YEET   C hold   ? help"
           ASCII:  "<> move   ^ rotate   v descend   SPACE YEET   C hold   ? help"
```

Every one of these returns lines padded or truncated to the width it is given, so no HUD element can ever push the board sideways (§41: the HUD must not corrupt the board). When `l.ShowStatLabels` is false, only the values render. When `s.Mission` is empty, `missionLine` returns a blank line of the right width — the row is reserved so the layout does not jump when a message appears.

- [ ] **Step 1: Write the failing test**

`internal/render/hud_test.go`:

```go
func TestStatsFormatting(t *testing.T)
// Score 129340, Lines 42, Level 7 with labels: output contains "00129340", "042", "07"
//   and the words "SCORE", "LINES", "LEVEL"

func TestStatsWithoutLabels(t *testing.T)
// same scene, l.ShowStatLabels == false: contains the numbers, contains none of the words

func TestNextPanelHonoursCount(t *testing.T)
// LayoutWide (NextCount 5): 5 previews rendered
// LayoutSmall (NextCount 3): exactly 3 previews, and the panel is no taller than the board

func TestHoldPanelEmptyAndFilled(t *testing.T)
// Hold == nil: panel has the "HOLD" label and no block glyphs
// Hold == KindT: panel contains block glyphs

func TestPieceMiniIsFixedSize(t *testing.T)
// every kind: pieceMini is 2 lines, each exactly 8 columns wide

func TestLinesRespectWidth(t *testing.T)
// titleLine, missionLine, controlsLine at widths 40, 46, 64, 120:
//   each returns exactly one line of exactly that width (ANSI-stripped, lipgloss.Width)

func TestControlsTruncateNotWrap(t *testing.T)
// controlsLine at width 40 is one line and still contains "move"

func TestMissionEmptyReservesRow(t *testing.T)
// s.Mission == "": missionLine returns one line of the requested width, all spaces

func TestASCIIModeAvoidsArrowGlyphs(t *testing.T)
// ModeASCII: controlsLine contains "<>" and not "←"; missionLine starts with "*"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -run TestStatsFormatting -v`
Expected: FAIL — `undefined: statsPanel`.

- [ ] **Step 3: Implement `internal/render/hud.go`**

Use `lipgloss.NewStyle().Width(n).MaxWidth(n)` for the single-line elements so pad-and-truncate is one code path.

- [ ] **Step 4: Run the tests**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/hud.go internal/render/hud_test.go
git commit -m "feat(render): hold, next, stats, title, mission, and controls HUD"
```
