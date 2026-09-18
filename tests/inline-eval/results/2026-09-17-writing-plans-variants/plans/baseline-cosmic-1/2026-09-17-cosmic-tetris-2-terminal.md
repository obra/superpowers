# Cosmic Tetris — Plan 2: Playable Terminal

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Plan 1 engine into a genuinely good terminal game: a cell grid renderer, a neon palette with Unicode/ASCII glyph sets, an adaptive layout, board + HUD + overlays, Bubble Tea wiring with immediate input and one 60 Hz clock, a tiny CLI, and golden snapshot tests.

**Architecture:** `internal/render` owns a `Grid` — a width×height buffer of `(rune, *Style)` cells that renders to a string with run-length-grouped ANSI. Everything draws into the grid, so composition is trivial and snapshot tests are exact. `render` never imports `app` or `fx`; the FX layer (Plan 3) plugs in through function hooks on `render.Scene`, which keeps §37's pipeline order without a dependency. `internal/app` holds the Bubble Tea model: one `FrameMsg` clock drives elapsed-time `game.Advance(dt)`, while key presses act immediately on arrival.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2` v2.0.9, `charm.land/lipgloss/v2` v2.0.6, `charm.land/bubbles/v2` v2.2.1, `github.com/charmbracelet/x/ansi` (for `ansi.Strip` in tests).

**Spec:** `design.md`. Sections implemented here: §4, §5, §8, §9 (mechanics only), §10, §25 (static border), §26, §28 (the panel, not the animation), §30, §31, §32 (mode plumbing + ASCII), §33, §34, §36, §37, §38, §39, §41, §42 Phase 2, §46 (`--seed`, `--ascii`, `--help`), §49.3, §49.4, §49.7.

**Prerequisite:** Plan 1 complete — `internal/game` exists and its tests pass.

## Global Constraints

- Imports are exactly `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`. Do not abstract Bubble Tea behind a homegrown framework.
- One logical block occupies `2 terminal columns × 1 terminal row`. Block glyph `██`, ASCII fallback `[]`.
- Ghost glyph: `░░` in full and reduced modes, `··` in ASCII mode (§49.4). Pieces always use filled block glyphs with a bright foreground — never a foreground+background pairing. The active piece renders one step brighter than locked cells.
- Piece colour intent (§26): I plasma cyan, J deep electric blue, L solar orange, O stellar gold, S alien green, T ultraviolet, Z supernova pink/red.
- Minimum usable terminal: `~40 columns × ~24 rows`. Below that, show the too-small notice. Handle resize live; never crash from resizing.
- Small-terminal drop order (§49.3): title border first, then mission control, then stats labels (values stay). NEXT never stacks above or below the board — it moves beside the board and truncates to 3 upcoming pieces. Board and controls are the last two things standing.
- Rendering must not mutate game state (§37). `render` takes `*game.Game` and only reads it.
- Target visual updates around `60 Hz`; gravity stays elapsed-time based; input must not wait for ticks (§36).
- Keys (§8): `←/h` left, `→/l` right, `↓/j` soft drop, `↑/k/x` rotate CW, `z` rotate CCW, `space` hard drop, `c` hold, `p` pause, `r` restart, `?` help, `q`/`esc` quit. WASD aliases `a d s w`.
- Final CLI surface (§49.5): `cosmic-tetris`, `--seed 1234`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help`. All six parse in this plan. `--ascii` selects the ASCII render mode; `--no-fx` and `--reduced-motion` are carried in `app.Options` and have no visible effect until Plan 3, because there are no effects yet. `--reduced-motion` never changes glyphs or colours — it suppresses shake, hyperdrive acceleration, and shockwaves.
- The §4 mockup is mood, not geometry (§49.7). The ANSI-stripped golden files are the binding layout contract.

## Review Focus

1. **`WindowSizeMsg` with zero or negative dimensions** (some terminals and CI harnesses report 0×0 before the first real size) must not panic or allocate a negative-size buffer. → Task 1 (`NewGrid`) and Task 3 (`Compute`).
2. **An overlay larger than the terminal** (the help panel at 40×24) must clip instead of writing outside the grid or corrupting the board. → Task 6.
3. **A `dt` spike from laptop sleep** must be clamped in the app before it reaches `game.Advance`, so a resumed session does not instantly bury the player. → Task 8.
4. **Keys arriving in the wrong state** — movement while paused or after game over, `r`/`q` while the too-small notice is showing — must be handled explicitly rather than falling through to the engine. → Task 8.
5. **Drawing near grid edges** (a piece at column 9 in a grid 1 column too narrow, a shake offset at the boundary) must silently clip; `Grid.Set` out of range is a no-op, and every draw helper relies on that rather than on its own bounds maths. → Task 1.

---

### Task 1: The cell grid and style primitive

**Files:**
- Create: `internal/render/style.go`
- Create: `internal/render/grid.go`
- Test: `internal/render/grid_test.go`
- Modify: `go.mod` (adds lipgloss and, for tests, `x/ansi`)

**Interfaces:**
- Consumes: nothing from Plan 1.
- Produces:
  - `type Style struct { Fg color.Color; Bold, Faint bool }`, `func NewStyle(fg color.Color, bold, faint bool) *Style`, `func (s *Style) Render(text string) string` (nil-safe).
  - `type Cell struct { Rune rune; Style *Style }`
  - `type Grid struct { W, H int }` with `func NewGrid(w, h int) *Grid`, `Resize(w, h int)`, `Clear()`, `Set(x, y int, r rune, st *Style)`, `SetString(x, y int, s string, st *Style)`, `At(x, y int) Cell`, `Render() string`.

`Style` values are shared, immutable palette entries compared by pointer, which is what lets `Render` group runs cheaply and deterministically.

- [ ] **Step 1: Add the dependencies**

```bash
go get charm.land/lipgloss/v2@v2.0.6
go get charm.land/bubbletea/v2@v2.0.9
go get charm.land/bubbles/v2@v2.2.1
go get github.com/charmbracelet/x/ansi@v0.11.8
```

- [ ] **Step 2: Write the failing test**

Create `internal/render/grid_test.go`:

```go
package render

import (
	"strings"
	"testing"

	"charm.land/lipgloss/v2"
	"github.com/charmbracelet/x/ansi"
)

func TestNewGridStartsBlank(t *testing.T) {
	g := NewGrid(4, 2)
	if g.W != 4 || g.H != 2 {
		t.Fatalf("size = %dx%d, want 4x2", g.W, g.H)
	}
	if got := g.Render(); got != "\n" {
		t.Errorf("blank 4x2 grid rendered %q, want %q", got, "\n")
	}
}

// Review Focus item 1.
func TestNewGridRejectsNonPositiveSizes(t *testing.T) {
	for _, tc := range [][2]int{{0, 0}, {-3, 5}, {5, -3}, {0, 10}} {
		g := NewGrid(tc[0], tc[1])
		if g.W < 0 || g.H < 0 {
			t.Errorf("NewGrid(%d,%d) kept a negative dimension", tc[0], tc[1])
		}
		g.Set(0, 0, 'x', nil) // must not panic
		if s := g.Render(); strings.Contains(s, "x") {
			t.Errorf("NewGrid(%d,%d) accepted a write into an empty buffer", tc[0], tc[1])
		}
	}
}

func TestSetAndAt(t *testing.T) {
	g := NewGrid(3, 1)
	st := NewStyle(lipgloss.Color("#ff0000"), true, false)
	g.Set(1, 0, 'A', st)
	if c := g.At(1, 0); c.Rune != 'A' || c.Style != st {
		t.Errorf("At(1,0) = %+v", c)
	}
	if c := g.At(0, 0); c.Rune != ' ' || c.Style != nil {
		t.Errorf("neighbour cell = %+v, want blank", c)
	}
}

// Review Focus item 5.
func TestSetOutOfRangeIsSilentlyIgnored(t *testing.T) {
	g := NewGrid(3, 2)
	for _, p := range [][2]int{{-1, 0}, {3, 0}, {0, -1}, {0, 2}, {99, 99}} {
		g.Set(p[0], p[1], 'X', nil)
	}
	if got := ansi.Strip(g.Render()); strings.Contains(got, "X") {
		t.Errorf("out-of-range write landed in the grid: %q", got)
	}
	if c := g.At(-1, -1); c.Rune != 0 {
		t.Errorf("At out of range = %+v, want zero Cell", c)
	}
}

func TestSetStringClipsAtTheRightEdge(t *testing.T) {
	g := NewGrid(5, 1)
	g.SetString(3, 0, "ABCDEF", nil)
	if got := ansi.Strip(g.Render()); got != "   AB" {
		t.Errorf("Render() = %q, want %q", got, "   AB")
	}
}

func TestSetStringHandlesMultibyteRunes(t *testing.T) {
	g := NewGrid(4, 1)
	g.SetString(0, 0, "✦˚·", nil)
	if got := ansi.Strip(g.Render()); got != "✦˚·" {
		t.Errorf("Render() = %q, want %q", got, "✦˚·")
	}
}

func TestRenderTrimsTrailingBlanksButKeepsRowCount(t *testing.T) {
	g := NewGrid(6, 3)
	g.SetString(0, 0, "AB", nil)
	g.SetString(0, 2, "C", nil)
	got := ansi.Strip(g.Render())
	want := "AB\n\nC"
	if got != want {
		t.Errorf("Render() = %q, want %q", got, want)
	}
	if lines := strings.Count(got, "\n") + 1; lines != 3 {
		t.Errorf("rendered %d lines, want 3", lines)
	}
}

func TestRenderGroupsRunsOfEqualStyle(t *testing.T) {
	red := NewStyle(lipgloss.Color("#ff0000"), false, false)
	g := NewGrid(6, 1)
	g.SetString(0, 0, "AAA", red)
	g.SetString(3, 0, "BBB", red)
	out := g.Render()
	if ansi.Strip(out) != "AAABBB" {
		t.Fatalf("stripped = %q", ansi.Strip(out))
	}
	// One run means one style-open sequence, not six.
	if n := strings.Count(out, "\x1b["); n > 2 {
		t.Errorf("expected a single grouped run, saw %d escape sequences in %q", n, out)
	}
}

func TestClearResetsEveryCell(t *testing.T) {
	g := NewGrid(3, 2)
	g.SetString(0, 0, "XYZ", NewStyle(lipgloss.Color("#00ff00"), false, false))
	g.Clear()
	if got := g.Render(); got != "\n" {
		t.Errorf("after Clear, Render() = %q, want %q", got, "\n")
	}
}

func TestResizeChangesDimensionsAndClears(t *testing.T) {
	g := NewGrid(3, 1)
	g.SetString(0, 0, "XYZ", nil)
	g.Resize(8, 2)
	if g.W != 8 || g.H != 2 {
		t.Fatalf("size = %dx%d, want 8x2", g.W, g.H)
	}
	if got := g.Render(); got != "\n" {
		t.Errorf("resize did not clear: %q", got)
	}
	g.Resize(0, 0) // must not panic
	g.Set(0, 0, 'x', nil)
}

func TestNilStyleRenderIsPlainText(t *testing.T) {
	var s *Style
	if got := s.Render("hello"); got != "hello" {
		t.Errorf("nil Style.Render = %q, want plain text", got)
	}
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `go test ./internal/render/ -v`
Expected: FAIL — no non-test Go files / `undefined: NewGrid`.

- [ ] **Step 4: Implement `Style`**

Create `internal/render/style.go`:

```go
// Package render draws Cosmic Tetris into a character grid and turns that grid
// into a styled string. It reads game state and never writes it.
package render

import (
	"image/color"

	"charm.land/lipgloss/v2"
)

// Style is one visual treatment for a run of characters. Styles are created
// once, live in the palette, and are compared by pointer, which is what lets
// Grid.Render group adjacent cells into a single escape sequence.
type Style struct {
	Fg    color.Color
	Bold  bool
	Faint bool

	lg lipgloss.Style
}

// NewStyle builds a style. A nil foreground means "terminal default".
func NewStyle(fg color.Color, bold, faint bool) *Style {
	s := &Style{Fg: fg, Bold: bold, Faint: faint}
	lg := lipgloss.NewStyle()
	if fg != nil {
		lg = lg.Foreground(fg)
	}
	if bold {
		lg = lg.Bold(true)
	}
	if faint {
		lg = lg.Faint(true)
	}
	s.lg = lg
	return s
}

// Render applies the style to text. A nil style renders plain text.
func (s *Style) Render(text string) string {
	if s == nil {
		return text
	}
	return s.lg.Render(text)
}
```

- [ ] **Step 5: Implement `Grid`**

Create `internal/render/grid.go`:

```go
package render

import "strings"

// Cell is one character position in the grid.
type Cell struct {
	Rune  rune
	Style *Style
}

// Grid is a fixed-size character buffer. Every drawing routine writes into a
// grid, so compositing layers is just writing later, and snapshot tests can
// compare exact text.
type Grid struct {
	W, H  int
	cells []Cell
}

// NewGrid returns a blank grid. Non-positive dimensions are clamped to zero,
// so a terminal that reports 0x0 produces an empty grid instead of a panic.
func NewGrid(w, h int) *Grid {
	if w < 0 {
		w = 0
	}
	if h < 0 {
		h = 0
	}
	g := &Grid{W: w, H: h, cells: make([]Cell, w*h)}
	g.Clear()
	return g
}

// Resize changes the grid's dimensions and clears it.
func (g *Grid) Resize(w, h int) {
	if w < 0 {
		w = 0
	}
	if h < 0 {
		h = 0
	}
	g.W, g.H = w, h
	if need := w * h; need > cap(g.cells) {
		g.cells = make([]Cell, need)
	} else {
		g.cells = g.cells[:need]
	}
	g.Clear()
}

// Clear blanks every cell.
func (g *Grid) Clear() {
	for i := range g.cells {
		g.cells[i] = Cell{Rune: ' '}
	}
}

// Set writes one cell. Coordinates outside the grid are ignored, which is what
// lets drawing code near the edges stay free of bounds maths.
func (g *Grid) Set(x, y int, r rune, st *Style) {
	if x < 0 || y < 0 || x >= g.W || y >= g.H {
		return
	}
	g.cells[y*g.W+x] = Cell{Rune: r, Style: st}
}

// SetString writes s starting at (x, y), one grid cell per rune, clipping at
// the edges.
func (g *Grid) SetString(x, y int, s string, st *Style) {
	i := 0
	for _, r := range s {
		g.Set(x+i, y, r, st)
		i++
	}
}

// At returns the cell at (x, y), or the zero Cell when out of range.
func (g *Grid) At(x, y int) Cell {
	if x < 0 || y < 0 || x >= g.W || y >= g.H {
		return Cell{}
	}
	return g.cells[y*g.W+x]
}

// Render turns the grid into a newline-separated styled string. Adjacent cells
// that share a style are emitted as one run. Trailing unstyled blanks are
// trimmed so the output does not depend on the grid's right margin.
func (g *Grid) Render() string {
	var b strings.Builder
	var run []rune
	for y := 0; y < g.H; y++ {
		row := g.cells[y*g.W : y*g.W+g.W]
		end := len(row)
		for end > 0 && row[end-1].Rune == ' ' && row[end-1].Style == nil {
			end--
		}
		for x := 0; x < end; {
			st := row[x].Style
			run = run[:0]
			for x < end && row[x].Style == st {
				run = append(run, row[x].Rune)
				x++
			}
			b.WriteString(st.Render(string(run)))
		}
		if y < g.H-1 {
			b.WriteByte('\n')
		}
	}
	return b.String()
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `go test ./internal/render/ -v && go vet ./...`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add go.mod go.sum internal/render/style.go internal/render/grid.go internal/render/grid_test.go
git commit -m "feat(render): character grid buffer with run-grouped styled output"
```

---

### Task 2: Palette, render modes, and glyph sets

**Files:**
- Create: `internal/render/palette.go`
- Test: `internal/render/palette_test.go`

**Interfaces:**
- Consumes: `Style`, `NewStyle`; `game.PieceKind`, `game.KindCount`.
- Produces:
  - `type Mode int` with `ModeFull`, `ModeReduced`, `ModeASCII`; `func (m Mode) String() string`.
  - `type Palette struct { Mode Mode; Block, Ghost string; Locked, Active [game.KindCount]*Style; GhostStyle, Border, BorderHot, Title, Label, Value, Mission, Controls, Dim, Banner *Style; Star [3]*Style }`
  - `func NewPalette(mode Mode) *Palette`
  - `func (p *Palette) BlockFor(k game.PieceKind, active bool) (string, *Style)`

- [ ] **Step 1: Write the failing test**

Create `internal/render/palette_test.go`:

```go
package render

import (
	"testing"

	"cosmic-tetris/internal/game"
)

func TestGlyphsPerMode(t *testing.T) {
	cases := map[Mode][2]string{
		ModeFull:    {"██", "░░"},
		ModeReduced: {"██", "░░"},
		ModeASCII:   {"[]", "··"},
	}
	for mode, want := range cases {
		p := NewPalette(mode)
		if p.Block != want[0] {
			t.Errorf("%v block glyph = %q, want %q", mode, p.Block, want[0])
		}
		if p.Ghost != want[1] {
			t.Errorf("%v ghost glyph = %q, want %q", mode, p.Ghost, want[1])
		}
	}
}

func TestGlyphsAreTwoColumnsWide(t *testing.T) {
	for _, mode := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		p := NewPalette(mode)
		if n := len([]rune(p.Block)); n != 2 {
			t.Errorf("%v block glyph is %d runes, want 2", mode, n)
		}
		if n := len([]rune(p.Ghost)); n != 2 {
			t.Errorf("%v ghost glyph is %d runes, want 2", mode, n)
		}
	}
}

func TestEveryKindHasDistinctColours(t *testing.T) {
	p := NewPalette(ModeFull)
	seen := map[string]game.PieceKind{}
	for k := game.KindI; k < game.KindCount; k++ {
		st := p.Locked[k]
		if st == nil || st.Fg == nil {
			t.Fatalf("%v has no locked colour", k)
		}
		r, g, b, _ := st.Fg.RGBA()
		key := string(rune(r)) + string(rune(g)) + string(rune(b))
		if other, dup := seen[key]; dup {
			t.Errorf("%v and %v share a colour", k, other)
		}
		seen[key] = k
	}
}

func TestActivePieceIsBrighterThanLocked(t *testing.T) {
	p := NewPalette(ModeFull)
	for k := game.KindI; k < game.KindCount; k++ {
		if !p.Active[k].Bold {
			t.Errorf("%v active style is not bold", k)
		}
		if p.Locked[k].Bold {
			t.Errorf("%v locked style should not be bold", k)
		}
		if p.Active[k] == p.Locked[k] {
			t.Errorf("%v active and locked styles are the same object", k)
		}
	}
}

func TestPiecesNeverUseABackground(t *testing.T) {
	// Pinned by 49.4: filled glyphs with a bright foreground, never fg+bg.
	for _, mode := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		p := NewPalette(mode)
		for k := game.KindI; k < game.KindCount; k++ {
			for _, st := range []*Style{p.Locked[k], p.Active[k]} {
				if st.Fg == nil {
					t.Errorf("%v/%v has no foreground", mode, k)
				}
			}
		}
	}
}

func TestGhostStyleIsFaint(t *testing.T) {
	for _, mode := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		if !NewPalette(mode).GhostStyle.Faint {
			t.Errorf("%v ghost style is not faint", mode)
		}
	}
}

func TestBlockForPicksGlyphAndStyle(t *testing.T) {
	p := NewPalette(ModeASCII)
	glyph, st := p.BlockFor(game.KindT, true)
	if glyph != "[]" {
		t.Errorf("glyph = %q, want %q", glyph, "[]")
	}
	if st != p.Active[game.KindT] {
		t.Error("BlockFor(active) did not return the active style")
	}
	_, st = p.BlockFor(game.KindT, false)
	if st != p.Locked[game.KindT] {
		t.Error("BlockFor(locked) did not return the locked style")
	}
}

func TestStarLayersGetDimmerWithDepth(t *testing.T) {
	p := NewPalette(ModeFull)
	if !p.Star[0].Faint {
		t.Error("far stars should be faint")
	}
	if p.Star[2].Faint {
		t.Error("near stars should not be faint")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -run Palette -v`
Expected: FAIL — `undefined: NewPalette`.

- [ ] **Step 3: Implement the palette**

Create `internal/render/palette.go`:

```go
package render

import (
	"charm.land/lipgloss/v2"

	"cosmic-tetris/internal/game"
)

// Mode is how much the terminal can be trusted with.
type Mode int

// The render modes. Full assumes Unicode and truecolor; Reduced keeps Unicode
// but avoids gradients; ASCII assumes nothing beyond 7-bit characters and a
// handful of colours.
const (
	ModeFull Mode = iota
	ModeReduced
	ModeASCII
)

// String names the mode.
func (m Mode) String() string {
	switch m {
	case ModeReduced:
		return "reduced"
	case ModeASCII:
		return "ascii"
	default:
		return "full"
	}
}

// Glyph sets. A logical block is always two terminal columns wide so cells
// look square.
const (
	blockUnicode = "██"
	blockASCII   = "[]"
	ghostUnicode = "░░"
	ghostASCII   = "··"
)

// pieceColors is the neon space palette from the spec: I plasma cyan, J deep
// electric blue, L solar orange, O stellar gold, S alien green, T ultraviolet,
// Z supernova pink.
var pieceColors = [game.KindCount]string{
	game.KindI: "#22D3EE",
	game.KindJ: "#3B82F6",
	game.KindL: "#FB923C",
	game.KindO: "#FBBF24",
	game.KindS: "#4ADE80",
	game.KindT: "#A855F7",
	game.KindZ: "#FB7185",
}

// asciiPieceColors uses the basic 16-colour set for terminals we cannot trust
// with hex values.
var asciiPieceColors = [game.KindCount]string{
	game.KindI: "14", // bright cyan
	game.KindJ: "12", // bright blue
	game.KindL: "3",  // yellow/brown
	game.KindO: "11", // bright yellow
	game.KindS: "10", // bright green
	game.KindT: "13", // bright magenta
	game.KindZ: "9",  // bright red
}

// Palette holds every style and glyph the renderer uses. It is built once per
// mode and shared; styles are compared by pointer.
type Palette struct {
	Mode  Mode
	Block string
	Ghost string

	Locked [game.KindCount]*Style
	Active [game.KindCount]*Style

	GhostStyle *Style
	Border     *Style
	BorderHot  *Style
	Title      *Style
	Label      *Style
	Value      *Style
	Mission    *Style
	Controls   *Style
	Dim        *Style
	Banner     *Style
	Star       [3]*Style
}

// NewPalette builds the palette for a render mode.
func NewPalette(mode Mode) *Palette {
	p := &Palette{Mode: mode}
	colors := pieceColors
	if mode == ModeASCII {
		p.Block, p.Ghost = blockASCII, ghostASCII
		colors = asciiPieceColors
	} else {
		p.Block, p.Ghost = blockUnicode, ghostUnicode
	}
	for k := game.KindI; k < game.KindCount; k++ {
		c := lipgloss.Color(colors[k])
		p.Locked[k] = NewStyle(c, false, false)
		p.Active[k] = NewStyle(c, true, false)
	}

	if mode == ModeASCII {
		p.GhostStyle = NewStyle(lipgloss.Color("8"), false, true)
		p.Border = NewStyle(lipgloss.Color("6"), false, false)
		p.BorderHot = NewStyle(lipgloss.Color("15"), true, false)
		p.Title = NewStyle(lipgloss.Color("14"), true, false)
		p.Label = NewStyle(lipgloss.Color("6"), false, false)
		p.Value = NewStyle(lipgloss.Color("15"), true, false)
		p.Mission = NewStyle(lipgloss.Color("13"), false, false)
		p.Controls = NewStyle(lipgloss.Color("8"), false, true)
		p.Dim = NewStyle(lipgloss.Color("8"), false, true)
		p.Banner = NewStyle(lipgloss.Color("11"), true, false)
		p.Star = [3]*Style{
			NewStyle(lipgloss.Color("8"), false, true),
			NewStyle(lipgloss.Color("6"), false, false),
			NewStyle(lipgloss.Color("15"), true, false),
		}
		return p
	}

	p.GhostStyle = NewStyle(lipgloss.Color("#4B5563"), false, true)
	p.Border = NewStyle(lipgloss.Color("#7C3AED"), false, false)
	p.BorderHot = NewStyle(lipgloss.Color("#F8FAFC"), true, false)
	p.Title = NewStyle(lipgloss.Color("#67E8F9"), true, false)
	p.Label = NewStyle(lipgloss.Color("#818CF8"), false, false)
	p.Value = NewStyle(lipgloss.Color("#F8FAFC"), true, false)
	p.Mission = NewStyle(lipgloss.Color("#F472B6"), false, false)
	p.Controls = NewStyle(lipgloss.Color("#6B7280"), false, true)
	p.Dim = NewStyle(lipgloss.Color("#4B5563"), false, true)
	p.Banner = NewStyle(lipgloss.Color("#FDE047"), true, false)
	p.Star = [3]*Style{
		NewStyle(lipgloss.Color("#3F3F5A"), false, true),
		NewStyle(lipgloss.Color("#7DD3FC"), false, false),
		NewStyle(lipgloss.Color("#F8FAFC"), true, false),
	}
	return p
}

// BlockFor returns the glyph and style for a block of kind k. The active piece
// renders one step brighter than locked cells.
func (p *Palette) BlockFor(k game.PieceKind, active bool) (string, *Style) {
	if int(k) >= game.KindCount {
		return p.Block, p.Dim
	}
	if active {
		return p.Block, p.Active[k]
	}
	return p.Block, p.Locked[k]
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/palette.go internal/render/palette_test.go
git commit -m "feat(render): neon palette, render modes, and glyph sets"
```

---

### Task 3: Adaptive layout

**Files:**
- Create: `internal/render/layout.go`
- Test: `internal/render/layout_test.go`

**Interfaces:**
- Consumes: `game.Width`, `game.VisibleRows`.
- Produces:
  - consts `CellCols = 2`, `BoardInnerW = 20`, `BoardInnerH = 20`, `BoardW = 22`, `BoardH = 22`, `MinWidth = 40`, `MinHeight = 24`, `SideColW = 10`.
  - `type SizeClass int` with `SizeSmall`, `SizeMedium`, `SizeWide`.
  - `type Layout struct { W, H int; TooSmall bool; Size SizeClass; ShowTitle, ShowMission, ShowStatLabels, ShowLeftColumn bool; TitleY, BoardX, BoardY, InnerX, InnerY, LeftX, RightX, HoldX, HoldY, NextX, NextY, NextCount, StatsX, StatsY, MissionY, ControlsY int }`
  - `func Compute(w, h int) Layout`

Size classes, by terminal width: `≥ 56` wide (HOLD + stats in a left column, NEXT×5 on the right), `44..55` medium (single right column, NEXT×3, labels on), `40..43` small (single right column, NEXT×3, stat values only). Height governs the §49.3 drop order: title needs `h ≥ 25`, mission control needs `h ≥ 24`, board (22 rows) and controls (1 row) always stay.

- [ ] **Step 1: Write the failing test**

Create `internal/render/layout_test.go`:

```go
package render

import "testing"

func TestLayoutConstants(t *testing.T) {
	if BoardInnerW != 20 || BoardInnerH != 20 || BoardW != 22 || BoardH != 22 {
		t.Fatalf("board geometry drifted: %d %d %d %d", BoardInnerW, BoardInnerH, BoardW, BoardH)
	}
	if MinWidth != 40 || MinHeight != 24 {
		t.Fatalf("minimum size drifted: %dx%d", MinWidth, MinHeight)
	}
}

func TestTooSmallBelowMinimum(t *testing.T) {
	for _, tc := range [][2]int{{34, 19}, {39, 30}, {80, 23}, {0, 0}, {-5, -5}} {
		l := Compute(tc[0], tc[1])
		if !l.TooSmall {
			t.Errorf("Compute(%d,%d) should be TooSmall", tc[0], tc[1])
		}
	}
	if l := Compute(40, 24); l.TooSmall {
		t.Error("Compute(40,24) should be usable")
	}
}

func TestSizeClasses(t *testing.T) {
	cases := []struct {
		w, h  int
		size  SizeClass
		nexts int
		left  bool
	}{
		{40, 24, SizeSmall, 3, false},
		{43, 30, SizeSmall, 3, false},
		{44, 30, SizeMedium, 3, false},
		{55, 30, SizeMedium, 3, false},
		{56, 30, SizeWide, 5, true},
		{120, 40, SizeWide, 5, true},
	}
	for _, tc := range cases {
		l := Compute(tc.w, tc.h)
		if l.Size != tc.size {
			t.Errorf("Compute(%d,%d).Size = %d, want %d", tc.w, tc.h, l.Size, tc.size)
		}
		if l.NextCount != tc.nexts {
			t.Errorf("Compute(%d,%d).NextCount = %d, want %d", tc.w, tc.h, l.NextCount, tc.nexts)
		}
		if l.ShowLeftColumn != tc.left {
			t.Errorf("Compute(%d,%d).ShowLeftColumn = %v, want %v", tc.w, tc.h, l.ShowLeftColumn, tc.left)
		}
	}
}

func TestDropOrderAsHeightShrinks(t *testing.T) {
	// 49.3: title goes first, then mission control. Controls and the board
	// always survive.
	tall := Compute(80, 30)
	if !tall.ShowTitle || !tall.ShowMission {
		t.Error("a 30-row terminal should show both title and mission control")
	}
	mid := Compute(80, 24)
	if mid.ShowTitle {
		t.Error("title should be dropped at 24 rows")
	}
	if !mid.ShowMission {
		t.Error("mission control should survive at 24 rows")
	}
	for _, l := range []Layout{tall, mid} {
		if l.ControlsY != l.H-1 {
			t.Errorf("controls line at %d, want %d", l.ControlsY, l.H-1)
		}
	}
}

func TestStatLabelsDropAtSmallWidths(t *testing.T) {
	if !Compute(56, 30).ShowStatLabels {
		t.Error("wide layout should show stat labels")
	}
	if !Compute(44, 30).ShowStatLabels {
		t.Error("medium layout should show stat labels")
	}
	if Compute(40, 24).ShowStatLabels {
		t.Error("small layout should show values only")
	}
}

func TestBoardFitsInsideTheTerminal(t *testing.T) {
	sizes := [][2]int{{40, 24}, {44, 24}, {56, 26}, {80, 30}, {200, 60}, {41, 25}, {57, 24}}
	for _, tc := range sizes {
		l := Compute(tc[0], tc[1])
		if l.TooSmall {
			t.Fatalf("Compute(%d,%d) unexpectedly too small", tc[0], tc[1])
		}
		if l.BoardX < 0 || l.BoardX+BoardW > l.W {
			t.Errorf("Compute(%d,%d): board columns %d..%d escape the terminal",
				tc[0], tc[1], l.BoardX, l.BoardX+BoardW)
		}
		if l.BoardY < 0 || l.BoardY+BoardH > l.H {
			t.Errorf("Compute(%d,%d): board rows %d..%d escape the terminal",
				tc[0], tc[1], l.BoardY, l.BoardY+BoardH)
		}
		if l.InnerX != l.BoardX+1 || l.InnerY != l.BoardY+1 {
			t.Errorf("Compute(%d,%d): inner origin misaligned with the border", tc[0], tc[1])
		}
	}
}

func TestSideColumnsStayInsideTheTerminal(t *testing.T) {
	for _, tc := range [][2]int{{40, 24}, {44, 30}, {56, 30}, {100, 40}} {
		l := Compute(tc[0], tc[1])
		if l.RightX+8 > l.W {
			t.Errorf("Compute(%d,%d): NEXT column at %d overflows width %d", tc[0], tc[1], l.RightX, l.W)
		}
		if l.ShowLeftColumn && l.LeftX < 0 {
			t.Errorf("Compute(%d,%d): left column at %d", tc[0], tc[1], l.LeftX)
		}
		if !l.ShowLeftColumn && l.HoldX != l.RightX {
			t.Errorf("Compute(%d,%d): without a left column, HOLD should sit in the right column",
				tc[0], tc[1])
		}
	}
}

func TestBoardAndSideColumnsDoNotOverlap(t *testing.T) {
	for _, tc := range [][2]int{{40, 24}, {44, 30}, {56, 30}, {90, 34}} {
		l := Compute(tc[0], tc[1])
		if l.RightX < l.BoardX+BoardW {
			t.Errorf("Compute(%d,%d): right column %d overlaps the board ending at %d",
				tc[0], tc[1], l.RightX, l.BoardX+BoardW)
		}
		if l.ShowLeftColumn && l.LeftX+SideColW > l.BoardX {
			t.Errorf("Compute(%d,%d): left column overlaps the board", tc[0], tc[1])
		}
	}
}

func TestNextNeverStacksAboveOrBelowTheBoard(t *testing.T) {
	// 49.3: NEXT is always beside the board, never over or under it.
	for _, tc := range [][2]int{{40, 24}, {44, 30}, {56, 30}} {
		l := Compute(tc[0], tc[1])
		if l.NextX < l.BoardX+BoardW {
			t.Errorf("Compute(%d,%d): NEXT is not beside the board", tc[0], tc[1])
		}
	}
}

func TestMissionAndControlsRowsAreDistinct(t *testing.T) {
	l := Compute(80, 30)
	if l.MissionY == l.ControlsY {
		t.Error("mission control and controls share a row")
	}
	if l.MissionY >= l.H || l.ControlsY >= l.H {
		t.Error("bottom rows fall outside the terminal")
	}
	if l.MissionY < l.BoardY+BoardH {
		t.Error("mission control overlaps the board")
	}
}

func TestComputeIsPure(t *testing.T) {
	a := Compute(80, 30)
	b := Compute(80, 30)
	if a != b {
		t.Error("Compute is not deterministic for the same size")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -run Layout -v` and `go test ./internal/render/ -run 'TooSmall|SizeClass|DropOrder|Board|Side|Next|Mission|Compute' -v`
Expected: FAIL — `undefined: Compute`.

- [ ] **Step 3: Implement the layout**

Create `internal/render/layout.go`:

```go
package render

import "cosmic-tetris/internal/game"

// Board geometry in terminal cells. Each logical block is two columns wide, so
// the 10x20 visible playfield is 20x20 characters, plus a one-character border
// on every side.
const (
	CellCols    = 2
	BoardInnerW = game.Width * CellCols
	BoardInnerH = game.VisibleRows
	BoardW      = BoardInnerW + 2
	BoardH      = BoardInnerH + 2

	// MinWidth and MinHeight are the smallest terminal we claim to support.
	MinWidth  = 40
	MinHeight = 24

	// SideColW is the width of the HOLD/NEXT/stats columns.
	SideColW = 10

	// Width thresholds for the size classes.
	wideMinWidth   = 56
	mediumMinWidth = 44
)

// SizeClass is how generous the terminal is.
type SizeClass int

// The size classes, smallest first.
const (
	SizeSmall SizeClass = iota
	SizeMedium
	SizeWide
)

// Layout is where everything goes for one terminal size. All coordinates are
// grid cells, with (0,0) at the top left. A field set to -1 means "not drawn".
type Layout struct {
	W, H     int
	TooSmall bool
	Size     SizeClass

	ShowTitle       bool
	ShowMission     bool
	ShowStatLabels  bool
	ShowLeftColumn  bool

	TitleY int

	BoardX, BoardY int // top-left of the border box
	InnerX, InnerY int // top-left of the playfield inside the border

	LeftX  int
	RightX int

	HoldX, HoldY int
	NextX, NextY int
	NextCount    int

	StatsX, StatsY int

	MissionY  int
	ControlsY int
}

// Compute lays out one frame for a terminal of w x h cells.
//
// Vertical budget, per 49.3: the board (22 rows) and the controls line (1 row)
// always survive. The title needs one more row, mission control one more. When
// the terminal is taller than the minimum, the spare rows go above and below
// the board so it stays visually centred.
//
// Horizontal budget: the board is 22 columns. A wide terminal gets a left
// column (HOLD and stats) and a right column (NEXT x5). Narrower terminals get
// only a right column holding NEXT x3, HOLD, and the stats; the very smallest
// drop the stat labels and show bare values.
func Compute(w, h int) Layout {
	l := Layout{W: w, H: h, TitleY: -1, MissionY: -1}
	if w < MinWidth || h < MinHeight {
		l.TooSmall = true
		return l
	}

	l.ShowMission = h >= BoardH+2 // board + controls + mission
	l.ShowTitle = h >= BoardH+3   // ... + title

	switch {
	case w >= wideMinWidth:
		l.Size = SizeWide
		l.ShowLeftColumn = true
		l.ShowStatLabels = true
		l.NextCount = 5
	case w >= mediumMinWidth:
		l.Size = SizeMedium
		l.ShowStatLabels = true
		l.NextCount = 3
	default:
		l.Size = SizeSmall
		l.ShowStatLabels = false
		l.NextCount = 3
	}

	// Horizontal placement: centre the whole cluster.
	clusterW := BoardW + 1 + SideColW
	if l.ShowLeftColumn {
		clusterW += SideColW + 1
	}
	startX := (w - clusterW) / 2
	if startX < 0 {
		startX = 0
	}
	if l.ShowLeftColumn {
		l.LeftX = startX
		l.BoardX = startX + SideColW + 1
	} else {
		l.LeftX = -1
		l.BoardX = startX
	}
	l.RightX = l.BoardX + BoardW + 1
	if l.RightX+SideColW > w {
		l.RightX = w - SideColW
	}
	if l.RightX < l.BoardX+BoardW {
		l.RightX = l.BoardX + BoardW
	}

	// Vertical placement.
	top := 0
	if l.ShowTitle {
		l.TitleY = 0
		top = 1
	}
	bottom := 1 // controls
	if l.ShowMission {
		bottom++
	}
	spare := h - top - bottom - BoardH
	if spare < 0 {
		spare = 0
	}
	l.BoardY = top + spare/2
	l.InnerX = l.BoardX + 1
	l.InnerY = l.BoardY + 1

	l.ControlsY = h - 1
	if l.ShowMission {
		l.MissionY = h - 2
	}

	// Side-column contents.
	l.NextX = l.RightX
	l.NextY = l.BoardY + 1
	if l.ShowLeftColumn {
		l.HoldX = l.LeftX
		l.HoldY = l.BoardY + 1
		l.StatsX = l.LeftX
		l.StatsY = l.HoldY + 4
	} else {
		l.HoldX = l.RightX
		l.HoldY = l.NextY + 1 + 3*l.NextCount
		l.StatsX = l.RightX
		l.StatsY = l.HoldY + 3
	}
	return l
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/layout.go internal/render/layout_test.go
git commit -m "feat(render): adaptive layout with the pinned small-terminal drop order"
```

---

### Task 4: Board, ghost, and active piece drawing

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: `Grid`, `Palette`, `Layout`, `game.Game`, `game.Piece`.
- Produces:
  - `func DrawBoardBorder(g *Grid, l Layout, p *Palette, st *Style, shakeX, shakeY int)`
  - `func DrawLockedCells(g *Grid, l Layout, p *Palette, gm *game.Game, shakeX, shakeY int)`
  - `func DrawGhost(g *Grid, l Layout, p *Palette, gm *game.Game, shakeX, shakeY int)`
  - `func DrawActivePiece(g *Grid, l Layout, p *Palette, gm *game.Game, shakeX, shakeY int)`
  - `func BoardCellXY(l Layout, bx, by, shakeX, shakeY int) (x, y int, visible bool)` — maps a board cell to grid coordinates, reporting `false` for the hidden spawn rows.

Every drawing call takes the shake offset so Plan 3 can shift the board by one cell without any of these functions changing.

- [ ] **Step 1: Write the failing test**

Create `internal/render/board_test.go`:

```go
package render

import (
	"strings"
	"testing"

	"github.com/charmbracelet/x/ansi"

	"cosmic-tetris/internal/game"
)

// lines renders the grid and splits it, padding each line to the grid width so
// tests can index columns directly.
func lines(g *Grid) []string {
	out := strings.Split(ansi.Strip(g.Render()), "\n")
	for i, s := range out {
		if n := len([]rune(s)); n < g.W {
			out[i] = s + strings.Repeat(" ", g.W-n)
		}
	}
	return out
}

func runeAt(t *testing.T, g *Grid, x, y int) rune {
	t.Helper()
	ls := lines(g)
	if y < 0 || y >= len(ls) {
		t.Fatalf("row %d out of range (%d rows)", y, len(ls))
	}
	rs := []rune(ls[y])
	if x < 0 || x >= len(rs) {
		t.Fatalf("column %d out of range (%d columns)", x, len(rs))
	}
	return rs[x]
}

func TestBoardCellXYMapsVisibleRows(t *testing.T) {
	l := Compute(80, 30)
	// Board row 2 is the first visible row.
	x, y, ok := BoardCellXY(l, 0, game.HiddenRows, 0, 0)
	if !ok {
		t.Fatal("first visible row reported invisible")
	}
	if x != l.InnerX || y != l.InnerY {
		t.Errorf("first visible cell at (%d,%d), want (%d,%d)", x, y, l.InnerX, l.InnerY)
	}
	x, _, _ = BoardCellXY(l, 1, game.HiddenRows, 0, 0)
	if x != l.InnerX+CellCols {
		t.Errorf("column 1 at x=%d, want %d", x, l.InnerX+CellCols)
	}
	if _, _, ok := BoardCellXY(l, 0, 0, 0, 0); ok {
		t.Error("hidden spawn row reported visible")
	}
	if _, _, ok := BoardCellXY(l, 0, 1, 0, 0); ok {
		t.Error("hidden spawn row reported visible")
	}
}

func TestBoardCellXYAppliesShake(t *testing.T) {
	l := Compute(80, 30)
	x, y, _ := BoardCellXY(l, 3, 10, 1, -1)
	bx, by, _ := BoardCellXY(l, 3, 10, 0, 0)
	if x != bx+1 || y != by-1 {
		t.Errorf("shake not applied: (%d,%d) vs (%d,%d)", x, y, bx, by)
	}
}

func TestDrawBoardBorderShape(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	p := NewPalette(ModeFull)
	DrawBoardBorder(g, l, p, p.Border, 0, 0)

	if got := runeAt(t, g, l.BoardX, l.BoardY); got != '╔' {
		t.Errorf("top-left corner = %q, want ╔", got)
	}
	if got := runeAt(t, g, l.BoardX+BoardW-1, l.BoardY); got != '╗' {
		t.Errorf("top-right corner = %q, want ╗", got)
	}
	if got := runeAt(t, g, l.BoardX, l.BoardY+BoardH-1); got != '╚' {
		t.Errorf("bottom-left corner = %q, want ╚", got)
	}
	if got := runeAt(t, g, l.BoardX+BoardW-1, l.BoardY+BoardH-1); got != '╝' {
		t.Errorf("bottom-right corner = %q, want ╝", got)
	}
	if got := runeAt(t, g, l.BoardX+5, l.BoardY); got != '═' {
		t.Errorf("top edge = %q, want ═", got)
	}
	if got := runeAt(t, g, l.BoardX, l.BoardY+5); got != '║' {
		t.Errorf("left edge = %q, want ║", got)
	}
}

func TestDrawBoardBorderASCII(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	p := NewPalette(ModeASCII)
	DrawBoardBorder(g, l, p, p.Border, 0, 0)
	for _, tc := range []struct {
		x, y int
		want rune
	}{
		{l.BoardX, l.BoardY, '+'},
		{l.BoardX + 5, l.BoardY, '-'},
		{l.BoardX, l.BoardY + 5, '|'},
	} {
		if got := runeAt(t, g, tc.x, tc.y); got != tc.want {
			t.Errorf("ASCII border at (%d,%d) = %q, want %q", tc.x, tc.y, got, tc.want)
		}
	}
	if strings.ContainsAny(ansi.Strip(g.Render()), "╔═║╝") {
		t.Error("ASCII mode emitted box-drawing characters")
	}
}

func TestDrawLockedCellsUsesTwoColumnGlyphs(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	p := NewPalette(ModeFull)
	gm := game.New(1)
	gm.Board.Set(0, 21, game.CellOf(game.KindI))
	gm.Board.Set(9, 21, game.CellOf(game.KindZ))
	DrawLockedCells(g, l, p, gm, 0, 0)

	bottomY := l.InnerY + game.VisibleRows - 1
	if got := runeAt(t, g, l.InnerX, bottomY); got != '█' {
		t.Errorf("left block first column = %q", got)
	}
	if got := runeAt(t, g, l.InnerX+1, bottomY); got != '█' {
		t.Errorf("left block second column = %q", got)
	}
	if got := runeAt(t, g, l.InnerX+18, bottomY); got != '█' {
		t.Errorf("right block first column = %q", got)
	}
	if got := runeAt(t, g, l.InnerX+2, bottomY); got != ' ' {
		t.Errorf("empty cell = %q, want blank", got)
	}
	if got := g.At(l.InnerX, bottomY).Style; got != p.Locked[game.KindI] {
		t.Error("locked cell did not use the locked style")
	}
}

func TestHiddenRowsAreNotDrawn(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	p := NewPalette(ModeFull)
	gm := game.New(1)
	gm.Board.Set(4, 0, game.CellOf(game.KindT))
	gm.Board.Set(4, 1, game.CellOf(game.KindT))
	DrawLockedCells(g, l, p, gm, 0, 0)
	if strings.Contains(ansi.Strip(g.Render()), "█") {
		t.Error("cells in the hidden spawn rows were drawn")
	}
}

func TestDrawActivePieceUsesTheBrightStyle(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	p := NewPalette(ModeFull)
	gm := game.New(1)
	gm.Active = game.Piece{Kind: game.KindT, Rotation: 0, X: 4, Y: 10}
	DrawActivePiece(g, l, p, gm, 0, 0)

	x, y, _ := BoardCellXY(l, 5, 10, 0, 0)
	if got := g.At(x, y).Style; got != p.Active[game.KindT] {
		t.Error("active piece did not use the active style")
	}
}

func TestGhostIsDrawnAtTheLandingRowOnly(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	p := NewPalette(ModeFull)
	gm := game.New(1)
	gm.Active = game.Piece{Kind: game.KindO, Rotation: 0, X: 4, Y: 4}
	DrawGhost(g, l, p, gm, 0, 0)

	ghostY := gm.GhostY()
	x, y, _ := BoardCellXY(l, 4, ghostY, 0, 0)
	if got := runeAt(t, g, x, y); got != '░' {
		t.Errorf("ghost glyph at the landing row = %q, want ░", got)
	}
	// Nothing at the active piece's own position.
	ax, ay, _ := BoardCellXY(l, 4, 4, 0, 0)
	if got := runeAt(t, g, ax, ay); got != ' ' {
		t.Errorf("ghost drew at the active piece's row: %q", got)
	}
}

func TestGhostNeverCoversLockedBlocks(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	p := NewPalette(ModeFull)
	gm := game.New(1)
	gm.Active = game.Piece{Kind: game.KindO, Rotation: 0, X: 4, Y: 4}
	// Fill the landing area, then draw the locked cells and the ghost in
	// pipeline order.
	for _, c := range gm.GhostPiece().Cells() {
		gm.Board.Set(c.X, c.Y, game.CellOf(game.KindI))
	}
	DrawLockedCells(g, l, p, gm, 0, 0)
	DrawGhost(g, l, p, gm, 0, 0)

	for _, c := range gm.GhostPiece().Cells() {
		x, y, ok := BoardCellXY(l, c.X, c.Y, 0, 0)
		if !ok {
			continue
		}
		if got := runeAt(t, g, x, y); got != '█' {
			t.Errorf("ghost overwrote a locked block at (%d,%d): %q", c.X, c.Y, got)
		}
	}
}

func TestGhostGlyphInASCIIMode(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	p := NewPalette(ModeASCII)
	gm := game.New(1)
	gm.Active = game.Piece{Kind: game.KindO, Rotation: 0, X: 4, Y: 4}
	DrawGhost(g, l, p, gm, 0, 0)
	if !strings.Contains(ansi.Strip(g.Render()), "··") {
		t.Error("ASCII ghost glyph not drawn")
	}
}

func TestDrawingNeverMutatesGameState(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	p := NewPalette(ModeFull)
	gm := game.New(9)
	gm.Active = game.Piece{Kind: game.KindL, Rotation: 1, X: 4, Y: 8}
	before := *gm

	DrawBoardBorder(g, l, p, p.Border, 0, 0)
	DrawLockedCells(g, l, p, gm, 0, 0)
	DrawGhost(g, l, p, gm, 0, 0)
	DrawActivePiece(g, l, p, gm, 0, 0)

	if gm.Active != before.Active || gm.Board != before.Board || gm.Score != before.Score {
		t.Error("drawing mutated the game state")
	}
}

// Review Focus item 5: a grid too small for the layout must clip, not panic.
func TestDrawingIntoAnUndersizedGridClips(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(10, 5) // deliberately mismatched
	p := NewPalette(ModeFull)
	gm := game.New(1)
	DrawBoardBorder(g, l, p, p.Border, 0, 0)
	DrawLockedCells(g, l, p, gm, 0, 0)
	DrawGhost(g, l, p, gm, 0, 0)
	DrawActivePiece(g, l, p, gm, 0, 0)
	// Reaching here without a panic is the assertion.
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -run 'Board|Ghost|Active|Hidden|Drawing' -v`
Expected: FAIL — `undefined: BoardCellXY`.

- [ ] **Step 3: Implement board drawing**

Create `internal/render/board.go`:

```go
package render

import "cosmic-tetris/internal/game"

// Border glyph sets.
type borderSet struct {
	tl, tr, bl, br, h, v rune
}

var (
	borderUnicode = borderSet{tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║'}
	borderASCII   = borderSet{tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|'}
)

func bordersFor(p *Palette) borderSet {
	if p.Mode == ModeASCII {
		return borderASCII
	}
	return borderUnicode
}

// BoardCellXY maps a board cell to the grid position of its left-hand column,
// applying the shake offset. It reports visible=false for the hidden spawn
// rows, which are never drawn.
func BoardCellXY(l Layout, bx, by, shakeX, shakeY int) (x, y int, visible bool) {
	if by < game.HiddenRows || by >= game.Height || bx < 0 || bx >= game.Width {
		return 0, 0, false
	}
	x = l.InnerX + bx*CellCols + shakeX
	y = l.InnerY + (by - game.HiddenRows) + shakeY
	return x, y, true
}

// DrawBoardBorder draws the machinery around the playfield. The style is a
// parameter so the FX layer can animate it without owning the drawing code.
func DrawBoardBorder(g *Grid, l Layout, p *Palette, st *Style, shakeX, shakeY int) {
	b := bordersFor(p)
	x0, y0 := l.BoardX+shakeX, l.BoardY+shakeY
	x1, y1 := x0+BoardW-1, y0+BoardH-1

	g.Set(x0, y0, b.tl, st)
	g.Set(x1, y0, b.tr, st)
	g.Set(x0, y1, b.bl, st)
	g.Set(x1, y1, b.br, st)
	for x := x0 + 1; x < x1; x++ {
		g.Set(x, y0, b.h, st)
		g.Set(x, y1, b.h, st)
	}
	for y := y0 + 1; y < y1; y++ {
		g.Set(x0, y, b.v, st)
		g.Set(x1, y, b.v, st)
	}
}

// drawBlock writes a two-column glyph at a board cell.
func drawBlock(g *Grid, l Layout, bx, by, shakeX, shakeY int, glyph string, st *Style) {
	x, y, ok := BoardCellXY(l, bx, by, shakeX, shakeY)
	if !ok {
		return
	}
	i := 0
	for _, r := range glyph {
		g.Set(x+i, y, r, st)
		i++
	}
}

// DrawLockedCells draws the settled stack.
func DrawLockedCells(g *Grid, l Layout, p *Palette, gm *game.Game, shakeX, shakeY int) {
	for by := game.HiddenRows; by < game.Height; by++ {
		for bx := 0; bx < game.Width; bx++ {
			c := gm.Board.At(bx, by)
			if !c.Filled() {
				continue
			}
			glyph, st := p.BlockFor(c.Kind(), false)
			drawBlock(g, l, bx, by, shakeX, shakeY, glyph, st)
		}
	}
}

// DrawGhost draws the landing preview under the active piece. It skips cells
// that already hold a locked block, so the ghost can never obscure the stack.
func DrawGhost(g *Grid, l Layout, p *Palette, gm *game.Game, shakeX, shakeY int) {
	ghost := gm.GhostPiece()
	if ghost.Y == gm.Active.Y {
		return // the piece is already resting; a ghost would just double it
	}
	active := map[game.Point]bool{}
	for _, c := range gm.Active.Cells() {
		active[c] = true
	}
	for _, c := range ghost.Cells() {
		if active[c] || gm.Board.At(c.X, c.Y).Filled() {
			continue
		}
		drawBlock(g, l, c.X, c.Y, shakeX, shakeY, p.Ghost, p.GhostStyle)
	}
}

// DrawActivePiece draws the falling piece one step brighter than the stack.
func DrawActivePiece(g *Grid, l Layout, p *Palette, gm *game.Game, shakeX, shakeY int) {
	glyph, st := p.BlockFor(gm.Active.Kind, true)
	for _, c := range gm.Active.Cells() {
		drawBlock(g, l, c.X, c.Y, shakeX, shakeY, glyph, st)
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): board border, stack, ghost, and active piece"
```

---

### Task 5: HUD — title, hold, next, stats, mission line, controls

**Files:**
- Create: `internal/render/hud.go`
- Test: `internal/render/hud_test.go`

**Interfaces:**
- Consumes: `Grid`, `Layout`, `Palette`, `game.Game`.
- Produces:
  - `func UniverseLabel(seed int64) string` — `"7F3A"`-style tag from the seed.
  - `func DrawTitle(g *Grid, l Layout, p *Palette, seed int64)`
  - `func DrawHold(g *Grid, l Layout, p *Palette, gm *game.Game)`
  - `func DrawNext(g *Grid, l Layout, p *Palette, gm *game.Game)`
  - `func DrawStats(g *Grid, l Layout, p *Palette, gm *game.Game)`
  - `func DrawMission(g *Grid, l Layout, p *Palette, msg string)`
  - `func DrawControls(g *Grid, l Layout, p *Palette)`
  - `func DrawPiecePreview(g *Grid, x, y int, k game.PieceKind, p *Palette, st *Style)`

- [ ] **Step 1: Write the failing test**

Create `internal/render/hud_test.go`:

```go
package render

import (
	"strings"
	"testing"

	"github.com/charmbracelet/x/ansi"

	"cosmic-tetris/internal/game"
)

func TestUniverseLabelIsStableAndFourHexDigits(t *testing.T) {
	a := UniverseLabel(8675309)
	if len(a) != 4 {
		t.Fatalf("label = %q, want four characters", a)
	}
	if a != UniverseLabel(8675309) {
		t.Error("label is not stable for one seed")
	}
	if a == UniverseLabel(8675310) {
		t.Error("label does not vary with the seed")
	}
	if strings.ToUpper(a) != a {
		t.Errorf("label %q is not upper case", a)
	}
}

func TestDrawTitleShowsNameAndUniverse(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	p := NewPalette(ModeFull)
	DrawTitle(g, l, p, 8675309)
	row := lines(g)[l.TitleY]
	if !strings.Contains(row, "COSMIC TETRIS") {
		t.Errorf("title row = %q", row)
	}
	if !strings.Contains(row, UniverseLabel(8675309)) {
		t.Errorf("title row is missing the universe label: %q", row)
	}
	if len([]rune(strings.TrimRight(row, " "))) > l.W {
		t.Error("title overflows the terminal width")
	}
}

func TestTitleIsSkippedWhenTheLayoutDropsIt(t *testing.T) {
	l := Compute(80, 24) // ShowTitle false
	g := NewGrid(80, 24)
	p := NewPalette(ModeFull)
	DrawTitle(g, l, p, 1)
	if strings.Contains(ansi.Strip(g.Render()), "COSMIC") {
		t.Error("title drawn despite ShowTitle=false")
	}
}

func TestDrawHoldEmptyAndFilled(t *testing.T) {
	l := Compute(80, 30)
	p := NewPalette(ModeFull)

	g := NewGrid(80, 30)
	gm := game.New(1)
	DrawHold(g, l, p, gm)
	if !strings.Contains(lines(g)[l.HoldY-1], "HOLD") {
		t.Errorf("HOLD label missing: %q", lines(g)[l.HoldY-1])
	}

	g = NewGrid(80, 30)
	k := game.KindO
	gm.Hold = &k
	DrawHold(g, l, p, gm)
	if !strings.Contains(ansi.Strip(g.Render()), "██") {
		t.Error("held piece preview not drawn")
	}
}

func TestDrawNextRespectsTheLayoutCount(t *testing.T) {
	p := NewPalette(ModeFull)
	gm := game.New(2)

	for _, tc := range []struct{ w, h, want int }{{80, 30, 5}, {40, 24, 3}} {
		l := Compute(tc.w, tc.h)
		g := NewGrid(tc.w, tc.h)
		DrawNext(g, l, p, gm)
		out := ansi.Strip(g.Render())
		if !strings.Contains(out, "NEXT") {
			t.Errorf("%dx%d: NEXT label missing", tc.w, tc.h)
		}
		if l.NextCount != tc.want {
			t.Errorf("%dx%d: NextCount = %d, want %d", tc.w, tc.h, l.NextCount, tc.want)
		}
		if strings.Count(out, "██") == 0 {
			t.Errorf("%dx%d: no previews drawn", tc.w, tc.h)
		}
	}
}

func TestDrawNextStaysInsideTheTerminal(t *testing.T) {
	for _, tc := range [][2]int{{40, 24}, {44, 30}, {56, 30}, {100, 40}} {
		l := Compute(tc[0], tc[1])
		g := NewGrid(tc[0], tc[1])
		DrawNext(g, l, NewPalette(ModeFull), game.New(3))
		for _, row := range lines(g) {
			if len([]rune(row)) > tc[0] {
				t.Errorf("%dx%d: a row is %d columns wide", tc[0], tc[1], len([]rune(row)))
			}
		}
	}
}

func TestDrawStatsWithAndWithoutLabels(t *testing.T) {
	p := NewPalette(ModeFull)
	gm := game.New(4)
	gm.Score = 129340
	gm.Lines = 42
	gm.Level = 7

	wide := Compute(80, 30)
	g := NewGrid(80, 30)
	DrawStats(g, wide, p, gm)
	out := ansi.Strip(g.Render())
	for _, want := range []string{"SCORE", "00129340", "LINES", "042", "LEVEL", "07"} {
		if !strings.Contains(out, want) {
			t.Errorf("wide stats missing %q in:\n%s", want, out)
		}
	}

	small := Compute(40, 24)
	g = NewGrid(40, 24)
	DrawStats(g, small, p, gm)
	out = ansi.Strip(g.Render())
	if strings.Contains(out, "SCORE") || strings.Contains(out, "LINES") {
		t.Errorf("small layout drew stat labels:\n%s", out)
	}
	for _, want := range []string{"00129340", "042", "07"} {
		if !strings.Contains(out, want) {
			t.Errorf("small stats missing value %q in:\n%s", want, out)
		}
	}
}

func TestDrawMissionPrefixesTheChannel(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	p := NewPalette(ModeFull)
	DrawMission(g, l, p, "NOMINALISH")
	row := lines(g)[l.MissionY]
	if !strings.Contains(row, "MISSION CONTROL: NOMINALISH") {
		t.Errorf("mission row = %q", row)
	}
}

func TestDrawMissionTruncatesLongMessages(t *testing.T) {
	l := Compute(40, 24)
	g := NewGrid(40, 24)
	p := NewPalette(ModeFull)
	DrawMission(g, l, p, strings.Repeat("VERY LONG STATUS ", 10))
	row := lines(g)[l.MissionY]
	if len([]rune(strings.TrimRight(row, " "))) > 40 {
		t.Errorf("mission row is %d columns wide", len([]rune(row)))
	}
}

func TestDrawMissionIsSkippedWhenDropped(t *testing.T) {
	l := Compute(80, 23) // too short: TooSmall, so nothing is drawn
	if !l.TooSmall {
		t.Skip("layout thresholds changed")
	}
	g := NewGrid(80, 23)
	DrawMission(g, l, NewPalette(ModeFull), "HELLO")
	if strings.Contains(ansi.Strip(g.Render()), "HELLO") {
		t.Error("mission drawn for a too-small layout")
	}
}

func TestDrawControlsFitsEveryWidth(t *testing.T) {
	for _, tc := range [][2]int{{40, 24}, {44, 30}, {56, 30}, {120, 40}} {
		l := Compute(tc[0], tc[1])
		g := NewGrid(tc[0], tc[1])
		DrawControls(g, l, NewPalette(ModeFull))
		row := lines(g)[l.ControlsY]
		trimmed := strings.TrimRight(row, " ")
		if len([]rune(trimmed)) > tc[0] {
			t.Errorf("%dx%d: controls line is %d columns", tc[0], tc[1], len([]rune(trimmed)))
		}
		if !strings.Contains(row, "help") {
			t.Errorf("%dx%d: controls line does not mention help: %q", tc[0], tc[1], trimmed)
		}
	}
}

func TestDrawControlsASCIIHasNoArrows(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	DrawControls(g, l, NewPalette(ModeASCII))
	row := lines(g)[l.ControlsY]
	if strings.ContainsAny(row, "←→↑↓") {
		t.Errorf("ASCII controls line contains arrows: %q", row)
	}
}

func TestPiecePreviewIsNormalizedToTheTopLeft(t *testing.T) {
	g := NewGrid(12, 4)
	p := NewPalette(ModeFull)
	DrawPiecePreview(g, 0, 0, game.KindI, p, p.Locked[game.KindI])
	out := lines(g)
	if !strings.HasPrefix(out[0], "████████") {
		t.Errorf("I preview row 0 = %q, want the bar flush to the top-left", out[0])
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -run 'Universe|Title|Hold|Next|Stats|Mission|Controls|Preview' -v`
Expected: FAIL — `undefined: UniverseLabel`.

- [ ] **Step 3: Implement the HUD**

Create `internal/render/hud.go`:

```go
package render

import (
	"fmt"
	"strings"

	"cosmic-tetris/internal/game"
)

// UniverseLabel is the four-hex-digit tag shown in the title bar. It is
// derived from the seed, so the same universe always has the same name.
func UniverseLabel(seed int64) string {
	return fmt.Sprintf("%04X", uint16(seed))
}

// DrawTitle draws the top line: game name and universe tag.
func DrawTitle(g *Grid, l Layout, p *Palette, seed int64) {
	if l.TooSmall || !l.ShowTitle {
		return
	}
	left := "✦ COSMIC TETRIS"
	if p.Mode == ModeASCII {
		left = "* COSMIC TETRIS"
	}
	right := "LOCAL UNIVERSE " + UniverseLabel(seed)
	g.SetString(l.BoardX, l.TitleY, left, p.Title)
	if x := l.W - len([]rune(right)); x > l.BoardX+len([]rune(left))+1 {
		g.SetString(x, l.TitleY, right, p.Label)
	}
}

// DrawPiecePreview draws a piece's spawn silhouette with its top-left cell at
// (x, y), used by HOLD and NEXT.
func DrawPiecePreview(g *Grid, x, y int, k game.PieceKind, p *Palette, st *Style) {
	cells := game.Piece{Kind: k}.Normalized()
	minX, minY := 3, 3
	for _, c := range cells {
		if c.X < minX {
			minX = c.X
		}
		if c.Y < minY {
			minY = c.Y
		}
	}
	for _, c := range cells {
		gx := x + (c.X-minX)*CellCols
		gy := y + (c.Y - minY)
		i := 0
		for _, r := range p.Block {
			g.Set(gx+i, gy, r, st)
			i++
		}
	}
}

// DrawHold draws the HOLD box.
func DrawHold(g *Grid, l Layout, p *Palette, gm *game.Game) {
	if l.TooSmall {
		return
	}
	g.SetString(l.HoldX, l.HoldY-1, "HOLD", p.Label)
	if gm.Hold == nil {
		g.SetString(l.HoldX, l.HoldY, "--", p.Dim)
		return
	}
	DrawPiecePreview(g, l.HoldX, l.HoldY, *gm.Hold, p, p.Locked[*gm.Hold])
}

// DrawNext draws the upcoming pieces beside the board.
func DrawNext(g *Grid, l Layout, p *Palette, gm *game.Game) {
	if l.TooSmall {
		return
	}
	g.SetString(l.NextX, l.NextY-1, "NEXT", p.Label)
	n := l.NextCount
	if n > len(gm.Next) {
		n = len(gm.Next)
	}
	for i := 0; i < n; i++ {
		k := gm.Next[i]
		st := p.Locked[k]
		if i == 0 {
			st = p.Active[k]
		}
		DrawPiecePreview(g, l.NextX, l.NextY+i*3, k, p, st)
	}
}

// DrawStats draws score, lines, and level. At small widths the labels go and
// only the values remain, per the pinned drop order.
func DrawStats(g *Grid, l Layout, p *Palette, gm *game.Game) {
	if l.TooSmall {
		return
	}
	rows := []struct {
		label string
		value string
	}{
		{"SCORE", fmt.Sprintf("%08d", gm.Score)},
		{"LINES", fmt.Sprintf("%03d", gm.Lines)},
		{"LEVEL", fmt.Sprintf("%02d", gm.Level)},
	}
	y := l.StatsY
	for _, r := range rows {
		if l.ShowStatLabels {
			g.SetString(l.StatsX, y, r.label, p.Label)
			y++
		}
		g.SetString(l.StatsX, y, r.value, p.Value)
		y++
	}
}

// DrawMission draws the one-line status channel.
func DrawMission(g *Grid, l Layout, p *Palette, msg string) {
	if l.TooSmall || !l.ShowMission || msg == "" {
		return
	}
	prefix := "☄ MISSION CONTROL: "
	if p.Mode == ModeASCII {
		prefix = "> MISSION CONTROL: "
	}
	line := prefix + msg
	limit := l.W - l.BoardX
	if r := []rune(line); len(r) > limit && limit > 0 {
		line = string(r[:limit])
	}
	g.SetString(l.BoardX, l.MissionY, line, p.Mission)
}

// controls lines, long and short. The short form is used when the long one
// would not fit.
const (
	controlsLong      = "←→ move   ↑ rotate   ↓ descend   SPACE YEET   c hold   ? help"
	controlsShort     = "←→ move  ↑ rot  SPACE yeet  ? help"
	controlsLongASCII = "<> move   w rotate   s descend   SPACE YEET   c hold   ? help"
	controlsShortASCII = "<> move  w rot  SPACE yeet  ? help"
)

// DrawControls draws the bottom control hint line, choosing the longest
// variant that fits.
func DrawControls(g *Grid, l Layout, p *Palette) {
	if l.TooSmall {
		return
	}
	long, short := controlsLong, controlsShort
	if p.Mode == ModeASCII {
		long, short = controlsLongASCII, controlsShortASCII
	}
	line := long
	if len([]rune(line)) > l.W {
		line = short
	}
	if r := []rune(line); len(r) > l.W {
		line = string(r[:l.W])
	}
	x := (l.W - len([]rune(line))) / 2
	if x < 0 {
		x = 0
	}
	g.SetString(x, l.ControlsY, line, p.Controls)
	_ = strings.TrimSpace // keep the import honest if the helper is unused
}
```

Drop the `strings` import and the `_ = strings.TrimSpace` line if nothing else in the file needs it — `go vet` and the compiler will tell you.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/hud.go internal/render/hud_test.go
git commit -m "feat(render): title, hold, next, stats, mission line, and controls"
```

---

### Task 6: Overlays — box helper, pause, too-small notice, game over

**Files:**
- Create: `internal/render/overlay.go`
- Test: `internal/render/overlay_test.go`

**Interfaces:**
- Consumes: `Grid`, `Layout`, `Palette`, `game.Game`.
- Produces:
  - `type Overlay struct { Title string; Lines []string; Style, TitleStyle *Style }`
  - `func DrawOverlay(g *Grid, l Layout, p *Palette, o Overlay)` — centres a bordered box over the frame and clips to the grid.
  - `func PauseOverlay(p *Palette) Overlay`
  - `func GameOverOverlay(p *Palette, gm *game.Game) Overlay`
  - `func HelpOverlay(p *Palette, body []string) Overlay` — body comes from the app's key map (Task 8), so `render` stays free of key bindings.
  - `func DrawTooSmall(g *Grid, w, h int, p *Palette)`

Copy: use the exact wording from `design.md` §30 (pause), §28 (game over), and §31 (too-small notice) wherever it is spelled out there; the strings below are the fallbacks and are what the golden files in Task 11 will record.

- [ ] **Step 1: Write the failing test**

Create `internal/render/overlay_test.go`:

```go
package render

import (
	"strings"
	"testing"

	"github.com/charmbracelet/x/ansi"

	"cosmic-tetris/internal/game"
)

func TestDrawOverlayIsCenteredAndBordered(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	p := NewPalette(ModeFull)
	DrawOverlay(g, l, p, Overlay{Title: "PAUSED", Lines: []string{"line one", "two"}})

	out := lines(g)
	var top, bottom int = -1, -1
	for y, row := range out {
		if strings.Contains(row, "╔") {
			top = y
		}
		if strings.Contains(row, "╚") {
			bottom = y
		}
	}
	if top < 0 || bottom < 0 {
		t.Fatalf("overlay box not drawn:\n%s", strings.Join(out, "\n"))
	}
	if bottom <= top {
		t.Fatalf("box rows out of order: %d..%d", top, bottom)
	}
	// Roughly vertically centred: equal-ish margins.
	if diff := (top) - (29 - bottom); diff > 1 || diff < -1 {
		t.Errorf("box is not vertically centred: top margin %d, bottom margin %d", top, 29-bottom)
	}
	joined := strings.Join(out, "\n")
	if !strings.Contains(joined, "PAUSED") || !strings.Contains(joined, "line one") {
		t.Errorf("overlay content missing:\n%s", joined)
	}
}

func TestOverlayIsWideEnoughForItsWidestLine(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	p := NewPalette(ModeFull)
	long := "a fairly long overlay line that must fit inside the box"
	DrawOverlay(g, l, p, Overlay{Title: "T", Lines: []string{long}})
	joined := ansi.Strip(g.Render())
	if !strings.Contains(joined, long) {
		t.Errorf("long line was truncated:\n%s", joined)
	}
}

// Review Focus item 2.
func TestOverlayLargerThanTheTerminalClips(t *testing.T) {
	l := Compute(40, 24)
	g := NewGrid(40, 24)
	p := NewPalette(ModeFull)
	body := make([]string, 60)
	for i := range body {
		body[i] = strings.Repeat("X", 120)
	}
	DrawOverlay(g, l, p, Overlay{Title: strings.Repeat("T", 90), Lines: body})

	rows := lines(g)
	if len(rows) != 24 {
		t.Fatalf("grid grew to %d rows", len(rows))
	}
	for i, row := range rows {
		if n := len([]rune(row)); n > 40 {
			t.Fatalf("row %d is %d columns wide", i, n)
		}
	}
}

func TestOverlayDrawsOverTheBoardWithoutErasingTheWholeFrame(t *testing.T) {
	l := Compute(80, 30)
	p := NewPalette(ModeFull)
	g := NewGrid(80, 30)
	DrawControls(g, l, p)
	DrawOverlay(g, l, p, PauseOverlay(p))
	if !strings.Contains(lines(g)[l.ControlsY], "help") {
		t.Error("overlay erased the controls line")
	}
}

func TestPauseOverlayMentionsResuming(t *testing.T) {
	o := PauseOverlay(NewPalette(ModeFull))
	joined := o.Title + " " + strings.Join(o.Lines, " ")
	if !strings.Contains(strings.ToUpper(joined), "PAUSE") {
		t.Errorf("pause overlay does not say it is paused: %q", joined)
	}
	if !strings.Contains(joined, "p") {
		t.Errorf("pause overlay does not say how to resume: %q", joined)
	}
}

func TestGameOverOverlayShowsFinalStats(t *testing.T) {
	gm := game.New(5)
	gm.Score = 45210
	gm.Lines = 37
	gm.Level = 4
	gm.Over = true
	o := GameOverOverlay(NewPalette(ModeFull), gm)
	joined := strings.Join(o.Lines, "\n")
	for _, want := range []string{"45210", "37", "4"} {
		if !strings.Contains(joined, want) {
			t.Errorf("game-over overlay is missing %q:\n%s", want, joined)
		}
	}
	if !strings.Contains(joined, "r") || !strings.Contains(joined, "q") {
		t.Errorf("game-over overlay does not offer restart and quit:\n%s", joined)
	}
}

func TestHelpOverlayCarriesTheSuppliedBody(t *testing.T) {
	o := HelpOverlay(NewPalette(ModeFull), []string{"← move left", "space  YEET"})
	if len(o.Lines) != 2 || o.Lines[0] != "← move left" {
		t.Errorf("help overlay body = %#v", o.Lines)
	}
}

func TestDrawTooSmallStatesTheRequirement(t *testing.T) {
	g := NewGrid(30, 10)
	DrawTooSmall(g, 30, 10, NewPalette(ModeFull))
	out := ansi.Strip(g.Render())
	if !strings.Contains(out, "40") || !strings.Contains(out, "24") {
		t.Errorf("notice does not state the minimum size:\n%s", out)
	}
	if !strings.Contains(out, "30") || !strings.Contains(out, "10") {
		t.Errorf("notice does not state the current size:\n%s", out)
	}
	for _, row := range strings.Split(out, "\n") {
		if len([]rune(row)) > 30 {
			t.Errorf("notice overflows the terminal: %q", row)
		}
	}
}

func TestDrawTooSmallInAVeryTinyTerminal(t *testing.T) {
	for _, tc := range [][2]int{{1, 1}, {4, 2}, {0, 0}, {12, 3}} {
		g := NewGrid(tc[0], tc[1])
		DrawTooSmall(g, tc[0], tc[1], NewPalette(ModeFull))
		for _, row := range strings.Split(ansi.Strip(g.Render()), "\n") {
			if len([]rune(row)) > tc[0] {
				t.Errorf("%dx%d: row %q too wide", tc[0], tc[1], row)
			}
		}
	}
}

func TestOverlayASCIIBorders(t *testing.T) {
	l := Compute(80, 30)
	g := NewGrid(80, 30)
	p := NewPalette(ModeASCII)
	DrawOverlay(g, l, p, Overlay{Title: "PAUSED", Lines: []string{"x"}})
	out := ansi.Strip(g.Render())
	if strings.ContainsAny(out, "╔═║╝") {
		t.Error("ASCII overlay used box-drawing characters")
	}
	if !strings.Contains(out, "+") {
		t.Error("ASCII overlay drew no border")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -run 'Overlay|TooSmall|Pause|GameOver|Help' -v`
Expected: FAIL — `undefined: DrawOverlay`.

- [ ] **Step 3: Implement overlays**

Create `internal/render/overlay.go`:

```go
package render

import (
	"fmt"

	"cosmic-tetris/internal/game"
)

// Overlay is a centred modal box: pause, help, or game over.
type Overlay struct {
	Title      string
	Lines      []string
	Style      *Style
	TitleStyle *Style
}

// DrawOverlay centres a bordered box over whatever is already in the grid. The
// box is sized to its content, then clamped to the grid, and every write goes
// through Grid.Set, so content larger than the terminal clips instead of
// escaping.
func DrawOverlay(g *Grid, l Layout, p *Palette, o Overlay) {
	body, title := o.Style, o.TitleStyle
	if body == nil {
		body = p.Value
	}
	if title == nil {
		title = p.Banner
	}

	inner := len([]rune(o.Title))
	for _, s := range o.Lines {
		if n := len([]rune(s)); n > inner {
			inner = n
		}
	}
	inner += 4 // two spaces of padding each side
	boxW := inner + 2
	boxH := len(o.Lines) + 4 // border, title, blank, lines, border
	if boxW > g.W {
		boxW = g.W
	}
	if boxH > g.H {
		boxH = g.H
	}
	x0 := (g.W - boxW) / 2
	y0 := (g.H - boxH) / 2
	if x0 < 0 {
		x0 = 0
	}
	if y0 < 0 {
		y0 = 0
	}
	x1, y1 := x0+boxW-1, y0+boxH-1

	b := bordersFor(p)
	// Blank the box interior so the board does not show through the modal.
	for y := y0; y <= y1; y++ {
		for x := x0; x <= x1; x++ {
			g.Set(x, y, ' ', nil)
		}
	}
	g.Set(x0, y0, b.tl, p.Border)
	g.Set(x1, y0, b.tr, p.Border)
	g.Set(x0, y1, b.bl, p.Border)
	g.Set(x1, y1, b.br, p.Border)
	for x := x0 + 1; x < x1; x++ {
		g.Set(x, y0, b.h, p.Border)
		g.Set(x, y1, b.h, p.Border)
	}
	for y := y0 + 1; y < y1; y++ {
		g.Set(x0, y, b.v, p.Border)
		g.Set(x1, y, b.v, p.Border)
	}

	center := func(y int, s string, st *Style) {
		x := x0 + 1 + (boxW-2-len([]rune(s)))/2
		if x < x0+1 {
			x = x0 + 1
		}
		// Clip to the box interior.
		i := 0
		for _, r := range s {
			if x+i >= x1 {
				break
			}
			g.Set(x+i, y, r, st)
			i++
		}
	}
	y := y0 + 1
	center(y, o.Title, title)
	y += 2
	for _, line := range o.Lines {
		if y >= y1 {
			break
		}
		center(y, line, body)
		y++
	}
}

// PauseOverlay is the pause modal, with the spec's copy.
func PauseOverlay(p *Palette) Overlay {
	return Overlay{
		Title: "TEMPORAL SUSPENSION",
		Lines: []string{
			"SPACE IS PAUSED",
			"",
			"p  resume",
		},
		TitleStyle: p.Banner,
		Style:      p.Label,
	}
}

// GameOverOverlay is the end-of-run modal, with the spec's copy.
func GameOverOverlay(p *Palette, gm *game.Game) Overlay {
	return Overlay{
		Title: "UNIVERSE EXPIRED",
		Lines: []string{
			"CAUSE: EXCESSIVE GEOMETRY",
			"",
			fmt.Sprintf("SCORE  %d", gm.Score),
			fmt.Sprintf("LINES  %d", gm.Lines),
			fmt.Sprintf("LEVEL  %d", gm.Level),
			"",
			"r  REBOOT UNIVERSE",
			"q  ACCEPT COSMIC DEATH",
		},
		TitleStyle: p.Banner,
		Style:      p.Value,
	}
}

// HelpOverlay wraps a body produced by the caller, which owns the key map.
func HelpOverlay(p *Palette, body []string) Overlay {
	return Overlay{
		Title:      "FLIGHT MANUAL",
		Lines:      body,
		TitleStyle: p.Banner,
		Style:      p.Label,
	}
}

// DrawTooSmall replaces the whole frame with the minimum-size notice. It is
// written line by line through Grid.Set so it degrades gracefully in a
// terminal only a few cells across.
func DrawTooSmall(g *Grid, w, h int, p *Palette) {
	msg := []string{
		"TERMINAL TOO SMALL",
		"",
		fmt.Sprintf("need %dx%d", MinWidth, MinHeight),
		fmt.Sprintf("have %dx%d", w, h),
		"",
		"resize, or q to quit",
	}
	y := (g.H - len(msg)) / 2
	if y < 0 {
		y = 0
	}
	for i, line := range msg {
		if r := []rune(line); len(r) > g.W {
			line = string(r[:g.W])
		}
		x := (g.W - len([]rune(line))) / 2
		if x < 0 {
			x = 0
		}
		st := p.Label
		if i == 0 {
			st = p.Banner
		}
		g.SetString(x, y+i, line, st)
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/overlay.go internal/render/overlay_test.go
git commit -m "feat(render): centred overlays for pause, help, game over, and too-small"
```

---

### Task 7: The scene — one frame, assembled in pipeline order

**Files:**
- Create: `internal/render/scene.go`
- Test: `internal/render/scene_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–6.
- Produces:
  - `type Hook func(g *Grid, l Layout, p *Palette)`
  - `type Scene struct { Game *game.Game; Palette *Palette; Seed int64; Mission string; ShakeX, ShakeY int; BorderStyle *Style; Overlay *Overlay; Background, BoardFX, GlobalFX Hook }`
  - `func Frame(g *Grid, w, h int, s Scene) Layout` — resizes the grid, computes the layout, draws the frame, and returns the layout it used.

Draw order is §37's pipeline: background → board border → locked stack → ghost → active piece → board FX → HUD → global FX → overlay. The three `Hook` fields are how Plan 3's FX layer participates without `render` importing `fx`.

- [ ] **Step 1: Write the failing test**

Create `internal/render/scene_test.go`:

```go
package render

import (
	"strings"
	"testing"

	"github.com/charmbracelet/x/ansi"

	"cosmic-tetris/internal/game"
)

func newScene(gm *game.Game, p *Palette) Scene {
	return Scene{Game: gm, Palette: p, Seed: gm.Seed, Mission: "NOMINALISH"}
}

func TestFrameDrawsAFullScreen(t *testing.T) {
	gm := game.New(1)
	gm.Board.Set(0, 21, game.CellOf(game.KindI))
	g := NewGrid(0, 0)
	p := NewPalette(ModeFull)
	l := Frame(g, 80, 30, newScene(gm, p))

	if g.W != 80 || g.H != 30 {
		t.Fatalf("grid is %dx%d, want 80x30", g.W, g.H)
	}
	if l.TooSmall {
		t.Fatal("80x30 reported too small")
	}
	out := ansi.Strip(g.Render())
	for _, want := range []string{"COSMIC TETRIS", "HOLD", "NEXT", "SCORE", "MISSION CONTROL", "help", "╔", "█"} {
		if !strings.Contains(out, want) {
			t.Errorf("frame is missing %q:\n%s", want, out)
		}
	}
	if rows := strings.Count(out, "\n") + 1; rows != 30 {
		t.Errorf("frame has %d rows, want 30", rows)
	}
	for _, row := range strings.Split(out, "\n") {
		if n := len([]rune(row)); n > 80 {
			t.Errorf("a frame row is %d columns wide", n)
		}
	}
}

func TestFrameHooksRunInPipelineOrder(t *testing.T) {
	var order []string
	gm := game.New(1)
	p := NewPalette(ModeFull)
	s := newScene(gm, p)
	s.Background = func(*Grid, Layout, *Palette) { order = append(order, "bg") }
	s.BoardFX = func(*Grid, Layout, *Palette) { order = append(order, "board") }
	s.GlobalFX = func(*Grid, Layout, *Palette) { order = append(order, "global") }
	Frame(NewGrid(0, 0), 80, 30, s)

	want := []string{"bg", "board", "global"}
	if strings.Join(order, ",") != strings.Join(want, ",") {
		t.Errorf("hook order = %v, want %v", order, want)
	}
}

func TestFrameWithNilHooksIsFine(t *testing.T) {
	Frame(NewGrid(0, 0), 80, 30, newScene(game.New(1), NewPalette(ModeFull)))
}

func TestBackgroundNeverCoversTheBoard(t *testing.T) {
	// Stars are drawn first, so the board's blank interior must overwrite them.
	gm := game.New(1)
	p := NewPalette(ModeFull)
	s := newScene(gm, p)
	s.Background = func(g *Grid, l Layout, p *Palette) {
		for y := 0; y < g.H; y++ {
			for x := 0; x < g.W; x++ {
				g.Set(x, y, '#', p.Star[0])
			}
		}
	}
	g := NewGrid(0, 0)
	l := Frame(g, 80, 30, s)
	for by := game.HiddenRows; by < game.Height; by++ {
		for bx := 0; bx < game.Width; bx++ {
			if gm.Board.At(bx, by).Filled() {
				continue
			}
			x, y, _ := BoardCellXY(l, bx, by, 0, 0)
			if got := g.At(x, y).Rune; got == '#' {
				t.Fatalf("background bled into the playfield at board (%d,%d)", bx, by)
			}
		}
	}
}

func TestFrameShowsTheTooSmallNoticeAndNothingElse(t *testing.T) {
	g := NewGrid(0, 0)
	l := Frame(g, 30, 12, newScene(game.New(1), NewPalette(ModeFull)))
	if !l.TooSmall {
		t.Fatal("30x12 should be too small")
	}
	out := ansi.Strip(g.Render())
	if !strings.Contains(out, "TERMINAL TOO SMALL") {
		t.Errorf("notice not shown:\n%s", out)
	}
	for _, unwanted := range []string{"COSMIC TETRIS", "NEXT", "╔"} {
		if strings.Contains(out, unwanted) {
			t.Errorf("too-small frame still drew %q", unwanted)
		}
	}
}

// Review Focus item 1.
func TestFrameWithDegenerateSizes(t *testing.T) {
	for _, tc := range [][2]int{{0, 0}, {-1, -1}, {1, 40}, {200, 1}} {
		g := NewGrid(0, 0)
		l := Frame(g, tc[0], tc[1], newScene(game.New(1), NewPalette(ModeFull)))
		if !l.TooSmall {
			t.Errorf("Frame(%d,%d) should be too small", tc[0], tc[1])
		}
		_ = g.Render() // must not panic
	}
}

func TestFrameAppliesShakeToTheBoardOnly(t *testing.T) {
	gm := game.New(1)
	gm.Board.Set(0, 21, game.CellOf(game.KindI))
	p := NewPalette(ModeFull)

	plain := NewGrid(0, 0)
	l := Frame(plain, 80, 30, newScene(gm, p))

	s := newScene(gm, p)
	s.ShakeX, s.ShakeY = 1, 0
	shaken := NewGrid(0, 0)
	Frame(shaken, 80, 30, s)

	x, y, _ := BoardCellXY(l, 0, 21, 0, 0)
	if shaken.At(x+1, y).Rune != '█' {
		t.Error("board did not move with the shake offset")
	}
	if shaken.At(l.NextX, l.NextY-1).Rune != plain.At(l.NextX, l.NextY-1).Rune {
		t.Error("shake moved the HUD as well as the board")
	}
}

func TestFrameDrawsTheOverlayLast(t *testing.T) {
	gm := game.New(1)
	p := NewPalette(ModeFull)
	s := newScene(gm, p)
	o := PauseOverlay(p)
	s.Overlay = &o
	g := NewGrid(0, 0)
	Frame(g, 80, 30, s)
	if !strings.Contains(ansi.Strip(g.Render()), "TEMPORAL SUSPENSION") {
		t.Error("overlay not drawn")
	}
}

func TestFrameDoesNotMutateGameState(t *testing.T) {
	gm := game.New(7)
	before := *gm
	Frame(NewGrid(0, 0), 80, 30, newScene(gm, NewPalette(ModeFull)))
	if *gm != before {
		t.Error("Frame mutated the game")
	}
}

func TestFrameIsDeterministic(t *testing.T) {
	gm := game.New(11)
	p := NewPalette(ModeFull)
	a, b := NewGrid(0, 0), NewGrid(0, 0)
	Frame(a, 80, 30, newScene(gm, p))
	Frame(b, 80, 30, newScene(gm, p))
	if a.Render() != b.Render() {
		t.Error("two frames from the same state differ")
	}
}

func TestFrameAtEverySizeClass(t *testing.T) {
	gm := game.New(3)
	for _, mode := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		p := NewPalette(mode)
		for _, tc := range [][2]int{{40, 24}, {44, 26}, {56, 30}, {80, 30}, {120, 45}} {
			g := NewGrid(0, 0)
			Frame(g, tc[0], tc[1], newScene(gm, p))
			out := ansi.Strip(g.Render())
			rows := strings.Split(out, "\n")
			if len(rows) != tc[1] {
				t.Errorf("%v %dx%d: %d rows", mode, tc[0], tc[1], len(rows))
			}
			for _, row := range rows {
				if n := len([]rune(row)); n > tc[0] {
					t.Errorf("%v %dx%d: row is %d columns", mode, tc[0], tc[1], n)
				}
			}
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -run Frame -v`
Expected: FAIL — `undefined: Frame`.

- [ ] **Step 3: Implement the scene**

Create `internal/render/scene.go`:

```go
package render

import "cosmic-tetris/internal/game"

// Hook is an optional drawing pass supplied by the caller. The FX layer plugs
// into a Scene through these, which is why this package never imports it.
type Hook func(g *Grid, l Layout, p *Palette)

// Scene is everything needed to draw one frame.
type Scene struct {
	Game    *game.Game
	Palette *Palette
	Seed    int64
	Mission string

	// ShakeX and ShakeY offset the playfield only; the HUD stays put.
	ShakeX, ShakeY int

	// BorderStyle overrides the palette's border style; nil uses the palette.
	BorderStyle *Style

	// Overlay, when set, is drawn last over everything.
	Overlay *Overlay

	Background Hook // starfield and nebulae, behind the board
	BoardFX    Hook // particles and shockwaves, over the pieces
	GlobalFX   Hook // banners and full-screen effects, over the HUD
}

// Frame draws one complete screen into g, resizing it to w x h first, and
// returns the layout it used. The draw order is the spec's pipeline:
// background, board, pieces, board FX, HUD, global FX, overlay.
func Frame(g *Grid, w, h int, s Scene) Layout {
	l := Compute(w, h)
	g.Resize(w, h)
	p := s.Palette

	if l.TooSmall {
		DrawTooSmall(g, w, h, p)
		return l
	}

	if s.Background != nil {
		s.Background(g, l, p)
	}

	// The board's interior is opaque: blank it so the background cannot show
	// through the playfield.
	for y := l.InnerY + s.ShakeY; y < l.InnerY+BoardInnerH+s.ShakeY; y++ {
		for x := l.InnerX + s.ShakeX; x < l.InnerX+BoardInnerW+s.ShakeX; x++ {
			g.Set(x, y, ' ', nil)
		}
	}

	border := s.BorderStyle
	if border == nil {
		border = p.Border
	}
	DrawBoardBorder(g, l, p, border, s.ShakeX, s.ShakeY)
	DrawLockedCells(g, l, p, s.Game, s.ShakeX, s.ShakeY)
	if !s.Game.Over {
		DrawGhost(g, l, p, s.Game, s.ShakeX, s.ShakeY)
		DrawActivePiece(g, l, p, s.Game, s.ShakeX, s.ShakeY)
	}

	if s.BoardFX != nil {
		s.BoardFX(g, l, p)
	}

	DrawTitle(g, l, p, s.Seed)
	DrawHold(g, l, p, s.Game)
	DrawNext(g, l, p, s.Game)
	DrawStats(g, l, p, s.Game)
	DrawMission(g, l, p, s.Mission)
	DrawControls(g, l, p)

	if s.GlobalFX != nil {
		s.GlobalFX(g, l, p)
	}
	if s.Overlay != nil {
		DrawOverlay(g, l, p, *s.Overlay)
	}
	return l
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v && go vet ./...`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/scene.go internal/render/scene_test.go
git commit -m "feat(render): scene assembly in spec pipeline order with FX hooks"
```

---

### Task 8: Key map and help content

**Files:**
- Create: `internal/app/keys.go`
- Test: `internal/app/keys_test.go`

**Interfaces:**
- Consumes: `charm.land/bubbles/v2/key`, `charm.land/bubbles/v2/help`.
- Produces:
  - `type KeyMap struct { Left, Right, Down, RotateCW, RotateCCW, Drop, Hold, Pause, Restart, Help, Quit key.Binding }`
  - `func DefaultKeyMap() KeyMap`
  - `func (k KeyMap) ShortHelp() []key.Binding`, `func (k KeyMap) FullHelp() [][]key.Binding`
  - `func HelpLines(k KeyMap) []string` — the body handed to `render.HelpOverlay`.

`KeyMap` implements `help.KeyMap`, so the bubbles help model can render it, and `HelpLines` reuses the same bindings for the overlay — one source of truth for what the keys are.

- [ ] **Step 1: Write the failing test**

Create `internal/app/keys_test.go`:

```go
package app

import (
	"strings"
	"testing"

	"charm.land/bubbles/v2/help"
	"charm.land/bubbles/v2/key"
	tea "charm.land/bubbletea/v2"
)

// press builds the key message a terminal would send for a named key.
func press(s string) tea.KeyPressMsg {
	switch s {
	case "left":
		return tea.KeyPressMsg{Code: tea.KeyLeft}
	case "right":
		return tea.KeyPressMsg{Code: tea.KeyRight}
	case "up":
		return tea.KeyPressMsg{Code: tea.KeyUp}
	case "down":
		return tea.KeyPressMsg{Code: tea.KeyDown}
	case " ", "space":
		return tea.KeyPressMsg{Code: tea.KeySpace, Text: " "}
	case "esc":
		return tea.KeyPressMsg{Code: tea.KeyEscape}
	default:
		r := []rune(s)[0]
		return tea.KeyPressMsg{Code: r, Text: string(r)}
	}
}

func TestEveryDocumentedKeyIsBound(t *testing.T) {
	k := DefaultKeyMap()
	cases := []struct {
		keys    []string
		binding key.Binding
		name    string
	}{
		{[]string{"left", "h", "a"}, k.Left, "left"},
		{[]string{"right", "l", "d"}, k.Right, "right"},
		{[]string{"down", "j", "s"}, k.Down, "soft drop"},
		{[]string{"up", "k", "x", "w"}, k.RotateCW, "rotate CW"},
		{[]string{"z"}, k.RotateCCW, "rotate CCW"},
		{[]string{" "}, k.Drop, "hard drop"},
		{[]string{"c"}, k.Hold, "hold"},
		{[]string{"p"}, k.Pause, "pause"},
		{[]string{"r"}, k.Restart, "restart"},
		{[]string{"?"}, k.Help, "help"},
		{[]string{"q", "esc"}, k.Quit, "quit"},
	}
	for _, tc := range cases {
		for _, s := range tc.keys {
			if !key.Matches(press(s), tc.binding) {
				t.Errorf("%q does not trigger %s", s, tc.name)
			}
		}
	}
}

func TestBindingsDoNotOverlap(t *testing.T) {
	k := DefaultKeyMap()
	all := map[string]string{}
	named := []struct {
		name string
		b    key.Binding
	}{
		{"left", k.Left}, {"right", k.Right}, {"down", k.Down},
		{"rotateCW", k.RotateCW}, {"rotateCCW", k.RotateCCW}, {"drop", k.Drop},
		{"hold", k.Hold}, {"pause", k.Pause}, {"restart", k.Restart},
		{"help", k.Help}, {"quit", k.Quit},
	}
	for _, n := range named {
		for _, s := range n.b.Keys() {
			if other, dup := all[s]; dup {
				t.Errorf("key %q is bound to both %s and %s", s, other, n.name)
			}
			all[s] = n.name
		}
	}
}

func TestEveryBindingHasHelpText(t *testing.T) {
	k := DefaultKeyMap()
	for _, b := range append(k.ShortHelp(), flatten(k.FullHelp())...) {
		h := b.Help()
		if h.Key == "" || h.Desc == "" {
			t.Errorf("binding %v has incomplete help text %+v", b.Keys(), h)
		}
	}
}

func flatten(groups [][]key.Binding) []key.Binding {
	var out []key.Binding
	for _, g := range groups {
		out = append(out, g...)
	}
	return out
}

func TestKeyMapSatisfiesBubblesHelp(t *testing.T) {
	var _ help.KeyMap = DefaultKeyMap()
	m := help.New()
	m.Width = 78
	if s := m.View(DefaultKeyMap()); s == "" {
		t.Error("bubbles help rendered nothing")
	}
}

func TestHelpLinesCoverEveryAction(t *testing.T) {
	// The wording comes from the spec's flight manual.
	body := strings.ToLower(strings.Join(HelpLines(DefaultKeyMap()), "\n"))
	for _, want := range []string{
		"move spacecraft", "accelerate doom", "rotate geometry", "rotate other way",
		"yeet", "quantum storage", "suspend spacetime", "reboot universe",
		"close this nonsense", "abandon mission",
	} {
		if !strings.Contains(body, want) {
			t.Errorf("help body does not mention %q:\n%s", want, body)
		}
	}
}

func TestHelpLinesFitTheSmallestTerminal(t *testing.T) {
	// The overlay adds a border and padding; leave room inside a 40-column
	// terminal.
	for _, line := range HelpLines(DefaultKeyMap()) {
		if n := len([]rune(line)); n > 34 {
			t.Errorf("help line %q is %d columns, too wide for a 40-column terminal", line, n)
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/app/ -v`
Expected: FAIL — `undefined: DefaultKeyMap`.

- [ ] **Step 3: Implement the key map**

Create `internal/app/keys.go`:

```go
// Package app is the Bubble Tea program: state, input, and the frame clock.
package app

import (
	"fmt"

	"charm.land/bubbles/v2/key"
)

// KeyMap is every binding the game responds to. It satisfies help.KeyMap so
// the bubbles help model can render it, and HelpLines reuses the same bindings
// for the in-game overlay.
type KeyMap struct {
	Left      key.Binding
	Right     key.Binding
	Down      key.Binding
	RotateCW  key.Binding
	RotateCCW key.Binding
	Drop      key.Binding
	Hold      key.Binding
	Pause     key.Binding
	Restart   key.Binding
	Help      key.Binding
	Quit      key.Binding
}

// DefaultKeyMap returns the bindings from the spec, arrows plus vim plus WASD.
func DefaultKeyMap() KeyMap {
	return KeyMap{
		// Descriptions are the spec's copy from 39, verbatim.
		Left:      key.NewBinding(key.WithKeys("left", "h", "a"), key.WithHelp("←/h/a", "move spacecraft")),
		Right:     key.NewBinding(key.WithKeys("right", "l", "d"), key.WithHelp("→/l/d", "move spacecraft")),
		Down:      key.NewBinding(key.WithKeys("down", "j", "s"), key.WithHelp("↓/j/s", "accelerate doom")),
		RotateCW:  key.NewBinding(key.WithKeys("up", "k", "x", "w"), key.WithHelp("↑/k/x", "rotate geometry")),
		RotateCCW: key.NewBinding(key.WithKeys("z"), key.WithHelp("z", "rotate other way")),
		Drop:      key.NewBinding(key.WithKeys(" "), key.WithHelp("SPACE", "YEET")),
		Hold:      key.NewBinding(key.WithKeys("c"), key.WithHelp("c", "quantum storage")),
		Pause:     key.NewBinding(key.WithKeys("p"), key.WithHelp("p", "suspend spacetime")),
		Restart:   key.NewBinding(key.WithKeys("r"), key.WithHelp("r", "reboot universe")),
		Help:      key.NewBinding(key.WithKeys("?"), key.WithHelp("?", "close this nonsense")),
		Quit:      key.NewBinding(key.WithKeys("q", "esc"), key.WithHelp("q", "abandon mission")),
	}
}

// ShortHelp is the one-line summary.
func (k KeyMap) ShortHelp() []key.Binding {
	return []key.Binding{k.Left, k.Right, k.RotateCW, k.Drop, k.Hold, k.Help, k.Quit}
}

// FullHelp is the expanded, grouped listing.
func (k KeyMap) FullHelp() [][]key.Binding {
	return [][]key.Binding{
		{k.Left, k.Right, k.Down},
		{k.RotateCW, k.RotateCCW, k.Drop, k.Hold},
		{k.Pause, k.Restart, k.Help, k.Quit},
	}
}

// HelpLines renders the bindings as overlay body lines, narrow enough for a
// 40-column terminal.
func HelpLines(k KeyMap) []string {
	bindings := []key.Binding{
		k.Left, k.Right, k.Down, k.RotateCW, k.RotateCCW,
		k.Drop, k.Hold, k.Pause, k.Restart, k.Help, k.Quit,
	}
	out := make([]string, 0, len(bindings))
	for _, b := range bindings {
		h := b.Help()
		out = append(out, fmt.Sprintf("%-9s %s", h.Key, h.Desc))
	}
	return out
}
```

If any generated line exceeds the 34-column budget the test enforces, shorten the `WithHelp` key text (not the description) until it fits.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/app/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/app/keys.go internal/app/keys_test.go
git commit -m "feat(app): key map with vim and WASD aliases plus help content"
```

---

### Task 9: The Bubble Tea model

**Files:**
- Create: `internal/app/model.go`
- Test: `internal/app/model_test.go`

**Interfaces:**
- Consumes: `game`, `render`, `KeyMap`, `HelpLines`, `charm.land/bubbletea/v2`.
- Produces:
  - `type Options struct { Seed int64; Mode render.Mode }`
  - `type FrameMsg time.Time`
  - `type Model struct { ... }` implementing `tea.Model`: `Init() tea.Cmd`, `Update(tea.Msg) (tea.Model, tea.Cmd)`, `View() tea.View`.
  - `func New(opts Options) *Model`
  - consts `FrameInterval = 16 * time.Millisecond`, `MaxFrameDelta = 100 * time.Millisecond`
  - `func (m *Model) Snapshot() string` — the ANSI-stripped current frame, used by the golden tests in Task 11.

Behaviour: one `tea.Tick` chain emits `FrameMsg`; each frame computes `dt` from the previous frame's timestamp, clamps it to `MaxFrameDelta`, and calls `game.Advance(dt)`. Key presses act immediately, without waiting for the next frame. `p` toggles pause; while paused, no `Advance` happens and movement keys are ignored. After game over, only `r` and `q` do anything. `r` rebuilds the game with a fresh seed derived from the clock unless a seed was pinned on the command line, in which case the same seed replays.

- [ ] **Step 1: Write the failing test**

Create `internal/app/model_test.go`:

```go
package app

import (
	"strings"
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"
	"github.com/charmbracelet/colorprofile"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

func newTestModel(t *testing.T) *Model {
	t.Helper()
	m := New(Options{Seed: 42, Mode: render.ModeFull})
	m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	return m
}

// send delivers a message and returns the model, keeping the pointer type.
func send(t *testing.T, m *Model, msg tea.Msg) tea.Cmd {
	t.Helper()
	_, cmd := m.Update(msg)
	return cmd
}

func TestInitStartsTheFrameClock(t *testing.T) {
	m := New(Options{Seed: 1})
	if cmd := m.Init(); cmd == nil {
		t.Fatal("Init returned no command; nothing would ever tick")
	}
}

func TestViewIsAltScreen(t *testing.T) {
	m := newTestModel(t)
	v := m.View()
	if !v.AltScreen {
		t.Error("View is not using the alternate screen")
	}
	if v.Content == "" {
		t.Error("View content is empty")
	}
}

func TestWindowSizeDrivesTheFrame(t *testing.T) {
	m := newTestModel(t)
	if !strings.Contains(m.Snapshot(), "COSMIC TETRIS") {
		t.Error("80x30 frame does not contain the title")
	}
	send(t, m, tea.WindowSizeMsg{Width: 30, Height: 10})
	if !strings.Contains(m.Snapshot(), "TERMINAL TOO SMALL") {
		t.Error("shrinking to 30x10 did not show the notice")
	}
	send(t, m, tea.WindowSizeMsg{Width: 80, Height: 30})
	if !strings.Contains(m.Snapshot(), "COSMIC TETRIS") {
		t.Error("growing back did not restore the frame")
	}
}

// Review Focus item 1.
func TestZeroAndNegativeWindowSizes(t *testing.T) {
	m := New(Options{Seed: 1})
	for _, sz := range []tea.WindowSizeMsg{{Width: 0, Height: 0}, {Width: -1, Height: -1}, {Width: 80, Height: 0}} {
		send(t, m, sz)
		_ = m.View() // must not panic
	}
	send(t, m, tea.WindowSizeMsg{Width: 80, Height: 30})
	if strings.Contains(m.Snapshot(), "TERMINAL TOO SMALL") {
		t.Error("model did not recover after a degenerate size")
	}
}

func TestMovementKeysActImmediately(t *testing.T) {
	m := newTestModel(t)
	x := m.Game.Active.X
	send(t, m, press("left"))
	if m.Game.Active.X != x-1 {
		t.Errorf("left moved the piece to %d, want %d", m.Game.Active.X, x-1)
	}
	send(t, m, press("right"))
	send(t, m, press("right"))
	if m.Game.Active.X != x+1 {
		t.Errorf("right moves landed at %d, want %d", m.Game.Active.X, x+1)
	}
}

func TestRotateAndHoldAndDropKeys(t *testing.T) {
	m := newTestModel(t)
	r := m.Game.Active.Rotation
	send(t, m, press("x"))
	if m.Game.Active.Rotation == r && m.Game.Active.Kind != game.KindO {
		t.Error("rotate key did nothing")
	}
	send(t, m, press("c"))
	if m.Game.Hold == nil {
		t.Error("hold key did nothing")
	}
	before := m.Game.Score
	send(t, m, press(" "))
	if m.Game.Score <= before {
		t.Errorf("hard drop scored nothing: %d -> %d", before, m.Game.Score)
	}
}

func TestFrameMsgAdvancesGravity(t *testing.T) {
	m := newTestModel(t)
	y := m.Game.Active.Y
	now := time.Now()
	send(t, m, FrameMsg(now))
	send(t, m, FrameMsg(now.Add(900*time.Millisecond)))
	if m.Game.Active.Y <= y {
		t.Errorf("900ms of frames did not drop the piece: %d -> %d", y, m.Game.Active.Y)
	}
}

func TestFrameMsgAlwaysSchedulesTheNextFrame(t *testing.T) {
	m := newTestModel(t)
	if cmd := send(t, m, FrameMsg(time.Now())); cmd == nil {
		t.Fatal("frame did not schedule the next frame; the clock would stop")
	}
}

// Review Focus item 3.
func TestLargeFrameDeltasAreClamped(t *testing.T) {
	m := newTestModel(t)
	now := time.Now()
	send(t, m, FrameMsg(now))

	quick := New(Options{Seed: 42, Mode: render.ModeFull})
	quick.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	quick.Update(FrameMsg(now))
	quick.Update(FrameMsg(now.Add(MaxFrameDelta)))

	// A ten-minute gap must behave exactly like one clamped frame.
	send(t, m, FrameMsg(now.Add(10*time.Minute)))
	if m.Game.Active.Y != quick.Game.Active.Y || m.Game.Score != quick.Game.Score {
		t.Errorf("a 10-minute gap was not clamped: y=%d score=%d vs clamped y=%d score=%d",
			m.Game.Active.Y, m.Game.Score, quick.Game.Active.Y, quick.Game.Score)
	}
	if m.Game.Over {
		t.Error("a sleep-and-resume gap ended the game")
	}
}

func TestNonMonotonicFrameTimesAreIgnored(t *testing.T) {
	m := newTestModel(t)
	now := time.Now()
	send(t, m, FrameMsg(now))
	y := m.Game.Active.Y
	send(t, m, FrameMsg(now.Add(-5*time.Second)))
	if m.Game.Active.Y != y {
		t.Error("a backwards clock moved the piece")
	}
}

func TestPauseFreezesGravityAndIgnoresMovement(t *testing.T) {
	m := newTestModel(t)
	now := time.Now()
	send(t, m, FrameMsg(now))
	send(t, m, press("p"))
	if !m.Paused {
		t.Fatal("p did not pause")
	}
	if !strings.Contains(m.Snapshot(), "TEMPORAL SUSPENSION") {
		t.Error("pause overlay not shown")
	}
	y, x := m.Game.Active.Y, m.Game.Active.X
	send(t, m, FrameMsg(now.Add(2*time.Second)))
	send(t, m, press("left"))
	send(t, m, press(" "))
	if m.Game.Active.Y != y || m.Game.Active.X != x {
		t.Error("gameplay continued while paused")
	}
	send(t, m, press("p"))
	if m.Paused {
		t.Error("p did not resume")
	}
	// Resuming must not apply the paused interval as one giant dt.
	send(t, m, FrameMsg(now.Add(2*time.Second+16*time.Millisecond)))
	if m.Game.Active.Y > y+1 {
		t.Errorf("resume dumped the paused time into gravity: %d -> %d", y, m.Game.Active.Y)
	}
}

func TestHelpTogglesAndPausesPlay(t *testing.T) {
	m := newTestModel(t)
	send(t, m, press("?"))
	snap := m.Snapshot()
	if !strings.Contains(snap, "FLIGHT MANUAL") {
		t.Errorf("help overlay not shown:\n%s", snap)
	}
	now := time.Now()
	send(t, m, FrameMsg(now))
	y := m.Game.Active.Y
	send(t, m, FrameMsg(now.Add(2*time.Second)))
	if m.Game.Active.Y != y {
		t.Error("gravity ran while the help overlay was open")
	}
	send(t, m, press("?"))
	if strings.Contains(m.Snapshot(), "FLIGHT MANUAL") {
		t.Error("? did not close help")
	}
}

func TestEscapeClosesAnOverlayBeforeQuitting(t *testing.T) {
	m := newTestModel(t)
	send(t, m, press("?"))
	if cmd := send(t, m, press("esc")); cmd != nil {
		t.Error("esc quit the program instead of closing help")
	}
	if strings.Contains(m.Snapshot(), "FLIGHT MANUAL") {
		t.Error("esc did not close help")
	}
	if cmd := send(t, m, press("esc")); cmd == nil {
		t.Error("esc with no overlay open did not quit")
	}
}

// Review Focus item 4.
func TestKeysAfterGameOver(t *testing.T) {
	m := newTestModel(t)
	// Bury the board until the game ends.
	for i := 0; i < 400 && !m.Game.Over; i++ {
		send(t, m, press(" "))
	}
	if !m.Game.Over {
		t.Fatal("could not reach game over with repeated hard drops")
	}
	if !strings.Contains(m.Snapshot(), "UNIVERSE EXPIRED") {
		t.Error("game-over overlay not shown")
	}
	before := *m.Game
	for _, k := range []string{"left", "right", "down", "x", "z", " ", "c", "p"} {
		send(t, m, press(k))
	}
	if *m.Game != before {
		t.Errorf("a gameplay key changed state after game over")
	}
	send(t, m, press("r"))
	if m.Game.Over || m.Game.Score != 0 {
		t.Error("r did not restart after game over")
	}
}

func TestRestartWithAPinnedSeedReplaysTheSameUniverse(t *testing.T) {
	m := New(Options{Seed: 1234, Mode: render.ModeFull})
	m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	first := append([]game.PieceKind(nil), m.Game.Next...)
	send(t, m, press("r"))
	if m.Game.Seed != 1234 {
		t.Errorf("restart changed a pinned seed to %d", m.Game.Seed)
	}
	for i := range first {
		if m.Game.Next[i] != first[i] {
			t.Fatal("restart with a pinned seed produced a different queue")
		}
	}
}

func TestRestartWithoutAPinnedSeedPicksANewUniverse(t *testing.T) {
	m := New(Options{Mode: render.ModeFull}) // Seed 0 means "choose one"
	m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	first := m.Game.Seed
	send(t, m, press("r"))
	if m.Game.Seed == first {
		t.Error("restart reused the same random seed")
	}
}

// Review Focus item 4.
func TestQuitAndRestartWorkWhileTooSmall(t *testing.T) {
	m := New(Options{Seed: 7, Mode: render.ModeFull})
	send(t, m, tea.WindowSizeMsg{Width: 20, Height: 8})
	send(t, m, press("left")) // must be inert, not a panic
	if cmd := send(t, m, press("r")); cmd != nil {
		t.Error("r in a too-small terminal should restart, not return a command")
	}
	if cmd := send(t, m, press("q")); cmd == nil {
		t.Error("q in a too-small terminal did not quit")
	}
}

func TestUnknownKeysAreIgnored(t *testing.T) {
	m := newTestModel(t)
	before := *m.Game
	for _, k := range []string{"v", "8", "%"} {
		send(t, m, press(k))
	}
	if *m.Game != before {
		t.Error("an unbound key changed the game state")
	}
}

func TestKeyReleaseMessagesAreIgnored(t *testing.T) {
	m := newTestModel(t)
	x := m.Game.Active.X
	m.Update(tea.KeyReleaseMsg{Code: tea.KeyLeft})
	if m.Game.Active.X != x {
		t.Error("a key release moved the piece")
	}
}

func TestASCIIModeFrame(t *testing.T) {
	m := New(Options{Seed: 3, Mode: render.ModeASCII})
	m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	snap := m.Snapshot()
	if strings.ContainsAny(snap, "█╔═║░") {
		t.Errorf("ASCII mode emitted non-ASCII glyphs:\n%s", snap)
	}
}

func TestLimitedColorProfileSwitchesToTheReducedPalette(t *testing.T) {
	m := newTestModel(t)
	if m.palette.Mode != render.ModeFull {
		t.Fatalf("starting mode = %v, want full", m.palette.Mode)
	}
	m.Update(tea.ColorProfileMsg{Profile: colorprofile.ANSI})
	if m.palette.Mode != render.ModeReduced {
		t.Errorf("mode after a limited profile = %v, want reduced", m.palette.Mode)
	}
	_ = m.Snapshot() // must still render
}

func TestColorProfileDoesNotOverrideASCIIMode(t *testing.T) {
	m := New(Options{Seed: 3, Mode: render.ModeASCII})
	m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	m.Update(tea.ColorProfileMsg{Profile: colorprofile.ANSI})
	if m.palette.Mode != render.ModeASCII {
		t.Errorf("mode = %v, want ascii to stick", m.palette.Mode)
	}
}

func TestSnapshotIsAnsiFree(t *testing.T) {
	m := newTestModel(t)
	if strings.Contains(m.Snapshot(), "\x1b") {
		t.Error("Snapshot contains escape sequences")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/app/ -run Model -v`
Expected: FAIL — `undefined: New`.

- [ ] **Step 3: Implement the model**

Create `internal/app/model.go`:

```go
package app

import (
	"time"

	"charm.land/bubbles/v2/key"
	tea "charm.land/bubbletea/v2"
	"github.com/charmbracelet/colorprofile"
	"github.com/charmbracelet/x/ansi"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

// FrameInterval is the visual update period, about 60 Hz. Gravity does not
// depend on it: every frame reports its own timestamp and the model advances
// the engine by the elapsed time.
const (
	FrameInterval = 16 * time.Millisecond

	// MaxFrameDelta caps how much time one frame may hand to the engine. A
	// laptop waking from sleep reports an enormous gap; without this the
	// player would return to a buried board.
	MaxFrameDelta = 100 * time.Millisecond
)

// FrameMsg is one visual tick, carrying the time it fired.
type FrameMsg time.Time

// overlayKind is which modal is open, if any.
type overlayKind int

const (
	overlayNone overlayKind = iota
	overlayHelp
)

// Options configures a new model.
type Options struct {
	// Seed pins the universe. Zero means pick one from the clock, and lets
	// restart pick a new one each time.
	Seed int64

	// Mode is the glyph and colour set. It is about what the terminal can
	// render, not about how much spectacle the player wants.
	Mode render.Mode

	// ReducedMotion suppresses screen shake, hyperdrive acceleration, and
	// shockwaves. NoFX turns off cosmic weather entirely. Both are carried
	// here and consumed by the FX layer in Plan 3; nothing in this plan reads
	// them, because there are no effects yet.
	ReducedMotion bool
	NoFX          bool
}

// Model is the Bubble Tea program state.
type Model struct {
	Game   *game.Game
	Paused bool

	keys    KeyMap
	palette *render.Palette
	grid    *render.Grid
	layout  render.Layout
	opts    Options

	seedPinned bool
	width      int
	height     int
	overlay    overlayKind
	lastFrame  time.Time
	mission    string
}

// New builds a model. It does not read the terminal size; the program's first
// WindowSizeMsg supplies that.
func New(opts Options) *Model {
	seed := opts.Seed
	pinned := seed != 0
	if !pinned {
		seed = time.Now().UnixNano()
	}
	return &Model{
		Game:       game.New(seed),
		keys:       DefaultKeyMap(),
		palette:    render.NewPalette(opts.Mode),
		grid:       render.NewGrid(0, 0),
		opts:       opts,
		seedPinned: pinned,
		mission:    "ALL SYSTEMS NOMINALISH",
	}
}

// Init starts the frame clock.
func (m *Model) Init() tea.Cmd {
	return frameTick()
}

func frameTick() tea.Cmd {
	return tea.Tick(FrameInterval, func(t time.Time) tea.Msg { return FrameMsg(t) })
}

// Update handles one message.
func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width, m.height = msg.Width, msg.Height
		return m, nil

	case FrameMsg:
		return m, m.frame(time.Time(msg))

	case tea.KeyPressMsg:
		return m, m.handleKey(msg)

	case tea.ColorProfileMsg:
		// A terminal that cannot do truecolor gets the calmer palette from
		// 32 "Reduced". Confirm the field name before writing this branch:
		//   go doc charm.land/bubbletea/v2.ColorProfileMsg
		//   go doc github.com/charmbracelet/colorprofile.Profile
		// If Profile is an embedded field rather than a named one, the
		// comparison is `msg.Profile` either way.
		if m.opts.Mode == render.ModeFull && msg.Profile != colorprofile.TrueColor {
			m.palette = render.NewPalette(render.ModeReduced)
		}
		return m, nil
	}
	return m, nil
}

// frame advances the engine by the elapsed wall time since the previous frame,
// clamped, and schedules the next frame.
func (m *Model) frame(now time.Time) tea.Cmd {
	dt := time.Duration(0)
	if !m.lastFrame.IsZero() {
		dt = now.Sub(m.lastFrame)
	}
	m.lastFrame = now
	if dt < 0 {
		dt = 0
	}
	if dt > MaxFrameDelta {
		dt = MaxFrameDelta
	}
	if m.running() && dt > 0 {
		m.Game.Advance(dt)
	}
	return frameTick()
}

// running reports whether gameplay time should pass.
func (m *Model) running() bool {
	return !m.Paused && m.overlay == overlayNone && !m.Game.Over && !m.layout.TooSmall
}

// handleKey applies one key press immediately, without waiting for a frame.
func (m *Model) handleKey(msg tea.KeyPressMsg) tea.Cmd {
	switch {
	case key.Matches(msg, m.keys.Help):
		m.toggleHelp()
		return nil
	case key.Matches(msg, m.keys.Restart):
		m.restart()
		return nil
	case key.Matches(msg, m.keys.Quit):
		// Escape closes an open overlay first; only then does it quit.
		if m.overlay != overlayNone && msg.Code == tea.KeyEscape {
			m.overlay = overlayNone
			return nil
		}
		return tea.Quit
	}

	// Everything below is gameplay, and is inert unless the game is live.
	if m.Game.Over || m.layout.TooSmall {
		return nil
	}
	if key.Matches(msg, m.keys.Pause) {
		m.Paused = !m.Paused
		return nil
	}
	if m.Paused || m.overlay != overlayNone {
		return nil
	}

	switch {
	case key.Matches(msg, m.keys.Left):
		m.Game.MoveLeft()
	case key.Matches(msg, m.keys.Right):
		m.Game.MoveRight()
	case key.Matches(msg, m.keys.Down):
		m.Game.SoftDrop()
	case key.Matches(msg, m.keys.RotateCW):
		m.Game.RotateCW()
	case key.Matches(msg, m.keys.RotateCCW):
		m.Game.RotateCCW()
	case key.Matches(msg, m.keys.Drop):
		m.Game.HardDrop()
	case key.Matches(msg, m.keys.Hold):
		m.Game.UseHold()
	}
	return nil
}

func (m *Model) toggleHelp() {
	if m.overlay == overlayHelp {
		m.overlay = overlayNone
		return
	}
	m.overlay = overlayHelp
}

// restart begins a new run, reusing a pinned seed or drawing a fresh one.
func (m *Model) restart() {
	seed := m.Game.Seed
	if !m.seedPinned {
		seed = time.Now().UnixNano()
		if seed == m.Game.Seed {
			seed++
		}
	}
	m.Game = game.New(seed)
	m.Paused = false
	m.overlay = overlayNone
	m.mission = "ALL SYSTEMS NOMINALISH"
}

// scene builds the render scene for the current state.
func (m *Model) scene() render.Scene {
	s := render.Scene{
		Game:    m.Game,
		Palette: m.palette,
		Seed:    m.Game.Seed,
		Mission: m.mission,
	}
	switch {
	case m.Game.Over:
		o := render.GameOverOverlay(m.palette, m.Game)
		s.Overlay = &o
	case m.overlay == overlayHelp:
		o := render.HelpOverlay(m.palette, HelpLines(m.keys))
		s.Overlay = &o
	case m.Paused:
		o := render.PauseOverlay(m.palette)
		s.Overlay = &o
	}
	return s
}

// View draws the current frame.
func (m *Model) View() tea.View {
	m.layout = render.Frame(m.grid, m.width, m.height, m.scene())
	v := tea.NewView(m.grid.Render())
	v.AltScreen = true
	return v
}

// Snapshot returns the current frame with styling removed. Tests use it; the
// program does not.
func (m *Model) Snapshot() string {
	return ansi.Strip(m.View().Content)
}
```

Note the ordering constraint: `m.layout` is set by `View`, and `handleKey` reads `m.layout.TooSmall`. Bubble Tea always calls `View` after `Update`, and the tests call `Snapshot` or `View` before asserting on too-small behaviour, so this holds. If `go vet` or a test shows a first-key-before-first-view gap, compute the layout in the `tea.WindowSizeMsg` branch as well:

```go
	case tea.WindowSizeMsg:
		m.width, m.height = msg.Width, msg.Height
		m.layout = render.Compute(m.width, m.height)
		return m, nil
```

Prefer that version — it removes the dependency on call order entirely.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/app/ -v`
Expected: PASS.

- [ ] **Step 5: Run the whole suite with the race detector**

Run: `go test ./... -race -shuffle=on`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/app/model.go internal/app/model_test.go
git commit -m "feat(app): Bubble Tea model with clamped elapsed-time gravity"
```

---

### Task 10: The command

**Files:**
- Create: `cmd/cosmic-tetris/main.go`
- Test: `cmd/cosmic-tetris/main_test.go`

**Interfaces:**
- Consumes: `app.New`, `app.Options`, `render.Mode`.
- Produces:
  - `func parseFlags(args []string, out io.Writer) (app.Options, bool, error)` — returns the options, whether to exit immediately (help was asked for), and any error.
  - `func main()`

Flags: `--seed N`, `--ascii`, `--reduced-motion`, `--no-fx`, `--help`. `--reduced-motion` and `--no-fx` parse now and select `render.ModeReduced` where that is all they can do yet; Plan 3 gives them their full meaning.

- [ ] **Step 1: Write the failing test**

Create `cmd/cosmic-tetris/main_test.go`:

```go
package main

import (
	"bytes"
	"strings"
	"testing"

	"cosmic-tetris/internal/render"
)

func TestDefaultFlags(t *testing.T) {
	var out bytes.Buffer
	opts, exit, err := parseFlags(nil, &out)
	if err != nil || exit {
		t.Fatalf("parseFlags() = %v, exit=%v, err=%v", opts, exit, err)
	}
	if opts.Seed != 0 {
		t.Errorf("default seed = %d, want 0 (choose at runtime)", opts.Seed)
	}
	if opts.Mode != render.ModeFull {
		t.Errorf("default mode = %v, want full", opts.Mode)
	}
}

func TestSeedFlag(t *testing.T) {
	var out bytes.Buffer
	opts, _, err := parseFlags([]string{"--seed", "1234"}, &out)
	if err != nil {
		t.Fatal(err)
	}
	if opts.Seed != 1234 {
		t.Errorf("seed = %d, want 1234", opts.Seed)
	}
}

func TestASCIIFlag(t *testing.T) {
	var out bytes.Buffer
	opts, _, err := parseFlags([]string{"--ascii"}, &out)
	if err != nil {
		t.Fatal(err)
	}
	if opts.Mode != render.ModeASCII {
		t.Errorf("mode = %v, want ascii", opts.Mode)
	}
}

func TestReducedMotionFlagDoesNotChangeGlyphs(t *testing.T) {
	// 49.5: reduced motion suppresses shake, hyperdrive, and shockwaves. It
	// leaves colour and glyphs alone.
	var out bytes.Buffer
	opts, _, err := parseFlags([]string{"--reduced-motion"}, &out)
	if err != nil {
		t.Fatal(err)
	}
	if !opts.ReducedMotion {
		t.Error("--reduced-motion did not set ReducedMotion")
	}
	if opts.Mode != render.ModeFull {
		t.Errorf("mode = %v, want full", opts.Mode)
	}
	if opts.NoFX {
		t.Error("--reduced-motion should not imply --no-fx")
	}
}

func TestNoFXFlag(t *testing.T) {
	var out bytes.Buffer
	opts, _, err := parseFlags([]string{"--no-fx"}, &out)
	if err != nil {
		t.Fatal(err)
	}
	if !opts.NoFX {
		t.Error("--no-fx did not set NoFX")
	}
	if opts.Mode != render.ModeFull {
		t.Errorf("mode = %v, want full", opts.Mode)
	}
}

func TestFlagsCombine(t *testing.T) {
	var out bytes.Buffer
	opts, _, err := parseFlags([]string{"--reduced-motion", "--ascii", "--seed", "9"}, &out)
	if err != nil {
		t.Fatal(err)
	}
	if opts.Mode != render.ModeASCII || !opts.ReducedMotion || opts.Seed != 9 {
		t.Errorf("combined flags = %+v", opts)
	}
}

func TestHelpFlagPrintsUsageAndExits(t *testing.T) {
	var out bytes.Buffer
	_, exit, err := parseFlags([]string{"--help"}, &out)
	if err != nil {
		t.Fatal(err)
	}
	if !exit {
		t.Error("--help should ask the caller to exit")
	}
	text := out.String()
	for _, want := range []string{"cosmic-tetris", "--seed", "--ascii", "--no-fx", "--reduced-motion"} {
		if !strings.Contains(text, want) {
			t.Errorf("usage does not mention %q:\n%s", want, text)
		}
	}
}

func TestUnknownFlagIsAnError(t *testing.T) {
	var out bytes.Buffer
	if _, _, err := parseFlags([]string{"--warp-drive"}, &out); err == nil {
		t.Error("unknown flag was accepted")
	}
}

func TestBadSeedIsAnError(t *testing.T) {
	var out bytes.Buffer
	if _, _, err := parseFlags([]string{"--seed", "not-a-number"}, &out); err == nil {
		t.Error("non-numeric seed was accepted")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./cmd/cosmic-tetris/ -v`
Expected: FAIL — `undefined: parseFlags`.

- [ ] **Step 3: Implement the command**

Create `cmd/cosmic-tetris/main.go`:

```go
// Command cosmic-tetris is a falling-block game with an unreasonable amount of
// cosmic weather.
package main

import (
	"flag"
	"fmt"
	"io"
	"os"

	tea "charm.land/bubbletea/v2"

	"cosmic-tetris/internal/app"
	"cosmic-tetris/internal/render"
)

const usage = `cosmic-tetris — a falling-block game with delusions of astrophysics

usage: cosmic-tetris [flags]

flags:
  --seed N           pin the universe to seed N, for a repeatable game
  --ascii            ASCII glyphs and basic colours, for stubborn terminals
  --reduced-motion   calmer visuals: no shake, no flashing
  --no-fx            gameplay only, no cosmic weather
  --help             print this and stop

keys:
  ←/h/a  →/l/d  drift        ↑/k/x/w  rotate      z  rotate back
  ↓/j/s  descend             space    YEET        c  hold
  p  pause    r  restart     ?  help              q  quit
`

// parseFlags turns command-line arguments into app options. It reports exit=true
// when the caller should print nothing further and stop, which is what --help
// wants.
func parseFlags(args []string, out io.Writer) (app.Options, bool, error) {
	fs := flag.NewFlagSet("cosmic-tetris", flag.ContinueOnError)
	fs.SetOutput(out)
	fs.Usage = func() { fmt.Fprint(out, usage) }

	seed := fs.Int64("seed", 0, "pin the universe to this seed")
	ascii := fs.Bool("ascii", false, "ASCII glyphs and basic colours")
	reduced := fs.Bool("reduced-motion", false, "calmer visuals")
	noFX := fs.Bool("no-fx", false, "gameplay only, no cosmic weather")
	help := fs.Bool("help", false, "print usage and stop")

	if err := fs.Parse(args); err != nil {
		return app.Options{}, true, err
	}
	if *help {
		fmt.Fprint(out, usage)
		return app.Options{}, true, nil
	}
	if n := fs.NArg(); n > 0 {
		return app.Options{}, true, fmt.Errorf("unexpected argument %q", fs.Arg(0))
	}

	// 49.5: --reduced-motion is about motion, not about glyphs or colour. Only
	// --ascii changes the render mode.
	opts := app.Options{
		Seed:          *seed,
		Mode:          render.ModeFull,
		ReducedMotion: *reduced,
		NoFX:          *noFX,
	}
	if *ascii {
		opts.Mode = render.ModeASCII
	}
	return opts, false, nil
}

func main() {
	opts, exit, err := parseFlags(os.Args[1:], os.Stderr)
	if err != nil {
		os.Exit(2)
	}
	if exit {
		return
	}
	if _, err := tea.NewProgram(app.New(opts)).Run(); err != nil {
		fmt.Fprintf(os.Stderr, "cosmic-tetris: %v\n", err)
		os.Exit(1)
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./cmd/... -v && go build ./...`
Expected: PASS, and a successful build.

- [ ] **Step 5: Commit**

```bash
git add cmd/cosmic-tetris/main.go cmd/cosmic-tetris/main_test.go
git commit -m "feat(cmd): cosmic-tetris command with seed, ascii, and motion flags"
```

---

### Task 11: Golden snapshot tests

**Files:**
- Create: `internal/app/golden_test.go`
- Create (generated): `internal/app/testdata/*.golden`

**Interfaces:**
- Consumes: `app.New`, `Model.Snapshot`, `press` from `keys_test.go`.
- Produces: the layout contract. These files are what "the layout is right" means from here on; Plan 3 must leave them passing with FX disabled.

- [ ] **Step 1: Write the golden test harness**

Create `internal/app/golden_test.go`:

```package app

import (
	"flag"
	"os"
	"path/filepath"
	"strings"
	"testing"

	tea "charm.land/bubbletea/v2"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

var update = flag.Bool("update", false, "rewrite the golden files")

// assertGolden compares a frame against testdata/<name>.golden.
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
		t.Fatalf("%v (run: go test ./internal/app/ -update)", err)
	}
	if got != string(want) {
		t.Errorf("frame %s does not match the golden file.\n--- got ---\n%s\n--- want ---\n%s",
			name, got, string(want))
	}
}

// scriptedModel builds a model in a reproducible mid-game state: a fixed seed,
// a known board, a held piece, and a score.
func scriptedModel(t *testing.T, w, h int, mode render.Mode) *Model {
	t.Helper()
	m := New(Options{Seed: 8675309, Mode: mode})
	m.Update(tea.WindowSizeMsg{Width: w, Height: h})

	// A jagged stack, deterministic and easy to eyeball.
	pattern := []struct {
		y     int
		cols  []int
		kind  game.PieceKind
	}{
		{21, []int{0, 1, 2, 3, 4, 5, 6, 7, 8}, game.KindI},
		{20, []int{0, 1, 2, 6, 7, 8}, game.KindZ},
		{19, []int{0, 7, 8}, game.KindL},
		{18, []int{8}, game.KindT},
	}
	for _, row := range pattern {
		for _, x := range row.cols {
			m.Game.Board.Set(x, row.y, game.CellOf(row.kind))
		}
	}
	held := game.KindO
	m.Game.Hold = &held
	m.Game.Score = 129340
	m.Game.Lines = 42
	m.Game.Level = 5
	m.Game.Active = game.Piece{Kind: game.KindT, Rotation: 0, X: 3, Y: 8}
	m.mission = "NOMINALISH"
	return m
}

func TestGoldenFrames(t *testing.T) {
	cases := []struct {
		name  string
		w, h  int
		mode  render.Mode
		setup func(*testing.T, *Model)
	}{
		{name: "wide-play", w: 80, h: 30, mode: render.ModeFull},
		{name: "medium-play", w: 48, h: 26, mode: render.ModeFull},
		{name: "small-play", w: 40, h: 24, mode: render.ModeFull},
		{name: "ascii-play", w: 80, h: 30, mode: render.ModeASCII},
		{
			name: "wide-paused", w: 80, h: 30, mode: render.ModeFull,
			setup: func(t *testing.T, m *Model) { m.Update(press("p")) },
		},
		{
			name: "wide-help", w: 80, h: 30, mode: render.ModeFull,
			setup: func(t *testing.T, m *Model) { m.Update(press("?")) },
		},
		{
			name: "small-help", w: 40, h: 24, mode: render.ModeFull,
			setup: func(t *testing.T, m *Model) { m.Update(press("?")) },
		},
		{
			name: "wide-gameover", w: 80, h: 30, mode: render.ModeFull,
			setup: func(t *testing.T, m *Model) { m.Game.Over = true },
		},
		{
			name: "too-small", w: 30, h: 12, mode: render.ModeFull,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			m := scriptedModel(t, tc.w, tc.h, tc.mode)
			if tc.setup != nil {
				tc.setup(t, m)
			}
			assertGolden(t, tc.name, m.Snapshot())
		})
	}
}

// The golden files are the layout contract, so assert their shape too: a frame
// is exactly h lines, none wider than w.
func TestGoldenFramesHaveTheRightShape(t *testing.T) {
	for _, tc := range []struct {
		name string
		w, h int
	}{
		{"wide-play", 80, 30}, {"medium-play", 48, 26}, {"small-play", 40, 24},
		{"ascii-play", 80, 30}, {"wide-paused", 80, 30}, {"wide-help", 80, 30},
		{"small-help", 40, 24}, {"wide-gameover", 80, 30}, {"too-small", 30, 12},
	} {
		b, err := os.ReadFile(filepath.Join("testdata", tc.name+".golden"))
		if err != nil {
			t.Fatalf("%v (run: go test ./internal/app/ -update)", err)
		}
		rows := strings.Split(string(b), "\n")
		if len(rows) != tc.h {
			t.Errorf("%s has %d rows, want %d", tc.name, len(rows), tc.h)
		}
		for i, row := range rows {
			if n := len([]rune(row)); n > tc.w {
				t.Errorf("%s row %d is %d columns wide, want at most %d", tc.name, i, n, tc.w)
			}
		}
		if strings.Contains(string(b), "\x1b") {
			t.Errorf("%s contains escape sequences; snapshots must be ANSI-stripped", tc.name)
		}
	}
}
```

Fix the fenced-block opener when pasting: the file starts with `package app`, not the stray backtick-run above.

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/app/ -run Golden -v`
Expected: FAIL — the `testdata` files do not exist yet.

- [ ] **Step 3: Generate the golden files, then read every one of them**

```bash
go test ./internal/app/ -run Golden -update
ls internal/app/testdata/
```

Now open each `.golden` file and actually look at it. This is the only step in the plan where the layout gets judged by a person; the test can only tell you it did not change. Check:
- The board is 22 columns wide and 22 rows tall, with an unbroken border.
- Blocks are two columns wide and never split across the border.
- The ghost sits directly beneath the active piece, on the landing row.
- HOLD, NEXT, and the stats are beside the board, not on top of it, and nothing is cut off at the right edge.
- `small-play` has no stat labels, three NEXT previews, and no title row.
- `wide-help` and `small-help` show every binding, inside the box, with nothing truncated.
- `too-small` states both the required and the actual size.

If anything looks wrong, fix the layout or the drawing code, re-run with `-update`, and look again. Do not commit golden files you have not read.

- [ ] **Step 4: Run the suite without `-update`**

Run: `go test ./... -race -shuffle=on -count=2`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/app/golden_test.go internal/app/testdata/
git commit -m "test(app): golden frame snapshots as the layout contract"
```

---

### Task 12: Play it, then write it down

**Files:**
- Create: `README.md`
- Modify: `internal/app/model.go` (only if playing it reveals a problem)

- [ ] **Step 1: Build and play the game**

```bash
go build -o /tmp/cosmic-tetris ./cmd/cosmic-tetris
/tmp/cosmic-tetris --seed 1234
```

Play at least two full games, then confirm each of these by hand — this is the §40 checklist for Phase 2, and the tests cannot judge feel:

- Movement feels immediate; there is no perceptible lag between a keypress and the piece moving.
- Gravity speeds up as the level rises, and the game stays playable at level 10.
- Hard drop lands where the ghost said it would, every time.
- Hold swaps once per piece and refuses a second swap until the next lock.
- Pause stops everything and resuming does not teleport the piece downward.
- `?` shows every key you actually use.
- Resizing the terminal — including dragging it smaller than 40×24 and back — never garbles the frame and never crashes.
- `q` and `Ctrl+C` both exit cleanly and leave the terminal usable (no stuck alt screen, no lost cursor).

Then repeat the resize and exit checks with `--ascii`.

- [ ] **Step 2: Fix anything that felt wrong**

If something failed, add a test that captures it in the owning task's file, fix it, and re-run `go test ./... -race`.

- [ ] **Step 3: Write the README**

Create `README.md`:

```markdown
# Cosmic Tetris

A falling-block game for the terminal, with an unreasonable amount of cosmic
weather. Built with [Bubble Tea](https://charm.land).

## Play

```bash
go run ./cmd/cosmic-tetris
```

Needs a terminal at least 40×24. Bigger is better.

## Flags

| Flag | Effect |
| --- | --- |
| `--seed N` | Pin the universe to seed `N`. The same seed always plays out the same way. |
| `--ascii` | ASCII glyphs and basic colours, for terminals that cannot do better. |
| `--reduced-motion` | Calmer visuals: no shake, no flashing. |
| `--no-fx` | Gameplay only, no cosmic weather. |
| `--help` | Usage and keys. |

## Keys

| Keys | Action |
| --- | --- |
| `←` `h` `a` / `→` `l` `d` | Drift left and right |
| `↓` `j` `s` | Descend |
| `↑` `k` `x` `w` | Rotate |
| `z` | Rotate back |
| `space` | Hard drop |
| `c` | Hold |
| `p` | Pause |
| `r` | Restart |
| `?` | Help |
| `q` `esc` | Quit |

## Layout

- `internal/game` — the rules. Deterministic, no clock of its own, no terminal.
- `internal/render` — a character grid, a palette, an adaptive layout, and the
  drawing passes.
- `internal/app` — the Bubble Tea program: input, the frame clock, overlays.
- `cmd/cosmic-tetris` — flags and startup.

## Development

```bash
go test ./... -race -shuffle=on
go test ./internal/app/ -update   # rewrite the golden frame snapshots
go vet ./...
```

The `.golden` files under `internal/app/testdata` are the layout contract: they
are ANSI-stripped frames at every supported size. Read a diff before you accept
one.
```

- [ ] **Step 4: Final check**

```bash
go test ./... -race -shuffle=on
go vet ./...
gofmt -l .
```

Expected: tests pass, vet clean, `gofmt -l` prints nothing.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: README with flags, keys, and layout"
```

---

## Done when

- `go test ./... -race -shuffle=on` and `go vet ./...` are clean, and `gofmt -l .` is silent.
- `go run ./cmd/cosmic-tetris` is a complete, playable game: gravity, lock delay, rotation with kicks, hold, ghost, hard drop, scoring, levels, pause, help, game over, restart, quit.
- The golden files under `internal/app/testdata/` cover wide, medium, small, ASCII, paused, help, game over, and too-small, and a human has read each one.
- `--seed`, `--ascii`, `--reduced-motion`, `--no-fx`, and `--help` all work; `--seed N` replays identically across runs, including after `r`.
- Resizing between 20×8 and full screen never crashes or garbles the frame.
- `internal/render` imports `game` and lipgloss only. It does not import `app`, and there is no `fx` package yet.
- No cosmic weather yet: no stars, no particles, no shake, no banners. That is Plan 3.
