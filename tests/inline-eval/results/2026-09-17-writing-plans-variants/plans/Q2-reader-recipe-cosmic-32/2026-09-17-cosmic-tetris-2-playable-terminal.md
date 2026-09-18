# Cosmic Tetris — Plan 2: Playable Terminal

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Plan 1 engine into a genuinely good playable terminal game: Bubble Tea event loop, keyboard, board/ghost/hold/next/stats rendering, adaptive layout with a too-small notice, pause / help / game-over screens, the `cosmic-tetris` binary with its full CLI, and golden layout tests.

**Architecture:** `internal/render` owns a tiny character grid (`Grid`) that every drawing function writes into; a frame is one `Grid` built from a pure `render.Input` snapshot and flattened to a styled string. `internal/app` is the Bubble Tea layer: it owns the clock, converts a single 60 Hz `FrameMsg` into `game.Advance(dt)`, maps keys to engine methods, and hands the renderer a snapshot. Rendering never mutates game state; the engine never learns about the terminal. FX hooks (`Sprites`, `Shake`, `Banner`, `Boot`) exist as empty fields on `render.Input` for Plan 3 to fill.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2` v2.0.9, `charm.land/lipgloss/v2` v2.0.6, `charm.land/bubbles/v2` v2.2.1, `github.com/charmbracelet/x/ansi` (test-only, for one strip assertion).

**Spec:** `design.md` (this plan implements §4, §5 rendering, §8, §10 rendering, §25, §26, §27 plumbing, §28 final card, §30, §31, §32, §33, §34, §36, §37, §39, §41, §46, and pinned decisions §49.3, §49.4, §49.5 flag surface, §49.7)

**Depends on:** `plans/2026-09-17-cosmic-tetris-1-engine.md` (the whole `internal/game` API, summarized at the end of that plan).

## Global Constraints

- Imports use the `charm.land` paths (§3): `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`. Add them with `go get charm.land/bubbletea/v2@latest charm.land/lipgloss/v2@latest charm.land/bubbles/v2@latest`.
- Do not wrap Bubble Tea in a homegrown framework (§3). `app.Model` implements `tea.Model` directly: `Init() tea.Cmd`, `Update(tea.Msg) (tea.Model, tea.Cmd)`, `View() tea.View`.
- Bubble Tea v2 specifics: key events arrive as `tea.KeyPressMsg` (a `tea.Key` with `Code rune` and `Text string`; `String()` gives `"left"`, `"h"`, `"space"`); `View()` returns a `tea.View` — build it with `tea.NewView(s)` and set `AltScreen = true`; leave `Cursor` nil so no cursor blinks over the board.
- `internal/render` must not import `internal/app` (that would be a cycle). The display-phase enum therefore lives in `render` as `render.Phase`, and `app.Model.State` is of that type — this is how §34's `AppState` is spelled.
- One animation clock only (§36): a single `tea.Tick` at 16ms producing `FrameMsg`. No second timer, no goroutine per frame or particle (§38).
- Rendering is pure: `render.Render(in Input) string` and every `Draw*` helper take the game by pointer but must not call any mutating engine method.
- Cell geometry (§5, §49.4): one logical cell is **2 terminal columns × 1 terminal row**. Blocks are `██` (`[]` in ASCII), ghosts `░░` (`··` in ASCII). Pieces use a bright foreground on filled glyphs — never a background pair (§49.4). The active piece renders one step brighter than locked cells.
  - Note: §49.4's ASCII ghost `··` is U+00B7, not strictly ASCII, and §32 asks ASCII mode to avoid special Unicode. §49 wins, so ship `··`; it is single-width and safe in any UTF-8 terminal. `Glyphs.Ghost` is one string constant, so `..` is a one-line change if a terminal ever objects.
- Only the visible rows render: board rows `y = 2..21`. Cells of the active piece in the hidden rows are clipped, never drawn above the board.
- Minimum usable size is 40 × 24 (§31). Below that, the too-small notice, live on resize, never a crash.
- Golden files live in `internal/render/testdata/*.golden` and are regenerated with `go test ./internal/render/ -update`.
- Run `gofmt -l .` before every commit; it must print nothing.

## Review Focus

Five failure modes the spec implies but no task's own tests would otherwise exercise. Each has a test added to the task that owns the code.

1. **A terminal reporting 0×0 or 1×1** (some emulators do this mid-resize, and Bubble Tea sends the first `WindowSizeMsg` before anything is drawn) must render the too-small notice, not divide by zero or index a negative-width grid. (Task 4)
2. **A very large terminal** (300 × 120) must centre the same fixed-size chrome without stretching the board or writing outside the grid. (Task 4)
3. **A score that outgrows its HUD field** (8+ digits, reachable per §45's "NUMBER BECAME BIGGER") must not push the side column wider and shift the board. (Task 6)
4. **A frame delivered after a long stall** (laptop suspend: `dt` of tens of seconds) must be clamped before reaching `Advance`, so the player does not lose four pieces at once on wake. (Task 7)
5. **Every supported terminal size renders without overlap or stray writes** — one property test sweeps widths 40..120 × heights 24..60, asserting each row's rendered width never exceeds the terminal width and the board interior contains only board glyphs. (Task 9)

---

## File Structure

| File | Responsibility |
|---|---|
| `internal/render/grid.go` | `Grid` character buffer, `Rect`, clipped writes, plain and styled flattening. |
| `internal/render/palette.go` | `Mode`, `Glyphs`, `Palette` — all colors and glyph choices in one place. |
| `internal/render/layout.go` | `Phase`, size tiers, chrome ladder (§49.3), rects for board/left/right/mission/controls, too-small notice. |
| `internal/render/board.go` | Board border, locked cells, ghost, active piece. |
| `internal/render/hud.go` | HOLD, NEXT, stats, mission-control line, controls line, mini-piece drawing. |
| `internal/render/overlay.go` | Centred panels: pause, help, game-over card. |
| `internal/render/render.go` | `Input`, `Sprite`, `Render`, `RenderGrid` — the §37 pipeline order. |
| `internal/app/keys.go` | `KeyMap` (also a `help.KeyMap`). |
| `internal/app/messages.go` | `FrameMsg`, `frameCmd`. |
| `internal/app/model.go` | `Model`, `Options`, `New`, `Init`, `View`. |
| `internal/app/update.go` | `Update`: keys, resize, frame/dt, pause, restart, quit. |
| `cmd/cosmic-tetris/main.go` | Flag parsing and program start. |

---

### Task 1: The `Grid` character buffer

**Files:**
- Create: `internal/render/grid.go`
- Test: `internal/render/grid_test.go`

**Interfaces:**
- Consumes: `charm.land/lipgloss/v2`.
- Produces:
  ```go
  type Rect struct{ X, Y, W, H int }
  func (r Rect) Contains(x, y int) bool
  func (r Rect) Inset(d int) Rect

  type Cell struct {
      Rune  rune
      Style *lipgloss.Style // nil means unstyled
  }

  type Grid struct{ W, H int /* cells []Cell */ }
  func NewGrid(w, h int) *Grid                              // w,h clamped to >= 0
  func (g *Grid) Set(x, y int, r rune, st *lipgloss.Style)   // out of bounds: silent no-op
  func (g *Grid) SetString(x, y int, s string, st *lipgloss.Style) int // returns columns advanced
  func (g *Grid) At(x, y int) Cell
  func (g *Grid) Fill(r Rect, ch rune, st *lipgloss.Style)
  func (g *Grid) PlainString() string   // runes only, per-row right-trimmed, rows joined with \n
  func (g *Grid) String() string        // styled: runs of identical *Style rendered together
  ```

- [ ] **Step 1: Write the failing test**

```go
package render

import (
	"strings"
	"testing"

	"charm.land/lipgloss/v2"
)

func TestGridSetAndPlainString(t *testing.T) {
	g := NewGrid(4, 2)
	g.Set(0, 0, 'a', nil)
	g.Set(3, 1, 'z', nil)
	if got, want := g.PlainString(), "a\n   z"; got != want {
		t.Fatalf("PlainString = %q, want %q", got, want)
	}
	if got := g.At(0, 0).Rune; got != 'a' {
		t.Fatalf("At(0,0) = %q, want 'a'", got)
	}
}

func TestGridClipsOutOfBoundsWrites(t *testing.T) {
	g := NewGrid(3, 2)
	g.Set(-1, 0, 'x', nil)
	g.Set(0, -1, 'x', nil)
	g.Set(3, 0, 'x', nil)
	g.Set(0, 2, 'x', nil)
	if strings.ContainsRune(g.PlainString(), 'x') {
		t.Fatalf("out-of-bounds writes leaked into the grid: %q", g.PlainString())
	}
	if n := g.SetString(2, 0, "abc", nil); n != 1 {
		t.Fatalf("SetString past the right edge advanced %d, want 1", n)
	}
	if got, want := g.PlainString(), "  a"; got != want {
		t.Fatalf("PlainString = %q, want %q", got, want)
	}
}

func TestGridZeroAndNegativeSize(t *testing.T) {
	for _, d := range [][2]int{{0, 0}, {-5, 3}, {3, -5}} {
		g := NewGrid(d[0], d[1])
		g.Set(0, 0, 'x', nil) // must not panic
		if g.PlainString() != "" {
			t.Fatalf("NewGrid(%d,%d) produced %q, want empty", d[0], d[1], g.PlainString())
		}
	}
}

func TestGridFillRect(t *testing.T) {
	g := NewGrid(4, 3)
	g.Fill(Rect{X: 1, Y: 1, W: 2, H: 2}, '#', nil)
	if got, want := g.PlainString(), "\n ##\n ##"; got != want {
		t.Fatalf("PlainString = %q, want %q", got, want)
	}
}

func TestGridStringCarriesStyles(t *testing.T) {
	st := lipgloss.NewStyle().Foreground(lipgloss.Color("#FF3D71"))
	g := NewGrid(3, 1)
	g.SetString(0, 0, "hey", &st)
	out := g.String()
	if !strings.Contains(out, "\x1b[") {
		t.Fatalf("String() emitted no escape sequences: %q", out)
	}
	if !strings.Contains(out, "hey") {
		t.Fatalf("String() lost the text: %q", out)
	}
}

func TestRectHelpers(t *testing.T) {
	r := Rect{X: 2, Y: 3, W: 4, H: 5}
	if !r.Contains(2, 3) || !r.Contains(5, 7) || r.Contains(6, 7) || r.Contains(1, 3) {
		t.Fatal("Contains is wrong at the edges")
	}
	if got, want := r.Inset(1), (Rect{X: 3, Y: 4, W: 2, H: 3}); got != want {
		t.Fatalf("Inset(1) = %+v, want %+v", got, want)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go get charm.land/lipgloss/v2@latest && go test ./internal/render/ -v`
Expected: FAIL — `undefined: NewGrid`.

- [ ] **Step 3: Implement `internal/render/grid.go`**

Back the grid with a flat `[]Cell` of `W*H`, spaces by default. `SetString` iterates runes (not bytes) and stops at the right edge. `String()` walks each row accumulating a run of cells sharing the same `*Style` pointer, rendering each run with one `Style.Render` call (nil style: emit the raw runes) — this keeps escape sequences per frame proportional to style changes, not cells (§38).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add go.mod go.sum internal/render/grid.go internal/render/grid_test.go
git commit -m "feat(render): clipped character grid with styled flattening"
```

---

### Task 2: Modes, glyphs, and palette

**Files:**
- Create: `internal/render/palette.go`
- Test: `internal/render/palette_test.go`

**Interfaces:**
- Consumes: `game.PieceKind`, `game.AllKinds`.
- Produces:
  ```go
  type Mode int
  const (ModeFull Mode = iota; ModeReduced; ModeASCII)

  type Glyphs struct {
      Block   string // "██" / "[]"
      Ghost   string // "░░" / "··"
      Empty   string // "  "
      Border  [6]string // TL,TR,BL,BR,H,V — double-line box, ASCII "+ + + + - |"
      Comet   string // "☄" / ">"
      Star    [3]string // far, mid, near default glyphs (Plan 3 uses these too)
  }
  func GlyphsFor(mode Mode) Glyphs

  type Palette struct {
      Active [7]lipgloss.Style // bright, for the falling piece
      Locked [7]lipgloss.Style // one step dimmer, for committed cells
      Ghost  lipgloss.Style
      Border lipgloss.Style
      Title  lipgloss.Style
      Label  lipgloss.Style
      Value  lipgloss.Style
      Mission lipgloss.Style
      Banner lipgloss.Style
      Dim    lipgloss.Style
  }
  func NewPalette(mode Mode) *Palette
  func (p *Palette) PieceStyle(k game.PieceKind, active bool) *lipgloss.Style
  ```

- [ ] **Step 1: Write the failing test**

```go
package render

import (
	"testing"

	"cosmic-tetris/internal/game"
)

func TestGlyphsPerMode(t *testing.T) {
	full := GlyphsFor(ModeFull)
	if full.Block != "██" || full.Ghost != "░░" {
		t.Fatalf("full glyphs = %q/%q, want ██/░░", full.Block, full.Ghost)
	}
	if GlyphsFor(ModeReduced).Block != full.Block {
		t.Fatal("reduced mode keeps the Unicode block glyph")
	}
	ascii := GlyphsFor(ModeASCII)
	if ascii.Block != "[]" || ascii.Ghost != "··" {
		t.Fatalf("ascii glyphs = %q/%q, want []/·· (§49.4)", ascii.Block, ascii.Ghost)
	}
	for _, g := range []Glyphs{full, GlyphsFor(ModeReduced), ascii} {
		if len([]rune(g.Block)) != 2 || len([]rune(g.Ghost)) != 2 || len([]rune(g.Empty)) != 2 {
			t.Fatalf("every cell glyph must be exactly 2 columns: %+v", g)
		}
	}
}

func TestPaletteHasADistinctStyleForEveryKind(t *testing.T) {
	p := NewPalette(ModeFull)
	seen := map[string]game.PieceKind{}
	for _, k := range game.AllKinds {
		fg := p.PieceStyle(k, true).GetForeground()
		if fg == nil {
			t.Fatalf("%v has no foreground color", k)
		}
		key := colorKey(fg)
		if prev, dup := seen[key]; dup {
			t.Fatalf("%v shares its color with %v", k, prev)
		}
		seen[key] = k
	}
}

func TestActiveIsBrighterThanLocked(t *testing.T) {
	p := NewPalette(ModeFull)
	for _, k := range game.AllKinds {
		if colorKey(p.PieceStyle(k, true).GetForeground()) == colorKey(p.PieceStyle(k, false).GetForeground()) {
			t.Fatalf("%v: active and locked styles are identical (§49.4 wants active brighter)", k)
		}
	}
}

func TestASCIIPaletteAvoidsTruecolor(t *testing.T) {
	p := NewPalette(ModeASCII)
	for _, k := range game.AllKinds {
		if got := colorKey(p.PieceStyle(k, true).GetForeground()); len(got) > 0 && got[0] == '#' {
			t.Fatalf("%v uses a hex color in ASCII mode: %s", k, got)
		}
	}
}
```

Add a small test helper in the same file:

```go
func colorKey(c any) string {
	if c == nil {
		return ""
	}
	return lipgloss.NewStyle().Foreground(c.(color.Color)).Render("x")
}
```

(imports: `image/color`, `charm.land/lipgloss/v2`. If `GetForeground` already returns `color.Color`, drop the assertion.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'Glyph|Palette|Active|ASCII' -v`
Expected: FAIL — `undefined: GlyphsFor`.

- [ ] **Step 3: Implement `internal/render/palette.go`**

Neon space palette (§26), pinned. Full and Reduced use these hex values — Bubble Tea's color profile downsamples for 256-color terminals, so Reduced differs from Full only in Plan 3's gradient step count:

```text
kind   active     locked
I      #22E4F7    #0E7C89
J      #3B6BFF    #1E3A99
L      #FF8A2B    #99511A
O      #FFD34D    #99802E
S      #57F287    #2E8A4F
T      #A855F7    #62309A
Z      #FF3D71    #99244A
```

ASCII mode maps to ANSI indices instead: I `"14"`, J `"12"`, L `"3"`, O `"11"`, S `"10"`, T `"13"`, Z `"9"`; locked variants use the non-bright pair (`"6" "4" "3" "3" "2" "5" "1"`). Chrome styles: border `#8B5CF6`, title `#E8E8FF` bold, label `#6B7280`, value `#E8E8FF` bold, mission `#22E4F7`, banner `#FFD34D` bold, ghost `#3F4A63`, dim `#4B5563`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/render/palette.go internal/render/palette_test.go
git commit -m "feat(render): neon space palette and per-mode glyph sets"
```

---

### Task 3: Board panel — border, locked cells, ghost, active piece

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: `Grid`, `Rect`, `Palette`, `Glyphs` (Tasks 1–2); `game.Game`, `game.GhostY`.
- Produces:
  ```go
  const (
      BoardInnerW = game.BoardWidth * 2 // 20 terminal columns
      BoardInnerH = game.VisibleRows    // 20 terminal rows
      BoardOuterW = BoardInnerW + 2     // 22
      BoardOuterH = BoardInnerH + 2     // 22
  )

  func DrawBoardFrame(g *Grid, r Rect, p *Palette, gl Glyphs, border *lipgloss.Style)
  func DrawLockedCells(g *Grid, inner Rect, b *game.Board, p *Palette, gl Glyphs)
  func DrawGhost(g *Grid, inner Rect, gm *game.Game, p *Palette, gl Glyphs)
  func DrawActive(g *Grid, inner Rect, gm *game.Game, p *Palette, gl Glyphs)
  // cellRect maps a board coordinate to the grid: x = inner.X + bx*2, y = inner.Y + by - game.HiddenRows
  ```
  `border` is a style override so Plan 3 can flash the border without touching this code; nil means `p.Border`.

- [ ] **Step 1: Write the failing test**

```go
package render

import (
	"strings"
	"testing"

	"cosmic-tetris/internal/game"
)

func boardTestGrid() (*Grid, Rect, Rect, *Palette, Glyphs) {
	g := NewGrid(BoardOuterW, BoardOuterH)
	outer := Rect{X: 0, Y: 0, W: BoardOuterW, H: BoardOuterH}
	return g, outer, outer.Inset(1), NewPalette(ModeFull), GlyphsFor(ModeFull)
}

func TestBoardFrameGeometry(t *testing.T) {
	g, outer, _, p, gl := boardTestGrid()
	DrawBoardFrame(g, outer, p, gl, nil)
	rows := strings.Split(g.PlainString(), "\n")
	if len(rows) != BoardOuterH {
		t.Fatalf("frame is %d rows, want %d", len(rows), BoardOuterH)
	}
	top := []rune(rows[0])
	if len(top) != BoardOuterW {
		t.Fatalf("top border is %d columns, want %d", len(top), BoardOuterW)
	}
	if string(top[0]) != gl.Border[0] || string(top[len(top)-1]) != gl.Border[1] {
		t.Fatalf("top corners = %q..%q", top[0], top[len(top)-1])
	}
	for _, r := range rows[1 : len(rows)-1] {
		runes := []rune(r)
		if string(runes[0]) != gl.Border[5] {
			t.Fatalf("row %q does not start with the vertical border glyph", r)
		}
	}
}

func TestLockedCellsRenderTwoColumnsWide(t *testing.T) {
	g, outer, inner, p, gl := boardTestGrid()
	DrawBoardFrame(g, outer, p, gl, nil)
	var b game.Board
	b.Cells[game.BoardHeight-1][0] = game.Cell{Filled: true, Kind: game.KindZ}
	b.Cells[game.HiddenRows][game.BoardWidth-1] = game.Cell{Filled: true, Kind: game.KindI}
	DrawLockedCells(g, inner, &b, p, gl)
	rows := strings.Split(g.PlainString(), "\n")
	bottom := []rune(rows[BoardOuterH-2])
	if string(bottom[1:3]) != gl.Block {
		t.Fatalf("bottom-left cell = %q, want %q", string(bottom[1:3]), gl.Block)
	}
	top := []rune(rows[1])
	if string(top[1+(game.BoardWidth-1)*2:1+game.BoardWidth*2]) != gl.Block {
		t.Fatalf("top-right visible cell missing: %q", string(top))
	}
}

func TestHiddenRowsAreNotDrawn(t *testing.T) {
	g, outer, inner, p, gl := boardTestGrid()
	DrawBoardFrame(g, outer, p, gl, nil)
	var b game.Board
	for x := 0; x < game.BoardWidth; x++ {
		b.Cells[0][x] = game.Cell{Filled: true, Kind: game.KindO}
		b.Cells[1][x] = game.Cell{Filled: true, Kind: game.KindO}
	}
	DrawLockedCells(g, inner, &b, p, gl)
	if strings.Contains(g.PlainString(), gl.Block) {
		t.Fatal("cells in the hidden rows must not render")
	}
}

func TestGhostSitsAtTheLandingPositionAndActiveWinsOnTop(t *testing.T) {
	g, outer, inner, p, gl := boardTestGrid()
	gm := game.New(1)
	gm.Active = game.Piece{Kind: game.KindO, Rotation: 0, X: 4, Y: game.HiddenRows}
	DrawBoardFrame(g, outer, p, gl, nil)
	DrawGhost(g, inner, gm, p, gl)
	DrawActive(g, inner, gm, p, gl)
	rows := strings.Split(g.PlainString(), "\n")
	ghostRow := []rune(rows[BoardOuterH-2])
	if got := string(ghostRow[1+4*2 : 1+5*2]); got != gl.Ghost {
		t.Fatalf("ghost bottom row = %q, want %q", got, gl.Ghost)
	}
	activeRow := []rune(rows[1])
	if got := string(activeRow[1+4*2 : 1+5*2]); got != gl.Block {
		t.Fatalf("active piece row = %q, want %q", got, gl.Block)
	}
}

func TestGhostNeverOverwritesLockedCells(t *testing.T) {
	g, outer, inner, p, gl := boardTestGrid()
	gm := game.New(1)
	gm.Active = game.Piece{Kind: game.KindI, Rotation: 0, X: 3, Y: game.HiddenRows}
	for x := 0; x < game.BoardWidth; x++ {
		gm.Board.Cells[game.BoardHeight-1][x] = game.Cell{Filled: true, Kind: game.KindT}
	}
	DrawBoardFrame(g, outer, p, gl, nil)
	DrawLockedCells(g, inner, &gm.Board, p, gl)
	DrawGhost(g, inner, gm, p, gl)
	bottom := []rune(strings.Split(g.PlainString(), "\n")[BoardOuterH-2])
	if got := string(bottom[1:3]); got != gl.Block {
		t.Fatalf("locked row was overwritten by the ghost: %q", got)
	}
}

func TestActivePieceCellsAboveTheBoardAreClipped(t *testing.T) {
	g, outer, inner, p, gl := boardTestGrid()
	gm := game.New(1)
	gm.Active = game.Piece{Kind: game.KindI, Rotation: 1, X: 4, Y: 0} // spans hidden and visible rows
	DrawBoardFrame(g, outer, p, gl, nil)
	DrawActive(g, inner, gm, p, gl)
	rows := strings.Split(g.PlainString(), "\n")
	if got := string([]rune(rows[0])[0]); got != gl.Border[0] {
		t.Fatalf("the piece drew over the top border: %q", got)
	}
	if len(strings.Split(g.PlainString(), "\n")) != BoardOuterH {
		t.Fatal("the piece added rows to the grid")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run Board -v`
Expected: FAIL — `undefined: DrawBoardFrame`.

- [ ] **Step 3: Implement `internal/render/board.go`**

Draw order inside a frame is the caller's business (§37 fixes it: locked → ghost → active). `DrawGhost` computes `dy = gm.GhostY() - gm.Active.Y`, offsets the active piece's cells by it, and skips any target cell whose board coordinate is already filled or is also occupied by the active piece. Every draw runs through `Grid.Set`, so clipping is automatic; also skip board rows `< game.HiddenRows` explicitly so nothing lands on the border.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): board frame, locked cells, ghost, and active piece"
```

---

### Task 4: Adaptive layout, chrome ladder, and the too-small notice

**Files:**
- Create: `internal/render/layout.go`
- Test: `internal/render/layout_test.go`

**Interfaces:**
- Consumes: `Rect`, board constants (Task 3).
- Produces:
  ```go
  type Phase int
  const (PhaseBoot Phase = iota; PhasePlaying; PhasePaused; PhaseHelp; PhaseGameOver)

  type Tier int
  const (TierTooSmall Tier = iota; TierSmall; TierMedium; TierWide)

  const (MinCols = 40; MinRows = 24; SideColW = 12; GapW = 2)

  type Layout struct {
      Tier      Tier
      Width     int
      Height    int
      Board     Rect // outer, 22x22
      Inner     Rect // Board.Inset(1)
      Left      Rect // zero W when the tier has no left column
      Right     Rect
      Title     Rect // zero H when dropped
      Mission   Rect // zero H when dropped
      Controls  Rect
      Frame     bool // draw the outer rounded frame
      ShowHold  bool
      ShowLabels bool
      NextCount int  // 5 wide, 3 medium and small
  }

  func Compute(width, height int) Layout
  func DrawTooSmall(g *Grid, width, height int, p *Palette) // §31 notice
  ```

- [ ] **Step 1: Write the failing test**

```go
package render

import (
	"strings"
	"testing"
)

func TestTierByWidth(t *testing.T) {
	cases := []struct {
		w, h int
		tier Tier
	}{
		{39, 30, TierTooSmall},
		{50, 23, TierTooSmall},
		{40, 24, TierSmall},
		{43, 24, TierSmall},
		{44, 24, TierMedium},
		{51, 40, TierMedium},
		{52, 40, TierWide},
		{200, 60, TierWide},
	}
	for _, c := range cases {
		if got := Compute(c.w, c.h).Tier; got != c.tier {
			t.Errorf("Compute(%d,%d).Tier = %v, want %v", c.w, c.h, got, c.tier)
		}
	}
}

// Review Focus 1: degenerate sizes must not panic or produce negative rects.
func TestComputeSurvivesDegenerateSizes(t *testing.T) {
	for _, c := range [][2]int{{0, 0}, {1, 1}, {-4, 10}, {80, 0}} {
		l := Compute(c[0], c[1])
		if l.Tier != TierTooSmall {
			t.Fatalf("Compute(%d,%d) tier = %v, want TierTooSmall", c[0], c[1], l.Tier)
		}
		for _, r := range []Rect{l.Board, l.Inner, l.Left, l.Right, l.Title, l.Mission, l.Controls} {
			if r.W < 0 || r.H < 0 {
				t.Fatalf("Compute(%d,%d) produced a negative rect %+v", c[0], c[1], r)
			}
		}
	}
	g := NewGrid(0, 0)
	DrawTooSmall(g, 0, 0, NewPalette(ModeFull)) // must not panic
}

// Review Focus 2: a huge terminal centres fixed-size chrome.
func TestHugeTerminalCentresFixedChrome(t *testing.T) {
	l := Compute(300, 120)
	if l.Board.W != BoardOuterW || l.Board.H != BoardOuterH {
		t.Fatalf("board = %dx%d, want %dx%d — the board never stretches", l.Board.W, l.Board.H, BoardOuterW, BoardOuterH)
	}
	content := SideColW + GapW + BoardOuterW + GapW + SideColW
	if want := (300 - content) / 2; l.Left.X != want {
		t.Fatalf("left column X = %d, want %d (centred)", l.Left.X, want)
	}
	if l.Board.X+l.Board.W > 300 || l.Controls.Y+l.Controls.H > 120 {
		t.Fatal("chrome extends past the terminal")
	}
}

func TestChromeLadderByHeight(t *testing.T) {
	// §49.3: title border goes first, then mission control, then stats labels.
	l27 := Compute(80, 27)
	if !l27.Frame || l27.Title.H == 0 || l27.Mission.H == 0 {
		t.Fatalf("27 rows should keep frame, title, and mission: %+v", l27)
	}
	l25 := Compute(80, 25)
	if l25.Frame {
		t.Fatal("25 rows must drop the outer frame")
	}
	if l25.Mission.H == 0 || l25.Controls.H == 0 {
		t.Fatal("25 rows must keep mission control and controls")
	}
	l24 := Compute(80, 24)
	if l24.Title.H != 0 {
		t.Fatal("24 rows must have no title row")
	}
	if l24.Mission.H == 0 {
		t.Fatal("mission control outranks the title (§49.3)")
	}
	// The ladder is defined below the supported minimum too, so an odd terminal
	// size degrades instead of dividing by zero. The app still shows the notice.
	l23 := chromeFor(23)
	if l23.Mission.H != 0 {
		t.Fatal("at 23 rows mission control is the next thing to drop")
	}
	if l23.Controls.H == 0 {
		t.Fatal("controls are one of the last two things standing (§49.3)")
	}
}

func TestSmallTierDropsLabelsAndHoldButKeepsNext(t *testing.T) {
	l := Compute(40, 24)
	if l.ShowLabels {
		t.Fatal("small tier shows stat values without labels (§49.3)")
	}
	if l.ShowHold {
		t.Fatal("small tier drops the HOLD panel (§31 priority order)")
	}
	if l.NextCount != 3 {
		t.Fatalf("NextCount = %d, want 3 at small sizes (§49.3)", l.NextCount)
	}
	if l.Right.X < l.Board.X+l.Board.W {
		t.Fatal("NEXT must sit beside the board, never above or below it (§49.3)")
	}
	if l.Right.X+l.Right.W > 40 {
		t.Fatalf("right column overflows: X=%d W=%d", l.Right.X, l.Right.W)
	}
}

func TestWideTierHasBothColumnsAndFiveNext(t *testing.T) {
	l := Compute(80, 30)
	if !l.ShowHold || !l.ShowLabels || l.NextCount != 5 {
		t.Fatalf("wide tier = %+v, want hold, labels, and 5 next pieces", l)
	}
	if l.Left.X+l.Left.W > l.Board.X {
		t.Fatal("left column overlaps the board")
	}
	if l.Board.X+l.Board.W > l.Right.X {
		t.Fatal("board overlaps the right column")
	}
}

func TestNoRectsOverlapAcrossSizes(t *testing.T) {
	for w := MinCols; w <= 120; w += 7 {
		for h := MinRows; h <= 60; h += 5 {
			l := Compute(w, h)
			rects := map[string]Rect{"board": l.Board, "left": l.Left, "right": l.Right,
				"title": l.Title, "mission": l.Mission, "controls": l.Controls}
			for an, a := range rects {
				if a.W == 0 || a.H == 0 {
					continue
				}
				if a.X < 0 || a.Y < 0 || a.X+a.W > w || a.Y+a.H > h {
					t.Fatalf("%dx%d: %s %+v is outside the terminal", w, h, an, a)
				}
				for bn, b := range rects {
					if an >= bn || b.W == 0 || b.H == 0 {
						continue
					}
					if a.X < b.X+b.W && b.X < a.X+a.W && a.Y < b.Y+b.H && b.Y < a.Y+a.H {
						t.Fatalf("%dx%d: %s %+v overlaps %s %+v", w, h, an, a, bn, b)
					}
				}
			}
		}
	}
}

func TestTooSmallNoticeReportsBothSizes(t *testing.T) {
	g := NewGrid(34, 19)
	DrawTooSmall(g, 34, 19, NewPalette(ModeFull))
	out := g.PlainString()
	for _, want := range []string{"THIS UNIVERSE IS TOO SMALL", "resize terminal to continue", "34", "19", "40", "24"} {
		if !strings.Contains(out, want) {
			t.Errorf("notice is missing %q:\n%s", want, out)
		}
	}
	for _, line := range strings.Split(out, "\n") {
		if len([]rune(line)) > 34 {
			t.Errorf("notice line overflows 34 columns: %q", line)
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'Tier|Compute|Chrome|Small|Wide|NoRects|TooSmall' -v`
Expected: FAIL — `undefined: Compute`.

- [ ] **Step 3: Implement `internal/render/layout.go`**

Pinned tiers (content widths in terminal columns; leftover width is absorbed by centring):

```text
TierWide   cols >= 52 : left(12) gap(2) board(22) gap(2) right(12) = 50, hold + labels + NEXT x5
TierMedium cols >= 44 : board(22) gap(2) right(12) = 36,             hold + labels + NEXT x3
TierSmall  cols >= 40 : board(22) gap(1) right(12) = 35,             no hold, values only, NEXT x3
TierTooSmall           : cols < 40 or rows < 24
```

Height ladder — factor it into `chromeFor(rows int) Layout` (unexported, tested directly) so §49.3's order is one readable function:

```text
rows >= 27 : outer frame (2) + title (1) + board (22) + mission (1) + controls (1)
rows 25-26 : title (1) + board (22) + mission (1) + controls (1)      -- frame dropped
rows 24    : board (22) + mission (1) + controls (1)                  -- title dropped
rows 23    : board (22) + controls (1)                                -- mission dropped
rows < 23  : board + controls, clipped by the grid                    -- app shows the notice below 24
```

Vertically centre the block within the available rows. `Compute` returns `Layout{Tier: TierTooSmall}` with all-zero rects when either dimension is below the minimum, and clamps negative inputs to 0 first.

`DrawTooSmall` centres the four lines from §31 (`THIS UNIVERSE IS TOO SMALL`, blank, `resize terminal to continue`, blank, `current: W × H`, `needed: approximately 40 × 24`) and relies on `Grid.Set` clipping for terminals too narrow even for that.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/render/layout.go internal/render/layout_test.go
git commit -m "feat(render): adaptive layout tiers, chrome ladder, too-small notice"
```

---

### Task 5: Overlay panels — pause, help, game over

**Files:**
- Create: `internal/render/overlay.go`
- Test: `internal/render/overlay_test.go`

**Interfaces:**
- Consumes: `Grid`, `Rect`, `Palette`.
- Produces:
  ```go
  func DrawPanel(g *Grid, area Rect, title string, lines []string, p *Palette, gl Glyphs)
  func DrawPause(g *Grid, area Rect, p *Palette, gl Glyphs)
  func DrawHelp(g *Grid, area Rect, body string, p *Palette, gl Glyphs) // body from bubbles help
  func DrawGameOver(g *Grid, area Rect, score, lines, level int, p *Palette, gl Glyphs)
  ```
  `DrawPanel` centres a rounded box inside `area` and is the single implementation the other three call.

- [ ] **Step 1: Write the failing test**

```go
package render

import (
	"strings"
	"testing"
)

func TestPausePanelText(t *testing.T) {
	g := NewGrid(60, 24)
	DrawPause(g, Rect{X: 0, Y: 0, W: 60, H: 24}, NewPalette(ModeFull), GlyphsFor(ModeFull))
	out := g.PlainString()
	for _, want := range []string{"TEMPORAL SUSPENSION", "SPACE IS PAUSED", "p  resume"} {
		if !strings.Contains(out, want) {
			t.Errorf("pause overlay is missing %q:\n%s", want, out)
		}
	}
}

func TestGameOverPanelShowsFinalNumbers(t *testing.T) {
	g := NewGrid(60, 24)
	DrawGameOver(g, Rect{X: 0, Y: 0, W: 60, H: 24}, 483200, 127, 13, NewPalette(ModeFull), GlyphsFor(ModeFull))
	out := g.PlainString()
	for _, want := range []string{"UNIVERSE EXPIRED", "483,200", "127", "13", "REBOOT UNIVERSE", "ACCEPT COSMIC DEATH"} {
		if !strings.Contains(out, want) {
			t.Errorf("game over panel is missing %q:\n%s", want, out)
		}
	}
}

func TestHelpPanelWrapsTheBody(t *testing.T) {
	g := NewGrid(60, 24)
	DrawHelp(g, Rect{X: 0, Y: 0, W: 60, H: 24}, "← → move\nSPACE YEET", NewPalette(ModeFull), GlyphsFor(ModeFull))
	out := g.PlainString()
	if !strings.Contains(out, "FLIGHT MANUAL") || !strings.Contains(out, "SPACE YEET") {
		t.Fatalf("help overlay is wrong:\n%s", out)
	}
}

func TestPanelNeverDrawsOutsideItsArea(t *testing.T) {
	g := NewGrid(40, 24)
	area := Rect{X: 5, Y: 3, W: 20, H: 8}
	long := []string{strings.Repeat("X", 200), strings.Repeat("Y", 200)}
	DrawPanel(g, area, "A VERY LONG PANEL TITLE THAT DOES NOT FIT", long, NewPalette(ModeFull), GlyphsFor(ModeFull))
	rows := strings.Split(g.PlainString(), "\n")
	for y, row := range rows {
		for x, r := range []rune(row) {
			if r == ' ' {
				continue
			}
			if !area.Contains(x, y) {
				t.Fatalf("panel wrote %q at (%d,%d), outside %+v", r, x, y, area)
			}
		}
	}
}

func TestPanelInATinyAreaDoesNotPanic(t *testing.T) {
	g := NewGrid(10, 3)
	DrawPanel(g, Rect{X: 0, Y: 0, W: 2, H: 1}, "T", []string{"x"}, NewPalette(ModeFull), GlyphsFor(ModeFull))
	DrawPanel(g, Rect{}, "T", []string{"x"}, NewPalette(ModeFull), GlyphsFor(ModeFull))
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'Pause|GameOver|Help|Panel' -v`
Expected: FAIL — `undefined: DrawPause`.

- [ ] **Step 3: Implement `internal/render/overlay.go`**

`DrawPanel` sizes the box to the widest line (capped at `area.W`), centres it in `area`, truncates lines that still do not fit, and writes every rune through `Grid.Set` with an explicit `area.Contains` guard so a box larger than its area is clipped rather than leaking. Game-over score formatting uses thousands separators (`483,200`) — a small local `formatThousands(int) string` helper, reused by the HUD in Task 6. Panel copy comes verbatim from §28, §30, §39.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/render/overlay.go internal/render/overlay_test.go
git commit -m "feat(render): pause, help, and game-over overlay panels"
```

---

### Task 6: HUD — hold, next, stats, mission line, controls

**Files:**
- Create: `internal/render/hud.go`
- Test: `internal/render/hud_test.go`

**Interfaces:**
- Consumes: `Grid`, `Layout`, `Palette`, `Glyphs`, `formatThousands` (Task 5); `game.PieceKind`, `game.SpawnPiece`.
- Produces:
  ```go
  func DrawMiniPiece(g *Grid, at Rect, k game.PieceKind, p *Palette, gl Glyphs) // rotation 0, left-aligned, max 8x2
  func DrawHold(g *Grid, r Rect, held *game.PieceKind, canHold bool, p *Palette, gl Glyphs)
  func DrawNext(g *Grid, r Rect, next []game.PieceKind, count int, p *Palette, gl Glyphs)
  func DrawStats(g *Grid, r Rect, score, lines, level int, showLabels bool, p *Palette, gl Glyphs)
  func DrawTitle(g *Grid, r Rect, seed int64, p *Palette, gl Glyphs) // "✦ COSMIC TETRIS" + "LOCAL UNIVERSE %04X"
  func DrawMission(g *Grid, r Rect, msg string, p *Palette, gl Glyphs) // "☄ MISSION CONTROL: msg", truncated with "…"
  func DrawControls(g *Grid, r Rect, p *Palette, gl Glyphs)            // longest variant that fits
  ```

- [ ] **Step 1: Write the failing test**

```go
package render

import (
	"strings"
	"testing"

	"cosmic-tetris/internal/game"
)

func hudGrid() (*Grid, *Palette, Glyphs) {
	return NewGrid(60, 24), NewPalette(ModeFull), GlyphsFor(ModeFull)
}

func TestMiniPieceFitsItsBox(t *testing.T) {
	g, p, gl := hudGrid()
	box := Rect{X: 1, Y: 1, W: 8, H: 2}
	for _, k := range game.AllKinds {
		g2 := NewGrid(60, 24)
		DrawMiniPiece(g2, box, k, p, gl)
		for y, row := range strings.Split(g2.PlainString(), "\n") {
			for x, r := range []rune(row) {
				if r != ' ' && !box.Contains(x, y) {
					t.Fatalf("%v drew %q at (%d,%d), outside %+v", k, r, x, y, box)
				}
			}
		}
	}
	DrawMiniPiece(g, box, game.KindO, p, gl)
	if !strings.Contains(g.PlainString(), gl.Block) {
		t.Fatal("mini piece drew nothing")
	}
}

func TestHoldPanelEmptyAndFilled(t *testing.T) {
	g, p, gl := hudGrid()
	DrawHold(g, Rect{X: 0, Y: 0, W: SideColW, H: 4}, nil, true, p, gl)
	if !strings.Contains(g.PlainString(), "HOLD") {
		t.Fatal("HOLD label missing")
	}
	if strings.Contains(g.PlainString(), gl.Block) {
		t.Fatal("an empty hold must not draw a piece")
	}
	g2, _, _ := hudGrid()
	k := game.KindT
	DrawHold(g2, Rect{X: 0, Y: 0, W: SideColW, H: 4}, &k, false, p, gl)
	if !strings.Contains(g2.PlainString(), gl.Block) {
		t.Fatal("a filled hold must draw the piece")
	}
}

func TestNextDrawsExactlyCountPieces(t *testing.T) {
	g, p, gl := hudGrid()
	next := []game.PieceKind{game.KindI, game.KindO, game.KindT, game.KindS, game.KindZ}
	DrawNext(g, Rect{X: 0, Y: 0, W: SideColW, H: 16}, next, 3, p, gl)
	out := g.PlainString()
	if !strings.Contains(out, "NEXT") {
		t.Fatal("NEXT label missing")
	}
	rowsWithBlocks := 0
	for _, row := range strings.Split(out, "\n") {
		if strings.Contains(row, gl.Block) {
			rowsWithBlocks++
		}
	}
	if rowsWithBlocks == 0 || rowsWithBlocks > 3*2 {
		t.Fatalf("drew block rows for %d pieces, want at most 3", rowsWithBlocks/2)
	}
}

func TestNextToleratesAShortQueue(t *testing.T) {
	g, p, gl := hudGrid()
	DrawNext(g, Rect{X: 0, Y: 0, W: SideColW, H: 16}, []game.PieceKind{game.KindI}, 5, p, gl)
	if !strings.Contains(g.PlainString(), "NEXT") {
		t.Fatal("a short queue must still render the panel")
	}
}

func TestStatsLabelsCanBeDropped(t *testing.T) {
	g, p, gl := hudGrid()
	DrawStats(g, Rect{X: 0, Y: 0, W: SideColW, H: 9}, 129340, 42, 7, true, p, gl)
	out := g.PlainString()
	for _, want := range []string{"SCORE", "LINES", "LEVEL", "129,340", "042", "07"} {
		if !strings.Contains(out, want) {
			t.Errorf("labeled stats missing %q:\n%s", want, out)
		}
	}
	g2, _, _ := hudGrid()
	DrawStats(g2, Rect{X: 0, Y: 0, W: SideColW, H: 9}, 129340, 42, 7, false, p, gl)
	out2 := g2.PlainString()
	if strings.Contains(out2, "LINES") {
		t.Error("labels must be gone when showLabels is false (§49.3)")
	}
	if !strings.Contains(out2, "042") {
		t.Errorf("values must remain:\n%s", out2)
	}
}

// Review Focus 3: an eight-digit score must not widen the column.
func TestHugeScoreStaysInsideTheColumn(t *testing.T) {
	g, p, gl := hudGrid()
	r := Rect{X: 0, Y: 0, W: SideColW, H: 9}
	DrawStats(g, r, 999999999, 9999, 99, true, p, gl)
	for y, row := range strings.Split(g.PlainString(), "\n") {
		for x, ch := range []rune(row) {
			if ch != ' ' && !r.Contains(x, y) {
				t.Fatalf("stats wrote %q at (%d,%d), outside %+v", ch, x, y, r)
			}
		}
	}
}

func TestMissionLineTruncatesWithEllipsis(t *testing.T) {
	g, p, gl := hudGrid()
	r := Rect{X: 0, Y: 0, W: 30, H: 1}
	DrawMission(g, r, "WE HAVE EXCEEDED THE RECOMMENDED NUMBER OF BLOCKS", p, gl)
	line := strings.Split(g.PlainString(), "\n")[0]
	if len([]rune(line)) > 30 {
		t.Fatalf("mission line is %d columns, want <= 30: %q", len([]rune(line)), line)
	}
	if !strings.Contains(line, "MISSION CONTROL") {
		t.Fatalf("mission line lost its prefix: %q", line)
	}
	if !strings.HasSuffix(strings.TrimRight(line, " "), "…") {
		t.Fatalf("a truncated mission line must end with an ellipsis: %q", line)
	}
}

func TestControlsFitEveryWidth(t *testing.T) {
	p, gl := NewPalette(ModeFull), GlyphsFor(ModeFull)
	for w := 20; w <= 80; w++ {
		g := NewGrid(w, 1)
		DrawControls(g, Rect{X: 0, Y: 0, W: w, H: 1}, p, gl)
		line := strings.Split(g.PlainString(), "\n")[0]
		if len([]rune(line)) > w {
			t.Fatalf("width %d: controls line is %d columns: %q", w, len([]rune(line)), line)
		}
		if strings.TrimSpace(line) == "" {
			t.Fatalf("width %d: controls line is empty", w)
		}
	}
}

func TestTitleShowsSeedAsHexUniverse(t *testing.T) {
	g, p, gl := hudGrid()
	DrawTitle(g, Rect{X: 0, Y: 0, W: 60, H: 1}, 0x7F3A, p, gl)
	out := strings.Split(g.PlainString(), "\n")[0]
	if !strings.Contains(out, "COSMIC TETRIS") || !strings.Contains(out, "7F3A") {
		t.Fatalf("title = %q, want the game name and LOCAL UNIVERSE 7F3A", out)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'Mini|Hold|Next|Stats|Mission|Controls|Title' -v`
Expected: FAIL — `undefined: DrawMiniPiece`.

- [ ] **Step 3: Implement `internal/render/hud.go`**

Formats, pinned: score `formatThousands` (`129,340`), lines `%03d`, level `%02d`, universe `%04X` of `uint16(seed)`. Controls has three variants, longest-first, and `DrawControls` picks the widest that fits:

```text
"←→ move   ↑ rotate   ↓ descend   SPACE YEET   C hold   ? help"
"←→ ↑ ↓  SPACE yeet  C hold  ? help"
"? help"
```

ASCII mode replaces the arrows with `hjkl`; take the arrow glyphs from `Glyphs` rather than hardcoding them. Mini pieces draw the rotation-0 cells of `game.SpawnPiece(k)` normalised to the box's top-left.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/render/hud.go internal/render/hud_test.go
git commit -m "feat(render): hold, next, stats, mission, controls, title"
```

---

### Task 7: `render.Input` and the frame pipeline

**Files:**
- Create: `internal/render/render.go`
- Test: `internal/render/render_test.go`

**Interfaces:**
- Consumes: everything in `internal/render` so far.
- Produces:
  ```go
  type Sprite struct {
      X, Y  int             // absolute grid coordinates
      Glyph rune
      Style *lipgloss.Style
  }

  type Input struct {
      Game    *game.Game
      Width   int
      Height  int
      Mode    Mode
      Phase   Phase
      Mission string
      HelpBody string

      // Filled by Plan 3; zero values here mean "no effects".
      Stars       []Sprite // drawn before the board (§37 step 2)
      BoardFX     []Sprite // composited over the board interior (step 6)
      GlobalFX    []Sprite // composited over everything (step 9)
      Shake       Rect     // X,Y used as the board offset; W,H ignored
      Banner      string   // step 10
      BorderStyle *lipgloss.Style
      BootScreen  string   // when non-empty and Phase == PhaseBoot, replaces the frame
  }

  func RenderGrid(in Input) *Grid // tests read PlainString()
  func Render(in Input) string    // RenderGrid(in).String()
  ```
  The pipeline follows §37 exactly: layout → stars → locked board → ghost → active → board FX → border → hold/next/stats → global FX → banner → mission → controls, with overlays (pause/help/game over) last.

- [ ] **Step 1: Write the failing test**

```go
package render

import (
	"strings"
	"testing"

	"cosmic-tetris/internal/game"
)

func baseInput(w, h int) Input {
	return Input{Game: game.New(8675309), Width: w, Height: h, Mode: ModeFull,
		Phase: PhasePlaying, Mission: "NOMINALISH"}
}

func TestRenderGridMatchesTerminalSize(t *testing.T) {
	g := RenderGrid(baseInput(80, 30))
	if g.W != 80 || g.H != 30 {
		t.Fatalf("grid is %dx%d, want 80x30", g.W, g.H)
	}
	for _, row := range strings.Split(g.PlainString(), "\n") {
		if len([]rune(row)) > 80 {
			t.Fatalf("row exceeds the terminal width: %q", row)
		}
	}
}

func TestRenderTooSmallShowsTheNotice(t *testing.T) {
	out := RenderGrid(baseInput(30, 15)).PlainString()
	if !strings.Contains(out, "THIS UNIVERSE IS TOO SMALL") {
		t.Fatalf("expected the too-small notice:\n%s", out)
	}
	if strings.Contains(out, "MISSION CONTROL") {
		t.Fatal("the notice replaces the whole frame")
	}
}

func TestRenderIncludesEveryPipelineElement(t *testing.T) {
	in := baseInput(80, 30)
	out := RenderGrid(in).PlainString()
	for _, want := range []string{"COSMIC TETRIS", "HOLD", "NEXT", "SCORE", "LINES", "LEVEL", "MISSION CONTROL", "NOMINALISH", "help"} {
		if !strings.Contains(out, want) {
			t.Errorf("frame is missing %q:\n%s", want, out)
		}
	}
}

func TestRenderDoesNotMutateGameState(t *testing.T) {
	in := baseInput(80, 30)
	before := *in.Game
	Render(in)
	after := *in.Game
	if before.Board != after.Board || before.Active != after.Active ||
		before.Score != after.Score || before.GravityAccumulator != after.GravityAccumulator {
		t.Fatal("rendering mutated game state (§37)")
	}
}

func TestSpritesAreComposited(t *testing.T) {
	in := baseInput(80, 30)
	in.GlobalFX = []Sprite{{X: 0, Y: 0, Glyph: '✦'}}
	if !strings.Contains(RenderGrid(in).PlainString(), "✦") {
		t.Fatal("global FX sprites must be drawn")
	}
	in.GlobalFX = []Sprite{{X: -5, Y: -5, Glyph: 'Q'}, {X: 5000, Y: 5000, Glyph: 'Q'}}
	if strings.Contains(RenderGrid(in).PlainString(), "Q") {
		t.Fatal("off-grid sprites must be clipped")
	}
}

func TestBannerAndOverlaysByPhase(t *testing.T) {
	in := baseInput(80, 30)
	in.Banner = "✦ EVENT HORIZON ✦"
	if !strings.Contains(RenderGrid(in).PlainString(), "EVENT HORIZON") {
		t.Fatal("banner missing")
	}
	in.Phase = PhasePaused
	if !strings.Contains(RenderGrid(in).PlainString(), "TEMPORAL SUSPENSION") {
		t.Fatal("pause overlay missing")
	}
	in.Phase = PhaseHelp
	in.HelpBody = "SPACE YEET"
	if !strings.Contains(RenderGrid(in).PlainString(), "FLIGHT MANUAL") {
		t.Fatal("help overlay missing")
	}
	in.Phase = PhaseGameOver
	if !strings.Contains(RenderGrid(in).PlainString(), "UNIVERSE EXPIRED") {
		t.Fatal("game over panel missing")
	}
	in.Phase = PhaseBoot
	in.BootScreen = "UNIVERSE ONLINE"
	if got := RenderGrid(in).PlainString(); !strings.Contains(got, "UNIVERSE ONLINE") {
		t.Fatalf("boot screen missing:\n%s", got)
	}
}

func TestShakeOffsetsTheBoardWithoutLeaking(t *testing.T) {
	in := baseInput(80, 30)
	plain := RenderGrid(in).PlainString()
	in.Shake = Rect{X: 1, Y: -1}
	shaken := RenderGrid(in)
	if shaken.PlainString() == plain {
		t.Fatal("a shake offset must change the frame")
	}
	if shaken.W != 80 || shaken.H != 30 {
		t.Fatal("a shake must not resize the grid")
	}
	for _, row := range strings.Split(shaken.PlainString(), "\n") {
		if len([]rune(row)) > 80 {
			t.Fatalf("shake pushed a row past the terminal width: %q", row)
		}
	}
}

func TestASCIIModeUsesNoBlockGlyphs(t *testing.T) {
	in := baseInput(80, 30)
	in.Mode = ModeASCII
	out := RenderGrid(in).PlainString()
	if strings.Contains(out, "██") || strings.Contains(out, "╔") {
		t.Fatalf("ASCII mode leaked Unicode drawing glyphs:\n%s", out)
	}
	if !strings.Contains(out, "[]") {
		t.Fatalf("ASCII mode should draw pieces with []:\n%s", out)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run Render -v`
Expected: FAIL — `undefined: RenderGrid`.

- [ ] **Step 3: Implement `internal/render/render.go`**

Board-local drawing goes through an offset board rect (`layout.Board` shifted by `in.Shake.X/Y`, then clamped so the shifted rect stays inside the terminal). `BoardFX` sprites shift with the board; `GlobalFX` and `Stars` do not. `PhaseBoot` with a non-empty `BootScreen` renders only the centred boot text. Overlays draw last so nothing covers them.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/render/render.go internal/render/render_test.go
git commit -m "feat(render): frame pipeline over a pure Input snapshot"
```

---

### Task 8: Bubble Tea app — keys, clock, update, view

**Files:**
- Create: `internal/app/keys.go`
- Create: `internal/app/messages.go`
- Create: `internal/app/model.go`
- Create: `internal/app/update.go`
- Test: `internal/app/update_test.go`

**Interfaces:**
- Consumes: the whole engine API and `render.Input` / `render.Render` / `render.Phase`.
- Produces:
  ```go
  const FrameInterval = 16 * time.Millisecond
  const MaxFrameDT    = 100 * time.Millisecond // §36 clamp: a stalled process must not lose pieces

  type FrameMsg struct{ Now time.Time }
  func frameCmd() tea.Cmd // tea.Tick(FrameInterval, ...)

  type KeyMap struct {
      Left, Right, SoftDrop, RotateCW, RotateCCW, HardDrop, Hold, Pause, Restart, Help, Quit key.Binding
  }
  func DefaultKeyMap() KeyMap
  func (k KeyMap) ShortHelp() []key.Binding
  func (k KeyMap) FullHelp() [][]key.Binding

  type Options struct {
      Seed          int64
      Mode          render.Mode
      FXEnabled     bool
      ReducedMotion bool
  }

  type Model struct {
      Game  *game.Game
      Width, Height int
      State render.Phase
      LastFrame time.Time
      Keys  KeyMap
      Help  help.Model
      Opts  Options
      Mission string
      // Plan 3 adds: FX *fx.World
  }

  func New(opts Options) Model
  func (m Model) Init() tea.Cmd
  func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd)
  func (m Model) View() tea.View
  func (m Model) renderInput() render.Input // Plan 3 extends this
  ```
  Key bindings (§8): left `left h a`; right `right l d`; soft drop `down j s`; rotate CW `up k x w`; rotate CCW `z`; hard drop `space`; hold `c`; pause `p`; restart `r`; help `?`; quit `q esc ctrl+c`.

- [ ] **Step 1: Write the failing test**

```go
package app

import (
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"
	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

func testModel() Model {
	m := New(Options{Seed: 8675309, Mode: render.ModeFull, FXEnabled: false})
	next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	return next.(Model)
}

func press(t *testing.T, m Model, code rune, text string) Model {
	t.Helper()
	next, _ := m.Update(tea.KeyPressMsg{Code: code, Text: text})
	return next.(Model)
}

func TestArrowKeysMoveThePiece(t *testing.T) {
	m := testModel()
	x := m.Game.Active.X
	m = press(t, m, tea.KeyLeft, "")
	if m.Game.Active.X != x-1 {
		t.Fatalf("X = %d after left, want %d", m.Game.Active.X, x-1)
	}
	m = press(t, m, 'l', "l")
	if m.Game.Active.X != x {
		t.Fatalf("X = %d after l, want %d", m.Game.Active.X, x)
	}
}

func TestRotateAndHardDropAndHold(t *testing.T) {
	m := testModel()
	r := m.Game.Active.Rotation
	m = press(t, m, 'x', "x")
	if m.Game.Active.Rotation == r {
		t.Fatal("x must rotate clockwise")
	}
	m = press(t, m, 'z', "z")
	if m.Game.Active.Rotation != r {
		t.Fatal("z must rotate counter-clockwise")
	}
	m = press(t, m, 'c', "c")
	if m.Game.Hold == nil {
		t.Fatal("c must hold")
	}
	before := m.Game.Score
	m = press(t, m, tea.KeySpace, " ")
	if m.Game.Score <= before {
		t.Fatal("space must hard drop and score")
	}
}

func TestSoftDropScores(t *testing.T) {
	m := testModel()
	m = press(t, m, 'j', "j")
	if m.Game.Score != 1 {
		t.Fatalf("Score = %d after a soft drop, want 1", m.Game.Score)
	}
}

func TestPauseFreezesGravity(t *testing.T) {
	m := testModel()
	m = press(t, m, 'p', "p")
	if m.State != render.PhasePaused {
		t.Fatalf("State = %v, want PhasePaused", m.State)
	}
	y := m.Game.Active.Y
	m.LastFrame = time.Now().Add(-time.Second)
	next, _ := m.Update(FrameMsg{Now: time.Now()})
	m = next.(Model)
	if m.Game.Active.Y != y {
		t.Fatal("gravity must not advance while paused")
	}
	m = press(t, m, 'p', "p")
	if m.State != render.PhasePlaying {
		t.Fatal("p must resume")
	}
}

func TestHelpTogglesAndDoesNotPauseInput(t *testing.T) {
	m := testModel()
	m = press(t, m, '?', "?")
	if m.State != render.PhaseHelp {
		t.Fatalf("State = %v, want PhaseHelp", m.State)
	}
	m = press(t, m, '?', "?")
	if m.State != render.PhasePlaying {
		t.Fatal("? must toggle back")
	}
}

func TestRestartResetsTheGame(t *testing.T) {
	m := testModel()
	m = press(t, m, tea.KeySpace, " ")
	m = press(t, m, 'r', "r")
	if m.Game.Score != 0 || m.Game.Lines != 0 {
		t.Fatalf("r must restart: %+v", m.Game)
	}
	if m.State != render.PhasePlaying {
		t.Fatalf("State = %v after restart, want PhasePlaying", m.State)
	}
	if m.Game.Seed != 8675309 {
		t.Fatalf("restart changed the seed to %d", m.Game.Seed)
	}
}

func TestQuitReturnsQuitCmd(t *testing.T) {
	m := testModel()
	_, cmd := m.Update(tea.KeyPressMsg{Code: 'q', Text: "q"})
	if cmd == nil {
		t.Fatal("q must return a command")
	}
	if _, ok := cmd().(tea.QuitMsg); !ok {
		t.Fatal("q must return tea.Quit")
	}
}

func TestFrameMsgAdvancesGravity(t *testing.T) {
	m := testModel()
	y := m.Game.Active.Y
	m.LastFrame = time.Now().Add(-game.GravityInterval(1))
	next, cmd := m.Update(FrameMsg{Now: time.Now()})
	m = next.(Model)
	if m.Game.Active.Y != y+1 {
		t.Fatalf("Y = %d after one gravity interval, want %d", m.Game.Active.Y, y+1)
	}
	if cmd == nil {
		t.Fatal("a FrameMsg must schedule the next frame")
	}
}

// Review Focus 4: a suspend-sized dt is clamped before it reaches the engine.
func TestLongStallIsClamped(t *testing.T) {
	m := testModel()
	y := m.Game.Active.Y
	m.LastFrame = time.Now().Add(-45 * time.Second)
	next, _ := m.Update(FrameMsg{Now: time.Now()})
	m = next.(Model)
	if m.Game.Active.Y > y+1 {
		t.Fatalf("Y jumped from %d to %d after a 45s stall; dt must be clamped to %v",
			y, m.Game.Active.Y, MaxFrameDT)
	}
}

func TestGameOverPhaseAndOnlyRQAccepted(t *testing.T) {
	m := testModel()
	for i := 0; i < 400 && !m.Game.Over(); i++ {
		m = press(t, m, tea.KeySpace, " ")
	}
	if !m.Game.Over() {
		t.Fatal("400 hard drops should have ended the game")
	}
	next, _ := m.Update(FrameMsg{Now: time.Now()})
	m = next.(Model)
	if m.State != render.PhaseGameOver {
		t.Fatalf("State = %v, want PhaseGameOver", m.State)
	}
	m = press(t, m, tea.KeyLeft, "")
	if m.State != render.PhaseGameOver {
		t.Fatal("movement keys must be ignored after game over")
	}
	m = press(t, m, 'r', "r")
	if m.State != render.PhasePlaying || m.Game.Over() {
		t.Fatal("r must reboot the universe from the game-over screen")
	}
}

func TestResizeIsLiveAndNeverPanics(t *testing.T) {
	m := testModel()
	for _, s := range [][2]int{{0, 0}, {1, 1}, {40, 24}, {200, 80}, {39, 23}, {80, 30}} {
		next, _ := m.Update(tea.WindowSizeMsg{Width: s[0], Height: s[1]})
		m = next.(Model)
		if m.Width != s[0] || m.Height != s[1] {
			t.Fatalf("size = %dx%d, want %dx%d", m.Width, m.Height, s[0], s[1])
		}
		_ = m.View() // must not panic at any size
	}
}

func TestViewIsAltScreenAndNonEmpty(t *testing.T) {
	v := testModel().View()
	if !v.AltScreen {
		t.Fatal("the game runs in the alternate screen")
	}
	if v.Content == "" {
		t.Fatal("View produced no content")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go get charm.land/bubbletea/v2@latest charm.land/bubbles/v2@latest && go test ./internal/app/ -v`
Expected: FAIL — `undefined: New`.

- [ ] **Step 3: Implement the four `internal/app` files**

`Init` returns `frameCmd()` and sets `LastFrame` lazily on the first `FrameMsg` (a zero `LastFrame` yields `dt = 0`). `Update` on `FrameMsg`: `dt := msg.Now.Sub(m.LastFrame)`, clamp to `MaxFrameDT`, drop negatives, set `LastFrame`, and call `m.Game.Advance(dt)` only when `m.State == render.PhasePlaying`; always return `frameCmd()` so the clock never stops. After advancing, if `m.Game.Over()` set `m.State = render.PhaseGameOver`. Key handling uses `key.Matches(msg, m.Keys.X)`; movement/rotate/drop/hold keys are ignored unless `m.State == render.PhasePlaying`; `p`, `?`, `r`, and quit work in every phase except that `p` does nothing on the game-over screen. `View` builds `renderInput()` and returns `tea.NewView(render.Render(in))` with `AltScreen = true`. `HelpBody` comes from `m.Help.View(m.Keys)` — set `m.Help.ShowAll = true` when `State == PhaseHelp`. Engine events are collected and discarded here; Plan 3 forwards them to the FX world.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./... -count=1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add go.mod go.sum internal/app/ internal/app/update_test.go
git commit -m "feat(app): Bubble Tea model, key map, single-clock frame loop"
```

---

### Task 9: Golden layout snapshots and the size sweep

**Files:**
- Create: `internal/render/golden_test.go`
- Create: `internal/render/testdata/*.golden` (generated)
- Test: as above

**Interfaces:**
- Consumes: `RenderGrid`, `Render`, `Input` (Task 7).
- Produces: the §41 snapshot suite: `wide`, `medium`, `small`, `pause`, `gameover`, `help`, `ascii`.

- [ ] **Step 1: Write the failing test**

```go
package render

import (
	"flag"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"cosmic-tetris/internal/game"
	"github.com/charmbracelet/x/ansi"
)

var update = flag.Bool("update", false, "rewrite the golden files")

func goldenInput(w, h int) Input {
	g := game.New(8675309)
	// A fixed, hand-built board so the snapshot never depends on gameplay timing.
	for x := 0; x < game.BoardWidth-1; x++ {
		g.Board.Cells[game.BoardHeight-1][x] = game.Cell{Filled: true, Kind: game.KindL}
	}
	for x := 0; x < 4; x++ {
		g.Board.Cells[game.BoardHeight-2][x] = game.Cell{Filled: true, Kind: game.KindS}
	}
	g.Active = game.Piece{Kind: game.KindT, Rotation: 0, X: 4, Y: game.HiddenRows + 3}
	held := game.KindI
	g.Hold = &held
	g.Score, g.Lines, g.Level, g.Combo = 129340, 42, 7, 3
	return Input{Game: g, Width: w, Height: h, Mode: ModeFull, Phase: PhasePlaying,
		Mission: "GRAVITY TAX INCREASED"}
}

func assertGolden(t *testing.T, name, got string) {
	t.Helper()
	path := filepath.Join("testdata", name+".golden")
	if *update {
		if err := os.MkdirAll("testdata", 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(got), 0o644); err != nil {
			t.Fatal(err)
		}
		return
	}
	want, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("%v — run: go test ./internal/render/ -update", err)
	}
	if got != string(want) {
		t.Errorf("%s does not match the golden file.\n--- got ---\n%s\n--- want ---\n%s", name, got, want)
	}
}

func TestGoldenLayouts(t *testing.T) {
	cases := []struct {
		name  string
		build func() Input
	}{
		{"wide", func() Input { return goldenInput(80, 30) }},
		{"medium", func() Input { return goldenInput(48, 26) }},
		{"small", func() Input { return goldenInput(40, 24) }},
		{"pause", func() Input { in := goldenInput(80, 30); in.Phase = PhasePaused; return in }},
		{"gameover", func() Input {
			in := goldenInput(80, 30)
			in.Phase = PhaseGameOver
			return in
		}},
		{"help", func() Input {
			in := goldenInput(80, 30)
			in.Phase = PhaseHelp
			in.HelpBody = "← → / h l  move spacecraft\nSPACE      YEET"
			return in
		}},
		{"ascii", func() Input { in := goldenInput(80, 30); in.Mode = ModeASCII; return in }},
		{"toosmall", func() Input { return goldenInput(34, 19) }},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			assertGolden(t, c.name, RenderGrid(c.build()).PlainString())
		})
	}
}

func TestStyledOutputStripsToThePlainFrame(t *testing.T) {
	in := goldenInput(80, 30)
	if got, want := ansi.Strip(Render(in)), RenderGrid(in).PlainString(); got != want {
		t.Errorf("styled output does not strip to the plain frame.\n--- got ---\n%s\n--- want ---\n%s", got, want)
	}
}

// Review Focus 5: every supported size renders inside its bounds, board interior stays clean.
func TestEverySupportedSizeRendersCleanly(t *testing.T) {
	glyphs := GlyphsFor(ModeFull)
	allowed := map[rune]bool{' ': true}
	for _, s := range []string{glyphs.Block, glyphs.Ghost} {
		for _, r := range s {
			allowed[r] = true
		}
	}
	for w := MinCols; w <= 120; w += 3 {
		for h := MinRows; h <= 60; h += 3 {
			in := goldenInput(w, h)
			g := RenderGrid(in)
			if g.W != w || g.H != h {
				t.Fatalf("%dx%d: grid is %dx%d", w, h, g.W, g.H)
			}
			for _, row := range strings.Split(g.PlainString(), "\n") {
				if len([]rune(row)) > w {
					t.Fatalf("%dx%d: row overflows: %q", w, h, row)
				}
			}
			l := Compute(w, h)
			inner := l.Inner
			for y := inner.Y; y < inner.Y+inner.H; y++ {
				for x := inner.X; x < inner.X+inner.W; x++ {
					if r := g.At(x, y).Rune; !allowed[r] {
						t.Fatalf("%dx%d: HUD leaked %q into the board interior at (%d,%d)", w, h, r, x, y)
					}
				}
			}
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go get github.com/charmbracelet/x/ansi && go test ./internal/render/ -run Golden -v`
Expected: FAIL — missing `testdata/wide.golden`.

- [ ] **Step 3: Generate the golden files and read them**

Run: `go test ./internal/render/ -update`

Then open each file in `internal/render/testdata/` and check it by eye against §4's intent and §41's goals: the board is 22 columns of border-plus-cells, nothing overlaps, the HUD sits beside the board, the mission line and controls are on their own rows. Fix the renderer (not the golden file) if anything is wrong, and regenerate. §49.7 applies: §4's mockup is mood, these files are the contract.

- [ ] **Step 4: Run the full suite**

Run: `go test ./... -count=1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add go.mod go.sum internal/render/golden_test.go internal/render/testdata
git commit -m "test(render): golden layout snapshots and full size sweep"
```

---

### Task 10: The `cosmic-tetris` binary and its CLI

**Files:**
- Create: `cmd/cosmic-tetris/main.go`
- Create: `LICENSE`
- Modify: `README.md`
- Test: `cmd/cosmic-tetris/main_test.go`

**Interfaces:**
- Consumes: `app.New`, `app.Options`, `render.Mode`.
- Produces:
  ```go
  type config struct {
      Seed          int64
      ASCII         bool
      NoFX          bool
      ReducedMotion bool
  }
  func parseFlags(args []string, stderr io.Writer) (config, error) // testable; no os.Exit inside
  func (c config) options() app.Options                            // Mode: ASCII -> render.ModeASCII
  ```
  Final CLI surface (§49.5): bare, `--seed N`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help`. Nothing else.

- [ ] **Step 1: Write the failing test**

```go
package main

import (
	"io"
	"strings"
	"testing"

	"cosmic-tetris/internal/render"
)

func TestParseFlagsDefaults(t *testing.T) {
	c, err := parseFlags(nil, io.Discard)
	if err != nil {
		t.Fatal(err)
	}
	if c.ASCII || c.NoFX || c.ReducedMotion {
		t.Fatalf("defaults should be all-off: %+v", c)
	}
	if c.Seed == 0 {
		t.Fatal("a bare invocation needs a nonzero seed so the universe differs each run")
	}
	if got := c.options().Mode; got != render.ModeFull {
		t.Fatalf("default Mode = %v, want ModeFull", got)
	}
	if !c.options().FXEnabled {
		t.Fatal("FX are on by default")
	}
}

func TestParseFlagsEachFlag(t *testing.T) {
	c, err := parseFlags([]string{"--seed", "8675309", "--ascii", "--no-fx", "--reduced-motion"}, io.Discard)
	if err != nil {
		t.Fatal(err)
	}
	if c.Seed != 8675309 {
		t.Fatalf("Seed = %d, want 8675309", c.Seed)
	}
	o := c.options()
	if o.Mode != render.ModeASCII || o.FXEnabled || !o.ReducedMotion {
		t.Fatalf("options = %+v", o)
	}
}

func TestParseFlagsRejectsUnknownFlags(t *testing.T) {
	if _, err := parseFlags([]string{"--networking"}, io.Discard); err == nil {
		t.Fatal("an unknown flag must be an error")
	}
}

func TestHelpMentionsEveryFlag(t *testing.T) {
	var sb strings.Builder
	if _, err := parseFlags([]string{"--help"}, &sb); err == nil {
		t.Fatal("--help must return an error so main exits without starting the game")
	}
	for _, want := range []string{"--seed", "--ascii", "--no-fx", "--reduced-motion"} {
		if !strings.Contains(sb.String(), want) {
			t.Errorf("help text is missing %q:\n%s", want, sb.String())
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./cmd/cosmic-tetris/ -v`
Expected: FAIL — `undefined: parseFlags`.

- [ ] **Step 3: Implement `cmd/cosmic-tetris/main.go`, `LICENSE`, and README updates**

`parseFlags` builds a `flag.FlagSet` with `ContinueOnError`, sets `SetOutput(stderr)`, and returns `flag.ErrHelp` for `--help`. A zero `--seed` (or absent flag) becomes `time.Now().UnixNano()` — this is the one clock read in the program that is not the frame loop, and it lives in `main`, never in `internal/game` (§49.2). `main` calls `parseFlags(os.Args[1:], os.Stderr)`, exits 0 on `flag.ErrHelp` and 2 on any other error, then runs `tea.NewProgram(app.New(cfg.options())).Run()`.

`LICENSE`: MIT, current year, "Jesse Vincent". README: what it is, `go run ./cmd/cosmic-tetris`, the flag table, the control table from §39, and a note that `--no-fx` is still a good game.

- [ ] **Step 4: Verify the binary builds, plays, and the suite passes**

Run: `go build ./... && go vet ./... && go test ./... -count=1`
Expected: all pass.

Then play it: `go run ./cmd/cosmic-tetris --seed 8675309`. Confirm by hand: pieces fall, arrows and `hjkl` move, `x`/`z` rotate, space hard-drops, `c` holds, ghost tracks the landing spot, `p` pauses, `?` shows the manual, `r` restarts, `q` quits cleanly to a restored terminal, and resizing the window re-lays-out live including down through the too-small notice and back.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add cmd/ LICENSE README.md
git commit -m "feat(cmd): cosmic-tetris binary with the full CLI surface"
```

---

## What Plan 3 plugs into

- `render.Input.Stars`, `.BoardFX`, `.GlobalFX` — `[]render.Sprite` in absolute grid coordinates; board FX shift with the shake, the others do not.
- `render.Input.Shake` — a `Rect` whose `X`/`Y` offset the board panel, clamped inside the terminal.
- `render.Input.Banner`, `.BootScreen`, `.BorderStyle`, `.Mission`.
- `render.Compute(w, h) Layout` — hand `Layout.Inner` to the FX world so particles know where the board is.
- `app.Model.Update` already collects `[]game.Event` from every engine call; Plan 3 forwards them to `fx.World.Observe`.
