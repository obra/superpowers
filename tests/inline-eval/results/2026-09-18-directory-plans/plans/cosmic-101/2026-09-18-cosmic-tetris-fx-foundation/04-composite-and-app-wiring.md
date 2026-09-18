### Task 4: Compositing FX into the frame, and wiring FX into the app

**Files:**
- Create: `internal/render/composite.go`
- Create: `internal/render/starfield.go`
- Modify: `internal/render/render.go` (`Scene.FX` field; pipeline steps 2 and 9 of §37)
- Modify: `internal/app/model.go`, `internal/app/update.go` (own the `fx.World`, feed it, resize it)
- Test: `internal/render/composite_test.go`
- Test: `internal/app/fx_test.go`

**Interfaces:**
- Consumes: `fx.World`, `fx.Star`, `fx.Particle`, `fx.Layer` (Tasks 1–3); `Scene`, `Palette`, `Render` (plan 2); `Layout` (plan 2 Task 3).
- Produces:
```go
// composite.go
type mark struct {
    X, Y      int
    Text      string   // 1 or 2 columns
    Style     lipgloss.Style
    OverPrint bool     // false (default): only draw where the frame is blank
}
func composite(frame string, marks []mark) string
// Replaces the columns [X, X+lipgloss.Width(Text)) of line Y.
// Marks outside the frame, or partially outside it, are dropped whole.
// With OverPrint false, a mark whose target span contains any non-space rune is dropped.
// The returned frame has the same line count and the same width as the input.

func asciiFold(r rune) rune
// ModeASCII mapping for FX glyphs: · ˚ ✦ ✧ → . . * +   ░ ▒ ▓ █ → : ; = #
// runes already ASCII are returned unchanged

// starfield.go
func starMarks(s Scene, p Palette, l Layout) []mark      // skips the board box columns/rows entirely
func particleMarks(s Scene, p Palette) []mark

// render.go
type Scene struct {
    // ... plan 2 fields ...
    FX *fx.World   // nil with --no-fx; every FX step must check it
}
```

`Render` gains two FX steps and nothing else changes: `starMarks` composites before the panels are drawn (§37 step 2 — implemented by compositing after, restricted to blank cells, which is visually identical and cannot corrupt the board), and `particleMarks` composites after the panels (§37 step 9). Both are skipped when `s.FX == nil` or `!s.Opts.FX`.

Stars never draw inside the board box: `starMarks` filters out any mark whose column falls in `[l.BoardLeft, l.BoardLeft+l.BoardWidth)` on a board row (§15's readability rule, enforced structurally rather than by tuning density).

App wiring: `Model` gains `FX *fx.World`, created in `New` as `fx.NewWorld(cfg.Seed+1, fx.Config{Enabled: cfg.FX, ReducedMotion: cfg.ReducedMotion})` and left `nil` when `!cfg.FX`. `handleFrame` calls `FX.Observe(events, snapshot)` with the events `Game.Advance` and `Game.Apply` returned, then `FX.Step(dt)` — or `FX.StepPaused(dt)` when paused. `handleKey` collects the events from `Game.Apply` and passes them to `Observe` in the same call. A window-size message calls `FX.Resize`.

- [ ] **Step 1: Write the failing test**

`internal/render/composite_test.go`:

```go
func TestCompositeWritesOverBlank(t *testing.T)
// frame of 3 lines × 10 spaces; mark{X: 2, Y: 1, Text: "✦"}
// line 1 has ✦ at column 2; all other cells unchanged; still 3 lines × 10 columns

func TestCompositeSkipsNonBlankByDefault(t *testing.T)
// frame line 1 is "██████████"; mark{X: 2, Y: 1, Text: "✦"} is dropped
// the same mark with OverPrint: true replaces it

func TestCompositeDropsOutOfRange(t *testing.T)
// marks at Y: -1, Y: 99, X: -1, X: 9 with 2-column text (partially outside)
// all dropped; frame is byte-identical to the input

func TestCompositePreservesSizeWithStyles(t *testing.T)
// a styled frame (real Render output at 80×30) plus 50 styled marks
// stripANSI of the result is 30 lines of exactly 80 columns

func TestStarsNeverEnterTheBoard(t *testing.T)   // Review Focus
// a world with 400 stars on an 80×30 viewport; l := Compute(80,30)
// no mark from starMarks has X within [l.BoardLeft, l.BoardLeft+l.BoardWidth)
//   on any line the board box occupies

func TestParticleMarksClip(t *testing.T)   // Review Focus
// particles at (-3.7, -2.2), (1000, 1000), (0.4, 0.4) on a 1×1 scene
// particleMarks returns only marks inside the frame, and Render does not panic

func TestRenderWithNilFX(t *testing.T)   // Review Focus
// Scene with FX == nil and Opts.FX == false: Render returns the plan-2 frame
//   (byte-identical to the "wide" golden) and does not panic
// Scene with FX == nil but Opts.FX == true: also does not panic

func TestASCIIFoldsFXGlyphs(t *testing.T)
// ModeASCII: every mark's Text contains only ASCII bytes
```

`internal/app/fx_test.go`:

```go
func TestModelFeedsEventsToFX(t *testing.T)
// m := New(Config{Seed: 1, FX: true}); m.handleKey("space")   // hard drop
// m.FX.Snap().Score equals m.Game.Score  (Observe ran with a current snapshot)

func TestModelNilFXWithNoFXFlag(t *testing.T)
// New(Config{Seed: 1, FX: false}).FX == nil
// handleKey and handleFrame run without panicking, and View() returns a frame

func TestPausedUsesStepPaused(t *testing.T)
// m.handleKey("p"); emit a particle into m.FX; m.handleFrame(+500ms)
// the particle is unchanged (gameplay particles frozen, §30)

func TestResizeResizesFX(t *testing.T)
// deliver a window-size message of 100×40; m.FX star population reflects that viewport
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -run TestComposite -v`
Expected: FAIL — `undefined: composite`.

- [ ] **Step 3: Implement `composite.go`, `starfield.go`, the two `Render` steps, and the app wiring**

`composite` works on a `[][]rune`-free basis: split the frame into lines once, and for each line build the replacement with `lipgloss.Width`-aware slicing so styled spans are not cut mid-escape. Marks are applied in slice order.

- [ ] **Step 4: Run the tests**

Run: `go test ./... && go vet ./...`
Expected: PASS, clean. The plan-2 goldens must still pass unchanged — the FX-free frame is byte-identical.

- [ ] **Step 5: Watch the universe move**

Run: `go run ./cmd/cosmic-tetris --seed 1234`. Stars drift downward behind the HUD, never inside the board, and the board stays perfectly readable. Then `go run ./cmd/cosmic-tetris --no-fx` — a clean, still game with no stars and no crash.

- [ ] **Step 6: Commit**

```bash
git add internal/render internal/app
git commit -m "feat(render): additive FX compositing, starfield background, app FX wiring"
```
