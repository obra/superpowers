# Cosmic Tetris — Plan 1: Deterministic Game Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the headless, deterministic falling-block engine in `internal/game` — pieces, board, 7-bag, movement, rotation with kicks, gravity, locking, line clearing, hold, scoring, game over — with comprehensive unit tests and a seeded replay test.

**Architecture:** One package, `internal/game`, with no dependencies outside the standard library. The engine never reads a clock: `Advance(dt time.Duration) []Event` is the only way time moves. Every mutator returns a slice of `Event` values describing what happened; the engine itself renders nothing and knows nothing about terminals. The board is a fixed-size array (10×22, top two rows hidden), and the game owns a single `*rand.Rand` that drives only the 7-bag.

**Tech Stack:** Go 1.26, standard library only (`math/rand/v2`, `time`, `testing`).

**Spec:** `design.md` (this repo root). Sections implemented here: §5, §6, §7, §11, §12, §13, §34, §35, §40 (engine portions), §42 Phase 1, §49.1, §49.2, §49.6.

## Global Constraints

- Language: Go. Module path: `cosmic-tetris`. Toolchain present: `go1.26.1`.
- Board: `width 10`, `height 22`, `visible rows 20`, `hidden spawn rows 2`.
- Nothing under `internal/game` may call `time.Now()` or any other clock (§49.2). `dt` is always an input.
- Game RNG drives the 7-bag and nothing else. FX randomness lives in a different generator in a different package (§49.6).
- Gravity: `interval = 800ms * 0.86^(level-1)`, clamped at `60ms`. Level increases every `10` cleared lines.
- Lock delay `500ms`; `max lock resets = 15`.
- Line scores: `1→100×level`, `2→300×level`, `3→500×level`, `4→800×level`. Soft drop `+1 point/cell`, hard drop `+2 points/cell`.
- Combo bonus: `bonus = 50 × (combo - 1) × level`; first clearing placement sets combo to 1; a placement that clears nothing resets combo to 0 (§49.1).
- Wall-kick offsets, tried in exactly this order: `(0,0) (-1,0) (1,0) (-2,0) (2,0) (0,-1) (-1,-1) (1,-1)` (§7).
- The engine is not allowed to depend on `internal/render`, `internal/fx`, `internal/app`, or `internal/flavor`. Those depend on it.

## Review Focus

These are the inputs the spec implies but never names. Each line's test is assigned to the task that owns the code.

1. **A huge `dt`** (laptop sleep, terminal suspend, debugger pause) must not fast-forward through several lock cycles or spin forever — one `Advance` locks at most one piece. → Task 8.
2. **`dt <= 0`** (zero or negative elapsed time from a jittery clock) must be a no-op, not a backwards step. → Task 8.
3. **Non-contiguous cleared rows** (a clear with an occupied gap row between two full rows) must collapse correctly, not shift the gap row into the wrong place. → Task 2.
4. **Rotation near the ceiling**, where a kick offset pushes cells to `y < 0`, must not index out of bounds — above the ceiling is empty space, not a wall. → Task 7.
5. **Every input after game over** (`MoveLeft`, `RotateCW`, `HardDrop`, `UseHold`, `SoftDrop`, `Advance`) must be an inert no-op that leaves score, board, and piece untouched. → Task 12.

---

### Task 1: Module scaffold, geometry, cells, and board access

**Files:**
- Create: `go.mod`
- Create: `LICENSE`
- Create: `.gitignore`
- Create: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces: `game.Width`, `game.Height`, `game.HiddenRows`, `game.VisibleRows` (int consts); `type Cell uint8`, `Empty Cell`, `func CellOf(k PieceKind) Cell`, `func (c Cell) Filled() bool`, `func (c Cell) Kind() PieceKind`; `type Point struct{ X, Y int }`; `type Board struct{ Cells [Height][Width]Cell }` with `At`, `Set`, `InBounds`, `Blocked`.

Coordinate convention used by every later task: `y = 0` is the top row, `y = Height-1` the bottom. Rows `0` and `1` are the hidden spawn rows; rows `2..21` are the 20 visible rows. `x = 0` is the left wall.

- [ ] **Step 1: Create the module and repo files**

```bash
cd "$(git rev-parse --show-toplevel)"
go mod init cosmic-tetris
printf 'cosmic-tetris\ncosmic-tetris.exe\n' > .gitignore
```

Write `LICENSE` as the MIT license text with `Copyright (c) 2026 Jesse Vincent`.

- [ ] **Step 2: Write the failing test**

Create `internal/game/board_test.go`:

```go
package game

import "testing"

func TestBoardGeometry(t *testing.T) {
	if Width != 10 || Height != 22 || HiddenRows != 2 || VisibleRows != 20 {
		t.Fatalf("geometry drifted: %d %d %d %d", Width, Height, HiddenRows, VisibleRows)
	}
}

func TestCellRoundTrip(t *testing.T) {
	if Empty.Filled() {
		t.Error("empty cell reports filled")
	}
	for k := KindI; k <= KindZ; k++ {
		c := CellOf(k)
		if !c.Filled() {
			t.Errorf("CellOf(%v) not filled", k)
		}
		if got := c.Kind(); got != k {
			t.Errorf("CellOf(%v).Kind() = %v", k, got)
		}
	}
}

func TestBoardSetAndAt(t *testing.T) {
	var b Board
	b.Set(3, 5, CellOf(KindT))
	if b.At(3, 5) != CellOf(KindT) {
		t.Error("Set/At round trip failed")
	}
	if b.At(4, 5) != Empty {
		t.Error("neighbour cell was written")
	}
	// Out-of-range access must not panic.
	b.Set(-1, 5, CellOf(KindT))
	b.Set(Width, 5, CellOf(KindT))
	b.Set(3, Height, CellOf(KindT))
	if b.At(-1, -1) != Empty || b.At(Width, Height) != Empty {
		t.Error("out-of-range At returned a filled cell")
	}
}

func TestBoardBlocked(t *testing.T) {
	var b Board
	cases := []struct {
		name    string
		x, y    int
		blocked bool
	}{
		{"left wall", -1, 10, true},
		{"right wall", Width, 10, true},
		{"floor", 0, Height, true},
		{"above ceiling is open space", 4, -3, false},
		{"empty cell", 4, 10, false},
	}
	for _, tc := range cases {
		if got := b.Blocked(tc.x, tc.y); got != tc.blocked {
			t.Errorf("%s: Blocked(%d,%d) = %v, want %v", tc.name, tc.x, tc.y, got, tc.blocked)
		}
	}
	b.Set(4, 10, CellOf(KindO))
	if !b.Blocked(4, 10) {
		t.Error("occupied cell not blocked")
	}
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestBoard|TestCell' -v`
Expected: FAIL — the package does not compile (`undefined: Width`, `undefined: KindI`).

- [ ] **Step 4: Write the geometry, cell, and board code**

Create `internal/game/board.go`:

```go
// Package game implements the Cosmic Tetris rules engine. It is headless and
// deterministic: it renders nothing, and it never reads a clock. Time enters
// only through Advance(dt).
package game

// Board geometry. Rows 0 and 1 are the hidden spawn rows; rows 2..21 are the
// 20 visible rows. y grows downward, x grows rightward.
const (
	Width       = 10
	Height      = 22
	HiddenRows  = 2
	VisibleRows = Height - HiddenRows
)

// Point is an integer board coordinate.
type Point struct {
	X, Y int
}

// Cell is one board square: Empty, or a piece kind plus one.
type Cell uint8

// Empty is an unoccupied board square.
const Empty Cell = 0

// CellOf returns the cell value that records a locked block of kind k.
func CellOf(k PieceKind) Cell { return Cell(k) + 1 }

// Filled reports whether the cell holds a block.
func (c Cell) Filled() bool { return c != Empty }

// Kind returns the piece kind that filled the cell. Only meaningful when
// Filled reports true.
func (c Cell) Kind() PieceKind { return PieceKind(c - 1) }

// Board holds the locked blocks. The active piece is not part of the board
// until it locks.
type Board struct {
	Cells [Height][Width]Cell
}

// InBounds reports whether (x, y) is inside the playfield array.
func (b *Board) InBounds(x, y int) bool {
	return x >= 0 && x < Width && y >= 0 && y < Height
}

// At returns the cell at (x, y), or Empty when out of range.
func (b *Board) At(x, y int) Cell {
	if !b.InBounds(x, y) {
		return Empty
	}
	return b.Cells[y][x]
}

// Set writes a cell, ignoring out-of-range coordinates.
func (b *Board) Set(x, y int, c Cell) {
	if !b.InBounds(x, y) {
		return
	}
	b.Cells[y][x] = c
}

// Blocked reports whether a piece cell may not occupy (x, y). Walls and the
// floor block; space above the ceiling does not, so pieces may rotate and
// spawn with cells above row 0.
func (b *Board) Blocked(x, y int) bool {
	if x < 0 || x >= Width || y >= Height {
		return true
	}
	if y < 0 {
		return false
	}
	return b.Cells[y][x].Filled()
}
```

- [ ] **Step 5: Add the piece-kind stub so the package compiles**

Create `internal/game/piece.go` with only the kind enum for now; Task 3 fills in the shapes.

```go
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

// String returns the single-letter name of the piece kind.
func (k PieceKind) String() string {
	if int(k) >= KindCount {
		return "?"
	}
	return [KindCount]string{"I", "J", "L", "O", "S", "T", "Z"}[k]
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `go test ./internal/game/ -run 'TestBoard|TestCell' -v && go vet ./...`
Expected: PASS, vet clean.

- [ ] **Step 7: Commit**

```bash
git add go.mod LICENSE .gitignore internal/game/board.go internal/game/piece.go internal/game/board_test.go
git commit -m "feat(game): board geometry, cells, and collision queries"
```

---

### Task 2: Row completion, clearing, and collapse

**Files:**
- Modify: `internal/game/board.go` (append)
- Test: `internal/game/board_clear_test.go`

**Interfaces:**
- Consumes: `Board`, `Cell`, `CellOf`, `Width`, `Height` from Task 1.
- Produces: `func (b *Board) CompleteRows() []int` (full row indices, topmost first); `type ClearedRow struct { Y int; Cells [Width]Cell }`; `func (b *Board) Snapshot(rows []int) []ClearedRow`; `func (b *Board) ClearRows(rows []int)`.

`Snapshot` exists so the FX layer (Plan 3) can animate a supernova on rows the engine has already removed, without ever holding a reference into live board state.

- [ ] **Step 1: Write the failing test**

Create `internal/game/board_clear_test.go`:

```go
package game

import (
	"reflect"
	"testing"
)

// fillRow fills an entire row with the given kind.
func fillRow(b *Board, y int, k PieceKind) {
	for x := 0; x < Width; x++ {
		b.Set(x, y, CellOf(k))
	}
}

func TestCompleteRows(t *testing.T) {
	var b Board
	fillRow(&b, 21, KindI)
	fillRow(&b, 19, KindT)
	b.Set(0, 20, CellOf(KindO)) // partial row, must not count

	got := b.CompleteRows()
	want := []int{19, 21}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("CompleteRows() = %v, want %v", got, want)
	}
}

func TestCompleteRowsEmptyBoard(t *testing.T) {
	var b Board
	if rows := b.CompleteRows(); len(rows) != 0 {
		t.Fatalf("empty board reported complete rows: %v", rows)
	}
}

func TestSnapshotCapturesContentsBeforeClear(t *testing.T) {
	var b Board
	fillRow(&b, 21, KindS)
	snap := b.Snapshot([]int{21})
	b.ClearRows([]int{21})

	if len(snap) != 1 || snap[0].Y != 21 {
		t.Fatalf("snapshot = %+v", snap)
	}
	if snap[0].Cells[0] != CellOf(KindS) {
		t.Error("snapshot lost the row contents")
	}
	if b.At(0, 21) != Empty {
		t.Error("row was not cleared")
	}
}

func TestClearRowsCollapsesStackDown(t *testing.T) {
	var b Board
	fillRow(&b, 21, KindI)         // full, will clear
	b.Set(3, 20, CellOf(KindT))    // lone block above it
	b.ClearRows([]int{21})

	if b.At(3, 20) != Empty {
		t.Error("block did not fall out of row 20")
	}
	if b.At(3, 21) != CellOf(KindT) {
		t.Error("block did not land in row 21")
	}
}

// Review Focus item 3: two full rows with an occupied, non-full row between
// them. The middle row must end up directly on the floor, and nothing may be
// duplicated.
func TestClearRowsNonContiguous(t *testing.T) {
	var b Board
	fillRow(&b, 21, KindI) // full
	b.Set(5, 20, CellOf(KindT))
	b.Set(6, 20, CellOf(KindT)) // partial gap row
	fillRow(&b, 19, KindZ)      // full
	b.Set(0, 18, CellOf(KindL)) // survivor above everything

	b.ClearRows([]int{19, 21})

	if b.At(5, 21) != CellOf(KindT) || b.At(6, 21) != CellOf(KindT) {
		t.Errorf("gap row did not settle on the floor: row21=%v", b.Cells[21])
	}
	if b.At(0, 20) != CellOf(KindL) {
		t.Errorf("survivor landed wrong: row20=%v", b.Cells[20])
	}
	for y := 0; y <= 19; y++ {
		for x := 0; x < Width; x++ {
			if y == 20 && x == 0 {
				continue
			}
			if b.At(x, y).Filled() {
				t.Fatalf("stale block left at (%d,%d)", x, y)
			}
		}
	}
}

func TestClearRowsIgnoresOutOfRangeIndices(t *testing.T) {
	var b Board
	fillRow(&b, 21, KindI)
	b.ClearRows([]int{-1, 21, Height + 4}) // must not panic
	if b.At(0, 21).Filled() {
		t.Error("row 21 should have cleared")
	}
}

func TestClearAllFourRows(t *testing.T) {
	var b Board
	for y := 18; y <= 21; y++ {
		fillRow(&b, y, KindI)
	}
	b.ClearRows([]int{18, 19, 20, 21})
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if b.At(x, y).Filled() {
				t.Fatalf("board not empty at (%d,%d)", x, y)
			}
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestCompleteRows|TestSnapshot|TestClear' -v`
Expected: FAIL — `b.CompleteRows undefined`, `b.Snapshot undefined`, `b.ClearRows undefined`.

- [ ] **Step 3: Implement row completion and collapse**

Append to `internal/game/board.go`:

```go
// ClearedRow is a copy of one row taken just before it was removed. The FX
// layer animates from these copies; the engine has already moved on.
type ClearedRow struct {
	Y     int
	Cells [Width]Cell
}

// CompleteRows returns the indices of every fully occupied row, topmost first.
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

// Snapshot copies the given rows before they are cleared.
func (b *Board) Snapshot(rows []int) []ClearedRow {
	out := make([]ClearedRow, 0, len(rows))
	for _, y := range rows {
		if y < 0 || y >= Height {
			continue
		}
		out = append(out, ClearedRow{Y: y, Cells: b.Cells[y]})
	}
	return out
}

// ClearRows removes the given rows and collapses everything above them
// downward. Row indices may arrive in any order and need not be contiguous;
// out-of-range indices are ignored.
func (b *Board) ClearRows(rows []int) {
	var drop [Height]bool
	for _, y := range rows {
		if y >= 0 && y < Height {
			drop[y] = true
		}
	}
	dst := Height - 1
	for src := Height - 1; src >= 0; src-- {
		if drop[src] {
			continue
		}
		b.Cells[dst] = b.Cells[src]
		dst--
	}
	for ; dst >= 0; dst-- {
		b.Cells[dst] = [Width]Cell{}
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS (all tests so far).

- [ ] **Step 5: Commit**

```bash
git add internal/game/board.go internal/game/board_clear_test.go
git commit -m "feat(game): row completion, snapshot, and non-contiguous collapse"
```

---

### Task 3: Piece shapes, four rotations, and spawn position

**Files:**
- Modify: `internal/game/piece.go`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `Point` from Tasks 1.
- Produces: `type Piece struct { Kind PieceKind; Rotation, X, Y int }`; `func (p Piece) Cells() [4]Point` (absolute board coordinates); `func (p Piece) Normalized() [4]Point` (offsets within the 4×4 box, for previews); `func SpawnPiece(k PieceKind) Piece`; consts `SpawnX = 3`, `SpawnY = 0`.

Shapes are written as 4 rows of 4 characters per rotation so a human can read them. Rotation index 0 is the spawn orientation; index 1 is one clockwise turn from it.

- [ ] **Step 1: Write the failing test**

Create `internal/game/piece_test.go`:

```go
package game

import "testing"

func TestEveryRotationHasFourCells(t *testing.T) {
	for k := KindI; k <= KindZ; k++ {
		for r := 0; r < 4; r++ {
			p := Piece{Kind: k, Rotation: r}
			seen := map[Point]bool{}
			for _, c := range p.Normalized() {
				if c.X < 0 || c.X > 3 || c.Y < 0 || c.Y > 3 {
					t.Errorf("%v r%d: cell %v outside the 4x4 box", k, r, c)
				}
				if seen[c] {
					t.Errorf("%v r%d: duplicate cell %v", k, r, c)
				}
				seen[c] = true
			}
			if len(seen) != 4 {
				t.Errorf("%v r%d: %d distinct cells, want 4", k, r, len(seen))
			}
		}
	}
}

func TestORotationIsIdentical(t *testing.T) {
	base := Piece{Kind: KindO, Rotation: 0}.Normalized()
	for r := 1; r < 4; r++ {
		if Piece{Kind: KindO, Rotation: r}.Normalized() != base {
			t.Errorf("O rotation %d differs from spawn rotation", r)
		}
	}
}

func TestSpawnRotationShapes(t *testing.T) {
	// Spot-check the spawn orientation of each family against the spec's
	// standard silhouettes.
	want := map[PieceKind][4]Point{
		KindI: {{0, 1}, {1, 1}, {2, 1}, {3, 1}},
		KindJ: {{0, 0}, {0, 1}, {1, 1}, {2, 1}},
		KindL: {{2, 0}, {0, 1}, {1, 1}, {2, 1}},
		KindO: {{1, 0}, {2, 0}, {1, 1}, {2, 1}},
		KindS: {{1, 0}, {2, 0}, {0, 1}, {1, 1}},
		KindT: {{1, 0}, {0, 1}, {1, 1}, {2, 1}},
		KindZ: {{0, 0}, {1, 0}, {1, 1}, {2, 1}},
	}
	for k, w := range want {
		if got := (Piece{Kind: k}).Normalized(); got != w {
			t.Errorf("%v spawn shape = %v, want %v", k, got, w)
		}
	}
}

func TestCellsAreAbsolute(t *testing.T) {
	p := Piece{Kind: KindT, Rotation: 0, X: 4, Y: 7}
	want := [4]Point{{5, 7}, {4, 8}, {5, 8}, {6, 8}}
	if got := p.Cells(); got != want {
		t.Fatalf("Cells() = %v, want %v", got, want)
	}
}

func TestSpawnPositionSitsInHiddenRows(t *testing.T) {
	for k := KindI; k <= KindZ; k++ {
		p := SpawnPiece(k)
		if p.Rotation != 0 || p.X != SpawnX || p.Y != SpawnY {
			t.Errorf("%v spawned at %+v", k, p)
		}
		for _, c := range p.Cells() {
			if c.Y >= HiddenRows {
				t.Errorf("%v spawns with cell %v in the visible area", k, c)
			}
			if c.X < 0 || c.X >= Width {
				t.Errorf("%v spawns off the board at %v", k, c)
			}
		}
	}
}

func TestClockwiseRotationCycles(t *testing.T) {
	// Rotating clockwise four times returns the spawn silhouette.
	for k := KindI; k <= KindZ; k++ {
		if (Piece{Kind: k, Rotation: 4 % 4}).Normalized() != (Piece{Kind: k}).Normalized() {
			t.Errorf("%v: rotation index does not wrap", k)
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'Rotation|Spawn|Cells' -v`
Expected: FAIL — `p.Normalized undefined`, `undefined: SpawnPiece`.

- [ ] **Step 3: Write the shape tables and piece methods**

Replace `internal/game/piece.go` with:

```go
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

// String returns the single-letter name of the piece kind.
func (k PieceKind) String() string {
	if int(k) >= KindCount {
		return "?"
	}
	return [KindCount]string{"I", "J", "L", "O", "S", "T", "Z"}[k]
}

// Spawn position: the top-left corner of the piece's 4x4 box. X=3 centres the
// three-wide families over columns 3..5 and I over columns 3..6; Y=0 keeps
// every spawn silhouette inside the two hidden rows.
const (
	SpawnX = 3
	SpawnY = 0
)

// shapeRows describes all four rotations of all seven families as 4x4
// character grids. Rotation 0 is the spawn orientation; rotation 1 is one
// clockwise turn from it. 'X' marks an occupied cell.
var shapeRows = [KindCount][4][4]string{
	KindI: {
		{"....", "XXXX", "....", "...."},
		{"..X.", "..X.", "..X.", "..X."},
		{"....", "....", "XXXX", "...."},
		{".X..", ".X..", ".X..", ".X.."},
	},
	KindJ: {
		{"X...", "XXX.", "....", "...."},
		{".XX.", ".X..", ".X..", "...."},
		{"....", "XXX.", "..X.", "...."},
		{".X..", ".X..", "XX..", "...."},
	},
	KindL: {
		{"..X.", "XXX.", "....", "...."},
		{".X..", ".X..", ".XX.", "...."},
		{"....", "XXX.", "X...", "...."},
		{"XX..", ".X..", ".X..", "...."},
	},
	KindO: {
		{".XX.", ".XX.", "....", "...."},
		{".XX.", ".XX.", "....", "...."},
		{".XX.", ".XX.", "....", "...."},
		{".XX.", ".XX.", "....", "...."},
	},
	KindS: {
		{".XX.", "XX..", "....", "...."},
		{".X..", ".XX.", "..X.", "...."},
		{"....", ".XX.", "XX..", "...."},
		{"X...", "XX..", ".X..", "...."},
	},
	KindT: {
		{".X..", "XXX.", "....", "...."},
		{".X..", ".XX.", ".X..", "...."},
		{"....", "XXX.", ".X..", "...."},
		{".X..", "XX..", ".X..", "...."},
	},
	KindZ: {
		{"XX..", ".XX.", "....", "...."},
		{"..X.", ".XX.", ".X..", "...."},
		{"....", "XX..", ".XX.", "...."},
		{".X..", "XX..", "X...", "...."},
	},
}

// shapes is shapeRows compiled into offsets, in reading order.
var shapes = func() [KindCount][4][4]Point {
	var out [KindCount][4][4]Point
	for k := range shapeRows {
		for r := range shapeRows[k] {
			n := 0
			for y, row := range shapeRows[k][r] {
				for x, ch := range row {
					if ch != 'X' {
						continue
					}
					if n == 4 {
						panic("cosmic-tetris: shape table has more than four cells")
					}
					out[k][r][n] = Point{X: x, Y: y}
					n++
				}
			}
			if n != 4 {
				panic("cosmic-tetris: shape table has fewer than four cells")
			}
		}
	}
	return out
}()

// Piece is the active tetromino: a family, a rotation index, and the board
// position of its 4x4 box's top-left corner.
type Piece struct {
	Kind     PieceKind
	Rotation int
	X        int
	Y        int
}

// Normalized returns the piece's cells as offsets inside its 4x4 box. Useful
// for HOLD and NEXT previews, which have no board position.
func (p Piece) Normalized() [4]Point {
	return shapes[p.Kind][((p.Rotation%4)+4)%4]
}

// Cells returns the piece's four cells in absolute board coordinates.
func (p Piece) Cells() [4]Point {
	var out [4]Point
	for i, o := range p.Normalized() {
		out[i] = Point{X: p.X + o.X, Y: p.Y + o.Y}
	}
	return out
}

// SpawnPiece returns a piece of kind k in its spawn rotation and position.
func SpawnPiece(k PieceKind) Piece {
	return Piece{Kind: k, Rotation: 0, X: SpawnX, Y: SpawnY}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): tetromino shape tables, rotations, and spawn position"
```

---

### Task 4: Seeded 7-bag

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `KindCount`.
- Produces: `type Bag struct{...}`; `func NewBag(rng *rand.Rand) *Bag`; `func (b *Bag) Next() PieceKind`; `func NewRNG(seed int64) *rand.Rand`.

`NewRNG` centralises seeding so the engine and any test build the same generator from the same `int64`. It uses `math/rand/v2`'s PCG source, which is reproducible across platforms and Go versions.

- [ ] **Step 1: Write the failing test**

Create `internal/game/bag_test.go`:

```go
package game

import "testing"

func TestEachBagContainsAllSevenKindsOnce(t *testing.T) {
	b := NewBag(NewRNG(42))
	for bagIndex := 0; bagIndex < 20; bagIndex++ {
		counts := map[PieceKind]int{}
		for i := 0; i < KindCount; i++ {
			counts[b.Next()]++
		}
		if len(counts) != KindCount {
			t.Fatalf("bag %d drew %d distinct kinds: %v", bagIndex, len(counts), counts)
		}
		for k, n := range counts {
			if n != 1 {
				t.Fatalf("bag %d drew %v %d times", bagIndex, k, n)
			}
		}
	}
}

func TestSeededBagIsReproducible(t *testing.T) {
	draw := func(seed int64) []PieceKind {
		b := NewBag(NewRNG(seed))
		out := make([]PieceKind, 0, 30)
		for i := 0; i < 30; i++ {
			out = append(out, b.Next())
		}
		return out
	}
	a, b := draw(8675309), draw(8675309)
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("same seed diverged at draw %d: %v vs %v", i, a[i], b[i])
		}
	}
	if c := draw(1); equalKinds(a, c) {
		t.Error("different seeds produced identical sequences")
	}
}

func equalKinds(a, b []PieceKind) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func TestBagShuffles(t *testing.T) {
	// Over many bags, the first draw should not always be the same kind.
	b := NewBag(NewRNG(7))
	first := map[PieceKind]bool{}
	for i := 0; i < 40; i++ {
		first[b.Next()] = true
		for j := 1; j < KindCount; j++ {
			b.Next()
		}
	}
	if len(first) < 3 {
		t.Errorf("bag looks unshuffled: only %d distinct opening kinds", len(first))
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'Bag' -v`
Expected: FAIL — `undefined: NewBag`, `undefined: NewRNG`.

- [ ] **Step 3: Implement the bag**

Create `internal/game/bag.go`:

```go
package game

import "math/rand/v2"

// rngStreamB is the second PCG word. It is a fixed constant so that a given
// int64 seed always builds the same generator.
const rngStreamB = 0x9E3779B97F4A7C15

// NewRNG builds the game's random source from a seed. All engine randomness
// comes from here, and only the 7-bag consumes it.
func NewRNG(seed int64) *rand.Rand {
	return rand.New(rand.NewPCG(uint64(seed), rngStreamB))
}

// Bag is a 7-bag piece generator: every family appears exactly once per bag,
// in a shuffled order.
type Bag struct {
	rng   *rand.Rand
	queue []PieceKind
}

// NewBag returns a bag that draws from rng.
func NewBag(rng *rand.Rand) *Bag {
	return &Bag{rng: rng, queue: make([]PieceKind, 0, KindCount)}
}

// Next returns the next piece kind, refilling and reshuffling when the bag
// empties.
func (b *Bag) Next() PieceKind {
	if len(b.queue) == 0 {
		b.refill()
	}
	k := b.queue[len(b.queue)-1]
	b.queue = b.queue[:len(b.queue)-1]
	return k
}

func (b *Bag) refill() {
	b.queue = b.queue[:0]
	for k := KindI; k < KindCount; k++ {
		b.queue = append(b.queue, k)
	}
	b.rng.Shuffle(len(b.queue), func(i, j int) {
		b.queue[i], b.queue[j] = b.queue[j], b.queue[i]
	})
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag piece generator"
```

---

### Task 5: Game construction, events, and the next queue

**Files:**
- Create: `internal/game/events.go`
- Create: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces:
  - `type EventKind uint8` with `EventPieceMoved`, `EventPieceRotated`, `EventPieceHardDropped`, `EventPieceLocked`, `EventHoldUsed`, `EventLinesCleared`, `EventComboChanged`, `EventLevelChanged`, `EventPieceSpawned`, `EventGameOver`; `func (k EventKind) String() string`.
  - `type Event struct { Kind EventKind; Piece Piece; Cleared []ClearedRow; Count int; Points int }`.
  - `type Game struct { Board Board; Active Piece; Hold *PieceKind; CanHold bool; Next []PieceKind; Score, Lines, Level, Combo int; GravityAccumulator, LockAccumulator time.Duration; Over bool; Seed int64 }` plus unexported `bag`, `rng`, `lockResets`, `events`.
  - `const NextCount = 5`; `func New(seed int64) *Game`; `func (g *Game) Collides(p Piece) bool`; `func (g *Game) CanFall() bool`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/game_test.go`:

```go
package game

import "testing"

func TestNewGameInitialState(t *testing.T) {
	g := New(99)
	if g.Level != 1 {
		t.Errorf("Level = %d, want 1", g.Level)
	}
	if g.Score != 0 || g.Lines != 0 || g.Combo != 0 {
		t.Errorf("counters not zeroed: %+v", g)
	}
	if !g.CanHold {
		t.Error("CanHold should start true")
	}
	if g.Hold != nil {
		t.Error("Hold should start empty")
	}
	if g.Over {
		t.Error("game should not start over")
	}
	if g.Seed != 99 {
		t.Errorf("Seed = %d, want 99", g.Seed)
	}
	if len(g.Next) != NextCount {
		t.Fatalf("len(Next) = %d, want %d", len(g.Next), NextCount)
	}
	if g.Active.X != SpawnX || g.Active.Y != SpawnY || g.Active.Rotation != 0 {
		t.Errorf("active piece not at spawn: %+v", g.Active)
	}
}

func TestNewGameIsSeedReproducible(t *testing.T) {
	a, b := New(1234), New(1234)
	if a.Active.Kind != b.Active.Kind {
		t.Fatal("same seed produced different first pieces")
	}
	for i := range a.Next {
		if a.Next[i] != b.Next[i] {
			t.Fatalf("same seed produced different queues at %d", i)
		}
	}
}

func TestCollidesAndCanFall(t *testing.T) {
	g := New(5)
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 3, Y: 19}
	if g.Collides(g.Active) {
		t.Fatal("piece at y=19 should not collide with an empty board")
	}
	if !g.CanFall() {
		t.Fatal("piece at y=19 should be able to fall")
	}
	// O occupies box rows 0-1, so at Y=20 its lowest cells are on row 21, the
	// floor row: it can no longer fall.
	g.Active.Y = 20
	if !g.CanFall() == false {
		// keep the direct assertion below readable
	}
	if g.CanFall() {
		t.Error("piece resting on the floor should not be able to fall")
	}
	// A block directly underneath also stops the fall.
	g.Active.Y = 10
	g.Board.Set(4, 12, CellOf(KindI))
	if g.CanFall() {
		t.Error("piece above a locked block should not be able to fall")
	}
}
```

Remove the empty `if !g.CanFall() == false {}` block when you paste — it is a placeholder artefact; the following assertion is the real check. (Keep the test file free of no-op statements: delete those three lines.)

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestNewGame|TestCollides' -v`
Expected: FAIL — `undefined: New`, `undefined: NextCount`.

- [ ] **Step 3: Write the event types**

Create `internal/game/events.go`:

```go
package game

// EventKind names something the engine did. Events are the only channel
// through which the effects layer learns about gameplay; the effects layer
// never writes back.
type EventKind uint8

// The engine's event kinds.
const (
	EventPieceMoved EventKind = iota
	EventPieceRotated
	EventPieceHardDropped
	EventPieceLocked
	EventPieceSpawned
	EventHoldUsed
	EventLinesCleared
	EventComboChanged
	EventLevelChanged
	EventGameOver
)

// String returns the event kind's name.
func (k EventKind) String() string {
	names := [...]string{
		"PieceMoved", "PieceRotated", "PieceHardDropped", "PieceLocked",
		"PieceSpawned", "HoldUsed", "LinesCleared", "ComboChanged",
		"LevelChanged", "GameOver",
	}
	if int(k) >= len(names) {
		return "Unknown"
	}
	return names[k]
}

// Event describes one thing that happened. Which fields carry meaning depends
// on Kind:
//
//	PieceMoved, PieceRotated, PieceSpawned: Piece is the piece's new state.
//	  Points is 1 for a soft-drop step, 0 otherwise.
//	PieceHardDropped: Piece is the landing position, Count is the number of
//	  cells fallen, Points is the drop score.
//	PieceLocked, HoldUsed: Piece is the outgoing piece.
//	LinesCleared: Cleared holds copies of the removed rows, Count is how many,
//	  Points is the line score plus combo bonus.
//	ComboChanged: Count is the new combo (0 when broken).
//	LevelChanged: Count is the new level.
//	GameOver: no fields.
type Event struct {
	Kind    EventKind
	Piece   Piece
	Cleared []ClearedRow
	Count   int
	Points  int
}
```

- [ ] **Step 4: Write the game struct and construction**

Create `internal/game/game.go`:

```go
package game

import (
	"math/rand/v2"
	"time"
)

// NextCount is how many upcoming pieces the engine keeps visible.
const NextCount = 5

// Game is the whole logical game. Every exported field may be read freely by
// the renderer; only the engine's own methods write them during play. Tests
// and fixtures may set them directly.
type Game struct {
	Board   Board
	Active  Piece
	Hold    *PieceKind
	CanHold bool
	Next    []PieceKind

	Score int
	Lines int
	Level int
	Combo int

	GravityAccumulator time.Duration
	LockAccumulator    time.Duration

	Over bool

	// Seed is recorded for display and restart. Replay state lives in rng.
	Seed int64

	bag        *Bag
	rng        *rand.Rand
	lockResets int
	events     []Event
}

// New starts a game from a seed. The seed fully determines piece order.
func New(seed int64) *Game {
	rng := NewRNG(seed)
	g := &Game{
		Level:   1,
		CanHold: true,
		Seed:    seed,
		rng:     rng,
		bag:     NewBag(rng),
		Next:    make([]PieceKind, 0, NextCount),
		events:  make([]Event, 0, 8),
	}
	for len(g.Next) < NextCount {
		g.Next = append(g.Next, g.bag.Next())
	}
	g.Active = SpawnPiece(g.shiftNext())
	return g
}

// shiftNext pops the head of the next queue and refills the tail from the bag.
func (g *Game) shiftNext() PieceKind {
	k := g.Next[0]
	copy(g.Next, g.Next[1:])
	g.Next[len(g.Next)-1] = g.bag.Next()
	return k
}

// Collides reports whether p overlaps a wall, the floor, or a locked block.
func (g *Game) Collides(p Piece) bool {
	for _, c := range p.Cells() {
		if g.Board.Blocked(c.X, c.Y) {
			return true
		}
	}
	return false
}

// CanFall reports whether the active piece can descend one row.
func (g *Game) CanFall() bool {
	p := g.Active
	p.Y++
	return !g.Collides(p)
}

func (g *Game) emit(e Event) { g.events = append(g.events, e) }

// drain returns the events buffered since the last call. The returned slice is
// a copy, so callers may retain it.
func (g *Game) drain() []Event {
	if len(g.events) == 0 {
		return nil
	}
	out := make([]Event, len(g.events))
	copy(out, g.events)
	g.events = g.events[:0]
	return out
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/game/ -v && go vet ./...`
Expected: PASS, vet clean.

- [ ] **Step 6: Commit**

```bash
git add internal/game/events.go internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game state, event channel, and next queue"
```

---

### Task 6: Horizontal movement and soft drop

**Files:**
- Modify: `internal/game/game.go` (append)
- Test: `internal/game/move_test.go`

**Interfaces:**
- Consumes: `Game`, `Event`, `CanFall`, `Collides`.
- Produces: `func (g *Game) MoveLeft() []Event`, `func (g *Game) MoveRight() []Event`, `func (g *Game) SoftDrop() []Event`, `func (g *Game) touchLockTimer()` (unexported, used by Task 7 and Task 8).

- [ ] **Step 1: Write the failing test**

Create `internal/game/move_test.go`:

```go
package game

import "testing"

// testGame returns a game with a predictable active piece and an empty board.
func testGame(k PieceKind, x, y int) *Game {
	g := New(1)
	g.Active = Piece{Kind: k, Rotation: 0, X: x, Y: y}
	return g
}

func TestMoveLeftAndRight(t *testing.T) {
	g := testGame(KindO, 4, 10)
	if evs := g.MoveLeft(); len(evs) != 1 || evs[0].Kind != EventPieceMoved {
		t.Fatalf("MoveLeft events = %v", evs)
	}
	if g.Active.X != 3 {
		t.Errorf("X = %d, want 3", g.Active.X)
	}
	g.MoveRight()
	if g.Active.X != 4 {
		t.Errorf("X = %d, want 4", g.Active.X)
	}
}

func TestMoveBlockedByWalls(t *testing.T) {
	// O occupies box columns 1-2, so X=-1 puts cells on columns 0-1.
	g := testGame(KindO, -1, 10)
	if evs := g.MoveLeft(); evs != nil {
		t.Errorf("move into the left wall emitted %v", evs)
	}
	if g.Active.X != -1 {
		t.Errorf("piece moved through the wall to X=%d", g.Active.X)
	}
	g = testGame(KindO, 7, 10) // cells on columns 8-9
	if evs := g.MoveRight(); evs != nil {
		t.Errorf("move into the right wall emitted %v", evs)
	}
}

func TestMoveBlockedByLockedBlocks(t *testing.T) {
	g := testGame(KindO, 4, 10)
	g.Board.Set(3, 10, CellOf(KindI))
	if evs := g.MoveLeft(); evs != nil {
		t.Errorf("move into a locked block emitted %v", evs)
	}
	if g.Active.X != 4 {
		t.Error("piece moved into a locked block")
	}
}

func TestSoftDropScoresOnePointPerCell(t *testing.T) {
	g := testGame(KindO, 4, 5)
	evs := g.SoftDrop()
	if len(evs) != 1 || evs[0].Kind != EventPieceMoved || evs[0].Points != 1 {
		t.Fatalf("SoftDrop events = %+v", evs)
	}
	if g.Active.Y != 6 {
		t.Errorf("Y = %d, want 6", g.Active.Y)
	}
	if g.Score != 1 {
		t.Errorf("Score = %d, want 1", g.Score)
	}
	for i := 0; i < 3; i++ {
		g.SoftDrop()
	}
	if g.Score != 4 {
		t.Errorf("Score after 4 soft drops = %d, want 4", g.Score)
	}
}

func TestSoftDropOnFloorDoesNothing(t *testing.T) {
	g := testGame(KindO, 4, 20) // resting on row 21
	if evs := g.SoftDrop(); evs != nil {
		t.Errorf("soft drop on the floor emitted %v", evs)
	}
	if g.Score != 0 {
		t.Error("soft drop on the floor scored points")
	}
}

func TestSoftDropResetsGravityAccumulator(t *testing.T) {
	g := testGame(KindO, 4, 5)
	g.GravityAccumulator = 700 * 1000 * 1000 // 700ms
	g.SoftDrop()
	if g.GravityAccumulator != 0 {
		t.Errorf("GravityAccumulator = %v, want 0", g.GravityAccumulator)
	}
}

func TestGroundedMoveResetsLockTimerUpToTheCap(t *testing.T) {
	g := testGame(KindO, 4, 20) // grounded
	for i := 0; i < MaxLockResets; i++ {
		g.LockAccumulator = 400 * 1000 * 1000 // 400ms
		if i%2 == 0 {
			g.MoveLeft()
		} else {
			g.MoveRight()
		}
		if g.LockAccumulator != 0 {
			t.Fatalf("reset %d did not clear the lock timer", i)
		}
	}
	// The cap is spent: further grounded moves must not reset it again.
	g.LockAccumulator = 400 * 1000 * 1000
	g.MoveLeft()
	if g.LockAccumulator == 0 {
		t.Error("lock timer reset past MaxLockResets")
	}
}

func TestAirborneMoveDoesNotSpendLockResets(t *testing.T) {
	g := testGame(KindO, 4, 5) // airborne
	for i := 0; i < MaxLockResets+5; i++ {
		g.MoveLeft()
		g.MoveRight()
	}
	g.Active.Y = 20 // now ground it
	g.LockAccumulator = 400 * 1000 * 1000
	g.MoveLeft()
	if g.LockAccumulator != 0 {
		t.Error("airborne moves consumed the lock-reset budget")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestMove|TestSoft|TestGrounded|TestAirborne' -v`
Expected: FAIL — `g.MoveLeft undefined`, `undefined: MaxLockResets`.

- [ ] **Step 3: Implement movement**

Append to `internal/game/game.go`:

```go
// Timing and lock rules.
const (
	LockDelay     = 500 * time.Millisecond
	MaxLockResets = 15
)

// MoveLeft shifts the active piece one column left when the move is legal.
func (g *Game) MoveLeft() []Event { return g.shift(-1) }

// MoveRight shifts the active piece one column right when the move is legal.
func (g *Game) MoveRight() []Event { return g.shift(1) }

func (g *Game) shift(dx int) []Event {
	if g.Over {
		return nil
	}
	p := g.Active
	p.X += dx
	if g.Collides(p) {
		return nil
	}
	g.Active = p
	g.touchLockTimer()
	g.emit(Event{Kind: EventPieceMoved, Piece: g.Active})
	return g.drain()
}

// SoftDrop lowers the active piece one row and scores one point. It is a
// no-op when the piece is already grounded.
func (g *Game) SoftDrop() []Event {
	if g.Over || !g.CanFall() {
		return nil
	}
	g.Active.Y++
	g.Score++
	g.GravityAccumulator = 0
	g.emit(Event{Kind: EventPieceMoved, Piece: g.Active, Points: 1})
	return g.drain()
}

// touchLockTimer restarts the lock delay after a successful move or rotation
// made while grounded, up to MaxLockResets times per piece. Airborne moves
// cost nothing, because Advance zeroes the timer while the piece is falling.
func (g *Game) touchLockTimer() {
	if g.CanFall() {
		return
	}
	if g.lockResets >= MaxLockResets {
		return
	}
	g.lockResets++
	g.LockAccumulator = 0
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/move_test.go
git commit -m "feat(game): horizontal movement, soft drop, and lock-reset budget"
```

---

### Task 7: Rotation with wall kicks

**Files:**
- Create: `internal/game/rules.go`
- Test: `internal/game/rotate_test.go`

**Interfaces:**
- Consumes: `Game`, `Piece`, `Collides`, `touchLockTimer`.
- Produces: `var KickOffsets [8]Point`; `func (g *Game) RotateCW() []Event`; `func (g *Game) RotateCCW() []Event`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/rotate_test.go`:

```go
package game

import "testing"

func TestKickOrderMatchesSpec(t *testing.T) {
	want := [8]Point{{0, 0}, {-1, 0}, {1, 0}, {-2, 0}, {2, 0}, {0, -1}, {-1, -1}, {1, -1}}
	if KickOffsets != want {
		t.Fatalf("KickOffsets = %v, want %v", KickOffsets, want)
	}
}

func TestRotateClockwiseAndBack(t *testing.T) {
	g := testGame(KindT, 4, 10)
	if evs := g.RotateCW(); len(evs) != 1 || evs[0].Kind != EventPieceRotated {
		t.Fatalf("RotateCW events = %v", evs)
	}
	if g.Active.Rotation != 1 {
		t.Errorf("Rotation = %d, want 1", g.Active.Rotation)
	}
	g.RotateCCW()
	if g.Active.Rotation != 0 {
		t.Errorf("Rotation = %d, want 0", g.Active.Rotation)
	}
}

func TestRotateCCWWrapsToThree(t *testing.T) {
	g := testGame(KindT, 4, 10)
	g.RotateCCW()
	if g.Active.Rotation != 3 {
		t.Errorf("Rotation = %d, want 3", g.Active.Rotation)
	}
}

func TestRotationKicksOffTheRightWall(t *testing.T) {
	// I in rotation 1 occupies box column 2. Place it so that rotating to the
	// horizontal orientation would poke past the right wall, and check that
	// the piece is nudged left instead of the rotation failing.
	g := testGame(KindI, 7, 10)
	g.Active.Rotation = 1 // vertical, cells on column 9
	if evs := g.RotateCW(); len(evs) == 0 {
		t.Fatal("rotation next to the right wall failed instead of kicking")
	}
	if g.Active.Rotation != 2 {
		t.Errorf("Rotation = %d, want 2", g.Active.Rotation)
	}
	for _, c := range g.Active.Cells() {
		if c.X < 0 || c.X >= Width {
			t.Errorf("kicked piece has cell %v off the board", c)
		}
	}
	if g.Active.X >= 7 {
		t.Errorf("piece was not kicked left: X = %d", g.Active.X)
	}
}

func TestRotationKicksOffTheLeftWall(t *testing.T) {
	g := testGame(KindI, -2, 10)
	g.Active.Rotation = 1 // vertical, cells on column 0
	if evs := g.RotateCW(); len(evs) == 0 {
		t.Fatal("rotation next to the left wall failed instead of kicking")
	}
	for _, c := range g.Active.Cells() {
		if c.X < 0 || c.X >= Width {
			t.Errorf("kicked piece has cell %v off the board", c)
		}
	}
}

func TestRotationFailsWhenFullyBoxedIn(t *testing.T) {
	g := testGame(KindT, 4, 10)
	// Bury the piece: fill every row it could kick into, leaving only the
	// three cells the spawn silhouette occupies.
	for y := 8; y <= 13; y++ {
		for x := 0; x < Width; x++ {
			g.Board.Set(x, y, CellOf(KindI))
		}
	}
	for _, c := range g.Active.Cells() {
		g.Board.Set(c.X, c.Y, Empty)
	}
	before := g.Active
	if evs := g.RotateCW(); evs != nil {
		t.Errorf("boxed-in rotation emitted %v", evs)
	}
	if g.Active != before {
		t.Errorf("failed rotation still moved the piece: %+v -> %+v", before, g.Active)
	}
}

// Review Focus item 4: a kick offset of (0,-1) pushes cells above the ceiling.
// Blocked() treats y<0 as open space, so this must succeed without panicking.
func TestRotationAtTheCeilingDoesNotPanic(t *testing.T) {
	g := testGame(KindI, 3, 0)
	g.Active.Rotation = 1
	for x := 0; x < Width; x++ {
		g.Board.Set(x, 2, CellOf(KindI)) // block the row below the hidden rows
	}
	g.RotateCW() // must not panic, whatever the outcome
	for _, c := range g.Active.Cells() {
		if c.X < 0 || c.X >= Width || c.Y >= Height {
			t.Errorf("rotation produced an illegal cell %v", c)
		}
	}
}

func TestGroundedRotationResetsLockTimer(t *testing.T) {
	g := testGame(KindT, 4, 20) // grounded
	g.LockAccumulator = 400 * 1000 * 1000
	if evs := g.RotateCW(); len(evs) == 0 {
		t.Fatal("grounded rotation failed")
	}
	if g.LockAccumulator != 0 {
		t.Error("grounded rotation did not reset the lock timer")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'Rotat|Kick' -v`
Expected: FAIL — `undefined: KickOffsets`, `g.RotateCW undefined`.

- [ ] **Step 3: Implement rotation**

Create `internal/game/rules.go`:

```go
package game

// KickOffsets are the positions tried when rotating, in order. The first that
// fits wins; if none fits, the rotation fails and the piece does not move.
// This is deliberately a short, forgiving table rather than a full rotation
// ruleset.
var KickOffsets = [8]Point{
	{X: 0, Y: 0},
	{X: -1, Y: 0},
	{X: 1, Y: 0},
	{X: -2, Y: 0},
	{X: 2, Y: 0},
	{X: 0, Y: -1},
	{X: -1, Y: -1},
	{X: 1, Y: -1},
}

// RotateCW turns the active piece one step clockwise.
func (g *Game) RotateCW() []Event { return g.rotate(1) }

// RotateCCW turns the active piece one step counter-clockwise.
func (g *Game) RotateCCW() []Event { return g.rotate(-1) }

func (g *Game) rotate(dir int) []Event {
	if g.Over {
		return nil
	}
	target := ((g.Active.Rotation+dir)%4 + 4) % 4
	for _, k := range KickOffsets {
		p := g.Active
		p.Rotation = target
		p.X += k.X
		p.Y += k.Y
		if g.Collides(p) {
			continue
		}
		g.Active = p
		g.touchLockTimer()
		g.emit(Event{Kind: EventPieceRotated, Piece: g.Active})
		return g.drain()
	}
	return nil
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/rules.go internal/game/rotate_test.go
git commit -m "feat(game): rotation with a forgiving wall-kick table"
```

---

### Task 8: Gravity, `Advance(dt)`, and locking

**Files:**
- Modify: `internal/game/rules.go` (append gravity helpers)
- Modify: `internal/game/game.go` (append `Advance`, `lock`, `spawn`)
- Test: `internal/game/advance_test.go`

**Interfaces:**
- Consumes: everything above.
- Produces: `const BaseDropInterval = 800 * time.Millisecond`, `MinDropInterval = 60 * time.Millisecond`, `DropDecay = 0.86`, `LinesPerLevel = 10`; `func DropInterval(level int) time.Duration`; `func LevelFor(lines int) int`; `func (g *Game) Advance(dt time.Duration) []Event`; unexported `func (g *Game) lock()`, `func (g *Game) spawn(k PieceKind)`.

At this task, locking commits the piece and spawns the next one. Line clearing and scoring arrive in Task 9; the test expectations here use a board where nothing completes.

- [ ] **Step 1: Write the failing test**

Create `internal/game/advance_test.go`:

```go
package game

import (
	"testing"
	"time"
)

func TestDropIntervalCurve(t *testing.T) {
	if got := DropInterval(1); got != BaseDropInterval {
		t.Errorf("DropInterval(1) = %v, want %v", got, BaseDropInterval)
	}
	l2 := DropInterval(2)
	if l2 >= DropInterval(1) {
		t.Error("interval did not shrink from level 1 to 2")
	}
	// 800ms * 0.86 = 688ms
	if l2 < 680*time.Millisecond || l2 > 695*time.Millisecond {
		t.Errorf("DropInterval(2) = %v, want ~688ms", l2)
	}
	if got := DropInterval(3); got >= l2 {
		t.Error("interval did not shrink from level 2 to 3")
	}
}

// Review Focus support: absurd levels must clamp, never reach zero, and never
// hang the loop in Advance.
func TestDropIntervalClamps(t *testing.T) {
	for _, level := range []int{40, 200, 100000} {
		if got := DropInterval(level); got != MinDropInterval {
			t.Errorf("DropInterval(%d) = %v, want %v", level, got, MinDropInterval)
		}
	}
	if got := DropInterval(0); got != BaseDropInterval {
		t.Errorf("DropInterval(0) = %v, want %v", got, BaseDropInterval)
	}
}

func TestLevelFor(t *testing.T) {
	cases := map[int]int{0: 1, 9: 1, 10: 2, 19: 2, 20: 3, 137: 14}
	for lines, want := range cases {
		if got := LevelFor(lines); got != want {
			t.Errorf("LevelFor(%d) = %d, want %d", lines, got, want)
		}
	}
}

func TestAdvanceStepsDownOncePerInterval(t *testing.T) {
	g := testGame(KindO, 4, 5)
	if evs := g.Advance(400 * time.Millisecond); evs != nil {
		t.Fatalf("half an interval moved the piece: %v", evs)
	}
	if g.Active.Y != 5 {
		t.Fatalf("Y = %d, want 5", g.Active.Y)
	}
	evs := g.Advance(400 * time.Millisecond)
	if len(evs) != 1 || evs[0].Kind != EventPieceMoved {
		t.Fatalf("events = %v", evs)
	}
	if g.Active.Y != 6 {
		t.Errorf("Y = %d, want 6", g.Active.Y)
	}
}

func TestAdvanceCarriesRemainderForward(t *testing.T) {
	g := testGame(KindO, 4, 5)
	g.Advance(900 * time.Millisecond) // one step, 100ms left over
	if g.Active.Y != 6 {
		t.Fatalf("Y = %d, want 6", g.Active.Y)
	}
	if g.GravityAccumulator != 100*time.Millisecond {
		t.Errorf("GravityAccumulator = %v, want 100ms", g.GravityAccumulator)
	}
}

// Review Focus item 1: a huge dt (laptop sleep) may cover many rows, but it
// locks at most one piece, and it must terminate.
func TestAdvanceWithHugeDtLocksExactlyOnce(t *testing.T) {
	g := testGame(KindO, 4, 2)
	first := g.Active
	evs := g.Advance(30 * time.Second)
	locks := 0
	spawns := 0
	for _, e := range evs {
		switch e.Kind {
		case EventPieceLocked:
			locks++
		case EventPieceSpawned:
			spawns++
		}
	}
	if locks != 1 || spawns != 1 {
		t.Fatalf("huge dt produced %d locks and %d spawns, want 1 and 1", locks, spawns)
	}
	if g.Active == first {
		t.Error("active piece was not replaced after the lock")
	}
	if !g.Board.At(4, 21).Filled() {
		t.Error("piece did not come to rest on the floor")
	}
}

// Review Focus item 2.
func TestAdvanceIgnoresZeroAndNegativeDt(t *testing.T) {
	g := testGame(KindO, 4, 5)
	before := *g
	if evs := g.Advance(0); evs != nil {
		t.Errorf("dt=0 emitted %v", evs)
	}
	if evs := g.Advance(-500 * time.Millisecond); evs != nil {
		t.Errorf("negative dt emitted %v", evs)
	}
	if g.Active != before.Active || g.GravityAccumulator != before.GravityAccumulator {
		t.Error("non-positive dt changed the game state")
	}
}

func TestGroundedPieceLocksAfterLockDelay(t *testing.T) {
	g := testGame(KindO, 4, 20) // resting on the floor
	if evs := g.Advance(300 * time.Millisecond); evs != nil {
		t.Fatalf("locked too early: %v", evs)
	}
	if g.LockAccumulator != 300*time.Millisecond {
		t.Errorf("LockAccumulator = %v, want 300ms", g.LockAccumulator)
	}
	evs := g.Advance(250 * time.Millisecond)
	sawLock := false
	for _, e := range evs {
		if e.Kind == EventPieceLocked {
			sawLock = true
		}
	}
	if !sawLock {
		t.Fatalf("piece did not lock after the delay: %v", evs)
	}
	if g.Board.At(4, 21) != CellOf(KindO) || g.Board.At(5, 21) != CellOf(KindO) {
		t.Error("locked cells were not committed to the board")
	}
}

func TestLockResetsCounterAndHoldOnSpawn(t *testing.T) {
	g := testGame(KindO, 4, 20)
	g.CanHold = false
	g.lockResets = 9
	g.Advance(LockDelay)
	if !g.CanHold {
		t.Error("CanHold was not restored on spawn")
	}
	if g.lockResets != 0 {
		t.Errorf("lockResets = %d, want 0 after spawn", g.lockResets)
	}
	if g.GravityAccumulator != 0 || g.LockAccumulator != 0 {
		t.Error("accumulators were not reset on spawn")
	}
}

func TestFallingResetsTheLockTimer(t *testing.T) {
	g := testGame(KindO, 4, 5)
	g.LockAccumulator = 300 * time.Millisecond
	g.Advance(10 * time.Millisecond)
	if g.LockAccumulator != 0 {
		t.Errorf("LockAccumulator = %v, want 0 while airborne", g.LockAccumulator)
	}
}

func TestSpawnTakesTheHeadOfTheQueue(t *testing.T) {
	g := New(4242)
	wantNext := g.Next[0]
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 20}
	g.Advance(LockDelay)
	if g.Active.Kind != wantNext {
		t.Errorf("spawned %v, want %v", g.Active.Kind, wantNext)
	}
	if len(g.Next) != NextCount {
		t.Errorf("len(Next) = %d, want %d", len(g.Next), NextCount)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'Advance|DropInterval|LevelFor|Lock|Falling|Spawn' -v`
Expected: FAIL — `undefined: DropInterval`, `g.Advance undefined`.

- [ ] **Step 3: Implement gravity curve and level mapping**

Append to `internal/game/rules.go`:

```go
// Gravity and level progression.
const (
	BaseDropInterval = 800 * time.Millisecond
	MinDropInterval  = 60 * time.Millisecond
	DropDecay        = 0.86
	LinesPerLevel    = 10
)

// DropInterval is how long one row of gravity takes at the given level:
// 800ms * 0.86^(level-1), clamped at MinDropInterval. Computed by repeated
// multiplication rather than math.Pow so the sequence is bit-identical
// everywhere, which matters for replays.
func DropInterval(level int) time.Duration {
	d := float64(BaseDropInterval)
	min := float64(MinDropInterval)
	for i := 1; i < level && d > min; i++ {
		d *= DropDecay
	}
	if d < min {
		return MinDropInterval
	}
	return time.Duration(d)
}

// LevelFor maps a cleared-line total to a level, starting at 1.
func LevelFor(lines int) int {
	if lines < 0 {
		return 1
	}
	return lines/LinesPerLevel + 1
}
```

Add `"time"` to the imports of `rules.go`.

- [ ] **Step 4: Implement `Advance`, `lock`, and `spawn`**

Append to `internal/game/game.go`:

```go
// Advance moves time forward by dt and returns everything that happened. This
// is the only clock the engine has: nothing in this package calls time.Now,
// so the same seed, inputs, and dt sequence always reproduce the same state.
//
// One call locks at most one piece, so an enormous dt (a suspended terminal, a
// debugger pause) drops the active piece and stops, rather than silently
// playing several pieces' worth of game.
func (g *Game) Advance(dt time.Duration) []Event {
	if g.Over || dt <= 0 {
		return nil
	}
	if g.CanFall() {
		g.LockAccumulator = 0
		g.GravityAccumulator += dt
		interval := DropInterval(g.Level)
		for g.GravityAccumulator >= interval && g.CanFall() {
			g.GravityAccumulator -= interval
			g.Active.Y++
			g.emit(Event{Kind: EventPieceMoved, Piece: g.Active})
		}
	}
	if !g.CanFall() {
		g.GravityAccumulator = 0
		g.LockAccumulator += dt
		if g.LockAccumulator >= LockDelay {
			g.lock()
		}
	}
	return g.drain()
}

// lock commits the active piece to the board, resolves any completed rows,
// and spawns the next piece.
func (g *Game) lock() {
	for _, c := range g.Active.Cells() {
		g.Board.Set(c.X, c.Y, CellOf(g.Active.Kind))
	}
	g.emit(Event{Kind: EventPieceLocked, Piece: g.Active})
	g.resolveClears()
	g.spawn(g.shiftNext())
}

// resolveClears is filled in by the line-clearing task. Locking works without
// it, so it starts as a no-op.
func (g *Game) resolveClears() {}

// spawn puts a new piece at the spawn position and resets the per-piece
// timers. A spawn that immediately collides ends the game.
func (g *Game) spawn(k PieceKind) {
	g.Active = SpawnPiece(k)
	g.CanHold = true
	g.GravityAccumulator = 0
	g.LockAccumulator = 0
	g.lockResets = 0
	g.emit(Event{Kind: EventPieceSpawned, Piece: g.Active})
	if g.Collides(g.Active) {
		g.Over = true
		g.emit(Event{Kind: EventGameOver})
	}
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/game/ -v && go vet ./...`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/game/game.go internal/game/rules.go internal/game/advance_test.go
git commit -m "feat(game): elapsed-time gravity, lock delay, and piece spawning"
```

---

### Task 9: Line clearing, combo, level-up, and scoring

**Files:**
- Create: `internal/game/scoring.go`
- Modify: `internal/game/game.go` (replace the `resolveClears` no-op)
- Test: `internal/game/scoring_test.go`
- Test: `internal/game/clear_test.go`

**Interfaces:**
- Consumes: `Board.CompleteRows`, `Board.Snapshot`, `Board.ClearRows`, `Event`, `LevelFor`.
- Produces: `func LineScore(lines, level int) int`; `func ComboBonus(combo, level int) int`; a working `func (g *Game) resolveClears()` that emits `EventLinesCleared`, `EventComboChanged`, and `EventLevelChanged`.

Scoring uses the level in force *before* the clear raised it, so a clear that levels you up is paid at the old rate. That is the conventional behaviour and it keeps the numbers explainable.

- [ ] **Step 1: Write the failing scoring test**

Create `internal/game/scoring_test.go`:

```go
package game

import "testing"

func TestLineScoreTable(t *testing.T) {
	cases := []struct {
		lines, level, want int
	}{
		{1, 1, 100}, {2, 1, 300}, {3, 1, 500}, {4, 1, 800},
		{1, 7, 700}, {4, 7, 5600},
		{0, 5, 0}, {5, 5, 0}, {-1, 5, 0},
	}
	for _, tc := range cases {
		if got := LineScore(tc.lines, tc.level); got != tc.want {
			t.Errorf("LineScore(%d,%d) = %d, want %d", tc.lines, tc.level, got, tc.want)
		}
	}
}

func TestComboBonusStartsAtComboTwo(t *testing.T) {
	cases := []struct {
		combo, level, want int
	}{
		{0, 3, 0},
		{1, 3, 0}, // a lone clear earns no combo bonus
		{2, 1, 50},
		{2, 3, 150},
		{5, 2, 400}, // 50 * 4 * 2
	}
	for _, tc := range cases {
		if got := ComboBonus(tc.combo, tc.level); got != tc.want {
			t.Errorf("ComboBonus(%d,%d) = %d, want %d", tc.combo, tc.level, got, tc.want)
		}
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/game/ -run 'LineScore|ComboBonus' -v`
Expected: FAIL — `undefined: LineScore`.

- [ ] **Step 3: Implement the scoring functions**

Create `internal/game/scoring.go`:

```go
package game

// lineScores is the base value of clearing n rows, before the level multiplier.
var lineScores = [5]int{0, 100, 300, 500, 800}

// LineScore is the score for clearing n rows at the given level.
func LineScore(lines, level int) int {
	if lines < 1 || lines >= len(lineScores) {
		return 0
	}
	return lineScores[lines] * level
}

// ComboBonus is the extra score for a chain of clearing placements:
// 50 * (combo-1) * level. The first clear of a chain earns nothing, so the
// bonus first appears at combo 2.
func ComboBonus(combo, level int) int {
	if combo < 2 {
		return 0
	}
	return 50 * (combo - 1) * level
}
```

- [ ] **Step 4: Write the failing clear-behaviour test**

Create `internal/game/clear_test.go`:

```go
package game

import (
	"testing"
	"time"
)

// dropOnto locks the active piece immediately by hard-dropping it.
func mustEvent(t *testing.T, evs []Event, kind EventKind) Event {
	t.Helper()
	for _, e := range evs {
		if e.Kind == kind {
			return e
		}
	}
	t.Fatalf("no %v event in %v", kind, kinds(evs))
	return Event{}
}

func kinds(evs []Event) []string {
	out := make([]string, 0, len(evs))
	for _, e := range evs {
		out = append(out, e.Kind.String())
	}
	return out
}

func noEvent(t *testing.T, evs []Event, kind EventKind) {
	t.Helper()
	for _, e := range evs {
		if e.Kind == kind {
			t.Fatalf("unexpected %v in %v", kind, kinds(evs))
		}
	}
}

// setupSingleClear leaves row 21 needing exactly the two cells an O piece
// covers at X=4, with the O resting on the floor.
func setupSingleClear(t *testing.T) *Game {
	t.Helper()
	g := New(11)
	for x := 0; x < Width; x++ {
		if x == 4 || x == 5 {
			continue
		}
		g.Board.Set(x, 21, CellOf(KindI))
	}
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 20}
	return g
}

func TestSingleClearScoresAndCountsLines(t *testing.T) {
	g := setupSingleClear(t)
	evs := g.Advance(LockDelay)

	cleared := mustEvent(t, evs, EventLinesCleared)
	if cleared.Count != 1 {
		t.Errorf("Count = %d, want 1", cleared.Count)
	}
	if len(cleared.Cleared) != 1 || cleared.Cleared[0].Y != 21 {
		t.Errorf("Cleared = %+v", cleared.Cleared)
	}
	if !cleared.Cleared[0].Cells[0].Filled() {
		t.Error("cleared-row snapshot is empty")
	}
	if cleared.Points != 100 {
		t.Errorf("Points = %d, want 100 (1 line at level 1, no combo bonus)", cleared.Points)
	}
	if g.Score != 100 {
		t.Errorf("Score = %d, want 100", g.Score)
	}
	if g.Lines != 1 {
		t.Errorf("Lines = %d, want 1", g.Lines)
	}
	if g.Board.At(0, 21).Filled() {
		t.Error("row 21 was not cleared from the board")
	}
	combo := mustEvent(t, evs, EventComboChanged)
	if combo.Count != 1 {
		t.Errorf("combo = %d, want 1", combo.Count)
	}
	noEvent(t, evs, EventLevelChanged)
}

func TestFourLineClearScores800TimesLevel(t *testing.T) {
	g := New(12)
	for y := 18; y <= 21; y++ {
		for x := 0; x < Width; x++ {
			if x == 4 {
				continue
			}
			g.Board.Set(x, y, CellOf(KindI))
		}
	}
	// Vertical I in column 4 fills all four rows at once.
	g.Active = Piece{Kind: KindI, Rotation: 1, X: 2, Y: 18}
	evs := g.HardDropForTest()

	cleared := mustEvent(t, evs, EventLinesCleared)
	if cleared.Count != 4 {
		t.Fatalf("Count = %d, want 4", cleared.Count)
	}
	if cleared.Points != 800 {
		t.Errorf("Points = %d, want 800", cleared.Points)
	}
	if g.Lines != 4 {
		t.Errorf("Lines = %d, want 4", g.Lines)
	}
}

func TestComboChainAndReset(t *testing.T) {
	g := New(13)
	clearOneRow := func() []Event {
		for x := 0; x < Width; x++ {
			if x == 4 || x == 5 {
				continue
			}
			g.Board.Set(x, 21, CellOf(KindI))
		}
		g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 20}
		g.LockAccumulator = 0
		return g.Advance(LockDelay)
	}

	clearOneRow()
	if g.Combo != 1 {
		t.Fatalf("Combo = %d, want 1", g.Combo)
	}
	scoreAfterFirst := g.Score

	evs := clearOneRow()
	if g.Combo != 2 {
		t.Fatalf("Combo = %d, want 2", g.Combo)
	}
	cleared := mustEvent(t, evs, EventLinesCleared)
	if cleared.Points != 150 { // 100 line + 50 combo bonus at level 1
		t.Errorf("second clear Points = %d, want 150", cleared.Points)
	}
	if g.Score != scoreAfterFirst+150 {
		t.Errorf("Score = %d, want %d", g.Score, scoreAfterFirst+150)
	}

	// A placement that clears nothing breaks the chain.
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 0, Y: 20}
	g.LockAccumulator = 0
	evs = g.Advance(LockDelay)
	if g.Combo != 0 {
		t.Errorf("Combo = %d, want 0 after an empty placement", g.Combo)
	}
	broke := mustEvent(t, evs, EventComboChanged)
	if broke.Count != 0 {
		t.Errorf("combo event Count = %d, want 0", broke.Count)
	}
	noEvent(t, evs, EventLinesCleared)
}

func TestEmptyPlacementWithNoComboEmitsNoComboEvent(t *testing.T) {
	g := testGame(KindO, 4, 20)
	evs := g.Advance(LockDelay)
	noEvent(t, evs, EventComboChanged)
}

func TestLevelRisesEveryTenLines(t *testing.T) {
	g := New(14)
	g.Lines = 9
	for x := 0; x < Width; x++ {
		if x == 4 || x == 5 {
			continue
		}
		g.Board.Set(x, 21, CellOf(KindI))
	}
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 20}
	evs := g.Advance(LockDelay)

	lvl := mustEvent(t, evs, EventLevelChanged)
	if lvl.Count != 2 {
		t.Errorf("new level = %d, want 2", lvl.Count)
	}
	if g.Level != 2 {
		t.Errorf("Level = %d, want 2", g.Level)
	}
	cleared := mustEvent(t, evs, EventLinesCleared)
	if cleared.Points != 100 {
		t.Errorf("Points = %d, want 100 (scored at the pre-clear level)", cleared.Points)
	}
	if DropInterval(g.Level) >= DropInterval(1) {
		t.Error("gravity did not speed up after the level change")
	}
	_ = time.Second
}
```

`HardDropForTest` is a temporary shim so this task's four-line test can lock a piece instantly before Task 11 adds the real `HardDrop`. Add it to `internal/game/game.go` in Step 5 and delete it in Task 11, Step 5.

- [ ] **Step 5: Implement clearing and the test shim**

Replace the `resolveClears` no-op in `internal/game/game.go` with:

```go
// resolveClears removes completed rows, updates the score, lines, combo, and
// level, and emits the matching events. Scoring uses the level in force
// before this clear, so a clear that levels you up is paid at the old rate.
func (g *Game) resolveClears() {
	rows := g.Board.CompleteRows()
	if len(rows) == 0 {
		if g.Combo != 0 {
			g.Combo = 0
			g.emit(Event{Kind: EventComboChanged, Count: 0})
		}
		return
	}

	snapshot := g.Board.Snapshot(rows)
	g.Board.ClearRows(rows)

	n := len(rows)
	g.Lines += n
	g.Combo++
	points := LineScore(n, g.Level) + ComboBonus(g.Combo, g.Level)
	g.Score += points

	g.emit(Event{Kind: EventLinesCleared, Cleared: snapshot, Count: n, Points: points})
	g.emit(Event{Kind: EventComboChanged, Count: g.Combo})

	if lvl := LevelFor(g.Lines); lvl != g.Level {
		g.Level = lvl
		g.emit(Event{Kind: EventLevelChanged, Count: g.Level})
	}
}

// HardDropForTest drops and locks the active piece immediately. It exists only
// until the real HardDrop lands; delete it then.
func (g *Game) HardDropForTest() []Event {
	for g.CanFall() {
		g.Active.Y++
	}
	g.lock()
	return g.drain()
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add internal/game/scoring.go internal/game/game.go internal/game/scoring_test.go internal/game/clear_test.go
git commit -m "feat(game): line clearing, combo chain, level-up, and scoring"
```

---

### Task 10: Hold

**Files:**
- Modify: `internal/game/game.go` (append `UseHold`)
- Test: `internal/game/hold_test.go`

**Interfaces:**
- Consumes: `Game`, `spawn`, `shiftNext`, `Event`.
- Produces: `func (g *Game) UseHold() []Event`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/hold_test.go`:

```go
package game

import "testing"

func TestFirstHoldStoresPieceAndTakesFromQueue(t *testing.T) {
	g := New(21)
	active := g.Active.Kind
	wantNext := g.Next[0]

	evs := g.UseHold()
	mustEvent(t, evs, EventHoldUsed)
	mustEvent(t, evs, EventPieceSpawned)

	if g.Hold == nil || *g.Hold != active {
		t.Fatalf("Hold = %v, want %v", g.Hold, active)
	}
	if g.Active.Kind != wantNext {
		t.Errorf("active = %v, want %v from the queue", g.Active.Kind, wantNext)
	}
	if g.CanHold {
		t.Error("CanHold should be false after holding")
	}
	if len(g.Next) != NextCount {
		t.Errorf("len(Next) = %d, want %d", len(g.Next), NextCount)
	}
}

func TestSecondHoldIsBlockedUntilTheNextLock(t *testing.T) {
	g := New(22)
	g.UseHold()
	held := *g.Hold
	active := g.Active.Kind

	if evs := g.UseHold(); evs != nil {
		t.Fatalf("second hold emitted %v", evs)
	}
	if *g.Hold != held || g.Active.Kind != active {
		t.Error("second hold changed the game state")
	}
}

func TestHoldSwapsWithStoredPiece(t *testing.T) {
	g := New(23)
	g.UseHold()
	held := *g.Hold
	current := g.Active.Kind
	queueHead := g.Next[0]

	g.CanHold = true // simulate a fresh piece
	g.UseHold()

	if g.Active.Kind != held {
		t.Errorf("active = %v, want the previously held %v", g.Active.Kind, held)
	}
	if *g.Hold != current {
		t.Errorf("Hold = %v, want %v", *g.Hold, current)
	}
	if g.Next[0] != queueHead {
		t.Error("a swap must not consume the next queue")
	}
}

func TestHeldPieceReturnsAtSpawnRotationAndPosition(t *testing.T) {
	g := New(24)
	g.Active.Rotation = 3
	g.Active.X = 7
	g.Active.Y = 15
	g.UseHold()
	g.CanHold = true
	g.UseHold()

	if g.Active.Rotation != 0 || g.Active.X != SpawnX || g.Active.Y != SpawnY {
		t.Errorf("restored piece at %+v, want spawn rotation and position", g.Active)
	}
}

func TestHoldIsRestoredAfterALock(t *testing.T) {
	g := New(25)
	g.UseHold()
	if g.CanHold {
		t.Fatal("CanHold should be false right after holding")
	}
	g.Active = Piece{Kind: g.Active.Kind, Rotation: 0, X: 4, Y: 20}
	g.Advance(LockDelay)
	if !g.CanHold {
		t.Error("CanHold was not restored by the lock")
	}
}

func TestHoldResetsPerPieceTimers(t *testing.T) {
	g := New(26)
	g.GravityAccumulator = 500 * 1000 * 1000
	g.LockAccumulator = 200 * 1000 * 1000
	g.lockResets = 5
	g.UseHold()
	if g.GravityAccumulator != 0 || g.LockAccumulator != 0 || g.lockResets != 0 {
		t.Error("hold did not reset the per-piece timers")
	}
}

func TestHoldIntoABlockedSpawnEndsTheGame(t *testing.T) {
	g := New(27)
	// Fill the spawn rows so any incoming piece collides.
	for x := 0; x < Width; x++ {
		g.Board.Set(x, 0, CellOf(KindI))
		g.Board.Set(x, 1, CellOf(KindI))
	}
	evs := g.UseHold()
	mustEvent(t, evs, EventGameOver)
	if !g.Over {
		t.Error("Over should be true")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'Hold' -v`
Expected: FAIL — `g.UseHold undefined`.

- [ ] **Step 3: Implement hold**

Append to `internal/game/game.go`:

```go
// UseHold swaps the active piece with the held piece. With an empty hold it
// stores the active piece and pulls the next one from the queue. Only one hold
// is allowed per piece; the allowance returns when a piece locks.
func (g *Game) UseHold() []Event {
	if g.Over || !g.CanHold {
		return nil
	}
	outgoing := g.Active.Kind
	g.emit(Event{Kind: EventHoldUsed, Piece: g.Active})

	var incoming PieceKind
	if g.Hold == nil {
		incoming = g.shiftNext()
	} else {
		incoming = *g.Hold
	}
	stored := outgoing
	g.Hold = &stored

	g.spawn(incoming)
	// spawn restores the hold allowance for a newly spawned piece; a held
	// piece does not get another swap.
	g.CanHold = false
	return g.drain()
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/hold_test.go
git commit -m "feat(game): hold with one swap per piece"
```

---

### Task 11: Ghost position and hard drop

**Files:**
- Modify: `internal/game/game.go` (append `GhostY`, `HardDrop`; delete `HardDropForTest`)
- Modify: `internal/game/clear_test.go` (swap the shim call for the real method)
- Test: `internal/game/harddrop_test.go`

**Interfaces:**
- Consumes: `Game`, `CanFall`, `lock`.
- Produces: `func (g *Game) GhostY() int`; `func (g *Game) GhostPiece() Piece`; `func (g *Game) HardDrop() []Event`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/harddrop_test.go`:

```go
package game

import "testing"

func TestGhostYFindsTheFloor(t *testing.T) {
	g := testGame(KindO, 4, 3)
	if got := g.GhostY(); got != 20 {
		t.Errorf("GhostY() = %d, want 20", got)
	}
	if g.Active.Y != 3 {
		t.Error("GhostY moved the active piece")
	}
}

func TestGhostYStopsOnTheStack(t *testing.T) {
	g := testGame(KindO, 4, 3)
	g.Board.Set(4, 15, CellOf(KindI))
	if got := g.GhostY(); got != 13 {
		t.Errorf("GhostY() = %d, want 13", got)
	}
}

func TestGhostPieceMatchesActiveApartFromY(t *testing.T) {
	g := testGame(KindT, 4, 6)
	g.Active.Rotation = 2
	ghost := g.GhostPiece()
	if ghost.Kind != g.Active.Kind || ghost.Rotation != g.Active.Rotation || ghost.X != g.Active.X {
		t.Errorf("ghost = %+v, active = %+v", ghost, g.Active)
	}
	if ghost.Y != g.GhostY() {
		t.Errorf("ghost.Y = %d, want %d", ghost.Y, g.GhostY())
	}
}

func TestGhostYWhenAlreadyGrounded(t *testing.T) {
	g := testGame(KindO, 4, 20)
	if got := g.GhostY(); got != 20 {
		t.Errorf("GhostY() = %d, want 20", got)
	}
}

func TestHardDropScoresTwoPerCellAndLocks(t *testing.T) {
	g := testGame(KindO, 4, 3)
	evs := g.HardDrop()

	drop := mustEvent(t, evs, EventPieceHardDropped)
	if drop.Count != 17 { // 20 - 3
		t.Errorf("Count = %d, want 17", drop.Count)
	}
	if drop.Points != 34 {
		t.Errorf("Points = %d, want 34", drop.Points)
	}
	if g.Score != 34 {
		t.Errorf("Score = %d, want 34", g.Score)
	}
	mustEvent(t, evs, EventPieceLocked)
	mustEvent(t, evs, EventPieceSpawned)
	if g.Board.At(4, 21) != CellOf(KindO) {
		t.Error("hard-dropped piece was not committed at the floor")
	}
}

func TestHardDropWhenAlreadyGroundedScoresNothingAndStillLocks(t *testing.T) {
	g := testGame(KindO, 4, 20)
	evs := g.HardDrop()
	drop := mustEvent(t, evs, EventPieceHardDropped)
	if drop.Count != 0 || drop.Points != 0 {
		t.Errorf("Count/Points = %d/%d, want 0/0", drop.Count, drop.Points)
	}
	mustEvent(t, evs, EventPieceLocked)
}

func TestHardDropOrdersEventsDropThenLockThenSpawn(t *testing.T) {
	g := testGame(KindO, 4, 3)
	evs := g.HardDrop()
	var order []EventKind
	for _, e := range evs {
		switch e.Kind {
		case EventPieceHardDropped, EventPieceLocked, EventPieceSpawned:
			order = append(order, e.Kind)
		}
	}
	want := []EventKind{EventPieceHardDropped, EventPieceLocked, EventPieceSpawned}
	if len(order) != len(want) {
		t.Fatalf("event order = %v, want %v", order, want)
	}
	for i := range want {
		if order[i] != want[i] {
			t.Fatalf("event order = %v, want %v", order, want)
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'Ghost|HardDrop' -v`
Expected: FAIL — `g.GhostY undefined`, `g.HardDrop undefined`.

- [ ] **Step 3: Implement ghost and hard drop**

Append to `internal/game/game.go`:

```go
// GhostY is the row the active piece would come to rest on if dropped now.
func (g *Game) GhostY() int {
	p := g.Active
	for {
		next := p
		next.Y++
		if g.Collides(next) {
			return p.Y
		}
		p = next
	}
}

// GhostPiece is the active piece translated to its landing position. The
// renderer draws it under the active piece; it is not part of the board.
func (g *Game) GhostPiece() Piece {
	p := g.Active
	p.Y = g.GhostY()
	return p
}

// HardDrop slams the active piece to its landing position, scores two points
// per cell fallen, and locks it immediately.
func (g *Game) HardDrop() []Event {
	if g.Over {
		return nil
	}
	target := g.GhostY()
	distance := target - g.Active.Y
	g.Active.Y = target
	points := 2 * distance
	g.Score += points
	g.emit(Event{Kind: EventPieceHardDropped, Piece: g.Active, Count: distance, Points: points})
	g.lock()
	return g.drain()
}
```

- [ ] **Step 4: Remove the test shim**

Delete `HardDropForTest` from `internal/game/game.go`, and in `internal/game/clear_test.go` replace `g.HardDropForTest()` with `g.HardDrop()`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/game/ -v && go vet ./...`
Expected: PASS. `TestFourLineClearScores800TimesLevel` now exercises the real hard drop — note its score also includes the drop points, so if that assertion fails on `g.Score` rather than `cleared.Points`, the test is asserting the wrong number (it asserts `cleared.Points`, which is clear score only).

- [ ] **Step 6: Commit**

```bash
git add internal/game/game.go internal/game/harddrop_test.go internal/game/clear_test.go
git commit -m "feat(game): ghost landing position and hard drop"
```

---

### Task 12: Game over

**Files:**
- Test: `internal/game/gameover_test.go`

**Interfaces:**
- Consumes: `spawn`'s existing blocked-spawn handling from Task 8.
- Produces: no new API — this task pins the behaviour with tests and fixes anything they catch.

- [ ] **Step 1: Write the failing test**

Create `internal/game/gameover_test.go`:

```go
package game

import (
	"testing"
	"time"
)

func TestBlockedSpawnEndsTheGame(t *testing.T) {
	g := New(31)
	for x := 0; x < Width; x++ {
		for y := 0; y < 4; y++ {
			g.Board.Set(x, y, CellOf(KindI))
		}
	}
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 18}
	evs := g.HardDrop()

	mustEvent(t, evs, EventGameOver)
	if !g.Over {
		t.Fatal("Over should be true")
	}
	// GameOver must come after the spawn that failed.
	var sawSpawn bool
	for _, e := range evs {
		if e.Kind == EventPieceSpawned {
			sawSpawn = true
		}
		if e.Kind == EventGameOver && !sawSpawn {
			t.Error("GameOver emitted before the blocked spawn")
		}
	}
}

func TestGameOverIsEmittedOnlyOnce(t *testing.T) {
	g := New(32)
	for x := 0; x < Width; x++ {
		for y := 0; y < 4; y++ {
			g.Board.Set(x, y, CellOf(KindI))
		}
	}
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 18}
	g.HardDrop()

	for i := 0; i < 5; i++ {
		if evs := g.Advance(time.Second); evs != nil {
			t.Fatalf("Advance after game over emitted %v", kinds(evs))
		}
	}
}

// Review Focus item 5: after game over, every input is inert.
func TestAllInputsAreInertAfterGameOver(t *testing.T) {
	g := New(33)
	g.Over = true
	before := struct {
		active            Piece
		score, lines      int
		level, combo      int
		canHold           bool
		gravity, lockAccu time.Duration
	}{g.Active, g.Score, g.Lines, g.Level, g.Combo, g.CanHold, g.GravityAccumulator, g.LockAccumulator}
	beforeBoard := g.Board

	inputs := map[string]func() []Event{
		"MoveLeft":  g.MoveLeft,
		"MoveRight": g.MoveRight,
		"SoftDrop":  g.SoftDrop,
		"RotateCW":  g.RotateCW,
		"RotateCCW": g.RotateCCW,
		"HardDrop":  g.HardDrop,
		"UseHold":   g.UseHold,
		"Advance":   func() []Event { return g.Advance(2 * time.Second) },
	}
	for name, fn := range inputs {
		if evs := fn(); evs != nil {
			t.Errorf("%s after game over emitted %v", name, kinds(evs))
		}
	}

	if g.Active != before.active || g.Score != before.score || g.Lines != before.lines ||
		g.Level != before.level || g.Combo != before.combo || g.CanHold != before.canHold ||
		g.GravityAccumulator != before.gravity || g.LockAccumulator != before.lockAccu {
		t.Error("an input mutated the game after game over")
	}
	if g.Board != beforeBoard {
		t.Error("an input mutated the board after game over")
	}
}
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `go test ./internal/game/ -run 'GameOver|Blocked|Inert' -v`
Expected: PASS if Tasks 8–11 guarded every mutator with `if g.Over`. If any test fails, add the missing guard to that method and re-run until green — do not weaken the test.

- [ ] **Step 3: Commit**

```bash
git add internal/game/gameover_test.go
git commit -m "test(game): pin game-over transition and post-game-over inertness"
```

---

### Task 13: Seeded replay determinism test

**Files:**
- Test: `internal/game/determinism_test.go`

**Interfaces:**
- Consumes: the whole public engine API.
- Produces: `type Input uint8` with `InputNone`, `InputLeft`, `InputRight`, `InputSoft`, `InputCW`, `InputCCW`, `InputHard`, `InputHold` — declared in the test file, not the package, since only the replay harness needs them.

This is the test that makes §35's promise real: same seed, same input sequence, same `dt` sequence, same final state.

- [ ] **Step 1: Write the failing test**

Create `internal/game/determinism_test.go`:

```go
package game

import (
	"fmt"
	"strings"
	"testing"
	"time"
)

// Input is one player action in a replay stream.
type Input uint8

// The replayable inputs.
const (
	InputNone Input = iota
	InputLeft
	InputRight
	InputSoft
	InputCW
	InputCCW
	InputHard
	InputHold
)

type replayStep struct {
	in Input
	dt time.Duration
}

func apply(g *Game, in Input) {
	switch in {
	case InputLeft:
		g.MoveLeft()
	case InputRight:
		g.MoveRight()
	case InputSoft:
		g.SoftDrop()
	case InputCW:
		g.RotateCW()
	case InputCCW:
		g.RotateCCW()
	case InputHard:
		g.HardDrop()
	case InputHold:
		g.UseHold()
	}
}

// cannedStream is a long, varied, fully deterministic input stream.
func cannedStream() []replayStep {
	pattern := []Input{
		InputLeft, InputCW, InputNone, InputRight, InputSoft, InputHard,
		InputHold, InputCCW, InputRight, InputRight, InputHard, InputNone,
		InputLeft, InputLeft, InputCW, InputCW, InputSoft, InputSoft,
		InputHard, InputHold,
	}
	dts := []time.Duration{
		16 * time.Millisecond, 33 * time.Millisecond, 7 * time.Millisecond,
		120 * time.Millisecond, 250 * time.Millisecond, 16 * time.Millisecond,
	}
	steps := make([]replayStep, 0, 600)
	for i := 0; i < 600; i++ {
		steps = append(steps, replayStep{
			in: pattern[i%len(pattern)],
			dt: dts[i%len(dts)],
		})
	}
	return steps
}

// fingerprint is a compact, comparable description of the whole logical state.
func fingerprint(g *Game) string {
	var b strings.Builder
	fmt.Fprintf(&b, "score=%d lines=%d level=%d combo=%d over=%v canhold=%v\n",
		g.Score, g.Lines, g.Level, g.Combo, g.Over, g.CanHold)
	fmt.Fprintf(&b, "active=%v/%d@%d,%d\n", g.Active.Kind, g.Active.Rotation, g.Active.X, g.Active.Y)
	if g.Hold != nil {
		fmt.Fprintf(&b, "hold=%v\n", *g.Hold)
	} else {
		b.WriteString("hold=none\n")
	}
	fmt.Fprintf(&b, "next=%v\n", g.Next)
	fmt.Fprintf(&b, "grav=%v lock=%v\n", g.GravityAccumulator, g.LockAccumulator)
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if g.Board.At(x, y).Filled() {
				b.WriteByte('#')
			} else {
				b.WriteByte('.')
			}
		}
		b.WriteByte('\n')
	}
	return b.String()
}

func runReplay(seed int64, steps []replayStep) *Game {
	g := New(seed)
	for _, s := range steps {
		apply(g, s.in)
		g.Advance(s.dt)
	}
	return g
}

func TestReplayIsReproducible(t *testing.T) {
	steps := cannedStream()
	a := fingerprint(runReplay(8675309, steps))
	b := fingerprint(runReplay(8675309, steps))
	if a != b {
		t.Fatalf("same seed and inputs diverged:\n--- run A ---\n%s\n--- run B ---\n%s", a, b)
	}
}

func TestReplayDependsOnSeed(t *testing.T) {
	steps := cannedStream()
	a := fingerprint(runReplay(1, steps))
	b := fingerprint(runReplay(2, steps))
	if a == b {
		t.Fatal("different seeds produced identical final states")
	}
}

func TestReplayReachesANonTrivialState(t *testing.T) {
	g := runReplay(8675309, cannedStream())
	if g.Score == 0 {
		t.Error("replay scored nothing; the canned stream is not exercising the engine")
	}
	filled := 0
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if g.Board.At(x, y).Filled() {
				filled++
			}
		}
	}
	if filled == 0 && !g.Over {
		t.Error("replay left an empty board and no game over; stream is too short")
	}
}

// Splitting a dt in two must land in the same place as one combined step,
// because gravity accumulates elapsed time rather than counting ticks.
func TestGravityIsElapsedTimeNotTickCount(t *testing.T) {
	coarse := New(77)
	coarse.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 2}
	fine := New(77)
	fine.Active = Piece{Kind: KindO, Rotation: 0, X: 4, Y: 2}

	for i := 0; i < 10; i++ {
		coarse.Advance(100 * time.Millisecond)
	}
	for i := 0; i < 100; i++ {
		fine.Advance(10 * time.Millisecond)
	}
	if coarse.Active.Y != fine.Active.Y {
		t.Errorf("coarse Y = %d, fine Y = %d", coarse.Active.Y, fine.Active.Y)
	}
}
```

- [ ] **Step 2: Run the tests**

Run: `go test ./internal/game/ -run 'Replay|Elapsed' -v`
Expected: PASS. If `TestReplayIsReproducible` fails, something in the engine is reading a clock or a map iteration order — grep for `time.Now` and `range` over maps under `internal/game/`.

- [ ] **Step 3: Verify the no-clock rule mechanically**

Run: `! grep -rn 'time\.Now\|time\.Since\|time\.Tick\|time\.After' internal/game/`
Expected: exit status 0 (no matches — the `!` inverts grep's "found" status).

- [ ] **Step 4: Run the whole suite with the race detector and shuffled order**

Run: `go test ./... -race -shuffle=on -count=2`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/determinism_test.go
git commit -m "test(game): seeded replay determinism and elapsed-time gravity"
```

---

## Done when

- `go test ./... -race -shuffle=on` is green.
- `go vet ./...` is clean.
- `grep -rn 'time.Now' internal/game/` finds nothing.
- The engine covers §40's engine checklist: board collision/bounds/completion/removal/collapse, every rotation plus kicks and failure, bag contents and reproducibility, hold (initial/swap/blocked/restored), drops and landing and lock, score values and combo and drop points and level progression, blocked-spawn game over, and a canned-replay determinism assertion.
- Nothing outside `internal/game` exists yet apart from `go.mod`, `LICENSE`, and `.gitignore`. The terminal lives in Plan 2.
