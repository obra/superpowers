### Task 12: Game-over collapse and black hole

**Files:**
- Create: `internal/fx/collapse.go`
- Modify: `internal/render/fxdraw.go` (add `DrawCollapse`)
- Modify: `internal/render/render.go` (collapse replaces the board; the final card is plan 2's overlay)
- Modify: `internal/app/update.go` (hold the overlay until the collapse finishes)
- Test: `internal/fx/collapse_test.go`
- Test: `internal/render/collapse_test.go`
- Test: `internal/app/gameover_fx_test.go`

**Interfaces:**
- Consumes: `World`, `CollapseTotal`, `EmitShockwave`, `Particles` (Tasks 1–8);
  `OverlayGameOver` (plan 2 Task 7).
- Produces:
  ```go
  type CollapsePhase int
  const (CollapseFreeze CollapsePhase = iota; CollapseInfall; CollapseBlackHole; CollapseDone)

  type Collapse struct {
      Phase    CollapsePhase
      Progress float64   // 0..1 within the phase
      Cells    []CollapseCell   // board cells in flight toward the center
  }
  type CollapseCell struct {
      X, Y float64          // terminal-space, fractional
      Kind game.PieceKind
  }
  func (w *World) Collapse() (Collapse, bool)
  func (w *World) StartCollapse(snap Snapshot, filled []CollapseCell)
  ```
  Pinned (§28): total `CollapseTotal` (1300ms).
  - `0–300ms` **freeze**: everything stops; `SIGNAL LOST` centered over the board.
  - `300–900ms` **infall**: every filled board cell accelerates toward the board
    center, easing in.
  - `900–1300ms` **black hole**: the cells are gone; draw the §28 figure centered:
    ```
              ·
            ˚
           \ | /
         --- ● ---
           / | \
             *
    ```
    plus one shockwave at the center. [ASCII: `@` for `●`, `*` for `˚`.]
  - After `CollapseDone`, plan 2's game-over overlay appears with
    `UNIVERSE EXPIRED`, the final stats, and the two key prompts; add the §28
    subtitle `CAUSE: EXCESSIVE GEOMETRY` to that overlay.

  `r` and `q` work during the collapse (§44: never make controls lag) — `r`
  cancels it and restarts. With `--no-fx` the collapse is skipped and the overlay
  appears at once.

- [ ] **Step 1: Write the failing tests in `internal/fx/collapse_test.go`**

```go
func TestCollapsePhaseBoundaries(t *testing.T)
// StartCollapse then sample: 0ms/299ms CollapseFreeze, 300ms/899ms
// CollapseInfall, 900ms/1299ms CollapseBlackHole, 1301ms CollapseDone

func TestFilledCellsFallTowardTheCenter(t *testing.T)
// cells from both edges: during infall, each cell's distance to the board
// center strictly decreases every frame

func TestInfallEasesIn(t *testing.T)
// the distance covered in the second half of the infall exceeds the first half

func TestCellsAreGoneInTheBlackHolePhase(t *testing.T)
// Collapse().Cells is empty once Phase == CollapseBlackHole

func TestBlackHoleEmitsOneShockwave(t *testing.T)

func TestGameOverEventStartsTheCollapse(t *testing.T)
// Observe(GameOver) begins it without a separate StartCollapse call

func TestCollapseIgnoresFurtherEvents(t *testing.T)
// events observed mid-collapse do not spawn banners or trails

func TestDisabledWorldSkipsTheCollapse(t *testing.T)
// !Enabled: Collapse() reports absent immediately after GameOver
```

- [ ] **Step 2: Write the failing render tests in `internal/render/collapse_test.go`**

```go
func TestFreezePhaseShowsSignalLost(t *testing.T)
// "SIGNAL LOST" appears over the board and the board's own cells are still drawn

func TestBlackHoleFigureIsCentered(t *testing.T)
// the ANSI-stripped frame contains "--- ● ---" (and the surrounding rows),
// centered on the board box

func TestCollapseDrawsInsideTheTerminal(t *testing.T)
// 40x24 and 80x30: nothing out of bounds, exact line count preserved

func TestFinalOverlayFollowsTheCollapse(t *testing.T)
// with Phase CollapseDone and Overlay OverlayGameOver: the frame shows
// "UNIVERSE EXPIRED", the stats, and "CAUSE: EXCESSIVE GEOMETRY"

func TestASCIICollapseFigureIsASCII(t *testing.T)
```

- [ ] **Step 3: Write the failing app test in `internal/app/gameover_fx_test.go`**

```go
func TestOverlayWaitsForTheCollapse(t *testing.T)   // §28 "do not instantly
// replace the board": during the collapse, Overlay is OverlayNone; after
// CollapseTotal it becomes OverlayGameOver

func TestRestartDuringCollapseWorksImmediately(t *testing.T)
// handleKey("r") mid-collapse -> StatePlaying, fresh game, collapse cleared

func TestQuitDuringCollapseWorks(t *testing.T)

func TestNoFXShowsTheOverlayImmediately(t *testing.T)
```

- [ ] **Step 4: Run the three test files to verify they fail**

Run: `go test ./... -run 'Collapse|BlackHole|SignalLost|Overlay' -v`
Expected: FAIL — `undefined: Collapse`.

- [ ] **Step 5: Implement `collapse.go`, `DrawCollapse`, and the overlay gating**

`SnapshotOf` does not carry the board, so `app.advance` builds the
`[]CollapseCell` from the board once, on the `GameOver` event, and passes it to
`StartCollapse` — a copy, consistent with the header's no-`*game.Game` rule.

- [ ] **Step 6: Run the tests and die on purpose**

Run: `go test ./... && ./cosmic-tetris --seed 1`
Expected: lose. The board freezes, reports `SIGNAL LOST`, falls into itself, and
collapses into a black hole before the final card appears. `r` restarts from any
point in that sequence.

- [ ] **Step 7: Commit**

```bash
git add internal/fx/collapse.go internal/fx/collapse_test.go internal/render/ internal/app/
git commit -m "feat(fx): game-over freeze, infall, and black-hole collapse"
```
