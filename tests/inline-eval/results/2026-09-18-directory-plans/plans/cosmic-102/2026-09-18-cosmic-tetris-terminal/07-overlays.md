### Task 7: Help, pause, and game-over overlays

**Files:**
- Create: `internal/render/overlay.go`
- Modify: `internal/render/render.go` (compose overlays)
- Modify: `internal/app/update.go` (overlay key gating)
- Test: `internal/render/overlay_test.go`
- Test: `internal/app/overlay_keys_test.go`

**Interfaces:**
- Consumes: `Canvas`, `Layout`, `Frame` (Tasks 1–4); `AppState` (Task 5).
- Produces:
  ```go
  type Overlay int
  const (OverlayNone Overlay = iota; OverlayHelp; OverlayPaused; OverlayGameOver)

  // Frame gains one field:
  //   Overlay Overlay
  func DrawOverlay(c *Canvas, l Layout, o Overlay, g *game.Game, opt Options)
  ```
  Overlays are centered boxes drawn over the finished frame; they never resize
  or move the board. Copy is pinned from §28, §30, §39:

  - Help (§39): titled `╭─ FLIGHT MANUAL ─…╮`, one row per binding using the
    `KeyMap` help copy. Built with `bubbles/v2/help` fed by `KeyMap.FullHelp()`.
  - Pause (§30): `TEMPORAL SUSPENSION` / `SPACE IS PAUSED` / `p  resume`.
  - Game over (§28): `UNIVERSE EXPIRED`, then `SCORE  483,200` (comma-grouped),
    `LINES  127`, `LEVEL  13`, then `r  REBOOT UNIVERSE` and
    `q  ACCEPT COSMIC DEATH`. Subtitle `CAUSE: EXCESSIVE GEOMETRY`.
  - Box borders use `╭ ─ ╮ │ ╰ ╯` in full/reduced, `+ - |` in ASCII.

  Key gating, added to `handleKey`:
  - `OverlayHelp` shown: only `?`, `p`, `q`/`esc` act. Gameplay keys are inert.
  - `StatePaused`: only `p`, `q`/`esc`, `?`.
  - `StateGameOver`: only `r`, `q`/`esc`, `?`.

- [ ] **Step 1: Write the failing tests in `internal/render/overlay_test.go`**

```go
func TestHelpOverlayListsEveryBinding(t *testing.T)
// ANSI-stripped output contains "FLIGHT MANUAL" and every §39 description line

func TestPauseOverlayCopy(t *testing.T)
// contains "TEMPORAL SUSPENSION", "SPACE IS PAUSED", "p  resume"

func TestGameOverOverlayShowsFinalStats(t *testing.T)
// Score 483200, Lines 127, Level 13 -> "UNIVERSE EXPIRED", "SCORE  483,200",
// "LINES  127", "LEVEL  13", "r  REBOOT UNIVERSE", "q  ACCEPT COSMIC DEATH"

func TestOverlayIsCenteredAndInsideTheTerminal(t *testing.T)
// for each overlay at 40x24, 56x26, 80x30, 200x60: every overlay line lies
// within the canvas and the frame still has exactly Height lines

func TestOverlayDoesNotMoveTheBoard(t *testing.T)
// render with OverlayNone and with OverlayPaused; the board border's top-left
// glyph is at the same coordinates in both

func TestOverlayTruncatesGracefullyAtMinimumSize(t *testing.T)
// 40x24 help overlay: no line exceeds 40 display columns

func TestASCIIOverlayBordersAreASCII(t *testing.T)

func TestOverlayNoneDrawsNothing(t *testing.T)
```

- [ ] **Step 2: Write the failing tests in `internal/app/overlay_keys_test.go`**

```go
func TestHelpBlocksGameplayKeys(t *testing.T)
// ShowHelp true: handleKey("left"), ("space"), ("c") change nothing;
// handleKey("?") closes it

func TestPausedAcceptsOnlyPauseHelpQuit(t *testing.T)
// paused: "left","right","space","c","r" inert; "p" resumes; "q" quits

func TestGameOverAcceptsOnlyRestartHelpQuit(t *testing.T)
// game over: "left","space","c","p" inert; "r" restarts; "q" quits

func TestOverlayForStateIsDerivedNotStored(t *testing.T)
// m.overlay() returns OverlayHelp when ShowHelp (even while paused),
// OverlayPaused when StatePaused, OverlayGameOver when StateGameOver,
// OverlayNone otherwise
```

- [ ] **Step 3: Run both test files to verify they fail**

Run: `go test ./... -run 'Overlay|Help|Pause|GameOver' -v`
Expected: build failure — `undefined: DrawOverlay`.

- [ ] **Step 4: Implement `overlay.go`, the `Frame.Overlay` field, and the key gating**

`Render` calls `DrawOverlay` after the HUD and before returning. `Model.View`
sets `Frame.Overlay` from `m.overlay()`. Precedence when several apply: help,
then game over, then pause.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/render/overlay.go internal/render/render.go internal/render/overlay_test.go internal/app/
git commit -m "feat: help, pause, and game-over overlays with key gating"
```
