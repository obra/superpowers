# Cosmic Tetris — Cosmic Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the working game an irresponsible special-effects budget — starfield, animated border, piece trails, particle physics, hard-drop impact, supernova line clears, shockwaves, hyperdrive, the four-line spectacle, mission-control commentary, the boot sequence and the game-over black hole — without any of it touching game state or delaying input.

**Architecture:** Two new packages sit between the engine and the renderer. `internal/flavor` is pure text selection: it turns a `game.Event` plus a `game.Snapshot` into a string. `internal/fx` is an independent simulation: `World.Handle(events, snapshot)` observes, `World.Advance(dt)` steps, and it holds its own `*rand.Rand` that never touches the game's. `World.Handle` takes a `game.Snapshot` **by value**, which is what structurally guarantees §14's rule that effects can never modify `GameState`. `internal/render` grows a set of draw functions that read `*fx.World` and composite onto the same `lipgloss.Canvas`. Dependency direction stays `app → render → fx → flavor → game`.

**Tech Stack:** Go 1.26, `charm.land/lipgloss/v2` (canvas cell writes, colour blending), `charm.land/bubbles/v2/spinner` (boot), `math/rand` (a second, independent generator).

**Spec:** `design.md` (§14–§25, §27, §28, §29, §42 Phases 3–5, §43, §44, §45, §49.5)

## Global Constraints

- `internal/fx` must not import `internal/render` or `internal/app`, and must not hold a `*game.Game` — only `game.Event` values and `game.Snapshot` values (§14).
- The FX generator is created as `rand.New(rand.NewSource(seed ^ 0x5DEECE66D))` so it is reproducible for tests yet provably distinct from the game's `rand.NewSource(seed)`. It drives particles, star placement and flavor selection and nothing else (§35, §49.6).
- Effects never change piece order, score, gravity or collision. The engine's public surface is read-only from `fx` and `render`.
- Screen shake never exceeds one terminal cell in any direction (§44).
- FX writes into the board interior only where the destination cell is blank, so locked blocks, the ghost and the active piece are never obscured (§44). The single exception is the line-clear band, which by design draws over the rows it is destroying.
- `--reduced-motion` (§49.5) suppresses screen shake, hyperdrive acceleration and shockwaves. Colour, trails, particles, banners and mission control are untouched.
- `--no-fx` sets `render.Input.FX` to nil. A nil `FX` must produce output byte-identical to the goldens recorded in the terminal plan.
- Particle count is capped at `MaxParticles = 400` (§38). No goroutine per particle or per frame.
- Test command for this plan: `go test ./...`.

## Review Focus

1. A particle whose float position rounds outside the board rectangle must be culled, never written out of bounds — Task 3 and Task 4.
2. The worst-case simultaneous load (four-line clear, combo 7, shockwave, trails) must stay under the particle cap and still render — Task 9.
3. Every effect at the 40 × 24 minimum must reduce outside the board and leave the board fully readable — Task 12.
4. `--reduced-motion` during a four-line clear must produce zero shake offset, a hyperdrive multiplier of exactly 1, and no rings — Task 12.
5. Pausing mid-animation must freeze gameplay particles while stars keep drifting, and resuming must not replay the frozen interval as a burst — Task 12.

## Plan Set

Run in this order. A ruling that changes a name, signature, or value that a later plan consumes must be applied to that plan's document before the next task starts.

1. `plans/2026-09-18-cosmic-tetris-engine.md` — headless deterministic game engine. Consumes: nothing.
2. `plans/2026-09-18-cosmic-tetris-terminal.md` — Bubble Tea app, renderer, layout, HUD, overlays, CLI. Consumes: the `internal/game` public API.
3. `plans/2026-09-18-cosmic-tetris-effects.md` (this plan) — all effects. Consumes: `render.Input`, `render.Theme`, `render.Layout`, `render.Frame`, `render.BoardPanel`, `app.Model`, `app.FrameMsg`, `app.Options`, `game.Event`, `game.Snapshot`.

---

### Task 1: Flavor text

**Files:**
- Create: `internal/flavor/messages.go`
- Test: `internal/flavor/messages_test.go`

**Interfaces:**
- Consumes: `game.Event`, `game.EventKind`, `game.Snapshot`, `game.Piece`, `game.PieceKind`.
- Produces:
  ```go
  // Priority levels; a higher-priority message preempts a lower one on screen.
  const (
      PriAmbient = 0 // idle chatter
      PriRoutine = 1 // locks, spawns
      PriSpecial = 2 // the §45 easter eggs
      PriEvent   = 3 // level change, combo
      PriMajor   = 4 // four-line clear, game over
  )

  // Mission picks a mission-control line for an event. ok is false when the
  // event deserves no commentary.
  func Mission(e game.Event, s game.Snapshot, rng *rand.Rand) (text string, priority int, ok bool)

  func FourLineBanner(rng *rand.Rand) string // one of the four §20 banners
  func ComboLine(combo int, rng *rand.Rand) string // "COMBO 5 // ..." for combo >= 5, else ""
  func LevelSubtitle(rng *rand.Rand) string // one of the three §22 subtitles
  func Idle(rng *rand.Rand) string // "CAPTAIN?" and friends
  func Rare(rng *rand.Rand) (string, bool) // 1-in-200: "DID YOU KNOW YOU'RE IN A TERMINAL?"
  ```

All copy comes verbatim from §20, §21, §22, §27 and §45 — the nine mission-control lines, the four four-line banners, the three combo lines, the three level subtitles, and the §45 specials. Pinned special cases, each at `PriSpecial`:

```text
PieceHardDropped with a vertical I (Kind KindI, Rotation 1 or 3)  -> "KINETIC ROD DEPLOYED"
HoldUsed with an O piece                                          -> "CUBE ADJACENT OBJECT SECURED"
LinesCleared where Snapshot.Score crossed a power of ten          -> "NUMBER BECAME BIGGER"
```

- [ ] **Step 1: Write the failing tests**

```go
func TestMissionReturnsCommentaryForEveryEventKind(t *testing.T) {
	// for each game.EventKind: Mission never panics; when ok is true the text is
	// non-empty and the priority is in PriAmbient..PriMajor
}

func TestMissionIsSilentForMovementAndRotation(t *testing.T) {
	// PieceMoved and PieceRotated return ok == false
	// (§27: "Do not rotate messages constantly")
}

func TestKineticRodForVerticalI(t *testing.T) {
	// Event{Kind: PieceHardDropped, Piece: Piece{Kind: KindI, Rotation: 1}}
	// -> "KINETIC ROD DEPLOYED" at PriSpecial
	// Rotation 0 (horizontal I) does not produce it
	// a KindT at Rotation 1 does not produce it
}

func TestCubeAdjacentForHeldO(t *testing.T) {
	// Event{Kind: HoldUsed, Piece: Piece{Kind: KindO}} -> "CUBE ADJACENT OBJECT SECURED"
}

func TestNumberBecameBiggerOnPowerOfTenCrossing(t *testing.T) {
	// LinesCleared with Snapshot{Score: 10000} -> "NUMBER BECAME BIGGER"
	// Snapshot{Score: 10345} -> not that message
}

func TestFourLineBannerIsAlwaysOneOfTheSpecBanners(t *testing.T) {
	// 200 draws all land in the §20 set of four
}

func TestComboLineStartsAtFive(t *testing.T) {
	// ComboLine(4, rng) == ""
	// ComboLine(5, rng) contains "COMBO 5"
	// ComboLine(9, rng) contains "COMBO 9" (wrapping the three-line pool)
}

func TestLevelSubtitleAndIdleAreNonEmpty(t *testing.T) {
	// 100 draws of each are non-empty
}

func TestRareFiresRoughlyOneInTwoHundred(t *testing.T) {
	// over 20000 draws from a seeded rng, the hit count is between 40 and 160
}

func TestSelectionIsDeterministicPerSeed(t *testing.T) {
	// two rngs from the same seed produce identical 100-draw sequences for
	// FourLineBanner, LevelSubtitle and Idle
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/flavor/ -v`
Expected: FAIL — package does not exist.

- [ ] **Step 3: Implement `internal/flavor/messages.go`**

Copy every string from the spec exactly, including punctuation, the `*` footnote on `LOCAL UNIVERSE STABLE*`, and the `//` in the combo lines.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/flavor/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/flavor/
git commit -m "feat: mission-control, banner and combo flavor text"
```

---

### Task 2: FX world, starfield, and the app clock hookup

**Files:**
- Create: `internal/fx/world.go`, `internal/fx/starfield.go`, `internal/fx/events.go`
- Modify: `internal/app/model.go`, `internal/app/update.go` (own a `*fx.World`, drive it from `FrameMsg`)
- Test: `internal/fx/world_test.go`, `internal/fx/starfield_test.go`, `internal/app/fxclock_test.go`

**Interfaces:**
- Consumes: `game.Event`, `game.Snapshot` (Task 1's package is consumed from Task 6 onward).
- Produces:
  ```go
  type Options struct {
      Seed          int64
      ReducedMotion bool
  }

  type World struct {
      Stars   []Star
      Elapsed time.Duration
      // later tasks add Particles, Trails, Rings, Clears, Shake, Hyper,
      // Banner, Level, Mission, Collapse
  }

  func NewWorld(o Options) *World

  // Resize tells the world the terminal size (stars fill it) and the board's
  // interior rectangle in terminal cells (gameplay effects live inside it).
  func (w *World) Resize(termW, termH int, board image.Rectangle)

  func (w *World) Handle(evs []game.Event, s game.Snapshot)

  // Advance steps the world. When gameplay is false (paused, help open),
  // only the background starfield and Elapsed move — §30 pins that background
  // stars keep drifting while gameplay-related effects freeze. Task 12 relies on
  // this parameter; every test in this plan passes true unless it is testing
  // pause behaviour.
  func (w *World) Advance(dt time.Duration, gameplay bool)

  func (w *World) ReducedMotion() bool

  type Star struct {
      X, Y  float64
      VY    float64
      VX    float64 // non-zero only for the §45 shooting star
      Layer int     // 0 far, 1 mid, 2 near, 3 shooting star
      Glyph rune
      Life  float64 // seconds; only the shooting-star layer expires
  }
  ```

`app.Model` gains `FX *fx.World`, nil when `Options.NoFX`. `app.New` builds it with `fx.Options{Seed: opts.Seed, ReducedMotion: opts.ReducedMotion}`. `tea.WindowSizeMsg` calls `FX.Resize(w, h, m.Layout.BoardRect())` — `BoardRect` arrives in Task 4, so until then pass `image.Rectangle{}`. `FrameMsg` calls, in this order: `evs := m.Game.Advance(dt)` (only when playing), `m.FX.Handle(evs, m.Game.Snapshot())`, `m.FX.Advance(dt, m.State == StatePlaying)`.

Pinned starfield values (§15):

```text
density per layer (stars = termW*termH / divisor):
  far  divisor 40   glyph pool ['.']              base VY 0.6 cells/sec
  mid  divisor 80   glyph pool ['·', '˚']         base VY 1.5 cells/sec
  near divisor 160  glyph pool ['✦', '✧', '*']    base VY 3.5 cells/sec

level speed scale: 1 + 0.05*(level-1), clamped to 2.5
stars drift downward; a star past the bottom wraps to a new random X at y = -1
```

The §45 shooting star is a fourth, transient layer: roughly once every 12 seconds of `Elapsed`, spawn one star at a random position on the top or left edge with `VX` of 14–22 and `VY` of 7–11 cells/sec and a `Life` of 0.6s, glyph cycling `✦ · ·`. Only one may exist at a time, so it stays occasional rather than becoming weather.

- [ ] **Step 1: Write the failing tests**

```go
func TestNewWorldUsesAnIndependentGenerator(t *testing.T) {
	// two NewWorld(Options{Seed: 5}) produce identical star slices after Resize
	// a World with Seed 5 and a game rng from rand.NewSource(5) drawing 100
	// Float64s produce different first values (the streams are not the same)
}

func TestHandleTakesASnapshotByValue(t *testing.T) {
	// compile-level guarantee, asserted as behaviour: mutating the Snapshot after
	// Handle returns changes nothing observable in the World
	// (this test exists to pin the signature; if Handle ever takes *game.Game it
	// will not compile)
}

func TestStarDensityScalesWithArea(t *testing.T) {
	// Resize(80, 30, board): len(Stars) == 80*30/40 + 80*30/80 + 80*30/160
	// Resize(40, 24, board): a smaller count, and all three layers present
}

func TestStarsStayInsideTheTerminal(t *testing.T) {
	// Resize(80, 30, ...), then 600 Advance(16ms) calls:
	// every star has 0 <= X < 80 and -1 <= Y < 30
}

func TestStarsDriftDownward(t *testing.T) {
	// record every star's Y, Advance(500ms), and assert that stars which did not
	// wrap have a larger Y
}

func TestHigherLevelsMoveStarsFaster(t *testing.T) {
	// two worlds from the same seed; feed one Handle with Snapshot{Level: 1} and
	// the other Snapshot{Level: 10}; after Advance(1s) the level-10 world's mean
	// star Y displacement is larger, and less than 2.5x the level-1 world's
}

func TestLevelSpeedScaleIsClamped(t *testing.T) {
	// Snapshot{Level: 100} produces the same displacement as Snapshot{Level: 31}
	// (both at the 2.5 clamp)
}

func TestAdvanceWithZeroDtChangesNothing(t *testing.T) {
	// Advance(0, true) leaves Stars and Elapsed untouched
}

func TestResizeToZeroDoesNotPanic(t *testing.T) {
	// Resize(0, 0, image.Rect(0,0,0,0)) then Advance(16ms, true):
	// no panic, no stars
}

func TestResizePreservesNothingButDoesNotLeak(t *testing.T) {
	// Resize(80,30,...) then Resize(40,24,...) yields the 40x24 count exactly
}

func TestShootingStarIsOccasionalAndSingular(t *testing.T) {
	// §45: over 120 seconds of Advance(16ms, true) the shooting-star layer is
	// populated between 5 and 20 times, never holds more than one star at once,
	// and every shooting star disappears within 1 second of appearing
}

func TestAppFrameMsgDrivesTheWorld(t *testing.T) {
	// app-level: after a WindowSizeMsg and two FrameMsgs 16ms apart,
	// m.FX.Elapsed is 16ms and the stars have moved
}

func TestAppPassesEventsToTheWorld(t *testing.T) {
	// app-level: a hard-drop key press followed by a FrameMsg reaches the world —
	// assert via m.FX.Elapsed advancing and, once Task 5 lands, via len(Trails) > 0
}

func TestNoFXModelHasNoWorld(t *testing.T) {
	// app.New(Options{NoFX: true}).FX == nil, and a FrameMsg does not panic
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -v`
Expected: FAIL — package does not exist.

- [ ] **Step 3: Implement `world.go`, `starfield.go`, `events.go` and the app hookup**

`events.go` holds the small `handle` dispatch table keyed on `game.EventKind` so later tasks add cases in one place. `World` keeps the last `game.Snapshot` it saw so `Advance` can scale star speed by level without re-reading the game.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ ./internal/app/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/ internal/app/
git commit -m "feat: fx world with an independent RNG, starfield and app clock hookup"
```

---

### Task 3: Particle simulation

**Files:**
- Create: `internal/fx/particle.go`
- Modify: `internal/fx/world.go` (add `Particles`, cap enforcement)
- Test: `internal/fx/particle_test.go`

**Interfaces:**
- Consumes: Task 2's `World`.
- Produces:
  ```go
  const (
      MaxParticles = 400
      Gravity      = 18.0   // cells/sec^2, downward
      Drag         = 0.35   // velocity multiplier per second
  )

  type Particle struct {
      X, Y       float64
      VX, VY     float64
      Life       float64 // seconds remaining
      MaxLife    float64
      Glyph      rune
      Brightness float64 // 0..1, derived as Life/MaxLife on each step
  }

  // Emit adds n particles at (x, y) with speeds in [minSpeed, maxSpeed] spread
  // over the given angle range, dropping the request when the cap is reached.
  func (w *World) Emit(spec EmitSpec)

  type EmitSpec struct {
      X, Y               float64
      Count              int
      MinSpeed, MaxSpeed float64
      AngleFrom, AngleTo float64 // radians; 0 is +X, pi/2 is +Y (downward)
      Glyphs             []rune
      MinLife, MaxLife   float64 // seconds
  }

  func (w *World) ParticleCount() int
  ```

Integration step, exactly §23's order:

```text
X += VX*dt;  Y += VY*dt
VY += Gravity*dt
VX *= pow(Drag, dt);  VY *= pow(Drag, dt)
Life -= dt
Brightness = Life / MaxLife
die when Life <= 0 or the position rounds outside the board rectangle
```

Default glyph pool (§18): `· * ✦ +`.

Task 12 scales every emitted count by `World.Intensity()`, which is 1.0 at 80 × 30 and above. Any test in this plan that asserts an exact or bounded particle count must `Resize(80, 30, ...)` first, so it keeps passing once that scaling lands.

- [ ] **Step 1: Write the failing tests**

```go
func TestEmitCreatesTheRequestedCount(t *testing.T) {
	// Emit with Count 12 -> ParticleCount() == 12
	// every particle's Life is within [MinLife, MaxLife] and Glyph is in Glyphs
}

func TestEmitRespectsTheAngleRange(t *testing.T) {
	// AngleFrom -pi, AngleTo 0 (upward half): every particle has VY <= 0
}

func TestParticlesDieWhenLifeRunsOut(t *testing.T) {
	// Emit with MaxLife 0.2; Advance(250ms) -> ParticleCount() == 0
}

func TestParticlesAreCulledOutsideTheBoard(t *testing.T) {
	// Review Focus #1
	// Resize(80, 30, image.Rect(10, 2, 30, 22)); Emit at the board's right edge
	// with a large +X velocity and MaxLife 5s; after Advance(500ms) every
	// surviving particle's rounded position is inside image.Rect(10,2,30,22)
}

func TestParticleCapIsEnforced(t *testing.T) {
	// ten Emit calls of Count 80 each -> ParticleCount() == MaxParticles
	// and Advance does not panic
}

func TestGravityAndDragActInTheSpecOrder(t *testing.T) {
	// a single particle at (5,5) with VX 10, VY 0, Life 1, stepped by Advance(1s):
	// X is greater than 5 but less than 15 (drag applied after the move)
	// VY is positive but less than Gravity (drag applied after gravity)
}

func TestBrightnessTracksRemainingLife(t *testing.T) {
	// MaxLife 1.0; after Advance(500ms) every Brightness is within 0.01 of 0.5
}

func TestEmitWithZeroCountIsANoOp(t *testing.T) {
	// Count 0 and Count -1 both leave ParticleCount() at 0 and do not panic
}

func TestEmitIsDeterministicPerSeed(t *testing.T) {
	// two worlds from the same seed, same Resize and same EmitSpec produce
	// identical Particles slices
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestEmit|TestParticle|TestGravity|TestBrightness' -v`
Expected: FAIL — undefined `Emit`.

- [ ] **Step 3: Implement `internal/fx/particle.go` and wire `Particles` into `Advance`**

Compact the slice in place with a write index rather than allocating a new slice each frame (§38: reusable slices).

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/
git commit -m "feat: capped terminal-space particle simulation"
```

---

### Task 4: FX compositing in the renderer

**Files:**
- Create: `internal/render/canvas.go`, `internal/render/fxdraw.go`
- Modify: `internal/render/render.go` (add `Input.FX`, call the draw functions at §37 steps 2, 6 and 9)
- Create: `internal/render/testdata/fx.golden`
- Test: `internal/render/canvas_test.go`, `internal/render/fxdraw_test.go`

**Interfaces:**
- Consumes: `fx.World`, `fx.Star`, `fx.Particle`, `render.Theme`, `render.Layout`.
- Produces:
  ```go
  // PlaceSparse writes one cell only when the destination is blank and inside
  // the canvas. It returns false when it declined, which is how §44's
  // "never obscure the active piece" rule is enforced mechanically.
  func PlaceSparse(c *lipgloss.Canvas, x, y int, glyph rune, fg color.Color) bool

  func drawStars(c *lipgloss.Canvas, w *fx.World, th Theme)
  func drawParticles(c *lipgloss.Canvas, w *fx.World, th Theme, board image.Rectangle)

  // BoardRect returns the board interior rectangle in terminal cells for a layout.
  func (l Layout) BoardRect() image.Rectangle
  ```

`Input` gains `FX *fx.World`. When it is nil, `Frame` skips every draw function and produces exactly what the terminal plan's goldens recorded. Star brightness maps to `th.Dim` (far), a blend of `th.Dim` and `th.Text` (mid), and `th.Text` (near); particle colour interpolates from `th.Accent` to `th.Dim` by `Brightness` using `lipgloss.Alpha`.

- [ ] **Step 1: Write the failing tests**

```go
func TestPlaceSparseWritesIntoBlankCells(t *testing.T) {
	// a fresh 10x5 canvas: PlaceSparse(c, 3, 2, '✦', red) returns true and
	// c.CellAt(3,2).Content == "✦"
}

func TestPlaceSparseRefusesOccupiedCells(t *testing.T) {
	// compose a layer containing "██" at (0,0), then PlaceSparse(c, 0, 0, '✦', red)
	// returns false and the cell content is unchanged
}

func TestPlaceSparseRefusesOutOfBounds(t *testing.T) {
	// Review Focus #1: (-1,0), (0,-1), (10,0), (0,5) on a 10x5 canvas all return
	// false and do not panic
}

func TestBoardRectMatchesTheBoardPanelInterior(t *testing.T) {
	// for Compute(80,30) and Compute(40,24): BoardRect().Dx() == game.Width*2
	// and BoardRect().Dy() == game.VisibleRows, positioned one cell inside the border
}

func TestParticlesNeverOverwriteBoardContent(t *testing.T) {
	// build a fixture with a partial stack and 400 particles saturating the board
	// rect; the stripped frame's board rows, sliced to the board columns, are
	// identical to ansi.Strip(BoardPanel(...)) for every cell that BoardPanel
	// filled with a block or ghost glyph
}

func TestNilFXReproducesTheTerminalGoldens(t *testing.T) {
	// Frame with FX nil at 80x30 equals testdata/wide.golden byte for byte
	// (the same assertion for medium, small and ascii)
}

func TestFrameWithFXGolden(t *testing.T) {
	// a world seeded at 8675309, Resize(80,30,board), advanced by 40 frames of
	// 16ms, composed into the standard fixture, compared to testdata/fx.golden
}

func TestFrameWithFXKeepsItsDimensions(t *testing.T) {
	// the FX frame at 80x30 is exactly 30 lines, none wider than 80
}

func TestStarsDoNotDrawInsideTheBoard(t *testing.T) {
	// §15 "there should always be space behind/around the game" plus §44:
	// stars whose position falls inside BoardRect() are skipped, so the board's
	// empty interior in the stripped frame contains no star glyphs
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestPlaceSparse|TestBoardRect|TestParticlesNever|TestNilFX|TestFrameWithFX|TestStarsDoNot' -v`
Expected: FAIL — undefined `PlaceSparse`.

- [ ] **Step 3: Implement `canvas.go`, `fxdraw.go` and the `Frame` integration**

Draw order inside `Frame`: stars first (behind everything, outside `BoardRect`), then the board panel and HUD, then particles into the board rect via `PlaceSparse` (§37 step 6), then global FX outside the board (§37 step 9).

- [ ] **Step 4: Record the new golden and confirm the old ones still hold**

Run: `go test ./internal/render/ -run TestFrameWithFXGolden -update`
Then run the whole package without `-update`. `TestNilFXReproducesTheTerminalGoldens` must pass without regenerating anything — if it fails, the FX integration changed the base frame and that is a bug, not a golden to re-record.

- [ ] **Step 5: Run the suite**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add internal/render/
git commit -m "feat: composite starfield and particles without touching board cells"
```

---

### Task 5: Animated board border, piece trails, quantum storage

**Files:**
- Create: `internal/fx/trail.go`
- Modify: `internal/fx/world.go`, `internal/render/board.go`, `internal/render/fxdraw.go`, `internal/render/render.go`
- Test: `internal/fx/trail_test.go`, `internal/fx/hold_test.go`, `internal/render/border_test.go`

**Interfaces:**
- Consumes: Tasks 2–4.
- Produces:
  ```go
  // fx
  const (
      TrailLife  = 140 * time.Millisecond // §17: ~100-160ms
      TrailSteps = 4
  )

  type Trail struct {
      Cells   []game.Point // board cells the piece occupied, in board coordinates
      Kind    game.PieceKind
      Elapsed time.Duration
  }

  func (t Trail) Step() int  // 0..TrailSteps-1, or TrailSteps when expired

  // render
  // BorderColor cycles th.Border over CycleNormal, shortening toward CycleHot
  // and brightening as energy rises. energy is 0..1.
  func BorderColor(th Theme, elapsed time.Duration, energy float64) color.Color

  const (
      CycleNormal = 12 * time.Second
      CycleHot    = 1500 * time.Millisecond
  )

  // Energy maps the §25 "energy state" from the snapshot: combo and level.
  func Energy(s game.Snapshot) float64

  func drawTrails(c *lipgloss.Canvas, w *fx.World, th Theme, board image.Rectangle)

  // TrailGlyphs returns the per-step glyph for a mode.
  // full/reduced: "██" "▓▓" "▒▒" "░░"   ASCII: "[]" "::" ".." "  "
  func (g Glyphs) Trail(step int) string

  // QUANTUM STORAGE (§9): the outgoing held piece compresses, streaks sideways
  // and vanishes while the incoming piece flashes in. Gameplay never waits on it.
  const HoldStreakLife = 120 * time.Millisecond

  type HoldStreak struct {
      Out     game.PieceKind // the piece leaving for the hold slot
      In      game.PieceKind // the piece arriving on the board
      Cells   []game.Point   // where the outgoing piece was, board coordinates
      Elapsed time.Duration
  }

  // Squeeze returns the horizontal compression (1 at the start, 0 at the end)
  // and the sideways streak offset in cells, toward the HOLD panel.
  func (h HoldStreak) Squeeze() (scale float64, offset int)
  func (h HoldStreak) InFlash() float64 // 0..1 brightness boost on the incoming piece

  func drawHoldStreak(c *lipgloss.Canvas, w *fx.World, th Theme, board image.Rectangle)
  ```

`World.Handle` pushes a `Trail` for every `PieceMoved`, `PieceRotated` and `PieceHardDropped` event, recording the cells the piece left. A `PieceHardDropped` event pushes one trail per row crossed, which is §17's "stronger vertical trail". A `HoldUsed` event pushes a `HoldStreak` for `HoldStreakLife`.

- [ ] **Step 1: Write the failing tests**

```go
func TestTrailStepAdvancesAndExpires(t *testing.T) {
	// Trail{Elapsed: 0}.Step() == 0
	// Elapsed at TrailLife/4 -> 1; at TrailLife/2 -> 2; at 3*TrailLife/4 -> 3
	// Elapsed at TrailLife -> TrailSteps (expired)
}

func TestMovementPushesATrail(t *testing.T) {
	// Handle([]game.Event{{Kind: PieceMoved, Piece: p}}, snap) -> one Trail
	// whose Cells match p.Cells() translated into board-interior coordinates
}

func TestExpiredTrailsAreRemoved(t *testing.T) {
	// after Handle and Advance(TrailLife + 10ms), len(w.Trails) == 0
}

func TestHardDropPushesOneTrailPerRowCrossed(t *testing.T) {
	// Event{Kind: PieceHardDropped, Value: 7} -> 7 trails
	// Value 0 -> no trails
}

func TestTrailGlyphsPerMode(t *testing.T) {
	// ModeFull: steps 0..3 are "██" "▓▓" "▒▒" "░░"
	// ModeASCII: steps 0..3 are "[]" "::" ".." "  "
	// every glyph is exactly 2 columns wide
	// step TrailSteps and step -1 return the blank glyph, not a panic
}

func TestTrailsDoNotOverwriteTheActivePiece(t *testing.T) {
	// a trail placed on the active piece's current cells leaves the stripped
	// board rows identical to BoardPanel's (PlaceSparse declines)
}

func TestBorderColorCyclesThroughTheStops(t *testing.T) {
	// BorderColor(th, 0, 0) equals BorderColor(th, CycleNormal, 0)
	// sampling 60 points across one cycle visits at least 4 distinct colours
}

func TestBorderColorSpeedsUpWithEnergy(t *testing.T) {
	// the number of distinct colours sampled over a fixed 1.5s window is
	// strictly greater at energy 1.0 than at energy 0.0
}

func TestEnergyRisesWithComboAndLevel(t *testing.T) {
	// Energy(Snapshot{}) == 0
	// Energy(Snapshot{Combo: 7, Level: 20}) == 1
	// Energy is monotonically non-decreasing in both Combo and Level
}

func TestASCIIBorderDoesNotAnimateColors(t *testing.T) {
	// with a single-stop Border slice, BorderColor returns that stop for every
	// elapsed value (no index-out-of-range on a one-element palette)
}

func TestHoldUsedPushesAQuantumStorageStreak(t *testing.T) {
	// §9: Handle([]game.Event{{Kind: HoldUsed, Piece: p}}, snap) yields one
	// HoldStreak whose Out is p.Kind and whose Cells match p.Cells()
}

func TestHoldStreakCompressesAndStreaksSideways(t *testing.T) {
	// §9 "compressed -> streaked sideways -> disappear":
	// Squeeze() at Elapsed 0 is (1.0, 0)
	// scale decreases monotonically to 0 across HoldStreakLife
	// |offset| increases monotonically and is negative (toward the HOLD panel)
}

func TestHoldStreakExpiresInOneHundredTwentyMilliseconds(t *testing.T) {
	// after Advance(HoldStreakLife + 10ms, true), len(w.HoldStreaks) == 0
}

func TestIncomingPieceFlashes(t *testing.T) {
	// InFlash() is near 1 at Elapsed 0 and 0 at HoldStreakLife
}

func TestHoldDoesNotStallGameplay(t *testing.T) {
	// §9 "Gameplay does not wait for the animation": app-level, press c then
	// immediately press left in the same batch of Updates — the new active piece
	// moves without waiting out HoldStreakLife
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run 'TestTrail|TestMovementPushes|TestExpired|TestHardDropPushes|TestBorderColor|TestEnergy|TestASCIIBorder' -v`
Expected: FAIL

- [ ] **Step 3: Implement the trail and hold-streak types, the border gradient, and the draw wiring**

Use `lipgloss.Blend1D` over `th.Border` to build a lookup table once per theme rather than blending every frame (§38). Both trails and hold streaks draw through `PlaceSparse`, so neither can cover the active piece.

- [ ] **Step 4: Refresh the FX golden and read it**

Run: `go test ./internal/render/ -run TestFrameWithFXGolden -update`
Read `testdata/fx.golden` and confirm trails appear as a short fading tail and the board border is intact. Confirm `TestNilFXReproducesTheTerminalGoldens` still passes.

- [ ] **Step 5: Run the suite**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add internal/fx/ internal/render/
git commit -m "feat: energy-reactive border gradient and ion piece trails"
```

---

### Task 6: Mission control channel

**Files:**
- Create: `internal/fx/mission.go`
- Modify: `internal/fx/world.go`, `internal/app/update.go` (feed `Mission` into `render.Input`)
- Test: `internal/fx/mission_test.go`

**Interfaces:**
- Consumes: `flavor.Mission`, `flavor.Idle`, `flavor.Rare` (Task 1).
- Produces:
  ```go
  const (
      MissionHold = 2500 * time.Millisecond // §27: give them time to breathe
      IdlePrompt  = 20 * time.Second        // §45: long idle before first move
  )

  type Mission struct {
      Text     string
      Priority int
      Hold     time.Duration // time remaining before an equal-priority line may replace this one
      Idle     time.Duration // time since the last player input
  }

  func (w *World) MissionText() string
  func (w *World) NoteInput() // called by app on any gameplay key press, resets Idle
  ```

Replacement rule: a candidate line replaces the current one when `Hold <= 0`, or when its priority is strictly higher than the current priority. Otherwise it is dropped — messages are not queued (§27: "Do not rotate messages constantly").

- [ ] **Step 1: Write the failing tests**

```go
func TestMissionStartsWithADefaultLine(t *testing.T) {
	// a fresh world's MissionText() is non-empty (the §27 "NOMINALISH" opener)
}

func TestEqualPriorityLineDoesNotPreemptWithinTheHold(t *testing.T) {
	// Handle a PriRoutine event; text := MissionText()
	// Advance(1s); Handle another PriRoutine event -> MissionText() == text
	// Advance(1.6s) (past MissionHold); Handle again -> the text may change
}

func TestHigherPriorityLinePreemptsImmediately(t *testing.T) {
	// Handle a PriRoutine event; Advance(100ms)
	// Handle a LinesCleared-of-four event (PriMajor) -> MissionText() changed
}

func TestLowerPriorityLineIsDroppedNotQueued(t *testing.T) {
	// Handle PriMajor; Advance(100ms); Handle PriRoutine -> text unchanged
	// Advance(3s) -> the text is still the PriMajor line (nothing was queued)
}

func TestIdlePromptAfterTwentySeconds(t *testing.T) {
	// a fresh world advanced by 21s in 100ms steps eventually shows a line from
	// flavor.Idle; NoteInput() before 20s resets the timer so it does not fire
}

func TestNoteInputResetsIdle(t *testing.T) {
	// Advance(19s); NoteInput(); Advance(19s) -> the idle line has not fired
}

func TestMissionTextIsNeverEmptyAfterAnyEventSequence(t *testing.T) {
	// feed one of every game.EventKind in turn with Advance(3s) between:
	// MissionText() is non-empty at every point
}

func TestMissionIsDeterministicPerSeed(t *testing.T) {
	// two worlds from the same seed fed the same event/dt script produce the
	// same MissionText() at every step
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run TestMission -v`
Expected: FAIL

- [ ] **Step 3: Implement `mission.go` and wire it into `app`**

`app.Model.View` reads `m.FX.MissionText()` into `render.Input.Mission`; the key handler calls `m.FX.NoteInput()` for gameplay keys only (not pause, help or quit).

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/ internal/app/
git commit -m "feat: mission-control channel with hold time and priority preemption"
```

---

### Task 7: Hard-drop impact — shake, debris, border flash

**Files:**
- Create: `internal/fx/shake.go`
- Modify: `internal/fx/world.go`, `internal/render/render.go`, `internal/render/fxdraw.go`
- Test: `internal/fx/shake_test.go`, `internal/render/shake_test.go`

**Interfaces:**
- Consumes: Tasks 2–5.
- Produces:
  ```go
  const (
      ShakeDuration = 80 * time.Millisecond // §18
      ShakeSteps    = 5
      FlashDuration = 120 * time.Millisecond
  )

  type Shake struct {
      Elapsed, Total time.Duration
      Amp            int // 1 for a hard drop, 2 requested for a four-line clear but clamped to 1
  }

  // Offset returns the deterministic §18 pattern, or (0,0) when the world is in
  // reduced-motion mode or the shake has expired. Neither component ever
  // exceeds 1 in absolute value (§44).
  func (w *World) ShakeOffset() (dx, dy int)

  func (w *World) Flash() float64 // 0..1 border-flash intensity, decaying over FlashDuration
  ```

Pinned pattern (§18), one step per `ShakeDuration/ShakeSteps` = 16ms:

```text
step 0: ( 0, +1)
step 1: (-1,  0)
step 2: (+1,  0)
step 3: ( 0, -1)
step 4: ( 0,  0)
```

`World.Handle` on `PieceHardDropped` starts the shake, emits 10–18 debris particles upward from the contact cells (`AngleFrom -2.6, AngleTo -0.5, MinSpeed 6, MaxSpeed 16`), and starts the border flash. `Frame` applies `ShakeOffset` to the board layer's X and Y only — the HUD, mission line and controls do not move, so the screen stays readable (§18: "Do not make the entire terminal unreadable").

- [ ] **Step 1: Write the failing tests**

```go
func TestShakeOffsetFollowsTheSpecPattern(t *testing.T) {
	// start a shake, then sample ShakeOffset() after 0, 16, 32, 48, 64 and 80ms:
	// (0,1), (-1,0), (1,0), (0,-1), (0,0), (0,0)
}

func TestShakeNeverExceedsOneCell(t *testing.T) {
	// §44: for a shake with Amp 5 requested, every sampled offset has
	// abs(dx) <= 1 and abs(dy) <= 1
}

func TestShakeExpires(t *testing.T) {
	// after Advance(ShakeDuration + 20ms), ShakeOffset() == (0, 0)
}

func TestReducedMotionSuppressesShake(t *testing.T) {
	// Review Focus #4: a world with ReducedMotion true, given a hard drop,
	// returns (0,0) at every sample point
}

func TestHardDropEmitsDebrisUpward(t *testing.T) {
	// Handle a PieceHardDropped event: ParticleCount() is between 10 and 18
	// and every new particle has VY < 0
}

func TestHardDropStartsTheBorderFlash(t *testing.T) {
	// Flash() is > 0.9 immediately after the event and 0 after FlashDuration
}

func TestReducedMotionKeepsDebrisAndFlash(t *testing.T) {
	// §49.5: reduced motion leaves particles and the flash alone —
	// ParticleCount() > 0 and Flash() > 0 after a hard drop
}

func TestShakeMovesOnlyTheBoard(t *testing.T) {
	// render-side: two frames, one with an active shake at step 0 and one with
	// none; the controls line and mission line are at the same row in both,
	// and the board's first border row differs by exactly one row
}

func TestShakenBoardStaysInsideTheTerminal(t *testing.T) {
	// at 40x24 with every shake step: the frame is 24 lines and no line exceeds
	// 40 columns (the offset must be clipped, not allowed to push content off)
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run 'TestShake|TestHardDropEmits|TestHardDropStarts|TestReducedMotion' -v`
Expected: FAIL

- [ ] **Step 3: Implement `shake.go`, the `Handle` case, and the `Frame` offset**

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/ internal/render/
git commit -m "feat: hard-drop impact with deterministic shake, debris and border flash"
```

---

### Task 8: Line-clear supernova and shockwaves

**Files:**
- Create: `internal/fx/clear.go`, `internal/fx/shockwave.go`
- Modify: `internal/fx/world.go`, `internal/render/fxdraw.go`
- Test: `internal/fx/clear_test.go`, `internal/fx/shockwave_test.go`

**Interfaces:**
- Consumes: Tasks 2–7.
- Produces:
  ```go
  const (
      ClearDuration = 220 * time.Millisecond // §19
      ClearPhaseA   = 70 * time.Millisecond  // critical mass
      ClearPhaseB   = 150 * time.Millisecond // supernova (cumulative)
      RingDuration  = 300 * time.Millisecond // §24
  )

  type ClearPhase uint8

  const (
      PhaseCriticalMass ClearPhase = iota
      PhaseSupernova
      PhaseCollapse
      PhaseDone
  )

  type ClearAnim struct {
      Rows    []int // board-interior row indices
      Elapsed time.Duration
  }

  func (c ClearAnim) Phase() ClearPhase
  // Glyph returns the glyph for column col (0..width-1) at the current phase,
  // or 0 when that column should be left alone.
  func (c ClearAnim) Glyph(col, width int) rune

  type Shockwave struct {
      X, Y    float64
      Elapsed time.Duration
  }

  func (s Shockwave) Radius() float64 // 0 .. maxRadius over RingDuration
  func (s Shockwave) Glyph() rune     // · ○ ◌ ◯ by radius band (§24)
  ```

`World.Handle` on `LinesCleared` pushes a `ClearAnim` for the rows, and emits debris whose horizontal velocity scales with each particle's distance from the row centre (§19: "Particles should inherit some horizontal velocity from their location relative to center"). A clear of three or more rows also pushes a `Shockwave` at the centre of the cleared band — unless reduced motion is on (§49.5).

Phase glyphs (§19): phase A brightens the row centre to `█` with `▓` at the edges; phase B is a centre-out explosion reading `░░░▓▓██✦✦██▓▓░░░`; phase C leaves only sparse debris glyphs. The clear band is the one effect allowed to draw over locked cells, since it is drawing the destruction of those cells.

- [ ] **Step 1: Write the failing tests**

```go
func TestClearPhaseBoundaries(t *testing.T) {
	// Elapsed 0 and 69ms -> PhaseCriticalMass
	// 70ms and 149ms      -> PhaseSupernova
	// 150ms and 219ms     -> PhaseCollapse
	// 220ms and beyond    -> PhaseDone
}

func TestClearAnimIsRemovedWhenDone(t *testing.T) {
	// Handle a LinesCleared event, Advance(ClearDuration + 10ms):
	// len(w.Clears) == 0
}

func TestClearGlyphIsSymmetricAboutTheCentre(t *testing.T) {
	// for each phase and width 20: Glyph(col, 20) == Glyph(19-col, 20)
}

func TestPhaseBIsBrightestAtTheCentre(t *testing.T) {
	// at PhaseSupernova, Glyph(9, 20) and Glyph(10, 20) are '✦'
	// and Glyph(0, 20) is a dimmer glyph
}

func TestPhaseCLeavesMostColumnsAlone(t *testing.T) {
	// at PhaseCollapse, at least half the columns return 0 (sparse debris)
}

func TestClearEmitsCentreBiasedDebris(t *testing.T) {
	// Handle LinesCleared for a row: particles left of centre have VX < 0 and
	// particles right of centre have VX > 0
}

func TestThreeOrMoreRowsPushAShockwave(t *testing.T) {
	// LinesCleared with Value 1 or 2 -> len(w.Rings) == 0
	// Value 3 or 4 -> len(w.Rings) == 1, centred on the cleared band
}

func TestReducedMotionSuppressesShockwaves(t *testing.T) {
	// Review Focus #4: reduced motion + LinesCleared Value 4 -> len(w.Rings) == 0
	// but len(w.Clears) == 1 and ParticleCount() > 0
}

func TestShockwaveRadiusGrowsMonotonically(t *testing.T) {
	// sampling Radius() over 0..RingDuration is non-decreasing and starts at 0
	// Glyph() changes at least three times across that range
}

func TestShockwaveExpires(t *testing.T) {
	// after Advance(RingDuration + 10ms), len(w.Rings) == 0
}

func TestClearBandStaysWithinTheBoardRows(t *testing.T) {
	// Review Focus #1: a LinesCleared event naming rows 0 and 21 draws only
	// inside BoardRect() — assert the rendered frame's height is unchanged and
	// no rows outside the board changed
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestClear|TestPhase|TestThreeOrMore|TestShockwave' -v`
Expected: FAIL

- [ ] **Step 3: Implement `clear.go`, `shockwave.go`, the `Handle` case, and `drawClears` / `drawRings`**

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/ internal/render/
git commit -m "feat: three-phase supernova line clear and radial shockwaves"
```

---

### Task 9: Hyperdrive, banners, combo escalation, level-up card

**Files:**
- Create: `internal/fx/hyperdrive.go`, `internal/fx/banner.go`
- Modify: `internal/fx/world.go`, `internal/fx/starfield.go`, `internal/render/fxdraw.go`, `internal/render/render.go`
- Test: `internal/fx/hyperdrive_test.go`, `internal/fx/banner_test.go`

**Interfaces:**
- Consumes: Tasks 1–8.
- Produces:
  ```go
  const (
      HyperDuration  = 1100 * time.Millisecond // §16
      BannerDuration = 700 * time.Millisecond  // §20
      LevelDuration  = 900 * time.Millisecond  // §22
  )

  type Hyperdrive struct {
      Elapsed, Total time.Duration
  }

  // SpeedMultiplier interpolates the §16 keyframes; it returns exactly 1 when
  // inactive or when the world is in reduced-motion mode.
  func (w *World) SpeedMultiplier() float64

  type Banner struct {
      Text    string
      Elapsed time.Duration
  }

  func (w *World) Banner() (text string, alpha float64, ok bool)

  type Levelup struct {
      Level    int
      Subtitle string
      Elapsed  time.Duration
  }

  func (w *World) Levelup() (level int, subtitle string, slide float64, ok bool)

  func (w *World) ComboIntensity() float64 // 0..1, drives the §21 HUD pulse

  func drawBanner(c *lipgloss.Canvas, w *fx.World, th Theme, l Layout)
  func drawLevelup(c *lipgloss.Canvas, w *fx.World, th Theme, l Layout)
  ```

Pinned hyperdrive keyframes (§16), linearly interpolated:

```text
   0ms  ->  0.0   stars pause
  50ms  ->  0.3   stars stretch
 100ms  ->  3.0   accelerate violently
 500ms  ->  9.0   peak speed
 800ms  ->  3.0   decay
1100ms  ->  1.0   normal
```

Triggers (§16): a four-line clear, a combo reaching 5 or more, and a new high score (the world tracks its own best-score watermark, since the engine has no notion of one). Combo escalation (§21), driven from `ComboChanged`:

```text
combo 2  -> 8 spark particles
combo 3  -> 16 meteor particles with strong horizontal velocity
combo 4  -> ComboIntensity() >= 0.5, which makes the HUD pulse
combo 5+ -> hyperdrive plus a flavor.ComboLine at PriEvent
```

The four-line sequence (§20) fires all of it at once: hyperdrive, shake, border pulse via `Energy`, a particle eruption, HUD flash, a temporary star-density increase, and a `flavor.FourLineBanner` for `BannerDuration`. `LevelChanged` pushes a `Levelup` with a `flavor.LevelSubtitle`, sliding out over `LevelDuration`. Neither the banner nor the level card is allowed to change `app.State` — input keeps flowing (§20).

- [ ] **Step 1: Write the failing tests**

```go
func TestSpeedMultiplierMatchesTheKeyframes(t *testing.T) {
	// start hyperdrive, then sample at 0, 50, 100, 500, 800 and 1100ms:
	// within 0.01 of 0.0, 0.3, 3.0, 9.0, 3.0, 1.0
	// a sample at 300ms lies strictly between 3.0 and 9.0
}

func TestSpeedMultiplierIsOneWhenInactive(t *testing.T) {
	// a fresh world and a world advanced past HyperDuration both return 1.0
}

func TestReducedMotionPinsSpeedMultiplierToOne(t *testing.T) {
	// Review Focus #4: reduced motion plus a four-line clear returns exactly 1.0
	// at every sample point
}

func TestHyperdriveAcceleratesStars(t *testing.T) {
	// two worlds from the same seed; trigger hyperdrive in one; after
	// Advance(500ms) the triggered world's mean star displacement is larger
}

func TestFourLineClearTriggersEverything(t *testing.T) {
	// Handle LinesCleared with Value 4:
	// SpeedMultiplier() != 1, ShakeOffset() != (0,0), ParticleCount() > 0,
	// Banner() ok with a §20 text, len(w.Clears) == 1, len(w.Rings) == 1,
	// and MissionText() is a PriMajor line
}

func TestBannerExpiresAfterSevenHundredMilliseconds(t *testing.T) {
	// ok is true at 699ms and false at 700ms; alpha decreases monotonically
	// over the last 200ms and is 1.0 for the first 500ms
}

func TestComboEscalationThresholds(t *testing.T) {
	// ComboChanged Value 2 -> ParticleCount() == 8
	// Value 3 -> 16 more particles, and their |VX| exceeds the combo-2 particles'
	// Value 4 -> ComboIntensity() >= 0.5
	// Value 5 -> SpeedMultiplier() != 1 and MissionText() contains "COMBO 5"
	// Value 0 -> ComboIntensity() == 0
}

func TestNewHighScoreTriggersHyperdriveOnce(t *testing.T) {
	// Handle LinesCleared with Snapshot{Score: 1000} -> hyperdrive starts
	// Advance past HyperDuration, Handle again with Snapshot{Score: 900}
	// -> hyperdrive does not restart
}

func TestLevelChangedPushesTheCard(t *testing.T) {
	// LevelChanged Value 8 -> Levelup() ok with level 8 and a §22 subtitle
	// slide goes from 0 to 1 across LevelDuration, then ok is false
}

func TestWorstCaseLoadStaysUnderTheCap(t *testing.T) {
	// Review Focus #2: Handle a single batch containing LinesCleared Value 4,
	// ComboChanged Value 7, PieceHardDropped Value 20 and PieceLocked,
	// then Advance 60 frames of 16ms:
	// ParticleCount() <= MaxParticles at every frame, and the frame renders
	// at 40x24 and 80x30 without panicking
}

func TestBannerDoesNotBlockInput(t *testing.T) {
	// app-level: with a banner active, a left key press still moves the piece
	// in the same Update call
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/app/ -run 'TestSpeedMultiplier|TestReducedMotionPins|TestHyperdrive|TestFourLine|TestBanner|TestCombo|TestNewHighScore|TestLevelChanged|TestWorstCase' -v`
Expected: FAIL

- [ ] **Step 3: Implement `hyperdrive.go`, `banner.go`, the star-speed hook, and the draw functions**

`drawBanner` centres the banner over the board using `lipgloss.Place` and fades it with `lipgloss.Alpha`; `drawLevelup` slides the §22 card in from the right of the board using the `slide` value.

- [ ] **Step 4: Refresh the FX golden and read it**

Run: `go test ./internal/render/ -run TestFrameWithFXGolden -update`
Confirm `TestNilFXReproducesTheTerminalGoldens` still passes.

- [ ] **Step 5: Run the suite**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add internal/fx/ internal/render/
git commit -m "feat: hyperdrive, four-line spectacle, combo escalation and level-up card"
```

---

### Task 10: Boot sequence

**Files:**
- Modify: `internal/app/model.go`, `internal/app/update.go`, `internal/render/overlay.go`, `internal/render/render.go`
- Modify: `internal/render/testdata/boot.golden`
- Test: `internal/app/boot_test.go`, `internal/render/overlay_test.go`

**Interfaces:**
- Consumes: `render.BootBox` (terminal plan Task 6), `spinner.Model`.
- Produces:
  ```go
  // app.Model gains:
  //   Spinner spinner.Model  // shown beside the §29 checklist while booting
  // Init returns tea.Batch(Frame(), m.Spinner.Tick)
  ```

`BootBox` gains a spinner frame parameter: `BootBox(progress float64, spin string, th Theme) string`. The boot overlay renders over a live starfield — `Frame` draws stars before the boot box, so the terminal is already alive during the one second of drama (§29). Any key press ends the sequence immediately.

- [ ] **Step 1: Write the failing tests**

```go
func TestBootShowsSpinnerAndChecklist(t *testing.T) {
	// a model in StateBoot at progress 0.6: the stripped view contains
	// "INITIALIZING LOCAL UNIVERSE", "gravity", "spacetime" and the spinner frame
}

func TestBootRunsStarfieldBehindTheCard(t *testing.T) {
	// the boot frame at 80x30 contains at least one star glyph outside the box
}

func TestAnyKeySkipsBoot(t *testing.T) {
	// §29: for each of "a", "space", "?", "p", the model leaves StateBoot
	// (and "q" still quits rather than skipping into play)
}

func TestBootEndsOnItsOwnAtOneSecond(t *testing.T) {
	// FrameMsgs totalling BootDuration leave StatePlaying, and the game has
	// not advanced during boot (Active.Y is still the spawn Y)
}

func TestSpinnerTickDoesNotAdvanceTheGame(t *testing.T) {
	// feeding spinner.TickMsg while in StatePlaying changes neither Score
	// nor Active
}

func TestBootGolden(t *testing.T) {
	// the boot frame with a fixed spinner frame and progress 0.6 at 80x30
	// matches testdata/boot.golden
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ ./internal/render/ -run 'TestBoot|TestAnyKey|TestSpinner' -v`
Expected: FAIL

- [ ] **Step 3: Implement the spinner wiring and the updated `BootBox`**

Use `spinner.New(spinner.WithSpinner(spinner.Dot))`. Forward `spinner.TickMsg` to `m.Spinner.Update` and nothing else.

- [ ] **Step 4: Refresh the boot golden and read it**

Run: `go test ./internal/render/ -run 'TestBootGolden|TestOverlayGoldens' -update`

- [ ] **Step 5: Run the suite**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add internal/app/ internal/render/
git commit -m "feat: boot sequence with spinner over a live starfield"
```

---

### Task 11: Game-over black hole

**Files:**
- Create: `internal/fx/collapse.go`
- Modify: `internal/fx/world.go`, `internal/render/fxdraw.go`, `internal/render/render.go`, `internal/app/update.go`
- Create: `internal/render/testdata/collapse.golden`
- Test: `internal/fx/collapse_test.go`, `internal/render/collapse_test.go`

**Interfaces:**
- Consumes: Tasks 2–9; `render.GameOverBox`.
- Produces:
  ```go
  const (
      CollapseFreeze      = 300 * time.Millisecond  // §28: SIGNAL LOST
      CollapseFall        = 900 * time.Millisecond  // cumulative: blocks fall inward
      CollapseSingularity = 1300 * time.Millisecond // cumulative: black hole art
  )

  type CollapsePhase uint8

  const (
      CollapseSignalLost CollapsePhase = iota
      CollapseFalling
      CollapseBlackHole
      CollapseCard
  )

  type Collapse struct {
      Cells   []CollapseCell
      Elapsed time.Duration
  }

  type CollapseCell struct {
      X, Y   float64
      Kind   game.PieceKind
      originX, originY float64
  }

  func (w *World) Collapse() (*Collapse, bool)
  func (c *Collapse) Phase() CollapsePhase

  func drawCollapse(c *lipgloss.Canvas, w *fx.World, th Theme, l Layout)

  // BlackHoleArt returns the §28 singularity drawing for a mode.
  func BlackHoleArt(th Theme) string
  ```

`World.Handle` on `GameOver` snapshots every filled board cell into `Collapse.Cells`. During `CollapseFalling` each cell eases from its origin toward the board centre; during `CollapseBlackHole` the cells are gone and `BlackHoleArt` renders. `render.Frame` shows `OverlayGameOver`'s card only once `Phase() == CollapseCard`, so the §28 sequence plays before the final panel. Because the engine is already in `StateOver`, the collapse is purely visual and `r` and `q` work throughout (§20's "must not block gameplay input" applied to game over).

The board snapshot requires the filled cells at game-over time. `game.Event{Kind: GameOver}` does not carry them, so `app` passes the board through: `World.Handle` receives the events and the snapshot, and `app` calls `w.NoteBoard(&m.Game.Board)` immediately before `Handle` on the frame that produced the `GameOver` event. `NoteBoard` copies the cells it needs and keeps no pointer.

- [ ] **Step 1: Write the failing tests**

```go
func TestCollapsePhaseBoundaries(t *testing.T) {
	// 0 and 299ms   -> CollapseSignalLost
	// 300 and 899ms -> CollapseFalling
	// 900 and 1299ms-> CollapseBlackHole
	// 1300ms+       -> CollapseCard
}

func TestCollapseSnapshotsTheFilledCells(t *testing.T) {
	// a board with 17 filled cells, NoteBoard then Handle(GameOver):
	// len(Collapse().Cells) == 17 and each carries the right Kind
}

func TestNoteBoardKeepsNoPointer(t *testing.T) {
	// NoteBoard(&b); Handle(GameOver); then clear b entirely:
	// Collapse().Cells is unchanged (§14: fx cannot reach game state)
}

func TestCellsFallTowardTheCentre(t *testing.T) {
	// at CollapseFalling's start every cell is at its origin;
	// at 890ms every cell's distance to the board centre is smaller than at 310ms
}

func TestSignalLostFreezesEverything(t *testing.T) {
	// during CollapseSignalLost no cell has moved from its origin,
	// and the rendered frame contains "SIGNAL LOST"
}

func TestBlackHoleArtAppearsThenTheCard(t *testing.T) {
	// the frame at 1000ms contains the §28 singularity ("●" and "---") and not
	// "UNIVERSE EXPIRED"
	// the frame at 1400ms contains "UNIVERSE EXPIRED" and the final counters
}

func TestASCIIBlackHoleUsesASCIIGlyphs(t *testing.T) {
	// in ModeASCII the art contains no "●"
}

func TestRestartAndQuitWorkDuringTheCollapse(t *testing.T) {
	// app-level: with the collapse at 500ms, "r" returns to StatePlaying with a
	// fresh board, and "q" returns a tea.QuitMsg
}

func TestCollapseGolden(t *testing.T) {
	// the frame at 1000ms with a fixed board matches testdata/collapse.golden
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ ./internal/app/ -run 'TestCollapse|TestNoteBoard|TestCellsFall|TestSignalLost|TestBlackHole|TestASCIIBlackHole|TestRestartAndQuit' -v`
Expected: FAIL

- [ ] **Step 3: Implement `collapse.go`, `NoteBoard`, `drawCollapse`, `BlackHoleArt` and the `Frame` gating**

- [ ] **Step 4: Record the golden and read it**

Run: `go test ./internal/render/ -run TestCollapseGolden -update`
Read `testdata/collapse.golden` and confirm the singularity is centred on the board and the HUD is still legible around it.

- [ ] **Step 5: Run the suite**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add internal/fx/ internal/render/ internal/app/
git commit -m "feat: game-over collapse into a simulated black hole"
```

---

### Task 12: Mode audit, responsive FX, coolness acceptance

**Files:**
- Modify: `internal/fx/world.go` (`Intensity` scaling by terminal size), `internal/app/model.go` (`--no-fx` and `--reduced-motion` wiring), `README.md`
- Test: `internal/app/modes_test.go`, `internal/fx/intensity_test.go`
- Create: `internal/render/testdata/small-fx.golden`

**Interfaces:**
- Consumes: everything.
- Produces:
  ```go
  // Intensity scales effect volume down on small terminals (§31: "Effects
  // automatically reduce outside the board"). 1.0 at 80x30 and above,
  // 0.4 at the 40x24 minimum, linear between.
  func (w *World) Intensity() float64
  ```

`app.New` sets `Options.NoFX` to mean `Model.FX == nil`, which makes `render.Input.FX` nil. `Options.ReducedMotion` flows into `fx.Options.ReducedMotion`.

- [ ] **Step 1: Write the failing tests**

```go
func TestIntensityScalesWithTerminalSize(t *testing.T) {
	// Review Focus #3
	// Resize(80,30,...) -> 1.0
	// Resize(40,24,...) -> within 0.01 of 0.4
	// Resize(60,27,...) -> strictly between
	// Resize(0,0,...)   -> 0.4 (floor, no division by zero)
}

func TestSmallTerminalEmitsFewerParticles(t *testing.T) {
	// Review Focus #3: two worlds, one at 80x30 and one at 40x24, both given a
	// four-line clear: the 40x24 world's ParticleCount() is lower
}

func TestSmallTerminalBoardStaysReadable(t *testing.T) {
	// Review Focus #3: at 40x24 with a saturated FX state, the stripped frame's
	// board rows sliced to the board columns still equal BoardPanel's output for
	// every cell BoardPanel filled, and the frame is exactly 24 lines
	// (recorded as testdata/small-fx.golden)
}

func TestNoFXProducesTheBaseGame(t *testing.T) {
	// app.New(Options{NoFX: true}): m.FX == nil, View() does not panic,
	// and after a hard drop the stripped view contains no particle glyphs
	// from the §18 pool
}

func TestNoFXStillPlays(t *testing.T) {
	// §47 "the game is fun even with effects disabled": with NoFX, moves,
	// rotations, hard drops, hold, line clears, pause and restart all still work
	// (drive a short scripted session through Update and assert Score > 0 and
	// Lines > 0)
}

func TestReducedMotionSuppressesOnlyTheThreeEffects(t *testing.T) {
	// Review Focus #4: app.New(Options{ReducedMotion: true}), four-line clear:
	// ShakeOffset() == (0,0), SpeedMultiplier() == 1.0, len(Rings) == 0
	// AND ParticleCount() > 0, len(Clears) == 1, Banner() ok, Flash() > 0
}

func TestPauseFreezesGameplayFXButNotStars(t *testing.T) {
	// Review Focus #5: press p mid-animation (an active ClearAnim and Shake),
	// feed 30 FrameMsgs:
	// the ClearAnim's Elapsed and the Shake's Elapsed are unchanged,
	// ParticleCount() is unchanged, but the stars have moved
}

func TestResumeDoesNotBurstAfterAPause(t *testing.T) {
	// Review Focus #5: pause, feed a FrameMsg 30 seconds later, unpause, feed
	// another FrameMsg 16ms later: the piece descends at most one cell
}

func TestASCIIModeRunsEveryEffect(t *testing.T) {
	// with ModeASCII and a saturated FX state, the stripped frame contains no
	// glyph outside the ASCII/Latin-1 set used by the ASCII theme
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/app/ -run 'TestIntensity|TestSmallTerminal|TestNoFX|TestReducedMotion|TestPauseFreezes|TestResume|TestASCIIModeRuns' -v`
Expected: FAIL

- [ ] **Step 3: Implement `Intensity`, the pause gating for gameplay FX, and the flag wiring**

`Advance`'s `gameplay` parameter (pinned in Task 2) is what gates this: stars, the shooting star and `Elapsed` always step, while particles, trails, hold streaks, clears, rings, shake, hyperdrive, banners and the collapse step only when `gameplay` is true. Confirm every effect added since Task 2 respects it.

`Emit` and every `Handle` case scale their particle counts by `Intensity()`, rounded down, with a floor of 1 so an effect never vanishes entirely on a small terminal.

- [ ] **Step 4: Record the small-FX golden and read it**

Run: `go test ./internal/render/ -run TestSmallTerminalBoardStaysReadable -update`

- [ ] **Step 5: Run the full suite with race detection**

Run: `go build ./... && go vet ./... && go test ./... -race -cover`
Expected: PASS

- [ ] **Step 6: The §43 coolness acceptance pass**

Run: `go run ./cmd/cosmic-tetris --seed 8675309`

Within the first 30 seconds of normal play, confirm by eye that all six are present (§43): moving starfield, animated board border, piece trails, hard-drop impact, particles, mission-control commentary. On the first completed line, confirm the supernova animation, debris and a border reaction. Then engineer a four-line clear (hold an `I`, build a well) and confirm the banner, hyperdrive, shake, eruption and HUD flash all fire together. Then die and confirm the §28 sequence: freeze with `SIGNAL LOST`, blocks falling inward, the black hole, then the final card with the right numbers.

Run each of these and confirm the stated behaviour:
- `go run ./cmd/cosmic-tetris --no-fx` — still a good game, nothing moving in the background.
- `go run ./cmd/cosmic-tetris --ascii` — every effect present, no `██`, readable.
- `go run ./cmd/cosmic-tetris --reduced-motion` — a four-line clear produces no shake, no star acceleration and no rings, but still the banner, particles and colour.
- Resize the window repeatedly during play, including below 40×24 and back — no panic, no flicker, the board recovers.

Anything that fails gets fixed inside this task before committing.

- [ ] **Step 7: Update the README and commit**

Add an "Effects" section covering the flag behaviours, the three rendering modes, and the fact that `internal/fx` cannot reach game state. Then:

```bash
git add internal/fx/ internal/app/ internal/render/ README.md
git commit -m "feat: responsive effect intensity, no-fx and reduced-motion audit"
```

---

## Done when

Every item in §47's definition of done holds, and §43's acceptance pass in Task 12 Step 6 has been walked end to end by hand: the game is playable start to game over, controls are immediate, resizing works, `--ascii`, `--no-fx` and `--reduced-motion` all work, the engine's RNG and the FX RNG are isolated, effects never modify game state, four-line clears are gloriously excessive, and the universe collapses into a black hole on death.
