### Task 4: Animated board border

**Files:**
- Create: `internal/fx/border.go`
- Modify: `internal/render/board.go` (accept the flash factor)
- Modify: `internal/render/render.go` (feed phase and flash from `Frame.FX`)
- Test: `internal/fx/border_test.go`
- Test: `internal/render/border_test.go`

**Interfaces:**
- Consumes: `World` (Task 1); `BorderPaint` (plan 2 Task 1).
- Produces:
  ```go
  // fx
  func (w *World) BorderPhase() float64   // [0,1), advances slowly, wraps
  func (w *World) BorderFlash() float64   // [0,1]; 1 immediately after a big
                                          // event, decaying to 0
  func (w *World) FlashBorder(strength float64)   // used by Tasks 6–9

  // render
  // DrawBoard's borderPhase argument is now fed from fx; a new parameter
  // borderFlash float64 brightens the border toward hot white.
  func DrawBoard(c *Canvas, l Layout, g *game.Game, opt Options, borderPhase, borderFlash float64)
  ```
  Pinned (§25): the base phase advances at `1/24` per second — a full palette
  walk every 24s, subtle by construction. During an event the phase advances
  `8×` faster while `BorderFlash() > 0`. `BorderFlash` decays linearly over
  `300ms`. The border is the game's energy-state indicator, so flash strength is
  the caller's judgement: `0.4` for a single clear, `1.0` for a hard drop or a
  four-line clear.

- [ ] **Step 1: Write the failing tests in `internal/fx/border_test.go`**

```go
func TestBorderPhaseAdvancesSlowly(t *testing.T)
// Advance(1s) moves the phase by ~1/24 (±0.005); Advance(24s) wraps to ~0

func TestBorderPhaseStaysInRange(t *testing.T)
// after Advance(5m): 0 <= BorderPhase() < 1

func TestFlashDecaysOverThreeHundredMilliseconds(t *testing.T)
// FlashBorder(1.0): BorderFlash() == 1 at t=0, ≈0.5 at 150ms, 0 at 300ms
// and stays 0 afterwards

func TestFlashAcceleratesThePhase(t *testing.T)
// two worlds, one flashed: after Advance(100ms) the flashed one's phase moved
// roughly 8× further

func TestStrongerFlashOverridesWeakerInFlight(t *testing.T)
// FlashBorder(0.4) then FlashBorder(1.0) -> BorderFlash() == 1.0
// FlashBorder(1.0) then FlashBorder(0.4) -> still ~1.0 (no downgrade)

func TestDisabledWorldHasStaticBorder(t *testing.T)
// !Enabled: BorderPhase() stays 0 and BorderFlash() stays 0
```

- [ ] **Step 2: Write the failing tests in `internal/render/border_test.go`**

```go
func TestBorderColorFollowsPhase(t *testing.T)
// DrawBoard with phase 0 vs 0.5: the border cells' Paint differs, and the
// board's interior cells are identical

func TestBorderFlashBrightensTowardWhite(t *testing.T)
// flash 1.0 gives Bold border paint with the hot-white FG; flash 0 does not

func TestBorderNeverChangesBoardGeometry(t *testing.T)
// for phases 0, .25, .5, .75 and flashes 0, .5, 1: the border glyph positions
// are identical
```

- [ ] **Step 3: Run both test files to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run Border -v`
Expected: FAIL — `undefined: BorderPhase`.

- [ ] **Step 4: Implement `border.go` and the render changes**

`BorderPaint(mode, phase)` already interpolates the §25 palette; blend toward
`#FFFFFF` by `borderFlash` and set `Bold` above `0.5`.

- [ ] **Step 5: Run the tests and look at it**

Run: `go test ./... && ./cosmic-tetris --seed 1`
Expected: the border color drifts slowly and legibly. Re-record plan 2's goldens
only if the border's *glyphs* changed — color is stripped from goldens, so they
should still pass untouched. If a golden fails, the geometry changed: fix the
code, not the golden.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/border.go internal/fx/border_test.go internal/render/
git commit -m "feat(fx): slow border color drift with event flash"
```
