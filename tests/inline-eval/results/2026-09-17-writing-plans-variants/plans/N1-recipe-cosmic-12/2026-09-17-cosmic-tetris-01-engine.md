# Cosmic Tetris — Plan 1 of 3: Deterministic Game Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete headless falling-block game engine — pieces, board, 7-bag, movement, rotation with kicks, gravity, locking, line clearing, hold, scoring, game over — as a deterministic, clock-free Go package with comprehensive unit tests.

**Architecture:** One package, `internal/game`, with no dependencies outside the standard library. The engine is a pure state machine: callers push player actions in via `Input(Action)` and push elapsed time in via `Advance(dt)`; both return a slice of `Event` values describing what happened. Nothing in the package reads a clock or a global RNG. The board is a fixed-size array so state is cheap to copy for events and snapshots.

**Tech Stack:** Go 1.26, standard library only (`math/rand`, `time` for `time.Duration` as a value type only).

**Spec:** `design.md` (this plan implements §5–§13, §34, §35, §40, §49.1, §49.2, §49.4 shape/cell semantics, §49.6)

**Plan sequence:** This is plan 1 of 3. Plan 2 (`2026-09-17-cosmic-tetris-02-terminal.md`) builds the Bubble Tea app and renderer on top of this package. Plan 3 (`2026-09-17-cosmic-tetris-03-cosmic-fx.md`) adds the effects layer. Plan 2 and 3 depend on the exact names and types in this plan's Interfaces blocks — do not rename them later without updating those plans.

## Global Constraints

- Go module path: `cosmic-tetris`. Go directive: `go 1.26`.
- `internal/game` imports **only** the standard library. It must never import `charm.land/...`, `internal/render`, `internal/fx`, or `internal/app`.
- **Nothing under `internal/game` calls `time.Now()`, `time.Since()`, `time.Tick`, or `rand` package-level functions** (§49.2). `time` is used only for the `time.Duration` type. Enforced by a test in Task 9.
- The game RNG is a `*rand.Rand` owned by `Game`, seeded from `Seed`, and used for **the 7-bag and nothing else** (§49.6). The FX RNG (plan 3) is separate and must never be crossed with it.
- Board geometry is fixed: `Width = 10`, `Height = 22`, `HiddenRows = 2`, `VisibleRows = 20` (§5). Row 0 is the top; rows 0 and 1 are the hidden spawn rows; rows 2–21 are visible.
- Level 1 gravity interval is `800ms`, scaling `800ms * 0.86^(level-1)`, clamped to a floor of `60ms` (§11).
- Lock delay `500ms`; max lock resets `15` (§12).
- Line values `100 / 300 / 500 / 800`, each `× level` (§13). Combo bonus `50 × (combo - 1) × level` (§49.1). Soft drop `+1/cell`, hard drop `+2/cell` (§11).
- Level increases every 10 cleared lines (§11).
- No networking, no filesystem access, no goroutines, no logging in this package.
- Every task ends with `go test ./...` passing and `gofmt -l .` printing nothing.

## Review Focus

These are input classes the spec implies but does not spell out. Each one has a test added to the task that owns the code — listed here so a reviewer can check them in one place.

1. **A `dt` far larger than one gravity interval** (terminal was suspended, or the frame loop stalled): gravity must step the piece down repeatedly, checking collision at every step, and must terminate. A single subtract-and-drop would teleport a piece through the stack. → Task 6.
2. **Zero, negative, or absurd `dt`**: `Advance(0)` must be a no-op returning no events; a negative `dt` must not run the accumulators backwards. → Task 6.
3. **Hold when the incoming piece cannot spawn** (stack reaches the spawn rows): must end the game the same way a blocked natural spawn does, not panic or leave a piece overlapping locked cells. → Task 7.
4. **Input after game over**: every action and `Advance` must be inert once `Over` is true — no movement, no scoring, no further `GameOver` events. → Task 8.
5. **A piece that locks entirely inside the hidden rows** and a completed row inside the hidden rows: locking above row 2 must still commit cells, and row completion must scan all 22 rows, not just the visible 20. → Task 5.

---

## File Structure

| File | Responsibility |
|---|---|
| `go.mod` | Module `cosmic-tetris`, `go 1.26`. |
| `LICENSE` | MIT, copyright Jesse Vincent. |
| `internal/game/piece.go` | `PieceKind`, `Piece`, the four literal rotation tables per kind, `Cells()`. |
| `internal/game/board.go` | `Board` array type, bounds/occupancy queries, collision, row completion, row clearing and collapse. |
| `internal/game/bag.go` | 7-bag generator over an injected `*rand.Rand`. |
| `internal/game/rules.go` | Tunable constants: spawn offset, kick offset table, lock delay, max resets, gravity interval. |
| `internal/game/scoring.go` | Pure scoring functions: line values, combo bonus, level from lines. |
| `internal/game/events.go` | The `Event` interface and every concrete event struct. |
| `internal/game/game.go` | `Game` state, `New`, `Input`, `Advance`, `GhostY`, spawn/lock/clear sequencing. |
| `internal/game/*_test.go` | Tests, one file per source file above. |

`events.go` is one file beyond §33's list for this package. It is genuinely necessary: §36 references the type `game.Event` from the app layer, so events are part of `internal/game`'s public surface, and there are ten of them — putting them in `game.go` would bury the state machine. §33's `rules.go` and `scoring.go` are kept as listed.

---

### Task 1: Module bootstrap

**Files:**
- Create: `go.mod`, `LICENSE`, `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: a buildable module rooted at `cosmic-tetris`, so all later packages are `cosmic-tetris/internal/...`.

- [ ] **Step 1: Initialize the module**

```bash
go mod init cosmic-tetris
```

Confirm `go.mod` says `go 1.26` (edit the directive if `go mod init` wrote something older).

- [ ] **Step 2: Add `LICENSE`**

MIT license text, `Copyright (c) 2026 Jesse Vincent`.

- [ ] **Step 3: Add `.gitignore`**

```
/cosmic-tetris
/dist/
```

- [ ] **Step 4: Verify the module builds**

Run: `go build ./... && go vet ./...`
Expected: no output, exit 0.

- [ ] **Step 5: Commit**

```bash
git add go.mod LICENSE .gitignore
git commit -m "chore: initialize cosmic-tetris go module"
```

---

### Task 2: Pieces and rotation tables

**Files:**
- Create: `internal/game/piece.go`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```go
  type PieceKind uint8
  const (
      Empty PieceKind = iota
      I; J; L; O; S; T; Z
  )
  func (k PieceKind) String() string   // "I", "J", ... ; Empty -> "."
  var AllKinds = [7]PieceKind{I, J, L, O, S, T, Z}

  type Piece struct {
      Kind     PieceKind
      Rotation int // 0..3
      X, Y     int // top-left of the piece's 4x4 box, in board coordinates
  }

  // Cells returns the four occupied board coordinates of p, in row-major
  // order of the rotation table. Panics if p.Kind is Empty.
  func (p Piece) Cells() [4][2]int
  ```

The rotation data is the one thing tests cannot derive, so it is pinned here verbatim. Each entry is a 4×4 mask, `X` occupied, `.` empty, row 0 first. Every kind has exactly four literal rotations (§6); `O` repeats.

- [ ] **Step 1: Write `internal/game/piece.go` with the pinned rotation tables**

```go
// shapes[kind][rotation][row] is a 4-character mask, 'X' occupied.
var shapes = map[PieceKind][4][4]string{
	I: {
		{"....", "XXXX", "....", "...."},
		{"..X.", "..X.", "..X.", "..X."},
		{"....", "....", "XXXX", "...."},
		{".X..", ".X..", ".X..", ".X.."},
	},
	J: {
		{"X...", "XXX.", "....", "...."},
		{"XX..", "X...", "X...", "...."},
		{"....", "XXX.", "..X.", "...."},
		{".X..", ".X..", "XX..", "...."},
	},
	L: {
		{"..X.", "XXX.", "....", "...."},
		{"X...", "X...", "XX..", "...."},
		{"....", "XXX.", "X...", "...."},
		{"XX..", ".X..", ".X..", "...."},
	},
	O: {
		{".XX.", ".XX.", "....", "...."},
		{".XX.", ".XX.", "....", "...."},
		{".XX.", ".XX.", "....", "...."},
		{".XX.", ".XX.", "....", "...."},
	},
	S: {
		{".XX.", "XX..", "....", "...."},
		{".X..", ".XX.", "..X.", "...."},
		{"....", ".XX.", "XX..", "...."},
		{"X...", "XX..", ".X..", "...."},
	},
	T: {
		{".X..", "XXX.", "....", "...."},
		{".X..", ".XX.", ".X..", "...."},
		{"....", "XXX.", ".X..", "...."},
		{".X..", "XX..", ".X..", "...."},
	},
	Z: {
		{"XX..", ".XX.", "....", "...."},
		{"..X.", ".XX.", ".X..", "...."},
		{"....", "XX..", ".XX.", "...."},
		{".X..", "XX..", "X...", "...."},
	},
}
```

Implement `Cells()` by scanning the mask and offsetting by `p.X, p.Y`. Normalize `Rotation` with `((r % 4) + 4) % 4` so a negative rotation from a counter-clockwise turn is safe.

- [ ] **Step 2: Write the failing tests**

```go
func TestEveryRotationHasFourCells(t *testing.T) {
	for _, k := range AllKinds {
		for r := 0; r < 4; r++ {
			p := Piece{Kind: k, Rotation: r}
			var n int
			for _, row := range shapes[k][r] {
				n += strings.Count(row, "X")
			}
			if n != 4 {
				t.Errorf("%v rotation %d has %d cells, want 4", k, r, n)
			}
			if got := len(p.Cells()); got != 4 {
				t.Errorf("%v rotation %d Cells() len %d, want 4", k, r, got)
			}
		}
	}
}

func TestRotationTablesAreFourCharacterRows(t *testing.T) {
	for _, k := range AllKinds {
		for r := 0; r < 4; r++ {
			for i, row := range shapes[k][r] {
				if len(row) != 4 {
					t.Errorf("%v rot %d row %d = %q, want 4 chars", k, r, i, row)
				}
			}
		}
	}
}

func TestCellsOffsetByPosition(t *testing.T) {
	// T rotation 0 is ".X.." / "XXX." -> (1,0) (0,1) (1,1) (2,1)
	p := Piece{Kind: T, Rotation: 0, X: 3, Y: 5}
	want := [4][2]int{{4, 5}, {3, 6}, {4, 6}, {5, 6}}
	if got := p.Cells(); got != want {
		t.Errorf("Cells() = %v, want %v", got, want)
	}
}

func TestOIsIdenticalThroughRotation(t *testing.T) {
	base := Piece{Kind: O, Rotation: 0, X: 3, Y: 0}.Cells()
	for r := 1; r < 4; r++ {
		if got := (Piece{Kind: O, Rotation: r, X: 3, Y: 0}).Cells(); got != base {
			t.Errorf("O rotation %d = %v, want %v", r, got, base)
		}
	}
}

func TestNegativeRotationNormalizes(t *testing.T) {
	got := Piece{Kind: T, Rotation: -1, X: 0, Y: 0}.Cells()
	want := Piece{Kind: T, Rotation: 3, X: 0, Y: 0}.Cells()
	if got != want {
		t.Errorf("rotation -1 = %v, want same as rotation 3 %v", got, want)
	}
}

func TestKindString(t *testing.T) {
	if got := I.String(); got != "I" {
		t.Errorf("I.String() = %q", got)
	}
	if got := Empty.String(); got != "." {
		t.Errorf("Empty.String() = %q", got)
	}
}
```

- [ ] **Step 3: Run the tests**

Run: `go test ./internal/game/ -run 'Rotation|Cells|OIsIdentical|KindString' -v`
Expected: PASS (the implementation and the tables were written together; if a table has a typo, the four-cells test names the kind and rotation).

- [ ] **Step 4: Commit**

```bash
git add internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): tetromino kinds and pinned rotation tables"
```

---

### Task 3: Board

**Files:**
- Create: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `Piece` (Task 2).
- Produces:
  ```go
  const (
      Width       = 10
      Height      = 22
      HiddenRows  = 2
      VisibleRows = Height - HiddenRows // 20
  )

  // Board is a value type: assignment copies it. Row 0 is the top.
  type Board [Height][Width]PieceKind

  func (b Board) At(x, y int) PieceKind          // Empty for out-of-range y < 0
  func (b Board) Occupied(x, y int) bool         // out of bounds counts as occupied except above the top
  func (b *Board) Set(x, y int, k PieceKind)     // no-op if out of range
  func (b Board) Collides(p Piece) bool          // any cell out of bounds or on a filled cell
  func (b *Board) Commit(p Piece)                // write p's cells as p.Kind
  func (b Board) CompleteRows() []int            // ascending row indices, all 22 rows scanned
  func (b *Board) ClearRows(rows []int)          // remove rows, collapse everything above down
  ```

Pin the out-of-bounds rule: `x < 0`, `x >= Width`, and `y >= Height` collide. `y < 0` does **not** collide — a piece's 4×4 box may hang above the board during a kick, and only its filled cells matter, all of which are inside the box.

- [ ] **Step 1: Write the failing tests**

```go
func TestCollidesWithWalls(t *testing.T) {
	var b Board
	if !b.Collides(Piece{Kind: T, X: -1, Y: 5}) { // T rot0 fills col 0 of its box
		t.Error("piece off the left edge should collide")
	}
	if !b.Collides(Piece{Kind: T, X: Width - 2, Y: 5}) {
		t.Error("piece off the right edge should collide")
	}
	if !b.Collides(Piece{Kind: T, X: 3, Y: Height - 1}) {
		t.Error("piece below the floor should collide")
	}
	if b.Collides(Piece{Kind: T, X: 3, Y: 0}) {
		t.Error("piece inside an empty board should not collide")
	}
}

func TestCollidesWithLockedCells(t *testing.T) {
	var b Board
	b.Set(4, 10, I)
	if !b.Collides(Piece{Kind: O, Rotation: 0, X: 3, Y: 9}) { // O fills (4,9),(5,9),(4,10),(5,10)
		t.Error("overlapping a locked cell should collide")
	}
	if b.Collides(Piece{Kind: O, Rotation: 0, X: 6, Y: 9}) {
		t.Error("clear of the locked cell should not collide")
	}
}

func TestCommitWritesKind(t *testing.T) {
	var b Board
	p := Piece{Kind: Z, Rotation: 0, X: 3, Y: 4}
	b.Commit(p)
	for _, c := range p.Cells() {
		if got := b.At(c[0], c[1]); got != Z {
			t.Errorf("At(%d,%d) = %v, want Z", c[0], c[1], got)
		}
	}
}

func TestCompleteRowsScansHiddenRows(t *testing.T) {
	var b Board
	for x := 0; x < Width; x++ {
		b.Set(x, 1, I)  // hidden row
		b.Set(x, 21, I) // bottom row
	}
	b.Set(0, 10, I) // partial row, must not be reported
	got := b.CompleteRows()
	want := []int{1, 21}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("CompleteRows() = %v, want %v", got, want)
	}
}

func TestClearRowsCollapsesFromAbove(t *testing.T) {
	var b Board
	b.Set(0, 19, T) // a marker that must fall two rows
	for x := 0; x < Width; x++ {
		b.Set(x, 20, I)
		b.Set(x, 21, J)
	}
	b.ClearRows([]int{20, 21})
	if got := b.At(0, 21); got != T {
		t.Errorf("marker should have fallen to row 21, At(0,21) = %v", got)
	}
	if got := b.At(0, 19); got != Empty {
		t.Errorf("old marker position should be empty, got %v", got)
	}
	if rows := b.CompleteRows(); len(rows) != 0 {
		t.Errorf("no complete rows should remain, got %v", rows)
	}
}

func TestClearRowsHandlesNonAdjacentRows(t *testing.T) {
	var b Board
	for x := 0; x < Width; x++ {
		b.Set(x, 18, I)
		b.Set(x, 20, I)
	}
	b.Set(0, 19, T)
	b.Set(1, 21, Z)
	b.ClearRows([]int{18, 20})
	if got := b.At(0, 20); got != T {
		t.Errorf("T should land on row 20, got %v", got)
	}
	if got := b.At(1, 21); got != Z {
		t.Errorf("row 21 should be untouched, got %v", got)
	}
}

func TestBoardIsCopiedByAssignment(t *testing.T) {
	var b Board
	b.Set(0, 0, I)
	snapshot := b
	b.Set(0, 0, Empty)
	if snapshot.At(0, 0) != I {
		t.Error("Board assignment must copy, not alias")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run Board -v` (plus `-run 'Collides|Commit|CompleteRows|ClearRows'`)
Expected: FAIL — `undefined: Board`.

- [ ] **Step 3: Implement `internal/game/board.go`**

Implement the interface above. `ClearRows` is the only non-obvious one: copy rows bottom-up into a write cursor, skipping cleared rows, then zero the remaining rows at the top. Do not assume the input rows are adjacent or sorted — sort a local copy.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board collision, row completion and collapse"
```

---

### Task 4: 7-bag and rules constants

**Files:**
- Create: `internal/game/bag.go`, `internal/game/rules.go`
- Test: `internal/game/bag_test.go`, `internal/game/rules_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `AllKinds` (Task 2).
- Produces:
  ```go
  // Bag is a 7-bag: it yields a shuffled permutation of all seven kinds,
  // refilling when empty. It never allocates after construction.
  type Bag struct { /* queue [7]PieceKind; pos int */ }
  func NewBag(rng *rand.Rand) Bag
  func (b *Bag) Next(rng *rand.Rand) PieceKind

  // rules.go
  const (
      SpawnX        = 3
      SpawnY        = 0
      LockDelay     = 500 * time.Millisecond
      MaxLockResets = 15
      BaseGravity   = 800 * time.Millisecond
      MinGravity    = 60 * time.Millisecond
      GravityDecay  = 0.86
  )
  // KickOffsets is tried in order when rotating; the first valid one wins (§7).
  var KickOffsets = [8][2]int{{0, 0}, {-1, 0}, {1, 0}, {-2, 0}, {2, 0}, {0, -1}, {-1, -1}, {1, -1}}
  func GravityInterval(level int) time.Duration
  ```

`Bag.Next` takes the RNG as a parameter rather than holding it, so `Game` remains the single owner of the generator (§49.6).

- [ ] **Step 1: Write the failing tests**

```go
func TestEachBagContainsAllSevenKindsExactlyOnce(t *testing.T) {
	rng := rand.New(rand.NewSource(42))
	b := NewBag(rng)
	for round := 0; round < 5; round++ {
		seen := map[PieceKind]int{}
		for i := 0; i < 7; i++ {
			seen[b.Next(rng)]++
		}
		for _, k := range AllKinds {
			if seen[k] != 1 {
				t.Fatalf("round %d: kind %v appeared %d times, want 1", round, k, seen[k])
			}
		}
	}
}

func TestSeededBagIsReproducible(t *testing.T) {
	draw := func() []PieceKind {
		rng := rand.New(rand.NewSource(8675309))
		b := NewBag(rng)
		out := make([]PieceKind, 0, 21)
		for i := 0; i < 21; i++ {
			out = append(out, b.Next(rng))
		}
		return out
	}
	if a, b := draw(), draw(); !reflect.DeepEqual(a, b) {
		t.Errorf("same seed produced different sequences:\n%v\n%v", a, b)
	}
}

func TestDifferentSeedsDiffer(t *testing.T) {
	draw := func(seed int64) []PieceKind {
		rng := rand.New(rand.NewSource(seed))
		b := NewBag(rng)
		out := make([]PieceKind, 0, 14)
		for i := 0; i < 14; i++ {
			out = append(out, b.Next(rng))
		}
		return out
	}
	if reflect.DeepEqual(draw(1), draw(2)) {
		t.Error("seeds 1 and 2 produced identical 14-piece sequences")
	}
}

func TestGravityIntervalDecaysAndClamps(t *testing.T) {
	if got := GravityInterval(1); got != BaseGravity {
		t.Errorf("level 1 = %v, want %v", got, BaseGravity)
	}
	if a, b := GravityInterval(5), GravityInterval(6); !(a > b) {
		t.Errorf("interval must shrink with level: level5=%v level6=%v", a, b)
	}
	if got := GravityInterval(99); got != MinGravity {
		t.Errorf("level 99 = %v, want clamp at %v", got, MinGravity)
	}
	if got := GravityInterval(0); got != BaseGravity {
		t.Errorf("level 0 should be treated as level 1, got %v", got)
	}
	// 800ms * 0.86^2 = 591.68ms
	if got := GravityInterval(3); got < 591*time.Millisecond || got > 592*time.Millisecond {
		t.Errorf("level 3 = %v, want ~591.7ms", got)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'Bag|Gravity|Seed' -v`
Expected: FAIL — `undefined: NewBag`, `undefined: GravityInterval`.

- [ ] **Step 3: Implement `bag.go` and `rules.go`**

`NewBag` fills the queue with `AllKinds` and shuffles with `rng.Shuffle`; `Next` returns the piece at `pos`, refilling and reshuffling when `pos` reaches 7. `GravityInterval` uses `math.Pow(GravityDecay, float64(level-1))` with `level` clamped to a minimum of 1, then clamps the result to `MinGravity`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/bag.go internal/game/rules.go internal/game/bag_test.go internal/game/rules_test.go
git commit -m "feat(game): 7-bag generator and gravity rules"
```

---

### Task 5: Scoring and events

**Files:**
- Create: `internal/game/scoring.go`, `internal/game/events.go`
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: `Piece`, `PieceKind`, `Board` (Tasks 2–3).
- Produces:
  ```go
  // scoring.go
  func LineScore(count, level int) int   // count 0..4; 0 for count<=0 or >4
  func ComboBonus(combo, level int) int  // 50*(combo-1)*level, 0 when combo<2
  func LevelFor(lines int) int           // 1 + lines/10
  const (
      SoftDropPoints = 1 // per cell
      HardDropPoints = 2 // per cell
  )

  // events.go
  type Event interface{ isGameEvent() }

  type PieceSpawned struct     { gameEvent; Piece Piece }
  type PieceMoved struct       { gameEvent; Piece Piece; DX, DY int } // DY>0 is downward
  type PieceRotated struct     { gameEvent; Piece Piece; Dir int }    // +1 cw, -1 ccw
  type PieceHardDropped struct { gameEvent; Piece Piece; Cells int }  // Piece is the landed piece
  type PieceLocked struct      { gameEvent; Piece Piece }
  type HoldUsed struct         { gameEvent; Stored, Spawned PieceKind }
  type LinesCleared struct     { gameEvent; Rows []int; Count int; Before Board }
  type ComboChanged struct     { gameEvent; Combo int }
  type LevelChanged struct     { gameEvent; Level int }
  type GameOver struct         { gameEvent; Score, Lines, Level int }
  ```

`LinesCleared.Before` is the board **after the piece locked but before the rows were removed**. Plan 3's line-clear animation renders it for 220ms (§19) — without it the renderer cannot show a row that state has already deleted. `Board` is a value type, so this is a 220-byte copy, not an alias.

`gameEvent` is an unexported empty struct embedded in each event to satisfy `Event`:

```go
type gameEvent struct{}
func (gameEvent) isGameEvent() {}
```

- [ ] **Step 1: Write the failing tests**

```go
func TestLineScoreValues(t *testing.T) {
	cases := []struct{ count, level, want int }{
		{1, 1, 100}, {2, 1, 300}, {3, 1, 500}, {4, 1, 800},
		{1, 7, 700}, {4, 3, 2400},
		{0, 5, 0}, {5, 1, 0}, {-1, 1, 0},
	}
	for _, c := range cases {
		if got := LineScore(c.count, c.level); got != c.want {
			t.Errorf("LineScore(%d,%d) = %d, want %d", c.count, c.level, got, c.want)
		}
	}
}

func TestComboBonusStartsAtComboTwo(t *testing.T) {
	cases := []struct{ combo, level, want int }{
		{0, 5, 0}, {1, 5, 0}, {2, 1, 50}, {2, 4, 200}, {5, 2, 400},
	}
	for _, c := range cases {
		if got := ComboBonus(c.combo, c.level); got != c.want {
			t.Errorf("ComboBonus(%d,%d) = %d, want %d", c.combo, c.level, got, c.want)
		}
	}
}

func TestLevelFor(t *testing.T) {
	cases := []struct{ lines, want int }{{0, 1}, {9, 1}, {10, 2}, {19, 2}, {20, 3}, {127, 13}}
	for _, c := range cases {
		if got := LevelFor(c.lines); got != c.want {
			t.Errorf("LevelFor(%d) = %d, want %d", c.lines, got, c.want)
		}
	}
}

func TestEventsSatisfyEventInterface(t *testing.T) {
	evts := []Event{
		PieceSpawned{}, PieceMoved{}, PieceRotated{}, PieceHardDropped{},
		PieceLocked{}, HoldUsed{}, LinesCleared{}, ComboChanged{},
		LevelChanged{}, GameOver{},
	}
	if len(evts) != 10 {
		t.Fatalf("expected 10 event types, got %d", len(evts))
	}
}

// Review Focus 5: completion inside the hidden rows.
func TestCompleteRowsInHiddenRegionAreScored(t *testing.T) {
	var b Board
	for x := 0; x < Width; x++ {
		b.Set(x, 0, I)
	}
	if rows := b.CompleteRows(); !reflect.DeepEqual(rows, []int{0}) {
		t.Errorf("row 0 (hidden) should be complete, got %v", rows)
	}
	if got := LineScore(1, 1); got != 100 {
		t.Errorf("a hidden-row clear still scores: %d", got)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'LineScore|Combo|LevelFor|Event|Hidden' -v`
Expected: FAIL — `undefined: LineScore`.

- [ ] **Step 3: Implement `scoring.go` and `events.go`**

`LineScore` uses a `[5]int{0, 100, 300, 500, 800}` table with a range guard.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/scoring.go internal/game/events.go internal/game/scoring_test.go
git commit -m "feat(game): scoring functions and event types"
```

---

### Task 6: Game state, spawn, movement, rotation, gravity

**Files:**
- Create: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: everything from Tasks 2–5.
- Produces:
  ```go
  const NextQueueLen = 5 // §6: enough future pieces to render the next five

  type Action int
  const (
      ActionLeft Action = iota
      ActionRight
      ActionSoftDrop
      ActionHardDrop
      ActionRotateCW
      ActionRotateCCW
      ActionHold
  )

  type Game struct {
      Board   Board
      Active  Piece
      Hold    *PieceKind
      CanHold bool

      Next []PieceKind // always NextQueueLen long
      Bag  Bag

      Score int
      Lines int
      Level int
      Combo int

      GravityAccumulator time.Duration
      LockAccumulator    time.Duration
      LockResets         int
      Grounded           bool
      Over               bool

      Seed int64
      rng  *rand.Rand
      events []Event // reused buffer, drained by Input/Advance
  }

  func New(seed int64) *Game
  func (g *Game) Input(a Action) []Event
  func (g *Game) Advance(dt time.Duration) []Event
  // GhostY returns the Y the active piece would land at from its current
  // position (§10). Equal to Active.Y when the piece is grounded.
  func (g *Game) GhostY() int
  ```

Pinned semantics — the tests below depend on all of these:

- `New(seed)` sets `Level = 1`, `CanHold = true`, fills `Next` to `NextQueueLen`, and spawns the first piece. The `PieceSpawned` event for the first piece is **not** returned to anyone (nothing has called in yet); it is left in `g.events` and drained by the caller's first `Input`/`Advance`.
- Spawn position is always `SpawnX, SpawnY` at rotation 0 (§6, §9). If the spawned piece collides there, `Over = true` and a `GameOver` event is emitted (§12, §40).
- Movement/rotation while `Grounded` resets `LockAccumulator` to 0 and increments `LockResets`, but only while `LockResets < MaxLockResets`; past that the timer keeps running (§12).
- Becoming ungrounded (e.g. moving off a ledge) sets `LockAccumulator = 0` without consuming a reset. `LockResets` returns to 0 only on spawn.
- Soft drop moves one cell if possible, scores `SoftDropPoints`, and zeroes `GravityAccumulator`. If it cannot move it does nothing and scores nothing.
- Rotation tries `KickOffsets` in order and takes the first position with no collision; if none is valid the rotation fails silently and emits no event (§7).
- `Advance(dt)`: if `Over` or `dt <= 0`, return no events. Otherwise add `dt` to `GravityAccumulator` and **loop** `for g.GravityAccumulator >= GravityInterval(g.Level)`, subtracting and dropping one cell per iteration, so a large `dt` steps rather than teleports (Review Focus 1). When a step cannot descend, set `Grounded` and stop consuming gravity. Then run the lock timer.

- [ ] **Step 1: Write the failing tests for spawn, movement and rotation**

```go
func TestNewGameSpawnsCenteredPieceAtLevelOne(t *testing.T) {
	g := New(1)
	if g.Level != 1 || g.Score != 0 || g.Lines != 0 || g.Combo != 0 {
		t.Errorf("fresh game = level %d score %d lines %d combo %d", g.Level, g.Score, g.Lines, g.Combo)
	}
	if g.Active.X != SpawnX || g.Active.Y != SpawnY || g.Active.Rotation != 0 {
		t.Errorf("spawn at (%d,%d) rot %d, want (%d,%d) rot 0", g.Active.X, g.Active.Y, g.Active.Rotation, SpawnX, SpawnY)
	}
	if len(g.Next) != NextQueueLen {
		t.Errorf("Next has %d entries, want %d", len(g.Next), NextQueueLen)
	}
	if !g.CanHold {
		t.Error("CanHold should start true")
	}
	for _, c := range g.Active.Cells() {
		if c[1] >= HiddenRows {
			t.Errorf("spawned piece cell %v is not in the hidden rows", c)
		}
	}
}

func TestMoveLeftRightAndWalls(t *testing.T) {
	g := New(1)
	startX := g.Active.X
	if evts := g.Input(ActionLeft); !hasEvent[PieceMoved](evts) {
		t.Error("ActionLeft should emit PieceMoved")
	}
	if g.Active.X != startX-1 {
		t.Errorf("X = %d, want %d", g.Active.X, startX-1)
	}
	for i := 0; i < 20; i++ {
		g.Input(ActionLeft)
	}
	blockedX := g.Active.X
	if evts := g.Input(ActionLeft); len(evts) != 0 {
		t.Errorf("blocked move should emit nothing, got %#v", evts)
	}
	if g.Active.X != blockedX {
		t.Error("piece moved through the left wall")
	}
}

func TestRotationEmitsEventAndFailsWhenBlocked(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: T, Rotation: 0, X: 3, Y: 10}
	if evts := g.Input(ActionRotateCW); !hasEvent[PieceRotated](evts) {
		t.Error("free rotation should emit PieceRotated")
	}
	if g.Active.Rotation != 1 {
		t.Errorf("rotation = %d, want 1", g.Active.Rotation)
	}

	// Box the piece in on all sides so no kick offset can succeed.
	g2 := New(1)
	g2.Active = Piece{Kind: I, Rotation: 0, X: 3, Y: 10}
	for y := 8; y <= 13; y++ {
		for x := 0; x < Width; x++ {
			if y == 10 && x >= 3 && x <= 6 {
				continue
			}
			g2.Board.Set(x, y, J)
		}
	}
	before := g2.Active
	if evts := g2.Input(ActionRotateCW); len(evts) != 0 {
		t.Errorf("blocked rotation should emit nothing, got %#v", evts)
	}
	if g2.Active != before {
		t.Errorf("failed rotation must not move the piece: %+v -> %+v", before, g2.Active)
	}
}

func TestRotationWallKicksOffTheLeftEdge(t *testing.T) {
	g := New(1)
	// I at rotation 1 is a vertical bar in column X+2; put it hard against
	// the left wall so rotating to 0 (cols X..X+3) needs a rightward kick.
	g.Active = Piece{Kind: I, Rotation: 1, X: -2, Y: 10}
	if evts := g.Input(ActionRotateCW); !hasEvent[PieceRotated](evts) {
		t.Fatal("rotation against the wall should succeed via a kick")
	}
	for _, c := range g.Active.Cells() {
		if c[0] < 0 || c[0] >= Width {
			t.Errorf("kicked piece has out-of-bounds cell %v", c)
		}
	}
}

func TestCounterClockwiseRotation(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: T, Rotation: 0, X: 3, Y: 10}
	g.Input(ActionRotateCCW)
	if g.Active.Rotation != 3 {
		t.Errorf("ccw from 0 = %d, want 3", g.Active.Rotation)
	}
}
```

Add this test helper to `game_test.go` (used by many later tests):

```go
func hasEvent[E Event](evts []Event) bool {
	for _, e := range evts {
		if _, ok := e.(E); ok {
			return true
		}
	}
	return false
}

func findEvent[E Event](evts []Event) (E, bool) {
	for _, e := range evts {
		if v, ok := e.(E); ok {
			return v, true
		}
	}
	var zero E
	return zero, false
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'NewGame|Move|Rotation' -v`
Expected: FAIL — `undefined: New`.

- [ ] **Step 3: Implement `game.go` up to movement and rotation**

Write `New`, `Input` handling for `ActionLeft`/`ActionRight`/`ActionRotateCW`/`ActionRotateCCW`, plus internal helpers: `spawn()`, `emit(Event)`, `drain() []Event`, `tryMove(dx, dy int) bool`, `tryRotate(dir int) bool`, `refillNext()`, `updateGrounded()`, `resetLockTimer()`. Leave gravity, drops, hold and locking as stubs for the next steps.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -run 'NewGame|Move|Rotation' -v`
Expected: PASS.

- [ ] **Step 5: Write the failing gravity tests**

```go
func TestGravityDropsOneCellPerInterval(t *testing.T) {
	g := New(1)
	y := g.Active.Y
	g.Advance(GravityInterval(1) - time.Millisecond)
	if g.Active.Y != y {
		t.Error("piece dropped before the interval elapsed")
	}
	evts := g.Advance(2 * time.Millisecond)
	if g.Active.Y != y+1 {
		t.Errorf("Y = %d, want %d after one interval", g.Active.Y, y+1)
	}
	if !hasEvent[PieceMoved](evts) {
		t.Error("gravity step should emit PieceMoved")
	}
}

// Review Focus 1: a huge dt must step, not teleport.
func TestLargeDtStepsThroughTheStack(t *testing.T) {
	g := New(1)
	for x := 0; x < Width; x++ {
		g.Board.Set(x, 15, J) // a floor at row 15
	}
	g.Advance(30 * time.Second)
	for _, c := range g.Active.Cells() {
		if g.Board.At(c[0], c[1]) != Empty {
			t.Fatalf("active piece cell %v overlaps a locked cell: gravity teleported through the floor", c)
		}
		if c[1] > 14 {
			t.Fatalf("active piece cell %v is at or below the floor at row 15", c)
		}
	}
}

// Review Focus 2: degenerate dt.
func TestZeroAndNegativeDtAreNoOps(t *testing.T) {
	g := New(1)
	before := *g
	if evts := g.Advance(0); len(evts) != 0 {
		t.Errorf("Advance(0) emitted %#v", evts)
	}
	if evts := g.Advance(-5 * time.Second); len(evts) != 0 {
		t.Errorf("Advance(negative) emitted %#v", evts)
	}
	if g.Active != before.Active || g.GravityAccumulator != before.GravityAccumulator {
		t.Error("degenerate dt changed engine state")
	}
}

func TestGravityAcceleratesWithLevel(t *testing.T) {
	g := New(1)
	g.Level = 10
	y := g.Active.Y
	g.Advance(GravityInterval(10))
	if g.Active.Y != y+1 {
		t.Errorf("level 10 piece should drop after %v", GravityInterval(10))
	}
}

func TestGhostYIsTheLandingRow(t *testing.T) {
	g := New(1)
	for x := 0; x < Width; x++ {
		g.Board.Set(x, 18, J)
	}
	ghost := g.GhostY()
	probe := g.Active
	probe.Y = ghost
	if g.Board.Collides(probe) {
		t.Errorf("GhostY %d collides", ghost)
	}
	probe.Y = ghost + 1
	if !g.Board.Collides(probe) {
		t.Errorf("GhostY %d is not the lowest valid row", ghost)
	}
	if g.GhostY() < g.Active.Y {
		t.Error("GhostY must never be above the active piece")
	}
}
```

- [ ] **Step 6: Run the gravity tests to verify they fail**

Run: `go test ./internal/game/ -run 'Gravity|LargeDt|ZeroAndNegative|GhostY' -v`
Expected: FAIL — gravity is still a stub.

- [ ] **Step 7: Implement gravity and `GhostY`**

`Advance` guards `Over` and `dt <= 0`, accumulates, then loops one cell per elapsed interval as pinned above. `GhostY` copies `Active`, walks `Y` down while the copy does not collide, returns the last non-colliding `Y`.

- [ ] **Step 8: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game state, movement, wall kicks, gravity and ghost"
```

---

### Task 7: Locking, line clearing, scoring integration, hold

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/lock_test.go`, `internal/game/hold_test.go`

**Interfaces:**
- Consumes: Task 6's `Game`.
- Produces: `ActionSoftDrop`, `ActionHardDrop`, `ActionHold` behavior, and the post-lock sequence. No new exported names.

Pinned lock sequence (§12), in this exact order, all inside one `Advance`/`Input` call:

1. commit the piece to the board, emit `PieceLocked`
2. `Before := g.Board` (post-commit, pre-clear), `rows := g.Board.CompleteRows()`
3. if `len(rows) > 0`: `g.Board.ClearRows(rows)`, `g.Lines += len(rows)`, emit `LinesCleared{Rows: rows, Count: len(rows), Before: Before}`
4. update combo: clearing increments `g.Combo` (first clear → 1), a non-clearing lock sets it to 0; emit `ComboChanged` only when the value changed (§49.1)
5. `g.Score += LineScore(len(rows), g.Level) + ComboBonus(g.Combo, g.Level)` — scored at the level **before** any level-up this placement causes
6. if `LevelFor(g.Lines) != g.Level`: set it and emit `LevelChanged`
7. `g.CanHold = true`, then spawn the next piece (emitting `PieceSpawned`, or `GameOver` if blocked)

Hard drop: fall to `GhostY()`, add `HardDropPoints × cells`, emit `PieceHardDropped{Piece: landed, Cells: n}`, then run the lock sequence **immediately** — no lock delay.

Hold (§9): only when `CanHold`. If `Hold` is nil, store `Active.Kind` and spawn from the queue; otherwise swap `Active.Kind` with `*Hold` and respawn at `SpawnX, SpawnY` rotation 0. Set `CanHold = false` and emit `HoldUsed{Stored, Spawned}`. If the incoming piece collides at the spawn position, the game ends exactly as a blocked spawn does (Review Focus 3).

- [ ] **Step 1: Write the failing lock and clear tests**

```go
func groundedGame(t *testing.T) *Game {
	t.Helper()
	g := New(1)
	g.Active.Y = g.GhostY()
	g.Advance(time.Millisecond) // let the engine notice it is grounded
	if !g.Grounded {
		t.Fatal("setup: piece should be grounded")
	}
	return g
}

func TestLockHappensAfterLockDelay(t *testing.T) {
	g := groundedGame(t)
	if evts := g.Advance(LockDelay - 2*time.Millisecond); hasEvent[PieceLocked](evts) {
		t.Error("locked before the lock delay elapsed")
	}
	evts := g.Advance(5 * time.Millisecond)
	if !hasEvent[PieceLocked](evts) {
		t.Fatal("piece should lock after the lock delay")
	}
	if !hasEvent[PieceSpawned](evts) {
		t.Error("a new piece should spawn in the same call")
	}
}

func TestMovementWhileGroundedResetsLockTimer(t *testing.T) {
	g := groundedGame(t)
	g.Advance(400 * time.Millisecond)
	g.Input(ActionLeft)
	if g.LockAccumulator != 0 {
		t.Errorf("LockAccumulator = %v, want 0 after a grounded move", g.LockAccumulator)
	}
	if g.LockResets != 1 {
		t.Errorf("LockResets = %d, want 1", g.LockResets)
	}
	if evts := g.Advance(200 * time.Millisecond); hasEvent[PieceLocked](evts) {
		t.Error("timer reset should have prevented the lock")
	}
}

func TestLockResetsAreCapped(t *testing.T) {
	g := groundedGame(t)
	for i := 0; i < MaxLockResets+5; i++ {
		g.Advance(10 * time.Millisecond)
		g.Input(ActionLeft)
		g.Input(ActionRight)
	}
	if g.LockResets > MaxLockResets {
		t.Errorf("LockResets = %d, want <= %d", g.LockResets, MaxLockResets)
	}
	var locked bool
	for i := 0; i < 200; i++ {
		g.Advance(10 * time.Millisecond)
		if evts := g.Input(ActionLeft); hasEvent[PieceLocked](evts) {
			locked = true
			break
		}
		if g.LockAccumulator >= LockDelay {
			locked = true
			break
		}
	}
	if !locked {
		t.Error("a piece must eventually lock even under continuous nudging")
	}
}

func TestSoftDropScoresAndResetsGravity(t *testing.T) {
	g := New(1)
	y := g.Active.Y
	g.Advance(100 * time.Millisecond)
	g.Input(ActionSoftDrop)
	if g.Active.Y != y+1 {
		t.Errorf("Y = %d, want %d", g.Active.Y, y+1)
	}
	if g.Score != SoftDropPoints {
		t.Errorf("Score = %d, want %d", g.Score, SoftDropPoints)
	}
	if g.GravityAccumulator != 0 {
		t.Errorf("GravityAccumulator = %v, want 0", g.GravityAccumulator)
	}
}

func TestSoftDropOnTheFloorScoresNothing(t *testing.T) {
	g := groundedGame(t)
	before := g.Score
	g.Input(ActionSoftDrop)
	if g.Score != before {
		t.Errorf("Score = %d, want unchanged %d", g.Score, before)
	}
}

func TestHardDropScoresPerCellAndLocksImmediately(t *testing.T) {
	g := New(1)
	from := g.Active.Y
	to := g.GhostY()
	evts := g.Input(ActionHardDrop)
	hd, ok := findEvent[PieceHardDropped](evts)
	if !ok {
		t.Fatal("expected PieceHardDropped")
	}
	if hd.Cells != to-from {
		t.Errorf("Cells = %d, want %d", hd.Cells, to-from)
	}
	if g.Score != HardDropPoints*(to-from) {
		t.Errorf("Score = %d, want %d", g.Score, HardDropPoints*(to-from))
	}
	if !hasEvent[PieceLocked](evts) {
		t.Error("hard drop must lock without waiting for the lock delay")
	}
}

// Review Focus 4 partner test for a grounded hard drop.
func TestHardDropWhileGroundedScoresZeroAndLocks(t *testing.T) {
	g := groundedGame(t)
	before := g.Score
	evts := g.Input(ActionHardDrop)
	if g.Score != before {
		t.Errorf("Score = %d, want unchanged %d", g.Score, before)
	}
	if !hasEvent[PieceLocked](evts) {
		t.Error("a grounded hard drop should still lock")
	}
}

func TestLineClearScoresAndReportsBeforeBoard(t *testing.T) {
	g := New(1)
	// Fill row 21 except the two columns the O piece will occupy.
	for x := 0; x < Width; x++ {
		if x == 4 || x == 5 {
			continue
		}
		g.Board.Set(x, 21, J)
	}
	g.Active = Piece{Kind: O, Rotation: 0, X: 3, Y: 19} // O fills cols 4,5
	evts := g.Input(ActionHardDrop)
	lc, ok := findEvent[LinesCleared](evts)
	if !ok {
		t.Fatal("expected LinesCleared")
	}
	if lc.Count != 1 || !reflect.DeepEqual(lc.Rows, []int{21}) {
		t.Errorf("LinesCleared = %+v, want 1 row [21]", lc)
	}
	for x := 0; x < Width; x++ {
		if lc.Before.At(x, 21) == Empty {
			t.Errorf("Before board should show row 21 full; col %d is empty", x)
		}
	}
	if g.Board.At(0, 21) != Empty {
		t.Error("live board should already be cleared")
	}
	if g.Lines != 1 {
		t.Errorf("Lines = %d, want 1", g.Lines)
	}
	if g.Combo != 1 {
		t.Errorf("Combo = %d, want 1 after the first clear", g.Combo)
	}
	// 100*1 line score + 0 combo bonus + 2 hard drop points per cell.
	if g.Score < 100 {
		t.Errorf("Score = %d, want at least the 100-point line value", g.Score)
	}
}

func TestComboResetsOnANonClearingPlacement(t *testing.T) {
	g := New(1)
	g.Combo = 3
	g.Active = Piece{Kind: O, Rotation: 0, X: 3, Y: 0}
	evts := g.Input(ActionHardDrop)
	if g.Combo != 0 {
		t.Errorf("Combo = %d, want 0", g.Combo)
	}
	if cc, ok := findEvent[ComboChanged](evts); !ok || cc.Combo != 0 {
		t.Errorf("expected ComboChanged{0}, got %+v ok=%v", cc, ok)
	}
}

func TestFourLineClearScoresEightHundredTimesLevel(t *testing.T) {
	g := New(1)
	g.Level = 2
	for y := 18; y <= 21; y++ {
		for x := 0; x < Width; x++ {
			if x == 4 {
				continue
			}
			g.Board.Set(x, y, J)
		}
	}
	g.Active = Piece{Kind: I, Rotation: 1, X: 2, Y: 18} // vertical I in column 4
	before := g.Score
	evts := g.Input(ActionHardDrop)
	lc, _ := findEvent[LinesCleared](evts)
	if lc.Count != 4 {
		t.Fatalf("Count = %d, want 4", lc.Count)
	}
	if g.Score-before < 1600 {
		t.Errorf("score gain = %d, want at least 800*2", g.Score-before)
	}
}

func TestLevelUpEveryTenLines(t *testing.T) {
	g := New(1)
	g.Lines = 9
	for x := 0; x < Width; x++ {
		if x == 4 || x == 5 {
			continue
		}
		g.Board.Set(x, 21, J)
	}
	g.Active = Piece{Kind: O, Rotation: 0, X: 3, Y: 19}
	evts := g.Input(ActionHardDrop)
	if g.Level != 2 {
		t.Errorf("Level = %d, want 2 at 10 lines", g.Level)
	}
	if lv, ok := findEvent[LevelChanged](evts); !ok || lv.Level != 2 {
		t.Errorf("expected LevelChanged{2}, got %+v ok=%v", lv, ok)
	}
}

// Review Focus 5: a piece that locks entirely in the hidden rows.
func TestLockInHiddenRowsCommitsCells(t *testing.T) {
	g := New(1)
	for y := 2; y < Height; y++ {
		for x := 0; x < Width; x++ {
			g.Board.Set(x, y, J) // stack right up to the hidden rows
		}
	}
	g.Active = Piece{Kind: O, Rotation: 0, X: 3, Y: 0}
	g.Input(ActionHardDrop)
	if g.Board.At(4, 0) == Empty || g.Board.At(4, 1) == Empty {
		t.Error("cells locked in the hidden rows must be committed to the board")
	}
}
```

- [ ] **Step 2: Run the lock tests to verify they fail**

Run: `go test ./internal/game/ -run 'Lock|SoftDrop|HardDrop|LineClear|Combo|FourLine|LevelUp|Hidden' -v`
Expected: FAIL — drops and locking are stubs.

- [ ] **Step 3: Implement locking, drops and the post-lock sequence in `game.go`**

Follow the pinned seven-step sequence exactly, in a private `lockPiece()` used by both the lock-delay path in `Advance` and the hard-drop path in `Input`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Write the failing hold tests**

```go
func TestFirstHoldStoresActiveAndSpawnsNext(t *testing.T) {
	g := New(1)
	stored := g.Active.Kind
	wantNext := g.Next[0]
	evts := g.Input(ActionHold)
	if g.Hold == nil || *g.Hold != stored {
		t.Errorf("Hold = %v, want %v", g.Hold, stored)
	}
	if g.Active.Kind != wantNext {
		t.Errorf("Active = %v, want the queue head %v", g.Active.Kind, wantNext)
	}
	if g.CanHold {
		t.Error("CanHold should be false after a hold")
	}
	if hu, ok := findEvent[HoldUsed](evts); !ok || hu.Stored != stored || hu.Spawned != wantNext {
		t.Errorf("HoldUsed = %+v ok=%v, want {Stored:%v Spawned:%v}", hu, ok, stored, wantNext)
	}
	if len(g.Next) != NextQueueLen {
		t.Errorf("Next has %d entries, want %d", len(g.Next), NextQueueLen)
	}
}

func TestSecondHoldIsBlockedUntilLock(t *testing.T) {
	g := New(1)
	g.Input(ActionHold)
	held, active := *g.Hold, g.Active.Kind
	if evts := g.Input(ActionHold); len(evts) != 0 {
		t.Errorf("second hold should emit nothing, got %#v", evts)
	}
	if *g.Hold != held || g.Active.Kind != active {
		t.Error("second hold changed state")
	}
}

func TestHoldIsRestoredAfterLock(t *testing.T) {
	g := New(1)
	g.Input(ActionHold)
	g.Input(ActionHardDrop)
	if !g.CanHold {
		t.Error("CanHold should be true again after the piece locks")
	}
}

func TestHoldSwapReturnsToSpawnRotation(t *testing.T) {
	g := New(1)
	g.Input(ActionHold)
	g.Input(ActionRotateCW)
	g.Input(ActionHardDrop) // clears the hold lock
	g.Input(ActionRotateCW)
	g.Input(ActionHold)
	if g.Active.Rotation != 0 {
		t.Errorf("held piece spawned at rotation %d, want 0", g.Active.Rotation)
	}
	if g.Active.X != SpawnX || g.Active.Y != SpawnY {
		t.Errorf("held piece spawned at (%d,%d), want (%d,%d)", g.Active.X, g.Active.Y, SpawnX, SpawnY)
	}
}

// Review Focus 3: holding into a blocked spawn.
func TestHoldIntoABlockedSpawnEndsTheGame(t *testing.T) {
	g := New(1)
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			g.Board.Set(x, y, J)
		}
	}
	g.Active = Piece{Kind: T, Rotation: 0, X: SpawnX, Y: SpawnY}
	evts := g.Input(ActionHold)
	if !g.Over {
		t.Error("holding into a fully blocked board should end the game")
	}
	if !hasEvent[GameOver](evts) {
		t.Error("expected a GameOver event")
	}
}
```

- [ ] **Step 6: Run the hold tests to verify they fail**

Run: `go test ./internal/game/ -run Hold -v`
Expected: FAIL — hold is a stub.

- [ ] **Step 7: Implement hold in `game.go`**

- [ ] **Step 8: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add internal/game/game.go internal/game/lock_test.go internal/game/hold_test.go
git commit -m "feat(game): locking, line clears, scoring integration and hold"
```

---

### Task 8: Game over

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/gameover_test.go`

**Interfaces:**
- Consumes: Task 7's lock sequence.
- Produces: `Over bool` semantics — once true, `Input` and `Advance` return `nil` and change nothing.

- [ ] **Step 1: Write the failing tests**

```go
func TestBlockedSpawnEndsTheGame(t *testing.T) {
	g := New(1)
	for y := 0; y < HiddenRows+2; y++ {
		for x := 0; x < Width; x++ {
			g.Board.Set(x, y, J)
		}
	}
	g.Active = Piece{Kind: O, Rotation: 0, X: SpawnX, Y: 18}
	evts := g.Input(ActionHardDrop)
	if !g.Over {
		t.Fatal("Over should be true when the next piece cannot spawn")
	}
	go_, ok := findEvent[GameOver](evts)
	if !ok {
		t.Fatal("expected a GameOver event")
	}
	if go_.Score != g.Score || go_.Lines != g.Lines || go_.Level != g.Level {
		t.Errorf("GameOver = %+v, want score %d lines %d level %d", go_, g.Score, g.Lines, g.Level)
	}
}

// Review Focus 4: everything is inert after game over.
func TestInputAndAdvanceAreInertAfterGameOver(t *testing.T) {
	g := New(1)
	g.Over = true
	before := *g
	for _, a := range []Action{ActionLeft, ActionRight, ActionSoftDrop, ActionHardDrop, ActionRotateCW, ActionRotateCCW, ActionHold} {
		if evts := g.Input(a); len(evts) != 0 {
			t.Errorf("Input(%v) after game over emitted %#v", a, evts)
		}
	}
	if evts := g.Advance(5 * time.Second); len(evts) != 0 {
		t.Errorf("Advance after game over emitted %#v", evts)
	}
	if g.Active != before.Active || g.Score != before.Score || g.Board != before.Board {
		t.Error("state changed after game over")
	}
}

func TestGameOverIsEmittedOnlyOnce(t *testing.T) {
	g := New(1)
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			g.Board.Set(x, y, J)
		}
	}
	g.Active = Piece{Kind: O, Rotation: 0, X: SpawnX, Y: SpawnY}
	first := g.Input(ActionHardDrop)
	if !hasEvent[GameOver](first) {
		t.Fatal("expected GameOver on the first lock")
	}
	if evts := g.Advance(time.Second); hasEvent[GameOver](evts) {
		t.Error("GameOver emitted a second time")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'GameOver|Blocked|Inert' -v`
Expected: FAIL.

- [ ] **Step 3: Implement the guards**

Early-return in `Input` and `Advance` when `g.Over`. In `spawn()`, when the new piece collides at the spawn position, set `Over` and emit `GameOver{Score, Lines, Level}`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/gameover_test.go
git commit -m "feat(game): game over on blocked spawn, inert engine afterwards"
```

---

### Task 9: Determinism replay test and clock-free enforcement

**Files:**
- Create: `internal/game/determinism_test.go`, `internal/game/testdata/replay.golden`
- Create: `internal/game/clockfree_test.go`

**Interfaces:**
- Consumes: the whole engine.
- Produces: the guarantee plan 2 and 3 rely on — identical seed plus identical `(Action, dt)` stream yields identical state (§35, §49.2).

- [ ] **Step 1: Write the replay test**

```go
type step struct {
	action  Action
	hasAct  bool
	dt      time.Duration
}

// cannedStream is a fixed input script: rotations, walks, soft and hard
// drops interleaved with elapsed time.
func cannedStream() []step {
	var out []step
	acts := []Action{ActionLeft, ActionRotateCW, ActionRight, ActionSoftDrop,
		ActionRotateCCW, ActionHold, ActionHardDrop, ActionRight, ActionLeft}
	for i := 0; i < 400; i++ {
		out = append(out, step{dt: time.Duration(7+i%13) * time.Millisecond})
		if i%3 == 0 {
			out = append(out, step{action: acts[i%len(acts)], hasAct: true})
		}
	}
	return out
}

func replay(seed int64) *Game {
	g := New(seed)
	for _, s := range cannedStream() {
		if s.hasAct {
			g.Input(s.action)
		} else {
			g.Advance(s.dt)
		}
	}
	return g
}

func summarize(g *Game) string {
	var sb strings.Builder
	fmt.Fprintf(&sb, "score=%d lines=%d level=%d combo=%d over=%v\n", g.Score, g.Lines, g.Level, g.Combo, g.Over)
	fmt.Fprintf(&sb, "active=%v rot=%d x=%d y=%d\n", g.Active.Kind, g.Active.Rotation, g.Active.X, g.Active.Y)
	hold := "none"
	if g.Hold != nil {
		hold = g.Hold.String()
	}
	fmt.Fprintf(&sb, "hold=%s canhold=%v\n", hold, g.CanHold)
	fmt.Fprintf(&sb, "next=%v\n", g.Next)
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			sb.WriteString(g.Board.At(x, y).String())
		}
		sb.WriteByte('\n')
	}
	return sb.String()
}

func TestReplayIsReproducible(t *testing.T) {
	a, b := summarize(replay(8675309)), summarize(replay(8675309))
	if a != b {
		t.Errorf("same seed and stream produced different states:\n--- a ---\n%s\n--- b ---\n%s", a, b)
	}
}

func TestReplayMatchesGolden(t *testing.T) {
	got := summarize(replay(8675309))
	path := filepath.Join("testdata", "replay.golden")
	if *update {
		if err := os.WriteFile(path, []byte(got), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	want, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if got != string(want) {
		t.Errorf("replay drifted from the golden state.\n--- got ---\n%s\n--- want ---\n%s", got, want)
	}
}

func TestDifferentSeedsProduceDifferentReplays(t *testing.T) {
	if summarize(replay(1)) == summarize(replay(2)) {
		t.Error("seeds 1 and 2 produced identical final states")
	}
}
```

Declare the update flag once in this file:

```go
var update = flag.Bool("update", false, "rewrite golden files")
```

- [ ] **Step 2: Generate the golden file and confirm the test passes**

Run: `go test ./internal/game/ -run Replay -update && go test ./internal/game/ -run Replay -v`
Expected: `testdata/replay.golden` is created; tests PASS. Inspect the golden file — it should show a plausible board with a non-zero score. If the game ended immediately or the board is empty, the canned stream is wrong, not the engine.

- [ ] **Step 3: Write the clock-free enforcement test**

```go
// §49.2: nothing in this package may read a clock or a global RNG.
func TestPackageNeverReadsAClock(t *testing.T) {
	banned := []string{"time.Now(", "time.Since(", "time.Tick(", "time.After(",
		"rand.Int(", "rand.Intn(", "rand.Float64(", "rand.Shuffle(", "rand.Perm("}
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
		for _, b := range banned {
			if strings.Contains(string(src), b) {
				t.Errorf("%s uses %s — the engine must take time and randomness as inputs (design.md §49.2, §49.6)", name, b)
			}
		}
	}
}

func TestGameOwnsItsRNGAndSeedIsRecorded(t *testing.T) {
	g := New(4242)
	if g.Seed != 4242 {
		t.Errorf("Seed = %d, want 4242", g.Seed)
	}
	if g.rng == nil {
		t.Error("Game must own a *rand.Rand")
	}
}
```

- [ ] **Step 4: Run it**

Run: `go test ./internal/game/ -run 'Clock|RNG' -v`
Expected: PASS. If it fails, fix the source — not the test.

- [ ] **Step 5: Run the whole suite with the race detector and vet**

Run: `go test -race ./... && go vet ./... && gofmt -l .`
Expected: PASS, no vet findings, `gofmt -l` prints nothing.

- [ ] **Step 6: Commit**

```bash
git add internal/game/determinism_test.go internal/game/clockfree_test.go internal/game/testdata/replay.golden
git commit -m "test(game): deterministic replay golden and clock-free enforcement"
```

---

## Done when

- `go test -race ./...` passes; `go vet ./...` clean; `gofmt -l .` empty.
- Every §40 engine category has tests: board (collision, bounds, completion, removal, collapse), pieces (all rotations, kicks, failed rotation, spawn), bag (complete bags, reproducibility), hold (initial, swap, blocked second, restored), drops (soft, hard, landing, lock), score (line values, combo, drop points, level), game over (blocked spawn, state transition), determinism (replay).
- `internal/game` imports only the standard library, and the clock-free test passes.
