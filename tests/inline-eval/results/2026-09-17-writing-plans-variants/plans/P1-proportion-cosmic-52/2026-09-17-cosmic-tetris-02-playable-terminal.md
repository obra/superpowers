# Cosmic Tetris — Plan 02: Playable Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Plan 01's headless engine into a genuinely good, resizable, keyboard-immediate terminal Tetris — no cosmic effects yet.

**Architecture:** Bubble Tea owns the clock and the input; `internal/render` is a pure function from (game snapshot, terminal size, mode) to a string. Everything is composited into one character grid (`render.Grid`) so that Plan 03/04 can drop stars, particles, and a shake offset into the same surface without string surgery. `internal/app` holds the Bubble Tea model and is the only place that touches `time.Now()`.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2 v2.0.9`, `charm.land/lipgloss/v2 v2.0.6`, `charm.land/bubbles/v2 v2.2.1`, `github.com/charmbracelet/x/ansi` (ANSI stripping in tests), `github.com/charmbracelet/colorprofile` (capability detection).

**Spec:** `design.md` (§4, §8, §9 mechanics side, §10, §31, §32 modes, §33, §34, §36, §37, §39, §41, §46, §49.3, §49.4, §49.5)

## Global Constraints

- Bubble Tea is the application/event loop; do not abstract it behind a homegrown framework (§3).
- §33's tree is the package structure, not a filename whitelist: these plans add one small file per subsystem inside `internal/render`, `internal/app`, and `internal/fx`. No new package, no file over a few hundred lines.
- Use Bubbles only for key bindings, help, and the boot spinner (§3).
- Verified v2 API shapes — the model interface is `Init() tea.Cmd`, `Update(tea.Msg) (tea.Model, tea.Cmd)`, `View() tea.View`. Alt screen is a field, not an option: `v := tea.NewView(s); v.AltScreen = true`. Key presses arrive as `tea.KeyPressMsg`. There is no `tea.WithAltScreen` in v2.0.9.
- One logical block occupies `2 terminal columns × 1 terminal row` (§5). Pieces render as filled glyphs with a bright foreground — not a foreground/background pair (§49.4).
- Glyphs: pieces `██`, ASCII `[]`; ghost `░░`, ASCII `··` (§49.4).
- Active piece renders one step brighter than locked cells (§49.4).
- Minimum usable terminal `~40 columns × ~24 rows`; below that show the too-small notice (§31).
- Small-terminal drop order: title border, then mission control, then stats labels. NEXT never stacks above or below the board; it moves beside the board and truncates to 3 pieces. Board and controls are last (§49.3).
- CLI surface is exactly: bare, `--seed 1234`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help` (§49.5).
- Rendering must not mutate game state (§37). `internal/render` takes values and pointers-to-const-use only; it never calls `Apply` or `Advance`.
- Input must not wait for ticks (§36, §44). Key handling calls `game.Apply` inside `Update` immediately.
- Never crash from terminal resizing (§31).
- The §4 mockup is mood, not geometry. The ANSI-stripped golden tests are the binding layout contract (§49.7).

## Review Focus

1. **`WindowSizeMsg{0, 0}`** — several terminals and every `WithoutRenderer` test send a zero or 1×1 size before the real one. `View()` must return a non-empty string, and no lipgloss call may receive a negative width. *(Task 6)*
2. **Sub-minimum terminals** — at 34×19 the too-small notice itself does not fit. It must truncate to the available box rather than wrap into garbage or panic. *(Task 6)*
3. **Resize while an overlay is open** — pause, help, and game-over panels must re-centre on the next frame and must not panic when the new size is smaller than the panel. *(Task 8)*
4. **Several keys inside one frame** — a fast player (or held-key auto-repeat) produces multiple `KeyPressMsg` between two `FrameMsg`s. Every one must be applied, and none may disturb the gravity accumulator except soft drop, which resets it by design. *(Task 7)*
5. **`r` from pause and from game over** — restart must produce a fresh game on the same seed and return the app to `StatePlaying` from any state, including mid-overlay. *(Task 7)*

---

### Task 1: Character grid compositing surface

**Files:**
- Create: `internal/render/grid.go`
- Test: `internal/render/grid_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```go
  type Cell struct { R rune; Style lipgloss.Style; Styled bool }
  type Grid struct { W, H int; cells []Cell }
  func NewGrid(w, h int) *Grid
  func (g *Grid) Resize(w, h int)          // reuses the backing slice when it fits
  func (g *Grid) Clear()
  func (g *Grid) Set(x, y int, r rune, st lipgloss.Style)   // out of bounds: no-op
  func (g *Grid) SetPlain(x, y int, r rune)
  func (g *Grid) Text(x, y int, s string, st lipgloss.Style) // left-to-right, clipped
  func (g *Grid) Blit(x, y int, block string, st lipgloss.Style) // multi-line, clipped
  func (g *Grid) String() string           // rows joined by \n, trailing blanks trimmed
  ```

`String()` groups runs of consecutive cells sharing a style and renders each run
with one `st.Render(run)` call, so a 80×24 frame costs tens of style renders, not
two thousand (§38). Unstyled cells render as raw runes. Empty cells are spaces.

Every write is silently clipped. That single decision is what makes resize-safety
and Review Focus 1/2 cheap for every later task.

- [ ] **Step 1: Write the failing tests**

```go
func TestSetAndStringRoundTrip(t *testing.T)
// 3x2 grid, SetPlain a few runes, String() == "ab\n c" style expectation with
// trailing spaces trimmed per line.

func TestWritesOutsideBoundsAreDropped(t *testing.T)
// Set at (-1,0), (0,-1), (W,0), (0,H): no panic, grid unchanged.

func TestTextClipsAtRightEdge(t *testing.T)
// 4-wide grid, Text(2, 0, "hello"): row reads "  he".

func TestBlitPlacesMultilineBlock(t *testing.T)
// Blit a 3-line box at (1,1) in a 10x6 grid: lines land at rows 1..3, column 1.

func TestBlitClipsBelowBottom(t *testing.T)
// A 5-line block blitted at y=4 of a 6-row grid keeps rows 4..5 and drops the rest.

func TestZeroSizedGridStringIsEmpty(t *testing.T)
// NewGrid(0, 0).String() == "" and Set does not panic. Review Focus 1.

func TestResizePreservesNothingButDoesNotLeak(t *testing.T)
// Resize(80,24) then Resize(40,12) then String(): 12 lines, each at most 40 wide.

func TestStringGroupsAdjacentSameStyleRuns(t *testing.T)
// Set five adjacent cells with one style; assert the raw output contains exactly
// one occurrence of that style's SGR prefix on that row.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -v`
Expected: build failure — package does not exist.

- [ ] **Step 3: Implement**

`go get charm.land/lipgloss/v2@v2.0.6` then write `grid.go` per the interfaces.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add go.mod go.sum internal/render/grid.go internal/render/grid_test.go
git commit -m "feat(render): clipped character grid compositing surface"
```

---

### Task 2: Palette and render modes

**Files:**
- Create: `internal/render/palette.go`
- Test: `internal/render/palette_test.go`

**Interfaces:**
- Consumes: `game.PieceKind` (Plan 01 Task 2).
- Produces:
  ```go
  type Mode int
  const (ModeFull Mode = iota; ModeReduced; ModeASCII)
  func ModeForProfile(p colorprofile.Profile, forceASCII bool) Mode
  type Palette struct { Mode Mode }
  func NewPalette(m Mode) Palette
  func (p Palette) Block() string                  // "██" or "[]"
  func (p Palette) Ghost() string                  // "░░" or "··"
  func (p Palette) Locked(k game.PieceKind) lipgloss.Style
  func (p Palette) Active(k game.PieceKind) lipgloss.Style   // one step brighter
  func (p Palette) GhostStyle() lipgloss.Style
  func (p Palette) Chrome() lipgloss.Style         // borders, box lines
  func (p Palette) Label() lipgloss.Style          // dim HUD labels
  func (p Palette) Value() lipgloss.Style          // bright HUD numbers
  func (p Palette) Accent() lipgloss.Style         // ✦ marks, titles
  ```

Piece hues follow §26's intent, as truecolor hex in `ModeFull` and the nearest
ANSI-256 index in `ModeReduced`; `ModeASCII` keeps the eight basic ANSI colors:

```
I plasma cyan     #22e4f0 / 45      J deep electric blue #3a5cf0 / 27
L solar orange    #ff8c22 / 208     O stellar gold       #ffd23f / 220
S alien green     #46e06a / 41      T ultraviolet        #a95cff / 141
Z supernova pink  #ff3d68 / 197
```

`Active` is the same hue with `Bold(true)` and a lightened hex (mix 35% toward
white); locked cells use the base hue unbolded. That is §49.4's "one step
brighter" without inventing a second palette.

- [ ] **Step 1: Write the failing tests**

```go
func TestModeForProfileMapsCapabilities(t *testing.T)
// TrueColor -> ModeFull; ANSI256 -> ModeReduced; ANSI and Ascii and NoTTY ->
// ModeASCII; forceASCII overrides TrueColor to ModeASCII.

func TestBlockAndGhostGlyphsPerMode(t *testing.T)
// ModeFull and ModeReduced: "██" and "░░". ModeASCII: "[]" and "··".

func TestASCIIModeEmitsOnlyASCIIRunes(t *testing.T)
// Every rune of Block(), Ghost(), and the box-drawing set returned by Chrome-
// adjacent helpers in ModeASCII is < 128. Repeated end-to-end in Task 8.

func TestEveryKindHasADistinctColor(t *testing.T)
// The seven Locked styles have seven distinct foreground values in ModeFull.

func TestActiveIsBrighterThanLocked(t *testing.T)
// For each kind, Active differs from Locked and is bold.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'Mode|Glyph|ASCII|Kind|Active' -v`
Expected: FAIL — undefined: `NewPalette`.

- [ ] **Step 3: Implement**

`go get github.com/charmbracelet/colorprofile` then write `palette.go`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add go.mod go.sum internal/render/palette.go internal/render/palette_test.go
git commit -m "feat(render): neon space palette and three render modes"
```

---

### Task 3: Board rendering with ghost and active piece

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: `Grid`, `Palette`, `game.Board`, `game.Piece`, `game.Ghost`.
- Produces:
  ```go
  const (BoardInnerW = game.Width * 2   // 20 columns
         BoardInnerH = game.VisibleRows // 20 rows
         BoardOuterW = BoardInnerW + 2
         BoardOuterH = BoardInnerH + 2)
  type BoardView struct {
      Board  game.Board
      Active game.Piece
      Ghost  game.Piece
      ShowGhost bool
  }
  // DrawBoard writes the border and interior into g with the outer top-left at
  // (ox, oy). border is the four-corner box style Chrome() unless a caller
  // (Plan 03) overrides it.
  func DrawBoard(g *Grid, ox, oy int, v BoardView, p Palette, border lipgloss.Style)
  ```

Draw order inside the board region follows §37 steps 3–5: locked cells, then
ghost, then active. The ghost only writes into cells that are empty in the board
*and* not covered by the active piece — that is §10's "must never obscure locked
blocks", enforced by construction rather than by draw order luck.

Only rows `HiddenRows..Height-1` are drawn; the two spawn rows are never visible.

- [ ] **Step 1: Write the failing tests**

Tests strip ANSI with `ansi.Strip` and assert on plain text.

```go
func TestEmptyBoardIsBorderedAndBlank(t *testing.T)
// A 22x22 grid drawn at (0,0): 22 lines; top line is "╔" + 20 "═" + "╗";
// interior lines are "║" + 20 spaces + "║".

func TestLockedCellsRenderAsTwoColumnBlocks(t *testing.T)
// One cell at board (0, 21) -> last interior row starts with "██" after the "║".

func TestHiddenRowsAreNotDrawn(t *testing.T)
// Cells at y=0 and y=1 produce a completely blank interior.

func TestActivePieceIsDrawn(t *testing.T)
// A T piece at a known position appears at the expected columns/rows.

func TestGhostIsDrawnBeneathActive(t *testing.T)
// Active near the top with Ghost on the floor: ghost rows show "░░", active rows
// show "██", and no row shows a ghost glyph where the active piece sits.

func TestGhostNeverOverwritesLockedCells(t *testing.T)
// Place locked cells overlapping the ghost's cells; those positions still read
// "██", not "░░". (§10)

func TestASCIIModeUsesBracketsAndDots(t *testing.T)
// Same scene in ModeASCII: "[]" for blocks, "··" for ghost, and every output
// rune is < 128 including the border.

func TestDrawBoardAtOffsetDoesNotWriteOutsideTheGrid(t *testing.T)
// Draw at (70, 20) in an 80x24 grid: no panic, output has 24 lines.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run Board -v`
Expected: FAIL — undefined: `DrawBoard`.

- [ ] **Step 3: Implement**

`board.go`. In `ModeASCII` the border uses `+`, `-`, `|`; in the other modes
`╔ ═ ╗ ║ ╚ ╝`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): board, ghost, and active piece drawing"
```

---

### Task 4: HUD panels — hold, next, stats, controls

**Files:**
- Create: `internal/render/hud.go`
- Test: `internal/render/hud_test.go`

**Interfaces:**
- Consumes: `Grid`, `Palette`, `game.PieceKind`.
- Produces:
  ```go
  type Stats struct { Score, Lines, Level, Combo int; Seed int64 }
  func DrawMini(g *Grid, ox, oy int, k game.PieceKind, p Palette)  // 8x2 piece thumbnail
  func DrawHold(g *Grid, ox, oy int, held *game.PieceKind, p Palette, label bool)
  func DrawNext(g *Grid, ox, oy int, next []game.PieceKind, count int, p Palette, label bool)
  func DrawStats(g *Grid, ox, oy int, s Stats, p Palette, labels bool)
  func DrawControls(g *Grid, ox, oy, width int, p Palette) // one line, truncated to width
  func DrawTitle(g *Grid, ox, oy, width int, seed int64, p Palette)
  ```

`DrawMini` renders a kind's rotation-0 cells inside a fixed 8×2 area so the HOLD
and NEXT columns never jitter as pieces change. `labels bool` is §49.3's third
drop: false renders `042` where true renders `LINES` above `042`.

`DrawControls` renders `←→ move   ↑ rotate   ↓ descend   SPACE YEET   C hold   ? help`
and truncates from the right at `width`, dropping whole segments rather than
cutting mid-word.

`DrawTitle` renders `╭─ ✦ COSMIC TETRIS ── LOCAL UNIVERSE 7F3A ─...─╮`, where the
universe id is `fmt.Sprintf("%04X", uint16(seed))` — the seed made decorative, as
§4's mockup implies.

- [ ] **Step 1: Write the failing tests**

```go
func TestMiniPieceFitsEightByTwo(t *testing.T)
// Each of the seven kinds drawn into a clean 8x2 grid: no line exceeds 8 columns
// and at most 2 lines are non-blank.

func TestHoldShowsEmptyStateWhenNothingHeld(t *testing.T)
// held == nil: the thumbnail area is blank, no panic.

func TestNextRendersRequestedCount(t *testing.T)
// count 5 -> five thumbnails at 3-row spacing; count 3 -> three, and nothing is
// drawn in the rows the other two would have used.

func TestNextCountLargerThanQueueIsClamped(t *testing.T)
// A 2-element queue with count 5 draws two thumbnails and does not panic.

func TestStatsWithLabels(t *testing.T)
// Output contains "SCORE", "00129340" zero-padded to 8, "LINES", "042" padded to
// 3, "LEVEL", "07" padded to 2.

func TestStatsWithoutLabels(t *testing.T)
// Same values, labels false: contains the numbers, contains none of the words.

func TestControlsTruncateToWidth(t *testing.T)
// width 40: output is at most 40 columns and ends at a segment boundary
// (no partial word).

func TestTitleFillsExactWidth(t *testing.T)
// width 66: the rendered line is exactly 66 columns and ends with "╮".

func TestTitleShowsSeedAsUniverseID(t *testing.T)
// seed 0x7F3A -> output contains "7F3A".
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'Mini|Hold|Next|Stats|Controls|Title' -v`
Expected: FAIL — undefined: `DrawHold`.

- [ ] **Step 3: Implement**

`hud.go` per the interfaces.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/hud.go internal/render/hud_test.go
git commit -m "feat(render): hold, next, stats, controls, and title chrome"
```

---

### Task 5: Overlay panels — pause, help, game over

**Files:**
- Create: `internal/render/overlay.go`
- Test: `internal/render/overlay_test.go`

**Interfaces:**
- Consumes: `Grid`, `Palette`, `Stats`, `bubbles/v2/key`, `bubbles/v2/help`.
- Produces:
  ```go
  func DrawCentredPanel(g *Grid, title string, lines []string, p Palette)
  func DrawPause(g *Grid, p Palette)
  func DrawHelp(g *Grid, p Palette, h help.Model, keys help.KeyMap)
  func DrawGameOver(g *Grid, s Stats, p Palette)
  ```

`DrawCentredPanel` builds the box with lipgloss (`Border(lipgloss.RoundedBorder())`,
`Padding(1, 2)`), then blits it at the grid's centre. If the box is wider or taller
than the grid, the blit clips (Task 1) — that is Review Focus 3's guarantee, and
`DrawCentredPanel` additionally clamps the panel's content width to `g.W - 2` so a
narrow terminal gets a narrow panel instead of a clipped one.

Copy is fixed by the spec: pause is `TEMPORAL SUSPENSION` / `SPACE IS PAUSED` /
`p  resume` (§30); game over is `UNIVERSE EXPIRED`, the three stat lines,
`r  REBOOT UNIVERSE`, `q  ACCEPT COSMIC DEATH`, subtitle `CAUSE: EXCESSIVE GEOMETRY`
(§28); help is `FLIGHT MANUAL` with §39's exact ten rows, rendered from the key map
so the bindings and the manual cannot drift apart.

- [ ] **Step 1: Write the failing tests**

```go
func TestPausePanelIsCentredAndContainsSpecCopy(t *testing.T)
// 80x24 grid: contains "TEMPORAL SUSPENSION", "SPACE IS PAUSED", "p  resume";
// the panel's left edge is within 1 column of centre.

func TestGameOverPanelShowsFormattedStats(t *testing.T)
// Stats{Score: 483200, Lines: 127, Level: 13} -> contains "UNIVERSE EXPIRED",
// "483,200", "127", "13", "REBOOT UNIVERSE", "ACCEPT COSMIC DEATH".

func TestHelpPanelListsEveryBinding(t *testing.T)
// Contains "FLIGHT MANUAL" and the descriptions "move spacecraft",
// "accelerate doom", "rotate geometry", "YEET", "quantum storage",
// "suspend spacetime", "reboot universe", "abandon mission".

func TestPanelInTinyGridDoesNotPanicAndStaysInside(t *testing.T)
// 20x6 and 1x1 grids: no panic; every output line is at most g.W columns and
// there are at most g.H lines. Review Focus 3.

func TestPanelDoesNotWriteOutsideGridOnOddSizes(t *testing.T)
// 41x25 grid: line count and widths respected.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'Pause|GameOver|Help|Panel' -v`
Expected: FAIL — undefined: `DrawPause`.

- [ ] **Step 3: Implement**

`go get charm.land/bubbles/v2@v2.2.1` then write `overlay.go`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add go.mod go.sum internal/render/overlay.go internal/render/overlay_test.go
git commit -m "feat(render): pause, help, and game-over panels"
```

---

### Task 6: Responsive layout and the too-small notice

**Files:**
- Create: `internal/render/layout.go`
- Test: `internal/render/layout_test.go`

**Interfaces:**
- Consumes: the `Board*` constants and the draw functions from Tasks 3–5.
- Produces:
  ```go
  const (MinCols = 40; MinRows = 24)
  type Tier int
  const (TierTooSmall Tier = iota; TierSmall; TierMedium; TierWide)
  type Layout struct {
      Tier        Tier
      W, H        int
      BoardX, BoardY int   // outer top-left of the board box
      HoldX, HoldY   int   // -1 when hidden
      NextX, NextY   int
      NextCount      int   // 5 wide/medium, 3 small
      StatsX, StatsY int
      ShowTitle      bool
      ShowMission    bool
      MissionY       int
      ShowLabels     bool
      ControlsY      int
      ControlsW      int
  }
  func Compute(w, h int) Layout
  func DrawTooSmall(g *Grid, w, h int, p Palette)
  ```

Tiers, from §31 and §49.3:

```
TierWide    w >= 64 and h >= 26   HOLD | BOARD | NEXT, stats left column, title, mission
TierMedium  w >= 48 and h >= 24   BOARD | compact HUD right (next 5 + stats), mission if h >= 25
TierSmall   w >= 40 and h >= 24   BOARD | NEXT(3) + bare stat values beside it
TierTooSmall otherwise
```

The board box is 22×22, so at `h == 24` only two rows remain. Drop order as height
runs out, applied in this order (§49.3): `ShowTitle` off first, then `ShowMission`,
then `ShowLabels`. `ControlsY` and the board are never dropped. `Compute` centres
the whole assembly horizontally and clamps every coordinate to `>= 0`.

The notice text is §31's, with real numbers:

```
THIS UNIVERSE IS TOO SMALL

resize terminal to continue

current: 34 × 19
needed: approximately 40 × 24
```

- [ ] **Step 1: Write the failing tests**

```go
func TestTierBoundaries(t *testing.T)
// Table: (39,24)->TooSmall (40,24)->Small (47,24)->Small (48,24)->Medium
// (63,26)->Medium (64,26)->Wide (64,25)->Medium (100,40)->Wide.

func TestWideLayoutPlacesHoldLeftAndNextRight(t *testing.T)
// 100x40: HoldX < BoardX, NextX > BoardX + BoardOuterW - 1, NextCount == 5,
// ShowTitle and ShowMission true, ShowLabels true.

func TestSmallLayoutTruncatesNextToThree(t *testing.T)
// 40x24: NextCount == 3, ShowTitle false, ShowMission false, ShowLabels false,
// HoldX == -1, and NextY is within the board's vertical span (never above or
// below the board). (§49.3)

func TestDropOrderAsHeightShrinks(t *testing.T)
// 80x28 -> title+mission+labels; 80x26 -> no title; 80x25 -> no title, no
// mission; 80x24 -> also no labels.

func TestEverythingFitsInsideTheTerminal(t *testing.T)
// For every (w,h) in 40..120 x 24..50: BoardX+BoardOuterW <= w,
// BoardY+BoardOuterH <= h, ControlsY < h, all coordinates >= 0.

func TestBoardIsHorizontallyCentredWithinTwoColumns(t *testing.T)
// For each tier, the drawn assembly's left and right margins differ by at most 2.

func TestComputeAtZeroAndOneReturnsTooSmall(t *testing.T)
// (0,0) and (1,1): TierTooSmall, no panic, coordinates non-negative.
// Review Focus 1.

func TestTooSmallNoticeFitsTinyTerminals(t *testing.T)
// DrawTooSmall into 34x19, 20x5, and 1x1 grids: no panic, every line <= g.W,
// line count <= g.H, and at 34x19 the output contains "34 × 19" and "40 × 24".
// Review Focus 2.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'Tier|Layout|Drop|Centred|TooSmall|Compute' -v`
Expected: FAIL — undefined: `Compute`.

- [ ] **Step 3: Implement**

`layout.go` per the interfaces.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/layout.go internal/render/layout_test.go
git commit -m "feat(render): responsive layout tiers and too-small notice"
```

---

### Task 7: Bubble Tea model, keys, and the frame clock

**Files:**
- Create: `internal/app/model.go`, `internal/app/update.go`, `internal/app/keys.go`, `internal/app/messages.go`
- Test: `internal/app/update_test.go`, `internal/app/keys_test.go`

**Interfaces:**
- Consumes: `game.*` (Plan 01), `render.Compute`, `render.Mode`.
- Produces:
  ```go
  type AppState int
  const (StatePlaying AppState = iota; StatePaused; StateHelp; StateOver)

  type Options struct {
      Seed          int64
      ASCII         bool
      NoFX          bool
      ReducedMotion bool
  }

  type FrameMsg struct{ Now time.Time }
  func frameCmd() tea.Cmd    // tea.Tick(16ms, ...) -> FrameMsg

  type Model struct {
      Game   *game.Game
      Opts   Options
      Width  int
      Height int
      State  AppState
      LastFrame time.Time
      Keys      KeyMap
      Help      help.Model
      Palette   render.Palette
      Grid      *render.Grid
  }
  func New(opts Options) *Model
  func (m *Model) Init() tea.Cmd
  func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd)
  func (m *Model) View() tea.View
  func (m *Model) inputFor(k tea.KeyPressMsg) game.Input

  type KeyMap struct {
      Left, Right, SoftDrop, RotateCW, RotateCCW, HardDrop,
      Hold, Pause, Restart, Help, Quit key.Binding
  }
  func DefaultKeyMap() KeyMap
  func (k KeyMap) ShortHelp() []key.Binding
  func (k KeyMap) FullHelp() [][]key.Binding
  ```

Bindings (§8, WASD aliases included):

```
Left      left, h, a          Right     right, l, d
SoftDrop  down, j, s          RotateCW  up, k, x, w
RotateCCW z                   HardDrop  space
Hold      c                   Pause     p
Restart   r                   Help      ?
Quit      q, esc, ctrl+c
```

Held-key repeat (§8) comes from the terminal's own auto-repeat: each repeat is
another `KeyPressMsg` and each is applied immediately, so there is no DAS timer to
write and no path by which input waits for a tick (§36, §44).

Clock: exactly one `tea.Tick(16 * time.Millisecond)` loop producing `FrameMsg`
(≈60 Hz, §36). On each `FrameMsg`: `dt := msg.Now.Sub(m.LastFrame)`, clamp to
`[0, 250ms]`, store `LastFrame`, and in `StatePlaying` call `m.Game.Advance(dt)`.
There is no separate `GravityMsg` — §36 offers one but also asks for a single
animation clock with accumulated elapsed time, and the engine's `Advance(dt)`
already is the gravity clock. §36's `GameEventMsg` is likewise unnecessary:
`Apply` and `Advance` return their events synchronously, so Plan 03 hands them to
the FX world inside the same `Update` call. Posting them back through the message
queue would only delay every effect by one frame. The returned events go nowhere
until Plan 03.

State transitions: `p` toggles Playing↔Paused (ignored in Over); `?` toggles
Help↔Playing and also resumes from Paused into Help and back; `r` rebuilds the
game from `Opts.Seed` and sets Playing from *any* state; `q`/esc/ctrl+c returns
`tea.Quit`. In Paused, Help, and Over the model still handles `FrameMsg` (so Plan
03's stars keep drifting) but does not call `Advance`. When `m.Game.Over` becomes
true, `State` becomes `StateOver`.

`tea.ColorProfileMsg` sets `m.Palette` via `render.ModeForProfile(msg.Profile, m.Opts.ASCII)`.

- [ ] **Step 1: Write the failing tests**

Tests drive `Update` directly with synthetic messages — no terminal needed.

```go
func TestKeyMapCoversSpecBindings(t *testing.T)
// Table of every key string in §8 plus the WASD aliases -> expected game.Input.

func TestUnboundKeyProducesNoInput(t *testing.T)
// "Q", "1", "f" -> game.InputNone and no state change.

func TestFrameAdvancesGameByElapsedTime(t *testing.T)
// Two FrameMsgs 800ms apart: the active piece dropped exactly one row.

func TestFrameClampsAbsurdDelta(t *testing.T)
// A FrameMsg 30s after the last: dt is clamped to 250ms, so the piece drops at
// most a few rows and nothing panics.

func TestFirstFrameDoesNotAdvance(t *testing.T)
// LastFrame is zero until the first FrameMsg; that frame advances nothing.

func TestMultipleKeysInOneFrameAllApply(t *testing.T)
// Three InputLeft key messages with no FrameMsg between them move the piece
// three columns; the gravity accumulator is untouched (piece Y unchanged).
// Review Focus 4.

func TestPauseStopsGravityButKeepsHandlingFrames(t *testing.T)
// Pause, then FrameMsgs spanning 5s: piece Y unchanged, Update still returns a
// frame command.

func TestKeysAreIgnoredWhilePaused(t *testing.T)
// Paused + InputLeft key: piece X unchanged. "p" resumes.

func TestHelpTogglesFromPlayingAndPaused(t *testing.T)
func TestRestartFromPlayingPausedAndOver(t *testing.T)
// From each state, "r" yields State == StatePlaying, Score == 0, Lines == 0,
// and the same Seed. Review Focus 5.

func TestGameOverEntersOverState(t *testing.T)
// Fill the board so the next lock blocks the spawn: State becomes StateOver and
// further FrameMsgs change nothing.

func TestQuitKeysReturnQuitCommand(t *testing.T)
// "q", "esc", "ctrl+c" each return a non-nil command whose message is tea.QuitMsg.

func TestWindowSizeIsStored(t *testing.T)
// WindowSizeMsg{100, 40} -> Width/Height set and the grid resized.

func TestZeroWindowSizeDoesNotPanic(t *testing.T)
// WindowSizeMsg{0, 0} then View(): non-panicking, returns a tea.View.
// Review Focus 1.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ -v`
Expected: build failure — package does not exist.

- [ ] **Step 3: Implement**

`go get charm.land/bubbletea/v2@v2.0.9`, then the four files. `View()` is a thin
wrapper that calls Task 8's `render.Frame` and sets `AltScreen = true`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/app/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add go.mod go.sum internal/app/ internal/render/
git commit -m "feat(app): bubble tea model, key map, single frame clock"
```

---

### Task 8: Frame assembly and golden snapshot tests

**Files:**
- Create: `internal/render/frame.go`, `internal/render/golden_test.go`, `internal/render/testdata/*.golden`
- Modify: `internal/app/model.go` (`View` calls `render.Frame`)

**Interfaces:**
- Consumes: everything in `internal/render` plus `app.AppState`.
- Produces:
  ```go
  type Frame struct {
      W, H    int
      State   int          // mirrors app.AppState; render does not import app
      Board   BoardView
      Hold    *game.PieceKind
      Next    []game.PieceKind
      Stats   Stats
      Mission string
      Palette Palette
      HelpModel help.Model
      HelpKeys  help.KeyMap
  }
  func Render(g *Grid, f Frame) string
  ```

`Render` walks §37's pipeline in order, skipping steps 2, 6, 9, and 10 (Plans
03–04 fill those in), and returns `g.String()`. Overlays draw last so pause, help,
and game over sit on top of a still-rendered board (§28: "do not instantly replace
the board").

`render` must not import `internal/app` — `State` is a plain int with constants
mirrored in `frame.go` and a compile-time assertion in `app` that the two agree.

The golden helper is 15 lines in the test file: strip ANSI, compare to
`testdata/<name>.golden`, rewrite the file when `-update` is passed.

- [ ] **Step 1: Write the failing tests**

```go
func TestGolden(t *testing.T)
// Subtests, each rendering a deterministic scene (seed 8675309, a fixed board
// built by hard-dropping a canned input list, Mission "NOMINALISH"):
//   wide      100x40 ModeFull   StatePlaying
//   medium     56x26 ModeFull   StatePlaying
//   small      40x24 ModeFull   StatePlaying
//   ascii      80x30 ModeASCII  StatePlaying
//   pause      80x30 ModeFull   StatePaused
//   help       80x30 ModeFull   StateHelp
//   gameover   80x30 ModeFull   StateOver
//   toosmall   34x19 ModeFull   StatePlaying
// Each compares ANSI-stripped output to testdata/<name>.golden.

func TestGoldenScenesHaveCorrectGeometry(t *testing.T)
// For every scene: line count <= H, every line width <= W (measured with
// lipgloss.Width on the stripped string), and in the playing scenes the board's
// 22 box lines are present and unbroken — i.e. exactly 20 interior rows each
// starting and ending with the border glyph. This is §41's "nothing overlaps /
// board dimensions stay correct / HUD doesn't corrupt board".

func TestASCIISceneIsPureASCII(t *testing.T)
// Every rune of the ascii scene's stripped output is < 128.

func TestResizeSweepNeverPanicsOrOverflows(t *testing.T)
// For w in 1..140 step 1 and h in 1..50 step 1 (playing state), Render returns
// without panic, line count <= h, and every line width <= w. §31's "never crash
// from terminal resizing", exhaustively.

func TestRenderDoesNotMutateGameState(t *testing.T)
// Fingerprint the game (Plan 01 Task 10), render every scene twice, fingerprint
// again: unchanged. §37.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run Golden -v`
Expected: FAIL — undefined: `Render`; no testdata.

- [ ] **Step 3: Implement**

Write `frame.go`, then generate the goldens with
`go test ./internal/render/ -run Golden -update` and **read every generated file
before committing it**. A golden file is only correct if it looks like the game;
eyeball the board box, the HUD columns, and the panel borders.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -count=1`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/frame.go internal/render/golden_test.go internal/render/testdata internal/app/model.go
git commit -m "feat(render): frame assembly with golden layout snapshots"
```

---

### Task 9: CLI entry point

**Files:**
- Create: `cmd/cosmic-tetris/main.go`, `internal/app/options.go`
- Test: `internal/app/options_test.go`

**Interfaces:**
- Consumes: `app.New`, `app.Options`.
- Produces:
  ```go
  func ParseFlags(args []string) (Options, string, error)
  // returns (opts, usage-if-help-requested, error). Unknown flag -> error.
  ```

`main.go`: parse, print usage and exit 0 on `--help`, print the error and usage to
stderr and exit 2 on a bad flag, otherwise seed from `time.Now().UnixNano()` when
`--seed` is absent, detect the color profile with
`colorprofile.Detect(os.Stdout, os.Environ())`, build the model, and run
`tea.NewProgram(m, tea.WithFPS(60))`.

`--seed` is the only flag with a value. `--no-fx` and `--reduced-motion` are stored
in `Options` and consumed by Plans 03–04; wiring them now means the CLI surface is
final and the later plans add behaviour, not flags.

- [ ] **Step 1: Write the failing tests**

```go
func TestBareInvocationUsesDefaults(t *testing.T)
// No flags: ASCII/NoFX/ReducedMotion all false, Seed == 0 (main fills it in).

func TestEachFlagParses(t *testing.T)
// "--seed 1234" -> Seed 1234; "--ascii"; "--no-fx"; "--reduced-motion".

func TestFlagsCombine(t *testing.T)
// "--ascii --no-fx --seed 7" sets all three.

func TestHelpReturnsUsageAndNoError(t *testing.T)
// "--help": usage string mentions exactly the five documented flags and nothing
// else. Guards §49.5's "nothing else is necessary".

func TestUnknownFlagIsAnError(t *testing.T)
// "--turbo" and "-x" return an error.

func TestNonNumericSeedIsAnError(t *testing.T)
// "--seed banana" returns an error.

func TestNegativeSeedIsAccepted(t *testing.T)
// "--seed -1" -> Seed == -1 (int64, and the PCG construction must not care).
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ -run 'Flag|Help|Seed|Bare' -v`
Expected: FAIL — undefined: `ParseFlags`.

- [ ] **Step 3: Implement**

`options.go` with a `flag.FlagSet` (`ContinueOnError`, output to an
`io.Discard`-backed buffer so tests stay quiet) and `main.go` per above.

- [ ] **Step 4: Run tests, then play it**

Run: `go test ./... -count=1` — expect PASS.
Run: `go build ./... && ./cosmic-tetris --seed 8675309`
Play for a minute. Check by hand: keys respond instantly, gravity accelerates as
levels rise, hold works, ghost tracks the piece, `p`/`?`/`r`/`q` behave, and
resizing the terminal (including down past 40×24 and back) never breaks the frame.

- [ ] **Step 5: Commit**

```bash
git add cmd/cosmic-tetris/main.go internal/app/options.go internal/app/options_test.go
git commit -m "feat(cli): cosmic-tetris entry point with the final flag surface"
```

---

## Done when

`cosmic-tetris` is a complete, resizable, keyboard-immediate Tetris with hold,
ghost, a five-piece queue, pause, restart, help, ASCII mode, golden-tested layout
at four sizes plus three overlays, and no effects at all. §42 Phase 2's bar —
"at this point it should already be a genuinely good game" — is the acceptance
criterion, and it is judged by playing it, not only by the suite.
