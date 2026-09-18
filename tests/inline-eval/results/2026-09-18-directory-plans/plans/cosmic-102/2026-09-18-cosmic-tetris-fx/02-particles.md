### Task 2: Particle simulation

**Files:**
- Create: `internal/fx/particle.go`
- Test: `internal/fx/particle_test.go`

**Interfaces:**
- Consumes: `World`, `Config`, `MaxParticles` (Task 1).
- Produces:
  ```go
  type Layer int
  const (LayerBackground Layer = iota; LayerBoard; LayerForeground)

  type Particle struct {
      X, Y       float64   // terminal-space, fractional
      VX, VY     float64   // cells per second
      Life       float64   // seconds remaining
      MaxLife    float64
      Glyph      rune
      Brightness float64   // 0..1
      Layer      Layer
  }

  func (w *World) Particles() []Particle   // live particles; caller must not retain
  func (w *World) ParticleCount() int

  // Emitters used by later tasks:
  func (w *World) Emit(p Particle)
  func (w *World) EmitBurst(cx, cy float64, n int, speed float64, layer Layer, glyphs []rune)
  ```
  Integration per step (§23): `pos += v*dt`, `v += accel*dt`, `v *= drag`,
  `life -= dt`. Pinned values: `ParticleGravity = 14.0` cells/s² downward,
  `ParticleDrag = 0.92` per 16ms step (scaled by `dt`), brightness tracks
  `Life/MaxLife`. No collision detection. Particles die at `Life <= 0` or when
  outside the viewport (§23).

- [ ] **Step 1: Write the failing tests in `internal/fx/particle_test.go`**

```go
func TestParticleMovesByVelocity(t *testing.T)
// Emit{X:5,Y:5,VX:2,VY:0,Life:1,MaxLife:1}; Advance(500ms) -> X ≈ 6 (±0.05)

func TestGravityPullsParticlesDown(t *testing.T)
// VY:0 particle gains positive VY after Advance(100ms)

func TestDragReducesSpeed(t *testing.T)
// VX:10 particle's VX after Advance(320ms) is strictly between 0 and 10

func TestParticleDiesWhenLifeRunsOut(t *testing.T)
// Life 100ms: after Advance(150ms) ParticleCount() == 0

func TestBrightnessFadesWithLife(t *testing.T)
// brightness is ~1.0 at birth and < 0.3 at 10% remaining life, monotonically
// non-increasing across ten steps

func TestOffscreenParticlesAreCulled(t *testing.T)
// Resize(80,24); emit at (-5,10), (200,10), (10,-5), (10,99) with long life;
// after one Advance(16ms), ParticleCount() == 0

func TestParticleCountIsCappedAndDropsOldest(t *testing.T)
// emit MaxParticles+50 particles, the last 50 with a distinguishing glyph:
// ParticleCount() == MaxParticles and every distinguishing glyph survived

func TestSustainedBurstsStayCapped(t *testing.T)
// loop 100 times { EmitBurst(10,10,40,...); Advance(16ms) }:
// ParticleCount() never exceeds MaxParticles

func TestEmitBurstSpreadsRadially(t *testing.T)
// EmitBurst(20,10,24,...): velocities point in at least three distinct
// quadrants and every speed is within [0.2, 1.0] × the requested speed

func TestEmitBurstIsDeterministicPerSeed(t *testing.T)
// two worlds with the same seed and the same burst produce identical particles

func TestDisabledWorldEmitsNothing(t *testing.T)

func TestNoAllocationPerFrameWhenSteady(t *testing.T)
// testing.AllocsPerRun of Advance(16ms) with 300 live particles is 0 —
// the particle slice is reused (§38)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run Particle -v`
Expected: build failure — `undefined: Particle`.

- [ ] **Step 3: Implement `internal/fx/particle.go`**

Store particles in one slice reused across frames; compact in place with a
write cursor while integrating, so dead and off-screen particles vanish without
allocating. `Emit` at capacity overwrites the oldest entry (a ring index).
`EmitBurst` chooses angles from `w.rng` over a full circle with a random speed
multiplier in `[0.2, 1.0]` and a glyph from the supplied set.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/particle.go internal/fx/particle_test.go
git commit -m "feat(fx): bounded particle simulation with reuse and culling"
```
