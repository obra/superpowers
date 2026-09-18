# Cosmic Tetris — Plan 05: Absurd Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Boot the universe with a second of unnecessary drama, collapse it into a black hole when the player dies, keep the terminal quiet and legible at every size and capability level, and ship the thing.

**Architecture:** Two new app states bracket gameplay — `StateBoot` before it and `StateCollapsing` after it — each driven by the same `FrameMsg` clock and rendered by the same `render.Render`. The collapse simulation lives in `internal/fx` like every other effect; the boot screen is pure rendering with no simulation at all. The last two tasks add no features: they audit what the previous four plans built against §32, §38, §43 and §47, and ship the repository.

**Tech Stack:** Go 1.26; Bubble Tea v2; `internal/fx` and `internal/game` remain standard-library-only.

**Spec:** `design.md` — Phase 5 of §42. Sections most relevant: §28, §29, §30, §32, §38, §39, §43, §45, §46, §47, §48, §49.4, §49.5.

**Prerequisite:** Plans 01–04 complete; `make test` green.

## Global Constraints

- All of Plan 04's restraint rules still bind (§44): never obscure the active piece, never make controls lag, never delay gameplay for animation, never require reading flavor text, no random effect may alter gameplay, shake stays within roughly one cell, particles leave no permanent mark, comedy never overwhelms playability.
- The engine still never reads a clock (§49.2): nothing under `internal/game` may call `time.Now()`. Boot and collapse timing lives in `internal/app` and `internal/fx`.
- Game over is theatrical and must **not** instantly replace the board (§28). Timeline: `0–300ms` everything freezes with `SIGNAL LOST`; `300–900ms` blocks fall inward toward the centre; `900–1300ms` the board collapses into a black hole; then the final card.
- Boot is approximately one second of excessive drama (§29), any key skips it, and there is no menu.
- Pause freezes gameplay and gameplay-related particles; background stars **may** continue drifting very slowly (§30).
- ASCII mode makes no special Unicode assumptions (§32). Every byte the program can emit under `--ascii` must be ASCII — including flavor text, banners, the boot screen, the black hole, and the too-small notice.
- The CLI surface stays exactly `cosmic-tetris`, `--seed N`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help` (§46, §49.5). Nothing else is added by this plan.
- Terminal output must not visibly flicker under normal conditions (§47): one write per frame, no screen clear, and a frame's line count and per-line width must depend only on the terminal size and the mode.
- §45's tiny details are **occasional**. They are cheap, encouraged, and must never crowd out real event commentary.
- The boring modes must still be good: `--no-fx` is a good game, `--ascii` is a good game (§32).
- The codebase should stay small enough to understand in an afternoon (§48). This plan adds no abstraction layers.

## Review Focus

1. **A key pressed during boot** must skip the boot screen — and must not also be delivered to a game that has not started, so a stray `←` does not move an unspawned piece and a `q` still quits. → Task 1.
2. **`r` or `q` pressed mid-collapse** must work immediately (§44: controls never lag) and `r` must produce a clean universe: no leftover collapse state, no leftover particles, no boot replay. → Task 4.
3. **A resize during boot or the collapse**, including down below the 40×24 minimum and back, must not crash or leave a half-drawn frame. → Task 1 and Task 4.
4. **`p` or `?` pressed during the collapse** must not stack a pause box on top of a black hole, and must not stall the sequence so the player can never reach the final card. → Task 4.
5. **The §45 rare lines are rolled 60 times a second**, so a naive `1-in-50` check fires roughly once a second and buries mission control. Rarity must be per-event or per-elapsed-interval, not per-frame. → Task 5.

---

### Task 1: Boot sequence

**Files:**
- Create: `internal/render/boot.go`
- Modify: `internal/render/render.go` (add `OverlayBoot`, `Frame.BootAge`)
- Modify: `internal/app/model.go`, `internal/app/update.go`
- Test: `internal/render/boot_test.go`, `internal/app/boot_test.go`

**Interfaces:**
- Consumes: `Canvas`, `Layout`, `Mode`, `CenterOverlay`, `AppState`, `FrameMsg`.
- Produces (`render`):
  - `OverlayBoot` appended to the `Overlay` const block; `Frame` gains `BootAge time.Duration`.
  - ```go
    const BootDuration = 1200 * time.Millisecond
    func BootLines(age time.Duration, m Mode) []string
    func DrawBoot(c *Canvas, l Layout, age time.Duration, m Mode)
    ```
  - Pinned reveal schedule, from §29's copy, revealed a line at a time:
    | at | line |
    |---|---|
    | `0ms` | `✦` (ASCII `*`) |
    | `0ms` | `C O S M I C` |
    | `150ms` | `T E T R I S` |
    | `350ms` | `INITIALIZING LOCAL UNIVERSE...` |
    | `500ms` | `gravity ........ OK` |
    | `650ms` | `spacetime ...... OK` |
    | `800ms` | `tetrominoes .... QUESTIONABLE` |
    | `1000ms` | `UNIVERSE ONLINE` |
    | `1200ms` | done — gameplay starts |
  - `BootLines` returns only the lines revealed so far, so the screen builds up; it never returns a line the schedule has not reached.
- Produces (`app`):
  - `StateBoot` appended to the `AppState` const block, and it is the state `NewModel` starts in unless the terminal is below minimum. `m.overlay()` maps it to `render.OverlayBoot`, and `View()` fills `Frame.BootAge` from `m.BootAge`.
  - `func (m *Model) bootDone()` — switches to `StatePlaying` and calls `m.Game.Start()`.
  - `FrameMsg` in `StateBoot` accumulates `m.BootAge` (using the same clamped `Delta`) and calls `bootDone()` at `render.BootDuration`; it does **not** advance the game.
  - Any `tea.KeyPressMsg` in `StateBoot` skips: `q`/`esc`/`ctrl+c` still quit; every other key calls `bootDone()` and is otherwise **swallowed** — it does not fall through to the gameplay key handler.

- [ ] **Step 1: Write the failing render test**

`internal/render/boot_test.go`:

```go
package render

import (
	"strings"
	"testing"
	"time"
)

func bootFrame(w, h int, m Mode, age time.Duration) Frame {
	f := frameFor(w, h, m, OverlayBoot)
	f.BootAge = age
	return f
}

func TestBootRevealsItsLinesInOrder(t *testing.T) {
	steps := []struct {
		age  time.Duration
		want string
	}{
		{0, "C O S M I C"},
		{200 * time.Millisecond, "T E T R I S"},
		{400 * time.Millisecond, "INITIALIZING LOCAL UNIVERSE..."},
		{550 * time.Millisecond, "gravity ........ OK"},
		{700 * time.Millisecond, "spacetime ...... OK"},
		{850 * time.Millisecond, "tetrominoes .... QUESTIONABLE"},
		{1050 * time.Millisecond, "UNIVERSE ONLINE"},
	}
	for i, s := range steps {
		got := strings.Join(BootLines(s.age, ModeFull), "\n")
		if !strings.Contains(got, s.want) {
			t.Errorf("at %v: %q missing from\n%s", s.age, s.want, got)
		}
		// Nothing from a later step may have leaked in.
		for _, later := range steps[i+1:] {
			if strings.Contains(got, later.want) {
				t.Errorf("at %v: %q appeared early", s.age, later.want)
			}
		}
	}
}

func TestBootLinesGrowMonotonically(t *testing.T) {
	prev := 0
	for age := time.Duration(0); age <= BootDuration; age += 50 * time.Millisecond {
		n := len(BootLines(age, ModeFull))
		if n < prev {
			t.Fatalf("at %v the boot screen lost lines: %d then %d", age, prev, n)
		}
		prev = n
	}
	if prev < 7 {
		t.Errorf("the finished boot screen has only %d lines", prev)
	}
}

func TestBootScreenIsASCIIInASCIIMode(t *testing.T) {
	for age := time.Duration(0); age <= BootDuration; age += 50 * time.Millisecond {
		for _, line := range BootLines(age, ModeASCII) {
			for _, r := range line {
				if r > 127 {
					t.Fatalf("at %v boot emitted %q", age, r)
				}
			}
		}
	}
}

func TestBootFrameFitsEveryTerminalSize(t *testing.T) {
	for _, dims := range [][2]int{{40, 24}, {46, 26}, {64, 30}, {80, 40}, {200, 60}} {
		for _, age := range []time.Duration{0, 600 * time.Millisecond, BootDuration} {
			out := lines(Render(bootFrame(dims[0], dims[1], ModeFull, age)))
			if len(out) > dims[1] {
				t.Fatalf("%v at %v: %d lines for a %d-row terminal", dims, age, len(out), dims[1])
			}
			for i, line := range out {
				if n := len([]rune(line)); n > dims[0] {
					t.Fatalf("%v at %v: line %d is %d columns", dims, age, i, n)
				}
			}
		}
	}
}

// Review focus 3: a resize down below the minimum during boot.
func TestBootAtAnAbsurdlySmallSizeStillRenders(t *testing.T) {
	for _, dims := range [][2]int{{1, 1}, {8, 3}, {34, 19}} {
		f := bootFrame(dims[0], dims[1], ModeFull, 600*time.Millisecond)
		out := Render(f) // must not panic
		for i, line := range lines(out) {
			if n := len([]rune(line)); n > dims[0] {
				t.Fatalf("%v: line %d is %d columns", dims, i, n)
			}
		}
	}
}

func TestBootDoesNotDrawTheBoard(t *testing.T) {
	g := GlyphsFor(ModeFull)
	out := plain(Render(bootFrame(80, 40, ModeFull, 600*time.Millisecond)))
	if strings.Contains(out, g.BorderTL) {
		t.Error("the boot screen should not show the well; §29 is a takeover screen")
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/render/ -run Boot -v`
Expected: FAIL — `undefined: OverlayBoot`.

- [ ] **Step 3: Implement `boot.go` and the `OverlayBoot` branch in `Render`**

`OverlayBoot` short-circuits like `OverlayTooSmall` does: a blank canvas of the terminal size with the revealed lines centred. Below the minimum size, `OverlayTooSmall` still wins.

- [ ] **Step 4: Run it to verify it passes**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Write the failing app test**

`internal/app/boot_test.go`:

```go
package app

import (
	"strings"
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"
	"github.com/jessev/cosmic-tetris/internal/render"
)

func TestModelStartsInBoot(t *testing.T) {
	m := testModel(t)
	if m.State != StateBoot {
		t.Fatalf("state = %v want StateBoot", m.State)
	}
	if !strings.Contains(plainOut(m.View()), "C O S M I C") {
		t.Error("the boot screen is not on screen")
	}
}

func TestBootEndsOnItsOwnAndStartsTheGame(t *testing.T) {
	m := testModel(t)
	now := time.Unix(0, 0)
	for i := 0; i < 100 && m.State == StateBoot; i++ {
		now = now.Add(16 * time.Millisecond)
		next, _ := m.Update(FrameMsg{Now: now})
		m = next.(*Model)
	}
	if m.State != StatePlaying {
		t.Fatalf("state = %v after %v of ticks", m.State, render.BootDuration)
	}
	if m.Game.Active.Kind == 0 && m.Game.Over {
		t.Error("the game did not start")
	}
}

func TestTheGameDoesNotAdvanceDuringBoot(t *testing.T) {
	m := testModel(t)
	y := m.Game.Active.Y
	now := time.Unix(0, 0)
	for i := 0; i < 3; i++ {
		now = now.Add(16 * time.Millisecond)
		next, _ := m.Update(FrameMsg{Now: now})
		m = next.(*Model)
	}
	if m.State != StateBoot {
		t.Fatal("boot ended too early for this test")
	}
	if m.Game.Active.Y != y {
		t.Error("gravity ran during the boot sequence")
	}
}

// Review focus 1.
func TestAnyKeySkipsBootWithoutMovingThePiece(t *testing.T) {
	for _, key := range []string{"left", "right", "down", "up", " ", "c", "x", "z", "p", "?"} {
		m := testModel(t)
		x, y := m.Game.Active.X, m.Game.Active.Y
		m = press(t, m, key)
		if m.State != StatePlaying {
			t.Errorf("%q did not skip boot (state = %v)", key, m.State)
		}
		if m.Game.Active.X != x || m.Game.Active.Y != y {
			t.Errorf("%q skipped boot AND moved the piece to %d,%d", key, m.Game.Active.X, m.Game.Active.Y)
		}
	}
}

func TestQuitStillWorksDuringBoot(t *testing.T) {
	for _, key := range []string{"q", "esc", "ctrl+c"} {
		m := testModel(t)
		if _, cmd := m.Update(keyMsg(key)); cmd == nil {
			t.Errorf("%q during boot returned no command; it must quit", key)
		}
	}
}

func TestResizeDuringBootIsSafe(t *testing.T) {
	m := testModel(t)
	for _, dims := range [][2]int{{20, 10}, {80, 40}, {34, 19}, {200, 60}} {
		next, _ := m.Update(tea.WindowSizeMsg{Width: dims[0], Height: dims[1]})
		m = next.(*Model)
		out := plainOut(m.View()) // must not panic
		for i, line := range strings.Split(out, "\n") {
			if n := len([]rune(line)); n > dims[0] {
				t.Fatalf("%v: line %d is %d columns during boot", dims, i, n)
			}
		}
	}
}

func TestBootDoesNotReplayAfterRestart(t *testing.T) {
	m := testModel(t)
	m = press(t, m, "x") // skip
	m = press(t, m, "r")
	if m.State == StateBoot {
		t.Error("restart replayed the boot sequence; §29 boots the process, not the round")
	}
}
```

`keyMsg(key string) tea.KeyPressMsg` and `press` already exist in this package from Plan 02's tests — reuse them. This file's `tea` import is only for `WindowSizeMsg`.

- [ ] **Step 6: Run it to verify it fails, implement, and run it again**

Run: `go test ./internal/app/ -run Boot -v` — FAIL, then implement `StateBoot`, then PASS.

- [ ] **Step 7: Repair the older app tests that assumed play starts immediately**

Every test written in Plans 02 and 04 built a model and pressed a key expecting gameplay. Add one helper and use it in all of them, rather than special-casing:

```go
// skipBoot presses a harmless key to dismiss the boot screen.
func skipBoot(t *testing.T, m *Model) *Model {
	t.Helper()
	if m.State == StateBoot {
		m = press(t, m, "x")
	}
	if m.State != StatePlaying {
		t.Fatalf("skipBoot left the model in %v", m.State)
	}
	return m
}
```

Run: `go test ./... -race`
Expected: PASS. Do not weaken an older assertion to make it pass — add the `skipBoot` call.

- [ ] **Step 8: Commit**

```bash
git add internal/render/boot.go internal/render/boot_test.go internal/render/render.go internal/app
git commit -m "feat: one second of excessive boot drama, skippable by any key"
```

---

### Task 2: Pause semantics

**Files:**
- Modify: `internal/fx/world.go`
- Modify: `internal/app/update.go`
- Test: `internal/fx/pause_test.go`

**Interfaces:**
- Consumes: `World`, `AppState`.
- Produces:
  - `func (w *World) SetPaused(p bool)`, `func (w *World) Paused() bool`.
  - `const PausedStarScale = 0.15` — while paused, `Advance` moves the starfield and the border phase at `PausedStarScale` of normal and freezes everything else: particles, trails, clear anims, shockwaves, hyperdrive, shake, flashes, banners, and the mission-control dwell timer all hold their exact state (§30).
  - The app calls `FX.SetPaused(m.State == StatePaused || m.State == StateHelp)` whenever the state changes — help pauses gameplay, so it pauses gameplay FX too.

- [ ] **Step 1: Write the failing test**

`internal/fx/pause_test.go`:

```go
package fx

import (
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func TestPauseFreezesGameplayEffectsButNotStars(t *testing.T) {
	w := boardWorld(101)
	w.Handle([]game.Event{hardDrop(10), movedEvent(game.Piece{Kind: game.KindT, X: 4, Y: 10})})
	w.Advance(16 * time.Millisecond)

	starsBefore := 0.0
	for _, s := range w.Stars() {
		starsBefore += s.Y
	}
	particles := append([]Particle(nil), w.Particles()...)
	trails := len(w.Trails())

	w.SetPaused(true)
	w.Advance(500 * time.Millisecond)

	if len(w.Particles()) != len(particles) {
		t.Errorf("particles changed while paused: %d then %d", len(particles), len(w.Particles()))
	}
	for i, p := range w.Particles() {
		if p != particles[i] {
			t.Errorf("particle %d moved while paused: %+v then %+v", i, particles[i], p)
		}
	}
	if len(w.Trails()) != trails {
		t.Error("trails expired while paused")
	}
	starsAfter := 0.0
	for _, s := range w.Stars() {
		starsAfter += s.Y
	}
	if starsAfter == starsBefore {
		t.Error("§30 allows the background stars to keep drifting; they stopped dead")
	}
}

func TestPausedStarsDriftVerySlowly(t *testing.T) {
	drift := func(paused bool) float64 {
		w := full(80, 40, 102)
		w.SetPaused(paused)
		before := 0.0
		for _, s := range w.Stars() {
			before += s.Y
		}
		w.Advance(500 * time.Millisecond)
		after := 0.0
		for _, s := range w.Stars() {
			after += s.Y
		}
		return after - before
	}
	slow, fast := drift(true), drift(false)
	if slow <= 0 {
		t.Fatalf("paused stars drifted %v", slow)
	}
	if slow > fast*0.5 {
		t.Errorf("paused drift %v is not 'very slowly' next to %v", slow, fast)
	}
}

func TestUnpausingResumesWithoutASurge(t *testing.T) {
	w := boardWorld(103)
	w.Handle([]game.Event{hardDrop(10)})
	w.Advance(16 * time.Millisecond)
	w.SetPaused(true)
	w.Advance(10 * time.Second) // a long coffee break
	frozen := append([]Particle(nil), w.Particles()...)
	w.SetPaused(false)
	w.Advance(16 * time.Millisecond)
	if len(frozen) == 0 {
		t.Skip("no particles to check")
	}
	moved := w.Particles()[0]
	if dx := moved.X - frozen[0].X; dx > 2 || dx < -2 {
		t.Errorf("the paused time was banked and released at once (dx = %v)", dx)
	}
}

func TestPauseDoesNotStopBannersFromExistingJustFromAging(t *testing.T) {
	w := boardWorld(104)
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	if len(w.Banners()) == 0 {
		t.Fatal("no banner")
	}
	w.SetPaused(true)
	w.Advance(5 * time.Second)
	if len(w.Banners()) == 0 {
		t.Error("the banner aged out while the universe was frozen")
	}
}

func TestPausedIsReportedBack(t *testing.T) {
	w := boardWorld(105)
	if w.Paused() {
		t.Error("a fresh world is not paused")
	}
	w.SetPaused(true)
	if !w.Paused() {
		t.Error("SetPaused(true) did not stick")
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/fx/ -run Pause -v`
Expected: FAIL — `undefined: (*World).SetPaused`.

- [ ] **Step 3: Implement, and wire `SetPaused` in `update.go`**

- [ ] **Step 4: Run it to verify it passes**

Run: `go test ./internal/fx/ ./internal/app/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/world.go internal/fx/pause_test.go internal/app/update.go
git commit -m "feat(fx): pause freezes gameplay effects and lets the stars drift"
```

---

### Task 3: The collapse simulation

**Files:**
- Create: `internal/fx/collapse.go`
- Test: `internal/fx/collapse_test.go`

**Interfaces:**
- Consumes: `World`, `game.Event` (`GameOver`), `game.Board`.
- Produces:
  - ```go
    type CollapsePhase int
    const (
        CollapseFreeze CollapsePhase = iota // 0-300ms:    SIGNAL LOST
        CollapseFall                        // 300-900ms:  blocks fall inward
        CollapseHole                        // 900-1300ms: black hole
        CollapseDone                        // the final card
    )
    type FallingBlock struct {
        X, Y  float64 // board coordinates, fractional
        Cell  game.Cell
    }
    func (w *World) StartCollapse(b *game.Board)
    func (w *World) CollapseAge() time.Duration
    func (w *World) CollapsePhase() CollapsePhase
    func (w *World) FallingBlocks() []FallingBlock
    ```
  - Pinned boundaries, straight from §28: `CollapseFreezeEnd = 300ms`, `CollapseFallEnd = 900ms`, `CollapseHoleEnd = 1300ms`.
  - `StartCollapse` snapshots every non-empty board cell into a `FallingBlock`. The board is not touched — FX never modifies game state (§14).
  - During `CollapseFall`, each block accelerates toward the board centre (`x = 4.5`, `y = 10.5` in board coordinates) with an inverse-square-ish pull clamped so nothing overshoots into a jitter loop; blocks within `0.6` cells of the centre are removed (they have crossed the horizon). During `CollapseHole` all remaining blocks are removed over the phase.
  - `GameOver` in `Handle` starts the collapse if the event carries a board pointer; if it does not, the app calls `StartCollapse` explicitly. Also: one shockwave and a `BannerHuge`-free burst of particles at the centre, plus border energy `1.0` (already pinned in Plan 03's table).
  - `func BlackHole(ascii bool) []string` — §28's art, exactly:
    ```text
          ·
        ˚
       \ | /
     --- ● ---
       / | \
         *
    ```
    with the ASCII substitution `·`→`.`, `˚`→`'`, `●`→`@`.

- [ ] **Step 1: Write the failing test**

`internal/fx/collapse_test.go`:

```go
package fx

import (
	"strings"
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func fullishBoard() *game.Board {
	var b game.Board
	for y := 12; y < game.Height; y++ {
		for x := 0; x < game.Width; x++ {
			if (x+y)%3 != 0 {
				b.Set(x, y, game.CellFor(game.KindS))
			}
		}
	}
	return &b
}

func TestCollapseSnapshotsEveryFilledCell(t *testing.T) {
	w := boardWorld(111)
	b := fullishBoard()
	want := 0
	for y := 0; y < game.Height; y++ {
		for x := 0; x < game.Width; x++ {
			if b.At(x, y) != game.Empty {
				want++
			}
		}
	}
	w.StartCollapse(b)
	if got := len(w.FallingBlocks()); got != want {
		t.Fatalf("snapshotted %d blocks want %d", got, want)
	}
}

func TestCollapseDoesNotTouchTheBoard(t *testing.T) {
	w := boardWorld(112)
	b := fullishBoard()
	before := b.Fingerprint()
	w.StartCollapse(b)
	w.Advance(1500 * time.Millisecond)
	if b.Fingerprint() != before {
		t.Fatal("the collapse mutated the board (§14)")
	}
}

func TestCollapsePhasesFollowTheSpecTimeline(t *testing.T) {
	w := boardWorld(113)
	w.StartCollapse(fullishBoard())
	checks := []struct {
		at   time.Duration
		want CollapsePhase
	}{
		{0, CollapseFreeze},
		{299 * time.Millisecond, CollapseFreeze},
		{301 * time.Millisecond, CollapseFall},
		{899 * time.Millisecond, CollapseFall},
		{901 * time.Millisecond, CollapseHole},
		{1299 * time.Millisecond, CollapseHole},
		{1301 * time.Millisecond, CollapseDone},
	}
	last := time.Duration(0)
	for _, c := range checks {
		w.Advance(c.at - last)
		last = c.at
		if got := w.CollapsePhase(); got != c.want {
			t.Errorf("at %v phase = %v want %v", c.at, got, c.want)
		}
	}
}

func TestNothingMovesDuringTheFreeze(t *testing.T) {
	w := boardWorld(114)
	w.StartCollapse(fullishBoard())
	start := append([]FallingBlock(nil), w.FallingBlocks()...)
	w.Advance(250 * time.Millisecond)
	got := w.FallingBlocks()
	if len(got) != len(start) {
		t.Fatalf("blocks vanished during the freeze: %d then %d", len(start), len(got))
	}
	for i := range got {
		if got[i] != start[i] {
			t.Fatalf("block %d moved during the freeze: %+v then %+v", i, start[i], got[i])
		}
	}
}

func TestBlocksFallInwardTowardTheCentre(t *testing.T) {
	w := boardWorld(115)
	w.StartCollapse(fullishBoard())
	dist := func() float64 {
		sum := 0.0
		for _, b := range w.FallingBlocks() {
			dx, dy := b.X-4.5, b.Y-10.5
			sum += dx*dx + dy*dy
		}
		return sum
	}
	w.Advance(310 * time.Millisecond)
	before := dist()
	w.Advance(300 * time.Millisecond)
	after := dist()
	if after >= before {
		t.Errorf("blocks did not converge: %v then %v", before, after)
	}
}

func TestTheUniverseIsEmptyByTheEnd(t *testing.T) {
	w := boardWorld(116)
	w.StartCollapse(fullishBoard())
	w.Advance(1400 * time.Millisecond)
	if n := len(w.FallingBlocks()); n != 0 {
		t.Errorf("%d blocks survived the black hole", n)
	}
	if w.CollapsePhase() != CollapseDone {
		t.Error("the collapse never finished")
	}
}

func TestCollapseSurvivesAHugeDtInOneStep(t *testing.T) {
	w := boardWorld(117)
	w.StartCollapse(fullishBoard())
	w.Advance(10 * time.Second) // a suspended laptop
	if w.CollapsePhase() != CollapseDone {
		t.Errorf("phase = %v after 10s", w.CollapsePhase())
	}
	for _, b := range w.FallingBlocks() {
		t.Fatalf("a block survived: %+v", b)
	}
}

func TestCollapseOfAnEmptyBoardIsFine(t *testing.T) {
	w := boardWorld(118)
	var b game.Board
	w.StartCollapse(&b)
	w.Advance(1400 * time.Millisecond) // must not panic or divide by zero
	if w.CollapsePhase() != CollapseDone {
		t.Error("an empty universe still has to expire")
	}
}

func TestGameOverEventStartsTheDrama(t *testing.T) {
	w := boardWorld(119)
	w.Handle([]game.Event{{Kind: game.GameOver, Board: fullishBoard()}})
	if len(w.FallingBlocks()) == 0 {
		t.Error("the GameOver event did not start the collapse")
	}
	if w.BorderEnergy() < 0.9 {
		t.Errorf("border energy %v; game over is a major event", w.BorderEnergy())
	}
	if len(w.Shockwaves()) == 0 {
		t.Error("no shockwave at the end of the universe")
	}
}

func TestBlackHoleArtMatchesTheSpecAndFoldsToASCII(t *testing.T) {
	art := strings.Join(BlackHole(false), "\n")
	for _, want := range []string{"\\ | /", "--- ● ---", "/ | \\"} {
		if !strings.Contains(art, want) {
			t.Errorf("%q missing from the black hole:\n%s", want, art)
		}
	}
	ascii := strings.Join(BlackHole(true), "\n")
	for _, r := range ascii {
		if r > 127 {
			t.Fatalf("ascii black hole contains %q", r)
		}
	}
	if !strings.Contains(ascii, "--- @ ---") {
		t.Errorf("ascii singularity missing:\n%s", ascii)
	}
}

func TestReducedMotionStillCollapsesTheUniverse(t *testing.T) {
	// §49.5 suppresses shake, hyperdrive and shockwaves — not the ending.
	w := NewWorld(80, 40, Options{Seed: 120, Intensity: IntensityReduced})
	w.SetBoardRect(Rect{X: 20, Y: 4, W: 22, H: 22})
	w.StartCollapse(fullishBoard())
	if len(w.FallingBlocks()) == 0 {
		t.Fatal("reduced motion skipped the collapse")
	}
	w.Advance(1400 * time.Millisecond)
	if w.CollapsePhase() != CollapseDone {
		t.Error("reduced motion never reached the end")
	}
}
```

One note while transcribing: `BlackHole` is a package function, not a method — `func BlackHole(ascii bool) []string`.

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/fx/ -run 'Collapse|BlackHole|TestBlocksFall|TestTheUniverse|TestNothingMoves|TestGameOverEvent' -v`
Expected: FAIL — `undefined: CollapsePhase`.

- [ ] **Step 3: Implement `collapse.go`**

- [ ] **Step 4: Run it to verify it passes**

Run: `go test ./internal/fx/ ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/collapse.go internal/fx/collapse_test.go internal/game
git commit -m "feat(fx): collapse the universe into a black hole"
```

---

### Task 4: Rendering and sequencing the end of the universe

**Files:**
- Create: `internal/render/collapse.go`
- Modify: `internal/render/render.go`, `internal/app/update.go`, `internal/app/model.go`
- Test: `internal/render/collapse_test.go`, `internal/app/gameover_test.go`
- Modify: `internal/render/golden_test.go`

**Interfaces:**
- Consumes: `fx.CollapsePhase`, `fx.FallingBlock`, `fx.BlackHole`, `BoardView.ShowActive`.
- Produces (`render`):
  - `OverlayCollapse` appended to the `Overlay` const block; `Frame` gains `Collapse CollapseView`:
    ```go
    type CollapseView struct {
        Phase  fx.CollapsePhase
        Age    time.Duration
        Blocks []fx.FallingBlock
    }
    ```
  - `func DrawSignalLost(c *Canvas, l Layout, m Mode)` — `SIGNAL LOST` centred over the board.
  - `func DrawFallingBlocks(c *Canvas, frame Rect, bs []fx.FallingBlock, m Mode)` — rounds board coordinates to cells and clips to the frame.
  - `func DrawBlackHole(c *Canvas, l Layout, age time.Duration, m Mode)` — `fx.BlackHole` centred over the board, its brightness rising with `age`.
  - `OverlayCollapse` draws: the frozen well **without** the active piece or ghost (`ShowActive: false`, `ShowGhost: false`), then per phase — `CollapseFreeze` adds `SIGNAL LOST`; `CollapseFall` draws the falling blocks instead of the locked board; `CollapseHole` draws the black hole. `OverlayGameOver` (Plan 02's final card) is used once `CollapseDone` is reached. The HUD, border and starfield keep drawing throughout — the universe ends, the instruments do not.
- Produces (`app`):
  - `StateCollapsing` appended to the `AppState` const block; `m.overlay()` maps it to `render.OverlayCollapse`, and `View()` fills `Frame.Collapse` from the world (or from `m.CollapseAge` alone when `FX == nil`).
  - On the frame where `Game.Over` first becomes true: `State = StateCollapsing`, `FX.StartCollapse(&m.Game.Board)` (skipped when `FX == nil`), and `Chan.Say("SIGNAL LOST", flavor.PrioBig)`.
  - `FrameMsg` in `StateCollapsing` advances FX but not the game, and moves to `StateGameOver` when `FX == nil` after `fx.CollapseHoleEnd`, or when `FX.CollapsePhase() == fx.CollapseDone`. With `--no-fx` the app keeps its own `CollapseAge` so the sequence still takes 1300ms and still shows `SIGNAL LOST`; there are simply no falling blocks and no black hole.
  - Keys during `StateCollapsing`: `r` restarts immediately (clearing collapse state), `q`/`esc`/`ctrl+c` quit immediately, and **every other key including `p` and `?` is ignored** — you cannot pause your own death.
  - `func (m *Model) restart()` — a single place that rebuilds the game, resets FX (`m.FX = fx.NewWorld(...)` with the same derived seed, or a `Reset()` if that reads better), clears `CollapseAge`, and returns to `StatePlaying` without replaying boot. Used by `r` in every state.

- [ ] **Step 1: Write the failing render test**

`internal/render/collapse_test.go`:

```go
package render

import (
	"strings"
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/fx"
	"github.com/jessev/cosmic-tetris/internal/game"
)

func collapseFrame(w, h int, m Mode, phase fx.CollapsePhase, age time.Duration) Frame {
	f := frameFor(w, h, m, OverlayCollapse)
	f.Collapse = CollapseView{Phase: phase, Age: age, Blocks: []fx.FallingBlock{
		{X: 0, Y: 21, Cell: game.CellFor(game.KindI)},
		{X: 4.4, Y: 11.2, Cell: game.CellFor(game.KindT)},
		{X: 9, Y: 15.8, Cell: game.CellFor(game.KindZ)},
	}}
	return f
}

func TestFreezePhaseSaysSignalLost(t *testing.T) {
	out := plain(Render(collapseFrame(80, 40, ModeFull, fx.CollapseFreeze, 100*time.Millisecond)))
	if !strings.Contains(out, "SIGNAL LOST") {
		t.Errorf("§28 opens with SIGNAL LOST:\n%s", out)
	}
	if strings.Contains(out, "UNIVERSE EXPIRED") {
		t.Error("the final card appeared during the freeze; §28 says do not instantly replace the board")
	}
}

func TestFallPhaseDrawsFallingBlocks(t *testing.T) {
	f := collapseFrame(80, 40, ModeFull, fx.CollapseFall, 500*time.Millisecond)
	out := plain(Render(f))
	if !strings.Contains(out, "██") {
		t.Error("no blocks are falling")
	}
	if strings.Contains(out, "SIGNAL LOST") {
		t.Error("SIGNAL LOST outlived the freeze phase")
	}
}

func TestHolePhaseDrawsTheBlackHole(t *testing.T) {
	out := plain(Render(collapseFrame(80, 40, ModeFull, fx.CollapseHole, 1000*time.Millisecond)))
	if !strings.Contains(out, "●") {
		t.Errorf("no singularity:\n%s", out)
	}
}

func TestCollapseNeverDrawsTheActivePiece(t *testing.T) {
	f := collapseFrame(80, 40, ModeFull, fx.CollapseFall, 500*time.Millisecond)
	f.Game.Active = game.Piece{Kind: game.KindI, Rotation: 1, X: 4, Y: 2}
	out := lines(Render(f))
	for _, cell := range f.Game.Active.Cells() {
		x, y := BoardCellXY(f.Layout.Frame, cell[0], cell[1])
		if y < 0 || y >= len(out) {
			continue
		}
		if []rune(out[y])[x] == '█' {
			t.Errorf("the dead piece is still on screen at %v", cell)
		}
	}
}

func TestTheHUDSurvivesTheEndOfTheUniverse(t *testing.T) {
	for _, phase := range []fx.CollapsePhase{fx.CollapseFreeze, fx.CollapseFall, fx.CollapseHole} {
		out := plain(Render(collapseFrame(80, 40, ModeFull, phase, 500*time.Millisecond)))
		if !strings.Contains(out, "SCORE") {
			t.Errorf("phase %v lost the HUD", phase)
		}
	}
}

func TestCollapseFrameIsStableAtEverySize(t *testing.T) {
	for _, dims := range [][2]int{{40, 24}, {50, 30}, {80, 40}} {
		base := len(lines(Render(frameFor(dims[0], dims[1], ModeFull, OverlayNone))))
		for _, phase := range []fx.CollapsePhase{fx.CollapseFreeze, fx.CollapseFall, fx.CollapseHole, fx.CollapseDone} {
			out := lines(Render(collapseFrame(dims[0], dims[1], ModeFull, phase, 700*time.Millisecond)))
			if len(out) != base {
				t.Errorf("%v phase %v: %d lines want %d", dims, phase, len(out), base)
			}
			for i, line := range out {
				if n := len([]rune(line)); n > dims[0] {
					t.Fatalf("%v phase %v line %d is %d columns", dims, phase, i, n)
				}
			}
		}
	}
}

func TestCollapseIsASCIICleanInASCIIMode(t *testing.T) {
	for _, phase := range []fx.CollapsePhase{fx.CollapseFreeze, fx.CollapseFall, fx.CollapseHole, fx.CollapseDone} {
		for _, r := range plain(Render(collapseFrame(80, 40, ModeASCII, phase, 700*time.Millisecond))) {
			if r > 127 {
				t.Fatalf("phase %v emitted %q", phase, r)
			}
		}
	}
}

func TestFallingBlocksOutsideTheFrameAreClipped(t *testing.T) {
	f := collapseFrame(40, 24, ModeFull, fx.CollapseFall, 500*time.Millisecond)
	f.Collapse.Blocks = append(f.Collapse.Blocks,
		fx.FallingBlock{X: -900, Y: -900, Cell: game.CellFor(game.KindI)},
		fx.FallingBlock{X: 1e6, Y: 1e6, Cell: game.CellFor(game.KindI)},
	)
	out := lines(Render(f)) // must not panic
	for i, line := range out {
		if n := len([]rune(line)); n > 40 {
			t.Fatalf("line %d is %d columns", i, n)
		}
	}
}
```

- [ ] **Step 2: Run it to verify it fails, implement `collapse.go`, run it again**

Run: `go test ./internal/render/ -run 'Collapse|Freeze|Fall|Hole|TestTheHUD' -v` — FAIL, implement, PASS.

- [ ] **Step 3: Write the failing app test**

`internal/app/gameover_test.go`:

```go
package app

import (
	"strings"
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/fx"
)

// kill drives the model to game over by hard-dropping into one column until a
// spawn fails. It accepts a model in any state, including one already dead.
func kill(t *testing.T, m *Model) *Model {
	t.Helper()
	if m.State == StateBoot {
		m = skipBoot(t, m)
	}
	for i := 0; i < 2000 && !m.Game.Over; i++ {
		m = press(t, m, " ")
	}
	if !m.Game.Over {
		t.Fatal("could not reach game over by hard-dropping")
	}
	// One more frame so the model notices.
	next, _ := m.Update(FrameMsg{Now: m.LastFrame.Add(16 * time.Millisecond)})
	return next.(*Model)
}

func TestGameOverEntersTheCollapseNotTheCard(t *testing.T) {
	m := kill(t, testModel(t))
	if m.State != StateCollapsing {
		t.Fatalf("state = %v want StateCollapsing", m.State)
	}
	out := plainOut(m.View())
	if strings.Contains(out, "UNIVERSE EXPIRED") {
		t.Error("§28: do not instantly replace the board")
	}
	if !strings.Contains(out, "SIGNAL LOST") {
		t.Errorf("no SIGNAL LOST:\n%s", out)
	}
}

func TestCollapseReachesTheFinalCard(t *testing.T) {
	m := kill(t, testModel(t))
	m = advance(t, m, 120, 16*time.Millisecond) // ~1.9s, well past 1300ms
	if m.State != StateGameOver {
		t.Fatalf("state = %v after the collapse window", m.State)
	}
	out := plainOut(m.View())
	for _, want := range []string{"UNIVERSE EXPIRED", "SCORE", "LINES", "LEVEL", "REBOOT UNIVERSE", "ACCEPT COSMIC DEATH"} {
		if !strings.Contains(out, want) {
			t.Errorf("the final card is missing %q:\n%s", want, out)
		}
	}
}

func TestCollapseAlsoHappensWithFXDisabled(t *testing.T) {
	m := kill(t, modelWith(t, Config{Seed: 4242, NoFX: true}))
	if m.State != StateCollapsing {
		t.Fatalf("no-fx skipped straight to %v", m.State)
	}
	if !strings.Contains(plainOut(m.View()), "SIGNAL LOST") {
		t.Error("no-fx lost the SIGNAL LOST beat")
	}
	m = advance(t, m, 120, 16*time.Millisecond)
	if m.State != StateGameOver {
		t.Fatalf("no-fx never reached the card (state = %v)", m.State)
	}
}

// Review focus 2.
func TestRestartDuringTheCollapseIsInstantAndClean(t *testing.T) {
	m := kill(t, testModel(t))
	m = advance(t, m, 20, 16*time.Millisecond) // mid-fall
	m = press(t, m, "r")
	if m.State != StatePlaying {
		t.Fatalf("state = %v after r", m.State)
	}
	if m.Game.Over {
		t.Error("the new game is already over")
	}
	if m.Game.Score != 0 || m.Game.Lines != 0 {
		t.Errorf("score/lines carried over: %d/%d", m.Game.Score, m.Game.Lines)
	}
	if m.FX != nil {
		if n := len(m.FX.FallingBlocks()); n != 0 {
			t.Errorf("%d collapse blocks survived the restart", n)
		}
		if m.FX.CollapsePhase() != fx.CollapseDone && m.FX.CollapsePhase() != 0 {
			t.Errorf("collapse state survived the restart: %v", m.FX.CollapsePhase())
		}
	}
	if strings.Contains(plainOut(m.View()), "SIGNAL LOST") {
		t.Error("SIGNAL LOST survived the restart")
	}
}

func TestQuitDuringTheCollapseIsInstant(t *testing.T) {
	for _, key := range []string{"q", "esc", "ctrl+c"} {
		m := kill(t, testModel(t))
		_, cmd := m.Update(keyMsg(key))
		if cmd == nil {
			t.Errorf("%q during the collapse did not quit", key)
		}
	}
}

// Review focus 4.
func TestYouCannotPauseYourOwnDeath(t *testing.T) {
	for _, key := range []string{"p", "?"} {
		m := kill(t, testModel(t))
		m = press(t, m, key)
		if m.State != StateCollapsing {
			t.Errorf("%q changed the state to %v mid-collapse", key, m.State)
		}
		out := plainOut(m.View())
		if strings.Contains(out, "TEMPORAL SUSPENSION") || strings.Contains(out, "FLIGHT MANUAL") {
			t.Errorf("%q opened an overlay over the black hole", key)
		}
		m = advance(t, m, 120, 16*time.Millisecond)
		if m.State != StateGameOver {
			t.Errorf("%q stalled the sequence; state = %v", key, m.State)
		}
	}
}

// Review focus 3.
func TestResizeDuringTheCollapseIsSafe(t *testing.T) {
	m := kill(t, testModel(t))
	for _, dims := range [][2]int{{20, 10}, {40, 24}, {200, 60}, {34, 19}} {
		m = resize(t, m, dims[0], dims[1])
		m = advance(t, m, 5, 16*time.Millisecond)
		for i, line := range strings.Split(plainOut(m.View()), "\n") {
			if n := len([]rune(line)); n > dims[0] {
				t.Fatalf("%v: line %d is %d columns mid-collapse", dims, i, n)
			}
		}
	}
	m = advance(t, m, 120, 16*time.Millisecond)
	if m.State != StateGameOver {
		t.Errorf("resizing derailed the sequence; state = %v", m.State)
	}
}

func TestTheGameDoesNotAdvanceDuringTheCollapse(t *testing.T) {
	m := kill(t, testModel(t))
	fp := m.Game.Board.Fingerprint()
	score := m.Game.Score
	m = advance(t, m, 60, 16*time.Millisecond)
	if m.Game.Board.Fingerprint() != fp || m.Game.Score != score {
		t.Error("the game kept running while the universe was collapsing")
	}
}
```

`skipBoot` comes from Task 1, `advance` from Plan 04's `internal/app/violence_test.go`, and `plainOut`/`press`/`keyMsg` from Plan 02's. Add `func resize(t *testing.T, m *Model, w, h int) *Model` (a `tea.WindowSizeMsg` wrapper) next to them. `kill` is used again by Task 7, so put it in the shared helpers file rather than in `gameover_test.go`.

- [ ] **Step 4: Run it to verify it fails, implement the states, run it again**

Run: `go test ./internal/app/ -v` — FAIL, implement `StateCollapsing` and `restart()`, PASS.

- [ ] **Step 5: Record two new goldens**

Add `{"collapse_fall", 80, 40, ModeFull, OverlayCollapse}` and `{"collapse_hole", 80, 40, ModeFull, OverlayCollapse}` to `TestGoldenLayouts` (the table needs a `collapse CollapseView` column, or a small per-case hook).

Run: `go test ./internal/render/ -update && go test ./internal/render/ && cat internal/render/testdata/collapse_hole.txt`
Expected: PASS, and the recorded frame shows a black hole where the well used to be.

- [ ] **Step 6: Commit**

```bash
git add internal/render internal/app
git commit -m "feat: SIGNAL LOST, an inward collapse, and a black hole where the well was"
```

---

### Task 5: The tiny details (§45)

**Files:**
- Create: `internal/flavor/extras.go`
- Create: `internal/fx/shooting.go`
- Test: `internal/flavor/extras_test.go`, `internal/fx/shooting_test.go`

**Interfaces:**
- Consumes: `flavor.Channel`, `flavor.Priority`, `game.Event`, `World`, `Star`.
- Produces (`flavor/extras.go`) — §45's copy, verbatim:
  - ```go
    const (
        ExtraTerminal  = "DID YOU KNOW YOU'RE IN A TERMINAL?"
        ExtraRollover  = "NUMBER BECAME BIGGER"
        ExtraKineticRod = "KINETIC ROD DEPLOYED"
        ExtraCube      = "CUBE ADJACENT OBJECT SECURED"
        ExtraCaptain   = "CAPTAIN?"
    )
    func (c *Channel) HandleExtras(evs []game.Event)
    ```
  - Trigger rules, each **deterministic given the event stream** so no roll can differ between two runs of the same seed in a way that matters, and each rolled **at most once per triggering event** — never per frame (Review focus 5):
    - `PieceHardDropped` with `Kind == KindI` and `Rotation` odd (vertical) → `ExtraKineticRod` at `PrioRoutine`, 1-in-3.
    - `HoldUsed` with `Kind == KindO` → `ExtraCube` at `PrioRoutine`, 1-in-2.
    - Score crossing a power-of-ten boundary (`10_000`, `100_000`, `1_000_000`) → `ExtraRollover` at `PrioCombo`, always.
    - `ExtraTerminal` — 1-in-400 on `PieceLocked`, at `PrioAmbient`, so it cannot displace anything real.
  - `func (c *Channel) NoteIdle(d time.Duration)` — `ExtraCaptain` at `PrioAmbient` once `d >= IdleBeforeCaptain` (`const IdleBeforeCaptain = 12 * time.Second`) with no input yet; it fires once and never again.
  - Every extra goes through the existing `Say`, so `MinDwell` and priority preemption still govern the line — an extra can never stomp a level-up notice.
- Produces (`fx/shooting.go`):
  - ```go
    type ShootingStar struct { X, Y, VX, VY, Life float64; Tail int }
    func (w *World) ShootingStars() []ShootingStar
    const ShootingStarChancePerSecond = 0.08 // ~one every 12s of idle board
    ```
  - A shooting star is spawned only while the board is idle (`func (w *World) NoteBoardIdle(d time.Duration)` reports how long since the last gameplay event; the roll happens only when `d > 3s`), at most `1` alive at a time, and it is rolled once per **simulated second**, not once per frame.
  - Render: `func DrawShootingStars(c *Canvas, ss []fx.ShootingStar, m Mode)` in `internal/render/fxdraw.go`, drawing a 3-cell tail with `· ˚ ✦` (ASCII `. ' *`), skipping non-blank cells like the starfield does.

- [ ] **Step 1: Write the failing flavor test**

`internal/flavor/extras_test.go`:

```go
package flavor

import (
	"strings"
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func TestVerticalIHardDropEventuallySaysKineticRod(t *testing.T) {
	ev := game.Event{Kind: game.PieceHardDropped, Piece: game.Piece{Kind: game.KindI, Rotation: 1}}
	seen := false
	for seed := int64(0); seed < 30 && !seen; seed++ {
		c := chn(seed)
		for i := 0; i < 10 && !seen; i++ {
			c.HandleExtras([]game.Event{ev})
			c.Advance(3 * time.Second)
			if c.Message() == ExtraKineticRod {
				seen = true
			}
		}
	}
	if !seen {
		t.Error("a vertical I never deployed a kinetic rod")
	}
}

func TestHorizontalIHardDropNeverSaysKineticRod(t *testing.T) {
	ev := game.Event{Kind: game.PieceHardDropped, Piece: game.Piece{Kind: game.KindI, Rotation: 0}}
	for seed := int64(0); seed < 30; seed++ {
		c := chn(seed)
		for i := 0; i < 20; i++ {
			c.HandleExtras([]game.Event{ev})
			c.Advance(3 * time.Second)
			if c.Message() == ExtraKineticRod {
				t.Fatalf("seed %d: a flat I claimed to be a kinetic rod", seed)
			}
		}
	}
}

func TestHoldingAnOSecuresACubeAdjacentObject(t *testing.T) {
	ev := game.Event{Kind: game.HoldUsed, Piece: game.Piece{Kind: game.KindO}}
	seen := false
	for seed := int64(0); seed < 20 && !seen; seed++ {
		c := chn(seed)
		for i := 0; i < 10 && !seen; i++ {
			c.HandleExtras([]game.Event{ev})
			c.Advance(3 * time.Second)
			if c.Message() == ExtraCube {
				seen = true
			}
		}
	}
	if !seen {
		t.Error("no cube was ever secured")
	}
}

func TestScoreRolloverAnnouncesItself(t *testing.T) {
	c := chn(7)
	c.HandleExtras([]game.Event{{Kind: game.PieceLocked, Score: 9_800}})
	c.Advance(3 * time.Second)
	c.HandleExtras([]game.Event{{Kind: game.PieceLocked, Score: 10_200}})
	if c.Message() != ExtraRollover {
		t.Errorf("crossing 10,000 said %q", c.Message())
	}
	c.Advance(3 * time.Second)
	c.HandleExtras([]game.Event{{Kind: game.PieceLocked, Score: 10_300}})
	if c.Message() == ExtraRollover {
		t.Error("the rollover line repeated without a new boundary")
	}
}

// Review focus 5: rarity must not be per-frame.
func TestTheTerminalJokeStaysRare(t *testing.T) {
	c := chn(11)
	hits := 0
	for i := 0; i < 2000; i++ {
		c.HandleExtras([]game.Event{{Kind: game.PieceLocked, Score: 100}})
		c.Advance(3 * time.Second)
		if c.Message() == ExtraTerminal {
			hits++
			c.Say("something else", PrioRoutine)
		}
	}
	if hits > 20 {
		t.Errorf("the rare line fired %d times in 2000 locks; §45 says extremely rare", hits)
	}
}

func TestExtrasAreNotRolledPerAdvance(t *testing.T) {
	c := chn(12)
	c.Say("REAL NEWS", PrioBig)
	for i := 0; i < 600; i++ { // ten seconds of frames, no events at all
		c.HandleExtras(nil)
		c.Advance(16 * time.Millisecond)
	}
	for _, extra := range []string{ExtraKineticRod, ExtraCube, ExtraRollover, ExtraTerminal} {
		if c.Message() == extra {
			t.Errorf("an extra (%q) appeared with no event to trigger it", extra)
		}
	}
}

func TestExtrasCannotStompABigMessage(t *testing.T) {
	c := chn(13)
	c.Say("GRAVITY ANOMALY DETECTED", PrioBig)
	for i := 0; i < 50; i++ {
		c.HandleExtras([]game.Event{
			{Kind: game.PieceHardDropped, Piece: game.Piece{Kind: game.KindI, Rotation: 1}},
			{Kind: game.HoldUsed, Piece: game.Piece{Kind: game.KindO}},
		})
	}
	if c.Message() != "GRAVITY ANOMALY DETECTED" {
		t.Errorf("an extra displaced a PrioBig line: %q", c.Message())
	}
}

func TestCaptainAsksAfterALongSilence(t *testing.T) {
	c := chn(14)
	c.NoteIdle(5 * time.Second)
	if strings.Contains(c.Message(), "CAPTAIN") {
		t.Error("five seconds is not a long idle")
	}
	c.NoteIdle(IdleBeforeCaptain + time.Second)
	if !strings.Contains(c.Message(), "CAPTAIN") {
		t.Errorf("mission control never checked in: %q", c.Message())
	}
	c.Say("moving on", PrioRoutine)
	c.Advance(3 * time.Second)
	c.NoteIdle(IdleBeforeCaptain + 10*time.Second)
	if strings.Contains(c.Message(), "CAPTAIN") {
		t.Error("the captain line repeated; it fires once")
	}
}

func TestEveryExtraIsASCII(t *testing.T) {
	for _, s := range []string{ExtraTerminal, ExtraRollover, ExtraKineticRod, ExtraCube, ExtraCaptain} {
		for _, r := range s {
			if r > 127 {
				t.Errorf("%q contains %q", s, r)
			}
		}
	}
}
```

The rollover check reads `Event.Score`, which Plan 01's Task 6 already puts on every scoring event.

- [ ] **Step 2: Write the failing shooting-star test**

`internal/fx/shooting_test.go`:

```go
package fx

import (
	"testing"
	"time"
)

func TestAnIdleBoardEventuallyGetsAShootingStar(t *testing.T) {
	seen := false
	for seed := int64(0); seed < 20 && !seen; seed++ {
		w := full(80, 40, seed)
		for i := 0; i < 60*60; i++ { // one minute of idle
			w.NoteBoardIdle(time.Duration(i) * 16 * time.Millisecond)
			w.Advance(16 * time.Millisecond)
			if len(w.ShootingStars()) > 0 {
				seen = true
				break
			}
		}
	}
	if !seen {
		t.Error("a minute of idle board produced no shooting star")
	}
}

func TestOnlyOneShootingStarAtATime(t *testing.T) {
	w := full(80, 40, 21)
	for i := 0; i < 60*120; i++ {
		w.NoteBoardIdle(10 * time.Second)
		w.Advance(16 * time.Millisecond)
		if n := len(w.ShootingStars()); n > 1 {
			t.Fatalf("%d shooting stars at once", n)
		}
	}
}

func TestABusyBoardGetsNoShootingStars(t *testing.T) {
	w := full(80, 40, 22)
	for i := 0; i < 60*120; i++ {
		w.NoteBoardIdle(200 * time.Millisecond) // constant activity
		w.Advance(16 * time.Millisecond)
		if len(w.ShootingStars()) > 0 {
			t.Fatal("a shooting star crossed a busy board")
		}
	}
}

func TestShootingStarsCrossTheScreenAndLeave(t *testing.T) {
	w := full(80, 40, 23)
	for i := 0; i < 60*60 && len(w.ShootingStars()) == 0; i++ {
		w.NoteBoardIdle(10 * time.Second)
		w.Advance(16 * time.Millisecond)
	}
	if len(w.ShootingStars()) == 0 {
		t.Skip("no star spawned for this seed")
	}
	start := w.ShootingStars()[0]
	moved := false
	for i := 0; i < 600; i++ {
		w.Advance(16 * time.Millisecond)
		ss := w.ShootingStars()
		if len(ss) == 0 {
			if !moved {
				t.Error("the star died without moving")
			}
			return
		}
		if ss[0].X != start.X || ss[0].Y != start.Y {
			moved = true
		}
	}
	t.Error("the shooting star never left")
}

func TestNoShootingStarsWhenFXIsOff(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 24, Intensity: IntensityOff})
	for i := 0; i < 60*120; i++ {
		w.NoteBoardIdle(10 * time.Second)
		w.Advance(16 * time.Millisecond)
	}
	if len(w.ShootingStars()) != 0 {
		t.Error("IntensityOff produced a shooting star")
	}
}
```

- [ ] **Step 3: Run both to verify they fail**

Run: `go test ./internal/flavor/ ./internal/fx/ -run 'Extra|Kinetic|Cube|Rollover|Terminal|Captain|Shooting|Idle' -v`
Expected: FAIL — `undefined: HandleExtras`, `undefined: ShootingStar`.

- [ ] **Step 4: Implement both, plus `DrawShootingStars` and the app wiring**

The app calls `Chan.HandleExtras(m.Events)`, `Chan.NoteIdle(m.sinceInput)` and `FX.NoteBoardIdle(m.sinceGameplayEvent)` in the same place it already calls `Chan.Handle`.

- [ ] **Step 5: Run everything**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/flavor internal/fx/shooting.go internal/fx/shooting_test.go internal/render/fxdraw.go internal/app
git commit -m "feat(flavor): the cheap encouraged nonsense from §45"
```

---

### Task 6: Responsive FX and the flicker audit

**Files:**
- Modify: `internal/fx/world.go` (density scaling by size)
- Test: `internal/fx/responsive_test.go`, `internal/render/flicker_test.go`

**Interfaces:**
- Consumes: `Options`, `Resize`, `Mode`. Capability detection is already done and tested: `render.DetectMode(env func(string) string, forceASCII bool) Mode` from Plan 02 Task 3 — do not add a second one.
- Produces:
  - `func (w *World) budget() float64` (unexported) — `1.0` at `>= 64×26`, `0.6` below that, `0.35` below `46×26`. Star counts, particle caps, trail caps and the shockwave cap are all multiplied by it, so a small terminal gets a proportionally calmer universe rather than a soup of glyphs.
  - No new CLI flags (§46).

- [ ] **Step 1: Write the failing tests**

`internal/fx/responsive_test.go`:

```go
package fx

import (
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func TestSmallTerminalsGetACalmerUniverse(t *testing.T) {
	count := func(cols, rows int) (stars, particles int) {
		w := full(cols, rows, 131)
		w.SetBoardRect(Rect{X: 1, Y: 1, W: 22, H: 22})
		for i := 0; i < 200; i++ {
			w.Handle([]game.Event{clearEvent(18, 19, 20, 21), hardDrop(12)})
			w.Advance(16 * time.Millisecond)
		}
		return len(w.Stars()), w.ParticleCount()
	}
	bigStars, bigParts := count(120, 50)
	smallStars, smallParts := count(40, 24)
	if smallStars >= bigStars {
		t.Errorf("a 40x24 terminal has %d stars vs %d on 120x50", smallStars, bigStars)
	}
	if smallParts >= bigParts {
		t.Errorf("a 40x24 terminal saturates at %d particles vs %d on 120x50", smallParts, bigParts)
	}
}

func TestResizingRescalesTheBudgetBothWays(t *testing.T) {
	w := full(120, 50, 132)
	big := len(w.Stars())
	w.Resize(40, 24)
	small := len(w.Stars())
	if small >= big {
		t.Errorf("shrinking did not reduce the star count: %d then %d", big, small)
	}
	w.Resize(120, 50)
	if again := len(w.Stars()); again <= small {
		t.Errorf("growing back did not restore the stars: %d", again)
	}
	for _, s := range w.Stars() {
		if s.X < 0 || s.X >= 120 || s.Y < -1 || s.Y >= 50 {
			t.Fatalf("a star was left outside after the resize: %+v", s)
		}
	}
}

func TestASmallTerminalIsStillFun(t *testing.T) {
	w := full(40, 24, 133)
	w.SetBoardRect(Rect{X: 1, Y: 1, W: 22, H: 22})
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	if len(w.Stars()) == 0 {
		t.Error("no stars on a small terminal")
	}
	if w.ParticleCount() == 0 {
		t.Error("no particles on a small terminal")
	}
	if len(w.Banners()) == 0 {
		t.Error("no banner on a small terminal")
	}
}
```

`internal/render/flicker_test.go`:

```go
package render

import (
	"strings"
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/fx"
)

// §47: output must not visibly flicker. A frame's shape may depend on the
// terminal size and the mode, and on nothing else.
func TestFrameShapeIsIndependentOfContent(t *testing.T) {
	for _, dims := range [][2]int{{40, 24}, {50, 30}, {80, 40}, {200, 60}} {
		for _, m := range []Mode{ModeFull, ModeReduced, ModeASCII} {
			var want []int
			variants := []func(f *Frame){
				func(f *Frame) {},
				func(f *Frame) { f.Mission = "" },
				func(f *Frame) { f.Mission = strings.Repeat("VERY LONG NEWS ", 30) },
				func(f *Frame) { f.ShakeX, f.ShakeY = 1, -1 },
				func(f *Frame) { f.HUDFlash, f.HUDPulse, f.BorderFlash = 1, 1, 1 },
				func(f *Frame) {
					f.Particles = []fx.Particle{{X: 3, Y: 3, Glyph: '*', Life: 1, MaxLife: 1}}
					f.Shockwaves = []fx.Shockwave{{X: 20, Y: 10, Radius: 5, Life: 300 * time.Millisecond}}
				},
				func(f *Frame) {
					f.Banners = []fx.Banner{{Text: strings.Repeat("BANNER ", 20), Life: 700 * time.Millisecond, Style: fx.BannerHuge}}
				},
			}
			for i, mutate := range variants {
				f := frameFor(dims[0], dims[1], m, OverlayNone)
				mutate(&f)
				got := []int{}
				for _, line := range lines(Render(f)) {
					got = append(got, len([]rune(line)))
				}
				if want == nil {
					want = got
					continue
				}
				if len(got) != len(want) {
					t.Fatalf("%v %v variant %d: %d lines want %d", dims, m, i, len(got), len(want))
				}
				for j := range got {
					if got[j] != want[j] {
						t.Fatalf("%v %v variant %d: line %d is %d columns want %d",
							dims, m, i, j, got[j], want[j])
					}
				}
			}
		}
	}
}

func TestRenderEmitsNoCursorOrClearSequences(t *testing.T) {
	// Bubble Tea owns the cursor. A frame that clears the screen or homes the
	// cursor itself is the classic source of terminal flicker.
	for _, o := range []Overlay{OverlayNone, OverlayPause, OverlayHelp, OverlayGameOver, OverlayBoot, OverlayCollapse, OverlayTooSmall} {
		out := Render(frameFor(80, 40, ModeFull, o))
		for _, bad := range []string{"\x1b[2J", "\x1b[H", "\x1b[J", "\r", "\x1b[?25", "\t"} {
			if strings.Contains(out, bad) {
				t.Errorf("overlay %v emitted %q", o, bad)
			}
		}
	}
}

func TestRenderDoesNotEndWithATrailingNewline(t *testing.T) {
	out := Render(frameFor(80, 40, ModeFull, OverlayNone))
	if strings.HasSuffix(out, "\n") {
		t.Error("a trailing newline scrolls the terminal by one line every frame")
	}
}
```

- [ ] **Step 2: Run both to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run 'Small|Resizing|FrameShape|CursorOr|TrailingNewline' -v`
Expected: FAIL.

- [ ] **Step 3: Implement the budget, and fix whatever the flicker test exposes**

The flicker test is the one most likely to find real bugs in Plans 02–04 (a long mission-control string that wraps, a banner that pushes a line wide). Fix the renderer, not the test.

- [ ] **Step 4: Run everything**

Run: `go test ./... -race`
Expected: PASS. Re-record goldens only if a real fix changed the intended layout.

- [ ] **Step 5: Watch it with your own eyes**

```bash
make build
./cosmic-tetris --seed 99
```

Resize the terminal repeatedly while playing, from full-screen down past 40×24 and back. Nothing may flicker, tear, or leave debris in the scrollback.

- [ ] **Step 6: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat: scale effects to the terminal and kill flicker"
```

---

### Task 7: ASCII purity and help audit

**Files:**
- Test: `internal/app/ascii_test.go`
- Test: `internal/app/help_test.go`
- Modify: whatever the audits break

**Interfaces:**
- Consumes: the whole program.
- Produces: no new API. Two end-to-end audits that drive the real model through every state and assert §32 and §39.

- [ ] **Step 1: Write the failing ASCII audit**

`internal/app/ascii_test.go`:

```go
package app

import (
	"strings"
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/render"
)

// §32: ASCII mode makes no special Unicode assumptions. Not one byte.
func TestNothingInASCIIModeIsEverNonASCII(t *testing.T) {
	check := func(t *testing.T, label string, m *Model) {
		t.Helper()
		for _, r := range plainOut(m.View()) {
			if r > 127 {
				t.Fatalf("%s emitted %q (U+%04X)", label, r, r)
			}
		}
	}
	for seed := int64(1); seed <= 5; seed++ {
		cfg := Config{Seed: seed, ASCII: true}
		m := modelWith(t, cfg)
		if m.Mode != render.ModeASCII {
			t.Fatalf("mode = %v", m.Mode)
		}

		check(t, "boot", m)
		m = advance(t, m, 3, 16*time.Millisecond)
		check(t, "mid-boot", m)
		m = skipBoot(t, m)
		check(t, "first playing frame", m)

		// Play hard for a while: locks, clears, combos, levels, hyperdrive.
		for i := 0; i < 300 && !m.Game.Over; i++ {
			m = press(t, m, []string{"left", "right", "x", "z", "c", " "}[i%6])
			m = advance(t, m, 2, 16*time.Millisecond)
			check(t, "playing", m)
		}
		for _, key := range []string{"p", "p", "?", "?"} {
			m = press(t, m, key)
			check(t, "overlay "+key, m)
		}
		for _, dims := range [][2]int{{34, 19}, {40, 24}, {200, 60}} {
			m = resize(t, m, dims[0], dims[1])
			check(t, "resized", m)
		}
		m = resize(t, m, 80, 40)
		m = press(t, m, "r") // a clean universe, whatever state the loop left behind
		m = kill(t, m)
		for i := 0; i < 120; i++ {
			check(t, "collapsing", m)
			m = advance(t, m, 1, 16*time.Millisecond)
		}
		check(t, "final card", m)
	}
}

func TestNonASCIIModeActuallyUsesTheNiceGlyphs(t *testing.T) {
	// The complement: the audit above must not have been satisfied by making
	// the whole game ASCII.
	m := skipBoot(t, testModel(t))
	m = advance(t, m, 60, 16*time.Millisecond)
	out := plainOut(m.View())
	for _, want := range []string{"█", "╭", "☄"} {
		if !strings.Contains(out, want) {
			t.Errorf("full mode is missing %q", want)
		}
	}
}
```

- [ ] **Step 2: Write the failing help audit**

`internal/app/help_test.go`:

```go
package app

import (
	"strings"
	"testing"
)

// §39's flight manual, every binding.
func TestHelpListsEveryBinding(t *testing.T) {
	m := skipBoot(t, testModel(t))
	m = press(t, m, "?")
	out := plainOut(m.View())
	if !strings.Contains(out, "FLIGHT MANUAL") {
		t.Fatalf("no flight manual:\n%s", out)
	}
	for _, want := range []string{
		"move spacecraft", "accelerate doom", "rotate geometry", "rotate other way",
		"YEET", "quantum storage", "suspend spacetime", "reboot universe",
		"abandon mission", "close this nonsense",
	} {
		if !strings.Contains(out, want) {
			t.Errorf("the manual is missing %q:\n%s", want, out)
		}
	}
}

func TestHelpPausesGameplayAndClosesAgain(t *testing.T) {
	m := skipBoot(t, testModel(t))
	m = press(t, m, "?")
	if m.State != StateHelp {
		t.Fatalf("state = %v", m.State)
	}
	fp := m.Game.Board.Fingerprint()
	y := m.Game.Active.Y
	m = advance(t, m, 120, 16*time.Millisecond) // ~2s: gravity would have moved it
	if m.Game.Active.Y != y || m.Game.Board.Fingerprint() != fp {
		t.Error("the game kept playing while the manual was open")
	}
	m = press(t, m, "?")
	if m.State != StatePlaying {
		t.Errorf("? did not close the manual (state = %v)", m.State)
	}
	m = advance(t, m, 120, 16*time.Millisecond)
	if m.Game.Active.Y == y && !m.Game.Over {
		t.Error("gravity did not resume after closing the manual")
	}
}

func TestHelpFitsTheSmallestSupportedTerminal(t *testing.T) {
	m := skipBoot(t, testModel(t))
	m = resize(t, m, 40, 24)
	m = press(t, m, "?")
	for i, line := range strings.Split(plainOut(m.View()), "\n") {
		if n := len([]rune(line)); n > 40 {
			t.Fatalf("line %d of the manual is %d columns on a 40-column terminal", i, n)
		}
	}
}
```

- [ ] **Step 3: Run both to verify they fail**

Run: `go test ./internal/app/ -run 'ASCII|NonASCII|Help' -v`
Expected: FAIL — most likely on a banner or flavor line with a `✦` in it, and on any §39 copy that drifted.

- [ ] **Step 4: Fix every violation, then run again**

Fix at the source: fold non-ASCII in the mode that must not have it, rather than special-casing the test. The likely offenders, in order:

- The `KeyMap` help strings — §39's manual is written with `←  →  ↓  ↑`. In `ModeASCII` the help must describe the letter keys (`h l`, `j`, `k`) instead.
- `flavor.FourLineBanners`, which contains `✦ EVENT HORIZON ✦` (Plan 04 folds this in `fx`; confirm the fold is reached).
- `render.TooSmallLines`' `×`, which Plan 02 already switches to `x` — verify.
- Any glyph written as a literal instead of through `GlyphsFor(m)`.

- [ ] **Step 4b: Run the whole suite**

Run: `go test ./... -race`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/app internal/render internal/flavor internal/fx
git commit -m "test: end-to-end ASCII purity and flight-manual audits"
```

---

### Task 8: Ship it

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Modify: `Makefile`
- Test: the §47 checklist, run by hand

**Interfaces:**
- Consumes: the finished program.
- Produces: `make build`, `make test`, `make lint`, `make cover`, and a `README.md` documenting exactly the §46 CLI and nothing that does not exist.

- [ ] **Step 1: Write `README.md`**

Contents, and only these: the §48 one-line pitch (a tiny terminal arcade game that happens to use falling tetrominoes, while the universe increasingly loses its shit around the player), a build/run block, the full §8 control table copied from `internal/app/keys.go`, the §46 flag list with one line each, a short "how it works" paragraph naming `internal/game` (deterministic, clock-free), `internal/fx` (event-driven, never mutates the game), `internal/render` (character-grid compositing) and `internal/app` (Bubble Tea), and a note that `--seed N` reproduces a run exactly. No roadmap, no badges for CI that does not exist, no features that are not in the binary.

- [ ] **Step 2: Add `LICENSE`**

MIT, `Copyright (c) 2026 Jesse Vincent`. If the repository has a house license elsewhere, match it instead of inventing one.

- [ ] **Step 3: Check the Makefile gate is complete**

`make test` must run `go test ./... -race`; `make lint` must run `go vet ./...` and `gofmt -l` with a non-empty result failing the build; `make build` must produce `./cosmic-tetris`; `make cover` must print per-package coverage. Add whatever is missing.

Run: `make test && make lint && make build && make cover`
Expected: PASS, and `internal/game` coverage above 90% (§40: game logic receives the serious testing).

- [ ] **Step 4: Walk the §47 definition of done**

Play the game and tick each line off out loud. Anything that fails here is a bug to fix now, in this task.

```bash
./cosmic-tetris --seed 20260917
```

- [ ] playable from start through game over
- [ ] controls feel immediate
- [ ] resizing works
- [ ] hold works
- [ ] ghost works
- [ ] next queue works
- [ ] piece generation is deterministic (`--seed 7` twice, same pieces)
- [ ] game RNG and FX RNG are isolated (`--seed 7` with and without `--no-fx`, same pieces)
- [ ] line clearing is correct
- [ ] gravity increases
- [ ] pause works
- [ ] restart works
- [ ] ASCII fallback works (`--ascii`)
- [ ] no-FX mode works (`--no-fx`)
- [ ] game logic has comprehensive unit tests
- [ ] renderer has representative snapshot tests
- [ ] terminal output does not visibly flicker
- [ ] animations never block input
- [ ] effects never modify game state
- [ ] four-line clears are gloriously excessive
- [ ] game over collapses the universe into a black hole
- [ ] the game is fun with effects disabled
- [ ] the game is **much funnier with effects enabled**

- [ ] **Step 5: Re-run the §43 coolness acceptance test**

Within the first 30 seconds: moving starfield, animated border, piece trails, hard-drop impact, particles, mission-control commentary. Within the first completed line: supernova, debris, border reaction. A four-line clear must still produce the §43 reaction. If it does not, tune it — that is a product requirement, not a preference.

- [ ] **Step 6: Confirm the codebase is still an afternoon's read (§48)**

```bash
find . -name '*.go' -not -name '*_test.go' | xargs wc -l | sort -n | tail -20
```

If any non-test file has grown past roughly 400 lines, split it along the responsibility line that made it grow. Do not add abstraction to reduce the number; move code.

- [ ] **Step 7: Commit**

```bash
git add README.md LICENSE Makefile
git commit -m "docs: ship Cosmic Tetris"
```

---

## Done when

- The game boots with a second of drama that any key skips, and boot does not replay on restart.
- Game over takes 1300ms of theatre — `SIGNAL LOST`, an inward collapse, a black hole — before the final card, and `r`/`q` work instantly at every moment of it.
- Pause freezes gameplay and its particles while the stars keep drifting slowly.
- §45's tiny details appear occasionally and never displace a real message.
- Effects scale down on small terminals and back up on large ones.
- Under `--ascii`, no state of the program emits a single non-ASCII byte; under full mode it still looks like Unicode.
- A frame's line count and line widths depend only on the terminal size and mode — nothing flickers.
- Every line of §47 is ticked, and a four-line clear still gets the §43 reaction.
