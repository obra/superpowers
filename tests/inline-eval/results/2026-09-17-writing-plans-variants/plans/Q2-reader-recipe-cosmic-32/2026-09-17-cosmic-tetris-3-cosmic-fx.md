# Cosmic Tetris — Plan 3: The Cosmic Effects System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the terminal lose its mind — starfield, animated border, piece trails, hard-drop impact with screen shake, line-clear supernova, shockwaves, hyperdrive, the four-line spectacle, combo escalation, level-up notices, mission-control commentary, boot sequence, and a game-over black hole — all as an independent simulation that observes game events and can never touch game state.

**Architecture:** `internal/fx` is a self-contained simulation: `fx.World` owns its own `*rand.Rand`, a particle pool, three star layers, and a handful of timers. It learns about gameplay two ways only — `Observe(events, Snapshot)` and `Advance(dt, Snapshot)` — where `Snapshot` is a by-value copy of the few numbers FX is allowed to know. It emits `[]render.Sprite`, a shake offset, a border style, a banner, and a notice; `internal/app` copies those into `render.Input` each frame. `internal/flavor` holds the mission-control message pool and imports nothing but `internal/game`.

**Tech Stack:** Go 1.26, `charm.land/lipgloss/v2` (styles only), `math/rand/v2`, `internal/render` for `Sprite`/`Rect`/`Mode`.

**Spec:** `design.md` (this plan implements §14–§25, §27, §28, §29, §43, §44, §45, and pinned decisions §49.5, §49.6)

**Depends on:** Plan 1 (`internal/game` events) and Plan 2 (`render.Input` FX fields, `render.Compute`, the app frame loop).

## Global Constraints

- **FX may never modify `GameState`** (§14, §44). `fx.World` never receives a `*game.Game` — only `fx.Snapshot`, a by-value struct. Every task's tests may read game state; none may write it through FX.
- **Two independent RNGs** (§35, §49.6). `fx.New(cfg, seed)` builds `rand.New(rand.NewPCG(uint64(seed)^0xDEADBEEFCAFEBABE, 0x2545F4914F6CDD1D))`. The FX generator is never passed to `internal/game`, and no FX code path calls an engine method.
- **No clock reads in `internal/fx`.** Like the engine, the world advances only via `Advance(dt time.Duration, snap Snapshot)`.
- **No goroutine per particle or per frame** (§38). One slice, reused; `MaxParticles = 400` and new emissions are dropped once the pool is full.
- **No filesystem access and no synchronous logging during gameplay** (§38) — nothing in `internal/fx` or `internal/flavor` touches `os` beyond what the compiler needs.
- **Restraint rules are requirements** (§44): never obscure the active piece, never delay gameplay for animation, screen shake never exceeds one cell, particles never permanently alter the board, board readability wins over spectacle.
- **`--no-fx`** (`Config.Enabled == false`): `Advance`/`Observe` return immediately and every sprite accessor returns nil, the shake is zero, and the border style is the static palette border. The boot sequence is skipped. The game must remain fully playable.
- **`--reduced-motion`** (§49.5): suppresses screen shake, hyperdrive acceleration, and shockwaves; leaves color, trails, and particles alone.
- Effects reduce automatically at small terminal sizes (§31): `TierSmall` halves the star budget and skips shockwaves.
- Run `gofmt -l .` before every commit; it must print nothing. Golden files touched by a task are regenerated in that task with `go test ./internal/render/ -update` and the diff read before committing.

## Review Focus

Five failure modes the spec implies but no task's own tests would otherwise exercise. Each has a test added to the task that owns the code.

1. **Sustained four-line clears** must not grow the particle pool without bound — `MaxParticles` is enforced on emission, and a hundred consecutive eruptions must leave the pool at or below the cap. (Task 4)
2. **A `dt` spike** (suspend/resume, a slow frame) must not teleport particles across the screen, produce NaN positions, or leave the shake stuck on — FX clamps its own `dt` per step and sub-steps long frames. (Task 4, shake in Task 6)
3. **Off-grid particle and sprite coordinates** (a burst near the board edge, negative positions after drag) must be clipped at sprite generation, never written outside the grid. (Task 4)
4. **A resize while a shake, banner, or collapse is mid-flight** must recompute against the new viewport and keep drawing inside it. (Task 2)
5. **`--no-fx` and `--reduced-motion`** must genuinely suppress their effects while leaving the game playable and the frame stable, and neither may draw from the game RNG. (Task 2 for the wiring, Task 8 for hyperdrive, Task 6 for shake)

---

## File Structure

| File | Responsibility |
|---|---|
| `internal/fx/world.go` | `Config`, `Snapshot`, `World`, `New`, `Resize`, `Advance`, `Observe`, all sprite/shake/banner accessors. |
| `internal/fx/particle.go` | `Particle`, integration step, emitters (burst, debris, meteor, sparks). |
| `internal/fx/starfield.go` | Three star layers, drift, level scaling, hyperdrive speed, shooting star. |
| `internal/fx/trails.go` | Piece trails and hard-drop ion columns. |
| `internal/fx/impact.go` | Hard-drop shake pattern, border flash, impact burst. |
| `internal/fx/lineclear.go` | The §19 three-phase supernova and its debris. |
| `internal/fx/spectacle.go` | Hyperdrive, shockwaves, four-line sequence, combo escalation, level-up notice. |
| `internal/fx/border.go` | Slow border color cycle and event-driven energy state. |
| `internal/fx/collapse.go` | Boot sequence text and the game-over black hole. |
| `internal/flavor/messages.go` | Mission-control message pool and cadence. |
| `internal/render/render.go` | (modify) the `Notice`/`HUDStyle` inputs and `PhaseCollapse` handling in the pipeline. |
| `internal/render/overlay.go` | (modify) `DrawNotice`, and the game-over card's cause subtitle. |
| `internal/render/hud.go` | (modify) honour `HUDStyle` when it is set. |
| `internal/render/board.go` | (modify) `BoardSprites`, so the app can hand the board to the collapse. |
| `internal/app/model.go`, `update.go` | (modify) own the world, forward events, track the session best, fill the FX fields. |

---

### Task 1: `fx.World` skeleton — config, snapshot, clock, accessors

**Files:**
- Create: `internal/fx/world.go`
- Test: `internal/fx/world_test.go`

**Interfaces:**
- Consumes: `render.Sprite`, `render.Rect`, `render.Mode`, `render.Palette`; `game.Event` types.
- Produces:
  ```go
  type Config struct {
      Enabled       bool
      ReducedMotion bool
      Mode          render.Mode
      Palette       *render.Palette
  }

  type Snapshot struct {
      Level, Combo, Score, Lines int
      Active  game.Piece
      GhostY  int
      Tier    render.Tier
      Over    bool
  }

  type World struct{ /* unexported */ }

  func New(cfg Config, seed int64) *World
  func (w *World) Resize(view, board render.Rect)
  func (w *World) Advance(dt time.Duration, snap Snapshot)
  func (w *World) Observe(evs []game.Event, snap Snapshot)

  func (w *World) Stars() []render.Sprite
  func (w *World) BoardFX() []render.Sprite
  func (w *World) GlobalFX() []render.Sprite
  func (w *World) Shake() render.Rect
  func (w *World) BorderStyle() *lipgloss.Style
  func (w *World) Banner() string
  func (w *World) Mission() string
  ```
  `Notice()` and `HUDStyle()` arrive in Task 9 together with the renderer fields they feed; nothing before then needs them.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"slices"
	"testing"
	"time"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

func testConfig(enabled bool) Config {
	return Config{Enabled: enabled, Mode: render.ModeFull, Palette: render.NewPalette(render.ModeFull)}
}

// worldWith is the constructor every later fx test uses: standard 80x30
// viewport, board interior at 15,3.
func worldWith(t *testing.T, cfg Config, seed int64) *World {
	t.Helper()
	w := New(cfg, seed)
	w.Resize(render.Rect{X: 0, Y: 0, W: 80, H: 30}, render.Rect{X: 15, Y: 3, W: 20, H: 20})
	return w
}

func testWorld(t *testing.T, enabled bool) *World {
	t.Helper()
	return worldWith(t, testConfig(enabled), 8675309)
}

func reducedWorld(t *testing.T) *World {
	t.Helper()
	cfg := testConfig(true)
	cfg.ReducedMotion = true
	return worldWith(t, cfg, 8675309)
}

func testSnapshot() Snapshot {
	return Snapshot{Level: 1, Active: game.SpawnPiece(game.KindT), GhostY: 20, Tier: render.TierWide}
}

func TestDisabledWorldProducesNothing(t *testing.T) {
	w := testWorld(t, false)
	w.Observe([]game.Event{game.PieceHardDropped{Distance: 18}}, testSnapshot())
	for i := 0; i < 60; i++ {
		w.Advance(16*time.Millisecond, testSnapshot())
	}
	if len(w.Stars()) != 0 || len(w.BoardFX()) != 0 || len(w.GlobalFX()) != 0 {
		t.Fatal("--no-fx must produce no sprites")
	}
	if got := w.Shake(); got.X != 0 || got.Y != 0 {
		t.Fatalf("Shake = %+v with FX disabled, want zero", got)
	}
	if w.Banner() != "" {
		t.Fatal("no banners with FX disabled")
	}
}

func TestWorldIsDeterministicPerSeed(t *testing.T) {
	run := func() []render.Sprite {
		w := testWorld(t, true)
		for i := 0; i < 120; i++ {
			w.Observe([]game.Event{game.PieceMoved{DX: 1}}, testSnapshot())
			w.Advance(16*time.Millisecond, testSnapshot())
		}
		return append(append([]render.Sprite{}, w.Stars()...), w.GlobalFX()...)
	}
	a, b := run(), run()
	if len(a) != len(b) {
		t.Fatalf("same seed produced %d and %d sprites", len(a), len(b))
	}
	for i := range a {
		if a[i].X != b[i].X || a[i].Y != b[i].Y || a[i].Glyph != b[i].Glyph {
			t.Fatalf("sprite %d diverged: %+v vs %+v", i, a[i], b[i])
		}
	}
}

func TestDifferentFXSeedsDiverge(t *testing.T) {
	spriteSum := func(seed int64) int {
		w := worldWith(t, testConfig(true), seed)
		sum := 0
		for i := 0; i < 60; i++ {
			w.Advance(16*time.Millisecond, testSnapshot())
		}
		for _, s := range w.Stars() {
			sum += s.X*31 + s.Y
		}
		return sum
	}
	if spriteSum(1) == spriteSum(2) {
		t.Fatal("two FX seeds produced identical starfields")
	}
}

func TestAdvanceIgnoresNonPositiveDT(t *testing.T) {
	w := testWorld(t, true)
	w.Advance(50*time.Millisecond, testSnapshot())
	before := append([]render.Sprite{}, w.Stars()...)
	w.Advance(0, testSnapshot())
	w.Advance(-time.Second, testSnapshot())
	after := w.Stars()
	for i := range before {
		if before[i] != after[i] {
			t.Fatal("a non-positive dt must not move anything")
		}
	}
}

func TestWorldNeverTouchesTheGame(t *testing.T) {
	g := game.New(4242)
	w := testWorld(t, true)
	evs := g.HardDrop()
	snap := Snapshot{Level: g.Level, Combo: g.Combo, Score: g.Score, Active: g.Active, GhostY: g.GhostY()}

	board, active, score, lines, level, combo := g.Board, g.Active, g.Score, g.Lines, g.Level, g.Combo
	next := append([]game.PieceKind{}, g.Next...)

	w.Observe(evs, snap)
	for i := 0; i < 100; i++ {
		w.Advance(16*time.Millisecond, snap)
	}

	if g.Board != board || g.Active != active {
		t.Fatal("FX mutated the board or the active piece (§14)")
	}
	if g.Score != score || g.Lines != lines || g.Level != level || g.Combo != combo {
		t.Fatal("FX mutated the score state (§14)")
	}
	if !slices.Equal(g.Next, next) {
		t.Fatal("FX drew from the game bag (§35, §49.6)")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -v`
Expected: FAIL — `undefined: New`.

- [ ] **Step 3: Implement `internal/fx/world.go`**

`World` holds `cfg`, `rng`, `view`/`board` rects, and (as later tasks add them) the particle slice, star layers, and timers. `Advance` returns immediately when `!cfg.Enabled` or `dt <= 0`. `Resize` stores the new rects and drops anything whose coordinates no longer make sense (Task 2 tests this). Accessors return `nil` / zero values while their subsystems do not exist yet, so this task compiles and passes on its own.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/fx/world.go internal/fx/world_test.go
git commit -m "feat(fx): world skeleton with isolated RNG and read-only snapshot"
```

---

### Task 2: Wire the world into the app and the renderer

**Files:**
- Modify: `internal/app/model.go`, `internal/app/update.go`
- Modify: `cmd/cosmic-tetris/main.go` (pass `ReducedMotion` and `Mode` into `fx.Config`)
- Test: `internal/app/fx_test.go`

**Interfaces:**
- Consumes: `fx.New`, `fx.Config`, `fx.Snapshot`, all `World` accessors (Task 1); `render.Input` FX fields (Plan 2 Task 7).
- Produces:
  ```go
  // model.go
  type Model struct {
      // ...existing fields...
      FX *fx.World
  }
  func (m Model) snapshot() fx.Snapshot
  ```
  `Update` forwards every `[]game.Event` it collects (from key handling and from `Advance`) to `m.FX.Observe`, calls `m.FX.Advance(dt, snap)` on each `FrameMsg` — even while paused, at a reduced rate, so background stars keep drifting (§30) — and `renderInput()` copies `Stars/BoardFX/GlobalFX/Shake/Banner/BorderStyle/Mission` across. Task 9 adds `Notice`/`HUDStyle` to this list and Task 12 adds `BootScreen`. `tea.WindowSizeMsg` calls `m.FX.Resize(view, layout.Inner)`.

- [ ] **Step 1: Write the failing test**

```go
package app

import (
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"
	"cosmic-tetris/internal/render"
)

func fxModel(t *testing.T, fxOn bool) Model {
	t.Helper()
	m := New(Options{Seed: 8675309, Mode: render.ModeFull, FXEnabled: fxOn})
	next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	return next.(Model)
}

func advance(t *testing.T, m Model, frames int) Model {
	t.Helper()
	for i := 0; i < frames; i++ {
		m.LastFrame = time.Now().Add(-16 * time.Millisecond)
		next, _ := m.Update(FrameMsg{Now: time.Now()})
		m = next.(Model)
	}
	return m
}

func TestFXSpritesReachTheRenderInput(t *testing.T) {
	m := advance(t, fxModel(t, true), 60)
	in := m.renderInput()
	if len(in.Stars) == 0 {
		t.Fatal("the starfield never reached render.Input")
	}
	if in.Mission == "" {
		t.Fatal("mission control never reached render.Input")
	}
}

func TestNoFXModeLeavesInputClean(t *testing.T) {
	m := advance(t, fxModel(t, false), 60)
	in := m.renderInput()
	if len(in.Stars) != 0 || len(in.BoardFX) != 0 || len(in.GlobalFX) != 0 {
		t.Fatal("--no-fx must leave the FX fields empty")
	}
	if in.Shake.X != 0 || in.Shake.Y != 0 {
		t.Fatal("--no-fx must not shake")
	}
	if got := render.RenderGrid(in).PlainString(); got == "" {
		t.Fatal("the game must still render with FX off")
	}
	m = press(t, m, tea.KeySpace, " ")
	if m.Game.Score == 0 {
		t.Fatal("the game must still be playable with FX off")
	}
}

func TestReducedMotionReachesTheWorld(t *testing.T) {
	m := New(Options{Seed: 1, Mode: render.ModeFull, FXEnabled: true, ReducedMotion: true})
	next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 30})
	m = next.(Model)
	m = press(t, m, tea.KeySpace, " ")
	m = advance(t, m, 5)
	if got := m.renderInput().Shake; got.X != 0 || got.Y != 0 {
		t.Fatalf("Shake = %+v with --reduced-motion, want zero (§49.5)", got)
	}
}

// Review Focus 4: resizing mid-effect keeps every sprite inside the new viewport.
func TestResizeDuringEffectsKeepsSpritesInBounds(t *testing.T) {
	m := fxModel(t, true)
	m = press(t, m, tea.KeySpace, " ") // start an impact + shake
	m = advance(t, m, 2)
	for _, size := range [][2]int{{40, 24}, {200, 60}, {41, 25}} {
		next, _ := m.Update(tea.WindowSizeMsg{Width: size[0], Height: size[1]})
		m = next.(Model)
		m = advance(t, m, 3)
		in := m.renderInput()
		for _, group := range [][]render.Sprite{in.Stars, in.BoardFX, in.GlobalFX} {
			for _, s := range group {
				if s.X < 0 || s.Y < 0 || s.X >= size[0] || s.Y >= size[1] {
					t.Fatalf("%dx%d: sprite %+v is outside the viewport", size[0], size[1], s)
				}
			}
		}
		g := render.RenderGrid(in)
		if g.W != size[0] || g.H != size[1] {
			t.Fatalf("grid is %dx%d, want %dx%d", g.W, g.H, size[0], size[1])
		}
	}
}

func TestPausedStarsKeepDriftingButGameplayFXFreeze(t *testing.T) {
	m := advance(t, fxModel(t, true), 30)
	m = press(t, m, 'p', "p")
	before := m.renderInput().Stars
	m = advance(t, m, 30)
	after := m.renderInput().Stars
	moved := false
	for i := range before {
		if i < len(after) && before[i] != after[i] {
			moved = true
			break
		}
	}
	if !moved {
		t.Fatal("background stars may keep drifting while paused (§30)")
	}
	y := m.Game.Active.Y
	if m.Game.Active.Y != y {
		t.Fatal("gameplay must stay frozen while paused")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/app/ -run FX -v`
Expected: FAIL — `m.FX undefined`.

- [ ] **Step 3: Wire it up**

`app.New` builds `fx.New(fx.Config{Enabled: opts.FXEnabled, ReducedMotion: opts.ReducedMotion, Mode: opts.Mode, Palette: render.NewPalette(opts.Mode)}, opts.Seed)` — the FX world derives its own generator from the same seed, so a `--seed` run is reproducible in both simulations while the two RNGs stay separate (§49.6). While paused, call `Advance` with a scaled-down `dt` (a quarter) and skip `Observe`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./... -count=1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/app cmd/cosmic-tetris/main.go
git commit -m "feat(app): forward game events to the FX world and composite its sprites"
```

---

### Task 3: Starfield

**Files:**
- Create: `internal/fx/starfield.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/starfield_test.go`

**Interfaces:**
- Consumes: `World`, `Snapshot`, `Config` (Task 1).
- Produces:
  ```go
  type Star struct {
      X, Y  float64
      Layer int    // 0 far, 1 mid, 2 near
      Glyph rune
  }
  const StarLayers = 3
  var LayerSpeed = [StarLayers]float64{1.2, 3.0, 7.0} // rows per second at level 1
  func (w *World) seedStars()                          // called by Resize, at full density
  func (w *World) advanceStars(dt time.Duration, snap Snapshot)
  // Stars() converts to sprites, dimmest layer first
  ```
  Glyph pools (§15): far `.`, mid `· ˚`, near `✦ ✧ *`; ASCII mode substitutes `. : +`. Density: one star per ~55 terminal cells at `TierWide`/`TierMedium`, halved at `TierSmall`. `Resize` seeds at full density (the tier is not known until a snapshot arrives); `advanceStars` tops up or trims to the tier's budget each frame, so `Stars()` is never empty before the first `Advance`.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/render"
)

func TestStarfieldFillsTheViewport(t *testing.T) {
	w := testWorld(t, true)
	stars := w.Stars()
	if len(stars) < 10 {
		t.Fatalf("only %d stars in an 80x30 viewport", len(stars))
	}
	for _, s := range stars {
		if s.X < 0 || s.X >= 80 || s.Y < 0 || s.Y >= 30 {
			t.Fatalf("star %+v is outside the viewport", s)
		}
	}
}

func TestStarsDriftDownward(t *testing.T) {
	w := testWorld(t, true)
	before := w.Stars()
	for i := 0; i < 60; i++ {
		w.Advance(16*time.Millisecond, testSnapshot())
	}
	after := w.Stars()
	down := 0
	for i := range before {
		if i < len(after) && after[i].Y > before[i].Y {
			down++
		}
	}
	if down == 0 {
		t.Fatal("stars must drift downward (§15)")
	}
}

func TestStarsWrapInsteadOfLeaking(t *testing.T) {
	w := testWorld(t, true)
	for i := 0; i < 600; i++ {
		w.Advance(16*time.Millisecond, Snapshot{Level: 12, Tier: render.TierWide})
	}
	if len(w.Stars()) == 0 {
		t.Fatal("stars must recycle, not disappear")
	}
	for _, s := range w.Stars() {
		if s.Y < 0 || s.Y >= 30 || s.X < 0 || s.X >= 80 {
			t.Fatalf("star %+v escaped the viewport", s)
		}
	}
}

func TestHigherLevelMovesStarsFaster(t *testing.T) {
	travel := func(level int) float64 {
		w := worldWith(t, testConfig(true), 99)
		start := w.rawStars()
		for i := 0; i < 30; i++ {
			w.Advance(16*time.Millisecond, Snapshot{Level: level, Tier: render.TierWide})
		}
		end := w.rawStars()
		sum := 0.0
		for i := range start {
			sum += end[i].Y - start[i].Y
		}
		return sum
	}
	if travel(10) <= travel(1) {
		t.Fatal("star velocity must increase with gravity/level (§15)")
	}
}

func TestSmallTierHalvesTheStarBudget(t *testing.T) {
	wide := testWorld(t, true)
	small := New(testConfig(true), 8675309)
	small.Resize(render.Rect{W: 40, H: 24}, render.Rect{X: 1, Y: 1, W: 20, H: 20})
	small.Advance(16*time.Millisecond, Snapshot{Level: 1, Tier: render.TierSmall})
	perCellWide := float64(len(wide.Stars())) / float64(80*30)
	perCellSmall := float64(len(small.Stars())) / float64(40*24)
	if perCellSmall >= perCellWide {
		t.Fatalf("small terminals must reduce star density: %.4f vs %.4f", perCellSmall, perCellWide)
	}
}

func TestASCIIStarsAreASCII(t *testing.T) {
	w := worldWith(t, Config{Enabled: true, Mode: render.ModeASCII, Palette: render.NewPalette(render.ModeASCII)}, 3)
	for _, s := range w.Stars() {
		if s.Glyph > 127 {
			t.Fatalf("ASCII mode emitted a non-ASCII star glyph %q", s.Glyph)
		}
	}
}

func TestShootingStarEventuallyAppears(t *testing.T) {
	w := testWorld(t, true)
	seen := false
	for i := 0; i < 60*90 && !seen; i++ { // up to ~90 seconds of idle
		w.Advance(16*time.Millisecond, testSnapshot())
		if w.shootingStarActive() {
			seen = true
		}
	}
	if !seen {
		t.Fatal("an idle board should occasionally get a shooting star (§45)")
	}
}
```

`rawStars()` and `shootingStarActive()` are unexported test seams in the same package — keep them tiny.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run Star -v`
Expected: FAIL — `undefined: Star`.

- [ ] **Step 3: Implement `internal/fx/starfield.go`**

Stars carry float positions; `advanceStars` adds `LayerSpeed[layer] * levelScale * dt` where `levelScale = 1 + 0.06*(level-1)`, capped at 2.5, multiplied by the hyperdrive factor Task 8 introduces. A star past the bottom wraps to `Y = 0` with a fresh random `X` drawn from the FX RNG. Near-layer stars use the brightest style, far stars `Palette.Dim` — never brighter than the board glyphs (§15's readability rule). The shooting star is a short diagonal streak of three sprites with a random cooldown between 20 and 60 seconds.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v && go test ./... -count=1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/fx/starfield.go internal/fx/world.go internal/fx/starfield_test.go
git commit -m "feat(fx): three-layer starfield with level-scaled drift"
```

---

### Task 4: Particle simulation and emitters

**Files:**
- Create: `internal/fx/particle.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/particle_test.go`

**Interfaces:**
- Consumes: `World`, `Config`.
- Produces:
  ```go
  const (
      MaxParticles  = 400
      MaxStepDT     = 20 * time.Millisecond // long frames are sub-stepped
      ParticleDrag  = 0.90                  // per 16ms step
      ParticleGravity = 26.0                // rows per second squared
  )

  type Particle struct {
      X, Y       float64
      VX, VY     float64
      Life       float64 // seconds remaining
      MaxLife    float64
      Glyph      rune
      Brightness float64 // 0..1
      Board      bool    // true: a board-local sprite that shakes with the board
  }

  func (w *World) emit(p Particle) bool // false when the pool is full
  func (w *World) advanceParticles(dt time.Duration)
  func (w *World) emitBurst(x, y float64, count int, speed float64, glyphs []rune, board bool)
  func (w *World) emitDebris(x, y float64, vx float64, glyphs []rune, board bool)
  func (w *World) particleSprites(board bool) []render.Sprite
  ```
  Integration per step (§23): `pos += vel*dt; vel.Y += ParticleGravity*dt; vel *= drag^(dt/16ms); life -= dt`. Particles die at `life <= 0` or outside the viewport. Brightness picks the style ramp: `> 0.66` bright, `> 0.33` mid, else dim.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"math"
	"testing"
	"time"
)

func TestParticleMovesDecaysAndDies(t *testing.T) {
	w := testWorld(t, true)
	w.emit(Particle{X: 40, Y: 10, VX: 4, VY: -2, Life: 0.3, MaxLife: 0.3, Glyph: '✦', Brightness: 1})
	first := w.rawParticles()[0]
	w.advanceParticles(32 * time.Millisecond)
	p := w.rawParticles()[0]
	if p.X <= first.X {
		t.Fatalf("X did not advance: %v -> %v", first.X, p.X)
	}
	if p.Life >= first.Life {
		t.Fatal("life must decay")
	}
	if math.Abs(p.VX) >= math.Abs(first.VX) {
		t.Fatal("drag must reduce velocity")
	}
	for i := 0; i < 40; i++ {
		w.advanceParticles(16 * time.Millisecond)
	}
	if len(w.rawParticles()) != 0 {
		t.Fatal("a particle past its lifetime must be reaped")
	}
}

func TestParticlesLeavingTheViewportAreReaped(t *testing.T) {
	w := testWorld(t, true)
	w.emit(Particle{X: 79, Y: 29, VX: 200, VY: 200, Life: 5, MaxLife: 5, Glyph: '*', Brightness: 1})
	w.advanceParticles(16 * time.Millisecond)
	if len(w.rawParticles()) != 0 {
		t.Fatal("a particle outside the viewport must be reaped (§23)")
	}
}

// Review Focus 1: the pool is capped no matter how many eruptions happen.
func TestParticlePoolIsCapped(t *testing.T) {
	w := testWorld(t, true)
	for i := 0; i < 100; i++ {
		w.emitBurst(40, 15, 200, 20, []rune{'·', '*', '✦', '+'}, false)
	}
	if got := len(w.rawParticles()); got > MaxParticles {
		t.Fatalf("pool holds %d particles, want at most %d", got, MaxParticles)
	}
	if !w.emitDropped() {
		t.Fatal("emissions past the cap must be dropped, not queued")
	}
}

// Review Focus 2: a dt spike is sub-stepped, never a teleport, never NaN.
func TestDTSpikeDoesNotTeleportOrProduceNaN(t *testing.T) {
	w := testWorld(t, true)
	w.emit(Particle{X: 40, Y: 15, VX: 30, VY: -30, Life: 10, MaxLife: 10, Glyph: '✦', Brightness: 1})
	w.advanceParticles(5 * time.Second)
	for _, p := range w.rawParticles() {
		if math.IsNaN(p.X) || math.IsNaN(p.Y) || math.IsInf(p.VX, 0) {
			t.Fatalf("particle went non-finite: %+v", p)
		}
	}
	// The particle either died or stayed in the viewport — never both alive and elsewhere.
	for _, p := range w.rawParticles() {
		if p.X < 0 || p.X >= 80 || p.Y < 0 || p.Y >= 30 {
			t.Fatalf("live particle %+v is outside the viewport", p)
		}
	}
}

// Review Focus 3: sprite generation clips to the viewport.
func TestParticleSpritesAreClipped(t *testing.T) {
	w := testWorld(t, true)
	w.emit(Particle{X: -3, Y: -3, Life: 1, MaxLife: 1, Glyph: 'Q', Brightness: 1})
	w.emit(Particle{X: 500, Y: 500, Life: 1, MaxLife: 1, Glyph: 'Q', Brightness: 1})
	for _, s := range w.particleSprites(false) {
		if s.X < 0 || s.Y < 0 || s.X >= 80 || s.Y >= 30 {
			t.Fatalf("sprite %+v escaped the viewport", s)
		}
	}
}

func TestBurstSpreadsInEveryDirection(t *testing.T) {
	w := testWorld(t, true)
	w.emitBurst(40, 15, 40, 15, []rune{'·', '*'}, false)
	var left, right, up, down bool
	for _, p := range w.rawParticles() {
		left = left || p.VX < -1
		right = right || p.VX > 1
		up = up || p.VY < -1
		down = down || p.VY > 1
	}
	if !left || !right || !up || !down {
		t.Fatal("a radial burst must throw particles in every direction (§23)")
	}
}

func TestDebrisInheritsHorizontalVelocity(t *testing.T) {
	w := testWorld(t, true)
	w.emitDebris(40, 15, -8, []rune{'·'}, true)
	w.emitDebris(40, 15, 8, []rune{'·'}, true)
	ps := w.rawParticles()
	if len(ps) < 2 || ps[0].VX >= 0 || ps[1].VX <= 0 {
		t.Fatalf("debris must inherit the supplied horizontal velocity: %+v", ps)
	}
}

func TestBoardAndGlobalParticlesAreSeparated(t *testing.T) {
	w := testWorld(t, true)
	w.emit(Particle{X: 20, Y: 10, Life: 1, MaxLife: 1, Glyph: 'b', Brightness: 1, Board: true})
	w.emit(Particle{X: 21, Y: 10, Life: 1, MaxLife: 1, Glyph: 'g', Brightness: 1})
	if len(w.particleSprites(true)) != 1 || len(w.particleSprites(false)) != 1 {
		t.Fatal("board-local and global particles must be reported separately")
	}
}
```

`rawParticles()` and `emitDropped()` are unexported test seams.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run Particle -v`
Expected: FAIL — `undefined: Particle`.

- [ ] **Step 3: Implement `internal/fx/particle.go`**

`advanceParticles` splits `dt` into steps of at most `MaxStepDT` and integrates each; reaping compacts the slice in place (`particles = particles[:n]`) so the backing array is reused (§38). `emitBurst` draws angles from the FX RNG spread evenly over the circle with random jitter, halving `VY` magnitude relative to `VX` so the ellipse reads correctly in a terminal's 2:1 cells. Wire `advanceParticles` and both sprite accessors into `World.Advance`, `BoardFX`, and `GlobalFX`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v && go test ./... -count=1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/fx/particle.go internal/fx/world.go internal/fx/particle_test.go
git commit -m "feat(fx): capped particle simulation with radial and debris emitters"
```

---

### Task 5: Piece trails

**Files:**
- Create: `internal/fx/trails.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/trails_test.go`

**Interfaces:**
- Consumes: `World`, `game.PieceMoved`, `game.PieceRotated`, `game.PieceHardDropped`.
- Produces:
  ```go
  const TrailLife = 140 * time.Millisecond // §17: ~100-160ms
  var TrailGlyphs = [3]rune{'▓', '▒', '░'} // ASCII: '#', '=', '.'; each board cell is two columns,
                                           // so one trail cell emits two sprites with the same rune

  type trail struct {
      Cells []game.Point // board cells (X 0..BoardWidth-1, Y 0..BoardHeight-1)
      Age   time.Duration
      Kind  game.PieceKind
  }
  func (w *World) recordTrail(p game.Piece)
  func (w *World) advanceTrails(dt time.Duration)
  func (w *World) trailSprites() []render.Sprite // board-local, terminal coordinates
  func (w *World) trailCells() []game.Point      // test seam: live trail cells, board coordinates
  ```

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func TestMovingLeavesATrailThatFades(t *testing.T) {
	w := testWorld(t, true)
	snap := testSnapshot()
	w.Observe([]game.Event{game.PieceMoved{Piece: snap.Active, DX: 1}}, snap)
	if len(w.trailSprites()) == 0 {
		t.Fatal("moving must leave a trail (§17)")
	}
	glyphs := map[rune]bool{}
	for i := 0; i < 6; i++ {
		w.Advance(16*time.Millisecond, snap)
		for _, s := range w.trailSprites() {
			glyphs[s.Glyph] = true
		}
	}
	if len(glyphs) < 2 {
		t.Fatalf("a trail must fade through several glyphs, saw %v", glyphs)
	}
}

func TestTrailsExpire(t *testing.T) {
	w := testWorld(t, true)
	snap := testSnapshot()
	w.Observe([]game.Event{game.PieceMoved{Piece: snap.Active, DX: -1}}, snap)
	for i := 0; i < 20; i++ {
		w.Advance(16*time.Millisecond, snap)
	}
	if len(w.trailSprites()) != 0 {
		t.Fatalf("trails must not outlive %v", TrailLife)
	}
}

func TestRotationAlsoLeavesATrail(t *testing.T) {
	w := testWorld(t, true)
	snap := testSnapshot()
	w.Observe([]game.Event{game.PieceRotated{Piece: snap.Active, Delta: 1}}, snap)
	if len(w.trailSprites()) == 0 {
		t.Fatal("rotation must leave a trail")
	}
}

func TestHardDropLeavesAStrongerVerticalTrail(t *testing.T) {
	w := testWorld(t, true)
	snap := testSnapshot()
	w.Observe([]game.Event{game.PieceMoved{Piece: snap.Active, DX: 1}}, snap)
	side := len(w.trailSprites())
	w2 := testWorld(t, true)
	dropped := game.Piece{Kind: game.KindI, Rotation: 1, X: 4, Y: 19}
	w2.Observe([]game.Event{game.PieceHardDropped{Piece: dropped, Distance: 17}}, snap)
	if len(w2.trailSprites()) <= side {
		t.Fatal("a hard drop must draw a stronger vertical trail than a sideways move (§17, §18.1)")
	}
}

func TestTrailSpritesStayInsideTheBoard(t *testing.T) {
	w := testWorld(t, true)
	snap := testSnapshot()
	w.Observe([]game.Event{game.PieceHardDropped{Piece: game.Piece{Kind: game.KindI, Rotation: 0, X: 0, Y: 21}, Distance: 21}}, snap)
	board := w.boardRect()
	for _, s := range w.trailSprites() {
		if !board.Contains(s.X, s.Y) {
			t.Fatalf("trail sprite %+v is outside the board interior %+v", s, board)
		}
	}
}

func TestTrailsNeverCoverTheActivePiece(t *testing.T) {
	w := testWorld(t, true)
	snap := testSnapshot()
	snap.Active = game.Piece{Kind: game.KindT, Rotation: 0, X: 4, Y: 10}
	w.Observe([]game.Event{game.PieceMoved{Piece: snap.Active, DX: 1}}, snap)
	w.Advance(16*time.Millisecond, snap)
	occupied := map[[2]int]bool{}
	for _, c := range snap.Active.Cells() {
		occupied[[2]int{c.X, c.Y}] = true
	}
	for _, cell := range w.trailCells() {
		if occupied[[2]int{cell.X, cell.Y}] {
			t.Fatalf("a trail covered the active piece at %+v (§44)", cell)
		}
	}
}
```

`boardRect()` returns the board interior in terminal coordinates — an unexported test seam alongside `trailCells()`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run Trail -v`
Expected: FAIL — `undefined: TrailLife`.

- [ ] **Step 3: Implement `internal/fx/trails.go`**

Record the piece's cells at its **previous** position (from the event's `Piece` plus the inverse of `DX`/`DY`), age each trail, pick the glyph by `Age / (TrailLife/3)`, and drop any cell currently occupied by `snap.Active` before emitting sprites (§44's "never obscure the active piece"). A hard drop records one trail per row crossed, so the column reads as a streak.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v && go test ./... -count=1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/fx/trails.go internal/fx/world.go internal/fx/trails_test.go
git commit -m "feat(fx): short-lived ion trails for moves, rotations, and hard drops"
```

---

### Task 6: Hard-drop impact — shake, border flash, debris

**Files:**
- Create: `internal/fx/impact.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/impact_test.go`

**Interfaces:**
- Consumes: `World`, `emitBurst` (Task 4), `game.PieceHardDropped`, `game.PieceLocked`.
- Produces:
  ```go
  const (
      ShakeDuration = 80 * time.Millisecond
      ShakeStep     = 16 * time.Millisecond
      BorderFlash   = 120 * time.Millisecond
  )
  var ShakePattern = [5]render.Rect{{X: 0, Y: 1}, {X: -1, Y: 0}, {X: 1, Y: 0}, {X: 0, Y: -1}, {}} // §18.3

  func (w *World) startShake()
  func (w *World) advanceImpact(dt time.Duration)
  // Shake() returns ShakePattern[step] while a shake runs, zero otherwise; always zero
  // when ReducedMotion or !Enabled.
  ```
  Impact particles use the §18.2 glyph set `· * ✦ +` (ASCII: `. * + x`).

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func hardDropEvents() []game.Event {
	p := game.Piece{Kind: game.KindI, Rotation: 1, X: 4, Y: 18}
	return []game.Event{game.PieceHardDropped{Piece: p, Distance: 17}, game.PieceLocked{Piece: p}}
}

func TestHardDropShakesForAboutEightyMilliseconds(t *testing.T) {
	w := testWorld(t, true)
	w.Observe(hardDropEvents(), testSnapshot())
	if got := w.Shake(); got.X == 0 && got.Y == 0 {
		t.Fatal("the shake must start immediately on impact")
	}
	elapsed := time.Duration(0)
	for elapsed < ShakeDuration+ShakeStep {
		w.Advance(ShakeStep, testSnapshot())
		elapsed += ShakeStep
	}
	if got := w.Shake(); got.X != 0 || got.Y != 0 {
		t.Fatalf("Shake = %+v after %v, want zero", got, elapsed)
	}
}

func TestShakeNeverExceedsOneCell(t *testing.T) {
	w := testWorld(t, true)
	w.Observe(hardDropEvents(), testSnapshot())
	for i := 0; i < 20; i++ {
		s := w.Shake()
		if s.X < -1 || s.X > 1 || s.Y < -1 || s.Y > 1 {
			t.Fatalf("Shake = %+v, must never exceed one cell (§44)", s)
		}
		w.Advance(8*time.Millisecond, testSnapshot())
	}
}

func TestShakeFollowsTheDeterministicPattern(t *testing.T) {
	w := testWorld(t, true)
	w.Observe(hardDropEvents(), testSnapshot())
	for i, want := range ShakePattern {
		if got := w.Shake(); got != want {
			t.Fatalf("step %d: Shake = %+v, want %+v (§18.3)", i, got, want)
		}
		w.Advance(ShakeStep, testSnapshot())
	}
}

// Review Focus 5: reduced motion removes the shake and nothing else.
func TestReducedMotionSuppressesShakeButKeepsParticles(t *testing.T) {
	w := reducedWorld(t)
	w.Observe(hardDropEvents(), testSnapshot())
	if got := w.Shake(); got.X != 0 || got.Y != 0 {
		t.Fatalf("Shake = %+v with reduced motion, want zero (§49.5)", got)
	}
	if len(w.rawParticles()) == 0 {
		t.Fatal("reduced motion keeps particles (§49.5)")
	}
}

// Review Focus 2 (shake half): a dt spike must not leave the shake stuck on.
func TestShakeClearsAfterADTSpike(t *testing.T) {
	w := testWorld(t, true)
	w.Observe(hardDropEvents(), testSnapshot())
	w.Advance(9*time.Second, testSnapshot())
	if got := w.Shake(); got.X != 0 || got.Y != 0 {
		t.Fatalf("Shake = %+v after a 9s frame, want zero", got)
	}
}

func TestImpactEmitsDebrisAtTheContactArea(t *testing.T) {
	w := testWorld(t, true)
	w.Observe(hardDropEvents(), testSnapshot())
	ps := w.rawParticles()
	if len(ps) == 0 {
		t.Fatal("impact must emit debris (§18.2)")
	}
	board := w.boardRect()
	near := false
	for _, p := range ps {
		if p.Board && p.Y > float64(board.Y+board.H/2) {
			near = true
		}
	}
	if !near {
		t.Fatal("debris must come from the contact area near the landing row")
	}
}

func TestImpactFlashesTheBorder(t *testing.T) {
	w := testWorld(t, true)
	calm := w.BorderStyle()
	w.Observe(hardDropEvents(), testSnapshot())
	if w.BorderStyle() == calm {
		t.Fatal("impact must brighten the border (§18.4)")
	}
	for i := 0; i < 20; i++ {
		w.Advance(16*time.Millisecond, testSnapshot())
	}
	if w.borderFlashing() {
		t.Fatalf("the border flash must decay within %v", BorderFlash)
	}
}

func TestSoftLandingDoesNotShake(t *testing.T) {
	w := testWorld(t, true)
	w.Observe([]game.Event{game.PieceLocked{Piece: game.SpawnPiece(game.KindO)}}, testSnapshot())
	if got := w.Shake(); got.X != 0 || got.Y != 0 {
		t.Fatal("only hard drops shake the screen (§18)")
	}
}
```

`borderFlashing()` is an unexported test seam.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run 'Shake|Impact|Reduced|Soft' -v`
Expected: FAIL — `undefined: ShakeDuration`.

- [ ] **Step 3: Implement `internal/fx/impact.go`**

Track `shakeElapsed time.Duration`; the pattern index is `min(int(shakeElapsed/ShakeStep), len(ShakePattern)-1)` and the shake ends once `shakeElapsed >= ShakeDuration`, which makes a huge `dt` end it rather than freeze it. `PieceHardDropped` with `Distance == 0` still locks but should not shake the screen for a piece that fell nowhere — gate the shake on `Distance > 0`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v && go test ./... -count=1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/fx/impact.go internal/fx/world.go internal/fx/impact_test.go
git commit -m "feat(fx): hard-drop impact with bounded shake, debris, and border flash"
```

---

### Task 7: Line-clear supernova

**Files:**
- Create: `internal/fx/lineclear.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/lineclear_test.go`

**Interfaces:**
- Consumes: `game.LinesCleared` (with `Rows` and `Kinds`), `emitDebris` (Task 4).
- Produces:
  ```go
  const (
      ClearTotal  = 220 * time.Millisecond
      ClearPhaseA = 70 * time.Millisecond  // critical mass
      ClearPhaseB = 150 * time.Millisecond // supernova, center outward
      // ClearPhaseC runs from ClearPhaseB to ClearTotal: collapse into debris
  )
  type clearFX struct {
      Rows  []int
      Kinds [][game.BoardWidth]game.PieceKind
      Age   time.Duration
  }
  func (w *World) startClear(ev game.LinesCleared)
  func (w *World) advanceClears(dt time.Duration)
  func (w *World) clearSprites() []render.Sprite // board-local, at the pre-collapse row positions
  ```
  Glyph ramp by phase and distance from the row center (§19), one rune per column: phase A `▓` and `█`, phase B `░ ▓ █ ✦`, phase C nothing (the debris particles carry it). ASCII: `= # [ *`.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func clearEvent(rows ...int) game.LinesCleared {
	ev := game.LinesCleared{Rows: rows, Count: len(rows), Score: 100}
	for range rows {
		var kinds [game.BoardWidth]game.PieceKind
		for x := range kinds {
			kinds[x] = game.KindI
		}
		ev.Kinds = append(ev.Kinds, kinds)
	}
	return ev
}

func TestClearAnimationRunsForAboutTwoTwentyMilliseconds(t *testing.T) {
	w := testWorld(t, true)
	w.Observe([]game.Event{clearEvent(game.BoardHeight - 1)}, testSnapshot())
	if len(w.clearSprites()) == 0 {
		t.Fatal("a clear must animate (§19)")
	}
	elapsed := time.Duration(0)
	for elapsed < ClearTotal {
		w.Advance(16*time.Millisecond, testSnapshot())
		elapsed += 16 * time.Millisecond
	}
	w.Advance(32*time.Millisecond, testSnapshot())
	if len(w.clearSprites()) != 0 {
		t.Fatalf("the clear animation must finish by %v", ClearTotal)
	}
}

func TestClearPhasesUseDifferentGlyphs(t *testing.T) {
	w := testWorld(t, true)
	w.Observe([]game.Event{clearEvent(game.BoardHeight - 1)}, testSnapshot())
	phaseGlyphs := func() map[rune]bool {
		m := map[rune]bool{}
		for _, s := range w.clearSprites() {
			m[s.Glyph] = true
		}
		return m
	}
	a := phaseGlyphs()
	w.Advance(ClearPhaseA+8*time.Millisecond, testSnapshot())
	b := phaseGlyphs()
	if len(a) == 0 || len(b) == 0 {
		t.Fatal("both phases must draw something")
	}
	same := true
	for g := range a {
		if !b[g] {
			same = false
		}
	}
	if same && len(a) == len(b) {
		t.Fatal("phase B must look different from phase A (§19)")
	}
}

func TestSupernovaSpreadsFromTheCenterOutward(t *testing.T) {
	w := testWorld(t, true)
	w.Observe([]game.Event{clearEvent(game.BoardHeight - 1)}, testSnapshot())
	w.Advance(ClearPhaseA+4*time.Millisecond, testSnapshot())
	early := w.brightClearColumns()
	w.Advance(40*time.Millisecond, testSnapshot())
	late := w.brightClearColumns()
	if spread(early) >= spread(late) {
		t.Fatalf("the explosion must widen over time: %v then %v", early, late)
	}
}

func TestCollapsePhaseEmitsDebrisWithOutwardVelocity(t *testing.T) {
	w := testWorld(t, true)
	w.Observe([]game.Event{clearEvent(game.BoardHeight - 1)}, testSnapshot())
	w.Advance(ClearPhaseB+8*time.Millisecond, testSnapshot())
	ps := w.rawParticles()
	if len(ps) == 0 {
		t.Fatal("phase C must fragment the row into debris (§19)")
	}
	var left, right bool
	for _, p := range ps {
		if p.VX < 0 {
			left = true
		}
		if p.VX > 0 {
			right = true
		}
	}
	if !left || !right {
		t.Fatal("debris must inherit horizontal velocity from its position relative to center (§19)")
	}
}

func TestClearSpritesStayInsideTheBoard(t *testing.T) {
	w := testWorld(t, true)
	w.Observe([]game.Event{clearEvent(game.BoardHeight-1, game.BoardHeight-2, game.BoardHeight-3, game.BoardHeight-4)}, testSnapshot())
	board := w.boardRect()
	for i := 0; i < 14; i++ {
		for _, s := range w.clearSprites() {
			if !board.Contains(s.X, s.Y) {
				t.Fatalf("clear sprite %+v escaped the board %+v", s, board)
			}
		}
		w.Advance(16*time.Millisecond, testSnapshot())
	}
}

func TestClearAnimationDoesNotDelayAnything(t *testing.T) {
	// The engine has already collapsed the rows; FX only overlays. Two clears
	// back to back must both animate rather than queue.
	w := testWorld(t, true)
	w.Observe([]game.Event{clearEvent(game.BoardHeight - 1)}, testSnapshot())
	w.Advance(32*time.Millisecond, testSnapshot())
	w.Observe([]game.Event{clearEvent(game.BoardHeight - 2)}, testSnapshot())
	if n := w.activeClears(); n != 2 {
		t.Fatalf("activeClears = %d, want 2 concurrent animations", n)
	}
}

func spread(cols []int) int {
	if len(cols) == 0 {
		return 0
	}
	lo, hi := cols[0], cols[0]
	for _, c := range cols {
		lo, hi = min(lo, c), max(hi, c)
	}
	return hi - lo
}
```

Test seams: `brightClearColumns() []int` (board columns at peak brightness this frame) and `activeClears() int`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run Clear -v`
Expected: FAIL — `undefined: ClearTotal`.

- [ ] **Step 3: Implement `internal/fx/lineclear.go`**

Sprites are drawn at the row's **pre-collapse** board position — the engine has already collapsed the board, and §19 explicitly allows the render to lag. Phase B's brightness front is `front = float64(game.BoardWidth/2) * (Age-ClearPhaseA)/(ClearPhaseB-ClearPhaseA)`; a column is at peak brightness when `|x - center| <= front` and dimmer beyond it. Phase C emits debris once per clear (guard with a bool) using `vx = (float64(x) - center) * 3.5` so outer fragments fly outward faster.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v && go test ./... -count=1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/fx/lineclear.go internal/fx/world.go internal/fx/lineclear_test.go
git commit -m "feat(fx): three-phase line-clear supernova with outward debris"
```

---

### Task 8: Hyperdrive

**Files:**
- Create: `internal/fx/spectacle.go`
- Modify: `internal/fx/world.go`, `internal/fx/starfield.go`, `internal/app/model.go`, `internal/app/update.go`
- Test: `internal/fx/hyperdrive_test.go`, `internal/app/highscore_test.go`

**Interfaces:**
- Consumes: star advance (Task 3), `game.LinesCleared`, `game.ComboChanged`.
- Produces:
  ```go
  const HyperTotal = 1100 * time.Millisecond
  const HyperPeak = 8.0
  // §16 timeline: 0 pause, 50 stretch, 100 accelerate, 500 peak, 800 decay, 1100 normal
  func (w *World) startHyperdrive()
  func (w *World) hyperSpeed() float64 // 0 at the pause, 1 when idle, up to HyperPeak at peak
  func (w *World) NewHighScore(score int)

  // internal/app: Model gains Best int — the highest score of this session, which
  // survives restarts. Nothing in the design persists a high score to disk (§26 has
  // no best-score field), so "new high score" means beating the session best.
  ```
  Triggers (§16): a four-line clear, a combo of 4 or more, and a new high score. Suppressed entirely when `ReducedMotion` — the starfield keeps its normal speed.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func TestFourLineClearTriggersHyperdrive(t *testing.T) {
	w := testWorld(t, true)
	w.Observe([]game.Event{clearEvent(18, 19, 20, 21)}, testSnapshot())
	if !w.hyperActive() {
		t.Fatal("a four-line clear must trigger hyperdrive (§16)")
	}
}

func TestBigComboTriggersHyperdrive(t *testing.T) {
	w := testWorld(t, true)
	w.Observe([]game.Event{game.ComboChanged{Combo: 4}}, testSnapshot())
	if !w.hyperActive() {
		t.Fatal("a large combo must trigger hyperdrive (§16)")
	}
}

func TestNewHighScoreTriggersHyperdrive(t *testing.T) {
	w := testWorld(t, true)
	w.NewHighScore(1000)
	if !w.hyperActive() {
		t.Fatal("a new high score must trigger hyperdrive (§16)")
	}
}

func TestHyperdriveFollowsTheTimeline(t *testing.T) {
	at := func(d time.Duration) float64 {
		w := testWorld(t, true)
		w.Observe([]game.Event{clearEvent(18, 19, 20, 21)}, testSnapshot())
		w.Advance(d, testSnapshot())
		return w.hyperSpeed()
	}
	if s := at(20 * time.Millisecond); s > 0.2 {
		t.Fatalf("stars must pause at the start: speed %v", s)
	}
	if at(600*time.Millisecond) <= at(150*time.Millisecond) {
		t.Fatal("stars must accelerate toward peak speed by 500ms")
	}
	if s := at(600 * time.Millisecond); s < HyperPeak*0.8 {
		t.Fatalf("peak speed = %v, want near %v", s, HyperPeak)
	}
	if at(1000*time.Millisecond) >= at(600*time.Millisecond) {
		t.Fatal("stars must decay after 800ms")
	}
	if got := at(HyperTotal + 50*time.Millisecond); got < 0.9 || got > 1.1 {
		t.Fatalf("speed must return to normal after %v, got %v", HyperTotal, got)
	}
}

func TestHyperdriveActuallyMovesStarsFaster(t *testing.T) {
	travel := func(hyper bool) float64 {
		w := worldWith(t, testConfig(true), 77)
		if hyper {
			w.startHyperdrive()
			w.Advance(500*time.Millisecond, testSnapshot()) // reach peak
		}
		start := w.rawStars()
		sum := 0.0
		w.Advance(48*time.Millisecond, testSnapshot())
		end := w.rawStars()
		for i := range start {
			sum += end[i].Y - start[i].Y
		}
		return sum
	}
	if travel(true) <= travel(false) {
		t.Fatal("hyperdrive must visibly accelerate the starfield")
	}
}

// Review Focus 5: reduced motion cancels the acceleration.
func TestReducedMotionSuppressesHyperdrive(t *testing.T) {
	w := reducedWorld(t)
	w.Observe([]game.Event{clearEvent(18, 19, 20, 21)}, testSnapshot())
	w.Advance(500*time.Millisecond, testSnapshot())
	if got := w.hyperSpeed(); got < 0.9 || got > 1.1 {
		t.Fatalf("hyperSpeed = %v with reduced motion, want 1 (§49.5)", got)
	}
}

func TestRetriggerRestartsRatherThanStacks(t *testing.T) {
	w := testWorld(t, true)
	w.startHyperdrive()
	w.Advance(700*time.Millisecond, testSnapshot())
	w.startHyperdrive()
	if s := w.hyperSpeed(); s > 0.2 {
		t.Fatalf("a retrigger restarts the timeline at the pause: %v", s)
	}
}
```

`hyperActive()` is an unexported test seam.

And the app side, `internal/app/highscore_test.go`:

```go
package app

import (
	"testing"

	tea "charm.land/bubbletea/v2"
)

func TestSessionBestTracksAcrossRestarts(t *testing.T) {
	m := fxModel(t, true)
	for i := 0; i < 6; i++ {
		m = press(t, m, tea.KeySpace, " ")
	}
	scored := m.Game.Score
	if scored == 0 {
		t.Fatal("hard drops must score something")
	}
	if m.Best != scored {
		t.Fatalf("Best = %d, want %d", m.Best, scored)
	}
	m = press(t, m, 'r', "r")
	if m.Best != scored {
		t.Fatalf("Best = %d after restart, want the session best %d kept", m.Best, scored)
	}
	if m.Game.Score != 0 {
		t.Fatal("a restart resets the current score")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run Hyper -v; go test ./internal/app/ -run SessionBest -v`
Expected: FAIL — `undefined: HyperTotal`, `m.Best undefined`.

- [ ] **Step 3: Implement hyperdrive in `internal/fx/spectacle.go`**

`hyperSpeed` is a piecewise interpolation over `hyperElapsed`: `[0,50)` → 0; `[50,100)` → 0.5; `[100,500)` → linear 1 → `HyperPeak`; `[500,800)` → `HyperPeak`; `[800,1100)` → linear `HyperPeak` → 1; otherwise 1. Return 1 when `ReducedMotion`. Multiply it into `advanceStars`, and during the `[50,100)` stretch window swap the near-layer glyph for `|` so the streak reads as motion blur.

In `internal/app`: after every state change, if `m.Game.Score > m.Best` set `m.Best = m.Game.Score` and call `m.FX.NewHighScore(m.Best)` — but only once the session has had a score to beat, so the very first point of the session does not fire hyperdrive. A restart clears the game and keeps `Best`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v && go test ./... -count=1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/fx/spectacle.go internal/fx/starfield.go internal/fx/world.go internal/fx/hyperdrive_test.go internal/app
git commit -m "feat(fx): hyperdrive timeline driving the starfield"
```

---

### Task 9: The four-line spectacle, shockwaves, combo escalation, level-up notice

**Files:**
- Modify: `internal/fx/spectacle.go`, `internal/fx/world.go`
- Modify: `internal/render/render.go` (the two `Input` fields plus their pipeline steps), `internal/render/overlay.go` (`DrawNotice`), `internal/render/hud.go` (honour `HUDStyle`)
- Modify: `internal/app/model.go` (`renderInput` copies the two new fields)
- Modify: `internal/render/testdata/*.golden` (regenerate — new fields are zero in the existing cases, so ideally no diff)
- Test: `internal/fx/spectacle_test.go`, `internal/render/notice_test.go`

**Interfaces:**
- Consumes: `emitBurst`, `startHyperdrive`, `startShake`.
- Produces:
  ```go
  // internal/render
  type Notice struct {
      Title, Subtitle string
      Offset          int // rows to shift the box upward as it slides away
  }
  // Input gains: Notice Notice; HUDStyle *lipgloss.Style — drawn after the HUD,
  // before the overlays; app.renderInput copies them from World.Notice/HUDStyle.
  func DrawNotice(g *Grid, area Rect, n Notice, p *Palette, gl Glyphs)

  // internal/fx
  const (
      BannerDuration = 700 * time.Millisecond // §20
      NoticeDuration = 1400 * time.Millisecond // §22 slide + fade
      ShockwaveLife  = 300 * time.Millisecond  // §24
  )
  var TetrisBanners = []string{
      "✦ EVENT HORIZON ✦",
      "QUADRUPLE COSMIC INCIDENT",
      "FOUR ROWS HAVE LEFT THE CHAT",
      "SPACE-TIME HAS FILED A COMPLAINT",
  }
  var LevelSubtitles = []string{
      "GRAVITY TAX INCREASED",
      "LOCAL PHYSICS UPDATED WITHOUT CONSENT",
      "PLEASE SECURE ALL LOOSE TETROMINOES",
  }
  func (w *World) startShockwave(cx, cy float64)
  func (w *World) Notice() render.Notice     // zero value when nothing is showing
  func (w *World) HUDStyle() *lipgloss.Style // pulsing from combo 4 (§21), nil otherwise
  ```
  Combo escalation (§21): combo 2 → a small spark burst; combo 3 → meteor particles (fast, shallow angle); combo 4+ → HUD pulse; combo 5+ → the mission channel escalates (Task 11 owns the copy).

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"strings"
	"testing"
	"time"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

func TestFourLineClearFiresEverything(t *testing.T) {
	w := testWorld(t, true)
	w.Observe([]game.Event{clearEvent(18, 19, 20, 21)}, testSnapshot())
	if !w.hyperActive() {
		t.Error("four-line clear must trigger hyperdrive (§20)")
	}
	if s := w.Shake(); s.X == 0 && s.Y == 0 {
		t.Error("four-line clear must shake the screen (§20)")
	}
	if w.Banner() == "" {
		t.Error("four-line clear must show a banner (§20)")
	}
	if len(w.rawParticles()) == 0 {
		t.Error("four-line clear must erupt particles (§20)")
	}
	if !w.shockwaveActive() {
		t.Error("four-line clear must emit a shockwave (§20, §24)")
	}
	if w.starDensityBoost() <= 1 {
		t.Error("four-line clear must temporarily increase star density (§20)")
	}
	if w.HUDStyle() == nil {
		t.Error("four-line clear must flash the HUD (§20)")
	}
}

func TestBannerTextIsFromTheSpecAndExpires(t *testing.T) {
	w := testWorld(t, true)
	w.Observe([]game.Event{clearEvent(18, 19, 20, 21)}, testSnapshot())
	found := false
	for _, b := range TetrisBanners {
		if w.Banner() == b {
			found = true
		}
	}
	if !found {
		t.Fatalf("Banner = %q, want one of the §20 banners", w.Banner())
	}
	w.Advance(BannerDuration+50*time.Millisecond, testSnapshot())
	if w.Banner() != "" {
		t.Fatalf("the banner must clear after %v", BannerDuration)
	}
}

func TestSingleClearDoesNotBanner(t *testing.T) {
	w := testWorld(t, true)
	w.Observe([]game.Event{clearEvent(21)}, testSnapshot())
	if w.Banner() != "" {
		t.Fatalf("a single clear must not banner, got %q", w.Banner())
	}
}

func TestShockwaveExpandsAndExpires(t *testing.T) {
	w := testWorld(t, true)
	w.startShockwave(40, 15)
	first := len(w.GlobalFX())
	w.Advance(120*time.Millisecond, testSnapshot())
	if len(w.GlobalFX()) <= first {
		t.Fatal("a shockwave ring must expand (§24)")
	}
	w.Advance(ShockwaveLife, testSnapshot())
	if w.shockwaveActive() {
		t.Fatalf("a shockwave must expire within %v", ShockwaveLife)
	}
}

func TestShockwaveSuppressedByReducedMotionAndSmallTerminals(t *testing.T) {
	w := reducedWorld(t)
	w.Observe([]game.Event{clearEvent(18, 19, 20, 21)}, testSnapshot())
	if w.shockwaveActive() {
		t.Fatal("reduced motion suppresses shockwaves (§49.5)")
	}
	small := testWorld(t, true)
	snap := testSnapshot()
	snap.Tier = render.TierSmall
	small.Observe([]game.Event{clearEvent(18, 19, 20, 21)}, snap)
	if small.shockwaveActive() {
		t.Fatal("small terminals skip shockwaves (§31)")
	}
}

func TestComboEscalation(t *testing.T) {
	steps := []struct {
		combo int
		check func(*World) bool
		what  string
	}{
		{2, func(w *World) bool { return len(w.rawParticles()) > 0 }, "sparks at combo 2"},
		{3, func(w *World) bool { return w.meteorCount() > 0 }, "meteors at combo 3"},
		{4, func(w *World) bool { return w.HUDStyle() != nil }, "HUD pulse at combo 4"},
	}
	for _, s := range steps {
		w := testWorld(t, true)
		w.Observe([]game.Event{game.ComboChanged{Combo: s.combo}}, testSnapshot())
		if !s.check(w) {
			t.Errorf("missing %s (§21)", s.what)
		}
	}
	w := testWorld(t, true)
	w.Observe([]game.Event{game.ComboChanged{Combo: 0}}, testSnapshot())
	if w.HUDStyle() != nil {
		t.Error("a reset combo must stop the HUD pulse")
	}
}

func TestLevelUpNoticeSlidesAndClears(t *testing.T) {
	w := testWorld(t, true)
	w.Observe([]game.Event{game.LevelChanged{Level: 8}}, testSnapshot())
	n := w.Notice()
	if !strings.Contains(n.Title, "GRAVITY ANOMALY DETECTED") {
		t.Fatalf("Notice.Title = %q, want the §22 headline", n.Title)
	}
	if !strings.Contains(n.Subtitle, "LEVEL 08") && !containsAny(n.Subtitle, LevelSubtitles) {
		t.Fatalf("Notice.Subtitle = %q, want the level or a §22 subtitle", n.Subtitle)
	}
	start := w.Notice().Offset
	w.Advance(NoticeDuration/2, testSnapshot())
	if w.Notice().Offset == start {
		t.Fatal("the notice must slide as it leaves (§22)")
	}
	w.Advance(NoticeDuration, testSnapshot())
	if w.Notice().Title != "" {
		t.Fatalf("the notice must clear after %v", NoticeDuration)
	}
}

func containsAny(s string, opts []string) bool {
	for _, o := range opts {
		if strings.Contains(s, o) {
			return true
		}
	}
	return false
}
```

And in `internal/render/notice_test.go`:

```go
package render

import (
	"strings"
	"testing"
)

func TestDrawNoticeBoxAndOffset(t *testing.T) {
	g := NewGrid(60, 24)
	area := Rect{X: 0, Y: 0, W: 60, H: 24}
	DrawNotice(g, area, Notice{Title: "GRAVITY ANOMALY DETECTED", Subtitle: "LEVEL 08"}, NewPalette(ModeFull), GlyphsFor(ModeFull))
	out := g.PlainString()
	if !strings.Contains(out, "GRAVITY ANOMALY DETECTED") || !strings.Contains(out, "LEVEL 08") {
		t.Fatalf("notice missing its text:\n%s", out)
	}
	g2 := NewGrid(60, 24)
	DrawNotice(g2, area, Notice{Title: "T", Subtitle: "S", Offset: 3}, NewPalette(ModeFull), GlyphsFor(ModeFull))
	rowOf := func(g *Grid, s string) int {
		for y, row := range strings.Split(g.PlainString(), "\n") {
			if strings.Contains(row, s) {
				return y
			}
		}
		return -1
	}
	g3 := NewGrid(60, 24)
	DrawNotice(g3, area, Notice{Title: "T", Subtitle: "S"}, NewPalette(ModeFull), GlyphsFor(ModeFull))
	if rowOf(g2, "T") >= rowOf(g3, "T") {
		t.Fatal("a positive Offset must move the notice upward")
	}
}

func TestNoticeAndHUDStyleFlowThroughRender(t *testing.T) {
	in := baseInput(80, 30)
	in.Notice = Notice{Title: "GRAVITY ANOMALY DETECTED", Subtitle: "LEVEL 08"}
	if !strings.Contains(RenderGrid(in).PlainString(), "GRAVITY ANOMALY") {
		t.Fatal("Input.Notice must render")
	}
	st := NewPalette(ModeFull).Banner
	in.HUDStyle = &st
	if RenderGrid(in).PlainString() == "" {
		t.Fatal("HUDStyle must not break the frame")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run 'FourLine|Banner|Shock|Combo|Notice' -v; go test ./internal/render/ -run Notice -v`
Expected: FAIL — `undefined: TetrisBanners`, `undefined: DrawNotice`.

- [ ] **Step 3: Implement the spectacle and the two renderer additions**

Shockwave rings use the §24 glyph progression `· ○ ◌ ◯` with radius growing over `ShockwaveLife`, sampled around an ellipse with `x` scaled ×2 for cell aspect; skip when `ReducedMotion` or `snap.Tier == render.TierSmall`. The star density boost multiplies the layer budget by 1.6 for 900ms. `HUDStyle` returns a bright pulsing style while combo ≥ 4 or a four-line flash is live, and nil otherwise; `DrawStats`/`DrawMission` use it in place of `Palette.Value`/`Palette.Mission` when non-nil.

`DrawNotice` draws the §22 rounded box centred horizontally in `area` at row `area.Y + 4`, shifted up by `Offset`, clipped by `Grid.Set` if it runs off the top. The banner text comes from `TetrisBanners` via the FX RNG; the notice subtitle is `LEVEL %02d` most of the time and a random `LevelSubtitles` entry roughly one time in three. `Offset` grows from 0 to 2 over the second half of `NoticeDuration` so the box slides away (§22).

- [ ] **Step 4: Run the tests, regenerate goldens, and read the diff**

Run: `go test ./... -count=1` then `go test ./internal/render/ -update && git diff --stat internal/render/testdata`
Expected: tests PASS; the golden diff is empty (the new fields are zero in every existing case). If it is not empty, look at why before committing.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/fx internal/render
git commit -m "feat(fx): four-line spectacle, shockwaves, combo escalation, level-up notice"
```

---

### Task 10: Animated board border

**Files:**
- Create: `internal/fx/border.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/border_test.go`

**Interfaces:**
- Consumes: `Config.Palette`, event observation.
- Produces:
  ```go
  var BorderCycle = []string{"#6D28D9", "#22E4F7", "#D946EF", "#3B6BFF", "#F8FAFC"} // §25 palette
  const BorderCycleTime = 12 * time.Second // slow and subtle
  func (w *World) advanceBorder(dt time.Duration, snap Snapshot)
  // BorderStyle() blends the cycle position; energy events (clear, level up, tetris)
  // speed the cycle up briefly; the hard-drop flash from Task 6 still wins.
  ```
  ASCII/Reduced mode: pick the nearest cycle entry rather than blending.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"testing"
	"time"

	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

func TestBorderColorShiftsOverTime(t *testing.T) {
	w := testWorld(t, true)
	first := w.borderColorHex()
	w.Advance(BorderCycleTime/4, testSnapshot())
	if w.borderColorHex() == first {
		t.Fatal("the border color must shift over time (§25)")
	}
}

func TestBorderCycleIsSlowUnderNormalPlay(t *testing.T) {
	w := testWorld(t, true)
	first := w.borderPhase()
	w.Advance(100*time.Millisecond, testSnapshot())
	if delta := w.borderPhase() - first; delta > 0.05 {
		t.Fatalf("the border moved %.3f of its cycle in 100ms; §25 wants subtle", delta)
	}
}

func TestMajorEventAcceleratesTheBorder(t *testing.T) {
	calm := testWorld(t, true)
	calm.Advance(200*time.Millisecond, testSnapshot())

	hot := testWorld(t, true)
	hot.Observe([]game.Event{clearEvent(18, 19, 20, 21)}, testSnapshot())
	hot.Advance(200*time.Millisecond, testSnapshot())

	if hot.borderPhase() <= calm.borderPhase() {
		t.Fatal("a major event must run the gradient around the border rapidly (§25)")
	}
}

func TestBorderReturnsToCalm(t *testing.T) {
	w := testWorld(t, true)
	w.Observe([]game.Event{clearEvent(18, 19, 20, 21)}, testSnapshot())
	w.Advance(3*time.Second, testSnapshot())
	before := w.borderPhase()
	w.Advance(100*time.Millisecond, testSnapshot())
	if delta := w.borderPhase() - before; delta > 0.05 {
		t.Fatalf("the border must settle back to a slow cycle, moved %.3f", delta)
	}
}

func TestDisabledFXKeepsTheStaticPaletteBorder(t *testing.T) {
	w := testWorld(t, false)
	w.Advance(5*time.Second, testSnapshot())
	if w.BorderStyle() != nil {
		t.Fatal("--no-fx must leave the border to the palette (nil override)")
	}
}

func TestASCIIBorderUsesNoHexColor(t *testing.T) {
	w := worldWith(t, Config{Enabled: true, Mode: render.ModeASCII, Palette: render.NewPalette(render.ModeASCII)}, 2)
	w.Advance(time.Second, testSnapshot())
	if hex := w.borderColorHex(); len(hex) > 0 && hex[0] == '#' {
		t.Fatalf("ASCII mode must not emit a truecolor border: %s", hex)
	}
}
```

`borderPhase()` and `borderColorHex()` are unexported test seams.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run Border -v`
Expected: FAIL — `undefined: BorderCycle`.

- [ ] **Step 3: Implement `internal/fx/border.go`**

`borderPhase` advances by `dt / BorderCycleTime * energy`, where `energy` decays from ~14 back to 1 over about a second after a major event. Blend between adjacent `BorderCycle` entries with `lipgloss`'s color blending (or a manual RGB lerp) in Full mode; snap to the nearest entry in Reduced and ASCII.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v && go test ./... -count=1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/fx/border.go internal/fx/world.go internal/fx/border_test.go
git commit -m "feat(fx): board border as the game's energy state indicator"
```

---

### Task 11: Mission control

**Files:**
- Create: `internal/flavor/messages.go`
- Modify: `internal/fx/world.go`
- Test: `internal/flavor/messages_test.go`

**Interfaces:**
- Consumes: `game.Event` types only — `internal/flavor` must not import `internal/fx` or `internal/render`.
- Produces:
  ```go
  const (
      MinDwell = 2500 * time.Millisecond // §27: give messages time to breathe
      IdleHint = 20 * time.Second        // §45: "CAPTAIN?" before the first move
  )

  type Channel struct{ /* rng, current, dwell, lastScore, sawFirstMove */ }
  func NewChannel(rng *rand.Rand) *Channel
  func (c *Channel) Observe(evs []game.Event, level, combo, score int)
  func (c *Channel) Advance(dt time.Duration)
  func (c *Channel) Current() string
  ```
  The channel keeps the previous `score` so it can spot a rollover (§45) without the caller diffing for it.
  Pools, verbatim from the spec: the idle lines of §27 (`NOMINALISH`, `GRAVITY REMAINS MOSTLY LEGAL`, `STRUCTURAL VIBES: QUESTIONABLE`, `LOCAL UNIVERSE STABLE*`, `* DEFINITION OF STABLE UNDER REVIEW`, `MOON NOTIFIED`, `ORBITAL OSHA HAS ENTERED THE CHAT`, `WE HAVE EXCEEDED THE RECOMMENDED NUMBER OF BLOCKS`, `PHYSICS TEAM SAYS KEEP GOING`); the combo lines of §21 (`COMBO 5 // UNAUTHORIZED ORBITAL MANEUVER`, `COMBO 6 // STRUCTURAL REALITY FAILURE`, `COMBO 7 // NASA DENIES EVERYTHING`); and the §45 rarities (`DID YOU KNOW YOU'RE IN A TERMINAL?`, `NUMBER BECAME BIGGER`, `KINETIC ROD DEPLOYED` for a vertically hard-dropped `I`, `CUBE ADJACENT OBJECT SECURED` for holding an `O`, `CAPTAIN?` after a long idle).

- [ ] **Step 1: Write the failing test**

```go
package flavor

import (
	"math/rand/v2"
	"strings"
	"testing"
	"time"

	"cosmic-tetris/internal/game"
)

func newChannelForTest() *Channel {
	return NewChannel(rand.New(rand.NewPCG(7, 11)))
}

func TestChannelStartsWithSomething(t *testing.T) {
	if got := newChannelForTest().Current(); got == "" {
		t.Fatal("the channel must always have a line to show")
	}
}

func TestMessagesGetTimeToBreathe(t *testing.T) {
	c := newChannelForTest()
	c.Observe([]game.Event{game.LinesCleared{Count: 1, Rows: []int{21}}}, 1, 1, 100)
	first := c.Current()
	c.Advance(200 * time.Millisecond)
	c.Observe([]game.Event{game.PieceLocked{}}, 1, 0, 100)
	if c.Current() != first {
		t.Fatalf("a message must hold for %v before being replaced (§27)", MinDwell)
	}
	c.Advance(MinDwell)
	c.Observe([]game.Event{game.LevelChanged{Level: 3}}, 3, 0, 100)
	if c.Current() == first {
		t.Fatal("after the dwell time a new event must be able to speak")
	}
}

func TestBigComboSpeaksTheComboLine(t *testing.T) {
	c := newChannelForTest()
	c.Advance(MinDwell)
	c.Observe([]game.Event{game.ComboChanged{Combo: 5}}, 4, 5, 5000)
	if !strings.Contains(c.Current(), "COMBO 5") {
		t.Fatalf("Current = %q, want the §21 combo 5 line", c.Current())
	}
}

func TestKineticRodOnVerticalI(t *testing.T) {
	c := newChannelForTest()
	c.Advance(MinDwell)
	c.Observe([]game.Event{game.PieceHardDropped{Piece: game.Piece{Kind: game.KindI, Rotation: 1}, Distance: 12}}, 1, 0, 0)
	if !strings.Contains(c.Current(), "KINETIC ROD DEPLOYED") {
		t.Fatalf("Current = %q, want KINETIC ROD DEPLOYED (§45)", c.Current())
	}
}

func TestCubeAdjacentOnHoldingAnO(t *testing.T) {
	c := newChannelForTest()
	c.Advance(MinDwell)
	c.Observe([]game.Event{game.HoldUsed{Stored: game.KindO, Incoming: game.KindT}}, 1, 0, 0)
	if !strings.Contains(c.Current(), "CUBE ADJACENT OBJECT SECURED") {
		t.Fatalf("Current = %q, want CUBE ADJACENT OBJECT SECURED (§45)", c.Current())
	}
}

func TestScoreRolloverSaysNumberBecameBigger(t *testing.T) {
	c := newChannelForTest()
	c.Observe(nil, 1, 0, 940)
	c.Advance(MinDwell)
	// crossing a power-of-ten boundary in the running score
	c.Observe([]game.Event{game.LinesCleared{Count: 1, Rows: []int{21}, Score: 240}}, 1, 1, 1180)
	if !strings.Contains(c.Current(), "NUMBER BECAME BIGGER") {
		t.Fatalf("Current = %q, want NUMBER BECAME BIGGER on rollover (§45)", c.Current())
	}
}

func TestLongIdleAsksForTheCaptain(t *testing.T) {
	c := newChannelForTest()
	c.Advance(IdleHint + time.Second)
	if !strings.Contains(c.Current(), "CAPTAIN?") {
		t.Fatalf("Current = %q, want CAPTAIN? after %v of no input (§45)", c.Current(), IdleHint)
	}
	c2 := newChannelForTest()
	c2.Observe([]game.Event{game.PieceMoved{DX: 1}}, 1, 0, 0)
	c2.Advance(IdleHint + time.Second)
	if strings.Contains(c2.Current(), "CAPTAIN?") {
		t.Fatal("the idle hint is only for a player who has not moved yet (§45)")
	}
}

func TestIdleRotationIsNotConstant(t *testing.T) {
	c := newChannelForTest()
	changes := 0
	last := c.Current()
	for i := 0; i < 40; i++ { // 40 seconds of nothing happening
		c.Advance(time.Second)
		if c.Current() != last {
			changes++
			last = c.Current()
		}
	}
	if changes == 0 {
		t.Fatal("the channel should occasionally offer a new idle line")
	}
	if changes > 14 {
		t.Fatalf("changed %d times in 40s — §27 says do not rotate constantly", changes)
	}
}

func TestGameOverSpeaksTheCause(t *testing.T) {
	c := newChannelForTest()
	c.Advance(MinDwell)
	c.Observe([]game.Event{game.GameOver{Score: 100, Lines: 4, Level: 1}}, 1, 0, 100)
	if c.Current() != "CAUSE: EXCESSIVE GEOMETRY" {
		t.Fatalf("Current = %q, want the §28 cause line", c.Current())
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/flavor/ -v`
Expected: FAIL — `undefined: NewChannel`.

- [ ] **Step 3: Implement `internal/flavor/messages.go` and hook it into the world**

Priority order inside `Observe`: game over > combo ≥ 5 > level change > the §45 specials > line clear > lock. A candidate replaces the current line only when `dwell >= MinDwell`. Idle rotation picks a new line from the idle pool on a randomised 6–12 second timer. `GameOver` always yields the §28 cause line `CAUSE: EXCESSIVE GEOMETRY`, which Task 12 renders as the game-over card's subtitle. A score "rollover" is the running score crossing a power-of-ten boundary (940 → 1180 crosses 1000); `DID YOU KNOW YOU'RE IN A TERMINAL?` is extremely rare — roughly one idle rotation in fifty (§45).

In `internal/fx/world.go`: hold a `*flavor.Channel` built from the FX RNG, feed it in `Observe`/`Advance`, and return `c.Current()` from `World.Mission()`. With FX disabled, `Mission()` returns `NOMINALISH` so the HUD row is never empty in `--no-fx`, and `CAUSE: EXCESSIVE GEOMETRY` once `snap.Over` — the game-over card's subtitle should read the same with effects off.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./... -count=1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/flavor internal/fx/world.go
git commit -m "feat(flavor): mission control channel with cadence and rare lines"
```

---

### Task 12: Boot sequence and the game-over black hole

**Files:**
- Create: `internal/fx/collapse.go`
- Modify: `internal/fx/world.go`, `internal/app/update.go`, `internal/app/model.go`, `internal/render/layout.go` (add `PhaseCollapse`), `internal/render/render.go`, `internal/render/board.go` (add `BoardSprites`), `internal/render/overlay.go` (the card's cause subtitle)
- Test: `internal/fx/collapse_test.go`, `internal/app/phases_test.go`

**Interfaces:**
- Produces:
  ```go
  // internal/render
  const PhaseCollapse Phase = ... // appended to the enum; the board's own cells are not
                                  // drawn in this phase — only FX sprites.
  // The app needs the board as sprites to hand to the collapse:
  func BoardSprites(g *game.Game, inner Rect, p *Palette, gl Glyphs) []Sprite

  // internal/fx
  const (
      BootDuration     = 1000 * time.Millisecond // §29: about one second of drama
      CollapseFreeze   = 300 * time.Millisecond  // §28
      CollapseInfall   = 900 * time.Millisecond
      CollapseTotal    = 1300 * time.Millisecond
  )
  func (w *World) BootScreen() string // progressive §29 checklist; "" once done
  func (w *World) BootDone() bool
  func (w *World) SkipBoot()
  func (w *World) StartCollapse(snap Snapshot, cells []render.Sprite) // cells: the board as it stood
  func (w *World) CollapseDone() bool
  func (w *World) bootFinalLine() string // test seam: the last line revealed so far
  ```
  `app` starts in `render.PhaseBoot` when FX are enabled (skipped entirely with `--no-fx`), copies `w.BootScreen()` into `Input.BootScreen`, moves to `PhasePlaying` on `BootDone()` or any keypress (`SkipBoot`), and on a `game.GameOver` event enters `PhaseCollapse`, handing the world a snapshot of the currently drawn board cells; when `CollapseDone()` it moves to `PhaseGameOver` and shows the §28 card.

- [ ] **Step 1: Write the failing test**

```go
package fx

import (
	"strings"
	"testing"
	"time"

	"cosmic-tetris/internal/render"
)

func TestBootSequenceProgressesAndFinishes(t *testing.T) {
	w := testWorld(t, true)
	first := w.BootScreen()
	if !strings.Contains(first, "C O S M I C") {
		t.Fatalf("boot screen = %q, want the §29 title", first)
	}
	w.Advance(BootDuration/2, testSnapshot())
	mid := w.BootScreen()
	if mid == first {
		t.Fatal("the boot checklist must fill in over time (§29)")
	}
	if !strings.Contains(mid, "gravity") {
		t.Fatalf("boot screen = %q, want the gravity check line", mid)
	}
	w.Advance(BootDuration, testSnapshot())
	if !w.BootDone() {
		t.Fatalf("boot must finish within about %v", BootDuration)
	}
	if !strings.Contains(w.bootFinalLine(), "UNIVERSE ONLINE") {
		t.Fatal("boot must end with UNIVERSE ONLINE (§29)")
	}
}

func TestSkipBootIsImmediate(t *testing.T) {
	w := testWorld(t, true)
	w.SkipBoot()
	if !w.BootDone() {
		t.Fatal("any key must skip the boot sequence (§29)")
	}
}

func TestNoFXSkipsBootEntirely(t *testing.T) {
	w := testWorld(t, false)
	if !w.BootDone() {
		t.Fatal("--no-fx starts straight in the game")
	}
}

func TestCollapseTimelineEndsWithABlackHole(t *testing.T) {
	w := testWorld(t, true)
	cells := []render.Sprite{{X: 20, Y: 10, Glyph: '█'}, {X: 22, Y: 12, Glyph: '█'}}
	w.StartCollapse(testSnapshot(), cells)

	if !strings.Contains(w.Banner(), "SIGNAL LOST") {
		t.Fatalf("Banner = %q, want SIGNAL LOST in the freeze phase (§28)", w.Banner())
	}
	frozen := w.BoardFX()
	w.Advance(CollapseFreeze/2, testSnapshot())
	for i := range frozen {
		if i < len(w.BoardFX()) && frozen[i] != w.BoardFX()[i] {
			t.Fatal("everything freezes for the first 300ms (§28)")
		}
	}

	w.Advance(CollapseFreeze+100*time.Millisecond, testSnapshot())
	board := w.boardRect()
	cx, cy := board.X+board.W/2, board.Y+board.H/2
	distBefore := spriteDistance(w.BoardFX(), cx, cy)
	w.Advance(300*time.Millisecond, testSnapshot())
	if spriteDistance(w.BoardFX(), cx, cy) >= distBefore {
		t.Fatal("blocks must fall inward toward the center (§28)")
	}

	w.Advance(CollapseTotal, testSnapshot())
	if !w.CollapseDone() {
		t.Fatalf("the collapse must finish by %v", CollapseTotal)
	}
}

func TestCollapseSpritesStayInsideTheBoard(t *testing.T) {
	w := testWorld(t, true)
	var cells []render.Sprite
	board := w.boardRect()
	for y := board.Y; y < board.Y+board.H; y++ {
		cells = append(cells, render.Sprite{X: board.X, Y: y, Glyph: '█'})
	}
	w.StartCollapse(testSnapshot(), cells)
	for i := 0; i < 100; i++ {
		w.Advance(16*time.Millisecond, testSnapshot())
		for _, s := range w.BoardFX() {
			if !board.Contains(s.X, s.Y) {
				t.Fatalf("collapse sprite %+v escaped the board %+v", s, board)
			}
		}
	}
}

func spriteDistance(ss []render.Sprite, cx, cy int) float64 {
	sum := 0.0
	for _, s := range ss {
		dx, dy := float64(s.X-cx), float64(s.Y-cy)
		sum += dx*dx + dy*dy
	}
	return sum
}
```

And in `internal/app/phases_test.go`:

```go
package app

import (
	"strings"
	"testing"

	tea "charm.land/bubbletea/v2"
	"cosmic-tetris/internal/render"
)

func TestBootPhaseThenPlay(t *testing.T) {
	m := fxModel(t, true)
	if m.State != render.PhaseBoot {
		t.Fatalf("State = %v, want PhaseBoot with FX on (§29)", m.State)
	}
	if !strings.Contains(render.RenderGrid(m.renderInput()).PlainString(), "C O S M I C") {
		t.Fatal("the boot screen must render")
	}
	m = advance(t, m, 80) // ~1.3s
	if m.State != render.PhasePlaying {
		t.Fatalf("State = %v, want PhasePlaying after boot", m.State)
	}
}

func TestAnyKeySkipsBoot(t *testing.T) {
	m := fxModel(t, true)
	m = press(t, m, 'k', "k")
	if m.State != render.PhasePlaying {
		t.Fatal("any key must skip the boot sequence (§29)")
	}
}

func TestNoFXStartsPlaying(t *testing.T) {
	if got := fxModel(t, false).State; got != render.PhasePlaying {
		t.Fatalf("State = %v with --no-fx, want PhasePlaying", got)
	}
}

func TestGameOverGoesThroughTheCollapse(t *testing.T) {
	m := fxModel(t, true)
	m = press(t, m, 'k', "k") // skip boot
	for i := 0; i < 400 && !m.Game.Over(); i++ {
		m = press(t, m, tea.KeySpace, " ")
	}
	m = advance(t, m, 1)
	if m.State != render.PhaseCollapse {
		t.Fatalf("State = %v, want PhaseCollapse (§28)", m.State)
	}
	out := render.RenderGrid(m.renderInput()).PlainString()
	if !strings.Contains(out, "SIGNAL LOST") {
		t.Fatalf("the collapse must show SIGNAL LOST:\n%s", out)
	}
	if strings.Contains(out, "UNIVERSE EXPIRED") {
		t.Fatal("the card must not appear until the collapse finishes (§28)")
	}
	m = advance(t, m, 120) // ~1.9s
	if m.State != render.PhaseGameOver {
		t.Fatalf("State = %v, want PhaseGameOver after the collapse", m.State)
	}
	card := render.RenderGrid(m.renderInput()).PlainString()
	if !strings.Contains(card, "UNIVERSE EXPIRED") {
		t.Fatal("the §28 card must appear at the end")
	}
	if !strings.Contains(card, "CAUSE: EXCESSIVE GEOMETRY") {
		t.Fatalf("the card must carry the §28 cause subtitle:\n%s", card)
	}
	m = press(t, m, 'r', "r")
	if m.State != render.PhasePlaying {
		t.Fatal("r must reboot the universe straight into play")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run 'Boot|Collapse' -v; go test ./internal/app/ -run 'Boot|Phase|Collapse' -v`
Expected: FAIL — `undefined: BootDuration`, `undefined: PhaseCollapse`.

- [ ] **Step 3: Implement the boot and collapse phases**

Boot text is the §29 block verbatim (`✦`, `C O S M I C`, `T E T R I S`, `INITIALIZING LOCAL UNIVERSE...`, `gravity ........ OK`, `spacetime ...... OK`, `tetrominoes .... QUESTIONABLE`, then `UNIVERSE ONLINE`), revealed line by line across `BootDuration`, with a `bubbles/spinner` frame on the `INITIALIZING LOCAL UNIVERSE...` line (§3 allows Bubbles for exactly this). The collapse converts the handed-in board cells into particles whose velocity points at the board center with magnitude proportional to distance, clamped so nothing overshoots outside the board; the banner reads `SIGNAL LOST` during the freeze; at `CollapseInfall` it swaps to the §28 black-hole glyph art centred in the board and holds until `CollapseTotal`. `RenderGrid` skips `DrawLockedCells`/`DrawGhost`/`DrawActive` in `PhaseCollapse` so the board really does dissolve.

In `internal/render`: the game-over card gains one line — `in.Mission` drawn as its subtitle, which is where §28's `CAUSE: EXCESSIVE GEOMETRY` lands (Task 11 makes that the game-over mission line).

In `internal/app`: with FX disabled, keep Plan 2's behavior — game over goes straight to `PhaseGameOver`, no boot, no collapse — so Plan 2's own tests keep passing unchanged.

- [ ] **Step 4: Run the tests, regenerate goldens, read the diff**

Run: `go test ./... -count=1 && go test ./internal/render/ -update && git diff internal/render/testdata`
Expected: PASS. Exactly one existing golden changes — `gameover.golden` gains the mission subtitle row inside the card. Read that diff and confirm the card still fits its box; every other case is untouched.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/fx internal/app internal/render
git commit -m "feat(fx): boot sequence and game-over black-hole collapse"
```

---

### Task 13: Acceptance pass — the coolness test and the definition of done

**Files:**
- Create: `internal/render/fx_golden_test.go`, `internal/app/restraint_test.go`
- Modify: `README.md`
- Test: as above, plus a manual play session

**Interfaces:**
- Consumes: everything.
- Produces: two golden snapshots with FX populated (`fx_wide`, `fx_ascii`) proving effects composite without corrupting the board, an input-latency test for §44, and a README that documents the flags and modes.

- [ ] **Step 1: Write the failing test**

```go
package render

import (
	"strings"
	"testing"
)

func fxInput(w, h int, mode Mode) Input {
	in := goldenInput(w, h)
	in.Mode = mode
	st := NewPalette(mode).Banner
	in.Stars = []Sprite{{X: 2, Y: 2, Glyph: '·'}, {X: 70, Y: 20, Glyph: '✦'}}
	in.BoardFX = []Sprite{{X: Compute(w, h).Inner.X, Y: Compute(w, h).Inner.Y, Glyph: '▓'}}
	in.GlobalFX = []Sprite{{X: 60, Y: 6, Glyph: '*'}}
	in.Banner = "✦ EVENT HORIZON ✦"
	in.Notice = Notice{Title: "GRAVITY ANOMALY DETECTED", Subtitle: "LEVEL 08"}
	in.Shake = Rect{X: 1, Y: 0}
	in.BorderStyle = &st
	in.HUDStyle = &st
	return in
}

func TestFXGoldenLayouts(t *testing.T) {
	for _, c := range []struct {
		name string
		in   Input
	}{
		{"fx_wide", fxInput(80, 30, ModeFull)},
		{"fx_ascii", fxInput(80, 30, ModeASCII)},
	} {
		t.Run(c.name, func(t *testing.T) {
			assertGolden(t, c.name, RenderGrid(c.in).PlainString())
		})
	}
}

func TestFXNeverChangesTheFrameSize(t *testing.T) {
	for w := MinCols; w <= 100; w += 4 {
		for h := MinRows; h <= 45; h += 4 {
			g := RenderGrid(fxInput(w, h, ModeFull))
			if g.W != w || g.H != h {
				t.Fatalf("%dx%d: FX changed the frame to %dx%d", w, h, g.W, g.H)
			}
			for _, row := range strings.Split(g.PlainString(), "\n") {
				if len([]rune(row)) > w {
					t.Fatalf("%dx%d: FX pushed a row past the width: %q", w, h, row)
				}
			}
		}
	}
}

func TestASCIIModeWithFXStaysASCIIish(t *testing.T) {
	out := RenderGrid(fxInput(80, 30, ModeASCII)).PlainString()
	if strings.Contains(out, "██") || strings.Contains(out, "╔") {
		t.Fatalf("ASCII mode leaked Unicode board glyphs with FX on:\n%s", out)
	}
}
```

And `internal/app/restraint_test.go` — §44's "never make controls lag", as a test rather than a hope:

```go
package app

import (
	"testing"

	tea "charm.land/bubbletea/v2"
)

func TestInputIsHandledWhileEffectsAreLive(t *testing.T) {
	m := fxModel(t, true)
	m = press(t, m, 'k', "k") // skip boot
	// Fill the well and clear four rows at once to light every effect at once.
	for i := 0; i < 40 && m.Game.Lines == 0; i++ {
		m = press(t, m, tea.KeySpace, " ")
		m = advance(t, m, 1)
	}
	x := m.Game.Active.X
	m = press(t, m, tea.KeyLeft, "")
	if m.Game.Active.X != x-1 {
		t.Fatal("a keypress during effects must move the piece on the same update (§44)")
	}
	before := m.Game.Score
	m = press(t, m, tea.KeySpace, " ")
	if m.Game.Score == before {
		t.Fatal("a hard drop during effects must still score immediately (§44)")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run FX -v; go test ./internal/app/ -run Restraint -v`
Expected: FAIL — missing `testdata/fx_wide.golden`.

(The app test is named `TestInputIsHandledWhileEffectsAreLive`; run it with `go test ./internal/app/ -run Input -v` and expect it to pass immediately if the frame loop is already correct — if it fails, the fix belongs in `Update`, not the test.)

- [ ] **Step 3: Generate the goldens, read them, and update the README**

Run: `go test ./internal/render/ -update`, then read `testdata/fx_wide.golden` and `testdata/fx_ascii.golden`: the board interior must still be recognisable, the banner and notice must not sit on top of the active piece, and no HUD text may land inside the board (§44).

README: add the modes and flags table (`--ascii`, `--no-fx`, `--reduced-motion`, `--seed`), a line on the two-RNG guarantee, and one on which effects each flag suppresses.

- [ ] **Step 4: Verify against §43 and §47 by playing it**

Run: `go vet ./... && go test ./... -count=1 && go run ./cmd/cosmic-tetris`

Walk the §43 coolness acceptance test and check each item off out loud:
- within 30 seconds of play: moving starfield, animated board border, piece trails, hard-drop impact, particles, mission-control commentary;
- on the first completed line: supernova clear animation, debris, border reaction;
- on a four-line clear: banner, hyperdrive, shockwave, eruption, HUD flash — the "LOL WHAT THE FUCK" reaction is the actual requirement.

Then walk §47's definition of done: playable start to game over, immediate controls, live resize, hold, ghost, next queue, deterministic piece generation (`--seed 8675309` twice gives the same pieces), isolated RNGs, correct clearing, rising gravity, pause, restart, ASCII fallback, `--no-fx`, engine unit tests, renderer snapshots, no visible flicker, animations never blocking input, FX never modifying game state, glorious four-line clears, the black-hole game over, fun with effects off and much funnier with them on.

Note anything that fails and fix it before committing; that is the point of this step.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/render/fx_golden_test.go internal/render/testdata internal/app/restraint_test.go README.md
git commit -m "test(render): FX composite goldens; docs: modes and flags"
```
