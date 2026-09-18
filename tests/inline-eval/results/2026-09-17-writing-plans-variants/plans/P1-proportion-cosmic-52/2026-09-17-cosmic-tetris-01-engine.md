# Cosmic Tetris — Plan 01: Deterministic Game Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `internal/game`, a headless, clock-free, seed-reproducible falling-block engine with full unit tests, before any terminal code exists.

**Architecture:** One package, six small files, no dependencies outside the standard library. The engine is a pure state machine driven by two entry points: `Apply(Input)` for player actions and `Advance(dt)` for time. Both return `[]Event` describing what happened; nothing inside the package reads a clock or renders anything. A single `*rand.Rand` owned by `Game` drives the 7-bag and nothing else.

**Tech Stack:** Go 1.26, `math/rand/v2` (PCG source), `testing`. No third-party modules in this plan.

**Spec:** `design.md` (this plan implements §5–13, §34, §35, §40 "Board/Pieces/Bag/Hold/Drop/Score/Game over/Determinism", §49.1, §49.2, §49.6)

## Global Constraints

- Language: Go. Module path `cosmic-tetris`, `go 1.26` in `go.mod`.
- Directory layout is exactly §33's tree. Do not add packages beyond it.
- `internal/game` never calls `time.Now()` or any other clock (§49.2). `time.Duration` appears only as a parameter or accumulator type.
- Board is `width: 10`, `height: 22`, `visible rows: 20`, `hidden spawn rows: 2` (§5).
- Game RNG and FX RNG never share (§49.6). This plan creates only the game RNG: `Game.rng`, seeded from `Game.Seed`, used for the 7-bag and nothing else.
- Gravity: `interval = 800ms * 0.86^(level-1)`, clamped at approximately `60ms`; level increases every `10 cleared lines` (§11).
- `lock delay = 500ms`, `max lock resets = 15` (§12).
- Clear values `100/300/500/800 × level`; combo bonus `50 × (combo - 1) × level` (§13, §49.1).
- Soft drop `+1 point / cell`, hard drop `+2 points / cell` (§11).
- Rotation kick offsets, in order: `(0,0) (-1,0) (1,0) (-2,0) (2,0) (0,-1) (-1,-1) (1,-1)` (§7).
- No networking, profiles, achievements, plugin system, or database (§2).

## Review Focus

Five things the spec requires to work but never names as a test. Each has a test in the task that owns the code.

1. **`Advance` with `dt <= 0`** — a frame can arrive with zero or negative elapsed time (clock skew, first frame). Nothing should move and nothing should panic. *(Task 6)*
2. **`Advance` with a huge `dt`** — a stalled process resumes with `dt = 10s` at a 60ms interval. The catch-up loop must terminate, must not push a piece through the floor, and must not skip the lock. *(Task 6)*
3. **Input after game over** — the app keeps delivering frames and keys during the 1.3s game-over animation (§28). `Apply` and `Advance` must be no-ops returning no events. *(Task 4)*
4. **Kicks above the ceiling** — the `(0,-1)` and `(±1,-1)` offsets can put a spawn-height piece at `y = -1`. Occupancy must treat `y < 0` as free without indexing the cell array negatively. *(Task 1 and Task 5)*
5. **Level past the clamp** — at 300 cleared lines, `0.86^30` underflows toward zero. The interval must sit at the 60ms clamp, never zero or negative, and level maths must not overflow. *(Task 7)*

---

### Task 1: Module bootstrap and board geometry

**Files:**
- Create: `go.mod`, `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```go
  const (Width = 10; Height = 22; VisibleRows = 20; HiddenRows = 2)
  type Cell uint8               // 0 == empty; otherwise Cell(kind) + 1
  type Board struct{ Cells [Height][Width]Cell }
  func (b *Board) At(x, y int) Cell
  func (b *Board) Set(x, y int, c Cell)
  func (b *Board) Occupied(x, y int) bool   // out of side/bottom bounds == true; y < 0 == false
  func (b *Board) FullRows() []int          // ascending row indices
  func (b *Board) ClearRows(rows []int)     // removes rows, collapses everything above down
  ```

Coordinate convention, to be repeated as a doc comment on `Board`: `y = 0` is the
top hidden row, `y = 1` the second hidden row, `y = 2` the first *visible* row,
`y = 21` the floor row. `x = 0` is the left wall.

- [ ] **Step 1: Write the failing tests**

`internal/game/board_test.go`:

```go
func TestOccupiedTreatsWallsAndFloorAsSolid(t *testing.T)
// (-1, 5) true; (Width, 5) true; (5, Height) true; (5, 5) false on an empty board.

func TestOccupiedTreatsAboveCeilingAsFree(t *testing.T)
// (5, -1) and (5, -2) false, and the call must not panic. Review Focus 4.

func TestSetAndAtRoundTrip(t *testing.T)
// Set(3, 21, Cell(KindT)+1) then At(3, 21) equals that value; At(3, 20) is 0.

func TestFullRowsFindsCompleteRowsAscending(t *testing.T)
// Fill rows 21 and 19 completely, leave one gap in row 20 -> []int{19, 21}.

func TestClearRowsCollapsesAbove(t *testing.T)
// Row 21 full, row 20 holds a single block at x=0. ClearRows([]int{21}) leaves
// row 21 holding that single block at x=0 and row 20 empty.

func TestClearRowsHandlesMultipleNonAdjacentRows(t *testing.T)
// Rows 21 and 19 full, row 20 has one block at x=9. After clearing both, row 21
// has exactly one block at x=9 and rows 0..20 are empty.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'Board|Occupied|Set|FullRows|ClearRows' -v`
Expected: build failure — package `game` does not exist.

- [ ] **Step 3: Implement**

`go.mod`:

```
module cosmic-tetris

go 1.26
```

`internal/game/board.go`: the constants, `Cell`, `Board`, and the six methods
above. `ClearRows` copies surviving rows downward into a fresh `[Height][Width]Cell`
walking from the bottom up; it does not allocate per row.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add go.mod internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board geometry, occupancy, row clearing"
```

---

### Task 2: Piece kinds, shapes, and the rotation table

**Files:**
- Create: `internal/game/piece.go`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: `Width`, `Height`, `Board.Occupied` (Task 1).
- Produces:
  ```go
  type PieceKind uint8
  const (KindI PieceKind = iota; KindJ; KindL; KindO; KindS; KindT; KindZ)
  const KindCount = 7
  func (k PieceKind) String() string        // "I","J","L","O","S","T","Z"
  type Piece struct{ Kind PieceKind; Rotation int; X, Y int }
  func (p Piece) Cells() [4][2]int          // absolute (x, y) of the four filled cells
  func (p Piece) BoxSize() int              // 4 for I, 2 for O, 3 for the rest
  func SpawnPiece(k PieceKind) Piece        // Rotation 0 at the spawn position
  ```

Rotation is stored `0..3` and normalised by `Cells()`; `Rotation` is always kept
in range by the mutators in Task 5.

Shape data lives in one place: a base 4×4/3×3/2×2 grid per kind in string art, and
`init()` derives rotations 1–3 by rotating the box clockwise
(`out[x][n-1-y] = in[y][x]`) into `var rotations [KindCount][4][4][4]bool`. This
is what §6's "four predefined rotations per piece" means here — four rotations
exist as data by the time any caller runs, they are just built from one base each
instead of 28 hand-typed grids. Rotating inside a per-kind box (4 for I, 3 for
J/L/S/T/Z, 2 for O) keeps the centre fixed, so pieces do not drift sideways when
rotated, and `O` is rotation-invariant for free (§6).

Base art (`#` filled, `.` empty), left column is row 0:

```
I (4x4)   O (2x2)   T (3x3)   J (3x3)   L (3x3)   S (3x3)   Z (3x3)
....      ##        .#.       #..       ..#       .##       ##.
####      ##        ###       ###       ###       ##.       .##
....                ...       ...       ...       ...       ...
....
```

Spawn: `X = (Width - BoxSize()) / 2` (3 for I, 4 for O, 3 for the rest), `Y = 1`.
That puts every piece's lowest filled row on `y = 2`, the first visible row, so a
new piece is visible immediately while its box still overlaps the hidden rows.

- [ ] **Step 1: Write the failing tests**

```go
func TestEveryKindHasFourCellsInEveryRotation(t *testing.T)
// For all 7 kinds x 4 rotations: Cells() returns 4 distinct coordinates.

func TestORotationIsIdentical(t *testing.T)
// KindO at rotations 0..3 yields the same sorted cell set.

func TestIRotationAlternatesHorizontalAndVertical(t *testing.T)
// Rotation 0 and 2: all four cells share a y. Rotation 1 and 3: all share an x.

func TestTRotationsMatchExpectedCells(t *testing.T)
// Piece{KindT, 0, 0, 0} -> {(1,0),(0,1),(1,1),(2,1)}
// rotation 1 -> {(1,0),(1,1),(2,1),(1,2)}
// rotation 2 -> {(0,1),(1,1),(2,1),(1,2)}
// rotation 3 -> {(1,0),(0,1),(1,1),(1,2)}

func TestRotationsStayInsideTheBox(t *testing.T)
// For all kinds and rotations, every cell offset is within [0, BoxSize()).

func TestSpawnPositionsAreCentredAndVisible(t *testing.T)
// SpawnPiece(KindT).Cells() == {(4,1),(3,2),(4,2),(5,2)}
// SpawnPiece(KindI).Cells() all have y == 2 and x in 3..6
// SpawnPiece(KindO).Cells() == {(4,1),(5,1),(4,2),(5,2)}
// Every kind: max y == 2, so exactly one row is visible at spawn.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'Rotation|Spawn|Kind' -v`
Expected: FAIL — undefined: `PieceKind`, `Piece`, `SpawnPiece`.

- [ ] **Step 3: Implement**

`internal/game/piece.go` per the interface block. Parse the string art once in
`init()`; `Cells()` walks the cached `[4][4]bool` and adds `p.X`, `p.Y`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): tetromino kinds and derived rotation table"
```

---

### Task 3: Seeded 7-bag

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `KindCount` (Task 2).
- Produces:
  ```go
  type Bag struct { rng *rand.Rand; remaining []PieceKind }
  func NewBag(rng *rand.Rand) *Bag
  func (b *Bag) Next() PieceKind    // refills and reshuffles when empty
  ```

`rand` here is `math/rand/v2`. The generator is created by the caller
(Task 4) as `rand.New(rand.NewPCG(uint64(seed), 0x9E3779B97F4A7C15))` so the
whole engine is reproducible from one `int64`.

- [ ] **Step 1: Write the failing tests**

```go
func TestEachBagContainsEverySevenExactlyOnce(t *testing.T)
// Pull 70 pieces; every consecutive group of 7 has all seven kinds once.

func TestSameSeedProducesSameSequence(t *testing.T)
// Two bags from separately constructed PCG generators with seed 8675309 yield
// identical 40-piece sequences.

func TestDifferentSeedsDiverge(t *testing.T)
// Seeds 1 and 2 differ somewhere within the first 40 pieces.

func TestBagShuffles(t *testing.T)
// Across 20 bags from seed 42, at least two bags have different orderings
// (guards against forgetting to shuffle).
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run Bag -v`
Expected: FAIL — undefined: `NewBag`.

- [ ] **Step 3: Implement**

`internal/game/bag.go`. `Next()` refills `remaining` with all seven kinds and
`b.rng.Shuffle` when it is empty, then pops from the end.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag piece generator"
```

---

### Task 4: Game struct, spawning, events, and game over

**Files:**
- Create: `internal/game/game.go`, `internal/game/events.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–3.
- Produces:
  ```go
  const NextQueueLen = 5   // §6: render the next five

  type Game struct {
      Board   Board
      Active  Piece
      Hold    *PieceKind
      CanHold bool
      Next    []PieceKind   // always NextQueueLen long
      Score   int
      Lines   int
      Level   int
      Combo   int
      Over    bool
      Seed    int64
      bag     *Bag
      rng     *rand.Rand
      gravityAcc  time.Duration
      lockAcc     time.Duration
      lockResets  int
      grounded    bool
  }
  func New(seed int64) *Game
  func (g *Game) Ghost() Piece            // Active dropped to its landing row
  func (g *Game) Apply(in Input) []Event
  func (g *Game) Advance(dt time.Duration) []Event

  type Input int
  const (InputNone Input = iota; InputLeft; InputRight; InputSoftDrop;
         InputHardDrop; InputRotateCW; InputRotateCCW; InputHold)

  type EventKind int
  const (EvPieceMoved EventKind = iota; EvPieceRotated; EvPieceHardDropped;
         EvPieceLocked; EvHoldUsed; EvLinesCleared; EvComboChanged;
         EvLevelChanged; EvGameOver)
  type Event struct {
      Kind  EventKind
      Piece Piece  // the piece involved, at its position after the action
      Rows  []int  // EvLinesCleared: cleared row indices, pre-collapse
      Count int    // EvLinesCleared: len(Rows). EvPieceHardDropped: cells fallen.
                   // EvComboChanged: new combo. EvLevelChanged: new level.
  }
  ```

§14 lists the events as separate Go types; one flat struct with a `Kind` is the
same information in a form that `[]Event` can carry without boxing, which §49.2's
`Advance(dt) []Event` signature requires. The FX layer switches on `Kind`.

This task implements only: construction, the next queue, `spawn()`, `Ghost()`,
and the over-state guards. `Apply` and `Advance` exist but handle nothing beyond
the guards yet; Tasks 5–9 fill them in.

- [ ] **Step 1: Write the failing tests**

```go
func TestNewGameStartsWithFullQueueAndActivePiece(t *testing.T)
// len(Next) == 5; Level == 1; Score, Lines, Combo == 0; CanHold true; !Over;
// Active is a spawn-position piece; Seed recorded.

func TestNextQueueRefillsAsPiecesSpawn(t *testing.T)
// After forcing 10 spawns, len(Next) is still 5 and the pieces consumed match
// the order a bag with the same seed produces.

func TestGhostSitsOnTheStack(t *testing.T)
// Empty board: every Ghost cell has y in the bottom rows and Ghost cannot move
// down. With row 21 filled, Ghost's lowest cells are in row 20.

func TestGhostDoesNotMoveTheActivePiece(t *testing.T)
// Active.Y is unchanged after calling Ghost().

func TestSpawnIntoOccupiedCellsEndsTheGame(t *testing.T)
// Fill visible rows 2 and 3 completely, lock the active piece, and assert:
// Over is true and an EvGameOver event was returned.

func TestApplyAndAdvanceAreNoOpsAfterGameOver(t *testing.T)
// Set Over via a blocked spawn, snapshot Score/Lines/Board/Active, then call
// Apply for every Input value and Advance(1s): no events returned, snapshot
// unchanged. Review Focus 3.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'NewGame|Queue|Ghost|Spawn|Apply' -v`
Expected: FAIL — undefined: `New`, `Ghost`, `Apply`.

- [ ] **Step 3: Implement**

`internal/game/events.go` holds `EventKind`, `Event`, `Input`. `internal/game/game.go`
holds `Game`, `New`, `Ghost`, the `spawn()` helper (pops `Next[0]`, tops the queue
up from the bag, resets `CanHold`, `gravityAcc`, `lockAcc`, `lockResets`,
`grounded`, and sets `Over` plus an `EvGameOver` event if the new piece collides),
and `Apply`/`Advance` bodies that `return nil` when `g.Over`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/events.go internal/game/game_test.go
git commit -m "feat(game): game state, spawning, event type, game over"
```

---

### Task 5: Movement and wall-kick rotation

**Files:**
- Modify: `internal/game/game.go`
- Create: `internal/game/rules.go`
- Test: `internal/game/movement_test.go`

**Interfaces:**
- Consumes: Task 4's `Game`, `Apply`, `Event`.
- Produces:
  ```go
  var KickOffsets = [8][2]int{{0,0},{-1,0},{1,0},{-2,0},{2,0},{0,-1},{-1,-1},{1,-1}}
  const (LockDelay = 500 * time.Millisecond; MaxLockResets = 15)
  func (b *Board) Fits(p Piece) bool       // no cell Occupied
  func (g *Game) tryMove(dx, dy int) bool  // moves Active if it fits
  func (g *Game) tryRotate(dir int) bool   // dir +1 CW, -1 CCW; walks KickOffsets
  ```

`Apply` now handles `InputLeft`, `InputRight`, `InputRotateCW`, `InputRotateCCW`,
emitting `EvPieceMoved` / `EvPieceRotated` only on success. A successful move or
rotation while `grounded` resets `lockAcc` to 0 and increments `lockResets`, up to
`MaxLockResets` (§12) — past that, further successes still move the piece but no
longer reset the timer.

- [ ] **Step 1: Write the failing tests**

```go
func TestMoveLeftAndRightShiftTheActivePiece(t *testing.T)
// InputLeft decrements X by 1 and returns one EvPieceMoved.

func TestMoveIntoWallFailsSilently(t *testing.T)
// Push the piece to x=0 and apply InputLeft: X unchanged, no events.

func TestMoveIntoLockedCellsFails(t *testing.T)
// Place a wall of cells to the right of the active piece: InputRight is refused.

func TestRotateAdvancesRotationModuloFour(t *testing.T)
// Four InputRotateCW returns the piece to rotation 0; InputRotateCCW from 0 gives 3.

func TestRotationKicksOffTheLeftWall(t *testing.T)
// Vertical I at x=-? -> place a piece so the naive rotation overlaps the wall;
// assert the resulting X equals the first KickOffsets entry that fits, and one
// EvPieceRotated is returned.

func TestRotationKicksTriedInSpecOrder(t *testing.T)
// Construct a board where only the (-2,0) offset fits and assert the piece lands
// exactly two cells left, proving earlier offsets were tried and rejected first.

func TestRotationFailsWhenNoOffsetFits(t *testing.T)
// Box the piece in on all sides: rotation unchanged, no events.

func TestRotationKickAboveCeilingDoesNotPanic(t *testing.T)
// Spawn-height piece with the row below full so only a (0,-1)/( -1,-1) offset
// fits: rotation succeeds with Y == 0 or -1, no panic. Review Focus 4.

func TestGroundedMoveResetsLockTimerUpToTheCap(t *testing.T)
// Ground a piece, Advance(400ms), apply InputLeft, Advance(400ms): still not
// locked. Repeat the reset 16 times and assert the 16th does not prevent locking.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'Move|Rotat|Grounded' -v`
Expected: FAIL — undefined: `KickOffsets`, and moves are no-ops.

- [ ] **Step 3: Implement**

`internal/game/rules.go` holds `KickOffsets`, `LockDelay`, `MaxLockResets`.
`Board.Fits` goes in `board.go`. `tryMove`/`tryRotate` and the `Apply` cases go in
`game.go`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/rules.go internal/game/board.go internal/game/game.go internal/game/movement_test.go
git commit -m "feat(game): movement and forgiving wall-kick rotation"
```

---

### Task 6: Gravity, lock delay, and locking

**Files:**
- Modify: `internal/game/game.go`, `internal/game/rules.go`
- Test: `internal/game/gravity_test.go`

**Interfaces:**
- Consumes: Tasks 4–5.
- Produces:
  ```go
  const (BaseInterval = 800 * time.Millisecond; MinInterval = 60 * time.Millisecond)
  func DropInterval(level int) time.Duration   // max(MinInterval, 800ms * 0.86^(level-1))
  func (g *Game) lock() []Event                // commit, clear, score, spawn
  ```

`Advance(dt)`: return `nil` if `g.Over` or `dt <= 0`. Otherwise add `dt` to
`gravityAcc` and step down while `gravityAcc >= DropInterval(g.Level)`, breaking
out the moment a step is refused, and capping the loop at `Height` iterations so a
pathological `dt` cannot spin. Then, if the piece cannot move down, add `dt` to
`lockAcc` and call `lock()` once `lockAcc >= LockDelay`; if it can move down,
`grounded` is false and `lockAcc` resets to 0.

`lock()` runs §12's order: commit the piece cells to the board, detect full rows,
clear them, update score (Task 7), emit `EvPieceLocked` then `EvLinesCleared` /
`EvComboChanged` / `EvLevelChanged`, then spawn (which may append `EvGameOver`).
Task 6 wires the sequence with scoring stubbed at zero; Task 7 fills in the maths.

- [ ] **Step 1: Write the failing tests**

```go
func TestDropIntervalHalvesRoughlyEveryFiveLevels(t *testing.T)
// level 1 == 800ms; level 2 == 688ms; level 5 is within 1ms of 800*0.86^4.

func TestDropIntervalClampsAtSixtyMilliseconds(t *testing.T)
// Levels 20, 30, 300 all return exactly MinInterval and never <= 0. Review Focus 5.

func TestGravityStepsOnceAfterOneInterval(t *testing.T)
// Advance(799ms): Y unchanged. Advance(2ms): Y+1, one EvPieceMoved.

func TestGravityCarriesRemainderBetweenFrames(t *testing.T)
// Ten Advance(100ms) calls produce exactly one step, not zero and not two.

func TestAdvanceWithZeroOrNegativeDtDoesNothing(t *testing.T)
// Advance(0) and Advance(-50ms): no events, Y and accumulators unchanged.
// Review Focus 1.

func TestHugeDtDoesNotPushPieceThroughTheFloor(t *testing.T)
// Level 20 (MinInterval), empty board, Advance(10s): every Active cell has
// y < Height, the piece is resting on the floor or already locked, and the call
// returns without hanging. Review Focus 2.

func TestPieceLocksAfterLockDelayOnTheFloor(t *testing.T)
// Drop to the floor, Advance(499ms): Active unchanged, board empty.
// Advance(2ms): board holds four cells, EvPieceLocked returned, new Active
// spawned at spawn height.

func TestLockCommitsExactlyTheActiveCells(t *testing.T)
// After a lock, the set of non-empty board cells equals the pre-lock Cells(),
// each holding Cell(kind)+1.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'DropInterval|Gravity|Advance|Lock' -v`
Expected: FAIL — undefined: `DropInterval`.

- [ ] **Step 3: Implement**

Add `DropInterval` (`math.Pow(0.86, float64(level-1))`) and `MinInterval`/`BaseInterval`
to `rules.go`; fill in `Advance` and `lock` in `game.go`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/rules.go internal/game/game.go internal/game/gravity_test.go
git commit -m "feat(game): elapsed-time gravity, lock delay, locking"
```

---

### Task 7: Scoring, combo, and level progression

**Files:**
- Create: `internal/game/scoring.go`
- Modify: `internal/game/game.go`
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: Task 6's `lock()`.
- Produces:
  ```go
  func ClearScore(lines, level int) int   // 0/100/300/500/800 x level
  func ComboBonus(combo, level int) int   // 50 * (combo-1) * level, 0 below combo 2
  func LevelForLines(lines int) int       // 1 + lines/10
  ```

`lock()` now: `Lines += n`; `Score += ClearScore(n, level) + ComboBonus(combo, level)`
using the level *before* the level-up (so a clear is paid at the level it happened
at); `Combo` becomes `Combo+1` when `n > 0` and `0` when `n == 0`, emitting
`EvComboChanged` whenever the value changes; `Level` recomputed with
`LevelForLines`, emitting `EvLevelChanged` when it moves.

- [ ] **Step 1: Write the failing tests**

```go
func TestClearScoreMatchesSpecTable(t *testing.T)
// level 1: 100/300/500/800 for 1..4 lines. level 7: 700/2100/3500/5600. 0 lines: 0.

func TestComboBonusStartsAtComboTwo(t *testing.T)
// ComboBonus(0,5) == 0; ComboBonus(1,5) == 0; ComboBonus(2,5) == 250;
// ComboBonus(4,3) == 450.

func TestComboIncrementsOnConsecutiveClears(t *testing.T)
// Two clearing locks in a row: Combo == 2 and an EvComboChanged{Count: 2} fired.

func TestNonClearingPlacementResetsCombo(t *testing.T)
// Combo 3, then a lock that clears nothing: Combo == 0, EvComboChanged{Count: 0}.

func TestNonClearingPlacementAtComboZeroEmitsNoComboEvent(t *testing.T)
// Combo already 0: no EvComboChanged (guards against event spam every lock).

func TestLevelRisesEveryTenLines(t *testing.T)
// LevelForLines: 0->1, 9->1, 10->2, 19->2, 20->3, 127->13.

func TestLevelChangedEventFiresOnceOnCrossing(t *testing.T)
// Engineer the board so a lock takes Lines from 9 to 10: exactly one
// EvLevelChanged{Count: 2}.

func TestClearIsPaidAtThePreLevelUpLevel(t *testing.T)
// A single-line clear taking lines 9->10 scores 100*1, not 100*2.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'Score|Combo|Level' -v`
Expected: FAIL — undefined: `ClearScore`.

- [ ] **Step 3: Implement**

`internal/game/scoring.go` with the three pure functions; wire them into `lock()`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/scoring.go internal/game/game.go internal/game/scoring_test.go
git commit -m "feat(game): clear scoring, combo bonus, level progression"
```

---

### Task 8: Soft drop and hard drop

**Files:**
- Modify: `internal/game/game.go`, `internal/game/scoring.go`
- Test: `internal/game/drop_test.go`

**Interfaces:**
- Consumes: Tasks 5–7.
- Produces:
  ```go
  const (SoftDropPoints = 1; HardDropPoints = 2)
  ```

`Apply(InputSoftDrop)`: try one step down; on success `Score += SoftDropPoints`
and emit `EvPieceMoved`, and reset `gravityAcc` so soft drop and gravity do not
double-step. On failure, nothing (lock delay owns locking).

`Apply(InputHardDrop)`: step down until refused, counting cells; `Score += 2 * cells`;
emit `EvPieceHardDropped{Piece: final, Count: cells}`, then lock immediately —
hard drop does not wait out the lock delay, which is what makes §18's impact land
on the same frame as the key.

- [ ] **Step 1: Write the failing tests**

```go
func TestSoftDropMovesOneCellAndScoresOne(t *testing.T)
// Y+1, Score+1, one EvPieceMoved.

func TestSoftDropOnTheFloorScoresNothing(t *testing.T)
// Grounded piece: Y and Score unchanged, no events, piece not yet locked.

func TestHardDropLandsOnTheStackAndScoresTwoPerCell(t *testing.T)
// From spawn on an empty board: final cells match Ghost()'s cells before the
// drop, Score == 2 * cells fallen, and EvPieceHardDropped.Count equals that count.

func TestHardDropLocksImmediately(t *testing.T)
// Events include EvPieceHardDropped then EvPieceLocked, a new piece is active,
// and the board holds the dropped cells with no Advance call in between.

func TestHardDropWithNowhereToFallScoresZeroAndStillLocks(t *testing.T)
// Grounded piece: EvPieceHardDropped.Count == 0, Score unchanged, EvPieceLocked
// present.

func TestHardDropThatClearsALineReportsBothEvents(t *testing.T)
// Board one cell short of a full row: events contain EvPieceHardDropped,
// EvPieceLocked, and EvLinesCleared with the right Rows.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run Drop -v`
Expected: FAIL — soft/hard drop inputs are no-ops.

- [ ] **Step 3: Implement**

Add the two constants and the two `Apply` cases.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/scoring.go internal/game/drop_test.go
git commit -m "feat(game): soft drop and hard drop with drop scoring"
```

---

### Task 9: Hold

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/hold_test.go`

**Interfaces:**
- Consumes: Tasks 4–8.
- Produces: `Apply(InputHold)` behaviour; no new exported names.

Rules (§9): if `!CanHold`, refuse. If `Hold == nil`, store the active kind and
spawn the next piece from the queue. Otherwise swap: the held kind becomes a fresh
spawn-rotation piece at the spawn position, the active kind goes into `Hold`.
Either way `CanHold = false`, timers reset, and one `EvHoldUsed` is emitted
carrying the *incoming* piece. `CanHold` returns to true on the next lock-driven
spawn. A hold that would place the incoming piece into occupied cells ends the
game exactly as a blocked spawn does.

- [ ] **Step 1: Write the failing tests**

```go
func TestFirstHoldStoresActiveAndPullsFromQueue(t *testing.T)
// Hold points at the old active kind; the new Active is the old Next[0];
// len(Next) still 5; one EvHoldUsed.

func TestSecondHoldBeforeLockIsRefused(t *testing.T)
// Two InputHold in a row: second returns no events and changes nothing.

func TestHoldSwapsWithStoredPiece(t *testing.T)
// Hold an I, lock a piece, hold again: Active is the I at spawn position and
// rotation 0, Hold now holds the kind that was active.

func TestHeldPieceReturnsAtSpawnRotation(t *testing.T)
// Rotate the active piece to rotation 2, hold it, lock a piece, hold again:
// Active.Rotation == 0 and Active is at the spawn X/Y for its kind.

func TestHoldIsAvailableAgainAfterALock(t *testing.T)
// Hold, hard drop, then hold: succeeds.

func TestHoldDoesNotChangeScoreOrLines(t *testing.T)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run Hold -v`
Expected: FAIL — `InputHold` is a no-op.

- [ ] **Step 3: Implement**

The `InputHold` case in `Apply`, reusing the `spawn()` helper's collision-and-
game-over path.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/hold_test.go
git commit -m "feat(game): hold with once-per-piece restriction"
```

---

### Task 10: Determinism replay test

**Files:**
- Create: `internal/game/replay_test.go`
- Test: same file (this task is entirely test code plus whatever it exposes)

**Interfaces:**
- Consumes: `New`, `Apply`, `Advance`, all state fields.
- Produces:
  ```go
  func (g *Game) Fingerprint() uint64   // FNV-1a over board cells, then
                                        // Score, Lines, Level, Combo, Active,
                                        // Hold, Next — in that order
  ```

This is §35's promise made checkable and §49.2's reason for existing: timing is an
input, so a canned `(Input, dt)` stream is a complete description of a session.

- [ ] **Step 1: Write the failing test**

```go
type step struct{ in Input; dt time.Duration }

func canned() []step  // ~200 deterministic steps built from a fixed pattern:
                      // rotate/left/right/soft/hard-drop/hold interleaved with
                      // dt values of 0, 17ms, 40ms and 250ms. No randomness.

func TestReplayIsReproducible(t *testing.T)
// Two games from seed 8675309 fed canned(): identical Fingerprint(), Score,
// Lines, Level, Combo, Board, Next.

func TestReplayFingerprintIsStable(t *testing.T)
// One game from seed 8675309 fed canned(): Fingerprint() equals a constant
// recorded in the test. Fill the constant in from the first run; this pins the
// engine against accidental behaviour changes.

func TestReplayDiffersBySeed(t *testing.T)
// Seeds 8675309 and 1234 fed the same stream: different Fingerprint().

func TestNoClockCallsInGamePackage(t *testing.T)
// go/parser walks every non-test .go file in the package directory and fails if
// any selector expression is time.Now, time.Since, or time.Tick. Review: this is
// the executable form of the Global Constraint from 49.2.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run Replay -v`
Expected: FAIL — undefined: `Fingerprint`.

- [ ] **Step 3: Implement**

Add `Fingerprint()` to `game.go` using `hash/fnv`. Run the replay test once to
read the fingerprint, then paste it into `TestReplayFingerprintIsStable`.

- [ ] **Step 4: Run the whole suite**

Run: `go test ./internal/game/ -v -count=1`
Expected: PASS. Also run `go vet ./...` and `gofmt -l internal cmd` (expect no output).

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/replay_test.go
git commit -m "test(game): canned-input replay pins determinism"
```

---

## Done when

`go test ./internal/game/ -count=1` is green and covers every §40 bullet under
Board, Pieces, Bag, Hold, Drop, Score, Game over, and Determinism. The package
imports nothing outside the standard library, contains no clock call, and exposes
`Apply`, `Advance`, `Ghost`, `Fingerprint` plus the state fields that Plan 02's
renderer reads.
