# Cosmic Tetris, Plan 3: Theatrics and Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the boot sequence, the game-over black hole, terminal-capability detection, responsive FX reduction, ASCII-mode verification, and the small rare flavor details — then run the §47 definition-of-done sweep and ship it.

**Architecture:** Two new app states (`StateBoot`, and a `StateCollapsing` sub-phase of game over) drive scripted timelines that live entirely in `internal/fx` and `internal/render`; the engine is untouched. FX intensity gains a single scalar that layout drives, so the effects thin out on small terminals through one code path rather than a dozen conditionals.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2` (`help` and `key` for the flight manual). No new dependencies.

**Spec:** `design.md` (this repo root). Sections 28–32, 39, 41, 42 Phase 5, 45, 47.

**Prerequisite:** Plans 1 and 2 complete.

## Global Constraints

- The engine stays untouched: `internal/game` gains no new code in this plan, keeps no clock read, and gains no import.
- Any key skips the boot sequence (§29). No menu is required.
- Game over does not instantly replace the board; the collapse runs on its own timeline (§28).
- Effects automatically reduce outside the board on small terminals (§31).
- ASCII mode makes no special Unicode assumptions beyond the one §49.4 ghost exception recorded in Plan 1 (§32).
- Optional flavor details stay *occasional* — never a constant stream (§45).
- Restraint rules §44 continue to hold: nothing obscures the active piece, controls never lag, animation never delays gameplay.
- Terminal output must not visibly flicker under normal conditions (§47).
- The final CLI surface is exactly the five flags of §49.5. Nothing else is necessary (§46).
- Every task ends with tests passing and a commit. `go vet ./...` and `gofmt -l .` clean before each commit.

## Review Focus

1. **Resize during a scripted timeline.** A `WindowSizeMsg` mid-boot or mid-collapse must not panic, must not restart the timeline, and must not leave the board mid-shift. → Task 1 and Task 2.
2. **Keys during the collapse.** `r` and `q` must work the instant game over starts; other keys must be inert and must not restart the animation or double-register a restart. → Task 2.
3. **Terminal capability lies.** `NO_COLOR` set, `TERM=dumb`, or a terminal claiming 256 colors while the profile says truecolor — mode detection must degrade rather than emit escapes the terminal will print literally. → Task 3.
4. **Restart from a non-playing state.** `r` pressed during boot, while paused, mid-collapse, and on the game-over card must all land in the same clean playing state. → Task 2.
5. **Wide-character and width accounting in ASCII mode.** A single multi-byte glyph leaking into ASCII mode makes every border row ragged; the check must cover FX glyphs, banners, mission-control copy, and overlay panels, not just the board. → Task 4.

---

## File Structure

| File | Responsibility |
|---|---|
| `internal/fx/boot.go` | Boot timeline state and the checklist reveal |
| `internal/fx/collapse.go` | Game-over collapse: freeze, inward fall, black hole |
| `internal/render/boot.go` | Boot screen drawing |
| `internal/render/collapse.go` | Collapse and black-hole drawing |
| `internal/render/overlay.go` (modify) | Flight manual via `bubbles/help`; final game-over card |
| `internal/render/palette.go` (modify) | Capability detection for `ModeFull` vs `ModeReduced` |
| `internal/fx/world.go` (modify) | `Intensity` scalar driven by layout |
| `internal/flavor/messages.go` (modify) | §45 rare lines and their trigger conditions |
| `internal/app/update.go`, `model.go` (modify) | `StateBoot`, collapse phase, restart-from-anywhere |

---

### Task 1: Boot sequence

**Files:**
- Create: `internal/fx/boot.go`, `internal/render/boot.go`
- Modify: `internal/app/model.go`, `internal/app/update.go`
- Test: `internal/fx/boot_test.go`, `internal/render/boot_test.go`, `internal/app/boot_test.go`

**Interfaces:**
- Consumes: `fx.World`, `render.Scene`, `app.AppState`.
- Produces:
  - `type Boot struct { Age time.Duration }`; `func (w *World) StartBoot()`; `func (w *World) BootProgress() (elapsed time.Duration, done bool)`
  - `const BootDuration = 1000 * time.Millisecond` (§29: approximately one second)
  - `func RenderBoot(elapsed time.Duration, width, height int, m Mode, fxv FXView) string` in `render`
  - `app.StateBoot` added to `AppState`; `app.New` now starts in `StateBoot`

- [ ] **Step 1: Write the failing tests**

In `internal/fx/boot_test.go`:
- `TestBootStartsAtZero`: after `StartBoot()`, `BootProgress()` -> `(0, false)`
- `TestBootCompletes`: after `Advance` totaling `BootDuration`, `BootProgress()` -> `done == true`
- `TestBootStarfieldRunsDuringBoot`: stars move during boot (§29's drama is over a live starfield)

In `internal/render/boot_test.go`:
- `TestBootShowsTitle`: at 400ms, output contains `C O S M I C` and `T E T R I S` (§29's exact spacing)
- `TestBootShowsInitializing`: at 400ms, output contains `INITIALIZING LOCAL UNIVERSE...`
- `TestBootChecklistRevealsProgressively`: `gravity ........ OK` appears before `spacetime ...... OK`, which appears before `tetrominoes .... QUESTIONABLE`; at 200ms fewer lines are present than at 800ms (§29)
- `TestBootFinalLine`: at `BootDuration`, output contains `UNIVERSE ONLINE`
- `TestBootFitsSmallTerminal`: at `40×24`, every line's `lipgloss.Width <= 40` and the line count is `<= 24`
- `TestBootAtTooSmallSize`: at `20×10`, `RenderBoot` returns without panic — **Review Focus 1**
- `TestGoldenBoot`: at `80×30`, mid-boot output matches `testdata/boot.golden`

In `internal/app/boot_test.go`:
- `TestModelStartsInBoot`: `New(Options{}).State` -> `StateBoot`
- `TestBootAdvancesToPlaying`: `FrameMsg`s totaling `BootDuration` -> `State == StatePlaying`
- `TestBootIgnoresGravity`: during boot, the game does not advance — `Active.Y == SpawnY` and `Score == 0` after 900ms of frames
- `TestAnyKeySkipsBoot`: an `x` key press during boot -> `State == StatePlaying` immediately (§29)
- `TestQuitDuringBootStillQuits`: `q` during boot -> `tea.Quit`, not a skip-into-play
- `TestBootThenImmediatePlay`: right after the skip, a left-key press moves the piece (§29: "and immediately start")
- `TestResizeDuringBootDoesNotRestartIt`: a `WindowSizeMsg` at 500ms -> `BootProgress()` elapsed is still ~500ms — **Review Focus 1**

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ ./internal/app/ -run 'TestBoot|TestAnyKey|TestModelStarts|TestQuitDuringBoot|TestResizeDuringBoot|TestGoldenBoot' -v`
Expected: FAIL, `undefined: StartBoot`.

- [ ] **Step 3: Implement**

Checklist reveal keyframes, pinned so the tests and the code agree: title at 0ms, `INITIALIZING` at 250ms, `gravity` at 450ms, `spacetime` at 600ms, `tetrominoes` at 750ms, `UNIVERSE ONLINE` at 950ms. `q`/`esc` are checked before the any-key skip. With `--no-fx` the boot screen still draws (it is content, not an effect) but without stars.

- [ ] **Step 4: Run tests to verify they pass, then look at it**

```bash
go test ./... -v && go run ./cmd/cosmic-tetris
```

One second of excessive drama, then play. Press a key immediately and confirm it skips cleanly.

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render internal/app
git commit -m "feat: one second of excessive boot drama"
```

---

### Task 2: Game-over collapse and black hole

**Files:**
- Create: `internal/fx/collapse.go`, `internal/render/collapse.go`
- Modify: `internal/render/overlay.go`, `internal/app/update.go`
- Test: `internal/fx/collapse_test.go`, `internal/render/collapse_test.go`, `internal/app/gameover_test.go`

**Interfaces:**
- Produces:
  - `type CollapsePhase uint8` with `CollapseNone = 0, CollapseFreeze = 1, CollapseInward = 2, CollapseSingularity = 3, CollapseDone = 4` — the numeric values matter, because the phase travels to the renderer as a `uint8`
  - `func (w *World) StartCollapse(cells []game.Cell)`; `func (w *World) CollapsePhase() CollapsePhase`
  - Phase boundaries, from §28: `CollapseFreeze` 0–300ms, `CollapseInward` 300–900ms, `CollapseSingularity` 900–1300ms, then `CollapseDone`
  - `render` owns the view type, so `render` still never imports `fx`: `type CollapseView struct { Phase uint8; Cells []ParticleCell; Age time.Duration }` and `func RenderCollapse(v CollapseView, width, height int, m Mode) string`
  - `render.FXView` gains one method: `Collapse() (CollapseView, bool)`, implemented on `*fx.World`
  - `app.AppState` gains `StateCollapsing`

- [ ] **Step 1: Write the failing tests**

In `internal/fx/collapse_test.go`:
- `TestCollapseStartsFrozen`: at 100ms, `CollapsePhase()` -> `CollapseFreeze` and every cell is at its original position (§28: everything freezes)
- `TestCollapsePhaseBoundaries`: phase at 250ms is `CollapseFreeze`, at 500ms `CollapseInward`, at 1000ms `CollapseSingularity`, at 1400ms `CollapseDone` (§28's exact timings)
- `TestCellsFallInward`: at 600ms, the mean distance of cells from the board center is less than at 350ms (§28: blocks fall inward toward the center)
- `TestCellsConverge`: at 1250ms, nearly all cells are within a few cells of the center
- `TestSingularityGlyphs`: during `CollapseSingularity`, the emitted glyph set includes `'●'` and the `\ | / - /  | \` spokes of §28's diagram
- `TestCollapseIsSeeded`: same seed and same input cells -> identical collapse
- `TestEmptyBoardCollapse`: `StartCollapse(nil)` -> reaches `CollapseDone` without panic
- `TestReducedMotionShortensCollapse`: with `ReducedMotion`, the collapse still runs but without shake; it still reaches `CollapseDone` (§49.5 suppresses shake, not the sequence)

In `internal/render/collapse_test.go`:
- `TestCollapseShowsSignalLost`: during the freeze phase, output contains `SIGNAL LOST` (§28)
- `TestCollapseKeepsBoardBorder`: during all phases, the board border is still 22 lines of width 22
- `TestBlackHoleCentered`: during the singularity phase, `●` appears once, centered in the board area
- `TestFinalCardCopy`: the game-over card contains `UNIVERSE EXPIRED`, `SCORE`, `LINES`, `LEVEL`, `r  REBOOT UNIVERSE`, `q  ACCEPT COSMIC DEATH` (§28)
- `TestFinalCardFormatsScore`: `Score == 483200` renders as `483,200`; `Lines == 127` as `127`; `Level == 13` as `13` (§28's mockup uses thousands separators on the final card, unlike the in-game zero-padded HUD)
- `TestFinalCardSubtitle`: contains `CAUSE: EXCESSIVE GEOMETRY`
- `TestGoldenCollapse`: at `80×30`, mid-singularity output matches `testdata/collapse.golden`
- `TestCollapseAtSmallSize`: at `40×24`, the collapse and the final card both fit within the bounds

In `internal/app/gameover_test.go`:
- `TestGameOverEntersCollapsing`: a `GameOver` event -> `State == StateCollapsing`, not `StateGameOver`
- `TestCollapseAdvancesToGameOver`: frames totaling 1300ms -> `State == StateGameOver` and the final card renders
- `TestRestartDuringCollapse`: `r` at 400ms into the collapse -> `StatePlaying`, fresh game, and the collapse is cleared — **Review Focus 2 and 4**
- `TestQuitDuringCollapse`: `q` at 400ms -> `tea.Quit` — **Review Focus 2**
- `TestOtherKeysDuringCollapseAreInert`: left/rotate/hard-drop/hold/`p` during the collapse change nothing and do not restart the timeline — **Review Focus 2**
- `TestDoubleRestartIsIdempotent`: two `r` presses in a row -> one clean playing game, score 0 — **Review Focus 4**
- `TestRestartFromEveryState`: for each of `StateBoot`, `StatePlaying`, `StatePaused`, `StateCollapsing`, `StateGameOver`, pressing `r` yields `State == StatePlaying`, `Score == 0`, an empty board, and `ShowHelp == false` — **Review Focus 4**
- `TestResizeDuringCollapseDoesNotRestartIt`: a `WindowSizeMsg` mid-collapse leaves the phase and age intact — **Review Focus 1**
- `TestNoFXGameOverGoesStraightToCard`: with `NoFX`, a `GameOver` event -> `StateGameOver` immediately, no collapse (the boring mode is still a good game, §32)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ ./internal/render/ ./internal/app/ -run 'TestCollapse|TestGameOver|TestRestart|TestQuitDuring|TestOtherKeys|TestDoubleRestart|TestBlackHole|TestFinalCard|TestSingularity|TestCellsFall|TestCellsConverge|TestEmptyBoard' -v`
Expected: FAIL.

- [ ] **Step 3: Implement**

`StartCollapse` snapshots the filled cells into particles with zero velocity, then in `CollapseInward` accelerates each toward the board center with a force proportional to distance, and in `CollapseSingularity` shrinks the remaining spread while drawing the §28 spoke diagram over the convergence point. `app` calls `StartCollapse(m.Game.FilledCells())` — add that tiny read-only accessor to `game.Board` if it does not exist; it returns a fresh slice and mutates nothing.

Restart handling moves into one place: `m.Restart()` (Plan 1 Task 17) additionally clears the FX world's collapse, boot, banner, and particle state, so `r` behaves identically from every state.

- [ ] **Step 4: Run tests to verify they pass, then look at it**

```bash
go test ./... -v && go run ./cmd/cosmic-tetris --seed 1
```

Stack out on purpose. The universe should collapse into a black hole before the card appears (§47).

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render internal/app
git commit -m "feat: collapse the universe into a black hole on game over"
```

---

### Task 3: Terminal capability detection

**Files:**
- Modify: `internal/render/palette.go`, `cmd/cosmic-tetris/main.go`
- Test: `internal/render/detect_test.go`

**Interfaces:**
- Produces: `func DetectMode(ascii bool, profile lipgloss.Profile, noColor bool) Mode` — the testable core; `ParseMode(ascii bool)` (Plan 1 Task 11) becomes a thin wrapper that reads the real profile and `NO_COLOR`.

- [ ] **Step 1: Write the failing tests in `internal/render/detect_test.go`**

- `TestASCIIFlagAlwaysWins`: `DetectMode(true, truecolor, false)` -> `ModeASCII`
- `TestTruecolorGivesFull`: `DetectMode(false, lipgloss.TrueColor, false)` -> `ModeFull`
- `TestANSI256GivesReduced`: `DetectMode(false, lipgloss.ANSI256, false)` -> `ModeReduced`
- `TestANSI16GivesReduced`: `DetectMode(false, lipgloss.ANSI, false)` -> `ModeReduced`
- `TestNoColorGivesASCII`: `DetectMode(false, lipgloss.TrueColor, true)` -> `ModeASCII` — **Review Focus 3**; `NO_COLOR` means no color, and a colorless Unicode board reads worse than the ASCII set
- `TestAsciiProfileGivesASCII`: `DetectMode(false, lipgloss.Ascii, false)` -> `ModeASCII` (`TERM=dumb`) — **Review Focus 3**
- `TestReducedEmitsNoTruecolorEscapes`: render a scene in `ModeReduced` and assert the raw (un-stripped) output contains no `38;2;` sequence — **Review Focus 3**
- `TestASCIIEmitsNoEscapesBeyond16Color`: in `ModeASCII`, the raw output contains no `38;5;` or `38;2;` sequence
- `TestDetectIsPure`: `DetectMode` reads no environment itself — call it 100 times with fixed arguments and assert a stable result

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestDetect|TestASCIIFlag|TestTruecolor|TestANSI|TestNoColor|TestReducedEmits' -v`
Expected: FAIL, `undefined: DetectMode`.

- [ ] **Step 3: Implement**

`ParseMode` reads `lipgloss.ColorProfile()` and `os.Getenv("NO_COLOR") != ""` and delegates. Verify the `ModeReduced` styles genuinely use `lipgloss.Color` values in the 0–255 range, since that is what `TestReducedEmitsNoTruecolorEscapes` checks.

- [ ] **Step 4: Run tests to verify they pass, then check by hand**

```bash
go test ./... -v
NO_COLOR=1 go run ./cmd/cosmic-tetris
TERM=dumb go run ./cmd/cosmic-tetris
```

Neither should print literal escape sequences or garbled glyphs.

- [ ] **Step 5: Commit**

```bash
git add internal/render cmd
git commit -m "feat(render): terminal capability detection with NO_COLOR and dumb-terminal fallbacks"
```

---

### Task 4: ASCII mode end to end

**Files:**
- Modify: `internal/fx/particle.go`, `internal/fx/starfield.go`, `internal/fx/banner.go`, `internal/fx/collapse.go`, `internal/render/*`
- Test: `internal/render/ascii_test.go`, `internal/render/testdata/ascii-*.golden`

**Interfaces:**
- Produces: `func ASCIIGlyph(r rune) rune` in `render` — the single mapping table from every Unicode FX glyph to an ASCII stand-in; `fx` glyph choices pass through it when `Mode == ModeASCII`. `render.Scene`/`FXView` cell types gain no fields; the substitution happens at render time so `fx` stays mode-agnostic.

- [ ] **Step 1: Write the failing tests in `internal/render/ascii_test.go`**

- `TestASCIIGlyphTableCoversEveryFXGlyph`: enumerate every rune used by `fx` (stars `. · ˚ ✦ ✧ *`, debris `· * ✦ +`, trails `█ ▓ ▒ ░`, shockwaves `· ○ ◌ ◯`, singularity `● \ | / -`, board `██ ░░`, borders `╔ ═ ╗ ║ ╚ ╝ ╭ ─ ╮ ╰ ╯`) and assert `ASCIIGlyph` maps each to a rune `< 128`
- `TestASCIIGlyphIdentityForASCII`: `ASCIIGlyph('*')` -> `'*'`
- `TestEveryASCIIGlyphIsSingleWidth`: every value in the table has `lipgloss.Width == 1` — **Review Focus 5**
- `TestFullSceneASCIIIsSevenBit`: render a scene at `80×30` in `ModeASCII` with a fully loaded FX world (stars, particles, a live banner, an active supernova, a shockwave, a shake) and assert every rune in the stripped output is `< 128` except the §49.4 `·` ghost — **Review Focus 5**
- `TestASCIIBannerCopyIsSevenBit`: `✦ EVENT HORIZON ✦` renders in ASCII mode without the `✦` (substituted or dropped), and its width still fits
- `TestASCIIOverlaysAreSevenBit`: pause, help, game-over, and too-small panels in `ModeASCII` contain no rune `>= 128`
- `TestASCIIBoardRowsAlignAtEverySize`: for sizes `40..120 × 24..50` (step 9) in `ModeASCII`, every rendered line's `lipgloss.Width` equals its `utf8.RuneCountInString` — i.e. nothing wide slipped in — **Review Focus 5**
- `TestGoldenASCIIWithFX`: `80×30`, FX loaded, matches `testdata/ascii-fx.golden`
- `TestGoldenASCIISmall`: `40×24` matches `testdata/ascii-small.golden`
- `TestGoldenASCIIGameOver`: the game-over card in ASCII matches `testdata/ascii-gameover.golden`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestASCII|TestEveryASCII|TestFullScene|TestGoldenASCII' -v`
Expected: FAIL, `undefined: ASCIIGlyph`.

- [ ] **Step 3: Implement `ASCIIGlyph` and route FX glyphs through it**

Suggested mapping: stars `. · ˚` → `.`, `✦ ✧` → `*`; trails `█ ▓ ▒ ░` → `# = - .`; shockwaves `○ ◌ ◯` → `o`; singularity `●` → `@`; box-drawing → `+ - |`. Apply the mapping in the one place each glyph reaches a cell, not scattered per effect.

- [ ] **Step 4: Generate goldens, inspect, verify**

```bash
go test ./internal/render/ -run TestGolden -update && go test ./... -v
go run ./cmd/cosmic-tetris --ascii
```

Read the new goldens. Borders must be straight and the board exactly 22 columns on every row. Play a minute in `--ascii`: it must still be a good game.

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/render
git commit -m "feat(render): ASCII glyph substitution across every effect"
```

---

### Task 5: Responsive FX reduction

**Files:**
- Modify: `internal/fx/world.go`, `internal/app/update.go`
- Test: `internal/fx/intensity_test.go`

**Interfaces:**
- Produces: `func (w *World) SetIntensity(v float64)` with `v` in `[0,1]`; `func (w *World) Intensity() float64`; `func IntensityFor(l render.Layout) float64` in `fx`.

- [ ] **Step 1: Write the failing tests in `internal/fx/intensity_test.go`**

- `TestIntensityByLayout`: `IntensityFor(render.Compute(80,30))` -> `1.0`; `Compute(50,26)` -> `0.6`; `Compute(40,24)` -> `0.35`
- `TestIntensityClamped`: `SetIntensity(-1)` -> `0`; `SetIntensity(5)` -> `1`
- `TestLowIntensityReducesStarCount`: at intensity `0.35`, `len(Stars())` is under half the count at `1.0` (§31: effects automatically reduce outside the board)
- `TestLowIntensityReducesParticleBursts`: a hard drop at `0.35` emits fewer particles than at `1.0`, but more than zero
- `TestBoardEffectsSurviveLowIntensity`: at `0.35`, the supernova and the ghost still render in full — the board is the visual center and its effects are not what gets thinned (§4, §31)
- `TestIntensityZeroStillPlayable`: `SetIntensity(0)` -> no stars, no particles, but trails and the animated border remain and the game renders
- `TestAppSetsIntensityOnResize`: a `WindowSizeMsg{40,24}` -> the FX world's intensity is `0.35`; `{80,30}` -> `1.0`
- `TestIntensityDoesNotAffectGameplay`: a scripted 200-step session at intensity `0.35` and at `1.0` produces identical `Score`, `Lines`, and `Board` (§44)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/fx/ -run 'TestIntensity|TestLowIntensity|TestBoardEffectsSurvive|TestAppSets' -v`
Expected: FAIL, `undefined: SetIntensity`.

- [ ] **Step 3: Implement**

Intensity scales star count (via `Resize`'s count formula) and burst counts. Board-local effects — supernova, trails, ghost, border — are exempt, which is what `TestBoardEffectsSurviveLowIntensity` pins.

- [ ] **Step 4: Run tests to verify they pass, then resize by hand**

```bash
go test ./... -v && go run ./cmd/cosmic-tetris
```

Drag the terminal from wide to 40×24 and back while playing. No crash, no flicker, and the background visibly calms down as it shrinks.

- [ ] **Step 5: Commit**

```bash
git add internal/fx internal/app
git commit -m "feat(fx): scale effect intensity to terminal size"
```

---

### Task 6: Flight manual via Bubbles, and the rare flavor details

**Files:**
- Modify: `internal/render/overlay.go`, `internal/flavor/messages.go`, `internal/flavor/channel.go`, `internal/app/keys.go`
- Test: `internal/render/help_test.go`, `internal/flavor/rare_test.go`

**Interfaces:**
- Produces:
  - `func RenderHelp(width, height int, hm help.Model, k KeyMapView) string` where `type KeyMapView interface { FullHelp() [][]key.Binding }` — `render` takes the interface so it does not import `app` (§39: use the Bubbles key/help primitives). This **widens** Plan 1 Task 15's `RenderHelp(width, height int)`; update the `Scene`-composition call site and regenerate `testdata/help.golden`. `app.KeyMap` already satisfies `KeyMapView` via Plan 1 Task 16's `FullHelp`.
  - `render.Scene` gains `Keys KeyMapView` and `Help help.Model`, which `app.Model` populates; both may be zero-valued, in which case `RenderHelp` falls back to the Plan 1 static panel
  - `func (c *Channel) HandleRare(ev RareEvent)`; `type RareEvent uint8` with `RareIdleNoMove, RareVerticalIDrop, RareHoldO, RareScoreRollover, RareTerminalAwareness, RareShootingStar`
  - `func (w *World) MaybeShootingStar()` — called by the world's own idle timer

- [ ] **Step 1: Write the failing tests in `internal/render/help_test.go`**

- `TestHelpUsesBubblesHelp`: `RenderHelp` output contains every §8 binding's key and description, sourced from `FullHelp()` rather than a hand-written string
- `TestHelpCopy`: contains `FLIGHT MANUAL`, `move spacecraft`, `accelerate doom`, `rotate geometry`, `rotate other way`, `YEET`, `quantum storage`, `suspend spacetime`, `reboot universe`, `abandon mission`, `close this nonsense` (§39, verbatim)
- `TestHelpFitsSmallTerminal`: at `40×24`, every line fits and the panel is not clipped mid-border
- `TestHelpDoesNotPauseTheGame`: covered in Plan 1 Task 17; re-assert here that `RenderHelp` is pure and takes no game state

In `internal/flavor/rare_test.go`:
- `TestVerticalIDropMessage`: `HandleRare(RareVerticalIDrop)` -> `Current()` is `KINETIC ROD DEPLOYED` (§45)
- `TestHoldOMessage`: `RareHoldO` -> `CUBE ADJACENT OBJECT SECURED`
- `TestScoreRolloverMessage`: `RareScoreRollover` -> `NUMBER BECAME BIGGER`
- `TestLongIdleMessage`: `RareIdleNoMove` -> `MISSION CONTROL: CAPTAIN?`
- `TestTerminalAwarenessIsRare`: over 10 000 seeded opportunities, `RareTerminalAwareness` fires between 1 and 50 times — extremely rare, but not never (§45)
- `TestRareMessagesRespectCooldown`: a rare event inside the hold window does not preempt a major message
- `TestRareDetectionInApp`: hard-dropping a vertical I triggers `RareVerticalIDrop`; hard-dropping a horizontal I does not; holding an O triggers `RareHoldO`
- `TestIdleTriggersAfterNoInput`: 20s of frames with no key press -> `RareIdleNoMove` fired exactly once, not repeatedly (§45: these remain occasional)
- `TestShootingStarIsOccasional`: over 60s of seeded frames, shooting stars occur between 1 and 20 times (§45)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ ./internal/flavor/ -run 'TestHelp|TestRare|TestVerticalI|TestHoldO|TestScoreRollover|TestLongIdle|TestTerminalAwareness|TestIdleTriggers|TestShootingStar' -v`
Expected: FAIL.

- [ ] **Step 3: Implement**

Rare-event detection lives in `app.handleEvents`, where both the event and the piece are available: a `PieceHardDropped` with `Piece.Kind == KindI` and `Rotation` odd is the kinetic rod; a `HoldUsed` with `KindO` is the cube. Score rollover fires when the score crosses a power of ten. The idle timer resets on any gameplay key.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render internal/flavor internal/app
git commit -m "feat: flight manual via Bubbles help, plus the rare flavor lines"
```

---

### Task 7: Definition-of-done sweep

**Files:**
- Modify: `README.md`, and whatever the sweep turns up
- Test: `internal/render/render_test.go` (extend), `internal/app/session_test.go`

**Interfaces:**
- Consumes: everything. Produces no new API.

- [ ] **Step 1: Write the failing tests in `internal/app/session_test.go`**

These are the §47 checklist items no earlier task's tests cover as a whole-program property.

- `TestFullSessionStartToGameOver`: from `New(Options{Seed: 1})`, drive boot → play → game over → final card entirely through `Update`, asserting each state transition happens exactly once
- `TestFXNeverModifiesGameOverAWholeSession`: during that session, snapshot the game before and after every FX call -> unchanged (§47)
- `TestGameAndFXRNGRemainIsolated`: two sessions with identical seeds and identical input streams but different FX intensities produce identical piece orders (§47)
- `TestOutputIsStableBetweenIdenticalFrames`: two consecutive `View()` calls with no elapsed time produce byte-identical output — the flicker precondition (§47: no visible flicker)
- `TestNoPanicOverAFuzzedSession`: 5 000 pseudo-random messages (keys, resizes from `0×0` to `300×100`, frames with `dt` from 0 to 60s) -> no panic and the model stays in a valid state
- `TestAllFiveFlagCombinations`: for the 8 combinations of `ASCII`/`NoFX`/`ReducedMotion`, a 300-step scripted session produces identical `Score`, `Lines`, and `Board` (§47: effects never modify game state)

- [ ] **Step 2: Run tests to verify they fail, then fix what they find**

Run: `go test ./internal/app/ -run 'TestFullSession|TestFXNever|TestGameAndFX|TestOutputIsStable|TestNoPanic|TestAllFive' -v`
Expected: FAIL initially. Fix the product, not the test.

- [ ] **Step 3: Walk the §47 checklist by hand and record the result in the README**

```bash
go test ./... -count=2 && go vet ./... && gofmt -l . && go build ./...
go run ./cmd/cosmic-tetris --seed 8675309
```

Confirm each line of §47 in a real terminal: playable start to game over, immediate controls, resize, hold, ghost, next queue, deterministic pieces, isolated RNGs, correct clearing, rising gravity, pause, restart, ASCII fallback, no-FX mode, no flicker, animations never blocking input, four-line clears gloriously excessive, black-hole game over, fun without effects, much funnier with them. Anything that fails becomes a fix in this task, not a note.

- [ ] **Step 4: Finish the README**

Sections: the pitch, a screenshot or a pasted frame, install/build, the five-flag CLI surface with what each does, the §8 controls table, "how it's put together" (the four packages and the one-way dependency rule), the two recorded deviations (single `FrameMsg` instead of §36's separate `GravityMsg`; the §49.4 ASCII ghost being Latin-1), and how to run the tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: definition-of-done sweep and README"
```

---

## Done when

- Every line of §47 is verified — by a test where it is testable, by hand in a real terminal where it is not.
- `go test ./... -count=2`, `go vet ./...`, `gofmt -l .`, and `go build ./...` are all clean.
- The five-flag CLI surface of §49.5 is exactly what `--help` prints.
- `internal/game` still reads no clock and imports nothing beyond the standard library.
- A four-line clear still produces the §43 reaction.
