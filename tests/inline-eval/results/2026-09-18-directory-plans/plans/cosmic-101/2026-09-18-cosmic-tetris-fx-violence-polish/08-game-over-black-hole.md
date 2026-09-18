### Task 8: Game-over black hole

**Files:**
- Create: `internal/fx/collapse.go`
- Modify: `internal/fx/world.go` (`Observe`: `GameOver`)
- Create: `internal/render/collapse.go`
- Modify: `internal/render/render.go` (`PhaseGameOver` stages)
- Modify: `internal/app/update.go` (game-over phase keeps accepting keys)
- Test: `internal/fx/collapse_test.go`
- Test: `internal/render/collapse_test.go`
- Test: `internal/app/gameover_test.go`

**Interfaces:**
- Consumes: `World`, `Emit`, `Particle`, `Snapshot` (plan 3); `gameOverPanel`, `overlayCentre` (plan 2 Task 8); `Model` (plan 2 Task 7).
- Produces:
```go
// fx
type CollapseStage uint8
const (
    CollapseNone CollapseStage = iota
    CollapseFrozen     // 0–300ms    "SIGNAL LOST"
    CollapseFalling    // 300–900ms  blocks fall inward toward the centre
    CollapseSingular   // 900–1300ms the black hole
    CollapsePanel      // 1300ms+    the final panel
)
const (
    CollapseFreezeEnd    = 300 * time.Millisecond
    CollapseFallEnd      = 900 * time.Millisecond
    CollapseSingularEnd  = 1300 * time.Millisecond
)
func (w *World) StartCollapse(cells [][2]int)   // the locked board cells at the moment of death
func (w *World) Collapse() (CollapseStage, float64)  // stage and 0..1 progress within it
func (w *World) CollapseBlocks() []Particle     // blocks in flight toward the centre

// render
func collapseOverlay(s Scene, p Palette) (string, bool)
```

`Observe` on `GameOver` calls `StartCollapse` with every filled board cell and raises `BorderEnergy` to 1.0. During `CollapseFalling` each block is a particle with velocity aimed at the board centre, speed proportional to its distance, so the board implodes rather than falling down.

Stage rendering (§28):

```text
Frozen      the board as it died, with "SIGNAL LOST" over it; nothing moves
Falling     locked cells replaced by the in-flight blocks
Singular    the board interior replaced by the black hole figure below
Panel       the plan-2 game-over panel, plus the subtitle CAUSE: EXCESSIVE GEOMETRY
```

```text
          ·
        ˚
       \ | /
     --- ● ---
       / | \
         *
```

The app keeps handling keys through every stage (§28's sequence is presentation only): `r` reboots the universe immediately, `q` quits immediately, and neither waits for `CollapsePanel`.

- [ ] **Step 1: Write the failing test**

`internal/fx/collapse_test.go`:

```go
func TestCollapseStageTimeline(t *testing.T)
// StartCollapse(cells): stage CollapseFrozen
// Step(310ms): CollapseFalling; Step to 950ms: CollapseSingular
// Step to 1350ms: CollapsePanel; progress is within [0,1] at each check

func TestGameOverEventStartsCollapse(t *testing.T)
// reach a real game over; Observe(evs, snapshotOf(g))
// Collapse() stage is CollapseFrozen and BorderEnergy() == 1.0

func TestFrozenStageMovesNothing(t *testing.T)
// during CollapseFrozen, Step(100ms) leaves every CollapseBlocks() position unchanged

func TestBlocksFallInward(t *testing.T)
// during CollapseFalling, each block's distance to the board centre strictly decreases
//   over a Step, from both sides and from top and bottom

func TestCollapseIsFiniteAndStable(t *testing.T)
// Step(10 * time.Second) after the panel stage: stage stays CollapsePanel,
//   no NaN positions, CollapseBlocks() does not grow
```

`internal/render/collapse_test.go`:

```go
func TestSignalLostInFrozenStage(t *testing.T)
// a PhaseGameOver scene at 100ms: the frame contains "SIGNAL LOST"
//   and does not yet contain "UNIVERSE EXPIRED"

func TestBlackHoleFigureInSingularStage(t *testing.T)
// at 1000ms: the frame contains "●" and the "\ | /" arms

func TestFinalPanelAfterSequence(t *testing.T)
// at 1400ms: the frame contains "UNIVERSE EXPIRED", the score, and
//   "CAUSE: EXCESSIVE GEOMETRY"

func TestCollapseKeepsFrameSize(t *testing.T)
// every stage at 80×30 and 40×24: exactly h lines of w columns

func TestCollapseASCII(t *testing.T)
// ModeASCII at the singular stage: only ASCII bytes (the ● folds to a letter-safe glyph)

func TestCollapseGoldens(t *testing.T)
// golden files "collapse-frozen" (100ms) and "collapse-singular" (1000ms) at 80×30
```

`internal/app/gameover_test.go`:

```go
func TestRestartDuringCollapseIsImmediate(t *testing.T)   // Review Focus
// reach game over; handleKey("r") at 100ms into the sequence
// Phase == render.PhasePlaying and Score == 0 right away — no waiting for 1300ms

func TestQuitDuringCollapseIsImmediate(t *testing.T)   // Review Focus
// handleKey("q") at 100ms into the sequence returns a non-nil quit command

func TestGameplayKeysIgnoredAfterGameOver(t *testing.T)
// handleKey("left") after game over does not move anything and does not panic
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/fx/ -run TestCollapseStage -v`
Expected: FAIL — `undefined: StartCollapse`.

- [ ] **Step 3: Implement `internal/fx/collapse.go`, `internal/render/collapse.go`, and the app's game-over key handling**

Reuse `Particle` for the falling blocks rather than a new type; they need the same integration, only with an inward velocity and no gravity.

- [ ] **Step 4: Generate and read the collapse goldens**

Run: `go test ./internal/render/ -run TestCollapseGoldens -update` and read both files.

- [ ] **Step 5: Run the tests and die on purpose**

Run: `go test ./... && go vet ./...` — PASS, clean.
Run: `go run ./cmd/cosmic-tetris --seed 1234`, stack to the top, and watch the universe collapse. Press `r` mid-collapse and confirm it reboots instantly.

- [ ] **Step 6: Commit**

```bash
git add internal/fx internal/render internal/app
git commit -m "feat(fx): game-over collapse into a simulated black hole"
```
