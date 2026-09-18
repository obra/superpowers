# Cosmic Tetris — Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the headless, deterministic Cosmic Tetris game engine — pieces, board, 7-bag, movement, wall kicks, gravity, lock delay, line clearing, hold, scoring, game over — with comprehensive unit tests and a replay determinism test, before any terminal code exists.

**Architecture:** One package, `internal/game`, with no dependencies outside the standard library. It never reads a clock: all time enters through `(*Game).Advance(dt time.Duration) []Event`. Every mutating method returns a `[]Event` slice describing what happened, which later plans feed to the effects system. The package owns a single `*rand.Rand` that drives the 7-bag and nothing else.

**Tech Stack:** Go 1.26, standard library only (`math`, `math/rand`, `time`, `strings`).

**Spec:** `design.md` (§5–§13, §34, §35, §40, §42 Phase 1, §49.1, §49.2, §49.6)

## Global Constraints

- Module path: `cosmic-tetris`. Go directive: `go 1.26`.
- Nothing under `internal/game` may import `charm.land/*`, and nothing under `internal/game` may call `time.Now()` (§49.2). Task 11 enforces this with a test.
- Board: width 10, height 22, visible rows 20, hidden spawn rows 2 (§5).
- `y` grows downward. `Board.Cells[0]` is the top hidden row; `Board.Cells[21]` is the bottom visible row.
- Game RNG is `*rand.Rand` owned by `Game` and used only by the 7-bag (§49.6). FX RNG is a separate generator created in a later plan; they never share.
- Combo indexing and bonus follow §49.1 exactly: first clearing placement sets combo to 1; bonus is `50 × (combo - 1) × level`.
- Test command for this plan: `go test ./internal/game/...`.
- Commit style: `feat:`, `test:`, `chore:` prefixes; one commit per task.

## Review Focus

These are behaviors the spec implies but never states. Each has a test added to the task that owns the code.

1. `Advance` called with a `dt` far larger than the drop interval (laptop sleep, Ctrl-Z resume) must not cascade through many pieces in one call — Task 6.
2. A wall kick offset that would place cells above row 0 must be handled consistently and must never write outside the `Cells` array — Task 5.
3. `HardDrop` on a piece already resting on the stack must score 0 and lock without a negative drop distance — Task 7.
4. `UseHold` when the swapped-in piece cannot fit at spawn must end the game, not overlap locked cells — Task 9.
5. `DropInterval` at very high levels must stay at or above 60 ms and never reach 0 — a zero interval divides by zero in the gravity loop — Task 8.

## Plan Set

Run in this order. A ruling that changes a name, signature, or value that a later plan consumes must be applied to that plan's document before the next task starts.

1. `plans/2026-09-18-cosmic-tetris-engine.md` (this plan) — headless deterministic game engine. Consumes: nothing.
2. `plans/2026-09-18-cosmic-tetris-terminal.md` — Bubble Tea app, renderer, layout, HUD, overlays, CLI. Consumes: the entire `internal/game` public API produced here, especially `Advance`, `Event`, `Snapshot`, `GhostY`, and the `Board`/`Piece` accessors.
3. `plans/2026-09-18-cosmic-tetris-effects.md` — starfield, particles, trails, shake, supernova, hyperdrive, boot, black hole, mission control. Consumes: `game.Event`, `game.Snapshot` from here, and `render.Input`, `render.Theme`, `app.Model` from plan 2.

---

### Task 1: Module scaffold, board geometry, collision

**Files:**
- Create: `go.mod`, `LICENSE`, `.gitignore`
- Create: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```go
  const (
      Width       = 10
      Height      = 22
      VisibleRows = 20
      HiddenRows  = 2
  )

  type Point struct{ X, Y int }

  type Cell struct {
      Filled bool
      Kind   PieceKind
  }

  type Board struct {
      Cells [Height][Width]Cell
  }

  func (b *Board) InBounds(x, y int) bool // 0<=x<Width && 0<=y<Height
  func (b *Board) Occupied(x, y int) bool // true off the left/right/bottom edges; false for y<0 (open sky)
  func (b *Board) String() string         // Height lines of Width runes: '.' empty, kind letter filled
  ```

- [ ] **Step 1: Create the module scaffold**

`go.mod`:

```
module cosmic-tetris

go 1.26
```

`LICENSE`: MIT, copyright holder `Jesse Vincent`, year 2026. `.gitignore`: `/cosmic-tetris` and `*.test`.

- [ ] **Step 2: Write the failing tests**

`PieceKind` does not exist yet; declare the minimal `type PieceKind uint8` in `board.go` for now and let Task 2 replace it with the full type.

```go
func TestInBounds(t *testing.T) {
	var b Board
	for _, c := range []struct{ x, y int; want bool }{
		{0, 0, true}, {9, 21, true}, {-1, 0, false},
		{10, 0, false}, {0, -1, false}, {0, 22, false},
	} { /* assert b.InBounds(c.x, c.y) == c.want */ }
}

func TestOccupiedTreatsWallsAndFloorAsSolidAndSkyAsOpen(t *testing.T) {
	var b Board
	// walls and floor are solid
	// y == -1 and y == -4 are open
	// an empty in-bounds cell is open
}

func TestOccupiedReportsFilledCells(t *testing.T) {
	var b Board
	b.Cells[21][4] = Cell{Filled: true}
	// b.Occupied(4, 21) == true, b.Occupied(4, 20) == false
}

func TestBoardStringRendersGrid(t *testing.T) {
	var b Board
	b.Cells[21][0] = Cell{Filled: true, Kind: 0}
	got := b.String()
	// 22 lines, each 10 runes; last line starts with the kind letter for kind 0 and then nine '.'
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestInBounds|TestOccupied|TestBoardString' -v`
Expected: FAIL — undefined identifiers.

- [ ] **Step 4: Implement the constants, `Point`, `Cell`, `Board`, `InBounds`, `Occupied`, `String` in `internal/game/board.go`**

`String` is a debugging and test-fingerprint helper; lines are joined with `\n` and the result ends with a trailing `\n`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add go.mod LICENSE .gitignore internal/game/
git commit -m "feat: board geometry and collision primitives"
```

---

### Task 2: Piece kinds, rotation tables, spawn

**Files:**
- Create: `internal/game/piece.go`
- Modify: `internal/game/board.go` (remove the placeholder `PieceKind`)
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: `Point`, `Width`, `HiddenRows` (Task 1).
- Produces:
  ```go
  type PieceKind uint8

  const (
      KindI PieceKind = iota
      KindJ
      KindL
      KindO
      KindS
      KindT
      KindZ
      KindCount = 7
  )

  func (k PieceKind) String() string // "I" "J" "L" "O" "S" "T" "Z"

  type Piece struct {
      Kind     PieceKind
      Rotation int // 0..3
      X, Y     int // origin of the piece's bounding box, board coordinates
  }

  func (p Piece) Cells() [4]Point // absolute board coordinates
  func Spawn(kind PieceKind) Piece // Rotation 0, Y 0, X per the spawn table below
  ```

- [ ] **Step 1: Write the failing tests**

```go
func TestEveryRotationHasFourCells(t *testing.T) {
	// for each of the 7 kinds and each of the 4 rotations:
	// Piece{Kind: k, Rotation: r}.Cells() has 4 distinct Points,
	// each with 0 <= X < 4 and 0 <= Y < 4
}

func TestSpawnPlacesPieceEntirelyInHiddenRows(t *testing.T) {
	// for each kind: every cell of Spawn(kind).Cells() has Y < HiddenRows
	// and 0 <= X < Width
}

func TestSpawnRotationIsZero(t *testing.T) {
	// for each kind: Spawn(kind).Rotation == 0
}

func TestORotatesToTheSameCells(t *testing.T) {
	// Piece{Kind: KindO, Rotation: r}.Cells() is identical for r in 0..3
}

func TestRotationTablesAreDistinctPerKindExceptO(t *testing.T) {
	// for each kind except KindO: rotation 0 and rotation 1 differ
}

func TestCellsTranslatesByOrigin(t *testing.T) {
	// Piece{Kind: KindT, Rotation: 0, X: 3, Y: 5}.Cells() equals
	// Piece{Kind: KindT, Rotation: 0}.Cells() with (3,5) added to each Point
}

func TestPieceKindString(t *testing.T) {
	// KindI..KindZ stringify to "I" "J" "L" "O" "S" "T" "Z"
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestEveryRotation|TestSpawn|TestO|TestRotationTables|TestCells|TestPieceKindString' -v`
Expected: FAIL — undefined identifiers.

- [ ] **Step 3: Implement `piece.go` with the pinned shape and spawn tables**

The rotation table is spec data, not derivable — use exactly these offsets (standard SRS orientations, `y` downward, offsets relative to the piece's bounding-box origin):

```go
// shapes[kind][rotation] holds the four cells of that orientation.
var shapes = [KindCount][4][4]Point{
	KindI: {
		{{0, 1}, {1, 1}, {2, 1}, {3, 1}},
		{{2, 0}, {2, 1}, {2, 2}, {2, 3}},
		{{0, 2}, {1, 2}, {2, 2}, {3, 2}},
		{{1, 0}, {1, 1}, {1, 2}, {1, 3}},
	},
	KindJ: {
		{{0, 0}, {0, 1}, {1, 1}, {2, 1}},
		{{1, 0}, {2, 0}, {1, 1}, {1, 2}},
		{{0, 1}, {1, 1}, {2, 1}, {2, 2}},
		{{1, 0}, {1, 1}, {0, 2}, {1, 2}},
	},
	KindL: {
		{{2, 0}, {0, 1}, {1, 1}, {2, 1}},
		{{1, 0}, {1, 1}, {1, 2}, {2, 2}},
		{{0, 1}, {1, 1}, {2, 1}, {0, 2}},
		{{0, 0}, {1, 0}, {1, 1}, {1, 2}},
	},
	KindO: {
		{{0, 0}, {1, 0}, {0, 1}, {1, 1}},
		{{0, 0}, {1, 0}, {0, 1}, {1, 1}},
		{{0, 0}, {1, 0}, {0, 1}, {1, 1}},
		{{0, 0}, {1, 0}, {0, 1}, {1, 1}},
	},
	KindS: {
		{{1, 0}, {2, 0}, {0, 1}, {1, 1}},
		{{1, 0}, {1, 1}, {2, 1}, {2, 2}},
		{{1, 1}, {2, 1}, {0, 2}, {1, 2}},
		{{0, 0}, {0, 1}, {1, 1}, {1, 2}},
	},
	KindT: {
		{{1, 0}, {0, 1}, {1, 1}, {2, 1}},
		{{1, 0}, {1, 1}, {2, 1}, {1, 2}},
		{{0, 1}, {1, 1}, {2, 1}, {1, 2}},
		{{1, 0}, {0, 1}, {1, 1}, {1, 2}},
	},
	KindZ: {
		{{0, 0}, {1, 0}, {1, 1}, {2, 1}},
		{{2, 0}, {1, 1}, {2, 1}, {1, 2}},
		{{0, 1}, {1, 1}, {1, 2}, {2, 2}},
		{{1, 0}, {0, 1}, {1, 1}, {0, 2}},
	},
}

// spawnX centres each piece's bounding box on the 10-wide board.
var spawnX = [KindCount]int{KindI: 3, KindJ: 3, KindL: 3, KindO: 4, KindS: 3, KindT: 3, KindZ: 3}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/
git commit -m "feat: tetromino kinds, rotation tables, and spawn placement"
```

---

### Task 3: Piece fit, locking, row completion and collapse

**Files:**
- Modify: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Board`, `Occupied` (Task 1); `Piece`, `Piece.Cells` (Task 2).
- Produces:
  ```go
  func (b *Board) Fits(p Piece) bool        // false if any cell is Occupied
  func (b *Board) Lock(p Piece)             // writes p's cells as Cell{Filled: true, Kind: p.Kind}; skips cells with y < 0
  func (b *Board) CompleteRows() []int      // row indices with all Width cells filled, ascending; nil when none
  func (b *Board) ClearRows(rows []int)     // removes those rows and collapses everything above downward
  ```

- [ ] **Step 1: Write the failing tests**

Use a helper that builds a board from a `[]string` picture (one string per row, `.` empty, any other rune filled) so the tests stay readable; put it in `board_test.go`.

```go
func TestFitsRejectsOverlapAndOutOfBounds(t *testing.T) {
	// an empty board fits Spawn(KindT)
	// a board with row 21 full does not fit Piece{KindO, 0, 4, 20}
	// Piece{KindI, 1, -1, 0} (box hanging off the left) does not fit
	// Piece{KindO, 0, 4, 20} fits on an empty board
}

func TestFitsAllowsCellsAboveTheTopRow(t *testing.T) {
	// Piece{KindI, 1, 3, -2} has cells at y -2..1; Fits returns true on an empty board
}

func TestLockWritesKindAndSkipsCellsAboveTheBoard(t *testing.T) {
	// Lock(Piece{KindZ, 0, 0, 0}) fills the expected 4 cells with Kind KindZ
	// Lock(Piece{KindI, 1, 3, -3}) writes only the cells with y >= 0 and does not panic
}

func TestCompleteRowsReturnsAscendingIndices(t *testing.T) {
	// board with rows 19 and 21 full -> []int{19, 21}
	// empty board -> nil
	// a row with one gap is not reported
}

func TestClearRowsCollapsesFromAbove(t *testing.T) {
	// picture:  row 19 = "X........."
	//           row 20 = "XXXXXXXXXX"
	//           row 21 = "XXXXXXXXXX"
	// ClearRows([]int{20, 21}) leaves row 21 = "X........." and rows 0..20 empty
}

func TestClearRowsHandlesNonAdjacentRows(t *testing.T) {
	// rows 18 and 20 full, row 19 = ".X........", row 21 = "..X.......";
	// after ClearRows([]int{18, 20}): row 20 = ".X........", row 21 = "..X......."
}

func TestClearRowsWithEmptyInputIsANoOp(t *testing.T) {
	// ClearRows(nil) leaves String() unchanged
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestFits|TestLock|TestCompleteRows|TestClearRows' -v`
Expected: FAIL — undefined methods.

- [ ] **Step 3: Implement `Fits`, `Lock`, `CompleteRows`, `ClearRows` in `internal/game/board.go`**

`ClearRows` should copy surviving rows downward in a single bottom-up pass rather than shifting once per cleared row.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/
git commit -m "feat: piece fit, locking, row completion and collapse"
```

---

### Task 4: 7-bag piece generation

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `KindCount` (Task 2).
- Produces:
  ```go
  type Bag struct {
      remaining []PieceKind
  }

  func (b *Bag) Next(rng *rand.Rand) PieceKind // refills and shuffles when empty, then pops
  ```

`Bag` deliberately does not hold an RNG — `Game` owns the only game RNG (§49.6) and passes it in.

- [ ] **Step 1: Write the failing tests**

```go
func TestEveryBagContainsAllSevenKindsExactlyOnce(t *testing.T) {
	var b Bag
	rng := rand.New(rand.NewSource(1))
	for round := 0; round < 20; round++ {
		var seen [KindCount]int
		for i := 0; i < KindCount; i++ { seen[b.Next(rng)]++ }
		// every count is exactly 1
	}
}

func TestSameSeedProducesSameSequence(t *testing.T) {
	// two Bags driven by rand.New(rand.NewSource(8675309)) produce identical
	// 50-element sequences
}

func TestDifferentSeedsDiverge(t *testing.T) {
	// seeds 1 and 2 produce different 50-element sequences
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestEveryBag|TestSameSeed|TestDifferentSeeds' -v`
Expected: FAIL — undefined `Bag`.

- [ ] **Step 3: Implement `Bag.Next` in `internal/game/bag.go`**

Use `rng.Shuffle` on the refilled slice. Reuse the backing array across refills.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/
git commit -m "feat: seeded 7-bag piece generation"
```

---

### Task 5: Game state, events, movement, wall-kick rotation

**Files:**
- Create: `internal/game/events.go`, `internal/game/game.go`, `internal/game/rules.go`
- Test: `internal/game/game_test.go`, `internal/game/rotation_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces:
  ```go
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
      Piece Piece // the piece involved, in its post-event position
      Rows  []int // LinesCleared: the cleared row indices, ascending
      Value int   // PieceHardDropped: cells fallen. ComboChanged: new combo. LevelChanged: new level. LinesCleared: number of rows.
  }

  type State uint8

  const (
      StatePlaying State = iota
      StateOver
  )

  type Game struct {
      Board   Board
      Active  Piece
      Hold    *PieceKind
      CanHold bool

      Next []PieceKind // always exactly NextCount entries
      Bag  Bag

      Score int
      Lines int
      Level int
      Combo int

      GravityAccumulator time.Duration
      LockAccumulator    time.Duration

      State State
      Seed  int64
      // unexported: rng *rand.Rand, grounded bool, lockResets int
  }

  const NextCount = 5

  func New(seed int64) *Game
  func (g *Game) MoveLeft() []Event
  func (g *Game) MoveRight() []Event
  func (g *Game) RotateCW() []Event
  func (g *Game) RotateCCW() []Event

  // kickOffsets is tried in order; the first offset that Fits wins (§7).
  var kickOffsets = [8]Point{{0, 0}, {-1, 0}, {1, 0}, {-2, 0}, {2, 0}, {0, -1}, {-1, -1}, {1, -1}}
  ```

- [ ] **Step 1: Write the failing tests**

```go
func TestNewGameStartsPlayingWithAFullQueue(t *testing.T) {
	g := New(42)
	// g.State == StatePlaying, g.Level == 1, g.Score == 0, g.Lines == 0, g.Combo == 0
	// len(g.Next) == NextCount, g.Hold == nil, g.CanHold == true
	// g.Seed == 42, g.Board.String() has no filled cells
	// g.Active equals Spawn(<first bag draw for seed 42>) — assert Active.Rotation == 0 and all cells Y < HiddenRows
}

func TestMoveLeftAndRightShiftTheActivePiece(t *testing.T) {
	// MoveRight returns one Event{Kind: PieceMoved} and X increases by 1
	// MoveLeft returns it back
}

func TestMoveIsBlockedByTheWall(t *testing.T) {
	// move left until it stops; the last call returns nil and X is unchanged
	// the leftmost cell X is 0
}

func TestMoveIsBlockedByLockedCells(t *testing.T) {
	// with a filled column to the piece's right, MoveRight returns nil
}

func TestRotateCWAdvancesRotationAndEmitsEvent(t *testing.T) {
	// Rotation goes 0 -> 1 and one Event{Kind: PieceRotated} is returned
}

func TestRotateCCWWrapsFromZeroToThree(t *testing.T) {
	// Rotation 0 -> 3
}

func TestRotationKicksOffTheLeftWall(t *testing.T) {
	// place an I piece at X such that rotation 1 would put cells at X < 0;
	// RotateCW succeeds and the resulting cells are all in bounds
}

func TestRotationKicksOffTheRightWall(t *testing.T) {
	// symmetric case against column 9
}

func TestRotationFailsWhenNoOffsetFits(t *testing.T) {
	// build a board where the active piece is sealed in a one-cell-wide well;
	// RotateCW returns nil and Rotation is unchanged
}

func TestKickAboveTheTopRowStaysWithinTheBoardArray(t *testing.T) {
	// Review Focus #2: put the active piece at Y 0 against a floor that forces
	// the (0,-1) kick; RotateCW succeeds, resulting Y is -1, cells with Y < 0
	// are allowed by Fits, and a following Lock writes nothing out of range
	// (assert no panic and Board.String() length is unchanged)
}

func TestInputsAreIgnoredAfterGameOver(t *testing.T) {
	// with State forced to StateOver, MoveLeft/MoveRight/RotateCW/RotateCCW all return nil
	// and leave Active untouched
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestNewGame|TestMove|TestRotat|TestKick|TestInputsAreIgnored' -v`
Expected: FAIL — undefined `New`, `Game`, `Event`.

- [ ] **Step 3: Implement `events.go`, `game.go` (state, `New`, `refillNext`, `spawnNext`) and `rules.go` (`MoveLeft`, `MoveRight`, `RotateCW`, `RotateCCW`, `kickOffsets`)**

`New` seeds `rng` with `rand.NewSource(seed)`, fills `Next` to `NextCount`, and sets `Active` from the first draw. Rotation applies `(Rotation ± 1 + 4) % 4` to a trial piece, then tries `kickOffsets` in order. Movement and rotation must return `nil` (not an empty slice) when nothing happened, so callers can test with a plain length check.

Grounded bookkeeping is Task 6's job; for now leave the `grounded` and `lockResets` fields declared and unused.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/
git commit -m "feat: game state, event stream, movement and wall-kick rotation"
```

---

### Task 6: Gravity, lock delay, lock resets — `Advance(dt)`

**Files:**
- Modify: `internal/game/rules.go`, `internal/game/game.go`
- Test: `internal/game/advance_test.go`

**Interfaces:**
- Consumes: Task 5's `Game`, `Event`.
- Produces:
  ```go
  const (
      LockDelay     = 500 * time.Millisecond
      MaxLockResets = 15
      BaseInterval  = 800 * time.Millisecond
      MinInterval   = 60 * time.Millisecond
  )

  func DropInterval(level int) time.Duration // BaseInterval * 0.86^(level-1), floored at MinInterval; level < 1 treated as 1
  func (g *Game) Advance(dt time.Duration) []Event
  func (g *Game) Grounded() bool
  ```

Pinned `Advance` semantics — the whole timing contract lives here:

```text
if State != StatePlaying: return nil
GravityAccumulator += dt
loop (at most VisibleRows+Height times):
    interval := DropInterval(Level)
    if GravityAccumulator < interval: break
    GravityAccumulator -= interval
    if the active piece can step down: step it, emit PieceMoved, grounded = false
    else: grounded = true; break
if grounded:
    LockAccumulator += dt
    if LockAccumulator >= LockDelay || lockResets >= MaxLockResets:
        lock the piece (Task 7's lockPiece), then return — at most one lock per Advance call,
        and both accumulators reset to 0 so leftover time never cascades into the next piece
else:
    LockAccumulator = 0
```

A successful `MoveLeft`/`MoveRight`/`RotateCW`/`RotateCCW` while `grounded` sets `LockAccumulator = 0` and increments `lockResets`, but only while `lockResets < MaxLockResets`.

- [ ] **Step 1: Write the failing tests**

```go
func TestDropIntervalFollowsTheLevelCurve(t *testing.T) {
	// level 1 == 800ms
	// level 2 is within 1ms of 688ms
	// level 5 is within 1ms of 800ms * math.Pow(0.86, 4)
	// DropInterval is monotonically non-increasing for levels 1..40
}

func TestDropIntervalIsFlooredAndNeverZero(t *testing.T) {
	// Review Focus #5
	// DropInterval(40) == MinInterval
	// DropInterval(1000) == MinInterval
	// DropInterval(0) == DropInterval(1)
	// for level 1..1000: DropInterval(level) >= MinInterval
}

func TestPieceDoesNotDescendBeforeTheInterval(t *testing.T) {
	// Advance(799ms) on a fresh level-1 game returns no PieceMoved and Active.Y is unchanged
}

func TestPieceDescendsOncePerInterval(t *testing.T) {
	// Advance(800ms) yields exactly one PieceMoved and Y increases by 1
	// Advance(1600ms) yields exactly two PieceMoved and Y increases by 2
}

func TestGroundedPieceLocksAfterLockDelay(t *testing.T) {
	// hard-drop-free setup: Advance in 800ms steps until Grounded() is true
	// Advance(499ms) does not emit PieceLocked
	// one more Advance(1ms) emits PieceLocked
}

func TestMovementWhileGroundedResetsTheLockTimer(t *testing.T) {
	// once Grounded(): Advance(400ms), MoveLeft(), Advance(400ms) -> no PieceLocked yet
}

func TestLockResetsAreCappedAtFifteen(t *testing.T) {
	// once Grounded(): 15 rounds of {Advance(400ms), successful MoveLeft/MoveRight}
	// the 16th successful move does not reset the timer, and the next Advance locks
}

func TestLargeDtLocksAtMostOncePerCall(t *testing.T) {
	// Review Focus #1
	// g := New(7); evs := g.Advance(10 * time.Second)
	// exactly one PieceLocked event
	// the active piece after the call is at spawn height (all cells Y < HiddenRows)
	// GravityAccumulator == 0 && LockAccumulator == 0
	// at most one row of the board is occupied by the locked piece (no cascade of pieces)
}

func TestAdvanceWithZeroDtIsANoOp(t *testing.T) {
	// Advance(0) on a fresh game returns nil and leaves Active, Score and accumulators unchanged
}

func TestAdvanceAfterGameOverReturnsNil(t *testing.T) {
	// State forced to StateOver: Advance(5 * time.Second) returns nil
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestDropInterval|TestPieceDo|TestPieceDesc|TestGrounded|TestMovementWhile|TestLockResets|TestLargeDt|TestAdvance' -v`
Expected: FAIL — undefined `Advance`, `DropInterval`.

- [ ] **Step 3: Implement `DropInterval`, `Advance`, `Grounded`, and the lock-reset hook in the four input methods**

`DropInterval` uses `math.Pow(0.86, float64(level-1))`. Task 7 supplies `lockPiece`; until then `Advance` may call a stub `lockPiece` that commits the piece and spawns the next without scoring — Task 7's tests will drive the full version.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/
git commit -m "feat: clock-free gravity, lock delay and lock-reset cap"
```

---

### Task 7: Soft drop, hard drop, ghost landing, lock sequence

**Files:**
- Modify: `internal/game/rules.go`
- Test: `internal/game/drop_test.go`

**Interfaces:**
- Consumes: Tasks 5–6.
- Produces:
  ```go
  func (g *Game) SoftDrop() []Event  // steps down one cell, +1 point per cell (§11)
  func (g *Game) HardDrop() []Event  // drops to GhostY, +2 points per cell, then locks immediately
  func (g *Game) GhostY() int        // Y the active piece would rest at; equals Active.Y when already resting
  ```

Lock sequence, in the order §12 pins:

```text
1. Board.Lock(Active)
2. rows := Board.CompleteRows()
3. Board.ClearRows(rows)
4. score the clear (Task 8)
5. emit PieceLocked, then LinesCleared / ComboChanged / LevelChanged
6. spawn the next piece; CanHold = true; grounded = false; lockResets = 0
```

- [ ] **Step 1: Write the failing tests**

```go
func TestGhostYFindsTheRestingRow(t *testing.T) {
	// empty board, KindO at X 4: GhostY puts its lowest cells on row 21
	// with a two-cell tower in column 4, GhostY is two rows higher
}

func TestGhostYOverUnevenStack(t *testing.T) {
	// board picture with a step under a KindI piece: the landing row is set by
	// the highest column the piece covers
}

func TestGhostYEqualsCurrentYWhenResting(t *testing.T) {
	// after HardDrop of a first piece, re-check a piece placed directly on it
}

func TestSoftDropScoresOnePointPerCell(t *testing.T) {
	// SoftDrop returns one PieceMoved and Score increases by 1
	// SoftDrop against the floor returns nil and does not change Score
}

func TestHardDropScoresTwoPointsPerCell(t *testing.T) {
	// fresh game; distance := g.GhostY() - g.Active.Y
	// evs := g.HardDrop()
	// Score == 2*distance
	// evs contains PieceHardDropped with Value == distance, followed by PieceLocked
}

func TestHardDropOnARestingPieceScoresZero(t *testing.T) {
	// Review Focus #3
	// drive the piece down with Advance until Grounded()
	// score := g.Score; evs := g.HardDrop()
	// g.Score == score, the PieceHardDropped Value == 0, and evs contains PieceLocked
}

func TestHardDropCommitsToTheBoardAndSpawnsTheNextPiece(t *testing.T) {
	// next := g.Next[0]
	// HardDrop(): four cells are filled on the board, g.Active.Kind == next,
	// len(g.Next) == NextCount, g.CanHold == true
}

func TestLockEmitsEventsInSpecOrder(t *testing.T) {
	// with a board one row short of a clear, HardDrop's events are
	// PieceHardDropped, PieceLocked, LinesCleared, ComboChanged, (LevelChanged if applicable)
	// in that order
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestGhostY|TestSoftDrop|TestHardDrop|TestLockEmits' -v`
Expected: FAIL

- [ ] **Step 3: Implement `SoftDrop`, `HardDrop`, `GhostY`, and the full `lockPiece` in `internal/game/rules.go`**

Scoring calls land here but their arithmetic comes from Task 8's `scoring.go` — implement `lockPiece` to call `LineScore` / `ComboBonus` / `LevelFor` and let Task 8 define them; add temporary local stubs if needed so this task compiles, and delete them in Task 8.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/
git commit -m "feat: soft drop, hard drop, ghost landing and lock sequence"
```

---

### Task 8: Scoring, combo, level progression

**Files:**
- Create: `internal/game/scoring.go`
- Modify: `internal/game/rules.go` (remove the Task 7 stubs)
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: Tasks 5–7.
- Produces:
  ```go
  func LineScore(lines, level int) int  // {0,100,300,500,800}[lines] * level; lines outside 0..4 returns 0
  func ComboBonus(combo, level int) int // 50 * (combo-1) * level, clamped at 0 (§49.1)
  func LevelFor(lines int) int          // lines/10 + 1
  ```

- [ ] **Step 1: Write the failing tests**

```go
func TestLineScoreValues(t *testing.T) {
	// level 1: 0,100,300,500,800 for 0..4 lines
	// level 7: 700,2100,3500,5600 for 1..4 lines
	// lines 5 and -1 return 0
}

func TestComboBonusStartsAtComboTwo(t *testing.T) {
	// ComboBonus(0, 5) == 0
	// ComboBonus(1, 5) == 0
	// ComboBonus(2, 5) == 250
	// ComboBonus(4, 3) == 450
}

func TestLevelForRisesEveryTenLines(t *testing.T) {
	// 0..9 -> 1, 10..19 -> 2, 100 -> 11
}

func TestSingleClearSetsComboToOneAndPaysNoBonus(t *testing.T) {
	// board one row short of a clear; HardDrop into it
	// g.Combo == 1, g.Lines == 1, g.Score gain == 2*distance + LineScore(1, 1)
	// the ComboChanged event Value == 1
}

func TestConsecutiveClearsPayTheComboBonus(t *testing.T) {
	// two clearing placements in a row: after the second, g.Combo == 2 and the
	// score gain for that placement includes ComboBonus(2, g.Level)
}

func TestPlacementWithoutAClearResetsCombo(t *testing.T) {
	// after a clear, a non-clearing HardDrop sets g.Combo == 0 and emits
	// ComboChanged with Value 0
}

func TestLevelUpEmitsLevelChanged(t *testing.T) {
	// drive Lines from 9 to 10 with a clear; a LevelChanged event with Value 2
	// is emitted and g.Level == 2
}

func TestFourLineClearScoresEightHundredTimesLevel(t *testing.T) {
	// board with four full-but-for-one-column rows; drop a vertical I into the gap
	// g.Lines == 4 and the clear portion of the score is 800 * level
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestLineScore|TestComboBonus|TestLevelFor|TestSingleClear|TestConsecutive|TestPlacementWithout|TestLevelUp|TestFourLine' -v`
Expected: FAIL

- [ ] **Step 3: Implement `scoring.go` and finish `lockPiece`'s scoring path**

Combo update order: increment or reset `Combo` *before* computing `ComboBonus`, so the first clear is combo 1 with no bonus.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/
git commit -m "feat: line scoring, combo bonus and level progression"
```

---

### Task 9: Hold

**Files:**
- Modify: `internal/game/rules.go`
- Test: `internal/game/hold_test.go`

**Interfaces:**
- Consumes: Tasks 5–8.
- Produces:
  ```go
  func (g *Game) UseHold() []Event // emits HoldUsed, or GameOver if the incoming piece cannot spawn
  ```

Rules (§9): `Hold` empty → store `Active.Kind`, spawn from `Next`. `Hold` set → swap, and the incoming piece enters at `Spawn(kind)` (rotation 0). Either way `CanHold` becomes false until the next lock; a call with `CanHold == false` returns `nil`.

- [ ] **Step 1: Write the failing tests**

```go
func TestFirstHoldStoresActiveAndSpawnsFromQueue(t *testing.T) {
	// active := g.Active.Kind; next := g.Next[0]
	// UseHold() returns one HoldUsed event
	// *g.Hold == active, g.Active.Kind == next, g.CanHold == false, len(g.Next) == NextCount
}

func TestSecondHoldBeforeLockIsBlocked(t *testing.T) {
	// UseHold(); a second UseHold() returns nil and leaves Hold and Active unchanged
}

func TestHoldSwapsWithTheStoredPiece(t *testing.T) {
	// UseHold(); HardDrop() to re-enable hold; UseHold() again
	// the previously held kind is now Active.Kind and the pre-swap Active.Kind is held
}

func TestHoldIsRestoredAfterLock(t *testing.T) {
	// UseHold(); HardDrop(); g.CanHold == true
}

func TestHeldPieceReturnsAtSpawnRotationAndPosition(t *testing.T) {
	// rotate the active piece twice and move it right, then UseHold() twice
	// (with a HardDrop between) so it comes back:
	// the returning piece equals Spawn(kind) exactly
}

func TestHoldThatCannotSpawnEndsTheGame(t *testing.T) {
	// Review Focus #4
	// build a board whose hidden rows are occupied where the incoming piece would spawn
	// UseHold() emits GameOver, g.State == StateOver,
	// and Board.String() is unchanged (no overlapping write)
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestFirstHold|TestSecondHold|TestHold|TestHeldPiece' -v`
Expected: FAIL — undefined `UseHold`.

- [ ] **Step 3: Implement `UseHold` in `internal/game/rules.go`**

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/
git commit -m "feat: hold with once-per-piece limit and spawn-rotation reset"
```

---

### Task 10: Game over and `Snapshot`

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/gameover_test.go`

**Interfaces:**
- Consumes: Tasks 5–9.
- Produces:
  ```go
  type Snapshot struct {
      Score, Lines, Level, Combo int
      State                      State
  }

  func (g *Game) Snapshot() Snapshot
  ```

`Snapshot` is the read-only view the FX and flavor packages receive; it is a value type precisely so those packages cannot reach game state (§14). Plan 3 consumes it.

- [ ] **Step 1: Write the failing tests**

```go
func TestBlockedSpawnEndsTheGame(t *testing.T) {
	// fill rows 0..3 of the board except one column, then HardDrop
	// the returned events end with GameOver and g.State == StateOver
}

func TestGameOverIsEmittedExactlyOnce(t *testing.T) {
	// after game over, further Advance/HardDrop/UseHold calls return nil
	// (no second GameOver event)
}

func TestSnapshotMirrorsGameCounters(t *testing.T) {
	// g.Score = 1234; g.Lines = 42; g.Level = 7; g.Combo = 3
	// Snapshot() == Snapshot{1234, 42, 7, 3, StatePlaying}
}

func TestSnapshotIsAValueCopy(t *testing.T) {
	// s := g.Snapshot(); g.Score = 999; s.Score is still the old value
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestBlockedSpawn|TestGameOverIs|TestSnapshot' -v`
Expected: FAIL

- [ ] **Step 3: Implement the blocked-spawn transition and `Snapshot` in `internal/game/game.go`**

The spawn helper returns a `bool`; when it is false, set `State = StateOver` and append `Event{Kind: GameOver}`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/
git commit -m "feat: blocked-spawn game over and read-only Snapshot"
```

---

### Task 11: Determinism replay test and the no-clock guard

**Files:**
- Create: `internal/game/determinism_test.go`
- Create: `internal/game/testdata/replay.golden`
- Test: same files

**Interfaces:**
- Consumes: the whole package.
- Produces: no production code — this task is the §35 / §49.2 guarantee, expressed as tests.

- [ ] **Step 1: Write the failing tests**

```go
// replay drives a fixed 400-step (input, dt) script derived from the step index,
// so the script is reproducible without being written out longhand.
func replay(seed int64) (*Game, string) {
	g := New(seed)
	for i := 0; i < 400; i++ {
		switch i % 7 {
		case 0: g.MoveLeft()
		case 1: g.RotateCW()
		case 2: g.MoveRight()
		case 3: g.SoftDrop()
		case 4: g.RotateCCW()
		case 5: g.UseHold()
		case 6: g.HardDrop()
		}
		g.Advance(time.Duration(17+i%5) * time.Millisecond)
	}
	return g, fmt.Sprintf("score=%d lines=%d level=%d combo=%d state=%d\n%s",
		g.Score, g.Lines, g.Level, g.Combo, g.State, g.Board.String())
}

func TestReplayIsReproducibleWithinAProcess(t *testing.T) {
	// _, a := replay(8675309); _, b := replay(8675309); a == b
}

func TestReplayMatchesGolden(t *testing.T) {
	// compare replay(8675309)'s fingerprint to testdata/replay.golden,
	// regenerating it when -update is passed
}

func TestDifferentSeedsProduceDifferentReplays(t *testing.T) {
	// replay(1) and replay(2) fingerprints differ
}

func TestFXRandomnessCannotAffectPieceOrder(t *testing.T) {
	// draw 200 pieces from a Bag using the game rng for seed 5;
	// repeat, but interleave 1000 draws from a *separate* rand.Rand between bag draws;
	// both sequences are identical
}

func TestEngineNeverReadsTheClock(t *testing.T) {
	// §49.2: walk every non-test .go file in this directory and fail if it
	// contains "time.Now(" or "time.Since(" or imports charm.land/
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestReplay|TestDifferentSeedsProduceDifferent|TestFXRandomness|TestEngineNever' -v`
Expected: FAIL — `testdata/replay.golden` missing; the clock guard fails if any `time.Now()` slipped in.

- [ ] **Step 3: Record the golden and fix any clock reads**

Run: `go test ./internal/game/ -run TestReplayMatchesGolden -update`
Then inspect `testdata/replay.golden` and confirm the board picture is plausible (some filled rows, not all empty and not all full).

- [ ] **Step 4: Run the full suite with race detection and coverage**

Run: `go test ./internal/game/... -race -cover`
Expected: PASS, coverage above 85% for the package.

- [ ] **Step 5: Commit**

```bash
git add internal/game/
git commit -m "test: replay determinism golden and no-clock guard for the engine"
```

---

## Done when

`go test ./internal/game/... -race` passes, coverage is above 85%, `testdata/replay.golden` is committed, and §42's gate is met: "Tests must pass before proceeding." The engine has no `charm.land` imports and no clock reads. Proceed to `plans/2026-09-18-cosmic-tetris-terminal.md`.
