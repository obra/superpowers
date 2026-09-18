### Task 5: Key map and the Bubble Tea model

**Files:**
- Modify: `go.mod` (add the Charm dependencies)
- Create: `internal/app/keys.go`
- Create: `internal/app/messages.go`
- Create: `internal/app/model.go`
- Test: `internal/app/keys_test.go`
- Test: `internal/app/model_test.go`

**Interfaces:**
- Consumes: `render.Render`, `render.Frame`, `render.Compute`, `render.Options`
  (Tasks 2–4); `game.New` (plan 1).
- Produces:
  ```go
  // keys.go — built on charm.land/bubbles/v2/key
  type KeyMap struct {
      Left, Right, SoftDrop, RotateCW, RotateCCW, HardDrop,
      Hold, Pause, Restart, Help, Quit key.Binding
  }
  func DefaultKeyMap() KeyMap
  func (k KeyMap) ShortHelp() []key.Binding
  func (k KeyMap) FullHelp() [][]key.Binding

  // messages.go
  type FrameMsg struct { Now time.Time }
  func frameTick() tea.Cmd   // ~16ms, the single animation clock (§36)

  // model.go
  type AppState int
  const (StatePlaying AppState = iota; StatePaused; StateGameOver)
  // plan 3 adds StateBoot before StatePlaying

  type Model struct {
      Game     *game.Game
      Width    int
      Height   int
      State    AppState
      ShowHelp bool
      Opts     render.Options
      Keys     KeyMap
      Status   string

      lastFrame time.Time
  }
  func NewModel(g *game.Game, opts render.Options) Model
  func (m Model) View() string
  ```
  Plan 3 adds an `FX *fx.World` parameter to `NewModel` and a `StateBoot`
  constant; keep `NewModel` the single construction path so that change is
  one-line.
  Bindings (§8, plus the §8 WASD aliases):

  | action | keys |
  |---|---|
  | left | `left`, `h`, `a` |
  | right | `right`, `l`, `d` |
  | soft drop | `down`, `j`, `s` |
  | rotate CW | `up`, `k`, `x`, `w` |
  | rotate CCW | `z` |
  | hard drop | `space` |
  | hold | `c` |
  | pause | `p` |
  | restart | `r` |
  | help | `?` |
  | quit | `q`, `esc` |

  Help text for each binding is the §39 flavor copy: `move spacecraft`,
  `accelerate doom`, `rotate geometry`, `rotate other way`, `YEET`,
  `quantum storage`, `suspend spacetime`, `reboot universe`,
  `abandon mission`, `close this nonsense`.

- [ ] **Step 1: Add the dependencies**

Run: `go get charm.land/bubbletea/v2 charm.land/lipgloss/v2 charm.land/bubbles/v2`
Then `go doc charm.land/bubbletea/v2 Model` and
`go doc charm.land/bubbletea/v2 KeyPressMsg` — record the actual v2 `Model`
interface in a comment at the top of `model.go` and conform to it.

- [ ] **Step 2: Write the failing tests in `internal/app/keys_test.go`**

```go
func TestEveryActionHasItsSpecKeys(t *testing.T)
// table-driven over the binding table above: key.Matches(keyPress(s), binding)
// is true for each listed key and false for keys of other actions

func TestNoKeyIsBoundToTwoActions(t *testing.T)
// collect every key string across all bindings; assert no duplicates
// ("s" is soft drop, not restart; "d" is right, not hard drop)

func TestHelpTextUsesTheFlightManualCopy(t *testing.T)
// each binding's Help().Desc matches the §39 copy table
```

- [ ] **Step 3: Write the failing tests in `internal/app/model_test.go`**

```go
func TestNewModelStartsPlaying(t *testing.T)
// State == StatePlaying, !ShowHelp, Game not nil, Status is non-empty

func TestViewDelegatesToRenderer(t *testing.T)
// m with Width/Height 80x30: View() equals render.Render(render.Frame{...})
// built from the same fields — assert string equality

func TestViewBeforeFirstResizeDoesNotPanic(t *testing.T)
// Width == 0 && Height == 0: View() returns a non-panicking string
// (Bubble Tea sends WindowSizeMsg after the first render on some terminals)
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `go test ./internal/app/ -v`
Expected: build failure — `undefined: DefaultKeyMap`.

- [ ] **Step 5: Implement `keys.go`, `messages.go`, and `model.go`**

`frameTick` uses `tea.Tick(16*time.Millisecond, ...)` returning a `FrameMsg`.
`View` computes the layout from `Width`/`Height` and hands a `Frame` to
`render.Render`; treat a zero size as too-small rather than special-casing it.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add go.mod go.sum internal/app/
git commit -m "feat(app): key map, frame message, and Bubble Tea model"
```
