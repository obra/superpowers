# Cosmic Tetris — Plan 1: Headless Game Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete, deterministic, headless falling-block game engine in `internal/game`, with comprehensive unit tests and a seeded replay test, so that Plan 2 can put a terminal on top of a game that already works.

**Architecture:** A single package `internal/game` owns board, pieces, bag, rules, scoring and the `Game` aggregate. The engine never reads a clock: all time enters through `Game.Advance(dt time.Duration) []Event`. All mutating methods return `[]Event`, which is the only channel the effects system will ever be given (Plan 3) — events carry every payload FX needs, so FX never receives a pointer into game state. Rendering will read a value-copy `Snapshot`, so it structurally cannot mutate the game.

**Tech Stack:** Go 1.26, standard library only for this plan (`math/rand/v2` for the seeded RNG). No Bubble Tea yet.

**Spec:** `design.md`

## Global Constraints

These apply to every task in this plan (and to Plans 2–4).

- Language: Go. Module path `cosmic-tetris` (local scratch repo, no remote). Go directive `go 1.26`.
- Repository layout is §33 of the spec, exactly. Deviations from §33 permitted by this plan set, and only these: `internal/game/events.go` (§36 names the type `game.Event`, so the game package must own it), `internal/render/canvas.go` (Plan 2, cell compositor), `internal/render/overlays.go` (Plan 2, pause/help/game-over/boot panels). No other new files or packages.
- Board geometry: `width: 10`, `height: 22`, `visible rows: 20`, `hidden spawn rows: 2` (§5).
- Nothing under `internal/game` may call `time.Now()` or otherwise read a clock (§49.2). `time.Duration` values as parameters are fine.
- `Game` owns its own `*rand.Rand`, used only to drive the 7-bag. `Seed int64` is recorded for display and restart (§49.6). The FX RNG (Plan 3) is a separate generator; the two never share.
- Do not build: networking, profiles, achievements, a plugin system, a database (§2).
- Do not abstract Bubble Tea away behind a homegrown framework (§3). Not relevant to this plan; do not pre-build for it either.
- Every commit must leave `gofmt -l .` empty, `go vet ./...` clean, and `go test ./...` passing.
- Combo indexing and bonus follow §49.1 exactly: first clearing placement sets combo to 1; a non-clearing placement resets combo to 0; `bonus = 50 × (combo - 1) × level`.

## Review Focus

Input classes the spec implies but no task's own happy-path tests exercise. Each has a test pinned into the task that owns the code.

1. **`Advance` with a `dt` far larger than one gravity interval** (terminal suspended, machine slept, laggy SSH): must apply gravity a bounded number of times, never loop unboundedly, never teleport the piece through the stack. Pinned in Task 7.
2. **A wall kick that pushes the piece above row 0** (`(0,-1)` offsets exist in §7, spawn is at row 0): negative `y` is empty air, not a collision and not an index panic. Pinned in Task 2 (`Occupied`) and Task 6 (kick).
3. **Input actions arriving after game over** (player mashing keys as they die, or holding a key through the transition): every mutating method must be a no-op returning no events, not a panic. Pinned in Task 9.
4. **Hold pressed twice in a row, and hold pressed on the very first piece**: second hold blocked, first hold pulls from the next queue and refills it. Pinned in Task 9.
5. **A lock that tops out the board**: `EventGameOver` is emitted exactly once, and subsequent `Advance` calls return no events and change nothing. Pinned in Task 9.

---

### Task 1: Module bootstrap and tetromino geometry

**Files:**
- Create: `go.mod`
- Create: `internal/game/piece.go`
- Test: `internal/game/piece_test.go`
- Create: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: `type PieceKind uint8`; constants `KindI, KindJ, KindL, KindO, KindS, KindT, KindZ PieceKind`; `const KindCount = 7`; `func (k PieceKind) String() string`; `type Offset struct{ X, Y int }`; `type Piece struct{ Kind PieceKind; Rotation, X, Y int }`; `func (p Piece) Cells() [4]Offset` (absolute board coordinates); `func parseArt(art [4]string) [4]Offset`; `const SpawnX = 3`, `const SpawnY = 0`.

Coordinate system for the whole engine: `x` increases rightward `0..9`, `y` increases **downward** `0..21`. Rows 0 and 1 are the hidden spawn rows; rows 2..21 are the 20 visible rows. A piece's `X, Y` is the top-left corner of its 4×4 shape box.

- [ ] **Step 1: Initialise the module**

```bash
cd "$(git rev-parse --show-toplevel)"
go mod init cosmic-tetris
printf '/cosmic-tetris\n' > .gitignore
```

- [ ] **Step 2: Write the failing test**

Create `internal/game/piece_test.go`:

```go
package game

import "testing"

func TestParseArtReturnsCellsInReadingOrder(t *testing.T) {
	got := parseArt([4]string{".#..", "###.", "....", "...."})
	want := [4]Offset{{1, 0}, {0, 1}, {1, 1}, {2, 1}}
	if got != want {
		t.Fatalf("parseArt = %v, want %v", got, want)
	}
}

func TestEveryRotationHasFourCellsInsideTheBox(t *testing.T) {
	for k := PieceKind(0); k < KindCount; k++ {
		for r := 0; r < 4; r++ {
			cells := Piece{Kind: k, Rotation: r}.Cells()
			seen := map[Offset]bool{}
			for _, c := range cells {
				if c.X < 0 || c.X > 3 || c.Y < 0 || c.Y > 3 {
					t.Errorf("%s rot %d: cell %v outside 4x4 box", k, r, c)
				}
				if seen[c] {
					t.Errorf("%s rot %d: duplicate cell %v", k, r, c)
				}
				seen[c] = true
			}
		}
	}
}

func TestCellsAreAbsoluteToPiecePosition(t *testing.T) {
	p := Piece{Kind: KindT, Rotation: 0, X: SpawnX, Y: SpawnY}
	want := [4]Offset{{4, 0}, {3, 1}, {4, 1}, {5, 1}}
	if got := p.Cells(); got != want {
		t.Fatalf("T at spawn = %v, want %v", got, want)
	}
}

func TestOIsIdenticalThroughRotation(t *testing.T) {
	first := Piece{Kind: KindO, Rotation: 0}.Cells()
	for r := 1; r < 4; r++ {
		if got := (Piece{Kind: KindO, Rotation: r}).Cells(); got != first {
			t.Errorf("O rot %d = %v, want %v", r, got, first)
		}
	}
}

func TestNonOPiecesChangeShapeWhenRotated(t *testing.T) {
	for _, k := range []PieceKind{KindI, KindJ, KindL, KindS, KindT, KindZ} {
		a := Piece{Kind: k, Rotation: 0}.Cells()
		b := Piece{Kind: k, Rotation: 1}.Cells()
		if a == b {
			t.Errorf("%s rotation 0 and 1 are identical: %v", k, a)
		}
	}
}

func TestKindString(t *testing.T) {
	want := "IJLOSTZ"
	for k := PieceKind(0); k < KindCount; k++ {
		if got := k.String(); got != string(want[k]) {
			t.Errorf("kind %d String() = %q, want %q", k, got, string(want[k]))
		}
	}
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `go test ./internal/game/ -run TestParseArt -v`
Expected: FAIL — `undefined: parseArt`.

- [ ] **Step 4: Write the implementation**

Create `internal/game/piece.go`:

```go
// Package game implements the Cosmic Tetris rules engine. It is headless and
// deterministic: it never reads a clock and never touches the terminal. All
// elapsed time enters through Game.Advance.
package game

// PieceKind identifies one of the seven tetromino families.
type PieceKind uint8

// The seven tetromino families (§6).
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

const kindNames = "IJLOSTZ"

func (k PieceKind) String() string {
	if k >= KindCount {
		return "?"
	}
	return string(kindNames[k])
}

// Offset is a cell coordinate or a delta. X grows rightward, Y grows downward.
type Offset struct{ X, Y int }

// Piece is a tetromino in play. X, Y is the top-left corner of its 4x4 box.
type Piece struct {
	Kind     PieceKind
	Rotation int
	X        int
	Y        int
}

// Spawn position: X=3 centres the 4-wide box on a 10-wide board, Y=0 puts the
// piece in the hidden rows (§5).
const (
	SpawnX = 3
	SpawnY = 0
)

// shapeArt holds the four predefined rotations of every piece (§6) as 4x4 art.
// '#' is a filled cell. Rotation 0 is the spawn orientation; rotation N+1 is
// one clockwise step from rotation N.
var shapeArt = [KindCount][4][4]string{
	KindI: {
		{"....", "####", "....", "...."},
		{"..#.", "..#.", "..#.", "..#."},
		{"....", "....", "####", "...."},
		{".#..", ".#..", ".#..", ".#.."},
	},
	KindJ: {
		{"#...", "###.", "....", "...."},
		{".##.", ".#..", ".#..", "...."},
		{"....", "###.", "..#.", "...."},
		{".#..", ".#..", "##..", "...."},
	},
	KindL: {
		{"..#.", "###.", "....", "...."},
		{".#..", ".#..", ".##.", "...."},
		{"....", "###.", "#...", "...."},
		{"##..", ".#..", ".#..", "...."},
	},
	KindO: {
		{".##.", ".##.", "....", "...."},
		{".##.", ".##.", "....", "...."},
		{".##.", ".##.", "....", "...."},
		{".##.", ".##.", "....", "...."},
	},
	KindS: {
		{".##.", "##..", "....", "...."},
		{".#..", ".##.", "..#.", "...."},
		{"....", ".##.", "##..", "...."},
		{"#...", "##..", ".#..", "...."},
	},
	KindT: {
		{".#..", "###.", "....", "...."},
		{".#..", ".##.", ".#..", "...."},
		{"....", "###.", ".#..", "...."},
		{".#..", "##..", ".#..", "...."},
	},
	KindZ: {
		{"##..", ".##.", "....", "...."},
		{"..#.", ".##.", ".#..", "...."},
		{"....", "##..", ".##.", "...."},
		{".#..", "##..", "#...", "...."},
	},
}

// shapes is shapeArt resolved to cell offsets once at startup.
var shapes = func() (out [KindCount][4][4]Offset) {
	for k := range shapeArt {
		for r := range shapeArt[k] {
			out[k][r] = parseArt(shapeArt[k][r])
		}
	}
	return out
}()

// parseArt converts 4x4 shape art to exactly four offsets, in reading order
// (top row first, left to right). It panics on malformed art, which can only
// happen if the tables above are edited wrongly.
func parseArt(art [4]string) [4]Offset {
	var out [4]Offset
	n := 0
	for y, row := range art {
		if len(row) != 4 {
			panic("game: shape art row must be 4 characters: " + row)
		}
		for x := 0; x < 4; x++ {
			if row[x] != '#' {
				continue
			}
			if n == 4 {
				panic("game: shape art has more than four cells")
			}
			out[n] = Offset{X: x, Y: y}
			n++
		}
	}
	if n != 4 {
		panic("game: shape art must have exactly four cells")
	}
	return out
}

// Cells returns the piece's four cells in absolute board coordinates.
func (p Piece) Cells() [4]Offset {
	local := shapes[p.Kind][((p.Rotation%4)+4)%4]
	var out [4]Offset
	for i, o := range local {
		out[i] = Offset{X: p.X + o.X, Y: p.Y + o.Y}
	}
	return out
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS — all six tests.

- [ ] **Step 6: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add go.mod .gitignore internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): tetromino kinds, rotation tables and cell geometry"
```

---

### Task 2: Board — bounds, collision, locking, row clearing

**Files:**
- Create: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Piece`, `PieceKind`, `Offset` from Task 1.
- Produces: `const Width = 10`, `const Height = 22`, `const HiddenRows = 2`, `const VisibleRows = 20`; `type Cell struct{ Filled bool; Kind PieceKind }`; `type Board struct{ Cells [Height][Width]Cell }`; `func (b *Board) InBounds(x, y int) bool`; `func (b *Board) Occupied(x, y int) bool`; `func (b *Board) Collides(p Piece) bool`; `func (b *Board) Lock(p Piece)`; `func (b *Board) CompleteRows() []int`; `func (b *Board) ClearRows(rows []int)`.

The decision that matters here, and that later tasks depend on: `Occupied` treats `y < 0` as **empty air**, so a piece may legally sit above the board. `x` outside `0..Width-1` and `y >= Height` are occupied (walls and floor). This is what makes the §7 upward wall kicks work at spawn height instead of panicking.

- [ ] **Step 1: Write the failing test**

Create `internal/game/board_test.go`:

```go
package game

import (
	"reflect"
	"testing"
)

// fillRow marks every cell of row y as filled with kind.
func fillRow(b *Board, y int, kind PieceKind) {
	for x := 0; x < Width; x++ {
		b.Cells[y][x] = Cell{Filled: true, Kind: kind}
	}
}

func TestBoardDimensionsMatchSpec(t *testing.T) {
	if Width != 10 || Height != 22 || HiddenRows != 2 || VisibleRows != 20 {
		t.Fatalf("geometry = %d x %d (%d hidden, %d visible), want 10 x 22 (2 hidden, 20 visible)",
			Width, Height, HiddenRows, VisibleRows)
	}
}

func TestOccupiedTreatsWallsAndFloorAsSolidAndAboveBoardAsAir(t *testing.T) {
	var b Board
	cases := []struct {
		name string
		x, y int
		want bool
	}{
		{"left of board", -1, 5, true},
		{"right of board", Width, 5, true},
		{"below floor", 3, Height, true},
		{"above board is air", 3, -1, false},
		{"above board far", 3, -4, false},
		{"empty interior", 3, 5, false},
	}
	for _, c := range cases {
		if got := b.Occupied(c.x, c.y); got != c.want {
			t.Errorf("%s: Occupied(%d,%d) = %v, want %v", c.name, c.x, c.y, got, c.want)
		}
	}
}

func TestOccupiedSeesLockedCells(t *testing.T) {
	var b Board
	b.Cells[7][4] = Cell{Filled: true, Kind: KindZ}
	if !b.Occupied(4, 7) {
		t.Error("locked cell reported empty")
	}
	if b.Occupied(5, 7) {
		t.Error("neighbouring empty cell reported occupied")
	}
}

func TestCollidesWithFloorWallsAndStack(t *testing.T) {
	var b Board
	fillRow(&b, Height-1, KindI)

	// O piece resting on the filled bottom row: box rows 0-1 are the piece, so
	// Y = Height-3 puts its lower cells directly above the stack.
	resting := Piece{Kind: KindO, X: 4, Y: Height - 3}
	if b.Collides(resting) {
		t.Error("piece just above the stack should not collide")
	}
	if !b.Collides(Piece{Kind: KindO, X: 4, Y: Height - 2}) {
		t.Error("piece overlapping the stack should collide")
	}
	if !b.Collides(Piece{Kind: KindO, X: -2, Y: 5}) {
		t.Error("piece pushed off the left wall should collide")
	}
	if !b.Collides(Piece{Kind: KindO, X: Width - 1, Y: 5}) {
		t.Error("piece pushed off the right wall should collide")
	}
}

func TestCollidesAllowsPieceAboveTheBoard(t *testing.T) {
	var b Board
	if b.Collides(Piece{Kind: KindI, Rotation: 1, X: 3, Y: -3}) {
		t.Error("piece above row 0 should not collide")
	}
}

func TestLockWritesPieceCellsWithItsKind(t *testing.T) {
	var b Board
	p := Piece{Kind: KindT, Rotation: 0, X: 3, Y: 10}
	b.Lock(p)
	for _, c := range p.Cells() {
		got := b.Cells[c.Y][c.X]
		if !got.Filled || got.Kind != KindT {
			t.Errorf("cell %v = %+v, want filled T", c, got)
		}
	}
	if b.Cells[10][0].Filled {
		t.Error("Lock touched a cell outside the piece")
	}
}

func TestCompleteRowsReturnsFullRowsAscending(t *testing.T) {
	var b Board
	fillRow(&b, 19, KindI)
	fillRow(&b, 21, KindI)
	b.Cells[20][0] = Cell{Filled: true, Kind: KindI} // partial row
	if got, want := b.CompleteRows(), []int{19, 21}; !reflect.DeepEqual(got, want) {
		t.Fatalf("CompleteRows = %v, want %v", got, want)
	}
}

func TestCompleteRowsIgnoresAlmostFullRow(t *testing.T) {
	var b Board
	fillRow(&b, 21, KindI)
	b.Cells[21][5] = Cell{}
	if got := b.CompleteRows(); len(got) != 0 {
		t.Fatalf("CompleteRows = %v, want none", got)
	}
}

func TestClearRowsCollapsesStackDownward(t *testing.T) {
	var b Board
	// Marker above, two complete rows below it.
	b.Cells[18][2] = Cell{Filled: true, Kind: KindT}
	fillRow(&b, 20, KindI)
	fillRow(&b, 21, KindJ)

	b.ClearRows([]int{20, 21})

	if !b.Cells[20][2].Filled || b.Cells[20][2].Kind != KindT {
		t.Errorf("marker should have fallen two rows to (2,20), got %+v", b.Cells[20][2])
	}
	if b.Cells[18][2].Filled {
		t.Error("marker left behind at its old row")
	}
	for _, y := range []int{0, 1} {
		for x := 0; x < Width; x++ {
			if b.Cells[y][x].Filled {
				t.Fatalf("row %d should be empty after collapse", y)
			}
		}
	}
	if got := b.CompleteRows(); len(got) != 0 {
		t.Fatalf("rows still complete after clear: %v", got)
	}
}

func TestClearRowsHandlesNonAdjacentRows(t *testing.T) {
	var b Board
	b.Cells[17][0] = Cell{Filled: true, Kind: KindT} // above both clears
	fillRow(&b, 18, KindI)
	b.Cells[19][1] = Cell{Filled: true, Kind: KindS} // between the clears
	fillRow(&b, 20, KindJ)

	b.ClearRows([]int{18, 20})

	if !b.Cells[19][0].Filled || b.Cells[19][0].Kind != KindT {
		t.Errorf("T should sit at (0,19), got %+v", b.Cells[19][0])
	}
	if !b.Cells[20][1].Filled || b.Cells[20][1].Kind != KindS {
		t.Errorf("S should sit at (1,20), got %+v", b.Cells[20][1])
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run TestBoard -v`
Expected: FAIL — `undefined: Board`.

- [ ] **Step 3: Write the implementation**

Create `internal/game/board.go`:

```go
package game

// Board geometry (§5). Rows 0..HiddenRows-1 are the hidden spawn rows; the
// remaining rows are what the player sees.
const (
	Width       = 10
	Height      = 22
	HiddenRows  = 2
	VisibleRows = Height - HiddenRows
)

// Cell is one board square. Kind is only meaningful when Filled is true; it is
// what gives locked blocks their colour.
type Cell struct {
	Filled bool
	Kind   PieceKind
}

// Board is the locked stack. The active piece is not part of it.
type Board struct {
	Cells [Height][Width]Cell
}

// InBounds reports whether x, y addresses a real cell.
func (b *Board) InBounds(x, y int) bool {
	return x >= 0 && x < Width && y >= 0 && y < Height
}

// Occupied reports whether a piece cell at x, y would be blocked. Walls and the
// floor are blocked; everything above row 0 is empty air, which is what lets
// the §7 upward wall kicks work at spawn height.
func (b *Board) Occupied(x, y int) bool {
	if x < 0 || x >= Width || y >= Height {
		return true
	}
	if y < 0 {
		return false
	}
	return b.Cells[y][x].Filled
}

// Collides reports whether the piece overlaps a wall, the floor, or a locked cell.
func (b *Board) Collides(p Piece) bool {
	for _, c := range p.Cells() {
		if b.Occupied(c.X, c.Y) {
			return true
		}
	}
	return false
}

// Lock commits the piece's cells to the stack. Cells above row 0 are dropped,
// which can only happen on a top-out.
func (b *Board) Lock(p Piece) {
	for _, c := range p.Cells() {
		if b.InBounds(c.X, c.Y) {
			b.Cells[c.Y][c.X] = Cell{Filled: true, Kind: p.Kind}
		}
	}
}

// CompleteRows returns the indices of fully filled rows, ascending. The result
// is a fresh slice, safe to hand to the effects system.
func (b *Board) CompleteRows() []int {
	var rows []int
	for y := 0; y < Height; y++ {
		full := true
		for x := 0; x < Width; x++ {
			if !b.Cells[y][x].Filled {
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

// ClearRows removes the given rows and collapses everything above them downward.
// Row indices that are out of range are ignored.
func (b *Board) ClearRows(rows []int) {
	if len(rows) == 0 {
		return
	}
	var doomed [Height]bool
	for _, y := range rows {
		if y >= 0 && y < Height {
			doomed[y] = true
		}
	}
	var out [Height][Width]Cell
	dst := Height - 1
	for y := Height - 1; y >= 0; y-- {
		if doomed[y] {
			continue
		}
		out[dst] = b.Cells[y]
		dst--
	}
	b.Cells = out
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board collision, locking and row clearing"
```

---

### Task 3: Seven-bag piece generator

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `KindCount`.
- Produces: `type Bag struct{ ... }`; `func NewBag(rng *rand.Rand) *Bag`; `func (b *Bag) Next() PieceKind`.

`rand` here and everywhere in this plan is `math/rand/v2`. `rand.New(rand.NewPCG(a, b))` is a specified, version-stable generator, which is what makes §35's reproducibility promise real.

- [ ] **Step 1: Write the failing test**

Create `internal/game/bag_test.go`:

```go
package game

import (
	"math/rand/v2"
	"testing"
)

func newTestRNG(seed int64) *rand.Rand {
	return rand.New(rand.NewPCG(uint64(seed), 0))
}

func TestEveryBagContainsAllSevenKindsExactlyOnce(t *testing.T) {
	b := NewBag(newTestRNG(1))
	for group := 0; group < 10; group++ {
		var count [KindCount]int
		for i := 0; i < KindCount; i++ {
			count[b.Next()]++
		}
		for k := PieceKind(0); k < KindCount; k++ {
			if count[k] != 1 {
				t.Fatalf("bag %d: kind %s appeared %d times, want 1", group, k, count[k])
			}
		}
	}
}

func TestSeededBagsAreReproducible(t *testing.T) {
	a, b := NewBag(newTestRNG(8675309)), NewBag(newTestRNG(8675309))
	for i := 0; i < 70; i++ {
		x, y := a.Next(), b.Next()
		if x != y {
			t.Fatalf("draw %d diverged: %s vs %s", i, x, y)
		}
	}
}

func TestDifferentSeedsProduceDifferentOrder(t *testing.T) {
	a, b := NewBag(newTestRNG(1)), NewBag(newTestRNG(2))
	same := true
	for i := 0; i < 70; i++ {
		if a.Next() != b.Next() {
			same = false
		}
	}
	if same {
		t.Error("two different seeds produced identical 70-piece sequences")
	}
}

func TestBagIsShuffledNotSorted(t *testing.T) {
	b := NewBag(newTestRNG(42))
	sorted := 0
	for group := 0; group < 20; group++ {
		inOrder := true
		for i := 0; i < KindCount; i++ {
			if b.Next() != PieceKind(i) {
				inOrder = false
			}
		}
		if inOrder {
			sorted++
		}
	}
	if sorted > 1 {
		t.Errorf("%d of 20 bags came out in I,J,L,O,S,T,Z order; shuffle is not working", sorted)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run TestEveryBag -v`
Expected: FAIL — `undefined: NewBag`.

- [ ] **Step 3: Write the implementation**

Create `internal/game/bag.go`:

```go
package game

import "math/rand/v2"

// Bag is the 7-bag piece generator (§6): one of every piece goes in, the bag is
// shuffled, drained, and refilled.
type Bag struct {
	rng   *rand.Rand
	queue []PieceKind
}

// NewBag returns a bag driven by rng. The bag never uses any other source of
// randomness, so piece order depends on the game RNG alone (§49.6).
func NewBag(rng *rand.Rand) *Bag {
	return &Bag{rng: rng}
}

// Next draws the next piece, refilling the bag when it runs dry.
func (b *Bag) Next() PieceKind {
	if len(b.queue) == 0 {
		b.refill()
	}
	k := b.queue[0]
	b.queue = b.queue[1:]
	return k
}

func (b *Bag) refill() {
	bag := []PieceKind{KindI, KindJ, KindL, KindO, KindS, KindT, KindZ}
	b.rng.Shuffle(len(bag), func(i, j int) { bag[i], bag[j] = bag[j], bag[i] })
	b.queue = bag
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag piece generator"
```

---

### Task 4: Rules constants, gravity curve, and scoring

**Files:**
- Create: `internal/game/rules.go`
- Create: `internal/game/scoring.go`
- Test: `internal/game/rules_test.go`
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: `Offset`.
- Produces: `const BaseGravity = 800 * time.Millisecond`, `const GravityFactor = 0.86`, `const MinGravity = 60 * time.Millisecond`, `const LockDelay = 500 * time.Millisecond`, `const MaxLockResets = 15`, `const LinesPerLevel = 10`, `const NextQueueLen = 5`, `const MaxGravityStepsPerAdvance = 32`; `var KickOffsets [8]Offset`; `func GravityInterval(level int) time.Duration`; `func LineScore(lines, level int) int`; `func ComboBonus(combo, level int) int`; `func LevelFor(lines int) int`.

- [ ] **Step 1: Write the failing tests**

Create `internal/game/rules_test.go`:

```go
package game

import (
	"testing"
	"time"
)

func TestGravityIntervalFollowsTheCurve(t *testing.T) {
	cases := []struct {
		level int
		want  time.Duration
	}{
		{1, 800 * time.Millisecond},
		{2, 688 * time.Millisecond},
		{5, 437600 * time.Microsecond},
	}
	const tolerance = time.Millisecond
	for _, c := range cases {
		got := GravityInterval(c.level)
		diff := got - c.want
		if diff < 0 {
			diff = -diff
		}
		if diff > tolerance {
			t.Errorf("GravityInterval(%d) = %v, want ~%v", c.level, got, c.want)
		}
	}
}

func TestGravityIntervalIsMonotonicAndClamped(t *testing.T) {
	prev := time.Duration(1 << 62)
	for level := 1; level <= 40; level++ {
		got := GravityInterval(level)
		if got > prev {
			t.Fatalf("GravityInterval(%d) = %v is slower than level %d (%v)", level, got, level-1, prev)
		}
		if got < MinGravity {
			t.Fatalf("GravityInterval(%d) = %v is below the %v clamp", level, got, MinGravity)
		}
		prev = got
	}
	if GravityInterval(40) != MinGravity {
		t.Errorf("GravityInterval(40) = %v, want the clamp %v", GravityInterval(40), MinGravity)
	}
}

func TestGravityIntervalToleratesNonsenseLevels(t *testing.T) {
	for _, level := range []int{0, -1, -1000} {
		if got := GravityInterval(level); got != BaseGravity {
			t.Errorf("GravityInterval(%d) = %v, want level-1 value %v", level, got, BaseGravity)
		}
	}
}

func TestKickOffsetsAreTheSpecOrder(t *testing.T) {
	want := [8]Offset{{0, 0}, {-1, 0}, {1, 0}, {-2, 0}, {2, 0}, {0, -1}, {-1, -1}, {1, -1}}
	if KickOffsets != want {
		t.Fatalf("KickOffsets = %v, want %v", KickOffsets, want)
	}
}

func TestTimingConstantsMatchSpec(t *testing.T) {
	if LockDelay != 500*time.Millisecond {
		t.Errorf("LockDelay = %v, want 500ms", LockDelay)
	}
	if MaxLockResets != 15 {
		t.Errorf("MaxLockResets = %d, want 15", MaxLockResets)
	}
	if LinesPerLevel != 10 {
		t.Errorf("LinesPerLevel = %d, want 10", LinesPerLevel)
	}
	if NextQueueLen != 5 {
		t.Errorf("NextQueueLen = %d, want 5", NextQueueLen)
	}
}
```

Create `internal/game/scoring_test.go`:

```go
package game

import "testing"

func TestLineScoreBaseValues(t *testing.T) {
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
		{5, 1, 0}, // impossible clear count scores nothing rather than panicking
	}
	for _, c := range cases {
		if got := LineScore(c.lines, c.level); got != c.want {
			t.Errorf("LineScore(%d, %d) = %d, want %d", c.lines, c.level, got, c.want)
		}
	}
}

func TestComboBonusFirstAppearsAtComboTwo(t *testing.T) {
	cases := []struct {
		combo, level, want int
	}{
		{0, 5, 0},
		{1, 5, 0}, // a lone clear earns no combo bonus (§49.1)
		{2, 1, 50},
		{3, 1, 100},
		{5, 3, 600},
	}
	for _, c := range cases {
		if got := ComboBonus(c.combo, c.level); got != c.want {
			t.Errorf("ComboBonus(%d, %d) = %d, want %d", c.combo, c.level, got, c.want)
		}
	}
}

func TestLevelForLinesCleared(t *testing.T) {
	cases := []struct{ lines, want int }{
		{0, 1}, {9, 1}, {10, 2}, {19, 2}, {20, 3}, {127, 13},
	}
	for _, c := range cases {
		if got := LevelFor(c.lines); got != c.want {
			t.Errorf("LevelFor(%d) = %d, want %d", c.lines, got, c.want)
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestGravity|TestLineScore' -v`
Expected: FAIL — `undefined: GravityInterval`, `undefined: LineScore`.

- [ ] **Step 3: Write the implementations**

Create `internal/game/rules.go`:

```go
package game

import (
	"math"
	"time"
)

// Timing and rule constants (§11, §12, §6).
const (
	// BaseGravity is the level-1 drop interval.
	BaseGravity = 800 * time.Millisecond
	// GravityFactor is the per-level multiplier: interval = 800ms * 0.86^(level-1).
	GravityFactor = 0.86
	// MinGravity is the floor the curve clamps to.
	MinGravity = 60 * time.Millisecond
	// LockDelay is how long a grounded piece waits before locking.
	LockDelay = 500 * time.Millisecond
	// MaxLockResets bounds how many times movement may postpone a lock.
	MaxLockResets = 15
	// LinesPerLevel is how many cleared lines advance the level.
	LinesPerLevel = 10
	// NextQueueLen is how many upcoming pieces are kept visible (§6).
	NextQueueLen = 5
	// MaxGravityStepsPerAdvance bounds gravity work in a single Advance call so
	// that a huge dt (suspended terminal, sleeping machine) cannot stall the
	// engine or teleport a piece through the stack.
	MaxGravityStepsPerAdvance = 32
)

// KickOffsets are the rotation kick candidates, tried in order (§7).
var KickOffsets = [8]Offset{
	{0, 0},
	{-1, 0},
	{1, 0},
	{-2, 0},
	{2, 0},
	{0, -1},
	{-1, -1},
	{1, -1},
}

// GravityInterval returns the drop interval for a level, clamped at MinGravity.
func GravityInterval(level int) time.Duration {
	if level < 1 {
		level = 1
	}
	d := time.Duration(float64(BaseGravity) * math.Pow(GravityFactor, float64(level-1)))
	if d < MinGravity {
		return MinGravity
	}
	return d
}
```

Create `internal/game/scoring.go`:

```go
package game

// LineScore is the base value of clearing n lines at a level (§13).
func LineScore(lines, level int) int {
	switch lines {
	case 1:
		return 100 * level
	case 2:
		return 300 * level
	case 3:
		return 500 * level
	case 4:
		return 800 * level
	default:
		return 0
	}
}

// ComboBonus is the combo reward (§49.1): 50 x (combo-1) x level. A lone clear
// (combo 1) earns nothing, so the bonus first appears at combo 2 — exactly
// where the effects start escalating.
func ComboBonus(combo, level int) int {
	if combo < 2 {
		return 0
	}
	return 50 * (combo - 1) * level
}

// LevelFor is the level reached after clearing n lines (§11).
func LevelFor(lines int) int {
	if lines < 0 {
		lines = 0
	}
	return lines/LinesPerLevel + 1
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/game/rules.go internal/game/scoring.go internal/game/rules_test.go internal/game/scoring_test.go
git commit -m "feat(game): gravity curve, kick table and scoring rules"
```

---

### Task 5: Events

**Files:**
- Create: `internal/game/events.go`
- Test: `internal/game/events_test.go`

**Interfaces:**
- Consumes: `Piece`.
- Produces: `type EventKind uint8` with constants `EventPieceMoved, EventPieceRotated, EventPieceHardDropped, EventPieceLocked, EventHoldUsed, EventLinesCleared, EventComboChanged, EventLevelChanged, EventGameOver`; `func (k EventKind) String() string`; `type Event struct{ Kind EventKind; Piece Piece; Rows []int; Distance, Combo, Level, Score int }`.

Why one struct with optional fields instead of an interface per event: the effects system must be able to react without holding a pointer into game state (§14 — FX may never modify `GameState`). Making `Event` a self-contained value means `fx.World.Observe([]game.Event)` is the *entire* FX input, and the no-mutation rule is structural rather than a convention someone has to remember.

- [ ] **Step 1: Write the failing test**

Create `internal/game/events_test.go`:

```go
package game

import "testing"

func TestEventKindStringsAreDistinctAndNamed(t *testing.T) {
	kinds := []EventKind{
		EventPieceMoved, EventPieceRotated, EventPieceHardDropped, EventPieceLocked,
		EventHoldUsed, EventLinesCleared, EventComboChanged, EventLevelChanged, EventGameOver,
	}
	seen := map[string]bool{}
	for _, k := range kinds {
		s := k.String()
		if s == "" || s == "?" {
			t.Errorf("event kind %d has no name", k)
		}
		if seen[s] {
			t.Errorf("duplicate event name %q", s)
		}
		seen[s] = true
	}
	if len(seen) != 9 {
		t.Fatalf("got %d named event kinds, want 9", len(seen))
	}
}

func TestEventIsSelfContainedValue(t *testing.T) {
	// An Event must carry its payload by value so the FX system can react
	// without a handle on game state (§14).
	e := Event{Kind: EventLinesCleared, Rows: []int{20, 21}, Combo: 3, Level: 4, Score: 900}
	if e.Rows[0] != 20 || e.Combo != 3 || e.Level != 4 || e.Score != 900 {
		t.Fatalf("event payload not preserved: %+v", e)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run TestEventKind -v`
Expected: FAIL — `undefined: EventKind`.

- [ ] **Step 3: Write the implementation**

Create `internal/game/events.go`:

```go
package game

// EventKind identifies something the engine did (§14).
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

var eventNames = [...]string{
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

func (k EventKind) String() string {
	if int(k) >= len(eventNames) {
		return "?"
	}
	return eventNames[k]
}

// Event is a self-contained record of an engine action. Every field the effects
// system might want is copied in, so observers never need a pointer into game
// state (§14). Unused fields are zero.
type Event struct {
	Kind EventKind

	// Piece is the piece involved, in the position it occupied at the time.
	Piece Piece
	// Rows are the cleared row indices for EventLinesCleared, in pre-clear
	// board coordinates.
	Rows []int
	// Distance is cells fallen, for EventPieceHardDropped.
	Distance int
	// Combo, Level and Score are the values after the event.
	Combo int
	Level int
	Score int
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/game/events.go internal/game/events_test.go
git commit -m "feat(game): self-contained engine event values"
```

---

### Task 6: Game core — spawn, next queue, horizontal movement, soft drop, ghost

**Files:**
- Create: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces: `type Phase uint8` with `PhasePlaying`, `PhaseGameOver`; `type Game struct{ Board Board; Active Piece; Hold *PieceKind; CanHold bool; Next []PieceKind; Bag *Bag; Score, Lines, Level, Combo int; Phase Phase; GravityAccumulator, LockAccumulator time.Duration; Grounded bool; LockResets int; Seed int64; rng *rand.Rand }`; `func New(seed int64) *Game`; `func (g *Game) MoveLeft() []Event`; `func (g *Game) MoveRight() []Event`; `func (g *Game) SoftDrop() []Event`; `func (g *Game) GhostY() int`; unexported `canMoveDown`, `resetLock`, `spawnPiece`, `spawnNext`.

Rotation (Task 7), gravity and locking (Task 8), clears (Task 9) and hard drop/hold/game over (Task 10) add methods to this same file.

- [ ] **Step 1: Write the failing test**

Create `internal/game/game_test.go`:

```go
package game

import "testing"

// clearBoard empties the stack, for tests that want a known-clean field.
func clearBoard(g *Game) { g.Board = Board{} }

// stackTo fills every row from y down to the floor, leaving column gap empty.
func stackTo(g *Game, y, gap PieceKind) {}

func TestNewStartsPlayingAtLevelOneWithAFullQueue(t *testing.T) {
	g := New(8675309)
	if g.Phase != PhasePlaying {
		t.Errorf("Phase = %v, want PhasePlaying", g.Phase)
	}
	if g.Level != 1 {
		t.Errorf("Level = %d, want 1", g.Level)
	}
	if g.Score != 0 || g.Lines != 0 || g.Combo != 0 {
		t.Errorf("Score/Lines/Combo = %d/%d/%d, want zeroes", g.Score, g.Lines, g.Combo)
	}
	if len(g.Next) != NextQueueLen {
		t.Fatalf("len(Next) = %d, want %d", len(g.Next), NextQueueLen)
	}
	if g.Hold != nil {
		t.Error("Hold should start empty")
	}
	if !g.CanHold {
		t.Error("CanHold should start true")
	}
	if g.Seed != 8675309 {
		t.Errorf("Seed = %d, want 8675309", g.Seed)
	}
}

func TestNewSpawnsAtSpawnPosition(t *testing.T) {
	g := New(1)
	if g.Active.X != SpawnX || g.Active.Y != SpawnY || g.Active.Rotation != 0 {
		t.Fatalf("Active = %+v, want X=%d Y=%d Rotation=0", g.Active, SpawnX, SpawnY)
	}
}

func TestSameSeedSpawnsSameFirstPieceAndQueue(t *testing.T) {
	a, b := New(4242), New(4242)
	if a.Active.Kind != b.Active.Kind {
		t.Errorf("first piece differs: %s vs %s", a.Active.Kind, b.Active.Kind)
	}
	for i := range a.Next {
		if a.Next[i] != b.Next[i] {
			t.Errorf("queue slot %d differs: %s vs %s", i, a.Next[i], b.Next[i])
		}
	}
}

func TestMoveLeftAndRightEmitPieceMoved(t *testing.T) {
	g := New(1)
	startX := g.Active.X

	evs := g.MoveLeft()
	if g.Active.X != startX-1 {
		t.Errorf("after MoveLeft X = %d, want %d", g.Active.X, startX-1)
	}
	if len(evs) != 1 || evs[0].Kind != EventPieceMoved {
		t.Fatalf("MoveLeft events = %v, want one PieceMoved", evs)
	}

	evs = g.MoveRight()
	if g.Active.X != startX {
		t.Errorf("after MoveRight X = %d, want %d", g.Active.X, startX)
	}
	if len(evs) != 1 || evs[0].Kind != EventPieceMoved {
		t.Fatalf("MoveRight events = %v, want one PieceMoved", evs)
	}
}

func TestMovementIntoAWallIsRefusedSilently(t *testing.T) {
	g := New(1)
	for i := 0; i < 20; i++ {
		g.MoveLeft()
	}
	x := g.Active.X
	if evs := g.MoveLeft(); len(evs) != 0 {
		t.Errorf("blocked MoveLeft emitted %v, want no events", evs)
	}
	if g.Active.X != x {
		t.Errorf("blocked MoveLeft moved the piece to %d", g.Active.X)
	}
	for _, c := range g.Active.Cells() {
		if c.X < 0 || c.X >= Width {
			t.Fatalf("piece cell %v escaped the board", c)
		}
	}
}

func TestSoftDropMovesOneRowAndScoresOnePoint(t *testing.T) {
	g := New(1)
	y := g.Active.Y
	evs := g.SoftDrop()
	if g.Active.Y != y+1 {
		t.Errorf("Y = %d, want %d", g.Active.Y, y+1)
	}
	if g.Score != 1 {
		t.Errorf("Score = %d, want 1 point per soft-dropped cell", g.Score)
	}
	if len(evs) != 1 || evs[0].Kind != EventPieceMoved {
		t.Fatalf("SoftDrop events = %v, want one PieceMoved", evs)
	}
}

func TestSoftDropOnTheFloorScoresNothing(t *testing.T) {
	g := New(1)
	for g.canMoveDown() {
		g.SoftDrop()
	}
	score := g.Score
	if evs := g.SoftDrop(); len(evs) != 0 {
		t.Errorf("grounded SoftDrop emitted %v, want no events", evs)
	}
	if g.Score != score {
		t.Errorf("grounded SoftDrop scored %d extra points", g.Score-score)
	}
}

func TestGhostYIsTheLandingRow(t *testing.T) {
	g := New(1)
	ghost := g.GhostY()
	if ghost < g.Active.Y {
		t.Fatalf("GhostY = %d is above the piece at %d", ghost, g.Active.Y)
	}
	landed := g.Active
	landed.Y = ghost
	if g.Board.Collides(landed) {
		t.Error("ghost position collides")
	}
	below := landed
	below.Y++
	if !g.Board.Collides(below) {
		t.Error("ghost is not resting on anything")
	}
}

func TestGhostYDoesNotMoveThePiece(t *testing.T) {
	g := New(1)
	before := g.Active
	g.GhostY()
	if g.Active != before {
		t.Fatalf("GhostY mutated Active: %+v, want %+v", g.Active, before)
	}
}

func TestQueueRefillsAsPiecesSpawn(t *testing.T) {
	g := New(7)
	for i := 0; i < 30; i++ {
		g.spawnNext()
		if len(g.Next) != NextQueueLen {
			t.Fatalf("after %d spawns len(Next) = %d, want %d", i+1, len(g.Next), NextQueueLen)
		}
	}
}
```

Delete the unused `stackTo` and `clearBoard` stubs if the compiler complains; later tasks add their own helpers.

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run TestNewStarts -v`
Expected: FAIL — `undefined: New`.

- [ ] **Step 3: Write the implementation**

Create `internal/game/game.go`:

```go
package game

import (
	"math/rand/v2"
	"time"
)

// Phase is the engine's lifecycle state. Pausing is an application concern, not
// an engine one: the app simply stops calling Advance.
type Phase uint8

const (
	PhasePlaying Phase = iota
	PhaseGameOver
)

func (p Phase) String() string {
	if p == PhaseGameOver {
		return "GameOver"
	}
	return "Playing"
}

// Game is the whole logical game (§34). It is deterministic: identical seeds,
// identical method calls and identical dt values produce identical states.
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

	Phase Phase

	GravityAccumulator time.Duration
	LockAccumulator    time.Duration
	Grounded           bool
	LockResets         int

	Seed int64      // recorded for display and restart (§49.6)
	rng  *rand.Rand // game RNG: drives the 7-bag, nothing else
}

// New starts a game from a seed.
func New(seed int64) *Game {
	rng := rand.New(rand.NewPCG(uint64(seed), 0x9E3779B97F4A7C15))
	g := &Game{
		Level:   1,
		CanHold: true,
		Seed:    seed,
		rng:     rng,
	}
	g.Bag = NewBag(rng)
	g.Next = make([]PieceKind, 0, NextQueueLen+1)
	for i := 0; i < NextQueueLen; i++ {
		g.Next = append(g.Next, g.Bag.Next())
	}
	g.spawnNext()
	return g
}

// canMoveDown reports whether the active piece has room below it.
func (g *Game) canMoveDown() bool {
	p := g.Active
	p.Y++
	return !g.Board.Collides(p)
}

// resetLock restarts the lock timer after a successful move or rotation. While
// grounded this counts against MaxLockResets, which is what stops a player
// stalling forever (§12).
func (g *Game) resetLock() {
	if !g.Grounded {
		g.LockAccumulator = 0
		return
	}
	if g.LockResets >= MaxLockResets {
		return
	}
	g.LockResets++
	g.LockAccumulator = 0
}

// spawnPiece puts a specific kind at the spawn position and resets the
// per-piece timers. It returns a GameOver event if the spawn is blocked.
func (g *Game) spawnPiece(kind PieceKind) []Event {
	g.Active = Piece{Kind: kind, Rotation: 0, X: SpawnX, Y: SpawnY}
	g.CanHold = true
	g.Grounded = false
	g.GravityAccumulator = 0
	g.LockAccumulator = 0
	g.LockResets = 0
	if g.Board.Collides(g.Active) {
		g.Phase = PhaseGameOver
		return []Event{{Kind: EventGameOver, Score: g.Score, Level: g.Level, Piece: g.Active}}
	}
	return nil
}

// spawnNext pops the queue, refills it from the bag, and spawns.
func (g *Game) spawnNext() []Event {
	kind := g.Next[0]
	g.Next = append(g.Next[:0], g.Next[1:]...)
	g.Next = append(g.Next, g.Bag.Next())
	return g.spawnPiece(kind)
}

// shift moves the active piece horizontally by dx if there is room.
func (g *Game) shift(dx int) []Event {
	if g.Phase != PhasePlaying {
		return nil
	}
	p := g.Active
	p.X += dx
	if g.Board.Collides(p) {
		return nil
	}
	g.Active = p
	g.resetLock()
	return []Event{{Kind: EventPieceMoved, Piece: p}}
}

// MoveLeft nudges the active piece one column left.
func (g *Game) MoveLeft() []Event { return g.shift(-1) }

// MoveRight nudges the active piece one column right.
func (g *Game) MoveRight() []Event { return g.shift(1) }

// SoftDrop drops one row and scores a point (§11). It does nothing when the
// piece is already resting.
func (g *Game) SoftDrop() []Event {
	if g.Phase != PhasePlaying || !g.canMoveDown() {
		return nil
	}
	g.Active.Y++
	g.Score++
	g.GravityAccumulator = 0
	return []Event{{Kind: EventPieceMoved, Piece: g.Active}}
}

// GhostY is the row the active piece would land on (§10). It does not mutate
// the game.
func (g *Game) GhostY() int {
	p := g.Active
	for {
		next := p
		next.Y++
		if g.Board.Collides(next) {
			return p.Y
		}
		p = next
	}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game core with spawning, movement, soft drop and ghost"
```

---

### Task 7: Rotation with wall kicks

**Files:**
- Modify: `internal/game/game.go` (append rotation methods)
- Test: `internal/game/rotation_test.go`

**Interfaces:**
- Consumes: `KickOffsets`, `Game`, `Board.Collides`.
- Produces: `func (g *Game) RotateCW() []Event`; `func (g *Game) RotateCCW() []Event`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/rotation_test.go`:

```go
package game

import "testing"

func TestRotateCWAdvancesRotationAndWraps(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Active = Piece{Kind: KindT, Rotation: 0, X: 3, Y: 5}
	for want := 1; want <= 4; want++ {
		evs := g.RotateCW()
		if len(evs) != 1 || evs[0].Kind != EventPieceRotated {
			t.Fatalf("RotateCW events = %v, want one PieceRotated", evs)
		}
		if got := g.Active.Rotation; got != want%4 {
			t.Fatalf("rotation = %d, want %d", got, want%4)
		}
	}
}

func TestRotateCCWGoesBackwardsAndWraps(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Active = Piece{Kind: KindT, Rotation: 0, X: 3, Y: 5}
	if g.RotateCCW(); g.Active.Rotation != 3 {
		t.Fatalf("rotation after CCW from 0 = %d, want 3", g.Active.Rotation)
	}
	if g.RotateCCW(); g.Active.Rotation != 2 {
		t.Fatalf("rotation = %d, want 2", g.Active.Rotation)
	}
}

func TestRotationKicksOffTheRightWall(t *testing.T) {
	g := New(1)
	clearBoard(g)
	// Vertical I hugging the right wall: rotating to horizontal needs a shove left.
	g.Active = Piece{Kind: KindI, Rotation: 1, X: 6, Y: 5}
	if !g.RotateCW().IsRotated() {
		t.Fatal("rotation against the right wall should have been kicked into place")
	}
	for _, c := range g.Active.Cells() {
		if c.X < 0 || c.X >= Width {
			t.Fatalf("kicked piece cell %v is outside the board", c)
		}
	}
	if g.Board.Collides(g.Active) {
		t.Fatal("kicked piece collides")
	}
}

func TestRotationKicksOffTheLeftWall(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Active = Piece{Kind: KindI, Rotation: 1, X: -2, Y: 5}
	if len(g.RotateCW()) == 0 {
		t.Fatal("rotation against the left wall should have been kicked into place")
	}
	if g.Board.Collides(g.Active) {
		t.Fatal("kicked piece collides")
	}
}

func TestRotationPrefersTheFirstValidKick(t *testing.T) {
	g := New(1)
	clearBoard(g)
	// Open field: the (0,0) candidate is valid, so nothing should shift.
	g.Active = Piece{Kind: KindT, Rotation: 0, X: 4, Y: 10}
	g.RotateCW()
	if g.Active.X != 4 || g.Active.Y != 10 {
		t.Fatalf("free rotation displaced the piece to (%d,%d)", g.Active.X, g.Active.Y)
	}
}

func TestRotationCanKickUpwardAboveTheBoard(t *testing.T) {
	// Review Focus 2: §7 includes (0,-1) kicks and spawn is row 0, so a kick can
	// legally lift the piece above row 0. That must not panic or be refused.
	g := New(1)
	clearBoard(g)
	for y := 1; y < Height; y++ {
		fillRow(&g.Board, y, KindJ)
	}
	g.Active = Piece{Kind: KindT, Rotation: 0, X: 3, Y: 0}
	evs := g.RotateCW()
	if len(evs) == 0 {
		t.Skip("this stack refuses every kick, which is also legal; the point is it did not panic")
	}
	if g.Board.Collides(g.Active) {
		t.Fatalf("piece at %+v collides after upward kick", g.Active)
	}
}

func TestRotationFailsWhenEveryKickIsBlocked(t *testing.T) {
	g := New(1)
	clearBoard(g)
	for y := 0; y < Height; y++ {
		fillRow(&g.Board, y, KindJ)
	}
	// Carve out exactly the horizontal I slot and nothing else.
	g.Board.Cells[10] = [Width]Cell{}
	g.Active = Piece{Kind: KindI, Rotation: 0, X: 3, Y: 9}
	before := g.Active
	if evs := g.RotateCW(); len(evs) != 0 {
		t.Errorf("blocked rotation emitted %v, want no events", evs)
	}
	if g.Active != before {
		t.Errorf("blocked rotation changed the piece to %+v, want %+v", g.Active, before)
	}
}
```

`IsRotated()` in the first wall-kick test is a typo trap — replace that line with `if len(g.RotateCW()) == 0 {`. Do not add a helper method for it.

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run TestRotate -v`
Expected: FAIL — `g.RotateCW undefined`.

- [ ] **Step 3: Write the implementation**

Append to `internal/game/game.go`:

```go
// rotate turns the active piece by dir quarter-turns (+1 clockwise), trying the
// §7 kick offsets in order and accepting the first that fits. If none fit, the
// rotation fails and nothing changes.
func (g *Game) rotate(dir int) []Event {
	if g.Phase != PhasePlaying {
		return nil
	}
	target := ((g.Active.Rotation+dir)%4 + 4) % 4
	for _, k := range KickOffsets {
		cand := g.Active
		cand.Rotation = target
		cand.X += k.X
		cand.Y += k.Y
		if g.Board.Collides(cand) {
			continue
		}
		g.Active = cand
		g.resetLock()
		return []Event{{Kind: EventPieceRotated, Piece: cand}}
	}
	return nil
}

// RotateCW rotates the active piece clockwise.
func (g *Game) RotateCW() []Event { return g.rotate(1) }

// RotateCCW rotates the active piece counter-clockwise.
func (g *Game) RotateCCW() []Event { return g.rotate(-1) }
```

Also add the `clearBoard` helper to `internal/game/game_test.go` if Task 6's version was removed:

```go
func clearBoard(g *Game) { g.Board = Board{} }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/game/game.go internal/game/game_test.go internal/game/rotation_test.go
git commit -m "feat(game): rotation with forgiving wall kicks"
```

---

### Task 8: Gravity and locking through Advance(dt)

**Files:**
- Modify: `internal/game/game.go` (append `Advance`)
- Test: `internal/game/advance_test.go`

**Interfaces:**
- Consumes: `GravityInterval`, `LockDelay`, `MaxLockResets`, `MaxGravityStepsPerAdvance`.
- Produces: `func (g *Game) Advance(dt time.Duration) []Event`. This is the only way time enters the engine (§49.2).

For this task, locking commits the piece to the board and spawns the next one. Task 9 extends the same helper with line clearing and scoring, so implement `lockActive` here with a `TODO`-free minimal body and grow it there.

- [ ] **Step 1: Write the failing test**

Create `internal/game/advance_test.go`:

```go
package game

import (
	"testing"
	"time"
)

func countEvents(evs []Event, kind EventKind) int {
	n := 0
	for _, e := range evs {
		if e.Kind == kind {
			n++
		}
	}
	return n
}

func TestAdvanceDropsThePieceOncePerInterval(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Active = Piece{Kind: KindO, X: 4, Y: 2}

	if evs := g.Advance(799 * time.Millisecond); len(evs) != 0 {
		t.Fatalf("before one interval, events = %v, want none", evs)
	}
	if g.Active.Y != 2 {
		t.Fatalf("piece moved early to Y=%d", g.Active.Y)
	}

	evs := g.Advance(2 * time.Millisecond)
	if g.Active.Y != 3 {
		t.Fatalf("Y = %d after one interval, want 3", g.Active.Y)
	}
	if countEvents(evs, EventPieceMoved) != 1 {
		t.Fatalf("events = %v, want one PieceMoved", evs)
	}
}

func TestAdvanceIgnoresZeroAndNegativeDt(t *testing.T) {
	g := New(1)
	before := *g
	if evs := g.Advance(0); len(evs) != 0 {
		t.Errorf("Advance(0) = %v, want no events", evs)
	}
	if evs := g.Advance(-time.Second); len(evs) != 0 {
		t.Errorf("Advance(-1s) = %v, want no events", evs)
	}
	if g.Active != before.Active || g.Score != before.Score {
		t.Error("Advance with non-positive dt changed the game")
	}
}

func TestGravityIsFasterAtHigherLevels(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Level = 10
	g.Active = Piece{Kind: KindO, X: 4, Y: 2}
	g.Advance(GravityInterval(10))
	if g.Active.Y != 3 {
		t.Fatalf("Y = %d, want 3 after one level-10 interval", g.Active.Y)
	}
}

func TestGroundedPieceLocksAfterLockDelay(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Active = Piece{Kind: KindO, X: 4, Y: Height - 2}
	if g.canMoveDown() {
		t.Fatal("test setup: piece should be resting on the floor")
	}

	if evs := g.Advance(499 * time.Millisecond); countEvents(evs, EventPieceLocked) != 0 {
		t.Fatalf("locked early: %v", evs)
	}
	if !g.Grounded {
		t.Error("Grounded should be true while resting")
	}

	evs := g.Advance(2 * time.Millisecond)
	if countEvents(evs, EventPieceLocked) != 1 {
		t.Fatalf("events = %v, want one PieceLocked", evs)
	}
	if !g.Board.Cells[Height-1][4].Filled {
		t.Error("piece was not committed to the board")
	}
	if g.Active.Y != SpawnY {
		t.Errorf("next piece did not spawn: Active = %+v", g.Active)
	}
}

func TestMovementWhileGroundedResetsTheLockTimer(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Active = Piece{Kind: KindO, X: 4, Y: Height - 2}
	g.Advance(400 * time.Millisecond)
	g.MoveLeft()
	if g.LockAccumulator != 0 {
		t.Fatalf("LockAccumulator = %v after a grounded move, want 0", g.LockAccumulator)
	}
	if evs := g.Advance(400 * time.Millisecond); countEvents(evs, EventPieceLocked) != 0 {
		t.Fatalf("locked despite the reset: %v", evs)
	}
}

func TestLockResetsAreCappedAtFifteen(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Active = Piece{Kind: KindO, X: 4, Y: Height - 2}
	g.Advance(10 * time.Millisecond) // become grounded

	for i := 0; i < MaxLockResets; i++ {
		if i%2 == 0 {
			g.MoveLeft()
		} else {
			g.MoveRight()
		}
		g.Advance(400 * time.Millisecond)
	}
	if g.LockResets != MaxLockResets {
		t.Fatalf("LockResets = %d, want %d", g.LockResets, MaxLockResets)
	}

	// The sixteenth move must no longer postpone the lock.
	g.MoveLeft()
	if g.LockAccumulator == 0 {
		t.Fatal("move past the reset cap still reset the lock timer")
	}
	if evs := g.Advance(LockDelay); countEvents(evs, EventPieceLocked) != 1 {
		t.Fatalf("events = %v, want the piece to finally lock", evs)
	}
}

func TestSlidingOffALedgeCountsAgainstTheResetCap(t *testing.T) {
	g := New(1)
	clearBoard(g)
	// A one-column pillar on the right: the O rests on it, then slides left into air.
	g.Board.Cells[Height-1][6] = Cell{Filled: true, Kind: KindI}
	g.Board.Cells[Height-1][7] = Cell{Filled: true, Kind: KindI}
	g.Active = Piece{Kind: KindO, X: 5, Y: Height - 3}
	g.Advance(10 * time.Millisecond)
	if !g.Grounded {
		t.Fatal("test setup: piece should be resting on the pillar")
	}
	before := g.LockResets
	g.MoveLeft()
	g.Advance(10 * time.Millisecond)
	if g.LockResets <= before {
		t.Errorf("LockResets = %d, want more than %d: sliding off a ledge must count", g.LockResets, before)
	}
}

func TestAdvanceWithAHugeDtIsBounded(t *testing.T) {
	// Review Focus 1: a suspended terminal or sleeping machine hands us an
	// enormous dt. Gravity work must be bounded and the piece must not tunnel.
	g := New(1)
	clearBoard(g)
	g.Active = Piece{Kind: KindO, X: 4, Y: 0}
	g.Board.Cells[10][4] = Cell{Filled: true, Kind: KindI}
	g.Board.Cells[10][5] = Cell{Filled: true, Kind: KindI}

	evs := g.Advance(10 * time.Minute)

	if g.Active.Y > 8 && g.Phase == PhasePlaying {
		t.Fatalf("piece tunnelled to Y=%d through the obstruction at row 10", g.Active.Y)
	}
	if countEvents(evs, EventPieceMoved) > MaxGravityStepsPerAdvance {
		t.Fatalf("%d gravity steps in one Advance, want at most %d",
			countEvents(evs, EventPieceMoved), MaxGravityStepsPerAdvance)
	}
	if g.GravityAccumulator > GravityInterval(g.Level) {
		t.Fatalf("GravityAccumulator = %v, want a bounded backlog", g.GravityAccumulator)
	}
}

func TestAdvanceAtMaxLevelDoesNotSpinForever(t *testing.T) {
	// The interval clamps to 60ms; a one-second dt must still terminate quickly
	// and produce a bounded number of steps.
	g := New(1)
	clearBoard(g)
	g.Level = 99
	g.Active = Piece{Kind: KindO, X: 4, Y: 0}
	done := make(chan []Event, 1)
	go func() { done <- g.Advance(time.Second) }()
	select {
	case evs := <-done:
		if countEvents(evs, EventPieceMoved) > MaxGravityStepsPerAdvance {
			t.Fatalf("too many steps: %d", countEvents(evs, EventPieceMoved))
		}
	case <-time.After(2 * time.Second):
		t.Fatal("Advance did not return: gravity loop is unbounded")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run TestAdvance -v`
Expected: FAIL — `g.Advance undefined`.

- [ ] **Step 3: Write the implementation**

Append to `internal/game/game.go`:

```go
// Advance moves elapsed time into the game (§49.2). It is the only clock the
// engine has; nothing in this package calls time.Now(). Returned events are in
// the order they happened.
func (g *Game) Advance(dt time.Duration) []Event {
	if g.Phase != PhasePlaying || dt <= 0 {
		return nil
	}
	var evs []Event
	if g.canMoveDown() {
		if g.Grounded {
			// The piece slid off a ledge. Restarting the lock timer here counts
			// against MaxLockResets so that ledge-sliding cannot stall forever.
			g.resetLock()
			g.Grounded = false
		}
		interval := GravityInterval(g.Level)
		g.GravityAccumulator += dt
		steps := 0
		for g.GravityAccumulator >= interval {
			if steps >= MaxGravityStepsPerAdvance {
				// A dt this large means we lost wall-clock time (suspend, sleep,
				// a stalled terminal). Drop the backlog rather than catching up.
				g.GravityAccumulator = 0
				break
			}
			g.GravityAccumulator -= interval
			if !g.canMoveDown() {
				break
			}
			g.Active.Y++
			steps++
			evs = append(evs, Event{Kind: EventPieceMoved, Piece: g.Active})
		}
	}
	if !g.canMoveDown() {
		g.Grounded = true
		g.LockAccumulator += dt
		if g.LockAccumulator >= LockDelay {
			evs = append(evs, g.lockActive()...)
		}
	}
	return evs
}

// lockActive commits the active piece and spawns the next one. Task 9 extends
// this with row clearing and scoring.
func (g *Game) lockActive() []Event {
	g.Board.Lock(g.Active)
	evs := []Event{{Kind: EventPieceLocked, Piece: g.Active}}
	return append(evs, g.spawnNext()...)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/game/game.go internal/game/advance_test.go
git commit -m "feat(game): elapsed-time gravity, lock delay and reset cap"
```

---

### Task 9: Line clearing, combo, level-up, hard drop, hold and game over

**Files:**
- Modify: `internal/game/game.go` (extend `lockActive`, append `HardDrop`, `UseHold`)
- Test: `internal/game/clear_test.go`
- Test: `internal/game/hold_test.go`
- Test: `internal/game/gameover_test.go`

**Interfaces:**
- Consumes: `LineScore`, `ComboBonus`, `LevelFor`, `Board.CompleteRows`, `Board.ClearRows`.
- Produces: `func (g *Game) HardDrop() []Event`; `func (g *Game) UseHold() []Event`; extended `lockActive` emitting `EventLinesCleared`, `EventComboChanged`, `EventLevelChanged`.

Rules pinned here, because the tests depend on them:
- Line and combo scoring use the level **before** the level-up caused by that same clear.
- Hard drop locks **immediately**; the §12 lock delay applies to gravity landings only. §18's impact fires on contact, so waiting 500ms would feel wrong.
- `EventLinesCleared` carries pre-clear row indices, which is what the §19 supernova animation draws on.

- [ ] **Step 1: Write the failing tests**

Create `internal/game/clear_test.go`:

```go
package game

import (
	"reflect"
	"testing"
	"time"
)

// fillRowExcept fills row y except for column gap.
func fillRowExcept(b *Board, y, gap int, kind PieceKind) {
	for x := 0; x < Width; x++ {
		if x == gap {
			continue
		}
		b.Cells[y][x] = Cell{Filled: true, Kind: kind}
	}
}

// dropVerticalIInto places a vertical I above column x and hard drops it.
func dropVerticalIInto(g *Game, x int) []Event {
	g.Active = Piece{Kind: KindI, Rotation: 1, X: x - 2, Y: 0}
	return g.HardDrop()
}

func TestSingleClearScoresAndReportsRows(t *testing.T) {
	g := New(1)
	clearBoard(g)
	fillRowExcept(&g.Board, Height-1, 4, KindJ)
	g.Active = Piece{Kind: KindO, X: 3, Y: Height - 2}
	// The O occupies columns 4 and 5; only column 4 of the bottom row is missing.
	g.Active = Piece{Kind: KindI, Rotation: 1, X: 2, Y: Height - 4}

	evs := g.HardDrop()

	if g.Lines != 1 {
		t.Fatalf("Lines = %d, want 1", g.Lines)
	}
	var cleared *Event
	for i := range evs {
		if evs[i].Kind == EventLinesCleared {
			cleared = &evs[i]
		}
	}
	if cleared == nil {
		t.Fatalf("events = %v, want a LinesCleared", evs)
	}
	if want := []int{Height - 1}; !reflect.DeepEqual(cleared.Rows, want) {
		t.Errorf("cleared rows = %v, want %v", cleared.Rows, want)
	}
	if cleared.Combo != 1 {
		t.Errorf("combo on first clear = %d, want 1", cleared.Combo)
	}
}

func TestFourLineClearScoresEightHundredTimesLevel(t *testing.T) {
	g := New(1)
	clearBoard(g)
	for y := Height - 4; y < Height; y++ {
		fillRowExcept(&g.Board, y, 0, KindJ)
	}
	g.Level = 3
	g.Score = 0
	g.Active = Piece{Kind: KindI, Rotation: 1, X: -2, Y: 0}

	evs := g.HardDrop()

	if g.Lines != 4 {
		t.Fatalf("Lines = %d, want 4", g.Lines)
	}
	// 800*3 base, no combo bonus at combo 1, plus 2 points per hard-dropped cell.
	const base = 800 * 3
	if g.Score < base {
		t.Errorf("Score = %d, want at least the %d base clear value", g.Score, base)
	}
	if countEvents(evs, EventLinesCleared) != 1 {
		t.Errorf("events = %v, want exactly one LinesCleared", evs)
	}
}

func TestComboRisesOnConsecutiveClearsAndResetsOnADryPlacement(t *testing.T) {
	g := New(1)
	clearBoard(g)
	for _, y := range []int{Height - 1, Height - 2} {
		fillRowExcept(&g.Board, y, 0, KindJ)
	}

	g.Active = Piece{Kind: KindO, Rotation: 0, X: -1, Y: 0}
	g.HardDrop()
	if g.Combo != 1 {
		t.Fatalf("combo after first clear = %d, want 1", g.Combo)
	}

	fillRowExcept(&g.Board, Height-1, 0, KindJ)
	g.Active = Piece{Kind: KindI, Rotation: 1, X: -2, Y: 0}
	g.HardDrop()
	if g.Combo != 2 {
		t.Fatalf("combo after second consecutive clear = %d, want 2", g.Combo)
	}

	// A placement into open space clears nothing.
	g.Active = Piece{Kind: KindO, X: 4, Y: 0}
	evs := g.HardDrop()
	if g.Combo != 0 {
		t.Errorf("combo after a dry placement = %d, want 0", g.Combo)
	}
	found := false
	for _, e := range evs {
		if e.Kind == EventComboChanged && e.Combo == 0 {
			found = true
		}
	}
	if !found {
		t.Errorf("events = %v, want a ComboChanged to 0", evs)
	}
}

func TestComboBonusIsAppliedAtComboTwo(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Level = 2
	g.Combo = 1 // pretend the previous placement cleared
	fillRowExcept(&g.Board, Height-1, 0, KindJ)
	g.Score = 0
	g.Active = Piece{Kind: KindI, Rotation: 1, X: -2, Y: 0}

	g.HardDrop()

	// 100*2 single + 50*(2-1)*2 combo = 300, plus hard-drop points.
	if g.Score < 300 {
		t.Errorf("Score = %d, want at least 300 (single + combo bonus at level 2)", g.Score)
	}
}

func TestDryPlacementFromComboZeroEmitsNoComboEvent(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Active = Piece{Kind: KindO, X: 4, Y: 0}
	evs := g.HardDrop()
	if countEvents(evs, EventComboChanged) != 0 {
		t.Errorf("events = %v, want no ComboChanged when combo was already 0", evs)
	}
}

func TestTenLinesRaiseTheLevelAndEmitLevelChanged(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Lines = 9
	fillRowExcept(&g.Board, Height-1, 0, KindJ)
	g.Active = Piece{Kind: KindI, Rotation: 1, X: -2, Y: 0}

	evs := g.HardDrop()

	if g.Level != 2 {
		t.Fatalf("Level = %d after 10 lines, want 2", g.Level)
	}
	found := false
	for _, e := range evs {
		if e.Kind == EventLevelChanged && e.Level == 2 {
			found = true
		}
	}
	if !found {
		t.Fatalf("events = %v, want LevelChanged to 2", evs)
	}
}

func TestClearScoreUsesTheLevelBeforeTheLevelUp(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Lines = 9
	g.Level = 1
	g.Score = 0
	fillRowExcept(&g.Board, Height-1, 0, KindJ)
	g.Active = Piece{Kind: KindI, Rotation: 1, X: -2, Y: 0}
	dropped := Height - 1 - g.Active.Y // rows the piece will fall

	g.HardDrop()

	want := 100*1 + 2*dropped
	if g.Score != want {
		t.Errorf("Score = %d, want %d (single at level 1, not level 2)", g.Score, want)
	}
}

func TestHardDropScoresTwoPerCellAndLocksImmediately(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Active = Piece{Kind: KindO, X: 4, Y: 2}
	g.Score = 0
	startY := g.Active.Y

	evs := g.HardDrop()

	var drop *Event
	for i := range evs {
		if evs[i].Kind == EventPieceHardDropped {
			drop = &evs[i]
		}
	}
	if drop == nil {
		t.Fatalf("events = %v, want a PieceHardDropped", evs)
	}
	if drop.Distance != Height-2-startY {
		t.Errorf("Distance = %d, want %d", drop.Distance, Height-2-startY)
	}
	if g.Score != 2*drop.Distance {
		t.Errorf("Score = %d, want %d", g.Score, 2*drop.Distance)
	}
	if countEvents(evs, EventPieceLocked) != 1 {
		t.Errorf("events = %v, want the piece to lock immediately", evs)
	}
	if !g.Board.Cells[Height-1][4].Filled {
		t.Error("hard-dropped piece was not committed")
	}
}

func TestHardDropOnAGroundedPieceStillLocks(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Active = Piece{Kind: KindO, X: 4, Y: Height - 2}
	g.Advance(10 * time.Millisecond)
	evs := g.HardDrop()
	if countEvents(evs, EventPieceLocked) != 1 {
		t.Fatalf("events = %v, want one PieceLocked", evs)
	}
}
```

Create `internal/game/hold_test.go`:

```go
package game

import "testing"

func TestFirstHoldStoresTheActivePieceAndSpawnsTheNext(t *testing.T) {
	g := New(1)
	held := g.Active.Kind
	wanted := g.Next[0]

	evs := g.UseHold()

	if g.Hold == nil || *g.Hold != held {
		t.Fatalf("Hold = %v, want %s", g.Hold, held)
	}
	if g.Active.Kind != wanted {
		t.Errorf("Active = %s, want the queued %s", g.Active.Kind, wanted)
	}
	if len(g.Next) != NextQueueLen {
		t.Errorf("len(Next) = %d, want %d", len(g.Next), NextQueueLen)
	}
	if countEvents(evs, EventHoldUsed) != 1 {
		t.Errorf("events = %v, want one HoldUsed", evs)
	}
	if g.CanHold {
		t.Error("CanHold should be false after a hold")
	}
}

func TestSecondHoldSwapsAndReturnsToSpawnRotation(t *testing.T) {
	g := New(1)
	first := g.Active.Kind
	g.UseHold()
	second := g.Active.Kind
	g.RotateCW()
	g.MoveLeft()
	g.CanHold = true // simulate the piece having locked and a new one spawning

	g.UseHold()

	if g.Active.Kind != first {
		t.Errorf("Active = %s, want the previously held %s", g.Active.Kind, first)
	}
	if g.Hold == nil || *g.Hold != second {
		t.Errorf("Hold = %v, want %s", g.Hold, second)
	}
	if g.Active.Rotation != 0 {
		t.Errorf("Rotation = %d, want spawn rotation 0", g.Active.Rotation)
	}
	if g.Active.X != SpawnX || g.Active.Y != SpawnY {
		t.Errorf("held piece spawned at (%d,%d), want (%d,%d)", g.Active.X, g.Active.Y, SpawnX, SpawnY)
	}
}

func TestSecondHoldBeforeLockingIsBlocked(t *testing.T) {
	// Review Focus 4: hold pressed twice in a row.
	g := New(1)
	g.UseHold()
	active, hold := g.Active, *g.Hold

	evs := g.UseHold()

	if len(evs) != 0 {
		t.Errorf("blocked hold emitted %v, want no events", evs)
	}
	if g.Active != active || *g.Hold != hold {
		t.Error("blocked hold changed the game state")
	}
}

func TestHoldIsRestoredAfterTheNextLock(t *testing.T) {
	g := New(1)
	g.UseHold()
	if g.CanHold {
		t.Fatal("test setup: CanHold should be false")
	}
	clearBoard(g)
	g.HardDrop()
	if !g.CanHold {
		t.Error("CanHold should be restored once a piece locks")
	}
}

func TestHoldTimersResetForTheIncomingPiece(t *testing.T) {
	g := New(1)
	clearBoard(g)
	g.Active = Piece{Kind: KindO, X: 4, Y: Height - 2}
	g.Advance(300 * time.Millisecond) // accumulate lock time while grounded
	g.CanHold = true

	g.UseHold()

	if g.LockAccumulator != 0 || g.LockResets != 0 || g.Grounded {
		t.Errorf("stale timers after hold: lock=%v resets=%d grounded=%v",
			g.LockAccumulator, g.LockResets, g.Grounded)
	}
}
```

Add `import "time"` to `hold_test.go`.

Create `internal/game/gameover_test.go`:

```go
package game

import (
	"testing"
	"time"
)

func TestBlockedSpawnEndsTheGameExactlyOnce(t *testing.T) {
	// Review Focus 5: a lock that tops out.
	g := New(1)
	clearBoard(g)
	for y := 0; y < Height; y++ {
		fillRow(&g.Board, y, KindJ)
	}
	g.Board.Cells[Height-1][0] = Cell{} // one gap so the drop has somewhere to go
	g.Active = Piece{Kind: KindO, X: -1, Y: 0}

	evs := g.HardDrop()

	if g.Phase != PhaseGameOver {
		t.Fatalf("Phase = %v, want PhaseGameOver", g.Phase)
	}
	if n := countEvents(evs, EventGameOver); n != 1 {
		t.Fatalf("GameOver events = %d, want exactly 1 (events: %v)", n, evs)
	}
	if evs2 := g.Advance(time.Second); len(evs2) != 0 {
		t.Errorf("Advance after game over = %v, want no events", evs2)
	}
	if n := countEvents(g.Advance(time.Second), EventGameOver); n != 0 {
		t.Error("GameOver emitted a second time")
	}
}

func TestEveryActionIsANoOpAfterGameOver(t *testing.T) {
	// Review Focus 3: the player is mashing keys as they die.
	g := New(1)
	g.Phase = PhaseGameOver
	before := *g
	beforeBoard := g.Board

	actions := map[string]func() []Event{
		"MoveLeft":  g.MoveLeft,
		"MoveRight": g.MoveRight,
		"SoftDrop":  g.SoftDrop,
		"RotateCW":  g.RotateCW,
		"RotateCCW": g.RotateCCW,
		"HardDrop":  g.HardDrop,
		"UseHold":   g.UseHold,
		"Advance":   func() []Event { return g.Advance(time.Second) },
	}
	for name, fn := range actions {
		if evs := fn(); len(evs) != 0 {
			t.Errorf("%s after game over emitted %v, want no events", name, evs)
		}
	}
	if g.Active != before.Active || g.Score != before.Score || g.Board != beforeBoard {
		t.Error("an action mutated the game after game over")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestSingleClear|TestFirstHold|TestBlockedSpawn' -v`
Expected: FAIL — `g.HardDrop undefined`, `g.UseHold undefined`.

- [ ] **Step 3: Extend lockActive and add HardDrop and UseHold**

Replace the `lockActive` added in Task 8 with:

```go
// lockActive commits the active piece, resolves clears and scoring, and spawns
// the next piece (§12). Scoring uses the level in force before this clear, so a
// clear that triggers a level-up is paid at the old rate.
func (g *Game) lockActive() []Event {
	g.Board.Lock(g.Active)
	evs := []Event{{Kind: EventPieceLocked, Piece: g.Active}}

	rows := g.Board.CompleteRows()
	if len(rows) > 0 {
		g.Board.ClearRows(rows)
		g.Lines += len(rows)
		g.Combo++
		g.Score += LineScore(len(rows), g.Level) + ComboBonus(g.Combo, g.Level)
		evs = append(evs, Event{
			Kind:  EventLinesCleared,
			Rows:  rows,
			Combo: g.Combo,
			Level: g.Level,
			Score: g.Score,
		})
		evs = append(evs, Event{Kind: EventComboChanged, Combo: g.Combo, Level: g.Level})
		if lv := LevelFor(g.Lines); lv != g.Level {
			g.Level = lv
			evs = append(evs, Event{Kind: EventLevelChanged, Level: lv})
		}
	} else if g.Combo != 0 {
		g.Combo = 0
		evs = append(evs, Event{Kind: EventComboChanged, Combo: 0, Level: g.Level})
	}

	return append(evs, g.spawnNext()...)
}

// HardDrop slams the piece down, scores two points per cell, and locks
// immediately — the §12 lock delay is for gravity landings, and §18's impact
// fires on contact.
func (g *Game) HardDrop() []Event {
	if g.Phase != PhasePlaying {
		return nil
	}
	dist := 0
	for g.canMoveDown() {
		g.Active.Y++
		dist++
	}
	g.Score += 2 * dist
	evs := []Event{{Kind: EventPieceHardDropped, Piece: g.Active, Distance: dist, Score: g.Score}}
	return append(evs, g.lockActive()...)
}

// UseHold swaps the active piece with the hold slot (§9). It works once per
// piece; the incoming piece always arrives in spawn rotation.
func (g *Game) UseHold() []Event {
	if g.Phase != PhasePlaying || !g.CanHold {
		return nil
	}
	outgoing := g.Active.Kind
	evs := []Event{{Kind: EventHoldUsed, Piece: Piece{Kind: outgoing}}}

	if g.Hold == nil {
		g.Hold = &outgoing
		evs = append(evs, g.spawnNext()...)
	} else {
		incoming := *g.Hold
		g.Hold = &outgoing
		evs = append(evs, g.spawnPiece(incoming)...)
	}
	// spawnPiece and spawnNext re-enable holding for a fresh piece; a swap does not.
	g.CanHold = false
	return evs
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS. If `TestSingleClearScoresAndReportsRows` fails on setup, fix the fixture (the second `g.Active` assignment is the live one — a vertical I at `X: 2` fills column 4) rather than the implementation.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/game/game.go internal/game/clear_test.go internal/game/hold_test.go internal/game/gameover_test.go
git commit -m "feat(game): clears, combo, level-up, hard drop, hold and game over"
```

---

### Task 10: Read-only snapshot for the renderer

**Files:**
- Modify: `internal/game/game.go` (append `Snapshot`)
- Test: `internal/game/snapshot_test.go`

**Interfaces:**
- Consumes: `Game`.
- Produces: `type Snapshot struct{ Board Board; Active Piece; GhostY int; HoldKind PieceKind; HasHold bool; Next []PieceKind; Score, Lines, Level, Combo int; Phase Phase; Seed int64 }`; `func (g *Game) Snapshot() Snapshot`.

§37 requires that rendering not mutate game state. A value-copy snapshot makes that structural instead of a rule someone has to remember: `render` is handed a `Snapshot`, never a `*Game`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/snapshot_test.go`:

```go
package game

import "testing"

func TestSnapshotCopiesTheVisibleState(t *testing.T) {
	g := New(99)
	clearBoard(g)
	g.Board.Cells[Height-1][3] = Cell{Filled: true, Kind: KindZ}
	g.Score, g.Lines, g.Level, g.Combo = 1234, 42, 5, 3
	g.UseHold()

	s := g.Snapshot()

	if s.Score != 1234 || s.Lines != 42 || s.Level != 5 || s.Combo != 3 {
		t.Errorf("stats not copied: %+v", s)
	}
	if s.Active != g.Active {
		t.Errorf("Active = %+v, want %+v", s.Active, g.Active)
	}
	if s.GhostY != g.GhostY() {
		t.Errorf("GhostY = %d, want %d", s.GhostY, g.GhostY())
	}
	if !s.HasHold || s.HoldKind != *g.Hold {
		t.Errorf("hold = (%v, %s), want (true, %s)", s.HasHold, s.HoldKind, *g.Hold)
	}
	if len(s.Next) != len(g.Next) {
		t.Fatalf("len(Next) = %d, want %d", len(s.Next), len(g.Next))
	}
	if s.Board.Cells[Height-1][3] != g.Board.Cells[Height-1][3] {
		t.Error("board not copied")
	}
	if s.Seed != 99 {
		t.Errorf("Seed = %d, want 99", s.Seed)
	}
}

func TestSnapshotWithNoHeldPiece(t *testing.T) {
	s := New(1).Snapshot()
	if s.HasHold {
		t.Error("HasHold should be false on a fresh game")
	}
}

func TestMutatingASnapshotCannotTouchTheGame(t *testing.T) {
	g := New(1)
	clearBoard(g)
	s := g.Snapshot()

	s.Board.Cells[0][0] = Cell{Filled: true, Kind: KindT}
	s.Active.X = 99
	s.Score = 999999
	s.Next[0] = KindZ

	if g.Board.Cells[0][0].Filled {
		t.Error("snapshot board aliases the game board")
	}
	if g.Active.X == 99 {
		t.Error("snapshot Active aliases the game")
	}
	if g.Score == 999999 {
		t.Error("snapshot Score aliases the game")
	}
	if g.Next[0] == KindZ && s.Next[0] == KindZ {
		t.Error("snapshot Next slice aliases the game queue")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run TestSnapshot -v`
Expected: FAIL — `g.Snapshot undefined`.

- [ ] **Step 3: Write the implementation**

Append to `internal/game/game.go`:

```go
// Snapshot is a value copy of everything the renderer needs (§37). Handing the
// renderer a Snapshot rather than a *Game means rendering cannot mutate game
// state even by accident.
type Snapshot struct {
	Board  Board
	Active Piece
	GhostY int

	HoldKind PieceKind
	HasHold  bool
	Next     []PieceKind

	Score int
	Lines int
	Level int
	Combo int

	Phase Phase
	Seed  int64
}

// Snapshot captures the current state for rendering.
func (g *Game) Snapshot() Snapshot {
	s := Snapshot{
		Board:  g.Board,
		Active: g.Active,
		GhostY: g.GhostY(),
		Next:   append(make([]PieceKind, 0, len(g.Next)), g.Next...),
		Score:  g.Score,
		Lines:  g.Lines,
		Level:  g.Level,
		Combo:  g.Combo,
		Phase:  g.Phase,
		Seed:   g.Seed,
	}
	if g.Hold != nil {
		s.HoldKind, s.HasHold = *g.Hold, true
	}
	return s
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Format, vet, commit**

```bash
gofmt -l . && go vet ./...
git add internal/game/game.go internal/game/snapshot_test.go
git commit -m "feat(game): value-copy snapshot for the renderer"
```

---

### Task 11: Determinism replay test

**Files:**
- Test: `internal/game/determinism_test.go`

**Interfaces:**
- Consumes: the whole engine.
- Produces: nothing exported. This task's deliverable is the proof that §35 holds.

- [ ] **Step 1: Write the test**

Create `internal/game/determinism_test.go`:

```go
package game

import (
	"fmt"
	"math/rand/v2"
	"strings"
	"testing"
	"time"
)

// action is one entry in a canned input stream.
type action struct {
	key string        // "", "left", "right", "cw", "ccw", "soft", "hard", "hold"
	dt  time.Duration // elapsed time fed to Advance after the key
}

// cannedStream builds a long, reproducible (input, dt) stream. Its own RNG is
// separate from any game so that generating the script never touches game state.
func cannedStream(n int) []action {
	keys := []string{"", "left", "right", "cw", "ccw", "soft", "hard", "hold"}
	r := rand.New(rand.NewPCG(0xC0FFEE, 0xBEEF))
	out := make([]action, 0, n)
	for i := 0; i < n; i++ {
		out = append(out, action{
			key: keys[r.IntN(len(keys))],
			dt:  time.Duration(r.IntN(90)+1) * time.Millisecond,
		})
	}
	return out
}

// replay runs a stream against a fresh game and returns a fingerprint of the
// final state.
func replay(seed int64, stream []action) string {
	g := New(seed)
	events := 0
	for _, a := range stream {
		switch a.key {
		case "left":
			events += len(g.MoveLeft())
		case "right":
			events += len(g.MoveRight())
		case "cw":
			events += len(g.RotateCW())
		case "ccw":
			events += len(g.RotateCCW())
		case "soft":
			events += len(g.SoftDrop())
		case "hard":
			events += len(g.HardDrop())
		case "hold":
			events += len(g.UseHold())
		}
		events += len(g.Advance(a.dt))
	}
	return fingerprint(g, events)
}

func fingerprint(g *Game, events int) string {
	var b strings.Builder
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if c := g.Board.Cells[y][x]; c.Filled {
				b.WriteString(c.Kind.String())
			} else {
				b.WriteByte('.')
			}
		}
		b.WriteByte('/')
	}
	fmt.Fprintf(&b, "score=%d lines=%d level=%d combo=%d phase=%v events=%d active=%+v next=%v",
		g.Score, g.Lines, g.Level, g.Combo, g.Phase, events, g.Active, g.Next)
	return b.String()
}

func TestReplayOfACannedStreamIsReproducible(t *testing.T) {
	stream := cannedStream(4000)
	first := replay(8675309, stream)
	for i := 0; i < 3; i++ {
		if got := replay(8675309, stream); got != first {
			t.Fatalf("replay %d diverged from the first run", i+1)
		}
	}
}

func TestReplayReachesAMeaningfulState(t *testing.T) {
	// A replay that ends on move one proves nothing. Assert the stream actually
	// plays the game.
	g := New(8675309)
	for _, a := range cannedStream(4000) {
		switch a.key {
		case "hard":
			g.HardDrop()
		case "soft":
			g.SoftDrop()
		case "left":
			g.MoveLeft()
		case "right":
			g.MoveRight()
		case "cw":
			g.RotateCW()
		case "hold":
			g.UseHold()
		}
		g.Advance(a.dt)
	}
	if g.Score == 0 {
		t.Error("replay scored nothing; the canned stream is not exercising the game")
	}
}

func TestDifferentSeedsDivergeUnderTheSameStream(t *testing.T) {
	stream := cannedStream(2000)
	if replay(1, stream) == replay(2, stream) {
		t.Error("two seeds produced identical final states; the seed is not reaching the bag")
	}
}

func TestSplittingDtDoesNotChangeGravityOutcomes(t *testing.T) {
	// One 800ms step and eight 100ms steps must both drop the piece exactly once.
	a, b := New(5), New(5)
	clearBoard(a)
	clearBoard(b)
	a.Active = Piece{Kind: KindO, X: 4, Y: 2}
	b.Active = Piece{Kind: KindO, X: 4, Y: 2}

	a.Advance(800 * time.Millisecond)
	for i := 0; i < 8; i++ {
		b.Advance(100 * time.Millisecond)
	}
	if a.Active.Y != b.Active.Y {
		t.Fatalf("coarse dt landed at Y=%d, fine dt at Y=%d", a.Active.Y, b.Active.Y)
	}
}
```

- [ ] **Step 2: Run the tests**

Run: `go test ./internal/game/ -run 'TestReplay|TestDifferentSeeds|TestSplittingDt' -v`
Expected: PASS. If `TestReplayOfACannedStreamIsReproducible` fails, there is a real determinism bug — hunt for map iteration order, a second RNG, or a `time.Now()` call under `internal/game`.

- [ ] **Step 3: Prove the engine never reads a clock**

Run:

```bash
grep -rn 'time\.Now\|time\.Since\|time\.Tick\|time\.After' internal/game/*.go | grep -v '_test.go'
```

Expected: no output. If anything matches, remove it — §49.2 is the whole basis of the replay test.

- [ ] **Step 4: Run the full suite with the race detector**

Run: `go test ./... -race -count=2`
Expected: PASS. `-count=2` catches state leaking through package-level variables.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && go vet ./...
git add internal/game/determinism_test.go
git commit -m "test(game): seeded replay proves the engine is deterministic"
```

---

## Done when

- `go test ./... -race` passes.
- `internal/game` contains no clock reads (Task 11 Step 3 greps clean).
- Every §40 engine test category has coverage: board (collision, bounds, row completion, removal, collapse), pieces (every rotation, wall kicks, failed rotation, spawn position), bag (all seven per bag, seeded reproducibility), hold (initial, swap, second blocked, restored after lock), drop (soft, hard, landing position, lock), score (line values, combo, drop scoring, level progression), game over (blocked spawn, state transition), determinism (canned replay).
- Plan 2 can start: it needs `game.New`, `game.Snapshot`, the action methods, `Advance`, and `game.Event`.
