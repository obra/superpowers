### Task 3: Shockwaves

**Files:**
- Create: `internal/fx/shockwave.go`
- Create: `internal/render/shockwave.go`
- Modify: `internal/render/render.go` (composite shockwaves with the global FX pass)
- Test: `internal/fx/shockwave_test.go`
- Test: `internal/render/shockwave_test.go`

**Interfaces:**
- Consumes: `World`, `Config.ReducedMotion` (plan 3); `composite`, `mark`, `asciiFold` (plan 3).
- Produces:
```go
// fx
type Shockwave struct {
    CX, CY  float64  // centre, in terminal cells
    Age     float64
    MaxAge  float64
}
const (
    ShockwaveLife   = 300 * time.Millisecond   // §24
    ShockwaveRadiusX = 16.0                    // terminal columns at full expansion
    ShockwaveRadiusY = 7.0                     // rows — the 2:1 cell aspect faked (§24)
    MaxShockwaves   = 3                        // §24: use sparingly
)
var RingGlyphs = []rune{'·', '○', '◌', '◯'}
func (w *World) EmitShockwave(cx, cy float64)   // no-op when cfg.ReducedMotion; oldest dropped past MaxShockwaves
func (w *World) Shockwaves() []Shockwave
func (s Shockwave) Radius() (rx, ry float64)   // Age/MaxAge × the radius constants

// render
func shockwaveMarks(s Scene, p Palette) []mark  // OverPrint: false — never covers the board or HUD
```

A ring is drawn as glyphs sampled around the ellipse at the current radius, one glyph per sampled angle (24 samples), with the glyph chosen from `RingGlyphs` by expansion progress so the ring visibly thickens as it grows. Marks are single-column.

- [ ] **Step 1: Write the failing test**

`internal/fx/shockwave_test.go`:

```go
func TestEmitAndExpand(t *testing.T)
// EmitShockwave(20, 10): one entry, Age 0, Radius() near (0,0)
// Step(150ms): Radius() is about half of (ShockwaveRadiusX, ShockwaveRadiusY)

func TestShockwaveExpires(t *testing.T)
// Step(ShockwaveLife + time.Millisecond): Shockwaves() is empty

func TestShockwaveCap(t *testing.T)
// five EmitShockwave calls: len(Shockwaves()) == MaxShockwaves, keeping the newest

func TestReducedMotionSuppressesShockwaves(t *testing.T)   // Review Focus
// Config{ReducedMotion: true}: EmitShockwave then Step: Shockwaves() is always empty
```

`internal/render/shockwave_test.go`:

```go
func TestShockwaveMarksOnEllipse(t *testing.T)
// mid-life shockwave at the board centre: marks exist left, right, above and below
//   the centre, and the horizontal spread is wider than the vertical (the 2:1 fake)

func TestShockwaveMarksClipToFrame(t *testing.T)
// a shockwave centred at (1,1) and one at (w-1,h-1): Render does not panic and
//   output dimensions are exact

func TestShockwaveDoesNotCoverBoardCells(t *testing.T)
// a shockwave over a board full of locked blocks: every board cell still reads "██"

func TestASCIIRingGlyphs(t *testing.T)
// ModeASCII: shockwave marks contain only ASCII bytes
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/fx/ -run TestEmitAndExpand -v`
Expected: FAIL — `undefined: Shockwave`.

- [ ] **Step 3: Implement `internal/fx/shockwave.go` and `internal/render/shockwave.go`**

Sample angles with a fixed step so the ring is stable frame to frame rather than shimmering.

- [ ] **Step 4: Run the tests**

Run: `go test ./... && go vet ./...`
Expected: PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): faked radial shockwaves with an elliptical ring"
```
