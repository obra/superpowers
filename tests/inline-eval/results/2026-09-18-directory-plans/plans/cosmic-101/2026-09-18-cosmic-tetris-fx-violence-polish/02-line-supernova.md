### Task 2: Line-clear supernova

**Files:**
- Create: `internal/fx/lineanim.go`
- Modify: `internal/fx/world.go` (`Observe` handling of `LinesCleared`)
- Create: `internal/render/lineanim.go`
- Modify: `internal/render/render.go` (composite line animations inside the board box)
- Test: `internal/fx/lineanim_test.go`
- Test: `internal/render/lineanim_test.go`

**Interfaces:**
- Consumes: `World`, `EmitBurst`, `Emit`, `Particle` (plan 3); `composite`, `mark`, `Layout` (plans 2–3).
- Produces:
```go
// fx
type LineAnim struct {
    Row int      // board row the clear happened on
    Age float64  // seconds since the clear
}
const (
    LineAnimTotal = 220 * time.Millisecond   // §19
    LineAnimPhaseA = 60 * time.Millisecond   // critical mass
    LineAnimPhaseB = 140 * time.Millisecond  // supernova (cumulative boundary)
)
func (a LineAnim) Phase() int          // 0 A, 1 B, 2 C
func (a LineAnim) Progress() float64   // 0..1 within the current phase
func (w *World) LineAnims() []LineAnim

// render
func lineAnimMarks(s Scene, p Palette, l Layout) []mark
// OverPrint: true — these marks deliberately draw over the board's cells
```

`Observe` on `LinesCleared` starts one `LineAnim` per row and, at the end of phase B, emits debris: for each of the 10 cells, one particle whose `VX` is proportional to its distance from the row's centre (§19's "particles inherit some horizontal velocity from their location relative to center") and a small upward `VY`.

Phase rendering, centre-outward, using the row's full 20-column span:

```text
A  critical mass   the row's cells become ▓▓, brightest at the centre
B  supernova       ░░░▓▓██✦✦██▓▓░░░  — the bright core widens with Progress()
C  collapse        sparse debris glyphs, thinning to nothing
```

The board underneath has already collapsed (gameplay never waits for animation, §44), so the animation reads as a bright band at those rows rather than as the old row's contents. That is the deliberate trade §19 asks for.

Starting a new `LineAnim` for a row that already has one **replaces** it, and every anim is dropped at `Age >= LineAnimTotal` — that is what keeps a fast player from accumulating stale bands.

- [ ] **Step 1: Write the failing test**

`internal/fx/lineanim_test.go`:

```go
func TestLinesClearedStartsAnims(t *testing.T)
// Observe LinesCleared{Rows: []int{19, 21}}: LineAnims() has 2 entries with those rows

func TestPhaseBoundaries(t *testing.T)
// LineAnim{Age: 0.0}.Phase() == 0
// Age just under LineAnimPhaseA: 0; just over: 1
// Age just under LineAnimPhaseB: 1; just over: 2
// Progress() is within [0,1] at every one of those points

func TestAnimExpires(t *testing.T)
// Step(LineAnimTotal + time.Millisecond): LineAnims() is empty

func TestPhaseCEmitsDebrisWithOutwardVelocity(t *testing.T)
// Observe a clear, Step past LineAnimPhaseB
// particles exist; those left of the row centre have VX < 0, those right have VX > 0

func TestOverlappingClearsDoNotAccumulate(t *testing.T)   // Review Focus
// Observe LinesCleared{Rows: []int{21}}; Step(100ms)
// Observe LinesCleared{Rows: []int{21}} again (a second clear on the same row)
// len(LineAnims()) == 1 and its Age restarted at 0
// Step(LineAnimTotal + 1ms): LineAnims() is empty — nothing stale survives

func TestFourRowsAnimateTogether(t *testing.T)
// Observe LinesCleared{Rows: []int{18,19,20,21}}: 4 anims, all Phase 0
```

`internal/render/lineanim_test.go`:

```go
func TestLineAnimMarksStayInsideBoard(t *testing.T)
// every mark is within the board box interior, on the animating rows only

func TestPhaseGlyphsAppear(t *testing.T)
// a scene at each phase: the frame contains "▓▓" in A, "✦" in B, and a DebrisGlyph in C

func TestLineAnimDoesNotObscureActivePiece(t *testing.T)   // §44
// a scene where the new active piece overlaps an animating row:
// the active piece's cells still render as its own block glyph

func TestRenderKeepsSizeDuringAnim(t *testing.T)
// mid-animation Render at 80×30 and 40×24: exact dimensions hold

func TestASCIIModeLineAnim(t *testing.T)
// ModeASCII mid-animation: the frame contains only ASCII bytes
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/fx/ -run TestLinesClearedStarts -v`
Expected: FAIL — `undefined: LineAnim`.

- [ ] **Step 3: Implement `internal/fx/lineanim.go` and `internal/render/lineanim.go`**

Order the marks so the active piece is composited after them — easiest by producing line-anim marks before the board panel's own active-piece cells, or by excluding the active piece's cells from the mark list. Either is fine; the test pins the outcome.

- [ ] **Step 4: Run the tests**

Run: `go test ./... && go vet ./...`
Expected: PASS, clean.

- [ ] **Step 5: Clear a line and look at it**

Run: `go run ./cmd/cosmic-tetris --seed 1234`, clear a single row. Per §43 you should get a supernova, debris, and a border reaction — and the piece after it must be controllable the whole time.

- [ ] **Step 6: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): three-phase supernova line-clear animation with debris"
```
