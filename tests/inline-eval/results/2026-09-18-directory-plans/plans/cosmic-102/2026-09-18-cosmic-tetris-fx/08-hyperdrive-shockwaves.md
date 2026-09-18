### Task 8: Hyperdrive and shockwaves

**Files:**
- Create: `internal/fx/hyperdrive.go`
- Create: `internal/fx/shockwave.go`
- Modify: `internal/render/fxdraw.go` (add `DrawGlobalFX`)
- Modify: `internal/render/render.go` (composite global FX after the HUD)
- Test: `internal/fx/hyperdrive_test.go`
- Test: `internal/fx/shockwave_test.go`
- Test: `internal/render/globalfx_test.go`

**Interfaces:**
- Consumes: `World`, `StarSpeedScale`, `Particles` (Tasks 1–3).
- Produces:
  ```go
  // hyperdrive.go
  func (w *World) TriggerHyperdrive()
  func (w *World) HyperdriveActive() bool
  func (w *World) StarStretch() float64   // 0..1; renderer elongates near stars

  // shockwave.go
  type Shockwave struct {
      CX, CY   float64   // terminal-space center
      Radius   float64   // current radius in columns
      Progress float64   // 0..1 through ShockwaveLife
  }
  func (w *World) Shockwaves() []Shockwave
  func (w *World) EmitShockwave(cx, cy float64)

  // render
  func DrawGlobalFX(c *Canvas, l Layout, w *fx.World, opt Options)
  ```
  Hyperdrive keyframes (§16), driving a multiplier on `StarSpeedScale`:
  `0ms` pause (`0.0`), `50ms` stretch (`0.2`, `StarStretch` rises),
  `100ms` violent acceleration, `500ms` peak (`9.0`), `800ms` decay,
  `1100ms` back to `1.0`. Triggers (§16): a four-line clear, a combo of 4 or
  more, and a new high score within the session. Suppressed by `ReducedMotion`
  (§49.5) — the trigger is recorded but the multiplier stays `1.0` and
  `StarStretch` stays `0`.

  Shockwaves (§24): `300ms`, radius growing from `0` to `14` columns, rendered as
  ring glyphs chosen by `Progress` — `·` then `○` then `◌` then `◯`
  [ASCII `.` `o` `O` `0`] — on an ellipse with a 2:1 column:row ratio so it looks
  circular in a terminal. Use sparingly: at most **2** live at once, and only
  from four-line clears, combo ≥ 5, and game over.

- [ ] **Step 1: Write the failing tests in `internal/fx/hyperdrive_test.go`**

```go
func TestHyperdriveKeyframes(t *testing.T)   // §16
// TriggerHyperdrive(), then sample the star-speed multiplier at
// 0/50/100/500/800/1100ms: pause ≈0, rising through 100ms, peak at 500ms,
// decaying at 800ms, back to 1.0 at 1100ms; HyperdriveActive() false after

func TestStarsActuallyMoveFasterDuringHyperdrive(t *testing.T)
// same dt moves near stars strictly further at 500ms into hyperdrive

func TestStarStretchRisesThenFalls(t *testing.T)

func TestFourLineClearTriggersHyperdrive(t *testing.T)
// Observe(LinesCleared{Count:4}) -> HyperdriveActive()

func TestLargeComboTriggersHyperdrive(t *testing.T)
// ComboChanged{Count:4} triggers; Count:2 does not

func TestNewHighScoreTriggersHyperdriveOnce(t *testing.T)
// a snapshot whose Score passes the session high triggers it; a later,
// smaller score does not re-trigger

func TestReTriggerRestartsTheSequence(t *testing.T)
// trigger, Advance(600ms), trigger again -> the multiplier returns to the
// pause value rather than staying at peak

func TestReducedMotionSuppressesHyperdrive(t *testing.T)   // §49.5
// multiplier stays 1.0 and StarStretch stays 0 throughout

func TestDisabledWorldIgnoresHyperdrive(t *testing.T)
```

- [ ] **Step 2: Write the failing tests in `internal/fx/shockwave_test.go`**

```go
func TestShockwaveExpandsAndExpires(t *testing.T)
// EmitShockwave(40,12): Radius grows monotonically; at ShockwaveLife it is gone

func TestAtMostTwoShockwavesLive(t *testing.T)
// emit five in one frame: len(Shockwaves()) == 2

func TestReducedMotionSuppressesShockwaves(t *testing.T)   // §49.5

func TestDisabledWorldHasNoShockwaves(t *testing.T)
```

- [ ] **Step 3: Write the failing render tests in `internal/render/globalfx_test.go`**

```go
func TestShockwaveRingGlyphsByProgress(t *testing.T)
// progress .1/.4/.7/.95 select · ○ ◌ ◯ respectively

func TestShockwaveIsWiderThanTallByTwoToOne(t *testing.T)
// measure the drawn ring's column span and row span: ratio ≈ 2:1 (±1 cell)

func TestGlobalFXClipsAtEveryEdge(t *testing.T)
// a shockwave centered at each corner and just outside each edge: no panic,
// nothing written out of range

func TestGlobalFXDoesNotOverwriteTheActivePiece(t *testing.T)   // §44
// particles and rings placed over the active piece's cells leave those cells
// showing the active glyph

func TestGlobalFXLeavesTheBoardUnchangedAfterExpiry(t *testing.T)   // §44
// render, run the world past every effect's life, render again: identical to a
// frame rendered with a fresh world at the same board state
```

- [ ] **Step 4: Run the three test files to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run 'Hyperdrive|Shockwave|GlobalFX|Star' -v`
Expected: FAIL — `undefined: TriggerHyperdrive`.

- [ ] **Step 5: Implement `hyperdrive.go`, `shockwave.go`, and `DrawGlobalFX`**

Model hyperdrive as a piecewise-linear curve over the keyframe table — one slice
of `{at time.Duration, mult float64}` pairs, interpolated. `DrawGlobalFX` draws
`LayerBackground` and `LayerForeground` particles plus rings, skipping any cell
currently occupied by a board block or the active piece.

- [ ] **Step 6: Run the tests and look at it**

Run: `go test ./... && ./cosmic-tetris --seed 1`
Expected: a four-line clear makes the terminal enter hyperspace for absolutely no
reason (§16). `./cosmic-tetris --reduced-motion` shows the clear without the
acceleration or rings.

- [ ] **Step 7: Commit**

```bash
git add internal/fx/hyperdrive.go internal/fx/shockwave.go internal/fx/*_test.go internal/render/
git commit -m "feat(fx): hyperdrive keyframes and elliptical shockwaves"
```
