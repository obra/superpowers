### Task 7: Line-clear supernova

**Files:**
- Create: `internal/fx/lineclear.go`
- Modify: `internal/render/fxdraw.go` (draw the animation inside the board box)
- Test: `internal/fx/lineclear_test.go`
- Test: `internal/render/lineclear_test.go`

**Interfaces:**
- Consumes: `World`, `EmitBurst`, `FlashBorder`, `LineClearTotal` (Tasks 1–6);
  `game.LinesCleared` with its `Rows` (plan 1).
- Produces:
  ```go
  type ClearPhase int
  const (PhaseCriticalMass ClearPhase = iota; PhaseSupernova; PhaseCollapse)

  type LineClear struct {
      Rows     []int       // board rows, as cleared
      Phase    ClearPhase
      Progress float64     // 0..1 within the phase
      Overall  float64     // 0..1 across LineClearTotal
  }
  func (w *World) LineClears() []LineClear   // more than one may be in flight
  ```
  Pinned (§19): total `220ms`, split `0–70ms` critical mass, `70–150ms`
  supernova, `150–220ms` collapse. Rendering per phase, over the cleared rows'
  cells:
  - **Critical mass** — cells dim outward from the center: `▓▓` [`##`].
  - **Supernova** — a bright front expands from the row's center outward; cells
    inside the front are `✦` with hot-white paint, behind it `██`, outside `░░`.
  - **Collapse** — the row becomes debris: `EmitBurst` per cleared row, `LayerBoard`,
    with horizontal velocity proportional to the cell's signed distance from the
    row center (§19), then nothing.

  The engine has already removed the rows (§19: "gameplay state may already know
  the result"), so the animation paints over whatever now occupies those rows —
  it must never resurrect a cleared row's contents or gate the engine.
  `FlashBorder(0.4)` for 1–3 rows; the four-row case is Task 9.

- [ ] **Step 1: Write the failing tests in `internal/fx/lineclear_test.go`**

```go
func TestClearAnimationPhaseBoundaries(t *testing.T)
// Observe(LinesCleared{Rows:[21],Count:1}):
//   at 0ms   Phase == PhaseCriticalMass, Overall ≈ 0
//   at 70ms  Phase == PhaseSupernova
//   at 150ms Phase == PhaseCollapse
//   at 221ms LineClears() is empty

func TestProgressIsPerPhase(t *testing.T)
// at 35ms: Phase == PhaseCriticalMass && Progress ≈ 0.5

func TestCollapseEmitsDebrisOnce(t *testing.T)
// particle count jumps when PhaseCollapse begins and does not jump again
// on subsequent frames within the same animation

func TestDebrisInheritsHorizontalVelocityFromPosition(t *testing.T)   // §19
// particles born left of the row center have VX < 0, right of it VX > 0

func TestAnimationDoesNotDelayGameplay(t *testing.T)   // §19, §44
// with a clear animation live, drive the real game: Advance the engine and
// assert the active piece still falls and can lock during the animation

func TestSecondClearDuringTheFirstIsNotDropped(t *testing.T)
// Observe a clear, Advance(100ms), Observe another: LineClears() has 2 entries
// with independent Overall values

func TestFourRowClearAnimatesAllFourRows(t *testing.T)
// Rows:[18,19,20,21] -> one LineClear covering four rows

func TestClearFlashesTheBorder(t *testing.T)   // 0.4 for a 1..3-row clear

func TestDisabledWorldHasNoClearAnimation(t *testing.T)
```

- [ ] **Step 2: Write the failing render tests in `internal/render/lineclear_test.go`**

```go
func TestCriticalMassPhaseGlyph(t *testing.T)   // ▓▓ across the row's 20 columns
func TestSupernovaFrontExpandsFromCenter(t *testing.T)
// render at Progress .1 and .9: the count of hot-white cells increases and is
// centered on the row

func TestCollapsePhaseLeavesTheRowToTheBoard(t *testing.T)
// during PhaseCollapse the row shows the board's own contents, not clear glyphs

func TestClearAnimationStaysInsideTheBoardBox(t *testing.T)
// rows at the very top and bottom: nothing is written outside the border

func TestASCIIClearGlyphs(t *testing.T)   // every rune < 128
```

- [ ] **Step 3: Run both test files to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run 'Clear|Supernova|CriticalMass' -v`
Expected: FAIL — `undefined: LineClears`.

- [ ] **Step 4: Implement `lineclear.go` and its draw step**

Keep a small slice of in-flight animations, each with its own elapsed time.
`Rows` is copied on `Observe` — the engine's slice must not be retained.

- [ ] **Step 5: Run the tests and look at it**

Run: `go test ./... && ./cosmic-tetris --seed 1`
Expected: a completed line goes critical, detonates outward from the middle, and
falls apart into debris — in about a fifth of a second, with the piece after it
already falling.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/lineclear.go internal/fx/lineclear_test.go internal/render/
git commit -m "feat(fx): three-phase supernova line-clear animation"
```
