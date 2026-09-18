# Cosmic Tetris — Plan 3: Cosmic Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `internal/fx` as an independent spectacle simulation and wire it into the renderer: particle physics, three-layer starfield, energy-reactive animated board border, piece ion trails, and the `internal/flavor` mission-control channel.

**Architecture:** `GameState → events → FXWorld → Renderer`, one direction only. `fx` imports `game` for event and piece types and never imports `render` or `app`; `render` imports `fx` to draw it. `fx.World` holds its own `*rand.Rand`, seeded separately from the game, so particle randomness can never shift piece order. `Observe` takes events plus a read-only `GameView` value — the FX package never holds a `*game.Game`, which makes §14's "may never modify GameState" structural rather than a promise.

**Tech Stack:** Go 1.26, `charm.land/lipgloss/v2`, `charm.land/bubbletea/v2`, standard library `math`/`math/rand`.

**Spec:** `design.md` (§9 quantum storage, §14, §15, §17, §23, §25, §26, §27, §32 reduced modes, §33, §35, §37, §38, §42 Phase 3, §44, §49.6)

## Global Constraints

- Language: Go. Module `cosmic-tetris`, `go 1.26`.
- `internal/fx` must not import `internal/render`, `internal/app`, or `internal/flavor`; it may import `internal/game`. `internal/flavor` may import `internal/game` and `internal/fx`.
- FX may observe game events and never modify game state (§14, §44).
- Game RNG and FX RNG are separate `*rand.Rand` instances and never share (§35, §49.6).
- No goroutine per particle or per frame; no filesystem work during gameplay; no synchronous logging per frame (§38).
- A few hundred particles must be trivial; reuse slices (§38). Hard cap `MaxParticles = 400`.
- Effects never obscure the active piece, never delay gameplay, never alter it (§44).
- Board readability is sacred: the background must never make the board harder to read (§15, §21).
- ASCII mode emits only ASCII runes (§32). Every FX glyph needs an ASCII fallback.

## Review Focus

1. FX enabled versus disabled changing the game outcome — the same input script must produce an identical board, score and next queue either way (Task 2).
2. A resize while thousands of particle-seconds of state exist — off-screen stars and particles must be culled or re-seeded with no index panic (Task 3, Task 4).
3. An event burst in a single frame (lock + 4 lines + combo + level, ten events at once) — the mission line must show one message and hold it, not thrash (Task 7).
4. A long session (ten simulated minutes) — star, particle and trail slices must stay bounded (Task 1, Task 8).
5. Background versus foreground legibility — no star, particle or trail may replace a locked cell or an active-piece cell in the rendered output (Task 4, Task 6).

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
| `internal/fx/particle.go` | `Particle`, the §23 integrator, spawn caps |
| `internal/fx/events.go` | `GameView`, event→FX reaction table, `Energy` |
| `internal/fx/world.go` | `World`: state, `Step`, `Observe`, `Resize`, FX RNG |
| `internal/fx/starfield.go` | `Star`, three layers, density, drift, wrap, level speed |
| `internal/fx/trail.go` | `Trail`: short-lived ion trails behind moving pieces; `Quantum`: the §9 hold effect |
| `internal/render/fx.go` | draw stars / particles / trails; `ASCIISafe` |
| `internal/render/border.go` | energy-reactive animated border colour |
| `internal/flavor/messages.go` | the message tables and event→category mapping |
| `internal/flavor/channel.go` | `Channel`: one line at a time, with hold and idle timers |

`internal/fx/trail.go`, `internal/render/fx.go`, `internal/render/border.go` and `internal/flavor/channel.go` are additions to §33's file list, each a distinct responsibility inside a package §33 already names.

---

### Task 1: Particle and the terminal-space integrator

**Files:**
- Create: `internal/fx/particle.go`
- Test: `internal/fx/particle_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
```go
type Class int
const (ClassStar Class = iota; ClassDebris; ClassSpark; ClassEmber)

type Particle struct {
    X, Y       float64   // canvas cell coordinates (column, row), fractional
    VX, VY     float64   // cells per second
    AX, AY     float64   // cells per second squared
    Life       float64   // seconds remaining
    MaxLife    float64   // seconds
    Glyph      rune
    Brightness float64   // 0..1
    Class      Class
}

const (
    ParticleGravity = 14.0   // cells/s² downward, the default AY for debris
    ParticleDrag    = 0.05   // fraction of velocity surviving one second
    MaxParticles    = 400
)

func (p *Particle) Step(dt float64)
func (p Particle) Alive(w, h int) bool   // Life > 0 and inside the viewport with a 2-cell margin
func (p Particle) Fade() float64         // Life / MaxLife, clamped 0..1
```

Integration order is §23's, exactly: `position += velocity × dt`, then `velocity += acceleration × dt`, then `velocity *= pow(ParticleDrag, dt)`, then `life -= dt`. No collision detection.

- [ ] **Step 1: Write the failing tests**

```go
func TestStepIntegratesPositionBeforeDrag(t *testing.T)
// p := Particle{VX:10, Life:2, MaxLife:2}; p.Step(1.0)
// => p.X == 10 (position used the pre-drag velocity)
// => p.VX == 10*ParticleDrag (0.5), within 1e-9
// => p.Life == 1

func TestGravityAccelerates(t *testing.T)
// p := Particle{AY: ParticleGravity, Life:2, MaxLife:2}; p.Step(1.0)
// => p.VY == ParticleGravity*ParticleDrag, within 1e-9; p.Y == 0

func TestDeadWhenLifeRunsOut(t *testing.T)
// Life 0.5, Step(0.5) => !Alive(80,24)

func TestDeadWhenOutsideViewport(t *testing.T)
// Particle{X:-5, Life:1, MaxLife:1}.Alive(80,24) == false
// Particle{X:200, ...}, Particle{Y:-5, ...}, Particle{Y:100, ...} all false
// Particle{X:0, Y:0, ...} true (edge cells count as inside)

func TestFadeIsNormalised(t *testing.T)
// Life 1, MaxLife 2 => Fade() == 0.5; Life 3, MaxLife 2 => 1; Life -1 => 0
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -v`
Expected: FAIL — package does not exist.

- [ ] **Step 3: Implement `internal/fx/particle.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/particle.go internal/fx/particle_test.go
git commit -m "feat(fx): terminal-space particle integrator"
```

---

### Task 2: FXWorld, event observation and engine isolation

**Files:**
- Create: `internal/fx/world.go`, `internal/fx/events.go`
- Test: `internal/fx/world_test.go`, `internal/fx/isolation_test.go`

**Interfaces:**
- Consumes: Task 1; `game.Event`, `game.EventKind`, `game.Piece`.
- Produces:
```go
type Options struct {
    Enabled       bool
    ReducedMotion bool
}

type GameView struct {
    Level, Combo, Score, Lines int
    Active                     game.Piece
    Over                       bool
}
func ViewOf(g *game.Game) GameView    // the only bridge; copies values, keeps no pointer

type World struct {
    Opts      Options
    W, H      int
    Stars     []Star
    Particles []Particle
    Trails    []Trail
    Energy    float64          // 0..1, the board border's "energy state"
    Elapsed   time.Duration
    View      GameView
    // unexported: rng *rand.Rand
}

func NewWorld(seed int64, w, h int, o Options) *World
func (w *World) Resize(width, height int)
func (w *World) Step(dt time.Duration)
func (w *World) Observe(evs []game.Event, v GameView)
func (w *World) Spawn(p Particle)          // drops the oldest particle when at MaxParticles
func (w *World) Rand() *rand.Rand          // FX RNG, for FX use only

const (
    EnergyDecayPerSecond = 0.55   // multiplicative survival fraction per second
)
var EnergyBump = map[game.EventKind]float64{   // added on each event, Energy clamped to 1
    game.PieceLocked:      0.10,
    game.PieceHardDropped: 0.25,
    game.LinesCleared:     0.30,   // × line count
    game.LevelChanged:     0.50,
    game.ComboChanged:     0.10,   // × combo
    game.HoldUsed:         0.08,
}
```

`Step` advances `Elapsed`, decays `Energy`, steps the starfield, steps and compacts particles in place (filter without reallocating), and ages trails. `Observe` records `v` into `w.View`, bumps `Energy`, and dispatches to per-event reactions (Task 6 adds trails; Plan 4 adds the rest). When `Opts.Enabled` is false, `Observe` returns immediately and `Step` only advances `Elapsed`.

- [ ] **Step 1: Write the failing tests**

```go
func TestNewWorldSeedsStarsAndNothingElse(t *testing.T)
// w := NewWorld(7, 80, 24, Options{Enabled:true})
// len(w.Stars) == StarCount(80,24); len(w.Particles) == 0; w.Energy == 0

func TestFXDisabledWorldStaysEmpty(t *testing.T)
// Options{Enabled:false}: len(Stars)==0; Observe(lots of events) leaves Particles empty
// and Energy at 0; Step(1s) still advances Elapsed

func TestEnergyBumpsAndDecays(t *testing.T)
// Observe([]game.Event{{Kind: game.LinesCleared, Count: 2}}, GameView{Level:1})
// => Energy == 0.60 (0.30 × 2), within 1e-9
// Step(1s) => Energy == 0.60 * EnergyDecayPerSecond
// a 4-line clear at Energy 0.9 clamps to 1.0, never above

func TestSpawnRespectsTheCap(t *testing.T)
// Spawn MaxParticles+50 particles => len(Particles) == MaxParticles and the
// most recently spawned particle is present

func TestStepCullsDeadParticles(t *testing.T)
// spawn 10 with Life 0.1 and 10 with Life 5 => Step(200ms) leaves exactly 10

func TestResizeKeepsStarsInsideTheViewport(t *testing.T)
// w := NewWorld(7,120,40,...); Step a few seconds; w.Resize(40,24)
// => len(Stars)==StarCount(40,24) and every star has 0<=X<40, 0<=Y<24
// Resize(0,0) then Step(1s) does not panic; Resize back to 80x24 re-seeds stars

func TestLongSessionStaysBounded(t *testing.T)
// 10 simulated minutes at 16ms steps with an event every 10 frames:
// len(Particles) <= MaxParticles, len(Stars) == StarCount, len(Trails) <= 64 throughout
```

```go
func TestObserveNeverTouchesGameState(t *testing.T)
// g := game.New(99); before := fingerprint(g) (board string + score/lines/level/combo/active/next)
// evs := g.HardDrop(); w.Observe(evs, ViewOf(g)); w.Step(16ms)
// => fingerprint(g) equals the value taken right after HardDrop

func TestFXDoesNotChangeTheGameOutcome(t *testing.T)
// run the same canned (key, dt) script twice through app-free helpers:
// once with a World{Enabled:true} observing every event, once with Enabled:false,
// both games seeded game.New(8675309)
// => identical Board.String(), Score, Lines, Level, Combo, Next

func TestFXRNGIsIndependentOfTheGameRNG(t *testing.T)
// two Worlds with the same fx seed observing the event streams of two *different*
// game seeds produce the same number of Rand() draws for the same event sequence;
// and two Worlds with different fx seeds over the same event stream differ
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -v`
Expected: FAIL — undefined `NewWorld`.

- [ ] **Step 3: Implement `world.go` and `events.go`**

`StarCount` and `Star` land in Task 3; stub them minimally here (or land Task 3 first if the reviewer prefers) — the `world_test.go` assertions above reference `StarCount`, so implement `starfield.go`'s `StarCount`/`Star`/seed helper as part of this task and leave drift to Task 3.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/world.go internal/fx/events.go internal/fx/world_test.go internal/fx/isolation_test.go
git commit -m "feat(fx): FX world, event observation, energy and engine isolation"
```

---

### Task 3: Three-layer starfield

**Files:**
- Create: `internal/fx/starfield.go` (completing Task 2's stub)
- Test: `internal/fx/starfield_test.go`

**Interfaces:**
- Consumes: Task 2's `World`.
- Produces:
```go
type Star struct {
    X, Y   float64
    Layer  int      // 0 far, 1 mid, 2 near
    Glyph  rune
    Bright float64  // 0..1
}

var LayerSpeeds  = [3]float64{0.8, 2.0, 5.0}                      // cells/s at level 1
var LayerGlyphs  = [3][]rune{{'.'}, {'·', '˚'}, {'✦', '✧', '*'}}  // §15
var LayerBright  = [3]float64{0.30, 0.60, 1.0}
var LayerWeights = [3]float64{0.55, 0.30, 0.15}                   // share of the star budget

func StarCount(w, h int) int            // (w*h)/45, floored at 12, capped at 240
func SpeedForLevel(level int) float64   // 1 + 0.06*(level-1), capped at 2.5
func (w *World) StarSpeed() float64     // SpeedForLevel(w.View.Level); Plan 4 multiplies in hyperdrive
func (w *World) stepStars(dt float64)
func (w *World) seedStars()
```

Stars drift downward (§15). A star leaving the bottom wraps to `Y -= float64(h)` with a fresh random `X` and glyph, so the population is constant.

- [ ] **Step 1: Write the failing tests**

```go
func TestStarCountScalesWithArea(t *testing.T)
// StarCount(80,24) == 42; StarCount(10,2) == 12 (floor); StarCount(400,100) == 240 (cap)

func TestLayerDistribution(t *testing.T)
// a seeded 80x24 world has at least one star in each of the three layers, and
// layer 0 is the most populous

func TestStarsDriftDownward(t *testing.T)
// record every star's Y, Step(500ms), assert every star moved down by
// LayerSpeeds[layer]*0.5*SpeedForLevel(1) or wrapped

func TestStarsWrapInsteadOfDisappearing(t *testing.T)
// Step(60s) => len(Stars) unchanged and every star is inside the viewport

func TestHigherLevelMovesStarsFaster(t *testing.T)
// SpeedForLevel(1) == 1.0; SpeedForLevel(7) == 1.36 within 1e-9; SpeedForLevel(40) == 2.5
// a level-10 world displaces its stars strictly further than a level-1 world
// over the same 500ms, from the same fx seed

func TestReducedMotionKeepsStarsDrifting(t *testing.T)
// Options{Enabled:true, ReducedMotion:true}: stars still move (only hyperdrive,
// shake and shockwaves are suppressed, §49.5)

func TestStarGlyphsComeFromTheLayerTables(t *testing.T)
// every star's Glyph is in LayerGlyphs[star.Layer]
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run TestStar -v`
Expected: FAIL — undefined `LayerSpeeds`.

- [ ] **Step 3: Implement `internal/fx/starfield.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/starfield.go internal/fx/starfield_test.go
git commit -m "feat(fx): three-layer starfield with level-scaled drift"
```

---

### Task 4: Render the starfield and particles

**Files:**
- Create: `internal/render/fx.go`
- Modify: `internal/render/render.go` (add `FX *fx.World` to `Snapshot`, insert §37 steps 2, 6 and 9), `internal/render/board.go` (leave empty board cells unset so space shows through)
- Test: `internal/render/fx_test.go`, `internal/render/golden_test.go`

**Interfaces:**
- Consumes: Plan 2's `Canvas`, `Layout`, `Options`, `Paint`; Tasks 1–3.
- Produces:
```go
func DrawStarfield(c *Canvas, l Layout, w *fx.World, o Options)
func DrawParticles(c *Canvas, l Layout, w *fx.World, o Options)
func ASCIISafe(r rune) rune
func StarPaint(s fx.Star, insideBoard bool, m Mode) Paint
func ParticlePaint(p fx.Particle, m Mode) Paint
```

Rules:
- Starfield draws first, across the whole canvas, into unset cells only — it never overwrites anything already drawn, and the board draws after it.
- Inside `l.Board`, only layers 0 and 1 are drawn and brightness is halved, so the board stays the most readable thing on screen (§15, §21). Stars inside the board align to even columns so they never split a 2-column cell.
- `DrawLocked` leaves empty board cells unset (previously blank), which is what lets space show through the playfield as in §4.
- Particles draw after the board (§37 step 6 board-local, step 9 global), also into unset cells only, except `ClassDebris`, which may overwrite empty board cells but never a cell holding a block or ghost glyph.
- `ASCIISafe` maps every non-ASCII glyph this project emits to an ASCII stand-in: `✦→*  ✧→+  ˚→'  ·→.  ░→:  ▒→;  ▓→#  █→#  ○→o  ◌→o  ◯→O  ●→@  ☄→>  ✪→*`. `ModeASCII` routes every glyph through it.
- When `o.FXEnabled` is false or `s.FX` is nil, both draw functions return immediately.

- [ ] **Step 1: Write the failing tests**

```go
func TestStarfieldDrawsIntoEmptySpace(t *testing.T)
// canvas at a wide layout, DrawStarfield with a seeded world
// => the number of non-blank cells is > 0 and <= len(w.Stars)

func TestStarfieldNeverOverwritesLockedCells(t *testing.T)
// fill board rows 18..21, draw stars, then locked, then stars again in that order:
// every cell of the bottom four board rows holds a block glyph, never a star glyph

func TestStarfieldNeverOverwritesTheActivePiece(t *testing.T)
// after the full pipeline, every cell of Active.Cells() renders BlockGlyph

func TestStarsInsideTheBoardAreDimAndNear(t *testing.T)
// every star drawn within l.Board has Layer <= 1 and an even column offset from l.Board.X

func TestParticlesDrawAfterTheBoard(t *testing.T)
// a ClassDebris particle placed over an empty board cell appears in the output;
// one placed over a locked cell does not

func TestASCIISafeCoversEveryGlyphWeEmit(t *testing.T)
// for every rune in LayerGlyphs, the debris glyph set, the ghost/block glyphs and BoxChars:
// ASCIISafe(r) < 128

func TestFXDisabledRendersExactlyLikePlanTwo(t *testing.T)
// Render with Options{FXEnabled:false} and a non-nil World produces output identical
// to Render with FX nil — assert against testdata/wide.txt

func TestRenderWithFXIsDeterministic(t *testing.T)
// same world (fx seed 4242, stepped 30 frames of 16ms) rendered twice => identical strings

func TestGoldenWideWithStarfield(t *testing.T)
// 100x40, fx seed 4242, 30 frames stepped, ModeFull => testdata/wide-fx.txt
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestStarfield|TestStars|TestParticles|TestASCII|TestFXDisabled|TestRenderWithFX' -v`
Expected: FAIL — undefined `DrawStarfield`.

- [ ] **Step 3: Implement `internal/render/fx.go` and the `render.go` / `board.go` changes**

- [ ] **Step 4: Create the new golden and run everything**

Run: `go test ./internal/render/ -run TestGolden -update && go test ./... -v`
Expected: PASS. Read `testdata/wide-fx.txt` and confirm the board is still legible with stars behind it.

- [ ] **Step 5: Commit**

```bash
git add internal/render/fx.go internal/render/render.go internal/render/board.go internal/render/fx_test.go internal/render/golden_test.go internal/render/testdata
git commit -m "feat(render): composite starfield and particles behind the board"
```

---

### Task 5: Animated board border

**Files:**
- Create: `internal/render/border.go`
- Modify: `internal/render/board.go` (`DrawBoardBorder` gains `elapsed` and `energy` parameters and colours each border cell through `BorderPaintAt`, replacing Plan 2's single `Paint` argument; update its callers)
- Test: `internal/render/border_test.go`

**Interfaces:**
- Consumes: Plan 2's `BorderPalette`, `BoxChars`, `Paint`.
- Produces:
```go
func BorderPaintAt(elapsed time.Duration, energy float64, i, n int, m Mode) Paint
func DrawBoardBorder(c *Canvas, l Layout, o Options, elapsed time.Duration, energy float64)
const BorderCyclePeriod = 12 * time.Second   // calm palette drift (§25: "the shift should be subtle")
```

`BorderPaintAt` colours border cell `i` of `n`, walking the box clockwise from the top-left. Phase is `elapsed/BorderCyclePeriod + energy*elapsed/(1.5s)`, plus a per-cell offset of `energy × i/n` — so at rest the whole border is one slowly drifting colour, and at high energy a gradient visibly travels around it (§25). Colours are linear RGB interpolations between adjacent `BorderPalette` entries, parsed once at init.

- [ ] **Step 1: Write the failing tests**

```go
func TestBorderColourDriftsOverTime(t *testing.T)
// BorderPaintAt(0,0,0,84,ModeFull).FG != BorderPaintAt(6*time.Second,0,0,84,ModeFull).FG

func TestBorderIsUniformAtRest(t *testing.T)
// energy 0: BorderPaintAt(t,0,i,84,...) is the same colour for i = 0, 20, 40, 83

func TestHighEnergyMakesAGradient(t *testing.T)
// energy 1: at least 8 distinct colours appear across i = 0..83

func TestBorderCycleIsPeriodic(t *testing.T)
// BorderPaintAt(0,0,0,84,...) == BorderPaintAt(BorderCyclePeriod,0,0,84,...)

func TestBorderColoursStayInThePalette(t *testing.T)
// every colour produced over a 12s sweep lies on a segment between two adjacent
// BorderPalette entries (each channel within [min,max] of that pair)

func TestASCIIBorderUsesASCIIBoxChars(t *testing.T)
// DrawBoardBorder in ModeASCII: every rune of the border rows is < 128
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run TestBorder -v`
Expected: FAIL — undefined `BorderPaintAt`.

- [ ] **Step 3: Implement `internal/render/border.go` and update `DrawBoardBorder` callers**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS (regenerate goldens only if the border characters changed, never to hide a layout break)

- [ ] **Step 5: Commit**

```bash
git add internal/render/border.go internal/render/board.go internal/render/border_test.go
git commit -m "feat(render): energy-reactive animated board border"
```

---

### Task 6: Piece ion trails and quantum storage

**Files:**
- Create: `internal/fx/trail.go`
- Modify: `internal/fx/world.go` (`Observe` spawns trails and the hold streak, `Step` ages them), `internal/render/fx.go` (`DrawTrails`, `DrawQuantumStorage`), `internal/render/render.go` (pipeline step 6)
- Test: `internal/fx/trail_test.go`, `internal/fx/quantum_test.go`, `internal/render/trail_test.go`

**Interfaces:**
- Consumes: Task 2's `World`; `game.Point`, `game.PieceKind`.
- Produces:
```go
type Trail struct {
    Cells []game.Point   // logical board cells the piece just vacated
    Kind  game.PieceKind
    Age   float64        // seconds
    Life  float64        // seconds
}
const (
    TrailLife     = 0.14   // 140ms, inside §17's 100–160ms window
    MaxTrails     = 64
)
func (t Trail) Stage() int    // 0,1,2 → ▓▓ ▒▒ ░░ ; -1 when expired
func (w *World) spawnTrail(p game.Piece)

type Quantum struct {
    Out  game.PieceKind   // the piece being compressed away
    In   game.PieceKind   // the piece flashing into existence
    Age  float64
}
const QuantumLife = 0.12   // §9: ~120ms
func (q Quantum) Stage() int   // 0 compressed, 1 streaked sideways, 2 gone; -1 expired
func (w *World) Quantum() *Quantum   // nil when none

// render
func DrawTrails(c *Canvas, l Layout, g *game.Game, w *fx.World, o Options)
func DrawQuantumStorage(c *Canvas, l Layout, w *fx.World, o Options)
var TrailGlyphs = [3]string{"▓▓", "▒▒", "░░"}   // ASCII: "##", ";;", ".."
```

`Observe` spawns a trail from the piece's previous cells on `PieceMoved` and `PieceRotated`. Trails carry the vacated cells, so they never sit under the piece itself. `Step` ages them and drops expired ones, capped at `MaxTrails`.

`HoldUsed` starts a `Quantum` (§9): inside the HOLD region, the outgoing piece compresses vertically (stage 0), streaks sideways out of the box with `TrailGlyphs` shoulders (stage 1), and vanishes (stage 2), while the incoming piece flashes in at full brightness for the same 120ms. Gameplay does not wait for it — the engine has already swapped the pieces, and `DrawQuantumStorage` draws only inside `l.Hold`.

- [ ] **Step 1: Write the failing tests**

```go
func TestMoveSpawnsATrailOfFourCells(t *testing.T)
// Observe([]game.Event{{Kind: game.PieceMoved, Piece: p}}, view)
// => one Trail with len(Cells) == 4 and Kind == p.Kind

func TestTrailExpiresWithinTheSpecWindow(t *testing.T)
// Step(100ms) => the trail is still present; Step(another 100ms) => Trails is empty
// Stage() walks 0 → 1 → 2 → -1 across its life

func TestTrailsAreCapped(t *testing.T)
// 200 PieceMoved events in one Observe => len(Trails) <= MaxTrails

func TestNoTrailsWhenFXDisabled(t *testing.T)
// Options{Enabled:false} => Observe spawns none

func TestTrailsNeverCoverTheActivePieceOrLockedCells(t *testing.T)
// render a frame where a trail overlaps both the active piece and a locked cell:
// those cells hold BlockGlyph in the output, not a trail glyph

func TestTrailGlyphsAreASCIISafeInASCIIMode(t *testing.T)
// every rune of the trail cells in a ModeASCII render is < 128
```

```go
func TestHoldStartsQuantumStorage(t *testing.T)
// Observe([]game.Event{{Kind: game.HoldUsed, Piece: outgoing}}, view with Active = incoming)
// => Quantum() != nil with Out == outgoing.Kind and In == view.Active.Kind

func TestQuantumStagesAndLifetime(t *testing.T)
// Stage() is 0 at Age 0.01, 1 at 0.06, 2 at 0.11; Step(120ms) => Quantum() == nil

func TestQuantumDoesNotDelayGameplay(t *testing.T)
// app level: press "c", then feed 8 frames of 16ms => the new active piece descended
// on schedule and a second "c" is still correctly refused (hold once per piece)

func TestQuantumDrawsOnlyInsideTheHoldRegion(t *testing.T)
// every cell the quantum effect writes lies within l.Hold; the board region is untouched
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestTrail|TestHoldStarts|TestQuantum' -v && go test ./internal/render/ -run TestTrail -v`
Expected: FAIL — undefined `Trail`.

- [ ] **Step 3: Implement `trail.go`, the quantum state, the `world.go` hooks, `DrawTrails` and `DrawQuantumStorage`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/trail.go internal/fx/world.go internal/fx/trail_test.go internal/fx/quantum_test.go internal/render/fx.go internal/render/render.go internal/render/trail_test.go
git commit -m "feat(fx): short-lived piece ion trails and quantum storage hold effect"
```

---

### Task 7: Mission control

**Files:**
- Create: `internal/flavor/messages.go`, `internal/flavor/channel.go`
- Test: `internal/flavor/messages_test.go`, `internal/flavor/channel_test.go`

**Interfaces:**
- Consumes: `game.Event`, `fx.GameView`.
- Produces:
```go
type Category int
const (
    CatBoot Category = iota
    CatIdle
    CatLock
    CatClear
    CatTetris
    CatCombo
    CatLevel
    CatHold
    CatHardDrop
    CatGameOver
    CatRare
)

var Messages = map[Category][]string{...}
func ForEvent(ev game.Event, v fx.GameView) (Category, bool)
func Pick(cat Category, rng *rand.Rand, last string) string   // never returns `last`
func Format(text string) string                                // "☄ MISSION CONTROL: " + text

type Channel struct{ /* unexported */ }
const (
    MinHold    = 2500 * time.Millisecond   // §27: "give them time to breathe"
    IdlePrompt = 20 * time.Second
    RareChance = 0.02
)
func NewChannel(seed int64) *Channel
func (c *Channel) Observe(evs []game.Event, v fx.GameView)
func (c *Channel) NoteInput()
func (c *Channel) Step(dt time.Duration)
func (c *Channel) Text() string   // formatted line, "" when there is nothing to say
```

Copy comes verbatim from the spec: §27 for `CatLock`/`CatClear`/`CatIdle` (`NOMINALISH`, `GRAVITY REMAINS MOSTLY LEGAL`, `TETROMINO INJECTION SUCCESSFUL`, `STRUCTURAL VIBES: QUESTIONABLE`, `LOCAL UNIVERSE STABLE*`, `* DEFINITION OF STABLE UNDER REVIEW`, `MOON NOTIFIED`, `ORBITAL OSHA HAS ENTERED THE CHAT`, `WE HAVE EXCEEDED THE RECOMMENDED NUMBER OF BLOCKS`, `PHYSICS TEAM SAYS KEEP GOING`), §21 for `CatCombo` (`COMBO 5 // UNAUTHORIZED ORBITAL MANEUVER`, `COMBO 6 // STRUCTURAL REALITY FAILURE`, `COMBO 7 // NASA DENIES EVERYTHING`, with the combo number substituted), §22 for `CatLevel` (`GRAVITY TAX INCREASED`, `LOCAL PHYSICS UPDATED WITHOUT CONSENT`, `PLEASE SECURE ALL LOOSE TETROMINOES`), §45 for `CatRare` (`DID YOU KNOW YOU'RE IN A TERMINAL?`) and `CatIdle` (`CAPTAIN?`).

Priority when several events arrive in one frame, highest first: `CatGameOver`, `CatTetris`, `CatLevel`, `CatCombo`, `CatHardDrop`, `CatClear`, `CatHold`, `CatLock`. A new message replaces the current one only when the current one has been held `MinHold` or the new category outranks it.

- [ ] **Step 1: Write the failing tests**

```go
func TestEveryCategoryHasMessages(t *testing.T)
// every Category constant has at least two entries except CatBoot (>=1)

func TestForEventMapping(t *testing.T)
// LinesCleared Count 1 => CatClear; Count 4 => CatTetris
// ComboChanged Count 5 => CatCombo; Count 0 => no message (false)
// LevelChanged => CatLevel; HoldUsed => CatHold; PieceHardDropped => CatHardDrop
// GameOver => CatGameOver; PieceMoved => false

func TestComboMessageCarriesTheNumber(t *testing.T)
// Pick(CatCombo, rng, "") for a combo of 5 renders text containing "COMBO 5"

func TestPickNeverRepeatsTheLastLine(t *testing.T)
// 200 Picks with `last` threaded through never return the same line twice in a row

func TestBurstOfEventsYieldsOneHeldMessage(t *testing.T)
// Observe with 10 events (lock + 4-line clear + combo 5 + level up) in one call
// => exactly one Text(); Step(2.4s) with more low-rank events arriving keeps that
// same text; Step(0.2s) more and then a CatClear event replaces it

func TestHigherPriorityInterruptsImmediately(t *testing.T)
// a CatLock message at age 100ms is replaced by a CatTetris event in the next Observe

func TestIdlePromptAfterTwentySeconds(t *testing.T)
// NewChannel then Step(19s) => no "CAPTAIN?"; Step(2s) more => Text() contains "CAPTAIN?"
// NoteInput() resets the idle timer

func TestChannelIsSeedDeterministic(t *testing.T)
// two channels with seed 5 fed the same events and steps produce identical Text() sequences

func TestFormatPrefix(t *testing.T)
// Format("NOMINALISH") == "☄ MISSION CONTROL: NOMINALISH"
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/flavor/ -v`
Expected: FAIL — package does not exist.

- [ ] **Step 3: Implement `messages.go` and `channel.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/flavor/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/flavor
git commit -m "feat(flavor): mission control message tables and pacing channel"
```

---

### Task 8: Wire FX and mission control into the app

**Files:**
- Modify: `internal/app/model.go`, `internal/app/update.go`, `internal/render/render.go` (`Snapshot.Mission` already exists; pass `FX`)
- Test: `internal/app/fx_test.go`

**Interfaces:**
- Consumes: Tasks 2–7.
- Produces:
```go
// Model gains:
FX      *fx.World
Mission *flavor.Channel
FXSeed  int64      // Seed ^ 0x5F3759DF — derived once, never shared with the game RNG
```

Wiring rules:
- `New` builds `fx.NewWorld(FXSeed, 0, 0, fx.Options{Enabled: !o.NoFX, ReducedMotion: o.ReducedMotion})` and `flavor.NewChannel(FXSeed)`.
- `tea.WindowSizeMsg` also calls `m.FX.Resize(w, h)`.
- Every engine call's returned events go to `m.FX.Observe(evs, fx.ViewOf(m.Game))` and `m.Mission.Observe(evs, fx.ViewOf(m.Game))`; key presses additionally call `m.Mission.NoteInput()`.
- `FrameMsg` steps `m.FX` and `m.Mission` with the same clamped `dt` used for `Advance`. While paused, FX steps at `dt/10` (§30: background stars keep drifting slowly) and the mission channel does not step.
- `Snapshot()` fills `FX: m.FX` and `Mission: m.Mission.Text()`.
- `--no-fx` leaves the game fully playable with an empty `World` (§32).

- [ ] **Step 1: Write the failing tests**

```go
func TestModelFeedsEventsToFX(t *testing.T)
// press space (hard drop) => m.FX.Energy > 0 and m.Mission.Text() != ""

func TestFXSeedIsNotTheGameSeed(t *testing.T)
// New(Options{Seed: 1234, SeedSet: true}): m.FXSeed != m.Seed

func TestNoFXFlagLeavesTheGamePlayable(t *testing.T)
// New(Options{NoFX:true}): a 200-frame session with keys still clears a line,
// m.FX.Particles stays empty, and View() is non-empty

func TestPausedStarsKeepDriftingSlowly(t *testing.T)
// pause, record star Y values, feed 1s of frames => stars moved, board unchanged

func TestSameScriptSameOutcomeWithAndWithoutFX(t *testing.T)
// the canned script from Plan 2's tests, run on New(Options{Seed:5,SeedSet:true}) and
// New(Options{Seed:5,SeedSet:true,NoFX:true}) => identical Board.String(), Score, Lines, Level

func TestThirtySecondsOfPlayShowsTheCosmicBaseline(t *testing.T)
// 30 simulated seconds at 16ms with scripted hard drops; over the session assert:
//   - at least one frame's output changed in the starfield region between consecutive frames
//   - the border colour changed at least twice
//   - at least one frame contained a trail glyph
//   - m.Mission.Text() was non-empty for at least 10 seconds' worth of frames
// This is §43's first-30-seconds requirement, mechanised.
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/app/ -run 'TestModelFeeds|TestFXSeed|TestNoFX|TestPausedStars|TestSameScript|TestThirtySeconds' -v`
Expected: FAIL — `Model` has no field `FX`.

- [ ] **Step 3: Implement the wiring**

- [ ] **Step 4: Run everything and play it**

Run: `go test ./... -v && go vet ./... && go run ./cmd/cosmic-tetris --seed 1234`
Expected: tests PASS; the terminal is visibly alive at rest — stars drift, the border shifts colour, pieces leave trails, mission control comments.

- [ ] **Step 5: Commit**

```bash
git add internal/app internal/render/render.go
git commit -m "feat(app): wire FX world and mission control into the frame loop"
```
