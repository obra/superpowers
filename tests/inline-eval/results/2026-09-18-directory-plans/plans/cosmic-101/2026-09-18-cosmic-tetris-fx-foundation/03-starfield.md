### Task 3: Three-layer starfield

**Files:**
- Create: `internal/fx/starfield.go`
- Modify: `internal/fx/world.go` (stars in `Step`, `StepPaused`, `Resize`; `Stars()`)
- Test: `internal/fx/starfield_test.go`

**Interfaces:**
- Consumes: `World`, `Resize`, `Snapshot` (Task 1).
- Produces:
```go
type Layer uint8
const (LayerFar Layer = iota; LayerMid; LayerNear)

type Star struct {
    X, Y       float64
    Glyph      rune
    Layer      Layer
    Brightness float64   // Far 0.25, Mid 0.55, Near 0.9
}

func (w *World) Stars() []Star
func (w *World) StarCount() int
func (w *World) SetStarBoost(factor float64, d time.Duration)  // used by hyperdrive in plan 4

// §45's cheap delight: an occasional diagonal shooting star
const (
    ShootingStarChance = 0.004   // probability per Step of starting one, when none is live
    ShootingStarSpeed  = 26.0    // cells/second along the diagonal
)
func (w *World) ShootingStar() (Star, bool)   // at most one at a time

// pinned values (§15)
var LayerGlyphs = map[Layer][]rune{
    LayerFar:  {'.'},
    LayerMid:  {'·', '˚'},
    LayerNear: {'✦', '✧', '*'},
}
var LayerSpeed = map[Layer]float64{LayerFar: 0.6, LayerMid: 1.8, LayerNear: 4.0}  // cells/second, downward
var LayerDensity = map[Layer]float64{LayerFar: 40, LayerMid: 20, LayerNear: 8}    // stars per 80×24 viewport
const (
    StarLevelFactor = 0.06   // speed multiplier is 1 + StarLevelFactor*(level-1)
    StarLevelCap    = 2.5    // multiplier ceiling
)
```

Stars drift downward (§15). A star leaving the bottom wraps to a new random X just above the top, so density is constant without allocation. `Resize` rescales the population to `LayerDensity * (width*height) / (80*24)`, rounded, minimum 1 per layer when the viewport is non-empty; growing reuses the slice's capacity.

Level scaling: effective speed is `LayerSpeed[layer] * min(1 + StarLevelFactor*(snap.Level-1), StarLevelCap) * boost`, where `boost` is 1 unless `SetStarBoost` is active (plan 4's hyperdrive). `StepPaused` advances stars with the speed multiplied by `PausedStarFactor` and touches nothing else.

- [ ] **Step 1: Write the failing test**

`internal/fx/starfield_test.go`:

```go
func TestResizePopulatesThreeLayers(t *testing.T)
// Resize(80, 24): each layer's count is within 1 of LayerDensity for that layer
// every star's Glyph is drawn from LayerGlyphs for its own layer
// every star is inside the viewport

func TestStarsDriftDownward(t *testing.T)
// record a near star's Y; Step(500ms); its Y increased by about
//   LayerSpeed[LayerNear]*0.5 (within 10%)

func TestFarStarsAreSlowerThanNear(t *testing.T)
// over the same Step, the mean Y delta per layer is ordered Far < Mid < Near

func TestStarsWrapAtBottom(t *testing.T)
// Resize(40,10); Step(10 * time.Second) in 16ms increments
// StarCount() is unchanged and every star is still inside the viewport

func TestLevelIncreasesStarSpeed(t *testing.T)
// two worlds, same seed, Snapshot Level 1 vs Level 10
// after the same Step, the level-10 world's mean Y delta is larger

func TestStarSpeedIsCapped(t *testing.T)
// Level 200: the mean Y delta equals the Level-26 delta (the multiplier hit StarLevelCap)

func TestStarBoostDecays(t *testing.T)
// SetStarBoost(6, 300ms): the delta over the first 100ms is much larger than
//   the delta over a 100ms window measured 500ms later (boost expired)

func TestStepPausedMovesOnlyStars(t *testing.T)
// emit a particle; note its X; StepPaused(500ms)
// stars moved by about PausedStarFactor of their normal distance
// the particle's X, Y, and Life are unchanged

func TestResizeToZeroIsSafe(t *testing.T)
// Resize(0,0) then Step(16ms): no panic; StarCount() == 0

func TestShootingStarIsRareAndSingular(t *testing.T)
// 5000 Step(16ms) calls on a seeded world: ShootingStar() returned ok at least once,
//   never two at the same time, and every returned star was inside the viewport
// its X and Y both change between steps (it travels diagonally)
```

`ShootingStar` renders through `starMarks` in Task 4 like any other star, so it inherits the "never inside the board" rule for free.

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/fx/ -run TestResizePopulates -v`
Expected: FAIL — `undefined: Star`.

- [ ] **Step 3: Implement `internal/fx/starfield.go` and wire it into `Step`/`StepPaused`/`Resize`**

Keep one flat `[]Star` with the layer on each star rather than three slices; the render step wants them in one pass anyway.

- [ ] **Step 4: Run the tests**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/starfield.go internal/fx/world.go internal/fx/starfield_test.go
git commit -m "feat(fx): three-layer starfield with level-scaled drift"
```
