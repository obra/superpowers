### Task 6: Piece trails and quantum storage

**Files:**
- Create: `internal/fx/trail.go`
- Modify: `internal/fx/world.go` (trail slice, `Step` aging, `Trails()`, `Observe` handlers)
- Modify: `internal/render/board.go` (trail marks inside the board box)
- Test: `internal/fx/trail_test.go`
- Test: `internal/render/trail_test.go`

**Interfaces:**
- Consumes: `World`, `Observe` (Task 1); `composite`, `mark` (Task 4); `game.Event`, `game.Piece` (plan 1).
- Produces:
```go
// fx
type Trail struct {
    X, Y  int      // board cell coordinates (x in 0..9, y in 0..21)
    Age   float64  // seconds since emission
    Stage int      // 0..3, recomputed each step: int(Age / (TrailLife/4))
}
const (
    TrailLife     = 140 * time.Millisecond   // §17: ~100–160ms
    MaxTrailCells = 200
)
func (w *World) Trails() []Trail

// §9's QUANTUM STORAGE: the outgoing held piece compresses, streaks sideways, vanishes
const HoldStreakLife = 120 * time.Millisecond
type HoldStreak struct {
    Cells [4][2]int   // the outgoing piece's board cells at the moment of the hold
    Age   float64
}
func (w *World) HoldStreak() (HoldStreak, bool)
func (h HoldStreak) Progress() float64   // 0..1 over HoldStreakLife

// render
func trailMarks(s Scene, p Palette, l Layout) []mark
// Stage glyphs, ModeFull/ModeReduced: 0 "▓▓", 1 "▒▒", 2 "░░", 3 "░░" dimmed
// ModeASCII via asciiFold

func holdStreakMarks(s Scene, p Palette, l Layout) []mark
// the outgoing cells drawn compressed toward the HOLD panel side and fading with
// Progress(): "▓▓" -> "▒▒" -> "░░" while shifting left by up to 3 columns
```

`Observe` on `HoldUsed` starts a `HoldStreak` from `Event.Piece`'s cells. Gameplay never waits for it (§9) — the incoming piece is already active and controllable while the streak plays out.

`Observe` emits trails from the *vacated* cells of a `PieceMoved` or `PieceRotated` event: the event carries the piece's new position, so `World` keeps the last seen active-piece cells and emits a trail for each cell that is no longer occupied. Trails age in `Step` and are dropped at `Age >= TrailLife`. `MaxTrailCells` is enforced the same way as the particle cap.

Trails render inside the board box but only over blank cells (`OverPrint: false`), which is what makes §44's "never obscure the active piece" and "never permanently alter the rendered board" true by construction rather than by care.

- [ ] **Step 1: Write the failing test**

`internal/fx/trail_test.go`:

```go
func TestMoveLeavesTrailAtVacatedCells(t *testing.T)
// g := game.New(1); evs := g.Apply(game.InputLeft)
// w.Observe(evs, snapshotOf(g)): Trails() holds cells the piece just left,
//   and none of the cells it now occupies

func TestTrailStagesAdvance(t *testing.T)
// after emission: Stage 0
// Step(40ms) -> Stage 1; Step(40ms) -> Stage 2; Step(40ms) -> Stage 3

func TestTrailExpires(t *testing.T)
// Step(TrailLife + time.Millisecond): Trails() is empty

func TestTrailCapHolds(t *testing.T)
// 500 rapid move events: len(Trails()) <= MaxTrailCells

func TestRotationLeavesTrail(t *testing.T)
// a successful rotate emits trails for the cells the rotation vacated

func TestNoTrailWhenMoveFails(t *testing.T)
// a blocked move returns no events, so Observe adds no trails

func TestHoldStartsQuantumStreak(t *testing.T)
// Observe a HoldUsed event: HoldStreak() returns ok with the outgoing piece's cells
// Progress() is 0, then about 0.5 after Step(60ms)

func TestHoldStreakExpires(t *testing.T)
// Step(HoldStreakLife + time.Millisecond): HoldStreak() returns ok == false

func TestSecondHoldReplacesStreak(t *testing.T)
// two HoldUsed events 60ms apart: one streak, with the second piece's cells, Age reset
```

`internal/render/trail_test.go`:

```go
func TestTrailMarksInsideBoard(t *testing.T)
// every mark from trailMarks falls inside the board box's interior columns and rows

func TestTrailNeverOverwritesPieceOrLockedCells(t *testing.T)
// a scene where the trail cells coincide with locked blocks and the active piece:
// stripANSI(Render(s)) shows "██" at those cells, never a trail glyph

func TestHoldStreakFadesAndDoesNotBlock(t *testing.T)
// a scene mid-streak: the frame contains a streak glyph, the new active piece still
//   renders as its own block glyph, and Render dimensions are exact
// at Progress() near 1 the streak marks are gone

func TestTrailGlyphsPerStage(t *testing.T)
// a scene with one trail at each stage on empty cells:
//   the frame contains "▓▓", "▒▒", "░░" for stages 0,1,2
// in ModeASCII the same scene contains only ASCII bytes
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/fx/ -run TestMoveLeavesTrail -v`
Expected: FAIL — `undefined: Trail`.

- [ ] **Step 3: Implement `internal/fx/trail.go`, `trailMarks`, and `holdStreakMarks`**

Track the last active-piece cells on `World` as a `[4][2]int`; the vacated set is the difference between that and the event's piece cells.

- [ ] **Step 4: Run the tests**

Run: `go test ./... && go vet ./...`
Expected: PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): ion trails behind moving pieces and quantum storage streak"
```
