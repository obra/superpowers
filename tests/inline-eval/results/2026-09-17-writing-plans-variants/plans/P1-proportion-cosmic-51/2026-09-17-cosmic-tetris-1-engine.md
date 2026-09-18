# Cosmic Tetris — Plan 1: Deterministic Game Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete headless, deterministic falling-block game engine under `internal/game` — pieces, board, 7-bag, movement, rotation with wall kicks, gravity, lock delay, line clearing, hold, scoring, game over — with comprehensive unit tests and a seeded replay test.

**Architecture:** One package, `internal/game`, with no dependencies outside the standard library. It never touches a terminal, never renders, and never reads a clock: the caller drives it with `Advance(dt time.Duration)` plus explicit input methods, and every mutation returns a `[]Event` slice describing what happened. The engine owns its own `*rand.Rand` (seeded from a CLI seed) which drives only the 7-bag. Board coordinates are `y=0` at the top (hidden spawn rows 0–1), `y=21` at the bottom, `x=0` at the left.

**Tech Stack:** Go 1.26 standard library only (`math`, `math/rand`, `time`, `testing`). No third-party dependencies in this plan — Bubble Tea / Lip Gloss / Bubbles arrive in Plan 2.

**Spec:** `design.md` (this plan implements §5–§13, §34, §35, §40 Board/Pieces/Bag/Hold/Drop/Score/Game-over/Determinism, §42 Phase 1, and pinned decisions §49.1, §49.2, §49.6)

## Global Constraints

- Language: Go. Module path: `cosmic-tetris`. Go directive: `go 1.26`.
- Repository layout follows `design.md` §33 exactly. Do not add packages beyond that tree except where this plan says so explicitly.
- Nothing under `internal/game` may call `time.Now()`, read the environment, touch the filesystem, spawn goroutines, or print. Timing enters only as `dt time.Duration` (§49.2).
- `Game` owns `rng *rand.Rand` (unexported) which drives the 7-bag and nothing else. `Seed int64` is recorded for display and restart only (§49.6). FX gets a separate RNG in Plan 3; the two never share.
- Board geometry, fixed: width 10, height 22, visible rows 20, hidden spawn rows 2 (§5).
- Seven piece kinds `I J L O S T Z`, four rotations each, `O` visually identical through rotation (§6).
- Wall-kick offsets, tested in exactly this order: `(0,0) (-1,0) (1,0) (-2,0) (2,0) (0,-1) (-1,-1) (1,-1)`. First valid wins; if none is valid the rotation fails (§7).
- Gravity: level 1 interval 800ms; `interval = 800ms * 0.86^(level-1)`; clamped at a 60ms floor. Level increases every 10 cleared lines (§11).
- Lock delay 500ms; a successful move or rotation while grounded resets it; maximum 15 resets per piece (§12).
- Line values `100/300/500/800 × level`; soft drop `+1`/cell; hard drop `+2`/cell (§11, §13).
- Combo: first clearing placement sets combo to 1; a placement clearing nothing resets it to 0; `bonus = 50 × (combo - 1) × level` (§49.1).
- Do not build: networking, profiles, achievements, a plugin system, a database, or persistence of any kind (§2).
- Commit after every task. Every task ends with `go test ./...` green and `go vet ./...` clean.

## Review Focus

Five things the spec requires by implication that no obvious task test covers. Each has a test added to the task that owns the code.

1. **A `dt` larger than the drop interval** (a stalled frame, a backgrounded terminal) must apply every whole gravity step it earned and stop cleanly at the floor — not swallow the extra time and not spin forever. → Task 5.
2. **Wall-kick candidates that leave the board** — the `(0,-1)` family kicks a piece upward, and near `y=0` that is out of bounds. Out-of-bounds candidates must be rejected as invalid, not panic on a negative index. → Task 4.
3. **Line clears that include the hidden spawn rows** (rows 0–1) must clear and collapse like any other row; the collapse loop must not read above row 0. → Task 2.
4. **Gravity interval at absurd levels** — level 40+ drives `0.86^39` toward zero; the interval must clamp at 60ms and never reach zero, which would make `Advance`'s gravity loop non-terminating. → Task 5.
5. **Input after game over** — every input method and `Advance` must be a no-op once the game is over, returning no events and mutating nothing. → Task 8.

---

## File Structure

| File | Responsibility |
|---|---|
| `go.mod` | Module `cosmic-tetris`, `go 1.26`. |
| `internal/game/piece.go` | `PieceKind`, `Piece`, base layouts, the precomputed rotation table, spawn offsets. |
| `internal/game/board.go` | `Cell`, `Board`, bounds/collision queries, locking cells, row completion, row clearing and collapse. |
| `internal/game/bag.go` | `Bag`: 7-bag shuffle/consume/refill over an injected `*rand.Rand`. |
| `internal/game/event.go` | `EventKind`, `Event`. (One file beyond §33's tree: the FX-side `fx/events.go` is a different type in a different package; the engine needs its own.) |
| `internal/game/rules.go` | Tunable constants and pure rule functions: kick offsets, `DropInterval`, `LevelForLines`, lock-delay constants. |
| `internal/game/scoring.go` | `LineScore`, `ComboBonus`, drop-point helpers. |
| `internal/game/game.go` | `Game`: state, `New`, input methods, `Advance`, spawn, hold, the lock pipeline, `Over`, `Ghost`, `Restart`, `Snapshot`. |
| `internal/game/*_test.go` | One test file per source file above. |
| `internal/game/testdata/replay.golden` | Recorded final-state snapshot for the determinism replay test. |

---

## Task 1: Module scaffolding, piece geometry, rotation table

**Files:**
- Create: `go.mod`, `internal/game/piece.go`, `internal/game/piece_test.go`, `.gitignore`, `README.md`, `LICENSE`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```go
  type PieceKind uint8
  const (KindI PieceKind = iota; KindJ; KindL; KindO; KindS; KindT; KindZ)
  const KindCount = 7

  func (k PieceKind) String() string        // "I","J","L","O","S","T","Z"
  func (k PieceKind) BoxSize() int          // 4 for I and O, 3 otherwise
  func KindByName(s string) (PieceKind, bool)

  type Offset struct{ DX, DY int }

  // Offsets returns the four occupied cells of kind k at rotation rot,
  // relative to the top-left of the piece's box. rot is taken mod 4.
  func Offsets(k PieceKind, rot int) [4]Offset

  type Piece struct {
      Kind     PieceKind
      Rotation int
      X, Y     int // board coords of the piece box's top-left corner
  }

  func (p Piece) Cells() [4]Offset  // absolute board coordinates
  func SpawnPiece(k PieceKind) Piece // Rotation 0, X=3, Y=0
  ```

**Design notes for the implementer:** Do not hand-write 28 rotation layouts. Store one base layout per kind and derive the other three by rotating the box clockwise: for a box of size `n`, `(x, y) -> (n-1-y, x)`. Build the full `[KindCount][4][4]Offset` table once in an `init()` (or a package-level `var` built by a function) and have `Offsets` index it. Sort each derived rotation's offsets by `(DY, DX)` so the table is comparison-stable in tests.

Base layouts (rotation 0), `#` = occupied:

```text
I (box 4)      J (box 3)   L (box 3)   O (box 4)
....           #..         ..#         ....
####           ###         ###         .##.
....           ...         ...         .##.
....                                   ....

S (box 3)   T (box 3)   Z (box 3)
.##         .#.         ##.
##.         ###         .##
...         ...         ...
```

- [ ] **Step 1: Initialize the module and repo boilerplate**

```bash
go mod init cosmic-tetris
printf '/cosmic-tetris\n' > .gitignore
```

Write a two-paragraph `README.md` (what the game is, how to run it once Plan 2 lands) and an MIT `LICENSE` with `Copyright (c) 2026`.

- [ ] **Step 2: Write the failing tests**

`internal/game/piece_test.go` — five tests, table-driven where noted:

```go
func TestOffsetsAlwaysFourDistinctCellsInsideBox(t *testing.T)
// for each kind, for rot 0..3: exactly 4 offsets, all distinct,
// 0 <= DX,DY < kind.BoxSize()

func TestFourRotationsReturnToBase(t *testing.T)
// for each kind: Offsets(k, 4) == Offsets(k, 0), and Offsets(k, -1) == Offsets(k, 3)

func TestOIsRotationInvariant(t *testing.T)
// Offsets(KindO, rot) equal for all rot in 0..3

func TestIRotatesBetweenRowAndColumn(t *testing.T)
// rot 0 and 2: all four DY equal (horizontal); rot 1 and 3: all four DX equal (vertical)

func TestSpawnPieceStartsInHiddenRows(t *testing.T)
// for each kind: p := SpawnPiece(k); p.Rotation == 0; p.X == 3; p.Y == 0;
// every Cells() entry has DY < 2 and 0 <= DX < 10
```

- [ ] **Step 3: Run the tests and confirm they fail**

Run: `go test ./internal/game/ -run 'TestOffsets|TestFour|TestO|TestI|TestSpawn' -v`
Expected: build failure — `undefined: Offsets`, `undefined: SpawnPiece`.

- [ ] **Step 4: Implement `piece.go`**

Base layouts as `[KindCount][]Offset`, a `rotateCW(in []Offset, n int) []Offset`, a package-level table built at init, plus the accessors from the Interfaces block. `SpawnPiece` returns `Piece{Kind: k, Rotation: 0, X: 3, Y: 0}` — X=3 centers both the 3-box (columns 3–5) and the 4-box (columns 3–6) closely enough, and Y=0 puts the piece in the hidden rows.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `go test ./internal/game/ -v` then `go vet ./...`
Expected: PASS, no vet output.

- [ ] **Step 6: Commit**

```bash
git add go.mod .gitignore README.md LICENSE internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): piece kinds, derived rotation table, spawn placement"
```

---

## Task 2: Board — bounds, collision, locking, row clearing

**Files:**
- Create: `internal/game/board.go`, `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Piece`, `PieceKind`, `Offset` (Task 1).
- Produces:
  ```go
  const (
      BoardWidth  = 10
      BoardHeight = 22
      VisibleRows = 20
      HiddenRows  = 2 // rows 0 and 1
  )

  type Cell struct {
      Filled bool
      Kind   PieceKind
  }

  type Board struct {
      Cells [BoardHeight][BoardWidth]Cell
  }

  func (b *Board) InBounds(x, y int) bool
  func (b *Board) At(x, y int) Cell            // zero Cell when out of bounds
  func (b *Board) Occupied(x, y int) bool      // true when out of bounds
  func (b *Board) Collides(p Piece) bool       // any cell occupied or out of bounds
  func (b *Board) Lock(p Piece)                // writes p's cells as Filled with p.Kind
  func (b *Board) CompleteRows() []int         // ascending row indices, nil when none
  func (b *Board) ClearRows(rows []int)        // removes rows, collapses everything above
  func (b *Board) RowFilledCount(y int) int
  func (b *Board) Clear()                      // empties every cell
  ```

**Design notes:** `Occupied` returning `true` out of bounds is what makes `Collides` a one-liner and keeps floor, walls, and ceiling uniform. `ClearRows` must tolerate unsorted input and duplicate-free indices; implement it as a downward copy with a write cursor starting at the bottom, then zero the rows the cursor never reached — that pattern handles hidden rows without a special case.

- [ ] **Step 1: Write the failing tests**

`internal/game/board_test.go`:

```go
func TestInBoundsAndOccupiedTreatOutsideAsSolid(t *testing.T)
// (-1,5), (10,5), (0,-1), (0,22) => InBounds false, Occupied true; (0,0) empty board => Occupied false

func TestCollidesWithFloorWallsAndLockedCells(t *testing.T)
// subtests: piece at bottom row +1 collides; piece pushed to X=-1 collides;
// piece overlapping a manually filled cell collides; free piece does not

func TestLockWritesKindIntoEveryCell(t *testing.T)
// after Lock(SpawnPiece(KindT)): exactly 4 cells Filled, each Kind == KindT

func TestCompleteRowsFindsFullRowsAscending(t *testing.T)
// fill rows 21 and 19 fully, row 20 with 9 cells => CompleteRows() == []int{19, 21}

func TestCompleteRowsNilWhenNothingFull(t *testing.T)

func TestClearRowsCollapsesStackDownward(t *testing.T)
// fill row 21 fully; put a single marker cell at (0,20); ClearRows([]int{21})
// => marker now at (0,21), row 20 empty, total filled count == 1

func TestClearFourRowsAtOnce(t *testing.T)
// fill rows 18..21; marker at (3,17); ClearRows([]int{18,19,20,21})
// => marker at (3,21), all other cells empty

// Review Focus #3
func TestClearRowsIncludingHiddenSpawnRows(t *testing.T)
// fill rows 0 and 1 (the hidden rows) fully plus a marker at (5,3);
// ClearRows([]int{0,1}) => marker at (5,3) is untouched (nothing above it moved
// into it), rows 0..1 empty, no panic, total filled count == 1

func TestClearRowsAcceptsUnsortedInput(t *testing.T)
// same expectation as the four-row case with rows passed as []int{20,18,21,19}
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/game/ -run TestBoard -v; go test ./internal/game/ -v`
Expected: build failure — `undefined: Board`.

- [ ] **Step 3: Implement `board.go`**

Per the Interfaces block. Keep `Cells` a value array, not a slice of slices — `Board` copies cheaply, which the snapshot and replay tests will use.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board collision, row completion, clear and collapse"
```

---

## Task 3: 7-bag piece generator and next queue

**Files:**
- Create: `internal/game/bag.go`, `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `KindCount` (Task 1).
- Produces:
  ```go
  const NextQueueLen = 5 // §6: render the next five

  type Bag struct {
      pending []PieceKind
  }

  // Next draws the next kind, refilling and reshuffling from rng when empty.
  func (b *Bag) Next(rng *rand.Rand) PieceKind
  func (b *Bag) Remaining() int
  ```

**Design notes:** `Bag` takes the RNG as a parameter rather than storing it, so `Game` stays the single owner of randomness (§49.6). Refill by appending all seven kinds and shuffling with `rng.Shuffle`.

- [ ] **Step 1: Write the failing tests**

`internal/game/bag_test.go`:

```go
func TestEveryBagContainsAllSevenKindsExactlyOnce(t *testing.T)
// draw 70 kinds from rand.New(rand.NewSource(1)); for each group of 7,
// assert the group is a permutation of all seven kinds

func TestSeededBagIsReproducible(t *testing.T)
// two bags with rand.New(rand.NewSource(8675309)) produce identical 70-kind sequences

func TestDifferentSeedsDiverge(t *testing.T)
// seeds 1 and 2 produce different 70-kind sequences

func TestRemainingCountsDownWithinABag(t *testing.T)
// fresh bag: Remaining()==0; after one Next: 6; after seven: 0
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/game/ -run TestEveryBag -v`
Expected: build failure — `undefined: Bag`.

- [ ] **Step 3: Implement `bag.go`**

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag generator"
```

---

## Task 4: Game construction, movement, rotation with wall kicks, ghost

**Files:**
- Create: `internal/game/event.go`, `internal/game/rules.go`, `internal/game/game.go`, `internal/game/game_test.go`, `internal/game/rules_test.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: `Piece`, `Board`, `Bag` (Tasks 1–3).
- Produces:
  ```go
  // event.go
  type EventKind uint8
  const (
      EventPieceMoved EventKind = iota
      EventPieceRotated
      EventPieceHardDropped
      EventPieceLocked
      EventHoldUsed
      EventLinesCleared
      EventComboChanged
      EventLevelChanged
      EventGameOver
  )
  func (k EventKind) String() string

  type Event struct {
      Kind     EventKind
      Piece    Piece // the piece involved, where meaningful
      Rows     []int // EventLinesCleared: cleared rows, ascending
      Distance int   // EventPieceHardDropped: cells fallen
      Level    int   // EventLevelChanged: the new level
      Combo    int   // EventComboChanged: the new combo
      Score    int   // score after the event
  }

  // rules.go
  var KickOffsets = [8]Offset{{0,0},{-1,0},{1,0},{-2,0},{2,0},{0,-1},{-1,-1},{1,-1}}
  const (
      BaseDropInterval = 800 * time.Millisecond
      MinDropInterval  = 60 * time.Millisecond
      GravityFactor    = 0.86
      LockDelay        = 500 * time.Millisecond
      MaxLockResets    = 15
      LinesPerLevel    = 10
  )
  func DropInterval(level int) time.Duration
  func LevelForLines(lines int) int // lines/10 + 1

  // game.go
  type Game struct {
      Board   Board
      Active  Piece
      Hold    *PieceKind
      CanHold bool
      Next    []PieceKind // always NextQueueLen long while playing
      Bag     Bag

      Score, Lines, Level, Combo int

      GravityAccumulator time.Duration
      LockAccumulator    time.Duration

      Seed int64

      lockResets int
      grounded   bool
      over       bool
      rng        *rand.Rand
  }

  func New(seed int64) *Game
  func (g *Game) Over() bool
  func (g *Game) Ghost() Piece            // Active dropped to its landing row
  func (g *Game) MoveLeft() []Event
  func (g *Game) MoveRight() []Event
  func (g *Game) RotateCW() []Event
  func (g *Game) RotateCCW() []Event
  ```

**Design notes:** `New` seeds `rng` from `seed`, records `Seed`, fills `Next` to `NextQueueLen`, sets `Level = 1`, `CanHold = true`, and spawns the first active piece. Movement helpers share one private `tryMove(dx, dy int) bool`. Rotation walks `KickOffsets` in order and takes the first candidate where `!Board.Collides(candidate)` — since `Collides` reports out-of-bounds as occupied (Task 2), an upward kick past `y=0` is rejected automatically, with no bounds arithmetic in the rotation code. A successful move or rotation while `grounded` calls a private `resetLockTimer()`; Task 5 gives that method its body — here it may be a stub that does nothing but must already be called from the move/rotate paths.

- [ ] **Step 1: Write the failing tests**

`internal/game/rules_test.go`:

```go
func TestDropIntervalCurve(t *testing.T)
// level 1 == 800ms; level 2 within 1ms of 688ms; strictly decreasing for levels 1..20

func TestDropIntervalClampsAtFloor(t *testing.T)
// Review Focus #4: for level in {30, 40, 100, 1000}: DropInterval(level) == MinDropInterval
// and DropInterval(level) > 0

func TestLevelForLines(t *testing.T)
// 0 -> 1, 9 -> 1, 10 -> 2, 19 -> 2, 20 -> 3, 127 -> 13
```

`internal/game/game_test.go`:

```go
func TestNewGameIsPlayableAndSeedIsRecorded(t *testing.T)
// New(42): Seed==42, Level==1, Score==0, Lines==0, Combo==0, CanHold true,
// Hold nil, len(Next)==NextQueueLen, !Over()

func TestMoveLeftRightEmitsPieceMovedAndStopsAtWalls(t *testing.T)
// move left until it stops: X decreases, each success emits one EventPieceMoved;
// the blocked attempt emits no events and leaves X unchanged. Same rightward.

func TestRotateEmitsPieceRotatedAndCyclesRotation(t *testing.T)
// four RotateCW on a T in open space: Rotation goes 1,2,3,0; each emits EventPieceRotated

func TestRotateCCWGoesBackwards(t *testing.T)
// RotateCCW from rotation 0 lands on rotation 3

func TestRotationWallKicksOffTheLeftWall(t *testing.T)
// place a vertical I at X=-1 (set g.Active directly), RotateCW, assert the piece
// ends up fully in bounds and !Board.Collides(g.Active)

func TestRotationFailsWhenNoKickWorks(t *testing.T)
// fill the whole board except the 4 cells of the active piece; RotateCW returns
// no events and leaves Rotation and X,Y unchanged

// Review Focus #2
func TestRotationNeverKicksAboveTheCeiling(t *testing.T)
// active piece at Y=0 with rows 2..21 filled solid so the only free space is the
// hidden rows; RotateCW must either fail or land with every cell Y >= 0.
// The test must not panic.

func TestGhostLandsOnTheStackWithoutMovingActive(t *testing.T)
// empty board: Ghost().Y is the lowest non-colliding Y and Active.Y is unchanged;
// with row 21 filled, the ghost rests one row higher; Ghost().Kind == Active.Kind
// and Ghost().Rotation == Active.Rotation
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/game/ -v`
Expected: build failure — `undefined: New`, `undefined: DropInterval`.

- [ ] **Step 3: Implement `event.go`, `rules.go`, and the movement half of `game.go`**

`DropInterval` uses `math.Pow(GravityFactor, float64(level-1))` on the base interval and clamps to `MinDropInterval`.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/event.go internal/game/rules.go internal/game/game.go internal/game/game_test.go internal/game/rules_test.go
git commit -m "feat(game): game state, movement, kick-based rotation, ghost"
```

---

## Task 5: Gravity, drops, lock delay, and the lock pipeline

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/gravity_test.go` (create)

**Interfaces:**
- Consumes: everything from Task 4.
- Produces:
  ```go
  // Advance applies dt of elapsed time: gravity steps and, when the active piece
  // is grounded, the lock timer. Returns every event produced, in order.
  func (g *Game) Advance(dt time.Duration) []Event

  func (g *Game) SoftDrop() []Event  // one cell down, +1 point per cell moved
  func (g *Game) HardDrop() []Event  // to the landing row, +2 points per cell, locks immediately
  func (g *Game) Grounded() bool
  ```

**Design notes on ordering.** `Advance` does, in this order:

1. If `Over()`, return nil.
2. Add `dt` to `GravityAccumulator`. While `GravityAccumulator >= DropInterval(Level)`: subtract the interval and take one gravity step. A gravity step moves the piece down one cell if it can (emitting `EventPieceMoved`, no score — gravity is free), and does nothing if it cannot. The loop terminates because `DropInterval` has a 60ms floor.
3. If the piece cannot move down, set `grounded` and add `dt` to `LockAccumulator`; when `LockAccumulator >= LockDelay`, run the lock pipeline. If the piece *can* move down, clear `grounded`, zero `LockAccumulator`, and leave `lockResets` alone.

`resetLockTimer()` (stubbed in Task 4, filled in here): if `grounded && lockResets < MaxLockResets`, zero `LockAccumulator` and increment `lockResets`.

The lock pipeline, in the order §12 fixes:

1. `Board.Lock(Active)`, emit `EventPieceLocked`.
2. `rows := Board.CompleteRows()`.
3. If `len(rows) > 0`: `Board.ClearRows(rows)`, emit `EventLinesCleared{Rows: rows}`.
4. Update score, lines, combo, level (Task 7 supplies the arithmetic; here just call into it) and emit `EventComboChanged` / `EventLevelChanged` when those values actually change.
5. Reset `CanHold = true`, `lockResets = 0`, `grounded = false`, both accumulators to zero.
6. Spawn the next piece (Task 8 adds the blocked-spawn game-over branch).

Note for the FX layer: `EventLinesCleared` carries the row indices *before* the clear, which is what the supernova animation in Plan 3 needs to know where to draw.

- [ ] **Step 1: Write the failing tests**

`internal/game/gravity_test.go`:

```go
func TestAdvanceBelowIntervalDoesNothing(t *testing.T)
// Advance(700ms) at level 1: Active.Y unchanged, no events

func TestAdvanceOneIntervalDropsOneRow(t *testing.T)
// Advance(800ms): Y increases by exactly 1, one EventPieceMoved

func TestAdvanceKeepsTheRemainder(t *testing.T)
// Advance(500ms) then Advance(400ms): total one drop, GravityAccumulator == 100ms

// Review Focus #1
func TestLargeDtAppliesEveryEarnedStepAndStopsAtTheFloor(t *testing.T)
// Advance(5s) at level 1: piece falls at most 6 rows (5s/800ms) and never further;
// then Advance(1*time.Minute) on an empty board: the piece rests on the floor,
// Board.Collides(Active) is false, and the call returns (does not hang).
// Guard the second call with a 5s test deadline via a done-channel or t.Deadline.

func TestGroundedPieceLocksAfterLockDelay(t *testing.T)
// drop to the floor, then Advance(499ms): no lock; Advance(2ms): EventPieceLocked
// present and the board has 4 filled cells

func TestMovementWhileGroundedResetsLockTimer(t *testing.T)
// ground the piece, Advance(400ms), MoveLeft(), Advance(400ms): still not locked

func TestLockResetsAreCappedAtFifteen(t *testing.T)
// ground the piece, then loop 20×{Advance(400ms); MoveLeft() or MoveRight()}:
// a lock happens; assert EventPieceLocked was emitted within those 20 iterations

func TestSoftDropScoresOnePointPerCell(t *testing.T)
// three SoftDrop calls on an empty board: Score == 3, Y increased by 3,
// each emits EventPieceMoved

func TestSoftDropAtTheFloorScoresNothing(t *testing.T)
// with the piece grounded: SoftDrop returns no events and Score is unchanged

func TestHardDropScoresTwoPerCellAndLocksImmediately(t *testing.T)
// from spawn on an empty board: events contain EventPieceHardDropped with
// Distance == cells fallen, then EventPieceLocked; Score == 2*Distance;
// board has 4 filled cells; a new active piece is present

func TestHardDropOnAGroundedPieceLocksWithZeroDistance(t *testing.T)
// ground the piece first: EventPieceHardDropped has Distance 0, Score unchanged,
// EventPieceLocked emitted
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/game/ -run 'TestAdvance|TestLarge|TestGrounded|TestMovementWhile|TestLockResets|TestSoft|TestHard' -v`
Expected: build failure — `undefined: (*Game).Advance`.

- [ ] **Step 3: Implement `Advance`, `SoftDrop`, `HardDrop`, `resetLockTimer`, and the lock pipeline**

Score updates in step 4 of the pipeline may temporarily inline `100/300/500/800 × level` — Task 7 replaces that with `scoring.go` and adds the combo bonus.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/gravity_test.go
git commit -m "feat(game): elapsed-time gravity, soft/hard drop, lock delay pipeline"
```

---

## Task 6: Hold

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/hold_test.go` (create)

**Interfaces:**
- Consumes: Task 5's spawn helper and lock pipeline.
- Produces:
  ```go
  // Hold swaps the active piece with the held piece, or stores it and spawns the
  // next when the hold slot is empty. It is a no-op unless CanHold is true.
  func (g *Game) Hold() []Event
  ```

Note: the field is `Game.Hold *PieceKind` per §34 and the method would collide with it, so the field stays `Hold` and the method is named **`HoldPiece`**. Use `HoldPiece()` everywhere — including Plan 2's key handler.

- [ ] **Step 1: Write the failing tests**

`internal/game/hold_test.go`:

```go
func TestFirstHoldStoresActiveAndSpawnsNext(t *testing.T)
// record Active.Kind and Next[0]; HoldPiece(): *Hold == old active kind,
// Active.Kind == old Next[0], len(Next) == NextQueueLen, one EventHoldUsed

func TestSecondHoldSwapsBack(t *testing.T)
// HoldPiece, lock the piece (HardDrop), then HoldPiece again: the previously held
// kind becomes active and the just-active kind is held

func TestSecondHoldBeforeLockIsBlocked(t *testing.T)
// HoldPiece twice in a row: the second returns no events and changes nothing

func TestHoldIsRestoredAfterLock(t *testing.T)
// HoldPiece, HardDrop (locks), then CanHold is true again

func TestHeldPieceReturnsAtSpawnRotationAndPosition(t *testing.T)
// rotate the active piece twice, HoldPiece, HardDrop, HoldPiece:
// the returning piece has Rotation 0, X 3, Y 0
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/game/ -run TestHold -v; go test ./internal/game/ -run TestFirst -v`
Expected: build failure — `undefined: (*Game).HoldPiece`.

- [ ] **Step 3: Implement `HoldPiece`**

Set `CanHold = false`, emit `EventHoldUsed`, and reset the lock/gravity accumulators and `lockResets` for the newly active piece.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/hold_test.go
git commit -m "feat(game): quantum storage (hold) with once-per-piece rule"
```

---

## Task 7: Scoring, combo, level progression

**Files:**
- Create: `internal/game/scoring.go`, `internal/game/scoring_test.go`
- Modify: `internal/game/game.go` (lock pipeline step 4 calls into `scoring.go`)

**Interfaces:**
- Consumes: `LevelForLines` (Task 4), the lock pipeline (Task 5).
- Produces:
  ```go
  // LineScore returns the base value for clearing n lines at the given level.
  // n outside 1..4 returns 0.
  func LineScore(n, level int) int

  // ComboBonus implements §49.1: 50 * (combo-1) * level. combo <= 1 yields 0.
  func ComboBonus(combo, level int) int
  ```

- [ ] **Step 1: Write the failing tests**

`internal/game/scoring_test.go`:

```go
func TestLineScoreValues(t *testing.T)
// level 1: 100/300/500/800 for n=1..4; level 7: 700/2100/3500/5600; n=0 and n=5 => 0

func TestComboBonusStartsAtComboTwo(t *testing.T)
// (0,1)=>0, (1,1)=>0, (2,1)=>50, (3,1)=>100, (2,7)=>350
```

`internal/game/gravity_test.go` (append — these exercise the pipeline, not the pure helpers):

```go
func TestSingleClearScoresBaseValueWithNoComboBonus(t *testing.T)
// helper fillRowExcept(t, g, 21, gapX) then drop a piece into the gap:
// Score == 100, Lines == 1, Combo == 1, no combo bonus in the total

func TestConsecutiveClearsAccumulateComboBonus(t *testing.T)
// two clears back to back at level 1: second placement adds 100 + 50

func TestNonClearingPlacementResetsCombo(t *testing.T)
// clear once (Combo==1), then hard-drop a piece that clears nothing:
// Combo == 0 and an EventComboChanged with Combo 0 is emitted

func TestLevelRisesEveryTenLines(t *testing.T)
// drive Lines to 10 via cleared rows: Level == 2 and an EventLevelChanged
// with Level 2 is emitted exactly once

func TestEventsCarryScoreAfterTheEvent(t *testing.T)
// the EventLinesCleared from a single clear has Score == g.Score
```

**Test helper to write once in `gravity_test.go` and reuse:**

```go
// fillRowExcept fills row y of g.Board with locked KindI cells except column gapX.
func fillRowExcept(t *testing.T, g *Game, y, gapX int)

// forceActive replaces the active piece so a test can aim a drop precisely.
func forceActive(g *Game, k PieceKind, rot, x, y int)
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/game/ -run 'TestLineScore|TestCombo|TestSingleClear|TestConsecutive|TestNonClearing|TestLevelRises' -v`
Expected: FAIL — `undefined: LineScore`, and the pipeline tests fail on the missing combo bonus.

- [ ] **Step 3: Implement `scoring.go` and wire it into the lock pipeline**

Pipeline step 4 becomes: if lines were cleared, `Combo++`, `Lines += len(rows)`, `Score += LineScore(len(rows), Level) + ComboBonus(Combo, Level)`; else if `Combo != 0`, `Combo = 0` and emit `EventComboChanged`. Then recompute `Level = LevelForLines(Lines)` and emit `EventLevelChanged` if it moved. Emit `EventComboChanged` whenever `Combo` changes value, in both branches.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/scoring.go internal/game/scoring_test.go internal/game/game.go internal/game/gravity_test.go
git commit -m "feat(game): line values, combo bonus, level progression"
```

---

## Task 8: Game over, restart, snapshot, determinism replay

**Files:**
- Modify: `internal/game/game.go`
- Create: `internal/game/determinism_test.go`, `internal/game/testdata/replay.golden`

**Interfaces:**
- Consumes: everything above.
- Produces:
  ```go
  // Restart resets every field to a fresh game with the given seed, reusing g.
  func (g *Game) Restart(seed int64)

  // Snapshot renders the full logical state as a stable multi-line string:
  // seed, score, lines, level, combo, hold, next queue, active piece, and the
  // 22 board rows as '.' / kind letters. Used by the determinism test and by
  // debugging; it must not include any timing or FX state.
  func (g *Game) Snapshot() string
  ```

**Design notes:** game over happens when the piece spawned by the lock pipeline (or by `HoldPiece`) collides at its spawn position. Set `over = true`, emit `EventGameOver`, and leave the colliding piece in `Active` so the renderer has something to freeze and collapse in Plan 3. Once `over` is set, `Advance`, `MoveLeft`, `MoveRight`, `RotateCW`, `RotateCCW`, `SoftDrop`, `HardDrop`, and `HoldPiece` all return `nil` immediately.

- [ ] **Step 1: Write the failing tests**

`internal/game/determinism_test.go`:

```go
func TestBlockedSpawnEndsTheGame(t *testing.T)
// fill rows 0..3 solid except a landing pocket, hard-drop into it, and assert
// the returned events contain EventGameOver and Over() is true

// Review Focus #5
func TestInputAfterGameOverIsANoOp(t *testing.T)
// reach game over, capture Snapshot(), then call MoveLeft, MoveRight, RotateCW,
// RotateCCW, SoftDrop, HardDrop, HoldPiece, Advance(10*time.Second):
// every call returns nil and Snapshot() is byte-identical to the capture

func TestRestartClearsEverything(t *testing.T)
// play a few placements, Restart(99): Seed==99, Score/Lines/Combo==0, Level==1,
// Hold nil, CanHold true, board empty, !Over()

func TestSnapshotIsStableAcrossIdenticalRuns(t *testing.T)
// replay(seed) twice (helper below) and compare Snapshot() strings

func TestReplayMatchesGolden(t *testing.T)
// replay(8675309) and compare Snapshot() to testdata/replay.golden,
// regenerated with -update

func TestDifferentSeedGivesDifferentReplay(t *testing.T)
// replay(8675309) and replay(11) snapshots differ
```

**The replay helper — the heart of §35 and §49.2:**

```go
// step is one canned input plus the elapsed time that follows it.
type step struct {
    input string // "", "left", "right", "cw", "ccw", "soft", "hard", "hold"
    dt    time.Duration
}

// replaySteps is a fixed 60-step script mixing every input with dt values that
// straddle the level-1 drop interval (e.g. 120ms, 800ms, 60ms, 1500ms).
// Write it out literally; do not generate it randomly.
var replaySteps = []step{ /* 60 literal entries */ }

func replay(seed int64) *Game {
    g := New(seed)
    for _, s := range replaySteps {
        switch s.input {
        case "left": g.MoveLeft()
        // ... one case per input
        }
        g.Advance(s.dt)
    }
    return g
}
```

Add `var update = flag.Bool("update", false, "rewrite golden files")` and have `TestReplayMatchesGolden` write `testdata/replay.golden` with `os.WriteFile` when set.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/game/ -run 'TestBlockedSpawn|TestInputAfter|TestRestart|TestSnapshot|TestReplay|TestDifferentSeedGives' -v`
Expected: FAIL — `undefined: (*Game).Snapshot`, missing golden file.

- [ ] **Step 3: Implement game over, `Restart`, and `Snapshot`**

- [ ] **Step 4: Record the golden file and run the whole suite**

Run: `go test ./internal/game/ -run TestReplayMatchesGolden -update && go test ./... -v`
Expected: golden written, all tests PASS. Open `testdata/replay.golden` and sanity-check it: a plausible score, a board with locked cells, no all-empty board.

- [ ] **Step 5: Confirm the engine is clock-free and dependency-free**

Run:
```bash
grep -rn "time.Now\|os\.\|fmt.Print" internal/game --include='*.go' | grep -v _test.go
go list -deps ./internal/game | grep -v '^\(internal/\|[a-z]*$\|[a-z]*/\)' | grep '\.' || echo "no external deps"
```
Expected: the grep prints nothing (a `time.Duration` import is fine; `time.Now` is not), and no third-party dependency appears.

- [ ] **Step 6: Commit**

```bash
git add internal/game/game.go internal/game/determinism_test.go internal/game/testdata/replay.golden
git commit -m "feat(game): game over, restart, snapshot, seeded replay determinism test"
```

---

## Done when

- `go test ./... -v` passes and `go vet ./...` is silent.
- `internal/game` imports nothing outside the standard library and never calls `time.Now()`.
- Every §40 engine category has tests: board collision/bounds/completion/removal/collapse, every rotation plus kicks plus failure plus spawn, bag contents and reproducibility, all four hold rules, soft/hard drop and landing and lock, line values and combo and drop scoring and level progression, blocked-spawn game over, and the seeded replay.
- `Game.Snapshot()` of a replayed game is byte-identical across runs with the same seed.
