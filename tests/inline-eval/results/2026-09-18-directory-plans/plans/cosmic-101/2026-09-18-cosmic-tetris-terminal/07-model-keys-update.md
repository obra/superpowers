### Task 7: Model, key map, and the frame loop

**Files:**
- Create: `internal/app/model.go`
- Create: `internal/app/keys.go`
- Create: `internal/app/messages.go`
- Create: `internal/app/update.go`
- Test: `internal/app/update_test.go`

**Interfaces:**
- Consumes: `Config` (Task 1); `render.Scene`, `render.Phase`, `render.Options`, `render.ResolveMode` (Task 2), `render.Render` (Task 6); `game.New`, `Game.Apply`, `Game.Advance`, `Game.Reset`, `Game.Snapshot`, `game.Input*`, `game.Event` (plan 1).
- Produces:
```go
// messages.go
type FrameMsg struct{ Now time.Time }
func frameCmd() tea.Cmd   // tea.Tick(FrameInterval, func(t time.Time) tea.Msg { return FrameMsg{t} })
const FrameInterval = 16 * time.Millisecond

// keys.go
type KeyMap struct {
    Left, Right, SoftDrop, RotateCW, RotateCCW, HardDrop,
    Hold, Pause, Restart, Help, Quit key.Binding
}
func DefaultKeyMap() KeyMap
func (k KeyMap) Input(s string) (game.Input, bool)  // key string -> engine input

// model.go
type Model struct {
    Game   *game.Game
    Cfg    Config
    Phase  render.Phase
    Width  int
    Height int

    LastFrame time.Time
    Keys      KeyMap
    Mission   string
    Elapsed   time.Duration
}
func New(cfg Config) *Model
func (m *Model) Scene() render.Scene

// update.go
func (m *Model) handleKey(s string) tea.Cmd   // returns tea.Quit for the quit binding, nil otherwise
func (m *Model) handleFrame(now time.Time)    // dt = now - LastFrame, clamped to MaxFrameDt, then Game.Advance
const MaxFrameDt = 100 * time.Millisecond
```

`Model` also implements the Bubble Tea `Model` interface (`Init`, `Update`, `View`) with whatever signatures the installed v2 declares. `Update` routes `FrameMsg` to `handleFrame` and re-arms `frameCmd`, key messages to `handleKey`, and window-size messages to `Width`/`Height`. `View` returns `render.Render(m.Scene())`.

`handleKey` applies engine inputs immediately — it never defers work to the next frame. Key bindings (§8):

```text
left:      left, h, a          right:     right, l, d
softdrop:  down, j, s          rotateCW:  up, k, x, w
rotateCCW: z                   harddrop:  space
hold:      c                   pause:     p
restart:   r                   help:      ?
quit:      q, esc, ctrl+c
```

`FrameMsg` is the only message type this plan defines. §36 also sketches `GravityMsg` and `GameEventMsg`, but §36 itself prefers one animation clock, and the engine returns its events synchronously from `Apply` and `Advance` — so a second timer and an event message would both be dead weight. If a later need appears, it goes in `messages.go` beside `FrameMsg`.

`MaxFrameDt` clamps a resumed-from-suspend gap so the player does not lose a stack to a laptop lid. It is a presentation-layer decision: the engine still applies exactly the `dt` it is handed.

Phases: `Paused` freezes gameplay — `handleFrame` accumulates `Elapsed` but skips `Game.Advance`. `p` toggles `PhasePlaying`/`PhasePaused`. `r` calls `Game.Reset()` and returns to `PhasePlaying` from any phase. Inputs other than pause/restart/help/quit are ignored unless `Phase == PhasePlaying`. `GameOver` in the returned events sets `Phase = render.PhaseGameOver`.

- [ ] **Step 1: Write the failing test**

`internal/app/update_test.go`:

```go
func TestKeyAppliesImmediately(t *testing.T)
// m := New(Config{Seed: 1}); x := m.Game.Active.X
// m.handleKey("left"); m.Game.Active.X == x-1   // no FrameMsg in between

func TestBurstOfKeysAllApply(t *testing.T)   // Review Focus
// send "left","left","left" with no frame between; Active.X == x-3
// then "up","up": Active.Rotation == 2

func TestAliasKeysMatchArrows(t *testing.T)
// "h"/"a" behave as "left"; "l"/"d" as "right"; "j"/"s" as "down"; "k"/"x"/"w" as "up"

func TestUnknownKeyIsIgnored(t *testing.T)   // Review Focus
// before := m.Game.Snapshot(); m.handleKey("F13") returns nil cmd
// m.Game.Snapshot() equals before and Phase is unchanged

func TestQuitKeys(t *testing.T)   // Review Focus
// "q", "esc", "ctrl+c" each return a non-nil cmd

func TestFrameAdvancesByElapsed(t *testing.T)
// m.LastFrame = t0; m.handleFrame(t0.Add(800*time.Millisecond))
// Active.Y advanced by exactly 1 (one level-1 gravity interval)

func TestFrameDtIsClamped(t *testing.T)
// m.handleFrame(t0.Add(10*time.Second)); Active.Y advanced by no more than
// what MaxFrameDt earns, and LastFrame == the passed time

func TestPauseFreezesGameplay(t *testing.T)
// m.handleKey("p"); before := m.Game.Snapshot()
// m.handleFrame(t0.Add(time.Second)); Snapshot equals before; Elapsed grew

func TestRestartResetsAndResumes(t *testing.T)
// play a few inputs, pause, m.handleKey("r")
// Phase == render.PhasePlaying and Score == 0

func TestGameOverEventSetsPhase(t *testing.T)
// contrive a board that ends the game on the next lock, hard drop
// Phase == render.PhaseGameOver
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/app/ -run TestKeyApplies -v`
Expected: FAIL — `undefined: New` / `undefined: handleKey`.

- [ ] **Step 3: Implement `messages.go`, `keys.go`, `model.go`, `update.go`**

Use `charm.land/bubbles/v2/key` for `key.Binding` (its help text is what Task 9 of plan 4 renders). `KeyMap.Input` matches against the bindings rather than a second copy of the key strings.

- [ ] **Step 4: Point `main.go` at the real model**

Replace the Task 1 placeholder with `app.New(cfg)`. Before constructing it, resolve the render mode from terminal capability: `cfg.Mode = render.ResolveMode(cfg.Mode, truecolor)` where `truecolor` is `os.Getenv("COLORTERM")` equal to `"truecolor"` or `"24bit"`.

- [ ] **Step 4b: Play it**

Run: `go run ./cmd/cosmic-tetris --seed 1234` and play a few pieces. Confirm by hand what tests cannot: movement feels immediate, the board does not flicker, the ghost sits where the piece lands, `p` pauses, `r` restarts, `q` quits cleanly, and resizing the window mid-game neither panics nor garbles the frame. Note anything that feels wrong before moving on.

- [ ] **Step 5: Run the tests**

Run: `go test ./... && go vet ./...`
Expected: PASS, clean.

- [ ] **Step 6: Commit**

```bash
git add internal/app cmd
git commit -m "feat(app): model, key map, and single-clock frame loop"
```
