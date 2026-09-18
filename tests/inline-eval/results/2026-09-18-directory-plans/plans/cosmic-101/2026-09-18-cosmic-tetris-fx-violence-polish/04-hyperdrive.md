### Task 4: Hyperdrive

**Files:**
- Create: `internal/fx/hyperdrive.go`
- Modify: `internal/fx/starfield.go` (speed multiplied by the hyperdrive factor; stretch glyphs)
- Modify: `internal/render/starfield.go` (stretched near stars)
- Test: `internal/fx/hyperdrive_test.go`
- Test: `internal/render/hyperdrive_test.go`

**Interfaces:**
- Consumes: `World`, `Star`, `SetStarBoost`, `Config.ReducedMotion`, `Snapshot` (plan 3).
- Produces:
```go
const HyperdriveTotal = 1100 * time.Millisecond   // §16
func (w *World) StartHyperdrive()          // ignored when cfg.ReducedMotion
func (w *World) HyperdriveFactor() float64 // star-speed multiplier; 1.0 when inactive
func (w *World) HyperdriveStretch() bool   // true during the stretch window
func (w *World) SessionBest() int          // highest score seen this process run
```

The §16 timeline, as a keyframe table on elapsed time within the effect, linearly interpolated:

```text
0ms      factor 0.0   (stars pause)
50ms     factor 0.3   (stretch begins; HyperdriveStretch true from 50ms to 150ms)
100ms    factor 3.0   (violent acceleration)
500ms    factor 8.0   (peak)
800ms    factor 3.0   (decay)
1100ms   factor 1.0   (normal; effect ends)
```

Triggers (§16), all raised from `Observe`:

```text
LinesCleared with 4 rows
ComboChanged with Value >= 5
a new high score: snap.Score > SessionBest() and SessionBest() > 0
```

`SessionBest` is process-local — the spec builds no database (§1), so "new high score" means beating the best of this run, and the first score of a run does not trigger it.

While `HyperdriveStretch()` is true, near stars render as a vertical streak glyph (`|` in every mode, which needs no fold) instead of `✦ ✧ *`.

- [ ] **Step 1: Write the failing test**

`internal/fx/hyperdrive_test.go`:

```go
func TestHyperdriveTimeline(t *testing.T)
// StartHyperdrive(); HyperdriveFactor() == 0.0
// at 50ms: about 0.3; at 100ms: about 3.0; at 500ms: about 8.0;
//   at 800ms: about 3.0; at 1100ms: exactly 1.0
// values between keyframes are between their neighbours (monotone on each segment)

func TestHyperdriveEndsExactly(t *testing.T)
// Step(HyperdriveTotal + time.Second): HyperdriveFactor() == 1.0 and stretch is false

func TestStretchWindow(t *testing.T)
// HyperdriveStretch() is false at 0ms, true at 60ms and 140ms, false at 200ms

func TestStarsActuallyAccelerate(t *testing.T)
// two worlds, same seed; one with hyperdrive started
// over a Step from 400ms to 500ms of the effect, the hyperdrive world's mean star
//   Y delta is several times larger

func TestFourLineClearTriggersHyperdrive(t *testing.T)
// Observe LinesCleared{Rows: []int{18,19,20,21}}: HyperdriveFactor() != 1.0

func TestBigComboTriggersHyperdrive(t *testing.T)
// ComboChanged{Value: 5} triggers; ComboChanged{Value: 4} does not

func TestNewHighScoreTriggersOnce(t *testing.T)
// Observe with snap.Score 1000 (first score of the run): no hyperdrive, SessionBest() == 1000
// let it finish, Observe with snap.Score 2000: hyperdrive starts
// Observe again with snap.Score 1500: no trigger

func TestReducedMotionDisablesHyperdrive(t *testing.T)   // Review Focus
// Config{ReducedMotion: true}: StartHyperdrive() leaves HyperdriveFactor() == 1.0
//   and HyperdriveStretch() false, and stars keep their normal speed
```

`internal/render/hyperdrive_test.go`:

```go
func TestStretchedStarsRenderAsStreaks(t *testing.T)
// a scene during the stretch window: star marks for near stars are "|"
// outside the window they are one of LayerGlyphs[LayerNear]

func TestHyperdriveKeepsFrameSize(t *testing.T)
// Render at the peak of hyperdrive: exact dimensions at 80×30 and 40×24
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/fx/ -run TestHyperdriveTimeline -v`
Expected: FAIL — `undefined: StartHyperdrive`.

- [ ] **Step 3: Implement `internal/fx/hyperdrive.go` and the starfield hook**

Store the keyframes as a `[]struct{At time.Duration; Factor float64}` and interpolate by scanning it; the starfield multiplies `LayerSpeed` by `HyperdriveFactor()` alongside the level multiplier.

- [ ] **Step 4: Run the tests**

Run: `go test ./... && go vet ./...`
Expected: PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): hyperdrive timeline with stretched starfield"
```
