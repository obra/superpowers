# Cosmic Tetris — Plan 03: Cosmic Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the universe behind the game: an independent FX simulation (`internal/fx`) with a three-layer starfield, an energy-reactive board border, short-lived piece trails, and a Mission Control status channel — wired into the app so the terminal feels alive while the player does nothing.

**Architecture:** `GameState → emits events → FXWorld → simulates spectacle → Renderer` (§14). `internal/fx` observes `[]game.Event` and advances on `dt`; it holds its **own** `*rand.Rand`, distinct from the game's, and has no way to reach back into `game.Game` (it stores no pointer to one). `internal/render` grows draw functions that take FX data as plain slices. `internal/flavor` owns the words.

**Tech Stack:** Go 1.26, `charm.land/lipgloss/v2` (in render only). `internal/fx` and `internal/flavor` are standard-library-only.

**Spec:** `design.md` — Phase 3 of §42. Sections most relevant: §14, §15, §17, §25, §26, §27, §32, §34, §35, §44, §49.5, §49.6.

**Prerequisite:** Plans 01 and 02 complete; `make test` green; the game is already fun with no effects.

## Global Constraints

- The FX system may observe game events. It may **never modify GameState** (§14). `fx` does not import anything that would let it: it takes events and numbers, never a `*game.Game`.
- FX randomness uses a different RNG from the game (§35). Seed derivation, pinned here: game `seed`; fx `seed ^ 0x5DEECE66D`; flavor `seed ^ 0x2545F4914F6CDD1D`. Enabling, disabling, or intensifying effects must not change piece order.
- Three star depth layers (§15). Glyph inventory `. · ˚ ✦ ✧ *`: far is slow, dim, mostly `.`; mid is medium with `·` and `˚`; near is fast and bright with `✦` and `✧`. Stars drift downward; star velocity increases subtly with level.
- Never make the background so busy that the board becomes harder to read (§15). Nothing outside the board may be drawn inside the well over a locked or active cell (§44).
- Trail lifetime `~100–160ms`; hard drops produce a stronger vertical trail (§17). Trails are FX only.
- Board border colour shifts slowly over time through deep violet, electric cyan, magenta, stellar blue, hot white; the shift is subtle; during major events the gradient moves rapidly. The border is the game's energy-state indicator (§25).
- Mission Control is one line, triggered contextually, and messages get time to breathe — do not rotate them constantly (§27).
- `--no-fx` yields no FX simulation at all and must still be a good game (§32). `--reduced-motion` (§49.5) suppresses screen shake, hyperdrive acceleration, and shockwaves — all introduced in Plan 04 — while leaving colour, trails, and particles alone; in this plan it therefore behaves like full FX.
- Performance (§38): no goroutine per particle or per frame, no filesystem access, no per-frame logging, reusable slices.

## Review Focus

1. **`--no-fx`, where every FX slice is empty and the `*fx.World` is nil** — the render path and the model must both survive a nil world at every call site, not just the ones exercised by the happy path. → Task 6.
2. **The first FX frame, before any `WindowSizeMsg`** — a 0×0 world seeding stars over zero area must not divide by zero, loop forever, or allocate wildly. → Task 1.
3. **One enormous `dt` after the terminal was suspended** — stars must not teleport off into nowhere and trails must expire cleanly; `fx.World.Advance` clamps its own `dt` rather than trusting the caller. → Task 1.
4. **Mission Control changing on every event** — the spec's own "do not rotate messages constantly" is a behaviour with a testable floor: a minimum dwell time, with only higher-priority events allowed to preempt. → Task 5.
5. **FX perturbing the game** — piece order, score, and board must be byte-identical for the same seed and inputs whether FX is off, reduced, or full. This is §35's "very important", and it is only real if a test pins it. → Task 7.

---

### Task 1: The FX world — options, clock, resize, and event intake

**Files:**
- Create: `internal/fx/world.go`
- Create: `internal/fx/events.go`
- Test: `internal/fx/world_test.go`

**Interfaces:**
- Consumes: `game.Event`, `game.EventKind`.
- Produces (`world.go`):
  - ```go
    type Intensity int
    const (IntensityOff Intensity = iota; IntensityReduced; IntensityFull)

    type Options struct {
        Seed      int64
        Intensity Intensity
        ASCII     bool
        Level     int // starting level, for star velocity
    }

    type World struct { /* all fields unexported */ }

    func NewWorld(cols, rows int, o Options) *World
    func (w *World) Resize(cols, rows int)
    func (w *World) SetLevel(level int)
    func (w *World) Advance(dt time.Duration)
    func (w *World) Elapsed() time.Duration
    func (w *World) Intensity() Intensity
    func (w *World) Size() (cols, rows int)
    ```
  - `const MaxAdvance = 250 * time.Millisecond` — `Advance` clamps `dt` into `[0, MaxAdvance]` itself.
- Produces (`events.go`):
  - `func (w *World) Handle(evs []game.Event)` — the single intake point; dispatches to the per-effect handlers added by later tasks. Unknown event kinds are ignored, never fatal.
  - `type Context struct{ Level, Combo int; BoardRect Rect }` if a handler needs board geometry, where `type Rect struct{ X, Y, W, H int }` mirrors the render rect in FX-local terms; `func (w *World) SetBoardRect(r Rect)` is called by the app after each layout.

- [ ] **Step 1: Write the failing test**

`internal/fx/world_test.go`:

```go
package fx

import (
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func TestNewWorldRecordsSizeAndIntensity(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 1, Intensity: IntensityFull, Level: 1})
	if c, r := w.Size(); c != 80 || r != 40 {
		t.Errorf("size = %dx%d want 80x40", c, r)
	}
	if w.Intensity() != IntensityFull {
		t.Error("intensity not recorded")
	}
}

// Review focus 2: no WindowSizeMsg yet.
func TestZeroSizeWorldIsSafe(t *testing.T) {
	for _, dims := range [][2]int{{0, 0}, {0, 40}, {80, 0}, {-3, -3}} {
		w := NewWorld(dims[0], dims[1], Options{Seed: 2, Intensity: IntensityFull})
		w.Advance(16 * time.Millisecond)
		w.Handle([]game.Event{{Kind: game.PieceLocked}})
		w.Resize(dims[1], dims[0])
		w.Advance(16 * time.Millisecond) // must not panic or hang
	}
}

// Review focus 3: a huge dt after suspend.
func TestAdvanceClampsItsOwnDt(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 3, Intensity: IntensityFull})
	w.Advance(9 * time.Hour)
	if w.Elapsed() > MaxAdvance {
		t.Fatalf("elapsed = %v; Advance must clamp to %v", w.Elapsed(), MaxAdvance)
	}
	before := w.Elapsed()
	w.Advance(-time.Second)
	if w.Elapsed() != before {
		t.Error("a negative dt must be inert")
	}
}

func TestElapsedAccumulates(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 4, Intensity: IntensityFull})
	for i := 0; i < 10; i++ {
		w.Advance(16 * time.Millisecond)
	}
	if got := w.Elapsed(); got != 160*time.Millisecond {
		t.Errorf("elapsed = %v want 160ms", got)
	}
}

func TestHandleIgnoresUnknownAndEmptyEvents(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 5, Intensity: IntensityFull})
	w.Handle(nil)
	w.Handle([]game.Event{})
	w.Handle([]game.Event{{Kind: game.EventKind(9999)}}) // must not panic
}

func TestIntensityOffSimulatesNothing(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 6, Intensity: IntensityOff})
	w.Handle([]game.Event{{Kind: game.LinesCleared, Rows: []int{20, 21}}})
	w.Advance(100 * time.Millisecond)
	if len(w.Stars()) != 0 || len(w.Trails()) != 0 {
		t.Errorf("IntensityOff produced %d stars and %d trails", len(w.Stars()), len(w.Trails()))
	}
}

func TestFXHoldsItsOwnRandomnessAndIsReproducible(t *testing.T) {
	run := func() []Star {
		w := NewWorld(80, 40, Options{Seed: 99, Intensity: IntensityFull})
		for i := 0; i < 20; i++ {
			w.Advance(16 * time.Millisecond)
		}
		return w.Stars()
	}
	a, b := run(), run()
	if len(a) != len(b) {
		t.Fatalf("star counts differ: %d vs %d", len(a), len(b))
	}
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("star %d differs: %+v vs %+v", i, a[i], b[i])
		}
	}
}
```

`Stars()` and `Trails()` land in Tasks 2 and 4; add them as empty-returning stubs now so this task compiles, and let those tasks fill them in.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -v`
Expected: FAIL — `undefined: NewWorld`.

- [ ] **Step 3: Implement `world.go` and `events.go`**

`NewWorld` builds `rng: rand.New(rand.NewSource(o.Seed))`. The world stores no reference to any game type beyond the `game.Event` values it is handed.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/world.go internal/fx/events.go internal/fx/world_test.go
git commit -m "feat(fx): world skeleton with its own clock, RNG, and event intake"
```

---

### Task 2: Three-layer starfield

**Files:**
- Create: `internal/fx/starfield.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/starfield_test.go`

**Interfaces:**
- Consumes: Task 1's `World`.
- Produces:
  - ```go
    type Layer int
    const (LayerFar Layer = iota; LayerMid; LayerNear)

    type Star struct {
        X, Y   float64
        Layer  Layer
        Glyph  rune
        Bright float64 // 0..1
    }
    func (w *World) Stars() []Star
    func (w *World) StarSpeedScale() float64
    ```
  - Pinned tuning:
    - Count: `clamp(cols*rows/45, 12, 400)`, split `50%` far, `30%` mid, `20%` near.
    - Base downward speeds in rows/second: far `0.6`, mid `1.6`, near `3.2`.
    - Level scaling: `scale = min(2.5, 1 + 0.06*(level-1))`, applied to all layers (§15 "star velocity subtly increases").
    - Brightness: far `0.25`, mid `0.55`, near `0.9`.
    - Glyphs — full/reduced: far `.`, mid `·` and `˚`, near `✦`, `✧`, and occasionally `*`. ASCII: far `.`, mid `:`, near `+` and `*`.
    - A star passing below the last row respawns on row `-1` at a fresh random column; on `Resize`, stars outside the new viewport respawn inside it and the count is re-derived, so the population stays bounded.

- [ ] **Step 1: Write the failing test**

`internal/fx/starfield_test.go`:

```go
package fx

import (
	"testing"
	"time"
	"unicode"
)

func full(cols, rows int, seed int64) *World {
	return NewWorld(cols, rows, Options{Seed: seed, Intensity: IntensityFull, Level: 1})
}

func TestStarCountScalesWithAreaAndIsBounded(t *testing.T) {
	small := len(full(40, 24, 1).Stars())
	big := len(full(200, 60, 1).Stars())
	if small < 12 {
		t.Errorf("40x24 produced %d stars; the floor is 12", small)
	}
	if big <= small {
		t.Errorf("a bigger terminal should hold more stars (%d vs %d)", big, small)
	}
	if huge := len(full(1000, 1000, 1).Stars()); huge > 400 {
		t.Errorf("1000x1000 produced %d stars; the cap is 400", huge)
	}
}

func TestAllThreeLayersArePopulated(t *testing.T) {
	counts := map[Layer]int{}
	for _, s := range full(80, 40, 2).Stars() {
		counts[s.Layer]++
	}
	for _, l := range []Layer{LayerFar, LayerMid, LayerNear} {
		if counts[l] == 0 {
			t.Errorf("layer %v is empty: %v", l, counts)
		}
	}
	if counts[LayerFar] <= counts[LayerNear] {
		t.Errorf("far stars should outnumber near stars: %v", counts)
	}
}

func TestNearStarsAreBrighterAndFasterThanFarStars(t *testing.T) {
	w := full(80, 40, 3)
	before := map[Layer]float64{}
	after := map[Layer]float64{}
	bright := map[Layer]float64{}
	for _, s := range w.Stars() {
		before[s.Layer] += s.Y
		bright[s.Layer] = s.Bright
	}
	w.Advance(200 * time.Millisecond)
	for _, s := range w.Stars() {
		after[s.Layer] += s.Y
	}
	farDrift := after[LayerFar] - before[LayerFar]
	nearDrift := after[LayerNear] - before[LayerNear]
	if nearDrift <= farDrift {
		t.Errorf("near stars drifted %v, far stars %v; near must be faster", nearDrift, farDrift)
	}
	if !(bright[LayerNear] > bright[LayerMid] && bright[LayerMid] > bright[LayerFar]) {
		t.Errorf("brightness is not ordered by depth: %v", bright)
	}
}

func TestStarsDriftDownward(t *testing.T) {
	w := full(80, 40, 4)
	first := w.Stars()[0]
	w.Advance(500 * time.Millisecond)
	if w.Stars()[0].Y <= first.Y && w.Stars()[0].Y > 0 {
		t.Errorf("star did not drift down: %v -> %v", first.Y, w.Stars()[0].Y)
	}
}

func TestStarsStayInsideTheViewport(t *testing.T) {
	w := full(80, 40, 5)
	for i := 0; i < 500; i++ {
		w.Advance(16 * time.Millisecond)
		for _, s := range w.Stars() {
			if s.X < 0 || s.X >= 80 || s.Y < -1 || s.Y >= 40 {
				t.Fatalf("frame %d: star escaped at %+v", i, s)
			}
		}
	}
}

func TestHigherLevelsSpeedStarsUpButNotWildly(t *testing.T) {
	w := full(80, 40, 6)
	base := w.StarSpeedScale()
	if base != 1 {
		t.Errorf("level 1 scale = %v want 1", base)
	}
	w.SetLevel(7)
	if s := w.StarSpeedScale(); s <= 1 || s > 2.5 {
		t.Errorf("level 7 scale = %v, want above 1 and at or below 2.5", s)
	}
	w.SetLevel(99)
	if s := w.StarSpeedScale(); s != 2.5 {
		t.Errorf("level 99 scale = %v want the 2.5 cap", s)
	}
}

// Review focus 3 continued.
func TestHugeDtDoesNotFlingStarsAway(t *testing.T) {
	w := full(80, 40, 7)
	w.Advance(9 * time.Hour)
	for _, s := range w.Stars() {
		if s.Y < -1 || s.Y >= 40 {
			t.Fatalf("star at %+v after a huge dt", s)
		}
	}
}

func TestResizeKeepsTheStarPopulationBoundedAndInside(t *testing.T) {
	w := full(200, 60, 8)
	for i := 0; i < 60; i++ {
		w.Resize(40+i, 24+i%20)
		w.Advance(16 * time.Millisecond)
		cols, rows := w.Size()
		if n := len(w.Stars()); n > 400 {
			t.Fatalf("resize %d left %d stars", i, n)
		}
		for _, s := range w.Stars() {
			if s.X < 0 || s.X >= float64(cols) || s.Y >= float64(rows) {
				t.Fatalf("resize %d to %dx%d left a star at %+v", i, cols, rows, s)
			}
		}
	}
}

func TestASCIIStarGlyphsAreASCII(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 9, Intensity: IntensityFull, ASCII: true})
	for i := 0; i < 200; i++ {
		w.Advance(16 * time.Millisecond)
		for _, s := range w.Stars() {
			if s.Glyph > unicode.MaxASCII {
				t.Fatalf("ascii mode produced star glyph %q", s.Glyph)
			}
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run Star -v`
Expected: FAIL — stars are still an empty stub.

- [ ] **Step 3: Implement `starfield.go`**

Reuse the star slice across frames — update in place, never reallocate per frame (§38).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/starfield.go internal/fx/world.go internal/fx/starfield_test.go
git commit -m "feat(fx): three-layer starfield with level-scaled drift"
```

---

### Task 3: Border energy state

**Files:**
- Create: `internal/fx/border.go`
- Test: `internal/fx/border_test.go`

**Interfaces:**
- Consumes: Task 1's `World`, `game.Event`.
- Produces:
  - `func (w *World) BorderPhase() float64` — position in the slow colour cycle, `[0,1)`. Advances at `1 / BorderCyclePeriod` per second, multiplied by `1 + 4*energy` (§25 "during major events the gradient moves rapidly").
  - `func (w *World) BorderEnergy() float64` — `[0,1]`, the energy-state indicator.
  - `const BorderCyclePeriod = 24 * time.Second`.
  - Energy inputs, pinned: `PieceLocked +0.10`, `PieceHardDropped +0.20`, `LinesCleared +0.20 × rows`, `ComboChanged +0.08 × combo`, `LevelChanged +0.50`, `GameOver +1.00`. Decay: `energy *= 0.5^(dt / 400ms)`, clamped to `[0,1]`.

- [ ] **Step 1: Write the failing test**

`internal/fx/border_test.go`:

```go
package fx

import (
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func TestBorderPhaseCyclesSlowlyWhenCalm(t *testing.T) {
	w := full(80, 40, 11)
	start := w.BorderPhase()
	w.Advance(200 * time.Millisecond)
	moved := w.BorderPhase() - start
	if moved <= 0 {
		t.Fatalf("phase did not advance: %v -> %v", start, w.BorderPhase())
	}
	if moved > 0.05 {
		t.Errorf("phase moved %v in 200ms; §25 asks for a subtle shift", moved)
	}
}

func TestBorderPhaseWrapsWithoutJumping(t *testing.T) {
	w := full(80, 40, 12)
	for i := 0; i < 4000; i++ {
		w.Advance(16 * time.Millisecond)
		if p := w.BorderPhase(); p < 0 || p >= 1 {
			t.Fatalf("phase left [0,1): %v", p)
		}
	}
}

func TestEventsRaiseEnergyByMagnitude(t *testing.T) {
	single := full(80, 40, 13)
	single.Handle([]game.Event{{Kind: game.LinesCleared, Rows: []int{21}}})
	quad := full(80, 40, 13)
	quad.Handle([]game.Event{{Kind: game.LinesCleared, Rows: []int{18, 19, 20, 21}}})
	if quad.BorderEnergy() <= single.BorderEnergy() {
		t.Errorf("a four-line clear should excite the border more: %v vs %v",
			quad.BorderEnergy(), single.BorderEnergy())
	}
	lockOnly := full(80, 40, 13)
	lockOnly.Handle([]game.Event{{Kind: game.PieceLocked}})
	if lockOnly.BorderEnergy() >= single.BorderEnergy() {
		t.Error("a plain lock should excite the border less than a line clear")
	}
}

func TestEnergyIsClampedToOne(t *testing.T) {
	w := full(80, 40, 14)
	for i := 0; i < 50; i++ {
		w.Handle([]game.Event{{Kind: game.LevelChanged, Level: i}})
	}
	if e := w.BorderEnergy(); e > 1 {
		t.Fatalf("energy = %v", e)
	}
}

func TestEnergyDecaysBackToCalm(t *testing.T) {
	w := full(80, 40, 15)
	w.Handle([]game.Event{{Kind: game.LinesCleared, Rows: []int{18, 19, 20, 21}}})
	hot := w.BorderEnergy()
	if hot <= 0 {
		t.Fatal("setup: energy should have risen")
	}
	w.Advance(400 * time.Millisecond)
	half := w.BorderEnergy()
	if half >= hot {
		t.Errorf("energy did not decay: %v -> %v", hot, half)
	}
	for i := 0; i < 100; i++ {
		w.Advance(100 * time.Millisecond)
	}
	if e := w.BorderEnergy(); e > 0.01 {
		t.Errorf("energy is still %v after 10s of calm", e)
	}
}

func TestHighEnergySpeedsThePhaseUp(t *testing.T) {
	calm := full(80, 40, 16)
	calm.Advance(100 * time.Millisecond)
	calmMoved := calm.BorderPhase()

	hot := full(80, 40, 16)
	hot.Handle([]game.Event{{Kind: game.GameOver}})
	hot.Advance(100 * time.Millisecond)
	if hot.BorderPhase() <= calmMoved {
		t.Errorf("an excited border should cycle faster: %v vs %v", hot.BorderPhase(), calmMoved)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run Border -v`
Expected: FAIL — `undefined: (*World).BorderPhase`.

- [ ] **Step 3: Implement `border.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/border.go internal/fx/border_test.go
git commit -m "feat(fx): border energy state and colour phase"
```

---

### Task 4: Piece trails

**Files:**
- Create: `internal/fx/trail.go`
- Test: `internal/fx/trail_test.go`

**Interfaces:**
- Consumes: Task 1's `World`, `game.Event` (`PieceMoved`, `PieceSoftDropped`, `PieceHardDropped`, `Cells`, `Piece`, `Distance`).
- Produces:
  - ```go
    type Trail struct {
        BX, BY int              // logical board cell
        Kind   game.PieceKind
        Age    time.Duration
        Life   time.Duration
    }
    func (w *World) Trails() []Trail
    func (t Trail) Stage() int // 0,1,2 by Age/Life thirds: ▓ ▒ ░
    ```
  - Pinned tuning: normal trail life `140ms`; hard-drop trail life `220ms` and emitted for **every** cell the piece crossed (§18's vertical ion trail), reconstructed from the landing cells and `Distance`. Trails are keyed by board cell; a newer trail on the same cell replaces the older one. Cap the live trail count at `256`, dropping the oldest.

- [ ] **Step 1: Write the failing test**

`internal/fx/trail_test.go`:

```go
package fx

import (
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func movedEvent(p game.Piece) game.Event {
	return game.Event{Kind: game.PieceMoved, Piece: p, Cells: p.Cells()}
}

func TestMovementLeavesATrail(t *testing.T) {
	w := full(80, 40, 21)
	p := game.Piece{Kind: game.KindT, Rotation: 0, X: 3, Y: 8}
	w.Handle([]game.Event{movedEvent(p)})
	if len(w.Trails()) == 0 {
		t.Fatal("a move produced no trail")
	}
	for _, tr := range w.Trails() {
		if tr.Kind != game.KindT {
			t.Errorf("trail carries kind %v want T", tr.Kind)
		}
	}
}

func TestTrailsExpireWithinTheSpecifiedWindow(t *testing.T) {
	w := full(80, 40, 22)
	w.Handle([]game.Event{movedEvent(game.Piece{Kind: game.KindI, X: 3, Y: 8})})
	w.Advance(90 * time.Millisecond)
	if len(w.Trails()) == 0 {
		t.Error("trails should still be alive at 90ms (spec: 100-160ms)")
	}
	w.Advance(150 * time.Millisecond)
	if n := len(w.Trails()); n != 0 {
		t.Errorf("%d trails alive after 240ms; the window is ~100-160ms", n)
	}
}

func TestHardDropTrailIsStrongerAndCoversTheWholePath(t *testing.T) {
	w := full(80, 40, 23)
	landing := game.Piece{Kind: game.KindO, Rotation: 0, X: 4, Y: 18}
	w.Handle([]game.Event{{
		Kind: game.PieceHardDropped, Piece: landing, Cells: landing.Cells(), Distance: 12,
	}})
	trails := w.Trails()
	if len(trails) < 12 {
		t.Fatalf("a 12-cell hard drop left only %d trail cells", len(trails))
	}
	rows := map[int]bool{}
	longest := time.Duration(0)
	for _, tr := range trails {
		rows[tr.BY] = true
		if tr.Life > longest {
			longest = tr.Life
		}
	}
	if len(rows) < 12 {
		t.Errorf("the ion trail covers only %d distinct rows", len(rows))
	}
	normal := full(80, 40, 23)
	normal.Handle([]game.Event{movedEvent(game.Piece{Kind: game.KindO, X: 4, Y: 8})})
	if longest <= normal.Trails()[0].Life {
		t.Error("hard-drop trails must live longer than movement trails")
	}
}

func TestTrailStageRampsWithAge(t *testing.T) {
	w := full(80, 40, 24)
	w.Handle([]game.Event{movedEvent(game.Piece{Kind: game.KindS, X: 3, Y: 8})})
	stages := map[int]bool{}
	for i := 0; i < 9; i++ {
		for _, tr := range w.Trails() {
			stages[tr.Stage()] = true
		}
		w.Advance(16 * time.Millisecond)
	}
	if len(stages) < 3 {
		t.Errorf("trail fading only reached stages %v; want 0, 1 and 2", stages)
	}
	for s := range stages {
		if s < 0 || s > 2 {
			t.Errorf("stage %d out of range", s)
		}
	}
}

func TestTrailCountIsCapped(t *testing.T) {
	w := full(80, 40, 25)
	for i := 0; i < 400; i++ {
		p := game.Piece{Kind: game.KindZ, X: i % 7, Y: i % 20}
		w.Handle([]game.Event{movedEvent(p)})
	}
	if n := len(w.Trails()); n > 256 {
		t.Fatalf("%d trails alive; the cap is 256", n)
	}
}

func TestNoTrailsWhenFXIsOff(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 26, Intensity: IntensityOff})
	w.Handle([]game.Event{movedEvent(game.Piece{Kind: game.KindL, X: 3, Y: 8})})
	if len(w.Trails()) != 0 {
		t.Error("IntensityOff must not simulate trails")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run Trail -v`
Expected: FAIL — trails are still an empty stub.

- [ ] **Step 3: Implement `trail.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/trail.go internal/fx/trail_test.go
git commit -m "feat(fx): short-lived ion trails, stronger on hard drops"
```

---

### Task 5: Mission Control channel

**Files:**
- Create: `internal/flavor/messages.go`
- Create: `internal/flavor/channel.go`
- Test: `internal/flavor/channel_test.go`

**Interfaces:**
- Consumes: `game.Event`.
- Produces (`messages.go`) — the copy, verbatim from §27 plus §21/§22 where those tasks need it:
  - `var Ambient = []string{...}` containing at least: `GRAVITY REMAINS MOSTLY LEGAL`, `TETROMINO INJECTION SUCCESSFUL`, `STRUCTURAL VIBES: QUESTIONABLE`, `LOCAL UNIVERSE STABLE*`, `* DEFINITION OF STABLE UNDER REVIEW`, `MOON NOTIFIED`, `ORBITAL OSHA HAS ENTERED THE CHAT`, `WE HAVE EXCEEDED THE RECOMMENDED NUMBER OF BLOCKS`, `PHYSICS TEAM SAYS KEEP GOING`, `NOMINALISH`.
  - `var ComboLines = map[int]string{5: "COMBO 5 // UNAUTHORIZED ORBITAL MANEUVER", 6: "COMBO 6 // STRUCTURAL REALITY FAILURE", 7: "COMBO 7 // NASA DENIES EVERYTHING"}` and `func ComboLine(n int) string` for `n > 7` (reuse the 7 line).
  - `var LevelSubtitles = []string{"GRAVITY TAX INCREASED", "LOCAL PHYSICS UPDATED WITHOUT CONSENT", "PLEASE SECURE ALL LOOSE TETROMINOES"}`.
  - `var FourLineBanners = []string{"✦ EVENT HORIZON ✦", "QUADRUPLE COSMIC INCIDENT", "FOUR ROWS HAVE LEFT THE CHAT", "SPACE-TIME HAS FILED A COMPLAINT"}`.
- Produces (`channel.go`):
  - ```go
    type Priority int
    const (PrioAmbient Priority = iota; PrioRoutine; PrioCombo; PrioBig)

    type Channel struct { /* unexported */ }
    func NewChannel(rng *rand.Rand) *Channel
    func (c *Channel) Handle(evs []game.Event)
    func (c *Channel) Advance(dt time.Duration)
    func (c *Channel) Message() string
    func (c *Channel) Say(msg string, p Priority) // used by Plans 04-05 for one-offs
    ```
  - `const MinDwell = 2500 * time.Millisecond`, `const AmbientAfter = 9 * time.Second`.
  - Preemption rule: a new message replaces the current one only when its priority is **higher**, or the current message has been shown for at least `MinDwell`. Event mapping: `LevelChanged` → `PrioBig` with a `LevelSubtitles` pick; `LinesCleared` with 4 rows → `PrioBig`; `ComboChanged` with `combo >= 2` → `PrioCombo`; `PieceLocked`/`LinesCleared` (1–3 rows) → `PrioRoutine` ambient pick; nothing for moves and rotations. After `AmbientAfter` with no message change, pick a fresh `Ambient` line at `PrioAmbient`.

- [ ] **Step 1: Write the failing test**

`internal/flavor/channel_test.go`:

```go
package flavor

import (
	"math/rand"
	"strings"
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func chn(seed int64) *Channel { return NewChannel(rand.New(rand.NewSource(seed))) }

func TestChannelStartsWithSomethingToSay(t *testing.T) {
	c := chn(1)
	if strings.TrimSpace(c.Message()) == "" {
		t.Fatal("mission control should open with a line, not silence")
	}
}

// Review focus 4: messages must get time to breathe.
func TestLowPriorityEventsCannotFlickerTheLine(t *testing.T) {
	c := chn(2)
	c.Handle([]game.Event{{Kind: game.PieceLocked}})
	first := c.Message()
	for i := 0; i < 20; i++ {
		c.Advance(50 * time.Millisecond) // 1s total, well under MinDwell
		c.Handle([]game.Event{{Kind: game.PieceLocked}})
		if c.Message() != first {
			t.Fatalf("message changed after %dms: %q -> %q", (i+1)*50, first, c.Message())
		}
	}
	c.Advance(MinDwell)
	c.Handle([]game.Event{{Kind: game.PieceLocked}})
	if c.Message() == first {
		t.Error("after the dwell time a routine event should be allowed to change the line")
	}
}

func TestBigEventsPreemptImmediately(t *testing.T) {
	c := chn(3)
	c.Handle([]game.Event{{Kind: game.PieceLocked}})
	routine := c.Message()
	c.Advance(100 * time.Millisecond)
	c.Handle([]game.Event{{Kind: game.LevelChanged, Level: 8}})
	if c.Message() == routine {
		t.Fatal("a level change must preempt a routine line")
	}
	got := c.Message()
	found := false
	for _, s := range LevelSubtitles {
		if got == s {
			found = true
		}
	}
	if !found {
		t.Errorf("level-up line %q is not one of the §22 subtitles", got)
	}
}

func TestComboLinesAppearFromComboTwoUp(t *testing.T) {
	c := chn(4)
	c.Handle([]game.Event{{Kind: game.ComboChanged, Combo: 1}})
	c.Advance(3 * time.Second)
	solo := c.Message()
	c.Handle([]game.Event{{Kind: game.ComboChanged, Combo: 5}})
	if c.Message() == solo {
		t.Fatal("combo 5 should have something to say")
	}
	if !strings.Contains(c.Message(), "COMBO 5") {
		t.Errorf("got %q, want the §21 combo-5 line", c.Message())
	}
}

func TestComboLineForHighCombosReusesTheTopLine(t *testing.T) {
	if got, want := ComboLine(12), ComboLine(7); got != want {
		t.Errorf("ComboLine(12) = %q want %q", got, want)
	}
	if ComboLine(1) != "" {
		t.Errorf("combo 1 should have no line, got %q", ComboLine(1))
	}
}

func TestFourLineClearPreempts(t *testing.T) {
	c := chn(5)
	c.Handle([]game.Event{{Kind: game.PieceLocked}})
	before := c.Message()
	c.Handle([]game.Event{{Kind: game.LinesCleared, Rows: []int{18, 19, 20, 21}}})
	if c.Message() == before {
		t.Error("a four-line clear must preempt")
	}
}

func TestAmbientLineArrivesAfterALongQuietStretch(t *testing.T) {
	c := chn(6)
	c.Handle([]game.Event{{Kind: game.PieceLocked}})
	first := c.Message()
	changed := false
	for i := 0; i < 40; i++ {
		c.Advance(500 * time.Millisecond)
		if c.Message() != first {
			changed = true
			break
		}
	}
	if !changed {
		t.Errorf("mission control went silent for 20s on %q", first)
	}
}

func TestSayRespectsPriority(t *testing.T) {
	c := chn(7)
	c.Say("BIG NEWS", PrioBig)
	c.Say("small news", PrioAmbient)
	if c.Message() != "BIG NEWS" {
		t.Errorf("got %q; a low-priority Say must not interrupt", c.Message())
	}
}

func TestEveryPinnedSpecLineIsPresent(t *testing.T) {
	joined := strings.Join(Ambient, "\n")
	for _, want := range []string{
		"GRAVITY REMAINS MOSTLY LEGAL", "TETROMINO INJECTION SUCCESSFUL",
		"STRUCTURAL VIBES: QUESTIONABLE", "LOCAL UNIVERSE STABLE*",
		"MOON NOTIFIED", "ORBITAL OSHA HAS ENTERED THE CHAT",
		"WE HAVE EXCEEDED THE RECOMMENDED NUMBER OF BLOCKS", "PHYSICS TEAM SAYS KEEP GOING",
	} {
		if !strings.Contains(joined, want) {
			t.Errorf("ambient copy is missing %q", want)
		}
	}
	if len(FourLineBanners) < 4 {
		t.Errorf("only %d four-line banners; §20 lists four", len(FourLineBanners))
	}
}

func TestChannelIsReproducibleForASeed(t *testing.T) {
	run := func() []string {
		c := chn(8)
		out := []string{}
		for i := 0; i < 20; i++ {
			c.Advance(600 * time.Millisecond)
			c.Handle([]game.Event{{Kind: game.PieceLocked}})
			out = append(out, c.Message())
		}
		return out
	}
	a, b := run(), run()
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("step %d differs: %q vs %q", i, a[i], b[i])
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/flavor/ -v`
Expected: FAIL — `undefined: NewChannel`.

- [ ] **Step 3: Implement `messages.go` and `channel.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/flavor/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/flavor internal/flavor/channel_test.go
git commit -m "feat(flavor): mission control channel with dwell time and priorities"
```

---

### Task 6: Draw the universe — render integration

**Files:**
- Create: `internal/render/fxdraw.go`
- Modify: `internal/render/render.go` (`Frame` gains FX fields; §37 steps 2 and 6 become real)
- Modify: `internal/render/palette.go` (border colour ramp)
- Test: `internal/render/fxdraw_test.go`
- Modify: `internal/render/golden_test.go` (add two FX goldens)

**Interfaces:**
- Consumes: `fx.Star`, `fx.Trail`, `Canvas`, `Mode`.
- Produces:
  - `func DrawStarfield(c *Canvas, stars []fx.Star, m Mode)` — §37 step 2, before anything else; a star is skipped if the target cell is already non-blank.
  - `func DrawTrails(c *Canvas, frame Rect, trails []fx.Trail, m Mode)` — §37 step 6; maps board cells with `BoardCellXY`, and **skips any cell whose current rune is not a space**, so trails can never cover a locked or active block (§44).
  - `func BorderPaint(phase, energy float64, m Mode) Paint` — §25's palette: deep violet `#7a2bff`, electric cyan `#22f0ff`, magenta `#ff2ee6`, stellar blue `#2b6bff`, hot white `#f2f6ff`; `phase` interpolates around the ring by picking the nearest stop (no per-cell gradient yet — Plan 04 adds the travelling pulse), and `energy > 0.6` sets `Bold`.
  - `func StarPaint(s fx.Star, m Mode) Paint` — brightness bands: `< 0.4` → faint grey `#5a6480`; `< 0.7` → `#9aa6c4`; else `#e6ecff` bold.
  - `Frame` gains: `Stars []fx.Star`, `Trails []fx.Trail`, `NoFX bool`. All are optional; a zero `Frame` renders the game with no FX at all.

- [ ] **Step 1: Write the failing test**

`internal/render/fxdraw_test.go`:

```go
package render

import (
	"strings"
	"testing"
	"time"
	"unicode"

	"github.com/jessev/cosmic-tetris/internal/fx"
	"github.com/jessev/cosmic-tetris/internal/game"
)

func TestStarfieldDrawsBehindEverything(t *testing.T) {
	c := NewCanvas(10, 3)
	c.Set(5, 1, '█', Paint{})
	DrawStarfield(c, []fx.Star{
		{X: 5, Y: 1, Glyph: '✦', Bright: 1},
		{X: 2, Y: 2, Glyph: '.', Bright: 0.2},
	}, ModeFull)
	if c.Rune(5, 1) != '█' {
		t.Error("a star overwrote existing content")
	}
	if c.Rune(2, 2) != '.' {
		t.Errorf("star not drawn on a blank cell: %q", c.Rune(2, 2))
	}
}

func TestStarsOutsideTheCanvasAreIgnored(t *testing.T) {
	c := NewCanvas(4, 2)
	DrawStarfield(c, []fx.Star{{X: -3, Y: -3, Glyph: '*'}, {X: 99, Y: 99, Glyph: '*'}}, ModeFull)
	if strings.Contains(plain(c.String()), "*") {
		t.Error("an off-canvas star was drawn")
	}
}

// §44: effects may never obscure the board.
func TestTrailsNeverCoverBoardCells(t *testing.T) {
	r := Rect{X: 0, Y: 0, W: FrameCols, H: FrameRows}
	var b game.Board
	b.Set(4, 10, game.CellFor(game.KindI))
	active := game.Piece{Kind: game.KindO, Rotation: 0, X: 6, Y: 12}
	c := NewCanvas(FrameCols, FrameRows)
	DrawBoard(c, r, BoardView{Board: &b, Active: active, ShowActive: true}, ModeFull, Paint{})
	trails := []fx.Trail{
		{BX: 4, BY: 10, Kind: game.KindZ, Life: 140_000_000},
		{BX: 7, BY: 12, Kind: game.KindZ, Life: 140_000_000},
		{BX: 2, BY: 15, Kind: game.KindZ, Life: 140_000_000},
	}
	DrawTrails(c, r, trails, ModeFull)
	for _, cell := range [][2]int{{4, 10}, {7, 12}} {
		x, y := BoardCellXY(r, cell[0], cell[1])
		if c.Rune(x, y) != '█' {
			t.Errorf("trail covered the block at %v: %q", cell, c.Rune(x, y))
		}
	}
	x, y := BoardCellXY(r, 2, 15)
	if c.Rune(x, y) == ' ' {
		t.Error("a trail on an empty cell should have been drawn")
	}
}

func TestTrailGlyphsFadeAndAreASCIISafe(t *testing.T) {
	r := Rect{W: FrameCols, H: FrameRows}
	seen := map[rune]bool{}
	for stage := 0; stage < 3; stage++ {
		c := NewCanvas(FrameCols, FrameRows)
		trails := []fx.Trail{{
			BX: 3, BY: 12, Kind: game.KindI,
			Life: 300 * time.Millisecond,
			Age:  time.Duration(stage) * 100 * time.Millisecond,
		}}
		DrawTrails(c, r, trails, ModeFull)
		x, y := BoardCellXY(r, 3, 12)
		seen[c.Rune(x, y)] = true
	}
	if len(seen) < 2 {
		t.Errorf("trail glyphs did not change with age: %v", seen)
	}
	c := NewCanvas(FrameCols, FrameRows)
	DrawTrails(c, r, []fx.Trail{{BX: 3, BY: 12, Kind: game.KindI, Life: 300 * time.Millisecond}}, ModeASCII)
	for _, ru := range plain(c.String()) {
		if ru > unicode.MaxASCII {
			t.Fatalf("ascii mode trail emitted %q", ru)
		}
	}
}

func TestBorderPaintWalksThePaletteAndBrightensWithEnergy(t *testing.T) {
	seen := map[string]bool{}
	for i := 0; i < 10; i++ {
		seen[BorderPaint(float64(i)/10, 0, ModeFull).FG] = true
	}
	if len(seen) < 3 {
		t.Errorf("the border only used %d colours across a full cycle: %v", len(seen), seen)
	}
	if BorderPaint(0, 0, ModeFull).Bold {
		t.Error("a calm border should not be bold")
	}
	if !BorderPaint(0, 1, ModeFull).Bold {
		t.Error("a fully excited border should be bold")
	}
	if got := BorderPaint(0, 1, ModeASCII).FG; got == "" {
		t.Error("ascii mode still needs some border colour")
	}
}

func TestStarPaintDimsFarStars(t *testing.T) {
	far := StarPaint(fx.Star{Bright: 0.25}, ModeFull)
	near := StarPaint(fx.Star{Bright: 0.9}, ModeFull)
	if far.FG == near.FG {
		t.Error("far and near stars should not share a colour")
	}
	if !near.Bold || far.Bold {
		t.Errorf("near stars should be bold and far stars should not: %+v / %+v", near, far)
	}
}

// Review focus 1: the --no-fx path.
func TestFrameWithNoFXDataRendersFine(t *testing.T) {
	f := frameFor(80, 40, ModeFull, OverlayNone)
	f.NoFX = true
	f.Stars, f.Trails = nil, nil
	out := plain(Render(f))
	if !strings.Contains(out, "COSMIC TETRIS") {
		t.Error("the game should still render with FX off")
	}
	// The board's own ghost still uses ░, so only star glyphs are checked here.
	for _, glyph := range []string{"✦", "✧", "˚", "·"} {
		if strings.Contains(out, glyph) {
			t.Errorf("star glyph %q appeared with FX disabled", glyph)
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestStar|TestTrail|TestBorderPaint|TestFrameWithNoFX' -v`
Expected: FAIL — `undefined: DrawStarfield`.

- [ ] **Step 3: Implement `fxdraw.go` and extend `render.go`**

In `Render`, §37 step 2 draws the starfield across the whole canvas first; step 6 draws trails after the active piece and before the border. Neither may run when `f.NoFX` is set.

- [ ] **Step 4: Run the tests, then add and inspect two FX goldens**

Add to the `TestGoldenLayouts` table in `golden_test.go` two cases built from a frame with a fixed star list and trail list (construct them literally in the test — never from a live `fx.World`, whose tuning will keep changing): `{"wide_fx", 80, 40, ModeFull, OverlayNone}` and `{"ascii_fx", 80, 40, ModeASCII, OverlayNone}`.

Run: `go test ./internal/render/ -update && go test ./internal/render/ && cat internal/render/testdata/wide_fx.txt`
Expected: PASS, and the recorded frame shows stars around the board with the well itself unpolluted.

- [ ] **Step 5: Commit**

```bash
git add internal/render/fxdraw.go internal/render/render.go internal/render/palette.go internal/render/fxdraw_test.go internal/render/golden_test.go internal/render/testdata
git commit -m "feat(render): draw starfield, trails, and the energy border"
```

---

### Task 7: Wire FX into the app, with RNG isolation proven

**Files:**
- Modify: `internal/app/model.go`, `internal/app/update.go`
- Test: `internal/app/fx_test.go`

**Interfaces:**
- Consumes: `fx.World`, `flavor.Channel`, the render additions.
- Produces:
  - `Model` gains `FX *fx.World` (nil when `--no-fx`) and `Chan *flavor.Channel`.
  - `func NewModel(cfg Config, mode render.Mode, seed int64) *Model` now also builds, unless `cfg.NoFX`:
    - `fx.NewWorld(0, 0, fx.Options{Seed: seed ^ 0x5DEECE66D, Intensity: intensityFor(cfg), ASCII: mode == render.ModeASCII, Level: 1})`
    - `flavor.NewChannel(rand.New(rand.NewSource(seed ^ 0x2545F4914F6CDD1D)))`
  - `func intensityFor(cfg Config) fx.Intensity` — `IntensityOff` when `NoFX`, `IntensityReduced` when `ReducedMotion`, else `IntensityFull`.
  - Per frame, in this order: advance the game and collect events → `FX.Handle(events)` and `Chan.Handle(events)` → `FX.Advance(dt)` and `Chan.Advance(dt)` → `FX.SetLevel(m.Game.Level)`. On `WindowSizeMsg`, `FX.Resize(w, h)` and `FX.SetBoardRect(...)` from the fresh layout. `View()` fills `Frame.Stars`, `Frame.Trails`, `Frame.Border = render.BorderPaint(FX.BorderPhase(), FX.BorderEnergy(), mode)`, and `Frame.Mission = Chan.Message()`. With `--no-fx`, `Frame.NoFX` is true, the FX fields stay nil, `Frame.Border` is a fixed chrome paint, and `Frame.Mission` is empty.

- [ ] **Step 1: Write the failing test**

`internal/app/fx_test.go`:

```go
package app

import (
	"strings"
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"
	"github.com/jessev/cosmic-tetris/internal/fx"
	"github.com/jessev/cosmic-tetris/internal/render"
)

// modelWith builds an 80x40 model that honours the config, so later plans can
// reuse it for --ascii and --seed cases.
func modelWith(t *testing.T, cfg Config) *Model {
	t.Helper()
	mode := render.ModeFull
	if cfg.ASCII {
		mode = render.ModeASCII
	}
	seed := cfg.Seed
	if seed == 0 {
		seed = 4242
	}
	m := NewModel(cfg, mode, seed)
	next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 40})
	return next.(*Model)
}

// Review focus 5: FX must not perturb the game.
func TestPieceOrderIsIdenticalAcrossFXModes(t *testing.T) {
	play := func(cfg Config) (int, int, uint64, string) {
		m := modelWith(t, cfg)
		for i := 0; i < 120; i++ {
			switch i % 5 {
			case 0:
				m = press(t, m, "h")
			case 1:
				m = press(t, m, "l")
			case 2:
				m = press(t, m, "k")
			case 3:
				m = press(t, m, " ")
			}
			next, _ := m.Update(FrameMsg{Now: time.Unix(0, 0).Add(time.Duration(i) * 20 * time.Millisecond)})
			m = next.(*Model)
		}
		return m.Game.Score, m.Game.Lines, m.Game.Board.Fingerprint(), m.Game.Active.Kind.String()
	}
	full := play(Config{Seed: 4242})
	reduced := play(Config{Seed: 4242, ReducedMotion: true})
	off := play(Config{Seed: 4242, NoFX: true})
	if full != reduced || full != off {
		t.Fatalf("FX changed the game:\n full=%v\n reduced=%v\n off=%v", full, reduced, off)
	}
}

func TestFXSeedIsNotTheGameSeed(t *testing.T) {
	m := modelWith(t, Config{Seed: 4242})
	if m.FX == nil {
		t.Fatal("FX world missing")
	}
	if m.Game.Seed != 4242 {
		t.Errorf("game seed = %d want 4242", m.Game.Seed)
	}
	// Two worlds seeded the same way must agree; a world seeded with the raw
	// game seed must not (that would mean the derivation was skipped).
	a := fx.NewWorld(80, 40, fx.Options{Seed: 4242 ^ 0x5DEECE66D, Intensity: fx.IntensityFull})
	b := fx.NewWorld(80, 40, fx.Options{Seed: 4242, Intensity: fx.IntensityFull})
	if len(a.Stars()) == 0 || len(b.Stars()) == 0 {
		t.Fatal("stars missing")
	}
	if a.Stars()[0] == b.Stars()[0] {
		t.Error("the FX seed derivation is not being applied")
	}
}

// Review focus 1: nil FX everywhere.
func TestNoFXModelNeverTouchesANilWorld(t *testing.T) {
	m := modelWith(t, Config{Seed: 7, NoFX: true})
	if m.FX != nil {
		t.Fatal("--no-fx should not build an FX world")
	}
	for i := 0; i < 50; i++ {
		m = press(t, m, []string{"h", "l", " ", "c", "p", "p", "?", "?"}[i%8])
		next, _ := m.Update(FrameMsg{Now: time.Unix(0, 0).Add(time.Duration(i) * 30 * time.Millisecond)})
		m = next.(*Model)
		next, _ = m.Update(tea.WindowSizeMsg{Width: 40 + i%60, Height: 24 + i%20})
		m = next.(*Model)
		_ = m.View() // must not panic
	}
}

func TestFXWorldTracksTerminalSizeAndLevel(t *testing.T) {
	m := modelWith(t, Config{Seed: 8})
	if c, r := m.FX.Size(); c != 80 || r != 40 {
		t.Errorf("FX size = %dx%d, want the terminal size", c, r)
	}
	m.Game.Level = 9
	next, _ := m.Update(FrameMsg{Now: time.Unix(0, 0).Add(20 * time.Millisecond)})
	m = next.(*Model)
	if m.FX.StarSpeedScale() <= 1 {
		t.Error("FX did not learn the new level")
	}
}

func TestMissionControlAppearsInTheView(t *testing.T) {
	m := modelWith(t, Config{Seed: 9})
	out := plainOut(m.View())
	if !strings.Contains(out, "MISSION CONTROL") {
		t.Errorf("mission control line missing:\n%s", out)
	}
	quiet := modelWith(t, Config{Seed: 9, NoFX: true})
	if strings.Contains(plainOut(quiet.View()), "MISSION CONTROL") {
		t.Error("--no-fx should not narrate")
	}
}

func TestStarsAppearInTheViewOverTime(t *testing.T) {
	m := modelWith(t, Config{Seed: 10})
	before := plainOut(m.View())
	for i := 0; i < 30; i++ {
		next, _ := m.Update(FrameMsg{Now: time.Unix(0, 0).Add(time.Duration(i) * 40 * time.Millisecond)})
		m = next.(*Model)
	}
	if plainOut(m.View()) == before {
		t.Error("the terminal is not alive: 1.2s passed and nothing on screen moved")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/app/ -v`
Expected: FAIL — `m.FX` undefined.

- [ ] **Step 3: Wire it up in `model.go` and `update.go`**

- [ ] **Step 4: Run everything**

Run: `go test ./... -race && make lint`
Expected: PASS.

- [ ] **Step 5: Play all three modes**

```bash
make build
./cosmic-tetris --seed 8675309          # stars drift, border breathes, trails follow pieces, mission control talks
./cosmic-tetris --seed 8675309 --no-fx  # still a good game, no narration, no stars
./cosmic-tetris --seed 8675309 --ascii  # same universe, ASCII glyphs
```

Check by hand: the board is never harder to read than it was in Plan 02; mission control does not flicker; stars visibly speed up as the level climbs.

- [ ] **Step 6: Commit**

```bash
git add internal/app/model.go internal/app/update.go internal/app/fx_test.go
git commit -m "feat(app): wire the FX world and mission control, with isolated RNGs"
```

---

## Done when

- `make test` passes with `-race`.
- The same seed and input sequence produce a byte-identical game with FX off, reduced, and full.
- `internal/fx` imports only the standard library and `internal/game`, holds no `*game.Game`, and has no method that could mutate one.
- Starting the game and touching nothing shows a moving starfield, a slowly shifting border, and mission-control commentary — three of §43's six first-thirty-seconds items, with trails making a fourth as soon as the player moves.
- `--no-fx` renders and plays with a nil FX world at every call site.
