# Cosmic Tetris — Plan 05: Absurd Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the boot sequence, the black-hole game over, size-aware effect reduction, and the small rare details — then verify the whole §47 definition of done and ship the README.

**Architecture:** Two new app states (`StateBoot`, and `StateOver` gaining a timeline) plus one FX subsystem (`collapse`) and one layout-driven intensity clamp. Nothing structural changes: the boot screen and the collapse are both `render` functions reading `fx`/`app` state, exactly like every other effect.

**Tech Stack:** Go 1.26, `charm.land/bubbles/v2/spinner`, the existing packages.

**Spec:** `design.md` (§28, §29, §30, §31 effect reduction, §32, §39, §43, §45, §47, §48)

## Global Constraints

- Boot lasts approximately one second, any key skips it, no menu is required (§29).
- Game over is theatrical and does not instantly replace the board; the timeline is `0–300ms` freeze with `SIGNAL LOST`, `300–900ms` blocks falling inward, `900–1300ms` collapse into a black hole, then the final panel (§28).
- Pause freezes gameplay and gameplay particles; background stars may keep drifting very slowly (§30).
- Effects automatically reduce outside the board at small sizes (§31).
- The optional tiny details of §45 stay occasional.
- The boring mode (`--no-fx`, `--ascii`) must still be a good game (§32).
- Terminal output must not visibly flicker under normal conditions; animations never block input (§47).
- The codebase should be small enough to understand in an afternoon (§48). This plan adds no new packages.

## Review Focus

1. **Keypress during boot** — the first thing an impatient player does. Any key must jump straight to a playable first frame, with the game's clock starting then rather than 1s in the past. *(Task 1)*
2. **Game over while banners and particles are live** — dying on a four-line clear is common. The collapse must run, the final panel must appear, and the live banner must not sit on top of the panel. *(Task 2)*
3. **Resize during the collapse or the boot** — both are timed sequences that own the whole screen. A resize mid-sequence must reposition without panicking and without restarting the timeline. *(Tasks 1, 2)*
4. **`r` mid-collapse** — restart during the animation must produce a clean playing state with the FX world reset, not a new game wearing the old collapse. *(Task 2)*
5. **Quit at any moment** — `q`, `esc`, and `ctrl+c` from boot, playing, paused, help, mid-collapse, and the final panel must all exit with the terminal restored and no stray output after the prompt returns. *(Task 5)*

---

### Task 1: Boot sequence

**Files:**
- Create: `internal/render/boot.go`
- Modify: `internal/app/model.go`, `internal/app/update.go`, `internal/render/frame.go`
- Test: `internal/render/boot_test.go`, `internal/app/boot_test.go`

**Interfaces:**
- Produces:
  ```go
  // app
  const StateBoot AppState = 4     // appended so existing constants keep their values
  const BootDuration = 1100 * time.Millisecond
  // model gains: BootAge time.Duration, Spinner spinner.Model

  // render
  type BootView struct { Age time.Duration; Spinner string; Palette Palette }
  func DrawBoot(g *Grid, v BootView)
  func BootChecklist(age time.Duration) []string  // progressive reveal
  // Frame gains: Boot BootView, used only when State == StateBoot
  ```

`New` starts in `StateBoot`. `FrameMsg` accumulates `BootAge` and advances the
spinner; at `BootDuration` the state becomes `StatePlaying`. **Any** `KeyPressMsg`
except the quit keys skips immediately (§29). On the transition, `LastFrame` is set
to the message's `Now` so the game does not receive the boot's elapsed time as
gravity — that is Review Focus 1's real failure mode.

The screen is §29's, revealed on a schedule:

```
  0ms   ✦ and "C O S M I C"
150ms   "T E T R I S"
300ms   "INITIALIZING LOCAL UNIVERSE..."
450ms   "gravity ........ OK"
600ms   "spacetime ...... OK"
750ms   "tetrominoes .... QUESTIONABLE"
950ms   "UNIVERSE ONLINE"
```

The spinner (Bubbles, §3) sits beside the `INITIALIZING` line. The starfield draws
behind all of it — `FX.Advance` already runs in every state, so boot gets stars for
free.

- [ ] **Step 1: Write the failing tests**

```go
// render
func TestBootRevealsLinesOnSchedule(t *testing.T)
// Age 0: contains "C O S M I C", not "T E T R I S". Age 400ms: contains
// "INITIALIZING LOCAL UNIVERSE...". Age 800ms: contains "QUESTIONABLE".
// Age 1000ms: contains "UNIVERSE ONLINE".

func TestBootFitsSmallTerminals(t *testing.T)
// 40x24 and 34x19 grids: no panic, all lines within bounds.

func TestBootIsCentred(t *testing.T)

// app
func TestAppStartsInBootState(t *testing.T)

func TestBootEndsAfterItsDuration(t *testing.T)
// FrameMsgs totalling 1.2s: State == StatePlaying.

func TestAnyKeySkipsBoot(t *testing.T)
// "x", "space", "a": State becomes StatePlaying immediately. Review Focus 1.

func TestQuitDuringBootStillQuits(t *testing.T)
// "q" returns the quit command rather than skipping to play.

func TestSkippingBootDoesNotBankGravity(t *testing.T)
// Boot for 900ms, press a key, then one FrameMsg 16ms later: the active piece has
// not moved (no 900ms of gravity applied). Review Focus 1.

func TestBootIgnoresGameplayKeys(t *testing.T)
// The skip keypress must not also move the piece: X unchanged after skipping
// with "left".

func TestResizeDuringBootIsFine(t *testing.T)
// WindowSizeMsg mid-boot: no panic, BootAge unchanged. Review Focus 3.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ ./internal/app/ -run Boot -v`
Expected: FAIL — undefined: `DrawBoot`, `StateBoot`.

- [ ] **Step 3: Implement**

`boot.go`, the state, and the `Update` cases. `go get charm.land/bubbles/v2/spinner`
is already satisfied by the bubbles dependency.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/boot.go internal/render/boot_test.go internal/app internal/render/frame.go
git commit -m "feat: one second of excessive drama before the game starts"
```

---

### Task 2: Game-over collapse and the black hole

**Files:**
- Create: `internal/fx/collapse.go`, `internal/render/collapse.go`
- Modify: `internal/fx/world.go`, `internal/app/update.go`, `internal/render/frame.go`
- Test: `internal/fx/collapse_test.go`, `internal/render/collapse_test.go`, `internal/app/gameover_test.go`

**Interfaces:**
- Produces:
  ```go
  // fx
  const (CollapseFreeze = 300 * time.Millisecond
         CollapseFall   = 900 * time.Millisecond
         CollapseHole   = 1300 * time.Millisecond)
  type CollapseStage int
  const (CollapseNone CollapseStage = iota; CollapseSignalLost; CollapseInfall; CollapseBlackHole; CollapseDone)
  type FallingBlock struct { X, Y float64; Kind game.PieceKind }
  func (w *World) StartCollapse(b game.Board)
  func (w *World) Collapse() (CollapseStage, []FallingBlock, float64) // stage, blocks, hole intensity
  func (w *World) ResetCollapse()

  // render
  func DrawSignalLost(g *Grid, board Rect, p Palette)
  func DrawCollapse(g *Grid, board Rect, blocks []FallingBlock, hole float64, p Palette)
  ```

`StartCollapse` snapshots the board into `FallingBlock`s at their current cell
positions — a copy, so nothing here reads game state again (§14). Stages follow
§28's timeline. During `CollapseInfall` each block accelerates toward the board
centre with a velocity proportional to its distance, so the outside arrives last.
During `CollapseBlackHole` the remaining blocks are inside a two-cell radius and
`hole` ramps 0→1, driving §28's picture:

```
          ·
        ˚
       \ | /
     --- ● ---
       / | \
         *
```

drawn centred on the board, with the accretion arms brightening as `hole` rises.
`CollapseDone` is when the final panel (Plan 02 Task 5's `DrawGameOver`) appears.
Banners are cleared when the collapse starts, which is Review Focus 2.

App wiring: on `EvGameOver`, `State = StateOver`, `FX.StartCollapse(Game.Board)`,
and the board stops being drawn from game state — `DrawCollapse` owns those rows
until `CollapseDone`. `r` calls `FX.ResetCollapse()` before rebuilding the game
(Review Focus 4).

- [ ] **Step 1: Write the failing tests**

```go
// fx
func TestCollapseStagesFollowSpecTiming(t *testing.T)
// 0 and 299ms -> CollapseSignalLost; 301 and 899ms -> CollapseInfall;
// 901 and 1299ms -> CollapseBlackHole; 1301ms -> CollapseDone.

func TestBlocksFallInwardTowardTheCentre(t *testing.T)
// Snapshot a board with blocks at both edges; after 400ms of infall every block
// is closer to the centre than it started, and none has overshot past it.

func TestOuterBlocksTravelFurther(t *testing.T)
// A block at x=0 moves more total distance than one at x=4 over the same window.

func TestHoleIntensityRampsToOne(t *testing.T)
// hole is 0 during infall, rises during CollapseBlackHole, and is 1.0 at 1300ms.

func TestCollapseSnapshotsRatherThanReferences(t *testing.T)
// Mutate the game board after StartCollapse: the falling blocks are unaffected.

func TestStartCollapseClearsBanners(t *testing.T)
// A live giant banner is gone after StartCollapse. Review Focus 2.

func TestResetCollapseReturnsToNone(t *testing.T)

// render
func TestSignalLostIsDrawnOverTheBoard(t *testing.T)
// Output contains "SIGNAL LOST" within the board's rows.

func TestBlackHoleGlyphsAppear(t *testing.T)
// At hole 1.0: output contains "●" and the arm characters, centred on the board.

func TestCollapseFitsSmallTerminalsAndClips(t *testing.T)
// 40x24: no panic, lines within bounds.

// app
func TestGameOverStartsTheCollapse(t *testing.T)
// Force a blocked spawn: State == StateOver and the collapse stage is
// CollapseSignalLost.

func TestFinalPanelAppearsAfterTheCollapse(t *testing.T)
// 1.4s of frames after death: the frame contains "UNIVERSE EXPIRED" and the
// score; before 1.3s it does not. (§28)

func TestGameOverDuringAFourLineClearStillCollapses(t *testing.T)
// Engineer a four-line clear that also blocks the next spawn: the collapse runs
// and the final panel is not covered by the banner. Review Focus 2.

func TestRestartMidCollapseIsClean(t *testing.T)
// "r" at 600ms into the collapse: State StatePlaying, Score 0, collapse stage
// CollapseNone, no falling blocks. Review Focus 4.

func TestResizeMidCollapseDoesNotPanicOrRestartTheTimeline(t *testing.T)
// Review Focus 3.

func TestKeysOtherThanRAndQAreIgnoredWhileOver(t *testing.T)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ ./internal/app/ -run 'Collapse|GameOver|SignalLost|BlackHole' -v`
Expected: FAIL — undefined: `StartCollapse`.

- [ ] **Step 3: Implement**

Both files plus the wiring and the `Render` branch that hands the board rows to
`DrawCollapse` while a collapse is live.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx/collapse.go internal/render/collapse.go internal/fx/world.go internal/app internal/render/frame.go
git commit -m "feat: collapse the universe into a black hole on game over"
```

---

### Task 3: Size-aware effect reduction and the rare details

**Files:**
- Modify: `internal/fx/world.go`, `internal/fx/starfield.go`, `internal/fx/mission.go`, `internal/render/frame.go`
- Create: `internal/fx/shootingstar.go`
- Test: `internal/fx/reduction_test.go`, `internal/fx/shootingstar_test.go`

**Interfaces:**
- Produces:
  ```go
  type Budget struct { Stars, Particles float64; Banners, Shockwaves bool }
  func (w *World) SetBudget(b Budget)
  func BudgetForTier(tier int) Budget   // tier mirrors render.Tier
  type ShootingStar struct { X, Y, VX, VY float64; Life, MaxLife float64; Tail int }
  func (w *World) ShootingStars() []ShootingStar
  ```

§31's "effects automatically reduce outside the board" becomes one multiplier set,
applied where densities and burst sizes are chosen:

```
TierWide    Stars 1.0  Particles 1.0  Banners yes  Shockwaves yes
TierMedium  Stars 0.7  Particles 0.8  Banners yes  Shockwaves yes
TierSmall   Stars 0.35 Particles 0.5  Banners no   Shockwaves no
```

At `TierSmall` there is no room for a banner without covering the board, and §44
makes the board win. `app` calls `SetBudget(fx.BudgetForTier(int(layout.Tier)))`
whenever the size changes.

Shooting stars (§45): during quiet play, roughly one every 25 seconds, a bright
particle crosses the background diagonally with a three-cell tail. It is drawn
outside the board only, using the same `occupied` guard as everything else.

Idle details (§45), all routed through the existing Mission Control channel so they
inherit its dwell rules: `CAPTAIN?` after 20 seconds with no player input;
`NUMBER BECAME BIGGER` when the score crosses a power-of-ten boundary;
`DID YOU KNOW YOU'RE IN A TERMINAL?` at a 1-in-60 chance on an idle pick.

- [ ] **Step 1: Write the failing tests**

```go
func TestBudgetForTierScalesDown(t *testing.T)
// Wide > Medium > Small for both multipliers; Small disables banners and
// shockwaves.

func TestSmallBudgetReducesStarCount(t *testing.T)
// Same viewport, Budget{Stars: 0.35}: about a third of the stars.

func TestSmallBudgetSuppressesBanners(t *testing.T)
// A four-line clear at the small budget produces no banner but still produces
// particles and a border reaction.

func TestBudgetChangeDoesNotStutter(t *testing.T)
// Switching budgets mid-flight keeps every existing star inside bounds and does
// not reset positions.

func TestShootingStarsAreRare(t *testing.T)
// Over 60 simulated seconds of quiet play: between 1 and 5 shooting stars.

func TestShootingStarCrossesAndExpires(t *testing.T)
// Position moves diagonally; it is gone within its MaxLife.

func TestShootingStarsPauseWithGameplay(t *testing.T)
// Playing false: no new shooting stars spawn.

func TestIdleCaptainLineAfterTwentySeconds(t *testing.T)
// No input events for 20s: Mission text becomes "MISSION CONTROL: CAPTAIN?"'s
// pool line at least once.

func TestScoreRolloverLine(t *testing.T)
// Snapshot score crossing 10000: "NUMBER BECAME BIGGER" appears (subject to dwell).
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run 'Budget|Shooting|Idle|Rollover' -v`
Expected: FAIL — undefined: `SetBudget`.

- [ ] **Step 3: Implement**

The budget plumbing, `shootingstar.go`, the mission triggers, and the `app` call
site.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render/frame.go internal/app
git commit -m "feat(fx): size-aware effect budget, shooting stars, rare flavor"
```

---

### Task 4: README and licence

**Files:**
- Create: `README.md`, `LICENSE`
- Test: none (documentation)

`README.md` covers, in this order: one-paragraph pitch in the spec's voice; a
screenshot-style ASCII sample of the wide layout taken from the actual golden file
(`internal/render/testdata/wide.golden`, not §4's mockup, which does not align —
§49.7); install and run; the six CLI forms from §49.5 with one line each, including
what `--reduced-motion` suppresses; the control table from §8; a short
"how it fits together" section naming the four packages and the one-way
`game → fx → render` flow; and how to run the tests, including `-update` for the
goldens.

`LICENSE`: MIT, with the copyright line filled in.

- [ ] **Step 1: Write the README**

Pull the layout sample from the golden file so the README cannot drift from what
the program actually prints.

- [ ] **Step 2: Verify the commands in it**

Run every command the README lists, in order, from a clean clone-like state:
`go build ./...`, `go test ./...`, `./cosmic-tetris --help`, and each flag.

- [ ] **Step 3: Commit**

```bash
git add README.md LICENSE
git commit -m "docs: README with real layout sample, controls, and flags"
```

---

### Task 5: Definition-of-done verification pass

**Files:**
- Create: `internal/app/acceptance_test.go`
- Test: same file

**Interfaces:**
- Consumes: everything.

This task turns §47's checklist into a single test file plus a scripted manual pass,
so "done" is a thing that can fail rather than a thing that gets asserted in a
commit message.

- [ ] **Step 1: Write the failing tests**

```go
func TestModeMatrix(t *testing.T)
// For each of the 8 combinations of {ascii, no-fx, reduced-motion}: build a model,
// feed 1200 frames of 16ms with a canned input stream that clears lines, levels
// up, holds, pauses, resumes, opens help, closes it, dies, and restarts. Assert:
// no panic, every frame's line count <= H and width <= W, the game reaches
// Level >= 2, and the frame is non-empty in every state.

func TestQuitFromEveryState(t *testing.T)
// boot, playing, paused, help, mid-collapse, final panel: "q", "esc", "ctrl+c"
// each return a quit command. Review Focus 5.

func TestFrameIsStableWhenNothingHappens(t *testing.T)
// --no-fx, paused: two consecutive renders are byte-identical, which is the
// testable half of §47's "does not visibly flicker".

func TestNoFrameExceedsATimeBudget(t *testing.T)
// 600 frames at TierWide with a four-line clear and 600 live particles: mean
// Update+View time under 4ms on the test machine. §38's "the terminal is the
// bottleneck" should hold; a regression here means an accidental O(n^2).

func TestEffectsNeverModifyGameState(t *testing.T)
// The whole matrix run, with game.Fingerprint compared against a second run of
// the same input stream with --no-fx: identical. §47.

func TestDeterministicSessionAcrossTheWholeApp(t *testing.T)
// Two models on the same seed fed an identical (key, frame-dt) stream end with
// identical game Fingerprint, Score, Lines, Level.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ -run 'Matrix|Quit|Stable|Budget|Effects|Deterministic' -v`
Expected: FAIL until the file compiles and any real defects it finds are fixed.

- [ ] **Step 3: Fix whatever it finds**

Expect real bugs here — this is the first test that exercises the modes in
combination. Fix them in the owning package, not in the acceptance test.

- [ ] **Step 4: Walk §47 and §43 by hand**

Run `./cosmic-tetris` and confirm each line, ticking them off:

§47: playable start to game over · controls immediate · resizing works · hold ·
ghost · next queue · deterministic piece generation · game and FX RNG isolated ·
line clearing correct · gravity increases · pause · restart · ASCII fallback ·
no-FX mode · unit tests · snapshot tests · no visible flicker · animations never
block input · effects never modify state · four-line clears gloriously excessive ·
game over collapses into a black hole · fun with effects off · much funnier with
them on.

§43, within the first 30 seconds of normal play: moving starfield, animated border,
piece trails, hard-drop impact, particles, Mission Control commentary. Within the
first completed line: supernova, debris, border reaction. On a four-line clear: the
reaction §43 actually specifies.

Anything that fails is a bug in the owning plan's task; fix it there.

- [ ] **Step 5: Commit**

```bash
git add internal/app/acceptance_test.go
git commit -m "test: definition-of-done acceptance matrix across every mode"
```

---

## Done when

Every line of §47 is checked, the acceptance matrix is green, `go test ./... -count=1`
passes, `go vet ./...` is clean, `gofmt -l .` prints nothing, and the game
delivers §43's reaction on a four-line clear. §48's standard is the last gate:
this should read as a tiny terminal arcade game whose universe is losing its shit,
not as Tetris implemented with Bubble Tea, and the whole codebase should still be
readable in an afternoon.
