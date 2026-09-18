### Task 2: Particle simulation

**Files:**
- Create: `internal/fx/particle.go`
- Modify: `internal/fx/world.go` (particle slice, `Step` integration, `Particles()`)
- Test: `internal/fx/particle_test.go`

**Interfaces:**
- Consumes: `World`, `Config` (Task 1).
- Produces:
```go
type Particle struct {
    X, Y       float64
    VX, VY     float64
    Life       float64   // seconds remaining
    MaxLife    float64
    Glyph      rune
    Brightness float64   // 0..1, recomputed each step as Life/MaxLife
}

const MaxParticles = 400

func (w *World) Emit(p Particle)            // dropped silently when the slice is at MaxParticles
func (w *World) EmitBurst(cx, cy float64, n int, speed float64, glyphs []rune)
// radial burst: n particles at random angles, speed ± 40%, Life 0.35..0.7s

func (w *World) Particles() []Particle      // live particles; caller must not retain
func (w *World) ParticleCount() int

// integration constants (§23)
const (
    ParticleGravity = 18.0   // cells/s² on VY (downward is +Y)
    ParticleDrag    = 1.8    // velocity *= exp(-ParticleDrag * dt)
)
var DebrisGlyphs = []rune{'·', '*', '✦', '+'}
```

Per step (§23): `Life -= dt`; `VY += ParticleGravity*dt`; both velocities `*= math.Exp(-ParticleDrag*dt)`; `X += VX*dt`, `Y += VY*dt`; `Brightness = Life/MaxLife`. A particle dies when `Life <= 0` or when it leaves the viewport by more than 2 cells on any side. No collision detection.

Removal is in-place compaction of the same backing slice (`w.particles = w.particles[:n]`) so the allocation is reused frame to frame (§38).

- [ ] **Step 1: Write the failing test**

`internal/fx/particle_test.go`:

```go
func TestEmitAndStepMovesParticle(t *testing.T)
// Emit(Particle{X: 5, Y: 5, VX: 10, VY: 0, Life: 1, MaxLife: 1, Glyph: '*'})
// Step(100ms): the particle's X is greater than 5 and less than 6 (drag applies)
// its Y has increased (gravity applies), and Brightness is about 0.9

func TestParticleDiesAtZeroLife(t *testing.T)
// Life 0.05s; Step(100ms): ParticleCount() == 0

func TestParticleCulledOutsideViewport(t *testing.T)
// Resize(40, 20); Emit at X: -5 with Life 5; Step(16ms): ParticleCount() == 0
// Emit at X: 45: also culled. Emit at X: 39: survives

func TestParticleCapHolds(t *testing.T)   // Review Focus
// Resize(80,30); emit 1000 long-lived particles: ParticleCount() == MaxParticles
// then 100 Step(16ms) calls: ParticleCount() never exceeds MaxParticles
// and cap(w.particles) does not grow across those steps

func TestExtremeDtIsSafe(t *testing.T)   // Review Focus
// Emit one particle; Step(10 * time.Second): ParticleCount() == 0 and no panic
// Emit again; Step(0): the particle is unchanged (still alive, same X, same Life)
// after any Step, every live particle has finite, non-NaN X, Y, VX, VY

func TestEmitBurstIsSeeded(t *testing.T)
// two worlds from the same seed, identical EmitBurst calls and Step sequence,
//   produce identical particle slices (positions compared exactly)

func TestEmitBurstSpreadsOutward(t *testing.T)
// EmitBurst(10, 10, 24, 12, DebrisGlyphs): particles exist on both sides of x=10
//   and both above and below y=10
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/fx/ -run TestEmitAndStep -v`
Expected: FAIL — `undefined: Particle`.

- [ ] **Step 3: Implement `internal/fx/particle.go` and the `Step` integration**

Guard the integration against a `dt` large enough to be meaningless by clamping `dt` to `MaxStepDt = 100 * time.Millisecond` inside `Step` before integrating — the same clamp the app already applies, repeated here so `fx` is safe when called directly.

- [ ] **Step 4: Run the tests**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/particle.go internal/fx/world.go internal/fx/particle_test.go
git commit -m "feat(fx): terminal-space particle simulation with a hard budget"
```
