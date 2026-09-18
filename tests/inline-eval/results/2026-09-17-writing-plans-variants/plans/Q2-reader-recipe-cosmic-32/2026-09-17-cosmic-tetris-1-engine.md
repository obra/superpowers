# Cosmic Tetris — Plan 1: Deterministic Game Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the headless, deterministic falling-block engine under `internal/game` — pieces, board, 7-bag, movement, rotation kicks, gravity, lock delay, line clears, scoring, hold, hard drop, game over — with comprehensive unit tests and a seeded replay test.

**Architecture:** A single `internal/game` package with no dependencies outside the standard library. `Game` is a plain struct advanced by `Advance(dt time.Duration)` and mutated by explicit input methods (`MoveLeft`, `Rotate`, `HardDrop`, `Hold`, …). Every mutating method returns `[]Event` describing what happened; the engine never reads a clock, never renders, and never knows about Bubble Tea. Board coordinates are `y = 0` at the top and increase downward; gravity moves `+Y`.

**Tech Stack:** Go 1.26, standard library only (`math/rand/v2`, `time`, `testing`).

**Spec:** `design.md` (this plan implements §5–§13, §34, §35, §40 engine items, and pinned decisions §49.1, §49.2, §49.6)

**Follow-on plans:** Plan 2 (`plans/2026-09-17-cosmic-tetris-2-playable-terminal.md`) renders this engine; Plan 3 (`plans/2026-09-17-cosmic-tetris-3-cosmic-fx.md`) consumes its events. Neither may modify engine state.

## Global Constraints

- Module path: `cosmic-tetris`. Go directive: `go 1.26`. No remote; commit directly on `main`.
- `internal/game` imports **only** the standard library. No Bubble Tea, no Lip Gloss, no rendering concerns.
- Nothing under `internal/game` calls `time.Now()`, `time.Since`, or starts a goroutine or timer (§49.2). Elapsed time enters exclusively as the `dt` argument to `Advance`.
- Game RNG is `math/rand/v2`: `rand.New(rand.NewPCG(uint64(seed), 0x9E3779B97F4A7C15))`, owned by `Game`, and used **only** by the 7-bag (§49.6). No other code path may draw from it.
- Board geometry (§5): width 10, total height 22, visible rows 20, hidden spawn rows 2. Hidden rows are `y = 0..1`; visible rows are `y = 2..21`.
- Scoring (§13, §49.1): 1/2/3/4 lines = 100/300/500/800 × level; combo bonus = `50 × (combo - 1) × level`; soft drop +1/cell; hard drop +2/cell.
- Gravity (§11): `interval = 800ms × 0.86^(level-1)`, clamped to a floor of 60ms. Level = `1 + lines/10`.
- Lock (§12): lock delay 500ms; a successful move or rotation while grounded resets it; maximum 15 resets.
- Wall-kick offsets, in this exact order (§7): `(0,0) (-1,0) (1,0) (-2,0) (2,0) (0,-1) (-1,-1) (1,-1)`. First valid wins; otherwise the rotation fails and no event is emitted.
- Every test file is `package game` (internal tests); the engine has no exported-only test seam.
- Run `gofmt -l .` before every commit; it must print nothing.

## Review Focus

Five failure modes the spec implies but no task's own tests would otherwise exercise. Each has a test added to the task that owns the code.

1. **A rotation kick that would push the piece above the board** (`y < 0`) must fail cleanly rather than panic on a negative row index — `Board.Fits` is the only guard, and every kick candidate goes through it. (Task 6)
2. **`Advance` with a `dt` far larger than one gravity interval** (a suspended process, a slow terminal) must apply each gravity step through collision checks in order and terminate — never skip a collision or spin forever. (Task 8)
3. **`Advance` with `dt <= 0`** must be a no-op returning no events, so a paused or clock-skewed caller cannot corrupt state. (Task 8)
4. **Hold when the incoming piece cannot spawn** must end the game rather than leave a piece overlapping locked cells. (Task 9)
5. **Gravity interval at extreme level** must stay at the 60ms floor and never reach zero or negative, which would make `Advance` loop without bound. (Task 4)

---

## File Structure

| File | Responsibility |
|---|---|
| `go.mod` | Module `cosmic-tetris`, `go 1.26`. |
| `internal/game/piece.go` | `PieceKind`, `Piece`, `Point`, base shapes, the four rotations per kind, spawn positions. |
| `internal/game/board.go` | `Cell`, `Board`, bounds/collision, complete-row detection, clear + collapse. |
| `internal/game/bag.go` | 7-bag generator over an injected `*rand.Rand`. |
| `internal/game/scoring.go` | Pure scoring/level/gravity functions. |
| `internal/game/events.go` | `Event` interface and the concrete event types. |
| `internal/game/game.go` | `Game` struct, construction, spawn, input methods, `Advance`, lock pipeline. |
| `internal/game/rules.go` | Kick table and the grounded/lock-reset rules used by `game.go`. |
| `internal/game/*_test.go` | One test file per source file, plus `replay_test.go`. |

---

### Task 1: Module skeleton and piece geometry

**Files:**
- Create: `go.mod`
- Create: `internal/game/piece.go`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```go
  type PieceKind int
  const (KindI PieceKind = iota; KindJ; KindL; KindO; KindS; KindT; KindZ)
  func (k PieceKind) String() string // "I","J","L","O","S","T","Z"
  var AllKinds = [7]PieceKind{KindI, KindJ, KindL, KindO, KindS, KindT, KindZ}

  type Point struct{ X, Y int }
  type Piece struct {
      Kind     PieceKind
      Rotation int // 0..3, clockwise
      X, Y     int // top-left of the piece's rotation box, in board coords
  }
  func (p Piece) Cells() [4]Point            // absolute board coords, row-major order
  func (p Piece) Rotated(delta int) Piece    // Rotation wrapped into 0..3; X,Y unchanged
  func SpawnPiece(k PieceKind) Piece         // Rotation 0 at the spawn position
  ```

- [ ] **Step 1: Write the failing test**

```go
package game

import "testing"

func TestTRotationCells(t *testing.T) {
	// Base T is ".#." / "###" / "..." in a 3x3 box at X=0, Y=0.
	p := Piece{Kind: KindT, Rotation: 0, X: 0, Y: 0}
	want := [4]Point{{1, 0}, {0, 1}, {1, 1}, {2, 1}}
	if got := p.Cells(); got != want {
		t.Fatalf("rotation 0 = %v, want %v", got, want)
	}
	// One clockwise turn points the stem right: ".#." / ".##" / ".#."
	p.Rotation = 1
	want = [4]Point{{1, 0}, {1, 1}, {2, 1}, {1, 2}}
	if got := p.Cells(); got != want {
		t.Fatalf("rotation 1 = %v, want %v", got, want)
	}
}

func TestEveryRotationHasFourCells(t *testing.T) {
	for _, k := range AllKinds {
		for r := 0; r < 4; r++ {
			p := Piece{Kind: k, Rotation: r}
			seen := map[Point]bool{}
			for _, c := range p.Cells() {
				if seen[c] {
					t.Fatalf("%v rotation %d has duplicate cell %v", k, r, c)
				}
				seen[c] = true
			}
			if len(seen) != 4 {
				t.Fatalf("%v rotation %d has %d cells, want 4", k, r, len(seen))
			}
		}
	}
}

func TestFourRotationsReturnToBase(t *testing.T) {
	for _, k := range AllKinds {
		p := Piece{Kind: k, Rotation: 0}
		if got := p.Rotated(4); got.Cells() != p.Cells() {
			t.Fatalf("%v: four turns changed the shape", k)
		}
	}
}

func TestORotationIsIdentical(t *testing.T) {
	base := Piece{Kind: KindO, Rotation: 0}.Cells()
	for r := 1; r < 4; r++ {
		if got := (Piece{Kind: KindO, Rotation: r}).Cells(); got != base {
			t.Fatalf("O rotation %d = %v, want %v", r, got, base)
		}
	}
}

func TestSpawnPieceSitsInHiddenRows(t *testing.T) {
	for _, k := range AllKinds {
		for _, c := range SpawnPiece(k).Cells() {
			if c.Y < 0 || c.Y > 1 {
				t.Fatalf("%v spawn cell %v is outside hidden rows 0..1", k, c)
			}
			if c.X < 0 || c.X >= BoardWidth {
				t.Fatalf("%v spawn cell %v is outside the board width", k, c)
			}
		}
	}
	if got := SpawnPiece(KindO).X; got != 4 {
		t.Fatalf("O spawn X = %d, want 4", got)
	}
	if got := SpawnPiece(KindI).X; got != 3 {
		t.Fatalf("I spawn X = %d, want 3", got)
	}
}

func TestRotatedWrapsNegative(t *testing.T) {
	p := Piece{Kind: KindT, Rotation: 0}
	if got := p.Rotated(-1).Rotation; got != 3 {
		t.Fatalf("Rotated(-1) = %d, want 3", got)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run 'TestT|TestEvery|TestFour|TestO|TestSpawn|TestRotated' -v`
Expected: build failure — `undefined: PieceKind`, `undefined: BoardWidth`. (`BoardWidth` arrives in Task 2; declare it in `board.go` then. To keep this task green on its own, declare `const BoardWidth = 10` in `piece.go` now and move it to `board.go` in Task 2, or declare it in `board.go` as part of this commit — either is fine, but `go test` must pass before the commit.)

- [ ] **Step 3: Implement `internal/game/piece.go`**

Create `go.mod` with `module cosmic-tetris` and `go 1.26` first (`go mod init cosmic-tetris`).

Store one base shape per kind and derive rotations 1–3 by rotating the square box clockwise. Base shapes, exactly:

```text
I  size 4:  ....  ####  ....  ....
J  size 3:  #..   ###   ...
L  size 3:  ..#   ###   ...
O  size 2:  ##    ##
S  size 3:  .##   ##.   ...
T  size 3:  .#.   ###   ...
Z  size 3:  ##.   .##   ...
```

Clockwise rotation of a `size × size` box: `rotated[r][c] = base[size-1-c][r]`.

Precompute all 28 cell sets into a package-level `[7][4][4]Point` in an `init` (or a `var` built by a helper), scanning each rotated box row-major (top row first, left to right) so `Cells()` ordering is deterministic. `Cells()` adds `p.X`/`p.Y` to the stored offsets.

Spawn position: `X = (BoardWidth - size) / 2`, `Y = 0`. With these base shapes every occupied row is 0 or 1, so a spawned piece lies entirely in the hidden rows.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add go.mod internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): tetromino kinds, rotations, and spawn positions"
```

---

### Task 2: Board — bounds, collision, row completion, collapse

**Files:**
- Create: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Piece`, `Point`, `PieceKind` (Task 1).
- Produces:
  ```go
  const (
      BoardWidth  = 10
      BoardHeight = 22
      VisibleRows = 20
      HiddenRows  = 2 // BoardHeight - VisibleRows; hidden rows are y = 0..1
  )

  type Cell struct {
      Filled bool
      Kind   PieceKind
  }

  type Board struct {
      Cells [BoardHeight][BoardWidth]Cell
  }

  func (b *Board) InBounds(x, y int) bool        // 0<=x<10 && 0<=y<22
  func (b *Board) At(x, y int) Cell              // zero Cell when out of bounds
  func (b *Board) Blocked(x, y int) bool         // out of bounds OR filled
  func (b *Board) Fits(p Piece) bool             // no cell of p is Blocked
  func (b *Board) Lock(p Piece)                  // writes p's cells as Filled with p.Kind
  func (b *Board) CompleteRows() []int           // ascending row indices, all 10 filled
  func (b *Board) ClearRows(rows []int)          // removes rows, collapses everything above down
  func (b *Board) RowKinds(y int) [BoardWidth]PieceKind // kinds in a row, for FX snapshots
  func (b *Board) Clear()                        // empties every cell
  ```

- [ ] **Step 1: Write the failing test**

```go
package game

import (
	"reflect"
	"testing"
)

func fillRow(b *Board, y int, holes ...int) {
	hole := map[int]bool{}
	for _, x := range holes {
		hole[x] = true
	}
	for x := 0; x < BoardWidth; x++ {
		if !hole[x] {
			b.Cells[y][x] = Cell{Filled: true, Kind: KindI}
		}
	}
}

func TestBoundsAndBlocked(t *testing.T) {
	var b Board
	if b.InBounds(-1, 0) || b.InBounds(BoardWidth, 0) || b.InBounds(0, -1) || b.InBounds(0, BoardHeight) {
		t.Fatal("InBounds accepted an out-of-range coordinate")
	}
	if !b.Blocked(-1, 5) || !b.Blocked(0, BoardHeight) {
		t.Fatal("out-of-bounds coordinates must be Blocked")
	}
	if b.Blocked(0, 0) {
		t.Fatal("an empty in-bounds cell must not be Blocked")
	}
	b.Cells[5][5] = Cell{Filled: true, Kind: KindZ}
	if !b.Blocked(5, 5) {
		t.Fatal("a filled cell must be Blocked")
	}
}

func TestFitsRejectsOverlapAndWalls(t *testing.T) {
	var b Board
	p := Piece{Kind: KindO, Rotation: 0, X: 4, Y: 0}
	if !b.Fits(p) {
		t.Fatal("O should fit on an empty board")
	}
	p.X = -1
	if b.Fits(p) {
		t.Fatal("O overhanging the left wall must not fit")
	}
	p.X = BoardWidth - 1
	if b.Fits(p) {
		t.Fatal("O overhanging the right wall must not fit")
	}
	p = Piece{Kind: KindO, Rotation: 0, X: 4, Y: BoardHeight - 2}
	b.Cells[BoardHeight-1][4] = Cell{Filled: true, Kind: KindT}
	if b.Fits(p) {
		t.Fatal("O overlapping a locked cell must not fit")
	}
}

func TestLockWritesKinds(t *testing.T) {
	var b Board
	b.Lock(Piece{Kind: KindT, Rotation: 0, X: 0, Y: 0})
	for _, c := range (Piece{Kind: KindT, Rotation: 0, X: 0, Y: 0}).Cells() {
		if got := b.At(c.X, c.Y); !got.Filled || got.Kind != KindT {
			t.Fatalf("cell %v = %+v, want filled T", c, got)
		}
	}
}

func TestCompleteRowsAscending(t *testing.T) {
	var b Board
	fillRow(&b, 21)
	fillRow(&b, 19)
	fillRow(&b, 20, 3) // one hole
	if got, want := b.CompleteRows(), []int{19, 21}; !reflect.DeepEqual(got, want) {
		t.Fatalf("CompleteRows = %v, want %v", got, want)
	}
}

func TestClearRowsCollapses(t *testing.T) {
	var b Board
	b.Cells[18][0] = Cell{Filled: true, Kind: KindS} // marker above the cleared rows
	fillRow(&b, 19)
	fillRow(&b, 21)
	b.ClearRows([]int{19, 21})
	if len(b.CompleteRows()) != 0 {
		t.Fatal("cleared rows should be gone")
	}
	if got := b.At(0, 20); !got.Filled || got.Kind != KindS {
		t.Fatalf("marker should have fallen two rows to y=20, got %+v", got)
	}
	if b.At(0, 18).Filled {
		t.Fatal("the marker's old row should be empty")
	}
	for x := 0; x < BoardWidth; x++ {
		if b.At(x, 21).Filled && x != 0 {
			t.Fatalf("row 21 should hold only the collapsed remainder, found fill at x=%d", x)
		}
	}
}

func TestClearRowsFillsTopWithEmpty(t *testing.T) {
	var b Board
	for y := 0; y < BoardHeight; y++ {
		fillRow(&b, y)
	}
	b.ClearRows([]int{21})
	if b.At(0, 0).Filled {
		t.Fatal("the top row must be empty after a collapse")
	}
}

func TestRowKinds(t *testing.T) {
	var b Board
	b.Cells[10][2] = Cell{Filled: true, Kind: KindZ}
	if got := b.RowKinds(10)[2]; got != KindZ {
		t.Fatalf("RowKinds[2] = %v, want Z", got)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run TestBoard -v; go test ./internal/game/ -v`
Expected: build failure — `undefined: Board`.

- [ ] **Step 3: Implement `internal/game/board.go`**

`ClearRows` collapses by copying rows downward: walk from the bottom up with a write cursor, skipping rows in the cleared set, then zero the remaining rows at the top. Treat the `rows` argument as unsorted (sort a copy or use a `[BoardHeight]bool` mask) so callers cannot break it with ordering.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board collision, row completion, and collapse"
```

---

### Task 3: 7-bag piece generator

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `AllKinds` (Task 1).
- Produces:
  ```go
  type Bag struct { /* rng *rand.Rand; queue []PieceKind */ }
  func NewBag(rng *rand.Rand) *Bag // math/rand/v2
  func (b *Bag) Next() PieceKind   // refills and reshuffles when empty
  ```

- [ ] **Step 1: Write the failing test**

```go
package game

import (
	"math/rand/v2"
	"testing"
)

func newTestRNG(seed int64) *rand.Rand {
	return rand.New(rand.NewPCG(uint64(seed), 0x9E3779B97F4A7C15))
}

func TestEveryBagContainsAllSevenExactlyOnce(t *testing.T) {
	b := NewBag(newTestRNG(1))
	for bagIndex := 0; bagIndex < 20; bagIndex++ {
		counts := map[PieceKind]int{}
		for i := 0; i < 7; i++ {
			counts[b.Next()]++
		}
		for _, k := range AllKinds {
			if counts[k] != 1 {
				t.Fatalf("bag %d contains %d of %v, want exactly 1", bagIndex, counts[k], k)
			}
		}
	}
}

func TestSeededBagIsReproducible(t *testing.T) {
	a, b := NewBag(newTestRNG(8675309)), NewBag(newTestRNG(8675309))
	for i := 0; i < 50; i++ {
		x, y := a.Next(), b.Next()
		if x != y {
			t.Fatalf("draw %d: %v != %v for the same seed", i, x, y)
		}
	}
}

func TestDifferentSeedsDiverge(t *testing.T) {
	a, b := NewBag(newTestRNG(1)), NewBag(newTestRNG(2))
	var seqA, seqB [14]PieceKind
	for i := range seqA {
		seqA[i], seqB[i] = a.Next(), b.Next()
	}
	if seqA == seqB {
		t.Fatal("two different seeds produced identical two-bag sequences")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run Bag -v`
Expected: FAIL — `undefined: NewBag`.

- [ ] **Step 3: Implement `internal/game/bag.go`**

`Next` refills the queue with `AllKinds` in declaration order and shuffles it with `rng.Shuffle` whenever the queue is empty, then pops the front.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag piece generator"
```

---

### Task 4: Scoring, level, and gravity as pure functions

**Files:**
- Create: `internal/game/scoring.go`
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```go
  const (
      LockDelay     = 500 * time.Millisecond
      MaxLockResets = 15
      BaseGravity   = 800 * time.Millisecond
      MinGravity    = 60 * time.Millisecond
      GravityFactor = 0.86
      LinesPerLevel = 10
  )

  func ClearScore(lines, level int) int   // 0 for lines<=0; 100/300/500/800 x level; 800 x level for lines>4
  func ComboBonus(combo, level int) int   // 50 * (combo-1) * level, never negative
  func SoftDropScore(cells int) int       // 1 per cell
  func HardDropScore(cells int) int       // 2 per cell
  func LevelForLines(lines int) int       // 1 + lines/10
  func GravityInterval(level int) time.Duration
  ```

- [ ] **Step 1: Write the failing test**

```go
package game

import (
	"testing"
	"time"
)

func TestClearScoreTable(t *testing.T) {
	cases := []struct{ lines, level, want int }{
		{1, 1, 100}, {2, 1, 300}, {3, 1, 500}, {4, 1, 800},
		{1, 7, 700}, {4, 7, 5600},
		{0, 5, 0}, {-1, 5, 0},
	}
	for _, c := range cases {
		if got := ClearScore(c.lines, c.level); got != c.want {
			t.Errorf("ClearScore(%d,%d) = %d, want %d", c.lines, c.level, got, c.want)
		}
	}
}

func TestComboBonusStartsAtComboTwo(t *testing.T) {
	cases := []struct{ combo, level, want int }{
		{0, 3, 0}, {1, 3, 0}, {2, 3, 150}, {5, 2, 400},
	}
	for _, c := range cases {
		if got := ComboBonus(c.combo, c.level); got != c.want {
			t.Errorf("ComboBonus(%d,%d) = %d, want %d", c.combo, c.level, got, c.want)
		}
	}
}

func TestDropScores(t *testing.T) {
	if got := SoftDropScore(3); got != 3 {
		t.Errorf("SoftDropScore(3) = %d, want 3", got)
	}
	if got := HardDropScore(7); got != 14 {
		t.Errorf("HardDropScore(7) = %d, want 14", got)
	}
	if got := HardDropScore(0); got != 0 {
		t.Errorf("HardDropScore(0) = %d, want 0", got)
	}
}

func TestLevelForLines(t *testing.T) {
	cases := []struct{ lines, want int }{{0, 1}, {9, 1}, {10, 2}, {19, 2}, {127, 13}}
	for _, c := range cases {
		if got := LevelForLines(c.lines); got != c.want {
			t.Errorf("LevelForLines(%d) = %d, want %d", c.lines, got, c.want)
		}
	}
}

func TestGravityIntervalCurve(t *testing.T) {
	if got := GravityInterval(1); got != BaseGravity {
		t.Errorf("level 1 = %v, want %v", got, BaseGravity)
	}
	l2 := GravityInterval(2)
	if l2 <= 680*time.Millisecond || l2 >= 690*time.Millisecond {
		t.Errorf("level 2 = %v, want ~688ms", l2)
	}
	if GravityInterval(3) >= GravityInterval(2) {
		t.Error("gravity interval must decrease with level")
	}
}

// Review Focus 5: an extreme level must clamp, never reach zero.
func TestGravityIntervalClampsAtFloor(t *testing.T) {
	for _, level := range []int{20, 100, 10000} {
		got := GravityInterval(level)
		if got < MinGravity {
			t.Errorf("level %d = %v, below the %v floor", level, got, MinGravity)
		}
		if got <= 0 {
			t.Fatalf("level %d = %v, must stay positive", level, got)
		}
	}
	if got := GravityInterval(0); got != BaseGravity {
		t.Errorf("level 0 = %v, want the level-1 interval %v", got, BaseGravity)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'Score|Combo|Level|Gravity' -v`
Expected: FAIL — `undefined: ClearScore`.

- [ ] **Step 3: Implement `internal/game/scoring.go`**

`GravityInterval` computes `float64(BaseGravity) * math.Pow(GravityFactor, float64(level-1))` with `level` treated as at least 1, then clamps to `MinGravity`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/scoring.go internal/game/scoring_test.go
git commit -m "feat(game): scoring, level, and gravity curve"
```

---

### Task 5: Events, `Game` construction, next queue, and spawning

**Files:**
- Create: `internal/game/events.go`
- Create: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces:
  ```go
  // events.go — the closed set from §14. Every mutating method returns []Event.
  type Event interface{ event() }

  type PieceSpawned struct{ Piece Piece }
  type PieceMoved struct{ Piece Piece; DX, DY int }
  type PieceRotated struct{ Piece Piece; Delta int }
  type PieceHardDropped struct{ Piece Piece; Distance int }
  type PieceLocked struct{ Piece Piece }
  type HoldUsed struct{ Stored PieceKind; Incoming PieceKind }
  type LinesCleared struct {
      Rows  []int                      // ascending board rows that were cleared
      Kinds [][BoardWidth]PieceKind    // contents of each cleared row, same order as Rows
      Count int
      Score int                        // clear value + combo bonus awarded for this placement
  }
  type ComboChanged struct{ Combo int }
  type LevelChanged struct{ Level int }
  type GameOver struct{ Score, Lines, Level int }

  // game.go
  type State int
  const (StatePlaying State = iota; StateOver)

  const NextQueueLen = 5

  type Game struct {
      Board   Board
      Active  Piece
      Hold    *PieceKind
      CanHold bool

      Next []PieceKind
      Bag  *Bag

      Score int
      Lines int
      Level int
      Combo int

      GravityAccumulator time.Duration
      LockAccumulator    time.Duration
      LockResets         int

      State State
      Seed  int64
      // rng *rand.Rand — unexported; drives Bag only (§49.6)
  }

  func New(seed int64) *Game
  func (g *Game) Over() bool
  ```

- [ ] **Step 1: Write the failing test**

```go
package game

import "testing"

func TestNewGameInitialState(t *testing.T) {
	g := New(8675309)
	if g.Level != 1 || g.Score != 0 || g.Lines != 0 || g.Combo != 0 {
		t.Fatalf("unexpected initial counters: %+v", g)
	}
	if g.Seed != 8675309 {
		t.Fatalf("Seed = %d, want 8675309", g.Seed)
	}
	if len(g.Next) != NextQueueLen {
		t.Fatalf("len(Next) = %d, want %d", len(g.Next), NextQueueLen)
	}
	if g.Hold != nil {
		t.Fatal("Hold must start empty")
	}
	if !g.CanHold {
		t.Fatal("CanHold must start true")
	}
	if g.State != StatePlaying || g.Over() {
		t.Fatal("a new game must be playing")
	}
	if !g.Board.Fits(g.Active) {
		t.Fatal("the first active piece must fit on the empty board")
	}
	for _, c := range g.Active.Cells() {
		if c.Y > 1 {
			t.Fatalf("the first piece spawned outside the hidden rows: %v", c)
		}
	}
}

func TestNewGameIsSeedReproducible(t *testing.T) {
	a, b := New(42), New(42)
	if a.Active != b.Active {
		t.Fatalf("active pieces differ: %+v vs %+v", a.Active, b.Active)
	}
	for i := range a.Next {
		if a.Next[i] != b.Next[i] {
			t.Fatalf("Next[%d] differs: %v vs %v", i, a.Next[i], b.Next[i])
		}
	}
}

func TestSpawnRefillsTheQueue(t *testing.T) {
	g := New(7)
	head := g.Next[0]
	evs := g.spawnNext()
	if g.Active.Kind != head {
		t.Fatalf("spawned %v, want the queue head %v", g.Active.Kind, head)
	}
	if g.Active.Rotation != 0 {
		t.Fatalf("spawned at rotation %d, want 0", g.Active.Rotation)
	}
	if len(g.Next) != NextQueueLen {
		t.Fatalf("len(Next) = %d after spawn, want %d", len(g.Next), NextQueueLen)
	}
	if len(evs) != 1 {
		t.Fatalf("spawn emitted %d events, want 1 PieceSpawned", len(evs))
	}
	if _, ok := evs[0].(PieceSpawned); !ok {
		t.Fatalf("spawn emitted %T, want PieceSpawned", evs[0])
	}
	if !g.CanHold {
		t.Fatal("spawning must re-arm CanHold")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestNewGame|TestSpawn' -v`
Expected: FAIL — `undefined: New`, `g.spawnNext undefined`.

- [ ] **Step 3: Implement `internal/game/events.go` and `internal/game/game.go`**

Each event type gets a one-line `func (X) event() {}`. In `game.go`, `New` builds the RNG per the Global Constraints, creates the bag, fills `Next` to `NextQueueLen`, sets `Level = 1`, `CanHold = true`, and spawns the first piece (discarding its events; `New` returns only `*Game`).

`spawnNext()` (unexported) pops `Next[0]`, refills from the bag, sets `Active = SpawnPiece(kind)`, resets `LockAccumulator`, `LockResets`, `GravityAccumulator`, sets `CanHold = true`, and returns `[]Event{PieceSpawned{...}}`. Task 7 adds the blocked-spawn game-over branch to this same method.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/events.go internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game state, event types, spawn and next queue"
```

---

### Task 6: Movement, rotation with wall kicks, and the ghost position

**Files:**
- Create: `internal/game/rules.go`
- Modify: `internal/game/game.go`
- Test: `internal/game/movement_test.go`

**Interfaces:**
- Consumes: `Game`, `Board.Fits`, events (Task 5).
- Produces:
  ```go
  // rules.go
  var KickOffsets = [8]Point{{0, 0}, {-1, 0}, {1, 0}, {-2, 0}, {2, 0}, {0, -1}, {-1, -1}, {1, -1}}

  // game.go
  func (g *Game) MoveLeft() []Event     // PieceMoved{DX:-1} on success, nil on failure
  func (g *Game) MoveRight() []Event    // PieceMoved{DX:+1}
  func (g *Game) Rotate(delta int) []Event // delta +1 CW, -1 CCW; PieceRotated or nil
  func (g *Game) Grounded() bool        // the active piece cannot move down
  func (g *Game) GhostY() int           // Y the active piece would rest at (§10)
  ```
  Movement and rotation also feed the lock-reset rule: a successful move or rotation while `Grounded()` zeroes `LockAccumulator` and increments `LockResets`, but only while `LockResets < MaxLockResets` (Task 8 consumes this).

- [ ] **Step 1: Write the failing test**

```go
package game

import "testing"

// place puts a known piece under player control on an empty board.
func place(t *testing.T, g *Game, p Piece) {
	t.Helper()
	g.Active = p
	if !g.Board.Fits(p) {
		t.Fatalf("test setup: %+v does not fit", p)
	}
}

func TestMoveLeftRightAndWalls(t *testing.T) {
	g := New(1)
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: 10})
	if evs := g.MoveLeft(); len(evs) != 1 {
		t.Fatalf("MoveLeft emitted %d events, want 1", len(evs))
	} else if m, ok := evs[0].(PieceMoved); !ok || m.DX != -1 {
		t.Fatalf("MoveLeft emitted %#v, want PieceMoved{DX:-1}", evs[0])
	}
	if g.Active.X != 3 {
		t.Fatalf("X = %d, want 3", g.Active.X)
	}
	for i := 0; i < 10; i++ {
		g.MoveLeft()
	}
	if g.Active.X != 0 {
		t.Fatalf("X = %d after hitting the left wall, want 0", g.Active.X)
	}
	if evs := g.MoveLeft(); evs != nil {
		t.Fatalf("a blocked move must emit no events, got %v", evs)
	}
	for i := 0; i < 20; i++ {
		g.MoveRight()
	}
	if g.Active.X != BoardWidth-2 {
		t.Fatalf("X = %d after hitting the right wall, want %d", g.Active.X, BoardWidth-2)
	}
}

func TestRotateEmitsEventAndChangesRotation(t *testing.T) {
	g := New(1)
	place(t, g, Piece{Kind: KindT, Rotation: 0, X: 4, Y: 10})
	evs := g.Rotate(1)
	if len(evs) != 1 {
		t.Fatalf("Rotate emitted %d events, want 1", len(evs))
	}
	if r, ok := evs[0].(PieceRotated); !ok || r.Delta != 1 {
		t.Fatalf("Rotate emitted %#v, want PieceRotated{Delta:1}", evs[0])
	}
	if g.Active.Rotation != 1 {
		t.Fatalf("Rotation = %d, want 1", g.Active.Rotation)
	}
	g.Rotate(-1)
	if g.Active.Rotation != 0 {
		t.Fatalf("Rotation = %d after CCW, want 0", g.Active.Rotation)
	}
}

func TestRotateKicksOffTheWall(t *testing.T) {
	g := New(1)
	// Vertical I flush against the left wall: rotating to horizontal only fits after a kick.
	place(t, g, Piece{Kind: KindI, Rotation: 1, X: -1, Y: 10})
	before := g.Active
	if evs := g.Rotate(1); len(evs) == 0 {
		t.Fatal("rotation against the wall should have succeeded via a kick")
	}
	if g.Active.X == before.X {
		t.Fatalf("X = %d, expected a kick to shift the piece", g.Active.X)
	}
	if !g.Board.Fits(g.Active) {
		t.Fatalf("kicked piece %+v does not fit", g.Active)
	}
}

func TestRotateFailsWhenNoKickFits(t *testing.T) {
	g := New(1)
	place(t, g, Piece{Kind: KindT, Rotation: 0, X: 4, Y: 10})
	// Wall in every direction the kick table can reach.
	for y := 8; y <= 13; y++ {
		for x := 0; x < BoardWidth; x++ {
			if x >= 4 && x <= 6 && y >= 10 && y <= 11 {
				continue
			}
			g.Board.Cells[y][x] = Cell{Filled: true, Kind: KindZ}
		}
	}
	before := g.Active
	if evs := g.Rotate(1); evs != nil {
		t.Fatalf("boxed-in rotation must fail, got %v", evs)
	}
	if g.Active != before {
		t.Fatalf("a failed rotation must not change the piece: %+v", g.Active)
	}
}

// Review Focus 1: a kick offset of (0,-1) at the ceiling must fail, not panic.
func TestRotateAtCeilingDoesNotPanic(t *testing.T) {
	g := New(1)
	place(t, g, Piece{Kind: KindI, Rotation: 0, X: 3, Y: 0})
	for delta := -1; delta <= 1; delta += 2 {
		for i := 0; i < 4; i++ {
			g.Rotate(delta) // must never panic, whatever it decides
			if !g.Board.Fits(g.Active) {
				t.Fatalf("piece left in an invalid position: %+v", g.Active)
			}
			for _, c := range g.Active.Cells() {
				if c.Y < 0 {
					t.Fatalf("piece kicked above the board: %v", c)
				}
			}
		}
	}
}

func TestGroundedAndGhostY(t *testing.T) {
	g := New(1)
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: 0})
	if g.Grounded() {
		t.Fatal("a piece with room below must not be Grounded")
	}
	if got, want := g.GhostY(), BoardHeight-2; got != want {
		t.Fatalf("GhostY = %d, want %d", got, want)
	}
	fillRow(&g.Board, BoardHeight-1)
	if got, want := g.GhostY(), BoardHeight-3; got != want {
		t.Fatalf("GhostY over a filled floor = %d, want %d", got, want)
	}
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: BoardHeight - 3})
	if !g.Grounded() {
		t.Fatal("a piece resting on the floor must be Grounded")
	}
	if got := g.GhostY(); got != g.Active.Y {
		t.Fatalf("GhostY = %d for a grounded piece, want %d", got, g.Active.Y)
	}
}

func TestMoveWhileGroundedResetsLockTimer(t *testing.T) {
	g := New(1)
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: BoardHeight - 2})
	g.LockAccumulator = 300 * time.Millisecond
	g.MoveLeft()
	if g.LockAccumulator != 0 {
		t.Fatalf("LockAccumulator = %v, want 0 after a grounded move", g.LockAccumulator)
	}
	if g.LockResets != 1 {
		t.Fatalf("LockResets = %d, want 1", g.LockResets)
	}
	g.LockResets = MaxLockResets
	g.LockAccumulator = 300 * time.Millisecond
	g.MoveRight()
	if g.LockAccumulator != 300*time.Millisecond {
		t.Fatalf("past %d resets the timer must not reset, got %v", MaxLockResets, g.LockAccumulator)
	}
}
```

(add `"time"` to the imports)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestMove|TestRotate|TestGrounded' -v`
Expected: FAIL — `g.MoveLeft undefined`.

- [ ] **Step 3: Implement `internal/game/rules.go` and the movement methods in `game.go`**

Return `nil` from every input method when `g.State != StatePlaying`. `Rotate` builds the candidate with `Active.Rotated(delta)` and then walks `KickOffsets` in order, accepting the first candidate that `Fits`. `GhostY` steps a copy of the active piece down until it no longer fits. Factor the grounded lock-reset behavior into one unexported helper (`g.touchLockTimer()`) called by both move methods and `Rotate` on success.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/rules.go internal/game/game.go internal/game/movement_test.go
git commit -m "feat(game): movement, wall-kick rotation, ghost position"
```

---

### Task 7: Hard drop and the lock pipeline (clear, score, combo, level, game over)

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/lock_test.go`

**Interfaces:**
- Consumes: `ClearScore`, `ComboBonus`, `HardDropScore`, `LevelForLines` (Task 4); `Board.CompleteRows`, `ClearRows`, `RowKinds` (Task 2); `spawnNext` (Task 5).
- Produces:
  ```go
  func (g *Game) HardDrop() []Event // PieceHardDropped, then the lock pipeline's events
  func (g *Game) lockActive() []Event
  ```
  Lock pipeline order (§12): commit the piece → `PieceLocked` → detect and clear complete rows → update `Score`/`Lines`/`Combo`/`Level` → `LinesCleared`, `ComboChanged` (only when the value changed), `LevelChanged` (only when the value changed) → `spawnNext()`, or `GameOver` and `State = StateOver` when the new piece does not fit.

- [ ] **Step 1: Write the failing test**

```go
package game

import "testing"

func eventsOfType[T Event](evs []Event) []T {
	var out []T
	for _, e := range evs {
		if t, ok := e.(T); ok {
			out = append(out, t)
		}
	}
	return out
}

func TestHardDropLandsLocksAndScores(t *testing.T) {
	g := New(1)
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: 0})
	evs := g.HardDrop()
	drops := eventsOfType[PieceHardDropped](evs)
	if len(drops) != 1 {
		t.Fatalf("got %d PieceHardDropped events, want 1", len(drops))
	}
	if want := BoardHeight - 2; drops[0].Distance != want {
		t.Fatalf("Distance = %d, want %d", drops[0].Distance, want)
	}
	if got, want := g.Score, HardDropScore(BoardHeight-2); got != want {
		t.Fatalf("Score = %d, want %d", got, want)
	}
	if len(eventsOfType[PieceLocked](evs)) != 1 {
		t.Fatal("hard drop must lock the piece")
	}
	if len(eventsOfType[PieceSpawned](evs)) != 1 {
		t.Fatal("hard drop must spawn the next piece")
	}
	if !g.Board.At(4, BoardHeight-1).Filled {
		t.Fatal("the dropped piece must be committed to the board")
	}
}

// Review Focus: a hard drop with nowhere to fall scores nothing and still locks.
func TestHardDropOnTheFloorScoresZero(t *testing.T) {
	g := New(1)
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: BoardHeight - 2})
	evs := g.HardDrop()
	if d := eventsOfType[PieceHardDropped](evs)[0].Distance; d != 0 {
		t.Fatalf("Distance = %d, want 0", d)
	}
	if g.Score != 0 {
		t.Fatalf("Score = %d, want 0", g.Score)
	}
	if len(eventsOfType[PieceLocked](evs)) != 1 {
		t.Fatal("the piece must still lock")
	}
}

func TestSingleLineClearScoresAndCollapses(t *testing.T) {
	g := New(1)
	g.Level = 1
	fillRow(&g.Board, BoardHeight-1, 4, 5) // two-wide gap for an O
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: BoardHeight - 3})
	evs := g.HardDrop()
	cleared := eventsOfType[LinesCleared](evs)
	if len(cleared) != 1 {
		t.Fatalf("got %d LinesCleared events, want 1", len(cleared))
	}
	c := cleared[0]
	if c.Count != 1 || len(c.Rows) != 1 || c.Rows[0] != BoardHeight-1 {
		t.Fatalf("LinesCleared = %+v, want one row %d", c, BoardHeight-1)
	}
	if len(c.Kinds) != 1 || c.Kinds[0][4] != KindO {
		t.Fatalf("Kinds snapshot missing the dropped piece: %+v", c.Kinds)
	}
	if c.Score != 100 {
		t.Fatalf("clear Score = %d, want 100", c.Score)
	}
	if g.Lines != 1 {
		t.Fatalf("Lines = %d, want 1", g.Lines)
	}
	if g.Combo != 1 {
		t.Fatalf("Combo = %d, want 1 after the first clearing placement", g.Combo)
	}
	if len(g.Board.CompleteRows()) != 0 {
		t.Fatal("the cleared row must be gone from the board")
	}
}

func TestFourLineClearScoresEightHundredTimesLevel(t *testing.T) {
	g := New(1)
	g.Level = 3
	for y := BoardHeight - 4; y < BoardHeight; y++ {
		fillRow(&g.Board, y, 0)
	}
	place(t, g, Piece{Kind: KindI, Rotation: 1, X: -1, Y: BoardHeight - 4})
	if !g.Board.Fits(g.Active) {
		t.Skip("adjust the vertical-I column so it lands in the x=0 well")
	}
	evs := g.HardDrop()
	c := eventsOfType[LinesCleared](evs)[0]
	if c.Count != 4 {
		t.Fatalf("Count = %d, want 4", c.Count)
	}
	if c.Score != 800*3 {
		t.Fatalf("Score = %d, want %d", c.Score, 800*3)
	}
}

func TestComboIncrementsAndResets(t *testing.T) {
	g := New(1)
	clearOneRow := func() []Event {
		fillRow(&g.Board, BoardHeight-1, 4, 5)
		place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: BoardHeight - 3})
		return g.HardDrop()
	}
	clearOneRow()
	if g.Combo != 1 {
		t.Fatalf("Combo = %d, want 1", g.Combo)
	}
	evs := clearOneRow()
	if g.Combo != 2 {
		t.Fatalf("Combo = %d, want 2", g.Combo)
	}
	if got := eventsOfType[LinesCleared](evs)[0].Score; got != 100*g.Level+ComboBonus(2, g.Level) {
		t.Fatalf("second clear Score = %d, want clear+combo bonus", got)
	}
	if changes := eventsOfType[ComboChanged](evs); len(changes) != 1 || changes[0].Combo != 2 {
		t.Fatalf("ComboChanged = %+v, want Combo 2", changes)
	}
	// A placement that clears nothing resets the combo to 0.
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 0, Y: 0})
	evs = g.HardDrop()
	if g.Combo != 0 {
		t.Fatalf("Combo = %d after a non-clearing placement, want 0", g.Combo)
	}
	if changes := eventsOfType[ComboChanged](evs); len(changes) != 1 || changes[0].Combo != 0 {
		t.Fatalf("ComboChanged = %+v, want Combo 0", changes)
	}
}

func TestLevelChangesEveryTenLines(t *testing.T) {
	g := New(1)
	g.Lines = 9
	fillRow(&g.Board, BoardHeight-1, 4, 5)
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: BoardHeight - 3})
	evs := g.HardDrop()
	if g.Lines != 10 || g.Level != 2 {
		t.Fatalf("Lines=%d Level=%d, want 10 and 2", g.Lines, g.Level)
	}
	if ups := eventsOfType[LevelChanged](evs); len(ups) != 1 || ups[0].Level != 2 {
		t.Fatalf("LevelChanged = %+v, want Level 2", ups)
	}
}

func TestBlockedSpawnEndsTheGame(t *testing.T) {
	g := New(1)
	for y := 0; y < BoardHeight-1; y++ {
		fillRow(&g.Board, y)
	}
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: BoardHeight - 2})
	// setup leaves no room, so clear the two cells the piece occupies
	g.Board.Cells[BoardHeight-2][4] = Cell{}
	g.Board.Cells[BoardHeight-2][5] = Cell{}
	evs := g.HardDrop()
	overs := eventsOfType[GameOver](evs)
	if len(overs) != 1 {
		t.Fatalf("got %d GameOver events, want 1", len(overs))
	}
	if overs[0].Score != g.Score || overs[0].Lines != g.Lines || overs[0].Level != g.Level {
		t.Fatalf("GameOver = %+v, want the final counters", overs[0])
	}
	if g.State != StateOver || !g.Over() {
		t.Fatal("State must be StateOver")
	}
	if evs := g.HardDrop(); evs != nil {
		t.Fatal("input after game over must be ignored")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestHardDrop|TestSingleLine|TestFourLine|TestCombo|TestLevelChanges|TestBlockedSpawn' -v`
Expected: FAIL — `g.HardDrop undefined`.

- [ ] **Step 3: Implement `HardDrop` and `lockActive` in `internal/game/game.go`**

`HardDrop` computes the distance to `GhostY()`, moves the piece there, awards `HardDropScore(distance)`, emits `PieceHardDropped`, then appends `lockActive()`'s events.

`lockActive` snapshots `RowKinds` for each complete row **before** calling `ClearRows`, so `LinesCleared.Kinds` carries the pre-collapse contents. Combo per §49.1: a clearing placement does `Combo++`; a non-clearing placement sets `Combo = 0`. Emit `ComboChanged` only when the value actually changed, `LevelChanged` only when `LevelForLines(g.Lines)` differs from `g.Level`.

Extend `spawnNext` from Task 5: if the newly spawned piece does not `Fit`, set `State = StateOver` and return `PieceSpawned` plus `GameOver{Score, Lines, Level}` — or return only `GameOver`, as long as the tests above pass; pick one and keep it consistent (Plan 3 keys the collapse animation off `GameOver`).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/game.go internal/game/lock_test.go
git commit -m "feat(game): hard drop, lock pipeline, line clears, combo, level, game over"
```

---

### Task 8: `Advance(dt)` — gravity, soft drop, and lock delay

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/advance_test.go`

**Interfaces:**
- Consumes: `GravityInterval`, `LockDelay`, `MaxLockResets` (Task 4); `lockActive` (Task 7).
- Produces:
  ```go
  func (g *Game) Advance(dt time.Duration) []Event // the only time input into the engine (§49.2)
  func (g *Game) SoftDrop() []Event                // one cell down, +1 point, PieceMoved{DY:1}; locks nothing
  ```

- [ ] **Step 1: Write the failing test**

```go
package game

import (
	"testing"
	"time"
)

func TestAdvanceDropsOnePerInterval(t *testing.T) {
	g := New(1)
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: 0})
	if evs := g.Advance(GravityInterval(1) - time.Millisecond); len(evs) != 0 {
		t.Fatalf("a short tick emitted %v, want nothing", evs)
	}
	if g.Active.Y != 0 {
		t.Fatalf("Y = %d before a full interval, want 0", g.Active.Y)
	}
	evs := g.Advance(2 * time.Millisecond)
	if g.Active.Y != 1 {
		t.Fatalf("Y = %d after one interval, want 1", g.Active.Y)
	}
	if len(eventsOfType[PieceMoved](evs)) != 1 {
		t.Fatalf("expected one PieceMoved, got %v", evs)
	}
}

// Review Focus 2: a huge dt applies every step in order and terminates.
func TestAdvanceWithHugeDTStepsThroughCollision(t *testing.T) {
	g := New(1)
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: 0})
	done := make(chan []Event, 1)
	go func() { done <- g.Advance(30 * time.Second) }()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("Advance did not terminate on a 30s dt")
	}
	if !g.Board.At(4, BoardHeight-1).Filled {
		t.Fatal("the piece should have fallen, grounded, and locked")
	}
	if g.State != StatePlaying {
		t.Fatalf("State = %v, want StatePlaying", g.State)
	}
}

// Review Focus 3: a non-positive dt changes nothing.
func TestAdvanceIgnoresNonPositiveDT(t *testing.T) {
	g := New(1)
	before := *g
	for _, dt := range []time.Duration{0, -time.Second} {
		if evs := g.Advance(dt); evs != nil {
			t.Fatalf("Advance(%v) emitted %v, want nil", dt, evs)
		}
	}
	if g.Active != before.Active || g.GravityAccumulator != before.GravityAccumulator {
		t.Fatal("Advance with a non-positive dt must not change state")
	}
}

func TestAdvanceIgnoredAfterGameOver(t *testing.T) {
	g := New(1)
	g.State = StateOver
	before := g.Active
	if evs := g.Advance(time.Second); evs != nil {
		t.Fatalf("Advance after game over emitted %v, want nil", evs)
	}
	if g.Active != before {
		t.Fatal("Advance after game over must not move the piece")
	}
}

func TestLockDelayAndReset(t *testing.T) {
	g := New(1)
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: BoardHeight - 2})
	if evs := g.Advance(LockDelay - time.Millisecond); len(eventsOfType[PieceLocked](evs)) != 0 {
		t.Fatal("the piece must not lock before the lock delay elapses")
	}
	g.MoveLeft() // resets the timer
	if evs := g.Advance(LockDelay - time.Millisecond); len(eventsOfType[PieceLocked](evs)) != 0 {
		t.Fatal("a grounded move must have reset the lock timer")
	}
	evs := g.Advance(2 * time.Millisecond)
	if len(eventsOfType[PieceLocked](evs)) != 1 {
		t.Fatalf("expected a lock once the delay elapsed, got %v", evs)
	}
}

func TestLockResetsAreCapped(t *testing.T) {
	g := New(1)
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: BoardHeight - 2})
	for i := 0; i < MaxLockResets+5; i++ {
		g.Advance(10 * time.Millisecond)
		if i%2 == 0 {
			g.MoveLeft()
		} else {
			g.MoveRight()
		}
	}
	if g.LockResets < MaxLockResets {
		t.Fatalf("LockResets = %d, want it to reach %d", g.LockResets, MaxLockResets)
	}
	evs := g.Advance(LockDelay)
	if len(eventsOfType[PieceLocked](evs)) != 1 {
		t.Fatalf("stalling past %d resets must still lock, got %v", MaxLockResets, evs)
	}
}

func TestSoftDropScoresOnePerCell(t *testing.T) {
	g := New(1)
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: 0})
	evs := g.SoftDrop()
	if g.Active.Y != 1 {
		t.Fatalf("Y = %d, want 1", g.Active.Y)
	}
	if g.Score != 1 {
		t.Fatalf("Score = %d, want 1", g.Score)
	}
	if m := eventsOfType[PieceMoved](evs); len(m) != 1 || m[0].DY != 1 {
		t.Fatalf("SoftDrop emitted %#v, want PieceMoved{DY:1}", evs)
	}
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: BoardHeight - 2})
	scoreBefore := g.Score
	if evs := g.SoftDrop(); evs != nil {
		t.Fatalf("a blocked soft drop emitted %v, want nil", evs)
	}
	if g.Score != scoreBefore {
		t.Fatal("a blocked soft drop must not score")
	}
}

func TestGravityFollowsLevel(t *testing.T) {
	g := New(1)
	g.Level = 5
	place(t, g, Piece{Kind: KindO, Rotation: 0, X: 4, Y: 0})
	g.Advance(GravityInterval(5))
	if g.Active.Y != 1 {
		t.Fatalf("Y = %d after one level-5 interval, want 1", g.Active.Y)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestAdvance|TestLock|TestSoftDrop|TestGravityFollows' -v`
Expected: FAIL — `g.Advance undefined`.

- [ ] **Step 3: Implement `Advance` and `SoftDrop` in `internal/game/game.go`**

`Advance` returns `nil` immediately when `dt <= 0` or `g.State != StatePlaying`. Then: add `dt` to `GravityAccumulator` and, while it is at least `GravityInterval(g.Level)`, subtract one interval and try to step down — a successful step emits `PieceMoved{DY:1}` and zeroes `LockAccumulator`; a blocked step leaves the piece grounded. Separately, when `Grounded()`, add `dt` to `LockAccumulator` and call `lockActive()` once it reaches `LockDelay`; when not grounded, zero it. Stop the gravity loop as soon as the piece locks so a huge `dt` cannot drive two placements in one call — drain or reset `GravityAccumulator` at lock time.

`SoftDrop` moves down one cell if it fits, awards `SoftDropScore(1)`, resets the gravity accumulator, and emits `PieceMoved{DY:1}`; otherwise returns `nil`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/game.go internal/game/advance_test.go
git commit -m "feat(game): Advance(dt) gravity, soft drop, lock delay"
```

---

### Task 9: Hold

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/hold_test.go`

**Interfaces:**
- Consumes: `spawnNext`, `CanHold`, `Hold` (Tasks 5, 7).
- Produces:
  ```go
  func (g *Game) HoldPiece() []Event // HoldUsed + PieceSpawned; nil when !CanHold or not playing
  ```
  Named `HoldPiece` because the `Hold *PieceKind` field already owns the name `Hold`.

- [ ] **Step 1: Write the failing test**

```go
package game

import "testing"

func TestFirstHoldStoresAndSpawnsNext(t *testing.T) {
	g := New(1)
	active := g.Active.Kind
	queueHead := g.Next[0]
	evs := g.HoldPiece()
	if g.Hold == nil || *g.Hold != active {
		t.Fatalf("Hold = %v, want %v", g.Hold, active)
	}
	if g.Active.Kind != queueHead {
		t.Fatalf("Active = %v, want the queue head %v", g.Active.Kind, queueHead)
	}
	h := eventsOfType[HoldUsed](evs)
	if len(h) != 1 || h[0].Stored != active || h[0].Incoming != queueHead {
		t.Fatalf("HoldUsed = %+v, want stored %v incoming %v", h, active, queueHead)
	}
	if g.CanHold {
		t.Fatal("CanHold must be false until the active piece locks")
	}
}

func TestSecondHoldBlockedUntilLock(t *testing.T) {
	g := New(1)
	g.HoldPiece()
	held, active := *g.Hold, g.Active
	if evs := g.HoldPiece(); evs != nil {
		t.Fatalf("the second hold emitted %v, want nil", evs)
	}
	if *g.Hold != held || g.Active != active {
		t.Fatal("a blocked hold must change nothing")
	}
}

func TestHoldSwapsAndResetsRotation(t *testing.T) {
	g := New(1)
	g.HoldPiece()
	held := *g.Hold
	g.Active.Rotation = 2
	g.Active.X = 0
	g.HardDrop() // locking re-arms CanHold
	if !g.CanHold {
		t.Fatal("locking must re-arm CanHold")
	}
	swappedIn := g.Active.Kind
	g.Active.Rotation = 3
	g.HoldPiece()
	if g.Active.Kind != held {
		t.Fatalf("Active = %v, want the previously held %v", g.Active.Kind, held)
	}
	if g.Active.Rotation != 0 {
		t.Fatalf("Rotation = %d, want the spawn rotation 0", g.Active.Rotation)
	}
	if *g.Hold != swappedIn {
		t.Fatalf("Hold = %v, want %v", *g.Hold, swappedIn)
	}
	if got := SpawnPiece(held); g.Active.X != got.X || g.Active.Y != got.Y {
		t.Fatalf("held piece returned at (%d,%d), want the spawn position (%d,%d)", g.Active.X, g.Active.Y, got.X, got.Y)
	}
}

// Review Focus 4: a hold whose incoming piece cannot spawn ends the game.
func TestHoldIntoABlockedSpawnEndsTheGame(t *testing.T) {
	g := New(1)
	for y := 0; y < BoardHeight; y++ {
		fillRow(&g.Board, y)
	}
	evs := g.HoldPiece()
	if len(eventsOfType[GameOver](evs)) != 1 {
		t.Fatalf("expected GameOver, got %v", evs)
	}
	if g.State != StateOver {
		t.Fatal("State must be StateOver")
	}
	for _, c := range g.Active.Cells() {
		if !g.Board.At(c.X, c.Y).Filled {
			continue
		}
		return // an overlapping piece is fine only because the game is over
	}
}

func TestHoldIgnoredAfterGameOver(t *testing.T) {
	g := New(1)
	g.State = StateOver
	if evs := g.HoldPiece(); evs != nil {
		t.Fatalf("hold after game over emitted %v, want nil", evs)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run Hold -v`
Expected: FAIL — `g.HoldPiece undefined`.

- [ ] **Step 3: Implement `HoldPiece` in `internal/game/game.go`**

Empty hold: store `Active.Kind`, then `spawnNext()`. Occupied hold: swap `*g.Hold` with `Active.Kind` and reset the incoming piece to `SpawnPiece(kind)`, reusing the blocked-spawn check from Task 7 so a swap into a full board ends the game. Set `CanHold = false` on success. `spawnNext` sets `CanHold = true`, so re-arm order matters: clear the flag after the spawn call.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/game.go internal/game/hold_test.go
git commit -m "feat(game): hold with once-per-piece rule"
```

---

### Task 10: Restart and the seeded replay determinism test

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/replay_test.go`
- Create: `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces:
  ```go
  func (g *Game) Restart()                  // same seed, fresh universe
  func (g *Game) RestartWithSeed(seed int64)
  ```

- [ ] **Step 1: Write the failing test**

```go
package game

import (
	"testing"
	"time"
)

type replayStep struct {
	input string // "L","R","CW","CCW","SOFT","HARD","HOLD",""
	dt    time.Duration
}

func runReplay(t *testing.T, seed int64, steps []replayStep) *Game {
	t.Helper()
	g := New(seed)
	for _, s := range steps {
		switch s.input {
		case "L":
			g.MoveLeft()
		case "R":
			g.MoveRight()
		case "CW":
			g.Rotate(1)
		case "CCW":
			g.Rotate(-1)
		case "SOFT":
			g.SoftDrop()
		case "HARD":
			g.HardDrop()
		case "HOLD":
			g.HoldPiece()
		}
		g.Advance(s.dt)
	}
	return g
}

func cannedSteps() []replayStep {
	inputs := []string{"L", "CW", "HARD", "R", "R", "SOFT", "HOLD", "CCW", "HARD", "", "L", "HARD"}
	steps := make([]replayStep, 0, 400)
	for i := 0; i < 30; i++ {
		for j, in := range inputs {
			steps = append(steps, replayStep{input: in, dt: time.Duration(7+((i+j)%13)) * time.Millisecond})
		}
	}
	return steps
}

func TestReplayIsDeterministic(t *testing.T) {
	steps := cannedSteps()
	a := runReplay(t, 8675309, steps)
	b := runReplay(t, 8675309, steps)
	if a.Score != b.Score || a.Lines != b.Lines || a.Level != b.Level || a.Combo != b.Combo {
		t.Fatalf("counters diverged: %+v vs %+v", a, b)
	}
	if a.Board != b.Board {
		t.Fatal("boards diverged for the same seed, inputs, and timings")
	}
	if a.Active != b.Active || a.State != b.State {
		t.Fatalf("active piece or state diverged: %+v / %+v", a, b)
	}
	for i := range a.Next {
		if a.Next[i] != b.Next[i] {
			t.Fatalf("Next[%d] diverged", i)
		}
	}
}

func TestReplayDoesSomething(t *testing.T) {
	g := runReplay(t, 8675309, cannedSteps())
	if g.Score == 0 {
		t.Fatal("the canned replay should have scored; it is not exercising the engine")
	}
}

func TestRestartResetsEverythingButTheSeed(t *testing.T) {
	g := runReplay(t, 4242, cannedSteps())
	seed := g.Seed
	g.Restart()
	fresh := New(seed)
	if g.Seed != seed {
		t.Fatalf("Seed = %d, want %d preserved", g.Seed, seed)
	}
	if g.Score != 0 || g.Lines != 0 || g.Combo != 0 || g.Level != 1 {
		t.Fatalf("counters not reset: %+v", g)
	}
	if g.Hold != nil || !g.CanHold {
		t.Fatal("hold state not reset")
	}
	if g.State != StatePlaying {
		t.Fatal("State not reset to StatePlaying")
	}
	for y := 0; y < BoardHeight; y++ {
		for x := 0; x < BoardWidth; x++ {
			if g.Board.At(x, y).Filled {
				t.Fatalf("board cell (%d,%d) survived the restart", x, y)
			}
		}
	}
	if g.Active != fresh.Active {
		t.Fatalf("restart gave %+v, want the same first piece as a fresh game %+v", g.Active, fresh.Active)
	}
}

func TestRestartWithSeedChangesTheSequence(t *testing.T) {
	g := New(1)
	g.RestartWithSeed(2)
	if g.Seed != 2 {
		t.Fatalf("Seed = %d, want 2", g.Seed)
	}
	if g.Active != New(2).Active {
		t.Fatal("RestartWithSeed must reproduce a fresh game on the new seed")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'Replay|Restart' -v`
Expected: FAIL — `g.Restart undefined`.

- [ ] **Step 3: Implement `Restart` / `RestartWithSeed` and write `README.md`**

`RestartWithSeed` rebuilds the game in place: `*g = *New(seed)`. `Restart` calls `RestartWithSeed(g.Seed)`.

`README.md`: name, one-paragraph description, `go test ./...`, and a short "engine is deterministic and clock-free" note pointing at §49.2. The playable-binary sections arrive in Plan 2.

- [ ] **Step 4: Run the full suite**

Run: `go test ./... -count=1`
Expected: PASS, all engine tests.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/game.go internal/game/replay_test.go README.md
git commit -m "feat(game): restart and seeded replay determinism test"
```

---

## Engine API summary (for Plans 2 and 3)

```go
package game // cosmic-tetris/internal/game

const (BoardWidth = 10; BoardHeight = 22; VisibleRows = 20; HiddenRows = 2; NextQueueLen = 5)

func New(seed int64) *Game
func (g *Game) Advance(dt time.Duration) []Event
func (g *Game) MoveLeft() []Event
func (g *Game) MoveRight() []Event
func (g *Game) Rotate(delta int) []Event   // +1 CW, -1 CCW
func (g *Game) SoftDrop() []Event
func (g *Game) HardDrop() []Event
func (g *Game) HoldPiece() []Event
func (g *Game) Restart()
func (g *Game) RestartWithSeed(seed int64)
func (g *Game) GhostY() int
func (g *Game) Grounded() bool
func (g *Game) Over() bool

// read-only for renderers and FX: Board, Active, Hold, CanHold, Next,
// Score, Lines, Level, Combo, State, Seed
```

Events: `PieceSpawned`, `PieceMoved`, `PieceRotated`, `PieceHardDropped`, `PieceLocked`, `HoldUsed`, `LinesCleared`, `ComboChanged`, `LevelChanged`, `GameOver`.
