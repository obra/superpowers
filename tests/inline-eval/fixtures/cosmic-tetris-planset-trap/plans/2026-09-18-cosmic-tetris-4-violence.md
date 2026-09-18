# Cosmic Tetris — Plan 4: Violence

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the spectacle excessive: hard-drop impact, screen shake, the three-phase line-clear supernova, shockwaves, hyperdrive, and the simultaneous four-line event — plus combo escalation, the level-up card and the HUD pulse.

**Architecture:** Every effect is another aged field on `fx.World` with a trigger in `Observe` and a draw function in `render`. Gameplay never waits: the engine has already cleared the rows and spawned the next piece while the supernova plays, so each effect carries its own snapshot of what it needs (the pre-clear row contents, the cells a hard drop crossed). Screen shake is applied by compositing the board layer into its own canvas and blitting it at an offset clipped to the board box, so shake can never bleed into the HUD.

**Tech Stack:** Go 1.26, `charm.land/lipgloss/v2`, standard library `math`.

**Spec:** `design.md` (§16, §17 hard-drop trail, §18, §19, §20, §21, §22, §23, §24, §25 event pulse, §38, §42 Phase 4, §43, §44, §49.5)

## Global Constraints

- Language: Go. Module `cosmic-tetris`, `go 1.26`.
- `internal/fx` must not import `internal/render` or `internal/app`.
- FX may observe game events and never modify game state (§14, §44).
- Never delay gameplay for animation; never make controls lag; animations never block input (§44, §47).
- Screen shake never exceeds roughly one terminal cell (§44).
- Particles never permanently alter the rendered board (§44).
- Never obscure the active piece (§44).
- `MaxParticles = 400` stays the hard cap (§38, Plan 3).
- `--reduced-motion` suppresses screen shake, hyperdrive acceleration and shockwaves, and leaves colour, trails and particles alone (§49.5).
- Board readability remains sacred at every combo level (§21).

## Review Focus

1. `--reduced-motion` — shake, hyperdrive and shockwaves must be fully off while trails, particles and colour still run (Task 7).
2. Shake offset larger than one cell, or shaken board content bleeding into the HUD columns (Task 1).
3. A banner or level card covering the active piece or the top of the stack (Task 6).
4. The 220ms supernova gating gameplay — the next piece must keep falling, and input must keep working, during the animation (Task 3).
5. A four-line clear that also levels up and lands at combo 5 in a single frame — every overlay must compose at once without exceeding any cap or panicking (Task 6, Task 7).

## Plan Set

Run in this order. A ruling that changes a name, signature, or value a later plan consumes is applied to that plan's file before the next task starts.

1. `plans/2026-09-18-cosmic-tetris-1-engine.md` — headless deterministic engine in `internal/game`. Consumes: nothing.
2. `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md` — Bubble Tea app, canvas renderer, layout, HUD, hold/next/ghost, CLI flags, pause/help/game-over card, golden tests. Consumes Plan 1's `game.Game`, `Advance`, `Event`, `Board`, `Piece`, `GhostY`.
3. `plans/2026-09-18-cosmic-tetris-3-cosmic-foundation.md` — `internal/fx` (particles, starfield), animated border, piece trails, `internal/flavor` mission control. Consumes Plan 1's `Event`/`Cell` and Plan 2's `render.Canvas`, `render.Layout`, `render.Snapshot`, `app.Model`.
4. `plans/2026-09-18-cosmic-tetris-4-violence.md` — hard-drop impact, screen shake, line supernova, shockwaves, hyperdrive, four-line sequence, combo/level overlays. Consumes Plan 3's `fx.World` and the render FX layer.
5. `plans/2026-09-18-cosmic-tetris-5-polish.md` — boot sequence, game-over black hole, ASCII/no-FX guarantees, §45 details, README, definition-of-done sweep. Consumes everything above.

---

## File Structure

| File | Responsibility |
|---|---|
| `internal/fx/shake.go` | deterministic shake pattern and offset |
| `internal/fx/impact.go` | hard-drop ion beam and debris eruption |
| `internal/fx/lineflash.go` | the three-phase supernova state |
| `internal/fx/shockwave.go` | expanding rings |
| `internal/fx/hyperdrive.go` | the §16 speed timeline and star-density boost |
| `internal/fx/banner.go` | four-line banner, level card, HUD pulse, combo tiers |
| `internal/render/boardlayer.go` | board layer canvas + shake blit, clipped to the board box |
| `internal/render/spectacle.go` | draw supernova, shockwaves, star streaks, banners, level card |

All are new files inside packages §33 already names, each one effect's state or drawing.

---

### Task 1: Screen shake

**Files:**
- Create: `internal/fx/shake.go`, `internal/render/boardlayer.go`
- Modify: `internal/render/render.go` (route board drawing through the board layer)
- Test: `internal/fx/shake_test.go`, `internal/render/boardlayer_test.go`

**Interfaces:**
- Consumes: Plan 3's `World`, `Options`; Plan 2's `Canvas`, `Layout`.
- Produces:
```go
type Shake struct{ Age, Life float64 }
var ShakePattern = [5]game.Point{{X: 0, Y: 1}, {X: -1, Y: 0}, {X: 1, Y: 0}, {X: 0, Y: -1}, {X: 0, Y: 0}}  // §18
const (ShakeLife = 0.08; BigShakeLife = 0.14)
func (w *World) TriggerShake(life float64)
func (w *World) ShakeOffset() (dx, dy int)   // (0,0) when inactive or ReducedMotion

// render
func DrawBoardLayer(dst *Canvas, l Layout, s Snapshot, o Options)
```

`ShakeOffset` indexes `ShakePattern` by `int(Age / Life * len(ShakePattern))`, clamped to the last entry. `DrawBoardLayer` renders the border, board interior, ghost, active piece and board-local FX into a canvas of `l.Border` size, then blits it into `dst` at `l.Border.X+dx, l.Border.Y+dy` with the blit clipped to the `l.Border` rectangle — content shifted outside the box is dropped rather than drawn over the HUD.

- [ ] **Step 1: Write the failing tests**

```go
func TestShakeWalksThePinnedPattern(t *testing.T)
// TriggerShake(ShakeLife); sample ShakeOffset() at Age 0, 0.02, 0.04, 0.06, 0.079
// => (0,1), (-1,0), (1,0), (0,-1), (0,0) in that order

func TestShakeEndsAfterEightyMilliseconds(t *testing.T)
// TriggerShake(ShakeLife); Step(80ms) => ShakeOffset() == (0,0) and the shake is inactive

func TestShakeNeverExceedsOneCell(t *testing.T)
// step through 1000 sub-steps of both ShakeLife and BigShakeLife:
// |dx| <= 1 and |dy| <= 1 at every sample (§44)

func TestReducedMotionDisablesShake(t *testing.T)
// Options{Enabled:true, ReducedMotion:true}: TriggerShake => ShakeOffset() == (0,0)

func TestShakenBoardNeverBleedsIntoTheHUD(t *testing.T)
// for each of the five pattern offsets: render a full frame at 100x40 with a filled board;
// every HUD region (Hold, Next, Stats) contains exactly what it contains with no shake

func TestShakeKeepsTheBoardBoxSize(t *testing.T)
// with shake active, the rows of the output at l.Border.Y..Border.Y+H-1 are never wider
// than l.Border.W within that x-range
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run TestShake -v`
Expected: FAIL — undefined `ShakePattern`.

- [ ] **Step 3: Implement `shake.go`, `boardlayer.go` and the `render.go` rewiring**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS (goldens unchanged — with no shake active the offset is (0,0))

- [ ] **Step 5: Commit**

```bash
git add internal/fx/shake.go internal/fx/shake_test.go internal/render/boardlayer.go internal/render/render.go internal/render/boardlayer_test.go
git commit -m "feat(fx): deterministic one-cell screen shake on a clipped board layer"
```

---

### Task 2: Hard-drop impact

**Files:**
- Create: `internal/fx/impact.go`
- Modify: `internal/fx/world.go` (`Observe` dispatches `PieceHardDropped`)
- Test: `internal/fx/impact_test.go`, `internal/render/impact_test.go`

**Interfaces:**
- Consumes: Task 1's `TriggerShake`; Plan 3's `Spawn`, `Trail`, `Energy`.
- Produces:
```go
var DebrisGlyphs = []rune{'·', '*', '✦', '+'}   // §18
const (
    ImpactBeamLife  = 0.18
    DebrisPerCell   = 3
    DebrisBase      = 6
    DebrisMax       = 40
    DebrisUpMin     = 6.0    // cells/s
    DebrisUpMax     = 14.0
    DebrisSpreadMax = 9.0    // cells/s horizontal at the edge of the contact area
)
func (w *World) impact(ev game.Event)
func (w *World) spawnBeam(cells []game.Point, life float64)
```

`impact` does four things (§18): a vertical ion beam through every cell the piece crossed (`spawnBeam`, `ImpactBeamLife`, capped by `MaxTrails`); `min(DebrisBase + DebrisPerCell*ev.Distance, DebrisMax)` debris particles from the contact row with horizontal velocity signed by their offset from the contact centre, upward initial `VY`, and `AY = ParticleGravity`; `TriggerShake(ShakeLife)`; and the `EnergyBump` for `PieceHardDropped`, which the border flash reads.

- [ ] **Step 1: Write the failing tests**

```go
func TestImpactSpawnsBeamDebrisAndShake(t *testing.T)
// Observe a PieceHardDropped{Piece: p, Distance: 12}
// => at least one Trail with Life == ImpactBeamLife covering 12 rows of crossed cells
// => len(Particles) == min(6+3*12, DebrisMax) == 40
// => ShakeOffset() != (0,0)
// => Energy == 0.25

func TestDebrisCountScalesWithDistanceAndCaps(t *testing.T)
// Distance 1 => 9 particles; Distance 4 => 18; Distance 20 => DebrisMax

func TestDebrisFliesOutwardAndFalls(t *testing.T)
// particles left of the contact centre have VX < 0, right have VX > 0;
// every particle has VY < 0 initially (upward) and AY == ParticleGravity

func TestDebrisGlyphsAreFromTheSpecSet(t *testing.T)
// every spawned particle's Glyph is in DebrisGlyphs

func TestZeroDistanceHardDropStillReacts(t *testing.T)
// Distance 0 => DebrisBase particles, shake triggered, no panic, no beam cells

func TestNoImpactWhenFXDisabled(t *testing.T)
// Options{Enabled:false} => nothing spawns, no shake

func TestHardDropBrightensTheBorder(t *testing.T)   // render side
// the border colour one frame after a hard drop differs from the resting colour,
// and moves toward the hot-white end of BorderPalette
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run TestImpact -v`
Expected: FAIL — undefined `DebrisGlyphs`.

- [ ] **Step 3: Implement `impact.go` and the `Observe` dispatch**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/impact.go internal/fx/world.go internal/fx/impact_test.go internal/render/impact_test.go
git commit -m "feat(fx): hard-drop ion beam, debris eruption and shake"
```

---

### Task 3: Line-clear supernova

**Files:**
- Create: `internal/fx/lineflash.go`, `internal/render/spectacle.go`
- Modify: `internal/fx/world.go` (`Observe` dispatches `LinesCleared`), `internal/render/render.go`
- Test: `internal/fx/lineflash_test.go`, `internal/render/spectacle_test.go`

**Interfaces:**
- Consumes: `game.Event.Rows` and `game.Event.Cells` (the pre-clear row contents from Plan 1).
- Produces:
```go
type LineFlash struct {
    Rows  []int
    Cells [][]game.Cell
    Age   float64
    // unexported: debrisSpawned bool
}
const (FlashPhaseAEnd = 0.07; FlashPhaseBEnd = 0.15; FlashLife = 0.22)   // §19: ~220ms total
func (f LineFlash) Phase() int   // 0 critical mass, 1 supernova, 2 collapse, -1 expired
func (w *World) Flashes() []LineFlash

// render
func DrawLineFlash(c *Canvas, l Layout, w *fx.World, g *game.Game, o Options)
var FlashRamp = [4]string{"██", "▓▓", "▒▒", "░░"}   // ASCII: "[]", "##", ";;", ".."
const FlashCoreGlyph = "✦✦"
```

Phases (§19), drawn at the cleared rows' original positions over the already-collapsed board:
- **A — critical mass:** the row degrades from its edges inward: outer cells step down the `FlashRamp`, the centre stays solid.
- **B — supernova:** a bright `FlashCoreGlyph` band expands from the centre outward with `FlashRamp` shoulders on either side.
- **C — collapse:** the row renders empty, and on entering this phase exactly once, debris particles spawn — one per cleared cell, `VX = (x - centre) × 2.5` cells/s, upward `VY`, `AY = ParticleGravity` (§19: particles inherit horizontal velocity from their position relative to centre).

The flash never draws over a cell occupied by the active piece (§44).

- [ ] **Step 1: Write the failing tests**

```go
func TestFlashLifetimeAndPhases(t *testing.T)
// Observe a LinesCleared{Rows:[]int{21}, Cells: one row, Count:1}
// Phase() == 0 at Age 0 and 0.06; == 1 at 0.08 and 0.14; == 2 at 0.16 and 0.21;
// after Step(220ms) the flash is gone (Flashes() empty)

func TestDebrisSpawnsExactlyOnceOnPhaseC(t *testing.T)
// step to Age 0.16 in 10 sub-steps => the debris count after the first phase-C step
// equals the count after five more phase-C steps

func TestDebrisInheritsHorizontalVelocityFromPosition(t *testing.T)
// cleared row of 10 cells: the leftmost debris has the most negative VX, the
// rightmost the most positive, and a centre cell is near zero

func TestFlashCarriesPreClearColours(t *testing.T)
// the LineFlash's Cells match the event's Cells, so the animation can colour the row
// after the board has already collapsed

func TestFourLinesMakeOneFlashOfFourRows(t *testing.T)
// LinesCleared{Count:4} => exactly one LineFlash with len(Rows)==4

func TestGameplayContinuesDuringTheAnimation(t *testing.T)
// app-level: clear a line, then feed 14 frames of 16ms (the whole 220ms) while holding
// no keys => the newly spawned piece descends normally, key presses still move it,
// and the engine's board is already collapsed from frame one

func TestFlashNeverCoversTheActivePiece(t *testing.T)
// place the active piece over a cleared row's position: those cells render BlockGlyph

func TestGoldenSupernovaMidPhaseB(t *testing.T)
// fixed fx seed, a 2-line clear, stepped to Age 0.10, 100x40 => testdata/supernova.txt
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run TestFlash -v`
Expected: FAIL — undefined `LineFlash`.

- [ ] **Step 3: Implement `lineflash.go`, `DrawLineFlash` and the pipeline hook**

- [ ] **Step 4: Create the golden and run everything**

Run: `go test ./internal/render/ -run TestGolden -update && go test ./... -v`
Expected: PASS; read `testdata/supernova.txt` and confirm it reads as an explosion, not as garbage.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/lineflash.go internal/fx/world.go internal/fx/lineflash_test.go internal/render/spectacle.go internal/render/render.go internal/render/spectacle_test.go internal/render/testdata
git commit -m "feat(fx): three-phase line-clear supernova"
```

---

### Task 4: Shockwaves

**Files:**
- Create: `internal/fx/shockwave.go`
- Modify: `internal/render/spectacle.go`
- Test: `internal/fx/shockwave_test.go`

**Interfaces:**
- Consumes: Plan 3's `World`.
- Produces:
```go
type Shockwave struct{ CX, CY, Age float64 }
const (ShockLife = 0.30; MaxShockwaves = 3; ShockMaxRadius = 14.0; ShockAspect = 2.0)
func (s Shockwave) Radius() float64      // eased out: ShockMaxRadius * (1 - (1-t)²), t = Age/ShockLife
func (w *World) TriggerShockwave(cx, cy float64)
func (w *World) Shockwaves() []Shockwave

// render
var ShockRamp = [4]rune{'·', '○', '◌', '◯'}   // §24; ASCII: '.', 'o', 'o', 'O'
func DrawShockwaves(c *Canvas, l Layout, w *fx.World, o Options)
```

Rings are faked in terminal space: a cell `(x, y)` is on the ring when `hypot((x-CX)/ShockAspect, y-CY)` is within 0.6 of `Radius()`, which compensates for the 2:1 cell aspect. Glyph comes from `ShockRamp` indexed by age. Shockwaves are used sparingly (§24) — only by four-line clears, combo ≥ 4 and level-up (wired in Task 6) — suppressed under `ReducedMotion`, and capped at `MaxShockwaves` (oldest dropped).

- [ ] **Step 1: Write the failing tests**

```go
func TestRadiusGrowsAndDies(t *testing.T)
// TriggerShockwave(10,10): Radius() at Age 0 is 0, strictly increases across
// 10 samples, and reaches ShockMaxRadius at ShockLife; Step(300ms) => Shockwaves() empty

func TestReducedMotionSuppressesShockwaves(t *testing.T)
// ReducedMotion: TriggerShockwave => Shockwaves() empty

func TestShockwavesAreCapped(t *testing.T)
// trigger 6 => len(Shockwaves()) == MaxShockwaves

func TestRingCellsFollowTheEllipse(t *testing.T)
// at Age 0.15, the drawn cells all satisfy the ring predicate within tolerance,
// and the ring is about twice as wide as it is tall

func TestNoShockwaveWhenFXDisabled(t *testing.T)
// Options{Enabled:false} => nothing
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestRadius|TestReducedMotionSuppresses|TestShockwaves|TestRing|TestNoShockwave' -v`
Expected: FAIL — undefined `Shockwave`.

- [ ] **Step 3: Implement `shockwave.go` and `DrawShockwaves`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/shockwave.go internal/fx/shockwave_test.go internal/render/spectacle.go
git commit -m "feat(fx): faked-geometry radial shockwaves"
```

---

### Task 5: Hyperdrive

**Files:**
- Create: `internal/fx/hyperdrive.go`
- Modify: `internal/fx/starfield.go` (`StarSpeed` multiplies in the hyperdrive factor and the density boost), `internal/render/fx.go` (near-layer stars render as streaks while stretching)
- Test: `internal/fx/hyperdrive_test.go`, `internal/render/hyperdrive_test.go`

**Interfaces:**
- Consumes: Plan 3's `StarSpeed`, `Stars`, `StarCount`.
- Produces:
```go
type Hyper struct{ Age float64; Active bool }
const (
    HyperLife       = 1.10
    HyperPeakFactor = 8.0
    LargeCombo      = 4      // §16 "large combo"
)
func (w *World) TriggerHyperdrive()
func (w *World) StarSpeedMultiplier() float64   // §16 timeline; 1.0 when inactive or ReducedMotion
func (w *World) Stretching() bool               // true in the 50–150ms stretch window
func (w *World) BoostStarDensity(amount, seconds float64)
func (w *World) StarTarget() int                // StarCount(W,H) scaled by the live density boost

// render
var StreakGlyphs = [2]rune{'│', '┃'}   // ASCII: '|', '!'
```

Timeline (§16), as `StarSpeedMultiplier()`:

| Age | Value |
|---|---|
| 0 – 50ms | `0` (stars pause) |
| 50 – 100ms | `0.2`, with `Stretching() == true` |
| 100 – 500ms | linear ramp `0.2 → HyperPeakFactor` |
| 500 – 800ms | `HyperPeakFactor` (peak) |
| 800 – 1100ms | linear decay `HyperPeakFactor → 1.0` |
| past 1100ms | `1.0`, inactive |

Triggers (§16): a four-line clear, a combo of `LargeCombo` or more, and a new session high score — `World` tracks the best score it has seen and fires only when a later score beats a non-zero best.

- [ ] **Step 1: Write the failing tests**

```go
func TestHyperdriveTimeline(t *testing.T)
// TriggerHyperdrive then sample StarSpeedMultiplier() at Age
// 0.00 → 0; 0.04 → 0; 0.07 → 0.2; 0.30 → between 0.2 and HyperPeakFactor (monotone);
// 0.60 → HyperPeakFactor; 0.95 → between 1 and HyperPeakFactor; 1.20 → 1.0 and inactive

func TestStretchWindow(t *testing.T)
// Stretching() is false at Age 0.02, true at 0.07 and 0.12, false at 0.30

func TestTriggersAreTheSpecifiedThree(t *testing.T)
// Observe LinesCleared{Count:4} => active
// Observe ComboChanged{Count:4} => active; Count:3 => not active
// GameView Score 5000 after a previous best of 4000 => active;
// the very first score seen does not trigger

func TestReducedMotionKeepsStarsAtNormalSpeed(t *testing.T)
// ReducedMotion: TriggerHyperdrive => StarSpeedMultiplier() == 1.0 always, Stretching() false

func TestStarSpeedCombinesLevelAndHyperdrive(t *testing.T)
// level 10 world with hyperdrive at peak: StarSpeed() == SpeedForLevel(10)*HyperPeakFactor

func TestDensityBoostAddsAndThenRemovesStars(t *testing.T)
// BoostStarDensity(0.4, 3.0): StarTarget() > StarCount(W,H); after Step(3s),
// StarTarget() == StarCount(W,H) and len(Stars) matches it again

func TestNearStarsStreakWhileStretching(t *testing.T)   // render side
// during the stretch window, layer-2 stars render a StreakGlyphs rune;
// outside it, they render their normal glyph
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestHyper|TestStretch|TestTriggers|TestReducedMotionKeeps|TestStarSpeed|TestDensity' -v`
Expected: FAIL — undefined `TriggerHyperdrive`.

- [ ] **Step 3: Implement `hyperdrive.go` and the starfield/render changes**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/hyperdrive.go internal/fx/starfield.go internal/fx/hyperdrive_test.go internal/render/fx.go internal/render/hyperdrive_test.go
git commit -m "feat(fx): hyperdrive timeline, star streaks and density boost"
```

---

### Task 6: Four-line sequence, combo escalation and the level-up card

**Files:**
- Create: `internal/fx/banner.go`
- Modify: `internal/fx/world.go` (`Observe` composes the big events), `internal/render/spectacle.go` (banner, level card, HUD pulse)
- Test: `internal/fx/banner_test.go`, `internal/render/banner_test.go`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces:
```go
type Banner struct{ Text string; Age float64 }
const BannerLife = 0.70   // §20

var TetrisBanners = []string{            // §20, verbatim
    "✦ EVENT HORIZON ✦",
    "QUADRUPLE COSMIC INCIDENT",
    "FOUR ROWS HAVE LEFT THE CHAT",
    "SPACE-TIME HAS FILED A COMPLAINT",
}

type LevelCard struct{ Level int; Subtitle string; Age float64 }
const LevelCardLife = 1.20   // §22: slides/fades away without pausing the game
var LevelSubtitles = []string{           // §22, verbatim
    "GRAVITY TAX INCREASED",
    "LOCAL PHYSICS UPDATED WITHOUT CONSENT",
    "PLEASE SECURE ALL LOOSE TETROMINOES",
}

func ComboTier(combo int) int            // 0 for <2; 1 at 2; 2 at 3; 3 at 4; 4 at 5+
func (w *World) HUDPulse() float64       // 0 below tier 3; a 0..1 sine otherwise (§21)
func (w *World) Banner() *Banner         // nil when none
func (w *World) LevelCard() *LevelCard   // nil when none
func (w *World) tetris(ev game.Event)    // the §20 simultaneous bundle

// render
func DrawBanner(c *Canvas, l Layout, w *fx.World, g *game.Game, o Options)
func DrawLevelCard(c *Canvas, l Layout, w *fx.World, o Options)
```

`tetris` fires all of §20 at once: `TriggerHyperdrive()`, `TriggerShake(BigShakeLife)`, a border gradient pulse (`Energy` to 1.0), a particle eruption (a `DebrisMax`-sized burst from the cleared band), `HUDPulse` via the combo tier, `BoostStarDensity(0.4, 3.0)`, and a `Banner` picked from `TetrisBanners` with the FX RNG.

Combo tiers (§21): tier 1 spawns a few `ClassSpark` particles, tier 2 spawns `ClassEmber` meteors that drift across the board, tier 3 turns on `HUDPulse`, tier 4 adds a `TriggerShockwave` at the board centre.

`DrawBanner` centres the text in the board's top three visible rows and skips any cell already holding a block, ghost or active-piece glyph — so the banner can never obscure the active piece or the stack (§44). `DrawLevelCard` draws the §22 box, sliding in from the right edge of the board area and fading out over `LevelCardLife`.

- [ ] **Step 1: Write the failing tests**

```go
func TestFourLineClearFiresEverythingAtOnce(t *testing.T)
// one Observe of LinesCleared{Count:4} =>
//   Banner() != nil and its Text is one of TetrisBanners
//   StarSpeedMultiplier() reflects an active hyperdrive
//   ShakeOffset() != (0,0)
//   Energy == 1.0
//   len(Particles) > 20
//   StarTarget() > StarCount(W,H)

func TestBannerLifetime(t *testing.T)
// Step(690ms) => Banner() != nil; Step(20ms) more => nil

func TestComboTiers(t *testing.T)
// ComboTier(0)==0; (1)==0; (2)==1; (3)==2; (4)==3; (5)==4; (12)==4
// Observe ComboChanged{Count:2} spawns ClassSpark particles;
// Count:3 spawns ClassEmber; Count:4 => HUDPulse() > 0; Count:5 => a shockwave exists

func TestLevelCardCopyAndLifetime(t *testing.T)
// Observe LevelChanged{Count:8} => LevelCard().Level == 8 and Subtitle is in LevelSubtitles
// Step(1.2s) => LevelCard() == nil

func TestLevelCardDoesNotPauseTheGame(t *testing.T)
// app level: a level-up mid-session, then 40 frames => the piece kept descending and
// key presses kept moving it during the card's lifetime

func TestBannerNeverCoversTheActivePieceOrStack(t *testing.T)
// active piece placed in the top three visible rows with a banner showing:
// every active-piece cell renders BlockGlyph in the output, and no locked cell is
// replaced by banner text

func TestSimultaneousTetrisLevelAndComboFive(t *testing.T)
// one Observe carrying LinesCleared{Count:4} + ComboChanged{Count:5} + LevelChanged{Count:5}
// => no panic, Banner() != nil, LevelCard() != nil, len(Particles) <= MaxParticles,
// len(Shockwaves()) <= MaxShockwaves, Energy == 1.0, and a full Render at 100x40 succeeds
// with every line within the terminal width

func TestGoldenFourLineClear(t *testing.T)
// fixed fx seed, LinesCleared{Count:4}, stepped to Age 0.12, 100x40 => testdata/tetris.txt
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestFourLine|TestBanner|TestCombo|TestLevelCard|TestSimultaneous' -v`
Expected: FAIL — undefined `TetrisBanners`.

- [ ] **Step 3: Implement `banner.go`, the `Observe` composition and the two draw functions**

- [ ] **Step 4: Create the golden, run everything, and look at it**

Run: `go test ./internal/render/ -run TestGolden -update && go test ./... -v && go run ./cmd/cosmic-tetris --seed 1234`
Expected: PASS; a four-line clear in the live binary produces §43's reaction.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/banner.go internal/fx/world.go internal/fx/banner_test.go internal/render/spectacle.go internal/render/banner_test.go internal/render/testdata
git commit -m "feat(fx): four-line event bundle, combo escalation and level-up card"
```

---

### Task 7: Reduced motion, intensity caps and performance

**Files:**
- Modify: `internal/fx/world.go` (single intensity gate), `internal/app/update.go` (flag plumb-through already exists)
- Test: `internal/fx/reducedmotion_test.go`, `internal/fx/bench_test.go`, `internal/app/violence_test.go`

**Interfaces:**
- Consumes: Tasks 1–6.
- Produces:
```go
func (o Options) AllowsMotion() bool   // !ReducedMotion — the single gate every motion effect asks
```

Every motion trigger (`TriggerShake`, `TriggerHyperdrive`, `TriggerShockwave`) consults this one predicate, so §49.5's ten-line promise stays ten lines.

- [ ] **Step 1: Write the failing tests**

```go
func TestReducedMotionMatrix(t *testing.T)
// Options{Enabled:true, ReducedMotion:true}, observe a four-line clear + combo 5 + level up:
//   suppressed: ShakeOffset()==(0,0); StarSpeedMultiplier()==1.0; Shockwaves() empty
//   still running: len(Particles) > 0; len(Trails) > 0 after a move; Energy > 0;
//                  Banner() != nil; LevelCard() != nil; stars still drift

func TestNoFXSuppressesEverything(t *testing.T)
// Options{Enabled:false}: the same observation leaves every collection empty and Energy 0

func TestParticleCapHoldsUnderSustainedViolence(t *testing.T)
// 60 seconds of simulated frames with a four-line clear every 10 frames:
// len(Particles) <= MaxParticles, len(Trails) <= MaxTrails,
// len(Shockwaves()) <= MaxShockwaves, len(Stars) <= 240 at every frame

func BenchmarkStepAndRenderUnderLoad(b *testing.B)
// a 100x40 world at MaxParticles with a live supernova, shockwave and hyperdrive:
// one fx.Step(16ms) + one render.Render per iteration

func TestFrameBudgetUnderLoad(t *testing.T)
// the same load, 120 frames, measured: the mean Step+Render wall time is under 8ms
// (skip under -short and on -race)

func TestNoGoroutinesAreSpawned(t *testing.T)
// runtime.NumGoroutine() before and after 600 frames of heavy FX is unchanged (§38)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestReducedMotionMatrix|TestNoFXSuppresses|TestParticleCap|TestFrameBudget|TestNoGoroutines' -v`
Expected: FAIL — undefined `AllowsMotion`.

- [ ] **Step 3: Route every motion trigger through `AllowsMotion` and fix any cap violations the tests find**

- [ ] **Step 4: Run everything**

Run: `go test ./... -v && go test ./internal/fx/ -bench . -run XXX && go vet ./...`
Expected: PASS; the benchmark reports a per-frame cost well inside a 16ms budget.

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/app
git commit -m "feat(fx): single reduced-motion gate, intensity caps and frame budget tests"
```
