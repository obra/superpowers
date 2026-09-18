# Cosmic Tetris — Plan 3 of 3: Cosmic Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the playable game in an outrageous effects layer — starfield, animated border, ion trails, hard-drop impact and shake, supernova line clears, hyperdrive, shockwaves, four-line banners, mission-control commentary, boot sequence, and a game-over black hole — such that a four-line clear produces an immediate "LOL WHAT THE FUCK" and none of it ever touches game state.

**Architecture:** `internal/fx` is an independent simulation: it *observes* `game.Event` values and a read-only snapshot, integrates its own particles against elapsed time, and exposes a flat list of screen-space overlay cells plus a few scalar readouts (shake offset, border energy, banner, board freeze). It holds its own `*rand.Rand`, never receives a `*game.Game`, and cannot compile against one. `internal/flavor` is the mission-control text channel with the same shape. `internal/render` gains an `FX` field on `Frame` and composites overlay cells into the existing `Canvas` under strict rules: never over the active piece, never outside the viewport.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2` (spinner for the boot screen).

**Spec:** `design.md` (this plan implements §14–§25, §27, §28, §29, §30 star drift, §43, §44, §45, §49.5)

**Plan sequence:** Plan 3 of 3. Requires plan 1 (`...-01-engine.md`) and plan 2 (`...-02-terminal.md`) complete and merged. Every `game.*` and `render.*` name used here comes from their Interfaces blocks.

## Global Constraints

- **`internal/fx` and `internal/flavor` may import `internal/game`, and nothing else of ours.** They must not import `internal/render` or `internal/app`. `internal/fx` must never hold a `*game.Game` — it sees only `[]game.Event` and a value snapshot. A test enforces the import list.
- **Effects may never modify game state** (§14, §44). All FX inputs are values or read-only slices.
- **FX randomness uses a separate `*rand.Rand` from the game's** (§35, §49.6). `fx.World` and `flavor.Channel` each own one, seeded from the CLI seed by a fixed offset. Crossing them with the game RNG is the one unforgivable bug in this plan.
- Never obscure the active piece. Never make controls lag. Never delay gameplay for animation. Never make screen shake exceed roughly one cell. Never let particles permanently alter the rendered board (§44).
- Every glyph FX emits must be **single-width**. Plan 2's `TestEverySingleRuneGlyphIsSingleWidth` is extended in Task 1 to cover the new glyph sets. Two spec glyphs are substituted for width safety, documented where they appear: §24's ring set `○ ◌ ◯` becomes `· ∘ o O` (`. o O 0` in ASCII), and §28's black-hole core `●` becomes `██` (`##` in ASCII).
- No goroutine per particle or per frame; no filesystem access or synchronous logging during gameplay; a few hundred particles must be trivial (§38).
- Particle count is hard-capped at `MaxParticles = 600`. Emissions past the cap are dropped, not queued.
- `--no-fx` disables the whole visual simulation: no stars, particles, trails, shake, banners, or shockwaves, and a static board border. Mission-control text and the level-up notice remain — they are information, and the boring mode must still be a good game (§32).
- `--reduced-motion` suppresses **screen shake, hyperdrive acceleration, and shockwaves** and leaves color, trails, and particles alone (§49.5).
- Every task ends with `go test -race ./...` passing, `go vet ./...` clean, `gofmt -l .` empty, and the plan-2 goldens still passing (regenerate deliberately when a task is supposed to change them).

## Review Focus

Failure modes the spec implies but does not spell out. Each has a test in the task that owns the code.

1. **Sustained play and repeated four-line clears.** Particle storage must stay bounded at `MaxParticles` and must not grow its backing slice without limit or allocate per particle per frame — otherwise a long game degrades into a slideshow, violating "never make controls lag". → Task 1.
2. **A `dt` spike from a suspended terminal, and a zero/negative `dt`.** Integrating 30 s in one step sends positions to ±10⁶ or NaN and can make a ring expand forever; the simulation must clamp its step and stay finite. → Task 1.
3. **Overlay cells landing outside the viewport, on the board border, or on the active piece.** All three must be refused by the compositor rather than corrupting the frame or hiding the piece the player is steering (§44). → Task 2.
4. **`--no-fx` and `--reduced-motion` on every path.** No nil-pointer dereference, shake exactly `(0,0)`, no hyperdrive or shockwave cells, and the game still fully playable and readable. → Task 12.
5. **Events arriving while paused, and after game over.** Paused freezes gameplay particles while background stars keep drifting very slowly (§30); after game over nothing may resurrect the normal board or spawn new gameplay particles. → Task 11.

---

## File Structure

| File | Responsibility |
|---|---|
| `internal/fx/particle.go` | `Particle`, the integrator, the fixed-capacity pool. |
| `internal/fx/events.go` | `Config`, `Geometry`, `Snapshot`, `Cell`, `Role`, `Layer`, and the event fan-out in `Observe`. |
| `internal/fx/world.go` | `World`: timers for every effect, `Advance`, `Cells`, `ShakeOffset`, `BorderEnergy`, `Banner`, `Notice`, `BoardFreeze`, game-over phase. |
| `internal/fx/starfield.go` | Three star layers, drift, level scaling, hyperdrive, shooting stars. |
| `internal/flavor/messages.go` | Mission-control message tables and the `Channel` cooldown state machine. |
| `internal/render/fx.go` | `drawFX`: composite overlay cells with clipping and the active-piece guard. |
| `internal/render/render.go` | `Frame.FX`, shake offset applied to the board, banner and notice drawing, boot and collapse overlays. |
| `internal/app/*` | Wire `fx.World` and `flavor.Channel` into the frame loop; boot and game-over states. |

---

### Task 1: Particle simulation

**Files:**
- Create: `internal/fx/particle.go`
- Test: `internal/fx/particle_test.go`

**Interfaces:**
- Consumes: nothing outside the standard library.
- Produces:
  ```go
  const (
      MaxParticles = 600
      MaxStep      = 50 * time.Millisecond // integration step ceiling
  )

  type Particle struct {
      X, Y       float64 // screen cells; Y grows downward
      VX, VY     float64 // cells per second
      AX, AY     float64 // cells per second squared
      Drag       float64 // per-second multiplier, e.g. 0.9
      Life       float64 // seconds remaining
      MaxLife    float64
      Glyph      rune
      Role       Role
      Kind       game.PieceKind // Empty unless the particle inherits a piece color
      Layer      Layer
  }

  // pool is a fixed-capacity particle store. Dead slots are reused; when the
  // pool is full, Spawn drops the request and returns false.
  type pool struct { /* items [MaxParticles]Particle; live int */ }
  func (p *pool) Spawn(pt Particle) bool
  func (p *pool) Advance(dt time.Duration, w, h int) // integrate, age, cull
  func (p *pool) Len() int
  func (p *pool) Each(fn func(*Particle))
  func (p *pool) Clear()
  func (p *pool) ClearLayer(l Layer)
  ```

Pinned integration (§23), applied per sub-step of at most `MaxStep`:

```
position += velocity * dt
velocity += acceleration * dt
velocity *= pow(Drag, dt)   // Drag as a per-second factor
life     -= dt
```

Cull when `Life <= 0`, when `X < -2 || X > w+2 || Y < -2 || Y > h+2`, or when any field is not finite. `Advance` splits a large `dt` into at most 4 sub-steps of `MaxStep` and discards the remainder — a suspended terminal should resume with a clean sky, not simulate 30 seconds (Review Focus 2).

- [ ] **Step 1: Write the failing tests**

```go
func TestIntegrationMovesAndAges(t *testing.T) {
	var p pool
	p.Spawn(Particle{X: 5, Y: 5, VX: 10, VY: -4, Drag: 1, Life: 1, MaxLife: 1, Glyph: '*'})
	p.Advance(100*time.Millisecond, 80, 30)
	var got Particle
	p.Each(func(q *Particle) { got = *q })
	if math.Abs(got.X-6) > 0.01 || math.Abs(got.Y-4.6) > 0.01 {
		t.Errorf("position = (%.3f,%.3f), want (6.0,4.6)", got.X, got.Y)
	}
	if math.Abs(got.Life-0.9) > 0.001 {
		t.Errorf("Life = %.3f, want 0.9", got.Life)
	}
}

func TestAccelerationAndDragApply(t *testing.T) {
	var p pool
	p.Spawn(Particle{X: 0, Y: 0, VX: 10, AY: 20, Drag: 0.5, Life: 5, MaxLife: 5, Glyph: '*'})
	p.Advance(time.Second, 80, 30)
	var got Particle
	p.Each(func(q *Particle) { got = *q })
	if got.VY <= 0 {
		t.Errorf("VY = %.3f, want positive after gravity", got.VY)
	}
	if got.VX >= 10 {
		t.Errorf("VX = %.3f, want less than 10 after drag", got.VX)
	}
}

func TestDeadParticlesAreCulled(t *testing.T) {
	var p pool
	p.Spawn(Particle{Life: 0.05, MaxLife: 0.05, Drag: 1, Glyph: '*'})
	p.Advance(100*time.Millisecond, 80, 30)
	if p.Len() != 0 {
		t.Errorf("Len = %d, want 0 after the particle expired", p.Len())
	}
}

func TestOffscreenParticlesAreCulled(t *testing.T) {
	var p pool
	p.Spawn(Particle{X: 79, Y: 5, VX: 500, Drag: 1, Life: 10, MaxLife: 10, Glyph: '*'})
	p.Spawn(Particle{X: 5, Y: 29, VY: 500, Drag: 1, Life: 10, MaxLife: 10, Glyph: '*'})
	p.Advance(100*time.Millisecond, 80, 30)
	if p.Len() != 0 {
		t.Errorf("Len = %d, want 0 after both left the viewport", p.Len())
	}
}

// Review Focus 1: bounded storage under sustained emission.
func TestPoolIsCappedAndReusesSlots(t *testing.T) {
	var p pool
	for i := 0; i < MaxParticles*3; i++ {
		p.Spawn(Particle{X: 5, Y: 5, Drag: 1, Life: 10, MaxLife: 10, Glyph: '*'})
	}
	if p.Len() != MaxParticles {
		t.Errorf("Len = %d, want the cap %d", p.Len(), MaxParticles)
	}
	if ok := p.Spawn(Particle{Life: 1, MaxLife: 1, Drag: 1}); ok {
		t.Error("Spawn should report false when the pool is full")
	}
	// Age everything out, then confirm slots are reusable.
	p.Advance(20*time.Second, 80, 30)
	if p.Len() != 0 {
		t.Fatalf("Len = %d after aging out, want 0", p.Len())
	}
	if ok := p.Spawn(Particle{Life: 1, MaxLife: 1, Drag: 1, Glyph: '*'}); !ok {
		t.Error("Spawn should succeed again once slots are free")
	}
}

func TestPoolDoesNotAllocatePerFrame(t *testing.T) {
	var p pool
	for i := 0; i < 200; i++ {
		p.Spawn(Particle{X: 10, Y: 10, VX: 0.1, Drag: 0.99, Life: 100, MaxLife: 100, Glyph: '*'})
	}
	allocs := testing.AllocsPerRun(50, func() { p.Advance(16*time.Millisecond, 80, 30) })
	if allocs > 0 {
		t.Errorf("Advance allocated %.1f times per frame, want 0", allocs)
	}
}

// Review Focus 2: dt spikes and degenerate dt.
func TestLargeDtIsClampedAndStaysFinite(t *testing.T) {
	var p pool
	p.Spawn(Particle{X: 40, Y: 15, VX: 3, VY: 3, AY: 30, Drag: 0.9, Life: 100, MaxLife: 100, Glyph: '*'})
	p.Advance(30*time.Second, 80, 30)
	p.Each(func(q *Particle) {
		for _, v := range []float64{q.X, q.Y, q.VX, q.VY} {
			if math.IsNaN(v) || math.IsInf(v, 0) {
				t.Fatalf("non-finite particle after a 30s step: %+v", *q)
			}
		}
	})
}

func TestZeroAndNegativeDtAreNoOps(t *testing.T) {
	var p pool
	p.Spawn(Particle{X: 5, Y: 5, VX: 10, Drag: 1, Life: 1, MaxLife: 1, Glyph: '*'})
	p.Advance(0, 80, 30)
	p.Advance(-time.Second, 80, 30)
	var got Particle
	p.Each(func(q *Particle) { got = *q })
	if got.X != 5 || got.Life != 1 {
		t.Errorf("degenerate dt changed the particle: %+v", got)
	}
}

func TestClearLayerLeavesOtherLayers(t *testing.T) {
	var p pool
	p.Spawn(Particle{Layer: LayerBackground, Life: 5, MaxLife: 5, Drag: 1, Glyph: '.'})
	p.Spawn(Particle{Layer: LayerBoard, Life: 5, MaxLife: 5, Drag: 1, Glyph: '*'})
	p.ClearLayer(LayerBoard)
	if p.Len() != 1 {
		t.Fatalf("Len = %d, want 1", p.Len())
	}
	p.Each(func(q *Particle) {
		if q.Layer != LayerBackground {
			t.Errorf("surviving particle is on layer %v, want LayerBackground", q.Layer)
		}
	})
}
```

- [ ] **Step 2: Declare `Role` and `Layer` so the tests compile**

Add to `internal/fx/events.go`:

```go
type Layer int
const (
	LayerBackground Layer = iota // behind everything: stars
	LayerBoard                   // inside the board box: trails, debris, clear animation
	LayerGlobal                  // over the whole screen: shockwaves, hyperdrive streaks
)

type Role int
const (
	RoleStarFar Role = iota
	RoleStarMid
	RoleStarNear
	RoleTrail
	RoleDebris
	RoleImpact
	RoleShock
	RoleClear
	RoleCollapse
)
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `go test ./internal/fx/ -v`
Expected: FAIL — `undefined: pool`.

- [ ] **Step 4: Implement `particle.go`**

Back the pool with a fixed `[MaxParticles]Particle` array plus a parallel `alive [MaxParticles]bool` (or a `Life > 0` test). `Advance` guards `dt <= 0`, splits into sub-steps, and compacts nothing — slots are reused in place, which is what keeps allocations at zero.

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS, including the zero-allocation test. If `TestPoolDoesNotAllocatePerFrame` fails, look for a closure or slice append in the hot path.

- [ ] **Step 6: Commit**

```bash
git add internal/fx
git commit -m "feat(fx): bounded particle pool with clamped integration"
```

---

### Task 2: World, event observation and the render compositor

**Files:**
- Create: `internal/fx/world.go`, `internal/render/fx.go`
- Modify: `internal/fx/events.go`, `internal/render/render.go`, `internal/render/palette.go`, `internal/app/model.go`, `internal/app/update.go`
- Test: `internal/fx/world_test.go`, `internal/render/fx_test.go`

**Interfaces:**
- Consumes: Task 1's pool, `game.Event`, plan 2's `Canvas`/`Frame`/`Layout`.
- Produces:
  ```go
  // internal/fx
  type Config struct {
      Seed          int64
      Enabled       bool // false with --no-fx
      ReducedMotion bool
      ASCII         bool
  }
  type Geometry struct {
      ScreenW, ScreenH int
      BoardX, BoardY   int // top-left of the board's border box
      CellCols         int // 2
  }
  type Snapshot struct {
      Level, Combo, Score int
      Board               game.Board
      Active              game.Piece
      Paused              bool
  }
  type Cell struct {
      X, Y       int
      Glyph      rune
      Role       Role
      Brightness float64        // 0..1
      Kind       game.PieceKind // Empty unless the cell inherits a piece color
      Layer      Layer
  }

  type World struct{ /* ... */ }
  func NewWorld(cfg Config) *World
  func (w *World) Resize(g Geometry)
  func (w *World) Observe(evts []game.Event, s Snapshot)
  func (w *World) Advance(dt time.Duration)
  func (w *World) Cells(dst []Cell) []Cell // appends into dst; reuse the slice
  func (w *World) ShakeOffset() (dx, dy int)
  func (w *World) Count() int

  // internal/render
  type FXView interface {
      Cells(dst []fx.Cell) []fx.Cell
      ShakeOffset() (int, int)
  }
  // Frame gains: FX FXView   (nil means no effects)
  func drawFX(c *Canvas, l Layout, f Frame, p Palette, layer fx.Layer, guard func(x, y int) bool)
  func (p Palette) FXStyle(role fx.Role, brightness float64, kind game.PieceKind) lipgloss.Style
  ```

Pinned compositor rules (§37 steps 2, 6, 9 and §44):

- `drawFX` is called three times per frame: `LayerBackground` before the board, `LayerBoard` after the ghost, `LayerGlobal` after the HUD.
- A cell is dropped when it falls outside the canvas (the `Canvas` already refuses, but `drawFX` must not compute a style for it), when `guard(x, y)` returns false, or when its brightness rounds to zero.
- The board-layer guard refuses any screen cell occupied by the **active piece** or by the **board border**, so effects can never obscure the piece the player is steering, and the border stays a clean frame.
- `Cells(dst)` appends into a caller-owned slice; `render` keeps one `[]fx.Cell` buffer on the `Frame`'s behalf (a package-level `sync.Pool` is not needed — pass a reused slice through `Frame`... simplest: `render` allocates once per `Render` call and the sweep test asserts it does not grow unbounded).

- [ ] **Step 1: Write the failing fx tests**

```go
func TestWorldRequiresNoGameReference(t *testing.T) {
	// This is a compile-time guarantee documented as a test: Observe takes
	// values only, so a *game.Game cannot reach the FX simulation.
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(Geometry{ScreenW: 80, ScreenH: 30, BoardX: 10, BoardY: 3, CellCols: 2})
	w.Observe([]game.Event{game.PieceLocked{}}, Snapshot{Level: 1})
	w.Advance(16 * time.Millisecond)
	_ = w.Cells(nil)
}

func TestDisabledWorldProducesNothing(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: false})
	w.Resize(Geometry{ScreenW: 80, ScreenH: 30, BoardX: 10, BoardY: 3, CellCols: 2})
	for i := 0; i < 100; i++ {
		w.Observe([]game.Event{game.PieceHardDropped{Cells: 9}, game.LinesCleared{Count: 4}}, Snapshot{Level: 3})
		w.Advance(16 * time.Millisecond)
	}
	if got := w.Cells(nil); len(got) != 0 {
		t.Errorf("--no-fx world produced %d cells, want 0", len(got))
	}
	if dx, dy := w.ShakeOffset(); dx != 0 || dy != 0 {
		t.Errorf("--no-fx shake = (%d,%d), want (0,0)", dx, dy)
	}
}

func TestWorldIsDeterministicForASeed(t *testing.T) {
	run := func() string {
		w := NewWorld(Config{Seed: 99, Enabled: true})
		w.Resize(Geometry{ScreenW: 80, ScreenH: 30, BoardX: 10, BoardY: 3, CellCols: 2})
		var sb strings.Builder
		for i := 0; i < 60; i++ {
			w.Observe([]game.Event{game.PieceMoved{DX: 1}}, Snapshot{Level: 2})
			w.Advance(16 * time.Millisecond)
			for _, c := range w.Cells(nil) {
				fmt.Fprintf(&sb, "%d,%d,%c;", c.X, c.Y, c.Glyph)
			}
		}
		return sb.String()
	}
	if a, b := run(), run(); a != b {
		t.Error("the same FX seed produced different output")
	}
}

func TestFXRNGDoesNotTouchTheGameRNG(t *testing.T) {
	// Draw a piece sequence while an FX world consumes plenty of randomness.
	seq := func(withFX bool) []game.PieceKind {
		g := game.New(1234)
		w := NewWorld(Config{Seed: 1234, Enabled: true})
		w.Resize(Geometry{ScreenW: 80, ScreenH: 30, BoardX: 10, BoardY: 3, CellCols: 2})
		var out []game.PieceKind
		for i := 0; i < 30; i++ {
			out = append(out, g.Active.Kind)
			evts := g.Input(game.ActionHardDrop)
			if withFX {
				w.Observe(evts, Snapshot{Level: g.Level})
				w.Advance(16 * time.Millisecond)
			}
		}
		return out
	}
	if !reflect.DeepEqual(seq(false), seq(true)) {
		t.Error("running the FX world changed the piece order — the RNGs are crossed (design.md §35, §49.6)")
	}
}

func TestCellsAppendsIntoTheProvidedSlice(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(Geometry{ScreenW: 80, ScreenH: 30, BoardX: 10, BoardY: 3, CellCols: 2})
	w.Advance(100 * time.Millisecond)
	buf := make([]Cell, 0, 64)
	got := w.Cells(buf)
	if cap(got) != cap(buf) && len(got) <= cap(buf) {
		t.Error("Cells should append into the caller's slice rather than allocating a new one")
	}
}
```

- [ ] **Step 2: Write the failing compositor tests**

```go
type stubFX struct {
	cells []fx.Cell
	dx, dy int
}

func (s stubFX) Cells(dst []fx.Cell) []fx.Cell { return append(dst, s.cells...) }
func (s stubFX) ShakeOffset() (int, int)       { return s.dx, s.dy }

// Review Focus 3: the compositor must clip and must protect the active piece.
func TestFXCellsAreClippedToTheScreen(t *testing.T) {
	g := fixtureGame(t)
	stub := stubFX{cells: []fx.Cell{
		{X: -5, Y: 2, Glyph: '*', Brightness: 1, Layer: fx.LayerGlobal},
		{X: 500, Y: 2, Glyph: '*', Brightness: 1, Layer: fx.LayerGlobal},
		{X: 4, Y: -9, Glyph: '*', Brightness: 1, Layer: fx.LayerGlobal},
		{X: 4, Y: 900, Glyph: '*', Brightness: 1, Layer: fx.LayerGlobal},
	}}
	out := renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, FX: stub})
	lines := strings.Split(out, "\n")
	if len(lines) > 30 {
		t.Errorf("%d lines, want <= 30", len(lines))
	}
	for _, line := range lines {
		if lipgloss.Width(line) > 80 {
			t.Errorf("line %q is %d columns wide", line, lipgloss.Width(line))
		}
	}
}

func TestFXNeverOverwritesTheActivePiece(t *testing.T) {
	g := fixtureGame(t)
	l := Compute(80, 30)
	var cells []fx.Cell
	for _, c := range g.Active.Cells() {
		if c[1] < game.HiddenRows {
			continue
		}
		y := l.BoardY + 1 + c[1] - game.HiddenRows
		x := l.BoardX + 1 + c[0]*CellCols
		cells = append(cells,
			fx.Cell{X: x, Y: y, Glyph: '*', Brightness: 1, Layer: fx.LayerBoard},
			fx.Cell{X: x + 1, Y: y, Glyph: '*', Brightness: 1, Layer: fx.LayerBoard})
	}
	if len(cells) == 0 {
		t.Skip("active piece is entirely in the hidden rows")
	}
	lines := strings.Split(renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, FX: stubFX{cells: cells}}), "\n")
	for _, c := range cells {
		row := []rune(padTo(lines[c.Y], 80))
		if row[c.X] == '*' {
			t.Fatalf("an FX cell overwrote the active piece at (%d,%d) (design.md §44)", c.X, c.Y)
		}
	}
}

func TestFXNeverOverwritesTheBoardBorder(t *testing.T) {
	g := fixtureGame(t)
	l := Compute(80, 30)
	cells := []fx.Cell{
		{X: l.BoardX, Y: l.BoardY + 5, Glyph: '*', Brightness: 1, Layer: fx.LayerBoard},
		{X: l.BoardX + BoardBoxW - 1, Y: l.BoardY + 5, Glyph: '*', Brightness: 1, Layer: fx.LayerBoard},
	}
	lines := strings.Split(renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, FX: stubFX{cells: cells}}), "\n")
	row := []rune(padTo(lines[l.BoardY+5], 80))
	if row[l.BoardX] == '*' || row[l.BoardX+BoardBoxW-1] == '*' {
		t.Error("a board-layer FX cell overwrote the board border")
	}
}

func TestBackgroundFXAppearsOutsideTheBoard(t *testing.T) {
	g := fixtureGame(t)
	l := Compute(80, 30)
	x := l.BoardX - 3
	if x < 0 {
		t.Skip("no room left of the board")
	}
	cells := []fx.Cell{{X: x, Y: l.BoardY + 4, Glyph: '✦', Brightness: 1, Layer: fx.LayerBackground}}
	lines := strings.Split(renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, FX: stubFX{cells: cells}}), "\n")
	row := []rune(padTo(lines[l.BoardY+4], 80))
	if row[x] != '✦' {
		t.Errorf("background FX cell not rendered: got %q", row[x])
	}
}

func TestShakeOffsetsTheBoardByAtMostOneCell(t *testing.T) {
	g := fixtureGame(t)
	base := Compute(80, 30)
	for _, off := range [][2]int{{0, 1}, {-1, 0}, {1, 0}, {0, -1}} {
		lines := strings.Split(renderPlain(Frame{
			Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, FX: stubFX{dx: off[0], dy: off[1]},
		}), "\n")
		y := base.BoardY + off[1]
		row := []rune(padTo(lines[y], 80))
		if row[base.BoardX+off[0]] != GlyphsFor(ModeFull).BorderTL {
			t.Errorf("shake %v: board top-left corner is not at the shifted position", off)
		}
	}
}

func TestNilFXRendersExactlyLikeNoFX(t *testing.T) {
	g := fixtureGame(t)
	a := renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7})
	b := renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, FX: nil})
	if a != b {
		t.Error("a nil FX field must be a no-op")
	}
}
```

- [ ] **Step 3: Run both test sets to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -v`
Expected: FAIL — `undefined: NewWorld`, `Frame has no field FX`.

- [ ] **Step 4: Implement `world.go`, `render/fx.go` and the `Frame.FX` plumbing**

`World` holds the pool, `Geometry`, `Config`, its own `rand.New(rand.NewSource(cfg.Seed ^ 0x5FC05_1CE))` — any fixed non-zero constant will do; the point is that the FX stream is derived from the CLI seed yet never shares state with the game's generator — and one timer field per effect (all zero for now). `Observe` is a type switch that will gain a case per task; for now it records the snapshot and ignores events. `Advance` returns early when `!cfg.Enabled`.

`drawFX` maps each cell through `Palette.FXStyle` and writes it with `Canvas.Set`. Build the active-piece and border guard once per frame as a small `func(x, y int) bool` closure over the layout and the active piece's screen cells.

`Palette.FXStyle`: `RoleTrail` and `RoleCollapse` use the piece color for `Kind` scaled by brightness; stars use a white-to-slate ramp (`RoleStarFar` dimmest); `RoleDebris`/`RoleImpact` use accent cyan into hot white; `RoleShock` uses magenta; `RoleClear` uses hot white. Brightness scales the color's RGB toward `#000000`.

Wire `internal/app`: construct `fx.NewWorld(fx.Config{Seed: opts.Seed, Enabled: !opts.NoFX, ReducedMotion: opts.ReducedMotion, ASCII: mode == render.ModeASCII})` in `New`; call `Resize` from `SetSize` and whenever the layout changes; in the `FrameMsg` branch call `w.Observe(evts, snapshot)` then `w.Advance(dt)`; put the world on `Frame.FX`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test -race ./... -v`
Expected: PASS. Plan 2's goldens must still pass unchanged — FX emits nothing yet.

- [ ] **Step 6: Commit**

```bash
git add internal/fx internal/render internal/app
git commit -m "feat(fx): world skeleton, event observation and guarded render compositing"
```

---

### Task 3: Starfield

**Files:**
- Create: `internal/fx/starfield.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/starfield_test.go`

**Interfaces:**
- Consumes: `pool`, `Geometry`, `Config`.
- Produces:
  ```go
  type starfield struct{ /* ... */ }
  func newStarfield(rng *rand.Rand, g Geometry, ascii bool) starfield
  func (s *starfield) resize(g Geometry)
  func (s *starfield) advance(dt time.Duration, level int, speedMul float64, frozen bool)
  func (s *starfield) cells(dst []Cell) []Cell
  func (s *starfield) boost(extraDensity float64, d time.Duration) // §20 star density bump
  ```

Pinned behavior (§15, §30, §45):

- Three depth layers with fixed proportions of the total star budget: far 50 %, mid 33 %, near 17 %. Budget = `ScreenW * ScreenH / 28`, clamped to `[20, 240]`.
- Base downward drift, in cells per second: far `0.6`, mid `1.6`, near `4.0`.
- Level scaling: `speed *= 1 + 0.04*(level-1)`, capped at `2.0×` — "subtly increases" (§15).
- Glyphs: far `.`, mid `·` and `˚`, near `✦` and `✧`, with `*` used occasionally in the near layer. ASCII mode: far `.`, mid `.` and `:`, near `+` and `*`.
- Brightness: far `0.35`, mid `0.6`, near `1.0`.
- A star leaving the bottom respawns at a random column on row `-1`, so density is constant and no allocation happens.
- `frozen` (paused, §30) slows every layer to `0.15×` rather than stopping — "background stars may continue drifting very slowly".
- Shooting star (§45): with probability `0.012` per second, spawn a near-layer particle with a diagonal velocity and a 3-cell trail, lasting ~500 ms.

- [ ] **Step 1: Write the failing tests**

```go
func geom() Geometry { return Geometry{ScreenW: 80, ScreenH: 30, BoardX: 29, BoardY: 3, CellCols: 2} }

func TestStarfieldPopulatesThreeLayers(t *testing.T) {
	w := NewWorld(Config{Seed: 3, Enabled: true})
	w.Resize(geom())
	w.Advance(16 * time.Millisecond)
	counts := map[Role]int{}
	for _, c := range w.Cells(nil) {
		counts[c.Role]++
	}
	for _, r := range []Role{RoleStarFar, RoleStarMid, RoleStarNear} {
		if counts[r] == 0 {
			t.Errorf("no stars on layer %v", r)
		}
	}
	if counts[RoleStarFar] <= counts[RoleStarNear] {
		t.Errorf("far layer (%d) should be denser than the near layer (%d)", counts[RoleStarFar], counts[RoleStarNear])
	}
}

func TestStarsDriftDownward(t *testing.T) {
	w := NewWorld(Config{Seed: 3, Enabled: true})
	w.Resize(geom())
	w.Advance(16 * time.Millisecond)
	before := averageY(w.Cells(nil), RoleStarNear)
	w.Advance(500 * time.Millisecond)
	after := averageY(w.Cells(nil), RoleStarNear)
	if !(after > before) {
		t.Errorf("near stars did not drift down: %.2f -> %.2f", before, after)
	}
}

func averageY(cells []Cell, r Role) float64 {
	var sum, n float64
	for _, c := range cells {
		if c.Role == r {
			sum += float64(c.Y)
			n++
		}
	}
	if n == 0 {
		return 0
	}
	return sum / n
}

func TestStarDensityIsStableOverTime(t *testing.T) {
	w := NewWorld(Config{Seed: 3, Enabled: true})
	w.Resize(geom())
	w.Advance(16 * time.Millisecond)
	first := len(w.Cells(nil))
	for i := 0; i < 600; i++ {
		w.Advance(16 * time.Millisecond)
	}
	last := len(w.Cells(nil))
	if last < first/2 {
		t.Errorf("star count fell from %d to %d — stars are not respawning", first, last)
	}
	if last > MaxParticles {
		t.Errorf("star count %d exceeds the particle cap", last)
	}
}

func TestHigherLevelsDriftFaster(t *testing.T) {
	measure := func(level int) float64 {
		w := NewWorld(Config{Seed: 3, Enabled: true})
		w.Resize(geom())
		w.Observe(nil, Snapshot{Level: level})
		w.Advance(16 * time.Millisecond)
		before := averageY(w.Cells(nil), RoleStarMid)
		for i := 0; i < 30; i++ {
			w.Observe(nil, Snapshot{Level: level})
			w.Advance(16 * time.Millisecond)
		}
		return averageY(w.Cells(nil), RoleStarMid) - before
	}
	slow, fast := measure(1), measure(12)
	if !(fast > slow) {
		t.Errorf("level 12 drift %.3f should exceed level 1 drift %.3f", fast, slow)
	}
	if fast > slow*3 {
		t.Errorf("level 12 drift %.3f is more than 3x level 1 %.3f — §15 says subtle", fast, slow)
	}
}

func TestPausedStarsDriftVerySlowly(t *testing.T) {
	w := NewWorld(Config{Seed: 3, Enabled: true})
	w.Resize(geom())
	w.Observe(nil, Snapshot{Level: 1, Paused: true})
	w.Advance(16 * time.Millisecond)
	before := averageY(w.Cells(nil), RoleStarMid)
	for i := 0; i < 30; i++ {
		w.Observe(nil, Snapshot{Level: 1, Paused: true})
		w.Advance(16 * time.Millisecond)
	}
	moved := averageY(w.Cells(nil), RoleStarMid) - before
	if moved < 0 {
		t.Error("paused stars should still drift downward, if slowly")
	}
	if moved > 1.0 {
		t.Errorf("paused stars moved %.2f rows in half a second; §30 wants very slow drift", moved)
	}
}

func TestStarsStayInsideTheViewport(t *testing.T) {
	w := NewWorld(Config{Seed: 3, Enabled: true})
	w.Resize(geom())
	for i := 0; i < 300; i++ {
		w.Advance(16 * time.Millisecond)
		for _, c := range w.Cells(nil) {
			if c.X < 0 || c.X >= 80 || c.Y < 0 || c.Y >= 30 {
				t.Fatalf("star at (%d,%d) is outside an 80x30 viewport", c.X, c.Y)
			}
		}
	}
}

func TestResizeRebuildsTheStarfieldWithoutPanicking(t *testing.T) {
	w := NewWorld(Config{Seed: 3, Enabled: true})
	for _, sz := range [][2]int{{80, 30}, {40, 24}, {1, 1}, {0, 0}, {200, 60}, {40, 24}} {
		w.Resize(Geometry{ScreenW: sz[0], ScreenH: sz[1], BoardX: 1, BoardY: 1, CellCols: 2})
		w.Advance(50 * time.Millisecond)
		for _, c := range w.Cells(nil) {
			if c.X < 0 || c.X >= sz[0] || c.Y < 0 || c.Y >= sz[1] {
				t.Fatalf("after resize to %dx%d a star sits at (%d,%d)", sz[0], sz[1], c.X, c.Y)
			}
		}
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run Star -v`
Expected: FAIL — no stars are emitted.

- [ ] **Step 3: Implement `starfield.go` and hook it into `World.Advance`/`Cells`**

Keep stars in their own fixed array inside `starfield` rather than the shared pool, so a particle storm can never crowd out the sky.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Look at it**

Run: `go build ./cmd/cosmic-tetris && ./cosmic-tetris --seed 1`
Expected: stars drift behind and around the board, at three visible brightnesses, and the board is still perfectly readable (§15's closing rule). If the sky is too busy, lower the budget divisor — do not lower it below "obviously alive".

- [ ] **Step 6: Commit**

```bash
git add internal/fx
git commit -m "feat(fx): three-layer starfield with level scaling and paused drift"
```

---

### Task 4: Animated board border

**Files:**
- Modify: `internal/fx/world.go`, `internal/render/board.go`, `internal/render/render.go`
- Test: `internal/fx/border_test.go`, `internal/render/border_test.go`

**Interfaces:**
- Produces:
  ```go
  // fx
  func (w *World) BorderEnergy() float64 // 0 normal .. 1 major event
  func (w *World) BorderPhase() float64  // 0..1 position on the §25 ramp
  // render
  // Frame.FX gains BorderEnergy/BorderPhase via an extended FXView interface.
  ```

Pinned behavior (§25):

- Base phase advances at `1/12` per second — one full trip round the ramp every 12 seconds, subtle.
- `BorderEnergy` decays exponentially with a 400 ms half-life from a value set by events (Task 6 sets it to 1.0 on hard-drop impact; Task 8 to 1.0 on a four-line clear).
- Phase speed is multiplied by `1 + 6*energy`: during a major event the gradient runs rapidly round the border.
- Brightness: the border style is drawn at `Palette.Border(phase)`, with energy blending toward hot white `#EEF6FF`.
- With `--no-fx`, `BorderEnergy` and `BorderPhase` both return 0 and the border draws as a single static color.

- [ ] **Step 1: Write the failing tests**

```go
// fx
func TestBorderPhaseAdvancesSlowly(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	start := w.BorderPhase()
	w.Advance(time.Second)
	if d := w.BorderPhase() - start; d <= 0 || d > 0.2 {
		t.Errorf("phase advanced %.4f in one second, want a small positive step (~1/12)", d)
	}
}

func TestBorderEnergyDecays(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.PieceHardDropped{Cells: 12}}, Snapshot{Level: 1})
	if e := w.BorderEnergy(); e < 0.5 {
		t.Fatalf("energy right after a hard drop = %.2f, want near 1", e)
	}
	w.Advance(2 * time.Second)
	if e := w.BorderEnergy(); e > 0.1 {
		t.Errorf("energy after two seconds = %.2f, want near 0", e)
	}
}

func TestBorderPhaseRunsFasterUnderEnergy(t *testing.T) {
	measure := func(energize bool) float64 {
		w := NewWorld(Config{Seed: 1, Enabled: true})
		w.Resize(geom())
		if energize {
			w.Observe([]game.Event{game.PieceHardDropped{Cells: 12}}, Snapshot{Level: 1})
		}
		start := w.BorderPhase()
		w.Advance(200 * time.Millisecond)
		return w.BorderPhase() - start
	}
	if calm, hot := measure(false), measure(true); !(hot > calm*2) {
		t.Errorf("energized phase step %.4f should far exceed calm %.4f", hot, calm)
	}
}

func TestDisabledWorldHasNoBorderAnimation(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: false})
	w.Resize(geom())
	w.Observe([]game.Event{game.PieceHardDropped{Cells: 9}}, Snapshot{Level: 1})
	w.Advance(time.Second)
	if w.BorderPhase() != 0 || w.BorderEnergy() != 0 {
		t.Errorf("--no-fx border phase/energy = %.2f/%.2f, want 0/0", w.BorderPhase(), w.BorderEnergy())
	}
}
```

```go
// render
func TestBorderColorChangesWithPhase(t *testing.T) {
	g := fixtureGame(t)
	a := Render(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, FX: stubFX{phase: 0.0}})
	b := Render(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, FX: stubFX{phase: 0.5}})
	if a == b {
		t.Error("the board border should be colored differently at phase 0 and 0.5")
	}
	if stripANSI(a) != stripANSI(b) {
		t.Error("the border animation must change color only, never glyphs or geometry")
	}
}
```

Extend `stubFX` with `phase, energy float64` and the two new methods.

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run Border -v`
Expected: FAIL — `undefined: (*World).BorderPhase`.

- [ ] **Step 3: Implement the border animation**

Add `borderPhase`, `borderEnergy` to `World` and advance them in `Advance`; extend `render.FXView` with `BorderEnergy() float64` and `BorderPhase() float64`; have `drawBoard` use `p.Border(phase)` blended toward hot white by energy, falling back to `p.Border(0)` when `f.FX == nil`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test -race ./... -v`
Expected: PASS, plan 2's ANSI-stripped goldens unchanged (color-only change).

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): slow border gradient cycle with event-driven energy"
```

---

### Task 5: Piece trails

**Files:**
- Modify: `internal/fx/world.go`, `internal/fx/events.go`
- Test: `internal/fx/trail_test.go`

**Interfaces:**
- Produces: no new exported API — `Observe` gains cases for `game.PieceMoved` and `game.PieceHardDropped`.

Pinned behavior (§17):

- On `PieceMoved`, emit one `RoleTrail` particle per cell of the piece's **previous** position (derive it by subtracting `DX`/`DY` from the event's piece), with `Kind` set to the piece kind, `Life = 0.13s` (inside the 100–160 ms window), zero velocity, `Drag = 1`.
- Brightness ramps the glyph through `▓ ▒ ░` by remaining life fraction (`>0.66`, `>0.33`, else) — ASCII mode uses `| : .`.
- On `PieceHardDropped`, emit a **stronger** vertical trail: every cell the piece crossed between its start row and the landing row, with `Life = 0.22s`.
- Trails are `LayerBoard` and therefore subject to the active-piece guard: the trail is only ever visible where the piece no longer is.
- Trails do not emit at all when the world is disabled.

- [ ] **Step 1: Write the failing tests**

```go
func trailCells(w *World) []Cell {
	var out []Cell
	for _, c := range w.Cells(nil) {
		if c.Role == RoleTrail {
			out = append(out, c)
		}
	}
	return out
}

func TestPieceMovedEmitsATrailBehindThePiece(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	p := game.Piece{Kind: game.T, Rotation: 0, X: 4, Y: 8}
	w.Observe([]game.Event{game.PieceMoved{Piece: p, DX: 1}}, Snapshot{Level: 1})
	cells := trailCells(w)
	if len(cells) == 0 {
		t.Fatal("no trail cells emitted")
	}
	for _, c := range cells {
		if c.Kind != game.T {
			t.Errorf("trail cell Kind = %v, want T (trails inherit the piece color)", c.Kind)
		}
	}
	// The trail sits one cell to the left of the piece: 2 screen columns.
	minX := cells[0].X
	for _, c := range cells {
		if c.X < minX {
			minX = c.X
		}
	}
	pieceX := geom().BoardX + 1 + p.X*geom().CellCols
	if minX >= pieceX {
		t.Errorf("trail leftmost column %d should be left of the piece at %d", minX, pieceX)
	}
}

func TestTrailsExpireWithinTheSpecWindow(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.PieceMoved{Piece: game.Piece{Kind: game.L, X: 4, Y: 8}, DX: -1}}, Snapshot{Level: 1})
	if len(trailCells(w)) == 0 {
		t.Fatal("no trail emitted")
	}
	w.Advance(90 * time.Millisecond)
	if len(trailCells(w)) == 0 {
		t.Error("trail vanished before 100ms (§17 wants 100-160ms)")
	}
	w.Advance(120 * time.Millisecond)
	if n := len(trailCells(w)); n != 0 {
		t.Errorf("%d trail cells alive after 210ms, want 0", n)
	}
}

func TestTrailGlyphsFadeThroughTheRamp(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.PieceMoved{Piece: game.Piece{Kind: game.I, X: 3, Y: 8}, DX: -1}}, Snapshot{Level: 1})
	first := trailCells(w)[0].Glyph
	w.Advance(100 * time.Millisecond)
	cells := trailCells(w)
	if len(cells) == 0 {
		t.Fatal("trail expired too early")
	}
	if cells[0].Glyph == first {
		t.Errorf("trail glyph stayed %q; it should fade through the ramp", first)
	}
}

func TestHardDropTrailIsLongerThanAMoveTrail(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.PieceHardDropped{
		Piece: game.Piece{Kind: game.I, Rotation: 1, X: 3, Y: 18}, Cells: 12,
	}}, Snapshot{Level: 1})
	drop := len(trailCells(w))

	w2 := NewWorld(Config{Seed: 1, Enabled: true})
	w2.Resize(geom())
	w2.Observe([]game.Event{game.PieceMoved{Piece: game.Piece{Kind: game.I, Rotation: 1, X: 3, Y: 18}, DX: 1}}, Snapshot{Level: 1})
	move := len(trailCells(w2))

	if drop <= move {
		t.Errorf("hard-drop trail (%d cells) should be stronger than a move trail (%d)", drop, move)
	}
}

func TestTrailsRespectTheParticleCap(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	for i := 0; i < 2000; i++ {
		w.Observe([]game.Event{game.PieceMoved{Piece: game.Piece{Kind: game.O, X: 4, Y: 10}, DX: 1}}, Snapshot{Level: 1})
	}
	if n := w.Count(); n > MaxParticles {
		t.Errorf("particle count %d exceeds the cap %d", n, MaxParticles)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run Trail -v`
Expected: FAIL — no trail cells.

- [ ] **Step 3: Implement the trail cases in `Observe`**

Add a `boardCellToScreen(bx, by int) (x, y int, ok bool)` helper on `World` that maps board coordinates to screen columns and reports `false` for hidden rows — every board-local effect from here on uses it.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Look at it**

Run: `./cosmic-tetris --seed 1` and slide a piece left and right quickly.
Expected: a short ion smear behind the piece in the piece's own color, gone almost immediately. If it looks like a comet tail, shorten the life; if you cannot see it at all, raise brightness — not lifetime.

- [ ] **Step 6: Commit**

```bash
git add internal/fx
git commit -m "feat(fx): short-lived ion trails behind moving and dropped pieces"
```

---

### Task 6: Hard-drop impact — trail, debris, shake, border flash

**Files:**
- Modify: `internal/fx/world.go`, `internal/render/render.go`
- Test: `internal/fx/impact_test.go`

**Interfaces:**
- Produces: `ShakeOffset` becomes non-trivial; no new names.

Pinned behavior (§18, §44):

- Debris: 14 particles from the landed piece's bottom edge, `Role = RoleImpact`, glyphs cycling `· * ✦ +` (ASCII `. * + '`), initial velocity fanned upward and outward (`VX ∈ [-9, 9]`, `VY ∈ [-14, -4]` cells/s), `AY = 34` (gravity), `Drag = 0.82`, `Life ∈ [0.28, 0.5]s`.
- Screen shake: exactly the §18 pattern `(0,+1), (-1,0), (+1,0), (0,-1), (0,0)`, one entry per 16 ms, total 80 ms. Deterministic — an index into a table, not RNG. Offsets never exceed one cell.
- `--reduced-motion` returns `(0, 0)` from `ShakeOffset` at all times but keeps debris and the border flash (§49.5).
- Border flash: `borderEnergy = 1.0` (Task 4 decays it).
- Shake shifts **only the board box and its contents**, not the HUD or the mission line — a whole-screen shift makes the terminal unreadable (§18's closing rule).

- [ ] **Step 1: Write the failing tests**

```go
func TestHardDropEmitsDebris(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.PieceHardDropped{
		Piece: game.Piece{Kind: game.T, X: 4, Y: 19}, Cells: 11,
	}}, Snapshot{Level: 1})
	var debris int
	for _, c := range w.Cells(nil) {
		if c.Role == RoleImpact {
			debris++
		}
	}
	if debris < 8 {
		t.Errorf("%d debris particles, want at least 8", debris)
	}
}

func TestDebrisFallsBackDown(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.PieceHardDropped{Piece: game.Piece{Kind: game.T, X: 4, Y: 19}, Cells: 11}}, Snapshot{Level: 1})
	up := averageY(w.Cells(nil), RoleImpact)
	w.Advance(60 * time.Millisecond)
	mid := averageY(w.Cells(nil), RoleImpact)
	w.Advance(200 * time.Millisecond)
	down := averageY(w.Cells(nil), RoleImpact)
	if !(mid < up) {
		t.Errorf("debris should fly upward first: %.2f -> %.2f", up, mid)
	}
	if !(down > mid) {
		t.Errorf("debris should fall back: %.2f -> %.2f", mid, down)
	}
}

func TestShakeFollowsTheSpecPatternAndEnds(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.PieceHardDropped{Piece: game.Piece{Kind: game.T, X: 4, Y: 19}, Cells: 11}}, Snapshot{Level: 1})
	want := [][2]int{{0, 1}, {-1, 0}, {1, 0}, {0, -1}, {0, 0}}
	for i, exp := range want {
		dx, dy := w.ShakeOffset()
		if dx != exp[0] || dy != exp[1] {
			t.Errorf("step %d: shake = (%d,%d), want (%d,%d)", i, dx, dy, exp[0], exp[1])
		}
		w.Advance(16 * time.Millisecond)
	}
	if dx, dy := w.ShakeOffset(); dx != 0 || dy != 0 {
		t.Errorf("shake = (%d,%d) after 80ms, want (0,0)", dx, dy)
	}
}

func TestShakeNeverExceedsOneCell(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	for i := 0; i < 50; i++ {
		w.Observe([]game.Event{
			game.PieceHardDropped{Piece: game.Piece{Kind: game.T, X: 4, Y: 19}, Cells: 11},
			game.LinesCleared{Count: 4},
		}, Snapshot{Level: 9, Combo: 7})
		for j := 0; j < 8; j++ {
			dx, dy := w.ShakeOffset()
			if dx < -1 || dx > 1 || dy < -1 || dy > 1 {
				t.Fatalf("shake = (%d,%d) exceeds one cell (design.md §44)", dx, dy)
			}
			w.Advance(8 * time.Millisecond)
		}
	}
}

func TestReducedMotionSuppressesShakeButKeepsDebris(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true, ReducedMotion: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.PieceHardDropped{Piece: game.Piece{Kind: game.T, X: 4, Y: 19}, Cells: 11}}, Snapshot{Level: 1})
	for i := 0; i < 10; i++ {
		if dx, dy := w.ShakeOffset(); dx != 0 || dy != 0 {
			t.Fatalf("reduced motion shake = (%d,%d), want (0,0)", dx, dy)
		}
		w.Advance(16 * time.Millisecond)
	}
	var debris int
	for _, c := range w.Cells(nil) {
		if c.Role == RoleImpact {
			debris++
		}
	}
	if debris == 0 {
		t.Error("reduced motion should keep debris particles (§49.5)")
	}
}

func TestHardDropFlashesTheBorder(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.PieceHardDropped{Piece: game.Piece{Kind: game.T, X: 4, Y: 19}, Cells: 11}}, Snapshot{Level: 1})
	if e := w.BorderEnergy(); e < 0.8 {
		t.Errorf("border energy after impact = %.2f, want near 1", e)
	}
}
```

Add to `internal/render/fx_test.go`:

```go
func TestShakeDoesNotMoveTheHUD(t *testing.T) {
	g := fixtureGame(t)
	g.Score = 129340
	calm := strings.Split(renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7}), "\n")
	shaken := strings.Split(renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, FX: stubFX{dx: 1, dy: -1}}), "\n")
	rowOf := func(lines []string, needle string) int {
		for i, l := range lines {
			if strings.Contains(l, needle) {
				return i
			}
		}
		return -1
	}
	if a, b := rowOf(calm, "00129340"), rowOf(shaken, "00129340"); a != b {
		t.Errorf("score moved from row %d to %d — shake must only shift the board (§18)", a, b)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run 'Impact|Debris|Shake|Flash' -v`
Expected: FAIL.

- [ ] **Step 3: Implement the impact effect and the render-side shake**

In `render`, apply `dx, dy` only to the board box origin used by `drawBoard` and the board-layer FX guard, clamping so the shifted box still fits on screen.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test -race ./... -v`
Expected: PASS.

- [ ] **Step 5: Feel it**

Run: `./cosmic-tetris --seed 1` and hammer space.
Expected: dropping a piece feels like dropping a refrigerator from orbit — a vertical smear, debris kicking up, one cell of shake, the border snapping bright. Then run `./cosmic-tetris --reduced-motion --seed 1` and confirm the screen is completely still while debris still flies.

- [ ] **Step 6: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): hard-drop impact with debris, one-cell shake and border flash"
```

---

### Task 7: Line-clear supernova

**Files:**
- Modify: `internal/fx/world.go`, `internal/render/render.go`, `internal/render/board.go`
- Test: `internal/fx/clear_test.go`, `internal/render/clear_test.go`

**Interfaces:**
- Produces:
  ```go
  // fx
  // BoardFreeze returns the pre-clear board to render for the duration of the
  // line-clear animation (§19). ok is false when no animation is running.
  func (w *World) BoardFreeze() (game.Board, bool)
  func (w *World) ClearRows() []int // rows being animated, board coordinates
  // render.FXView gains BoardFreeze() (game.Board, bool) and ClearRows() []int.
  ```

Pinned behavior (§19, §44):

- Total animation `220ms`, driven by `LinesCleared`. Gameplay is **never** delayed: the engine has already collapsed the rows, and the animation is purely a rendering overlay fed by `LinesCleared.Before`.
- While the animation runs, `drawBoard` renders `BoardFreeze()`'s locked cells instead of the live board, so the cleared rows are still visible. The active piece, ghost and HUD keep using live state.
- Phase A, `0–70ms` — critical mass: cleared rows render as `▓` (`ModeASCII`: `%`), brightest at the row center.
- Phase B, `70–140ms` — supernova: a bright front expands from the row center outward; cells inside the front render `✦` (`*` in ASCII) at full brightness, cells behind it dim.
- Phase C, `140–220ms` — collapse: the rows become debris. Emit 6 particles per cleared row with `VX` proportional to distance from the row center (`(x - center) * 3.2` cells/s), `VY ∈ [-6, 2]`, `AY = 30`, glyphs `· * ✦`, `Role = RoleClear`.
- After 220 ms the freeze ends and the live board takes over. Debris outlives the freeze and simply falls.
- `--no-fx`: no freeze, no phases, no debris; the clear is instantaneous.

- [ ] **Step 1: Write the failing fx tests**

```go
func clearedBoard() (game.Board, []int) {
	var b game.Board
	for x := 0; x < game.Width; x++ {
		b.Set(x, 21, game.I)
		b.Set(x, 20, game.J)
	}
	return b, []int{20, 21}
}

func TestClearAnimationRunsForTwoTwentyMilliseconds(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	before, rows := clearedBoard()
	w.Observe([]game.Event{game.LinesCleared{Rows: rows, Count: 2, Before: before}}, Snapshot{Level: 1})
	if _, ok := w.BoardFreeze(); !ok {
		t.Fatal("a clear should start a board freeze")
	}
	if got := w.ClearRows(); !reflect.DeepEqual(got, rows) {
		t.Errorf("ClearRows = %v, want %v", got, rows)
	}
	w.Advance(210 * time.Millisecond)
	if _, ok := w.BoardFreeze(); !ok {
		t.Error("freeze ended before 220ms")
	}
	w.Advance(20 * time.Millisecond)
	if _, ok := w.BoardFreeze(); ok {
		t.Error("freeze should end at 220ms — gameplay is already past it")
	}
}

func TestClearPhasesProduceDifferentGlyphs(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	before, rows := clearedBoard()
	w.Observe([]game.Event{game.LinesCleared{Rows: rows, Count: 2, Before: before}}, Snapshot{Level: 1})
	glyphsAt := func() map[rune]int {
		m := map[rune]int{}
		for _, c := range w.Cells(nil) {
			if c.Role == RoleClear {
				m[c.Glyph]++
			}
		}
		return m
	}
	phaseA := glyphsAt()
	w.Advance(80 * time.Millisecond)
	phaseB := glyphsAt()
	if len(phaseA) == 0 || len(phaseB) == 0 {
		t.Fatalf("no clear cells: A=%v B=%v", phaseA, phaseB)
	}
	if reflect.DeepEqual(phaseA, phaseB) {
		t.Error("phase A and phase B render identically")
	}
}

func TestCollapseDebrisInheritsHorizontalVelocityFromTheCenter(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	before, rows := clearedBoard()
	w.Observe([]game.Event{game.LinesCleared{Rows: rows, Count: 2, Before: before}}, Snapshot{Level: 1})
	w.Advance(150 * time.Millisecond) // into phase C
	start := w.Cells(nil)
	var left, right []Cell
	centerX := geom().BoardX + 1 + game.Width // middle of the board in screen columns
	for _, c := range start {
		if c.Role != RoleClear {
			continue
		}
		if c.X < centerX {
			left = append(left, c)
		} else {
			right = append(right, c)
		}
	}
	if len(left) == 0 || len(right) == 0 {
		t.Fatalf("debris on only one side: %d left, %d right", len(left), len(right))
	}
	w.Advance(120 * time.Millisecond)
	var spread float64
	for _, c := range w.Cells(nil) {
		if c.Role == RoleClear {
			spread += math.Abs(float64(c.X - centerX))
		}
	}
	if spread == 0 {
		t.Error("debris did not spread away from the row center (§19)")
	}
}

func TestDisabledWorldDoesNotFreezeTheBoard(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: false})
	w.Resize(geom())
	before, rows := clearedBoard()
	w.Observe([]game.Event{game.LinesCleared{Rows: rows, Count: 2, Before: before}}, Snapshot{Level: 1})
	if _, ok := w.BoardFreeze(); ok {
		t.Error("--no-fx must not freeze the board")
	}
}

func TestASecondClearDuringTheAnimationRestartsIt(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	before, rows := clearedBoard()
	w.Observe([]game.Event{game.LinesCleared{Rows: rows, Count: 2, Before: before}}, Snapshot{Level: 1})
	w.Advance(200 * time.Millisecond)
	w.Observe([]game.Event{game.LinesCleared{Rows: []int{21}, Count: 1, Before: before}}, Snapshot{Level: 1})
	if got := w.ClearRows(); !reflect.DeepEqual(got, []int{21}) {
		t.Errorf("ClearRows = %v, want the newest clear [21]", got)
	}
	w.Advance(100 * time.Millisecond)
	if _, ok := w.BoardFreeze(); !ok {
		t.Error("the newest clear should have restarted the 220ms window")
	}
}
```

- [ ] **Step 2: Write the failing render test**

```go
func TestFrozenBoardShowsTheClearedRow(t *testing.T) {
	g := fixtureGame(t)
	var before game.Board
	for x := 0; x < game.Width; x++ {
		before.Set(x, 21, game.I)
	}
	f := Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, FX: stubFX{freeze: before, frozen: true, rows: []int{21}}}
	l := Compute(80, 30)
	lines := strings.Split(renderPlain(f), "\n")
	row := []rune(padTo(lines[l.BoardY+1+21-game.HiddenRows], 80))
	var blocks int
	for x := l.BoardX + 1; x < l.BoardX+BoardBoxW-1; x++ {
		if row[x] == '█' {
			blocks++
		}
	}
	if blocks < game.Width {
		t.Errorf("frozen board should still show the full cleared row; found %d block columns", blocks)
	}
}

func TestFreezeDoesNotAffectTheActivePiece(t *testing.T) {
	g := fixtureGame(t)
	var empty game.Board
	f := Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, FX: stubFX{freeze: empty, frozen: true}}
	l := Compute(80, 30)
	lines := strings.Split(renderPlain(f), "\n")
	for _, c := range g.Active.Cells() {
		if c[1] < game.HiddenRows {
			continue
		}
		row := []rune(padTo(lines[l.BoardY+1+c[1]-game.HiddenRows], 80))
		if row[l.BoardX+1+c[0]*CellCols] != '█' {
			t.Error("the active piece must render from live state even during a freeze")
		}
	}
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run 'Clear|Freeze|Collapse' -v`
Expected: FAIL.

- [ ] **Step 4: Implement the clear animation and the render freeze**

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test -race ./... -v`
Expected: PASS.

- [ ] **Step 6: See it**

Run: `./cosmic-tetris --seed 1` and clear a line.
Expected: the row goes hot, blows apart from the center, and rains debris — and the piece you are steering never stutters.

- [ ] **Step 7: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): three-phase supernova line clear with rendered board freeze"
```

---

### Task 8: Four-line event, hyperdrive, banners, shockwaves and combo escalation

**Files:**
- Modify: `internal/fx/world.go`, `internal/fx/starfield.go`, `internal/render/render.go`
- Test: `internal/fx/hyperdrive_test.go`, `internal/fx/combo_test.go`, `internal/render/banner_test.go`

**Interfaces:**
- Produces:
  ```go
  // fx
  func (w *World) Banner() (string, bool)   // §20 giant banner text
  func (w *World) HUDPulse() float64        // 0..1, §21 combo-4+ HUD pulse
  func (w *World) speedMul() float64        // internal: hyperdrive star multiplier
  // render.FXView gains Banner() (string, bool) and HUDPulse() float64.
  ```

Pinned behavior:

- **Hyperdrive** (§16), triggered by a four-line clear, a combo of 4 or more, or a new high score within the session. Star speed multiplier by elapsed time: `0–50ms → 0.0` (stars pause), `50–100ms → 0.3` (stretch), `100–500ms → ramp 1 → 6`, `500–800ms → 6`, `800–1100ms → ramp 6 → 1`, then over. Suppressed entirely under `--reduced-motion` (§49.5).
- **Four-line clear** (§20) triggers, simultaneously: hyperdrive, `borderEnergy = 1`, a `+60 %` star density boost for 900 ms, an eruption of 40 `RoleDebris` particles from the cleared rows, `HUDPulse` set to 1, and a banner for **700 ms** chosen from the FX RNG:
  ```
  ✦ EVENT HORIZON ✦
  QUADRUPLE COSMIC INCIDENT
  FOUR ROWS HAVE LEFT THE CHAT
  SPACE-TIME HAS FILED A COMPLAINT
  ```
  The banner is drawn centered over the board and **must not block input** — it is a rendering overlay only.
- **Combo escalation** (§21), on `ComboChanged`: combo 2 → 8 spark particles; combo 3 → 14 meteor particles with lateral drift; combo 4 → `HUDPulse` pulses for 600 ms; combo 5+ → also a shockwave, and a banner `COMBO n // <line>` for 700 ms from:
  ```
  UNAUTHORIZED ORBITAL MANEUVER
  STRUCTURAL REALITY FAILURE
  NASA DENIES EVERYTHING
  ```
- **Shockwave** (§24): an expanding ring over ~300 ms, radius `0 → 14` screen columns, drawn as `RoleShock` cells on an ellipse with a 2:1 horizontal stretch (terminal cells are tall), glyph by radius `· ∘ o O` (ASCII `. o O 0`), at most 24 cells per ring. **Used sparingly**: at most one ring per 800 ms, and never under `--reduced-motion`.
- Banner text renders in `ModeASCII` with the `✦` stripped.

- [ ] **Step 1: Write the failing tests**

```go
func tetrisEvent() []game.Event {
	before, rows := clearedBoard()
	return []game.Event{game.LinesCleared{Rows: rows, Count: 4, Before: before}}
}

func TestHyperdriveTimeline(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Advance(16 * time.Millisecond)
	calm := starDrift(t, w, 200*time.Millisecond)

	w2 := NewWorld(Config{Seed: 1, Enabled: true})
	w2.Resize(geom())
	w2.Advance(16 * time.Millisecond)
	w2.Observe(tetrisEvent(), Snapshot{Level: 1})
	w2.Advance(30 * time.Millisecond)
	paused := starDrift(t, w2, 16*time.Millisecond)
	if paused > 0.2 {
		t.Errorf("stars moved %.2f rows in the first 50ms; §16 says they pause", paused)
	}
	w2.Advance(120 * time.Millisecond) // into the acceleration ramp
	fast := starDrift(t, w2, 200*time.Millisecond)
	if !(fast > calm*2) {
		t.Errorf("hyperdrive drift %.2f should far exceed calm drift %.2f", fast, calm)
	}
	w2.Advance(1200 * time.Millisecond) // past 1100ms
	after := starDrift(t, w2, 200*time.Millisecond)
	if after > calm*1.6 {
		t.Errorf("drift %.2f should be back to normal (~%.2f) after 1100ms", after, calm)
	}
}

// starDrift measures how far mid-layer stars move over d.
func starDrift(t *testing.T, w *World, d time.Duration) float64 {
	t.Helper()
	before := averageY(w.Cells(nil), RoleStarMid)
	w.Advance(d)
	return averageY(w.Cells(nil), RoleStarMid) - before
}

func TestFourLineClearTriggersEverything(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Advance(16 * time.Millisecond)
	starsBefore := len(w.Cells(nil))
	w.Observe(tetrisEvent(), Snapshot{Level: 3})
	if _, ok := w.Banner(); !ok {
		t.Error("a four-line clear should raise a banner")
	}
	if w.BorderEnergy() < 0.8 {
		t.Errorf("border energy = %.2f, want near 1", w.BorderEnergy())
	}
	if w.HUDPulse() < 0.8 {
		t.Errorf("HUD pulse = %.2f, want near 1", w.HUDPulse())
	}
	if dx, dy := w.ShakeOffset(); dx == 0 && dy == 0 {
		t.Error("a four-line clear should shake the screen")
	}
	w.Advance(50 * time.Millisecond)
	if now := len(w.Cells(nil)); now <= starsBefore {
		t.Errorf("cell count %d did not rise above the resting %d — no eruption or density boost", now, starsBefore)
	}
}

func TestBannerLastsSevenHundredMilliseconds(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe(tetrisEvent(), Snapshot{Level: 1})
	text, ok := w.Banner()
	if !ok || text == "" {
		t.Fatalf("Banner() = %q, %v", text, ok)
	}
	w.Advance(650 * time.Millisecond)
	if _, ok := w.Banner(); !ok {
		t.Error("banner vanished before 700ms")
	}
	w.Advance(100 * time.Millisecond)
	if _, ok := w.Banner(); ok {
		t.Error("banner outlived 700ms")
	}
}

func TestBannerTextComesFromTheSpecList(t *testing.T) {
	allowed := map[string]bool{
		"✦ EVENT HORIZON ✦": true, "QUADRUPLE COSMIC INCIDENT": true,
		"FOUR ROWS HAVE LEFT THE CHAT": true, "SPACE-TIME HAS FILED A COMPLAINT": true,
	}
	seen := map[string]bool{}
	for seed := int64(0); seed < 40; seed++ {
		w := NewWorld(Config{Seed: seed, Enabled: true})
		w.Resize(geom())
		w.Observe(tetrisEvent(), Snapshot{Level: 1})
		text, _ := w.Banner()
		if !allowed[text] {
			t.Fatalf("banner %q is not one of the §20 banners", text)
		}
		seen[text] = true
	}
	if len(seen) < 2 {
		t.Errorf("40 seeds produced %d distinct banners; the choice should vary", len(seen))
	}
}

func TestComboEscalation(t *testing.T) {
	cases := []struct {
		combo      int
		wantCells  bool
		wantPulse  bool
		wantBanner bool
		wantShock  bool
	}{
		{1, false, false, false, false},
		{2, true, false, false, false},
		{3, true, false, false, false},
		{4, true, true, false, false},
		{5, true, true, true, true},
	}
	for _, c := range cases {
		w := NewWorld(Config{Seed: 1, Enabled: true})
		w.Resize(Geometry{ScreenW: 80, ScreenH: 30, BoardX: 29, BoardY: 3, CellCols: 2})
		w.Observe([]game.Event{game.ComboChanged{Combo: c.combo}}, Snapshot{Level: 2, Combo: c.combo})
		var gameplayCells, shockCells int
		for _, cell := range w.Cells(nil) {
			switch cell.Role {
			case RoleDebris, RoleImpact:
				gameplayCells++
			case RoleShock:
				shockCells++
			}
		}
		if c.wantCells && gameplayCells == 0 {
			t.Errorf("combo %d: expected sparks or meteors", c.combo)
		}
		if !c.wantCells && gameplayCells > 0 {
			t.Errorf("combo %d: expected no particles, got %d", c.combo, gameplayCells)
		}
		if got := w.HUDPulse() > 0.5; got != c.wantPulse {
			t.Errorf("combo %d: HUD pulse %v, want %v", c.combo, got, c.wantPulse)
		}
		if _, ok := w.Banner(); ok != c.wantBanner {
			t.Errorf("combo %d: banner %v, want %v", c.combo, ok, c.wantBanner)
		}
		if got := shockCells > 0; got != c.wantShock {
			t.Errorf("combo %d: shockwave %v, want %v", c.combo, got, c.wantShock)
		}
	}
}

func TestComboBannerNamesTheCombo(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.ComboChanged{Combo: 6}}, Snapshot{Level: 2, Combo: 6})
	text, ok := w.Banner()
	if !ok || !strings.Contains(text, "COMBO 6") {
		t.Errorf("banner = %q, want it to name COMBO 6", text)
	}
}

func TestShockwaveExpandsAndExpires(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.ComboChanged{Combo: 5}}, Snapshot{Level: 2, Combo: 5})
	radius := func() float64 {
		var maxR float64
		cx, cy := 40.0, 15.0
		for _, c := range w.Cells(nil) {
			if c.Role != RoleShock {
				continue
			}
			r := math.Hypot(float64(c.X)-cx, (float64(c.Y)-cy)*2)
			if r > maxR {
				maxR = r
			}
		}
		return maxR
	}
	r0 := radius()
	w.Advance(150 * time.Millisecond)
	r1 := radius()
	if !(r1 > r0) {
		t.Errorf("ring did not expand: %.1f -> %.1f", r0, r1)
	}
	w.Advance(200 * time.Millisecond)
	for _, c := range w.Cells(nil) {
		if c.Role == RoleShock {
			t.Error("shockwave outlived 300ms")
			break
		}
	}
}

func TestShockwavesAreRateLimited(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	for i := 0; i < 10; i++ {
		w.Observe([]game.Event{game.ComboChanged{Combo: 6}}, Snapshot{Level: 2, Combo: 6})
		w.Advance(20 * time.Millisecond)
	}
	rings := map[int]bool{}
	for _, c := range w.Cells(nil) {
		if c.Role == RoleShock {
			rings[c.Y] = true // rough proxy: distinct rows touched by ring cells
		}
	}
	if len(rings) > 24 {
		t.Errorf("%d shockwave rows alive at once; §24 says use them sparingly", len(rings))
	}
}

func TestReducedMotionSuppressesHyperdriveAndShockwaves(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true, ReducedMotion: true})
	w.Resize(geom())
	w.Advance(16 * time.Millisecond)
	calmRef := NewWorld(Config{Seed: 1, Enabled: true, ReducedMotion: true})
	calmRef.Resize(geom())
	calmRef.Advance(16 * time.Millisecond)
	calm := starDrift(t, calmRef, 200*time.Millisecond)

	w.Observe(tetrisEvent(), Snapshot{Level: 1})
	w.Observe([]game.Event{game.ComboChanged{Combo: 6}}, Snapshot{Level: 1, Combo: 6})
	w.Advance(200 * time.Millisecond)
	if drift := starDrift(t, w, 200*time.Millisecond); drift > calm*1.5 {
		t.Errorf("reduced motion drift %.2f should stay near calm %.2f — no hyperdrive (§49.5)", drift, calm)
	}
	for _, c := range w.Cells(nil) {
		if c.Role == RoleShock {
			t.Error("reduced motion must not emit shockwaves (§49.5)")
			break
		}
	}
	if _, ok := w.Banner(); !ok {
		t.Error("reduced motion should keep banners — they are text, not motion")
	}
}

func TestNewHighScoreTriggersHyperdrive(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Advance(16 * time.Millisecond)
	w.Observe(nil, Snapshot{Level: 1, Score: 100})
	w.Advance(2 * time.Second)
	base := starDrift(t, w, 100*time.Millisecond)
	w.Observe(nil, Snapshot{Level: 1, Score: 100000}) // a session high score
	w.Advance(150 * time.Millisecond)
	if drift := starDrift(t, w, 200*time.Millisecond); !(drift > base) {
		t.Errorf("a new high score should trigger hyperdrive: %.2f vs %.2f", drift, base)
	}
}
```

Render side:

```go
func TestBannerIsDrawnCenteredOverTheBoard(t *testing.T) {
	g := fixtureGame(t)
	out := renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, FX: stubFX{banner: "✦ EVENT HORIZON ✦"}})
	if !strings.Contains(out, "EVENT HORIZON") {
		t.Fatalf("banner not rendered:\n%s", out)
	}
	for _, line := range strings.Split(out, "\n") {
		if lipgloss.Width(line) > 80 {
			t.Errorf("banner pushed line %q to %d columns", line, lipgloss.Width(line))
		}
	}
}

func TestLongBannerIsTruncatedAtNarrowWidths(t *testing.T) {
	g := fixtureGame(t)
	out := renderPlain(Frame{Game: g, W: 40, H: 24, Mode: ModeFull, Seed: 7, FX: stubFX{banner: "SPACE-TIME HAS FILED A COMPLAINT"}})
	for _, line := range strings.Split(out, "\n") {
		if lipgloss.Width(line) > 40 {
			t.Errorf("line %q is %d columns wide at w=40", line, lipgloss.Width(line))
		}
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run 'Hyperdrive|FourLine|Banner|Combo|Shock|HighScore|ReducedMotion' -v`
Expected: FAIL.

- [ ] **Step 3: Implement hyperdrive, the four-line bundle, combo escalation, shockwaves and banner rendering**

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test -race ./... -v`
Expected: PASS.

- [ ] **Step 5: Verify the actual product requirement (§43)**

Run: `./cosmic-tetris --seed 1`, build a well, and clear four rows with a vertical `I`.
Expected: hyperdrive, a bigger shake, the border gradient sprinting, a particle eruption, a HUD flash, denser stars, and a giant banner — all at once, and the next piece is already controllable. §43 wants an immediate "LOL WHAT THE FUCK". If it does not land, turn up particle counts and banner size before adding new effects.

- [ ] **Step 6: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): hyperdrive, four-line spectacle, combo escalation and shockwaves"
```

---

### Task 9: Mission control

**Files:**
- Create: `internal/flavor/messages.go`
- Modify: `internal/app/update.go`, `internal/app/model.go`
- Test: `internal/flavor/messages_test.go`

**Interfaces:**
- Produces:
  ```go
  package flavor

  type Snapshot struct {
      Score, Lines, Level, Combo int
      ActiveKind                 game.PieceKind
  }
  type Channel struct{ /* ... */ }
  func NewChannel(seed int64) *Channel
  func (c *Channel) Observe(evts []game.Event, s Snapshot)
  func (c *Channel) PlayerActed() // called on any player key press
  func (c *Channel) Advance(dt time.Duration)
  func (c *Channel) Line() string // current message, never empty
  ```

Pinned behavior (§27, §45):

- A posted message holds for at least `MinHold = 2500ms`. A new trigger during the hold is dropped unless its priority is higher. Priorities: game over `3`; four-line clear, level change, combo ≥ 5 → `2`; everything else `1`. This is what "give them time to breathe" means.
- Idle rotation: after `IdleAfter = 12s` with no new message, post an idle line.
- The opening line is `NOMINALISH`.
- Message tables, verbatim from §27 for idle and general events:
  ```
  GRAVITY REMAINS MOSTLY LEGAL
  TETROMINO INJECTION SUCCESSFUL
  STRUCTURAL VIBES: QUESTIONABLE
  LOCAL UNIVERSE STABLE*
  * DEFINITION OF STABLE UNDER REVIEW
  MOON NOTIFIED
  ORBITAL OSHA HAS ENTERED THE CHAT
  WE HAVE EXCEEDED THE RECOMMENDED NUMBER OF BLOCKS
  PHYSICS TEAM SAYS KEEP GOING
  ```
- Event-specific lines: `LevelChanged` → `GRAVITY TAX INCREASED`, `LOCAL PHYSICS UPDATED WITHOUT CONSENT`, or `PLEASE SECURE ALL LOOSE TETROMINOES` (§22); `LinesCleared{Count:4}` → `FOUR ROWS HAVE LEFT THE CHAT`; `GameOver` → `CAUSE: EXCESSIVE GEOMETRY`.
- §45 rarities, each fired only in its specific situation and at most once per 30 s:
  - hard-dropping a vertical `I` → `KINETIC ROD DEPLOYED`
  - holding an `O` → `CUBE ADJACENT OBJECT SECURED`
  - score crossing a power of ten above 10 000 → `NUMBER BECAME BIGGER`
  - 10 s with no `PlayerActed` call → `CAPTAIN?`
  - probability `0.002` per posted message → `DID YOU KNOW YOU'RE IN A TERMINAL?`
- `Channel` owns its own `*rand.Rand`, seeded `seed ^ 0x1D` — separate from both the game and FX generators.

- [ ] **Step 1: Write the failing tests**

```go
func TestOpeningLine(t *testing.T) {
	c := NewChannel(1)
	if got := c.Line(); got != "NOMINALISH" {
		t.Errorf("Line() = %q, want NOMINALISH", got)
	}
}

func TestMessagesGetTimeToBreathe(t *testing.T) {
	c := NewChannel(1)
	c.Observe([]game.Event{game.PieceLocked{}}, Snapshot{Level: 1})
	first := c.Line()
	c.Advance(200 * time.Millisecond)
	for i := 0; i < 20; i++ {
		c.Observe([]game.Event{game.PieceLocked{}}, Snapshot{Level: 1})
		c.Advance(50 * time.Millisecond)
	}
	if c.Line() != first {
		t.Errorf("message changed to %q within the hold window (§27: do not rotate constantly)", c.Line())
	}
	c.Advance(3 * time.Second)
	c.Observe([]game.Event{game.PieceLocked{}}, Snapshot{Level: 1})
	if c.Line() == first {
		t.Error("message should be replaceable after the hold window")
	}
}

func TestHighPriorityEventPreempts(t *testing.T) {
	c := NewChannel(1)
	c.Observe([]game.Event{game.PieceLocked{}}, Snapshot{Level: 1})
	low := c.Line()
	c.Advance(100 * time.Millisecond)
	c.Observe([]game.Event{game.LevelChanged{Level: 4}}, Snapshot{Level: 4})
	if c.Line() == low {
		t.Error("a level change should preempt an ordinary message")
	}
}

func TestIdleRotation(t *testing.T) {
	c := NewChannel(1)
	first := c.Line()
	c.Advance(13 * time.Second)
	if c.Line() == first {
		t.Error("an idle channel should eventually post a new line")
	}
}

func TestEveryLineIsFromTheSpecTables(t *testing.T) {
	c := NewChannel(5)
	seen := map[string]bool{}
	for i := 0; i < 400; i++ {
		c.Observe([]game.Event{game.PieceLocked{}, game.LevelChanged{Level: i%9 + 1}}, Snapshot{Level: i%9 + 1})
		c.Advance(3 * time.Second)
		seen[c.Line()] = true
	}
	if len(seen) < 4 {
		t.Errorf("only %d distinct lines in 400 posts: %v", len(seen), seen)
	}
	for line := range seen {
		if line != strings.ToUpper(line) {
			t.Errorf("mission control line %q should be upper case", line)
		}
		if len(line) > 60 {
			t.Errorf("line %q is %d characters; the mission row is one line", line, len(line))
		}
	}
}

func TestKineticRodForAVerticalIHardDrop(t *testing.T) {
	c := NewChannel(1)
	c.Observe([]game.Event{game.PieceHardDropped{
		Piece: game.Piece{Kind: game.I, Rotation: 1, X: 3, Y: 18}, Cells: 12,
	}}, Snapshot{Level: 1})
	if c.Line() != "KINETIC ROD DEPLOYED" {
		t.Errorf("Line() = %q, want KINETIC ROD DEPLOYED (§45)", c.Line())
	}
}

func TestCubeAdjacentObjectForHoldingAnO(t *testing.T) {
	c := NewChannel(1)
	c.Observe([]game.Event{game.HoldUsed{Stored: game.O, Spawned: game.T}}, Snapshot{Level: 1})
	if c.Line() != "CUBE ADJACENT OBJECT SECURED" {
		t.Errorf("Line() = %q, want CUBE ADJACENT OBJECT SECURED (§45)", c.Line())
	}
}

func TestCaptainAfterALongIdle(t *testing.T) {
	c := NewChannel(1)
	c.PlayerActed()
	c.Advance(11 * time.Second)
	if !strings.Contains(c.Line(), "CAPTAIN?") {
		t.Errorf("Line() = %q, want the CAPTAIN? prompt after 10s of no input (§45)", c.Line())
	}
	c2 := NewChannel(1)
	for i := 0; i < 20; i++ {
		c2.PlayerActed()
		c2.Advance(time.Second)
	}
	if strings.Contains(c2.Line(), "CAPTAIN?") {
		t.Error("an active player should never see CAPTAIN?")
	}
}

func TestRaritiesDoNotRepeatConstantly(t *testing.T) {
	c := NewChannel(1)
	var kinetic int
	for i := 0; i < 60; i++ {
		c.Observe([]game.Event{game.PieceHardDropped{
			Piece: game.Piece{Kind: game.I, Rotation: 1, X: 3, Y: 18}, Cells: 12,
		}}, Snapshot{Level: 1})
		c.Advance(3 * time.Second)
		if c.Line() == "KINETIC ROD DEPLOYED" {
			kinetic++
		}
	}
	if kinetic > 8 {
		t.Errorf("KINETIC ROD DEPLOYED appeared %d times in 180s; §45 says occasional", kinetic)
	}
}

func TestChannelIsDeterministicPerSeed(t *testing.T) {
	run := func() []string {
		c := NewChannel(77)
		var out []string
		for i := 0; i < 40; i++ {
			c.Observe([]game.Event{game.PieceLocked{}}, Snapshot{Level: 1})
			c.Advance(3 * time.Second)
			out = append(out, c.Line())
		}
		return out
	}
	if !reflect.DeepEqual(run(), run()) {
		t.Error("the same seed produced different mission-control output")
	}
}

func TestFlavorRNGDoesNotTouchTheGameRNG(t *testing.T) {
	seq := func(withFlavor bool) []game.PieceKind {
		g := game.New(999)
		c := NewChannel(999)
		var out []game.PieceKind
		for i := 0; i < 25; i++ {
			out = append(out, g.Active.Kind)
			evts := g.Input(game.ActionHardDrop)
			if withFlavor {
				c.Observe(evts, Snapshot{Level: g.Level, Score: g.Score})
				c.Advance(3 * time.Second)
			}
		}
		return out
	}
	if !reflect.DeepEqual(seq(false), seq(true)) {
		t.Error("the flavor channel changed the piece order — RNGs are crossed")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/flavor/ -v`
Expected: FAIL — `undefined: NewChannel`.

- [ ] **Step 3: Implement `internal/flavor/messages.go`**

- [ ] **Step 4: Wire it into the app**

Hold a `*flavor.Channel` on the `Model`; call `PlayerActed()` from the key branch when a key maps to a game action; call `Observe`/`Advance` in the `FrameMsg` branch alongside the FX world; pass `Line()` into `render.Frame.Mission`. Mission control keeps working with `--no-fx`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test -race ./... -v`
Expected: PASS.

- [ ] **Step 6: Read it**

Run: `./cosmic-tetris --seed 1` and play a minute.
Expected: commentary that changes with what you did, sits still long enough to read, and never strobes.

- [ ] **Step 7: Commit**

```bash
git add internal/flavor internal/app
git commit -m "feat(flavor): mission control channel with cooldowns and rare lines"
```

---

### Task 10: Level-up notice and quantum storage

**Files:**
- Modify: `internal/fx/world.go`, `internal/render/render.go`
- Test: `internal/fx/notice_test.go`, `internal/fx/hold_test.go`, `internal/render/notice_test.go`

**Interfaces:**
- Produces:
  ```go
  // fx
  // Notice returns a slide-in card and its horizontal offset in cells.
  // ok is false when nothing is showing.
  func (w *World) Notice() (lines []string, offsetX int, ok bool)
  // render.FXView gains Notice() ([]string, int, bool).
  ```

Pinned behavior:

- **Level up** (§22): on `LevelChanged`, show a two-line card for `1600ms`:
  ```
  GRAVITY ANOMALY DETECTED
  LEVEL 08
  ```
  with a subtitle line chosen from `GRAVITY TAX INCREASED`, `LOCAL PHYSICS UPDATED WITHOUT CONSENT`, `PLEASE SECURE ALL LOOSE TETROMINOES`. It **slides in** over the first 200 ms (`offsetX` easing from `+8` to `0`), holds, then fades out over the last 300 ms (brightness only). It never pauses the game.
  With `--no-fx` the card still appears — but at `offsetX = 0` for its whole life, no slide.
- **Quantum storage** (§9): on `HoldUsed`, emit for `120ms` a compression streak — 6 `RoleTrail` particles along the row of the outgoing piece with strong `VX` (`±22` cells/s) and `Life = 0.12s` — plus 3 bright `RoleImpact` flash cells at the incoming piece's spawn cells. Gameplay does not wait for it.

- [ ] **Step 1: Write the failing tests**

```go
func TestLevelUpNoticeContentAndDuration(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.LevelChanged{Level: 8}}, Snapshot{Level: 8})
	lines, _, ok := w.Notice()
	if !ok {
		t.Fatal("a level change should raise a notice")
	}
	joined := strings.Join(lines, "\n")
	if !strings.Contains(joined, "GRAVITY ANOMALY DETECTED") || !strings.Contains(joined, "LEVEL 08") {
		t.Errorf("notice = %q, want the §22 card with a zero-padded level", joined)
	}
	w.Advance(1500 * time.Millisecond)
	if _, _, ok := w.Notice(); !ok {
		t.Error("notice vanished before 1600ms")
	}
	w.Advance(200 * time.Millisecond)
	if _, _, ok := w.Notice(); ok {
		t.Error("notice outlived 1600ms")
	}
}

func TestLevelUpNoticeSlidesIn(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.LevelChanged{Level: 3}}, Snapshot{Level: 3})
	_, first, _ := w.Notice()
	w.Advance(250 * time.Millisecond)
	_, settled, _ := w.Notice()
	if first <= settled {
		t.Errorf("notice offset went %d -> %d; it should slide in toward 0", first, settled)
	}
	if settled != 0 {
		t.Errorf("settled offset = %d, want 0", settled)
	}
}

func TestNoticeAppearsWithFXDisabledWithoutSliding(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: false})
	w.Resize(geom())
	w.Observe([]game.Event{game.LevelChanged{Level: 5}}, Snapshot{Level: 5})
	_, off, ok := w.Notice()
	if !ok {
		t.Error("--no-fx should still announce a level change (it is information)")
	}
	if off != 0 {
		t.Errorf("--no-fx notice offset = %d, want 0", off)
	}
}

func TestHoldEmitsAShortStreak(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.HoldUsed{Stored: game.T, Spawned: game.L}}, Snapshot{Level: 1, Active: game.Piece{Kind: game.T, X: 4, Y: 6}})
	var streak int
	for _, c := range w.Cells(nil) {
		if c.Role == RoleTrail || c.Role == RoleImpact {
			streak++
		}
	}
	if streak == 0 {
		t.Fatal("a hold should emit a compression streak (§9)")
	}
	w.Advance(200 * time.Millisecond)
	for _, c := range w.Cells(nil) {
		if c.Role == RoleTrail {
			t.Error("the hold streak should be gone after ~120ms")
			break
		}
	}
}
```

Render side:

```go
func TestNoticeIsDrawnAndClipped(t *testing.T) {
	g := fixtureGame(t)
	for _, sz := range [][2]int{{80, 30}, {40, 24}} {
		out := renderPlain(Frame{
			Game: g, W: sz[0], H: sz[1], Mode: ModeFull, Seed: 7,
			FX: stubFX{notice: []string{"GRAVITY ANOMALY DETECTED", "LEVEL 08"}, noticeOff: 3},
		})
		if !strings.Contains(out, "LEVEL 08") {
			t.Errorf("%dx%d: notice not rendered", sz[0], sz[1])
		}
		for _, line := range strings.Split(out, "\n") {
			if lipgloss.Width(line) > sz[0] {
				t.Errorf("%dx%d: notice pushed line %q to %d columns", sz[0], sz[1], line, lipgloss.Width(line))
			}
		}
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run 'Notice|Hold' -v`
Expected: FAIL.

- [ ] **Step 3: Implement the notice and hold effects**

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test -race ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): level-up notice and quantum storage hold effect"
```

---

### Task 11: Boot sequence and pause behavior

**Files:**
- Modify: `internal/app/model.go`, `internal/app/update.go`, `internal/render/render.go`
- Test: `internal/app/boot_test.go`, `internal/render/boot_test.go`, `internal/fx/paused_test.go`

**Interfaces:**
- Produces:
  ```go
  // app
  const StateBoot State = ... // added as the initial state
  // render
  const OverlayBoot OverlayKind = ...
  // Frame gains BootElapsed time.Duration for the boot timeline.
  ```

Pinned behavior (§29, §30):

- The program starts in `StateBoot`. The boot overlay reveals its lines on this timeline: title at `0ms`, `INITIALIZING LOCAL UNIVERSE...` at `150ms`, `gravity ........ OK` at `350ms`, `spacetime ...... OK` at `550ms`, `tetrominoes .... QUESTIONABLE` at `750ms`, `UNIVERSE ONLINE` at `900ms`. At `1000ms` the state becomes `StatePlaying` automatically.
- **Any key skips the boot sequence** and is consumed — it must not also move a piece.
- A `bubbles/v2/spinner` runs beside `INITIALIZING LOCAL UNIVERSE...` (this is §3's sanctioned use of Bubbles).
- No gravity runs during boot: `game.Advance` is not called in `StateBoot`.
- Pause (§30): gameplay and gameplay particles freeze; `fx.Snapshot.Paused` is true, so stars keep drifting very slowly (already tested in Task 3) and `LayerBoard`/`LayerGlobal` particles do not advance.

- [ ] **Step 1: Write the failing tests**

```go
// app
func TestProgramStartsInBoot(t *testing.T) {
	m := New(Options{Seed: 1})
	m.SetSize(80, 30)
	if m.state != StateBoot {
		t.Errorf("state = %v, want StateBoot", m.state)
	}
	out := stripANSI(m.View())
	if !strings.Contains(out, "COSMIC") {
		t.Errorf("boot screen should show the title:\n%s", out)
	}
}

func TestBootRevealsStepsThenStarts(t *testing.T) {
	m := New(Options{Seed: 1})
	m.SetSize(80, 30)
	start := time.Now()
	m.Update(FrameMsg{Now: start})
	m.Update(FrameMsg{Now: start.Add(400 * time.Millisecond)})
	if out := stripANSI(m.View()); !strings.Contains(out, "gravity") {
		t.Errorf("expected the gravity check by 400ms:\n%s", out)
	}
	for now := start.Add(450 * time.Millisecond); now.Sub(start) < 1100*time.Millisecond; now = now.Add(50 * time.Millisecond) {
		m.Update(FrameMsg{Now: now})
	}
	if m.state != StatePlaying {
		t.Errorf("state = %v after 1.1s, want StatePlaying", m.state)
	}
}

func TestNoGravityDuringBoot(t *testing.T) {
	m := New(Options{Seed: 1})
	m.SetSize(80, 30)
	y := m.game.Active.Y
	start := time.Now()
	for i := 0; i < 10; i++ {
		m.Update(FrameMsg{Now: start.Add(time.Duration(i) * 90 * time.Millisecond)})
		if m.state != StateBoot {
			break
		}
	}
	if m.game.Active.Y != y && m.state == StateBoot {
		t.Error("the piece fell during the boot sequence")
	}
}

func TestAnyKeySkipsBootAndIsConsumed(t *testing.T) {
	m := New(Options{Seed: 1})
	m.SetSize(80, 30)
	x := m.game.Active.X
	m.Update(keyPress("left"))
	if m.state != StatePlaying {
		t.Errorf("state = %v, want StatePlaying after a key press", m.state)
	}
	if m.game.Active.X != x {
		t.Error("the skip key should be consumed, not also applied as a move")
	}
}

func TestQuitStillWorksDuringBoot(t *testing.T) {
	m := New(Options{Seed: 1})
	m.SetSize(80, 30)
	if _, cmd := m.Update(keyPress("ctrl+c")); cmd == nil {
		t.Error("ctrl+c during boot should quit")
	}
}
```

```go
// render
func TestBootOverlayGolden(t *testing.T) {
	f := Frame{
		Game: game.New(7), W: 80, H: 30, Mode: ModeFull, Seed: 7,
		Overlay: OverlayBoot, BootElapsed: 800 * time.Millisecond,
	}
	out := renderPlain(f)
	for _, want := range []string{"C O S M I C", "T E T R I S", "INITIALIZING LOCAL UNIVERSE", "gravity", "spacetime", "tetrominoes"} {
		if !strings.Contains(out, want) {
			t.Errorf("boot overlay missing %q", want)
		}
	}
	goldenCheck(t, "boot", out)
}

func TestBootOverlayFitsTheMinimumTerminal(t *testing.T) {
	f := Frame{Game: game.New(7), W: 40, H: 24, Mode: ModeFull, Seed: 7, Overlay: OverlayBoot, BootElapsed: 900 * time.Millisecond}
	for _, line := range strings.Split(renderPlain(f), "\n") {
		if lipgloss.Width(line) > 40 {
			t.Errorf("line %q is %d columns wide at w=40", line, lipgloss.Width(line))
		}
	}
}
```

```go
// fx — Review Focus 5
func TestPausedFreezesGameplayParticles(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	w.Observe([]game.Event{game.PieceHardDropped{Piece: game.Piece{Kind: game.T, X: 4, Y: 19}, Cells: 11}}, Snapshot{Level: 1})
	before := averageY(w.Cells(nil), RoleImpact)
	for i := 0; i < 20; i++ {
		w.Observe(nil, Snapshot{Level: 1, Paused: true})
		w.Advance(16 * time.Millisecond)
	}
	after := averageY(w.Cells(nil), RoleImpact)
	if math.Abs(after-before) > 0.01 {
		t.Errorf("gameplay particles moved while paused: %.3f -> %.3f (§30)", before, after)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ ./internal/render/ ./internal/fx/ -run 'Boot|Paused' -v`
Expected: FAIL.

- [ ] **Step 3: Implement the boot state, overlay and paused freeze**

- [ ] **Step 4: Generate the boot golden and verify**

Run: `go test ./internal/render/ -update && go test -race ./... -v`
Expected: PASS. Read `boot.golden` — it should read like §29's excessive drama.

- [ ] **Step 5: Watch it**

Run: `./cosmic-tetris`
Expected: about a second of drama, then the game starts by itself; pressing any key skips straight in without also moving a piece.

- [ ] **Step 6: Commit**

```bash
git add internal/app internal/render internal/fx
git commit -m "feat(app): boot sequence, skip-on-keypress and paused particle freeze"
```

---

### Task 12: Game-over black hole

**Files:**
- Modify: `internal/fx/world.go`, `internal/render/render.go`, `internal/app/update.go`
- Test: `internal/fx/gameover_test.go`, `internal/render/gameover_test.go`

**Interfaces:**
- Produces:
  ```go
  // fx
  type CollapsePhase int
  const (
      CollapseNone CollapsePhase = iota
      CollapseSignalLost  // 0-300ms
      CollapseInfall      // 300-900ms
      CollapseSingularity // 900-1300ms
      CollapseDone        // >=1300ms
  )
  func (w *World) Collapse() CollapsePhase
  // render.FXView gains Collapse() fx.CollapsePhase.
  ```

Pinned behavior (§28):

- On `game.GameOver`, capture `Snapshot.Board` and start the collapse timeline.
- `CollapseSignalLost` (0–300 ms): everything freezes; render the captured board plus a centered `SIGNAL LOST`.
- `CollapseInfall` (300–900 ms): at the phase boundary, convert every filled board cell into a `RoleCollapse` particle carrying its `PieceKind`, with velocity aimed at the board center (magnitude scaled by distance so they arrive together) — and stop drawing the board itself.
- `CollapseSingularity` (900–1300 ms): draw §28's black hole, with the core as `██` (`##` in ASCII — §28's `●` is double-width in many terminals) and the `\ | /` rays and stray `·` `˚` `*` around it.
- `CollapseDone` (≥1300 ms): `app` switches `Frame.Overlay` to `OverlayGameOver` and plan 2's final card appears, now with the `CAUSE: EXCESSIVE GEOMETRY` subtitle already in place.
- `r` and `q` work throughout — the theatre must not block input (§44). `r` cancels the collapse and restarts immediately.
- With `--no-fx`, `Collapse()` returns `CollapseDone` immediately and the final card shows at once.

- [ ] **Step 1: Write the failing tests**

```go
// fx
func TestCollapseTimeline(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	var b game.Board
	for x := 0; x < game.Width; x++ {
		for y := 14; y < game.Height; y++ {
			b.Set(x, y, game.J)
		}
	}
	w.Observe([]game.Event{game.GameOver{Score: 1000, Lines: 12, Level: 3}}, Snapshot{Level: 3, Board: b})
	cases := []struct {
		at   time.Duration
		want CollapsePhase
	}{
		{0, CollapseSignalLost},
		{200 * time.Millisecond, CollapseSignalLost},
		{400 * time.Millisecond, CollapseInfall},
		{1000 * time.Millisecond, CollapseSingularity},
		{1400 * time.Millisecond, CollapseDone},
	}
	var elapsed time.Duration
	for _, c := range cases {
		w.Advance(c.at - elapsed)
		elapsed = c.at
		if got := w.Collapse(); got != c.want {
			t.Errorf("at %v: phase = %v, want %v", c.at, got, c.want)
		}
	}
}

func TestBlocksFallInwardDuringInfall(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	var b game.Board
	for x := 0; x < game.Width; x++ {
		b.Set(x, 21, game.I)
	}
	w.Observe([]game.Event{game.GameOver{}}, Snapshot{Board: b})
	w.Advance(350 * time.Millisecond)
	centerX := float64(geom().BoardX + 1 + game.Width)
	spread := func() float64 {
		var s, n float64
		for _, c := range w.Cells(nil) {
			if c.Role == RoleCollapse {
				s += math.Abs(float64(c.X) - centerX)
				n++
			}
		}
		if n == 0 {
			return -1
		}
		return s / n
	}
	first := spread()
	if first < 0 {
		t.Fatal("no collapse particles were created")
	}
	w.Advance(300 * time.Millisecond)
	if second := spread(); !(second < first) {
		t.Errorf("blocks are not converging on the center: %.2f -> %.2f", first, second)
	}
}

func TestCollapseParticlesKeepTheirPieceColors(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: true})
	w.Resize(geom())
	var b game.Board
	b.Set(3, 20, game.Z)
	w.Observe([]game.Event{game.GameOver{}}, Snapshot{Board: b})
	w.Advance(350 * time.Millisecond)
	var found bool
	for _, c := range w.Cells(nil) {
		if c.Role == RoleCollapse && c.Kind == game.Z {
			found = true
		}
	}
	if !found {
		t.Error("collapse particles should inherit the locked cell's piece kind")
	}
}

func TestDisabledWorldSkipsTheCollapse(t *testing.T) {
	w := NewWorld(Config{Seed: 1, Enabled: false})
	w.Resize(geom())
	w.Observe([]game.Event{game.GameOver{}}, Snapshot{})
	if got := w.Collapse(); got != CollapseDone {
		t.Errorf("--no-fx collapse phase = %v, want CollapseDone", got)
	}
}
```

```go
// render
func TestSignalLostThenSingularityThenCard(t *testing.T) {
	g := fixtureGame(t)
	signal := renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, FX: stubFX{collapse: fx.CollapseSignalLost}})
	if !strings.Contains(signal, "SIGNAL LOST") {
		t.Error("phase 1 should show SIGNAL LOST")
	}
	sing := renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, FX: stubFX{collapse: fx.CollapseSingularity}})
	if !strings.Contains(sing, "\\ | /") && !strings.Contains(sing, "|") {
		t.Errorf("phase 3 should draw the black hole:\n%s", sing)
	}
	goldenCheck(t, "collapse", sing)
	card := renderPlain(Frame{Game: g, W: 80, H: 30, Mode: ModeFull, Seed: 7, Overlay: OverlayGameOver, FX: stubFX{collapse: fx.CollapseDone}})
	if !strings.Contains(card, "UNIVERSE EXPIRED") {
		t.Error("the final card should show once the collapse is done")
	}
}

func TestCollapseIsASCIISafe(t *testing.T) {
	out := renderPlain(Frame{Game: fixtureGame(t), W: 80, H: 30, Mode: ModeASCII, Seed: 7, FX: stubFX{collapse: fx.CollapseSingularity}})
	for _, r := range out {
		if r > unicode.MaxASCII {
			t.Fatalf("non-ASCII rune %q in the ASCII-mode collapse", r)
		}
	}
}
```

```go
// app
func TestRestartAndQuitWorkDuringTheCollapse(t *testing.T) {
	m := New(Options{Seed: 7})
	m.SetSize(80, 30)
	m.Update(keyPress("x")) // skip boot
	for i := 0; i < 500 && m.state != StateGameOver; i++ {
		m.Update(keyPress(" "))
	}
	if m.state != StateGameOver {
		t.Fatal("could not reach game over")
	}
	if _, cmd := m.Update(keyPress("q")); cmd == nil {
		t.Error("q must quit during the collapse")
	}
	m2 := New(Options{Seed: 7})
	m2.SetSize(80, 30)
	m2.Update(keyPress("x"))
	for i := 0; i < 500 && m2.state != StateGameOver; i++ {
		m2.Update(keyPress(" "))
	}
	m2.Update(keyPress("r"))
	if m2.state != StatePlaying {
		t.Error("r must restart during the collapse, without waiting for it to finish")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ ./internal/app/ -run 'Collapse|SignalLost|Infall|Singularity' -v`
Expected: FAIL.

- [ ] **Step 3: Implement the collapse**

- [ ] **Step 4: Generate the golden and verify**

Run: `go test ./internal/render/ -update && go test -race ./... -v`
Expected: PASS; read `collapse.golden` and confirm the black hole looks like §28.

- [ ] **Step 5: Die on purpose**

Run: `./cosmic-tetris --seed 3` and top out.
Expected: freeze, `SIGNAL LOST`, the stack falling inward, a black hole, then the score card — and `r` gets you a new universe at any point in that sequence.

- [ ] **Step 6: Commit**

```bash
git add internal/fx internal/render internal/app
git commit -m "feat(fx): game-over collapse into a black hole"
```

---

### Task 13: Mode audit, FX goldens, coolness acceptance

**Files:**
- Test: `internal/fx/modes_test.go`, `internal/render/fxgolden_test.go`, `internal/render/sweep_test.go`, `internal/render/testdata/*`
- Modify: `README.md`

**Note on the import boundary:** `modes_test.go` imports `lipgloss` for its width check. That is fine — the boundary rule is about `internal/fx`'s own dependencies, and `TestFXDoesNotImportRenderOrApp` checks the non-test package with `go list -deps`.

**Interfaces:**
- Consumes: everything.
- Produces: no new API. This task is the acceptance gate for §43, §44 and §47.

- [ ] **Step 1: Write the FX glyph width and import-boundary tests**

```go
// internal/fx/modes_test.go
func TestEveryEmittedGlyphIsSingleWidth(t *testing.T) {
	for _, ascii := range []bool{false, true} {
		w := NewWorld(Config{Seed: 4, Enabled: true, ASCII: ascii})
		w.Resize(geom())
		var b game.Board
		for x := 0; x < game.Width; x++ {
			b.Set(x, 21, game.I)
		}
		before, rows := clearedBoard()
		script := [][]game.Event{
			{game.PieceMoved{Piece: game.Piece{Kind: game.T, X: 4, Y: 8}, DX: 1}},
			{game.PieceHardDropped{Piece: game.Piece{Kind: game.I, Rotation: 1, X: 3, Y: 18}, Cells: 12}},
			{game.LinesCleared{Rows: rows, Count: 4, Before: before}},
			{game.ComboChanged{Combo: 6}},
			{game.LevelChanged{Level: 9}},
			{game.HoldUsed{Stored: game.O, Spawned: game.I}},
			{game.GameOver{Score: 1, Lines: 1, Level: 1}},
		}
		for _, evts := range script {
			w.Observe(evts, Snapshot{Level: 4, Combo: 6, Board: b})
			for i := 0; i < 40; i++ {
				w.Advance(16 * time.Millisecond)
				for _, c := range w.Cells(nil) {
					if wdt := lipgloss.Width(string(c.Glyph)); wdt != 1 {
						t.Fatalf("ascii=%v: emitted glyph %q is %d columns wide", ascii, c.Glyph, wdt)
					}
					if ascii && c.Glyph > unicode.MaxASCII {
						t.Fatalf("ASCII mode emitted the non-ASCII glyph %q", c.Glyph)
					}
				}
			}
		}
	}
}

func TestFXDoesNotImportRenderOrApp(t *testing.T) {
	for _, pkg := range []string{"cosmic-tetris/internal/fx", "cosmic-tetris/internal/flavor"} {
		out, err := exec.Command("go", "list", "-deps", pkg).Output()
		if err != nil {
			t.Fatal(err)
		}
		for _, banned := range []string{"cosmic-tetris/internal/render", "cosmic-tetris/internal/app"} {
			if strings.Contains(string(out), banned) {
				t.Errorf("%s depends on %s — effects must not know about rendering or the app (design.md §14)", pkg, banned)
			}
		}
	}
}

// Review Focus 4: every mode combination on every path.
func TestEveryModeCombinationSurvivesAFullScript(t *testing.T) {
	before, rows := clearedBoard()
	events := []game.Event{
		game.PieceSpawned{}, game.PieceMoved{Piece: game.Piece{Kind: game.T, X: 4, Y: 8}, DX: 1},
		game.PieceRotated{Dir: 1}, game.PieceHardDropped{Piece: game.Piece{Kind: game.I, Rotation: 1, X: 3, Y: 18}, Cells: 12},
		game.PieceLocked{}, game.LinesCleared{Rows: rows, Count: 4, Before: before},
		game.ComboChanged{Combo: 7}, game.LevelChanged{Level: 11},
		game.HoldUsed{Stored: game.O, Spawned: game.S}, game.GameOver{Score: 9, Lines: 9, Level: 9},
	}
	for _, enabled := range []bool{true, false} {
		for _, reduced := range []bool{true, false} {
			for _, ascii := range []bool{true, false} {
				w := NewWorld(Config{Seed: 8, Enabled: enabled, ReducedMotion: reduced, ASCII: ascii})
				w.Resize(geom())
				for i := 0; i < 120; i++ {
					w.Observe(events, Snapshot{Level: 11, Combo: 7, Score: i * 1000})
					w.Advance(16 * time.Millisecond)
					if dx, dy := w.ShakeOffset(); reduced && (dx != 0 || dy != 0) {
						t.Fatalf("reduced motion produced shake (%d,%d)", dx, dy)
					}
					if w.Count() > MaxParticles {
						t.Fatalf("particle count %d exceeded the cap", w.Count())
					}
					for _, c := range w.Cells(nil) {
						if reduced && c.Role == RoleShock {
							t.Fatal("reduced motion emitted a shockwave")
						}
						if !enabled {
							t.Fatalf("--no-fx emitted a cell: %+v", c)
						}
					}
				}
			}
		}
	}
}

// Review Focus 1: a long game must not degrade.
func TestSustainedPlayStaysBounded(t *testing.T) {
	w := NewWorld(Config{Seed: 8, Enabled: true})
	w.Resize(geom())
	before, rows := clearedBoard()
	for i := 0; i < 4000; i++ {
		w.Observe([]game.Event{
			game.PieceHardDropped{Piece: game.Piece{Kind: game.I, Rotation: 1, X: 3, Y: 18}, Cells: 12},
			game.LinesCleared{Rows: rows, Count: 4, Before: before},
			game.ComboChanged{Combo: i%9 + 1},
		}, Snapshot{Level: 12, Combo: i%9 + 1})
		w.Advance(16 * time.Millisecond)
		if w.Count() > MaxParticles {
			t.Fatalf("iteration %d: particle count %d exceeds the cap", i, w.Count())
		}
	}
}

func BenchmarkWorldFrame(b *testing.B) {
	w := NewWorld(Config{Seed: 8, Enabled: true})
	w.Resize(geom())
	before, rows := clearedBoard()
	w.Observe([]game.Event{game.LinesCleared{Rows: rows, Count: 4, Before: before}}, Snapshot{Level: 8})
	buf := make([]Cell, 0, MaxParticles)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w.Advance(16 * time.Millisecond)
		buf = w.Cells(buf[:0])
	}
}
```

- [ ] **Step 2: Run them and fix what they find**

Run: `go test ./internal/fx/ -run 'Glyph|Import|Mode|Sustained' -v && go test ./internal/fx/ -bench WorldFrame -benchtime 200x`
Expected: PASS. The benchmark should report well under 1 ms per frame; if it does not, the bottleneck is FX arithmetic and needs fixing (§38 says the terminal should be the bottleneck).

- [ ] **Step 3: Add FX-inclusive goldens**

```go
// internal/render/fxgolden_test.go
// deterministicFX is a fixed FX state, so the golden pins the compositing
// rules rather than a moment in a live simulation.
func deterministicFX() stubFX {
	return stubFX{
		cells: []fx.Cell{
			{X: 2, Y: 2, Glyph: '.', Role: fx.RoleStarFar, Brightness: 0.35, Layer: fx.LayerBackground},
			{X: 6, Y: 8, Glyph: '✦', Role: fx.RoleStarNear, Brightness: 1, Layer: fx.LayerBackground},
			{X: 70, Y: 20, Glyph: '·', Role: fx.RoleStarMid, Brightness: 0.6, Layer: fx.LayerBackground},
			{X: 40, Y: 12, Glyph: '*', Role: fx.RoleDebris, Brightness: 1, Layer: fx.LayerGlobal},
		},
		phase: 0.25, energy: 0.5,
	}
}

func TestGoldenWideWithFX(t *testing.T) {
	f := Frame{Game: fixtureGame(t), W: 80, H: 30, Mode: ModeFull, Seed: 7, Mission: "PHYSICS TEAM SAYS KEEP GOING", FX: deterministicFX()}
	goldenCheck(t, "wide_fx", renderPlain(f))
}

func TestGoldenSmallWithFXAndBanner(t *testing.T) {
	s := deterministicFX()
	s.banner = "✦ EVENT HORIZON ✦"
	f := Frame{Game: fixtureGame(t), W: 40, H: 24, Mode: ModeFull, Seed: 7, Mission: "MOON NOTIFIED", FX: s}
	goldenCheck(t, "small_fx", renderPlain(f))
}

func TestGoldenASCIIWithFX(t *testing.T) {
	s := deterministicFX()
	for i := range s.cells {
		s.cells[i].Glyph = '*'
	}
	f := Frame{Game: fixtureGame(t), W: 80, H: 30, Mode: ModeASCII, Seed: 7, Mission: "ORBITAL OSHA HAS ENTERED THE CHAT", FX: s}
	goldenCheck(t, "ascii_fx", renderPlain(f))
}
```

Run: `go test ./internal/render/ -update && go test -race ./... -v`
Expected: PASS; read the three new goldens and confirm stars appear only outside the board and the piece is never covered.

- [ ] **Step 4: Extend the plan-2 sweep to include FX**

Add to `internal/render/sweep_test.go`:

```go
func TestSweepWithFX(t *testing.T) {
	g := fixtureGame(t)
	s := deterministicFX()
	for w := 1; w <= 120; w++ {
		for h := 1; h <= 60; h += 3 {
			out := renderPlain(Frame{Game: g, W: w, H: h, Mode: ModeFull, Seed: 7, FX: s, Mission: "MOON NOTIFIED"})
			lines := strings.Split(out, "\n")
			if len(lines) > h {
				t.Fatalf("%dx%d with FX: %d lines", w, h, len(lines))
			}
			for _, line := range lines {
				if lipgloss.Width(line) > w {
					t.Fatalf("%dx%d with FX: line %q is %d columns", w, h, line, lipgloss.Width(line))
				}
			}
		}
	}
}
```

Run: `go test ./internal/render/ -run SweepWithFX -v`
Expected: PASS.

- [ ] **Step 5: Run the coolness acceptance test by hand (§43)**

Run: `./cosmic-tetris --seed 11` and play for 30 seconds, then check off each item:

- [ ] moving starfield
- [ ] animated board border
- [ ] piece trails
- [ ] hard-drop impact
- [ ] particles
- [ ] mission-control commentary
- [ ] on the first completed line: supernova clear, debris, border reaction
- [ ] on a four-line clear: an immediate "LOL WHAT THE FUCK"
- [ ] output does not visibly flicker
- [ ] controls never lag, even during a four-line clear
- [ ] the active piece is never obscured

Then run `./cosmic-tetris --no-fx --seed 11` and confirm it is still a good game, and `./cosmic-tetris --reduced-motion --seed 11` and confirm nothing shakes or lurches while the game still looks alive. Fix whatever fails before finishing; unchecked boxes are unfinished work, not notes for later.

- [ ] **Step 6: Update `README.md`**

Add a short "cosmic effects" section: what the effects layer does, that it can never touch game state, `--no-fx` and `--reduced-motion` and exactly what each suppresses, and a note that the game RNG and FX RNG are independent.

- [ ] **Step 7: Final verification**

Run: `go test -race ./... && go vet ./... && gofmt -l . && go build ./...`
Expected: all pass, `gofmt -l` empty.

- [ ] **Step 8: Commit**

```bash
git add internal/fx internal/render README.md
git commit -m "test(fx): mode audit, FX goldens, sweep and coolness acceptance"
```

---

## Done when

Walking §47's definition of done, the items this plan owns:

- Effects never modify game state; `internal/fx` cannot even see a `*game.Game`, and the dependency test proves it does not know about `render` or `app`.
- Game RNG and FX RNG are isolated — proven by the two "does not touch the game RNG" tests.
- Four-line clears are gloriously excessive: hyperdrive, shake, border pulse, eruption, HUD flash, star density boost, banner.
- Game over collapses the universe into a black hole, and `r`/`q` still work throughout.
- ASCII fallback, `--no-fx` and `--reduced-motion` all work, each with tests pinning exactly what they suppress.
- Terminal output does not visibly flicker; animations never block input; particle count is bounded and the frame benchmark is well under one millisecond.
- The game is fun with effects disabled and much funnier with them enabled.
