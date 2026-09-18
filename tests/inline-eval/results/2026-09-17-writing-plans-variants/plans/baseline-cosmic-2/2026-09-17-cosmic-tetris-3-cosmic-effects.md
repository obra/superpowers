# Cosmic Tetris — Plan 3: Cosmic Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the independent effects simulation — starfield, piece trails, hard-drop impact, line supernova, particles, shockwaves, screen shake, hyperdrive, animated border, banners and mission control — and composite it over the Plan 2 game, so that a four-line clear produces the reaction §43 demands (§42 Phases 3 and 4).

**Architecture:** `internal/fx` is a separate simulation that observes `[]game.Event` and never receives a `*game.Game`, which is how §14's "may never modify GameState" becomes a property of the types rather than a promise. `fx` is deliberately colour-free and glyph-free: it produces positions, lifetimes, brightnesses, shape *indices* and tint *classes*, and `render` maps those onto its palette and the current mode's glyph vocabulary. Particles, trails, clears and shockwaves live in board-cell space so they follow the board wherever the layout puts it; only the starfield works in terminal-cell space, because it fills the whole screen.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2@v2.0.9`, `charm.land/lipgloss/v2@v2.0.6`, `charm.land/bubbles/v2@v2.2.1`, `math/rand/v2`.

**Spec:** `design.md`

**Depends on:** Plan 1 (`plans/2026-09-17-cosmic-tetris-1-game-engine.md`) and Plan 2 (`plans/2026-09-17-cosmic-tetris-2-playable-terminal.md`) complete and merged.

## Global Constraints

- Language: Go. Module path `cosmic-tetris`. Go directive `go 1.26`.
- Repository layout is §33 of the spec, exactly. Deviations permitted across this plan set, and only these: `internal/game/events.go` (Plan 1), `internal/render/canvas.go` (Plan 2), `internal/render/overlays.go` (Plan 2). This plan adds no new files outside §33's tree: `internal/fx/{world,particle,starfield,events}.go` and `internal/flavor/messages.go` are all in it.
- **FX may observe game events and may never modify game state (§14).** `internal/fx` must not import anything that gives it a `*game.Game`. It sees only `[]game.Event` values.
- FX randomness uses a different RNG from the game (§35, §49.6). `fx.World` and `flavor.Channel` each hold their own `*rand.Rand`; neither is the engine's.
- `internal/fx` never calls `time.Now()`. Effects advance by `Update(dt)`, like the engine.
- §44's restraint rules are hard requirements, not taste: never obscure the active piece; never make controls lag; never delay gameplay for animation; never require reading flavor text; no random effect may alter gameplay; screen shake never exceeds one cell; particles never permanently alter the rendered board.
- `--no-fx` produces a good game (§32): with effects off, the ANSI-stripped output must equal Plan 2's goldens exactly.
- `--reduced-motion` suppresses screen shake, hyperdrive acceleration and shockwaves, and leaves colour, trails and particles alone (§49.5).
- ASCII mode substitutes glyphs without `fx` knowing: `fx` emits shape indices, `render` indexes the mode's glyph sets.
- Board readability is sacred (§15, §21). Inside the board interior only far-layer stars are drawn.
- No goroutine per particle or per frame; no filesystem work during gameplay; reusable slices (§38). A few hundred particles is the working budget.
- Every commit must leave `gofmt -l .` empty, `go vet ./...` clean, and `go test ./...` passing.

## Review Focus

1. **A huge `dt` reaching `World.Update`** — a suspended and resumed terminal, or a debugger pause: particles must not teleport off into NaN or skip their whole lifetime in a way that leaves permanent artefacts. Pinned in Task 5.
2. **A burst of events far exceeding the particle budget** — a long stall that lands twenty events on one frame, or combo 15: the particle count must stay capped and memory must stay flat. Pinned in Task 1 and Task 5.
3. **Enabling effects must not change the game** — piece order, score and timing must be bit-identical with FX on, off, and in reduced motion. Pinned in Task 10.
4. **The active piece staying visible during the heaviest frame** — a four-line clear at combo 7 with shake, banner and 500 particles (§44). Pinned in Task 10.
5. **A resize mid-effect** — shrinking to 40×24 while particles are in flight at board coordinates that no longer map on screen, and while the starfield is sized for the old terminal. Pinned in Task 6 and Task 9.

---

### Task 1: Particles

**Files:**
- Create: `internal/fx/particle.go`
- Test: `internal/fx/particle_test.go`

**Interfaces:**
- Consumes: `game.PieceKind`.
- Produces: `type Tint uint8` with `TintDebris`, `TintStar`, `TintPiece`, `TintFlash`; `type Particle struct{ X, Y, VX, VY, Life, MaxLife, Brightness float64; Shape uint8; Tint Tint; Kind game.PieceKind }`; `func (p Particle) Fade() float64`; `const MaxParticles = 512`; `type Field struct{ ... }`; `func (f *Field) Len() int`; `func (f *Field) All() []Particle`; `func (f *Field) Add(p Particle) bool`; `func (f *Field) Reset()`; `func (f *Field) Update(dt, gravity, drag float64, b Bounds)`; `type Bounds struct{ MinX, MinY, MaxX, MaxY float64 }`; `func (f *Field) EmitBurst(rng *rand.Rand, x, y float64, n int, speed float64, t Tint, k game.PieceKind, shapes uint8)`; `func (f *Field) EmitSpray(rng *rand.Rand, x, y, vx, vy, spread float64, n int, t Tint, k game.PieceKind, shapes uint8)`.

Deviation from §23's struct, and why: the spec's `Particle` holds a `Glyph rune`. Ours holds `Shape uint8`, an index into the current mode's glyph set, so ASCII mode substitutes glyphs at render time and `fx` never needs to know whether the terminal has Unicode. `Brightness` and a `Tint` class replace a colour for the same reason.

- [ ] **Step 1: Write the failing test**

Create `internal/fx/particle_test.go`:

```go
package fx

import (
	"math"
	"math/rand/v2"
	"testing"

	"cosmic-tetris/internal/game"
)

func testRNG() *rand.Rand { return rand.New(rand.NewPCG(0xFACE, 0xB00C)) }

var wideBounds = Bounds{MinX: -8, MinY: -8, MaxX: 32, MaxY: 40}

func TestFadeIsLifeOverMaxLife(t *testing.T) {
	p := Particle{Life: 0.25, MaxLife: 0.5}
	if got := p.Fade(); math.Abs(got-0.5) > 1e-9 {
		t.Errorf("Fade = %v, want 0.5", got)
	}
	if got := (Particle{Life: 1, MaxLife: 0}).Fade(); got != 0 {
		t.Errorf("Fade with no MaxLife = %v, want 0 (no divide by zero)", got)
	}
}

func TestAddAndAllTrackParticles(t *testing.T) {
	var f Field
	if f.Len() != 0 {
		t.Fatalf("fresh field has %d particles", f.Len())
	}
	if !f.Add(Particle{X: 1, Y: 2, Life: 1, MaxLife: 1}) {
		t.Fatal("Add returned false on an empty field")
	}
	if f.Len() != 1 || f.All()[0].X != 1 {
		t.Fatalf("field = %+v", f.All())
	}
}

func TestFieldIsCappedAndStaysFlat(t *testing.T) {
	// Review Focus 2: a burst far past the budget must not grow without bound.
	var f Field
	for i := 0; i < MaxParticles*4; i++ {
		f.Add(Particle{Life: 1, MaxLife: 1})
	}
	if f.Len() != MaxParticles {
		t.Fatalf("Len = %d, want the cap %d", f.Len(), MaxParticles)
	}
	if got := cap(f.All()); got > MaxParticles {
		t.Errorf("backing array grew to %d, want at most %d", got, MaxParticles)
	}
	if f.Add(Particle{Life: 1, MaxLife: 1}) {
		t.Error("Add on a full field should report false")
	}
}

func TestUpdateIntegratesPositionAndVelocity(t *testing.T) {
	var f Field
	f.Add(Particle{X: 0, Y: 0, VX: 2, VY: -4, Life: 1, MaxLife: 1})
	f.Update(0.5, 10, 1, wideBounds)
	p := f.All()[0]
	if math.Abs(p.X-1) > 1e-9 {
		t.Errorf("X = %v, want 1", p.X)
	}
	if math.Abs(p.Y-(-2)) > 1e-9 {
		t.Errorf("Y = %v, want -2", p.Y)
	}
	if math.Abs(p.VY-1) > 1e-9 {
		t.Errorf("VY = %v, want 1 after 0.5s of gravity 10", p.VY)
	}
	if math.Abs(p.Life-0.5) > 1e-9 {
		t.Errorf("Life = %v, want 0.5", p.Life)
	}
}

func TestDragSlowsParticles(t *testing.T) {
	var f Field
	f.Add(Particle{VX: 10, Life: 1, MaxLife: 1})
	f.Update(0.1, 0, 0.5, wideBounds)
	if got := f.All()[0].VX; got >= 10 {
		t.Errorf("VX = %v, want less than 10 under drag", got)
	}
}

func TestDeadParticlesAreRemoved(t *testing.T) {
	var f Field
	f.Add(Particle{Life: 0.05, MaxLife: 1})
	f.Add(Particle{Life: 5, MaxLife: 5})
	f.Update(0.1, 0, 1, wideBounds)
	if f.Len() != 1 {
		t.Fatalf("Len = %d, want 1 after one particle expired", f.Len())
	}
	if f.All()[0].Life < 1 {
		t.Error("the wrong particle survived")
	}
}

func TestParticlesOutsideBoundsAreCulled(t *testing.T) {
	var f Field
	f.Add(Particle{X: 100, Y: 0, Life: 5, MaxLife: 5})
	f.Add(Particle{X: 0, Y: -100, Life: 5, MaxLife: 5})
	f.Add(Particle{X: 5, Y: 5, Life: 5, MaxLife: 5})
	f.Update(0.016, 0, 1, wideBounds)
	if f.Len() != 1 {
		t.Fatalf("Len = %d, want 1: out-of-viewport particles must be culled", f.Len())
	}
}

func TestUpdateSurvivesAbsurdAndDegenerateDeltas(t *testing.T) {
	// Review Focus 1: a resumed terminal hands us a very large dt.
	for _, dt := range []float64{0, -1, 0.001, 600, math.MaxFloat64} {
		var f Field
		f.Add(Particle{X: 5, Y: 5, VX: 3, VY: -3, Life: 1, MaxLife: 1})
		f.Update(dt, 20, 0.9, wideBounds)
		for _, p := range f.All() {
			if math.IsNaN(p.X) || math.IsNaN(p.Y) || math.IsInf(p.X, 0) || math.IsInf(p.Y, 0) {
				t.Fatalf("dt=%v produced a non-finite particle %+v", dt, p)
			}
		}
	}
}

func TestEmitBurstSpreadsParticlesRadially(t *testing.T) {
	var f Field
	f.EmitBurst(testRNG(), 5, 10, 24, 6, TintDebris, game.KindT, 4)
	if f.Len() != 24 {
		t.Fatalf("Len = %d, want 24", f.Len())
	}
	var up, down, left, right int
	for _, p := range f.All() {
		if p.MaxLife <= 0 || p.Life <= 0 {
			t.Fatalf("particle has no life: %+v", p)
		}
		if p.Tint != TintDebris || p.Kind != game.KindT {
			t.Errorf("particle carries %v/%v, want TintDebris/KindT", p.Tint, p.Kind)
		}
		if p.Shape >= 4 {
			t.Errorf("Shape = %d, want an index below 4", p.Shape)
		}
		switch {
		case p.VY < -0.5:
			up++
		case p.VY > 0.5:
			down++
		}
		switch {
		case p.VX < -0.5:
			left++
		case p.VX > 0.5:
			right++
		}
	}
	if up == 0 || down == 0 || left == 0 || right == 0 {
		t.Errorf("burst is not radial: up=%d down=%d left=%d right=%d", up, down, left, right)
	}
}

func TestEmitBurstRespectsTheCap(t *testing.T) {
	var f Field
	f.EmitBurst(testRNG(), 5, 5, MaxParticles*3, 6, TintDebris, game.KindI, 4)
	if f.Len() != MaxParticles {
		t.Fatalf("Len = %d, want the cap %d", f.Len(), MaxParticles)
	}
}

func TestEmitSprayIsDirectional(t *testing.T) {
	var f Field
	f.EmitSpray(testRNG(), 4, 4, 0, 12, 0.3, 20, TintFlash, game.KindI, 4)
	for _, p := range f.All() {
		if p.VY <= 0 {
			t.Errorf("spray particle moves against its direction: VY = %v", p.VY)
		}
	}
}

func TestEmittersAreDeterministicForAGivenSeed(t *testing.T) {
	var a, b Field
	a.EmitBurst(testRNG(), 5, 10, 32, 6, TintDebris, game.KindZ, 4)
	b.EmitBurst(testRNG(), 5, 10, 32, 6, TintDebris, game.KindZ, 4)
	pa, pb := a.All(), b.All()
	for i := range pa {
		if pa[i] != pb[i] {
			t.Fatalf("particle %d differs: %+v vs %+v", i, pa[i], pb[i])
		}
	}
}

func TestResetEmptiesWithoutReallocating(t *testing.T) {
	var f Field
	f.EmitBurst(testRNG(), 5, 5, 64, 6, TintDebris, game.KindO, 4)
	before := cap(f.All())
	f.Reset()
	if f.Len() != 0 {
		t.Fatalf("Len = %d after Reset", f.Len())
	}
	f.Add(Particle{Life: 1, MaxLife: 1})
	if got := cap(f.All()); got != before {
		t.Errorf("cap = %d after Reset, want the slice reused at %d", got, before)
	}
}

func TestZeroFieldIsUsable(t *testing.T) {
	var f Field
	f.Update(0.016, 10, 0.9, wideBounds)
	if f.Len() != 0 || f.All() == nil && f.Len() != 0 {
		t.Fatal("the zero Field should be usable without initialisation")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/fx/ -run TestFadeIsLife -v`
Expected: FAIL — `undefined: Particle`.

- [ ] **Step 3: Write the implementation**

Create `internal/fx/particle.go`:

```go
// Package fx is the cosmic effects simulation. It observes game events and never
// modifies game state (§14): it is handed []game.Event values and has no way to
// reach a *game.Game.
//
// fx is colour-free and glyph-free on purpose. It produces positions, lifetimes,
// brightnesses, shape indices and tint classes; render maps those onto its
// palette and the current mode's glyph vocabulary, which is how ASCII mode
// substitutes glyphs without fx knowing anything about Unicode.
//
// Particles, trails, clears and shockwaves live in board-cell space, so they
// follow the board wherever the layout puts it. Only the starfield works in
// terminal-cell space, because it fills the screen.
package fx

import (
	"math"
	"math/rand/v2"

	"cosmic-tetris/internal/game"
)

// Tint is a particle's colour class. render resolves it against its palette.
type Tint uint8

const (
	// TintDebris is cool grey-white rubble.
	TintDebris Tint = iota
	// TintStar is starfield colouring.
	TintStar
	// TintPiece takes the colour of Particle.Kind.
	TintPiece
	// TintFlash is hot white: impacts, supernovae, shockwave fronts.
	TintFlash
)

// MaxParticles caps the simulation. §38 calls a few hundred trivial; this is the
// ceiling that keeps a pathological event burst from growing memory.
const MaxParticles = 512

// Particle is one speck of terminal-space physics (§23).
type Particle struct {
	X, Y   float64
	VX, VY float64

	Life    float64
	MaxLife float64

	Brightness float64
	Shape      uint8
	Tint       Tint
	Kind       game.PieceKind
}

// Fade is remaining life as a fraction, 0 when spent.
func (p Particle) Fade() float64 {
	if p.MaxLife <= 0 {
		return 0
	}
	f := p.Life / p.MaxLife
	if f < 0 {
		return 0
	}
	if f > 1 {
		return 1
	}
	return f
}

// Bounds is the cull region in the particles' own coordinate space.
type Bounds struct {
	MinX, MinY, MaxX, MaxY float64
}

func (b Bounds) contains(x, y float64) bool {
	return x >= b.MinX && x <= b.MaxX && y >= b.MinY && y <= b.MaxY
}

// Field is a capped particle pool. The zero value is ready to use and the
// backing slice is reused across bursts (§38).
type Field struct {
	ps []Particle
}

// Len is the live particle count.
func (f *Field) Len() int { return len(f.ps) }

// All returns the live particles. The slice is owned by the Field; treat it as
// read-only.
func (f *Field) All() []Particle { return f.ps }

// Add appends a particle, reporting false when the field is full.
func (f *Field) Add(p Particle) bool {
	if len(f.ps) >= MaxParticles {
		return false
	}
	if f.ps == nil {
		f.ps = make([]Particle, 0, MaxParticles)
	}
	f.ps = append(f.ps, p)
	return true
}

// Reset drops every particle and keeps the backing array.
func (f *Field) Reset() { f.ps = f.ps[:0] }

// Update integrates one step and compacts out particles that died or left the
// viewport. dt is clamped, because a resumed terminal can hand us minutes.
func (f *Field) Update(dt, gravity, drag float64, b Bounds) {
	if !(dt > 0) { // also catches NaN
		return
	}
	if dt > maxStepSeconds {
		dt = maxStepSeconds
	}
	if drag <= 0 || drag > 1 {
		drag = 1
	}
	damp := math.Pow(drag, dt*60)

	live := f.ps[:0]
	for _, p := range f.ps {
		p.X += p.VX * dt
		p.Y += p.VY * dt
		p.VY += gravity * dt
		p.VX *= damp
		p.VY *= damp
		p.Life -= dt
		if p.Life <= 0 || !b.contains(p.X, p.Y) {
			continue
		}
		live = append(live, p)
	}
	f.ps = live
}

// EmitBurst throws n particles radially from x, y (§23's radial explosion force).
// shapes is the size of the glyph set render will index with Shape.
func (f *Field) EmitBurst(rng *rand.Rand, x, y float64, n int, speed float64, t Tint, k game.PieceKind, shapes uint8) {
	if shapes == 0 {
		shapes = 1
	}
	for i := 0; i < n; i++ {
		angle := rng.Float64() * 2 * math.Pi
		mag := speed * (0.35 + 0.65*rng.Float64())
		life := 0.28 + 0.5*rng.Float64()
		if !f.Add(Particle{
			X: x, Y: y,
			VX:         math.Cos(angle) * mag,
			VY:         math.Sin(angle) * mag * 0.6, // terminal cells are tall
			Life:       life,
			MaxLife:    life,
			Brightness: 0.6 + 0.4*rng.Float64(),
			Shape:      uint8(rng.IntN(int(shapes))),
			Tint:       t,
			Kind:       k,
		}) {
			return
		}
	}
}

// EmitSpray throws n particles along vx, vy with an angular spread in radians.
func (f *Field) EmitSpray(rng *rand.Rand, x, y, vx, vy, spread float64, n int, t Tint, k game.PieceKind, shapes uint8) {
	if shapes == 0 {
		shapes = 1
	}
	base := math.Atan2(vy, vx)
	mag := math.Hypot(vx, vy)
	for i := 0; i < n; i++ {
		angle := base + (rng.Float64()-0.5)*2*spread
		m := mag * (0.6 + 0.6*rng.Float64())
		life := 0.2 + 0.35*rng.Float64()
		if !f.Add(Particle{
			X: x, Y: y,
			VX:         math.Cos(angle) * m,
			VY:         math.Sin(angle) * m,
			Life:       life,
			MaxLife:    life,
			Brightness: 0.7 + 0.3*rng.Float64(),
			Shape:      uint8(rng.IntN(int(shapes))),
			Tint:       t,
			Kind:       k,
		}) {
			return
		}
	}
}
```

`maxStepSeconds` is declared in Task 3's `events.go` as `const maxStepSeconds = 0.1`. To keep this task compiling on its own, declare it here now and move it to `events.go` in Task 3:

```go
// maxStepSeconds clamps one simulation step. A suspended terminal resuming must
// not fast-forward the whole spectacle in a single frame.
const maxStepSeconds = 0.1
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/fx/particle.go internal/fx/particle_test.go
git commit -m "feat(fx): capped particle field with radial and directional emitters"
```

---

### Task 2: Starfield

**Files:**
- Create: `internal/fx/starfield.go`
- Test: `internal/fx/starfield_test.go`

**Interfaces:**
- Consumes: `math/rand/v2`.
- Produces: `type Star struct{ X, Y float64; Layer uint8; Shape uint8; Bright float64 }`; `const StarLayers = 3`; `type Starfield struct{ ... }`; `func (s *Starfield) Resize(rng *rand.Rand, w, h int)`; `func (s *Starfield) Size() (int, int)`; `func (s *Starfield) All() []Star`; `func (s *Starfield) Update(rng *rand.Rand, dt, speedMul float64)`; `func (s *Starfield) Density() float64`; `func (s *Starfield) SetDensity(d float64)`.

Layer speeds are 0.55, 1.6 and 3.4 cells per second (§15's slow/medium/fast). Stars drift downward and wrap to the top. `speedMul` carries both the level ramp and hyperdrive; the caller computes it.

- [ ] **Step 1: Write the failing test**

Create `internal/fx/starfield_test.go`:

```go
package fx

import (
	"math"
	"testing"
)

func TestResizeFillsTheFieldWithThreeLayers(t *testing.T) {
	var s Starfield
	s.Resize(testRNG(), 80, 30)
	if w, h := s.Size(); w != 80 || h != 30 {
		t.Fatalf("Size = %dx%d, want 80x30", w, h)
	}
	if s.All() == nil || len(s.All()) == 0 {
		t.Fatal("no stars after Resize")
	}
	seen := map[uint8]int{}
	for _, st := range s.All() {
		if st.Layer >= StarLayers {
			t.Fatalf("star in layer %d, want below %d", st.Layer, StarLayers)
		}
		if st.X < 0 || st.X > 80 || st.Y < 0 || st.Y > 30 {
			t.Errorf("star outside the field: %+v", st)
		}
		if st.Bright <= 0 || st.Bright > 1 {
			t.Errorf("star brightness %v out of range", st.Bright)
		}
		seen[st.Layer]++
	}
	for l := uint8(0); l < StarLayers; l++ {
		if seen[l] == 0 {
			t.Errorf("layer %d is empty (§15 wants three depth layers)", l)
		}
	}
}

func TestFarLayerIsTheMostPopulousAndDimmest(t *testing.T) {
	var s Starfield
	s.Resize(testRNG(), 80, 30)
	count := map[uint8]int{}
	bright := map[uint8]float64{}
	for _, st := range s.All() {
		count[st.Layer]++
		bright[st.Layer] += st.Bright
	}
	if count[0] <= count[2] {
		t.Errorf("far layer has %d stars, near has %d: want more far stars", count[0], count[2])
	}
	avg := func(l uint8) float64 { return bright[l] / float64(count[l]) }
	if avg(0) >= avg(2) {
		t.Errorf("far avg brightness %v is not dimmer than near %v", avg(0), avg(2))
	}
}

func TestStarsDriftDownwardAtLayerSpeeds(t *testing.T) {
	var s Starfield
	s.Resize(testRNG(), 80, 30)
	before := make([]Star, len(s.All()))
	copy(before, s.All())
	s.Update(testRNG(), 0.5, 1)

	var moved [StarLayers]float64
	for i, st := range s.All() {
		if st.Layer != before[i].Layer {
			t.Fatal("Update reordered the stars; the test needs stable indices")
		}
		d := st.Y - before[i].Y
		if d < 0 {
			d += float64(30) // wrapped
		}
		moved[st.Layer] += d
	}
	if !(moved[0] < moved[1] && moved[1] < moved[2]) {
		t.Errorf("layer drift %v is not increasing with depth", moved)
	}
}

func TestStarsWrapAtTheBottom(t *testing.T) {
	var s Starfield
	s.Resize(testRNG(), 40, 24)
	s.Update(testRNG(), 5, 4)
	for _, st := range s.All() {
		if st.Y < 0 || st.Y > 24 {
			t.Fatalf("star escaped the field after a long step: %+v", st)
		}
	}
}

func TestSpeedMultiplierScalesDrift(t *testing.T) {
	measure := func(mul float64) float64 {
		var s Starfield
		s.Resize(testRNG(), 80, 30)
		y0 := s.All()[0].Y
		s.Update(testRNG(), 0.1, mul)
		return s.All()[0].Y - y0
	}
	slow, fast := measure(1), measure(4)
	if fast <= slow {
		t.Errorf("drift with mul 4 (%v) is not greater than with mul 1 (%v)", fast, slow)
	}
}

func TestUpdateToleratesAbsurdDeltas(t *testing.T) {
	for _, dt := range []float64{0, -3, 600, math.MaxFloat64} {
		var s Starfield
		s.Resize(testRNG(), 80, 30)
		s.Update(testRNG(), dt, 8)
		for _, st := range s.All() {
			if math.IsNaN(st.Y) || math.IsInf(st.Y, 0) || st.Y < 0 || st.Y > 30 {
				t.Fatalf("dt=%v produced %+v", dt, st)
			}
		}
	}
}

func TestResizeToNothingIsSafe(t *testing.T) {
	// Review Focus 5: a terminal can report 0x0 mid-drag.
	var s Starfield
	s.Resize(testRNG(), 80, 30)
	s.Resize(testRNG(), 0, 0)
	s.Update(testRNG(), 0.016, 1)
	if len(s.All()) != 0 {
		t.Errorf("%d stars in a 0x0 field", len(s.All()))
	}
	s.Resize(testRNG(), -5, -5)
	s.Update(testRNG(), 0.016, 1)
	s.Resize(testRNG(), 80, 30)
	if len(s.All()) == 0 {
		t.Error("field did not repopulate after growing back")
	}
}

func TestResizePreservesRoughDensity(t *testing.T) {
	var small, large Starfield
	small.Resize(testRNG(), 40, 24)
	large.Resize(testRNG(), 160, 48)
	if len(large.All()) <= len(small.All()) {
		t.Errorf("large field has %d stars, small has %d: density should scale with area",
			len(large.All()), len(small.All()))
	}
	if len(large.All()) > 2000 {
		t.Errorf("%d stars on a 160x48 terminal is too many", len(large.All()))
	}
}

func TestDensityBoostAddsStars(t *testing.T) {
	// §20: a four-line clear temporarily increases star density.
	var s Starfield
	s.Resize(testRNG(), 80, 30)
	base := len(s.All())
	s.SetDensity(2)
	s.Update(testRNG(), 0.016, 1)
	if len(s.All()) <= base {
		t.Errorf("%d stars at density 2, want more than %d", len(s.All()), base)
	}
	s.SetDensity(1)
	for i := 0; i < 200; i++ {
		s.Update(testRNG(), 0.016, 1)
	}
	if len(s.All()) > base+base/4 {
		t.Errorf("%d stars after the boost decayed, want about %d", len(s.All()), base)
	}
}

func TestStarfieldIsDeterministic(t *testing.T) {
	run := func() []Star {
		var s Starfield
		rng := testRNG()
		s.Resize(rng, 80, 30)
		for i := 0; i < 60; i++ {
			s.Update(rng, 0.016, 1.5)
		}
		out := make([]Star, len(s.All()))
		copy(out, s.All())
		return out
	}
	a, b := run(), run()
	if len(a) != len(b) {
		t.Fatalf("lengths %d vs %d", len(a), len(b))
	}
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("star %d differs: %+v vs %+v", i, a[i], b[i])
		}
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/fx/ -run TestResizeFills -v`
Expected: FAIL — `undefined: Starfield`.

- [ ] **Step 3: Write the implementation**

Create `internal/fx/starfield.go`:

```go
package fx

import "math/rand/v2"

// StarLayers is the number of depth layers (§15).
const StarLayers = 3

// Star is one background speck in terminal-cell space.
type Star struct {
	X, Y   float64
	Layer  uint8
	Shape  uint8
	Bright float64
}

// layerSpeed is downward drift in cells per second: slow, medium, fast (§15).
var layerSpeed = [StarLayers]float64{0.55, 1.6, 3.4}

// layerShare is each layer's fraction of the population. Far stars dominate so
// the sky reads as depth rather than confetti.
var layerShare = [StarLayers]float64{0.6, 0.28, 0.12}

// layerBright is each layer's base brightness.
var layerBright = [StarLayers]float64{0.35, 0.6, 1.0}

// cellsPerStar sets the baseline density: one star per this many terminal cells.
const cellsPerStar = 26

// Starfield is the drifting background. The zero value is an empty field.
type Starfield struct {
	stars   []Star
	w, h    int
	density float64
}

// Size is the field's terminal dimensions.
func (s *Starfield) Size() (int, int) { return s.w, s.h }

// All returns the live stars. Owned by the Starfield; treat as read-only.
func (s *Starfield) All() []Star { return s.stars }

// Density is the current multiplier on the baseline population.
func (s *Starfield) Density() float64 {
	if s.density <= 0 {
		return 1
	}
	return s.density
}

// SetDensity boosts the population, e.g. during a four-line clear (§20). It
// decays back toward 1 in Update.
func (s *Starfield) SetDensity(d float64) {
	if d < 1 {
		d = 1
	}
	if d > 4 {
		d = 4
	}
	s.density = d
}

// target is the star count the current size and density call for.
func (s *Starfield) target() int {
	if s.w <= 0 || s.h <= 0 {
		return 0
	}
	return int(float64(s.w*s.h) / cellsPerStar * s.Density())
}

// Resize repopulates the field for a new terminal size.
func (s *Starfield) Resize(rng *rand.Rand, w, h int) {
	if w < 0 {
		w = 0
	}
	if h < 0 {
		h = 0
	}
	s.w, s.h = w, h
	s.stars = s.stars[:0]
	for len(s.stars) < s.target() {
		s.stars = append(s.stars, s.spawn(rng, true))
	}
}

// spawn makes one star. anywhere places it at a random height, as opposed to
// entering from the top.
func (s *Starfield) spawn(rng *rand.Rand, anywhere bool) Star {
	layer := uint8(0)
	r := rng.Float64()
	switch {
	case r > layerShare[0]+layerShare[1]:
		layer = 2
	case r > layerShare[0]:
		layer = 1
	}
	y := 0.0
	if anywhere {
		y = rng.Float64() * float64(s.h)
	}
	return Star{
		X:      rng.Float64() * float64(s.w),
		Y:      y,
		Layer:  layer,
		Shape:  uint8(rng.IntN(4)),
		Bright: layerBright[layer] * (0.7 + 0.3*rng.Float64()),
	}
}

// Update drifts the stars downward. speedMul carries the level ramp and any
// hyperdrive boost; the caller computes it.
func (s *Starfield) Update(rng *rand.Rand, dt, speedMul float64) {
	if s.w <= 0 || s.h <= 0 {
		s.stars = s.stars[:0]
		return
	}
	if !(dt > 0) {
		return
	}
	if dt > maxStepSeconds {
		dt = maxStepSeconds
	}
	if speedMul < 0 {
		speedMul = 0
	}

	h := float64(s.h)
	for i := range s.stars {
		st := &s.stars[i]
		st.Y += layerSpeed[st.Layer] * speedMul * dt
		for st.Y > h {
			st.Y -= h
			st.X = rng.Float64() * float64(s.w)
		}
	}

	// Density relaxes back to the baseline, adding or dropping a few stars per
	// frame rather than repopulating in one jump.
	if s.density > 1 {
		s.density -= dt
		if s.density < 1 {
			s.density = 1
		}
	}
	target := s.target()
	for i := 0; i < 4 && len(s.stars) < target; i++ {
		s.stars = append(s.stars, s.spawn(rng, false))
	}
	for i := 0; i < 4 && len(s.stars) > target; i++ {
		s.stars = s.stars[:len(s.stars)-1]
	}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS. `TestStarsDriftDownwardAtLayerSpeeds` relies on `Update` keeping star indices stable — it must not reorder.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/fx/starfield.go internal/fx/starfield_test.go
git commit -m "feat(fx): three-layer drifting starfield with density boosts"
```

---
### Task 3: Event-driven effect state machines

**Files:**
- Create: `internal/fx/events.go`
- Modify: `internal/fx/particle.go` (move `maxStepSeconds` here)
- Test: `internal/fx/events_test.go`

**Interfaces:**
- Consumes: `game.PieceKind`.
- Produces: `const maxStepSeconds = 0.1`; `type Shake struct{ ... }` with `Trigger(strength float64)`, `Update(dt float64)`, `Offset() (int, int)`, `Active() bool`; `type Shockwave struct{ X, Y, Age, Life float64 }` with `Radius() float64` and `Fade() float64`; `type Hyperdrive struct{ ... }` with `Trigger()`, `Update(dt float64)`, `Multiplier() float64`, `Active() bool`; `type Banner struct{ Text, Sub string; Age, Life float64 }` with `Fade() float64`; `type Border struct{ ... }` with `Update(dt float64)`, `Pulse(amount float64)`, `Phase() float64`, `Energy() float64`; `type LineClear struct{ Rows []int; Age, Life float64 }` with `Phase() ClearPhase`; `type ClearPhase uint8` with `ClearCriticalMass`, `ClearSupernova`, `ClearCollapse`; `type TrailCell struct{ X, Y int; Fade float64; Kind game.PieceKind }`; `const ShakeDuration`, `ShockwaveLife`, `HyperdriveLife`, `BannerLife`, `ClearLife`, `TrailLife`.

The §18 shake pattern is walked, not randomised, so shake is reproducible and can never exceed one cell (§44).

- [ ] **Step 1: Write the failing test**

Create `internal/fx/events_test.go`:

```go
package fx

import (
	"math"
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func TestDurationConstantsMatchTheSpec(t *testing.T) {
	cases := []struct {
		name string
		got  time.Duration
		want time.Duration
	}{
		{"ShakeDuration", ShakeDuration, 80 * time.Millisecond},   // §18
		{"ShockwaveLife", ShockwaveLife, 300 * time.Millisecond},  // §24
		{"HyperdriveLife", HyperdriveLife, 1100 * time.Millisecond}, // §16
		{"BannerLife", BannerLife, 700 * time.Millisecond},        // §20
		{"ClearLife", ClearLife, 220 * time.Millisecond},          // §19
	}
	for _, c := range cases {
		if c.got != c.want {
			t.Errorf("%s = %v, want %v", c.name, c.got, c.want)
		}
	}
	if TrailLife < 100*time.Millisecond || TrailLife > 160*time.Millisecond {
		t.Errorf("TrailLife = %v, want 100-160ms (§17)", TrailLife)
	}
}

func TestShakeNeverExceedsOneCell(t *testing.T) {
	// §44: never make screen shake exceed roughly one cell.
	var s Shake
	for _, strength := range []float64{0.1, 1, 4, 100} {
		s.Trigger(strength)
		for i := 0; i < 40; i++ {
			dx, dy := s.Offset()
			if dx < -1 || dx > 1 || dy < -1 || dy > 1 {
				t.Fatalf("strength %v produced offset (%d,%d)", strength, dx, dy)
			}
			s.Update(0.008)
		}
	}
}

func TestShakeSettlesToZero(t *testing.T) {
	var s Shake
	s.Trigger(1)
	if !s.Active() {
		t.Fatal("shake is not active after Trigger")
	}
	s.Update(ShakeDuration.Seconds() * 2)
	if s.Active() {
		t.Error("shake still active after twice its duration")
	}
	if dx, dy := s.Offset(); dx != 0 || dy != 0 {
		t.Errorf("settled offset = (%d,%d), want (0,0)", dx, dy)
	}
}

func TestShakeWalksThePinnedPattern(t *testing.T) {
	// §18's pattern is deterministic, so two runs must agree exactly.
	run := func() [][2]int {
		var s Shake
		s.Trigger(1)
		var out [][2]int
		for i := 0; i < 12; i++ {
			dx, dy := s.Offset()
			out = append(out, [2]int{dx, dy})
			s.Update(0.008)
		}
		return out
	}
	a, b := run(), run()
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("step %d differs: %v vs %v — shake must be deterministic", i, a[i], b[i])
		}
	}
	moved := false
	for _, o := range a {
		if o != [2]int{0, 0} {
			moved = true
		}
	}
	if !moved {
		t.Error("shake never moved anything")
	}
}

func TestShockwaveExpandsAndFades(t *testing.T) {
	w := Shockwave{X: 5, Y: 10, Life: ShockwaveLife.Seconds()}
	r0 := w.Radius()
	w.Age += 0.1
	if w.Radius() <= r0 {
		t.Errorf("radius %v did not grow from %v", w.Radius(), r0)
	}
	if w.Fade() >= 1 {
		t.Errorf("Fade = %v after ageing, want below 1", w.Fade())
	}
	w.Age = w.Life
	if got := w.Fade(); got != 0 {
		t.Errorf("Fade at end of life = %v, want 0", got)
	}
}

func TestHyperdriveFollowsTheSpecTimeline(t *testing.T) {
	// §16: pause, stretch, violent acceleration, peak at 500ms, decay, normal.
	var h Hyperdrive
	if got := h.Multiplier(); got != 1 {
		t.Fatalf("idle multiplier = %v, want 1", got)
	}
	h.Trigger()
	at := func(seconds float64) float64 {
		var hh Hyperdrive
		hh.Trigger()
		for t := 0.0; t < seconds; t += 0.004 {
			hh.Update(0.004)
		}
		return hh.Multiplier()
	}
	pause, mid, peak, decay := at(0.001), at(0.1), at(0.5), at(0.9)
	if pause > 0.3 {
		t.Errorf("multiplier at 0ms = %v, want a near-pause", pause)
	}
	if !(mid > pause) {
		t.Errorf("no acceleration by 100ms: %v after %v", mid, pause)
	}
	if !(peak > mid && peak > 4) {
		t.Errorf("peak at 500ms = %v, want a violent peak above 4", peak)
	}
	if !(decay < peak) {
		t.Errorf("no decay by 900ms: %v vs peak %v", decay, peak)
	}
	if got := at(1.2); math.Abs(got-1) > 0.01 {
		t.Errorf("multiplier after 1.2s = %v, want back to 1", got)
	}
}

func TestHyperdriveRetriggerRestarts(t *testing.T) {
	var h Hyperdrive
	h.Trigger()
	h.Update(0.9)
	h.Trigger()
	if !h.Active() {
		t.Fatal("retrigger did not reactivate hyperdrive")
	}
	h.Update(0.5)
	if h.Multiplier() < 4 {
		t.Errorf("multiplier %v after retrigger, want the peak again", h.Multiplier())
	}
}

func TestBorderPhaseDriftsSlowlyAndPulsesDecay(t *testing.T) {
	var b Border
	p0 := b.Phase()
	b.Update(1)
	if b.Phase() == p0 {
		t.Error("border phase does not drift (§25: colour shifts over time)")
	}
	if d := b.Phase() - p0; d > 0.2 {
		t.Errorf("phase moved %v in one second, want a subtle shift", d)
	}
	if got := b.Energy(); got != 0 {
		t.Errorf("resting energy = %v, want 0", got)
	}
	b.Pulse(1)
	if b.Energy() <= 0 {
		t.Fatal("Pulse did not raise energy")
	}
	b.Update(2)
	if got := b.Energy(); got != 0 {
		t.Errorf("energy = %v two seconds after a pulse, want 0", got)
	}
}

func TestBorderPhaseStaysInUnitRange(t *testing.T) {
	var b Border
	for i := 0; i < 5000; i++ {
		b.Update(0.05)
		if p := b.Phase(); p < 0 || p >= 1 {
			t.Fatalf("phase = %v, want [0,1)", p)
		}
	}
}

func TestBorderEnergyIsClamped(t *testing.T) {
	var b Border
	b.Pulse(100)
	if got := b.Energy(); got > 1 {
		t.Errorf("Energy = %v, want at most 1", got)
	}
}

func TestClearPhasesRunAThroughC(t *testing.T) {
	c := LineClear{Rows: []int{20, 21}, Life: ClearLife.Seconds()}
	if c.Phase() != ClearCriticalMass {
		t.Errorf("phase at age 0 = %v, want ClearCriticalMass", c.Phase())
	}
	c.Age = c.Life * 0.5
	if c.Phase() != ClearSupernova {
		t.Errorf("phase at half life = %v, want ClearSupernova", c.Phase())
	}
	c.Age = c.Life * 0.9
	if c.Phase() != ClearCollapse {
		t.Errorf("phase at 90%% = %v, want ClearCollapse", c.Phase())
	}
}

func TestBannerFade(t *testing.T) {
	b := Banner{Text: "✦ EVENT HORIZON ✦", Life: BannerLife.Seconds()}
	if got := b.Fade(); got != 1 {
		t.Errorf("fresh banner Fade = %v, want 1", got)
	}
	b.Age = b.Life
	if got := b.Fade(); got != 0 {
		t.Errorf("expired banner Fade = %v, want 0", got)
	}
}

func TestTrailCellCarriesItsPieceKind(t *testing.T) {
	// render needs the kind to colour the trail; fx stays colour-free.
	c := TrailCell{X: 4, Y: 9, Fade: 0.5, Kind: game.KindS}
	if c.Kind != game.KindS {
		t.Fatalf("Kind = %v", c.Kind)
	}
}

func TestMaxStepSecondsClampsOneFrame(t *testing.T) {
	if maxStepSeconds <= 0 || maxStepSeconds > 0.2 {
		t.Fatalf("maxStepSeconds = %v, want a small positive clamp", maxStepSeconds)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/fx/ -run TestDurationConstants -v`
Expected: FAIL — `undefined: ShakeDuration`.

- [ ] **Step 3: Write the implementation**

Create `internal/fx/events.go`:

```go
package fx

import (
	"time"

	"cosmic-tetris/internal/game"
)

// Effect durations, all pinned by the spec.
const (
	// ShakeDuration is §18's 80ms impact shake.
	ShakeDuration = 80 * time.Millisecond
	// ShockwaveLife is §24's ~300ms ring.
	ShockwaveLife = 300 * time.Millisecond
	// HyperdriveLife is §16's full 1100ms sequence.
	HyperdriveLife = 1100 * time.Millisecond
	// BannerLife is §20's ~700ms banner.
	BannerLife = 700 * time.Millisecond
	// ClearLife is §19's ~220ms line-clear animation.
	ClearLife = 220 * time.Millisecond
	// TrailLife is §17's short-lived ion trail.
	TrailLife = 140 * time.Millisecond
)

// maxStepSeconds clamps one simulation step. A suspended terminal resuming must
// not fast-forward the whole spectacle in a single frame.
const maxStepSeconds = 0.1

// shakePattern is §18's deterministic shake walk. Every entry is within one
// cell, which is how §44's limit is guaranteed rather than hoped for.
var shakePattern = [5][2]int{{0, 1}, {-1, 0}, {1, 0}, {0, -1}, {0, 0}}

// shakeStep is how long each pattern entry holds.
const shakeStep = ShakeDuration / 5

// Shake is the impact screen shake. The zero value is at rest.
type Shake struct {
	remaining float64
	elapsed   float64
	strength  float64
}

// Trigger starts (or restarts) a shake. strength scales duration, never
// amplitude: amplitude is always at most one cell.
func (s *Shake) Trigger(strength float64) {
	if strength <= 0 {
		return
	}
	if strength > 3 {
		strength = 3
	}
	s.strength = strength
	s.remaining = ShakeDuration.Seconds() * strength
	s.elapsed = 0
}

// Update ages the shake.
func (s *Shake) Update(dt float64) {
	if !(dt > 0) || s.remaining <= 0 {
		return
	}
	if dt > maxStepSeconds {
		dt = maxStepSeconds
	}
	s.elapsed += dt
	s.remaining -= dt
	if s.remaining <= 0 {
		s.remaining = 0
		s.elapsed = 0
	}
}

// Active reports whether a shake is in progress.
func (s *Shake) Active() bool { return s.remaining > 0 }

// Offset is the current board displacement in whole terminal cells.
func (s *Shake) Offset() (int, int) {
	if s.remaining <= 0 {
		return 0, 0
	}
	i := int(s.elapsed/shakeStep.Seconds()) % len(shakePattern)
	return shakePattern[i][0], shakePattern[i][1]
}

// Shockwave is an expanding ring in board-cell space (§24).
type Shockwave struct {
	X, Y float64
	Age  float64
	Life float64
}

// maxShockwaveRadius keeps a ring inside a sane region of the board.
const maxShockwaveRadius = 14

// Radius is the ring's current radius in board cells.
func (w Shockwave) Radius() float64 {
	if w.Life <= 0 {
		return 0
	}
	return maxShockwaveRadius * (w.Age / w.Life)
}

// Fade is remaining life as a fraction.
func (w Shockwave) Fade() float64 {
	if w.Life <= 0 {
		return 0
	}
	f := 1 - w.Age/w.Life
	if f < 0 {
		return 0
	}
	if f > 1 {
		return 1
	}
	return f
}

// hyperKeys is §16's timeline as piecewise-linear keyframes of
// (seconds, star speed multiplier).
var hyperKeys = [...]struct{ t, mul float64 }{
	{0.00, 0.0}, // stars pause
	{0.05, 0.4}, // stretch
	{0.10, 3.0}, // violent acceleration
	{0.50, 8.0}, // peak
	{0.80, 3.5}, // decay
	{1.10, 1.0}, // normal
}

// Hyperdrive accelerates the starfield for absolutely no reason (§16).
type Hyperdrive struct {
	age    float64
	active bool
}

// Trigger starts the sequence from the beginning.
func (h *Hyperdrive) Trigger() {
	h.age = 0
	h.active = true
}

// Update ages the sequence.
func (h *Hyperdrive) Update(dt float64) {
	if !h.active || !(dt > 0) {
		return
	}
	if dt > maxStepSeconds {
		dt = maxStepSeconds
	}
	h.age += dt
	if h.age >= HyperdriveLife.Seconds() {
		h.active = false
		h.age = 0
	}
}

// Active reports whether hyperdrive is engaged.
func (h *Hyperdrive) Active() bool { return h.active }

// Multiplier is the current starfield speed multiplier, 1 at rest.
func (h *Hyperdrive) Multiplier() float64 {
	if !h.active {
		return 1
	}
	for i := 1; i < len(hyperKeys); i++ {
		if h.age <= hyperKeys[i].t {
			prev, next := hyperKeys[i-1], hyperKeys[i]
			span := next.t - prev.t
			if span <= 0 {
				return next.mul
			}
			f := (h.age - prev.t) / span
			return prev.mul + (next.mul-prev.mul)*f
		}
	}
	return 1
}

// Banner is a large transient headline (§20, §22).
type Banner struct {
	Text string
	Sub  string
	Age  float64
	Life float64
}

// Fade is remaining life as a fraction.
func (b Banner) Fade() float64 {
	if b.Life <= 0 {
		return 0
	}
	f := 1 - b.Age/b.Life
	if f < 0 {
		return 0
	}
	if f > 1 {
		return 1
	}
	return f
}

// Border is the board frame's energy state (§25): a slowly drifting colour phase
// plus a transient energy level that major events pulse.
type Border struct {
	phase  float64
	energy float64
}

// borderDrift is how fast the resting colour phase moves, in cycles per second.
// §25 asks for subtle: one full cycle every ~50 seconds.
const borderDrift = 0.02

// Update drifts the phase and decays the energy.
func (b *Border) Update(dt float64) {
	if !(dt > 0) {
		return
	}
	if dt > maxStepSeconds {
		dt = maxStepSeconds
	}
	// Energy makes the gradient move rapidly around the border during events.
	b.phase += borderDrift * dt * (1 + 12*b.energy)
	for b.phase >= 1 {
		b.phase -= 1
	}
	for b.phase < 0 {
		b.phase += 1
	}
	b.energy -= dt
	if b.energy < 0 {
		b.energy = 0
	}
}

// Pulse raises the border's energy, brightening it and speeding the gradient.
func (b *Border) Pulse(amount float64) {
	if amount <= 0 {
		return
	}
	b.energy += amount
	if b.energy > 1 {
		b.energy = 1
	}
}

// Phase is the resting colour position, in [0,1).
func (b *Border) Phase() float64 { return b.phase }

// Energy is the excitement level, in [0,1].
func (b *Border) Energy() float64 { return b.energy }

// ClearPhase is which stage of §19's animation a clear is in.
type ClearPhase uint8

const (
	// ClearCriticalMass is phase A: the row destabilises.
	ClearCriticalMass ClearPhase = iota
	// ClearSupernova is phase B: the explosion travels outward from centre.
	ClearSupernova
	// ClearCollapse is phase C: the row fragments into debris.
	ClearCollapse
)

// LineClear is one in-flight clear animation. The engine has already removed the
// rows; this is rendering catching up (§19). The animation uses a hot-white
// energy ramp rather than reproducing the pre-clear colours, which is why
// game.Event does not need to carry the cleared cells.
type LineClear struct {
	Rows []int
	Age  float64
	Life float64
}

// Phase is the current stage.
func (c LineClear) Phase() ClearPhase {
	if c.Life <= 0 {
		return ClearCollapse
	}
	switch f := c.Age / c.Life; {
	case f < 0.3:
		return ClearCriticalMass
	case f < 0.75:
		return ClearSupernova
	default:
		return ClearCollapse
	}
}

// TrailCell is one fading afterimage of a piece cell, in board-cell space (§17).
// It carries its piece kind so render can colour it; fx stays colour-free.
type TrailCell struct {
	X, Y int
	Fade float64
	Kind game.PieceKind
}
```

Move `maxStepSeconds` out of `particle.go` — it lives here now.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/fx/events.go internal/fx/particle.go internal/fx/events_test.go
git commit -m "feat(fx): shake, shockwave, hyperdrive, border energy and clear phases"
```

---
### Task 4: Mission Control and the flavour voice

**Files:**
- Create: `internal/flavor/messages.go`
- Test: `internal/flavor/messages_test.go`

**Interfaces:**
- Consumes: `game.Event`, `game.PieceKind`, `math/rand/v2`.
- Produces: `func Pick(rng *rand.Rand, from []string) string`; `var Idle, Lock, Clear, Tetris, LevelUp, Combo, Rare []string`; `func TetrisBanner(rng *rand.Rand) string`; `func LevelSubtitle(rng *rand.Rand) string`; `func ComboLine(rng *rand.Rand, combo int) string`; `type Channel struct{ ... }`; `func NewChannel(seed int64) *Channel`; `func (c *Channel) Observe(evs []game.Event)`; `func (c *Channel) Update(dt time.Duration)`; `func (c *Channel) Line() string`; `func (c *Channel) Pulse() float64`.

`Channel` is the one-line status channel from §27 with the two rules that section actually imposes: messages are event-triggered, and they are given time to breathe. A message holds for `MessageHold` and a lower-priority event cannot interrupt a higher-priority one that is still fresh. `Channel` lives in `flavor`, not `fx`, so `--no-fx` still has commentary (§32: the boring mode is still a good game).

- [ ] **Step 1: Write the failing test**

Create `internal/flavor/messages_test.go`:

```go
package flavor

import (
	"math/rand/v2"
	"strings"
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func rng() *rand.Rand { return rand.New(rand.NewPCG(0x5EED, 0x1234)) }

func TestPickReturnsAMemberAndHandlesEmpty(t *testing.T) {
	list := []string{"A", "B", "C"}
	for i := 0; i < 50; i++ {
		got := Pick(rng(), list)
		if got != "A" && got != "B" && got != "C" {
			t.Fatalf("Pick returned %q", got)
		}
	}
	if got := Pick(rng(), nil); got != "" {
		t.Errorf("Pick(nil) = %q, want the empty string", got)
	}
}

func TestMessageTablesAreNonEmptyAndUppercase(t *testing.T) {
	tables := map[string][]string{
		"Idle": Idle, "Lock": Lock, "Clear": Clear, "Tetris": Tetris,
		"LevelUp": LevelUp, "Combo": Combo, "Rare": Rare,
	}
	for name, table := range tables {
		if len(table) < 3 {
			t.Errorf("%s has %d messages, want at least 3", name, len(table))
		}
		for _, m := range table {
			if m == "" {
				t.Errorf("%s contains an empty message", name)
			}
			if strings.ToUpper(m) != m {
				t.Errorf("%s message %q is not upper case; the status channel shouts", name, m)
			}
			if len(m) > 52 {
				t.Errorf("%s message %q is %d chars; it will not fit the mission line", name, m, len(m))
			}
		}
	}
}

func TestSpecMessagesArePresent(t *testing.T) {
	all := strings.Join(append(append(append([]string{}, Idle...), Lock...), append(Clear...)...), "|")
	all += "|" + strings.Join(append(append([]string{}, Tetris...), Rare...), "|")
	all += "|" + strings.Join(append(append([]string{}, LevelUp...), Combo...), "|")
	for _, want := range []string{
		"NOMINALISH",                          // §27
		"GRAVITY REMAINS MOSTLY LEGAL",        // §27
		"TETROMINO INJECTION SUCCESSFUL",      // §27
		"MOON NOTIFIED",                       // §27
		"GRAVITY TAX INCREASED",               // §22
		"NUMBER BECAME BIGGER",                // §45
		"KINETIC ROD DEPLOYED",                // §45
		"CUBE ADJACENT OBJECT SECURED",        // §45
	} {
		if !strings.Contains(all, want) {
			t.Errorf("the message tables are missing %q", want)
		}
	}
}

func TestTetrisBannerAndLevelSubtitle(t *testing.T) {
	if got := TetrisBanner(rng()); got == "" {
		t.Error("TetrisBanner returned nothing")
	}
	if got := LevelSubtitle(rng()); got == "" {
		t.Error("LevelSubtitle returned nothing")
	}
}

func TestComboLineNamesTheCombo(t *testing.T) {
	got := ComboLine(rng(), 5)
	if !strings.Contains(got, "COMBO 5") {
		t.Errorf("ComboLine(5) = %q, want it to mention COMBO 5 (§21)", got)
	}
	if !strings.Contains(got, "//") {
		t.Errorf("ComboLine(5) = %q, want §21's COMBO n // REASON shape", got)
	}
}

func TestChannelStartsNominalish(t *testing.T) {
	c := NewChannel(1)
	if got := c.Line(); got != "NOMINALISH" {
		t.Errorf("opening line = %q, want NOMINALISH (§27)", got)
	}
}

func TestChannelReactsToEvents(t *testing.T) {
	c := NewChannel(1)
	before := c.Line()
	c.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{21}, Level: 1}})
	if c.Line() == before {
		t.Error("a line clear did not change the mission line")
	}
}

func TestHigherPriorityEventsWinAndLowerOnesDoNotInterrupt(t *testing.T) {
	c := NewChannel(1)
	c.Observe([]game.Event{{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}, Level: 3}})
	tetrisLine := c.Line()
	c.Observe([]game.Event{{Kind: game.EventPieceLocked}})
	if c.Line() != tetrisLine {
		t.Errorf("a lock overwrote a fresh four-line message: %q", c.Line())
	}
	c.Update(MessageHold + time.Second)
	c.Observe([]game.Event{{Kind: game.EventPieceLocked}})
	if c.Line() == tetrisLine {
		t.Error("after the hold expired a lock should be able to speak")
	}
}

func TestMessagesAreGivenTimeToBreathe(t *testing.T) {
	// §27: do not rotate messages constantly.
	c := NewChannel(1)
	c.Observe([]game.Event{{Kind: game.EventPieceLocked}})
	first := c.Line()
	for i := 0; i < 20; i++ {
		c.Update(20 * time.Millisecond)
		c.Observe([]game.Event{{Kind: game.EventPieceLocked}})
		if c.Line() != first {
			t.Fatalf("line changed to %q after %dms; messages must hold for %v",
				c.Line(), (i+1)*20, MessageHold)
		}
	}
}

func TestKineticRodAndCubeEasterEggs(t *testing.T) {
	// §45: hard-dropping a vertical I, and holding an O.
	c := NewChannel(1)
	c.Observe([]game.Event{{
		Kind:  game.EventPieceHardDropped,
		Piece: game.Piece{Kind: game.KindI, Rotation: 1},
	}})
	if c.Line() != "KINETIC ROD DEPLOYED" {
		t.Errorf("line = %q, want KINETIC ROD DEPLOYED", c.Line())
	}

	c2 := NewChannel(1)
	c2.Observe([]game.Event{{Kind: game.EventHoldUsed, Piece: game.Piece{Kind: game.KindO}}})
	if c2.Line() != "CUBE ADJACENT OBJECT SECURED" {
		t.Errorf("line = %q, want CUBE ADJACENT OBJECT SECURED", c2.Line())
	}
}

func TestComboFourAndUpPulsesTheHUD(t *testing.T) {
	// §21: at combo 4 the HUD begins pulsing.
	c := NewChannel(1)
	if got := c.Pulse(); got != 0 {
		t.Fatalf("resting Pulse = %v, want 0", got)
	}
	c.Observe([]game.Event{{Kind: game.EventComboChanged, Combo: 2}})
	if got := c.Pulse(); got != 0 {
		t.Errorf("Pulse at combo 2 = %v, want 0", got)
	}
	c.Observe([]game.Event{{Kind: game.EventComboChanged, Combo: 4}})
	if got := c.Pulse(); got <= 0 {
		t.Errorf("Pulse at combo 4 = %v, want a positive pulse", got)
	}
	c.Observe([]game.Event{{Kind: game.EventComboChanged, Combo: 0}})
	if got := c.Pulse(); got != 0 {
		t.Errorf("Pulse after the combo broke = %v, want 0", got)
	}
}

func TestIdleChatterEventuallySpeaksAndThenStops(t *testing.T) {
	// §45's long-idle line, and §27's "do not rotate constantly".
	c := NewChannel(1)
	changes := 0
	last := c.Line()
	for i := 0; i < 60*60; i++ { // one simulated minute at 60 Hz
		c.Update(16 * time.Millisecond)
		if c.Line() != last {
			changes++
			last = c.Line()
		}
	}
	if changes == 0 {
		t.Error("the channel never said anything in a minute of idling")
	}
	if changes > 12 {
		t.Errorf("%d idle messages in one minute; that is constant rotation", changes)
	}
}

func TestChannelIsDeterministicForASeed(t *testing.T) {
	run := func() []string {
		c := NewChannel(0xC0FFEE)
		var out []string
		for i := 0; i < 300; i++ {
			c.Update(16 * time.Millisecond)
			if i%37 == 0 {
				c.Observe([]game.Event{{Kind: game.EventPieceLocked}})
			}
			out = append(out, c.Line())
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

func TestLineIsNeverEmpty(t *testing.T) {
	c := NewChannel(7)
	for i := 0; i < 500; i++ {
		c.Update(33 * time.Millisecond)
		c.Observe([]game.Event{{Kind: game.EventKind(i % 9)}})
		if c.Line() == "" {
			t.Fatal("the mission line went empty")
		}
	}
}
```

Note on `TestSpecMessagesArePresent`: the `append(Clear...)` expression as written will not compile. Write the concatenation plainly instead:

```go
	var all []string
	for _, table := range [][]string{Idle, Lock, Clear, Tetris, LevelUp, Combo, Rare} {
		all = append(all, table...)
	}
	joined := strings.Join(all, "|")
```

and check `strings.Contains(joined, want)`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/flavor/ -run TestPickReturns -v`
Expected: FAIL — `undefined: Pick`.

- [ ] **Step 3: Write the implementation**

Create `internal/flavor/messages.go`:

```go
// Package flavor is Mission Control's voice: the one-line status channel from
// §27, the banners, and the small easter eggs from §45.
//
// It lives outside fx so that --no-fx still has commentary. Its randomness comes
// from its own generator, never the game's (§35).
package flavor

import (
	"fmt"
	"math/rand/v2"
	"time"

	"cosmic-tetris/internal/game"
)

// MessageHold is how long a message stays before anything of equal or lower
// priority may replace it. §27: give them time to breathe.
const MessageHold = 2200 * time.Millisecond

// IdleGap is how long the channel waits before filling silence with chatter.
const IdleGap = 7 * time.Second

// Message tables. All upper case: the status channel shouts.
var (
	// Idle is filler for quiet stretches.
	Idle = []string{
		"NOMINALISH",
		"GRAVITY REMAINS MOSTLY LEGAL",
		"STRUCTURAL VIBES: QUESTIONABLE",
		"LOCAL UNIVERSE STABLE*",
		"* DEFINITION OF STABLE UNDER REVIEW",
		"PHYSICS TEAM SAYS KEEP GOING",
		"CAPTAIN?",
	}

	// Lock follows an ordinary placement.
	Lock = []string{
		"TETROMINO INJECTION SUCCESSFUL",
		"GEOMETRY ACCEPTED",
		"BLOCK FILED UNDER MISCELLANEOUS",
		"ORBITAL OSHA HAS ENTERED THE CHAT",
	}

	// Clear follows a one-, two- or three-row clear.
	Clear = []string{
		"ROW DECOMMISSIONED",
		"MATTER SUCCESSFULLY DELETED",
		"MOON NOTIFIED",
		"WE HAVE EXCEEDED THE RECOMMENDED NUMBER OF BLOCKS",
	}

	// Tetris follows a four-row clear and doubles as banner copy (§20).
	Tetris = []string{
		"✦ EVENT HORIZON ✦",
		"QUADRUPLE COSMIC INCIDENT",
		"FOUR ROWS HAVE LEFT THE CHAT",
		"SPACE-TIME HAS FILED A COMPLAINT",
	}

	// LevelUp are §22's gravity-anomaly subtitles.
	LevelUp = []string{
		"GRAVITY TAX INCREASED",
		"LOCAL PHYSICS UPDATED WITHOUT CONSENT",
		"PLEASE SECURE ALL LOOSE TETROMINOES",
	}

	// Combo are §21's escalating combo reasons.
	Combo = []string{
		"UNAUTHORIZED ORBITAL MANEUVER",
		"STRUCTURAL REALITY FAILURE",
		"NASA DENIES EVERYTHING",
		"MISSION CONTROL HAS LOST CONTROL OF THE MISSION",
	}

	// Rare are §45's occasional oddities.
	Rare = []string{
		"DID YOU KNOW YOU'RE IN A TERMINAL?",
		"NUMBER BECAME BIGGER",
		"THE MOON HAS STOPPED RETURNING CALLS",
	}
)

// Pick chooses one message. An empty table yields "".
func Pick(rng *rand.Rand, from []string) string {
	if len(from) == 0 {
		return ""
	}
	return from[rng.IntN(len(from))]
}

// TetrisBanner is the headline for a four-line clear (§20).
func TetrisBanner(rng *rand.Rand) string { return Pick(rng, Tetris) }

// LevelSubtitle is the subtitle for a gravity anomaly (§22).
func LevelSubtitle(rng *rand.Rand) string { return Pick(rng, LevelUp) }

// ComboLine renders §21's "COMBO n // REASON".
func ComboLine(rng *rand.Rand, combo int) string {
	return fmt.Sprintf("COMBO %d // %s", combo, Pick(rng, Combo))
}

// priority orders who gets to speak. A fresh message cannot be replaced by
// something of equal or lower priority until MessageHold has passed.
type priority uint8

const (
	prioIdle priority = iota
	prioLock
	prioClear
	prioEvent
	prioMajor
)

// Channel is the mission-control status line (§27).
type Channel struct {
	rng   *rand.Rand
	line  string
	prio  priority
	age   time.Duration
	quiet time.Duration
	pulse float64
	combo int
}

// NewChannel returns a channel with its own generator. The seed must not be the
// game's generator (§35); the caller derives it from the run's seed.
func NewChannel(seed int64) *Channel {
	return &Channel{
		rng:  rand.New(rand.NewPCG(uint64(seed), 0x243F6A8885A308D3)),
		line: "NOMINALISH",
		prio: prioIdle,
	}
}

// Line is the current message. Never empty.
func (c *Channel) Line() string {
	if c.line == "" {
		return "NOMINALISH"
	}
	return c.line
}

// Pulse is the HUD pulse intensity, non-zero from combo 4 up (§21).
func (c *Channel) Pulse() float64 { return c.pulse }

// say replaces the line if the new message outranks what is on screen or the
// current one has had its time.
func (c *Channel) say(p priority, msg string) {
	if msg == "" {
		return
	}
	if p <= c.prio && c.age < MessageHold {
		return
	}
	c.line, c.prio, c.age, c.quiet = msg, p, 0, 0
}

// Observe reacts to engine events.
func (c *Channel) Observe(evs []game.Event) {
	for _, e := range evs {
		switch e.Kind {
		case game.EventPieceHardDropped:
			if e.Piece.Kind == game.KindI && e.Piece.Rotation%2 == 1 {
				c.say(prioEvent, "KINETIC ROD DEPLOYED") // §45
			}
		case game.EventHoldUsed:
			if e.Piece.Kind == game.KindO {
				c.say(prioEvent, "CUBE ADJACENT OBJECT SECURED") // §45
			}
		case game.EventPieceLocked:
			c.say(prioLock, Pick(c.rng, Lock))
		case game.EventLinesCleared:
			if len(e.Rows) >= 4 {
				c.say(prioMajor, Pick(c.rng, Tetris))
			} else {
				c.say(prioClear, Pick(c.rng, Clear))
			}
		case game.EventComboChanged:
			c.combo = e.Combo
			if e.Combo >= 4 {
				c.pulse = 1
			} else {
				c.pulse = 0
			}
			if e.Combo >= 5 {
				c.say(prioMajor, ComboLine(c.rng, e.Combo))
			} else if e.Combo >= 2 {
				c.say(prioEvent, ComboLine(c.rng, e.Combo))
			}
		case game.EventLevelChanged:
			c.say(prioMajor, Pick(c.rng, LevelUp))
		case game.EventGameOver:
			c.say(prioMajor, "SIGNAL LOST")
		}
	}
}

// Update ages the current message and fills long silences with chatter.
func (c *Channel) Update(dt time.Duration) {
	if dt <= 0 {
		return
	}
	c.age += dt
	c.quiet += dt
	if c.pulse > 0 && c.combo >= 4 {
		// The pulse itself is a steady oscillation; render turns it into
		// brightness. Keep it at full while the combo stands.
		c.pulse = 1
	}
	if c.quiet >= IdleGap {
		table := Idle
		if c.rng.IntN(12) == 0 {
			table = Rare // §45: keep the oddities occasional
		}
		c.line, c.prio, c.age, c.quiet = Pick(c.rng, table), prioIdle, 0, 0
	}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/flavor/ -v`
Expected: PASS. If `TestIdleChatterEventuallySpeaksAndThenStops` reports too many changes, raise `IdleGap`; do not weaken the test — §27 is explicit that messages must not rotate constantly.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/flavor/messages.go internal/flavor/messages_test.go
git commit -m "feat(flavor): mission control status channel and banner copy"
```

---
### Task 5: The FX world

**Files:**
- Create: `internal/fx/world.go`
- Test: `internal/fx/world_test.go`

**Interfaces:**
- Consumes: everything in `fx` so far, `flavor`, `game.Event`.
- Produces: `type Options struct{ Seed int64; Enabled, ReducedMotion bool }`; `type World struct{ ... }`; `func NewWorld(opts Options) *World`; `func (w *World) Enabled() bool`; `func (w *World) ReducedMotion() bool`; `func (w *World) Resize(width, height int)`; `func (w *World) Observe(evs []game.Event)`; `func (w *World) Update(dt time.Duration)`; `func (w *World) Stars() []Star`; `func (w *World) Particles() []Particle`; `func (w *World) Trails() []TrailCell`; `func (w *World) Clears() []LineClear`; `func (w *World) Shockwaves() []Shockwave`; `func (w *World) ShakeOffset() (int, int)`; `func (w *World) BorderPhase() float64`; `func (w *World) BorderEnergy() float64`; `func (w *World) Banner() (Banner, bool)`; `func (w *World) StarSpeed() float64`; `func (w *World) Level() int`.

`Observe` takes `[]game.Event` and nothing else. That signature is §14's guarantee: there is no `*game.Game` in scope, so no amount of carelessness inside `fx` can write to game state.

A disabled world (`--no-fx`) accepts every call and produces nothing: no stars, no particles, zero shake, zero border energy, no banner. That is what makes Task 10's "no-fx output equals the Plan 2 goldens" test possible.

- [ ] **Step 1: Write the failing test**

Create `internal/fx/world_test.go`:

```go
package fx

import (
	"os"
	"strings"
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func newTestWorld(t *testing.T) *World {
	t.Helper()
	w := NewWorld(Options{Seed: 0xBEEF, Enabled: true})
	w.Resize(80, 30)
	return w
}

func hardDrop(distance int) game.Event {
	return game.Event{
		Kind:     game.EventPieceHardDropped,
		Piece:    game.Piece{Kind: game.KindT, X: 3, Y: 18},
		Distance: distance,
	}
}

func clearOf(n int) game.Event {
	rows := make([]int, n)
	for i := range rows {
		rows[i] = game.Height - 1 - i
	}
	return game.Event{Kind: game.EventLinesCleared, Rows: rows, Level: 3, Combo: 1}
}

func TestFXNeverReferencesTheGameStruct(t *testing.T) {
	// §14: the FX system may never modify GameState. It observes []game.Event
	// values, so a *game.Game must never appear in this package.
	entries, err := os.ReadDir(".")
	if err != nil {
		t.Fatal(err)
	}
	for _, e := range entries {
		if !strings.HasSuffix(e.Name(), ".go") || strings.HasSuffix(e.Name(), "_test.go") {
			continue
		}
		src, err := os.ReadFile(e.Name())
		if err != nil {
			t.Fatal(err)
		}
		for _, forbidden := range []string{"*game.Game", "game.Game{", "game.New(", "game.Snapshot"} {
			if strings.Contains(string(src), forbidden) {
				t.Errorf("%s mentions %q; fx must only see game events", e.Name(), forbidden)
			}
		}
	}
}

func TestDisabledWorldProducesNothing(t *testing.T) {
	w := NewWorld(Options{Seed: 1, Enabled: false})
	w.Resize(80, 30)
	w.Observe([]game.Event{hardDrop(12), clearOf(4), {Kind: game.EventLevelChanged, Level: 5}})
	w.Update(500 * time.Millisecond)

	if w.Enabled() {
		t.Error("Enabled reports true for a disabled world")
	}
	if n := len(w.Stars()); n != 0 {
		t.Errorf("%d stars in a disabled world", n)
	}
	if n := len(w.Particles()); n != 0 {
		t.Errorf("%d particles in a disabled world", n)
	}
	if n := len(w.Trails()); n != 0 {
		t.Errorf("%d trails in a disabled world", n)
	}
	if n := len(w.Clears()); n != 0 {
		t.Errorf("%d clears in a disabled world", n)
	}
	if n := len(w.Shockwaves()); n != 0 {
		t.Errorf("%d shockwaves in a disabled world", n)
	}
	if dx, dy := w.ShakeOffset(); dx != 0 || dy != 0 {
		t.Errorf("shake offset (%d,%d) in a disabled world", dx, dy)
	}
	if got := w.BorderEnergy(); got != 0 {
		t.Errorf("border energy %v in a disabled world", got)
	}
	if _, ok := w.Banner(); ok {
		t.Error("a disabled world raised a banner")
	}
}

func TestEnabledWorldHasAStarfieldAfterResize(t *testing.T) {
	w := newTestWorld(t)
	if len(w.Stars()) == 0 {
		t.Fatal("no starfield")
	}
}

func TestMovementLeavesATrailThatExpires(t *testing.T) {
	w := newTestWorld(t)
	w.Observe([]game.Event{{
		Kind:  game.EventPieceMoved,
		Piece: game.Piece{Kind: game.KindS, X: 4, Y: 8},
	}})
	if len(w.Trails()) == 0 {
		t.Fatal("a move left no trail (§17)")
	}
	for _, c := range w.Trails() {
		if c.Kind != game.KindS {
			t.Errorf("trail cell carries kind %v, want KindS", c.Kind)
		}
		if c.Fade <= 0 || c.Fade > 1 {
			t.Errorf("trail fade %v out of range", c.Fade)
		}
	}
	w.Update(TrailLife * 2)
	if n := len(w.Trails()); n != 0 {
		t.Errorf("%d trails after twice their lifetime", n)
	}
}

func TestRotationAlsoLeavesATrail(t *testing.T) {
	w := newTestWorld(t)
	w.Observe([]game.Event{{
		Kind:  game.EventPieceRotated,
		Piece: game.Piece{Kind: game.KindJ, X: 4, Y: 8},
	}})
	if len(w.Trails()) == 0 {
		t.Error("a rotation left no trail")
	}
}

func TestHardDropShakesFlashesAndEmitsDebris(t *testing.T) {
	w := newTestWorld(t)
	w.Observe([]game.Event{hardDrop(14)})
	if dx, dy := w.ShakeOffset(); dx == 0 && dy == 0 {
		t.Error("hard drop did not shake the board (§18)")
	}
	if w.BorderEnergy() <= 0 {
		t.Error("hard drop did not flash the border (§18)")
	}
	if len(w.Particles()) == 0 {
		t.Error("hard drop emitted no impact particles (§18)")
	}
	if len(w.Trails()) == 0 {
		t.Error("hard drop left no vertical ion trail (§18)")
	}
}

func TestHardDropTrailSpansTheCellsCrossed(t *testing.T) {
	w := newTestWorld(t)
	w.Observe([]game.Event{hardDrop(10)})
	minY, maxY := 999, -999
	for _, c := range w.Trails() {
		if c.Y < minY {
			minY = c.Y
		}
		if c.Y > maxY {
			maxY = c.Y
		}
	}
	if maxY-minY < 8 {
		t.Errorf("ion trail spans %d rows, want about the 10 crossed", maxY-minY)
	}
}

func TestSingleClearAnimatesAndPulsesTheBorder(t *testing.T) {
	w := newTestWorld(t)
	w.Observe([]game.Event{clearOf(1)})
	clears := w.Clears()
	if len(clears) != 1 {
		t.Fatalf("%d clear animations, want 1", len(clears))
	}
	if len(clears[0].Rows) != 1 {
		t.Errorf("clear covers %d rows, want 1", len(clears[0].Rows))
	}
	if w.BorderEnergy() <= 0 {
		t.Error("a clear did not react on the border (§43)")
	}
	w.Update(ClearLife * 2)
	if n := len(w.Clears()); n != 0 {
		t.Errorf("%d clears after twice their lifetime", n)
	}
}

func TestFourLineClearTriggersEverything(t *testing.T) {
	// §20: hyperdrive, larger shake, border pulse, particle eruption,
	// star density increase, giant banner — simultaneously.
	w := newTestWorld(t)
	stars := len(w.Stars())
	w.Observe([]game.Event{clearOf(4)})

	if w.StarSpeed() <= 1 {
		t.Errorf("StarSpeed = %v, want hyperdrive engaged", w.StarSpeed())
	}
	if dx, dy := w.ShakeOffset(); dx == 0 && dy == 0 {
		t.Error("no shake on a four-line clear")
	}
	if w.BorderEnergy() < 0.9 {
		t.Errorf("border energy %v, want a near-full pulse", w.BorderEnergy())
	}
	if len(w.Particles()) < 40 {
		t.Errorf("%d particles, want an eruption", len(w.Particles()))
	}
	b, ok := w.Banner()
	if !ok || b.Text == "" {
		t.Error("no banner on a four-line clear")
	}
	w.Update(16 * time.Millisecond)
	if len(w.Stars()) <= stars {
		t.Errorf("%d stars, want the temporary density increase above %d", len(w.Stars()), stars)
	}
	w.Update(BannerLife * 2)
	if _, ok := w.Banner(); ok {
		t.Error("banner outlived its duration")
	}
}

func TestFourLineClearShakesHarderThanAHardDrop(t *testing.T) {
	dur := func(e game.Event) int {
		w := newTestWorld(t)
		w.Observe([]game.Event{e})
		n := 0
		for i := 0; i < 200; i++ {
			dx, dy := w.ShakeOffset()
			if dx != 0 || dy != 0 {
				n++
			}
			w.Update(8 * time.Millisecond)
		}
		return n
	}
	if drop, tetris := dur(hardDrop(12)), dur(clearOf(4)); tetris <= drop {
		t.Errorf("four-line shake lasted %d frames, hard drop %d: §20 wants larger", tetris, drop)
	}
}

func TestCombosEscalate(t *testing.T) {
	// §21: sparks at 2, meteors at 3, chaos at 5+.
	count := func(combo int) int {
		w := newTestWorld(t)
		w.Observe([]game.Event{{Kind: game.EventComboChanged, Combo: combo, Level: 2}})
		return len(w.Particles())
	}
	c2, c3, c6 := count(2), count(3), count(6)
	if c2 == 0 {
		t.Error("combo 2 produced no sparks")
	}
	if c3 <= c2 {
		t.Errorf("combo 3 (%d particles) does not escalate past combo 2 (%d)", c3, c2)
	}
	if c6 <= c3 {
		t.Errorf("combo 6 (%d particles) does not escalate past combo 3 (%d)", c6, c3)
	}
	w := newTestWorld(t)
	w.Observe([]game.Event{{Kind: game.EventComboChanged, Combo: 6, Level: 2}})
	if len(w.Shockwaves()) == 0 {
		t.Error("a large combo produced no shockwave (§24)")
	}
	if w.StarSpeed() <= 1 {
		t.Error("a large combo did not trigger hyperdrive (§16)")
	}
}

func TestComboOneOrZeroIsCalm(t *testing.T) {
	w := newTestWorld(t)
	w.Observe([]game.Event{{Kind: game.EventComboChanged, Combo: 1}})
	if len(w.Particles()) != 0 || len(w.Shockwaves()) != 0 {
		t.Error("combo 1 should not escalate anything")
	}
}

func TestLevelChangeRaisesTheBannerAndStarSpeed(t *testing.T) {
	w := newTestWorld(t)
	base := w.StarSpeed()
	w.Observe([]game.Event{{Kind: game.EventLevelChanged, Level: 9}})
	if w.Level() != 9 {
		t.Errorf("Level = %d, want 9", w.Level())
	}
	if w.StarSpeed() <= base {
		t.Errorf("StarSpeed = %v at level 9, want faster than %v at level 1 (§15)", w.StarSpeed(), base)
	}
	b, ok := w.Banner()
	if !ok {
		t.Fatal("no level-up banner (§22)")
	}
	if !strings.Contains(b.Text, "GRAVITY ANOMALY") {
		t.Errorf("banner text = %q, want §22's GRAVITY ANOMALY headline", b.Text)
	}
	if !strings.Contains(b.Sub, "LEVEL") {
		t.Errorf("banner sub = %q, want it to name the level", b.Sub)
	}
}

func TestStarSpeedIsCapped(t *testing.T) {
	w := newTestWorld(t)
	w.Observe([]game.Event{{Kind: game.EventLevelChanged, Level: 99}})
	w.Update(2 * time.Second) // let hyperdrive finish
	if got := w.StarSpeed(); got > 3 {
		t.Errorf("StarSpeed = %v at level 99, want a capped subtle increase (§15)", got)
	}
}

func TestLockEmitsASmallPuff(t *testing.T) {
	w := newTestWorld(t)
	w.Observe([]game.Event{{
		Kind:  game.EventPieceLocked,
		Piece: game.Piece{Kind: game.KindL, X: 3, Y: 19},
	}})
	if len(w.Particles()) == 0 {
		t.Error("a lock emitted nothing at all")
	}
}

func TestReducedMotionSuppressesShakeHyperdriveAndShockwaves(t *testing.T) {
	// §49.5: suppress shake, hyperdrive acceleration and shockwaves; leave
	// colour, trails and particles alone.
	w := NewWorld(Options{Seed: 3, Enabled: true, ReducedMotion: true})
	w.Resize(80, 30)
	w.Observe([]game.Event{hardDrop(14), clearOf(4), {Kind: game.EventComboChanged, Combo: 7}})

	if !w.ReducedMotion() {
		t.Error("ReducedMotion reports false")
	}
	if dx, dy := w.ShakeOffset(); dx != 0 || dy != 0 {
		t.Errorf("shake offset (%d,%d) under reduced motion", dx, dy)
	}
	if got := w.StarSpeed(); got > 2 {
		t.Errorf("StarSpeed = %v under reduced motion, want no hyperdrive", got)
	}
	if n := len(w.Shockwaves()); n != 0 {
		t.Errorf("%d shockwaves under reduced motion", n)
	}
	if len(w.Particles()) == 0 {
		t.Error("reduced motion should keep particles")
	}
	if len(w.Trails()) == 0 {
		t.Error("reduced motion should keep trails")
	}
	if w.BorderEnergy() <= 0 {
		t.Error("reduced motion should keep the border reacting")
	}
	if _, ok := w.Banner(); !ok {
		t.Error("reduced motion should keep banners")
	}
}

func TestUpdateSurvivesAHugeDelta(t *testing.T) {
	// Review Focus 1: a suspended terminal resumes with minutes of elapsed time.
	w := newTestWorld(t)
	w.Observe([]game.Event{hardDrop(12), clearOf(4)})
	w.Update(10 * time.Minute)
	for _, p := range w.Particles() {
		if p.X != p.X || p.Y != p.Y { // NaN check
			t.Fatalf("non-finite particle %+v", p)
		}
	}
	if dx, dy := w.ShakeOffset(); dx < -1 || dx > 1 || dy < -1 || dy > 1 {
		t.Errorf("shake offset (%d,%d) after a huge delta", dx, dy)
	}
	for _, s := range w.Stars() {
		if s.Y < 0 || s.Y > 30 {
			t.Fatalf("star escaped after a huge delta: %+v", s)
		}
	}
	w.Update(-5 * time.Second)
	w.Update(0)
}

func TestEventFloodStaysWithinBudget(t *testing.T) {
	// Review Focus 2: twenty events on one frame, repeatedly.
	w := newTestWorld(t)
	flood := []game.Event{}
	for i := 0; i < 20; i++ {
		flood = append(flood, hardDrop(12), clearOf(4), game.Event{Kind: game.EventComboChanged, Combo: 15})
	}
	for i := 0; i < 100; i++ {
		w.Observe(flood)
		w.Update(16 * time.Millisecond)
		if n := len(w.Particles()); n > MaxParticles {
			t.Fatalf("%d particles, over the %d cap", n, MaxParticles)
		}
		if n := len(w.Clears()); n > MaxClears {
			t.Fatalf("%d clear animations, over the %d cap", n, MaxClears)
		}
		if n := len(w.Shockwaves()); n > MaxShockwaves {
			t.Fatalf("%d shockwaves, over the %d cap", n, MaxShockwaves)
		}
		if n := len(w.Trails()); n > MaxTrails {
			t.Fatalf("%d trail cells, over the %d cap", n, MaxTrails)
		}
	}
}

func TestWorldIsDeterministicForASeed(t *testing.T) {
	run := func() []Particle {
		w := NewWorld(Options{Seed: 0xD15EA5E, Enabled: true})
		w.Resize(80, 30)
		for i := 0; i < 120; i++ {
			if i%20 == 0 {
				w.Observe([]game.Event{hardDrop(9), clearOf(2)})
			}
			w.Update(16 * time.Millisecond)
		}
		out := make([]Particle, len(w.Particles()))
		copy(out, w.Particles())
		return out
	}
	a, b := run(), run()
	if len(a) != len(b) {
		t.Fatalf("particle counts %d vs %d", len(a), len(b))
	}
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("particle %d differs: %+v vs %+v", i, a[i], b[i])
		}
	}
}

func TestDifferentSeedsDiverge(t *testing.T) {
	mk := func(seed int64) *World {
		w := NewWorld(Options{Seed: seed, Enabled: true})
		w.Resize(80, 30)
		w.Observe([]game.Event{hardDrop(12)})
		return w
	}
	a, b := mk(1), mk(2)
	same := true
	for i := range a.Particles() {
		if i < len(b.Particles()) && a.Particles()[i] != b.Particles()[i] {
			same = false
		}
	}
	if same {
		t.Error("two seeds produced identical effects; the FX RNG is not seeded")
	}
}

func TestResizeMidEffectKeepsEverythingValid(t *testing.T) {
	// Review Focus 5: shrink while particles are in flight.
	w := newTestWorld(t)
	w.Observe([]game.Event{hardDrop(14), clearOf(4)})
	for _, size := range [][2]int{{40, 24}, {0, 0}, {300, 100}, {1, 1}, {80, 30}} {
		w.Resize(size[0], size[1])
		w.Update(16 * time.Millisecond)
		width, height := size[0], size[1]
		for _, s := range w.Stars() {
			if s.X < 0 || s.X > float64(width) || s.Y < 0 || s.Y > float64(height) {
				t.Fatalf("star %+v outside %dx%d", s, width, height)
			}
		}
	}
}

func TestObserveOnNilAndEmptyEventsIsSafe(t *testing.T) {
	w := newTestWorld(t)
	w.Observe(nil)
	w.Observe([]game.Event{})
	w.Observe([]game.Event{{}})
	w.Update(16 * time.Millisecond)
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/fx/ -run TestDisabledWorld -v`
Expected: FAIL — `undefined: NewWorld`.

- [ ] **Step 3: Write the implementation**

Create `internal/fx/world.go`:

```go
package fx

import (
	"fmt"
	"math/rand/v2"
	"time"

	"cosmic-tetris/internal/flavor"
	"cosmic-tetris/internal/game"
)

// Budgets. Every list is capped so an event flood cannot grow memory (§38).
const (
	MaxTrails     = 256
	MaxClears     = 8
	MaxShockwaves = 6
)

// Options configures the effects simulation.
type Options struct {
	// Seed seeds the FX generator. It must be derived from, but is never, the
	// game's generator (§35, §49.6).
	Seed int64
	// Enabled is false under --no-fx: the world then produces nothing at all.
	Enabled bool
	// ReducedMotion suppresses shake, hyperdrive and shockwaves (§49.5).
	ReducedMotion bool
}

// World is the effects simulation. It observes game events and cannot reach game
// state: Observe takes []game.Event values and nothing else (§14).
type World struct {
	opts Options
	rng  *rand.Rand

	stars     Starfield
	particles Field
	trails    []TrailCell
	clears    []LineClear
	shocks    []Shockwave

	shake  Shake
	hyper  Hyperdrive
	border Border
	banner Banner

	level int
}

// NewWorld builds an effects world. Its generator is independent of the game's.
func NewWorld(opts Options) *World {
	return &World{
		opts:  opts,
		rng:   rand.New(rand.NewPCG(uint64(opts.Seed), 0xB5026F5AA96619E9)),
		level: 1,
	}
}

// Enabled reports whether effects are on.
func (w *World) Enabled() bool { return w.opts.Enabled }

// ReducedMotion reports whether motion effects are suppressed.
func (w *World) ReducedMotion() bool { return w.opts.ReducedMotion }

// Level is the last level the world was told about; it drives star speed.
func (w *World) Level() int { return w.level }

// Resize tells the starfield the terminal size. Only the starfield works in
// terminal coordinates; everything else lives in board-cell space.
func (w *World) Resize(width, height int) {
	if !w.opts.Enabled {
		return
	}
	w.stars.Resize(w.rng, width, height)
}

// particleBounds is the cull region in board-cell space: generous enough for
// debris to arc outside the board before dying.
var particleBounds = Bounds{
	MinX: -6,
	MinY: -6,
	MaxX: game.Width + 6,
	MaxY: game.Height + 8,
}

// Update advances every effect by dt. dt is clamped, so a terminal that was
// suspended for ten minutes resumes with one ordinary frame.
func (w *World) Update(dt time.Duration) {
	if !w.opts.Enabled || dt <= 0 {
		return
	}
	secs := dt.Seconds()
	if secs > maxStepSeconds {
		secs = maxStepSeconds
	}

	w.stars.Update(w.rng, secs, w.StarSpeed())
	w.particles.Update(secs, 9, 0.94, particleBounds)
	w.shake.Update(secs)
	w.hyper.Update(secs)
	w.border.Update(secs)

	// Trails fade.
	live := w.trails[:0]
	step := secs / TrailLife.Seconds()
	for _, c := range w.trails {
		c.Fade -= step
		if c.Fade > 0 {
			live = append(live, c)
		}
	}
	w.trails = live

	// Clears age out.
	liveClears := w.clears[:0]
	for _, c := range w.clears {
		c.Age += secs
		if c.Age < c.Life {
			// Phase C sheds debris as the row fragments (§19).
			if c.Phase() == ClearCollapse {
				w.emitClearDebris(c)
			}
			liveClears = append(liveClears, c)
		}
	}
	w.clears = liveClears

	// Shockwaves expand and die.
	liveShocks := w.shocks[:0]
	for _, s := range w.shocks {
		s.Age += secs
		if s.Age < s.Life {
			liveShocks = append(liveShocks, s)
		}
	}
	w.shocks = liveShocks

	if w.banner.Life > 0 {
		w.banner.Age += secs
		if w.banner.Age >= w.banner.Life {
			w.banner = Banner{}
		}
	}

	// A tiny shooting star, occasionally (§45).
	if w.rng.Float64() < secs*0.12 {
		w.particles.EmitSpray(w.rng, w.rng.Float64()*game.Width, -2, 6, 9, 0.08, 3, TintStar, 0, 4)
	}
}

// Observe reacts to engine events (§14). It reads values only.
func (w *World) Observe(evs []game.Event) {
	if !w.opts.Enabled {
		return
	}
	for _, e := range evs {
		switch e.Kind {
		case game.EventPieceMoved, game.EventPieceRotated:
			w.pushTrail(e.Piece, 1)

		case game.EventPieceHardDropped:
			w.hardDrop(e)

		case game.EventPieceLocked:
			w.lock(e.Piece)

		case game.EventLinesCleared:
			w.linesCleared(e)

		case game.EventComboChanged:
			w.comboChanged(e)

		case game.EventLevelChanged:
			w.levelChanged(e)
		}
	}
}

// pushTrail records the piece's cells as fading afterimages (§17).
func (w *World) pushTrail(p game.Piece, fade float64) {
	for _, c := range p.Cells() {
		if len(w.trails) >= MaxTrails {
			return
		}
		w.trails = append(w.trails, TrailCell{X: c.X, Y: c.Y, Fade: fade, Kind: p.Kind})
	}
}

// hardDrop is §18: ion trail, impact particles, screen shake, border flash.
func (w *World) hardDrop(e game.Event) {
	// 1. Vertical ion trail through the cells crossed.
	for d := 0; d <= e.Distance; d++ {
		ghost := e.Piece
		ghost.Y = e.Piece.Y - d
		w.pushTrail(ghost, 1-float64(d)/float64(e.Distance+1))
	}

	// 2. Impact particles from the contact area.
	strength := 0.4 + float64(e.Distance)/float64(game.VisibleRows)
	for _, c := range e.Piece.Cells() {
		w.particles.EmitBurst(w.rng, float64(c.X)+0.5, float64(c.Y)+0.5,
			int(6*strength)+3, 7*strength, TintDebris, e.Piece.Kind, 4)
	}

	// 3. Screen shake, and 4. border flash.
	w.triggerShake(strength)
	w.border.Pulse(0.5 * strength)
}

// lock is a small dust puff so an ordinary placement still feels physical.
func (w *World) lock(p game.Piece) {
	for _, c := range p.Cells() {
		w.particles.EmitBurst(w.rng, float64(c.X)+0.5, float64(c.Y)+0.5, 2, 2.5, TintDebris, p.Kind, 4)
	}
	w.border.Pulse(0.12)
}

// linesCleared starts §19's animation, and for four rows the §20 spectacle.
func (w *World) linesCleared(e game.Event) {
	if len(w.clears) < MaxClears {
		rows := make([]int, len(e.Rows))
		copy(rows, e.Rows)
		w.clears = append(w.clears, LineClear{Rows: rows, Life: ClearLife.Seconds()})
	}
	w.border.Pulse(0.35 + 0.15*float64(len(e.Rows)))

	if len(e.Rows) < 4 {
		return
	}
	// §20: a four-line clear is a major astronomical event.
	w.triggerHyperdrive()
	w.triggerShake(2.5)
	w.border.Pulse(1)
	w.stars.SetDensity(2.2)
	w.banner = Banner{
		Text: flavor.TetrisBanner(w.rng),
		Life: BannerLife.Seconds(),
	}
	centre := float64(game.Width) / 2
	for _, row := range e.Rows {
		y := float64(row) + 0.5
		for x := 0; x < game.Width; x++ {
			// Particles inherit horizontal velocity from their offset from the
			// centre of the row (§19).
			vx := (float64(x) + 0.5 - centre) * 2.2
			w.particles.EmitSpray(w.rng, float64(x)+0.5, y, vx, -4, 0.5, 2, TintFlash, 0, 4)
		}
	}
	w.addShockwave(centre, float64(e.Rows[len(e.Rows)/2]))
}

// comboChanged escalates with the combo (§21). Board readability stays sacred:
// the escalation is in particle count and border energy, never in anything that
// covers the board wholesale.
func (w *World) comboChanged(e game.Event) {
	switch {
	case e.Combo >= 5:
		w.triggerHyperdrive()
		w.addShockwave(float64(game.Width)/2, float64(game.Height)-6)
		w.border.Pulse(0.9)
		w.particles.EmitBurst(w.rng, float64(game.Width)/2, float64(game.Height)-8, 60, 9, TintFlash, 0, 4)
	case e.Combo >= 3:
		w.border.Pulse(0.5)
		w.particles.EmitBurst(w.rng, float64(game.Width)/2, float64(game.Height)-8, 24, 6, TintDebris, 0, 4)
	case e.Combo >= 2:
		w.border.Pulse(0.3)
		w.particles.EmitBurst(w.rng, float64(game.Width)/2, float64(game.Height)-8, 10, 4, TintFlash, 0, 4)
	}
}

// levelChanged raises §22's notification. It never pauses the game.
func (w *World) levelChanged(e game.Event) {
	if e.Level > 0 {
		w.level = e.Level
	}
	w.border.Pulse(0.7)
	w.banner = Banner{
		Text: "GRAVITY ANOMALY DETECTED",
		Sub:  fmt.Sprintf("LEVEL %02d · %s", w.level, flavor.LevelSubtitle(w.rng)),
		Life: BannerLife.Seconds(),
	}
}

// emitClearDebris sheds a few particles per frame during §19's collapse phase.
func (w *World) emitClearDebris(c LineClear) {
	centre := float64(game.Width) / 2
	for _, row := range c.Rows {
		x := w.rng.Float64() * game.Width
		vx := (x - centre) * 1.5
		w.particles.EmitSpray(w.rng, x, float64(row)+0.5, vx, 2, 0.6, 1, TintDebris, 0, 4)
	}
}

// triggerShake respects §49.5's reduced motion.
func (w *World) triggerShake(strength float64) {
	if w.opts.ReducedMotion {
		return
	}
	w.shake.Trigger(strength)
}

// triggerHyperdrive respects §49.5's reduced motion.
func (w *World) triggerHyperdrive() {
	if w.opts.ReducedMotion {
		return
	}
	w.hyper.Trigger()
}

// addShockwave respects §49.5's reduced motion and §24's "use sparingly".
func (w *World) addShockwave(x, y float64) {
	if w.opts.ReducedMotion || len(w.shocks) >= MaxShockwaves {
		return
	}
	w.shocks = append(w.shocks, Shockwave{X: x, Y: y, Life: ShockwaveLife.Seconds()})
}

// StarSpeed is the starfield multiplier: a subtle level ramp (§15) times any
// hyperdrive boost (§16).
func (w *World) StarSpeed() float64 {
	level := 1 + 0.06*float64(w.level-1)
	if level > 2 {
		level = 2
	}
	return level * w.hyper.Multiplier()
}

// Stars are the background specks, in terminal-cell space.
func (w *World) Stars() []Star { return w.stars.All() }

// Particles are the live particles, in board-cell space.
func (w *World) Particles() []Particle { return w.particles.All() }

// Trails are the fading piece afterimages, in board cells.
func (w *World) Trails() []TrailCell { return w.trails }

// Clears are the in-flight line-clear animations.
func (w *World) Clears() []LineClear { return w.clears }

// Shockwaves are the expanding rings, in board-cell space.
func (w *World) Shockwaves() []Shockwave { return w.shocks }

// ShakeOffset is the board displacement in whole cells, never more than one.
func (w *World) ShakeOffset() (int, int) { return w.shake.Offset() }

// BorderPhase is the border's resting colour position, in [0,1).
func (w *World) BorderPhase() float64 { return w.border.Phase() }

// BorderEnergy is the border's excitement level, in [0,1].
func (w *World) BorderEnergy() float64 { return w.border.Energy() }

// Banner returns the current headline, if any.
func (w *World) Banner() (Banner, bool) {
	if w.banner.Life <= 0 || w.banner.Text == "" {
		return Banner{}, false
	}
	return w.banner, true
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

Two failures to expect and fix properly rather than by loosening the test:
- `TestFourLineClearShakesHarderThanAHardDrop` requires the four-line strength (2.5) to exceed the hard-drop strength for a full-height drop; check `Shake.Trigger`'s clamp is above 2.5.
- `TestEventFloodStaysWithinBudget` fails if `pushTrail` is allowed past `MaxTrails` in the middle of a piece; it returns early per cell, which is correct.

- [ ] **Step 5: Prove the game and FX generators are separate**

Run:

```bash
grep -rn 'rand.New' internal/fx/*.go internal/game/*.go internal/flavor/*.go | grep -v '_test.go'
```

Expected: exactly one `rand.New` in `internal/game/game.go`, one in `internal/fx/world.go`, one in `internal/flavor/messages.go`, with three different second PCG words. No file passes a generator between packages.

- [ ] **Step 6: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/fx/world.go internal/fx/world_test.go
git commit -m "feat(fx): effects world observing game events"
```

---
### Task 6: Compositing FX into the frame

**Files:**
- Modify: `internal/render/palette.go` (tint resolution)
- Modify: `internal/render/board.go` (board-space FX layers, `DrawStack` no longer erases the background)
- Modify: `internal/render/render.go` (`View.FX`, starfield, §37 pipeline order)
- Test: `internal/render/fx_test.go`

**Interfaces:**
- Consumes: `fx.World` and its accessors, `Glyphs`, `Layout`, `Canvas`.
- Produces: `func TintPaint(t fx.Tint, k game.PieceKind, brightness float64) Paint`; `func StarPaint(layer uint8, bright float64) Paint`; `func TrailPaint(k game.PieceKind, fade float64) Paint`; `func boardPointXY(l Layout, x, y float64) (int, int, bool)`; `func DrawStars(c *Canvas, l Layout, g Glyphs, stars []fx.Star)`; `func DrawTrails(c *Canvas, l Layout, g Glyphs, cells []fx.TrailCell)`; `func DrawClears(c *Canvas, l Layout, g Glyphs, clears []fx.LineClear)`; `func DrawShockwaves(c *Canvas, l Layout, g Glyphs, waves []fx.Shockwave)`; `func DrawParticles(c *Canvas, l Layout, g Glyphs, ps []fx.Particle)`; `View.FX *fx.World` (nil means no effects).

Two rules make this readable rather than a mess:
- Inside the board interior only far-layer stars are drawn (§15: never make the background so busy that the board is harder to read).
- Board-local FX is composited *before* the active piece, so nothing can obscure it (§37 step 6 followed by §44's first rule; the active piece is redrawn last).

- [ ] **Step 1: Write the failing test**

Create `internal/render/fx_test.go`:

```go
package render

import (
	"strings"
	"testing"
	"time"

	"github.com/charmbracelet/x/ansi"

	"cosmic-tetris/internal/fx"
	"cosmic-tetris/internal/game"
)

// fxWorld returns a world with a deterministic seed, wound forward a little.
func fxWorld(t *testing.T, w, h int, evs ...game.Event) *fx.World {
	t.Helper()
	world := fx.NewWorld(fx.Options{Seed: 0x1234, Enabled: true})
	world.Resize(w, h)
	world.Observe(evs)
	world.Update(16 * time.Millisecond)
	return world
}

func fxView(w, h int, world *fx.World) View {
	v := testView(w, h, ScreenPlaying)
	v.FX = world
	return v
}

func TestBoardPointMapsFractionalCoordinates(t *testing.T) {
	l := Compute(80, 30)
	x, y, ok := boardPointXY(l, 0.4, float64(game.HiddenRows)+0.2)
	if !ok {
		t.Fatal("a point inside the board reported out of range")
	}
	if x != l.BoardX+1 || y != l.BoardY+1 {
		t.Errorf("point maps to (%d,%d), want (%d,%d)", x, y, l.BoardX+1, l.BoardY+1)
	}
	if _, _, ok := boardPointXY(l, -3, 10); ok {
		t.Error("a point left of the board should be out of range")
	}
	if _, _, ok := boardPointXY(l, 5, 0.5); ok {
		t.Error("a point in the hidden rows should be out of range")
	}
	if _, _, ok := boardPointXY(l, 99, 99); ok {
		t.Error("a point past the board should be out of range")
	}
}

func TestNilFXRendersTheSameAsPlan2(t *testing.T) {
	plain := render(t, ModeFull, testView(80, 30, ScreenPlaying))
	assertGolden(t, "wide", plain)
}

func TestDisabledFXRendersTheSameAsNilFX(t *testing.T) {
	// --no-fx must be byte-identical to no effects at all.
	off := fx.NewWorld(fx.Options{Seed: 9, Enabled: false})
	off.Resize(80, 30)
	off.Observe([]game.Event{{Kind: game.EventPieceHardDropped, Distance: 12}})
	off.Update(100 * time.Millisecond)

	want := render(t, ModeFull, testView(80, 30, ScreenPlaying))
	got := render(t, ModeFull, fxView(80, 30, off))
	if got != want {
		t.Errorf("--no-fx output differs from no FX at all:\n--- got ---\n%s\n--- want ---\n%s", got, want)
	}
}

func TestStarsAppearAroundTheBoard(t *testing.T) {
	world := fxWorld(t, 80, 30)
	out := render(t, ModeFull, fxView(80, 30, world))
	l := Compute(80, 30)
	rows := strings.Split(out, "\n")

	outside := 0
	for y, row := range rows {
		r := []rune(row)
		for x, ch := range r {
			if ch == ' ' {
				continue
			}
			inBoard := x >= l.BoardX && x < l.BoardX+BoardOuterW && y >= l.BoardY && y < l.BoardY+BoardOuterH
			if !inBoard && (ch == '.' || ch == '·' || ch == '˚' || ch == '✦' || ch == '✧') {
				outside++
			}
		}
	}
	if outside == 0 {
		t.Errorf("no stars drawn outside the board:\n%s", out)
	}
}

func TestOnlyFarStarsAppearInsideTheBoard(t *testing.T) {
	// §15: never make the background so busy that the board is harder to read.
	world := fxWorld(t, 80, 30)
	l := Compute(80, 30)
	g := GlyphsFor(ModeFull)
	c := NewCanvas(80, 30)
	DrawStars(c, l, g, world.Stars())
	rows := lines(c)

	near := string(g.Stars[2])
	for y := l.BoardY + 1; y < l.BoardY+BoardOuterH-1; y++ {
		r := []rune(rows[y])
		for x := l.BoardX + 1; x < l.BoardX+BoardOuterW-1; x++ {
			if strings.ContainsRune(near, r[x]) {
				t.Fatalf("a near-layer star was drawn inside the board at (%d,%d)", x, y)
			}
		}
	}
}

func TestStarsDoNotOverwriteTheBorderOrHUD(t *testing.T) {
	world := fxWorld(t, 80, 30)
	out := render(t, ModeFull, fxView(80, 30, world))
	l := Compute(80, 30)
	rows := strings.Split(out, "\n")
	g := GlyphsFor(ModeFull)

	top := []rune(rows[l.BoardY])
	for x := l.BoardX + 1; x < l.BoardX+BoardOuterW-1; x++ {
		if string(top[x]) != g.BorderH {
			t.Fatalf("border cell at x=%d is %q, want %q", x, string(top[x]), g.BorderH)
		}
	}
	if !strings.Contains(out, "NEXT") {
		t.Error("the HUD was overwritten by the starfield")
	}
}

func TestStarsDoNotCoverLockedBlocks(t *testing.T) {
	world := fxWorld(t, 80, 30)
	out := render(t, ModeFull, fxView(80, 30, world))
	l := Compute(80, 30)
	g := GlyphsFor(ModeFull)
	rows := strings.Split(out, "\n")
	bottom := []rune(rows[l.BoardY+BoardOuterH-2])
	if got := string(bottom[l.BoardX+1 : l.BoardX+3]); got != g.Block {
		t.Errorf("locked cell = %q, want %q", got, g.Block)
	}
}

func TestTrailsRenderBehindTheActivePiece(t *testing.T) {
	s := fixtureSnapshot()
	moved := s.Active
	moved.X--
	world := fxWorld(t, 80, 30, game.Event{Kind: game.EventPieceMoved, Piece: moved})

	v := fxView(80, 30, world)
	out := ansi.Strip(NewRenderer(ModeFull).Render(v))
	l := Compute(80, 30)
	g := GlyphsFor(ModeFull)
	rows := strings.Split(out, "\n")

	// The active piece keeps its full block glyph everywhere.
	for _, cell := range s.Active.Cells() {
		cx, cy, ok := boardCellXY(l, cell.X, cell.Y)
		if !ok {
			continue
		}
		if got := string([]rune(rows[cy])[cx : cx+2]); got != g.Block {
			t.Errorf("active cell %v = %q, want %q — a trail obscured it (§44)", cell, got, g.Block)
		}
	}
	// And the trail is visible somewhere.
	if !strings.ContainsAny(out, "▓▒░") {
		t.Errorf("no trail glyphs in the frame:\n%s", out)
	}
}

func TestTrailGlyphsRampWithFade(t *testing.T) {
	l := Compute(80, 30)
	g := GlyphsFor(ModeFull)
	c := NewCanvas(80, 30)
	DrawTrails(c, l, g, []fx.TrailCell{
		{X: 1, Y: game.HiddenRows + 1, Fade: 0.9, Kind: game.KindI},
		{X: 3, Y: game.HiddenRows + 1, Fade: 0.5, Kind: game.KindI},
		{X: 5, Y: game.HiddenRows + 1, Fade: 0.15, Kind: game.KindI},
	})
	row := []rune(lines(c)[l.BoardY+2])
	at := func(bx int) string {
		x, _, _ := boardCellXY(l, bx, game.HiddenRows+1)
		return string(row[x : x+2])
	}
	a, b, cc := at(1), at(3), at(5)
	if a == b || b == cc {
		t.Errorf("trail glyphs %q %q %q do not ramp with fade (§17)", a, b, cc)
	}
}

func TestASCIIModeTrailsAndParticlesStayASCII(t *testing.T) {
	world := fxWorld(t, 80, 30,
		game.Event{Kind: game.EventPieceHardDropped, Piece: game.Piece{Kind: game.KindT, X: 3, Y: 18}, Distance: 12},
		game.Event{Kind: game.EventLinesCleared, Rows: []int{20, 21}, Level: 2, Combo: 2},
	)
	out := render(t, ModeASCII, fxView(80, 30, world))
	for i, r := range out {
		if r > 0x7F {
			t.Fatalf("byte %d of ASCII-mode FX output is non-ASCII: %q", i, r)
		}
	}
}

func TestParticlesAreDrawnInsideTheBoard(t *testing.T) {
	world := fxWorld(t, 80, 30,
		game.Event{Kind: game.EventPieceHardDropped, Piece: game.Piece{Kind: game.KindT, X: 3, Y: 19}, Distance: 14},
	)
	if len(world.Particles()) == 0 {
		t.Fatal("test setup produced no particles")
	}
	l := Compute(80, 30)
	g := GlyphsFor(ModeFull)
	c := NewCanvas(80, 30)
	DrawParticles(c, l, g, world.Particles())
	body := strings.Join(lines(c), "")
	if strings.TrimSpace(body) == "" {
		t.Error("no particles were drawn")
	}
}

func TestParticlesOutsideTheBoardAreClipped(t *testing.T) {
	l := Compute(80, 30)
	g := GlyphsFor(ModeFull)
	c := NewCanvas(80, 30)
	DrawParticles(c, l, g, []fx.Particle{
		{X: -50, Y: -50, Life: 1, MaxLife: 1, Brightness: 1},
		{X: 500, Y: 500, Life: 1, MaxLife: 1, Brightness: 1},
		{X: 4, Y: 1, Life: 1, MaxLife: 1, Brightness: 1}, // hidden row
	})
	if got := strings.TrimSpace(strings.Join(lines(c), "")); got != "" {
		t.Errorf("out-of-board particles were drawn: %q", got)
	}
}

func TestClearAnimationDrawsOverTheClearedRows(t *testing.T) {
	l := Compute(80, 30)
	g := GlyphsFor(ModeFull)
	c := NewCanvas(80, 30)
	DrawClears(c, l, g, []fx.LineClear{{Rows: []int{game.Height - 1}, Life: 0.22}})
	row := lines(c)[l.BoardY+BoardOuterH-2]
	if strings.TrimSpace(row) == "" {
		t.Error("the clear animation drew nothing on its row (§19)")
	}
}

func TestShockwaveDrawsARing(t *testing.T) {
	l := Compute(80, 30)
	g := GlyphsFor(ModeFull)
	c := NewCanvas(80, 30)
	DrawShockwaves(c, l, g, []fx.Shockwave{{X: 5, Y: 15, Age: 0.15, Life: 0.3}})
	body := strings.Join(lines(c), "")
	if strings.TrimSpace(body) == "" {
		t.Error("no shockwave drawn (§24)")
	}
}

func TestFXFrameKeepsTerminalGeometry(t *testing.T) {
	world := fxWorld(t, 80, 30,
		game.Event{Kind: game.EventLinesCleared, Rows: []int{18, 19, 20, 21}, Level: 4, Combo: 3},
	)
	for _, size := range [][2]int{{40, 24}, {80, 30}, {300, 100}} {
		world.Resize(size[0], size[1])
		out := render(t, ModeFull, fxView(size[0], size[1], world))
		rows := strings.Split(out, "\n")
		if len(rows) != size[1] {
			t.Fatalf("%dx%d: %d rows", size[0], size[1], len(rows))
		}
		for i, row := range rows {
			if n := len([]rune(row)); n != size[0] {
				t.Fatalf("%dx%d row %d is %d columns", size[0], size[1], i, n)
			}
		}
	}
}

func TestTooSmallTerminalDrawsNoFX(t *testing.T) {
	// Review Focus 5: FX must not leak into the too-small notice.
	world := fxWorld(t, 34, 19,
		game.Event{Kind: game.EventPieceHardDropped, Piece: game.Piece{Kind: game.KindI, X: 3, Y: 19}, Distance: 14},
	)
	got := render(t, ModeFull, fxView(34, 19, world))
	want := render(t, ModeFull, testView(34, 19, ScreenPlaying))
	if got != want {
		t.Errorf("FX leaked into the too-small notice:\n%s", got)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/render/ -run TestBoardPointMaps -v`
Expected: FAIL — `undefined: boardPointXY`.

- [ ] **Step 3: Add tint resolution to the palette**

Append to `internal/render/palette.go`:

```go
// TintPaint resolves an fx tint class and brightness into a Paint. All colour
// policy lives here; fx is deliberately colour-free.
func TintPaint(t fx.Tint, k game.PieceKind, brightness float64) Paint {
	if brightness < 0 {
		brightness = 0
	}
	if brightness > 1 {
		brightness = 1
	}
	var base RGB
	switch t {
	case fx.TintPiece:
		base = PieceColor(k)
	case fx.TintStar:
		base = RGB{0xC8, 0xD6, 0xFF}
	case fx.TintFlash:
		base = RGB{0xFF, 0xFB, 0xE8}
	default: // fx.TintDebris
		base = RGB{0xA8, 0xB4, 0xD8}
	}
	return Paint{FG: Dim(base, 1-brightness), Bold: t == fx.TintFlash && brightness > 0.7}
}

// StarPaint colours a star by depth layer and brightness (§15).
func StarPaint(layer uint8, bright float64) Paint {
	p := TintPaint(fx.TintStar, 0, bright)
	if layer == 0 {
		p.Faint = true
	}
	if layer == 2 {
		p.Bold = true
	}
	return p
}

// TrailPaint colours an ion trail cell from its piece and remaining fade (§17).
func TrailPaint(k game.PieceKind, fade float64) Paint {
	return Paint{FG: Dim(PieceColor(k), 1-0.85*fade)}
}
```

Add `"cosmic-tetris/internal/fx"` to `palette.go`'s imports.

- [ ] **Step 4: Add the board-space FX layers**

Append to `internal/render/board.go`:

```go
// boardPointXY maps a fractional board-space point to a terminal cell. Board
// space is what fx works in, so effects follow the board wherever the layout
// puts it. ok is false outside the visible board.
func boardPointXY(l Layout, x, y float64) (int, int, bool) {
	if x < 0 || y < 0 {
		return 0, 0, false
	}
	return boardCellXY(l, int(x), int(y))
}

// trailRamp is §17's fading ion trail, brightest first.
var trailRamp = [3]string{"▓▓", "▒▒", "░░"}

// asciiTrailRamp is the same ramp for terminals without block elements.
var asciiTrailRamp = [3]string{"##", "++", "::"}

// DrawTrails draws the fading afterimages of moving pieces (§17). It is drawn
// before the active piece, which is redrawn last, so a trail can never obscure
// it (§44).
func DrawTrails(c *Canvas, l Layout, g Glyphs, cells []fx.TrailCell) {
	ramp := trailRamp
	if g.Block == asciiGlyphs.Block {
		ramp = asciiTrailRamp
	}
	for _, t := range cells {
		cx, cy, ok := boardCellXY(l, t.X, t.Y)
		if !ok {
			continue
		}
		i := 2
		switch {
		case t.Fade > 0.66:
			i = 0
		case t.Fade > 0.33:
			i = 1
		}
		c.SetString(cx, cy, ramp[i], TrailPaint(t.Kind, t.Fade))
	}
}

// DrawClears draws §19's three-phase line-clear animation over the rows the
// engine has already removed.
func DrawClears(c *Canvas, l Layout, g Glyphs, clears []fx.LineClear) {
	for _, cl := range clears {
		f := 0.0
		if cl.Life > 0 {
			f = cl.Age / cl.Life
		}
		centre := float64(game.Width-1) / 2
		for _, row := range cl.Rows {
			for x := 0; x < game.Width; x++ {
				cx, cy, ok := boardCellXY(l, x, row)
				if !ok {
					continue
				}
				dist := absFloat(float64(x)-centre) / centre
				var glyph string
				var bright float64
				switch cl.Phase() {
				case fx.ClearCriticalMass:
					// Phase A: the row destabilises from the edges inward.
					glyph, bright = g.Block, 1-0.3*dist
					if dist > 0.6 {
						glyph = trailRamp[0]
						if g.Block == asciiGlyphs.Block {
							glyph = asciiTrailRamp[0]
						}
					}
				case fx.ClearSupernova:
					// Phase B: the explosion travels outward from the centre.
					front := f * 1.6
					glyph, bright = g.Block, 1
					if dist > front {
						glyph = g.Empty
						bright = 0
					} else if dist > front-0.25 {
						glyph = string(g.Debris[2%len(g.Debris)]) + string(g.Debris[2%len(g.Debris)])
					}
				default:
					// Phase C: fragments. Most of the row is gone.
					glyph, bright = g.Empty, 0
					if dist < 1-f {
						glyph = string(g.Debris[0]) + " "
						bright = 0.7
					}
				}
				if glyph == g.Empty {
					continue
				}
				c.SetString(cx, cy, glyph, TintPaint(fx.TintFlash, 0, bright))
			}
		}
	}
}

// DrawShockwaves draws §24's expanding rings. The geometry is faked: terminal
// cells are about twice as tall as they are wide, so the ring is an ellipse.
func DrawShockwaves(c *Canvas, l Layout, g Glyphs, waves []fx.Shockwave) {
	const steps = 48
	for _, w := range waves {
		r := w.Radius()
		if r <= 0 {
			continue
		}
		fade := w.Fade()
		glyph := g.Rings[int((1-fade)*float64(len(g.Rings)-1))]
		paint := TintPaint(fx.TintFlash, 0, fade)
		for i := 0; i < steps; i++ {
			a := 2 * math.Pi * float64(i) / steps
			x := w.X + math.Cos(a)*r
			y := w.Y + math.Sin(a)*r*0.5
			cx, cy, ok := boardPointXY(l, x, y)
			if !ok {
				continue
			}
			c.SetString(cx, cy, string(glyph)+" ", paint)
		}
	}
}

// DrawParticles draws board-space particles (§23). Each occupies one terminal
// column so debris does not read as a solid block.
func DrawParticles(c *Canvas, l Layout, g Glyphs, ps []fx.Particle) {
	for _, p := range ps {
		cx, cy, ok := boardPointXY(l, p.X, p.Y)
		if !ok {
			continue
		}
		set := g.Debris
		if p.Tint == fx.TintStar {
			set = g.Stars[2]
		}
		glyph := set[int(p.Shape)%len(set)]
		c.Set(cx, cy, glyph, TintPaint(p.Tint, p.Kind, p.Brightness*p.Fade()))
	}
}

func absFloat(v float64) float64 {
	if v < 0 {
		return -v
	}
	return v
}
```

Add `"math"` and `"cosmic-tetris/internal/fx"` to `board.go`'s imports.

Then change `DrawStack` so it no longer paints over empty cells — the starfield lives behind them:

```go
			if cell := s.Board.Cells[y][x]; cell.Filled {
				c.SetString(cx, cy, g.Block, LockedPaint(cell.Kind))
			}
```

- [ ] **Step 5: Wire the pipeline**

In `internal/render/render.go`, add the field to `View`:

```go
	// FX is the effects simulation. A nil World, or a disabled one, renders the
	// plain game — that is what --no-fx is (§32).
	FX *fx.World
```

Add `DrawStars` and rework `Render`'s body to §37's order:

```go
// DrawStars draws the background starfield (§15). Inside the board interior only
// the far layer is drawn, so the background never makes the board harder to read.
func DrawStars(c *Canvas, l Layout, g Glyphs, stars []fx.Star) {
	for _, s := range stars {
		x, y := int(s.X), int(s.Y)
		inBoard := x >= l.BoardX && x < l.BoardX+BoardOuterW && y >= l.BoardY && y < l.BoardY+BoardOuterH
		if inBoard && s.Layer != 0 {
			continue
		}
		set := g.Stars[s.Layer]
		c.Set(x, y, set[int(s.Shape)%len(set)], StarPaint(s.Layer, s.Bright))
	}
}
```

and in `Render`, between the canvas reset and the board:

```go
	l := Compute(v.Width, v.Height)
	if l.TooSmall {
		drawTooSmall(r.canvas, v.Width, v.Height)
		return r.canvas.String()
	}

	world := v.FX
	if world != nil && !world.Enabled() {
		world = nil
	}

	// §37, steps 2 through 6.
	if world != nil {
		DrawStars(r.canvas, l, r.glyphs, world.Stars())
	}
	border := BorderPalette[1]
	DrawBorder(r.canvas, l, r.glyphs, [4]RGB{border, border, border, border})
	DrawStack(r.canvas, l, r.glyphs, v.Snapshot)
	DrawGhost(r.canvas, l, r.glyphs, v.Snapshot)
	if world != nil {
		DrawTrails(r.canvas, l, r.glyphs, world.Trails())
		DrawClears(r.canvas, l, r.glyphs, world.Clears())
		DrawShockwaves(r.canvas, l, r.glyphs, world.Shockwaves())
		DrawParticles(r.canvas, l, r.glyphs, world.Particles())
	}
	// The active piece is drawn after every board-local effect: §44's first rule
	// is that nothing may obscure it.
	DrawActive(r.canvas, l, r.glyphs, v.Snapshot)
```

leaving the HUD, mission, controls and overlay calls that follow unchanged. Add `"cosmic-tetris/internal/fx"` to `render.go`'s imports.

- [ ] **Step 6: Run the tests**

Run: `go test ./internal/render/ -v`
Expected: PASS, including the Plan 2 goldens unchanged — `TestNilFXRendersTheSameAsPlan2` is the check that this task did not disturb the plain frame.

- [ ] **Step 7: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/render/palette.go internal/render/board.go internal/render/render.go internal/render/fx_test.go
git commit -m "feat(render): composite starfield, trails, clears, shockwaves and particles"
```

---

### Task 7: Animated border and screen shake

**Files:**
- Modify: `internal/render/palette.go` (border gradient)
- Modify: `internal/render/render.go` (shake offset)
- Test: `internal/render/border_test.go`

**Interfaces:**
- Consumes: `BorderPalette`, `fx.World`.
- Produces: `func BorderColors(phase, energy float64) [4]RGB`; `func blendPalette(pos float64) RGB`; shake applied in `Render` by offsetting a copy of the `Layout`'s board origin.

Shake shifts the board and its border only. The HUD stays put, so the frame never appears to wobble as a whole — §18's "do not make the entire terminal unreadable".

- [ ] **Step 1: Write the failing test**

Create `internal/render/border_test.go`:

```go
package render

import (
	"strings"
	"testing"
	"time"

	"cosmic-tetris/internal/fx"
	"cosmic-tetris/internal/game"
)

func TestBorderColorsWalkThePalette(t *testing.T) {
	a := BorderColors(0, 0)
	b := BorderColors(0.5, 0)
	if a == b {
		t.Error("the border colour does not change with phase (§25)")
	}
	for _, phase := range []float64{0, 0.25, 0.5, 0.75, 0.999, 1.5, -0.5} {
		for _, c := range BorderColors(phase, 0) {
			if c.isZero() {
				t.Errorf("phase %v produced an unset colour", phase)
			}
		}
	}
}

func TestBorderEdgesDifferSoTheGradientMoves(t *testing.T) {
	// §25: during major events the gradient moves rapidly around the border.
	cols := BorderColors(0.2, 1)
	if cols[0] == cols[1] && cols[1] == cols[2] && cols[2] == cols[3] {
		t.Error("all four edges share one colour; there is no gradient to move")
	}
}

func TestHighEnergyBrightensTheBorder(t *testing.T) {
	sum := func(c RGB) int { return int(c.R) + int(c.G) + int(c.B) }
	calm, hot := BorderColors(0.3, 0), BorderColors(0.3, 1)
	if sum(hot[0]) <= sum(calm[0]) {
		t.Errorf("energised border %v is not brighter than resting %v", hot[0], calm[0])
	}
}

func TestBlendPaletteStaysInRange(t *testing.T) {
	for pos := -2.0; pos <= 3.0; pos += 0.05 {
		c := blendPalette(pos)
		if c.isZero() {
			t.Fatalf("blendPalette(%v) is unset", pos)
		}
	}
}

func TestShakeShiftsTheBoardByAtMostOneCell(t *testing.T) {
	world := fx.NewWorld(fx.Options{Seed: 5, Enabled: true})
	world.Resize(80, 30)
	world.Observe([]game.Event{{
		Kind:     game.EventPieceHardDropped,
		Piece:    game.Piece{Kind: game.KindT, X: 3, Y: 19},
		Distance: 14,
	}})

	l := Compute(80, 30)
	g := GlyphsFor(ModeFull)
	base := -1
	shifted := 0
	for i := 0; i < 20; i++ {
		out := render(t, ModeFull, fxView(80, 30, world))
		rows := strings.Split(out, "\n")
		// Find the row holding the board's top border.
		found := -1
		for y, row := range rows {
			r := []rune(row)
			if len(r) > l.BoardX && string(r[l.BoardX]) == g.BorderTL {
				found = y
				break
			}
		}
		if found < 0 {
			t.Fatalf("frame %d: could not find the board's top-left corner", i)
		}
		if base < 0 {
			base = l.BoardY
		}
		if d := found - base; d < -1 || d > 1 {
			t.Fatalf("frame %d: board shifted %d rows, want at most 1 (§44)", i, d)
		} else if d != 0 {
			shifted++
		}
		world.Update(8 * time.Millisecond)
	}
	if shifted == 0 {
		t.Error("the board never shifted during a shake")
	}
}

func TestShakeDoesNotMoveTheHUD(t *testing.T) {
	world := fx.NewWorld(fx.Options{Seed: 5, Enabled: true})
	world.Resize(80, 30)
	world.Observe([]game.Event{{
		Kind:     game.EventPieceHardDropped,
		Piece:    game.Piece{Kind: game.KindT, X: 3, Y: 19},
		Distance: 14,
	}})
	l := Compute(80, 30)

	nextRow := func(out string) int {
		for y, row := range strings.Split(out, "\n") {
			if strings.Contains(row, "NEXT") {
				return y
			}
		}
		return -1
	}
	want := nextRow(render(t, ModeFull, testView(80, 30, ScreenPlaying)))
	if want != l.BoardY {
		t.Fatalf("test assumption broken: NEXT is on row %d, board starts at %d", want, l.BoardY)
	}
	for i := 0; i < 15; i++ {
		if got := nextRow(render(t, ModeFull, fxView(80, 30, world))); got != want {
			t.Fatalf("frame %d: the HUD moved from row %d to %d during a shake", i, want, got)
		}
		world.Update(8 * time.Millisecond)
	}
}

func TestShakeNeverPushesTheBoardOffScreen(t *testing.T) {
	world := fx.NewWorld(fx.Options{Seed: 5, Enabled: true})
	world.Resize(40, 24)
	world.Observe([]game.Event{{
		Kind:     game.EventPieceHardDropped,
		Piece:    game.Piece{Kind: game.KindI, X: 3, Y: 21},
		Distance: 20,
	}})
	for i := 0; i < 20; i++ {
		out := render(t, ModeFull, fxView(40, 24, world))
		rows := strings.Split(out, "\n")
		if len(rows) != 24 {
			t.Fatalf("frame %d: %d rows", i, len(rows))
		}
		for j, row := range rows {
			if n := len([]rune(row)); n != 40 {
				t.Fatalf("frame %d row %d is %d columns", i, j, n)
			}
		}
		world.Update(8 * time.Millisecond)
	}
}

func TestReducedMotionDoesNotShake(t *testing.T) {
	world := fx.NewWorld(fx.Options{Seed: 5, Enabled: true, ReducedMotion: true})
	world.Resize(80, 30)
	world.Observe([]game.Event{{
		Kind:     game.EventPieceHardDropped,
		Piece:    game.Piece{Kind: game.KindT, X: 3, Y: 19},
		Distance: 14,
	}})
	l := Compute(80, 30)
	g := GlyphsFor(ModeFull)
	for i := 0; i < 15; i++ {
		rows := strings.Split(render(t, ModeFull, fxView(80, 30, world)), "\n")
		r := []rune(rows[l.BoardY])
		if string(r[l.BoardX]) != g.BorderTL {
			t.Fatalf("frame %d: the board moved under --reduced-motion", i)
		}
		world.Update(8 * time.Millisecond)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/render/ -run TestBorderColorsWalk -v`
Expected: FAIL — `undefined: BorderColors`.

- [ ] **Step 3: Write the border gradient**

Append to `internal/render/palette.go`:

```go
// blendPalette samples BorderPalette at pos, wrapping at 1 and interpolating
// between neighbouring stops.
func blendPalette(pos float64) RGB {
	pos = pos - math.Floor(pos)
	scaled := pos * float64(len(BorderPalette))
	i := int(scaled) % len(BorderPalette)
	j := (i + 1) % len(BorderPalette)
	f := scaled - math.Floor(scaled)
	a, b := BorderPalette[i], BorderPalette[j]
	mix := func(x, y uint8) uint8 { return uint8(float64(x) + (float64(y)-float64(x))*f) }
	return RGB{mix(a.R, b.R), mix(a.G, b.G), mix(a.B, b.B)}
}

// BorderColors is the board frame's four edge colours — top, right, bottom, left
// — for a phase and energy level (§25). The quarter-turn offsets between edges
// are what make the gradient appear to travel around the border, and energy both
// brightens it and is what fx speeds the phase with during major events.
func BorderColors(phase, energy float64) [4]RGB {
	if energy < 0 {
		energy = 0
	}
	if energy > 1 {
		energy = 1
	}
	var out [4]RGB
	for i := range out {
		c := blendPalette(phase + float64(i)*0.08)
		out[i] = Brighten(c, 0.45*energy)
	}
	return out
}
```

Add `"math"` to `palette.go`'s imports.

- [ ] **Step 4: Apply phase, energy and shake in Render**

In `internal/render/render.go`, replace the static border colour and offset the board layers:

```go
	// The board and its border shake; the HUD does not, so the frame never
	// wobbles as a whole (§18).
	bl := l
	border := [4]RGB{BorderPalette[1], BorderPalette[1], BorderPalette[1], BorderPalette[1]}
	if world != nil {
		dx, dy := world.ShakeOffset()
		bl.BoardX += dx
		bl.BoardY += dy
		border = BorderColors(world.BorderPhase(), world.BorderEnergy())
	}
```

Then pass `bl` — not `l` — to `DrawBorder`, `DrawStack`, `DrawGhost`, `DrawTrails`, `DrawClears`, `DrawShockwaves`, `DrawParticles` and `DrawActive`, and keep `l` for `DrawStars`, the HUD, the mission line, the controls and the overlay. The canvas clips a shifted board at the screen edge, so a shake at 40×24 cannot push anything out of bounds.

- [ ] **Step 5: Run the tests**

Run: `go test ./internal/render/ -v`
Expected: PASS. The Plan 2 goldens must still match: with no world, `bl == l` and the border colour is unchanged, and the goldens are ANSI-stripped anyway.

- [ ] **Step 6: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/render/palette.go internal/render/render.go internal/render/border_test.go
git commit -m "feat(render): animated border gradient and one-cell screen shake"
```

---
<!-- PLAN3-CONTINUE -->
