# Cosmic Tetris — Plan 03: Cosmic Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the terminal feel alive when nobody is touching it — starfield, breathing board border, ion trails, and Mission Control commentary — with an FX layer that can observe the game and can never touch it.

**Architecture:** `internal/fx` is a self-contained simulation: it receives `[]game.Event` plus a read-only snapshot, integrates its own state on `Advance(dt)`, and exposes that state as plain exported data. `internal/render` reads that data and draws it. Nothing in `fx` imports `render`, and nothing in `fx` holds a mutable reference to `*game.Game`. `internal/flavor` is a pure message-pool lookup.

**Tech Stack:** Go 1.26, `math/rand/v2` (a second, independent generator), `charm.land/lipgloss/v2`.

**Spec:** `design.md` (§14, §15, §17, §25, §26 colour behaviour, §27, §37, §44, §45)

## Global Constraints

- The FX system may observe game events. It may **never modify GameState** (§14).
- Game RNG and FX RNG never share; crossing them makes piece order depend on particle counts (§49.6).
- FX may never obscure the active piece, delay gameplay, make controls lag, or permanently alter the rendered board (§44).
- Board readability is sacred: never make the background so busy that the board becomes harder to read (§15).
- No goroutine per particle, no goroutine per frame, no filesystem operations during gameplay, no synchronous logging every frame (§38).
- Two coordinate spaces, never mixed: **screen space** in terminal cells `(0,0)`–`(W-1,H-1)` for the starfield, and **board-local space** in board cells `(0,0)`–`(9,21)` for anything anchored to the playfield. `render` converts board-local to screen using the layout's `BoardX+1, BoardY+1-HiddenRows` origin.
- §33's tree is the package structure, not a filename whitelist: one small file per subsystem inside the existing packages, no new package, no file over a few hundred lines.
- `internal/fx` simulates; `internal/render` draws. `fx` must not import `render` and `render` must not call any `fx` mutator.
- Star glyph set: `. · ˚ ✦ ✧ *` (§15). Trail ramp: `██ ▓▓ ▒▒ ░░` (§17).
- `--no-fx` yields a game with no starfield, no trails, and a static border, and it must still be a good game (§32).

## Review Focus

1. **`fx.Advance` with `dt <= 0` or a huge `dt`** — the app clamps, but FX is also called from tests and from paused frames. Stars must not jump, positions must never become NaN or Inf, and nothing may divide by `dt`. *(Task 2)*
2. **Resize to a smaller viewport with live FX** — stars and trails already outside the new bounds must be culled or clipped, never written out of range and never left frozen at the old edge. *(Task 2)*
3. **`--no-fx` completeness** — with FX off, the HUD, board, ghost, and Mission Control line must still render a complete frame; the Mission line becomes static text rather than disappearing and leaving a hole in the layout. *(Task 6)*
4. **ASCII mode purity with FX on** — stars, trails, and the border all pull glyphs from the palette, so a single hard-coded `✦` anywhere breaks `--ascii` on a terminal that cannot show it. Assert the whole frame is ASCII. *(Task 6)*
5. **Event bursts in one frame** — a hard drop that clears four lines and levels up delivers six events at once. Mission Control must not swap messages faster than its dwell time, and the highest-priority message must win rather than the last one in the slice (§27 "give them time to breathe"). *(Task 5)*

---

### Task 1: FX world skeleton, options, and the one-way seam

**Files:**
- Create: `internal/fx/events.go`, `internal/fx/world.go`
- Test: `internal/fx/world_test.go`

**Interfaces:**
- Consumes: `game.Event`, `game.EventKind`, `game.Piece` (Plan 01).
- Produces:
  ```go
  type Options struct { Disabled bool; ReducedMotion bool; ASCII bool }

  // Snapshot is everything FX is allowed to know about the game. It is copied by
  // value once per frame; FX holds no pointer into game state.
  type Snapshot struct {
      Level, Combo, Score, Lines int
      Active     game.Piece
      IsHighScore bool
      Playing    bool   // false while paused, in help, or after game over
  }

  type World struct {
      Opts Options
      W, H int          // screen space
      rng  *rand.Rand   // FX RNG: never the game's
      elapsed time.Duration
      // per-subsystem state added by later tasks
  }
  func New(seed int64, w, h int, opts Options) *World
  func (w *World) Resize(width, height int)
  func (w *World) Handle(events []game.Event, s Snapshot)
  func (w *World) Advance(dt time.Duration)
  func (w *World) Elapsed() time.Duration
  ```

`New` seeds with `rand.NewPCG(uint64(seed)^0xC05M1C, 0x2545F4914F6CDD1D)` — derived
from the same CLI seed so a session is reproducible end to end, but a *different*
stream, so FX consumption can never shift piece order.

`Handle` and `Advance` both return nothing: FX is a sink. `Advance` ignores
`dt <= 0` and clamps `dt` to 100ms before integrating, so a stalled process
produces one modest step rather than a teleport.

- [ ] **Step 1: Write the failing tests**

```go
func TestNewWorldIsUsableAtAnySize(t *testing.T)
// New(1, 0, 0, Options{}) and New(1, 200, 60, Options{}): no panic; Resize to
// (0,0) and back to (80,24) also fine.

func TestAdvanceIgnoresNonPositiveDt(t *testing.T)
// Elapsed() unchanged after Advance(0) and Advance(-1s). Review Focus 1.

func TestAdvanceClampsHugeDt(t *testing.T)
// Advance(30s) increases Elapsed() by at most 100ms.

func TestFXNeverTouchesGameState(t *testing.T)
// Build a game, fingerprint it (game.Fingerprint), run 600 frames of
// Handle(events, snapshot)+Advance(16ms) with events produced by real game calls
// captured beforehand, fingerprint again: identical. §14.

func TestFXRNGIsIndependentOfGameRNG(t *testing.T)
// Two games on seed 42: one played with an FX world attached that consumes
// randomness every frame, one with no FX world. Same input stream. Identical
// game Fingerprint(). §49.6.

func TestDisabledWorldDoesNothing(t *testing.T)
// Options{Disabled: true}: after 600 frames plus a full event burst, every
// exported FX slice is empty. (Extended by each later task.)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -v`
Expected: build failure — package does not exist.

- [ ] **Step 3: Implement**

`events.go` holds `Options` and `Snapshot`; `world.go` holds `World` and the five
methods. `Handle` currently switches on event kind and does nothing per case —
later tasks fill the cases in.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/events.go internal/fx/world.go internal/fx/world_test.go
git commit -m "feat(fx): world skeleton with an observe-only game seam"
```

---

### Task 2: Starfield

**Files:**
- Create: `internal/fx/starfield.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/starfield_test.go`

**Interfaces:**
- Consumes: Task 1's `World`.
- Produces:
  ```go
  type StarLayer int
  const (LayerFar StarLayer = iota; LayerMid; LayerNear)
  type Star struct { X, Y float64; Layer StarLayer; Glyph rune; Bright float64 }
  func (w *World) Stars() []Star     // read-only view for the renderer
  func (w *World) SpeedScale() float64 // 1.0 normally; raised by level and, later, hyperdrive
  ```

Three layers (§15), densities as a fraction of screen cells so the field reads the
same at any size — far `1/40`, mid `1/70`, near `1/140` of `W*H`, recomputed on
`Resize`:

```
Far   0.8 cells/sec   glyphs: '.'         Bright 0.25
Mid   2.0 cells/sec   glyphs: '·' '˚'     Bright 0.55
Near  4.5 cells/sec   glyphs: '✦' '✧' '*' Bright 1.0
```

Stars drift downward (§15). A star past the bottom wraps to `Y = -1` at a fresh
random `X`. `SpeedScale` returns `1 + 0.04*(level-1)`, capped at `2.0` — §15's
"star velocity subtly increases", bounded so level 20 is not a blizzard.

`ASCII` mode substitutes `.` `:` `+` `*` for the Unicode glyphs, chosen when the
star is created so the swap costs nothing per frame.

While `Snapshot.Playing` is false the field keeps drifting at `0.25×` speed —
§30's "background stars may continue drifting very slowly".

- [ ] **Step 1: Write the failing tests**

```go
func TestStarCountScalesWithViewport(t *testing.T)
// 80x24 has more stars than 40x24; all three layers are represented; count is
// within 20% of the density formula.

func TestStarsDriftDownward(t *testing.T)
// After Advance(500ms), every star's Y is greater than before (or it wrapped),
// and no star's X changed.

func TestNearStarsMoveFasterThanFarStars(t *testing.T)
// Mean Y delta over 1s: Near > Mid > Far by at least 1.5x each step.

func TestStarsWrapAtTheBottom(t *testing.T)
// Advance 10s in 16ms steps: every star stays within -1 <= Y < H and
// 0 <= X < W. Also asserts no NaN/Inf. Review Focus 1.

func TestSpeedScaleRisesWithLevelAndIsCapped(t *testing.T)
// level 1 -> 1.0; level 6 -> 1.2; level 40 -> 2.0 exactly.

func TestPausedFieldDriftsSlowly(t *testing.T)
// Playing false: total Y movement over 1s is roughly a quarter of the playing
// case, and non-zero.

func TestResizeSmallerCullsOutOfBoundsStars(t *testing.T)
// From 120x50 to 40x24: every star is inside the new bounds. Review Focus 2.

func TestResizeLargerAddsStars(t *testing.T)
// From 40x24 to 120x50: star count grows to the new density.

func TestASCIIStarsAreASCII(t *testing.T)
// Options{ASCII: true}: every star glyph is < 128.

func TestDisabledWorldHasNoStars(t *testing.T)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run Star -v`
Expected: FAIL — undefined: `Stars`.

- [ ] **Step 3: Implement**

`starfield.go`; call its step from `World.Advance` and its reseed from
`World.Resize`. Reuse the `[]Star` backing array across resizes.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/starfield.go internal/fx/world.go internal/fx/starfield_test.go
git commit -m "feat(fx): three-layer drifting starfield"
```

---

### Task 3: Animated board border

**Files:**
- Create: `internal/fx/border.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/border_test.go`

**Interfaces:**
- Produces:
  ```go
  type BorderState struct {
      Phase    float64   // 0..1, advances slowly and wraps
      Energy   float64   // 0..1, spikes on events then decays
      Flash    float64   // 0..1, hard-drop border flash, decays fast
  }
  func (w *World) Border() BorderState
  func (w *World) borderBump(energy float64)  // internal, called from Handle
  ```
  and in `render`:
  ```go
  func (p Palette) BorderStyleAt(b fx.BorderState, t float64) lipgloss.Style
  // t is 0..1 position around the border perimeter
  ```

`Phase` advances at `0.06/sec` normally — a full colour cycle takes about 17
seconds, which is §25's "the shift should be subtle". `Energy` adds
`Phase` speed (up to `6×`) so major events send the gradient racing around the
border (§25). The palette maps `Phase + t*Energy` onto §25's ramp: deep violet →
electric cyan → magenta → stellar blue → hot white. `Flash` lifts the whole border
toward hot white for 120ms.

Energy bumps, from `Handle`: locked `0.10`, single/double/triple clear
`0.35/0.5/0.65`, four-line `1.0`, level change `0.6`, combo change `0.15×combo`.
Decay is `Energy -= 1.2*dt` clamped at 0. `Flash` is set to 1 on
`EvPieceHardDropped` and decays at `8.0/sec` (§18.4).

In `ModeReduced` the ramp is five ANSI-256 indices with no interpolation; in
`ModeASCII` the border is a single static colour and `Phase` is ignored.

- [ ] **Step 1: Write the failing tests**

```go
func TestPhaseAdvancesSlowlyAndWraps(t *testing.T)
// After 1s, Phase moved by ~0.06; after 60s of 16ms steps, Phase stays in [0,1).

func TestEnergyDecaysToZero(t *testing.T)
// borderBump(1.0) then Advance in 16ms steps: Energy reaches 0 within 1s and
// never goes negative.

func TestClearEventsRaiseEnergyByLineCount(t *testing.T)
// Energy after a 4-line clear > after 1-line clear > baseline.

func TestHardDropSetsAndDecaysFlash(t *testing.T)
// Flash == 1 immediately after the event; < 0.1 after 300ms; exactly 0 eventually.

func TestBorderStyleVariesWithPhase(t *testing.T)
// ModeFull: BorderStyleAt at four phases yields at least three distinct colours.

func TestBorderStyleIsStaticInASCIIMode(t *testing.T)
// ModeASCII: the style is identical at every phase and t.

func TestDisabledWorldHasStaticBorder(t *testing.T)
// Options{Disabled: true}: Phase stays 0, Energy stays 0 after an event burst.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run Border -v && go test ./internal/render/ -run Border -v`
Expected: FAIL — undefined: `Border`, `BorderStyleAt`.

- [ ] **Step 3: Implement**

`internal/fx/border.go` and the `BorderStyleAt` method in
`internal/render/palette.go`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS (golden tests are regenerated in Task 6, so a golden failure here is
expected only if you already wired the border into `Render` — do that in Task 6.)

- [ ] **Step 5: Commit**

```bash
git add internal/fx/border.go internal/fx/border_test.go internal/render/palette.go internal/render/palette_test.go
git commit -m "feat(fx): board border as an energy-state indicator"
```

---

### Task 4: Piece trails

**Files:**
- Create: `internal/fx/trail.go`
- Modify: `internal/fx/world.go`
- Test: `internal/fx/trail_test.go`

**Interfaces:**
- Produces:
  ```go
  type Trail struct {
      X, Y  int       // board-local cell
      Kind  game.PieceKind
      Life  float64   // seconds remaining
      Max   float64
      Streak bool     // horizontal quantum-storage smear (§9)
  }
  func (w *World) Trails() []Trail
  func TrailGlyphIndex(life, max float64) int   // 0..3 -> ██ ▓▓ ▒▒ ░░
  func (w *World) HoldFlash() float64           // 0..1, incoming piece flash
  ```

On `EvPieceMoved` and `EvPieceRotated`, push a trail cell for each of the piece's
four cells at its *previous* position with `Max = 0.13s` (§17's 100–160ms).
`EvPieceHardDropped` pushes trails for every cell the piece crossed —
`Count` rows' worth — with `Max = 0.22s`, which is §17's "stronger vertical trail"
and the first half of §18.1.

**Quantum storage (§9).** `EvHoldUsed` gets its own ~120ms effect built from the
same primitive: for each cell of the *outgoing* piece, push three `Streak` trails
running sideways from that cell toward the HOLD side of the board with
`Max = 0.12s`, so the piece reads as compressed, streaked sideways, and gone. At
the same time `HoldFlash` is set to 1 and decays at `8.0/sec`; the renderer uses it
to brighten the incoming piece for those same 120ms. Gameplay does not wait for any
of this — the engine already swapped the pieces before the event was emitted (§9).

`World` keeps the previous active-piece cells from the last `Handle` call so it can
place the trail where the piece *was*. Trails are stored in a reused slice,
compacted in place on `Advance`, and capped at 240 entries — oldest dropped first.
Trails are board-local; the renderer skips any trail cell that a locked, ghost, or
active cell already occupies, which is §44's "never obscure the active piece"
enforced at draw time.

- [ ] **Step 1: Write the failing tests**

```go
func TestMoveLeavesTrailAtThePreviousPosition(t *testing.T)
// Handle a move event where the piece went from x=4 to x=3: trails exist at the
// x=4 cells, not the x=3 cells.

func TestTrailsExpireWithinSpecWindow(t *testing.T)
// After 100ms some trails remain; after 200ms Trails() is empty.

func TestHardDropTrailCoversTheFallenColumn(t *testing.T)
// EvPieceHardDropped{Count: 12}: trail cells span 12 rows above the final
// position for each occupied column.

func TestTrailGlyphRampFollowsLife(t *testing.T)
// TrailGlyphIndex(max, max) == 0; at 2/3 -> 1; at 1/3 -> 2; near 0 -> 3.

func TestHoldStreaksSidewaysAndFlashes(t *testing.T)
// EvHoldUsed: Streak trails exist, they extend horizontally from the outgoing
// piece's cells (same Y, several X), HoldFlash() == 1, and everything is gone by
// 150ms. (§9)

func TestHoldEffectDoesNotDelayAnything(t *testing.T)
// game.Fingerprint is unchanged by the hold effect, and Handle returns without
// sleeping. (§9 "gameplay does not wait for the animation")

func TestTrailsAreCapped(t *testing.T)
// 500 move events in one frame: len(Trails()) <= 240 and the survivors are the
// newest.

func TestTrailsDoNotOverdrawTheActivePiece(t *testing.T)
// Render a frame where a trail cell coincides with an active-piece cell: the
// stripped output shows the block glyph, not the trail glyph. (in render tests)

func TestDisabledWorldHasNoTrails(t *testing.T)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run Trail -v`
Expected: FAIL — undefined: `Trails`.

- [ ] **Step 3: Implement**

`trail.go` plus the `Handle` cases.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/fx/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/trail.go internal/fx/world.go internal/fx/trail_test.go
git commit -m "feat(fx): short-lived ion trails behind moving pieces"
```

---

### Task 5: Flavor pool and the Mission Control channel

**Files:**
- Create: `internal/flavor/messages.go`, `internal/fx/mission.go`
- Test: `internal/flavor/messages_test.go`, `internal/fx/mission_test.go`

**Interfaces:**
- Produces:
  ```go
  // internal/flavor
  type Trigger int
  const (Idle Trigger = iota; Lock; Clear1; Clear2; Clear3; Clear4; Combo;
         LevelUp; Hold; HoldO; HardDrop; KineticRod; GameOver; Rare)
  func Pick(rng *rand.Rand, t Trigger) string
  func Pool(t Trigger) []string   // exported for the tests that assert copy
  func ComboLine(combo int) string  // "COMBO 5 // UNAUTHORIZED ORBITAL MANEUVER"

  // internal/fx
  type Mission struct { Text string; Age time.Duration }
  func (w *World) Mission() Mission
  ```

Pools carry the spec's copy verbatim, at least four lines each, including §27's
nine examples, §21's combo lines for 5/6/7, and §45's specials: `Rare` holds
`DID YOU KNOW YOU'RE IN A TERMINAL?`, `NUMBER BECAME BIGGER`, and `CAPTAIN?`;
`KineticRod` holds `KINETIC ROD DEPLOYED` (a vertical I hard drop); `HoldO` holds
`CUBE ADJACENT OBJECT SECURED`.

Channel rules, which are §27's "do not rotate messages constantly" made concrete:

```
MinDwell      2.5s   a message cannot be replaced before this
IdleAfter     9s     with no message change, pick an Idle line
RarePer       1/60   chance an Idle pick comes from Rare instead
Priority      GameOver > Clear4 > LevelUp > Combo > Clear3..1 > HardDrop/Hold > Lock > Idle
```

When a frame delivers several events, `Handle` selects the single
highest-priority trigger and offers it to the channel; the channel accepts only if
`Age >= MinDwell` or the new trigger outranks the current one by two or more levels
(so a four-line clear can still interrupt a fresh `Lock` line). This is Review
Focus 5.

`KineticRod` is chosen over `HardDrop` when the dropped piece is an `I` in a
vertical rotation; `HoldO` over `Hold` when the held kind is `O` (§45).

- [ ] **Step 1: Write the failing tests**

```go
// internal/flavor
func TestEveryTriggerHasAPool(t *testing.T)
// Pool(t) is non-empty for every Trigger value, and every line is <= 52 columns
// so it fits the narrowest layout that shows Mission Control.

func TestPickIsDeterministicPerSeed(t *testing.T)
// Same seed, same trigger, same sequence of 20 picks.

func TestSpecCopyIsPresent(t *testing.T)
// Asserts the literal presence of "GRAVITY REMAINS MOSTLY LEGAL",
// "ORBITAL OSHA HAS ENTERED THE CHAT", "MOON NOTIFIED",
// "KINETIC ROD DEPLOYED", "CUBE ADJACENT OBJECT SECURED",
// "DID YOU KNOW YOU'RE IN A TERMINAL?".

func TestComboLineIncludesTheNumber(t *testing.T)
// ComboLine(5) contains "COMBO 5"; ComboLine(6) and (7) match §21's copy;
// ComboLine(12) still returns a non-empty line.

func TestAllFlavorIsASCIIOrSafeUnicode(t *testing.T)
// Every line's runes are either < 128 or in the small approved set (✦ ☄ ·).

// internal/fx
func TestMissionStartsWithAnIdleLine(t *testing.T)
// Mission().Text is non-empty immediately after New.

func TestMissionRespectsMinimumDwell(t *testing.T)
// A Lock event, then another Lock event 200ms later: text unchanged.

func TestHighPriorityEventInterruptsAFreshLine(t *testing.T)
// A Lock line 200ms old, then a 4-line clear: text changes to a Clear4 line.
// Review Focus 5.

func TestBurstOfEventsPicksTheHighestPriority(t *testing.T)
// One Handle call with [Locked, LinesCleared(4), LevelChanged, ComboChanged]:
// the resulting text is from the Clear4 pool, not the last event's pool.

func TestIdleLineAppearsAfterQuiet(t *testing.T)
// No events for 10s: text changed at least once to an Idle line.

func TestDisabledWorldStillReportsAStaticMissionLine(t *testing.T)
// Options{Disabled: true}: Mission().Text is non-empty and never changes.
// Review Focus 3.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/flavor/ ./internal/fx/ -run 'Flavor|Pool|Pick|Combo|Mission|Spec' -v`
Expected: FAIL — undefined: `flavor.Pool`, `World.Mission`.

- [ ] **Step 3: Implement**

`internal/flavor/messages.go` (pools as package-level slices) and
`internal/fx/mission.go` (channel state, priority table, dwell logic).

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/flavor internal/fx/mission.go internal/fx/mission_test.go
git commit -m "feat(flavor): mission control channel with dwell and priority"
```

---

### Task 6: Wire FX into the app and the render pipeline

**Files:**
- Create: `internal/render/fxdraw.go`
- Modify: `internal/app/model.go`, `internal/app/update.go`, `internal/render/frame.go`, `internal/render/golden_test.go`, `internal/render/testdata/*.golden`
- Test: `internal/render/fxdraw_test.go`, `internal/app/fx_test.go`

**Interfaces:**
- Consumes: `fx.World`, `fx.Star`, `fx.Trail`, `fx.BorderState`, `fx.Mission`.
- Produces:
  ```go
  func DrawStars(g *Grid, stars []fx.Star, p Palette, boardRect Rect)
  func DrawTrails(g *Grid, trails []fx.Trail, p Palette, ox, oy int, occupied func(x, y int) bool)
  func DrawMission(g *Grid, x, y, width int, m fx.Mission, p Palette)
  type Rect struct{ X, Y, W, H int }
  // new palette methods
  func (p Palette) StarStyle(layer fx.StarLayer, bright float64) lipgloss.Style
  func (p Palette) TrailStyle(k game.PieceKind, step int) lipgloss.Style
  func (p Palette) FlashStyle(k game.PieceKind, flash float64) lipgloss.Style // hold flash
  ```
  and `Frame` gains `FX *fx.World` (nil-safe: a nil `FX` renders Plan 02's frame
  exactly).

Wiring in `app`:

- `Model` gains `FX *fx.World`, built in `New` from `Opts.Seed` with
  `fx.Options{Disabled: Opts.NoFX, ReducedMotion: Opts.ReducedMotion, ASCII: Opts.ASCII}`.
- Key handling: the events returned by `game.Apply` are collected and passed to
  `FX.Handle` in the same `Update` call, so a keypress's FX starts on the frame the
  key arrived, not the next one.
- `FrameMsg`: `evs := Game.Advance(dt)`, then `FX.Handle(evs, snapshot)`, then
  `FX.Advance(dt)` — always, including while paused (with `Snapshot.Playing` false).
- `WindowSizeMsg`: `FX.Resize(w, h)`.

Drawing slots into §37's pipeline: `DrawStars` is step 2, `DrawTrails` step 6,
border style feeds step 7, `DrawMission` step 11. `FX.HoldFlash()` feeds
`FlashStyle` when drawing the active piece (step 5) and the HOLD thumbnail (step 8),
so §9's incoming piece "briefly flashes into existence".

`DrawStars` skips any cell inside `boardRect`'s interior that is non-empty — stars
show through the empty parts of the playfield but never over a block, which keeps
§15's readability promise without a second buffer. Star brightness maps to
`Palette.StarStyle(layer, bright)`.

- [ ] **Step 1: Write the failing tests**

```go
// internal/render
func TestStarsDrawOutsideAndThroughTheBoard(t *testing.T)
// Stars at known positions: one outside the board appears; one over an empty
// board cell appears; one over a locked block does not.

func TestStarsNeverOverwriteTheActivePiece(t *testing.T)
// A star placed exactly on an active-piece cell: output shows the block glyph.

func TestTrailsDrawInBoardLocalSpace(t *testing.T)
// Trail{X:0, Y:21} lands on the board's bottom-left interior cell.

func TestMissionLineIsPrefixedAndTruncated(t *testing.T)
// Output starts with "☄ MISSION CONTROL: " and the whole line is <= width;
// ASCII mode uses "* MISSION CONTROL: ".

func TestHoldStreakAndFlashAreDrawn(t *testing.T)
// A frame right after a hold: streak glyphs appear beside the outgoing piece's
// former cells, and the HOLD thumbnail is rendered with the brightened style.

func TestNilFXRendersPlanTwoFrame(t *testing.T)
// Frame with FX nil equals the Plan 02 golden for the same scene.

func TestGoldenWithFX(t *testing.T)
// The eight scenes from Plan 02 Task 8, now with an FX world seeded 8675309 and
// advanced by a fixed 30-frame 16ms sequence before rendering. Regenerated
// goldens; same geometry assertions as before.

func TestNoFXSceneHasNoStarsOrTrailsButKeepsMissionLine(t *testing.T)
// Options{Disabled: true} scene: no star glyph anywhere, no trail glyph, the
// mission line present, the HUD complete, board box intact. Review Focus 3.

func TestFXSceneInASCIIModeIsPureASCII(t *testing.T)
// The ascii golden scene with FX fully active: every rune < 128. Review Focus 4.

// internal/app
func TestKeyEventsReachFXOnTheSameFrame(t *testing.T)
// A hard-drop key with no intervening FrameMsg: FX.Trails() is non-empty and the
// border Flash is 1.

func TestFXAdvancesWhilePaused(t *testing.T)
// Paused, 60 FrameMsgs: stars moved, game state Fingerprint unchanged.

func TestResizeReachesFX(t *testing.T)
// WindowSizeMsg{40,24} after {120,50}: every star is within the new bounds.
// Review Focus 2.

func TestNoFXOptionProducesAnEmptyWorld(t *testing.T)
// Opts.NoFX: after a minute of frames and every kind of event, no stars, no
// trails, static border.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ ./internal/app/ -v`
Expected: FAIL — undefined: `DrawStars`; `Frame` has no `FX` field.

- [ ] **Step 3: Implement**

`fxdraw.go`, the `Frame.FX` field and pipeline calls, the app wiring, then
regenerate goldens with `-update` and **read each one** before committing.

- [ ] **Step 4: Run tests, then look at it**

Run: `go test ./... -count=1` — expect PASS.
Run: `./cosmic-tetris --seed 8675309` and watch it do nothing for ten seconds.
Stars should drift, the border should breathe, moving a piece should smear, and
Mission Control should say something and then shut up for a while. Then
`./cosmic-tetris --no-fx` and confirm it is still a clean, complete game, and
`./cosmic-tetris --ascii` and confirm nothing renders as a replacement glyph.

- [ ] **Step 5: Commit**

```bash
git add internal/render internal/app
git commit -m "feat: composite starfield, trails, border, and mission control"
```

---

## Done when

§43's first-30-seconds list is half satisfied: moving starfield, animated board
border, piece trails, and Mission Control commentary all appear during ordinary
play. `go test ./... -count=1` is green, the FX package holds its own RNG, and the
determinism tests prove FX cannot shift piece order. Hard-drop impact, particles,
and supernovas are Plan 04.
