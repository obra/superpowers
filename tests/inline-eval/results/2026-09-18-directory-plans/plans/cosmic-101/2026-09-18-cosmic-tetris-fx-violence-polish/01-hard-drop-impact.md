### Task 1: Hard-drop impact and screen shake

**Files:**
- Create: `internal/fx/shake.go`
- Modify: `internal/fx/world.go` (`Observe` handling of `PieceHardDropped`)
- Modify: `internal/fx/trail.go` (`HardDropTrailLife`)
- Modify: `internal/render/render.go` (apply `shiftBoard` before compositing board FX)
- Create: `internal/render/shake.go`
- Test: `internal/fx/shake_test.go`
- Test: `internal/render/shake_test.go`

**Interfaces:**
- Consumes: `World`, `Config.ReducedMotion`, `EmitBurst`, `DebrisGlyphs`, `Trail` (plan 3); `Layout`, `composite`, `mark` (plans 2–3).
- Produces:
```go
// fx
var ShakePattern = [5][2]int{{0, 1}, {-1, 0}, {1, 0}, {0, -1}, {0, 0}}   // §18, deterministic
const (
    ShakeDuration    = 80 * time.Millisecond    // §18
    BigShakeDuration = 160 * time.Millisecond   // §20's larger shake
    HardDropTrailLife = 220 * time.Millisecond  // §18: a stronger vertical trail
)
func (w *World) Shake(d time.Duration)          // no-op when cfg.ReducedMotion
func (w *World) ShakeOffset() (dx, dy int)      // one of ShakePattern; (0,0) when inactive or reduced

// render
func shiftBoard(frame string, l Layout, dx, dy int) string
// Translates the 22×22 board box within the frame by (dx,dy), clipping at the frame
// edge. The returned frame has the same line count and width as the input.
```

`Observe` on `PieceHardDropped` does all four of §18 at once: emits a long-lived vertical trail for every cell the piece crossed (`Event.Cells` rows above the landing position, at `HardDropTrailLife`), `EmitBurst` of 18 `DebrisGlyphs` particles at the contact row with speed 14, `Shake(ShakeDuration)`, and raises `BorderEnergy` to 0.7 for the border flash.

The offset index is `int(shakeElapsed / (duration/5))` clamped to 4, so the pattern is deterministic and never exceeds one cell in any direction (§44).

- [ ] **Step 1: Write the failing test**

`internal/fx/shake_test.go`:

```go
func TestShakeWalksThePattern(t *testing.T)
// Shake(ShakeDuration); ShakeOffset() == ShakePattern[0]
// after each Step(16ms) the offset walks ShakePattern[1], [2], [3], [4]
// after Step(ShakeDuration): (0,0)

func TestShakeNeverExceedsOneCell(t *testing.T)   // §44
// across a full shake in 4ms increments, |dx| <= 1 and |dy| <= 1 always

func TestReducedMotionDisablesShake(t *testing.T)   // Review Focus
// World with Config{ReducedMotion: true}: Shake(ShakeDuration) then any Step
// ShakeOffset() is always (0,0)

func TestHardDropEmitsImpact(t *testing.T)
// g := game.New(1); evs := g.Apply(game.InputHardDrop); w.Observe(evs, snapshotOf(g))
// ParticleCount() > 0; ShakeOffset() != (0,0); BorderEnergy() >= 0.7
// Trails() contains cells along the column the piece fell through

func TestHardDropTrailOutlivesMoveTrail(t *testing.T)
// after Step(TrailLife + 10ms) the hard-drop trail cells are still present
// after Step(HardDropTrailLife) they are gone

func TestReducedMotionKeepsParticlesAndTrails(t *testing.T)   // §49.5
// reduced-motion world, hard drop: ParticleCount() > 0 and Trails() non-empty
```

`internal/render/shake_test.go`:

```go
func TestShiftBoardPreservesFrameSize(t *testing.T)
// for every offset in ShakePattern, at 80×30 and at the 40×24 minimum:
//   stripANSI(shiftBoard(frame, l, dx, dy)) has the same line count and width as the input

func TestShiftBoardMovesTheBoard(t *testing.T)
// with dy=+1 the board's top border row appears one line lower than in the unshifted frame

func TestShiftBoardClipsAtEdge(t *testing.T)   // Review Focus
// at 40×24 with the board flush against the left edge, dx=-1 drops the clipped column
//   instead of widening the frame; no line exceeds 40 columns

func TestShiftBoardDoesNotMoveHUD(t *testing.T)
// the controls line is at the same row and columns before and after the shift

func TestRenderWithShakeKeepsDimensions(t *testing.T)
// a scene mid-shake: Render output is exactly h lines of w columns
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/fx/ -run TestShakeWalks -v`
Expected: FAIL — `undefined: ShakePattern`.

- [ ] **Step 3: Implement the shake model, the impact handler, and `shiftBoard`**

`shiftBoard` extracts the board box's 22 lines, re-inserts them at the offset row, and pads the vacated row with the frame's background — the same line-slicing helper `composite` already uses.

- [ ] **Step 4: Run the tests**

Run: `go test ./... && go vet ./...`
Expected: PASS, clean.

- [ ] **Step 5: Drop a refrigerator from orbit**

Run: `go run ./cmd/cosmic-tetris --seed 1234` and hard-drop a piece. It should feel ridiculous: a streak down the column, debris at the contact point, a one-cell jolt, a bright border. Then `go run ./cmd/cosmic-tetris --reduced-motion` and confirm the jolt is gone while the debris remains.

- [ ] **Step 6: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): hard-drop impact with ion trail, debris, shake, and border flash"
```
