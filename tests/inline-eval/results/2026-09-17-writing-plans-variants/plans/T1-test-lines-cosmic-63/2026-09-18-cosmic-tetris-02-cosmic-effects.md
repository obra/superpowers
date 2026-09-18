# Cosmic Tetris, Plan 2: Cosmic Effects — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the independent FX simulation — starfield, animated border, piece trails, mission-control commentary, particle physics, hard-drop impact, supernova line clears, shockwaves, hyperdrive, and the four-line spectacle — so the terminal is visibly losing its mind without gameplay ever noticing.

**Architecture:** `internal/fx` is a second simulation with its own RNG and its own `Advance(dt)`. It **observes** `[]game.Event` and **never** touches `game` state — the dependency is `fx → game` for the event type only, and the compiler enforces the rest because `fx` receives events by value and a read-only snapshot. `internal/flavor` owns mission-control copy and its cooldown. The renderer already accepts an `FXView` interface (Plan 1, Task 15); this plan implements it on `*fx.World` and turns on §37's steps 2, 6, 9, and 10.

**Tech Stack:** Go 1.26, `charm.land/lipgloss/v2` for color. No new dependencies.

**Spec:** `design.md` (this repo root). Sections 14–27, 42 Phases 3–4, 44, 49.5.

**Prerequisite:** Plan 1 (`plans/2026-09-18-cosmic-tetris-01-engine-and-terminal.md`) complete. This plan consumes `render.FXView`, `render.StarCell`, `render.ParticleCell`, `app.Model.handleEvents`, and `app.Options.NoFX/ReducedMotion` from it.

## Global Constraints

- `fx` may observe game events. It may **never** modify `GameState` (§14). No method on `*fx.World` takes a `*game.Game`.
- `fx.World` holds its own `*rand.Rand`, seeded independently of the game RNG. The two never share (§49.6). Crossing them makes piece order depend on particle counts.
- Gameplay never waits for an animation, and animations never block input (§44).
- Screen shake never exceeds roughly one terminal cell (§18, §44).
- Particles never permanently alter the rendered board; effects never obscure the active piece (§44).
- No goroutine per particle or per frame; reuse slices; a few hundred particles must be trivial (§38).
- `--no-fx` must still be a good game; `--reduced-motion` suppresses screen shake, hyperdrive acceleration, and shockwaves while leaving color, trails, and particles alone (§49.5).
- FX glyph choices must have a mode-appropriate fallback: the ASCII set is verified in Plan 3.
- Board readability is sacred. Never make the background so busy the board is harder to read (§15, §21).
- Every task ends with tests passing and a commit. `go vet ./...` and `gofmt -l .` clean before each commit.

## Review Focus

1. **A huge `dt` reaching `fx.Advance`.** Laptop sleep means one call with 30s of elapsed time. Star wrapping must not loop per-row, particle lifetimes must not go so negative they wrap, and timers must not fire hundreds of times. → Task 1.
2. **A viewport smaller than the effects assume.** At 40×24 the FX area is tiny; particle positions rounded to cells must be culled, never written at a negative index or past the right edge. → Task 5.
3. **Several major events in one placement.** A four-line clear that also levels up and also sets a high score fires hyperdrive, banner, level notification, and shockwave at once. Banners must not stack over each other or over the board. → Task 10.
4. **Unbounded particle growth.** Sustained combos plus hard drops emit continuously; the pool must be capped and oldest-dropped rather than grown without limit. → Task 5.
5. **`--no-fx` leaving a nil `FXView`.** Every renderer FX call site must be nil-guarded, and `--no-fx` must not merely produce an empty world that still costs per-frame work. → Task 12.

---

## File Structure

| File | Responsibility |
|---|---|
| `internal/fx/world.go` | `World`, `Config`, `Advance`, the `render.FXView` implementation, border/shake timers |
| `internal/fx/starfield.go` | Three-layer star simulation and hyperdrive state |
| `internal/fx/particle.go` | `Particle`, the pool, integration step, emitters, shockwaves |
| `internal/fx/trail.go` | Ion trails and the quantum-storage hold streak |
| `internal/fx/supernova.go` | Three-phase line-clear animation |
| `internal/fx/events.go` | `Handle`: `game.Event` → FX reaction mapping; the reduced-motion policy |
| `internal/fx/banner.go` | Banner and notification queue with lifetimes |
| `internal/flavor/messages.go` | Mission-control copy tables |
| `internal/flavor/channel.go` | Cooldown/priority logic for the status line |
| `internal/render/board.go` (modify) | Composite board-local FX: trails, supernova, ion trails |
| `internal/render/render.go` (modify) | §37 steps 2, 6, 9, 10 |
| `internal/app/update.go` (modify) | Route events into `fx` and `flavor`; advance the FX clock |

`internal/fx/banner.go` and `internal/flavor/channel.go` are two files beyond §33's listing. Both are separate responsibilities with their own lifetimes; folding them into `world.go`/`messages.go` would make those files hard to hold in context.

---

### Task 1: FX world skeleton and the starfield

**Files:**
- Create: `internal/fx/world.go`, `internal/fx/starfield.go`
- Test: `internal/fx/world_test.go`, `internal/fx/starfield_test.go`

**Interfaces:**
- Consumes: `game.Event` (Plan 1 Task 5), `render.StarCell` (Plan 1 Task 15).
- Produces:
  - `type Config struct { Seed int64; Width, Height int; ReducedMotion bool }`
  - `type World struct { ... }`; `func NewWorld(cfg Config) *World`
  - `func (w *World) Resize(width, height int)`
  - `func (w *World) Advance(dt time.Duration)`
  - `func (w *World) SetLevel(level int)` — the only game value the world tracks continuously; star velocity scales with it (§15)
  - `func (w *World) Stars() []render.StarCell`
  - `type Layer uint8` with `LayerFar, LayerMid, LayerNear`
  - `const MaxDT = 100 * time.Millisecond` — every `Advance` clamps `dt` to this

- [ ] **Step 1: Write the failing tests in `internal/fx/starfield_test.go` and `internal/fx/world_test.go`**

- `TestNewWorldPopulatesStars`: `NewWorld(Config{Seed:1,Width:80,Height:30})` -> `len(Stars()) > 0`, and all cells satisfy `0 <= X < 80`, `0 <= Y < 30`
- `TestThreeDepthLayers`: the internal star slice contains stars of all three `Layer` values (§15)
- `TestLayerGlyphs`: far-layer glyphs are drawn only from `{'.'}`, mid from `{'·','˚'}`, near from `{'✦','✧','*'}` (§15)
- `TestFarLayerDimmerThanNear`: every far star's `Dim` value is greater than every near star's (higher `Dim` = dimmer)
- `TestStarsDriftDownward`: record one star's `Y`, `Advance(500*time.Millisecond)` -> its `Y` is greater or it wrapped to the top
- `TestNearLayerMovesFasterThanFar`: after `Advance(500ms)`, total near-layer displacement exceeds total far-layer displacement
- `TestStarsWrapAtBottom`: after `Advance(30*time.Second)` in 100ms slices, `len(Stars())` is unchanged and every star is still in bounds (§15: the field is conserved)
- `TestLevelIncreasesStarVelocity`: displacement over 1s at `SetLevel(15)` is greater than at `SetLevel(1)`, but less than 4× it (§15: *subtly* increases)
- `TestHugeDTIsClamped`: `Advance(60*time.Second)` returns promptly, all stars remain in bounds, and the resulting displacement equals that of `Advance(MaxDT)` — **Review Focus 1**
- `TestZeroAndNegativeDT`: `Advance(0)` and `Advance(-1*time.Second)` change nothing
- `TestResizeKeepsStarsInBounds`: `Resize(40,24)` after building at `80×30` -> every star is in the new bounds
- `TestResizeToZero`: `Resize(0,0)` then `Advance` and `Stars()` -> empty or in-bounds, no panic
- `TestFXRNGIsIndependent`: two worlds with the same `Seed` produce identical star layouts; a world seeded `1` and one seeded `2` differ
- `TestWorldNeverTouchesGame`: parse `internal/fx/*.go` (non-test) with `go/parser` and assert no `*game.Game` type appears in any signature — **§14 made mechanical**

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -v`
Expected: build failure, `undefined: NewWorld`.

- [ ] **Step 3: Implement `internal/fx/world.go` and `internal/fx/starfield.go`**

Stars hold `float64` positions and a per-layer base velocity in cells/second; pin them as `LayerFar: 1.2`, `LayerMid: 3.0`, `LayerNear: 7.0`, scaled by `1 + 0.04*(level-1)` and capped at `2.5×`. Star count scales with area: `area/45`, clamped to `[0, 400]`. Wrapping is arithmetic (`y = math.Mod(y, height)`), not a loop — that is what makes Review Focus 1 cheap. `Stars()` reuses a preallocated slice.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx
git commit -m "feat(fx): FX world skeleton and three-layer starfield"
```

---

### Task 2: Wire FX into the app and render the starfield behind the board

**Files:**
- Modify: `internal/app/model.go`, `internal/app/update.go`, `internal/render/render.go`
- Test: `internal/app/fx_test.go`, `internal/render/fx_test.go`

**Interfaces:**
- Consumes: `fx.NewWorld`, `fx.World.Advance/Resize/SetLevel/Stars`, `render.Scene.FX`.
- Produces: `Model.FX *fx.World` (nil when `Opts.NoFX`); `render.Render` now paints §37 step 2.

- [ ] **Step 1: Write the failing tests**

In `internal/app/fx_test.go`:
- `TestModelCreatesFXWorld`: `New(Options{})` -> `FX != nil`
- `TestNoFXLeavesWorldNil`: `New(Options{NoFX:true})` -> `FX == nil`
- `TestFXSeedDiffersFromGameSeed`: with `Options{Seed: 5}`, the FX world's config seed is not `5` (§49.6: independent generators)
- `TestFrameAdvancesFXWithSameDT`: a `FrameMsg` advances both game and FX; with `NoFX` it advances only the game and does not panic
- `TestFXTracksLevel`: after enough clears to reach level 2, the FX world's level is 2
- `TestResizeResizesFXWorld`: `WindowSizeMsg{100,40}` -> the FX world reports the new bounds
- `TestPausedFreezesGameplayFXButNotStars`: while paused, a `FrameMsg` still moves stars but leaves particle and timer state untouched (§30)

In `internal/render/fx_test.go`:
- `TestStarsRenderedBehindBoard`: with a stub `FXView` returning one star at a coordinate the board occupies, the board glyph wins at that cell (§44: never obscure the piece)
- `TestStarsRenderedOutsideBoard`: a star outside the board panel appears in the output
- `TestStarsOutOfRangeIgnored`: stub stars at `(-5,-5)`, `(9999,9999)` -> no panic, not rendered
- `TestNilFXStillRenders`: `Scene{FX:nil}` output equals the Plan 1 golden for the same scene

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ ./internal/render/ -run 'TestFX|TestStars|TestNoFX|TestNil|TestPaused|TestModel|TestFrameAdvances' -v`
Expected: FAIL.

- [ ] **Step 3: Implement the wiring**

`app.New` seeds the FX world with a value derived from but not equal to the game seed — pin it as `opts.Seed ^ 0x5DEECE66D`. The starfield is painted into a background canvas that the board and HUD panels are then composited over, so the board always wins a contested cell.

- [ ] **Step 4: Regenerate goldens and verify**

```bash
go test ./internal/render/ -run TestGolden -update && go test ./... -v
```

Goldens change only where stars now appear outside the board. Inspect the diff before committing; the board region must be byte-identical to Plan 1.

- [ ] **Step 5: Commit**

```bash
git add internal/app internal/render
git commit -m "feat(fx): wire the FX world into the frame loop and render the starfield"
```

---

### Task 3: Animated board border

**Files:**
- Modify: `internal/fx/world.go`, `internal/render/palette.go`, `internal/render/board.go`
- Test: `internal/fx/border_test.go`, `internal/render/border_test.go`

**Interfaces:**
- Consumes: `fx.World`, `render.BorderColor`.
- Produces: `func (w *World) BorderEnergy() float64` in `[0,1]`; `func (w *World) FlashBorder(strength float64, d time.Duration)`; `func (w *World) BorderPhase() float64` in `[0,1)` — the slow hue cycle position.

- [ ] **Step 1: Write the failing tests**

- `TestBorderPhaseCyclesSlowly`: `BorderPhase()` after `Advance(1*time.Second)` moved by less than `0.1` (§25: the shift is subtle)
- `TestBorderPhaseWraps`: after 60s of 100ms advances, `BorderPhase()` is still in `[0,1)`
- `TestBorderEnergyRestsLow`: a fresh world -> `BorderEnergy() < 0.2`
- `TestFlashRaisesEnergy`: `FlashBorder(1.0, 200*time.Millisecond)` -> `BorderEnergy() > 0.8`
- `TestFlashDecays`: after `Advance(200ms)`, energy is back below `0.2`
- `TestFlashClamped`: `FlashBorder(50, time.Second)` -> `BorderEnergy() <= 1.0`
- `TestBorderColorVariesWithPhase`: `BorderColor(ModeFull, e)` differs for `e` of 0, 0.5, 1.0, and every returned value parses as a valid color
- `TestBorderPaletteMembers`: the full-mode border ramp contains the five §25 colors — deep violet, electric cyan, magenta, stellar blue, hot white
- `TestBorderInReducedMode`: `BorderColor(ModeReduced, 0.5)` returns an ANSI-256 color, not a hex truecolor value
- `TestBorderInASCIIModeStillColored`: ASCII mode changes glyphs, not colors (§32: ASCII means glyphs, limited colors)
- `TestBoardBorderWidthUnchangedByEnergy`: `RenderBoard` at energy 0 and 1 -> identical stripped output (color-only change; layout must not move)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run TestBorder -v`
Expected: FAIL, `undefined: BorderEnergy`.

- [ ] **Step 3: Implement**

`BorderPhase` advances at `0.05` per second. `BorderEnergy` is `max(restEnergy, flashRemaining/flashDuration * flashStrength)` with `restEnergy = 0.1`. `BorderColor(mode, energy)` interpolates the §25 ramp by `phase` at rest and pushes toward hot white as energy rises; pass `w.BorderPhase()` into `BoardView.BorderEnergy`'s sibling field — add `BorderPhase float64` to `BoardView` rather than overloading energy.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): animated board border as the game's energy indicator"
```

---

### Task 4: Piece trails and quantum storage

**Files:**
- Create: `internal/fx/trail.go`
- Modify: `internal/fx/events.go` (create), `internal/render/board.go`
- Test: `internal/fx/trail_test.go`, `internal/fx/hold_test.go`

**Interfaces:**
- Consumes: `game.Event`, `game.Cell`.
- Produces:
  - `type Trail struct { Cells []game.Cell; Age, Life time.Duration; Kind game.PieceKind; Vertical bool; Streak bool }` — `Streak` marks the §9 sideways hold smear
  - `func (w *World) Handle(events []game.Event)` — the single entry point for all event reactions; this task implements the `PieceMoved`, `PieceRotated`, `PieceHardDropped`, and `HoldUsed` branches
  - `func (w *World) Trails() []render.TrailCell`
  - `func (w *World) HoldFlash() float64` in `[0,1]` — the incoming piece's flash-into-existence brightness (§9)
  - `const TrailLife = 140 * time.Millisecond` (§17: ~100–160ms)
  - `const HoldStorageLife = 120 * time.Millisecond` (§9, exact)

- [ ] **Step 1: Write the failing tests in `internal/fx/trail_test.go`**

- `TestMoveSpawnsTrail`: `Handle([]game.Event{{Kind: game.PieceMoved, Piece: p}})` -> `len(Trails()) == 1` with `Cells` equal to `p.Cells()`
- `TestRotateSpawnsTrail`: a `PieceRotated` event also spawns one
- `TestTrailExpires`: after `Advance(TrailLife)` in 20ms slices, `Trails()` is empty
- `TestTrailShortLived`: at `Advance(50ms)` the trail is still present (§17: it must be visible for a frame or two)
- `TestTrailGlyphFades`: the `render.TrailCell.Glyph` values progress `'█'`, `'▓'`, `'▒'`, `'░'` as age crosses 1/4, 1/2, 3/4 of `Life` (§17)
- `TestHardDropTrailIsVertical` : a `PieceHardDropped` event with `Cells: 8` -> a trail with `Vertical: true` covering the crossed rows (§17: stronger vertical trail)
- `TestTrailsCapped`: 500 `PieceMoved` events in one `Handle` -> `len(Trails())` cells come from at most 32 live trails
- `TestTrailsFrozenAtZeroDT`: `Advance(0)` does not age trails
- `TestTrailsAreFXOnly`: `Handle` takes only `[]game.Event`; assert via the Task 1 parser test that no `*game.Game` appears (§17: trails are FX only)

In `internal/fx/hold_test.go` — the §9 QUANTUM STORAGE effect:

- `TestHoldUsedSpawnsStreak`: `Handle([]game.Event{{Kind: game.HoldUsed, Piece: p}})` -> a trail with `Streak: true` whose cells extend sideways beyond `p.Cells()` (§9: compressed → streaked sideways → disappear)
- `TestHoldStreakCompressesThenWidens`: at 30ms the streak's cell span is narrower than `p.Cells()`' span (compression), and at 80ms it is wider (the sideways streak)
- `TestHoldStreakLifeIs120ms`: present at 100ms, gone at 140ms (§9, exact)
- `TestHoldFlashPeaksEarly`: `HoldFlash()` is near `1.0` immediately after the event and back to `0` by `HoldStorageLife` (§9: the incoming piece briefly flashes into existence)
- `TestHoldFlashZeroWhenIdle`: a fresh world -> `HoldFlash() == 0`
- `TestHoldDoesNotDelayGameplay`: `Handle` returns nothing and takes no game pointer, so the swap has already happened in the engine (§9: gameplay does not wait for the animation)
- `TestRepeatedHoldRestartsTheEffect`: a second `HoldUsed` 200ms later restarts the streak rather than stacking two

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestTrail|TestMoveSpawns|TestHold' -v`
Expected: FAIL, `undefined: Trails`.

- [ ] **Step 3: Implement trails and the `Handle` skeleton**

`Handle` is a `switch e.Kind` with one case per §14 event; add the remaining cases as later tasks land.

Do not hand `fx.Trail` values to the renderer directly — `render` must never import `fx`, or the two packages form a cycle. Instead extend the `render.FXView` interface with `Trails() []render.TrailCell` where `type TrailCell struct { X, Y int; Glyph rune; Kind uint8; Fade int }`, add a matching `Trails []TrailCell` field to `render.BoardView`, and have `fx.World` flatten its trails into that at read time. Every later effect in this plan follows the same pattern: `fx` converts to `render`'s cell types, `render` gains an `FXView` method plus a `BoardView` field, and `render` never learns that `fx` exists.

Board compositing order: trails paint into empty cells only, never over locked cells or the active piece (§44). The hold streak paints into the HOLD panel and the columns between it and the board, not into the board interior.

- [ ] **Step 4: Run tests to verify they pass, then look at it**

```bash
go test ./... -v && go run ./cmd/cosmic-tetris --seed 8675309
```

Move a piece: a faint ion trail follows it. Press `c`: the outgoing piece compresses, streaks sideways, and vanishes while the incoming one flashes in — and the game never stalls waiting for it (§9).

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): ion trails and quantum-storage hold animation"
```

---

### Task 5: Particle system

**Files:**
- Create: `internal/fx/particle.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/particle_test.go`

**Interfaces:**
- Consumes: `fx.World`, `render.ParticleCell`.
- Produces:
  - `type Particle struct { X, Y, VX, VY, Life, MaxLife float64; Glyph rune; Brightness float64 }` (§23, verbatim)
  - `func (w *World) Emit(p Particle)`
  - `func (w *World) EmitBurst(x, y float64, count int, spread, speed float64, glyphs []rune)`
  - `func (w *World) Particles() []render.ParticleCell`
  - `func (w *World) ParticleCount() int`
  - `const MaxParticles = 600`, `ParticleGravity = 14.0`, `ParticleDrag = 0.92`

- [ ] **Step 1: Write the failing tests in `internal/fx/particle_test.go`**

- `TestEmitAddsParticle`: `Emit(...)` -> `ParticleCount() == 1`
- `TestIntegrationStep`: a particle at `(5,5)` with `VY: 10`, after `Advance(100ms)` -> `Y` is about `6.0` and `VY` grew by roughly `ParticleGravity*0.1` then shrank by drag; assert `Y` within `0.2` of `6.0` (§23's exact update order: position += velocity·dt, then velocity += accel·dt, then velocity *= drag, then life -= dt)
- `TestParticleDiesAtZeroLife`: `Life: 0.05`, `Advance(100ms)` -> `ParticleCount() == 0`
- `TestParticleDiesOutsideViewport`: a particle at `Y: 1000` with long life -> culled (§23)
- `TestParticlesOutOfBoundsNotEmitted`: emit at `(-50,-50)` and `(9999,9999)`, then `Particles()` -> no cell with a negative or over-width coordinate — **Review Focus 2**
- `TestTinyViewport`: `Resize(1,1)` then `EmitBurst(0,0,50,...)` and `Advance(100ms)` -> no panic, all returned cells at `(0,0)` or culled — **Review Focus 2**
- `TestPoolIsCapped`: emit 5000 particles -> `ParticleCount() <= MaxParticles` — **Review Focus 4**
- `TestPoolDropsOldest`: fill to the cap, emit one more with a distinctive glyph -> the new particle is present
- `TestEmitBurstSpreadsRadially`: `EmitBurst(10,10,40,math.Pi*2,20,glyphs)` -> the 40 particles' velocity directions cover all four quadrants (§23: radial explosion force)
- `TestEmitBurstIsSeeded`: two worlds with the same seed produce identical bursts
- `TestBurstDoesNotAllocatePerFrame`: `testing.AllocsPerRun` on `Advance(16ms)` with 300 live particles -> zero allocations (§38: reusable slices)
- `TestHugeDTKillsParticlesNotMath`: 300 particles, `Advance(60*time.Second)` -> all dead, no `NaN` or `Inf` in any remaining position — **Review Focus 1**
- `TestBrightnessMapsToCell`: a particle with `Brightness: 1.0` yields a lower `Bright` index than one at `0.2` (brighter = lower index, matching `StarCell.Dim`)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestEmit|TestParticle|TestPool|TestBurst|TestTiny|TestHugeDT' -v`
Expected: FAIL, `undefined: Emit`.

- [ ] **Step 3: Implement `internal/fx/particle.go`**

One backing `[]Particle` of length `MaxParticles`, compacted in place each step by swapping dead particles to the tail — no per-particle allocation, no goroutines (§38). `Particles()` writes into a reused `[]render.ParticleCell`. Rounding to cells uses `int(math.Round(...))` and culls anything outside `[0,Width)×[0,Height)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v -count=1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx
git commit -m "feat(fx): capped particle pool with terminal-space physics"
```

---

### Task 6: Hard-drop impact — ion trail, debris, shake, border flash

**Files:**
- Modify: `internal/fx/events.go`, `internal/fx/world.go`, `internal/render/board.go`
- Test: `internal/fx/impact_test.go`, `internal/render/shake_test.go`

**Interfaces:**
- Consumes: `Emit`, `EmitBurst`, `FlashBorder`, `Trail`.
- Produces: `func (w *World) ShakeOffset() (int, int)`; `func (w *World) Shake(d time.Duration)`; `const ShakeDuration = 80 * time.Millisecond`; `var ShakePattern = [5][2]int{{0,1},{-1,0},{1,0},{0,-1},{0,0}}` (§18, verbatim).

- [ ] **Step 1: Write the failing tests**

In `internal/fx/impact_test.go`:
- `TestHardDropEmitsDebris`: `Handle` with `PieceHardDropped` -> `ParticleCount() > 0`, and every glyph is drawn from `{'·','*','✦','+'}` (§18)
- `TestHardDropFlashesBorder`: after the event, `BorderEnergy() > 0.8` (§18)
- `TestHardDropShakes`: after the event, `ShakeOffset()` is non-zero for at least one of the first five frames
- `TestShakeNeverExceedsOneCell`: during a whole shake, `|dx| <= 1` and `|dy| <= 1` at every 16ms step (§18, §44)
- `TestShakeFollowsPattern`: stepping the shake through five equal slices yields `ShakePattern` in order — deterministic, not random (§18)
- `TestShakeEndsAtZero`: after `Advance(ShakeDuration)`, `ShakeOffset()` -> `(0,0)`
- `TestShakeDurationIs80ms`: shake is still active at 70ms and finished at 90ms
- `TestReducedMotionSuppressesShake`: `Config{ReducedMotion:true}` -> `ShakeOffset()` stays `(0,0)` after a hard drop, but `ParticleCount() > 0` (§49.5: particles stay)
- `TestDebrisScalesWithDropDistance`: `Cells: 1` emits fewer particles than `Cells: 18`
- `TestZeroCellDropStillEmits`: `Cells: 0` -> at least one particle and a border flash (§18: hard drop always feels like something)
- `TestHardDropVerticalTrailCoversCrossedRows`: the trail's rows span exactly the `Cells` rows the piece crossed

In `internal/render/shake_test.go`:
- `TestShakeDoesNotResizeBoard`: for every offset in `ShakePattern`, `RenderBoard` -> 22 lines of width 22
- `TestShakeDoesNotClipTheActivePiece`: with a `(0,-1)` offset and the active piece on the top visible row, the active piece's glyphs are still present (§44)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run 'TestHardDrop|TestShake|TestDebris|TestReducedMotion|TestZeroCell' -v`
Expected: FAIL.

- [ ] **Step 3: Implement**

Debris count: `8 + 2*cells`, capped at 48. Burst origin is the center of the locked piece's bottom edge. Shake advances a phase timer and indexes `ShakePattern` by `int(elapsed/(ShakeDuration/5))`, clamped to index 4.

- [ ] **Step 4: Run tests to verify they pass, then look at it**

```bash
go test ./... -v
go run ./cmd/cosmic-tetris --seed 8675309
```

Hard-drop a piece. It should feel like dropping a refrigerator from orbit (§18). Then `--reduced-motion` and confirm the board stops moving but debris still flies.

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): hard-drop impact with debris, deterministic shake, and border flash"
```

---

### Task 7: Line-clear supernova

**Files:**
- Create: `internal/fx/supernova.go`
- Modify: `internal/fx/events.go`, `internal/render/board.go`
- Test: `internal/fx/supernova_test.go`

**Interfaces:**
- Consumes: `game.Event` with `Kind: LinesCleared` and `Rows []int`.
- Produces:
  - `type Supernova struct { Rows []int; Age time.Duration }`
  - `func (w *World) Supernovae() []render.RowFXCell` where `type RowFXCell struct { X, Y int; Glyph rune; Bright int }` in `render`
  - `const SupernovaLife = 220 * time.Millisecond`; phase boundaries `PhaseA` 0–70ms, `PhaseB` 70–150ms, `PhaseC` 150–220ms (§19: ~220ms total, three phases)

- [ ] **Step 1: Write the failing tests in `internal/fx/supernova_test.go`**

- `TestLinesClearedStartsSupernova`: `Handle` with `LinesCleared{Rows: []int{21}}` -> `len(Supernovae()) > 0` on row 21
- `TestSupernovaDoesNotDelayGameplay`: the engine has already cleared the row — assert `Handle` never returns a value and takes no game pointer (§19, §44)
- `TestPhaseAGlyphs`: at 30ms, the row's glyphs are drawn from `{'█','▓'}` (§19 Phase A: critical mass)
- `TestPhaseBExpandsFromCenter`: at 100ms, bright `✦` glyphs sit nearer the row center than the `░` glyphs (§19 Phase B: explosion moves outward)
- `TestPhaseCEmitsDebris`: at 200ms, `ParticleCount() > 0` and the row's own cells are mostly gone (§19 Phase C: fragments into debris)
- `TestDebrisInheritsHorizontalVelocity`: Phase C particles left of the row center have negative `VX`, those right of center positive (§19, explicit)
- `TestSupernovaExpires`: after `Advance(SupernovaLife + 20ms)`, `Supernovae()` is empty
- `TestFourRowsAllAnimate`: `Rows: []int{18,19,20,21}` -> all four rows produce cells
- `TestSupernovaRowsClampedToBoard`: `Rows: []int{-3, 99}` -> no panic, nothing rendered out of bounds
- `TestSupernovaNeverCoversLockedCellsAfterExpiry`: after expiry, the board renders exactly as it would with no FX (§44: particles never permanently alter the board)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestSupernova|TestPhase|TestLinesCleared|TestDebrisInherits|TestFourRows' -v`
Expected: FAIL.

- [ ] **Step 3: Implement**

Rows are in *logical* board coordinates; the renderer maps them to visible rows and skips rows above `HiddenRows`. Because the engine collapsed the stack at lock time, the supernova paints over whatever now occupies those rows — that is acceptable for 220ms and is why the effect is short.

- [ ] **Step 4: Run tests to verify they pass, then look at it**

```bash
go test ./... -v && go run ./cmd/cosmic-tetris --seed 8675309
```

Clear a line. §43 requires a visible supernova, debris, and a border reaction on the first completed line.

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): three-phase supernova line-clear animation"
```

---

### Task 8: Shockwaves

**Files:**
- Modify: `internal/fx/particle.go`, `internal/fx/events.go`
- Test: `internal/fx/shockwave_test.go`

**Interfaces:**
- Produces: `type Shockwave struct { X, Y float64; Age time.Duration }`; `func (w *World) EmitShockwave(x, y float64)`; `func (w *World) Shockwaves() []render.ParticleCell`; `const ShockwaveLife = 300 * time.Millisecond`; `var ShockwaveGlyphs = []rune{'·','○','◌','◯'}` (§24).

- [ ] **Step 1: Write the failing tests in `internal/fx/shockwave_test.go`**

- `TestShockwaveExpands`: the mean distance of returned cells from the origin at 250ms exceeds that at 50ms
- `TestShockwaveGlyphsProgress`: early cells use `·`, late cells use `◯` (§24)
- `TestShockwaveIsElliptical`: at a fixed age, the horizontal radius is about twice the vertical (terminal cells are ~2:1, §24: fake the geometry)
- `TestShockwaveExpires`: after `Advance(ShockwaveLife + 20ms)` -> empty
- `TestShockwaveClippedToViewport`: an origin near a corner -> every returned cell is in bounds
- `TestReducedMotionSuppressesShockwaves`: `ReducedMotion: true` -> `Shockwaves()` stays empty after `EmitShockwave` (§49.5)
- `TestShockwaveUsedSparingly`: a sequence of 20 single-line clears emits zero shockwaves; a four-line clear emits exactly one (§24: use sparingly)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run TestShockwave -v`
Expected: FAIL, `undefined: EmitShockwave`.

- [ ] **Step 3: Implement**

Radius grows as `28 * (age/ShockwaveLife)` horizontally and half that vertically; cells are sampled at 16 angles around the ellipse.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/fx
git commit -m "feat(fx): faked elliptical shockwave rings"
```

---

### Task 9: Hyperdrive

**Files:**
- Modify: `internal/fx/starfield.go`, `internal/fx/events.go`, `internal/fx/world.go`
- Test: `internal/fx/hyperdrive_test.go`

**Interfaces:**
- Produces: `func (w *World) TriggerHyperdrive()`; `func (w *World) HyperdriveFactor() float64`; `func (w *World) HighScoreReached()`; `const HyperdriveLife = 1100 * time.Millisecond`.

- [ ] **Step 1: Write the failing tests in `internal/fx/hyperdrive_test.go`**

The §16 envelope, sampled at its own keyframes:
- `TestHyperdrivePausesFirst`: at 20ms after trigger, `HyperdriveFactor() < 0.2` (§16: 0ms stars pause)
- `TestHyperdriveStretchesAt50ms`: at 60ms, factor is between `0.2` and `1.5`
- `TestHyperdriveAcceleratesAt100ms`: at 120ms, factor `> 2`
- `TestHyperdrivePeaksAt500ms`: the factor's maximum over the whole envelope occurs between 400ms and 600ms and is `>= 6`
- `TestHyperdriveDecaysAt800ms`: the factor at 800ms is less than at 500ms
- `TestHyperdriveNormalAt1100ms`: at 1100ms, factor is `1.0` within `0.05`
- `TestStarsMoveFarUnderHyperdrive`: total star displacement over the envelope exceeds 5× the same interval at rest
- `TestFourLineClearTriggersHyperdrive`: `Handle` with `LinesCleared{Rows: 4 rows}` -> factor rises (§16)
- `TestLargeComboTriggersHyperdrive`: `ComboChanged{Value: 5}` -> triggers; `Value: 2` -> does not
- `TestHighScoreTriggersHyperdrive`: `HighScoreReached()` -> triggers
- `TestSingleClearDoesNotTrigger`: `LinesCleared` with 1 row -> factor stays `1.0`
- `TestReTriggerRestartsEnvelope`: triggering at 600ms restarts from the pause phase rather than summing
- `TestReducedMotionSuppressesHyperdrive`: `ReducedMotion: true` -> factor stays `1.0`, but stars still drift at their base speed (§49.5)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestHyperdrive|TestStarsMoveFar|TestFourLineClearTriggers|TestLargeCombo|TestHighScore|TestSingleClearDoes|TestReTrigger' -v`
Expected: FAIL.

- [ ] **Step 3: Implement**

The envelope is a piecewise-linear function over §16's five keyframes — pin it as a table so the tests and the code agree:

```go
var hyperdriveEnvelope = []struct {
	At     time.Duration
	Factor float64
}{
	{0, 0.0},    // stars pause
	{50 * time.Millisecond, 0.6},   // stretch
	{100 * time.Millisecond, 4.0},  // violent acceleration
	{500 * time.Millisecond, 9.0},  // peak
	{800 * time.Millisecond, 3.0},  // decay
	{1100 * time.Millisecond, 1.0}, // normal
}
```

`HighScoreReached` is called by `app` (Task 11), not derived inside `fx` — the world does not know the high score.

- [ ] **Step 4: Run tests to verify they pass, then look at it**

```bash
go test ./... -v && go run ./cmd/cosmic-tetris --seed 8675309
```

Land a four-line clear. The terminal should appear to enter hyperspace for absolutely no reason.

- [ ] **Step 5: Commit**

```bash
git add internal/fx
git commit -m "feat(fx): hyperdrive starfield envelope"
```

---

### Task 10: Banners, four-line spectacle, and level-up notification

**Files:**
- Create: `internal/fx/banner.go`
- Modify: `internal/fx/events.go`, `internal/render/render.go`
- Test: `internal/fx/banner_test.go`, `internal/render/banner_test.go`

**Interfaces:**
- Produces:
  - `type BannerKind uint8` with `BannerMajor = 0, BannerNotice = 1` — the numeric values matter, because they travel through `render.BannerView.Kind` as a `uint8`
  - `type banner struct { Kind BannerKind; Title, Subtitle string; Age, Life time.Duration }` — unexported; the world's internal queue entry
  - `func (w *World) Banner() (render.BannerView, bool)` — the `render.FXView` method (Plan 1 Task 15); returns the single highest-priority live banner, `BannerMajor` outranking `BannerNotice`
  - `const BannerLife = 700 * time.Millisecond`, `NoticeLife = 1400 * time.Millisecond`
  - `var FourLineBanners = []string{...}`, `var LevelSubtitles = []string{...}`

- [ ] **Step 1: Write the failing tests in `internal/fx/banner_test.go`**

- `TestFourLineClearShowsBanner`: `LinesCleared` with 4 rows -> a `BannerMajor` whose `Title` is one of `FourLineBanners`
- `TestFourLineBannerCopy`: `FourLineBanners` contains exactly §20's four strings: `✦ EVENT HORIZON ✦`, `QUADRUPLE COSMIC INCIDENT`, `FOUR ROWS HAVE LEFT THE CHAT`, `SPACE-TIME HAS FILED A COMPLAINT`
- `TestBannerLife700ms`: present at 650ms, gone at 750ms (§20)
- `TestBannerSelectionIsSeeded`: same seed -> same banner choice
- `TestLevelUpShowsNotice`: `LevelChanged{Value: 8}` -> a `BannerNotice` with `Title` containing `GRAVITY ANOMALY DETECTED` and `LEVEL 08` (§22, zero-padded)
- `TestLevelSubtitleCopy`: `LevelSubtitles` contains §22's three strings: `GRAVITY TAX INCREASED`, `LOCAL PHYSICS UPDATED WITHOUT CONSENT`, `PLEASE SECURE ALL LOOSE TETROMINOES`
- `TestMajorOutranksNotice`: a level-up and a four-line clear in the same `Handle` -> `Banner()` returns a `render.BannerView` with `Kind == uint8(BannerMajor)`, and only one banner is returned — **Review Focus 3**
- `TestNoticeSurvivesMajorExpiry`: with both live, after the major expires the notice becomes visible (nothing is lost, just deferred)
- `TestFourLineFiresEverything`: `LinesCleared` with 4 rows -> hyperdrive triggered, shake active, border energy high, particles emitted, a shockwave present, and a banner live — all six §20 reactions at once
- `TestFourLineStarDensityIncreases`: star count is temporarily higher after a four-line clear and returns to baseline within 2s (§20)
- `TestSimultaneousEventsDoNotPanic`: `Handle` with all nine `EventKind`s in one slice -> no panic, at most one banner — **Review Focus 3**

- [ ] **Step 2: Write the failing tests in `internal/render/banner_test.go`**

- `TestBannerCenteredOverBoard`: with a stub banner, the title appears once, horizontally centered
- `TestBannerDoesNotChangeLineCount`: output line count with and without a banner is identical (§20: must not block gameplay, and must not reflow the screen)
- `TestBannerTruncatedAtSmallWidth`: at `40×24`, a long banner's rendered width is `<= 40` and it stays on one or two lines
- `TestBannerDoesNotHideActivePiece`: with the active piece in the top visible rows and a banner live, the active piece's glyphs are still in the output (§44)
- `TestNoBannerWhenNilFX`: `Scene{FX:nil}` -> no banner region

- [ ] **Step 3: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ -run 'TestBanner|TestFourLine|TestLevelUp|TestLevelSubtitle|TestMajor|TestNotice|TestSimultaneous' -v`
Expected: FAIL.

- [ ] **Step 4: Implement**

Banners render into the top third of the board area, above the current stack where the piece rarely is; the "does not hide the active piece" test is what makes that placement binding. The notification slides by shifting its row by `Age/Life`, fading via color only — no pause (§22).

- [ ] **Step 5: Run tests to verify they pass, then look at it**

```bash
go test ./... -v && go run ./cmd/cosmic-tetris --seed 8675309
```

A four-line clear must produce an immediate "LOL WHAT THE FUCK" reaction. That is an actual product requirement (§43).

- [ ] **Step 6: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): four-line spectacle, banners, and level-up notification"
```

---

### Task 11: Mission control and combo escalation

**Files:**
- Create: `internal/flavor/messages.go`, `internal/flavor/channel.go`
- Modify: `internal/app/update.go`, `internal/fx/events.go`
- Test: `internal/flavor/channel_test.go`, `internal/fx/combo_test.go`

**Interfaces:**
- Produces:
  - `type Channel struct { ... }`; `func NewChannel(seed int64) *Channel`
  - `func (c *Channel) Handle(events []game.Event)`; `func (c *Channel) Advance(dt time.Duration)`; `func (c *Channel) Current() string`
  - `const MessageHold = 2500 * time.Millisecond`, `MessageCooldown = 1200 * time.Millisecond`
  - `var Idle, Locked, Cleared, Combo, LevelUp []string` — the §27 copy tables
  - `func ComboTaunt(combo int) string` — the §21 escalation lines
  - `func (w *World) ComboIntensity() float64` in `[0,1]`

- [ ] **Step 1: Write the failing tests in `internal/flavor/channel_test.go`**

- `TestChannelStartsWithAMessage`: `NewChannel(1).Current()` is non-empty
- `TestEventChangesMessage`: `Handle([]game.Event{{Kind: game.LinesCleared, Rows: []int{21}}})` -> `Current()` changed
- `TestMessageHoldsBeforeChanging`: a second event 200ms later does not change `Current()` (§27: give them time to breathe)
- `TestMessageChangesAfterCooldown`: after `Advance(MessageHold + MessageCooldown)`, a new event does change it
- `TestNoConstantRotation`: over 10s of `Advance(16ms)` with no events, `Current()` changes at most twice (§27: do not rotate constantly)
- `TestCopyTableContents`: `Locked`/`Cleared`/`Idle` together contain §27's exact strings, including `TETROMINO INJECTION SUCCESSFUL`, `STRUCTURAL VIBES: QUESTIONABLE`, `LOCAL UNIVERSE STABLE*`, `MOON NOTIFIED`, `ORBITAL OSHA HAS ENTERED THE CHAT`, `WE HAVE EXCEEDED THE RECOMMENDED NUMBER OF BLOCKS`, `PHYSICS TEAM SAYS KEEP GOING`, `GRAVITY REMAINS MOSTLY LEGAL`
- `TestSeededSelection`: two channels with the same seed produce the same message sequence for the same event stream
- `TestChannelRNGIsSeparate`: the channel takes a seed, never a `*game.Game` or the game's RNG (§35)
- `TestComboMessagesEscalate`: `ComboTaunt(5)` -> `COMBO 5 // UNAUTHORIZED ORBITAL MANEUVER`; `ComboTaunt(6)` -> `COMBO 6 // STRUCTURAL REALITY FAILURE`; `ComboTaunt(7)` -> `COMBO 7 // NASA DENIES EVERYTHING` (§21, verbatim)
- `TestComboTauntBelowFive`: `ComboTaunt(2)` -> `""` (the escalating taunts start at 5)
- `TestComboTauntAboveSeven`: `ComboTaunt(12)` -> non-empty, no panic, no index error
- `TestHighPriorityEventPreempts`: a four-line `LinesCleared` changes the message even inside the hold window

- [ ] **Step 2: Write the failing tests in `internal/fx/combo_test.go`**

- `TestComboTwoSparks`: `ComboChanged{Value:2}` -> a small number of particles (§21 combo 2: small sparks)
- `TestComboThreeMeteors`: `Value:3` -> more particles than combo 2, including meteor glyphs
- `TestComboFourPulses`: `Value:4` -> `ComboIntensity() >= 0.5`, which the HUD uses to pulse (§21 combo 4)
- `TestComboFivePlusIsChaos`: `Value:6` -> `ComboIntensity() == 1.0`, hyperdrive triggered, shockwave present
- `TestComboResetDropsIntensity`: `ComboChanged{Value:0}` -> `ComboIntensity()` decays to 0 within 1s
- `TestComboIntensityBounded`: `Value:99` -> `ComboIntensity() <= 1.0`
- `TestBoardStaysReadableAtMaxCombo`: at combo 12, `render.Render`'s board region still shows every locked cell glyph (§21: board readability remains sacred) — assert by rendering with a known stack and counting block glyphs in the board rows

- [ ] **Step 3: Run tests to verify they fail**

Run: `go test ./internal/flavor/ ./internal/fx/ -run 'TestChannel|TestMessage|TestCombo|TestCopy|TestSeeded|TestNoConstant|TestHighPriority|TestBoardStays' -v`
Expected: FAIL.

- [ ] **Step 4: Implement**

`app.Model` gains `Channel *flavor.Channel` and a `HighScore int`; `handleEvents` fans each `[]game.Event` out to `m.FX.Handle`, `m.Channel.Handle`, and a high-score check that calls `m.FX.HighScoreReached()` when `Score` passes the session high. `Model.MissionControl` reads `m.Channel.Current()` each frame, and the renderer already draws it (Plan 1 Task 14).

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/flavor internal/app internal/fx
git commit -m "feat(flavor): mission-control channel and combo escalation"
```

---

### Task 12: `--no-fx`, `--reduced-motion`, and the coolness acceptance pass

**Files:**
- Modify: `internal/app/model.go`, `internal/render/render.go`, `README.md`
- Test: `internal/app/modes_test.go`, `internal/render/nofx_test.go`

**Interfaces:**
- Consumes: everything above.
- Produces: no new API. This task makes the two flags real and proves §43 and §44.

- [ ] **Step 1: Write the failing tests**

In `internal/app/modes_test.go`:
- `TestNoFXSkipsAllFXWork`: with `NoFX`, `testing.AllocsPerRun` on a `FrameMsg` is at most that of the same frame with FX disabled by an empty world — i.e. no FX simulation runs at all — **Review Focus 5**
- `TestNoFXGameStillFullyPlayable`: with `NoFX`, a scripted 200-step session produces the same `Score`, `Lines`, `Level`, and `Board` as the same script with FX on (§44: effects never modify game state, §47: fun with effects disabled)
- `TestReducedMotionGameIdentical`: same equality check for `ReducedMotion`
- `TestReducedMotionKeepsColorAndParticles`: with `ReducedMotion`, particles and trails are non-empty while shake and shockwaves stay empty and hyperdrive stays at `1.0` (§49.5, all four clauses)
- `TestFXNeverMutatesGame`: run 500 frames with heavy events, snapshotting the game before/after each `m.FX.Handle` call -> the game is unchanged every time (§14, the central invariant)

In `internal/render/nofx_test.go`:
- `TestNilFXAtEveryCallSite`: `Render(Scene{FX:nil})` at 12 sizes across the range -> no panic — **Review Focus 5**
- `TestNoFXGoldenMatchesPlan1`: `Scene{FX:nil}` at `80×30` still matches `testdata/wide.golden`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ ./internal/render/ -run 'TestNoFX|TestReducedMotion|TestNilFX|TestFXNever' -v`
Expected: FAIL.

- [ ] **Step 3: Implement the flag behavior**

`NoFX` leaves `Model.FX` nil and skips `handleEvents`' FX fan-out entirely — no empty world doing per-frame work. `ReducedMotion` passes through to `fx.Config` and is checked in `Shake`, `EmitShockwave`, and `TriggerHyperdrive`.

- [ ] **Step 4: Run the coolness acceptance test by hand (§43)**

```bash
go test ./... -count=1
go run ./cmd/cosmic-tetris --seed 8675309
```

Within the first 30 seconds of normal play, confirm you see all six: moving starfield, animated board border, piece trails, hard-drop impact, particles, mission-control commentary. On the first completed line, confirm: supernova, debris, border reaction. On a four-line clear, confirm the §20 six-way eruption. Then check the restraint rules (§44) still hold: controls feel immediate, nothing obscures the active piece, no flicker, shake stays within one cell.

Then run `--no-fx` and confirm it is still a good game, and `--reduced-motion` and confirm nothing lurches. Update the README's flag section to describe what each flag now actually does.

- [ ] **Step 5: Commit**

```bash
git add internal/app internal/render README.md
git commit -m "feat(cli): make --no-fx and --reduced-motion real; coolness acceptance pass"
```

---

## Done when

- `go test ./... -count=2` passes; `go vet ./...` and `gofmt -l .` clean.
- No signature under `internal/fx` mentions `*game.Game`, and the parser test enforces it.
- `game` still contains no `time.Now()` and does not import `fx`.
- §43's checklist is satisfied by hand, and §44's restraint rules hold.
- `--no-fx` and `--reduced-motion` change presentation only; the scripted-session equality tests prove it.
