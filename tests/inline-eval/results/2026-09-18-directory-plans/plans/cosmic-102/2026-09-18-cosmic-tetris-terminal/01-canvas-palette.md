### Task 1: Canvas and palette

**Files:**
- Create: `internal/render/canvas.go`
- Create: `internal/render/palette.go`
- Test: `internal/render/canvas_test.go`
- Test: `internal/render/palette_test.go`

**Interfaces:**
- Consumes: `game.PieceKind` (plan 1).
- Produces:
  ```go
  // canvas.go
  type Mode int
  const (ModeFull Mode = iota; ModeReduced; ModeASCII)

  type Options struct {
      Mode          Mode
      NoFX          bool
      ReducedMotion bool
  }

  // Paint is comparable on purpose: Canvas coalesces runs of equal Paint into
  // one styled string, which keeps a full redraw cheap and flicker-free.
  type Paint struct {
      FG    string // hex "#22E4EF" in full mode, "51" in reduced, "14" in ASCII
      Bold  bool
      Faint bool
  }

  type Canvas struct { /* w, h, runes, paints */ }
  func NewCanvas(w, h int) *Canvas
  func (c *Canvas) Size() (w, h int)
  func (c *Canvas) Set(x, y int, r rune, p Paint)          // no-op when out of bounds
  func (c *Canvas) SetString(x, y int, s string, p Paint)   // clips at the right edge
  func (c *Canvas) Fill(r rune, p Paint)
  func (c *Canvas) String() string                          // h lines, styled

  // palette.go
  func BlockGlyph(mode Mode) string   // "██" | "██" | "[]"
  func GhostGlyph(mode Mode) string   // "░░" | "░░" | "··"
  func KindPaint(k game.PieceKind, mode Mode, active bool) Paint
  func GhostPaint(mode Mode) Paint
  func BorderPaint(mode Mode, phase float64) Paint  // phase in [0,1) walks the
                                                    // §25 palette; 0 is the base
  func TextPaint(mode Mode, emphasis int) Paint      // 0 dim, 1 normal, 2 bright
  ```
  Piece colors (§26), pinned here so goldens and later tasks agree:

  | kind | intent | full (hex) | reduced (256) | ASCII (ANSI) |
  |---|---|---|---|---|
  | I | plasma cyan | `#22E4EF` | `51` | `14` |
  | J | deep electric blue | `#3B5BFF` | `27` | `12` |
  | L | solar orange | `#FF8A2B` | `208` | `3` |
  | O | stellar gold | `#FFD24A` | `220` | `11` |
  | S | alien green | `#4CE66B` | `47` | `10` |
  | T | ultraviolet | `#A050FF` | `135` | `13` |
  | Z | supernova pink | `#FF3D6E` | `197` | `9` |

  Border palette for `BorderPaint` (§25): `#6C2BD9` deep violet, `#22E4EF`
  electric cyan, `#FF3DDA` magenta, `#3B5BFF` stellar blue, `#FFFFFF` hot white.

- [ ] **Step 1: Write the failing tests in `internal/render/canvas_test.go`**

```go
func TestNewCanvasIsBlank(t *testing.T)
// NewCanvas(4,2).String() -> two lines of four spaces, no escape codes

func TestSetAndStringPlaceRunes(t *testing.T)
// Set(2,1,'X',Paint{}) -> line 1 is "  X " (ANSI-stripped)

func TestSetOutOfBoundsIsIgnored(t *testing.T)
// Set(-1,0), Set(0,-1), Set(99,0), Set(0,99) do not panic and do not change String()

func TestSetStringClipsAtRightEdge(t *testing.T)
// NewCanvas(4,1); SetString(2,0,"ABCD",Paint{}) -> "  AB"

func TestSetStringHandlesWideRunes(t *testing.T)
// SetString(0,0,"██",Paint{}) occupies x=0 and x=1; ANSI-stripped line is "██  "
// on a 4-wide canvas (assert utf8 rune count, not byte length)

func TestStringHasExactlyHeightLines(t *testing.T)
// for sizes 1x1, 10x3, 80x24: strings.Count(String(), "\n") == h-1 and every
// ANSI-stripped line has exactly w display columns

func TestEqualPaintRunsCoalesce(t *testing.T)
// fill a 10x1 canvas with one Paint{FG:"#FFFFFF"}: String() contains exactly
// one color-set escape sequence (count occurrences of "\x1b[")

func TestZeroSizeCanvasIsSafe(t *testing.T)
// NewCanvas(0,0).String() == "" and Set(0,0,...) does not panic
```

- [ ] **Step 2: Write the failing tests in `internal/render/palette_test.go`**

```go
func TestGlyphsPerMode(t *testing.T)
// BlockGlyph: ModeFull "██", ModeReduced "██", ModeASCII "[]"
// GhostGlyph: ModeFull "░░", ModeReduced "░░", ModeASCII "··"   (§49.4)

func TestASCIIGlyphsAreASCIIOnly(t *testing.T)
// every rune in BlockGlyph(ModeASCII) and GhostGlyph(ModeASCII) is < 128

func TestKindPaintColorsPerMode(t *testing.T)
// table-driven against the pinned table above, all three modes, all seven kinds

func TestActivePieceIsBrighterThanLocked(t *testing.T)
// for every kind and mode: KindPaint(k,mode,true).Bold is true and
// KindPaint(k,mode,false).Bold is false, and the two differ   (§49.4)

func TestKindPaintNeverSetsBackground(t *testing.T)
// Paint has no background field; assert the struct has exactly the four
// documented fields via a compile-time literal (guards §49.4's "no fg+bg pair")

func TestBorderPaintCyclesThroughThePalette(t *testing.T)
// phases 0, 0.2, 0.4, 0.6, 0.8 give five distinct FG values, all from the
// pinned border palette; phase 1.0 wraps to the phase 0 value

func TestGhostPaintIsFaint(t *testing.T)
```

- [ ] **Step 3: Run both test files to verify they fail**

Run: `go test ./internal/render/ -v`
Expected: build failure — `undefined: NewCanvas`.

- [ ] **Step 4: Implement `canvas.go` and `palette.go`**

`Canvas` holds `[]rune` and `[]Paint` slices of length `w*h`, allocated once.
`String` walks each row, accumulating a run while `Paint` is unchanged, and
applies `lipgloss.NewStyle().Foreground(lipgloss.Color(p.FG))` (plus
`Bold`/`Faint`) once per run. A zero-value `Paint` renders unstyled.

Wide glyphs: `Set` stores one rune per cell, so callers place `██` through
`SetString`, which writes one rune per column. Add a test helper `stripANSI`
(regexp `\x1b\[[0-9;]*m`) in a shared `internal/render/testhelp_test.go` — Task 9
reuses it.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/render/canvas.go internal/render/palette.go internal/render/*_test.go
git commit -m "feat(render): coalescing canvas and neon space palette"
```
