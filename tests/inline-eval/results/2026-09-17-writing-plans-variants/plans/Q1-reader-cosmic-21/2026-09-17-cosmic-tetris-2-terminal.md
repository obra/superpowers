# Cosmic Tetris — Plan 2: The Playable Terminal

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the Plan 1 engine on screen as a genuinely good, fully playable terminal Tetris — board, ghost, next queue, hold, stats, adaptive layout, pause, help, game over, restart, ASCII fallback — with no cosmic effects yet.

**Architecture:** `internal/render` owns a small cell buffer (`Grid`) of runes plus comparable `Ink` styling. Everything — board, panels, chrome, overlays — writes into that one buffer, which then coalesces styling runs into a single string. `Grid.Plain()` produces the unstyled text used by the golden tests, so the layout contract of design §41 is checked without ANSI noise. `internal/app` is the Bubble Tea Elm loop: one 60 Hz `FrameMsg` clock feeds elapsed time to `game.Advance(dt)`, while key presses call `game.Apply` immediately and never wait for a tick.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2` v2.0.9, `charm.land/lipgloss/v2` v2.0.6, `charm.land/bubbles/v2` v2.2.1 (`key` package), `github.com/charmbracelet/x/ansi` (`ansi.Strip`, test-only).

**Spec:** `design.md` — the approved build spec. Section 49 pins decisions that earlier sections left open; where they disagree, §49 wins. §49.7 is load-bearing for this plan: the §4 mockup is mood and intent, **not** geometry, and the ANSI-stripped goldens written here are the binding layout contract.

**Prerequisite:** Plan 1 (`plans/2026-09-17-cosmic-tetris-1-engine.md`) complete — `internal/game` exists and its tests pass.

## Scope note: three sections pulled forward from design §42

Design §42 lists `palette` under Phase 3 and `help` plus `ASCII fallback` under
Phase 5. This plan implements all three, because §41 requires golden tests for
"help" and "ASCII mode" and §46 ships `--ascii` on day one: deferring them would
mean shipping a renderer whose own contract tests cannot be written. What stays
out of this plan is every *moving* thing — starfield, trails, animated border,
particles, supernova, shake, shockwaves, hyperdrive, four-line sequence, boot
sequence, black-hole collapse, and the mission-control message engine. Those are
Plan 3. Mission control renders here as a static line so its row exists in the
layout goldens.

## Global Constraints

- Module path `cosmic-tetris`; `go 1.26` directive. Dependencies are exactly the four in Tech Stack — add nothing else.
- `internal/render` may import `internal/game`, the standard library, and Lip Gloss. It must **not** import `internal/app` or `charm.land/bubbletea/v2`.
- `internal/app` may import everything. `cmd/cosmic-tetris` imports only `internal/app` and `internal/render` (for the mode flags) plus stdlib.
- **Rendering must never mutate game state** (§37). `internal/render` takes `*game.Game` and calls only reading methods on it.
- No `time.Now()` anywhere in `internal/render`. Time enters `internal/app` only, through `FrameMsg`.
- Nothing may add a `time.Now()` call to `internal/game`, and nothing may give `internal/game` a second random generator (§49.2, §49.6).
- One animation clock (§36): a single `FrameMsg` at `FrameInterval = 16ms` (~60 Hz). Input is handled the moment it arrives and never queued to a tick (§8, §44 "never make controls lag").
- Every glyph written into a `Grid` cell must be exactly one terminal cell wide. Two-column blocks are written as two separate cells.
- Glyphs are pinned by §49.4: ghost `░░` in full/reduced and `··` in ASCII; pieces `██` in full/reduced and `[]` in ASCII; bright foreground, never a foreground+background pair; the active piece one step brighter than locked cells.
- Board geometry comes from `internal/game` constants, never from literals: `game.Width` (10), `game.Height` (22), `game.VisibleHeight` (20), `game.HiddenRows` (2).
- Minimum usable terminal is 40×24 (§31). Below that, the too-small notice. Resizing must never panic (§31, §41).
- Golden files live in `internal/render/testdata/*.golden`, hold `Grid.Plain()` output, and are refreshed with `go test ./internal/render -update`.
- Doc comment on every exported identifier. `gofmt -l .` must print nothing before every commit.

## Review Focus

Five things design.md implies but never says, ordered by how likely they are to
bite a player. Each has a test in the task that owns the code.

1. **A zero or one-cell terminal size.** Bubble Tea delivers `WindowSizeMsg` before the first frame, and terminals under `tmux` or during a window drag report `0×0`. `Measure(0, 0)` and `Measure(1, 1)` must return `KindTooSmall` and render without panicking or dividing by zero — Task 3, and the notice itself in Task 6.
2. **A key pressed before the first `WindowSizeMsg`.** The model starts at width 0. A left-arrow arriving then must move the piece and must not panic when the resulting frame renders — Task 10.
3. **A frame after the process was suspended.** `ctrl-z` then `fg`, or a sleeping laptop, produces one `FrameMsg` whose elapsed time is minutes. That must not fast-forward the game through dozens of pieces; elapsed time per frame is clamped — Task 10.
4. **An overlay wider than the terminal.** The help box is 39 columns; a player at 40 columns who drags one column narrower must see it clipped, not a corrupted board or a panic — Task 8.
5. **A nine-digit score.** `Score` has no ceiling and the stat field is 8 columns. `100000000` must not widen the panel or bleed into the board — Task 5.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `internal/render/grid.go` | `Ink`, `Grid`: the cell buffer, clipping, run-coalesced output |
| `internal/render/palette.go` | `Mode`, `Palette`, `Glyphs`: colors and glyphs per rendering mode |
| `internal/render/layout.go` | `Kind`, `Layout`, `Measure`: adaptive geometry (§31, §49.3) |
| `internal/render/board.go` | locked cells, ghost, active piece, board border |
| `internal/render/hud.go` | HOLD / NEXT previews, score / lines / level / combo |
| `internal/render/chrome.go` | titled frame, mission-control line, controls line, too-small notice |
| `internal/render/overlay.go` | pause, help, and game-over boxes |
| `internal/render/render.go` | `Phase`, `Options`, `RenderGrid`, `Render`: frame assembly |
| `internal/app/keys.go` | `KeyMap` and the §8 bindings |
| `internal/app/messages.go` | `FrameMsg`, `FrameInterval`, the frame command |
| `internal/app/model.go` | `Config`, `Model`, `New`, `Init`, `View` |
| `internal/app/update.go` | `Update`: keys, resize, frame stepping, restart |
| `cmd/cosmic-tetris/main.go` | flag parsing, `--help` text, program start |

Test files sit beside their subjects (`grid_test.go`, `layout_test.go`, …), with
the frame-level golden tests in `internal/render/render_test.go` and
`internal/render/overlay_test.go`.

---

## Task 1: The cell buffer

Everything drawn in this plan goes through `Grid`. It exists so that panels
physically cannot corrupt the board (§41): a write outside the buffer is
dropped, and the last writer to a cell wins, so the compositing order of §37 is
the whole story.

**Files:**
- Create: `internal/render/grid.go`
- Test: `internal/render/grid_test.go`

**Interfaces:**
- Consumes: nothing from Plan 1.
- Produces:
  - `type Ink struct { Fg string; Bold bool; Dim bool }` — comparable, zero value means terminal default
  - `type Grid struct { W, H int; ... }`
  - `func NewGrid(w, h int) *Grid`
  - `func (g *Grid) Set(x, y int, r rune, ink Ink)` — silent no-op out of bounds
  - `func (g *Grid) SetString(x, y int, s string, ink Ink) int` — returns the x after the last rune
  - `func (g *Grid) At(x, y int) (rune, Ink)` — `(' ', Ink{})` out of bounds
  - `func (g *Grid) Plain() string`
  - `func (g *Grid) String() string`

- [ ] **Step 1: Write the failing test**

`internal/render/grid_test.go`:

```go
package render

import (
	"strings"
	"testing"

	"github.com/charmbracelet/x/ansi"
)

func TestGridStartsBlank(t *testing.T) {
	g := NewGrid(4, 2)
	if g.W != 4 || g.H != 2 {
		t.Fatalf("size = %dx%d, want 4x2", g.W, g.H)
	}
	if got, want := g.Plain(), "\n"; got != want {
		t.Errorf("Plain() = %q, want %q", got, want)
	}
	r, ink := g.At(0, 0)
	if r != ' ' || ink != (Ink{}) {
		t.Errorf("At(0,0) = %q,%+v, want space and zero ink", r, ink)
	}
}

func TestGridSetAndRead(t *testing.T) {
	g := NewGrid(4, 2)
	g.Set(1, 1, 'X', Ink{Fg: "#FF0000"})
	r, ink := g.At(1, 1)
	if r != 'X' || ink.Fg != "#FF0000" {
		t.Errorf("At(1,1) = %q,%+v, want X and #FF0000", r, ink)
	}
	if got, want := g.Plain(), "\n X"; got != want {
		t.Errorf("Plain() = %q, want %q", got, want)
	}
}

func TestGridSetStringClipsAtRightEdge(t *testing.T) {
	g := NewGrid(4, 1)
	if next := g.SetString(2, 0, "ABCD", Ink{}); next != 6 {
		t.Errorf("SetString returned %d, want 6", next)
	}
	if got, want := g.Plain(), "  AB"; got != want {
		t.Errorf("Plain() = %q, want %q", got, want)
	}
}

func TestGridWritesOutsideBoundsAreDropped(t *testing.T) {
	g := NewGrid(2, 2)
	g.Set(-1, 0, 'X', Ink{})
	g.Set(0, -1, 'X', Ink{})
	g.Set(2, 0, 'X', Ink{})
	g.Set(0, 2, 'X', Ink{})
	g.SetString(-5, 0, "hello", Ink{})
	g.SetString(0, 99, "hello", Ink{})
	if got, want := g.Plain(), "\n"; got != want {
		t.Errorf("Plain() = %q, want %q", got, want)
	}
}

func TestGridZeroSizeIsUsable(t *testing.T) {
	g := NewGrid(0, 0)
	g.Set(0, 0, 'X', Ink{})
	if got := g.Plain(); got != "" {
		t.Errorf("Plain() = %q, want empty", got)
	}
	if got := g.String(); got != "" {
		t.Errorf("String() = %q, want empty", got)
	}
}

func TestGridNegativeSizeIsClampedToZero(t *testing.T) {
	g := NewGrid(-3, -9)
	if g.W != 0 || g.H != 0 {
		t.Fatalf("size = %dx%d, want 0x0", g.W, g.H)
	}
}

func TestGridLastWriterWins(t *testing.T) {
	g := NewGrid(2, 1)
	g.Set(0, 0, 'a', Ink{})
	g.Set(0, 0, 'b', Ink{Bold: true})
	r, ink := g.At(0, 0)
	if r != 'b' || !ink.Bold {
		t.Errorf("At(0,0) = %q,%+v, want b and bold", r, ink)
	}
}

func TestGridStringStrippedEqualsPlain(t *testing.T) {
	g := NewGrid(8, 3)
	g.SetString(0, 0, "██", Ink{Fg: "#22D3EE"})
	g.SetString(2, 0, "░░", Ink{Fg: "51", Dim: true})
	g.SetString(1, 2, "SCORE", Ink{Bold: true})
	if got, want := ansi.Strip(g.String()), g.Plain(); got != want {
		t.Errorf("stripped String() = %q, want Plain() = %q", got, want)
	}
}

func TestGridStringCoalescesRuns(t *testing.T) {
	g := NewGrid(6, 1)
	cyan := Ink{Fg: "#22D3EE"}
	for x := 0; x < 6; x++ {
		g.Set(x, 0, '#', cyan)
	}
	out := g.String()
	if n := strings.Count(out, "\x1b["); n == 0 {
		t.Skip("lip gloss produced no styling in this environment")
	} else if n > 2 {
		t.Errorf("six identical cells produced %d escape sequences, want at most 2", n)
	}
}

func TestGridPlainHasOneLinePerRow(t *testing.T) {
	g := NewGrid(3, 5)
	if got, want := strings.Count(g.Plain(), "\n"), 4; got != want {
		t.Errorf("newlines = %d, want %d", got, want)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
go get charm.land/lipgloss/v2@v2.0.6
go get github.com/charmbracelet/x/ansi
go test ./internal/render
```

Expected: FAIL — `undefined: NewGrid`.

- [ ] **Step 3: Write the implementation**

`internal/render/grid.go`:

```go
// Package render turns game state into terminal output.
//
// Everything is drawn into a Grid: a fixed-size buffer of one-cell runes with
// styling attached per cell. Drawing is therefore order-dependent and
// bounds-safe — the last writer to a cell wins, and writes outside the buffer
// are dropped — which is how the HUD is prevented from corrupting the board and
// how a resize is prevented from panicking.
//
// The renderer never mutates game state.
package render

import (
	"strings"

	"charm.land/lipgloss/v2"
)

// Ink is the styling of a single cell. The zero Ink means the terminal's
// default foreground with no attributes. Ink is comparable so that adjacent
// cells sharing one can be emitted as a single styled run.
type Ink struct {
	// Fg is a Lip Gloss color specification: a hex string such as "#22D3EE" in
	// full mode, or a decimal ANSI palette index such as "51" in reduced and
	// ASCII modes. Empty means the terminal default.
	Fg string
	// Bold brightens the cell.
	Bold bool
	// Dim faints the cell.
	Dim bool
}

func (i Ink) style() lipgloss.Style {
	s := lipgloss.NewStyle()
	if i.Fg != "" {
		s = s.Foreground(lipgloss.Color(i.Fg))
	}
	if i.Bold {
		s = s.Bold(true)
	}
	if i.Dim {
		s = s.Faint(true)
	}
	return s
}

// Grid is a W by H buffer of terminal cells.
type Grid struct {
	// W is the width in cells.
	W int
	// H is the height in cells.
	H int

	runes []rune
	inks  []Ink
}

// NewGrid returns a blank w by h grid. Negative dimensions are clamped to zero,
// so a terminal that reports a nonsense size still yields a usable grid.
func NewGrid(w, h int) *Grid {
	if w < 0 {
		w = 0
	}
	if h < 0 {
		h = 0
	}
	g := &Grid{W: w, H: h, runes: make([]rune, w*h), inks: make([]Ink, w*h)}
	for i := range g.runes {
		g.runes[i] = ' '
	}
	return g
}

// Set writes one rune. Coordinates outside the grid are silently ignored.
// The rune must occupy exactly one terminal cell.
func (g *Grid) Set(x, y int, r rune, ink Ink) {
	if x < 0 || y < 0 || x >= g.W || y >= g.H {
		return
	}
	i := y*g.W + x
	g.runes[i] = r
	g.inks[i] = ink
}

// SetString writes s left to right starting at (x, y), one cell per rune,
// clipping at the grid edges. It returns the x coordinate one past the last
// rune, whether or not that rune landed inside the grid.
func (g *Grid) SetString(x, y int, s string, ink Ink) int {
	for _, r := range s {
		g.Set(x, y, r, ink)
		x++
	}
	return x
}

// At returns the rune and ink at (x, y), or a blank cell when out of bounds.
func (g *Grid) At(x, y int) (rune, Ink) {
	if x < 0 || y < 0 || x >= g.W || y >= g.H {
		return ' ', Ink{}
	}
	i := y*g.W + x
	return g.runes[i], g.inks[i]
}

// rowLen is the width of row y with trailing default-styled blanks removed, so
// that neither output form emits meaningless trailing whitespace.
func (g *Grid) rowLen(y int) int {
	n := g.W
	for n > 0 {
		r, ink := g.At(n-1, y)
		if r != ' ' || ink != (Ink{}) {
			break
		}
		n--
	}
	return n
}

// Plain renders the grid as unstyled text, one line per row, with no ANSI
// escapes at all. This is what the golden tests compare against.
func (g *Grid) Plain() string {
	var b strings.Builder
	for y := 0; y < g.H; y++ {
		if y > 0 {
			b.WriteByte('\n')
		}
		n := g.rowLen(y)
		for x := 0; x < n; x++ {
			r, _ := g.At(x, y)
			b.WriteRune(r)
		}
	}
	return b.String()
}

// String renders the grid for the terminal, coalescing horizontal runs of cells
// that share an Ink into a single styled string.
func (g *Grid) String() string {
	var b, run strings.Builder
	for y := 0; y < g.H; y++ {
		if y > 0 {
			b.WriteByte('\n')
		}
		n := g.rowLen(y)
		for x := 0; x < n; {
			_, ink := g.At(x, y)
			run.Reset()
			for x < n {
				r, cur := g.At(x, y)
				if cur != ink {
					break
				}
				run.WriteRune(r)
				x++
			}
			b.WriteString(ink.style().Render(run.String()))
		}
	}
	return b.String()
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
go test ./internal/render -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add go.mod go.sum internal/render/grid.go internal/render/grid_test.go
git commit -m "feat(render): cell grid with clipping and run-coalesced output"
```

---

## Task 2: Rendering modes, colors, and glyphs

Three modes (§32) and the pinned glyphs of §49.4. The width-guard test is the
important one: a single double-width rune sneaking into the glyph table shifts
every column to its right and silently destroys the board, and it would pass
every other test in this plan.

**Files:**
- Create: `internal/render/palette.go`
- Test: `internal/render/palette_test.go`

**Interfaces:**
- Consumes: `game.KindCount`, `game.PieceKind` and its `KindI…KindZ` constants; `Ink` from Task 1.
- Produces:
  - `type Mode uint8` with `ModeFull`, `ModeReduced`, `ModeASCII`; `func (Mode) String() string`
  - `type Glyphs struct { ... }` — `Block`, `Ghost` (two cells each), the board and frame box-drawing runes, `Comet`, `Star`, `ArrowLeftRight`, `ArrowUp`, `ArrowDown`
  - `type Palette struct { Mode Mode; Glyphs Glyphs; Locked, Active [game.KindCount]Ink; Ghost, Border, Title, Label, Value, Mission, Controls, Overlay, Star Ink }`
  - `func NewPalette(m Mode) Palette`

- [ ] **Step 1: Write the failing test**

`internal/render/palette_test.go`:

```go
package render

import (
	"reflect"
	"testing"

	"charm.land/lipgloss/v2"

	"cosmic-tetris/internal/game"
)

func TestModeString(t *testing.T) {
	for _, tc := range []struct {
		mode Mode
		want string
	}{
		{ModeFull, "full"},
		{ModeReduced, "reduced"},
		{ModeASCII, "ascii"},
	} {
		if got := tc.mode.String(); got != tc.want {
			t.Errorf("Mode(%d).String() = %q, want %q", tc.mode, got, tc.want)
		}
	}
}

func TestPinnedGlyphs(t *testing.T) {
	for _, tc := range []struct {
		mode        Mode
		block, ghost string
	}{
		{ModeFull, "██", "░░"},
		{ModeReduced, "██", "░░"},
		{ModeASCII, "[]", "··"},
	} {
		p := NewPalette(tc.mode)
		if p.Glyphs.Block != tc.block {
			t.Errorf("%s block = %q, want %q", tc.mode, p.Glyphs.Block, tc.block)
		}
		if p.Glyphs.Ghost != tc.ghost {
			t.Errorf("%s ghost = %q, want %q", tc.mode, p.Glyphs.Ghost, tc.ghost)
		}
	}
}

// TestGlyphWidths is the guard that keeps the board from shearing sideways: a
// double-width rune in the glyph table would shift every column after it.
func TestGlyphWidths(t *testing.T) {
	for _, mode := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		gl := reflect.ValueOf(NewPalette(mode).Glyphs)
		typ := gl.Type()
		for i := 0; i < gl.NumField(); i++ {
			name := typ.Field(i).Name
			switch f := gl.Field(i); f.Kind() {
			case reflect.String:
				s := f.String()
				want := 1
				if name == "Block" || name == "Ghost" {
					want = 2
				}
				if got := lipgloss.Width(s); got != want {
					t.Errorf("%s glyph %s = %q, width %d, want %d", mode, name, s, got, want)
				}
			case reflect.Int32:
				s := string(rune(f.Int()))
				if got := lipgloss.Width(s); got != 1 {
					t.Errorf("%s glyph %s = %q, width %d, want 1", mode, name, s, got)
				}
			default:
				t.Errorf("glyph field %s has unexpected kind %s", name, f.Kind())
			}
		}
	}
}

func TestASCIIModeGlyphsAreLatin1(t *testing.T) {
	gl := reflect.ValueOf(NewPalette(ModeASCII).Glyphs)
	for i := 0; i < gl.NumField(); i++ {
		f := gl.Field(i)
		var runes []rune
		if f.Kind() == reflect.String {
			runes = []rune(f.String())
		} else {
			runes = []rune{rune(f.Int())}
		}
		for _, r := range runes {
			if r > 0xFF {
				t.Errorf("ASCII glyph %s contains U+%04X, above Latin-1", gl.Type().Field(i).Name, r)
			}
		}
	}
}

func TestEveryKindHasDistinctLockedAndActiveInk(t *testing.T) {
	for _, mode := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		p := NewPalette(mode)
		seen := map[string]game.PieceKind{}
		for k := game.PieceKind(0); k < game.KindCount; k++ {
			locked, active := p.Locked[k], p.Active[k]
			if locked.Fg == "" {
				t.Errorf("%s: kind %c has no locked color", mode, k.Letter())
			}
			if active.Fg == "" {
				t.Errorf("%s: kind %c has no active color", mode, k.Letter())
			}
			if locked == active {
				t.Errorf("%s: kind %c renders identically locked and active", mode, k.Letter())
			}
			if prev, dup := seen[locked.Fg]; dup {
				t.Errorf("%s: kinds %c and %c share locked color %s", mode, prev.Letter(), k.Letter(), locked.Fg)
			}
			seen[locked.Fg] = k
		}
	}
}

func TestChromeInksArePopulated(t *testing.T) {
	for _, mode := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		p := NewPalette(mode)
		for name, ink := range map[string]Ink{
			"Ghost": p.Ghost, "Border": p.Border, "Title": p.Title,
			"Label": p.Label, "Value": p.Value, "Mission": p.Mission,
			"Controls": p.Controls, "Overlay": p.Overlay, "Star": p.Star,
		} {
			if ink.Fg == "" {
				t.Errorf("%s: chrome ink %s has no color", mode, name)
			}
		}
		if p.Mode != mode {
			t.Errorf("palette reports mode %s, want %s", p.Mode, mode)
		}
	}
}

func TestGhostIsDim(t *testing.T) {
	// Ghost must never compete with a locked block for attention (§10, §44).
	if p := NewPalette(ModeFull); !p.Ghost.Dim {
		t.Error("full-mode ghost ink is not dim")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
go test ./internal/render -run 'Mode|Glyph|Palette|Kind|Chrome|Ghost'
```

Expected: FAIL — `undefined: NewPalette`.

- [ ] **Step 3: Write the implementation**

`internal/render/palette.go`:

```go
package render

import "cosmic-tetris/internal/game"

// Mode is a rendering capability level (design §32).
type Mode uint8

// The three rendering modes. Full is the default; ASCII is selected with
// --ascii and assumes nothing about Unicode support beyond Latin-1.
const (
	ModeFull Mode = iota
	ModeReduced
	ModeASCII
)

// String returns the mode's flag-style name.
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

// Glyphs are the characters a mode draws with. Block and Ghost are two terminal
// cells wide, matching one logical board cell (§5); every other glyph is one
// cell. Nothing here may be wider than stated — a wide rune shifts every column
// after it and corrupts the board.
type Glyphs struct {
	// Block is a filled board cell (§49.4).
	Block string
	// Ghost is a landing-preview cell (§49.4).
	Ghost string

	// The board's machinery border (§25).
	BoardTL, BoardTR, BoardBL, BoardBR, BoardH, BoardV rune
	// The outer titled frame (§4).
	FrameTL, FrameTR, FrameBL, FrameBR, FrameH, FrameV rune

	// Comet prefixes the mission-control line (§27).
	Comet rune
	// Star decorates the title (§4).
	Star rune
	// Times separates terminal dimensions in the too-small notice (§31).
	Times rune

	// Control-hint arrows for the controls line and help overlay (§8).
	ArrowLeftRight, ArrowUp, ArrowDown string
}

// Palette is a complete set of colors and glyphs for one rendering mode.
// Locked and Active are indexed by game.PieceKind; Active is the brighter of
// the pair, as pinned in §49.4.
type Palette struct {
	// Mode is the mode this palette was built for.
	Mode Mode
	// Glyphs are the drawing characters for this mode.
	Glyphs Glyphs

	// Locked styles settled board cells.
	Locked [game.KindCount]Ink
	// Active styles the falling piece, one step brighter.
	Active [game.KindCount]Ink

	// Chrome inks.
	Ghost, Border, Title, Label, Value, Mission, Controls, Overlay, Star Ink
}

var unicodeGlyphs = Glyphs{
	Block:   "██",
	Ghost:   "░░",
	BoardTL: '╔', BoardTR: '╗', BoardBL: '╚', BoardBR: '╝', BoardH: '═', BoardV: '║',
	FrameTL: '╭', FrameTR: '╮', FrameBL: '╰', FrameBR: '╯', FrameH: '─', FrameV: '│',
	Comet: '☄', Star: '✦', Times: '×',
	ArrowLeftRight: "←→", ArrowUp: "↑", ArrowDown: "↓",
}

var asciiGlyphs = Glyphs{
	Block:   "[]",
	Ghost:   "··",
	BoardTL: '+', BoardTR: '+', BoardBL: '+', BoardBR: '+', BoardH: '=', BoardV: '|',
	FrameTL: '+', FrameTR: '+', FrameBL: '+', FrameBR: '+', FrameH: '-', FrameV: '|',
	Comet: '>', Star: '*', Times: 'x',
	ArrowLeftRight: "<>", ArrowUp: "^", ArrowDown: "v",
}

// The neon space palette of §26, one entry per kind in game.PieceKind order
// (I, J, L, O, S, T, Z): plasma cyan, deep electric blue, solar orange,
// stellar gold, alien green, ultraviolet, supernova pink.
var (
	fullLocked = [game.KindCount]string{"#22D3EE", "#3B5BFF", "#FF8A1F", "#FFD227", "#39FF7A", "#A855F7", "#FF3D71"}
	fullActive = [game.KindCount]string{"#A5F3FC", "#93B4FF", "#FFC489", "#FFEE9C", "#A7FFC4", "#D8B4FE", "#FF9EB8"}

	reducedLocked = [game.KindCount]string{"51", "63", "208", "220", "47", "141", "197"}
	reducedActive = [game.KindCount]string{"87", "105", "215", "229", "120", "183", "218"}

	asciiLocked = [game.KindCount]string{"6", "4", "3", "11", "2", "5", "1"}
	asciiActive = [game.KindCount]string{"14", "12", "11", "15", "10", "13", "9"}
)

// NewPalette returns the palette for a rendering mode.
func NewPalette(m Mode) Palette {
	p := Palette{Mode: m, Glyphs: unicodeGlyphs}
	locked, active := fullLocked, fullActive

	switch m {
	case ModeReduced:
		locked, active = reducedLocked, reducedActive
		p.Ghost = Ink{Fg: "240", Dim: true}
		p.Border = Ink{Fg: "93"}
		p.Title = Ink{Fg: "189", Bold: true}
		p.Label = Ink{Fg: "244"}
		p.Value = Ink{Fg: "252", Bold: true}
		p.Mission = Ink{Fg: "51"}
		p.Controls = Ink{Fg: "244"}
		p.Overlay = Ink{Fg: "189"}
		p.Star = Ink{Fg: "220"}
	case ModeASCII:
		p.Glyphs = asciiGlyphs
		locked, active = asciiLocked, asciiActive
		p.Ghost = Ink{Fg: "8", Dim: true}
		p.Border = Ink{Fg: "5"}
		p.Title = Ink{Fg: "7", Bold: true}
		p.Label = Ink{Fg: "8"}
		p.Value = Ink{Fg: "7", Bold: true}
		p.Mission = Ink{Fg: "6"}
		p.Controls = Ink{Fg: "8"}
		p.Overlay = Ink{Fg: "7"}
		p.Star = Ink{Fg: "3"}
	default:
		p.Ghost = Ink{Fg: "#4B5563", Dim: true}
		p.Border = Ink{Fg: "#7C3AED"}
		p.Title = Ink{Fg: "#E0E7FF", Bold: true}
		p.Label = Ink{Fg: "#64748B"}
		p.Value = Ink{Fg: "#E2E8F0", Bold: true}
		p.Mission = Ink{Fg: "#22D3EE"}
		p.Controls = Ink{Fg: "#64748B"}
		p.Overlay = Ink{Fg: "#E0E7FF"}
		p.Star = Ink{Fg: "#FBBF24"}
	}

	for k := 0; k < game.KindCount; k++ {
		p.Locked[k] = Ink{Fg: locked[k]}
		p.Active[k] = Ink{Fg: active[k], Bold: true}
	}
	return p
}
```

Note on `··`: U+00B7 is Latin-1, not strict 7-bit ASCII, but it is the glyph
pinned in §49.4 and it measures one cell. `TestASCIIModeGlyphsAreLatin1` holds
the line there so nothing more exotic creeps in.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
go test ./internal/render -v
```

Expected: PASS. If `TestEveryKindHasDistinctLockedAndActiveInk` reports a shared
color, change the offending value in this file — do not weaken the test.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/render/palette.go internal/render/palette_test.go
git commit -m "feat(render): neon space palette and per-mode glyph tables"
```

---

## Task 3: Adaptive layout geometry

Pure arithmetic: terminal size in, cell coordinates out. Everything drawn later
reads its position from a `Layout`, so this is the single place where §31 and
§49.3 are decided, and the sweep test at the end is what makes "resize doesn't
panic" (§41) true by construction rather than by luck.

The §49.3 drop order is implemented as follows, and one honest consequence is
worth writing down: at the 40×24 floor, board (22 rows) + mission (1) +
controls (1) is exactly 24, so **the title frame is the only element that ever
actually drops for height** — mission control never has to. Stat labels drop in
the Small layout instead, for width: an 8-column panel has no room for
`LINES 042`, so it shows `042` alone, which is exactly what §49.3 asks for.

**Files:**
- Create: `internal/render/layout.go`
- Test: `internal/render/layout_test.go`

**Interfaces:**
- Consumes: `game.Width`, `game.VisibleHeight`.
- Produces:
  - `type Kind uint8` with `KindTooSmall`, `KindSmall`, `KindMedium`, `KindWide`; `func (Kind) String() string`
  - `const BoardW = 2*game.Width + 2` (22), `const BoardH = game.VisibleHeight + 2` (22)
  - `const MinWidth = 40`, `const MinHeight = 24`
  - `type Layout struct { ... }` with the fields listed in the implementation below — including `Frame`, `Mission`, `StatLabels`, `NextCount`, `SplitPanels`, `PanelW`, `ContentX/ContentW`, `FrameX/FrameY/FrameW/FrameH`, `BoardX/BoardY`, `LeftX`, `RightX`, `MissionY`, `ControlsY`
  - `func Measure(w, h int) Layout`

- [ ] **Step 1: Write the failing test**

`internal/render/layout_test.go`:

```go
package render

import (
	"testing"

	"cosmic-tetris/internal/game"
)

func TestBoardBoxDimensions(t *testing.T) {
	if BoardW != 22 {
		t.Errorf("BoardW = %d, want 22 (%d cells at two columns each plus two border columns)", BoardW, game.Width)
	}
	if BoardH != 22 {
		t.Errorf("BoardH = %d, want 22 (%d visible rows plus two border rows)", BoardH, game.VisibleHeight)
	}
}

func TestKindString(t *testing.T) {
	for _, tc := range []struct {
		kind Kind
		want string
	}{
		{KindTooSmall, "too-small"},
		{KindSmall, "small"},
		{KindMedium, "medium"},
		{KindWide, "wide"},
	} {
		if got := tc.kind.String(); got != tc.want {
			t.Errorf("Kind(%d).String() = %q, want %q", tc.kind, got, tc.want)
		}
	}
}

// Review Focus 1: a terminal that reports nothing, or almost nothing.
func TestDegenerateSizesAreTooSmall(t *testing.T) {
	for _, size := range [][2]int{{0, 0}, {1, 1}, {-1, -1}, {39, 24}, {40, 23}, {39, 23}, {20, 60}, {200, 5}} {
		l := Measure(size[0], size[1])
		if l.Kind != KindTooSmall {
			t.Errorf("Measure(%d,%d).Kind = %s, want too-small", size[0], size[1], l.Kind)
		}
		if l.W != size[0] || l.H != size[1] {
			t.Errorf("Measure(%d,%d) did not record its size: %+v", size[0], size[1], l)
		}
	}
}

func TestFloorTerminalIsSmall(t *testing.T) {
	l := Measure(MinWidth, MinHeight)
	if l.Kind != KindSmall {
		t.Fatalf("Kind = %s, want small", l.Kind)
	}
	if l.Frame {
		t.Error("Frame is on at the 40x24 floor; the title border is the first thing to drop (§49.3)")
	}
	if !l.Mission {
		t.Error("Mission dropped at the floor; board+mission+controls is exactly 24 rows")
	}
	if l.StatLabels {
		t.Error("StatLabels on in the small layout; §49.3 keeps values and drops labels")
	}
	if l.NextCount != 3 {
		t.Errorf("NextCount = %d, want 3 (§49.3 truncates NEXT beside the board)", l.NextCount)
	}
	if l.SplitPanels {
		t.Error("SplitPanels on in the small layout; there is one panel, beside the board")
	}
	if l.PanelW != 8 {
		t.Errorf("PanelW = %d, want 8", l.PanelW)
	}
	if l.ContentW != 31 {
		t.Errorf("ContentW = %d, want 31 (22 board + 1 gap + 8 panel)", l.ContentW)
	}
	if l.BoardX != 4 || l.BoardY != 0 {
		t.Errorf("board at (%d,%d), want (4,0)", l.BoardX, l.BoardY)
	}
	if l.RightX != 4+BoardW+1 {
		t.Errorf("RightX = %d, want %d", l.RightX, 4+BoardW+1)
	}
	if l.MissionY != 22 || l.ControlsY != 23 {
		t.Errorf("mission/controls at %d/%d, want 22/23", l.MissionY, l.ControlsY)
	}
	if l.FrameY != -1 {
		t.Errorf("FrameY = %d, want -1 when there is no frame", l.FrameY)
	}
}

func TestMediumLayout(t *testing.T) {
	l := Measure(44, 24)
	if l.Kind != KindMedium {
		t.Fatalf("Kind = %s, want medium", l.Kind)
	}
	if !l.StatLabels || l.NextCount != 5 || l.PanelW != 10 || l.SplitPanels {
		t.Errorf("unexpected medium configuration: %+v", l)
	}
	if l.ContentW != 34 {
		t.Errorf("ContentW = %d, want 34 (22 board + 2 gap + 10 panel)", l.ContentW)
	}
	if l.BoardX != 5 {
		t.Errorf("BoardX = %d, want 5", l.BoardX)
	}
	if l.RightX != 5+BoardW+2 {
		t.Errorf("RightX = %d, want %d", l.RightX, 5+BoardW+2)
	}
}

func TestWideLayoutWithFrame(t *testing.T) {
	l := Measure(52, 26)
	if l.Kind != KindWide {
		t.Fatalf("Kind = %s, want wide", l.Kind)
	}
	if !l.SplitPanels {
		t.Error("wide layout should split HOLD/stats left from NEXT right")
	}
	if !l.Frame {
		t.Error("Frame off at 52x26, which is exactly the wide frame's size")
	}
	if l.ContentW != 46 {
		t.Errorf("ContentW = %d, want 46 (10 + 2 + 22 + 2 + 10)", l.ContentW)
	}
	if l.FrameW != 52 || l.FrameX != 0 {
		t.Errorf("frame at x=%d width %d, want x=0 width 52", l.FrameX, l.FrameW)
	}
	if l.ContentX != 3 || l.LeftX != 3 || l.BoardX != 15 || l.RightX != 39 {
		t.Errorf("columns: content %d left %d board %d right %d, want 3/3/15/39",
			l.ContentX, l.LeftX, l.BoardX, l.RightX)
	}
	if l.FrameY != 0 || l.FrameH != 26 {
		t.Errorf("frame rows %d..%d, want 0..25", l.FrameY, l.FrameY+l.FrameH-1)
	}
	if l.BoardY != 1 || l.MissionY != 23 || l.ControlsY != 24 {
		t.Errorf("rows: board %d mission %d controls %d, want 1/23/24",
			l.BoardY, l.MissionY, l.ControlsY)
	}
}

// At 30 rows the whole content block floats, centered, inside the terminal
// rather than stretching the frame to the edges and stranding the controls.
func TestWideLayoutIsCenteredWhenRoomy(t *testing.T) {
	l := Measure(80, 30)
	if l.Kind != KindWide || !l.Frame {
		t.Fatalf("Kind = %s, Frame = %v, want wide with a frame", l.Kind, l.Frame)
	}
	if l.FrameW != 52 || l.FrameX != 14 {
		t.Errorf("frame at x=%d width %d, want x=14 width 52", l.FrameX, l.FrameW)
	}
	if l.FrameY != 1 || l.FrameH != 28 {
		t.Errorf("frame rows %d..%d, want 1..28", l.FrameY, l.FrameY+l.FrameH-1)
	}
	if l.BoardY != 3 {
		t.Errorf("BoardY = %d, want 3 (frame row 1, padding row 2, board from 3)", l.BoardY)
	}
	if l.MissionY != 26 || l.ControlsY != 27 {
		t.Errorf("mission/controls at %d/%d, want 26/27", l.MissionY, l.ControlsY)
	}
}

func TestFrameDropsForHeightOnly(t *testing.T) {
	if l := Measure(52, 25); l.Frame {
		t.Error("Frame on at 25 rows; the frame costs two rows on top of the 24-row content")
	}
	if l := Measure(51, 40); l.Kind == KindWide {
		t.Error("51 columns should not select the wide layout")
	}
	for _, w := range []int{40, 43, 44, 51, 52, 200} {
		if l := Measure(w, 26); !l.Frame {
			t.Errorf("Frame off at %dx26; every layout's frame fits its own minimum width", w)
		}
	}
}

// The sweep is the real contract: nothing Measure returns may point outside the
// terminal, at any size, ever (§41 "resize doesn't panic").
func TestMeasureNeverEscapesTheTerminal(t *testing.T) {
	for w := -2; w <= 140; w++ {
		for h := -2; h <= 60; h++ {
			l := Measure(w, h)
			if l.Kind == KindTooSmall {
				continue
			}
			if l.BoardX < 0 || l.BoardX+BoardW > w {
				t.Fatalf("%dx%d: board columns %d..%d escape the terminal", w, h, l.BoardX, l.BoardX+BoardW-1)
			}
			if l.BoardY < 0 || l.BoardY+BoardH > h {
				t.Fatalf("%dx%d: board rows %d..%d escape the terminal", w, h, l.BoardY, l.BoardY+BoardH-1)
			}
			if l.RightX+l.PanelW > w {
				t.Fatalf("%dx%d: right panel ends at %d, past the terminal", w, h, l.RightX+l.PanelW)
			}
			if l.SplitPanels && (l.LeftX < 0 || l.LeftX+l.PanelW > l.BoardX) {
				t.Fatalf("%dx%d: left panel %d..%d overlaps the board at %d", w, h, l.LeftX, l.LeftX+l.PanelW-1, l.BoardX)
			}
			if l.ControlsY >= h || l.ControlsY <= l.BoardY+BoardH-1 {
				t.Fatalf("%dx%d: controls row %d collides with the board or the bottom edge", w, h, l.ControlsY)
			}
			if l.Mission && (l.MissionY >= l.ControlsY || l.MissionY < l.BoardY+BoardH) {
				t.Fatalf("%dx%d: mission row %d is not between the board and the controls", w, h, l.MissionY)
			}
			if l.Frame {
				if l.FrameX < 0 || l.FrameX+l.FrameW > w {
					t.Fatalf("%dx%d: frame columns %d..%d escape the terminal", w, h, l.FrameX, l.FrameX+l.FrameW-1)
				}
				if l.FrameY < 0 || l.FrameY+l.FrameH > h {
					t.Fatalf("%dx%d: frame rows %d..%d escape the terminal", w, h, l.FrameY, l.FrameY+l.FrameH-1)
				}
				if l.ContentX < l.FrameX+1 {
					t.Fatalf("%dx%d: content at %d is inside the frame border at %d", w, h, l.ContentX, l.FrameX)
				}
				if l.BoardY <= l.FrameY || l.ControlsY >= l.FrameY+l.FrameH-1 {
					t.Fatalf("%dx%d: board row %d / controls row %d fall outside frame rows %d..%d",
						w, h, l.BoardY, l.ControlsY, l.FrameY, l.FrameY+l.FrameH-1)
				}
			} else if l.FrameY != -1 {
				t.Fatalf("%dx%d: FrameY = %d without a frame, want -1", w, h, l.FrameY)
			}
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
go test ./internal/render -run 'Board|Kind|Degenerate|Floor|Medium|Wide|Frame|Measure'
```

Expected: FAIL — `undefined: Measure`.

- [ ] **Step 3: Write the implementation**

`internal/render/layout.go`:

```go
package render

import "cosmic-tetris/internal/game"

// Board box dimensions in terminal cells. A logical board cell is two columns
// wide and one row tall (§5), and the board is wrapped in a one-cell border.
const (
	// BoardW is the width of the bordered board box.
	BoardW = 2*game.Width + 2
	// BoardH is the height of the bordered board box.
	BoardH = game.VisibleHeight + 2
)

// The minimum usable terminal (§31). Anything smaller gets the too-small notice.
const (
	// MinWidth is the narrowest terminal the game will draw in.
	MinWidth = 40
	// MinHeight is the shortest terminal the game will draw in.
	MinHeight = 24
)

// Content widths, before the frame's border and padding.
const (
	widePanelW  = 10
	smallPanelW = 8

	wideContentW   = widePanelW + 2 + BoardW + 2 + widePanelW // 46
	mediumContentW = BoardW + 2 + widePanelW                  // 34
	smallContentW  = BoardW + 1 + smallPanelW                 // 31

	// frameChrome is the columns the outer frame adds: a border column and two
	// padding columns on each side.
	frameChrome = 6

	// The narrowest terminal each layout will accept. Wide asks for the columns
	// its frame needs so that the roomiest layout always gets its title.
	wideMinWidth   = wideContentW + frameChrome // 52
	mediumMinWidth = 44
)

// Kind is which of the four layout shapes fits the terminal.
type Kind uint8

// The layout shapes, narrowest first.
const (
	// KindTooSmall means the terminal is below 40x24 and only the notice is drawn.
	KindTooSmall Kind = iota
	// KindSmall is board plus a narrow panel: three NEXT pieces, no stat labels.
	KindSmall
	// KindMedium is board plus one compact HUD column (§31).
	KindMedium
	// KindWide is HOLD and stats left, board centered, NEXT right (§31).
	KindWide
)

// String returns the layout's name, as used in golden file names.
func (k Kind) String() string {
	switch k {
	case KindSmall:
		return "small"
	case KindMedium:
		return "medium"
	case KindWide:
		return "wide"
	default:
		return "too-small"
	}
}

// Layout is the resolved geometry of one frame: which elements are present and
// where each one starts. All coordinates are cell coordinates inside a Grid of
// the terminal's size, and Measure guarantees every one of them is inside it.
type Layout struct {
	// Kind is the layout shape.
	Kind Kind
	// W and H are the terminal size this layout was measured for.
	W, H int

	// Frame is true when the outer titled frame is drawn (§4).
	Frame bool
	// Mission is true when the mission-control line is drawn (§27).
	Mission bool
	// StatLabels is true when stats show their labels as well as their values.
	StatLabels bool
	// NextCount is how many upcoming pieces the NEXT panel shows (§49.3).
	NextCount int
	// SplitPanels is true when HOLD and stats sit left of the board and NEXT
	// sits right of it; otherwise a single panel sits right of the board.
	SplitPanels bool
	// PanelW is the width of a panel column.
	PanelW int

	// ContentX and ContentW bound the block the frame wraps, and are what the
	// mission and controls lines center themselves on.
	ContentX, ContentW int
	// FrameX, FrameY, FrameW and FrameH bound the outer frame box. FrameY is -1
	// when there is no frame; the others are then meaningless.
	FrameX, FrameY, FrameW, FrameH int

	// BoardX and BoardY are the top-left cell of the bordered board box.
	BoardX, BoardY int
	// LeftX is the left panel column. Meaningless unless SplitPanels.
	LeftX int
	// RightX is the right panel column.
	RightX int

	// MissionY is the mission-control row, or -1 when there is none.
	MissionY int
	// ControlsY is the controls row, or -1 when the terminal is too small.
	ControlsY int
}

// Measure resolves the layout for a terminal of w by h cells. It never panics
// and never returns a coordinate outside the terminal; for anything below
// 40x24 it returns KindTooSmall with only W and H set.
func Measure(w, h int) Layout {
	l := Layout{W: w, H: h, Kind: KindTooSmall, FrameY: -1, MissionY: -1, ControlsY: -1}
	if w < MinWidth || h < MinHeight {
		return l
	}

	gap := 2
	switch {
	case w >= wideMinWidth:
		l.Kind = KindWide
		l.ContentW, l.PanelW = wideContentW, widePanelW
		l.SplitPanels, l.StatLabels, l.NextCount = true, true, game.NextQueueLen
	case w >= mediumMinWidth:
		l.Kind = KindMedium
		l.ContentW, l.PanelW = mediumContentW, widePanelW
		l.StatLabels, l.NextCount = true, game.NextQueueLen
	default:
		l.Kind = KindSmall
		l.ContentW, l.PanelW = smallContentW, smallPanelW
		l.NextCount = 3
		gap = 1
	}

	// Mission control always fits: 22 board rows + mission + controls is
	// exactly the 24-row floor. The frame is the only element that ever drops
	// for height (§49.3), and every layout's frame fits its own minimum width by
	// construction — 37 columns at 40, 40 at 44, 52 at 52 — so height decides.
	l.Mission = true
	l.Frame = h >= MinHeight+2

	if l.Frame {
		l.FrameW = l.ContentW + frameChrome
		l.FrameX = (w - l.FrameW) / 2
		l.ContentX = l.FrameX + 3
	} else {
		l.ContentX = (w - l.ContentW) / 2
	}

	if l.SplitPanels {
		l.LeftX = l.ContentX
		l.BoardX = l.ContentX + l.PanelW + gap
	} else {
		l.BoardX = l.ContentX
	}
	l.RightX = l.BoardX + BoardW + gap

	// The rows form one content block, top to bottom: frame top, a padding row,
	// the board, a blank row, mission control, controls, frame bottom. The
	// padding row and the blank row are dropped, in that order, when the
	// terminal is too short for them; the block is then centered vertically so a
	// tall terminal does not strand the controls at the very bottom.
	frameRows, padTop, gapRows := 0, 0, 1
	if l.Frame {
		frameRows, padTop = 2, 1
	}
	need := frameRows + padTop + BoardH + gapRows + 2 // + mission + controls
	if need > h {
		gapRows, need = 0, need-1
	}
	if need > h && padTop > 0 {
		padTop, need = 0, need-1
	}

	y := (h - need) / 2
	if l.Frame {
		l.FrameY, l.FrameH = y, need
		y++
	}
	y += padTop
	l.BoardY = y
	y += BoardH + gapRows
	l.MissionY = y
	l.ControlsY = y + 1

	return l
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
go test ./internal/render -v
```

Expected: PASS, including the full sweep.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/render/layout.go internal/render/layout_test.go
git commit -m "feat(render): adaptive layout geometry for the four terminal sizes"
```

---

## Task 4: The board, ghost, and active piece

Steps 3 through 7 of the §37 pipeline. Locked cells, then ghost, then the active
piece, then the border — in that order, because the buffer's last writer wins and
that is what makes "ghost never obscures locked blocks" (§10) and "never obscure
the active piece" (§44) true.

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: `Grid`, `Ink`, `Palette`, `Layout`, `BoardW`, `BoardH`; `game.Game` and its `Board`, `Active`, `State`, `Ghost()`; `game.Width`, `game.Height`, `game.HiddenRows`; `game.Cell.Filled()`, `game.Cell.Kind()`; `game.Piece.Blocks()`; `game.StatePlaying`.
- Produces:
  - `func DrawBoard(gr *Grid, g *game.Game, l Layout, p Palette)`
  - `func drawBox(gr *Grid, x, y, w, h int, tl, tr, bl, br, hz, vt rune, ink Ink)` — unexported, reused by the frame and the overlays
  - `func CellOrigin(l Layout, x, y int) (gx, gy int, visible bool)` — exported because Plan 3's board-local effects need the same mapping

- [ ] **Step 1: Write the failing test**

`internal/render/board_test.go`:

```go
package render

import (
	"math/rand/v2"
	"testing"

	"cosmic-tetris/internal/game"
)

// testGame returns a game with a known active piece and an empty board, so
// renderer tests never depend on what the bag produced.
func testGame(t *testing.T) *game.Game {
	t.Helper()
	g := game.New(1)
	g.Active = game.Piece{Kind: game.KindO, Rotation: 0, X: 4, Y: 2}
	g.Board = game.Board{}
	return g
}

func TestCellOriginMapsVisibleRows(t *testing.T) {
	l := Measure(80, 30)
	// Row 2 is the first visible row; row 21 is the floor.
	if gx, gy, ok := CellOrigin(l, 0, game.HiddenRows); !ok || gx != l.BoardX+1 || gy != l.BoardY+1 {
		t.Errorf("CellOrigin(0,%d) = %d,%d,%v; want %d,%d,true", game.HiddenRows, gx, gy, ok, l.BoardX+1, l.BoardY+1)
	}
	if gx, gy, ok := CellOrigin(l, game.Width-1, game.Height-1); !ok ||
		gx != l.BoardX+1+2*(game.Width-1) || gy != l.BoardY+BoardH-2 {
		t.Errorf("bottom-right cell = %d,%d,%v", gx, gy, ok)
	}
}

func TestCellOriginRejectsHiddenAndOutOfRange(t *testing.T) {
	l := Measure(80, 30)
	for _, c := range [][2]int{{0, 0}, {0, 1}, {0, -1}, {-1, 5}, {game.Width, 5}, {0, game.Height}} {
		if _, _, ok := CellOrigin(l, c[0], c[1]); ok {
			t.Errorf("CellOrigin(%d,%d) reported visible", c[0], c[1])
		}
	}
}

func TestBoardBorderIsDrawn(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	p := NewPalette(ModeFull)
	DrawBoard(gr, testGame(t), l, p)

	corners := []struct {
		x, y int
		want rune
	}{
		{l.BoardX, l.BoardY, '╔'},
		{l.BoardX + BoardW - 1, l.BoardY, '╗'},
		{l.BoardX, l.BoardY + BoardH - 1, '╚'},
		{l.BoardX + BoardW - 1, l.BoardY + BoardH - 1, '╝'},
		{l.BoardX + 1, l.BoardY, '═'},
		{l.BoardX, l.BoardY + 1, '║'},
	}
	for _, c := range corners {
		if r, ink := gr.At(c.x, c.y); r != c.want {
			t.Errorf("at (%d,%d) got %q, want %q", c.x, c.y, r, c.want)
		} else if ink != p.Border {
			t.Errorf("border ink at (%d,%d) = %+v, want %+v", c.x, c.y, ink, p.Border)
		}
	}
}

func TestNothingIsDrawnOutsideTheBoardBox(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	g := testGame(t)
	for x := 0; x < game.Width; x++ {
		g.Board.Set(x, game.Height-1, game.FilledCell(game.KindZ))
	}
	DrawBoard(gr, g, l, NewPalette(ModeFull))

	for y := 0; y < l.H; y++ {
		for x := 0; x < l.W; x++ {
			inside := x >= l.BoardX && x < l.BoardX+BoardW && y >= l.BoardY && y < l.BoardY+BoardH
			if inside {
				continue
			}
			if r, _ := gr.At(x, y); r != ' ' {
				t.Fatalf("DrawBoard wrote %q at (%d,%d), outside the board box", r, x, y)
			}
		}
	}
}

func TestLockedCellsRenderAtTheirCoordinates(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	p := NewPalette(ModeFull)
	g := testGame(t)
	g.Board.Set(0, game.Height-1, game.FilledCell(game.KindI))
	g.Board.Set(game.Width-1, game.Height-1, game.FilledCell(game.KindZ))
	DrawBoard(gr, g, l, p)

	gx, gy, _ := CellOrigin(l, 0, game.Height-1)
	r0, ink0 := gr.At(gx, gy)
	r1, _ := gr.At(gx+1, gy)
	if r0 != '█' || r1 != '█' {
		t.Errorf("locked cell rendered %q%q, want two full blocks", r0, r1)
	}
	if ink0 != p.Locked[game.KindI] {
		t.Errorf("locked I ink = %+v, want %+v", ink0, p.Locked[game.KindI])
	}
	gx, gy, _ = CellOrigin(l, game.Width-1, game.Height-1)
	if _, ink := gr.At(gx, gy); ink != p.Locked[game.KindZ] {
		t.Errorf("locked Z ink = %+v, want %+v", ink, p.Locked[game.KindZ])
	}
}

func TestHiddenRowsAreNeverDrawn(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	g := testGame(t)
	g.State = game.StateOver // no ghost, no active piece: only the board itself
	for x := 0; x < game.Width; x++ {
		g.Board.Set(x, 0, game.FilledCell(game.KindT))
		g.Board.Set(x, 1, game.FilledCell(game.KindT))
	}
	DrawBoard(gr, g, l, NewPalette(ModeFull))

	for y := l.BoardY + 1; y < l.BoardY+BoardH-1; y++ {
		for x := l.BoardX + 1; x < l.BoardX+BoardW-1; x++ {
			if r, _ := gr.At(x, y); r != ' ' {
				t.Fatalf("hidden board rows leaked %q into the visible board at (%d,%d)", r, x, y)
			}
		}
	}
}

// A piece lifted above the ceiling by a (0,-1) wall kick has blocks at negative
// y. Drawing must skip them rather than write outside the board.
func TestActivePieceAboveTheCeilingDrawsNothing(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	g := testGame(t)
	g.Active = game.Piece{Kind: game.KindI, Rotation: 1, X: 3, Y: -4}
	DrawBoard(gr, g, l, NewPalette(ModeFull))

	for y := l.BoardY; y < l.BoardY+3; y++ {
		for x := l.BoardX + 1; x < l.BoardX+BoardW-1; x++ {
			if r, _ := gr.At(x, y); r == '█' {
				t.Fatalf("a block from above the ceiling rendered at (%d,%d)", x, y)
			}
		}
	}
}

func TestGhostSitsBeneathTheActivePieceAndNotOnLockedCells(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	p := NewPalette(ModeFull)
	g := testGame(t)
	g.Active = game.Piece{Kind: game.KindO, X: 4, Y: 2}
	DrawBoard(gr, g, l, p)

	// The active O renders in bright ink at its own rows.
	for _, b := range g.Active.Blocks() {
		gx, gy, ok := CellOrigin(l, b[0], b[1])
		if !ok {
			continue
		}
		if r, ink := gr.At(gx, gy); r != '█' || ink != p.Active[game.KindO] {
			t.Errorf("active block at (%d,%d) = %q %+v, want a bright block", b[0], b[1], r, ink)
		}
	}
	// The ghost renders in dim ink at the landing position.
	ghost := g.Ghost()
	if ghost.Y <= g.Active.Y {
		t.Fatalf("ghost Y = %d, not below active Y = %d", ghost.Y, g.Active.Y)
	}
	for _, b := range ghost.Blocks() {
		gx, gy, ok := CellOrigin(l, b[0], b[1])
		if !ok {
			continue
		}
		if r, ink := gr.At(gx, gy); r != '░' || ink != p.Ghost {
			t.Errorf("ghost block at (%d,%d) = %q %+v, want a dim shade", b[0], b[1], r, ink)
		}
	}
}

// §10: ghost rendering must never obscure locked blocks. A legal ghost position
// is collision-free by construction, so this asserts the property across a lot of
// debris-filled boards rather than trying to hand-build an illegal overlap — it
// is the test that would catch a future effect drawing over settled cells.
func TestLockedCellsAlwaysSurviveGhostAndActiveDrawing(t *testing.T) {
	l := Measure(80, 30)
	p := NewPalette(ModeFull)
	rng := rand.New(rand.NewPCG(7, 11))

	for trial := 0; trial < 200; trial++ {
		g := game.New(int64(trial))
		for y := game.Height / 2; y < game.Height; y++ {
			for x := 0; x < game.Width; x++ {
				if rng.IntN(3) == 0 {
					g.Board.Set(x, y, game.FilledCell(game.PieceKind(rng.IntN(game.KindCount))))
				}
			}
		}
		if g.Board.Collides(g.Active) {
			continue
		}

		gr := NewGrid(l.W, l.H)
		DrawBoard(gr, g, l, p)

		for y := game.HiddenRows; y < game.Height; y++ {
			for x := 0; x < game.Width; x++ {
				c := g.Board.At(x, y)
				if !c.Filled() {
					continue
				}
				gx, gy, _ := CellOrigin(l, x, y)
				r, ink := gr.At(gx, gy)
				if r != '█' || ink != p.Locked[c.Kind()] {
					t.Fatalf("trial %d: locked cell (%d,%d) rendered as %q %+v", trial, x, y, r, ink)
				}
			}
		}
	}
}

func TestActivePieceOverwritesTheGhost(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	p := NewPalette(ModeFull)
	g := testGame(t)
	// A piece already at rest: ghost and active occupy the same cells.
	g.Active = game.Piece{Kind: game.KindO, X: 4, Y: game.Height - 2}
	DrawBoard(gr, g, l, p)
	for _, b := range g.Active.Blocks() {
		gx, gy, _ := CellOrigin(l, b[0], b[1])
		if r, ink := gr.At(gx, gy); r != '█' || ink != p.Active[game.KindO] {
			t.Errorf("grounded piece at (%d,%d) = %q %+v, want the active piece on top", b[0], b[1], r, ink)
		}
	}
}

func TestGameOverDrawsNoGhostOrActivePiece(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	g := testGame(t)
	g.State = game.StateOver
	g.Board.Set(0, game.Height-1, game.FilledCell(game.KindI))
	DrawBoard(gr, g, l, NewPalette(ModeFull))

	if r, _ := gr.At(CellOriginXY(l, 0, game.Height-1)); r != '█' {
		t.Error("locked cells should survive game over (§28: do not instantly replace the board)")
	}
	blocks := 0
	for y := l.BoardY + 1; y < l.BoardY+BoardH-1; y++ {
		for x := l.BoardX + 1; x < l.BoardX+BoardW-1; x++ {
			if r, _ := gr.At(x, y); r == '█' || r == '░' {
				blocks++
			}
		}
	}
	if blocks != 2 {
		t.Errorf("%d block halves drawn at game over, want 2 (the single locked cell)", blocks)
	}
}

func TestASCIIModeUsesASCIIBlocks(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	g := testGame(t)
	g.Board.Set(0, game.Height-1, game.FilledCell(game.KindI))
	DrawBoard(gr, g, l, NewPalette(ModeASCII))

	gx, gy, _ := CellOrigin(l, 0, game.Height-1)
	r0, _ := gr.At(gx, gy)
	r1, _ := gr.At(gx+1, gy)
	if r0 != '[' || r1 != ']' {
		t.Errorf("ASCII locked cell = %q%q, want []", r0, r1)
	}
	ghost := g.Ghost()
	gx, gy, _ = CellOrigin(l, ghost.Blocks()[0][0], ghost.Blocks()[0][1])
	if r, _ := gr.At(gx, gy); r != '·' {
		t.Errorf("ASCII ghost = %q, want ·", r)
	}
	if r, _ := gr.At(l.BoardX, l.BoardY); r != '+' {
		t.Errorf("ASCII board corner = %q, want +", r)
	}
}
```

`CellOriginXY` is a two-value convenience the test above uses; add it beside
`CellOrigin`:

```go
// CellOriginXY is CellOrigin without the visibility flag, for callers that have
// already checked the row is on screen.
func CellOriginXY(l Layout, x, y int) (int, int) {
	gx, gy, _ := CellOrigin(l, x, y)
	return gx, gy
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
go test ./internal/render -run 'CellOrigin|Board|Ghost|Active|GameOver|ASCII'
```

Expected: FAIL — `undefined: DrawBoard`.

- [ ] **Step 3: Write the implementation**

`internal/render/board.go`:

```go
package render

import "cosmic-tetris/internal/game"

// CellOrigin maps a logical board coordinate to the grid coordinate of the left
// half of that cell, reporting false when the cell is off the board or in one of
// the two hidden spawn rows, which are never drawn.
func CellOrigin(l Layout, x, y int) (gx, gy int, visible bool) {
	if x < 0 || x >= game.Width || y < game.HiddenRows || y >= game.Height {
		return 0, 0, false
	}
	return l.BoardX + 1 + 2*x, l.BoardY + 1 + (y - game.HiddenRows), true
}

// CellOriginXY is CellOrigin without the visibility flag, for callers that have
// already checked the row is on screen.
func CellOriginXY(l Layout, x, y int) (int, int) {
	gx, gy, _ := CellOrigin(l, x, y)
	return gx, gy
}

// drawBoardCell paints one logical board cell, skipping hidden and off-board
// coordinates. glyph must be exactly two cells wide.
func drawBoardCell(gr *Grid, l Layout, x, y int, glyph string, ink Ink) {
	gx, gy, ok := CellOrigin(l, x, y)
	if !ok {
		return
	}
	gr.SetString(gx, gy, glyph, ink)
}

// drawBox outlines a w by h rectangle with its top-left corner at (x, y). The
// board border, the outer frame, and the overlays all use it.
func drawBox(gr *Grid, x, y, w, h int, tl, tr, bl, br, hz, vt rune, ink Ink) {
	if w < 2 || h < 2 {
		return
	}
	for i := 1; i < w-1; i++ {
		gr.Set(x+i, y, hz, ink)
		gr.Set(x+i, y+h-1, hz, ink)
	}
	for j := 1; j < h-1; j++ {
		gr.Set(x, y+j, vt, ink)
		gr.Set(x+w-1, y+j, vt, ink)
	}
	gr.Set(x, y, tl, ink)
	gr.Set(x+w-1, y, tr, ink)
	gr.Set(x, y+h-1, bl, ink)
	gr.Set(x+w-1, y+h-1, br, ink)
}

// DrawBoard draws the board box and its contents: locked cells, then the ghost,
// then the active piece — steps 3 through 7 of the §37 pipeline. Later writes
// win, which is how the ghost stays under the active piece and off locked cells.
// It reads game state and never modifies it.
func DrawBoard(gr *Grid, g *game.Game, l Layout, p Palette) {
	gl := p.Glyphs
	drawBox(gr, l.BoardX, l.BoardY, BoardW, BoardH,
		gl.BoardTL, gl.BoardTR, gl.BoardBL, gl.BoardBR, gl.BoardH, gl.BoardV, p.Border)

	for y := game.HiddenRows; y < game.Height; y++ {
		for x := 0; x < game.Width; x++ {
			if c := g.Board.At(x, y); c.Filled() {
				drawBoardCell(gr, l, x, y, gl.Block, p.Locked[c.Kind()])
			}
		}
	}

	if g.State != game.StatePlaying {
		return
	}

	for _, b := range g.Ghost().Blocks() {
		x, y := b[0], b[1]
		if y < game.HiddenRows || g.Board.At(x, y).Filled() {
			continue
		}
		drawBoardCell(gr, l, x, y, gl.Ghost, p.Ghost)
	}
	for _, b := range g.Active.Blocks() {
		drawBoardCell(gr, l, b[0], b[1], gl.Block, p.Active[g.Active.Kind])
	}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
go test ./internal/render -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): board box, locked cells, ghost, and active piece"
```

---

## Task 5: HOLD, NEXT, and the stats

Step 8 of the §37 pipeline. Panels are drawn strictly inside their own columns —
`Layout` already guarantees those columns do not overlap the board, so the
"HUD doesn't corrupt board" goal of §41 reduces to "never write outside your
panel", which the tests here check exhaustively.

Piece previews always draw rotation 0, and every kind's rotation 0 occupies only
rows 0 and 1 of its 4×4 box, so a preview is exactly `PreviewH` rows tall.

**Files:**
- Create: `internal/render/hud.go`
- Test: `internal/render/hud_test.go`

**Interfaces:**
- Consumes: `Grid`, `Palette`, `Layout`; `game.Game` fields `Hold`, `CanHold`, `Next`, `Score`, `Lines`, `Level`, `Combo`; `game.Offsets`; `game.PieceKind`.
- Produces:
  - `const PreviewW = 8`, `const PreviewH = 2`, `const StatFieldW = 8`
  - `func DrawPanels(gr *Grid, g *game.Game, l Layout, p Palette)`
  - `func StatText(n, width int) string` — exported so the game-over overlay and tests share one formatter
  - `func PanelContentX(x, panelW int) int`

- [ ] **Step 1: Write the failing test**

`internal/render/hud_test.go`:

```go
package render

import (
	"strings"
	"testing"

	"cosmic-tetris/internal/game"
)

func TestStatText(t *testing.T) {
	for _, tc := range []struct {
		n, width int
		want     string
	}{
		{0, 8, "00000000"},
		{129340, 8, "00129340"},
		{42, 3, "042"},
		{7, 2, "07"},
		{99999999, 8, "99999999"},
		// Review Focus 5: nine digits and beyond must still fit the field.
		{100000000, 8, "    100M"},
		{123456789, 8, "    123M"},
		{4000000000, 8, "      4B"},
		{123, 2, "99"},
	} {
		got := StatText(tc.n, tc.width)
		if got != tc.want {
			t.Errorf("StatText(%d, %d) = %q, want %q", tc.n, tc.width, got, tc.want)
		}
		if len(got) != tc.width {
			t.Errorf("StatText(%d, %d) = %q, width %d, want width %d", tc.n, tc.width, got, len(got), tc.width)
		}
	}
}

// hudGame is a game with every HUD-visible field set to a known value.
func hudGame(t *testing.T) *game.Game {
	t.Helper()
	g := game.New(1)
	g.Board = game.Board{}
	g.Active = game.Piece{Kind: game.KindT, X: 3, Y: 2}
	g.Next = []game.PieceKind{game.KindI, game.KindJ, game.KindL, game.KindO, game.KindS}
	hold := game.KindZ
	g.Hold = &hold
	g.CanHold = true
	g.Score, g.Lines, g.Level, g.Combo = 129340, 42, 7, 3
	return g
}

// panelText returns rows [y0,y1) of the panel column starting at x, trimmed.
func panelText(gr *Grid, x, w, y0, y1 int) []string {
	var out []string
	for y := y0; y < y1; y++ {
		var b strings.Builder
		for i := 0; i < w; i++ {
			r, _ := gr.At(x+i, y)
			b.WriteRune(r)
		}
		out = append(out, strings.TrimRight(b.String(), " "))
	}
	return out
}

func TestWidePanelsCarryEveryStat(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	p := NewPalette(ModeFull)
	DrawPanels(gr, hudGame(t), l, p)

	left := panelText(gr, l.LeftX, l.PanelW, l.BoardY, l.BoardY+BoardH)
	for _, want := range []struct {
		row  int
		text string
	}{
		{1, " HOLD"},
		{7, " SCORE"},
		{8, " 00129340"},
		{10, " LINES"},
		{11, " 042"},
		{13, " LEVEL"},
		{14, " 07"},
		{16, " COMBO"},
		{17, " 03"},
	} {
		if left[want.row] != want.text {
			t.Errorf("left panel row %d = %q, want %q", want.row, left[want.row], want.text)
		}
	}

	right := panelText(gr, l.RightX, l.PanelW, l.BoardY, l.BoardY+BoardH)
	if right[1] != " NEXT" {
		t.Errorf("right panel row 1 = %q, want \" NEXT\"", right[1])
	}
	// Five previews, two rows each, one blank row between them.
	for i, row := range []int{3, 6, 9, 12, 15} {
		if strings.TrimSpace(right[row]+right[row+1]) == "" {
			t.Errorf("next preview %d (rows %d..%d) is blank", i, row, row+1)
		}
		if row+2 < len(right) && strings.TrimSpace(right[row+2]) != "" {
			t.Errorf("row %d should be the blank row after preview %d, got %q", row+2, i, right[row+2])
		}
	}
}

func TestMediumPanelIsOneColumn(t *testing.T) {
	l := Measure(44, 30)
	gr := NewGrid(l.W, l.H)
	DrawPanels(gr, hudGame(t), l, NewPalette(ModeFull))

	rows := panelText(gr, l.RightX, l.PanelW, l.BoardY, l.BoardY+BoardH)
	if rows[0] != " NEXT" {
		t.Errorf("row 0 = %q, want \" NEXT\"", rows[0])
	}
	if rows[12] != " HOLD" {
		t.Errorf("row 12 = %q, want \" HOLD\"", rows[12])
	}
	for _, want := range []struct {
		row  int
		text string
	}{{16, " SCORE"}, {17, " 00129340"}, {18, " LINES"}, {19, " 042"}, {20, " LEVEL"}, {21, " 07"}} {
		if rows[want.row] != want.text {
			t.Errorf("row %d = %q, want %q", want.row, rows[want.row], want.text)
		}
	}
}

func TestSmallPanelDropsLabelsAndTruncatesNext(t *testing.T) {
	l := Measure(40, 24)
	gr := NewGrid(l.W, l.H)
	DrawPanels(gr, hudGame(t), l, NewPalette(ModeFull))

	rows := panelText(gr, l.RightX, l.PanelW, l.BoardY, l.BoardY+BoardH)
	joined := strings.Join(rows, "\n")
	for _, label := range []string{"SCORE", "LINES", "LEVEL", "COMBO"} {
		if strings.Contains(joined, label) {
			t.Errorf("small panel still shows the %q label (§49.3 keeps values only)", label)
		}
	}
	if rows[0] != "NEXT" || rows[8] != "HOLD" {
		t.Errorf("headings = %q / %q, want NEXT / HOLD", rows[0], rows[8])
	}
	for _, want := range []struct {
		row  int
		text string
	}{{13, "00129340"}, {15, "042"}, {17, "07"}} {
		if rows[want.row] != want.text {
			t.Errorf("row %d = %q, want %q", want.row, rows[want.row], want.text)
		}
	}
	// Only three previews: rows 7 and beyond hold no fourth or fifth piece.
	if strings.TrimSpace(rows[7]) != "" {
		t.Errorf("row 7 = %q, want blank: NEXT truncates to three pieces", rows[7])
	}
}

func TestEmptyHoldDrawsNothing(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	g := hudGame(t)
	g.Hold = nil
	DrawPanels(gr, g, l, NewPalette(ModeFull))

	rows := panelText(gr, l.LeftX, l.PanelW, l.BoardY+3, l.BoardY+5)
	for i, row := range rows {
		if strings.TrimSpace(row) != "" {
			t.Errorf("hold preview row %d = %q, want blank", i, row)
		}
	}
}

func TestSpentHoldIsDimmed(t *testing.T) {
	l := Measure(80, 30)
	p := NewPalette(ModeFull)
	g := hudGame(t)
	g.CanHold = false
	gr := NewGrid(l.W, l.H)
	DrawPanels(gr, g, l, p)

	x := PanelContentX(l.LeftX, l.PanelW)
	found := false
	for y := l.BoardY + 3; y < l.BoardY+5; y++ {
		for i := 0; i < PreviewW; i++ {
			if r, ink := gr.At(x+i, y); r == '█' {
				found = true
				if ink != p.Ghost {
					t.Errorf("spent hold ink = %+v, want the dim ghost ink %+v", ink, p.Ghost)
				}
			}
		}
	}
	if !found {
		t.Error("no hold preview drawn at all")
	}
}

// Review Focus 5, and the §41 promise that the HUD cannot corrupt the board: at
// every layout, with absurd values, panels write only inside their own columns.
func TestPanelsNeverWriteOutsideTheirColumns(t *testing.T) {
	for _, size := range [][2]int{{40, 24}, {44, 30}, {80, 30}, {200, 60}} {
		l := Measure(size[0], size[1])
		g := hudGame(t)
		g.Score, g.Lines, g.Level, g.Combo = 4000000000, 99999, 999, 999
		gr := NewGrid(l.W, l.H)
		DrawPanels(gr, g, l, NewPalette(ModeFull))

		for y := 0; y < l.H; y++ {
			for x := 0; x < l.W; x++ {
				r, _ := gr.At(x, y)
				if r == ' ' {
					continue
				}
				inLeft := l.SplitPanels && x >= l.LeftX && x < l.LeftX+l.PanelW
				inRight := x >= l.RightX && x < l.RightX+l.PanelW
				inRows := y >= l.BoardY && y < l.BoardY+BoardH
				if !inRows || !(inLeft || inRight) {
					t.Fatalf("%dx%d: panel wrote %q at (%d,%d), outside its columns", l.W, l.H, r, x, y)
				}
			}
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
go test ./internal/render -run 'Stat|Panel|Hold'
```

Expected: FAIL — `undefined: DrawPanels`.

- [ ] **Step 3: Write the implementation**

`internal/render/hud.go`:

```go
package render

import (
	"strconv"
	"strings"

	"cosmic-tetris/internal/game"
)

// Piece preview and stat field geometry, in terminal cells.
const (
	// PreviewW is the width of a piece preview: four board cells at two columns each.
	PreviewW = 2 * 4
	// PreviewH is the height of a piece preview. Every kind's spawn rotation
	// occupies only the top two rows of its 4x4 box.
	PreviewH = 2
	// StatFieldW is the width of a stat value field, sized for an eight-digit score.
	StatFieldW = 8
)

// PanelContentX returns the column where a panel's content starts, centering the
// eight-cell content area inside a panel of panelW columns.
func PanelContentX(x, panelW int) int {
	return x + (panelW-StatFieldW)/2
}

// StatText renders n into exactly width characters: zero-padded when the digits
// fit, as in the 00129340 of §4, and magnitude-suffixed and right-aligned when
// they do not, so that no score can ever widen a panel into the board.
func StatText(n, width int) string {
	if width < 1 {
		return ""
	}
	if s := strconv.Itoa(n); len(s) <= width {
		return strings.Repeat("0", width-len(s)) + s
	}
	for _, u := range []struct {
		div int
		suf string
	}{{1_000_000_000, "B"}, {1_000_000, "M"}, {1_000, "K"}} {
		if n >= u.div {
			if s := strconv.Itoa(n/u.div) + u.suf; len(s) <= width {
				return strings.Repeat(" ", width-len(s)) + s
			}
		}
	}
	return strings.Repeat("9", width)
}

// comboText shows a combo only once it is worth points (§49.1: the first
// clearing placement is combo 1 and scores no bonus).
func comboText(c int) string {
	if c < 2 {
		return "--"
	}
	return StatText(c, 2)
}

// drawPreview draws one piece in its spawn rotation with its top-left at (x, y).
// A spent hold is drawn dim, which is the only signal a player gets that hold is
// unavailable until the active piece locks (§9).
func drawPreview(gr *Grid, x, y int, kind game.PieceKind, p Palette, dim bool) {
	ink := p.Locked[kind]
	if dim {
		ink = p.Ghost
	}
	for _, b := range game.Offsets[kind][0] {
		gr.SetString(x+2*b[0], y+b[1], p.Glyphs.Block, ink)
	}
}

// DrawPanels draws HOLD, NEXT, and the stats in whichever arrangement the layout
// calls for. Every write stays inside the panel columns Measure reserved.
func DrawPanels(gr *Grid, g *game.Game, l Layout, p Palette) {
	switch l.Kind {
	case KindWide:
		drawWidePanels(gr, g, l, p)
	case KindMedium:
		drawMediumPanel(gr, g, l, p)
	case KindSmall:
		drawSmallPanel(gr, g, l, p)
	}
}

func drawHold(gr *Grid, x, y int, g *game.Game, p Palette) {
	if g.Hold == nil {
		return
	}
	drawPreview(gr, x, y, *g.Hold, p, !g.CanHold)
}

func drawNext(gr *Grid, x, y, stride int, g *game.Game, l Layout, p Palette) {
	for i := 0; i < l.NextCount && i < len(g.Next); i++ {
		drawPreview(gr, x, y+i*stride, g.Next[i], p, false)
	}
}

// drawWidePanels: HOLD and the stats on the left, NEXT on the right (§31).
func drawWidePanels(gr *Grid, g *game.Game, l Layout, p Palette) {
	lx, rx, top := PanelContentX(l.LeftX, l.PanelW), PanelContentX(l.RightX, l.PanelW), l.BoardY

	gr.SetString(lx, top+1, "HOLD", p.Label)
	drawHold(gr, lx, top+3, g, p)
	gr.SetString(lx, top+7, "SCORE", p.Label)
	gr.SetString(lx, top+8, StatText(g.Score, StatFieldW), p.Value)
	gr.SetString(lx, top+10, "LINES", p.Label)
	gr.SetString(lx, top+11, StatText(g.Lines, 3), p.Value)
	gr.SetString(lx, top+13, "LEVEL", p.Label)
	gr.SetString(lx, top+14, StatText(g.Level, 2), p.Value)
	gr.SetString(lx, top+16, "COMBO", p.Label)
	gr.SetString(lx, top+17, comboText(g.Combo), p.Value)

	gr.SetString(rx, top+1, "NEXT", p.Label)
	drawNext(gr, rx, top+3, PreviewH+1, g, l, p)
}

// drawMediumPanel: one compact column holding NEXT, HOLD, and three stats.
// The previews sit on consecutive two-row slots — there is no room for gaps
// between them once HOLD and the stats have their rows.
func drawMediumPanel(gr *Grid, g *game.Game, l Layout, p Palette) {
	x, top := PanelContentX(l.RightX, l.PanelW), l.BoardY

	gr.SetString(x, top, "NEXT", p.Label)
	drawNext(gr, x, top+1, PreviewH, g, l, p)
	gr.SetString(x, top+12, "HOLD", p.Label)
	drawHold(gr, x, top+13, g, p)
	gr.SetString(x, top+16, "SCORE", p.Label)
	gr.SetString(x, top+17, StatText(g.Score, StatFieldW), p.Value)
	gr.SetString(x, top+18, "LINES", p.Label)
	gr.SetString(x, top+19, StatText(g.Lines, 3), p.Value)
	gr.SetString(x, top+20, "LEVEL", p.Label)
	gr.SetString(x, top+21, StatText(g.Level, 2), p.Value)
}

// drawSmallPanel: three NEXT pieces, HOLD, and bare stat values (§49.3).
func drawSmallPanel(gr *Grid, g *game.Game, l Layout, p Palette) {
	x, top := PanelContentX(l.RightX, l.PanelW), l.BoardY

	gr.SetString(x, top, "NEXT", p.Label)
	drawNext(gr, x, top+1, PreviewH, g, l, p)
	gr.SetString(x, top+8, "HOLD", p.Label)
	drawHold(gr, x, top+9, g, p)
	gr.SetString(x, top+13, StatText(g.Score, StatFieldW), p.Value)
	gr.SetString(x, top+15, StatText(g.Lines, 3), p.Value)
	gr.SetString(x, top+17, StatText(g.Level, 2), p.Value)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
go test ./internal/render -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/render/hud.go internal/render/hud_test.go
git commit -m "feat(render): HOLD, NEXT, and stat panels for all three layouts"
```

---

## Task 6: Frame, mission control, controls, and the too-small notice

The chrome around the board: steps 11 and 12 of §37, the titled frame of §4, and
the below-minimum notice of §31. The controls line has to shrink with the
layout — the mockup's 61-character hint does not fit a 40-column terminal — so
each layout gets its own string, and a test pins each one inside its content
width.

**Files:**
- Create: `internal/render/chrome.go`
- Test: `internal/render/chrome_test.go`

**Interfaces:**
- Consumes: `Grid`, `Ink`, `Palette`, `Layout`, `drawBox`.
- Produces:
  - `const DefaultMission = "NOMINALISH"`
  - `func UniverseID(seed int64) string`
  - `func ControlsText(l Layout, p Palette) string`
  - `func DrawFrame(gr *Grid, l Layout, p Palette, seed int64)`
  - `func DrawMission(gr *Grid, l Layout, p Palette, msg string)`
  - `func DrawControls(gr *Grid, l Layout, p Palette)`
  - `func DrawTooSmall(gr *Grid, w, h int, p Palette)`
  - `func Cells(s string) int`, `func Truncate(s string, n int) string`, `func DrawCentered(gr *Grid, x, y, w int, s string, ink Ink)` — shared text helpers, also used by the overlays in Task 8

- [ ] **Step 1: Write the failing test**

`internal/render/chrome_test.go`:

```go
package render

import (
	"strings"
	"testing"
)

func TestUniverseIDIsFourHexDigitsOfTheSeed(t *testing.T) {
	for _, tc := range []struct {
		seed int64
		want string
	}{{0, "0000"}, {0x7F3A, "7F3A"}, {1234, "04D2"}, {-1, "FFFF"}, {0x1234ABCD, "ABCD"}} {
		if got := UniverseID(tc.seed); got != tc.want {
			t.Errorf("UniverseID(%d) = %q, want %q", tc.seed, got, tc.want)
		}
	}
}

// rowText reads a whole grid row as a string, trailing blanks trimmed.
func rowText(gr *Grid, y int) string {
	var b strings.Builder
	for x := 0; x < gr.W; x++ {
		r, _ := gr.At(x, y)
		b.WriteRune(r)
	}
	return strings.TrimRight(b.String(), " ")
}

func TestFrameTitleRow(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	p := NewPalette(ModeFull)
	DrawFrame(gr, l, p, 0x7F3A)

	title := rowText(gr, l.FrameY)
	if !strings.HasPrefix(strings.TrimLeft(title, " "), "╭─ ✦ COSMIC TETRIS ─") {
		t.Errorf("title row = %q, want it to open with the framed title", title)
	}
	if !strings.Contains(title, "LOCAL UNIVERSE 7F3A") {
		t.Errorf("title row = %q, want the universe label", title)
	}
	if !strings.HasSuffix(title, "╮") {
		t.Errorf("title row = %q, want it to close with a corner", title)
	}
	if got := Cells(strings.TrimLeft(title, " ")); got != l.FrameW {
		t.Errorf("title row spans %d cells, want FrameW = %d", got, l.FrameW)
	}
}

func TestFrameSidesAndBottom(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	DrawFrame(gr, l, NewPalette(ModeFull), 1)

	for y := l.FrameY + 1; y < l.FrameY+l.FrameH-1; y++ {
		if r, _ := gr.At(l.FrameX, y); r != '│' {
			t.Errorf("left border at row %d = %q, want │", y, r)
		}
		if r, _ := gr.At(l.FrameX+l.FrameW-1, y); r != '│' {
			t.Errorf("right border at row %d = %q, want │", y, r)
		}
	}
	bottom := rowText(gr, l.FrameY+l.FrameH-1)
	if !strings.HasPrefix(strings.TrimLeft(bottom, " "), "╰─") || !strings.HasSuffix(bottom, "╯") {
		t.Errorf("bottom row = %q, want a closed frame", bottom)
	}
}

func TestNarrowFrameDropsTheUniverseLabel(t *testing.T) {
	l := Measure(40, 26) // small layout: a 37-column frame
	gr := NewGrid(l.W, l.H)
	DrawFrame(gr, l, NewPalette(ModeFull), 0x7F3A)

	title := rowText(gr, l.FrameY)
	if !strings.Contains(title, "COSMIC TETRIS") {
		t.Errorf("title row = %q, want the title even in a narrow frame", title)
	}
	if strings.Contains(title, "LOCAL UNIVERSE") {
		t.Errorf("title row = %q, want the universe label dropped when it does not fit", title)
	}
}

func TestFrameIsNotDrawnWhenAbsent(t *testing.T) {
	l := Measure(40, 24)
	gr := NewGrid(l.W, l.H)
	DrawFrame(gr, l, NewPalette(ModeFull), 1)
	if got := gr.Plain(); strings.TrimSpace(got) != "" {
		t.Errorf("DrawFrame drew something with Frame off:\n%s", got)
	}
}

func TestMissionLine(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	p := NewPalette(ModeFull)
	DrawMission(gr, l, p, "GRAVITY TAX INCREASED")

	got := strings.TrimLeft(rowText(gr, l.MissionY), " ")
	if got != "☄ MISSION CONTROL: GRAVITY TAX INCREASED" {
		t.Errorf("mission row = %q", got)
	}
	if r, ink := gr.At(l.ContentX, l.MissionY); r != '☄' || ink != p.Star {
		t.Errorf("comet = %q %+v, want the star ink", r, ink)
	}
}

func TestMissionLineDefaultsAndTruncates(t *testing.T) {
	l := Measure(40, 24)
	gr := NewGrid(l.W, l.H)
	DrawMission(gr, l, NewPalette(ModeFull), "")
	if got := rowText(gr, l.MissionY); !strings.Contains(got, DefaultMission) {
		t.Errorf("mission row = %q, want the default message", got)
	}

	gr = NewGrid(l.W, l.H)
	DrawMission(gr, l, NewPalette(ModeFull), strings.Repeat("LONG ", 40))
	row := strings.TrimLeft(rowText(gr, l.MissionY), " ")
	if Cells(row) > l.ContentW {
		t.Errorf("mission row spans %d cells, want at most ContentW = %d", Cells(row), l.ContentW)
	}
}

func TestMissionLineInASCIIMode(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	DrawMission(gr, l, NewPalette(ModeASCII), "MOON NOTIFIED")
	if got := strings.TrimLeft(rowText(gr, l.MissionY), " "); got != "> MISSION CONTROL: MOON NOTIFIED" {
		t.Errorf("ASCII mission row = %q", got)
	}
}

func TestControlsTextFitsEveryLayout(t *testing.T) {
	for _, size := range [][2]int{{40, 24}, {44, 30}, {80, 30}, {200, 60}} {
		l := Measure(size[0], size[1])
		for _, mode := range []Mode{ModeFull, ModeASCII} {
			p := NewPalette(mode)
			text := ControlsText(l, p)
			if n := Cells(text); n > l.ContentW {
				t.Errorf("%s %s controls %q span %d cells, want at most %d", l.Kind, mode, text, n, l.ContentW)
			}
			for _, must := range []string{"SPACE", "?"} {
				if !strings.Contains(text, must) {
					t.Errorf("%s %s controls %q omit %q", l.Kind, mode, text, must)
				}
			}
		}
	}
}

func TestControlsRowIsCenteredAndModeAware(t *testing.T) {
	l := Measure(80, 30)
	gr := NewGrid(l.W, l.H)
	DrawControls(gr, l, NewPalette(ModeFull))
	row := rowText(gr, l.ControlsY)
	if !strings.Contains(row, "←→") || !strings.Contains(row, "SPACE yeet") {
		t.Errorf("controls row = %q", row)
	}
	lead := len(row) - len(strings.TrimLeft(row, " "))
	if lead <= l.ContentX {
		t.Errorf("controls row starts at %d, want it centered inside the content block at %d", lead, l.ContentX)
	}

	gr = NewGrid(l.W, l.H)
	DrawControls(gr, l, NewPalette(ModeASCII))
	row = rowText(gr, l.ControlsY)
	if strings.ContainsAny(row, "←→↑↓") {
		t.Errorf("ASCII controls row = %q, want no Unicode arrows", row)
	}
	if !strings.Contains(row, "<>") {
		t.Errorf("ASCII controls row = %q, want the ASCII arrows", row)
	}
}

func TestTooSmallNotice(t *testing.T) {
	gr := NewGrid(34, 19)
	DrawTooSmall(gr, 34, 19, NewPalette(ModeFull))
	out := gr.Plain()
	for _, want := range []string{"THIS UNIVERSE IS TOO SMALL", "resize terminal to continue", "34 × 19", "40 × 24"} {
		if !strings.Contains(out, want) {
			t.Errorf("notice is missing %q:\n%s", want, out)
		}
	}
}

func TestTooSmallNoticeInASCIIMode(t *testing.T) {
	gr := NewGrid(34, 19)
	DrawTooSmall(gr, 34, 19, NewPalette(ModeASCII))
	out := gr.Plain()
	if strings.Contains(out, "×") {
		t.Errorf("ASCII notice contains a Unicode multiplication sign:\n%s", out)
	}
	if !strings.Contains(out, "34 x 19") {
		t.Errorf("ASCII notice is missing the current size:\n%s", out)
	}
}

// Review Focus 1: the notice itself must survive a terminal with no room at all.
func TestTooSmallNoticeAtDegenerateSizes(t *testing.T) {
	for _, size := range [][2]int{{0, 0}, {1, 1}, {2, 8}, {80, 1}} {
		gr := NewGrid(size[0], size[1])
		DrawTooSmall(gr, size[0], size[1], NewPalette(ModeFull))
		lines := strings.Split(gr.Plain(), "\n")
		if size[1] > 0 && len(lines) != size[1] {
			t.Errorf("%dx%d: notice produced %d lines, want %d", size[0], size[1], len(lines), size[1])
		}
		for _, line := range lines {
			if Cells(line) > size[0] {
				t.Errorf("%dx%d: notice line %q is wider than the terminal", size[0], size[1], line)
			}
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
go test ./internal/render -run 'Universe|Frame|Mission|Controls|TooSmall'
```

Expected: FAIL — `undefined: UniverseID`.

- [ ] **Step 3: Write the implementation**

`internal/render/chrome.go`:

```go
package render

import (
	"fmt"
	"unicode/utf8"
)

// DefaultMission is the mission-control message shown when nothing else has
// anything to say. Plan 3 replaces the source of these strings; the row itself
// exists from here on so the layout never shifts underneath it.
const DefaultMission = "NOMINALISH"

// Cells is how many terminal cells a string occupies in a Grid: one per rune,
// which every glyph in this package is required to be.
func Cells(s string) int { return utf8.RuneCountInString(s) }

// Truncate cuts s to at most n cells.
func Truncate(s string, n int) string {
	if n <= 0 {
		return ""
	}
	if Cells(s) <= n {
		return s
	}
	return string([]rune(s)[:n])
}

// DrawCentered writes s centered in the span [x, x+w), truncated to fit.
func DrawCentered(gr *Grid, x, y, w int, s string, ink Ink) {
	s = Truncate(s, w)
	gr.SetString(x+(w-Cells(s))/2, y, s, ink)
}

// UniverseID is the four hex digits the title bar labels this universe with,
// taken from the seed so that the same universe always has the same name (§4).
func UniverseID(seed int64) string {
	return fmt.Sprintf("%04X", uint16(seed))
}

// DrawFrame draws the outer titled frame, including the universe label when
// there is room for it. It draws nothing when the layout has no frame.
func DrawFrame(gr *Grid, l Layout, p Palette, seed int64) {
	if !l.Frame {
		return
	}
	gl := p.Glyphs
	drawBox(gr, l.FrameX, l.FrameY, l.FrameW, l.FrameH,
		gl.FrameTL, gl.FrameTR, gl.FrameBL, gl.FrameBR, gl.FrameH, gl.FrameV, p.Border)

	y := l.FrameY
	x := gr.SetString(l.FrameX+2, y, " ", p.Border)
	gr.Set(x, y, gl.Star, p.Star)
	x = gr.SetString(x+1, y, " ", p.Border)
	x = gr.SetString(x, y, "COSMIC TETRIS", p.Title)
	titleEnd := gr.SetString(x, y, " ", p.Border)

	label := "LOCAL UNIVERSE " + UniverseID(seed)
	lx := l.FrameX + l.FrameW - 4 - (Cells(label) + 2)
	if lx >= titleEnd+2 {
		lx = gr.SetString(lx, y, " ", p.Border)
		lx = gr.SetString(lx, y, label, p.Title)
		gr.SetString(lx, y, " ", p.Border)
	}
}

// DrawMission draws the one-line status channel (§27), left-aligned on the
// content block and truncated to it.
func DrawMission(gr *Grid, l Layout, p Palette, msg string) {
	if !l.Mission || l.MissionY < 0 {
		return
	}
	if msg == "" {
		msg = DefaultMission
	}
	gr.Set(l.ContentX, l.MissionY, p.Glyphs.Comet, p.Star)
	gr.SetString(l.ContentX+2, l.MissionY, Truncate("MISSION CONTROL: "+msg, l.ContentW-2), p.Mission)
}

// ControlsText is the key hint for a layout, sized to that layout's content
// width. The 61-character line in the §4 mockup does not fit a 40-column
// terminal, so each layout gets as much of it as it can hold.
func ControlsText(l Layout, p Palette) string {
	gl := p.Glyphs
	move := gl.ArrowLeftRight + " " + gl.ArrowUp + " " + gl.ArrowDown
	switch l.Kind {
	case KindWide:
		return move + "  SPACE yeet  c hold  p pause  ? help"
	case KindMedium:
		return move + "  SPACE  c hold  ? help"
	default:
		return move + "  SPACE  c  ?"
	}
}

// DrawControls draws the key hints, centered on the content block.
func DrawControls(gr *Grid, l Layout, p Palette) {
	if l.ControlsY < 0 {
		return
	}
	DrawCentered(gr, l.ContentX, l.ControlsY, l.ContentW, ControlsText(l, p), p.Controls)
}

// DrawTooSmall draws the below-minimum notice of §31, centered in whatever space
// exists. It is the one thing drawn when Measure reports KindTooSmall, and it
// must survive a terminal that reports no usable size at all.
func DrawTooSmall(gr *Grid, w, h int, p Palette) {
	times := string(p.Glyphs.Times)
	lines := []string{
		"THIS UNIVERSE IS TOO SMALL",
		"",
		"resize terminal to continue",
		"",
		fmt.Sprintf("current: %d %s %d", w, times, h),
		fmt.Sprintf("needed: approximately %d %s %d", MinWidth, times, MinHeight),
	}
	y := (h - len(lines)) / 2
	if y < 0 {
		y = 0
	}
	for i, line := range lines {
		DrawCentered(gr, 0, y+i, w, line, p.Overlay)
	}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
go test ./internal/render -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/render/chrome.go internal/render/chrome_test.go internal/render/palette.go
git commit -m "feat(render): titled frame, mission line, controls, too-small notice"
```

<!-- PLAN2-END -->
