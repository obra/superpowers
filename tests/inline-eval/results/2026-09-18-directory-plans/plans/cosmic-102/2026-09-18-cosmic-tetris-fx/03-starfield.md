### Task 3: Starfield, pause, intensity, and the render seam

**Files:**
- Create: `internal/fx/starfield.go`
- Create: `internal/render/fxdraw.go`
- Modify: `internal/render/render.go` (add `Frame.FX`, draw the starfield first)
- Modify: `internal/app/model.go`, `internal/app/update.go` (own an `fx.World`)
- Modify: `cmd/cosmic-tetris/main.go` (build the world from flags)
- Test: `internal/fx/starfield_test.go`
- Test: `internal/render/fxdraw_test.go`

**Interfaces:**
- Consumes: `World`, `Config` (Task 1); `Canvas`, `Layout`, `Options`,
  `render.Frame` (plan 2).
- Produces:
  ```go
  // fx
  type Star struct {
      X, Y       float64
      Depth      int      // 0 far, 1 mid, 2 near
      Glyph      rune
      Brightness float64
  }
  func (w *World) Stars() []Star
  func (w *World) StarSpeedScale() float64   // 1.0 at level 1, rising with level
                                             // (§15) and with hyperdrive (Task 8)

  // Pause (§30) and small-terminal reduction (§31) are world-level modulation,
  // so they live here rather than in each effect:
  func (w *World) SetPaused(paused bool)
  func (w *World) Intensity() float64   // 0..1 emission scale, from terminal area

  // render
  func DrawStarfield(c *Canvas, l Layout, w *fx.World, opt Options)
  // Frame gains: FX *fx.World   (nil-safe: a nil FX draws nothing)
  ```
  Pinned (§15): star counts scale with area — `far = area/120`, `mid = area/220`,
  `near = area/400`, where `area = width*height`. Base downward speeds in
  cells/sec: far `0.6`, mid `1.6`, near `3.4`. Level scaling:
  `StarSpeedScale = 1 + 0.06*(level-1)`, clamped at `2.5`. A star leaving the
  bottom respawns at a random column on row 0. Glyphs by depth: far `.`,
  mid `·`/`˚`, near `✦`/`✧`/`*` [ASCII: `.`, `.`/`+`, `*`].
  Brightness by depth: far `0.25`, mid `0.5`, near `0.9` — all strictly below the
  board's block brightness so §15's readability rule holds.

  Pause (§30): while paused, gameplay-related effects — particles, trails, line
  clears, shake, banners — do not advance, and no new ones are created; stars
  keep drifting at `0.25×` speed ("very slowly"). `Advance` still accumulates
  `Elapsed` so the border keeps its slow drift.

  Intensity (§31, "effects automatically reduce outside the board"): `Intensity`
  is `1.0` at `area >= 2400` (80×30), falling linearly to `0.4` at the 40×24
  minimum (`area 960`). Every later task's emission count is multiplied by it and
  rounded up to at least 1, so a small terminal stays legible without losing an
  effect entirely.

- [ ] **Step 1: Write the failing tests in `internal/fx/starfield_test.go`**

```go
func TestStarsPopulateOnResize(t *testing.T)
// Resize(80,24): Stars() non-empty, all within bounds, all three depths present

func TestStarCountScalesWithArea(t *testing.T)
// Resize(160,48) yields roughly 4× the stars of Resize(80,24) (±20%)

func TestStarsDriftDownward(t *testing.T)
// after Advance(500ms) every star's Y increased, and near stars moved
// strictly further than far stars

func TestStarsWrapToTheTop(t *testing.T)
// Advance(30s): every star is still in bounds, count unchanged

func TestHigherLevelMakesStarsFaster(t *testing.T)   // §15
// Observe(snapshot with Level 1) vs Level 10: StarSpeedScale rises,
// and the same dt moves stars further at level 10; scale clamps at 2.5
// for level 40

func TestStarBrightnessStaysBelowBoardBrightness(t *testing.T)
// every star's Brightness <= 0.9

func TestResizeMidFlightKeepsStarsInBounds(t *testing.T)
// Resize(120,40), Advance(2s), Resize(45,24), Advance(16ms):
// every star is within the new bounds; no panic

func TestASCIIStarsAreASCII(t *testing.T)
// Config{ASCII:true}: every star glyph < 128

func TestDisabledWorldHasNoStars(t *testing.T)

func TestStarfieldIsDeterministicPerSeed(t *testing.T)

func TestPauseFreezesGameplayEffectsButNotStars(t *testing.T)   // §30
// emit particles, add trails, SetPaused(true), Advance(1s):
// particle and trail positions/lives are unchanged, no particle died,
// but stars moved — by roughly a quarter of their unpaused distance

func TestPausedWorldCreatesNoNewGameplayEffects(t *testing.T)
// paused: Observe(PieceMoved / LinesCleared / PieceHardDropped) adds no
// trails, no particles, and leaves Shake() at (0,0)

func TestUnpauseResumesWithoutACatchUpBurst(t *testing.T)
// SetPaused(false) then Advance(16ms): particles move one frame's worth,
// not one second's

func TestIntensityScalesWithTerminalArea(t *testing.T)   // §31
// Resize(80,30) -> 1.0; Resize(40,24) -> 0.4 (±0.01); Resize(200,60) -> 1.0;
// Intensity is monotonically non-decreasing in area and never below 0.4

func TestIntensityReducesEmissionButNeverToZero(t *testing.T)
// the same burst at 40x24 emits fewer particles than at 80x30, and at least 1
```

- [ ] **Step 2: Write the failing render tests in `internal/render/fxdraw_test.go`**

```go
func TestDrawStarfieldPlacesGlyphs(t *testing.T)
// a world resized to 80x30 after Advance: the canvas contains at least one
// star glyph, all inside the canvas

func TestStarfieldNeverDrawsInsideTheBoardBox(t *testing.T)   // §15 readability
// after DrawStarfield, every cell strictly inside the board border is blank

func TestNilFXRendersLikePlanTwo(t *testing.T)
// Render(Frame{FX: nil, ...}) equals the plan-2 golden for the wide layout

func TestStarfieldClipsAtCanvasEdges(t *testing.T)
// a world sized 200x60 drawn onto a 40x24 canvas does not panic and writes
// nothing out of range
```

- [ ] **Step 3: Run both test files to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run 'Star|FX' -v`
Expected: build failure — `undefined: Stars`.

- [ ] **Step 4: Implement `starfield.go`, `SetPaused`, `Intensity`, and `DrawStarfield`**

Put the paused check at the top of `World.Advance`, before the per-effect
updates, so every effect Tasks 5–12 add is frozen by construction rather than by
each one remembering to check. `Intensity` is derived from the size set by
`Resize`, and the emitters from Task 2 apply it.

Stars live in one reused slice, rebuilt only on resize. `DrawStarfield` skips
cells inside the board box (use `l.BoardX/BoardY` and `BoardBoxW/H`) and maps
brightness to `Paint{FG: …, Faint: brightness < 0.4}`.

- [ ] **Step 5: Wire the world into the app and the CLI**

`app.Model` gains `FX *fx.World` and `NewModel` becomes
`NewModel(g *game.Game, w *fx.World, opts render.Options) Model`; `advance` calls
`m.FX.Observe(events, fx.SnapshotOf(m.Game))` then `m.FX.Advance(dt)`,
`WindowSizeMsg` calls `m.FX.Resize`, the pause key calls `m.FX.SetPaused`, and
`View` passes the world in `Frame.FX`.
`main.go` builds `fx.NewWorld(cfg.Seed^0x5FC0FFEE, fx.Config{Enabled: !cfg.NoFX,
ReducedMotion: cfg.ReducedMotion, ASCII: cfg.Mode == render.ModeASCII})` — a
derived-but-distinct seed, never the game's `*rand.Rand` (§49.6).

- [ ] **Step 6: Run the tests and look at it**

Run: `go test ./... && go build ./cmd/... && ./cosmic-tetris --seed 1`
Expected: tests pass, and there is a drifting starfield behind the board that
never intrudes on it. Confirm the stars speed up as the level rises.

- [ ] **Step 7: Commit**

```bash
git add internal/fx/starfield.go internal/fx/starfield_test.go internal/render/ internal/app/ cmd/
git commit -m "feat(fx): three-layer starfield and the render/app FX seam"
```
