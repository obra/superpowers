### Task 1: FX world skeleton, snapshot, and the isolation guarantees

**Files:**
- Create: `internal/fx/world.go`
- Create: `internal/fx/events.go`
- Create: `internal/fx/rules.go`
- Test: `internal/fx/world_test.go`
- Test: `internal/fx/isolation_test.go`

**Interfaces:**
- Consumes: `game.Event`, `game.EventKind`, `game.PieceKind`, `game.Width`,
  `game.Height`, `game.HiddenRows` (plan 1).
- Produces:
  ```go
  // rules.go: the pinned timing and capacity constants from the header.

  // events.go
  type Snapshot struct {
      Level, Combo, Score, Lines int
      ActiveKind  game.PieceKind
      ActiveCells [4][2]int   // board coords
      GhostY      int
      Over        bool
  }
  func SnapshotOf(g *game.Game) Snapshot   // the only place fx touches a *Game,
                                          // and it only reads

  // world.go
  type Config struct {
      Enabled       bool
      ReducedMotion bool
      ASCII         bool
  }

  type World struct { /* rng, cfg, size, effect state */ }
  func NewWorld(seed int64, cfg Config) *World
  func (w *World) Config() Config
  func (w *World) Resize(width, height int)
  func (w *World) Size() (width, height int)
  func (w *World) Observe(events []game.Event, snap Snapshot)
  func (w *World) Advance(dt time.Duration)
  func (w *World) Elapsed() time.Duration   // total simulated time, for phases
  ```
  `Observe` records what happened; `Advance` moves the simulation. Both are
  no-ops for `dt <= 0` / empty input, and cheap no-ops when `!cfg.Enabled`.

- [ ] **Step 1: Write the failing tests in `internal/fx/world_test.go`**

```go
func TestNewWorldStartsEmpty(t *testing.T)
// no particles, no stars until Resize, Elapsed() == 0

func TestAdvanceAccumulatesElapsed(t *testing.T)
// Advance(16ms) ×10 -> Elapsed() == 160ms

func TestZeroAndNegativeDtAreNoOps(t *testing.T)

func TestObserveWithNoEventsChangesNothing(t *testing.T)
// deep-equal the getter outputs before and after Observe(nil, snap)

func TestDisabledWorldStaysInert(t *testing.T)
// Config{Enabled:false}: after Observe of every EventKind and Advance(2s),
// Particles/Stars/Trails/Shockwaves are empty, Shake() == (0,0),
// Banner() reports absent, Status() == ""

func TestResizeUpdatesSize(t *testing.T)
```

- [ ] **Step 2: Write the failing isolation audits in `internal/fx/isolation_test.go`**

```go
func TestFXHoldsNoGamePointer(t *testing.T)   // §14
// parse the non-test .go files in internal/fx with go/parser; assert no
// struct field or stored value of type *game.Game or game.Board appears
// (SnapshotOf's parameter is a function argument, which is allowed)

func TestFXNeverReadsTheClock(t *testing.T)
// no "time.Now" or "time.Since" in internal/fx non-test sources

func TestFXDoesNotImportRenderOrApp(t *testing.T)
// no import path containing "internal/render" or "internal/app"

func TestSnapshotOfCopiesNotAliases(t *testing.T)
// take SnapshotOf(g), then mutate g (move and hard-drop): the snapshot's
// fields are unchanged
```

- [ ] **Step 3: Run both test files to verify they fail**

Run: `go test ./internal/fx/ -v`
Expected: build failure — `undefined: NewWorld`.

- [ ] **Step 4: Implement `rules.go`, `events.go`, and `world.go`**

`NewWorld` seeds `rand.New(rand.NewSource(seed))` — callers pass a seed derived
from, but not equal to, the game seed (Task 13 pins how). `Observe` stores a
copy of the latest snapshot and dispatches each event to the per-effect handlers
that later tasks add; for now it records counts so the tests above can observe
inertness.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/
git commit -m "feat(fx): world skeleton, snapshot value type, isolation audits"
```
