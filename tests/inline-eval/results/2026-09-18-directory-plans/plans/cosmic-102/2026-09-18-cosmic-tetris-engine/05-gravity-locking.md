### Task 5: Gravity, soft/hard drop, lock delay

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/gravity_test.go`

**Interfaces:**
- Consumes: everything from Task 4.
- Produces:
  ```go
  func (g *Game) Advance(dt time.Duration) []Event  // the only way time enters (§49.2)
  func (g *Game) SoftDrop() []Event
  func (g *Game) HardDrop() []Event
  func (g *Game) DropInterval() time.Duration       // for the current Level
  ```
  `Advance` semantics: while `GravityAccumulator >= DropInterval()`, subtract one
  interval and step the piece down one row. A piece that cannot step down
  accumulates `LockAccumulator` instead; at `LockDelay` it locks. Locking runs
  the Task 6 sequence. `Advance` returns events in the order they occurred and
  returns no events when `g.Over`.

- [ ] **Step 1: Write the failing tests in `internal/game/gravity_test.go`**

```go
func TestDropIntervalPerLevel(t *testing.T)
// level 1 -> 800ms
// level 2 -> 688ms (800 * 0.86, truncated to the nearest ms in the assertion
//            with a ±1ms tolerance helper)
// level 30 -> MinDropInterval (60ms floor, §11)
// every level 1..100: interval > 0 and <= 800ms and >= MinDropInterval

func TestAdvanceBelowIntervalDoesNotMove(t *testing.T)
// Advance(700ms) at level 1: no events, Active.Y unchanged

func TestAdvanceOneIntervalStepsDownOneRow(t *testing.T)
// Advance(800ms): Active.Y increased by 1, one PieceMoved event

func TestAdvanceCarriesRemainderAcrossCalls(t *testing.T)
// Advance(500ms) twice: total 1000ms -> exactly one row stepped,
// GravityAccumulator == 200ms

func TestLongStalledFrameAppliesGravityRepeatedly(t *testing.T)
// empty board, Advance(2s) at level 1 -> piece stepped down 2 rows
// (2s / 800ms), GravityAccumulator == 400ms, not a single step

func TestStalledFrameCannotPushPieceThroughFloor(t *testing.T)
// Advance(60s) on an empty board: the piece lands, locks, and the board has
// exactly 4 filled cells; Active is a fresh spawned piece; no panic

func TestZeroAndNegativeDtAreNoOps(t *testing.T)
// Advance(0) and Advance(-100ms): no events, Y unchanged, accumulators unchanged

func TestGroundedPieceAccumulatesLockDelay(t *testing.T)
// piece resting on the floor: Advance(400ms) -> not locked, Grounded == true
// then Advance(100ms) -> PieceLocked emitted, cells committed

func TestMovementWhileGroundedResetsLockTimer(t *testing.T)
// grounded, Advance(400ms), MoveLeft(), Advance(400ms) -> still not locked,
// LockResets == 1

func TestRotationWhileGroundedResetsLockTimer(t *testing.T)

func TestLockResetsAreCappedAtFifteen(t *testing.T)
// grounded piece: loop 20 times { Advance(400ms); MoveLeft() or MoveRight() }
// LockResets never exceeds MaxLockResets and the piece has locked by the end

func TestSoftDropScoresOnePointPerCell(t *testing.T)
// three successful SoftDrop() calls -> Score == 3, Y increased by 3,
// each returns a PieceMoved event; gravity accumulator reset to 0 each time

func TestSoftDropAtRestScoresNothing(t *testing.T)
// resting piece: SoftDrop() returns no PieceMoved, Score unchanged

func TestHardDropScoresTwoPerCellAndLocksImmediately(t *testing.T)
// empty board, piece at Y=0, GhostY()==20: HardDrop() -> Score == 40,
// events contain PieceHardDropped{Count: 20} then PieceLocked, and the
// piece is committed in the same call (no lock delay)

func TestHardDropOfRestingPieceScoresZero(t *testing.T)
// piece already at GhostY(): HardDrop() -> Score == 0 (never negative),
// PieceHardDropped{Count: 0} then PieceLocked
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'Advance|Drop|Lock|Grounded|Stalled' -v`
Expected: build failure — `g.Advance undefined`.

- [ ] **Step 3: Implement `DropInterval`, `Advance`, `SoftDrop`, `HardDrop` in `internal/game/game.go`**

`DropInterval` uses `math.Pow(GravityFactor, float64(Level-1))` against
`BaseDropInterval` and clamps to `MinDropInterval`.

`Advance` returns immediately for `dt <= 0` or `g.Over`. Otherwise it adds `dt`
to whichever accumulator applies and loops; the loop must terminate even for a
very large `dt` (a locked piece stops consuming gravity, so drain the remaining
accumulator into the freshly spawned piece rather than looping forever).

Lock-timer resets live in `tryPlace` from Task 4: when a successful placement
happens while `Grounded` and `LockResets < MaxLockResets`, zero
`LockAccumulator` and increment `LockResets`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/gravity_test.go
git commit -m "feat(game): elapsed-time gravity, soft/hard drop, lock delay"
```
