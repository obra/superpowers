# Cosmic Tetris — Plan 04: Violence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the universe lose its composure — particle physics, hard-drop impact, screen shake, the line-clear supernova, shockwaves, hyperdrive, and the four-line astronomical event — without ever slowing the controls or hiding the board.

**Architecture:** Every effect is a small struct owned by `fx.World`, advanced by the same `Advance(dt)` and fed by the same `Handle(events)` as Plan 03. The renderer asks the world for flat slices (particles, rings, banner text, shake offset, flash level) and composites them onto the canvas. Nothing here can reach the game: the FX world still holds no `*game.Game`, and gameplay never waits for an animation.

**Tech Stack:** Go 1.26; `internal/fx` remains standard-library-only.

**Spec:** `design.md` — Phase 4 of §42. Sections most relevant: §16, §17, §18, §19, §20, §21, §22, §23, §24, §38, §43, §44, §49.5.

**Prerequisite:** Plans 01–03 complete; `make test` green.

## Global Constraints

- The FX system may observe game events and may **never modify GameState** (§14). Effects never alter gameplay, and no random effect may change what the game does (§44).
- Never obscure the active piece. Never make controls lag. Never delay gameplay for animation. Never make screen shake exceed roughly one cell. Never allow particles to permanently alter the rendered board. Board readability remains sacred (§21, §44).
- Particle integration per step (§23): `position += velocity × dt`; `velocity += acceleration × dt`; `velocity *= drag`; `life -= dt`. Forces: gravity, drag, radial explosion force, random angular variation. No collision detection. Particles die when `life <= 0` or they leave the viewport. Floating positions are converted to terminal cells at render time.
- Durations, pinned by the spec: hard-drop screen shake `~80ms`; line-clear animation total `~220ms`; shockwave `~300ms`; four-line banner `~700ms`; hyperdrive timeline `0ms` pause → `50ms` stretch → `100ms` violent acceleration → `500ms` peak → `800ms` decay → `1100ms` normal.
- Shake pattern, deterministic (§18): `0,+1` → `-1,0` → `+1,0` → `0,-1` → `0,0`.
- Hyperdrive triggers: four-line clear, large combo, new high score (§16).
- Combo escalation (§21): combo 2 small sparks; combo 3 meteor particles; combo 4 HUD pulsing; combo 5+ mission control loses control of the mission.
- Four-line clear fires simultaneously (§20): hyperdrive, larger screen shake, border gradient pulse, particle eruption, HUD flash, temporary star density increase, giant banner. The banner must not block gameplay input.
- Level-up notification slides/fades away without pausing the game (§22).
- Shockwaves are used **sparingly** (§24).
- `--reduced-motion` (§49.5) suppresses screen shake, hyperdrive acceleration, and shockwaves, and leaves colour, trails, and particles alone.
- Performance (§38): no goroutine per particle or per frame, no filesystem access during gameplay, no per-frame logging, reusable slices. A few hundred particles must be trivial.

## Review Focus

1. **Sustained four-line clears** (a good player clearing quads for minutes) must leave particle and ring counts bounded, with the oldest dropped, and per-frame work flat. → Task 1 and Task 9.
2. **Screen shake at the edge of the terminal** — a one-cell shift must never push content off-screen, change the line count, or change any line's width, or the whole frame reflows and flickers. → Task 3.
3. **Particles inside the well** — debris drifting over the stack must never cover a locked or active cell, and must never leave a permanent mark once it dies. → Task 9.
4. **A piece locking during the 220ms line-clear animation** — gameplay has already collapsed those rows, so the animation is drawing rows that no longer exist; the frame must stay coherent and the new piece must render correctly. → Task 4.
5. **`--reduced-motion`** must suppress exactly shake, hyperdrive acceleration, and shockwaves — and must not quietly kill particles, trails, or colour, which are the reason to play. → Task 9.

---

### Task 1: Particle simulation

**Files:**
- Create: `internal/fx/particle.go`
- Test: `internal/fx/particle_test.go`

**Interfaces:**
- Consumes: Task-1-of-Plan-03's `World`.
- Produces:
  - ```go
    type Particle struct {
        X, Y       float64 // canvas cells; fractional
        VX, VY     float64 // cells per second
        Life       float64 // seconds remaining
        MaxLife    float64
        Glyph      rune
        Brightness float64 // 0..1
        Hue        string  // "" = default hot white; otherwise a palette key set by the emitter
    }
    func (w *World) Particles() []Particle // the live backing slice; read-only for callers
    func (w *World) ParticleCount() int
    func (w *World) Emit(p Particle)
    func (w *World) EmitBurst(x, y float64, n int, spec BurstSpec)
    type BurstSpec struct {
        Speed      float64 // mean radial speed, cells/sec
        SpeedJitter float64
        Life       float64 // mean seconds
        Glyphs     []rune
        Hue        string
        UpBias     float64 // added to -VY, for debris that should fly upward
    }
    ```
  - Pinned physics constants: `ParticleGravity = 14.0` cells/s² downward, `ParticleDrag = 0.90` per `1/60 s` step (applied as `pow(drag, dt*60)`), `MaxParticles = 600` (oldest dropped when full). The backing slice is allocated once at `MaxParticles` capacity and never regrown (§38).
  - Glyph inventories: full/reduced `· * ✦ +` (§18); ASCII `. * + o`.
  - `Advance` integrates in the §23 order, then culls particles with `Life <= 0` or positions outside `[-1, cols] × [-1, rows]`.

- [ ] **Step 1: Write the failing test**

`internal/fx/particle_test.go`:

```go
package fx

import (
	"math"
	"testing"
	"time"
)

func TestParticleMovesWithItsVelocity(t *testing.T) {
	w := full(80, 40, 31)
	w.Emit(Particle{X: 10, Y: 10, VX: 6, VY: -12, Life: 5, MaxLife: 5, Glyph: '*', Brightness: 1})
	w.Advance(100 * time.Millisecond)
	p := w.Particles()[0]
	if p.X <= 10 {
		t.Errorf("X did not advance: %v", p.X)
	}
	if p.Y >= 10 {
		t.Errorf("Y should have risen: %v", p.Y)
	}
}

func TestGravityPullsParticlesDownAndDragSlowsThem(t *testing.T) {
	w := full(80, 40, 32)
	w.Emit(Particle{X: 10, Y: 10, VX: 20, VY: 0, Life: 5, MaxLife: 5, Glyph: '*'})
	w.Advance(100 * time.Millisecond)
	p := w.Particles()[0]
	if p.VY <= 0 {
		t.Errorf("gravity did not act: VY = %v", p.VY)
	}
	if p.VX >= 20 {
		t.Errorf("drag ate no horizontal speed: VX = %v", p.VX)
	}
	if p.VX <= 0 {
		t.Errorf("drag reversed the particle: VX = %v", p.VX)
	}
}

func TestParticlesDieWhenLifeRunsOut(t *testing.T) {
	w := full(80, 40, 33)
	w.Emit(Particle{X: 10, Y: 10, Life: 0.1, MaxLife: 0.1, Glyph: '*'})
	w.Advance(50 * time.Millisecond)
	if w.ParticleCount() != 1 {
		t.Fatalf("died too early: %d", w.ParticleCount())
	}
	w.Advance(100 * time.Millisecond)
	if w.ParticleCount() != 0 {
		t.Fatalf("still alive past its life: %d", w.ParticleCount())
	}
}

func TestParticlesLeavingTheViewportAreCulled(t *testing.T) {
	w := full(80, 40, 34)
	w.Emit(Particle{X: 79, Y: 39, VX: 500, VY: 500, Life: 10, MaxLife: 10, Glyph: '*'})
	w.Advance(100 * time.Millisecond)
	if w.ParticleCount() != 0 {
		t.Fatalf("an off-screen particle survived: %+v", w.Particles())
	}
}

func TestBurstFliesOutwardInAllDirections(t *testing.T) {
	w := full(80, 40, 35)
	w.EmitBurst(40, 20, 40, BurstSpec{Speed: 10, SpeedJitter: 4, Life: 0.5, Glyphs: []rune{'*', '✦'}})
	if n := w.ParticleCount(); n != 40 {
		t.Fatalf("burst produced %d particles want 40", n)
	}
	var left, right, up, down int
	for _, p := range w.Particles() {
		if p.VX < 0 {
			left++
		}
		if p.VX > 0 {
			right++
		}
		if p.VY < 0 {
			up++
		}
		if p.VY > 0 {
			down++
		}
		if math.IsNaN(p.X) || math.IsNaN(p.VX) || math.IsInf(p.VY, 0) {
			t.Fatalf("burst produced a broken particle: %+v", p)
		}
	}
	for name, n := range map[string]int{"left": left, "right": right, "up": up, "down": down} {
		if n == 0 {
			t.Errorf("no particles went %s", name)
		}
	}
}

func TestBurstUpBiasThrowsDebrisUpward(t *testing.T) {
	w := full(80, 40, 36)
	w.EmitBurst(40, 20, 30, BurstSpec{Speed: 8, Life: 0.5, Glyphs: []rune{'*'}, UpBias: 12})
	up := 0
	for _, p := range w.Particles() {
		if p.VY < 0 {
			up++
		}
	}
	if up < 20 {
		t.Errorf("only %d of 30 particles went up despite the bias", up)
	}
}

// Review focus 1: bounded under sustained abuse.
func TestParticleCountIsCappedUnderSustainedBursts(t *testing.T) {
	w := full(80, 40, 37)
	for i := 0; i < 200; i++ {
		w.EmitBurst(40, 20, 60, BurstSpec{Speed: 5, Life: 30, Glyphs: []rune{'*'}})
		w.Advance(16 * time.Millisecond)
		if n := w.ParticleCount(); n > MaxParticles {
			t.Fatalf("iteration %d: %d particles alive, cap is %d", i, n, MaxParticles)
		}
	}
}

// §38: reusable slices, no per-frame allocation.
func TestParticleSliceIsReusedNotReallocatedEveryFrame(t *testing.T) {
	w := full(80, 40, 38)
	start := cap(w.Particles())
	if start < MaxParticles {
		t.Fatalf("cap = %d at construction; preallocate the full %d (§38)", start, MaxParticles)
	}
	for i := 0; i < 3000; i++ {
		w.EmitBurst(40, 20, 40, BurstSpec{Speed: 8, Life: 1, Glyphs: []rune{'*'}})
		w.Advance(16 * time.Millisecond)
		if c := cap(w.Particles()); c != start {
			t.Fatalf("frame %d reallocated the backing array: cap %d then %d", i, start, c)
		}
	}
}

func TestNoParticlesWhenFXIsOff(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 39, Intensity: IntensityOff})
	w.EmitBurst(40, 20, 50, BurstSpec{Speed: 5, Life: 1, Glyphs: []rune{'*'}})
	if w.ParticleCount() != 0 {
		t.Error("IntensityOff must not simulate particles")
	}
}

func TestASCIIParticleGlyphsAreASCII(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 40, Intensity: IntensityFull, ASCII: true})
	w.EmitBurst(40, 20, 50, BurstSpec{Speed: 5, Life: 1}) // no explicit glyphs: the world picks
	for _, p := range w.Particles() {
		if p.Glyph > 127 {
			t.Fatalf("ascii mode emitted %q", p.Glyph)
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run Particle -v`
Expected: FAIL — `undefined: Particle`.

- [ ] **Step 3: Implement `particle.go`**

Keep one backing slice on the world; cull by swapping the dead entry with the last live one and shrinking the length. `EmitBurst` with an empty `Glyphs` picks from the mode-appropriate inventory.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/particle.go internal/fx/particle_test.go
git commit -m "feat(fx): terminal-space particle physics with a hard cap"
```

---

### Task 2: Hard-drop impact — debris, shake, border flash

**Files:**
- Create: `internal/fx/impact.go`
- Test: `internal/fx/impact_test.go`

**Interfaces:**
- Consumes: `Particle`, `BurstSpec`, `World.SetBoardRect`, `game.Event` (`PieceHardDropped`).
- Produces:
  - `func (w *World) ShakeOffset() (dx, dy int)` — the current offset, always within `[-1, 1]` on both axes, and always `0,0` when `Intensity != IntensityFull`.
  - `func (w *World) shakeFor(d time.Duration, strong bool)` — starts a shake; `strong` (four-line) uses the same one-cell pattern but runs it for `160ms` instead of `80ms`, because §44 caps the amplitude, not the duration.
  - `const ShakeStep = 16 * time.Millisecond`, `ShakeDuration = 80 * time.Millisecond`, `StrongShakeDuration = 160 * time.Millisecond`.
  - `var ShakePattern = [5][2]int{{0, 1}, {-1, 0}, {1, 0}, {0, -1}, {0, 0}}`.
  - Impact handling on `PieceHardDropped`: emit debris from the contact area — `8 + 3×min(distance,6)` particles, `UpBias` proportional to distance, spread across the piece's occupied columns; start a shake; add border energy (Plan 03's `BorderEnergy` already rises on this event, per its pinned table) and set a short border flash via `func (w *World) BorderFlash() float64` (`1.0` at impact, decaying to `0` over `250ms`).

- [ ] **Step 1: Write the failing test**

`internal/fx/impact_test.go`:

```go
package fx

import (
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func hardDrop(distance int) game.Event {
	p := game.Piece{Kind: game.KindI, Rotation: 1, X: 4, Y: 18}
	return game.Event{Kind: game.PieceHardDropped, Piece: p, Cells: p.Cells(), Distance: distance}
}

func boardWorld(seed int64) *World {
	w := full(80, 40, seed)
	w.SetBoardRect(Rect{X: 20, Y: 4, W: 22, H: 22})
	return w
}

func TestHardDropEmitsDebrisScaledWithDistance(t *testing.T) {
	near := boardWorld(41)
	near.Handle([]game.Event{hardDrop(1)})
	far := boardWorld(41)
	far.Handle([]game.Event{hardDrop(15)})
	if near.ParticleCount() == 0 {
		t.Fatal("a hard drop produced no debris")
	}
	if far.ParticleCount() <= near.ParticleCount() {
		t.Errorf("a longer drop should throw more debris: %d vs %d",
			far.ParticleCount(), near.ParticleCount())
	}
}

func TestDebrisAppearsNearTheContactArea(t *testing.T) {
	w := boardWorld(42)
	w.Handle([]game.Event{hardDrop(10)})
	for _, p := range w.Particles() {
		if p.X < 20 || p.X > 42 {
			t.Errorf("debris at X=%v is outside the board columns 20..42", p.X)
		}
		if p.Y < 4 || p.Y > 26 {
			t.Errorf("debris at Y=%v is outside the board rows 4..26", p.Y)
		}
	}
}

func TestShakeRunsForEightyMillisecondsAndStopsAtZero(t *testing.T) {
	w := boardWorld(43)
	w.Handle([]game.Event{hardDrop(8)})
	moved := false
	for elapsed := time.Duration(0); elapsed < ShakeDuration; elapsed += ShakeStep {
		dx, dy := w.ShakeOffset()
		if dx != 0 || dy != 0 {
			moved = true
		}
		w.Advance(ShakeStep)
	}
	if !moved {
		t.Fatal("no shake happened")
	}
	w.Advance(ShakeStep)
	if dx, dy := w.ShakeOffset(); dx != 0 || dy != 0 {
		t.Errorf("shake did not settle: %d,%d", dx, dy)
	}
}

// §44: never exceed roughly one cell.
func TestShakeNeverExceedsOneCell(t *testing.T) {
	w := boardWorld(44)
	for i := 0; i < 40; i++ {
		w.Handle([]game.Event{hardDrop(20)})
		for j := 0; j < 20; j++ {
			dx, dy := w.ShakeOffset()
			if dx < -1 || dx > 1 || dy < -1 || dy > 1 {
				t.Fatalf("shake offset %d,%d exceeds one cell", dx, dy)
			}
			w.Advance(8 * time.Millisecond)
		}
	}
}

func TestShakeFollowsThePinnedPattern(t *testing.T) {
	if ShakePattern != [5][2]int{{0, 1}, {-1, 0}, {1, 0}, {0, -1}, {0, 0}} {
		t.Fatalf("the §18 shake pattern changed: %v", ShakePattern)
	}
	w := boardWorld(45)
	w.Handle([]game.Event{hardDrop(8)})
	seen := [][2]int{}
	for i := 0; i < 6; i++ {
		dx, dy := w.ShakeOffset()
		seen = append(seen, [2]int{dx, dy})
		w.Advance(ShakeStep)
	}
	if seen[0] != ShakePattern[0] {
		t.Errorf("shake started at %v want %v", seen[0], ShakePattern[0])
	}
}

func TestReducedMotionSuppressesShakeButKeepsDebris(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 46, Intensity: IntensityReduced})
	w.SetBoardRect(Rect{X: 20, Y: 4, W: 22, H: 22})
	w.Handle([]game.Event{hardDrop(12)})
	for i := 0; i < 10; i++ {
		if dx, dy := w.ShakeOffset(); dx != 0 || dy != 0 {
			t.Fatalf("reduced motion produced a shake: %d,%d", dx, dy)
		}
		w.Advance(ShakeStep)
	}
	if w.ParticleCount() == 0 {
		t.Error("reduced motion should keep the debris (§49.5)")
	}
}

func TestBorderFlashesOnImpactAndDecays(t *testing.T) {
	w := boardWorld(47)
	w.Handle([]game.Event{hardDrop(10)})
	if f := w.BorderFlash(); f < 0.9 {
		t.Fatalf("flash = %v at impact, want ~1", f)
	}
	w.Advance(300 * time.Millisecond)
	if f := w.BorderFlash(); f > 0.05 {
		t.Errorf("flash = %v after 300ms, want ~0", f)
	}
}

func TestStrongShakeLastsLongerNotWider(t *testing.T) {
	w := boardWorld(48)
	w.shakeFor(StrongShakeDuration, true)
	frames := 0
	for {
		dx, dy := w.ShakeOffset()
		if dx == 0 && dy == 0 && frames > 2 {
			break
		}
		if dx < -1 || dx > 1 || dy < -1 || dy > 1 {
			t.Fatalf("strong shake exceeded one cell: %d,%d", dx, dy)
		}
		w.Advance(ShakeStep)
		frames++
		if frames > 40 {
			t.Fatal("strong shake never settled")
		}
	}
	if time.Duration(frames)*ShakeStep < ShakeDuration {
		t.Errorf("strong shake lasted only %v", time.Duration(frames)*ShakeStep)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestHardDrop|TestDebris|TestShake|TestReducedMotionSuppresses|TestBorderFlash|TestStrong' -v`
Expected: FAIL — `undefined: (*World).ShakeOffset`.

- [ ] **Step 3: Implement `impact.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/impact.go internal/fx/impact_test.go
git commit -m "feat(fx): hard-drop impact with debris, one-cell shake, border flash"
```

---

### Task 3: Screen shake in the renderer

**Files:**
- Modify: `internal/render/render.go`
- Test: `internal/render/shake_test.go`

**Interfaces:**
- Consumes: `Canvas.Blit`, `Frame`.
- Produces:
  - `Frame` gains `ShakeX, ShakeY int`.
  - `Render` composites the board region through a temporary canvas offset by `(ShakeX, ShakeY)` — the board frame and its contents move, the outer chrome does not (§18 "shift the rendered board"). Cells vacated by the shift become blank; content shifted past the frame edge is clipped.
  - `func clampShake(dx, dy int) (int, int)` — hard-clamps to `[-1,1]`, so a bug in FX can never produce a five-cell lurch.

- [ ] **Step 1: Write the failing test**

`internal/render/shake_test.go`:

```go
package render

import (
	"strings"
	"testing"
)

// Review focus 2: shake must not change the frame's shape.
func TestShakeNeverChangesLineCountOrWidth(t *testing.T) {
	base := lines(Render(frameFor(80, 40, ModeFull, OverlayNone)))
	for _, off := range [][2]int{{0, 1}, {-1, 0}, {1, 0}, {0, -1}, {1, 1}, {-1, -1}} {
		f := frameFor(80, 40, ModeFull, OverlayNone)
		f.ShakeX, f.ShakeY = off[0], off[1]
		got := lines(Render(f))
		if len(got) != len(base) {
			t.Fatalf("offset %v changed the line count: %d vs %d", off, len(got), len(base))
		}
		for i := range got {
			if len([]rune(got[i])) != len([]rune(base[i])) {
				t.Fatalf("offset %v changed line %d width: %d vs %d",
					off, i, len([]rune(got[i])), len([]rune(base[i])))
			}
		}
	}
}

func TestShakeActuallyMovesTheBoard(t *testing.T) {
	base := Render(frameFor(80, 40, ModeFull, OverlayNone))
	f := frameFor(80, 40, ModeFull, OverlayNone)
	f.ShakeX, f.ShakeY = 1, 0
	if plain(Render(f)) == plain(base) {
		t.Fatal("a shake offset changed nothing on screen")
	}
}

func TestShakeIsClampedToOneCell(t *testing.T) {
	f := frameFor(80, 40, ModeFull, OverlayNone)
	f.ShakeX, f.ShakeY = 40, -40
	out := lines(Render(f))
	if len(out) == 0 {
		t.Fatal("no output")
	}
	g := GlyphsFor(ModeFull)
	found := false
	for _, line := range out {
		if strings.Contains(line, g.BorderTL) {
			found = true
		}
	}
	if !found {
		t.Error("a wild shake offset threw the board off screen; clamp it")
	}
	if dx, dy := clampShake(40, -40); dx != 1 || dy != -1 {
		t.Errorf("clampShake(40,-40) = %d,%d want 1,-1", dx, dy)
	}
}

func TestShakeAtTheMinimumTerminalSizeStaysInside(t *testing.T) {
	for _, off := range [][2]int{{0, 1}, {-1, 0}, {1, 0}, {0, -1}} {
		f := frameFor(40, 24, ModeFull, OverlayNone)
		f.ShakeX, f.ShakeY = off[0], off[1]
		for i, line := range lines(Render(f)) {
			if n := len([]rune(line)); n > 40 {
				t.Fatalf("offset %v line %d is %d columns wide", off, i, n)
			}
		}
	}
}

func TestOverlaysDoNotShake(t *testing.T) {
	// The pause box should stay put even if a shake is in flight.
	a := frameFor(80, 40, ModeFull, OverlayPause)
	b := frameFor(80, 40, ModeFull, OverlayPause)
	b.ShakeX, b.ShakeY = 1, 1
	pick := func(f Frame) string {
		for _, line := range lines(Render(f)) {
			if strings.Contains(line, "TEMPORAL SUSPENSION") {
				return line
			}
		}
		return ""
	}
	if pick(a) == "" {
		t.Fatal("pause overlay missing")
	}
	if pick(a) != pick(b) {
		t.Error("the overlay moved with the shake; only the board should shake")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run Shake -v`
Expected: FAIL — `Frame` has no `ShakeX`.

- [ ] **Step 3: Implement the shake compositing in `render.go`**

Draw the board (steps 3–7 of §37) into a canvas the size of `Layout.Frame`, then `Blit` it onto the main canvas at `Frame.X+dx, Frame.Y+dy`, blanking the frame region first so the vacated cells are clean.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/render.go internal/render/shake_test.go
git commit -m "feat(render): one-cell board shake that never reflows the frame"
```

---

### Task 4: Line-clear supernova

**Files:**
- Create: `internal/fx/lineclear.go`
- Test: `internal/fx/lineclear_test.go`

**Interfaces:**
- Consumes: `game.Event` (`LinesCleared`, with `Rows` and `RowCells`), `World.SetBoardRect`, particles.
- Produces:
  - ```go
    type ClearPhase int
    const (PhaseCriticalMass ClearPhase = iota; PhaseSupernova; PhaseCollapse; PhaseDone)

    type ClearAnim struct {
        Row     int      // logical board row
        Cells   []game.Cell // snapshot, pre-collapse
        Age     time.Duration
    }
    func (a ClearAnim) Phase() ClearPhase
    func (a ClearAnim) Progress() float64 // 0..1 within the whole animation
    func (w *World) ClearAnims() []ClearAnim
    ```
  - `const ClearDuration = 220 * time.Millisecond`, with phase boundaries at `70ms` (A→B) and `150ms` (B→C), per §19's three phases inside ~220ms.
  - On `LinesCleared`: one `ClearAnim` per row, holding the row snapshot; at the B→C boundary each row erupts into debris whose horizontal velocity is proportional to `column - center` (§19 "particles should inherit some horizontal velocity from their location relative to center") — `10` particles per row, `VX = (col - 4.5) * 1.6`, `UpBias 6`.
  - Anims are dropped once `Age >= ClearDuration`.

- [ ] **Step 1: Write the failing test**

`internal/fx/lineclear_test.go`:

```go
package fx

import (
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func clearEvent(rows ...int) game.Event {
	snap := make([][]game.Cell, len(rows))
	for i := range rows {
		row := make([]game.Cell, game.Width)
		for x := range row {
			row[x] = game.CellFor(game.AllKinds[x%7])
		}
		snap[i] = row
	}
	return game.Event{Kind: game.LinesCleared, Rows: rows, RowCells: snap}
}

func TestClearAnimIsCreatedPerRow(t *testing.T) {
	w := boardWorld(51)
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	anims := w.ClearAnims()
	if len(anims) != 4 {
		t.Fatalf("got %d anims want 4", len(anims))
	}
	rows := map[int]bool{}
	for _, a := range anims {
		rows[a.Row] = true
		if len(a.Cells) != game.Width {
			t.Errorf("row %d snapshot is %d wide", a.Row, len(a.Cells))
		}
	}
	for _, r := range []int{18, 19, 20, 21} {
		if !rows[r] {
			t.Errorf("row %d missing", r)
		}
	}
}

func TestPhasesRunAThenBThenCWithinTwoTwentyMillis(t *testing.T) {
	w := boardWorld(52)
	w.Handle([]game.Event{clearEvent(21)})
	seen := []ClearPhase{}
	for elapsed := time.Duration(0); elapsed <= ClearDuration; elapsed += 20 * time.Millisecond {
		if anims := w.ClearAnims(); len(anims) > 0 {
			p := anims[0].Phase()
			if len(seen) == 0 || seen[len(seen)-1] != p {
				seen = append(seen, p)
			}
		}
		w.Advance(20 * time.Millisecond)
	}
	want := []ClearPhase{PhaseCriticalMass, PhaseSupernova, PhaseCollapse}
	if len(seen) < 3 {
		t.Fatalf("phases observed: %v want at least %v", seen, want)
	}
	for i := range want {
		if seen[i] != want[i] {
			t.Fatalf("phase order %v want %v", seen, want)
		}
	}
}

func TestClearAnimEndsAndIsForgotten(t *testing.T) {
	w := boardWorld(53)
	w.Handle([]game.Event{clearEvent(21)})
	w.Advance(ClearDuration + 20*time.Millisecond)
	if n := len(w.ClearAnims()); n != 0 {
		t.Fatalf("%d anims still alive after the animation window", n)
	}
}

func TestCollapsePhaseThrowsDebrisOutwardFromTheCentre(t *testing.T) {
	w := boardWorld(54)
	w.Handle([]game.Event{clearEvent(21)})
	w.Advance(160 * time.Millisecond) // into phase C
	if w.ParticleCount() == 0 {
		t.Fatal("the collapse produced no debris")
	}
	var leftGoingLeft, rightGoingRight int
	cx := 20 + 1 + 9 // board rect X + border + centre-ish column in canvas terms
	for _, p := range w.Particles() {
		if p.X < float64(cx) && p.VX < 0 {
			leftGoingLeft++
		}
		if p.X > float64(cx) && p.VX > 0 {
			rightGoingRight++
		}
	}
	if leftGoingLeft == 0 || rightGoingRight == 0 {
		t.Errorf("debris did not inherit outward horizontal velocity (%d left, %d right)",
			leftGoingLeft, rightGoingRight)
	}
}

func TestProgressRunsZeroToOne(t *testing.T) {
	w := boardWorld(55)
	w.Handle([]game.Event{clearEvent(21)})
	last := -1.0
	for i := 0; i < 12; i++ {
		anims := w.ClearAnims()
		if len(anims) == 0 {
			break
		}
		p := anims[0].Progress()
		if p < 0 || p > 1 {
			t.Fatalf("progress %v out of range", p)
		}
		if p < last {
			t.Fatalf("progress went backwards: %v then %v", last, p)
		}
		last = p
		w.Advance(20 * time.Millisecond)
	}
	if last < 0.5 {
		t.Errorf("progress only reached %v", last)
	}
}

// Review focus 4: gameplay does not wait, so a second clear can arrive mid-animation.
func TestASecondClearDuringTheAnimationIsHandledCleanly(t *testing.T) {
	w := boardWorld(56)
	w.Handle([]game.Event{clearEvent(21)})
	w.Advance(100 * time.Millisecond)
	w.Handle([]game.Event{clearEvent(20, 21)})
	if n := len(w.ClearAnims()); n != 3 {
		t.Fatalf("expected the old anim plus two new ones, got %d", n)
	}
	for i := 0; i < 30; i++ {
		w.Advance(20 * time.Millisecond)
	}
	if n := len(w.ClearAnims()); n != 0 {
		t.Errorf("%d anims outlived their window", n)
	}
}

func TestMissingSnapshotDoesNotCrashTheAnimation(t *testing.T) {
	w := boardWorld(57)
	w.Handle([]game.Event{{Kind: game.LinesCleared, Rows: []int{21}}}) // no RowCells
	w.Advance(ClearDuration + 20*time.Millisecond)                     // must not panic
}

func TestNoClearAnimWhenFXIsOff(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 58, Intensity: IntensityOff})
	w.Handle([]game.Event{clearEvent(21)})
	if len(w.ClearAnims()) != 0 {
		t.Error("IntensityOff must not animate clears")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestClear|TestPhases|TestCollapse|TestProgress|TestASecondClear|TestMissingSnapshot' -v`
Expected: FAIL — `undefined: ClearAnim`.

- [ ] **Step 3: Implement `lineclear.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/lineclear.go internal/fx/lineclear_test.go
git commit -m "feat(fx): three-phase line-clear supernova with centre-relative debris"
```

---

### Task 5: Shockwaves

**Files:**
- Create: `internal/fx/shockwave.go`
- Test: `internal/fx/shockwave_test.go`

**Interfaces:**
- Consumes: `World`, `game.Event`.
- Produces:
  - ```go
    type Shockwave struct {
        X, Y   float64 // canvas cells
        Age    time.Duration
        Life   time.Duration
        Radius float64 // cells, derived from Age
    }
    func (w *World) Shockwaves() []Shockwave
    func (s Shockwave) Glyph() rune // · ○ ◌ ◯ by radius band; ASCII: . o O 0
    ```
  - `const ShockwaveLife = 300 * time.Millisecond`, `ShockwaveMaxRadius = 9.0`, `MaxShockwaves = 4`.
  - Triggered only by four-line clears and by game over — used sparingly (§24). Never created when `Intensity != IntensityFull` (§49.5 suppresses shockwaves under reduced motion).
  - Because the terminal has no circles, the renderer places glyphs on an ellipse with a 2:1 column:row ratio; `func (s Shockwave) Points(ascii bool) [][2]int` returns the integer cell offsets for the current radius.

- [ ] **Step 1: Write the failing test**

`internal/fx/shockwave_test.go`:

```go
package fx

import (
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func TestFourLineClearCreatesAShockwave(t *testing.T) {
	w := boardWorld(61)
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	if len(w.Shockwaves()) == 0 {
		t.Fatal("a four-line clear made no shockwave")
	}
}

func TestSingleClearMakesNoShockwave(t *testing.T) {
	w := boardWorld(62)
	w.Handle([]game.Event{clearEvent(21)})
	if n := len(w.Shockwaves()); n != 0 {
		t.Errorf("a single clear made %d shockwaves; §24 says use them sparingly", n)
	}
}

func TestShockwaveExpandsThenDies(t *testing.T) {
	w := boardWorld(63)
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	first := w.Shockwaves()[0].Radius
	w.Advance(100 * time.Millisecond)
	if w.Shockwaves()[0].Radius <= first {
		t.Errorf("radius did not grow: %v -> %v", first, w.Shockwaves()[0].Radius)
	}
	w.Advance(ShockwaveLife)
	if n := len(w.Shockwaves()); n != 0 {
		t.Errorf("%d shockwaves alive past %v", n, ShockwaveLife)
	}
}

func TestShockwaveRadiusIsBounded(t *testing.T) {
	w := boardWorld(64)
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	for i := 0; i < 20; i++ {
		for _, s := range w.Shockwaves() {
			if s.Radius > ShockwaveMaxRadius {
				t.Fatalf("radius %v exceeds the cap", s.Radius)
			}
		}
		w.Advance(20 * time.Millisecond)
	}
}

func TestShockwaveCountIsCapped(t *testing.T) {
	w := boardWorld(65)
	for i := 0; i < 20; i++ {
		w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
		if n := len(w.Shockwaves()); n > MaxShockwaves {
			t.Fatalf("%d shockwaves alive, cap is %d", n, MaxShockwaves)
		}
	}
}

func TestShockwavePointsFormAWideEllipse(t *testing.T) {
	w := boardWorld(66)
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	w.Advance(150 * time.Millisecond)
	pts := w.Shockwaves()[0].Points(false)
	if len(pts) < 6 {
		t.Fatalf("only %d ring points", len(pts))
	}
	var maxDX, maxDY int
	for _, p := range pts {
		if p[0] > maxDX {
			maxDX = p[0]
		}
		if p[1] > maxDY {
			maxDY = p[1]
		}
	}
	if maxDX <= maxDY {
		t.Errorf("ring is %d wide and %d tall; terminal cells are tall, so it must be wider", maxDX, maxDY)
	}
}

func TestShockwaveGlyphChangesWithRadiusAndStaysASCIISafe(t *testing.T) {
	small := Shockwave{Radius: 1, Life: ShockwaveLife}
	big := Shockwave{Radius: 8, Life: ShockwaveLife}
	if small.Glyph() == big.Glyph() {
		t.Error("ring glyph should change as the ring grows")
	}
	w := NewWorld(80, 40, Options{Seed: 67, Intensity: IntensityFull, ASCII: true})
	w.SetBoardRect(Rect{X: 20, Y: 4, W: 22, H: 22})
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	for _, s := range w.Shockwaves() {
		if s.Glyph() > 127 {
			t.Errorf("ascii mode ring glyph %q", s.Glyph())
		}
	}
}

// §49.5
func TestReducedMotionSuppressesShockwaves(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 68, Intensity: IntensityReduced})
	w.SetBoardRect(Rect{X: 20, Y: 4, W: 22, H: 22})
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	if n := len(w.Shockwaves()); n != 0 {
		t.Fatalf("reduced motion produced %d shockwaves", n)
	}
	if w.ParticleCount() == 0 {
		t.Error("reduced motion should still erupt particles")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run Shock -v`
Expected: FAIL — `undefined: Shockwave`.

- [ ] **Step 3: Implement `shockwave.go`**

`Points` walks angles in fixed increments (e.g. 16 steps) and dedupes the resulting integer cells, scaling `dx` by 2.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/shockwave.go internal/fx/shockwave_test.go
git commit -m "feat(fx): sparing elliptical shockwaves"
```

---

### Task 6: Hyperdrive

**Files:**
- Create: `internal/fx/hyperdrive.go`
- Modify: `internal/fx/starfield.go` (consume the multiplier and the stretch flag)
- Test: `internal/fx/hyperdrive_test.go`

**Interfaces:**
- Consumes: `World`, starfield.
- Produces:
  - `func (w *World) TriggerHyperdrive()`, `func (w *World) HyperdriveActive() bool`, `func (w *World) HyperdriveFactor() float64` — the star-speed multiplier over the §16 timeline: `0ms` factor `0` (stars pause), `50ms` factor `0.2` with `HyperdriveStretch() == true`, `100ms` ramping violently, `500ms` peak `8.0`, `800ms` decaying, `1100ms` back to `1.0` and inactive.
  - `const HyperdriveLife = 1100 * time.Millisecond`, `HyperdrivePeak = 8.0`.
  - `func (w *World) NoteScore(score int)` — tracks the session high score so a new high triggers hyperdrive (§16). Triggers: `LinesCleared` with 4 rows; `ComboChanged` with `Combo >= 4` ("large combo"); a new high score.
  - Under `IntensityReduced`, `TriggerHyperdrive` is a no-op and `HyperdriveFactor()` stays `1.0` (§49.5 suppresses hyperdrive acceleration); the starfield keeps its normal drift.
  - The starfield multiplies its per-layer speed by `StarSpeedScale() * HyperdriveFactor()`; near stars stretch to `|` glyphs while `HyperdriveStretch()` is true.

- [ ] **Step 1: Write the failing test**

`internal/fx/hyperdrive_test.go`:

```go
package fx

import (
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/game"
)

func TestHyperdriveTimelineFollowsTheSpec(t *testing.T) {
	w := boardWorld(71)
	w.TriggerHyperdrive()
	if !w.HyperdriveActive() {
		t.Fatal("not active immediately after the trigger")
	}
	if f := w.HyperdriveFactor(); f > 0.05 {
		t.Errorf("at 0ms stars should pause, factor = %v", f)
	}
	w.Advance(60 * time.Millisecond)
	if !w.HyperdriveStretch() {
		t.Error("at ~50ms stars should be stretching")
	}
	w.Advance(440 * time.Millisecond) // ~500ms: peak
	peak := w.HyperdriveFactor()
	if peak < 4 {
		t.Errorf("peak factor = %v, want a violent multiple (up to %v)", peak, HyperdrivePeak)
	}
	if peak > HyperdrivePeak {
		t.Errorf("peak factor %v exceeds the cap %v", peak, HyperdrivePeak)
	}
	w.Advance(350 * time.Millisecond) // ~850ms: decaying
	if d := w.HyperdriveFactor(); d >= peak {
		t.Errorf("factor did not decay: %v then %v", peak, d)
	}
	w.Advance(300 * time.Millisecond) // past 1100ms
	if w.HyperdriveActive() {
		t.Error("hyperdrive outlived its 1100ms window")
	}
	if f := w.HyperdriveFactor(); f != 1 {
		t.Errorf("factor = %v after the window, want 1", f)
	}
}

func TestFourLineClearTriggersHyperdrive(t *testing.T) {
	w := boardWorld(72)
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	if !w.HyperdriveActive() {
		t.Error("a four-line clear must trigger hyperdrive (§16)")
	}
}

func TestSmallClearDoesNotTriggerHyperdrive(t *testing.T) {
	w := boardWorld(73)
	w.Handle([]game.Event{clearEvent(21)})
	if w.HyperdriveActive() {
		t.Error("a single clear should not trigger hyperdrive")
	}
}

func TestLargeComboTriggersHyperdrive(t *testing.T) {
	w := boardWorld(74)
	w.Handle([]game.Event{{Kind: game.ComboChanged, Combo: 2}})
	if w.HyperdriveActive() {
		t.Error("combo 2 is not a large combo")
	}
	w.Handle([]game.Event{{Kind: game.ComboChanged, Combo: 4}})
	if !w.HyperdriveActive() {
		t.Error("combo 4 should count as a large combo")
	}
}

func TestNewHighScoreTriggersHyperdriveOnce(t *testing.T) {
	w := boardWorld(75)
	w.NoteScore(100)
	if !w.HyperdriveActive() {
		t.Error("the first high score should trigger hyperdrive")
	}
	w.Advance(HyperdriveLife + 50*time.Millisecond)
	w.NoteScore(50)
	if w.HyperdriveActive() {
		t.Error("a lower score must not re-trigger")
	}
	w.NoteScore(200)
	if !w.HyperdriveActive() {
		t.Error("beating the high score should trigger again")
	}
}

func TestHyperdriveActuallySpeedsStarsUp(t *testing.T) {
	calm := full(80, 40, 76)
	calm.Advance(100 * time.Millisecond)
	calmDrift := 0.0
	for _, s := range calm.Stars() {
		calmDrift += s.Y
	}

	fast := full(80, 40, 76)
	fast.TriggerHyperdrive()
	fast.Advance(500 * time.Millisecond) // reach peak
	fast.Advance(100 * time.Millisecond)
	fastDrift := 0.0
	for _, s := range fast.Stars() {
		fastDrift += s.Y
	}
	if fastDrift <= calmDrift {
		t.Errorf("hyperdrive did not move the starfield harder (%v vs %v)", fastDrift, calmDrift)
	}
	for _, s := range fast.Stars() {
		if s.Y >= 40 || s.Y < -1 {
			t.Fatalf("hyperdrive threw a star out of the viewport: %+v", s)
		}
	}
}

// §49.5
func TestReducedMotionSuppressesHyperdrive(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 77, Intensity: IntensityReduced})
	w.SetBoardRect(Rect{X: 20, Y: 4, W: 22, H: 22})
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	if w.HyperdriveActive() {
		t.Fatal("reduced motion must not accelerate the starfield")
	}
	if f := w.HyperdriveFactor(); f != 1 {
		t.Errorf("factor = %v want 1", f)
	}
	if len(w.Stars()) == 0 {
		t.Error("stars themselves must survive reduced motion")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run Hyper -v`
Expected: FAIL — `undefined: (*World).TriggerHyperdrive`.

- [ ] **Step 3: Implement `hyperdrive.go` and hook the starfield**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/hyperdrive.go internal/fx/starfield.go internal/fx/hyperdrive_test.go
git commit -m "feat(fx): hyperdrive with the §16 timeline"
```

---

### Task 7: The four-line event, banners, HUD flash, combo tiers, level-up notice

**Files:**
- Create: `internal/fx/major.go`
- Modify: `internal/flavor/messages.go` (only if a line is missing)
- Test: `internal/fx/major_test.go`

**Interfaces:**
- Consumes: everything above, plus `flavor.FourLineBanners` and `flavor.LevelSubtitles`.
- Produces:
  - ```go
    type Banner struct {
        Text     string
        Subtitle string
        Age, Life time.Duration
        Style    BannerStyle // BannerHuge (four-line) or BannerNotice (level-up)
    }
    func (w *World) Banners() []Banner
    func (b Banner) Alpha() float64 // 1 while fresh, fading over the last third
    func (b Banner) OffsetY() int    // the level-up notice slides up as it fades
    func (w *World) HUDFlash() float64  // 0..1
    func (w *World) HUDPulse() float64  // 0..1, oscillating while combo >= 4
    func (w *World) StarDensityBoost() float64 // 1.0 normally, up to 1.6 after a quad
    ```
  - `const BannerLife = 700 * time.Millisecond` (§20), `NoticeLife = 1200 * time.Millisecond` (§22 slides/fades away), `MaxBanners = 2`.
  - Four-line handling fires all of §20 at once: `TriggerHyperdrive()`, `shakeFor(StrongShakeDuration, true)`, border energy (already wired), a `~90`-particle eruption from the cleared band, a `BannerHuge` with a `flavor.FourLineBanners` pick, `HUDFlash() = 1`, `StarDensityBoost()` raised for `1.5s`, and a shockwave (Task 5).
  - Combo tiers (§21): `combo 2` → a `12`-particle spark burst; `combo 3` → `20` meteor particles (fast, shallow angle, longer life); `combo 4` → `HUDPulse()` becomes non-zero; `combo 5+` → escalating particle counts plus a `flavor.ComboLine(combo)` handed to the channel by the app.
  - `LevelChanged` → a `BannerNotice` with `LEVEL nn` and a `flavor.LevelSubtitles` pick, plus the `GRAVITY ANOMALY DETECTED` heading from §22.
  - `func asciiFold(s string) string` (unexported) — when `Options.ASCII` is set, every banner and subtitle string is folded before it is stored: `✦` → `*`, `·` → `.`, `˚` → `'`, and any other rune above 127 is dropped. `flavor.FourLineBanners` includes `✦ EVENT HORIZON ✦`, so without this the `--ascii` build emits non-ASCII the moment a quad lands.

- [ ] **Step 1: Write the failing test**

`internal/fx/major_test.go`:

```go
package fx

import (
	"strings"
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/flavor"
	"github.com/jessev/cosmic-tetris/internal/game"
)

func TestFourLineClearFiresEverythingAtOnce(t *testing.T) {
	w := boardWorld(81)
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	if !w.HyperdriveActive() {
		t.Error("no hyperdrive")
	}
	if dx, dy := w.ShakeOffset(); dx == 0 && dy == 0 {
		t.Error("no screen shake")
	}
	if w.BorderEnergy() < 0.5 {
		t.Errorf("border energy only %v", w.BorderEnergy())
	}
	if w.ParticleCount() < 40 {
		t.Errorf("only %d particles erupted", w.ParticleCount())
	}
	if w.HUDFlash() < 0.9 {
		t.Errorf("HUD flash = %v", w.HUDFlash())
	}
	if w.StarDensityBoost() <= 1 {
		t.Errorf("star density boost = %v", w.StarDensityBoost())
	}
	if len(w.Shockwaves()) == 0 {
		t.Error("no shockwave")
	}
	banners := w.Banners()
	if len(banners) == 0 {
		t.Fatal("no banner")
	}
	found := false
	for _, b := range flavor.FourLineBanners {
		if banners[0].Text == b {
			found = true
		}
	}
	if !found {
		t.Errorf("banner text %q is not one of the §20 banners", banners[0].Text)
	}
	if banners[0].Style != BannerHuge {
		t.Error("a four-line banner should be the giant style")
	}
}

func TestBannerLivesAboutSevenHundredMillisecondsAndFades(t *testing.T) {
	w := boardWorld(82)
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	if a := w.Banners()[0].Alpha(); a < 0.99 {
		t.Errorf("fresh banner alpha = %v want 1", a)
	}
	w.Advance(600 * time.Millisecond)
	if len(w.Banners()) == 0 {
		t.Fatal("banner vanished early")
	}
	if a := w.Banners()[0].Alpha(); a >= 1 {
		t.Errorf("banner should be fading by 600ms, alpha = %v", a)
	}
	w.Advance(200 * time.Millisecond)
	if n := len(w.Banners()); n != 0 {
		t.Errorf("%d banners alive past %v", n, BannerLife)
	}
}

func TestBannerCountIsCapped(t *testing.T) {
	w := boardWorld(83)
	for i := 0; i < 10; i++ {
		w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	}
	if n := len(w.Banners()); n > MaxBanners {
		t.Fatalf("%d banners alive, cap is %d", n, MaxBanners)
	}
}

func TestLevelUpShowsASlidingNotice(t *testing.T) {
	w := boardWorld(84)
	w.Handle([]game.Event{{Kind: game.LevelChanged, Level: 8}})
	bs := w.Banners()
	if len(bs) == 0 {
		t.Fatal("no level-up notice")
	}
	b := bs[0]
	if b.Style != BannerNotice {
		t.Error("level up should use the notice style")
	}
	if !strings.Contains(b.Text, "GRAVITY ANOMALY") && !strings.Contains(b.Text, "LEVEL 08") {
		t.Errorf("notice text %q does not match §22", b.Text)
	}
	if !strings.Contains(b.Text+b.Subtitle, "08") {
		t.Errorf("the notice should name the level: %q / %q", b.Text, b.Subtitle)
	}
	start := w.Banners()[0].OffsetY()
	w.Advance(600 * time.Millisecond)
	if len(w.Banners()) == 0 {
		t.Fatal("notice vanished too early")
	}
	if w.Banners()[0].OffsetY() == start {
		t.Error("the notice should slide as it fades (§22)")
	}
	w.Advance(NoticeLife)
	if n := len(w.Banners()); n != 0 {
		t.Errorf("%d notices alive past %v", n, NoticeLife)
	}
}

func TestComboTiersEscalate(t *testing.T) {
	counts := map[int]int{}
	for _, combo := range []int{2, 3, 5, 7} {
		w := boardWorld(85)
		w.Handle([]game.Event{{Kind: game.ComboChanged, Combo: combo}})
		counts[combo] = w.ParticleCount()
	}
	if counts[2] == 0 {
		t.Error("combo 2 should throw small sparks")
	}
	if !(counts[2] < counts[3] && counts[3] < counts[5] && counts[5] <= counts[7]) {
		t.Errorf("combo effects do not escalate: %v", counts)
	}
}

func TestHUDPulseStartsAtComboFour(t *testing.T) {
	w := boardWorld(86)
	w.Handle([]game.Event{{Kind: game.ComboChanged, Combo: 3}})
	if w.HUDPulse() != 0 {
		t.Errorf("combo 3 should not pulse the HUD, got %v", w.HUDPulse())
	}
	w.Handle([]game.Event{{Kind: game.ComboChanged, Combo: 4}})
	w.Advance(100 * time.Millisecond)
	if w.HUDPulse() == 0 {
		t.Error("combo 4 should pulse the HUD (§21)")
	}
	w.Handle([]game.Event{{Kind: game.ComboChanged, Combo: 0}})
	w.Advance(100 * time.Millisecond)
	if w.HUDPulse() != 0 {
		t.Error("breaking the combo should stop the pulse")
	}
}

func TestHUDFlashAndDensityBoostDecay(t *testing.T) {
	w := boardWorld(87)
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	w.Advance(2 * time.Second)
	if f := w.HUDFlash(); f > 0.05 {
		t.Errorf("flash = %v after 2s", f)
	}
	if b := w.StarDensityBoost(); b > 1.01 {
		t.Errorf("density boost = %v after 2s, want back to 1", b)
	}
}

func TestBannersAreEmptyWhenFXIsOff(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 88, Intensity: IntensityOff})
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21), {Kind: game.LevelChanged, Level: 3}})
	if len(w.Banners()) != 0 {
		t.Error("IntensityOff must not banner")
	}
}

func TestASCIIModeBannersAreASCII(t *testing.T) {
	// flavor.FourLineBanners contains "✦ EVENT HORIZON ✦"; ascii mode must fold it.
	for seed := int64(0); seed < 40; seed++ {
		w := NewWorld(80, 40, Options{Seed: seed, Intensity: IntensityFull, ASCII: true})
		w.SetBoardRect(Rect{X: 20, Y: 4, W: 22, H: 22})
		w.Handle([]game.Event{clearEvent(18, 19, 20, 21), {Kind: game.LevelChanged, Level: 12}})
		for _, b := range w.Banners() {
			for _, r := range b.Text + b.Subtitle {
				if r > 127 {
					t.Fatalf("seed %d: banner %q contains %q", seed, b.Text, r)
				}
			}
		}
		w.Advance(2 * time.Second)
	}
}

func TestNonASCIIModeKeepsTheNiceGlyphs(t *testing.T) {
	seen := false
	for seed := int64(0); seed < 60 && !seen; seed++ {
		w := boardWorld(seed)
		w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
		if strings.Contains(w.Banners()[0].Text, "✦") {
			seen = true
		}
	}
	if !seen {
		t.Error("full mode never produced the ✦ banner; the fold is running unconditionally")
	}
}

func TestReducedMotionStillBannersAndFlashes(t *testing.T) {
	w := NewWorld(80, 40, Options{Seed: 89, Intensity: IntensityReduced})
	w.SetBoardRect(Rect{X: 20, Y: 4, W: 22, H: 22})
	w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	if len(w.Banners()) == 0 {
		t.Error("reduced motion should keep the banner; it suppresses motion, not comedy")
	}
	if w.HUDFlash() == 0 {
		t.Error("reduced motion should keep the HUD flash")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestFourLine|TestBanner|TestLevelUp|TestCombo|TestHUD' -v`
Expected: FAIL — `undefined: Banner`.

- [ ] **Step 3: Implement `major.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/major.go internal/fx/major_test.go internal/flavor/messages.go
git commit -m "feat(fx): four-line event, banners, HUD flash, combo tiers, level notice"
```

---

### Task 8: Render the violence

**Files:**
- Modify: `internal/render/fxdraw.go`, `internal/render/render.go`, `internal/render/hud.go`
- Test: `internal/render/violence_test.go`
- Modify: `internal/render/golden_test.go` (add a four-line-clear golden)

**Interfaces:**
- Consumes: `fx.Particle`, `fx.Shockwave`, `fx.ClearAnim`, `fx.Banner`.
- Produces:
  - `Frame` gains `Particles []fx.Particle`, `Shockwaves []fx.Shockwave`, `ClearAnims []fx.ClearAnim`, `Banners []fx.Banner`, `HUDFlash float64`, `HUDPulse float64`, `BorderFlash float64`.
  - `func DrawParticles(c *Canvas, frame Rect, ps []fx.Particle, m Mode)` — rounds float positions to cells; **skips any cell inside `frame` whose rune is not blank**, so debris never covers a locked or active block (§44); outside the frame it draws freely.
  - `func DrawShockwaves(c *Canvas, ss []fx.Shockwave, m Mode)`.
  - `func DrawClearAnims(c *Canvas, frame Rect, as []fx.ClearAnim, m Mode)` — phase A paints the snapshot row in `▓` with alternating hot cells; phase B paints an outward `░░▓▓██✦✦██▓▓░░` wavefront from the row centre; phase C paints sparse debris glyphs. **This is the one effect allowed to draw over the well's cells**, and only on the rows it is animating: gameplay has already deleted those rows and §19 requires them to keep exploding for 220ms. It is composited after the locked board and before the ghost and active piece, so §44's "never obscure the active piece" still holds.
  - `func DrawBanners(c *Canvas, l Layout, bs []fx.Banner, m Mode)` — `BannerHuge` centres over the board; `BannerNotice` boxes itself above the board and honours `OffsetY()`.
  - `hud.go` gains a flash/pulse-aware `func statPaint(base Paint, flash, pulse float64) Paint`.

- [ ] **Step 1: Write the failing test**

`internal/render/violence_test.go`:

```go
package render

import (
	"strings"
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/fx"
	"github.com/jessev/cosmic-tetris/internal/game"
)

// Review focus 3: particles must never cover the board.
func TestParticlesNeverCoverBoardCells(t *testing.T) {
	r := Rect{X: 0, Y: 0, W: FrameCols, H: FrameRows}
	var b game.Board
	b.Set(4, 12, game.CellFor(game.KindI))
	active := game.Piece{Kind: game.KindO, Rotation: 0, X: 6, Y: 14}
	c := NewCanvas(FrameCols, FrameRows)
	DrawBoard(c, r, BoardView{Board: &b, Active: active, ShowActive: true}, ModeFull, Paint{})

	bx, by := BoardCellXY(r, 4, 12)
	ax, ay := BoardCellXY(r, 7, 14)
	DrawParticles(c, r, []fx.Particle{
		{X: float64(bx), Y: float64(by), Glyph: '*', Life: 1, MaxLife: 1, Brightness: 1},
		{X: float64(ax), Y: float64(ay), Glyph: '*', Life: 1, MaxLife: 1, Brightness: 1},
	}, ModeFull)
	if c.Rune(bx, by) != '█' {
		t.Error("a particle covered a locked block")
	}
	if c.Rune(ax, ay) != '█' {
		t.Error("a particle covered the active piece")
	}
}

func TestParticlesDrawOutsideTheBoardFreely(t *testing.T) {
	c := NewCanvas(60, 20)
	frame := Rect{X: 20, Y: 2, W: FrameCols, H: FrameRows}
	DrawParticles(c, frame, []fx.Particle{{X: 4, Y: 4, Glyph: '*', Life: 1, MaxLife: 1, Brightness: 1}}, ModeFull)
	if c.Rune(4, 4) != '*' {
		t.Errorf("particle outside the board was not drawn: %q", c.Rune(4, 4))
	}
}

func TestParticlesLeaveNoPermanentMark(t *testing.T) {
	f := frameFor(80, 40, ModeFull, OverlayNone)
	clean := plain(Render(f))
	f.Particles = []fx.Particle{{X: 4, Y: 4, Glyph: '*', Life: 1, MaxLife: 1, Brightness: 1}}
	dirty := plain(Render(f))
	if clean == dirty {
		t.Fatal("the particle was not drawn at all")
	}
	f.Particles = nil
	if plain(Render(f)) != clean {
		t.Error("a dead particle left a permanent mark on the frame (§44)")
	}
}

func TestParticlesOutsideTheCanvasAreIgnored(t *testing.T) {
	c := NewCanvas(10, 5)
	DrawParticles(c, Rect{W: 10, H: 5}, []fx.Particle{
		{X: -50, Y: -50, Glyph: '*', Life: 1, MaxLife: 1},
		{X: 1e9, Y: 1e9, Glyph: '*', Life: 1, MaxLife: 1},
	}, ModeFull) // must not panic
	if strings.Contains(plain(c.String()), "*") {
		t.Error("an off-canvas particle was drawn")
	}
}

func TestClearAnimPaintsTheVanishedRow(t *testing.T) {
	r := Rect{W: FrameCols, H: FrameRows}
	row := make([]game.Cell, game.Width)
	for x := range row {
		row[x] = game.CellFor(game.KindI)
	}
	for _, age := range []time.Duration{0, 100 * time.Millisecond, 190 * time.Millisecond} {
		var b game.Board // the row is already gone from the board
		c := NewCanvas(FrameCols, FrameRows)
		DrawBoard(c, r, BoardView{Board: &b}, ModeFull, Paint{})
		DrawClearAnims(c, r, []fx.ClearAnim{{Row: 20, Cells: row, Age: age}}, ModeFull)
		x, y := BoardCellXY(r, 0, 20)
		if c.Rune(x, y) == ' ' && c.Rune(x+9, y) == ' ' {
			t.Errorf("age %v: the exploding row rendered as empty space", age)
		}
	}
}

// Review focus 4: a new piece during the animation.
func TestActivePieceStaysVisibleDuringAClearAnimation(t *testing.T) {
	f := frameFor(80, 40, ModeFull, OverlayNone)
	f.Game.Active = game.Piece{Kind: game.KindT, Rotation: 0, X: 3, Y: 20}
	row := make([]game.Cell, game.Width)
	for x := range row {
		row[x] = game.CellFor(game.KindZ)
	}
	f.ClearAnims = []fx.ClearAnim{{Row: 20, Cells: row, Age: 100 * time.Millisecond}}
	out := lines(Render(f))
	for _, cell := range f.Game.Active.Cells() {
		x, y := BoardCellXY(f.Layout.Frame, cell[0], cell[1])
		if y < 0 || y >= len(out) {
			continue
		}
		if got := []rune(out[y])[x]; got != '█' {
			t.Errorf("the clear animation covered the active piece at %v: %q", cell, got)
		}
	}
}

func TestBannerIsCentredOverTheBoardAndFitsTheTerminal(t *testing.T) {
	for _, dims := range [][2]int{{40, 24}, {80, 40}} {
		f := frameFor(dims[0], dims[1], ModeFull, OverlayNone)
		f.Banners = []fx.Banner{{Text: "SPACE-TIME HAS FILED A COMPLAINT", Life: 700 * time.Millisecond, Style: fx.BannerHuge}}
		out := lines(Render(f))
		hit := false
		for i, line := range out {
			if len([]rune(line)) > dims[0] {
				t.Fatalf("%v: banner overflowed line %d", dims, i)
			}
			if strings.Contains(line, "SPACE-TIME") || strings.Contains(line, "COMPLAINT") {
				hit = true
			}
		}
		if !hit {
			t.Errorf("%v: banner never appeared", dims)
		}
	}
}

func TestShockwaveRingsDrawAroundTheirCentre(t *testing.T) {
	c := NewCanvas(40, 20)
	DrawShockwaves(c, []fx.Shockwave{{X: 20, Y: 10, Radius: 4, Life: 300 * time.Millisecond}}, ModeFull)
	out := plain(c.String())
	if strings.TrimSpace(out) == "" {
		t.Fatal("the shockwave drew nothing")
	}
	if c.Rune(20, 10) != ' ' {
		t.Error("a ring should be hollow at its centre")
	}
}

func TestHUDFlashChangesTheStatPaintButNotTheText(t *testing.T) {
	a := frameFor(80, 40, ModeFull, OverlayNone)
	b := frameFor(80, 40, ModeFull, OverlayNone)
	b.HUDFlash = 1
	if plain(Render(a)) != plain(Render(b)) {
		t.Error("a HUD flash must change colour only, never the characters")
	}
	if Render(a) == Render(b) {
		t.Error("a HUD flash should change something about the styling")
	}
}

func TestEverythingStillASCIIInASCIIMode(t *testing.T) {
	f := frameFor(80, 40, ModeASCII, OverlayNone)
	f.Particles = []fx.Particle{{X: 4, Y: 4, Glyph: '*', Life: 1, MaxLife: 1, Brightness: 1}}
	f.Shockwaves = []fx.Shockwave{{X: 30, Y: 10, Radius: 3, Life: 300 * time.Millisecond}}
	row := make([]game.Cell, game.Width)
	for x := range row {
		row[x] = game.CellFor(game.KindI)
	}
	f.ClearAnims = []fx.ClearAnim{{Row: 20, Cells: row, Age: 100 * time.Millisecond}}
	f.Banners = []fx.Banner{{Text: "QUADRUPLE COSMIC INCIDENT", Life: 700 * time.Millisecond, Style: fx.BannerHuge}}
	for _, r := range plain(Render(f)) {
		if r > 127 {
			t.Fatalf("ascii mode emitted %q (U+%04X)", r, r)
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestParticles|TestClearAnim|TestActivePieceStays|TestBannerIs|TestShockwaveRings|TestHUDFlash|TestEverythingStill' -v`
Expected: FAIL — `undefined: DrawParticles`.

- [ ] **Step 3: Implement the draw functions and extend `Render`**

Final composite order inside `Render`: starfield → locked board → clear anims → ghost → active piece → trails → particles (board-local) → border → HOLD/NEXT/stats → shockwaves and global particles → banners → mission control → controls. Document this order in a comment mapping it to §37's twelve steps and noting the one deliberate deviation (clear anims before the ghost, so the active piece is never obscured).

- [ ] **Step 4: Run the tests, then record a violence golden**

Add `{"quad", 80, 40, ModeFull, OverlayNone}` to `TestGoldenLayouts`, built from a frame with a fixed banner, a fixed particle list, a fixed clear anim, and `ShakeX/ShakeY = 0,1`.

Run: `go test ./internal/render/ -update && go test ./internal/render/ && cat internal/render/testdata/quad.txt`
Expected: PASS, and the recorded frame is legible — you can still see the well.

- [ ] **Step 5: Commit**

```bash
git add internal/render/fxdraw.go internal/render/render.go internal/render/hud.go internal/render/violence_test.go internal/render/golden_test.go internal/render/testdata
git commit -m "feat(render): particles, supernova rows, shockwaves, banners, HUD flash"
```

---

### Task 9: Wire it up, then audit restraint and performance

**Files:**
- Modify: `internal/app/model.go`, `internal/app/update.go`
- Test: `internal/app/violence_test.go`
- Test: `internal/fx/restraint_test.go`

**Interfaces:**
- Consumes: everything.
- Produces: the model now fills every new `Frame` field from the world each `View()`, calls `FX.NoteScore(m.Game.Score)` each frame, and hands `flavor.ComboLine(combo)` to the channel on `ComboChanged` with `combo >= 5` (§21's "Mission Control has lost control of the mission").

- [ ] **Step 1: Write the failing app test**

`internal/app/violence_test.go`:

```go
package app

import (
	"strings"
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"
	"github.com/jessev/cosmic-tetris/internal/fx"
	"github.com/jessev/cosmic-tetris/internal/game"
)

// advance drives `frames` FrameMsg ticks of `step` each. It starts from the
// model's own LastFrame so it can be called repeatedly on the same model.
func advance(t *testing.T, m *Model, frames int, step time.Duration) *Model {
	t.Helper()
	now := m.LastFrame
	if now.IsZero() {
		now = time.Unix(0, 0)
	}
	for i := 0; i < frames; i++ {
		now = now.Add(step)
		next, _ := m.Update(FrameMsg{Now: now})
		m = next.(*Model)
	}
	return m
}

func TestHardDropProducesVisibleViolence(t *testing.T) {
	m := modelWith(t, Config{Seed: 4242})
	m = advance(t, m, 2, 16*time.Millisecond)
	before := plainOut(m.View())
	m = press(t, m, " ")
	m = advance(t, m, 2, 16*time.Millisecond)
	if m.FX.ParticleCount() == 0 {
		t.Error("a hard drop produced no particles")
	}
	if plainOut(m.View()) == before {
		t.Error("the hard drop changed nothing visible")
	}
}

// Review focus 5: the reduced-motion matrix, end to end.
func TestReducedMotionSuppressesExactlyThreeThings(t *testing.T) {
	play := func(cfg Config) *Model {
		m := modelWith(t, cfg)
		for i := 0; i < 8; i++ {
			m = press(t, m, "left")
			m = press(t, m, " ")
			m = advance(t, m, 2, 16*time.Millisecond)
		}
		return m
	}
	fullM, redM := play(Config{Seed: 1}), play(Config{Seed: 1, ReducedMotion: true})

	if redM.FX.Intensity() != fx.IntensityReduced {
		t.Errorf("reduced motion intensity = %v", redM.FX.Intensity())
	}
	// The three things §49.5 suppresses, forced directly so the test does not
	// depend on the seed happening to produce a quad.
	redM.FX.Handle([]game.Event{{Kind: game.LinesCleared, Rows: []int{18, 19, 20, 21}}})
	if dx, dy := redM.FX.ShakeOffset(); dx != 0 || dy != 0 {
		t.Error("reduced motion shook the screen")
	}
	if redM.FX.HyperdriveActive() {
		t.Error("reduced motion engaged hyperdrive")
	}
	if len(redM.FX.Shockwaves()) != 0 {
		t.Error("reduced motion made a shockwave")
	}
	// And the things it must leave alone.
	if redM.FX.ParticleCount() == 0 {
		t.Error("reduced motion killed the particles; §49.5 says leave them alone")
	}
	if len(fullM.FX.Trails()) > 0 && len(redM.FX.Trails()) == 0 {
		t.Error("reduced motion killed the trails; §49.5 says leave them alone")
	}
	if redM.FX.BorderEnergy() == 0 {
		t.Error("reduced motion killed the border animation")
	}
}

// §44: never make controls lag; never delay gameplay for animation.
func TestInputStillActsWhileEverythingIsExploding(t *testing.T) {
	m := modelWith(t, Config{Seed: 5})
	m.FX.TriggerHyperdrive()
	for i := 0; i < 40; i++ {
		m.FX.EmitBurst(20, 10, 30, fx.BurstSpec{Speed: 6, Life: 5, Glyphs: []rune{'*'}})
	}
	if m.FX.ParticleCount() == 0 {
		t.Fatal("setup: no particles")
	}
	x := m.Game.Active.X
	m = press(t, m, "left")
	if m.Game.Active.X != x-1 {
		t.Fatal("the piece did not move while the FX world was saturated")
	}
	if !strings.Contains(plainOut(m.View()), "SCORE") {
		t.Error("the HUD disappeared under the effects")
	}
}

func TestViewStaysWithinTheTerminalDuringAQuad(t *testing.T) {
	m := modelWith(t, Config{Seed: 6})
	next, _ := m.Update(tea.WindowSizeMsg{Width: 40, Height: 24})
	m = next.(*Model)
	m.FX.Handle([]game.Event{{Kind: game.LinesCleared, Rows: []int{18, 19, 20, 21}}})
	m = advance(t, m, 60, 16*time.Millisecond)
	for i, line := range strings.Split(plainOut(m.View()), "\n") {
		if n := len([]rune(line)); n > 40 {
			t.Fatalf("line %d is %d columns wide during a quad", i, n)
		}
	}
}
```

These tests hand synthetic `LinesCleared` events straight to `m.FX` rather than manoeuvring the real engine into a quad: the assertions are about FX state, and Task 7's own tests already cover the event mapping. `advance` here replaces Plan 02's ad-hoc tick loops — move it into a shared `helpers_test.go` in this package if Plan 02 already defined something like it.

- [ ] **Step 2: Write the failing restraint test**

`internal/fx/restraint_test.go`:

```go
package fx

import (
	"testing"
	"time"

	"github.com/jessev/cosmic-tetris/internal/game"
)

// Review focus 1: minutes of quads must not grow anything.
func TestSustainedQuadsKeepEverythingBounded(t *testing.T) {
	w := boardWorld(91)
	for i := 0; i < 600; i++ { // ~10s of quads at one per frame, far beyond human
		w.Handle([]game.Event{
			clearEvent(18, 19, 20, 21),
			{Kind: game.ComboChanged, Combo: 9},
			{Kind: game.LevelChanged, Level: i % 20},
			hardDrop(15),
		})
		w.Advance(16 * time.Millisecond)
		if n := w.ParticleCount(); n > MaxParticles {
			t.Fatalf("frame %d: %d particles", i, n)
		}
		if n := len(w.Shockwaves()); n > MaxShockwaves {
			t.Fatalf("frame %d: %d shockwaves", i, n)
		}
		if n := len(w.Banners()); n > MaxBanners {
			t.Fatalf("frame %d: %d banners", i, n)
		}
		if n := len(w.Trails()); n > 256 {
			t.Fatalf("frame %d: %d trails", i, n)
		}
		if n := len(w.ClearAnims()); n > 64 {
			t.Fatalf("frame %d: %d clear anims", i, n)
		}
	}
}

func TestAdvanceStaysCheapWithAFullWorld(t *testing.T) {
	w := boardWorld(92)
	for i := 0; i < 20; i++ {
		w.Handle([]game.Event{clearEvent(18, 19, 20, 21)})
	}
	start := time.Now() // a test may read the clock; internal/game may not
	for i := 0; i < 6000; i++ {
		w.Advance(16 * time.Millisecond)
	}
	if elapsed := time.Since(start); elapsed > 2*time.Second {
		t.Errorf("6000 frames took %v; the terminal should be the bottleneck, not the arithmetic", elapsed)
	}
}

// §14: FX may observe events and may never modify GameState.
func TestFXNeverMutatesTheGame(t *testing.T) {
	w := boardWorld(93)
	g := game.New(1)
	g.Start()
	g.HardDrop()

	score, lines, level := g.Score, g.Lines, g.Level
	active := g.Active
	fingerprint := g.Board.Fingerprint()

	for _, k := range []game.EventKind{
		game.PieceSpawned, game.PieceMoved, game.PieceRotated, game.PieceSoftDropped,
		game.PieceHardDropped, game.PieceLocked, game.HoldUsed, game.LinesCleared,
		game.ComboChanged, game.LevelChanged, game.GameOver,
	} {
		w.Handle([]game.Event{{Kind: k, Piece: g.Active, Cells: g.Active.Cells(),
			Rows: []int{21}, Combo: 5, Level: 4, Distance: 3}})
		w.Advance(16 * time.Millisecond)
	}

	if g.Score != score || g.Lines != lines || g.Level != level ||
		g.Active != active || g.Board.Fingerprint() != fingerprint {
		t.Fatal("FX mutated game state (§14)")
	}
}
```

- [ ] **Step 3: Run both to verify they fail, then wire the model**

Run: `go test ./internal/app/ ./internal/fx/ -v`
Expected: FAIL first, then implement the `Frame` filling and combo-line hand-off, then PASS.

- [ ] **Step 4: Run everything**

Run: `go test ./... -race && make lint && make cover`
Expected: PASS.

- [ ] **Step 5: Take the §43 coolness acceptance test**

```bash
make build
./cosmic-tetris --seed 8675309
```

Within the first 30 seconds you must see: moving starfield, animated board border, piece trails, hard-drop impact, particles, mission-control commentary. On your first completed line: the supernova clear animation, debris, and a border reaction. Set up a four-line clear (drop three flat pieces, leave column 4 open, drop a vertical `I`) and confirm the reaction is the one §43 specifies. Then:

```bash
./cosmic-tetris --seed 8675309 --reduced-motion   # no shake, no hyperdrive, no rings; still colourful and lively
./cosmic-tetris --seed 8675309 --ascii            # violence in ASCII
./cosmic-tetris --seed 8675309 --no-fx            # still a good game
```

If a four-line clear does not produce an immediate involuntary reaction, that is a bug in this plan's output, not a matter of taste (§43: "That is an actual product requirement"). Turn the dials — particle counts, banner size, flash intensity — and re-record the goldens.

- [ ] **Step 6: Commit**

```bash
git add internal/app internal/fx/restraint_test.go
git commit -m "feat(app): wire the violence, with restraint and performance audits"
```

---

## Done when

- `make test` passes with `-race`.
- A four-line clear fires hyperdrive, a stronger shake, a border pulse, a particle eruption, a HUD flash, extra stars, a shockwave, and a giant banner — all at once, and the board is still readable while it happens.
- Screen shake never exceeds one cell and never changes the frame's line count or line widths.
- Particles never cover a locked or active cell and never leave a mark behind.
- `--reduced-motion` suppresses exactly shake, hyperdrive, and shockwaves.
- Sustained abuse leaves every FX collection bounded.
- §43's six first-thirty-seconds items are all present, and the first completed line supernovas.
