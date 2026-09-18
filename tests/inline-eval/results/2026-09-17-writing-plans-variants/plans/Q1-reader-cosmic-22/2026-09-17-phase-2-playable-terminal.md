# Cosmic Tetris Phase 2 — Playable Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Phase 1 engine into a genuinely good terminal game: a Bubble Tea program with board rendering, ghost, hold, next queue, stats, help, pause, game over, live resize, and a `--seed/--ascii/--no-fx/--reduced-motion` CLI. No cosmic effects yet.

**Architecture:** Two new packages. `internal/render` is pure: it draws into a homegrown rune `Canvas` and returns a string, given a value snapshot of the game plus a `Params` struct — no Bubble Tea types, no clock, no state. `internal/app` owns the Bubble Tea model: one 60 Hz frame clock whose delta is clamped and handed to `game.Advance`, key presses translated through a `bubbles/key` `KeyMap` and handed to `game.Apply`, and a scene enum for boot/play/pause/help/over/too-small. Because rendering takes a snapshot and returns a string, every layout is testable as an ANSI-free golden.

**Tech Stack:** Go 1.25.0, `charm.land/bubbletea/v2 v2.0.9`, `charm.land/lipgloss/v2 v2.0.6`, `charm.land/bubbles/v2 v2.2.1` (the `key` package only).

**Spec:** [`design.md`](../design.md) — this phase implements §4, §5 (rendering side), §8, §9 (mechanics, not the quantum-storage animation), §10, §28 (final panel only), §30, §31, §32, §33 (`app` + `render`), §34 (`Model`), §36, §37, §38, §39, §41, §42 Phase 2, §46, and §49.3/§49.4.

## Global Constraints

These apply to every task in every Cosmic Tetris plan.

- Module path is `cosmic-tetris`; `go.mod` declares `go 1.25.0` (the floor required by the Charm v2 libraries).
- Direct dependencies are limited to `charm.land/bubbletea/v2 v2.0.9`, `charm.land/lipgloss/v2 v2.0.6`, `charm.land/bubbles/v2 v2.2.1`. Nothing else — including in tests. (This is why golden tests compare `Canvas.Plain()` rather than stripping ANSI with `x/ansi`.)
- Package layout is exactly §33's tree. Do not add packages.
- Board geometry is fixed: `width 10`, `height 22`, `visible rows 20`, `hidden spawn rows 2` (§5).
- **Nothing under `internal/game` may call `time.Now()`** (§49.2). Time enters only as the `dt` argument to `Advance`. In this phase, `internal/render` is held to the same rule: it is a pure function of its inputs.
- The game RNG and the FX RNG are separate objects and never share state (§49.6, §35).
- The FX system may observe game events and may never modify game state (§14).
- Screen shake never exceeds roughly one terminal cell (§44).
- Animation never delays gameplay and never blocks input (§44).
- No networking, no profiles, no achievements, no plugin system, no database (§2).
- No filesystem operations during gameplay (§38). Goldens are read in tests only.
- No goroutine per particle and no goroutine per frame (§38). One `tea.Tick` chain is the whole clock.
- Every task ends green: `go build ./... && go vet ./... && go test ./...`.

## Review Focus

Failure modes this phase's code owns that the spec implies but never states. Each has a test added to the task that owns the code — listed here once, with the owning task named.

- **A window size of zero, or a negative one.** Bubble Tea delivers the first `WindowSizeMsg` after `Init`, so the model renders at least once at 0×0; some terminals report 0 during a resize storm. Expected: no panic, no negative slice length, and the too-small notice (or empty output) rather than a crash. → Task 1 (`NewCanvas` clamps) and Task 3 (`Compute` at 0×0).
- **A frame delta of minutes.** `Ctrl-Z` then `fg`, or a laptop sleep, makes `now - LastFrame` enormous; feeding that to `Advance` drops and locks dozens of pieces in one frame and can end the game while the player is away. Expected: the delta is clamped to `MaxFrameDelta` (100ms) so a suspend costs at most one gravity step. → Task 10.
- **Every terminal size from the minimum up.** Layout arithmetic is the easiest thing here to get off by one, and `Canvas.Set` clips silently, so an overflowing layout looks like missing output rather than an error. Expected: for every width 40..200 and height 24..60, the computed layout's every rectangle lies inside the canvas, and the tier boundaries land exactly on 40×24 / 56×26 / 72×28. → Task 12.
- **Ghost piece where the board is already occupied, and ghost identical to the active piece.** When the active piece rests on the stack the ghost coincides with it, and a ghost cell can fall on a locked cell during a kick. Expected: ghost never overwrites a locked cell and never overwrites the active piece — §10's "must never obscure locked blocks" and §44's "never obscure the active piece". → Task 4.
- **Keys pressed while paused, while dead, and while too small.** The player mashes during the game-over sequence and during a resize. Expected: in `ScenePause` only `p`, `?`, `r`, `q` do anything; in `SceneOver` only `r` and `q`; in `SceneTooSmall` only `q`; movement keys never reach `game.Apply`. → Task 10.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `go.mod` | Add the three Charm v2 requires. |
| `internal/render/canvas.go` | `Cell`, `Canvas`: clipped cell writes, `Blit`, `Plain` for goldens, `Render` for styled output. |
| `internal/render/palette.go` | `Mode`, `DetectMode`, the glyph table, the neon-space palette per mode. |
| `internal/render/layout.go` | Tier selection from `(w,h)` and every rectangle's position. Pure arithmetic. |
| `internal/render/board.go` | The board box: border, locked cells, ghost, active piece. |
| `internal/render/hud.go` | HOLD / NEXT / stats panels, title line, mission-control line, controls line. |
| `internal/render/overlay.go` | Centred boxes: too-small notice, pause, help, game-over panel. |
| `internal/render/render.go` | `Scene`, `Params`, `Draw` — composes everything in §37's order. |
| `internal/render/testdata/*.golden` | ANSI-free layout contract (§41, §49.7). |
| `internal/app/keys.go` | `KeyMap` of `bubbles/key` bindings; key → `game.Input` mapping; help rows. |
| `internal/app/messages.go` | `frameMsg`, the tick command, `FrameDelta` and its clamp. |
| `internal/app/model.go` | `Model`, `New`, `Init`, `View`. |
| `internal/app/update.go` | `Update`: keys, frame, resize, scene transitions. |
| `cmd/cosmic-tetris/main.go` | Flag parsing and program wiring. |

**Deviations from §33:** the `render` tree gains `canvas.go` and `overlay.go`. The canvas is the one piece of infrastructure everything else in `render` and all of Phase 4 writes through, and overlays are four self-contained panels with their own copy; folding either into `render.go` would make it the largest file in the project. §33 also lists `internal/app/update.go` and `messages.go`, which this phase creates as specified.

---

### Task 1: The render canvas

**Files:**
- Modify: `go.mod` (add the lipgloss require)
- Create: `internal/render/canvas.go`
- Test: `internal/render/canvas_test.go`

**Interfaces:**
- Consumes: nothing from Phase 1.
- Produces: `type Cell struct { Rune rune; FG color.Color; Bold bool }`; `type Canvas struct { W, H int; ... }`; `func NewCanvas(w, h int) *Canvas`; `func (*Canvas) Set(x, y int, c Cell)`; `func (*Canvas) At(x, y int) Cell`; `func (*Canvas) SetString(x, y int, s string, fg color.Color, bold bool)`; `func (*Canvas) Blit(src *Canvas, dx, dy int)`; `func (*Canvas) Plain() string`; `func (*Canvas) Render() string`.

**Why a homegrown canvas rather than `lipgloss.Canvas`:** every later phase needs per-cell compositing (particles land on individual cells), silent clipping (a particle at x=-3 must be dropped, not panic), whole-frame offsetting (screen shake blits the frame one cell over), and plain-text goldens. A rune grid gives all four in ~90 lines.

- [ ] **Step 1: Add the lipgloss dependency**

```bash
go get charm.land/lipgloss/v2@v2.0.6
```

Confirm `go.mod` now requires `charm.land/lipgloss/v2 v2.0.6` and that the `go` line is still `go 1.25.0`.

- [ ] **Step 2: Write the failing test**

Create `internal/render/canvas_test.go`:

```go
package render

import (
	"image/color"
	"strings"
	"testing"

	"charm.land/lipgloss/v2"
)

func TestCanvasSetAndAt(t *testing.T) {
	c := NewCanvas(4, 3)
	if c.W != 4 || c.H != 3 {
		t.Fatalf("NewCanvas(4,3) = %dx%d, want 4x3", c.W, c.H)
	}
	red := lipgloss.Color("#FF0000")
	c.Set(1, 2, Cell{Rune: 'x', FG: red, Bold: true})
	got := c.At(1, 2)
	if got.Rune != 'x' || got.FG != red || !got.Bold {
		t.Errorf("At(1,2) = %+v, want x/red/bold", got)
	}
	if c.At(0, 0).Rune != 0 {
		t.Error("untouched cell should be transparent (Rune == 0)")
	}
}

func TestCanvasClipsEveryWriteAndRead(t *testing.T) {
	c := NewCanvas(3, 2)
	for _, p := range [][2]int{{-1, 0}, {0, -1}, {3, 0}, {0, 2}, {-100, -100}, {999, 999}} {
		c.Set(p[0], p[1], Cell{Rune: '#'})
		if got := c.At(p[0], p[1]); got != (Cell{}) {
			t.Errorf("At%v = %+v after out-of-bounds Set, want zero Cell", p, got)
		}
	}
	if strings.TrimSpace(c.Plain()) != "" {
		t.Errorf("out-of-bounds writes leaked into the canvas: %q", c.Plain())
	}
}

func TestNewCanvasClampsNonPositiveSizes(t *testing.T) {
	for _, d := range [][2]int{{0, 0}, {-4, 3}, {5, -9}, {-1, -1}} {
		c := NewCanvas(d[0], d[1])
		if c.W < 0 || c.H < 0 {
			t.Fatalf("NewCanvas%v = %dx%d, want non-negative", d, c.W, c.H)
		}
		c.Set(0, 0, Cell{Rune: 'a'}) // must not panic
		_ = c.Plain()
	}
}

func TestCanvasSetStringWritesOneRunePerCell(t *testing.T) {
	c := NewCanvas(8, 1)
	c.SetString(2, 0, "HOLD", nil, false)
	if got, want := c.Plain(), "  HOLD"; got != want {
		t.Errorf("Plain() = %q, want %q", got, want)
	}
	if c.At(2, 0).Rune != 'H' || c.At(5, 0).Rune != 'D' {
		t.Error("SetString should advance one cell per rune")
	}
}

func TestCanvasSetStringClipsAtTheRightEdge(t *testing.T) {
	c := NewCanvas(4, 1)
	c.SetString(2, 0, "ABCDEF", nil, false)
	if got, want := c.Plain(), "  AB"; got != want {
		t.Errorf("Plain() = %q, want %q", got, want)
	}
}

func TestCanvasPlainTrimsTrailingSpaceAndKeepsRows(t *testing.T) {
	c := NewCanvas(5, 3)
	c.SetString(0, 0, "ab", nil, false)
	c.SetString(3, 2, "z", nil, false)
	if got, want := c.Plain(), "ab\n\n   z"; got != want {
		t.Errorf("Plain() = %q, want %q", got, want)
	}
}

func TestCanvasBlitSkipsTransparentCells(t *testing.T) {
	dst := NewCanvas(6, 2)
	dst.SetString(0, 0, "......", nil, false)
	src := NewCanvas(3, 1)
	src.Set(0, 0, Cell{Rune: 'X'})
	src.Set(2, 0, Cell{Rune: 'Y'}) // cell 1 stays transparent
	dst.Blit(src, 2, 0)
	if got, want := dst.Plain(), "..X.Y."; got != want {
		t.Errorf("Plain() = %q, want %q", got, want)
	}
}

func TestCanvasBlitClipsPartiallyOffscreenSources(t *testing.T) {
	dst := NewCanvas(3, 1)
	src := NewCanvas(3, 1)
	src.SetString(0, 0, "abc", nil, false)
	dst.Blit(src, -1, 0) // "a" falls off the left
	if got, want := dst.Plain(), "bc"; got != want {
		t.Errorf("Plain() = %q, want %q", got, want)
	}
}

func TestCanvasRenderGroupsRunsOfOneStyle(t *testing.T) {
	// Render must emit one escape sequence per run of same-styled cells, not
	// one per cell. This is the whole anti-flicker story (§38): the terminal is
	// the bottleneck. It relies on color.Color values being comparable with ==,
	// which holds for every concrete type lipgloss.Color returns.
	c := NewCanvas(4, 1)
	cyan := lipgloss.Color("#22E4F7")
	same := lipgloss.Color("#22E4F7")
	if cyan != same {
		t.Fatal("lipgloss.Color values are no longer comparable with ==; Render must group by a comparison function instead")
	}
	c.Set(0, 0, Cell{Rune: '#', FG: cyan})
	c.Set(1, 0, Cell{Rune: '#', FG: same})
	c.Set(2, 0, Cell{Rune: '#', FG: lipgloss.Color("#FF4D6D")})
	c.Set(3, 0, Cell{Rune: '#', FG: lipgloss.Color("#FF4D6D")})
	got := c.Render()
	if n := strings.Count(got, "\x1b["); n > 4 {
		t.Errorf("Render() emitted %d escape sequences for 2 runs: %q", n, got)
	}
	if strings.Count(got, "##") != 2 {
		t.Errorf("Render() = %q, want two two-cell runs", got)
	}
}

func TestCanvasRenderIsPlainForUnstyledCells(t *testing.T) {
	c := NewCanvas(6, 2)
	c.SetString(0, 0, "hi", nil, false)
	var noColor color.Color
	c.Set(0, 1, Cell{Rune: 'k', FG: noColor})
	if got, want := c.Render(), "hi\nk"; got != want {
		t.Errorf("Render() = %q, want %q", got, want)
	}
}
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run TestCanvas -v`
Expected: FAIL — `undefined: NewCanvas`.

- [ ] **Step 4: Write the implementation**

Create `internal/render/canvas.go`:

```go
// Package render draws Cosmic Tetris. Everything here is a pure function of
// its arguments: no clock, no terminal I/O, no game mutation (§37).
package render

import (
	"image/color"
	"strings"

	"charm.land/lipgloss/v2"
)

// Cell is one terminal cell. A zero Rune means transparent: Blit skips it,
// Plain renders it as a space, and Render leaves it unstyled.
type Cell struct {
	Rune rune
	FG   color.Color
	Bold bool
}

// Canvas is a fixed-size grid of terminal cells. Every write is clipped to the
// grid, so callers may draw wherever they like without bounds checks — which is
// what lets particles and screen shake stay simple (§38).
type Canvas struct {
	W, H  int
	cells []Cell
}

// NewCanvas allocates a w×h canvas of transparent cells. Non-positive
// dimensions clamp to zero rather than panicking: terminals report 0×0.
func NewCanvas(w, h int) *Canvas {
	if w < 0 {
		w = 0
	}
	if h < 0 {
		h = 0
	}
	return &Canvas{W: w, H: h, cells: make([]Cell, w*h)}
}

func (c *Canvas) inBounds(x, y int) bool {
	return x >= 0 && y >= 0 && x < c.W && y < c.H
}

// Set writes one cell. Out-of-bounds writes are dropped.
func (c *Canvas) Set(x, y int, cell Cell) {
	if !c.inBounds(x, y) {
		return
	}
	c.cells[y*c.W+x] = cell
}

// At reads one cell. Out-of-bounds reads return the zero (transparent) Cell.
func (c *Canvas) At(x, y int) Cell {
	if !c.inBounds(x, y) {
		return Cell{}
	}
	return c.cells[y*c.W+x]
}

// SetString writes s left to right from (x, y), one rune per cell. Every glyph
// this program uses is one terminal column wide, so runes and columns agree.
func (c *Canvas) SetString(x, y int, s string, fg color.Color, bold bool) {
	i := 0
	for _, r := range s {
		c.Set(x+i, y, Cell{Rune: r, FG: fg, Bold: bold})
		i++
	}
}

// Blit copies src onto c with src's origin at (dx, dy), skipping src's
// transparent cells so layers show through.
func (c *Canvas) Blit(src *Canvas, dx, dy int) {
	for y := 0; y < src.H; y++ {
		for x := 0; x < src.W; x++ {
			cell := src.At(x, y)
			if cell.Rune == 0 {
				continue
			}
			c.Set(dx+x, dy+y, cell)
		}
	}
}

// lastFilled returns the rightmost non-transparent column in row y, or -1.
func (c *Canvas) lastFilled(y int) int {
	for x := c.W - 1; x >= 0; x-- {
		if c.At(x, y).Rune != 0 {
			return x
		}
	}
	return -1
}

// Plain renders the canvas as unstyled text with trailing blanks trimmed. This
// is the form the golden tests compare (§41).
func (c *Canvas) Plain() string {
	var b strings.Builder
	for y := 0; y < c.H; y++ {
		last := c.lastFilled(y)
		for x := 0; x <= last; x++ {
			r := c.At(x, y).Rune
			if r == 0 {
				r = ' '
			}
			b.WriteRune(r)
		}
		if y < c.H-1 {
			b.WriteByte('\n')
		}
	}
	return b.String()
}

// Render renders the canvas with colors, emitting one escape sequence per run
// of identically styled cells rather than per cell.
func (c *Canvas) Render() string {
	var out strings.Builder
	var run strings.Builder
	var runFG color.Color
	runBold := false

	flush := func() {
		if run.Len() == 0 {
			return
		}
		s := run.String()
		run.Reset()
		if runFG == nil && !runBold {
			out.WriteString(s)
			return
		}
		st := lipgloss.NewStyle().Bold(runBold)
		if runFG != nil {
			st = st.Foreground(runFG)
		}
		out.WriteString(st.Render(s))
	}

	for y := 0; y < c.H; y++ {
		last := c.lastFilled(y)
		for x := 0; x <= last; x++ {
			cell := c.At(x, y)
			r, fg, bold := cell.Rune, cell.FG, cell.Bold
			if r == 0 {
				r, fg, bold = ' ', nil, false
			}
			if run.Len() > 0 && (fg != runFG || bold != runBold) {
				flush()
			}
			runFG, runBold = fg, bold
			run.WriteRune(r)
		}
		flush()
		if y < c.H-1 {
			out.WriteByte('\n')
		}
	}
	return out.String()
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v && go vet ./...`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add go.mod go.sum internal/render/canvas.go internal/render/canvas_test.go
git commit -m "feat(render): clipped rune canvas with plain and styled output"
```

---

### Task 2: Rendering modes, glyphs, and the neon-space palette

**Files:**
- Create: `internal/render/palette.go`
- Test: `internal/render/palette_test.go`

**Interfaces:**
- Consumes: `game.KindCount`, `game.PieceKind` and its `KindI…KindZ` constants (Phase 1 Task 1); `Cell` (Task 1).
- Produces: `type Mode int` with `ModeFull, ModeReduced, ModeASCII` and `func (Mode) String() string`; `func DetectMode(ascii bool, term, colorterm string) Mode`; `type GlyphSet` with the fields listed below and `func GlyphsFor(Mode) GlyphSet`; `type Palette` with the fields listed below and `func PaletteFor(Mode) Palette`.

**Decision — detection is a pure function of three strings.** `DetectMode` takes the `--ascii` flag and the values of `TERM` and `COLORTERM` as arguments rather than reading the environment itself, so every branch is a table test and `render` keeps its no-side-effects property. `main.go` does the `os.Getenv` calls (Task 11).

**Decision — ASCII ghost stays `··` (U+00B7), per §49.4.** U+00B7 is Latin-1 rather than strict ASCII, which sits slightly awkwardly against §32's "no special Unicode assumptions". §49 wins over earlier sections by its own rule, `·` is a single-column glyph everywhere, and the alternative (`..`) reads as a typo next to `[]` pieces.

- [ ] **Step 1: Write the failing test**

Create `internal/render/palette_test.go`:

```go
package render

import (
	"fmt"
	"testing"
	"unicode/utf8"

	"cosmic-tetris/internal/game"
)

func TestDetectMode(t *testing.T) {
	cases := []struct {
		name      string
		ascii     bool
		term      string
		colorterm string
		want      Mode
	}{
		{"flag wins over everything", true, "xterm-256color", "truecolor", ModeASCII},
		{"no TERM at all", false, "", "truecolor", ModeASCII},
		{"dumb terminal", false, "dumb", "truecolor", ModeASCII},
		{"truecolor", false, "xterm-256color", "truecolor", ModeFull},
		{"24bit", false, "xterm-256color", "24bit", ModeFull},
		{"truecolor upper case", false, "xterm", "TrueColor", ModeFull},
		{"256 color, no COLORTERM", false, "xterm-256color", "", ModeReduced},
		{"unknown COLORTERM", false, "screen", "yes", ModeReduced},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := DetectMode(tc.ascii, tc.term, tc.colorterm); got != tc.want {
				t.Errorf("DetectMode(%v, %q, %q) = %v, want %v", tc.ascii, tc.term, tc.colorterm, got, tc.want)
			}
		})
	}
}

func TestModeString(t *testing.T) {
	want := map[Mode]string{ModeFull: "full", ModeReduced: "reduced", ModeASCII: "ascii"}
	for m, s := range want {
		if got := m.String(); got != s {
			t.Errorf("Mode(%d).String() = %q, want %q", m, got, s)
		}
	}
}

// Every glyph must be exactly one terminal column per rune, or the whole
// layout shears. Cell glyphs are two runes (one logical block is 2×1, §5);
// decorations are one. Display width was verified against the same width
// tables lipgloss uses; this test pins the rune counts that make that true.
func TestGlyphMetrics(t *testing.T) {
	for _, m := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		g := GlyphsFor(m)
		for name, s := range map[string]string{"Block": g.Block, "Ghost": g.Ghost, "Empty": g.Empty} {
			if n := utf8.RuneCountInString(s); n != CellCols {
				t.Errorf("%v %s = %q: %d runes, want %d", m, name, s, n, CellCols)
			}
		}
		ones := map[string]string{
			"BoardTL": g.BoardTL, "BoardTR": g.BoardTR, "BoardBL": g.BoardBL, "BoardBR": g.BoardBR,
			"BoardH": g.BoardH, "BoardV": g.BoardV,
			"BoxTL": g.BoxTL, "BoxTR": g.BoxTR, "BoxBL": g.BoxBL, "BoxBR": g.BoxBR,
			"BoxH": g.BoxH, "BoxV": g.BoxV,
			"Star": g.Star, "Comet": g.Comet,
		}
		for name, s := range ones {
			if n := utf8.RuneCountInString(s); n != 1 {
				t.Errorf("%v %s = %q: %d runes, want 1", m, name, s, n)
			}
		}
	}
}

func TestASCIIModeUsesTheSpecGlyphs(t *testing.T) {
	g := GlyphsFor(ModeASCII)
	if g.Block != "[]" {
		t.Errorf("ASCII Block = %q, want %q (§5, §49.4)", g.Block, "[]")
	}
	if g.Ghost != "··" {
		t.Errorf("ASCII Ghost = %q, want %q (§49.4)", g.Ghost, "··")
	}
	if g.BoardH != "-" || g.BoardV != "|" || g.BoardTL != "+" {
		t.Error("ASCII board border should be built from + - |")
	}
}

func TestUnicodeModesUseTheSpecGlyphs(t *testing.T) {
	for _, m := range []Mode{ModeFull, ModeReduced} {
		g := GlyphsFor(m)
		if g.Block != "██" || g.Ghost != "░░" {
			t.Errorf("%v: Block/Ghost = %q/%q, want ██/░░ (§5, §49.4)", m, g.Block, g.Ghost)
		}
		if g.BoardTL != "╔" || g.BoardH != "═" || g.BoardV != "║" || g.BoardBR != "╝" {
			t.Errorf("%v: board border should be the double box of §25", m)
		}
		if g.BoxTL != "╭" || g.BoxBR != "╯" {
			t.Errorf("%v: overlay boxes should be the rounded box of §30", m)
		}
	}
}

func TestPaletteCoversEveryPieceKindDistinctly(t *testing.T) {
	for _, m := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		p := PaletteFor(m)
		seen := map[string]game.PieceKind{}
		for k := game.PieceKind(0); int(k) < game.KindCount; k++ {
			if p.Piece[k] == nil {
				t.Fatalf("%v: Piece[%v] is nil", m, k)
			}
			if p.PieceLock[k] == nil {
				t.Fatalf("%v: PieceLock[%v] is nil", m, k)
			}
			if m == ModeFull {
				r, g, b, _ := p.Piece[k].RGBA()
				key := fmt.Sprintf("%d/%d/%d", r, g, b)
				if prev, dup := seen[key]; dup {
					t.Errorf("full mode: %v and %v share a color", prev, k)
				}
				seen[key] = k
			}
		}
	}
}

func TestPaletteChromeIsPopulated(t *testing.T) {
	for _, m := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		p := PaletteFor(m)
		for name, c := range map[string]any{
			"Ghost": p.Ghost, "Border": p.Border, "Title": p.Title, "Universe": p.Universe,
			"Label": p.Label, "Value": p.Value, "Mission": p.Mission, "Controls": p.Controls,
			"OverlayBorder": p.OverlayBorder, "OverlayText": p.OverlayText, "OverlayDim": p.OverlayDim,
		} {
			if c == nil {
				t.Errorf("%v: palette field %s is nil", m, name)
			}
		}
	}
}

// §49.4: the active piece renders one step brighter than locked cells. In full
// mode that is a darkened locked color; the 256-color and ASCII ramps are too
// coarse to darken, so brightness there comes from bold on the active cell.
func TestLockedCellsAreDarkerInFullMode(t *testing.T) {
	p := PaletteFor(ModeFull)
	for k := game.PieceKind(0); int(k) < game.KindCount; k++ {
		ar, ag, ab, _ := p.Piece[k].RGBA()
		lr, lg, lb, _ := p.PieceLock[k].RGBA()
		if lr+lg+lb >= ar+ag+ab {
			t.Errorf("full mode %v: locked color is not darker than active", k)
		}
	}
	for _, m := range []Mode{ModeReduced, ModeASCII} {
		q := PaletteFor(m)
		for k := game.PieceKind(0); int(k) < game.KindCount; k++ {
			if q.Piece[k] != q.PieceLock[k] {
				t.Errorf("%v %v: expected the same color for active and locked", m, k)
			}
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestDetectMode|TestGlyph|TestPalette|TestMode|TestASCII|TestUnicode|TestLocked' -v`
Expected: FAIL — `undefined: DetectMode`.

- [ ] **Step 3: Write the implementation**

Create `internal/render/palette.go`:

```go
package render

import (
	"image/color"
	"strings"

	"charm.land/lipgloss/v2"
	"cosmic-tetris/internal/game"
)

// CellCols is how many terminal columns one logical board cell occupies (§5).
const CellCols = 2

// Mode is the rendering capability tier (§32).
type Mode int

const (
	ModeFull Mode = iota // Unicode, truecolor, all effects
	ModeReduced          // Unicode, 256 color, simplified gradients
	ModeASCII            // ASCII glyphs, 8 colors, no Unicode assumptions
)

func (m Mode) String() string {
	switch m {
	case ModeFull:
		return "full"
	case ModeReduced:
		return "reduced"
	default:
		return "ascii"
	}
}

// DetectMode picks a rendering mode from the --ascii flag and the TERM and
// COLORTERM values. It is pure: the caller reads the environment.
func DetectMode(ascii bool, term, colorterm string) Mode {
	if ascii || term == "" || term == "dumb" {
		return ModeASCII
	}
	switch strings.ToLower(colorterm) {
	case "truecolor", "24bit":
		return ModeFull
	}
	return ModeReduced
}

// GlyphSet is every glyph the renderer draws, so a mode change is one lookup.
// Block, Ghost and Empty are CellCols runes wide; everything else is one rune.
type GlyphSet struct {
	Block string // a filled board cell (§49.4)
	Ghost string // a landing-preview cell (§10, §49.4)
	Empty string // an empty board cell

	BoardTL, BoardTR, BoardBL, BoardBR, BoardH, BoardV string // §25 machinery
	BoxTL, BoxTR, BoxBL, BoxBR, BoxH, BoxV             string // §30/§39 overlays

	Star  string // title sparkle
	Comet string // mission-control prefix (§27)
}

func GlyphsFor(m Mode) GlyphSet {
	if m == ModeASCII {
		return GlyphSet{
			Block: "[]", Ghost: "··", Empty: "  ",
			BoardTL: "+", BoardTR: "+", BoardBL: "+", BoardBR: "+", BoardH: "-", BoardV: "|",
			BoxTL: "+", BoxTR: "+", BoxBL: "+", BoxBR: "+", BoxH: "-", BoxV: "|",
			Star: "*", Comet: ">",
		}
	}
	return GlyphSet{
		Block: "██", Ghost: "░░", Empty: "  ",
		BoardTL: "╔", BoardTR: "╗", BoardBL: "╚", BoardBR: "╝", BoardH: "═", BoardV: "║",
		BoxTL: "╭", BoxTR: "╮", BoxBL: "╰", BoxBR: "╯", BoxH: "─", BoxV: "│",
		Star: "✦", Comet: "☄",
	}
}

// Palette is every color the renderer uses. Piece colors follow §26's neon
// space intent; PieceLock is the locked-cell variant (§49.4).
type Palette struct {
	Piece     [game.KindCount]color.Color
	PieceLock [game.KindCount]color.Color

	Ghost    color.Color
	Border   color.Color
	Title    color.Color
	Universe color.Color
	Label    color.Color
	Value    color.Color
	Mission  color.Color
	Controls color.Color

	OverlayBorder color.Color
	OverlayText   color.Color
	OverlayDim    color.Color
}

// lockedRatio is how far full-mode locked cells are darkened from active ones.
const lockedRatio = 0.25

func PaletteFor(m Mode) Palette {
	var p Palette
	switch m {
	case ModeFull:
		p.Piece = [game.KindCount]color.Color{
			game.KindI: lipgloss.Color("#22E4F7"), // plasma cyan
			game.KindJ: lipgloss.Color("#3A6BFF"), // deep electric blue
			game.KindL: lipgloss.Color("#FF8A2B"), // solar orange
			game.KindO: lipgloss.Color("#FFD447"), // stellar gold
			game.KindS: lipgloss.Color("#4BE08A"), // alien green
			game.KindT: lipgloss.Color("#B46BFF"), // ultraviolet
			game.KindZ: lipgloss.Color("#FF4D6D"), // supernova pink
		}
		for k := range p.Piece {
			p.PieceLock[k] = lipgloss.Darken(p.Piece[k], lockedRatio)
		}
		p.Ghost = lipgloss.Color("#3A4A63")
		p.Border = lipgloss.Color("#7A5CFF")
		p.Title = lipgloss.Color("#22E4F7")
		p.Universe = lipgloss.Color("#B46BFF")
		p.Label = lipgloss.Color("#7C8CA8")
		p.Value = lipgloss.Color("#E6F0FF")
		p.Mission = lipgloss.Color("#FFD447")
		p.Controls = lipgloss.Color("#7C8CA8")
		p.OverlayBorder = lipgloss.Color("#22E4F7")
		p.OverlayText = lipgloss.Color("#E6F0FF")
		p.OverlayDim = lipgloss.Color("#7C8CA8")
	case ModeReduced:
		p.Piece = [game.KindCount]color.Color{
			game.KindI: lipgloss.Color("51"),
			game.KindJ: lipgloss.Color("33"),
			game.KindL: lipgloss.Color("208"),
			game.KindO: lipgloss.Color("220"),
			game.KindS: lipgloss.Color("84"),
			game.KindT: lipgloss.Color("141"),
			game.KindZ: lipgloss.Color("204"),
		}
		p.PieceLock = p.Piece
		p.Ghost = lipgloss.Color("238")
		p.Border = lipgloss.Color("99")
		p.Title = lipgloss.Color("51")
		p.Universe = lipgloss.Color("141")
		p.Label = lipgloss.Color("245")
		p.Value = lipgloss.Color("255")
		p.Mission = lipgloss.Color("220")
		p.Controls = lipgloss.Color("245")
		p.OverlayBorder = lipgloss.Color("51")
		p.OverlayText = lipgloss.Color("255")
		p.OverlayDim = lipgloss.Color("245")
	default: // ModeASCII: the 8 ANSI colors only
		p.Piece = [game.KindCount]color.Color{
			game.KindI: lipgloss.Color("6"),
			game.KindJ: lipgloss.Color("4"),
			game.KindL: lipgloss.Color("3"),
			game.KindO: lipgloss.Color("3"),
			game.KindS: lipgloss.Color("2"),
			game.KindT: lipgloss.Color("5"),
			game.KindZ: lipgloss.Color("1"),
		}
		p.PieceLock = p.Piece
		p.Ghost = lipgloss.Color("8")
		p.Border = lipgloss.Color("4")
		p.Title = lipgloss.Color("6")
		p.Universe = lipgloss.Color("5")
		p.Label = lipgloss.Color("8")
		p.Value = lipgloss.Color("7")
		p.Mission = lipgloss.Color("3")
		p.Controls = lipgloss.Color("8")
		p.OverlayBorder = lipgloss.Color("6")
		p.OverlayText = lipgloss.Color("7")
		p.OverlayDim = lipgloss.Color("8")
	}
	return p
}
```

Note that ASCII mode reuses color `3` for both `L` and `O`; the distinctness
assertion in `TestPaletteCoversEveryPieceKindDistinctly` only applies to full
mode, because eight colors cannot separate seven pieces plus chrome.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/palette.go internal/render/palette_test.go
git commit -m "feat(render): rendering modes, glyph table, and neon space palette"
```

---

### Task 3: Adaptive layout

**Files:**
- Create: `internal/render/layout.go`
- Test: `internal/render/layout_test.go`

**Interfaces:**
- Consumes: `CellCols` (Task 2); `game.BoardWidth`, `game.VisibleRows` (Phase 1 Task 1).
- Produces: `type Rect struct { X, Y, W, H int }` with `Right()`, `Bottom()`, `Contains(x, y int) bool`; `type Tier int` with `TierTooSmall, TierSmall, TierMedium, TierLarge` and `String()`; `type ItemKind int` with `ItemHoldLabel, ItemHoldPreview, ItemNextLabel, ItemNextPreview, ItemScoreLabel, ItemScoreValue, ItemLinesLabel, ItemLinesValue, ItemLevelLabel, ItemLevelValue`; `type Item struct { Kind ItemKind; Index, X, Y, W int }`; `type Layout` (fields below); `func Compute(w, h int) Layout`; the geometry constants `BoardCols, BoardRows, BoxCols, BoxRows, PanelCols, SmallPanelCols, Gap, PreviewCols, PreviewRows, MinCols, MinRows`.

**Design — the layout is a display list.** `Compute` returns absolute terminal coordinates for the board, the panel rectangles, the three chrome rows, and a flat `[]Item` naming every HUD element and where it goes. All three tiers differ only in what `Compute` puts in that list, so `hud.go` has no tier logic at all, and the tests can assert "nothing overlaps" (§41) by checking rectangles rather than diffing pictures.

**Geometry, fixed by §5 and §49.3:**

```text
one board cell            2 cols × 1 row      →  play area 20 × 20
board with border         22 × 22
panel (large/medium)      12 cols
panel (small)              9 cols
gap between columns        1 col
piece preview              8 cols × 2 rows

column group: large 12+1+22+1+12 = 48 | medium 22+1+12 = 35 | small 22+1+9 = 32

large   w ≥ 72 and h ≥ 28   HOLD | BOARD | NEXT, stats under HOLD    frame 68 × 28
medium  w ≥ 56 and h ≥ 26   BOARD | one combined panel               frame 48 × 26
small   otherwise           BOARD | narrow panel, 3 NEXT, no labels  frame 32 × 23
below   w < 40 or h < 24     the §31 notice
```

**Why the frame is wider than the column group at large and medium sizes.** The
chrome lines are wider than the board group: §4's controls line is 61 columns
and its mission-control line is around 40, against a 48-column group. So
`Content` is the frame — the box the title border draws and the chrome lines
live in — and `Group` is the column group, centred inside it. That reproduces
§4's generous side margins, and gives the chrome its own `TextX`/`TextW` text
area instead of forcing the controls line to be cryptic on an 80-column
terminal.

Row budgets, dropping in §49.3's order (title border, then mission control, then
stat labels):

```text
large    0 title box top | 1 blank | 2..23 board | 24 blank | 25 mission | 26 controls | 27 box bottom
medium   0 title line    | 1..22 board | 23 blank | 24 mission | 25 controls
small    0..21 board     | 22 controls
```

- [ ] **Step 1: Write the failing test**

Create `internal/render/layout_test.go`:

```go
package render

import "testing"

func TestTierThresholds(t *testing.T) {
	cases := []struct {
		w, h int
		want Tier
	}{
		{0, 0, TierTooSmall},
		{-10, -10, TierTooSmall},
		{39, 24, TierTooSmall},
		{40, 23, TierTooSmall},
		{40, 24, TierSmall},
		{55, 26, TierSmall},
		{56, 25, TierSmall},
		{56, 26, TierMedium},
		{71, 28, TierMedium},
		{72, 27, TierMedium},
		{72, 28, TierLarge},
		{200, 60, TierLarge},
	}
	for _, tc := range cases {
		if got := Compute(tc.w, tc.h).Tier; got != tc.want {
			t.Errorf("Compute(%d,%d).Tier = %v, want %v", tc.w, tc.h, got, tc.want)
		}
	}
}

func TestTooSmallLayoutHasNoGeometry(t *testing.T) {
	l := Compute(0, 0)
	if l.Board.W != 0 || l.Board.H != 0 {
		t.Errorf("too-small board rect = %+v, want zero", l.Board)
	}
	if len(l.Items) != 0 {
		t.Errorf("too-small layout has %d HUD items, want 0", len(l.Items))
	}
	if l.TitleRow != -1 || l.MissionRow != -1 || l.ControlsRow != -1 {
		t.Errorf("too-small layout should have no chrome rows, got %+v", l)
	}
	if l.TextW != 0 || l.Group.W != 0 {
		t.Errorf("too-small layout should have no text area or group, got TextW=%d group=%+v", l.TextW, l.Group)
	}
	if l.Width != 0 || l.Height != 0 {
		t.Errorf("Compute should record the terminal size it was given, got %dx%d", l.Width, l.Height)
	}
}

func TestBoardIsAlwaysTwentyTwoBySquare(t *testing.T) {
	for _, d := range [][2]int{{40, 24}, {60, 26}, {80, 30}, {200, 60}} {
		l := Compute(d[0], d[1])
		if l.Board.W != BoxCols || l.Board.H != BoxRows {
			t.Errorf("Compute%v board = %dx%d, want %dx%d", d, l.Board.W, l.Board.H, BoxCols, BoxRows)
		}
		if l.Play.W != BoardCols || l.Play.H != BoardRows {
			t.Errorf("Compute%v play = %dx%d, want %dx%d", d, l.Play.W, l.Play.H, BoardCols, BoardRows)
		}
		if l.Play.X != l.Board.X+1 || l.Play.Y != l.Board.Y+1 {
			t.Errorf("Compute%v play origin %+v not inside board %+v", d, l.Play, l.Board)
		}
	}
}

func TestLargeLayoutColumns(t *testing.T) {
	l := Compute(80, 30)
	if l.Content.W != 68 || l.Content.H != 28 {
		t.Fatalf("large frame = %dx%d, want 68x28", l.Content.W, l.Content.H)
	}
	if l.Content.X != (80-68)/2 || l.Content.Y != (30-28)/2 {
		t.Errorf("large frame should be centred, got %+v in 80x30", l.Content)
	}
	if l.Group.W != 48 {
		t.Errorf("large group = %d cols, want 48", l.Group.W)
	}
	if l.Group.X != l.Content.X+(l.Content.W-l.Group.W)/2 {
		t.Errorf("the group should be centred in the frame: group=%+v frame=%+v", l.Group, l.Content)
	}
	if l.Left.W != PanelCols || l.Right.W != PanelCols {
		t.Errorf("large panels = %d/%d cols, want %d each", l.Left.W, l.Right.W, PanelCols)
	}
	if l.Left.X != l.Group.X {
		t.Errorf("HOLD panel should start the group: %+v vs %+v", l.Left, l.Group)
	}
	if l.Board.X != l.Left.Right()+Gap {
		t.Errorf("board should follow the left panel by one gap: board.X=%d left.Right=%d", l.Board.X, l.Left.Right())
	}
	if l.Right.X != l.Board.Right()+Gap {
		t.Errorf("NEXT panel should follow the board by one gap: right.X=%d board.Right=%d", l.Right.X, l.Board.Right())
	}
	if l.Right.Right() != l.Group.Right() {
		t.Errorf("NEXT panel should end the group: %d vs %d", l.Right.Right(), l.Group.Right())
	}
}

func TestChromeTextAreaFitsTheSpecLines(t *testing.T) {
	// §4's controls line is 61 columns and its mission line about 40. The text
	// area has to hold them at large size, and stay inside the frame at every
	// size.
	for _, d := range [][2]int{{40, 24}, {60, 26}, {80, 30}, {200, 60}} {
		l := Compute(d[0], d[1])
		if l.TextX < l.Content.X || l.TextX+l.TextW-1 > l.Content.Right() {
			t.Errorf("Compute%v: text area %d..%d escapes the frame %+v", d, l.TextX, l.TextX+l.TextW-1, l.Content)
		}
		if l.TextW <= 0 {
			t.Errorf("Compute%v: TextW = %d", d, l.TextW)
		}
	}
	if got := Compute(80, 30).TextW; got < 61 {
		t.Errorf("large TextW = %d, want at least 61 for §4's controls line", got)
	}
	if got := Compute(60, 26).TextW; got < 40 {
		t.Errorf("medium TextW = %d, want at least 40 for the mission-control line", got)
	}
}

func TestGroupStaysInsideTheFrame(t *testing.T) {
	for _, d := range [][2]int{{40, 24}, {56, 26}, {72, 28}, {120, 45}} {
		l := Compute(d[0], d[1])
		if !containsRect(l.Content, l.Group) {
			t.Errorf("Compute%v: group %+v escapes frame %+v", d, l.Group, l.Content)
		}
		if !containsRect(l.Content, l.Board) {
			t.Errorf("Compute%v: board %+v escapes frame %+v", d, l.Board, l.Content)
		}
		if l.Content.X < 0 || l.Content.Y < 0 || l.Content.Right() >= d[0] || l.Content.Bottom() >= d[1] {
			t.Errorf("Compute%v: frame %+v escapes the terminal", d, l.Content)
		}
	}
}

func TestLargeLayoutRows(t *testing.T) {
	l := Compute(80, 30)
	top := l.Content.Y
	if l.TitleRow != top || !l.TitleBorder {
		t.Errorf("large: TitleRow=%d TitleBorder=%v, want %d/true", l.TitleRow, l.TitleBorder, top)
	}
	if l.Board.Y != top+2 {
		t.Errorf("large: board Y = %d, want %d", l.Board.Y, top+2)
	}
	if l.MissionRow != top+25 || l.ControlsRow != top+26 {
		t.Errorf("large: mission=%d controls=%d, want %d/%d", l.MissionRow, l.ControlsRow, top+25, top+26)
	}
	if l.NextCount != 5 || !l.ShowLabels {
		t.Errorf("large: NextCount=%d ShowLabels=%v, want 5/true", l.NextCount, l.ShowLabels)
	}
	if l.Left.Y != l.Board.Y || l.Left.H != BoxRows {
		t.Errorf("panels should span the board rows: left=%+v board=%+v", l.Left, l.Board)
	}
}

func TestMediumLayoutDropsTheTitleBorder(t *testing.T) {
	l := Compute(60, 26)
	if l.Content.W != 48 || l.Content.H != 26 {
		t.Fatalf("medium frame = %dx%d, want 48x26", l.Content.W, l.Content.H)
	}
	if l.Group.W != 35 {
		t.Errorf("medium group = %d cols, want 35", l.Group.W)
	}
	if l.Left.W != 0 {
		t.Errorf("medium should have no left panel, got %+v", l.Left)
	}
	if l.Board.X != l.Group.X {
		t.Errorf("medium: board should start the group, got %+v vs %+v", l.Board, l.Group)
	}
	if l.Right.X != l.Board.Right()+Gap || l.Right.W != PanelCols {
		t.Errorf("medium panel = %+v, want %d cols one gap right of the board", l.Right, PanelCols)
	}
	top := l.Content.Y
	if l.TitleRow != top || l.TitleBorder {
		t.Errorf("medium: TitleRow=%d TitleBorder=%v, want %d/false (§49.3)", l.TitleRow, l.TitleBorder, top)
	}
	if l.Board.Y != top+1 || l.MissionRow != top+24 || l.ControlsRow != top+25 {
		t.Errorf("medium rows: board=%d mission=%d controls=%d", l.Board.Y, l.MissionRow, l.ControlsRow)
	}
	if l.NextCount != 5 || !l.ShowLabels {
		t.Errorf("medium: NextCount=%d ShowLabels=%v, want 5/true", l.NextCount, l.ShowLabels)
	}
}

func TestSmallLayoutDropsMissionControlAndLabels(t *testing.T) {
	l := Compute(40, 24)
	if l.Content.W != 32 || l.Content.H != 23 {
		t.Fatalf("small frame = %dx%d, want 32x23", l.Content.W, l.Content.H)
	}
	if l.Group.W != 32 || l.Group.X != l.Content.X {
		t.Errorf("small: frame and group should coincide horizontally, got %+v vs %+v", l.Group, l.Content)
	}
	if l.TitleRow != -1 || l.MissionRow != -1 {
		t.Errorf("small should drop title and mission control (§49.3), got title=%d mission=%d", l.TitleRow, l.MissionRow)
	}
	if l.Board.Y != l.Content.Y {
		t.Errorf("small: board should start at the top of the group, got %+v", l.Board)
	}
	if l.ControlsRow != l.Content.Y+22 {
		t.Errorf("small: controls row = %d, want %d", l.ControlsRow, l.Content.Y+22)
	}
	if l.NextCount != 3 {
		t.Errorf("small: NextCount = %d, want 3 (§49.3)", l.NextCount)
	}
	if l.ShowLabels {
		t.Error("small: stat labels should be dropped (§49.3)")
	}
	if l.Right.W != SmallPanelCols || l.Right.X != l.Board.Right()+Gap {
		t.Errorf("small: NEXT panel must sit beside the board, never above or below it (§49.3): %+v", l.Right)
	}
}

func TestSmallLayoutHasNoStatLabelItems(t *testing.T) {
	l := Compute(40, 24)
	for _, it := range l.Items {
		switch it.Kind {
		case ItemScoreLabel, ItemLinesLabel, ItemLevelLabel:
			t.Errorf("small layout emitted %v", it.Kind)
		}
	}
	want := map[ItemKind]int{ItemNextLabel: 1, ItemNextPreview: 3, ItemScoreValue: 1, ItemLinesValue: 1, ItemLevelValue: 1, ItemHoldLabel: 1, ItemHoldPreview: 1}
	got := map[ItemKind]int{}
	for _, it := range l.Items {
		got[it.Kind]++
	}
	for k, n := range want {
		if got[k] != n {
			t.Errorf("small layout has %d × %v, want %d", got[k], k, n)
		}
	}
}

func TestNextPreviewsAreOrderedAndSpaced(t *testing.T) {
	for _, d := range [][2]int{{80, 30}, {60, 26}, {40, 24}} {
		l := Compute(d[0], d[1])
		var prev *Item
		n := 0
		for i := range l.Items {
			it := l.Items[i]
			if it.Kind != ItemNextPreview {
				continue
			}
			if it.Index != n {
				t.Errorf("Compute%v: NEXT preview #%d has Index %d", d, n, it.Index)
			}
			if prev != nil && it.Y < prev.Y+PreviewRows {
				t.Errorf("Compute%v: NEXT previews %d and %d overlap (%d, %d)", d, n-1, n, prev.Y, it.Y)
			}
			if it.W < PreviewCols {
				t.Errorf("Compute%v: NEXT preview #%d has %d cols, need %d", d, n, it.W, PreviewCols)
			}
			prev = &l.Items[i]
			n++
		}
		if n != l.NextCount {
			t.Errorf("Compute%v: %d preview items for NextCount %d", d, n, l.NextCount)
		}
	}
}

// §41: nothing overlaps. Every HUD item must live inside a panel rect, and no
// item may touch the board.
func TestHUDItemsStayInsidePanelsAndOffTheBoard(t *testing.T) {
	for _, d := range [][2]int{{40, 24}, {56, 26}, {72, 28}, {100, 40}, {200, 60}} {
		l := Compute(d[0], d[1])
		for _, it := range l.Items {
			h := 1
			if it.Kind == ItemHoldPreview || it.Kind == ItemNextPreview {
				h = PreviewRows
			}
			box := Rect{X: it.X, Y: it.Y, W: it.W, H: h}
			inPanel := containsRect(l.Left, box) || containsRect(l.Right, box)
			if !inPanel {
				t.Errorf("Compute%v: item %v at %+v is outside both panels (left=%+v right=%+v)", d, it.Kind, box, l.Left, l.Right)
			}
			if overlaps(box, l.Board) {
				t.Errorf("Compute%v: item %v at %+v overlaps the board %+v", d, it.Kind, box, l.Board)
			}
		}
	}
}

func containsRect(outer, inner Rect) bool {
	if outer.W == 0 || outer.H == 0 {
		return false
	}
	return inner.X >= outer.X && inner.Y >= outer.Y &&
		inner.Right() <= outer.Right() && inner.Bottom() <= outer.Bottom()
}

func overlaps(a, b Rect) bool {
	if a.W == 0 || a.H == 0 || b.W == 0 || b.H == 0 {
		return false
	}
	return a.X <= b.Right() && b.X <= a.Right() && a.Y <= b.Bottom() && b.Y <= a.Bottom()
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestTier|TestLarge|TestMedium|TestSmall|TestBoardIs|TestNextPreviews|TestHUD|TestTooSmall' -v`
Expected: FAIL — `undefined: Compute`.

- [ ] **Step 3: Write the implementation**

Create `internal/render/layout.go`:

```go
package render

import "cosmic-tetris/internal/game"

// Geometry, in terminal cells (§5, §49.3).
const (
	BoardCols = game.BoardWidth * CellCols // 20: the play area
	BoardRows = game.VisibleRows           // 20
	BoxCols   = BoardCols + 2              // 22: play area plus border
	BoxRows   = BoardRows + 2              // 22

	PanelCols      = 12 // HOLD / NEXT / stats panel
	SmallPanelCols = 9  // the narrow panel at small sizes
	Gap            = 1  // between columns
	PreviewCols    = 8  // a 4-cell-wide piece preview
	PreviewRows    = 2

	MinCols = 40 // §31 minimum usable target
	MinRows = 24
)

// Rect is a half-open-free rectangle: X..Right() and Y..Bottom() inclusive.
type Rect struct{ X, Y, W, H int }

func (r Rect) Right() int  { return r.X + r.W - 1 }
func (r Rect) Bottom() int { return r.Y + r.H - 1 }

func (r Rect) Contains(x, y int) bool {
	return x >= r.X && y >= r.Y && x <= r.Right() && y <= r.Bottom()
}

// Tier is which of §31's layouts fits the terminal.
type Tier int

const (
	TierTooSmall Tier = iota
	TierSmall
	TierMedium
	TierLarge
)

func (t Tier) String() string {
	switch t {
	case TierSmall:
		return "small"
	case TierMedium:
		return "medium"
	case TierLarge:
		return "large"
	default:
		return "too-small"
	}
}

// ItemKind names one HUD element.
type ItemKind int

const (
	ItemHoldLabel ItemKind = iota
	ItemHoldPreview
	ItemNextLabel
	ItemNextPreview
	ItemScoreLabel
	ItemScoreValue
	ItemLinesLabel
	ItemLinesValue
	ItemLevelLabel
	ItemLevelValue
)

func (k ItemKind) String() string {
	return [...]string{
		"hold-label", "hold-preview", "next-label", "next-preview",
		"score-label", "score-value", "lines-label", "lines-value",
		"level-label", "level-value",
	}[k]
}

// Item is one HUD element placed at absolute terminal coordinates. Index
// distinguishes NEXT previews; W is the space the element may use.
type Item struct {
	Kind  ItemKind
	Index int
	X, Y  int
	W     int
}

// Layout is a complete frame plan. Rows are absolute terminal rows; -1 means
// the element was dropped for lack of height (§49.3).
type Layout struct {
	Tier          Tier
	Width, Height int  // the terminal it was computed for
	Content       Rect // the whole frame, centred in the terminal
	Group         Rect // the column group (panels + board), centred in the frame

	Board Rect // the bordered box
	Play  Rect // its interior

	Left  Rect // HOLD/stats panel; zero-width when there isn't one
	Right Rect // NEXT (and, at medium and below, everything else)

	TextX, TextW int // the chrome text area: title, mission control, controls

	TitleRow    int
	TitleBorder bool // draw the title as a box around Content (large only)
	MissionRow  int
	ControlsRow int

	NextCount  int  // upcoming pieces to draw: 5, or 3 at small sizes
	ShowLabels bool // SCORE/LINES/LEVEL labels, dropped first at small sizes

	Items []Item
}

// Compute plans a frame for a w×h terminal. It never panics and never returns
// negative geometry, whatever the terminal claims its size is.
func Compute(w, h int) Layout {
	l := Layout{Width: w, Height: h, TitleRow: -1, MissionRow: -1, ControlsRow: -1}
	if w < MinCols || h < MinRows {
		l.Tier = TierTooSmall
		return l
	}

	// frameW/frameH is the box the chrome lives in; groupW is the column group
	// centred inside it. The frame is wider than the group so §4's chrome lines
	// fit; textPad is the frame's inner margin for those lines.
	var frameW, frameH, groupW, textPad int
	switch {
	case w >= 72 && h >= 28:
		l.Tier = TierLarge
		frameW, frameH, groupW, textPad = 68, 28, PanelCols+Gap+BoxCols+Gap+PanelCols, 2
	case w >= 56 && h >= 26:
		l.Tier = TierMedium
		frameW, frameH, groupW, textPad = 48, 26, BoxCols+Gap+PanelCols, 1
	default:
		l.Tier = TierSmall
		frameW, frameH, groupW, textPad = 32, 23, BoxCols+Gap+SmallPanelCols, 0
	}
	l.Content = Rect{X: (w - frameW) / 2, Y: (h - frameH) / 2, W: frameW, H: frameH}
	l.TextX, l.TextW = l.Content.X+textPad, frameW-2*textPad

	gx := l.Content.X + (frameW-groupW)/2
	oy := l.Content.Y
	switch l.Tier {
	case TierLarge:
		l.Group = Rect{X: gx, Y: oy + 2, W: groupW, H: BoxRows}
		l.Left = Rect{X: gx, Y: oy + 2, W: PanelCols, H: BoxRows}
		l.Board = Rect{X: l.Left.Right() + Gap, Y: oy + 2, W: BoxCols, H: BoxRows}
		l.Right = Rect{X: l.Board.Right() + Gap, Y: oy + 2, W: PanelCols, H: BoxRows}
		l.TitleRow, l.TitleBorder = oy, true
		l.MissionRow, l.ControlsRow = oy+25, oy+26
		l.NextCount, l.ShowLabels = 5, true
	case TierMedium:
		l.Group = Rect{X: gx, Y: oy + 1, W: groupW, H: BoxRows}
		l.Board = Rect{X: gx, Y: oy + 1, W: BoxCols, H: BoxRows}
		l.Right = Rect{X: l.Board.Right() + Gap, Y: oy + 1, W: PanelCols, H: BoxRows}
		l.TitleRow = oy
		l.MissionRow, l.ControlsRow = oy+24, oy+25
		l.NextCount, l.ShowLabels = 5, true
	default:
		l.Group = Rect{X: gx, Y: oy, W: groupW, H: BoxRows}
		l.Board = Rect{X: gx, Y: oy, W: BoxCols, H: BoxRows}
		l.Right = Rect{X: l.Board.Right() + Gap, Y: oy, W: SmallPanelCols, H: BoxRows}
		l.ControlsRow = oy + 22
		l.NextCount, l.ShowLabels = 3, false
	}
	l.Play = Rect{X: l.Board.X + 1, Y: l.Board.Y + 1, W: BoardCols, H: BoardRows}
	l.Items = items(l)
	return l
}

// items places the HUD elements. Every row offset below is relative to the top
// of the panel, which is the top of the board box; the totals are chosen so the
// last element lands on or above the panel's final row.
func items(l Layout) []Item {
	// One column of padding inside a wide panel; the narrow panel pads only on
	// the left, because a preview needs all 8 remaining columns.
	wide := PanelCols - 2
	narrow := SmallPanelCols - 1

	var out []Item
	add := func(k ItemKind, idx, x, y, w int) {
		out = append(out, Item{Kind: k, Index: idx, X: x, Y: y, W: w})
	}

	switch l.Tier {
	case TierLarge:
		lx, rx := l.Left.X+1, l.Right.X+1
		top := l.Board.Y
		add(ItemHoldLabel, 0, lx, top, wide)
		add(ItemHoldPreview, 0, lx, top+2, wide)
		add(ItemScoreLabel, 0, lx, top+5, wide)
		add(ItemScoreValue, 0, lx, top+6, wide)
		add(ItemLinesLabel, 0, lx, top+8, wide)
		add(ItemLinesValue, 0, lx, top+9, wide)
		add(ItemLevelLabel, 0, lx, top+11, wide)
		add(ItemLevelValue, 0, lx, top+12, wide)
		add(ItemNextLabel, 0, rx, top, wide)
		for i := 0; i < l.NextCount; i++ {
			add(ItemNextPreview, i, rx, top+2+3*i, wide)
		}
	case TierMedium:
		rx, top := l.Right.X+1, l.Board.Y
		add(ItemHoldLabel, 0, rx, top, wide)
		add(ItemHoldPreview, 0, rx, top+1, wide)
		add(ItemNextLabel, 0, rx, top+4, wide)
		for i := 0; i < l.NextCount; i++ {
			add(ItemNextPreview, i, rx, top+5+2*i, wide)
		}
		add(ItemScoreLabel, 0, rx, top+16, wide)
		add(ItemScoreValue, 0, rx, top+17, wide)
		add(ItemLinesLabel, 0, rx, top+18, wide)
		add(ItemLinesValue, 0, rx, top+19, wide)
		add(ItemLevelLabel, 0, rx, top+20, wide)
		add(ItemLevelValue, 0, rx, top+21, wide)
	case TierSmall:
		rx, top := l.Right.X+1, l.Board.Y
		add(ItemNextLabel, 0, rx, top, narrow)
		for i := 0; i < l.NextCount; i++ {
			add(ItemNextPreview, i, rx, top+2+3*i, narrow)
		}
		add(ItemScoreValue, 0, rx, top+11, narrow)
		add(ItemLinesValue, 0, rx, top+12, narrow)
		add(ItemLevelValue, 0, rx, top+13, narrow)
		add(ItemHoldLabel, 0, rx, top+15, narrow)
		add(ItemHoldPreview, 0, rx, top+16, narrow)
	}
	return out
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v && go vet ./...`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/layout.go internal/render/layout_test.go
git commit -m "feat(render): adaptive layout tiers as a placed display list"
```

---

### Task 4: The board — border, locked cells, ghost, active piece

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: `Canvas`, `Cell` (Task 1); `GlyphSet`, `Palette`, `CellCols` (Task 2); `Layout`, `Rect` (Task 3); `game.Board`, `game.Piece`, `game.Cell`, `game.HiddenRows`, `game.BoardWidth`, `game.BoardHeight` and `Piece.Cells()` (Phase 1 Tasks 1–3).
- Produces: `type BoardView struct { Board game.Board; Active, Ghost game.Piece; ShowActive, ShowGhost bool }`; `func DrawBoard(c *Canvas, l Layout, v BoardView, gs GlyphSet, p Palette)`; `func BoardCellOrigin(l Layout, bx, by int) (x, y int, visible bool)`.

**Design — the view is a value copy.** `BoardView` holds a copy of the board and the two pieces rather than a `*game.Game`, so §37's "the rendering process must not mutate game state" is enforced by the type system rather than by discipline. A `game.Board` is 220 bytes; copying one per frame is free next to writing to a terminal.

**Draw order is §37's, steps 3–5, and it is what makes the two obscuring rules hold:** locked cells first; then ghost cells, skipped wherever the board is already occupied (§10: "must never obscure locked blocks"); then the active piece, which paints over any ghost cell it shares (§44: "never obscure the active piece").

- [ ] **Step 1: Write the failing test**

Create `internal/render/board_test.go`:

```go
package render

import (
	"strings"
	"testing"

	"cosmic-tetris/internal/game"
)

// glyphAt reads the two-column glyph drawn for board cell (bx, by).
func glyphAt(t *testing.T, c *Canvas, l Layout, bx, by int) string {
	t.Helper()
	x, y, visible := BoardCellOrigin(l, bx, by)
	if !visible {
		t.Fatalf("board cell (%d,%d) is not visible", bx, by)
	}
	return string([]rune{c.At(x, y).Rune, c.At(x+1, y).Rune})
}

func drawTestBoard(v BoardView, m Mode) (*Canvas, Layout) {
	l := Compute(80, 30)
	c := NewCanvas(80, 30)
	DrawBoard(c, l, v, GlyphsFor(m), PaletteFor(m))
	return c, l
}

func TestBoardBorderIsTheDoubleBox(t *testing.T) {
	c, l := drawTestBoard(BoardView{}, ModeFull)
	if got := c.At(l.Board.X, l.Board.Y).Rune; got != '╔' {
		t.Errorf("top-left border rune = %q, want ╔", got)
	}
	if got := c.At(l.Board.Right(), l.Board.Y).Rune; got != '╗' {
		t.Errorf("top-right border rune = %q, want ╗", got)
	}
	if got := c.At(l.Board.X, l.Board.Bottom()).Rune; got != '╚' {
		t.Errorf("bottom-left border rune = %q, want ╚", got)
	}
	if got := c.At(l.Board.Right(), l.Board.Bottom()).Rune; got != '╝' {
		t.Errorf("bottom-right border rune = %q, want ╝", got)
	}
	for x := l.Board.X + 1; x < l.Board.Right(); x++ {
		if c.At(x, l.Board.Y).Rune != '═' {
			t.Fatalf("top border has a gap at x=%d", x)
		}
	}
	for y := l.Board.Y + 1; y < l.Board.Bottom(); y++ {
		if c.At(l.Board.X, y).Rune != '║' || c.At(l.Board.Right(), y).Rune != '║' {
			t.Fatalf("side border has a gap at y=%d", y)
		}
	}
}

func TestEmptyBoardInteriorIsBlank(t *testing.T) {
	c, l := drawTestBoard(BoardView{}, ModeFull)
	for by := game.HiddenRows; by < game.BoardHeight; by++ {
		for bx := 0; bx < game.BoardWidth; bx++ {
			if got := glyphAt(t, c, l, bx, by); got != "  " {
				t.Fatalf("empty cell (%d,%d) = %q, want two spaces", bx, by, got)
			}
		}
	}
}

func TestLockedCellsUseTheBlockGlyphAndLockedColor(t *testing.T) {
	var v BoardView
	v.Board.Set(3, 21, game.CellOf(game.KindT))
	c, l := drawTestBoard(v, ModeFull)
	if got := glyphAt(t, c, l, 3, 21); got != "██" {
		t.Errorf("locked cell = %q, want ██", got)
	}
	x, y, _ := BoardCellOrigin(l, 3, 21)
	p := PaletteFor(ModeFull)
	cell := c.At(x, y)
	if cell.FG != p.PieceLock[game.KindT] {
		t.Error("locked cell should use the locked variant of the T color")
	}
	if cell.Bold {
		t.Error("locked cells are not bold; only the active piece is (§49.4)")
	}
}

func TestActivePieceIsOneStepBrighterThanLocked(t *testing.T) {
	var v BoardView
	v.Board.Set(0, 21, game.CellOf(game.KindI))
	v.Active = game.Piece{Kind: game.KindI, Rotation: 0, X: 3, Y: 10}
	v.ShowActive = true
	c, l := drawTestBoard(v, ModeFull)
	p := PaletteFor(ModeFull)

	var active Cell
	for _, off := range v.Active.Cells() {
		x, y, visible := BoardCellOrigin(l, v.Active.X+off[0], v.Active.Y+off[1])
		if !visible {
			continue
		}
		active = c.At(x, y)
	}
	if active.Rune == 0 {
		t.Fatal("the active piece was not drawn")
	}
	if active.FG != p.Piece[game.KindI] || !active.Bold {
		t.Error("active cells should use the bright piece color and bold (§49.4)")
	}

	lx, ly, _ := BoardCellOrigin(l, 0, 21)
	if locked := c.At(lx, ly); locked.Bold || locked.FG == active.FG {
		t.Error("locked cells must be dimmer than the active piece")
	}
}

func TestGhostNeverOverwritesLockedCells(t *testing.T) {
	// An O piece hovering over a stack; the ghost lands on row 20-21 where
	// column 4 is already occupied by a locked cell.
	var v BoardView
	v.Board.Set(4, 21, game.CellOf(game.KindZ))
	v.Active = game.Piece{Kind: game.KindO, Rotation: 0, X: 3, Y: 5}
	v.Ghost = game.Piece{Kind: game.KindO, Rotation: 0, X: 3, Y: 19}
	v.ShowActive, v.ShowGhost = true, true
	c, l := drawTestBoard(v, ModeFull)

	if got := glyphAt(t, c, l, 4, 21); got != "██" {
		t.Errorf("locked cell under the ghost = %q, want ██ (§10)", got)
	}
	x, y, _ := BoardCellOrigin(l, 4, 21)
	if c.At(x, y).FG != PaletteFor(ModeFull).PieceLock[game.KindZ] {
		t.Error("the ghost painted over a locked cell (§10)")
	}
}

func TestActivePieceDrawsOverItsOwnGhost(t *testing.T) {
	// A piece already resting on the floor: ghost and active coincide exactly.
	v := BoardView{
		Active:     game.Piece{Kind: game.KindO, Rotation: 0, X: 3, Y: 20},
		Ghost:      game.Piece{Kind: game.KindO, Rotation: 0, X: 3, Y: 20},
		ShowActive: true, ShowGhost: true,
	}
	c, l := drawTestBoard(v, ModeFull)
	if got := glyphAt(t, c, l, 4, 21); got != "██" {
		t.Errorf("cell under a resting piece = %q, want ██ not ░░ (§44)", got)
	}
	x, y, _ := BoardCellOrigin(l, 4, 21)
	if !c.At(x, y).Bold {
		t.Error("the active piece should still be the bright layer when it coincides with its ghost")
	}
}

func TestGhostUsesTheGhostGlyphAndColor(t *testing.T) {
	v := BoardView{
		Active:     game.Piece{Kind: game.KindO, Rotation: 0, X: 3, Y: 6},
		Ghost:      game.Piece{Kind: game.KindO, Rotation: 0, X: 3, Y: 20},
		ShowActive: true, ShowGhost: true,
	}
	c, l := drawTestBoard(v, ModeFull)
	if got := glyphAt(t, c, l, 4, 21); got != "░░" {
		t.Errorf("ghost cell = %q, want ░░ (§49.4)", got)
	}
	x, y, _ := BoardCellOrigin(l, 4, 21)
	if c.At(x, y).FG != PaletteFor(ModeFull).Ghost {
		t.Error("ghost cells should use the ghost color")
	}
}

func TestHiddenSpawnRowsAreNeverDrawn(t *testing.T) {
	var v BoardView
	for by := 0; by < game.HiddenRows; by++ {
		for bx := 0; bx < game.BoardWidth; bx++ {
			v.Board.Set(bx, by, game.CellOf(game.KindS))
		}
	}
	v.Active = game.Piece{Kind: game.KindI, Rotation: 0, X: 3, Y: 0}
	v.ShowActive = true
	c, l := drawTestBoard(v, ModeFull)

	for by := 0; by < game.HiddenRows; by++ {
		if _, _, visible := BoardCellOrigin(l, 0, by); visible {
			t.Fatalf("board row %d should not be visible", by)
		}
	}
	interior := 0
	for y := l.Play.Y; y <= l.Play.Bottom(); y++ {
		for x := l.Play.X; x <= l.Play.Right(); x++ {
			if c.At(x, y).Rune != 0 {
				interior++
			}
		}
	}
	if interior != 0 {
		t.Errorf("%d cells drawn inside the play area, want 0: hidden rows must stay hidden", interior)
	}
	if strings.Contains(c.Plain(), "██") {
		t.Error("hidden-row content leaked into the frame")
	}
}

func TestASCIIModeDrawsBracketsAndDots(t *testing.T) {
	var v BoardView
	v.Board.Set(0, 21, game.CellOf(game.KindL))
	v.Active = game.Piece{Kind: game.KindO, Rotation: 0, X: 3, Y: 6}
	v.Ghost = game.Piece{Kind: game.KindO, Rotation: 0, X: 3, Y: 20}
	v.ShowActive, v.ShowGhost = true, true
	c, l := drawTestBoard(v, ModeASCII)
	if got := glyphAt(t, c, l, 0, 21); got != "[]" {
		t.Errorf("ASCII locked cell = %q, want []", got)
	}
	if got := glyphAt(t, c, l, 4, 21); got != "··" {
		t.Errorf("ASCII ghost cell = %q, want ·· (§49.4)", got)
	}
	if got := c.At(l.Board.X, l.Board.Y).Rune; got != '+' {
		t.Errorf("ASCII border corner = %q, want +", got)
	}
}

func TestDrawBoardIsANoOpForATooSmallLayout(t *testing.T) {
	l := Compute(20, 10)
	c := NewCanvas(20, 10)
	var v BoardView
	v.Board.Set(0, 21, game.CellOf(game.KindI))
	v.ShowActive = true
	DrawBoard(c, l, v, GlyphsFor(ModeFull), PaletteFor(ModeFull))
	if c.Plain() != strings.Repeat("\n", 9) {
		t.Errorf("DrawBoard drew something for a too-small layout: %q", c.Plain())
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestBoard|TestEmpty|TestLocked|TestActive|TestGhost|TestHidden|TestASCIIMode|TestDrawBoard' -v`
Expected: FAIL — `undefined: DrawBoard`.

- [ ] **Step 3: Write the implementation**

Create `internal/render/board.go`:

```go
package render

import (
	"image/color"

	"cosmic-tetris/internal/game"
)

// BoardView is everything the board drawing needs, by value. Copying keeps the
// renderer structurally incapable of mutating game state (§37).
type BoardView struct {
	Board  game.Board
	Active game.Piece
	Ghost  game.Piece

	ShowActive bool
	ShowGhost  bool
}

// BoardCellOrigin maps a board coordinate to the canvas column and row of the
// cell's left half. Cells in the hidden spawn rows report visible == false.
func BoardCellOrigin(l Layout, bx, by int) (x, y int, visible bool) {
	if l.Tier == TierTooSmall {
		return 0, 0, false
	}
	if by < game.HiddenRows || by >= game.BoardHeight || bx < 0 || bx >= game.BoardWidth {
		return 0, 0, false
	}
	return l.Play.X + bx*CellCols, l.Play.Y + (by - game.HiddenRows), true
}

// DrawBoard draws §37 steps 3–7 except the FX composite: border, locked cells,
// ghost, active piece.
func DrawBoard(c *Canvas, l Layout, v BoardView, gs GlyphSet, p Palette) {
	if l.Tier == TierTooSmall {
		return
	}
	drawBoardFrame(c, l, gs, p)

	for by := game.HiddenRows; by < game.BoardHeight; by++ {
		for bx := 0; bx < game.BoardWidth; bx++ {
			if cell := v.Board.At(bx, by); cell.Filled() {
				drawBoardCell(c, l, bx, by, gs.Block, p.PieceLock[cell.Kind()], false)
			}
		}
	}

	// The ghost goes under everything else: skip any cell the stack owns (§10).
	if v.ShowGhost {
		for _, off := range v.Ghost.Cells() {
			bx, by := v.Ghost.X+off[0], v.Ghost.Y+off[1]
			if bx < 0 || bx >= game.BoardWidth || by < 0 || by >= game.BoardHeight {
				continue
			}
			if v.Board.At(bx, by).Filled() {
				continue
			}
			drawBoardCell(c, l, bx, by, gs.Ghost, p.Ghost, false)
		}
	}

	// The active piece paints last and brightest, so nothing can obscure it (§44).
	if v.ShowActive {
		for _, off := range v.Active.Cells() {
			bx, by := v.Active.X+off[0], v.Active.Y+off[1]
			drawBoardCell(c, l, bx, by, gs.Block, p.Piece[v.Active.Kind], true)
		}
	}
}

func drawBoardCell(c *Canvas, l Layout, bx, by int, glyph string, fg color.Color, bold bool) {
	x, y, visible := BoardCellOrigin(l, bx, by)
	if !visible {
		return
	}
	c.SetString(x, y, glyph, fg, bold)
}

func drawBoardFrame(c *Canvas, l Layout, gs GlyphSet, p Palette) {
	b := l.Board
	c.SetString(b.X, b.Y, gs.BoardTL, p.Border, false)
	c.SetString(b.Right(), b.Y, gs.BoardTR, p.Border, false)
	c.SetString(b.X, b.Bottom(), gs.BoardBL, p.Border, false)
	c.SetString(b.Right(), b.Bottom(), gs.BoardBR, p.Border, false)
	for x := b.X + 1; x < b.Right(); x++ {
		c.SetString(x, b.Y, gs.BoardH, p.Border, false)
		c.SetString(x, b.Bottom(), gs.BoardH, p.Border, false)
	}
	for y := b.Y + 1; y < b.Bottom(); y++ {
		c.SetString(b.X, y, gs.BoardV, p.Border, false)
		c.SetString(b.Right(), y, gs.BoardV, p.Border, false)
	}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v && go vet ./...`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): draw the board frame, locked cells, ghost, and active piece"
```

---

### Task 5: HOLD, NEXT, and the stat panels

**Files:**
- Create: `internal/render/hud.go`
- Test: `internal/render/hud_test.go`

**Interfaces:**
- Consumes: `Canvas` (Task 1); `GlyphSet`, `Palette`, `CellCols` (Task 2); `Layout`, `Item`, `ItemKind`, `PreviewCols`, `PreviewRows` (Task 3); `game.PieceKind`, `game.Piece.Cells()` (Phase 1).
- Produces: `type HUDView struct { Hold *game.PieceKind; Next []game.PieceKind; Score, Lines, Level int }`; `func DrawHUD(c *Canvas, l Layout, v HUDView, gs GlyphSet, p Palette)`; `func FormatScore(int) string`; `func FormatLines(int) string`; `func FormatLevel(int) string`; `func PreviewShape(game.PieceKind) (cells [][2]int, w, h int)`.

**Design — `DrawHUD` walks `Layout.Items` and knows nothing about tiers.** Each item kind has one drawing rule; where the item goes and whether it exists at all was decided in Task 3. `NextCount` items exist, so a short `Next` slice simply draws fewer previews and never indexes past the end.

**Value formats,** from the §4 mockup: score `00129340` (8 digits, zero-padded), lines `042` (3), level `07` (2). Longer values grow rather than wrap, and are clipped to the item width so nothing spills out of its panel.

- [ ] **Step 1: Write the failing test**

Create `internal/render/hud_test.go`:

```go
package render

import (
	"strings"
	"testing"

	"cosmic-tetris/internal/game"
)

func textAt(c *Canvas, x, y, n int) string {
	rs := make([]rune, 0, n)
	for i := 0; i < n; i++ {
		r := c.At(x+i, y).Rune
		if r == 0 {
			r = ' '
		}
		rs = append(rs, r)
	}
	return string(rs)
}

func itemOf(t *testing.T, l Layout, k ItemKind, index int) Item {
	t.Helper()
	for _, it := range l.Items {
		if it.Kind == k && it.Index == index {
			return it
		}
	}
	t.Fatalf("layout has no %v #%d", k, index)
	return Item{}
}

func drawTestHUD(v HUDView, w, h int, m Mode) (*Canvas, Layout) {
	l := Compute(w, h)
	c := NewCanvas(w, h)
	DrawHUD(c, l, v, GlyphsFor(m), PaletteFor(m))
	return c, l
}

func TestValueFormats(t *testing.T) {
	if got := FormatScore(129340); got != "00129340" {
		t.Errorf("FormatScore(129340) = %q, want %q", got, "00129340")
	}
	if got := FormatScore(0); got != "00000000" {
		t.Errorf("FormatScore(0) = %q, want 8 zeroes", got)
	}
	if got := FormatScore(123456789); got != "123456789" {
		t.Errorf("FormatScore(123456789) = %q: long scores grow, they do not truncate", got)
	}
	if got := FormatLines(42); got != "042" {
		t.Errorf("FormatLines(42) = %q, want %q", got, "042")
	}
	if got := FormatLevel(7); got != "07" {
		t.Errorf("FormatLevel(7) = %q, want %q", got, "07")
	}
	if got := FormatLevel(13); got != "13" {
		t.Errorf("FormatLevel(13) = %q, want %q", got, "13")
	}
}

func TestLabelsAreDrawnAtLargeSize(t *testing.T) {
	c, l := drawTestHUD(HUDView{}, 80, 30, ModeFull)
	for _, tc := range []struct {
		kind ItemKind
		want string
	}{
		{ItemHoldLabel, "HOLD"},
		{ItemNextLabel, "NEXT"},
		{ItemScoreLabel, "SCORE"},
		{ItemLinesLabel, "LINES"},
		{ItemLevelLabel, "LEVEL"},
	} {
		it := itemOf(t, l, tc.kind, 0)
		if got := strings.TrimRight(textAt(c, it.X, it.Y, len(tc.want)), " "); got != tc.want {
			t.Errorf("%v = %q, want %q", tc.kind, got, tc.want)
		}
	}
}

func TestStatValuesAreDrawn(t *testing.T) {
	v := HUDView{Score: 129340, Lines: 42, Level: 7}
	c, l := drawTestHUD(v, 80, 30, ModeFull)
	for _, tc := range []struct {
		kind ItemKind
		want string
	}{
		{ItemScoreValue, "00129340"},
		{ItemLinesValue, "042"},
		{ItemLevelValue, "07"},
	} {
		it := itemOf(t, l, tc.kind, 0)
		if got := textAt(c, it.X, it.Y, len(tc.want)); got != tc.want {
			t.Errorf("%v = %q, want %q", tc.kind, got, tc.want)
		}
	}
}

func TestSmallLayoutDrawsValuesWithoutLabels(t *testing.T) {
	v := HUDView{Score: 1, Lines: 2, Level: 3}
	c, l := drawTestHUD(v, 40, 24, ModeFull)
	it := itemOf(t, l, ItemScoreValue, 0)
	if got := textAt(c, it.X, it.Y, 8); got != "00000001" {
		t.Errorf("small score = %q, want %q", got, "00000001")
	}
	if strings.Contains(c.Plain(), "SCORE") || strings.Contains(c.Plain(), "LINES") {
		t.Error("small layout should draw values without stat labels (§49.3)")
	}
	if !strings.Contains(c.Plain(), "NEXT") {
		t.Error("the NEXT label survives at small sizes; only stat labels are dropped")
	}
}

func TestOversizedValuesAreClippedToTheirItem(t *testing.T) {
	v := HUDView{Score: 999999999999, Lines: 999999, Level: 4321}
	c, l := drawTestHUD(v, 40, 24, ModeFull)
	it := itemOf(t, l, ItemScoreValue, 0)
	// Nothing may appear to the right of the item's own width.
	if got := c.At(it.X+it.W, it.Y).Rune; got != 0 {
		t.Errorf("an oversized score spilled past its %d-column item: %q", it.W, got)
	}
	if it.X+it.W > l.Content.Right()+1 {
		t.Fatalf("item %+v is not inside the content group %+v", it, l.Content)
	}
}

func TestPreviewShapeBoundingBoxes(t *testing.T) {
	cases := []struct {
		kind game.PieceKind
		w, h int
	}{
		{game.KindI, 4, 1},
		{game.KindO, 2, 2},
		{game.KindJ, 3, 2},
		{game.KindL, 3, 2},
		{game.KindS, 3, 2},
		{game.KindT, 3, 2},
		{game.KindZ, 3, 2},
	}
	for _, tc := range cases {
		cells, w, h := PreviewShape(tc.kind)
		if w != tc.w || h != tc.h {
			t.Errorf("PreviewShape(%v) box = %dx%d, want %dx%d", tc.kind, w, h, tc.w, tc.h)
		}
		if len(cells) != 4 {
			t.Errorf("PreviewShape(%v) has %d cells, want 4", tc.kind, len(cells))
		}
		for _, cell := range cells {
			if cell[0] < 0 || cell[0] >= w || cell[1] < 0 || cell[1] >= h {
				t.Errorf("PreviewShape(%v) cell %v is outside its own %dx%d box", tc.kind, cell, w, h)
			}
		}
	}
}

func TestPreviewsAreCentredInTheirBox(t *testing.T) {
	// I fills all 8 preview columns; O is 4 columns wide and so is inset by 2.
	for _, tc := range []struct {
		kind   game.PieceKind
		startX int
		width  int
	}{
		{game.KindI, 0, 8},
		{game.KindO, 2, 4},
		{game.KindT, 1, 6},
	} {
		hold := tc.kind
		c, l := drawTestHUD(HUDView{Hold: &hold}, 80, 30, ModeFull)
		it := itemOf(t, l, ItemHoldPreview, 0)
		// Measure the union of both preview rows: a T's top row holds one cell
		// and its bottom row three, so a single row does not describe the box.
		minX, maxX := PreviewCols, -1
		for dy := 0; dy < PreviewRows; dy++ {
			for dx := 0; dx < PreviewCols; dx++ {
				if c.At(it.X+dx, it.Y+dy).Rune == 0 {
					continue
				}
				minX, maxX = min(minX, dx), max(maxX, dx)
			}
		}
		if maxX < 0 {
			t.Fatalf("%v preview was not drawn", tc.kind)
		}
		if minX != tc.startX {
			t.Errorf("%v preview starts at column %d, want %d", tc.kind, minX, tc.startX)
		}
		if got := maxX - minX + 1; got != tc.width {
			t.Errorf("%v preview is %d columns wide, want %d", tc.kind, got, tc.width)
		}
	}
}

func TestEmptyHoldDrawsNoPreview(t *testing.T) {
	c, l := drawTestHUD(HUDView{}, 80, 30, ModeFull)
	it := itemOf(t, l, ItemHoldPreview, 0)
	for dy := 0; dy < PreviewRows; dy++ {
		if got := strings.TrimSpace(textAt(c, it.X, it.Y+dy, PreviewCols)); got != "" {
			t.Errorf("empty hold drew %q", got)
		}
	}
	if !strings.Contains(c.Plain(), "HOLD") {
		t.Error("the HOLD label should be drawn even when nothing is held")
	}
}

func TestNextQueueDrawsInOrderWithEachPieceColor(t *testing.T) {
	v := HUDView{Next: []game.PieceKind{game.KindZ, game.KindI, game.KindT, game.KindO, game.KindS}}
	c, l := drawTestHUD(v, 80, 30, ModeFull)
	p := PaletteFor(ModeFull)
	for i, kind := range v.Next {
		it := itemOf(t, l, ItemNextPreview, i)
		found := false
		for dy := 0; dy < PreviewRows && !found; dy++ {
			for dx := 0; dx < PreviewCols; dx++ {
				cell := c.At(it.X+dx, it.Y+dy)
				if cell.Rune == 0 {
					continue
				}
				if cell.FG != p.Piece[kind] {
					t.Errorf("NEXT slot %d is not drawn in the %v color", i, kind)
				}
				found = true
				break
			}
		}
		if !found {
			t.Errorf("NEXT slot %d was not drawn", i)
		}
	}
}

func TestNextQueueHonoursTheLayoutCountAndShortSlices(t *testing.T) {
	full := []game.PieceKind{game.KindI, game.KindJ, game.KindL, game.KindO, game.KindS}
	c, l := drawTestHUD(HUDView{Next: full}, 40, 24, ModeFull)
	if l.NextCount != 3 {
		t.Fatalf("small NextCount = %d, want 3", l.NextCount)
	}
	drawn := 0
	for _, it := range l.Items {
		if it.Kind != ItemNextPreview {
			continue
		}
		for dy := 0; dy < PreviewRows; dy++ {
			if strings.TrimSpace(textAt(c, it.X, it.Y+dy, PreviewCols)) != "" {
				drawn++
				break
			}
		}
	}
	if drawn != 3 {
		t.Errorf("%d previews drawn at small size, want 3 (§49.3)", drawn)
	}

	// A short queue must not panic or draw a phantom piece.
	c2, l2 := drawTestHUD(HUDView{Next: full[:1]}, 80, 30, ModeFull)
	it := itemOf(t, l2, ItemNextPreview, 4)
	for dy := 0; dy < PreviewRows; dy++ {
		if got := strings.TrimSpace(textAt(c2, it.X, it.Y+dy, PreviewCols)); got != "" {
			t.Errorf("slot 4 drew %q for a one-element queue", got)
		}
	}
}

func TestHUDIsANoOpForATooSmallLayout(t *testing.T) {
	v := HUDView{Score: 1, Next: []game.PieceKind{game.KindI}}
	c, _ := drawTestHUD(v, 20, 10, ModeFull)
	if strings.TrimSpace(c.Plain()) != "" {
		t.Errorf("DrawHUD drew %q for a too-small layout", c.Plain())
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestValueFormats|TestLabels|TestStat|TestSmallLayoutDraws|TestOversized|TestPreview|TestEmptyHold|TestNextQueue|TestHUDIs' -v`
Expected: FAIL — `undefined: DrawHUD`.

- [ ] **Step 3: Write the implementation**

Create `internal/render/hud.go`:

```go
package render

import (
	"fmt"

	"cosmic-tetris/internal/game"
)

// HUDView is everything the panels need, by value.
type HUDView struct {
	Hold *game.PieceKind
	Next []game.PieceKind

	Score int
	Lines int
	Level int
}

// Value formats follow the §4 mockup. Longer values grow rather than truncate.
func FormatScore(n int) string { return fmt.Sprintf("%08d", n) }
func FormatLines(n int) string { return fmt.Sprintf("%03d", n) }
func FormatLevel(n int) string { return fmt.Sprintf("%02d", n) }

// PreviewShape returns the piece's spawn-rotation cells translated so the
// bounding box starts at (0,0), with that box's size in board cells.
func PreviewShape(k game.PieceKind) (cells [][2]int, w, h int) {
	offs := game.Piece{Kind: k}.Cells()
	minX, minY := offs[0][0], offs[0][1]
	maxX, maxY := minX, minY
	for _, o := range offs {
		minX, maxX = min(minX, o[0]), max(maxX, o[0])
		minY, maxY = min(minY, o[1]), max(maxY, o[1])
	}
	cells = make([][2]int, 0, len(offs))
	for _, o := range offs {
		cells = append(cells, [2]int{o[0] - minX, o[1] - minY})
	}
	return cells, maxX - minX + 1, maxY - minY + 1
}

// clip trims s to at most w runes so no value escapes its panel.
func clip(s string, w int) string {
	if w <= 0 {
		return ""
	}
	rs := []rune(s)
	if len(rs) <= w {
		return s
	}
	return string(rs[:w])
}

// DrawHUD draws §37 step 8 by walking the layout's display list. Tier
// differences live entirely in Compute.
func DrawHUD(c *Canvas, l Layout, v HUDView, gs GlyphSet, p Palette) {
	if l.Tier == TierTooSmall {
		return
	}
	for _, it := range l.Items {
		switch it.Kind {
		case ItemHoldLabel:
			c.SetString(it.X, it.Y, clip("HOLD", it.W), p.Label, false)
		case ItemNextLabel:
			c.SetString(it.X, it.Y, clip("NEXT", it.W), p.Label, false)
		case ItemScoreLabel:
			c.SetString(it.X, it.Y, clip("SCORE", it.W), p.Label, false)
		case ItemLinesLabel:
			c.SetString(it.X, it.Y, clip("LINES", it.W), p.Label, false)
		case ItemLevelLabel:
			c.SetString(it.X, it.Y, clip("LEVEL", it.W), p.Label, false)
		case ItemScoreValue:
			c.SetString(it.X, it.Y, clip(FormatScore(v.Score), it.W), p.Value, true)
		case ItemLinesValue:
			c.SetString(it.X, it.Y, clip(FormatLines(v.Lines), it.W), p.Value, false)
		case ItemLevelValue:
			c.SetString(it.X, it.Y, clip(FormatLevel(v.Level), it.W), p.Value, false)
		case ItemHoldPreview:
			if v.Hold != nil {
				drawPreview(c, it, *v.Hold, gs, p)
			}
		case ItemNextPreview:
			if it.Index < len(v.Next) {
				drawPreview(c, it, v.Next[it.Index], gs, p)
			}
		}
	}
}

// drawPreview centres a piece in the item's PreviewCols × PreviewRows box.
func drawPreview(c *Canvas, it Item, k game.PieceKind, gs GlyphSet, p Palette) {
	cells, w, h := PreviewShape(k)
	box := min(it.W, PreviewCols)
	offX := (box - w*CellCols) / 2
	offY := (PreviewRows - h) / 2
	if offX < 0 {
		offX = 0
	}
	if offY < 0 {
		offY = 0
	}
	for _, cell := range cells {
		x := it.X + offX + cell[0]*CellCols
		y := it.Y + offY + cell[1]
		if x+CellCols-1 > it.X+it.W-1 {
			continue
		}
		c.SetString(x, y, gs.Block, p.Piece[k], false)
	}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v && go vet ./...`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/hud.go internal/render/hud_test.go
git commit -m "feat(render): HOLD, NEXT, and stat panels driven by the display list"
```

---
