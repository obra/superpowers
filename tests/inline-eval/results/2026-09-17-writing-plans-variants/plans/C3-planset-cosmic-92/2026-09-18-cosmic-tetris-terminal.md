# Cosmic Tetris — Playable Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the headless engine into a genuinely good playable terminal game — Bubble Tea app loop, board and HUD rendering, ghost piece, next queue, hold, adaptive layout, pause/help/game-over overlays, resize handling, and the full CLI — with ANSI-stripped golden tests as the binding layout contract.

**Architecture:** Three new packages. `internal/render` is pure: `Frame(Input) string` composes styled panel strings onto a `lipgloss.Canvas` and never touches game state. `internal/app` is the Bubble Tea model: it owns the single animation clock, converts key presses straight into engine calls, and hands `render` an `Input`. `cmd/cosmic-tetris` parses flags and starts the program. Dependency direction is strictly `app → render → game`.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2` v2.0.9, `charm.land/lipgloss/v2` v2.0.6, `charm.land/bubbles/v2` v2.2.1, `github.com/charmbracelet/x/ansi` (ANSI stripping in tests), `github.com/charmbracelet/colorprofile` (capability detection).

**Spec:** `design.md` (§4, §8, §10, §26, §27 line only, §28 final card, §29 skip path, §30, §31, §32, §33, §34, §36, §37, §39, §41, §42 Phase 2, §44, §46, §49.3, §49.4, §49.5, §49.7)

## Global Constraints

- Module path `cosmic-tetris`; imports are `cosmic-tetris/internal/...`.
- Exact dependency versions: `charm.land/bubbletea/v2 v2.0.9`, `charm.land/lipgloss/v2 v2.0.6`, `charm.land/bubbles/v2 v2.2.1`. No other direct dependencies.
- Bubble Tea **v2** API — this differs from v1 and is a common source of wrong code:
  - `Init() tea.Cmd` (no model returned)
  - `Update(tea.Msg) (tea.Model, tea.Cmd)`
  - `View() tea.View`, built with `tea.NewView(s)`
  - **Alt screen is a `View` field**, not a program option: set `v.AltScreen = true` in `View()`. There is no `tea.WithAltScreen`.
  - Key presses arrive as `tea.KeyPressMsg`; `msg.String()` yields `"space"`, `"esc"`, `"left"`, `"?"` and so on. Match with `key.Matches(msg, binding)`.
- Lip Gloss **v2** takes `color.Color` (from `image/color`), not strings: `lipgloss.Color("#22E4F7")` returns a `color.Color`.
- `internal/render` must not import `internal/app`, and neither `render` nor `app` may mutate anything under `internal/game` except by calling the engine's own documented mutating methods from `app`.
- One animation clock only (§36): a single `tea.Tick` producing `FrameMsg`. No separate gravity timer.
- Glyphs are pinned by §49.4: block `██` (`[]` in ASCII), ghost `░░` (`··` in ASCII). Pieces use a bright foreground on filled glyphs, never a foreground/background pair. Active piece renders one step brighter than locked cells.
- Minimum usable terminal is 40 × 24 (§31). Below that, only the too-small notice renders.
- The §4 mockup is mood, not geometry (§49.7). The golden files in `internal/render/testdata/` are the layout contract.
- Test command for this plan: `go test ./...`.

## Review Focus

1. A resize to 0 or 1 columns/rows mid-game must show the too-small notice and must never build a zero- or negative-sized canvas — Task 2 and Task 5.
2. A `FrameMsg` whose `dt` spans a suspend/resume or a laptop sleep must be clamped, not replayed as a multi-second gravity burst — Task 7.
3. `--seed` with a non-numeric, negative, or int64-overflowing value must exit with a clear message and status 2, not panic and not silently become 0 — Task 8.
4. Score, lines, or level exceeding their HUD field widths must leave every panel's width unchanged so the board does not shift — Task 4.
5. Output piped to a file, `NO_COLOR=1`, or `TERM=dumb` must produce readable output with no truecolor escapes and no crash — Task 1.

## Plan Set

Run in this order. A ruling that changes a name, signature, or value that a later plan consumes must be applied to that plan's document before the next task starts.

1. `plans/2026-09-18-cosmic-tetris-engine.md` — headless deterministic game engine. Consumes: nothing.
2. `plans/2026-09-18-cosmic-tetris-terminal.md` (this plan) — Bubble Tea app, renderer, layout, HUD, overlays, CLI. Consumes: the entire `internal/game` public API, especially `Advance`, `Event`, `Snapshot`, `GhostY`, `Board`, `Piece`.
3. `plans/2026-09-18-cosmic-tetris-effects.md` — starfield, particles, trails, shake, supernova, hyperdrive, boot, black hole, mission control. Consumes: `render.Input`, `render.Theme`, `render.Layout`, `render.Frame`, `app.Model`, `app.FrameMsg`, `app.Options` from this plan.

---

### Task 1: Rendering modes, glyph sets, palette

**Files:**
- Create: `internal/render/palette.go`
- Modify: `go.mod` (add the three charm dependencies)
- Test: `internal/render/palette_test.go`

**Interfaces:**
- Consumes: `game.PieceKind`, `game.KindCount`.
- Produces:
  ```go
  type Mode uint8

  const (
      ModeFull Mode = iota // Unicode + truecolor
      ModeReduced          // Unicode + 256 color
      ModeASCII            // ASCII glyphs, 8 colors
  )

  func ModeFor(p colorprofile.Profile, forceASCII bool) Mode

  type Glyphs struct {
      Block  string          // "██" full/reduced, "[]" ASCII
      Ghost  string          // "░░" full/reduced, "··" ASCII
      Empty  string          // "  " in every mode
      Board  lipgloss.Border // DoubleBorder() full/reduced, ASCIIBorder() ASCII
      Panel  lipgloss.Border // RoundedBorder() full/reduced, ASCIIBorder() ASCII
  }

  func GlyphsFor(m Mode) Glyphs

  type PieceColors struct{ Active, Locked color.Color }

  type Theme struct {
      Mode   Mode
      Glyphs Glyphs
      Piece  [game.KindCount]PieceColors
      Border []color.Color // gradient stops for the board border (§25)
      Ghost  color.Color
      Text   color.Color
      Dim    color.Color
      Accent color.Color
      Alert  color.Color
  }

  func NewTheme(m Mode) Theme
  ```

Pinned palette (§26, §25) — full and reduced modes both use these hex values and let `colorprofile` downsample:

```go
// piece colours: bright active, dimmer locked
KindI: {Active: "#22E4F7", Locked: "#1499A8"} // plasma cyan
KindJ: {Active: "#3A6BFF", Locked: "#2447A8"} // deep electric blue
KindL: {Active: "#FF8A2B", Locked: "#B85C14"} // solar orange
KindO: {Active: "#FFD24A", Locked: "#B8932B"} // stellar gold
KindS: {Active: "#4CE66B", Locked: "#2E9945"} // alien green
KindT: {Active: "#B45CFF", Locked: "#7A33B8"} // ultraviolet
KindZ: {Active: "#FF3C6E", Locked: "#B32048"} // supernova pink

Ghost:  "#4A4A6A"
Text:   "#E2E8F0"
Dim:    "#5A6478"
Accent: "#22D3EE"
Alert:  "#FF3C6E"

Border stops (§25, in cycle order):
  "#5B21B6" deep violet
  "#22D3EE" electric cyan
  "#E935C1" magenta
  "#3B82F6" stellar blue
  "#F8FAFC" hot white
```

In `ModeASCII`, every colour above is replaced by a basic ANSI colour so nothing depends on 256-colour or truecolor support: pieces cycle `lipgloss.Cyan, Blue, Yellow, BrightYellow, Green, Magenta, Red` for `KindI..KindZ` with `Locked` equal to `Active`, `Ghost` is `lipgloss.BrightBlack`, `Text` is `lipgloss.White`, `Dim` is `lipgloss.BrightBlack`, `Accent` is `lipgloss.BrightCyan`, `Alert` is `lipgloss.BrightRed`, and `Border` is the single stop `lipgloss.BrightBlack`.

- [ ] **Step 1: Add the dependencies**

```bash
go get charm.land/bubbletea/v2@v2.0.9 charm.land/lipgloss/v2@v2.0.6 charm.land/bubbles/v2@v2.2.1
go mod tidy
```

- [ ] **Step 2: Write the failing tests**

```go
func TestModeForMapsProfiles(t *testing.T) {
	// TrueColor -> ModeFull
	// ANSI256   -> ModeReduced
	// ANSI      -> ModeASCII
	// Ascii     -> ModeASCII
	// NoTTY     -> ModeASCII
	// Unknown   -> ModeASCII
}

func TestForceASCIIOverridesEveryProfile(t *testing.T) {
	// ModeFor(colorprofile.TrueColor, true) == ModeASCII
}

func TestGlyphsAreTwoColumnsWide(t *testing.T) {
	// Review Focus #5 partly: for each mode, lipgloss.Width of Block, Ghost and
	// Empty is exactly 2
}

func TestASCIIGlyphsUseOnlyASCII(t *testing.T) {
	// Review Focus #5: in ModeASCII, Block == "[]", Ghost == "··" is NOT used —
	// assert Ghost == "··"? No: §49.4 pins ASCII ghost as "··", which is non-ASCII.
	// Assert Block == "[]" and Ghost == "··", and that every rune in Block is < 128.
}

func TestASCIIThemeUsesOnlyBasicColors(t *testing.T) {
	// Review Focus #5: in ModeASCII every colour in the theme (piece Active and
	// Locked, Ghost, Text, Dim, Accent, Alert, Border) type-asserts to
	// ansi.BasicColor, so nothing can emit a truecolor escape
}

func TestPieceColorsAreDistinctPerKind(t *testing.T) {
	// in ModeFull, the seven Active colours are seven distinct values
}

func TestActiveIsBrighterThanLocked(t *testing.T) {
	// §49.4: in ModeFull, for each kind the Active colour's luminance exceeds
	// the Locked colour's (convert with colorful.MakeColor and compare .Luminance())
}

func TestBorderStopsMatchTheSpecPalette(t *testing.T) {
	// ModeFull Border has exactly 5 stops in the §25 order
}
```

Note on `TestASCIIGlyphsUseOnlyASCII`: §49.4 pins the ASCII ghost as `··` (U+00B7), which is not strictly ASCII. Keep the spec's glyph — assert `Block == "[]"`, `Ghost == "··"`, and that the ASCII border sets come from `lipgloss.ASCIIBorder()`. The mode's real promise is "no special Unicode assumptions" (§32), and `·` is Latin-1 and near-universal; record that reading in a comment.

- [ ] **Step 3: Run tests to verify they fail**

Run: `go test ./internal/render/ -v`
Expected: FAIL — undefined `ModeFor`, `Theme`.

- [ ] **Step 4: Implement `internal/render/palette.go`**

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add go.mod go.sum internal/render/
git commit -m "feat: rendering modes, glyph sets and the neon space palette"
```

---

### Task 2: Adaptive layout

**Files:**
- Create: `internal/render/layout.go`
- Test: `internal/render/layout_test.go`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  ```go
  type Size uint8

  const (
      SizeTooSmall Size = iota
      SizeSmall
      SizeMedium
      SizeLarge
  )

  const (
      MinWidth    = 40
      MinHeight   = 24
      BoardCols   = 22 // 10 cells * 2 columns + 2 border columns
      BoardRows   = 22 // 20 visible rows + 2 border rows
      SidePanelW  = 12
  )

  type Layout struct {
      Size                   Size
      TermWidth, TermHeight  int
      ShowFrame              bool // outer rounded frame + title line (§4)
      ShowMission            bool
      ShowStatLabels         bool
      ShowHold               bool
      NextCount              int
      BoardX, BoardY         int // top-left of the board panel's border corner
      LeftX, LeftY           int // HOLD + stats column; valid when ShowHold
      RightX, RightY         int // NEXT column (plus stats when !ShowHold)
      RightW                 int
      MissionY               int // -1 when !ShowMission
      ControlsY              int
  }

  func Compute(width, height int) Layout
  ```

Pinned thresholds and geometry — these, not the §4 mockup, decide the frame:

```text
SizeTooSmall  width < 40 || height < 24
SizeLarge     width >= 56 && height >= 27
SizeMedium    width >= 46 && height >= 25
SizeSmall     everything else at or above the minimum

Large:   ShowFrame true,  ShowMission true,  ShowStatLabels true,  ShowHold true,  NextCount 5
         content block is 50 wide (12 + 2 + 22 + 2 + 12)
         contentX = 1 + (width-2-50)/2
         LeftX = contentX,  BoardX = contentX+14,  RightX = contentX+38,  RightW = 12
         BoardY = 1,  LeftY = 2,  RightY = 2,  MissionY = height-3,  ControlsY = height-2

Medium:  ShowFrame false, ShowMission true,  ShowStatLabels true,  ShowHold true,  NextCount 5
         BoardX = 0,  BoardY = 0
         RightX = 23, RightY = 0, RightW = min(width-23, 20)
         LeftX/LeftY unused (HOLD stacks into the right column)
         MissionY = height-2,  ControlsY = height-1

Small:   ShowFrame false, ShowMission false, ShowStatLabels false, ShowHold false, NextCount 3
         BoardX = 0,  BoardY = 0
         RightX = 23, RightY = 0, RightW = min(width-23, 14)
         MissionY = -1,  ControlsY = height-1

TooSmall: every geometry field is 0 and MissionY is -1.
```

Drop order matches §49.3 exactly — title frame goes first, then mission control, then stat labels. HOLD is dropped at `SizeSmall` because §31's small-terminal priority list is board, next, score, controls, and HOLD is not on it. NEXT never stacks above or below the board in any size.

- [ ] **Step 1: Write the failing tests**

```go
func TestComputeTooSmallBelowMinimum(t *testing.T) {
	// 39x24, 40x23, 0x0, 1x1, 34x19 all give SizeTooSmall
	// and MissionY == -1
}

func TestComputeNeverReturnsNegativeGeometry(t *testing.T) {
	// Review Focus #1: for every width 0..80 and height 0..40,
	// no field of Compute(w,h) is negative except MissionY, which is only ever -1
}

func TestComputeSmallAtExactMinimum(t *testing.T) {
	// Compute(40, 24): SizeSmall, ShowFrame false, ShowMission false,
	// ShowStatLabels false, ShowHold false, NextCount 3,
	// BoardX 0, BoardY 0, RightX 23, RightW 14, MissionY -1, ControlsY 23
}

func TestComputeMediumThresholds(t *testing.T) {
	// Compute(46, 25): SizeMedium, ShowStatLabels true, ShowHold true, NextCount 5,
	// ShowFrame false, MissionY 23, ControlsY 24
	// Compute(45, 25) and Compute(46, 24) are not SizeMedium
}

func TestComputeLargeThresholds(t *testing.T) {
	// Compute(56, 27): SizeLarge, ShowFrame true, MissionY 24, ControlsY 25
	// Compute(55, 27) is SizeMedium; Compute(56, 26) is SizeMedium
}

func TestBoardFitsInsideTheTerminal(t *testing.T) {
	// for every size at or above the minimum:
	// BoardX + BoardCols <= TermWidth and BoardY + BoardRows <= TermHeight
}

func TestSidePanelsDoNotOverlapTheBoard(t *testing.T) {
	// for every size at or above the minimum:
	// when ShowHold, LeftX + SidePanelW <= BoardX
	// RightX >= BoardX + BoardCols and RightX + RightW <= TermWidth
}

func TestMissionAndControlsRowsDoNotOverlapTheBoard(t *testing.T) {
	// ControlsY >= BoardY + BoardRows and ControlsY < TermHeight
	// when ShowMission: BoardY+BoardRows <= MissionY < ControlsY
}

func TestLargeContentBlockIsCentered(t *testing.T) {
	// Compute(80, 30): BoardX is within 1 of (80-22)/2
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run TestCompute -v`
Expected: FAIL — undefined `Compute`.

- [ ] **Step 3: Implement `Compute` in `internal/render/layout.go`**

The invariant tests above are the real specification; the pinned table is the values that satisfy them. If a threshold needs nudging to satisfy `TestSidePanelsDoNotOverlapTheBoard` or `TestMissionAndControlsRowsDoNotOverlapTheBoard`, adjust the constant and record the new value in this plan and in `plans/2026-09-18-cosmic-tetris-effects.md` if it consumes it.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/
git commit -m "feat: adaptive layout with pinned size thresholds and drop order"
```

---

### Task 3: Board panel with ghost and active piece

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: `Theme`, `Glyphs` (Task 1); `game.Board`, `game.Piece`, `game.Game`, `game.GhostY`.
- Produces:
  ```go
  // BoardPanel renders the 20 visible rows with border, locked cells, ghost and
  // active piece. borderColor lets later plans drive the §25 gradient; pass
  // th.Border[0] for a static border.
  func BoardPanel(g *game.Game, th Theme, borderColor color.Color) string
  ```

Draw order inside the panel follows §37 steps 3–5: locked cells, then ghost, then active piece. Ghost cells are written only where the cell is empty, so ghost can never obscure a locked block (§10). The active piece is written last and uses `PieceColors.Active`; locked cells use `PieceColors.Locked`.

- [ ] **Step 1: Write the failing tests**

Use `ansi.Strip` on the panel before asserting on geometry.

```go
func TestBoardPanelDimensions(t *testing.T) {
	// for each mode: the stripped panel is exactly BoardRows lines,
	// each exactly BoardCols columns wide (lipgloss.Width)
}

func TestBoardPanelShowsOnlyVisibleRows(t *testing.T) {
	// fill board row 1 (hidden) and row 2 (first visible) with different kinds;
	// the stripped panel's first interior line shows the row-2 content and never
	// the row-1 content
}

func TestGhostAppearsBelowTheActivePiece(t *testing.T) {
	// fresh game, ModeFull: the stripped panel contains "░░" and the ghost's
	// interior row index equals g.GhostY() - game.HiddenRows offset by 1 for the border
}

func TestGhostDoesNotOverwriteLockedCells(t *testing.T) {
	// place locked cells directly under the active piece so the ghost lands on them;
	// every stripped cell that is locked still shows the block glyph, not "░░"
}

func TestGhostIsSuppressedWhenItCoincidesWithTheActivePiece(t *testing.T) {
	// with the active piece already resting, the panel contains no "░░"
}

func TestASCIIModeUsesBracketsAndMiddots(t *testing.T) {
	// ModeASCII panel contains "[]" and "··" and contains neither "██" nor "░░"
}

func TestActiveAndLockedUseDifferentStyles(t *testing.T) {
	// the *unstripped* panel contains both the Active and the Locked hex for the
	// active piece's kind after a piece has been locked below the active one
}

func TestEmptyBoardPanelHasNoBlockGlyphsInsideTheBorder(t *testing.T) {
	// with State forced past spawn (no active piece drawn), interior is blank —
	// or, simpler: assert the number of "██" occurrences equals 4 (the active
	// piece) plus 4 ghost cells rendered as "░░" on a fresh game
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestBoardPanel|TestGhost|TestASCIIMode|TestActiveAndLocked|TestEmptyBoard' -v`
Expected: FAIL — undefined `BoardPanel`.

- [ ] **Step 3: Implement `BoardPanel` in `internal/render/board.go`**

Build the interior as a `[game.VisibleRows][game.Width]` array of `(glyph, color)` pairs, then style each run and wrap with `lipgloss.NewStyle().Border(th.Glyphs.Board).BorderForeground(borderColor)`. Styling per run rather than per cell keeps the escape-sequence count down (§38).

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/
git commit -m "feat: board panel with ghost piece and brighter active piece"
```

---

### Task 4: HUD panels

**Files:**
- Create: `internal/render/hud.go`
- Test: `internal/render/hud_test.go`

**Interfaces:**
- Consumes: `Theme`, `Layout` (Tasks 1–2); `game.PieceKind`, `game.Snapshot`.
- Produces:
  ```go
  func HoldPanel(hold *game.PieceKind, width int, th Theme, labeled bool) string
  func NextPanel(next []game.PieceKind, count, width int, th Theme, labeled bool) string
  func StatsPanel(s game.Snapshot, width int, th Theme, labeled bool) string
  func ControlsLine(width int, th Theme) string
  func MissionLine(msg string, width int, th Theme) string
  func TitleLine(universe string, level, width int, th Theme) string

  func FormatScore(n int) string // "%08d" below 1e8, plain decimal above, never longer than 11 runes
  func FormatLines(n int) string // "%03d", never longer than 6 runes
  func FormatLevel(n int) string // "%02d", never longer than 4 runes
  ```

Every panel is rendered through `lipgloss.NewStyle().Width(width).MaxWidth(width)` so no value can widen it (Review Focus #4). Panel heights are fixed: `HoldPanel` is 4 lines (label + 2 piece rows + blank), `NextPanel` is `1 + 3*count` lines, `StatsPanel` is 6 lines when `labeled` and 3 when not (§49.3: values stay, labels go).

`ControlsLine` copy (§4), truncated by width:
- full: `←→ move   ↑ rotate   ↓ descend   SPACE YEET   C hold   ? help`
- short (when full does not fit): `←→ ↑ ↓  SPACE YEET  C hold  ? help`
- ASCII mode replaces the arrows with `<>`, `^`, `v`.

`TitleLine` copy (§4): `✦ COSMIC TETRIS` on the left, `LOCAL UNIVERSE <universe>` on the right, `✦ VELOCITY: NN` for the level. ASCII mode drops `✦`.

`MissionLine` copy (§27): `☄ MISSION CONTROL: ` followed by `msg`, truncated with an ellipsis when it does not fit. ASCII mode uses `> MISSION CONTROL: `.

- [ ] **Step 1: Write the failing tests**

```go
func TestPanelWidthsAreFixedRegardlessOfContent(t *testing.T) {
	// Review Focus #4
	// for width 12 and each of StatsPanel with Snapshot{Score: 0},
	// Snapshot{Score: math.MaxInt, Lines: math.MaxInt, Level: math.MaxInt}:
	// every stripped line has lipgloss.Width exactly 12
}

func TestFormatterLengthCaps(t *testing.T) {
	// FormatScore: 0 -> "00000000"; 129340 -> "00129340";
	// len([]rune(FormatScore(n))) <= 11 for n in {0, 99999999, 100000000, math.MaxInt}
	// FormatLines(42) == "042"; FormatLevel(7) == "07"
	// length caps hold for math.MaxInt for all three
}

func TestStatsPanelDropsLabelsWhenUnlabeled(t *testing.T) {
	// labeled=true output contains "SCORE", "LINES", "LEVEL"
	// labeled=false output contains none of them but still contains "042"
	// labeled=false is 3 lines; labeled=true is 6 lines
}

func TestNextPanelHeightIsFixedForAnyQueueLength(t *testing.T) {
	// NextPanel with 5 kinds and count 3 is 1+3*3 lines
	// NextPanel with 2 kinds and count 5 is still 1+3*5 lines (missing slots blank)
	// NextPanel with nil and count 3 does not panic
}

func TestHoldPanelShowsEmptyStateWithoutPanicking(t *testing.T) {
	// HoldPanel(nil, 12, th, true) is 4 lines, width 12, contains "HOLD",
	// and contains no block glyph
}

func TestControlsLineFitsItsWidth(t *testing.T) {
	// for width in {20, 30, 40, 56, 80}: lipgloss.Width(ansi.Strip(...)) <= width
	// at width 80 it contains "YEET"; at width 20 it still contains "? help"
}

func TestControlsLineIsASCIIInASCIIMode(t *testing.T) {
	// ModeASCII output contains "<>" and "^" and no "←"
}

func TestMissionLineTruncatesLongMessages(t *testing.T) {
	// a 200-character message at width 40 yields width exactly 40
	// an empty message yields a line of width 40 with no "MISSION CONTROL" text
}

func TestTitleLineShowsUniverseAndVelocity(t *testing.T) {
	// TitleLine("7F3A", 3, 64, th) contains "COSMIC TETRIS", "7F3A" and "03"
	// and has width exactly 64
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestPanel|TestFormatter|TestStats|TestNext|TestHold|TestControls|TestMission|TestTitle' -v`
Expected: FAIL

- [ ] **Step 3: Implement `internal/render/hud.go`**

Piece previews inside `HoldPanel` and `NextPanel` draw `Spawn(kind).Cells()` normalised to the top-left of its own bounding box, so previews sit flush rather than floating at the spawn offset.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/
git commit -m "feat: HUD panels with width-clamped stat fields"
```

---

### Task 5: Frame assembly and layout golden tests

**Files:**
- Create: `internal/render/render.go`
- Create: `internal/render/testdata/{wide,medium,small,toosmall,ascii}.golden`
- Test: `internal/render/render_test.go`, `internal/render/golden_test.go`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces:
  ```go
  type Overlay uint8

  const (
      OverlayNone Overlay = iota
      OverlayBoot
      OverlayPaused
      OverlayHelp
      OverlayGameOver
      OverlayTooSmall
  )

  type Input struct {
      Game     *game.Game
      Layout   Layout
      Theme    Theme
      Overlay  Overlay
      HelpBody string        // pre-rendered by bubbles/help in the app layer
      Mission  string
      Universe string        // e.g. "7F3A"
      Elapsed  time.Duration // wall time since start, for border cycling
  }

  func Frame(in Input) string
  ```

`Frame` follows §37: build a `lipgloss.Canvas` of `max(Layout.TermWidth,1) × max(Layout.TermHeight,1)`, compose the board panel, then HOLD/NEXT/stats, then the title, mission and controls lines, then the overlay last. `Layout.Size == SizeTooSmall` skips everything but the notice. `Frame` never reads or writes `Game` other than through the engine's accessors, and it must not call `time.Now()`.

- [ ] **Step 1: Write the failing tests**

`golden_test.go` holds a `-update` flag and a `fixture()` helper that builds a deterministic `Input`: `game.New(8675309)`, then a fixed script of engine calls (three hard drops and two rotations) so a partial stack exists, `Elapsed` of `2500ms`, `Mission` of `"NOMINALISH"`, `Universe` of `"7F3A"`.

```go
func TestFrameGoldens(t *testing.T) {
	// table: {"wide", 80, 30, ModeFull, OverlayNone}
	//        {"medium", 50, 26, ModeFull, OverlayNone}
	//        {"small", 40, 24, ModeFull, OverlayNone}
	//        {"toosmall", 34, 19, ModeFull, OverlayTooSmall}
	//        {"ascii", 80, 30, ModeASCII, OverlayNone}
	// compare ansi.Strip(Frame(in)) against testdata/<name>.golden, -update rewrites
}

func TestFrameFillsExactlyTheTerminal(t *testing.T) {
	// for every golden case: the stripped frame has exactly TermHeight lines
	// and no line exceeds TermWidth columns
}

func TestBoardRowsSurviveHUDComposition(t *testing.T) {
	// for the wide and medium cases: the BoardRows lines starting at BoardY,
	// sliced to columns BoardX..BoardX+BoardCols, equal ansi.Strip(BoardPanel(...))
	// This is §41's "HUD doesn't corrupt board" requirement.
}

func TestFrameNeverPanicsAcrossSizes(t *testing.T) {
	// Review Focus #1: for width 0..90 and height 0..40, Frame(fixture at that
	// size) returns without panicking and produces at most max(height,1) lines
}

func TestTooSmallNoticeReportsBothSizes(t *testing.T) {
	// §31 copy: the 34x19 frame contains "THIS UNIVERSE IS TOO SMALL",
	// "resize terminal to continue", "current: 34 × 19" and "needed:"
}

func TestTooSmallNoticeFitsAOneByOneTerminal(t *testing.T) {
	// Review Focus #1: Frame at 1x1 yields exactly 1 line of at most 1 column
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run TestFrame -v`
Expected: FAIL — undefined `Frame`.

- [ ] **Step 3: Implement `Frame` in `internal/render/render.go`**

Border colour for this plan is `th.Border[0]`; the gradient cycle arrives in plan 3.

- [ ] **Step 4: Record the goldens and read them**

Run: `go test ./internal/render/ -run TestFrameGoldens -update`
Then read each file in `internal/render/testdata/` and confirm by eye: the board border is intact, HOLD/NEXT/stats do not overlap it, the controls line is the bottom row, and the ASCII golden has no `██`. Re-run without `-update` to confirm they are stable.

- [ ] **Step 5: Run the suite**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add internal/render/
git commit -m "feat: frame composition with ANSI-stripped layout goldens"
```

---

### Task 6: Overlays — pause, help, game over, boot card

**Files:**
- Create: `internal/render/overlay.go`
- Modify: `internal/render/render.go` (dispatch on `Input.Overlay`)
- Create: `internal/render/testdata/{pause,gameover,help,boot}.golden`
- Test: `internal/render/overlay_test.go`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces:
  ```go
  func PauseBox(th Theme) string
  func GameOverBox(s game.Snapshot, th Theme) string
  func HelpBox(body string, th Theme) string
  func BootBox(progress float64, th Theme) string // 0..1 through the §29 checklist
  func TooSmallNotice(width, height int, th Theme) string
  ```

Exact copy, from §30, §28, §39, §29 — reproduce the text verbatim; `GameOverBox` fills in the snapshot's score, lines and level and carries the subtitle `CAUSE: EXCESSIVE GEOMETRY`. `BootBox` reveals the three checklist lines (`gravity ........ OK`, `spacetime ...... OK`, `tetrominoes .... QUESTIONABLE`) as `progress` crosses 0.3, 0.55 and 0.8, and shows `UNIVERSE ONLINE` at 1.0. Boxes are centred with `lipgloss.Place` over the frame. `HelpBox` wraps the body string the app builds from `bubbles/help`.

- [ ] **Step 1: Write the failing tests**

```go
func TestPauseBoxCopy(t *testing.T) {
	// contains "TEMPORAL SUSPENSION", "SPACE IS PAUSED", "p  resume"
}

func TestGameOverBoxShowsFinalCounters(t *testing.T) {
	// Snapshot{Score: 483200, Lines: 127, Level: 13}:
	// contains "UNIVERSE EXPIRED", "483,200", "127", "13",
	// "r  REBOOT UNIVERSE", "q  ACCEPT COSMIC DEATH", "CAUSE: EXCESSIVE GEOMETRY"
}

func TestGameOverBoxWidthIsStableForHugeScores(t *testing.T) {
	// Review Focus #4: the box width for Snapshot{Score: math.MaxInt} equals
	// the box width for Snapshot{Score: 0}
}

func TestHelpBoxCopy(t *testing.T) {
	// contains "FLIGHT MANUAL" and the supplied body verbatim
}

func TestBootBoxRevealsChecklistWithProgress(t *testing.T) {
	// progress 0.0  -> contains "INITIALIZING LOCAL UNIVERSE" and none of the OK lines
	// progress 0.6  -> contains "gravity" and "spacetime", not "tetrominoes"
	// progress 1.0  -> contains "tetrominoes" and "UNIVERSE ONLINE"
}

func TestBoxesAreRectangular(t *testing.T) {
	// for each box in each mode: every stripped line has the same lipgloss.Width
}

func TestOverlayGoldens(t *testing.T) {
	// Frame with OverlayPaused / OverlayGameOver / OverlayHelp / OverlayBoot at
	// 80x30 ModeFull, compared to testdata/{pause,gameover,help,boot}.golden
}

func TestOverlaysDoNotChangeFrameDimensions(t *testing.T) {
	// each overlay frame at 80x30 is exactly 30 lines, none wider than 80
}

func TestOverlaysFitTheMinimumTerminal(t *testing.T) {
	// at 40x24 each overlay frame is 24 lines and no line exceeds 40 columns
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestPauseBox|TestGameOver|TestHelpBox|TestBootBox|TestBoxes|TestOverlay' -v`
Expected: FAIL

- [ ] **Step 3: Implement `internal/render/overlay.go` and the `Frame` dispatch**

- [ ] **Step 4: Record the goldens and read them**

Run: `go test ./internal/render/ -run TestOverlayGoldens -update`
Read all four files and confirm each box is centred and the board is still visible around it where the spec expects (pause and help float over the board; game over replaces the play area's content but the frame stays).

- [ ] **Step 5: Run the suite**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add internal/render/
git commit -m "feat: pause, help, game-over, boot and too-small overlays"
```

---

### Task 7: Bubble Tea model, key map, single animation clock

**Files:**
- Create: `internal/app/keys.go`, `internal/app/messages.go`, `internal/app/model.go`, `internal/app/update.go`
- Test: `internal/app/update_test.go`, `internal/app/keys_test.go`

**Interfaces:**
- Consumes: all of `internal/render`, all of `internal/game`.
- Produces:
  ```go
  // messages.go
  type FrameMsg struct{ Now time.Time }

  const (
      FrameInterval = 16 * time.Millisecond  // ~60 Hz (§36)
      MaxFrameDelta = 100 * time.Millisecond // clamp across suspend/sleep
      BootDuration  = 1000 * time.Millisecond
  )

  func Frame() tea.Cmd // tea.Tick(FrameInterval, ...) -> FrameMsg

  // keys.go
  type KeyMap struct {
      Left, Right, SoftDrop, RotateCW, RotateCCW, HardDrop, Hold,
      Pause, Restart, Help, Quit key.Binding
  }

  func DefaultKeyMap() KeyMap
  func (k KeyMap) ShortHelp() []key.Binding
  func (k KeyMap) FullHelp() [][]key.Binding

  // model.go
  type Options struct {
      Seed          int64
      SeedExplicit  bool // r restarts with the same seed when true, a fresh one when false
      ASCII         bool
      NoFX          bool
      ReducedMotion bool
  }

  type AppState uint8

  const (
      StateBoot AppState = iota
      StatePlaying
      StatePaused
      StateHelp
      StateOver
  )

  type Model struct {
      Game *game.Game
      Opts Options
      Keys KeyMap
      Help help.Model

      Width, Height int
      State         AppState
      Theme         render.Theme
      Layout        render.Layout
      Mission       string

      Elapsed   time.Duration
      Boot      time.Duration
      LastFrame time.Time
  }

  func New(opts Options) *Model
  func (m *Model) Init() tea.Cmd
  func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd)
  func (m *Model) View() tea.View
  func (m *Model) Universe() string // fmt.Sprintf("%04X", uint16(m.Opts.Seed))
  ```

Key bindings, from §8 plus the WASD aliases:

```text
Left      left, h, a          "←→ / h l"  "move spacecraft"
Right     right, l, d
SoftDrop  down, j, s          "↓ / j"     "accelerate doom"
RotateCW  up, k, x, w         "↑ / k / x" "rotate geometry"
RotateCCW z                   "z"         "rotate other way"
HardDrop  space               "SPACE"     "YEET"
Hold      c                   "c"         "quantum storage"
Pause     p                   "p"         "suspend spacetime"
Restart   r                   "r"         "reboot universe"
Help      ?                   "?"         "close this nonsense"
Quit      q, esc, ctrl+c      "q"         "abandon mission"
```

`tea.KeyPressMsg.String()` yields `"space"`, `"esc"`, `"left"` — bind those strings, not `" "`.

Pinned `Update` behaviour:

```text
tea.WindowSizeMsg   -> Width, Height, Layout = render.Compute(w, h)
                       State stays as it is; SizeTooSmall only changes what renders
tea.ColorProfileMsg -> Theme = render.NewTheme(render.ModeFor(profile, Opts.ASCII))
FrameMsg            -> dt := min(msg.Now.Sub(LastFrame), MaxFrameDelta), floored at 0
                       LastFrame = msg.Now; Elapsed += dt
                       StateBoot: Boot += dt; at BootDuration switch to StatePlaying
                       StatePlaying: Game.Advance(dt); a GameOver event switches to StateOver
                       StatePaused / StateHelp / StateOver: no Advance
                       always return Frame() to reschedule
tea.KeyPressMsg     -> handled immediately, before any tick, and never queued:
                       StateBoot: any key ends the boot sequence (§29)
                       Quit    -> tea.Quit from every state
                       Restart -> new game; seed = Opts.Seed when SeedExplicit,
                                  else time.Now().UnixNano(); State = StatePlaying
                       Help    -> toggles StateHelp <-> StatePlaying
                       Pause   -> toggles StatePaused <-> StatePlaying
                       movement/rotation/drop/hold -> only in StatePlaying
```

`View()` builds a `render.Input` from the model, calls `render.Frame`, and returns a `tea.View` with `AltScreen = true`. `Overlay` is derived from `State` plus `Layout.Size`: `SizeTooSmall` wins over everything.

- [ ] **Step 1: Write the failing tests**

These run without a terminal — construct the model and feed it messages directly.

```go
func TestEveryBindingIsReachable(t *testing.T) {
	// for each of the key strings in the §8 table, exactly one binding in
	// DefaultKeyMap matches a tea.KeyPressMsg with that String()
}

func TestWindowSizeUpdatesLayout(t *testing.T) {
	// Update(tea.WindowSizeMsg{80, 30}) -> m.Layout.Size == render.SizeLarge
	// Update(tea.WindowSizeMsg{34, 19}) -> m.Layout.Size == render.SizeTooSmall
}

func TestZeroWindowSizeDoesNotPanic(t *testing.T) {
	// Review Focus #1: Update(tea.WindowSizeMsg{0, 0}) then View() returns
	// without panicking and the view content is non-empty
}

func TestKeyPressMovesPieceImmediately(t *testing.T) {
	// after StatePlaying and a WindowSizeMsg: x := m.Game.Active.X
	// Update(tea.KeyPressMsg{Code: 'l', Text: "l"}) -> m.Game.Active.X == x+1
	// with no FrameMsg in between (§44 "never make controls lag")
}

func TestHardDropBindsToSpace(t *testing.T) {
	// Update(tea.KeyPressMsg{Code: ' ', Text: " "}) locks a piece:
	// m.Game.Board has 4 filled cells and Score > 0
}

func TestPauseStopsAdvancing(t *testing.T) {
	// press p, then feed a FrameMsg 5 seconds later:
	// m.Game.Active is unchanged and m.Game.Score is unchanged
	// press p again, feed another FrameMsg: the piece moves
}

func TestPausedStarsStillAdvanceElapsed(t *testing.T) {
	// §30: while paused, m.Elapsed still grows with each FrameMsg
	// (the background keeps drifting even though gameplay is frozen)
}

func TestHelpTogglesAndFreezesGameplay(t *testing.T) {
	// "?" -> StateHelp; a FrameMsg does not Advance; "?" -> StatePlaying
}

func TestFrameDeltaIsClamped(t *testing.T) {
	// Review Focus #2: send FrameMsg at t0, then FrameMsg at t0+10s
	// the piece descends by at most the number of cells MaxFrameDelta allows
	// (with level 1 at 800ms, at most 1 cell) and no PieceLocked cascade occurred:
	// the board has at most 4 filled cells
}

func TestNegativeFrameDeltaIsTreatedAsZero(t *testing.T) {
	// FrameMsg at t0+1s then FrameMsg at t0 (a clock step backwards):
	// no panic, no state change
}

func TestBootEndsAfterOneSecondOrAnyKey(t *testing.T) {
	// fresh model is StateBoot
	// feeding FrameMsgs totalling BootDuration switches to StatePlaying
	// a fresh model plus one arbitrary key press also switches to StatePlaying
}

func TestGameOverStopsAdvancingAndKeepsRestartWorking(t *testing.T) {
	// force m.Game into StateOver, feed a FrameMsg -> m.State == StateOver
	// press "r" -> m.State == StatePlaying with a fresh empty board and Score 0
}

func TestRestartReusesTheSeedOnlyWhenExplicit(t *testing.T) {
	// Opts{Seed: 99, SeedExplicit: true}: after "r", m.Game.Seed == 99
	// Opts{Seed: 99, SeedExplicit: false}: after "r", m.Game.Seed != 99
}

func TestQuitReturnsTeaQuit(t *testing.T) {
	// "q" and "esc" each return a non-nil Cmd whose Msg is tea.QuitMsg
}

func TestViewRequestsAltScreen(t *testing.T) {
	// View().AltScreen == true and View().Content is non-empty
}

func TestColorProfileMsgSelectsTheMode(t *testing.T) {
	// ColorProfileMsg{colorprofile.TrueColor} -> m.Theme.Mode == render.ModeFull
	// with Opts.ASCII true, the same message still yields render.ModeASCII
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ -v`
Expected: FAIL — undefined `New`, `Model`.

- [ ] **Step 3: Implement `keys.go`, `messages.go`, `model.go`, `update.go`**

`Update` uses a pointer receiver and returns `m` as the `tea.Model`. Key handling is a single `switch` of `key.Matches` calls placed before any other message handling, so input never waits on a tick (§44). Held left/right relies on the terminal's own key repeat — no custom repeat timer.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/app/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/app/
git commit -m "feat: Bubble Tea model with one animation clock and immediate input"
```

---

### Task 8: CLI, program wiring, README

**Files:**
- Create: `cmd/cosmic-tetris/main.go`, `internal/app/options.go`, `README.md`
- Test: `internal/app/options_test.go`

**Interfaces:**
- Consumes: `app.New`, `app.Options`.
- Produces:
  ```go
  // ParseArgs parses the CLI surface pinned in §49.5. usage is written to out
  // for --help. err is non-nil for a bad flag or a bad seed; main exits 2.
  func ParseArgs(args []string, out io.Writer) (Options, bool /*exit*/, error)
  ```

Final CLI surface (§49.5) — nothing else:

```text
cosmic-tetris
cosmic-tetris --seed 1234
cosmic-tetris --ascii
cosmic-tetris --no-fx
cosmic-tetris --reduced-motion
cosmic-tetris --help
```

`--seed` is parsed with `strconv.ParseInt(v, 10, 64)`; when absent, `Seed` is `time.Now().UnixNano()` and `SeedExplicit` is false. `main` builds the program with `tea.NewProgram(app.New(opts), tea.WithFPS(60))` and exits 1 on a run error.

- [ ] **Step 1: Write the failing tests**

```go
func TestParseArgsDefaults(t *testing.T) {
	// no args: ASCII, NoFX, ReducedMotion all false; SeedExplicit false;
	// Seed is non-zero; exit false; err nil
}

func TestParseArgsFlags(t *testing.T) {
	// --seed 1234          -> Seed 1234, SeedExplicit true
	// --ascii              -> ASCII true
	// --no-fx              -> NoFX true
	// --reduced-motion     -> ReducedMotion true
	// all four together    -> all set
}

func TestParseArgsHelpExitsCleanly(t *testing.T) {
	// --help: exit true, err nil, and out contains every flag name plus
	// "cosmic-tetris"
}

func TestParseArgsRejectsBadSeeds(t *testing.T) {
	// Review Focus #3
	// --seed abc                       -> err non-nil
	// --seed 99999999999999999999      -> err non-nil (int64 overflow)
	// --seed ""                        -> err non-nil
	// --seed 1.5                       -> err non-nil
	// in every case the returned Options must not be used: err is what main checks
}

func TestParseArgsAcceptsNegativeAndZeroSeeds(t *testing.T) {
	// Review Focus #3
	// --seed 0   -> Seed 0, SeedExplicit true, err nil (0 is a legitimate seed)
	// --seed -7  -> Seed -7, SeedExplicit true, err nil
	// game.New with each of those seeds produces a full Next queue
}

func TestParseArgsRejectsUnknownFlags(t *testing.T) {
	// --turbo -> err non-nil and out mentions the flag
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ -run TestParseArgs -v`
Expected: FAIL — undefined `ParseArgs`.

- [ ] **Step 3: Implement `ParseArgs` and `cmd/cosmic-tetris/main.go`**

Use `flag.NewFlagSet` with `flag.ContinueOnError` and `SetOutput(out)` so the tests can capture usage. Detect `SeedExplicit` with `fs.Visit`. `--seed -7` must survive Go's flag parsing — use `-seed=-7` form in the test for the negative case if the bare form is ambiguous, and accept both in the implementation.

- [ ] **Step 4: Write the README**

`README.md` covers: what it is (one paragraph from §1 and §48), `go build ./cmd/cosmic-tetris`, the six CLI invocations above, the §8 control table, the three rendering modes and when each is picked, the 40×24 minimum, and a "Design" section pointing at `design.md` and the three plan files.

- [ ] **Step 5: Run the full suite and build**

Run: `go build ./... && go vet ./... && go test ./... -race`
Expected: PASS

- [ ] **Step 6: Play it**

Run: `go run ./cmd/cosmic-tetris --seed 8675309`
Confirm by hand: the boot card appears and any key skips it; arrows move and rotate; the ghost tracks the active piece; space hard-drops; `c` holds; `p` pauses; `?` shows the flight manual; a completed line clears; resizing the terminal down past 40×24 shows the too-small notice and resizing back recovers; `q` exits cleanly and leaves the terminal usable. Then run `go run ./cmd/cosmic-tetris --ascii` and confirm no `██` appears. Record anything that misbehaves as a fix inside this task before committing.

- [ ] **Step 7: Commit**

```bash
git add cmd/ internal/app/ README.md
git commit -m "feat: CLI surface, program wiring and README"
```

---

## Done when

`go test ./... -race` passes; the goldens in `internal/render/testdata/` are committed and stable; §42's Phase 2 bar is met — "At this point it should already be a genuinely good game" — verified by the hands-on pass in Task 8 Step 6. `--no-fx` and `--reduced-motion` parse and are carried in `Options` but have nothing to suppress yet; plan 3 gives them meaning. Proceed to `plans/2026-09-18-cosmic-tetris-effects.md`.
