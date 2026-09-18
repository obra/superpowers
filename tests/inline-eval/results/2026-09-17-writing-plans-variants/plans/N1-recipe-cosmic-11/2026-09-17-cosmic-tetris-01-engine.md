# Cosmic Tetris — Plan 01: Headless Game Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete, deterministic, headless Cosmic Tetris game engine (`internal/game`) with comprehensive unit tests, so that every later plan renders a game that already works.

**Architecture:** A single package `internal/game` holding pure logic: a fixed-size `Board`, a `Piece` with four precomputed rotations per kind, a 7-bag generator driven by the game's own `*rand.Rand`, and a `Game` that is advanced only by `Advance(dt time.Duration) []Event`. Nothing in the package reads a clock, touches the filesystem, or knows what a terminal is. All state changes emit `Event` values that later plans feed to the FX system.

**Tech Stack:** Go 1.26, standard library only (`math/rand`, `time`, `testing`). No third-party dependencies in this plan.

**Spec:** `design.md` (this repo) — Phase 1 of §42. Sections most relevant: §5, §6, §7, §11, §12, §13, §34, §35, §40, §49.1, §49.2, §49.6.

**Plan sequence:** 01-engine (this) → 02-terminal → 03-cosmic-foundation → 04-violence → 05-polish. No later plan may be started before this one's tests pass (§42: "Tests must pass before proceeding").

## Global Constraints

- Language: Go. Module path: `github.com/jessev/cosmic-tetris` (module name is local only; there is no remote).
- Board: width `10`, height `22`, visible rows `20`, hidden spawn rows `2`. Row `0` is the top; rows `0`–`1` are hidden; rows `2`–`21` are visible.
- Seven piece families: `I J L O S T Z`. Four predefined rotations per piece. `O` is visually identical through rotation.
- Wall-kick offsets, tested in exactly this order: `(0,0) (-1,0) (1,0) (-2,0) (2,0) (0,-1) (-1,-1) (1,-1)`. First valid position wins; if none is valid, rotation fails.
- Gravity: level 1 = `800ms`; `interval = 800ms * 0.86^(level-1)`; clamped at a `60ms` floor.
- Level increases every `10` cleared lines.
- Soft drop: `+1 point / cell`. Hard drop: `+2 points / cell`.
- Lock delay `500ms`. A successful move or rotation while grounded resets the lock timer. `max lock resets = 15`.
- Line values: 1 line `100 × level`, 2 lines `300 × level`, 3 lines `500 × level`, 4 lines `800 × level`.
- Combo (§49.1): counts consecutive placements clearing ≥1 line; first clearing placement sets combo to `1`; a placement clearing nothing resets combo to `0`. Bonus `= 50 × (combo - 1) × level`.
- Locking order (§12): commit piece → detect complete rows → clear rows → update score → emit FX event → spawn next piece.
- §49.2: `internal/game` exposes `func (g *Game) Advance(dt time.Duration) []Event` and **nothing under `internal/game` calls `time.Now()`**. Timing is an input.
- §49.6: `Game` owns `rng *rand.Rand`, which drives the 7-bag and nothing else. `Seed int64` is recorded for display and restart. FX gets a separate generator in a later plan; the two never share.
- Maintain enough future pieces to render the next **five**.
- No goroutines, no filesystem access, no logging in this package.

## Review Focus

Five things the spec implies, that a player will hit, and that no obvious happy-path test covers. Each has a test assigned to the task that owns the code.

1. **A `dt` far larger than the gravity interval** (terminal was backgrounded; one 5-second tick arrives) must apply gravity steps until the piece is grounded and then stop — never teleport the piece through the floor or the stack. → Task 8.
2. **Zero or negative `dt`** (clock skew, a duplicate frame) must change nothing and must not panic. → Task 8.
3. **Rotation with cells above the board top** (`y < 0`, an `I` piece rotated upright in the spawn rows) must treat above-board space as empty, not as a wall and not as an index panic. → Task 4.
4. **A completed row inside the hidden spawn rows** (rows 0–1, in a nearly-topped-out well) must clear and collapse like any other row. → Task 2.
5. **Input after game over** (player mashes keys during the death animation, which later plans keep interactive) must be a no-op: no movement, no score change, no panic. → Task 11.

---

### Task 1: Module bootstrap, piece kinds, rotation tables

**Files:**
- Create: `go.mod`
- Create: `internal/game/piece.go`
- Test: `internal/game/piece_test.go`
- Create: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type PieceKind uint8` with constants `KindI, KindJ, KindL, KindO, KindS, KindT, KindZ` (in that order) and `AllKinds = [7]PieceKind{...}`.
  - `func (k PieceKind) String() string` → `"I" "J" "L" "O" "S" "T" "Z"`.
  - `type Piece struct { Kind PieceKind; Rotation int; X, Y int }`.
  - `func (p Piece) Cells() [4][2]int` — absolute board coordinates `{x, y}` of the piece's four cells.
  - `func (p Piece) Normalized() Piece` — `Rotation` wrapped into `0..3` (handles `-1`).

- [ ] **Step 1: Initialize the module and ignore file**

```bash
go mod init github.com/jessev/cosmic-tetris
printf 'cosmic-tetris\n/dist/\n' > .gitignore
```

- [ ] **Step 2: Write the failing test**

`internal/game/piece_test.go`:

```go
package game

import "testing"

func TestPieceKindString(t *testing.T) {
	want := []string{"I", "J", "L", "O", "S", "T", "Z"}
	for i, k := range AllKinds {
		if got := k.String(); got != want[i] {
			t.Errorf("kind %d: got %q want %q", i, got, want[i])
		}
	}
}

func TestEveryRotationHasFourDistinctCellsInBox(t *testing.T) {
	for _, k := range AllKinds {
		for r := 0; r < 4; r++ {
			p := Piece{Kind: k, Rotation: r, X: 0, Y: 0}
			cells := p.Cells()
			seen := map[[2]int]bool{}
			for _, c := range cells {
				if c[0] < 0 || c[0] > 3 || c[1] < 0 || c[1] > 3 {
					t.Errorf("%s rot %d: cell %v outside 4x4 box", k, r, c)
				}
				if seen[c] {
					t.Errorf("%s rot %d: duplicate cell %v", k, r, c)
				}
				seen[c] = true
			}
			if len(seen) != 4 {
				t.Errorf("%s rot %d: got %d cells want 4", k, r, len(seen))
			}
		}
	}
}

func TestOIsRotationInvariant(t *testing.T) {
	base := Piece{Kind: KindO, Rotation: 0}.Cells()
	for r := 1; r < 4; r++ {
		if got := (Piece{Kind: KindO, Rotation: r}).Cells(); got != base {
			t.Errorf("O rot %d: got %v want %v", r, got, base)
		}
	}
}

func TestCellsTranslateWithPosition(t *testing.T) {
	a := Piece{Kind: KindT, Rotation: 1, X: 0, Y: 0}.Cells()
	b := Piece{Kind: KindT, Rotation: 1, X: 4, Y: 7}.Cells()
	for i := range a {
		if b[i][0] != a[i][0]+4 || b[i][1] != a[i][1]+7 {
			t.Fatalf("cell %d not translated: %v vs %v", i, a[i], b[i])
		}
	}
}

func TestNormalizedWrapsRotation(t *testing.T) {
	for in, want := range map[int]int{-1: 3, 0: 0, 4: 0, 5: 1, -4: 0} {
		if got := (Piece{Rotation: in}).Normalized().Rotation; got != want {
			t.Errorf("rotation %d: got %d want %d", in, got, want)
		}
	}
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `go test ./internal/game/ -run TestPiece -v`
Expected: FAIL — build error, `undefined: AllKinds`.

- [ ] **Step 4: Implement `piece.go` with the pinned rotation table**

Offsets are `{dx, dy}` inside a 4×4 box, origin top-left, `dy` increasing downward. `Cells()` adds `p.X`/`p.Y`. Copy this table exactly — it is the rotation contract every later task and test assumes:

```go
// shapes[kind][rotation] holds the four {dx,dy} offsets of that rotation.
var shapes = [7][4][4][2]int{
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `go test ./internal/game/ -run TestPiece -v && go vet ./...`
Expected: PASS, vet clean.

- [ ] **Step 6: Commit**

```bash
git add go.mod .gitignore internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): piece kinds and pinned rotation table"
```

---

### Task 2: Board — bounds, occupancy, row completion, collapse

**Files:**
- Create: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `PieceKind` from Task 1.
- Produces:
  - `const Width = 10`, `Height = 22`, `VisibleHeight = 20`, `HiddenRows = 2`.
  - `type Cell uint8`, `const Empty Cell = 0`, `func CellFor(k PieceKind) Cell` (`= Cell(k) + 1`), `func (c Cell) Kind() (PieceKind, bool)`.
  - `type Board struct { Cells [Height][Width]Cell }`.
  - `func (b *Board) At(x, y int) Cell` — `Empty` for any out-of-range coordinate.
  - `func (b *Board) Set(x, y int, c Cell)` — silently ignores out-of-range writes.
  - `func (b *Board) Occupied(x, y int) bool` — `true` when `x < 0 || x >= Width || y >= Height` (walls and floor) or the cell is non-empty; **`false` when `y < 0`** (above the board is open space).
  - `func (b *Board) CompleteRows() []int` — ascending row indices, including hidden rows 0–1.
  - `func (b *Board) ClearRows(rows []int)` — removes those rows and collapses everything above them downward; new empty rows enter at the top.
  - `func (b *Board) RowFilled(y int) bool`, `func (b *Board) Fingerprint() uint64` (FNV-1a over all cells; used by the determinism test).

- [ ] **Step 1: Write the failing test**

`internal/game/board_test.go`:

```go
package game

import (
	"reflect"
	"testing"
)

func fill(b *Board, y int, xs ...int) {
	for _, x := range xs {
		b.Set(x, y, CellFor(KindT))
	}
}

func fillRow(b *Board, y int, except ...int) {
	skip := map[int]bool{}
	for _, x := range except {
		skip[x] = true
	}
	for x := 0; x < Width; x++ {
		if !skip[x] {
			b.Set(x, y, CellFor(KindI))
		}
	}
}

func TestBoardDimensions(t *testing.T) {
	if Width != 10 || Height != 22 || VisibleHeight != 20 || HiddenRows != 2 {
		t.Fatalf("board dimensions changed: %d %d %d %d", Width, Height, VisibleHeight, HiddenRows)
	}
	if HiddenRows+VisibleHeight != Height {
		t.Fatal("hidden + visible must equal height")
	}
}

func TestOccupiedWallsFloorAndOpenSky(t *testing.T) {
	var b Board
	cases := []struct {
		x, y int
		want bool
	}{
		{-1, 5, true}, {Width, 5, true}, {0, Height, true}, {5, Height + 3, true},
		{5, -1, false}, {0, -4, false}, {0, 0, false}, {5, 21, false},
	}
	for _, c := range cases {
		if got := b.Occupied(c.x, c.y); got != c.want {
			t.Errorf("Occupied(%d,%d) = %v want %v", c.x, c.y, got, c.want)
		}
	}
	b.Set(3, 10, CellFor(KindZ))
	if !b.Occupied(3, 10) {
		t.Error("filled cell should be occupied")
	}
}

func TestAtAndSetIgnoreOutOfRange(t *testing.T) {
	var b Board
	b.Set(-1, -1, CellFor(KindO)) // must not panic
	b.Set(Width, Height, CellFor(KindO))
	if b.At(-1, -1) != Empty || b.At(99, 99) != Empty {
		t.Error("out-of-range At must report Empty")
	}
}

func TestCellRoundTrip(t *testing.T) {
	for _, k := range AllKinds {
		got, ok := CellFor(k).Kind()
		if !ok || got != k {
			t.Errorf("%s: round trip gave %v ok=%v", k, got, ok)
		}
	}
	if _, ok := Empty.Kind(); ok {
		t.Error("Empty must not report a kind")
	}
}

func TestCompleteRowsAscending(t *testing.T) {
	var b Board
	fillRow(&b, 21)
	fillRow(&b, 19)
	fillRow(&b, 20, 4) // one gap: not complete
	if got := b.CompleteRows(); !reflect.DeepEqual(got, []int{19, 21}) {
		t.Fatalf("got %v want [19 21]", got)
	}
}

func TestClearRowsCollapsesFromAbove(t *testing.T) {
	var b Board
	fill(&b, 18, 0)  // marker above the cleared rows
	fillRow(&b, 20)
	fillRow(&b, 21)
	b.ClearRows([]int{20, 21})
	if b.At(0, 20) != CellFor(KindT) {
		t.Errorf("marker should have fallen from row 18 to row 20, got %v", b.At(0, 20))
	}
	for x := 0; x < Width; x++ {
		if b.At(x, 21) != Empty {
			t.Errorf("row 21 should be empty after collapse, x=%d", x)
		}
	}
	if b.At(0, 18) != Empty {
		t.Error("original marker row must be vacated")
	}
}

// Review focus 4: a complete row inside the hidden spawn rows.
func TestClearRowsInHiddenSpawnRows(t *testing.T) {
	var b Board
	fillRow(&b, 0)
	fillRow(&b, 1)
	fill(&b, 5, 2)
	if got := b.CompleteRows(); !reflect.DeepEqual(got, []int{0, 1}) {
		t.Fatalf("hidden rows should be reported complete, got %v", got)
	}
	b.ClearRows([]int{0, 1})
	if b.RowFilled(0) || b.RowFilled(1) {
		t.Error("cleared hidden rows must no longer read as filled")
	}
	if b.At(2, 5) != CellFor(KindT) {
		t.Error("cells below cleared hidden rows must not move")
	}
	if b.At(0, 0) != Empty || b.At(0, 1) != Empty {
		t.Error("cleared hidden rows must be empty")
	}
}

func TestFingerprintChangesWithContent(t *testing.T) {
	var a, b Board
	if a.Fingerprint() != b.Fingerprint() {
		t.Fatal("equal boards must share a fingerprint")
	}
	b.Set(4, 4, CellFor(KindS))
	if a.Fingerprint() == b.Fingerprint() {
		t.Fatal("different boards must differ")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run 'TestBoard|TestOccupied|TestAt|TestCell|TestComplete|TestClear|TestFingerprint' -v`
Expected: FAIL — `undefined: Board`.

- [ ] **Step 3: Implement `board.go`**

`ClearRows` is easiest as a single downward compaction pass: walk a write cursor from `Height-1` upward, skipping source rows that are in the clear set, then zero the remaining top rows.

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board occupancy, row completion, and collapse"
```

---

### Task 3: 7-bag piece generator

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `AllKinds`.
- Produces:
  - `type Bag struct { queue []PieceKind }`.
  - `func (b *Bag) Next(rng *rand.Rand) PieceKind` — refills with one of every kind and shuffles (via `rng.Shuffle`) whenever the queue is empty, then pops.
  - `func (b *Bag) Remaining() int`.

The bag never owns an RNG; `Game` passes its own in (§49.6).

- [ ] **Step 1: Write the failing test**

`internal/game/bag_test.go`:

```go
package game

import (
	"math/rand"
	"testing"
)

func TestEachBagContainsAllSevenKindsExactlyOnce(t *testing.T) {
	rng := rand.New(rand.NewSource(1))
	var b Bag
	for bagIndex := 0; bagIndex < 20; bagIndex++ {
		counts := map[PieceKind]int{}
		for i := 0; i < 7; i++ {
			counts[b.Next(rng)]++
		}
		if len(counts) != 7 {
			t.Fatalf("bag %d contained %d distinct kinds: %v", bagIndex, len(counts), counts)
		}
		for _, k := range AllKinds {
			if counts[k] != 1 {
				t.Fatalf("bag %d has %d of %s", bagIndex, counts[k], k)
			}
		}
	}
}

func TestSeededBagIsReproducible(t *testing.T) {
	draw := func() []PieceKind {
		rng := rand.New(rand.NewSource(8675309))
		var b Bag
		out := make([]PieceKind, 0, 35)
		for i := 0; i < 35; i++ {
			out = append(out, b.Next(rng))
		}
		return out
	}
	a, c := draw(), draw()
	for i := range a {
		if a[i] != c[i] {
			t.Fatalf("draw %d differs: %s vs %s", i, a[i], c[i])
		}
	}
}

func TestDifferentSeedsEventuallyDiffer(t *testing.T) {
	drawWith := func(seed int64) []PieceKind {
		rng := rand.New(rand.NewSource(seed))
		var b Bag
		out := make([]PieceKind, 0, 21)
		for i := 0; i < 21; i++ {
			out = append(out, b.Next(rng))
		}
		return out
	}
	a, b := drawWith(1), drawWith(2)
	same := true
	for i := range a {
		if a[i] != b[i] {
			same = false
			break
		}
	}
	if same {
		t.Fatal("two seeds produced identical 21-piece sequences")
	}
}

func TestBagShufflesRatherThanCyclesInOrder(t *testing.T) {
	rng := rand.New(rand.NewSource(42))
	var b Bag
	ordered := 0
	for bagIndex := 0; bagIndex < 12; bagIndex++ {
		got := make([]PieceKind, 7)
		for i := range got {
			got[i] = b.Next(rng)
		}
		sorted := true
		for i := 1; i < 7; i++ {
			if got[i] < got[i-1] {
				sorted = false
			}
		}
		if sorted {
			ordered++
		}
	}
	if ordered > 1 {
		t.Fatalf("%d of 12 bags came out in kind order; shuffle is not happening", ordered)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run TestBag -v`
Expected: FAIL — `undefined: Bag`.

- [ ] **Step 3: Implement `bag.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag generator"
```

---

### Task 4: Rules — collision, spawn position, wall-kick rotation, ghost drop

**Files:**
- Create: `internal/game/rules.go`
- Test: `internal/game/rules_test.go`

**Interfaces:**
- Consumes: `Board`, `Piece`, `PieceKind`.
- Produces:
  - `const SpawnX = 3`, `SpawnY = 0`.
  - `func SpawnPiece(k PieceKind) Piece` → `Piece{Kind: k, Rotation: 0, X: SpawnX, Y: SpawnY}`.
  - `func Collides(b *Board, p Piece) bool` — true if any cell is `b.Occupied`.
  - `var KickOffsets = [8][2]int{{0, 0}, {-1, 0}, {1, 0}, {-2, 0}, {2, 0}, {0, -1}, {-1, -1}, {1, -1}}`.
  - `func Rotate(b *Board, p Piece, delta int) (Piece, bool)` — `delta` is `+1` (clockwise) or `-1`; tries `KickOffsets` in order, returns the first non-colliding piece and `true`, else `p, false`.
  - `func Drop(b *Board, p Piece) (Piece, int)` — the landing piece and the number of cells travelled (§10 ghost position, and the hard-drop distance).
  - `func Grounded(b *Board, p Piece) bool` — true when moving down one row collides.

- [ ] **Step 1: Write the failing test**

`internal/game/rules_test.go`:

```go
package game

import "testing"

func TestSpawnPositionIsCenteredInHiddenRows(t *testing.T) {
	for _, k := range AllKinds {
		p := SpawnPiece(k)
		if p.X != 3 || p.Y != 0 || p.Rotation != 0 {
			t.Fatalf("%s spawned at %+v", k, p)
		}
		var b Board
		if Collides(&b, p) {
			t.Fatalf("%s must spawn free on an empty board", k)
		}
		for _, c := range p.Cells() {
			if c[1] >= HiddenRows+2 {
				t.Errorf("%s spawn cell %v sits too far down the board", k, c)
			}
			if c[0] < 0 || c[0] >= Width {
				t.Errorf("%s spawn cell %v is off-board", k, c)
			}
		}
	}
}

func TestCollidesWithWallsFloorAndStack(t *testing.T) {
	var b Board
	if !Collides(&b, Piece{Kind: KindO, Rotation: 0, X: -2, Y: 5}) {
		t.Error("piece pushed through the left wall must collide")
	}
	if !Collides(&b, Piece{Kind: KindO, Rotation: 0, X: Width - 1, Y: 5}) {
		t.Error("piece pushed through the right wall must collide")
	}
	if !Collides(&b, Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 1}) {
		t.Error("piece pushed through the floor must collide")
	}
	b.Set(4, 10, CellFor(KindI))
	if !Collides(&b, Piece{Kind: KindO, Rotation: 0, X: 3, Y: 10}) {
		t.Error("piece overlapping a locked cell must collide")
	}
}

// Review focus 3: rotating with cells above the top of the board.
func TestRotationAboveBoardTopIsAllowed(t *testing.T) {
	var b Board
	p := Piece{Kind: KindI, Rotation: 0, X: 3, Y: -2}
	got, ok := Rotate(&b, p, 1)
	if !ok {
		t.Fatal("rotation with cells above the board must succeed, not fail")
	}
	if Collides(&b, got) {
		t.Fatal("resulting piece reported as colliding")
	}
}

func TestRotationKickOrderIsPinned(t *testing.T) {
	want := [8][2]int{{0, 0}, {-1, 0}, {1, 0}, {-2, 0}, {2, 0}, {0, -1}, {-1, -1}, {1, -1}}
	if KickOffsets != want {
		t.Fatalf("kick order changed: %v", KickOffsets)
	}
}

func TestRotationKicksOffTheLeftWall(t *testing.T) {
	var b Board
	// Vertical I hugging the left wall; rotating to horizontal needs a nudge right.
	p := Piece{Kind: KindI, Rotation: 3, X: -1, Y: 10}
	if Collides(&b, p) {
		t.Fatal("test setup: starting piece should be legal")
	}
	got, ok := Rotate(&b, p, 1)
	if !ok {
		t.Fatal("wall kick should have rescued this rotation")
	}
	if got.X <= p.X {
		t.Errorf("expected a kick to the right, got X=%d from %d", got.X, p.X)
	}
	if Collides(&b, got) {
		t.Fatal("kicked piece must be legal")
	}
}

func TestRotationFailsWhenFullyBoxedIn(t *testing.T) {
	var b Board
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			b.Set(x, y, CellFor(KindZ))
		}
	}
	for _, c := range (Piece{Kind: KindT, Rotation: 0, X: 3, Y: 10}).Cells() {
		b.Set(c[0], c[1], Empty)
	}
	p := Piece{Kind: KindT, Rotation: 0, X: 3, Y: 10}
	if got, ok := Rotate(&b, p, 1); ok {
		t.Fatalf("rotation should have failed, got %+v", got)
	} else if got != p {
		t.Fatal("failed rotation must return the piece unchanged")
	}
}

func TestRotateBothDirectionsWraps(t *testing.T) {
	var b Board
	p := Piece{Kind: KindT, Rotation: 0, X: 3, Y: 10}
	cw, _ := Rotate(&b, p, 1)
	if cw.Rotation != 1 {
		t.Errorf("cw: got rotation %d want 1", cw.Rotation)
	}
	ccw, _ := Rotate(&b, p, -1)
	if ccw.Rotation != 3 {
		t.Errorf("ccw: got rotation %d want 3", ccw.Rotation)
	}
}

func TestDropReturnsLandingAndDistance(t *testing.T) {
	var b Board
	p := SpawnPiece(KindO)
	landed, dist := Drop(&b, p)
	if !Grounded(&b, landed) {
		t.Error("landing position must be grounded")
	}
	if Collides(&b, landed) {
		t.Error("landing position must be legal")
	}
	if dist != landed.Y-p.Y || dist <= 0 {
		t.Errorf("distance %d inconsistent with %d -> %d", dist, p.Y, landed.Y)
	}
}

func TestDropOfAlreadyGroundedPieceTravelsZero(t *testing.T) {
	var b Board
	p := Piece{Kind: KindO, Rotation: 0, X: 4, Y: Height - 2}
	landed, dist := Drop(&b, p)
	if dist != 0 || landed != p {
		t.Fatalf("grounded piece moved: dist=%d %+v", dist, landed)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run 'TestSpawn|TestCollides|TestRotat|TestDrop|TestGrounded' -v`
Expected: FAIL — `undefined: SpawnPiece`.

- [ ] **Step 3: Implement `rules.go`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/rules.go internal/game/rules_test.go
git commit -m "feat(game): collision, wall-kick rotation, and drop rules"
```

---

### Task 5: Scoring, level, and the gravity curve

**Files:**
- Create: `internal/game/scoring.go`
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `func LineScore(lines, level int) int` — `0, 100, 300, 500, 800` × level for `0..4` lines; more than 4 lines is impossible but must return the 4-line value rather than panic.
  - `func ComboBonus(combo, level int) int` — `50 * (combo-1) * level`, `0` when `combo < 2`.
  - `func LevelFor(lines int) int` — `lines/10 + 1`.
  - `const BaseGravity = 800 * time.Millisecond`, `MinGravity = 60 * time.Millisecond`, `GravityDecay = 0.86`.
  - `func GravityInterval(level int) time.Duration` — `BaseGravity * 0.86^(level-1)`, floored at `MinGravity`; `level < 1` is treated as `1`.
  - `const SoftDropPoints = 1`, `HardDropPoints = 2`.

- [ ] **Step 1: Write the failing test**

`internal/game/scoring_test.go`:

```go
package game

import (
	"testing"
	"time"
)

func TestLineScoreTable(t *testing.T) {
	cases := []struct{ lines, level, want int }{
		{0, 1, 0}, {1, 1, 100}, {2, 1, 300}, {3, 1, 500}, {4, 1, 800},
		{1, 7, 700}, {4, 13, 10400}, {5, 2, 1600},
	}
	for _, c := range cases {
		if got := LineScore(c.lines, c.level); got != c.want {
			t.Errorf("LineScore(%d,%d) = %d want %d", c.lines, c.level, got, c.want)
		}
	}
}

func TestComboBonusStartsAtComboTwo(t *testing.T) {
	cases := []struct{ combo, level, want int }{
		{0, 5, 0}, {1, 5, 0}, {2, 1, 50}, {2, 4, 200}, {5, 3, 600},
	}
	for _, c := range cases {
		if got := ComboBonus(c.combo, c.level); got != c.want {
			t.Errorf("ComboBonus(%d,%d) = %d want %d", c.combo, c.level, got, c.want)
		}
	}
}

func TestLevelForLines(t *testing.T) {
	cases := []struct{ lines, want int }{{0, 1}, {9, 1}, {10, 2}, {19, 2}, {20, 3}, {127, 13}}
	for _, c := range cases {
		if got := LevelFor(c.lines); got != c.want {
			t.Errorf("LevelFor(%d) = %d want %d", c.lines, got, c.want)
		}
	}
}

func TestGravityIntervalCurveAndClamp(t *testing.T) {
	if got := GravityInterval(1); got != 800*time.Millisecond {
		t.Errorf("level 1: got %v want 800ms", got)
	}
	if got := GravityInterval(0); got != GravityInterval(1) {
		t.Errorf("level 0 must behave as level 1, got %v", got)
	}
	l2 := GravityInterval(2)
	if l2 < 686*time.Millisecond || l2 > 690*time.Millisecond {
		t.Errorf("level 2: got %v want ~688ms", l2)
	}
	prev := GravityInterval(1)
	for level := 2; level <= 40; level++ {
		cur := GravityInterval(level)
		if cur > prev {
			t.Fatalf("level %d interval %v grew from %v", level, cur, prev)
		}
		if cur < MinGravity {
			t.Fatalf("level %d interval %v fell below the %v floor", level, cur, MinGravity)
		}
		prev = cur
	}
	if GravityInterval(99) != MinGravity {
		t.Errorf("very high level should sit exactly on the floor, got %v", GravityInterval(99))
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run 'TestLine|TestCombo|TestLevel|TestGravity' -v`
Expected: FAIL — `undefined: LineScore`.

- [ ] **Step 3: Implement `scoring.go`**

Use `math.Pow(GravityDecay, float64(level-1))` and truncate to a `time.Duration`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/scoring.go internal/game/scoring_test.go
git commit -m "feat(game): scoring table, combo bonus, and gravity curve"
```

---

### Task 6: Event vocabulary

**Files:**
- Create: `internal/game/events.go`
- Test: `internal/game/events_test.go`

**Interfaces:**
- Consumes: `Piece`.
- Produces:
  - `type EventKind int` with constants in this order: `PieceSpawned, PieceMoved, PieceRotated, PieceSoftDropped, PieceHardDropped, PieceLocked, HoldUsed, LinesCleared, ComboChanged, LevelChanged, GameOver`.
  - `func (k EventKind) String() string` — the constant's name, e.g. `"LinesCleared"`.
  - ```go
    type Event struct {
        Kind     EventKind
        Piece    Piece     // the piece involved, where one is
        Cells    [4][2]int // absolute cells of Piece at the moment of the event
        Rows     []int     // LinesCleared: rows cleared, ascending
        RowCells [][]Cell  // LinesCleared: each cleared row's contents before collapse,
                           // in the same order as Rows. The line-clear animation
                           // (Plan 04) needs the row that gameplay has already deleted.
        Distance int       // PieceHardDropped / PieceSoftDropped: cells travelled
        Combo    int       // ComboChanged: new value
        Level    int       // LevelChanged: new value
        Points   int       // score delta attributable to this event
        Score    int       // running total after this event; Plan 05's score-rollover line reads it
        Board    *Board    // GameOver only: the final board, so the collapse animation
                           // (Plan 05) can snapshot it. Read-only for consumers.
    }
    ```

  - Two rules every emitter in Tasks 7–12 follows: an event with a non-zero `Points` sets `Score` to `g.Score` **after** that event's points have been applied, and the `GameOver` event sets `Board` to `&g.Board`.

This file is a deliberate addition to §33's file list: `game.Event` is referenced by §36, and giving it its own file keeps `game.go` readable. `internal/fx/events.go` (Plan 03) is the consumer side, not a duplicate.

- [ ] **Step 1: Write the failing test**

`internal/game/events_test.go`:

```go
package game

import "testing"

func TestEventKindNames(t *testing.T) {
	want := map[EventKind]string{
		PieceSpawned: "PieceSpawned", PieceMoved: "PieceMoved", PieceRotated: "PieceRotated",
		PieceSoftDropped: "PieceSoftDropped", PieceHardDropped: "PieceHardDropped",
		PieceLocked: "PieceLocked", HoldUsed: "HoldUsed", LinesCleared: "LinesCleared",
		ComboChanged: "ComboChanged", LevelChanged: "LevelChanged", GameOver: "GameOver",
	}
	for k, name := range want {
		if got := k.String(); got != name {
			t.Errorf("kind %d: got %q want %q", int(k), got, name)
		}
	}
	if len(want) != 11 {
		t.Fatal("event vocabulary size changed; update the FX handlers too")
	}
}
```

- [ ] **Step 1b: Add the two consumer-facing field tests**

Append to `internal/game/events_test.go`:

```go
func TestEveryScoringEventCarriesTheRunningTotal(t *testing.T) {
	g := New(77)
	g.Start()
	for i := 0; i < 12; i++ {
		for _, e := range g.HardDrop() {
			if e.Points != 0 && e.Score != g.Score {
				t.Fatalf("%v reported Score=%d but the game is at %d", e.Kind, e.Score, g.Score)
			}
		}
		if g.Over {
			break
		}
	}
}

func TestGameOverCarriesTheFinalBoard(t *testing.T) {
	g := New(78)
	g.Start()
	fillBoardToTheTop(g)
	for _, c := range g.Active.Cells() {
		g.Board.Set(c[0], c[1], Empty)
	}
	e := has(g.HardDrop(), GameOver)
	if e == nil {
		t.Fatal("no GameOver event")
	}
	if e.Board == nil {
		t.Fatal("GameOver must carry the final board so the collapse can animate it")
	}
	if e.Board.Fingerprint() != g.Board.Fingerprint() {
		t.Error("the GameOver board is not the game's board")
	}
}
```

`fillBoardToTheTop`, `has` and `kinds` come from Tasks 8 and 11 — if you are executing tasks in order, write these two tests in Task 11's file instead and leave `events_test.go` with the vocabulary test alone.

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run TestEventKind -v`
Expected: FAIL — `undefined: PieceSpawned`.

- [ ] **Step 3: Implement `events.go`**

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/game/ -run TestEventKind -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/events.go internal/game/events_test.go
git commit -m "feat(game): event vocabulary"
```

---

### Task 7: Game construction, next queue, and horizontal movement

**Files:**
- Create: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–6.
- Produces:
  - ```go
    type Game struct {
        Board   Board
        Active  Piece
        Hold    *PieceKind
        CanHold bool

        Next []PieceKind
        Bag  Bag

        Score, Lines, Level, Combo int

        GravityAccumulator time.Duration
        LockAccumulator    time.Duration
        LockResets         int
        Grounded           bool
        Over               bool

        Seed int64
        rng  *rand.Rand
    }
    ```
  - `const NextCount = 5`, `const LockDelay = 500 * time.Millisecond`, `const MaxLockResets = 15`.
  - `func New(seed int64) *Game` — level 1, combo 0, `CanHold` true, `Next` holding `NextCount` kinds, `Active` spawned from the bag, emits nothing (the caller gets the first `PieceSpawned` from `Advance`/`Start`). Provide `func (g *Game) Start() []Event` returning the initial `PieceSpawned` event.
  - `func (g *Game) MoveLeft() []Event`, `func (g *Game) MoveRight() []Event` — move one column if legal, emit `PieceMoved`, reset the lock timer per Task 8's rule; return `nil` when the move is illegal or the game is over.
  - `func (g *Game) RotateCW() []Event`, `func (g *Game) RotateCCW() []Event` — emit `PieceRotated` on success, `nil` on failure.
  - `func (g *Game) Ghost() Piece` — the landing position of `Active` (§10).

- [ ] **Step 1: Write the failing test**

Append to `internal/game/game_test.go`:

```go
package game

import (
	"testing"
	"time"
)

func TestNewGameInitialState(t *testing.T) {
	g := New(99)
	if g.Level != 1 || g.Score != 0 || g.Lines != 0 || g.Combo != 0 {
		t.Errorf("bad initial counters: %+v", struct{ S, L, Ln, C int }{g.Score, g.Level, g.Lines, g.Combo})
	}
	if len(g.Next) != NextCount {
		t.Errorf("next queue has %d entries want %d", len(g.Next), NextCount)
	}
	if !g.CanHold || g.Hold != nil {
		t.Error("hold should start empty and available")
	}
	if g.Over {
		t.Error("new game must not be over")
	}
	if g.Seed != 99 {
		t.Errorf("seed not recorded: %d", g.Seed)
	}
	if Collides(&g.Board, g.Active) {
		t.Error("first piece must spawn legally")
	}
}

func TestStartEmitsPieceSpawned(t *testing.T) {
	g := New(1)
	evs := g.Start()
	if len(evs) != 1 || evs[0].Kind != PieceSpawned {
		t.Fatalf("got %v", evs)
	}
	if evs[0].Piece != g.Active {
		t.Error("event should carry the active piece")
	}
}

func TestNextQueueRefillsAndStaysFive(t *testing.T) {
	g := New(7)
	g.Start()
	for i := 0; i < 30; i++ {
		g.HardDrop()
		if len(g.Next) != NextCount {
			t.Fatalf("after drop %d the queue is %d long", i, len(g.Next))
		}
		if g.Over {
			break
		}
	}
}

func TestSeededGamesAgreeOnPieceOrder(t *testing.T) {
	order := func() []PieceKind {
		g := New(8675309)
		g.Start()
		out := []PieceKind{g.Active.Kind}
		out = append(out, g.Next...)
		return out
	}
	a, b := order(), order()
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("piece %d differs: %s vs %s", i, a[i], b[i])
		}
	}
}

func TestMoveLeftRightWithinWalls(t *testing.T) {
	g := New(3)
	g.Start()
	startX := g.Active.X
	if evs := g.MoveLeft(); len(evs) != 1 || evs[0].Kind != PieceMoved {
		t.Fatalf("expected PieceMoved, got %v", evs)
	}
	if g.Active.X != startX-1 {
		t.Errorf("X = %d want %d", g.Active.X, startX-1)
	}
	g.MoveRight()
	if g.Active.X != startX {
		t.Errorf("X = %d want %d after moving back", g.Active.X, startX)
	}
	for i := 0; i < 20; i++ {
		g.MoveLeft()
	}
	before := g.Active
	if evs := g.MoveLeft(); evs != nil {
		t.Error("blocked move must emit nothing")
	}
	if g.Active != before {
		t.Error("blocked move must not change the piece")
	}
}

func TestRotateEmitsEventOnlyOnSuccess(t *testing.T) {
	g := New(4)
	g.Start()
	g.Active = Piece{Kind: KindT, Rotation: 0, X: 3, Y: 10}
	if evs := g.RotateCW(); len(evs) != 1 || evs[0].Kind != PieceRotated {
		t.Fatalf("got %v", evs)
	}
	if g.Active.Rotation != 1 {
		t.Errorf("rotation = %d want 1", g.Active.Rotation)
	}
	if evs := g.RotateCCW(); len(evs) != 1 {
		t.Fatalf("ccw failed: %v", evs)
	}
	if g.Active.Rotation != 0 {
		t.Errorf("rotation = %d want 0", g.Active.Rotation)
	}
}

func TestGhostIsGroundedBelowActive(t *testing.T) {
	g := New(5)
	g.Start()
	ghost := g.Ghost()
	if ghost.Kind != g.Active.Kind || ghost.Rotation != g.Active.Rotation || ghost.X != g.Active.X {
		t.Errorf("ghost must share kind/rotation/column: %+v vs %+v", ghost, g.Active)
	}
	if ghost.Y < g.Active.Y {
		t.Error("ghost must not float above the active piece")
	}
	if !Grounded(&g.Board, ghost) {
		t.Error("ghost must be grounded")
	}
}

var _ = time.Millisecond // keep the import while later tasks add timing tests
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run 'TestNewGame|TestStart|TestNextQueue|TestSeededGames|TestMove|TestRotateEmits|TestGhost' -v`
Expected: FAIL — `undefined: New`.

- [ ] **Step 3: Implement `game.go` (construction, queue, movement, ghost)**

`HardDrop` and `Advance` are referenced by these tests only through Task 8/9; add temporary method stubs if the build needs them, and delete the stubs in those tasks. Keep an unexported helper `func (g *Game) resetLockTimer()` — Task 8 fills in its reset-counting rule.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game construction, next queue, movement, ghost"
```

---

### Task 8: `Advance(dt)` — gravity, lock delay, and the lock pipeline

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/advance_test.go`

**Interfaces:**
- Consumes: Task 7's `Game`.
- Produces:
  - `func (g *Game) Advance(dt time.Duration) []Event` — the only clock-facing entry point (§49.2).
  - `func (g *Game) lockActive() []Event` — commit → detect → clear → score → events → spawn (§12), in that order.

Pinned semantics:
- `dt <= 0` returns `nil` and changes nothing.
- Gravity: add `dt` to `GravityAccumulator`; while `GravityAccumulator >= GravityInterval(g.Level)`, subtract one interval and try to step the piece down one row. A successful step emits `PieceMoved`, zeroes `LockAccumulator`, and zeroes `LockResets`. A blocked step stops the gravity loop for this call, leaves the remaining accumulator alone, and switches to lock accumulation.
- Locking: when the piece is grounded, add `dt` to `LockAccumulator`; at `>= LockDelay` it locks. A successful move or rotation while grounded calls `resetLockTimer()`, which zeroes `LockAccumulator` and increments `LockResets`; once `LockResets >= MaxLockResets` the timer stops being reset (the piece locks regardless).
- Lock pipeline emits, in order: `PieceLocked` (with cells) → `LinesCleared` (only when rows > 0, carrying rows and points) → `ComboChanged` (only when the value changed) → `LevelChanged` (only when the value changed) → `PieceSpawned`, or `GameOver` instead of `PieceSpawned` when the new piece collides at spawn.
- Line points: `LineScore(len(rows), levelBeforeTheClear) + ComboBonus(newCombo, levelBeforeTheClear)`. Level rises after scoring, so a clear is paid at the level it was earned on.
- `LinesCleared.RowCells` is copied out of the board **before** `ClearRows` runs — one freshly allocated `[]Cell` of length `Width` per cleared row, in the same order as `Rows`. Plan 04's supernova animation needs the row after gameplay has already deleted it.

- [ ] **Step 1: Write the failing test**

`internal/game/advance_test.go`:

```go
package game

import (
	"testing"
	"time"
)

func kinds(evs []Event) []EventKind {
	out := make([]EventKind, len(evs))
	for i, e := range evs {
		out[i] = e.Kind
	}
	return out
}

func has(evs []Event, k EventKind) *Event {
	for i := range evs {
		if evs[i].Kind == k {
			return &evs[i]
		}
	}
	return nil
}

func TestGravityStepsOncePerInterval(t *testing.T) {
	g := New(11)
	g.Start()
	y := g.Active.Y
	if evs := g.Advance(799 * time.Millisecond); evs != nil {
		t.Fatalf("piece moved early: %v", kinds(evs))
	}
	evs := g.Advance(2 * time.Millisecond)
	if h := has(evs, PieceMoved); h == nil {
		t.Fatalf("expected PieceMoved at 801ms, got %v", kinds(evs))
	}
	if g.Active.Y != y+1 {
		t.Errorf("Y = %d want %d", g.Active.Y, y+1)
	}
}

// Review focus 1: one enormous dt after the terminal was backgrounded.
func TestHugeDtLandsThePieceWithoutEscapingTheBoard(t *testing.T) {
	g := New(12)
	g.Start()
	evs := g.Advance(5 * time.Second)
	for _, c := range g.Active.Cells() {
		if c[1] >= Height || Collides(&g.Board, g.Active) {
			t.Fatalf("piece escaped the board: cell %v of %+v", c, g.Active)
		}
	}
	if !Grounded(&g.Board, g.Active) && has(evs, PieceLocked) == nil {
		t.Fatalf("5s of gravity should have grounded or locked the piece, events: %v", kinds(evs))
	}
	if g.Active.Y > Height {
		t.Fatal("piece fell past the floor")
	}
}

// Review focus 2: zero and negative dt.
func TestNonPositiveDtIsInert(t *testing.T) {
	g := New(13)
	g.Start()
	before := *g
	for _, dt := range []time.Duration{0, -time.Millisecond, -time.Hour} {
		if evs := g.Advance(dt); evs != nil {
			t.Errorf("dt=%v produced events %v", dt, kinds(evs))
		}
	}
	if g.Active != before.Active || g.GravityAccumulator != before.GravityAccumulator ||
		g.LockAccumulator != before.LockAccumulator || g.Score != before.Score {
		t.Error("non-positive dt mutated state")
	}
}

func TestLockDelayIsFiveHundredMilliseconds(t *testing.T) {
	g := New(14)
	g.Start()
	g.Active, _ = Drop(&g.Board, g.Active) // grounded
	if evs := g.Advance(499 * time.Millisecond); has(evs, PieceLocked) != nil {
		t.Fatal("locked before the delay elapsed")
	}
	evs := g.Advance(2 * time.Millisecond)
	if has(evs, PieceLocked) == nil {
		t.Fatalf("expected a lock at 501ms, got %v", kinds(evs))
	}
	if has(evs, PieceSpawned) == nil {
		t.Fatal("lock must be followed by a spawn")
	}
}

func TestMovementWhileGroundedResetsTheLockTimer(t *testing.T) {
	g := New(15)
	g.Start()
	g.Active, _ = Drop(&g.Board, g.Active)
	g.Advance(400 * time.Millisecond)
	g.MoveLeft()
	if g.LockAccumulator != 0 {
		t.Errorf("lock accumulator = %v want 0 after a grounded move", g.LockAccumulator)
	}
	if g.LockResets != 1 {
		t.Errorf("lock resets = %d want 1", g.LockResets)
	}
	if evs := g.Advance(400 * time.Millisecond); has(evs, PieceLocked) != nil {
		t.Fatal("the reset should have bought another 500ms")
	}
}

func TestLockResetsAreCappedAtFifteen(t *testing.T) {
	g := New(16)
	g.Start()
	g.Active, _ = Drop(&g.Board, g.Active)
	for i := 0; i < 40; i++ {
		g.Advance(100 * time.Millisecond)
		g.MoveLeft()
		g.MoveRight()
	}
	if g.LockResets > MaxLockResets {
		t.Fatalf("lock resets reached %d, cap is %d", g.LockResets, MaxLockResets)
	}
	// With the cap reached, continued shuffling can no longer prevent a lock.
	g2 := New(16)
	g2.Start()
	g2.Active, _ = Drop(&g2.Board, g2.Active)
	locked := false
	for i := 0; i < 200 && !locked; i++ {
		if has(g2.Advance(100*time.Millisecond), PieceLocked) != nil {
			locked = true
		}
		g2.MoveLeft()
		g2.MoveRight()
	}
	if !locked {
		t.Fatal("infinite stalling was possible")
	}
}

func TestLockPipelineOrderOnALineClear(t *testing.T) {
	g := New(17)
	g.Start()
	// Fill row 21 except the two columns the O piece will occupy.
	for x := 0; x < Width; x++ {
		if x != 4 && x != 5 {
			g.Board.Set(x, 21, CellFor(KindI))
		}
	}
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 3, Y: 19} // cells at x=4,5 y=19,20
	evs := g.Advance(600 * time.Millisecond)                // grounded already? force the lock
	for i := 0; i < 5 && has(evs, PieceLocked) == nil; i++ {
		evs = append(evs, g.Advance(600*time.Millisecond)...)
	}
	got := kinds(evs)
	lockAt, clearAt, spawnAt := -1, -1, -1
	for i, k := range got {
		switch k {
		case PieceLocked:
			lockAt = i
		case LinesCleared:
			clearAt = i
		case PieceSpawned:
			spawnAt = i
		}
	}
	if lockAt < 0 || clearAt < 0 || spawnAt < 0 {
		t.Fatalf("missing events in %v", got)
	}
	if !(lockAt < clearAt && clearAt < spawnAt) {
		t.Fatalf("wrong order %v; want PieceLocked < LinesCleared < PieceSpawned", got)
	}
	if g.Lines != 1 {
		t.Errorf("lines = %d want 1", g.Lines)
	}
	if g.Score != 100 {
		t.Errorf("score = %d want 100 (single at level 1, no combo bonus)", g.Score)
	}
	if e := has(evs, LinesCleared); len(e.Rows) != 1 || e.Rows[0] != 21 {
		t.Errorf("cleared rows = %v want [21]", e.Rows)
	}
}

func TestLinesClearedCarriesThePreCollapseRowContents(t *testing.T) {
	g := New(19)
	g.Start()
	for x := 0; x < Width; x++ {
		if x != 4 && x != 5 {
			g.Board.Set(x, 21, CellFor(KindI))
		}
	}
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 3, Y: 0}
	evs := g.HardDrop()
	e := has(evs, LinesCleared)
	if e == nil {
		t.Fatalf("no clear in %v", kinds(evs))
	}
	if len(e.RowCells) != len(e.Rows) {
		t.Fatalf("RowCells has %d rows, Rows has %d", len(e.RowCells), len(e.Rows))
	}
	row := e.RowCells[0]
	if len(row) != Width {
		t.Fatalf("snapshot row is %d wide want %d", len(row), Width)
	}
	for x, c := range row {
		if c == Empty {
			t.Errorf("snapshot column %d is empty; the row was complete when it cleared", x)
		}
	}
	if row[4] != CellFor(KindO) || row[0] != CellFor(KindI) {
		t.Errorf("snapshot lost cell identity: %v", row)
	}
}

func TestGravityIntervalFollowsLevel(t *testing.T) {
	g := New(18)
	g.Start()
	g.Level = 5
	want := GravityInterval(5)
	y := g.Active.Y
	g.Advance(want - time.Millisecond)
	if g.Active.Y != y {
		t.Fatal("moved before the level-5 interval elapsed")
	}
	g.Advance(2 * time.Millisecond)
	if g.Active.Y != y+1 {
		t.Fatalf("Y = %d want %d at level 5", g.Active.Y, y+1)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestGravity|TestHugeDt|TestNonPositiveDt|TestLock' -v`
Expected: FAIL — `Advance` not implemented (or the stub returns nil).

- [ ] **Step 3: Implement `Advance` and `lockActive` in `game.go`**

Guard the gravity loop with a bounded iteration count so a pathological `dt` cannot spin: the loop naturally ends when the piece grounds, and lock accumulation takes over.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/advance_test.go
git commit -m "feat(game): Advance(dt) with gravity, lock delay, and lock pipeline"
```

---

### Task 9: Soft drop, hard drop, and drop scoring

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/drop_test.go`

**Interfaces:**
- Consumes: Task 8's lock pipeline.
- Produces:
  - `func (g *Game) SoftDrop() []Event` — one row down if legal: `+SoftDropPoints`, zeroes `GravityAccumulator`, emits `PieceSoftDropped{Distance: 1, Points: 1}`. When blocked, emits nothing and does not score.
  - `func (g *Game) HardDrop() []Event` — teleports to `Drop()`'s landing position, scores `HardDropPoints × distance`, emits `PieceHardDropped{Distance, Points, Cells}` and then locks immediately (no lock delay), so the returned slice continues with the Task 8 lock pipeline.

- [ ] **Step 1: Write the failing test**

`internal/game/drop_test.go`:

```go
package game

import "testing"

func TestSoftDropScoresOnePointPerCell(t *testing.T) {
	g := New(21)
	g.Start()
	y := g.Active.Y
	evs := g.SoftDrop()
	if h := has(evs, PieceSoftDropped); h == nil || h.Distance != 1 || h.Points != 1 {
		t.Fatalf("got %v", evs)
	}
	if g.Active.Y != y+1 || g.Score != 1 {
		t.Errorf("Y=%d score=%d want %d and 1", g.Active.Y, g.Score, y+1)
	}
	if g.GravityAccumulator != 0 {
		t.Error("soft drop should restart the gravity interval")
	}
}

func TestSoftDropOnTheFloorScoresNothing(t *testing.T) {
	g := New(22)
	g.Start()
	g.Active, _ = Drop(&g.Board, g.Active)
	before := g.Score
	if evs := g.SoftDrop(); evs != nil {
		t.Errorf("blocked soft drop emitted %v", kinds(evs))
	}
	if g.Score != before {
		t.Errorf("score changed from %d to %d", before, g.Score)
	}
}

func TestHardDropScoresTwoPerCellAndLocksImmediately(t *testing.T) {
	g := New(23)
	g.Start()
	landing, dist := Drop(&g.Board, g.Active)
	evs := g.HardDrop()
	h := has(evs, PieceHardDropped)
	if h == nil {
		t.Fatalf("no PieceHardDropped in %v", kinds(evs))
	}
	if h.Distance != dist || h.Points != 2*dist {
		t.Errorf("distance=%d points=%d want %d and %d", h.Distance, h.Points, dist, 2*dist)
	}
	if g.Score != 2*dist {
		t.Errorf("score = %d want %d", g.Score, 2*dist)
	}
	if has(evs, PieceLocked) == nil {
		t.Fatal("hard drop must lock without waiting for the lock delay")
	}
	if has(evs, PieceSpawned) == nil {
		t.Fatal("hard drop must be followed by a spawn")
	}
	for _, c := range landing.Cells() {
		if c[1] >= 0 && g.Board.At(c[0], c[1]) == Empty {
			t.Errorf("landing cell %v was not committed to the board", c)
		}
	}
}

// Review focus 3 support: hard-dropping a piece that is already resting.
func TestHardDropOfAGroundedPieceScoresZeroAndStillLocks(t *testing.T) {
	g := New(24)
	g.Start()
	g.Active, _ = Drop(&g.Board, g.Active)
	evs := g.HardDrop()
	if h := has(evs, PieceHardDropped); h == nil || h.Distance != 0 || h.Points != 0 {
		t.Fatalf("got %v", evs)
	}
	if g.Score != 0 {
		t.Errorf("score = %d want 0", g.Score)
	}
	if has(evs, PieceLocked) == nil {
		t.Fatal("must still lock")
	}
}

func TestHardDropOrderIsDropThenLock(t *testing.T) {
	g := New(25)
	g.Start()
	got := kinds(g.HardDrop())
	if len(got) < 3 || got[0] != PieceHardDropped {
		t.Fatalf("first event should be PieceHardDropped, got %v", got)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestSoftDrop|TestHardDrop' -v`
Expected: FAIL — `undefined: (*Game).SoftDrop`.

- [ ] **Step 3: Implement `SoftDrop` and `HardDrop`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/drop_test.go
git commit -m "feat(game): soft drop and hard drop with scoring"
```

---

### Task 10: Hold

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/hold_test.go`

**Interfaces:**
- Consumes: Task 7's `Game`, Task 8's spawn path.
- Produces:
  - `func (g *Game) HoldPiece() []Event` — §9 rules: swaps `Active` with `Hold`; when `Hold` is empty, stores the active kind and spawns the next piece; allowed **once** before the active piece locks; the piece coming out of hold returns to spawn rotation and spawn position. Emits `HoldUsed` (carrying the outgoing piece) followed by `PieceSpawned`. Returns `nil` when `CanHold` is false or the game is over.
  - `CanHold` is set back to `true` by the lock pipeline (Task 8).

- [ ] **Step 1: Write the failing test**

`internal/game/hold_test.go`:

```go
package game

import "testing"

func TestFirstHoldStoresActiveAndSpawnsNext(t *testing.T) {
	g := New(31)
	g.Start()
	active := g.Active.Kind
	upNext := g.Next[0]
	evs := g.HoldPiece()
	if has(evs, HoldUsed) == nil || has(evs, PieceSpawned) == nil {
		t.Fatalf("got %v", kinds(evs))
	}
	if g.Hold == nil || *g.Hold != active {
		t.Errorf("hold = %v want %s", g.Hold, active)
	}
	if g.Active.Kind != upNext {
		t.Errorf("active = %s want %s", g.Active.Kind, upNext)
	}
	if len(g.Next) != NextCount {
		t.Errorf("queue length %d want %d", len(g.Next), NextCount)
	}
	if g.CanHold {
		t.Error("hold must be spent")
	}
}

func TestSecondHoldBeforeLockIsBlocked(t *testing.T) {
	g := New(32)
	g.Start()
	g.HoldPiece()
	before := g.Active
	if evs := g.HoldPiece(); evs != nil {
		t.Errorf("second hold emitted %v", kinds(evs))
	}
	if g.Active != before {
		t.Error("blocked hold changed the active piece")
	}
}

func TestHoldSwapsAndResetsRotationAndPosition(t *testing.T) {
	g := New(33)
	g.Start()
	g.HoldPiece()
	g.HardDrop() // restores CanHold
	stored := *g.Hold
	g.RotateCW()
	g.MoveLeft()
	g.SoftDrop()
	activeBefore := g.Active.Kind
	g.HoldPiece()
	if *g.Hold != activeBefore {
		t.Errorf("hold = %s want %s", *g.Hold, activeBefore)
	}
	if g.Active.Kind != stored {
		t.Errorf("active = %s want the previously held %s", g.Active.Kind, stored)
	}
	if want := SpawnPiece(stored); g.Active != want {
		t.Errorf("piece out of hold = %+v want spawn state %+v", g.Active, want)
	}
}

func TestHoldIsRestoredAfterLock(t *testing.T) {
	g := New(34)
	g.Start()
	g.HoldPiece()
	if g.CanHold {
		t.Fatal("setup: hold should be spent")
	}
	g.HardDrop()
	if !g.CanHold {
		t.Error("locking must restore the hold")
	}
}

func TestHoldQueueDoesNotLosePieces(t *testing.T) {
	g := New(35)
	g.Start()
	seen := map[PieceKind]int{}
	seen[g.Active.Kind]++
	for i := 0; i < 14 && !g.Over; i++ {
		g.HoldPiece()
		g.HardDrop()
		seen[g.Active.Kind]++
	}
	if len(seen) < 5 {
		t.Errorf("hold/drop cycling produced only %d distinct kinds: %v", len(seen), seen)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run TestHold -v`
Expected: FAIL — `undefined: (*Game).HoldPiece`.

- [ ] **Step 3: Implement `HoldPiece`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/hold_test.go
git commit -m "feat(game): hold with single-use-per-piece rule"
```

---

### Task 11: Game over and restart

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/gameover_test.go`

**Interfaces:**
- Consumes: Task 8's spawn path.
- Produces:
  - `Over bool` becomes `true` when a freshly spawned piece collides; the spawn emits `GameOver` instead of `PieceSpawned`.
  - Every input method (`MoveLeft/MoveRight/RotateCW/RotateCCW/SoftDrop/HardDrop/HoldPiece`) and `Advance` return `nil` and mutate nothing once `Over` is true.
  - `func (g *Game) Restart()` — resets the game in place from `g.Seed` (used by `r`; the app layer calls `Start()` afterwards).

- [ ] **Step 1: Write the failing test**

`internal/game/gameover_test.go`:

```go
package game

import (
	"testing"
	"time"
)

func fillBoardToTheTop(g *Game) {
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			g.Board.Set(x, y, CellFor(KindZ))
		}
	}
}

func TestBlockedSpawnEndsTheGame(t *testing.T) {
	g := New(41)
	g.Start()
	fillBoardToTheTop(g)
	// Carve out just enough room for the active piece to fall and lock.
	for _, c := range g.Active.Cells() {
		g.Board.Set(c[0], c[1], Empty)
	}
	evs := g.HardDrop()
	if has(evs, GameOver) == nil {
		t.Fatalf("expected GameOver, got %v", kinds(evs))
	}
	if has(evs, PieceSpawned) != nil {
		t.Error("a game-ending spawn must not also report PieceSpawned")
	}
	if !g.Over {
		t.Error("Over flag not set")
	}
}

// Review focus 5: input after game over.
func TestInputAfterGameOverIsInert(t *testing.T) {
	g := New(42)
	g.Start()
	fillBoardToTheTop(g)
	for _, c := range g.Active.Cells() {
		g.Board.Set(c[0], c[1], Empty)
	}
	g.HardDrop()
	if !g.Over {
		t.Fatal("setup: game should be over")
	}
	snapshot := *g
	fns := map[string]func() []Event{
		"MoveLeft": g.MoveLeft, "MoveRight": g.MoveRight,
		"RotateCW": g.RotateCW, "RotateCCW": g.RotateCCW,
		"SoftDrop": g.SoftDrop, "HardDrop": g.HardDrop, "HoldPiece": g.HoldPiece,
	}
	for name, fn := range fns {
		if evs := fn(); evs != nil {
			t.Errorf("%s after game over emitted %v", name, kinds(evs))
		}
	}
	if evs := g.Advance(2 * time.Second); evs != nil {
		t.Errorf("Advance after game over emitted %v", kinds(evs))
	}
	if g.Score != snapshot.Score || g.Active != snapshot.Active ||
		g.Board.Fingerprint() != snapshot.Board.Fingerprint() {
		t.Error("state changed after game over")
	}
}

func TestRestartResetsEverythingFromTheSameSeed(t *testing.T) {
	g := New(43)
	g.Start()
	for i := 0; i < 6; i++ {
		g.HardDrop()
	}
	g.Restart()
	fresh := New(43)
	fresh.Start()
	g.Start()
	if g.Score != 0 || g.Lines != 0 || g.Level != 1 || g.Combo != 0 || g.Over {
		t.Errorf("counters not reset: %+v", struct{ S, L, Ln, C int }{g.Score, g.Level, g.Lines, g.Combo})
	}
	if g.Board.Fingerprint() != fresh.Board.Fingerprint() {
		t.Error("board not cleared")
	}
	if g.Active.Kind != fresh.Active.Kind {
		t.Errorf("restart drew %s, a fresh game with the same seed drew %s", g.Active.Kind, fresh.Active.Kind)
	}
	if g.Hold != nil || !g.CanHold {
		t.Error("hold not reset")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestBlockedSpawn|TestInputAfterGameOver|TestRestart' -v`
Expected: FAIL — no `GameOver` emitted / `undefined: (*Game).Restart`.

- [ ] **Step 3: Implement the game-over guard and `Restart`**

Add a single `if g.Over { return nil }` guard at the top of every input method and `Advance`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/gameover_test.go
git commit -m "feat(game): game over on blocked spawn, inert input, restart"
```

---

### Task 12: Combo and level progression across placements

**Files:**
- Modify: `internal/game/game.go` (only if the tests expose a gap)
- Test: `internal/game/progression_test.go`

**Interfaces:**
- Consumes: Tasks 8, 9. Produces no new API — this task pins §13/§49.1 behaviour across a sequence of placements, which single-lock tests cannot express.

- [ ] **Step 1: Write the failing test**

`internal/game/progression_test.go`:

```go
package game

import "testing"

// clearOneRow fills row `y` except columns 4 and 5, then hard-drops an O piece
// into the gap. Returns the events from the placement.
func clearOneRow(t *testing.T, g *Game, y int) []Event {
	t.Helper()
	for x := 0; x < Width; x++ {
		if x != 4 && x != 5 {
			g.Board.Set(x, y, CellFor(KindI))
		}
	}
	g.Active = Piece{Kind: KindO, Rotation: 0, X: 3, Y: 0}
	return g.HardDrop()
}

func TestComboStartsAtOneOnTheFirstClear(t *testing.T) {
	g := New(51)
	g.Start()
	evs := clearOneRow(t, g, 21)
	if g.Combo != 1 {
		t.Errorf("combo = %d want 1", g.Combo)
	}
	if e := has(evs, ComboChanged); e == nil || e.Combo != 1 {
		t.Errorf("expected ComboChanged{1}, got %v", evs)
	}
	// Bonus is 50 x (combo-1) x level = 0 at combo 1.
	if e := has(evs, LinesCleared); e.Points != 100 {
		t.Errorf("points = %d want 100 with no combo bonus", e.Points)
	}
}

func TestSecondConsecutiveClearAddsComboBonus(t *testing.T) {
	g := New(52)
	g.Start()
	clearOneRow(t, g, 21)
	scoreAfterFirst := g.Score
	evs := clearOneRow(t, g, 21)
	if g.Combo != 2 {
		t.Errorf("combo = %d want 2", g.Combo)
	}
	// single (100 x level 1) + bonus (50 x 1 x 1) = 150
	if got := g.Score - scoreAfterFirst; got < 150 {
		t.Errorf("second clear added %d, want at least 150 (100 + 50 combo bonus)", got)
	}
	if e := has(evs, ComboChanged); e == nil || e.Combo != 2 {
		t.Errorf("expected ComboChanged{2}, got %v", evs)
	}
}

func TestPlacementWithoutAClearResetsCombo(t *testing.T) {
	g := New(53)
	g.Start()
	clearOneRow(t, g, 21)
	if g.Combo != 1 {
		t.Fatal("setup")
	}
	g.Active = SpawnPiece(KindO)
	evs := g.HardDrop() // lands on empty floor, clears nothing
	if g.Combo != 0 {
		t.Errorf("combo = %d want 0", g.Combo)
	}
	if e := has(evs, ComboChanged); e == nil || e.Combo != 0 {
		t.Errorf("expected ComboChanged{0}, got %v", kinds(evs))
	}
	if has(evs, LinesCleared) != nil {
		t.Error("no rows were complete")
	}
}

func TestNoComboEventWhenTheValueDoesNotChange(t *testing.T) {
	g := New(54)
	g.Start()
	g.Active = SpawnPiece(KindO)
	g.HardDrop()
	g.Active = SpawnPiece(KindO)
	evs := g.HardDrop() // combo was already 0
	if has(evs, ComboChanged) != nil {
		t.Errorf("combo stayed 0 but ComboChanged was emitted: %v", kinds(evs))
	}
}

func TestLevelRisesEveryTenLines(t *testing.T) {
	g := New(55)
	g.Start()
	sawLevelChange := false
	for i := 0; i < 10; i++ {
		evs := clearOneRow(t, g, 21)
		if has(evs, LevelChanged) != nil {
			sawLevelChange = true
			if e := has(evs, LevelChanged); e.Level != 2 {
				t.Errorf("LevelChanged carried level %d want 2", e.Level)
			}
			if i != 9 {
				t.Errorf("level changed after %d lines, want 10", i+1)
			}
		}
		if g.Over {
			t.Fatalf("game ended early at clear %d", i)
		}
	}
	if g.Lines != 10 {
		t.Fatalf("lines = %d want 10", g.Lines)
	}
	if g.Level != 2 {
		t.Errorf("level = %d want 2", g.Level)
	}
	if !sawLevelChange {
		t.Error("no LevelChanged event was emitted")
	}
}

func TestFourLineClearScoresEightHundredTimesLevel(t *testing.T) {
	g := New(56)
	g.Start()
	for y := 18; y <= 21; y++ {
		for x := 0; x < Width; x++ {
			if x != 4 {
				g.Board.Set(x, y, CellFor(KindI))
			}
		}
	}
	g.Active = Piece{Kind: KindI, Rotation: 1, X: 2, Y: 0} // vertical I in column 4
	evs := g.HardDrop()
	e := has(evs, LinesCleared)
	if e == nil || len(e.Rows) != 4 {
		t.Fatalf("expected a four-line clear, got %v", evs)
	}
	if g.Lines != 4 {
		t.Errorf("lines = %d want 4", g.Lines)
	}
	dropPoints := has(evs, PieceHardDropped).Points
	if got := g.Score - dropPoints; got != 800 {
		t.Errorf("clear scored %d want 800", got)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail (or reveal a real gap)**

Run: `go test ./internal/game/ -run 'TestCombo|TestSecond|TestPlacement|TestNoCombo|TestLevelRises|TestFourLine' -v`
Expected: FAIL. If some already pass, that is fine — fix only what fails.

- [ ] **Step 3: Fix the combo/level bookkeeping in `game.go` until the tests pass**

Watch the `LinesCleared.Points` split: line value and combo bonus are both computed at the pre-clear level, and both belong in that event's `Points`.

- [ ] **Step 4: Run the full package**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/progression_test.go
git commit -m "test(game): combo indexing and level progression across placements"
```

---

### Task 13: Determinism replay test

**Files:**
- Create: `internal/game/determinism_test.go`

**Interfaces:**
- Consumes: the whole engine. Produces no API — this is §35's promise made checkable, per §49.2.

- [ ] **Step 1: Write the failing test**

`internal/game/determinism_test.go`:

```go
package game

import (
	"testing"
	"time"
)

type inputCode int

const (
	inNone inputCode = iota
	inLeft
	inRight
	inCW
	inCCW
	inSoft
	inHard
	inHold
)

// replay runs a fixed, boring-looking script of (input, dt) pairs and returns a
// compact description of the final state.
func replay(seed int64) (score, lines, level, combo int, fp uint64, over bool) {
	g := New(seed)
	g.Start()
	script := []struct {
		in inputCode
		dt time.Duration
	}{}
	// A deterministic pseudo-script: no RNG, just arithmetic on the index.
	for i := 0; i < 600; i++ {
		in := inputCode(i % 8)
		dt := time.Duration(7+(i*13)%90) * time.Millisecond
		script = append(script, struct {
			in inputCode
			dt time.Duration
		}{in, dt})
	}
	for _, step := range script {
		switch step.in {
		case inLeft:
			g.MoveLeft()
		case inRight:
			g.MoveRight()
		case inCW:
			g.RotateCW()
		case inCCW:
			g.RotateCCW()
		case inSoft:
			g.SoftDrop()
		case inHard:
			g.HardDrop()
		case inHold:
			g.HoldPiece()
		}
		g.Advance(step.dt)
	}
	return g.Score, g.Lines, g.Level, g.Combo, g.Board.Fingerprint(), g.Over
}

func TestReplayIsReproducible(t *testing.T) {
	s1, l1, lv1, c1, f1, o1 := replay(8675309)
	s2, l2, lv2, c2, f2, o2 := replay(8675309)
	if s1 != s2 || l1 != l2 || lv1 != lv2 || c1 != c2 || f1 != f2 || o1 != o2 {
		t.Fatalf("same seed and script diverged:\n  %d %d %d %d %x %v\n  %d %d %d %d %x %v",
			s1, l1, lv1, c1, f1, o1, s2, l2, lv2, c2, f2, o2)
	}
	if s1 == 0 && l1 == 0 {
		t.Fatal("the script did nothing; it must actually play the game")
	}
}

func TestReplayDependsOnTheSeed(t *testing.T) {
	s1, l1, _, _, f1, _ := replay(1)
	s2, l2, _, _, f2, _ := replay(2)
	if s1 == s2 && l1 == l2 && f1 == f2 {
		t.Fatal("two different seeds produced an identical game")
	}
}

func TestReplayDependsOnTimingInputs(t *testing.T) {
	run := func(dt time.Duration) uint64 {
		g := New(77)
		g.Start()
		for i := 0; i < 300; i++ {
			if i%9 == 0 {
				g.MoveLeft()
			}
			g.Advance(dt)
		}
		return g.Board.Fingerprint()
	}
	if run(20*time.Millisecond) == run(200*time.Millisecond) {
		t.Fatal("timing is not affecting the simulation; gravity may not be dt-driven")
	}
}

func TestEngineNeverReadsTheClock(t *testing.T) {
	// Guard for §49.2. Kept as a test so it runs in CI with everything else.
	t.Skip("enforced by the grep step in the plan; see TestNoTimeNowInGamePackage")
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run TestReplay -v`
Expected: FAIL initially only if something is non-deterministic; a PASS here is also a valid result. If `TestReplayIsReproducible` fails, find the shared or global RNG and remove it.

- [ ] **Step 3: Replace the skipped clock test with a real one**

Delete `TestEngineNeverReadsTheClock` and add, in the same file:

```go
func TestNoTimeNowInGamePackage(t *testing.T) {
	entries, err := os.ReadDir(".")
	if err != nil {
		t.Fatal(err)
	}
	for _, e := range entries {
		name := e.Name()
		if !strings.HasSuffix(name, ".go") || strings.HasSuffix(name, "_test.go") {
			continue
		}
		src, err := os.ReadFile(name)
		if err != nil {
			t.Fatal(err)
		}
		if bytes.Contains(src, []byte("time.Now()")) {
			t.Errorf("%s calls time.Now(); §49.2 forbids a clock in internal/game", name)
		}
	}
}
```

Add the `bytes`, `os`, `strings` imports.

- [ ] **Step 4: Run the whole suite with the race detector**

Run: `go test ./... -race -count=2 && go vet ./...`
Expected: PASS twice (the `-count=2` catches state leaking through package-level variables).

- [ ] **Step 5: Commit**

```bash
git add internal/game/determinism_test.go
git commit -m "test(game): seeded replay determinism and no-clock guard"
```

---

### Task 14: Engine gate — full-suite run and coverage read

**Files:**
- Create: `Makefile`

**Interfaces:**
- Consumes: everything. Produces: `make test`, `make cover`, `make lint` targets used by every later plan.

- [ ] **Step 1: Write the Makefile**

```make
.PHONY: test cover lint build run
test:
	go test ./... -race
cover:
	go test ./internal/game/ -coverprofile=/tmp/cosmic.cover && go tool cover -func=/tmp/cosmic.cover | tail -1
lint:
	go vet ./...
build:
	go build -o cosmic-tetris ./cmd/cosmic-tetris
run: build
	./cosmic-tetris
```

`build`/`run` will fail until Plan 02 creates `cmd/cosmic-tetris`; that is expected.

- [ ] **Step 2: Run the gate**

Run: `make test && make lint && make cover`
Expected: all tests PASS; coverage of `internal/game` at or above 85% of statements. If it is lower, find the untested branch and add the missing case to the task that owns it.

- [ ] **Step 3: Confirm §42's Phase 1 checklist by inspection**

Tick off, against the test names that prove each one: pieces, board, bag, movement, rotation, gravity, locking, line clearing, hold, scoring, game over. Anything without a test gets one before this plan is called done.

- [ ] **Step 4: Commit**

```bash
git add Makefile
git commit -m "chore: make targets for test, cover, lint, build"
```

---

## Done when

- `make test` passes with `-race`.
- `internal/game` has no import outside the standard library, no `time.Now()`, no goroutine, no I/O.
- Every §40 bullet under Board, Pieces, Bag, Hold, Drop, Score, Game over, and Determinism maps to a named test.
- A `Game` can be played from first spawn to game over through `Advance` and the input methods alone, with `Event`s describing everything that happened — which is exactly what Plan 02 renders.
