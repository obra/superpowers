# Cosmic Tetris — Plan 3: Cosmic Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the universe lose its shit around the player — starfield, animated border, ion trails, hard-drop impact, particle physics, supernova line clears, shockwaves, hyperdrive, four-line spectacle, combo escalation, level-up anomalies, mission control commentary, boot sequence, and a game-over black hole — without a single effect touching game state or delaying input.

**Architecture:** A new package `internal/fx` runs an independent simulation: it observes `game.Event` values and elapsed `dt`, and produces an `fx.Overlay` — two sparse glyph layers (one board-local, one frame-global) plus a handful of scalars (shake offset, border phase and energy, banner text). `internal/render` composites that overlay; it is the only place FX becomes pixels. FX owns a second `*rand.Rand`, never the game's. `internal/flavor` is a separate tiny state machine for the mission-control channel. Data flows one way: `game → events → fx → overlay → render`. Nothing flows back.

**Tech Stack:** Go 1.26, `charm.land/lipgloss/v2` (color math in render only), `charm.land/bubbles/v2` (boot spinner, help), `charm.land/bubbletea/v2`.

**Spec:** `design.md` (this plan implements §9 visual effect, §14–§29, §30 star drift, §43, §44, §45, §42 Phases 3–5, and pinned decisions §49.4, §49.5)

## Global Constraints

- **FX may observe game events. It may never modify `GameState`** (§14). `internal/fx` never accepts a `*game.Game`; it takes `game.Event` values and read-only copies. There is a grep-based check for this in Task 1.
- **Two RNGs, never crossed** (§35, §49.6). `fx.World` and `flavor.Channel` each own an independent `*rand.Rand` seeded from the FX seed. Nothing in `internal/fx` or `internal/flavor` may reach the game's generator, and the game's logical state must be identical with FX on and FX off.
- Import direction is fixed: `render` imports `fx`; `fx` must never import `render`. FX therefore carries its own `ASCII bool` in `Config` rather than reusing `render.Mode`.
- The restraint rules in §44 are hard requirements, each with a test: never obscure the active piece; never make controls lag; never delay gameplay for animation; never require reading flavor text; never let random effects alter gameplay; never let screen shake exceed roughly one cell; never let particles permanently alter the rendered board; never let comedy overwhelm playability.
- Performance rules (§38): no goroutine per particle or per frame, no filesystem access during gameplay, no synchronous per-frame logging. A few hundred particles must be trivial; `MaxParticles = 600` is the hard cap and emitters drop overflow rather than growing the slice.
- Board readability is sacred (§15, §21). Background starfield never draws inside the board interior; board-local FX never covers the active piece.
- Glyph pinning (§49.4) still holds, and every FX glyph must have an ASCII fallback — nothing in `ModeASCII` may emit a rune ≥ 128.
- `--no-fx` disables the FX world entirely (`Compose()` returns nil): no starfield, particles, trails, shake, banners, or hyperdrive. Mission control and the static board border remain, because they are flavor and chrome, not motion. The boring mode must still be a good game (§32).
- `--reduced-motion` suppresses exactly three things (§49.5): screen shake, hyperdrive acceleration, and shockwaves. Color, trails, and particles stay.
- Effect timings are spec constants, not taste: hold streak ~120ms (§9), trails 100–160ms (§17), shake 80ms (§18), line clear 220ms total with phases at 70/150/220ms (§19), four-line banner 700ms (§20), shockwave 300ms (§24), hyperdrive envelope 0/50/100/500/800/1100ms (§16), game over 0–300/300–900/900–1300ms (§28), boot ~1s (§29).
- The golden layout tests from Plan 2 must keep passing unchanged with FX off. Do not renegotiate that layout contract.
- Commit after every task. Every task ends with `go test ./...` green and `go vet ./...` clean.

## Review Focus

Five failure modes this layer invites that no obvious task test covers. Each has a test added to the task that owns the code.

1. **A particle at a nonsense coordinate** — a NaN velocity, a position of 1e9, a negative row — must be dropped at compositing time, not indexed into a layer slice. → Task 1.
2. **Resize while animations are running.** Layers sized to the old frame, particles beyond the new bounds, a banner centered on a width that no longer exists: resizing must not panic and must not leak the old buffers. → Task 1.
3. **A huge `dt`** (a backgrounded terminal, a suspended process) must not run a thousand simulation substeps or spawn a starfield's worth of new stars. FX clamps `dt` itself, independent of the app's clamp. → Task 1.
4. **FX drawing over the active piece.** §44's first rule needs an actual test: with the board layer deliberately filled everywhere, the composited frame must still show the active piece's cells. → Task 3.
5. **FX changing the game.** Two runs with the same seed and the same canned input/dt script — one with FX enabled, one with `--no-fx` — must produce byte-identical `game.Snapshot()` output. → Task 9.

---

## File Structure

| File | Responsibility |
|---|---|
| `internal/fx/world.go` | `Config`, `World`, `NewWorld`, `Resize`, `Handle`, `Advance`, `Compose`, `Intensity`, the dt clamp, the particle cap. |
| `internal/fx/layer.go` | `Cell`, `Layer` (sparse glyph buffer with bounds-safe writes), `Overlay`. |
| `internal/fx/particle.go` | `Particle`, the physics step, emitters (burst, debris, eruption), glyph sets. |
| `internal/fx/starfield.go` | Three-layer starfield, level scaling, hyperdrive envelope, shooting stars. |
| `internal/fx/events.go` | Event ingestion: which `game.Event` triggers which effect, with the trigger tables. |
| `internal/fx/trails.go` | Piece ion trails and the hard-drop vertical trail. |
| `internal/fx/clear.go` | Line-clear supernova phases, shockwaves, four-line sequence, banners. |
| `internal/fx/shake.go` | Deterministic screen-shake pattern and the border energy envelope. |
| `internal/fx/anomaly.go` | Level-up notice, combo escalation state, HUD pulse. |
| `internal/fx/gameover.go` | Freeze, inward collapse, black-hole art, panel gating. |
| `internal/flavor/messages.go` | `Channel`: mission-control text, priorities, dwell times, easter eggs. |
| `internal/render/composite.go` | Applies an `fx.Overlay` to the assembled frame: layers, shake, border gradient, banners. |
| `internal/render/boot.go` | Boot-sequence screen (§29). |
| `internal/app/*` | Wiring: FX world lifecycle, event forwarding, `StateBoot`, flavor channel. |

---

## Task 1: FX core — config, layers, overlay, world clock, particle physics

**Files:**
- Create: `internal/fx/world.go`, `internal/fx/layer.go`, `internal/fx/particle.go`, `internal/fx/layer_test.go`, `internal/fx/world_test.go`, `internal/fx/particle_test.go`

**Interfaces:**
- Consumes: `game.Event`, `game.Piece`, `game.PieceKind` (Plan 1); `render.BoardInnerWidth`/`VisibleRows` values are *not* imported — FX takes board dimensions as parameters.
- Produces:
  ```go
  type Config struct {
      Enabled       bool // false for --no-fx
      ReducedMotion bool // --reduced-motion
      ASCII         bool // --ascii or detected ASCII mode
  }

  type Cell struct {
      Rune rune   // zero value means "nothing here"
      Hex  string // "#rrggbb"; empty means "use the default FX color"
      Bold bool
  }

  type Layer struct{ /* w, h, cells []Cell */ }
  func NewLayer(w, h int) *Layer
  func (l *Layer) Size() (w, h int)
  func (l *Layer) Resize(w, h int)     // reallocates only when the size changed; clears
  func (l *Layer) Clear()
  func (l *Layer) InBounds(x, y int) bool
  func (l *Layer) Set(x, y int, c Cell)          // no-op outside bounds
  func (l *Layer) SetF(x, y float64, c Cell)     // rounds; no-op on NaN/Inf/out of bounds
  func (l *Layer) SetPair(cellX, y int, pair string, hex string, bold bool) // 2-column block
  func (l *Layer) At(x, y int) Cell

  type Overlay struct {
      Board  *Layer // board interior: boardW terminal columns × boardH rows
      Global *Layer // whole frame

      ShakeX, ShakeY int     // always within [-1,1] (§44)
      BorderPhase    float64 // 0..1, slow hue walk (§25)
      BorderEnergy   float64 // 0..1, event excitement
      HUDPulse       float64 // 0..1, combo pulse (§21)

      Banner    string // §20 four-line banner, "" when none
      BannerSub string
      Notice    []string // §22 level-up notice lines, nil when none

      ShowGameOverPanel bool // §28: the final panel waits for the collapse
      Frozen            bool // §28 phase 1: the board is held still
  }

  const (
      MaxParticles  = 600
      MaxFXDelta    = 100 * time.Millisecond // FX's own dt clamp (Review Focus #3)
      ParticleDrag  = 0.94                   // per 1/60s
      ParticleGravity = 14.0                 // rows per second squared
  )

  type Space uint8
  const (SpaceBoard Space = iota; SpaceFrame)

  type Particle struct {
      X, Y       float64
      VX, VY     float64
      AX, AY     float64
      Life       float64 // seconds remaining
      MaxLife    float64
      Glyph      rune
      Hex        string
      Brightness float64 // 0..1, recomputed from Life/MaxLife each step
      Space      Space
  }

  func (w *World) Emit(p Particle)                // dropped silently when at MaxParticles
  func (w *World) ParticleCount() int
  func stepParticles(ps []Particle, dt float64) []Particle // in place, compacting dead ones

  type World struct{ /* unexported */ }
  func NewWorld(seed int64, cfg Config) *World
  func (w *World) Resize(frameW, frameH, boardW, boardH int)
  func (w *World) Advance(dt time.Duration)
  func (w *World) Handle(ev game.Event)  // Task 4 onward fill in the trigger table
  func (w *World) Compose() *Overlay     // nil when !cfg.Enabled
  func (w *World) Intensity() float64    // 0..1: how excited the universe currently is
  func (w *World) Elapsed() time.Duration
  ```

**Design notes:** `Advance` clamps `dt` to `MaxFXDelta`, accumulates elapsed time, steps particles once with the clamped `dt` (a single step — this is a terminal, not a physics engine), then advances the per-effect timers that later tasks add. `Compose` clears both layers and redraws from current state every frame; it never accumulates, which is how §44's "particles never permanently alter the rendered board" is satisfied structurally. `stepParticles` implements §23 exactly: `pos += v*dt; v += a*dt; v *= drag^(dt*60); life -= dt`, dropping particles whose life is spent, whose coordinates are non-finite, or that are far outside the viewport.

- [ ] **Step 1: Write the failing tests**

`internal/fx/layer_test.go`:

```go
func TestLayerWritesAndReads(t *testing.T)
func TestLayerSetOutsideBoundsIsANoOp(t *testing.T)
// (-1,0),(0,-1),(w,0),(0,h),(1000,1000): no panic, layer stays empty

// Review Focus #1
func TestLayerSetFRejectsNonFiniteAndAbsurdCoordinates(t *testing.T)
// math.NaN(), math.Inf(1), math.Inf(-1), 1e9, -1e9 in either coordinate:
// no panic, nothing written

func TestLayerSetPairWritesTwoColumns(t *testing.T)
// SetPair(3, 5, "██", "#ffffff", true): columns 6 and 7 of row 5 are set

func TestLayerSetPairAtTheRightEdgeClips(t *testing.T)
// a layer of odd width: SetPair on the last cell writes what fits, no panic

// Review Focus #2
func TestLayerResizeReallocatesAndClears(t *testing.T)
// write, Resize to a bigger size: empty and correctly sized; Resize smaller:
// empty and correctly sized; Resize to the same size: still valid and cleared;
// Resize(0,0) then Set: no panic
```

`internal/fx/particle_test.go`:

```go
func TestParticleMovesUnderVelocityAndGravity(t *testing.T)
// one particle, VY 0, gravity accel: after 0.5s Y increased and VY > 0

func TestParticleDragReducesSpeed(t *testing.T)
// VX 10, no accel: after 1s |VX| < 10

func TestParticlesDieWhenLifeRunsOut(t *testing.T)
// Life 0.1: after stepping 0.2s the slice is empty

func TestParticlesFarOutsideTheViewportAreDropped(t *testing.T)
// Y = 10000: dropped on the next step

func TestNonFiniteParticlesAreDropped(t *testing.T)
// VX NaN: dropped rather than propagating NaN into X

func TestBrightnessTracksRemainingLife(t *testing.T)
// Brightness ~1 at spawn, < 0.5 past the halfway point, >= 0

func TestEmitRespectsTheParticleCap(t *testing.T)
// emit 5000: ParticleCount() == MaxParticles, no panic, no reallocation loop
```

`internal/fx/world_test.go`:

```go
func TestDisabledWorldComposesNothing(t *testing.T)
// Config{Enabled:false}: Compose() == nil after Advance and Handle calls

func TestComposeSizesLayersToTheFrame(t *testing.T)
// Resize(100,40,20,20) then Compose(): Global size 100x40, Board size 20x20

// Review Focus #2
func TestResizeDuringAnimationIsSafe(t *testing.T)
// emit 200 particles across the frame, Resize(20,10,20,20), Advance(16ms),
// Compose(): no panic, layer sizes updated

// Review Focus #3
func TestHugeDtIsClamped(t *testing.T)
// Advance(10*time.Second): Elapsed() advanced by at most MaxFXDelta, and the
// call completes within a 1s test deadline

func TestFXNeverTakesAPointerToGame(t *testing.T)
// go/parser over internal/fx/*.go: no *game.Game appears in any signature.
// Simplest form: read every .go file and assert !strings.Contains(src, "*game.Game")

func TestTwoWorldsWithTheSameSeedAgree(t *testing.T)
// two worlds, same seed, same Advance/Handle script: Compose() layers are
// cell-for-cell equal
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/fx/ -v`
Expected: build failure — `undefined: NewLayer`, `undefined: NewWorld`.

- [ ] **Step 3: Implement `layer.go`, `particle.go`, and the `world.go` shell**

`Handle` may be an empty switch for now; later tasks add cases. `Intensity` returns 0 for now.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./internal/fx/ -v && go vet ./...`
Expected: PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add internal/fx
git commit -m "feat(fx): overlay layers, particle physics, world clock with dt clamp"
```

---

## Task 2: Starfield with depth layers, level scaling, and hyperdrive

**Files:**
- Create: `internal/fx/starfield.go`, `internal/fx/starfield_test.go`
- Modify: `internal/fx/world.go` (own a starfield, advance it, draw it in `Compose`)

**Interfaces:**
- Produces:
  ```go
  type depth uint8
  const (depthFar depth = iota; depthMid; depthNear)

  // Densities: one star per N frame cells — far 1/60, mid 1/120, near 1/300.
  // Speeds in rows per second: far 0.6, mid 1.6, near 4.0 (§15).
  // Glyphs: far ".", mid "·˚", near "✦✧" (ASCII: far ".", mid ":", near "*+").

  func (w *World) StarCount() int

  // Hyperdrive (§16). Triggered by four-line clears, large combos, and new high
  // scores. The envelope, by elapsed time since the trigger:
  //   0–50ms      factor 0.0   (stars pause)
  //   50–100ms    factor 0.3   stretched glyphs ("|" / near stars elongate)
  //   100–500ms   factor ramps 0.3 → 8.0
  //   500–800ms   factor 8.0   (peak)
  //   800–1100ms  factor decays 8.0 → 1.0
  //   after       factor 1.0
  func hyperFactor(since time.Duration) float64
  func (w *World) TriggerHyperdrive()
  func (w *World) HyperActive() bool

  // Level scaling (§15): star speed multiplier 1 + 0.06*(level-1), capped at 2.5.
  func (w *World) SetLevel(level int)

  // Shooting star (§45): a rare diagonal streak, at most one at a time,
  // expected roughly once every 25 seconds of play.
  func (w *World) ShootingStarActive() bool
  ```

**Design notes:** stars live in frame coordinates and drift downward, wrapping to the top with a fresh random X when they pass the bottom. `Resize` rebuilds the star population for the new area, preserving nothing — that is fine and invisible. Under `ReducedMotion`, `hyperFactor` returns 1.0 always (§49.5 suppresses hyperdrive acceleration) but the starfield still drifts. The starfield draws into `Overlay.Global` only; the board interior is masked at composite time in Task 3, so the starfield is free to write anywhere.

- [ ] **Step 1: Write the failing tests**

`internal/fx/starfield_test.go`:

```go
func TestStarCountScalesWithArea(t *testing.T)
// Resize(80,24,...) gives more stars than Resize(40,12,...); both > 0

func TestStarsDriftDownwardAndWrap(t *testing.T)
// record star rows, Advance(1s): rows increased (mod wrap); every star stays
// inside the frame after Advance(30s worth of clamped steps)

func TestThreeDepthLayersExistWithDistinctSpeeds(t *testing.T)
// after Advance(1s) from a known state, the mean row delta for near > mid > far

func TestHigherLevelsMoveStarsFaster(t *testing.T)
// SetLevel(1) vs SetLevel(10): mean row delta over 1s is larger at level 10,
// and SetLevel(100) is not more than 2.5× the level-1 delta

func TestHyperFactorEnvelope(t *testing.T)
// table over the §16 timeline: 0ms => 0; 25ms => 0; 75ms => ~0.3;
// 500ms => 8.0; 700ms => 8.0; 1100ms => 1.0; 5s => 1.0;
// and the ramp is monotonically increasing across 100→500ms

func TestHyperdriveIsSuppressedUnderReducedMotion(t *testing.T)
// ReducedMotion world: TriggerHyperdrive then Advance(500ms): the mean star
// row delta matches the non-triggered baseline within 10%

func TestASCIIStarfieldUsesASCIIGlyphsOnly(t *testing.T)
// Config{ASCII:true}: every non-zero rune in the composed Global layer is < 128

func TestShootingStarIsRare(t *testing.T)
// advance 60 seconds of clamped frames with a fixed seed and count activations:
// at least 1 and at most 8
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/fx/ -run 'TestStar|TestThree|TestHigher|TestHyper|TestASCIIStar|TestShooting' -v`
Expected: build failure — `undefined: hyperFactor`.

- [ ] **Step 3: Implement `starfield.go` and hook it into `Advance`/`Compose`**

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/starfield.go internal/fx/starfield_test.go internal/fx/world.go
git commit -m "feat(fx): three-layer starfield with level scaling and hyperdrive envelope"
```

---

## Task 3: Composite the overlay into the frame and wire FX into the app

**Files:**
- Create: `internal/render/composite.go`, `internal/render/composite_test.go`
- Modify: `internal/render/render.go` (add `Scene.FX`, call the compositor), `internal/fx/world.go` (add `AdvancePaused`), `internal/app/model.go`, `internal/app/update.go`
- Test: `internal/app/update_test.go` (extend), `internal/fx/world_test.go` (extend)

**Interfaces:**
- Consumes: `fx.Overlay`, `fx.World` (Tasks 1–2); `render.Render` (Plan 2).
- Produces:
  ```go
  // Scene gains exactly one field:
  //   FX *fx.Overlay // nil when effects are off

  // AdvancePaused steps only what §30 permits while the game is suspended:
  // background stars drift very slowly (a 0.15 speed factor) and everything
  // else — gameplay particles, trails, shake, banners, timers — is frozen.
  func (w *World) AdvancePaused(dt time.Duration)

  // CompositeGlobal draws overlay.Global over the assembled frame, skipping any
  // frame cell that is not blank — the starfield fills gaps and never paints
  // over the board box, HUD, or text.
  func CompositeGlobal(frame string, o *fx.Overlay, p Palette) string

  // CompositeBoard draws overlay.Board over the 20 board-interior columns.
  // Cells occupied by the active piece are never overwritten (§44).
  func CompositeBoard(rows []string, o *fx.Overlay, active game.Piece, showPiece bool, p Palette) []string

  // ApplyShake shifts the given block by the overlay's shake offset, keeping the
  // block's outer dimensions unchanged (it clips, it does not grow).
  func ApplyShake(block string, dx, dy int) string

  // BorderStyleAt returns the style for border position i of total, given the
  // overlay's phase and energy: a slow hue walk through deep violet, electric
  // cyan, magenta, stellar blue, hot white (§25). energy 0 is the calm walk;
  // energy 1 races a bright gradient around the ring.
  func BorderStyleAt(i, total int, phase, energy float64, p Palette) lipgloss.Style
  ```

  ```go
  // internal/app
  type Model struct {
      // ... Plan 2 fields ...
      FX *fx.World
  }
  ```

**Design notes:** `Render`'s order is now exactly §37: layout → starfield (global layer, composited into blanks) → locked board → ghost → active → board-local FX → border → HUD → global FX → banners → mission control → controls. The compositor is where "blank cells only" is enforced for the global layer; the board compositor is where the active-piece mask is enforced.

App wiring: `NewModel` builds `fx.NewWorld(seed^0x5EED, fx.Config{...})` — a derived seed so the FX generator is reproducible but distinct from the game's. On every `tea.WindowSizeMsg`, call `FX.Resize`. On every input and every `FrameMsg`, forward the returned `[]game.Event` to `FX.Handle` and call `FX.Advance(dt)` with the same clamped `dt` the game got. In `StatePaused` the game does not advance and the world gets `AdvancePaused(dt)` instead (§30). `Scene()` sets `FX: m.FX.Compose()`.

- [ ] **Step 1: Write the failing tests**

`internal/render/composite_test.go`:

```go
func TestCompositeGlobalFillsOnlyBlankCells(t *testing.T)
// a frame of "ABC\nDEF" with a full overlay layer: every original character
// survives; only blanks are replaced

func TestCompositeGlobalKeepsFrameDimensions(t *testing.T)
// stripped line count and widths unchanged after compositing

// Review Focus #4
func TestCompositeBoardNeverCoversTheActivePiece(t *testing.T)
// fill overlay.Board with '#' in every cell; composite over board rows that show
// an active T piece: the stripped result still contains the piece's block glyphs
// at the piece's exact columns

func TestCompositeBoardDrawsIntoEmptyCells(t *testing.T)
// a single overlay cell over an empty board position appears in the output

func TestApplyShakeKeepsDimensions(t *testing.T)
// for dx,dy in {-1,0,1}²: stripped dimensions equal the input's

func TestApplyShakeMovesContent(t *testing.T)
// dx=1: the first column becomes blank and content shifted right

func TestBorderStyleAtIsDeterministicAndVaries(t *testing.T)
// same inputs give the same style; positions around the ring at energy 1 give
// at least three distinct rendered colors

func TestRenderWithNilFXMatchesPlan2Goldens(t *testing.T)
// the golden tests from Plan 2 pass unchanged with Scene.FX nil — assert here by
// rendering fixtureScene with FX nil and comparing to testdata/wide.golden
```

`internal/app/update_test.go` (extend):

```go
func TestFXReceivesGameEvents(t *testing.T)
// press space (hard drop) then one frame: m.FX.ParticleCount() > 0
// (this becomes meaningful in Task 5; assert only that Handle was reached by
// checking FX.Compose() is non-nil and Elapsed() advanced)

func TestFXIsNilWhenDisabled(t *testing.T)
// NewModel with Opts.NoFX: m.Scene().FX == nil, and the game still plays
// (a frame still advances the piece)

func TestResizeResizesTheFXWorld(t *testing.T)
// send WindowSizeMsg{120,50}: Compose().Global size is 120x50

func TestPausedFramesDriftStarsButFreezeEverythingElse(t *testing.T)
// §30: press 'p', then a second's worth of frames: Game.Snapshot() is unchanged,
// the Board layer is empty (gameplay particles frozen), and the Global layer's
// non-zero cells have moved — slowly: fewer rows than the same second unpaused
```

`internal/fx/world_test.go` (extend):

```go
func TestAdvancePausedDriftsStarsOnly(t *testing.T)
// emit particles and a trail, then AdvancePaused(1s worth of clamped steps):
// ParticleCount() and TrailCount() are unchanged, Elapsed() is unchanged, and
// star rows moved by roughly 15% of what Advance would have moved them
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/render/ ./internal/app/ -v`
Expected: build failure — `undefined: CompositeGlobal`, `Scene has no field FX`.

- [ ] **Step 3: Implement the compositor and the app wiring**

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./... -v`
Expected: PASS — including Plan 2's golden tests, unchanged.

- [ ] **Step 5: See the universe**

Run: `go run ./cmd/cosmic-tetris --seed 1234`. Stars should drift behind and around the board, and the board must remain perfectly readable. Then `--no-fx` (no stars at all, still a good game) and `--ascii` (ASCII stars).

- [ ] **Step 6: Commit**

```bash
git add internal/render/composite.go internal/render/composite_test.go internal/render/render.go internal/app
git commit -m "feat(render): composite FX overlay; wire the FX world into the app loop"
```

---

## Task 4: Animated border and piece ion trails

**Files:**
- Create: `internal/fx/trails.go`, `internal/fx/trails_test.go`, `internal/fx/shake.go`, `internal/fx/shake_test.go`, `internal/fx/events.go`
- Modify: `internal/fx/world.go`, `internal/render/board.go` (border uses `BorderStyleAt`)

**Interfaces:**
- Produces:
  ```go
  // events.go — the trigger table. Handle routes each game event to effects:
  //   EventPieceMoved       -> trail sample
  //   EventPieceRotated     -> trail sample + small border energy bump
  //   EventPieceHardDropped -> Task 5
  //   EventPieceLocked      -> Task 5
  //   EventHoldUsed         -> quantum-storage streak (Task 7)
  //   EventLinesCleared     -> Task 6
  //   EventComboChanged     -> Task 7
  //   EventLevelChanged     -> Task 7 (also SetLevel for star speed)
  //   EventGameOver         -> Task 8
  func (w *World) Handle(ev game.Event)

  // trails.go — §17: ██ ▓▓ ▒▒ ░░ by age (ASCII: [] ## ** ..), 100–160ms life.
  const TrailLife = 140 * time.Millisecond
  func (w *World) sampleTrail(p game.Piece)          // records the piece's cells
  func (w *World) emitDropTrail(p game.Piece, dist int) // Task 5 uses this
  func (w *World) TrailCount() int
  func trailGlyph(age time.Duration, ascii bool) string // "" once expired

  // shake.go — §18 deterministic pattern, §44 one-cell cap.
  const ShakeDuration = 80 * time.Millisecond
  var shakePattern = [5][2]int{{0, 1}, {-1, 0}, {1, 0}, {0, -1}, {0, 0}}
  func (w *World) TriggerShake(d time.Duration)
  func shakeOffset(since, total time.Duration) (dx, dy int)

  // border energy: bumped by events, decays exponentially back to 0 over ~600ms.
  func (w *World) BumpBorder(amount float64)
  ```

**Design notes:** trails are stored as `{cellX, row int, born time.Duration}` in board-cell coordinates, drawn with `Layer.SetPair`, and pruned when older than `TrailLife`. `BorderPhase` walks a full cycle every 24 seconds — subtle, per §25. `shakeOffset` indexes `shakePattern` by `since / (total/5)`, so it is deterministic and never exceeds one cell; under `ReducedMotion` it returns `(0,0)`.

- [ ] **Step 1: Write the failing tests**

`internal/fx/trails_test.go`:

```go
func TestMoveEventLeavesATrail(t *testing.T)
// Handle(EventPieceMoved with a piece): TrailCount() > 0 and the composed Board
// layer has non-zero cells at the piece's columns

func TestTrailsExpire(t *testing.T)
// after Advance past TrailLife (in clamped steps): TrailCount() == 0 and the
// Board layer is empty

func TestTrailGlyphFadesWithAge(t *testing.T)
// trailGlyph at 0ms, 50ms, 100ms, 130ms returns four different non-empty pairs;
// at 200ms returns ""

func TestTrailGlyphsAreASCIIInASCIIMode(t *testing.T)
// every rune < 128 for each age

func TestTrailsAreCappedNotUnbounded(t *testing.T)
// 10,000 move events in one frame: TrailCount() stays bounded (<= 4*40)
```

`internal/fx/shake_test.go`:

```go
func TestShakeOffsetFollowsTheSpecPattern(t *testing.T)
// sample at 0, 20, 40, 60, 79ms of an 80ms shake: the five pattern entries in order

func TestShakeNeverExceedsOneCell(t *testing.T)
// for since in 0..200ms in 1ms steps and totals of 80ms and 200ms:
// |dx| <= 1 and |dy| <= 1

func TestShakeEndsAtZero(t *testing.T)
// past the duration: (0,0)

func TestReducedMotionSuppressesShake(t *testing.T)
// ReducedMotion world: TriggerShake then Advance(16ms): Compose().ShakeX == 0
// and ShakeY == 0 at every sample across the duration

func TestBorderPhaseWalksSlowly(t *testing.T)
// Advance 1s: BorderPhase moved by less than 0.1 (a 24s cycle)

func TestBorderEnergyDecays(t *testing.T)
// BumpBorder(1.0), then after 1s of clamped advances: BorderEnergy < 0.2
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/fx/ -run 'TestMove|TestTrail|TestShake|TestReducedMotionSuppressesShake|TestBorder' -v`
Expected: build failure — `undefined: trailGlyph`, `undefined: shakeOffset`.

- [ ] **Step 3: Implement `events.go`, `trails.go`, `shake.go`, and switch the board border to `BorderStyleAt`**

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./... -v`
Expected: PASS (Plan 2 goldens still pass — the border color changes, the glyphs do not).

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render/board.go
git commit -m "feat(fx): ion trails, deterministic shake pattern, animated board border"
```

---

## Task 5: Hard-drop impact — trail, debris, shake, border flash

**Files:**
- Modify: `internal/fx/trails.go`, `internal/fx/particle.go`, `internal/fx/events.go`
- Test: `internal/fx/impact_test.go` (create)

**Interfaces:**
- Produces:
  ```go
  // §18. On EventPieceHardDropped (Distance cells crossed), then EventPieceLocked:
  //   1. a vertical ion trail through every crossed cell, fading upward
  //   2. an impact debris burst from the contact row, glyphs · * ✦ + (ASCII . * + x)
  //   3. an 80ms screen shake
  //   4. a border flash (BumpBorder(1.0))
  func (w *World) EmitImpact(p game.Piece, distance int)

  // EmitBurst places n particles at (x,y) in the given space with radial
  // velocities, upward bias, and lives spread over [minLife, maxLife].
  func (w *World) EmitBurst(space Space, x, y float64, n int, speed float64, minLife, maxLife float64)
  ```

Scale the burst with distance: `n = 6 + distance` particles, capped at 40 — a one-cell tap is a puff, an orbital refrigerator is a mess.

- [ ] **Step 1: Write the failing tests**

`internal/fx/impact_test.go`:

```go
func TestHardDropEmitsParticlesShakeAndBorderFlash(t *testing.T)
// Handle(EventPieceHardDropped{Piece: p, Distance: 12}) then Advance(16ms):
// ParticleCount() > 0, Compose().ShakeX or ShakeY non-zero at some sample within
// 80ms, BorderEnergy > 0.5

func TestHardDropDrawsAVerticalTrailAboveTheLandingRow(t *testing.T)
// the composed Board layer has non-zero cells in rows above the piece's final
// row, in the piece's columns

func TestBiggerDropsMakeMoreDebris(t *testing.T)
// Distance 1 vs Distance 18: the larger drop emits strictly more particles,
// and neither exceeds 40 new particles

func TestImpactDebrisFadesToNothing(t *testing.T)
// after 1.5s of clamped advances: ParticleCount() == 0 and the Board layer is empty

func TestImpactIsASCIISafe(t *testing.T)
// Config{ASCII:true}: every composed rune < 128

func TestImpactParticlesStayInsideTheirLayer(t *testing.T)
// no panic and no out-of-range writes across 3s of advances at a 20x20 board
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/fx/ -run 'TestHardDrop|TestBigger|TestImpact' -v`
Expected: build failure — `undefined: (*World).EmitImpact`.

- [ ] **Step 3: Implement the impact effect**

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Feel it**

Run: `go run ./cmd/cosmic-tetris` and hard-drop repeatedly. It must feel like dropping a refrigerator from orbit, and the frame must not become unreadable. Then `--reduced-motion`: debris and trail stay, the shake is gone.

- [ ] **Step 6: Commit**

```bash
git add internal/fx
git commit -m "feat(fx): hard-drop impact with ion trail, debris, shake, border flash"
```

---

## Task 6: Line-clear supernova, shockwaves, and the four-line event

**Files:**
- Create: `internal/fx/clear.go`, `internal/fx/clear_test.go`
- Modify: `internal/fx/events.go`, `internal/render/composite.go` (draw `Overlay.Banner`)

**Interfaces:**
- Produces:
  ```go
  // §19, 220ms total, three phases by elapsed time since the clear:
  //   Phase A  0–70ms    "critical mass": the cleared rows become ▓ with a
  //                      bright core spreading from the center
  //   Phase B  70–150ms  "supernova": a center-outward ✦ explosion front
  //   Phase C  150–220ms "collapse": the row becomes debris particles whose
  //                      horizontal velocity comes from their distance to center
  const (
      ClearPhaseA = 70 * time.Millisecond
      ClearPhaseB = 150 * time.Millisecond
      ClearTotal  = 220 * time.Millisecond
  )
  func (w *World) EmitLineClear(rows []int, count int)
  func (w *World) ClearAnimActive() bool

  // §24 shockwave: expanding rings of · ○ ◌ ◯ (ASCII . o O 0) over 300ms.
  // Suppressed entirely under ReducedMotion (§49.5). Used sparingly: four-line
  // clears and combo 5+ only.
  const ShockwaveDuration = 300 * time.Millisecond
  func (w *World) EmitShockwave(space Space, x, y float64)
  func (w *World) ShockwaveCount() int

  // §20 four-line sequence, fired together: hyperdrive, a longer shake (160ms,
  // still one cell), a border gradient pulse, a particle eruption, a HUD flash,
  // a temporary star-density increase, and a 700ms banner.
  const BannerDuration = 700 * time.Millisecond
  var fourLineBanners = []string{
      "✦ EVENT HORIZON ✦",
      "QUADRUPLE COSMIC INCIDENT",
      "FOUR ROWS HAVE LEFT THE CHAT",
      "SPACE-TIME HAS FILED A COMPLAINT",
  }
  func (w *World) TriggerFourLine()
  func (w *World) BannerActive() bool
  ```

**A note on coordinates:** the engine has already collapsed the board by the time FX sees `EventLinesCleared` (§19 allows exactly this: "Gameplay state may already know the result, but rendering gets a short animation"). The animation draws at the row indices carried in the event, over the already-collapsed board. Do not try to reconstruct the pre-clear board — 220ms of bright light covers it, and reconstructing state in FX would violate §14's one-way flow.

In ASCII mode the banner text drops the `✦` characters.

- [ ] **Step 1: Write the failing tests**

`internal/fx/clear_test.go`:

```go
func TestSingleClearRunsThroughThreePhases(t *testing.T)
// Handle(EventLinesCleared{Rows: []int{21}}): sample the Board layer at 30ms,
// 100ms, 180ms — each sample has non-zero cells, and the glyph sets at 30ms and
// 100ms differ

func TestClearAnimationEndsAt220ms(t *testing.T)
// after 220ms + one frame: ClearAnimActive() false; after particles die the
// Board layer is empty

func TestPhaseCEmitsDebrisWithOutwardVelocity(t *testing.T)
// advance into phase C: particles exist; those left of the row center have
// VX < 0 and those right of it have VX > 0

func TestFourLineClearFiresTheWholeCircus(t *testing.T)
// Handle(EventLinesCleared with 4 rows): BannerActive() true and Banner is one
// of fourLineBanners; HyperActive() true; ShockwaveCount() > 0;
// Compose().BorderEnergy > 0.8; a shake offset appears within 160ms;
// StarCount() is higher than the pre-event count

func TestBannerExpiresAfter700ms(t *testing.T)
// BannerActive() false and Overlay.Banner == "" after 700ms + one frame

func TestSingleClearDoesNotFireTheBanner(t *testing.T)
// one row: BannerActive() false, HyperActive() false

func TestShockwavesAreSuppressedUnderReducedMotion(t *testing.T)
// ReducedMotion: TriggerFourLine then Advance: ShockwaveCount() == 0, but the
// clear animation and particles still run

func TestShockwaveExpires(t *testing.T)
// after ShockwaveDuration + a frame: ShockwaveCount() == 0

func TestClearGlyphsAreASCIISafe(t *testing.T)
// ASCII config, sampled across all three phases: every rune < 128

func TestBannerIsASCIISafe(t *testing.T)
// ASCII config: every rune in Overlay.Banner < 128
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/fx/ -run 'TestSingleClear|TestClear|TestPhaseC|TestFourLine|TestBanner|TestShockwave' -v`
Expected: build failure — `undefined: (*World).EmitLineClear`.

- [ ] **Step 3: Implement `clear.go`, route `EventLinesCleared`, and render the banner**

Banner rendering goes in `CompositeGlobal`'s caller: a centered, bright, one-or-two-line block drawn over the frame above the board's vertical center. It must not shift any other element (§20: it must not block gameplay input, and per §44 it must not obscure the active piece — draw it in the upper third of the board area).

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: The acceptance test that matters**

Run: `go run ./cmd/cosmic-tetris --seed 1234`, build a well, and clear four rows. §43 requires an immediate "LOL WHAT THE FUCK" reaction. If it is merely nice, tune amplitudes and durations (not the spec's timings) and try again.

- [ ] **Step 6: Commit**

```bash
git add internal/fx internal/render/composite.go
git commit -m "feat(fx): supernova line clears, shockwaves, four-line spectacle"
```

---

## Task 7: Combo escalation, level-up anomaly, hold streak, mission control

**Files:**
- Create: `internal/fx/anomaly.go`, `internal/fx/anomaly_test.go`, `internal/flavor/messages.go`, `internal/flavor/messages_test.go`
- Modify: `internal/fx/events.go`, `internal/app/model.go`, `internal/app/update.go`, `internal/render/composite.go` (draw `Overlay.Notice`, apply `HUDPulse`)

**Interfaces:**
- Produces:
  ```go
  // fx/anomaly.go — §21 combo escalation:
  //   combo 2  small sparks
  //   combo 3  meteor particles (longer-lived, horizontal drift)
  //   combo 4  HUDPulse begins oscillating
  //   combo 5+ everything above plus a shockwave and maximum border energy
  func (w *World) SetCombo(combo int)
  func (w *World) ComboLevel() int

  // §22 level-up notice, ~1200ms, slides out by fading; never pauses the game.
  const NoticeDuration = 1200 * time.Millisecond
  var levelSubtitles = []string{
      "GRAVITY TAX INCREASED",
      "LOCAL PHYSICS UPDATED WITHOUT CONSENT",
      "PLEASE SECURE ALL LOOSE TETROMINOES",
  }
  func (w *World) TriggerLevelNotice(level int)
  func (w *World) NoticeActive() bool

  // §9 quantum storage, ~120ms: the outgoing piece compresses, streaks sideways,
  // and vanishes while the incoming piece flashes in. Gameplay never waits.
  const HoldStreakDuration = 120 * time.Millisecond
  func (w *World) EmitHoldStreak(p game.Piece)
  ```

  ```go
  // internal/flavor — §27 and §45.
  type Priority uint8
  const (PriorityIdle Priority = iota; PriorityEvent; PriorityMajor)

  type Channel struct{ /* unexported: rng, current, dwell, sinceLastMove, ... */ }
  func NewChannel(seed int64) *Channel

  // Handle picks a message for a game event, respecting priorities: a major
  // message is never displaced by an idle one, and no message is replaced before
  // MinDwell has passed (§27: "give them time to breathe").
  func (c *Channel) Handle(ev game.Event)
  func (c *Channel) Advance(dt time.Duration)
  func (c *Channel) Text() string // e.g. "NOMINALISH"

  const (
      MinDwell     = 2500 * time.Millisecond
      IdleInterval = 8 * time.Second
      FirstMoveIdle = 20 * time.Second // §45 "CAPTAIN?"
  )
  ```

**Message content (§27 idle pool, verbatim):** `GRAVITY REMAINS MOSTLY LEGAL`, `TETROMINO INJECTION SUCCESSFUL`, `STRUCTURAL VIBES: QUESTIONABLE`, `LOCAL UNIVERSE STABLE*`, `* DEFINITION OF STABLE UNDER REVIEW`, `MOON NOTIFIED`, `ORBITAL OSHA HAS ENTERED THE CHAT`, `WE HAVE EXCEEDED THE RECOMMENDED NUMBER OF BLOCKS`, `PHYSICS TEAM SAYS KEEP GOING`, `NOMINALISH`.

**Event messages:** combo 5/6/7 use `COMBO 5 // UNAUTHORIZED ORBITAL MANEUVER`, `COMBO 6 // STRUCTURAL REALITY FAILURE`, `COMBO 7 // NASA DENIES EVERYTHING` (combo 8+ reuses the 7 line with the real number). Level up uses `GRAVITY ANOMALY DETECTED`. Four-line clears use the banner text.

**Easter eggs (§45), each rare and each triggered, never random noise:** hard-dropping a vertical `I` → `KINETIC ROD DEPLOYED`; holding an `O` → `CUBE ADJACENT OBJECT SECURED`; the score crossing a new power of ten at or above 100000 → `NUMBER BECAME BIGGER`; 20 seconds with no input at the start of a game → `CAPTAIN?`; and with probability 1/100 an idle pick becomes `DID YOU KNOW YOU'RE IN A TERMINAL?`.

`Channel` owns its own `*rand.Rand`, seeded from the FX seed. It never touches the game's RNG.

- [ ] **Step 1: Write the failing tests**

`internal/fx/anomaly_test.go`:

```go
func TestComboTwoMakesSparks(t *testing.T)
// SetCombo(2) then Advance: ParticleCount() > 0

func TestComboThreeMakesLongerLivedParticles(t *testing.T)
// combo 3 particles outlive combo 2 particles (still alive after 0.6s)

func TestComboFourPulsesTheHUD(t *testing.T)
// SetCombo(4): Compose().HUDPulse changes across successive frames and stays in [0,1]

func TestComboFivePlusMaxesTheBorderAndAddsAShockwave(t *testing.T)
// SetCombo(5): BorderEnergy > 0.9 and ShockwaveCount() > 0

func TestComboResetCalmsEverything(t *testing.T)
// SetCombo(0) then 2s of advances: HUDPulse == 0, ParticleCount() == 0

func TestLevelNoticeAppearsAndExpires(t *testing.T)
// TriggerLevelNotice(8): Overlay.Notice contains "GRAVITY ANOMALY DETECTED" and
// "LEVEL 08", plus one of levelSubtitles; after NoticeDuration it is nil

func TestLevelNoticeDoesNotFreezeAnything(t *testing.T)
// with a notice active, stars still move and particles still step

func TestHoldStreakDrawsAndExpires(t *testing.T)
// EmitHoldStreak: Board layer non-empty; after 120ms + a frame the streak cells
// are gone (particles may linger)
```

`internal/flavor/messages_test.go`:

```go
func TestDefaultTextIsPresentImmediately(t *testing.T)
// NewChannel(1).Text() is non-empty

func TestEventMessagesOverrideIdleChatter(t *testing.T)
// Handle(EventLevelChanged{Level: 5}): Text() mentions GRAVITY ANOMALY

func TestMessagesDwellBeforeBeingReplaced(t *testing.T)
// after an event message, Handle of a lower-priority event within MinDwell does
// not change Text()

func TestMajorMessagesDisplaceEventMessages(t *testing.T)
// a four-line clear replaces a fresh move-level message immediately

func TestIdleMessagesRotateSlowly(t *testing.T)
// across 60s of 16ms advances with no events, the text changes at least twice
// and at most 10 times

func TestKineticRodOnVerticalIHardDrop(t *testing.T)
// Handle(EventPieceHardDropped with a vertical I): Text() == "KINETIC ROD DEPLOYED"

func TestCubeAdjacentOnHoldingAnO(t *testing.T)
// Handle(EventHoldUsed with Piece.Kind == KindO)

func TestNumberBecameBiggerOnPowerOfTenCrossing(t *testing.T)
// scores 99_000 -> 120_000 triggers it; 120_000 -> 130_000 does not

func TestCaptainAfterLongIdle(t *testing.T)
// Advance(FirstMoveIdle + 1s) with no events: Text() == "CAPTAIN?"

func TestChannelIsSeededAndReproducible(t *testing.T)
// two channels with the same seed produce the same 60s text sequence

func TestEveryMessageFitsAndIsASCII(t *testing.T)
// every message in every pool is <= 60 characters and ASCII-only, so the
// mission-control line survives ASCII mode and small terminals
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/fx/ ./internal/flavor/ -v`
Expected: build failures — `undefined: SetCombo`, `undefined: NewChannel`.

- [ ] **Step 3: Implement, then wire the channel into the app**

`Model` gains `Flavor *flavor.Channel`; `Update` forwards every event to both `FX.Handle` and `Flavor.Handle`, and advances both with the same clamped `dt`; `Scene()` sets `Status: m.Flavor.Text()`. The channel runs even with `--no-fx` (it is text, not motion).

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/flavor internal/app internal/render/composite.go
git commit -m "feat(fx): combo escalation, level anomalies, quantum storage, mission control"
```

---

## Task 8: Boot sequence and the game-over black hole

**Files:**
- Create: `internal/render/boot.go`, `internal/render/boot_test.go`, `internal/fx/gameover.go`, `internal/fx/gameover_test.go`
- Modify: `internal/app/model.go`, `internal/app/update.go`, `internal/app/update_test.go`

**Interfaces:**
- Produces:
  ```go
  // render/boot.go — §29, about one second of excessive drama.
  const (
      BootTotal = 1050 * time.Millisecond
      // checklist reveals: gravity 250ms, spacetime 450ms, tetrominoes 650ms,
      // "UNIVERSE ONLINE" 900ms
  )
  // BootScreen renders the boot screen for the given elapsed time, including the
  // spinner frame supplied by the app (bubbles/v2/spinner).
  func BootScreen(elapsed time.Duration, spinner string, w, h int, p Palette, m Mode) string

  // fx/gameover.go — §28.
  const (
      GameOverFreeze   = 300 * time.Millisecond  // "SIGNAL LOST", everything frozen
      GameOverCollapse = 900 * time.Millisecond  // blocks fall inward
      GameOverHole     = 1300 * time.Millisecond // black hole art, then the panel
  )
  // TriggerGameOver takes a read-only copy of the final board so the collapse can
  // animate the blocks that were there. It never retains a pointer to the game.
  func (w *World) TriggerGameOver(final game.Board)
  func (w *World) GameOverPhase() int // 0 none, 1 freeze, 2 collapse, 3 hole, 4 panel
  ```

  ```go
  // internal/app: AppState gains StateBoot as the initial state.
  const StateBoot AppState = 3 // added to the existing StatePlaying/Paused/GameOver
  ```

**Behavior:** in `StateBoot` the game does not advance and no gravity applies; the FX starfield does. Any key press skips straight to `StatePlaying` (§29). After `BootTotal` elapses, the app transitions on its own. There is no menu.

Game over: `EventGameOver` routes to `TriggerGameOver(m.Game.Board)`. Phase 1 sets `Overlay.Frozen` and shows `SIGNAL LOST`; phase 2 converts each filled board cell into a particle accelerating toward the board center; phase 3 draws the §28 black-hole art centered on the board; phase 4 sets `Overlay.ShowGameOverPanel`, which is when `render` draws the §28 final panel. `r` restarts at any phase; with `--no-fx` the panel shows immediately.

- [ ] **Step 1: Write the failing tests**

`internal/render/boot_test.go`:

```go
func TestBootScreenRevealsChecklistOverTime(t *testing.T)
// at 100ms: contains "COSMIC" and "INITIALIZING LOCAL UNIVERSE" but not "gravity";
// at 300ms: contains "gravity"; at 500ms: "spacetime"; at 700ms: "tetrominoes"
// and "QUESTIONABLE"; at 1000ms: "UNIVERSE ONLINE"

func TestBootScreenFitsTheFrame(t *testing.T)
// sizes (40,24),(80,30),(120,50) and all modes: no line exceeds width,
// line count <= height

func TestBootScreenIsASCIISafeInASCIIMode(t *testing.T)
```

`internal/fx/gameover_test.go`:

```go
func TestGameOverPhasesFollowTheTimeline(t *testing.T)
// TriggerGameOver(board): phase 1 at 100ms, 2 at 500ms, 3 at 1000ms, 4 at 1400ms

func TestFreezePhaseSetsFrozenAndShowsSignalLost(t *testing.T)
// Overlay.Frozen true and the Global layer (or Banner) contains "SIGNAL LOST"

func TestCollapsePhaseMovesBlocksInward(t *testing.T)
// a board with cells at both edges: after 300ms of collapse, particle X values
// have moved toward the board center

func TestHolePhaseDrawsTheBlackHole(t *testing.T)
// the Board layer contains the '●' glyph (ASCII mode: '@' or 'O') near center

func TestPanelIsGatedUntilTheCollapseFinishes(t *testing.T)
// ShowGameOverPanel false before 1300ms, true after

func TestGameOverDoesNotRetainTheBoard(t *testing.T)
// mutate the caller's board copy after TriggerGameOver: the animation is
// unaffected (assert the composed output at 500ms is identical either way)
```

`internal/app/update_test.go` (extend):

```go
func TestModelStartsInBootAndDoesNotAdvanceTheGame(t *testing.T)
// fresh model: State == StateBoot; frames totaling 500ms leave Game.Snapshot()
// identical to a fresh game

func TestAnyKeySkipsBoot(t *testing.T)
// press 'x' during boot: State == StatePlaying

func TestBootEndsOnItsOwn(t *testing.T)
// frames totaling BootTotal + one frame: State == StatePlaying

func TestGameOverPanelWaitsForTheCollapseWithFX(t *testing.T)
// force game over: immediately after, View().Content does not contain
// "UNIVERSE EXPIRED"; after 1400ms of frames it does

func TestGameOverPanelIsImmediateWithNoFX(t *testing.T)
// with Opts.NoFX: the panel appears on the first frame after game over

func TestRestartWorksDuringTheCollapse(t *testing.T)
// press 'r' 400ms into the collapse: State StatePlaying, board empty
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/render/ ./internal/fx/ ./internal/app/ -v`
Expected: build failures — `undefined: BootScreen`, `undefined: TriggerGameOver`, `undefined: StateBoot`.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Watch a universe be born and die**

Run: `go run ./cmd/cosmic-tetris --seed 1234`. Confirm: about a second of drama, then play begins; pressing a key skips it. Then top the stack out deliberately and confirm the freeze, the inward collapse, the black hole, and the final panel — in that order — followed by a working `r`.

- [ ] **Step 6: Commit**

```bash
git add internal/render internal/fx internal/app
git commit -m "feat: boot sequence and game-over black hole collapse"
```

---

## Task 9: Mode gating, FX snapshots, and the coolness acceptance pass

**Files:**
- Create: `internal/fx/gating_test.go`, `internal/app/determinism_test.go`, `internal/render/testdata/fx-wide.golden`
- Modify: `internal/render/golden_test.go` (one FX-on golden), `README.md`

**Interfaces:**
- Consumes: everything.
- Produces: the guarantees in §44, §47, and the acceptance criteria in §43.

- [ ] **Step 1: Write the failing tests**

`internal/fx/gating_test.go` — every §44 restraint and every mode flag, as one table where possible:

```go
func TestNoFXProducesNoOverlayForAnyEvent(t *testing.T)
// Config{Enabled:false}: fire every EventKind (moves, hard drop, 4-line clear,
// combo 7, level up, hold, game over) and advance 3s: Compose() stays nil

func TestReducedMotionSuppressesExactlyThreeThings(t *testing.T)
// ReducedMotion: after a four-line clear and a hard drop and combo 5,
//   ShakeX == ShakeY == 0 at every sample,
//   star speed matches the non-hyperdrive baseline,
//   ShockwaveCount() == 0,
// but ParticleCount() > 0 and the Board layer has trail/clear content
// (color, trails, particles survive — §49.5)

func TestASCIIModeEmitsNoWideRunes(t *testing.T)
// ASCII config: fire every event, advance across 3s in 16ms steps, and assert
// every non-zero rune in both layers, the Banner, and the Notice is < 128

func TestParticleCountStaysBoundedUnderAbuse(t *testing.T)
// 2000 events of every kind interleaved with advances: ParticleCount() <=
// MaxParticles at all times and the composed layers never exceed their sizes

func TestOverlayNeverExceedsOneCellOfShake(t *testing.T)
// across a 5s abuse run: |ShakeX| <= 1 and |ShakeY| <= 1 at every frame
```

`internal/app/determinism_test.go`:

```go
// Review Focus #5 — the §35/§47 guarantee, end to end.
func TestGameStateIsIdenticalWithFXOnAndOff(t *testing.T)
// a canned script of ~200 {key, dt} steps (reuse the shape of Plan 1's
// replaySteps, driven through Model.Update instead of the engine directly):
// run it twice with the same seed, once with Opts.NoFX true and once false,
// and assert the two Game.Snapshot() strings are byte-identical

func TestSameSeedSameScriptIsReproducibleThroughTheApp(t *testing.T)
// two identical FX-on runs produce identical Game.Snapshot() strings

func TestFXWorldIsAlsoReproducible(t *testing.T)
// the same two FX-on runs produce identical Compose() layers
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/fx/ ./internal/app/ -v`
Expected: FAIL wherever gating is incomplete. Fix the implementation, not the tests.

- [ ] **Step 3: Add one FX-on golden**

Extend `internal/render/golden_test.go` with a case that builds a deterministic overlay: `fx.NewWorld(7, fx.Config{Enabled: true})`, `Resize(100, 36, 20, 20)`, a fixed script (hard drop at 0ms, a two-row clear at 100ms, advance in 16ms steps to 200ms), then `Render` with `fixtureScene(ModeFull, 100, 36, OverlayNone)` plus `FX: world.Compose()`. Compare `ansi.Strip` output to `testdata/fx-wide.golden`.

Add a comment above the case: this golden pins geometry, not beauty — re-record it with `-update` whenever FX amplitudes are tuned, and read the diff before committing it.

Run: `go test ./internal/render/ -run TestGoldenLayouts -update && go test ./internal/render/ -count=3 -v`
Expected: golden written; three consecutive runs pass. Read `fx-wide.golden` and confirm the board box is intact and the active piece is visible.

- [ ] **Step 4: Run the §43 coolness acceptance test by hand**

Run: `go run ./cmd/cosmic-tetris`. Within the first 30 seconds of normal play, confirm you see all six: a moving starfield, an animated board border, piece trails, a hard-drop impact, particles, and mission-control commentary. On the first completed line, confirm the supernova animation, the debris, and the border reaction. On a four-line clear, confirm the reaction from §43. Write down anything that felt weak, fix it, and re-run.

Then walk the §47 definition-of-done list end to end, including: `--ascii`, `--no-fx`, `--reduced-motion`, `--seed`, live resize down past 40×24 and back, pause, restart, and a full game to game over. Check for visible flicker under normal play; if it flickers, look for a render that changes size frame to frame rather than reaching for optimizations.

- [ ] **Step 5: Update the README**

Document what the game is, the CLI surface (§46), the three rendering modes, the key bindings, the architecture in five lines (`game → events → fx → overlay → render`, two RNGs, engine takes `dt`), and how to run the tests including `-update` for goldens.

- [ ] **Step 6: Final verification**

Run:
```bash
go build ./... && go vet ./... && go test ./... -count=1
gofmt -l .
grep -rn "\*game\.Game" internal/fx internal/flavor || echo "fx/flavor never touch a live game"
grep -rn "time.Now" internal/game || echo "engine is clock-free"
```
Expected: everything green, `gofmt -l` prints nothing, both greps print their reassurance.

- [ ] **Step 7: Commit**

```bash
git add internal/fx internal/app internal/render README.md
git commit -m "test: FX gating, RNG isolation, FX golden; document the finished universe"
```

---

## Done when

- Every §47 item holds, verified by hand as well as by tests.
- `--no-fx` yields a good, quiet game; the default yields a much funnier one.
- `--reduced-motion` suppresses shake, hyperdrive acceleration, and shockwaves, and nothing else.
- ASCII mode emits no rune ≥ 128 anywhere, including banners, notices, and particles.
- The same seed and input script produce byte-identical game state with FX on and off.
- Screen shake never exceeds one cell; FX never covers the active piece; particles never persist into the next frame's board.
- A four-line clear produces the §43 reaction. That is an actual product requirement.
