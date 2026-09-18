### Task 6: Update loop — frame clock, input, resize

**Files:**
- Create: `internal/app/update.go`
- Test: `internal/app/update_test.go`

**Interfaces:**
- Consumes: `Model`, `KeyMap`, `FrameMsg`, `frameTick` (Task 5); the whole
  `game.Game` input API (plan 1).
- Produces:
  ```go
  func (m Model) Init() (tea.Model, tea.Cmd)              // conform to the installed v2 signature
  func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd)

  // Extracted so tests drive the engine without a Bubble Tea runtime:
  func (m *Model) handleKey(s string) tea.Cmd   // s is the key's String()
  func (m *Model) advance(dt time.Duration)     // gravity + event handling
  ```
  Rules:
  - `Init` starts exactly one `frameTick`; `FrameMsg` handling re-arms it. One
    clock only (§36).
  - `FrameMsg` computes `dt = msg.Now.Sub(m.lastFrame)`, stores `msg.Now`, and
    calls `m.advance(dt)`. The first `FrameMsg` after a zero `lastFrame` uses
    `dt = 0`. `dt` is clamped to 250ms so a suspended process does not dump
    seconds of gravity into one frame.
  - Key presses act immediately inside `Update`, never deferred to the tick
    (§8, §44).
  - `WindowSizeMsg` updates `Width`/`Height` only. Never touches the game.
  - `q`/`esc` returns `tea.Quit`. `p` toggles `StatePlaying`↔`StatePaused`.
    `r` calls `game.Restart()` and returns to `StatePlaying`. `?` toggles
    `ShowHelp`.
  - While `StatePaused` or `StateGameOver`, gameplay keys and gravity are inert
    (Task 7 tests the overlay side).
  - `GameOver` in the returned events sets `State = StateGameOver`.

- [ ] **Step 1: Write the failing tests in `internal/app/update_test.go`**

```go
func TestInitStartsExactlyOneTick(t *testing.T)
// Init() returns a non-nil Cmd; executing it yields a FrameMsg

func TestFrameMsgAdvancesGravityByElapsedTime(t *testing.T)
// t0 := time.Unix(0,0); m.lastFrame = t0
// send FrameMsg{t0.Add(800*time.Millisecond)} -> the active piece moved down 1

func TestFirstFrameUsesZeroDt(t *testing.T)
// fresh model (lastFrame zero): one FrameMsg does not move the piece

func TestFrameMsgReArmsTheTick(t *testing.T)
// the Cmd returned for a FrameMsg produces another FrameMsg

func TestLongGapIsClampedToTwoFiftyMilliseconds(t *testing.T)
// FrameMsg 30s after lastFrame: the piece falls at most 250ms worth of rows

func TestMultipleKeyPressesInOneFrameAllApply(t *testing.T)
// from X=3: handleKey("left"), handleKey("left"), handleKey("right") with no
// FrameMsg between them -> X == 2, and each press produced its move

func TestEveryGameplayKeyReachesTheEngine(t *testing.T)
// left/right change X; down increases Score by 1; up changes Rotation;
// z changes Rotation the other way; space locks the piece (board gains 4 cells);
// c sets Hold

func TestWASDAliasesWork(t *testing.T)
// "a","d","s","w" behave as left/right/soft-drop/rotate-CW

func TestPauseFreezesGravityAndInput(t *testing.T)
// handleKey("p"); FrameMsg 5s later -> piece unmoved; handleKey("left") -> X unmoved

func TestPauseTogglesBack(t *testing.T)
// second "p" returns State to StatePlaying and gravity resumes, using the new
// frame time (no 5s catch-up burst)

func TestRestartResetsTheGameAndState(t *testing.T)
// play, reach StateGameOver via a forced Over, handleKey("r") ->
// State == StatePlaying, Score == 0, board empty

func TestQuitKeysReturnTeaQuit(t *testing.T)   // "q" and "esc"

func TestWindowSizeMsgOnlyChangesDimensions(t *testing.T)
// send WindowSizeMsg{100,40}: Width/Height updated, Score/board/Active identical

func TestShrinkBelowMinimumAndBackPreservesTheGame(t *testing.T)
// resize to 20x10, send a FrameMsg, resize to 80x30: same Score, same Active,
// State still StatePlaying, and View() renders the board again

func TestGameOverEventSwitchesState(t *testing.T)
// stack the board so a hard drop ends the game: State == StateGameOver

func TestGravityStopsAfterGameOver(t *testing.T)
// further FrameMsgs change nothing
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/app/ -v`
Expected: build failure — `m.Update undefined`.

- [ ] **Step 3: Implement `internal/app/update.go`**

`handleKey` switches on `key.Matches` against `m.Keys`, guarded by `m.State`.
`advance` calls `m.Game.Advance(dt)` and scans the returned events for
`game.GameOver`; plan 3 extends `advance` to forward events to the FX world.
Keep the state guards in one place so Task 7 has a single seam.

Holding left/right relies on the terminal's own key-repeat — do not add a repeat
timer (§8's "input should feel responsive independently from the animation tick"
is satisfied by acting on arrival).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/app/update.go internal/app/update_test.go
git commit -m "feat(app): single-clock update loop with immediate input and safe resize"
```
