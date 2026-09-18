# Cosmic Tetris — Plan 3: Cosmic Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the universe lose its shit around the player — starfield, animated border, piece trails, hard-drop impact, particle physics, supernova line clears, shockwaves, hyperdrive, the four-line event, mission control, boot sequence, and a black-hole game over — without touching a single field of game state.

**Architecture:** A new package `internal/fx` holds an independent simulation: it receives `[]game.Event` plus a few plain ints, owns its own `*rand.Rand`, and exposes read-only accessors. It has no reference to `*game.Game` and therefore *cannot* modify it — that is how design.md §14's rule is enforced, structurally rather than by convention. `internal/render` reads `fx.World` and composites its output into the existing canvas at the §37 slots. `internal/flavor` is pure string data. Dependency direction stays one-way: `game ← flavor ← fx ← render ← app`.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2` (spinner for the boot screen), `github.com/charmbracelet/x/ansi` in tests.

**Spec:** `design.md` (this plan implements §14–§29, §30 star behavior, §32 modes, §43, §44, §45, §46, §49.5)

**Depends on:** `plans/2026-09-17-cosmic-tetris-1-engine.md` and `plans/2026-09-17-cosmic-tetris-2-terminal.md`, both complete. The seams it extends are `render.Scene`, `render.BoardCellOrigin`, `render.Palette`, and `app.Model`.

## Global Constraints

- `internal/fx` must not import `internal/render`, `internal/app`, or hold a `*game.Game`. It may import `internal/game` for `Event`/`Point`/`PieceKind` and `internal/flavor` for strings (§14, §33).
- `fx.World` owns a second `*rand.Rand`, seeded independently of the game seed. The two generators never share and FX randomness must never reach the bag (§35, §49.6).
- FX simulation runs on the same single 60 Hz `app.FrameMsg` clock as gravity. No new tickers, no goroutine per particle or per frame (§38).
- Screen shake never exceeds one terminal cell in any direction (§44).
- Effects never delay gameplay, never block input, never obscure the active piece, and never make the board harder to read (§44). Where a choice trades legibility for spectacle, legibility wins.
- `--no-fx` disables the starfield, particles, trails, shake, shockwaves, hyperdrive, banners, border animation, boot sequence, and game-over collapse. It keeps piece colors, the ghost, and the mission-control line: "the boring mode should still be a good game" (§32).
- `--reduced-motion` suppresses screen shake, hyperdrive acceleration, and shockwaves only; color, trails, and particles stay (§49.5).
- Total live particles are capped at `MaxParticles` (600). Reuse slices; do not reallocate per frame (§38).
- All flavor copy is reproduced verbatim from the spec sections that quote it (§20, §21, §22, §27, §28, §29, §45).
- `gofmt -l .` and `go vet ./...` silent before every commit.
- Every `fx` unit test calls `Resize(120, 40)` before asserting, unless the test is *about* canvas size. Task 15 scales emission counts by canvas area, so exact-count assertions only stay stable at full intensity.

## Review Focus

Input classes the spec implies but never names. Each has a test pinned in the task that owns the code.

- **FX drawing outside the canvas** — particles drift off-screen, shake pushes the board against an edge, a shockwave radius exceeds the window: every write goes through `Canvas.Set`'s clipping and no row may change width — Tasks 2, 4, 7, 9.
- **Unbounded particle growth** during a long combo chain or a held hard-drop key: the live count must stay ≤ `MaxParticles` with the oldest dropped first — Task 2.
- **`--no-fx` and `--reduced-motion` together**: nothing animates, the frame is byte-stable across steps, gameplay is unaffected — Task 16.
- **A very large `dt`** reaching `Step` (suspended process, laptop lid): timers clamp to `MaxStepDt`, no negative alpha, no NaN positions, no banner stuck on screen forever — Task 1.
- **Paused**: gameplay particles, trails, banners, and shake freeze; only stars keep drifting, at 0.25× (§30) — Tasks 1, 3.

---

## File Structure

| File | Responsibility |
|---|---|
| `internal/fx/world.go` | `Config`, `Status`, `World`, `NewWorld`, `Consume`, `Step`, `Resize`, `SetBoardRect`, `ResetRun`, all accessors |
| `internal/fx/glyphs.go` | `GlyphSet`, `UnicodeGlyphs`, `ASCIIGlyphs` — logical glyph inventory, no render dependency |
| `internal/fx/particle.go` | `Particle`, integration, emitters, the particle cap |
| `internal/fx/starfield.go` | `Star`, three layers, level scaling, density boosts, shooting stars |
| `internal/fx/trails.go` | `Trail`, move and hard-drop ion trails |
| `internal/fx/impact.go` | screen shake, border flash, hard-drop impact composition |
| `internal/fx/clears.go` | `ClearBand` — the three-phase supernova |
| `internal/fx/shockwave.go` | `Shockwave` rings |
| `internal/fx/hyperdrive.go` | the §16 timeline state machine |
| `internal/fx/banner.go` | `Banner`, `Notice`, HUD pulse |
| `internal/fx/mission.go` | mission-control channel with priorities and dwell time |
| `internal/fx/collapse.go` | the game-over black hole |
| `internal/flavor/messages.go` | every string the spec quotes |
| `internal/render/fxdraw.go` | draws stars, trails, particles, bands, rings, banners, notices from `fx.World` |
| `internal/render/boot.go` | the §29 boot screen |
| `internal/render/collapse.go` | freeze / infall / singularity drawing |

Tests sit beside each file; render FX goldens go under `internal/render/testdata/`.

---

### Task 1: `fx.World` skeleton, clock discipline, and pause behavior

**Files:**
- Create: `internal/fx/world.go`, `internal/fx/glyphs.go`
- Test: `internal/fx/world_test.go`

**Interfaces:**
- Consumes: `game.Event`, `game.EventKind`, `game.Point`.
- Produces:
  ```go
  type Config struct {
      Enabled       bool // false under --no-fx
      ReducedMotion bool
      Glyphs        GlyphSet
  }

  // Status carries the only game facts FX is allowed to know. Plain ints by
  // design: fx never receives a *game.Game, so it cannot modify game state
  // (design.md §14).
  type Status struct {
      Level int
      Combo int
      Lines int
      Score int
      Best  int
  }

  type World struct{ /* unexported */ }

  func NewWorld(cfg Config, seed int64) *World
  func (w *World) SetConfig(cfg Config)
  func (w *World) Resize(width, height int)
  func (w *World) SetBoardRect(x, y, cols, rows int) // interior of the board box, screen cells
  func (w *World) Consume(evs []game.Event, st Status)
  func (w *World) Step(dt time.Duration, paused bool)
  func (w *World) ResetRun() // on restart: drop all live effects and per-run latches
  func (w *World) Elapsed() time.Duration

  // glyphs.go
  type GlyphSet struct {
      Sparks    []rune  // '·','*','✦','+'
      Debris    []rune  // '·','*','✦'
      StarsFar  []rune  // '.'
      StarsMid  []rune  // '·','˚'
      StarsNear []rune  // '✦','✧','*'
      Trail     [3]rune // 1/2/3 steps ago: '▓','▒','░'
      Streak    rune    // hyperdrive stretch: '│'
      Ring      []rune  // '·','○','◌','◯'
      Clear     [4]rune // '▓','█','░','✦'
      Singularity rune  // '●'
  }
  func UnicodeGlyphs() GlyphSet
  func ASCIIGlyphs() GlyphSet // '.', '*', '+', '#','=','-', '|', 'o','O', '@'

  const (
      MaxStepDt    = 100 * time.Millisecond
      MaxParticles = 600
  )
  ```
  `Step` clamps `dt` to `MaxStepDt`, ignores `dt <= 0`, and advances `Elapsed` by the clamped amount. When `paused` is true it advances only the starfield (at `PausedStarScale`, Task 3) and freezes every other timer.

- [ ] **Step 1: Write the failing tests in `internal/fx/world_test.go`**

- `test_new_world_is_empty`: `NewWorld(Config{Enabled: true, Glyphs: UnicodeGlyphs()}, 1)` -> `Particles()`, `Trails()`, `Shockwaves()`, `ClearBands()` all empty; `Banner()` -> `ok` false
- `test_step_advances_elapsed`: two `Step(16ms, false)` -> `Elapsed()` 32ms
- `test_step_ignores_zero_and_negative_dt`: `Step(0,false)` and `Step(-1s,false)` -> `Elapsed()` unchanged
- `test_step_clamps_huge_dt`: `Step(30*time.Second, false)` -> `Elapsed()` `MaxStepDt`
- `test_huge_dt_does_not_strand_a_banner`: show a banner, then `Step(30s,false)` repeatedly 20 times -> `Banner()` `ok` false (timers converge; nothing sticks)
- `test_paused_freezes_elapsed_effects`: spawn effects, record counts, `Step(500ms, true)` -> particle count, trail count, and shake offset unchanged
- `test_disabled_world_ignores_events`: `Config{Enabled: false}`; `Consume` a `LinesCleared` event -> no particles, no bands, no banner, `ShakeOffset()` -> `(0,0)`
- `test_consume_never_needs_a_game`: compile-level assertion — a test that constructs `Consume([]game.Event{...}, Status{})` with no `*game.Game` in scope (documents the §14 boundary)
- `test_fx_rng_is_independent`: two worlds with the same fx seed produce identical particle positions after identical `Consume`+`Step` sequences, and a third world with a different fx seed differs — while the `game.Game` used to generate the events is untouched in all three (deep-equal)
- `test_reset_run_clears_everything`: after spawning effects, `ResetRun()` -> all accessors empty, `ShakeOffset()` `(0,0)`
- `test_resize_keeps_working`: `Resize(0,0)` then `Step` -> no panic; `Resize(200,80)` afterwards works
- `test_ascii_glyphs_are_ascii`: every rune in `ASCIIGlyphs()` is < U+0080
- `test_all_glyphs_single_width`: every rune in both glyph sets satisfies `ansi.StringWidth(string(r))` -> `1`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -v`
Expected: FAIL — undefined: `NewWorld`

- [ ] **Step 3: Implement `world.go` and `glyphs.go`**

`World` holds the config, board rect, canvas size, `rng`, `elapsed`, and empty slices for each subsystem, plus a `dispatch(ev game.Event, st Status)` switch that Tasks 5–13 fill in one case at a time. `Consume` returns immediately when `!cfg.Enabled`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx
git commit -m "feat(fx): world skeleton with independent rng, clamped clock, and pause freeze"
```

---

### Task 2: Particle physics

**Files:**
- Create: `internal/fx/particle.go`
- Test: `internal/fx/particle_test.go`

**Interfaces:**
- Consumes: `World`, `GlyphSet`.
- Produces:
  ```go
  type Particle struct {
      X, Y       float64
      VX, VY     float64
      Life       float64 // seconds remaining
      MaxLife    float64
      Glyph      rune
      Brightness float64 // 0..1, derived from Life/MaxLife at spawn-time color
      Hue        Hue     // which palette family render should color it with
  }

  type Hue int
  const (
      HueSpark Hue = iota // hot white / gold
      HueDebris           // inherits the cleared row's neon
      HueIon              // cyan
  )

  func (w *World) Particles() []Particle
  func (w *World) ParticleCount() int
  func (w *World) Emit(p Particle)                 // respects MaxParticles
  func (w *World) EmitBurst(x, y float64, n int, minSpeed, maxSpeed, spreadDeg, aimDeg float64, h Hue, glyphs []rune)

  const (
      ParticleGravity = 14.0 // cells/s² downward
      ParticleDrag    = 0.40 // v *= pow(ParticleDrag, dt)
  )
  ```
  Integration per §23, in this order: `X += VX*dt; Y += VY*dt; VY += ParticleGravity*dt; damp := pow(ParticleDrag, dt); VX *= damp; VY *= damp; Life -= dt`. A particle dies when `Life <= 0` or when it leaves the canvas by more than 2 cells on any side. `Brightness` is recomputed each step as `Life / MaxLife`.

- [ ] **Step 1: Write the failing tests in `internal/fx/particle_test.go`**

- `test_position_integrates`: a particle at `(5,5)` with `VX: 10, VY: 0`, `Step(100ms)` -> `X` ≈ `6.0` (within 0.01)
- `test_gravity_accelerates_downward`: `VY` after `Step(100ms)` from 0 -> ≈ `1.4 * pow(0.4,0.1)` (assert `VY > 0` and within 0.05 of the computed value)
- `test_drag_reduces_speed`: `VX: 10`, `Step(1s)` -> `VX` ≈ `4.0`
- `test_life_decreases`: `MaxLife: 0.5`, `Step(100ms)` -> `Life` ≈ `0.4`, `Brightness` ≈ `0.8`
- `test_dies_at_zero_life`: `Life: 0.05`, `Step(100ms)` -> `ParticleCount()` 0
- `test_dies_outside_viewport`: a particle at `X: -10` on a 40×24 canvas -> removed on the next `Step`
- `test_survives_just_off_edge`: a particle at `X: -1` survives (the 2-cell grace margin lets debris fall back in)
- `test_no_nan_after_huge_dt`: `Step(30s)` -> no particle has a NaN or Inf coordinate
- `test_emit_burst_count`: `EmitBurst(x,y,20,...)` -> `ParticleCount()` 20
- `test_emit_burst_spread`: with `aimDeg: -90` (straight up) and `spreadDeg: 40`, every particle's velocity angle is within 20° of straight up and speed is inside `[minSpeed, maxSpeed]`
- `test_emit_burst_is_seeded`: two worlds with the same seed produce identical bursts
- `test_particle_cap`: 100 calls of `EmitBurst(..., 20, ...)` -> `ParticleCount()` -> exactly `MaxParticles`
- `test_particle_cap_drops_oldest`: emit a uniquely-glyphed particle first, fill past the cap, and assert that unique glyph is gone while the most recent emissions survive
- `test_slice_is_reused`: after filling to the cap and letting all particles die, `cap(w.Particles())` is still ≥ `MaxParticles` (no reallocation churn per frame)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run TestParticle -v`
Expected: FAIL — undefined: `EmitBurst`

- [ ] **Step 3: Implement `particle.go`**

Store particles in a `[]Particle` compacted in place each step (write-cursor filter, no allocation). `Emit` at the cap overwrites index `oldest` in a ring-buffer fashion or shifts the slice — either is fine as long as the dropped particle is the oldest.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/particle.go internal/fx/particle_test.go
git commit -m "feat(fx): terminal-space particle physics with a hard particle cap"
```

---

### Task 3: Starfield

**Files:**
- Create: `internal/fx/starfield.go`
- Test: `internal/fx/starfield_test.go`

**Interfaces:**
- Consumes: `World`, `GlyphSet`, `Status.Level`.
- Produces:
  ```go
  type Star struct {
      X, Y   float64
      Glyph  rune
      Layer  int     // 0 far, 1 mid, 2 near
      Bright float64 // 0.45 far, 0.7 mid, 1.0 near
  }
  func (w *World) Stars() []Star
  func (w *World) StarSpeedScale() float64 // level scaling × hyperdrive multiplier
  func (w *World) BoostStars(extra int, d time.Duration)
  func (w *World) ShootingStar() (Particle, bool) // §45, occasional

  const (
      StarsFarPerCells  = 60
      StarsMidPerCells  = 110
      StarsNearPerCells = 220
      FarSpeed          = 1.2 // cells/s downward
      MidSpeed          = 3.0
      NearSpeed         = 6.5
      PausedStarScale   = 0.25
      LevelSpeedStep    = 0.06
      LevelSpeedMax     = 2.5
      ShootingStarMinGap = 8 * time.Second
      ShootingStarMaxGap = 20 * time.Second
  )
  ```
  Population is `width*height / StarsXPerCells` per layer, recomputed on `Resize`. Stars drift downward and wrap to `Y = 0` at a fresh random `X` when they pass the bottom.

- [ ] **Step 1: Write the failing tests in `internal/fx/starfield_test.go`**

- `test_populates_three_layers`: `Resize(80,24)` -> `Stars()` contains stars with `Layer` 0, 1, and 2
- `test_population_scales_with_area`: the count at `160×48` is roughly 4× the count at `80×24` (within 15%)
- `test_stars_start_inside_canvas`: every star satisfies `0 <= X < 80` and `0 <= Y < 24`
- `test_stars_drift_downward`: after `Step(1s, false)` a far star's `Y` increased by ≈ `1.2`, a mid star by ≈ `3.0`, a near star by ≈ `6.5`
- `test_stars_wrap`: a star placed at `Y: 23.9` on a 24-row canvas -> after a step it is near `Y` 0 and still inside the canvas
- `test_level_increases_speed`: `Consume` with `Status{Level: 6}` -> `StarSpeedScale()` ≈ `1.30`; `Level: 40` -> `LevelSpeedMax`
- `test_level_scale_floor`: `Level: 1` -> `1.0`
- `test_paused_stars_drift_slowly`: `Step(1s, true)` -> a far star moved ≈ `1.2 * PausedStarScale` (§30: background stars keep drifting very slowly)
- `test_glyphs_by_layer`: far stars use only `StarsFar` glyphs, mid only `StarsMid`, near only `StarsNear`
- `test_brightness_by_layer`: far `0.45`, mid `0.7`, near `1.0`
- `test_boost_adds_and_expires`: `BoostStars(40, 1*time.Second)` -> count grows by 40; after `Step` totalling 1.2 s the count is back to the base population
- `test_resize_to_zero`: `Resize(0,0)` -> `Stars()` empty, `Step` does not panic
- `test_disabled_world_has_no_stars`: `Config{Enabled: false}` -> `Stars()` empty
- `test_shooting_star_occasional`: over 60 s of stepping, `ShootingStar()` fired at least twice and at most eight times

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run TestStar -v`
Expected: FAIL — undefined: `Stars`

- [ ] **Step 3: Implement `starfield.go`**

Shooting stars are ordinary particles with a long life and a diagonal velocity, emitted on a countdown drawn from `[ShootingStarMinGap, ShootingStarMaxGap]`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/starfield.go internal/fx/starfield_test.go
git commit -m "feat(fx): three-layer starfield with level scaling and drifting pause behavior"
```

---

### Task 4: Wire FX into the render pipeline and the app

**Files:**
- Create: `internal/render/fxdraw.go`
- Modify: `internal/render/render.go` (`Scene`), `internal/render/palette.go` (`Star` color), `internal/app/model.go`, `internal/app/update.go`
- Test: `internal/render/fxdraw_test.go`, `internal/app/update_test.go` (append)

**Interfaces:**
- Consumes: `fx.World` accessors, `Canvas`, `Layout`, `Palette`.
- Produces:
  ```go
  // render
  type Scene struct { /* Plan 2 fields */ FX *fx.World } // nil FX = nothing drawn
  func DrawStarfield(c *Canvas, l Layout, p Palette, w *fx.World)
  func DrawParticles(c *Canvas, p Palette, w *fx.World)
  func ParticleColor(p Palette, h fx.Hue, bright float64) color.Color

  // palette additions
  // Palette.Star = #C9D6FF ; Palette.Spark = #FFEBA3 ; Palette.Ion = #9FF7FF

  // app
  // Model gains: FX *fx.World, Best int
  func (m *Model) syncFX() // called on resize: Resize + SetBoardRect from the current layout
  func fxGlyphs(m render.Mode) fx.GlyphSet // ModeASCII -> fx.ASCIIGlyphs(), otherwise fx.UnicodeGlyphs()
  ```

Pipeline order in `Render`, filling §37's numbered slots:

```text
1 layout
2 DrawStarfield          (skipped inside the board interior — see below)
3 DrawBoard              (locked, ghost, active; offset by FX.ShakeOffset)
6 DrawTrails, DrawClearBands, DrawShockwaves   (board-local FX, Tasks 6/8/9)
7 board border           (inside DrawBoard, colored by Task 5)
8 hold / next / stats
9 DrawParticles          (global FX)
10 banners and notices   (Task 11)
11 mission-control line
12 controls / help
```

Stars are drawn everywhere *outside* the board box, and inside the board interior only where the cell is empty — the board reads as a window onto space without stars ever sitting on top of a block (§15 "never make the background so busy that the board becomes harder to read"). Pin: `DrawStarfield` runs before `DrawBoard`, so board drawing naturally paints over it; stars never overwrite a block because they are drawn first.

- [ ] **Step 1: Write the failing tests**

- `test_starfield_drawn_outside_board`: with a populated world, at least one non-space glyph appears outside `l.Board`
- `test_stars_never_cover_locked_blocks`: fill the board with locked cells, render, and assert every interior cell holds a block glyph (no star glyph inside the board)
- `test_stars_never_cover_the_active_piece`: assert the active piece's cells hold `p.Active[kind]` after a full render with a dense starfield (§44)
- `test_particles_clipped_to_canvas`: emit particles at `(-5,-5)`, `(1000,1000)`, `(0,0)` -> render does not panic and every row keeps its exact width
- `test_particle_color_dims_with_brightness`: `ParticleColor(p, fx.HueSpark, 0.2)` is darker than at `1.0` (component sum comparison)
- `test_nil_fx_renders_plain`: `Scene{FX: nil}` produces byte-identical output to the Plan 2 golden for the same scene
- `test_row_widths_with_fx`: for `(w,h)` in `{40×24, 80×30, 300×100}` × three modes, every stripped row is exactly `w` columns with a populated world
- `test_app_syncs_fx_on_resize`: `Update(tea.WindowSizeMsg{Width: 80, Height: 30})` -> the world's board rect matches `render.Compute(80,30).Board` interior; a `20×10` resize does not panic
- `test_app_feeds_events_to_fx`: a hard-drop key press results in a non-empty `fx` particle or trail population
- `test_app_steps_fx_on_frame`: two frames 16 ms apart -> `FX.Elapsed()` 16ms
- `test_app_does_not_step_fx_gameplay_while_paused`: pause, then frames spanning 1 s -> particle count unchanged
- `test_fx_never_mutates_game`: deep-equal the `game.Game` across a 600-frame scripted session with FX enabled (§14)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run TestStarfield -v`
Expected: FAIL — undefined: `DrawStarfield`

- [ ] **Step 3: Implement the wiring**

`app.New` builds the world with `fx.NewWorld(fx.Config{Enabled: !cfg.NoFX, ReducedMotion: cfg.ReducedMotion, Glyphs: fxGlyphs(mode)}, time.Now().UnixNano())` — a clock-derived seed, deliberately unrelated to the game seed (§35). On `tea.ColorProfileMsg`, call `SetConfig` with the glyph set for the new mode.

- [ ] **Step 4: Run tests and look at it**

Run: `go test ./... -v && go run ./cmd/cosmic-tetris`
Expected: PASS, and stars drift behind the board while the game plays normally.

- [ ] **Step 5: Commit**

```bash
git add internal/render internal/app
git commit -m "feat(render): composite the starfield and particles into the frame pipeline"
```

---

### Task 5: Animated board border

**Files:**
- Modify: `internal/fx/world.go`, `internal/render/board.go`, `internal/render/render.go`
- Create: `internal/fx/border.go`
- Test: `internal/fx/border_test.go`, `internal/render/board_test.go` (append)

**Interfaces:**
- Produces:
  ```go
  func (w *World) BorderPhase() float64  // 0..1 position in Palette.BorderCycle
  func (w *World) BorderFlash() float64  // 0..1 extra brightness, decaying
  func (w *World) PulseBorder(d time.Duration) // rapid gradient travel during major events
  func (w *World) FlashBorder(d time.Duration)

  // render
  func BorderColorAt(p Palette, phase float64, flash float64, i, total int) color.Color
  ```
  `BorderPhase` advances at `BorderCycleSpeed` (one full 5-color cycle per 24 s — deliberately subtle per §25) and at `BorderPulseSpeedFactor` (6×) while a pulse is active. `BorderColorAt` lerps between adjacent `BorderCycle` entries using `phase` plus a per-position offset `float64(i)/float64(total)*BorderGradientSpan`, then lerps toward hot white by `flash`.

Constants: `BorderCycleSeconds = 24`, `BorderPulseSpeedFactor = 6`, `BorderGradientSpan = 0.35`, `BorderFlashDuration = 180 * time.Millisecond`.

- [ ] **Step 1: Write the failing tests**

- `test_border_phase_advances`: `Step` totalling 12 s -> `BorderPhase()` ≈ `0.5`
- `test_border_phase_wraps`: after 30 s, `BorderPhase()` is in `[0,1)`
- `test_border_phase_is_subtle`: over 1 s the phase advances less than `0.05` (§25 "the shift should be subtle")
- `test_pulse_speeds_up_the_cycle`: with `PulseBorder(600ms)` active, 0.5 s advances the phase ≈ 6× more than without
- `test_pulse_expires`: after the pulse duration the per-second advance is back to the base rate
- `test_flash_decays_to_zero`: `FlashBorder(180ms)` -> `BorderFlash()` 1.0 immediately, ≈0.5 at 90 ms, 0 at 200 ms
- `test_flash_never_negative`: after 10 s, `BorderFlash()` -> `0`
- `test_disabled_world_border_is_static`: `Enabled: false` -> `BorderPhase()` always `0`, `BorderFlash()` always `0`
- `test_border_color_varies_along_the_border`: `BorderColorAt` at `i=0` and `i=total/2` differ
- `test_border_color_flash_brightens`: `flash=1` yields a brighter color than `flash=0` at the same phase
- `test_board_border_uses_fx_color` (render): with a world at a known phase, the board box's corner cell color equals `BorderColorAt(...)` for that position
- `test_board_border_static_without_fx`: `Scene{FX: nil}` -> the border is `p.Border` everywhere

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run TestBorder -v`
Expected: FAIL

- [ ] **Step 3: Implement `border.go` and pass the color into `DrawBoard`**

`Render` computes the per-cell border color as it draws the box; `DrawBoard` takes a `func(i, total int) color.Color` or the `(phase, flash)` pair — pin the pair, so `DrawBoard`'s signature becomes `DrawBoard(c, l, p, g, gm, phase, flash float64, offX, offY int)` and Plan 2's `border color.Color` parameter is replaced. Update Plan 2's board tests accordingly.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): slow border gradient cycle with event pulses and flashes"
```

---

### Task 6: Piece trails

**Files:**
- Create: `internal/fx/trails.go`, `internal/render/trails.go` (or extend `fxdraw.go`)
- Test: `internal/fx/trails_test.go`

**Interfaces:**
- Produces:
  ```go
  type Trail struct {
      Cell  game.Point // board cell coordinates
      Kind  game.PieceKind
      Age   float64    // seconds
      Life  float64    // seconds
  }
  func (w *World) Trails() []Trail
  func TrailGlyph(g GlyphSet, t Trail) rune // Trail[0] until 1/3 life, Trail[1] until 2/3, then Trail[2]

  const (
      TrailLife         = 140 * time.Millisecond
      HardDropTrailLife = 220 * time.Millisecond
  )
  ```
  On `EventPieceMoved` and `EventPieceRotated`, push one trail per cell of the piece's **previous** position (the world remembers the last piece it saw). On `EventPieceHardDropped`, push one trail per cell in `Event.Cells` with `HardDropTrailLife`.

- [ ] **Step 1: Write the failing tests in `internal/fx/trails_test.go`**

- `test_move_leaves_a_trail`: consume a `PieceMoved` after a prior known position -> 4 trails at the previous cells
- `test_first_event_leaves_no_trail`: the very first `PieceMoved` after `ResetRun` (no previous position known) -> 0 trails
- `test_trail_expires`: `Step` totalling 200 ms -> `Trails()` empty
- `test_trail_glyph_ramp`: at ages 0.02 s / 0.07 s / 0.12 s of a 0.14 s life -> `Trail[0]`, `Trail[1]`, `Trail[2]` respectively (§17)
- `test_hard_drop_trail_is_longer_lived`: hard-drop trails still exist at 150 ms while move trails do not
- `test_hard_drop_trail_covers_every_traversed_cell`: `Event.Cells` of length 42 -> 42 trails
- `test_rotation_leaves_a_trail`: `PieceRotated` -> 4 trails
- `test_trails_capped_by_life_not_count`: 200 consecutive move events -> `len(Trails())` stays bounded (assert < 400) because expiry runs each step
- `test_trails_frozen_while_paused`: `Step(100ms, true)` -> trail ages unchanged
- `test_trails_never_cover_the_active_piece` (render): with trails on the active piece's cells, the rendered cells show the active-piece color, because trails draw before the piece — assert the active cells' color is `p.Active[kind]`
- `test_disabled_world_no_trails`: `Enabled: false` -> empty

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run TestTrail -v`
Expected: FAIL

- [ ] **Step 3: Implement trails and their drawing**

Render draws trails inside the board interior at §37 slot 6, using `BoardCellOrigin`, colored `Dim(p.Locked[kind], 1 - age/life)`. Draw them **before** the active piece so the piece always wins (§44).

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): short-lived ion trails behind moving and dropping pieces"
```

---

### Task 7: Hard-drop impact — trail, debris, shake, border flash

**Files:**
- Create: `internal/fx/impact.go`
- Test: `internal/fx/impact_test.go`

**Interfaces:**
- Produces:
  ```go
  func (w *World) ShakeOffset() (dx, dy int)
  func (w *World) Shake(d time.Duration)

  var ShakePattern = [5][2]int{{0, 1}, {-1, 0}, {1, 0}, {0, -1}, {0, 0}} // §18

  const (
      ShakeStepInterval   = 16 * time.Millisecond
      HardDropShake       = 80 * time.Millisecond
      TetrisShake         = 160 * time.Millisecond
      ImpactParticlesBase = 10
  )
  ```
  On `EventPieceHardDropped` (which arrives before `EventPieceLocked`): hard-drop trails (Task 6), `Shake(HardDropShake)`, `FlashBorder(BorderFlashDuration)`, and an impact burst of `ImpactParticlesBase + 2*min(level,10)` particles from the piece's contact cells, aimed upward (`aimDeg -90`, `spreadDeg 140`, speed 6–14 cells/s, `HueSpark`).

- [ ] **Step 1: Write the failing tests in `internal/fx/impact_test.go`**

- `test_shake_offset_follows_the_pattern`: `Shake(80ms)`; `ShakeOffset()` at elapsed 0 / 16 / 32 / 48 / 64 ms -> `(0,1)`, `(-1,0)`, `(1,0)`, `(0,-1)`, `(0,0)`
- `test_shake_expires`: after 100 ms -> `(0,0)`
- `test_shake_never_exceeds_one_cell`: sample `ShakeOffset()` every 4 ms across a `TetrisShake` -> every component in `[-1,1]` (§44)
- `test_reduced_motion_disables_shake`: `ReducedMotion: true` -> `ShakeOffset()` always `(0,0)` (§49.5)
- `test_hard_drop_spawns_particles`: consume a `PieceHardDropped` with `Value: 15` at `Status{Level: 1}` -> `ParticleCount()` -> `12`
- `test_impact_particle_count_scales_with_level`: `Level: 10` -> `30`; `Level: 50` -> `30` (capped)
- `test_impact_particles_start_at_the_contact_cells`: every spawned particle starts within 1 cell of a cell from the last row of `Event.Cells`, translated through the board rect
- `test_impact_particles_aim_upward`: at spawn, the majority have `VY < 0`
- `test_hard_drop_flashes_the_border`: `BorderFlash()` > 0.9 immediately after
- `test_hard_drop_shakes`: `ShakeOffset()` non-zero immediately after
- `test_zero_distance_hard_drop_is_quiet`: `Value: 0` -> no shake, no particles (a piece already resting should not fake an impact)
- `test_shake_offset_at_canvas_edge_is_safe` (render): with the board at `x=0` and a `(-1,0)` shake, the frame's row widths are unchanged and nothing wraps
- `test_disabled_world_no_impact`: `Enabled: false` -> nothing

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run TestShake -v`
Expected: FAIL

- [ ] **Step 3: Implement `impact.go`**

Shake index is `int(shakeElapsed / ShakeStepInterval) % len(ShakePattern)`.

- [ ] **Step 4: Run tests to verify they pass, then feel it**

Run: `go test ./... -v && go run ./cmd/cosmic-tetris`
Expected: PASS, and a hard drop reads as dropping a refrigerator from orbit (§18).

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): hard-drop impact with debris, one-cell screen shake, and border flash"
```

---

### Task 8: Line-clear supernova

**Files:**
- Create: `internal/fx/clears.go`, drawing in `internal/render/fxdraw.go`
- Test: `internal/fx/clears_test.go`

**Interfaces:**
- Produces:
  ```go
  type ClearPhase int
  const (
      ClearCriticalMass ClearPhase = iota // 0–70ms   §19 Phase A
      ClearSupernova                      // 70–150ms §19 Phase B
      ClearCollapse                       // 150–220ms §19 Phase C
  )

  type ClearBand struct {
      Row   int     // board row index, pre-collapse (from Event.Rows)
      Age   float64
      Phase ClearPhase
      T     float64 // 0..1 within the phase
  }
  func (w *World) ClearBands() []ClearBand

  const ClearBandDuration = 220 * time.Millisecond
  ```
  On `EventLinesCleared`: one band per row in `Event.Rows`; a debris burst of 12 particles per row spread along the row with horizontal velocity `(x - centerX) * 1.6` cells/s and vertical `-6..-12` (§19 "particles inherit some horizontal velocity from their location relative to center"); `FlashBorder`; `Shake` only for a four-line clear (Task 11).

  Because gameplay has already collapsed the rows (§44 forbids delaying gameplay), the band is an overlay drawn at the cleared rows' former screen positions and fades in 220 ms. Render draws, per §19: Phase A the row in `Glyphs.Clear[0]`/`Clear[1]` (edges dimmer than center); Phase B an expanding bright core from the center outward using `Clear[2]`/`Clear[3]`; Phase C nothing — the debris particles carry it.

- [ ] **Step 1: Write the failing tests in `internal/fx/clears_test.go`**

- `test_band_per_cleared_row`: `Event{Rows: []int{19,20,21}}` -> 3 bands with those rows
- `test_band_phases_by_age`: at 30 ms / 100 ms / 180 ms -> `ClearCriticalMass`, `ClearSupernova`, `ClearCollapse`
- `test_band_phase_t_within_phase`: at 105 ms the phase is `ClearSupernova` and `T` ≈ `0.44`
- `test_band_expires`: after 250 ms -> `ClearBands()` empty
- `test_debris_count`: a one-row clear -> 12 particles; a four-row clear -> 48
- `test_debris_inherits_horizontal_velocity`: particles left of the row center have `VX < 0`, right of it `VX > 0`, and the center-most is near 0
- `test_debris_starts_on_the_cleared_row`: every debris particle's initial `Y` is within 1 of the row's screen row
- `test_clear_flashes_the_border`: `BorderFlash()` > 0.9 after a clear
- `test_single_clear_does_not_shake`: a one-row clear -> `ShakeOffset()` `(0,0)` (shake is reserved for hard drops and four-line clears, §44)
- `test_bands_frozen_while_paused`: `Step(100ms, true)` -> ages unchanged
- `test_band_row_outside_board_is_ignored`: `Rows: []int{999}` -> no panic, no band drawn (render clips)
- `test_render_band_keeps_row_widths` (render): with bands active at every board row, every stripped row is exactly the canvas width

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run TestClear -v`
Expected: FAIL

- [ ] **Step 3: Implement `clears.go` and its drawing**

- [ ] **Step 4: Run tests to verify they pass, then clear a line by hand**

Run: `go test ./... -v && go run ./cmd/cosmic-tetris`
Expected: PASS, and a single line clear produces a visible supernova with debris (§43 "within the first completed line").

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): three-phase supernova line clear with center-weighted debris"
```

---

### Task 9: Shockwaves

**Files:**
- Create: `internal/fx/shockwave.go`
- Test: `internal/fx/shockwave_test.go`

**Interfaces:**
- Produces:
  ```go
  type Shockwave struct {
      X, Y      float64 // screen cells
      Radius    float64 // current radius in columns
      MaxRadius float64
      Age, Life float64
  }
  func (w *World) Shockwaves() []Shockwave
  func (w *World) EmitShockwave(x, y, maxRadius float64)

  const (
      ShockwaveDuration = 300 * time.Millisecond
      ShockwaveAspect   = 0.5 // rows per column, to compensate for cell aspect ratio
  )
  ```
  Render walks the ring: for each of 24 angles, plot `(X + R*cos θ, Y + R*ShockwaveAspect*sin θ)` and set `Glyphs.Ring[min(3, int(R/ MaxRadius * 4))]` dimmed by `1 - Age/Life`. Used sparingly (§24): four-line clears and combo ≥ 5 only.

- [ ] **Step 1: Write the failing tests in `internal/fx/shockwave_test.go`**

- `test_radius_grows`: `EmitShockwave(10,10,8)`; at half life `Radius` ≈ `4`
- `test_expires`: after 350 ms -> `Shockwaves()` empty
- `test_reduced_motion_suppresses`: `ReducedMotion: true` -> `EmitShockwave` adds nothing (§49.5)
- `test_disabled_world_suppresses`: `Enabled: false` -> nothing
- `test_frozen_while_paused`: `Step(100ms, true)` -> `Radius` unchanged
- `test_ring_stays_elliptical` (render): the drawn ring is wider than tall by roughly `1/ShockwaveAspect`
- `test_ring_clipped_at_edges` (render): a shockwave centered at `(0,0)` with radius 40 on a 40×24 canvas -> no panic, row widths unchanged
- `test_ring_glyph_progresses` (render): early rings use `Ring[0]`, late rings `Ring[3]`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run TestShockwave -v`
Expected: FAIL

- [ ] **Step 3: Implement `shockwave.go` and its drawing**

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): faked radial shockwave rings"
```

---

### Task 10: Hyperdrive

**Files:**
- Create: `internal/fx/hyperdrive.go`
- Test: `internal/fx/hyperdrive_test.go`

**Interfaces:**
- Produces:
  ```go
  func (w *World) TriggerHyperdrive()
  func (w *World) HyperdriveMultiplier() float64 // multiplies star speed
  func (w *World) StarStretch() bool             // the 50–100ms stretch window

  const (
      HyperdriveDuration = 1100 * time.Millisecond
      HyperdrivePeak     = 14.0
  )
  ```
  The §16 timeline, exactly: `0–50ms` multiplier `0` (stars pause); `50–100ms` multiplier `0.5` and `StarStretch()` true; `100–500ms` lerp `1 → HyperdrivePeak`; `500–800ms` hold at peak; `800–1100ms` lerp `HyperdrivePeak → 1`; afterwards `1`.

  Triggers (§16): a four-line clear (Task 11), combo ≥ 5, and a new in-session high score — the latter detected inside `Consume` when `st.Score > st.Best && st.Best > 0`, latched once per run and cleared by `ResetRun`.

  `Status.Best` comes from `app.Model.Best`, which holds the best score of *previous completed runs in this session only* — the spec allows no persistence, no profiles, no database (§1). The app sets `Best = max(Best, Game.Score)` when it enters `StateGameOver`, and never mid-run, so "new high score" means beating your last game rather than beating yourself one point at a time.

- [ ] **Step 1: Write the failing tests in `internal/fx/hyperdrive_test.go`**

- `test_timeline_pause`: at 20 ms -> `0`
- `test_timeline_stretch`: at 75 ms -> `0.5` and `StarStretch()` true
- `test_stretch_window_only`: at 20 ms and 150 ms -> `StarStretch()` false
- `test_timeline_ramp`: at 300 ms -> ≈ `7.5` (within 0.5)
- `test_timeline_peak`: at 600 ms -> `HyperdrivePeak`
- `test_timeline_decay`: at 950 ms -> between `1` and `HyperdrivePeak`; at 1200 ms -> `1`
- `test_star_speed_uses_multiplier`: `StarSpeedScale()` at 600 ms of hyperdrive is `HyperdrivePeak ×` the level scale
- `test_stars_actually_move_faster`: a near star travels far more in 100 ms at peak than at rest
- `test_reduced_motion_no_acceleration`: `ReducedMotion: true` -> `HyperdriveMultiplier()` always `1` and `StarStretch()` always false (§49.5)
- `test_four_line_clear_triggers`: consume `LinesCleared` with `Value: 4` -> multiplier leaves `1` within the next 200 ms of stepping
- `test_single_clear_does_not_trigger`: `Value: 1` -> multiplier stays `1`
- `test_big_combo_triggers`: `ComboChanged` with `Value: 5` -> triggers; `Value: 4` -> does not
- `test_new_high_score_triggers_once`: `Consume(nil, Status{Score: 100, Best: 50})` triggers; a second `Consume` with a higher score does not re-trigger; after `ResetRun` it can trigger again
- `test_first_game_never_high_scores`: `Status{Score: 5000, Best: 0}` -> no trigger
- `test_retrigger_restarts_the_timeline`: triggering at 600 ms into an active hyperdrive resets it to the pause phase
- `test_best_updates_only_at_game_over` (app): mid-run, `Model.Best` stays at its previous value while `Game.Score` climbs; entering `StateGameOver` raises it to the run's score; a lower second run leaves it alone

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run TestHyperdrive -v`
Expected: FAIL

- [ ] **Step 3: Implement `hyperdrive.go` and wire the star stretch into rendering**

While `StarStretch()`, render draws mid and near stars as `Glyphs.Streak` instead of their normal glyph.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): hyperdrive timeline for four-line clears, big combos, and high scores"
```

---

### Task 11: Banners, notices, and the four-line event

**Files:**
- Create: `internal/fx/banner.go`, `internal/flavor/messages.go`, `internal/render/banner.go`
- Test: `internal/fx/banner_test.go`, `internal/flavor/messages_test.go`

**Interfaces:**
- Produces:
  ```go
  // flavor — pure data, no imports beyond math/rand
  func TetrisBanner(r *rand.Rand) string   // the four §20 strings
  func LevelSubtitle(r *rand.Rand) string  // the three §22 strings
  func ComboLine(combo int) string         // §21: "COMBO 5 // UNAUTHORIZED ORBITAL MANEUVER", 6, 7; ≥8 cycles
  func Routine(r *rand.Rand) string        // the §27 list
  func Rare() string                       // "DID YOU KNOW YOU'RE IN A TERMINAL?" (§45)
  func Special(id SpecialID) string        // §45 one-offs
  func Boot() []BootLine                   // §29
  // The game-over panel copy stays in render (Plan 2 Task 10); do not duplicate it here.
  type SpecialID int
  const (
      SpecialKineticRod SpecialID = iota // "KINETIC ROD DEPLOYED"
      SpecialCube                        // "CUBE ADJACENT OBJECT SECURED"
      SpecialRollover                    // "NUMBER BECAME BIGGER"
      SpecialCaptain                     // "CAPTAIN?"
  )
  type BootLine struct{ At time.Duration; Text string }

  // fx
  type Banner struct{ Text string; Age, Life float64 }
  type Notice struct{ Title, Subtitle string; Age, Life float64 }
  func (w *World) Banner() (Banner, bool)
  func (w *World) Notice() (Notice, bool)
  func (w *World) HUDPulse() float64 // 0..1, active at combo ≥ 4 (§21)
  func (w *World) ShowBanner(text string, d time.Duration)
  func (w *World) ShowNotice(title, subtitle string, d time.Duration)

  const (
      BannerDuration = 700 * time.Millisecond
      NoticeDuration = 1200 * time.Millisecond
      HUDPulsePeriod = 600 * time.Millisecond
  )
  ```

  The four-line composite (§20), all triggered from one `EventLinesCleared` with `Value: 4`: `TriggerHyperdrive()`, `Shake(TetrisShake)`, `PulseBorder(600ms)`, a 40-particle eruption, `BoostStars(40, 1200ms)`, `EmitShockwave` at the board center, `HUDPulse` for 700 ms, and `ShowBanner(flavor.TetrisBanner(rng), BannerDuration)`.

  The level-up notice (§22): on `EventLevelChanged`, `ShowNotice("GRAVITY ANOMALY DETECTED", fmt.Sprintf("LEVEL %02d", ev.Value), NoticeDuration)` — exactly the two lines of the §22 card — and the chosen `flavor.LevelSubtitle` goes to mission control at `PriorityMajor` (Task 12) rather than onto the card. Render draws the card with `BoxRound`, fading over its last 400 ms, and never pauses the game.

  Combo escalation (§21): combo 2 -> 6 sparks; combo 3 -> 12 meteor particles with stronger horizontal drift; combo 4 -> HUD pulse; combo ≥ 5 -> banner `flavor.ComboLine(combo)`, shockwave, and hyperdrive.

- [ ] **Step 1: Write the failing tests**

flavor:
- `test_tetris_banners_verbatim`: the returned set over 200 draws is exactly the four §20 strings, including `"FOUR ROWS HAVE LEFT THE CHAT"` and `"SPACE-TIME HAS FILED A COMPLAINT"`
- `test_level_subtitles_verbatim`: exactly the three §22 strings
- `test_combo_lines`: `ComboLine(5)` -> `"COMBO 5 // UNAUTHORIZED ORBITAL MANEUVER"`; `ComboLine(6)` and `ComboLine(7)` -> the §21 strings; `ComboLine(9)` -> non-empty and contains `"COMBO 9"`
- `test_routine_lines_include_spec_examples`: the §27 list contains `"LOCAL UNIVERSE STABLE*"` and `"ORBITAL OSHA HAS ENTERED THE CHAT"`
- `test_specials_verbatim`: each `SpecialID` maps to its §45 string
- `test_rare_line_verbatim`: `Rare()` -> `"DID YOU KNOW YOU'RE IN A TERMINAL?"`
- `test_boot_lines_ordered`: `Boot()` `At` values are strictly increasing and the last text is `"UNIVERSE ONLINE"`
- `test_all_flavor_is_deterministic_per_seed`: same seed -> same draws
- `test_no_flavor_string_is_empty`

fx:
- `test_banner_expires`: `ShowBanner("X", 700ms)` -> gone after 750 ms
- `test_banner_replaced_by_newer`: a second `ShowBanner` replaces the first
- `test_notice_expires`
- `test_four_line_clear_fires_everything`: consume `LinesCleared{Value: 4}` -> banner present, shake non-zero, shockwave present, `HUDPulse() > 0`, hyperdrive active, particle count ≥ 40, star count boosted
- `test_four_line_banner_is_a_spec_string`: the banner text is one of the four §20 strings
- `test_four_line_does_not_block_anything`: `Consume` returns without any sleeping; a subsequent `Consume` of a `PieceMoved` is processed normally while the banner is up (§20 "must not block gameplay input")
- `test_level_change_shows_notice`: `LevelChanged{Value: 8}` -> notice title `"GRAVITY ANOMALY DETECTED"`, subtitle `"LEVEL 08"`
- `test_level_change_sets_mission_subtitle`: after the same event, `Mission()` is one of the three §22 subtitles
- `test_combo_two_sparks`: `ComboChanged{Value: 2}` -> 6 particles, no banner
- `test_combo_three_meteors`: `Value: 3` -> 12 particles
- `test_combo_four_pulses_hud`: `Value: 4` -> `HUDPulse() > 0`
- `test_combo_five_banner_and_shockwave`: `Value: 5` -> banner contains `"COMBO 5"`, one shockwave, hyperdrive triggered
- `test_combo_reset_stops_the_pulse`: `Value: 0` -> `HUDPulse()` decays to `0`
- `test_hud_pulse_bounded`: `HUDPulse()` is always in `[0,1]`

render:
- `test_banner_centered_and_clipped`: an 80-character banner on a 40-wide canvas leaves every row exactly 40 columns
- `test_banner_does_not_cover_the_active_piece`: the banner row is chosen above the board's vertical center only if the active piece is in the lower half, and vice versa — assert the active piece's cells still show `p.Active[kind]` (§44)
- `test_notice_card_fits_small_terminal`: at 40×24 the card is fully inside the window

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/flavor/ ./internal/fx/ -run TestBanner -v`
Expected: FAIL

- [ ] **Step 3: Implement flavor, banners, and the composites**

- [ ] **Step 4: Run tests to verify they pass, then get a four-line clear**

Run: `go test ./... -v && go run ./cmd/cosmic-tetris --seed 8675309`
Expected: PASS, and a tetris produces the §43 reaction.

- [ ] **Step 5: Commit**

```bash
git add internal/flavor internal/fx internal/render
git commit -m "feat(fx): banners, level-up notices, combo escalation, and the four-line event"
```

---

### Task 12: Mission control

**Files:**
- Create: `internal/fx/mission.go`
- Modify: `internal/render/render.go` (feed `Scene.Mission` from `fx.World`), `internal/app/update.go`
- Test: `internal/fx/mission_test.go`

**Interfaces:**
- Produces:
  ```go
  func (w *World) Mission() string
  func (w *World) SetMission(text string, p Priority)

  type Priority int
  const (
      PriorityIdle Priority = iota
      PriorityRoutine
      PriorityEvent
      PriorityMajor
  )

  const (
      MissionMinDwell   = 2500 * time.Millisecond
      MissionIdleAfter  = 5 * time.Second  // §45 "long idle before first move"
      MissionRareChance = 0.005            // §45 "extremely rare status line"
  )
  ```
  A new message replaces the current one only when its priority is higher **or** the current one has been up for `MissionMinDwell` (§27 "do not rotate messages constantly … give them time to breathe").

  Triggers: `EventPieceLocked` -> `PriorityRoutine` `flavor.Routine`, but at most once per `MissionMinDwell`; `EventLinesCleared` (1–3 rows) -> `PriorityEvent`; four-line and `EventLevelChanged` -> `PriorityMajor`; `EventHoldUsed` of an `O` -> `flavor.Special(SpecialCube)`; `EventPieceHardDropped` of a vertical `I` -> `SpecialKineticRod`; score crossing a multiple of 100,000 -> `SpecialRollover`; no input for `MissionIdleAfter` before the first move -> `SpecialCaptain`; `MissionRareChance` of any routine pick -> `flavor.Rare`.

- [ ] **Step 1: Write the failing tests in `internal/fx/mission_test.go`**

- `test_initial_message_not_empty`: a new world's `Mission()` is non-empty (something is on the channel from the start)
- `test_dwell_blocks_same_priority`: set a routine message, `Step(500ms)`, set another routine message -> `Mission()` is still the first
- `test_dwell_expires`: after `MissionMinDwell` the second routine message takes over
- `test_higher_priority_preempts`: a `PriorityMajor` message replaces a fresh `PriorityRoutine` one immediately
- `test_lower_priority_never_preempts`: `PriorityIdle` does not replace a fresh `PriorityEvent`
- `test_four_line_clear_is_major`: consuming `LinesCleared{Value: 4}` changes the message even if a routine one is 100 ms old
- `test_level_change_is_major`
- `test_holding_an_O_is_special`: `HoldUsed` with `Piece.Kind == game.KindO` -> `Mission()` contains `"CUBE ADJACENT OBJECT SECURED"`
- `test_vertical_i_hard_drop_is_special`: `PieceHardDropped` with a `KindI` piece at rotation 1 -> contains `"KINETIC ROD DEPLOYED"`
- `test_horizontal_i_hard_drop_is_not_special`: rotation 0 -> does not contain it
- `test_score_rollover`: `Consume(nil, Status{Score: 100_001})` after a previous status of `99_000` -> contains `"NUMBER BECAME BIGGER"`
- `test_rollover_fires_once_per_threshold`: a further status of `100_500` does not re-fire
- `test_idle_captain`: no events for `MissionIdleAfter` on a fresh run -> contains `"CAPTAIN?"`
- `test_idle_captain_only_before_the_first_move`: after any `PieceMoved`, waiting does not produce it
- `test_rare_line_is_rare`: over 5000 routine picks, the rare line appears at least once and in fewer than 3% of picks
- `test_mission_survives_no_fx`: with `Enabled: false`, `Mission()` still returns text and still updates on events (§32 — the boring mode keeps the commentary)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run TestMission -v`
Expected: FAIL

- [ ] **Step 3: Implement `mission.go` and feed it into the scene**

Mission control is the one FX subsystem that runs with `Enabled: false`; guard the other subsystems on `cfg.Enabled` but not this one.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render internal/app
git commit -m "feat(fx): mission-control channel with priorities, dwell time, and easter eggs"
```

---

### Task 13: Boot sequence

**Files:**
- Create: `internal/render/boot.go`
- Modify: `internal/app/model.go`, `internal/app/update.go`, `internal/render/render.go`
- Test: `internal/app/boot_test.go`, `internal/render/boot_test.go`

**Interfaces:**
- Consumes: `flavor.Boot`, `spinner` from `charm.land/bubbles/v2/spinner`.
- Produces:
  ```go
  // app
  const StateBoot State = 3 // appended to Plan 2's State set
  // Model gains: BootStart time.Time, Spin spinner.Model

  // render
  // Scene gains: Booting bool, BootElapsed time.Duration, Spinner string
  func DrawBoot(c *Canvas, p Palette, g *Glyphs, elapsed time.Duration, spinner string)

  const BootTotal = 1000 * time.Millisecond
  ```
  Pinned reveal schedule (§29 copy verbatim):

  ```text
  0ms     ✦
  150ms   C O S M I C
  300ms   T E T R I S
  450ms   INITIALIZING LOCAL UNIVERSE...      (spinner beside it)
  600ms   gravity ........ OK
  700ms   spacetime ...... OK
  800ms   tetrominoes .... QUESTIONABLE
  950ms   UNIVERSE ONLINE
  1000ms  -> StatePlaying
  ```
  Any key skips to `StatePlaying` except the quit bindings, which quit. `--no-fx` starts directly in `StatePlaying` (§32).

- [ ] **Step 1: Write the failing tests**

- `test_starts_in_boot`: `New(Config{})` -> `State` `StateBoot`
- `test_no_fx_skips_boot`: `New(Config{NoFX: true})` -> `StatePlaying`
- `test_boot_finishes_on_time`: frames advancing 1.05 s -> `StatePlaying`
- `test_boot_does_not_finish_early`: frames advancing 900 ms -> still `StateBoot`
- `test_any_key_skips`: `tea.KeyPressMsg{Code: 'x'}` during boot -> `StatePlaying`
- `test_quit_key_quits_during_boot`: `'q'` -> quit command, state not `StatePlaying`
- `test_gameplay_frozen_during_boot`: frames spanning 900 ms -> the active piece has not moved
- `test_spinner_ticks`: the model forwards `spinner.TickMsg` while booting and the rendered boot screen changes between two different spinner frames
- `test_boot_reveal_schedule` (render): at 100 ms only `"✦"` is present; at 350 ms `"C O S M I C"` and `"T E T R I S"` are present but not `"gravity"`; at 850 ms all three check lines are present; at 980 ms `"UNIVERSE ONLINE"` is present
- `test_boot_copy_verbatim` (render): the full-boot render contains `"INITIALIZING LOCAL UNIVERSE..."`, `"gravity ........ OK"`, `"spacetime ...... OK"`, `"tetrominoes .... QUESTIONABLE"`
- `test_boot_fits_small_terminal`: at 40×24 every row is exactly 40 columns
- `test_golden_boot`: a golden at 80×30 and `BootElapsed: 900ms`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ -run TestBoot -v`
Expected: FAIL

- [ ] **Step 3: Implement the boot state and screen**

Stars are already drifting behind the boot screen — draw the starfield first, then the boot text, so the terminal feels alive from the first frame (§29, §43).

- [ ] **Step 4: Run tests to verify they pass, then watch it boot**

Run: `go test ./... -v && go run ./cmd/cosmic-tetris`
Expected: PASS, roughly one second of unnecessary drama, then the game.

- [ ] **Step 5: Commit**

```bash
git add internal/app internal/render
git commit -m "feat(app): one second of excessive boot drama, skippable with any key"
```

---

### Task 14: Game-over black hole

**Files:**
- Create: `internal/fx/collapse.go`, `internal/render/collapse.go`
- Modify: `internal/app/update.go`, `internal/render/render.go`
- Test: `internal/fx/collapse_test.go`, `internal/render/collapse_test.go`

**Interfaces:**
- Produces:
  ```go
  type CollapsePhase int
  const (
      CollapseFreeze CollapsePhase = iota // 0–300ms:   everything frozen, "SIGNAL LOST"
      CollapseInfall                      // 300–900ms: blocks fall inward
      CollapseSingularity                 // 900–1300ms: black hole
      CollapseDone
  )
  type Collapse struct {
      Phase   CollapsePhase
      T       float64 // 0..1 within the phase
      Elapsed time.Duration
  }
  func (w *World) Collapse() (Collapse, bool)

  // render
  func DrawCollapse(c *Canvas, l Layout, p Palette, g *Glyphs, gm *game.Game, col fx.Collapse)

  const CollapseTotal = 1300 * time.Millisecond
  ```
  On `EventGameOver` the world starts the collapse. Render behavior per §28: during `CollapseFreeze` the board is drawn as-is with `SIGNAL LOST` centered over it; during `CollapseInfall` each locked cell is drawn at `lerp(cell, boardCenter, T)`; during `CollapseSingularity` the board interior is replaced by the §28 black-hole figure:

  ```text
            ·
          ˚
         \ | /
       --- ● ---
         / | \
           *
  ```
  The app shows Plan 2's game-over panel only once `Collapse()` reports `CollapseDone` or `ok` is false (which is the case with `--no-fx`, so that mode goes straight to the panel).

- [ ] **Step 1: Write the failing tests**

- `test_game_over_starts_collapse`: consume `EventGameOver` -> `ok` true, `Phase` `CollapseFreeze`
- `test_phase_schedule`: at 150 ms / 600 ms / 1000 ms / 1400 ms -> `CollapseFreeze`, `CollapseInfall`, `CollapseSingularity`, `CollapseDone`
- `test_phase_t`: at 600 ms -> `Phase` `CollapseInfall`, `T` ≈ `0.5`
- `test_no_collapse_without_fx`: `Enabled: false` -> `ok` false
- `test_collapse_ignores_pause`: `Step(dt, true)` still advances the collapse (the game is over; nothing to pause)
- `test_reset_run_clears_collapse`: `ResetRun()` -> `ok` false
- `test_signal_lost_drawn` (render): at 150 ms the render contains `"SIGNAL LOST"`
- `test_blocks_move_inward` (render): at `CollapseInfall` `T: 0.9`, every drawn block is closer to the board center than its original cell
- `test_singularity_drawn` (render): at 1000 ms the render contains `'●'` and the `"---"` arms
- `test_panel_appears_after_collapse` (app): frames spanning 1.4 s after game over -> `View()` contains `"UNIVERSE EXPIRED"`
- `test_panel_immediate_without_fx` (app): with `NoFX: true`, `View()` contains `"UNIVERSE EXPIRED"` on the first frame after game over
- `test_restart_during_collapse` (app): `'r'` mid-collapse -> `StatePlaying`, fresh game, `Collapse()` `ok` false
- `test_collapse_row_widths` (render): every phase keeps every row exactly the canvas width

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run TestCollapse -v`
Expected: FAIL

- [ ] **Step 3: Implement the collapse and its drawing**

- [ ] **Step 4: Run tests to verify they pass, then top out on purpose**

Run: `go test ./... -v && go run ./cmd/cosmic-tetris`
Expected: PASS, and the universe collapses into a black hole before the panel appears.

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render internal/app
git commit -m "feat(fx): theatrical game over collapsing the board into a black hole"
```

---

### Task 15: Responsive FX intensity

**Files:**
- Modify: `internal/fx/world.go`, `internal/render/fxdraw.go`
- Test: `internal/fx/intensity_test.go`

**Interfaces:**
- Produces:
  ```go
  func (w *World) Intensity() float64 // 0.35 small canvas, 0.7 medium, 1.0 large
  const (
      IntensitySmallMaxCells  = 40 * 24
      IntensityMediumMaxCells = 54 * 26
  )
  ```
  Every emitter multiplies its particle count by `Intensity()` (minimum 1 particle when the unscaled count is ≥ 1), and star density is scaled the same way — §31's "effects automatically reduce outside the board" and §44's readability rules matter most in a cramped terminal.

- [ ] **Step 1: Write the failing tests in `internal/fx/intensity_test.go`**

- `test_intensity_by_canvas_size`: `Resize(40,24)` -> `0.35`; `Resize(54,26)` -> `0.7`; `Resize(120,40)` -> `1.0`
- `test_intensity_zero_size`: `Resize(0,0)` -> `0.35` and no division by zero
- `test_particle_counts_scale`: a hard-drop impact at 40×24 emits fewer particles than the same event at 120×40, and at least 1
- `test_star_density_scales`: the star count per cell at 40×24 is lower than at 120×40
- `test_effects_still_happen_when_small`: at 40×24 a four-line clear still produces a banner, a shake, particles, and a shockwave (reduced, not removed)
- `test_intensity_does_not_affect_gameplay`: the same scripted session at 40×24 and 120×40 ends with identical game state (§44 "never use random effects that alter gameplay")

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run TestIntensity -v`
Expected: FAIL

- [ ] **Step 3: Implement intensity scaling**

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(fx): scale effect intensity down in small terminals"
```

---

### Task 16: `--no-fx` and `--reduced-motion`

**Files:**
- Modify: `cmd/cosmic-tetris/main.go`, `internal/app/model.go`
- Test: `cmd/cosmic-tetris/main_test.go` (append), `internal/app/flags_test.go`

**Interfaces:**
- Consumes: `app.Config.NoFX`, `app.Config.ReducedMotion`, `fx.Config`.
- Produces: the final §49.5 CLI surface, with both flags wired end to end.

- [ ] **Step 1: Write the failing tests**

- `test_no_fx_flag`: `parseFlags(["--no-fx"])` -> `NoFX` true
- `test_reduced_motion_flag`: `parseFlags(["--reduced-motion"])` -> `ReducedMotion` true
- `test_flags_combine`: `["--ascii","--no-fx","--reduced-motion","--seed","7"]` -> all four set
- `test_no_fx_disables_world`: `app.New(Config{NoFX: true})` -> the world reports no stars, no particles, static border, no boot
- `test_no_fx_frame_is_stable`: with `NoFX`, two `View()` calls 500 ms of frames apart produce identical output when no input occurred (nothing animates)
- `test_no_fx_is_still_playable`: a scripted session under `NoFX` reaches a line clear and the correct score (§32 "the boring mode should still be a good game")
- `test_reduced_motion_suppresses_the_three_things`: shake offset always `(0,0)`, hyperdrive multiplier always `1`, `Shockwaves()` always empty (§49.5)
- `test_reduced_motion_keeps_the_rest`: particles, trails, banners, mission control, and the border cycle are all still active
- `test_no_fx_and_reduced_motion_together`: nothing animates, no panic, gameplay identical to `NoFX` alone
- `test_gameplay_identical_across_fx_modes`: run the same `(input, dt)` script under all four flag combinations with the same game seed -> identical final game state in every case (§44)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./... -run TestNoFX -v`
Expected: FAIL

- [ ] **Step 3: Wire the flags**

- [ ] **Step 4: Run tests to verify they pass, then compare the two extremes by hand**

Run: `go test ./... -v && go run ./cmd/cosmic-tetris --no-fx` then `go run ./cmd/cosmic-tetris`
Expected: PASS; the first is a good plain game, the second is much funnier (§47).

- [ ] **Step 5: Commit**

```bash
git add cmd internal/app
git commit -m "feat(cli): --no-fx and --reduced-motion wired end to end"
```

---

### Task 17: FX goldens, performance sanity, and the coolness acceptance pass

**Files:**
- Create: `internal/render/testdata/fx_*.golden`, `internal/fx/bench_test.go`
- Modify: `internal/render/render_test.go`, `README.md`
- Test: as listed

**Interfaces:**
- Consumes: everything.
- Produces: no new API. This task is the §43/§47 gate.

- [ ] **Step 1: Write the failing tests**

Deterministic FX goldens use `fx.NewWorld(cfg, 4242)` plus a fixed event script and a fixed number of `Step(16ms)` calls:

- `test_golden_fx_wide`: 80×30, mid-hyperdrive, particles alive, banner up
- `test_golden_fx_small`: 40×24 with the same script (reduced intensity)
- `test_golden_fx_ascii`: 80×30 in `ModeASCII`
- `test_golden_fx_collapse`: 80×30 at 1000 ms of collapse
- `test_golden_no_fx`: 80×30 with `Enabled: false` — must match the Plan 2 wide golden except for the mission line
- `test_frame_is_deterministic_for_a_seed`: the same fx seed and script renders byte-identical output twice
- `test_no_row_ever_changes_width`: across a 1200-frame scripted session at 40×24, 80×30, and 300×100, every frame's every row is exactly the canvas width
- `test_no_panic_across_a_long_session`: a 5000-frame session with random inputs, random resizes in 0..200 × 0..80, and all four flag combinations -> no panic
- `BenchmarkFrame`: `Step` + `Render` at 80×30 with `MaxParticles` live particles; record ns/op in the commit message
- `test_particle_cap_holds_under_abuse`: 2000 hard-drop and four-line events in one session -> `ParticleCount()` never exceeded `MaxParticles`
- `test_no_goroutines_leak`: `runtime.NumGoroutine()` before and after a 1000-frame session is unchanged (§38 "do not spawn a goroutine per particle/frame")

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run TestGoldenFX -v`
Expected: FAIL — missing goldens

- [ ] **Step 3: Generate the goldens and read them**

Run: `go test ./internal/render/ -update && go test ./... -race -v`
Expected: PASS. Read `testdata/fx_wide.golden` and `fx_small.golden`: the board is still perfectly legible, the active piece is visible, no effect crosses the border it shouldn't.

- [ ] **Step 4: Walk the §43 coolness acceptance test by hand**

Run: `go run ./cmd/cosmic-tetris --seed 8675309` and confirm, within the first 30 seconds of normal play: a moving starfield, an animated board border, piece trails, a hard-drop impact, particles, and mission-control commentary. Within the first completed line: the supernova, debris, and a border reaction. Then force a four-line clear and confirm the §43 reaction. Note anything that falls flat and tune the constant responsible — the constants are all named and gathered at the top of their files for exactly this.

- [ ] **Step 5: Walk the §47 definition-of-done list**

Check every bullet of §47 against the built game. Anything unchecked is a bug to fix in this task, not a follow-up.

- [ ] **Step 6: Update the README**

Add the effects list, the `--no-fx` / `--reduced-motion` notes, and a one-paragraph architecture note: `game` is deterministic and clock-free, `fx` observes events and can never modify game state, `render` composites, `app` owns the clock.

- [ ] **Step 7: Commit**

```bash
git add internal/render internal/fx README.md
git commit -m "test(fx): FX goldens, particle cap and perf sanity, coolness acceptance pass"
```

---

## Done when

- `go test ./... -race` passes; `go vet ./...` and `gofmt -l .` are silent.
- `internal/fx` imports neither `internal/render` nor `internal/app` and never holds a `*game.Game`.
- The same `(seed, input, dt)` script produces identical game state with FX on, off, reduced-motion, and ASCII.
- Every §43 bullet is observable in a real terminal, and every §47 bullet is true.
- A four-line clear is gloriously excessive; game over collapses the universe into a black hole; the game is fun with `--no-fx` and much funnier without it.
