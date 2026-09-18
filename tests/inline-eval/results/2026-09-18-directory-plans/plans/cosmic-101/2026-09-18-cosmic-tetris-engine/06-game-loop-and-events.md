### Task 6: Game state, event stream, gravity and locking

**Files:**
- Create: `internal/game/events.go`
- Create: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces:
```go
// events.go
type EventKind uint8
const (
    PieceMoved EventKind = iota
    PieceRotated
    PieceHardDropped
    PieceLocked
    HoldUsed
    LinesCleared
    ComboChanged
    LevelChanged
    GameOver
)
func (k EventKind) String() string

type Event struct {
    Kind  EventKind
    Piece Piece  // the piece the event is about, where meaningful
    Rows  []int  // LinesCleared: the cleared row indices, ascending
    Cells int    // PieceHardDropped: rows travelled
    Value int    // ComboChanged: new combo. LevelChanged: new level. LinesCleared: points awarded.
}

// game.go
type Input uint8
const (
    InputLeft Input = iota
    InputRight
    InputSoftDrop
    InputRotateCW
    InputRotateCCW
    InputHardDrop
    InputHold
)

type Game struct {
    Board   Board
    Active  Piece
    Hold    *PieceKind
    CanHold bool
    Next    []PieceKind   // always length NextCount
    Bag     *Bag

    Score, Lines, Level, Combo int

    GravityAccumulator time.Duration
    LockAccumulator    time.Duration
    Grounded           bool
    LockResets         int
    Over               bool

    Seed int64
    rng  *rand.Rand
}

const (
    NextCount    = 5
    LockDelay    = 500 * time.Millisecond
    MaxLockResets = 15
)

func New(seed int64) *Game                          // seeded rng, filled Next queue, first piece spawned, Level 1
func (g *Game) Apply(in Input) []Event              // player action; takes effect immediately
func (g *Game) Advance(dt time.Duration) []Event    // elapsed-time gravity and lock delay
func (g *Game) Ghost() Piece                        // Landing(&g.Board, g.Active)
```

`InputHold` is implemented in Task 7 and `Over`/`GameOver` in Task 8; this task wires the rest and leaves hold returning no events.

The one algorithm the signatures do not determine — `Advance`:

```text
if g.Over || dt <= 0: return nil
GravityAccumulator += dt
interval := GravityInterval(g.Level)
for GravityAccumulator >= interval:
    GravityAccumulator -= interval
    if piece can move down one:
        move, emit PieceMoved, Grounded = false
    else:
        Grounded = true
        break                       // stop consuming gravity while grounded
if Grounded:
    LockAccumulator += dt
    if LockAccumulator >= LockDelay || LockResets >= MaxLockResets:
        emit lock pipeline
```

Lock pipeline (§12), in order: place the piece, emit `PieceLocked`; `CompleteRows`; if non-empty `ClearRows`, add `LineScore + ComboBonus` to `Score`, add to `Lines`, emit `LinesCleared` with `Value` = points awarded; update `Combo` (increment on a clearing placement, reset to 0 otherwise) and emit `ComboChanged` when it changed; recompute `LevelFor(Lines)` and emit `LevelChanged` when it changed; then spawn the next piece (reset `LockAccumulator`, `LockResets`, `Grounded`, `CanHold = true`, refill `Next` from `Bag`).

A successful `Apply` move or rotation while `Grounded` sets `LockAccumulator = 0` and increments `LockResets` (§12).

- [ ] **Step 1: Write the failing test**

`internal/game/game_test.go`:

```go
func TestNewGameInitialState(t *testing.T)
// New(1): Level == 1, Score == 0, Lines == 0, Combo == 0, len(Next) == NextCount,
// Hold == nil, CanHold == true, Active == Spawn(<first bag piece>)

func TestApplyLeftRightEmitsPieceMoved(t *testing.T)
// Apply(InputLeft) shifts Active.X by -1 and returns one PieceMoved event
// repeated Apply(InputLeft) at the wall returns no events and does not move

func TestApplyRotateEmitsPieceRotated(t *testing.T)
// Apply(InputRotateCW) on a KindT increments Rotation and emits PieceRotated

func TestSoftDropScoresAndResetsGravity(t *testing.T)
// Apply(InputSoftDrop) moves down one, Score += 1, GravityAccumulator == 0

func TestHardDropScoresLocksAndSpawns(t *testing.T)
// on a fresh game, d := DropDistance(...) before the drop
// Apply(InputHardDrop) returns PieceHardDropped{Cells: d} then PieceLocked
// Score == 2*d, Active is a new piece at spawn position, board has 4 filled cells

func TestGravityDropsOnePerInterval(t *testing.T)
// Advance(GravityInterval(1)) moves Active down exactly one row

func TestLargeDtAppliesEveryDrop(t *testing.T)   // Review Focus
// Advance(5 * GravityInterval(1)) on a fresh game moves Active down 5 rows
// and returns 5 PieceMoved events

func TestZeroAndNegativeDtAreNoOps(t *testing.T)   // Review Focus
// snapshot Active and accumulators; Advance(0) and Advance(-time.Second)
// both return nil and leave Active, GravityAccumulator, LockAccumulator unchanged

func TestLockDelayHoldsThenLocks(t *testing.T)
// hard-drop-free setup: Advance enough to ground the piece (piece resting on floor)
// Advance(400ms): piece not yet locked (board still empty)
// Advance(200ms): PieceLocked emitted, board has 4 filled cells

func TestMoveWhileGroundedResetsLockTimer(t *testing.T)
// ground the piece, Advance(400ms), Apply(InputLeft) succeeds
// LockAccumulator == 0, LockResets == 1; Advance(400ms) has still not locked

func TestMaxLockResetsForcesLock(t *testing.T)
// ground the piece, alternate Apply(InputLeft)/Apply(InputRight) 15 times
// the next Advance(1ms) locks the piece

func TestLineClearScoresAndRaisesLevel(t *testing.T)
// build a board with 9 cells of row 21 filled and lines == 9, then lock a piece completing it
// LinesCleared event with Rows == []int{21}; Lines == 10; LevelChanged event with Value == 2
// Score increased by LineScore(1, level-at-clear)

func TestComboResetsOnNonClearingPlacement(t *testing.T)
// clear one line (Combo == 1, ComboChanged emitted), then lock a piece clearing nothing
// Combo == 0 and a ComboChanged{Value: 0} event is emitted
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run TestNewGame -v`
Expected: FAIL — `undefined: New`.

- [ ] **Step 3: Implement `internal/game/events.go` and `internal/game/game.go`**

Follow the `Advance` and lock-pipeline sketches above. Append events to a reusable slice per call; `Apply` and `Advance` are the only exported mutators.

Tests that need a contrived board write directly to `g.Board.Cells` and set `g.Lines` before acting — keep that pattern consistent across the file.

- [ ] **Step 4: Run the tests**

Run: `go test ./internal/game/ -v`
Expected: PASS, all of Tasks 1–6.

- [ ] **Step 5: Commit**

```bash
git add internal/game/events.go internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game state, event stream, gravity and lock delay"
```
