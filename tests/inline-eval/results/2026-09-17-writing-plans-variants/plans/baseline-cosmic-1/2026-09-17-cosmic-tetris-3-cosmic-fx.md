# Cosmic Tetris — Plan 3: Cosmic FX

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the playable game from Plan 2 ridiculous: a drifting starfield, an animated border, ion trails, hard-drop impact with shake and debris, supernova line clears, hyperdrive, shockwaves, banners, mission-control commentary, a boot sequence, and a black-hole game over — all of it a separate simulation that observes the engine and never touches it.

**Architecture:** `internal/fx` holds a `World`: its own RNG, its own clock advanced by `Advance(dt)`, and state for stars, particles, trails, shake, hyperdrive, clears, banners, shockwaves, and the game-over collapse. It learns what happened by `Observe([]game.Event)` and draws through the three `render.Hook` slots on `render.Scene`, so `render` still knows nothing about it. `internal/flavor` owns the mission-control text on its own RNG. `internal/app` wires them together and gates them on `--no-fx` and `--reduced-motion`.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2` v2.0.9, `charm.land/lipgloss/v2` v2.0.6, `math/rand/v2`.

**Spec:** `design.md`. Sections implemented here: §14, §15, §16, §17, §18, §19, §20, §21, §22, §23, §24, §25 (animation), §27, §28 (animation), §29, §38, §43, §44, §45, §49.5, §49.6.

**Prerequisite:** Plans 1 and 2 complete. `go test ./... -race` is green and the golden files exist.

## Global Constraints

- The FX simulation may observe game events. It may **never** modify game state (§14). `internal/fx` gets a `*game.Game` for reading only, and never calls a mutating method on it.
- `fx.World` holds its own `*rand.Rand`, independent of the engine's (§49.6). Crossing them would make piece order depend on particle counts.
- Restraint rules (§44), all of them testable and all of them enforced by tests in this plan:
  - Never obscure the active piece.
  - Never make controls lag.
  - Never delay gameplay for animation.
  - Never require reading flavor text.
  - Never use random effects that alter gameplay.
  - Never make screen shake exceed roughly one cell.
  - Never allow particles to permanently alter the rendered board.
  - Never let comedy overwhelm playability.
- Performance (§38): no goroutine per particle, no goroutine per frame, no filesystem access or logging during gameplay. Reuse slices. A few hundred particles must be trivial — the cap is `MaxParticles = 400`.
- Timings, pinned: shake ≈80ms on the pattern `(0,+1) (-1,0) (+1,0) (0,-1) (0,0)`; hyperdrive `0 / 50 / 100 / 500 / 800 / 1100ms`; line clear ≈220ms in phases A `0–70ms`, B `70–150ms`, C `150–220ms`; banner ≈700ms; shockwave ≈300ms; trail lifetime 100–160ms; game-over `0–300 / 300–900 / 900–1300ms`; boot ≈1s.
- Star glyphs `. · ˚ ✦ ✧ *` in three depth layers; particles `· * ✦ +`; trail shades `▓ ▒ ░`; shockwave rings `· ○ ◌ ◯`. In ASCII mode every one of these falls back to 7-bit characters.
- `--reduced-motion` suppresses screen shake, hyperdrive acceleration, and shockwaves, and leaves colour, trails, and particles alone (§49.5).
- `--no-fx` disables the FX world entirely. With `--no-fx`, the Plan 2 golden files must still pass unchanged.
- Effects need only lightweight behavioural tests (§40). Do not pixel-test particle positions across an animation. Test invariants: counts, bounds, caps, "did anything happen", "did nothing happen when it shouldn't".

## Review Focus

1. **Sustained tetrises and long combos** must not grow the particle slice without bound or slow the frame; the cap has to hold under repeated large events, not just one. → Task 3.
2. **A resize to the minimum size mid-animation** must not leave particles, stars, or shockwaves drawing outside the new grid or carrying stale coordinates. → Tasks 2, 3, and 15.
3. **Screen shake at the board edges** must stay within roughly one cell and must never push the board outside the terminal or over the HUD. → Task 6.
4. **The same input stream with FX on and FX off** must produce byte-identical game state — the FX RNG must not be able to reach the engine. → Tasks 1 and 15.
5. **Pause** must freeze gameplay particles and animations while background stars keep drifting slowly (§30), and resuming must not dump the paused interval into the simulation. → Task 2.

---

### Task 1: The FX world, wired in and proven independent

**Files:**
- Create: `internal/fx/fx.go`
- Test: `internal/fx/fx_test.go`
- Modify: `internal/game/game.go` (export `DrainEvents`)
- Modify: `internal/app/model.go` (own a world, feed it, draw through it)
- Test: `internal/app/fx_wiring_test.go`

**Interfaces:**
- Consumes: `game.Event`, `game.Game`, `render.Grid`, `render.Layout`, `render.Palette`, `render.Style`.
- Produces:
  - `type Intensity struct { Enabled, ReducedMotion bool; Small bool }` — `Small` is set by the app for terminals in the small size class.
  - `type Rect struct { X, Y, W, H int }`, `func (r Rect) Contains(x, y int) bool`
  - `const MaxParticles = 400`
  - `type World struct { Paused bool }` (everything else unexported) with:
    - `func New(seed int64, in Intensity) *World`
    - `func (w *World) SetViewport(view, board Rect)`
    - `func (w *World) SetLevel(level int)`
    - `func (w *World) Observe(events []game.Event)`
    - `func (w *World) Advance(dt time.Duration)`
    - `func (w *World) Elapsed() time.Duration`
    - `func (w *World) ShakeOffset() (dx, dy int)`
    - `func (w *World) BorderStyle(p *render.Palette) *render.Style`
    - `func (w *World) DrawBackground(g *render.Grid, l render.Layout, p *render.Palette)`
    - `func (w *World) DrawBoardFX(g *render.Grid, l render.Layout, p *render.Palette)`
    - `func (w *World) DrawGlobalFX(g *render.Grid, l render.Layout, p *render.Palette)`
    - `func (w *World) ParticleCount() int`
  - `func (g *game.Game) DrainEvents() []game.Event`

Every drawing method matches `render.Hook`, so the app assigns them straight into the scene. This task ships stubs that do nothing but keep time; later tasks fill them in. That keeps the wiring reviewable on its own and keeps the Plan 2 golden files green.

- [ ] **Step 1: Write the failing test**

Create `internal/fx/fx_test.go`:

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

func testWorld() *World {
	w := New(7, Intensity{Enabled: true})
	w.SetViewport(Rect{0, 0, 80, 30}, Rect{X: 24, Y: 5, W: 20, H: 20})
	return w
}

func TestRectContains(t *testing.T) {
	r := Rect{X: 2, Y: 3, W: 4, H: 5}
	for _, tc := range []struct {
		x, y int
		want bool
	}{{2, 3, true}, {5, 7, true}, {1, 3, false}, {6, 3, false}, {2, 8, false}} {
		if got := r.Contains(tc.x, tc.y); got != tc.want {
			t.Errorf("Contains(%d,%d) = %v, want %v", tc.x, tc.y, got, tc.want)
		}
	}
}

func TestAdvanceAccumulatesTime(t *testing.T) {
	w := testWorld()
	w.Advance(20 * time.Millisecond)
	w.Advance(30 * time.Millisecond)
	if got := w.Elapsed(); got != 50*time.Millisecond {
		t.Errorf("Elapsed = %v, want 50ms", got)
	}
}

func TestAdvanceIgnoresNonPositiveDeltas(t *testing.T) {
	w := testWorld()
	w.Advance(-5 * time.Second)
	w.Advance(0)
	if got := w.Elapsed(); got != 0 {
		t.Errorf("Elapsed = %v, want 0", got)
	}
}

func TestDisabledWorldDoesNothing(t *testing.T) {
	w := New(1, Intensity{Enabled: false})
	w.SetViewport(Rect{0, 0, 80, 30}, Rect{X: 24, Y: 5, W: 20, H: 20})
	w.Observe([]game.Event{{Kind: game.EventPieceHardDropped, Count: 8}})
	w.Advance(500 * time.Millisecond)

	if n := w.ParticleCount(); n != 0 {
		t.Errorf("disabled world holds %d particles", n)
	}
	dx, dy := w.ShakeOffset()
	if dx != 0 || dy != 0 {
		t.Errorf("disabled world shakes by (%d,%d)", dx, dy)
	}
	g := render.NewGrid(80, 30)
	l := render.Compute(80, 30)
	p := render.NewPalette(render.ModeFull)
	w.DrawBackground(g, l, p)
	w.DrawBoardFX(g, l, p)
	w.DrawGlobalFX(g, l, p)
	if g.Render() != blankRender(80, 30) {
		t.Error("disabled world drew something")
	}
	if st := w.BorderStyle(p); st != p.Border {
		t.Error("disabled world overrode the border style")
	}
}

func blankRender(w, h int) string {
	return render.NewGrid(w, h).Render()
}

func TestObserveNeverTouchesTheGame(t *testing.T) {
	w := testWorld()
	gm := game.New(3)
	before := *gm
	evs := gm.Advance(2 * time.Second)
	w.Observe(evs)
	w.Advance(time.Second)
	if gm.Score != before.Score+scoreDelta(before, *gm) {
		t.Skip("engine changed the score itself; this test only guards the FX path")
	}
	after := *gm
	w.Observe(evs)
	w.Advance(time.Second)
	if *gm != after {
		t.Error("the FX world mutated the game")
	}
}

func scoreDelta(before, after game.Game) int { return after.Score - before.Score }

// Review Focus item 4: the FX RNG must be reachable only from fx.
func TestFXRNGIsIndependentOfTheEngine(t *testing.T) {
	// Two identical games, one paired with a world that consumes a great deal
	// of randomness, one with no world at all. The games must agree exactly.
	quiet := game.New(4242)
	loud := game.New(4242)
	w := testWorld()

	for i := 0; i < 300; i++ {
		qe := quiet.Advance(16 * time.Millisecond)
		le := loud.Advance(16 * time.Millisecond)
		if len(qe) != len(le) {
			t.Fatalf("step %d: event counts diverged", i)
		}
		w.Observe(le)
		w.Advance(16 * time.Millisecond)
		if i%7 == 0 {
			loud.HardDrop()
			quiet.HardDrop()
			w.Observe(loud.DrainEvents())
		}
	}
	if quiet.Score != loud.Score || quiet.Lines != loud.Lines || quiet.Board != loud.Board {
		t.Errorf("FX changed the game: score %d vs %d, lines %d vs %d",
			quiet.Score, loud.Score, quiet.Lines, loud.Lines)
	}
	if quiet.Active != loud.Active {
		t.Error("FX changed the active piece")
	}
}

func TestWorldsWithTheSameSeedAgree(t *testing.T) {
	a, b := New(9, Intensity{Enabled: true}), New(9, Intensity{Enabled: true})
	for _, w := range []*World{a, b} {
		w.SetViewport(Rect{0, 0, 80, 30}, Rect{X: 24, Y: 5, W: 20, H: 20})
		w.Observe([]game.Event{{Kind: game.EventPieceHardDropped, Count: 6}})
		w.Advance(100 * time.Millisecond)
	}
	if a.ParticleCount() != b.ParticleCount() {
		t.Errorf("same seed produced %d and %d particles", a.ParticleCount(), b.ParticleCount())
	}
}

func TestDrawingWithNoViewportSetIsSafe(t *testing.T) {
	w := New(1, Intensity{Enabled: true})
	w.Observe([]game.Event{{Kind: game.EventPieceHardDropped, Count: 4}})
	w.Advance(50 * time.Millisecond)
	g := render.NewGrid(0, 0)
	l := render.Compute(0, 0)
	p := render.NewPalette(render.ModeFull)
	w.DrawBackground(g, l, p)
	w.DrawBoardFX(g, l, p)
	w.DrawGlobalFX(g, l, p)
	// Reaching here without a panic is the assertion.
}
```

Create `internal/app/fx_wiring_test.go`:

```go
package app

import (
	"strings"
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"

	"cosmic-tetris/internal/render"
)

func TestFXIsWiredByDefault(t *testing.T) {
	m := New(Options{Seed: 5, Mode: render.ModeFull})
	if m.fx == nil {
		t.Fatal("model has no FX world")
	}
	m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	now := time.Now()
	m.Update(FrameMsg(now))
	m.Update(FrameMsg(now.Add(32 * time.Millisecond)))
	if m.fx.Elapsed() == 0 {
		t.Error("frames did not advance the FX world")
	}
}

func TestNoFXLeavesTheWorldDisabled(t *testing.T) {
	m := New(Options{Seed: 5, Mode: render.ModeFull, NoFX: true})
	m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	now := time.Now()
	for i := 0; i < 30; i++ {
		m.Update(FrameMsg(now.Add(time.Duration(i) * 16 * time.Millisecond)))
	}
	m.Update(press(" "))
	if n := m.fx.ParticleCount(); n != 0 {
		t.Errorf("--no-fx produced %d particles", n)
	}
	snap := m.Snapshot()
	if !strings.Contains(snap, "COSMIC TETRIS") {
		t.Error("--no-fx broke the frame")
	}
}

func TestKeyEventsReachTheFXWorldImmediately(t *testing.T) {
	m := New(Options{Seed: 5, Mode: render.ModeFull})
	m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	m.Update(press(" ")) // hard drop, before any frame has ticked
	if m.fx.ParticleCount() == 0 && m.fx.Elapsed() == 0 {
		t.Log("no particles yet is fine for the stub; the queue must still be drained")
	}
	if evs := m.Game.DrainEvents(); len(evs) != 0 {
		t.Errorf("the model left %d events in the engine queue", len(evs))
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/app/ -v`
Expected: FAIL — `no non-test Go files` in `internal/fx`, `undefined: DrainEvents`, `m.fx undefined`.

- [ ] **Step 3: Export the engine's event queue**

In `internal/game/game.go`, add next to the existing unexported `drain`:

```go
// DrainEvents removes and returns the pending events. Advance returns the
// events it produced; this is how a caller collects the events produced by an
// input method such as MoveLeft or HardDrop, without waiting for the next
// Advance.
func (g *Game) DrainEvents() []Event {
	return g.drain()
}
```

- [ ] **Step 4: Implement the FX skeleton**

Create `internal/fx/fx.go`:

```go
// Package fx is the cosmic effects simulation. It observes game events and
// simulates spectacle. It never modifies game state.
package fx

import (
	"math/rand/v2"
	"time"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

// MaxParticles caps the particle system. A few hundred is trivial for the
// arithmetic and plenty for the eye; the terminal is the bottleneck.
const MaxParticles = 400

// rngStreamFX is the FX generator's second PCG parameter. It differs from the
// engine's so the two streams cannot coincide.
const rngStreamFX = 0xBF58476D1CE4E5B9

// Intensity is how much spectacle the player has asked for.
type Intensity struct {
	// Enabled is false under --no-fx: the world keeps no state and draws
	// nothing.
	Enabled bool

	// ReducedMotion suppresses screen shake, hyperdrive acceleration, and
	// shockwaves. Colour, trails, and particles stay.
	ReducedMotion bool

	// Small is set for terminals in the small size class, where there is not
	// enough room for the full display of weather.
	Small bool
}

// Rect is a region of the terminal in grid cells.
type Rect struct {
	X, Y, W, H int
}

// Contains reports whether (x, y) is inside r.
func (r Rect) Contains(x, y int) bool {
	return x >= r.X && y >= r.Y && x < r.X+r.W && y < r.Y+r.H
}

// World is the effects simulation: its own clock, its own randomness, and no
// authority over the game.
type World struct {
	// Paused freezes gameplay effects. Background stars keep drifting, slowly.
	Paused bool

	in    Intensity
	rng   *rand.Rand
	now   time.Duration
	view  Rect
	board Rect
	level int
}

// New builds a world. The seed is the game's, so a replayed universe looks the
// same, but the generator is entirely separate from the engine's.
func New(seed int64, in Intensity) *World {
	return &World{
		in:    in,
		rng:   rand.New(rand.NewPCG(uint64(seed), rngStreamFX)),
		level: 1,
	}
}

// SetViewport records the screen and the playfield interior, in grid cells. The
// app calls it every frame, before Advance, so a resize takes effect at once.
func (w *World) SetViewport(view, board Rect) {
	w.view, w.board = view, board
}

// SetLevel records the gravity level, which scales star drift.
func (w *World) SetLevel(level int) {
	if level < 1 {
		level = 1
	}
	w.level = level
}

// Elapsed is the world's own clock.
func (w *World) Elapsed() time.Duration { return w.now }

// Observe reacts to what the engine just did. It reads events and nothing else.
func (w *World) Observe(events []game.Event) {
	if !w.in.Enabled {
		return
	}
	for _, e := range events {
		w.observe(e)
	}
}

// observe handles one event. Later tasks fill in the arms.
func (w *World) observe(e game.Event) {
	_ = e
}

// Advance steps the simulation. dt is the same delta the engine received, so
// effects and gameplay stay in step.
func (w *World) Advance(dt time.Duration) {
	if !w.in.Enabled || dt <= 0 {
		return
	}
	w.now += dt
}

// ShakeOffset is the current board offset in cells, at most one cell in each
// direction.
func (w *World) ShakeOffset() (dx, dy int) {
	return 0, 0
}

// BorderStyle is the board border's current style. It falls back to the
// palette's when there is nothing to say.
func (w *World) BorderStyle(p *render.Palette) *render.Style {
	return p.Border
}

// ParticleCount is how many particles are alive, for tests and for the cap.
func (w *World) ParticleCount() int { return 0 }

// DrawBackground draws behind the board: stars and other weather.
func (w *World) DrawBackground(g *render.Grid, l render.Layout, p *render.Palette) {}

// DrawBoardFX draws over the pieces: particles, trails, clears, shockwaves.
func (w *World) DrawBoardFX(g *render.Grid, l render.Layout, p *render.Palette) {}

// DrawGlobalFX draws over the HUD: banners and full-screen events.
func (w *World) DrawGlobalFX(g *render.Grid, l render.Layout, p *render.Palette) {}
```

- [ ] **Step 5: Wire the world into the model**

In `internal/app/model.go`, add the field and the plumbing.

Add to the `Model` struct:

```go
	fx *fx.World
```

Add to `New`, after the game is built:

```go
	m := &Model{ /* ... existing fields ... */ }
	m.fx = fx.New(seed, fx.Intensity{
		Enabled:       !opts.NoFX,
		ReducedMotion: opts.ReducedMotion,
	})
	return m
```

In `frame`, feed the world after the engine:

```go
	if m.running() && dt > 0 {
		m.fx.Observe(m.Game.Advance(dt))
	}
	m.syncFX()
	m.fx.Advance(dt)
	return frameTick()
```

Note the ordering: the world advances even when gameplay does not, because §30 keeps the stars drifting while paused. `syncFX` tells it what has changed:

```go
// syncFX hands the world the current viewport, level, and pause state. The
// world reads; it never reaches back.
func (m *Model) syncFX() {
	l := m.layout
	view := fx.Rect{X: 0, Y: 0, W: m.width, H: m.height}
	board := fx.Rect{X: l.InnerX, Y: l.InnerY, W: render.BoardInnerW, H: render.BoardInnerH}
	if l.TooSmall {
		board = fx.Rect{}
	}
	m.fx.SetViewport(view, board)
	m.fx.SetLevel(m.Game.Level)
	m.fx.Paused = m.Paused || m.overlay != overlayNone
	m.fx.Small = m.layout.Size == render.SizeSmall
}
```

`Small` is part of `Intensity`, not a field on `World`, so add a setter to `internal/fx/fx.go` rather than assigning it directly:

```go
// SetSmall records whether the terminal is in the small size class, where the
// weather has to be thinner.
func (w *World) SetSmall(small bool) {
	w.in.Small = small
}
```

and call `m.fx.SetSmall(m.layout.Size == render.SizeSmall)` in `syncFX`.

In `handleKey`, drain the events each input produced, right after the switch that applies it:

```go
	m.fx.Observe(m.Game.DrainEvents())
	return nil
```

In `scene`, attach the hooks and the shake:

```go
	s.Background = m.fx.DrawBackground
	s.BoardFX = m.fx.DrawBoardFX
	s.GlobalFX = m.fx.DrawGlobalFX
	s.BorderStyle = m.fx.BorderStyle(m.palette)
	s.ShakeX, s.ShakeY = m.fx.ShakeOffset()
```

In `restart`, build a fresh world so a new universe starts with clean weather:

```go
	m.fx = fx.New(seed, fx.Intensity{
		Enabled:       !m.opts.NoFX,
		ReducedMotion: m.opts.ReducedMotion,
	})
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `go test ./... -race -shuffle=on`
Expected: PASS, including the Plan 2 golden files — the stubs draw nothing, so no frame changed.

- [ ] **Step 7: Commit**

```bash
git add internal/fx/ internal/game/game.go internal/app/model.go internal/app/fx_wiring_test.go
git commit -m "feat(fx): effects world skeleton, wired to the model and proven independent"
```

---

### Task 2: Starfield

**Files:**
- Create: `internal/fx/stars.go`
- Test: `internal/fx/stars_test.go`
- Modify: `internal/fx/fx.go` (own the stars, draw them, respawn on resize)

**Interfaces:**
- Consumes: `World`, `Rect`, `render.Grid`, `render.Palette`.
- Produces:
  - `type star struct { X, Y float64; Layer int; Glyph rune }` (unexported)
  - `func (w *World) seedStars()`, `func (w *World) advanceStars(dt time.Duration)`, `func (w *World) drawStars(g *render.Grid, p *render.Palette)`
  - `func (w *World) StarCount() int` — exported for tests.
  - `func (w *World) starSpeed(layer int) float64`
  - `func (w *World) Hyperdrive() float64` — the current hyperdrive multiplier; 1.0 normally. Task 8 gives it teeth; it exists here so the star maths already reads it.

Three depth layers (§15): far is slow, dim, mostly `.`; mid is medium, `· ˚`; near is fast and bright, `✦ ✧`. Stars drift downward, faster as the level rises, and never so busy that the board is harder to read — so the density is roughly one star per 40 cells, and stars are drawn behind the board, which `render.Frame` blanks.

- [ ] **Step 1: Write the failing test**

Create `internal/fx/stars_test.go`:

```go
package fx

import (
	"strings"
	"testing"
	"time"

	"github.com/charmbracelet/x/ansi"

	"cosmic-tetris/internal/render"
)

func drawWorld(w *World, cols, rows int) string {
	g := render.NewGrid(cols, rows)
	l := render.Compute(cols, rows)
	p := render.NewPalette(render.ModeFull)
	w.DrawBackground(g, l, p)
	w.DrawBoardFX(g, l, p)
	w.DrawGlobalFX(g, l, p)
	return ansi.Strip(g.Render())
}

func TestStarsExistAfterTheViewportIsSet(t *testing.T) {
	w := testWorld()
	if w.StarCount() == 0 {
		t.Fatal("no stars")
	}
	if got := drawWorld(w, 80, 30); strings.TrimSpace(got) == "" {
		t.Error("stars drew nothing")
	}
}

func TestStarDensityIsModest(t *testing.T) {
	w := testWorld()
	cells := 80 * 30
	if n := w.StarCount(); n > cells/20 {
		t.Errorf("%d stars in %d cells is too busy", n, cells)
	}
	if n := w.StarCount(); n < cells/120 {
		t.Errorf("%d stars in %d cells is too empty", n, cells)
	}
}

func TestThreeDepthLayersArePresent(t *testing.T) {
	w := testWorld()
	seen := map[int]bool{}
	for _, s := range w.stars {
		seen[s.Layer] = true
	}
	for layer := 0; layer < 3; layer++ {
		if !seen[layer] {
			t.Errorf("no stars in layer %d", layer)
		}
	}
}

func TestStarsDriftDownward(t *testing.T) {
	w := testWorld()
	before := make([]float64, len(w.stars))
	for i, s := range w.stars {
		before[i] = s.Y
	}
	w.Advance(500 * time.Millisecond)
	moved := 0
	for i, s := range w.stars {
		if s.Y > before[i] || s.Y < before[i] { // wrapped counts as moved
			moved++
		}
	}
	if moved == 0 {
		t.Error("no star moved in half a second")
	}
}

func TestNearStarsMoveFasterThanFarStars(t *testing.T) {
	w := testWorld()
	if !(w.starSpeed(0) < w.starSpeed(1) && w.starSpeed(1) < w.starSpeed(2)) {
		t.Errorf("layer speeds are not increasing: %.3f %.3f %.3f",
			w.starSpeed(0), w.starSpeed(1), w.starSpeed(2))
	}
}

func TestStarSpeedRisesWithTheLevel(t *testing.T) {
	w := testWorld()
	slow := w.starSpeed(1)
	w.SetLevel(12)
	fast := w.starSpeed(1)
	if fast <= slow {
		t.Errorf("level 12 speed %.3f is not faster than level 1 speed %.3f", fast, slow)
	}
	if fast > slow*4 {
		t.Errorf("level 12 speed %.3f is more than four times level 1 (%.3f); too busy", fast, slow)
	}
}

func TestStarsStayInsideTheViewport(t *testing.T) {
	w := testWorld()
	for i := 0; i < 400; i++ {
		w.Advance(16 * time.Millisecond)
	}
	for _, s := range w.stars {
		if s.X < 0 || s.Y < 0 || int(s.X) >= w.view.W || int(s.Y) >= w.view.H {
			t.Fatalf("star escaped the viewport: %+v (view %+v)", s, w.view)
		}
	}
}

// Review Focus item 2.
func TestResizeRebuildsTheStarfieldInBounds(t *testing.T) {
	w := testWorld()
	w.Advance(2 * time.Second)
	w.SetViewport(Rect{0, 0, 40, 24}, Rect{X: 4, Y: 2, W: 20, H: 20})
	w.Advance(16 * time.Millisecond)
	for _, s := range w.stars {
		if int(s.X) >= 40 || int(s.Y) >= 24 {
			t.Fatalf("star %+v is outside the shrunken viewport", s)
		}
	}
	if got := drawWorld(w, 40, 24); strings.Count(got, "\n")+1 != 24 {
		t.Error("drawing after a resize produced the wrong number of rows")
	}
	w.SetViewport(Rect{}, Rect{})
	w.Advance(16 * time.Millisecond)
	if w.StarCount() != 0 {
		t.Error("an empty viewport should hold no stars")
	}
}

// Review Focus item 5.
func TestPausedStarsKeepDriftingSlowly(t *testing.T) {
	moved := func(paused bool) float64 {
		w := testWorld()
		w.Paused = paused
		var sum float64
		before := w.stars[0].Y
		w.Advance(500 * time.Millisecond)
		sum = w.stars[0].Y - before
		if sum < 0 {
			sum += float64(w.view.H) // wrapped
		}
		return sum
	}
	running, held := moved(false), moved(true)
	if held <= 0 {
		t.Error("stars stopped completely while paused; 30 says they may drift")
	}
	if held >= running {
		t.Errorf("paused drift %.3f is not slower than running drift %.3f", held, running)
	}
}

func TestStarsUseTheSpecGlyphs(t *testing.T) {
	w := testWorld()
	allowed := ". ·˚✦✧*"
	for _, s := range w.stars {
		if !strings.ContainsRune(allowed, s.Glyph) {
			t.Errorf("unexpected star glyph %q", s.Glyph)
		}
	}
}

func TestStarsAreASCIIInASCIIMode(t *testing.T) {
	w := testWorld()
	g := render.NewGrid(80, 30)
	l := render.Compute(80, 30)
	w.DrawBackground(g, l, render.NewPalette(render.ModeASCII))
	out := ansi.Strip(g.Render())
	for _, r := range out {
		if r > 127 && r != '\n' {
			t.Fatalf("ASCII mode drew a non-ASCII star %q", r)
		}
	}
}

func TestStarsNeverDrawInsideTheBoard(t *testing.T) {
	// render.Frame blanks the playfield after the background, but the FX layer
	// should not waste writes there either, and the invariant is worth pinning.
	w := testWorld()
	w.Advance(time.Second)
	g := render.NewGrid(80, 30)
	l := render.Compute(80, 30)
	w.SetViewport(Rect{0, 0, 80, 30}, Rect{X: l.InnerX, Y: l.InnerY, W: render.BoardInnerW, H: render.BoardInnerH})
	w.DrawBackground(g, l, render.NewPalette(render.ModeFull))
	for y := l.InnerY; y < l.InnerY+render.BoardInnerH; y++ {
		for x := l.InnerX; x < l.InnerX+render.BoardInnerW; x++ {
			if c := g.At(x, y); c.Rune != ' ' {
				t.Fatalf("star %q drawn inside the playfield at (%d,%d)", c.Rune, x, y)
			}
		}
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run Star -v`
Expected: FAIL — `w.stars undefined`, `undefined: StarCount`.

- [ ] **Step 3: Implement the starfield**

Create `internal/fx/stars.go`:

```go
package fx

import (
	"time"

	"cosmic-tetris/internal/render"
)

// starDensity is one star per this many cells. Enough to feel like space,
// sparse enough that the board stays the most legible thing on screen.
const starDensity = 40

// Glyphs per depth layer: far is mostly dust, near is bright and pointy.
var starGlyphs = [3][]rune{
	{'.', '.', '·'},
	{'·', '˚'},
	{'✦', '✧', '*'},
}

var starGlyphsASCII = [3][]rune{
	{'.'},
	{'.', ':'},
	{'+', '*'},
}

// baseStarSpeed is cells per second per layer at level 1.
var baseStarSpeed = [3]float64{0.6, 1.6, 3.4}

// pausedStarFactor is how much of the drift survives a pause. 30 lets the
// background keep moving very slowly while everything else holds still.
const pausedStarFactor = 0.15

// star is one background speck.
type star struct {
	X, Y  float64
	Layer int
	Glyph rune
}

// StarCount is how many stars exist.
func (w *World) StarCount() int { return len(w.stars) }

// seedStars fills the viewport with a fresh starfield. It is called whenever
// the viewport changes size, so stars can never hold coordinates from a larger
// terminal.
func (w *World) seedStars() {
	w.stars = w.stars[:0]
	if w.view.W <= 0 || w.view.H <= 0 {
		return
	}
	n := w.view.W * w.view.H / starDensity
	for i := 0; i < n; i++ {
		layer := i % 3
		w.stars = append(w.stars, star{
			X:     w.rng.Float64() * float64(w.view.W),
			Y:     w.rng.Float64() * float64(w.view.H),
			Layer: layer,
			Glyph: starGlyphs[layer][w.rng.IntN(len(starGlyphs[layer]))],
		})
	}
}

// starSpeed is a layer's drift in cells per second, scaled by the gravity level
// and by hyperdrive. The level term is deliberately gentle: at level 20 the
// field is livelier, not a blizzard.
func (w *World) starSpeed(layer int) float64 {
	if layer < 0 || layer > 2 {
		return 0
	}
	levelScale := 1 + float64(w.level-1)*0.08
	if levelScale > 2.6 {
		levelScale = 2.6
	}
	return baseStarSpeed[layer] * levelScale * w.Hyperdrive()
}

// advanceStars drifts the field downward, wrapping at the bottom.
func (w *World) advanceStars(dt time.Duration) {
	if len(w.stars) == 0 {
		return
	}
	secs := dt.Seconds()
	if w.Paused {
		secs *= pausedStarFactor
	}
	h := float64(w.view.H)
	for i := range w.stars {
		s := &w.stars[i]
		s.Y += w.starSpeed(s.Layer) * secs
		for s.Y >= h {
			s.Y -= h
			s.X = w.rng.Float64() * float64(w.view.W)
		}
	}
}

// drawStars paints the field, skipping the playfield, which is opaque.
func (w *World) drawStars(g *render.Grid, p *render.Palette) {
	ascii := p.Mode == render.ModeASCII
	for _, s := range w.stars {
		x, y := int(s.X), int(s.Y)
		if w.board.Contains(x, y) {
			continue
		}
		glyph := s.Glyph
		if ascii {
			set := starGlyphsASCII[s.Layer]
			glyph = set[(x+y)%len(set)]
		}
		g.Set(x, y, glyph, p.Star[s.Layer])
	}
}
```

- [ ] **Step 4: Hook the stars into the world**

In `internal/fx/fx.go`, add the field:

```go
	stars []star
```

Reseed on a size change in `SetViewport`:

```go
func (w *World) SetViewport(view, board Rect) {
	resized := view.W != w.view.W || view.H != w.view.H
	w.view, w.board = view, board
	if !w.in.Enabled {
		return
	}
	if resized || (len(w.stars) == 0 && view.W > 0 && view.H > 0) {
		w.seedStars()
	}
}
```

Advance them:

```go
	w.now += dt
	w.advanceStars(dt)
```

Draw them:

```go
func (w *World) DrawBackground(g *render.Grid, l render.Layout, p *render.Palette) {
	if !w.in.Enabled {
		return
	}
	w.drawStars(g, p)
}
```

Add the hyperdrive accessor, which Task 8 replaces with the real timeline:

```go
// Hyperdrive is the current starfield speed multiplier. Task 8 gives it a
// timeline; until then space behaves itself.
func (w *World) Hyperdrive() float64 { return 1 }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v && go test ./... -race`
Expected: PASS. The Plan 2 golden files are generated with FX enabled through the app, so if `TestGoldenFrames` now fails, regenerate deliberately: the frames legitimately contain stars from here on. Run `go test ./internal/app/ -update`, read the diff, confirm the stars are outside the board and the HUD is intact, and commit the new files with this task.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/stars.go internal/fx/stars_test.go internal/fx/fx.go internal/app/testdata/
git commit -m "feat(fx): three-layer starfield with level-scaled drift"
```

---

### Task 3: Particles

**Files:**
- Create: `internal/fx/particles.go`
- Test: `internal/fx/particles_test.go`
- Modify: `internal/fx/fx.go` (own the pool, advance it, draw it)

**Interfaces:**
- Consumes: `World`, `Rect`, `render`.
- Produces:
  - `type Particle struct { X, Y, VX, VY, Life, MaxLife float64; Glyph rune; Brightness float64; Gameplay bool }`
  - `func (w *World) Emit(p Particle)` — respects the cap.
  - `func (w *World) EmitBurst(x, y float64, n int, speed float64, glyphs []rune)`
  - `func (w *World) advanceParticles(dt time.Duration)`
  - `func (w *World) drawParticles(g *render.Grid, p *render.Palette)`
  - `func (w *World) ParticleCount() int` (replaces the stub)
  - consts `particleGravity = 14.0`, `particleDrag = 0.90`

`Gameplay` marks a particle as belonging to gameplay rather than the background, so pause can freeze it (§30). Positions are floats in grid cells and are converted at draw time (§23). There is no collision detection.

- [ ] **Step 1: Write the failing test**

Create `internal/fx/particles_test.go`:

```go
package fx

import (
	"math"
	"testing"
	"time"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

func TestEmitAndCount(t *testing.T) {
	w := testWorld()
	w.Emit(Particle{X: 10, Y: 10, Life: 1, MaxLife: 1, Glyph: '*'})
	if w.ParticleCount() != 1 {
		t.Fatalf("count = %d, want 1", w.ParticleCount())
	}
}

func TestParticlesMoveAndDie(t *testing.T) {
	w := testWorld()
	w.Emit(Particle{X: 10, Y: 10, VX: 4, VY: -2, Life: 0.2, MaxLife: 0.2, Glyph: '*', Brightness: 1})
	w.Advance(50 * time.Millisecond)
	if w.ParticleCount() != 1 {
		t.Fatalf("particle died too early")
	}
	if w.particles[0].X == 10 {
		t.Error("particle did not move")
	}
	w.Advance(300 * time.Millisecond)
	if w.ParticleCount() != 0 {
		t.Errorf("particle outlived its life: %d left", w.ParticleCount())
	}
}

func TestParticlesFallAndSlow(t *testing.T) {
	w := testWorld()
	w.Emit(Particle{X: 10, Y: 10, VX: 10, VY: 0, Life: 5, MaxLife: 5, Glyph: '*'})
	w.Advance(100 * time.Millisecond)
	p := w.particles[0]
	if p.VY <= 0 {
		t.Errorf("gravity did not pull the particle down: VY = %.3f", p.VY)
	}
	if p.VX >= 10 {
		t.Errorf("drag did not slow the particle: VX = %.3f", p.VX)
	}
}

func TestParticlesOutsideTheViewportDie(t *testing.T) {
	w := testWorld()
	w.Emit(Particle{X: 5, Y: 5, VX: -400, Life: 10, MaxLife: 10, Glyph: '*'})
	w.Advance(100 * time.Millisecond)
	if w.ParticleCount() != 0 {
		t.Error("a particle that left the viewport survived")
	}
}

// Review Focus item 1.
func TestParticleCapHoldsUnderSustainedEvents(t *testing.T) {
	w := testWorld()
	for round := 0; round < 50; round++ {
		w.EmitBurst(30, 10, 200, 12, []rune{'*'})
		w.Advance(16 * time.Millisecond)
		if n := w.ParticleCount(); n > MaxParticles {
			t.Fatalf("round %d: %d particles exceeds the cap of %d", round, n, MaxParticles)
		}
	}
	if cap(w.particles) > 4*MaxParticles {
		t.Errorf("particle slice grew to capacity %d; it should be reused", cap(w.particles))
	}
}

func TestEmitAtTheCapDropsTheNewestNotTheOldest(t *testing.T) {
	w := testWorld()
	for i := 0; i < MaxParticles; i++ {
		w.Emit(Particle{X: 10, Y: 10, Life: 1, MaxLife: 1, Glyph: 'a'})
	}
	w.Emit(Particle{X: 10, Y: 10, Life: 1, MaxLife: 1, Glyph: 'z'})
	if w.ParticleCount() != MaxParticles {
		t.Fatalf("count = %d, want the cap %d", w.ParticleCount(), MaxParticles)
	}
	for _, p := range w.particles {
		if p.Glyph == 'z' {
			t.Error("emitting at the cap displaced a live particle")
		}
	}
}

func TestEmitBurstSpreadsVelocity(t *testing.T) {
	w := testWorld()
	w.EmitBurst(30, 10, 24, 10, []rune{'·', '*', '✦', '+'})
	if n := w.ParticleCount(); n != 24 {
		t.Fatalf("burst produced %d particles, want 24", n)
	}
	var left, right, up bool
	for _, p := range w.particles {
		if p.VX < -0.5 {
			left = true
		}
		if p.VX > 0.5 {
			right = true
		}
		if p.VY < -0.5 {
			up = true
		}
		if math.IsNaN(p.VX) || math.IsNaN(p.VY) {
			t.Fatal("burst produced a NaN velocity")
		}
	}
	if !left || !right || !up {
		t.Error("burst did not spread in every direction")
	}
}

func TestBurstParticlesAreMarkedGameplay(t *testing.T) {
	w := testWorld()
	w.EmitBurst(30, 10, 6, 8, []rune{'*'})
	for _, p := range w.particles {
		if !p.Gameplay {
			t.Error("burst particle is not marked as gameplay")
		}
	}
}

// Review Focus item 5.
func TestPauseFreezesGameplayParticles(t *testing.T) {
	w := testWorld()
	w.EmitBurst(30, 10, 8, 8, []rune{'*'})
	before := append([]Particle(nil), w.particles...)
	w.Paused = true
	w.Advance(500 * time.Millisecond)
	if w.ParticleCount() != len(before) {
		t.Fatalf("paused particles died: %d -> %d", len(before), w.ParticleCount())
	}
	for i, p := range w.particles {
		if p.X != before[i].X || p.Y != before[i].Y || p.Life != before[i].Life {
			t.Fatalf("particle %d moved or aged while paused", i)
		}
	}
	w.Paused = false
	w.Advance(16 * time.Millisecond)
	if w.particles[0].X == before[0].X && w.particles[0].Y == before[0].Y {
		t.Error("particles did not resume")
	}
}

func TestDrawParticlesStaysInsideTheGrid(t *testing.T) {
	w := testWorld()
	w.EmitBurst(30, 10, 100, 30, []rune{'*'})
	g := render.NewGrid(80, 30)
	l := render.Compute(80, 30)
	w.drawParticles(g, render.NewPalette(render.ModeFull))
	for y := 0; y < g.H; y++ {
		for x := 0; x < g.W; x++ {
			_ = g.At(x, y)
		}
	}
	_ = l
	// Reaching here without a panic is the assertion; Grid.Set clips.
}

// Review Focus item 2.
func TestParticlesSurviveAResizeToTiny(t *testing.T) {
	w := testWorld()
	w.EmitBurst(60, 20, 200, 20, []rune{'*'})
	w.SetViewport(Rect{0, 0, 40, 24}, Rect{X: 4, Y: 2, W: 20, H: 20})
	w.Advance(16 * time.Millisecond)
	for _, p := range w.particles {
		if math.IsNaN(p.X) || math.IsNaN(p.Y) {
			t.Fatal("resize produced a NaN particle position")
		}
		if p.X < -1 || p.Y < -1 || p.X > 41 || p.Y > 25 {
			t.Fatalf("particle at (%.1f,%.1f) survived outside the new viewport", p.X, p.Y)
		}
	}
	_ = drawWorld(w, 40, 24) // must not panic
}

// Restraint rule: particles must never permanently alter the rendered board.
func TestParticlesDoNotAlterTheBoard(t *testing.T) {
	w := testWorld()
	gm := game.New(2)
	gm.Board.Set(0, 21, game.CellOf(game.KindI))
	before := gm.Board
	w.EmitBurst(30, 20, 100, 10, []rune{'*'})
	for i := 0; i < 40; i++ {
		w.Advance(16 * time.Millisecond)
	}
	if gm.Board != before {
		t.Error("particles changed the board")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run Particle -v`
Expected: FAIL — `undefined: Particle`.

- [ ] **Step 3: Implement the particle system**

Create `internal/fx/particles.go`:

```go
package fx

import (
	"math"
	"time"

	"cosmic-tetris/internal/render"
)

// Particle physics constants, in cells and seconds.
const (
	particleGravity = 14.0
	particleDrag    = 0.90
)

// Particle is one speck of debris. Positions are grid cells as floats and are
// rounded at draw time.
type Particle struct {
	X, Y       float64
	VX, VY     float64
	Life       float64
	MaxLife    float64
	Glyph      rune
	Brightness float64

	// Gameplay marks debris thrown by the game rather than the background, so
	// pause can freeze it.
	Gameplay bool
}

// ParticleCount is how many particles are alive.
func (w *World) ParticleCount() int { return len(w.particles) }

// Emit adds a particle, unless the pool is full. At the cap the newcomer is
// dropped rather than displacing something the player is already watching.
func (w *World) Emit(p Particle) {
	if !w.in.Enabled || len(w.particles) >= MaxParticles {
		return
	}
	if p.MaxLife <= 0 {
		p.MaxLife = p.Life
	}
	if p.Brightness == 0 {
		p.Brightness = 1
	}
	w.particles = append(w.particles, p)
}

// EmitBurst throws n particles outward from (x, y) at roughly the given speed.
func (w *World) EmitBurst(x, y float64, n int, speed float64, glyphs []rune) {
	if !w.in.Enabled || n <= 0 || len(glyphs) == 0 {
		return
	}
	for i := 0; i < n; i++ {
		// Spread over a full circle, biased upward so debris arcs.
		angle := w.rng.Float64() * 2 * math.Pi
		mag := speed * (0.4 + 0.6*w.rng.Float64())
		life := 0.25 + 0.55*w.rng.Float64()
		w.Emit(Particle{
			X:          x,
			Y:          y,
			VX:         math.Cos(angle) * mag,
			VY:         math.Sin(angle)*mag*0.6 - speed*0.25,
			Life:       life,
			MaxLife:    life,
			Glyph:      glyphs[w.rng.IntN(len(glyphs))],
			Brightness: 1,
			Gameplay:   true,
		})
	}
}

// advanceParticles steps the simulation and compacts the slice in place, so the
// backing array is reused rather than reallocated every frame.
func (w *World) advanceParticles(dt time.Duration) {
	if len(w.particles) == 0 {
		return
	}
	secs := dt.Seconds()
	keep := w.particles[:0]
	for _, p := range w.particles {
		if p.Gameplay && w.Paused {
			keep = append(keep, p)
			continue
		}
		p.X += p.VX * secs
		p.Y += p.VY * secs
		p.VY += particleGravity * secs
		damp := math.Pow(particleDrag, secs*60)
		p.VX *= damp
		p.VY *= damp
		p.Life -= secs
		if p.Life <= 0 || math.IsNaN(p.X) || math.IsNaN(p.Y) {
			continue
		}
		if p.X < -1 || p.Y < -1 || p.X > float64(w.view.W)+1 || p.Y > float64(w.view.H)+1 {
			continue
		}
		keep = append(keep, p)
	}
	w.particles = keep
}

// drawParticles paints the pool. Brightness picks a style; the grid clips.
func (w *World) drawParticles(g *render.Grid, p *render.Palette) {
	for _, pt := range w.particles {
		frac := 0.0
		if pt.MaxLife > 0 {
			frac = pt.Life / pt.MaxLife
		}
		st := p.Star[0]
		switch {
		case frac > 0.66:
			st = p.Star[2]
		case frac > 0.33:
			st = p.Star[1]
		}
		glyph := pt.Glyph
		if p.Mode == render.ModeASCII {
			glyph = asciiParticle(glyph)
		}
		g.Set(int(pt.X), int(pt.Y), glyph, st)
	}
}

// asciiParticle maps the fancy debris glyphs onto 7-bit characters.
func asciiParticle(r rune) rune {
	switch r {
	case '✦', '✧', '˚':
		return '*'
	case '·':
		return '.'
	case '▓':
		return '#'
	case '▒':
		return '='
	case '░':
		return '-'
	case '○', '◌', '◯', '●':
		return 'o'
	default:
		if r > 127 {
			return '*'
		}
		return r
	}
}
```

- [ ] **Step 4: Hook particles into the world**

In `internal/fx/fx.go`: add the field `particles []Particle`, delete the `ParticleCount` stub, add `w.advanceParticles(dt)` to `Advance` after `advanceStars`, and draw them in `DrawBoardFX`:

```go
func (w *World) DrawBoardFX(g *render.Grid, l render.Layout, p *render.Palette) {
	if !w.in.Enabled {
		return
	}
	w.drawParticles(g, p)
}
```

Clamp positions after a resize so a shrunken viewport cannot leave stale coordinates behind — add to `SetViewport`, after the reseed:

```go
	if resized {
		w.clampParticles()
	}
```

and in `particles.go`:

```go
// clampParticles pulls stray debris back into a shrunken viewport, so a resize
// mid-explosion cannot leave particles drawing off-screen forever.
func (w *World) clampParticles() {
	maxX, maxY := float64(w.view.W), float64(w.view.H)
	keep := w.particles[:0]
	for _, p := range w.particles {
		if p.X > maxX || p.Y > maxY {
			continue
		}
		keep = append(keep, p)
	}
	w.particles = keep
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v && go test ./... -race`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/particles.go internal/fx/particles_test.go internal/fx/fx.go
git commit -m "feat(fx): capped particle system with terminal-space physics"
```

---

### Task 4: Animated board border

**Files:**
- Create: `internal/fx/border.go`
- Test: `internal/fx/border_test.go`
- Modify: `internal/fx/fx.go` (real `BorderStyle`)

**Interfaces:**
- Consumes: `World`, `render.Palette`, `render.Style`, `lipgloss.Blend1D`.
- Produces:
  - `func (w *World) BorderStyle(p *render.Palette) *render.Style` (replaces the stub)
  - `func (w *World) FlashBorder(d time.Duration)` — a bright pulse for major events.
  - `func (w *World) borderPhase() float64` — 0..1 position in the slow colour cycle.
  - consts `borderCycle = 12 * time.Second`, `borderFlash = 120 * time.Millisecond`

The border is the game's energy-state indicator (§25): deep violet → electric cyan → magenta → stellar blue → hot white, cycling slowly, flashing bright on impact, and cycling fast during major events.

- [ ] **Step 1: Write the failing test**

Create `internal/fx/border_test.go`:

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/render"
)

func TestBorderStyleShiftsOverTime(t *testing.T) {
	w := testWorld()
	p := render.NewPalette(render.ModeFull)
	first := w.BorderStyle(p)
	w.Advance(borderCycle / 4)
	second := w.BorderStyle(p)
	r1, g1, b1, _ := first.Fg.RGBA()
	r2, g2, b2, _ := second.Fg.RGBA()
	if r1 == r2 && g1 == g2 && b1 == b2 {
		t.Error("border colour did not shift over a quarter cycle")
	}
}

func TestBorderShiftIsSubtleFrameToFrame(t *testing.T) {
	w := testWorld()
	p := render.NewPalette(render.ModeFull)
	a := w.BorderStyle(p)
	w.Advance(16 * time.Millisecond)
	b := w.BorderStyle(p)
	r1, g1, b1, _ := a.Fg.RGBA()
	r2, g2, b2, _ := b.Fg.RGBA()
	diff := abs(int(r1)-int(r2)) + abs(int(g1)-int(g2)) + abs(int(b1)-int(b2))
	if diff > 3000 {
		t.Errorf("border jumped by %d in one frame; the shift should be subtle", diff)
	}
}

func abs(n int) int {
	if n < 0 {
		return -n
	}
	return n
}

func TestBorderPhaseWrapsAroundTheCycle(t *testing.T) {
	w := testWorld()
	if got := w.borderPhase(); got != 0 {
		t.Errorf("initial phase = %.3f, want 0", got)
	}
	w.Advance(borderCycle)
	if got := w.borderPhase(); got > 0.001 {
		t.Errorf("phase after a full cycle = %.3f, want ~0", got)
	}
	w.Advance(borderCycle / 2)
	if got := w.borderPhase(); got < 0.4 || got > 0.6 {
		t.Errorf("phase after half a cycle = %.3f, want ~0.5", got)
	}
}

func TestFlashBorderGoesBrightThenBack(t *testing.T) {
	w := testWorld()
	p := render.NewPalette(render.ModeFull)
	w.FlashBorder(borderFlash)
	if got := w.BorderStyle(p); got != p.BorderHot {
		t.Error("flash did not use the hot border style")
	}
	w.Advance(borderFlash + 10*time.Millisecond)
	if got := w.BorderStyle(p); got == p.BorderHot {
		t.Error("flash did not decay")
	}
}

func TestFlashIsIgnoredWhenDisabled(t *testing.T) {
	w := New(1, Intensity{Enabled: false})
	p := render.NewPalette(render.ModeFull)
	w.FlashBorder(time.Second)
	if got := w.BorderStyle(p); got != p.Border {
		t.Error("a disabled world flashed")
	}
}

func TestReducedMotionStillAnimatesColour(t *testing.T) {
	// 49.5 suppresses motion, not colour.
	w := New(1, Intensity{Enabled: true, ReducedMotion: true})
	w.SetViewport(Rect{0, 0, 80, 30}, Rect{X: 24, Y: 5, W: 20, H: 20})
	p := render.NewPalette(render.ModeFull)
	a := w.BorderStyle(p)
	w.Advance(borderCycle / 3)
	b := w.BorderStyle(p)
	r1, _, _, _ := a.Fg.RGBA()
	r2, _, _, _ := b.Fg.RGBA()
	if r1 == r2 {
		t.Error("reduced motion also froze the border colour")
	}
}

func TestASCIIBorderUsesThePaletteStyle(t *testing.T) {
	w := testWorld()
	p := render.NewPalette(render.ModeASCII)
	w.Advance(borderCycle / 3)
	if got := w.BorderStyle(p); got != p.Border {
		t.Error("ASCII mode should keep the palette's border style, not a blended colour")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run Border -v`
Expected: FAIL — `undefined: borderCycle`.

- [ ] **Step 3: Implement the border**

Create `internal/fx/border.go`:

```go
package fx

import (
	"time"

	"charm.land/lipgloss/v2"

	"cosmic-tetris/internal/render"
)

// The border is the game's energy-state indicator: a slow drift through a
// sci-fi palette, a bright flash on impact.
const (
	borderCycle = 12 * time.Second
	borderFlash = 120 * time.Millisecond

	// borderFastCycle is the cycle during a major event.
	borderFastCycle = 900 * time.Millisecond
)

// borderPalette is the shift from 25.
var borderPalette = []string{
	"#7C3AED", // deep violet
	"#22D3EE", // electric cyan
	"#D946EF", // magenta
	"#3B82F6", // stellar blue
	"#F8FAFC", // hot white
	"#7C3AED", // back to violet, so the cycle closes
}

// borderPhase is where the colour cycle stands, 0..1.
func (w *World) borderPhase() float64 {
	cycle := borderCycle
	if w.borderFast > 0 {
		cycle = borderFastCycle
	}
	return float64(w.now%cycle) / float64(cycle)
}

// FlashBorder makes the border extremely bright for d.
func (w *World) FlashBorder(d time.Duration) {
	if !w.in.Enabled || d <= 0 {
		return
	}
	w.borderFlashLeft = d
}

// PulseBorder speeds the gradient up for d, for major events.
func (w *World) PulseBorder(d time.Duration) {
	if !w.in.Enabled || d <= 0 {
		return
	}
	w.borderFast = d
}

// advanceBorder ages the flash and the fast-cycle timers.
func (w *World) advanceBorder(dt time.Duration) {
	if w.borderFlashLeft > 0 {
		w.borderFlashLeft -= dt
		if w.borderFlashLeft < 0 {
			w.borderFlashLeft = 0
		}
	}
	if w.borderFast > 0 {
		w.borderFast -= dt
		if w.borderFast < 0 {
			w.borderFast = 0
		}
	}
}

// BorderStyle is the border's current style.
func (w *World) BorderStyle(p *render.Palette) *render.Style {
	if !w.in.Enabled {
		return p.Border
	}
	if w.borderFlashLeft > 0 {
		return p.BorderHot
	}
	// A terminal on the basic colour set has nothing to blend with.
	if p.Mode == render.ModeASCII {
		return p.Border
	}
	return render.NewStyle(w.borderColor(), false, false)
}

// borderColor interpolates the palette at the current phase.
func (w *World) borderColor() lipgloss.Color {
	phase := w.borderPhase()
	// Blend1D gives us an evenly spaced ramp through the palette; sampling it
	// is cheaper to reason about than hand-rolled channel maths.
	stops := make([]lipgloss.Color, 0, len(borderPalette))
	for _, hex := range borderPalette {
		stops = append(stops, lipgloss.Color(hex))
	}
	ramp := lipgloss.Blend1D(borderRampSteps, stops...)
	i := int(phase * float64(len(ramp)))
	if i >= len(ramp) {
		i = len(ramp) - 1
	}
	if i < 0 {
		i = 0
	}
	return lipgloss.Color(ramp[i])
}

// borderRampSteps is how finely the palette is sampled. Sixty steps over a
// twelve-second cycle is a change every fifth of a second: visible, not busy.
const borderRampSteps = 60
```

Check `Blend1D`'s exact signature and return type before writing this:

```bash
go doc charm.land/lipgloss/v2 Blend1D
```

If it returns `[]color.Color` rather than `[]lipgloss.Color`, change `borderColor` to return `color.Color` and drop the conversion — `render.NewStyle` takes `color.Color` either way. Build the ramp once in `New` and store it on the world rather than rebuilding it per frame if the profiler ever cares; correctness first.

- [ ] **Step 4: Hook the border into the world**

In `internal/fx/fx.go`: add fields `borderFlashLeft, borderFast time.Duration`, delete the `BorderStyle` stub, and call `w.advanceBorder(dt)` from `Advance`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v && go test ./... -race`
Expected: PASS. The border colour now changes with FX time, which the golden files do not see — they compare ANSI-stripped output, so the glyphs are unchanged.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/border.go internal/fx/border_test.go internal/fx/fx.go
git commit -m "feat(fx): animated board border with flash and event pulse"
```

---

### Task 5: Piece trails

**Files:**
- Create: `internal/fx/trails.go`
- Test: `internal/fx/trails_test.go`
- Modify: `internal/fx/fx.go` (own trails, observe movement, draw them)

**Interfaces:**
- Consumes: `World`, `game.Event`, `game.Piece`, `render`.
- Produces:
  - `type trail struct { X, Y int; Life, MaxLife float64 }`
  - `func (w *World) addTrail(p game.Piece)`, `func (w *World) addColumnTrail(p game.Piece, cells int)`
  - `func (w *World) advanceTrails(dt time.Duration)`
  - `func (w *World) drawTrails(g *render.Grid, l render.Layout, pal *render.Palette)`
  - `func (w *World) TrailCount() int`
  - const `trailLife = 140 * time.Millisecond`

Trails live 100–160ms and fade `▓ → ▒ → ░` (§17). They are drawn in board space through `render.BoardCellXY`, so they shake with the board and clip at its edges. Trails never draw over the active piece — the pieces are drawn before `BoardFX`, and a trail cell that coincides with the active piece is skipped, which is the §44 rule "never obscure the active piece" made mechanical.

- [ ] **Step 1: Write the failing test**

Create `internal/fx/trails_test.go`:

```go
package fx

import (
	"strings"
	"testing"
	"time"

	"github.com/charmbracelet/x/ansi"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

func TestMovementLeavesATrail(t *testing.T) {
	w := testWorld()
	w.Observe([]game.Event{{
		Kind:  game.EventPieceMoved,
		Piece: game.Piece{Kind: game.KindT, X: 4, Y: 10},
	}})
	if w.TrailCount() == 0 {
		t.Fatal("a move left no trail")
	}
}

func TestTrailsExpireQuickly(t *testing.T) {
	w := testWorld()
	w.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: game.Piece{Kind: game.KindT, X: 4, Y: 10}}})
	w.Advance(80 * time.Millisecond)
	if w.TrailCount() == 0 {
		t.Error("trail vanished before 100ms")
	}
	w.Advance(120 * time.Millisecond)
	if w.TrailCount() != 0 {
		t.Errorf("trail outlived 200ms: %d cells left", w.TrailCount())
	}
}

func TestRotationAlsoLeavesATrail(t *testing.T) {
	w := testWorld()
	w.Observe([]game.Event{{Kind: game.EventPieceRotated, Piece: game.Piece{Kind: game.KindS, X: 4, Y: 6}}})
	if w.TrailCount() == 0 {
		t.Error("a rotation left no trail")
	}
}

func TestHardDropLeavesAStrongerVerticalTrail(t *testing.T) {
	short := testWorld()
	short.Observe([]game.Event{{
		Kind:  game.EventPieceHardDropped,
		Piece: game.Piece{Kind: game.KindI, Rotation: 1, X: 4, Y: 20},
		Count: 2,
	}})
	long := testWorld()
	long.Observe([]game.Event{{
		Kind:  game.EventPieceHardDropped,
		Piece: game.Piece{Kind: game.KindI, Rotation: 1, X: 4, Y: 20},
		Count: 14,
	}})
	if long.TrailCount() <= short.TrailCount() {
		t.Errorf("a 14-cell drop left %d trail cells, a 2-cell drop left %d",
			long.TrailCount(), short.TrailCount())
	}
}

func TestTrailGlyphsFade(t *testing.T) {
	w := testWorld()
	w.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: game.Piece{Kind: game.KindT, X: 4, Y: 10}}})
	seen := map[rune]bool{}
	for i := 0; i < 10; i++ {
		g := render.NewGrid(80, 30)
		l := render.Compute(80, 30)
		w.drawTrails(g, l, render.NewPalette(render.ModeFull))
		for _, r := range ansi.Strip(g.Render()) {
			if strings.ContainsRune("▓▒░", r) {
				seen[r] = true
			}
		}
		w.Advance(20 * time.Millisecond)
	}
	if len(seen) < 2 {
		t.Errorf("trail used only %d shades: %v", len(seen), seen)
	}
}

// Restraint rule: never obscure the active piece.
func TestTrailsNeverCoverTheActivePiece(t *testing.T) {
	w := testWorld()
	active := game.Piece{Kind: game.KindT, X: 4, Y: 10}
	w.SetActive(active)
	w.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: active}})

	g := render.NewGrid(80, 30)
	l := render.Compute(80, 30)
	w.SetViewport(Rect{0, 0, 80, 30}, Rect{X: l.InnerX, Y: l.InnerY, W: render.BoardInnerW, H: render.BoardInnerH})
	w.drawTrails(g, l, render.NewPalette(render.ModeFull))
	for _, c := range active.Cells() {
		x, y, ok := render.BoardCellXY(l, c.X, c.Y, 0, 0)
		if !ok {
			continue
		}
		if got := g.At(x, y).Rune; got != ' ' {
			t.Errorf("trail drew %q over the active piece at (%d,%d)", got, c.X, c.Y)
		}
	}
}

func TestTrailsStayInsideTheBoard(t *testing.T) {
	w := testWorld()
	// A piece hugging both walls in turn.
	for _, x := range []int{0, 8} {
		w.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: game.Piece{Kind: game.KindI, X: x, Y: 10}}})
	}
	g := render.NewGrid(80, 30)
	l := render.Compute(80, 30)
	w.drawTrails(g, l, render.NewPalette(render.ModeFull))
	for y := 0; y < g.H; y++ {
		for x := 0; x < g.W; x++ {
			if g.At(x, y).Rune == ' ' {
				continue
			}
			if x < l.InnerX || x >= l.InnerX+render.BoardInnerW || y < l.InnerY || y >= l.InnerY+render.BoardInnerH {
				t.Fatalf("trail drew outside the playfield at (%d,%d)", x, y)
			}
		}
	}
}

func TestTrailsFreezeWhilePaused(t *testing.T) {
	w := testWorld()
	w.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: game.Piece{Kind: game.KindT, X: 4, Y: 10}}})
	n := w.TrailCount()
	w.Paused = true
	w.Advance(time.Second)
	if w.TrailCount() != n {
		t.Errorf("trails aged while paused: %d -> %d", n, w.TrailCount())
	}
}

func TestTrailsAreASCIISafe(t *testing.T) {
	w := testWorld()
	w.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: game.Piece{Kind: game.KindT, X: 4, Y: 10}}})
	g := render.NewGrid(80, 30)
	l := render.Compute(80, 30)
	w.drawTrails(g, l, render.NewPalette(render.ModeASCII))
	for _, r := range ansi.Strip(g.Render()) {
		if r > 127 && r != '\n' {
			t.Fatalf("ASCII mode drew a non-ASCII trail glyph %q", r)
		}
	}
}

func TestDisabledWorldHasNoTrails(t *testing.T) {
	w := New(1, Intensity{Enabled: false})
	w.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: game.Piece{Kind: game.KindT, X: 4, Y: 10}}})
	if w.TrailCount() != 0 {
		t.Error("a disabled world made trails")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run Trail -v`
Expected: FAIL — `undefined: TrailCount`.

- [ ] **Step 3: Implement trails**

Create `internal/fx/trails.go`:

```go
package fx

import (
	"time"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

// trailLife is how long an ion trail lasts: long enough to see, short enough
// that it never reads as part of the board.
const trailLife = 140 * time.Millisecond

// maxTrails caps the trail buffer. A hard drop from the ceiling with an I piece
// lying flat is the worst case, and it is far below this.
const maxTrails = 240

// trailGlyphs fade from freshest to faintest.
var trailGlyphs = [3]rune{'▓', '▒', '░'}

// trail is one fading cell in board coordinates.
type trail struct {
	X, Y    int
	Life    float64
	MaxLife float64
}

// TrailCount is how many trail cells are alive.
func (w *World) TrailCount() int { return len(w.trails) }

// SetActive records where the falling piece is, so effects can avoid drawing
// over it. The world reads this; it never writes to the game.
func (w *World) SetActive(p game.Piece) {
	w.active = p
}

// addTrail marks the cells a piece just left.
func (w *World) addTrail(p game.Piece) {
	if !w.in.Enabled {
		return
	}
	life := trailLife.Seconds()
	for _, c := range p.Cells() {
		if len(w.trails) >= maxTrails {
			return
		}
		w.trails = append(w.trails, trail{X: c.X, Y: c.Y, Life: life, MaxLife: life})
	}
}

// addColumnTrail draws the vertical streak a hard drop tore through, one cell
// per row crossed. Longer drops leave longer streaks.
func (w *World) addColumnTrail(p game.Piece, cells int) {
	if !w.in.Enabled || cells <= 0 {
		return
	}
	life := trailLife.Seconds() * 1.4
	for _, c := range p.Cells() {
		for dy := 1; dy <= cells; dy++ {
			if len(w.trails) >= maxTrails {
				return
			}
			y := c.Y - dy
			if y < 0 {
				break
			}
			w.trails = append(w.trails, trail{X: c.X, Y: y, Life: life, MaxLife: life})
		}
	}
}

// advanceTrails ages the buffer, compacting in place.
func (w *World) advanceTrails(dt time.Duration) {
	if len(w.trails) == 0 || w.Paused {
		return
	}
	secs := dt.Seconds()
	keep := w.trails[:0]
	for _, t := range w.trails {
		t.Life -= secs
		if t.Life <= 0 {
			continue
		}
		keep = append(keep, t)
	}
	w.trails = keep
}

// drawTrails paints the streaks in board space, skipping the active piece.
func (w *World) drawTrails(g *render.Grid, l render.Layout, pal *render.Palette) {
	if len(w.trails) == 0 {
		return
	}
	occupied := map[game.Point]bool{}
	for _, c := range w.active.Cells() {
		occupied[c] = true
	}
	dx, dy := w.ShakeOffset()
	for _, t := range w.trails {
		if occupied[game.Point{X: t.X, Y: t.Y}] {
			continue
		}
		frac := 0.0
		if t.MaxLife > 0 {
			frac = t.Life / t.MaxLife
		}
		idx := 2
		switch {
		case frac > 0.66:
			idx = 0
		case frac > 0.33:
			idx = 1
		}
		glyph := trailGlyphs[idx]
		if pal.Mode == render.ModeASCII {
			glyph = asciiParticle(glyph)
		}
		x, y, ok := render.BoardCellXY(l, t.X, t.Y, dx, dy)
		if !ok {
			continue
		}
		g.Set(x, y, glyph, pal.Star[2-idx])
		g.Set(x+1, y, glyph, pal.Star[2-idx])
	}
}
```

- [ ] **Step 4: Hook trails into the world**

In `internal/fx/fx.go`: add fields `trails []trail` and `active game.Piece`, call `w.advanceTrails(dt)` from `Advance`, draw them in `DrawBoardFX` **before** the particles so debris sits on top:

```go
	w.drawTrails(g, l, p)
	w.drawParticles(g, p)
```

and fill in the movement arms of `observe`:

```go
	switch e.Kind {
	case game.EventPieceMoved, game.EventPieceRotated:
		w.addTrail(e.Piece)
	case game.EventPieceHardDropped:
		w.addColumnTrail(e.Piece, e.Count)
	}
```

In `internal/app/model.go`, tell the world where the piece is, in `syncFX`:

```go
	m.fx.SetActive(m.Game.Active)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v && go test ./... -race`
Expected: PASS. If the app golden files change — a trail can be alive in a snapshot only if a snapshot follows a move, and the Plan 2 fixtures set state directly rather than moving — regenerate only after confirming why.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/trails.go internal/fx/trails_test.go internal/fx/fx.go internal/app/model.go
git commit -m "feat(fx): short-lived ion trails for moves, rotations, and drops"
```

---

### Task 6: Hard-drop impact — shake and debris

**Files:**
- Create: `internal/fx/impact.go`
- Test: `internal/fx/impact_test.go`
- Modify: `internal/fx/fx.go` (real `ShakeOffset`, impact on hard drop)
- Test: `internal/app/shake_test.go`

**Interfaces:**
- Consumes: `World`, `game.Event`, `render.Layout`.
- Produces:
  - `func (w *World) Impact(p game.Piece, cells int)`
  - `func (w *World) Shake(d time.Duration)`
  - `func (w *World) ShakeOffset() (dx, dy int)` (replaces the stub)
  - `func (w *World) Shaking() bool`
  - consts `shakeDuration = 80 * time.Millisecond`, `shakeFrames = 5`
  - `var shakePattern = [shakeFrames][2]int{{0, 1}, {-1, 0}, {1, 0}, {0, -1}, {0, 0}}`

§18: a hard drop shakes the board by exactly one cell on the pinned pattern for ~80ms, throws debris sideways from the impact row, and flashes the border. The shake offset is applied by `render.Frame` through `Scene.ShakeX/ShakeY`, which already clips at the grid edge (Plan 2, Task 7), so the shake can never push the board over the HUD — this task pins that with a test at the smallest supported terminal.

`--reduced-motion` suppresses the shake entirely and keeps the debris and the flash (§49.5).

- [ ] **Step 1: Write the failing test**

Create `internal/fx/impact_test.go`:

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func TestHardDropShakesAndThrowsDebris(t *testing.T) {
	w := testWorld()
	w.Observe([]game.Event{{
		Kind:  game.EventPieceHardDropped,
		Piece: game.Piece{Kind: game.KindO, X: 4, Y: 20},
		Count: 12,
	}})
	if !w.Shaking() {
		t.Error("a hard drop did not shake the board")
	}
	if w.ParticleCount() == 0 {
		t.Error("a hard drop threw no debris")
	}
}

// Restraint rule and Review Focus item 3: shake never exceeds one cell.
func TestShakeNeverExceedsOneCell(t *testing.T) {
	w := testWorld()
	w.Shake(shakeDuration)
	for i := 0; i < 40; i++ {
		dx, dy := w.ShakeOffset()
		if dx < -1 || dx > 1 || dy < -1 || dy > 1 {
			t.Fatalf("frame %d: shake offset (%d,%d) exceeds one cell", i, dx, dy)
		}
		w.Advance(5 * time.Millisecond)
	}
}

func TestShakeFollowsThePinnedPattern(t *testing.T) {
	w := testWorld()
	w.Shake(shakeDuration)
	step := shakeDuration / shakeFrames
	for i, want := range shakePattern {
		dx, dy := w.ShakeOffset()
		if dx != want[0] || dy != want[1] {
			t.Errorf("frame %d: offset (%d,%d), want (%d,%d)", i, dx, dy, want[0], want[1])
		}
		w.Advance(step)
	}
}

func TestShakeEndsAtRest(t *testing.T) {
	w := testWorld()
	w.Shake(shakeDuration)
	w.Advance(shakeDuration + 20*time.Millisecond)
	if w.Shaking() {
		t.Error("shake outlived its duration")
	}
	if dx, dy := w.ShakeOffset(); dx != 0 || dy != 0 {
		t.Errorf("shake settled at (%d,%d), want (0,0)", dx, dy)
	}
}

func TestBiggerDropsShakeLongerButNoFurther(t *testing.T) {
	small, big := testWorld(), testWorld()
	small.Impact(game.Piece{Kind: game.KindO, X: 4, Y: 20}, 1)
	big.Impact(game.Piece{Kind: game.KindO, X: 4, Y: 20}, 18)
	if big.shakeLeft <= small.shakeLeft {
		t.Errorf("an 18-cell drop shook for %v, a 1-cell drop for %v", big.shakeLeft, small.shakeLeft)
	}
	for i := 0; i < 40; i++ {
		dx, dy := big.ShakeOffset()
		if dx < -1 || dx > 1 || dy < -1 || dy > 1 {
			t.Fatalf("a long drop shook by (%d,%d)", dx, dy)
		}
		big.Advance(5 * time.Millisecond)
	}
}

func TestTinyDropsDoNotShake(t *testing.T) {
	// Tapping a piece down one cell should not rattle the screen.
	w := testWorld()
	w.Impact(game.Piece{Kind: game.KindO, X: 4, Y: 20}, 0)
	if w.Shaking() {
		t.Error("a zero-cell drop shook the board")
	}
}

func TestImpactFlashesTheBorder(t *testing.T) {
	w := testWorld()
	w.Impact(game.Piece{Kind: game.KindO, X: 4, Y: 20}, 10)
	if w.borderFlashLeft == 0 {
		t.Error("impact did not flash the border")
	}
}

// 49.5: reduced motion drops the shake and keeps the debris.
func TestReducedMotionSuppressesShakeNotDebris(t *testing.T) {
	w := New(11, Intensity{Enabled: true, ReducedMotion: true})
	w.SetViewport(Rect{0, 0, 80, 30}, Rect{X: 24, Y: 5, W: 20, H: 20})
	w.Impact(game.Piece{Kind: game.KindO, X: 4, Y: 20}, 12)
	if w.Shaking() {
		t.Error("reduced motion still shook the screen")
	}
	if dx, dy := w.ShakeOffset(); dx != 0 || dy != 0 {
		t.Errorf("reduced motion offset (%d,%d), want (0,0)", dx, dy)
	}
	if w.ParticleCount() == 0 {
		t.Error("reduced motion also removed the debris; 49.5 keeps particles")
	}
}

func TestDebrisSpreadsSideways(t *testing.T) {
	w := testWorld()
	w.Impact(game.Piece{Kind: game.KindI, X: 3, Y: 20}, 14)
	var left, right bool
	for _, p := range w.particles {
		if p.VX < -1 {
			left = true
		}
		if p.VX > 1 {
			right = true
		}
	}
	if !left || !right {
		t.Error("debris did not spread to both sides of the impact")
	}
}

func TestPausedShakeDoesNotAdvance(t *testing.T) {
	w := testWorld()
	w.Shake(shakeDuration)
	w.Paused = true
	before := w.shakeLeft
	w.Advance(200 * time.Millisecond)
	if w.shakeLeft != before {
		t.Errorf("shake advanced while paused: %v -> %v", before, w.shakeLeft)
	}
}
```

Create `internal/app/shake_test.go`:

```go
package app

import (
	"strings"
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"

	"cosmic-tetris/internal/render"
)

// Review Focus item 3: at the smallest supported terminal, a shake must not
// push anything off the screen or over the HUD.
func TestShakeAtMinimumSizeStaysOnScreen(t *testing.T) {
	m := New(Options{Seed: 3, Mode: render.ModeFull})
	m.Update(tea.WindowSizeMsg{Width: render.MinWidth, Height: render.MinHeight})
	now := time.Now()
	m.Update(FrameMsg(now))
	m.Update(press(" ")) // hard drop: shake begins

	for i := 1; i <= 12; i++ {
		m.Update(FrameMsg(now.Add(time.Duration(i) * 16 * time.Millisecond)))
		snap := m.Snapshot()
		lines := strings.Split(snap, "\n")
		if len(lines) != render.MinHeight {
			t.Fatalf("frame %d has %d rows, want %d", i, len(lines), render.MinHeight)
		}
		for j, line := range lines {
			if w := len([]rune(line)); w > render.MinWidth {
				t.Fatalf("frame %d row %d is %d cells wide, want at most %d", i, j, w, render.MinWidth)
			}
		}
	}
}

func TestShakeDoesNotDelayInput(t *testing.T) {
	// Restraint rule: never make controls lag. A key pressed mid-shake takes
	// effect in the same Update.
	m := New(Options{Seed: 3, Mode: render.ModeFull})
	m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	m.Update(press(" "))
	x := m.Game.Active.X
	m.Update(press("left"))
	if m.Game.Active.X == x {
		t.Error("a move during a shake did not take effect immediately")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/app/ -run 'Shake|Impact|Debris' -v`
Expected: FAIL — `undefined: shakeDuration`, `undefined: Impact`.

- [ ] **Step 3: Implement impact**

Create `internal/fx/impact.go`:

```go
package fx

import (
	"time"

	"cosmic-tetris/internal/game"
)

// Screen shake is exactly one cell, on a fixed five-frame pattern, for about a
// twelfth of a second. Anything more is nausea, not spectacle.
const (
	shakeDuration = 80 * time.Millisecond
	shakeFrames   = 5

	// maxShake caps the duration a long drop can ask for.
	maxShake = 140 * time.Millisecond
)

// shakePattern is the pinned offset sequence, in cells.
var shakePattern = [shakeFrames][2]int{{0, 1}, {-1, 0}, {1, 0}, {0, -1}, {0, 0}}

// debrisGlyphs is what a landing throws up.
var debrisGlyphs = []rune{'·', '*', '✦', '+'}

// Shake starts a screen shake of duration d, clamped. Reduced motion ignores it.
func (w *World) Shake(d time.Duration) {
	if !w.in.Enabled || w.in.ReducedMotion || d <= 0 {
		return
	}
	if d > maxShake {
		d = maxShake
	}
	if d > w.shakeLeft {
		w.shakeLeft = d
		w.shakeTotal = d
	}
}

// Shaking reports whether a shake is in progress.
func (w *World) Shaking() bool { return w.shakeLeft > 0 }

// ShakeOffset is the board's current offset in cells: at most one cell in each
// direction, and zero when nothing is shaking.
func (w *World) ShakeOffset() (dx, dy int) {
	if w.shakeLeft <= 0 || w.shakeTotal <= 0 {
		return 0, 0
	}
	// Walk the pattern across the shake's duration.
	done := w.shakeTotal - w.shakeLeft
	step := w.shakeTotal / shakeFrames
	if step <= 0 {
		return 0, 0
	}
	i := int(done / step)
	if i >= shakeFrames {
		i = shakeFrames - 1
	}
	if i < 0 {
		i = 0
	}
	return shakePattern[i][0], shakePattern[i][1]
}

// advanceShake ages the shake. A pause holds it where it is.
func (w *World) advanceShake(dt time.Duration) {
	if w.shakeLeft <= 0 || w.Paused {
		return
	}
	w.shakeLeft -= dt
	if w.shakeLeft <= 0 {
		w.shakeLeft, w.shakeTotal = 0, 0
	}
}

// Impact is a piece hitting the stack after falling cells rows: shake scaled by
// the fall, debris thrown sideways along the landing row, and a border flash.
func (w *World) Impact(p game.Piece, cells int) {
	if !w.in.Enabled || cells <= 0 {
		return
	}
	// A long fall lands harder, but the pattern is the same one cell.
	scale := float64(cells) / float64(game.VisibleRows)
	if scale > 1 {
		scale = 1
	}
	w.Shake(shakeDuration + time.Duration(scale*float64(maxShake-shakeDuration)))
	w.FlashBorder(borderFlash)

	// Debris along the bottom edge of the landed piece, in board coordinates.
	speed := 6 + 14*scale
	for _, c := range bottomCells(p) {
		w.EmitBurst(float64(c.X), float64(c.Y), 3+int(6*scale), speed, debrisGlyphs)
	}
}

// bottomCells is the lowest cell in each column the piece occupies — the cells
// that actually hit something.
func bottomCells(p game.Piece) []game.Point {
	lowest := map[int]int{}
	for _, c := range p.Cells() {
		if y, ok := lowest[c.X]; !ok || c.Y > y {
			lowest[c.X] = c.Y
		}
	}
	out := make([]game.Point, 0, len(lowest))
	for x, y := range lowest {
		out = append(out, game.Point{X: x, Y: y})
	}
	return out
}
```

`bottomCells` iterates a map, so its order varies between runs. That is fine — every cell gets a burst either way, and the burst velocities come from the world's own RNG in whatever order the map hands them over. If a future test needs deterministic burst order across runs, sort by `X` first.

- [ ] **Step 4: Hook impact into the world**

In `internal/fx/fx.go`: add fields `shakeLeft, shakeTotal time.Duration`, delete the `ShakeOffset` stub, call `w.advanceShake(dt)` from `Advance`, and extend the hard-drop arm of `observe`:

```go
	case game.EventPieceHardDropped:
		w.addColumnTrail(e.Piece, e.Count)
		w.Impact(e.Piece, e.Count)
```

Note that the particle draw and the trail draw both need the shake offset so debris moves with the board. `drawTrails` already calls `ShakeOffset`. Particles are in screen space, not board space, so they do not shift — that is deliberate: debris belongs to the room, not to the board.

Wait — debris is emitted in *board* coordinates by `Impact`, so it must be drawn in board space too. Convert at emit time instead, so the particle pool stays screen-space throughout. Replace the debris loop in `Impact` with a deferred emission that the world converts on the first draw... no: simpler and correct is for `Impact` to store board coordinates and for `EmitBurst` callers to pass screen coordinates. Change `Impact` to take the layout-independent board cell and convert in `observe`, where the layout is not available either.

Resolve it this way, and implement exactly this: keep the particle pool in **board cell coordinates scaled to screen columns**, i.e. emit at `float64(w.board.X + c.X*render.CellCols)` and `float64(w.board.Y + c.Y - game.HiddenRows)`. `w.board` is set every frame by `SetViewport`, so the conversion is available at emit time and the pool stays screen-space. Write the debris loop as:

```go
	for _, c := range bottomCells(p) {
		sx, sy, ok := w.boardToScreen(c.X, c.Y)
		if !ok {
			continue
		}
		w.EmitBurst(sx, sy, 3+int(6*scale), speed, debrisGlyphs)
	}
```

and add to `internal/fx/fx.go`:

```go
// boardToScreen converts a board cell to screen columns and rows, reporting
// false for cells in the hidden rows or outside a board that has no room.
func (w *World) boardToScreen(bx, by int) (x, y float64, ok bool) {
	if w.board.W <= 0 || w.board.H <= 0 {
		return 0, 0, false
	}
	row := by - game.HiddenRows
	if row < 0 || row >= render.BoardInnerH {
		return 0, 0, false
	}
	if bx < 0 || bx >= game.Width {
		return 0, 0, false
	}
	return float64(w.board.X + bx*render.CellCols), float64(w.board.Y + row), true
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/fx/ ./internal/app/ -v && go test ./... -race`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/impact.go internal/fx/impact_test.go internal/fx/fx.go internal/app/shake_test.go
git commit -m "feat(fx): hard-drop impact with one-cell shake and debris"
```

---

### Task 7: Line-clear supernova

**Files:**
- Create: `internal/fx/clear.go`
- Test: `internal/fx/clear_test.go`
- Modify: `internal/fx/fx.go` (observe clears, draw them)

**Interfaces:**
- Consumes: `World`, `game.Event`, `game.ClearedRow`, `game.Cell`, `render`.
- Produces:
  - `type clearAnim struct { Rows []game.ClearedRow; Elapsed time.Duration; Count int }`
  - `func (w *World) startClear(rows []game.ClearedRow, count int)`
  - `func (w *World) advanceClears(dt time.Duration)`
  - `func (w *World) drawClears(g *render.Grid, l render.Layout, p *render.Palette)`
  - `func (w *World) ClearsActive() int`
  - consts `clearPhaseA = 70ms`, `clearPhaseB = 150ms`, `clearTotal = 220ms`

§19, three phases over ~220ms: **A** the cleared cells flash white; **B** they blow apart into particles travelling outward; **C** the gap collapses with a downward shimmer. The engine has already removed the rows — the animation replays `game.ClearedRow` snapshots at their original y, over a board that has moved on. That is why `Board.Snapshot` exists in Plan 1.

- [ ] **Step 1: Write the failing test**

Create `internal/fx/clear_test.go`:

```go
package fx

import (
	"strings"
	"testing"
	"time"

	"github.com/charmbracelet/x/ansi"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

func clearedRow(y int) game.ClearedRow {
	r := game.ClearedRow{Y: y}
	for x := 0; x < game.Width; x++ {
		r.Cells[x] = game.CellOf(game.KindT)
	}
	return r
}

func clearEvent(count int, ys ...int) game.Event {
	e := game.Event{Kind: game.EventLinesCleared, Count: count}
	for _, y := range ys {
		e.Cleared = append(e.Cleared, clearedRow(y))
	}
	return e
}

func TestLineClearStartsAnAnimation(t *testing.T) {
	w := testWorld()
	w.Observe([]game.Event{clearEvent(1, 21)})
	if w.ClearsActive() != 1 {
		t.Fatalf("ClearsActive = %d, want 1", w.ClearsActive())
	}
}

func TestPhaseAFlashesTheClearedCells(t *testing.T) {
	w := testWorld()
	w.Observe([]game.Event{clearEvent(1, 21)})
	g := render.NewGrid(80, 30)
	l := render.Compute(80, 30)
	w.SetViewport(Rect{0, 0, 80, 30}, Rect{X: l.InnerX, Y: l.InnerY, W: render.BoardInnerW, H: render.BoardInnerH})
	w.drawClears(g, l, render.NewPalette(render.ModeFull))
	out := ansi.Strip(g.Render())
	if !strings.Contains(out, "██") {
		t.Error("phase A did not fill the cleared row")
	}
}

func TestPhaseBEmitsParticles(t *testing.T) {
	w := testWorld()
	w.Observe([]game.Event{clearEvent(1, 21)})
	before := w.ParticleCount()
	w.Advance(clearPhaseA + 10*time.Millisecond)
	if w.ParticleCount() <= before {
		t.Error("phase B threw no particles")
	}
}

func TestParticlesAreEmittedOnceNotEveryFrame(t *testing.T) {
	w := testWorld()
	w.Observe([]game.Event{clearEvent(1, 21)})
	w.Advance(clearPhaseA + 10*time.Millisecond)
	n := w.ParticleCount()
	w.Advance(10 * time.Millisecond)
	if w.ParticleCount() > n {
		t.Errorf("phase B emitted again: %d -> %d", n, w.ParticleCount())
	}
}

func TestClearEndsAfterTheFullDuration(t *testing.T) {
	w := testWorld()
	w.Observe([]game.Event{clearEvent(1, 21)})
	w.Advance(clearTotal - 10*time.Millisecond)
	if w.ClearsActive() != 1 {
		t.Error("clear ended early")
	}
	w.Advance(20 * time.Millisecond)
	if w.ClearsActive() != 0 {
		t.Errorf("clear outlived %v", clearTotal)
	}
}

// Restraint rule: never delay gameplay for animation.
func TestClearAnimationDoesNotBlockGameplay(t *testing.T) {
	w := testWorld()
	gm := game.New(21)
	w.Observe([]game.Event{clearEvent(4, 18, 19, 20, 21)})
	x := gm.Active.X
	gm.MoveLeft()
	w.Observe(gm.DrainEvents())
	if gm.Active.X == x {
		t.Error("the engine refused a move during a clear animation")
	}
	if w.ClearsActive() == 0 {
		t.Error("the animation stopped because the player moved")
	}
}

func TestMoreRowsMeansMoreParticlesButStillCapped(t *testing.T) {
	single, quad := testWorld(), testWorld()
	single.Observe([]game.Event{clearEvent(1, 21)})
	quad.Observe([]game.Event{clearEvent(4, 18, 19, 20, 21)})
	single.Advance(clearPhaseA + 10*time.Millisecond)
	quad.Advance(clearPhaseA + 10*time.Millisecond)
	if quad.ParticleCount() <= single.ParticleCount() {
		t.Errorf("a tetris threw %d particles, a single threw %d",
			quad.ParticleCount(), single.ParticleCount())
	}
	if quad.ParticleCount() > MaxParticles {
		t.Errorf("a tetris exceeded the cap: %d", quad.ParticleCount())
	}
}

func TestClearsDrawInsideTheBoardOnly(t *testing.T) {
	w := testWorld()
	g := render.NewGrid(80, 30)
	l := render.Compute(80, 30)
	w.SetViewport(Rect{0, 0, 80, 30}, Rect{X: l.InnerX, Y: l.InnerY, W: render.BoardInnerW, H: render.BoardInnerH})
	w.Observe([]game.Event{clearEvent(4, 18, 19, 20, 21)})
	for i := 0; i < 14; i++ {
		w.drawClears(g, l, render.NewPalette(render.ModeFull))
		for y := 0; y < g.H; y++ {
			for x := 0; x < g.W; x++ {
				if g.At(x, y).Rune == ' ' {
					continue
				}
				if x < l.InnerX || x >= l.InnerX+render.BoardInnerW ||
					y < l.InnerY || y >= l.InnerY+render.BoardInnerH {
					t.Fatalf("clear drew outside the playfield at (%d,%d)", x, y)
				}
			}
		}
		w.Advance(16 * time.Millisecond)
	}
}

func TestHiddenRowClearsAreIgnored(t *testing.T) {
	w := testWorld()
	g := render.NewGrid(80, 30)
	l := render.Compute(80, 30)
	w.SetViewport(Rect{0, 0, 80, 30}, Rect{X: l.InnerX, Y: l.InnerY, W: render.BoardInnerW, H: render.BoardInnerH})
	w.Observe([]game.Event{clearEvent(1, 0)}) // a hidden row
	w.drawClears(g, l, render.NewPalette(render.ModeFull))
	if strings.TrimSpace(ansi.Strip(g.Render())) != "" {
		t.Error("a clear in the hidden rows drew on screen")
	}
}

func TestClearIsASCIISafe(t *testing.T) {
	w := testWorld()
	g := render.NewGrid(80, 30)
	l := render.Compute(80, 30)
	w.SetViewport(Rect{0, 0, 80, 30}, Rect{X: l.InnerX, Y: l.InnerY, W: render.BoardInnerW, H: render.BoardInnerH})
	w.Observe([]game.Event{clearEvent(2, 20, 21)})
	for i := 0; i < 14; i++ {
		w.drawClears(g, l, render.NewPalette(render.ModeASCII))
		for _, r := range ansi.Strip(g.Render()) {
			if r > 127 && r != '\n' {
				t.Fatalf("ASCII mode drew %q during a clear", r)
			}
		}
		w.Advance(16 * time.Millisecond)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run Clear -v`
Expected: FAIL — `undefined: clearPhaseA`.

- [ ] **Step 3: Implement the supernova**

Create `internal/fx/clear.go`:

```go
package fx

import (
	"time"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

// A clear runs in three phases: flash, shatter, collapse. Two hundred and
// twenty milliseconds total, which is long enough to see and short enough that
// it is over before the next piece matters.
const (
	clearPhaseA = 70 * time.Millisecond
	clearPhaseB = 150 * time.Millisecond
	clearTotal  = 220 * time.Millisecond
)

// clearGlyphs is what the shattered cells become.
var clearGlyphs = []rune{'✦', '*', '·', '+'}

// clearAnim is one line clear replaying over a board that has already
// collapsed. The rows are snapshots taken before the engine removed them.
type clearAnim struct {
	Rows    []game.ClearedRow
	Elapsed time.Duration
	Count   int

	// shattered records that phase B has already thrown its particles, so it
	// throws them once rather than every frame.
	shattered bool
}

// ClearsActive is how many clear animations are running.
func (w *World) ClearsActive() int { return len(w.clears) }

// startClear begins the animation for a set of cleared rows.
func (w *World) startClear(rows []game.ClearedRow, count int) {
	if !w.in.Enabled || len(rows) == 0 {
		return
	}
	w.clears = append(w.clears, clearAnim{
		Rows:  append([]game.ClearedRow(nil), rows...),
		Count: count,
	})
	w.FlashBorder(clearPhaseA)
}

// advanceClears ages the animations and fires phase B once each.
func (w *World) advanceClears(dt time.Duration) {
	if len(w.clears) == 0 || w.Paused {
		return
	}
	keep := w.clears[:0]
	for _, c := range w.clears {
		c.Elapsed += dt
		if c.Elapsed >= clearPhaseA && !c.shattered {
			w.shatter(c)
			c.shattered = true
		}
		if c.Elapsed >= clearTotal {
			continue
		}
		keep = append(keep, c)
	}
	w.clears = keep
}

// shatter throws particles from every cell of every cleared row. Bigger clears
// throw more per cell, and the pool cap keeps a tetris honest.
func (w *World) shatter(c clearAnim) {
	per := 2 + c.Count
	speed := 10 + 4*float64(c.Count)
	for _, row := range c.Rows {
		for x := 0; x < game.Width; x++ {
			if !row.Cells[x].Filled() {
				continue
			}
			sx, sy, ok := w.boardToScreen(x, row.Y)
			if !ok {
				continue
			}
			w.EmitBurst(sx, sy, per, speed, clearGlyphs)
		}
	}
}

// drawClears paints the current phase of each animation.
func (w *World) drawClears(g *render.Grid, l render.Layout, p *render.Palette) {
	dx, dy := w.ShakeOffset()
	for _, c := range w.clears {
		for _, row := range c.Rows {
			for x := 0; x < game.Width; x++ {
				if !row.Cells[x].Filled() {
					continue
				}
				sx, sy, ok := render.BoardCellXY(l, x, row.Y, dx, dy)
				if !ok {
					continue
				}
				glyph, style := clearCell(c, x, row.Y, p)
				if glyph == 0 {
					continue
				}
				g.Set(sx, sy, glyph, style)
				g.Set(sx+1, sy, glyph, style)
			}
		}
	}
}

// clearCell picks the glyph and style for one cell at the animation's current
// phase. A zero rune means draw nothing.
func clearCell(c clearAnim, x, y int, p *render.Palette) (rune, *render.Style) {
	block := []rune(p.BlockFor(false))
	solid := block[0]
	switch {
	case c.Elapsed < clearPhaseA:
		// Phase A: pure white flash.
		return solid, p.Flash
	case c.Elapsed < clearPhaseB:
		// Phase B: breaking up. Alternate cells vanish so the row reads as
		// disintegrating rather than merely recoloured.
		if (x+y)%2 == 0 {
			return 0, nil
		}
		glyph := '▒'
		if p.Mode == render.ModeASCII {
			glyph = asciiParticle(glyph)
		}
		return glyph, p.Star[2]
	default:
		// Phase C: the collapse shimmer, fading out.
		glyph := '░'
		if p.Mode == render.ModeASCII {
			glyph = asciiParticle(glyph)
		}
		if (x+y)%3 != 0 {
			return 0, nil
		}
		return glyph, p.Star[1]
	}
}
```

`p.Flash` is a new palette entry: a hot-white style for flashes. Add it to `internal/render/palette.go` alongside `BorderHot`, in every mode:

```go
	Flash: NewStyle(lipgloss.Color("#FFFFFF"), true, false),
```

- [ ] **Step 4: Hook clears into the world**

In `internal/fx/fx.go`: add field `clears []clearAnim`, call `w.advanceClears(dt)` from `Advance`, draw them in `DrawBoardFX` after the trails and before the particles, and add the arm to `observe`:

```go
	case game.EventLinesCleared:
		w.startClear(e.Cleared, e.Count)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/fx/ ./internal/render/ -v && go test ./... -race`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/clear.go internal/fx/clear_test.go internal/fx/fx.go internal/render/palette.go
git commit -m "feat(fx): three-phase supernova line clear over row snapshots"
```

---

### Task 8: Hyperdrive

**Files:**
- Create: `internal/fx/hyperdrive.go`
- Test: `internal/fx/hyperdrive_test.go`
- Modify: `internal/fx/fx.go` (real `Hyperdrive`)

**Interfaces:**
- Consumes: `World`.
- Produces:
  - `func (w *World) StartHyperdrive()`
  - `func (w *World) Hyperdrive() float64` (replaces the stub)
  - `func (w *World) HyperdriveActive() bool`
  - `var hyperdriveKeyframes = []struct{ At time.Duration; Speed float64 }{...}` at `0/50/100/500/800/1100ms`

§16: on a four-line clear the starfield accelerates — a fast ramp to a wild multiplier, a hold, then a decay back to normal, over 1100ms on the pinned keyframes. `--reduced-motion` suppresses it (§49.5), which means `Hyperdrive()` returns `1` throughout and the starfield never accelerates.

- [ ] **Step 1: Write the failing test**

Create `internal/fx/hyperdrive_test.go`:

```go
package fx

import (
	"testing"
	"time"
)

func TestHyperdriveIsIdleByDefault(t *testing.T) {
	w := testWorld()
	if w.HyperdriveActive() {
		t.Error("hyperdrive active with nothing happening")
	}
	if got := w.Hyperdrive(); got != 1 {
		t.Errorf("idle multiplier = %.2f, want 1", got)
	}
}

func TestHyperdriveRampsHoldsAndDecays(t *testing.T) {
	w := testWorld()
	w.StartHyperdrive()

	at := func(d time.Duration) float64 {
		w2 := testWorld()
		w2.StartHyperdrive()
		w2.Advance(d)
		return w2.Hyperdrive()
	}
	ramp, peak, hold, end := at(50*time.Millisecond), at(100*time.Millisecond), at(500*time.Millisecond), at(1100*time.Millisecond)

	if !(ramp > 1) {
		t.Errorf("50ms multiplier %.2f did not rise above 1", ramp)
	}
	if !(peak > ramp) {
		t.Errorf("100ms multiplier %.2f is not the peak (50ms was %.2f)", peak, ramp)
	}
	if !(hold < peak && hold > 1) {
		t.Errorf("500ms multiplier %.2f should be past the peak and still fast", hold)
	}
	if end != 1 {
		t.Errorf("1100ms multiplier = %.2f, want back to 1", end)
	}
}

func TestHyperdriveEndsAndStaysEnded(t *testing.T) {
	w := testWorld()
	w.StartHyperdrive()
	w.Advance(2 * time.Second)
	if w.HyperdriveActive() {
		t.Error("hyperdrive outlived its timeline")
	}
	if got := w.Hyperdrive(); got != 1 {
		t.Errorf("multiplier after the end = %.2f, want 1", got)
	}
}

func TestHyperdriveActuallySpeedsTheStars(t *testing.T) {
	slow := testWorld()
	fast := testWorld()
	fast.StartHyperdrive()
	fast.Advance(100 * time.Millisecond)
	if fast.starSpeed(2) <= slow.starSpeed(2) {
		t.Errorf("hyperdrive star speed %.2f is not faster than %.2f",
			fast.starSpeed(2), slow.starSpeed(2))
	}
}

func TestHyperdriveRestartsFromTheBeginning(t *testing.T) {
	w := testWorld()
	w.StartHyperdrive()
	w.Advance(900 * time.Millisecond)
	late := w.Hyperdrive()
	w.StartHyperdrive()
	if got := w.Hyperdrive(); got >= late && late > 1 {
		// A restart resets to the start of the ramp, which is slower than the
		// tail of a decay only if the decay had not finished; either way the
		// clock must have been reset.
	}
	if w.hyperElapsed != 0 {
		t.Errorf("restart left the clock at %v", w.hyperElapsed)
	}
}

// 49.5.
func TestReducedMotionDisablesHyperdrive(t *testing.T) {
	w := New(5, Intensity{Enabled: true, ReducedMotion: true})
	w.SetViewport(Rect{0, 0, 80, 30}, Rect{X: 24, Y: 5, W: 20, H: 20})
	w.StartHyperdrive()
	for i := 0; i < 20; i++ {
		if got := w.Hyperdrive(); got != 1 {
			t.Fatalf("reduced motion accelerated to %.2f", got)
		}
		w.Advance(50 * time.Millisecond)
	}
	if w.HyperdriveActive() {
		t.Error("reduced motion started hyperdrive")
	}
}

func TestPauseHoldsHyperdrive(t *testing.T) {
	w := testWorld()
	w.StartHyperdrive()
	w.Advance(100 * time.Millisecond)
	peak := w.Hyperdrive()
	w.Paused = true
	w.Advance(time.Second)
	if got := w.Hyperdrive(); got != peak {
		t.Errorf("hyperdrive advanced while paused: %.2f -> %.2f", peak, got)
	}
}

func TestHyperdriveMultiplierIsBounded(t *testing.T) {
	w := testWorld()
	w.StartHyperdrive()
	for i := 0; i < 100; i++ {
		got := w.Hyperdrive()
		if got < 1 || got > 20 {
			t.Fatalf("multiplier %.2f is out of range at %v", got, w.hyperElapsed)
		}
		w.Advance(16 * time.Millisecond)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run Hyperdrive -v`
Expected: FAIL — `undefined: StartHyperdrive`.

- [ ] **Step 3: Implement hyperdrive**

Create `internal/fx/hyperdrive.go`:

```go
package fx

import "time"

// The hyperdrive timeline is pinned: a hard kick, a peak, a long fast hold, and
// a decay back to ordinary space over one and a tenth seconds.
var hyperdriveKeyframes = []struct {
	At    time.Duration
	Speed float64
}{
	{0, 1.0},
	{50 * time.Millisecond, 4.0},
	{100 * time.Millisecond, 12.0},
	{500 * time.Millisecond, 8.0},
	{800 * time.Millisecond, 3.0},
	{1100 * time.Millisecond, 1.0},
}

// hyperdriveTotal is the end of the timeline.
var hyperdriveTotal = hyperdriveKeyframes[len(hyperdriveKeyframes)-1].At

// StartHyperdrive kicks the starfield into overdrive from the top of the
// timeline. Reduced motion declines.
func (w *World) StartHyperdrive() {
	if !w.in.Enabled || w.in.ReducedMotion {
		return
	}
	w.hyperElapsed = 0
	w.hyperOn = true
}

// HyperdriveActive reports whether the timeline is running.
func (w *World) HyperdriveActive() bool { return w.hyperOn }

// Hyperdrive is the current starfield speed multiplier, interpolated linearly
// between keyframes. It is 1 when nothing is happening.
func (w *World) Hyperdrive() float64 {
	if !w.hyperOn {
		return 1
	}
	t := w.hyperElapsed
	for i := 1; i < len(hyperdriveKeyframes); i++ {
		prev, next := hyperdriveKeyframes[i-1], hyperdriveKeyframes[i]
		if t > next.At {
			continue
		}
		span := next.At - prev.At
		if span <= 0 {
			return next.Speed
		}
		frac := float64(t-prev.At) / float64(span)
		return prev.Speed + (next.Speed-prev.Speed)*frac
	}
	return 1
}

// advanceHyperdrive runs the timeline. A pause holds it.
func (w *World) advanceHyperdrive(dt time.Duration) {
	if !w.hyperOn || w.Paused {
		return
	}
	w.hyperElapsed += dt
	if w.hyperElapsed >= hyperdriveTotal {
		w.hyperOn = false
		w.hyperElapsed = 0
	}
}
```

- [ ] **Step 4: Hook hyperdrive into the world**

In `internal/fx/fx.go`: add fields `hyperElapsed time.Duration` and `hyperOn bool`, delete the `Hyperdrive` stub from `stars.go`'s task, and call `w.advanceHyperdrive(dt)` from `Advance` **before** `advanceStars`, so the frame's star motion uses the frame's multiplier.

Task 10 calls `StartHyperdrive` on a four-line clear; the clear arm stays as it is for now.

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v && go test ./... -race`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/hyperdrive.go internal/fx/hyperdrive_test.go internal/fx/fx.go
git commit -m "feat(fx): hyperdrive starfield acceleration on the pinned timeline"
```

---

### Task 9: Shockwaves

**Files:**
- Create: `internal/fx/shockwave.go`
- Test: `internal/fx/shockwave_test.go`
- Modify: `internal/fx/fx.go` (own waves, draw them)

**Interfaces:**
- Consumes: `World`, `render`.
- Produces:
  - `type shockwave struct { X, Y float64; Elapsed time.Duration; MaxRadius float64 }`
  - `func (w *World) Shockwave(x, y float64, maxRadius float64)`
  - `func (w *World) advanceShockwaves(dt time.Duration)`
  - `func (w *World) drawShockwaves(g *render.Grid, p *render.Palette)`
  - `func (w *World) ShockwaveCount() int`
  - const `shockwaveLife = 300 * time.Millisecond`

§24: an expanding ring of `· ○ ◌ ◯` that grows and fades over ~300ms, used for big impacts and tetrises. Rings are drawn in screen space and clipped by the grid. Terminal cells are about twice as tall as they are wide, so the ring is drawn with a 2:1 horizontal stretch or it looks like a vertical ellipse. `--reduced-motion` suppresses shockwaves (§49.5).

- [ ] **Step 1: Write the failing test**

Create `internal/fx/shockwave_test.go`:

```go
package fx

import (
	"strings"
	"testing"
	"time"

	"github.com/charmbracelet/x/ansi"

	"cosmic-tetris/internal/render"
)

func TestShockwaveStartsAndExpires(t *testing.T) {
	w := testWorld()
	w.Shockwave(40, 15, 10)
	if w.ShockwaveCount() != 1 {
		t.Fatalf("ShockwaveCount = %d, want 1", w.ShockwaveCount())
	}
	w.Advance(shockwaveLife + 20*time.Millisecond)
	if w.ShockwaveCount() != 0 {
		t.Error("shockwave outlived its life")
	}
}

func TestShockwaveExpands(t *testing.T) {
	radiusDrawn := func(after time.Duration) int {
		w := testWorld()
		w.Shockwave(40, 15, 12)
		w.Advance(after)
		g := render.NewGrid(80, 30)
		w.drawShockwaves(g, render.NewPalette(render.ModeFull))
		out := ansi.Strip(g.Render())
		widest := 0
		for _, line := range strings.Split(out, "\n") {
			l, r := strings.IndexFunc(line, isMark), strings.LastIndexFunc(line, isMark)
			if l >= 0 && r-l > widest {
				widest = r - l
			}
		}
		return widest
	}
	early, late := radiusDrawn(30*time.Millisecond), radiusDrawn(200*time.Millisecond)
	if late <= early {
		t.Errorf("ring did not expand: %d cells at 30ms, %d at 200ms", early, late)
	}
}

func isMark(r rune) bool { return r != ' ' && r != '\n' }

func TestShockwaveStaysOnScreen(t *testing.T) {
	w := testWorld()
	// Centred at the corner, with a radius larger than the terminal.
	w.Shockwave(0, 0, 60)
	for i := 0; i < 20; i++ {
		g := render.NewGrid(80, 30)
		w.drawShockwaves(g, render.NewPalette(render.ModeFull))
		lines := strings.Split(ansi.Strip(g.Render()), "\n")
		if len(lines) != 30 {
			t.Fatalf("frame %d has %d rows, want 30", i, len(lines))
		}
		for _, line := range lines {
			if n := len([]rune(line)); n > 80 {
				t.Fatalf("frame %d produced a %d-cell row", i, n)
			}
		}
		w.Advance(16 * time.Millisecond)
	}
}

func TestShockwaveIsWiderThanTall(t *testing.T) {
	// Terminal cells are roughly 1:2, so a circle needs a 2:1 stretch.
	w := testWorld()
	w.Shockwave(40, 15, 12)
	w.Advance(150 * time.Millisecond)
	g := render.NewGrid(80, 30)
	w.drawShockwaves(g, render.NewPalette(render.ModeFull))
	lines := strings.Split(ansi.Strip(g.Render()), "\n")
	var width, height int
	for _, line := range lines {
		l, r := strings.IndexFunc(line, isMark), strings.LastIndexFunc(line, isMark)
		if l < 0 {
			continue
		}
		height++
		if r-l+1 > width {
			width = r - l + 1
		}
	}
	if height == 0 {
		t.Fatal("the ring drew nothing")
	}
	if width <= height {
		t.Errorf("ring is %d wide and %d tall; it should be about twice as wide", width, height)
	}
}

func TestShockwaveGlyphsAreFromTheSpec(t *testing.T) {
	w := testWorld()
	w.Shockwave(40, 15, 10)
	seen := map[rune]bool{}
	for i := 0; i < 20; i++ {
		g := render.NewGrid(80, 30)
		w.drawShockwaves(g, render.NewPalette(render.ModeFull))
		for _, r := range ansi.Strip(g.Render()) {
			if r != ' ' && r != '\n' {
				seen[r] = true
			}
		}
		w.Advance(16 * time.Millisecond)
	}
	for r := range seen {
		if !strings.ContainsRune("·○◌◯", r) {
			t.Errorf("unexpected shockwave glyph %q", r)
		}
	}
	if len(seen) < 2 {
		t.Errorf("the ring used only %d glyphs; it should change as it expands", len(seen))
	}
}

func TestShockwaveIsASCIISafe(t *testing.T) {
	w := testWorld()
	w.Shockwave(40, 15, 10)
	for i := 0; i < 20; i++ {
		g := render.NewGrid(80, 30)
		w.drawShockwaves(g, render.NewPalette(render.ModeASCII))
		for _, r := range ansi.Strip(g.Render()) {
			if r > 127 && r != '\n' {
				t.Fatalf("ASCII mode drew %q", r)
			}
		}
		w.Advance(16 * time.Millisecond)
	}
}

// 49.5.
func TestReducedMotionSuppressesShockwaves(t *testing.T) {
	w := New(6, Intensity{Enabled: true, ReducedMotion: true})
	w.SetViewport(Rect{0, 0, 80, 30}, Rect{X: 24, Y: 5, W: 20, H: 20})
	w.Shockwave(40, 15, 10)
	if w.ShockwaveCount() != 0 {
		t.Error("reduced motion produced a shockwave")
	}
}

func TestPauseHoldsShockwaves(t *testing.T) {
	w := testWorld()
	w.Shockwave(40, 15, 10)
	before := w.shockwaves[0].Elapsed
	w.Paused = true
	w.Advance(200 * time.Millisecond)
	if w.shockwaves[0].Elapsed != before {
		t.Error("a shockwave expanded while paused")
	}
}

// Review Focus item 2.
func TestShockwavesAfterAResizeStayInBounds(t *testing.T) {
	w := testWorld()
	w.Shockwave(70, 25, 20)
	w.SetViewport(Rect{0, 0, 40, 24}, Rect{X: 4, Y: 2, W: 20, H: 20})
	for i := 0; i < 20; i++ {
		out := drawWorld(w, 40, 24)
		for _, line := range strings.Split(out, "\n") {
			if n := len([]rune(line)); n > 40 {
				t.Fatalf("row of %d cells after a resize", n)
			}
		}
		w.Advance(16 * time.Millisecond)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run Shockwave -v`
Expected: FAIL — `undefined: shockwaveLife`.

- [ ] **Step 3: Implement shockwaves**

Create `internal/fx/shockwave.go`:

```go
package fx

import (
	"math"
	"time"

	"cosmic-tetris/internal/render"
)

// shockwaveLife is how long a ring takes to expand and fade.
const shockwaveLife = 300 * time.Millisecond

// cellAspect is roughly how much taller a terminal cell is than it is wide.
// Rings are stretched by it so they read as circles.
const cellAspect = 2.0

// shockwaveGlyphs run from a tight new ring to a wide faint one.
var shockwaveGlyphs = []rune{'·', '○', '◌', '◯'}

// shockwave is an expanding ring in screen coordinates.
type shockwave struct {
	X, Y      float64
	Elapsed   time.Duration
	MaxRadius float64
}

// ShockwaveCount is how many rings are expanding.
func (w *World) ShockwaveCount() int { return len(w.shockwaves) }

// Shockwave starts a ring at (x, y) that grows to maxRadius rows.
func (w *World) Shockwave(x, y, maxRadius float64) {
	if !w.in.Enabled || w.in.ReducedMotion || maxRadius <= 0 {
		return
	}
	w.shockwaves = append(w.shockwaves, shockwave{X: x, Y: y, MaxRadius: maxRadius})
}

// advanceShockwaves expands the rings and retires the finished ones.
func (w *World) advanceShockwaves(dt time.Duration) {
	if len(w.shockwaves) == 0 || w.Paused {
		return
	}
	keep := w.shockwaves[:0]
	for _, s := range w.shockwaves {
		s.Elapsed += dt
		if s.Elapsed >= shockwaveLife {
			continue
		}
		keep = append(keep, s)
	}
	w.shockwaves = keep
}

// drawShockwaves paints each ring at its current radius. The ring is walked by
// angle rather than by scanning the grid, so cost is proportional to the
// circumference, not the screen.
func (w *World) drawShockwaves(g *render.Grid, p *render.Palette) {
	ascii := p.Mode == render.ModeASCII
	for _, s := range w.shockwaves {
		frac := float64(s.Elapsed) / float64(shockwaveLife)
		if frac < 0 {
			frac = 0
		}
		if frac > 1 {
			frac = 1
		}
		radius := s.MaxRadius * frac
		if radius < 0.5 {
			radius = 0.5
		}

		idx := int(frac * float64(len(shockwaveGlyphs)))
		if idx >= len(shockwaveGlyphs) {
			idx = len(shockwaveGlyphs) - 1
		}
		glyph := shockwaveGlyphs[idx]
		if ascii {
			glyph = asciiParticle(glyph)
		}

		// Fade as it expands: bright, then dim.
		st := p.Star[2]
		switch {
		case frac > 0.66:
			st = p.Star[0]
		case frac > 0.33:
			st = p.Star[1]
		}

		steps := int(math.Max(8, radius*cellAspect*4))
		for i := 0; i < steps; i++ {
			angle := 2 * math.Pi * float64(i) / float64(steps)
			x := int(math.Round(s.X + math.Cos(angle)*radius*cellAspect))
			y := int(math.Round(s.Y + math.Sin(angle)*radius))
			g.Set(x, y, glyph, st) // Grid.Set clips
		}
	}
}
```

- [ ] **Step 4: Hook shockwaves into the world**

In `internal/fx/fx.go`: add field `shockwaves []shockwave`, call `w.advanceShockwaves(dt)` from `Advance`, and draw them in `DrawGlobalFX` — a ring is a room-scale event and may cross the HUD, but never the overlay, which `render.Frame` draws last:

```go
func (w *World) DrawGlobalFX(g *render.Grid, l render.Layout, p *render.Palette) {
	if !w.in.Enabled {
		return
	}
	w.drawShockwaves(g, p)
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v && go test ./... -race`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/shockwave.go internal/fx/shockwave_test.go internal/fx/fx.go
git commit -m "feat(fx): expanding shockwave rings with terminal aspect correction"
```

---

### Task 10: The four-line sequence and the banner system

**Files:**
- Create: `internal/fx/banner.go`
- Test: `internal/fx/banner_test.go`
- Modify: `internal/fx/fx.go` (four-line arm, draw banners)

**Interfaces:**
- Consumes: `World`, `game.Event`, `render.Layout`, `render.Grid`.
- Produces:
  - `type banner struct { Text, Sub string; Elapsed, Life time.Duration; Hot bool }`
  - `func (w *World) ShowBanner(text, sub string, life time.Duration, hot bool)`
  - `func (w *World) advanceBanners(dt time.Duration)`
  - `func (w *World) drawBanner(g *render.Grid, l render.Layout, p *render.Palette)`
  - `func (w *World) BannerText() (text, sub string)`
  - `func (w *World) fourLineSequence(rows []game.ClearedRow)`
  - const `bannerLife = 700 * time.Millisecond`
  - `var fourLineBanners = []string{...}` — the four §20 lines.

§20: a four-line clear runs everything at once — the supernova, hyperdrive, a full-width shockwave, a heavy shake, and a banner from the pinned list, for ~700ms.

**Banner placement is the §44 "never obscure the active piece" rule made structural:** banners draw as a single centred line in the row directly *above* the board's top border, falling back to the title row and then to the mission line. They are never drawn inside the playfield rect. A test pins that invariant, and every later banner (level-up, combo) inherits it because they all go through `drawBanner`.

- [ ] **Step 1: Write the failing test**

Create `internal/fx/banner_test.go`:

```go
package fx

import (
	"strings"
	"testing"
	"time"

	"github.com/charmbracelet/x/ansi"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

func TestBannerAppearsAndExpires(t *testing.T) {
	w := testWorld()
	w.ShowBanner("✦ EVENT HORIZON ✦", "", bannerLife, true)
	text, _ := w.BannerText()
	if text != "✦ EVENT HORIZON ✦" {
		t.Fatalf("BannerText = %q", text)
	}
	w.Advance(bannerLife + 20*time.Millisecond)
	if text, _ := w.BannerText(); text != "" {
		t.Errorf("banner outlived its life: %q", text)
	}
}

func TestFourLineClearRunsTheWholeSequence(t *testing.T) {
	w := testWorld()
	w.Observe([]game.Event{clearEvent(4, 18, 19, 20, 21)})

	if w.ClearsActive() == 0 {
		t.Error("no supernova")
	}
	if !w.HyperdriveActive() {
		t.Error("no hyperdrive")
	}
	if w.ShockwaveCount() == 0 {
		t.Error("no shockwave")
	}
	if !w.Shaking() {
		t.Error("no shake")
	}
	text, _ := w.BannerText()
	if text == "" {
		t.Error("no banner")
	}
}

func TestFourLineBannerComesFromTheSpecList(t *testing.T) {
	seen := map[string]bool{}
	for seed := int64(0); seed < 60; seed++ {
		w := New(seed, Intensity{Enabled: true})
		w.SetViewport(Rect{0, 0, 80, 30}, Rect{X: 24, Y: 5, W: 20, H: 20})
		w.Observe([]game.Event{clearEvent(4, 18, 19, 20, 21)})
		text, _ := w.BannerText()
		var ok bool
		for _, want := range fourLineBanners {
			if text == want {
				ok = true
			}
		}
		if !ok {
			t.Fatalf("seed %d produced an off-spec banner %q", seed, text)
		}
		seen[text] = true
	}
	if len(seen) < 2 {
		t.Errorf("sixty seeds produced only %d distinct banners", len(seen))
	}
}

func TestSingleClearDoesNotRunTheFourLineSequence(t *testing.T) {
	w := testWorld()
	w.Observe([]game.Event{clearEvent(1, 21)})
	if w.HyperdriveActive() {
		t.Error("a single line engaged hyperdrive")
	}
	if text, _ := w.BannerText(); text != "" {
		t.Errorf("a single line raised the banner %q", text)
	}
}

// Restraint rule: never obscure the active piece. This is the structural test.
func TestBannersNeverDrawInsideThePlayfield(t *testing.T) {
	for _, size := range [][2]int{{80, 30}, {48, 26}, {40, 24}} {
		cols, rows := size[0], size[1]
		w := New(3, Intensity{Enabled: true})
		l := render.Compute(cols, rows)
		w.SetViewport(Rect{0, 0, cols, rows},
			Rect{X: l.InnerX, Y: l.InnerY, W: render.BoardInnerW, H: render.BoardInnerH})
		w.ShowBanner("QUADRUPLE COSMIC INCIDENT", "SPACE-TIME HAS FILED A COMPLAINT", bannerLife, true)

		for i := 0; i < 45; i++ {
			g := render.NewGrid(cols, rows)
			w.drawBanner(g, l, render.NewPalette(render.ModeFull))
			for y := l.InnerY; y < l.InnerY+render.BoardInnerH; y++ {
				for x := l.InnerX; x < l.InnerX+render.BoardInnerW; x++ {
					if got := g.At(x, y).Rune; got != ' ' {
						t.Fatalf("%dx%d: banner drew %q inside the playfield at (%d,%d)",
							cols, rows, got, x, y)
					}
				}
			}
			w.Advance(16 * time.Millisecond)
		}
	}
}

func TestBannerIsCentredAndFitsTheTerminal(t *testing.T) {
	for _, size := range [][2]int{{80, 30}, {48, 26}, {40, 24}} {
		cols, rows := size[0], size[1]
		w := New(3, Intensity{Enabled: true})
		l := render.Compute(cols, rows)
		w.SetViewport(Rect{0, 0, cols, rows},
			Rect{X: l.InnerX, Y: l.InnerY, W: render.BoardInnerW, H: render.BoardInnerH})
		w.ShowBanner("FOUR ROWS HAVE LEFT THE CHAT", "", bannerLife, true)
		g := render.NewGrid(cols, rows)
		w.drawBanner(g, l, render.NewPalette(render.ModeFull))
		for _, line := range strings.Split(ansi.Strip(g.Render()), "\n") {
			if n := len([]rune(line)); n > cols {
				t.Fatalf("%dx%d: banner produced a %d-cell row", cols, rows, n)
			}
		}
	}
}

func TestOverlongBannerIsTruncatedNotWrapped(t *testing.T) {
	w := New(3, Intensity{Enabled: true})
	l := render.Compute(40, 24)
	w.SetViewport(Rect{0, 0, 40, 24}, Rect{X: l.InnerX, Y: l.InnerY, W: render.BoardInnerW, H: render.BoardInnerH})
	w.ShowBanner(strings.Repeat("COSMIC ", 20), "", bannerLife, true)
	g := render.NewGrid(40, 24)
	w.drawBanner(g, l, render.NewPalette(render.ModeFull))
	out := ansi.Strip(g.Render())
	if n := strings.Count(out, "\n") + 1; n != 24 {
		t.Errorf("an overlong banner changed the row count to %d", n)
	}
}

func TestANewBannerReplacesTheOld(t *testing.T) {
	w := testWorld()
	w.ShowBanner("FIRST", "", bannerLife, true)
	w.ShowBanner("SECOND", "", bannerLife, true)
	if text, _ := w.BannerText(); text != "SECOND" {
		t.Errorf("BannerText = %q, want SECOND", text)
	}
}

func TestBannerIsASCIISafeInASCIIMode(t *testing.T) {
	w := testWorld()
	l := render.Compute(80, 30)
	w.ShowBanner("✦ EVENT HORIZON ✦", "", bannerLife, true)
	g := render.NewGrid(80, 30)
	w.drawBanner(g, l, render.NewPalette(render.ModeASCII))
	for _, r := range ansi.Strip(g.Render()) {
		if r > 127 && r != '\n' {
			t.Fatalf("ASCII mode drew %q in a banner", r)
		}
	}
}

func TestPauseHoldsBanners(t *testing.T) {
	w := testWorld()
	w.ShowBanner("HELD", "", bannerLife, true)
	w.Paused = true
	w.Advance(2 * time.Second)
	if text, _ := w.BannerText(); text != "HELD" {
		t.Error("a banner expired while paused")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run 'Banner|FourLine' -v`
Expected: FAIL — `undefined: bannerLife`.

- [ ] **Step 3: Implement banners and the four-line sequence**

Create `internal/fx/banner.go`:

```go
package fx

import (
	"time"

	"github.com/charmbracelet/x/ansi"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

// bannerLife is how long a major-event banner holds the screen.
const bannerLife = 700 * time.Millisecond

// fourLineBanners are the lines a tetris may announce, verbatim from 20.
var fourLineBanners = []string{
	"✦ EVENT HORIZON ✦",
	"QUADRUPLE COSMIC INCIDENT",
	"FOUR ROWS HAVE LEFT THE CHAT",
	"SPACE-TIME HAS FILED A COMPLAINT",
}

// banner is one announcement above the board.
type banner struct {
	Text    string
	Sub     string
	Elapsed time.Duration
	Life    time.Duration
	Hot     bool
}

// ShowBanner raises an announcement, replacing any current one.
func (w *World) ShowBanner(text, sub string, life time.Duration, hot bool) {
	if !w.in.Enabled || text == "" || life <= 0 {
		return
	}
	w.banner = &banner{Text: text, Sub: sub, Life: life, Hot: hot}
}

// BannerText is the current announcement, empty when there is none.
func (w *World) BannerText() (text, sub string) {
	if w.banner == nil {
		return "", ""
	}
	return w.banner.Text, w.banner.Sub
}

// advanceBanners ages the announcement. A pause holds it.
func (w *World) advanceBanners(dt time.Duration) {
	if w.banner == nil || w.Paused {
		return
	}
	w.banner.Elapsed += dt
	if w.banner.Elapsed >= w.banner.Life {
		w.banner = nil
	}
}

// bannerRows are the rows a banner may use, in order of preference: directly
// above the board's top border, then the title row, then the mission line.
// Never inside the playfield — 44 forbids obscuring the active piece, and the
// cheapest way to obey a rule is to make breaking it impossible.
func bannerRows(l render.Layout) []int {
	rows := []int{}
	if above := l.BoardY - 1; above >= 0 && above != l.TitleY {
		rows = append(rows, above)
	}
	if l.TitleY >= 0 {
		rows = append(rows, l.TitleY)
	}
	if l.MissionY >= 0 {
		rows = append(rows, l.MissionY)
	}
	return rows
}

// drawBanner paints the announcement centred on the first available row, and
// the subtitle on the next one if there is a second row to spare.
func (w *World) drawBanner(g *render.Grid, l render.Layout, p *render.Palette) {
	if w.banner == nil {
		return
	}
	rows := bannerRows(l)
	if len(rows) == 0 {
		return
	}

	// Blink twice over the banner's life so it reads as an alarm, not a label.
	frac := float64(w.banner.Elapsed) / float64(w.banner.Life)
	st := p.Flash
	if !w.banner.Hot || int(frac*6)%2 == 1 {
		st = p.Accent
	}

	w.drawCentred(g, rows[0], w.banner.Text, st, p)
	if w.banner.Sub != "" && len(rows) > 1 {
		w.drawCentred(g, rows[1], w.banner.Sub, p.Dim, p)
	}
}

// drawCentred writes s centred on row y, truncating rather than wrapping so a
// long line can never change the frame's shape.
func (w *World) drawCentred(g *render.Grid, y int, s string, st *render.Style, p *render.Palette) {
	if y < 0 || s == "" {
		return
	}
	if p.Mode == render.ModeASCII {
		s = toASCII(s)
	}
	if width := ansi.StringWidth(s); width > g.W {
		s = ansi.Truncate(s, g.W, "")
	}
	x := (g.W - ansi.StringWidth(s)) / 2
	if x < 0 {
		x = 0
	}
	g.SetString(x, y, s, st)
}

// toASCII strips the decorative runes out of copy so ASCII mode stays 7-bit.
func toASCII(s string) string {
	out := make([]rune, 0, len(s))
	for _, r := range s {
		if r < 128 {
			out = append(out, r)
			continue
		}
		switch r {
		case '✦', '✧', '☄', '★':
			out = append(out, '*')
		case '·', '˚':
			out = append(out, '.')
		default:
			out = append(out, '?')
		}
	}
	return string(out)
}

// fourLineSequence is everything a tetris sets off at once: the supernova is
// already running, so this adds the hyperdrive, the room-scale shockwave, a
// heavy shake, a fast border cycle, and one of the banners.
func (w *World) fourLineSequence(rows []game.ClearedRow) {
	w.StartHyperdrive()
	w.PulseBorder(bannerLife)
	w.Shake(maxShake)

	// Centre the ring on the middle of the cleared block.
	cx := float64(w.board.X + render.BoardInnerW/2)
	cy := float64(w.board.Y + render.BoardInnerH/2)
	if len(rows) > 0 {
		if _, y, ok := w.boardToScreen(game.Width/2, rows[len(rows)/2].Y); ok {
			cy = y
		}
	}
	w.Shockwave(cx, cy, float64(render.BoardInnerH))

	w.ShowBanner(fourLineBanners[w.rng.IntN(len(fourLineBanners))], "", bannerLife, true)
}
```

`drawBanner` needs three layout rows that Plan 2's `Layout` may not expose: `BoardY`, `TitleY`, and `MissionY`. Plan 2's `Compute` already positions the title, the board, and the mission line, so add whichever of those three fields is missing to `render.Layout` and set it in `Compute`, using `-1` for "no room for this row" (which the small size class needs for the mission line). Add a `render` test that `Compute` returns `BoardY > TitleY` at every size and that `MissionY` is `-1` exactly when the class is `SizeSmall`.

`p.Accent` and `p.Dim` are existing palette styles from Plan 2. `p.Flash` was added in Task 7.

- [ ] **Step 4: Hook the sequence into the world**

In `internal/fx/fx.go`: add field `banner *banner`, call `w.advanceBanners(dt)` from `Advance`, draw it in `DrawGlobalFX` after the shockwaves, and extend the clear arm of `observe`:

```go
	case game.EventLinesCleared:
		w.startClear(e.Cleared, e.Count)
		if e.Count >= 4 {
			w.fourLineSequence(e.Cleared)
		}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/fx/ ./internal/render/ -v && go test ./... -race`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/banner.go internal/fx/banner_test.go internal/fx/fx.go internal/render/
git commit -m "feat(fx): four-line sequence and banners that never cover the board"
```
