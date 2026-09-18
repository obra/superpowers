# Cosmic Tetris — Plan 2: Cosmic Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the independent effects simulation — starfield, particles, trails, animated border, impacts, screen shake, supernova line clears, shockwaves, hyperdrive, the four-line sequence, combo escalation, and mission-control commentary — so the terminal visibly loses its composure without gameplay ever waiting for it.

**Architecture:** `internal/fx` is a simulation that observes `[]game.Event` and advances on `Update(dt)`. It never holds a `*game.Game` beyond a read and never writes to one. It emits nothing but data: `World.Marks()` appends glyph/brightness/color-role marks in terminal cell coordinates, tagged with the layer they belong to, and `internal/render` decides how those become ANSI. `internal/flavor` is a pure string table. Effect intensity is a single scalar that `--no-fx` zeroes and `--reduced-motion` partly suppresses, which is why both flags cost almost nothing.

**Tech Stack:** Go 1.24, `charm.land/lipgloss/v2` (render side only), `math/rand` (v1) with an RNG that is not the game's.

**Spec:** `design.md` (this plan implements §14–§27, §37 steps 2/6/9/10/11, §38, §42 phases 3–4, §44)

**Depends on:** Plan 1 (`plans/2026-09-17-cosmic-tetris-1-engine-and-playable-terminal.md`) complete and its tests green.

## Global Constraints

- `internal/fx` must not import `internal/render` or `internal/app` — `render` imports `fx`, and a cycle is a compile error. `fx` imports `internal/game` for the `Event` type only.
- **`fx` may never modify `GameState`** (§14). Every `fx` function that receives a `*game.Game` takes it read-only; prefer passing only the event slice plus scalars.
- `fx.World` holds its own `*rand.Rand`, independent of the game's (§35, §49.6). Crossing them makes piece order depend on particle counts.
- Effects never delay gameplay: no `Update` path blocks, sleeps, or gates an input (§44).
- Screen shake never exceeds one terminal cell in any direction (§44).
- Particles never permanently alter the rendered board — they are composited per frame onto a fresh canvas (§44).
- Board readability is sacred: nothing in this plan may draw over the active piece, and board-layer marks are clipped to the board interior (§21, §44).
- No goroutine per particle, no goroutine per frame, no filesystem access during gameplay, no synchronous per-frame logging (§38). Reuse slices.
- `--no-fx` zeroes all effects and the game must still be good (§32). `--reduced-motion` suppresses screen shake, hyperdrive acceleration, and shockwaves while leaving color, trails, and particles alone (§49.5).
- New files this plan adds beyond §33's tree: none. It fills in `internal/fx/{world,particle,starfield,events}.go` and `internal/flavor/messages.go` exactly as §33 lists them.
- Every task ends with a commit. `gofmt -l .` must print nothing.

## Review Focus

1. **Sustained four-line clears with hyperdrive stacking**: a skilled player triggers a tetris every few seconds, each emitting dozens of particles plus a star-density bump. Without a hard cap, the particle slice grows until frame time collapses and the terminal — the actual bottleneck (§38) — stops keeping up. Cap and evict. — Task 2.
2. **A particle drifting far off-screen**: physics puts `X` at `-40` or `1e6` (or a NaN if a drag/dt combination ever divides), and a mark at that coordinate must be culled by the simulation and clipped by the canvas, never indexed. — Tasks 2 and 4.
3. **`dt == 0` and enormous `dt`**: the app clamps gameplay `dt`, but FX see the same value, and a zero `dt` must not divide, while a 100 ms `dt` must not let a 140 ms trail skip its entire fade in a single step. — Task 1.
4. **A resize mid-effect**: the terminal shrinks from 100×40 to 40×24 while a shockwave is expanding and a banner is up. Marks computed for the old geometry must be clipped or re-based, not written past the new canvas, and the board layer must follow the board's new rect. — Task 4.
5. **`--no-fx` with events still flowing**: the world is constructed but disabled, so `Observe` and `Update` must remain safe no-ops that allocate nothing and return zero marks — a disabled world must not be a nil-pointer path. — Task 1.

---

## File Structure

```text
internal/fx/
├── events.go      Config, intensity, event ingestion, trigger classification
├── particle.go    Particle, integration step, emitters, the population cap
├── starfield.go   three depth layers, drift, hyperdrive speed
└── world.go       World: state, Update, Observe, Marks, shake, border, banner
internal/flavor/
└── messages.go    every fixed string the spec pins, plus contextual selection
internal/render/
├── fx.go          NEW: Marks -> Canvas compositing, star drawing, shake offset
├── render.go      MODIFIED: Scene gains *fx.World; pipeline gains steps 2/6/9/10
├── board.go       MODIFIED: honors the shake offset
├── hud.go         MODIFIED: HUD pulse styling
└── palette.go     MODIFIED: ColorRole -> style, border gradient colors
internal/app/
├── model.go       MODIFIED: owns the World, session best score
└── update.go      MODIFIED: feeds events to the World, advances it
```

---

### Task 1: World skeleton, config, and intensity

**Files:**
- Create: `internal/fx/events.go`, `internal/fx/world.go`
- Test: `internal/fx/world_test.go`

**Interfaces:**
- Consumes: `game.Event`, `game.EventKind` (Plan 1 Task 7).
- Produces:

```go
// events.go
type Config struct {
	Enabled       bool // false when --no-fx
	ReducedMotion bool // true when --reduced-motion
	ASCII         bool // true when --ascii: restrict glyphs to ASCII
}
type Layer uint8
const (LayerBoard Layer = iota; LayerScreen) // board layer is clipped to the board interior
type ColorRole uint8
const (
	RoleStarFar ColorRole = iota
	RoleStarMid
	RoleStarNear
	RoleDebris
	RoleImpact
	RolePiece   // use Mark.Kind
	RoleBanner
	RoleShock
)
type Mark struct {
	X, Y   int
	Glyph  rune
	Bright float64 // 0..1
	Layer  Layer
	Role   ColorRole
	Kind   game.PieceKind // meaningful when Role == RolePiece
}

// world.go
type Rect struct { X, Y, W, H int }
type World struct {
	Cfg      Config
	Level    int
	Combo    int
	Elapsed  time.Duration
	Screen   Rect
	Board    Rect // board interior, in screen cell coordinates
	// unexported: rng, particles, stars, trails, clears, shocks, hyper, shake, banner, border, mission
}
func NewWorld(seed int64, cfg Config) *World
func (w *World) SetGeometry(screen, board Rect)
func (w *World) Update(dt time.Duration)
func (w *World) Observe(events []game.Event)
func (w *World) Marks(dst []Mark) []Mark // appends; returns dst for reuse (§38)
func (w *World) ParticleCount() int
```

`Observe` takes only the event slice — that is the narrowest read of game state that works, and it makes "FX cannot modify GameState" true by construction rather than by discipline.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func enabled() Config { return Config{Enabled: true} }

func TestNewWorldStartsQuietAndTracksElapsed(t *testing.T) {
	w := NewWorld(1, enabled())
	w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	if w.Level != 1 {
		t.Errorf("Level = %d, want 1", w.Level)
	}
	w.Update(50 * time.Millisecond)
	if w.Elapsed != 50*time.Millisecond {
		t.Errorf("Elapsed = %v, want 50ms", w.Elapsed)
	}
	w.Update(50 * time.Millisecond)
	if w.Elapsed != 100*time.Millisecond {
		t.Errorf("Elapsed = %v, want 100ms", w.Elapsed)
	}
}

func TestZeroAndHugeDtAreSafe(t *testing.T) {
	w := NewWorld(1, enabled())
	w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	w.Observe([]game.Event{{Kind: game.EventPieceHardDropped, Distance: 12, Piece: game.Piece{Kind: game.I, X: 3, Y: 8}}})
	w.Update(0)
	w.Update(0)
	before := w.ParticleCount()
	w.Update(10 * time.Second) // everything transient must have expired, not exploded
	if w.ParticleCount() > before {
		t.Errorf("particles grew across a 10s step: %d -> %d", before, w.ParticleCount())
	}
	marks := w.Marks(nil)
	for _, m := range marks {
		if m.Bright < 0 || m.Bright > 1 {
			t.Fatalf("mark brightness %v out of range after a huge dt", m.Bright)
		}
	}
}

func TestDisabledWorldProducesNothingAndAllocatesNothing(t *testing.T) {
	w := NewWorld(1, Config{Enabled: false})
	w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	w.Observe([]game.Event{
		{Kind: game.EventPieceHardDropped, Distance: 20},
		{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}},
		{Kind: game.EventComboChanged, Value: 7},
		{Kind: game.EventLevelChanged, Value: 9},
		{Kind: game.EventGameOver},
	})
	for i := 0; i < 100; i++ {
		w.Update(16 * time.Millisecond)
	}
	if got := w.ParticleCount(); got != 0 {
		t.Errorf("disabled world holds %d particles, want 0", got)
	}
	if got := w.Marks(nil); len(got) != 0 {
		t.Errorf("disabled world produced %d marks, want 0", len(got))
	}
	if dx, dy := w.ShakeOffset(); dx != 0 || dy != 0 {
		t.Errorf("disabled world shakes: %d,%d", dx, dy)
	}
}

func TestObserveNeverPanicsOnAnyEventKind(t *testing.T) {
	kinds := []game.EventKind{
		game.EventPieceMoved, game.EventPieceRotated, game.EventPieceHardDropped,
		game.EventPieceLocked, game.EventHoldUsed, game.EventLinesCleared,
		game.EventComboChanged, game.EventLevelChanged, game.EventGameOver,
	}
	for _, k := range kinds {
		w := NewWorld(1, enabled())
		w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
		w.Observe([]game.Event{{Kind: k, Rows: []int{21}, Distance: 3, Value: 4, Piece: game.Piece{Kind: game.T, X: 4, Y: 10}}})
		w.Update(16 * time.Millisecond)
		_ = w.Marks(nil)
	}
	// Also: no geometry set at all.
	w := NewWorld(1, enabled())
	w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{21}}})
	w.Update(16 * time.Millisecond)
	_ = w.Marks(nil)
}

func TestObserveHandlesNilAndEmptySlices(t *testing.T) {
	w := NewWorld(1, enabled())
	w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	w.Observe(nil)
	w.Observe([]game.Event{})
	w.Update(16 * time.Millisecond)
}

func TestFXRngIsIndependentOfTheGameRng(t *testing.T) {
	// Running FX against one game must not change the piece order of another
	// game with the same seed. This is §35's isolation requirement.
	plain := game.New(4242)
	withFX := game.New(4242)
	w := NewWorld(999, enabled())
	w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	for i := 0; i < 200; i++ {
		w.Observe(withFX.HardDrop())
		w.Update(16 * time.Millisecond)
		plain.HardDrop()
		if withFX.Over || plain.Over {
			break
		}
	}
	if plain.Board != withFX.Board || plain.Score != withFX.Score || plain.Active != withFX.Active {
		t.Fatal("running FX changed the game: the RNGs are crossed")
	}
}

func TestObserveDoesNotMutateTheEventsItIsGiven(t *testing.T) {
	rows := []int{18, 19, 20, 21}
	evs := []game.Event{{Kind: game.EventLinesCleared, Rows: rows}}
	w := NewWorld(1, enabled())
	w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	w.Observe(evs)
	if evs[0].Rows[0] != 18 || len(evs[0].Rows) != 4 {
		t.Fatalf("Observe mutated the event slice: %v", evs[0].Rows)
	}
}

func TestLevelAndComboAreTrackedFromEvents(t *testing.T) {
	w := NewWorld(1, enabled())
	w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	w.Observe([]game.Event{{Kind: game.EventLevelChanged, Value: 9}, {Kind: game.EventComboChanged, Value: 5}})
	if w.Level != 9 {
		t.Errorf("Level = %d, want 9", w.Level)
	}
	if w.Combo != 5 {
		t.Errorf("Combo = %d, want 5", w.Combo)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/fx/ -v`
Expected: FAIL — undefined: `NewWorld`, `Config`, `Mark`.

- [ ] **Step 3: Implement `events.go` and the `world.go` skeleton**

`NewWorld` builds `rng: rand.New(rand.NewSource(seed))` and `Level: 1`. Every public method returns immediately when `!w.Cfg.Enabled`. `Update` adds `dt` to `Elapsed` and then advances each subsystem; subsystem advance functions are stubs for now (`updateParticles`, `updateStars`, `updateTrails`, `updateClears`, `updateShocks`, `updateHyper`, `updateShake`, `updateBanner`, `updateBorder`) so later tasks fill one each. `Observe` switches on `EventKind`, updating `Level`/`Combo` and calling per-effect emitters (also stubs). Add `func (w *World) ShakeOffset() (int, int)` returning `0, 0` for now — Task 8 implements it.

Guard against a large `dt` starving short animations: `Update` splits `dt` into steps of at most `MaxStep = 16 * time.Millisecond` and loops, capping the number of substeps at 8 so an enormous `dt` costs bounded work.

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/fx/ -v`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/fx/
git commit -m "feat(fx): world skeleton, config, event ingestion, mark interface"
```

---

### Task 2: Particle simulation

**Files:**
- Create: `internal/fx/particle.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/particle_test.go`

**Interfaces:**
- Consumes: Task 1's `World`, `Mark`, `Layer`, `ColorRole`.
- Produces:

```go
type Particle struct {
	X, Y       float64
	VX, VY     float64
	Life       float64 // seconds remaining
	MaxLife    float64
	Glyph      rune
	Brightness float64
	Layer      Layer
	Role       ColorRole
}
const MaxParticles = 600
var Gravity = 14.0 // cells/s^2, downward
var Drag = 0.90    // per-step multiplier
func (w *World) Emit(p Particle)
func (w *World) EmitBurst(x, y float64, count int, speed float64, layer Layer, role ColorRole)
func (w *World) ParticleCount() int
```

Integration per §23: `position += velocity × dt; velocity += acceleration × dt; velocity *= drag; life -= dt`. Particles die at `Life <= 0` or when outside the screen rect. No collision detection.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"math"
	"testing"
	"time"
)

func worldAt(w, h int) *World {
	world := NewWorld(7, Config{Enabled: true})
	world.SetGeometry(Rect{0, 0, w, h}, Rect{10, 3, 20, 20})
	return world
}

func TestParticleMovesByVelocityAndFalls(t *testing.T) {
	w := worldAt(80, 30)
	w.Emit(Particle{X: 10, Y: 10, VX: 4, VY: 0, Life: 5, MaxLife: 5, Glyph: '*', Brightness: 1})
	w.Update(100 * time.Millisecond)
	m := w.Marks(nil)
	if len(m) == 0 {
		t.Fatal("no marks after emitting a particle")
	}
	var found bool
	for _, k := range m {
		if k.Glyph == '*' {
			found = true
			if k.X <= 10 {
				t.Errorf("particle X = %d, want it to have moved right of 10", k.X)
			}
			if k.Y < 10 {
				t.Errorf("particle Y = %d, want gravity to pull it down or hold it", k.Y)
			}
		}
	}
	if !found {
		t.Fatal("particle produced no mark")
	}
}

func TestParticleDiesWhenLifeRunsOut(t *testing.T) {
	w := worldAt(80, 30)
	w.Emit(Particle{X: 10, Y: 10, Life: 0.05, MaxLife: 0.05, Glyph: '*', Brightness: 1})
	if w.ParticleCount() != 1 {
		t.Fatalf("ParticleCount = %d, want 1", w.ParticleCount())
	}
	w.Update(100 * time.Millisecond)
	if w.ParticleCount() != 0 {
		t.Fatalf("ParticleCount = %d after its life expired, want 0", w.ParticleCount())
	}
}

func TestParticleBrightnessFadesWithLife(t *testing.T) {
	w := worldAt(80, 30)
	w.Emit(Particle{X: 10, Y: 10, Life: 1, MaxLife: 1, Glyph: '*', Brightness: 1})
	first := w.Marks(nil)[0].Bright
	w.Update(500 * time.Millisecond)
	second := w.Marks(nil)[0].Bright
	if !(second < first) {
		t.Fatalf("brightness did not fade: %v -> %v", first, second)
	}
	if second < 0 {
		t.Fatalf("brightness went negative: %v", second)
	}
}

func TestParticlesLeavingTheViewportAreCulled(t *testing.T) {
	w := worldAt(80, 30)
	for _, p := range []Particle{
		{X: -50, Y: 10, Life: 9, MaxLife: 9, Glyph: 'a', Brightness: 1},
		{X: 500, Y: 10, Life: 9, MaxLife: 9, Glyph: 'b', Brightness: 1},
		{X: 10, Y: -30, Life: 9, MaxLife: 9, Glyph: 'c', Brightness: 1},
		{X: 10, Y: 900, Life: 9, MaxLife: 9, Glyph: 'd', Brightness: 1},
	} {
		w.Emit(p)
	}
	w.Update(16 * time.Millisecond)
	if got := w.ParticleCount(); got != 0 {
		t.Fatalf("ParticleCount = %d, want all off-screen particles culled", got)
	}
}

func TestNonFiniteParticlesAreRejectedOrCulled(t *testing.T) {
	w := worldAt(80, 30)
	w.Emit(Particle{X: math.NaN(), Y: 5, Life: 9, MaxLife: 9, Glyph: 'n', Brightness: 1})
	w.Emit(Particle{X: 5, Y: math.Inf(1), Life: 9, MaxLife: 9, Glyph: 'i', Brightness: 1})
	w.Update(16 * time.Millisecond)
	for _, m := range w.Marks(nil) {
		if m.Glyph == 'n' || m.Glyph == 'i' {
			t.Fatalf("a non-finite particle produced a mark at %d,%d", m.X, m.Y)
		}
	}
}

func TestParticlePopulationIsCapped(t *testing.T) {
	w := worldAt(80, 30)
	for i := 0; i < MaxParticles*4; i++ {
		w.EmitBurst(40, 15, 20, 12, LayerScreen, RoleDebris)
	}
	if got := w.ParticleCount(); got > MaxParticles {
		t.Fatalf("ParticleCount = %d, want at most %d", got, MaxParticles)
	}
	// And the cap must not stop new effects from appearing at all.
	if w.ParticleCount() == 0 {
		t.Fatal("the cap dropped everything")
	}
}

func TestEmitBurstSpreadsInAllDirections(t *testing.T) {
	w := worldAt(80, 30)
	w.EmitBurst(40, 15, 40, 10, LayerScreen, RoleDebris)
	if w.ParticleCount() < 30 {
		t.Fatalf("burst produced %d particles, want ~40", w.ParticleCount())
	}
	w.Update(120 * time.Millisecond)
	var left, right, up bool
	for _, m := range w.Marks(nil) {
		if m.Role != RoleDebris {
			continue
		}
		if m.X < 40 {
			left = true
		}
		if m.X > 40 {
			right = true
		}
		if m.Y < 15 {
			up = true
		}
	}
	if !left || !right || !up {
		t.Fatalf("burst is not radial: left=%v right=%v up=%v", left, right, up)
	}
}

func TestBurstIsReproducibleForAGivenFxSeed(t *testing.T) {
	snap := func() []Mark {
		w := worldAt(80, 30)
		w.EmitBurst(40, 15, 30, 10, LayerScreen, RoleDebris)
		w.Update(80 * time.Millisecond)
		return w.Marks(nil)
	}
	a, b := snap(), snap()
	if len(a) != len(b) {
		t.Fatalf("same fx seed produced %d vs %d marks", len(a), len(b))
	}
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("mark %d diverged: %+v vs %+v", i, a[i], b[i])
		}
	}
}

func TestMarksAppendsToTheProvidedSliceForReuse(t *testing.T) {
	w := worldAt(80, 30)
	w.EmitBurst(40, 15, 10, 8, LayerScreen, RoleDebris)
	buf := make([]Mark, 0, 512)
	buf = w.Marks(buf[:0])
	first := len(buf)
	buf = w.Marks(buf[:0])
	if len(buf) != first {
		t.Fatalf("Marks into a reused buffer gave %d then %d", first, len(buf))
	}
	if cap(buf) < 512 {
		t.Error("Marks reallocated instead of appending into the given slice")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/fx/ -run TestParticle -run 'TestParticle|TestNonFinite|TestEmitBurst|TestBurstIs|TestMarksAppends' -v`
Expected: FAIL — undefined: `Particle`, `Emit`, `MaxParticles`.

- [ ] **Step 3: Implement `particle.go` and wire `updateParticles` into `Update`**

`Emit` drops the particle when `X`/`Y`/`VX`/`VY` are not finite (`math.IsNaN` or `math.IsInf`). When the slice is at `MaxParticles`, overwrite the oldest entry rather than appending — a bounded ring keeps a tetris storm from unbounded growth. Culling compacts in place (`particles = particles[:n]`) so the backing array is reused. Mark brightness is `p.Brightness × (p.Life / p.MaxLife)`, clamped to `0..1`. `Marks` rounds float positions with `int(math.Round(...))`.

`EmitBurst` picks `count` angles as `2π × i / count` plus a `rng`-drawn jitter, and speed as `speed × (0.6 + 0.8 × rng.Float64())` — the "radial explosion force + random angular variation" of §23.

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/fx/particle.go internal/fx/world.go internal/fx/particle_test.go
git commit -m "feat(fx): particle physics with a bounded population"
```

---

### Task 3: Starfield

**Files:**
- Create: `internal/fx/starfield.go`
- Test: `internal/fx/starfield_test.go`

**Interfaces:**
- Produces:

```go
type Star struct {
	X, Y  float64
	Speed float64
	Glyph rune
	Depth int // 0 far, 1 mid, 2 near
}
const (StarsFar = 40; StarsMid = 24; StarsNear = 10)
func (w *World) seedStars()          // called by SetGeometry
func (w *World) StarCount() int
func (w *World) SpeedMultiplier() float64 // level drift + hyperdrive, 1.0 at rest
```

Glyph sets (§15): far `.`, mid `·` and `˚`, near `✦` and `✧`; in ASCII mode far `.`, mid `:`, near `*`. Base downward speeds: far 0.6, mid 1.6, near 3.4 cells/s. Level scaling is subtle: `1 + 0.04 × (level - 1)`, capped at 2.0. Stars that pass the bottom wrap to the top with a fresh random column.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"strings"
	"testing"
	"time"
)

func TestStarsExistInThreeDepthsAfterGeometryIsSet(t *testing.T) {
	w := worldAt(80, 30)
	depths := map[int]int{}
	for _, m := range w.Marks(nil) {
		switch m.Role {
		case RoleStarFar:
			depths[0]++
		case RoleStarMid:
			depths[1]++
		case RoleStarNear:
			depths[2]++
		}
	}
	for d := 0; d < 3; d++ {
		if depths[d] == 0 {
			t.Errorf("depth %d has no stars", d)
		}
	}
	if depths[0] <= depths[2] {
		t.Errorf("far stars (%d) should outnumber near stars (%d)", depths[0], depths[2])
	}
}

func TestStarsDriftDownwardAndNearFasterThanFar(t *testing.T) {
	w := worldAt(80, 30)
	before := map[rune]float64{}
	sum := func() (far, near float64) {
		for _, m := range w.Marks(nil) {
			switch m.Role {
			case RoleStarFar:
				far += float64(m.Y)
			case RoleStarNear:
				near += float64(m.Y)
			}
		}
		return
	}
	far0, near0 := sum()
	w.Update(500 * time.Millisecond)
	far1, near1 := sum()
	if far1 <= far0 {
		t.Errorf("far stars did not drift down: %v -> %v", far0, far1)
	}
	if (near1-near0)/StarsNear <= (far1-far0)/StarsFar {
		t.Error("near stars must move faster than far stars")
	}
	_ = before
}

func TestStarCountIsStableAcrossLongRuns(t *testing.T) {
	w := worldAt(80, 30)
	start := w.StarCount()
	for i := 0; i < 600; i++ {
		w.Update(16 * time.Millisecond)
	}
	if w.StarCount() != start {
		t.Fatalf("StarCount drifted from %d to %d; stars must wrap, not accumulate", start, w.StarCount())
	}
}

func TestStarsStayInsideTheScreen(t *testing.T) {
	w := worldAt(80, 30)
	for i := 0; i < 400; i++ {
		w.Update(16 * time.Millisecond)
		for _, m := range w.Marks(nil) {
			if m.Role != RoleStarFar && m.Role != RoleStarMid && m.Role != RoleStarNear {
				continue
			}
			if m.X < 0 || m.X >= 80 || m.Y < 0 || m.Y >= 30 {
				t.Fatalf("star escaped the screen at %d,%d", m.X, m.Y)
			}
		}
	}
}

func TestHigherLevelSpeedsStarsUpSubtly(t *testing.T) {
	slow := worldAt(80, 30)
	fast := worldAt(80, 30)
	fast.Level = 12
	if !(fast.SpeedMultiplier() > slow.SpeedMultiplier()) {
		t.Fatalf("level 12 multiplier %v not greater than level 1 %v", fast.SpeedMultiplier(), slow.SpeedMultiplier())
	}
	if fast.SpeedMultiplier() > 2.0 {
		t.Fatalf("multiplier %v exceeds the 2.0 cap; §15 says subtle", fast.SpeedMultiplier())
	}
}

func TestAsciiModeUsesOnlyAsciiStarGlyphs(t *testing.T) {
	w := NewWorld(3, Config{Enabled: true, ASCII: true})
	w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	for _, m := range w.Marks(nil) {
		if m.Glyph > 127 {
			t.Fatalf("non-ASCII star glyph %q in ASCII mode", m.Glyph)
		}
	}
}

func TestStarGlyphsMatchTheSpecSets(t *testing.T) {
	w := worldAt(80, 30)
	allowed := map[ColorRole]string{
		RoleStarFar:  ".",
		RoleStarMid:  "·˚",
		RoleStarNear: "✦✧*",
	}
	for _, m := range w.Marks(nil) {
		set, ok := allowed[m.Role]
		if !ok {
			continue
		}
		if !strings.ContainsRune(set, m.Glyph) {
			t.Errorf("role %v used glyph %q, want one of %q", m.Role, m.Glyph, set)
		}
	}
}

func TestResizeRebasesStarsIntoTheNewScreen(t *testing.T) {
	w := worldAt(200, 60)
	w.Update(time.Second)
	w.SetGeometry(Rect{0, 0, 40, 24}, Rect{10, 2, 20, 20})
	w.Update(16 * time.Millisecond)
	for _, m := range w.Marks(nil) {
		if m.X < 0 || m.X >= 40 || m.Y < 0 || m.Y >= 24 {
			t.Fatalf("after shrinking, a mark sits at %d,%d outside 40x24", m.X, m.Y)
		}
	}
}

func TestZeroSizedScreenHasNoStarsAndNoPanic(t *testing.T) {
	w := NewWorld(1, Config{Enabled: true})
	w.SetGeometry(Rect{0, 0, 0, 0}, Rect{0, 0, 0, 0})
	w.Update(time.Second)
	if got := len(w.Marks(nil)); got != 0 {
		t.Fatalf("zero-sized screen produced %d marks", got)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/fx/ -run 'TestStar|TestHigherLevel|TestAsciiMode|TestResizeRebases|TestZeroSized' -v`
Expected: FAIL — undefined: `Star`, `StarCount`, `SpeedMultiplier`.

- [ ] **Step 3: Implement `starfield.go` and wire `updateStars`**

`seedStars` fills the three layers with random positions across the screen rect and returns early when the rect has zero area. `SetGeometry` reseeds when the dimensions change (that also handles Review Focus 4 for stars). `updateStars` moves each star down by `Speed × SpeedMultiplier() × dt` and wraps at the bottom. `SpeedMultiplier` is `min(1 + 0.04*(Level-1), 2.0)` multiplied by the hyperdrive factor (Task 11 supplies that; return the level part alone for now).

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/fx/starfield.go internal/fx/starfield_test.go internal/fx/world.go
git commit -m "feat(fx): three-layer starfield with level-scaled drift"
```

---

### Task 4: Compositing marks into the frame

**Files:**
- Create: `internal/render/fx.go`
- Modify: `internal/render/render.go`, `internal/render/palette.go`
- Test: `internal/render/fx_test.go`

**Interfaces:**
- Consumes: `fx.World`, `fx.Mark`; `Canvas`, `Layout`, `Palette`.
- Produces:

```go
func DrawMarks(c *Canvas, w *fx.World, l Layout, p Palette, layer fx.Layer, occupied func(x, y int) bool)
func (p Palette) MarkStyle(role fx.ColorRole, kind game.PieceKind, bright float64) lipgloss.Style
// Scene gains:
//   FX *fx.World   // nil is legal and draws nothing
```

`Frame` becomes §37 in full: layout → background stars (`DrawMarks` with the star roles, screen layer) → board (locked, ghost, active) → board-layer FX → border → HUD → screen-layer FX → banners → mission → controls. `occupied` is how §44's "never obscure the active piece" becomes mechanical: the board pass passes a predicate that reports the active piece's cells, and `DrawMarks` skips them.

- [ ] **Step 1: Write the failing test**

```go
package render

import (
	"strings"
	"testing"
	"time"

	"cosmic-tetris/internal/fx"
	"cosmic-tetris/internal/game"
)

func liveWorld(w, h int, l Layout) *fx.World {
	world := fx.NewWorld(11, fx.Config{Enabled: true})
	world.SetGeometry(fx.Rect{X: 0, Y: 0, W: w, H: h}, fx.Rect{X: l.Board.X, Y: l.Board.Y, W: l.Board.W, H: l.Board.H})
	return world
}

func TestFramePaintsStarsOutsideTheBoard(t *testing.T) {
	l := Compute(80, 30)
	w := liveWorld(80, 30, l)
	out := stripANSI(Frame(Scene{Game: game.New(1), Mode: ModeFull, Width: 80, Height: 30, FX: w}))
	if !strings.ContainsAny(out, ".·˚✦✧") {
		t.Fatalf("no star glyphs in the frame:\n%s", out)
	}
}

func TestFrameWithNilFXIsIdenticalToPlan1Output(t *testing.T) {
	g := game.New(1)
	withNil := Frame(Scene{Game: g, Mode: ModeFull, Width: 80, Height: 30})
	disabled := fx.NewWorld(1, fx.Config{Enabled: false})
	disabled.SetGeometry(fx.Rect{X: 0, Y: 0, W: 80, H: 30}, fx.Rect{})
	withDisabled := Frame(Scene{Game: g, Mode: ModeFull, Width: 80, Height: 30, FX: disabled})
	if withNil != withDisabled {
		t.Fatal("a disabled world changed the frame; --no-fx must be pixel-identical to no FX")
	}
}

func TestMarksNeverOverwriteTheActivePiece(t *testing.T) {
	g := game.New(1)
	g.Active = game.Piece{Kind: game.T, Rotation: 0, X: 4, Y: 10}
	l := Compute(80, 30)
	w := liveWorld(80, 30, l)
	// Flood the board layer with debris right where the active piece is.
	for i := 0; i < 200; i++ {
		w.Emit(fx.Particle{
			X: float64(l.Board.X + 9), Y: float64(l.Board.Y + 8),
			Life: 9, MaxLife: 9, Glyph: '#', Brightness: 1,
			Layer: fx.LayerBoard, Role: fx.RoleDebris,
		})
	}
	out := stripANSI(Frame(Scene{Game: g, Mode: ModeFull, Width: 80, Height: 30, FX: w}))
	rows := strings.Split(out, "\n")
	for _, c := range g.Active.Cells() {
		if c[1] < game.HiddenRows {
			continue
		}
		y := l.Board.Y + c[1] - game.HiddenRows
		x := l.Board.X + c[0]*2
		cell := string([]rune(rows[y])[x : x+2])
		if strings.Contains(cell, "#") {
			t.Fatalf("debris drew over the active piece at %d,%d: %q", x, y, cell)
		}
	}
}

func TestBoardLayerMarksAreClippedToTheBoardInterior(t *testing.T) {
	g := game.New(1)
	l := Compute(80, 30)
	w := liveWorld(80, 30, l)
	for _, pos := range [][2]int{
		{l.Board.X - 3, l.Board.Y + 5},
		{l.Board.X + l.Board.W + 3, l.Board.Y + 5},
		{l.Board.X + 4, l.Board.Y - 3},
		{l.Board.X + 4, l.Board.Y + l.Board.H + 3},
	} {
		w.Emit(fx.Particle{X: float64(pos[0]), Y: float64(pos[1]), Life: 9, MaxLife: 9,
			Glyph: '@', Brightness: 1, Layer: fx.LayerBoard, Role: fx.RoleDebris})
	}
	out := stripANSI(Frame(Scene{Game: g, Mode: ModeFull, Width: 80, Height: 30, FX: w}))
	if strings.Contains(out, "@") {
		t.Fatalf("board-layer marks escaped the board interior:\n%s", out)
	}
}

func TestFrameDimensionsSurviveHeavyFX(t *testing.T) {
	g := game.New(1)
	for _, dims := range [][2]int{{40, 24}, {50, 26}, {80, 30}, {200, 60}} {
		l := Compute(dims[0], dims[1])
		w := liveWorld(dims[0], dims[1], l)
		w.Observe([]game.Event{
			{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}},
			{Kind: game.EventPieceHardDropped, Distance: 18, Piece: game.Piece{Kind: game.I, X: 3, Y: 3}},
			{Kind: game.EventComboChanged, Value: 7},
		})
		for i := 0; i < 30; i++ {
			w.Update(16 * time.Millisecond)
		}
		rows := strings.Split(stripANSI(Frame(Scene{Game: g, Mode: ModeFull, Width: dims[0], Height: dims[1], FX: w})), "\n")
		if len(rows) != dims[1] {
			t.Fatalf("at %dx%d got %d rows, want %d", dims[0], dims[1], len(rows), dims[1])
		}
		for i, r := range rows {
			if len([]rune(r)) != dims[0] {
				t.Fatalf("at %dx%d row %d is %d runes, want %d", dims[0], dims[1], i, len([]rune(r)), dims[0])
			}
		}
	}
}

func TestFrameSurvivesAResizeWhileEffectsAreLive(t *testing.T) {
	g := game.New(1)
	big := Compute(200, 60)
	w := liveWorld(200, 60, big)
	w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
	w.Update(50 * time.Millisecond)
	// Shrink without telling the world first: Frame must still be well-formed.
	rows := strings.Split(stripANSI(Frame(Scene{Game: g, Mode: ModeFull, Width: 40, Height: 24, FX: w})), "\n")
	if len(rows) != 24 {
		t.Fatalf("got %d rows after shrinking, want 24", len(rows))
	}
	for i, r := range rows {
		if len([]rune(r)) != 40 {
			t.Fatalf("row %d is %d runes after shrinking, want 40", i, len([]rune(r)))
		}
	}
}

func TestFXNeverMutatesTheGameAcrossAWholeFrame(t *testing.T) {
	g := game.New(9)
	before := *g
	l := Compute(80, 30)
	w := liveWorld(80, 30, l)
	w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{20, 21}}})
	for i := 0; i < 20; i++ {
		w.Update(16 * time.Millisecond)
		Frame(Scene{Game: g, Mode: ModeFull, Width: 80, Height: 30, FX: w})
	}
	if g.Board != before.Board || g.Active != before.Active || g.Score != before.Score ||
		g.Level != before.Level || g.Combo != before.Combo || g.Lines != before.Lines {
		t.Fatal("effects modified game state")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/render/ -run 'TestFrame|TestMarks|TestBoardLayer|TestFX' -v`
Expected: FAIL — `Scene` has no field `FX`; undefined `DrawMarks`.

- [ ] **Step 3: Implement `render/fx.go`, extend `Scene`, and rewrite `Frame`'s pipeline**

`DrawMarks` reuses a package-level `[]fx.Mark` buffer through `w.Marks(buf[:0])`. For `LayerBoard`, skip any mark outside the board interior rect and any mark for which `occupied(x, y)` is true. `MarkStyle` maps the role to a color and scales it by brightness (in `ModeFull` interpolate toward the background; in `ModeReduced`/`ModeASCII` pick from two or three fixed steps).

`Frame` runs the twelve §37 steps in order. Stars draw first so everything else covers them; board-layer FX draw after the active piece but before the border; screen-layer FX draw after the HUD.

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/render/ -v`
Expected: PASS — including Plan 1's goldens, which must be untouched because their scenes have no FX.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/render/
git commit -m "feat(render): composite fx marks with active-piece and board clipping"
```

---

### Task 5: Piece trails

**Files:**
- Modify: `internal/fx/world.go`
- Test: `internal/fx/trail_test.go`

**Interfaces:**
- Produces: `func (w *World) emitTrail(p game.Piece, strong bool)`, called from `Observe` on `EventPieceMoved`, `EventPieceRotated`, and `EventPieceHardDropped`. Trail glyph ramp per §17: `▓▓` at 1 step old, `▒▒` at 2, `░░` at 3 (ASCII mode: `%`, `:`, `.`). Lifetime 140 ms (§17's 100–160 ms range). Trails are `LayerBoard`, `RolePiece` with the piece's `Kind`.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func TestMovingAPieceLeavesATrail(t *testing.T) {
	w := worldAt(80, 30)
	before := len(w.Marks(nil))
	w.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: game.Piece{Kind: game.T, X: 4, Y: 10}}})
	after := len(w.Marks(nil))
	if after <= before {
		t.Fatalf("PieceMoved added no marks (%d -> %d)", before, after)
	}
}

func TestTrailsCarryThePieceColorRole(t *testing.T) {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: game.Piece{Kind: game.Z, X: 4, Y: 10}}})
	var found bool
	for _, m := range w.Marks(nil) {
		if m.Role == RolePiece {
			found = true
			if m.Kind != game.Z {
				t.Errorf("trail Kind = %v, want Z", m.Kind)
			}
			if m.Layer != LayerBoard {
				t.Errorf("trail Layer = %v, want LayerBoard", m.Layer)
			}
		}
	}
	if !found {
		t.Fatal("no RolePiece marks after a move")
	}
}

func TestTrailsExpireWithinOneSixthOfASecond(t *testing.T) {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: game.Piece{Kind: game.T, X: 4, Y: 10}}})
	w.Update(160 * time.Millisecond)
	for _, m := range w.Marks(nil) {
		if m.Role == RolePiece {
			t.Fatalf("a trail mark survived 160ms: %+v", m)
		}
	}
}

func TestTrailBrightnessDecaysThroughTheGlyphRamp(t *testing.T) {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: game.Piece{Kind: game.T, X: 4, Y: 10}}})
	bright := func() float64 {
		max := 0.0
		for _, m := range w.Marks(nil) {
			if m.Role == RolePiece && m.Bright > max {
				max = m.Bright
			}
		}
		return max
	}
	first := bright()
	w.Update(60 * time.Millisecond)
	if second := bright(); !(second < first) {
		t.Fatalf("trail did not fade: %v -> %v", first, second)
	}
}

func TestHardDropTrailIsStrongerThanAMoveTrail(t *testing.T) {
	move := worldAt(80, 30)
	move.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: game.Piece{Kind: game.I, X: 3, Y: 18}}})
	drop := worldAt(80, 30)
	drop.Observe([]game.Event{{Kind: game.EventPieceHardDropped, Distance: 14, Piece: game.Piece{Kind: game.I, X: 3, Y: 4}}})
	countRole := func(w *World, role ColorRole) int {
		n := 0
		for _, m := range w.Marks(nil) {
			if m.Role == role {
				n++
			}
		}
		return n
	}
	if countRole(drop, RolePiece) <= countRole(move, RolePiece) {
		t.Fatalf("hard-drop trail (%d marks) is not stronger than a move trail (%d)",
			countRole(drop, RolePiece), countRole(move, RolePiece))
	}
}

func TestHardDropTrailCoversTheCellsThePieceCrossed(t *testing.T) {
	w := worldAt(80, 30)
	// board rect starts at y=3; the piece fell from board row 4 to 18
	w.Observe([]game.Event{{Kind: game.EventPieceHardDropped, Distance: 14, Piece: game.Piece{Kind: game.I, Rotation: 1, X: 3, Y: 4}}})
	rows := map[int]bool{}
	for _, m := range w.Marks(nil) {
		if m.Role == RolePiece {
			rows[m.Y] = true
		}
	}
	if len(rows) < 8 {
		t.Fatalf("hard-drop trail touched only %d rows, want a vertical streak", len(rows))
	}
}

func TestTrailsAreSuppressedWhenDisabledButNotByReducedMotion(t *testing.T) {
	off := NewWorld(1, Config{Enabled: false})
	off.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	off.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: game.Piece{Kind: game.T, X: 4, Y: 10}}})
	if len(off.Marks(nil)) != 0 {
		t.Error("--no-fx still produced trail marks")
	}
	reduced := NewWorld(1, Config{Enabled: true, ReducedMotion: true})
	reduced.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	reduced.Observe([]game.Event{{Kind: game.EventPieceMoved, Piece: game.Piece{Kind: game.T, X: 4, Y: 10}}})
	var sawTrail bool
	for _, m := range reduced.Marks(nil) {
		if m.Role == RolePiece {
			sawTrail = true
		}
	}
	if !sawTrail {
		t.Error("--reduced-motion suppressed trails; §49.5 keeps them")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/fx/ -run TestTrail -run 'TestMovingAPiece|TestTrail|TestHardDropTrail' -v`
Expected: FAIL — no trail marks are produced.

- [ ] **Step 3: Implement trails**

Store trails as short-lived particles with zero velocity (`Layer: LayerBoard`, `Role: RolePiece`, `MaxLife: 0.14`), one per board cell the piece occupied, converted to screen coordinates through `w.Board`. For a hard drop, emit one row of trail cells for each row crossed, with life scaled down the further up the row is, so the streak fades upward.

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/fx/ && git commit -m "feat(fx): ion trails behind moving and hard-dropped pieces"
```

---

### Task 6: Animated board border

**Files:**
- Modify: `internal/fx/world.go`, `internal/render/board.go`, `internal/render/palette.go`
- Test: `internal/fx/border_test.go`, `internal/render/border_test.go`

**Interfaces:**
- Produces:

```go
// fx
type BorderState struct {
	Phase  float64 // 0..1, cycles slowly
	Energy float64 // 0..1, spikes on events and decays
}
func (w *World) BorderState() BorderState
func (w *World) FlashBorder(amount float64)
// render
func (p Palette) BorderStyleAt(pos int, total int, b fx.BorderState) lipgloss.Style
```

The border is the game's energy-state indicator (§25). Base cycle: `Phase` advances at `0.05` per second — one full sweep every 20 s, which is the "subtle" §25 asks for. `Energy` decays at `2.5` per second. `LinesCleared`, `PieceHardDropped`, `LevelChanged`, and combos ≥ 2 each add energy. At high energy the gradient moves rapidly around the border. Palette per §25: deep violet, electric cyan, magenta, stellar blue, hot white.

- [ ] **Step 1: Write the failing test**

```go
// internal/fx/border_test.go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func TestBorderPhaseAdvancesSlowlyAndWraps(t *testing.T) {
	w := worldAt(80, 30)
	start := w.BorderState().Phase
	w.Update(time.Second)
	after := w.BorderState().Phase
	if after == start {
		t.Fatal("border phase did not advance")
	}
	if d := after - start; d > 0.2 {
		t.Fatalf("phase moved %v in one second; §25 says subtle", d)
	}
	for i := 0; i < 100; i++ {
		w.Update(time.Second)
		if p := w.BorderState().Phase; p < 0 || p >= 1 {
			t.Fatalf("phase left 0..1: %v", p)
		}
	}
}

func TestEventsRaiseBorderEnergyAndItDecays(t *testing.T) {
	w := worldAt(80, 30)
	if e := w.BorderState().Energy; e != 0 {
		t.Fatalf("resting energy = %v, want 0", e)
	}
	w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{21}}})
	peak := w.BorderState().Energy
	if peak <= 0 {
		t.Fatal("a line clear did not energize the border")
	}
	w.Update(200 * time.Millisecond)
	mid := w.BorderState().Energy
	if !(mid < peak) {
		t.Fatalf("energy did not decay: %v -> %v", peak, mid)
	}
	w.Update(3 * time.Second)
	if e := w.BorderState().Energy; e != 0 {
		t.Fatalf("energy = %v after 3s, want it fully decayed to 0", e)
	}
}

func TestEnergyIsClampedToOne(t *testing.T) {
	w := worldAt(80, 30)
	for i := 0; i < 50; i++ {
		w.FlashBorder(1.0)
	}
	if e := w.BorderState().Energy; e > 1 {
		t.Fatalf("Energy = %v, want at most 1", e)
	}
}

func TestFourLineClearEnergizesMoreThanASingle(t *testing.T) {
	single := worldAt(80, 30)
	single.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{21}}})
	quad := worldAt(80, 30)
	quad.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
	if !(quad.BorderState().Energy > single.BorderState().Energy) {
		t.Fatalf("quad energy %v not above single %v", quad.BorderState().Energy, single.BorderState().Energy)
	}
}
```

```go
// internal/render/border_test.go
package render

import (
	"strings"
	"testing"

	"cosmic-tetris/internal/fx"
	"cosmic-tetris/internal/game"
)

func TestBorderStyleVariesAroundThePerimeter(t *testing.T) {
	p := NewPalette(ModeFull)
	b := fx.BorderState{Phase: 0.3, Energy: 0.5}
	a := p.BorderStyleAt(0, 80, b).Render("═")
	z := p.BorderStyleAt(40, 80, b).Render("═")
	if a == z {
		t.Fatal("border style is uniform; §25 wants a gradient")
	}
}

func TestBorderStillRendersWithoutFX(t *testing.T) {
	out := stripANSI(Frame(Scene{Game: game.New(1), Mode: ModeFull, Width: 80, Height: 30}))
	if !strings.Contains(out, "╔") || !strings.Contains(out, "╝") {
		t.Fatal("the border vanished when FX are absent")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestBorder|TestEvents|TestEnergy|TestFourLine' -v && go test ./internal/render/ -run TestBorder -v`
Expected: FAIL — undefined: `BorderState`, `BorderStyleAt`.

- [ ] **Step 3: Implement the border state and its styling**

`updateBorder` advances `Phase` by `0.05 × dt` (wrapping with `math.Mod`) plus `0.35 × Energy × dt` so high energy visibly speeds the sweep, and decays `Energy` toward 0. `DrawBoard` takes the palette's `BorderStyleAt(index, perimeter, state)` for each frame cell, where `index` walks the perimeter clockwise from the top-left. With no FX world, `DrawBoard` uses `fx.BorderState{}` and gets the resting style — so Plan 1's goldens do not move.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/fx/ internal/render/
git commit -m "feat(fx): animated board border as an energy-state indicator"
```

---

### Task 7: Mission control

**Files:**
- Create: `internal/flavor/messages.go`
- Modify: `internal/fx/world.go`, `internal/render/render.go`
- Test: `internal/flavor/messages_test.go`, `internal/fx/mission_test.go`

**Interfaces:**
- Produces:

```go
// flavor
type Trigger uint8
const (
	TriggerIdle Trigger = iota
	TriggerLock
	TriggerClear
	TriggerQuad
	TriggerCombo
	TriggerLevel
	TriggerHold
	TriggerHoldO
	TriggerKineticRod  // a vertically hard-dropped I (§45)
	TriggerScoreRoll   // score crossed a power of ten (§45)
	TriggerLongIdle
	TriggerRare
)
func Mission(t Trigger, level, combo int, rng *rand.Rand) string
func LevelUpSubtitle(rng *rand.Rand) string
func QuadBanner(rng *rand.Rand) string
func ComboLine(combo int) string
func GameOverSubtitle() string

// fx
const MissionCooldown = 2500 * time.Millisecond
const MissionHold     = 4000 * time.Millisecond
func (w *World) Mission() string
```

Strings are the spec's, verbatim: §27's nine mission lines, §20's four quad banners, §21's three combo lines, §22's three level subtitles, §45's five rarities, §28's `CAUSE: EXCESSIVE GEOMETRY`. `ComboLine(5)` returns `COMBO 5 // UNAUTHORIZED ORBITAL MANEUVER`, `(6)` `COMBO 6 // STRUCTURAL REALITY FAILURE`, `(7)` and above `COMBO 7 // NASA DENIES EVERYTHING` with the actual combo number substituted.

- [ ] **Step 1: Write the failing flavor test**

```go
package flavor

import (
	"math/rand"
	"strings"
	"testing"
)

func TestMissionReturnsNonEmptyForEveryTrigger(t *testing.T) {
	rng := rand.New(rand.NewSource(1))
	for tr := TriggerIdle; tr <= TriggerRare; tr++ {
		got := Mission(tr, 5, 3, rng)
		if strings.TrimSpace(got) == "" {
			t.Errorf("Mission(%d) returned empty", tr)
		}
		if got != strings.ToUpper(got) {
			t.Errorf("Mission(%d) = %q; mission control shouts", tr, got)
		}
	}
}

func TestSpecPinnedStringsArePresent(t *testing.T) {
	rng := rand.New(rand.NewSource(1))
	seen := map[string]bool{}
	for i := 0; i < 2000; i++ {
		seen[Mission(TriggerIdle, 3, 0, rng)] = true
		seen[Mission(TriggerLock, 3, 0, rng)] = true
		seen[Mission(TriggerClear, 3, 1, rng)] = true
	}
	for _, want := range []string{
		"GRAVITY REMAINS MOSTLY LEGAL",
		"TETROMINO INJECTION SUCCESSFUL",
		"STRUCTURAL VIBES: QUESTIONABLE",
		"LOCAL UNIVERSE STABLE*",
		"MOON NOTIFIED",
		"ORBITAL OSHA HAS ENTERED THE CHAT",
		"WE HAVE EXCEEDED THE RECOMMENDED NUMBER OF BLOCKS",
		"PHYSICS TEAM SAYS KEEP GOING",
	} {
		if !seen[want] {
			t.Errorf("never produced the pinned line %q", want)
		}
	}
}

func TestOptionalDetailTriggersUseTheirPinnedLines(t *testing.T) {
	rng := rand.New(rand.NewSource(1))
	cases := map[Trigger]string{
		TriggerKineticRod: "KINETIC ROD DEPLOYED",
		TriggerHoldO:      "CUBE ADJACENT OBJECT SECURED",
		TriggerScoreRoll:  "NUMBER BECAME BIGGER",
		TriggerLongIdle:   "CAPTAIN?",
	}
	for tr, want := range cases {
		if got := Mission(tr, 1, 0, rng); !strings.Contains(got, want) {
			t.Errorf("Mission(%d) = %q, want it to contain %q", tr, got, want)
		}
	}
	rare := Mission(TriggerRare, 1, 0, rng)
	if !strings.Contains(rare, "TERMINAL") {
		t.Errorf("rare line = %q, want the terminal joke", rare)
	}
}

func TestQuadBannerDrawsFromAllFourSpecBanners(t *testing.T) {
	rng := rand.New(rand.NewSource(2))
	seen := map[string]bool{}
	for i := 0; i < 500; i++ {
		seen[QuadBanner(rng)] = true
	}
	for _, want := range []string{
		"✦ EVENT HORIZON ✦",
		"QUADRUPLE COSMIC INCIDENT",
		"FOUR ROWS HAVE LEFT THE CHAT",
		"SPACE-TIME HAS FILED A COMPLAINT",
	} {
		if !seen[want] {
			t.Errorf("QuadBanner never returned %q", want)
		}
	}
}

func TestLevelUpSubtitlesAreTheSpecThree(t *testing.T) {
	rng := rand.New(rand.NewSource(3))
	seen := map[string]bool{}
	for i := 0; i < 500; i++ {
		seen[LevelUpSubtitle(rng)] = true
	}
	for _, want := range []string{
		"GRAVITY TAX INCREASED",
		"LOCAL PHYSICS UPDATED WITHOUT CONSENT",
		"PLEASE SECURE ALL LOOSE TETROMINOES",
	} {
		if !seen[want] {
			t.Errorf("LevelUpSubtitle never returned %q", want)
		}
	}
}

func TestComboLineEscalatesWithTheNumber(t *testing.T) {
	cases := map[int]string{
		5: "COMBO 5 // UNAUTHORIZED ORBITAL MANEUVER",
		6: "COMBO 6 // STRUCTURAL REALITY FAILURE",
		7: "COMBO 7 // NASA DENIES EVERYTHING",
	}
	for combo, want := range cases {
		if got := ComboLine(combo); got != want {
			t.Errorf("ComboLine(%d) = %q, want %q", combo, got, want)
		}
	}
	if got := ComboLine(9); !strings.HasPrefix(got, "COMBO 9 //") {
		t.Errorf("ComboLine(9) = %q, want a COMBO 9 prefix", got)
	}
	if got := ComboLine(1); got != "" {
		t.Errorf("ComboLine(1) = %q, want empty: a lone clear is not a combo", got)
	}
}

func TestGameOverSubtitleIsPinned(t *testing.T) {
	if got := GameOverSubtitle(); got != "CAUSE: EXCESSIVE GEOMETRY" {
		t.Fatalf("GameOverSubtitle() = %q", got)
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/flavor/ -v`
Expected: FAIL — package does not exist.

- [ ] **Step 3: Implement `flavor/messages.go`**

Tables of strings per trigger; `Mission` picks with `rng.Intn`. `TriggerKineticRod`, `TriggerHoldO`, `TriggerScoreRoll`, `TriggerLongIdle`, and `TriggerRare` each have exactly the one pinned line from §45.

- [ ] **Step 4: Run it to verify it passes**

Run: `go test ./internal/flavor/ -v`
Expected: PASS (7 tests).

- [ ] **Step 5: Write the failing mission-channel test**

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func TestMissionStartsWithAMessageAndKeepsIt(t *testing.T) {
	w := worldAt(80, 30)
	first := w.Mission()
	if first == "" {
		t.Fatal("mission channel is empty at startup")
	}
	w.Update(100 * time.Millisecond)
	if w.Mission() != first {
		t.Fatal("the message changed after 100ms; §27 says give them time to breathe")
	}
}

func TestMessagesDoNotChangeMoreOftenThanTheCooldown(t *testing.T) {
	w := worldAt(80, 30)
	changes := 0
	last := w.Mission()
	for i := 0; i < 625; i++ { // 625 x 16ms = 10s
		w.Observe([]game.Event{{Kind: game.EventPieceLocked, Piece: game.Piece{Kind: game.T}}})
		w.Update(16 * time.Millisecond)
		if m := w.Mission(); m != last {
			changes++
			last = m
		}
	}
	maxChanges := int(10*time.Second/MissionCooldown) + 1
	if changes > maxChanges {
		t.Fatalf("the channel changed %d times in 10s; the %v cooldown allows at most %d",
			changes, MissionCooldown, maxChanges)
	}
	if changes == 0 {
		t.Fatal("the channel never changed across 10s of locks")
	}
}

func TestABigEventPreemptsTheCooldown(t *testing.T) {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventPieceLocked}})
	w.Update(50 * time.Millisecond)
	before := w.Mission()
	w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
	if w.Mission() == before {
		t.Fatal("a four-line clear did not preempt the current message")
	}
}

func TestMissionIsEmptyWhenFXAreDisabled(t *testing.T) {
	w := NewWorld(1, Config{Enabled: false})
	w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{21}}})
	if got := w.Mission(); got != "" {
		t.Fatalf("Mission() = %q with FX off, want empty", got)
	}
}
```

- [ ] **Step 6: Run it to verify it fails**

Run: `go test ./internal/fx/ -run TestMission -run 'TestMission|TestMessages|TestABigEvent' -v`
Expected: FAIL — undefined: `Mission`, `MissionCooldown`.

- [ ] **Step 7: Implement the mission channel and render the line**

`World` holds `mission string`, `missionAge time.Duration`, and `missionPriority int`. A new message is accepted when its priority exceeds the current one, or when `missionAge >= MissionCooldown`. Priorities, low to high: idle, lock, clear, combo, level, quad. `Frame` uses `s.FX.Mission()` when `s.Mission` is empty, and prefixes the line with `☄ MISSION CONTROL: ` (§27; ASCII mode uses `>`).

- [ ] **Step 8: Run the suite to verify it passes**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
gofmt -l . && git add internal/flavor/ internal/fx/ internal/render/
git commit -m "feat(flavor): mission control channel with cooldown and priorities"
```

---

### Task 8: Hard-drop impact

**Files:**
- Modify: `internal/fx/world.go`, `internal/render/board.go`
- Test: `internal/fx/impact_test.go`

**Interfaces:**
- Produces:

```go
const ShakeDuration = 80 * time.Millisecond
var ShakePattern = [5][2]int{{0, 1}, {-1, 0}, {1, 0}, {0, -1}, {0, 0}} // §18, deterministic
func (w *World) ShakeOffset() (dx, dy int)
func (w *World) Shake(strength float64) // strength scales duration, never amplitude
```

§18's four parts: the vertical ion trail (Task 5 already emits it), impact particles from the contact area with glyphs `· * ✦ +`, ~80 ms of one-cell screen shake stepping through `ShakePattern`, and a border flash (Task 6's `FlashBorder`). Shake is suppressed entirely under `--reduced-motion` (§49.5).

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"strings"
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func hardDrop(w *World, dist int) {
	w.Observe([]game.Event{{Kind: game.EventPieceHardDropped, Distance: dist,
		Piece: game.Piece{Kind: game.I, Rotation: 1, X: 4, Y: 6}}})
}

func TestHardDropEmitsImpactDebris(t *testing.T) {
	w := worldAt(80, 30)
	before := w.ParticleCount()
	hardDrop(w, 12)
	if w.ParticleCount() <= before {
		t.Fatal("a hard drop emitted no particles")
	}
	glyphs := ""
	for _, m := range w.Marks(nil) {
		if m.Role == RoleImpact {
			glyphs += string(m.Glyph)
		}
	}
	if glyphs == "" {
		t.Fatal("no RoleImpact marks")
	}
	for _, g := range glyphs {
		if !strings.ContainsRune("·*✦+", g) {
			t.Errorf("impact glyph %q is not one of §18's four", g)
		}
	}
}

func TestHardDropShakesForAboutEightyMilliseconds(t *testing.T) {
	w := worldAt(80, 30)
	hardDrop(w, 12)
	if dx, dy := w.ShakeOffset(); dx == 0 && dy == 0 {
		t.Fatal("no shake right after impact")
	}
	w.Update(ShakeDuration + 20*time.Millisecond)
	if dx, dy := w.ShakeOffset(); dx != 0 || dy != 0 {
		t.Fatalf("still shaking after %v: %d,%d", ShakeDuration, dx, dy)
	}
}

func TestShakeNeverExceedsOneCell(t *testing.T) {
	w := worldAt(80, 30)
	for i := 0; i < 20; i++ {
		hardDrop(w, 20)
		w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
		for j := 0; j < 12; j++ {
			w.Update(8 * time.Millisecond)
			dx, dy := w.ShakeOffset()
			if dx < -1 || dx > 1 || dy < -1 || dy > 1 {
				t.Fatalf("shake offset %d,%d exceeds one cell (§44)", dx, dy)
			}
		}
	}
}

func TestShakeWalksTheDeterministicPattern(t *testing.T) {
	run := func() [][2]int {
		w := worldAt(80, 30)
		hardDrop(w, 12)
		var seq [][2]int
		for i := 0; i < 10; i++ {
			dx, dy := w.ShakeOffset()
			seq = append(seq, [2]int{dx, dy})
			w.Update(10 * time.Millisecond)
		}
		return seq
	}
	a, b := run(), run()
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("shake is not deterministic: step %d %v vs %v", i, a[i], b[i])
		}
	}
	// The offsets must come from the pinned pattern.
	for _, off := range a {
		var ok bool
		for _, p := range ShakePattern {
			if off == p {
				ok = true
			}
		}
		if !ok {
			t.Fatalf("offset %v is not in ShakePattern", off)
		}
	}
}

func TestReducedMotionSuppressesShakeButKeepsDebris(t *testing.T) {
	w := NewWorld(5, Config{Enabled: true, ReducedMotion: true})
	w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	hardDrop(w, 14)
	if dx, dy := w.ShakeOffset(); dx != 0 || dy != 0 {
		t.Fatalf("reduced motion still shook: %d,%d", dx, dy)
	}
	var sawImpact bool
	for _, m := range w.Marks(nil) {
		if m.Role == RoleImpact {
			sawImpact = true
		}
	}
	if !sawImpact {
		t.Error("reduced motion removed impact particles; §49.5 keeps them")
	}
}

func TestHardDropFlashesTheBorder(t *testing.T) {
	w := worldAt(80, 30)
	hardDrop(w, 14)
	if w.BorderState().Energy <= 0 {
		t.Fatal("a hard drop did not flash the border")
	}
}

func TestZeroDistanceHardDropStillReacts(t *testing.T) {
	w := worldAt(80, 30)
	hardDrop(w, 0)
	if w.ParticleCount() == 0 {
		t.Fatal("a zero-distance hard drop produced nothing; the piece still hit something")
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/fx/ -run 'TestHardDrop|TestShake|TestReducedMotion|TestZeroDistance' -v`
Expected: FAIL — `ShakeOffset` always returns 0,0; no impact particles.

- [ ] **Step 3: Implement impact, shake, and the render offset**

On `EventPieceHardDropped`: `EmitBurst` from the bottom edge of the landed piece with an upward bias (`VY` negative for most of the burst) and glyphs cycled from `· * ✦ +`; `FlashBorder(0.5 + 0.4×min(distance/20, 1))`; `Shake(0.6 + 0.4×min(distance/20, 1))`.

`Shake` sets a remaining duration of `ShakeDuration × strength`, and returns immediately under `ReducedMotion`. `ShakeOffset` maps elapsed shake time to a `ShakePattern` index (`index = int(elapsed / (ShakeDuration/5))`, clamped) — deterministic and never more than one cell.

`DrawBoard` adds the offset to the board rect before painting, and clamps the shifted rect so it stays inside the canvas (a board at the terminal edge cannot shift off it).

- [ ] **Step 4: Run the suite to verify it passes**

Run: `go test ./internal/fx/ ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/fx/ internal/render/
git commit -m "feat(fx): hard-drop impact with debris, one-cell shake, border flash"
```

---

### Task 9: Line-clear supernova

**Files:**
- Modify: `internal/fx/world.go`
- Test: `internal/fx/clear_test.go`

**Interfaces:**
- Produces:

```go
const ClearDuration = 220 * time.Millisecond // §19
type clearAnim struct { rows []int; age time.Duration }
func (w *World) ClearAnimActive() bool
```

Three phases across 220 ms (§19): A critical mass (0–70 ms, `▓` speckle across the row), B supernova (70–150 ms, a bright front moving from the row center outward with `✦` at the front), C collapse (150–220 ms, the row becomes debris particles whose horizontal velocity is proportional to distance from center).

Because gameplay already collapsed the board (§19: "gameplay state may already know the result"), the animation is an overlay at the cleared rows' screen positions — the cells beneath have already moved. That is the intended behavior, not a bug to fix.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func clear(w *World, rows ...int) {
	w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: rows}})
}

func TestClearAnimationRunsForAboutTwoHundredTwentyMilliseconds(t *testing.T) {
	w := worldAt(80, 30)
	clear(w, 21)
	if !w.ClearAnimActive() {
		t.Fatal("no clear animation started")
	}
	w.Update(200 * time.Millisecond)
	if !w.ClearAnimActive() {
		t.Fatal("the animation ended before 220ms")
	}
	w.Update(40 * time.Millisecond)
	if w.ClearAnimActive() {
		t.Fatal("the animation outlived 240ms")
	}
}

func TestClearAnimationPassesThroughThreeVisualPhases(t *testing.T) {
	w := worldAt(80, 30)
	clear(w, 21)
	snapshot := func() string {
		s := ""
		for _, m := range w.Marks(nil) {
			if m.Layer == LayerBoard && m.Role != RolePiece {
				s += string(m.Glyph)
			}
		}
		return s
	}
	a := snapshot()
	w.Update(90 * time.Millisecond)
	b := snapshot()
	w.Update(80 * time.Millisecond)
	c := snapshot()
	if a == b || b == c || a == c {
		t.Fatalf("phases are not distinct:\nA %q\nB %q\nC %q", a, b, c)
	}
}

func TestSupernovaSpreadsOutwardFromTheRowCenter(t *testing.T) {
	w := worldAt(80, 30)
	clear(w, 21)
	spread := func() int {
		minX, maxX := 1<<30, -(1 << 30)
		for _, m := range w.Marks(nil) {
			if m.Layer != LayerBoard || m.Role == RolePiece {
				continue
			}
			if m.X < minX {
				minX = m.X
			}
			if m.X > maxX {
				maxX = m.X
			}
		}
		if maxX < minX {
			return 0
		}
		return maxX - minX
	}
	w.Update(80 * time.Millisecond)
	early := spread()
	w.Update(50 * time.Millisecond)
	if late := spread(); late < early {
		t.Fatalf("the front contracted: %d -> %d", early, late)
	}
}

func TestCollapseDebrisInheritsHorizontalVelocityFromItsPosition(t *testing.T) {
	w := worldAt(80, 30)
	clear(w, 21)
	w.Update(200 * time.Millisecond) // into phase C
	center := float64(w.Board.X + w.Board.W/2)
	var leftGoesLeft, rightGoesRight bool
	positions := map[int]bool{}
	for _, m := range w.Marks(nil) {
		if m.Role == RoleDebris {
			positions[m.X] = true
		}
	}
	w.Update(60 * time.Millisecond)
	for _, m := range w.Marks(nil) {
		if m.Role != RoleDebris {
			continue
		}
		if float64(m.X) < center-3 {
			leftGoesLeft = true
		}
		if float64(m.X) > center+3 {
			rightGoesRight = true
		}
	}
	if !leftGoesLeft || !rightGoesRight {
		t.Fatalf("debris did not fan outward: left=%v right=%v", leftGoesLeft, rightGoesRight)
	}
	_ = positions
}

func TestFourRowClearAnimatesAllFourRows(t *testing.T) {
	w := worldAt(80, 30)
	clear(w, 18, 19, 20, 21)
	w.Update(40 * time.Millisecond)
	rows := map[int]bool{}
	for _, m := range w.Marks(nil) {
		if m.Layer == LayerBoard && m.Role != RolePiece {
			rows[m.Y] = true
		}
	}
	if len(rows) < 4 {
		t.Fatalf("only %d rows animating, want 4", len(rows))
	}
}

func TestClearMarksStayInsideTheBoardRect(t *testing.T) {
	w := worldAt(80, 30)
	clear(w, 18, 19, 20, 21)
	for i := 0; i < 20; i++ {
		w.Update(16 * time.Millisecond)
		for _, m := range w.Marks(nil) {
			if m.Layer != LayerBoard {
				continue
			}
			if m.X < w.Board.X || m.X >= w.Board.X+w.Board.W || m.Y < w.Board.Y || m.Y >= w.Board.Y+w.Board.H {
				t.Fatalf("board-layer clear mark at %d,%d escaped %+v", m.X, m.Y, w.Board)
			}
		}
	}
}

func TestClearRowsOutsideTheVisibleRangeAreIgnored(t *testing.T) {
	w := worldAt(80, 30)
	clear(w, 0, 1) // hidden spawn rows: not visible, must not produce marks above the board
	w.Update(16 * time.Millisecond)
	for _, m := range w.Marks(nil) {
		if m.Layer == LayerBoard && m.Y < w.Board.Y {
			t.Fatalf("a mark for a hidden row landed at y=%d, above the board at %d", m.Y, w.Board.Y)
		}
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/fx/ -run 'TestClear|TestSupernova|TestCollapse|TestFourRow' -v`
Expected: FAIL — undefined: `ClearAnimActive`, `ClearDuration`.

- [ ] **Step 3: Implement the clear animation and wire `updateClears`**

Convert each cleared board row to its screen row through `w.Board`, skipping rows above `game.HiddenRows`. Phase glyph ramps: A uses `▓` and `█` alternating by column parity and age; B draws a bright front at `center ± progress × halfWidth` with `✦` at the front and `██`/`▓▓`/`░░` trailing inward; C converts each surviving column into a debris particle with `VX = k × (x - center)` and a small upward `VY`. ASCII mode uses `# = - .` for the ramp and `* + .` for debris.

- [ ] **Step 4: Run the suite to verify it passes**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/fx/ && git commit -m "feat(fx): three-phase supernova line-clear animation"
```

---

### Task 10: Shockwaves

**Files:**
- Modify: `internal/fx/world.go`
- Test: `internal/fx/shock_test.go`

**Interfaces:**
- Produces: `const ShockDuration = 300 * time.Millisecond`, `func (w *World) Shockwave(cx, cy float64)`, `func (w *World) ShockCount() int`.

Rings are faked with the glyph groups from §24 (`· ○ ◌ ◯`; ASCII `. o O 0`) arranged around an approximate ellipse — terminal cells are about twice as tall as wide, so the horizontal radius is twice the vertical. Used sparingly: only four-line clears and combo ≥ 5 trigger one, at most one at a time. Suppressed under `--reduced-motion` (§49.5).

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func TestShockwaveExpandsThenExpires(t *testing.T) {
	w := worldAt(80, 30)
	w.Shockwave(40, 15)
	radius := func() int {
		max := 0
		for _, m := range w.Marks(nil) {
			if m.Role != RoleShock {
				continue
			}
			if d := abs(m.X - 40); d > max {
				max = d
			}
		}
		return max
	}
	early := radius()
	w.Update(120 * time.Millisecond)
	if late := radius(); late <= early {
		t.Fatalf("ring did not expand: %d -> %d", early, late)
	}
	w.Update(ShockDuration)
	if w.ShockCount() != 0 {
		t.Fatalf("ShockCount = %d after %v, want 0", w.ShockCount(), ShockDuration)
	}
}

func TestShockwaveIsWiderThanTallForSquareLookingCells(t *testing.T) {
	w := worldAt(80, 30)
	w.Shockwave(40, 15)
	w.Update(150 * time.Millisecond)
	var maxDX, maxDY int
	for _, m := range w.Marks(nil) {
		if m.Role != RoleShock {
			continue
		}
		if d := abs(m.X - 40); d > maxDX {
			maxDX = d
		}
		if d := abs(m.Y - 15); d > maxDY {
			maxDY = d
		}
	}
	if maxDY == 0 || maxDX <= maxDY {
		t.Fatalf("ring is %dx%d; terminal cells need a wider-than-tall ellipse", maxDX, maxDY)
	}
}

func TestShockwaveGlyphsComeFromTheSpecSet(t *testing.T) {
	w := worldAt(80, 30)
	w.Shockwave(40, 15)
	for i := 0; i < 15; i++ {
		for _, m := range w.Marks(nil) {
			if m.Role == RoleShock && !containsRune("·○◌◯", m.Glyph) {
				t.Fatalf("shock glyph %q is not one of §24's four", m.Glyph)
			}
		}
		w.Update(20 * time.Millisecond)
	}
}

func TestOnlyBigEventsTriggerShockwaves(t *testing.T) {
	single := worldAt(80, 30)
	single.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{21}}})
	if single.ShockCount() != 0 {
		t.Error("a single-line clear triggered a shockwave; §24 says use sparingly")
	}
	quad := worldAt(80, 30)
	quad.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
	if quad.ShockCount() == 0 {
		t.Error("a four-line clear did not trigger a shockwave")
	}
	combo := worldAt(80, 30)
	combo.Observe([]game.Event{{Kind: game.EventComboChanged, Value: 5}})
	if combo.ShockCount() == 0 {
		t.Error("combo 5 did not trigger a shockwave")
	}
}

func TestShockwavesDoNotStack(t *testing.T) {
	w := worldAt(80, 30)
	for i := 0; i < 10; i++ {
		w.Shockwave(40, 15)
	}
	if w.ShockCount() > 1 {
		t.Fatalf("ShockCount = %d, want at most 1", w.ShockCount())
	}
}

func TestReducedMotionSuppressesShockwaves(t *testing.T) {
	w := NewWorld(1, Config{Enabled: true, ReducedMotion: true})
	w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	w.Shockwave(40, 15)
	w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
	if w.ShockCount() != 0 {
		t.Fatalf("ShockCount = %d under reduced motion, want 0", w.ShockCount())
	}
}
```

Add small `abs(int) int` and `containsRune(string, rune) bool` helpers to the fx test files.

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/fx/ -run TestShock -run 'TestShock|TestOnlyBig|TestReducedMotionSuppressesShock' -v`
Expected: FAIL — undefined: `Shockwave`, `ShockCount`.

- [ ] **Step 3: Implement shockwaves**

Store at most one ring: `{cx, cy, age}`. `Marks` walks 24 angles, computing `x = cx + 2·r·cos θ` and `y = cy + r·sin θ` with `r = maxR × age/ShockDuration`, and picks the glyph by radius bucket. Brightness fades with age. `Shockwave` returns immediately under `ReducedMotion` or when a ring is already live.

- [ ] **Step 4: Run the suite to verify it passes**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/fx/ && git commit -m "feat(fx): radial shockwave rings for major events"
```

---

### Task 11: Hyperdrive

**Files:**
- Modify: `internal/fx/world.go`, `internal/fx/starfield.go`
- Test: `internal/fx/hyper_test.go`

**Interfaces:**
- Produces:

```go
type HyperCause uint8
const (HyperQuad HyperCause = iota; HyperCombo; HyperHighScore)
func (w *World) Hyperdrive(cause HyperCause)
func (w *World) HyperFactor() float64 // 1.0 at rest; 0 during the pause beat
func (w *World) HyperActive() bool
func (w *World) NoteScore(score int) // app calls this; crossing the session best triggers HyperHighScore
```

§16's timeline, measured from the trigger: 0 ms stars pause (factor ~0), 50 ms stretch, 100 ms accelerate violently, 500 ms peak, 800 ms decay begins, 1100 ms back to normal. `SpeedMultiplier` becomes `levelPart × HyperFactor()`. Under `--reduced-motion` the acceleration is suppressed: `HyperFactor` stays 1.0 (§49.5).

Since §2 forbids persistence, "new high score" means the best score seen in this process since launch. The app owns that number and calls `NoteScore`.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func TestHyperdriveFollowsTheSpecTimeline(t *testing.T) {
	w := worldAt(80, 30)
	rest := w.HyperFactor()
	if rest != 1.0 {
		t.Fatalf("resting HyperFactor = %v, want 1.0", rest)
	}
	w.Hyperdrive(HyperQuad)
	if f := w.HyperFactor(); f >= 1.0 {
		t.Errorf("at 0ms stars must pause: factor = %v, want below 1", f)
	}
	w.Update(120 * time.Millisecond)
	accel := w.HyperFactor()
	if accel <= 1.0 {
		t.Errorf("at 120ms stars must be accelerating: factor = %v", accel)
	}
	w.Update(380 * time.Millisecond) // ~500ms: peak
	peak := w.HyperFactor()
	if peak < accel {
		t.Errorf("peak factor %v is below the 120ms factor %v", peak, accel)
	}
	w.Update(400 * time.Millisecond) // ~900ms: decaying
	if decay := w.HyperFactor(); decay >= peak {
		t.Logf("decay %v below peak %v: good", decay, peak)
	} else {
		t.Errorf("factor did not decay: %v vs peak %v", decay, peak)
	}
	w.Update(400 * time.Millisecond) // ~1300ms: over
	if w.HyperActive() {
		t.Error("hyperdrive still active past 1100ms")
	}
	if f := w.HyperFactor(); f != 1.0 {
		t.Errorf("post-hyperdrive factor = %v, want exactly 1.0", f)
	}
}

func TestHyperdriveActuallyMovesTheStarsFaster(t *testing.T) {
	measure := func(hyper bool) float64 {
		w := worldAt(80, 30)
		if hyper {
			w.Hyperdrive(HyperQuad)
			w.Update(150 * time.Millisecond) // past the pause, into acceleration
		}
		sum := func() float64 {
			total := 0.0
			for _, m := range w.Marks(nil) {
				if m.Role == RoleStarNear {
					total += float64(m.Y)
				}
			}
			return total
		}
		before := sum()
		w.Update(100 * time.Millisecond)
		return sum() - before
	}
	if measure(true) <= measure(false) {
		t.Fatal("hyperdrive did not speed up the starfield")
	}
}

func TestQuadClearAndBigComboTriggerHyperdrive(t *testing.T) {
	quad := worldAt(80, 30)
	quad.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
	if !quad.HyperActive() {
		t.Error("a four-line clear did not trigger hyperdrive")
	}
	combo := worldAt(80, 30)
	combo.Observe([]game.Event{{Kind: game.EventComboChanged, Value: 5}})
	if !combo.HyperActive() {
		t.Error("combo 5 did not trigger hyperdrive")
	}
	small := worldAt(80, 30)
	small.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{21}}, {Kind: game.EventComboChanged, Value: 2}})
	if small.HyperActive() {
		t.Error("a single clear at combo 2 triggered hyperdrive; §16 reserves it for big events")
	}
}

func TestNoteScoreTriggersHyperdriveOnlyOnANewSessionBest(t *testing.T) {
	w := worldAt(80, 30)
	// The first game of a session only establishes the baseline. Firing
	// hyperdrive on the first points anyone ever scores would fire it on
	// every player's first hard drop, which is not what §16 means by
	// "new high score".
	w.NoteScore(1000)
	if w.HyperActive() {
		t.Fatal("the first score of the session triggered hyperdrive")
	}
	w.NoteScore(500) // below the best
	if w.HyperActive() {
		t.Fatal("a lower score triggered hyperdrive")
	}
	w.NoteScore(1001) // beats the established best
	if !w.HyperActive() {
		t.Fatal("beating the session best did not trigger hyperdrive")
	}
}

func TestRetriggeringHyperdriveRestartsRatherThanStacking(t *testing.T) {
	w := worldAt(80, 30)
	w.Hyperdrive(HyperQuad)
	w.Update(600 * time.Millisecond)
	w.Hyperdrive(HyperQuad)
	if f := w.HyperFactor(); f >= 1.0 {
		t.Fatalf("retrigger did not restart the timeline: factor = %v, want the pause beat", f)
	}
	w.Update(2 * time.Second)
	if w.HyperActive() {
		t.Fatal("hyperdrive outlived a restarted timeline")
	}
}

func TestReducedMotionKeepsTheFactorAtOne(t *testing.T) {
	w := NewWorld(1, Config{Enabled: true, ReducedMotion: true})
	w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
	w.Hyperdrive(HyperQuad)
	for i := 0; i < 100; i++ {
		if f := w.HyperFactor(); f != 1.0 {
			t.Fatalf("reduced motion factor = %v at step %d, want 1.0", f, i)
		}
		w.Update(16 * time.Millisecond)
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/fx/ -run 'TestHyper|TestQuadClear|TestNoteScore|TestRetriggering|TestReducedMotionKeeps' -v`
Expected: FAIL — undefined: `Hyperdrive`, `HyperFactor`.

- [ ] **Step 3: Implement hyperdrive**

Piecewise-linear factor over the §16 keyframes: `{0ms: 0.05, 50ms: 0.4, 100ms: 4.0, 500ms: 9.0, 800ms: 6.0, 1100ms: 1.0}`, interpolated. `HyperActive` is true while age < 1100 ms. `Hyperdrive` resets age to 0 (restart, never stack) and also bumps star density per §20 by temporarily adding near stars — cap that so `StarCount` still returns to its baseline when the burst ends.

`NoteScore` keeps a `best int` on the world. When `score > best`, it records the new best; it triggers `Hyperdrive(HyperHighScore)` only when the old best was already above zero. That one condition is the difference between a celebration and a strobe light on every player's first drop.

- [ ] **Step 4: Run the suite to verify it passes**

Run: `go test ./internal/fx/ -v`
Expected: PASS. `TestStarCountIsStableAcrossLongRuns` from Task 3 must still pass — the density bump has to be temporary.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/fx/ && git commit -m "feat(fx): hyperdrive timeline with star density bump"
```

---

### Task 12: Four-line sequence and banners

**Files:**
- Modify: `internal/fx/world.go`, `internal/render/render.go`, `internal/render/hud.go`
- Test: `internal/fx/banner_test.go`, `internal/render/banner_test.go`

**Interfaces:**
- Produces:

```go
// fx
const BannerDuration = 700 * time.Millisecond // §20
func (w *World) Banner() (text string, bright float64, ok bool)
func (w *World) HUDPulse() float64 // 0..1, drives the HUD flash and combo pulse
// render
func DrawBanner(c *Canvas, text string, bright float64, l Layout, p Palette)
```

A four-line clear triggers everything at once (§20): hyperdrive, a bigger shake, the border pulse, a particle eruption, the HUD flash, the temporary star density increase, and a 700 ms banner from `flavor.QuadBanner`. The banner must not block input — it is drawn, nothing more.

- [ ] **Step 1: Write the failing test**

```go
// internal/fx/banner_test.go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func TestQuadClearTriggersEverythingAtOnce(t *testing.T) {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
	if !w.HyperActive() {
		t.Error("no hyperdrive")
	}
	if dx, dy := w.ShakeOffset(); dx == 0 && dy == 0 {
		t.Error("no shake")
	}
	if w.BorderState().Energy <= 0 {
		t.Error("no border pulse")
	}
	if w.ParticleCount() == 0 {
		t.Error("no particle eruption")
	}
	if w.HUDPulse() <= 0 {
		t.Error("no HUD flash")
	}
	if w.ShockCount() == 0 {
		t.Error("no shockwave")
	}
	if _, _, ok := w.Banner(); !ok {
		t.Error("no banner")
	}
}

func TestQuadShakeIsLongerThanAPlainHardDropButStillOneCell(t *testing.T) {
	drop := worldAt(80, 30)
	drop.Observe([]game.Event{{Kind: game.EventPieceHardDropped, Distance: 4, Piece: game.Piece{Kind: game.O, X: 4, Y: 18}}})
	quad := worldAt(80, 30)
	quad.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
	shakeFor := func(w *World) time.Duration {
		var total time.Duration
		for i := 0; i < 60; i++ {
			if dx, dy := w.ShakeOffset(); dx != 0 || dy != 0 {
				total += 8 * time.Millisecond
			}
			w.Update(8 * time.Millisecond)
		}
		return total
	}
	if shakeFor(quad) <= shakeFor(drop) {
		t.Error("§20 asks for a larger shake on a four-line clear")
	}
}

func TestBannerLastsSevenHundredMilliseconds(t *testing.T) {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
	text, _, ok := w.Banner()
	if !ok || text == "" {
		t.Fatal("banner missing")
	}
	w.Update(650 * time.Millisecond)
	if _, _, ok := w.Banner(); !ok {
		t.Fatal("banner vanished before 700ms")
	}
	w.Update(100 * time.Millisecond)
	if _, _, ok := w.Banner(); ok {
		t.Fatal("banner outlived 750ms")
	}
}

func TestBannerTextIsOneOfTheSpecFour(t *testing.T) {
	allowed := map[string]bool{
		"✦ EVENT HORIZON ✦":                true,
		"QUADRUPLE COSMIC INCIDENT":        true,
		"FOUR ROWS HAVE LEFT THE CHAT":     true,
		"SPACE-TIME HAS FILED A COMPLAINT": true,
	}
	for seed := int64(0); seed < 30; seed++ {
		w := NewWorld(seed, Config{Enabled: true})
		w.SetGeometry(Rect{0, 0, 80, 30}, Rect{10, 3, 20, 20})
		w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
		text, _, _ := w.Banner()
		if !allowed[text] {
			t.Fatalf("banner %q is not one of §20's four", text)
		}
	}
}

func TestOneTwoAndThreeLineClearsDoNotBanner(t *testing.T) {
	for _, rows := range [][]int{{21}, {20, 21}, {19, 20, 21}} {
		w := worldAt(80, 30)
		w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: rows}})
		if _, _, ok := w.Banner(); ok {
			t.Errorf("clearing %d rows produced a banner", len(rows))
		}
	}
}

func TestHUDPulseDecaysToZero(t *testing.T) {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
	peak := w.HUDPulse()
	w.Update(300 * time.Millisecond)
	mid := w.HUDPulse()
	if !(mid < peak) {
		t.Fatalf("HUD pulse did not decay: %v -> %v", peak, mid)
	}
	w.Update(3 * time.Second)
	if got := w.HUDPulse(); got != 0 {
		t.Fatalf("HUDPulse = %v after 3s, want 0", got)
	}
}
```

```go
// internal/render/banner_test.go
package render

import (
	"strings"
	"testing"
	"time"

	"cosmic-tetris/internal/fx"
	"cosmic-tetris/internal/game"
)

func TestFrameShowsTheBannerWithoutBreakingLayout(t *testing.T) {
	g := game.New(1)
	l := Compute(80, 30)
	w := liveWorld(80, 30, l)
	w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
	w.Update(50 * time.Millisecond)
	out := stripANSI(Frame(Scene{Game: g, Mode: ModeFull, Width: 80, Height: 30, FX: w}))
	text, _, _ := w.Banner()
	if !strings.Contains(out, text) {
		t.Fatalf("banner %q missing from the frame:\n%s", text, out)
	}
	rows := strings.Split(out, "\n")
	if len(rows) != 30 {
		t.Fatalf("banner changed the row count to %d", len(rows))
	}
	for i, r := range rows {
		if len([]rune(r)) != 80 {
			t.Fatalf("banner made row %d %d runes wide", i, len([]rune(r)))
		}
	}
}

func TestBannerFitsInASmallTerminal(t *testing.T) {
	g := game.New(1)
	l := Compute(40, 24)
	w := liveWorld(40, 24, l)
	w.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}}})
	w.Update(50 * time.Millisecond)
	rows := strings.Split(stripANSI(Frame(Scene{Game: g, Mode: ModeFull, Width: 40, Height: 24, FX: w})), "\n")
	for i, r := range rows {
		if len([]rune(r)) != 40 {
			t.Fatalf("row %d is %d runes at 40 columns; the banner must clip", i, len([]rune(r)))
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestQuad|TestBanner|TestOneTwo|TestHUDPulse' -v && go test ./internal/render/ -run TestBanner -v && go test ./internal/render/ -run TestFrameShowsTheBanner -v`
Expected: FAIL — undefined: `Banner`, `HUDPulse`, `DrawBanner`.

- [ ] **Step 3: Implement the quad sequence and banner rendering**

In `Observe`, a `LinesCleared` with `len(Rows) == 4` fires: `Hyperdrive(HyperQuad)`, `Shake(2.0)` (longer, still one cell), `FlashBorder(1.0)`, a large `EmitBurst` at the board center, `Shockwave` at the board center, `HUDPulse = 1.0`, a temporary star density bump, and `banner = flavor.QuadBanner(w.rng)` with age 0.

`DrawBanner` centers the text over the board, clipping to the layout width, and uses `Palette.MarkStyle(fx.RoleBanner, 0, bright)`. `Frame` draws it at §37 step 10 — after HUD and screen FX, before mission control.

- [ ] **Step 4: Run the suite to verify it passes**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/fx/ internal/render/
git commit -m "feat(fx): four-line clear sequence with banner and HUD flash"
```

---

### Task 13: Combo escalation and the level-up notification

**Files:**
- Modify: `internal/fx/world.go`, `internal/render/hud.go`
- Test: `internal/fx/combo_test.go`

**Interfaces:**
- Produces: `func (w *World) Notice() (title, subtitle string, bright float64, ok bool)` for §22's level-up panel; combo escalation folded into `Observe`.

§21's ladder: combo 2 small sparks, combo 3 meteor particles, combo 4 the HUD begins pulsing, combo 5+ shockwave, hyperdrive, and a `flavor.ComboLine` on the mission channel. Effects intensify but readability is preserved — the escalation adds particles outside the board and pulse on the HUD, never marks over the board's occupied cells.

§22's notification slides away without pausing the game: title `GRAVITY ANOMALY DETECTED`, subtitle `LEVEL 08`-style, plus one of §22's three subtitles on the mission channel. Lifetime 1200 ms.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"strings"
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func comboAt(v int) *World {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventComboChanged, Value: v}})
	return w
}

func TestComboEscalatesParticleActivity(t *testing.T) {
	two := comboAt(2).ParticleCount()
	three := comboAt(3).ParticleCount()
	five := comboAt(5).ParticleCount()
	if two == 0 {
		t.Error("combo 2 produced no sparks")
	}
	if three <= two {
		t.Errorf("combo 3 (%d) is not more active than combo 2 (%d)", three, two)
	}
	if five <= three {
		t.Errorf("combo 5 (%d) is not more active than combo 3 (%d)", five, three)
	}
}

func TestComboOneAndZeroAreQuiet(t *testing.T) {
	for _, v := range []int{0, 1} {
		w := comboAt(v)
		if w.ParticleCount() != 0 {
			t.Errorf("combo %d emitted %d particles, want 0", v, w.ParticleCount())
		}
		if w.HUDPulse() != 0 {
			t.Errorf("combo %d pulsed the HUD", v)
		}
	}
}

func TestHUDPulsesFromComboFour(t *testing.T) {
	if comboAt(3).HUDPulse() != 0 {
		t.Error("combo 3 pulsed the HUD; §21 starts that at combo 4")
	}
	if comboAt(4).HUDPulse() <= 0 {
		t.Error("combo 4 did not pulse the HUD")
	}
}

func TestComboFivePutsItsLineOnTheMissionChannel(t *testing.T) {
	w := comboAt(5)
	if got := w.Mission(); !strings.Contains(got, "COMBO 5") {
		t.Fatalf("Mission() = %q, want the combo 5 line", got)
	}
}

func TestComboEscalationKeepsSomeMarksOutsideTheBoard(t *testing.T) {
	w := comboAt(7)
	for i := 0; i < 20; i++ {
		w.Update(16 * time.Millisecond)
		boardMarks := 0
		total := 0
		for _, m := range w.Marks(nil) {
			total++
			if m.Layer == LayerBoard {
				boardMarks++
			}
		}
		if total > 0 && boardMarks == total {
			t.Fatal("all combo marks are inside the board; readability is sacred (§21)")
		}
	}
}

func TestLevelUpShowsANoticeThatExpires(t *testing.T) {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventLevelChanged, Value: 8}})
	title, subtitle, _, ok := w.Notice()
	if !ok {
		t.Fatal("no level-up notice")
	}
	if title != "GRAVITY ANOMALY DETECTED" {
		t.Errorf("title = %q, want §22's wording", title)
	}
	if !strings.Contains(subtitle, "LEVEL") || !strings.Contains(subtitle, "08") {
		t.Errorf("subtitle = %q, want a zero-padded LEVEL 08", subtitle)
	}
	w.Update(1300 * time.Millisecond)
	if _, _, _, ok := w.Notice(); ok {
		t.Fatal("the notice outlived 1.3s")
	}
}

func TestLevelUpAlsoTalksToMissionControl(t *testing.T) {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventLevelChanged, Value: 8}})
	m := w.Mission()
	ok := false
	for _, want := range []string{"GRAVITY TAX INCREASED", "LOCAL PHYSICS UPDATED WITHOUT CONSENT", "PLEASE SECURE ALL LOOSE TETROMINOES"} {
		if strings.Contains(m, want) {
			ok = true
		}
	}
	if !ok {
		t.Fatalf("Mission() = %q, want one of §22's subtitles", m)
	}
}

func TestNoticeDoesNotPauseAnything(t *testing.T) {
	w := worldAt(80, 30)
	w.Observe([]game.Event{{Kind: game.EventLevelChanged, Value: 8}})
	starY := func() float64 {
		total := 0.0
		for _, m := range w.Marks(nil) {
			if m.Role == RoleStarMid {
				total += float64(m.Y)
			}
		}
		return total
	}
	before := starY()
	w.Update(300 * time.Millisecond)
	if starY() == before {
		t.Fatal("the starfield froze while a notice was up")
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/fx/ -run 'TestCombo|TestHUDPulses|TestLevelUp|TestNotice' -v`
Expected: FAIL — undefined: `Notice`; combo escalation absent.

- [ ] **Step 3: Implement combo escalation and the notice**

`Observe` on `EventComboChanged`: `Value >= 2` emits sparks at the board edges (screen layer) with count scaling as `4 × (Value - 1)`; `>= 3` switches glyphs to meteor `✦`/`*` with a horizontal drift; `>= 4` sets `HUDPulse = min(1, 0.3 + 0.15×Value)`; `>= 5` calls `Shockwave` and `Hyperdrive(HyperCombo)` and pushes `flavor.ComboLine(Value)`.

`Notice` holds `{title, subtitle, age}` for 1200 ms with brightness fading over the last 400 ms (§22's slide/fade). `DrawHUD` scales stat styling by `HUDPulse` when a world is present, and `Frame` draws the notice near the top of the board area.

- [ ] **Step 4: Run the suite to verify it passes**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/fx/ internal/render/
git commit -m "feat(fx): combo escalation ladder and level-up notification"
```

---

### Task 14: Wire effects into the app

**Files:**
- Modify: `internal/app/model.go`, `internal/app/update.go`, `cmd/cosmic-tetris/main.go`
- Test: `internal/app/fx_test.go`

**Interfaces:**
- Produces: `Model` gains `FX *fx.World` and `SessionBest int`; `New(opts)` constructs the world with an FX seed **derived independently of the game seed** (`opts.Seed ^ 0x5DEECE66` is fine, since the two generators must merely be separate, not unrelated) and `fx.Config{Enabled: !opts.NoFX, ReducedMotion: opts.ReducedMotion, ASCII: opts.Mode == render.ModeASCII}`.

- [ ] **Step 1: Write the failing test**

```go
package app

import (
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"
	"cosmic-tetris/internal/render"
)

func TestEveryGameEventReachesTheWorld(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	m = next.(Model)
	next, _ = m.Update(tea.KeyPressMsg{Code: ' ', Text: " "}) // hard drop
	m = next.(Model)
	if m.FX.ParticleCount() == 0 {
		t.Fatal("a hard drop produced no particles: events are not reaching the world")
	}
}

func TestTheWorldAdvancesOnFrameMessages(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	m = next.(Model)
	before := m.FX.Elapsed
	now := time.Now()
	m.LastFrame = now
	next, _ = m.Update(FrameMsg{Now: now.Add(16 * time.Millisecond)})
	m = next.(Model)
	if m.FX.Elapsed <= before {
		t.Fatal("the world did not advance on a frame")
	}
}

func TestEffectsKeepRunningWhileGameplayIsPaused(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	m = next.(Model)
	next, _ = m.Update(keyMsg("p"))
	m = next.(Model)
	before := m.FX.Elapsed
	now := time.Now()
	m.LastFrame = now
	next, _ = m.Update(FrameMsg{Now: now.Add(16 * time.Millisecond)})
	m = next.(Model)
	if m.FX.Elapsed <= before {
		t.Fatal("background stars must keep drifting while paused (§30)")
	}
}

func TestPausedGameplayParticlesDoNotAdvance(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	m = next.(Model)
	next, _ = m.Update(tea.KeyPressMsg{Code: ' ', Text: " "})
	m = next.(Model)
	next, _ = m.Update(keyMsg("p"))
	m = next.(Model)
	before := m.FX.ParticleCount()
	now := time.Now()
	for i := 0; i < 30; i++ {
		m.LastFrame = now
		now = now.Add(16 * time.Millisecond)
		next, _ = m.Update(FrameMsg{Now: now})
		m = next.(Model)
	}
	if m.FX.ParticleCount() != before {
		t.Fatalf("gameplay particles advanced while paused: %d -> %d (§30)", before, m.FX.ParticleCount())
	}
}

func TestNoFXOptionYieldsADisabledWorld(t *testing.T) {
	m := New(Options{Seed: 1, Mode: render.ModeFull, NoFX: true})
	m.Width, m.Height = 80, 30
	next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	m = next.(Model)
	next, _ = m.Update(tea.KeyPressMsg{Code: ' ', Text: " "})
	m = next.(Model)
	if m.FX.ParticleCount() != 0 {
		t.Fatal("--no-fx produced particles")
	}
	if got := m.View(); got == "" {
		t.Fatal("--no-fx produced no view at all")
	}
}

func TestResizeUpdatesTheWorldGeometry(t *testing.T) {
	m := newModel()
	for _, s := range []tea.WindowSizeMsg{{Width: 80, Height: 30}, {Width: 40, Height: 24}, {Width: 0, Height: 0}, {Width: 200, Height: 60}} {
		next, _ := m.Update(s)
		m = next.(Model)
		if m.FX.Screen.W != s.Width || m.FX.Screen.H != s.Height {
			t.Fatalf("world screen = %dx%d after a %dx%d resize", m.FX.Screen.W, m.FX.Screen.H, s.Width, s.Height)
		}
		_ = m.View()
	}
}

func TestSessionBestDrivesTheHighScoreHyperdrive(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	m = next.(Model)
	for i := 0; i < 6; i++ { // a few hard drops build a score
		next, _ = m.Update(tea.KeyPressMsg{Code: ' ', Text: " "})
		m = next.(Model)
	}
	if m.SessionBest < m.Game.Score {
		t.Fatalf("SessionBest = %d, want at least the current score %d", m.SessionBest, m.Game.Score)
	}
	best := m.SessionBest
	next, _ = m.Update(keyMsg("r"))
	m = next.(Model)
	if m.SessionBest != best {
		t.Fatalf("restart reset SessionBest from %d to %d; it is per-session (§16)", best, m.SessionBest)
	}
}

func TestRestartClearsLiveEffects() {}

func TestRestartResetsTheWorld(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	m = next.(Model)
	next, _ = m.Update(tea.KeyPressMsg{Code: ' ', Text: " "})
	m = next.(Model)
	if m.FX.ParticleCount() == 0 {
		t.Fatal("precondition: expected live particles")
	}
	next, _ = m.Update(keyMsg("r"))
	m = next.(Model)
	if m.FX.ParticleCount() != 0 {
		t.Fatalf("restart left %d particles alive", m.FX.ParticleCount())
	}
	if _, _, ok := m.FX.Banner(); ok {
		t.Fatal("restart left a banner up")
	}
}
```

Delete the empty `TestRestartClearsLiveEffects` stub before running — it is a placeholder to remove, not a test.

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/app/ -v`
Expected: FAIL — `Model` has no field `FX`.

- [ ] **Step 3: Wire the world into the model**

`New` builds the world. `Update` on `tea.WindowSizeMsg` calls `m.FX.SetGeometry` with the screen rect and the board rect from `render.Compute`. On `FrameMsg`: advance the game only when playing, then `m.FX.Observe(events)`, then `m.FX.Update(dt)` **always** (§30: background stars keep drifting while paused) — but pass the paused world a flag so gameplay particles hold still. Add `func (w *World) UpdateBackgroundOnly(dt time.Duration)` in `fx` for that, tested by `TestPausedGameplayParticlesDoNotAdvance`. Call `m.FX.NoteScore(m.Game.Score)` after each input that can score, and keep `SessionBest = max(SessionBest, Game.Score)` across restarts. Restart calls a new `func (w *World) Reset()` that clears particles, trails, clears, shocks, banner, notice, and shake but keeps the starfield and the session best.

`View` passes `FX: m.FX` in the `render.Scene`.

- [ ] **Step 4: Run the whole suite to verify it passes**

Run: `go test ./... -race -v`
Expected: PASS.

- [ ] **Step 5: Add FX golden snapshots at a fixed simulated time**

Append to `internal/render/golden_test.go` two cases that build a world with a fixed FX seed, feed a fixed event set, advance it by an exact number of 16 ms steps, and snapshot: `fx_midclear` (a four-line clear 6 frames in, 80×30) and `fx_ascii` (the same in ASCII mode). Generate with `-update`, then read both files and confirm the board is still legible and no row is ragged.

- [ ] **Step 6: Play it and check §43's coolness acceptance test**

Run: `go run ./cmd/cosmic-tetris --seed 1234`
Within the first 30 seconds confirm all six: moving starfield, animated board border, piece trails, hard-drop impact, particles, mission-control commentary. On the first line clear confirm the supernova, debris, and border reaction. Trigger a four-line clear and confirm it is gloriously excessive. Then run `--no-fx` and confirm the game is still good, and `--reduced-motion` and confirm no shake, no hyperdrive acceleration, and no shockwaves while color, trails, and particles remain.

- [ ] **Step 7: Commit**

```bash
gofmt -l . && git add internal/app/ internal/fx/ internal/render/ cmd/
git commit -m "feat(app): wire the fx world into the frame loop, resize, and restart"
```

---

## What Plan 2 deliberately leaves out

Plan 3 owns: the boot sequence, the game-over freeze/collapse/black-hole sequence, the help overlay's final styling, ASCII-mode auditing across every effect, terminal-capability detection for full vs reduced color, FX intensity reduction on small terminals, the §45 optional details' trigger plumbing, and the remaining §41 golden snapshots (game over, help).
