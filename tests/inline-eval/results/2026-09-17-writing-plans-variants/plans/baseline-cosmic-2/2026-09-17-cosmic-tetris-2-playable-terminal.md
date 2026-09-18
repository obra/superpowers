# Cosmic Tetris — Plan 2: Playable Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a terminal on top of Plan 1's engine — Bubble Tea event loop, keyboard, board, HUD, next queue, hold, ghost, help, pause, restart, live resize, and the whole CLI flag surface — so that at the end of this plan Cosmic Tetris is already a genuinely good game with no effects at all (§42 Phase 2).

**Architecture:** All drawing goes through one cell grid: `render.Canvas` holds a rune plus a comparable `Paint` per terminal cell, and emits Lip Gloss-styled runs on `String()`. Everything else (board, HUD, overlays) writes into that canvas, which is why compositing starfields and particles over the board in Plan 3 costs nothing new. `render.Layout` computes element positions from terminal size and owns the §49.3 drop order. The renderer is handed a `game.Snapshot` value, never a `*game.Game`, so §37's "rendering must not mutate game state" is structural.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2@v2.0.9`, `charm.land/lipgloss/v2@v2.0.6`, `charm.land/bubbles/v2@v2.2.1`, `github.com/charmbracelet/x/ansi` (already an indirect dependency; used by tests to strip ANSI), `github.com/charmbracelet/colorprofile` (already an indirect dependency; used for capability detection).

**Spec:** `design.md`

**Depends on:** Plan 1 (`plans/2026-09-17-cosmic-tetris-1-game-engine.md`) complete and merged.

## Global Constraints

- Language: Go. Module path `cosmic-tetris`. Go directive `go 1.26`.
- Repository layout is §33 of the spec, exactly. Deviations permitted across this plan set, and only these: `internal/game/events.go` (Plan 1), `internal/render/canvas.go` (this plan), `internal/render/overlays.go` (this plan).
- Bubble Tea is the application/event loop and must not be hidden behind a homegrown framework (§3). Use Lip Gloss for colour, borders, gradients, layout and text styling. Use Bubbles only for key bindings, help, and the boot spinner (§3).
- Imports are `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2` — pinned at v2.0.9 / v2.0.6 / v2.2.1.
- Bubble Tea v2 API facts that differ from v1 and will bite otherwise: `Model` is `Init() Cmd`, `Update(Msg) (Model, Cmd)`, `View() tea.View`. Alt screen is `v.AltScreen = true` on the returned `tea.View`, not a program option. Key presses arrive as `tea.KeyPressMsg`. `tea.Tick` fires once and must be re-issued.
- Board glyphs are two terminal columns per logical cell (§5). Board interior is therefore exactly 20 columns × 20 rows in every rendering mode.
- Glyphs are pinned by §49.4: ghost `░░` in full/reduced and `··` in ASCII; pieces are filled block glyphs (`██`, `[]` in ASCII) with a bright foreground — never a foreground+background pairing. The active piece renders one step brighter than locked cells.
- Minimum usable terminal is 40 columns × 24 rows; below that show the §31 too-small notice. Never crash from a resize (§31).
- Small-terminal drop order is §49.3: title border first, then mission control, then stat labels. NEXT never stacks above or below the board; at small sizes it sits beside the board and truncates to 3 upcoming pieces.
- The §4 wide-layout mockup is intent, not geometry (§49.7). The ANSI-stripped golden tests are the binding layout contract (§41).
- Rendering must not mutate game state (§37). `render` takes `game.Snapshot`; it must not import anything that lets it write to a `*game.Game`.
- Final CLI surface is exactly §49.5: bare, `--seed 1234`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help`. Nothing else.
- Input must not wait for ticks (§36, §44). Key handling happens in `Update` on receipt, never deferred to the next frame.
- Every commit must leave `gofmt -l .` empty, `go vet ./...` clean, and `go test ./...` passing.

## Review Focus

1. **A terminal reporting 0×0 or 1×1**, which happens during startup and while a terminal is being dragged: must render the too-small notice, not index out of range. Pinned in Task 3 and Task 6.
2. **A very large terminal (300×100)**: the block stays centred, nothing overlaps, no panic, no quadratic blow-up. Pinned in Task 3 and Task 6.
3. **Board interior geometry across all three rendering modes**: exactly 20 columns and 20 rows, because a glyph that is not two columns wide silently desynchronises every x coordinate. Pinned in Task 4.
4. **HUD values wider than their field** (score past 8 digits, lines past 3, level past 2): the panel must not widen and shove the board sideways. Pinned in Task 5.
5. **A resize arriving while paused, in help, or after game over**: state survives, layout recomputes, nothing panics. Pinned in Task 10.

---

### Task 1: The cell canvas

**Files:**
- Create: `internal/render/canvas.go`
- Test: `internal/render/canvas_test.go`

**Interfaces:**
- Consumes: nothing from Plan 1.
- Produces: `type RGB struct{ R, G, B uint8 }`; `func RGBFrom(c color.Color) RGB`; `type Paint struct{ FG RGB; Bold, Faint bool }`; `type Canvas struct{ ... }`; `func NewCanvas(w, h int) *Canvas`; `func (c *Canvas) Size() (w, h int)`; `func (c *Canvas) Resize(w, h int)`; `func (c *Canvas) Clear()`; `func (c *Canvas) Set(x, y int, r rune, p Paint)`; `func (c *Canvas) SetString(x, y int, s string, p Paint)`; `func (c *Canvas) String() string`.

Out-of-range writes are silent no-ops. That single decision is what lets particles fly off the board and terminals shrink mid-frame without a panic.

- [ ] **Step 1: Add the dependencies**

```bash
cd "$(git rev-parse --show-toplevel)"
go get charm.land/bubbletea/v2@v2.0.9 charm.land/lipgloss/v2@v2.0.6 charm.land/bubbles/v2@v2.2.1
```

- [ ] **Step 2: Write the failing test**

Create `internal/render/canvas_test.go`:

```go
package render

import (
	"image/color"
	"strings"
	"testing"

	"github.com/charmbracelet/x/ansi"
)

var (
	cyan  = Paint{FG: RGB{0x22, 0xEE, 0xFF}}
	pink  = Paint{FG: RGB{0xFF, 0x33, 0x99}, Bold: true}
	plain = Paint{}
)

func TestNewCanvasIsBlank(t *testing.T) {
	c := NewCanvas(4, 2)
	if got := ansi.Strip(c.String()); got != "    \n    " {
		t.Fatalf("blank canvas = %q, want two rows of four spaces", got)
	}
}

func TestSetPlacesARune(t *testing.T) {
	c := NewCanvas(4, 2)
	c.Set(1, 0, 'X', cyan)
	c.Set(3, 1, 'Y', plain)
	if got, want := ansi.Strip(c.String()), " X  \n   Y"; got != want {
		t.Fatalf("canvas = %q, want %q", got, want)
	}
}

func TestSetStringWritesLeftToRight(t *testing.T) {
	c := NewCanvas(8, 1)
	c.SetString(2, 0, "██", cyan)
	if got, want := ansi.Strip(c.String()), "  ██    "; got != want {
		t.Fatalf("canvas = %q, want %q", got, want)
	}
}

func TestOutOfRangeWritesAreSilentNoOps(t *testing.T) {
	c := NewCanvas(3, 2)
	// If any of these panic or bleed, particles and resizes will crash the game.
	c.Set(-1, 0, 'X', cyan)
	c.Set(3, 0, 'X', cyan)
	c.Set(0, -5, 'X', cyan)
	c.Set(0, 2, 'X', cyan)
	c.SetString(-4, 0, "hello", cyan)
	c.SetString(2, 1, "overflowing", cyan)
	c.SetString(0, 99, "nowhere", cyan)

	got := ansi.Strip(c.String())
	if got != "   \n  o" {
		t.Fatalf("canvas = %q, want the clipped write only", got)
	}
}

func TestZeroSizedCanvasIsUsable(t *testing.T) {
	// Terminals report 0x0 during startup and while being dragged.
	c := NewCanvas(0, 0)
	c.Set(0, 0, 'X', cyan)
	c.SetString(0, 0, "nope", cyan)
	if got := c.String(); got != "" {
		t.Fatalf("zero canvas = %q, want empty", got)
	}
	c2 := NewCanvas(-5, -5)
	if got := c2.String(); got != "" {
		t.Fatalf("negative canvas = %q, want empty", got)
	}
}

func TestClearResetsEveryCell(t *testing.T) {
	c := NewCanvas(3, 1)
	c.SetString(0, 0, "abc", pink)
	c.Clear()
	if got := c.String(); got != "   " {
		t.Fatalf("cleared canvas = %q, want unstyled spaces", got)
	}
}

func TestResizeChangesGeometryAndClears(t *testing.T) {
	c := NewCanvas(3, 1)
	c.SetString(0, 0, "abc", pink)
	c.Resize(5, 2)
	if w, h := c.Size(); w != 5 || h != 2 {
		t.Fatalf("Size = %dx%d, want 5x2", w, h)
	}
	if got := ansi.Strip(c.String()); got != "     \n     " {
		t.Fatalf("resized canvas = %q, want blank 5x2", got)
	}
}

func TestOutputHasOneLinePerRow(t *testing.T) {
	c := NewCanvas(6, 4)
	if got := len(strings.Split(c.String(), "\n")); got != 4 {
		t.Fatalf("got %d lines, want 4", got)
	}
}

func TestUnstyledCellsEmitNoEscapeCodes(t *testing.T) {
	c := NewCanvas(4, 1)
	c.SetString(0, 0, "abcd", plain)
	if got := c.String(); got != "abcd" {
		t.Fatalf("plain output = %q, want no escape codes", got)
	}
}

func TestStyledCellsEmitEscapeCodesAndStripBackToText(t *testing.T) {
	c := NewCanvas(4, 1)
	c.SetString(0, 0, "ab", cyan)
	c.SetString(2, 0, "cd", pink)
	out := c.String()
	if !strings.Contains(out, "\x1b[") {
		t.Fatalf("styled output has no escape codes: %q", out)
	}
	if got := ansi.Strip(out); got != "abcd" {
		t.Fatalf("stripped output = %q, want %q", got, "abcd")
	}
}

func TestAdjacentCellsWithTheSamePaintBecomeOneRun(t *testing.T) {
	c := NewCanvas(4, 1)
	c.SetString(0, 0, "abcd", cyan)
	// One run means exactly one style prefix and one reset.
	if got := strings.Count(c.String(), "\x1b[0m"); got != 1 {
		t.Fatalf("%d resets, want 1: runs are not being merged", got)
	}
}

func TestRGBFromConvertsStandardColors(t *testing.T) {
	got := RGBFrom(color.RGBA{R: 0x12, G: 0x34, B: 0x56, A: 0xFF})
	if want := (RGB{0x12, 0x34, 0x56}); got != want {
		t.Fatalf("RGBFrom = %v, want %v", got, want)
	}
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `go test ./internal/render/ -run TestNewCanvas -v`
Expected: FAIL — `undefined: NewCanvas`.

- [ ] **Step 4: Write the implementation**

Create `internal/render/canvas.go`:

```go
// Package render draws Cosmic Tetris. Everything is composited into a Canvas of
// terminal cells and emitted as Lip Gloss-styled runs, which is what lets the
// board, the HUD, the starfield and the particles share one coordinate space.
//
// Nothing here mutates game state: the renderer is handed a game.Snapshot value
// rather than a *game.Game (§37).
package render

import (
	"image/color"
	"strings"

	"charm.land/lipgloss/v2"
)

// RGB is a truecolor value. Colours are resolved to RGB at the canvas boundary
// so that Paint stays comparable and runs of identical styling can be merged.
// Downsampling for 256-colour and 16-colour terminals is Bubble Tea's job.
type RGB struct{ R, G, B uint8 }

// RGBFrom converts any color.Color to RGB.
func RGBFrom(c color.Color) RGB {
	r, g, b, _ := c.RGBA()
	return RGB{R: uint8(r >> 8), G: uint8(g >> 8), B: uint8(b >> 8)}
}

func (c RGB) color() color.Color { return color.RGBA{R: c.R, G: c.G, B: c.B, A: 0xFF} }

func (c RGB) isZero() bool { return c == RGB{} }

// Paint is the styling of one cell. It is deliberately comparable. A zero FG
// means "no colour": pure black text is useless in a terminal, so the zero
// value doubles as unstyled.
type Paint struct {
	FG    RGB
	Bold  bool
	Faint bool
}

type cell struct {
	Rune  rune
	Paint Paint
}

// Canvas is a fixed grid of terminal cells. Writes outside the grid are silently
// dropped, which is what keeps stray particles and mid-frame resizes harmless.
type Canvas struct {
	w, h   int
	cells  []cell
	styles map[Paint]lipgloss.Style
	buf    strings.Builder
	run    []rune
}

// NewCanvas returns a blank canvas. Non-positive dimensions produce an empty
// canvas that accepts writes and renders as "".
func NewCanvas(w, h int) *Canvas {
	c := &Canvas{styles: make(map[Paint]lipgloss.Style)}
	c.Resize(w, h)
	return c
}

// Size returns the canvas dimensions.
func (c *Canvas) Size() (int, int) { return c.w, c.h }

// Resize changes the grid and clears it. The backing slice is reused when it is
// already large enough (§38: reusable slices, no per-frame churn).
func (c *Canvas) Resize(w, h int) {
	if w < 0 {
		w = 0
	}
	if h < 0 {
		h = 0
	}
	c.w, c.h = w, h
	need := w * h
	if cap(c.cells) < need {
		c.cells = make([]cell, need)
	}
	c.cells = c.cells[:need]
	c.Clear()
}

// Clear resets every cell to an unstyled space.
func (c *Canvas) Clear() {
	blank := cell{Rune: ' '}
	for i := range c.cells {
		c.cells[i] = blank
	}
}

// Set writes one rune. Out-of-range coordinates are ignored.
func (c *Canvas) Set(x, y int, r rune, p Paint) {
	if x < 0 || y < 0 || x >= c.w || y >= c.h {
		return
	}
	c.cells[y*c.w+x] = cell{Rune: r, Paint: p}
}

// SetString writes s left to right from x, y, one rune per column, clipping at
// the edges.
func (c *Canvas) SetString(x, y int, s string, p Paint) {
	if y < 0 || y >= c.h {
		return
	}
	for _, r := range s {
		if x >= c.w {
			return
		}
		if x >= 0 {
			c.cells[y*c.w+x] = cell{Rune: r, Paint: p}
		}
		x++
	}
}

func (c *Canvas) styleFor(p Paint) lipgloss.Style {
	if s, ok := c.styles[p]; ok {
		return s
	}
	s := lipgloss.NewStyle()
	if !p.FG.isZero() {
		s = s.Foreground(p.FG.color())
	}
	if p.Bold {
		s = s.Bold(true)
	}
	if p.Faint {
		s = s.Faint(true)
	}
	c.styles[p] = s
	return s
}

// String renders the canvas, merging horizontal runs of identical Paint into a
// single styled span. Unstyled runs are emitted as bare text, which keeps the
// golden tests readable.
func (c *Canvas) String() string {
	c.buf.Reset()
	for y := 0; y < c.h; y++ {
		row := c.cells[y*c.w : (y+1)*c.w]
		for i := 0; i < c.w; {
			p := row[i].Paint
			j := i + 1
			for j < c.w && row[j].Paint == p {
				j++
			}
			c.run = c.run[:0]
			for k := i; k < j; k++ {
				c.run = append(c.run, row[k].Rune)
			}
			text := string(c.run)
			if p == (Paint{}) {
				c.buf.WriteString(text)
			} else {
				c.buf.WriteString(c.styleFor(p).Render(text))
			}
			i = j
		}
		if y < c.h-1 {
			c.buf.WriteByte('\n')
		}
	}
	return c.buf.String()
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 6: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add go.mod go.sum internal/render/canvas.go internal/render/canvas_test.go
git commit -m "feat(render): styled cell canvas with clipping and run merging"
```

---

### Task 2: Palette, rendering modes and glyph sets

**Files:**
- Create: `internal/render/palette.go`
- Test: `internal/render/palette_test.go`

**Interfaces:**
- Consumes: `RGB`, `Paint`, `game.PieceKind`.
- Produces: `type Mode uint8` with `ModeFull`, `ModeReduced`, `ModeASCII`; `func (m Mode) String() string`; `func ModeFor(profile colorprofile.Profile, forceASCII bool) Mode`; `type Glyphs struct{ Block, Ghost, Empty string; Stars [3][]rune; Debris []rune; Rings []rune; BorderH, BorderV, BorderTL, BorderTR, BorderBL, BorderBR string }`; `func GlyphsFor(m Mode) Glyphs`; `func PieceColor(k game.PieceKind) RGB`; `func LockedPaint(k game.PieceKind) Paint`; `func ActivePaint(k game.PieceKind) Paint`; `func GhostPaint() Paint`; `var BorderPalette [5]RGB`; `func Dim(c RGB, f float64) RGB`; `func Brighten(c RGB, f float64) RGB`.

- [ ] **Step 1: Write the failing test**

Create `internal/render/palette_test.go`:

```go
package render

import (
	"testing"
	"unicode/utf8"

	"github.com/charmbracelet/colorprofile"

	"cosmic-tetris/internal/game"
)

func TestModeForMapsColorProfiles(t *testing.T) {
	cases := []struct {
		profile colorprofile.Profile
		force   bool
		want    Mode
	}{
		{colorprofile.TrueColor, false, ModeFull},
		{colorprofile.ANSI256, false, ModeReduced},
		{colorprofile.ANSI, false, ModeReduced},
		{colorprofile.ASCII, false, ModeASCII},
		{colorprofile.NoTTY, false, ModeASCII},
		{colorprofile.Unknown, false, ModeReduced},
		{colorprofile.TrueColor, true, ModeASCII}, // --ascii always wins
	}
	for _, c := range cases {
		if got := ModeFor(c.profile, c.force); got != c.want {
			t.Errorf("ModeFor(%v, %v) = %v, want %v", c.profile, c.force, got, c.want)
		}
	}
}

func TestBlockAndGhostGlyphsAreTwoColumnsInEveryMode(t *testing.T) {
	// One logical cell is 2 terminal columns (§5). Every glyph pair must be
	// exactly two runes, each one column wide, or the board's x maths desyncs.
	for _, m := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		g := GlyphsFor(m)
		for name, s := range map[string]string{"Block": g.Block, "Ghost": g.Ghost, "Empty": g.Empty} {
			if n := utf8.RuneCountInString(s); n != 2 {
				t.Errorf("%v %s = %q is %d runes, want 2", m, name, s, n)
			}
		}
	}
}

func TestGlyphsMatchThePinnedChoices(t *testing.T) {
	full := GlyphsFor(ModeFull)
	if full.Block != "██" {
		t.Errorf("full Block = %q, want %q", full.Block, "██")
	}
	if full.Ghost != "░░" {
		t.Errorf("full Ghost = %q, want %q (§49.4)", full.Ghost, "░░")
	}
	if GlyphsFor(ModeReduced).Ghost != "░░" {
		t.Error("reduced mode ghost must also be ░░ (§49.4)")
	}
	a := GlyphsFor(ModeASCII)
	if a.Block != "[]" {
		t.Errorf("ascii Block = %q, want %q", a.Block, "[]")
	}
	if a.Ghost != ".." {
		t.Errorf("ascii Ghost = %q, want %q (§49.4)", a.Ghost, "..")
	}
}

func TestASCIIModeGlyphsAreAllASCII(t *testing.T) {
	g := GlyphsFor(ModeASCII)
	strs := []string{g.Block, g.Ghost, g.Empty, g.BorderH, g.BorderV, g.BorderTL, g.BorderTR, g.BorderBL, g.BorderBR}
	for _, s := range strs {
		for _, r := range s {
			if r > 0x7F {
				t.Errorf("ascii glyph %q contains non-ASCII rune %q", s, r)
			}
		}
	}
	for layer, runes := range g.Stars {
		for _, r := range runes {
			if r > 0x7F {
				t.Errorf("ascii star layer %d contains non-ASCII rune %q", layer, r)
			}
		}
	}
	for _, r := range g.Debris {
		if r > 0x7F {
			t.Errorf("ascii debris contains non-ASCII rune %q", r)
		}
	}
}

func TestStarfieldHasThreeNonEmptyLayers(t *testing.T) {
	for _, m := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		g := GlyphsFor(m)
		if len(g.Stars) != 3 {
			t.Fatalf("%v: %d star layers, want 3 (§15)", m, len(g.Stars))
		}
		for i, runes := range g.Stars {
			if len(runes) == 0 {
				t.Errorf("%v: star layer %d is empty", m, i)
			}
		}
	}
}

func TestEveryPieceHasADistinctColor(t *testing.T) {
	seen := map[RGB]game.PieceKind{}
	for k := game.PieceKind(0); k < game.KindCount; k++ {
		c := PieceColor(k)
		if c.isZero() {
			t.Errorf("%s has no colour", k)
		}
		if prev, dup := seen[c]; dup {
			t.Errorf("%s and %s share colour %v", k, prev, c)
		}
		seen[c] = k
	}
}

func TestActivePieceIsBrighterThanLockedCells(t *testing.T) {
	// §49.4: the active piece renders one step brighter than locked cells.
	for k := game.PieceKind(0); k < game.KindCount; k++ {
		locked, active := LockedPaint(k), ActivePaint(k)
		sum := func(c RGB) int { return int(c.R) + int(c.G) + int(c.B) }
		if sum(active.FG) <= sum(locked.FG) {
			t.Errorf("%s: active %v is not brighter than locked %v", k, active.FG, locked.FG)
		}
	}
}

func TestPiecePaintUsesForegroundOnly(t *testing.T) {
	// §49.4 pins filled glyphs with a bright foreground, not a fg+bg pairing.
	// Paint has no background field at all, so this test guards the API shape.
	p := ActivePaint(game.KindI)
	if p.FG.isZero() {
		t.Fatal("active paint has no foreground colour")
	}
}

func TestGhostIsDimAndNotBold(t *testing.T) {
	g := GhostPaint()
	if g.Bold {
		t.Error("ghost should not be bold; it must never compete with locked blocks (§10)")
	}
	if !g.Faint {
		t.Error("ghost should be faint")
	}
}

func TestBorderPaletteHasFiveStops(t *testing.T) {
	for i, c := range BorderPalette {
		if c.isZero() {
			t.Errorf("border palette stop %d is unset", i)
		}
	}
}

func TestDimAndBrightenStayInRangeAndMoveTheRightWay(t *testing.T) {
	base := RGB{0x80, 0x80, 0x80}
	if d := Dim(base, 0.5); d.R >= base.R {
		t.Errorf("Dim = %v, want darker than %v", d, base)
	}
	if b := Brighten(base, 0.5); b.R <= base.R {
		t.Errorf("Brighten = %v, want lighter than %v", b, base)
	}
	if got := Brighten(RGB{0xFF, 0xFF, 0xFF}, 5); got != (RGB{0xFF, 0xFF, 0xFF}) {
		t.Errorf("Brighten overflowed to %v", got)
	}
	if got := Dim(RGB{0, 0, 0}, 5); got != (RGB{}) {
		t.Errorf("Dim underflowed to %v", got)
	}
	if got := Dim(base, -1); got != base {
		t.Errorf("Dim with a negative factor = %v, want %v unchanged", got, base)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/render/ -run TestModeFor -v`
Expected: FAIL — `undefined: ModeFor`.

- [ ] **Step 3: Write the implementation**

Create `internal/render/palette.go`:

```go
package render

import (
	"github.com/charmbracelet/colorprofile"

	"cosmic-tetris/internal/game"
)

// Mode is how much the terminal can be trusted with (§32).
type Mode uint8

const (
	// ModeFull is Unicode plus truecolor: every effect, every gradient.
	ModeFull Mode = iota
	// ModeReduced is Unicode with a smaller colour space; Bubble Tea downsamples
	// the truecolor we emit, so only the effect budget changes.
	ModeReduced
	// ModeASCII assumes nothing beyond ASCII and a handful of colours.
	ModeASCII
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

// ModeFor picks a rendering mode from the detected colour profile. The --ascii
// flag always wins.
func ModeFor(profile colorprofile.Profile, forceASCII bool) Mode {
	if forceASCII {
		return ModeASCII
	}
	switch profile {
	case colorprofile.TrueColor:
		return ModeFull
	case colorprofile.ASCII, colorprofile.NoTTY:
		return ModeASCII
	default:
		// ANSI, ANSI256 and Unknown: assume Unicode works, be modest with colour.
		return ModeReduced
	}
}

// Glyphs is the character vocabulary for a mode. Block, Ghost and Empty are all
// exactly two columns, because one logical cell is two terminal columns (§5).
type Glyphs struct {
	Block string
	Ghost string
	Empty string

	// Stars holds the far, mid and near starfield glyph sets (§15).
	Stars [3][]rune
	// Debris are impact and line-collapse particles (§18, §19).
	Debris []rune
	// Rings are shockwave glyphs, smallest first (§24).
	Rings []rune

	BorderH  string
	BorderV  string
	BorderTL string
	BorderTR string
	BorderBL string
	BorderBR string
}

var (
	unicodeGlyphs = Glyphs{
		Block: "██",
		Ghost: "░░",
		Empty: "  ",
		Stars: [3][]rune{
			{'.'},
			{'·', '˚'},
			{'✦', '✧'},
		},
		Debris:   []rune{'·', '*', '✦', '+'},
		Rings:    []rune{'·', '○', '◌', '◯'},
		BorderH:  "═",
		BorderV:  "║",
		BorderTL: "╔",
		BorderTR: "╗",
		BorderBL: "╚",
		BorderBR: "╝",
	}

	asciiGlyphs = Glyphs{
		Block: "[]",
		Ghost: "..",
		Empty: "  ",
		Stars: [3][]rune{
			{'.'},
			{',', '`'},
			{'*', '+'},
		},
		Debris:   []rune{'.', '*', '+', 'o'},
		Rings:    []rune{'.', 'o', 'O', '0'},
		BorderH:  "-",
		BorderV:  "|",
		BorderTL: "+",
		BorderTR: "+",
		BorderBL: "+",
		BorderBR: "+",
	}
)

// GlyphsFor returns the glyph vocabulary for a mode.
func GlyphsFor(m Mode) Glyphs {
	if m == ModeASCII {
		return asciiGlyphs
	}
	return unicodeGlyphs
}

// pieceColors is the neon space palette (§26). Coherent, not a rainbow toy.
var pieceColors = [game.KindCount]RGB{
	game.KindI: {0x2C, 0xE8, 0xF5}, // plasma cyan
	game.KindJ: {0x3B, 0x6B, 0xF5}, // deep electric blue
	game.KindL: {0xFF, 0x8C, 0x2B}, // solar orange
	game.KindO: {0xFF, 0xD1, 0x4A}, // stellar gold
	game.KindS: {0x4B, 0xE8, 0x7A}, // alien green
	game.KindT: {0xA8, 0x5C, 0xFF}, // ultraviolet
	game.KindZ: {0xFF, 0x3D, 0x7F}, // supernova pink
}

// PieceColor is a piece family's base colour.
func PieceColor(k game.PieceKind) RGB {
	if k >= game.KindCount {
		return RGB{0x88, 0x88, 0x88}
	}
	return pieceColors[k]
}

// LockedPaint styles a settled block: visually rich, but a step below the
// active piece (§26, §49.4).
func LockedPaint(k game.PieceKind) Paint {
	return Paint{FG: Dim(PieceColor(k), 0.25)}
}

// ActivePaint styles the falling piece: one step brighter, and bold (§49.4).
func ActivePaint(k game.PieceKind) Paint {
	return Paint{FG: Brighten(PieceColor(k), 0.25), Bold: true}
}

// GhostPaint styles the landing preview. Dim and never bold, so it can never
// compete with a locked block (§10).
func GhostPaint() Paint {
	return Paint{FG: RGB{0x4A, 0x4F, 0x6B}, Faint: true}
}

// BorderPalette is the board border's energy-state gradient (§25):
// deep violet, electric cyan, magenta, stellar blue, hot white.
var BorderPalette = [5]RGB{
	{0x5B, 0x22, 0xB8},
	{0x22, 0xE0, 0xF0},
	{0xE0, 0x2B, 0xC8},
	{0x3A, 0x6C, 0xF0},
	{0xF2, 0xF6, 0xFF},
}

// Dim darkens c by f (0..1).
func Dim(c RGB, f float64) RGB {
	if f <= 0 {
		return c
	}
	if f > 1 {
		f = 1
	}
	scale := func(v uint8) uint8 { return uint8(float64(v) * (1 - f)) }
	return RGB{scale(c.R), scale(c.G), scale(c.B)}
}

// Brighten lightens c toward white by f (0..1).
func Brighten(c RGB, f float64) RGB {
	if f <= 0 {
		return c
	}
	if f > 1 {
		f = 1
	}
	lift := func(v uint8) uint8 { return uint8(float64(v) + (255-float64(v))*f) }
	return RGB{lift(c.R), lift(c.G), lift(c.B)}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/render/palette.go internal/render/palette_test.go
git commit -m "feat(render): neon palette, rendering modes and glyph vocabularies"
```

---

### Task 3: Responsive layout

**Files:**
- Create: `internal/render/layout.go`
- Test: `internal/render/layout_test.go`

**Interfaces:**
- Consumes: `game.Width`, `game.VisibleRows`.
- Produces: `const BoardInteriorW = 20`, `const BoardInteriorH = 20`, `const BoardOuterW = 22`, `const BoardOuterH = 22`, `const MinWidth = 40`, `const MinHeight = 24`; `type Layout struct{ W, H int; TooSmall bool; BoardX, BoardY int; LeftX, LeftW, RightX, RightW int; ShowTitle bool; TitleY int; ShowMission bool; MissionY int; ControlsY int; ShowHold bool; ShowStatLabels bool; NextCount int }`; `func Compute(w, h int) Layout`.

Pinned geometry, derived from §49.3's budget:

| rows | title | mission | controls |
|---|---|---|---|
| ≥25 | yes | yes | yes |
| 24 | no | yes | yes |
| <24 | too small |

| cols | hold panel | stat labels | NEXT count |
|---|---|---|---|
| ≥52 | yes | yes | 5 |
| 46–51 | no | yes | 5 |
| 44–45 | no | no | 5 |
| 40–43 | no | no | 3 |
| <40 | too small |

Left panel is 10 columns with labels, 8 without. Right panel is 10 columns. At exactly 40×24 the content is 8 + 22 + 10 = 40 columns and 22 + 1 + 1 = 24 rows: the minimum fits exactly, which is why those are the minimum.

- [ ] **Step 1: Write the failing test**

Create `internal/render/layout_test.go`:

```go
package render

import (
	"testing"

	"cosmic-tetris/internal/game"
)

func TestBoardGeometryConstantsFollowFromTheBoard(t *testing.T) {
	if BoardInteriorW != game.Width*2 {
		t.Errorf("BoardInteriorW = %d, want %d (2 columns per cell)", BoardInteriorW, game.Width*2)
	}
	if BoardInteriorH != game.VisibleRows {
		t.Errorf("BoardInteriorH = %d, want %d", BoardInteriorH, game.VisibleRows)
	}
	if BoardOuterW != BoardInteriorW+2 || BoardOuterH != BoardInteriorH+2 {
		t.Errorf("outer = %dx%d, want interior plus a border ring", BoardOuterW, BoardOuterH)
	}
}

func TestBelowMinimumIsTooSmall(t *testing.T) {
	for _, c := range []struct{ w, h int }{
		{0, 0}, {1, 1}, {39, 24}, {40, 23}, {34, 19}, {-5, -5},
	} {
		if l := Compute(c.w, c.h); !l.TooSmall {
			t.Errorf("Compute(%d,%d) is not TooSmall", c.w, c.h)
		}
	}
}

func TestExactMinimumFits(t *testing.T) {
	l := Compute(MinWidth, MinHeight)
	if l.TooSmall {
		t.Fatalf("Compute(%d,%d) should fit exactly", MinWidth, MinHeight)
	}
	if l.ShowTitle {
		t.Error("title must be the first thing dropped (§49.3)")
	}
	if !l.ShowMission {
		t.Error("mission control survives at the minimum")
	}
	if l.ShowHold {
		t.Error("hold panel does not fit at 40 columns")
	}
	if l.ShowStatLabels {
		t.Error("stat labels do not fit at 40 columns (§49.3: values stay, labels go)")
	}
	if l.NextCount != 3 {
		t.Errorf("NextCount = %d, want 3 at the minimum (§49.3)", l.NextCount)
	}
	if l.BoardX < 0 || l.BoardX+BoardOuterW > MinWidth {
		t.Errorf("board spans %d..%d, outside 0..%d", l.BoardX, l.BoardX+BoardOuterW, MinWidth)
	}
	if l.BoardY < 0 || l.BoardY+BoardOuterH > MinHeight {
		t.Errorf("board spans rows %d..%d, outside 0..%d", l.BoardY, l.BoardY+BoardOuterH, MinHeight)
	}
}

func TestDropOrderIsTitleThenMission(t *testing.T) {
	if l := Compute(80, 25); !l.ShowTitle || !l.ShowMission {
		t.Errorf("at 25 rows: title=%v mission=%v, want both", l.ShowTitle, l.ShowMission)
	}
	if l := Compute(80, 24); l.ShowTitle || !l.ShowMission {
		t.Errorf("at 24 rows: title=%v mission=%v, want title dropped only", l.ShowTitle, l.ShowMission)
	}
}

func TestWidthThresholds(t *testing.T) {
	cases := []struct {
		w                     int
		hold, labels          bool
		next                  int
	}{
		{40, false, false, 3},
		{43, false, false, 3},
		{44, false, false, 5},
		{46, false, true, 5},
		{52, true, true, 5},
		{100, true, true, 5},
	}
	for _, c := range cases {
		l := Compute(c.w, 30)
		if l.ShowHold != c.hold || l.ShowStatLabels != c.labels || l.NextCount != c.next {
			t.Errorf("Compute(%d,30) = hold:%v labels:%v next:%d, want hold:%v labels:%v next:%d",
				c.w, l.ShowHold, l.ShowStatLabels, l.NextCount, c.hold, c.labels, c.next)
		}
	}
}

func TestNextPanelIsAlwaysBesideTheBoard(t *testing.T) {
	// §49.3: NEXT never stacks above or below the board.
	for _, w := range []int{40, 44, 52, 80, 200} {
		l := Compute(w, 30)
		if l.RightX < l.BoardX+BoardOuterW {
			t.Errorf("width %d: NEXT at x=%d overlaps the board ending at %d", w, l.RightX, l.BoardX+BoardOuterW)
		}
		if l.RightX+l.RightW > w {
			t.Errorf("width %d: NEXT spans past the right edge", w)
		}
	}
}

func TestPanelsNeverOverlapTheBoard(t *testing.T) {
	for _, c := range []struct{ w, h int }{{40, 24}, {50, 30}, {80, 40}, {300, 100}} {
		l := Compute(c.w, c.h)
		if l.TooSmall {
			t.Fatalf("Compute(%d,%d) unexpectedly too small", c.w, c.h)
		}
		if l.LeftX+l.LeftW > l.BoardX {
			t.Errorf("%dx%d: left panel ends at %d, board starts at %d", c.w, c.h, l.LeftX+l.LeftW, l.BoardX)
		}
		if l.LeftX < 0 {
			t.Errorf("%dx%d: left panel starts off-screen at %d", c.w, c.h, l.LeftX)
		}
	}
}

func TestEverythingStaysOnScreenAtAnyReasonableSize(t *testing.T) {
	// Review Focus 1 and 2: 0x0 through 300x100 must all produce sane layouts.
	for w := 0; w <= 300; w += 7 {
		for h := 0; h <= 100; h += 3 {
			l := Compute(w, h)
			if l.TooSmall {
				continue
			}
			if l.BoardX < 0 || l.BoardX+BoardOuterW > w {
				t.Fatalf("%dx%d: board x span %d..%d", w, h, l.BoardX, l.BoardX+BoardOuterW)
			}
			if l.BoardY < 0 || l.BoardY+BoardOuterH > h {
				t.Fatalf("%dx%d: board y span %d..%d", w, h, l.BoardY, l.BoardY+BoardOuterH)
			}
			if l.ControlsY >= h {
				t.Fatalf("%dx%d: controls row %d is off-screen", w, h, l.ControlsY)
			}
			if l.ShowMission && l.MissionY >= h {
				t.Fatalf("%dx%d: mission row %d is off-screen", w, h, l.MissionY)
			}
			if l.ShowTitle && (l.TitleY < 0 || l.TitleY >= h) {
				t.Fatalf("%dx%d: title row %d is off-screen", w, h, l.TitleY)
			}
			if l.ShowMission && l.MissionY < l.BoardY+BoardOuterH {
				t.Fatalf("%dx%d: mission row %d overlaps the board", w, h, l.MissionY)
			}
			if l.ControlsY <= l.BoardY+BoardOuterH-1 {
				t.Fatalf("%dx%d: controls row %d overlaps the board", w, h, l.ControlsY)
			}
		}
	}
}

func TestHugeTerminalCentresTheBlock(t *testing.T) {
	l := Compute(300, 100)
	if l.BoardX < 100 {
		t.Errorf("board x = %d on a 300-column terminal, want it roughly centred", l.BoardX)
	}
	if l.BoardY < 30 {
		t.Errorf("board y = %d on a 100-row terminal, want it roughly centred", l.BoardY)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/render/ -run TestBoardGeometry -v`
Expected: FAIL — `undefined: BoardInteriorW`.

- [ ] **Step 3: Write the implementation**

Create `internal/render/layout.go`:

```go
package render

import "cosmic-tetris/internal/game"

// Board geometry in terminal cells. One logical cell is two columns (§5).
const (
	BoardInteriorW = game.Width * 2
	BoardInteriorH = game.VisibleRows
	BoardOuterW    = BoardInteriorW + 2
	BoardOuterH    = BoardInteriorH + 2
)

// Minimum usable terminal (§31). At exactly this size the content is
// 8 + 22 + 10 = 40 columns and 22 + mission + controls = 24 rows, which is why
// these are the numbers.
const (
	MinWidth  = 40
	MinHeight = 24
)

// Width thresholds for optional chrome.
const (
	holdWidth       = 52
	statLabelsWidth = 46
	fullNextWidth   = 44
)

// Panel widths.
const (
	leftWidthLabelled = 10
	leftWidthBare     = 8
	rightWidth        = 10
)

// Layout is where every element goes for one terminal size. All coordinates are
// absolute terminal cells; BoardX, BoardY is the board's top-left border cell.
type Layout struct {
	W, H     int
	TooSmall bool

	BoardX, BoardY int

	LeftX, LeftW   int
	RightX, RightW int

	ShowTitle bool
	TitleY    int

	ShowMission bool
	MissionY    int

	ControlsY int

	ShowHold       bool
	ShowStatLabels bool
	NextCount      int
}

// Compute lays out one frame. Chrome is dropped in the §49.3 order as space runs
// out; below the minimum the caller shows the too-small notice instead.
func Compute(w, h int) Layout {
	l := Layout{W: w, H: h}
	if w < MinWidth || h < MinHeight {
		l.TooSmall = true
		return l
	}

	// Vertical budget: the board and the controls line are the last two things
	// standing (§49.3). Title goes first, then mission control.
	needed := BoardOuterH + 1
	l.ShowMission = h >= needed+1
	l.ShowTitle = h >= needed+2
	if l.ShowMission {
		needed++
	}
	if l.ShowTitle {
		needed++
	}
	top := (h - needed) / 2
	if top < 0 {
		top = 0
	}
	y := top
	if l.ShowTitle {
		l.TitleY = y
		y++
	}
	l.BoardY = y
	y += BoardOuterH
	if l.ShowMission {
		l.MissionY = y
		y++
	}
	l.ControlsY = y

	// Horizontal budget.
	l.ShowHold = w >= holdWidth
	l.ShowStatLabels = w >= statLabelsWidth
	l.NextCount = 3
	if w >= fullNextWidth {
		l.NextCount = 5
	}
	l.LeftW = leftWidthBare
	if l.ShowStatLabels {
		l.LeftW = leftWidthLabelled
	}
	l.RightW = rightWidth

	total := l.LeftW + BoardOuterW + l.RightW
	left := (w - total) / 2
	if left < 0 {
		left = 0
	}
	l.LeftX = left
	l.BoardX = left + l.LeftW
	l.RightX = l.BoardX + BoardOuterW
	return l
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/render/layout.go internal/render/layout_test.go
git commit -m "feat(render): responsive layout with the pinned drop order"
```

---

### Task 4: Board rendering — border, locked stack, ghost, active piece

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: `Canvas`, `Layout`, `Glyphs`, palette functions, `game.Snapshot`.
- Produces: `func DrawBorder(c *Canvas, l Layout, g Glyphs, colors [4]RGB)`; `func DrawStack(c *Canvas, l Layout, g Glyphs, s game.Snapshot)`; `func DrawGhost(c *Canvas, l Layout, g Glyphs, s game.Snapshot)`; `func DrawActive(c *Canvas, l Layout, g Glyphs, s game.Snapshot)`; `func boardCellXY(l Layout, x, y int) (int, int, bool)`.

`boardCellXY` maps a logical board cell to its top-left terminal column and row inside the border, returning `false` for the hidden spawn rows. Every board drawing routine goes through it, so the hidden rows can never leak on screen.

`colors` in `DrawBorder` is the four edge colours (top, right, bottom, left); Plan 3 animates them, and this plan passes four copies of one colour.

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

// fixtureSnapshot is a deterministic mid-game state used by board and frame tests.
func fixtureSnapshot() game.Snapshot {
	var b game.Board
	for x := 0; x < game.Width; x++ {
		if x != 4 {
			b.Cells[game.Height-1][x] = game.Cell{Filled: true, Kind: game.KindJ}
		}
	}
	b.Cells[game.Height-2][0] = game.Cell{Filled: true, Kind: game.KindT}
	b.Cells[game.Height-2][9] = game.Cell{Filled: true, Kind: game.KindS}
	// A block in the hidden rows: it must never appear on screen.
	b.Cells[1][0] = game.Cell{Filled: true, Kind: game.KindZ}

	return game.Snapshot{
		Board:    b,
		Active:   game.Piece{Kind: game.KindT, Rotation: 0, X: 3, Y: 6},
		GhostY:   game.Height - 4,
		HoldKind: game.KindO,
		HasHold:  true,
		Next:     []game.PieceKind{game.KindI, game.KindS, game.KindZ, game.KindL, game.KindJ},
		Score:    129340,
		Lines:    42,
		Level:    7,
		Combo:    2,
		Phase:    game.PhasePlaying,
		Seed:     0x7F3A,
	}
}

func drawBoardOnly(t *testing.T, w, h int, m Mode) (*Canvas, Layout) {
	t.Helper()
	l := Compute(w, h)
	if l.TooSmall {
		t.Fatalf("Compute(%d,%d) is too small", w, h)
	}
	g := GlyphsFor(m)
	c := NewCanvas(w, h)
	white := RGB{0xFF, 0xFF, 0xFF}
	DrawBorder(c, l, g, [4]RGB{white, white, white, white})
	s := fixtureSnapshot()
	DrawStack(c, l, g, s)
	DrawGhost(c, l, g, s)
	DrawActive(c, l, g, s)
	return c, l
}

func lines(c *Canvas) []string { return strings.Split(ansi.Strip(c.String()), "\n") }

func TestBoardInteriorIsTwentyByTwentyInEveryMode(t *testing.T) {
	// Review Focus 3: a glyph that is not two columns desyncs every x coordinate.
	for _, m := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		c, l := drawBoardOnly(t, 80, 30, m)
		rows := lines(c)
		g := GlyphsFor(m)

		top := rows[l.BoardY]
		interior := top[l.BoardX+1 : l.BoardX+1+BoardInteriorW]
		if want := strings.Repeat(g.BorderH, BoardInteriorW); interior != want {
			t.Errorf("%v: top border interior = %q, want %q", m, interior, want)
		}
		for i := 0; i < BoardInteriorH; i++ {
			row := rows[l.BoardY+1+i]
			if got := string([]rune(row)[l.BoardX]); got != g.BorderV {
				t.Errorf("%v: row %d left border = %q, want %q", m, i, got, g.BorderV)
			}
			if got := string([]rune(row)[l.BoardX+BoardOuterW-1]); got != g.BorderV {
				t.Errorf("%v: row %d right border = %q, want %q", m, i, got, g.BorderV)
			}
		}
		bottom := []rune(rows[l.BoardY+BoardOuterH-1])
		if got := string(bottom[l.BoardX]); got != g.BorderBL {
			t.Errorf("%v: bottom-left corner = %q, want %q", m, got, g.BorderBL)
		}
	}
}

func TestBorderCornersAreCorrect(t *testing.T) {
	c, l := drawBoardOnly(t, 80, 30, ModeFull)
	rows := lines(c)
	g := GlyphsFor(ModeFull)
	top := []rune(rows[l.BoardY])
	bot := []rune(rows[l.BoardY+BoardOuterH-1])
	checks := []struct {
		name string
		got  string
		want string
	}{
		{"top-left", string(top[l.BoardX]), g.BorderTL},
		{"top-right", string(top[l.BoardX+BoardOuterW-1]), g.BorderTR},
		{"bottom-left", string(bot[l.BoardX]), g.BorderBL},
		{"bottom-right", string(bot[l.BoardX+BoardOuterW-1]), g.BorderBR},
	}
	for _, c := range checks {
		if c.got != c.want {
			t.Errorf("%s = %q, want %q", c.name, c.got, c.want)
		}
	}
}

func TestLockedCellsRenderAsBlockPairs(t *testing.T) {
	c, l := drawBoardOnly(t, 80, 30, ModeFull)
	rows := lines(c)
	g := GlyphsFor(ModeFull)
	// Bottom board row is visible row 19, one row above the bottom border.
	bottom := []rune(rows[l.BoardY+BoardOuterH-2])
	// Column 0 is filled, column 4 is the gap.
	if got := string(bottom[l.BoardX+1 : l.BoardX+3]); got != g.Block {
		t.Errorf("filled cell = %q, want %q", got, g.Block)
	}
	if got := string(bottom[l.BoardX+1+8 : l.BoardX+1+10]); got != g.Empty {
		t.Errorf("empty cell at column 4 = %q, want %q", got, g.Empty)
	}
}

func TestHiddenSpawnRowsAreNeverDrawn(t *testing.T) {
	c, l := drawBoardOnly(t, 80, 30, ModeFull)
	rows := lines(c)
	g := GlyphsFor(ModeFull)
	// The fixture puts a Z block at board row 1, which is hidden.
	first := []rune(rows[l.BoardY+1])
	if got := string(first[l.BoardX+1 : l.BoardX+3]); got == g.Block {
		t.Error("a hidden spawn row block leaked into the visible board")
	}
}

func TestBoardCellXYRejectsHiddenRows(t *testing.T) {
	l := Compute(80, 30)
	for y := 0; y < game.HiddenRows; y++ {
		if _, _, ok := boardCellXY(l, 0, y); ok {
			t.Errorf("board row %d should not be visible", y)
		}
	}
	if _, _, ok := boardCellXY(l, 0, game.HiddenRows); !ok {
		t.Errorf("board row %d should be the first visible row", game.HiddenRows)
	}
	x, y, ok := boardCellXY(l, 0, game.Height-1)
	if !ok {
		t.Fatal("bottom row should be visible")
	}
	if x != l.BoardX+1 || y != l.BoardY+BoardOuterH-2 {
		t.Errorf("bottom-left cell at (%d,%d), want (%d,%d)", x, y, l.BoardX+1, l.BoardY+BoardOuterH-2)
	}
}

func TestActivePieceIsDrawnAtItsPosition(t *testing.T) {
	c, l := drawBoardOnly(t, 80, 30, ModeFull)
	rows := lines(c)
	g := GlyphsFor(ModeFull)
	s := fixtureSnapshot()
	for _, cell := range s.Active.Cells() {
		cx, cy, ok := boardCellXY(l, cell.X, cell.Y)
		if !ok {
			continue
		}
		got := string([]rune(rows[cy])[cx : cx+2])
		if got != g.Block {
			t.Errorf("active cell %v renders as %q, want %q", cell, got, g.Block)
		}
	}
}

func TestGhostIsDrawnBelowAndNeverOverLockedBlocks(t *testing.T) {
	c, l := drawBoardOnly(t, 80, 30, ModeFull)
	rows := lines(c)
	g := GlyphsFor(ModeFull)
	s := fixtureSnapshot()

	ghost := s.Active
	ghost.Y = s.GhostY
	found := 0
	for _, cell := range ghost.Cells() {
		cx, cy, ok := boardCellXY(l, cell.X, cell.Y)
		if !ok {
			continue
		}
		if got := string([]rune(rows[cy])[cx : cx+2]); got == g.Ghost {
			found++
		}
	}
	if found == 0 {
		t.Fatalf("no ghost glyphs %q found on the board", g.Ghost)
	}

	// Locked blocks keep their glyph: the ghost must never obscure them (§10).
	bottom := []rune(rows[l.BoardY+BoardOuterH-1-1])
	if got := string(bottom[l.BoardX+1 : l.BoardX+3]); got != g.Block {
		t.Errorf("locked cell overwritten by ghost: %q", got)
	}
}

func TestActivePieceIsDrawnOverTheGhost(t *testing.T) {
	// §44: never obscure the active piece.
	l := Compute(80, 30)
	g := GlyphsFor(ModeFull)
	c := NewCanvas(80, 30)
	s := fixtureSnapshot()
	s.GhostY = s.Active.Y // force a total overlap
	DrawGhost(c, l, g, s)
	DrawActive(c, l, g, s)
	rows := lines(c)
	cell := s.Active.Cells()[0]
	cx, cy, _ := boardCellXY(l, cell.X, cell.Y)
	if got := string([]rune(rows[cy])[cx : cx+2]); got != g.Block {
		t.Errorf("overlapping cell = %q, want the active block %q", got, g.Block)
	}
}

func TestActivePieceAboveTheVisibleAreaDoesNotPanic(t *testing.T) {
	l := Compute(80, 30)
	g := GlyphsFor(ModeFull)
	c := NewCanvas(80, 30)
	s := fixtureSnapshot()
	s.Active = game.Piece{Kind: game.KindI, Rotation: 1, X: 3, Y: -4}
	s.GhostY = -4
	DrawStack(c, l, g, s)
	DrawGhost(c, l, g, s)
	DrawActive(c, l, g, s)
	if len(lines(c)) != 30 {
		t.Fatal("canvas geometry disturbed")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/render/ -run TestBoardInterior -v`
Expected: FAIL — `undefined: DrawBorder`.

- [ ] **Step 3: Write the implementation**

Create `internal/render/board.go`:

```go
package render

import "cosmic-tetris/internal/game"

// boardCellXY maps logical board cell x, y to the terminal column and row of its
// left-hand glyph column, inside the border. ok is false for the hidden spawn
// rows and for anything off the board, so hidden rows can never leak on screen.
func boardCellXY(l Layout, x, y int) (int, int, bool) {
	if x < 0 || x >= game.Width || y < game.HiddenRows || y >= game.Height {
		return 0, 0, false
	}
	return l.BoardX + 1 + x*2, l.BoardY + 1 + (y - game.HiddenRows), true
}

// DrawBorder draws the board's frame (§25). colors are the top, right, bottom
// and left edge colours; Plan 3 animates them independently.
func DrawBorder(c *Canvas, l Layout, g Glyphs, colors [4]RGB) {
	top, right, bottom, left := Paint{FG: colors[0]}, Paint{FG: colors[1]}, Paint{FG: colors[2]}, Paint{FG: colors[3]}
	x0, y0 := l.BoardX, l.BoardY
	x1, y1 := x0+BoardOuterW-1, y0+BoardOuterH-1

	c.SetString(x0, y0, g.BorderTL, top)
	c.SetString(x1, y0, g.BorderTR, top)
	c.SetString(x0, y1, g.BorderBL, bottom)
	c.SetString(x1, y1, g.BorderBR, bottom)
	for x := x0 + 1; x < x1; x++ {
		c.SetString(x, y0, g.BorderH, top)
		c.SetString(x, y1, g.BorderH, bottom)
	}
	for y := y0 + 1; y < y1; y++ {
		c.SetString(x0, y, g.BorderV, left)
		c.SetString(x1, y, g.BorderV, right)
	}
}

// DrawStack draws the locked blocks and the empty interior.
func DrawStack(c *Canvas, l Layout, g Glyphs, s game.Snapshot) {
	for y := game.HiddenRows; y < game.Height; y++ {
		for x := 0; x < game.Width; x++ {
			cx, cy, ok := boardCellXY(l, x, y)
			if !ok {
				continue
			}
			if cell := s.Board.Cells[y][x]; cell.Filled {
				c.SetString(cx, cy, g.Block, LockedPaint(cell.Kind))
			} else {
				c.SetString(cx, cy, g.Empty, Paint{})
			}
		}
	}
}

// DrawGhost draws the landing preview underneath the active piece (§10). It only
// writes to cells that are currently empty, so it can never obscure a locked block.
func DrawGhost(c *Canvas, l Layout, g Glyphs, s game.Snapshot) {
	ghost := s.Active
	ghost.Y = s.GhostY
	paint := GhostPaint()
	for _, cell := range ghost.Cells() {
		if cell.X < 0 || cell.X >= game.Width || cell.Y < 0 || cell.Y >= game.Height {
			continue
		}
		if s.Board.Cells[cell.Y][cell.X].Filled {
			continue
		}
		cx, cy, ok := boardCellXY(l, cell.X, cell.Y)
		if !ok {
			continue
		}
		c.SetString(cx, cy, g.Ghost, paint)
	}
}

// DrawActive draws the falling piece, one step brighter than the stack (§49.4).
// It is drawn last of the board layers, because nothing may obscure it (§44).
func DrawActive(c *Canvas, l Layout, g Glyphs, s game.Snapshot) {
	paint := ActivePaint(s.Active.Kind)
	for _, cell := range s.Active.Cells() {
		cx, cy, ok := boardCellXY(l, cell.X, cell.Y)
		if !ok {
			continue
		}
		c.SetString(cx, cy, g.Block, paint)
	}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): board border, locked stack, ghost and active piece"
```

---

### Task 5: HUD — hold, next, stats, title, mission line, controls

**Files:**
- Create: `internal/render/hud.go`
- Test: `internal/render/hud_test.go`

**Interfaces:**
- Consumes: `Canvas`, `Layout`, `Glyphs`, palette, `game.Snapshot`.
- Produces: `func DrawTitle(c *Canvas, l Layout, seed int64)`; `func DrawLeftPanel(c *Canvas, l Layout, g Glyphs, s game.Snapshot)`; `func DrawNextPanel(c *Canvas, l Layout, g Glyphs, s game.Snapshot)`; `func DrawMission(c *Canvas, l Layout, msg string)`; `func DrawControls(c *Canvas, l Layout)`; `func FormatScore(n int) string`; `func FormatLines(n int) string`; `func FormatLevel(n int) string`; `func UniverseLabel(seed int64) string`.

Field widths, and the rule that keeps Review Focus 4 honest: `FormatScore` renders `%08d`; anything that would exceed 10 characters is clamped to `9999999999`. Clamping is display-only — the engine keeps counting. `FormatLines` is `%03d` clamped to 5 characters, `FormatLevel` is `%02d` clamped to 3. No formatter may ever return a string longer than the panel is wide.

- [ ] **Step 1: Write the failing test**

Create `internal/render/hud_test.go`:

```go
package render

import (
	"strings"
	"testing"

	"cosmic-tetris/internal/game"
)

func TestFormatScorePadsToEightDigits(t *testing.T) {
	cases := []struct{ in int; want string }{
		{0, "00000000"},
		{129340, "00129340"},
		{483200, "00483200"},
		{99999999, "99999999"},
		{100000000, "100000000"},
		{9999999999, "9999999999"},
	}
	for _, c := range cases {
		if got := FormatScore(c.in); got != c.want {
			t.Errorf("FormatScore(%d) = %q, want %q", c.in, got, c.want)
		}
	}
}

func TestFormattersNeverExceedTheirField(t *testing.T) {
	// Review Focus 4: an absurd score must not widen the panel and shove the board.
	for _, n := range []int{0, 1, 999, 1 << 20, 1 << 40, 1 << 62} {
		if got := FormatScore(n); len(got) > 10 {
			t.Errorf("FormatScore(%d) = %q is %d chars, want at most 10", n, got, len(got))
		}
		if got := FormatLines(n); len(got) > 5 {
			t.Errorf("FormatLines(%d) = %q is %d chars, want at most 5", n, got, len(got))
		}
		if got := FormatLevel(n); len(got) > 3 {
			t.Errorf("FormatLevel(%d) = %q is %d chars, want at most 3", n, got, len(got))
		}
	}
	for _, n := range []int{-1, -99999} {
		if got := FormatScore(n); len(got) > 10 {
			t.Errorf("FormatScore(%d) = %q, want a bounded field", n, got)
		}
	}
}

func TestFormatLinesAndLevel(t *testing.T) {
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

func TestUniverseLabelUsesTheSeed(t *testing.T) {
	if got, want := UniverseLabel(0x7F3A), "LOCAL UNIVERSE 7F3A"; got != want {
		t.Errorf("UniverseLabel = %q, want %q", got, want)
	}
	if got := UniverseLabel(8675309); len(got) != len("LOCAL UNIVERSE 7F3A") {
		t.Errorf("UniverseLabel(%d) = %q, want a fixed width", 8675309, got)
	}
}

func drawHUD(t *testing.T, w, h int) (*Canvas, Layout) {
	t.Helper()
	l := Compute(w, h)
	if l.TooSmall {
		t.Fatalf("Compute(%d,%d) too small", w, h)
	}
	g := GlyphsFor(ModeFull)
	c := NewCanvas(w, h)
	s := fixtureSnapshot()
	if l.ShowTitle {
		DrawTitle(c, l, s.Seed)
	}
	DrawLeftPanel(c, l, g, s)
	DrawNextPanel(c, l, g, s)
	if l.ShowMission {
		DrawMission(c, l, "GRAVITY TAX INCREASED")
	}
	DrawControls(c, l)
	return c, l
}

func TestWideHUDShowsEverything(t *testing.T) {
	c, l := drawHUD(t, 80, 30)
	out := strings.Join(lines(c), "\n")
	for _, want := range []string{"COSMIC TETRIS", "LOCAL UNIVERSE 7F3A", "HOLD", "NEXT", "SCORE", "00129340", "LINES", "042", "LEVEL", "07", "GRAVITY TAX INCREASED"} {
		if !strings.Contains(out, want) {
			t.Errorf("wide HUD is missing %q", want)
		}
	}
	if !l.ShowHold {
		t.Error("wide layout should show HOLD")
	}
}

func TestNarrowHUDDropsLabelsButKeepsValues(t *testing.T) {
	// §49.3: values stay, labels go — "042" not "LINES 042".
	c, _ := drawHUD(t, 40, 24)
	out := strings.Join(lines(c), "\n")
	if strings.Contains(out, "LINES") || strings.Contains(out, "SCORE") || strings.Contains(out, "LEVEL") {
		t.Errorf("narrow HUD still has stat labels:\n%s", out)
	}
	for _, want := range []string{"00129340", "042", "07"} {
		if !strings.Contains(out, want) {
			t.Errorf("narrow HUD is missing the value %q", want)
		}
	}
	if strings.Contains(out, "HOLD") {
		t.Error("narrow HUD should not show the HOLD panel")
	}
}

func TestNextPanelShowsTheRequestedCount(t *testing.T) {
	g := GlyphsFor(ModeFull)
	for _, c := range []struct{ w, want int }{{80, 5}, {40, 3}} {
		l := Compute(c.w, 30)
		cv := NewCanvas(c.w, 30)
		DrawNextPanel(cv, l, g, fixtureSnapshot())
		rows := lines(cv)
		blocks := 0
		for _, row := range rows {
			r := []rune(row)
			if len(r) < l.RightX+l.RightW {
				continue
			}
			if strings.Contains(string(r[l.RightX:l.RightX+l.RightW]), g.Block) {
				blocks++
			}
		}
		// Each queued piece occupies two rows of art.
		if blocks < c.want*2-2 || blocks > c.want*2 {
			t.Errorf("width %d: %d block rows in NEXT, want about %d for %d pieces", c.w, blocks, c.want*2, c.want)
		}
	}
}

func TestNextPanelToleratesAShortQueue(t *testing.T) {
	l := Compute(80, 30)
	g := GlyphsFor(ModeFull)
	c := NewCanvas(80, 30)
	s := fixtureSnapshot()
	s.Next = nil
	DrawNextPanel(c, l, g, s)
	s.Next = []game.PieceKind{game.KindI}
	DrawNextPanel(c, l, g, s)
	if len(lines(c)) != 30 {
		t.Fatal("canvas geometry disturbed")
	}
}

func TestHoldPanelIsEmptyWhenNothingIsHeld(t *testing.T) {
	l := Compute(80, 30)
	g := GlyphsFor(ModeFull)
	c := NewCanvas(80, 30)
	s := fixtureSnapshot()
	s.HasHold = false
	DrawLeftPanel(c, l, g, s)
	out := strings.Join(lines(c), "\n")
	if !strings.Contains(out, "HOLD") {
		t.Error("HOLD label should still be drawn with an empty slot")
	}
}

func TestHUDNeverWritesIntoTheBoardColumns(t *testing.T) {
	for _, size := range []struct{ w, h int }{{40, 24}, {52, 26}, {80, 30}, {200, 60}} {
		c, l := drawHUD(t, size.w, size.h)
		for y, row := range lines(c) {
			if y < l.BoardY || y >= l.BoardY+BoardOuterH {
				continue
			}
			r := []rune(row)
			if len(r) < l.BoardX+BoardOuterW {
				continue
			}
			span := strings.TrimSpace(string(r[l.BoardX : l.BoardX+BoardOuterW]))
			if span != "" {
				t.Errorf("%dx%d row %d: HUD wrote %q into the board's columns", size.w, size.h, y, span)
			}
		}
	}
}

func TestControlsLineListsThePrimaryKeys(t *testing.T) {
	c, l := drawHUD(t, 80, 30)
	row := lines(c)[l.ControlsY]
	for _, want := range []string{"move", "rotate", "YEET", "hold", "help"} {
		if !strings.Contains(row, want) {
			t.Errorf("controls line %q is missing %q", row, want)
		}
	}
}

func TestControlsAndMissionLinesFitTheTerminal(t *testing.T) {
	for _, size := range []struct{ w, h int }{{40, 24}, {46, 25}, {80, 30}} {
		c, l := drawHUD(t, size.w, size.h)
		rows := lines(c)
		if got := len([]rune(rows[l.ControlsY])); got != size.w {
			t.Errorf("%dx%d: controls row is %d columns, want %d", size.w, size.h, got, size.w)
		}
		if l.ShowMission {
			if got := len([]rune(rows[l.MissionY])); got != size.w {
				t.Errorf("%dx%d: mission row is %d columns, want %d", size.w, size.h, got, size.w)
			}
		}
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/render/ -run TestFormatScore -v`
Expected: FAIL — `undefined: FormatScore`.

- [ ] **Step 3: Write the implementation**

Create `internal/render/hud.go`:

```go
package render

import (
	"fmt"
	"strings"

	"cosmic-tetris/internal/game"
)

// Field widths. No formatter may return more than these, or the panel widens and
// shoves the board sideways.
const (
	scoreField = 10
	linesField = 5
	levelField = 3
)

var (
	labelPaint  = Paint{FG: RGB{0x7A, 0x86, 0xB8}}
	valuePaint  = Paint{FG: RGB{0xE6, 0xEE, 0xFF}, Bold: true}
	titlePaint  = Paint{FG: RGB{0xF2, 0xF6, 0xFF}, Bold: true}
	chromePaint = Paint{FG: RGB{0x5B, 0x64, 0x8C}}
	missionPain = Paint{FG: RGB{0x9A, 0xE8, 0xF5}}
)

// clampField truncates s so it never exceeds n characters.
func clampField(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return strings.Repeat("9", n)
}

// FormatScore renders the score zero-padded to eight digits, clamped to the
// field width. Clamping is display-only; the engine keeps counting (§45's
// "NUMBER BECAME BIGGER" is the joke that covers this).
func FormatScore(n int) string {
	if n < 0 {
		n = 0
	}
	return clampField(fmt.Sprintf("%08d", n), scoreField)
}

// FormatLines renders cleared lines, zero-padded to three digits.
func FormatLines(n int) string {
	if n < 0 {
		n = 0
	}
	return clampField(fmt.Sprintf("%03d", n), linesField)
}

// FormatLevel renders the level, zero-padded to two digits.
func FormatLevel(n int) string {
	if n < 0 {
		n = 0
	}
	return clampField(fmt.Sprintf("%02d", n), levelField)
}

// UniverseLabel is the seed dressed up as a location (§4).
func UniverseLabel(seed int64) string {
	return fmt.Sprintf("LOCAL UNIVERSE %04X", uint16(seed))
}

// DrawTitle draws the top chrome line.
func DrawTitle(c *Canvas, l Layout, seed int64) {
	left := "✦ COSMIC TETRIS"
	right := UniverseLabel(seed)
	c.SetString(l.LeftX, l.TitleY, left, titlePaint)
	x := l.W - len(right)
	if x < l.LeftX+len(left)+2 {
		return // no room for the universe label; the title alone is enough
	}
	c.SetString(x, l.TitleY, right, chromePaint)
}

// pieceArt returns the two rows of glyphs that preview a piece in a panel.
func pieceArt(g Glyphs, k game.PieceKind) [2]string {
	var rows [2]string
	p := game.Piece{Kind: k, Rotation: 0}
	for row := 0; row < 2; row++ {
		var b strings.Builder
		for col := 0; col < 4; col++ {
			filled := false
			for _, cell := range p.Cells() {
				if cell.X == col && cell.Y == row {
					filled = true
				}
			}
			if filled {
				b.WriteString(g.Block)
			} else {
				b.WriteString(g.Empty)
			}
		}
		rows[row] = b.String()
	}
	return rows
}

// DrawLeftPanel draws HOLD (when it fits) and the score, lines and level values.
// Labels are dropped on narrow terminals; the values always stay (§49.3).
func DrawLeftPanel(c *Canvas, l Layout, g Glyphs, s game.Snapshot) {
	y := l.BoardY
	if l.ShowHold {
		c.SetString(l.LeftX, y, "HOLD", labelPaint)
		art := [2]string{strings.Repeat(g.Empty, 4), strings.Repeat(g.Empty, 4)}
		if s.HasHold {
			art = pieceArt(g, s.HoldKind)
		}
		paint := Paint{}
		if s.HasHold {
			paint = LockedPaint(s.HoldKind)
		}
		c.SetString(l.LeftX, y+1, art[0], paint)
		c.SetString(l.LeftX, y+2, art[1], paint)
		y += 5
	} else {
		y += 1
	}

	stats := []struct {
		label string
		value string
	}{
		{"SCORE", FormatScore(s.Score)},
		{"LINES", FormatLines(s.Lines)},
		{"LEVEL", FormatLevel(s.Level)},
	}
	for _, st := range stats {
		if l.ShowStatLabels {
			c.SetString(l.LeftX, y, st.label, labelPaint)
			y++
		}
		c.SetString(l.LeftX, y, st.value, valuePaint)
		y += 2
	}
}

// DrawNextPanel draws the upcoming pieces beside the board. It never stacks
// above or below the board (§49.3).
func DrawNextPanel(c *Canvas, l Layout, g Glyphs, s game.Snapshot) {
	x := l.RightX + 1
	c.SetString(x, l.BoardY, "NEXT", labelPaint)
	y := l.BoardY + 1
	for i := 0; i < l.NextCount && i < len(s.Next); i++ {
		k := s.Next[i]
		art := pieceArt(g, k)
		paint := LockedPaint(k)
		if i == 0 {
			paint = ActivePaint(k)
		}
		c.SetString(x, y, art[0], paint)
		c.SetString(x, y+1, art[1], paint)
		y += 3
	}
}

// DrawMission draws the one-line status channel (§27).
func DrawMission(c *Canvas, l Layout, msg string) {
	line := "☄ MISSION CONTROL: " + msg
	if len(line) > l.W {
		line = line[:l.W]
	}
	c.SetString(l.LeftX, l.MissionY, line, missionPain)
}

// DrawControls draws the key hint line (§4).
func DrawControls(c *Canvas, l Layout) {
	full := "←→ move   ↑ rotate   ↓ descend   SPACE YEET   C hold   ? help"
	short := "←→ ↑ ↓  SPACE YEET  C hold  ? help"
	line := full
	if len([]rune(line)) > l.W {
		line = short
	}
	if len([]rune(line)) > l.W {
		line = string([]rune(line)[:l.W])
	}
	c.SetString(l.LeftX, l.ControlsY, line, chromePaint)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS. If `TestHUDNeverWritesIntoTheBoardColumns` fails at 40 columns, the panel widths in `layout.go` and the strings here disagree — shorten the strings, do not widen the panels.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/render/hud.go internal/render/hud_test.go
git commit -m "feat(render): HUD panels, stats, mission line and controls"
```

---

### Task 6: The frame renderer and golden layout tests

**Files:**
- Create: `internal/render/render.go`
- Test: `internal/render/render_test.go`
- Create: `internal/render/testdata/` (golden files, generated in Step 5)

**Interfaces:**
- Consumes: everything in `render` so far.
- Produces: `type Screen uint8` with `ScreenBoot`, `ScreenPlaying`, `ScreenPaused`, `ScreenHelp`, `ScreenGameOver`; `type View struct{ Width, Height int; Screen Screen; Snapshot game.Snapshot; Mission string; Keys []KeyHint }`; `type KeyHint struct{ Keys, Desc string }`; `type Renderer struct{ ... }`; `func NewRenderer(m Mode) *Renderer`; `func (r *Renderer) SetMode(m Mode)`; `func (r *Renderer) Mode() Mode`; `func (r *Renderer) Render(v View) string`.

Plan 3 adds an `FX *fx.World` field to `View` and an FX compositing step to `Render`. Nothing else about this file changes.

- [ ] **Step 1: Write the failing test**

Create `internal/render/render_test.go`:

```go
package render

import (
	"flag"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"unicode/utf8"

	"github.com/charmbracelet/x/ansi"
)

var updateGolden = flag.Bool("update", false, "rewrite golden files")

// assertGolden compares ANSI-stripped output against testdata/<name>.golden.
func assertGolden(t *testing.T, name, got string) {
	t.Helper()
	path := filepath.Join("testdata", name+".golden")
	if *updateGolden {
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
		t.Fatalf("%v (run: go test ./internal/render/ -update)", err)
	}
	if got != string(want) {
		t.Errorf("golden %s mismatch.\n--- got ---\n%s\n--- want ---\n%s", name, got, want)
	}
}

func testView(w, h int, screen Screen) View {
	return View{
		Width:    w,
		Height:   h,
		Screen:   screen,
		Snapshot: fixtureSnapshot(),
		Mission:  "GRAVITY REMAINS MOSTLY LEGAL",
		Keys:     testKeyHints(),
	}
}

func testKeyHints() []KeyHint {
	return []KeyHint{
		{"← → / h l", "move spacecraft"},
		{"↓ / j", "accelerate doom"},
		{"↑ / k / x", "rotate geometry"},
		{"z", "rotate other way"},
		{"SPACE", "YEET"},
		{"c", "quantum storage"},
		{"p", "suspend spacetime"},
		{"r", "reboot universe"},
		{"q", "abandon mission"},
		{"?", "close this nonsense"},
	}
}

func render(t *testing.T, m Mode, v View) string {
	t.Helper()
	return ansi.Strip(NewRenderer(m).Render(v))
}

func TestFrameHasExactlyTerminalGeometry(t *testing.T) {
	for _, size := range []struct{ w, h int }{{40, 24}, {46, 25}, {64, 28}, {80, 30}, {120, 40}, {300, 100}} {
		out := render(t, ModeFull, testView(size.w, size.h, ScreenPlaying))
		rows := strings.Split(out, "\n")
		if len(rows) != size.h {
			t.Errorf("%dx%d: %d rows, want %d", size.w, size.h, len(rows), size.h)
		}
		for i, row := range rows {
			if n := utf8.RuneCountInString(row); n != size.w {
				t.Errorf("%dx%d: row %d is %d columns, want %d", size.w, size.h, i, n, size.w)
			}
		}
	}
}

func TestTooSmallTerminalShowsTheNotice(t *testing.T) {
	// Review Focus 1: 0x0 and 1x1 happen for real during startup and dragging.
	for _, size := range []struct{ w, h int }{{34, 19}, {39, 23}, {10, 5}, {1, 1}, {0, 0}} {
		out := render(t, ModeFull, testView(size.w, size.h, ScreenPlaying))
		if size.w >= 20 && size.h >= 4 {
			if !strings.Contains(out, "THIS UNIVERSE IS TOO SMALL") {
				t.Errorf("%dx%d: notice missing from:\n%s", size.w, size.h, out)
			}
			if !strings.Contains(out, "resize terminal to continue") {
				t.Errorf("%dx%d: resize hint missing", size.w, size.h)
			}
			if !strings.Contains(out, "current:") || !strings.Contains(out, "needed:") {
				t.Errorf("%dx%d: current/needed lines missing from:\n%s", size.w, size.h, out)
			}
		}
		rows := strings.Split(out, "\n")
		if size.h > 0 && len(rows) != size.h {
			t.Errorf("%dx%d: %d rows, want %d", size.w, size.h, len(rows), size.h)
		}
	}
}

func TestTooSmallNoticeReportsTheActualSize(t *testing.T) {
	out := render(t, ModeFull, testView(34, 19, ScreenPlaying))
	if !strings.Contains(out, "34") || !strings.Contains(out, "19") {
		t.Errorf("notice does not report the current size:\n%s", out)
	}
	if !strings.Contains(out, "40") || !strings.Contains(out, "24") {
		t.Errorf("notice does not report the needed size:\n%s", out)
	}
}

func TestZeroSizedRenderDoesNotPanic(t *testing.T) {
	for _, size := range []struct{ w, h int }{{0, 0}, {0, 30}, {80, 0}, {-3, -3}} {
		_ = NewRenderer(ModeFull).Render(testView(size.w, size.h, ScreenPlaying))
	}
}

func TestRendererIsReusableAcrossSizes(t *testing.T) {
	// The canvas is reused frame to frame; a shrink must not leave stale cells.
	r := NewRenderer(ModeFull)
	_ = r.Render(testView(120, 40, ScreenPlaying))
	out := ansi.Strip(r.Render(testView(40, 24, ScreenPlaying)))
	rows := strings.Split(out, "\n")
	if len(rows) != 24 {
		t.Fatalf("%d rows after shrinking, want 24", len(rows))
	}
	for i, row := range rows {
		if n := utf8.RuneCountInString(row); n != 40 {
			t.Fatalf("row %d is %d columns after shrinking, want 40", i, n)
		}
	}
}

func TestRenderDoesNotMutateTheSnapshot(t *testing.T) {
	v := testView(80, 30, ScreenPlaying)
	before := v.Snapshot
	_ = NewRenderer(ModeFull).Render(v)
	if v.Snapshot.Score != before.Score || v.Snapshot.Active != before.Active ||
		v.Snapshot.Board != before.Board || v.Snapshot.Level != before.Level {
		t.Error("Render mutated its input snapshot (§37)")
	}
}

func TestGoldenWideLayout(t *testing.T) {
	assertGolden(t, "wide", render(t, ModeFull, testView(80, 30, ScreenPlaying)))
}

func TestGoldenMediumLayout(t *testing.T) {
	assertGolden(t, "medium", render(t, ModeFull, testView(50, 26, ScreenPlaying)))
}

func TestGoldenSmallLayout(t *testing.T) {
	assertGolden(t, "small", render(t, ModeFull, testView(40, 24, ScreenPlaying)))
}

func TestGoldenTooSmall(t *testing.T) {
	assertGolden(t, "too-small", render(t, ModeFull, testView(34, 19, ScreenPlaying)))
}

func TestGoldenASCIIMode(t *testing.T) {
	assertGolden(t, "ascii", render(t, ModeASCII, testView(80, 30, ScreenPlaying)))
}

func TestASCIIGoldenIsPureASCII(t *testing.T) {
	out := render(t, ModeASCII, testView(80, 30, ScreenPlaying))
	for i, r := range out {
		if r > 0x7F {
			t.Fatalf("byte %d of ASCII-mode output is non-ASCII: %q", i, r)
		}
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/render/ -run TestFrameHasExactly -v`
Expected: FAIL — `undefined: NewRenderer`.

- [ ] **Step 3: Write the implementation**

Create `internal/render/render.go`:

```go
package render

import (
	"fmt"

	"cosmic-tetris/internal/game"
)

// Screen is which of the game's faces is showing. It lives in render rather than
// app so that render does not have to import app.
type Screen uint8

const (
	ScreenBoot Screen = iota
	ScreenPlaying
	ScreenPaused
	ScreenHelp
	ScreenGameOver
)

// KeyHint is one row of the flight manual (§39).
type KeyHint struct {
	Keys string
	Desc string
}

// View is everything the renderer needs for one frame. It carries a
// game.Snapshot by value, so rendering cannot touch game state (§37).
type View struct {
	Width, Height int
	Screen        Screen
	Snapshot      game.Snapshot
	Mission       string
	Keys          []KeyHint
}

// Renderer draws frames. It reuses one canvas across frames (§38).
type Renderer struct {
	mode   Mode
	glyphs Glyphs
	canvas *Canvas
}

// NewRenderer returns a renderer for a rendering mode.
func NewRenderer(m Mode) *Renderer {
	return &Renderer{mode: m, glyphs: GlyphsFor(m), canvas: NewCanvas(0, 0)}
}

// SetMode switches rendering mode, e.g. once the colour profile is known.
func (r *Renderer) SetMode(m Mode) {
	r.mode = m
	r.glyphs = GlyphsFor(m)
}

// Mode reports the current rendering mode.
func (r *Renderer) Mode() Mode { return r.mode }

// Render draws one frame and returns the styled string. The pipeline follows
// §37: layout, board, HUD, banners, mission control, controls. Plan 3 inserts
// the starfield and FX compositing steps into the same order.
func (r *Renderer) Render(v View) string {
	if w, h := r.canvas.Size(); w != v.Width || h != v.Height {
		r.canvas.Resize(v.Width, v.Height)
	} else {
		r.canvas.Clear()
	}

	l := Compute(v.Width, v.Height)
	if l.TooSmall {
		drawTooSmall(r.canvas, v.Width, v.Height)
		return r.canvas.String()
	}

	border := BorderPalette[1]
	DrawBorder(r.canvas, l, r.glyphs, [4]RGB{border, border, border, border})
	DrawStack(r.canvas, l, r.glyphs, v.Snapshot)
	DrawGhost(r.canvas, l, r.glyphs, v.Snapshot)
	DrawActive(r.canvas, l, r.glyphs, v.Snapshot)

	if l.ShowTitle {
		DrawTitle(r.canvas, l, v.Snapshot.Seed)
	}
	DrawLeftPanel(r.canvas, l, r.glyphs, v.Snapshot)
	DrawNextPanel(r.canvas, l, r.glyphs, v.Snapshot)
	if l.ShowMission {
		DrawMission(r.canvas, l, v.Mission)
	}
	DrawControls(r.canvas, l)

	drawOverlay(r.canvas, l, v)

	return r.canvas.String()
}

// drawTooSmall renders the §31 notice, centred as well as the space allows.
func drawTooSmall(c *Canvas, w, h int) {
	msg := []string{
		"THIS UNIVERSE IS TOO SMALL",
		"",
		"resize terminal to continue",
		"",
		fmt.Sprintf("current: %d × %d", w, h),
		fmt.Sprintf("needed: approximately %d × %d", MinWidth, MinHeight),
	}
	paint := Paint{FG: RGB{0xF2, 0xF6, 0xFF}, Bold: true}
	top := (h - len(msg)) / 2
	if top < 0 {
		top = 0
	}
	for i, line := range msg {
		x := (w - len([]rune(line))) / 2
		if x < 0 {
			x = 0
		}
		c.SetString(x, top+i, line, paint)
	}
}
```

`drawOverlay` is defined in Task 7. To keep this task's tests green now, add a temporary definition at the bottom of `render.go` and move it to `overlays.go` in Task 7:

```go
// drawOverlay draws the pause, help and game-over panels. Task 7 fills this in.
func drawOverlay(c *Canvas, l Layout, v View) {}
```

Note: `drawTooSmall` uses `×` (U+00D7), matching §31's copy. That means the too-small notice is the one non-ASCII string in ASCII mode. Replace it with `x` when `MinWidth`-era ASCII purity matters — Task 6's `TestASCIIGoldenIsPureASCII` only renders a fitting terminal, and Plan 4 Task 4 extends the purity check to the notice. Use `fmt.Sprintf("current: %d x %d", w, h)` with a plain `x` now, so ASCII purity holds everywhere.

- [ ] **Step 4: Run the geometry tests**

Run: `go test ./internal/render/ -run 'TestFrame|TestTooSmall|TestZeroSized|TestRendererIsReusable|TestRenderDoesNot|TestASCIIGolden' -v`
Expected: PASS.

- [ ] **Step 5: Generate and review the golden files**

```bash
go test ./internal/render/ -update
```

Then read every generated file and check it by eye against §4's intent:

```bash
cat internal/render/testdata/wide.golden
cat internal/render/testdata/medium.golden
cat internal/render/testdata/small.golden
cat internal/render/testdata/too-small.golden
cat internal/render/testdata/ascii.golden
```

Expected: the board is a clean 22×22 frame, panels sit beside it without touching it, no row is ragged, the ASCII golden has no box-drawing characters. If any of that is wrong, fix the code and regenerate — do not accept a bad golden.

- [ ] **Step 6: Run the whole suite**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 7: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/render/render.go internal/render/render_test.go internal/render/testdata
git commit -m "feat(render): frame renderer, too-small notice and golden layout tests"
```

---

### Task 7: Overlays — pause, help, game over

**Files:**
- Create: `internal/render/overlays.go`
- Modify: `internal/render/render.go` (remove the temporary `drawOverlay` stub)
- Test: `internal/render/overlays_test.go`

**Interfaces:**
- Consumes: `Canvas`, `Layout`, `View`, `KeyHint`.
- Produces: `func drawOverlay(c *Canvas, l Layout, v View)`; `func DrawPanel(c *Canvas, x, y int, lines []string, p Paint)`; `func PanelSize(lines []string) (w, h int)`.

`DrawPanel` draws a rounded box around centred text. Every overlay is a `DrawPanel` call, so they cannot disagree about geometry.

- [ ] **Step 1: Write the failing test**

Create `internal/render/overlays_test.go`:

```go
package render

import (
	"strings"
	"testing"

	"cosmic-tetris/internal/game"
)

func TestPanelSizeCountsTheBorder(t *testing.T) {
	w, h := PanelSize([]string{"abc", "de"})
	if w != 3+4 || h != 2+2 {
		t.Fatalf("PanelSize = %dx%d, want %dx%d", w, h, 3+4, 2+2)
	}
}

func TestDrawPanelFramesItsText(t *testing.T) {
	c := NewCanvas(20, 6)
	DrawPanel(c, 1, 1, []string{"HELLO", "WORLD!"}, Paint{})
	rows := lines(c)
	if !strings.Contains(rows[1], "╭") || !strings.Contains(rows[1], "╮") {
		t.Errorf("top border missing: %q", rows[1])
	}
	if !strings.Contains(rows[2], "HELLO") {
		t.Errorf("first text row missing: %q", rows[2])
	}
	if !strings.Contains(rows[4], "╰") || !strings.Contains(rows[4], "╯") {
		t.Errorf("bottom border missing: %q", rows[4])
	}
}

func TestDrawPanelClipsAtTheEdges(t *testing.T) {
	c := NewCanvas(8, 3)
	DrawPanel(c, 6, 2, []string{"far too wide for this canvas"}, Paint{})
	if len(lines(c)) != 3 {
		t.Fatal("canvas geometry disturbed")
	}
}

func TestPauseOverlay(t *testing.T) {
	out := render(t, ModeFull, testView(80, 30, ScreenPaused))
	for _, want := range []string{"TEMPORAL SUSPENSION", "SPACE IS PAUSED", "p  resume"} {
		if !strings.Contains(out, want) {
			t.Errorf("pause overlay is missing %q:\n%s", want, out)
		}
	}
}

func TestHelpOverlayListsEveryKeyHint(t *testing.T) {
	v := testView(80, 30, ScreenHelp)
	out := render(t, ModeFull, v)
	if !strings.Contains(out, "FLIGHT MANUAL") {
		t.Errorf("help overlay is missing its title:\n%s", out)
	}
	for _, k := range v.Keys {
		if !strings.Contains(out, k.Desc) {
			t.Errorf("help overlay is missing %q", k.Desc)
		}
	}
}

func TestGameOverOverlayShowsTheFinalNumbers(t *testing.T) {
	v := testView(80, 30, ScreenGameOver)
	v.Snapshot.Score = 483200
	v.Snapshot.Lines = 127
	v.Snapshot.Level = 13
	v.Snapshot.Phase = game.PhaseGameOver
	out := render(t, ModeFull, v)
	for _, want := range []string{"UNIVERSE EXPIRED", "483200", "127", "13", "REBOOT UNIVERSE", "ACCEPT COSMIC DEATH"} {
		if !strings.Contains(out, want) {
			t.Errorf("game-over overlay is missing %q:\n%s", want, out)
		}
	}
}

func TestPlayingScreenHasNoOverlay(t *testing.T) {
	out := render(t, ModeFull, testView(80, 30, ScreenPlaying))
	for _, unwanted := range []string{"TEMPORAL SUSPENSION", "FLIGHT MANUAL", "UNIVERSE EXPIRED"} {
		if strings.Contains(out, unwanted) {
			t.Errorf("playing screen shows %q", unwanted)
		}
	}
}

func TestOverlaysStillFitTheSmallestTerminal(t *testing.T) {
	for _, screen := range []Screen{ScreenPaused, ScreenHelp, ScreenGameOver} {
		out := render(t, ModeFull, testView(40, 24, screen))
		rows := strings.Split(out, "\n")
		if len(rows) != 24 {
			t.Fatalf("screen %v: %d rows, want 24", screen, len(rows))
		}
		for i, row := range rows {
			if n := len([]rune(row)); n != 40 {
				t.Fatalf("screen %v row %d is %d columns, want 40", screen, i, n)
			}
		}
	}
}

func TestGoldenPause(t *testing.T) {
	assertGolden(t, "pause", render(t, ModeFull, testView(80, 30, ScreenPaused)))
}

func TestGoldenHelp(t *testing.T) {
	assertGolden(t, "help", render(t, ModeFull, testView(80, 30, ScreenHelp)))
}

func TestGoldenGameOver(t *testing.T) {
	v := testView(80, 30, ScreenGameOver)
	v.Snapshot.Score = 483200
	v.Snapshot.Lines = 127
	v.Snapshot.Level = 13
	v.Snapshot.Phase = game.PhaseGameOver
	assertGolden(t, "gameover", render(t, ModeFull, v))
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/render/ -run TestPanelSize -v`
Expected: FAIL — `undefined: PanelSize`.

- [ ] **Step 3: Write the implementation**

Create `internal/render/overlays.go`:

```go
package render

import (
	"fmt"
	"strings"
)

const panelPadX = 2

var (
	panelPaint = Paint{FG: RGB{0xC8, 0xD6, 0xFF}}
	panelTitle = Paint{FG: RGB{0xF2, 0xF6, 0xFF}, Bold: true}
)

// PanelSize is the outer size of a panel wrapping these text lines.
func PanelSize(lines []string) (int, int) {
	inner := 0
	for _, s := range lines {
		if n := len([]rune(s)); n > inner {
			inner = n
		}
	}
	return inner + 2*panelPadX, len(lines) + 2
}

// DrawPanel draws a rounded box at x, y around centred text lines. Writes
// outside the canvas are clipped by Canvas itself.
func DrawPanel(c *Canvas, x, y int, lines []string, p Paint) {
	if p == (Paint{}) {
		p = panelPaint
	}
	w, h := PanelSize(lines)
	inner := w - 2
	c.SetString(x, y, "╭"+strings.Repeat("─", inner)+"╮", p)
	for i, line := range lines {
		row := y + 1 + i
		c.SetString(x, row, "│", p)
		c.SetString(x+w-1, row, "│", p)
		pad := (inner - len([]rune(line))) / 2
		if pad < 0 {
			pad = 0
		}
		c.SetString(x+1+pad, row, line, panelTitle)
	}
	c.SetString(x, y+h-1, "╰"+strings.Repeat("─", inner)+"╯", p)
}

// centrePanel draws a panel centred on the board.
func centrePanel(c *Canvas, l Layout, lines []string) {
	w, h := PanelSize(lines)
	x := l.BoardX + (BoardOuterW-w)/2
	y := l.BoardY + (BoardOuterH-h)/2
	if x < 0 {
		x = 0
	}
	if y < 0 {
		y = 0
	}
	DrawPanel(c, x, y, lines, panelPaint)
}

// drawOverlay draws whichever modal panel the current screen calls for.
func drawOverlay(c *Canvas, l Layout, v View) {
	switch v.Screen {
	case ScreenPaused:
		centrePanel(c, l, []string{
			"TEMPORAL SUSPENSION",
			"",
			"SPACE IS PAUSED",
			"",
			"p  resume",
		})
	case ScreenHelp:
		lines := []string{"FLIGHT MANUAL", ""}
		width := 0
		for _, k := range v.Keys {
			if n := len([]rune(k.Keys)); n > width {
				width = n
			}
		}
		for _, k := range v.Keys {
			lines = append(lines, fmt.Sprintf("%-*s  %s", width, k.Keys, k.Desc))
		}
		centrePanel(c, l, lines)
	case ScreenGameOver:
		s := v.Snapshot
		centrePanel(c, l, []string{
			"UNIVERSE EXPIRED",
			"",
			"CAUSE: EXCESSIVE GEOMETRY",
			"",
			fmt.Sprintf("SCORE  %d", s.Score),
			fmt.Sprintf("LINES  %d", s.Lines),
			fmt.Sprintf("LEVEL  %d", s.Level),
			"",
			"r  REBOOT UNIVERSE",
			"q  ACCEPT COSMIC DEATH",
		})
	}
}
```

Delete the temporary `drawOverlay` stub from `render.go`.

- [ ] **Step 4: Run the tests, then regenerate goldens**

Run: `go test ./internal/render/ -run 'TestPanel|TestDrawPanel|TestPause|TestHelp|TestGameOver|TestPlayingScreen|TestOverlaysStill' -v`
Expected: PASS.

Then: `go test ./internal/render/ -update && go test ./internal/render/`
Expected: PASS. Read `testdata/pause.golden`, `help.golden` and `gameover.golden` and confirm each panel is centred on the board and the board is still visible around it.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/render/overlays.go internal/render/render.go internal/render/overlays_test.go internal/render/testdata
git commit -m "feat(render): pause, flight manual and game-over overlays"
```

---

### Task 8: Key bindings and the frame clock

**Files:**
- Create: `internal/app/keys.go`
- Create: `internal/app/messages.go`
- Test: `internal/app/keys_test.go`

**Interfaces:**
- Consumes: `render.KeyHint`.
- Produces: `type KeyMap struct{ Left, Right, SoftDrop, RotateCW, RotateCCW, HardDrop, Hold, Pause, Restart, Help, Quit key.Binding }`; `func DefaultKeyMap() KeyMap`; `func (k KeyMap) ShortHelp() []key.Binding`; `func (k KeyMap) FullHelp() [][]key.Binding`; `func (k KeyMap) Hints() []render.KeyHint`; `type FrameMsg struct{ Now time.Time }`; `const FrameInterval = 16 * time.Millisecond`; `const MaxFrameDelta = 100 * time.Millisecond`; `func FrameCmd() tea.Cmd`.

Key repeat when the player holds left or right is the terminal's own auto-repeat: it delivers repeated `KeyPressMsg` values, and because `Update` acts on each immediately, movement repeats without any extra machinery (§8, §36).

- [ ] **Step 1: Write the failing test**

Create `internal/app/keys_test.go`:

```go
package app

import (
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"
	"charm.land/bubbles/v2/key"
)

// press builds the KeyPressMsg a terminal sends for a key name.
func press(name string) tea.KeyPressMsg {
	switch name {
	case "left":
		return tea.KeyPressMsg{Code: tea.KeyLeft}
	case "right":
		return tea.KeyPressMsg{Code: tea.KeyRight}
	case "up":
		return tea.KeyPressMsg{Code: tea.KeyUp}
	case "down":
		return tea.KeyPressMsg{Code: tea.KeyDown}
	case "space":
		return tea.KeyPressMsg{Code: tea.KeySpace, Text: " "}
	case "esc":
		return tea.KeyPressMsg{Code: tea.KeyEscape}
	default:
		r := []rune(name)[0]
		return tea.KeyPressMsg{Code: r, Text: string(r)}
	}
}

func TestEveryPrimaryKeyIsBound(t *testing.T) {
	km := DefaultKeyMap()
	cases := []struct {
		keys    []string
		binding key.Binding
		name    string
	}{
		{[]string{"left", "h", "a"}, km.Left, "Left"},
		{[]string{"right", "l", "d"}, km.Right, "Right"},
		{[]string{"down", "j", "s"}, km.SoftDrop, "SoftDrop"},
		{[]string{"up", "k", "x", "w"}, km.RotateCW, "RotateCW"},
		{[]string{"z"}, km.RotateCCW, "RotateCCW"},
		{[]string{"space"}, km.HardDrop, "HardDrop"},
		{[]string{"c"}, km.Hold, "Hold"},
		{[]string{"p"}, km.Pause, "Pause"},
		{[]string{"r"}, km.Restart, "Restart"},
		{[]string{"?"}, km.Help, "Help"},
		{[]string{"q", "esc"}, km.Quit, "Quit"},
	}
	for _, c := range cases {
		for _, k := range c.keys {
			if !key.Matches(press(k), c.binding) {
				t.Errorf("%s should match %q", c.name, k)
			}
		}
	}
}

func TestBindingsDoNotOverlap(t *testing.T) {
	km := DefaultKeyMap()
	all := map[string]string{}
	named := map[string]key.Binding{
		"Left": km.Left, "Right": km.Right, "SoftDrop": km.SoftDrop,
		"RotateCW": km.RotateCW, "RotateCCW": km.RotateCCW, "HardDrop": km.HardDrop,
		"Hold": km.Hold, "Pause": km.Pause, "Restart": km.Restart,
		"Help": km.Help, "Quit": km.Quit,
	}
	for name, b := range named {
		for _, k := range b.Keys() {
			if prev, dup := all[k]; dup {
				t.Errorf("key %q is bound to both %s and %s", k, prev, name)
			}
			all[k] = name
		}
	}
}

func TestEveryBindingHasHelpText(t *testing.T) {
	km := DefaultKeyMap()
	for _, b := range km.FullHelp()[0] {
		h := b.Help()
		if h.Key == "" || h.Desc == "" {
			t.Errorf("binding %v has incomplete help: %+v", b.Keys(), h)
		}
	}
}

func TestHintsCoverTheFlightManual(t *testing.T) {
	hints := DefaultKeyMap().Hints()
	if len(hints) < 10 {
		t.Fatalf("%d hints, want at least the 10 rows of §39's flight manual", len(hints))
	}
	joined := ""
	for _, h := range hints {
		joined += h.Keys + " " + h.Desc + "\n"
	}
	for _, want := range []string{"move spacecraft", "accelerate doom", "rotate geometry", "YEET", "quantum storage", "suspend spacetime", "reboot universe", "abandon mission"} {
		if !contains(joined, want) {
			t.Errorf("hints are missing %q (§39)", want)
		}
	}
}

func contains(haystack, needle string) bool {
	return len(haystack) >= len(needle) && (haystack == needle || indexOf(haystack, needle) >= 0)
}

func indexOf(haystack, needle string) int {
	for i := 0; i+len(needle) <= len(haystack); i++ {
		if haystack[i:i+len(needle)] == needle {
			return i
		}
	}
	return -1
}

func TestFrameTimingConstants(t *testing.T) {
	if FrameInterval > 17*time.Millisecond {
		t.Errorf("FrameInterval = %v, want about 16ms for 60 Hz (§36)", FrameInterval)
	}
	if MaxFrameDelta < 50*time.Millisecond || MaxFrameDelta > 250*time.Millisecond {
		t.Errorf("MaxFrameDelta = %v, want a sane catch-up clamp", MaxFrameDelta)
	}
}

func TestFrameCmdProducesAFrameMsg(t *testing.T) {
	msg := FrameCmd()()
	if _, ok := msg.(FrameMsg); !ok {
		t.Fatalf("FrameCmd produced %T, want FrameMsg", msg)
	}
}
```

Replace the hand-rolled `contains`/`indexOf` helpers with `strings.Contains` and an `import "strings"` — they are only written out here to make the intent unmistakable.

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/app/ -run TestEveryPrimaryKey -v`
Expected: FAIL — `undefined: DefaultKeyMap`.

- [ ] **Step 3: Write the implementation**

Create `internal/app/keys.go`:

```go
// Package app is the Bubble Tea layer: it owns the clock, the keyboard and the
// application state machine, and hands the renderer a read-only snapshot.
package app

import (
	"charm.land/bubbles/v2/key"

	"cosmic-tetris/internal/render"
)

// KeyMap is the whole control surface (§8). WASD aliases sit alongside the
// arrows and the vi keys.
type KeyMap struct {
	Left      key.Binding
	Right     key.Binding
	SoftDrop  key.Binding
	RotateCW  key.Binding
	RotateCCW key.Binding
	HardDrop  key.Binding
	Hold      key.Binding
	Pause     key.Binding
	Restart   key.Binding
	Help      key.Binding
	Quit      key.Binding
}

// DefaultKeyMap returns the shipped bindings.
func DefaultKeyMap() KeyMap {
	return KeyMap{
		Left:      key.NewBinding(key.WithKeys("left", "h", "a"), key.WithHelp("← → / h l", "move spacecraft")),
		Right:     key.NewBinding(key.WithKeys("right", "l", "d"), key.WithHelp("→ / l", "move right")),
		SoftDrop:  key.NewBinding(key.WithKeys("down", "j", "s"), key.WithHelp("↓ / j", "accelerate doom")),
		RotateCW:  key.NewBinding(key.WithKeys("up", "k", "x", "w"), key.WithHelp("↑ / k / x", "rotate geometry")),
		RotateCCW: key.NewBinding(key.WithKeys("z"), key.WithHelp("z", "rotate other way")),
		HardDrop:  key.NewBinding(key.WithKeys(" ", "space"), key.WithHelp("SPACE", "YEET")),
		Hold:      key.NewBinding(key.WithKeys("c"), key.WithHelp("c", "quantum storage")),
		Pause:     key.NewBinding(key.WithKeys("p"), key.WithHelp("p", "suspend spacetime")),
		Restart:   key.NewBinding(key.WithKeys("r"), key.WithHelp("r", "reboot universe")),
		Help:      key.NewBinding(key.WithKeys("?"), key.WithHelp("?", "close this nonsense")),
		Quit:      key.NewBinding(key.WithKeys("q", "esc"), key.WithHelp("q", "abandon mission")),
	}
}

// ShortHelp satisfies the bubbles help.KeyMap interface.
func (k KeyMap) ShortHelp() []key.Binding {
	return []key.Binding{k.Left, k.Right, k.RotateCW, k.SoftDrop, k.HardDrop, k.Hold, k.Help}
}

// FullHelp satisfies the bubbles help.KeyMap interface.
func (k KeyMap) FullHelp() [][]key.Binding {
	return [][]key.Binding{{
		k.Left, k.Right, k.SoftDrop, k.RotateCW, k.RotateCCW,
		k.HardDrop, k.Hold, k.Pause, k.Restart, k.Quit, k.Help,
	}}
}

// Hints renders the bindings as the flight manual rows (§39).
func (k KeyMap) Hints() []render.KeyHint {
	var out []render.KeyHint
	for _, b := range k.FullHelp()[0] {
		h := b.Help()
		out = append(out, render.KeyHint{Keys: h.Key, Desc: h.Desc})
	}
	return out
}
```

Create `internal/app/messages.go`:

```go
package app

import (
	"time"

	tea "charm.land/bubbletea/v2"
)

// Frame timing (§36): one animation clock, elapsed-time gameplay.
const (
	// FrameInterval targets roughly 60 Hz of visual updates.
	FrameInterval = 16 * time.Millisecond
	// MaxFrameDelta caps the dt handed to the engine. Without it, a suspended
	// terminal resumes by dumping minutes of gravity into one frame.
	MaxFrameDelta = 100 * time.Millisecond
)

// FrameMsg is the animation tick. It carries the time so that dt comes from the
// clock Bubble Tea already read, not a second reading of our own.
type FrameMsg struct {
	Now time.Time
}

// FrameCmd schedules the next frame. tea.Tick fires once, so every frame
// re-issues it.
func FrameCmd() tea.Cmd {
	return tea.Tick(FrameInterval, func(t time.Time) tea.Msg {
		return FrameMsg{Now: t}
	})
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/app/ -v`
Expected: PASS. If a `key.Matches` assertion fails for `space`, check whether the binding needs `" "` or `"space"` — keep both, as written.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/app/keys.go internal/app/messages.go internal/app/keys_test.go
git commit -m "feat(app): key bindings and the 60 Hz frame clock"
```

---

### Task 9: The Bubble Tea model and the CLI

**Files:**
- Create: `internal/app/model.go`
- Create: `internal/app/update.go`
- Create: `cmd/cosmic-tetris/main.go`
- Test: `internal/app/update_test.go`

**Interfaces:**
- Consumes: `game`, `render`, `KeyMap`, `FrameMsg`.
- Produces: `type State uint8` with `StateBoot`, `StatePlaying`, `StatePaused`, `StateHelp`, `StateGameOver`; `type Config struct{ Seed int64; SeedFixed, ASCII, NoFX, ReducedMotion bool }`; `type Model struct{ ... }`; `func New(cfg Config) Model`; `func (m Model) Init() tea.Cmd`; `func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd)`; `func (m Model) View() tea.View`; `func (m Model) Screen() render.Screen`; `func (m *Model) restart()`.

`StateBoot` exists now and is skipped immediately; Plan 4 gives it the §29 sequence.

- [ ] **Step 1: Write the failing test**

Create `internal/app/update_test.go`:

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

// newTestModel returns a sized, playing model with a fixed seed.
func newTestModel(t *testing.T) Model {
	t.Helper()
	m := New(Config{Seed: 8675309, SeedFixed: true})
	m = step(m, tea.WindowSizeMsg{Width: 80, Height: 30})
	m.State = StatePlaying
	return m
}

// step applies one message and returns the updated model.
func step(m Model, msg tea.Msg) Model {
	next, _ := m.Update(msg)
	return next.(Model)
}

func TestWindowSizeIsRecorded(t *testing.T) {
	m := step(New(Config{Seed: 1}), tea.WindowSizeMsg{Width: 100, Height: 40})
	if m.Width != 100 || m.Height != 40 {
		t.Fatalf("size = %dx%d, want 100x40", m.Width, m.Height)
	}
}

func TestColorProfileSelectsTheRenderingMode(t *testing.T) {
	m := newTestModel(t)
	m = step(m, tea.ColorProfileMsg{Profile: colorprofile.TrueColor})
	if got := m.Renderer.Mode(); got != render.ModeFull {
		t.Errorf("mode = %v, want full", got)
	}
	m = step(m, tea.ColorProfileMsg{Profile: colorprofile.ANSI256})
	if got := m.Renderer.Mode(); got != render.ModeReduced {
		t.Errorf("mode = %v, want reduced", got)
	}
}

func TestASCIIFlagOverridesTheDetectedProfile(t *testing.T) {
	m := New(Config{Seed: 1, ASCII: true})
	m = step(m, tea.ColorProfileMsg{Profile: colorprofile.TrueColor})
	if got := m.Renderer.Mode(); got != render.ModeASCII {
		t.Errorf("mode = %v, want ascii: --ascii must win", got)
	}
}

func TestMovementKeysActImmediately(t *testing.T) {
	// §36, §44: input must not wait for the next tick.
	m := newTestModel(t)
	x := m.Game.Active.X
	m = step(m, press("left"))
	if m.Game.Active.X != x-1 {
		t.Fatalf("X = %d after left, want %d — input was deferred", m.Game.Active.X, x-1)
	}
	m = step(m, press("right"))
	m = step(m, press("right"))
	if m.Game.Active.X != x+1 {
		t.Fatalf("X = %d after two rights, want %d", m.Game.Active.X, x+1)
	}
}

func TestRotationHoldAndHardDropKeysReachTheEngine(t *testing.T) {
	m := newTestModel(t)
	m = step(m, press("x"))
	if m.Game.Active.Rotation == 0 && m.Game.Active.Kind != game.KindO {
		t.Error("x did not rotate the piece")
	}

	m = newTestModel(t)
	m = step(m, press("c"))
	if m.Game.Hold == nil {
		t.Error("c did not hold the piece")
	}

	m = newTestModel(t)
	before := m.Game.Score
	m = step(m, press("space"))
	if m.Game.Score <= before {
		t.Error("space did not hard drop")
	}
}

func TestSoftDropScoresAPoint(t *testing.T) {
	m := newTestModel(t)
	m = step(m, press("j"))
	if m.Game.Score != 1 {
		t.Errorf("Score = %d after soft drop, want 1", m.Game.Score)
	}
}

func TestPauseTogglesAndFreezesGravity(t *testing.T) {
	m := newTestModel(t)
	m = step(m, press("p"))
	if m.State != StatePaused {
		t.Fatalf("State = %v after p, want StatePaused", m.State)
	}

	y := m.Game.Active.Y
	m.LastFrame = time.Now().Add(-time.Second)
	m = step(m, FrameMsg{Now: time.Now()})
	if m.Game.Active.Y != y {
		t.Error("gravity ran while paused")
	}

	m = step(m, press("p"))
	if m.State != StatePlaying {
		t.Fatalf("State = %v after second p, want StatePlaying", m.State)
	}
}

func TestGravityRunsOnFrameMessages(t *testing.T) {
	m := newTestModel(t)
	y := m.Game.Active.Y
	now := time.Now()
	m.LastFrame = now
	// Ten 90ms frames is 900ms: more than one level-1 interval.
	for i := 1; i <= 10; i++ {
		m = step(m, FrameMsg{Now: now.Add(time.Duration(i) * 90 * time.Millisecond)})
	}
	if m.Game.Active.Y <= y {
		t.Fatalf("Y = %d after 900ms of frames, want more than %d", m.Game.Active.Y, y)
	}
}

func TestFrameDeltaIsClampedAfterALongStall(t *testing.T) {
	// A suspended terminal must not dump minutes of gravity into one frame.
	m := newTestModel(t)
	y := m.Game.Active.Y
	now := time.Now()
	m.LastFrame = now
	m = step(m, FrameMsg{Now: now.Add(10 * time.Minute)})
	if dropped := m.Game.Active.Y - y; dropped > 1 {
		t.Fatalf("piece fell %d rows on one stalled frame, want at most 1", dropped)
	}
}

func TestFrameCommandKeepsTicking(t *testing.T) {
	m := newTestModel(t)
	_, cmd := m.Update(FrameMsg{Now: time.Now()})
	if cmd == nil {
		t.Fatal("FrameMsg did not schedule the next frame; the clock would stop")
	}
}

func TestHelpTogglesAndReturnsToThePreviousScreen(t *testing.T) {
	m := newTestModel(t)
	m = step(m, press("?"))
	if m.State != StateHelp {
		t.Fatalf("State = %v after ?, want StateHelp", m.State)
	}
	m = step(m, press("?"))
	if m.State != StatePlaying {
		t.Fatalf("State = %v after second ?, want StatePlaying", m.State)
	}

	m = step(m, press("p"))
	m = step(m, press("?"))
	m = step(m, press("?"))
	if m.State != StatePaused {
		t.Errorf("State = %v, want to return to StatePaused", m.State)
	}
}

func TestHelpFreezesGravity(t *testing.T) {
	m := newTestModel(t)
	m = step(m, press("?"))
	y := m.Game.Active.Y
	now := time.Now()
	m.LastFrame = now
	for i := 1; i <= 20; i++ {
		m = step(m, FrameMsg{Now: now.Add(time.Duration(i) * 90 * time.Millisecond)})
	}
	if m.Game.Active.Y != y {
		t.Error("gravity ran while the flight manual was open")
	}
}

func TestGameOverStateIsEnteredFromTheEngineEvent(t *testing.T) {
	m := newTestModel(t)
	// Fill the board so the next spawn is blocked.
	for y := 0; y < game.Height; y++ {
		for x := 0; x < game.Width; x++ {
			m.Game.Board.Cells[y][x] = game.Cell{Filled: true, Kind: game.KindJ}
		}
	}
	m.Game.Board.Cells[game.Height-1][0] = game.Cell{}
	m.Game.Active = game.Piece{Kind: game.KindO, X: -1, Y: 0}
	m = step(m, press("space"))
	if m.State != StateGameOver {
		t.Fatalf("State = %v, want StateGameOver", m.State)
	}
}

func TestRestartRebuildsTheGame(t *testing.T) {
	m := newTestModel(t)
	m = step(m, press("space"))
	m = step(m, press("space"))
	if m.Game.Score == 0 {
		t.Fatal("test setup: expected a non-zero score")
	}
	m = step(m, press("r"))
	if m.Game.Score != 0 || m.Game.Lines != 0 || m.Game.Level != 1 {
		t.Errorf("after restart: score=%d lines=%d level=%d, want a fresh game",
			m.Game.Score, m.Game.Lines, m.Game.Level)
	}
	if m.State != StatePlaying {
		t.Errorf("State = %v after restart, want StatePlaying", m.State)
	}
}

func TestRestartWithAFixedSeedReplaysTheSameGame(t *testing.T) {
	m := newTestModel(t)
	first := m.Game.Active.Kind
	m = step(m, press("r"))
	if m.Game.Active.Kind != first {
		t.Errorf("first piece after restart = %s, want %s: --seed must be honoured",
			m.Game.Active.Kind, first)
	}
	if m.Game.Seed != 8675309 {
		t.Errorf("Seed = %d after restart, want 8675309", m.Game.Seed)
	}
}

func TestRestartWithoutAFixedSeedPicksANewUniverse(t *testing.T) {
	m := New(Config{Seed: 8675309, SeedFixed: false})
	m = step(m, tea.WindowSizeMsg{Width: 80, Height: 30})
	m.State = StatePlaying
	m = step(m, press("r"))
	if m.Game.Seed == 8675309 {
		t.Error("restart without --seed should choose a new seed")
	}
}

func TestRestartWorksFromGameOverAndPause(t *testing.T) {
	for _, state := range []State{StateGameOver, StatePaused} {
		m := newTestModel(t)
		m.State = state
		m = step(m, press("r"))
		if m.State != StatePlaying {
			t.Errorf("from %v, r left the model in %v, want StatePlaying", state, m.State)
		}
	}
}

func TestQuitReturnsTheQuitCommand(t *testing.T) {
	for _, k := range []string{"q", "esc"} {
		m := newTestModel(t)
		_, cmd := m.Update(press(k))
		if cmd == nil {
			t.Fatalf("%q produced no command, want tea.Quit", k)
		}
		if _, ok := cmd().(tea.QuitMsg); !ok {
			t.Errorf("%q did not produce a QuitMsg", k)
		}
	}
}

func TestGameplayKeysAreIgnoredAfterGameOver(t *testing.T) {
	m := newTestModel(t)
	m.State = StateGameOver
	before := m.Game.Active
	for _, k := range []string{"left", "right", "j", "x", "z", "space", "c"} {
		m = step(m, press(k))
	}
	if m.Game.Active != before {
		t.Error("a gameplay key changed the game after game over")
	}
}

func TestViewRendersTheCurrentScreenInTheAltScreen(t *testing.T) {
	m := newTestModel(t)
	v := m.View()
	if !v.AltScreen {
		t.Error("View should request the alt screen (full window mode)")
	}
	if !strings.Contains(v.Content, "\x1b[") && !strings.Contains(v.Content, "█") {
		t.Errorf("View content looks empty: %q", v.Content[:min(80, len(v.Content))])
	}
}

func TestScreenMapsStateToRenderScreen(t *testing.T) {
	cases := map[State]render.Screen{
		StateBoot:     render.ScreenBoot,
		StatePlaying:  render.ScreenPlaying,
		StatePaused:   render.ScreenPaused,
		StateHelp:     render.ScreenHelp,
		StateGameOver: render.ScreenGameOver,
	}
	for state, want := range cases {
		m := newTestModel(t)
		m.State = state
		if got := m.Screen(); got != want {
			t.Errorf("State %v maps to %v, want %v", state, got, want)
		}
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
```

Drop the local `min` helper if the toolchain's builtin `min` is preferred; either is fine, just do not leave both.

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/app/ -run TestWindowSize -v`
Expected: FAIL — `undefined: New`.

- [ ] **Step 3: Write the model**

Create `internal/app/model.go`:

```go
package app

import (
	"math/rand/v2"
	"time"

	tea "charm.land/bubbletea/v2"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

// State is which face of the application is showing.
type State uint8

const (
	StateBoot State = iota
	StatePlaying
	StatePaused
	StateHelp
	StateGameOver
)

// Config is the parsed CLI surface (§49.5).
type Config struct {
	Seed          int64
	SeedFixed     bool // true when --seed was given: restart replays the same universe
	ASCII         bool
	NoFX          bool
	ReducedMotion bool
}

// Model is the Bubble Tea model (§34).
type Model struct {
	Cfg  Config
	Game *game.Game

	Width, Height int
	State         State
	prevState     State

	LastFrame time.Time
	Keys      KeyMap
	Renderer  *render.Renderer

	Mission string
}

// New builds the initial model.
func New(cfg Config) Model {
	mode := render.ModeReduced
	if cfg.ASCII {
		mode = render.ModeASCII
	}
	return Model{
		Cfg:      cfg,
		Game:     game.New(cfg.Seed),
		State:    StatePlaying,
		Keys:     DefaultKeyMap(),
		Renderer: render.NewRenderer(mode),
		Mission:  "NOMINALISH",
	}
}

// Init starts the frame clock and asks for the terminal size.
func (m Model) Init() tea.Cmd {
	return tea.Batch(FrameCmd(), func() tea.Msg { return tea.RequestWindowSize() })
}

// Screen maps application state to the renderer's screen enum.
func (m Model) Screen() render.Screen {
	switch m.State {
	case StateBoot:
		return render.ScreenBoot
	case StatePaused:
		return render.ScreenPaused
	case StateHelp:
		return render.ScreenHelp
	case StateGameOver:
		return render.ScreenGameOver
	default:
		return render.ScreenPlaying
	}
}

// restart rebuilds the game. With --seed the same universe replays; without it,
// a new one is drawn. This is the app's clock read, not the engine's (§49.2).
func (m *Model) restart() {
	seed := m.Cfg.Seed
	if !m.Cfg.SeedFixed {
		seed = rand.Int64()
	}
	m.Game = game.New(seed)
	m.State = StatePlaying
	m.Mission = "UNIVERSE REBOOTED"
	m.LastFrame = time.Time{}
}

// View renders the current frame in the alternate screen buffer.
func (m Model) View() tea.View {
	v := tea.NewView(m.Renderer.Render(render.View{
		Width:    m.Width,
		Height:   m.Height,
		Screen:   m.Screen(),
		Snapshot: m.Game.Snapshot(),
		Mission:  m.Mission,
		Keys:     m.Keys.Hints(),
	}))
	v.AltScreen = true
	return v
}
```

- [ ] **Step 4: Write the update loop**

Create `internal/app/update.go`:

```go
package app

import (
	"time"

	tea "charm.land/bubbletea/v2"
	"charm.land/bubbles/v2/key"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

// Update handles one message. Key presses act immediately; they are never
// deferred to the next frame (§36, §44).
func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.Width, m.Height = msg.Width, msg.Height
		return m, nil

	case tea.ColorProfileMsg:
		m.Renderer.SetMode(render.ModeFor(msg.Profile, m.Cfg.ASCII))
		return m, nil

	case FrameMsg:
		return m.frame(msg.Now)

	case tea.KeyPressMsg:
		return m.keyPress(msg)
	}
	return m, nil
}

// frame advances one animation step. dt is clamped so that a suspended terminal
// resuming cannot dump minutes of gravity into a single frame.
func (m Model) frame(now time.Time) (tea.Model, tea.Cmd) {
	dt := time.Duration(0)
	if !m.LastFrame.IsZero() {
		dt = now.Sub(m.LastFrame)
		if dt > MaxFrameDelta {
			dt = MaxFrameDelta
		}
		if dt < 0 {
			dt = 0
		}
	}
	m.LastFrame = now

	if m.State == StatePlaying {
		m.observe(m.Game.Advance(dt))
	}
	return m, FrameCmd()
}

// observe reacts to engine events. Plan 3 forwards them to the effects world;
// for now the only reaction the application needs is the game-over transition.
func (m *Model) observe(evs []game.Event) {
	for _, e := range evs {
		if e.Kind == game.EventGameOver {
			m.State = StateGameOver
		}
	}
}

func (m Model) keyPress(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	switch {
	case key.Matches(msg, m.Keys.Quit):
		return m, tea.Quit

	case key.Matches(msg, m.Keys.Restart):
		m.restart()
		return m, nil

	case key.Matches(msg, m.Keys.Help):
		if m.State == StateHelp {
			m.State = m.prevState
		} else {
			m.prevState = m.State
			m.State = StateHelp
		}
		return m, nil

	case key.Matches(msg, m.Keys.Pause):
		switch m.State {
		case StatePlaying:
			m.State = StatePaused
		case StatePaused:
			m.State = StatePlaying
		}
		return m, nil
	}

	if m.State != StatePlaying {
		return m, nil
	}

	var evs []game.Event
	switch {
	case key.Matches(msg, m.Keys.Left):
		evs = m.Game.MoveLeft()
	case key.Matches(msg, m.Keys.Right):
		evs = m.Game.MoveRight()
	case key.Matches(msg, m.Keys.SoftDrop):
		evs = m.Game.SoftDrop()
	case key.Matches(msg, m.Keys.RotateCW):
		evs = m.Game.RotateCW()
	case key.Matches(msg, m.Keys.RotateCCW):
		evs = m.Game.RotateCCW()
	case key.Matches(msg, m.Keys.HardDrop):
		evs = m.Game.HardDrop()
	case key.Matches(msg, m.Keys.Hold):
		evs = m.Game.UseHold()
	}
	m.observe(evs)
	return m, nil
}
```

Note: `StateBoot` is skipped for now — `New` starts in `StatePlaying`. Plan 4 Task 1 turns it on.

- [ ] **Step 5: Write main.go**

Create `cmd/cosmic-tetris/main.go`:

```go
// Command cosmic-tetris is a falling-block puzzle game occurring during a
// completely unnecessary cosmological emergency.
package main

import (
	"flag"
	"fmt"
	"math/rand/v2"
	"os"

	tea "charm.land/bubbletea/v2"

	"cosmic-tetris/internal/app"
)

func main() {
	var (
		seed          = flag.Int64("seed", 0, "start a specific universe (reproducible)")
		ascii         = flag.Bool("ascii", false, "ASCII glyphs only, for terminals that need it")
		noFX          = flag.Bool("no-fx", false, "disable cosmic effects; still a good game")
		reducedMotion = flag.Bool("reduced-motion", false, "no screen shake, hyperdrive or shockwaves")
	)
	flag.Parse()

	cfg := app.Config{
		Seed:          *seed,
		ASCII:         *ascii,
		NoFX:          *noFX,
		ReducedMotion: *reducedMotion,
	}
	flag.Visit(func(f *flag.Flag) {
		if f.Name == "seed" {
			cfg.SeedFixed = true
		}
	})
	if !cfg.SeedFixed {
		cfg.Seed = rand.Int64()
	}

	if _, err := tea.NewProgram(app.New(cfg), tea.WithFPS(60)).Run(); err != nil {
		fmt.Fprintln(os.Stderr, "cosmic-tetris:", err)
		os.Exit(1)
	}
}
```

- [ ] **Step 6: Run the tests and build**

Run: `go test ./... -v && go build ./...`
Expected: PASS and a clean build.

- [ ] **Step 7: Check the CLI surface by hand**

Run: `go run ./cmd/cosmic-tetris --help`
Expected: exactly `seed`, `ascii`, `no-fx`, `reduced-motion` — no other flags (§49.5).

- [ ] **Step 8: Play it**

Run: `go run ./cmd/cosmic-tetris --seed 8675309`
Expected: a playable game. Check by hand: arrows move, `x` rotates, space drops with a thud of a lock, `c` holds, `p` pauses, `?` opens the flight manual, `r` restarts, `q` quits, and resizing the window re-lays out without crashing.

- [ ] **Step 9: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/app/model.go internal/app/update.go internal/app/update_test.go cmd/cosmic-tetris/main.go
git commit -m "feat(app): Bubble Tea model, update loop and CLI"
```

---

### Task 10: Resize and state-transition hardening

**Files:**
- Test: `internal/app/resize_test.go`
- Modify: `internal/app/update.go` only if a test exposes a real bug

**Interfaces:**
- Consumes: the whole application.
- Produces: no new API. The deliverable is the guarantee that §31's "never crash from terminal resizing" holds.

- [ ] **Step 1: Write the test**

Create `internal/app/resize_test.go`:

```go
package app

import (
	"strings"
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"
	"github.com/charmbracelet/x/ansi"
)

// sizes covers plausible and implausible terminal geometries.
func sizes() []tea.WindowSizeMsg {
	return []tea.WindowSizeMsg{
		{Width: 0, Height: 0},
		{Width: 1, Height: 1},
		{Width: 34, Height: 19},
		{Width: 40, Height: 24},
		{Width: 41, Height: 25},
		{Width: 52, Height: 26},
		{Width: 80, Height: 30},
		{Width: 300, Height: 100},
		{Width: 2, Height: 60},
		{Width: 200, Height: 3},
	}
}

func TestEverySizeRendersWithoutPanicking(t *testing.T) {
	m := New(Config{Seed: 1, SeedFixed: true})
	for _, s := range sizes() {
		m = step(m, s)
		out := m.View().Content
		rows := strings.Split(ansi.Strip(out), "\n")
		if s.Height > 0 && len(rows) != s.Height {
			t.Errorf("%dx%d: %d rows, want %d", s.Width, s.Height, len(rows), s.Height)
		}
	}
}

func TestResizingInEveryStatePreservesTheGame(t *testing.T) {
	// Review Focus 5: resize while paused, in help, or after game over.
	for _, state := range []State{StatePlaying, StatePaused, StateHelp, StateGameOver} {
		m := newTestModel(t)
		m.State = state
		m = step(m, press("space")) // put something on the board when playing
		score, lines, active := m.Game.Score, m.Game.Lines, m.Game.Active

		for _, s := range sizes() {
			m = step(m, s)
			_ = m.View()
		}

		if m.State != state {
			t.Errorf("state %v became %v after resizing", state, m.State)
		}
		if m.Game.Score != score || m.Game.Lines != lines || m.Game.Active != active {
			t.Errorf("state %v: resizing changed the game", state)
		}
	}
}

func TestShrinkingBelowMinimumAndBackRecovers(t *testing.T) {
	m := newTestModel(t)
	m = step(m, tea.WindowSizeMsg{Width: 20, Height: 10})
	if !strings.Contains(ansi.Strip(m.View().Content), "TOO SMALL") {
		t.Fatal("shrinking below the minimum should show the notice")
	}
	m = step(m, tea.WindowSizeMsg{Width: 80, Height: 30})
	out := ansi.Strip(m.View().Content)
	if strings.Contains(out, "TOO SMALL") {
		t.Error("growing back did not restore the game view")
	}
	if !strings.Contains(out, "NEXT") {
		t.Errorf("HUD missing after recovery:\n%s", out)
	}
}

func TestFramesKeepFlowingWhileTooSmall(t *testing.T) {
	m := newTestModel(t)
	m = step(m, tea.WindowSizeMsg{Width: 10, Height: 5})
	_, cmd := m.Update(FrameMsg{Now: time.Now()})
	if cmd == nil {
		t.Fatal("the frame clock stopped while the terminal was too small")
	}
}

func TestALongSessionOfMixedMessagesStaysSane(t *testing.T) {
	m := newTestModel(t)
	now := time.Now()
	keys := []string{"left", "right", "j", "x", "z", "space", "c", "p", "p", "?", "?"}
	for i := 0; i < 600; i++ {
		m = step(m, press(keys[i%len(keys)]))
		now = now.Add(20 * time.Millisecond)
		m = step(m, FrameMsg{Now: now})
		if i%50 == 0 {
			m = step(m, sizes()[(i/50)%len(sizes())])
		}
		_ = m.View()
	}
	if m.Game.Level < 1 {
		t.Errorf("Level = %d after a long session, want at least 1", m.Game.Level)
	}
}
```

- [ ] **Step 2: Run the tests**

Run: `go test ./internal/app/ -run 'TestEverySize|TestResizingIn|TestShrinking|TestFramesKeep|TestALongSession' -v`
Expected: PASS. Any panic here is a real bug — fix `render` or `app`, not the test.

- [ ] **Step 3: Run the whole suite with the race detector**

Run: `go test ./... -race -count=2`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
gofmt -l . && go vet ./...
git add internal/app/resize_test.go
git commit -m "test(app): resize and state-transition hardening"
```

---

## Done when

- `go test ./... -race` passes and `go build ./...` is clean.
- `go run ./cmd/cosmic-tetris` is a playable game: move, rotate, soft drop, hard drop, hold, ghost, next queue, score/lines/level, pause, help, restart, quit.
- Golden files exist for wide, medium, small, too-small, ASCII, pause, help and game over (§41). Nothing overlaps, board dimensions are right, resize does not panic, the HUD does not corrupt the board.
- `--seed`, `--ascii`, `--no-fx`, `--reduced-motion` and `--help` all parse; `--no-fx` and `--reduced-motion` are recorded in `Config` and consumed in Plan 3.
- Plan 3 can start: it needs `render.View` (to add an `FX` field), `render.Canvas`, `render.Layout`, the palette, and `game.Event`.
