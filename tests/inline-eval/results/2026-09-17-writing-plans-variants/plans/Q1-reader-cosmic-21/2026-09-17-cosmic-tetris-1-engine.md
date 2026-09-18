# Cosmic Tetris — Plan 1: Deterministic Game Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the headless, deterministic falling-block engine in `internal/game` — pieces, board, 7-bag, movement, wall-kick rotation, gravity, lock delay, line clearing, hold, scoring, and game over — with comprehensive unit tests and a seeded replay test, and no terminal code at all.

**Architecture:** One package, `internal/game`, with no dependencies outside the Go standard library. The package never reads a clock: the caller passes elapsed time in via `Advance(dt)` (design §49.2), and player actions come in via `Apply(Input)`. Both return a `[]Event` slice describing what happened, which later plans feed to the FX system. The package owns exactly one `*rand.Rand`, used only by the 7-bag (design §49.6).

**Tech Stack:** Go 1.26, standard library only (`math`, `math/rand/v2`, `time`, `strings`, `fmt`, `testing`). No Charm libraries in this plan.

**Spec:** `design.md` (this repo). Sections implemented here: §5 board representation, §6 pieces, §7 rotation, §11 gravity, §12 locking, §13 scoring, §34 core state, §35 determinism, §40 tests, §42 Phase 1, §49.1, §49.2, §49.6.

## Global Constraints

- Go module path: `cosmic-tetris`. Imports are `cosmic-tetris/internal/game`.
- Go version line in `go.mod`: `go 1.26`.
- Nothing under `internal/game` may call `time.Now()`, read the filesystem, print, or import any non-stdlib package. `time` is imported only for the `time.Duration` type and duration constants.
- `internal/game` must not import `internal/fx`, `internal/render`, or `internal/app`. The dependency arrow only ever points at `game`.
- Board geometry is fixed: width 10, height 22, visible rows 20, hidden spawn rows 2 (§5).
- Coordinates: `x` grows right from 0, `y` grows **down** from 0. Rows 0 and 1 are the hidden spawn rows; rows 2–21 are visible. Row 21 is the bottom.
- Gravity: `800ms * 0.86^(level-1)`, clamped to a 60ms floor (§11).
- Lock delay 500ms, max 15 lock resets (§12).
- Combo bonus is `50 × (combo - 1) × level`; the first clearing placement sets combo to 1 and earns no bonus (§49.1).
- Every exported identifier gets a doc comment. This engine is the part a reader must understand in an afternoon (§48).
- Run `gofmt -l .` before every commit; it must print nothing.

## Review Focus

These are input classes the spec implies but does not call out in §40's test list. Each has a test assigned to the task that owns the code.

1. **A single enormous `dt`** (laptop sleep, SIGSTOP, a debugger pause) reaches `Advance` as one 5-second step. The gravity loop must terminate, the piece must land rather than tunnel through the stack, and the lock sequence must still run. — Task 9.
2. **A wall kick that pushes blocks above the ceiling** (`(0,-1)` offset at spawn) produces block coordinates with `y < 0`. `Occupied` must treat above-the-ceiling as free space and `Lock` must discard those blocks rather than index a negative row. — Tasks 3 and 6.
3. **Hard drop on a piece already resting on the stack** (drop distance 0) must award 0 drop points, lock exactly once, and emit exactly one `EventPieceLocked`. — Task 10.
4. **Hold used repeatedly across many placements** must keep the next queue at exactly 5 kinds and must never hand out a piece the bag has not produced. — Task 11.
5. **A line clear that includes a hidden row** (0 or 1) must collapse correctly and leave no stale cells at the top of the board. — Task 4.

---

## File Structure

| File | Responsibility |
|---|---|
| `go.mod` | Module declaration, Go version. No requires yet. |
| `internal/game/piece.go` | `PieceKind`, the rotation offset table, `Piece`, `Blocks`, spawn construction. |
| `internal/game/board.go` | `Cell`, `Board`, bounds/occupancy/collision, locking, row completion, row clearing, drop distance, ghost. |
| `internal/game/bag.go` | The 7-bag generator. Holds no RNG of its own. |
| `internal/game/rules.go` | Rotation with the §7 wall-kick ladder. |
| `internal/game/scoring.go` | Line values, combo bonus, level progression, gravity interval, timing constants. |
| `internal/game/event.go` | `EventType`, `Event`, `String()`. |
| `internal/game/game.go` | `Game`, `Input`, `New`, `Apply`, `Advance`, `Snapshot`, and the private spawn/lock/move helpers. |
| `internal/game/*_test.go` | One test file per source file above. |
| `internal/game/testdata/replay-8675309.golden` | Recorded final state of the canned replay. |

---

### Task 1: Module bootstrap and piece geometry

**Files:**
- Create: `go.mod`
- Create: `internal/game/piece.go`
- Create: `.gitignore`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces: `PieceKind` (`KindI, KindJ, KindL, KindO, KindS, KindT, KindZ`), `KindCount = 7`, `func (PieceKind) Letter() byte`, `var Offsets [KindCount][4][4][2]int` indexed `[kind][rotation][block][0=x,1=y]`, `type Piece struct { Kind PieceKind; Rotation int; X, Y int }`, `func (Piece) Blocks() [4][2]int`, `func Spawn(k PieceKind) Piece`, `const SpawnX = 3`, `const SpawnY = 0`.

- [ ] **Step 1: Create the module and ignore file**

```bash
cd /private/tmp/claude-501/-Users-jesse-git-superpowers-superpowers/a8a313bf-7410-41ce-9036-636ccf4061d6/scratchpad/inline-eval-br/reps/wpplans-21/repo
go mod init cosmic-tetris
printf '/cosmic-tetris\n' > .gitignore
```

Confirm `go.mod` reads:

```
module cosmic-tetris

go 1.26
```

- [ ] **Step 2: Write the failing test**

Create `internal/game/piece_test.go`:

```go
package game

import "testing"

func TestLetter(t *testing.T) {
	want := "IJLOSTZ"
	for k := PieceKind(0); k < KindCount; k++ {
		if got := k.Letter(); got != want[k] {
			t.Errorf("kind %d letter = %q, want %q", k, got, want[k])
		}
	}
}

// Every rotation of every kind is four distinct cells inside a 4x4 box.
func TestOffsetsWellFormed(t *testing.T) {
	for k := PieceKind(0); k < KindCount; k++ {
		for r := 0; r < 4; r++ {
			seen := map[[2]int]bool{}
			for _, off := range Offsets[k][r] {
				if off[0] < 0 || off[0] > 3 || off[1] < 0 || off[1] > 3 {
					t.Errorf("%c rot %d: offset %v outside 4x4 box", k.Letter(), r, off)
				}
				if seen[off] {
					t.Errorf("%c rot %d: duplicate offset %v", k.Letter(), r, off)
				}
				seen[off] = true
			}
			if len(seen) != 4 {
				t.Errorf("%c rot %d: %d distinct cells, want 4", k.Letter(), r, len(seen))
			}
		}
	}
}

// O is visually identical through rotation (design section 6).
func TestOSquareIdenticalThroughRotation(t *testing.T) {
	for r := 1; r < 4; r++ {
		if Offsets[KindO][r] != Offsets[KindO][0] {
			t.Errorf("O rot %d = %v, want same as rot 0 %v", r, Offsets[KindO][r], Offsets[KindO][0])
		}
	}
}

func TestSpecificShapes(t *testing.T) {
	tests := []struct {
		kind PieceKind
		rot  int
		want [4][2]int
	}{
		{KindI, 0, [4][2]int{{0, 1}, {1, 1}, {2, 1}, {3, 1}}},
		{KindI, 1, [4][2]int{{2, 0}, {2, 1}, {2, 2}, {2, 3}}},
		{KindT, 0, [4][2]int{{1, 0}, {0, 1}, {1, 1}, {2, 1}}},
		{KindT, 2, [4][2]int{{0, 1}, {1, 1}, {2, 1}, {1, 2}}},
		{KindS, 0, [4][2]int{{1, 0}, {2, 0}, {0, 1}, {1, 1}}},
		{KindZ, 0, [4][2]int{{0, 0}, {1, 0}, {1, 1}, {2, 1}}},
		{KindJ, 0, [4][2]int{{0, 0}, {0, 1}, {1, 1}, {2, 1}}},
		{KindL, 0, [4][2]int{{2, 0}, {0, 1}, {1, 1}, {2, 1}}},
	}
	for _, tc := range tests {
		if got := Offsets[tc.kind][tc.rot]; got != tc.want {
			t.Errorf("%c rot %d = %v, want %v", tc.kind.Letter(), tc.rot, got, tc.want)
		}
	}
}

func TestBlocksTranslatesByPosition(t *testing.T) {
	p := Piece{Kind: KindT, Rotation: 0, X: 4, Y: 7}
	want := [4][2]int{{5, 7}, {4, 8}, {5, 8}, {6, 8}}
	if got := p.Blocks(); got != want {
		t.Errorf("Blocks() = %v, want %v", got, want)
	}
}

// Rotation is masked, so callers may pass any integer.
func TestBlocksNormalizesRotation(t *testing.T) {
	a := Piece{Kind: KindL, Rotation: 1, X: 0, Y: 0}
	b := Piece{Kind: KindL, Rotation: 5, X: 0, Y: 0}
	if a.Blocks() != b.Blocks() {
		t.Errorf("rotation 5 = %v, want same as rotation 1 %v", b.Blocks(), a.Blocks())
	}
}

func TestSpawnPosition(t *testing.T) {
	p := Spawn(KindI)
	if p.Kind != KindI || p.Rotation != 0 || p.X != SpawnX || p.Y != SpawnY {
		t.Errorf("Spawn(I) = %+v, want {I 0 %d %d}", p, SpawnX, SpawnY)
	}
	// Spawned pieces start inside the hidden rows.
	for _, b := range p.Blocks() {
		if b[1] >= HiddenRows {
			t.Errorf("spawned I block %v is already visible, want y < %d", b, HiddenRows)
		}
	}
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `go test ./internal/game/`
Expected: FAIL — `undefined: PieceKind`, `undefined: Offsets`, `undefined: HiddenRows`.

- [ ] **Step 4: Write the implementation**

Create `internal/game/piece.go`:

```go
// Package game implements the Cosmic Tetris rules engine.
//
// The package is deliberately headless and deterministic: it never reads a
// clock, never touches the filesystem, and never renders anything. Elapsed
// time arrives through Game.Advance and player actions through Game.Apply,
// both of which report what happened as a slice of Event values.
package game

// PieceKind identifies one of the seven tetromino families.
type PieceKind uint8

// The seven tetromino families.
const (
	KindI PieceKind = iota
	KindJ
	KindL
	KindO
	KindS
	KindT
	KindZ
)

// KindCount is the number of tetromino families.
const KindCount = 7

// Letter returns the conventional single-letter name of the kind.
func (k PieceKind) Letter() byte { return "IJLOSTZ"[k] }

// Spawn coordinates. A newly spawned piece sits in the hidden rows above the
// visible board, horizontally centred for both 3-wide and 4-wide shapes.
const (
	SpawnX = 3
	SpawnY = 0
)

// Offsets holds the block layout of every kind at every rotation as four
// (x, y) offsets inside a 4x4 box. Indexed [kind][rotation][block][0=x, 1=y].
// y grows downward, so offset {1, 0} is above offset {1, 1}.
var Offsets = [KindCount][4][4][2]int{
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
		{{1, 0}, {2, 0}, {1, 1}, {2, 1}},
		{{1, 0}, {2, 0}, {1, 1}, {2, 1}},
		{{1, 0}, {2, 0}, {1, 1}, {2, 1}},
		{{1, 0}, {2, 0}, {1, 1}, {2, 1}},
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

// Piece is a tetromino at a position and rotation on the board.
type Piece struct {
	Kind     PieceKind
	Rotation int
	X        int
	Y        int
}

// Blocks returns the four absolute board coordinates the piece occupies.
// Rotation is normalized, so any integer rotation is valid.
func (p Piece) Blocks() [4][2]int {
	offs := Offsets[p.Kind][p.Rotation&3]
	var out [4][2]int
	for i, off := range offs {
		out[i] = [2]int{p.X + off[0], p.Y + off[1]}
	}
	return out
}

// Spawn returns a piece of the given kind at the spawn position and rotation.
func Spawn(k PieceKind) Piece {
	return Piece{Kind: k, Rotation: 0, X: SpawnX, Y: SpawnY}
}
```

`HiddenRows` is defined in Task 2; the piece test will not compile until then. To keep this task independently green, add the board geometry constants now, at the top of a new `internal/game/board.go`:

```go
package game

// Board geometry (design section 5). y grows downward: rows 0 and 1 are the
// hidden spawn rows, rows 2 through 21 are the visible playfield.
const (
	Width         = 10
	Height        = 22
	VisibleHeight = 20
	HiddenRows    = Height - VisibleHeight
)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/game/ -v -run 'TestLetter|TestOffsets|TestOSquare|TestSpecificShapes|TestBlocks|TestSpawnPosition'`
Expected: PASS, 7 tests.

- [ ] **Step 6: Commit**

```bash
gofmt -l .
git add go.mod .gitignore internal/game/piece.go internal/game/board.go internal/game/piece_test.go
git commit -m "feat(game): tetromino kinds, rotation table, and board geometry"
```

---

### Task 2: Board cells, bounds, and collision

**Files:**
- Modify: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Piece`, `Piece.Blocks`, `PieceKind` from Task 1.
- Produces: `type Cell uint8`, `const EmptyCell Cell = 0`, `func FilledCell(k PieceKind) Cell`, `func (Cell) Filled() bool`, `func (Cell) Kind() PieceKind`, `type Board struct { Cells [Height][Width]Cell }`, `func (*Board) At(x, y int) Cell`, `func (*Board) Set(x, y int, c Cell)`, `func (*Board) Occupied(x, y int) bool`, `func (*Board) Collides(p Piece) bool`, `func (*Board) Lock(p Piece)`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/board_test.go`:

```go
package game

import "testing"

// fill marks a run of cells in one row as occupied by the given kind.
func fill(b *Board, y int, xs ...int) {
	for _, x := range xs {
		b.Set(x, y, FilledCell(KindT))
	}
}

// fillRow marks an entire row as occupied except for the listed gaps.
func fillRow(b *Board, y int, gaps ...int) {
	skip := map[int]bool{}
	for _, g := range gaps {
		skip[g] = true
	}
	for x := 0; x < Width; x++ {
		if !skip[x] {
			b.Set(x, y, FilledCell(KindI))
		}
	}
}

func TestCellRoundTrip(t *testing.T) {
	if EmptyCell.Filled() {
		t.Error("EmptyCell.Filled() = true, want false")
	}
	for k := PieceKind(0); k < KindCount; k++ {
		c := FilledCell(k)
		if !c.Filled() {
			t.Errorf("FilledCell(%c).Filled() = false, want true", k.Letter())
		}
		if got := c.Kind(); got != k {
			t.Errorf("FilledCell(%c).Kind() = %c, want %c", k.Letter(), got.Letter(), k.Letter())
		}
	}
}

func TestOccupiedWallsAndFloor(t *testing.T) {
	var b Board
	tests := []struct {
		name string
		x, y int
		want bool
	}{
		{"left wall", -1, 5, true},
		{"right wall", Width, 5, true},
		{"far right", Width + 3, 5, true},
		{"floor", 0, Height, true},
		{"below floor", 0, Height + 4, true},
		{"empty interior", 5, 5, false},
		{"above ceiling is free", 5, -1, false},
		{"far above ceiling is free", 5, -9, false},
		{"above ceiling but out of column", -1, -1, true},
	}
	for _, tc := range tests {
		if got := b.Occupied(tc.x, tc.y); got != tc.want {
			t.Errorf("%s: Occupied(%d,%d) = %v, want %v", tc.name, tc.x, tc.y, got, tc.want)
		}
	}
}

func TestOccupiedLockedCell(t *testing.T) {
	var b Board
	b.Set(4, 9, FilledCell(KindZ))
	if !b.Occupied(4, 9) {
		t.Error("locked cell reported free")
	}
	if b.Occupied(4, 8) {
		t.Error("cell above locked cell reported occupied")
	}
}

func TestAtOutOfBoundsIsEmpty(t *testing.T) {
	var b Board
	for _, c := range [][2]int{{-1, 0}, {Width, 0}, {0, -1}, {0, Height}} {
		if got := b.At(c[0], c[1]); got != EmptyCell {
			t.Errorf("At(%d,%d) = %v, want EmptyCell", c[0], c[1], got)
		}
	}
}

func TestSetOutOfBoundsIsIgnored(t *testing.T) {
	var b Board
	b.Set(-1, 0, FilledCell(KindI))
	b.Set(0, -1, FilledCell(KindI))
	b.Set(Width, 0, FilledCell(KindI))
	b.Set(0, Height, FilledCell(KindI))
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if b.Cells[y][x].Filled() {
				t.Fatalf("out-of-bounds Set wrote to (%d,%d)", x, y)
			}
		}
	}
}

func TestCollidesWalls(t *testing.T) {
	var b Board
	// T rot 0 spans offsets x 0..2.
	if b.Collides(Piece{Kind: KindT, X: 0, Y: 5}) {
		t.Error("T at x=0 should fit")
	}
	if !b.Collides(Piece{Kind: KindT, X: -1, Y: 5}) {
		t.Error("T at x=-1 should collide with the left wall")
	}
	if b.Collides(Piece{Kind: KindT, X: Width - 3, Y: 5}) {
		t.Errorf("T at x=%d should fit", Width-3)
	}
	if !b.Collides(Piece{Kind: KindT, X: Width - 2, Y: 5}) {
		t.Errorf("T at x=%d should collide with the right wall", Width-2)
	}
}

func TestCollidesFloor(t *testing.T) {
	var b Board
	// T rot 0 occupies relative rows 0 and 1, so y = Height-2 is the last fit.
	if b.Collides(Piece{Kind: KindT, X: 4, Y: Height - 2}) {
		t.Error("T resting on the floor should not collide")
	}
	if !b.Collides(Piece{Kind: KindT, X: 4, Y: Height - 1}) {
		t.Error("T past the floor should collide")
	}
}

func TestCollidesLockedCells(t *testing.T) {
	var b Board
	fill(&b, 10, 4)
	// T rot 0 at (3,9) covers (4,9),(3,10),(4,10),(5,10) -> hits (4,10).
	if !b.Collides(Piece{Kind: KindT, X: 3, Y: 9}) {
		t.Error("piece overlapping a locked cell should collide")
	}
	if b.Collides(Piece{Kind: KindT, X: 3, Y: 8}) {
		t.Error("piece one row above a locked cell should not collide")
	}
}

// A wall kick may lift a piece above the ceiling; that must not collide.
func TestCollidesAboveCeiling(t *testing.T) {
	var b Board
	if b.Collides(Piece{Kind: KindI, X: 3, Y: -1}) {
		t.Error("piece partly above the ceiling should not collide")
	}
}

func TestLockWritesKind(t *testing.T) {
	var b Board
	b.Lock(Piece{Kind: KindS, Rotation: 0, X: 4, Y: 10})
	for _, blk := range (Piece{Kind: KindS, Rotation: 0, X: 4, Y: 10}).Blocks() {
		c := b.At(blk[0], blk[1])
		if !c.Filled() || c.Kind() != KindS {
			t.Errorf("cell %v = %v, want filled S", blk, c)
		}
	}
}

// Lock must silently drop blocks that sit above the ceiling.
func TestLockClipsAboveCeiling(t *testing.T) {
	var b Board
	p := Piece{Kind: KindJ, Rotation: 1, X: 3, Y: -1}
	b.Lock(p)
	filled := 0
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if b.Cells[y][x].Filled() {
				filled++
			}
		}
	}
	if filled != 3 {
		t.Errorf("locked %d cells, want 3 (one block was above the ceiling)", filled)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestCell|TestOccupied|TestAt|TestSet|TestCollides|TestLock'`
Expected: FAIL — `undefined: Cell`, `undefined: Board`.

- [ ] **Step 3: Write the implementation**

Append to `internal/game/board.go`:

```go
// Cell is one board square. The zero value is empty; a filled cell stores its
// tetromino kind so the renderer can colour locked blocks by origin.
type Cell uint8

// EmptyCell is an unoccupied board square.
const EmptyCell Cell = 0

// FilledCell returns the cell value for a square occupied by kind k.
func FilledCell(k PieceKind) Cell { return Cell(k) + 1 }

// Filled reports whether the cell is occupied.
func (c Cell) Filled() bool { return c != EmptyCell }

// Kind returns the tetromino kind that filled the cell. Only meaningful when
// Filled reports true.
func (c Cell) Kind() PieceKind { return PieceKind(c - 1) }

// Board is the logical playfield. Row 0 is the top hidden row.
type Board struct {
	Cells [Height][Width]Cell
}

// InBounds reports whether (x, y) addresses a real board square.
func (b *Board) InBounds(x, y int) bool {
	return x >= 0 && x < Width && y >= 0 && y < Height
}

// At returns the cell at (x, y), or EmptyCell if out of bounds.
func (b *Board) At(x, y int) Cell {
	if !b.InBounds(x, y) {
		return EmptyCell
	}
	return b.Cells[y][x]
}

// Set writes a cell. Out-of-bounds writes are ignored.
func (b *Board) Set(x, y int, c Cell) {
	if !b.InBounds(x, y) {
		return
	}
	b.Cells[y][x] = c
}

// Occupied reports whether (x, y) blocks a piece. The side walls and the floor
// are occupied. The space above the ceiling (y < 0) is free, so a wall kick
// that nudges a piece upward can succeed.
func (b *Board) Occupied(x, y int) bool {
	if x < 0 || x >= Width || y >= Height {
		return true
	}
	if y < 0 {
		return false
	}
	return b.Cells[y][x].Filled()
}

// Collides reports whether any of the piece's blocks is obstructed.
func (b *Board) Collides(p Piece) bool {
	for _, blk := range p.Blocks() {
		if b.Occupied(blk[0], blk[1]) {
			return true
		}
	}
	return false
}

// Lock commits the piece's blocks to the board. Blocks above the ceiling are
// discarded.
func (b *Board) Lock(p Piece) {
	c := FilledCell(p.Kind)
	for _, blk := range p.Blocks() {
		b.Set(blk[0], blk[1], c)
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/`
Expected: PASS (Task 1 tests still green).

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board cells, bounds, and collision"
```

---

### Task 3: Row completion, clearing, and collapse

**Files:**
- Modify: `internal/game/board.go`
- Modify: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Board`, `Cell`, `FilledCell`, the `fill`/`fillRow` test helpers from Task 2.
- Produces: `func (*Board) CompleteRows() []int` (ascending row indices, nil when none), `func (*Board) ClearRows(rows []int)`, `func (*Board) DropDistance(p Piece) int`, `func (*Board) Ghost(p Piece) Piece`, `func (*Board) TopRow() int`.

- [ ] **Step 1: Write the failing test**

Append to `internal/game/board_test.go`:

```go
import "slices" // add to the existing import block alongside "testing"

func TestCompleteRowsNone(t *testing.T) {
	var b Board
	fillRow(&b, 21, 3)
	if got := b.CompleteRows(); len(got) != 0 {
		t.Errorf("CompleteRows() = %v, want empty", got)
	}
}

func TestCompleteRowsAscending(t *testing.T) {
	var b Board
	fillRow(&b, 21)
	fillRow(&b, 19)
	fillRow(&b, 20, 7)
	got := b.CompleteRows()
	want := []int{19, 21}
	if !slices.Equal(got, want) {
		t.Errorf("CompleteRows() = %v, want %v", got, want)
	}
}

func TestClearRowsCollapsesStack(t *testing.T) {
	var b Board
	fillRow(&b, 21)             // complete, will clear
	b.Set(0, 20, FilledCell(KindS)) // lone survivor above it
	b.ClearRows([]int{21})
	if b.At(0, 21) != FilledCell(KindS) {
		t.Errorf("survivor should have fallen to row 21, got %v", b.At(0, 21))
	}
	if b.At(0, 20).Filled() {
		t.Error("row 20 should be empty after collapse")
	}
	for x := 1; x < Width; x++ {
		if b.At(x, 21).Filled() {
			t.Errorf("row 21 col %d should be empty after clear", x)
		}
	}
}

func TestClearRowsMultipleNonAdjacent(t *testing.T) {
	var b Board
	fillRow(&b, 21)
	b.Set(2, 20, FilledCell(KindT))
	fillRow(&b, 19)
	b.Set(5, 18, FilledCell(KindZ))
	b.ClearRows([]int{19, 21})
	// Two rows vanished: the T falls one row (only row 21 was below it),
	// the Z falls two rows.
	if b.At(2, 21) != FilledCell(KindT) {
		t.Errorf("T at (2,21) = %v, want filled T", b.At(2, 21))
	}
	if b.At(5, 20) != FilledCell(KindZ) {
		t.Errorf("Z at (5,20) = %v, want filled Z", b.At(5, 20))
	}
	count := 0
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if b.Cells[y][x].Filled() {
				count++
			}
		}
	}
	if count != 2 {
		t.Errorf("%d cells remain, want 2", count)
	}
}

func TestClearRowsFourLines(t *testing.T) {
	var b Board
	for y := 18; y <= 21; y++ {
		fillRow(&b, y)
	}
	rows := b.CompleteRows()
	if !slices.Equal(rows, []int{18, 19, 20, 21}) {
		t.Fatalf("CompleteRows() = %v, want [18 19 20 21]", rows)
	}
	b.ClearRows(rows)
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if b.Cells[y][x].Filled() {
				t.Fatalf("board not empty after four-line clear: (%d,%d)", x, y)
			}
		}
	}
}

// Review Focus 5: a clear that includes a hidden row must collapse cleanly and
// leave no stale cells at the top.
func TestClearRowsIncludingHiddenRow(t *testing.T) {
	var b Board
	fillRow(&b, 0) // hidden row, complete
	fillRow(&b, 1, 4)
	b.ClearRows([]int{0})
	if b.At(4, 1).Filled() {
		t.Error("gap column should still be empty after collapse")
	}
	for x := 0; x < Width; x++ {
		if x == 4 {
			continue
		}
		if !b.At(x, 1).Filled() {
			t.Errorf("row 1 col %d should still be filled", x)
		}
	}
	for x := 0; x < Width; x++ {
		if b.At(x, 0).Filled() {
			t.Errorf("row 0 col %d should be empty after collapse", x)
		}
	}
}

func TestClearRowsEmptyInputIsNoop(t *testing.T) {
	var b Board
	fillRow(&b, 21, 3)
	before := b.Cells
	b.ClearRows(nil)
	if b.Cells != before {
		t.Error("ClearRows(nil) modified the board")
	}
}

func TestDropDistanceEmptyBoard(t *testing.T) {
	var b Board
	// T rot 0 at Y=0 occupies rows 0..1; it can fall until row 1 sits at 21.
	p := Piece{Kind: KindT, X: 4, Y: 0}
	if got, want := b.DropDistance(p), Height-2; got != want {
		t.Errorf("DropDistance = %d, want %d", got, want)
	}
}

func TestDropDistanceOntoStack(t *testing.T) {
	var b Board
	fillRow(&b, 21)
	p := Piece{Kind: KindO, X: 4, Y: 0} // O occupies relative rows 0..1
	if got, want := b.DropDistance(p), Height-3; got != want {
		t.Errorf("DropDistance = %d, want %d", got, want)
	}
}

func TestDropDistanceZeroWhenResting(t *testing.T) {
	var b Board
	fillRow(&b, 21)
	p := Piece{Kind: KindO, X: 4, Y: Height - 3}
	if got := b.DropDistance(p); got != 0 {
		t.Errorf("DropDistance = %d, want 0", got)
	}
}

func TestGhostIsPieceAtLanding(t *testing.T) {
	var b Board
	fillRow(&b, 21)
	p := Piece{Kind: KindL, Rotation: 2, X: 2, Y: 3}
	g := b.Ghost(p)
	if g.Kind != p.Kind || g.Rotation != p.Rotation || g.X != p.X {
		t.Errorf("Ghost changed shape or column: %+v vs %+v", g, p)
	}
	if want := p.Y + b.DropDistance(p); g.Y != want {
		t.Errorf("Ghost Y = %d, want %d", g.Y, want)
	}
	if b.Collides(g) {
		t.Error("ghost position collides")
	}
	if !b.Collides(Piece{Kind: g.Kind, Rotation: g.Rotation, X: g.X, Y: g.Y + 1}) {
		t.Error("ghost is not resting: one row lower does not collide")
	}
}

func TestTopRow(t *testing.T) {
	var b Board
	if got := b.TopRow(); got != Height {
		t.Errorf("empty board TopRow = %d, want %d", got, Height)
	}
	b.Set(7, 14, FilledCell(KindI))
	b.Set(2, 19, FilledCell(KindI))
	if got := b.TopRow(); got != 14 {
		t.Errorf("TopRow = %d, want 14", got)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestCompleteRows|TestClearRows|TestDropDistance|TestGhost|TestTopRow'`
Expected: FAIL — `b.CompleteRows undefined`.

- [ ] **Step 3: Write the implementation**

Append to `internal/game/board.go`:

```go
// CompleteRows returns the indices of every fully occupied row, ascending.
// It returns nil when no row is complete.
func (b *Board) CompleteRows() []int {
	var rows []int
	for y := 0; y < Height; y++ {
		full := true
		for x := 0; x < Width; x++ {
			if !b.Cells[y][x].Filled() {
				full = false
				break
			}
		}
		if full {
			rows = append(rows, y)
		}
	}
	return rows
}

// ClearRows removes the given rows and collapses everything above them
// downward. Row indices may arrive in any order; out-of-range indices are
// ignored.
func (b *Board) ClearRows(rows []int) {
	if len(rows) == 0 {
		return
	}
	var drop [Height]bool
	for _, r := range rows {
		if r >= 0 && r < Height {
			drop[r] = true
		}
	}
	var out [Height][Width]Cell
	dst := Height - 1
	for src := Height - 1; src >= 0; src-- {
		if drop[src] {
			continue
		}
		out[dst] = b.Cells[src]
		dst--
	}
	b.Cells = out
}

// DropDistance returns how many rows the piece can descend before colliding.
// It is 0 when the piece is already resting.
func (b *Board) DropDistance(p Piece) int {
	d := 0
	for {
		next := p
		next.Y = p.Y + d + 1
		if b.Collides(next) {
			return d
		}
		d++
	}
}

// Ghost returns the piece translated to its landing position (design 10).
func (b *Board) Ghost(p Piece) Piece {
	p.Y += b.DropDistance(p)
	return p
}

// TopRow returns the index of the highest occupied row, or Height when the
// board is empty. It is how the HUD and the game-over collapse find the stack.
func (b *Board) TopRow() int {
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if b.Cells[y][x].Filled() {
				return y
			}
		}
	}
	return Height
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): row completion, clearing, collapse, and ghost landing"
```

---

### Task 4: The 7-bag

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `KindCount`.
- Produces: `type Bag struct { ... }`, `func (*Bag) Next(rng *rand.Rand) PieceKind`, `func (*Bag) Remaining() int`, `func NewRNG(seed int64) *rand.Rand`.

Design §49.6 puts RNG ownership in `Game`, so `Bag` takes the generator as an argument and holds none of its own.

- [ ] **Step 1: Write the failing test**

Create `internal/game/bag_test.go`:

```go
package game

import (
	"testing"
)

func TestEveryBagHoldsAllSevenKindsOnce(t *testing.T) {
	rng := NewRNG(42)
	var bag Bag
	for round := 0; round < 20; round++ {
		var seen [KindCount]int
		for i := 0; i < KindCount; i++ {
			seen[bag.Next(rng)]++
		}
		for k := PieceKind(0); k < KindCount; k++ {
			if seen[k] != 1 {
				t.Fatalf("round %d: kind %c appeared %d times, want 1", round, k.Letter(), seen[k])
			}
		}
	}
}

func TestBagSeededGenerationIsReproducible(t *testing.T) {
	draw := func(seed int64, n int) []PieceKind {
		rng := NewRNG(seed)
		var bag Bag
		out := make([]PieceKind, n)
		for i := range out {
			out[i] = bag.Next(rng)
		}
		return out
	}
	a := draw(8675309, 40)
	b := draw(8675309, 40)
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("draw %d differs: %c vs %c", i, a[i].Letter(), b[i].Letter())
		}
	}
	c := draw(1234, 40)
	same := true
	for i := range a {
		if a[i] != c[i] {
			same = false
			break
		}
	}
	if same {
		t.Error("different seeds produced identical piece order")
	}
}

func TestBagShuffles(t *testing.T) {
	// Across many bags at least one must not be in ascending kind order.
	rng := NewRNG(7)
	var bag Bag
	shuffledSomewhere := false
	for round := 0; round < 10; round++ {
		ascending := true
		for i := 0; i < KindCount; i++ {
			if bag.Next(rng) != PieceKind(i) {
				ascending = false
			}
		}
		if !ascending {
			shuffledSomewhere = true
		}
	}
	if !shuffledSomewhere {
		t.Error("bag never shuffled across 10 refills")
	}
}

func TestBagRemaining(t *testing.T) {
	rng := NewRNG(3)
	var bag Bag
	if got := bag.Remaining(); got != 0 {
		t.Errorf("fresh Bag Remaining = %d, want 0", got)
	}
	bag.Next(rng)
	if got := bag.Remaining(); got != KindCount-1 {
		t.Errorf("after one draw Remaining = %d, want %d", got, KindCount-1)
	}
	for i := 0; i < KindCount-1; i++ {
		bag.Next(rng)
	}
	if got := bag.Remaining(); got != 0 {
		t.Errorf("after a full bag Remaining = %d, want 0", got)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run TestBag`
Expected: FAIL — `undefined: NewRNG`, `undefined: Bag`.

- [ ] **Step 3: Write the implementation**

Create `internal/game/bag.go`:

```go
package game

import "math/rand/v2"

// NewRNG returns the deterministic generator used for a given seed. The same
// seed always produces the same sequence, which is what makes design section 35
// testable. Game owns one of these for the piece bag; fx.World owns a separate,
// unrelated generator so particle randomness can never shift piece order.
func NewRNG(seed int64) *rand.Rand {
	return rand.New(rand.NewPCG(uint64(seed), uint64(seed)^0x9E3779B97F4A7C15))
}

// Bag is a seven-bag piece generator (design section 6): fill a bag with one
// of every kind, shuffle it, hand pieces out until it is empty, refill.
//
// Bag does not own a generator. Callers pass Game's generator in, which keeps
// RNG ownership in one place (design section 49.6).
type Bag struct {
	queue []PieceKind
}

// Remaining reports how many pieces are left in the current bag.
func (b *Bag) Remaining() int { return len(b.queue) }

// Next returns the next kind, refilling and reshuffling when the bag empties.
func (b *Bag) Next(rng *rand.Rand) PieceKind {
	if len(b.queue) == 0 {
		b.refill(rng)
	}
	k := b.queue[0]
	b.queue = b.queue[1:]
	return k
}

func (b *Bag) refill(rng *rand.Rand) {
	b.queue = b.queue[:0]
	for k := PieceKind(0); k < KindCount; k++ {
		b.queue = append(b.queue, k)
	}
	rng.Shuffle(len(b.queue), func(i, j int) {
		b.queue[i], b.queue[j] = b.queue[j], b.queue[i]
	})
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v -run TestBag`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded seven-bag piece generator"
```

---

### Task 5: Rotation with wall kicks

**Files:**
- Create: `internal/game/rules.go`
- Test: `internal/game/rules_test.go`

**Interfaces:**
- Consumes: `Board`, `Piece`, `Offsets`.
- Produces: `var KickOffsets [8][2]int`, `func (*Board) TryRotate(p Piece, dir int) (Piece, bool)`.

`dir` is `+1` for clockwise and `-1` for counter-clockwise. Design §7 fixes the kick ladder and says "accept the first valid position".

- [ ] **Step 1: Write the failing test**

Create `internal/game/rules_test.go`:

```go
package game

import "testing"

func TestKickOffsetsMatchSpecOrder(t *testing.T) {
	want := [8][2]int{
		{0, 0}, {-1, 0}, {1, 0}, {-2, 0}, {2, 0}, {0, -1}, {-1, -1}, {1, -1},
	}
	if KickOffsets != want {
		t.Errorf("KickOffsets = %v, want %v", KickOffsets, want)
	}
}

func TestRotateClockwiseInOpenSpace(t *testing.T) {
	var b Board
	p := Piece{Kind: KindT, Rotation: 0, X: 4, Y: 10}
	got, ok := b.TryRotate(p, 1)
	if !ok {
		t.Fatal("rotation in open space failed")
	}
	if got.Rotation != 1 || got.X != 4 || got.Y != 10 {
		t.Errorf("rotated to %+v, want rotation 1 at (4,10)", got)
	}
}

func TestRotateCounterClockwiseWraps(t *testing.T) {
	var b Board
	p := Piece{Kind: KindT, Rotation: 0, X: 4, Y: 10}
	got, ok := b.TryRotate(p, -1)
	if !ok {
		t.Fatal("counter-clockwise rotation failed")
	}
	if got.Rotation != 3 {
		t.Errorf("rotation = %d, want 3", got.Rotation)
	}
}

func TestEveryRotationSucceedsInOpenSpace(t *testing.T) {
	var b Board
	for k := PieceKind(0); k < KindCount; k++ {
		for r := 0; r < 4; r++ {
			p := Piece{Kind: k, Rotation: r, X: 3, Y: 10}
			for _, dir := range []int{1, -1} {
				got, ok := b.TryRotate(p, dir)
				if !ok {
					t.Errorf("%c rot %d dir %d failed in open space", k.Letter(), r, dir)
					continue
				}
				want := (r + dir + 4) % 4
				if got.Rotation != want {
					t.Errorf("%c rot %d dir %d -> rotation %d, want %d", k.Letter(), r, dir, got.Rotation, want)
				}
			}
		}
	}
}

func TestRotateKicksOffLeftWall(t *testing.T) {
	var b Board
	// I rot 1 is a vertical bar in relative column 2. At X=-2 it sits in
	// board column 0. Rotating to rot 2 needs columns -2..1, so the piece must
	// be kicked right.
	p := Piece{Kind: KindI, Rotation: 1, X: -2, Y: 8}
	if b.Collides(p) {
		t.Fatal("test setup: starting position collides")
	}
	got, ok := b.TryRotate(p, 1)
	if !ok {
		t.Fatal("rotation against the left wall failed, want a kick")
	}
	if got.X <= p.X {
		t.Errorf("kicked to X=%d, want a rightward kick from X=%d", got.X, p.X)
	}
	if b.Collides(got) {
		t.Errorf("kicked position %+v collides", got)
	}
}

func TestRotateKicksOffRightWall(t *testing.T) {
	var b Board
	p := Piece{Kind: KindI, Rotation: 1, X: Width - 3, Y: 8}
	if b.Collides(p) {
		t.Fatal("test setup: starting position collides")
	}
	got, ok := b.TryRotate(p, 1)
	if !ok {
		t.Fatal("rotation against the right wall failed, want a kick")
	}
	if b.Collides(got) {
		t.Errorf("kicked position %+v collides", got)
	}
}

func TestRotatePrefersEarlierKickOffsets(t *testing.T) {
	var b Board
	// Wall off column 3 so the in-place rotation fails but the (-1,0) kick
	// works; the result must be the (-1,0) candidate, not a later one.
	for y := 0; y < Height; y++ {
		b.Set(3, y, FilledCell(KindI))
	}
	p := Piece{Kind: KindT, Rotation: 1, X: 3, Y: 10} // occupies column 4 and 5
	if b.Collides(p) {
		t.Fatal("test setup: starting position collides")
	}
	got, ok := b.TryRotate(p, 1)
	if !ok {
		t.Fatal("rotation failed, want the (-1,0) or later kick to succeed")
	}
	if got.X != p.X {
		// Rotation 2 of T needs columns 3..5, blocked, so it must shift.
		if got.X != p.X+1 {
			t.Errorf("kicked to X=%d, want %d (first viable candidate)", got.X, p.X+1)
		}
	}
	if b.Collides(got) {
		t.Errorf("kicked position %+v collides", got)
	}
}

func TestRotateFailsWhenFullyBoxedIn(t *testing.T) {
	var b Board
	// Fill everything except a 2x2 pocket at columns 4..5, rows 20..21, and
	// put an O in it. O rotation never changes shape, so use a T instead:
	// fill the whole board, then carve exactly the cells the T occupies.
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			b.Set(x, y, FilledCell(KindI))
		}
	}
	p := Piece{Kind: KindT, Rotation: 0, X: 4, Y: 18}
	for _, blk := range p.Blocks() {
		b.Set(blk[0], blk[1], EmptyCell)
	}
	if b.Collides(p) {
		t.Fatal("test setup: carved position collides")
	}
	if got, ok := b.TryRotate(p, 1); ok {
		t.Errorf("boxed-in rotation succeeded as %+v, want failure", got)
	}
	if got, ok := b.TryRotate(p, -1); ok {
		t.Errorf("boxed-in counter-rotation succeeded as %+v, want failure", got)
	}
}

// Review Focus 2: the (0,-1) kick can lift a piece above the ceiling.
func TestRotateMayKickAboveCeiling(t *testing.T) {
	var b Board
	// Fill rows 1 and below so the only way out is upward.
	for y := 1; y < Height; y++ {
		for x := 0; x < Width; x++ {
			b.Set(x, y, FilledCell(KindI))
		}
	}
	p := Piece{Kind: KindI, Rotation: 0, X: 3, Y: -1} // horizontal bar in row 0
	for _, blk := range p.Blocks() {
		b.Set(blk[0], blk[1], EmptyCell)
	}
	if b.Collides(p) {
		t.Fatal("test setup: starting position collides")
	}
	// Whatever happens, it must not panic and must not return a colliding piece.
	if got, ok := b.TryRotate(p, 1); ok && b.Collides(got) {
		t.Errorf("TryRotate returned colliding piece %+v", got)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestKick|TestRotate|TestEveryRotation'`
Expected: FAIL — `undefined: KickOffsets`, `b.TryRotate undefined`.

- [ ] **Step 3: Write the implementation**

Create `internal/game/rules.go`:

```go
package game

// KickOffsets is the wall-kick ladder from design section 7, tried in order.
// The first candidate that does not collide wins; if none fit, rotation fails.
// This is deliberately not a full SRS table: forgiving terminal rotation
// without turning rotation into a subsystem.
var KickOffsets = [8][2]int{
	{0, 0},
	{-1, 0},
	{1, 0},
	{-2, 0},
	{2, 0},
	{0, -1},
	{-1, -1},
	{1, -1},
}

// TryRotate rotates the piece by dir (+1 clockwise, -1 counter-clockwise),
// testing the kick ladder in order. It returns the accepted piece and true, or
// the original piece and false when every candidate collides.
func (b *Board) TryRotate(p Piece, dir int) (Piece, bool) {
	rotated := p
	rotated.Rotation = (p.Rotation + dir + 4) % 4
	for _, k := range KickOffsets {
		cand := rotated
		cand.X += k[0]
		cand.Y += k[1]
		if !b.Collides(cand) {
			return cand, true
		}
	}
	return p, false
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v -run 'TestKick|TestRotate|TestEveryRotation'`
Expected: PASS, 9 tests.

If `TestRotatePrefersEarlierKickOffsets` fails because the piece happens to fit in place, adjust the walled-off column in the test until the in-place candidate genuinely collides — do not relax the assertion that the *first* viable candidate is chosen.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/rules.go internal/game/rules_test.go
git commit -m "feat(game): rotation with the wall-kick ladder"
```

---

### Task 6: Scoring, level progression, and gravity timing

**Files:**
- Create: `internal/game/scoring.go`
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces: `func LineScore(lines, level int) int`, `func ComboBonus(combo, level int) int`, `func LevelFor(lines int) int`, `func GravityInterval(level int) time.Duration`, and constants `LockDelay = 500ms`, `MaxLockResets = 15`, `BaseGravity = 800ms`, `MinGravity = 60ms`, `GravityDecay = 0.86`, `LinesPerLevel = 10`, `SoftDropPoints = 1`, `HardDropPoints = 2`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/scoring_test.go`:

```go
package game

import (
	"testing"
	"time"
)

func TestLineScoreBaseValues(t *testing.T) {
	tests := []struct {
		lines, level, want int
	}{
		{0, 1, 0},
		{1, 1, 100},
		{2, 1, 300},
		{3, 1, 500},
		{4, 1, 800},
		{1, 7, 700},
		{4, 13, 10400},
	}
	for _, tc := range tests {
		if got := LineScore(tc.lines, tc.level); got != tc.want {
			t.Errorf("LineScore(%d, %d) = %d, want %d", tc.lines, tc.level, got, tc.want)
		}
	}
}

func TestLineScoreClampsOutOfRange(t *testing.T) {
	if got := LineScore(9, 3); got != LineScore(4, 3) {
		t.Errorf("LineScore(9,3) = %d, want the four-line value %d", got, LineScore(4, 3))
	}
	if got := LineScore(-1, 3); got != 0 {
		t.Errorf("LineScore(-1,3) = %d, want 0", got)
	}
}

// Design section 49.1: bonus = 50 * (combo - 1) * level, so a lone clear pays
// nothing and the bonus first appears at combo 2.
func TestComboBonus(t *testing.T) {
	tests := []struct {
		combo, level, want int
	}{
		{0, 5, 0},
		{1, 5, 0},
		{2, 1, 50},
		{2, 5, 250},
		{3, 2, 200},
		{7, 3, 900},
	}
	for _, tc := range tests {
		if got := ComboBonus(tc.combo, tc.level); got != tc.want {
			t.Errorf("ComboBonus(%d, %d) = %d, want %d", tc.combo, tc.level, got, tc.want)
		}
	}
}

func TestLevelFor(t *testing.T) {
	tests := []struct{ lines, want int }{
		{0, 1}, {1, 1}, {9, 1}, {10, 2}, {19, 2}, {20, 3}, {127, 13},
	}
	for _, tc := range tests {
		if got := LevelFor(tc.lines); got != tc.want {
			t.Errorf("LevelFor(%d) = %d, want %d", tc.lines, got, tc.want)
		}
	}
}

func TestGravityIntervalKnownValues(t *testing.T) {
	tests := []struct {
		level int
		want  time.Duration
	}{
		{1, 800 * time.Millisecond},
		{2, 688 * time.Millisecond},
		{19, MinGravity},
		{50, MinGravity},
		{0, 800 * time.Millisecond},  // clamped up to level 1
		{-3, 800 * time.Millisecond}, // clamped up to level 1
	}
	for _, tc := range tests {
		got := GravityInterval(tc.level)
		if got != tc.want {
			t.Errorf("GravityInterval(%d) = %v, want %v", tc.level, got, tc.want)
		}
	}
}

func TestGravityIntervalDecaysMonotonically(t *testing.T) {
	prev := GravityInterval(1)
	for level := 2; level <= 40; level++ {
		got := GravityInterval(level)
		if got > prev {
			t.Errorf("GravityInterval(%d) = %v, want <= %v", level, got, prev)
		}
		if got < MinGravity {
			t.Errorf("GravityInterval(%d) = %v, below the %v floor", level, got, MinGravity)
		}
		prev = got
	}
}

func TestTimingConstants(t *testing.T) {
	if LockDelay != 500*time.Millisecond {
		t.Errorf("LockDelay = %v, want 500ms", LockDelay)
	}
	if MaxLockResets != 15 {
		t.Errorf("MaxLockResets = %d, want 15", MaxLockResets)
	}
	if SoftDropPoints != 1 || HardDropPoints != 2 {
		t.Errorf("drop points = %d/%d, want 1/2", SoftDropPoints, HardDropPoints)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestLineScore|TestCombo|TestLevelFor|TestGravity|TestTiming'`
Expected: FAIL — `undefined: LineScore`.

- [ ] **Step 3: Write the implementation**

Create `internal/game/scoring.go`:

```go
package game

import (
	"math"
	"time"
)

// Gravity and lock timing (design sections 11 and 12).
const (
	// BaseGravity is the level-1 drop interval.
	BaseGravity = 800 * time.Millisecond
	// MinGravity is the floor the drop interval is clamped to.
	MinGravity = 60 * time.Millisecond
	// GravityDecay multiplies the interval once per level.
	GravityDecay = 0.86
	// LinesPerLevel is how many cleared lines advance the level.
	LinesPerLevel = 10
	// LockDelay is how long a grounded piece waits before locking.
	LockDelay = 500 * time.Millisecond
	// MaxLockResets caps how many times movement may reset the lock timer,
	// which is what stops a player from stalling forever.
	MaxLockResets = 15
)

// Drop scoring (design section 11).
const (
	SoftDropPoints = 1
	HardDropPoints = 2
)

// lineValues indexes base clear values by number of lines cleared.
var lineValues = [5]int{0, 100, 300, 500, 800}

// LineScore returns the base points for clearing n lines at the given level.
// n above four is treated as four; n below zero scores nothing.
func LineScore(lines, level int) int {
	if lines <= 0 {
		return 0
	}
	if lines >= len(lineValues) {
		lines = len(lineValues) - 1
	}
	return lineValues[lines] * level
}

// ComboBonus returns the combo bonus for a clearing placement, using the
// indexing pinned in design section 49.1: the first clearing placement is
// combo 1 and earns nothing, so the bonus starts at combo 2.
func ComboBonus(combo, level int) int {
	if combo < 2 {
		return 0
	}
	return 50 * (combo - 1) * level
}

// LevelFor returns the level for a total cleared-line count, starting at 1.
func LevelFor(lines int) int {
	if lines < 0 {
		lines = 0
	}
	return lines/LinesPerLevel + 1
}

// GravityInterval returns how long the active piece waits before descending one
// row at the given level: BaseGravity * GravityDecay^(level-1), clamped to
// MinGravity.
func GravityInterval(level int) time.Duration {
	if level < 1 {
		level = 1
	}
	ms := float64(BaseGravity/time.Millisecond) * math.Pow(GravityDecay, float64(level-1))
	if ms < float64(MinGravity/time.Millisecond) {
		return MinGravity
	}
	return time.Duration(ms * float64(time.Millisecond))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v -run 'TestLineScore|TestCombo|TestLevelFor|TestGravity|TestTiming'`
Expected: PASS, 7 tests. `GravityInterval(2)` is exactly `688ms` and `GravityInterval(19)` clamps to `60ms`; if either assertion fails, the formula or the clamp is wrong, not the test.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/scoring.go internal/game/scoring_test.go
git commit -m "feat(game): scoring, level progression, and gravity timing"
```

---

### Task 7: Events

**Files:**
- Create: `internal/game/event.go`
- Test: `internal/game/event_test.go`

**Interfaces:**
- Consumes: `Piece`.
- Produces: `type EventType uint8` with `EventPieceSpawned, EventPieceMoved, EventPieceRotated, EventPieceHardDropped, EventPieceLocked, EventHoldUsed, EventLinesCleared, EventComboChanged, EventLevelChanged, EventGameOver`, `func (EventType) String() string`, `type Event struct { Type EventType; Piece Piece; Rows []int; Count int; Points int }`.

Later plans pattern-match on `Event.Type` and read `Count`/`Rows`/`Piece`, so the meaning of each field per type is part of the contract and is documented in the source.

- [ ] **Step 1: Write the failing test**

Create `internal/game/event_test.go`:

```go
package game

import "testing"

func TestEventTypeStrings(t *testing.T) {
	tests := []struct {
		t    EventType
		want string
	}{
		{EventPieceSpawned, "PieceSpawned"},
		{EventPieceMoved, "PieceMoved"},
		{EventPieceRotated, "PieceRotated"},
		{EventPieceHardDropped, "PieceHardDropped"},
		{EventPieceLocked, "PieceLocked"},
		{EventHoldUsed, "HoldUsed"},
		{EventLinesCleared, "LinesCleared"},
		{EventComboChanged, "ComboChanged"},
		{EventLevelChanged, "LevelChanged"},
		{EventGameOver, "GameOver"},
	}
	for _, tc := range tests {
		if got := tc.t.String(); got != tc.want {
			t.Errorf("EventType(%d).String() = %q, want %q", tc.t, got, tc.want)
		}
	}
	if got := EventType(200).String(); got != "EventType(200)" {
		t.Errorf("unknown EventType String = %q, want %q", got, "EventType(200)")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run TestEventType`
Expected: FAIL — `undefined: EventPieceSpawned`.

- [ ] **Step 3: Write the implementation**

Create `internal/game/event.go`:

```go
package game

import "fmt"

// EventType names something that happened during Apply or Advance. The FX
// system observes these; it may never write back into the game (design 14).
type EventType uint8

// Event types (design section 14).
const (
	EventPieceSpawned EventType = iota
	EventPieceMoved
	EventPieceRotated
	EventPieceHardDropped
	EventPieceLocked
	EventHoldUsed
	EventLinesCleared
	EventComboChanged
	EventLevelChanged
	EventGameOver
)

var eventTypeNames = [...]string{
	EventPieceSpawned:     "PieceSpawned",
	EventPieceMoved:       "PieceMoved",
	EventPieceRotated:     "PieceRotated",
	EventPieceHardDropped: "PieceHardDropped",
	EventPieceLocked:      "PieceLocked",
	EventHoldUsed:         "HoldUsed",
	EventLinesCleared:     "LinesCleared",
	EventComboChanged:     "ComboChanged",
	EventLevelChanged:     "LevelChanged",
	EventGameOver:         "GameOver",
}

// String returns the event type name.
func (t EventType) String() string {
	if int(t) < len(eventTypeNames) && eventTypeNames[t] != "" {
		return eventTypeNames[t]
	}
	return fmt.Sprintf("EventType(%d)", uint8(t))
}

// Event describes one thing the engine did. Which fields carry meaning depends
// on Type:
//
//	PieceSpawned      Piece = the new piece at its spawn position
//	PieceMoved        Piece = the piece after moving
//	PieceRotated      Piece = the piece after rotating (position may have kicked)
//	PieceHardDropped  Piece = the piece at its landing position
//	                  Count = rows fallen, Points = drop points awarded
//	PieceLocked       Piece = the piece as committed to the board
//	HoldUsed          Piece = the piece that is now active after the swap
//	LinesCleared      Rows  = cleared row indices, ascending
//	                  Count = len(Rows), Points = line score plus combo bonus
//	ComboChanged      Count = the new combo value (0 when it reset)
//	LevelChanged      Count = the new level
//	GameOver          Piece = the piece that could not spawn
type Event struct {
	Type   EventType
	Piece  Piece
	Rows   []int
	Count  int
	Points int
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v -run TestEventType`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/event.go internal/game/event_test.go
git commit -m "feat(game): event types describing engine state changes"
```

---

### Task 8: Game construction, next queue, and horizontal movement

**Files:**
- Create: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces:
  - `type State uint8` with `StatePlaying`, `StateOver`; `func (State) String() string`
  - `type Input uint8` with `InputNone, InputLeft, InputRight, InputSoftDrop, InputRotateCW, InputRotateCCW, InputHardDrop, InputHold`
  - `const NextQueueLen = 5`
  - `type Game struct { Board Board; Active Piece; Hold *PieceKind; CanHold bool; Next []PieceKind; Bag Bag; Score, Lines, Level, Combo int; State State; GravityAccumulator, LockAccumulator time.Duration; LockResets int; Seed int64; rng *rand.Rand }`
  - `func New(seed int64) *Game`
  - `func (*Game) Apply(in Input) []Event`
  - `func (*Game) Ghost() Piece`
  - `func (*Game) Grounded() bool`

Tasks 9–12 extend `Apply` and add `Advance`. This task implements only `InputLeft`, `InputRight`, `InputRotateCW`, `InputRotateCCW`; the remaining inputs return nil for now and are filled in by later tasks.

- [ ] **Step 1: Write the failing test**

Create `internal/game/game_test.go`:

```go
package game

import (
	"testing"
	"time"
)

// findEvent returns the first event of the given type and whether it was found.
func findEvent(evs []Event, typ EventType) (Event, bool) {
	for _, e := range evs {
		if e.Type == typ {
			return e, true
		}
	}
	return Event{}, false
}

// countEvents returns how many events of the given type are present.
func countEvents(evs []Event, typ EventType) int {
	n := 0
	for _, e := range evs {
		if e.Type == typ {
			n++
		}
	}
	return n
}

func TestNewGameInitialState(t *testing.T) {
	g := New(8675309)
	if g.Seed != 8675309 {
		t.Errorf("Seed = %d, want 8675309", g.Seed)
	}
	if g.State != StatePlaying {
		t.Errorf("State = %v, want StatePlaying", g.State)
	}
	if g.Score != 0 || g.Lines != 0 || g.Combo != 0 {
		t.Errorf("Score/Lines/Combo = %d/%d/%d, want 0/0/0", g.Score, g.Lines, g.Combo)
	}
	if g.Level != 1 {
		t.Errorf("Level = %d, want 1", g.Level)
	}
	if !g.CanHold {
		t.Error("CanHold = false, want true on a fresh game")
	}
	if g.Hold != nil {
		t.Errorf("Hold = %v, want nil", g.Hold)
	}
	if len(g.Next) != NextQueueLen {
		t.Errorf("len(Next) = %d, want %d", len(g.Next), NextQueueLen)
	}
	if g.Active.X != SpawnX || g.Active.Y != SpawnY || g.Active.Rotation != 0 {
		t.Errorf("Active = %+v, want spawn position", g.Active)
	}
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if g.Board.Cells[y][x].Filled() {
				t.Fatalf("fresh board has a filled cell at (%d,%d)", x, y)
			}
		}
	}
	if g.GravityAccumulator != 0 || g.LockAccumulator != 0 || g.LockResets != 0 {
		t.Error("fresh game has non-zero accumulators")
	}
}

func TestNewGameIsReproducible(t *testing.T) {
	a, b := New(4242), New(4242)
	if a.Active != b.Active {
		t.Errorf("active pieces differ: %+v vs %+v", a.Active, b.Active)
	}
	for i := range a.Next {
		if a.Next[i] != b.Next[i] {
			t.Errorf("next[%d] differs: %c vs %c", i, a.Next[i].Letter(), b.Next[i].Letter())
		}
	}
}

func TestNewGameDifferentSeedsDiffer(t *testing.T) {
	a, b := New(1), New(2)
	same := a.Active.Kind == b.Active.Kind
	for i := range a.Next {
		if a.Next[i] != b.Next[i] {
			same = false
		}
	}
	if same {
		t.Error("seeds 1 and 2 produced the same opening sequence")
	}
}

func TestApplyLeftAndRight(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindT, Rotation: 0, X: 4, Y: 10}

	evs := g.Apply(InputLeft)
	if g.Active.X != 3 {
		t.Errorf("after left X = %d, want 3", g.Active.X)
	}
	e, ok := findEvent(evs, EventPieceMoved)
	if !ok {
		t.Fatal("left move emitted no PieceMoved event")
	}
	if e.Piece.X != 3 {
		t.Errorf("event piece X = %d, want 3", e.Piece.X)
	}

	g.Apply(InputRight)
	g.Apply(InputRight)
	if g.Active.X != 5 {
		t.Errorf("after two rights X = %d, want 5", g.Active.X)
	}
}

func TestApplyBlockedMoveEmitsNoEvent(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindT, Rotation: 0, X: 0, Y: 10}
	evs := g.Apply(InputLeft)
	if g.Active.X != 0 {
		t.Errorf("blocked move changed X to %d, want 0", g.Active.X)
	}
	if len(evs) != 0 {
		t.Errorf("blocked move emitted %v, want no events", evs)
	}
}

func TestApplyRotationEmitsEvent(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindT, Rotation: 0, X: 4, Y: 10}
	evs := g.Apply(InputRotateCW)
	if g.Active.Rotation != 1 {
		t.Errorf("rotation = %d, want 1", g.Active.Rotation)
	}
	e, ok := findEvent(evs, EventPieceRotated)
	if !ok {
		t.Fatal("rotation emitted no PieceRotated event")
	}
	if e.Piece.Rotation != 1 {
		t.Errorf("event rotation = %d, want 1", e.Piece.Rotation)
	}

	evs = g.Apply(InputRotateCCW)
	if g.Active.Rotation != 0 {
		t.Errorf("rotation = %d, want 0", g.Active.Rotation)
	}
	if _, ok := findEvent(evs, EventPieceRotated); !ok {
		t.Fatal("counter-rotation emitted no PieceRotated event")
	}
}

func TestApplyFailedRotationEmitsNoEvent(t *testing.T) {
	g := New(1)
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			g.Board.Set(x, y, FilledCell(KindI))
		}
	}
	p := Piece{Kind: KindT, Rotation: 0, X: 4, Y: 18}
	for _, blk := range p.Blocks() {
		g.Board.Set(blk[0], blk[1], EmptyCell)
	}
	g.Active = p
	evs := g.Apply(InputRotateCW)
	if g.Active != p {
		t.Errorf("failed rotation changed the piece to %+v", g.Active)
	}
	if len(evs) != 0 {
		t.Errorf("failed rotation emitted %v, want no events", evs)
	}
}

func TestApplyNoneIsNoop(t *testing.T) {
	g := New(1)
	before := *g
	evs := g.Apply(InputNone)
	if len(evs) != 0 {
		t.Errorf("InputNone emitted %v, want no events", evs)
	}
	if g.Active != before.Active || g.Score != before.Score {
		t.Error("InputNone changed the game")
	}
}

func TestApplyIgnoredWhenGameOver(t *testing.T) {
	g := New(1)
	g.State = StateOver
	g.Active = Piece{Kind: KindT, Rotation: 0, X: 4, Y: 10}
	for _, in := range []Input{InputLeft, InputRight, InputRotateCW, InputRotateCCW} {
		evs := g.Apply(in)
		if len(evs) != 0 {
			t.Errorf("input %d after game over emitted %v", in, evs)
		}
	}
	if g.Active.X != 4 || g.Active.Rotation != 0 {
		t.Errorf("input after game over moved the piece to %+v", g.Active)
	}
}

func TestGroundedAndGhost(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 5}
	if g.Grounded() {
		t.Error("Grounded = true in mid-air")
	}
	ghost := g.Ghost()
	if ghost.Y != Height-2 {
		t.Errorf("ghost Y = %d, want %d", ghost.Y, Height-2)
	}
	g.Active.Y = Height - 2
	if !g.Grounded() {
		t.Error("Grounded = false while resting on the floor")
	}
}

func TestStateString(t *testing.T) {
	if got := StatePlaying.String(); got != "Playing" {
		t.Errorf("StatePlaying = %q, want %q", got, "Playing")
	}
	if got := StateOver.String(); got != "Over" {
		t.Errorf("StateOver = %q, want %q", got, "Over")
	}
}

// Successful movement while grounded resets the lock timer (design 12).
func TestMoveWhileGroundedResetsLockTimer(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 2}
	g.LockAccumulator = 300 * time.Millisecond
	g.Apply(InputLeft)
	if g.LockAccumulator != 0 {
		t.Errorf("LockAccumulator = %v, want 0 after a grounded move", g.LockAccumulator)
	}
	if g.LockResets != 1 {
		t.Errorf("LockResets = %d, want 1", g.LockResets)
	}
}

func TestLockResetsCapped(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 2}
	for i := 0; i < MaxLockResets+10; i++ {
		if i%2 == 0 {
			g.Apply(InputLeft)
		} else {
			g.Apply(InputRight)
		}
		g.LockAccumulator = 400 * time.Millisecond
	}
	if g.LockResets != MaxLockResets {
		t.Errorf("LockResets = %d, want capped at %d", g.LockResets, MaxLockResets)
	}
	if g.LockAccumulator != 400*time.Millisecond {
		t.Errorf("LockAccumulator = %v, want the timer to stop resetting past the cap", g.LockAccumulator)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestNewGame|TestApply|TestGrounded|TestState|TestMoveWhile|TestLockResets'`
Expected: FAIL — `undefined: New`, `undefined: Input`.

- [ ] **Step 3: Write the implementation**

Create `internal/game/game.go`:

```go
package game

import (
	"math/rand/v2"
	"time"
)

// NextQueueLen is how many upcoming pieces the game keeps visible (design 6).
const NextQueueLen = 5

// State is the coarse engine state.
type State uint8

// Engine states.
const (
	StatePlaying State = iota
	StateOver
)

// String returns the state name.
func (s State) String() string {
	if s == StateOver {
		return "Over"
	}
	return "Playing"
}

// Input is one player action. Pause, restart, help and quit are application
// concerns, not engine concerns, so they are not Inputs.
type Input uint8

// Player actions.
const (
	InputNone Input = iota
	InputLeft
	InputRight
	InputSoftDrop
	InputRotateCW
	InputRotateCCW
	InputHardDrop
	InputHold
)

// Game is the whole logical game. It never reads a clock: elapsed time comes in
// through Advance (design 49.2).
type Game struct {
	Board   Board
	Active  Piece
	Hold    *PieceKind
	CanHold bool

	Next []PieceKind
	Bag  Bag

	Score int
	Lines int
	Level int
	Combo int

	State State

	GravityAccumulator time.Duration
	LockAccumulator    time.Duration
	LockResets         int

	// Seed is recorded for display and restart. The generator below is what
	// actually carries RNG state (design 49.6).
	Seed int64
	rng  *rand.Rand
}

// New returns a game ready to play, with the first piece already active and the
// next queue filled. The same seed always produces the same piece order.
func New(seed int64) *Game {
	g := &Game{
		Level:   1,
		CanHold: true,
		State:   StatePlaying,
		Seed:    seed,
		rng:     NewRNG(seed),
		Next:    make([]PieceKind, 0, NextQueueLen+1),
	}
	g.fillQueue()
	g.Active = Spawn(g.takeNext())
	return g
}

// fillQueue tops the next queue up to NextQueueLen kinds.
func (g *Game) fillQueue() {
	for len(g.Next) < NextQueueLen {
		g.Next = append(g.Next, g.Bag.Next(g.rng))
	}
}

// takeNext pops the head of the next queue and refills it.
func (g *Game) takeNext() PieceKind {
	k := g.Next[0]
	g.Next = append(g.Next[:0], g.Next[1:]...)
	g.fillQueue()
	return k
}

// Ghost returns the active piece at its landing position (design 10).
func (g *Game) Ghost() Piece { return g.Board.Ghost(g.Active) }

// Grounded reports whether the active piece is resting on the stack or floor.
func (g *Game) Grounded() bool {
	next := g.Active
	next.Y++
	return g.Board.Collides(next)
}

// touchLock resets the lock timer after a successful move or rotation while
// grounded, up to MaxLockResets times (design 12).
func (g *Game) touchLock() {
	if !g.Grounded() {
		return
	}
	if g.LockResets >= MaxLockResets {
		return
	}
	g.LockAccumulator = 0
	g.LockResets++
}

// tryMove shifts the active piece if the destination is free.
func (g *Game) tryMove(dx, dy int) bool {
	cand := g.Active
	cand.X += dx
	cand.Y += dy
	if g.Board.Collides(cand) {
		return false
	}
	g.Active = cand
	return true
}

// Apply performs one player action and reports what happened.
func (g *Game) Apply(in Input) []Event {
	if g.State != StatePlaying {
		return nil
	}
	switch in {
	case InputLeft:
		return g.move(-1)
	case InputRight:
		return g.move(1)
	case InputRotateCW:
		return g.rotate(1)
	case InputRotateCCW:
		return g.rotate(-1)
	}
	return nil
}

func (g *Game) move(dx int) []Event {
	if !g.tryMove(dx, 0) {
		return nil
	}
	g.touchLock()
	return []Event{{Type: EventPieceMoved, Piece: g.Active}}
}

func (g *Game) rotate(dir int) []Event {
	rotated, ok := g.Board.TryRotate(g.Active, dir)
	if !ok {
		return nil
	}
	g.Active = rotated
	g.touchLock()
	return []Event{{Type: EventPieceRotated, Piece: g.Active}}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v -run 'TestNewGame|TestApply|TestGrounded|TestState|TestMoveWhile|TestLockResets'`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game construction, next queue, movement, and rotation input"
```

---

### Task 9: Gravity, soft drop, and lock delay via Advance

**Files:**
- Modify: `internal/game/game.go`
- Modify: `internal/game/game_test.go`

**Interfaces:**
- Consumes: `Game`, `Input`, `GravityInterval`, `LockDelay`, `Board.Lock`.
- Produces: `func (g *Game) Advance(dt time.Duration) []Event`, extended `Apply` handling `InputSoftDrop`, private `func (g *Game) lockPiece() []Event` and `func (g *Game) spawnNext() []Event`.

`lockPiece` at this stage commits the piece and spawns the next one; line clearing and combo accounting arrive in Task 10 and game over in Task 12.

- [ ] **Step 1: Write the failing test**

Append to `internal/game/game_test.go`:

```go
func TestAdvanceDropsOnGravityInterval(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 3}
	iv := GravityInterval(g.Level)

	if evs := g.Advance(iv - time.Millisecond); len(evs) != 0 {
		t.Errorf("just under the interval emitted %v, want nothing", evs)
	}
	if g.Active.Y != 3 {
		t.Errorf("Y = %d, want 3 before the interval elapses", g.Active.Y)
	}
	evs := g.Advance(2 * time.Millisecond)
	if g.Active.Y != 4 {
		t.Errorf("Y = %d, want 4 after the interval elapses", g.Active.Y)
	}
	if _, ok := findEvent(evs, EventPieceMoved); !ok {
		t.Error("gravity drop emitted no PieceMoved event")
	}
}

func TestAdvanceUsesLevelInterval(t *testing.T) {
	g := New(1)
	g.Level = 10
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 3}
	g.Advance(GravityInterval(10))
	if g.Active.Y != 4 {
		t.Errorf("Y = %d, want 4 after one level-10 interval", g.Active.Y)
	}
}

// Review Focus 1: one enormous dt (sleep, SIGSTOP, debugger pause) must land
// the piece and run the lock sequence rather than tunnel or hang.
func TestAdvanceHugeDtLandsAndLocks(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 0}
	evs := g.Advance(5 * time.Second)
	if countEvents(evs, EventPieceLocked) != 1 {
		t.Fatalf("5s step produced %d lock events, want exactly 1: %v", countEvents(evs, EventPieceLocked), evs)
	}
	// The O landed on the floor; those two rows must hold four cells.
	filled := 0
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if g.Board.Cells[y][x].Filled() {
				filled++
			}
		}
	}
	if filled != 4 {
		t.Errorf("%d cells locked, want 4 (the piece must not tunnel)", filled)
	}
	if !g.Board.At(4, Height-1).Filled() || !g.Board.At(5, Height-1).Filled() {
		t.Error("piece did not come to rest on the floor")
	}
}

func TestAdvanceLocksAfterLockDelay(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 2}
	if evs := g.Advance(LockDelay - time.Millisecond); countEvents(evs, EventPieceLocked) != 0 {
		t.Error("locked before the lock delay elapsed")
	}
	if g.Board.At(4, Height-1).Filled() {
		t.Error("board written before the lock delay elapsed")
	}
	evs := g.Advance(2 * time.Millisecond)
	if countEvents(evs, EventPieceLocked) != 1 {
		t.Fatalf("expected exactly one lock event, got %v", evs)
	}
	if !g.Board.At(4, Height-1).Filled() {
		t.Error("piece not committed to the board after locking")
	}
}

func TestAdvanceLockSpawnsNextPieceAndResetsCounters(t *testing.T) {
	g := New(1)
	wantKind := g.Next[0]
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 2}
	evs := g.Advance(LockDelay)
	if g.Active.Kind != wantKind {
		t.Errorf("new active kind = %c, want %c from the queue", g.Active.Kind.Letter(), wantKind.Letter())
	}
	if g.Active.X != SpawnX || g.Active.Y != SpawnY || g.Active.Rotation != 0 {
		t.Errorf("new piece = %+v, want spawn position", g.Active)
	}
	if len(g.Next) != NextQueueLen {
		t.Errorf("len(Next) = %d, want %d", len(g.Next), NextQueueLen)
	}
	if g.LockAccumulator != 0 || g.LockResets != 0 || g.GravityAccumulator != 0 {
		t.Errorf("counters not reset after lock: lock=%v resets=%d grav=%v",
			g.LockAccumulator, g.LockResets, g.GravityAccumulator)
	}
	if !g.CanHold {
		t.Error("CanHold = false, want true after a lock (design 9)")
	}
	if _, ok := findEvent(evs, EventPieceSpawned); !ok {
		t.Error("lock emitted no PieceSpawned event")
	}
}

func TestAdvanceUngroundedResetsLockAccumulator(t *testing.T) {
	g := New(1)
	// A shelf with a gap the O can slide into.
	fillRow(&g.Board, Height-1, 0, 1)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 3}
	g.Advance(200 * time.Millisecond)
	if g.LockAccumulator == 0 {
		t.Fatal("test setup: piece is not grounded")
	}
	g.Active.X = 0 // slide over the gap
	g.Advance(time.Millisecond)
	if g.LockAccumulator != 0 {
		t.Errorf("LockAccumulator = %v, want 0 once the piece is airborne again", g.LockAccumulator)
	}
}

func TestAdvanceIgnoredWhenGameOver(t *testing.T) {
	g := New(1)
	g.State = StateOver
	before := g.Active
	if evs := g.Advance(10 * time.Second); len(evs) != 0 {
		t.Errorf("Advance after game over emitted %v", evs)
	}
	if g.Active != before {
		t.Error("Advance after game over moved the piece")
	}
}

func TestAdvanceZeroDtIsNoop(t *testing.T) {
	g := New(1)
	before := g.Active
	if evs := g.Advance(0); len(evs) != 0 {
		t.Errorf("Advance(0) emitted %v", evs)
	}
	if g.Active != before {
		t.Error("Advance(0) moved the piece")
	}
}

func TestSoftDropScoresAndDescends(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 5}
	g.GravityAccumulator = 100 * time.Millisecond
	evs := g.Apply(InputSoftDrop)
	if g.Active.Y != 6 {
		t.Errorf("Y = %d, want 6", g.Active.Y)
	}
	if g.Score != SoftDropPoints {
		t.Errorf("Score = %d, want %d", g.Score, SoftDropPoints)
	}
	if g.GravityAccumulator != 0 {
		t.Errorf("GravityAccumulator = %v, want 0 after a soft drop", g.GravityAccumulator)
	}
	e, ok := findEvent(evs, EventPieceMoved)
	if !ok {
		t.Fatal("soft drop emitted no PieceMoved event")
	}
	if e.Points != SoftDropPoints {
		t.Errorf("event Points = %d, want %d", e.Points, SoftDropPoints)
	}
}

func TestSoftDropAtRestScoresNothing(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 2}
	evs := g.Apply(InputSoftDrop)
	if g.Score != 0 {
		t.Errorf("Score = %d, want 0 when the soft drop cannot move", g.Score)
	}
	if len(evs) != 0 {
		t.Errorf("blocked soft drop emitted %v", evs)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestAdvance|TestSoftDrop'`
Expected: FAIL — `g.Advance undefined`.

- [ ] **Step 3: Write the implementation**

Add `InputSoftDrop` to the `Apply` switch in `internal/game/game.go`:

```go
	case InputSoftDrop:
		return g.softDrop()
```

and append to `internal/game/game.go`:

```go
// Advance moves the game forward by dt. It is the only way time enters the
// engine (design 49.2): nothing here reads a clock.
func (g *Game) Advance(dt time.Duration) []Event {
	if g.State != StatePlaying || dt <= 0 {
		return nil
	}

	var evs []Event

	g.GravityAccumulator += dt
	iv := GravityInterval(g.Level)
	for g.GravityAccumulator >= iv {
		g.GravityAccumulator -= iv
		if !g.tryMove(0, 1) {
			// Landed. Drop the leftover credit so a huge dt cannot bank
			// gravity steps against the next piece.
			g.GravityAccumulator = 0
			break
		}
		evs = append(evs, Event{Type: EventPieceMoved, Piece: g.Active})
	}

	if !g.Grounded() {
		g.LockAccumulator = 0
		return evs
	}

	g.LockAccumulator += dt
	if g.LockAccumulator >= LockDelay {
		evs = append(evs, g.lockPiece()...)
	}
	return evs
}

// softDrop descends one row for a point (design 11).
func (g *Game) softDrop() []Event {
	if !g.tryMove(0, 1) {
		return nil
	}
	g.Score += SoftDropPoints
	g.GravityAccumulator = 0
	g.touchLock()
	return []Event{{Type: EventPieceMoved, Piece: g.Active, Points: SoftDropPoints}}
}

// lockPiece commits the active piece and spawns the next one, following the
// order in design section 12. Line clearing is layered in by the resolve step.
func (g *Game) lockPiece() []Event {
	locked := g.Active
	g.Board.Lock(locked)
	evs := []Event{{Type: EventPieceLocked, Piece: locked}}
	evs = append(evs, g.resolveClears()...)
	evs = append(evs, g.spawnNext()...)
	return evs
}

// resolveClears detects and clears completed rows and updates the score. Task
// 10 fills this in; until then locking simply commits the piece.
func (g *Game) resolveClears() []Event { return nil }

// spawnNext takes the head of the next queue as the new active piece and resets
// the per-piece counters.
func (g *Game) spawnNext() []Event {
	g.Active = Spawn(g.takeNext())
	g.GravityAccumulator = 0
	g.LockAccumulator = 0
	g.LockResets = 0
	g.CanHold = true
	return []Event{{Type: EventPieceSpawned, Piece: g.Active}}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v -run 'TestAdvance|TestSoftDrop'`
Expected: PASS, 10 tests.

- [ ] **Step 5: Run the whole package**

Run: `go test ./internal/game/`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
gofmt -l .
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): gravity, soft drop, and lock delay driven by Advance(dt)"
```

---

### Task 10: Line clearing, combo, level progression, and hard drop

**Files:**
- Modify: `internal/game/game.go`
- Modify: `internal/game/game_test.go`

**Interfaces:**
- Consumes: `Board.CompleteRows`, `Board.ClearRows`, `Board.DropDistance`, `LineScore`, `ComboBonus`, `LevelFor`.
- Produces: real `func (g *Game) resolveClears() []Event`, `Apply` handling `InputHardDrop`, private `func (g *Game) hardDrop() []Event`.

- [ ] **Step 1: Write the failing test**

Append to `internal/game/game_test.go`:

```go
// setupClear puts the game one placement away from clearing n rows with an O.
// The O lands in columns 4 and 5, so those columns are the gaps.
func setupClear(g *Game, rows int) {
	for i := 0; i < rows; i++ {
		fillRow(&g.Board, Height-1-i, 4, 5)
	}
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 1 - rows}
}

func TestLockClearsSingleRowAndScores(t *testing.T) {
	g := New(1)
	setupClear(g, 1)
	// The O fills (4,21) and (5,21) plus (4,20),(5,20); only row 21 completes.
	g.Active.Y = Height - 2
	evs := g.Advance(LockDelay)

	e, ok := findEvent(evs, EventLinesCleared)
	if !ok {
		t.Fatalf("no LinesCleared event: %v", evs)
	}
	if e.Count != 1 {
		t.Errorf("cleared Count = %d, want 1", e.Count)
	}
	if len(e.Rows) != 1 || e.Rows[0] != Height-1 {
		t.Errorf("cleared Rows = %v, want [%d]", e.Rows, Height-1)
	}
	if g.Lines != 1 {
		t.Errorf("Lines = %d, want 1", g.Lines)
	}
	if g.Combo != 1 {
		t.Errorf("Combo = %d, want 1 on the first clearing placement", g.Combo)
	}
	// Level 1 single, no combo bonus at combo 1 (design 49.1).
	if want := LineScore(1, 1); e.Points != want {
		t.Errorf("event Points = %d, want %d", e.Points, want)
	}
	if g.Score != LineScore(1, 1) {
		t.Errorf("Score = %d, want %d", g.Score, LineScore(1, 1))
	}
}

func TestLockClearsFourRows(t *testing.T) {
	g := New(1)
	setupClear(g, 4)
	// Stand an I on end so it fills four rows in one column pair? Use two
	// stacked O placements instead: fill rows 18..21 leaving only column 4,
	// then drop a vertical I into it.
	g.Board = Board{}
	for i := 0; i < 4; i++ {
		fillRow(&g.Board, Height-1-i, 4)
	}
	g.Active = Piece{Kind: KindI, Rotation: 1, X: 2, Y: Height - 4} // column 4, rows 18..21
	if g.Board.Collides(g.Active) {
		t.Fatalf("test setup: I at %+v collides", g.Active)
	}
	evs := g.Advance(LockDelay)
	e, ok := findEvent(evs, EventLinesCleared)
	if !ok {
		t.Fatalf("no LinesCleared event: %v", evs)
	}
	if e.Count != 4 {
		t.Fatalf("cleared %d rows, want 4", e.Count)
	}
	if g.Lines != 4 {
		t.Errorf("Lines = %d, want 4", g.Lines)
	}
	if g.Score != LineScore(4, 1) {
		t.Errorf("Score = %d, want %d", g.Score, LineScore(4, 1))
	}
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if g.Board.Cells[y][x].Filled() {
				t.Fatalf("board not empty after a four-line clear: (%d,%d)", x, y)
			}
		}
	}
}

func TestComboIncrementsAndResets(t *testing.T) {
	g := New(1)
	// First clearing placement.
	fillRow(&g.Board, Height-1, 4, 5)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 2}
	g.Advance(LockDelay)
	if g.Combo != 1 {
		t.Fatalf("Combo = %d, want 1", g.Combo)
	}

	// Second clearing placement in a row: combo 2, bonus appears.
	scoreBefore := g.Score
	fillRow(&g.Board, Height-1, 4, 5)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 2}
	evs := g.Advance(LockDelay)
	if g.Combo != 2 {
		t.Fatalf("Combo = %d, want 2", g.Combo)
	}
	e, _ := findEvent(evs, EventLinesCleared)
	wantPoints := LineScore(1, g.Level) + ComboBonus(2, g.Level)
	if e.Points != wantPoints {
		t.Errorf("event Points = %d, want %d (line score plus combo bonus)", e.Points, wantPoints)
	}
	if g.Score-scoreBefore != wantPoints {
		t.Errorf("score delta = %d, want %d", g.Score-scoreBefore, wantPoints)
	}
	if ce, ok := findEvent(evs, EventComboChanged); !ok || ce.Count != 2 {
		t.Errorf("ComboChanged = %+v, want Count 2", ce)
	}

	// A placement that clears nothing resets the combo.
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 0, Y: Height - 2}
	evs = g.Advance(LockDelay)
	if g.Combo != 0 {
		t.Errorf("Combo = %d, want 0 after a placement that cleared nothing", g.Combo)
	}
	if ce, ok := findEvent(evs, EventComboChanged); !ok || ce.Count != 0 {
		t.Errorf("ComboChanged = %+v, want Count 0", ce)
	}
}

func TestComboChangedNotEmittedWhenUnchanged(t *testing.T) {
	g := New(1)
	// Two consecutive non-clearing placements: combo stays 0, so only the
	// first may report a change, and it should not report one either.
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 0, Y: Height - 2}
	evs := g.Advance(LockDelay)
	if _, ok := findEvent(evs, EventComboChanged); ok {
		t.Errorf("ComboChanged emitted while the combo stayed 0: %v", evs)
	}
}

func TestLevelUpAtTenLines(t *testing.T) {
	g := New(1)
	g.Lines = 9
	fillRow(&g.Board, Height-1, 4, 5)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 2}
	evs := g.Advance(LockDelay)
	if g.Lines != 10 {
		t.Fatalf("Lines = %d, want 10", g.Lines)
	}
	if g.Level != 2 {
		t.Errorf("Level = %d, want 2", g.Level)
	}
	e, ok := findEvent(evs, EventLevelChanged)
	if !ok {
		t.Fatalf("no LevelChanged event: %v", evs)
	}
	if e.Count != 2 {
		t.Errorf("LevelChanged Count = %d, want 2", e.Count)
	}
}

func TestNoLevelChangeEventWithoutLevelUp(t *testing.T) {
	g := New(1)
	fillRow(&g.Board, Height-1, 4, 5)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 2}
	evs := g.Advance(LockDelay)
	if _, ok := findEvent(evs, EventLevelChanged); ok {
		t.Errorf("LevelChanged emitted for the first cleared line: %v", evs)
	}
}

func TestHardDropScoresAndLocks(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 0}
	dist := g.Board.DropDistance(g.Active)
	evs := g.Apply(InputHardDrop)

	e, ok := findEvent(evs, EventPieceHardDropped)
	if !ok {
		t.Fatalf("no PieceHardDropped event: %v", evs)
	}
	if e.Count != dist {
		t.Errorf("hard drop Count = %d, want %d", e.Count, dist)
	}
	if want := dist * HardDropPoints; e.Points != want {
		t.Errorf("hard drop Points = %d, want %d", e.Points, want)
	}
	if e.Piece.Y != Height-2 {
		t.Errorf("hard drop landed at Y = %d, want %d", e.Piece.Y, Height-2)
	}
	if countEvents(evs, EventPieceLocked) != 1 {
		t.Errorf("hard drop produced %d lock events, want 1", countEvents(evs, EventPieceLocked))
	}
	if !g.Board.At(4, Height-1).Filled() {
		t.Error("hard-dropped piece not committed to the board")
	}
	if g.Score < dist*HardDropPoints {
		t.Errorf("Score = %d, want at least %d", g.Score, dist*HardDropPoints)
	}
}

func TestHardDropEventOrder(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 0}
	evs := g.Apply(InputHardDrop)
	if len(evs) < 2 {
		t.Fatalf("hard drop emitted %d events, want at least 2", len(evs))
	}
	if evs[0].Type != EventPieceHardDropped {
		t.Errorf("first event = %v, want PieceHardDropped", evs[0].Type)
	}
	if evs[1].Type != EventPieceLocked {
		t.Errorf("second event = %v, want PieceLocked", evs[1].Type)
	}
}

// Review Focus 3: hard drop with nowhere to fall.
func TestHardDropAtRestStillLocksOnce(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 2}
	evs := g.Apply(InputHardDrop)
	e, ok := findEvent(evs, EventPieceHardDropped)
	if !ok {
		t.Fatalf("no PieceHardDropped event: %v", evs)
	}
	if e.Count != 0 || e.Points != 0 {
		t.Errorf("resting hard drop Count/Points = %d/%d, want 0/0", e.Count, e.Points)
	}
	if n := countEvents(evs, EventPieceLocked); n != 1 {
		t.Errorf("%d lock events, want exactly 1", n)
	}
	filled := 0
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if g.Board.Cells[y][x].Filled() {
				filled++
			}
		}
	}
	if filled != 4 {
		t.Errorf("%d cells filled, want 4 (locked exactly once)", filled)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestLockClears|TestCombo|TestLevelUp|TestNoLevelChange|TestHardDrop'`
Expected: FAIL — no `LinesCleared` event, hard drop does nothing.

- [ ] **Step 3: Write the implementation**

Add `InputHardDrop` to the `Apply` switch:

```go
	case InputHardDrop:
		return g.hardDrop()
```

Replace the stub `resolveClears` in `internal/game/game.go` and add `hardDrop`:

```go
// resolveClears detects completed rows, clears them, and updates lines, level,
// combo and score. It follows the order in design section 12: detect, clear,
// score, report.
func (g *Game) resolveClears() []Event {
	rows := g.Board.CompleteRows()
	var evs []Event

	oldCombo := g.Combo
	if len(rows) == 0 {
		g.Combo = 0
		if oldCombo != g.Combo {
			evs = append(evs, Event{Type: EventComboChanged, Count: g.Combo})
		}
		return evs
	}

	g.Board.ClearRows(rows)
	g.Combo++
	g.Lines += len(rows)

	points := LineScore(len(rows), g.Level) + ComboBonus(g.Combo, g.Level)
	g.Score += points

	evs = append(evs, Event{
		Type:   EventLinesCleared,
		Rows:   rows,
		Count:  len(rows),
		Points: points,
	})
	if oldCombo != g.Combo {
		evs = append(evs, Event{Type: EventComboChanged, Count: g.Combo})
	}
	if lvl := LevelFor(g.Lines); lvl != g.Level {
		g.Level = lvl
		evs = append(evs, Event{Type: EventLevelChanged, Count: g.Level})
	}
	return evs
}

// hardDrop slams the active piece to its landing position and locks it
// immediately, with no lock delay (design 11 and 18).
func (g *Game) hardDrop() []Event {
	dist := g.Board.DropDistance(g.Active)
	g.Active.Y += dist
	points := dist * HardDropPoints
	g.Score += points
	evs := []Event{{
		Type:   EventPieceHardDropped,
		Piece:  g.Active,
		Count:  dist,
		Points: points,
	}}
	return append(evs, g.lockPiece()...)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v -run 'TestLockClears|TestCombo|TestLevelUp|TestNoLevelChange|TestHardDrop'`
Expected: PASS, 9 tests.

If `TestLockClearsFourRows` reports a collision in setup, print `g.Active.Blocks()` and adjust the vertical I's `X` so its single occupied column is 4 — `Offsets[KindI][1]` puts blocks in relative column 2, so `X = 2`.

- [ ] **Step 5: Run the whole package**

Run: `go test ./internal/game/`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
gofmt -l .
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): line clearing, combo, level progression, and hard drop"
```

---

### Task 11: Hold

**Files:**
- Modify: `internal/game/game.go`
- Modify: `internal/game/game_test.go`

**Interfaces:**
- Consumes: `Game`, `Spawn`, `takeNext`.
- Produces: `Apply` handling `InputHold`, private `func (g *Game) holdPiece() []Event`.

Design §9: `c` swaps active with hold; an empty hold stores the active piece and spawns the next; hold works only once per piece; a piece coming out of hold returns to spawn rotation.

- [ ] **Step 1: Write the failing test**

Append to `internal/game/game_test.go`:

```go
func TestHoldFirstUseStoresAndSpawnsNext(t *testing.T) {
	g := New(1)
	activeKind := g.Active.Kind
	nextKind := g.Next[0]

	evs := g.Apply(InputHold)
	if g.Hold == nil {
		t.Fatal("Hold is nil after holding")
	}
	if *g.Hold != activeKind {
		t.Errorf("Hold = %c, want %c", g.Hold.Letter(), activeKind.Letter())
	}
	if g.Active.Kind != nextKind {
		t.Errorf("Active = %c, want %c from the queue", g.Active.Kind.Letter(), nextKind.Letter())
	}
	if g.Active.X != SpawnX || g.Active.Y != SpawnY || g.Active.Rotation != 0 {
		t.Errorf("Active = %+v, want spawn position", g.Active)
	}
	if g.CanHold {
		t.Error("CanHold = true, want false immediately after a hold")
	}
	if len(g.Next) != NextQueueLen {
		t.Errorf("len(Next) = %d, want %d", len(g.Next), NextQueueLen)
	}
	e, ok := findEvent(evs, EventHoldUsed)
	if !ok {
		t.Fatalf("no HoldUsed event: %v", evs)
	}
	if e.Piece.Kind != nextKind {
		t.Errorf("HoldUsed piece = %c, want the new active piece %c", e.Piece.Kind.Letter(), nextKind.Letter())
	}
}

func TestHoldSwapsWithStoredPiece(t *testing.T) {
	g := New(1)
	first := g.Active.Kind
	g.Apply(InputHold)
	second := g.Active.Kind
	// Lock the piece so hold is allowed again.
	g.Active = Piece{Kind: second, Rotation: 0, X: 0, Y: Height - 4}
	g.Apply(InputHardDrop)
	third := g.Active.Kind

	g.Apply(InputHold)
	if g.Active.Kind != first {
		t.Errorf("Active = %c, want the stored piece %c", g.Active.Kind.Letter(), first.Letter())
	}
	if *g.Hold != third {
		t.Errorf("Hold = %c, want %c", g.Hold.Letter(), third.Letter())
	}
}

func TestHoldReturnsPieceAtSpawnRotation(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: KindL, Rotation: 3, X: 7, Y: 12}
	g.Apply(InputHold) // stores L
	g.CanHold = true   // pretend a lock happened
	g.Active = Piece{Kind: KindT, Rotation: 2, X: 1, Y: 5}
	g.Apply(InputHold) // swaps L back in
	if g.Active.Kind != KindL {
		t.Fatalf("Active = %c, want L", g.Active.Kind.Letter())
	}
	if g.Active.Rotation != 0 || g.Active.X != SpawnX || g.Active.Y != SpawnY {
		t.Errorf("Active = %+v, want L at spawn rotation and position", g.Active)
	}
}

func TestSecondHoldBlockedBeforeLock(t *testing.T) {
	g := New(1)
	g.Apply(InputHold)
	held := *g.Hold
	active := g.Active.Kind

	evs := g.Apply(InputHold)
	if len(evs) != 0 {
		t.Errorf("second hold emitted %v, want nothing", evs)
	}
	if *g.Hold != held || g.Active.Kind != active {
		t.Errorf("second hold changed state: hold %c active %c", g.Hold.Letter(), g.Active.Kind.Letter())
	}
}

func TestHoldRestoredAfterLock(t *testing.T) {
	g := New(1)
	g.Apply(InputHold)
	if g.CanHold {
		t.Fatal("CanHold = true right after holding")
	}
	g.Active = Piece{Kind: g.Active.Kind, Rotation: 0, X: 0, Y: Height - 4}
	g.Apply(InputHardDrop)
	if !g.CanHold {
		t.Error("CanHold = false after the piece locked, want true")
	}
}

func TestHoldIgnoredWhenGameOver(t *testing.T) {
	g := New(1)
	g.State = StateOver
	if evs := g.Apply(InputHold); len(evs) != 0 {
		t.Errorf("hold after game over emitted %v", evs)
	}
	if g.Hold != nil {
		t.Error("hold after game over stored a piece")
	}
}

// Review Focus 4: repeated holds across many placements must keep the queue
// exactly NextQueueLen long and hand out only bag-produced pieces.
func TestRepeatedHoldsKeepQueueLength(t *testing.T) {
	g := New(99)
	for i := 0; i < 60; i++ {
		g.Apply(InputHold)
		if len(g.Next) != NextQueueLen {
			t.Fatalf("iteration %d: len(Next) = %d, want %d", i, len(g.Next), NextQueueLen)
		}
		for j, k := range g.Next {
			if k >= KindCount {
				t.Fatalf("iteration %d: Next[%d] = %d, not a valid kind", i, j, k)
			}
		}
		// Slam the piece somewhere harmless so hold unlocks again.
		g.Active.Y = 0
		g.Apply(InputHardDrop)
		if g.State != StatePlaying {
			// The stack filled up; that is fine, the queue invariant held.
			return
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestHold|TestSecondHold|TestRepeatedHolds'`
Expected: FAIL — `Hold is nil after holding`.

- [ ] **Step 3: Write the implementation**

Add `InputHold` to the `Apply` switch:

```go
	case InputHold:
		return g.holdPiece()
```

Append to `internal/game/game.go`:

```go
// holdPiece swaps the active piece with the held one, or stores it and spawns
// the next when the hold is empty. Hold works once per piece (design 9). The
// incoming piece always returns at spawn rotation and position.
func (g *Game) holdPiece() []Event {
	if !g.CanHold {
		return nil
	}
	outgoing := g.Active.Kind
	if g.Hold == nil {
		g.Active = Spawn(g.takeNext())
	} else {
		g.Active = Spawn(*g.Hold)
	}
	g.Hold = &outgoing
	g.CanHold = false
	g.GravityAccumulator = 0
	g.LockAccumulator = 0
	g.LockResets = 0
	return []Event{{Type: EventHoldUsed, Piece: g.Active}}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v -run 'TestHold|TestSecondHold|TestRepeatedHolds'`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): hold with once-per-piece restriction"
```

---

### Task 12: Game over on blocked spawn

**Files:**
- Modify: `internal/game/game.go`
- Modify: `internal/game/game_test.go`

**Interfaces:**
- Consumes: `spawnNext`, `Board.Collides`, `State`.
- Produces: `spawnNext` now emits `EventGameOver` and sets `StateOver` when the spawned piece collides.

- [ ] **Step 1: Write the failing test**

Append to `internal/game/game_test.go`:

```go
func TestGameOverOnBlockedSpawn(t *testing.T) {
	g := New(1)
	// Fill the spawn area so the next piece cannot appear.
	for y := 0; y < 4; y++ {
		for x := 0; x < Width; x++ {
			g.Board.Set(x, y, FilledCell(KindI))
		}
	}
	// Place the active piece low so it can lock without hitting the ceiling fill.
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 2}
	evs := g.Advance(LockDelay)

	if g.State != StateOver {
		t.Errorf("State = %v, want StateOver", g.State)
	}
	e, ok := findEvent(evs, EventGameOver)
	if !ok {
		t.Fatalf("no GameOver event: %v", evs)
	}
	if e.Piece.X != SpawnX || e.Piece.Y != SpawnY {
		t.Errorf("GameOver piece = %+v, want the blocked spawn position", e.Piece)
	}
	if _, ok := findEvent(evs, EventPieceSpawned); ok {
		t.Error("PieceSpawned emitted alongside GameOver, want only GameOver")
	}
}

func TestGameOverStopsTheEngine(t *testing.T) {
	g := New(1)
	for y := 0; y < 4; y++ {
		for x := 0; x < Width; x++ {
			g.Board.Set(x, y, FilledCell(KindI))
		}
	}
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 2}
	g.Advance(LockDelay)
	board := g.Board.Cells
	score := g.Score

	if evs := g.Advance(5 * time.Second); len(evs) != 0 {
		t.Errorf("Advance after game over emitted %v", evs)
	}
	for _, in := range []Input{InputLeft, InputRight, InputSoftDrop, InputHardDrop, InputHold, InputRotateCW} {
		if evs := g.Apply(in); len(evs) != 0 {
			t.Errorf("input %d after game over emitted %v", in, evs)
		}
	}
	if g.Board.Cells != board || g.Score != score {
		t.Error("game state changed after game over")
	}
}

func TestGameOverKeepsFinalStats(t *testing.T) {
	g := New(1)
	g.Score = 483200
	g.Lines = 127
	g.Level = 13
	for y := 0; y < 4; y++ {
		for x := 0; x < Width; x++ {
			g.Board.Set(x, y, FilledCell(KindI))
		}
	}
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 2}
	g.Advance(LockDelay)
	if g.Score < 483200 || g.Lines != 127 || g.Level != 13 {
		t.Errorf("stats after game over = %d/%d/%d, want them preserved", g.Score, g.Lines, g.Level)
	}
}

func TestGameOverAfterHardDropIntoCeiling(t *testing.T) {
	g := New(1)
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if x != 0 {
				g.Board.Set(x, y, FilledCell(KindI))
			}
		}
	}
	g.Active = Piece{Kind: KindI, Rotation: 1, X: -2, Y: 0} // vertical I in column 0
	if g.Board.Collides(g.Active) {
		t.Fatalf("test setup: I at %+v collides", g.Active)
	}
	g.Apply(InputHardDrop)
	if g.State != StateOver {
		t.Errorf("State = %v, want StateOver once the well is full", g.State)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run TestGameOver`
Expected: FAIL — `State = Playing, want StateOver`.

- [ ] **Step 3: Write the implementation**

Replace `spawnNext` in `internal/game/game.go`:

```go
// spawnNext takes the head of the next queue as the new active piece and resets
// the per-piece counters. A spawn that collides ends the game (design 12).
func (g *Game) spawnNext() []Event {
	g.Active = Spawn(g.takeNext())
	g.GravityAccumulator = 0
	g.LockAccumulator = 0
	g.LockResets = 0
	g.CanHold = true
	if g.Board.Collides(g.Active) {
		g.State = StateOver
		return []Event{{Type: EventGameOver, Piece: g.Active}}
	}
	return []Event{{Type: EventPieceSpawned, Piece: g.Active}}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v -run TestGameOver`
Expected: PASS, 4 tests.

If `TestGameOverAfterHardDropIntoCeiling` fails on the setup collision check, adjust the vertical I's `X` so its blocks land in column 0: `Offsets[KindI][1]` uses relative column 2, so `X = -2`.

- [ ] **Step 5: Run the whole package**

Run: `go test ./internal/game/`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
gofmt -l .
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game over when a spawn is blocked"
```

---

### Task 13: Snapshot and the seeded replay test

**Files:**
- Modify: `internal/game/game.go`
- Create: `internal/game/replay_test.go`
- Create: `internal/game/testdata/replay-8675309.golden`

**Interfaces:**
- Consumes: the whole engine.
- Produces: `func (g *Game) Snapshot() string` — a stable, human-readable dump of the full logical state, used by the replay golden test and useful when debugging.

This is design §35's promise made testable, and §40's "replay a canned input stream and assert final game state".

- [ ] **Step 1: Write the failing test**

Create `internal/game/replay_test.go`:

```go
package game

import (
	"flag"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

var update = flag.Bool("update", false, "rewrite golden files")

// replayStep is one (input, elapsed time) pair. Timing is an input, which is
// what makes design section 35 checkable at all (design 49.2).
type replayStep struct {
	In Input
	Dt time.Duration
}

// cannedReplay is a fixed script: a mix of moves, rotations, holds, soft drops
// and hard drops interleaved with irregular frame times.
func cannedReplay() []replayStep {
	inputs := []Input{
		InputLeft, InputLeft, InputRotateCW, InputHardDrop,
		InputRight, InputRotateCCW, InputSoftDrop, InputHardDrop,
		InputHold, InputLeft, InputHardDrop,
		InputRotateCW, InputRotateCW, InputRight, InputRight, InputHardDrop,
		InputHold, InputSoftDrop, InputSoftDrop, InputHardDrop,
		InputLeft, InputLeft, InputLeft, InputHardDrop,
		InputRight, InputRotateCW, InputHardDrop,
		InputNone, InputNone, InputNone,
	}
	dts := []time.Duration{
		16 * time.Millisecond,
		17 * time.Millisecond,
		33 * time.Millisecond,
		16 * time.Millisecond,
		250 * time.Millisecond,
	}
	var steps []replayStep
	for round := 0; round < 12; round++ {
		for i, in := range inputs {
			steps = append(steps, replayStep{In: in, Dt: dts[(round+i)%len(dts)]})
		}
	}
	return steps
}

func runReplay(seed int64) *Game {
	g := New(seed)
	for _, s := range cannedReplay() {
		g.Apply(s.In)
		g.Advance(s.Dt)
	}
	return g
}

func TestSnapshotIsStableAndReadable(t *testing.T) {
	g := New(1)
	a, b := g.Snapshot(), g.Snapshot()
	if a != b {
		t.Error("Snapshot is not stable across calls")
	}
	for _, want := range []string{"seed:", "state:", "score:", "lines:", "level:", "combo:", "active:", "next:", "hold:", "board:"} {
		if !strings.Contains(a, want) {
			t.Errorf("Snapshot missing %q:\n%s", want, a)
		}
	}
	// The board dump must be Height lines of Width characters.
	idx := strings.Index(a, "board:\n")
	if idx < 0 {
		t.Fatalf("Snapshot has no board section:\n%s", a)
	}
	rows := strings.Split(strings.TrimRight(a[idx+len("board:\n"):], "\n"), "\n")
	if len(rows) != Height {
		t.Fatalf("board dump has %d rows, want %d", len(rows), Height)
	}
	for i, r := range rows {
		if len(r) != Width {
			t.Errorf("board row %d is %d chars, want %d: %q", i, len(r), Width, r)
		}
	}
}

func TestSnapshotReflectsState(t *testing.T) {
	g := New(1)
	before := g.Snapshot()
	g.Score = 1234
	if g.Snapshot() == before {
		t.Error("Snapshot did not change after the score changed")
	}
}

// Same seed, same inputs, same timings, same final state (design 35).
func TestReplayIsDeterministic(t *testing.T) {
	a := runReplay(8675309).Snapshot()
	b := runReplay(8675309).Snapshot()
	if a != b {
		t.Errorf("two identical replays diverged:\n--- first ---\n%s\n--- second ---\n%s", a, b)
	}
}

func TestReplayDiffersBySeed(t *testing.T) {
	if runReplay(8675309).Snapshot() == runReplay(11111).Snapshot() {
		t.Error("different seeds produced identical final state")
	}
}

// Timing is an input: changing the dt stream must change the outcome.
func TestReplayDependsOnTiming(t *testing.T) {
	slow := New(8675309)
	for _, s := range cannedReplay() {
		slow.Apply(s.In)
		slow.Advance(s.Dt * 3)
	}
	if slow.Snapshot() == runReplay(8675309).Snapshot() {
		t.Error("tripling every dt did not change the final state")
	}
}

func TestReplayMatchesGolden(t *testing.T) {
	got := runReplay(8675309).Snapshot()
	path := filepath.Join("testdata", "replay-8675309.golden")
	if *update {
		if err := os.MkdirAll("testdata", 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(got), 0o644); err != nil {
			t.Fatal(err)
		}
		t.Logf("wrote %s", path)
		return
	}
	want, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("%v (run: go test ./internal/game -update)", err)
	}
	if got != string(want) {
		t.Errorf("replay diverged from the golden file.\n--- want ---\n%s\n--- got ---\n%s", want, got)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestSnapshot|TestReplay'`
Expected: FAIL — `g.Snapshot undefined`.

- [ ] **Step 3: Write the implementation**

Append to `internal/game/game.go` (and add `"fmt"` and `"strings"` to its import block):

```go
// Snapshot returns a stable, human-readable dump of the whole logical state.
// It is the assertion target for the seeded replay test and the fastest way to
// see what the engine actually did. Empty cells print as '.', filled cells as
// the letter of the kind that filled them.
func (g *Game) Snapshot() string {
	var b strings.Builder
	hold := "-"
	if g.Hold != nil {
		hold = string(g.Hold.Letter())
	}
	next := make([]byte, 0, len(g.Next))
	for _, k := range g.Next {
		next = append(next, k.Letter())
	}
	fmt.Fprintf(&b, "seed: %d\n", g.Seed)
	fmt.Fprintf(&b, "state: %s\n", g.State)
	fmt.Fprintf(&b, "score: %d\n", g.Score)
	fmt.Fprintf(&b, "lines: %d\n", g.Lines)
	fmt.Fprintf(&b, "level: %d\n", g.Level)
	fmt.Fprintf(&b, "combo: %d\n", g.Combo)
	fmt.Fprintf(&b, "active: %c r%d (%d,%d)\n", g.Active.Kind.Letter(), g.Active.Rotation&3, g.Active.X, g.Active.Y)
	fmt.Fprintf(&b, "hold: %s canhold: %t\n", hold, g.CanHold)
	fmt.Fprintf(&b, "next: %s\n", next)
	fmt.Fprintf(&b, "bagremaining: %d\n", g.Bag.Remaining())
	b.WriteString("board:\n")
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			c := g.CellAt(x, y)
			if c.Filled() {
				b.WriteByte(c.Kind().Letter())
			} else {
				b.WriteByte('.')
			}
		}
		b.WriteByte('\n')
	}
	return b.String()
}

// CellAt returns the board cell at (x, y). It exists so Snapshot and the
// renderer read the board through one accessor.
func (g *Game) CellAt(x, y int) Cell { return g.Board.At(x, y) }
```

- [ ] **Step 4: Record the golden file and inspect it**

```bash
go test ./internal/game/ -run TestReplayMatchesGolden -update
cat internal/game/testdata/replay-8675309.golden
```

Read the output. It must be a plausible mid-game state: `state: Playing` or `Over`, a non-negative score, a `board:` block of 22 lines of 10 characters, and a stack that looks like pieces were dropped (debris near the bottom, not scattered floating cells). If the board looks impossible, the bug is in the engine, not the golden file — fix the engine and re-record.

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/game/ -v -run 'TestSnapshot|TestReplay'`
Expected: PASS, 6 tests.

- [ ] **Step 6: Run the whole package with the race detector**

Run: `go test ./internal/game/ -race -count=2`
Expected: PASS. `-count=2` catches state accidentally held in package-level variables.

- [ ] **Step 7: Commit**

```bash
gofmt -l .
git add internal/game/game.go internal/game/replay_test.go internal/game/testdata/replay-8675309.golden
git commit -m "test(game): snapshot dump and seeded replay determinism test"
```

---

### Task 14: Engine documentation and Phase 1 gate

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Modify: `internal/game/game.go` (package-level doc only if anything is missing)

**Interfaces:**
- Consumes: the whole engine.
- Produces: nothing new in code. This task is the gate design §42 puts at the end of Phase 1 — "tests must pass before proceeding".

- [ ] **Step 1: Verify the Phase 1 checklist**

Run each and confirm:

```bash
go vet ./...
go test ./... -race
gofmt -l .
go doc ./internal/game
```

Expected: `go vet` silent, tests PASS, `gofmt -l` prints nothing, `go doc` lists `Advance`, `Apply`, `Board`, `Event`, `Game`, `New`, `Piece`, `Snapshot` with doc comments. Any exported identifier without a doc comment gets one now.

- [ ] **Step 2: Confirm the engine is clean of clocks and outside dependencies**

```bash
grep -rn 'time.Now\|os\.\|fmt.Print\|log\.' internal/game/*.go | grep -v _test.go
```

Expected: no output. (`fmt.Fprintf` into a `strings.Builder` in `Snapshot` is fine; `fmt.Print*` to stdout is not.) If anything is listed, remove it — design §49.2 and the global constraints forbid it.

- [ ] **Step 3: Write the README**

Create `README.md`:

```markdown
# Cosmic Tetris

A falling-block puzzle game occurring during a completely unnecessary
cosmological emergency. Runs entirely in your terminal.

```
cosmic-tetris
cosmic-tetris --seed 1234
cosmic-tetris --ascii
cosmic-tetris --no-fx
cosmic-tetris --reduced-motion
```

## Layout

```
cmd/cosmic-tetris/   the binary
internal/game/       the rules engine: deterministic, headless, no clock
internal/app/        Bubble Tea model, update loop, key map
internal/render/     everything that turns state into terminal cells
internal/fx/         the spectacle: particles, starfield, shockwaves
internal/flavor/     mission control's commentary
```

## The engine

`internal/game` is deliberately boring and completely deterministic. It never
reads a clock. Elapsed time arrives through `Advance(dt)` and player actions
through `Apply(Input)`; both report what happened as `[]Event`. The same seed
plus the same input and timing stream always reproduces the same state, which
`internal/game/replay_test.go` asserts against a recorded golden file.

The engine owns one random generator, used only by the seven-bag. The effects
system owns a separate one, so particle randomness can never shift piece order.

Effects observe game events. They never write back.

```bash
go test ./...                                  # everything
go test ./internal/game -run TestReplay -v     # determinism
go test ./internal/game -update                # re-record the replay golden
```

## Design

`design.md` is the build spec. Section 49 pins the decisions that earlier
sections left open; where they disagree, section 49 wins.
```

- [ ] **Step 4: Add the license**

```bash
curl -sL https://raw.githubusercontent.com/anthropics/.github/main/LICENSE -o /dev/null 2>/dev/null || true
```

That fetch is not required. Write `LICENSE` directly as the MIT license text with `Copyright (c) 2026 Jesse Vincent`, taken from https://opensource.org/license/mit — the standard 21-line MIT text, unmodified apart from the copyright line.

- [ ] **Step 5: Commit**

```bash
gofmt -l .
git add README.md LICENSE internal/game/
git commit -m "docs: README and license; Phase 1 engine gate passed"
```

- [ ] **Step 6: Report the gate**

State plainly whether every Phase 1 item in design §42 is covered and tested: pieces, board, bag, movement, rotation, gravity, locking, line clearing, hold, scoring, game over. If any is not, say so rather than proceeding to Plan 2.

---

## Notes for the next plan

Plan 2 (`plans/2026-09-17-cosmic-tetris-2-terminal.md`) builds the playable terminal on top of this package. The contract it depends on:

```go
g := game.New(seed)                  // *game.Game
evs := g.Apply(game.InputLeft)       // []game.Event
evs = g.Advance(16 * time.Millisecond)
g.Ghost()                            // game.Piece at its landing position
g.Board.At(x, y)                     // game.Cell
g.Active, g.Hold, g.Next             // game.Piece, *game.PieceKind, []game.PieceKind
g.Score, g.Lines, g.Level, g.Combo, g.State, g.Seed
game.Width, game.Height, game.VisibleHeight, game.HiddenRows
game.Offsets[kind][rotation]         // for drawing HOLD and NEXT previews
```

Nothing in Plan 2 or Plan 3 may add a `time.Now()` call to `internal/game`, and nothing may give `internal/game` a second random generator.
