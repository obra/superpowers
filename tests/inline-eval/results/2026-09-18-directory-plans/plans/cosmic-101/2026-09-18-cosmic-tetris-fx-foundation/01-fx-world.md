### Task 1: FX world skeleton and the isolation contract

**Files:**
- Create: `internal/fx/events.go`
- Create: `internal/fx/world.go`
- Test: `internal/fx/world_test.go`

**Interfaces:**
- Consumes: `game.Event`, `game.EventKind` (plan 1 Task 6).
- Produces:
```go
// events.go — what FX is allowed to know about the game
type Snapshot struct {
    Level, Combo, Score int
    BoardW, BoardH      int   // in cells: 10 × 20 visible
}

type Config struct {
    Enabled       bool   // false with --no-fx (the app then keeps World nil)
    ReducedMotion bool   // suppresses shake, hyperdrive acceleration, shockwaves (§49.5)
}

// world.go
type World struct {
    cfg  Config
    rng  *rand.Rand
    snap Snapshot

    width, height int   // viewport in terminal cells
    elapsed       time.Duration
    // particles, stars, trails added in Tasks 2, 3, 6
}

func NewWorld(seed int64, cfg Config) *World  // rng = rand.New(rand.NewSource(seed))
func (w *World) Resize(width, height int)
func (w *World) Observe(evs []game.Event, snap Snapshot)
func (w *World) Step(dt time.Duration)        // ignores dt <= 0
func (w *World) StepPaused(dt time.Duration)  // stars only, at PausedStarFactor (§30)
func (w *World) Elapsed() time.Duration
func (w *World) Snap() Snapshot

const PausedStarFactor = 0.25
```

The app constructs this with `fx.NewWorld(cfg.Seed+1, fx.Config{...})` — the `+1` is the whole of §49.6's RNG isolation, so it lives at the one call site rather than inside `NewWorld`.

`Observe` stores the snapshot and dispatches each event to the handlers Tasks 2–6 and plan 4 add. It never returns anything: FX is a sink.

- [ ] **Step 1: Write the failing test**

`internal/fx/world_test.go`:

```go
func TestNewWorldIndependentRNG(t *testing.T)
// g := game.New(7); w := NewWorld(7+1, Config{Enabled: true})
// draw 20 values from w.rng; the game's first 20 bag draws are unchanged from
//   a game.New(7) that had no World at all (compare Snapshot of both games after
//   an identical script) — FX consuming randomness cannot shift piece order

func TestObserveStoresSnapshot(t *testing.T)
// Observe(nil, Snapshot{Level: 4, Combo: 2, BoardW: 10, BoardH: 20})
// w.Snap() returns that value

func TestObserveDoesNotMutateGame(t *testing.T)
// g := game.New(3); evs := g.Apply(game.InputHardDrop); before := g.Snapshot()
// w.Observe(evs, snapshotOf(g)); g.Snapshot() equals before

func TestStepIgnoresNonPositiveDt(t *testing.T)
// Step(0) and Step(-time.Second) leave Elapsed() unchanged

func TestStepAccumulatesElapsed(t *testing.T)
// three Step(16ms) calls: Elapsed() == 48ms

func TestResizeStoresViewport(t *testing.T)
// Resize(80, 30) then Resize(-4, -4): no panic; a following Step does not panic
```

Add the test helper used across this package:

```go
func snapshotOf(g *game.Game) Snapshot   // {Level, Combo, Score from g; BoardW: game.Width, BoardH: game.VisibleRows}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/fx/ -v`
Expected: FAIL — `undefined: NewWorld`.

- [ ] **Step 3: Implement `internal/fx/events.go` and `internal/fx/world.go`**

Clamp `width`/`height` to at least 0 in `Resize`. `Observe` is a `switch ev.Kind` with one branch per handler; leave the branches Tasks 2–6 fill as empty cases for now.

- [ ] **Step 4: Run the tests**

Run: `go test ./... && go vet ./...`
Expected: PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add internal/fx
git commit -m "feat(fx): world skeleton with isolated RNG and read-only snapshot"
```
