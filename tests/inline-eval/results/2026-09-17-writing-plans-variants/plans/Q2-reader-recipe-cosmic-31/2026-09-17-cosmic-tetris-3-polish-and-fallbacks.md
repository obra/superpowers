# Cosmic Tetris — Plan 3: Polish and Fallbacks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship it — the boot sequence, the game-over black hole, the help overlay, terminal-capability degradation, FX that scale down on small terminals, the last flavor details, the remaining golden snapshots, and the acceptance checklist walked end to end.

**Architecture:** The two new full-screen moments (boot, game over) are app states with an elapsed-time counter, drawn by pure functions of that elapsed time — which makes them snapshot-testable and keeps them working when `--no-fx` has silenced the effect world. Capability detection happens once at startup and resolves to the same `render.Mode` the flags select, so there is exactly one degradation path. FX intensity becomes a single scalar the layout multiplies down on small terminals.

**Tech Stack:** Go 1.24, `charm.land/bubbletea/v2`, `charm.land/bubbles/v2` (key + help), `charm.land/lipgloss/v2`.

**Spec:** `design.md` (this plan implements §28–§32, §39, §41, §43, §45, §47, §48, §42 phase 5)

**Depends on:** Plans 1 and 2 complete, all tests green.

## Global Constraints

- Everything from Plan 1 and Plan 2's Global Constraints still holds, in particular: `internal/game` stays clock-free, `internal/fx` never modifies game state, shake never exceeds one cell, `gofmt -l .` prints nothing before each commit.
- The three render modes are the only degradation axis (§32): Full (truecolor + Unicode), Reduced (16 colors, simpler glyphs), ASCII (no Unicode at all). ASCII mode output must be pure ASCII — every byte < 128 (§32).
- The boot sequence is skippable by any key and never exceeds ~1 second (§29).
- Game over must not need a keystroke to advance its animation, and `R` restarts from the panel (§28, §11).
- No persistence: no score file, no config file, no network (§2, §48). Session best lives in memory only.
- Help is a toggle, not a mode that can trap the player (§39).
- The §4 mockup is intent, not geometry; the golden files are the layout contract (§49.7). Never hand-edit a golden — regenerate with `-update` and read the diff.
- No new dependencies. `go.mod` still lists exactly the three Charm modules.

## Review Focus

1. **A key pressed during the game-over collapse, before the panel appears**: `R` must not restart into a half-collapsed effect world, and `Q`/`Ctrl+C` must quit immediately rather than waiting out the animation. — Task 2.
2. **A terminal that reports no color** (`NO_COLOR=1`, `TERM=dumb`): mode detection must degrade instead of emitting escapes into a pipe, and `--ascii` on a truecolor terminal must still produce pure ASCII — the flag wins over detection. — Task 4.
3. **Boot and game-over panels in a terminal below the 40×24 minimum**: a 30×10 window must show the TooSmall notice rather than a panel drawn past the canvas edge, and the boot sequence must still be skippable there. — Tasks 1 and 2.
4. **A resize mid-sequence**: shrinking during boot, during the collapse, or with help open must re-center the panel on the next frame with no ragged rows and no lost state. — Tasks 1, 2, 3.
5. **Help opened while a banner is up and while paused**: the overlay must win the screen, the game must stay paused underneath, `?` must close it, and gameplay keys must not leak through to the board while it is open. — Task 3.

---

## File Structure

```text
internal/render/
├── boot.go       NEW: DrawBoot — pure function of elapsed time
├── gameover.go   NEW: DrawCollapse + DrawFinalPanel
├── help.go       NEW: DrawHelp overlay panel
├── render.go     MODIFIED: Scene gains BootElapsed, OverElapsed, ShowHelp
├── palette.go    MODIFIED: DetectMode — capability detection
└── testdata/     MODIFIED: boot.txt, gameover.txt, help.txt added
internal/fx/
├── world.go      MODIFIED: Collapse, Intensity, ShootingStar
└── starfield.go  MODIFIED: star counts scale with Intensity
internal/app/
├── model.go      MODIFIED: StateBoot, BootElapsed, OverElapsed, idle tracking
├── update.go     MODIFIED: state machine for boot/over/help, flavor triggers
└── keys.go       MODIFIED: help bindings wired to bubbles/help
cmd/cosmic-tetris/
└── main.go       MODIFIED: DetectMode, --help text
README.md         MODIFIED: final feature list, flags, screenshots section
```

---

### Task 1: Boot sequence

**Files:**
- Create: `internal/render/boot.go`
- Modify: `internal/render/render.go`, `internal/app/model.go`, `internal/app/update.go`
- Test: `internal/render/boot_test.go`, `internal/app/boot_test.go`

**Interfaces:**
- Consumes: `Canvas`, `Layout`, `Palette`, `Mode` (Plan 1 Task 12); `AppState`, `FrameMsg` (Plan 1 Task 16).
- Produces:

```go
// render
const BootDuration = 1000 * time.Millisecond // §29: "approximately one second"
func BootLines(m Mode) []string
// app
const (StateBoot AppState = ...) // a new first member of Plan 1's AppState set
```

`BootLines` returns §29's copy verbatim, with only the leading star swapped for ASCII mode:

```go
[]string{
	"✦",          // "*" in ModeASCII
	"",
	"C O S M I C",
	"",
	"T E T R I S",
	"",
	"INITIALIZING LOCAL UNIVERSE...",
	"",
	"gravity ........ OK",
	"spacetime ...... OK",
	"tetrominoes .... QUESTIONABLE",
	"",
	"UNIVERSE ONLINE",
}
```

Also: `func DrawBoot(c *Canvas, elapsed time.Duration, l Layout, p Palette, m Mode)`, and `Scene` gains `Booting bool` and `BootElapsed time.Duration`.

Add `StateBoot` to Plan 1's existing `AppState` `const` group as its first member, so `StateBoot`, `StatePlaying`, `StatePaused`, `StateGameOver` stay one contiguous set.

Lines appear progressively: line `i` is visible once `elapsed >= BootDuration × (i+1) / len(lines)`. `UNIVERSE ONLINE` is therefore the last thing to appear, immediately before the game starts (§29). The starfield draws behind the block, which happens for free because `Frame` draws stars at step 2.

- [ ] **Step 1: Write the failing render test**

```go
package render

import (
	"strings"
	"testing"
	"time"
)

func TestBootRevealsLinesProgressively(t *testing.T) {
	l := Compute(80, 30)
	p := NewPalette(ModeFull)
	count := func(elapsed time.Duration) int {
		c := NewCanvas(80, 30)
		DrawBoot(c, elapsed, l, p, ModeFull)
		out := c.Plain()
		n := 0
		for _, line := range BootLines(ModeFull) {
			if line != "" && strings.Contains(out, line) {
				n++
			}
		}
		return n
	}
	early := count(50 * time.Millisecond)
	mid := count(500 * time.Millisecond)
	late := count(BootDuration)
	if !(early < mid && mid < late) {
		t.Fatalf("lines did not appear progressively: %d, %d, %d", early, mid, late)
	}
	var nonBlank int
	for _, line := range BootLines(ModeFull) {
		if line != "" {
			nonBlank++
		}
	}
	if late != nonBlank {
		t.Errorf("at the end %d lines are visible, want all %d", late, nonBlank)
	}
}

func TestBootCopyIsTheSpecCopy(t *testing.T) {
	lines := BootLines(ModeFull)
	joined := strings.Join(lines, "\n")
	for _, want := range []string{
		"C O S M I C",
		"T E T R I S",
		"INITIALIZING LOCAL UNIVERSE...",
		"gravity ........ OK",
		"spacetime ...... OK",
		"tetrominoes .... QUESTIONABLE",
		"UNIVERSE ONLINE",
	} {
		if !strings.Contains(joined, want) {
			t.Errorf("BootLines is missing §29's line %q", want)
		}
	}
}

func TestUniverseOnlineComesLast(t *testing.T) {
	c := NewCanvas(80, 30)
	DrawBoot(c, 30*time.Millisecond, Compute(80, 30), NewPalette(ModeFull), ModeFull)
	if strings.Contains(c.Plain(), "UNIVERSE ONLINE") {
		t.Error("UNIVERSE ONLINE appeared immediately; §29 puts it at the end")
	}
	full := NewCanvas(80, 30)
	DrawBoot(full, BootDuration, Compute(80, 30), NewPalette(ModeFull), ModeFull)
	if !strings.Contains(full.Plain(), "UNIVERSE ONLINE") {
		t.Error("UNIVERSE ONLINE never appeared")
	}
}

func TestBootFitsEveryTerminalSizeItIsGiven(t *testing.T) {
	for _, dims := range [][2]int{{40, 24}, {50, 26}, {80, 30}, {200, 60}} {
		c := NewCanvas(dims[0], dims[1])
		DrawBoot(c, BootDuration, Compute(dims[0], dims[1]), NewPalette(ModeFull), ModeFull)
		rows := strings.Split(c.Plain(), "\n")
		if len(rows) != dims[1] {
			t.Fatalf("at %dx%d got %d rows", dims[0], dims[1], len(rows))
		}
		for i, r := range rows {
			if len([]rune(r)) != dims[0] {
				t.Fatalf("at %dx%d row %d is %d runes", dims[0], dims[1], i, len([]rune(r)))
			}
		}
	}
}

func TestBootInAnUndersizedTerminalDoesNotPanicOrOverflow(t *testing.T) {
	for _, dims := range [][2]int{{30, 10}, {10, 3}, {1, 1}, {0, 0}} {
		c := NewCanvas(dims[0], dims[1])
		DrawBoot(c, 500*time.Millisecond, Compute(dims[0], dims[1]), NewPalette(ModeFull), ModeFull)
		if dims[0] > 0 {
			for i, r := range strings.Split(c.Plain(), "\n") {
				if len([]rune(r)) != dims[0] {
					t.Fatalf("at %dx%d row %d is %d runes", dims[0], dims[1], i, len([]rune(r)))
				}
			}
		}
	}
}

func TestBootIsAsciiInAsciiMode(t *testing.T) {
	for _, line := range BootLines(ModeASCII) {
		for _, r := range line {
			if r > 127 {
				t.Errorf("ASCII-mode boot line %q contains non-ASCII %q", line, r)
			}
		}
	}
	// And full mode is allowed its star.
	if !strings.Contains(strings.Join(BootLines(ModeFull), ""), "✦") {
		t.Error("full mode dropped §29's star")
	}
}

func TestFrameDrawsBootInsteadOfTheBoard(t *testing.T) {
	out := StripANSI(Frame(Scene{
		Mode: ModeFull, Width: 80, Height: 30,
		Booting: true, BootElapsed: 400 * time.Millisecond,
	}))
	if !strings.Contains(out, "INITIALIZING LOCAL UNIVERSE") {
		t.Fatal("Frame did not draw the boot screen")
	}
	if strings.Contains(out, "SCORE") {
		t.Error("the HUD is visible during boot")
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/render/ -run TestBoot -v && go test ./internal/render/ -run TestFrameDrawsBoot -v`
Expected: FAIL — undefined: `DrawBoot`, `BootLines`; `Scene` has no field `Booting`.

- [ ] **Step 3: Implement `boot.go` and the `Frame` branch**

Center the block on the canvas, left-aligning the diagnostic lines with each other so the `.... OK` columns line up, and centering the three title lines. Clip any line longer than the canvas. When `Booting` is true, `Frame` draws stars, then the boot block, and nothing else — `Frame` must tolerate `Scene.Game == nil` on this path.

Also in this step, promote Plan 1's test-only `stripANSI` to product code: move it from `internal/render/strip_test.go` into `internal/render/render.go` as `func StripANSI(s string) string`, delete the test-only copy, and update every call site in the render tests from Plans 1 and 2. `internal/app`'s tests need it too from Task 2 onward, and a `_test.go` helper cannot cross packages. It is small, it is exactly the operation the goldens are defined in terms of, and exporting it is cheaper than maintaining two copies.

- [ ] **Step 4: Run it to verify it passes**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Write the failing app test**

```go
package app

import (
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"
	"cosmic-tetris/internal/render"
)

func TestTheAppStartsInBoot(t *testing.T) {
	m := New(Options{Seed: 1, Mode: render.ModeFull})
	if m.State != StateBoot {
		t.Fatalf("State = %v at launch, want StateBoot", m.State)
	}
}

func TestBootAdvancesOnFramesAndEndsOnItsOwn(t *testing.T) {
	m := New(Options{Seed: 1, Mode: render.ModeFull})
	next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	m = next.(Model)
	now := time.Now()
	for i := 0; i < 80; i++ { // 80 x 16ms = 1.28s, past BootDuration
		m.LastFrame = now
		now = now.Add(16 * time.Millisecond)
		next, _ = m.Update(FrameMsg{Now: now})
		m = next.(Model)
	}
	if m.State != StatePlaying {
		t.Fatalf("State = %v after %v, want StatePlaying", m.State, render.BootDuration)
	}
}

func TestAnyKeySkipsBoot(t *testing.T) {
	for _, k := range []tea.KeyPressMsg{keyMsg("x"), keyMsg("j"), {Code: tea.KeyEnter}, {Code: ' ', Text: " "}} {
		m := New(Options{Seed: 1, Mode: render.ModeFull})
		next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
		m = next.(Model)
		next, _ = m.Update(k)
		m = next.(Model)
		if m.State != StatePlaying {
			t.Fatalf("key %v did not skip boot: State = %v", k, m.State)
		}
	}
}

func TestQuitDuringBootStillQuits(t *testing.T) {
	m := New(Options{Seed: 1, Mode: render.ModeFull})
	next, cmd := m.Update(keyMsg("q"))
	m = next.(Model)
	if cmd == nil {
		t.Fatal("q during boot returned no command; it must quit")
	}
	if msg := cmd(); msg == nil {
		t.Fatal("the command produced no message")
	}
}

func TestSkippingBootDoesNotDropTheGravityClock(t *testing.T) {
	// The piece must not instantly fall a second's worth after boot ends.
	m := New(Options{Seed: 1, Mode: render.ModeFull})
	next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	m = next.(Model)
	startY := m.Game.Active.Y
	next, _ = m.Update(keyMsg("x"))
	m = next.(Model)
	now := time.Now()
	m.LastFrame = now
	next, _ = m.Update(FrameMsg{Now: now.Add(16 * time.Millisecond)})
	m = next.(Model)
	if m.Game.Active.Y > startY+1 {
		t.Fatalf("the piece fell from %d to %d on the first frame after boot", startY, m.Game.Active.Y)
	}
}

func TestNoFXSkipsBootEntirely(t *testing.T) {
	m := New(Options{Seed: 1, Mode: render.ModeFull, NoFX: true})
	if m.State != StatePlaying {
		t.Fatalf("State = %v with --no-fx, want StatePlaying: boot is an effect", m.State)
	}
}

func TestBootSurvivesAResize(t *testing.T) {
	m := New(Options{Seed: 1, Mode: render.ModeFull})
	for _, s := range []tea.WindowSizeMsg{{Width: 80, Height: 30}, {Width: 30, Height: 10}, {Width: 100, Height: 40}} {
		next, _ := m.Update(s)
		m = next.(Model)
		if m.State != StateBoot {
			t.Fatalf("a resize ended boot early: State = %v", m.State)
		}
		_ = m.View()
	}
}
```

- [ ] **Step 6: Run it to verify it fails**

Run: `go test ./internal/app/ -run 'TestTheAppStarts|TestBoot|TestAnyKey|TestQuitDuring|TestSkipping|TestNoFXSkips' -v`
Expected: FAIL — undefined: `StateBoot`.

- [ ] **Step 7: Implement the boot state**

`New` sets `State: StateBoot` unless `NoFX`. `Update` on `FrameMsg` in `StateBoot` adds the clamped `dt` to `BootElapsed`, advances the FX world (background only, via Plan 2's `UpdateBackgroundOnly` — the stars must drift), and transitions to `StatePlaying` at `render.BootDuration`. Any `tea.KeyPressMsg` other than quit transitions immediately. The transition sets `LastFrame` to the message's `Now` so the first playing frame has a small `dt` — that is what `TestSkippingBootDoesNotDropTheGravityClock` checks. `View` passes `Booting: m.State == StateBoot` and `BootElapsed`.

Every existing app test from Plans 1 and 2 calls `newModel()` and then acts immediately, so those tests now start in `StateBoot` and fail. Change the helper in `internal/app/helpers_test.go` to skip boot, which keeps every earlier test testing what it meant to test:

```go
func newModel() Model {
	m := New(Options{Seed: 1, Mode: render.ModeFull})
	m.State = StatePlaying
	m.BootElapsed = render.BootDuration
	return m
}
```

The tests in this task construct `New(...)` directly rather than through `newModel`, so they still see the boot state.

- [ ] **Step 8: Run the suite to verify it passes**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
gofmt -l . && git add internal/render/boot.go internal/render/boot_test.go internal/render/render.go internal/app/
git commit -m "feat: boot sequence with progressive diagnostics and any-key skip"
```

---

### Task 2: Game over — freeze, collapse, black hole, panel

**Files:**
- Create: `internal/render/gameover.go`
- Modify: `internal/fx/world.go`, `internal/render/render.go`, `internal/app/model.go`, `internal/app/update.go`
- Test: `internal/render/gameover_test.go`, `internal/fx/collapse_test.go`, `internal/app/gameover_test.go`

**Interfaces:**
- Produces:

```go
// render
const (
	OverFreeze   = 300 * time.Millisecond  // §28: everything freezes for a beat
	OverCollapse = 900 * time.Millisecond  // the board falls into the black hole
	OverPanel    = OverFreeze + OverCollapse
)
func DrawCollapse(c *Canvas, g *game.Game, elapsed time.Duration, l Layout, p Palette)
func DrawFinalPanel(c *Canvas, g *game.Game, best int, l Layout, p Palette)
// Scene gains: OverElapsed time.Duration; Best int
// fx
func (w *World) Collapse(center Rect) // particles spiral inward toward the center
func (w *World) Collapsing() bool
```

§28's sequence: freeze → the board's rows collapse toward a point at the board center, row by row from the outside in → particles spiral inward → the final panel.

Panel contents are §28's copy verbatim — Plan 1 Task 16 already pinned these when it drew the placeholder panel through `Scene.Overlay`, and they must not drift: `UNIVERSE EXPIRED`, `CAUSE: EXCESSIVE GEOMETRY` from `flavor.GameOverSubtitle()`, then `SCORE  483,200`-style comma-grouped stats for score, lines, and level, then `r  REBOOT UNIVERSE` and `q  ACCEPT COSMIC DEATH`.

One documented addition: a `BEST  <n>` line below `LEVEL`. §28's mockup does not show it, but §16 makes a session high score a real concept the player can trigger hyperdrive with, and a high score the player can never see is not a high score. `render` imports `internal/flavor` for the subtitle; that introduces no cycle, since `flavor` imports nothing of ours.

- [ ] **Step 1: Write the failing fx test**

```go
package fx

import (
	"math"
	"testing"
	"time"
)

func TestCollapseSpiralsParticlesInward(t *testing.T) {
	w := worldAt(80, 30)
	center := Rect{X: 30, Y: 5, W: 20, H: 20}
	w.Collapse(center)
	if !w.Collapsing() {
		t.Fatal("Collapsing() is false right after Collapse()")
	}
	cx, cy := float64(center.X+center.W/2), float64(center.Y+center.H/2)
	dist := func() float64 {
		total, n := 0.0, 0
		for _, m := range w.Marks(nil) {
			if m.Role != RoleDebris {
				continue
			}
			dx, dy := float64(m.X)-cx, float64(m.Y)-cy
			total += math.Hypot(dx, dy)
			n++
		}
		if n == 0 {
			return 0
		}
		return total / float64(n)
	}
	before := dist()
	if before == 0 {
		t.Fatal("Collapse emitted no debris")
	}
	w.Update(200 * time.Millisecond)
	if after := dist(); after >= before {
		t.Fatalf("particles did not move inward: mean radius %v -> %v", before, after)
	}
}

func TestCollapseEndsAndClearsItself(t *testing.T) {
	w := worldAt(80, 30)
	w.Collapse(Rect{X: 30, Y: 5, W: 20, H: 20})
	w.Update(2 * time.Second)
	if w.Collapsing() {
		t.Fatal("still collapsing after 2s")
	}
	if w.ParticleCount() != 0 {
		t.Fatalf("%d particles survived the collapse", w.ParticleCount())
	}
}

func TestCollapseIsInertWhenFXAreDisabled(t *testing.T) {
	w := NewWorld(1, Config{Enabled: false})
	w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	w.Collapse(Rect{X: 10, Y: 3, W: 20, H: 20})
	if w.Collapsing() || w.ParticleCount() != 0 {
		t.Fatal("--no-fx still ran the collapse")
	}
}

func TestGameOverEventTriggersTheCollapse(t *testing.T) {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventGameOver}})
	if !w.Collapsing() {
		t.Fatal("EventGameOver did not start the collapse")
	}
}
```

Add the `"cosmic-tetris/internal/game"` import to this file.

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/fx/ -run 'TestCollapse|TestGameOverEvent' -v`
Expected: FAIL — undefined: `Collapse`.

- [ ] **Step 3: Implement the collapse in `fx`**

`Collapse` emits one particle per board cell position around the rect with velocity aimed at the center plus a tangential component (that is the spiral), and sets `collapseAge`. `updateParticles` gains an inward acceleration for `RoleDebris` particles while `Collapsing()` — accelerate toward the center and kill any particle within one cell of it, so the population drains to zero rather than orbiting forever. `Collapsing()` is true for 1.2 s (`render.OverPanel`'s duration, expressed as a local `collapseDuration` constant in `fx` so the packages stay independent).

- [ ] **Step 4: Run it to verify it passes**

Run: `go test ./internal/fx/ -v`
Expected: PASS — including Task 2 of Plan 2's cap test, which the inward acceleration must not break.

- [ ] **Step 5: Write the failing render test**

```go
package render

import (
	"strings"
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func filledGame() *game.Game {
	g := game.New(1)
	for x := 0; x < game.Width; x++ {
		g.Board.Set(x, game.Height-1, game.Cell(1))
		g.Board.Set(x, game.Height-2, game.Cell(2))
	}
	g.Score, g.Lines, g.Level = 12345, 42, 5
	g.Over = true
	return g
}

func TestCollapsePullsRowsTowardTheCenterOverTime(t *testing.T) {
	l := Compute(80, 30)
	p := NewPalette(ModeFull)
	blocks := func(elapsed time.Duration) int {
		c := NewCanvas(80, 30)
		DrawCollapse(c, filledGame(), elapsed, l, p)
		return strings.Count(c.Plain(), "█")
	}
	start := blocks(OverFreeze)
	mid := blocks(OverFreeze + OverCollapse/2)
	end := blocks(OverPanel)
	if start == 0 {
		t.Fatal("nothing on the board at the start of the collapse")
	}
	if !(mid < start) {
		t.Errorf("the board did not shrink: %d -> %d", start, mid)
	}
	if end != 0 {
		t.Errorf("%d blocks survived the collapse", end)
	}
}

func TestFreezeBeatShowsTheBoardUnchanged(t *testing.T) {
	l := Compute(80, 30)
	p := NewPalette(ModeFull)
	g := filledGame()
	frozen := NewCanvas(80, 30)
	DrawCollapse(frozen, g, 10*time.Millisecond, l, p)
	still := NewCanvas(80, 30)
	DrawCollapse(still, g, OverFreeze-10*time.Millisecond, l, p)
	if frozen.Plain() != still.Plain() {
		t.Fatal("the board moved during the freeze beat; §28 wants a held frame")
	}
}

func TestFinalPanelShowsEveryStatAndTheSpecCopy(t *testing.T) {
	c := NewCanvas(80, 30)
	DrawFinalPanel(c, filledGame(), 99999, Compute(80, 30), NewPalette(ModeFull))
	out := c.Plain()
	for _, want := range []string{
		"UNIVERSE EXPIRED",
		"CAUSE: EXCESSIVE GEOMETRY",
		"12,345", // score, comma-grouped as §28 shows
		"42",     // lines
		"5",      // level
		"99,999", // session best
		"REBOOT UNIVERSE",
		"ACCEPT COSMIC DEATH",
	} {
		if !strings.Contains(out, want) {
			t.Errorf("the final panel is missing %q:\n%s", want, out)
		}
	}
}

func TestFinalPanelFitsTheMinimumTerminal(t *testing.T) {
	for _, dims := range [][2]int{{40, 24}, {50, 26}, {80, 30}, {200, 60}} {
		c := NewCanvas(dims[0], dims[1])
		DrawFinalPanel(c, filledGame(), 500, Compute(dims[0], dims[1]), NewPalette(ModeFull))
		rows := strings.Split(c.Plain(), "\n")
		if len(rows) != dims[1] {
			t.Fatalf("at %dx%d got %d rows", dims[0], dims[1], len(rows))
		}
		for i, r := range rows {
			if len([]rune(r)) != dims[0] {
				t.Fatalf("at %dx%d row %d is %d runes", dims[0], dims[1], i, len([]rune(r)))
			}
		}
	}
}

func TestUndersizedTerminalShowsTheNoticeNotThePanel(t *testing.T) {
	out := StripANSI(Frame(Scene{
		Game: filledGame(), Mode: ModeFull, Width: 30, Height: 10,
		OverElapsed: OverPanel + time.Second, Best: 500,
	}))
	if strings.Contains(out, "UNIVERSE EXPIRED") {
		t.Fatal("the panel drew in a 30x10 terminal instead of the too-small notice")
	}
	for i, r := range strings.Split(out, "\n") {
		if len([]rune(r)) > 30 {
			t.Fatalf("row %d is %d runes wide in a 30-column terminal", i, len([]rune(r)))
		}
	}
}

func TestFrameSwitchesFromCollapseToPanel(t *testing.T) {
	g := filledGame()
	during := StripANSI(Frame(Scene{Game: g, Mode: ModeFull, Width: 80, Height: 30, OverElapsed: OverFreeze + 100*time.Millisecond}))
	if strings.Contains(during, "UNIVERSE EXPIRED") {
		t.Error("the panel appeared during the collapse")
	}
	after := StripANSI(Frame(Scene{Game: g, Mode: ModeFull, Width: 80, Height: 30, OverElapsed: OverPanel + 50*time.Millisecond}))
	if !strings.Contains(after, "UNIVERSE EXPIRED") {
		t.Error("the panel did not appear after the collapse")
	}
}
```

- [ ] **Step 6: Run it to verify it fails**

Run: `go test ./internal/render/ -run 'TestCollapse|TestFreeze|TestFinalPanel|TestUndersized|TestFrameSwitches' -v`
Expected: FAIL — undefined: `DrawCollapse`, `DrawFinalPanel`, `OverFreeze`.

- [ ] **Step 7: Implement the collapse rendering and the panel**

`DrawCollapse` draws the board normally while `elapsed < OverFreeze`. Past that, `progress = (elapsed - OverFreeze) / OverCollapse`, and each row is drawn only if its distance from the board's vertical center exceeds `progress × halfHeight` — outer rows vanish first, so the stack visibly falls into a point. Also compress each surviving row horizontally toward the center by `progress`.

`DrawFinalPanel` draws a bordered box centered over the board with the copy above, and returns without drawing when the layout mode is `LayoutTooSmall`. `Frame` picks: `OverElapsed > 0 && OverElapsed < OverPanel` → `DrawCollapse` plus screen FX; `>= OverPanel` → `DrawCollapse` (which now draws an empty board) plus `DrawFinalPanel`.

- [ ] **Step 8: Write the failing app test**

```go
package app

import (
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"
	"cosmic-tetris/internal/render"
)

// fillToTop hard-drops until the game ends.
func fillToTop(t *testing.T, m Model) Model {
	t.Helper()
	for i := 0; i < 500 && !m.Game.Over; i++ {
		next, _ := m.Update(tea.KeyPressMsg{Code: ' ', Text: " "})
		m = next.(Model)
	}
	if !m.Game.Over {
		t.Fatal("could not reach game over with 500 hard drops")
	}
	return m
}

func TestGameOverEntersTheOverStateAndRunsTheSequence(t *testing.T) {
	m := playingModel(t)
	m = fillToTop(t, m)
	if m.State != StateGameOver {
		t.Fatalf("State = %v after the game ended", m.State)
	}
	if m.OverElapsed != 0 {
		t.Fatalf("OverElapsed = %v at the moment of death, want 0", m.OverElapsed)
	}
	now := time.Now()
	for i := 0; i < 100; i++ {
		m.LastFrame = now
		now = now.Add(16 * time.Millisecond)
		next, _ := m.Update(FrameMsg{Now: now})
		m = next.(Model)
	}
	if m.OverElapsed < render.OverPanel {
		t.Fatalf("OverElapsed = %v after 1.6s of frames, want at least %v", m.OverElapsed, render.OverPanel)
	}
}

func TestGameplayKeysAreIgnoredAfterGameOver(t *testing.T) {
	m := playingModel(t)
	m = fillToTop(t, m)
	before := m.Game.Board
	score := m.Game.Score
	for _, k := range []tea.KeyPressMsg{keyMsg("h"), keyMsg("l"), keyMsg("j"), keyMsg("z"), {Code: ' ', Text: " "}, keyMsg("c"), keyMsg("p")} {
		next, _ := m.Update(k)
		m = next.(Model)
	}
	if m.Game.Board != before || m.Game.Score != score {
		t.Fatal("a gameplay key changed the game after it ended")
	}
	if m.State != StateGameOver {
		t.Fatalf("State = %v after gameplay keys, want StateGameOver", m.State)
	}
}

func TestRestartDuringTheCollapseIsCleanNotHalfway(t *testing.T) {
	m := playingModel(t)
	m = fillToTop(t, m)
	now := time.Now()
	m.LastFrame = now
	next, _ := m.Update(FrameMsg{Now: now.Add(200 * time.Millisecond)}) // mid-freeze
	m = next.(Model)
	next, _ = m.Update(keyMsg("r"))
	m = next.(Model)
	if m.State != StatePlaying {
		t.Fatalf("State = %v after R, want StatePlaying", m.State)
	}
	if m.OverElapsed != 0 {
		t.Fatalf("OverElapsed = %v after a restart, want 0", m.OverElapsed)
	}
	if m.Game.Over || m.Game.Score != 0 {
		t.Fatalf("the game was not reset: Over=%v Score=%d", m.Game.Over, m.Game.Score)
	}
	if m.FX.Collapsing() {
		t.Fatal("the effect world is still collapsing after a restart")
	}
	if m.FX.ParticleCount() != 0 {
		t.Fatalf("%d particles carried over into the new game", m.FX.ParticleCount())
	}
}

func TestQuitDuringTheCollapseQuitsImmediately(t *testing.T) {
	m := playingModel(t)
	m = fillToTop(t, m)
	next, cmd := m.Update(keyMsg("q"))
	_ = next
	if cmd == nil {
		t.Fatal("q during the collapse returned no command")
	}
}

func TestSessionBestSurvivesTheDeath(t *testing.T) {
	m := playingModel(t)
	m = fillToTop(t, m)
	best := m.SessionBest
	if best < m.Game.Score {
		t.Fatalf("SessionBest = %d, want at least the final score %d", best, m.Game.Score)
	}
	next, _ := m.Update(keyMsg("r"))
	m = next.(Model)
	if m.SessionBest != best {
		t.Fatalf("SessionBest changed from %d to %d across a restart", best, m.SessionBest)
	}
}

func TestGameOverViewIsWellFormedThroughoutTheSequence(t *testing.T) {
	m := playingModel(t)
	m = fillToTop(t, m)
	now := time.Now()
	for i := 0; i < 120; i++ {
		m.LastFrame = now
		now = now.Add(16 * time.Millisecond)
		next, _ := m.Update(FrameMsg{Now: now})
		m = next.(Model)
		checkRect(t, m.View(), 80, 30)
	}
}
```

Add helpers `playingModel(t)` (a `New` plus an 80×30 resize plus a boot skip) and `checkRect(t, view, w, h)` (splits on newline, asserts the row count and rune width after `render.StripANSI`, which Task 1 promoted to product code) to `internal/app/helpers_test.go`.

- [ ] **Step 9: Run it to verify it fails**

Run: `go test ./internal/app/ -run 'TestGameOver|TestGameplayKeys|TestRestartDuring|TestQuitDuring|TestSessionBest' -v`
Expected: FAIL — undefined: `OverElapsed`.

- [ ] **Step 10: Implement the game-over state machine**

When `Advance` or an input returns `EventGameOver`, set `State = StateGameOver`, `OverElapsed = 0`, update `SessionBest`, and let `FX.Observe` start the collapse. In `StateGameOver`, `FrameMsg` adds the clamped `dt` to `OverElapsed` and advances the FX world but never the game. `R` restarts at any point in the sequence: `Game.Restart()`, `OverElapsed = 0`, `FX.Reset()`, `State = StatePlaying`. `Q` and `Ctrl+C` quit at any point. Every other key is ignored.

Plan 1 Task 16 filled `Scene.Overlay` with a plain game-over panel as a placeholder. Remove that: `View` now passes `OverElapsed` and `Best` instead, and `Overlay` keeps serving only the pause panel. Update Plan 1's app test that asserted the game-over overlay text to assert on the new panel copy instead.

- [ ] **Step 11: Run the suite to verify it passes**

Run: `go test ./... -race -v`
Expected: PASS.

- [ ] **Step 12: Commit**

```bash
gofmt -l . && git add internal/render/ internal/fx/ internal/app/
git commit -m "feat: game-over freeze, black-hole collapse, and final panel"
```

---

### Task 3: Help overlay

**Files:**
- Create: `internal/render/help.go`
- Modify: `internal/app/keys.go`, `internal/app/update.go`, `internal/render/render.go`
- Test: `internal/render/help_test.go`, `internal/app/help_test.go`

**Interfaces:**
- Produces:

```go
// render
func DrawHelp(c *Canvas, rows [][2]string, l Layout, p Palette) // {key, description} pairs
// Scene gains: ShowHelp bool; HelpRows [][2]string
// The rows arrive through the Scene rather than being built in render, because
// they come from app's KeyMap and render must not import app.
// app
func (k KeyMap) HelpRows() [][2]string // ordered key/description pairs for the overlay
func (k KeyMap) ShortHelp() []key.Binding // bubbles/help interface
func (k KeyMap) FullHelp() [][]key.Binding
```

§39: bindings live in `bubbles/key` so the help text is generated from them rather than duplicated. The overlay is a centered panel listing every binding with its description; `?` opens and closes it; `Esc` also closes it.

- [ ] **Step 1: Write the failing test**

```go
// internal/render/help_test.go
package render

import (
	"strings"
	"testing"
)

func TestHelpPanelListsEveryRowItIsGiven(t *testing.T) {
	rows := [][2]string{
		{"h/l or ←/→", "move"},
		{"j or ↓", "soft drop"},
		{"space", "hard drop"},
		{"z/x", "rotate"},
		{"c", "hold"},
		{"p", "pause"},
		{"r", "restart"},
		{"?", "help"},
		{"q", "quit"},
	}
	c := NewCanvas(80, 30)
	DrawHelp(c, rows, Compute(80, 30), NewPalette(ModeFull))
	out := c.Plain()
	for _, r := range rows {
		if !strings.Contains(out, r[1]) {
			t.Errorf("the help panel is missing the description %q:\n%s", r[1], out)
		}
	}
}

func TestHelpPanelFitsEverySupportedSize(t *testing.T) {
	rows := make([][2]string, 9)
	for i := range rows {
		rows[i] = [2]string{"key", "a reasonably long description here"}
	}
	for _, dims := range [][2]int{{40, 24}, {50, 26}, {80, 30}, {200, 60}} {
		c := NewCanvas(dims[0], dims[1])
		DrawHelp(c, rows, Compute(dims[0], dims[1]), NewPalette(ModeFull))
		lines := strings.Split(c.Plain(), "\n")
		if len(lines) != dims[1] {
			t.Fatalf("at %dx%d got %d rows", dims[0], dims[1], len(lines))
		}
		for i, r := range lines {
			if len([]rune(r)) != dims[0] {
				t.Fatalf("at %dx%d row %d is %d runes", dims[0], dims[1], i, len([]rune(r)))
			}
		}
	}
}

func TestHelpPanelIsAsciiCleanInAsciiMode(t *testing.T) {
	rows := [][2]string{{"space", "hard drop"}}
	c := NewCanvas(80, 30)
	DrawHelp(c, rows, Compute(80, 30), NewPalette(ModeASCII))
	for _, r := range c.Plain() {
		if r > 127 && r != '\n' {
			t.Fatalf("non-ASCII %q in the ASCII-mode help panel", r)
		}
	}
}
```

```go
// internal/app/help_test.go
package app

import (
	"strings"
	"testing"

	tea "charm.land/bubbletea/v2"
	"cosmic-tetris/internal/render"
)

func TestHelpRowsCoverEveryBinding(t *testing.T) {
	rows := DefaultKeyMap().HelpRows()
	joined := ""
	for _, r := range rows {
		joined += r[0] + " " + r[1] + "\n"
	}
	for _, want := range []string{"move", "soft drop", "hard drop", "rotate", "hold", "pause", "restart", "quit", "help"} {
		if !strings.Contains(joined, want) {
			t.Errorf("HelpRows is missing %q:\n%s", want, joined)
		}
	}
}

func TestQuestionMarkTogglesHelp(t *testing.T) {
	m := playingModel(t)
	if m.ShowHelp {
		t.Fatal("help starts open")
	}
	next, _ := m.Update(keyMsg("?"))
	m = next.(Model)
	if !m.ShowHelp {
		t.Fatal("? did not open help")
	}
	if !strings.Contains(render.StripANSI(m.View()), "hard drop") {
		t.Fatal("the help panel is not in the view")
	}
	next, _ = m.Update(keyMsg("?"))
	m = next.(Model)
	if m.ShowHelp {
		t.Fatal("? did not close help")
	}
}

func TestEscapeClosesHelp(t *testing.T) {
	m := playingModel(t)
	next, _ := m.Update(keyMsg("?"))
	m = next.(Model)
	next, _ = m.Update(tea.KeyPressMsg{Code: tea.KeyEscape})
	m = next.(Model)
	if m.ShowHelp {
		t.Fatal("escape did not close help")
	}
}

func TestGameplayKeysDoNotLeakThroughHelp(t *testing.T) {
	m := playingModel(t)
	next, _ := m.Update(keyMsg("?"))
	m = next.(Model)
	before := m.Game.Active
	score := m.Game.Score
	for _, k := range []tea.KeyPressMsg{keyMsg("h"), keyMsg("l"), keyMsg("j"), keyMsg("z"), {Code: ' ', Text: " "}, keyMsg("c")} {
		next, _ = m.Update(k)
		m = next.(Model)
	}
	if m.Game.Active != before || m.Game.Score != score {
		t.Fatal("a gameplay key acted while help was open")
	}
	if !m.ShowHelp {
		t.Fatal("a gameplay key closed help")
	}
}

func TestHelpPausesGameplayButNotTheStarfield(t *testing.T) {
	m := playingModel(t)
	next, _ := m.Update(keyMsg("?"))
	m = next.(Model)
	y := m.Game.Active.Y
	elapsed := m.FX.Elapsed
	now := m.LastFrame
	for i := 0; i < 80; i++ { // 1.28s: well past one gravity step at level 1
		m.LastFrame = now
		now = now.Add(16 * time.Millisecond)
		next, _ = m.Update(FrameMsg{Now: now})
		m = next.(Model)
	}
	if m.Game.Active.Y != y {
		t.Fatalf("the piece fell from %d to %d while help was open", y, m.Game.Active.Y)
	}
	if m.FX.Elapsed <= elapsed {
		t.Fatal("the starfield froze while help was open")
	}
}

func TestHelpOverAPausedGameStaysPausedWhenClosed(t *testing.T) {
	m := playingModel(t)
	next, _ := m.Update(keyMsg("p"))
	m = next.(Model)
	next, _ = m.Update(keyMsg("?"))
	m = next.(Model)
	next, _ = m.Update(keyMsg("?"))
	m = next.(Model)
	if m.State != StatePaused {
		t.Fatalf("State = %v after help closed over a paused game, want StatePaused", m.State)
	}
}

func TestHelpWithABannerUpStillDrawsCleanly(t *testing.T) {
	m := playingModel(t)
	m.FX.Observe([]gameEventQuad())
	next, _ := m.Update(keyMsg("?"))
	m = next.(Model)
	checkRect(t, m.View(), 80, 30)
	if !strings.Contains(render.StripANSI(m.View()), "hard drop") {
		t.Fatal("the banner hid the help panel; help wins the screen")
	}
}

func TestHelpSurvivesAResize(t *testing.T) {
	m := playingModel(t)
	next, _ := m.Update(keyMsg("?"))
	m = next.(Model)
	for _, s := range []tea.WindowSizeMsg{{Width: 40, Height: 24}, {Width: 200, Height: 60}, {Width: 30, Height: 10}} {
		next, _ = m.Update(s)
		m = next.(Model)
		if !m.ShowHelp {
			t.Fatal("a resize closed help")
		}
		checkRect(t, m.View(), s.Width, s.Height)
	}
}
```

Replace `[]gameEventQuad()` with a small helper in `helpers_test.go`: `func gameEventQuad() []game.Event { return []game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}} }`, and call it as `m.FX.Observe(gameEventQuad())`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run TestHelp -v && go test ./internal/app/ -run 'TestHelp|TestQuestionMark|TestEscape|TestGameplayKeysDoNot' -v`
Expected: FAIL — undefined: `DrawHelp`, `HelpRows`.

- [ ] **Step 3: Implement the help overlay**

`HelpRows` reads `key.Binding.Help()` from each binding so the strings live in one place (§39). `DrawHelp` renders a bordered panel sized to the longest row, centered, clipped to the layout; in `LayoutTooSmall` it draws nothing. `Frame` draws it last of all, when `s.ShowHelp`, so it wins the screen — including over a banner. `View` passes `ShowHelp: m.ShowHelp` and `HelpRows: m.Keys.HelpRows()`. `Update` handles `ShowHelp` before the state switch: while help is open, only the help, escape, and quit bindings are live, and `FrameMsg` advances FX but not the game. Plan 1 Task 16 already gave `Model` a `ShowHelp` field and toggled it on `?`; this task adds the escape binding, the gameplay lockout, and the actual panel.

- [ ] **Step 4: Run the suite to verify it passes**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/render/help.go internal/render/help_test.go internal/app/
git commit -m "feat: help overlay generated from the key bindings"
```

---

### Task 4: Terminal capability detection and ASCII completeness

**Files:**
- Modify: `internal/render/palette.go`, `cmd/cosmic-tetris/main.go`
- Test: `internal/render/mode_test.go`, `internal/render/ascii_test.go`

**Interfaces:**
- Produces:

```go
type ColorSupport int
const (
	ColorNone ColorSupport = iota // not a TTY, or no color at all
	Color16
	Color256
	ColorTrue
)
func DetectColorSupport(out *os.File) ColorSupport // asks lipgloss/v2 once
func DetectMode(c ColorSupport, termEnv, noColor string) Mode
// ModeASCII when TERM is "dumb" or empty; ModeReduced when NO_COLOR is
// non-empty or support is below Color256; ModeFull otherwise.
```

The split matters: `DetectMode` is pure and takes its inputs as parameters, so it is testable without a terminal, and `DetectColorSupport` is the single place that touches lipgloss v2's color-profile API. If that API's exact shape differs from what you expect, only that one function changes. `main.go` calls `render.DetectMode(render.DetectColorSupport(os.Stdout), os.Getenv("TERM"), os.Getenv("NO_COLOR"))`. `--ascii` overrides the result (§32: the flag is explicit intent).

- [ ] **Step 1: Write the failing test**

```go
// internal/render/mode_test.go
package render

import "testing"

func TestDetectModeDegradesForLimitedTerminals(t *testing.T) {
	cases := []struct {
		name    string
		support ColorSupport
		term    string
		noColor string
		want    Mode
	}{
		{"truecolor xterm", ColorTrue, "xterm-256color", "", ModeFull},
		{"256 color", Color256, "xterm-256color", "", ModeFull},
		{"16 color", Color16, "xterm", "", ModeReduced},
		{"no color at all", ColorNone, "xterm-256color", "", ModeReduced},
		{"NO_COLOR set", ColorTrue, "xterm-256color", "1", ModeReduced},
		{"NO_COLOR empty string is unset", ColorTrue, "xterm-256color", "", ModeFull},
		{"dumb terminal", ColorTrue, "dumb", "", ModeASCII},
		{"no TERM at all", ColorTrue, "", "", ModeASCII},
		{"dumb terminal with no color either", ColorNone, "dumb", "1", ModeASCII},
	}
	for _, c := range cases {
		if got := DetectMode(c.support, c.term, c.noColor); got != c.want {
			t.Errorf("%s: DetectMode = %v, want %v", c.name, got, c.want)
		}
	}
}
```

```go
// internal/render/ascii_test.go
package render

import (
	"strings"
	"testing"
	"time"

	"cosmic-tetris/internal/fx"
	"cosmic-tetris/internal/game"
)

// asciiScene exercises as much of the renderer as one frame can reach.
func asciiScene(t *testing.T, w, h int) string {
	t.Helper()
	g := game.New(7)
	for x := 0; x < game.Width-1; x++ {
		g.Board.Set(x, game.Height-1, game.Cell(x%7+1))
	}
	g.Score, g.Lines, g.Level, g.Combo = 98765, 37, 4, 6
	hold := game.O
	g.Hold = &hold
	l := Compute(w, h)
	world := fx.NewWorld(3, fx.Config{Enabled: true, ASCII: true})
	world.SetGeometry(fx.Rect{X: 0, Y: 0, W: w, H: h}, fx.Rect{X: l.Board.X, Y: l.Board.Y, W: l.Board.W, H: l.Board.H})
	world.Observe([]game.Event{
		{Kind: game.EventPieceHardDropped, Distance: 15, Piece: game.Piece{Kind: game.I, X: 3, Y: 6}},
		{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}},
		{Kind: game.EventComboChanged, Value: 6},
		{Kind: game.EventLevelChanged, Value: 4},
	})
	world.Update(80 * time.Millisecond)
	return Frame(Scene{Game: g, Mode: ModeASCII, Width: w, Height: h, FX: world, Mission: "TESTING"})
}

func TestAsciiModeEmitsOnlyAsciiBytes(t *testing.T) {
	for _, dims := range [][2]int{{40, 24}, {50, 26}, {80, 30}, {200, 60}} {
		out := StripANSI(asciiScene(t, dims[0], dims[1]))
		for i, r := range out {
			if r > 127 && r != '\n' {
				t.Fatalf("at %dx%d byte %d is non-ASCII: %q", dims[0], dims[1], i, r)
			}
		}
	}
}

func TestAsciiModeIsAsciiForEverySpecialScreen(t *testing.T) {
	g := game.New(1)
	g.Over = true
	screens := map[string]string{
		"boot":     Frame(Scene{Mode: ModeASCII, Width: 80, Height: 30, Booting: true, BootElapsed: 600 * time.Millisecond}),
		"gameover": Frame(Scene{Game: g, Mode: ModeASCII, Width: 80, Height: 30, OverElapsed: OverPanel + time.Second, Best: 4242}),
		"paused":   Frame(Scene{Game: g, Mode: ModeASCII, Width: 80, Height: 30, Paused: true}),
		"toosmall": Frame(Scene{Game: g, Mode: ModeASCII, Width: 30, Height: 10}),
	}
	for name, out := range screens {
		for _, r := range StripANSI(out) {
			if r > 127 && r != '\n' {
				t.Errorf("the %s screen contains non-ASCII %q in ASCII mode", name, r)
			}
		}
	}
}

func TestReducedModeStillUsesUnicodeButFewerColors(t *testing.T) {
	out := StripANSI(Frame(Scene{Game: game.New(1), Mode: ModeReduced, Width: 80, Height: 30}))
	if !strings.Contains(out, "█") && !strings.Contains(out, "╔") {
		t.Fatal("reduced mode dropped Unicode; that is ASCII mode's job (§32)")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestDetectMode|TestAscii|TestReducedMode' -v`
Expected: FAIL — undefined: `DetectMode`; and the ASCII tests will very likely fail on real non-ASCII leaks from Plan 2's effects.

- [ ] **Step 3: Implement `DetectMode` and fix every ASCII leak the test finds**

Order the checks so the harshest wins: `dumb`/empty `TERM` → ASCII; `NO_COLOR` non-empty or support below `Color256` → Reduced; otherwise Full. Then walk the failures from `TestAsciiModeEmitsOnlyAsciiBytes` and route each non-ASCII glyph through the mode: shock rings (`. o O 0`), mission-control prefix (`>`), clear-animation ramp (`# = - .`), impact glyphs (`* + . '`), banner decoration (drop the `✦`), notice, and any box-drawing characters (`+ - | =`).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Wire detection into `main.go` and verify the flag precedence by hand**

`main` computes `mode := render.DetectMode(render.DetectColorSupport(os.Stdout), os.Getenv("TERM"), os.Getenv("NO_COLOR"))` and overrides it with `render.ModeASCII` when `--ascii` is set. Verify:

```bash
go run ./cmd/cosmic-tetris --help
TERM=dumb go run ./cmd/cosmic-tetris --seed 1 | head -30
NO_COLOR=1 go run ./cmd/cosmic-tetris --seed 1 | head -30
go run ./cmd/cosmic-tetris --ascii --seed 1 | head -30
```

Each must render something legible rather than a wall of escapes.

- [ ] **Step 6: Commit**

```bash
gofmt -l . && git add internal/render/ cmd/
git commit -m "feat(render): terminal capability detection and full ASCII-mode coverage"
```

---

### Task 5: FX intensity scales with terminal size

**Files:**
- Modify: `internal/fx/world.go`, `internal/fx/starfield.go`, `internal/app/update.go`
- Test: `internal/fx/intensity_test.go`

**Interfaces:**
- Produces:

```go
func (w *World) SetIntensity(scale float64) // 0..1, clamped
func (w *World) Intensity() float64
```

§31: at small sizes, reduce particle counts and effect scale rather than dropping the whole system. The app derives the scale from the layout mode: `LayoutWide` 1.0, `LayoutMedium` 0.7, `LayoutSmall` 0.45, `LayoutTooSmall` 0.0.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func TestIntensityScalesParticleCounts(t *testing.T) {
	count := func(scale float64) int {
		w := worldAt(80, 30)
		w.SetIntensity(scale)
		w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
		return w.ParticleCount()
	}
	full, small := count(1.0), count(0.45)
	if small >= full {
		t.Fatalf("intensity 0.45 emitted %d particles, full emitted %d", small, full)
	}
	if small == 0 {
		t.Fatal("intensity 0.45 emitted nothing; §31 reduces rather than removes")
	}
}

func TestIntensityScalesStarCounts(t *testing.T) {
	big := worldAt(200, 60)
	big.SetIntensity(1.0)
	small := worldAt(40, 24)
	small.SetIntensity(0.45)
	if small.StarCount() >= big.StarCount() {
		t.Fatalf("small terminal has %d stars, big has %d", small.StarCount(), big.StarCount())
	}
	if small.StarCount() == 0 {
		t.Fatal("the small terminal has no stars at all")
	}
}

func TestZeroIntensitySilencesEverythingWithoutDisablingTheWorld(t *testing.T) {
	w := worldAt(80, 30)
	w.SetIntensity(0)
	w.Observe([]game.Event{
		{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}},
		{Kind: game.EventPieceHardDropped, Distance: 18},
	})
	w.Update(50 * time.Millisecond)
	if got := len(w.Marks(nil)); got != 0 {
		t.Fatalf("intensity 0 produced %d marks", got)
	}
	// Raising it again must bring the effects back.
	w.SetIntensity(1)
	w.Observe([]game.Event{{Kind: game.EventPieceHardDropped, Distance: 18}})
	if w.ParticleCount() == 0 {
		t.Fatal("raising the intensity did not restore effects")
	}
}

func TestIntensityIsClampedToTheUnitRange(t *testing.T) {
	w := worldAt(80, 30)
	w.SetIntensity(-3)
	if got := w.Intensity(); got != 0 {
		t.Errorf("Intensity = %v after SetIntensity(-3), want 0", got)
	}
	w.SetIntensity(9)
	if got := w.Intensity(); got != 1 {
		t.Errorf("Intensity = %v after SetIntensity(9), want 1", got)
	}
}

func TestShakeAndShockSurviveReducedIntensity(t *testing.T) {
	// §31 reduces counts and scale; it does not remove whole effects while any
	// intensity remains.
	w := worldAt(50, 26)
	w.SetIntensity(0.45)
	w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
	if dx, dy := w.ShakeOffset(); dx == 0 && dy == 0 {
		t.Error("no shake at 0.45 intensity")
	}
	if w.ShockCount() == 0 {
		t.Error("no shockwave at 0.45 intensity")
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/fx/ -run 'TestIntensity|TestZeroIntensity|TestShakeAndShock' -v`
Expected: FAIL — undefined: `SetIntensity`.

- [ ] **Step 3: Implement intensity**

Store `intensity float64` defaulting to 1. Every emitter multiplies its count by it and rounds up to at least 1 when the intensity is non-zero — that is what keeps small terminals expressive rather than dead. At exactly 0, emitters return immediately, `seedStars` seeds nothing, and `ShakeOffset`/`Shockwave`/`Banner` are inert. `seedStars` scales `StarsFar/Mid/Near` by intensity, and `SetIntensity` reseeds when the scale changes.

- [ ] **Step 4: Set the intensity from the layout in the app**

In `Update`'s `tea.WindowSizeMsg` branch, map the computed `render.Layout.Mode` to the scale above and call `m.FX.SetIntensity`. Add to `internal/app/fx_test.go`:

```go
func TestLayoutModeDrivesFXIntensity(t *testing.T) {
	m := New(Options{Seed: 1, Mode: render.ModeFull})
	cases := []struct {
		w, h int
		want float64
	}{{200, 60, 1.0}, {56, 25, 0.7}, {42, 24, 0.45}, {30, 10, 0.0}}
	for _, c := range cases {
		next, _ := m.Update(tea.WindowSizeMsg{Width: c.w, Height: c.h})
		m = next.(Model)
		if got := m.FX.Intensity(); got != c.want {
			t.Errorf("at %dx%d Intensity = %v, want %v", c.w, c.h, got, c.want)
		}
	}
}
```

Pick the dimensions in that table from the thresholds Plan 1 Task 12 pinned; if a size lands in a different mode than intended, fix the test's dimensions, not the thresholds — the goldens depend on them.

- [ ] **Step 5: Run the suite to verify it passes**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
gofmt -l . && git add internal/fx/ internal/app/
git commit -m "feat(fx): scale effect intensity with the available terminal size"
```

---

### Task 6: The remaining flavor details

**Files:**
- Modify: `internal/fx/world.go`, `internal/fx/starfield.go`, `internal/app/update.go`
- Test: `internal/fx/flavor_test.go`

**Interfaces:**
- Produces:

```go
func (w *World) NoteIdle(dt time.Duration)         // drives TriggerLongIdle after 12s
func (w *World) shootingStar()                     // §45: rare, crosses the background
const ShootingStarChance = 0.0015                  // per 16ms step: roughly one per 11s
```

§45's optional details, all wired to the `flavor.Trigger` values Plan 2 Task 7 already defined: a vertically hard-dropped I emits `TriggerKineticRod`; holding an O emits `TriggerHoldO`; a score crossing a power of ten emits `TriggerScoreRoll`; 12 s without an input emits `TriggerLongIdle`; and a rare shooting star crosses the starfield.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"strings"
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func TestVerticalIHardDropIsAKineticRod(t *testing.T) {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventPieceHardDropped, Distance: 16,
		Piece: game.Piece{Kind: game.I, Rotation: 1, X: 4, Y: 4}}})
	if got := w.Mission(); !strings.Contains(got, "KINETIC ROD DEPLOYED") {
		t.Fatalf("Mission() = %q, want the kinetic rod line", got)
	}
}

func TestHorizontalIHardDropIsNotAKineticRod(t *testing.T) {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventPieceHardDropped, Distance: 16,
		Piece: game.Piece{Kind: game.I, Rotation: 0, X: 3, Y: 4}}})
	if got := w.Mission(); strings.Contains(got, "KINETIC ROD") {
		t.Fatalf("a flat I was called a kinetic rod: %q", got)
	}
}

func TestHoldingAnOSecuresTheCubeAdjacentObject(t *testing.T) {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventHoldUsed, Piece: game.Piece{Kind: game.O}}})
	if got := w.Mission(); !strings.Contains(got, "CUBE ADJACENT OBJECT SECURED") {
		t.Fatalf("Mission() = %q, want the cube line", got)
	}
	other := worldAt(80, 30)
	other.Observe([]game.Event{{Kind: game.EventHoldUsed, Piece: game.Piece{Kind: game.S}}})
	if got := other.Mission(); strings.Contains(got, "CUBE ADJACENT") {
		t.Fatalf("holding an S produced the cube line: %q", got)
	}
}

func TestCrossingAPowerOfTenAnnouncesThatNumberBecameBigger(t *testing.T) {
	w := worldAt(80, 30)
	w.NoteScore(400)
	w.Update(3 * time.Second) // clear the mission cooldown
	w.NoteScore(1200)         // 3 digits -> 4 digits
	if got := w.Mission(); !strings.Contains(got, "NUMBER BECAME BIGGER") {
		t.Fatalf("Mission() = %q, want the score-roll line", got)
	}
}

func TestNotCrossingAPowerOfTenSaysNothing(t *testing.T) {
	w := worldAt(80, 30)
	w.NoteScore(1200)
	w.Update(3 * time.Second)
	// Put a known, non-roll message on the channel so "unchanged" is provable.
	w.Observe([]game.Event{{Kind: game.EventLevelChanged, Value: 4}})
	before := w.Mission()
	if strings.Contains(before, "NUMBER BECAME BIGGER") {
		t.Fatalf("precondition failed: the channel already reads %q", before)
	}
	w.Update(3 * time.Second)
	w.NoteScore(1300) // still 4 digits
	if got := w.Mission(); got != before {
		t.Fatalf("1200 -> 1300 changed the channel to %q, want it to stay %q", got, before)
	}
}

func TestTwelveSecondsOfIdleAsksForTheCaptain(t *testing.T) {
	w := worldAt(80, 30)
	for i := 0; i < 800; i++ { // 12.8s
		w.NoteIdle(16 * time.Millisecond)
		w.Update(16 * time.Millisecond)
	}
	if got := w.Mission(); !strings.Contains(got, "CAPTAIN?") {
		t.Fatalf("Mission() = %q after 12.8s idle, want the captain line", got)
	}
}

func TestAnyEventResetsTheIdleTimer(t *testing.T) {
	w := worldAt(80, 30)
	for i := 0; i < 600; i++ { // 9.6s
		w.NoteIdle(16 * time.Millisecond)
		w.Update(16 * time.Millisecond)
	}
	w.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: game.Piece{Kind: game.T, X: 4, Y: 10}}})
	for i := 0; i < 300; i++ { // 4.8s more: under 12s since the move
		w.NoteIdle(16 * time.Millisecond)
		w.Update(16 * time.Millisecond)
	}
	if got := w.Mission(); strings.Contains(got, "CAPTAIN?") {
		t.Fatalf("the idle timer did not reset on a move: %q", got)
	}
}

func TestAShootingStarEventuallyCrossesTheBackground(t *testing.T) {
	w := worldAt(80, 30)
	var seen bool
	for i := 0; i < 4000 && !seen; i++ { // ~64s of frames
		w.Update(16 * time.Millisecond)
		for _, m := range w.Marks(nil) {
			if m.Role == RoleStarNear && m.Glyph == '─' {
				seen = true
			}
		}
	}
	if !seen {
		t.Fatalf("no shooting star in ~64s at a %v per-step chance", ShootingStarChance)
	}
}

func TestShootingStarsAreRareNotConstant(t *testing.T) {
	w := worldAt(80, 30)
	frames, hits := 0, 0
	for i := 0; i < 2000; i++ {
		w.Update(16 * time.Millisecond)
		frames++
		for _, m := range w.Marks(nil) {
			if m.Glyph == '─' {
				hits++
				break
			}
		}
	}
	if float64(hits)/float64(frames) > 0.25 {
		t.Fatalf("shooting stars are on screen %.0f%% of frames; §45 says rare", 100*float64(hits)/float64(frames))
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/fx/ -run 'TestVertical|TestHorizontal|TestHolding|TestCrossing|TestNotCrossing|TestTwelve|TestAnyEvent|TestAShooting|TestShooting' -v`
Expected: FAIL — undefined: `NoteIdle`, `ShootingStarChance`; the flavor triggers are not wired.

- [ ] **Step 3: Implement the detail triggers**

A vertical I is `Kind == game.I && Rotation%2 == 1`. Score rolls compare `powerOfTenBucket(old)` with `powerOfTenBucket(new)` (`len(strconv.Itoa(score))` is enough). `NoteIdle` accumulates when the app sees no input and resets on any `Observe` with a non-empty slice; crossing 12 s pushes `TriggerLongIdle` once, then rearms after another 12 s. `TriggerRare` is drawn with probability `0.02` in place of any idle message, giving §45's terminal joke.

Give the shooting star its **own single slot** on `World` — `shooting struct { x, y, vx, vy float64; age time.Duration; live bool }` — the same shape as Plan 2's shockwave, at most one at a time, ~600 ms, `Role: RoleStarNear`, `Glyph: '─'` (ASCII `-`), full brightness fading over its last 200 ms, drawn on `LayerScreen`. Do not make it a particle and do not make it a `Star`: a particle would perturb `ParticleCount` and make Plan 2's exact-count particle tests flaky, and a `Star` would perturb `StarCount` and break `TestStarCountIsStableAcrossLongRuns`. A private slot touches neither. Roll for it once per substep in `updateStars`, and have `Marks` skip it when its position is outside the screen rect so `TestStarsStayInsideTheScreen` keeps holding.

One Plan 2 test needs widening, and the widening is correct rather than a concession: `TestStarGlyphsMatchTheSpecSets` must add `─` and `-` to the allowed `RoleStarNear` glyph set. `TestAsciiModeUsesOnlyAsciiStarGlyphs` needs no change and is the assertion that catches a missed mode check on the new glyph.

In `internal/app/update.go`, call `m.FX.NoteIdle(dt)` on each `FrameMsg` where no key arrived since the last frame, and `m.FX.NoteScore(m.Game.Score)` after every scoring input.

- [ ] **Step 4: Run the suite to verify it passes**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/fx/ internal/app/
git commit -m "feat(flavor): kinetic rods, cube-adjacent objects, score rolls, idle chatter, shooting stars"
```

---

### Task 7: Remaining goldens, acceptance walk, and README

**Files:**
- Modify: `internal/render/golden_test.go`, `README.md`
- Create: `internal/render/testdata/{boot,gameover,help}.txt`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Add the three remaining golden cases**

Extend Plan 1 Task 17's table with:

| name | scene |
|---|---|
| `boot` | `Scene{Mode: ModeFull, Width: 80, Height: 30, Booting: true, BootElapsed: 600ms}` with a fixed-seed FX world advanced 10 frames |
| `gameover` | a game with a known board, `Score: 12345`, `Lines: 42`, `Level: 5`, `Over: true`, `OverElapsed: OverPanel + 100ms`, `Best: 99999` |
| `help` | `Scene{Game: game.New(1), Mode: ModeFull, Width: 80, Height: 30, ShowHelp: true, HelpRows: <the nine rows, spelled out in the test>}` |

The `help` golden spells its rows out literally rather than calling `app.DefaultKeyMap().HelpRows()` — `render` must not import `app`. If the two drift, Task 3's `TestHelpRowsCoverEveryBinding` is what catches it.

- [ ] **Step 2: Generate and read the goldens**

Run: `go test ./internal/render -update && go test ./internal/render`
Then open all nine `testdata/*.txt` files and read them as a player would. Check each: the board is 20 cells wide and 20 rows tall, the border closes, nothing overlaps, the panels are centered, no row is ragged, and the ASCII files contain no bytes above 127. Fix the renderer and regenerate for anything wrong — never hand-edit a golden.

- [ ] **Step 3: Walk §43's acceptance criteria**

Run `go run ./cmd/cosmic-tetris` and confirm each, noting the result:

- [ ] Bare `go run ./cmd/cosmic-tetris` launches into a playable game
- [ ] Every documented key does what the help says
- [ ] Hold, ghost piece, next-5 queue, wall kicks, and lock delay all behave
- [ ] Score, lines, and level update correctly; the level raises gravity noticeably
- [ ] `--seed 1234` twice produces the same piece sequence
- [ ] Resizing between 40×24 and full screen never corrupts the display
- [ ] A terminal below 40×24 shows the notice and recovers when grown
- [ ] `--no-fx` is still a good game
- [ ] `--reduced-motion` has no shake, no hyperdrive acceleration, no shockwaves
- [ ] `--ascii` is legible with no mojibake
- [ ] The boot sequence runs in about a second and any key skips it
- [ ] Game over freezes, collapses, and shows the panel; `R` restarts, `Q` quits
- [ ] `Ctrl+C` quits cleanly from every state and leaves the terminal usable
- [ ] Within 30 seconds: starfield, animated border, trails, impacts, particles, and commentary are all visible
- [ ] A four-line clear is gloriously excessive
- [ ] Nothing ever obscures the active piece

- [ ] **Step 4: Confirm §47's non-negotiables and §48's exclusions**

- [ ] Gameplay never waits on an animation — verified by playing during a four-line sequence
- [ ] `go build ./...` on a clean checkout with only the three Charm deps in `go.mod`
- [ ] `go test ./... -race` passes
- [ ] `go vet ./...` is clean
- [ ] `gofmt -l .` prints nothing
- [ ] No sound, no mouse, no network, no config file, no score file, no multiplayer, no AI player (§48)
- [ ] `internal/game` contains no `time.Now()` call and no import of `render`, `app`, `fx`, or any Charm package — check with `go list -deps ./internal/game` and `grep -rn 'time.Now' internal/game/`

- [ ] **Step 5: Write the README**

Cover: what it is (one paragraph with the §1 pitch), a `go run` quickstart, the full flag list (`--seed`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help`), the key bindings table, the 40×24 minimum and what happens below it, terminal recommendations (truecolor + a font with box drawing for the full experience), a short architecture note (engine / effects / render / app, and the determinism promise), and how to run the tests including `-update` for the goldens.

- [ ] **Step 6: Commit**

```bash
gofmt -l . && git add internal/render/ README.md
git commit -m "test: complete golden coverage; docs: README and acceptance walk"
```

---

## Notes for the executor

- **Anything §43 fails is a bug in this plan's scope, not a follow-up.** The acceptance walk in Task 7 is a gate: if the four-line clear is not excessive or a resize corrupts the display, go back and fix it before the final commit.
- **The goldens will churn.** Tasks 1–6 each change what `Frame` draws, so regenerate with `-update` and read every diff. A diff you cannot explain is a bug you just found.
- **When a spec detail and a golden disagree, the spec wins and the golden gets regenerated** — except for the §4 mockup, which §49.7 explicitly demotes to intent.
