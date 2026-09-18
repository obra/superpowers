# Cosmic Tetris — Plan 2 of 3: Playable Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the headless engine into a genuinely good, genuinely playable terminal game: Bubble Tea event loop, immediate keyboard control, board and HUD rendering, next queue, hold, ghost, adaptive layout, pause, restart, help, game over, and the full CLI surface — with snapshot tests pinning the layout.

**Architecture:** Three packages. `internal/render` is pure: it takes a `Frame` value (game pointer, size, mode, overlay) and returns a string, drawing into a `Canvas` of single-width styled cells so plan 3's effects can composite into the same grid. `internal/app` owns the Bubble Tea model, one 60 Hz frame clock, and the keymap; it converts key presses into `game.Action` immediately and elapsed time into `game.Advance(dt)`. `cmd/cosmic-tetris` parses flags and starts the program. Dependencies point one way: `app → render → game`.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`.

**Spec:** `design.md` (this plan implements §4, §8, §10 rendering, §26, §29 skip-to-play stub, §30, §31, §32, §33, §36, §37, §39, §41, §46, §49.3, §49.4)

**Plan sequence:** Plan 2 of 3. Requires plan 1 (`2026-09-17-cosmic-tetris-01-engine.md`) to be complete and merged — every `game.*` name used here comes from its Interfaces blocks. Plan 3 (`2026-09-17-cosmic-tetris-03-cosmic-fx.md`) adds effects on top of the `Canvas` and `Frame` this plan creates.

## Global Constraints

- Module `cosmic-tetris`, Go 1.26. Imports: `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`.
- **Do not abstract Bubble Tea away behind a homegrown framework** (§3). The model, `Update`, and messages are ordinary Bubble Tea.
- Dependency direction is one-way: `internal/render` must not import `internal/app`; neither may import `internal/fx` in this plan. `internal/game` stays untouched except where a step says otherwise.
- **Rendering must not mutate game state** (§37). `render` receives `*game.Game` and calls only read-only methods (`GhostY`, `Board.At`, field reads).
- One animation clock at ~60 Hz driving accumulated elapsed time; **no second timing loop** (§36). Input is handled the instant the key message arrives, never deferred to a tick (§8, §44).
- Board geometry on screen: each cell is **2 terminal columns × 1 row** (§5). Board box is 22 columns × 22 rows (20 visible rows plus border).
- Minimum usable terminal: **40 columns × 24 rows** (§31). Below that, show the too-small notice. Never crash on resize (§31).
- Every glyph written to a `Canvas` cell must be single-width. A test enforces this over the glyph table.
- Element drop order as height runs out: title, then mission control, then stat labels (§49.3). NEXT never stacks above or below the board; at small sizes it sits beside the board and truncates to 3 pieces.
- Ghost glyph `░░` in full/reduced modes, `··` in ASCII; pieces use filled glyphs (`██`, `[]` in ASCII) with a bright foreground; the active piece renders one step brighter than locked cells (§49.4).
- CLI surface is exactly: no flags, `--seed`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help` (§49.5). Nothing else.
- The §4 mockup is intent, not geometry (§49.7). The ANSI-stripped goldens are the binding layout contract (§41).
- Every task ends with `go test ./...` passing, `go vet ./...` clean, and `gofmt -l .` empty.

## Review Focus

Input classes the spec implies but does not spell out. Each has a test in the task that owns the code.

1. **`View()` before the first `WindowSizeMsg`, and a 0×0 or 1×1 size.** Bubble Tea can call `View` before it reports a size, and some terminals report zero during a resize storm. Any division or `w - 22` arithmetic must survive it: expect the too-small notice, never a panic or a negative-length slice. → Task 4 and Task 6.
2. **Every size in a sweep from 1×1 to 120×60.** No panic, no rendered line wider than the terminal, and never more lines than the terminal has rows — otherwise the terminal scrolls and the frame tears. → Task 8.
3. **A very large terminal (e.g. 300×100).** The board must stay 22 columns wide and centered rather than stretching, and panels must not float absurdly far from the board. → Task 4.
4. **Unmapped keys, mouse events, paste, and focus messages.** A stray mouse scroll or bracketed paste must be ignored, not fall through into a movement action or panic on a type assertion. → Task 6.
5. **Resize into and back out of the too-small state, while paused and after game over.** The game must not be restarted, unpaused, or lose the board when the terminal shrinks below the minimum and grows again. → Task 6.

---

## File Structure

| File | Responsibility |
|---|---|
| `cmd/cosmic-tetris/main.go` | Flag parsing, mode detection, seed selection, `tea.NewProgram`. |
| `internal/render/palette.go` | `Mode`, `DetectMode`, glyph table, all colors, per-mode glyph selection. |
| `internal/render/render.go` | `Canvas` (styled single-width cell grid), `Frame`, `Render`, overlay drawing. |
| `internal/render/layout.go` | `Layout` and `Compute(w, h)`: tiers, positions, drop order. |
| `internal/render/board.go` | Board box, locked cells, ghost, active piece. |
| `internal/render/hud.go` | Title, HOLD, NEXT, stats, mission line, controls line. |
| `internal/app/keys.go` | `KeyMap` built on `bubbles/v2/key`, plus help bindings. |
| `internal/app/messages.go` | `FrameMsg` and the frame-tick command. |
| `internal/app/model.go` | `Options`, `State`, `Model`, `New`, `Init`, `View`. |
| `internal/app/update.go` | `Update`: keys, frame ticks, resize. |
| `internal/render/testdata/*.golden` | ANSI-stripped layout snapshots. |
| `README.md` | What it is, how to build, controls, flags. |

---

### Task 1: Dependencies and a running Bubble Tea program

**Files:**
- Create: `cmd/cosmic-tetris/main.go`, `internal/app/model.go`, `internal/app/messages.go`
- Modify: `go.mod`, `go.sum`

**Interfaces:**
- Consumes: `game.New` (plan 1).
- Produces:
  ```go
  // internal/app
  type Options struct {
      Seed          int64
      SeedFixed     bool // true when --seed was given explicitly
      ASCII         bool
      NoFX          bool
      ReducedMotion bool
  }
  type State int
  const (
      StatePlaying State = iota
      StatePaused
      StateGameOver
  )
  type Model struct { /* fields grow through this plan */ }
  func New(opts Options) *Model

  // internal/app/messages.go
  type FrameMsg struct{ Now time.Time }
  const FrameRate = time.Second / 60
  func frameTick() tea.Cmd // tea.Tick(FrameRate, ...) -> FrameMsg
  ```

**API note — read this before writing code.** Bubble Tea v2 and Lip Gloss v2 changed several signatures from v1 (`Init` returns a model, key messages are `tea.KeyPressMsg`, the color profile moved). This plan states intent; bind the exact signatures to what the installed version reports.

- [ ] **Step 1: Add the dependencies**

```bash
go get charm.land/bubbletea/v2@latest charm.land/lipgloss/v2@latest charm.land/bubbles/v2@latest
```

- [ ] **Step 2: Record the actual v2 API surface**

Run and read:

```bash
go doc charm.land/bubbletea/v2 Model
go doc charm.land/bubbletea/v2 | grep -iE 'func Tick|KeyPressMsg|WindowSizeMsg|WithAltScreen|NewProgram'
go doc charm.land/lipgloss/v2 | grep -iE 'func NewStyle|func Color|func Width|func JoinVertical'
go doc charm.land/bubbles/v2/key Binding
go doc charm.land/bubbles/v2/help Model
```

Expected: you now know whether `Init` returns `(Model, Cmd)`, whether `View` returns `string` or a `fmt.Stringer`, and the exact key-message type name. Use those signatures for the rest of this plan; where a later step names `tea.KeyPressMsg` and your version differs, use your version's name.

- [ ] **Step 3: Write a smoke test for the model constructor**

```go
func TestNewModelStartsPlaying(t *testing.T) {
	m := New(Options{Seed: 5})
	if m.state != StatePlaying {
		t.Errorf("state = %v, want StatePlaying", m.state)
	}
	if m.game == nil {
		t.Fatal("model must hold a game")
	}
	if m.game.Seed != 5 {
		t.Errorf("game seed = %d, want 5", m.game.Seed)
	}
}

func TestViewBeforeAnySizeDoesNotPanic(t *testing.T) {
	m := New(Options{Seed: 5})
	_ = m.View() // width and height are still zero
}
```

- [ ] **Step 4: Run it to verify it fails**

Run: `go test ./internal/app/ -v`
Expected: FAIL — `undefined: New`.

- [ ] **Step 5: Implement `internal/app/model.go` and `messages.go`**

`Model` holds `opts Options`, `game *game.Game`, `state State`, `width, height int`, `lastFrame time.Time`. `Init` returns the model plus `frameTick()`. For now `View()` returns `"cosmic tetris"` and `Update` handles only quit keys (`q`, `esc`, `ctrl+c`) and `tea.WindowSizeMsg`; a real `Update` arrives in Task 6.

- [ ] **Step 6: Implement `cmd/cosmic-tetris/main.go`**

Parse exactly the §49.5 flags with the `flag` package: `--seed int64`, `--ascii`, `--no-fx`, `--reduced-motion`, plus `flag.Usage` for `--help`. When `--seed` is absent, seed from `time.Now().UnixNano()` and leave `SeedFixed` false (main may read the clock; the engine may not). Start with `tea.NewProgram(app.New(opts), tea.WithAltScreen())` and exit non-zero on a run error.

- [ ] **Step 7: Verify it builds, runs and quits**

Run: `go build ./... && go test ./... && ./cosmic-tetris --help`
Expected: the flag list prints the five flags and nothing else. Then run `./cosmic-tetris` in a terminal and press `q`: it must clear the alt screen and exit 0.

- [ ] **Step 8: Commit**

```bash
git add go.mod go.sum cmd internal/app
git commit -m "feat(app): bubble tea v2 program skeleton and CLI flags"
```

---

### Task 2: Palette, modes and glyphs

**Files:**
- Create: `internal/render/palette.go`
- Test: `internal/render/palette_test.go`

**Interfaces:**
- Consumes: `game.PieceKind`.
- Produces:
  ```go
  type Mode int
  const (
      ModeFull    Mode = iota // unicode + truecolor
      ModeReduced             // unicode + 256 color
      ModeASCII               // ascii glyphs only
  )
  // DetectMode picks a mode from the environment. asciiFlag forces ModeASCII.
  func DetectMode(term, colorterm string, asciiFlag bool) Mode

  type Glyphs struct {
      Block      string // "██" / "[]"
      Ghost      string // "░░" / "··"
      Empty      string // "  " in every mode
      BorderH, BorderV                     rune
      BorderTL, BorderTR, BorderBL, BorderBR rune
      MissionPrefix string // "✦" / "*"
      Trail      [3]rune // "▓▒░" / "|:."  (plan 3 uses these)
      Stars      [6]rune // '.' '·' '˚' '✦' '✧' '*'  /  ascii fallbacks
  }
  func GlyphsFor(m Mode) Glyphs

  type Palette struct{ mode Mode }
  func NewPalette(m Mode) Palette
  func (p Palette) Locked(k game.PieceKind) lipgloss.Style
  func (p Palette) Active(k game.PieceKind) lipgloss.Style
  func (p Palette) Ghost() lipgloss.Style
  func (p Palette) Border(phase float64) lipgloss.Style // phase 0..1 cycles the §25 ramp
  func (p Palette) Dim() lipgloss.Style   // labels, controls line
  func (p Palette) Label() lipgloss.Style // stat labels
  func (p Palette) Value() lipgloss.Style // stat values, bright
  func (p Palette) Accent() lipgloss.Style
  ```

Pinned colors (§26 neon space palette, §49.4 bright foreground on filled glyphs):

| Kind | Locked | Active (one step brighter) |
|---|---|---|
| I plasma cyan | `#22E4F7` | `#7FF4FF` |
| J deep electric blue | `#3B6BFF` | `#86A4FF` |
| L solar orange | `#FF8C1A` | `#FFB469` |
| O stellar gold | `#FFD23F` | `#FFE58A` |
| S alien green | `#4EF07A` | `#9BF7B8` |
| T ultraviolet | `#A05CFF` | `#C79BFF` |
| Z supernova pink | `#FF3D81` | `#FF85AC` |

Ghost `#4A4A6A`. Dim `#6C6C8A`. Label `#8A8AA8`. Value `#EEF6FF`. Accent `#22E4F7`. Border ramp, in cycle order: `#5B2A86` deep violet → `#22E4F7` electric cyan → `#FF3DF2` magenta → `#2F6BFF` stellar blue → `#EEF6FF` hot white, interpolated in RGB.

`ModeReduced` does not carry a second palette: Lip Gloss downsamples truecolor to the terminal's profile. `ModeASCII` uses the same hex values but no gradient interpolation — `Border(phase)` returns the ramp's nearest stop instead of a blend, and no background colors are ever set.

`DetectMode`: `asciiFlag` → `ModeASCII`; else `COLORTERM` containing `truecolor` or `24bit` → `ModeFull`; else `ModeReduced`. A `TERM` of `dumb` or empty → `ModeASCII`.

The mission prefix is `✦`, not §27's `☄`: U+2604 is double-width in most terminals and would shift every cell on that row by one column. `✦` is single-width and keeps the same visual register.

- [ ] **Step 1: Write the failing tests**

```go
func TestDetectMode(t *testing.T) {
	cases := []struct {
		term, colorterm string
		ascii           bool
		want            Mode
	}{
		{"xterm-256color", "truecolor", false, ModeFull},
		{"xterm-256color", "24bit", false, ModeFull},
		{"xterm-256color", "", false, ModeReduced},
		{"xterm", "", false, ModeReduced},
		{"dumb", "truecolor", false, ModeASCII},
		{"", "", false, ModeASCII},
		{"xterm-256color", "truecolor", true, ModeASCII},
	}
	for _, c := range cases {
		if got := DetectMode(c.term, c.colorterm, c.ascii); got != c.want {
			t.Errorf("DetectMode(%q,%q,%v) = %v, want %v", c.term, c.colorterm, c.ascii, got, c.want)
		}
	}
}

func TestGlyphsPerMode(t *testing.T) {
	full := GlyphsFor(ModeFull)
	if full.Block != "██" || full.Ghost != "░░" {
		t.Errorf("full mode glyphs = %q/%q, want ██/░░", full.Block, full.Ghost)
	}
	ascii := GlyphsFor(ModeASCII)
	if ascii.Block != "[]" || ascii.Ghost != ".." {
		t.Errorf("ascii glyphs = %q/%q, want []/..", ascii.Block, ascii.Ghost)
	}
	if GlyphsFor(ModeReduced).Ghost != "░░" {
		t.Error("reduced mode keeps the unicode ghost")
	}
}

func TestEveryCellGlyphIsExactlyTwoColumnsWide(t *testing.T) {
	for _, m := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		g := GlyphsFor(m)
		for name, s := range map[string]string{"Block": g.Block, "Ghost": g.Ghost, "Empty": g.Empty} {
			if w := lipgloss.Width(s); w != 2 {
				t.Errorf("mode %v %s = %q is %d columns wide, want 2", m, name, s, w)
			}
		}
	}
}

func TestEverySingleRuneGlyphIsSingleWidth(t *testing.T) {
	for _, m := range []Mode{ModeFull, ModeReduced, ModeASCII} {
		g := GlyphsFor(m)
		runes := []rune{g.BorderH, g.BorderV, g.BorderTL, g.BorderTR, g.BorderBL, g.BorderBR}
		runes = append(runes, g.Trail[:]...)
		runes = append(runes, g.Stars[:]...)
		for _, r := range runes {
			if w := lipgloss.Width(string(r)); w != 1 {
				t.Errorf("mode %v glyph %q is %d columns wide, want 1 (double-width runes shift the whole grid)", m, r, w)
			}
		}
		if w := lipgloss.Width(g.MissionPrefix); w != 1 {
			t.Errorf("mode %v MissionPrefix %q is %d wide, want 1", m, g.MissionPrefix, w)
		}
	}
}

func TestActiveIsDistinctFromLockedForEveryKind(t *testing.T) {
	p := NewPalette(ModeFull)
	for _, k := range game.AllKinds {
		if p.Active(k).Render("x") == p.Locked(k).Render("x") {
			t.Errorf("kind %v: active and locked render identically", k)
		}
	}
}

func TestBorderPhaseWrapsAndIsStable(t *testing.T) {
	p := NewPalette(ModeFull)
	if p.Border(0).Render("x") != p.Border(1).Render("x") {
		t.Error("Border(0) and Border(1) should be the same point on the cycle")
	}
	for _, ph := range []float64{-3.25, 0.5, 7.75} {
		_ = p.Border(ph) // must not panic on out-of-range phase
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -v`
Expected: FAIL — `undefined: DetectMode`.

- [ ] **Step 3: Implement `palette.go`**

Store colors as `lipgloss.Color("#RRGGBB")` in a `[8]` table indexed by `game.PieceKind`. `Border(phase)` normalizes the phase into `[0,1)`, scales by the number of ramp segments, and linearly interpolates the two neighboring stops' RGB bytes (parse the hex once at init into `[3]uint8` triples).

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/palette.go internal/render/palette_test.go
git commit -m "feat(render): neon space palette, mode detection and per-mode glyphs"
```

---

### Task 3: Canvas

**Files:**
- Create: `internal/render/render.go` (Canvas portion only)
- Test: `internal/render/canvas_test.go`

**Interfaces:**
- Consumes: `lipgloss`.
- Produces:
  ```go
  // StyleID indexes a Canvas's style table. 0 is the zero style.
  type StyleID int
  // Canvas is a fixed grid of single-width cells. Writes outside the grid
  // are silently dropped, so callers never need bounds checks.
  type Canvas struct { /* w, h int; runes []rune; styles []StyleID; table []lipgloss.Style */ }
  func NewCanvas(w, h int) *Canvas
  func (c *Canvas) Size() (w, h int)
  func (c *Canvas) Style(s lipgloss.Style) StyleID // registers and returns an id
  func (c *Canvas) Set(x, y int, r rune, id StyleID)
  // SetString writes s left to right from (x,y). Runes wider than one column
  // are replaced with '?' so the grid never drifts.
  func (c *Canvas) SetString(x, y int, s string, id StyleID)
  func (c *Canvas) Fill(r rune, id StyleID)
  // String renders the grid, coalescing runs of equal style into one styled
  // span per run, and trimming trailing blanks on each line.
  func (c *Canvas) String() string
  ```

Coalescing matters: styling every cell individually would emit tens of thousands of escape sequences per frame and visibly flicker (§47).

- [ ] **Step 1: Write the failing tests**

```go
func plain(s string) string { return stripANSI(s) } // helper lives in golden_test.go, Task 5

func TestCanvasStartsBlank(t *testing.T) {
	c := NewCanvas(4, 2)
	if got := stripANSI(c.String()); got != "\n" {
		t.Errorf("blank canvas = %q, want a single empty line plus newline", got)
	}
}

func TestCanvasSetAndRender(t *testing.T) {
	c := NewCanvas(5, 2)
	id := c.Style(lipgloss.NewStyle().Foreground(lipgloss.Color("#FF0000")))
	c.SetString(1, 0, "abc", id)
	c.Set(0, 1, 'z', 0)
	lines := strings.Split(stripANSI(c.String()), "\n")
	if lines[0] != " abc" {
		t.Errorf("line 0 = %q, want %q", lines[0], " abc")
	}
	if lines[1] != "z" {
		t.Errorf("line 1 = %q, want %q", lines[1], "z")
	}
}

func TestCanvasDropsOutOfBoundsWrites(t *testing.T) {
	c := NewCanvas(3, 2)
	c.Set(-1, 0, 'x', 0)
	c.Set(0, -5, 'x', 0)
	c.Set(99, 0, 'x', 0)
	c.Set(0, 99, 'x', 0)
	c.SetString(2, 0, "abcdef", 0) // runs off the right edge
	c.SetString(-2, 1, "xy", 0)    // starts off the left edge
	got := stripANSI(c.String())
	if strings.Contains(got, "cdef") {
		t.Errorf("text ran past the right edge: %q", got)
	}
	lines := strings.Split(got, "\n")
	if lines[0] != "  a" {
		t.Errorf("line 0 = %q, want %q", lines[0], "  a")
	}
	if lines[1] != "" && lines[1] != "y" {
		t.Errorf("line 1 = %q, want the clipped remainder or empty", lines[1])
	}
}

func TestCanvasReplacesWideRunes(t *testing.T) {
	c := NewCanvas(4, 1)
	c.SetString(0, 0, "a☄b", 0) // ☄ is double-width
	got := stripANSI(c.String())
	if lipgloss.Width(got) != len([]rune("a?b")) {
		t.Errorf("wide rune was not narrowed: %q (width %d)", got, lipgloss.Width(got))
	}
}

func TestCanvasCoalescesStyleRuns(t *testing.T) {
	c := NewCanvas(10, 1)
	id := c.Style(lipgloss.NewStyle().Bold(true))
	c.SetString(0, 0, "aaaaaaaaaa", id)
	out := c.String()
	if n := strings.Count(out, "\x1b["); n > 4 {
		t.Errorf("a single styled run emitted %d escape sequences, want at most 4", n)
	}
}

func TestCanvasZeroAndNegativeSizes(t *testing.T) {
	for _, dim := range [][2]int{{0, 0}, {0, 5}, {5, 0}, {-3, -3}} {
		c := NewCanvas(dim[0], dim[1])
		c.Set(0, 0, 'x', 0)
		c.SetString(0, 0, "hello", 0)
		_ = c.String() // must not panic
	}
}

func TestCanvasNeverExceedsItsWidth(t *testing.T) {
	c := NewCanvas(7, 3)
	c.Fill('#', 0)
	for _, line := range strings.Split(stripANSI(c.String()), "\n") {
		if w := lipgloss.Width(line); w > 7 {
			t.Errorf("line %q is %d columns wide, want <= 7", line, w)
		}
	}
}
```

Add the ANSI stripper now, in `internal/render/strip_test.go`, since Task 5's goldens reuse it:

```go
var ansiRE = regexp.MustCompile("\x1b\\[[0-9;?]*[a-zA-Z]")

func stripANSI(s string) string { return ansiRE.ReplaceAllString(s, "") }
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run Canvas -v`
Expected: FAIL — `undefined: NewCanvas`.

- [ ] **Step 3: Implement the Canvas in `render.go`**

Back the grid with two flat slices of length `w*h`. `NewCanvas` clamps negative dimensions to 0. `String` walks each row, groups consecutive cells with the same `StyleID`, renders each group with `table[id].Render(runs)`, right-trims spaces that carry the zero style, and joins rows with `\n`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/render.go internal/render/canvas_test.go internal/render/strip_test.go
git commit -m "feat(render): styled single-width cell canvas with run coalescing"
```

---

### Task 4: Adaptive layout

**Files:**
- Create: `internal/render/layout.go`
- Test: `internal/render/layout_test.go`

**Interfaces:**
- Consumes: `game.Width`, `game.VisibleRows`.
- Produces:
  ```go
  const (
      CellCols = 2                       // §5: 2 columns per logical cell
      BoardW   = game.Width * CellCols   // 20
      BoardBoxW = BoardW + 2             // 22, with border
      BoardBoxH = game.VisibleRows + 2   // 22, with border
      MinCols  = 40                      // §31
      MinRows  = 24
      WidePanelW    = 12
      CompactPanelW = 14
      WideMinCols   = 56
  )

  type Tier int
  const (
      TierCompact Tier = iota // board + one panel column on the right
      TierWide                // HOLD + stats left, board, NEXT right
  )

  type Layout struct {
      ScreenW, ScreenH int
      TooSmall         bool
      Tier             Tier
      BoardX, BoardY   int // top-left of the board's border box
      LeftPanelX       int // valid on TierWide
      RightPanelX      int
      PanelW           int
      ShowTitle        bool
      ShowMission      bool
      ShowStatLabels   bool
      NextCount        int // 5 wide, 3 compact (§49.3)
      TitleY           int
      MissionY         int
      ControlsY        int
  }
  func Compute(w, h int) Layout
  ```

Pinned rules — the tests below assert exactly these:

- `TooSmall` when `w < MinCols || h < MinRows`. All other fields are zero in that case.
- `Tier = TierWide` when `w >= WideMinCols`, else `TierCompact`.
- `PanelW = WidePanelW` on wide, `min(CompactPanelW, w - BoardBoxW - 1)` on compact.
- `NextCount = 5` on wide, `3` on compact.
- Height cascade (§49.3 order, title first to go): `ShowTitle = h >= 27`, `ShowMission = h >= 26`, `ShowStatLabels = h >= 25`. Board and controls always present.
- Vertical stack, in order: title row (if shown), board box (22 rows), mission row (if shown), controls row. Total height `used`; `BoardY = (h - used)/2 + titleRows`, floored at 0, so the block is vertically centered with any spare row biased to the top. `TitleY = BoardY - titleRows`, `MissionY = BoardY + BoardBoxH` (when shown), `ControlsY = h - 1`.
- Horizontal: wide total `WidePanelW + 1 + BoardBoxW + 1 + WidePanelW = 48`; compact total `BoardBoxW + 1 + PanelW`. `BoardX` centers the total block: `BoardX = (w-total)/2 + leadingPanel`, never negative. So the board never stretches on a huge terminal (Review Focus 3).

- [ ] **Step 1: Write the failing tests**

```go
func TestComputeRejectsBelowMinimum(t *testing.T) {
	for _, sz := range [][2]int{{0, 0}, {1, 1}, {39, 40}, {80, 23}, {-5, -5}} {
		if l := Compute(sz[0], sz[1]); !l.TooSmall {
			t.Errorf("Compute(%d,%d).TooSmall = false, want true", sz[0], sz[1])
		}
	}
	if l := Compute(MinCols, MinRows); l.TooSmall {
		t.Errorf("Compute(%d,%d) should be usable", MinCols, MinRows)
	}
}

func TestTiersAndNextCount(t *testing.T) {
	if l := Compute(40, 30); l.Tier != TierCompact || l.NextCount != 3 {
		t.Errorf("40 cols: tier %v next %d, want compact/3", l.Tier, l.NextCount)
	}
	if l := Compute(56, 30); l.Tier != TierWide || l.NextCount != 5 {
		t.Errorf("56 cols: tier %v next %d, want wide/5", l.Tier, l.NextCount)
	}
	if l := Compute(55, 30); l.Tier != TierCompact {
		t.Error("55 cols should still be compact")
	}
}

func TestHeightDropOrderIsTitleThenMissionThenLabels(t *testing.T) {
	cases := []struct {
		h                             int
		title, mission, labels        bool
	}{
		{30, true, true, true},
		{27, true, true, true},
		{26, false, true, true},
		{25, false, false, true},
		{24, false, false, false},
	}
	for _, c := range cases {
		l := Compute(80, c.h)
		if l.ShowTitle != c.title || l.ShowMission != c.mission || l.ShowStatLabels != c.labels {
			t.Errorf("h=%d: title=%v mission=%v labels=%v, want %v/%v/%v",
				c.h, l.ShowTitle, l.ShowMission, l.ShowStatLabels, c.title, c.mission, c.labels)
		}
	}
}

func TestBoardFitsInsideTheScreenAtEverySize(t *testing.T) {
	for w := MinCols; w <= 200; w++ {
		for h := MinRows; h <= 60; h++ {
			l := Compute(w, h)
			if l.TooSmall {
				t.Fatalf("Compute(%d,%d) unexpectedly too small", w, h)
			}
			if l.BoardX < 0 || l.BoardX+BoardBoxW > w {
				t.Fatalf("Compute(%d,%d): board spans x %d..%d", w, h, l.BoardX, l.BoardX+BoardBoxW)
			}
			if l.BoardY < 0 || l.BoardY+BoardBoxH > h {
				t.Fatalf("Compute(%d,%d): board spans y %d..%d", w, h, l.BoardY, l.BoardY+BoardBoxH)
			}
			if l.ControlsY >= h || l.ControlsY < l.BoardY+BoardBoxH-1 {
				t.Fatalf("Compute(%d,%d): ControlsY %d is not below the board", w, h, l.ControlsY)
			}
			if l.RightPanelX+l.PanelW > w {
				t.Fatalf("Compute(%d,%d): right panel runs off the screen", w, h)
			}
		}
	}
}

// Review Focus 3: the board must not stretch or drift on a huge terminal.
func TestHugeTerminalKeepsBoardCenteredAndFixedWidth(t *testing.T) {
	l := Compute(300, 100)
	if l.BoardX < 100 || l.BoardX > 200 {
		t.Errorf("BoardX = %d, want the board roughly centered in 300 columns", l.BoardX)
	}
	gapLeft := l.BoardX - (l.LeftPanelX + l.PanelW)
	if gapLeft < 0 || gapLeft > 4 {
		t.Errorf("left panel sits %d columns from the board; panels must hug the board", gapLeft)
	}
}

func TestPanelsDoNotOverlapTheBoard(t *testing.T) {
	for _, w := range []int{40, 48, 56, 80, 120} {
		l := Compute(w, 30)
		if l.Tier == TierWide && l.LeftPanelX+l.PanelW > l.BoardX {
			t.Errorf("w=%d: left panel overlaps the board", w)
		}
		if l.RightPanelX < l.BoardX+BoardBoxW {
			t.Errorf("w=%d: right panel (x=%d) overlaps the board ending at %d", w, l.RightPanelX, l.BoardX+BoardBoxW)
		}
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'Compute|Tier|Height|Board|Huge|Panels' -v`
Expected: FAIL — `undefined: Compute`.

- [ ] **Step 3: Implement `layout.go`**

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS. If `TestBoardFitsInsideTheScreenAtEverySize` fails at one specific size, fix the arithmetic — do not relax the test.

- [ ] **Step 5: Commit**

```bash
git add internal/render/layout.go internal/render/layout_test.go
git commit -m "feat(render): adaptive layout with pinned small-terminal drop order"
```

---

### Task 5: Board rendering and the first golden

**Files:**
- Create: `internal/render/board.go`
- Modify: `internal/render/render.go` (add `Frame`, `Render`)
- Test: `internal/render/render_test.go`, `internal/render/testdata/`

**Interfaces:**
- Consumes: `Canvas`, `Palette`, `Glyphs`, `Layout`, `game.Game`.
- Produces:
  ```go
  type OverlayKind int
  const (
      OverlayNone OverlayKind = iota
      OverlayPause
      OverlayHelp
      OverlayGameOver
      OverlayTooSmall
  )

  type Frame struct {
      Game     *game.Game
      W, H     int
      Mode     Mode
      Overlay  OverlayKind
      Seed     int64
      Mission  string        // mission-control text, without the prefix
      Elapsed  time.Duration // since program start; drives the border cycle
      HelpView string        // pre-rendered help body from bubbles/help (Task 7)
  }
  func Render(f Frame) string

  // board.go
  func drawBoard(c *Canvas, l Layout, f Frame, p Palette, g Glyphs)
  ```

Board drawing order (§37 steps 3–7, with FX steps deferred to plan 3): border box, locked cells, ghost piece, active piece. Ghost is drawn before the active piece and only into cells that are `Empty` on the board, so it can never obscure locked blocks (§10). The active piece is drawn last, so nothing can obscure it (§44).

Border phase comes from `Elapsed`: `phase = math.Mod(Elapsed.Seconds()/12, 1)` — one full trip round the §25 ramp every 12 seconds, i.e. subtle.

- [ ] **Step 1: Write the golden-test harness and the wide-layout test**

```go
// fixtureGame builds a deterministic mid-game state: a seeded game, a canned
// action script, a held piece and a partly built stack.
func fixtureGame(t *testing.T) *game.Game {
	t.Helper()
	g := game.New(7)
	g.Input(game.ActionHold)
	script := []game.Action{
		game.ActionLeft, game.ActionLeft, game.ActionLeft, game.ActionHardDrop,
		game.ActionRight, game.ActionRight, game.ActionRotateCW, game.ActionHardDrop,
		game.ActionLeft, game.ActionHardDrop,
		game.ActionRotateCCW, game.ActionRight, game.ActionRight, game.ActionRight, game.ActionHardDrop,
	}
	for _, a := range script {
		g.Input(a)
		g.Advance(50 * time.Millisecond)
	}
	return g
}

func goldenCheck(t *testing.T, name, got string) {
	t.Helper()
	path := filepath.Join("testdata", name+".golden")
	if *update {
		if err := os.MkdirAll("testdata", 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(got), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	want, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("%v (run: go test ./internal/render/ -update)", err)
	}
	if got != string(want) {
		t.Errorf("%s golden mismatch.\n--- got ---\n%s\n--- want ---\n%s", name, got, want)
	}
}

var update = flag.Bool("update", false, "rewrite golden files")

func renderPlain(f Frame) string { return stripANSI(Render(f)) }

func TestGoldenWideLayout(t *testing.T) {
	f := Frame{Game: fixtureGame(t), W: 80, H: 30, Mode: ModeFull, Seed: 7, Mission: "NOMINALISH"}
	goldenCheck(t, "wide", renderPlain(f))
}

func TestBoardBoxHasCorrectDimensions(t *testing.T) {
	f := Frame{Game: fixtureGame(t), W: 80, H: 30, Mode: ModeFull, Seed: 7}
	l := Compute(f.W, f.H)
	lines := strings.Split(renderPlain(f), "\n")
	top := []rune(padTo(lines[l.BoardY], f.W))
	g := GlyphsFor(ModeFull)
	if top[l.BoardX] != g.BorderTL || top[l.BoardX+BoardBoxW-1] != g.BorderTR {
		t.Errorf("board top row = %q, want corners at %d and %d", lines[l.BoardY], l.BoardX, l.BoardX+BoardBoxW-1)
	}
	bottom := []rune(padTo(lines[l.BoardY+BoardBoxH-1], f.W))
	if bottom[l.BoardX] != g.BorderBL {
		t.Error("board bottom-left corner is missing")
	}
	for y := l.BoardY + 1; y < l.BoardY+BoardBoxH-1; y++ {
		row := []rune(padTo(lines[y], f.W))
		if row[l.BoardX] != g.BorderV || row[l.BoardX+BoardBoxW-1] != g.BorderV {
			t.Errorf("row %d is missing a side border: %q", y, lines[y])
		}
	}
}

// padTo right-pads a line so indexing by column is safe after trailing-blank trimming.
func padTo(s string, w int) string {
	r := []rune(stripANSI(s))
	for len(r) < w {
		r = append(r, ' ')
	}
	return string(r)
}

func TestGhostIsDrawnAtTheLandingRowAndNotOverLockedCells(t *testing.T) {
	g := fixtureGame(t)
	f := Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7}
	l := Compute(f.W, f.H)
	lines := strings.Split(renderPlain(f), "\n")
	ghostY := g.GhostY()
	var found bool
	for _, c := range (game.Piece{Kind: g.Active.Kind, Rotation: g.Active.Rotation, X: g.Active.X, Y: ghostY}).Cells() {
		if c[1] < game.HiddenRows {
			continue
		}
		row := []rune(padTo(lines[l.BoardY+1+c[1]-game.HiddenRows], f.W))
		col := l.BoardX + 1 + c[0]*CellCols
		got := row[col]
		if got == '░' {
			found = true
		}
		if g.Board.At(c[0], c[1]) != game.Empty && got == '░' {
			t.Errorf("ghost drawn over a locked cell at board (%d,%d)", c[0], c[1])
		}
	}
	if !found && ghostY != g.Active.Y {
		t.Error("no ghost cells were rendered at the landing row")
	}
}

func TestActivePieceIsRenderedAtItsPosition(t *testing.T) {
	g := fixtureGame(t)
	f := Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7}
	l := Compute(f.W, f.H)
	lines := strings.Split(renderPlain(f), "\n")
	for _, c := range g.Active.Cells() {
		if c[1] < game.HiddenRows {
			continue // hidden rows are not rendered
		}
		row := []rune(padTo(lines[l.BoardY+1+c[1]-game.HiddenRows], f.W))
		col := l.BoardX + 1 + c[0]*CellCols
		if row[col] != '█' {
			t.Errorf("active cell (%d,%d) renders %q at column %d, want █", c[0], c[1], row[col], col)
		}
	}
}

func TestRenderDoesNotMutateGameState(t *testing.T) {
	g := fixtureGame(t)
	before := *g
	Render(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7})
	if g.Board != before.Board || g.Active != before.Active || g.Score != before.Score || g.Combo != before.Combo {
		t.Error("Render mutated game state (design.md §37)")
	}
}

func TestHiddenRowsAreNotRendered(t *testing.T) {
	g := game.New(7)
	g.Board.Set(0, 0, game.I) // hidden row
	f := Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7}
	l := Compute(f.W, f.H)
	lines := strings.Split(renderPlain(f), "\n")
	first := []rune(padTo(lines[l.BoardY+1], f.W))
	if first[l.BoardX+1] == '█' {
		t.Error("a cell in a hidden spawn row was rendered inside the board")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'Golden|Board|Ghost|Active|Mutate|Hidden' -v`
Expected: FAIL — `undefined: Render`.

- [ ] **Step 3: Implement `Frame`/`Render` and `drawBoard`**

`Render` computes the layout, allocates a `Canvas(f.W, f.H)`, draws the too-small notice and returns early when `l.TooSmall`, otherwise draws the board (HUD comes in Task 6), then any overlay, then returns `c.String()`. Draw the too-small notice now, centered, matching §31:

```
THIS UNIVERSE IS TOO SMALL

resize terminal to continue

current: 34 × 19
needed: approximately 40 × 24
```

(Use `x` rather than `×` when `Mode == ModeASCII`.)

- [ ] **Step 4: Generate the golden and verify**

Run: `go test ./internal/render/ -update && go test ./internal/render/ -v`
Expected: PASS. **Read `testdata/wide.golden`.** The board must look like a board: a 22-wide box, a stack at the bottom, an active piece near the top. If it does not, fix the renderer before committing the golden.

- [ ] **Step 5: Commit**

```bash
git add internal/render/board.go internal/render/render.go internal/render/render_test.go internal/render/testdata
git commit -m "feat(render): board box, locked cells, ghost, active piece and wide golden"
```

---

### Task 6: HUD and the full layout goldens

**Files:**
- Create: `internal/render/hud.go`
- Modify: `internal/render/render.go`
- Test: `internal/render/hud_test.go`, `internal/render/testdata/`

**Interfaces:**
- Consumes: Task 5's `Frame`, `Layout`.
- Produces:
  ```go
  func drawTitle(c *Canvas, l Layout, f Frame, p Palette, g Glyphs)
  func drawHold(c *Canvas, x, y int, f Frame, p Palette, g Glyphs)
  func drawNext(c *Canvas, x, y int, f Frame, p Palette, g Glyphs)
  func drawStats(c *Canvas, x, y int, f Frame, l Layout, p Palette)
  func drawMission(c *Canvas, l Layout, f Frame, p Palette, g Glyphs)
  func drawControls(c *Canvas, l Layout, f Frame, p Palette)
  // MiniPiece renders kind k as up to 4 rows of 2-column cells into the canvas.
  func drawMiniPiece(c *Canvas, x, y int, k game.PieceKind, p Palette, g Glyphs)
  ```

Pinned content and formats (§4 mockup for intent, these strings are binding):

- Title row, only when `ShowTitle`: `╭─ ✦ COSMIC TETRIS ` + `─` fill + ` LOCAL UNIVERSE %04X ─╮`, exactly `ScreenW` columns, where `%04X` is `uint16(f.Seed)`. In ASCII mode use `+-` corners and `-` fill and drop the `✦`.
- Stats: label rows `SCORE` / `LINES` / `LEVEL` (only when `ShowStatLabels`) above value rows `%08d` / `%03d` / `%02d`. When labels are hidden, only the value rows are drawn.
- `HOLD` panel: the label plus the held piece, or an empty well when `Hold` is nil.
- `NEXT` panel: the label plus `l.NextCount` upcoming kinds from `Game.Next`, each in its own 2-row slot.
- On `TierWide`: HOLD and stats in the left panel, NEXT in the right panel. On `TierCompact`: one right panel, top to bottom — `NEXT` (3 pieces), `HOLD` (one slot), then stats.
- Mission row, only when `ShowMission`: `<MissionPrefix> MISSION CONTROL: <Mission>`, truncated to `ScreenW`, `Mission` defaulting to `NOMINALISH` when empty.
- Controls row, longest variant that fits `ScreenW`:
  1. `←→ move   ↑ rotate   ↓ descend   SPACE YEET   C hold   ? help`
  2. `←→ move  ↑ rot  SPACE yeet  C hold  ? help`
  3. `? help`
  In ASCII mode substitute `<>` for `←→` and `^` for `↑`, `v` for `↓`.

- [ ] **Step 1: Write the failing tests**

```go
func TestStatsShowFormattedValues(t *testing.T) {
	g := fixtureGame(t)
	g.Score, g.Lines, g.Level = 129340, 42, 7
	out := renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7})
	for _, want := range []string{"SCORE", "00129340", "LINES", "042", "LEVEL", "07"} {
		if !strings.Contains(out, want) {
			t.Errorf("output is missing %q", want)
		}
	}
}

func TestStatLabelsDropAtTightHeights(t *testing.T) {
	g := fixtureGame(t)
	g.Score, g.Lines, g.Level = 129340, 42, 7
	out := renderPlain(Frame{Game: g, W: 80, H: 24, Mode: ModeFull, Seed: 7})
	if strings.Contains(out, "LINES") {
		t.Error("stat labels should be dropped at h=24 (design.md §49.3)")
	}
	if !strings.Contains(out, "042") {
		t.Error("stat values must survive when labels are dropped")
	}
}

func TestTitleAndMissionDropInOrder(t *testing.T) {
	g := fixtureGame(t)
	full := renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, Mission: "NOMINALISH"})
	if !strings.Contains(full, "COSMIC TETRIS") || !strings.Contains(full, "LOCAL UNIVERSE 0007") {
		t.Errorf("title row missing or mislabelled:\n%s", full)
	}
	if !strings.Contains(full, "MISSION CONTROL: NOMINALISH") {
		t.Error("mission row missing at h=30")
	}
	noTitle := renderPlain(Frame{Game: g, W: 80, H: 26, Mode: ModeFull, Seed: 7, Mission: "NOMINALISH"})
	if strings.Contains(noTitle, "COSMIC TETRIS") {
		t.Error("title should drop first, at h=26")
	}
	if !strings.Contains(noTitle, "MISSION CONTROL") {
		t.Error("mission should still be present at h=26")
	}
	noMission := renderPlain(Frame{Game: g, W: 80, H: 25, Mode: ModeFull, Seed: 7, Mission: "NOMINALISH"})
	if strings.Contains(noMission, "MISSION CONTROL") {
		t.Error("mission should drop second, at h=25")
	}
}

func TestNextQueueLengthPerTier(t *testing.T) {
	g := fixtureGame(t)
	wide := renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7})
	compact := renderPlain(Frame{Game: g, W: 44, H: 30, Mode: ModeFull, Seed: 7})
	if !strings.Contains(wide, "NEXT") || !strings.Contains(compact, "NEXT") {
		t.Fatal("NEXT label missing")
	}
	// Count rendered mini-piece rows to the right of the board in each mode.
	if countCellRows(wide, Compute(80, 30)) <= countCellRows(compact, Compute(44, 30)) {
		t.Error("wide layout should show more upcoming pieces than compact (5 vs 3)")
	}
}

// countCellRows counts rows right of the board that contain at least one block glyph.
func countCellRows(out string, l Layout) int {
	n := 0
	for _, line := range strings.Split(out, "\n") {
		r := []rune(line)
		for x := l.BoardX + BoardBoxW; x < len(r); x++ {
			if r[x] == '█' {
				n++
				break
			}
		}
	}
	return n
}

func TestNextNeverStacksAboveOrBelowTheBoard(t *testing.T) {
	g := fixtureGame(t)
	l := Compute(40, 24)
	lines := strings.Split(renderPlain(Frame{Game: g, W: 40, H: 24, Mode: ModeFull, Seed: 7}), "\n")
	for y, line := range lines {
		if y >= l.BoardY && y < l.BoardY+BoardBoxH {
			continue
		}
		if strings.Contains(line, "NEXT") {
			t.Errorf("NEXT appears on row %d, outside the board's rows (design.md §49.3)", y)
		}
	}
}

func TestControlsRowShrinksWithWidth(t *testing.T) {
	g := fixtureGame(t)
	for _, w := range []int{80, 48, 40} {
		out := renderPlain(Frame{Game: g, W: w, H: 30, Mode: ModeFull, Seed: 7})
		if !strings.Contains(out, "? help") {
			t.Errorf("w=%d: controls row must always offer '? help'", w)
		}
		for _, line := range strings.Split(out, "\n") {
			if lipgloss.Width(line) > w {
				t.Errorf("w=%d: line %q is %d columns wide", w, line, lipgloss.Width(line))
			}
		}
	}
}

func TestHoldPanelShowsTheHeldPiece(t *testing.T) {
	g := fixtureGame(t)
	if g.Hold == nil {
		t.Fatal("fixture should have a held piece")
	}
	out := renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7})
	if !strings.Contains(out, "HOLD") {
		t.Error("HOLD label missing")
	}
	l := Compute(80, 30)
	var found bool
	for _, line := range strings.Split(out, "\n") {
		r := []rune(padTo(line, 80))
		for x := l.LeftPanelX; x < l.LeftPanelX+l.PanelW && x < len(r); x++ {
			if r[x] == '█' {
				found = true
			}
		}
	}
	if !found {
		t.Error("no held piece glyphs found in the left panel")
	}
}

func TestGoldenLayouts(t *testing.T) {
	g := fixtureGame(t)
	g.Score, g.Lines, g.Level = 129340, 42, 7
	cases := []struct {
		name string
		w, h int
	}{
		{"wide", 80, 30},
		{"medium", 50, 26},
		{"small", 40, 24},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			goldenCheck(t, c.name, renderPlain(Frame{
				Game: g, W: c.w, H: c.h, Mode: ModeFull, Seed: 7, Mission: "GRAVITY REMAINS MOSTLY LEGAL",
			}))
		})
	}
}

func TestGoldenTooSmall(t *testing.T) {
	goldenCheck(t, "toosmall", renderPlain(Frame{
		Game: fixtureGame(t), W: 34, H: 19, Mode: ModeFull, Seed: 7, Overlay: OverlayTooSmall,
	}))
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'Stats|Title|Next|Controls|Hold|Golden' -v`
Expected: FAIL — the HUD is not drawn yet; `wide.golden` from Task 5 will also mismatch.

- [ ] **Step 3: Implement `hud.go` and wire it into `Render`**

- [ ] **Step 4: Regenerate the goldens and read them**

Run: `go test ./internal/render/ -update && go test ./internal/render/ -v`
Expected: PASS. **Open all four goldens.** Check: nothing overlaps the board, the panels sit beside it, the small golden fits in 40×24, the too-small notice reports `current: 34 × 19`. Fix and regenerate if not.

- [ ] **Step 5: Commit**

```bash
git add internal/render/hud.go internal/render/render.go internal/render/hud_test.go internal/render/testdata
git commit -m "feat(render): HUD panels, title, mission and controls rows with layout goldens"
```

---

### Task 7: Bubble Tea wiring — keys, frame clock, pause, restart, resize

**Files:**
- Create: `internal/app/keys.go`, `internal/app/update.go`
- Modify: `internal/app/model.go`
- Test: `internal/app/update_test.go`, `internal/app/keys_test.go`

**Interfaces:**
- Consumes: `render.Render`, `render.DetectMode`, `game.Action`, `FrameMsg`.
- Produces:
  ```go
  // keys.go
  type KeyMap struct {
      Left, Right, SoftDrop, RotateCW, RotateCCW, HardDrop,
      Hold, Pause, Restart, Help, Quit key.Binding
  }
  func DefaultKeyMap() KeyMap
  func (k KeyMap) ShortHelp() []key.Binding
  func (k KeyMap) FullHelp() [][]key.Binding
  // ActionFor maps a pressed key to a game action.
  func (k KeyMap) ActionFor(msg tea.KeyPressMsg) (game.Action, bool)

  // model.go additions
  func (m *Model) SetSize(w, h int)
  func (m *Model) restart()
  ```

Bindings (§8, including the WASD aliases):

| Binding | Keys |
|---|---|
| Left | `left`, `h`, `a` |
| Right | `right`, `l`, `d` |
| SoftDrop | `down`, `j`, `s` |
| RotateCW | `up`, `k`, `x`, `w` |
| RotateCCW | `z` |
| HardDrop | `space` (`" "`) |
| Hold | `c` |
| Pause | `p` |
| Restart | `r` |
| Help | `?` |
| Quit | `q`, `esc`, `ctrl+c` |

Pinned `Update` behavior:

- `tea.WindowSizeMsg`: store `width`/`height`. **Do not touch game state** — a resize below the minimum only changes what `View` draws (Review Focus 5).
- `FrameMsg`: `dt := msg.Now.Sub(m.lastFrame)`, clamped to `[0, 100ms]` so a suspended terminal cannot dump seconds of gravity into one call; `m.lastFrame = msg.Now`; when `m.state == StatePlaying`, `evts := m.game.Advance(dt)` and transition to `StateGameOver` if any event is `game.GameOver`; always return `frameTick()` so the clock never dies.
- A key handled by `ActionFor` is applied **immediately** via `m.game.Input(...)` — never queued for the next tick — and only when `m.state == StatePlaying`.
- `Pause` toggles `StatePlaying` ↔ `StatePaused`. `Help` toggles `m.showHelp` in any state. `Restart` calls `m.restart()` from any state. `Quit` returns `tea.Quit`.
- `restart()`: when `opts.SeedFixed`, reuse `opts.Seed`; otherwise advance the seed with `seed = seed*6364136223846793005 + 1442695040888963407` and store it back, so consecutive runs differ while a `--seed` run stays reproducible.
- Any other message type is ignored (Review Focus 4).
- `View()`: when `width == 0 || height == 0`, return `""`. Otherwise build a `render.Frame`, mapping `m.state` and `m.showHelp` to an `OverlayKind` (help wins over pause, which wins over game over), and pass `render.Compute`-driven overlay `OverlayTooSmall` implicitly via `Render`.

- [ ] **Step 1: Write the failing key tests**

```go
func keyPress(s string) tea.KeyPressMsg { /* construct per your bubbletea v2 version */ }

func TestActionForCoversEveryDocumentedKey(t *testing.T) {
	k := DefaultKeyMap()
	cases := map[string]game.Action{
		"left": game.ActionLeft, "h": game.ActionLeft, "a": game.ActionLeft,
		"right": game.ActionRight, "l": game.ActionRight, "d": game.ActionRight,
		"down": game.ActionSoftDrop, "j": game.ActionSoftDrop, "s": game.ActionSoftDrop,
		"up": game.ActionRotateCW, "k": game.ActionRotateCW, "x": game.ActionRotateCW, "w": game.ActionRotateCW,
		"z": game.ActionRotateCCW,
		" ": game.ActionHardDrop,
		"c": game.ActionHold,
	}
	for keyStr, want := range cases {
		got, ok := k.ActionFor(keyPress(keyStr))
		if !ok {
			t.Errorf("key %q produced no action", keyStr)
			continue
		}
		if got != want {
			t.Errorf("key %q -> %v, want %v", keyStr, got, want)
		}
	}
	for _, keyStr := range []string{"p", "r", "?", "q", "F", "1"} {
		if _, ok := k.ActionFor(keyPress(keyStr)); ok {
			t.Errorf("key %q should not map to a game action", keyStr)
		}
	}
}
```

- [ ] **Step 2: Write the failing update tests**

```go
func TestKeyPressAppliesImmediatelyWithoutATick(t *testing.T) {
	m := New(Options{Seed: 7})
	m.SetSize(80, 30)
	x := m.game.Active.X
	m.Update(keyPress("left"))
	if m.game.Active.X != x-1 {
		t.Errorf("X = %d, want %d — input must not wait for a frame tick", m.game.Active.X, x-1)
	}
}

func TestFrameMsgAdvancesGameAndReschedules(t *testing.T) {
	m := New(Options{Seed: 7})
	m.SetSize(80, 30)
	start := time.Now()
	m.Update(FrameMsg{Now: start})
	_, cmd := m.Update(FrameMsg{Now: start.Add(game.GravityInterval(1) + 10*time.Millisecond)})
	if cmd == nil {
		t.Error("every FrameMsg must schedule the next tick")
	}
	if m.game.GravityAccumulator == 0 && m.game.Active.Y == game.SpawnY {
		t.Error("elapsed time was not passed to the engine")
	}
}

func TestFrameDtIsClamped(t *testing.T) {
	m := New(Options{Seed: 7})
	m.SetSize(80, 30)
	start := time.Now()
	m.Update(FrameMsg{Now: start})
	m.Update(FrameMsg{Now: start.Add(30 * time.Second)}) // terminal was suspended
	if m.game.Lines > 0 || m.game.Score > 500 {
		t.Errorf("a 30s stall dumped %d lines / %d points into the game; dt must be clamped", m.game.Lines, m.game.Score)
	}
}

func TestPauseFreezesTheGame(t *testing.T) {
	m := New(Options{Seed: 7})
	m.SetSize(80, 30)
	m.Update(keyPress("p"))
	if m.state != StatePaused {
		t.Fatalf("state = %v, want StatePaused", m.state)
	}
	before := *m.game
	start := time.Now()
	m.Update(FrameMsg{Now: start})
	m.Update(FrameMsg{Now: start.Add(5 * time.Second)})
	if m.game.Active != before.Active || m.game.GravityAccumulator != before.GravityAccumulator {
		t.Error("game advanced while paused")
	}
	m.Update(keyPress("left"))
	if m.game.Active.X != before.Active.X {
		t.Error("input was accepted while paused")
	}
	m.Update(keyPress("p"))
	if m.state != StatePlaying {
		t.Error("p should resume")
	}
}

func TestRestartResetsTheGame(t *testing.T) {
	m := New(Options{Seed: 7, SeedFixed: true})
	m.SetSize(80, 30)
	for i := 0; i < 5; i++ {
		m.Update(keyPress(" "))
	}
	if m.game.Score == 0 {
		t.Fatal("setup: expected some score from hard drops")
	}
	m.Update(keyPress("r"))
	if m.game.Score != 0 || m.game.Lines != 0 || m.game.Over {
		t.Errorf("after restart: score %d lines %d over %v", m.game.Score, m.game.Lines, m.game.Over)
	}
	if m.state != StatePlaying {
		t.Errorf("state = %v, want StatePlaying", m.state)
	}
	if m.game.Seed != 7 {
		t.Errorf("--seed run should restart on the same seed, got %d", m.game.Seed)
	}
}

func TestRestartWithoutFixedSeedChangesTheSeed(t *testing.T) {
	m := New(Options{Seed: 7, SeedFixed: false})
	m.SetSize(80, 30)
	m.Update(keyPress("r"))
	if m.game.Seed == 7 {
		t.Error("without --seed, a restart should pick a new seed")
	}
}

func TestGameOverTransition(t *testing.T) {
	m := New(Options{Seed: 7})
	m.SetSize(80, 30)
	for i := 0; i < 500 && m.state == StatePlaying; i++ {
		m.Update(keyPress(" ")) // hard drop repeatedly until the stack tops out
	}
	if m.state != StateGameOver {
		t.Fatalf("state = %v after 500 hard drops, want StateGameOver", m.state)
	}
	if !strings.Contains(stripANSI(m.View()), "UNIVERSE EXPIRED") {
		t.Error("game over view should show the UNIVERSE EXPIRED card")
	}
	m.Update(keyPress("r"))
	if m.state != StatePlaying {
		t.Error("r should reboot the universe from the game over screen")
	}
}

// Review Focus 4: stray messages must be inert.
func TestUnknownMessagesAreIgnored(t *testing.T) {
	m := New(Options{Seed: 7})
	m.SetSize(80, 30)
	before := *m.game
	for _, msg := range []tea.Msg{
		tea.MouseWheelMsg{}, tea.PasteMsg("qqqq"), struct{ Nonsense int }{42}, nil,
	} {
		m.Update(msg)
	}
	if m.game.Active != before.Active || m.game.Score != before.Score || m.state != StatePlaying {
		t.Error("a stray message changed game state")
	}
}

// Review Focus 5: shrinking below the minimum and growing back must not disturb the game.
func TestResizeBelowMinimumPreservesGameState(t *testing.T) {
	m := New(Options{Seed: 7})
	m.SetSize(80, 30)
	m.Update(keyPress(" "))
	before := *m.game
	m.Update(tea.WindowSizeMsg{Width: 20, Height: 8})
	small := stripANSI(m.View())
	if !strings.Contains(small, "TOO SMALL") {
		t.Errorf("expected the too-small notice at 20x8:\n%s", small)
	}
	m.Update(tea.WindowSizeMsg{Width: 0, Height: 0})
	_ = m.View()
	m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	if m.game.Board != before.Board || m.game.Score != before.Score || m.state != StatePlaying {
		t.Error("resizing below the minimum and back disturbed the game")
	}
}

func TestQuitKeysReturnQuit(t *testing.T) {
	for _, keyStr := range []string{"q", "esc", "ctrl+c"} {
		m := New(Options{Seed: 7})
		m.SetSize(80, 30)
		if _, cmd := m.Update(keyPress(keyStr)); cmd == nil {
			t.Errorf("key %q should return a quit command", keyStr)
		}
	}
}
```

`stripANSI` is needed in `internal/app` tests too — add a copy in `internal/app/strip_test.go` (test-only duplication of four lines is cheaper than an exported helper).

- [ ] **Step 3: Run tests to verify they fail**

Run: `go test ./internal/app/ -v`
Expected: FAIL — `undefined: DefaultKeyMap`.

- [ ] **Step 4: Implement `keys.go`, `update.go` and the real `View`**

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 6: Play it**

Run: `go build ./cmd/cosmic-tetris && ./cosmic-tetris --seed 1234`
Check by hand: pieces fall; arrows and `hjkl` move; `space` slams; `c` holds; `p` pauses; `r` restarts; ghost tracks the landing row; the next queue advances; resizing the window does not crash; `q` exits. Holding an arrow key down repeats the movement (terminal auto-repeat delivers one key message per repeat — no custom repeat logic is needed or wanted).

- [ ] **Step 7: Commit**

```bash
git add internal/app
git commit -m "feat(app): 60Hz frame clock, immediate input, pause, restart, resize"
```

---

### Task 8: Pause, help and game-over overlays

**Files:**
- Modify: `internal/render/render.go`, `internal/app/model.go`
- Test: `internal/render/overlay_test.go`, `internal/render/testdata/`

**Interfaces:**
- Consumes: `OverlayKind` (Task 5), `bubbles/v2/help`.
- Produces:
  ```go
  func drawOverlay(c *Canvas, l Layout, f Frame, p Palette, g Glyphs)
  // Model.helpBody renders the §39 flight manual using bubbles/help + KeyMap.
  func (m *Model) helpBody() string
  ```

Overlays are centered boxes drawn last, over everything. Pinned copy:

- Pause (§30): title `TEMPORAL SUSPENSION`, body `SPACE IS PAUSED`, footer `p  resume`.
- Game over (§28 final card): `UNIVERSE EXPIRED`, then `SCORE  <comma-grouped>`, `LINES  <n>`, `LEVEL  <n>`, then `r  REBOOT UNIVERSE` and `q  ACCEPT COSMIC DEATH`, plus the subtitle `CAUSE: EXCESSIVE GEOMETRY`.
- Help (§39): header `FLIGHT MANUAL`, the key rows exactly as §39 lists them, ending with `?  close this nonsense`.

Box borders use the rounded set in unicode modes and `+-|` in ASCII.

- [ ] **Step 1: Write the failing tests**

```go
func TestPauseOverlay(t *testing.T) {
	out := renderPlain(Frame{Game: fixtureGame(t), W: 80, H: 30, Mode: ModeFull, Seed: 7, Overlay: OverlayPause})
	for _, want := range []string{"TEMPORAL SUSPENSION", "SPACE IS PAUSED", "p  resume"} {
		if !strings.Contains(out, want) {
			t.Errorf("pause overlay missing %q", want)
		}
	}
	goldenCheck(t, "pause", out)
}

func TestGameOverOverlay(t *testing.T) {
	g := fixtureGame(t)
	g.Score, g.Lines, g.Level = 483200, 127, 13
	out := renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, Overlay: OverlayGameOver})
	for _, want := range []string{"UNIVERSE EXPIRED", "483,200", "127", "13", "REBOOT UNIVERSE", "ACCEPT COSMIC DEATH", "CAUSE: EXCESSIVE GEOMETRY"} {
		if !strings.Contains(out, want) {
			t.Errorf("game over overlay missing %q", want)
		}
	}
	goldenCheck(t, "gameover", out)
}

func TestHelpOverlay(t *testing.T) {
	body := strings.Join([]string{
		"← → / h l       move spacecraft",
		"↓ / j           accelerate doom",
		"↑ / k / x       rotate geometry",
		"z               rotate other way",
		"SPACE           YEET",
		"c               quantum storage",
		"p               suspend spacetime",
		"r               reboot universe",
		"q               abandon mission",
		"?               close this nonsense",
	}, "\n")
	out := renderPlain(Frame{Game: fixtureGame(t), W: 80, H: 30, Mode: ModeFull, Seed: 7, Overlay: OverlayHelp, HelpView: body})
	for _, want := range []string{"FLIGHT MANUAL", "YEET", "quantum storage", "close this nonsense"} {
		if !strings.Contains(out, want) {
			t.Errorf("help overlay missing %q", want)
		}
	}
	goldenCheck(t, "help", out)
}

func TestOverlaysStayInsideTheScreen(t *testing.T) {
	for _, ov := range []OverlayKind{OverlayPause, OverlayHelp, OverlayGameOver} {
		for _, sz := range [][2]int{{40, 24}, {46, 25}, {80, 30}, {200, 60}} {
			f := Frame{Game: fixtureGame(t), W: sz[0], H: sz[1], Mode: ModeFull, Seed: 7, Overlay: ov, HelpView: "a\nb\nc"}
			lines := strings.Split(renderPlain(f), "\n")
			if len(lines) > sz[1] {
				t.Errorf("overlay %v at %dx%d produced %d lines", ov, sz[0], sz[1], len(lines))
			}
			for _, line := range lines {
				if lipgloss.Width(line) > sz[0] {
					t.Errorf("overlay %v at %dx%d: line %q is %d wide", ov, sz[0], sz[1], line, lipgloss.Width(line))
				}
			}
		}
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run Overlay -v`
Expected: FAIL — overlays are not drawn.

- [ ] **Step 3: Implement `drawOverlay` and `Model.helpBody`**

Build overlay boxes with `lipgloss` (border + padding + `JoinVertical`), then write the rendered lines into the canvas with `SetString` at a centered origin, clipping to the screen. `helpBody` uses `bubbles/v2/help` with `KeyMap.FullHelp()`, with the §39 descriptions as each binding's help text.

- [ ] **Step 4: Generate the goldens and verify**

Run: `go test ./internal/render/ -update && go test ./... -v`
Expected: PASS. Read `pause.golden`, `gameover.golden`, `help.golden` — each box must be intact and centered, with the board still visible around it.

- [ ] **Step 5: Commit**

```bash
git add internal/render internal/app internal/render/testdata
git commit -m "feat(render): pause, help and game over overlays with goldens"
```

---

### Task 9: ASCII mode, structural sweep, README

**Files:**
- Test: `internal/render/ascii_test.go`, `internal/render/sweep_test.go`, `internal/render/testdata/ascii.golden`
- Create: `README.md`
- Modify: `cmd/cosmic-tetris/main.go` (wire `DetectMode`)

**Interfaces:**
- Consumes: everything above.
- Produces: no new API. `--no-fx` and `--reduced-motion` are parsed and carried in `Options` but have nothing to suppress until plan 3 — assert that they are accepted and change nothing here.

- [ ] **Step 1: Write the failing ASCII and sweep tests**

```go
func TestASCIIModeUsesNoNonASCIIRunes(t *testing.T) {
	g := fixtureGame(t)
	g.Score, g.Lines, g.Level = 129340, 42, 7
	for _, ov := range []OverlayKind{OverlayNone, OverlayPause, OverlayGameOver, OverlayTooSmall} {
		out := renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeASCII, Seed: 7, Overlay: ov, Mission: "MOON NOTIFIED"})
		for i, r := range out {
			if r > unicode.MaxASCII {
				t.Fatalf("overlay %v: non-ASCII rune %q at offset %d in ASCII mode", ov, r, i)
			}
		}
	}
}

func TestASCIIModeStillRendersAPlayableBoard(t *testing.T) {
	out := renderPlain(Frame{Game: fixtureGame(t), W: 80, H: 30, Mode: ModeASCII, Seed: 7})
	if !strings.Contains(out, "[]") {
		t.Error("ASCII mode should draw pieces as []")
	}
	if !strings.Contains(out, "SCORE") || !strings.Contains(out, "NEXT") {
		t.Error("ASCII mode lost the HUD")
	}
	goldenCheck(t, "ascii", out)
}

// Review Focus 2: every size must render safely.
func TestSweepEverySizeRendersWithinBounds(t *testing.T) {
	g := fixtureGame(t)
	for w := 1; w <= 120; w++ {
		for h := 1; h <= 60; h++ {
			for _, mode := range []Mode{ModeFull, ModeASCII} {
				func() {
					defer func() {
						if r := recover(); r != nil {
							t.Fatalf("panic at %dx%d mode %v: %v", w, h, mode, r)
						}
					}()
					out := renderPlain(Frame{Game: g, W: w, H: h, Mode: mode, Seed: 7, Mission: "STRUCTURAL VIBES: QUESTIONABLE"})
					lines := strings.Split(out, "\n")
					if len(lines) > h {
						t.Fatalf("%dx%d mode %v: %d lines, want <= %d", w, h, mode, len(lines), h)
					}
					for _, line := range lines {
						if lw := lipgloss.Width(line); lw > w {
							t.Fatalf("%dx%d mode %v: line %q is %d columns wide", w, h, mode, line, lw)
						}
					}
				}()
			}
		}
	}
}

func TestSweepWithEveryOverlay(t *testing.T) {
	g := fixtureGame(t)
	for _, ov := range []OverlayKind{OverlayPause, OverlayHelp, OverlayGameOver, OverlayTooSmall} {
		for _, sz := range [][2]int{{1, 1}, {12, 6}, {39, 23}, {40, 24}, {41, 25}, {120, 60}} {
			f := Frame{Game: g, W: sz[0], H: sz[1], Mode: ModeFull, Seed: 7, Overlay: ov, HelpView: "x\ny"}
			out := renderPlain(f)
			if lines := strings.Split(out, "\n"); len(lines) > sz[1] {
				t.Errorf("overlay %v at %dx%d: %d lines", ov, sz[0], sz[1], len(lines))
			}
		}
	}
}
```

- [ ] **Step 2: Run them**

Run: `go test ./internal/render/ -run 'ASCII|Sweep' -v`
Expected: FAIL at first — expect real bugs here (off-by-one clipping, a unicode glyph leaking into ASCII mode). Fix the renderer for each failure; the sweep is the contract.

- [ ] **Step 3: Generate the ASCII golden**

Run: `go test ./internal/render/ -update && go test ./... -v`
Expected: PASS; read `ascii.golden` and confirm it is a readable game in pure ASCII.

- [ ] **Step 4: Wire `DetectMode` into main**

In `cmd/cosmic-tetris/main.go`, compute `render.DetectMode(os.Getenv("TERM"), os.Getenv("COLORTERM"), *asciiFlag)` and pass the mode through `Options` into the model. Verify by hand:

```bash
./cosmic-tetris --ascii --seed 1
./cosmic-tetris --no-fx --seed 1
./cosmic-tetris --reduced-motion --seed 1
TERM=dumb ./cosmic-tetris --seed 1
```

Expected: all four run and play. `--ascii` and `TERM=dumb` show `[]` pieces; `--no-fx` and `--reduced-motion` are accepted and behave like the default (they have nothing to suppress yet).

- [ ] **Step 5: Write `README.md`**

Cover: what it is (one paragraph, in the spirit of §48), `go build ./cmd/cosmic-tetris`, the §8 control table, the five flags from §49.5, the 40×24 minimum, and a "how it's built" paragraph naming `internal/game` (deterministic, clock-free), `internal/render` (pure), `internal/app` (Bubble Tea).

- [ ] **Step 6: Final verification**

Run: `go test -race ./... && go vet ./... && gofmt -l .`
Expected: PASS, clean, empty.

- [ ] **Step 7: Commit**

```bash
git add internal/render README.md cmd/cosmic-tetris/main.go
git commit -m "feat(render): ASCII fallback, full-size sweep tests and README"
```

---

## Done when

- `./cosmic-tetris` is a genuinely good game: pieces fall, controls respond instantly, ghost and next queue and hold all work, lines clear, gravity increases, pause and restart and quit work, game over shows the card.
- Goldens exist and pass for wide, medium, small, pause, game over, help, ASCII, too-small (§41).
- The size sweep passes: no panic, no line wider than the terminal, never more lines than rows, at every size from 1×1 to 120×60 in two modes.
- All five CLI flags are accepted; `--ascii` visibly changes the glyph set.
- `go test -race ./...` passes, `go vet` is clean, `gofmt -l .` is empty.
