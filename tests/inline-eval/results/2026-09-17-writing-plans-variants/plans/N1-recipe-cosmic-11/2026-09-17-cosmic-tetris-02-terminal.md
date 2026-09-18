# Cosmic Tetris — Plan 02: Playable Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Plan 01 engine into a genuinely good, fully playable terminal game — Bubble Tea event loop, keyboard, board/HUD/ghost/next/hold rendering, adaptive layout, pause, restart, help, and the CLI — with golden layout tests.

**Architecture:** Every frame is composited into a character grid (`render.Canvas`) and emitted as one string, so later plans can draw stars behind the board and particles over it without touching this code. `internal/render` owns all drawing and is handed an immutable `Frame` describing what to draw; it imports `internal/game` but never the app. `internal/app` owns the Bubble Tea `Model`, the single 60 Hz frame clock, and key handling; it converts elapsed wall time into the engine's `Advance(dt)`.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2` (key + help only).

**Spec:** `design.md` — Phase 2 of §42. Sections most relevant: §4, §5, §8, §9, §10, §26, §30, §31, §32, §33, §34, §36, §37, §39, §41, §46, §49.3, §49.4, §49.7.

**Prerequisite:** Plan 01 complete; `make test` green.

## Global Constraints

- Dependencies are exactly `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`. Bubbles is used **only** for key bindings, help, and (Plan 05) the boot spinner. Do not abstract Bubble Tea away behind a homegrown framework (§3).
- One logical block occupies `2 terminal columns × 1 terminal row`.
- Glyphs (§49.4): pieces `██` (ASCII `[]`); ghost `░░` in full/reduced, `··` in ASCII. Pieces use a bright foreground on filled glyphs — **not** the foreground+background pairing §26 offers as an alternative. The active piece renders one step brighter than locked cells.
- Ghost rendering must never obscure locked blocks (§10).
- The render pass must not mutate game state (§37). `render` takes values and read-only pointers and returns a string.
- Rendering order per frame is §37's twelve steps; steps 2/6/9/10 (FX and banners) are stubs in this plan and filled in by Plans 03–05.
- Minimum usable terminal: `~40 columns × ~24 rows`. Below that, show §31's too-small notice. Handle resize live; never crash from a resize.
- Small-terminal drop order (§49.3): title border first, then mission control, then stats labels. NEXT never stacks above or below the board; at small sizes it sits beside the board and truncates to 3 upcoming pieces. Board and controls are the last two elements standing.
- Visual updates target `60 Hz`. One animation clock; gravity is elapsed-time based; input must not wait for ticks.
- CLI surface, exactly (§49.5): `cosmic-tetris`, `--seed 1234`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help`. Nothing else.
- Controls (§8): `← / h` left, `→ / l` right, `↓ / j` soft drop, `↑ / k / x` clockwise, `z` counter-clockwise, `space` hard drop, `c` hold, `p` pause, `r` restart, `?` help, `q / esc` quit. WASD aliases `a d s w`.
- No filesystem access during gameplay; no goroutine per frame; no synchronous logging (§38).
- §49.7: the §4 mockup communicates mood and element placement, not geometry. The ANSI-stripped golden tests are the binding layout contract.

## Review Focus

1. **The first frame, before any `WindowSizeMsg`** — width and height are `0`. `View()` must return something harmless rather than panic or index a zero-size canvas. → Task 4 (layout) and Task 8 (model).
2. **A keypress that arrives before the first frame tick** — `LastFrame` is the zero `time.Time`, so a naive `Now.Sub(LastFrame)` is decades. The dt clamp must survive it. → Task 8.
3. **A terminal below the minimum, and the notice itself not fitting** — at 34×19 the §31 notice must render inside 34 columns, and the app must recover live when the terminal grows. → Task 6.
4. **Odd/large terminal widths** — a 22-column board centered in an odd-width terminal, and a 300×100 terminal: no line may exceed the terminal width and nothing may overlap. → Task 2 (canvas clipping) and Task 6 (frame invariants).
5. **`--ascii` output containing a non-ASCII byte anywhere** — one stray `║` in an overlay defeats the whole mode on a terminal that cannot draw it. → Task 6, asserted across every overlay.

---

### Task 1: Dependencies, CLI parsing, and the config type

**Files:**
- Modify: `go.mod`
- Create: `internal/app/config.go`
- Test: `internal/app/config_test.go`

**Interfaces:**
- Consumes: nothing from Plan 01 except the module.
- Produces:
  - ```go
    type Config struct {
        Seed          int64
        ASCII         bool
        NoFX          bool
        ReducedMotion bool
    }
    ```
  - `func ParseArgs(args []string) (Config, string, error)` — `args` excludes the program name. Returns the config, a non-empty usage string when `--help` was requested (caller prints it and exits 0), and an error for anything unrecognized. `--seed` defaults to `0`, which the caller replaces with a clock-derived seed; a seed given explicitly is used verbatim.
  - `func (c Config) SeedOrRandom(now time.Time) int64` — returns `c.Seed` when non-zero, else `now.UnixNano()`. This is where the clock enters the program; the engine still never reads one.

- [ ] **Step 1: Add the dependencies**

```bash
go get charm.land/bubbletea/v2@latest charm.land/lipgloss/v2@latest charm.land/bubbles/v2@latest
go mod tidy
```

If the `charm.land` vanity paths do not resolve, use `github.com/charmbracelet/bubbletea/v2`, `github.com/charmbracelet/lipgloss/v2`, `github.com/charmbracelet/bubbles/v2` instead, and note the substitution in a `## Dependencies` line in `README.md` (created in Plan 05). Do not proceed with v1 of any of the three.

- [ ] **Step 2: Record the real v2 APIs you will code against**

```bash
go doc charm.land/bubbletea/v2 Model
go doc charm.land/bubbletea/v2 KeyPressMsg
go doc charm.land/bubbletea/v2 WindowSizeMsg
go doc charm.land/bubbletea/v2 Tick
go doc charm.land/lipgloss/v2 Style
go doc charm.land/lipgloss/v2 Color
```

Expected: `Model` shows v2's signatures (`Init`, `Update`, `View`). Write the exact three method signatures into a comment at the top of `internal/app/model.go` when you create it in Task 8, and code to those, not to remembered v1 shapes.

- [ ] **Step 3: Write the failing test**

`internal/app/config_test.go`:

```go
package app

import (
	"strings"
	"testing"
	"time"
)

func TestParseArgsDefaults(t *testing.T) {
	cfg, usage, err := ParseArgs(nil)
	if err != nil || usage != "" {
		t.Fatalf("err=%v usage=%q", err, usage)
	}
	if cfg != (Config{}) {
		t.Errorf("defaults should be the zero config, got %+v", cfg)
	}
}

func TestParseArgsEveryFlag(t *testing.T) {
	cfg, _, err := ParseArgs([]string{"--seed", "1234", "--ascii", "--no-fx", "--reduced-motion"})
	if err != nil {
		t.Fatal(err)
	}
	want := Config{Seed: 1234, ASCII: true, NoFX: true, ReducedMotion: true}
	if cfg != want {
		t.Errorf("got %+v want %+v", cfg, want)
	}
}

func TestParseArgsHelpReturnsUsage(t *testing.T) {
	_, usage, err := ParseArgs([]string{"--help"})
	if err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{"--seed", "--ascii", "--no-fx", "--reduced-motion", "cosmic-tetris"} {
		if !strings.Contains(usage, want) {
			t.Errorf("usage missing %q:\n%s", want, usage)
		}
	}
}

func TestParseArgsRejectsUnknownFlags(t *testing.T) {
	if _, _, err := ParseArgs([]string{"--turbo"}); err == nil {
		t.Fatal("unknown flag accepted")
	}
	if _, _, err := ParseArgs([]string{"--seed", "banana"}); err == nil {
		t.Fatal("non-numeric seed accepted")
	}
}

func TestSeedOrRandom(t *testing.T) {
	now := time.Unix(0, 4242)
	if got := (Config{Seed: 7}).SeedOrRandom(now); got != 7 {
		t.Errorf("explicit seed: got %d want 7", got)
	}
	if got := (Config{}).SeedOrRandom(now); got != 4242 {
		t.Errorf("random seed: got %d want the clock value 4242", got)
	}
}
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `go test ./internal/app/ -v`
Expected: FAIL — `undefined: ParseArgs`.

- [ ] **Step 5: Implement `config.go`**

Use `flag.NewFlagSet("cosmic-tetris", flag.ContinueOnError)` with its output redirected to a `bytes.Buffer` so `ParseArgs` returns usage instead of printing it.

- [ ] **Step 6: Run the test to verify it passes**

Run: `go test ./internal/app/ -v`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add go.mod go.sum internal/app/config.go internal/app/config_test.go
git commit -m "feat(app): charm v2 dependencies and CLI parsing"
```

---

### Task 2: The character canvas

**Files:**
- Create: `internal/render/canvas.go`
- Test: `internal/render/canvas_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - ```go
    type Paint struct {
        FG    string // "" = terminal default; hex "#22f0ff" or an ANSI index "51"
        Bold  bool
        Faint bool
    }
    type Canvas struct { W, H int /* unexported cell storage */ }
    ```
  - `func NewCanvas(w, h int) *Canvas` — `w` or `h` ≤ 0 yields a canvas with those dims and no cells; all writes are no-ops.
  - `func (c *Canvas) Fill(r rune, p Paint)`, `func (c *Canvas) Clear()`.
  - `func (c *Canvas) Set(x, y int, r rune, p Paint)` — silently ignores out-of-bounds coordinates.
  - `func (c *Canvas) SetString(x, y int, s string, p Paint)` — writes left to right by rune, clipping at the right edge; returns nothing.
  - `func (c *Canvas) Rune(x, y int) rune`, `func (c *Canvas) PaintAt(x, y int) Paint` — `' '` / zero `Paint` out of bounds; used by tests and by the FX readability guard in Plan 04.
  - `func (c *Canvas) Blit(src *Canvas, x, y int)` — copies `src` at the offset, clipping; used by screen shake in Plan 04.
  - `func (c *Canvas) String() string` — `H` lines joined by `\n`, each exactly `W` display columns before styling, with adjacent equal-`Paint` runs coalesced into one styled segment.

- [ ] **Step 1: Write the failing test**

`internal/render/canvas_test.go`:

```go
package render

import (
	"regexp"
	"strings"
	"testing"
)

var ansi = regexp.MustCompile("\x1b\\[[0-9;?]*[a-zA-Z]")

func plain(s string) string { return ansi.ReplaceAllString(s, "") }

func TestNewCanvasStartsBlank(t *testing.T) {
	c := NewCanvas(4, 2)
	got := plain(c.String())
	if got != "    \n    " {
		t.Fatalf("got %q", got)
	}
}

func TestSetAndRuneRoundTrip(t *testing.T) {
	c := NewCanvas(3, 3)
	p := Paint{FG: "#ff00ff", Bold: true}
	c.Set(1, 1, '✦', p)
	if c.Rune(1, 1) != '✦' {
		t.Errorf("rune = %q", c.Rune(1, 1))
	}
	if c.PaintAt(1, 1) != p {
		t.Errorf("paint = %+v", c.PaintAt(1, 1))
	}
}

func TestWritesOutsideTheCanvasAreIgnored(t *testing.T) {
	c := NewCanvas(3, 2)
	for _, pt := range [][2]int{{-1, 0}, {0, -1}, {3, 0}, {0, 2}, {99, 99}, {-99, -99}} {
		c.Set(pt[0], pt[1], 'X', Paint{}) // must not panic
	}
	if strings.Contains(plain(c.String()), "X") {
		t.Fatal("an out-of-bounds write landed on the canvas")
	}
}

func TestZeroSizeCanvasIsSafe(t *testing.T) {
	for _, dims := range [][2]int{{0, 0}, {0, 10}, {10, 0}, {-5, -5}} {
		c := NewCanvas(dims[0], dims[1])
		c.Set(0, 0, 'X', Paint{})
		c.SetString(0, 0, "hello", Paint{})
		c.Fill('#', Paint{})
		_ = c.String() // must not panic
	}
}

func TestSetStringClipsAtTheRightEdge(t *testing.T) {
	c := NewCanvas(5, 1)
	c.SetString(3, 0, "ABCDEF", Paint{})
	if got := plain(c.String()); got != "   AB" {
		t.Fatalf("got %q want %q", got, "   AB")
	}
}

func TestEveryLineIsExactlyWColumnsWide(t *testing.T) {
	c := NewCanvas(8, 3)
	c.SetString(0, 1, "hi", Paint{})
	for i, line := range strings.Split(plain(c.String()), "\n") {
		if n := len([]rune(line)); n != 8 {
			t.Errorf("line %d has %d columns want 8: %q", i, n, line)
		}
	}
}

func TestBlitClipsBothWays(t *testing.T) {
	src := NewCanvas(2, 2)
	src.Fill('#', Paint{})
	dst := NewCanvas(4, 4)
	dst.Blit(src, 3, 3)  // only one cell lands
	dst.Blit(src, -1, -1) // only one cell lands
	got := plain(dst.String())
	if strings.Count(got, "#") != 2 {
		t.Fatalf("expected 2 surviving cells, got %q", got)
	}
}

func TestEqualPaintRunsAreCoalesced(t *testing.T) {
	c := NewCanvas(10, 1)
	c.SetString(0, 0, "##########", Paint{FG: "#22f0ff"})
	out := c.String()
	if n := strings.Count(out, "\x1b["); n > 4 {
		t.Errorf("ten identically painted cells produced %d escape sequences; runs are not coalesced", n)
	}
	if plain(out) != "##########" {
		t.Errorf("content changed: %q", plain(out))
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/render/ -v`
Expected: FAIL — `undefined: NewCanvas`.

- [ ] **Step 3: Implement `canvas.go`**

Store cells as two flat slices (`[]rune`, `[]Paint`) of length `W*H`. In `String()`, walk each row accumulating runes while `Paint` is unchanged, then emit the accumulated segment through a `Paint`→`lipgloss.Style` conversion memoized in a `map[Paint]lipgloss.Style` on the canvas. An empty `Paint` emits the raw segment with no styling at all.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/canvas.go internal/render/canvas_test.go
git commit -m "feat(render): clipping character canvas with paint-run coalescing"
```

---

### Task 3: Rendering modes, glyph sets, and the neon palette

**Files:**
- Create: `internal/render/palette.go`
- Test: `internal/render/palette_test.go`

**Interfaces:**
- Consumes: `game.PieceKind`, `Paint`.
- Produces:
  - `type Mode int` with `ModeFull, ModeReduced, ModeASCII`; `func (m Mode) String() string`.
  - `func DetectMode(env func(string) string, forceASCII bool) Mode` — `forceASCII` wins; else `COLORTERM` in `{"truecolor","24bit"}` → `ModeFull`; else `TERM` containing `"256color"` → `ModeReduced`; else `TERM` empty or `"dumb"` → `ModeASCII`; else `ModeReduced`. Taking `env` as a parameter keeps this testable.
  - ```go
    type Glyphs struct {
        Block, Ghost, Empty            string // two columns each
        BorderH, BorderV               string
        BorderTL, BorderTR, BorderBL, BorderBR string
        Bullet                         string // mission-control prefix: "☄" / ">"
    }
    func GlyphsFor(m Mode) Glyphs
    ```
    Full/reduced: `██`, `░░`, `  `, `═`, `║`, `╔╗╚╝`, `☄`. ASCII: `[]`, `..`, `  `, `-`, `|`, `+` for all four corners, prefix `>`. (§49.4 writes the ASCII ghost as `··`, which is U+00B7 and not ASCII; Step 3 resolves that.)
  - `func PieceColorFor(k game.PieceKind, m Mode) string` — the palette below.
  - `func LockedPaint(k game.PieceKind, m Mode) Paint` → color, not bold.
  - `func ActivePaint(k game.PieceKind, m Mode) Paint` → same color, `Bold: true` (§49.4 "one step brighter").
  - `func GhostPaint(k game.PieceKind, m Mode) Paint` → same color, `Faint: true`.
  - `func ChromePaint(m Mode) Paint`, `func LabelPaint(m Mode) Paint`, `func ValuePaint(m Mode) Paint`.

Pinned palette (§26 intent, made concrete):

| Kind | Intent | Full (hex) | Reduced (ANSI 256) | ASCII (ANSI 8) |
|---|---|---|---|---|
| I | plasma cyan | `#22f0ff` | `51` | `6` |
| J | deep electric blue | `#2b6bff` | `27` | `4` |
| L | solar orange | `#ff8a1f` | `208` | `3` |
| O | stellar gold | `#ffd23f` | `220` | `3` |
| S | alien green | `#3dff85` | `48` | `2` |
| T | ultraviolet | `#a45cff` | `141` | `5` |
| Z | supernova pink | `#ff2e6e` | `198` | `1` |

- [ ] **Step 1: Write the failing test**

`internal/render/palette_test.go`:

```go
package render

import (
	"testing"
	"unicode"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func env(m map[string]string) func(string) string {
	return func(k string) string { return m[k] }
}

func TestDetectMode(t *testing.T) {
	cases := []struct {
		name  string
		vars  map[string]string
		force bool
		want  Mode
	}{
		{"forced ascii beats truecolor", map[string]string{"COLORTERM": "truecolor"}, true, ModeASCII},
		{"truecolor", map[string]string{"COLORTERM": "truecolor", "TERM": "xterm-256color"}, false, ModeFull},
		{"24bit", map[string]string{"COLORTERM": "24bit"}, false, ModeFull},
		{"256color", map[string]string{"TERM": "screen-256color"}, false, ModeReduced},
		{"dumb", map[string]string{"TERM": "dumb"}, false, ModeASCII},
		{"empty env", map[string]string{}, false, ModeASCII},
		{"plain xterm", map[string]string{"TERM": "xterm"}, false, ModeReduced},
	}
	for _, c := range cases {
		if got := DetectMode(env(c.vars), c.force); got != c.want {
			t.Errorf("%s: got %v want %v", c.name, got, c.want)
		}
	}
}

func TestGlyphWidths(t *testing.T) {
	for _, m := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		g := GlyphsFor(m)
		for name, s := range map[string]string{"Block": g.Block, "Ghost": g.Ghost, "Empty": g.Empty} {
			if n := len([]rune(s)); n != 2 {
				t.Errorf("%v %s = %q is %d runes, must be exactly 2 columns", m, name, s, n)
			}
		}
	}
}

func TestPinnedGlyphChoices(t *testing.T) {
	full := GlyphsFor(ModeFull)
	if full.Block != "██" || full.Ghost != "░░" {
		t.Errorf("full mode glyphs = %q / %q want ██ / ░░", full.Block, full.Ghost)
	}
	if GlyphsFor(ModeReduced).Ghost != "░░" {
		t.Error("reduced mode must also use ░░")
	}
	if a := GlyphsFor(ModeASCII); a.Block != "[]" {
		t.Errorf("ascii block = %q want []", a.Block)
	}
}

func TestASCIIModeGlyphsAreASCII(t *testing.T) {
	g := GlyphsFor(ModeASCII)
	for name, s := range map[string]string{
		"Block": g.Block, "Ghost": g.Ghost, "Empty": g.Empty,
		"BorderH": g.BorderH, "BorderV": g.BorderV, "BorderTL": g.BorderTL,
		"BorderTR": g.BorderTR, "BorderBL": g.BorderBL, "BorderBR": g.BorderBR,
		"Bullet": g.Bullet,
	} {
		for _, r := range s {
			if r > unicode.MaxASCII {
				t.Errorf("ascii mode %s contains %q (U+%04X)", name, r, r)
			}
		}
	}
}

func TestEveryKindHasADistinctColourInEveryMode(t *testing.T) {
	for _, m := range []Mode{ModeFull, ModeReduced} {
		seen := map[string]game.PieceKind{}
		for _, k := range game.AllKinds {
			c := PieceColorFor(k, m)
			if c == "" {
				t.Errorf("%v: %s has no colour", m, k)
			}
			if prev, dup := seen[c]; dup {
				t.Errorf("%v: %s and %s share colour %s", m, prev, k, c)
			}
			seen[c] = k
		}
	}
}

func TestActiveIsBrighterThanLockedWhichIsBrighterThanGhost(t *testing.T) {
	for _, m := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		k := game.KindT
		a, l, g := ActivePaint(k, m), LockedPaint(k, m), GhostPaint(k, m)
		if !a.Bold || l.Bold {
			t.Errorf("%v: active must be bold and locked must not (%+v / %+v)", m, a, l)
		}
		if !g.Faint || l.Faint {
			t.Errorf("%v: ghost must be faint and locked must not (%+v / %+v)", m, g, l)
		}
		if a.FG != l.FG || l.FG != g.FG {
			t.Errorf("%v: all three states must share the piece hue", m)
		}
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/render/ -run 'TestDetectMode|TestGlyph|TestPinned|TestASCII|TestEveryKind|TestActiveIs' -v`
Expected: FAIL — `undefined: DetectMode`.

- [ ] **Step 3: Resolve the ASCII ghost glyph, then implement `palette.go`**

`··` (U+00B7 MIDDLE DOT) is not ASCII, and §32 says ASCII mode makes "no special Unicode assumptions". Ship `..` in `ModeASCII`, keep `░░` in full and reduced as §49.4 pins, and put this comment above `GlyphsFor`:

```go
// §49.4 pins the ASCII ghost as "··" (U+00B7), which is not ASCII. ASCII mode
// exists precisely for terminals that cannot be trusted with non-ASCII bytes
// (§32), and Plan 02 Task 6 asserts the whole frame is ASCII in that mode, so
// the ghost is ".." here. Full and reduced modes use ░░ exactly as pinned.
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/palette.go internal/render/palette_test.go
git commit -m "feat(render): modes, glyph sets, and the neon space palette"
```

---

### Task 4: Adaptive layout

**Files:**
- Create: `internal/render/layout.go`
- Test: `internal/render/layout_test.go`

**Interfaces:**
- Consumes: `game.Width`, `game.VisibleHeight`.
- Produces:
  - `type Size int` with `SizeTooSmall, SizeSmall, SizeMedium, SizeWide`.
  - `type Rect struct { X, Y, W, H int }`, `func (r Rect) Empty() bool`, `func (r Rect) Right() int`, `func (r Rect) Bottom() int`.
  - `const MinCols = 40`, `MinRows = 24`, `BoardCols = game.Width * 2` (20), `BoardRows = game.VisibleHeight` (20), `FrameCols = BoardCols + 2` (22), `FrameRows = BoardRows + 2` (22).
  - ```go
    type Layout struct {
        Size           Size
        Width, Height  int
        Frame          Rect // board including its border
        Left           Rect // hold + stats column; Empty when dropped
        Right          Rect // next column (+ stats when Left is empty)
        Title          Rect // Empty when dropped
        Mission        Rect // Empty when dropped
        Controls       Rect
        NextCount      int
        ShowStatLabels bool
    }
    func Compute(w, h int) Layout
    ```

Pinned thresholds — this table is the contract the golden tests then freeze:

| Condition | Size |
|---|---|
| `w < 40 || h < 24` | `SizeTooSmall` |
| `w < 46 || h < 26` | `SizeSmall` |
| `w < 64` | `SizeMedium` |
| otherwise | `SizeWide` |

Element rules:
- `Title` present when `h >= 26`; `Mission` present when `h >= 25`; `Controls` always present; `ShowStatLabels = Size != SizeSmall`. (Title goes first, then mission control, then labels — §49.3's order as height shrinks.)
- `Left` (width 14) present only in `SizeWide`; it carries HOLD then SCORE/LINES/LEVEL.
- `Right` width 10; `NextCount = 5` in `SizeWide`, otherwise `3`. Outside `SizeWide` the `Right` column carries HOLD, then NEXT, then the stats.
- Vertical stack, centred: `rows = titleRows + FrameRows + missionRows + 1`, `Y = max(0, (h-rows)/2)`.
- Horizontal: `content = Left.W + FrameCols + Right.W`, `X = max(0, (w-content)/2)`; the board `Frame` sits after `Left`.
- `SizeTooSmall` returns a `Layout` with everything `Empty` except `Width`/`Height`.

- [ ] **Step 1: Write the failing test**

`internal/render/layout_test.go`:

```go
package render

import "testing"

func TestSizeThresholds(t *testing.T) {
	cases := []struct {
		w, h int
		want Size
	}{
		{34, 19, SizeTooSmall}, {39, 40, SizeTooSmall}, {80, 23, SizeTooSmall},
		{40, 24, SizeSmall}, {45, 30, SizeSmall}, {80, 25, SizeSmall},
		{46, 26, SizeMedium}, {63, 40, SizeMedium},
		{64, 26, SizeWide}, {200, 60, SizeWide},
	}
	for _, c := range cases {
		if got := Compute(c.w, c.h).Size; got != c.want {
			t.Errorf("%dx%d: got %v want %v", c.w, c.h, got, c.want)
		}
	}
}

// Review focus 1: no WindowSizeMsg yet.
func TestZeroAndNegativeSizesAreTooSmallAndInert(t *testing.T) {
	for _, c := range [][2]int{{0, 0}, {-1, -1}, {0, 50}, {50, 0}} {
		l := Compute(c[0], c[1])
		if l.Size != SizeTooSmall {
			t.Errorf("%v: got %v", c, l.Size)
		}
		if !l.Frame.Empty() || !l.Controls.Empty() {
			t.Errorf("%v: nothing should be laid out", c)
		}
	}
}

func TestBoardIsAlwaysTwentyTwoByTwentyTwo(t *testing.T) {
	for _, c := range [][2]int{{40, 24}, {50, 30}, {80, 40}, {300, 100}} {
		l := Compute(c[0], c[1])
		if l.Frame.W != FrameCols || l.Frame.H != FrameRows {
			t.Errorf("%v: frame %dx%d want %dx%d", c, l.Frame.W, l.Frame.H, FrameCols, FrameRows)
		}
	}
	if FrameCols != 22 || FrameRows != 22 {
		t.Fatalf("frame constants drifted: %dx%d", FrameCols, FrameRows)
	}
}

func TestEverythingStaysInsideTheTerminal(t *testing.T) {
	for w := 40; w <= 200; w += 7 { // odd steps land on odd widths too
		for h := 24; h <= 80; h += 5 {
			l := Compute(w, h)
			rects := map[string]Rect{"frame": l.Frame, "left": l.Left, "right": l.Right,
				"title": l.Title, "mission": l.Mission, "controls": l.Controls}
			for name, r := range rects {
				if r.Empty() {
					continue
				}
				if r.X < 0 || r.Y < 0 || r.Right() > w || r.Bottom() > h {
					t.Fatalf("%dx%d: %s %+v escapes the terminal", w, h, name, r)
				}
			}
		}
	}
}

func TestColumnsDoNotOverlapTheBoard(t *testing.T) {
	for w := 40; w <= 200; w += 3 {
		l := Compute(w, 40)
		if !l.Left.Empty() && l.Left.Right() > l.Frame.X {
			t.Fatalf("w=%d: left column overlaps the board", w)
		}
		if !l.Right.Empty() && l.Right.X < l.Frame.Right() {
			t.Fatalf("w=%d: right column overlaps the board", w)
		}
	}
}

func TestNextNeverStacksAboveOrBelowTheBoard(t *testing.T) {
	for w := 40; w <= 120; w += 2 {
		for h := 24; h <= 60; h += 2 {
			l := Compute(w, h)
			if l.Right.Empty() {
				t.Fatalf("%dx%d: NEXT must always have a column", w, h)
			}
			if l.Right.X < l.Frame.Right() {
				t.Fatalf("%dx%d: NEXT is not beside the board", w, h)
			}
		}
	}
}

func TestDropOrderIsTitleThenMissionThenLabels(t *testing.T) {
	tall := Compute(80, 40)
	if tall.Title.Empty() || tall.Mission.Empty() || !tall.ShowStatLabels {
		t.Fatal("a large terminal should show everything")
	}
	if l := Compute(80, 25); !l.Title.Empty() || l.Mission.Empty() {
		t.Errorf("h=25 should drop the title and keep mission control: %+v", l)
	}
	if l := Compute(80, 24); !l.Title.Empty() || !l.Mission.Empty() {
		t.Errorf("h=24 should drop the title and mission control: %+v", l)
	}
	if l := Compute(40, 24); l.ShowStatLabels {
		t.Error("the 40x24 minimum should drop stat labels too")
	}
	if Compute(40, 24).Controls.Empty() {
		t.Error("controls must survive at the minimum size")
	}
}

func TestNextCountTruncatesAtSmallSizes(t *testing.T) {
	if got := Compute(80, 40).NextCount; got != 5 {
		t.Errorf("wide: got %d want 5", got)
	}
	if got := Compute(40, 24).NextCount; got != 3 {
		t.Errorf("small: got %d want 3", got)
	}
	if got := Compute(50, 30).NextCount; got != 3 {
		t.Errorf("medium: got %d want 3", got)
	}
}

func TestHoldColumnOnlyInWide(t *testing.T) {
	if Compute(80, 40).Left.Empty() {
		t.Error("wide layout should have the left hold/stats column")
	}
	if !Compute(50, 30).Left.Empty() {
		t.Error("medium and below should fold HOLD into the right column")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestSize|TestZeroAnd|TestBoardIs|TestEverythingStays|TestColumns|TestNext|TestDropOrder|TestHoldColumn' -v`
Expected: FAIL — `undefined: Compute`.

- [ ] **Step 3: Implement `layout.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS. Fix the thresholds in the table above only by changing the table and the test together, never one alone.

- [ ] **Step 5: Commit**

```bash
git add internal/render/layout.go internal/render/layout_test.go
git commit -m "feat(render): adaptive layout with pinned size thresholds"
```

---

### Task 5: Board, ghost, active piece, and border

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: `Canvas`, `Paint`, `Glyphs`, `Mode`, `Rect`, `game.Board`, `game.Piece`.
- Produces:
  - ```go
    type BoardView struct {
        Board  *game.Board
        Active game.Piece
        Ghost  game.Piece
        ShowActive bool // false during the game-over collapse (Plan 05)
        ShowGhost  bool
    }
    func DrawBoard(c *Canvas, r Rect, v BoardView, m Mode, border Paint)
    ```
    Draws, in §37's order: locked cells, then ghost (skipping any cell already occupied by a locked cell or by the active piece), then the active piece, then the border box around `r`.
  - `func BoardCellXY(r Rect, x, y int) (int, int)` — maps a logical board cell to the canvas position of its left column: `r.X + 1 + x*2`, `r.Y + 1 + (y - game.HiddenRows)`. Cells in the hidden rows map to a `y` above the frame interior and are not drawn.

- [ ] **Step 1: Write the failing test**

`internal/render/board_test.go`:

```go
package render

import (
	"strings"
	"testing"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func boardCanvas(t *testing.T, v BoardView, m Mode) (*Canvas, Rect) {
	t.Helper()
	r := Rect{X: 0, Y: 0, W: FrameCols, H: FrameRows}
	c := NewCanvas(FrameCols, FrameRows)
	DrawBoard(c, r, v, m, Paint{})
	return c, r
}

func TestLockedCellsRenderAsTwoColumnBlocks(t *testing.T) {
	var b game.Board
	b.Set(0, game.HiddenRows, game.CellFor(game.KindI))
	c, r := boardCanvas(t, BoardView{Board: &b}, ModeFull)
	x, y := BoardCellXY(r, 0, game.HiddenRows)
	if c.Rune(x, y) != '█' || c.Rune(x+1, y) != '█' {
		t.Fatalf("expected a two-column block at (%d,%d), got %q%q", x, y, c.Rune(x, y), c.Rune(x+1, y))
	}
	if c.PaintAt(x, y).FG != PieceColorFor(game.KindI, ModeFull) {
		t.Error("locked cell is not painted with its piece colour")
	}
	if c.PaintAt(x, y).Bold {
		t.Error("locked cells must not be bold; only the active piece is")
	}
}

func TestHiddenRowsAreNotDrawn(t *testing.T) {
	var b game.Board
	for x := 0; x < game.Width; x++ {
		b.Set(x, 0, game.CellFor(game.KindZ))
		b.Set(x, 1, game.CellFor(game.KindZ))
	}
	c, _ := boardCanvas(t, BoardView{Board: &b}, ModeFull)
	if strings.Contains(plain(c.String()), "█") {
		t.Fatal("hidden spawn rows leaked into the visible board")
	}
}

func TestActivePieceIsBoldAndOnTop(t *testing.T) {
	var b game.Board
	p := game.Piece{Kind: game.KindO, Rotation: 0, X: 4, Y: 10}
	c, r := boardCanvas(t, BoardView{Board: &b, Active: p, ShowActive: true}, ModeFull)
	for _, cell := range p.Cells() {
		x, y := BoardCellXY(r, cell[0], cell[1])
		if !c.PaintAt(x, y).Bold {
			t.Errorf("active cell %v is not bold", cell)
		}
	}
}

func TestGhostNeverObscuresLockedBlocks(t *testing.T) {
	var b game.Board
	b.Set(4, 20, game.CellFor(game.KindI))
	b.Set(5, 20, game.CellFor(game.KindI))
	ghost := game.Piece{Kind: game.KindO, Rotation: 0, X: 3, Y: 19} // overlaps row 20 columns 4,5
	c, r := boardCanvas(t, BoardView{Board: &b, Ghost: ghost, ShowGhost: true}, ModeFull)
	x, y := BoardCellXY(r, 4, 20)
	if c.Rune(x, y) != '█' {
		t.Fatalf("locked cell was overwritten by the ghost: %q", c.Rune(x, y))
	}
}

func TestGhostNeverObscuresTheActivePiece(t *testing.T) {
	var b game.Board
	active := game.Piece{Kind: game.KindO, Rotation: 0, X: 3, Y: 19}
	c, r := boardCanvas(t, BoardView{Board: &b, Active: active, Ghost: active, ShowActive: true, ShowGhost: true}, ModeFull)
	for _, cell := range active.Cells() {
		x, y := BoardCellXY(r, cell[0], cell[1])
		if c.Rune(x, y) != '█' {
			t.Fatalf("ghost overwrote the active piece at %v: %q", cell, c.Rune(x, y))
		}
	}
}

func TestGhostUsesThePinnedGlyphPerMode(t *testing.T) {
	var b game.Board
	ghost := game.Piece{Kind: game.KindO, Rotation: 0, X: 3, Y: 19}
	for mode, want := range map[Mode]rune{ModeFull: '░', ModeReduced: '░', ModeASCII: '.'} {
		c, r := boardCanvas(t, BoardView{Board: &b, Ghost: ghost, ShowGhost: true}, mode)
		x, y := BoardCellXY(r, 4, 19)
		if got := c.Rune(x, y); got != want {
			t.Errorf("%v: ghost glyph %q want %q", mode, got, want)
		}
	}
}

func TestBorderBoxSurroundsTheWell(t *testing.T) {
	var b game.Board
	c, r := boardCanvas(t, BoardView{Board: &b}, ModeFull)
	g := GlyphsFor(ModeFull)
	if string(c.Rune(r.X, r.Y)) != g.BorderTL || string(c.Rune(r.Right()-1, r.Y)) != g.BorderTR {
		t.Error("top corners wrong")
	}
	if string(c.Rune(r.X, r.Bottom()-1)) != g.BorderBL || string(c.Rune(r.Right()-1, r.Bottom()-1)) != g.BorderBR {
		t.Error("bottom corners wrong")
	}
	for x := r.X + 1; x < r.Right()-1; x++ {
		if string(c.Rune(x, r.Y)) != g.BorderH {
			t.Fatalf("top edge broken at x=%d: %q", x, c.Rune(x, r.Y))
		}
	}
	for y := r.Y + 1; y < r.Bottom()-1; y++ {
		if string(c.Rune(r.X, y)) != g.BorderV {
			t.Fatalf("left edge broken at y=%d: %q", y, c.Rune(r.X, y))
		}
	}
}

func TestBorderPaintIsTheCallersEnergyColour(t *testing.T) {
	var b game.Board
	r := Rect{W: FrameCols, H: FrameRows}
	c := NewCanvas(FrameCols, FrameRows)
	want := Paint{FG: "#ff00ff", Bold: true}
	DrawBoard(c, r, BoardView{Board: &b}, ModeFull, want)
	if got := c.PaintAt(r.X, r.Y); got != want {
		t.Errorf("border paint = %+v want %+v", got, want)
	}
}

func TestDrawBoardDoesNotMutateTheGame(t *testing.T) {
	g := game.New(5)
	g.Start()
	before := g.Board.Fingerprint()
	activeBefore := g.Active
	c := NewCanvas(FrameCols, FrameRows)
	DrawBoard(c, Rect{W: FrameCols, H: FrameRows},
		BoardView{Board: &g.Board, Active: g.Active, Ghost: g.Ghost(), ShowActive: true, ShowGhost: true},
		ModeFull, Paint{})
	if g.Board.Fingerprint() != before || g.Active != activeBefore {
		t.Fatal("rendering mutated game state")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestLocked|TestHidden|TestActivePiece|TestGhost|TestBorder|TestDrawBoard' -v`
Expected: FAIL — `undefined: DrawBoard`.

- [ ] **Step 3: Implement `board.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): board, ghost, active piece, and border box"
```

---

### Task 6: HUD, overlays, frame assembly, and golden layout tests

**Files:**
- Create: `internal/render/hud.go`
- Create: `internal/render/render.go`
- Create: `internal/render/golden_test.go`
- Create: `internal/render/testdata/` (golden files, generated)
- Test: `internal/render/hud_test.go`, `internal/render/render_test.go`

**Interfaces:**
- Consumes: Tasks 2–5.
- Produces (`hud.go`):
  - `func DrawMiniPiece(c *Canvas, x, y int, k game.PieceKind, m Mode)` — draws a kind in a 4×2-cell (8×2 column) box at its rotation-0 shape.
  - `func DrawHold(c *Canvas, r Rect, hold *game.PieceKind, showLabel bool, m Mode)`
  - `func DrawNext(c *Canvas, r Rect, next []game.PieceKind, count int, showLabel bool, m Mode)`
  - `func DrawStats(c *Canvas, r Rect, g *game.Game, showLabels bool, m Mode)` — `SCORE` zero-padded to 8 digits, `LINES` to 3, `LEVEL` to 2 (§4).
  - `func DrawControls(c *Canvas, r Rect, width int, m Mode)` — §4's hint line, truncated to `width` on narrow terminals.
  - `func DrawMission(c *Canvas, r Rect, msg string, m Mode)` — `☄ MISSION CONTROL: <msg>` (`>` in ASCII), truncated to the rect.
  - `func DrawTitle(c *Canvas, r Rect, seedLabel string, m Mode)` — `✦ COSMIC TETRIS` and `LOCAL UNIVERSE <seedLabel>`, where `seedLabel` is the seed rendered as 4 uppercase hex digits.
- Produces (`render.go`):
  - ```go
    type Overlay int
    const (OverlayNone Overlay = iota; OverlayPause; OverlayHelp; OverlayGameOver; OverlayTooSmall)

    type Frame struct {
        Game    *game.Game
        Layout  Layout
        Mode    Mode
        Overlay Overlay
        Mission string
        HelpText string // rendered by app.Model from the bubbles help model
        Border  Paint  // energy colour; Plan 03 animates it
    }
    func Render(f Frame) string
    ```
  - `func Box(lines []string, m Mode, p Paint) []string` — the rounded-corner overlay box used by pause/help/game over (`╭─╮ │ ╰─╯`, ASCII `+-+ |`).
  - `func CenterOverlay(c *Canvas, lines []string, m Mode, p Paint)` — centres the box, clipping rather than overflowing.
  - `func TooSmallLines(w, h int) []string` — §31's exact copy: `THIS UNIVERSE IS TOO SMALL`, `resize terminal to continue`, `current: 34 × 19`, `needed: approximately 40 × 24` (the `×` becomes `x` in ASCII mode; at these sizes assume nothing).

- [ ] **Step 1: Write the failing HUD tests**

`internal/render/hud_test.go`:

```go
package render

import (
	"strings"
	"testing"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func TestStatsZeroPadding(t *testing.T) {
	g := game.New(1)
	g.Score, g.Lines, g.Level = 129340, 42, 7
	c := NewCanvas(14, 12)
	DrawStats(c, Rect{W: 14, H: 12}, g, true, ModeFull)
	out := plain(c.String())
	for _, want := range []string{"SCORE", "00129340", "LINES", "042", "LEVEL", "07"} {
		if !strings.Contains(out, want) {
			t.Errorf("stats missing %q:\n%s", want, out)
		}
	}
}

func TestStatsWithoutLabels(t *testing.T) {
	g := game.New(1)
	g.Score, g.Lines, g.Level = 5, 42, 7
	c := NewCanvas(10, 12)
	DrawStats(c, Rect{W: 10, H: 12}, g, false, ModeFull)
	out := plain(c.String())
	if strings.Contains(out, "LINES") {
		t.Errorf("labels should be dropped:\n%s", out)
	}
	if !strings.Contains(out, "042") {
		t.Errorf("values must stay:\n%s", out)
	}
}

func TestNextShowsRequestedCountAndNoMore(t *testing.T) {
	next := []game.PieceKind{game.KindI, game.KindJ, game.KindL, game.KindO, game.KindS}
	for _, count := range []int{3, 5} {
		c := NewCanvas(10, 22)
		DrawNext(c, Rect{W: 10, H: 22}, next, count, true, ModeFull)
		blocks := strings.Count(plain(c.String()), "█")
		if blocks != count*4*2 {
			t.Errorf("count=%d: %d block columns, want %d", count, blocks, count*4*2)
		}
	}
}

func TestNextSurvivesAShortQueue(t *testing.T) {
	c := NewCanvas(10, 22)
	DrawNext(c, Rect{W: 10, H: 22}, []game.PieceKind{game.KindI}, 5, true, ModeFull) // must not panic
	if !strings.Contains(plain(c.String()), "█") {
		t.Error("the one available piece should still render")
	}
}

func TestHoldRendersEmptyAndFilled(t *testing.T) {
	c := NewCanvas(14, 6)
	DrawHold(c, Rect{W: 14, H: 6}, nil, true, ModeFull)
	if strings.Contains(plain(c.String()), "█") {
		t.Error("an empty hold must not draw a piece")
	}
	k := game.KindO
	c2 := NewCanvas(14, 6)
	DrawHold(c2, Rect{W: 14, H: 6}, &k, true, ModeFull)
	if !strings.Contains(plain(c2.String()), "█") {
		t.Error("a held piece should render")
	}
}

func TestControlsTruncateInsteadOfOverflowing(t *testing.T) {
	for _, w := range []int{20, 34, 40, 80} {
		c := NewCanvas(w, 1)
		DrawControls(c, Rect{W: w, H: 1}, w, ModeFull)
		for _, line := range strings.Split(plain(c.String()), "\n") {
			if len([]rune(line)) != w {
				t.Fatalf("w=%d produced a %d-column line", w, len([]rune(line)))
			}
		}
	}
}

func TestTitleShowsSeedAsHex(t *testing.T) {
	c := NewCanvas(60, 1)
	DrawTitle(c, Rect{W: 60, H: 1}, "7F3A", ModeFull)
	out := plain(c.String())
	if !strings.Contains(out, "COSMIC TETRIS") || !strings.Contains(out, "LOCAL UNIVERSE 7F3A") {
		t.Errorf("title line wrong:\n%s", out)
	}
}
```

- [ ] **Step 2: Run them to verify they fail, then implement `hud.go`**

Run: `go test ./internal/render/ -run 'TestStats|TestNext|TestHold|TestControls|TestTitle' -v`
Expected: FAIL — `undefined: DrawStats`. Then implement and re-run to PASS.

- [ ] **Step 3: Write the failing frame-invariant tests**

`internal/render/render_test.go`:

```go
package render

import (
	"strings"
	"testing"
	"unicode"

	"github.com/jessev/cosmic-tetris/internal/game"
)

// fixtureGame builds a deterministic mid-game position by writing cells
// directly, so goldens do not churn when engine tuning changes.
func fixtureGame() *game.Game {
	g := game.New(0x7F3A)
	g.Start()
	g.Score, g.Lines, g.Level, g.Combo = 129340, 42, 7, 2
	g.Active = game.Piece{Kind: game.KindT, Rotation: 0, X: 3, Y: 8}
	hold := game.KindL
	g.Hold = &hold
	g.Next = []game.PieceKind{game.KindI, game.KindO, game.KindS, game.KindZ, game.KindJ}
	for i, row := range []struct {
		y  int
		xs []int
	}{
		{21, []int{0, 1, 2, 3, 4, 6, 7, 8, 9}},
		{20, []int{0, 1, 2, 7, 8, 9}},
		{19, []int{0, 1, 8, 9}},
		{18, []int{0, 9}},
	} {
		for _, x := range row.xs {
			g.Board.Set(x, row.y, game.CellFor(game.AllKinds[(x+i)%7]))
		}
	}
	return g
}

// frameFor builds a fixture frame. Its strings must be legal for the mode it
// is asked for: an ASCII fixture containing an arrow would fail the ASCII
// purity tests for the fixture's sake rather than the renderer's.
func frameFor(w, h int, m Mode, o Overlay) Frame {
	helpText := "← → move   ↑ rotate   SPACE yeet"
	if m == ModeASCII {
		helpText = "h l move   k rotate   SPACE yeet"
	}
	return Frame{
		Game:     fixtureGame(),
		Layout:   Compute(w, h),
		Mode:     m,
		Overlay:  o,
		Mission:  "GRAVITY TAX INCREASED",
		HelpText: helpText,
	}
}

func lines(s string) []string { return strings.Split(plain(s), "\n") }

func TestRenderNeverExceedsTheTerminal(t *testing.T) {
	for w := 40; w <= 200; w += 7 {
		for h := 24; h <= 70; h += 5 {
			got := lines(Render(frameFor(w, h, ModeFull, OverlayNone)))
			if len(got) > h {
				t.Fatalf("%dx%d produced %d lines", w, h, len(got))
			}
			for i, line := range got {
				if n := len([]rune(line)); n > w {
					t.Fatalf("%dx%d line %d is %d columns: %q", w, h, i, n, line)
				}
			}
		}
	}
}

func TestRenderIsStableAcrossEveryOverlayAndMode(t *testing.T) {
	for _, m := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		for _, o := range []Overlay{OverlayNone, OverlayPause, OverlayHelp, OverlayGameOver, OverlayTooSmall} {
			for _, dims := range [][2]int{{40, 24}, {50, 30}, {80, 40}, {34, 19}, {0, 0}, {200, 60}} {
				out := Render(frameFor(dims[0], dims[1], m, o))
				for i, line := range lines(out) {
					if dims[0] > 0 && len([]rune(line)) > dims[0] {
						t.Fatalf("mode=%v overlay=%v %v line %d too wide", m, o, dims, i)
					}
				}
			}
		}
	}
}

// Review focus 5: --ascii must emit only ASCII.
func TestASCIIModeEmitsOnlyASCII(t *testing.T) {
	for _, o := range []Overlay{OverlayNone, OverlayPause, OverlayHelp, OverlayGameOver, OverlayTooSmall} {
		for _, dims := range [][2]int{{40, 24}, {80, 40}, {34, 19}} {
			f := frameFor(dims[0], dims[1], ModeASCII, o)
			f.Mission = "MOON NOTIFIED"
			for _, r := range plain(Render(f)) {
				if r > unicode.MaxASCII {
					t.Fatalf("overlay=%v %v emitted %q (U+%04X)", o, dims, r, r)
				}
			}
		}
	}
}

// Review focus 3: the too-small notice must fit the too-small terminal.
func TestTooSmallNoticeFitsAndReportsBothSizes(t *testing.T) {
	out := Render(frameFor(34, 19, ModeFull, OverlayTooSmall))
	got := plain(out)
	for _, want := range []string{"THIS UNIVERSE IS TOO SMALL", "resize terminal to continue", "34", "19", "40", "24"} {
		if !strings.Contains(got, want) {
			t.Errorf("notice missing %q:\n%s", want, got)
		}
	}
	for i, line := range lines(out) {
		if len([]rune(line)) > 34 {
			t.Fatalf("line %d overflows a 34-column terminal: %q", i, line)
		}
	}
	if n := len(lines(out)); n > 19 {
		t.Fatalf("notice used %d of 19 rows", n)
	}
}

func TestBoardOccupiesExactlyItsLayoutRect(t *testing.T) {
	f := frameFor(80, 40, ModeFull, OverlayNone)
	got := lines(Render(f))
	g := GlyphsFor(ModeFull)
	top := got[f.Layout.Frame.Y]
	runes := []rune(top)
	if string(runes[f.Layout.Frame.X]) != g.BorderTL {
		t.Errorf("board top-left is not at the layout position: %q", top)
	}
	if string(runes[f.Layout.Frame.Right()-1]) != g.BorderTR {
		t.Error("board top-right is not at the layout position")
	}
}

func TestHUDDoesNotCorruptTheBoard(t *testing.T) {
	f := frameFor(80, 40, ModeFull, OverlayNone)
	withHUD := lines(Render(f))
	bare := f
	bare.Mission, bare.HelpText = "", ""
	// The well interior must be identical whether or not the HUD text is present.
	for y := f.Layout.Frame.Y; y < f.Layout.Frame.Bottom(); y++ {
		a := []rune(withHUD[y])[f.Layout.Frame.X:f.Layout.Frame.Right()]
		b := []rune(lines(Render(bare))[y])[f.Layout.Frame.X:f.Layout.Frame.Right()]
		if string(a) != string(b) {
			t.Fatalf("row %d of the well changed with the HUD:\n%q\n%q", y, string(a), string(b))
		}
	}
}

func TestRenderDoesNotMutateTheGame(t *testing.T) {
	f := frameFor(80, 40, ModeFull, OverlayNone)
	before := *f.Game
	beforeFP := f.Game.Board.Fingerprint()
	Render(f)
	if f.Game.Board.Fingerprint() != beforeFP || f.Game.Active != before.Active ||
		f.Game.Score != before.Score || f.Game.Combo != before.Combo {
		t.Fatal("Render mutated game state (§37)")
	}
}

func TestResizeSweepNeverPanics(t *testing.T) {
	for w := 0; w <= 120; w++ {
		for h := 0; h <= 50; h += 3 {
			Render(frameFor(w, h, ModeFull, OverlayNone))
			Render(frameFor(w, h, ModeASCII, OverlayHelp))
		}
	}
}
```

- [ ] **Step 4: Run them to verify they fail**

Run: `go test ./internal/render/ -run TestRender -v`
Expected: FAIL — `undefined: Render`.

- [ ] **Step 5: Implement `render.go`**

`Render` allocates one canvas of `f.Layout.Width × f.Layout.Height`, walks §37's twelve steps (leaving 2, 6, 9, 10 as comments naming the plan that fills them), and returns `c.String()`. `OverlayTooSmall` short-circuits to the notice. `OverlayGameOver` draws §28's final card (score/lines/level, `r REBOOT UNIVERSE`, `q ACCEPT COSMIC DEATH`, subtitle `CAUSE: EXCESSIVE GEOMETRY`) over the frozen board. `OverlayPause` draws §30's box. `OverlayHelp` draws §39's `FLIGHT MANUAL` box using `f.HelpText`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 7: Add the golden suite (§41)**

`internal/render/golden_test.go`:

```go
package render

import (
	"flag"
	"os"
	"path/filepath"
	"testing"
)

var updateGolden = flag.Bool("update", false, "rewrite golden files")

func assertGolden(t *testing.T, name, got string) {
	t.Helper()
	path := filepath.Join("testdata", name+".txt")
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
		t.Errorf("%s changed.\n--- got ---\n%s\n--- want ---\n%s", name, got, want)
	}
}

func TestGoldenLayouts(t *testing.T) {
	cases := []struct {
		name    string
		w, h    int
		mode    Mode
		overlay Overlay
	}{
		{"wide", 80, 40, ModeFull, OverlayNone},
		{"medium", 50, 30, ModeFull, OverlayNone},
		{"small", 40, 24, ModeFull, OverlayNone},
		{"pause", 80, 40, ModeFull, OverlayPause},
		{"gameover", 80, 40, ModeFull, OverlayGameOver},
		{"help", 80, 40, ModeFull, OverlayHelp},
		{"ascii", 80, 40, ModeASCII, OverlayNone},
		{"toosmall", 34, 19, ModeFull, OverlayTooSmall},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			assertGolden(t, c.name, plain(Render(frameFor(c.w, c.h, c.mode, c.overlay))))
		})
	}
}
```

- [ ] **Step 8: Record the goldens, then read every one of them**

```bash
go test ./internal/render/ -update
go test ./internal/render/
ls internal/render/testdata/
cat internal/render/testdata/wide.txt
```

Read each recorded file and check it by eye against §4's mood: board centred, nothing overlapping, HOLD left, NEXT right, stats readable, mission control and controls on their own lines. The mockup is not geometry (§49.7) but it is the intent. Fix the drawing code and re-record until each file looks like a game you would want to play, and only then commit them.

- [ ] **Step 9: Commit**

```bash
git add internal/render/hud.go internal/render/render.go internal/render/hud_test.go internal/render/render_test.go internal/render/golden_test.go internal/render/testdata
git commit -m "feat(render): HUD, overlays, frame assembly, and golden layout tests"
```

---

### Task 7: Key bindings and the help model

**Files:**
- Create: `internal/app/keys.go`
- Test: `internal/app/keys_test.go`

**Interfaces:**
- Consumes: `charm.land/bubbles/v2/key`, `charm.land/bubbles/v2/help`.
- Produces:
  - ```go
    type KeyMap struct {
        Left, Right, SoftDrop, RotateCW, RotateCCW, HardDrop, Hold,
        Pause, Restart, Help, Quit key.Binding
    }
    func DefaultKeyMap() KeyMap
    func (k KeyMap) ShortHelp() []key.Binding
    func (k KeyMap) FullHelp() [][]key.Binding
    ```
  - Bindings, with §39's flavour text as the help descriptions: left `left h a`, right `right l d`, soft drop `down j s`, rotate CW `up k x w`, rotate CCW `z`, hard drop `space` ("YEET"), hold `c` ("quantum storage"), pause `p` ("suspend spacetime"), restart `r` ("reboot universe"), help `?`, quit `q esc ctrl+c`.

- [ ] **Step 1: Write the failing test**

`internal/app/keys_test.go`:

```go
package app

import (
	"strings"
	"testing"
)

func TestEverySpecifiedKeyIsBound(t *testing.T) {
	km := DefaultKeyMap()
	want := map[string][]string{
		"left":      {"left", "h", "a"},
		"right":     {"right", "l", "d"},
		"softdrop":  {"down", "j", "s"},
		"rotatecw":  {"up", "k", "x", "w"},
		"rotateccw": {"z"},
		"harddrop":  {" "},
		"hold":      {"c"},
		"pause":     {"p"},
		"restart":   {"r"},
		"help":      {"?"},
		"quit":      {"q", "esc"},
	}
	got := map[string][]string{
		"left": km.Left.Keys(), "right": km.Right.Keys(), "softdrop": km.SoftDrop.Keys(),
		"rotatecw": km.RotateCW.Keys(), "rotateccw": km.RotateCCW.Keys(),
		"harddrop": km.HardDrop.Keys(), "hold": km.Hold.Keys(), "pause": km.Pause.Keys(),
		"restart": km.Restart.Keys(), "help": km.Help.Keys(), "quit": km.Quit.Keys(),
	}
	for name, wantKeys := range want {
		have := strings.Join(got[name], ",")
		for _, k := range wantKeys {
			if !strings.Contains(have, k) {
				t.Errorf("%s: %q missing from %q", name, k, have)
			}
		}
	}
}

func TestSpaceIsHardDropNotSomethingElse(t *testing.T) {
	km := DefaultKeyMap()
	for _, k := range km.HardDrop.Keys() {
		if k == " " || k == "space" {
			return
		}
	}
	t.Fatalf("space is not bound to hard drop: %v", km.HardDrop.Keys())
}

func TestHelpDescriptionsUseTheFlightManualVoice(t *testing.T) {
	km := DefaultKeyMap()
	if got := km.HardDrop.Help().Desc; !strings.Contains(strings.ToUpper(got), "YEET") {
		t.Errorf("hard drop help = %q, want the §39 wording", got)
	}
	for _, b := range km.ShortHelp() {
		if b.Help().Desc == "" {
			t.Errorf("binding %v has no help text", b.Keys())
		}
	}
	if len(km.FullHelp()) == 0 {
		t.Error("FullHelp must return the manual layout")
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/app/ -run 'TestEverySpecified|TestSpaceIs|TestHelpDescriptions' -v`
Expected: FAIL — `undefined: DefaultKeyMap`.

- [ ] **Step 3: Implement `keys.go`**

Check the real key-name strings your bubbletea version reports for space and the arrows before finalizing: `go doc charm.land/bubbletea/v2 KeyPressMsg` and, if needed, a two-line scratch program that prints `msg.String()`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/app/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/app/keys.go internal/app/keys_test.go
git commit -m "feat(app): key bindings and flight-manual help text"
```

---

### Task 8: The Bubble Tea model, frame clock, and input

**Files:**
- Create: `internal/app/messages.go`
- Create: `internal/app/model.go`
- Create: `internal/app/update.go`
- Test: `internal/app/model_test.go`

**Interfaces:**
- Consumes: `Config`, `KeyMap`, `game.Game`, `render.*`.
- Produces:
  - `messages.go`: `type FrameMsg struct { Now time.Time }`, `func frameTick() tea.Cmd` (a `tea.Tick` of `FrameInterval`), `const FrameInterval = 16 * time.Millisecond`, `const MaxFrameDelta = 250 * time.Millisecond`.
  - ```go
    type AppState int
    const (StatePlaying AppState = iota; StatePaused; StateHelp; StateGameOver)

    type Model struct {
        Cfg    Config
        Game   *game.Game
        Mode   render.Mode
        Width, Height int
        State  AppState
        LastFrame time.Time
        Keys   KeyMap
        Help   help.Model
        Mission string
        Events []game.Event // last frame's events; Plan 03 hands these to FX
    }
    func NewModel(cfg Config, mode render.Mode, seed int64) *Model
    func (m *Model) Init() (tea.Model, tea.Cmd)   // signatures per the v2 doc read in Task 1
    func (m *Model) Update(tea.Msg) (tea.Model, tea.Cmd)
    func (m *Model) View() string
    func (m *Model) Delta(now time.Time) time.Duration // clamped to [0, MaxFrameDelta]; 0 when LastFrame is zero
    func (m *Model) overlay() render.Overlay
    ```
  - Behaviour: `FrameMsg` advances the game by `Delta(now)` (only in `StatePlaying`), stores the events, and re-arms the tick. Key presses act immediately, in the same `Update` call, without waiting for a tick. `p` toggles pause; `?` toggles help (and help pauses gameplay so the player is not killed while reading); `r` restarts; `q`/`esc`/`ctrl+c` quits; `WindowSizeMsg` stores the size. When `Game.Over`, `State` becomes `StateGameOver` and only `r` and `q` act.

- [ ] **Step 1: Write the failing test**

`internal/app/model_test.go`:

```go
package app

import (
	"strings"
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"
	"github.com/jessev/cosmic-tetris/internal/render"
)

func testModel(t *testing.T) *Model {
	t.Helper()
	m := NewModel(Config{Seed: 4242}, render.ModeFull, 4242)
	m.Width, m.Height = 80, 40
	return m
}

// keyMsg builds a KeyPressMsg from the same string form the KeyMap uses, so
// tests can say "left" or "ctrl+c" and not just single runes. Check the field
// and constant names against the `go doc` output recorded in Task 1 — this is
// the one helper that touches Bubble Tea's key representation directly, and
// every later plan's tests go through it.
func keyMsg(key string) tea.KeyPressMsg {
	named := map[string]tea.KeyMsg{
		"left": {Code: tea.KeyLeft}, "right": {Code: tea.KeyRight},
		"up": {Code: tea.KeyUp}, "down": {Code: tea.KeyDown},
		"esc": {Code: tea.KeyEscape}, "enter": {Code: tea.KeyEnter},
		"ctrl+c": {Code: 'c', Mod: tea.ModCtrl},
		" ":      {Code: tea.KeySpace, Text: " "},
	}
	if k, ok := named[key]; ok {
		return tea.KeyPressMsg(k)
	}
	return tea.KeyPressMsg{Code: []rune(key)[0], Text: key}
}

func press(t *testing.T, m *Model, key string) *Model {
	t.Helper()
	next, _ := m.Update(keyMsg(key))
	return next.(*Model)
}

// Review focus 2: a keypress before the first frame tick.
func TestDeltaIsZeroOnTheFirstFrameAndClampedAfterwards(t *testing.T) {
	m := testModel(t)
	if got := m.Delta(time.Now()); got != 0 {
		t.Errorf("first frame delta = %v want 0", got)
	}
	m.LastFrame = time.Unix(1000, 0)
	if got := m.Delta(time.Unix(1000, 0).Add(30 * time.Millisecond)); got != 30*time.Millisecond {
		t.Errorf("normal delta = %v want 30ms", got)
	}
	if got := m.Delta(time.Unix(1000, 0).Add(9 * time.Hour)); got != MaxFrameDelta {
		t.Errorf("suspended-terminal delta = %v want the %v clamp", got, MaxFrameDelta)
	}
	if got := m.Delta(time.Unix(999, 0)); got != 0 {
		t.Errorf("backwards clock delta = %v want 0", got)
	}
}

// Review focus 1: rendering before any WindowSizeMsg.
func TestViewBeforeAnyWindowSizeDoesNotPanic(t *testing.T) {
	m := NewModel(Config{Seed: 1}, render.ModeFull, 1)
	if out := m.View(); out == "" {
		t.Log("empty view before sizing is acceptable")
	}
}

func TestInputActsImmediatelyWithoutWaitingForATick(t *testing.T) {
	m := testModel(t)
	x := m.Game.Active.X
	m = press(t, m, "h")
	if m.Game.Active.X != x-1 {
		t.Fatalf("left press did not move the piece: %d -> %d", x, m.Game.Active.X)
	}
	y := m.Game.Active.Y
	m = press(t, m, "j")
	if m.Game.Active.Y != y+1 {
		t.Fatal("soft drop did not act immediately")
	}
}

func TestFrameMsgAdvancesGravityAndRearmsTheTick(t *testing.T) {
	m := testModel(t)
	m.LastFrame = time.Unix(0, 0)
	next, cmd := m.Update(FrameMsg{Now: time.Unix(0, 0).Add(900 * time.Millisecond)})
	m = next.(*Model)
	if cmd == nil {
		t.Fatal("the frame clock stopped; nothing re-armed the tick")
	}
	if len(m.Events) == 0 {
		t.Error("900ms should have produced at least one gravity event")
	}
}

func TestPauseFreezesGameplayButKeepsRendering(t *testing.T) {
	m := testModel(t)
	m = press(t, m, "p")
	if m.State != StatePaused {
		t.Fatalf("state = %v want paused", m.State)
	}
	before := m.Game.Active
	next, _ := m.Update(FrameMsg{Now: time.Unix(0, 0).Add(5 * time.Second)})
	m = next.(*Model)
	if m.Game.Active != before {
		t.Error("gravity ran while paused")
	}
	if !strings.Contains(plainOut(m.View()), "TEMPORAL SUSPENSION") {
		t.Error("pause overlay missing")
	}
	m = press(t, m, "p")
	if m.State != StatePlaying {
		t.Error("p did not resume")
	}
}

func TestHelpTogglesAndPausesPlay(t *testing.T) {
	m := testModel(t)
	m = press(t, m, "?")
	if m.State != StateHelp {
		t.Fatalf("state = %v want help", m.State)
	}
	if m.overlay() != render.OverlayHelp {
		t.Error("overlay should be help")
	}
	before := m.Game.Active
	next, _ := m.Update(FrameMsg{Now: time.Unix(0, 0).Add(3 * time.Second)})
	m = next.(*Model)
	if m.Game.Active != before {
		t.Error("the game must not run while the manual is open")
	}
	m = press(t, m, "?")
	if m.State != StatePlaying {
		t.Error("? did not close the manual")
	}
}

func TestRestartResetsTheGame(t *testing.T) {
	m := testModel(t)
	for i := 0; i < 4; i++ {
		m = press(t, m, " ")
	}
	if m.Game.Score == 0 {
		t.Fatal("setup: expected some score from hard drops")
	}
	m = press(t, m, "r")
	if m.Game.Score != 0 || m.Game.Lines != 0 || m.State != StatePlaying {
		t.Errorf("restart left score=%d lines=%d state=%v", m.Game.Score, m.Game.Lines, m.State)
	}
}

func TestQuitKeysReturnQuitCommand(t *testing.T) {
	for _, k := range []string{"q"} {
		m := testModel(t)
		_, cmd := m.Update(tea.KeyPressMsg{Code: []rune(k)[0], Text: k})
		if cmd == nil {
			t.Fatalf("%q did not produce a command", k)
		}
	}
}

func TestGameOverStateOnlyAcceptsRestartAndQuit(t *testing.T) {
	m := testModel(t)
	// Fill the well so the next spawn is blocked.
	for y := 0; y < 22; y++ {
		for x := 0; x < 10; x++ {
			m.Game.Board.Set(x, y, 1)
		}
	}
	for _, c := range m.Game.Active.Cells() {
		m.Game.Board.Set(c[0], c[1], 0)
	}
	m = press(t, m, " ")
	if m.State != StateGameOver {
		t.Fatalf("state = %v want game over", m.State)
	}
	before := m.Game.Score
	for _, k := range []string{"h", "l", "j", "c", "z", " "} {
		m = press(t, m, k)
	}
	if m.Game.Score != before {
		t.Error("gameplay keys acted after game over")
	}
	m = press(t, m, "r")
	if m.State != StatePlaying {
		t.Error("r must reboot the universe from the game-over state")
	}
}

func TestWindowSizeIsStoredAndTooSmallIsReported(t *testing.T) {
	m := testModel(t)
	next, _ := m.Update(tea.WindowSizeMsg{Width: 34, Height: 19})
	m = next.(*Model)
	if m.Width != 34 || m.Height != 19 {
		t.Fatalf("size not stored: %dx%d", m.Width, m.Height)
	}
	if m.overlay() != render.OverlayTooSmall {
		t.Error("34x19 should select the too-small overlay")
	}
	next, _ = m.Update(tea.WindowSizeMsg{Width: 80, Height: 40})
	m = next.(*Model)
	if m.overlay() != render.OverlayNone {
		t.Error("growing the terminal must recover")
	}
}

func TestResizeStormNeverPanics(t *testing.T) {
	m := testModel(t)
	for w := 0; w < 120; w += 3 {
		for h := 0; h < 50; h += 3 {
			next, _ := m.Update(tea.WindowSizeMsg{Width: w, Height: h})
			m = next.(*Model)
			_ = m.View()
		}
	}
}
```

Add a tiny helper in the same file: `func plainOut(s string) string` stripping ANSI with the same regexp used in `internal/render` (duplicating five lines here is cheaper than exporting a test helper across packages).

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/app/ -v`
Expected: FAIL — `undefined: NewModel`.

- [ ] **Step 3: Implement `messages.go`, `model.go`, and `update.go`**

Match the v2 `Model` signatures you recorded in Task 1 Step 2; if v2's `Update` returns `(tea.Model, tea.Cmd)` with a value receiver, adapt the tests' type assertions accordingly rather than fighting the library. Construct the `KeyPressMsg` literals in the tests to match whatever your version's struct actually looks like — the assertions, not the literals, are the contract.

Key repeat (§8 "holding left/right should support repeated movement") comes from the terminal's own auto-repeat: each repeat is another `KeyPressMsg` and each moves the piece. Do not add a repeat timer.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./... -race`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/app/messages.go internal/app/model.go internal/app/update.go internal/app/model_test.go
git commit -m "feat(app): bubbletea model, frame clock, input, pause, help, restart"
```

---

### Task 9: `main.go` and the playable build

**Files:**
- Create: `cmd/cosmic-tetris/main.go`
- Test: `cmd/cosmic-tetris/main_test.go`

**Interfaces:**
- Consumes: `app.ParseArgs`, `app.NewModel`, `render.DetectMode`.
- Produces: the binary. `main` parses args, prints usage and exits `0` for `--help`, prints the error and usage to stderr and exits `2` for a bad flag, otherwise builds the model and runs `tea.NewProgram(m, tea.WithAltScreen())`.

- [ ] **Step 1: Write the failing test**

`cmd/cosmic-tetris/main_test.go`:

```go
package main

import (
	"os/exec"
	"strings"
	"testing"
)

func build(t *testing.T) string {
	t.Helper()
	bin := t.TempDir() + "/cosmic-tetris"
	out, err := exec.Command("go", "build", "-o", bin, ".").CombinedOutput()
	if err != nil {
		t.Fatalf("build failed: %v\n%s", err, out)
	}
	return bin
}

func TestHelpExitsZeroAndListsTheWholeCLI(t *testing.T) {
	out, err := exec.Command(build(t), "--help").CombinedOutput()
	if err != nil {
		t.Fatalf("--help exited non-zero: %v\n%s", err, out)
	}
	for _, want := range []string{"--seed", "--ascii", "--no-fx", "--reduced-motion"} {
		if !strings.Contains(string(out), want) {
			t.Errorf("--help output missing %q:\n%s", want, out)
		}
	}
}

func TestUnknownFlagFailsLoudly(t *testing.T) {
	out, err := exec.Command(build(t), "--wormhole").CombinedOutput()
	if err == nil {
		t.Fatalf("unknown flag exited zero:\n%s", out)
	}
	if !strings.Contains(strings.ToLower(string(out)), "wormhole") {
		t.Errorf("error should name the bad flag:\n%s", out)
	}
}

func TestBinaryStartsAndExitsCleanlyWithoutATTY(t *testing.T) {
	cmd := exec.Command(build(t), "--seed", "1", "--no-fx")
	out, err := cmd.CombinedOutput()
	// Without a TTY, bubbletea may refuse to start; what matters is that it
	// neither hangs nor panics.
	if strings.Contains(string(out), "panic:") {
		t.Fatalf("binary panicked:\n%s", out)
	}
	_ = err
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./cmd/cosmic-tetris/ -v`
Expected: FAIL — no `main.go` to build.

- [ ] **Step 3: Implement `main.go`**

- [ ] **Step 4: Run the tests and build**

Run: `go test ./... -race && make build`
Expected: PASS, and `./cosmic-tetris` exists.

- [ ] **Step 5: Play it**

Run: `./cosmic-tetris --seed 8675309`
Check by hand: pieces fall; `←/→` move and repeat when held; `↑`/`z` rotate; `↓` soft-drops; `space` hard-drops and locks instantly; `c` holds once per piece; the ghost sits under the piece; the next queue shows five; `p` pauses; `?` opens the manual; `r` restarts; `q` quits and the terminal is left clean. Resize the window while playing, including down past 40×24 and back. Then run `./cosmic-tetris --ascii` and confirm it is still perfectly playable.

- [ ] **Step 6: Commit**

```bash
git add cmd/cosmic-tetris/main.go cmd/cosmic-tetris/main_test.go
git commit -m "feat(cmd): cosmic-tetris binary with the pinned CLI surface"
```

---

## Done when

- `make test` passes with `-race`; goldens exist for wide, medium, small, pause, game over, help, ASCII, and too-small.
- The game is genuinely fun with no effects at all — §42's Phase 2 bar ("At this point it should already be a genuinely good game").
- No line of output ever exceeds the terminal width at any size from 0×0 up.
- `--ascii` emits nothing but ASCII.
- `internal/render` imports `internal/game` and `lipgloss`, and nothing else of ours; `internal/app` imports both plus bubbletea/bubbles. Neither `render` nor `game` imports `app`.
