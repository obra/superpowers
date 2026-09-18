# Cosmic Tetris Phase 1 — Game Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `internal/game` — a headless, deterministic falling-block engine with no terminal, no rendering, and no clock — fully covered by unit tests.

**Architecture:** One package, `internal/game`, exposing a `*Game` that is driven by exactly two calls: `Apply(Input)` for player actions and `Advance(dt)` for elapsed time. Both return a slice of `Event` values describing what happened, which later phases feed to the FX system. The package owns a single `*rand.Rand` used only by the 7-bag. Nothing in the package reads a clock, so "same seed + same inputs + same timings ⇒ same state" is a testable property rather than a hope.

**Tech Stack:** Go 1.25.0, standard library only. No dependencies in this phase.

**Spec:** [`design.md`](../design.md) — this phase implements §5, §6, §7, §9, §11, §12, §13, §34, §35, §40 (game-logic sections), and §49.1/§49.2/§49.6.

## Global Constraints

These apply to every task in every Cosmic Tetris plan.

- Module path is `cosmic-tetris`; `go.mod` declares `go 1.25.0` (the floor required by the Charm v2 libraries).
- Direct dependencies are limited to `charm.land/bubbletea/v2 v2.0.9`, `charm.land/lipgloss/v2 v2.0.6`, `charm.land/bubbles/v2 v2.2.1`. Nothing else. Phase 1 adds none of them.
- Package layout is exactly §33's tree. Do not add packages.
- Board geometry is fixed: `width 10`, `height 22`, `visible rows 20`, `hidden spawn rows 2` (§5).
- **Nothing under `internal/game` may call `time.Now()`** (§49.2). Time enters only as the `dt` argument to `Advance`.
- The game RNG and the FX RNG are separate objects and never share state (§49.6, §35).
- The FX system may observe game events and may never modify game state (§14).
- Screen shake never exceeds roughly one terminal cell (§44).
- Animation never delays gameplay and never blocks input (§44).
- No networking, no profiles, no achievements, no plugin system, no database (§2).
- No filesystem operations during gameplay (§38).
- Every task ends green: `go build ./... && go vet ./... && go test ./...`.

## Review Focus

Failure modes this phase's code owns that the spec implies but never states. Each has a test added to the task that owns the code — listed here once, with the owning task named.

- **Level far past the gravity clamp.** A long game reaches level 40+; `800ms × 0.86^(level-1)` underflows toward zero. A zero or negative drop interval makes `Advance`'s gravity loop spin forever and hangs the game. Expected: the interval floors at 60ms and stays there for every level, including absurd ones. → Task 9.
- **Negative and large rotation indices.** `Rotation` is a plain `int`; repeated CCW rotation drives it negative and repeated CW drives it past 3. Expected: rotation is read modulo 4 with negatives normalized, never an index panic. → Task 2.
- **Collision queries outside the board.** Movement, rotation kicks, and drop-distance all probe cells beyond every edge, including above the top. Expected: out-of-bounds is treated as occupied on all four sides, so nothing indexes past the array. → Task 3.
- **Clearing non-contiguous rows in one placement.** An I-piece can complete rows 8 and 11 while 9 and 10 stay partial. Expected: both clear, the two partial rows survive intact and land in the right order, and exactly two empty rows appear at the top. → Task 4.
- **Input and time after game over.** The app keeps ticking for the ~1300ms game-over animation (§28) and the player keeps mashing keys. Expected: `Apply` and `Advance` are no-ops once `Over` is set, and `GameOver` is emitted exactly once. → Task 13.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `go.mod` | Module declaration. |
| `.gitignore` | Ignore the built binary. |
| `internal/game/piece.go` | `PieceKind`, `Cell`, the shape table, `Piece` and its cell geometry, spawn positions. |
| `internal/game/board.go` | The 10×22 grid: bounds, occupancy, row completion, clearing and collapse. |
| `internal/game/bag.go` | The 7-bag generator. |
| `internal/game/rules.go` | Tunable rule constants and pure rule functions: kick offsets, drop interval, lock delay. |
| `internal/game/event.go` | `Event`, `EventKind`, and the emit helpers. |
| `internal/game/scoring.go` | Pure scoring arithmetic: line values, combo bonus, level from lines. |
| `internal/game/game.go` | The `Game` aggregate: state, `Apply`, `Advance`, spawn, hold, lock. |

**Deviation from §33:** §33's tree does not list `internal/game/event.go`. Events are a distinct responsibility with their own vocabulary and they are the whole contract between the engine and the FX system, so they get their own file rather than swelling `game.go`. This is the only file added to the spec's tree in this phase.

---

### Task 1: Module bootstrap, piece kinds, and board cells

**Files:**
- Create: `go.mod`
- Create: `.gitignore`
- Create: `internal/game/piece.go`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces: `type PieceKind uint8` with constants `KindI KindJ KindL KindO KindS KindT KindZ` and `KindCount = 7`; `func (PieceKind) String() string`; `type Cell uint8` with `CellEmpty Cell = 0`, `func CellOf(PieceKind) Cell`, `func (Cell) Filled() bool`, `func (Cell) Kind() PieceKind`.

- [ ] **Step 1: Create the module and gitignore**

```bash
go mod init cosmic-tetris
printf 'cosmic-tetris\n/cosmic-tetris\n' > .gitignore
```

Then edit `go.mod` so the version line reads exactly:

```
go 1.25.0
```

- [ ] **Step 2: Write the failing test**

Create `internal/game/piece_test.go`:

```go
package game

import "testing"

func TestPieceKindString(t *testing.T) {
	want := []string{"I", "J", "L", "O", "S", "T", "Z"}
	for k := PieceKind(0); int(k) < KindCount; k++ {
		if got := k.String(); got != want[k] {
			t.Errorf("PieceKind(%d).String() = %q, want %q", k, got, want[k])
		}
	}
}

func TestCellRoundTrip(t *testing.T) {
	if CellEmpty.Filled() {
		t.Error("CellEmpty.Filled() = true, want false")
	}
	for k := PieceKind(0); int(k) < KindCount; k++ {
		c := CellOf(k)
		if !c.Filled() {
			t.Errorf("CellOf(%v).Filled() = false, want true", k)
		}
		if got := c.Kind(); got != k {
			t.Errorf("CellOf(%v).Kind() = %v, want %v", k, got, k)
		}
	}
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestPieceKindString|TestCellRoundTrip' -v`
Expected: FAIL — build error, `undefined: PieceKind`.

- [ ] **Step 4: Write minimal implementation**

Create `internal/game/piece.go`:

```go
// Package game is the Cosmic Tetris rules engine. It is headless and
// deterministic: nothing here reads a clock, renders anything, or knows a
// terminal exists. Time enters the engine only as the dt argument to
// (*Game).Advance.
package game

// PieceKind identifies one of the seven tetromino families (§6).
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

// KindCount is the number of tetromino families, which is also the size of one
// bag (§6).
const KindCount = 7

var kindNames = [KindCount]string{"I", "J", "L", "O", "S", "T", "Z"}

// String returns the single-letter name of the family.
func (k PieceKind) String() string {
	if int(k) >= KindCount {
		return "?"
	}
	return kindNames[k]
}

// Cell is the content of one board cell: either empty or a locked block
// belonging to a piece family. Storing the family keeps the renderer able to
// colour locked blocks by origin (§26) without a parallel colour grid.
type Cell uint8

// CellEmpty is an unoccupied board cell. It is the zero value, so a zeroed
// Board is an empty Board.
const CellEmpty Cell = 0

// CellOf returns the locked-block cell for a piece family.
func CellOf(k PieceKind) Cell { return Cell(k) + 1 }

// Filled reports whether the cell holds a block.
func (c Cell) Filled() bool { return c != CellEmpty }

// Kind returns the family whose block occupies the cell. It is meaningless for
// CellEmpty.
func (c Cell) Kind() PieceKind { return PieceKind(c - 1) }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS, both tests.

- [ ] **Step 6: Commit**

```bash
git add go.mod .gitignore internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): module bootstrap, piece kinds, and board cells"
```

---

### Task 2: Piece shapes and cell geometry

**Files:**
- Modify: `internal/game/piece.go`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `KindCount` (Task 1).
- Produces: `type Piece struct { Kind PieceKind; Rotation int; X, Y int }`; `func (Piece) Cells() [4][2]int` returning absolute board `{x, y}` pairs; `func SpawnPiece(PieceKind) Piece`; `func boxSize(PieceKind) int` (unexported, used by tests in-package).

**Coordinate system.** `X` and `Y` are the board coordinates of the **top-left corner of the piece's bounding box**. `Y` increases *downward*: row 0 is the top hidden spawn row, row 21 is the floor. Shape offsets are `{dx, dy}` from that corner. This convention is why §7's kick offset `(0,-1)` lifts a piece.

**Decision (§6 leaves it open).** All seven families spawn at `X=3, Y=0`. With that origin every family's rotation-0 cells land inside the two hidden rows (§5), so a new piece is invisible until gravity walks it down, and the horizontal placement matches the conventional centring: I occupies columns 3–6, O occupies 4–5, and JLSTZ occupy 3–5.

- [ ] **Step 1: Write the failing test**

Append to `internal/game/piece_test.go`:

```go
func TestShapesHaveFourDistinctCells(t *testing.T) {
	for k := PieceKind(0); int(k) < KindCount; k++ {
		for r := 0; r < 4; r++ {
			p := Piece{Kind: k, Rotation: r}
			seen := map[[2]int]bool{}
			for _, c := range p.Cells() {
				if seen[c] {
					t.Errorf("%v rotation %d: duplicate cell %v", k, r, c)
				}
				seen[c] = true
			}
			if len(seen) != 4 {
				t.Errorf("%v rotation %d: %d distinct cells, want 4", k, r, len(seen))
			}
		}
	}
}

// TestRotationsAreClockwiseImages checks all 28 shape-table entries with one
// rule: rotation r+1 must be rotation r turned 90° clockwise inside the
// family's bounding box, i.e. (x, y) -> (n-1-y, x). O is exempt because §6
// allows it to stay visually identical.
func TestRotationsAreClockwiseImages(t *testing.T) {
	for k := PieceKind(0); int(k) < KindCount; k++ {
		if k == KindO {
			continue
		}
		n := boxSize(k)
		for r := 0; r < 4; r++ {
			want := map[[2]int]bool{}
			for _, c := range (Piece{Kind: k, Rotation: r}).Cells() {
				want[[2]int{n - 1 - c[1], c[0]}] = true
			}
			for _, c := range (Piece{Kind: k, Rotation: r + 1}).Cells() {
				if !want[c] {
					t.Errorf("%v rotation %d: cell %v is not the clockwise image of rotation %d",
						k, (r+1)%4, c, r)
				}
			}
		}
	}
}

func TestKindOIsRotationInvariant(t *testing.T) {
	base := (Piece{Kind: KindO, Rotation: 0}).Cells()
	for r := 1; r < 4; r++ {
		if got := (Piece{Kind: KindO, Rotation: r}).Cells(); got != base {
			t.Errorf("O rotation %d = %v, want %v", r, got, base)
		}
	}
}

// Review Focus: Rotation is a plain int, so repeated CCW drives it negative and
// repeated CW drives it past 3. Both must normalise instead of panicking.
func TestRotationIndexNormalises(t *testing.T) {
	for k := PieceKind(0); int(k) < KindCount; k++ {
		base := (Piece{Kind: k, Rotation: 1}).Cells()
		for _, r := range []int{-3, -7, 5, 9, 401} {
			if ((r % 4) + 4) % 4 != 1 {
				continue
			}
			if got := (Piece{Kind: k, Rotation: r}).Cells(); got != base {
				t.Errorf("%v rotation %d = %v, want rotation 1 = %v", k, r, got, base)
			}
		}
	}
}

func TestSpawnPieceStartsInHiddenRows(t *testing.T) {
	for k := PieceKind(0); int(k) < KindCount; k++ {
		p := SpawnPiece(k)
		if p.Rotation != 0 {
			t.Errorf("SpawnPiece(%v).Rotation = %d, want 0", k, p.Rotation)
		}
		for _, c := range p.Cells() {
			if c[1] < 0 || c[1] >= HiddenRows {
				t.Errorf("SpawnPiece(%v) cell %v is outside the hidden rows [0,%d)", k, c, HiddenRows)
			}
			if c[0] < 0 || c[0] >= BoardWidth {
				t.Errorf("SpawnPiece(%v) cell %v is outside columns [0,%d)", k, c, BoardWidth)
			}
		}
	}
}
```

`HiddenRows` and `BoardWidth` arrive in Task 3. To keep this task green on its own, add them to `piece.go` now as part of Step 3 and let Task 3 use them.

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'Shapes|Clockwise|Invariant|Normalises|Spawn' -v`
Expected: FAIL — `undefined: Piece`, `undefined: boxSize`, `undefined: HiddenRows`.

- [ ] **Step 3: Write minimal implementation**

Append to `internal/game/piece.go`:

```go
// Board geometry (§5). Row 0 is the top of the board and row BoardHeight-1 is
// the floor; the first HiddenRows rows are the off-screen spawn area.
const (
	BoardWidth  = 10
	BoardHeight = 22
	VisibleRows = 20
	HiddenRows  = BoardHeight - VisibleRows // 2
)

// Piece is the active tetromino. X and Y are the board coordinates of the
// top-left corner of the family's bounding box.
type Piece struct {
	Kind     PieceKind
	Rotation int
	X        int
	Y        int
}

// boxSize is the width of a family's square bounding box. I and O rotate in a
// 4×4 box, everything else in 3×3.
func boxSize(k PieceKind) int {
	switch k {
	case KindI, KindO:
		return 4
	default:
		return 3
	}
}

// shapes lists, for every family and every rotation, the four {dx, dy} offsets
// from the piece origin. Rotation r+1 is rotation r turned clockwise inside the
// family's bounding box; O is deliberately identical in all four (§6).
var shapes = [KindCount][4][4][2]int{
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

// normRotation folds any rotation index, including negative ones, into [0,4).
func normRotation(r int) int { return ((r % 4) + 4) % 4 }

// Cells returns the four absolute board coordinates the piece occupies, as
// {x, y} pairs. Coordinates may fall outside the board; callers treat that as
// a collision.
func (p Piece) Cells() [4][2]int {
	offsets := shapes[p.Kind][normRotation(p.Rotation)]
	var out [4][2]int
	for i, o := range offsets {
		out[i] = [2]int{p.X + o[0], p.Y + o[1]}
	}
	return out
}

// spawnX and spawnY place a new piece so that its rotation-0 cells sit entirely
// inside the hidden rows and are horizontally centred (§5, §6).
const (
	spawnX = 3
	spawnY = 0
)

// SpawnPiece returns a piece of the given family at the spawn position in
// rotation 0. Held pieces re-enter through this function, which is what gives
// §9 its "newly spawned held pieces return to spawn rotation" rule.
func SpawnPiece(k PieceKind) Piece {
	return Piece{Kind: k, Rotation: 0, X: spawnX, Y: spawnY}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS. `TestRotationsAreClockwiseImages` passing is the proof that all 28 shape entries are mutually consistent.

- [ ] **Step 5: Commit**

```bash
git add internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): tetromino shape table with clockwise-consistent rotations"
```

---

### Task 3: Board bounds, occupancy, and cell access

**Files:**
- Create: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Cell`, `CellEmpty`, `BoardWidth`, `BoardHeight` (Tasks 1–2).
- Produces: `type Board struct { Cells [BoardHeight][BoardWidth]Cell }`; `func (*Board) At(x, y int) Cell`; `func (*Board) Set(x, y int, c Cell)`; `func (*Board) InBounds(x, y int) bool`; `func (*Board) Occupied(x, y int) bool`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/board_test.go`:

```go
package game

import "testing"

func TestBoardInBounds(t *testing.T) {
	var b Board
	cases := []struct {
		x, y int
		want bool
	}{
		{0, 0, true},
		{BoardWidth - 1, BoardHeight - 1, true},
		{-1, 0, false},
		{0, -1, false},
		{BoardWidth, 0, false},
		{0, BoardHeight, false},
	}
	for _, c := range cases {
		if got := b.InBounds(c.x, c.y); got != c.want {
			t.Errorf("InBounds(%d,%d) = %v, want %v", c.x, c.y, got, c.want)
		}
	}
}

func TestBoardSetAndAt(t *testing.T) {
	var b Board
	if b.At(4, 20) != CellEmpty {
		t.Error("fresh board is not empty")
	}
	b.Set(4, 20, CellOf(KindT))
	if got := b.At(4, 20); got != CellOf(KindT) {
		t.Errorf("At(4,20) = %v, want %v", got, CellOf(KindT))
	}
	if b.At(5, 20) != CellEmpty {
		t.Error("Set wrote outside its cell")
	}
}

// Review Focus: movement, rotation kicks, and drop-distance all probe cells
// beyond every edge, including above the top. Every one of those must read as
// occupied rather than panic.
func TestBoardOccupiedOutsideEveryEdge(t *testing.T) {
	var b Board
	for _, c := range [][2]int{
		{-1, 10}, {BoardWidth, 10}, {5, -1}, {5, BoardHeight},
		{-99, -99}, {9999, 9999},
	} {
		if !b.Occupied(c[0], c[1]) {
			t.Errorf("Occupied(%d,%d) = false, want true (outside the board)", c[0], c[1])
		}
	}
	if b.Occupied(5, 10) {
		t.Error("Occupied(5,10) = true on an empty board, want false")
	}
	b.Set(5, 10, CellOf(KindZ))
	if !b.Occupied(5, 10) {
		t.Error("Occupied(5,10) = false after Set, want true")
	}
}

func TestBoardSetOutOfBoundsIsNoOp(t *testing.T) {
	var b Board
	b.Set(-1, -1, CellOf(KindI))
	b.Set(BoardWidth, BoardHeight, CellOf(KindI))
	if b.At(-1, -1) != CellEmpty || b.At(0, 0) != CellEmpty {
		t.Error("out-of-bounds Set corrupted the board")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run TestBoard -v`
Expected: FAIL — `undefined: Board`.

- [ ] **Step 3: Write minimal implementation**

Create `internal/game/board.go`:

```go
package game

// Board is the logical playfield: 10 columns by 22 rows, of which the top
// HiddenRows are the off-screen spawn area (§5). The zero value is an empty
// board. Board holds only logical cells — never glyphs, colours, or effect
// state (§5: "Never use visual effects as collision data").
type Board struct {
	Cells [BoardHeight][BoardWidth]Cell
}

// InBounds reports whether the coordinate names a real board cell.
func (b *Board) InBounds(x, y int) bool {
	return x >= 0 && x < BoardWidth && y >= 0 && y < BoardHeight
}

// At returns the cell at the coordinate, or CellEmpty if it is out of bounds.
func (b *Board) At(x, y int) Cell {
	if !b.InBounds(x, y) {
		return CellEmpty
	}
	return b.Cells[y][x]
}

// Set writes a cell. Out-of-bounds writes are silently dropped so that callers
// never have to bounds-check first.
func (b *Board) Set(x, y int, c Cell) {
	if !b.InBounds(x, y) {
		return
	}
	b.Cells[y][x] = c
}

// Occupied reports whether a coordinate blocks a piece. Everything outside the
// board counts as occupied, on all four sides: that single rule turns wall
// collisions, floor collisions, and the ceiling into one check.
func (b *Board) Occupied(x, y int) bool {
	if !b.InBounds(x, y) {
		return true
	}
	return b.Cells[y][x].Filled()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board bounds and occupancy"
```

---

### Task 4: Row completion, clearing, and collapse

**Files:**
- Modify: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Board` (Task 3).
- Produces: `func (*Board) RowFull(y int) bool`; `func (*Board) FullRows() []int` (ascending, `nil` when none); `func (*Board) ClearRows(rows []int)`.

- [ ] **Step 1: Write the failing test**

Append to `internal/game/board_test.go`:

```go
// fillRow fills every column of row y except the columns listed in gaps.
func fillRow(b *Board, y int, k PieceKind, gaps ...int) {
	skip := map[int]bool{}
	for _, g := range gaps {
		skip[g] = true
	}
	for x := 0; x < BoardWidth; x++ {
		if !skip[x] {
			b.Set(x, y, CellOf(k))
		}
	}
}

func TestRowFull(t *testing.T) {
	var b Board
	if b.RowFull(21) {
		t.Error("empty row reported full")
	}
	fillRow(&b, 21, KindI, 3)
	if b.RowFull(21) {
		t.Error("row with a gap reported full")
	}
	b.Set(3, 21, CellOf(KindI))
	if !b.RowFull(21) {
		t.Error("complete row reported not full")
	}
}

func TestFullRowsAscending(t *testing.T) {
	var b Board
	if got := b.FullRows(); len(got) != 0 {
		t.Errorf("FullRows() on empty board = %v, want empty", got)
	}
	fillRow(&b, 19, KindI)
	fillRow(&b, 21, KindI)
	fillRow(&b, 20, KindI, 0)
	got := b.FullRows()
	want := []int{19, 21}
	if len(got) != len(want) {
		t.Fatalf("FullRows() = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("FullRows() = %v, want %v", got, want)
		}
	}
}

// Review Focus: an I-piece can complete rows 8 and 11 while 9 and 10 stay
// partial. Both must clear, the partial rows must survive in order, and
// exactly two empty rows must appear at the top.
func TestClearRowsNonContiguousCollapse(t *testing.T) {
	var b Board
	fillRow(&b, 8, KindI)             // full
	b.Set(0, 9, CellOf(KindJ))        // marker A
	b.Set(1, 10, CellOf(KindL))       // marker B
	fillRow(&b, 11, KindI)            // full
	b.Set(2, 12, CellOf(KindT))       // marker C

	b.ClearRows([]int{8, 11})

	// Rows 9 and 10 fell two; row 12 stayed put (only rows above it went).
	if got := b.At(0, 11); got != CellOf(KindJ) {
		t.Errorf("marker A at (0,11) = %v, want J", got)
	}
	if got := b.At(1, 12); got != CellOf(KindL) {
		t.Errorf("marker B at (1,12) = %v, want L", got)
	}
	if got := b.At(2, 12); got != CellOf(KindT) {
		t.Errorf("marker C at (2,12) = %v, want T", got)
	}
	for y := 0; y < 2; y++ {
		if !rowEmpty(&b, y) {
			t.Errorf("row %d is not empty after the clear", y)
		}
	}
	if len(b.FullRows()) != 0 {
		t.Error("full rows remain after ClearRows")
	}
}

func TestClearRowsFourAtOnce(t *testing.T) {
	var b Board
	for y := 18; y <= 21; y++ {
		fillRow(&b, y, KindI)
	}
	b.Set(0, 17, CellOf(KindZ))
	b.ClearRows([]int{18, 19, 20, 21})
	if got := b.At(0, 21); got != CellOf(KindZ) {
		t.Errorf("survivor at (0,21) = %v, want Z", got)
	}
	for y := 0; y < BoardHeight-1; y++ {
		if !rowEmpty(&b, y) {
			t.Errorf("row %d is not empty after a four-line clear", y)
		}
	}
}

func TestClearRowsEmptyIsNoOp(t *testing.T) {
	var b Board
	b.Set(4, 20, CellOf(KindO))
	b.ClearRows(nil)
	if b.At(4, 20) != CellOf(KindO) {
		t.Error("ClearRows(nil) moved the board")
	}
}

func rowEmpty(b *Board, y int) bool {
	for x := 0; x < BoardWidth; x++ {
		if b.At(x, y).Filled() {
			return false
		}
	}
	return true
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'RowFull|FullRows|ClearRows' -v`
Expected: FAIL — `b.RowFull undefined`.

- [ ] **Step 3: Write minimal implementation**

Append to `internal/game/board.go`:

```go
// RowFull reports whether every column of the row holds a block.
func (b *Board) RowFull(y int) bool {
	if y < 0 || y >= BoardHeight {
		return false
	}
	for x := 0; x < BoardWidth; x++ {
		if !b.Cells[y][x].Filled() {
			return false
		}
	}
	return true
}

// FullRows returns the indices of every complete row, ascending (top-most
// first). It returns nil when nothing is complete.
func (b *Board) FullRows() []int {
	var rows []int
	for y := 0; y < BoardHeight; y++ {
		if b.RowFull(y) {
			rows = append(rows, y)
		}
	}
	return rows
}

// ClearRows removes the given rows and collapses everything above them
// downward, refilling the top with empty rows. The rows need not be
// contiguous. Rows outside the board are ignored.
func (b *Board) ClearRows(rows []int) {
	if len(rows) == 0 {
		return
	}
	cleared := map[int]bool{}
	for _, y := range rows {
		if y >= 0 && y < BoardHeight {
			cleared[y] = true
		}
	}
	if len(cleared) == 0 {
		return
	}

	// Walk bottom-up, copying surviving rows down into a write cursor. Rows
	// above the cursor when the walk ends are zeroed.
	write := BoardHeight - 1
	for read := BoardHeight - 1; read >= 0; read-- {
		if cleared[read] {
			continue
		}
		b.Cells[write] = b.Cells[read]
		write--
	}
	for ; write >= 0; write-- {
		b.Cells[write] = [BoardWidth]Cell{}
	}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): row completion, clearing, and collapse"
```

---

### Task 5: The 7-bag

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `KindCount` (Task 1).
- Produces: `type Bag struct { ... }`; `func (*Bag) Next(rng *rand.Rand) PieceKind`.

**Decision.** `Bag` does not hold an RNG. It takes one per draw. §49.6 makes `Game` the sole owner of the game RNG; passing it in at the call site makes it impossible for a second generator to sneak into piece order.

- [ ] **Step 1: Write the failing test**

Create `internal/game/bag_test.go`:

```go
package game

import (
	"math/rand"
	"sort"
	"testing"
)

func drawN(b *Bag, rng *rand.Rand, n int) []PieceKind {
	out := make([]PieceKind, n)
	for i := range out {
		out[i] = b.Next(rng)
	}
	return out
}

func TestBagEachSevenIsAPermutation(t *testing.T) {
	var b Bag
	rng := rand.New(rand.NewSource(1))
	for round := 0; round < 20; round++ {
		got := drawN(&b, rng, KindCount)
		sort.Slice(got, func(i, j int) bool { return got[i] < got[j] })
		for i, k := range got {
			if int(k) != i {
				t.Fatalf("round %d: bag contents %v are not one of each family", round, got)
			}
		}
	}
}

func TestBagSeededGenerationIsReproducible(t *testing.T) {
	var b1, b2 Bag
	a := drawN(&b1, rand.New(rand.NewSource(8675309)), 40)
	c := drawN(&b2, rand.New(rand.NewSource(8675309)), 40)
	for i := range a {
		if a[i] != c[i] {
			t.Fatalf("draw %d differs between identically seeded bags: %v vs %v", i, a[i], c[i])
		}
	}
}

func TestBagIsUniformOverManyBags(t *testing.T) {
	var b Bag
	rng := rand.New(rand.NewSource(42))
	counts := [KindCount]int{}
	for _, k := range drawN(&b, rng, 100*KindCount) {
		counts[k]++
	}
	for k, n := range counts {
		if n != 100 {
			t.Errorf("%v drawn %d times over 100 bags, want exactly 100", PieceKind(k), n)
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run TestBag -v`
Expected: FAIL — `undefined: Bag`.

- [ ] **Step 3: Write minimal implementation**

Create `internal/game/bag.go`:

```go
package game

import "math/rand"

// Bag is the 7-bag piece generator from §6: one of every family goes in, the
// bag is shuffled, it is consumed, and it refills when empty. The zero value
// is an empty bag that refills on first use.
//
// Bag deliberately holds no RNG. Callers pass the game's single generator in,
// which is what keeps piece order dependent on the game seed alone (§49.6).
type Bag struct {
	remaining []PieceKind
}

// Next returns the next family, refilling and shuffling from rng when the bag
// runs out.
func (b *Bag) Next(rng *rand.Rand) PieceKind {
	if len(b.remaining) == 0 {
		b.refill(rng)
	}
	last := len(b.remaining) - 1
	k := b.remaining[last]
	b.remaining = b.remaining[:last]
	return k
}

func (b *Bag) refill(rng *rand.Rand) {
	b.remaining = b.remaining[:0]
	for k := PieceKind(0); int(k) < KindCount; k++ {
		b.remaining = append(b.remaining, k)
	}
	rng.Shuffle(len(b.remaining), func(i, j int) {
		b.remaining[i], b.remaining[j] = b.remaining[j], b.remaining[i]
	})
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): 7-bag piece generator"
```

---

### Task 6: Events

**Files:**
- Create: `internal/game/event.go`
- Test: `internal/game/event_test.go`

**Interfaces:**
- Consumes: `Piece`, `Cell`, `BoardWidth` (Tasks 1–3).
- Produces: `type EventKind int` with constants `EventPieceMoved EventPieceRotated EventPieceHardDropped EventPieceLocked EventHoldUsed EventLinesCleared EventComboChanged EventLevelChanged EventGameOver`; `func (EventKind) String() string`; `type Event struct { Kind EventKind; Piece Piece; Outgoing Piece; Rows []int; ClearedCells [][BoardWidth]Cell; Distance int; Value int }`.

**Why `ClearedCells`.** §19's supernova animation has to draw debris in the colours of the blocks that just vanished, but the board has already collapsed by the time the FX system sees the event. Carrying the row contents on the event is the only way the FX system can know them without reaching into game state, which §14 forbids.

- [ ] **Step 1: Write the failing test**

Create `internal/game/event_test.go`:

```go
package game

import "testing"

func TestEventKindStrings(t *testing.T) {
	want := map[EventKind]string{
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
	if len(want) != int(eventKindCount) {
		t.Fatalf("test covers %d kinds, package declares %d", len(want), eventKindCount)
	}
	for k, s := range want {
		if got := k.String(); got != s {
			t.Errorf("EventKind(%d).String() = %q, want %q", k, got, s)
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run TestEventKind -v`
Expected: FAIL — `undefined: EventKind`.

- [ ] **Step 3: Write minimal implementation**

Create `internal/game/event.go`:

```go
package game

// EventKind names something the engine did. Events are the entire contract
// between the engine and the effects system (§14): the engine emits, the FX
// world observes, and nothing flows back.
type EventKind int

// The event vocabulary from §14.
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

	eventKindCount
)

var eventKindNames = [eventKindCount]string{
	"PieceMoved", "PieceRotated", "PieceHardDropped", "PieceLocked",
	"HoldUsed", "LinesCleared", "ComboChanged", "LevelChanged", "GameOver",
}

// String returns the event name.
func (k EventKind) String() string {
	if k < 0 || k >= eventKindCount {
		return "Unknown"
	}
	return eventKindNames[k]
}

// Event describes one thing that happened during Apply or Advance. Which
// fields carry meaning depends on Kind; the rest are zero.
type Event struct {
	Kind EventKind

	// Piece is the piece the event concerns, in its post-event position.
	// Meaningful for PieceMoved, PieceRotated, PieceHardDropped, PieceLocked,
	// and HoldUsed (where it is the piece that just became active).
	Piece Piece

	// Outgoing is the piece that went into hold, in the position it held when
	// the swap happened. Meaningful for HoldUsed only, and it is what §9's
	// "compressed, streaked sideways, gone" animation animates.
	Outgoing Piece

	// Rows lists the cleared board rows, ascending. Meaningful for
	// LinesCleared.
	Rows []int

	// ClearedCells holds the contents of each row in Rows, in the same order,
	// captured immediately before the clear. Meaningful for LinesCleared; it
	// lets the supernova animation in §19 use the right colours.
	ClearedCells [][BoardWidth]Cell

	// Distance is how many cells the piece travelled. Meaningful for
	// PieceHardDropped.
	Distance int

	// Value is the new combo count for ComboChanged and the new level for
	// LevelChanged.
	Value int
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/event.go internal/game/event_test.go
git commit -m "feat(game): event vocabulary"
```

---

### Task 7: Rule constants and pure rule functions

**Files:**
- Create: `internal/game/rules.go`
- Test: `internal/game/rules_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces: `var KickOffsets [8][2]int`; `const LockDelay time.Duration`; `const MaxLockResets int`; `const NextQueueLen int`; `const BaseDropInterval time.Duration`; `const MinDropInterval time.Duration`; `const GravityDecay float64`; `func DropInterval(level int) time.Duration`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/rules_test.go`:

```go
package game

import (
	"testing"
	"time"
)

func TestKickOffsetOrder(t *testing.T) {
	want := [8][2]int{
		{0, 0}, {-1, 0}, {1, 0}, {-2, 0}, {2, 0}, {0, -1}, {-1, -1}, {1, -1},
	}
	if KickOffsets != want {
		t.Errorf("KickOffsets = %v, want the §7 order %v", KickOffsets, want)
	}
}

func TestDropIntervalLevelOne(t *testing.T) {
	if got := DropInterval(1); got != 800*time.Millisecond {
		t.Errorf("DropInterval(1) = %v, want 800ms", got)
	}
}

func TestDropIntervalDecaysByFactor(t *testing.T) {
	got := DropInterval(2)
	want := 688 * time.Millisecond // 800 × 0.86
	if d := got - want; d > time.Millisecond || d < -time.Millisecond {
		t.Errorf("DropInterval(2) = %v, want within 1ms of %v", got, want)
	}
}

func TestDropIntervalIsMonotonic(t *testing.T) {
	prev := DropInterval(1)
	for level := 2; level <= 40; level++ {
		cur := DropInterval(level)
		if cur > prev {
			t.Fatalf("DropInterval(%d) = %v is slower than level %d's %v", level, cur, level-1, prev)
		}
		prev = cur
	}
}

// Review Focus: a long game reaches level 40+, where 800ms × 0.86^(level-1)
// underflows toward zero. A zero or negative interval makes the gravity loop in
// Advance spin forever.
func TestDropIntervalNeverDropsBelowTheClamp(t *testing.T) {
	for _, level := range []int{0, -5, 1, 19, 20, 100, 1000, 1 << 20} {
		got := DropInterval(level)
		if got < MinDropInterval {
			t.Errorf("DropInterval(%d) = %v, below the %v clamp", level, got, MinDropInterval)
		}
		if got > BaseDropInterval {
			t.Errorf("DropInterval(%d) = %v, above the level-1 interval %v", level, got, BaseDropInterval)
		}
	}
	if got := DropInterval(1000); got != MinDropInterval {
		t.Errorf("DropInterval(1000) = %v, want the clamp %v", got, MinDropInterval)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'Kick|DropInterval' -v`
Expected: FAIL — `undefined: KickOffsets`.

- [ ] **Step 3: Write minimal implementation**

Create `internal/game/rules.go`:

```go
package game

import (
	"math"
	"time"
)

// KickOffsets is §7's wall-kick ladder: on rotation, try these {dx, dy}
// nudges in order and take the first that fits. dy of -1 lifts the piece,
// because y grows downward. This is deliberately a short fixed list rather
// than a full rotation ruleset — forgiving to play, and small enough to hold
// in your head.
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

// Gravity, locking, and queue tuning (§6, §11, §12).
const (
	// BaseDropInterval is the level-1 gravity period.
	BaseDropInterval = 800 * time.Millisecond
	// MinDropInterval floors gravity so that high levels stay playable and,
	// more importantly, so the gravity loop always terminates.
	MinDropInterval = 60 * time.Millisecond
	// GravityDecay multiplies the interval once per level.
	GravityDecay = 0.86
	// LinesPerLevel is how many cleared lines advance the level.
	LinesPerLevel = 10

	// LockDelay is how long a grounded piece waits before committing.
	LockDelay = 500 * time.Millisecond
	// MaxLockResets caps how many times movement can restart LockDelay, which
	// is what stops infinite stalling.
	MaxLockResets = 15

	// NextQueueLen is how many upcoming pieces the engine keeps visible.
	NextQueueLen = 5
)

// DropInterval returns the gravity period for a level: BaseDropInterval scaled
// by GravityDecay once per level above 1, floored at MinDropInterval. Levels
// below 1 are treated as level 1.
func DropInterval(level int) time.Duration {
	if level < 1 {
		level = 1
	}
	scaled := float64(BaseDropInterval) * math.Pow(GravityDecay, float64(level-1))
	if scaled <= float64(MinDropInterval) {
		return MinDropInterval
	}
	return time.Duration(scaled)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/rules.go internal/game/rules_test.go
git commit -m "feat(game): gravity curve, lock timing, and wall-kick ladder"
```

---

### Task 8: Scoring arithmetic

**Files:**
- Create: `internal/game/scoring.go`
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: `LinesPerLevel` (Task 7).
- Produces: `func LineScore(lines, level int) int`; `func ComboBonus(combo, level int) int`; `func LevelForLines(lines int) int`; `const SoftDropPoints = 1`; `const HardDropPoints = 2`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/scoring_test.go`:

```go
package game

import "testing"

func TestLineScore(t *testing.T) {
	cases := []struct {
		lines, level, want int
	}{
		{0, 1, 0},
		{1, 1, 100},
		{2, 1, 300},
		{3, 1, 500},
		{4, 1, 800},
		{1, 7, 700},
		{4, 7, 5600},
		{5, 3, 0}, // impossible; must not index past the table
	}
	for _, c := range cases {
		if got := LineScore(c.lines, c.level); got != c.want {
			t.Errorf("LineScore(%d,%d) = %d, want %d", c.lines, c.level, got, c.want)
		}
	}
}

// §49.1: bonus = 50 × (combo-1) × level, so a lone clear earns nothing and the
// bonus first appears at combo 2.
func TestComboBonus(t *testing.T) {
	cases := []struct {
		combo, level, want int
	}{
		{0, 5, 0},
		{1, 5, 0},
		{2, 1, 50},
		{2, 5, 250},
		{5, 3, 600},
		{-3, 4, 0},
	}
	for _, c := range cases {
		if got := ComboBonus(c.combo, c.level); got != c.want {
			t.Errorf("ComboBonus(%d,%d) = %d, want %d", c.combo, c.level, got, c.want)
		}
	}
}

func TestLevelForLines(t *testing.T) {
	cases := []struct{ lines, want int }{
		{0, 1}, {1, 1}, {9, 1}, {10, 2}, {19, 2}, {20, 3}, {127, 13},
	}
	for _, c := range cases {
		if got := LevelForLines(c.lines); got != c.want {
			t.Errorf("LevelForLines(%d) = %d, want %d", c.lines, got, c.want)
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'LineScore|ComboBonus|LevelForLines' -v`
Expected: FAIL — `undefined: LineScore`.

- [ ] **Step 3: Write minimal implementation**

Create `internal/game/scoring.go`:

```go
package game

// Drop rewards (§11).
const (
	SoftDropPoints = 1
	HardDropPoints = 2
)

// lineValues is §13's base clear table, indexed by lines cleared.
var lineValues = [5]int{0, 100, 300, 500, 800}

// LineScore returns the base value of clearing lines at a level. Counts
// outside 0..4 score nothing.
func LineScore(lines, level int) int {
	if lines < 0 || lines >= len(lineValues) {
		return 0
	}
	if level < 1 {
		level = 1
	}
	return lineValues[lines] * level
}

// ComboBonus returns §49.1's combo bonus: 50 × (combo-1) × level. Combo 1 — a
// lone clear — earns nothing, so the bonus first appears at combo 2, exactly
// where §21 starts escalating the effects.
func ComboBonus(combo, level int) int {
	if combo < 2 {
		return 0
	}
	if level < 1 {
		level = 1
	}
	return 50 * (combo - 1) * level
}

// LevelForLines returns the level for a total line count: level 1 until the
// tenth line, then one level per LinesPerLevel lines (§11).
func LevelForLines(lines int) int {
	if lines < 0 {
		return 1
	}
	return lines/LinesPerLevel + 1
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/scoring.go internal/game/scoring_test.go
git commit -m "feat(game): scoring, combo bonus, and level progression"
```

---

### Task 9: Game construction, next queue, and restart

**Files:**
- Create: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–8.
- Produces: `type Game struct { Board Board; Active Piece; Hold *PieceKind; CanHold bool; Next []PieceKind; Score, Lines, Level, Combo int; Over bool; GravityAccumulator, LockAccumulator time.Duration; Seed int64 }` (plus unexported `bag`, `rng`, `lockResets`, `events`); `func New(seed int64) *Game`; `func (*Game) Restart()`.

**Field-name note.** §34 sketches `Bag Bag` as an exported field; it is unexported here (`bag`) alongside `rng`, because §49.6 makes the pair an implementation detail that nothing outside the package may reach into. `Seed` stays exported: it is displayed in the title bar (§4's `LOCAL UNIVERSE 7F3A`) and reused by restart.

- [ ] **Step 1: Write the failing test**

Create `internal/game/game_test.go`:

```go
package game

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestNewGameInitialState(t *testing.T) {
	g := New(1234)
	if g.Level != 1 {
		t.Errorf("Level = %d, want 1", g.Level)
	}
	if g.Score != 0 || g.Lines != 0 || g.Combo != 0 {
		t.Errorf("Score/Lines/Combo = %d/%d/%d, want 0/0/0", g.Score, g.Lines, g.Combo)
	}
	if !g.CanHold {
		t.Error("CanHold = false on a new game, want true")
	}
	if g.Hold != nil {
		t.Error("Hold is set on a new game, want nil")
	}
	if g.Over {
		t.Error("Over = true on a new game")
	}
	if len(g.Next) != NextQueueLen {
		t.Errorf("len(Next) = %d, want %d", len(g.Next), NextQueueLen)
	}
	if g.Seed != 1234 {
		t.Errorf("Seed = %d, want 1234", g.Seed)
	}
	if g.Active != SpawnPiece(g.Active.Kind) {
		t.Errorf("Active = %+v, want the spawn position for %v", g.Active, g.Active.Kind)
	}
	for y := 0; y < BoardHeight; y++ {
		if !rowEmpty(&g.Board, y) {
			t.Fatalf("new game board row %d is not empty", y)
		}
	}
}

func TestNewGameSameSeedSameQueue(t *testing.T) {
	a, b := New(99), New(99)
	if a.Active != b.Active {
		t.Errorf("active pieces differ: %+v vs %+v", a.Active, b.Active)
	}
	for i := range a.Next {
		if a.Next[i] != b.Next[i] {
			t.Fatalf("Next[%d] differs: %v vs %v", i, a.Next[i], b.Next[i])
		}
	}
}

func TestRestartRestoresTheOpeningPosition(t *testing.T) {
	g := New(7)
	openingActive := g.Active
	openingNext := append([]PieceKind(nil), g.Next...)

	g.Board.Set(0, 21, CellOf(KindZ))
	g.Score, g.Lines, g.Level, g.Combo = 500, 12, 2, 3
	g.Over = true
	held := KindT
	g.Hold = &held
	g.CanHold = false
	g.GravityAccumulator = 123 * time.Millisecond
	g.LockAccumulator = 45 * time.Millisecond

	g.Restart()

	if g.Over || g.Score != 0 || g.Lines != 0 || g.Level != 1 || g.Combo != 0 {
		t.Errorf("after Restart: Over=%v Score=%d Lines=%d Level=%d Combo=%d", g.Over, g.Score, g.Lines, g.Level, g.Combo)
	}
	if g.Hold != nil || !g.CanHold {
		t.Error("Restart did not clear hold")
	}
	if g.GravityAccumulator != 0 || g.LockAccumulator != 0 {
		t.Error("Restart did not clear the timing accumulators")
	}
	if g.Board.At(0, 21).Filled() {
		t.Error("Restart did not clear the board")
	}
	if g.Seed != 7 {
		t.Errorf("Seed = %d after Restart, want 7", g.Seed)
	}
	if g.Active != openingActive {
		t.Errorf("Active = %+v after Restart, want the opening piece %+v", g.Active, openingActive)
	}
	for i := range openingNext {
		if g.Next[i] != openingNext[i] {
			t.Fatalf("Next[%d] = %v after Restart, want %v", i, g.Next[i], openingNext[i])
		}
	}
}

// §49.2: the engine must never read a clock, or "same seed + same inputs +
// same timings reproduces the state" is unenforceable. This checks the source,
// because no behavioural test can.
func TestEngineNeverReadsAClock(t *testing.T) {
	entries, err := os.ReadDir(".")
	if err != nil {
		t.Fatal(err)
	}
	for _, e := range entries {
		name := e.Name()
		if e.IsDir() || !strings.HasSuffix(name, ".go") || strings.HasSuffix(name, "_test.go") {
			continue
		}
		src, err := os.ReadFile(filepath.Join(".", name))
		if err != nil {
			t.Fatal(err)
		}
		for _, banned := range []string{"time.Now(", "time.Since(", "time.Tick(", "time.After("} {
			if strings.Contains(string(src), banned) {
				t.Errorf("%s calls %s); §49.2 forbids the engine from reading a clock", name, banned)
			}
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestNewGame|TestRestart|NeverReadsAClock' -v`
Expected: FAIL — `undefined: New`.

- [ ] **Step 3: Write minimal implementation**

Create `internal/game/game.go`:

```go
package game

import (
	"math/rand"
	"time"
)

// Game is the whole logical state of a run. It is driven by exactly two calls:
// Apply for player input and Advance for elapsed time. Both return the events
// they caused.
//
// Game owns the only RNG that touches piece order (§49.6). The effects system
// has its own, and the two never meet — otherwise particle counts would change
// which pieces you get.
type Game struct {
	Board   Board
	Active  Piece
	Hold    *PieceKind
	CanHold bool

	// Next holds the upcoming families, oldest first. It is kept at
	// NextQueueLen entries so the HUD can always show five (§6).
	Next []PieceKind

	Score int
	Lines int
	Level int
	Combo int

	// Over is set once a spawn is blocked. Apply and Advance become no-ops.
	Over bool

	// GravityAccumulator and LockAccumulator carry sub-interval time between
	// Advance calls, which is what decouples gravity from render rate (§11).
	GravityAccumulator time.Duration
	LockAccumulator    time.Duration

	// Seed is recorded for display and restart (§49.6).
	Seed int64

	bag        Bag
	rng        *rand.Rand
	grounded   bool
	lockResets int
	events     []Event
}

// New starts a run from a seed.
func New(seed int64) *Game {
	g := &Game{Seed: seed}
	g.reset()
	return g
}

// Restart begins a fresh run with the same seed, so `r` after a game over
// replays the same universe (§28's REBOOT UNIVERSE).
func (g *Game) Restart() { g.reset() }

func (g *Game) reset() {
	seed := g.Seed
	*g = Game{Seed: seed}
	g.rng = rand.New(rand.NewSource(seed))
	g.Level = 1
	g.CanHold = true
	g.Next = make([]PieceKind, 0, NextQueueLen+1)
	g.refillNext()
	g.Active = SpawnPiece(g.takeNext())
}

// refillNext tops the queue back up to NextQueueLen.
func (g *Game) refillNext() {
	for len(g.Next) < NextQueueLen {
		g.Next = append(g.Next, g.bag.Next(g.rng))
	}
}

// takeNext pops the head of the queue and refills behind it.
func (g *Game) takeNext() PieceKind {
	k := g.Next[0]
	g.Next = append(g.Next[:0], g.Next[1:]...)
	g.refillNext()
	return k
}

// emit records an event for the caller of Apply or Advance.
func (g *Game) emit(e Event) { g.events = append(g.events, e) }

// takeEvents hands the accumulated events to the caller and clears the buffer,
// so the caller owns the returned slice.
func (g *Game) takeEvents() []Event {
	evs := g.events
	g.events = nil
	return evs
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game construction, next queue, and restart"
```

---

### Task 10: Collision, horizontal movement, drop distance, and ghost

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: `Game` (Task 9), `Board.Occupied` (Task 3), `Piece.Cells` (Task 2).
- Produces: `type Input int` with constants `InputLeft InputRight InputSoftDrop InputRotateCW InputRotateCCW InputHardDrop InputHold`; `func (*Game) Apply(in Input) []Event`; `func (*Game) DropDistance() int`; `func (*Game) GhostPiece() Piece`; unexported `collides`, `canMove`, `tryMove`, `resetLockOnAction`.

This task implements `Apply` for `InputLeft` and `InputRight` only. A `default:` branch handles the rest as no-ops; Tasks 11–14 fill them in.

- [ ] **Step 1: Write the failing test**

Append to `internal/game/game_test.go`:

```go
// newTestGame returns a game whose active piece is a known family at a known
// spot, so movement tests do not depend on the bag.
func newTestGame(t *testing.T, k PieceKind, x, y, rot int) *Game {
	t.Helper()
	g := New(1)
	g.Active = Piece{Kind: k, Rotation: rot, X: x, Y: y}
	return g
}

func TestMoveLeftAndRight(t *testing.T) {
	g := newTestGame(t, KindT, 4, 10, 0)
	evs := g.Apply(InputLeft)
	if g.Active.X != 3 {
		t.Errorf("X = %d after InputLeft, want 3", g.Active.X)
	}
	if len(evs) != 1 || evs[0].Kind != EventPieceMoved {
		t.Errorf("events = %v, want one PieceMoved", evs)
	}
	if evs[0].Piece != g.Active {
		t.Errorf("event piece = %+v, want the moved piece %+v", evs[0].Piece, g.Active)
	}
	g.Apply(InputRight)
	g.Apply(InputRight)
	if g.Active.X != 5 {
		t.Errorf("X = %d after two InputRight, want 5", g.Active.X)
	}
}

func TestMoveBlockedByWalls(t *testing.T) {
	// T rotation 0 occupies dx 0..2, so X=0 is flush against the left wall.
	g := newTestGame(t, KindT, 0, 10, 0)
	if evs := g.Apply(InputLeft); len(evs) != 0 {
		t.Errorf("events = %v moving into the left wall, want none", evs)
	}
	if g.Active.X != 0 {
		t.Errorf("X = %d, want 0 (unmoved)", g.Active.X)
	}

	g = newTestGame(t, KindT, BoardWidth-3, 10, 0)
	if evs := g.Apply(InputRight); len(evs) != 0 {
		t.Errorf("events = %v moving into the right wall, want none", evs)
	}
	if g.Active.X != BoardWidth-3 {
		t.Errorf("X = %d, want %d (unmoved)", g.Active.X, BoardWidth-3)
	}
}

func TestMoveBlockedByLockedCell(t *testing.T) {
	g := newTestGame(t, KindO, 4, 10, 0)
	// O rotation 0 fills columns X+1 and X+2 in rows Y and Y+1.
	g.Board.Set(4, 10, CellOf(KindI)) // directly left of the O's left column
	if evs := g.Apply(InputLeft); len(evs) != 0 {
		t.Errorf("events = %v moving into a locked cell, want none", evs)
	}
	if g.Active.X != 4 {
		t.Errorf("X = %d, want 4 (unmoved)", g.Active.X)
	}
}

func TestDropDistanceOnEmptyBoard(t *testing.T) {
	g := newTestGame(t, KindO, 4, 0, 0)
	// O's lowest cell is at Y+1, so it lands with Y+1 == BoardHeight-1.
	want := BoardHeight - 2
	if got := g.DropDistance(); got != want {
		t.Errorf("DropDistance() = %d, want %d", got, want)
	}
}

func TestDropDistanceStopsOnTheStack(t *testing.T) {
	g := newTestGame(t, KindO, 4, 0, 0)
	fillRow(&g.Board, 21, KindI)
	fillRow(&g.Board, 20, KindI)
	want := BoardHeight - 4 // lowest cell rests on row 19
	if got := g.DropDistance(); got != want {
		t.Errorf("DropDistance() = %d, want %d", got, want)
	}
}

func TestGhostPieceIsTheActivePieceAtItsLanding(t *testing.T) {
	g := newTestGame(t, KindL, 2, 3, 1)
	d := g.DropDistance()
	ghost := g.GhostPiece()
	want := g.Active
	want.Y += d
	if ghost != want {
		t.Errorf("GhostPiece() = %+v, want %+v", ghost, want)
	}
	if g.Active.Y != 3 {
		t.Error("GhostPiece mutated the active piece")
	}
}

func TestGhostPieceWhenAlreadyLanded(t *testing.T) {
	g := newTestGame(t, KindO, 4, BoardHeight-2, 0)
	if got := g.DropDistance(); got != 0 {
		t.Errorf("DropDistance() = %d for a landed piece, want 0", got)
	}
	if g.GhostPiece() != g.Active {
		t.Error("GhostPiece() should equal the active piece when it cannot fall")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestMove|DropDistance|GhostPiece' -v`
Expected: FAIL — `undefined: InputLeft`.

- [ ] **Step 3: Write minimal implementation**

Append to `internal/game/game.go`:

```go
// Input is one player action. The app layer translates keystrokes into these
// and hands them straight to Apply, so input never waits for a tick (§36).
type Input int

// The player actions from §8.
const (
	InputLeft Input = iota
	InputRight
	InputSoftDrop
	InputRotateCW
	InputRotateCCW
	InputHardDrop
	InputHold
)

// Apply performs a player action and returns the events it caused. It is a
// no-op once the game is over.
func (g *Game) Apply(in Input) []Event {
	if g.Over {
		return nil
	}
	switch in {
	case InputLeft:
		g.tryMove(-1, 0)
	case InputRight:
		g.tryMove(1, 0)
	}
	return g.takeEvents()
}

// collides reports whether a piece overlaps the stack or leaves the board.
func (g *Game) collides(p Piece) bool {
	for _, c := range p.Cells() {
		if g.Board.Occupied(c[0], c[1]) {
			return true
		}
	}
	return false
}

// canMove reports whether the active piece fits after a translation.
func (g *Game) canMove(dx, dy int) bool {
	p := g.Active
	p.X += dx
	p.Y += dy
	return !g.collides(p)
}

// tryMove translates the active piece if it fits, emitting PieceMoved and
// refreshing the lock timer. It reports whether the move happened.
func (g *Game) tryMove(dx, dy int) bool {
	if !g.canMove(dx, dy) {
		return false
	}
	g.Active.X += dx
	g.Active.Y += dy
	g.emit(Event{Kind: EventPieceMoved, Piece: g.Active})
	g.resetLockOnAction()
	return true
}

// resetLockOnAction implements §12's rule that a successful move or rotation
// while grounded restarts the lock timer — capped at MaxLockResets so the
// player cannot stall forever.
func (g *Game) resetLockOnAction() {
	if g.canMove(0, 1) {
		return // not grounded; the timer is irrelevant
	}
	if g.lockResets >= MaxLockResets {
		return
	}
	g.lockResets++
	g.LockAccumulator = 0
}

// DropDistance reports how many cells the active piece can descend before it
// would collide.
func (g *Game) DropDistance() int {
	d := 0
	for g.canMoveBy(0, d+1) {
		d++
	}
	return d
}

// canMoveBy is canMove without the +1 stepping, so DropDistance can probe an
// arbitrary offset.
func (g *Game) canMoveBy(dx, dy int) bool {
	p := g.Active
	p.X += dx
	p.Y += dy
	return !g.collides(p)
}

// GhostPiece returns the active piece translated to where it would land. The
// renderer draws it dim underneath the active piece (§10); it is display-only
// and never feeds collision (§5).
func (g *Game) GhostPiece() Piece {
	p := g.Active
	p.Y += g.DropDistance()
	return p
}
```

Note: `canMove` and `canMoveBy` are now the same function. Replace `canMove`'s body with `return g.canMoveBy(dx, dy)` and keep `canMove` as the name used elsewhere.

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): collision, horizontal movement, drop distance, and ghost"
```

---

### Task 11: Rotation with wall kicks

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: `KickOffsets` (Task 7), `Apply`, `collides` (Task 10).
- Produces: `Apply` handles `InputRotateCW` and `InputRotateCCW`; unexported `func (*Game) tryRotate(dir int) bool`.

- [ ] **Step 1: Write the failing test**

Append to `internal/game/game_test.go`:

```go
func TestRotateCycles(t *testing.T) {
	g := newTestGame(t, KindT, 4, 10, 0)
	for want := 1; want <= 4; want++ {
		evs := g.Apply(InputRotateCW)
		if len(evs) != 1 || evs[0].Kind != EventPieceRotated {
			t.Fatalf("events = %v, want one PieceRotated", evs)
		}
		if g.Active.Rotation != want%4 {
			t.Fatalf("Rotation = %d, want %d", g.Active.Rotation, want%4)
		}
	}
	g.Apply(InputRotateCCW)
	if g.Active.Rotation != 3 {
		t.Errorf("Rotation = %d after CCW from 0, want 3", g.Active.Rotation)
	}
}

// §7's ladder starts (0,0), (-1,0), (1,0): a rotation that only fits after
// shifting right must be found, and the offset actually used must be the first
// that fits.
func TestRotateKicksOffTheLeftWall(t *testing.T) {
	// I in rotation 1 is a vertical bar in box column 2, so X=-2 puts it in
	// board column 0. Rotating to horizontal needs cells at X+0..X+3 = -2..1,
	// which collides; the ladder must shift it right.
	g := newTestGame(t, KindI, -2, 10, 1)
	if evs := g.Apply(InputRotateCW); len(evs) != 1 || evs[0].Kind != EventPieceRotated {
		t.Fatalf("events = %v, want one PieceRotated", evs)
	}
	if g.Active.Rotation != 2 {
		t.Fatalf("Rotation = %d, want 2", g.Active.Rotation)
	}
	for _, c := range g.Active.Cells() {
		if c[0] < 0 || c[0] >= BoardWidth {
			t.Errorf("cell %v is off the board after the kick", c)
		}
	}
}

// The ladder must be walked in order, not merely searched. This sets up a
// rotation where (0,0) is blocked but BOTH (-1,0) and (1,0) would fit, so the
// resulting X proves which rung was taken first.
//
// L at X=4 Y=9 rotation 0 occupies (6,9),(4,10),(5,10),(6,10).
// Rotating to rotation 1 wants (5,9),(5,10),(5,11),(6,11).
// Cell (5,9) is in that footprint and in neither the (-1,0) nor the (1,0)
// footprint, so blocking it alone rules out exactly the first rung.
func TestRotateKickPrefersTheEarlierOffset(t *testing.T) {
	g := newTestGame(t, KindL, 4, 9, 0)
	if g.collides(g.Active) {
		t.Fatal("the starting position already collides; fix the fixture")
	}
	g.Board.Set(5, 9, CellOf(KindI))

	if !g.tryRotate(1) {
		t.Fatal("rotation failed, want a successful kick")
	}
	if g.Active.Rotation != 1 {
		t.Errorf("Rotation = %d, want 1", g.Active.Rotation)
	}
	if g.Active.X != 3 {
		t.Errorf("X = %d after the kick, want 3 — the ladder must reach (-1,0) before (1,0)", g.Active.X)
	}
}

func TestRotateFailsWhenNoOffsetFits(t *testing.T) {
	// Box a T into a 3-wide, 2-tall pocket at the floor so no rung fits.
	g := newTestGame(t, KindT, 4, BoardHeight-2, 0)
	for y := 0; y < BoardHeight; y++ {
		for x := 0; x < BoardWidth; x++ {
			g.Board.Set(x, y, CellOf(KindI))
		}
	}
	for _, c := range g.Active.Cells() {
		g.Board.Set(c[0], c[1], CellEmpty)
	}
	before := g.Active
	if evs := g.Apply(InputRotateCW); len(evs) != 0 {
		t.Errorf("events = %v for a blocked rotation, want none", evs)
	}
	if g.Active != before {
		t.Errorf("Active = %+v after a failed rotation, want %+v", g.Active, before)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run TestRotate -v`
Expected: FAIL — `g.tryRotate undefined`, and the `Apply` cases return no events.

- [ ] **Step 3: Write minimal implementation**

In `internal/game/game.go`, extend `Apply`'s switch:

```go
	case InputRotateCW:
		g.tryRotate(1)
	case InputRotateCCW:
		g.tryRotate(-1)
```

and append:

```go
// tryRotate rotates the active piece by dir (+1 clockwise, -1 counter-
// clockwise), walking §7's KickOffsets ladder and accepting the first offset
// that fits. If none fit the rotation simply fails and the piece is untouched —
// forgiving to play, and no rotation subsystem required.
func (g *Game) tryRotate(dir int) bool {
	for _, k := range KickOffsets {
		p := g.Active
		p.Rotation = normRotation(p.Rotation + dir)
		p.X += k[0]
		p.Y += k[1]
		if g.collides(p) {
			continue
		}
		g.Active = p
		g.emit(Event{Kind: EventPieceRotated, Piece: g.Active})
		g.resetLockOnAction()
		return true
	}
	return false
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): rotation with the simple wall-kick ladder"
```

---

### Task 12: Gravity, soft drop, and Advance

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: `DropInterval`, `LockDelay` (Task 7), `tryMove` (Task 10).
- Produces: `func (g *Game) Advance(dt time.Duration) []Event`; `Apply` handles `InputSoftDrop`.

`Advance` accrues `dt` into `GravityAccumulator`, steps the piece down once per drop interval, then — if the piece is resting — accrues `LockAccumulator` and locks when it reaches `LockDelay`. Locking itself lands in Task 13; until then `Advance` calls a `lockPiece` stub that this task defines as "commit the piece and spawn the next", with clearing and scoring added next.

**Decision.** The gravity interval is read once per `Advance` call, before the loop. A lock inside one call cannot change the level mid-loop (locking happens after the loop), so this is both correct and one fewer moving part.

- [ ] **Step 1: Write the failing test**

Append to `internal/game/game_test.go`:

```go
func TestAdvanceGravityStepsOncePerInterval(t *testing.T) {
	g := newTestGame(t, KindO, 4, 0, 0)
	iv := DropInterval(1)

	if evs := g.Advance(iv - time.Millisecond); len(evs) != 0 {
		t.Errorf("events = %v just short of one interval, want none", evs)
	}
	if g.Active.Y != 0 {
		t.Errorf("Y = %d, want 0", g.Active.Y)
	}

	evs := g.Advance(time.Millisecond)
	if len(evs) != 1 || evs[0].Kind != EventPieceMoved {
		t.Errorf("events = %v at the interval boundary, want one PieceMoved", evs)
	}
	if g.Active.Y != 1 {
		t.Errorf("Y = %d after one interval, want 1", g.Active.Y)
	}
}

func TestAdvanceStepsMultipleTimesForALargeDT(t *testing.T) {
	g := newTestGame(t, KindO, 4, 0, 0)
	iv := DropInterval(1)
	g.Advance(3*iv + iv/2)
	if g.Active.Y != 3 {
		t.Errorf("Y = %d after 3.5 intervals, want 3", g.Active.Y)
	}
	if g.GravityAccumulator != iv/2 {
		t.Errorf("GravityAccumulator = %v, want the %v remainder", g.GravityAccumulator, iv/2)
	}
}

func TestAdvanceUsesTheCurrentLevelsInterval(t *testing.T) {
	g := newTestGame(t, KindO, 4, 0, 0)
	g.Level = 5
	g.Advance(DropInterval(5))
	if g.Active.Y != 1 {
		t.Errorf("Y = %d after one level-5 interval, want 1", g.Active.Y)
	}
}

func TestAdvanceOnAFinishedGameIsANoOp(t *testing.T) {
	g := newTestGame(t, KindO, 4, 5, 0)
	g.Over = true
	before := g.Active
	if evs := g.Advance(time.Second); len(evs) != 0 {
		t.Errorf("events = %v after game over, want none", evs)
	}
	if g.Active != before || g.GravityAccumulator != 0 {
		t.Error("Advance moved a finished game")
	}
}

func TestSoftDropScoresAndResetsTheGravityClock(t *testing.T) {
	g := newTestGame(t, KindO, 4, 5, 0)
	g.GravityAccumulator = 700 * time.Millisecond
	evs := g.Apply(InputSoftDrop)
	if g.Active.Y != 6 {
		t.Errorf("Y = %d after a soft drop, want 6", g.Active.Y)
	}
	if g.Score != SoftDropPoints {
		t.Errorf("Score = %d after one soft-drop cell, want %d", g.Score, SoftDropPoints)
	}
	if g.GravityAccumulator != 0 {
		t.Errorf("GravityAccumulator = %v after a soft drop, want 0", g.GravityAccumulator)
	}
	if len(evs) != 1 || evs[0].Kind != EventPieceMoved {
		t.Errorf("events = %v, want one PieceMoved", evs)
	}
}

func TestSoftDropOnALandedPieceScoresNothing(t *testing.T) {
	g := newTestGame(t, KindO, 4, BoardHeight-2, 0)
	if evs := g.Apply(InputSoftDrop); len(evs) != 0 {
		t.Errorf("events = %v soft-dropping a landed piece, want none", evs)
	}
	if g.Score != 0 {
		t.Errorf("Score = %d, want 0", g.Score)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'TestAdvance|SoftDrop' -v`
Expected: FAIL — `g.Advance undefined`.

- [ ] **Step 3: Write minimal implementation**

Extend `Apply`'s switch in `internal/game/game.go`:

```go
	case InputSoftDrop:
		if g.tryMove(0, 1) {
			g.Score += SoftDropPoints
			g.GravityAccumulator = 0
		}
```

and append:

```go
// Advance steps the simulation forward by dt and returns the events it caused.
// This is the only way time enters the engine (§49.2): Bubble Tea owns the
// clock and passes elapsed time inward, which is what makes §35's determinism
// promise testable.
func (g *Game) Advance(dt time.Duration) []Event {
	if g.Over || dt <= 0 {
		return g.takeEvents()
	}

	interval := DropInterval(g.Level)
	g.GravityAccumulator += dt
	for g.GravityAccumulator >= interval {
		g.GravityAccumulator -= interval
		if !g.tryMove(0, 1) {
			break // resting; the lock timer below takes over
		}
	}

	if g.canMove(0, 1) {
		// Airborne: nothing to lock, so the timer stays at zero.
		g.grounded = false
		g.LockAccumulator = 0
		return g.takeEvents()
	}

	g.grounded = true
	g.LockAccumulator += dt
	if g.LockAccumulator >= LockDelay {
		g.lockPiece()
	}
	return g.takeEvents()
}

// lockPiece commits the active piece and spawns the next. Line clearing and
// scoring join it in the next task.
func (g *Game) lockPiece() {
	for _, c := range g.Active.Cells() {
		g.Board.Set(c[0], c[1], CellOf(g.Active.Kind))
	}
	g.emit(Event{Kind: EventPieceLocked, Piece: g.Active})
	g.spawnNext()
}

// spawnNext makes the head of the queue active, restoring the hold allowance
// and the lock budget. A spawn that does not fit ends the run (§28).
func (g *Game) spawnNext() {
	g.Active = SpawnPiece(g.takeNext())
	g.CanHold = true
	g.grounded = false
	g.LockAccumulator = 0
	g.GravityAccumulator = 0
	g.lockResets = 0
	if g.collides(g.Active) {
		g.Over = true
		g.emit(Event{Kind: EventGameOver, Piece: g.Active})
	}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): elapsed-time gravity, soft drop, and Advance"
```

---

### Task 13: Locking, lock resets, line clearing, and scoring

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: `lockPiece` (Task 12), `Board.FullRows`/`ClearRows` (Task 4), `LineScore`/`ComboBonus`/`LevelForLines` (Task 8).
- Produces: `lockPiece` gains clearing, scoring, combo, and level handling; emits `LinesCleared` (with `Rows` and `ClearedCells`), `ComboChanged`, `LevelChanged`.

**Decision.** A clear is scored at the level *in force when the piece locked*, then the level is recomputed and `LevelChanged` emitted. Scoring the clear at the new level would pay the level-up twice.

- [ ] **Step 1: Write the failing test**

Append to `internal/game/game_test.go`:

```go
func findEvent(evs []Event, k EventKind) (Event, bool) {
	for _, e := range evs {
		if e.Kind == k {
			return e, true
		}
	}
	return Event{}, false
}

func TestGroundedPieceLocksAfterLockDelay(t *testing.T) {
	g := newTestGame(t, KindO, 4, BoardHeight-2, 0)
	if evs := g.Advance(LockDelay - time.Millisecond); func() bool { _, ok := findEvent(evs, EventPieceLocked); return ok }() {
		t.Error("piece locked before LockDelay elapsed")
	}
	if g.Board.At(5, BoardHeight-1).Filled() {
		t.Error("piece committed early")
	}
	evs := g.Advance(time.Millisecond)
	if _, ok := findEvent(evs, EventPieceLocked); !ok {
		t.Fatalf("events = %v at LockDelay, want a PieceLocked", evs)
	}
	for _, c := range [][2]int{{5, 20}, {6, 20}, {5, 21}, {6, 21}} {
		if got := g.Board.At(c[0], c[1]); got != CellOf(KindO) {
			t.Errorf("board at %v = %v, want a locked O", c, got)
		}
	}
	if !g.CanHold {
		t.Error("CanHold = false after a lock, want true")
	}
}

func TestMovementWhileGroundedResetsTheLockTimer(t *testing.T) {
	g := newTestGame(t, KindO, 4, BoardHeight-2, 0)
	g.Advance(400 * time.Millisecond)
	if g.LockAccumulator != 400*time.Millisecond {
		t.Fatalf("LockAccumulator = %v, want 400ms", g.LockAccumulator)
	}
	g.Apply(InputLeft)
	if g.LockAccumulator != 0 {
		t.Errorf("LockAccumulator = %v after a grounded move, want 0", g.LockAccumulator)
	}
	if evs := g.Advance(400 * time.Millisecond); func() bool { _, ok := findEvent(evs, EventPieceLocked); return ok }() {
		t.Error("piece locked despite the reset")
	}
}

func TestLockResetsAreCappedAtMaxLockResets(t *testing.T) {
	g := newTestGame(t, KindO, 4, BoardHeight-2, 0)
	for i := 0; i < MaxLockResets; i++ {
		g.Advance(100 * time.Millisecond)
		if i%2 == 0 {
			g.Apply(InputLeft)
		} else {
			g.Apply(InputRight)
		}
		if g.LockAccumulator != 0 {
			t.Fatalf("reset %d did not clear the timer", i)
		}
	}
	g.Advance(100 * time.Millisecond)
	g.Apply(InputLeft)
	if g.LockAccumulator == 0 {
		t.Error("the 16th reset was granted; MaxLockResets is not enforced")
	}
}

func TestAirborneMovementDoesNotConsumeALockReset(t *testing.T) {
	g := newTestGame(t, KindO, 4, 5, 0)
	for i := 0; i < 50; i++ {
		g.Apply(InputLeft)
		g.Apply(InputRight)
	}
	g.Active = Piece{Kind: KindO, X: 4, Y: BoardHeight - 2}
	g.Advance(100 * time.Millisecond)
	g.Apply(InputLeft)
	if g.LockAccumulator != 0 {
		t.Error("airborne moves burned the lock-reset budget")
	}
}

func TestSingleClearScoresBaseValueWithNoComboBonus(t *testing.T) {
	g := newTestGame(t, KindO, 4, BoardHeight-2, 0)
	fillRow(&g.Board, BoardHeight-1, KindI, 5, 6)
	evs := g.Advance(LockDelay)

	cleared, ok := findEvent(evs, EventLinesCleared)
	if !ok {
		t.Fatalf("events = %v, want a LinesCleared", evs)
	}
	if len(cleared.Rows) != 1 || cleared.Rows[0] != BoardHeight-1 {
		t.Errorf("Rows = %v, want [%d]", cleared.Rows, BoardHeight-1)
	}
	if len(cleared.ClearedCells) != 1 {
		t.Fatalf("len(ClearedCells) = %d, want 1", len(cleared.ClearedCells))
	}
	if got := cleared.ClearedCells[0][0]; got != CellOf(KindI) {
		t.Errorf("ClearedCells[0][0] = %v, want the pre-clear I block", got)
	}
	if got := cleared.ClearedCells[0][5]; got != CellOf(KindO) {
		t.Errorf("ClearedCells[0][5] = %v, want the O that completed the row", got)
	}
	if g.Lines != 1 {
		t.Errorf("Lines = %d, want 1", g.Lines)
	}
	if g.Combo != 1 {
		t.Errorf("Combo = %d after the first clearing placement, want 1 (§49.1)", g.Combo)
	}
	if g.Score != 100 {
		t.Errorf("Score = %d, want 100 (100×level 1, no combo bonus)", g.Score)
	}
	combo, ok := findEvent(evs, EventComboChanged)
	if !ok || combo.Value != 1 {
		t.Errorf("ComboChanged = %+v, want Value 1", combo)
	}
}

func TestConsecutiveClearsAddTheComboBonus(t *testing.T) {
	g := New(1)
	// First clearing placement. Reset the board each time so the second
	// placement's arithmetic does not depend on where the first one collapsed.
	g.Board = Board{}
	g.Active = Piece{Kind: KindO, X: 4, Y: BoardHeight - 2}
	fillRow(&g.Board, BoardHeight-1, KindI, 5, 6)
	g.Advance(LockDelay)
	scoreAfterFirst := g.Score

	// Second clearing placement, still at level 1.
	g.Board = Board{}
	g.Active = Piece{Kind: KindO, X: 4, Y: BoardHeight - 2}
	fillRow(&g.Board, BoardHeight-1, KindI, 5, 6)
	evs := g.Advance(LockDelay)

	if g.Combo != 2 {
		t.Errorf("Combo = %d, want 2", g.Combo)
	}
	gained := g.Score - scoreAfterFirst
	if want := 100 + 50; gained != want {
		t.Errorf("second clear gained %d, want %d (100 base + 50 combo bonus)", gained, want)
	}
	combo, ok := findEvent(evs, EventComboChanged)
	if !ok || combo.Value != 2 {
		t.Errorf("ComboChanged = %+v, want Value 2", combo)
	}
}

func TestNonClearingPlacementResetsCombo(t *testing.T) {
	g := newTestGame(t, KindO, 4, BoardHeight-2, 0)
	fillRow(&g.Board, BoardHeight-1, KindI, 5, 6)
	g.Advance(LockDelay)
	if g.Combo != 1 {
		t.Fatalf("Combo = %d, want 1", g.Combo)
	}

	g.Board = Board{}
	g.Active = Piece{Kind: KindO, X: 0, Y: BoardHeight - 2}
	evs := g.Advance(LockDelay)
	if g.Combo != 0 {
		t.Errorf("Combo = %d after an empty placement, want 0", g.Combo)
	}
	combo, ok := findEvent(evs, EventComboChanged)
	if !ok || combo.Value != 0 {
		t.Errorf("ComboChanged = %+v, want Value 0", combo)
	}
}

func TestFourLineClearAndLevelUp(t *testing.T) {
	g := New(1)
	g.Lines = 6 // six more lines would be level 2; four clears crosses it
	g.Level = 1
	for y := BoardHeight - 4; y < BoardHeight; y++ {
		fillRow(&g.Board, y, KindI, 0)
	}
	g.Active = Piece{Kind: KindI, Rotation: 1, X: -2, Y: BoardHeight - 4}
	evs := g.Advance(LockDelay)

	cleared, ok := findEvent(evs, EventLinesCleared)
	if !ok || len(cleared.Rows) != 4 {
		t.Fatalf("events = %v, want a LinesCleared with 4 rows", evs)
	}
	for i, y := range cleared.Rows {
		if want := BoardHeight - 4 + i; y != want {
			t.Errorf("Rows[%d] = %d, want %d (ascending)", i, y, want)
		}
	}
	if g.Lines != 10 {
		t.Errorf("Lines = %d, want 10", g.Lines)
	}
	if g.Level != 2 {
		t.Errorf("Level = %d, want 2", g.Level)
	}
	if g.Score != 800 {
		t.Errorf("Score = %d, want 800 (four lines at the pre-level-up level 1)", g.Score)
	}
	lvl, ok := findEvent(evs, EventLevelChanged)
	if !ok || lvl.Value != 2 {
		t.Errorf("LevelChanged = %+v, want Value 2", lvl)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'Lock|Clear|Combo|LevelUp' -v`
Expected: FAIL — no `LinesCleared` events are emitted and `Score` stays 0.

- [ ] **Step 3: Write minimal implementation**

Replace `lockPiece` in `internal/game/game.go`:

```go
// lockPiece commits the active piece, resolves any completed rows, updates the
// score, and spawns the next piece — the §12 order. Clearing is immediate in
// logic; §19's supernova is a rendering concern that runs afterwards over the
// already-collapsed board.
func (g *Game) lockPiece() {
	for _, c := range g.Active.Cells() {
		g.Board.Set(c[0], c[1], CellOf(g.Active.Kind))
	}
	g.emit(Event{Kind: EventPieceLocked, Piece: g.Active})

	rows := g.Board.FullRows()
	if len(rows) == 0 {
		if g.Combo != 0 {
			g.Combo = 0
			g.emit(Event{Kind: EventComboChanged, Value: 0})
		}
		g.spawnNext()
		return
	}

	// Snapshot the row contents before collapsing so the FX system can colour
	// the supernova without reaching into game state (§14).
	contents := make([][BoardWidth]Cell, len(rows))
	for i, y := range rows {
		contents[i] = g.Board.Cells[y]
	}

	g.Board.ClearRows(rows)
	g.Lines += len(rows)
	g.Combo++

	// Score at the level in force when the piece locked, then level up. Paying
	// the clear at the new level would reward the level-up twice.
	g.Score += LineScore(len(rows), g.Level) + ComboBonus(g.Combo, g.Level)

	g.emit(Event{Kind: EventLinesCleared, Rows: rows, ClearedCells: contents, Value: len(rows)})
	g.emit(Event{Kind: EventComboChanged, Value: g.Combo})

	if lvl := LevelForLines(g.Lines); lvl != g.Level {
		g.Level = lvl
		g.emit(Event{Kind: EventLevelChanged, Value: g.Level})
	}

	g.spawnNext()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): locking, lock resets, line clearing, and scoring"
```

---

### Task 14: Hard drop, hold, and game over

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: `lockPiece`, `spawnNext`, `DropDistance` (Tasks 10, 12, 13).
- Produces: `Apply` handles `InputHardDrop` and `InputHold`; unexported `hardDrop`, `hold`.

**Decision (§12 vs §18).** A hard drop locks immediately rather than waiting out `LockDelay`. §18 wants the impact to land the instant the piece hits, which a 500ms pause would ruin, and instant lock is what "YEET" means everywhere else this genre exists.

- [ ] **Step 1: Write the failing test**

Append to `internal/game/game_test.go`:

```go
func TestHardDropTravelsScoresAndLocks(t *testing.T) {
	g := newTestGame(t, KindO, 4, 0, 0)
	want := g.DropDistance()
	evs := g.Apply(InputHardDrop)

	drop, ok := findEvent(evs, EventPieceHardDropped)
	if !ok {
		t.Fatalf("events = %v, want a PieceHardDropped", evs)
	}
	if drop.Distance != want {
		t.Errorf("Distance = %d, want %d", drop.Distance, want)
	}
	if drop.Piece.Y != want {
		t.Errorf("event piece Y = %d, want %d (the landing row)", drop.Piece.Y, want)
	}
	if g.Score != HardDropPoints*want {
		t.Errorf("Score = %d, want %d", g.Score, HardDropPoints*want)
	}
	if _, ok := findEvent(evs, EventPieceLocked); !ok {
		t.Error("hard drop did not lock immediately")
	}
	if got := g.Board.At(5, BoardHeight-1); got != CellOf(KindO) {
		t.Errorf("board at (5,%d) = %v, want a locked O", BoardHeight-1, got)
	}
	// The event order matters to §18: the impact fires on the drop, then the lock.
	if idxOf(evs, EventPieceHardDropped) > idxOf(evs, EventPieceLocked) {
		t.Errorf("events = %v; PieceHardDropped must precede PieceLocked", evs)
	}
}

func idxOf(evs []Event, k EventKind) int {
	for i, e := range evs {
		if e.Kind == k {
			return i
		}
	}
	return -1
}

func TestHardDropOfALandedPieceScoresNothingAndStillLocks(t *testing.T) {
	g := newTestGame(t, KindO, 4, BoardHeight-2, 0)
	evs := g.Apply(InputHardDrop)
	if g.Score != 0 {
		t.Errorf("Score = %d, want 0", g.Score)
	}
	if _, ok := findEvent(evs, EventPieceLocked); !ok {
		t.Error("a zero-distance hard drop did not lock")
	}
}

func TestFirstHoldStoresTheActivePieceAndSpawnsTheNext(t *testing.T) {
	g := New(5)
	stored := g.Active.Kind
	incoming := g.Next[0]
	evs := g.Apply(InputHold)

	if g.Hold == nil || *g.Hold != stored {
		t.Errorf("Hold = %v, want %v", g.Hold, stored)
	}
	if g.Active.Kind != incoming {
		t.Errorf("Active.Kind = %v, want the queue head %v", g.Active.Kind, incoming)
	}
	if g.Active != SpawnPiece(incoming) {
		t.Errorf("Active = %+v, want the spawn position", g.Active)
	}
	if g.CanHold {
		t.Error("CanHold = true right after a hold, want false")
	}
	h, ok := findEvent(evs, EventHoldUsed)
	if !ok {
		t.Fatalf("events = %v, want a HoldUsed", evs)
	}
	if h.Outgoing.Kind != stored {
		t.Errorf("Outgoing.Kind = %v, want %v", h.Outgoing.Kind, stored)
	}
	if h.Piece.Kind != incoming {
		t.Errorf("Piece.Kind = %v, want %v", h.Piece.Kind, incoming)
	}
}

func TestSecondHoldBeforeLockIsBlocked(t *testing.T) {
	g := New(5)
	g.Apply(InputHold)
	active := g.Active
	held := *g.Hold
	if evs := g.Apply(InputHold); len(evs) != 0 {
		t.Errorf("events = %v for a second hold, want none", evs)
	}
	if g.Active != active || *g.Hold != held {
		t.Error("the second hold changed state")
	}
}

func TestHoldSwapsAndReturnsToSpawnRotation(t *testing.T) {
	g := New(5)
	g.Apply(InputHold)
	stored := *g.Hold

	// Land and lock so the hold allowance comes back.
	g.Apply(InputHardDrop)
	if !g.CanHold {
		t.Fatal("CanHold = false after a lock, want true")
	}

	// Rotate and shove the new active piece, then swap it in.
	g.Apply(InputRotateCW)
	g.Apply(InputLeft)
	swappedOut := g.Active.Kind
	g.Apply(InputHold)

	if g.Active.Kind != stored {
		t.Errorf("Active.Kind = %v, want the previously held %v", g.Active.Kind, stored)
	}
	if g.Active != SpawnPiece(stored) {
		t.Errorf("Active = %+v, want spawn rotation and position (§9)", g.Active)
	}
	if *g.Hold != swappedOut {
		t.Errorf("Hold = %v, want %v", *g.Hold, swappedOut)
	}
}

// blockSpawnArea fills the rows a new piece would occupy, leaving column 9
// empty so that none of those rows counts as complete — otherwise the lock
// would clear them instead of ending the run.
func blockSpawnArea(g *Game) {
	for y := 0; y <= HiddenRows; y++ {
		fillRow(&g.Board, y, KindI, BoardWidth-1)
	}
}

func TestBlockedSpawnEndsTheGame(t *testing.T) {
	g := New(3)
	blockSpawnArea(g)
	g.Active = Piece{Kind: KindO, X: 4, Y: BoardHeight - 2}
	evs := g.Advance(LockDelay)

	if !g.Over {
		t.Fatal("Over = false after a blocked spawn, want true")
	}
	if _, ok := findEvent(evs, EventGameOver); !ok {
		t.Fatalf("events = %v, want a GameOver", evs)
	}
}

// Review Focus: the app keeps ticking for §28's ~1300ms collapse while the
// player mashes keys. Nothing may move, and GameOver must not fire twice.
func TestNoInputOrTimeAfterGameOver(t *testing.T) {
	g := New(3)
	blockSpawnArea(g)
	g.Active = Piece{Kind: KindO, X: 4, Y: BoardHeight - 2}
	first := g.Advance(LockDelay)
	if n := countOf(first, EventGameOver); n != 1 {
		t.Fatalf("GameOver emitted %d times on the ending placement, want 1", n)
	}

	snapshot := *g
	for _, in := range []Input{
		InputLeft, InputRight, InputSoftDrop, InputRotateCW,
		InputRotateCCW, InputHardDrop, InputHold,
	} {
		if evs := g.Apply(in); len(evs) != 0 {
			t.Errorf("Apply(%v) after game over = %v, want no events", in, evs)
		}
	}
	for i := 0; i < 100; i++ {
		if evs := g.Advance(20 * time.Millisecond); len(evs) != 0 {
			t.Fatalf("Advance after game over = %v, want no events", evs)
		}
	}
	if g.Board != snapshot.Board || g.Active != snapshot.Active || g.Score != snapshot.Score {
		t.Error("the game moved after Over was set")
	}
}

func countOf(evs []Event, k EventKind) int {
	n := 0
	for _, e := range evs {
		if e.Kind == k {
			n++
		}
	}
	return n
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run 'HardDrop|Hold|GameOver|AfterGameOver' -v`
Expected: FAIL — hard drop and hold produce no events.

- [ ] **Step 3: Write minimal implementation**

Extend `Apply`'s switch in `internal/game/game.go`:

```go
	case InputHardDrop:
		g.hardDrop()
	case InputHold:
		g.hold()
```

and append:

```go
// hardDrop slams the active piece to its landing row, scores the distance, and
// locks it on the spot. §12's lock delay deliberately does not apply: §18 wants
// the impact the instant the piece arrives.
func (g *Game) hardDrop() {
	d := g.DropDistance()
	g.Active.Y += d
	g.Score += HardDropPoints * d
	g.emit(Event{Kind: EventPieceHardDropped, Piece: g.Active, Distance: d})
	g.lockPiece()
}

// hold swaps the active piece with the held one, or banks it and pulls from the
// queue if nothing is held. It can be used once per piece (§9). The incoming
// piece always arrives in spawn rotation.
func (g *Game) hold() {
	if !g.CanHold {
		return
	}
	outgoing := g.Active

	if g.Hold == nil {
		g.spawnNext()
	} else {
		incoming := *g.Hold
		g.Active = SpawnPiece(incoming)
		g.grounded = false
		g.LockAccumulator = 0
		g.GravityAccumulator = 0
		g.lockResets = 0
		if g.collides(g.Active) {
			g.Over = true
			g.emit(Event{Kind: EventGameOver, Piece: g.Active})
		}
	}

	kind := outgoing.Kind
	g.Hold = &kind
	// spawnNext restores the hold allowance; a hold consumes it again.
	g.CanHold = false

	if !g.Over {
		g.emit(Event{Kind: EventHoldUsed, Piece: g.Active, Outgoing: outgoing})
	}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): hard drop, hold, and game over"
```

---

### Task 15: Determinism replay test

**Files:**
- Create: `internal/game/determinism_test.go`

**Interfaces:**
- Consumes: `New`, `Apply`, `Advance` (Tasks 9–14).
- Produces: nothing exported. This task adds only tests; it is the gate that §35 and §49.2 are actually true.

- [ ] **Step 1: Write the failing test**

Create `internal/game/determinism_test.go`:

```go
package game

import (
	"math/rand"
	"testing"
	"time"
)

// step is one entry in a canned (input, dt) stream — §49.2's "timing is an
// input" made concrete.
type step struct {
	in   Input
	hasIn bool
	dt   time.Duration
}

// cannedStream builds a long, varied, fixed input stream from its own throwaway
// RNG. That RNG is a test fixture only: it never touches the game.
func cannedStream(n int) []step {
	r := rand.New(rand.NewSource(20260917))
	inputs := []Input{
		InputLeft, InputRight, InputSoftDrop, InputRotateCW,
		InputRotateCCW, InputHardDrop, InputHold,
	}
	out := make([]step, 0, n)
	for i := 0; i < n; i++ {
		s := step{dt: time.Duration(r.Intn(60)+1) * time.Millisecond}
		if r.Intn(3) != 0 {
			s.in, s.hasIn = inputs[r.Intn(len(inputs))], true
		}
		out = append(out, s)
	}
	return out
}

func replay(seed int64, steps []step) *Game {
	g := New(seed)
	for _, s := range steps {
		if s.hasIn {
			g.Apply(s.in)
		}
		g.Advance(s.dt)
	}
	return g
}

// §35: same seed + same input sequence + same timing inputs reproduces the
// state. This is the whole point of §49.2's Advance(dt).
func TestReplayIsDeterministic(t *testing.T) {
	steps := cannedStream(4000)
	a := replay(8675309, steps)
	b := replay(8675309, steps)

	if a.Board != b.Board {
		t.Error("boards diverged across identical replays")
	}
	if a.Active != b.Active {
		t.Errorf("active pieces diverged: %+v vs %+v", a.Active, b.Active)
	}
	if a.Score != b.Score || a.Lines != b.Lines || a.Level != b.Level || a.Combo != b.Combo {
		t.Errorf("scores diverged: %d/%d/%d/%d vs %d/%d/%d/%d",
			a.Score, a.Lines, a.Level, a.Combo, b.Score, b.Lines, b.Level, b.Combo)
	}
	if a.Over != b.Over {
		t.Errorf("Over diverged: %v vs %v", a.Over, b.Over)
	}
	if (a.Hold == nil) != (b.Hold == nil) || (a.Hold != nil && *a.Hold != *b.Hold) {
		t.Error("hold diverged")
	}
	if len(a.Next) != len(b.Next) {
		t.Fatalf("next-queue lengths diverged: %d vs %d", len(a.Next), len(b.Next))
	}
	for i := range a.Next {
		if a.Next[i] != b.Next[i] {
			t.Fatalf("Next[%d] diverged: %v vs %v", i, a.Next[i], b.Next[i])
		}
	}
	if a.GravityAccumulator != b.GravityAccumulator || a.LockAccumulator != b.LockAccumulator {
		t.Error("timing accumulators diverged")
	}
}

// A different seed must reach a different state, or the replay test above would
// pass on a broken RNG that ignores its seed.
func TestDifferentSeedsDiverge(t *testing.T) {
	steps := cannedStream(2000)
	a := replay(1, steps)
	b := replay(2, steps)
	if a.Board == b.Board && a.Score == b.Score && a.Active == b.Active {
		t.Error("seeds 1 and 2 produced an identical run; the seed is being ignored")
	}
}

// The canned stream must be long enough to have actually exercised the engine.
func TestReplayStreamReachesInterestingState(t *testing.T) {
	g := replay(8675309, cannedStream(4000))
	if g.Score == 0 {
		t.Error("the replay never scored; the stream is not exercising the engine")
	}
	if g.Lines == 0 && !g.Over {
		t.Error("the replay neither cleared a line nor ended; lengthen the stream")
	}
}

// Splitting a dt into pieces must land in the same place as one big step, or
// frame-rate jitter would change the game.
func TestTimeSubdivisionIsEquivalent(t *testing.T) {
	whole := New(11)
	whole.Advance(600 * time.Millisecond)

	parts := New(11)
	for i := 0; i < 6; i++ {
		parts.Advance(100 * time.Millisecond)
	}

	if whole.Active != parts.Active {
		t.Errorf("one 600ms step gave %+v, six 100ms steps gave %+v", whole.Active, parts.Active)
	}
	if whole.GravityAccumulator != parts.GravityAccumulator {
		t.Errorf("accumulators differ: %v vs %v", whole.GravityAccumulator, parts.GravityAccumulator)
	}
}
```

- [ ] **Step 2: Run the test**

Run: `go test ./internal/game/ -run 'Replay|Seeds|Subdivision' -v`
Expected: PASS. If `TestReplayStreamReachesInterestingState` fails, the stream is not producing clears — raise `cannedStream(4000)` to `cannedStream(8000)` rather than weakening the assertion. If `TestReplayIsDeterministic` fails, something in the engine is reading a clock or a second RNG; `TestEngineNeverReadsAClock` from Task 9 narrows it down.

- [ ] **Step 3: Run the whole suite with the race detector and vet**

Run: `go build ./... && go vet ./... && go test ./... -race -count=1`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add internal/game/determinism_test.go
git commit -m "test(game): canned-stream determinism replay"
```

---

## Phase 1 exit criteria

Before starting Phase 2, all of these hold:

- `go build ./... && go vet ./... && go test ./... -race -count=1` is green.
- `internal/game` contains no reference to a clock, a terminal, a colour, or a glyph — `TestEngineNeverReadsAClock` enforces the clock half.
- Every §40 "game logic" bullet has a test: board collision, bounds, row completion, removal, collapse; every rotation, wall kicks, failed rotation, spawn position; bag completeness and reproducibility; initial hold, swap, second hold blocked, hold restored after lock; soft drop, hard drop, landing position, lock; line values, combo behaviour, drop scoring, level progression; blocked spawn and state transition; and a canned-stream determinism replay.
- The only files under `internal/game` are `piece.go`, `board.go`, `bag.go`, `rules.go`, `event.go`, `scoring.go`, `game.go`, and their tests.
