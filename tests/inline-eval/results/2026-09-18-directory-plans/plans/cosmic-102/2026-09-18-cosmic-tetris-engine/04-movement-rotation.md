### Task 4: Game state, events, movement, rotation, ghost

**Files:**
- Create: `internal/game/game.go`
- Create: `internal/game/rules.go`
- Create: `internal/game/events.go`
- Test: `internal/game/movement_test.go`

**Interfaces:**
- Consumes: `Board`, `Piece`, `Bag`, `Spawn`, `Offsets` (Tasks 1–3).
- Produces:
  ```go
  // events.go
  type EventKind int
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
      Piece Piece  // the piece involved, post-change, where meaningful
      Rows  []int  // LinesCleared: the cleared row indices
      Count int    // LinesCleared: rows cleared. ComboChanged: new combo.
                   // LevelChanged: new level. PieceHardDropped: cells fallen.
  }

  // rules.go
  const (
      LockDelay        = 500 * time.Millisecond
      MaxLockResets    = 15
      BaseDropInterval = 800 * time.Millisecond
      MinDropInterval  = 60 * time.Millisecond
      GravityFactor    = 0.86
      SoftDropPoints   = 1
      HardDropPoints   = 2
      NextQueueLen     = 5
  )
  var WallKicks = [8][2]int{{0,0},{-1,0},{1,0},{-2,0},{2,0},{0,-1},{-1,-1},{1,-1}}

  // game.go
  type Game struct {
      Board   Board
      Active  Piece
      Hold    *PieceKind
      CanHold bool
      Next    []PieceKind  // exactly NextQueueLen entries

      Score, Lines, Level, Combo int

      GravityAccumulator, LockAccumulator time.Duration
      LockResets int
      Grounded   bool
      Over       bool

      Seed int64
      bag  *Bag
      rng  *rand.Rand
  }

  func New(seed int64) *Game
  func (g *Game) MoveLeft() []Event
  func (g *Game) MoveRight() []Event
  func (g *Game) RotateCW() []Event
  func (g *Game) RotateCCW() []Event
  func (g *Game) GhostY() int    // Active.Y of the resting position
  ```
  Later tasks add `Advance`, `SoftDrop`, `HardDrop`, `UseHold`, `Restart` to `Game`.

- [ ] **Step 1: Write the failing tests in `internal/game/movement_test.go`**

```go
func TestNewGameStartsPlayable(t *testing.T)
// g := New(99): Level == 1, Score == 0, Lines == 0, Combo == 0, !Over,
// CanHold, Hold == nil, len(Next) == NextQueueLen, Active == Spawn(<first bag kind>)

func TestMoveLeftAndRightEmitPieceMoved(t *testing.T)
// from Active.X == 3: MoveLeft() -> one PieceMoved event, Active.X == 2
//                     MoveRight() -> one PieceMoved event, Active.X == 3

func TestMoveBlockedByWallEmitsNoEvent(t *testing.T)
// place Active at X=0: MoveLeft() returns no events and X stays 0

func TestMoveBlockedByLockedCellsEmitsNoEvent(t *testing.T)
// fill the cell to the piece's left; MoveLeft() returns no events

func TestRotateCWAdvancesRotation(t *testing.T)
// KindT at open position: RotateCW() -> one PieceRotated, Rotation == 1
// four RotateCW() calls return to Rotation == 0

func TestRotateCCWWraps(t *testing.T)
// Rotation 0 -> RotateCCW() -> Rotation 3

func TestRotationWallKicksOffTheLeftWall(t *testing.T)
// KindI at X=-1-equivalent hugging the wall such that (0,0) fails:
// rotation succeeds and the resulting piece Fits; X shifted right by 1 or 2
// assert the chosen offset is the first in WallKicks order that fits

func TestRotationFailsWhenNoKickFits(t *testing.T)
// KindI boxed in by filled cells on all sides: RotateCW() returns no events
// and Rotation/X/Y are unchanged

func TestGhostYRestsOnFloor(t *testing.T)
// empty board, KindO: GhostY() == 20 (its lower row lands on y=21)

func TestGhostYRestsOnStack(t *testing.T)
// bottom two rows filled: KindO ghost rests two rows higher than the floor case

func TestGhostYEqualsActiveYWhenAlreadyResting(t *testing.T)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'NewGame|Move|Rotat|Ghost' -v`
Expected: build failure — `undefined: New`.

- [ ] **Step 3: Implement `internal/game/rules.go` and `internal/game/events.go`**

Constants and the event type only; no logic.

- [ ] **Step 4: Implement `internal/game/game.go`**

`New(seed)` seeds `rng` with `rand.NewSource(seed)`, builds the bag from that
same `rng`, fills `Next` to `NextQueueLen`, and sets `Active` from the bag.

Rotation tries each `WallKicks` offset in order against a candidate piece with
the new rotation, accepting the first that `Board.Fits`. Movement and rotation
both go through one internal helper so Task 5 can hook lock-timer resets in a
single place:

```go
// applies the candidate if it fits; reports whether it was applied
func (g *Game) tryPlace(candidate Piece) bool
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/game/game.go internal/game/rules.go internal/game/events.go internal/game/movement_test.go
git commit -m "feat(game): game state, events, movement, wall-kick rotation, ghost"
```
