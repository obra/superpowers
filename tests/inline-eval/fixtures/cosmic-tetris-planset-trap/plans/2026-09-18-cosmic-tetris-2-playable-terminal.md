# Cosmic Tetris — Plan 2: Playable Terminal

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Plan 1 engine into a genuinely good, fully playable terminal game: Bubble Tea app loop, cell-accurate canvas renderer, responsive layout, board/ghost/hold/next/HUD, pause, help, game-over card, CLI flags, and ANSI-stripped golden tests.

**Architecture:** `internal/render` owns a `Canvas` of styled cells; every visual element draws into the canvas and `Canvas.String()` emits one styled string. `render.Render(Snapshot, Options)` is a pure function of a snapshot — it never mutates game state. `internal/app` is the Bubble Tea model: it owns the clock, turns key presses into engine calls immediately, and feeds elapsed time to `Game.Advance`. Render does not import app; app builds a `render.Snapshot`.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2` v2.0.9, `charm.land/lipgloss/v2` v2.0.6, `charm.land/bubbles/v2` v2.2.1 (key, help), `github.com/charmbracelet/x/ansi` (test-side ANSI stripping).

**Spec:** `design.md` (§4, §5, §8, §9, §10, §13 HUD, §26, §27 line slot, §28 final card, §30, §31, §32 modes, §33, §34, §36, §37, §39, §41, §42 Phase 2, §46, §49.3, §49.4, §49.7)

## Global Constraints

- Language: Go. Module `cosmic-tetris`, `go 1.26`.
- `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2` — do not wrap Bubble Tea in a homegrown framework (§3).
- Bubble Tea v2 API as installed (verified): `tea.Model` is `Init() tea.Cmd`, `Update(tea.Msg) (tea.Model, tea.Cmd)`, `View() tea.View`. Full-screen is `v := tea.NewView(s); v.AltScreen = true`. Key presses arrive as `tea.KeyPressMsg`. Terminal size is `tea.WindowSizeMsg{Width, Height}`. Color support arrives as `tea.ColorProfileMsg{colorprofile.Profile}`. `key.Matches` is generic over `fmt.Stringer` and accepts a `tea.KeyPressMsg`. Lip Gloss colors are `lipgloss.Color(string) color.Color`.
- Repository layout is fixed by §33; extra files inside the named packages are allowed where this plan names them.
- Logical board: width 10, height 22, visible 20, hidden 2. One logical cell renders as **2 terminal columns × 1 row** (§5).
- Glyphs (§49.4): blocks `██` (`[]` in ASCII), ghost `░░` (`··` in ASCII). Pieces use filled glyphs with a bright foreground — never a foreground+background pairing. The active piece renders one step brighter than locked cells.
- Minimum usable terminal 40×24; below that show the too-small notice (§31). Never crash on resize.
- Rendering must not mutate game state (§37). Animations must never block input (§44).
- The §4 mockup is mood, not geometry; the ANSI-stripped goldens are the binding layout contract (§49.7).
- CLI surface is exactly: no flags, `--seed N`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help` (§49.5).

## Review Focus

1. Terminal reported as 0×0, 1×1, or any size below 40×24 — render the notice, never panic or divide by zero (Task 2, Task 6).
2. Key presses arriving before the first `WindowSizeMsg`, i.e. while width and height are still 0 — the model must absorb them without panicking (Task 6).
3. A terminal far larger than any expected size (300×100) — regions center and still never overlap (Task 2).
4. A score wider than its HUD field (8+ digits) and a level past 99 — the HUD grows or truncates without pushing the board out of place (Task 5).
5. A resize that lands between `Update` and `View` — `View` must render only from the size stored on the model, so the frame is internally consistent (Task 6).

## Plan Set

Run in this order. A ruling that changes a name, signature, or value a later plan consumes is applied to that plan's file before the next task starts.

1. `plans/2026-09-18-cosmic-tetris-1-engine.md` — headless deterministic engine in `internal/game`. Consumes: nothing.
2. `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md` — Bubble Tea app, canvas renderer, layout, HUD, hold/next/ghost, CLI flags, pause/help/game-over card, golden tests. Consumes Plan 1's `game.Game`, `Tick`, `Event`, `Board`, `Piece`, `GhostY`.
3. `plans/2026-09-18-cosmic-tetris-3-cosmic-foundation.md` — `internal/fx` (particles, starfield), animated border, piece trails, `internal/flavor` mission control. Consumes Plan 1's `Event`/`Cell` and Plan 2's `render.Canvas`, `render.Layout`, `render.Snapshot`, `app.Model`.
4. `plans/2026-09-18-cosmic-tetris-4-violence.md` — hard-drop impact, screen shake, line supernova, shockwaves, hyperdrive, four-line sequence, combo/level overlays. Consumes Plan 3's `fx.World` and the render FX layer.
5. `plans/2026-09-18-cosmic-tetris-5-polish.md` — boot sequence, game-over black hole, ASCII/no-FX guarantees, §45 details, README, definition-of-done sweep. Consumes everything above.

---

## File Structure

| File | Responsibility |
|---|---|
| `internal/render/canvas.go` | styled cell grid, clipping writes, run-length styled output |
| `internal/render/layout.go` | `Rect`, `Layout`, `Compute(w,h)` responsive geometry and drop order |
| `internal/render/palette.go` | `Mode`, `Options`, glyphs, piece/HUD/border colors |
| `internal/render/board.go` | locked cells, ghost, active piece, board border |
| `internal/render/hud.go` | hold, next queue, stats, mission line, controls line, frame |
| `internal/render/overlay.go` | centered cards: pause, help, game over, too-small notice |
| `internal/render/render.go` | `Phase`, `Snapshot`, `Render` — the §37 pipeline |
| `internal/render/testdata/*.txt` | ANSI-stripped goldens |
| `internal/app/keys.go` | `KeyMap` (bubbles/key) and help groupings |
| `internal/app/messages.go` | `FrameMsg`, frame command |
| `internal/app/options.go` | CLI flag parsing, usage text |
| `internal/app/model.go` | `Model`, `New`, `Init`, `View` |
| `internal/app/update.go` | `Update`: resize, color profile, keys, frame clock |
| `cmd/cosmic-tetris/main.go` | flags → `app.New` → `tea.NewProgram(...).Run()` |

`canvas.go` and `overlay.go` are additions to §33's file list. They are load-bearing: compositing FX over the board (Plans 3–4) and shifting the board by one cell for screen shake are only sane against a cell grid, and the four overlay cards share one centering routine.

---

### Task 1: Canvas — the styled cell grid

**Files:**
- Create: `internal/render/canvas.go`
- Test: `internal/render/canvas_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
```go
type Paint struct {
    FG, BG color.Color   // nil means "terminal default"
    Bold, Faint bool
}

type Canvas struct{ /* unexported: w, h int; runes []rune; paints []Paint */ }
func NewCanvas(w, h int) *Canvas
func (c *Canvas) Size() (w, h int)
func (c *Canvas) Set(x, y int, r rune, p Paint)            // no-op when out of bounds
func (c *Canvas) SetString(x, y int, s string, p Paint) int // returns columns written
func (c *Canvas) Fill(r Rect, ch rune, p Paint)
func (c *Canvas) Blit(src *Canvas, dx, dy int)             // clipped; skips src cells that are unset
func (c *Canvas) String() string
func (c *Canvas) Plain() string                            // unstyled, for tests
```

Unset cells hold rune 0 and render as a space; `Blit` treats them as transparent. `String()` walks each row, groups runs of cells with an equal `Paint`, renders each run through one `lipgloss.NewStyle()`, joins rows with `"\n"`, and trims trailing whitespace on each row. `SetString` writes one rune per column (callers pass `██` as two runes, which is what makes a logical cell 2 columns wide).

- [ ] **Step 1: Write the failing tests**

```go
func TestCanvasPlainRendersGrid(t *testing.T)
// c := NewCanvas(4,2); c.Set(0,0,'A',Paint{}); c.Set(3,1,'B',Paint{})
// c.Plain() == "A\n   B"   (trailing spaces trimmed)

func TestZeroSizedCanvasIsEmptyAndSafe(t *testing.T)
// NewCanvas(0,0).Plain() == ""; Set(0,0,'x',Paint{}) does not panic
// NewCanvas(-5,-5) behaves as 0x0

func TestWritesOutsideBoundsAreClipped(t *testing.T)
// c := NewCanvas(3,1); c.SetString(-2,0,"abcde",Paint{}) leaves "cde";
// c.SetString(2,0,"xy",Paint{}) leaves "abx" untouched beyond the edge; no panic

func TestBlockGlyphOccupiesTwoColumns(t *testing.T)
// c := NewCanvas(4,1); c.SetString(0,0,"██",Paint{}) returns 2 and Plain() == "██"

func TestBlitIsTransparentForUnsetCells(t *testing.T)
// dst filled with '.', src 2x2 with only (1,1) set to '#': Blit(src,1,0)
// => only one '.' replaced, at (2,1)

func TestStringCarriesStyleAndPlainStripsIt(t *testing.T)
// c.Set(0,0,'X',Paint{FG: lipgloss.Color("#ff00ff")})
// ansi.Strip(c.String()) == c.Plain() and c.String() != c.Plain()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -v`
Expected: FAIL — undefined `NewCanvas`.

- [ ] **Step 3: Add the dependencies and implement `internal/render/canvas.go`**

```bash
go get charm.land/lipgloss/v2@v2.0.6 github.com/charmbracelet/x/ansi@v0.11.8
```

`Rect` is defined in Task 2; for this task declare `Fill` against it after Task 2 lands, or define `Rect` here and leave layout to Task 2 — implement `Rect` in `layout.go` and have Task 1 `Fill` take `Rect` once Task 2 exists. To keep Task 1 self-contained, put the `Rect` type in `canvas.go`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add go.mod go.sum internal/render/canvas.go internal/render/canvas_test.go
git commit -m "feat(render): styled cell canvas with clipping and transparent blit"
```

---

### Task 2: Responsive layout

**Files:**
- Create: `internal/render/layout.go`
- Test: `internal/render/layout_test.go`

**Interfaces:**
- Consumes: `Rect` (Task 1).
- Produces:
```go
const (
    MinWidth  = 40
    MinHeight = 24
    BoardCols = game.Width * 2        // 20
    BoardRows = game.VisibleRows      // 20
)

type Tier int
const (TierSmall Tier = iota; TierMedium; TierWide)

type Layout struct {
    Screen   Rect
    Tier     Tier
    TooSmall bool

    Frame    Rect  // full-screen title border; Empty when dropped
    Border   Rect  // board border box: BoardCols+2 × BoardRows+2
    Board    Rect  // board interior: BoardCols × BoardRows
    Hold     Rect
    Next     Rect
    Stats    Rect
    Mission  Rect  // Empty when dropped
    Controls Rect

    NextCount      int   // 5 or 3
    ShowStatLabels bool
}

func (r Rect) Empty() bool
func (r Rect) Intersects(o Rect) bool
func (r Rect) Contains(o Rect) bool
func Compute(w, h int) Layout
```

Rules (fixed):

| Condition | Result |
|---|---|
| `w < MinWidth \|\| h < MinHeight` | `TooSmall: true`, only `Screen` set |
| `w >= 64 && h >= 28` | `TierWide`: HOLD + SCORE/LINES/LEVEL column left of the board, NEXT column right |
| `w >= 50` | `TierMedium`: one compact HUD column right of the board (HOLD, NEXT, stats stacked) |
| otherwise | `TierSmall`: one narrow HUD column right of the board |
| `h >= 28` | `Frame` set (full-screen title border) |
| `h >= 25` | `Mission` set (one row above `Controls`) |
| `h >= 26` | `ShowStatLabels: true` |
| `w >= 50 && h >= 26` | `NextCount: 5`, else `3` |

`Controls` is always one row, the last row of the screen. The board box is horizontally centered in the space left after the HUD columns and vertically centered in the space left after frame/mission/controls. NEXT never stacks above or below the board (§49.3).

- [ ] **Step 1: Write the failing tests**

```go
func TestWideLayoutHasEveryRegion(t *testing.T)
// l := Compute(100,40): Tier==TierWide, !TooSmall, NextCount==5, ShowStatLabels,
// none of Frame/Border/Board/Hold/Next/Stats/Mission/Controls is Empty,
// Board.W==BoardCols, Board.H==BoardRows

func TestMinimumLayoutDropsChromeInOrder(t *testing.T)
// l := Compute(40,24): !TooSmall, Tier==TierSmall, Frame.Empty(), Mission.Empty(),
// !ShowStatLabels, NextCount==3, Board.W==BoardCols, Board.H==BoardRows,
// Controls.Y == 23, l.Screen.Contains(l.Border)

func TestMissionSurvivesAtTwentyFiveRows(t *testing.T)
// Compute(60,25): !Mission.Empty(), Frame.Empty(), !ShowStatLabels

func TestBelowMinimumIsTooSmall(t *testing.T)
// Compute(39,24), Compute(40,23), Compute(0,0), Compute(1,1) all TooSmall

func TestNoRegionsEverOverlap(t *testing.T)
// for w in 40..140 step 1, h in 24..60 step 1: every pair of non-empty regions
// (Border, Hold, Next, Stats, Mission, Controls) has !Intersects, and
// Screen.Contains each of them

func TestHugeTerminalCentersTheBoard(t *testing.T)
// Compute(300,100): Board.X > 100 and Screen.Contains(Border) and Tier==TierWide
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestWideLayout|TestMinimum|TestMission|TestBelow|TestNoRegions|TestHuge' -v`
Expected: FAIL — undefined `Compute`.

- [ ] **Step 3: Implement `internal/render/layout.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/layout.go internal/render/layout_test.go
git commit -m "feat(render): responsive layout with pinned drop order"
```

---

### Task 3: Palette, modes and glyphs

**Files:**
- Create: `internal/render/palette.go`
- Test: `internal/render/palette_test.go`

**Interfaces:**
- Consumes: `game.PieceKind`, `Paint` (Task 1).
- Produces:
```go
type Mode int
const (ModeFull Mode = iota; ModeReduced; ModeASCII)
func ModeFor(p colorprofile.Profile, asciiFlag bool) Mode

type Options struct {
    Mode          Mode
    FXEnabled     bool
    ReducedMotion bool
}

func BlockGlyph(m Mode) string   // "██" / "██" / "[]"
func GhostGlyph(m Mode) string   // "░░" / "░░" / "··"
func BoxChars(m Mode) BoxSet     // ╔ ═ ╗ ║ ╚ ╝ in Unicode modes; + - | in ASCII
type BoxSet struct{ TL, T, TR, V, BL, BR rune }

func PiecePaint(k game.PieceKind, active bool, m Mode) Paint
func GhostPaint(m Mode) Paint
func HUDPaint(m Mode) Paint
func LabelPaint(m Mode) Paint
func AccentPaint(m Mode) Paint
var BorderPalette = []string{"#7A3CFF", "#22E1FF", "#FF37E0", "#3B6BFF", "#FFFFFF"} // §25
```

Piece hues (§26), used as the locked-cell foreground; active cells use a lighter step of the same hue:

```text
I plasma cyan    #22E1FF    J deep electric blue #3B6BFF
L solar orange   #FF8A2B    O stellar gold       #FFD23F
S alien green    #49F27A    T ultraviolet        #9D4EFF
Z supernova red  #FF3B6B
```

`ModeFull` uses these hex values directly; `ModeReduced` and `ModeASCII` round them through `colorprofile.Profile.Convert`. Only the `--ascii` flag selects `ModeASCII` (§32).

- [ ] **Step 1: Write the failing tests**

```go
func TestModeForProfile(t *testing.T)
// ModeFor(colorprofile.TrueColor,false)==ModeFull; ANSI256 and ANSI => ModeReduced;
// NoTTY/Ascii => ModeASCII; asciiFlag true forces ModeASCII from any profile

func TestGlyphWidths(t *testing.T)
// for every mode: ansi.StringWidth(BlockGlyph(m))==2 and ansi.StringWidth(GhostGlyph(m))==2

func TestGhostGlyphsArePinned(t *testing.T)
// BlockGlyph(ModeFull)=="██"; BlockGlyph(ModeASCII)=="[]"
// GhostGlyph(ModeFull)=="░░"; GhostGlyph(ModeReduced)=="░░"; GhostGlyph(ModeASCII)=="··"

func TestASCIIModeEmitsOnlyASCII(t *testing.T)
// every rune of BlockGlyph/GhostGlyph(ModeASCII) and every field of BoxChars(ModeASCII) is < 128

func TestActivePieceIsBrighterThanLocked(t *testing.T)
// for all 7 kinds: PiecePaint(k,true,ModeFull).FG != PiecePaint(k,false,ModeFull).FG
// and the active colour has a strictly higher luminance

func TestEveryKindHasADistinctColour(t *testing.T)
// the 7 locked FG values are pairwise different
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestMode|TestGlyph|TestGhost|TestASCII|TestActive|TestEveryKind' -v`
Expected: FAIL — undefined `ModeFor`.

- [ ] **Step 3: Implement `internal/render/palette.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/palette.go internal/render/palette_test.go
git commit -m "feat(render): neon space palette, render modes and glyph sets"
```

---

### Task 4: Board, ghost, active piece and border

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces:
```go
func DrawBoardBorder(c *Canvas, l Layout, o Options, p Paint)
func DrawLocked(c *Canvas, l Layout, b *game.Board, o Options)
func DrawGhost(c *Canvas, l Layout, g *game.Game, o Options)
func DrawActive(c *Canvas, l Layout, p game.Piece, o Options)
func CellOrigin(l Layout, x, y int) (col, row int)  // logical cell -> canvas cell; y is a board row
```

`CellOrigin` maps logical `(x, y)` to `(l.Board.X + x*2, l.Board.Y + y - game.HiddenRows)`. Rows above `game.HiddenRows` are not drawn — a piece straddling the hidden rows shows only its visible part. Draw order is locked → ghost → active (§37), and the ghost writes only into cells that are empty on the board (§10).

- [ ] **Step 1: Write the failing tests**

```go
func TestEmptyBoardDrawsNothing(t *testing.T)
// canvas sized to a wide layout, DrawLocked with an empty board => Plain() is all blank

func TestLockedCellLandsAtTheRightColumns(t *testing.T)
// board.Set(0,21,CellFor(KindT)) and board.Set(9,21,CellFor(KindI));
// the last board row of Plain() has BlockGlyph at columns Board.X..Board.X+1
// and Board.X+18..Board.X+19 and blanks between

func TestGhostSitsAtTheLandingRow(t *testing.T)
// empty board, active I at spawn: DrawGhost puts GhostGlyph on the row
// CellOrigin(l,0,g.GhostY()+1).row (the piece's own cell row), not on row 0

func TestGhostNeverOverwritesLockedCells(t *testing.T)
// fill row 21 with locked cells, ghost resting on row 20:
// row 21 of Plain() contains only block glyphs, no ghost glyph

func TestActivePieceDrawsOverGhost(t *testing.T)
// draw ghost then active for a piece one row above its landing spot:
// the active piece's rows hold block glyphs, not ghost glyphs

func TestHiddenRowsAreNotRendered(t *testing.T)
// a piece at Y=0 (entirely in hidden rows) draws nothing

func TestBorderBoxMatchesTheLayout(t *testing.T)
// DrawBoardBorder: Plain() row l.Border.Y starts with BoxChars.TL at l.Border.X and
// ends with TR at l.Border.X+l.Border.W-1; every interior row has V at both edges
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestEmptyBoard|TestLockedCell|TestGhost|TestActive|TestHidden|TestBorderBox' -v`
Expected: FAIL — undefined `DrawLocked`.

- [ ] **Step 3: Implement `internal/render/board.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): board, ghost, active piece and machinery border"
```

---

### Task 5: HUD, render pipeline and goldens

**Files:**
- Create: `internal/render/hud.go`, `internal/render/render.go`, `internal/render/golden_test.go`, `internal/render/testdata/`
- Test: `internal/render/hud_test.go`, `internal/render/render_test.go`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces:
```go
type Phase int
const (PhaseBoot Phase = iota; PhasePlaying; PhasePaused; PhaseGameOver)

type Snapshot struct {
    Game    *game.Game
    Width   int
    Height  int
    Phase   Phase
    ShowHelp bool
    Mission string          // already-formatted mission text, "" hides the channel
    Elapsed time.Duration   // total elapsed play time, for animated chrome
    Seed    int64
}

func Render(s Snapshot, o Options) string

// hud.go
func DrawFrame(c *Canvas, l Layout, o Options, seed int64)   // title bar: "✦ COSMIC TETRIS" + "LOCAL UNIVERSE 7F3A"
func DrawHold(c *Canvas, l Layout, hold *game.PieceKind, o Options)
func DrawNext(c *Canvas, l Layout, next []game.PieceKind, o Options)
func DrawStats(c *Canvas, l Layout, g *game.Game, o Options)
func DrawMission(c *Canvas, l Layout, text string, o Options)
func DrawControls(c *Canvas, l Layout, o Options)
func UniverseLabel(seed int64) string   // fmt.Sprintf("%04X", uint16(seed))
```

`Render` builds a canvas of `s.Width × s.Height` and follows §37's order, skipping the FX steps (Plans 3–4 add them). When `Compute(w,h).TooSmall`, it renders only the §31 notice with the live `current:` and `needed:` lines. Stats are drawn as label+value when `ShowStatLabels`, value-only otherwise (§49.3). Score renders zero-padded to 8 digits and is left-truncated to the region width if it overflows; level and lines render zero-padded to 2 and 3 digits and grow when they exceed it.

Golden helper (in `golden_test.go`):
```go
var update = flag.Bool("update", false, "rewrite golden files")
func assertGolden(t *testing.T, name, got string)    // compares ansi.Strip(got) to testdata/<name>.txt
func fixtureGame(t *testing.T) *game.Game            // game.New(8675309) driven by one canned script
```
`fixtureGame` is shared by every golden in this plan and Plans 3–5, so its script is fixed once here: 12 scripted placements producing a non-trivial stack, one single-line clear, score > 0, level 1.

- [ ] **Step 1: Write the failing tests**

```go
func TestStatsShowValuesWithoutLabelsAtSmallSize(t *testing.T)
// l := Compute(40,24); DrawStats => Plain() contains the zero-padded score
// and does not contain "LINES" or "LEVEL"

func TestStatsShowLabelsWhenThereIsRoom(t *testing.T)
// l := Compute(100,40) => Plain() contains "SCORE", "LINES", "LEVEL"

func TestNextRendersTheRequestedCount(t *testing.T)
// wide layout: DrawNext with 5 kinds draws 5 previews (count non-blank preview groups);
// small layout: only l.NextCount == 3 previews are drawn and nothing spills outside l.Next

func TestHoldEmptyDrawsOnlyTheLabel(t *testing.T)
// hold == nil => no block glyphs inside l.Hold

func TestHugeScoreDoesNotDisturbTheBoard(t *testing.T)
// g.Score = 1234567890; Render at 100x40; the 20 board rows of the output are
// byte-identical to the same render with Score = 0 (board untouched)

func TestRenderIsPureAndDeterministic(t *testing.T)
// before := g.Board.String() + fmt.Sprint(g.Score, g.Lines, g.Level, g.Combo, g.Active)
// Render(...) twice => identical strings; the `before` fingerprint is unchanged

func TestEveryRenderedLineFitsTheTerminal(t *testing.T)
// for w in 40..120 step 7, h in 24..48 step 5: every line of ansi.Strip(Render(...))
// has ansi.StringWidth <= w and the line count is <= h

func TestTooSmallNotice(t *testing.T)
// Render at 34x19 contains "THIS UNIVERSE IS TOO SMALL", "current: 34 × 19",
// "needed: approximately 40 × 24"
```

```go
func TestGoldenWideLayout(t *testing.T)   // 100x40, ModeFull, FX off
func TestGoldenMediumLayout(t *testing.T) // 72x30
func TestGoldenSmallLayout(t *testing.T)  // 40x24
func TestGoldenTooSmall(t *testing.T)     // 34x19
// each: assertGolden(t, "<name>", Render(snapshotFrom(fixtureGame(t), w, h), Options{Mode: ModeFull}))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestStats|TestNext|TestHold|TestHugeScore|TestRenderIs|TestEveryRendered|TestTooSmall|TestGolden' -v`
Expected: FAIL — undefined `Render`.

- [ ] **Step 3: Implement `hud.go` and `render.go`, then create the goldens**

Run `go test ./internal/render/ -run TestGolden -update` once, then read each `testdata/*.txt` and confirm by eye that nothing overlaps, the board is 20×20, and the HUD reads cleanly. Fix the layout rather than the golden if it looks wrong.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/hud.go internal/render/render.go internal/render/golden_test.go internal/render/hud_test.go internal/render/render_test.go internal/render/testdata
git commit -m "feat(render): HUD, render pipeline and layout goldens"
```

---

### Task 6: Bubble Tea app, keys, CLI and a runnable binary

**Files:**
- Create: `internal/app/keys.go`, `internal/app/messages.go`, `internal/app/options.go`, `internal/app/model.go`, `internal/app/update.go`, `cmd/cosmic-tetris/main.go`
- Test: `internal/app/options_test.go`, `internal/app/update_test.go`

**Interfaces:**
- Consumes: Plan 1's `game` package; Task 5's `render.Render`, `render.Snapshot`, `render.Phase`, `render.Options`, `render.ModeFor`.
- Produces:
```go
// options.go
type Options struct {
    Seed          int64
    SeedSet       bool
    ASCII         bool
    NoFX          bool
    ReducedMotion bool
}
var ErrHelpRequested = errors.New("help requested")
func ParseFlags(args []string) (Options, error)   // args excludes argv[0]
func Usage() string

// keys.go
type KeyMap struct {
    Left, Right, SoftDrop, RotateCW, RotateCCW, HardDrop,
    Hold, Pause, Restart, Help, Quit key.Binding
}
func DefaultKeyMap() KeyMap
func (k KeyMap) ShortHelp() []key.Binding
func (k KeyMap) FullHelp() [][]key.Binding

// messages.go
type FrameMsg struct{ Now time.Time }
const FrameInterval = 16 * time.Millisecond   // ~60Hz (§36)
const MaxFrameDelta = 250 * time.Millisecond  // clamp after a suspend
func FrameCmd() tea.Cmd                        // tea.Tick(FrameInterval, ...)

// model.go
type Model struct {
    Game   *game.Game
    Opts   Options
    Render render.Options
    Width, Height int
    Phase  render.Phase
    ShowHelp bool
    Keys   KeyMap
    Help   help.Model
    LastFrame time.Time
    Elapsed   time.Duration
    Seed      int64
}
func New(o Options) *Model
func (m *Model) Init() tea.Cmd
func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd)
func (m *Model) View() tea.View
func (m *Model) Snapshot() render.Snapshot
```

Bindings (§8): left `left`/`h`/`a`; right `right`/`l`/`d`; soft drop `down`/`j`/`s`; rotate CW `up`/`k`/`x`/`w`; rotate CCW `z`; hard drop `space` ("YEET"); hold `c`; pause `p`; restart `r`; help `?`; quit `q`/`esc`. Help strings use the §39 copy.

`Update` rules:
- `tea.WindowSizeMsg` → store `Width`/`Height` only.
- `tea.ColorProfileMsg` → `m.Render.Mode = render.ModeFor(msg.Profile, m.Opts.ASCII)`.
- `tea.KeyPressMsg` → act immediately, never wait for a tick (§8, §36). Quit returns `tea.Quit`; help toggles `ShowHelp`; pause toggles `PhasePlaying`/`PhasePaused`; restart rebuilds `m.Game = game.New(m.Seed)` and resets `Phase`. Movement keys are ignored unless `Phase == PhasePlaying`.
- `FrameMsg` → `dt := min(msg.Now.Sub(m.LastFrame), MaxFrameDelta)` (0 when `LastFrame` is zero), store `LastFrame`, then: when playing, `m.Elapsed += dt` and `m.Game.Tick(dt)`; when paused, `m.Elapsed += dt / 10` and no `Tick` (§30). If `m.Game.Over`, set `Phase = PhaseGameOver`. Always return `FrameCmd()`.
- `View()` returns `v := tea.NewView(render.Render(m.Snapshot(), m.Render)); v.AltScreen = true`.

Repeated movement while a key is held (§8) comes from terminal auto-repeat: each repeat is another `tea.KeyPressMsg`, handled immediately. No DAS timer.

`main.go` parses flags, prints `Usage()` and exits 0 on `ErrHelpRequested`, prints the error and exits 2 on any other parse error, seeds from `time.Now().UnixNano()` when `!SeedSet`, and runs the program.

- [ ] **Step 1: Write the failing tests**

```go
func TestParseFlags(t *testing.T)
// {} => zero Options, SeedSet false
// {"--seed","1234"} => Seed 1234, SeedSet true
// {"--seed","0"} => Seed 0, SeedSet true   (0 is a real seed)
// {"--seed","-7"} => Seed -7, SeedSet true
// {"--ascii"} => ASCII; {"--no-fx"} => NoFX; {"--reduced-motion"} => ReducedMotion
// {"--seed","abc"} => error (not ErrHelpRequested)
// {"--help"} => errors.Is(err, ErrHelpRequested)
// {"--wat"} => error
// Usage() mentions every one of the five flags

func TestKeyBindingsCoverTheSpec(t *testing.T)
// DefaultKeyMap: for each of "left","h","a","right","l","d","down","j","s","up","k","x","w",
// "z"," ","c","p","r","?","q","esc" exactly one binding claims it

func TestKeyPressMovesThePieceImmediately(t *testing.T)
// m := New(Options{Seed:1, SeedSet:true}); m.Width, m.Height = 100, 40
// x := m.Game.Active.X; feed tea.KeyPressMsg for "left" => m.Game.Active.X == x-1
// with no FrameMsg in between

func TestKeysBeforeFirstWindowSizeDoNotPanic(t *testing.T)
// fresh model (Width==0, Height==0): feed "left","space","c","p","?" then call View()
// => no panic, View().Content is non-empty

func TestResizeToDegenerateSizesDoesNotPanic(t *testing.T)
// feed WindowSizeMsg {0,0}, {1,1}, {39,23}, {200,60}, {34,19} in sequence, calling View()
// after each => no panic; at {34,19} the content contains "TOO SMALL"

func TestFrameTicksGravity(t *testing.T)
// feed two FrameMsgs one second apart => Active.Y increased; m.Elapsed == 1s

func TestFirstFrameHasZeroDelta(t *testing.T)
// a single FrameMsg on a fresh model leaves Active.Y unchanged

func TestGiantFrameDeltaIsClamped(t *testing.T)
// two FrameMsgs one hour apart => m.Elapsed increased by MaxFrameDelta, not an hour

func TestPauseFreezesTheGame(t *testing.T)
// press "p" => Phase == PhasePaused; two FrameMsgs one second apart leave
// Board.String(), Score and Active unchanged; m.Elapsed grew by 100ms (dt/10)
// press "p" again => PhasePlaying

func TestRestartRebuildsTheSameSeed(t *testing.T)
// hard drop a few pieces, press "r" => Score==0, Lines==0, Phase==PhasePlaying,
// Board.String() is empty, and m.Game.Next equals a fresh game.New(seed).Next

func TestQuitReturnsTeaQuit(t *testing.T)
// pressing "q" returns a cmd whose result is a tea.QuitMsg; same for "esc"

func TestGameOverPhaseIsEntered(t *testing.T)
// fill the board via m.Game.Board.Set, hard drop => after the next FrameMsg,
// Phase == PhaseGameOver and further movement keys change nothing
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/app/ -v`
Expected: FAIL — package does not exist.

- [ ] **Step 3: Add the dependencies and implement the app package plus `main.go`**

```bash
go get charm.land/bubbletea/v2@v2.0.9 charm.land/bubbles/v2@v2.2.1
```

- [ ] **Step 4: Run the tests and play the game**

Run: `go test ./... -v && go vet ./... && go run ./cmd/cosmic-tetris --seed 1234`
Expected: tests PASS; the game is playable — pieces fall, move, rotate, hold, ghost shows, lines clear, resizing works, `p` pauses, `q` quits.

- [ ] **Step 5: Commit**

```bash
git add internal/app cmd/cosmic-tetris go.mod go.sum
git commit -m "feat(app): Bubble Tea loop, key map, CLI flags and playable binary"
```

---

### Task 7: Pause, help and game-over overlays

**Files:**
- Create: `internal/render/overlay.go`
- Modify: `internal/render/render.go` (call overlays at the end of the pipeline), `internal/render/golden_test.go` (three more goldens)
- Test: `internal/render/overlay_test.go`

**Interfaces:**
- Consumes: Tasks 1–5; `app.KeyMap` copy lives in app, so overlay help text is passed in as lines.
- Produces:
```go
func DrawCard(c *Canvas, l Layout, title string, lines []string, o Options)  // centered box, clipped to Screen
func DrawPause(c *Canvas, l Layout, o Options)
func DrawHelp(c *Canvas, l Layout, lines []string, o Options)
func DrawGameOver(c *Canvas, l Layout, g *game.Game, o Options)
```

Copy is fixed by the spec: pause is `TEMPORAL SUSPENSION` / `SPACE IS PAUSED` / `p  resume` (§30). Game over is `UNIVERSE EXPIRED`, `SCORE`, `LINES`, `LEVEL`, `r  REBOOT UNIVERSE`, `q  ACCEPT COSMIC DEATH`, subtitle `CAUSE: EXCESSIVE GEOMETRY` (§28). Help is `FLIGHT MANUAL` with the §39 rows; `Snapshot.HelpLines []string` carries them from `app` (built from `KeyMap.FullHelp()` via `bubbles/help`), so `render` owns no key vocabulary. Add `HelpLines []string` to `Snapshot`.

Cards never draw outside `l.Screen` and shrink their box to fit when the terminal is small.

- [ ] **Step 1: Write the failing tests**

```go
func TestPauseOverlayCopy(t *testing.T)
// Render with Phase PhasePaused contains "TEMPORAL SUSPENSION", "SPACE IS PAUSED", "p  resume"

func TestGameOverCardShowsFinalNumbers(t *testing.T)
// g.Score=483200; g.Lines=127; g.Level=13; Phase PhaseGameOver =>
// output contains "UNIVERSE EXPIRED", "483,200", "127", "13",
// "r  REBOOT UNIVERSE", "q  ACCEPT COSMIC DEATH"

func TestHelpOverlayListsEveryBinding(t *testing.T)
// ShowHelp true with the app-supplied lines => output contains "FLIGHT MANUAL" and
// one row per binding

func TestOverlaysStayInsideTheScreen(t *testing.T)
// for each of pause/help/game over, at 40x24 and 100x40: every line of the output
// has width <= w and the line count <= h

func TestOverlaysDoNotChangeTheBoardGeometry(t *testing.T)
// the board's 20 rows keep width BoardCols in every overlay state (cards may cover
// them, but no row grows or shrinks)

func TestGoldenPause(t *testing.T)     // 100x40
func TestGoldenGameOver(t *testing.T)  // 100x40
func TestGoldenHelp(t *testing.T)      // 100x40
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestPause|TestGameOver|TestHelp|TestOverlays|TestGolden' -v`
Expected: FAIL — undefined `DrawPause`.

- [ ] **Step 3: Implement `overlay.go`, wire it into `Render`, wire `HelpLines` in `app`**

In `app`, build `HelpLines` from `m.Help` + `m.Keys.FullHelp()` once per render.

- [ ] **Step 4: Create the goldens and run everything**

Run: `go test ./internal/render/ -run TestGolden -update && go test ./... -v`
Expected: PASS; inspect the three new `testdata` files by eye.

- [ ] **Step 5: Commit**

```bash
git add internal/render/overlay.go internal/render/render.go internal/render/overlay_test.go internal/render/golden_test.go internal/render/testdata internal/app
git commit -m "feat(render): pause, help and game-over overlays with goldens"
```

---

### Task 8: Phase 2 acceptance

**Files:**
- Test: `internal/app/acceptance_test.go`

**Interfaces:**
- Consumes: the whole app.
- Produces: nothing new — this is §42's "at this point it should already be a genuinely good game" gate.

- [ ] **Step 1: Write the test**

```go
func TestFullSessionThroughGameOverNeverPanics(t *testing.T)
// m := New(Options{Seed: 42, SeedSet: true}); WindowSizeMsg{100,40}; ColorProfileMsg TrueColor.
// Loop up to 20000 iterations: every iteration feed one FrameMsg 16ms later and, every
// third iteration, one pseudo-random key from the full key set (excluding q/esc), then call
// View() and assert the content is non-empty. Every 500 iterations feed a WindowSizeMsg
// cycling through {100,40},{72,30},{40,24},{34,19},{0,0}.
// Assert the loop reaches Phase == PhaseGameOver, and that no iteration panicked.
```

- [ ] **Step 2: Run it**

Run: `go test ./internal/app/ -run TestFullSession -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add internal/app/acceptance_test.go
git commit -m "test(app): full session with resizes and random input"
```
