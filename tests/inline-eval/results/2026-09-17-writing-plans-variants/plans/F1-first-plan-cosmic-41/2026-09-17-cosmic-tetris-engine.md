# Cosmic Tetris — Phase 1: Deterministic Game Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete headless `internal/game` engine for Cosmic Tetris — pieces, board, 7-bag, movement, wall kicks, gravity, lock delay, line clearing, hold, scoring, game over, and the game-event stream — with the comprehensive test suite design.md §40 requires, so that Phase 2 can put a Bubble Tea UI on top of a proven engine.

**Architecture:** A single Go package, `internal/game`, depending only on the standard library. The engine is a pure state machine: it never reads a clock (design.md §49.2 — Bubble Tea passes elapsed time in via `Advance(dt)`), it owns one `*rand.Rand` that drives only the 7-bag (§49.6), and every state transition returns a `[]Event` slice that the future FX world observes without being able to write back (§14). Board and piece geometry are plain value types so tests can construct exact positions and compare whole boards.

**Tech Stack:** Go 1.26, standard library only (`math`, `math/rand`, `time`, plus `os`/`strings`/`fmt`/`reflect` in tests). No third-party dependencies in this phase — Bubble Tea, Lip Gloss, and Bubbles arrive in Phase 2.

**Spec:** `design.md` (this repository root). Section references below (`§7`, `§49.2`, …) are to that document. Where §1–48 and §49 disagree, §49 wins.

## Global Constraints

- Language: Go. Module path: `cosmic-tetris`. `go.mod` declares `go 1.26`.
- `internal/game` imports **only** the Go standard library. No third-party dependency may be added in this phase.
- Nothing under `internal/game` may call `time.Now()` or otherwise read a clock (§49.2). Timing is an input: `func (g *Game) Advance(dt time.Duration) []Event`.
- Board geometry is fixed: width 10, height 22, 20 visible rows, 2 hidden spawn rows (§5).
- The game RNG drives the 7-bag and nothing else. FX gets a separate, independent `*rand.Rand` in a later phase; the two never share (§49.6).
- Combo indexing and bonus are §49.1: the first clearing placement sets combo to 1; a placement clearing nothing resets combo to 0; `bonus = 50 × (combo - 1) × level`.
- Wall-kick offsets are exactly §7's eight offsets, tried in that order; first valid position wins; otherwise the rotation fails.
- Gravity: `interval = 800ms × 0.86^(level-1)`, clamped to a floor of 60ms; level rises every 10 cleared lines (§11).
- Lock delay 500ms; a successful move or rotation while grounded resets it; at most 15 resets per piece (§12).
- File layout follows §33 exactly. The one addition is `internal/game/events.go`, because §14 requires nine event types and keeping them out of `game.go` is what §33's "keep the repository obvious" is asking for.
- Effects never modify game state (§14, §44). This phase enforces that structurally: the engine has no reference to any FX type, and events are values.
- Commit style: conventional commits (`feat:`, `test:`, `chore:`). Commit at the end of every task.

## Review Focus

These are the input classes design.md implies but never names, ordered by how likely they are to bite a real player. Each one's test is assigned to the task that owns the code.

1. **A huge `dt`** — the player backgrounds the terminal, closes the laptop, or the process is SIGSTOPped, and the next frame reports 30 seconds of elapsed time. The piece must not teleport down the board or skip its lock delay; catch-up is bounded. (Task 7)
2. **A non-positive `dt`** — two frames land inside the same clock tick, or the wall clock steps backwards during an NTP correction. `Advance` must be a no-op, never rewinding state or spinning in the gravity loop. (Task 7)
3. **Very high levels** — a strong player reaching level 40+ must not hit a zero or negative gravity interval, which would make the gravity loop spin forever and hang the UI thread. (Task 4)
4. **Rotation against the ceiling** — §7's kick list includes `(0,-1)`, `(-1,-1)`, `(1,-1)`, which push cells above row 0 while a piece is in the hidden spawn rows. That must be rejected by a bounds check, not panic on a negative slice index. (Tasks 2 and 6)
5. **Spawning into a full stack** — when the stack reaches the spawn rows, both a normal spawn and a hold-swap must end the game rather than leave an active piece embedded inside locked cells. (Tasks 5 and 9)

---

### Task 1: Module bootstrap and piece geometry

Creates the module and the piece tables everything else is built on: seven kinds, four rotations each, and the absolute-cell computation. Also installs the architecture test that keeps the engine clock-free for the rest of the project.

**Files:**
- Create: `go.mod`
- Create: `README.md`
- Create: `internal/game/rules.go`
- Create: `internal/game/piece.go`
- Test: `internal/game/piece_test.go`
- Test: `internal/game/arch_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type PieceKind int`, constants `I, J, L, O, S, T, Z PieceKind`, `const KindCount = 7`, `func (k PieceKind) String() string`
  - `type Point struct{ X, Y int }`
  - `type Piece struct{ Kind PieceKind; Rotation, X, Y int }`
  - `func (p Piece) Cells() [4]Point`, `func (p Piece) Moved(dx, dy int) Piece`, `func (p Piece) Rotated(dir int) Piece`
  - `func SpawnPiece(k PieceKind) Piece`
  - constants `Width, Height, HiddenRows, VisibleRows, SpawnX, SpawnY, NextCount, LinesPerLevel, SoftDropPoints, HardDropPoints`, `BaseGravity, GravityFactor, MinGravity, LockDelay, MaxLockResets, MaxAdvanceStep`, and `var kickOffsets [8]Point`

- [ ] **Step 1: Create the module and README**

```bash
cd "$(git rev-parse --show-toplevel)"
mkdir -p cmd/cosmic-tetris internal/game
cat > go.mod <<'EOF'
module cosmic-tetris

go 1.26
EOF
```

`README.md`:

```markdown
# Cosmic Tetris

A falling-block puzzle game occurring during a completely unnecessary
cosmological emergency. See `design.md` for the build spec.

## Status

Phase 1: headless game engine (`internal/game`). Not yet playable.

## Development

    go test ./...
    go vet ./...

The engine in `internal/game` never reads a clock: it advances via
`Advance(dt)` so that a seed plus an input-and-timing stream reproduces a
game exactly (design.md §35, §49.2).
```

- [ ] **Step 2: Write the rules constants**

These are data, not behavior — the numbers every later task cites, in one place. Create `internal/game/rules.go`:

```go
// Package game is the headless Cosmic Tetris engine. It is deterministic and
// clock-free: callers pass elapsed time in through Advance (design.md §49.2).
package game

import "time"

// Board geometry (design.md §5).
const (
	Width       = 10
	Height      = 22
	HiddenRows  = 2
	VisibleRows = Height - HiddenRows
)

// Spawn position: the top-left corner of a piece's 4x4 rotation box, placed so
// the piece is horizontally centred and starts in the hidden rows.
const (
	SpawnX = 3
	SpawnY = 0
)

// NextCount is how many upcoming pieces stay visible (design.md §6).
const NextCount = 5

// LinesPerLevel is how many cleared lines advance the level (design.md §11).
const LinesPerLevel = 10

// Drop scoring, in points per cell descended (design.md §11).
const (
	SoftDropPoints = 1
	HardDropPoints = 2
)

// Timing (design.md §11, §12).
const (
	BaseGravity   = 800 * time.Millisecond
	GravityFactor = 0.86
	MinGravity    = 60 * time.Millisecond

	LockDelay     = 500 * time.Millisecond
	MaxLockResets = 15

	// MaxAdvanceStep bounds how much elapsed time one Advance call may apply.
	// A backgrounded terminal can report multi-second frames; without this the
	// piece would fall the whole board in a single frame.
	MaxAdvanceStep = 250 * time.Millisecond
)

// kickOffsets are tried in order when a rotation is blocked (design.md §7).
// The first offset that yields a valid position wins; if none do, the rotation
// fails.
var kickOffsets = [8]Point{
	{0, 0}, {-1, 0}, {1, 0}, {-2, 0}, {2, 0}, {0, -1}, {-1, -1}, {1, -1},
}
```

- [ ] **Step 3: Write the failing piece tests**

Create `internal/game/piece_test.go`:

```go
package game

import "testing"

func TestEveryRotationHasFourCellsInsideItsBox(t *testing.T) {
	for k := PieceKind(0); k < KindCount; k++ {
		for r := 0; r < 4; r++ {
			p := Piece{Kind: k, Rotation: r, X: 0, Y: 0}
			cells := p.Cells()
			seen := map[Point]bool{}
			for _, c := range cells {
				if c.X < 0 || c.X > 3 || c.Y < 0 || c.Y > 3 {
					t.Errorf("%v rotation %d: cell %v outside the 4x4 box", k, r, c)
				}
				if seen[c] {
					t.Errorf("%v rotation %d: duplicate cell %v", k, r, c)
				}
				seen[c] = true
			}
			if len(seen) != 4 {
				t.Errorf("%v rotation %d: got %d distinct cells, want 4", k, r, len(seen))
			}
		}
	}
}

func TestKindNames(t *testing.T) {
	want := []struct {
		kind PieceKind
		name string
	}{{I, "I"}, {J, "J"}, {L, "L"}, {O, "O"}, {S, "S"}, {T, "T"}, {Z, "Z"}}
	for _, w := range want {
		if got := w.kind.String(); got != w.name {
			t.Errorf("PieceKind(%d).String() = %q, want %q", w.kind, got, w.name)
		}
	}
	if got := PieceKind(99).String(); got != "?" {
		t.Errorf("out-of-range kind printed %q, want %q", got, "?")
	}
}

func TestIPieceRotationsAreHorizontalThenVertical(t *testing.T) {
	flat := Piece{Kind: I, Rotation: 0}.Cells()
	for _, c := range flat {
		if c.Y != 1 {
			t.Errorf("I rotation 0 cell %v: want every cell on row 1", c)
		}
	}
	tall := Piece{Kind: I, Rotation: 1}.Cells()
	for _, c := range tall {
		if c.X != 2 {
			t.Errorf("I rotation 1 cell %v: want every cell in column 2", c)
		}
	}
}

// I, S and Z are two-state pieces: rotations 2 and 3 repeat 0 and 1. O is
// identical in all four (design.md §6). This test documents that choice so a
// later change to the tables is deliberate rather than accidental.
func TestTwoStateAndSymmetricPieces(t *testing.T) {
	for _, k := range []PieceKind{I, S, Z} {
		if (Piece{Kind: k, Rotation: 2}).Cells() != (Piece{Kind: k, Rotation: 0}).Cells() {
			t.Errorf("%v: rotation 2 should repeat rotation 0", k)
		}
		if (Piece{Kind: k, Rotation: 3}).Cells() != (Piece{Kind: k, Rotation: 1}).Cells() {
			t.Errorf("%v: rotation 3 should repeat rotation 1", k)
		}
	}
	base := Piece{Kind: O, Rotation: 0}.Cells()
	for r := 1; r < 4; r++ {
		if (Piece{Kind: O, Rotation: r}).Cells() != base {
			t.Errorf("O: rotation %d differs from rotation 0", r)
		}
	}
}

func TestSpawnPiecePosition(t *testing.T) {
	p := SpawnPiece(T)
	if p.Kind != T || p.Rotation != 0 || p.X != SpawnX || p.Y != SpawnY {
		t.Fatalf("SpawnPiece(T) = %+v, want kind T rotation 0 at (%d,%d)", p, SpawnX, SpawnY)
	}
	for _, c := range p.Cells() {
		if c.Y >= HiddenRows {
			t.Errorf("spawned cell %v is already visible; spawn belongs in the hidden rows", c)
		}
		if c.X < 0 || c.X >= Width {
			t.Errorf("spawned cell %v is outside the board width", c)
		}
	}
}

func TestMovedAndRotatedReturnCopies(t *testing.T) {
	p := Piece{Kind: J, Rotation: 0, X: 4, Y: 5}
	if got := p.Moved(-1, 2); got.X != 3 || got.Y != 7 {
		t.Errorf("Moved(-1,2) = (%d,%d), want (3,7)", got.X, got.Y)
	}
	if p.X != 4 || p.Y != 5 {
		t.Errorf("Moved mutated the receiver: %+v", p)
	}
	if got := p.Rotated(1); got.Rotation != 1 {
		t.Errorf("Rotated(1).Rotation = %d, want 1", got.Rotation)
	}
	if got := p.Rotated(-1); got.Rotation != 3 {
		t.Errorf("Rotated(-1).Rotation = %d, want 3 (wrap)", got.Rotation)
	}
	if got := (Piece{Kind: J, Rotation: 3}).Rotated(1); got.Rotation != 0 {
		t.Errorf("rotation 3 clockwise = %d, want 0 (wrap)", got.Rotation)
	}
}
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'Piece|Kind|Spawn|Moved|TwoState' -v`
Expected: FAIL — the package does not compile, with errors like `undefined: PieceKind`, `undefined: SpawnPiece`.

- [ ] **Step 5: Implement piece geometry**

Create `internal/game/piece.go`:

```go
package game

// PieceKind identifies one of the seven tetromino families (design.md §6).
type PieceKind int

const (
	I PieceKind = iota
	J
	L
	O
	S
	T
	Z
)

// KindCount is how many tetromino families exist.
const KindCount = 7

func (k PieceKind) String() string {
	if k < 0 || k >= KindCount {
		return "?"
	}
	return "IJLOSTZ"[k : k+1]
}

// Point is a board coordinate. Y grows downward: row 0 is the top hidden row,
// row Height-1 is the floor.
type Point struct {
	X, Y int
}

// Piece is the active tetromino: a kind, a rotation index 0-3, and the board
// position of the top-left corner of its 4x4 rotation box.
type Piece struct {
	Kind     PieceKind
	Rotation int
	X        int
	Y        int
}

// shapes[kind][rotation] is a 4x4 mask, one string per row, 'X' for a filled
// cell. Four predefined rotations per piece (design.md §6, §7): I, S and Z
// repeat rotations 0 and 1 in slots 2 and 3, and O is identical throughout.
var shapes = [KindCount][4][4]string{
	{ // I
		{"....", "XXXX", "....", "...."},
		{"..X.", "..X.", "..X.", "..X."},
		{"....", "XXXX", "....", "...."},
		{"..X.", "..X.", "..X.", "..X."},
	},
	{ // J
		{"X...", "XXX.", "....", "...."},
		{".XX.", ".X..", ".X..", "...."},
		{"....", "XXX.", "..X.", "...."},
		{".X..", ".X..", "XX..", "...."},
	},
	{ // L
		{"..X.", "XXX.", "....", "...."},
		{".X..", ".X..", ".XX.", "...."},
		{"....", "XXX.", "X...", "...."},
		{"XX..", ".X..", ".X..", "...."},
	},
	{ // O
		{".XX.", ".XX.", "....", "...."},
		{".XX.", ".XX.", "....", "...."},
		{".XX.", ".XX.", "....", "...."},
		{".XX.", ".XX.", "....", "...."},
	},
	{ // S
		{".XX.", "XX..", "....", "...."},
		{"X...", "XX..", ".X..", "...."},
		{".XX.", "XX..", "....", "...."},
		{"X...", "XX..", ".X..", "...."},
	},
	{ // T
		{".X..", "XXX.", "....", "...."},
		{".X..", ".XX.", ".X..", "...."},
		{"....", "XXX.", ".X..", "...."},
		{".X..", "XX..", ".X..", "...."},
	},
	{ // Z
		{"XX..", ".XX.", "....", "...."},
		{"..X.", ".XX.", ".X..", "...."},
		{"XX..", ".XX.", "....", "...."},
		{"..X.", ".XX.", ".X..", "...."},
	},
}

// Cells returns the four absolute board coordinates the piece occupies.
// Returning an array keeps this allocation-free: it runs inside collision
// checks on every frame (design.md §38).
func (p Piece) Cells() [4]Point {
	var out [4]Point
	n := 0
	for dy, row := range shapes[p.Kind][p.Rotation&3] {
		for dx := 0; dx < 4; dx++ {
			if row[dx] == 'X' {
				out[n] = Point{X: p.X + dx, Y: p.Y + dy}
				n++
			}
		}
	}
	return out
}

// Moved returns the piece translated by (dx, dy).
func (p Piece) Moved(dx, dy int) Piece {
	p.X += dx
	p.Y += dy
	return p
}

// Rotated returns the piece rotated by dir: +1 clockwise, -1 counter-clockwise.
func (p Piece) Rotated(dir int) Piece {
	p.Rotation = ((p.Rotation+dir)%4 + 4) % 4
	return p
}

// SpawnPiece returns a fresh piece at the spawn position in spawn rotation.
func SpawnPiece(k PieceKind) Piece {
	return Piece{Kind: k, Rotation: 0, X: SpawnX, Y: SpawnY}
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS for all six tests.

- [ ] **Step 7: Add the clock-free architecture test**

This one passes on arrival — it exists to fail later, if someone reaches for `time.Now()` inside the engine. Note it skips its own filename, because its message contains the very string it searches for. Create `internal/game/arch_test.go`:

```go
package game

import (
	"os"
	"strings"
	"testing"
)

// The engine takes elapsed time as an input and must never read a clock
// (design.md §49.2). That is what makes the determinism promise in §35
// testable, so it is worth guarding mechanically.
func TestEngineNeverReadsTheClock(t *testing.T) {
	entries, err := os.ReadDir(".")
	if err != nil {
		t.Fatalf("reading package directory: %v", err)
	}
	for _, e := range entries {
		name := e.Name()
		if e.IsDir() || !strings.HasSuffix(name, ".go") || name == "arch_test.go" {
			continue
		}
		src, err := os.ReadFile(name)
		if err != nil {
			t.Fatalf("reading %s: %v", name, err)
		}
		if strings.Contains(string(src), "time.Now") {
			t.Errorf("%s reads the clock; the engine must take dt as an input (design.md §49.2)", name)
		}
	}
}
```

- [ ] **Step 8: Run the full package tests and vet**

Run: `go test ./... && go vet ./...`
Expected: PASS, no vet diagnostics.

- [ ] **Step 9: Commit**

```bash
git add go.mod README.md internal/game/rules.go internal/game/piece.go internal/game/piece_test.go internal/game/arch_test.go
git commit -m "feat(game): tetromino geometry, rules constants, clock-free guard"
```

---

### Task 2: Board — collision, locking, row completion, collapse

The board is the only mutable spatial structure in the engine. Everything about legality lives here, including the bounds check that stops §7's upward kicks from indexing above row 0.

**Files:**
- Create: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Piece`, `Point`, `Width`, `Height`, `PieceKind` (Task 1).
- Produces:
  - `type Cell uint8`, `const Empty Cell = 0`, `func cellFor(k PieceKind) Cell`, `func (c Cell) Kind() PieceKind`
  - `type Board struct{ Cells [Height][Width]Cell }`
  - `func (b *Board) InBounds(x, y int) bool`, `At(x, y int) Cell`, `Set(x, y int, c Cell)`, `Occupied(x, y int) bool`
  - `func (b *Board) Collides(p Piece) bool`
  - `func (b *Board) Lock(p Piece)`
  - `func (b *Board) CompleteRows() []int`
  - `func (b *Board) ClearRows(rows []int)`
  - test helper `func fillRow(b *Board, y int, holes ...int)` — later tasks reuse it from this file

- [ ] **Step 1: Write the failing board tests**

Create `internal/game/board_test.go`:

```go
package game

import (
	"reflect"
	"testing"
)

// fillRow fills row y with locked cells, leaving the listed columns empty.
// Later tasks build stacks with it.
func fillRow(b *Board, y int, holes ...int) {
	hole := map[int]bool{}
	for _, x := range holes {
		hole[x] = true
	}
	for x := 0; x < Width; x++ {
		if !hole[x] {
			b.Set(x, y, cellFor(O))
		}
	}
}

func TestInBoundsAndAccessors(t *testing.T) {
	var b Board
	cases := []struct {
		x, y int
		want bool
	}{
		{0, 0, true}, {Width - 1, Height - 1, true},
		{-1, 0, false}, {0, -1, false},
		{Width, 0, false}, {0, Height, false},
	}
	for _, c := range cases {
		if got := b.InBounds(c.x, c.y); got != c.want {
			t.Errorf("InBounds(%d,%d) = %v, want %v", c.x, c.y, got, c.want)
		}
	}
	b.Set(3, 4, cellFor(T))
	if !b.Occupied(3, 4) {
		t.Error("Occupied(3,4) = false after Set")
	}
	if got := b.At(3, 4).Kind(); got != T {
		t.Errorf("At(3,4).Kind() = %v, want T", got)
	}
	if b.Occupied(3, 5) {
		t.Error("Occupied(3,5) = true, want false")
	}
	// Out-of-range access must be a safe miss, not a panic.
	if b.Occupied(-5, -5) || b.At(Width+2, Height+2) != Empty {
		t.Error("out-of-range access should read as Empty")
	}
	b.Set(-1, -1, cellFor(T)) // must not panic
}

func TestCollidesWithWallsFloorAndCeiling(t *testing.T) {
	var b Board
	// O occupies columns X+1,X+2 of a 4-wide box, so X=-2 puts a cell at -1.
	if !b.Collides(Piece{Kind: O, X: -2, Y: 5}) {
		t.Error("piece off the left edge should collide")
	}
	if !b.Collides(Piece{Kind: O, X: Width - 1, Y: 5}) {
		t.Error("piece off the right edge should collide")
	}
	if !b.Collides(Piece{Kind: O, X: 3, Y: Height - 1}) {
		t.Error("piece through the floor should collide")
	}
	// A rotation kick can push cells above row 0 (design.md §7 offsets
	// (0,-1),(-1,-1),(1,-1)). That must read as a collision, not panic.
	if !b.Collides(Piece{Kind: O, X: 3, Y: -1}) {
		t.Error("piece above the ceiling should collide")
	}
	if b.Collides(Piece{Kind: O, X: 3, Y: 0}) {
		t.Error("piece inside an empty board should not collide")
	}
}

func TestCollidesWithLockedCells(t *testing.T) {
	var b Board
	b.Set(4, 6, cellFor(Z))
	if !b.Collides(Piece{Kind: O, X: 3, Y: 5}) {
		t.Error("piece overlapping a locked cell should collide")
	}
	if b.Collides(Piece{Kind: O, X: 6, Y: 5}) {
		t.Error("piece clear of the locked cell should not collide")
	}
}

func TestLockWritesPieceIdentity(t *testing.T) {
	var b Board
	p := Piece{Kind: S, Rotation: 0, X: 3, Y: 8}
	b.Lock(p)
	for _, c := range p.Cells() {
		if !b.Occupied(c.X, c.Y) {
			t.Errorf("cell %v not filled after Lock", c)
		}
		if got := b.At(c.X, c.Y).Kind(); got != S {
			t.Errorf("cell %v has kind %v, want S", c, got)
		}
	}
}

func TestCompleteRowsFindsFullRowsTopToBottom(t *testing.T) {
	var b Board
	fillRow(&b, 21)
	fillRow(&b, 19)
	fillRow(&b, 20, 7) // one hole: not complete
	got := b.CompleteRows()
	if want := []int{19, 21}; !reflect.DeepEqual(got, want) {
		t.Fatalf("CompleteRows() = %v, want %v", got, want)
	}
	var empty Board
	if rows := empty.CompleteRows(); len(rows) != 0 {
		t.Errorf("empty board reported complete rows %v", rows)
	}
}

func TestClearRowsCollapsesEverythingAbove(t *testing.T) {
	var b Board
	b.Set(2, 18, cellFor(J)) // lone marker high up
	fillRow(&b, 20)
	fillRow(&b, 21)
	b.ClearRows([]int{20, 21})
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			want := x == 2 && y == 20 // marker fell two rows
			if b.Occupied(x, y) != want {
				t.Fatalf("cell (%d,%d) occupied=%v, want %v", x, y, b.Occupied(x, y), want)
			}
		}
	}
}

func TestClearRowsMovesCellsOutOfTheHiddenRows(t *testing.T) {
	var b Board
	b.Set(0, 0, cellFor(L)) // sitting in a hidden spawn row
	fillRow(&b, 21)
	b.ClearRows([]int{21})
	if b.Occupied(0, 0) {
		t.Error("hidden-row cell did not move down")
	}
	if !b.Occupied(0, 1) {
		t.Error("hidden-row cell should have fallen to row 1")
	}
}

func TestClearRowsToleratesDuplicateUnsortedAndBogusIndices(t *testing.T) {
	var b Board
	fillRow(&b, 21)
	b.Set(5, 20, cellFor(T))
	b.ClearRows([]int{21, 21, -3, Height + 4})
	if !b.Occupied(5, 21) {
		t.Error("row 21 should have been cleared exactly once, dropping row 20 into it")
	}
	if b.Occupied(5, 20) {
		t.Error("row 20 should be empty after the collapse")
	}
	var untouched Board
	before := untouched
	untouched.ClearRows(nil)
	if untouched != before {
		t.Error("ClearRows(nil) modified the board")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run Board -v`
Expected: FAIL to compile — `undefined: Board`, `undefined: cellFor`, `undefined: Empty`.

- [ ] **Step 3: Implement the board**

Create `internal/game/board.go`:

```go
package game

// Cell is one locked board square. Empty means unoccupied; any other value
// records which piece family filled it, so the renderer can colour locked
// cells (design.md §26).
type Cell uint8

// Empty is the zero value of Cell, so a zeroed Board is an empty board.
const Empty Cell = 0

func cellFor(k PieceKind) Cell { return Cell(k) + 1 }

// Kind reports the piece family that filled the cell. Only meaningful when the
// cell is not Empty.
func (c Cell) Kind() PieceKind { return PieceKind(c - 1) }

// Board is the locked playfield: Height rows of Width cells, row 0 at the top.
// It is a value type, so tests and snapshots can copy and compare whole boards.
type Board struct {
	Cells [Height][Width]Cell
}

// InBounds reports whether (x, y) names a real board square.
func (b *Board) InBounds(x, y int) bool {
	return x >= 0 && x < Width && y >= 0 && y < Height
}

// At returns the cell at (x, y), or Empty when out of bounds.
func (b *Board) At(x, y int) Cell {
	if !b.InBounds(x, y) {
		return Empty
	}
	return b.Cells[y][x]
}

// Set writes a cell, ignoring out-of-bounds coordinates.
func (b *Board) Set(x, y int, c Cell) {
	if b.InBounds(x, y) {
		b.Cells[y][x] = c
	}
}

// Occupied reports whether (x, y) holds a locked cell.
func (b *Board) Occupied(x, y int) bool { return b.At(x, y) != Empty }

// Collides reports whether the piece overlaps a wall, the floor, the space
// above the board, or a locked cell. Out-of-bounds counts as a collision,
// which is what makes the upward wall kicks in design.md §7 safe.
func (b *Board) Collides(p Piece) bool {
	for _, c := range p.Cells() {
		if !b.InBounds(c.X, c.Y) || b.Cells[c.Y][c.X] != Empty {
			return true
		}
	}
	return false
}

// Lock commits the piece's cells to the board.
func (b *Board) Lock(p Piece) {
	for _, c := range p.Cells() {
		b.Set(c.X, c.Y, cellFor(p.Kind))
	}
}

// CompleteRows returns the indices of the fully filled rows, top to bottom.
func (b *Board) CompleteRows() []int {
	var rows []int
	for y := 0; y < Height; y++ {
		full := true
		for x := 0; x < Width; x++ {
			if b.Cells[y][x] == Empty {
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

// ClearRows removes the named rows and collapses everything above them down.
// Duplicate, unsorted, and out-of-range indices are tolerated.
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
	dst := Height - 1
	for src := Height - 1; src >= 0; src-- {
		if doomed[src] {
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

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS, including all Task 1 tests.

- [ ] **Step 5: Commit**

```bash
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board collision, locking, row completion and collapse"
```

---

### Task 3: The 7-bag

Piece generation is the only consumer of the game RNG (§49.6). Its determinism is what makes the whole replay guarantee possible, so it gets its own task.

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `KindCount` (Task 1).
- Produces:
  - `type Bag struct{ rng *rand.Rand; queue []PieceKind }`
  - `func NewBag(rng *rand.Rand) Bag`
  - `func (b *Bag) Next() PieceKind`
  - `func (b *Bag) Remaining() int`

- [ ] **Step 1: Write the failing bag tests**

Create `internal/game/bag_test.go`:

```go
package game

import (
	"math/rand"
	"testing"
)

func TestEveryBagHoldsAllSevenKindsExactlyOnce(t *testing.T) {
	b := NewBag(rand.New(rand.NewSource(42)))
	for round := 0; round < 5; round++ {
		counts := map[PieceKind]int{}
		for i := 0; i < KindCount; i++ {
			counts[b.Next()]++
		}
		for k := PieceKind(0); k < KindCount; k++ {
			if counts[k] != 1 {
				t.Fatalf("round %d: kind %v drawn %d times, want 1 (draws: %v)", round, k, counts[k], counts)
			}
		}
	}
}

func TestSeededBagsAreReproducible(t *testing.T) {
	draw := func(seed int64, n int) []PieceKind {
		b := NewBag(rand.New(rand.NewSource(seed)))
		out := make([]PieceKind, n)
		for i := range out {
			out[i] = b.Next()
		}
		return out
	}
	a, b := draw(8675309, 100), draw(8675309, 100)
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("draw %d differs between identical seeds: %v vs %v", i, a[i], b[i])
		}
	}
	if same := draw(1, 20); equalKinds(same, draw(2, 20)) {
		t.Error("different seeds produced identical piece order")
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

func TestBagIsShuffledNotFixedOrder(t *testing.T) {
	// Across many bags, at least one must not be in I,J,L,O,S,T,Z order.
	// A bag that always returns the same order would pass the count test above.
	b := NewBag(rand.New(rand.NewSource(7)))
	inOrder := []PieceKind{I, J, L, O, S, T, Z}
	shuffledSomewhere := false
	for round := 0; round < 10; round++ {
		got := make([]PieceKind, KindCount)
		for i := range got {
			got[i] = b.Next()
		}
		if !equalKinds(got, inOrder) {
			shuffledSomewhere = true
		}
	}
	if !shuffledSomewhere {
		t.Error("ten consecutive bags all came out in declaration order; the bag is not shuffling")
	}
}

func TestRemainingTracksTheCurrentBag(t *testing.T) {
	b := NewBag(rand.New(rand.NewSource(3)))
	if got := b.Remaining(); got != 0 {
		t.Errorf("Remaining() before the first draw = %d, want 0", got)
	}
	b.Next()
	if got := b.Remaining(); got != KindCount-1 {
		t.Errorf("Remaining() after one draw = %d, want %d", got, KindCount-1)
	}
	for i := 0; i < KindCount-1; i++ {
		b.Next()
	}
	if got := b.Remaining(); got != 0 {
		t.Errorf("Remaining() after a full bag = %d, want 0", got)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run Bag -v`
Expected: FAIL to compile — `undefined: NewBag`.

- [ ] **Step 3: Implement the bag**

Create `internal/game/bag.go`:

```go
package game

import "math/rand"

// Bag is the 7-bag piece generator (design.md §6): every family appears once
// per bag, in shuffled order, and the bag refills when it runs dry.
//
// Its rng is the game RNG and drives nothing else. FX randomness lives in a
// separate generator so that particle counts can never shift piece order
// (design.md §49.6).
type Bag struct {
	rng   *rand.Rand
	queue []PieceKind
}

// NewBag returns a bag drawing from rng.
func NewBag(rng *rand.Rand) Bag { return Bag{rng: rng} }

// Next takes the next piece, refilling the bag when empty.
func (b *Bag) Next() PieceKind {
	if len(b.queue) == 0 {
		b.refill()
	}
	k := b.queue[len(b.queue)-1]
	b.queue = b.queue[:len(b.queue)-1]
	return k
}

// Remaining is how many pieces are left in the current bag.
func (b *Bag) Remaining() int { return len(b.queue) }

func (b *Bag) refill() {
	b.queue = append(b.queue, I, J, L, O, S, T, Z)
	b.rng.Shuffle(len(b.queue), func(i, j int) {
		b.queue[i], b.queue[j] = b.queue[j], b.queue[i]
	})
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag piece generator"
```

---

### Task 4: Scoring and the gravity curve

Pure functions, no state. Worth its own task because the numbers are exactly what a reviewer can check against §11, §13 and §49.1 without reading any other code — and because the gravity clamp is the difference between a hard level and a hung process.

**Files:**
- Create: `internal/game/scoring.go`
- Modify: `internal/game/rules.go` (append `GravityInterval`)
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: `BaseGravity`, `GravityFactor`, `MinGravity`, `LinesPerLevel` (Task 1).
- Produces:
  - `func LineScore(lines, level int) int`
  - `func ComboBonus(combo, level int) int`
  - `func LevelFor(lines int) int`
  - `func GravityInterval(level int) time.Duration`

- [ ] **Step 1: Write the failing scoring and gravity tests**

Create `internal/game/scoring_test.go`:

```go
package game

import (
	"testing"
	"time"
)

func TestLineScoreBaseValues(t *testing.T) {
	cases := []struct {
		lines, level, want int
	}{
		{0, 1, 0},
		{1, 1, 100}, {2, 1, 300}, {3, 1, 500}, {4, 1, 800},
		{1, 7, 700}, {4, 3, 2400},
		{5, 3, 0}, {-1, 3, 0}, // impossible clears score nothing rather than panicking
	}
	for _, c := range cases {
		if got := LineScore(c.lines, c.level); got != c.want {
			t.Errorf("LineScore(%d, %d) = %d, want %d", c.lines, c.level, got, c.want)
		}
	}
}

// design.md §49.1: combo 1 is a lone clear and earns no bonus; the bonus first
// appears at combo 2, which is where §21 starts escalating the effects.
func TestComboBonus(t *testing.T) {
	cases := []struct {
		combo, level, want int
	}{
		{0, 5, 0}, {1, 5, 0},
		{2, 1, 50}, {2, 3, 150},
		{5, 2, 400}, {7, 1, 300},
		{-2, 4, 0},
	}
	for _, c := range cases {
		if got := ComboBonus(c.combo, c.level); got != c.want {
			t.Errorf("ComboBonus(%d, %d) = %d, want %d", c.combo, c.level, got, c.want)
		}
	}
}

func TestLevelForRisesEveryTenLines(t *testing.T) {
	cases := []struct {
		lines, want int
	}{
		{0, 1}, {1, 1}, {9, 1},
		{10, 2}, {19, 2}, {20, 3},
		{127, 13},
		{-4, 1},
	}
	for _, c := range cases {
		if got := LevelFor(c.lines); got != c.want {
			t.Errorf("LevelFor(%d) = %d, want %d", c.lines, got, c.want)
		}
	}
}

func TestGravityIntervalCurve(t *testing.T) {
	if got := GravityInterval(1); got != BaseGravity {
		t.Errorf("GravityInterval(1) = %v, want %v", got, BaseGravity)
	}
	near := func(got, want, tol time.Duration) bool {
		d := got - want
		if d < 0 {
			d = -d
		}
		return d <= tol
	}
	if got := GravityInterval(2); !near(got, 688*time.Millisecond, time.Millisecond) {
		t.Errorf("GravityInterval(2) = %v, want ~688ms", got)
	}
	if got := GravityInterval(5); !near(got, 437*time.Millisecond, 2*time.Millisecond) {
		t.Errorf("GravityInterval(5) = %v, want ~437ms", got)
	}
	for level := 2; level <= 25; level++ {
		if GravityInterval(level) > GravityInterval(level-1) {
			t.Fatalf("gravity got slower from level %d to %d", level-1, level)
		}
	}
}

// A zero or negative interval would make the gravity loop in Advance spin
// forever and hang the UI thread, so the clamp is load-bearing, not cosmetic.
func TestGravityIntervalNeverDropsBelowTheFloor(t *testing.T) {
	for _, level := range []int{19, 30, 100, 1000, 1 << 20} {
		got := GravityInterval(level)
		if got < MinGravity {
			t.Errorf("GravityInterval(%d) = %v, want >= %v", level, got, MinGravity)
		}
		if got <= 0 {
			t.Errorf("GravityInterval(%d) = %v, want a positive duration", level, got)
		}
	}
	if got := GravityInterval(1000); got != MinGravity {
		t.Errorf("GravityInterval(1000) = %v, want the floor %v", got, MinGravity)
	}
	if got := GravityInterval(18); got <= MinGravity {
		t.Errorf("GravityInterval(18) = %v, want above the floor (the clamp should bite around level 19)", got)
	}
}

func TestGravityIntervalTreatsBogusLevelsAsLevelOne(t *testing.T) {
	for _, level := range []int{0, -1, -999} {
		if got := GravityInterval(level); got != BaseGravity {
			t.Errorf("GravityInterval(%d) = %v, want %v", level, got, BaseGravity)
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'Score|Combo|Level|Gravity' -v`
Expected: FAIL to compile — `undefined: LineScore`, `undefined: GravityInterval`.

- [ ] **Step 3: Implement scoring**

Create `internal/game/scoring.go`:

```go
package game

// lineValues are the base clear values, indexed by lines cleared, before the
// level multiplier (design.md §13).
var lineValues = [5]int{0, 100, 300, 500, 800}

// LineScore is the points awarded for clearing lines at the given level.
func LineScore(lines, level int) int {
	if lines < 0 || lines >= len(lineValues) {
		return 0
	}
	return lineValues[lines] * level
}

// ComboBonus is the points awarded for a combo (design.md §49.1):
// 50 x (combo - 1) x level, so a lone clear earns nothing extra.
func ComboBonus(combo, level int) int {
	if combo < 2 {
		return 0
	}
	return 50 * (combo - 1) * level
}

// LevelFor is the level reached after clearing the given number of lines.
// Play starts at level 1 and gains a level every LinesPerLevel lines.
func LevelFor(lines int) int {
	if lines < 0 {
		return 1
	}
	return lines/LinesPerLevel + 1
}
```

- [ ] **Step 4: Append the gravity curve to `internal/game/rules.go`**

Add `"math"` to the import block, making it:

```go
import (
	"math"
	"time"
)
```

and append at the end of the file:

```go
// GravityInterval is how long the active piece waits between gravity steps at
// the given level: 800ms x 0.86^(level-1), clamped to MinGravity
// (design.md §11). The clamp also guarantees a positive result, which the
// gravity loop in Advance depends on to terminate.
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

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/game/scoring.go internal/game/rules.go internal/game/scoring_test.go
git commit -m "feat(game): clear scoring, combo bonus, level and gravity curve"
```

---

### Task 5: Game events, game construction, next queue, ghost piece

Introduces the `Game` value and the event vocabulary the FX world will observe. No gameplay verbs yet — this task delivers a constructed, inspectable game with a five-deep next queue, a working ghost projection, and the spawn path that ends the game when the stack reaches orbit.

**Files:**
- Create: `internal/game/events.go`
- Create: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: `Board`, `Piece`, `PieceKind`, `Bag`, `NewBag`, `SpawnPiece`, `NextCount`, `LevelFor` (Tasks 1–4); test helper `fillRow` (Task 2).
- Produces:
  - `type Event interface{ event() }` and the nine event structs: `PieceMoved{Piece Piece; DX, DY int}`, `PieceRotated{Piece Piece; Dir int}`, `PieceHardDropped{Piece Piece; FromY, ToY int}`, `PieceLocked{Piece Piece; Cells [4]Point}`, `HoldUsed{Stored, Spawned PieceKind}`, `LinesCleared{Rows []int; Count, Level int}`, `ComboChanged{Combo int}`, `LevelChanged{Level int}`, `GameOver{Score, Lines, Level int}`
  - `type Game struct{ ... }` with exported fields `Board, Active, Hold, CanHold, Next, Bag, Score, Lines, Level, Combo, GravityAccumulator, LockAccumulator, LockResets, Over, Seed` and unexported `rng`
  - `func New(seed int64) *Game`
  - `func (g *Game) GhostPiece() Piece`
  - `func (g *Game) popNext() PieceKind`, `func (g *Game) spawn(k PieceKind) []Event`, `func (g *Game) grounded() bool`

- [ ] **Step 1: Write the event types**

Events are values with a sealed interface: only this package can implement `Event`, so the FX world can observe the stream by type switch but cannot inject into it or write back (design.md §14, §44). Create `internal/game/events.go`:

```go
package game

// Event is something the engine did. The FX world observes events to decide
// what to make explode; it can never modify game state (design.md §14).
// The unexported method seals the interface to this package.
type Event interface {
	event()
}

// PieceMoved reports a successful translation, from gravity or from the player.
type PieceMoved struct {
	Piece  Piece
	DX, DY int
}

// PieceRotated reports a successful rotation. Dir is +1 clockwise, -1 counter.
type PieceRotated struct {
	Piece Piece
	Dir   int
}

// PieceHardDropped reports a hard drop, from row FromY to resting row ToY.
// The cells crossed between the two rows are what the ion trail is drawn
// through (design.md §18).
type PieceHardDropped struct {
	Piece      Piece
	FromY, ToY int
}

// PieceLocked reports a piece committed to the board.
type PieceLocked struct {
	Piece Piece
	Cells [4]Point
}

// HoldUsed reports a hold swap: Stored went into the hold slot, Spawned became
// the active piece.
type HoldUsed struct {
	Stored, Spawned PieceKind
}

// LinesCleared reports completed rows, top to bottom. Level is the level in
// effect when the clear scored.
type LinesCleared struct {
	Rows  []int
	Count int
	Level int
}

// ComboChanged reports a new combo count, including the reset to zero.
type ComboChanged struct {
	Combo int
}

// LevelChanged reports that gravity got worse.
type LevelChanged struct {
	Level int
}

// GameOver reports the final tally.
type GameOver struct {
	Score, Lines, Level int
}

func (PieceMoved) event()       {}
func (PieceRotated) event()     {}
func (PieceHardDropped) event() {}
func (PieceLocked) event()      {}
func (HoldUsed) event()         {}
func (LinesCleared) event()     {}
func (ComboChanged) event()     {}
func (LevelChanged) event()     {}
func (GameOver) event()         {}
```

- [ ] **Step 2: Write the failing game-construction tests**

Create `internal/game/game_test.go`:

```go
package game

import (
	"testing"
)

func TestNewGameStartsClean(t *testing.T) {
	g := New(8675309)
	if g.Score != 0 || g.Lines != 0 || g.Combo != 0 {
		t.Errorf("new game has score=%d lines=%d combo=%d, want zeros", g.Score, g.Lines, g.Combo)
	}
	if g.Level != 1 {
		t.Errorf("new game level = %d, want 1", g.Level)
	}
	if g.Over {
		t.Error("new game is already over")
	}
	if !g.CanHold {
		t.Error("new game should allow a hold")
	}
	if g.Hold != nil {
		t.Errorf("new game hold = %v, want nil", *g.Hold)
	}
	if g.Seed != 8675309 {
		t.Errorf("new game seed = %d, want 8675309", g.Seed)
	}
	var empty Board
	if g.Board != empty {
		t.Error("new game board is not empty")
	}
	if g.Board.Collides(g.Active) {
		t.Error("the first active piece starts inside a collision")
	}
	if g.Active.Rotation != 0 || g.Active.X != SpawnX || g.Active.Y != SpawnY {
		t.Errorf("first active piece = %+v, want spawn position", g.Active)
	}
}

func TestNextQueueStaysFiveDeep(t *testing.T) {
	g := New(1)
	if len(g.Next) != NextCount {
		t.Fatalf("len(Next) = %d, want %d", len(g.Next), NextCount)
	}
	for i := 0; i < 30; i++ {
		head := g.Next[0]
		got := g.popNext()
		if got != head {
			t.Fatalf("popNext() = %v, want the queue head %v", got, head)
		}
		if len(g.Next) != NextCount {
			t.Fatalf("after %d pops len(Next) = %d, want %d", i+1, len(g.Next), NextCount)
		}
	}
}

func TestNewGameDrawsOnlyWhatTheQueueNeeds(t *testing.T) {
	// One active piece plus NextCount queued = 6 draws from the first bag of 7.
	// This pins the game RNG's usage: an extra draw here would silently change
	// every seeded replay (design.md §49.6).
	g := New(99)
	if got, want := g.Bag.Remaining(), KindCount-(NextCount+1); got != want {
		t.Errorf("bag has %d pieces left after New, want %d", got, want)
	}
}

func TestGhostPieceLandsOnTheStack(t *testing.T) {
	g := New(5)
	g.Active = Piece{Kind: O, Rotation: 0, X: 3, Y: 0}

	ghost := g.GhostPiece()
	if ghost.Y != Height-2 {
		t.Errorf("ghost on an empty board rests at Y=%d, want %d", ghost.Y, Height-2)
	}
	if ghost.Kind != O || ghost.Rotation != 0 || ghost.X != 3 {
		t.Errorf("ghost = %+v, want the active piece's kind, rotation and column", ghost)
	}
	if g.Active.Y != 0 {
		t.Error("GhostPiece moved the active piece")
	}

	fillRow(&g.Board, Height-1)
	if got := g.GhostPiece().Y; got != Height-3 {
		t.Errorf("ghost above a filled floor row rests at Y=%d, want %d", got, Height-3)
	}
}

func TestGhostPieceOfAGroundedPieceIsItself(t *testing.T) {
	g := New(5)
	g.Active = Piece{Kind: O, Rotation: 0, X: 3, Y: Height - 2}
	if got := g.GhostPiece(); got != g.Active {
		t.Errorf("ghost = %+v, want the active piece %+v", got, g.Active)
	}
}

func TestSpawnIntoABlockedBoardEndsTheGame(t *testing.T) {
	g := New(11)
	// Fill the top hidden row, leaving column 9 open so the row is not
	// complete and will not be cleared out from under the test.
	fillRow(&g.Board, 0, Width-1)

	evs := g.spawn(O)

	if !g.Over {
		t.Fatal("spawning into an occupied row should end the game")
	}
	if len(evs) != 1 {
		t.Fatalf("spawn returned %d events, want 1 GameOver: %+v", len(evs), evs)
	}
	over, ok := evs[0].(GameOver)
	if !ok {
		t.Fatalf("spawn returned %T, want GameOver", evs[0])
	}
	if over.Score != g.Score || over.Lines != g.Lines || over.Level != g.Level {
		t.Errorf("GameOver%+v does not match the final tally score=%d lines=%d level=%d",
			over, g.Score, g.Lines, g.Level)
	}
}

func TestSpawnResetsPerPieceTimers(t *testing.T) {
	g := New(12)
	g.GravityAccumulator = 400
	g.LockAccumulator = 400
	g.LockResets = 9

	if evs := g.spawn(T); len(evs) != 0 {
		t.Fatalf("clean spawn returned events %+v, want none", evs)
	}
	if g.GravityAccumulator != 0 || g.LockAccumulator != 0 || g.LockResets != 0 {
		t.Errorf("after spawn gravity=%v lock=%v resets=%d, want all zero",
			g.GravityAccumulator, g.LockAccumulator, g.LockResets)
	}
	if g.Active.Kind != T {
		t.Errorf("active kind = %v, want T", g.Active.Kind)
	}
}

func TestGroundedReportsContactWithFloorAndStack(t *testing.T) {
	g := New(13)
	g.Active = Piece{Kind: O, Rotation: 0, X: 3, Y: 0}
	if g.grounded() {
		t.Error("a piece in mid-air reported grounded")
	}
	g.Active.Y = Height - 2
	if !g.grounded() {
		t.Error("a piece on the floor reported airborne")
	}
	g.Active.Y = 0
	fillRow(&g.Board, 2)
	if !g.grounded() {
		t.Error("a piece resting on the stack reported airborne")
	}
}
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'New|Next|Ghost|Spawn|Grounded' -v`
Expected: FAIL to compile — `undefined: New`, `undefined: Game`.

- [ ] **Step 4: Implement the game value, spawn path and ghost**

Create `internal/game/game.go`:

```go
package game

import (
	"math/rand"
	"time"
)

// Game is the whole logical state of one session. It is deterministic: given a
// seed, the same sequence of player actions and Advance durations always
// produces the same Game (design.md §35).
//
// Pause lives in the application layer, not here: a paused app simply stops
// calling Advance.
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

	// GravityAccumulator and LockAccumulator hold elapsed time handed in
	// through Advance. Nothing here reads a clock (design.md §49.2).
	GravityAccumulator time.Duration
	LockAccumulator    time.Duration

	// LockResets counts lock-timer resets spent on the current piece, capped
	// at MaxLockResets so a player cannot stall forever (design.md §12).
	LockResets int

	Over bool

	// Seed is recorded for display and restart; rng is the game RNG and drives
	// only the 7-bag (design.md §49.6).
	Seed int64
	rng  *rand.Rand
}

// New starts a game from the given seed.
func New(seed int64) *Game {
	g := &Game{
		Level:   1,
		CanHold: true,
		Seed:    seed,
		rng:     rand.New(rand.NewSource(seed)),
	}
	g.Bag = NewBag(g.rng)
	g.Next = make([]PieceKind, 0, NextCount)
	for len(g.Next) < NextCount {
		g.Next = append(g.Next, g.Bag.Next())
	}
	g.Active = SpawnPiece(g.popNext())
	return g
}

// GhostPiece is the active piece projected down to where it would land
// (design.md §10). It is a copy: the active piece does not move.
func (g *Game) GhostPiece() Piece {
	p := g.Active
	for !g.Board.Collides(p.Moved(0, 1)) {
		p = p.Moved(0, 1)
	}
	return p
}

// popNext takes the head of the next queue and tops the queue back up.
func (g *Game) popNext() PieceKind {
	k := g.Next[0]
	g.Next = append(g.Next[:0], g.Next[1:]...)
	g.Next = append(g.Next, g.Bag.Next())
	return k
}

// spawn makes a fresh piece of the given kind active and resets the per-piece
// timers. If the piece cannot fit, the stack has reached orbit: the game ends
// and a GameOver event is returned.
func (g *Game) spawn(k PieceKind) []Event {
	g.Active = SpawnPiece(k)
	g.GravityAccumulator = 0
	g.LockAccumulator = 0
	g.LockResets = 0
	if g.Board.Collides(g.Active) {
		g.Over = true
		return []Event{GameOver{Score: g.Score, Lines: g.Lines, Level: g.Level}}
	}
	return nil
}

// grounded reports whether the active piece is resting on the floor or stack.
func (g *Game) grounded() bool {
	return g.Board.Collides(g.Active.Moved(0, 1))
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/game/events.go internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game state, event vocabulary, next queue and ghost piece"
```

---

### Task 6: Movement, rotation with wall kicks, lock-timer resets

The player's verbs, minus the drops. This is where §7's kick order and §12's reset accounting land.

**Files:**
- Modify: `internal/game/game.go` (append the movement methods)
- Test: `internal/game/move_test.go`

**Interfaces:**
- Consumes: `Game`, `grounded`, `Board.Collides`, `kickOffsets`, `SoftDropPoints`, event types (Tasks 1–5).
- Produces:
  - `func (g *Game) MoveLeft() []Event`
  - `func (g *Game) MoveRight() []Event`
  - `func (g *Game) SoftDrop() []Event`
  - `func (g *Game) Rotate(dir int) []Event`
  - `func (g *Game) noteLockReset()`

- [ ] **Step 1: Write the failing movement and rotation tests**

Create `internal/game/move_test.go`:

```go
package game

import (
	"testing"
	"time"
)

// activeAt puts a known piece under test control, bypassing the bag.
func activeAt(g *Game, k PieceKind, rotation, x, y int) {
	g.Active = Piece{Kind: k, Rotation: rotation, X: x, Y: y}
}

func TestMoveLeftAndRight(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, 5)

	evs := g.MoveRight()
	if g.Active.X != 4 {
		t.Errorf("after MoveRight X = %d, want 4", g.Active.X)
	}
	if len(evs) != 1 {
		t.Fatalf("MoveRight returned %d events, want 1: %+v", len(evs), evs)
	}
	moved, ok := evs[0].(PieceMoved)
	if !ok {
		t.Fatalf("MoveRight returned %T, want PieceMoved", evs[0])
	}
	if moved.DX != 1 || moved.DY != 0 || moved.Piece != g.Active {
		t.Errorf("PieceMoved%+v, want DX=1 DY=0 and the moved piece", moved)
	}

	if evs := g.MoveLeft(); len(evs) != 1 || g.Active.X != 3 {
		t.Errorf("after MoveLeft X = %d with %d events, want 3 and 1", g.Active.X, len(evs))
	}
}

func TestMovementBlockedByWallsAndStack(t *testing.T) {
	g := New(1)
	// O fills columns X+1 and X+2, so X=-1 puts it against the left wall.
	activeAt(g, O, 0, -1, 5)
	if evs := g.MoveLeft(); len(evs) != 0 {
		t.Errorf("blocked MoveLeft returned events %+v, want none", evs)
	}
	if g.Active.X != -1 {
		t.Errorf("blocked MoveLeft moved the piece to X = %d", g.Active.X)
	}

	activeAt(g, O, 0, Width-3, 5)
	if evs := g.MoveRight(); len(evs) != 0 || g.Active.X != Width-3 {
		t.Errorf("blocked MoveRight: X = %d, events %+v", g.Active.X, evs)
	}

	activeAt(g, O, 0, 3, 5)
	g.Board.Set(6, 5, cellFor(Z)) // directly right of the O's right column
	if evs := g.MoveRight(); len(evs) != 0 || g.Active.X != 3 {
		t.Errorf("move into a locked cell: X = %d, events %+v", g.Active.X, evs)
	}
}

func TestSoftDropScoresAndDescends(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, 5)

	evs := g.SoftDrop()
	if g.Active.Y != 6 {
		t.Errorf("after SoftDrop Y = %d, want 6", g.Active.Y)
	}
	if g.Score != SoftDropPoints {
		t.Errorf("score = %d, want %d", g.Score, SoftDropPoints)
	}
	if len(evs) != 1 {
		t.Fatalf("SoftDrop returned %d events, want 1", len(evs))
	}
	if moved, ok := evs[0].(PieceMoved); !ok || moved.DY != 1 {
		t.Errorf("SoftDrop returned %+v, want PieceMoved with DY=1", evs[0])
	}
}

func TestSoftDropOnTheFloorDoesNothingAndDoesNotScore(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, Height-2)
	before := g.Active

	if evs := g.SoftDrop(); len(evs) != 0 {
		t.Errorf("grounded SoftDrop returned events %+v, want none", evs)
	}
	if g.Active != before {
		t.Errorf("grounded SoftDrop moved the piece to %+v", g.Active)
	}
	if g.Score != 0 {
		t.Errorf("grounded SoftDrop scored %d, want 0", g.Score)
	}
}

func TestRotateClockwiseAndCounter(t *testing.T) {
	g := New(1)
	activeAt(g, T, 0, 3, 5)

	evs := g.Rotate(1)
	if g.Active.Rotation != 1 {
		t.Errorf("rotation = %d, want 1", g.Active.Rotation)
	}
	if len(evs) != 1 {
		t.Fatalf("Rotate returned %d events, want 1", len(evs))
	}
	if rot, ok := evs[0].(PieceRotated); !ok || rot.Dir != 1 || rot.Piece != g.Active {
		t.Errorf("Rotate returned %+v, want PieceRotated{Dir:1}", evs[0])
	}

	if evs := g.Rotate(-1); len(evs) != 1 || g.Active.Rotation != 0 {
		t.Errorf("counter-rotation: rotation = %d, events %d", g.Active.Rotation, len(evs))
	}
}

// design.md §7: offsets are tried (0,0), (-1,0), (1,0), (-2,0), (2,0),
// (0,-1), (-1,-1), (1,-1) and the first valid one wins.
func TestRotationWallKicksOffTheLeftWall(t *testing.T) {
	g := New(1)
	// Vertical I against the left wall: cells sit in column X+2, so X=-2 is
	// column 0. Rotating to horizontal needs cells at X..X+3 = -2..1, which
	// is off-board, so the kick must shift it right.
	activeAt(g, I, 1, -2, 10)

	if evs := g.Rotate(1); len(evs) != 1 {
		t.Fatalf("rotation off the left wall failed, events %+v", evs)
	}
	if g.Active.Rotation != 2 {
		t.Errorf("rotation = %d, want 2", g.Active.Rotation)
	}
	if g.Active.X != 0 {
		t.Errorf("kicked to X = %d, want 0 (the first valid offset in §7 order)", g.Active.X)
	}
	if g.Board.Collides(g.Active) {
		t.Error("kicked into a colliding position")
	}
}

func TestRotationPrefersTheEarliestValidOffset(t *testing.T) {
	g := New(1)
	// A vertical I with its column against the right wall: cells in column
	// Width-1 means X = Width-3. Horizontal needs X..X+3 in bounds, so the
	// (-1,0) kick is the first that fits.
	activeAt(g, I, 1, Width-3, 10)
	if evs := g.Rotate(1); len(evs) != 1 {
		t.Fatalf("rotation off the right wall failed, events %+v", evs)
	}
	if g.Active.X != Width-4 {
		t.Errorf("kicked to X = %d, want %d", g.Active.X, Width-4)
	}
}

func TestRotationFailsWhenNoOffsetFits(t *testing.T) {
	g := New(1)
	// Bury a vertical I in a one-column shaft: every horizontal placement and
	// every kick offset is blocked.
	for y := 8; y < Height; y++ {
		fillRow(&g.Board, y, 2)
	}
	activeAt(g, I, 1, 0, Height-4) // column 2, rows Height-4..Height-1
	before := g.Active

	if evs := g.Rotate(1); len(evs) != 0 {
		t.Errorf("impossible rotation returned events %+v, want none", evs)
	}
	if g.Active != before {
		t.Errorf("failed rotation changed the piece to %+v, want %+v", g.Active, before)
	}
}

// The (0,-1) family of kicks pushes cells above row 0 while a piece is still
// in the hidden spawn rows. Bounds checking must reject that, not panic.
func TestRotationAgainstTheCeilingDoesNotPanic(t *testing.T) {
	g := New(1)
	activeAt(g, I, 0, 3, 0) // horizontal I, cells on row 1
	_ = g.Rotate(1)
	if g.Board.Collides(g.Active) {
		t.Errorf("ceiling rotation left the piece colliding at %+v", g.Active)
	}
	for _, c := range g.Active.Cells() {
		if c.Y < 0 {
			t.Errorf("cell %v ended up above the board", c)
		}
	}
}

func TestGroundedMoveResetsTheLockTimer(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, Height-2)
	g.LockAccumulator = 400 * time.Millisecond

	g.MoveLeft()

	if g.LockAccumulator != 0 {
		t.Errorf("lock accumulator = %v after a grounded move, want 0", g.LockAccumulator)
	}
	if g.LockResets != 1 {
		t.Errorf("lock resets = %d, want 1", g.LockResets)
	}
}

func TestAirborneMoveDoesNotSpendALockReset(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, 5)
	g.MoveLeft()
	if g.LockResets != 0 {
		t.Errorf("lock resets = %d after a mid-air move, want 0", g.LockResets)
	}
}

func TestLockResetsAreCappedSoStallingEnds(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, Height-2)

	for i := 0; i < MaxLockResets+10; i++ {
		g.LockAccumulator = 400 * time.Millisecond
		if i%2 == 0 {
			g.MoveLeft()
		} else {
			g.MoveRight()
		}
	}

	if g.LockResets != MaxLockResets {
		t.Errorf("lock resets = %d, want the cap %d", g.LockResets, MaxLockResets)
	}
	if g.LockAccumulator == 0 {
		t.Error("moves past the reset cap still cleared the lock timer; the piece could stall forever")
	}
}

func TestGroundedRotationAlsoResetsTheLockTimer(t *testing.T) {
	g := New(1)
	activeAt(g, T, 0, 3, Height-2)
	g.LockAccumulator = 300 * time.Millisecond

	if evs := g.Rotate(1); len(evs) != 1 {
		t.Fatalf("grounded rotation failed, events %+v", evs)
	}
	if g.LockAccumulator != 0 || g.LockResets != 1 {
		t.Errorf("lock accumulator = %v, resets = %d; want 0 and 1", g.LockAccumulator, g.LockResets)
	}
}

func TestActionsDoNothingOnceTheGameIsOver(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, 5)
	g.Over = true
	before := *g

	for name, action := range map[string]func() []Event{
		"MoveLeft":  g.MoveLeft,
		"MoveRight": g.MoveRight,
		"SoftDrop":  g.SoftDrop,
		"Rotate":    func() []Event { return g.Rotate(1) },
	} {
		if evs := action(); len(evs) != 0 {
			t.Errorf("%s after game over returned events %+v", name, evs)
		}
	}
	if g.Active != before.Active || g.Score != before.Score {
		t.Errorf("actions after game over changed state: %+v", g.Active)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'Move|SoftDrop|Rotat|Lock|Actions' -v`
Expected: FAIL to compile — `g.MoveLeft undefined`, `g.Rotate undefined`.

- [ ] **Step 3: Append the movement methods to `internal/game/game.go`**

```go
// MoveLeft shifts the active piece one column left, if it fits.
func (g *Game) MoveLeft() []Event { return g.shift(-1) }

// MoveRight shifts the active piece one column right, if it fits.
func (g *Game) MoveRight() []Event { return g.shift(1) }

func (g *Game) shift(dx int) []Event {
	if g.Over {
		return nil
	}
	moved := g.Active.Moved(dx, 0)
	if g.Board.Collides(moved) {
		return nil
	}
	g.Active = moved
	g.noteLockReset()
	return []Event{PieceMoved{Piece: g.Active, DX: dx, DY: 0}}
}

// SoftDrop descends one row and scores a point per cell (design.md §11). On the
// floor it does nothing: the lock delay is what ends the piece, not the key.
func (g *Game) SoftDrop() []Event {
	if g.Over {
		return nil
	}
	moved := g.Active.Moved(0, 1)
	if g.Board.Collides(moved) {
		return nil
	}
	g.Active = moved
	g.Score += SoftDropPoints
	g.GravityAccumulator = 0
	return []Event{PieceMoved{Piece: g.Active, DX: 0, DY: 1}}
}

// Rotate turns the active piece: dir +1 clockwise, -1 counter-clockwise. The
// kick offsets in design.md §7 are tried in order and the first position that
// fits wins; if none do, the rotation fails and nothing changes.
func (g *Game) Rotate(dir int) []Event {
	if g.Over {
		return nil
	}
	target := g.Active.Rotated(dir)
	for _, k := range kickOffsets {
		candidate := target.Moved(k.X, k.Y)
		if !g.Board.Collides(candidate) {
			g.Active = candidate
			g.noteLockReset()
			return []Event{PieceRotated{Piece: g.Active, Dir: dir}}
		}
	}
	return nil
}

// noteLockReset restarts the lock countdown after a successful grounded move or
// rotation, up to MaxLockResets times per piece (design.md §12).
func (g *Game) noteLockReset() {
	if !g.grounded() || g.LockResets >= MaxLockResets {
		return
	}
	g.LockResets++
	g.LockAccumulator = 0
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/move_test.go
git commit -m "feat(game): movement, wall-kick rotation and lock-timer resets"
```

---

### Task 7: Advance — gravity, locking, line clearing, combo and level

The engine's heartbeat. `Advance(dt)` is the only way time enters the engine, and locking is where scoring, clearing and the next spawn all happen in the order design.md §12 specifies.

**Files:**
- Modify: `internal/game/game.go` (append `Advance` and `lock`)
- Test: `internal/game/advance_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–6.
- Produces:
  - `func (g *Game) Advance(dt time.Duration) []Event`
  - `func (g *Game) lock() []Event`
  - test helpers `func firstEvent[T Event](t *testing.T, evs []Event) T` and `func eventKinds(evs []Event) []string`, reused by Tasks 8–10

- [ ] **Step 1: Write the failing gravity and locking tests**

Create `internal/game/advance_test.go`:

```go
package game

import (
	"fmt"
	"reflect"
	"testing"
	"time"
)

// firstEvent returns the first event of type T, failing the test if absent.
func firstEvent[T Event](t *testing.T, evs []Event) T {
	t.Helper()
	for _, e := range evs {
		if got, ok := any(e).(T); ok {
			return got
		}
	}
	var zero T
	t.Fatalf("no %T among events %s", zero, eventKinds(evs))
	return zero
}

// eventKinds names the events in order, for readable failure messages and for
// asserting the order design.md §12 requires.
func eventKinds(evs []Event) []string {
	out := make([]string, len(evs))
	for i, e := range evs {
		out[i] = fmt.Sprintf("%T", e)
	}
	return out
}

func TestGravityDescendsAfterTheInterval(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, 5)

	if evs := g.Advance(GravityInterval(1) - time.Millisecond); len(evs) != 0 {
		t.Fatalf("piece moved before the interval elapsed: %s", eventKinds(evs))
	}
	if g.Active.Y != 5 {
		t.Fatalf("Y = %d before the interval elapsed, want 5", g.Active.Y)
	}

	evs := g.Advance(time.Millisecond)
	if g.Active.Y != 6 {
		t.Errorf("Y = %d after the interval elapsed, want 6", g.Active.Y)
	}
	moved := firstEvent[PieceMoved](t, evs)
	if moved.DY != 1 || moved.DX != 0 {
		t.Errorf("PieceMoved%+v, want DX=0 DY=1", moved)
	}
}

func TestGravityRemainderCarriesToTheNextFrame(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, 5)
	interval := GravityInterval(1)

	g.Advance(interval + 100*time.Millisecond)
	if g.Active.Y != 6 {
		t.Fatalf("Y = %d, want 6", g.Active.Y)
	}
	if g.GravityAccumulator != 100*time.Millisecond {
		t.Errorf("accumulator = %v, want the 100ms remainder", g.GravityAccumulator)
	}
}

// A backgrounded terminal or a sleeping laptop reports an enormous dt. The
// piece must not fall the whole board in one frame.
func TestAdvanceClampsAnEnormousDT(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, 5)

	evs := g.Advance(30 * time.Second)

	if g.Active.Y != 5 {
		t.Errorf("Y = %d after a 30s frame, want 5: catch-up is capped at %v, below the %v interval",
			g.Active.Y, MaxAdvanceStep, GravityInterval(1))
	}
	if g.GravityAccumulator != MaxAdvanceStep {
		t.Errorf("accumulator = %v, want the clamp %v", g.GravityAccumulator, MaxAdvanceStep)
	}
	if len(evs) != 0 {
		t.Errorf("events %s, want none", eventKinds(evs))
	}
}

func TestAdvanceAppliesEveryStepInsideTheClamp(t *testing.T) {
	g := New(1)
	g.Level = 30 // gravity floor: 60ms per step
	activeAt(g, O, 0, 3, 2)

	g.Advance(MaxAdvanceStep) // 250ms / 60ms = 4 steps, 10ms left over

	if g.Active.Y != 6 {
		t.Errorf("Y = %d, want 6 (four gravity steps)", g.Active.Y)
	}
	if g.GravityAccumulator != 10*time.Millisecond {
		t.Errorf("accumulator = %v, want 10ms", g.GravityAccumulator)
	}
}

func TestAdvanceIgnoresNonPositiveDT(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, 5)
	g.GravityAccumulator = 300 * time.Millisecond
	before := *g

	for _, dt := range []time.Duration{0, -time.Millisecond, -5 * time.Second} {
		if evs := g.Advance(dt); len(evs) != 0 {
			t.Errorf("Advance(%v) returned events %s, want none", dt, eventKinds(evs))
		}
	}
	if g.Active != before.Active || g.GravityAccumulator != before.GravityAccumulator {
		t.Errorf("a non-positive dt changed state: piece %+v accumulator %v",
			g.Active, g.GravityAccumulator)
	}
}

func TestGravityStopsAtTheStackWithoutLockingImmediately(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, Height-3)
	g.Advance(GravityInterval(1)) // descends onto the floor

	if g.Active.Y != Height-2 {
		t.Fatalf("Y = %d, want %d", g.Active.Y, Height-2)
	}
	if g.Board.Occupied(4, Height-1) {
		t.Error("the piece locked as soon as it landed; design.md §12 gives it a 500ms lock delay")
	}
}

func TestLockDelayElapsesThenTheBoardTakesThePiece(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, Height-2)

	if evs := g.Advance(LockDelay - time.Millisecond); len(evs) != 0 {
		t.Fatalf("locked early: %s", eventKinds(evs))
	}
	if g.LockAccumulator != LockDelay-time.Millisecond {
		t.Errorf("lock accumulator = %v, want %v", g.LockAccumulator, LockDelay-time.Millisecond)
	}

	evs := g.Advance(time.Millisecond)

	locked := firstEvent[PieceLocked](t, evs)
	if locked.Piece.Kind != O {
		t.Errorf("PieceLocked reported kind %v, want O", locked.Piece.Kind)
	}
	for _, c := range []Point{{4, Height - 2}, {5, Height - 2}, {4, Height - 1}, {5, Height - 1}} {
		if !g.Board.Occupied(c.X, c.Y) {
			t.Errorf("cell %v not committed to the board", c)
		}
	}
	if g.Active.Y != SpawnY || g.Active.X != SpawnX {
		t.Errorf("after locking the active piece is %+v, want a fresh spawn", g.Active)
	}
	if g.LockAccumulator != 0 || g.LockResets != 0 {
		t.Errorf("per-piece timers not reset: lock=%v resets=%d", g.LockAccumulator, g.LockResets)
	}
}

func TestLeavingTheGroundClearsTheLockTimer(t *testing.T) {
	g := New(1)
	// Rest on a one-cell ledge, then slide off it into open space.
	g.Board.Set(4, Height-1, cellFor(J))
	activeAt(g, O, 0, 3, Height-3)
	g.Advance(200 * time.Millisecond)
	if g.LockAccumulator == 0 {
		t.Fatal("expected the lock timer to be running while grounded")
	}

	g.MoveRight() // columns 5,6: nothing below now
	g.Advance(time.Millisecond)

	if g.LockAccumulator != 0 {
		t.Errorf("lock accumulator = %v after leaving the ground, want 0", g.LockAccumulator)
	}
}

func TestLockingACompletedRowClearsAndScoresIt(t *testing.T) {
	g := New(1)
	fillRow(&g.Board, Height-1, 4, 5) // bottom row needs exactly the O's columns
	activeAt(g, O, 0, 3, Height-2)

	evs := g.Advance(LockDelay)

	if g.Lines != 1 {
		t.Errorf("lines = %d, want 1", g.Lines)
	}
	if want := LineScore(1, 1); g.Score != want {
		t.Errorf("score = %d, want %d (no combo bonus for a lone clear, design.md §49.1)", g.Score, want)
	}
	if g.Combo != 1 {
		t.Errorf("combo = %d, want 1", g.Combo)
	}
	cleared := firstEvent[LinesCleared](t, evs)
	if !reflect.DeepEqual(cleared, (LinesCleared{Rows: []int{Height - 1}, Count: 1, Level: 1})) {
		t.Errorf("LinesCleared%+v, want rows [%d] count 1 level 1", cleared, Height-1)
	}
	if combo := firstEvent[ComboChanged](t, evs); combo.Combo != 1 {
		t.Errorf("ComboChanged%+v, want 1", combo)
	}
	// The O's upper half survives and falls into the emptied row.
	if !g.Board.Occupied(4, Height-1) || !g.Board.Occupied(5, Height-1) {
		t.Error("the surviving half of the piece did not collapse into the cleared row")
	}
	if g.Board.Occupied(0, Height-1) {
		t.Error("the cleared row kept its old contents")
	}
	if g.Board.Occupied(4, Height-2) {
		t.Error("row above the clear should be empty after the collapse")
	}
}

func TestEventOrderAtLockTime(t *testing.T) {
	g := New(1)
	fillRow(&g.Board, Height-1, 4, 5)
	activeAt(g, O, 0, 3, Height-2)

	got := eventKinds(g.Advance(LockDelay))
	want := []string{"game.PieceLocked", "game.LinesCleared", "game.ComboChanged"}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("event order = %v, want %v (design.md §12: commit, clear, score, then FX)", got, want)
	}
}

func TestFourLineClearScoresAndEmptiesTheBoard(t *testing.T) {
	g := New(1)
	for y := Height - 4; y < Height; y++ {
		fillRow(&g.Board, y, 0) // four rows, all missing column 0
	}
	// A vertical I fills column 0: cells sit in column X+2, so X=-2.
	activeAt(g, I, 1, -2, Height-4)

	evs := g.Advance(LockDelay)

	if g.Lines != 4 {
		t.Errorf("lines = %d, want 4", g.Lines)
	}
	if want := LineScore(4, 1); g.Score != want {
		t.Errorf("score = %d, want %d", g.Score, want)
	}
	cleared := firstEvent[LinesCleared](t, evs)
	if want := (LinesCleared{Rows: []int{18, 19, 20, 21}, Count: 4, Level: 1}); !reflect.DeepEqual(cleared, want) {
		t.Errorf("LinesCleared%+v, want %+v", cleared, want)
	}
	var empty Board
	if g.Board != empty {
		t.Error("board should be empty after clearing all four occupied rows")
	}
}

func TestConsecutiveClearsBuildACombo(t *testing.T) {
	g := New(1)
	// First clear: bottom row missing column 0, filled by a vertical I.
	fillRow(&g.Board, Height-1, 0)
	activeAt(g, I, 1, -2, Height-4)
	g.Advance(LockDelay)

	if g.Combo != 1 || g.Score != LineScore(1, 1) {
		t.Fatalf("after the first clear combo = %d score = %d, want 1 and %d", g.Combo, g.Score, LineScore(1, 1))
	}

	// Second clear: rebuild the bottom row missing column 1 this time.
	fillRow(&g.Board, Height-1, 1)
	activeAt(g, I, 1, -1, Height-4) // column 1
	evs := g.Advance(LockDelay)

	if g.Combo != 2 {
		t.Fatalf("combo = %d, want 2", g.Combo)
	}
	want := LineScore(1, 1)*2 + ComboBonus(2, 1)
	if g.Score != want {
		t.Errorf("score = %d, want %d (two clears plus a combo-2 bonus)", g.Score, want)
	}
	if combo := firstEvent[ComboChanged](t, evs); combo.Combo != 2 {
		t.Errorf("ComboChanged%+v, want 2", combo)
	}
}

func TestAPlacementWithoutAClearResetsTheCombo(t *testing.T) {
	g := New(1)
	g.Combo = 4
	activeAt(g, O, 0, 3, Height-2)

	evs := g.Advance(LockDelay)

	if g.Combo != 0 {
		t.Errorf("combo = %d, want 0", g.Combo)
	}
	if combo := firstEvent[ComboChanged](t, evs); combo.Combo != 0 {
		t.Errorf("ComboChanged%+v, want 0", combo)
	}
}

func TestNoComboEventWhenThereWasNoCombo(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, Height-2)

	got := eventKinds(g.Advance(LockDelay))
	for _, k := range got {
		if k == "game.ComboChanged" {
			t.Errorf("events %v include a redundant ComboChanged; combo was already 0", got)
		}
	}
}

func TestTenLinesRaisesTheLevel(t *testing.T) {
	g := New(1)
	g.Lines = 9
	fillRow(&g.Board, Height-1, 4, 5)
	activeAt(g, O, 0, 3, Height-2)

	evs := g.Advance(LockDelay)

	if g.Level != 2 {
		t.Errorf("level = %d, want 2", g.Level)
	}
	if lv := firstEvent[LevelChanged](t, evs); lv.Level != 2 {
		t.Errorf("LevelChanged%+v, want 2", lv)
	}
	// The clear is scored at the level in force when the piece locked.
	if want := LineScore(1, 1); g.Score != want {
		t.Errorf("score = %d, want %d (scored at the pre-level-up level)", g.Score, want)
	}
	if cleared := firstEvent[LinesCleared](t, evs); cleared.Level != 1 {
		t.Errorf("LinesCleared reported level %d, want 1", cleared.Level)
	}
	if got, want := GravityInterval(g.Level), GravityInterval(2); got != want {
		t.Errorf("gravity interval = %v, want %v", got, want)
	}
}

func TestLockingIntoAFullSpawnRowEndsTheGame(t *testing.T) {
	g := New(1)
	// Occupy the spawn cells, leaving column 9 open so the rows are not
	// complete and survive the clear check.
	fillRow(&g.Board, 0, Width-1)
	fillRow(&g.Board, 1, Width-1)
	activeAt(g, O, 0, 3, Height-2)

	evs := g.Advance(LockDelay)

	if !g.Over {
		t.Fatal("game should be over: the next piece cannot spawn")
	}
	over := firstEvent[GameOver](t, evs)
	if over.Score != g.Score || over.Lines != g.Lines || over.Level != g.Level {
		t.Errorf("GameOver%+v does not match score=%d lines=%d level=%d", over, g.Score, g.Lines, g.Level)
	}
	if kinds := eventKinds(evs); kinds[len(kinds)-1] != "game.GameOver" {
		t.Errorf("GameOver should be the last event, got %v", kinds)
	}
}

func TestAdvanceIsInertAfterGameOver(t *testing.T) {
	g := New(1)
	g.Over = true
	before := *g

	if evs := g.Advance(10 * time.Second); len(evs) != 0 {
		t.Errorf("Advance after game over returned %s, want no events", eventKinds(evs))
	}
	if g.Active != before.Active || g.Score != before.Score || g.Board != before.Board {
		t.Error("Advance after game over changed state")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'Gravity|Advance|Lock|Combo|Four|Ten|Event' -v`
Expected: FAIL to compile — `g.Advance undefined`.

- [ ] **Step 3: Append `Advance` and `lock` to `internal/game/game.go`**

```go
// Advance applies dt of elapsed time: gravity while the piece is falling, the
// lock countdown while it is grounded. This is the only way time enters the
// engine (design.md §49.2).
//
// dt is clamped to MaxAdvanceStep, so a frame delayed by a backgrounded
// terminal cannot drop the piece down the whole board, and non-positive dt is
// ignored, so a stalled or backwards clock cannot rewind the game.
func (g *Game) Advance(dt time.Duration) []Event {
	if g.Over || dt <= 0 {
		return nil
	}
	if dt > MaxAdvanceStep {
		dt = MaxAdvanceStep
	}

	if g.grounded() {
		g.GravityAccumulator = 0
		g.LockAccumulator += dt
		if g.LockAccumulator >= LockDelay {
			return g.lock()
		}
		return nil
	}

	g.LockAccumulator = 0
	g.GravityAccumulator += dt
	interval := GravityInterval(g.Level)
	var evs []Event
	for g.GravityAccumulator >= interval {
		g.GravityAccumulator -= interval
		if g.Board.Collides(g.Active.Moved(0, 1)) {
			break // grounded: the lock countdown starts on the next Advance
		}
		g.Active = g.Active.Moved(0, 1)
		evs = append(evs, PieceMoved{Piece: g.Active, DX: 0, DY: 1})
	}
	return evs
}

// lock commits the active piece and runs the post-lock sequence from
// design.md §12: commit, detect complete rows, clear them, update the score,
// emit the FX events, spawn the next piece.
func (g *Game) lock() []Event {
	p := g.Active
	g.Board.Lock(p)
	evs := []Event{PieceLocked{Piece: p, Cells: p.Cells()}}

	if rows := g.Board.CompleteRows(); len(rows) > 0 {
		// Clears score at the level in force when the piece locked; the level
		// bump takes effect afterwards.
		level := g.Level
		g.Board.ClearRows(rows)
		g.Lines += len(rows)
		g.Combo++
		g.Score += LineScore(len(rows), level) + ComboBonus(g.Combo, level)
		evs = append(evs,
			LinesCleared{Rows: rows, Count: len(rows), Level: level},
			ComboChanged{Combo: g.Combo},
		)
		if lv := LevelFor(g.Lines); lv != g.Level {
			g.Level = lv
			evs = append(evs, LevelChanged{Level: g.Level})
		}
	} else if g.Combo != 0 {
		g.Combo = 0
		evs = append(evs, ComboChanged{Combo: 0})
	}

	g.CanHold = true
	return append(evs, g.spawn(g.popNext())...)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS. If `TestEventOrderAtLockTime` fails on the type names, confirm the package is named `game` — the assertion expects `game.PieceLocked`.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/advance_test.go
git commit -m "feat(game): gravity, lock delay, line clearing, combo and level progression"
```

---

### Task 8: Hard drop

Hard drop is the engine half of design.md §18's refrigerator-from-orbit moment: it must report the rows crossed so the FX layer can draw the ion trail, and it locks immediately rather than waiting out the lock delay.

**Files:**
- Modify: `internal/game/game.go` (append `HardDrop`)
- Test: `internal/game/harddrop_test.go`

**Interfaces:**
- Consumes: `Game`, `GhostPiece`, `lock`, `HardDropPoints`, `PieceHardDropped` (Tasks 1–7).
- Produces: `func (g *Game) HardDrop() []Event`

- [ ] **Step 1: Write the failing hard-drop tests**

Create `internal/game/harddrop_test.go`:

```go
package game

import (
	"reflect"
	"testing"
)

func TestHardDropLandsScoresAndLocks(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, 0)

	evs := g.HardDrop()

	dropped := firstEvent[PieceHardDropped](t, evs)
	if dropped.FromY != 0 || dropped.ToY != Height-2 {
		t.Errorf("PieceHardDropped%+v, want FromY 0 ToY %d", dropped, Height-2)
	}
	if dropped.Piece.Y != Height-2 || dropped.Piece.Kind != O {
		t.Errorf("PieceHardDropped carried %+v, want the landed O", dropped.Piece)
	}
	cells := Height - 2 // rows descended
	if want := cells * HardDropPoints; g.Score != want {
		t.Errorf("score = %d, want %d (%d cells x %d points)", g.Score, want, cells, HardDropPoints)
	}
	for _, c := range []Point{{4, Height - 2}, {5, Height - 2}, {4, Height - 1}, {5, Height - 1}} {
		if !g.Board.Occupied(c.X, c.Y) {
			t.Errorf("cell %v not locked; hard drop must not wait out the lock delay", c)
		}
	}
	if got := eventKinds(evs); got[0] != "game.PieceHardDropped" || got[1] != "game.PieceLocked" {
		t.Errorf("event order = %v, want the drop then the lock", got)
	}
	if g.Active.Y != SpawnY {
		t.Errorf("active piece = %+v, want a fresh spawn", g.Active)
	}
}

func TestHardDropLandsOnTheStack(t *testing.T) {
	g := New(1)
	fillRow(&g.Board, Height-1)
	fillRow(&g.Board, Height-2)
	activeAt(g, O, 0, 3, 3)

	evs := g.HardDrop()

	dropped := firstEvent[PieceHardDropped](t, evs)
	if dropped.ToY != Height-4 {
		t.Errorf("landed at ToY = %d, want %d (on top of two filled rows)", dropped.ToY, Height-4)
	}
	if want := (Height - 4 - 3) * HardDropPoints; g.Score != want {
		t.Errorf("score = %d, want %d", g.Score, want)
	}
}

func TestHardDroppingAGroundedPieceScoresNothingAndStillLocks(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, Height-2)

	evs := g.HardDrop()

	if g.Score != 0 {
		t.Errorf("score = %d, want 0: the piece had nowhere to fall", g.Score)
	}
	dropped := firstEvent[PieceHardDropped](t, evs)
	if dropped.FromY != dropped.ToY {
		t.Errorf("PieceHardDropped%+v, want FromY == ToY", dropped)
	}
	if !g.Board.Occupied(4, Height-1) {
		t.Error("the piece did not lock")
	}
}

func TestHardDropThatCompletesARowClearsIt(t *testing.T) {
	g := New(1)
	fillRow(&g.Board, Height-1, 4, 5)
	fillRow(&g.Board, Height-2, 4, 5)
	activeAt(g, O, 0, 3, 0)

	evs := g.HardDrop()

	if g.Lines != 2 {
		t.Errorf("lines = %d, want 2", g.Lines)
	}
	cleared := firstEvent[LinesCleared](t, evs)
	if want := (LinesCleared{Rows: []int{Height - 2, Height - 1}, Count: 2, Level: 1}); !reflect.DeepEqual(cleared, want) {
		t.Errorf("LinesCleared%+v, want %+v", cleared, want)
	}
	var empty Board
	if g.Board != empty {
		t.Error("board should be empty after both rows cleared")
	}
	dropRows := Height - 2
	if want := dropRows*HardDropPoints + LineScore(2, 1); g.Score != want {
		t.Errorf("score = %d, want %d (drop distance plus the double clear)", g.Score, want)
	}
}

func TestHardDropIsInertAfterGameOver(t *testing.T) {
	g := New(1)
	activeAt(g, O, 0, 3, 0)
	g.Over = true
	before := *g

	if evs := g.HardDrop(); len(evs) != 0 {
		t.Errorf("HardDrop after game over returned %s, want none", eventKinds(evs))
	}
	if g.Board != before.Board || g.Score != before.Score {
		t.Error("HardDrop after game over changed state")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run HardDrop -v`
Expected: FAIL to compile — `g.HardDrop undefined`.

- [ ] **Step 3: Append `HardDrop` to `internal/game/game.go`**

```go
// HardDrop slams the active piece to its landing position, scores two points
// per cell crossed, and locks it immediately (design.md §11, §18). The
// PieceHardDropped event carries the rows crossed so the FX layer can draw the
// ion trail through them.
func (g *Game) HardDrop() []Event {
	if g.Over {
		return nil
	}
	from := g.Active.Y
	landed := g.GhostPiece()
	g.Active = landed
	g.Score += (landed.Y - from) * HardDropPoints
	evs := []Event{PieceHardDropped{Piece: landed, FromY: from, ToY: landed.Y}}
	return append(evs, g.lock()...)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/harddrop_test.go
git commit -m "feat(game): hard drop with distance scoring and immediate lock"
```

---

### Task 9: Hold

One held piece, one hold per active piece, spawn rotation restored (design.md §9). The engine does not wait for the quantum-storage animation — that is entirely an FX concern in a later phase.

**Files:**
- Modify: `internal/game/game.go` (append `HoldPiece`)
- Test: `internal/game/hold_test.go`

**Interfaces:**
- Consumes: `Game`, `spawn`, `popNext`, `HoldUsed` (Tasks 1–7).
- Produces: `func (g *Game) HoldPiece() []Event`

- [ ] **Step 1: Write the failing hold tests**

Create `internal/game/hold_test.go`:

```go
package game

import (
	"testing"
	"time"
)

func TestFirstHoldStoresTheActivePieceAndPullsFromTheQueue(t *testing.T) {
	g := New(7)
	stored := g.Active.Kind
	incoming := g.Next[0]

	evs := g.HoldPiece()

	if g.Hold == nil {
		t.Fatal("hold slot is still empty")
	}
	if *g.Hold != stored {
		t.Errorf("hold = %v, want %v", *g.Hold, stored)
	}
	if g.Active.Kind != incoming {
		t.Errorf("active kind = %v, want the queue head %v", g.Active.Kind, incoming)
	}
	if len(g.Next) != NextCount {
		t.Errorf("len(Next) = %d, want %d", len(g.Next), NextCount)
	}
	if g.CanHold {
		t.Error("CanHold should be false until the active piece locks")
	}
	used := firstEvent[HoldUsed](t, evs)
	if used.Stored != stored || used.Spawned != incoming {
		t.Errorf("HoldUsed%+v, want stored %v spawned %v", used, stored, incoming)
	}
}

func TestSecondHoldBeforeALockIsRefused(t *testing.T) {
	g := New(7)
	g.HoldPiece()
	held, active := *g.Hold, g.Active

	if evs := g.HoldPiece(); len(evs) != 0 {
		t.Errorf("second hold returned events %s, want none", eventKinds(evs))
	}
	if *g.Hold != held || g.Active != active {
		t.Errorf("second hold changed state: hold %v active %+v", *g.Hold, g.Active)
	}
}

func TestHoldSwapsWithTheStoredPiece(t *testing.T) {
	g := New(7)
	first := g.Active.Kind
	g.HoldPiece()
	second := g.Active.Kind
	g.CanHold = true // as a lock would do

	evs := g.HoldPiece()

	if *g.Hold != second {
		t.Errorf("hold = %v, want the piece that was active (%v)", *g.Hold, second)
	}
	if g.Active.Kind != first {
		t.Errorf("active kind = %v, want the previously held %v", g.Active.Kind, first)
	}
	used := firstEvent[HoldUsed](t, evs)
	if used.Stored != second || used.Spawned != first {
		t.Errorf("HoldUsed%+v, want stored %v spawned %v", used, second, first)
	}
}

func TestHeldPieceReturnsAtSpawnRotationAndPosition(t *testing.T) {
	g := New(7)
	g.Active.Rotation = 2
	g.Active.X = 6
	g.Active.Y = 9
	g.GravityAccumulator = 300 * time.Millisecond
	g.LockAccumulator = 300 * time.Millisecond
	g.LockResets = 4

	g.HoldPiece()

	if g.Active.Rotation != 0 || g.Active.X != SpawnX || g.Active.Y != SpawnY {
		t.Errorf("incoming piece = %+v, want spawn rotation and position", g.Active)
	}
	if g.GravityAccumulator != 0 || g.LockAccumulator != 0 || g.LockResets != 0 {
		t.Errorf("timers not reset: gravity %v lock %v resets %d",
			g.GravityAccumulator, g.LockAccumulator, g.LockResets)
	}
	// The stored piece forgets its rotation too: it comes back upright.
	g.CanHold = true
	g.Active.Rotation = 3
	g.HoldPiece()
	if g.Active.Rotation != 0 {
		t.Errorf("returning held piece rotation = %d, want 0", g.Active.Rotation)
	}
}

func TestHoldBecomesAvailableAgainAfterALock(t *testing.T) {
	g := New(7)
	g.HoldPiece()
	if g.CanHold {
		t.Fatal("CanHold should be false right after a hold")
	}

	activeAt(g, O, 0, 3, Height-2)
	g.Advance(LockDelay)

	if !g.CanHold {
		t.Error("CanHold should be restored once the piece locks")
	}
	if evs := g.HoldPiece(); len(evs) == 0 {
		t.Error("hold after a lock was refused")
	}
}

func TestHoldIsAlsoRestoredAfterAHardDrop(t *testing.T) {
	g := New(7)
	g.HoldPiece()
	g.HardDrop()
	if !g.CanHold {
		t.Error("CanHold should be restored after a hard drop locks the piece")
	}
}

func TestHoldIntoAFullSpawnAreaEndsTheGame(t *testing.T) {
	g := New(7)
	// Column 9 stays open so these rows are not complete rows.
	fillRow(&g.Board, 0, Width-1)
	fillRow(&g.Board, 1, Width-1)

	evs := g.HoldPiece()

	if !g.Over {
		t.Fatal("holding into an occupied spawn area should end the game")
	}
	over := firstEvent[GameOver](t, evs)
	if over.Score != g.Score {
		t.Errorf("GameOver%+v does not match score %d", over, g.Score)
	}
	if kinds := eventKinds(evs); kinds[0] != "game.HoldUsed" || kinds[len(kinds)-1] != "game.GameOver" {
		t.Errorf("event order = %v, want the hold then the game over", kinds)
	}
}

func TestHoldIsInertAfterGameOver(t *testing.T) {
	g := New(7)
	g.Over = true
	before := *g

	if evs := g.HoldPiece(); len(evs) != 0 {
		t.Errorf("hold after game over returned %s, want none", eventKinds(evs))
	}
	if g.Hold != nil || g.Active != before.Active {
		t.Error("hold after game over changed state")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run Hold -v`
Expected: FAIL to compile — `g.HoldPiece undefined`.

- [ ] **Step 3: Append `HoldPiece` to `internal/game/game.go`**

```go
// HoldPiece swaps the active piece with the hold slot (design.md §9). If the
// slot is empty the active piece goes in and the queue head comes out. Only one
// hold is allowed per active piece. The incoming piece always arrives at spawn
// rotation and position.
func (g *Game) HoldPiece() []Event {
	if g.Over || !g.CanHold {
		return nil
	}
	stored := g.Active.Kind
	var incoming PieceKind
	if g.Hold == nil {
		incoming = g.popNext()
	} else {
		incoming = *g.Hold
	}
	g.Hold = &stored
	g.CanHold = false
	evs := []Event{HoldUsed{Stored: stored, Spawned: incoming}}
	return append(evs, g.spawn(incoming)...)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/hold_test.go
git commit -m "feat(game): hold slot with one swap per piece"
```

---

### Task 10: Restart and the determinism replay test

The engine's headline promise (§35): the same seed plus the same input-and-timing stream reproduces the same game. This task adds `Restart` and the replay harness that proves it, then closes the phase.

**Files:**
- Modify: `internal/game/game.go` (append `Restart`)
- Modify: `README.md`
- Test: `internal/game/determinism_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–9.
- Produces:
  - `func (g *Game) Restart()`
  - test helpers `type scriptStep struct{ action string; dt time.Duration }`, `func runScript(g *Game, script []scriptStep) []string`, `func fingerprint(g *Game) string`

- [ ] **Step 1: Write the failing determinism and restart tests**

The script mixes every input with varied `dt` values, including a huge frame and a non-positive one, so the replay covers the clamping paths too. Create `internal/game/determinism_test.go`:

```go
package game

import (
	"fmt"
	"strings"
	"testing"
	"time"
)

type scriptStep struct {
	action string
	dt     time.Duration
}

// canned is a fixed input-and-timing stream: exactly what design.md §40's
// replay test calls for. Each cycle walks the piece a varying distance sideways
// before dropping it, so the stack spreads across the board instead of piling
// up in the spawn columns. The dt series deliberately includes zero, a negative
// value and an 8-second frame, so the replay covers the clamping paths in
// Advance as well as ordinary frames.
var canned = func() []scriptStep {
	dts := []time.Duration{
		16 * time.Millisecond, 33 * time.Millisecond, 0,
		-5 * time.Millisecond, 120 * time.Millisecond, 8 * time.Second,
	}
	var script []scriptStep
	step := func(action string) {
		script = append(script, scriptStep{action: action, dt: dts[len(script)%len(dts)]})
	}
	for cycle := 0; cycle < 60; cycle++ {
		side := "left"
		if cycle%2 == 1 {
			side = "right"
		}
		for i := 0; i <= cycle%5; i++ {
			step(side)
		}
		if cycle%3 == 0 {
			step("cw")
		}
		if cycle%7 == 0 {
			step("ccw")
		}
		if cycle%11 == 0 {
			step("hold")
		}
		step("soft")
		step("tick")
		step("hard")
		step("tick")
	}
	return script
}()

// runScript applies the stream and returns the flattened event log, so the test
// compares the observable output as well as the final state.
func runScript(g *Game, script []scriptStep) []string {
	var log []string
	record := func(evs []Event) {
		for _, e := range evs {
			log = append(log, fmt.Sprintf("%T%+v", e, e))
		}
	}
	for _, s := range script {
		switch s.action {
		case "left":
			record(g.MoveLeft())
		case "right":
			record(g.MoveRight())
		case "cw":
			record(g.Rotate(1))
		case "ccw":
			record(g.Rotate(-1))
		case "soft":
			record(g.SoftDrop())
		case "hard":
			record(g.HardDrop())
		case "hold":
			record(g.HoldPiece())
		case "tick":
			// no input, just time
		default:
			panic("unknown script action " + s.action)
		}
		record(g.Advance(s.dt))
	}
	return log
}

// fingerprint is every piece of observable state, as text. It avoids the
// unexported rng field on purpose: determinism is a claim about the game, not
// about generator internals.
func fingerprint(g *Game) string {
	var sb strings.Builder
	fmt.Fprintf(&sb, "score=%d lines=%d level=%d combo=%d over=%v canHold=%v\n",
		g.Score, g.Lines, g.Level, g.Combo, g.Over, g.CanHold)
	fmt.Fprintf(&sb, "active=%+v hold=%s next=%v\n", g.Active, holdName(g), g.Next)
	fmt.Fprintf(&sb, "gravity=%v lock=%v resets=%d bag=%d\n",
		g.GravityAccumulator, g.LockAccumulator, g.LockResets, g.Bag.Remaining())
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if g.Board.Occupied(x, y) {
				sb.WriteString(g.Board.At(x, y).Kind().String())
			} else {
				sb.WriteByte('.')
			}
		}
		sb.WriteByte('\n')
	}
	return sb.String()
}

func holdName(g *Game) string {
	if g.Hold == nil {
		return "-"
	}
	return g.Hold.String()
}

func TestReplayingTheSameSeedAndTimingReproducesTheGame(t *testing.T) {
	a, b := New(8675309), New(8675309)

	logA, logB := runScript(a, canned), runScript(b, canned)

	if len(logA) == 0 {
		t.Fatal("the canned script produced no events; it is not exercising the engine")
	}
	if len(logA) != len(logB) {
		t.Fatalf("event counts differ: %d vs %d", len(logA), len(logB))
	}
	for i := range logA {
		if logA[i] != logB[i] {
			t.Fatalf("event %d differs:\n  %s\n  %s", i, logA[i], logB[i])
		}
	}
	if fa, fb := fingerprint(a), fingerprint(b); fa != fb {
		t.Errorf("final state differs:\n--- run A ---\n%s\n--- run B ---\n%s", fa, fb)
	}
}

func TestReplayVisitsInterestingStates(t *testing.T) {
	// A determinism test over a script that barely touches the board proves
	// very little, so check the replay actually plays. Line clears depend on
	// where the stack happens to land and are not asserted here; the clear,
	// combo and level paths are pinned by advance_test.go and harddrop_test.go.
	g := New(8675309)
	log := runScript(g, canned)
	var locks, clears int
	for _, e := range log {
		if strings.HasPrefix(e, "game.PieceLocked") {
			locks++
		}
		if strings.HasPrefix(e, "game.LinesCleared") {
			clears++
		}
	}
	if locks < 10 {
		t.Errorf("only %d pieces locked during the replay; want at least 10", locks)
	}
	if g.Score == 0 {
		t.Error("the replay scored nothing; hard drops alone should score")
	}
	t.Logf("replay: %d locks, %d clears, score %d, lines %d, level %d, over=%v",
		locks, clears, g.Score, g.Lines, g.Level, g.Over)
}

func TestDifferentSeedsDivergeButStayInternallyConsistent(t *testing.T) {
	a, b := New(1), New(2)
	runScript(a, canned)
	runScript(b, canned)
	if fingerprint(a) == fingerprint(b) {
		t.Error("two different seeds produced identical games; the seed is not reaching the bag")
	}

	// Same seed, same script, but a second game constructed later: still equal.
	c := New(1)
	runScript(c, canned)
	if fingerprint(a) != fingerprint(c) {
		t.Error("two runs of seed 1 diverged")
	}
}

func TestRestartRewindsToAFreshGameOnTheSameSeed(t *testing.T) {
	g := New(4242)
	runScript(g, canned[:200])
	if g.Score == 0 {
		t.Fatal("the script did not score anything; the restart check would be vacuous")
	}

	g.Restart()

	if want := fingerprint(New(4242)); fingerprint(g) != want {
		t.Errorf("after Restart the game is not a fresh New(4242):\n--- got ---\n%s\n--- want ---\n%s",
			fingerprint(g), want)
	}
	if g.Seed != 4242 {
		t.Errorf("seed = %d after Restart, want 4242 preserved so --seed stays reproducible", g.Seed)
	}
	if g.Over {
		t.Error("game is still over after Restart")
	}
}

func TestRestartWorksAfterGameOver(t *testing.T) {
	g := New(9)
	fillRow(&g.Board, 0, Width-1)
	fillRow(&g.Board, 1, Width-1)
	g.HardDrop() // locks, then fails to spawn
	if !g.Over {
		t.Fatal("expected the game to be over")
	}

	g.Restart()

	if g.Over || g.Score != 0 {
		t.Errorf("after Restart over=%v score=%d, want false and 0", g.Over, g.Score)
	}
	var empty Board
	if g.Board != empty {
		t.Error("board not cleared by Restart")
	}
	if g.Board.Collides(g.Active) {
		t.Error("the restarted game starts in a collision")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'Replay|Restart|Seeds' -v`
Expected: FAIL to compile — `g.Restart undefined`.

- [ ] **Step 3: Append `Restart` to `internal/game/game.go`**

```go
// Restart begins a new game on the same seed, so a --seed run stays
// reproducible across restarts (design.md §35).
func (g *Game) Restart() {
	*g = *New(g.Seed)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS. If `TestReplayVisitsInterestingStates` reports fewer than 10 locks, the script is not reaching the board — do not weaken the threshold; check that the `hard` steps are being applied and that `HardDrop` locks immediately.

- [ ] **Step 5: Run the whole suite with the race detector and vet**

Run:

```bash
gofmt -l . && go vet ./... && go test ./... -count=1 && go test ./internal/game/ -race -count=1
```

Expected: `gofmt -l` prints nothing, vet is silent, all tests PASS twice over.

- [ ] **Step 6: Update the README to record what Phase 1 delivered**

Replace the `## Status` section of `README.md` with:

```markdown
## Status

Phase 1 complete: the headless game engine (`internal/game`) is implemented and
tested — pieces, board, 7-bag, movement, wall kicks, gravity, lock delay, line
clearing, hold, scoring, game over, and the game-event stream. Not yet
playable: Phase 2 adds the Bubble Tea terminal UI.

The engine is deterministic. `game.New(seed)` plus a fixed stream of inputs and
`Advance(dt)` durations always reproduces the same game, which is what
`internal/game/determinism_test.go` asserts.
```

- [ ] **Step 7: Commit**

```bash
git add internal/game/game.go internal/game/determinism_test.go README.md
git commit -m "feat(game): restart and the seeded replay determinism test"
```

---

## What this plan does not build

Deliberately out of scope for Phase 1, each becoming its own plan once this engine is running (design.md §42):

- **Phase 2 — playable terminal:** `internal/app` (Bubble Tea model, update, messages, keys), `internal/render` (layout, board, HUD, palette), `cmd/cosmic-tetris/main.go` with the §49.5 CLI surface, resize handling, and the §41 snapshot tests. Key repeat, pause, and help live here — the engine deliberately has no notion of pause, because a paused app simply stops calling `Advance`.
- **Phase 3 — cosmic foundation:** `internal/fx` (starfield, trails, its own `*rand.Rand`), animated border, `internal/flavor` mission-control messages.
- **Phase 4 — violence:** hard-drop impact, particles, line supernova, screen shake, shockwaves, hyperdrive, the four-line sequence.
- **Phase 5 — absurd polish:** boot sequence, the game-over black hole, responsive FX degradation, ASCII fallback, flavor tuning.

One open question for the human: `design.md` §33 lists a `LICENSE` file. Phase 1 does not add one, because picking a licence is your call, not the implementer's. Say the word and it goes in the Phase 2 plan.



