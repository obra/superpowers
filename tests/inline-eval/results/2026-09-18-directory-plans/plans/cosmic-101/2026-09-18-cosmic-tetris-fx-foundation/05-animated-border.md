### Task 5: Animated board border

**Files:**
- Modify: `internal/fx/world.go` (`BorderPhase`, `BorderEnergy`)
- Modify: `internal/render/render.go` (`borderPhase` reads the world)
- Modify: `internal/render/board.go` (`borderBox` takes an energy value)
- Test: `internal/fx/border_test.go`
- Test: `internal/render/border_test.go`

**Interfaces:**
- Consumes: `World`, `Observe`, `Step` (Task 1); `Palette.Border` (plan 2 Task 2); `borderBox` (plan 2 Task 4).
- Produces:
```go
// fx
func (w *World) BorderPhase() float64   // [0,1), advances at BorderCycle, faster with energy
func (w *World) BorderEnergy() float64  // [0,1]: 0 calm, 1 major event; decays at BorderDecay
func (w *World) RaiseEnergy(v float64)  // energy = max(energy, clamp(v, 0, 1)); the only setter

const (
    BorderCycle      = 24 * time.Second   // one full palette walk when calm (§25: subtle)
    BorderFastCycle  = 2 * time.Second    // one full walk at energy 1 (§25: rapid during events)
    BorderDecay      = 1.5                // energy *= exp(-BorderDecay * dt)
)

// render
func borderPhase(s Scene) float64        // s.FX.BorderPhase(), or 0 when FX is off
func borderBox(content string, p Palette, phase, energy float64) string
// energy > 0.5 renders the frame in the palette's hot-white end (§18's border flash reuses this)
```

Energy is raised through `RaiseEnergy` by observed events: `LinesCleared` with `0.5 + 0.125*len(Rows)` (so a four-line clear reaches 1.0), `LevelChanged` with `0.6`, `PieceLocked` with `0.15`, `GameOver` with `1.0`. Because `RaiseEnergy` takes the max, a small event during a big one cannot dampen it. Energy decays continuously in `Step`. Plan 4's effects raise it through the same setter.

The border is the game's energy-state indicator (§25); this is the whole of that idea, and plan 4's hard-drop flash and four-line pulse just push energy up.

- [ ] **Step 1: Write the failing test**

`internal/fx/border_test.go`:

```go
func TestBorderPhaseWrapsAndAdvances(t *testing.T)
// calm world: BorderPhase() after Step(BorderCycle/4) is about 0.25
// after Step(BorderCycle) from 0, the phase returns to about 0 (wrapped, always in [0,1))

func TestBorderEnergyRisesWithEvents(t *testing.T)
// Observe a LinesCleared with 1 row: BorderEnergy() == 0.625
// Observe LinesCleared with 4 rows: BorderEnergy() == 1.0
// Observe a PieceLocked immediately after: energy is still 1.0 (never dampened)

func TestRaiseEnergyTakesTheMax(t *testing.T)
// RaiseEnergy(0.8) then RaiseEnergy(0.2): BorderEnergy() == 0.8
// RaiseEnergy(5) clamps to 1.0; RaiseEnergy(-1) leaves the value unchanged

func TestBorderEnergyDecays(t *testing.T)
// after energy 1.0, Step(2 * time.Second): energy is below 0.1 and never negative

func TestEnergySpeedsUpThePhase(t *testing.T)
// two worlds, one calm and one at energy 1.0: over the same Step, the energetic
//   world's phase advanced substantially further
```

`internal/render/border_test.go`:

```go
func TestBorderBoxSizeIndependentOfPhaseAndEnergy(t *testing.T)
// for phase 0, 0.33, 0.99 and energy 0, 0.5, 1: borderBox output is always
//   22 lines of 22 columns (ANSI-stripped) with the same glyphs

func TestBorderColorChangesWithPhase(t *testing.T)
// ModeFull: the raw (un-stripped) borderBox output differs between phase 0 and 0.5

func TestBorderPhaseZeroWithoutFX(t *testing.T)
// Scene with FX == nil: borderPhase(s) == 0 and Render does not panic
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/fx/ -run TestBorderPhase -v`
Expected: FAIL — `undefined: BorderPhase`.

- [ ] **Step 3: Implement the border energy model and wire the phase through `Render`**

Phase advance per step is `dt / lerp(BorderCycle, BorderFastCycle, energy)`, accumulated and wrapped with `math.Mod`.

- [ ] **Step 4: Regenerate the FX-free goldens if the border glyphs shifted**

Run: `go test ./internal/render/ -v`. If the plan-2 goldens fail, the change altered the frame's *shape*, not just its color — fix that rather than updating the goldens. Only regenerate if you have confirmed the difference is intentional.

- [ ] **Step 5: See it breathe**

Run: `go run ./cmd/cosmic-tetris --seed 1234`, watch the border hue drift slowly, then clear a line and see it surge and settle.

- [ ] **Step 6: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): border as an energy-state indicator with a slow color walk"
```
