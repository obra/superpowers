# Cosmic Tetris — Plan 5: Absurd Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the game: the boot sequence, the game-over black hole collapse, guaranteed ASCII and no-FX modes, the §45 tiny details, the README, and the §43/§47 acceptance sweep.

**Architecture:** Two new app phases get their own aged FX state and draw function, following the pattern established in Plans 3–4 (`fx` holds the timeline, `render` draws it, `app` owns the clock). The mode guarantees are enforced by tests that walk every rune of every view rather than by trusting call sites.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2`, `charm.land/bubbles/v2` (spinner), `charm.land/lipgloss/v2`.

**Spec:** `design.md` (§28, §29, §30, §32, §39, §42 Phase 5, §43, §45, §46, §47, §48, §49.4, §49.5)

## Global Constraints

- Language: Go. Module `cosmic-tetris`, `go 1.26`.
- `internal/fx` must not import `internal/render` or `internal/app`.
- CLI surface is exactly: no flags, `--seed N`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help`. Nothing else (§46, §49.5).
- ASCII mode emits only ASCII runes — glyphs, box drawing, flavor text and banners included (§32).
- The boring modes (`--no-fx`, `--ascii`) must still be a good game (§32, §47).
- Effects never modify game state; animations never block input (§44, §47).
- Boot drama lasts about one second and any key skips it; no menu (§29).
- The codebase should stay small enough to understand in an afternoon (§48). Do not add architecture beyond the files this plan names.

## Review Focus

1. A key pressed inside the very first boot frame — must skip cleanly into play, with no double initialisation and no lost key (Task 1).
2. Game over arriving while a banner, hyperdrive or supernova is mid-flight — the collapse must still start and finish, never wedge (Task 2).
3. `r` pressed partway through the collapse — restart must work from every sub-phase, including the final card (Task 2).
4. ASCII mode rendering a non-ASCII flavor message, banner or particle glyph — the ASCII guarantee has to cover text, not just blocks (Task 3).
5. A resize below the minimum while boot, help or the collapse is on screen — the too-small notice replaces the overlay without panicking (Task 3).

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
| `internal/render/boot.go` | the §29 boot screen and its reveal timeline |
| `internal/fx/collapse.go` | the §28 game-over collapse timeline and cell physics |
| `internal/render/collapse.go` | SIGNAL LOST, inward fall, black-hole art |
| `internal/flavor/messages.go` (modify) | the §45 occasional lines |
| `internal/fx/shootingstar.go` | the §45 idle shooting star |
| `README.md` | what it is, how to run it, flags, keys |

---

### Task 1: Boot sequence

**Files:**
- Create: `internal/render/boot.go`
- Modify: `internal/app/model.go` (start in `PhaseBoot`, add the spinner), `internal/app/update.go` (boot timing and skip), `internal/render/render.go` (boot branch), `internal/render/golden_test.go`
- Test: `internal/render/boot_test.go`, `internal/app/boot_test.go`

**Interfaces:**
- Consumes: Plan 2's `Canvas`, `Layout`, `Snapshot.Elapsed`, `PhaseBoot`.
- Produces:
```go
const BootDuration = 1100 * time.Millisecond
func DrawBoot(c *Canvas, l Layout, elapsed time.Duration, spinner string, o Options)
```

Reveal timeline, all text verbatim from §29:

| Elapsed | Revealed |
|---|---|
| 0ms | `✦`, `C O S M I C`, `T E T R I S` |
| 150ms | `INITIALIZING LOCAL UNIVERSE...` + spinner |
| 350ms | `gravity ........ OK` |
| 550ms | `spacetime ...... OK` |
| 750ms | `tetrominoes .... QUESTIONABLE` |
| 950ms | `UNIVERSE ONLINE` |
| 1100ms | boot ends, play starts |

App rules: `New` sets `Phase = PhaseBoot`. While booting, `FrameMsg` accumulates `Elapsed` and steps the FX world (stars drift behind the boot text) but never calls `Advance`. Any `tea.KeyPressMsg` during boot switches to `PhasePlaying` and is consumed — except `q`/`esc`, which still quit. Reaching `BootDuration` switches to `PhasePlaying` and resets `Elapsed` to 0 so gameplay chrome starts from zero. The spinner is `bubbles/v2/spinner` (§3: use Bubbles only where it helps — boot spinner is the named case).

- [ ] **Step 1: Write the failing tests**

```go
func TestBootRevealTimeline(t *testing.T)
// DrawBoot at 0ms contains "C O S M I C" and "T E T R I S" but not "gravity"
// at 400ms contains "gravity ........ OK" but not "spacetime"
// at 800ms contains "tetrominoes .... QUESTIONABLE" but not "UNIVERSE ONLINE"
// at 1000ms contains "UNIVERSE ONLINE"

func TestBootFitsSmallTerminals(t *testing.T)
// at 40x24 and 100x40, every line of the boot output is within the terminal width
// and the line count is within the height

func TestModelStartsInBoot(t *testing.T)
// New(...).Phase == PhaseBoot; the game does not advance: two FrameMsgs 900ms apart
// leave Active.Y unchanged

func TestAnyKeySkipsBoot(t *testing.T)
// a single tea.KeyPressMsg for "c" during boot => Phase == PhasePlaying,
// Elapsed == 0, and the hold was NOT used (the key is consumed by the skip)

func TestKeyInTheVeryFirstBootFrameSkipsCleanly(t *testing.T)
// key press before any FrameMsg => PhasePlaying, game intact, View() non-empty,
// and a following FrameMsg advances gravity normally

func TestQuitStillWorksDuringBoot(t *testing.T)
// "q" during boot returns a cmd producing tea.QuitMsg

func TestBootEndsOnItsOwn(t *testing.T)
// frames totalling 1.2s with no key => Phase == PhasePlaying and Elapsed restarted at ~100ms

func TestGoldenBoot(t *testing.T)   // 100x40 at 800ms, FX off => testdata/boot.txt
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run TestBoot -v && go test ./internal/app/ -run 'TestModelStarts|TestAnyKey|TestKeyInThe|TestQuitStill|TestBootEnds' -v`
Expected: FAIL — undefined `DrawBoot`.

- [ ] **Step 3: Implement `boot.go` and the app changes, then migrate the earlier app tests**

Plans 2–4's app tests assume the model starts playing. Add a test helper `skipBoot(t *testing.T, m *Model)` in `internal/app/helpers_test.go` that sets `Phase = PhasePlaying`, and call it in every existing app test that drives gameplay. Do not change production behaviour to keep old tests green.

- [ ] **Step 4: Create the golden and run everything**

Run: `go test ./internal/render/ -run TestGolden -update && go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/boot.go internal/render/render.go internal/render/boot_test.go internal/render/golden_test.go internal/render/testdata internal/app
git commit -m "feat(render): one second of excessive boot drama, skippable"
```

---

### Task 2: Game-over black hole collapse

**Files:**
- Create: `internal/fx/collapse.go`, `internal/render/collapse.go`
- Modify: `internal/fx/world.go` (`Observe` triggers on `GameOver`), `internal/app/update.go` (game-over input rules), `internal/render/render.go`
- Test: `internal/fx/collapse_test.go`, `internal/render/collapse_test.go`, `internal/app/gameover_test.go`

**Interfaces:**
- Consumes: Plan 1's `GameOver` event and `Board`; Plan 3's `World`.
- Produces:
```go
type CollapseCell struct {
    X, Y   float64
    VX, VY float64
    Kind   game.PieceKind
}
type Collapse struct {
    Age   float64
    Cells []CollapseCell
    Active bool
}
const (
    CollapseFreezeEnd = 0.30   // §28: 0–300ms everything freezes, "SIGNAL LOST"
    CollapseFallEnd   = 0.90   // 300–900ms blocks fall inward
    CollapseHoleEnd   = 1.30   // 900–1300ms board collapses into a black hole
)
func (w *World) TriggerCollapse(b *game.Board)
func (w *World) CollapseStage() int   // 0 freeze, 1 falling, 2 black hole, 3 finished, -1 inactive

// render
func DrawCollapse(c *Canvas, l Layout, w *fx.World, o Options)
var BlackHoleArt = []string{   // §28, verbatim
    "     ·     ",
    "   ˚       ",
    "  \\ | /    ",
    "--- ● ---  ",
    "  / | \\    ",
    "    *      ",
}
```

`TriggerCollapse` snapshots every occupied board cell into a `CollapseCell` whose velocity points at the board centre, with speed proportional to distance, so stage 1 looks like the stack falling inward. Stage 2 replaces the board with the black-hole art plus a swirl of `ClassEmber` particles. Stage 3 hands over to Plan 2's `DrawGameOver` card, which gains the `CAUSE: EXCESSIVE GEOMETRY` subtitle (§28).

App rules: entering `PhaseGameOver` calls `TriggerCollapse(&m.Game.Board)` exactly once. During the collapse, `r` restarts and `q`/`esc` quit; every other key is ignored. FX keeps stepping so the collapse animates; the engine is not advanced. The collapse runs to completion even if a banner, hyperdrive or supernova was live — those keep decaying independently.

- [ ] **Step 1: Write the failing tests**

```go
func TestCollapseStageTimeline(t *testing.T)
// TriggerCollapse(board): CollapseStage() is 0 at Age 0 and 0.29; 1 at 0.31 and 0.89;
// 2 at 0.91 and 1.29; 3 at 1.31

func TestCollapseSnapshotsEveryOccupiedCell(t *testing.T)
// a board with 37 occupied cells => len(Cells) == 37, each carrying its Kind

func TestCollapseCellsFallInward(t *testing.T)
// cells left of centre have VX > 0, right have VX < 0, above the centre row have VY > 0

func TestCollapseIgnoresFXDisabled(t *testing.T)
// Options{Enabled:false}: TriggerCollapse leaves CollapseStage() == -1 so the app
// falls straight through to the game-over card

func TestCollapseCompletesWhileOtherEffectsAreLive(t *testing.T)
// trigger a four-line bundle, then TriggerCollapse in the same frame:
// stepping 1.4s reaches stage 3 and no collection exceeds its cap

func TestSignalLostThenBlackHole(t *testing.T)   // render side
// stage 0 output contains "SIGNAL LOST"; stage 2 output contains "●" and the
// diagonal rays; stage 3 output contains "UNIVERSE EXPIRED" and "CAUSE: EXCESSIVE GEOMETRY"

func TestRestartWorksFromEveryCollapseStage(t *testing.T)   // app level
// for each stage 0..3: reach game over, step into that stage, press "r"
// => Phase == PhasePlaying, Score 0, empty board, CollapseStage() == -1

func TestOnlyRestartAndQuitDuringCollapse(t *testing.T)
// during stage 1, pressing left/right/space/c/p changes nothing about the game

func TestCollapseTriggersOnce(t *testing.T)
// several frames after game over => len(Collapse.Cells) never grows
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run TestCollapse -v`
Expected: FAIL — undefined `TriggerCollapse`.

- [ ] **Step 3: Implement `collapse.go`, `DrawCollapse` and the app rules**

- [ ] **Step 4: Create the golden and run everything**

Add `TestGoldenBlackHole` (100×40 at collapse Age 1.0, fixed fx seed) to the golden set, then:

Run: `go test ./internal/render/ -run TestGolden -update && go test ./... -v`
Expected: PASS; read `testdata/blackhole.txt` and confirm the universe looks properly dead.

- [ ] **Step 5: Commit**

```bash
git add internal/fx/collapse.go internal/fx/world.go internal/fx/collapse_test.go internal/render/collapse.go internal/render/render.go internal/render/collapse_test.go internal/render/testdata internal/app
git commit -m "feat(fx): game-over collapse into a simulated black hole"
```

---

### Task 3: ASCII and no-FX guarantees

**Files:**
- Modify: `internal/render/fx.go` (route every glyph through `ASCIISafe` in `ModeASCII`), `internal/render/spectacle.go`, `internal/render/collapse.go`, `internal/render/boot.go`, `internal/flavor/messages.go` (ASCII-safe variants), `internal/render/golden_test.go`
- Test: `internal/render/ascii_test.go`

**Interfaces:**
- Consumes: Plan 3's `ASCIISafe`.
- Produces:
```go
func ASCIIText(s string) string   // maps every non-ASCII rune in a string via ASCIISafe
```

Every text-emitting path in `ModeASCII` passes through `ASCIIText`: mission control lines, banners (`✦ EVENT HORIZON ✦`), the boot `✦`, the black-hole art, the level card, the HUD title. Glyph paths already use `ASCIISafe`.

- [ ] **Step 1: Write the failing tests**

```go
func TestEveryViewIsPureASCIIInASCIIMode(t *testing.T)
// For each state — boot, playing, paused, help, four-line clear mid-banner, each
// collapse stage, game-over card, too-small notice — and at 40x24 and 100x40:
// every rune of ansi.Strip(Render(..., Options{Mode: ModeASCII, FXEnabled: true})) is < 128

func TestASCIIModeKeepsTheBoardGeometry(t *testing.T)
// in ModeASCII the board rows are still BoardCols wide and blocks render "[]", ghosts ".."

func TestNoFXModeIsStillAGoodGame(t *testing.T)
// Options{FXEnabled:false} across the same states: output is non-empty, contains the
// board, HUD, next queue and controls, and contains no star, particle or trail glyph

func TestResizeBelowMinimumReplacesEveryOverlay(t *testing.T)
// for boot, help, paused, each collapse stage and the game-over card:
// Render at 34x19 shows "THIS UNIVERSE IS TOO SMALL" and nothing else, with no panic

func TestGoldenASCIIWide(t *testing.T)     // 100x40, ModeASCII, FX on, fixed fx seed
func TestGoldenASCIISmall(t *testing.T)    // 40x24, ModeASCII
func TestGoldenNoFXWide(t *testing.T)      // 100x40, ModeFull, FXEnabled false
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestEveryView|TestASCIIMode|TestNoFXMode|TestResizeBelow' -v`
Expected: FAIL — non-ASCII runes leak through banners and flavor text.

- [ ] **Step 3: Add `ASCIIText` and route every text path through it**

- [ ] **Step 4: Create the goldens and run everything**

Run: `go test ./internal/render/ -run TestGolden -update && go test ./... -v && go run ./cmd/cosmic-tetris --ascii --seed 1234 && go run ./cmd/cosmic-tetris --no-fx --seed 1234`
Expected: PASS; both boring modes play well and look intentional rather than broken.

- [ ] **Step 5: Commit**

```bash
git add internal/render internal/flavor
git commit -m "feat(render): guaranteed ASCII and no-FX modes"
```

---

### Task 4: The tiny details

**Files:**
- Create: `internal/fx/shootingstar.go`
- Modify: `internal/flavor/messages.go`, `internal/flavor/channel.go` (score-rollover detection), `internal/fx/world.go` (idle tracking)
- Test: `internal/fx/shootingstar_test.go`, `internal/flavor/details_test.go`

**Interfaces:**
- Consumes: Plan 3's `Channel`, `Messages`, `ForEvent`.
- Produces:
```go
// fx
const (ShootingStarChancePerSecond = 0.15; ShootingStarSpeed = 30.0)
func (w *World) maybeShootingStar(dt float64)   // called from Step; one ClassStar streak
                                                // crossing diagonally, life ~0.5s

// flavor — new single-line categories (§45)
const (
    CatKineticRod  Category = iota + 100   // "KINETIC ROD DEPLOYED"
    CatCubeSecured                         // "CUBE ADJACENT OBJECT SECURED"
    CatRollover                            // "NUMBER BECAME BIGGER"
)
func (c *Channel) noteScore(score int) bool   // true when the score crossed a power of ten >= 10000
```

`ForEvent` gains three cases, each ranking above `CatLock` and below `CatTetris`:
- `PieceHardDropped` whose `Piece.Kind == game.KindI` and `Piece.Rotation` is 1 or 3 → `CatKineticRod`.
- `HoldUsed` whose `Piece.Kind == game.KindO` → `CatCubeSecured`.
- a `GameView.Score` that crossed a power of ten at or above 10000 since the last observation → `CatRollover`.

`CatRare` (`DID YOU KNOW YOU'RE IN A TERMINAL?`) and the idle `CAPTAIN?` already exist from Plan 3. Plan 3's `TestEveryCategoryHasMessages` exempts `CatBoot`; extend that exemption to these three single-line categories.

- [ ] **Step 1: Write the failing tests**

```go
func TestShootingStarIsRareAndShortLived(t *testing.T)
// 60 seconds of 16ms steps with a fixed fx seed: between 3 and 25 shooting stars spawn;
// each lives under 1s; none exists after a further 2s of stepping

func TestShootingStarTravelsDiagonally(t *testing.T)
// a spawned shooting star has both VX != 0 and VY != 0 and Class == ClassStar

func TestNoShootingStarWhenFXDisabled(t *testing.T)

func TestKineticRodOnVerticalIHardDrop(t *testing.T)
// ForEvent(PieceHardDropped with Piece{KindI, Rotation:1}) => CatKineticRod
// Rotation 0 (horizontal) => not CatKineticRod
// a KindT vertical hard drop => not CatKineticRod

func TestCubeSecuredOnHoldingAnO(t *testing.T)
// ForEvent(HoldUsed with Piece{KindO}) => CatCubeSecured; KindS => CatHold

func TestScoreRolloverFiresOncePerDecade(t *testing.T)
// noteScore: 9_999 → false; 10_000 → true; 10_500 → false; 99_999 → false;
// 100_000 → true; 1_000 → false (below the 10_000 threshold)
// and the channel's Text() then contains "NUMBER BECAME BIGGER"

func TestRareLinesStayRare(t *testing.T)
// 1000 clear events with a fixed seed: the CatRare line appears at least once and
// fewer than 60 times (RareChance 0.02)

func TestDetailMessagesAreOccasionalNotConstant(t *testing.T)
// across a 3-minute simulated session, no single message occupies more than 25%
// of the frames in which the mission line was non-empty
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/fx/ -run TestShooting -v && go test ./internal/flavor/ -v`
Expected: FAIL — undefined `CatKineticRod`.

- [ ] **Step 3: Implement the shooting star and the three flavor cases**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/flavor
git commit -m "feat(flavor): shooting stars, kinetic rods, cube adjacency and number growth"
```

---

### Task 5: README and the definition-of-done sweep

**Files:**
- Create: `README.md`
- Test: `internal/render/flicker_test.go`, `internal/app/done_test.go`

**Interfaces:**
- Consumes: everything.
- Produces: the §47 gate. No new production API.

`README.md` covers: what Cosmic Tetris is (one paragraph, §48's framing), `go run ./cmd/cosmic-tetris`, `go build`, the five flags with one line each, the §8 key table, the three rendering modes, the architecture map from §33 with one line per package, and how to run the tests (`go test ./...`, `-update` for goldens).

- [ ] **Step 1: Write the failing tests**

```go
func TestRenderIsStableForIdenticalState(t *testing.T)
// the same Snapshot and Options rendered twice is byte-identical, for playing, paused,
// boot, help, collapse and game-over states — the renderer contributes no flicker (§47)

func TestNoFilesystemOrLoggingDuringGameplay(t *testing.T)
// a 600-frame session with heavy FX writes nothing to a redirected log.Default() output
// and opens no files (assert log output buffer stays empty) (§38)

func TestDefinitionOfDoneChecklist(t *testing.T)
// one table-driven test, one subtest per §47 bullet that can be asserted in code:
//   playable start → game over; hold; ghost; next queue; deterministic piece generation;
//   isolated game and FX RNGs; correct line clearing; gravity increases; pause; restart;
//   ASCII fallback; no-FX mode; resize; effects never modify game state;
//   animations never block input.
// Each subtest drives the app model and asserts the behaviour; none may be skipped.
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run TestRenderIsStable -v && go test ./internal/app/ -run 'TestNoFilesystem|TestDefinitionOfDone' -v`
Expected: FAIL — undefined tests / unmet assertions

- [ ] **Step 3: Fix whatever the checklist surfaces, then write `README.md`**

- [ ] **Step 4: Run the full gate**

Run:
```bash
gofmt -l . && go vet ./... && go test ./... && go test -race ./internal/game/ ./internal/fx/ && go build ./...
```
Expected: `gofmt` prints nothing, vet is clean, all tests pass, race detector clean, build succeeds.

- [ ] **Step 5: Run the §43 coolness acceptance test by hand**

Launch `go run ./cmd/cosmic-tetris --seed 8675309` and confirm, writing the result into the commit message:
- within 30 seconds of normal play: moving starfield, animated board border, piece trails, hard-drop impact, particles, mission-control commentary;
- on the first completed line: supernova clear animation, debris, border reaction;
- a four-line clear produces the §43 reaction;
- game over collapses the universe into a black hole;
- resizing the terminal mid-game never breaks or crashes it;
- `--ascii`, `--no-fx` and `--reduced-motion` each still play well.

- [ ] **Step 6: Commit**

```bash
git add README.md internal/render/flicker_test.go internal/app/done_test.go
git commit -m "docs: README and definition-of-done sweep"
```
