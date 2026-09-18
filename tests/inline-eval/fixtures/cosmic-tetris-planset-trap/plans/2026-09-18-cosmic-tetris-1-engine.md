# Cosmic Tetris — Plan 1: Headless Game Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `internal/game` — a deterministic, clock-free falling-block engine with pieces, board, 7-bag, movement, wall kicks, gravity, lock delay, line clears, hold, scoring and game over, fully unit tested.

**Architecture:** One package, no dependencies outside the standard library. The engine is a pure state machine: every mutator returns a `[]Event` describing what happened, and time enters only through `Tick(dt)`. Nothing in the package reads a clock or renders anything. FX and UI packages built in later plans observe events; they never call into engine internals.

**Tech Stack:** Go 1.26, standard library only (`math`, `math/rand`, `time` for `time.Duration`).

**Spec:** `design.md` (this plan implements §5–§13, §34, §35, §40, §42 Phase 1, §49.1, §49.2, §49.4 geometry, §49.6)

## Global Constraints

- Language: Go. Module path: `cosmic-tetris`. Go directive: `go 1.26`.
- UI libraries (later plans): `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`. Verified available at v2.0.9 / v2.0.6 / v2.2.1.
- Repository layout is fixed by §33. Do not add packages beyond `cmd/cosmic-tetris`, `internal/game`, `internal/app`, `internal/render`, `internal/fx`, `internal/flavor`. Extra *files* inside those packages are allowed where a plan names them.
- No networking, no profiles, no achievements, no plugin system, no database (§2).
- `internal/game` never calls `time.Now()` (§49.2). Bubble Tea owns the clock.
- Game RNG and FX RNG are separate `*rand.Rand` instances and never share (§49.6).
- Logical board: width 10, height 22, visible rows 20, hidden spawn rows 2 (§5).
- Combo bonus is exactly `50 × (combo - 1) × level` (§49.1).
- Drop interval is `800ms × 0.86^(level-1)`, clamped at a 60ms floor (§11).
- Lock delay 500ms; max 15 lock resets (§12).
- Effects may never modify game state (§14, §44).

## Review Focus

Input classes the spec implies but does not describe, most likely to bite first. Each has a test in the task named.

1. `Tick(dt)` with a `dt` far larger than one drop interval — a suspended process or a debugger pause must not spin through thousands of gravity steps or skip locking (Task 6).
2. A hold swap whose incoming piece cannot spawn — must reach game over with the board intact, never a half-committed piece (Task 8).
3. `New(seed)` with seed `0` and negative seeds — the bag must still yield all seven kinds; `0` is a real seed, not "pick one for me" (Task 3).
4. Rotation in the hidden spawn rows where the `(0,-1)` kick would push cells above row 0 — rotation must fail rather than write out of bounds (Task 5).
5. A line clear whose row set includes a hidden spawn row — collapse must preserve board height and never index out of range (Task 7).

## Plan Set

Run in this order. A ruling that changes a name, signature, or value a later plan consumes is applied to that plan's file before the next task starts.

1. `plans/2026-09-18-cosmic-tetris-1-engine.md` — headless deterministic engine in `internal/game`. Consumes: nothing.
2. `plans/2026-09-18-cosmic-tetris-2-playable-terminal.md` — Bubble Tea app, canvas renderer, layout, HUD, hold/next/ghost, CLI flags, pause/help/game-over card, golden tests. Consumes Plan 1's `game.Game`, `Tick`, `Event`, `Board`, `Piece`, `GhostY`.
3. `plans/2026-09-18-cosmic-tetris-3-cosmic-foundation.md` — `internal/fx` (particles, starfield), animated border, piece trails, `internal/flavor` mission control. Consumes Plan 1's `Event`/`Cell` and Plan 2's `render.Canvas`, `render.Layout`, `render.Snapshot`, `app.Model`.
4. `plans/2026-09-18-cosmic-tetris-4-violence.md` — hard-drop impact, screen shake, line supernova, shockwaves, hyperdrive, four-line sequence, combo/level overlays. Consumes Plan 3's `fx.World` and the render FX layer.
5. `plans/2026-09-18-cosmic-tetris-5-polish.md` — boot sequence, game-over black hole, ASCII/no-FX guarantees, §45 details, README, definition-of-done sweep. Consumes everything above.

---

## File Structure

| File | Responsibility |
|---|---|
| `go.mod` | module `cosmic-tetris`, `go 1.26` |
| `internal/game/piece.go` | `PieceKind`, rotation tables, `Piece`, spawn geometry |
| `internal/game/board.go` | `Cell`, `Board`, collision, row completion, clear + collapse |
| `internal/game/bag.go` | 7-bag generator over the game RNG |
| `internal/game/scoring.go` | line values, combo bonus, level, drop interval |
| `internal/game/rules.go` | tuning constants and kick offsets |
| `internal/game/events.go` | `EventKind`, `Event` |
| `internal/game/game.go` | `Game` state, mutators, `Tick`, hold, lock, game over |

---

### Task 1: Module and piece geometry

**Files:**
- Create: `go.mod`, `internal/game/piece.go`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
```go
type PieceKind int
const (KindI PieceKind = iota; KindJ; KindL; KindO; KindS; KindT; KindZ)
const KindCount = 7
func (k PieceKind) String() string          // "I", "J", "L", "O", "S", "T", "Z"
func (k PieceKind) Letter() byte            // 'I' … 'Z'

type Point struct{ X, Y int }

type Piece struct {
    Kind     PieceKind
    Rotation int          // 0..3
    X, Y     int          // board coords of the piece box's top-left corner
}
func (p Piece) Cells() [4]Point              // absolute board coords, +Y is down
func (p Piece) BoxSize() int                 // 4 for I, 2 for O, 3 otherwise
func SpawnPiece(k PieceKind) Piece           // Rotation 0, Y=0, X=spawnX(k)
```

Rotation data: rotation 0 of each kind is a literal glyph grid; rotations 1–3 are produced by rotating that grid clockwise inside its own box and are baked into a package-level table at init. Grids (fixed — do not adjust):

```go
var spawnGrids = map[PieceKind][]string{
    KindI: {"....", "XXXX", "....", "...."},
    KindJ: {"X..", "XXX", "..."},
    KindL: {"..X", "XXX", "..."},
    KindO: {"XX", "XX"},
    KindS: {".XX", "XX.", "..."},
    KindT: {".X.", "XXX", "..."},
    KindZ: {"XX.", ".XX", "..."},
}
```

Spawn X is `(Width - BoxSize) / 2` — 3 for I, 4 for O, 3 for the rest.

- [ ] **Step 1: Write the failing tests**

```go
func TestKindStrings(t *testing.T)
// KindI.String() == "I" … KindZ.String() == "Z"; Letter() matches String()[0].

func TestEveryRotationHasFourCells(t *testing.T)
// for each of the 7 kinds, for r in 0..3: len(unique cells of Piece{Kind:k, Rotation:r}.Cells()) == 4

func TestFourRotationsReturnToStart(t *testing.T)
// cell set of rotation 0 == cell set of rotation 4%4 reached by rotating the table four times;
// i.e. rotationCells(k,0) equals rotationCells(k,0) after four clockwise applications.

func TestIPieceRotationZeroAndOne(t *testing.T)
// Piece{KindI, 0, 0, 0}.Cells() == {{0,1},{1,1},{2,1},{3,1}}
// Piece{KindI, 1, 0, 0}.Cells() == {{2,0},{2,1},{2,2},{2,3}}

func TestOPieceIdenticalThroughRotation(t *testing.T)
// all four rotations of KindO give the same cell set {{0,0},{1,0},{0,1},{1,1}}

func TestSpawnPositions(t *testing.T)
// SpawnPiece(KindI) == Piece{KindI, 0, 3, 0}; SpawnPiece(KindO) == Piece{KindO, 0, 4, 0};
// SpawnPiece(KindT) == Piece{KindT, 0, 3, 0}

func TestSpawnCellsStayInHiddenRows(t *testing.T)
// for every kind: every cell of SpawnPiece(k).Cells() has Y < 2 and 0 <= X < 10
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestKind|TestEvery|TestFour|TestIPiece|TestOPiece|TestSpawn' -v`
Expected: FAIL — build error, undefined identifiers.

- [ ] **Step 3: Create `go.mod`**

`module cosmic-tetris` with `go 1.26`.

- [ ] **Step 4: Implement `internal/game/piece.go`**

Parse `spawnGrids` into `[KindCount][4][4]Point` at init via a `rotateCW([]string) []string` helper. `Cells()` adds `p.X, p.Y` to the table entry. Cell order within a rotation is row-major over the grid, so the test literals above hold.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add go.mod internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): piece kinds, rotation tables and spawn geometry"
```

---

### Task 2: Board — cells, collision, row clear and collapse

**Files:**
- Create: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Piece`, `PieceKind`, `Point` (Task 1).
- Produces:
```go
const (Width = 10; Height = 22; VisibleRows = 20; HiddenRows = 2)

type Cell uint8
const CellEmpty Cell = 0
func CellFor(k PieceKind) Cell   // k+1
func (c Cell) Empty() bool
func (c Cell) Kind() PieceKind   // panics if Empty

type Board struct{ Cells [Height][Width]Cell }
func (b *Board) At(x, y int) Cell
func (b *Board) Set(x, y int, c Cell)
func (b *Board) InBounds(x, y int) bool          // 0<=x<Width && 0<=y<Height
func (b *Board) Occupied(x, y int) bool          // out of bounds counts as occupied
func (b *Board) Collides(p Piece) bool
func (b *Board) Commit(p Piece)
func (b *Board) CompleteRows() []int             // ascending row indices
func (b *Board) ClearRows(rows []int)            // remove and collapse; top rows become empty
func (b *Board) String() string                  // Height lines, '.' empty, piece letter filled
```

- [ ] **Step 1: Write the failing tests**

```go
func TestOccupiedTreatsOutOfBoundsAsSolid(t *testing.T)
// empty board: Occupied(-1,5), Occupied(10,5), Occupied(5,22), Occupied(5,-1) all true; Occupied(5,5) false

func TestCollidesWithWallsAndFloor(t *testing.T)
// Piece{KindO,0,-1,0} collides; Piece{KindO,0,9,0} collides (needs x 9,10);
// Piece{KindO,0,0,21} collides (needs y 21,22); Piece{KindO,0,0,20} does not

func TestCollidesWithLockedCell(t *testing.T)
// Set(4,10,CellFor(KindT)); Piece{KindO,0,4,9} collides; Piece{KindO,0,0,9} does not

func TestCommitWritesKindCells(t *testing.T)
// Commit(Piece{KindO,0,4,20}) => At(4,20)==At(5,20)==At(4,21)==At(5,21)==CellFor(KindO)

func TestCompleteRowsFindsAllFullRows(t *testing.T)
// fill rows 19 and 21 completely, row 20 with 9 cells => CompleteRows() == []int{19,21}

func TestClearRowsCollapsesAbove(t *testing.T)
// fill row 21 completely; put a single cell at (0,20); ClearRows([]int{21})
// => At(0,21) == CellFor(...) (the lone cell fell), row 20 empty, row 0 empty

func TestClearRowsHandlesHiddenRows(t *testing.T)
// fill rows 0 and 21; ClearRows([]int{0,21}); board still Height rows,
// no panic, board is empty afterwards

func TestBoardStringShape(t *testing.T)
// empty board String() has Height lines each of Width '.'; a KindT cell renders 'T'
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run TestOccupied -v`
Expected: FAIL — undefined `Board`.

- [ ] **Step 3: Implement `internal/game/board.go`**

`ClearRows` copies surviving rows downward from the bottom and zeroes the remainder; it must tolerate an unsorted or duplicate `rows` slice.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board with collision, row completion and collapse"
```

---

### Task 3: 7-bag piece generator

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `KindCount` (Task 1).
- Produces:
```go
type Bag struct{ /* unexported: rng *rand.Rand; queue []PieceKind */ }
func NewBag(rng *rand.Rand) *Bag
func (b *Bag) Next() PieceKind
```

Refill puts one of every kind in the bag and shuffles with `rng.Shuffle`. The bag's `rng` is the game RNG passed in by `Game` (§49.6); the bag never creates its own.

- [ ] **Step 1: Write the failing tests**

```go
func TestEachBagContainsAllSevenExactlyOnce(t *testing.T)
// draw 14 kinds; first 7 and second 7 each contain every kind exactly once

func TestSeededBagIsReproducible(t *testing.T)
// two bags from rand.New(rand.NewSource(8675309)) produce identical 30-kind sequences

func TestBagWorksWithZeroAndNegativeSeeds(t *testing.T)
// for seed in {0, -1, math.MinInt64}: first 7 draws contain every kind exactly once
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run TestEachBag -v`
Expected: FAIL — undefined `NewBag`.

- [ ] **Step 3: Implement `internal/game/bag.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag generator"
```

---

### Task 4: Scoring, level and timing rules

**Files:**
- Create: `internal/game/scoring.go`, `internal/game/rules.go`
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: `Point` (Task 1).
- Produces:
```go
// rules.go
const (
    LockDelay      = 500 * time.Millisecond
    MaxLockResets  = 15
    BaseInterval   = 800 * time.Millisecond
    MinInterval    = 60 * time.Millisecond
    IntervalFactor = 0.86
    LinesPerLevel  = 10
)
var KickOffsets = [8]Point{{0,0},{-1,0},{1,0},{-2,0},{2,0},{0,-1},{-1,-1},{1,-1}}

// scoring.go
func LineScore(lines, level int) int          // 0/100/300/500/800 × level
func ComboBonus(combo, level int) int         // 50 × (combo-1) × level, 0 when combo < 2
func LevelFor(lines int) int                  // lines/LinesPerLevel + 1
func DropInterval(level int) time.Duration    // rounded to whole ms, floor MinInterval
const (SoftDropPoints = 1; HardDropPoints = 2) // per cell
```

`KickOffsets` are `(dx, dy)` in board coordinates where `+y` is down, so `{0,-1}` lifts the piece one row (§7).

- [ ] **Step 1: Write the failing tests**

```go
func TestLineScoreTable(t *testing.T)
// level 1: 0→0, 1→100, 2→300, 3→500, 4→800
// level 7: 1→700, 2→2100, 3→3500, 4→5600

func TestComboBonus(t *testing.T)
// ComboBonus(0,5)==0; ComboBonus(1,5)==0; ComboBonus(2,5)==250; ComboBonus(3,2)==200

func TestLevelFor(t *testing.T)
// 0→1, 9→1, 10→2, 19→2, 20→3, 127→13

func TestDropIntervalCurveAndFloor(t *testing.T)
// DropInterval(1) == 800*time.Millisecond
// DropInterval(2) == 688*time.Millisecond
// DropInterval(3) == 592*time.Millisecond
// strictly decreasing for level 1..19
// DropInterval(19) == MinInterval and DropInterval(30) == MinInterval
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestLineScore|TestCombo|TestLevelFor|TestDropInterval' -v`
Expected: FAIL — undefined `LineScore`.

- [ ] **Step 3: Implement `scoring.go` and `rules.go`**

`DropInterval` computes `BaseInterval × IntervalFactor^(level-1)` in float milliseconds, rounds to the nearest millisecond, then applies the floor. (`800 × 0.86 = 688`, `× 0.86 = 591.68 → 592`.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/scoring.go internal/game/rules.go internal/game/scoring_test.go
git commit -m "feat(game): scoring, level progression and gravity curve"
```

---

### Task 5: Game state, events, movement and rotation

**Files:**
- Create: `internal/game/events.go`, `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces:
```go
// events.go
type EventKind int
const (
    PieceMoved EventKind = iota
    PieceRotated
    PieceSoftDropped
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
    Kind       EventKind
    Piece      Piece      // the piece involved; for PieceLocked its resting place
    Rows       []int      // LinesCleared: cleared row indices, ascending
    Cells      [][]Cell   // LinesCleared: contents of those rows before clearing, same order
    Count      int        // LinesCleared: line count. ComboChanged: new combo. LevelChanged: new level
    Distance   int        // PieceSoftDropped / PieceHardDropped: cells descended
    ScoreDelta int
}

// game.go
type Game struct {
    Board   Board
    Active  Piece
    Hold    *PieceKind
    CanHold bool
    Next    []PieceKind   // always len NextCount
    Bag     *Bag

    Score, Lines, Level, Combo int

    GravityAccumulator time.Duration
    LockAccumulator    time.Duration
    LockResets         int
    Over               bool

    Seed int64
    rng  *rand.Rand
}
const NextCount = 5

func New(seed int64) *Game
func (g *Game) MoveLeft() []Event
func (g *Game) MoveRight() []Event
func (g *Game) RotateCW() []Event
func (g *Game) RotateCCW() []Event
```

`New` seeds one `*rand.Rand`, builds the bag, fills `Next` to `NextCount`, and spawns the first piece. Movement and rotation return a single-element `[]Event` on success and `nil` on failure, and never mutate state on failure. A successful move or rotation while grounded resets `LockAccumulator` and increments `LockResets`, but only while `LockResets < MaxLockResets` (§12).

- [ ] **Step 1: Write the failing tests**

```go
func TestNewGameInitialState(t *testing.T)
// Score/Lines/Combo == 0; Level == 1; len(Next) == NextCount; Hold == nil; CanHold == true;
// Over == false; Seed == the seed passed in; Active is a spawn piece (Rotation 0, Y 0)

func TestMoveLeftAndRight(t *testing.T)
// x := g.Active.X; evs := g.MoveLeft(); len(evs)==1; evs[0].Kind==PieceMoved; g.Active.X == x-1
// MoveRight twice => X == x+1

func TestBlockedMoveEmitsNothing(t *testing.T)
// push the active piece to the left wall in a loop; the move that fails returns nil
// and leaves Active unchanged

func TestRotationEmitsPieceRotated(t *testing.T)
// g.Active = Piece{KindT,0,4,10}; evs := g.RotateCW(); evs[0].Kind == PieceRotated;
// g.Active.Rotation == 1; RotateCCW from rotation 0 gives Rotation 3

func TestRotationWallKicks(t *testing.T)
// g.Active = Piece{KindI,1,-1,5} placed flush against the left wall such that rotation 2
// would overlap x<0; RotateCW succeeds and the resulting piece has all cells in bounds

func TestRotationFailsInTightPocket(t *testing.T)
// fill the board except a 1-wide vertical slot; put a vertical I in the slot;
// RotateCW returns nil, Rotation and X/Y unchanged

func TestRotationNeverEscapesTheCeiling(t *testing.T)
// spawn state: g.Active = Piece{KindI,1,3,0}; RotateCW must either succeed with every cell
// at Y >= 0 or return nil — assert no cell has Y < 0 and the board is untouched
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestNewGame|TestMove|TestBlocked|TestRotation' -v`
Expected: FAIL — undefined `New`.

- [ ] **Step 3: Implement `events.go` and the movement half of `game.go`**

Rotation tries `KickOffsets` in order and accepts the first non-colliding position (§7). Add unexported helpers `tryMove(dx, dy int) bool`, `grounded() bool`, `spawn() []Event`, `noteGroundedReset()`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/events.go internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game state, event stream, movement and kicked rotation"
```

---

### Task 6: Advance — gravity, soft drop, ghost and lock delay

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/advance_test.go`

**Interfaces:**
- Consumes: Task 5's `Game`, `Event`; Task 4's `DropInterval`, `LockDelay`, `MaxLockResets`.
- Produces:
```go
func (g *Game) Tick(dt time.Duration) []Event
func (g *Game) SoftDrop() []Event      // one cell; PieceSoftDropped with ScoreDelta = SoftDropPoints
func (g *Game) GhostY() int            // Y the active piece would rest at
func (g *Game) Interval() time.Duration // DropInterval(g.Level), exposed for the HUD
const maxCatchUpSteps = 20
```

`Tick` is the only way time enters the engine. Algorithm (fixed — the tests do not fully determine it):

```go
func (g *Game) Tick(dt time.Duration) []Event {
    if g.Over { return nil }
    var evs []Event
    interval := g.Interval()
    g.GravityAccumulator += dt
    for steps := 0; g.GravityAccumulator >= interval; steps++ {
        if steps >= maxCatchUpSteps { g.GravityAccumulator = 0; break }
        g.GravityAccumulator -= interval
        if !g.tryMove(0, 1) { g.GravityAccumulator = 0; break }
        evs = append(evs, Event{Kind: PieceMoved, Piece: g.Active})
        g.LockAccumulator, g.LockResets = 0, 0   // a new row is a fresh lock budget
    }
    if g.grounded() {
        g.LockAccumulator += dt
        if g.LockAccumulator >= LockDelay { evs = append(evs, g.lock()...) }
    } else {
        g.LockAccumulator = 0
    }
    return evs
}
```

- [ ] **Step 1: Write the failing tests**

```go
func TestAdvanceBelowIntervalDoesNothing(t *testing.T)
// g := New(1); y := g.Active.Y; g.Tick(100*time.Millisecond); Active.Y == y, no events

func TestAdvanceAtIntervalDropsOneRow(t *testing.T)
// g.Tick(800*time.Millisecond) => one PieceMoved, Active.Y == y+1

func TestAdvanceHugeDtIsBoundedAndLeavesPieceGrounded(t *testing.T)
// g.Tick(10*time.Second) returns in well under a second, emits at most maxCatchUpSteps+3 events,
// GravityAccumulator < g.Interval(), and the piece is either locked or resting on the floor

func TestGhostY(t *testing.T)
// empty board: GhostY() == the lowest Y where the piece does not collide
// with a locked cell at (Active.X, 15) under the piece, GhostY() is above it

func TestSoftDropScoresOnePoint(t *testing.T)
// evs := g.SoftDrop(); evs[0].Kind == PieceSoftDropped; evs[0].ScoreDelta == 1;
// g.Score == 1; Active.Y increased by 1
// soft drop into the floor returns nil and does not score

func TestGroundedPieceLocksAfterLockDelay(t *testing.T)
// drop the piece to the floor, then Tick(499ms) => no PieceLocked;
// one more Tick(1ms) => a PieceLocked event

func TestMovementWhileGroundedResetsLockTimer(t *testing.T)
// grounded, Tick(400ms), MoveLeft(), Tick(400ms) => no PieceLocked yet

func TestLockResetsAreCapped(t *testing.T)
// grounded; loop 20 times { Tick(400ms); MoveLeft() or MoveRight() alternating }
// => a PieceLocked event occurs within the loop; g.LockResets <= MaxLockResets
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run TestAdvance -v`
Expected: FAIL — undefined `Tick`.

- [ ] **Step 3: Implement `Tick`, `SoftDrop`, `GhostY`, `Interval` and a stub `lock()`**

`lock()` for now commits the piece and emits `PieceLocked` plus a spawn; Task 7 adds clearing and scoring.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/advance_test.go
git commit -m "feat(game): elapsed-time gravity, soft drop, ghost and lock delay"
```

---

### Task 7: Hard drop, locking, line clears, combo and level

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/clear_test.go`

**Interfaces:**
- Consumes: Task 6's `Tick`/`lock`; Task 4's scoring functions; Task 2's `CompleteRows`/`ClearRows`.
- Produces:
```go
func (g *Game) HardDrop() []Event
```

Lock sequence, in this order (§12): commit piece → `PieceLocked` → detect complete rows → emit `LinesCleared` (carrying `Rows` and the pre-clear `Cells`, and `ScoreDelta = LineScore + ComboBonus`) → clear rows → update `Score`/`Lines`/`Combo` → emit `ComboChanged` when the combo value changed → emit `LevelChanged` when `LevelFor(Lines)` changed → spawn next → `CanHold = true`.

`HardDrop` emits `PieceHardDropped{Distance, ScoreDelta: 2×Distance}` then locks immediately (no lock delay).

- [ ] **Step 1: Write the failing tests**

```go
func TestHardDropScoresTwoPerCell(t *testing.T)
// g := New(1); evs := g.HardDrop(); first event is PieceHardDropped with
// Distance == cells travelled and ScoreDelta == 2*Distance; the event list also contains PieceLocked

func TestHardDropOfAGroundedPieceStillLocks(t *testing.T)
// piece already resting on the floor: HardDrop emits PieceHardDropped{Distance:0} and PieceLocked

func TestSingleLineClearScoresAndCollapses(t *testing.T)
// construct a board with row 21 filled except x=0..? and drop a piece to complete it;
// LinesCleared event has Count 1, Rows []int{21}, len(Cells)==1 and Cells[0] holds the
// pre-clear row; ScoreDelta == 100*level; g.Lines == 1; row 21 is empty afterwards

func TestFourLineClearScores800TimesLevel(t *testing.T)
// stack rows 18..21 nine wide, hard drop a vertical I into the tenth column
// => LinesCleared{Count:4}, ScoreDelta == 800*g.Level (+0 combo bonus at combo 1)

func TestComboAccumulatesAndResets(t *testing.T)
// first clearing placement: Combo == 1, ComboChanged{Count:1}, no combo bonus
// second consecutive clearing placement: Combo == 2, ScoreDelta includes 50*1*level
// a placement that clears nothing: Combo == 0 and one ComboChanged{Count:0}
// a second non-clearing placement emits no ComboChanged (value did not change)

func TestLevelIncreasesEveryTenLines(t *testing.T)
// drive Lines to 10 => LevelChanged{Count:2} emitted once and g.Level == 2;
// g.Interval() == DropInterval(2)

func TestClearIncludingHiddenRowKeepsBoardIntact(t *testing.T)
// fill row 1 (hidden) and row 21 completely via Board.Set, then lock any piece to trigger
// the clear path => no panic, board still Height rows, both rows empty
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestHardDrop|TestSingleLine|TestFourLine|TestCombo|TestLevel|TestClearIncluding' -v`
Expected: FAIL — undefined `HardDrop`.

- [ ] **Step 3: Implement `HardDrop` and the full `lock()` sequence**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/clear_test.go
git commit -m "feat(game): hard drop, lock sequence, line clears, combo and level"
```

---

### Task 8: Hold, game over and replay determinism

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/hold_test.go`, `internal/game/determinism_test.go`

**Interfaces:**
- Consumes: Tasks 5–7.
- Produces:
```go
func (g *Game) HoldPiece() []Event   // HoldUsed, or nil when hold is unavailable
```

Hold rules (§9): `HoldPiece` swaps the active piece with the held kind, or stores the active kind and spawns the next when hold is empty. The incoming piece arrives at spawn rotation and spawn position. Hold is available once per piece: `CanHold` goes false on use and true on lock. If the incoming piece collides at spawn, the game is over (`Over = true`, `GameOver` event) and the board is left untouched.

Spawn blocking (§12, §28): when `spawn()` produces a piece that collides, set `Over` and emit `GameOver`.

- [ ] **Step 1: Write the failing tests**

```go
func TestFirstHoldStoresAndSpawnsNext(t *testing.T)
// kind := g.Active.Kind; next := g.Next[0]; evs := g.HoldPiece()
// evs[0].Kind == HoldUsed; *g.Hold == kind; g.Active.Kind == next;
// g.Active == SpawnPiece(next); g.CanHold == false

func TestSecondHoldIsBlocked(t *testing.T)
// after one HoldPiece, a second returns nil and changes nothing

func TestHoldSwapsAndKeepsSpawnRotation(t *testing.T)
// hold once, lock the piece, rotate the new active piece twice, hold again
// => the piece coming out of hold has Rotation 0 and SpawnPiece coordinates

func TestHoldAvailableAgainAfterLock(t *testing.T)
// HoldPiece, HardDrop, then CanHold == true

func TestBlockedSpawnEndsTheGame(t *testing.T)
// fill rows 0..3 completely via Board.Set, HardDrop the active piece
// => a GameOver event, g.Over == true, and Tick(1*time.Second) afterwards returns nil

func TestHoldIntoBlockedSpawnEndsTheGameCleanly(t *testing.T)
// fill the hidden rows so any spawn collides, then HoldPiece
// => GameOver event, g.Over == true, board string unchanged from before the call
```

```go
func TestReplayIsReproducible(t *testing.T)
// script: a fixed []struct{ key string; dt time.Duration } of ~200 entries covering
// left/right/rotate/soft/hard/hold and varied dt (7ms, 16ms, 250ms, 900ms).
// Run it twice against New(8675309) and assert equal Score, Lines, Level, Combo,
// Over, Next, *Hold and Board.String().

func TestDifferentSeedsDiverge(t *testing.T)
// the same script against New(1) and New(2) produces different Board.String()

func TestEngineNeverReadsTheClock(t *testing.T)
// walk internal/game/*.go (excluding _test.go) and fail if any file contains "time.Now("
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestHold|TestBlocked|TestReplay|TestDifferentSeeds|TestEngineNever' -v`
Expected: FAIL — undefined `HoldPiece`.

- [ ] **Step 3: Implement `HoldPiece` and the game-over path in `spawn()`**

- [ ] **Step 4: Run the whole suite**

Run: `go test ./... -v && go vet ./...`
Expected: PASS, no vet findings.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/hold_test.go internal/game/determinism_test.go
git commit -m "feat(game): hold, game over and deterministic replay"
```

---

### Task 9: Engine acceptance sweep

**Files:**
- Test: `internal/game/acceptance_test.go`

**Interfaces:**
- Consumes: the whole package.
- Produces: nothing new — this task is the Phase 1 gate from §42 ("tests must pass before proceeding").

- [ ] **Step 1: Write the test**

```go
func TestLongRandomSessionStaysConsistent(t *testing.T)
// For seeds 1..20: drive 5000 pseudo-random inputs (from a separate local rand, so the
// game RNG is untouched) with 16ms Advance steps between them. After every step assert:
//   - every cell of g.Active.Cells() is in bounds
//   - g.Board has no complete row left uncleared
//   - len(g.Next) == NextCount
//   - g.Score, g.Lines, g.Level, g.Combo are all >= 0 and Level == LevelFor(g.Lines)
//   - once g.Over is true, no further events are produced
// The loop must finish (games end) for every seed.
```

- [ ] **Step 2: Run it**

Run: `go test ./internal/game/ -run TestLongRandomSession -v`
Expected: PASS (fix any invariant violation it surfaces in the owning file)

- [ ] **Step 3: Commit**

```bash
git add internal/game/acceptance_test.go
git commit -m "test(game): long random session invariants"
```
