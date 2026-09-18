# Cosmic Tetris — Plan 04: Violence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make hard drops feel like dropping a refrigerator from orbit and make a four-line clear produce an involuntary reaction, using particles, screen shake, supernova clears, shockwaves, hyperdrive, and banners — none of which may touch gameplay.

**Architecture:** One tiny float physics simulation in `internal/fx/particle.go` plus four short-lived state machines (shake, clear animation, hyperdrive, banner queue) hanging off the same `World` built in Plan 03. `Advance(dt)` integrates them all; `internal/render` draws whatever it finds. `Options.ReducedMotion` is read in exactly three places and nowhere else.

**Tech Stack:** Go 1.26, `math`, `math/rand/v2` (the FX generator from Plan 03), `charm.land/lipgloss/v2`.

**Spec:** `design.md` (§16, §18, §19, §20, §21, §22, §23, §24, §44, §49.5)

## Global Constraints

- Effects never modify game state and never delay gameplay for animation (§14, §44).
- §33's tree is the package structure, not a filename whitelist: one small file per subsystem inside the existing packages, no new package, no file over a few hundred lines.
- Screen shake never exceeds roughly one cell (§44) and lasts ~80ms (§18.3).
- Never obscure the active piece; never let particles permanently alter the rendered board (§44).
- Particle integration per step: `position += velocity × dt; velocity += acceleration × dt; velocity *= drag; life -= dt`. Particles die at `life <= 0` or outside the viewport. No collision detection (§23).
- A few hundred particles must be trivial; reuse slices; no goroutine per particle or per frame (§38).
- `--reduced-motion` suppresses screen shake, hyperdrive acceleration, and shockwaves while leaving colour, trails, and particles alone (§49.5).
- Shockwaves last ~300ms and are used sparingly (§24).
- Banners must not block gameplay input (§20).
- Board readability remains sacred as combos escalate (§21).

## Review Focus

1. **Sustained four-line clears** — a good player produces one every few seconds. The particle pool must be capped with oldest-first eviction so a long session cannot grow it without bound or degrade the frame. *(Task 1)*
2. **Particles at the viewport edge** — a float position of `-0.4` truncates to `0` and `W-0.1` truncates to `W-1`, but `-0.6` must not wrap to the opposite side or index out of range. Emission near a wall is the common case, not the rare one. *(Task 1)*
3. **`--reduced-motion` actually reduces** — assert the shake offset is always `(0,0)`, the hyperdrive multiplier is always `1.0`, and no shockwave ever exists, while particles and trails still appear. This is an accessibility promise, not a nicety. *(Task 6)*
4. **Simultaneous events** — one hard drop can clear four lines, change the combo, and level up on the same frame. Banners must queue rather than overdraw, and the combined effect must not cover the active piece. *(Task 5)*
5. **Clear overlay versus the new piece** — the 220ms clear animation draws in rows the board has already collapsed, and a new piece can enter those rows during it. The overlay must yield to the active piece and to locked cells, every frame, without exception. *(Task 3)*

---

### Task 1: Particle simulation

**Files:**
- Create: `internal/fx/particle.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/particle_test.go`

**Interfaces:**
- Produces:
  ```go
  const MaxParticles = 600

  type Particle struct {
      X, Y       float64   // board-local cells (fractional)
      VX, VY     float64   // cells per second
      Life       float64   // seconds
      MaxLife    float64
      Glyph      rune
      Brightness float64   // 0..1
      Hue        ParticleHue
  }
  type ParticleHue int
  const (HueDebris ParticleHue = iota; HueSpark; HueMeteor; HueStellar)

  func (w *World) Particles() []Particle
  func (w *World) emit(p Particle)
  func (w *World) emitBurst(x, y float64, n int, spread, speed float64, hue ParticleHue)
  func (w *World) emitRadial(x, y float64, n int, speed float64, hue ParticleHue)
  ```

Forces, applied in `Advance` (§23): gravity `+14 cells/s²` on `VY`, drag `0.90^(dt*60)`
on both components, plus whatever radial impulse the emitter gave. Life ticks down;
dead particles and particles outside `-1 <= X <= Width` / `-1 <= Y <= Height` are
compacted out of the slice in place.

Glyphs come from a per-hue set: debris `· * ✦ +` (§18.2), sparks `· ˚ +`,
meteors `* ✦ ·`, stellar `✧ ✦ *`. In ASCII mode every set collapses to `. * + :`.

The pool is capped at `MaxParticles`; `emit` on a full pool overwrites the oldest
entry rather than growing, so worst-case memory and worst-case frame cost are both
fixed (Review Focus 1).

- [ ] **Step 1: Write the failing tests**

```go
func TestParticleIntegratesPositionFromVelocity(t *testing.T)
// One particle at (5,5) with VX=2, VY=0: after Advance(500ms), X is ~6 (drag
// makes it slightly less), Y has increased by gravity.

func TestDragSlowsParticles(t *testing.T)
// |VX| after 1s is less than half the initial value.

func TestParticlesDieAtZeroLife(t *testing.T)
// MaxLife 200ms: Particles() is empty after Advance totalling 250ms.

func TestParticlesOutsideTheViewportAreCulled(t *testing.T)
// Emit with VY = -200: within a few frames the particle is gone, and no
// coordinate ever produced a panic. Review Focus 2.

func TestEmitBurstProducesRequestedCount(t *testing.T)
// emitBurst(5, 10, 24, ...) -> 24 particles, all within 1 cell of (5,10),
// with a spread of directions (not all identical VX).

func TestEmitRadialSpreadsEvenly(t *testing.T)
// 16 particles: their velocity angles cover all four quadrants.

func TestPoolIsCappedWithOldestEviction(t *testing.T)
// Emit 2000 particles in one frame: len(Particles()) == MaxParticles, and the
// survivors are the last 600 emitted (check a marker in Brightness).
// Review Focus 1.

func TestParticleSimulationIsDeterministic(t *testing.T)
// Two worlds, same FX seed, same event sequence, same dt sequence: identical
// particle slices after 100 frames.

func TestASCIIParticlesAreASCII(t *testing.T)

func TestDisabledWorldEmitsNothing(t *testing.T)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run Particle -v`
Expected: FAIL — undefined: `Particles`.

- [ ] **Step 3: Implement**

`particle.go` plus the integration call in `World.Advance`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/particle.go internal/fx/world.go internal/fx/particle_test.go
git commit -m "feat(fx): terminal-space particle simulation with a fixed pool"
```

---

### Task 2: Hard-drop impact and screen shake

**Files:**
- Create: `internal/fx/shake.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/shake_test.go`, `internal/fx/impact_test.go`

**Interfaces:**
- Produces:
  ```go
  var ShakePattern = [5][2]int{{0, 1}, {-1, 0}, {1, 0}, {0, -1}, {0, 0}}
  const ShakeStep = 16 * time.Millisecond   // 5 steps ~ 80ms (§18.3)
  func (w *World) ShakeOffset() (dx, dy int)   // (0,0) when idle or reduced-motion
  func (w *World) shake(strength int)          // 1 normal, 2 = replay the pattern twice
  ```

`EvPieceHardDropped` now fires all four of §18's parts: the trail (Plan 03 Task 4),
`emitBurst` of `8 + 3*columns` debris particles along the contact row with upward-
and-outward velocity, `shake(1)`, and the border flash (Plan 03 Task 3). A
four-line clear calls `shake(2)` — §20's "larger screen shake", still one cell of
displacement, just for longer.

The offset is a lookup into `ShakePattern` by elapsed shake time, so it is
deterministic and provably bounded to one cell — no random jitter, which §44
requires.

- [ ] **Step 1: Write the failing tests**

```go
func TestShakeWalksTheSpecPatternThenStops(t *testing.T)
// shake(1); sample ShakeOffset() every 16ms: the five pattern entries in order,
// then (0,0) forever.

func TestShakeNeverExceedsOneCell(t *testing.T)
// Over the whole pattern at strength 1 and 2: |dx| <= 1 and |dy| <= 1 always.

func TestShakeStrengthTwoLastsLonger(t *testing.T)
// Strength 2 is still non-zero after 80ms and zero by 200ms.

func TestReducedMotionDisablesShake(t *testing.T)
// Options{ReducedMotion: true}: ShakeOffset() is (0,0) at every sample after
// shake(2). Review Focus 3.

func TestHardDropEmitsDebrisAndShakes(t *testing.T)
// Handle(EvPieceHardDropped): particles exist near the piece's final row,
// ShakeOffset() is non-zero, Border().Flash == 1, trails exist.

func TestHardDropWithZeroFallStillImpacts(t *testing.T)
// Count == 0 (piece already grounded): debris and shake still happen, no panic.

func TestDisabledWorldDoesNotShake(t *testing.T)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run 'Shake|Impact|HardDrop' -v`
Expected: FAIL — undefined: `ShakeOffset`.

- [ ] **Step 3: Implement**

`shake.go` and the expanded `EvPieceHardDropped` case in `Handle`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/shake.go internal/fx/world.go internal/fx/shake_test.go internal/fx/impact_test.go
git commit -m "feat(fx): hard-drop debris and bounded deterministic screen shake"
```

---

### Task 3: Line-clear supernova

**Files:**
- Create: `internal/fx/clearanim.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/clearanim_test.go`

**Interfaces:**
- Produces:
  ```go
  const ClearAnimTotal = 220 * time.Millisecond
  type ClearPhase int
  const (PhaseNone ClearPhase = iota; PhaseCriticalMass; PhaseSupernova; PhaseCollapse)
  type ClearAnim struct {
      Rows  []int      // board-local rows, as cleared
      Age   time.Duration
      Count int        // lines cleared, 1..4
  }
  func (w *World) ClearAnims() []ClearAnim
  func (a ClearAnim) Phase() ClearPhase
  func (a ClearAnim) Progress() float64   // 0..1 within the whole animation
  // Glyph for one cell of an animating row, given phase and distance from centre.
  func ClearGlyph(a ClearAnim, col int, ascii bool) rune
  ```

Phases (§19), by age: `0–70ms` critical mass, `70–150ms` supernova, `150–220ms`
collapse. `ClearGlyph` implements §19's three pictures — critical mass dims the row
from the edges inward (`▓` outside, `█` in the middle), supernova drives a bright
front outward from the centre (`✦` at the front, `██` inside, `░░` behind), and
collapse returns a sparse debris glyph or a space.

At the start of `PhaseCollapse` the row's cells become particles: `emitBurst` per
column with `VX = (col - 4.5) * 3.5` so debris inherits horizontal velocity from
its position relative to centre (§19), and `VY` slightly upward.

The board has already collapsed underneath — the engine cleared the rows the
instant the piece locked, because §44 forbids delaying gameplay for animation. The
overlay therefore paints §19's spectacle over the rows' original positions while
real cells sit beneath it, and it must yield to any locked or active cell, which is
Review Focus 5 and is enforced in Task 6's draw function rather than here.

- [ ] **Step 1: Write the failing tests**

```go
func TestClearEventStartsAnAnimation(t *testing.T)
// Handle(EvLinesCleared{Rows: []int{20, 21}, Count: 2}): one ClearAnim with those
// rows and Age 0.

func TestPhasesFollowSpecTiming(t *testing.T)
// Age 0 and 69ms -> PhaseCriticalMass; 71ms and 149ms -> PhaseSupernova;
// 151ms and 219ms -> PhaseCollapse; 221ms -> the anim is gone.

func TestSupernovaFrontMovesOutward(t *testing.T)
// Sample ClearGlyph across all 10 columns early and late in PhaseSupernova: the
// bright glyph's column indices are nearer the centre early and nearer the edges
// late.

func TestCollapseEmitsDebrisWithOutwardVelocity(t *testing.T)
// After entering PhaseCollapse: particles exist; those left of centre have
// negative VX and those right of centre positive. (§19)

func TestDebrisIsEmittedOncePerAnimation(t *testing.T)
// Particle count does not grow on every frame of PhaseCollapse.

func TestConcurrentAnimationsAreIndependent(t *testing.T)
// Two clears 100ms apart: two ClearAnims with different Ages, each expiring on
// its own schedule.

func TestASCIIClearGlyphsAreASCII(t *testing.T)

func TestDisabledWorldHasNoClearAnim(t *testing.T)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run Clear -v`
Expected: FAIL — undefined: `ClearAnims`.

- [ ] **Step 3: Implement**

`clearanim.go` plus the `EvLinesCleared` case in `Handle`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/clearanim.go internal/fx/world.go internal/fx/clearanim_test.go
git commit -m "feat(fx): three-phase supernova line-clear animation"
```

---

### Task 4: Hyperdrive and shockwaves

**Files:**
- Create: `internal/fx/hyperdrive.go`, `internal/fx/shockwave.go`
- Modify: `internal/fx/world.go`, `internal/fx/starfield.go`
- Test: `internal/fx/hyperdrive_test.go`, `internal/fx/shockwave_test.go`

**Interfaces:**
- Produces:
  ```go
  const HyperdriveTotal = 1100 * time.Millisecond
  func (w *World) hyperdrive()                // triggers the sequence
  func (w *World) HyperMultiplier() float64   // 1.0 idle; 0.0 during the pause
  func (w *World) HyperStretch() float64      // 0..1, renderer draws '|' streaks

  const ShockwaveLife = 300 * time.Millisecond
  type Shockwave struct { X, Y float64; Radius, MaxRadius float64; Life, MaxLife float64 }
  func (w *World) Shockwaves() []Shockwave
  func (w *World) shockwave(x, y, maxRadius float64)
  func ShockGlyph(progress float64, ascii bool) rune   // · ○ ◌ ◯ (§24)
  ```

Hyperdrive timeline, exactly §16's keyframes, linearly interpolated between them:

```
   0ms  multiplier 0.0   stretch 0.0    (stars pause)
  50ms  multiplier 0.0   stretch 1.0    (stars stretch)
 100ms  multiplier 6.0   stretch 1.0    (violent acceleration)
 500ms  multiplier 9.0   stretch 1.0    (peak)
 800ms  multiplier 3.0   stretch 0.4    (decay)
1100ms  multiplier 1.0   stretch 0.0    (normal)
```

`Starfield` multiplies its per-layer speed by `SpeedScale() * HyperMultiplier()`.
Triggers (§16): a four-line clear, a combo reaching 5 or more, and a new high score
(`Snapshot.IsHighScore` rising within the session). Under `ReducedMotion`,
`hyperdrive()` is a no-op and `HyperMultiplier` stays `1.0`.

Shockwaves are used only for four-line clears and combo ≥ 5 — §24's "use sparingly"
— radiate from the board centre, and are suppressed entirely under
`ReducedMotion`. The ring is drawn as glyphs on an approximate ellipse with an
x-radius twice the y-radius, because a terminal cell is about twice as tall as it
is wide.

- [ ] **Step 1: Write the failing tests**

```go
func TestHyperdriveFollowsSpecKeyframes(t *testing.T)
// Sample HyperMultiplier at 0, 50, 100, 500, 800, 1100ms: matches the table
// within 0.1, and returns to exactly 1.0 after 1100ms.

func TestStarsPauseThenSprint(t *testing.T)
// Star Y movement in the first 50ms is ~0; movement in the 400ms after 100ms is
// several times a normal 400ms.

func TestFourLineClearTriggersHyperdrive(t *testing.T)
func TestComboFiveTriggersHyperdrive(t *testing.T)
func TestNewHighScoreTriggersHyperdriveOnce(t *testing.T)
// IsHighScore rising triggers once, not on every subsequent frame.

func TestReducedMotionKeepsMultiplierAtOne(t *testing.T)
// Review Focus 3.

func TestShockwaveExpandsAndExpires(t *testing.T)
// Radius grows monotonically; Shockwaves() is empty after 350ms.

func TestShockwaveGlyphProgression(t *testing.T)
// ShockGlyph at 0, 0.35, 0.7, 1.0 returns the four §24 glyphs in order.

func TestReducedMotionSuppressesShockwaves(t *testing.T)
// A four-line clear produces none. Review Focus 3.

func TestShockwavesAreRare(t *testing.T)
// Twenty single-line clears produce zero shockwaves.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run 'Hyper|Shock|Star' -v`
Expected: FAIL — undefined: `HyperMultiplier`.

- [ ] **Step 3: Implement**

Both files plus the starfield multiplier hook and the `Handle` triggers.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/hyperdrive.go internal/fx/shockwave.go internal/fx/starfield.go internal/fx/world.go internal/fx/hyperdrive_test.go internal/fx/shockwave_test.go
git commit -m "feat(fx): hyperdrive sequence and sparing radial shockwaves"
```

---

### Task 5: Banners, level-up notice, and combo escalation

**Files:**
- Create: `internal/fx/banner.go`
- Modify: `internal/fx/world.go`, `internal/flavor/messages.go`
- Test: `internal/fx/banner_test.go`

**Interfaces:**
- Produces:
  ```go
  type BannerStyle int
  const (BannerGiant BannerStyle = iota; BannerNotice)
  type Banner struct {
      Title, Subtitle string
      Style BannerStyle
      Age, Life time.Duration
  }
  func (w *World) Banners() []Banner        // at most 2; index 0 draws on top
  func (w *World) HudPulse() float64        // 0..1, non-zero from combo 4 (§21)
  func (w *World) Intensity() float64       // 0..1 overall chaos, drives densities
  ```
  and in `flavor`: `func FourLineBanner(rng *rand.Rand) string`,
  `func LevelSubtitle(rng *rand.Rand) string`.

Four-line clear (§20): a `BannerGiant` with `Life = 700ms`, title from §20's four
options (`✦ EVENT HORIZON ✦`, `QUADRUPLE COSMIC INCIDENT`,
`FOUR ROWS HAVE LEFT THE CHAT`, `SPACE-TIME HAS FILED A COMPLAINT`), fired together
with hyperdrive, `shake(2)`, a shockwave, an `emitRadial` eruption, `HudPulse`, and
a temporary star-density increase via `Intensity()`.

Level up (§22): a `BannerNotice` with `Life = 1400ms`, title
`GRAVITY ANOMALY DETECTED` / `LEVEL 08`, subtitle from §22's three options. It
slides in over the first 150ms and fades over the last 300ms, and it never pauses
anything.

Combo escalation (§21): combo 2 → sparks (`emitBurst`, `HueSpark`), 3 → meteors,
4 → `HudPulse` begins, 5+ → hyperdrive, a shockwave, and a `BannerNotice` carrying
`flavor.ComboLine(combo)`. `Intensity()` is `min(1, 0.15*combo + 0.4*clearAnims + flash)`
and multiplies star density and burst sizes — the single knob §21's "effects
intensify" hangs on.

The queue holds at most two banners; a new giant banner evicts a notice, a new
notice never evicts a giant. That is Review Focus 4: simultaneous events produce a
stack with a defined order rather than two boxes fighting for the same rows.

- [ ] **Step 1: Write the failing tests**

```go
func TestFourLineClearRaisesEverything(t *testing.T)
// One EvLinesCleared{Count: 4}: a BannerGiant exists with one of §20's four
// titles, HyperMultiplier != 1, ShakeOffset != (0,0), a shockwave exists,
// particles > 40, Intensity() > 0.5.

func TestGiantBannerLivesSevenHundredMilliseconds(t *testing.T)
// Present at 690ms, gone at 710ms. (§20)

func TestLevelUpBannerShowsTheNewLevel(t *testing.T)
// EvLevelChanged{Count: 8}: title contains "LEVEL 08", subtitle is one of §22's
// three, Style == BannerNotice.

func TestComboThresholds(t *testing.T)
// combo 2: sparks only, no HudPulse. combo 3: meteor particles. combo 4:
// HudPulse > 0. combo 5: hyperdrive active and a banner with "COMBO 5".

func TestSimultaneousEventsQueueRatherThanOverdraw(t *testing.T)
// One Handle with [HardDropped, Locked, LinesCleared(4), ComboChanged(3),
// LevelChanged(9)]: len(Banners()) == 2, Banners()[0].Style == BannerGiant.
// Review Focus 4.

func TestNoticeNeverEvictsAGiant(t *testing.T)
// Giant banner live, then a level-up: the giant is still index 0.

func TestIntensityDecaysBackToZero(t *testing.T)
// After a four-line clear and 3s of frames: Intensity() == 0.

func TestBannersDoNotBlockAnything(t *testing.T)
// While banners are live, game Fingerprint is unchanged by FX calls, and
// Handle/Advance return in bounded time (no sleeps). (§20)

func TestDisabledWorldHasNoBanners(t *testing.T)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run 'Banner|Combo|Intensity|Level' -v`
Expected: FAIL — undefined: `Banners`.

- [ ] **Step 3: Implement**

`banner.go`, the flavor additions, and the `Handle` cases for `EvLinesCleared`,
`EvComboChanged`, and `EvLevelChanged`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/banner.go internal/fx/world.go internal/flavor/messages.go internal/fx/banner_test.go
git commit -m "feat(fx): banners, level-up notice, and combo escalation"
```

---

### Task 6: Draw the violence

**Files:**
- Modify: `internal/render/fxdraw.go`, `internal/render/frame.go`, `internal/render/palette.go`, `internal/render/golden_test.go`, `internal/render/testdata/*.golden`
- Test: `internal/render/violence_test.go`

**Interfaces:**
- Produces:
  ```go
  func DrawParticles(g *Grid, ps []fx.Particle, p Palette, ox, oy int, occupied func(x, y int) bool)
  func DrawClearAnims(g *Grid, as []fx.ClearAnim, p Palette, ox, oy int, occupied func(x, y int) bool)
  func DrawShockwaves(g *Grid, ws []fx.Shockwave, p Palette, ox, oy int)
  func DrawBanners(g *Grid, bs []fx.Banner, p Palette)
  func DrawHyperStreaks(g *Grid, stretch float64, stars []fx.Star, p Palette, board Rect)
  func (p Palette) ParticleStyle(h fx.ParticleHue, bright float64) lipgloss.Style
  func (p Palette) PulseStyle(base lipgloss.Style, pulse float64) lipgloss.Style
  ```
  `Render` applies `FX.ShakeOffset()` to the board's origin only — the HUD, title,
  mission line, and banners do not move, so a shake reads as the board jolting
  inside a stable frame rather than the whole terminal tearing (§18.3, §44).

`occupied(x, y)` reports board-local cells filled by a locked block, the active
piece, or the ghost. Every board-local FX draw consults it and skips those cells.
One helper, four callers, and §44's "never obscure the active piece" holds for
particles, trails, stars, and the clear overlay at once — including Review Focus 5,
where a new piece has already entered the animating rows.

`DrawBanners` centres a giant banner on the board with a bright bordered box and
places a notice two rows below the board's top edge, both clipped by the grid.
`HudPulse` feeds `Palette.PulseStyle(base, pulse)`, which brightens and bolds HUD
values on the beat (§21 combo 4).

- [ ] **Step 1: Write the failing tests**

```go
func TestParticlesDrawInBoardLocalSpaceAndClip(t *testing.T)
// A particle at (0.2, 21.4) lands on the board's bottom-left interior cell; one
// at (-3, 30) draws nothing and does not panic. Review Focus 2.

func TestParticlesNeverCoverBlocksOrTheActivePiece(t *testing.T)
// Particles placed on a locked cell, a ghost cell, and an active cell: all three
// positions still show their block/ghost glyph.

func TestClearOverlayYieldsToTheActivePiece(t *testing.T)
// A ClearAnim on rows 20-21 with the active piece already occupying a cell in
// row 21: that cell shows the piece glyph. Review Focus 5.

func TestShakeMovesOnlyTheBoard(t *testing.T)
// Render with a forced shake offset of (0,1): the board's border line moves one
// row; the title, mission line, and stats stay on the same rows.

func TestShakeNeverPushesTheBoardOutOfTheFrame(t *testing.T)
// At 40x24 with every pattern offset: line count <= 24, widths <= 40, board box
// still complete.

func TestGiantBannerIsCentredAndReadable(t *testing.T)
// Output contains the banner title inside a bordered box near the board centre,
// and the box is at most the board's width.

func TestBannerDoesNotCoverTheActivePiece(t *testing.T)
// With the active piece at spawn height, the banner rows do not overlap the
// piece's rows; if geometry forces overlap, the piece wins. Review Focus 4.

func TestGoldenViolenceScenes(t *testing.T)
// New golden scenes, each with a deterministic FX world advanced to a fixed age:
//   impact       80x30 mid-shake, debris live
//   supernova    80x30 PhaseSupernova on two rows
//   fourline     80x30 giant banner + hyperdrive + shockwave
//   levelup      80x30 notice banner
//   reduced      80x30 same events as fourline with ReducedMotion
//   ascii-fx     80x30 fourline in ModeASCII
// Geometry assertions as in Plan 02 Task 8 for every scene.

func TestReducedMotionSceneHasNoShakeAndNoRings(t *testing.T)
// The reduced scene: board box starts on the same row as a no-FX render, no
// shockwave glyph anywhere, and particles are still present. Review Focus 3.

func TestASCIIFXSceneIsPureASCII(t *testing.T)
// Every rune of the ascii-fx scene < 128.

func TestRenderStillDoesNotMutateGameState(t *testing.T)
// Fingerprint before and after rendering all scenes twice.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -v`
Expected: FAIL — undefined: `DrawParticles`.

- [ ] **Step 3: Implement**

The five draw functions, the `occupied` helper, `PulseStyle`, the shake offset
application, and the pipeline order (§37: particles and clear overlay at step 6,
shockwaves and hyper streaks at step 9, banners at step 10). Regenerate goldens
with `-update` and read each new file.

- [ ] **Step 4: Run tests, then feel it**

Run: `go test ./... -count=1` — expect PASS.
Run: `./cosmic-tetris --seed 8675309`, then hard drop something. §18's bar is
"dropping a refrigerator from orbit"; if it does not read that way, tune the debris
count and border flash, not the shake amplitude — one cell is the ceiling.
Then clear four lines at once. §43's bar is an involuntary reaction, and §20's is a
major astronomical event. Then run `./cosmic-tetris --reduced-motion` and confirm
the same four-line clear is still exciting and completely still.

- [ ] **Step 5: Commit**

```bash
git add internal/render
git commit -m "feat(render): draw particles, supernovas, shockwaves, and banners"
```

---

## Done when

A hard drop produces a trail, debris, one cell of shake, and a border flash on the
frame the key was pressed. A line clear produces §19's three phases and debris that
flies outward from centre. A four-line clear produces hyperdrive, a bigger shake, a
racing border gradient, an eruption, a HUD flash, denser stars, and a giant banner
for 700ms — simultaneously, without blocking input. `--reduced-motion` removes the
shake, the hyperdrive acceleration, and the shockwaves and nothing else. Every
board-local effect yields to the active piece, and `go test ./... -count=1` is
green.
