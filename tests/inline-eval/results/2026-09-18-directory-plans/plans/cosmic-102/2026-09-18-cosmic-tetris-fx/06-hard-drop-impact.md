### Task 6: Hard-drop impact — ion column, debris, screen shake, border flash

**Files:**
- Create: `internal/fx/impact.go`
- Modify: `internal/render/render.go` (apply the shake offset)
- Test: `internal/fx/impact_test.go`
- Test: `internal/render/shake_test.go`

**Interfaces:**
- Consumes: `World`, `EmitBurst`, `FlashBorder`, `Trail` (Tasks 1–5);
  `game.PieceHardDropped`, `game.PieceLocked` (plan 1).
- Produces:
  ```go
  func (w *World) Shake() (dx, dy int)   // always within ±1 cell (§44)
  ```
  Pinned (§18), on `PieceHardDropped{Count: n}`:
  1. **Ion column** — a trail in every cell the piece crossed, with `TrailLife`
     doubled so the column reads as a streak.
  2. **Debris** — `EmitBurst` at the contact area: `6 + 3n` particles capped at
     40, speed `18` cells/s, `LayerBoard`, glyphs `· * ✦ +` [ASCII `. * + o`].
  3. **Screen shake** — `80ms` walking the deterministic pattern
     `(0,+1) (-1,0) (+1,0) (0,-1) (0,0)`, one step every 16ms. Suppressed
     entirely when `ReducedMotion` (§49.5).
  4. **Border flash** — `FlashBorder(1.0)`.

  A drop of distance 0 still locks and flashes, but emits no column.

- [ ] **Step 1: Write the failing tests in `internal/fx/impact_test.go`**

```go
func TestHardDropEmitsIonColumn(t *testing.T)
// PieceHardDropped{Count: 10}: trails exist in each crossed row, and their
// lifetime is 2×TrailLife

func TestHardDropEmitsDebris(t *testing.T)
// particle count grows by 6+3*10 == 36 (capped at 40), all LayerBoard,
// all glyphs from the debris set

func TestZeroDistanceHardDropEmitsNoColumn(t *testing.T)
// Count: 0 -> no new trails, but BorderFlash() == 1

func TestShakeFollowsThePinnedPattern(t *testing.T)   // §18
// after the event: Shake() == (0,1); after 16ms (-1,0); 32ms (1,0);
// 48ms (0,-1); 64ms (0,0); after ShakeDuration (0,0) forever

func TestShakeNeverExceedsOneCell(t *testing.T)   // §44
// sample Shake() every 4ms for 500ms across 50 hard drops: |dx| <= 1 && |dy| <= 1

func TestReducedMotionSuppressesShake(t *testing.T)   // §49.5
// Config{ReducedMotion:true}: Shake() == (0,0) at every sample, while debris
// particles and the border flash still occur

func TestHardDropFlashesTheBorder(t *testing.T)

func TestImpactDoesNotTouchGameState(t *testing.T)
// hold a *game.Game, snapshot it, run Observe+Advance over a hard drop,
// deep-compare the game

func TestRepeatedHardDropsStayWithinParticleCap(t *testing.T)
// 100 hard drops in a row: ParticleCount() <= MaxParticles
```

- [ ] **Step 2: Write the failing render test in `internal/render/shake_test.go`**

```go
func TestShakeOffsetsTheBoardByOneCell(t *testing.T)
// Render with a world mid-shake at (0,1): the board's top-left border glyph
// is one row lower than with no shake; the frame still has exactly Height lines

func TestShakeNeverPushesTheBoardOutOfTheTerminal(t *testing.T)
// at 40x24 (the tightest layout) with each of the five shake offsets: every
// border glyph is still inside the canvas and no line exceeds the width

func TestShakeDoesNotMoveTheHUD(t *testing.T)   // §18 "do not make the entire
// terminal unreadable" — mission control and the controls line stay put
```

- [ ] **Step 3: Run both test files to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run 'Impact|Shake|HardDrop' -v`
Expected: FAIL — `undefined: Shake`.

- [ ] **Step 4: Implement `impact.go` and the shake application**

`Render` copies the layout, adds the shake offset to `BoardX`/`BoardY` clamped so
the box stays inside the canvas, and passes the shifted copy to `DrawBoard` and
`DrawBoardFX` only — the HUD uses the unshifted layout.

- [ ] **Step 5: Run the tests and feel it**

Run: `go test ./... && ./cosmic-tetris --seed 1`
Expected: a hard drop feels like dropping a refrigerator from orbit (§18) — a
streak down the column, debris off the contact point, a single-cell kick, and a
bright border. Then run `./cosmic-tetris --reduced-motion` and confirm the kick
is gone while the debris remains.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/impact.go internal/fx/impact_test.go internal/render/
git commit -m "feat(fx): hard-drop ion column, debris, one-cell shake, border flash"
```
