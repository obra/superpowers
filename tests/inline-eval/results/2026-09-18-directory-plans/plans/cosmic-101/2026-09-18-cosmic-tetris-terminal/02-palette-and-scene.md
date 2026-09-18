### Task 2: Palette, glyph sets, and the Scene contract

**Files:**
- Modify: `internal/render/palette.go` (adds colors, glyphs, styles to Task 1's `Mode`)
- Create: `internal/render/render.go` (types only; the pipeline arrives in Task 6)
- Test: `internal/render/palette_test.go`

**Interfaces:**
- Consumes: `render.Mode` (Task 1); `game.PieceKind` (plan 1 Task 1).
- Produces:
```go
// render.go — the contract every later task and plan renders through
type Phase uint8
const (PhaseBoot Phase = iota; PhasePlaying; PhasePaused; PhaseHelp; PhaseGameOver)

type Options struct {
    Mode          Mode
    FX            bool
    ReducedMotion bool
}

type Scene struct {
    Game          *game.Game
    Phase         Phase
    Width, Height int
    Mission       string        // "" renders an empty channel line
    Elapsed       time.Duration // since program start; drives time-based visuals
    Opts          Options
}

// palette.go
func ResolveMode(requested Mode, truecolor bool) Mode
// ModeASCII stays ModeASCII; otherwise ModeFull when truecolor, else ModeReduced

type Glyphs struct { Block, Ghost, Empty string }
func GlyphsFor(m Mode) Glyphs
// ModeFull, ModeReduced: {"██", "░░", "  "}
// ModeASCII:             {"[]", "··", "  "}

type Palette struct{ /* mode */ }
func NewPalette(m Mode) Palette
func (p Palette) Piece(k game.PieceKind, active bool) lipgloss.Style
func (p Palette) Ghost() lipgloss.Style
func (p Palette) Border(phase float64) lipgloss.Style  // phase in [0,1) walks the ramp below
func (p Palette) Label() lipgloss.Style                // dim HUD labels
func (p Palette) Value() lipgloss.Style                // bright HUD numbers
func (p Palette) Accent() lipgloss.Style               // title, mission-control prefix
func (p Palette) Dim() lipgloss.Style                  // controls line, starfield far layer
```

Piece colors (§26), locked / active-brighter pairs in `ModeFull`:

```text
I  #22E4EF / #8FF7FF     J  #3A5BFF / #92A8FF     L  #FF8A2B / #FFC08A
O  #FFD23F / #FFE9A0     S  #46E86B / #A8F7BB     T  #A24BFF / #D2A6FF
Z  #FF3D6E / #FF9AB5
```

`ModeReduced` uses ANSI-256 indices, locked / active: I `51/195`, J `33/111`, L `208/216`, O `220/229`, S `78/157`, T `141/183`, Z `204/218`. `ModeASCII` uses the 16-color basics — I `6`, J `4`, L `3`, O `11`, S `2`, T `5`, Z `1` — and marks the active piece with bold rather than a second color, since 16 colors has no room for fourteen distinct shades.

Border ramp (§25), in order, cycled by `phase`: `#5B2A86` deep violet → `#22E4EF` electric cyan → `#FF3DE0` magenta → `#3A5BFF` stellar blue → `#F4F8FF` hot white → back to violet. `ModeFull` interpolates between adjacent stops; `ModeReduced` and `ModeASCII` snap to the nearest stop.

- [ ] **Step 1: Write the failing test**

`internal/render/palette_test.go`:

```go
func TestResolveMode(t *testing.T)
// ResolveMode(ModeASCII, true) == ModeASCII
// ResolveMode(ModeFull, true) == ModeFull
// ResolveMode(ModeFull, false) == ModeReduced

func TestGlyphsPerMode(t *testing.T)
// ModeFull and ModeReduced: Block == "██", Ghost == "░░"
// ModeASCII: Block == "[]", Ghost == "··"
// every mode: all three glyphs are exactly 2 columns wide (lipgloss.Width)

func TestPieceColorsAreDistinct(t *testing.T)
// in each mode, the seven locked foreground colors are pairwise different

func TestActiveIsDistinctFromLocked(t *testing.T)
// ModeFull and ModeReduced: Piece(k, true) foreground differs from Piece(k, false)
// ModeASCII: same foreground, but Piece(k, true) is bold and Piece(k, false) is not

func TestBorderPhaseCycles(t *testing.T)
// Border(0.0) and Border(1.0) render the same color (the ramp wraps)
// Border(0.0) and Border(0.5) differ
// phase values 0, 0.25, 0.5, 0.75, 0.999 and -0.3 and 7.2 all return a usable style
//   (phase is normalized, never indexes out of range)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -v`
Expected: FAIL — `undefined: GlyphsFor`.

- [ ] **Step 3: Implement the palette and the `Scene` types**

Hold the three per-mode color tables as `[7]string` arrays indexed by `game.PieceKind`. `Border` normalizes phase with `math.Mod` then interpolates in RGB for `ModeFull`.

- [ ] **Step 4: Run the tests**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render
git commit -m "feat(render): neon palette, per-mode glyphs, and the Scene contract"
```
