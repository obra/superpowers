# Cosmic Tetris — Game Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the headless, deterministic Cosmic Tetris game engine (`internal/game`) plus the CLI flag surface, fully unit-tested, so that later plans can bolt a Bubble Tea renderer and a cosmic effects layer onto a game that is already provably correct.

**Architecture:** One Go package, `internal/game`, owns all rules: pieces, board, 7-bag, movement, wall kicks, gravity, locking, line clears, scoring, hold, game over. It exposes a single time entry point — `Advance(dt time.Duration) []Event` — and never reads a clock, so the caller owns time and a canned `(input, dt)` stream reproduces any game exactly. The engine emits `Event` values describing what happened; it has no knowledge of rendering or effects. `cmd/cosmic-tetris/main.go` parses the flag surface into a `Config` and, for now, prints the resolved universe; Phase 2 replaces that body with the Bubble Tea program.

**Tech Stack:** Go 1.26, standard library only (`math/rand/v2`, `time`, `flag`, `go/ast` for one architectural test). No third-party dependencies in this plan — Bubble Tea / Lip Gloss / Bubbles arrive in the next plan.

**Spec:** `design.md` (this repo root). Section references below (`§7`, `§49.2`, …) point into it.

## Global Constraints

- Module path: `cosmic-tetris`. Engine imports as `cosmic-tetris/internal/game`.
- `go.mod` declares `go 1.26`. No third-party dependencies in this plan.
- Board geometry is fixed: width `10`, height `22`, hidden spawn rows `2`, visible rows `20` (§5).
- Nothing under `internal/game` may call `time.Now()` or `time.Since()`. `dt` is the only time source (§49.2). Task 7 adds a test that enforces this.
- The game RNG (`Game.rng`) drives the 7-bag and nothing else. FX gets a separate generator in a later plan. The two never share (§49.6, §35).
- Combo bonus is exactly `50 × (combo - 1) × level`; the first clearing placement sets combo to 1 and earns no bonus (§49.1).
- Gravity interval is `800ms × 0.86^(level-1)`, clamped at a `60ms` floor; level is `lines/10 + 1` (§11).
- Lock delay `500ms`, at most `15` move-resets per piece (§12).
- Final CLI surface, exactly: bare, `--seed N`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help` (§49.5). Nothing else.
- Y grows downward everywhere: row `0` is the top hidden spawn row, row `21` is the floor row.
- Before every commit: `gofmt -l .` must print nothing, `go vet ./...` must pass, `go test ./...` must pass.

## Review Focus

These are input classes the spec implies but never names. Each has a test assigned to the task that owns the code.

1. **A suspended terminal delivers one enormous `dt`.** Laptop sleep, a long `SIGSTOP`, or a stalled render loop hands the engine seconds at once; the piece must not teleport to the floor or spin the gravity loop for thousands of iterations. → Task 7, `TestAdvanceClampsHugeDt`.
2. **Keys pressed during the game-over sequence.** §28's collapse runs for 1300ms and §20 says animation never blocks input, so a player will absolutely hammer keys while dead; every input must be an inert no-op, not a mutation of a finished game. → Task 9, `TestInputsAfterGameOverAreNoOps`.
3. **Deep play drives the level past the interval clamp.** `0.86^(level-1)` underflows toward zero; if `DropInterval` ever returned `0` the gravity loop in `Advance` would never terminate and the game would hang mid-play. → Task 7, `TestDropIntervalNeverReachesZero`.
4. **`--seed` given something that is not a number.** A typo (`--seed abc`, `--seed 1e9`) must produce a readable one-line complaint and exit code 2, not a panic or a silent seed of 0. → Task 10, `TestParseFlagsRejectsBadSeed`.
5. **Rotation attempted while wedged against a wall, the floor, or a high stack.** §7's kick list includes `(0,-1)` and `±2` shifts, which can carry a piece off the board or into locked cells if the candidate is not re-validated; a piece rendered outside the playfield is an unrecoverable visual bug. → Task 5, `TestRotationNeverProducesIllegalPosition`.

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `go.mod` | module + Go version | 1 |
| `internal/game/piece.go` | `PieceKind`, `Piece`, the four rotation tables, `Cells()` | 1 |
| `internal/game/piece_test.go` | rotation table integrity, spawn shapes | 1 |
| `internal/game/board.go` | geometry, bounds, collision, lock, row detect/clear/collapse, debug `String()` | 2 |
| `internal/game/board_test.go` | collision, bounds, completion, collapse | 2 |
| `internal/game/bag.go` | 7-bag randomizer, `newRNG` | 3 |
| `internal/game/bag_test.go` | bag completeness, reproducibility | 3 |
| `internal/game/events.go` | `EventKind`, `Event` | 4 |
| `internal/game/game.go` | `Game` state, `New`, `Restart`, spawn/queue, lock pipeline, `Advance`, drops, hold | 4, 6, 7, 8, 9 |
| `internal/game/rules.go` | movement, rotation + wall kicks, ghost, lock-timer touch | 4, 5 |
| `internal/game/scoring.go` | `LineScore`, `ComboBonus`, `LevelFor`, `DropInterval` | 6, 7 |
| `internal/game/game_test.go` | spawn, queue, ghost, lock pipeline, scoring, gravity, hold, game over, replay | 4–9 |
| `internal/game/rules_test.go` | movement, rotation, kicks | 5 |
| `cmd/cosmic-tetris/main.go` | `Config`, `parseFlags`, entry point | 10 |
| `cmd/cosmic-tetris/main_test.go` | flag parsing | 10 |
| `README.md` | what it is, how to run, how to test | 10 |

## Not in this plan

Deliberately deferred to later plans, one per §42 phase: Bubble Tea app + renderer + layout + resize (Phase 2), palette / starfield / animated border / trails / mission control (Phase 3), particles / impacts / supernova / shake / hyperdrive (Phase 4), boot sequence / black hole / help / ASCII fallback (Phase 5). The `--ascii`, `--no-fx`, and `--reduced-motion` flags are parsed here and consumed there.

---

### Task 1: Module scaffold and tetromino geometry

**Files:**
- Create: `go.mod`
- Create: `internal/game/piece.go`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces: `type PieceKind int` with constants `KindI, KindJ, KindL, KindO, KindS, KindT, KindZ` and `const KindCount = 7`; `func (k PieceKind) String() string`; `type Offset struct{ X, Y int }`; `type Piece struct { Kind PieceKind; Rotation int; X int; Y int }`; `func (p Piece) Cells() [4]Offset`.

- [ ] **Step 1: Create the module**

```bash
cd "$(git rev-parse --show-toplevel)"
go mod init cosmic-tetris
```

Confirm `go.mod` says `go 1.26` (Go 1.26.1 is installed); if it wrote a `toolchain` line, leave it.

- [ ] **Step 2: Write the failing test**

Create `internal/game/piece_test.go`:

```go
package game

import "testing"

// allKinds is the iteration order used throughout the tests.
var allKinds = []PieceKind{KindI, KindJ, KindL, KindO, KindS, KindT, KindZ}

func TestKindString(t *testing.T) {
	want := map[PieceKind]string{
		KindI: "I", KindJ: "J", KindL: "L", KindO: "O",
		KindS: "S", KindT: "T", KindZ: "Z",
	}
	for k, s := range want {
		if got := k.String(); got != s {
			t.Errorf("PieceKind(%d).String() = %q, want %q", int(k), got, s)
		}
	}
}

// Every rotation of every piece must occupy exactly four distinct cells inside
// a 4x4 bounding box. A duplicated or out-of-box offset means a typo in the
// shape table, which would silently corrupt collision detection.
func TestEveryRotationHasFourDistinctCellsInBox(t *testing.T) {
	for _, k := range allKinds {
		for r := 0; r < 4; r++ {
			p := Piece{Kind: k, Rotation: r}
			seen := map[Offset]bool{}
			for _, c := range p.Cells() {
				if seen[c] {
					t.Errorf("%s rotation %d: duplicate cell %+v", k, r, c)
				}
				seen[c] = true
				if c.X < 0 || c.X > 3 || c.Y < 0 || c.Y > 3 {
					t.Errorf("%s rotation %d: cell %+v outside 4x4 box", k, r, c)
				}
			}
			if len(seen) != 4 {
				t.Errorf("%s rotation %d: %d distinct cells, want 4", k, r, len(seen))
			}
		}
	}
}

// O is the one piece §6 allows to be visually identical through rotation.
func TestOIsRotationInvariant(t *testing.T) {
	base := Piece{Kind: KindO}.Cells()
	for r := 1; r < 4; r++ {
		if got := (Piece{Kind: KindO, Rotation: r}).Cells(); got != base {
			t.Errorf("O rotation %d = %v, want %v", r, got, base)
		}
	}
}

// T rotation 0 pins the table's orientation convention: the nub is up and the
// bar sits on the row below it.
func TestTSpawnShape(t *testing.T) {
	want := [4]Offset{{X: 1, Y: 0}, {X: 0, Y: 1}, {X: 1, Y: 1}, {X: 2, Y: 1}}
	if got := (Piece{Kind: KindT}).Cells(); got != want {
		t.Errorf("T rotation 0 = %v, want %v", got, want)
	}
}

func TestCellsTranslateByPiecePosition(t *testing.T) {
	p := Piece{Kind: KindT, X: 4, Y: 7}
	want := [4]Offset{{X: 5, Y: 7}, {X: 4, Y: 8}, {X: 5, Y: 8}, {X: 6, Y: 8}}
	if got := p.Cells(); got != want {
		t.Errorf("translated cells = %v, want %v", got, want)
	}
}

// Rotation is normalised, so callers may hand in any integer.
func TestCellsNormaliseRotation(t *testing.T) {
	base := Piece{Kind: KindJ, Rotation: 1}.Cells()
	for _, r := range []int{5, 9, -3, -7} {
		if got := (Piece{Kind: KindJ, Rotation: r}).Cells(); got != base {
			t.Errorf("J rotation %d = %v, want %v", r, got, base)
		}
	}
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `go test ./internal/game/`
Expected: FAIL — build error, `undefined: PieceKind`, `undefined: Piece`.

- [ ] **Step 4: Write the implementation**

Create `internal/game/piece.go`:

```go
// Package game is the Cosmic Tetris rules engine. It is headless and
// deterministic: it never reads a clock (see Advance) and never touches the
// terminal. Y grows downward; row 0 is the top hidden spawn row.
package game

// PieceKind identifies one of the seven tetromino families (§6).
type PieceKind int

const (
	KindI PieceKind = iota
	KindJ
	KindL
	KindO
	KindS
	KindT
	KindZ
)

// KindCount is how many tetromino families exist.
const KindCount = 7

var kindNames = [KindCount]string{"I", "J", "L", "O", "S", "T", "Z"}

func (k PieceKind) String() string {
	if k < 0 || int(k) >= KindCount {
		return "?"
	}
	return kindNames[k]
}

// Offset is a cell position, either relative to a piece's bounding-box origin
// or absolute on the board depending on context.
type Offset struct{ X, Y int }

// Piece is a tetromino in play: a family, a rotation index, and the board
// position of its bounding box's top-left corner.
type Piece struct {
	Kind     PieceKind
	Rotation int
	X        int
	Y        int
}

// shapes[kind][rotation] holds the four occupied cells of that rotation,
// relative to the bounding-box origin. Four explicit rotations per piece
// beats a rotation algorithm here: it is trivially inspectable and cannot
// drift (§6).
var shapes = [KindCount][4][4]Offset{
	// .... / XXXX / .... / ....
	KindI: {
		{{0, 1}, {1, 1}, {2, 1}, {3, 1}},
		{{2, 0}, {2, 1}, {2, 2}, {2, 3}},
		{{0, 2}, {1, 2}, {2, 2}, {3, 2}},
		{{1, 0}, {1, 1}, {1, 2}, {1, 3}},
	},
	// X.. / XXX / ...
	KindJ: {
		{{0, 0}, {0, 1}, {1, 1}, {2, 1}},
		{{1, 0}, {2, 0}, {1, 1}, {1, 2}},
		{{0, 1}, {1, 1}, {2, 1}, {2, 2}},
		{{1, 0}, {1, 1}, {0, 2}, {1, 2}},
	},
	// ..X / XXX / ...
	KindL: {
		{{2, 0}, {0, 1}, {1, 1}, {2, 1}},
		{{1, 0}, {1, 1}, {1, 2}, {2, 2}},
		{{0, 1}, {1, 1}, {2, 1}, {0, 2}},
		{{0, 0}, {1, 0}, {1, 1}, {1, 2}},
	},
	// .XX / .XX / ...
	KindO: {
		{{1, 0}, {2, 0}, {1, 1}, {2, 1}},
		{{1, 0}, {2, 0}, {1, 1}, {2, 1}},
		{{1, 0}, {2, 0}, {1, 1}, {2, 1}},
		{{1, 0}, {2, 0}, {1, 1}, {2, 1}},
	},
	// .XX / XX. / ...
	KindS: {
		{{1, 0}, {2, 0}, {0, 1}, {1, 1}},
		{{1, 0}, {1, 1}, {2, 1}, {2, 2}},
		{{1, 1}, {2, 1}, {0, 2}, {1, 2}},
		{{0, 0}, {0, 1}, {1, 1}, {1, 2}},
	},
	// .X. / XXX / ...
	KindT: {
		{{1, 0}, {0, 1}, {1, 1}, {2, 1}},
		{{1, 0}, {1, 1}, {2, 1}, {1, 2}},
		{{0, 1}, {1, 1}, {2, 1}, {1, 2}},
		{{1, 0}, {0, 1}, {1, 1}, {1, 2}},
	},
	// XX. / .XX / ...
	KindZ: {
		{{0, 0}, {1, 0}, {1, 1}, {2, 1}},
		{{2, 0}, {1, 1}, {2, 1}, {1, 2}},
		{{0, 1}, {1, 1}, {1, 2}, {2, 2}},
		{{1, 0}, {0, 1}, {1, 1}, {0, 2}},
	},
}

// Cells returns the four board cells this piece occupies. Rotation is
// normalised, so any integer is a legal Rotation value.
func (p Piece) Cells() [4]Offset {
	r := ((p.Rotation % 4) + 4) % 4
	cells := shapes[p.Kind][r] // array copy: safe to mutate
	for i := range cells {
		cells[i].X += p.X
		cells[i].Y += p.Y
	}
	return cells
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS — all six tests.

- [ ] **Step 6: Commit**

```bash
gofmt -l . && go vet ./... && go test ./...
git add go.mod internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): tetromino kinds and rotation tables"
```

---

### Task 2: Board — collision, row completion, collapse

**Files:**
- Create: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Piece`, `PieceKind`, `Offset` (Task 1).
- Produces: consts `BoardWidth = 10`, `BoardHeight = 22`, `HiddenRows = 2`, `VisibleRows = 20`; `type Cell struct { Filled bool; Kind PieceKind }`; `type Board struct { Cells [BoardHeight][BoardWidth]Cell }`; methods `InBounds(x, y int) bool`, `Occupied(x, y int) bool`, `Collides(p Piece) bool`, `Lock(p Piece)`, `CompleteRows() []int`, `ClearRows(rows []int)`, `String() string`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/board_test.go`:

```go
package game

import (
	"reflect"
	"testing"
)

// fill marks row y as occupied except at the listed hole columns. Tests build
// boards with this rather than literal 22-row arrays so the interesting row is
// the only thing on screen.
func fill(b *Board, y int, holes ...int) {
	hole := map[int]bool{}
	for _, x := range holes {
		hole[x] = true
	}
	for x := 0; x < BoardWidth; x++ {
		if !hole[x] {
			b.Cells[y][x] = Cell{Filled: true, Kind: KindT}
		}
	}
}

// markRow fills row y entirely with a distinguishable kind so collapse tests
// can tell rows apart after they move.
func markRow(b *Board, y int, k PieceKind, holes ...int) {
	fill(b, y, holes...)
	for x := 0; x < BoardWidth; x++ {
		if b.Cells[y][x].Filled {
			b.Cells[y][x].Kind = k
		}
	}
}

func TestGeometryMatchesSpec(t *testing.T) {
	if BoardWidth != 10 || BoardHeight != 22 || HiddenRows != 2 || VisibleRows != 20 {
		t.Fatalf("geometry drifted: %d x %d, hidden %d, visible %d",
			BoardWidth, BoardHeight, HiddenRows, VisibleRows)
	}
}

func TestInBounds(t *testing.T) {
	var b Board
	cases := []struct {
		x, y int
		want bool
	}{
		{0, 0, true},
		{BoardWidth - 1, BoardHeight - 1, true},
		{-1, 0, false},
		{BoardWidth, 0, false},
		{0, -1, false},
		{0, BoardHeight, false},
	}
	for _, c := range cases {
		if got := b.InBounds(c.x, c.y); got != c.want {
			t.Errorf("InBounds(%d,%d) = %v, want %v", c.x, c.y, got, c.want)
		}
	}
}

// Everything off the board counts as occupied, which is what makes Collides a
// single loop with no special cases.
func TestOccupiedTreatsOutOfBoundsAsSolid(t *testing.T) {
	var b Board
	if !b.Occupied(-1, 5) || !b.Occupied(BoardWidth, 5) || !b.Occupied(3, BoardHeight) {
		t.Error("out-of-bounds cells must report occupied")
	}
	if b.Occupied(3, 5) {
		t.Error("empty in-bounds cell must report free")
	}
	b.Cells[5][3] = Cell{Filled: true, Kind: KindZ}
	if !b.Occupied(3, 5) {
		t.Error("filled cell must report occupied")
	}
}

func TestCollides(t *testing.T) {
	var b Board
	// O piece occupies bounding-box columns 1-2, rows 0-1.
	free := Piece{Kind: KindO, X: 4, Y: 10}
	if b.Collides(free) {
		t.Error("piece in open space must not collide")
	}
	if !b.Collides(Piece{Kind: KindO, X: -2, Y: 10}) {
		t.Error("piece through the left wall must collide")
	}
	if !b.Collides(Piece{Kind: KindO, X: BoardWidth - 1, Y: 10}) {
		t.Error("piece through the right wall must collide")
	}
	if !b.Collides(Piece{Kind: KindO, X: 4, Y: BoardHeight - 1}) {
		t.Error("piece through the floor must collide")
	}
	b.Cells[11][5] = Cell{Filled: true, Kind: KindI}
	if !b.Collides(free) {
		t.Error("piece overlapping a locked cell must collide")
	}
}

func TestLockWritesCellsWithKind(t *testing.T) {
	var b Board
	p := Piece{Kind: KindS, X: 2, Y: 9}
	b.Lock(p)
	for _, c := range p.Cells() {
		got := b.Cells[c.Y][c.X]
		if !got.Filled || got.Kind != KindS {
			t.Errorf("cell %+v = %+v, want filled S", c, got)
		}
	}
	if n := filledCount(&b); n != 4 {
		t.Errorf("locked %d cells, want 4", n)
	}
}

func filledCount(b *Board) int {
	n := 0
	for y := 0; y < BoardHeight; y++ {
		for x := 0; x < BoardWidth; x++ {
			if b.Cells[y][x].Filled {
				n++
			}
		}
	}
	return n
}

func TestCompleteRows(t *testing.T) {
	var b Board
	if rows := b.CompleteRows(); len(rows) != 0 {
		t.Errorf("empty board reported rows %v", rows)
	}
	fill(&b, 21)
	fill(&b, 19, 4) // one hole: not complete
	fill(&b, 18)
	got := b.CompleteRows()
	want := []int{18, 21}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("CompleteRows() = %v, want %v (ascending)", got, want)
	}
}

// A row can complete inside the hidden spawn rows when the stack reaches
// orbit; it must clear like any other row.
func TestCompleteRowsIncludesHiddenRows(t *testing.T) {
	var b Board
	fill(&b, 1)
	if got := b.CompleteRows(); !reflect.DeepEqual(got, []int{1}) {
		t.Errorf("CompleteRows() = %v, want [1]", got)
	}
}

func TestClearRowsCollapsesFromAbove(t *testing.T) {
	var b Board
	markRow(&b, 19, KindI)       // complete, will clear
	markRow(&b, 20, KindJ, 0, 1) // survivor with holes
	markRow(&b, 21, KindL)       // complete, will clear
	b.ClearRows([]int{19, 21})

	// The survivor should now be the bottom row, holes intact.
	for x := 0; x < BoardWidth; x++ {
		want := x >= 2
		got := b.Cells[BoardHeight-1][x]
		if got.Filled != want {
			t.Errorf("bottom row col %d filled = %v, want %v", x, got.Filled, want)
		}
		if want && got.Kind != KindJ {
			t.Errorf("bottom row col %d kind = %v, want J", x, got.Kind)
		}
	}
	if n := filledCount(&b); n != BoardWidth-2 {
		t.Errorf("%d cells remain, want %d", n, BoardWidth-2)
	}
}

func TestClearRowsFourAtOnce(t *testing.T) {
	var b Board
	for y := 18; y <= 21; y++ {
		fill(&b, y)
	}
	b.ClearRows([]int{18, 19, 20, 21})
	if n := filledCount(&b); n != 0 {
		t.Errorf("%d cells remain after a four-line clear, want 0", n)
	}
}

func TestClearRowsEmptyIsNoOp(t *testing.T) {
	var b Board
	fill(&b, 21, 3)
	before := b
	b.ClearRows(nil)
	if b != before {
		t.Error("ClearRows(nil) modified the board")
	}
}

func TestStringRendersOneCharPerCell(t *testing.T) {
	var b Board
	fill(&b, 21)
	lines := splitLines(b.String())
	if len(lines) != BoardHeight {
		t.Fatalf("String() has %d rows, want %d", len(lines), BoardHeight)
	}
	if lines[0] != ".........." {
		t.Errorf("top row = %q, want all dots", lines[0])
	}
	if lines[BoardHeight-1] != "##########" {
		t.Errorf("bottom row = %q, want all hashes", lines[BoardHeight-1])
	}
}

func splitLines(s string) []string {
	var out []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			out = append(out, s[start:i])
			start = i + 1
		}
	}
	return out
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/`
Expected: FAIL — `undefined: BoardWidth`, `undefined: Board`.

- [ ] **Step 3: Write the implementation**

Create `internal/game/board.go`:

```go
package game

import "strings"

// Board geometry (§5). The top HiddenRows rows are the spawn area and are not
// drawn; the remaining VisibleRows are what the player sees.
const (
	BoardWidth  = 10
	BoardHeight = 22
	HiddenRows  = 2
	VisibleRows = BoardHeight - HiddenRows
)

// Cell is one playfield square. Kind is only meaningful when Filled.
type Cell struct {
	Filled bool
	Kind   PieceKind
}

// Board holds locked blocks only; the active piece lives on Game. Row 0 is the
// top hidden row and row BoardHeight-1 is the floor row.
type Board struct {
	Cells [BoardHeight][BoardWidth]Cell
}

// InBounds reports whether (x, y) is a real board cell.
func (b *Board) InBounds(x, y int) bool {
	return x >= 0 && x < BoardWidth && y >= 0 && y < BoardHeight
}

// Occupied reports whether (x, y) blocks a piece. Anything off the board is
// solid, so walls and floor need no special handling in Collides.
func (b *Board) Occupied(x, y int) bool {
	if !b.InBounds(x, y) {
		return true
	}
	return b.Cells[y][x].Filled
}

// Collides reports whether the piece overlaps a locked cell or leaves the
// board. This is the single source of truth for legality: visual effects are
// never consulted (§5).
func (b *Board) Collides(p Piece) bool {
	for _, c := range p.Cells() {
		if b.Occupied(c.X, c.Y) {
			return true
		}
	}
	return false
}

// Lock commits a piece's cells to the board.
func (b *Board) Lock(p Piece) {
	for _, c := range p.Cells() {
		if b.InBounds(c.X, c.Y) {
			b.Cells[c.Y][c.X] = Cell{Filled: true, Kind: p.Kind}
		}
	}
}

// CompleteRows returns the indices of fully filled rows, top to bottom.
func (b *Board) CompleteRows() []int {
	var rows []int
	for y := 0; y < BoardHeight; y++ {
		full := true
		for x := 0; x < BoardWidth; x++ {
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

// ClearRows removes the given rows and collapses everything above them down,
// leaving empty rows at the top.
func (b *Board) ClearRows(rows []int) {
	if len(rows) == 0 {
		return
	}
	var remove [BoardHeight]bool
	for _, y := range rows {
		if y >= 0 && y < BoardHeight {
			remove[y] = true
		}
	}
	dst := BoardHeight - 1
	for src := BoardHeight - 1; src >= 0; src-- {
		if remove[src] {
			continue
		}
		b.Cells[dst] = b.Cells[src]
		dst--
	}
	for ; dst >= 0; dst-- {
		b.Cells[dst] = [BoardWidth]Cell{}
	}
}

// String renders the board as plain text, one character per cell. This exists
// for test failure messages and debugging, not for the game display.
func (b *Board) String() string {
	var sb strings.Builder
	sb.Grow(BoardHeight * (BoardWidth + 1))
	for y := 0; y < BoardHeight; y++ {
		for x := 0; x < BoardWidth; x++ {
			if b.Cells[y][x].Filled {
				sb.WriteByte('#')
			} else {
				sb.WriteByte('.')
			}
		}
		sb.WriteByte('\n')
	}
	return sb.String()
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/game/ -run 'Board|Bounds|Occupied|Collides|Lock|Complete|Clear|Geometry|String' -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && go vet ./... && go test ./...
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board collision, row completion and collapse"
```

---

### Task 3: 7-bag piece generation

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `KindCount` (Task 1).
- Produces: `type Bag struct { remaining []PieceKind }`; `func (b *Bag) Next(rng *rand.Rand) PieceKind`; `func newRNG(seed int64) *rand.Rand`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/bag_test.go`:

```go
package game

import "testing"

// Draw n kinds from a fresh bag seeded with seed.
func draw(seed int64, n int) []PieceKind {
	rng := newRNG(seed)
	var bag Bag
	out := make([]PieceKind, 0, n)
	for i := 0; i < n; i++ {
		out = append(out, bag.Next(rng))
	}
	return out
}

// §6/§40: every bag holds all seven kinds exactly once.
func TestEveryBagContainsAllSevenKindsOnce(t *testing.T) {
	got := draw(12345, 7*4)
	for b := 0; b < 4; b++ {
		var count [KindCount]int
		for _, k := range got[b*7 : b*7+7] {
			count[k]++
		}
		for k, n := range count {
			if n != 1 {
				t.Errorf("bag %d: %v appears %d times, want 1 (bag: %v)",
					b, PieceKind(k), n, got[b*7:b*7+7])
			}
		}
	}
}

// §35: seeded generation is reproducible.
func TestSeededBagIsReproducible(t *testing.T) {
	a := draw(8675309, 21)
	b := draw(8675309, 21)
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("draw %d: %v vs %v (sequences diverged)\n%v\n%v", i, a[i], b[i], a, b)
		}
	}
}

func TestDifferentSeedsProduceDifferentOrder(t *testing.T) {
	a := draw(1, 21)
	b := draw(2, 21)
	same := true
	for i := range a {
		if a[i] != b[i] {
			same = false
			break
		}
	}
	if same {
		t.Errorf("seeds 1 and 2 produced identical sequences: %v", a)
	}
}

// The bag must not be handed out in a fixed order: over four bags, at least
// one bag should differ from the canonical I J L O S T Z ordering.
func TestBagIsShuffled(t *testing.T) {
	got := draw(99, 7*4)
	canonical := []PieceKind{KindI, KindJ, KindL, KindO, KindS, KindT, KindZ}
	shuffledSomewhere := false
	for b := 0; b < 4; b++ {
		for i, k := range got[b*7 : b*7+7] {
			if k != canonical[i] {
				shuffledSomewhere = true
			}
		}
	}
	if !shuffledSomewhere {
		t.Errorf("four consecutive bags all came out in canonical order: %v", got)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run Bag`
Expected: FAIL — `undefined: newRNG`, `undefined: Bag`.

- [ ] **Step 3: Write the implementation**

Create `internal/game/bag.go`:

```go
package game

import "math/rand/v2"

// newRNG builds the deterministic generator that drives piece order. The FX
// layer must construct its own generator: sharing one would make piece order
// depend on particle counts and break replay (§49.6).
func newRNG(seed int64) *rand.Rand {
	return rand.New(rand.NewPCG(uint64(seed), uint64(seed)+0x9E3779B97F4A7C15))
}

// Bag is the 7-bag randomiser (§6): deal each kind once in shuffled order,
// then refill.
type Bag struct {
	remaining []PieceKind
}

// Next deals the next kind, refilling and shuffling when the bag runs dry.
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
	// Fisher-Yates.
	for i := len(b.remaining) - 1; i > 0; i-- {
		j := rng.IntN(i + 1)
		b.remaining[i], b.remaining[j] = b.remaining[j], b.remaining[i]
	}
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/game/ -run Bag -v`
Expected: PASS — four tests.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && go vet ./... && go test ./...
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag piece generation"
```

---

### Task 4: Game state, events, spawn, next queue, ghost

**Files:**
- Create: `internal/game/events.go`
- Create: `internal/game/game.go`
- Create: `internal/game/rules.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: `Piece`, `Board`, `Bag`, `newRNG` (Tasks 1–3).
- Produces: `type EventKind int` with `EventPieceMoved, EventPieceRotated, EventPieceHardDropped, EventPieceLocked, EventHoldUsed, EventLinesCleared, EventComboChanged, EventLevelChanged, EventGameOver` and `func (k EventKind) String() string`; `type Event struct { Kind EventKind; Piece Piece; Rows []int; Value int; Points int }`; `type Game struct { … }` with exported fields `Board Board`, `Active Piece`, `Hold *PieceKind`, `CanHold bool`, `Next []PieceKind`, `Bag Bag`, `Score, Lines, Level, Combo int`, `GravityAccumulator, LockAccumulator time.Duration`, `LockResets int`, `Over bool`, `Seed int64`; consts `NextQueueLen = 5`, `SpawnX = 3`, `SpawnY = 0`; `func New(seed int64) *Game`; `func (g *Game) Restart()`; `func (g *Game) GhostY() int`; unexported `takeNext()`, `spawn(k PieceKind) []Event`, `grounded() bool`, `tryMove(dx, dy int) bool`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/game_test.go`:

```go
package game

import (
	"testing"
)

// kinds extracts the kinds from an event slice for readable assertions.
func kindsOf(events []Event) []EventKind {
	out := make([]EventKind, 0, len(events))
	for _, e := range events {
		out = append(out, e.Kind)
	}
	return out
}

// hasEvent reports whether any event has the given kind.
func hasEvent(events []Event, k EventKind) bool {
	for _, e := range events {
		if e.Kind == k {
			return true
		}
	}
	return false
}

// findEvent returns the first event of a kind, and whether it was found.
func findEvent(events []Event, k EventKind) (Event, bool) {
	for _, e := range events {
		if e.Kind == k {
			return e, true
		}
	}
	return Event{}, false
}

func TestEventKindString(t *testing.T) {
	if got := EventLinesCleared.String(); got != "LinesCleared" {
		t.Errorf("EventLinesCleared.String() = %q, want %q", got, "LinesCleared")
	}
	if got := EventKind(99).String(); got == "" {
		t.Error("unknown EventKind must still render something")
	}
}

func TestNewStartsAtLevelOneWithFullQueue(t *testing.T) {
	g := New(42)
	if g.Level != 1 {
		t.Errorf("Level = %d, want 1", g.Level)
	}
	if g.Score != 0 || g.Lines != 0 || g.Combo != 0 {
		t.Errorf("Score/Lines/Combo = %d/%d/%d, want 0/0/0", g.Score, g.Lines, g.Combo)
	}
	if !g.CanHold {
		t.Error("CanHold must start true")
	}
	if g.Hold != nil {
		t.Errorf("Hold = %v, want nil", g.Hold)
	}
	if len(g.Next) != NextQueueLen {
		t.Errorf("len(Next) = %d, want %d", len(g.Next), NextQueueLen)
	}
	if g.Over {
		t.Error("a new game must not be over")
	}
	if g.Seed != 42 {
		t.Errorf("Seed = %d, want 42", g.Seed)
	}
}

// §6: the spawn position puts the whole piece in the hidden rows so it slides
// into view under gravity.
func TestSpawnSitsInHiddenRows(t *testing.T) {
	for _, k := range allKinds {
		g := New(1)
		g.Active = Piece{Kind: k, X: SpawnX, Y: SpawnY}
		for _, c := range g.Active.Cells() {
			if c.Y >= HiddenRows {
				t.Errorf("%s spawns with cell at row %d, want < %d", k, c.Y, HiddenRows)
			}
			if c.X < 0 || c.X >= BoardWidth {
				t.Errorf("%s spawns with cell at column %d, out of board", k, c.X)
			}
		}
	}
}

// The queue is topped up as it is consumed, so the HUD always has five to draw.
func TestTakeNextKeepsQueueFull(t *testing.T) {
	g := New(7)
	first := g.Next[0]
	got := g.takeNext()
	if got != first {
		t.Errorf("takeNext() = %v, want front of queue %v", got, first)
	}
	if len(g.Next) != NextQueueLen {
		t.Errorf("len(Next) = %d after takeNext, want %d", len(g.Next), NextQueueLen)
	}
}

func TestSpawnResetsTimers(t *testing.T) {
	g := New(3)
	g.GravityAccumulator = 500
	g.LockAccumulator = 400
	g.LockResets = 9
	if events := g.spawn(KindT); len(events) != 0 {
		t.Fatalf("spawn on an empty board returned %v", kindsOf(events))
	}
	if g.GravityAccumulator != 0 || g.LockAccumulator != 0 || g.LockResets != 0 {
		t.Errorf("timers after spawn = %v/%v/%d, want zeroes",
			g.GravityAccumulator, g.LockAccumulator, g.LockResets)
	}
	if g.Active.Kind != KindT || g.Active.Rotation != 0 ||
		g.Active.X != SpawnX || g.Active.Y != SpawnY {
		t.Errorf("Active = %+v, want T at spawn", g.Active)
	}
}

// §10: the ghost is the landing position — one cell further must collide.
func TestGhostYIsTheLandingPosition(t *testing.T) {
	for _, k := range allKinds {
		g := New(5)
		g.Active = Piece{Kind: k, X: 3, Y: 0}
		rest := g.GhostY()
		landed := g.Active
		landed.Y = rest
		if g.Board.Collides(landed) {
			t.Errorf("%s: ghost position %d collides", k, rest)
		}
		below := landed
		below.Y++
		if !g.Board.Collides(below) {
			t.Errorf("%s: ghost position %d is not the lowest legal row", k, rest)
		}
	}
}

func TestGhostYRestsOnTheStack(t *testing.T) {
	g := New(5)
	g.Active = Piece{Kind: KindO, X: 4, Y: 0}
	fill(&g.Board, 15) // a solid floor at row 15
	rest := g.GhostY()
	// O occupies bounding-box rows 0 and 1, so its box top rests at 13.
	if rest != 13 {
		t.Errorf("GhostY() = %d, want 13 (resting on row 15)", rest)
	}
	if g.Active.Y != 0 {
		t.Error("GhostY must not move the active piece")
	}
}

func TestRestartRebuildsTheSameUniverse(t *testing.T) {
	g := New(4242)
	openingQueue := append([]PieceKind{g.Active.Kind}, g.Next...)
	g.Score = 999
	g.Lines = 33
	g.Level = 5
	g.Combo = 4
	g.Over = true
	fill(&g.Board, 21)

	g.Restart()

	if g.Score != 0 || g.Lines != 0 || g.Level != 1 || g.Combo != 0 || g.Over {
		t.Errorf("after Restart: score %d lines %d level %d combo %d over %v",
			g.Score, g.Lines, g.Level, g.Combo, g.Over)
	}
	if n := filledCount(&g.Board); n != 0 {
		t.Errorf("after Restart the board still holds %d cells", n)
	}
	if g.Seed != 4242 {
		t.Errorf("Seed = %d, want 4242", g.Seed)
	}
	got := append([]PieceKind{g.Active.Kind}, g.Next...)
	for i := range openingQueue {
		if got[i] != openingQueue[i] {
			t.Fatalf("restart changed piece order: %v vs %v", got, openingQueue)
		}
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run 'Event|New|Spawn|TakeNext|Ghost|Restart'`
Expected: FAIL — `undefined: New`, `undefined: EventKind`.

- [ ] **Step 3: Write the event type**

Create `internal/game/events.go`:

```go
package game

// EventKind says what happened during a state change (§14). Events are the
// only channel from the engine to the effects layer, and the traffic is
// one-way: FX may observe events, never modify game state.
type EventKind int

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

var eventNames = map[EventKind]string{
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
	if name, ok := eventNames[k]; ok {
		return name
	}
	return "EventKind(?)"
}

// Event describes one thing that happened. One flat struct beats an interface
// hierarchy here: the FX layer switches on Kind and reads the fields it cares
// about. Which fields are populated depends on Kind:
//
//	EventPieceMoved        Piece: the piece after moving. Points: soft-drop points, if any.
//	EventPieceRotated      Piece: the piece after rotating.
//	EventPieceHardDropped  Piece: the resting piece. Value: cells fallen. Points: points awarded.
//	EventPieceLocked       Piece: the piece as committed to the board.
//	EventHoldUsed          Piece: the piece that entered play.
//	EventLinesCleared      Rows: cleared rows in board coordinates, before collapse.
//	                       Value: how many. Points: points awarded including combo bonus.
//	EventComboChanged      Value: the new combo count (0 when broken).
//	EventLevelChanged      Value: the new level.
//	EventGameOver          Piece: the piece that could not spawn.
type Event struct {
	Kind   EventKind
	Piece  Piece
	Rows   []int
	Value  int
	Points int
}
```

- [ ] **Step 4: Write the game state**

Create `internal/game/game.go`:

```go
package game

import (
	"math/rand/v2"
	"time"
)

const (
	// NextQueueLen is how many upcoming pieces stay visible (§6).
	NextQueueLen = 5
	// SpawnX and SpawnY place a new piece's bounding box: horizontally
	// centred, entirely inside the hidden rows.
	SpawnX = 3
	SpawnY = 0
)

// Game is the whole logical game. Exported fields are the renderer's read-only
// view; the rng is private because sharing it would break replay (§49.6).
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

	GravityAccumulator time.Duration
	LockAccumulator    time.Duration
	LockResets         int

	Over bool

	Seed int64 // recorded for display and restart

	rng *rand.Rand // game RNG: drives the 7-bag, nothing else
}

// New starts a game from a seed. The same seed always deals the same pieces.
func New(seed int64) *Game {
	g := &Game{
		Level:   1,
		CanHold: true,
		Seed:    seed,
		rng:     newRNG(seed),
	}
	for len(g.Next) < NextQueueLen {
		g.Next = append(g.Next, g.Bag.Next(g.rng))
	}
	g.spawn(g.takeNext()) // cannot fail on an empty board
	return g
}

// Restart rebuilds the game from the same seed, replaying the same pieces.
func (g *Game) Restart() {
	*g = *New(g.Seed)
}

// takeNext pops the front of the queue and tops it back up from the bag.
func (g *Game) takeNext() PieceKind {
	k := g.Next[0]
	g.Next = g.Next[1:]
	for len(g.Next) < NextQueueLen {
		g.Next = append(g.Next, g.Bag.Next(g.rng))
	}
	return k
}

// spawn puts a new piece at the spawn position in spawn rotation and resets the
// per-piece timers. If it does not fit, the stack has reached orbit and the
// game is over (§28, §40).
func (g *Game) spawn(k PieceKind) []Event {
	p := Piece{Kind: k, Rotation: 0, X: SpawnX, Y: SpawnY}
	g.Active = p
	g.GravityAccumulator = 0
	g.LockAccumulator = 0
	g.LockResets = 0
	if g.Board.Collides(p) {
		g.Over = true
		return []Event{{Kind: EventGameOver, Piece: p}}
	}
	return nil
}
```

- [ ] **Step 5: Write the movement primitives the ghost needs**

Create `internal/game/rules.go`:

```go
package game

// tryMove shifts the active piece by (dx, dy) if the destination is legal, and
// reports whether it moved.
func (g *Game) tryMove(dx, dy int) bool {
	p := g.Active
	p.X += dx
	p.Y += dy
	if g.Board.Collides(p) {
		return false
	}
	g.Active = p
	return true
}

// grounded reports whether the active piece is resting on the floor or stack.
func (g *Game) grounded() bool {
	p := g.Active
	p.Y++
	return g.Board.Collides(p)
}

// GhostY is the Y the active piece would come to rest at if dropped now (§10).
// It does not move the piece.
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

- [ ] **Step 6: Run the test to verify it passes**

Run: `go test ./internal/game/ -run 'Event|New|Spawn|TakeNext|Ghost|Restart' -v`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
gofmt -l . && go vet ./... && go test ./...
git add internal/game/events.go internal/game/game.go internal/game/rules.go internal/game/game_test.go
git commit -m "feat(game): game state, events, spawn queue and ghost"
```

---

### Task 5: Movement, rotation and wall kicks

**Files:**
- Modify: `internal/game/rules.go` (append)
- Test: `internal/game/rules_test.go`

**Interfaces:**
- Consumes: `Game`, `tryMove`, `grounded`, `Event` (Task 4).
- Produces: `func (g *Game) MoveLeft() []Event`, `func (g *Game) MoveRight() []Event`, `func (g *Game) RotateCW() []Event`, `func (g *Game) RotateCCW() []Event`; consts `LockDelay = 500 * time.Millisecond` and `MaxLockResets = 15` (declared in this task's Step 3, in `rules.go`; Task 7's `Advance` is the other user); unexported `touchLockTimer()`; `var kickOffsets [8]Offset`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/rules_test.go`:

```go
package game

import "testing"

// pieceAt builds a game whose active piece is exactly what the test wants.
func pieceAt(k PieceKind, rotation, x, y int) *Game {
	g := New(1)
	g.Active = Piece{Kind: k, Rotation: rotation, X: x, Y: y}
	return g
}

func TestMoveLeftAndRight(t *testing.T) {
	g := pieceAt(KindO, 0, 4, 10)
	if events := g.MoveLeft(); !hasEvent(events, EventPieceMoved) {
		t.Fatalf("MoveLeft returned %v, want a PieceMoved event", kindsOf(events))
	}
	if g.Active.X != 3 {
		t.Errorf("X = %d after MoveLeft, want 3", g.Active.X)
	}
	if events := g.MoveRight(); !hasEvent(events, EventPieceMoved) {
		t.Fatalf("MoveRight returned %v, want a PieceMoved event", kindsOf(events))
	}
	if g.Active.X != 4 {
		t.Errorf("X = %d after MoveRight, want 4", g.Active.X)
	}
}

// A blocked move is a silent no-op: no state change, no event for the FX layer
// to react to.
func TestBlockedMoveIsSilent(t *testing.T) {
	// O occupies box columns 1-2, so X = -1 puts it against the left wall.
	g := pieceAt(KindO, 0, -1, 10)
	if events := g.MoveLeft(); len(events) != 0 {
		t.Errorf("blocked MoveLeft returned %v, want nothing", kindsOf(events))
	}
	if g.Active.X != -1 {
		t.Errorf("blocked MoveLeft moved the piece to X = %d", g.Active.X)
	}

	g = pieceAt(KindO, 0, BoardWidth-3, 10)
	if events := g.MoveRight(); len(events) != 0 {
		t.Errorf("blocked MoveRight returned %v, want nothing", kindsOf(events))
	}
}

func TestMoveBlockedByLockedCells(t *testing.T) {
	g := pieceAt(KindO, 0, 4, 10)
	g.Board.Cells[10][4] = Cell{Filled: true, Kind: KindI}
	if events := g.MoveLeft(); len(events) != 0 {
		t.Errorf("move into a locked cell returned %v, want nothing", kindsOf(events))
	}
}

func TestRotateCyclesThroughFourRotations(t *testing.T) {
	g := pieceAt(KindT, 0, 4, 10)
	for want := 1; want <= 4; want++ {
		events := g.RotateCW()
		if !hasEvent(events, EventPieceRotated) {
			t.Fatalf("RotateCW returned %v, want a PieceRotated event", kindsOf(events))
		}
		if got := g.Active.Rotation; got != want%4 {
			t.Fatalf("Rotation = %d, want %d", got, want%4)
		}
	}
	if g.Active.X != 4 || g.Active.Y != 10 {
		t.Errorf("open-space rotation drifted to (%d,%d), want (4,10)", g.Active.X, g.Active.Y)
	}
}

func TestRotateCCW(t *testing.T) {
	g := pieceAt(KindT, 0, 4, 10)
	if events := g.RotateCCW(); !hasEvent(events, EventPieceRotated) {
		t.Fatalf("RotateCCW returned %v, want a PieceRotated event", kindsOf(events))
	}
	if g.Active.Rotation != 3 {
		t.Errorf("Rotation = %d after RotateCCW from 0, want 3", g.Active.Rotation)
	}
}

// §7: a rotation that does not fit in place is nudged by the kick list. A
// vertical I flush against the right wall needs a leftward kick to lie down.
func TestWallKickPushesPieceInFromTheWall(t *testing.T) {
	// I rotation 1 occupies box column 2; X = 7 puts its cells in column 9.
	g := pieceAt(KindI, 1, 7, 10)
	if g.Board.Collides(g.Active) {
		t.Fatal("test setup: starting position already collides")
	}
	events := g.RotateCW()
	if !hasEvent(events, EventPieceRotated) {
		t.Fatalf("rotation against the wall returned %v, want a PieceRotated event", kindsOf(events))
	}
	if g.Board.Collides(g.Active) {
		t.Errorf("kicked position %+v collides", g.Active)
	}
	if g.Active.X == 7 {
		t.Error("rotation should have been kicked sideways, but X did not change")
	}
}

// §7: when no offset works, rotation fails and nothing changes.
func TestRotationFailsWhenBoxedIn(t *testing.T) {
	g := pieceAt(KindI, 1, 3, 18)
	// Wall in every cell around the piece's column so no kick can succeed.
	for y := 0; y < BoardHeight; y++ {
		for x := 0; x < BoardWidth; x++ {
			if x != 5 {
				g.Board.Cells[y][x] = Cell{Filled: true, Kind: KindZ}
			}
		}
	}
	g.Active = Piece{Kind: KindI, Rotation: 1, X: 3, Y: 18}
	if g.Board.Collides(g.Active) {
		t.Fatal("test setup: starting position already collides")
	}
	before := g.Active
	if events := g.RotateCW(); len(events) != 0 {
		t.Errorf("boxed-in rotation returned %v, want nothing", kindsOf(events))
	}
	if g.Active != before {
		t.Errorf("failed rotation changed the piece: %+v, want %+v", g.Active, before)
	}
}

// Review Focus 5: whatever the kick list does, the result is always a legal
// position. Sweep every kind, rotation and position on an empty board and on a
// board with a tall stack.
func TestRotationNeverProducesIllegalPosition(t *testing.T) {
	stack := func(g *Game) {
		for y := 12; y < BoardHeight; y++ {
			fill(&g.Board, y, 3, 4)
		}
	}
	for _, setup := range []func(*Game){func(*Game) {}, stack} {
		for _, k := range allKinds {
			for r := 0; r < 4; r++ {
				for x := -3; x <= BoardWidth+1; x++ {
					for y := 0; y < BoardHeight; y++ {
						g := New(1)
						setup(g)
						g.Active = Piece{Kind: k, Rotation: r, X: x, Y: y}
						if g.Board.Collides(g.Active) {
							continue // not a reachable state
						}
						for _, rotate := range []func() []Event{g.RotateCW, g.RotateCCW} {
							before := g.Active
							rotate()
							if g.Board.Collides(g.Active) {
								t.Fatalf("%s r%d at (%d,%d): rotation produced illegal %+v",
									k, r, x, y, g.Active)
							}
							g.Active = before
						}
					}
				}
			}
		}
	}
}

// §12: a successful grounded move resets the lock timer, up to the cap.
func TestGroundedMoveResetsLockTimer(t *testing.T) {
	g := pieceAt(KindO, 0, 4, BoardHeight-2)
	if !g.grounded() {
		t.Fatal("test setup: piece is not grounded")
	}
	g.LockAccumulator = LockDelay - 1
	g.MoveLeft()
	if g.LockAccumulator != 0 {
		t.Errorf("LockAccumulator = %v after a grounded move, want 0", g.LockAccumulator)
	}
	if g.LockResets != 1 {
		t.Errorf("LockResets = %d, want 1", g.LockResets)
	}
}

func TestLockResetsAreCapped(t *testing.T) {
	g := pieceAt(KindO, 0, 4, BoardHeight-2)
	for i := 0; i < MaxLockResets+5; i++ {
		g.LockAccumulator = LockDelay - 1
		if i%2 == 0 {
			g.MoveLeft()
		} else {
			g.MoveRight()
		}
	}
	if g.LockResets != MaxLockResets {
		t.Errorf("LockResets = %d, want the cap %d", g.LockResets, MaxLockResets)
	}
	if g.LockAccumulator != LockDelay-1 {
		t.Errorf("LockAccumulator = %v, want the timer left running past the cap",
			g.LockAccumulator)
	}
}

// A move that lifts the piece off the stack is not a lock reset.
func TestUngroundedMoveDoesNotConsumeALockReset(t *testing.T) {
	g := pieceAt(KindO, 0, 4, 10)
	g.MoveLeft()
	if g.LockResets != 0 {
		t.Errorf("LockResets = %d after a mid-air move, want 0", g.LockResets)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run 'Move|Rotat|Lock'`
Expected: FAIL — `undefined: MoveLeft`, `undefined: LockDelay`.

- [ ] **Step 3: Append the implementation to `internal/game/rules.go`**

```go
// Lock timing (§12). Declared here because touchLockTimer needs them; Advance
// in game.go is the other user.
const (
	// LockDelay is how long a grounded piece waits before committing.
	LockDelay = 500 * time.Millisecond
	// MaxLockResets caps how many times move-resetting can postpone a lock,
	// so a player cannot stall forever.
	MaxLockResets = 15
)

// kickOffsets are tried in order when a rotation does not fit where it is
// (§7). This short deliberate list replaces the full SRS ruleset: it is
// forgiving, predictable, and not a subsystem.
var kickOffsets = [8]Offset{
	{X: 0, Y: 0},
	{X: -1, Y: 0},
	{X: 1, Y: 0},
	{X: -2, Y: 0},
	{X: 2, Y: 0},
	{X: 0, Y: -1},
	{X: -1, Y: -1},
	{X: 1, Y: -1},
}

// MoveLeft shifts the active piece one column left.
func (g *Game) MoveLeft() []Event { return g.shift(-1) }

// MoveRight shifts the active piece one column right.
func (g *Game) MoveRight() []Event { return g.shift(1) }

func (g *Game) shift(dx int) []Event {
	if g.Over {
		return nil
	}
	if !g.tryMove(dx, 0) {
		return nil
	}
	g.touchLockTimer()
	return []Event{{Kind: EventPieceMoved, Piece: g.Active}}
}

// RotateCW rotates the active piece clockwise, kicking if needed.
func (g *Game) RotateCW() []Event { return g.rotate(1) }

// RotateCCW rotates the active piece counter-clockwise, kicking if needed.
func (g *Game) RotateCCW() []Event { return g.rotate(-1) }

func (g *Game) rotate(delta int) []Event {
	if g.Over {
		return nil
	}
	target := g.Active
	target.Rotation = ((target.Rotation+delta)%4 + 4) % 4
	for _, k := range kickOffsets {
		candidate := target
		candidate.X += k.X
		candidate.Y += k.Y
		if g.Board.Collides(candidate) {
			continue
		}
		g.Active = candidate
		g.touchLockTimer()
		return []Event{{Kind: EventPieceRotated, Piece: g.Active}}
	}
	return nil // rotation fails; nothing changes
}

// touchLockTimer restarts the lock delay after a successful move or rotation
// while grounded, up to MaxLockResets times for this piece (§12).
func (g *Game) touchLockTimer() {
	if !g.grounded() {
		return
	}
	if g.LockResets >= MaxLockResets {
		return
	}
	g.LockResets++
	g.LockAccumulator = 0
}
```

Add the import at the top of `internal/game/rules.go`:

```go
import "time"
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/game/ -run 'Move|Rotat|Lock' -v`
Expected: PASS — including `TestRotationNeverProducesIllegalPosition`, which sweeps every kind and position.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && go vet ./... && go test ./...
git add internal/game/rules.go internal/game/rules_test.go
git commit -m "feat(game): movement, rotation and forgiving wall kicks"
```

---

### Task 6: Lock pipeline — clear, score, combo, level

**Files:**
- Create: `internal/game/scoring.go`
- Modify: `internal/game/game.go` (append `lockPiece`)
- Test: `internal/game/scoring_test.go`
- Test: `internal/game/game_test.go` (append)

**Interfaces:**
- Consumes: `Game`, `Board.CompleteRows`, `Board.ClearRows`, `Event`, `spawn`, `takeNext` (Tasks 2, 4).
- Produces: `func LineScore(n, level int) int`, `func ComboBonus(combo, level int) int`, `func LevelFor(lines int) int`, `const LinesPerLevel = 10`; unexported `func (g *Game) lockPiece() []Event`.

- [ ] **Step 1: Write the failing scoring test**

Create `internal/game/scoring_test.go`:

```go
package game

import "testing"

// §13 base clear values.
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
		{5, 1, 0}, // impossible; must not panic or invent a value
	}
	for _, c := range cases {
		if got := LineScore(c.lines, c.level); got != c.want {
			t.Errorf("LineScore(%d, %d) = %d, want %d", c.lines, c.level, got, c.want)
		}
	}
}

// §49.1: bonus is 50 x (combo-1) x level, so a lone clear earns nothing and
// the bonus first appears at combo 2.
func TestComboBonus(t *testing.T) {
	cases := []struct {
		combo, level, want int
	}{
		{0, 5, 0},
		{1, 5, 0},
		{2, 1, 50},
		{2, 5, 250},
		{3, 2, 200},
		{7, 3, 900},
	}
	for _, c := range cases {
		if got := ComboBonus(c.combo, c.level); got != c.want {
			t.Errorf("ComboBonus(%d, %d) = %d, want %d", c.combo, c.level, got, c.want)
		}
	}
}

// §11: a level every ten lines, starting at level 1.
func TestLevelFor(t *testing.T) {
	cases := []struct {
		lines, want int
	}{
		{0, 1}, {1, 1}, {9, 1}, {10, 2}, {19, 2}, {20, 3}, {127, 13},
	}
	for _, c := range cases {
		if got := LevelFor(c.lines); got != c.want {
			t.Errorf("LevelFor(%d) = %d, want %d", c.lines, got, c.want)
		}
	}
}
```

- [ ] **Step 2: Write the failing lock-pipeline test**

Append to `internal/game/game_test.go`:

```go
// stackTo fills rows from y down to the floor, leaving the given holes in each.
func stackTo(g *Game, fromY int, holes ...int) {
	for y := fromY; y < BoardHeight; y++ {
		fill(&g.Board, y, holes...)
	}
}

func TestLockCommitsPieceAndSpawnsNext(t *testing.T) {
	g := New(11)
	upcoming := g.Next[0]
	g.Active = Piece{Kind: KindO, X: 4, Y: BoardHeight - 2}
	events := g.lockPiece()

	if !hasEvent(events, EventPieceLocked) {
		t.Fatalf("lockPiece returned %v, want a PieceLocked event", kindsOf(events))
	}
	if n := filledCount(&g.Board); n != 4 {
		t.Errorf("%d cells locked, want 4", n)
	}
	if g.Active.Kind != upcoming {
		t.Errorf("Active kind = %v, want the queue front %v", g.Active.Kind, upcoming)
	}
	if g.Active.X != SpawnX || g.Active.Y != SpawnY || g.Active.Rotation != 0 {
		t.Errorf("new piece at %+v, want spawn position", g.Active)
	}
}

// §9: hold becomes available again once the piece locks.
func TestLockRestoresHoldAvailability(t *testing.T) {
	g := New(11)
	g.CanHold = false
	g.Active = Piece{Kind: KindO, X: 4, Y: BoardHeight - 2}
	g.lockPiece()
	if !g.CanHold {
		t.Error("CanHold must be restored after a lock")
	}
}

func TestSingleLineClearScoresAndCounts(t *testing.T) {
	g := New(11)
	// Leave a two-wide notch at the bottom that an O piece completes.
	fill(&g.Board, BoardHeight-1, 4, 5)
	g.Active = Piece{Kind: KindO, X: 3, Y: BoardHeight - 2}
	events := g.lockPiece()

	cleared, ok := findEvent(events, EventLinesCleared)
	if !ok {
		t.Fatalf("lockPiece returned %v, want a LinesCleared event", kindsOf(events))
	}
	if cleared.Value != 1 {
		t.Errorf("LinesCleared Value = %d, want 1", cleared.Value)
	}
	if len(cleared.Rows) != 1 || cleared.Rows[0] != BoardHeight-1 {
		t.Errorf("LinesCleared Rows = %v, want [%d]", cleared.Rows, BoardHeight-1)
	}
	if cleared.Points != 100 {
		t.Errorf("LinesCleared Points = %d, want 100", cleared.Points)
	}
	if g.Score != 100 {
		t.Errorf("Score = %d, want 100", g.Score)
	}
	if g.Lines != 1 {
		t.Errorf("Lines = %d, want 1", g.Lines)
	}
	if g.Combo != 1 {
		t.Errorf("Combo = %d, want 1 after the first clearing placement", g.Combo)
	}
	// Two cells of the O survive above the cleared row.
	if n := filledCount(&g.Board); n != 2 {
		t.Errorf("%d cells remain, want 2", n)
	}
}

func TestFourLineClearScoresEightHundred(t *testing.T) {
	g := New(11)
	for y := BoardHeight - 4; y < BoardHeight; y++ {
		fill(&g.Board, y, 0)
	}
	// Vertical I in column 0 fills all four rows at once.
	g.Active = Piece{Kind: KindI, Rotation: 1, X: -2, Y: BoardHeight - 4}
	if g.Board.Collides(g.Active) {
		t.Fatal("test setup: the I piece does not fit the well")
	}
	events := g.lockPiece()

	cleared, ok := findEvent(events, EventLinesCleared)
	if !ok {
		t.Fatalf("lockPiece returned %v, want a LinesCleared event", kindsOf(events))
	}
	if cleared.Value != 4 || len(cleared.Rows) != 4 {
		t.Errorf("cleared %d rows (%v), want 4", cleared.Value, cleared.Rows)
	}
	if g.Score != 800 {
		t.Errorf("Score = %d, want 800", g.Score)
	}
	if n := filledCount(&g.Board); n != 0 {
		t.Errorf("%d cells remain after a four-line clear, want 0", n)
	}
}

// §49.1: the bonus arrives at combo 2, which is where §21's effects escalate.
func TestComboAccumulatesAcrossConsecutiveClears(t *testing.T) {
	g := New(11)
	g.Combo = 1 // one clearing placement already happened
	fill(&g.Board, BoardHeight-1, 4, 5)
	g.Active = Piece{Kind: KindO, X: 3, Y: BoardHeight - 2}
	events := g.lockPiece()

	if g.Combo != 2 {
		t.Fatalf("Combo = %d, want 2", g.Combo)
	}
	cleared, _ := findEvent(events, EventLinesCleared)
	if cleared.Points != 100+50 {
		t.Errorf("Points = %d, want 150 (100 base + 50 combo bonus)", cleared.Points)
	}
	combo, ok := findEvent(events, EventComboChanged)
	if !ok || combo.Value != 2 {
		t.Errorf("ComboChanged = %+v, want Value 2", combo)
	}
}

func TestNonClearingPlacementBreaksCombo(t *testing.T) {
	g := New(11)
	g.Combo = 4
	g.Active = Piece{Kind: KindO, X: 4, Y: BoardHeight - 2}
	events := g.lockPiece()

	if g.Combo != 0 {
		t.Errorf("Combo = %d, want 0", g.Combo)
	}
	combo, ok := findEvent(events, EventComboChanged)
	if !ok || combo.Value != 0 {
		t.Errorf("ComboChanged = %+v (events %v), want Value 0", combo, kindsOf(events))
	}
}

// A non-clearing placement with no combo running is quiet: nothing changed, so
// the FX layer gets no ComboChanged to react to.
func TestNonClearingPlacementWithNoComboIsQuiet(t *testing.T) {
	g := New(11)
	g.Active = Piece{Kind: KindO, X: 4, Y: BoardHeight - 2}
	events := g.lockPiece()
	if hasEvent(events, EventComboChanged) {
		t.Errorf("events = %v, want no ComboChanged", kindsOf(events))
	}
}

// §11: the level advances every ten lines, and the clear that triggers the
// level-up is still scored at the old level.
func TestLevelUpAtTenLines(t *testing.T) {
	g := New(11)
	g.Lines = 9
	fill(&g.Board, BoardHeight-1, 4, 5)
	g.Active = Piece{Kind: KindO, X: 3, Y: BoardHeight - 2}
	events := g.lockPiece()

	if g.Lines != 10 {
		t.Fatalf("Lines = %d, want 10", g.Lines)
	}
	if g.Level != 2 {
		t.Errorf("Level = %d, want 2", g.Level)
	}
	lvl, ok := findEvent(events, EventLevelChanged)
	if !ok || lvl.Value != 2 {
		t.Errorf("LevelChanged = %+v (events %v), want Value 2", lvl, kindsOf(events))
	}
	if g.Score != 100 {
		t.Errorf("Score = %d, want 100 (scored at level 1, the level before the clear)", g.Score)
	}
}

func TestNoLevelEventWithoutLevelChange(t *testing.T) {
	g := New(11)
	fill(&g.Board, BoardHeight-1, 4, 5)
	g.Active = Piece{Kind: KindO, X: 3, Y: BoardHeight - 2}
	events := g.lockPiece()
	if hasEvent(events, EventLevelChanged) {
		t.Errorf("events = %v, want no LevelChanged", kindsOf(events))
	}
}

// A row completed inside the hidden spawn rows clears like any other.
func TestClearInsideHiddenRows(t *testing.T) {
	g := New(11)
	fill(&g.Board, 1, 4, 5)
	stackTo(g, 2)
	g.Active = Piece{Kind: KindO, X: 3, Y: 0}
	if g.Board.Collides(g.Active) {
		t.Fatal("test setup: the O piece does not fit the hidden-row notch")
	}
	events := g.lockPiece()
	cleared, ok := findEvent(events, EventLinesCleared)
	if !ok {
		t.Fatalf("events = %v, want a LinesCleared event", kindsOf(events))
	}
	// Row 1 and every row from 2 down were full, so all 21 clear.
	if cleared.Value != BoardHeight-1 {
		t.Errorf("cleared %d rows, want %d", cleared.Value, BoardHeight-1)
	}
}

// The event order is the §12 pipeline order, because the FX layer keys its
// sequencing off it.
func TestLockEventOrder(t *testing.T) {
	g := New(11)
	g.Lines = 9
	fill(&g.Board, BoardHeight-1, 4, 5)
	g.Active = Piece{Kind: KindO, X: 3, Y: BoardHeight - 2}
	got := kindsOf(g.lockPiece())
	want := []EventKind{EventPieceLocked, EventLinesCleared, EventComboChanged, EventLevelChanged}
	if len(got) != len(want) {
		t.Fatalf("events = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("events = %v, want %v", got, want)
		}
	}
}
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'Score|Combo|Level|Lock|Clear'`
Expected: FAIL — `undefined: LineScore`, `undefined: lockPiece`.

- [ ] **Step 4: Write the scoring functions**

Create `internal/game/scoring.go`:

```go
package game

import (
	"math"
	"time"
)

// LinesPerLevel is how many cleared lines advance the level (§11).
const LinesPerLevel = 10

// Gravity curve (§11).
const (
	// BaseDropInterval is the level 1 drop period.
	BaseDropInterval = 800 * time.Millisecond
	// MinDropInterval is the floor: gravity never gets faster than this.
	MinDropInterval = 60 * time.Millisecond
	// DropFalloff is the per-level multiplier.
	DropFalloff = 0.86
)

// LineScore is the base value for clearing n rows at the given level (§13).
// Values outside 1-4 score nothing.
func LineScore(n, level int) int {
	switch n {
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

// ComboBonus is the consecutive-clear bonus (§49.1): 50 x (combo-1) x level,
// so a lone clear earns nothing and the bonus starts at combo 2.
func ComboBonus(combo, level int) int {
	if combo < 2 {
		return 0
	}
	return 50 * (combo - 1) * level
}

// LevelFor is the level reached after clearing the given number of lines.
func LevelFor(lines int) int {
	return lines/LinesPerLevel + 1
}

// DropInterval is the gravity period at the given level (§11). The clamp is
// load-bearing: Advance loops while the accumulator exceeds this interval, so a
// zero would never terminate.
func DropInterval(level int) time.Duration {
	if level < 1 {
		level = 1
	}
	d := float64(BaseDropInterval) * math.Pow(DropFalloff, float64(level-1))
	if d < float64(MinDropInterval) {
		return MinDropInterval
	}
	return time.Duration(d)
}
```

- [ ] **Step 5: Append the lock pipeline to `internal/game/game.go`**

```go
// lockPiece runs the §12 pipeline: commit the piece, detect and clear complete
// rows, update the score, emit events, and spawn the next piece. Rendering may
// animate the clear afterwards; the logical result is already final here, which
// is what keeps animation off the gameplay path (§19).
func (g *Game) lockPiece() []Event {
	locked := g.Active
	g.Board.Lock(locked)
	events := []Event{{Kind: EventPieceLocked, Piece: locked}}

	if rows := g.Board.CompleteRows(); len(rows) > 0 {
		g.Board.ClearRows(rows)
		g.Lines += len(rows)
		g.Combo++
		points := LineScore(len(rows), g.Level) + ComboBonus(g.Combo, g.Level)
		g.Score += points
		events = append(events, Event{
			Kind:   EventLinesCleared,
			Rows:   rows,
			Value:  len(rows),
			Points: points,
		})
		events = append(events, Event{Kind: EventComboChanged, Value: g.Combo})
		if level := LevelFor(g.Lines); level != g.Level {
			g.Level = level
			events = append(events, Event{Kind: EventLevelChanged, Value: g.Level})
		}
	} else if g.Combo != 0 {
		g.Combo = 0
		events = append(events, Event{Kind: EventComboChanged, Value: 0})
	}

	g.CanHold = true
	return append(events, g.spawn(g.takeNext())...)
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `go test ./internal/game/ -run 'Score|Combo|Level|Lock|Clear' -v`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
gofmt -l . && go vet ./... && go test ./...
git add internal/game/scoring.go internal/game/scoring_test.go internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): lock pipeline with line clears, scoring and combos"
```

---

### Task 7: Gravity, lock delay, and the drops

**Files:**
- Modify: `internal/game/game.go` (append `Advance`, `SoftDrop`, `HardDrop`)
- Test: `internal/game/game_test.go` (append)
- Test: `internal/game/clock_test.go`

**Interfaces:**
- Consumes: `lockPiece`, `DropInterval`, `LockDelay`, `MaxLockResets`, `grounded`, `tryMove`, `GhostY` (Tasks 4–6).
- Produces: `const MaxAdvance = 250 * time.Millisecond`; `func (g *Game) Advance(dt time.Duration) []Event`; `func (g *Game) SoftDrop() []Event`; `func (g *Game) HardDrop() []Event`.

- [ ] **Step 1: Write the failing gravity and drop tests**

First widen the import block at the top of `internal/game/game_test.go` — these tests need durations:

```go
import (
	"testing"
	"time"
)
```

Then append to `internal/game/game_test.go`:

```go
func TestDropIntervalFollowsTheCurve(t *testing.T) {
	if got := DropInterval(1); got != BaseDropInterval {
		t.Errorf("DropInterval(1) = %v, want %v", got, BaseDropInterval)
	}
	// Level 2 is 800ms x 0.86 = 688ms.
	if got := DropInterval(2); got < 680*time.Millisecond || got > 692*time.Millisecond {
		t.Errorf("DropInterval(2) = %v, want about 688ms", got)
	}
	for level := 1; level < 60; level++ {
		if DropInterval(level+1) > DropInterval(level) {
			t.Fatalf("DropInterval is not monotone: level %d %v, level %d %v",
				level, DropInterval(level), level+1, DropInterval(level+1))
		}
	}
	if got := DropInterval(40); got != MinDropInterval {
		t.Errorf("DropInterval(40) = %v, want the %v clamp", got, MinDropInterval)
	}
}

// Review Focus 3: the interval can never reach zero, which would hang the
// gravity loop in Advance.
func TestDropIntervalNeverReachesZero(t *testing.T) {
	for _, level := range []int{-5, 0, 1, 50, 500, 100000} {
		if got := DropInterval(level); got < MinDropInterval {
			t.Errorf("DropInterval(%d) = %v, want at least %v", level, got, MinDropInterval)
		}
	}
}

func TestAdvanceBelowIntervalDoesNotMove(t *testing.T) {
	g := New(21)
	g.Active = Piece{Kind: KindO, X: 4, Y: 5}
	events := g.Advance(100 * time.Millisecond)
	if len(events) != 0 {
		t.Errorf("events = %v, want none", kindsOf(events))
	}
	if g.Active.Y != 5 {
		t.Errorf("Y = %d, want 5", g.Active.Y)
	}
	if g.GravityAccumulator != 100*time.Millisecond {
		t.Errorf("GravityAccumulator = %v, want 100ms", g.GravityAccumulator)
	}
}

func TestAdvanceDropsOneRowPerInterval(t *testing.T) {
	g := New(21)
	g.Active = Piece{Kind: KindO, X: 4, Y: 5}
	events := g.Advance(BaseDropInterval)
	if !hasEvent(events, EventPieceMoved) {
		t.Fatalf("events = %v, want a PieceMoved event", kindsOf(events))
	}
	if g.Active.Y != 6 {
		t.Errorf("Y = %d, want 6", g.Active.Y)
	}
}

func TestAdvanceIsFasterAtHigherLevels(t *testing.T) {
	g := New(21)
	g.Level = 10
	g.Active = Piece{Kind: KindO, X: 4, Y: 5}
	g.Advance(DropInterval(10))
	if g.Active.Y != 6 {
		t.Errorf("Y = %d after one level-10 interval, want 6", g.Active.Y)
	}
}

// Review Focus 1: a suspended terminal hands over an enormous dt. The engine
// clamps it instead of teleporting the piece or looping thousands of times.
func TestAdvanceClampsHugeDt(t *testing.T) {
	g := New(21)
	g.Active = Piece{Kind: KindO, X: 4, Y: 5}
	events := g.Advance(30 * time.Second)
	if g.Active.Y != 5 {
		t.Errorf("Y = %d after a clamped 30s step, want 5 (clamp is under one interval)",
			g.Active.Y)
	}
	if g.GravityAccumulator != MaxAdvance {
		t.Errorf("GravityAccumulator = %v, want the %v clamp", g.GravityAccumulator, MaxAdvance)
	}
	if len(events) != 0 {
		t.Errorf("events = %v, want none", kindsOf(events))
	}

	// Even at maximum gravity the clamp allows only a handful of rows per call.
	fast := New(21)
	fast.Level = 40
	fast.Active = Piece{Kind: KindO, X: 4, Y: 0}
	moves := 0
	for _, e := range fast.Advance(time.Hour) {
		if e.Kind == EventPieceMoved {
			moves++
		}
	}
	if want := int(MaxAdvance / MinDropInterval); moves > want {
		t.Errorf("%d rows fell in one clamped call, want at most %d", moves, want)
	}
}

// A non-monotonic clock can hand back a zero or negative delta.
func TestAdvanceIgnoresNonPositiveDt(t *testing.T) {
	g := New(21)
	g.Active = Piece{Kind: KindO, X: 4, Y: 5}
	for _, dt := range []time.Duration{0, -1, -5 * time.Second} {
		if events := g.Advance(dt); len(events) != 0 {
			t.Errorf("Advance(%v) returned %v, want nothing", dt, kindsOf(events))
		}
	}
	if g.Active.Y != 5 || g.GravityAccumulator != 0 {
		t.Errorf("state moved on a non-positive dt: Y %d, accumulator %v",
			g.Active.Y, g.GravityAccumulator)
	}
}

// §12: a grounded piece commits after the lock delay, not before.
func TestGroundedPieceLocksAfterLockDelay(t *testing.T) {
	g := New(21)
	g.Active = Piece{Kind: KindO, X: 4, Y: BoardHeight - 2}
	elapsed := time.Duration(0)
	for elapsed < LockDelay-MaxAdvance {
		if events := g.Advance(MaxAdvance); hasEvent(events, EventPieceLocked) {
			t.Fatalf("locked early, after %v", elapsed)
		}
		elapsed += MaxAdvance
	}
	events := g.Advance(MaxAdvance)
	if !hasEvent(events, EventPieceLocked) {
		t.Fatalf("events = %v after %v grounded, want a PieceLocked event",
			kindsOf(events), elapsed+MaxAdvance)
	}
}

// Leaving the ground abandons the lock timer.
func TestLeavingTheGroundClearsTheLockTimer(t *testing.T) {
	g := New(21)
	fill(&g.Board, 15)
	g.Active = Piece{Kind: KindO, X: 4, Y: 13}
	g.Advance(200 * time.Millisecond)
	if g.LockAccumulator == 0 {
		t.Fatal("test setup: expected the piece to be grounded and accumulating")
	}
	// Slide into the empty column beyond the stack.
	g.Board = Board{}
	g.Advance(1)
	if g.LockAccumulator != 0 {
		t.Errorf("LockAccumulator = %v after the piece became airborne, want 0",
			g.LockAccumulator)
	}
}

// §12: move-resetting cannot stall forever — after MaxLockResets the piece
// commits regardless.
func TestStallingIsCappedAndThePieceLocks(t *testing.T) {
	g := New(21)
	g.Active = Piece{Kind: KindO, X: 4, Y: BoardHeight - 2}
	locked := false
	for i := 0; i < MaxLockResets+40 && !locked; i++ {
		if i%2 == 0 {
			g.MoveLeft()
		} else {
			g.MoveRight()
		}
		for step := 0; step < 2; step++ {
			if hasEvent(g.Advance(MaxAdvance), EventPieceLocked) {
				locked = true
				break
			}
		}
	}
	if !locked {
		t.Error("a piece move-reset forever never locked")
	}
}

// §11: soft drop is +1 point per cell.
func TestSoftDrop(t *testing.T) {
	g := New(21)
	g.Active = Piece{Kind: KindO, X: 4, Y: 5}
	events := g.SoftDrop()
	if !hasEvent(events, EventPieceMoved) {
		t.Fatalf("events = %v, want a PieceMoved event", kindsOf(events))
	}
	if g.Active.Y != 6 {
		t.Errorf("Y = %d, want 6", g.Active.Y)
	}
	if g.Score != 1 {
		t.Errorf("Score = %d, want 1", g.Score)
	}
}

func TestSoftDropAtTheFloorIsSilent(t *testing.T) {
	g := New(21)
	g.Active = Piece{Kind: KindO, X: 4, Y: BoardHeight - 2}
	if events := g.SoftDrop(); len(events) != 0 {
		t.Errorf("events = %v, want nothing", kindsOf(events))
	}
	if g.Score != 0 {
		t.Errorf("Score = %d, want 0 — no points for a drop that did not happen", g.Score)
	}
}

// §11/§12: hard drop is +2 per cell and locks immediately.
func TestHardDropScoresDistanceAndLocks(t *testing.T) {
	g := New(21)
	g.Active = Piece{Kind: KindO, X: 4, Y: 0}
	start := g.Active.Y
	events := g.HardDrop()

	drop, ok := findEvent(events, EventPieceHardDropped)
	if !ok {
		t.Fatalf("events = %v, want a PieceHardDropped event", kindsOf(events))
	}
	wantDistance := BoardHeight - 2 - start
	if drop.Value != wantDistance {
		t.Errorf("hard drop distance = %d, want %d", drop.Value, wantDistance)
	}
	if drop.Points != 2*wantDistance {
		t.Errorf("hard drop points = %d, want %d", drop.Points, 2*wantDistance)
	}
	if g.Score != 2*wantDistance {
		t.Errorf("Score = %d, want %d", g.Score, 2*wantDistance)
	}
	if !hasEvent(events, EventPieceLocked) {
		t.Errorf("events = %v, want the piece to lock immediately", kindsOf(events))
	}
	if kindsOf(events)[0] != EventPieceHardDropped {
		t.Errorf("events = %v, want PieceHardDropped first", kindsOf(events))
	}
}

func TestHardDropWithNowhereToFallStillLocks(t *testing.T) {
	g := New(21)
	g.Active = Piece{Kind: KindO, X: 4, Y: BoardHeight - 2}
	events := g.HardDrop()
	drop, _ := findEvent(events, EventPieceHardDropped)
	if drop.Value != 0 || drop.Points != 0 {
		t.Errorf("zero-distance hard drop = %+v, want Value and Points 0", drop)
	}
	if !hasEvent(events, EventPieceLocked) {
		t.Errorf("events = %v, want a PieceLocked event", kindsOf(events))
	}
}
```

- [ ] **Step 2: Write the failing architectural test**

Create `internal/game/clock_test.go`:

```go
package game

import (
	"go/ast"
	"go/parser"
	"go/token"
	"strings"
	"testing"
)

// §49.2: the engine never reads a clock. Bubble Tea owns time and passes dt
// inward. This is the guardrail behind the determinism promise in §35 — a
// single time.Now() anywhere in this package would make replay untestable, and
// it is the kind of line that gets added innocently later.
func TestEngineNeverReadsTheClock(t *testing.T) {
	fset := token.NewFileSet()
	pkgs, err := parser.ParseDir(fset, ".", nil, 0)
	if err != nil {
		t.Fatalf("parse package: %v", err)
	}
	banned := map[string]bool{"Now": true, "Since": true, "Tick": true, "After": true}
	for _, pkg := range pkgs {
		for name, file := range pkg.Files {
			if strings.HasSuffix(name, "_test.go") {
				continue
			}
			ast.Inspect(file, func(n ast.Node) bool {
				sel, ok := n.(*ast.SelectorExpr)
				if !ok {
					return true
				}
				pkgIdent, ok := sel.X.(*ast.Ident)
				if !ok || pkgIdent.Name != "time" {
					return true
				}
				if banned[sel.Sel.Name] {
					t.Errorf("%s: engine must not read the clock (§49.2): time.%s",
						fset.Position(sel.Pos()), sel.Sel.Name)
				}
				return true
			})
		}
	}
}
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run 'Advance|Drop|Ground|Stall|Clock'`
Expected: FAIL — `undefined: MaxAdvance`, `undefined: Advance`, `undefined: SoftDrop`. `TestEngineNeverReadsTheClock` will pass already; that is fine, it is a guardrail rather than a driver.

- [ ] **Step 4: Append the implementation to `internal/game/game.go`**

```go
// MaxAdvance clamps a single Advance step. A terminal that was suspended, or a
// render loop that stalled, hands over an arbitrarily large dt; without this
// the piece would teleport and the gravity loop would run thousands of
// iterations. Clamping keeps Advance a pure function of its inputs, so replay
// still reproduces exactly (§49.2).
const MaxAdvance = 250 * time.Millisecond

// Advance steps the simulation by dt and returns what happened. This is the
// engine's only notion of time: nothing here reads a clock, so the caller owns
// the clock and a canned (input, dt) stream replays a game exactly (§49.2).
func (g *Game) Advance(dt time.Duration) []Event {
	if g.Over || dt <= 0 {
		return nil
	}
	if dt > MaxAdvance {
		dt = MaxAdvance
	}

	var events []Event

	interval := DropInterval(g.Level)
	g.GravityAccumulator += dt
	for g.GravityAccumulator >= interval {
		g.GravityAccumulator -= interval
		if !g.tryMove(0, 1) {
			// Resting on something: hold the accumulator at zero so the lock
			// timer, not gravity, decides what happens next.
			g.GravityAccumulator = 0
			break
		}
		events = append(events, Event{Kind: EventPieceMoved, Piece: g.Active})
	}

	if g.grounded() {
		g.LockAccumulator += dt
		if g.LockAccumulator >= LockDelay {
			events = append(events, g.lockPiece()...)
		}
	} else {
		g.LockAccumulator = 0
	}

	return events
}

// SoftDrop nudges the piece down one row for one point (§11).
func (g *Game) SoftDrop() []Event {
	if g.Over {
		return nil
	}
	if !g.tryMove(0, 1) {
		return nil
	}
	g.Score++
	g.GravityAccumulator = 0
	return []Event{{Kind: EventPieceMoved, Piece: g.Active, Points: 1}}
}

// HardDrop slams the piece to its landing position for two points per cell and
// locks it on the spot (§11, §18). The dramatic part is the FX layer's job; the
// engine just resolves it instantly.
func (g *Game) HardDrop() []Event {
	if g.Over {
		return nil
	}
	distance := g.GhostY() - g.Active.Y
	g.Active.Y += distance
	points := 2 * distance
	g.Score += points
	events := []Event{{
		Kind:   EventPieceHardDropped,
		Piece:  g.Active,
		Value:  distance,
		Points: points,
	}}
	return append(events, g.lockPiece()...)
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./internal/game/ -run 'Advance|Drop|Ground|Stall|Clock' -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
gofmt -l . && go vet ./... && go test ./...
git add internal/game/game.go internal/game/game_test.go internal/game/clock_test.go
git commit -m "feat(game): elapsed-time gravity, lock delay, soft and hard drop"
```

---

### Task 8: Hold

**Files:**
- Modify: `internal/game/game.go` (append `UseHold`)
- Test: `internal/game/hold_test.go`

**Interfaces:**
- Consumes: `Game`, `spawn`, `takeNext`, `Event`, `lockPiece` (Tasks 4, 6).
- Produces: `func (g *Game) UseHold() []Event`.

- [ ] **Step 1: Write the failing test**

Create `internal/game/hold_test.go`:

```go
package game

import "testing"

// §9: with an empty hold slot, the active piece is stored and the next piece
// comes into play.
func TestFirstHoldStoresActiveAndSpawnsNext(t *testing.T) {
	g := New(31)
	held := g.Active.Kind
	upcoming := g.Next[0]

	events := g.UseHold()

	if !hasEvent(events, EventHoldUsed) {
		t.Fatalf("events = %v, want a HoldUsed event", kindsOf(events))
	}
	if g.Hold == nil || *g.Hold != held {
		t.Errorf("Hold = %v, want %v", g.Hold, held)
	}
	if g.Active.Kind != upcoming {
		t.Errorf("Active kind = %v, want the queue front %v", g.Active.Kind, upcoming)
	}
	if len(g.Next) != NextQueueLen {
		t.Errorf("len(Next) = %d, want %d", len(g.Next), NextQueueLen)
	}
	if g.CanHold {
		t.Error("CanHold must be false after a hold")
	}
	used, _ := findEvent(events, EventHoldUsed)
	if used.Piece.Kind != upcoming {
		t.Errorf("HoldUsed Piece = %v, want the incoming piece %v", used.Piece.Kind, upcoming)
	}
}

// §9: a second hold swaps, and does not consume the queue.
func TestSecondHoldSwapsWithoutTouchingTheQueue(t *testing.T) {
	g := New(31)
	first := g.Active.Kind
	g.UseHold()
	second := g.Active.Kind
	queueBefore := append([]PieceKind(nil), g.Next...)

	g.CanHold = true // as a lock would have done
	g.UseHold()

	if g.Active.Kind != first {
		t.Errorf("Active kind = %v, want the previously held %v", g.Active.Kind, first)
	}
	if g.Hold == nil || *g.Hold != second {
		t.Errorf("Hold = %v, want %v", g.Hold, second)
	}
	for i := range queueBefore {
		if g.Next[i] != queueBefore[i] {
			t.Fatalf("a swap consumed the queue: %v, want %v", g.Next, queueBefore)
		}
	}
}

// §9: only one hold per piece.
func TestSecondHoldBeforeLockIsBlocked(t *testing.T) {
	g := New(31)
	g.UseHold()
	stateBefore := g.Active
	holdBefore := *g.Hold

	if events := g.UseHold(); len(events) != 0 {
		t.Errorf("second hold returned %v, want nothing", kindsOf(events))
	}
	if g.Active != stateBefore {
		t.Errorf("Active = %+v, want unchanged %+v", g.Active, stateBefore)
	}
	if *g.Hold != holdBefore {
		t.Errorf("Hold = %v, want unchanged %v", *g.Hold, holdBefore)
	}
}

// §9: hold becomes available again after the active piece locks.
func TestHoldAvailableAgainAfterLock(t *testing.T) {
	g := New(31)
	g.UseHold()
	g.Active = Piece{Kind: g.Active.Kind, X: 4, Y: BoardHeight - 2}
	g.lockPiece()
	if !g.CanHold {
		t.Fatal("CanHold must be restored after the piece locks")
	}
	if events := g.UseHold(); !hasEvent(events, EventHoldUsed) {
		t.Errorf("hold after a lock returned %v, want a HoldUsed event", kindsOf(events))
	}
}

// §9: a held piece returns to spawn rotation and spawn position.
func TestHeldPieceReturnsAtSpawnRotation(t *testing.T) {
	g := New(31)
	g.Active.Rotation = 2
	g.Active.X = 7
	g.Active.Y = 9
	rotated := g.Active.Kind

	g.UseHold()
	g.CanHold = true
	g.UseHold()

	if g.Active.Kind != rotated {
		t.Fatalf("Active kind = %v, want %v", g.Active.Kind, rotated)
	}
	if g.Active.Rotation != 0 || g.Active.X != SpawnX || g.Active.Y != SpawnY {
		t.Errorf("restored piece = %+v, want spawn rotation and position", g.Active)
	}
}

// Holding into a full board ends the game, and says so.
func TestHoldIntoABlockedSpawnEndsTheGame(t *testing.T) {
	g := New(31)
	stackTo(g, 0)
	g.Active = Piece{Kind: KindO, X: 4, Y: 0}

	events := g.UseHold()

	if !hasEvent(events, EventHoldUsed) {
		t.Errorf("events = %v, want a HoldUsed event", kindsOf(events))
	}
	if !hasEvent(events, EventGameOver) {
		t.Errorf("events = %v, want a GameOver event", kindsOf(events))
	}
	if !g.Over {
		t.Error("Over must be true")
	}
	if got := kindsOf(events); got[0] != EventHoldUsed {
		t.Errorf("events = %v, want HoldUsed first", got)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run Hold`
Expected: FAIL — `undefined: UseHold` (`g.UseHold`).

- [ ] **Step 3: Append the implementation to `internal/game/game.go`**

```go
// UseHold swaps the active piece into the hold slot (§9). With the slot empty,
// the next queued piece comes into play instead. One hold per piece; the slot
// unlocks when the piece locks. Gameplay does not wait for the FX layer's
// quantum-storage animation.
func (g *Game) UseHold() []Event {
	if g.Over || !g.CanHold {
		return nil
	}
	outgoing := g.Active.Kind

	var incoming PieceKind
	if g.Hold == nil {
		incoming = g.takeNext()
	} else {
		incoming = *g.Hold
	}

	g.Hold = &outgoing
	g.CanHold = false

	// spawn sets Active, so build the event afterwards to report the piece
	// that actually entered play.
	spawnEvents := g.spawn(incoming)
	events := []Event{{Kind: EventHoldUsed, Piece: g.Active}}
	return append(events, spawnEvents...)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/game/ -run Hold -v`
Expected: PASS — six tests.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && go vet ./... && go test ./...
git add internal/game/game.go internal/game/hold_test.go
git commit -m "feat(game): hold slot with one swap per piece"
```

---

### Task 9: Game over, input guards, and the determinism replay

**Files:**
- Test: `internal/game/gameover_test.go`
- Test: `internal/game/replay_test.go`
- Modify: `internal/game/game.go` only if a guard turns out to be missing

**Interfaces:**
- Consumes: everything from Tasks 1–8. No new production API — this task proves the guards already written (`if g.Over { return nil }` in `shift`, `rotate`, `SoftDrop`, `HardDrop`, `UseHold`, `Advance`) actually hold, and pins determinism.
- Produces: no new exported identifiers.

- [ ] **Step 1: Write the failing game-over test**

Create `internal/game/gameover_test.go`:

```go
package game

import (
	"testing"
	"time"
)

// §40: a blocked spawn is game over, and the event names the piece that could
// not fit so the FX layer can collapse it into a black hole (§28).
func TestBlockedSpawnEndsTheGame(t *testing.T) {
	g := New(51)
	// Column 9 stays empty in every row, so nothing completes and the lock
	// cannot rescue the player by clearing the stack away.
	stackTo(g, 0, 9)
	// Carve out room for the active piece only.
	for _, c := range (Piece{Kind: KindO, X: 4, Y: 0}).Cells() {
		g.Board.Cells[c.Y][c.X] = Cell{}
	}
	g.Active = Piece{Kind: KindO, X: 4, Y: 0}

	events := g.lockPiece()

	if hasEvent(events, EventLinesCleared) {
		t.Fatalf("test setup cleared lines: %v", kindsOf(events))
	}

	over, ok := findEvent(events, EventGameOver)
	if !ok {
		t.Fatalf("events = %v, want a GameOver event", kindsOf(events))
	}
	if over.Piece.Kind != g.Active.Kind {
		t.Errorf("GameOver Piece = %v, want the piece that could not spawn %v",
			over.Piece.Kind, g.Active.Kind)
	}
	if !g.Over {
		t.Error("Over must be true")
	}
}

// Review Focus 2: §28's collapse runs for over a second and §20 forbids
// blocking input, so a player will hammer keys while dead. Every input must be
// inert — no score, no movement, no events.
func TestInputsAfterGameOverAreNoOps(t *testing.T) {
	g := New(51)
	stackTo(g, 0)
	g.Over = true
	before := *g
	beforeBoard := g.Board

	inputs := map[string]func() []Event{
		"MoveLeft":  g.MoveLeft,
		"MoveRight": g.MoveRight,
		"RotateCW":  g.RotateCW,
		"RotateCCW": g.RotateCCW,
		"SoftDrop":  g.SoftDrop,
		"HardDrop":  g.HardDrop,
		"UseHold":   g.UseHold,
		"Advance":   func() []Event { return g.Advance(BaseDropInterval * 10) },
	}
	for name, input := range inputs {
		if events := input(); len(events) != 0 {
			t.Errorf("%s after game over returned %v, want nothing", name, kindsOf(events))
		}
	}

	if g.Active != before.Active {
		t.Errorf("Active = %+v, want unchanged %+v", g.Active, before.Active)
	}
	if g.Score != before.Score || g.Lines != before.Lines || g.Level != before.Level ||
		g.Combo != before.Combo {
		t.Errorf("stats changed after game over: %d/%d/%d/%d, want %d/%d/%d/%d",
			g.Score, g.Lines, g.Level, g.Combo,
			before.Score, before.Lines, before.Level, before.Combo)
	}
	if g.Board != beforeBoard {
		t.Error("the board changed after game over")
	}
	if g.CanHold != before.CanHold {
		t.Error("CanHold changed after game over")
	}
	if g.GravityAccumulator != before.GravityAccumulator ||
		g.LockAccumulator != before.LockAccumulator {
		t.Error("timers advanced after game over")
	}
}

// Restart is the way back: §47 requires it to work from the game-over screen.
func TestRestartAfterGameOverIsPlayable(t *testing.T) {
	g := New(51)
	stackTo(g, 0)
	g.Over = true

	g.Restart()

	if g.Over {
		t.Fatal("Over must be false after Restart")
	}
	if events := g.Advance(BaseDropInterval); !hasEvent(events, EventPieceMoved) {
		t.Errorf("events = %v after restart, want the piece to fall", kindsOf(events))
	}
}

// Playing until the stack reaches orbit must actually terminate, not wedge.
func TestPlayingWithoutMovingReachesGameOver(t *testing.T) {
	g := New(51)
	for step := 0; step < 20000; step++ {
		for _, e := range g.Advance(MaxAdvance) {
			if e.Kind == EventGameOver {
				if !g.Over {
					t.Fatal("GameOver event without Over set")
				}
				return
			}
		}
	}
	t.Fatalf("no game over after 20000 steps (%v of play); score %d lines %d",
		time.Duration(20000)*MaxAdvance, g.Score, g.Lines)
}
```

- [ ] **Step 2: Write the failing determinism test**

Create `internal/game/replay_test.go`:

```go
package game

import (
	"testing"
	"time"
)

// input is one step of a canned replay: a key, then a slice of elapsed time.
type input struct {
	key string
	dt  time.Duration
}

// apply runs one replay step against a game.
func apply(g *Game, in input) []Event {
	var events []Event
	switch in.key {
	case "":
	case "left":
		events = append(events, g.MoveLeft()...)
	case "right":
		events = append(events, g.MoveRight()...)
	case "cw":
		events = append(events, g.RotateCW()...)
	case "ccw":
		events = append(events, g.RotateCCW()...)
	case "soft":
		events = append(events, g.SoftDrop()...)
	case "hard":
		events = append(events, g.HardDrop()...)
	case "hold":
		events = append(events, g.UseHold()...)
	default:
		panic("unknown replay key: " + in.key)
	}
	return append(events, g.Advance(in.dt)...)
}

// script is a fixed, reasonably varied stream of play.
func script() []input {
	keys := []string{"", "left", "right", "cw", "ccw", "soft", "hard", "hold", "", "left", "cw", "hard"}
	dts := []time.Duration{16 * time.Millisecond, 33 * time.Millisecond, 250 * time.Millisecond, 7 * time.Millisecond}
	out := make([]input, 0, 900)
	for i := 0; i < 900; i++ {
		out = append(out, input{key: keys[i%len(keys)], dt: dts[i%len(dts)]})
	}
	return out
}

// play runs the script and returns the finished game.
func play(seed int64) *Game {
	g := New(seed)
	for _, in := range script() {
		apply(g, in)
	}
	return g
}

// §35/§49.2: same seed, same input sequence, same timing inputs, same state.
// This is the whole point of dt being an argument rather than a clock read.
func TestReplayIsDeterministic(t *testing.T) {
	a := play(8675309)
	b := play(8675309)

	if a.Score != b.Score || a.Lines != b.Lines || a.Level != b.Level ||
		a.Combo != b.Combo || a.Over != b.Over {
		t.Fatalf("stats diverged:\n a: score %d lines %d level %d combo %d over %v\n b: score %d lines %d level %d combo %d over %v",
			a.Score, a.Lines, a.Level, a.Combo, a.Over,
			b.Score, b.Lines, b.Level, b.Combo, b.Over)
	}
	if a.Board != b.Board {
		t.Fatalf("boards diverged:\n%s\n%s", a.Board.String(), b.Board.String())
	}
	if a.Active != b.Active {
		t.Errorf("active piece diverged: %+v vs %+v", a.Active, b.Active)
	}
	if a.GravityAccumulator != b.GravityAccumulator || a.LockAccumulator != b.LockAccumulator {
		t.Errorf("timers diverged: %v/%v vs %v/%v",
			a.GravityAccumulator, a.LockAccumulator, b.GravityAccumulator, b.LockAccumulator)
	}
	for i := range a.Next {
		if a.Next[i] != b.Next[i] {
			t.Fatalf("queues diverged: %v vs %v", a.Next, b.Next)
		}
	}
	if (a.Hold == nil) != (b.Hold == nil) {
		t.Fatalf("hold slots diverged: %v vs %v", a.Hold, b.Hold)
	}
	if a.Hold != nil && *a.Hold != *b.Hold {
		t.Errorf("hold slots diverged: %v vs %v", *a.Hold, *b.Hold)
	}
}

// The replay must actually exercise the game, or it proves nothing.
func TestReplayScriptIsSubstantial(t *testing.T) {
	g := play(8675309)
	if g.Score == 0 {
		t.Error("the replay script scored nothing; it is not exercising play")
	}
	if filledCount(&g.Board) == 0 && !g.Over {
		t.Error("the replay script locked nothing; it is not exercising play")
	}
}

// Different seeds must diverge, or "deterministic" would just mean "fixed".
func TestReplayDivergesBySeed(t *testing.T) {
	a := play(1)
	b := play(2)
	if a.Board == b.Board && a.Score == b.Score {
		t.Error("two seeds produced an identical outcome")
	}
}
```

- [ ] **Step 3: Run the tests**

Run: `go test ./internal/game/ -run 'GameOver|Blocked|Restart|Playing|Replay' -v`
Expected: PASS — the guards were written in Tasks 5–8, so these should pass as written. If any fail, the guard is genuinely missing: add `if g.Over { return nil }` at the top of the offending method in `internal/game/game.go` or `internal/game/rules.go` and re-run. Do not adjust the test to match the code.

- [ ] **Step 4: Run the whole engine suite with the race detector**

Run: `go test ./internal/game/ -count=2 -race`
Expected: PASS. `-count=2` catches state leaking through package-level variables; `-race` is cheap insurance before the concurrent Bubble Tea layer lands.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && go vet ./... && go test ./...
git add internal/game/gameover_test.go internal/game/replay_test.go internal/game/game.go internal/game/rules.go
git commit -m "test(game): game-over guards and seeded replay determinism"
```

---

### Task 10: CLI surface and README

**Files:**
- Create: `cmd/cosmic-tetris/main.go`
- Test: `cmd/cosmic-tetris/main_test.go`
- Create: `README.md`

**Interfaces:**
- Consumes: `game.New`, `game.Game.Next`, `game.Board.String` (Tasks 1–4).
- Produces: `type Config struct { Seed int64; ASCII bool; NoFX bool; ReducedMotion bool }`; `func parseFlags(args []string, out io.Writer, nowNano int64) (Config, error)`. The next plan's Bubble Tea program takes a `Config` and replaces the body of `main`.

- [ ] **Step 1: Write the failing test**

Create `cmd/cosmic-tetris/main_test.go`:

```go
package main

import (
	"errors"
	"flag"
	"io"
	"strings"
	"testing"
)

const fakeNow = int64(1700000000000000000)

func TestDefaultsSeedFromTheClock(t *testing.T) {
	cfg, err := parseFlags(nil, io.Discard, fakeNow)
	if err != nil {
		t.Fatalf("parseFlags() error: %v", err)
	}
	if cfg.Seed != fakeNow {
		t.Errorf("Seed = %d, want the supplied clock value %d", cfg.Seed, fakeNow)
	}
	if cfg.ASCII || cfg.NoFX || cfg.ReducedMotion {
		t.Errorf("Config = %+v, want all modes off by default", cfg)
	}
}

// §35: --seed is how a player reproduces a universe.
func TestSeedFlagIsHonoured(t *testing.T) {
	cfg, err := parseFlags([]string{"--seed", "1234"}, io.Discard, fakeNow)
	if err != nil {
		t.Fatalf("parseFlags() error: %v", err)
	}
	if cfg.Seed != 1234 {
		t.Errorf("Seed = %d, want 1234", cfg.Seed)
	}
}

// An explicit zero is a real seed, not "unset".
func TestExplicitZeroSeedIsNotOverwritten(t *testing.T) {
	cfg, err := parseFlags([]string{"--seed", "0"}, io.Discard, fakeNow)
	if err != nil {
		t.Fatalf("parseFlags() error: %v", err)
	}
	if cfg.Seed != 0 {
		t.Errorf("Seed = %d, want the explicitly requested 0", cfg.Seed)
	}
}

func TestSingleDashFormIsAccepted(t *testing.T) {
	cfg, err := parseFlags([]string{"-seed", "99", "-ascii"}, io.Discard, fakeNow)
	if err != nil {
		t.Fatalf("parseFlags() error: %v", err)
	}
	if cfg.Seed != 99 || !cfg.ASCII {
		t.Errorf("Config = %+v, want Seed 99 and ASCII true", cfg)
	}
}

// §49.5: the whole flag surface, and nothing else.
func TestRenderingModeFlags(t *testing.T) {
	cfg, err := parseFlags([]string{"--ascii", "--no-fx", "--reduced-motion"}, io.Discard, fakeNow)
	if err != nil {
		t.Fatalf("parseFlags() error: %v", err)
	}
	if !cfg.ASCII || !cfg.NoFX || !cfg.ReducedMotion {
		t.Errorf("Config = %+v, want all three modes on", cfg)
	}
}

// Review Focus 4: a mistyped seed gets a readable complaint, not a panic and
// not a silent seed of zero.
func TestParseFlagsRejectsBadSeed(t *testing.T) {
	for _, bad := range []string{"abc", "1e9", "12.5", ""} {
		var out strings.Builder
		cfg, err := parseFlags([]string{"--seed", bad}, &out, fakeNow)
		if err == nil {
			t.Errorf("--seed %q was accepted as %+v, want an error", bad, cfg)
			continue
		}
		if errors.Is(err, flag.ErrHelp) {
			t.Errorf("--seed %q reported help, want a parse error", bad)
		}
		if !strings.Contains(out.String(), "seed") {
			t.Errorf("--seed %q wrote %q, want a message naming the seed flag", bad, out.String())
		}
	}
}

func TestUnknownFlagIsRejected(t *testing.T) {
	var out strings.Builder
	if _, err := parseFlags([]string{"--warp-drive"}, &out, fakeNow); err == nil {
		t.Error("--warp-drive was accepted, want an error")
	}
	if !strings.Contains(out.String(), "warp-drive") {
		t.Errorf("output = %q, want it to name the unknown flag", out.String())
	}
}

func TestStrayArgumentIsRejected(t *testing.T) {
	var out strings.Builder
	if _, err := parseFlags([]string{"tetris.sav"}, &out, fakeNow); err == nil {
		t.Error("a stray argument was accepted, want an error")
	}
	if !strings.Contains(out.String(), "tetris.sav") {
		t.Errorf("output = %q, want it to name the unexpected argument", out.String())
	}
}

func TestHelpIsNotAnError(t *testing.T) {
	var out strings.Builder
	_, err := parseFlags([]string{"--help"}, &out, fakeNow)
	if !errors.Is(err, flag.ErrHelp) {
		t.Fatalf("--help returned %v, want flag.ErrHelp", err)
	}
	text := out.String()
	for _, want := range []string{"cosmic-tetris", "seed", "ascii", "no-fx", "reduced-motion"} {
		if !strings.Contains(text, want) {
			t.Errorf("help output does not mention %q:\n%s", want, text)
		}
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./cmd/cosmic-tetris/`
Expected: FAIL — `undefined: parseFlags`.

- [ ] **Step 3: Write the implementation**

Create `cmd/cosmic-tetris/main.go`:

```go
// Command cosmic-tetris is a falling-block puzzle game occurring during a
// completely unnecessary cosmological emergency.
package main

import (
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"time"

	"cosmic-tetris/internal/game"
)

const usage = `COSMIC TETRIS — a terminal gravity incident

usage: cosmic-tetris [flags]

`

// Config is the resolved command line (§46, §49.5).
type Config struct {
	Seed          int64
	ASCII         bool
	NoFX          bool
	ReducedMotion bool
}

// parseFlags parses argv without the program name, writing any diagnostics to
// out. An unset --seed resolves to nowNano so ordinary runs differ; passing
// --seed makes a run reproducible, including --seed 0. Returning flag.ErrHelp
// means the user asked for help and usage has already been written to out.
func parseFlags(args []string, out io.Writer, nowNano int64) (Config, error) {
	fs := flag.NewFlagSet("cosmic-tetris", flag.ContinueOnError)
	fs.SetOutput(out)

	seed := fs.Int64("seed", 0, "seed the game RNG for a reproducible universe")
	ascii := fs.Bool("ascii", false, "ASCII glyphs only, for mediocre terminals")
	noFX := fs.Bool("no-fx", false, "disable cosmic effects; still a good game")
	reduced := fs.Bool("reduced-motion", false, "no screen shake, hyperdrive or shockwaves")

	fs.Usage = func() {
		fmt.Fprint(out, usage)
		fs.PrintDefaults()
	}

	if err := fs.Parse(args); err != nil {
		return Config{}, err
	}
	if fs.NArg() > 0 {
		fmt.Fprintf(out, "unexpected argument: %s\n", fs.Arg(0))
		return Config{}, fmt.Errorf("unexpected argument: %s", fs.Arg(0))
	}

	cfg := Config{
		Seed:          *seed,
		ASCII:         *ascii,
		NoFX:          *noFX,
		ReducedMotion: *reduced,
	}
	if !flagWasSet(fs, "seed") {
		cfg.Seed = nowNano
	}
	return cfg, nil
}

// flagWasSet reports whether the user actually passed a flag, which is how an
// explicit --seed 0 stays distinguishable from an unset seed.
func flagWasSet(fs *flag.FlagSet, name string) bool {
	set := false
	fs.Visit(func(f *flag.Flag) {
		if f.Name == name {
			set = true
		}
	})
	return set
}

func main() {
	cfg, err := parseFlags(os.Args[1:], os.Stderr, time.Now().UnixNano())
	if err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return
		}
		os.Exit(2)
	}

	// The engine is complete but headless: the Bubble Tea program that renders
	// it replaces this block in the next phase. Until then, report the universe
	// this invocation would have opened.
	g := game.New(cfg.Seed)
	fmt.Printf("LOCAL UNIVERSE %016X\n", uint64(cfg.Seed))
	fmt.Printf("modes: ascii=%v no-fx=%v reduced-motion=%v\n",
		cfg.ASCII, cfg.NoFX, cfg.ReducedMotion)
	fmt.Printf("active: %v   next: %v\n", g.Active.Kind, g.Next)
	fmt.Print(g.Board.String())
	fmt.Println("UNIVERSE ONLINE (renderer arrives in phase 2)")
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./cmd/cosmic-tetris/ -v`
Expected: PASS — nine tests.

- [ ] **Step 5: Check it actually runs**

```bash
go run ./cmd/cosmic-tetris --seed 8675309
go run ./cmd/cosmic-tetris --help
go run ./cmd/cosmic-tetris --seed abc; echo "exit: $?"
```

Expected: the first prints `LOCAL UNIVERSE 0000000000845FED`, the mode line, the active piece and five upcoming pieces, 22 rows of dots, and `UNIVERSE ONLINE`. Running it twice with the same seed prints identical piece lists. `--help` prints usage and exits 0. `--seed abc` prints a one-line complaint naming `-seed` and exits 2.

- [ ] **Step 6: Write the README**

Create `README.md`:

```markdown
# Cosmic Tetris

A falling-block puzzle game occurring during a completely unnecessary
cosmological emergency. Terminal only. See `design.md` for the build spec.

## Status

Phase 1 of five (`design.md` §42): the game engine is complete, tested and
headless. There is no renderer yet, so `cosmic-tetris` currently prints the
universe it would have opened and exits. Phase 2 adds the Bubble Tea terminal.

## Run

```bash
go run ./cmd/cosmic-tetris
go run ./cmd/cosmic-tetris --seed 8675309
go run ./cmd/cosmic-tetris --help
```

Flags: `--seed N` (reproducible universe), `--ascii` (ASCII glyphs only),
`--no-fx` (no cosmic effects), `--reduced-motion` (no shake, hyperdrive or
shockwaves).

## Test

```bash
go test ./...
go test ./internal/game/ -count=2 -race
```

## Layout

- `internal/game` — all the rules. Headless, deterministic, and it never reads
  a clock: `Advance(dt)` is the only notion of time, which is what makes a
  seeded replay reproducible. Emits `Event` values describing what happened.
- `cmd/cosmic-tetris` — flag parsing and entry point.

Two rules hold the design together. The engine's RNG drives piece order and
nothing else; the effects layer will own a separate generator, so particle
counts can never perturb the bag. And events travel one way: effects observe
game state, never modify it.
```

- [ ] **Step 7: Commit**

```bash
gofmt -l . && go vet ./... && go test ./...
git add cmd/cosmic-tetris/main.go cmd/cosmic-tetris/main_test.go README.md
git commit -m "feat(cli): flag surface, entry point and README"
```

- [ ] **Step 8: Final verification of the whole plan**

```bash
go build ./...
go vet ./...
gofmt -l .
go test ./... -count=2 -race
```

Expected: build clean, vet clean, `gofmt -l` silent, all tests pass twice with the race detector. Then confirm by hand that the §47 items in scope for this plan hold: piece generation is deterministic (`TestReplayIsDeterministic`), game RNG is isolated from any FX RNG (there is only one generator and it is unexported), line clearing is correct (Task 6 tests), gravity increases (`TestDropIntervalFollowsTheCurve`), hold works (Task 8), ghost works (`TestGhostYIsTheLandingPosition`), next queue works (`TestTakeNextKeepsQueueFull`), restart works (`TestRestartRebuildsTheSameUniverse`), game logic has comprehensive unit tests. The remaining §47 items are renderer and FX work owned by later plans.
