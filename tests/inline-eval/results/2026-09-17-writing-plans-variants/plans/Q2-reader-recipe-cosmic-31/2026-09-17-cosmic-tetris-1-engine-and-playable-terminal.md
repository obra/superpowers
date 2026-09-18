# Cosmic Tetris — Plan 1: Engine and Playable Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic headless tetromino engine and a genuinely good, effect-free Bubble Tea terminal game on top of it — playable from first piece through game over, with responsive controls, hold, ghost, next queue, pause, restart, and live resize.

**Architecture:** `internal/game` is a pure, clock-free state machine: every mutation is a method that returns `[]Event`, and time enters only as a `dt` argument to `Advance`. `internal/render` turns a `*game.Game` plus terminal dimensions into a string by painting onto a small styled cell grid (`Canvas`), which later becomes the compositing surface for effects. `internal/app` is the Bubble Tea layer: one 60 Hz frame clock, immediate key handling, and no game logic of its own.

**Tech Stack:** Go 1.24, `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`, `math/rand` (v1, for reproducible `rand.New(rand.NewSource(seed))`).

**Spec:** `design.md` (this plan implements §1–§13, §31–§38, §40–§42 phases 1–2, §46, §49)

## Global Constraints

- Module path: `cosmic-tetris`. Go directive: `go 1.24`.
- Imports are exactly `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2` (§3). No other third-party dependencies.
- Nothing under `internal/game` may import `time` for anything but the `time.Duration` type, and nothing under `internal/game` may call `time.Now()` (§49.2).
- `internal/game` must not import `internal/render`, `internal/app`, `internal/fx`, or any Charm package. The engine is headless.
- Rendering must never mutate game state (§37). Render functions take `*game.Game` and treat it as read-only.
- The `Game` RNG (`rand.New(rand.NewSource(seed))`) drives the 7-bag and nothing else (§49.6).
- Board geometry: width 10, height 22, visible rows 20, hidden spawn rows 2 (§5). One logical cell renders as 2 terminal columns × 1 terminal row.
- Glyphs (§49.4): blocks `██` (ASCII `[]`), ghost `░░` (ASCII `··`). Active piece renders one step brighter than locked cells.
- Combo bonus is `50 × (combo - 1) × level`; first clearing placement sets combo to 1 (§49.1).
- Minimum usable terminal is 40 columns × 24 rows; below that show the too-small notice (§31). Never crash from resizing.
- Do not create files beyond the tree in §33 unless this plan names them. This plan names two additions and says why: `internal/game/events.go` (the event vocabulary the engine emits; `fx/events.go` in §33 is the FX-side consumer, added in Plan 2) and `internal/render/canvas.go` (the cell grid every render step paints onto — §37's "composite" steps need a surface).
- Do not build: networking, profiles, achievements, plugins, persistence (§2).
- Every task ends with a commit. Run `gofmt -l .` before each commit; it must print nothing.

## Review Focus

These are input classes the spec implies but never names a test for. Each one has a test added to the task that owns the code.

1. **A frame arrives after a long stall** (laptop sleep, SIGSTOP, a slow terminal): `Advance(5s)` at level 1 would run ~6 gravity steps, but at level 15 it is hundreds, and a catch-up avalanche silently teleports and locks pieces the player never saw. The engine must handle any `dt` correctly, and the app must clamp per-frame `dt` so a stall costs at most one visible drop burst. — Task 8 (engine), Task 15 (clamp).
2. **Resize to degenerate dimensions**: `WindowSizeMsg{Width: 0, Height: 0}` or 1×1 arrives during play (some terminals emit it while dragging, and tmux emits it on detach). Layout must return the too-small mode without allocating a negative-sized canvas or indexing past a row. — Task 12.
3. **Keys pressed in states that do not take them**: movement during pause, `c` after game over, `space` while the game-over panel is up. Each must be ignored without mutating the game — not silently applied to a dead board. — Task 16.
4. **Hard drop on an already-grounded piece**: distance is 0, so the drop must award 0 points (not negative), still lock the piece, and still emit `EventPieceHardDropped` so effects fire. — Task 9.
5. **A very large terminal** (e.g. 400×120): the board must stay 20×20 cells and centered rather than stretching, and the canvas must not be allocated per-cell-per-frame in a way that scales with unused area. — Task 12.

---

## File Structure

```text
cosmic-tetris/
├── cmd/cosmic-tetris/main.go     flag parsing, program start
├── internal/game/
│   ├── board.go                  Board, cells, bounds, occupancy, row clearing
│   ├── piece.go                  PieceKind, Piece, rotation shape tables
│   ├── bag.go                    7-bag generator
│   ├── rules.go                  constants, DropInterval, TryRotate, DropDistance
│   ├── scoring.go                LineScore, ComboBonus, LevelForLines
│   ├── events.go                 EventKind, Event
│   └── game.go                   Game, New, Advance, input methods, Restart
├── internal/render/
│   ├── canvas.go                 styled cell grid + String()
│   ├── palette.go                Mode, Palette, Glyphs
│   ├── layout.go                 Rect, Layout, Compute
│   ├── board.go                  board frame, locked cells, ghost, active piece
│   ├── hud.go                    HOLD, NEXT, stats, controls, overlays
│   └── render.go                 Frame(): the §37 pipeline, minus FX steps
├── internal/app/
│   ├── keys.go                   KeyMap (bubbles/key)
│   ├── messages.go               FrameMsg
│   ├── model.go                  Model, Init, View
│   └── update.go                 Update
├── go.mod
├── README.md
└── LICENSE
```

`internal/flavor` and `internal/fx` arrive in Plan 2.

---

### Task 1: Repo scaffold and Board geometry

**Files:**
- Create: `go.mod`, `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces: `game.Width = 10`, `game.Height = 22`, `game.VisibleRows = 20`, `game.HiddenRows = 2`, `type Cell uint8`, `const Empty Cell = 0`, `type Board struct { Cells [Height][Width]Cell }`, `func (b *Board) At(x, y int) Cell`, `func (b *Board) Set(x, y int, c Cell)`, `func (b *Board) Blocked(x, y int) bool`.

Coordinates: `y = 0` is the top hidden row, `y = 21` the bottom visible row. Visible rows are `y = 2..21`. `x = 0` is the left column.

- [ ] **Step 1: Initialize the module**

```bash
go mod init cosmic-tetris
```

- [ ] **Step 2: Write the failing test**

```go
package game

import "testing"

func TestBoardStartsEmpty(t *testing.T) {
	var b Board
	for y := 0; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if b.At(x, y) != Empty {
				t.Fatalf("cell (%d,%d) = %v, want Empty", x, y, b.At(x, y))
			}
		}
	}
}

func TestBoardGeometryConstants(t *testing.T) {
	if Width != 10 || Height != 22 || VisibleRows != 20 || HiddenRows != 2 {
		t.Fatalf("geometry = %d,%d,%d,%d; want 10,22,20,2", Width, Height, VisibleRows, HiddenRows)
	}
	if HiddenRows+VisibleRows != Height {
		t.Fatal("hidden + visible must equal Height")
	}
}

func TestBlockedOutsideWallsAndFloor(t *testing.T) {
	var b Board
	cases := []struct {
		x, y int
		want bool
	}{
		{-1, 5, true},    // left wall
		{Width, 5, true},  // right wall
		{3, Height, true}, // floor
		{3, -1, false},    // above the board is free space
		{3, 5, false},     // empty cell
	}
	for _, c := range cases {
		if got := b.Blocked(c.x, c.y); got != c.want {
			t.Errorf("Blocked(%d,%d) = %v, want %v", c.x, c.y, got, c.want)
		}
	}
}

func TestBlockedOnOccupiedCell(t *testing.T) {
	var b Board
	b.Set(4, 20, Cell(1))
	if !b.Blocked(4, 20) {
		t.Fatal("occupied cell must be blocked")
	}
	if b.Blocked(4, 19) {
		t.Fatal("empty cell above must not be blocked")
	}
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `go test ./internal/game/ -run 'TestBoard|TestBlocked' -v`
Expected: FAIL — undefined: `Board`, `Width`, `At`, `Blocked`.

- [ ] **Step 4: Implement `board.go`**

`Blocked` returns true when `x` is outside `[0, Width)`, when `y >= Height`, or when `At(x, y) != Empty`. A negative `y` is free space, so pieces can spawn and rotate partly above the board. `At` returns `Empty` for any out-of-range coordinate; `Set` ignores out-of-range coordinates.

- [ ] **Step 5: Run the test to verify it passes**

Run: `go test ./internal/game/ -run 'TestBoard|TestBlocked' -v`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
gofmt -l . && git add go.mod internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board geometry, cell access, and occupancy"
```

---

### Task 2: Pieces and rotation shapes

**Files:**
- Create: `internal/game/piece.go`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: `Width` from Task 1.
- Produces: `type PieceKind uint8`, `const (I PieceKind = iota; J; L; O; S; T; Z)`, `var AllKinds = [7]PieceKind{I, J, L, O, S, T, Z}`, `func (k PieceKind) String() string` (returns `"I"`…`"Z"`), `type Piece struct { Kind PieceKind; Rotation, X, Y int }`, `func Shape(k PieceKind, rotation int) [4][2]int` (offsets within a 4×4 box, `[dx, dy]`), `func (p Piece) Cells() [4][2]int` (absolute board coordinates), `func Spawn(k PieceKind) Piece`.

- [ ] **Step 1: Write the failing test**

```go
package game

import "testing"

func TestShapeHasFourDistinctCellsInBox(t *testing.T) {
	for _, k := range AllKinds {
		for rot := 0; rot < 4; rot++ {
			seen := map[[2]int]bool{}
			for _, c := range Shape(k, rot) {
				if c[0] < 0 || c[0] > 3 || c[1] < 0 || c[1] > 3 {
					t.Errorf("%v rot %d: cell %v outside 4x4 box", k, rot, c)
				}
				if seen[c] {
					t.Errorf("%v rot %d: duplicate cell %v", k, rot, c)
				}
				seen[c] = true
			}
		}
	}
}

func TestShapeRotationWrapsAndAcceptsNegative(t *testing.T) {
	for _, k := range AllKinds {
		if Shape(k, 4) != Shape(k, 0) {
			t.Errorf("%v: rotation 4 must equal rotation 0", k)
		}
		if Shape(k, -1) != Shape(k, 3) {
			t.Errorf("%v: rotation -1 must equal rotation 3", k)
		}
	}
}

func TestOIsRotationInvariant(t *testing.T) {
	for rot := 1; rot < 4; rot++ {
		if Shape(O, rot) != Shape(O, 0) {
			t.Errorf("O rotation %d differs from rotation 0", rot)
		}
	}
}

func TestIPieceRotationsAreHorizontalAndVertical(t *testing.T) {
	if Shape(I, 0) != [4][2]int{{0, 1}, {1, 1}, {2, 1}, {3, 1}} {
		t.Errorf("I rot 0 = %v", Shape(I, 0))
	}
	if Shape(I, 1) != [4][2]int{{2, 0}, {2, 1}, {2, 2}, {2, 3}} {
		t.Errorf("I rot 1 = %v", Shape(I, 1))
	}
}

func TestTPieceAllRotations(t *testing.T) {
	want := [4][4][2]int{
		{{1, 0}, {0, 1}, {1, 1}, {2, 1}},
		{{1, 0}, {1, 1}, {2, 1}, {1, 2}},
		{{0, 1}, {1, 1}, {2, 1}, {1, 2}},
		{{1, 0}, {0, 1}, {1, 1}, {1, 2}},
	}
	for rot := 0; rot < 4; rot++ {
		if Shape(T, rot) != want[rot] {
			t.Errorf("T rot %d = %v, want %v", rot, Shape(T, rot), want[rot])
		}
	}
}

func TestCellsAreShapeTranslatedByXY(t *testing.T) {
	p := Piece{Kind: T, Rotation: 0, X: 4, Y: 7}
	want := [4][2]int{{5, 7}, {4, 8}, {5, 8}, {6, 8}}
	if p.Cells() != want {
		t.Fatalf("Cells() = %v, want %v", p.Cells(), want)
	}
}

func TestSpawnPositionIsTopCenter(t *testing.T) {
	for _, k := range AllKinds {
		p := Spawn(k)
		if p.X != 3 || p.Y != 0 || p.Rotation != 0 || p.Kind != k {
			t.Errorf("Spawn(%v) = %+v, want X=3 Y=0 Rotation=0", k, p)
		}
		for _, c := range p.Cells() {
			if c[0] < 0 || c[0] >= Width {
				t.Errorf("Spawn(%v) cell %v outside board width", k, c)
			}
			if c[1] >= HiddenRows {
				t.Errorf("Spawn(%v) cell %v is not in the hidden rows", k, c)
			}
		}
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run 'TestShape|TestO|TestI|TestT|TestCells|TestSpawn' -v`
Expected: FAIL — undefined: `Shape`, `Piece`, `Spawn`.

- [ ] **Step 3: Implement `piece.go` with these exact shape tables**

`Shape` normalizes rotation with `((rotation % 4) + 4) % 4` and indexes this table. `Cells` adds `p.X`/`p.Y` to each offset. `Spawn` returns `Piece{Kind: k, Rotation: 0, X: 3, Y: 0}` — `X = 3` centers the 4-wide box in a 10-wide board.

```go
var shapes = [7][4][4][2]int{
	I: {
		{{0, 1}, {1, 1}, {2, 1}, {3, 1}},
		{{2, 0}, {2, 1}, {2, 2}, {2, 3}},
		{{0, 2}, {1, 2}, {2, 2}, {3, 2}},
		{{1, 0}, {1, 1}, {1, 2}, {1, 3}},
	},
	J: {
		{{0, 0}, {0, 1}, {1, 1}, {2, 1}},
		{{1, 0}, {2, 0}, {1, 1}, {1, 2}},
		{{0, 1}, {1, 1}, {2, 1}, {2, 2}},
		{{1, 0}, {1, 1}, {0, 2}, {1, 2}},
	},
	L: {
		{{2, 0}, {0, 1}, {1, 1}, {2, 1}},
		{{1, 0}, {1, 1}, {1, 2}, {2, 2}},
		{{0, 1}, {1, 1}, {2, 1}, {0, 2}},
		{{0, 0}, {1, 0}, {1, 1}, {1, 2}},
	},
	O: {
		{{1, 0}, {2, 0}, {1, 1}, {2, 1}},
		{{1, 0}, {2, 0}, {1, 1}, {2, 1}},
		{{1, 0}, {2, 0}, {1, 1}, {2, 1}},
		{{1, 0}, {2, 0}, {1, 1}, {2, 1}},
	},
	S: {
		{{1, 0}, {2, 0}, {0, 1}, {1, 1}},
		{{1, 0}, {1, 1}, {2, 1}, {2, 2}},
		{{1, 1}, {2, 1}, {0, 2}, {1, 2}},
		{{0, 0}, {0, 1}, {1, 1}, {1, 2}},
	},
	T: {
		{{1, 0}, {0, 1}, {1, 1}, {2, 1}},
		{{1, 0}, {1, 1}, {2, 1}, {1, 2}},
		{{0, 1}, {1, 1}, {2, 1}, {1, 2}},
		{{1, 0}, {0, 1}, {1, 1}, {1, 2}},
	},
	Z: {
		{{0, 0}, {1, 0}, {1, 1}, {2, 1}},
		{{2, 0}, {1, 1}, {2, 1}, {1, 2}},
		{{0, 1}, {1, 1}, {1, 2}, {2, 2}},
		{{1, 0}, {0, 1}, {1, 1}, {0, 2}},
	},
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/game/ -run 'TestShape|TestO|TestI|TestT|TestCells|TestSpawn' -v`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): tetromino kinds, rotation tables, and spawn position"
```

---

### Task 3: Fit, wall kicks, and drop distance

**Files:**
- Create: `internal/game/rules.go`
- Test: `internal/game/rules_test.go`

**Interfaces:**
- Consumes: `Board.Blocked`, `Piece.Cells`, `Shape` from Tasks 1–2.
- Produces: `func (b *Board) Fits(p Piece) bool`, `var KickOffsets = [8][2]int{{0,0},{-1,0},{1,0},{-2,0},{2,0},{0,-1},{-1,-1},{1,-1}}`, `func TryRotate(b *Board, p Piece, dir int) (Piece, bool)` (`dir` is `+1` clockwise, `-1` counter-clockwise), `func DropDistance(b *Board, p Piece) int`, and the timing constants: `BaseDropInterval = 800 * time.Millisecond`, `MinDropInterval = 60 * time.Millisecond`, `GravityFactor = 0.86`, `LockDelay = 500 * time.Millisecond`, `MaxLockResets = 15`, `LinesPerLevel = 10`, `NextQueueLen = 5`, plus `func DropInterval(level int) time.Duration`.

- [ ] **Step 1: Write the failing test**

```go
package game

import (
	"testing"
	"time"
)

func TestFitsRejectsWallsFloorAndOccupied(t *testing.T) {
	var b Board
	if b.Fits(Piece{Kind: O, X: -2, Y: 10}) {
		t.Error("piece off the left edge must not fit")
	}
	if b.Fits(Piece{Kind: O, X: Width - 1, Y: 10}) {
		t.Error("piece off the right edge must not fit")
	}
	if b.Fits(Piece{Kind: O, X: 4, Y: Height - 1}) {
		t.Error("piece through the floor must not fit")
	}
	if !b.Fits(Piece{Kind: O, X: 4, Y: 10}) {
		t.Error("piece in open space must fit")
	}
	b.Set(5, 11, Cell(1))
	if b.Fits(Piece{Kind: O, X: 4, Y: 10}) {
		t.Error("piece overlapping a locked cell must not fit")
	}
}

func TestFitsAllowsCellsAboveTheBoard(t *testing.T) {
	var b Board
	if !b.Fits(Piece{Kind: I, Rotation: 1, X: 3, Y: -2}) {
		t.Fatal("a piece sticking out above the board must fit")
	}
}

func TestRotateInOpenSpaceUsesZeroOffset(t *testing.T) {
	var b Board
	p := Piece{Kind: T, Rotation: 0, X: 4, Y: 10}
	got, ok := TryRotate(&b, p, 1)
	if !ok {
		t.Fatal("rotation in open space must succeed")
	}
	if got.Rotation != 1 || got.X != 4 || got.Y != 10 {
		t.Fatalf("got %+v, want rotation 1 at (4,10)", got)
	}
}

func TestRotateCounterClockwiseWrapsToThree(t *testing.T) {
	var b Board
	got, ok := TryRotate(&b, Piece{Kind: T, Rotation: 0, X: 4, Y: 10}, -1)
	if !ok || got.Rotation != 3 {
		t.Fatalf("got %+v ok=%v, want rotation 3", got, ok)
	}
}

func TestRotateKicksOffTheRightWall(t *testing.T) {
	var b Board
	// I at rotation 1 occupies column X+2; place it so rotating to horizontal
	// would need columns X..X+3 and overflow the right edge.
	p := Piece{Kind: I, Rotation: 1, X: 7, Y: 10}
	if !b.Fits(p) {
		t.Fatal("precondition: vertical I must fit at X=7")
	}
	got, ok := TryRotate(&b, p, 1)
	if !ok {
		t.Fatal("rotation must succeed via a wall kick")
	}
	if got.X >= 7 {
		t.Fatalf("expected a leftward kick, got X=%d", got.X)
	}
	if !b.Fits(got) {
		t.Fatal("kicked result must fit")
	}
}

func TestRotateKickOrderPrefersEarlierOffsets(t *testing.T) {
	var b Board
	// Block the (0,0) target so the first offset fails and (-1,0) is taken.
	p := Piece{Kind: T, Rotation: 0, X: 4, Y: 10}
	target, _ := TryRotate(&b, p, 1) // learn the un-kicked cells
	for _, c := range target.Cells() {
		if c != [2]int{5, 10} && c != [2]int{5, 11} && c != [2]int{6, 11} {
			continue
		}
	}
	b.Set(6, 11, Cell(1)) // occupies a cell of T rotation 1 at X=4
	got, ok := TryRotate(&b, p, 1)
	if !ok {
		t.Fatal("rotation must succeed via a kick")
	}
	if got.X != 3 {
		t.Fatalf("expected the (-1,0) kick to X=3, got X=%d", got.X)
	}
}

func TestRotateFailsWhenNoOffsetFits(t *testing.T) {
	var b Board
	// Fill every row the T piece could reach, leaving only its current cells.
	p := Piece{Kind: T, Rotation: 0, X: 4, Y: 19}
	occupied := map[[2]int]bool{}
	for _, c := range p.Cells() {
		occupied[c] = true
	}
	for y := 16; y < Height; y++ {
		for x := 0; x < Width; x++ {
			if !occupied[[2]int{x, y}] {
				b.Set(x, y, Cell(1))
			}
		}
	}
	if _, ok := TryRotate(&b, p, 1); ok {
		t.Fatal("rotation with no valid offset must fail")
	}
}

func TestDropDistanceToFloorAndOntoStack(t *testing.T) {
	var b Board
	p := Piece{Kind: O, X: 4, Y: 0} // cells at rows 0 and 1
	if got := DropDistance(&b, p); got != Height-2 {
		t.Errorf("DropDistance to floor = %d, want %d", got, Height-2)
	}
	b.Set(5, 21, Cell(1))
	if got := DropDistance(&b, p); got != Height-3 {
		t.Errorf("DropDistance onto stack = %d, want %d", got, Height-3)
	}
}

func TestDropDistanceIsZeroWhenGrounded(t *testing.T) {
	var b Board
	p := Piece{Kind: O, X: 4, Y: Height - 2}
	if got := DropDistance(&b, p); got != 0 {
		t.Fatalf("DropDistance = %d, want 0", got)
	}
}

func TestDropIntervalCurveAndClamp(t *testing.T) {
	if got := DropInterval(1); got != 800*time.Millisecond {
		t.Errorf("level 1 = %v, want 800ms", got)
	}
	if got := DropInterval(2); got < 685*time.Millisecond || got > 690*time.Millisecond {
		t.Errorf("level 2 = %v, want ~688ms (800 * 0.86)", got)
	}
	if got := DropInterval(40); got != MinDropInterval {
		t.Errorf("level 40 = %v, want the %v clamp", got, MinDropInterval)
	}
	for level := 1; level < 60; level++ {
		if DropInterval(level+1) > DropInterval(level) {
			t.Fatalf("interval must be non-increasing at level %d", level)
		}
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run 'TestFits|TestRotate|TestDrop' -v`
Expected: FAIL — undefined: `Fits`, `TryRotate`, `DropDistance`, `DropInterval`.

- [ ] **Step 3: Implement `rules.go`**

`Fits` returns false if `Blocked` is true for any of the piece's cells. `TryRotate` builds the candidate `Piece{Kind, Rotation: p.Rotation + dir, X, Y}` and tries each entry of `KickOffsets` in order, returning the first candidate that `Fits`; on failure it returns the original piece and `false`. Rotation is stored normalized into `0..3`. `DropDistance` counts how many times `Y` can increase by 1 and still `Fit`. `DropInterval` computes `800ms × 0.86^(level-1)` in float64 and returns `max(result, MinDropInterval)`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/game/ -run 'TestFits|TestRotate|TestDrop' -v`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/game/rules.go internal/game/rules_test.go
git commit -m "feat(game): collision, wall kicks, drop distance, gravity curve"
```

---

### Task 4: The 7-bag

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `AllKinds` from Task 2.
- Produces: `type Bag struct { remaining []PieceKind }`, `func (b *Bag) Next(rng *rand.Rand) PieceKind`.

The bag takes the RNG as an argument rather than owning one, because §49.6 puts RNG ownership on `Game`.

- [ ] **Step 1: Write the failing test**

```go
package game

import (
	"math/rand"
	"testing"
)

func TestEachBagContainsAllSevenKindsOnce(t *testing.T) {
	rng := rand.New(rand.NewSource(1))
	var bag Bag
	for round := 0; round < 20; round++ {
		counts := map[PieceKind]int{}
		for i := 0; i < 7; i++ {
			counts[bag.Next(rng)]++
		}
		if len(counts) != 7 {
			t.Fatalf("round %d: got %d distinct kinds, want 7 (%v)", round, len(counts), counts)
		}
		for _, k := range AllKinds {
			if counts[k] != 1 {
				t.Fatalf("round %d: kind %v appeared %d times, want 1", round, k, counts[k])
			}
		}
	}
}

func TestSeededBagsAreReproducible(t *testing.T) {
	draw := func(seed int64) []PieceKind {
		rng := rand.New(rand.NewSource(seed))
		var bag Bag
		out := make([]PieceKind, 0, 21)
		for i := 0; i < 21; i++ {
			out = append(out, bag.Next(rng))
		}
		return out
	}
	a, b := draw(8675309), draw(8675309)
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("same seed diverged at index %d: %v vs %v", i, a[i], b[i])
		}
	}
	if c := draw(42); len(c) == len(a) && func() bool {
		for i := range a {
			if a[i] != c[i] {
				return false
			}
		}
		return true
	}() {
		t.Fatal("different seeds produced an identical sequence")
	}
}

func TestBagShufflesRatherThanReturningCanonicalOrder(t *testing.T) {
	rng := rand.New(rand.NewSource(7))
	var bag Bag
	canonical := true
	for i := 0; i < 7; i++ {
		if bag.Next(rng) != AllKinds[i] {
			canonical = false
		}
	}
	if canonical {
		t.Fatal("first bag came out in canonical order; is it shuffled?")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run TestBag -run 'TestEachBag|TestSeededBags|TestBagShuffles' -v`
Expected: FAIL — undefined: `Bag`.

- [ ] **Step 3: Implement `bag.go`**

When `remaining` is empty, refill it with `AllKinds` in canonical order and shuffle with `rng.Shuffle`. `Next` pops the last element.

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/game/ -run 'TestEachBag|TestSeededBags|TestBagShuffles' -v`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag piece generator"
```

---

### Task 5: Row completion, clearing, and collapse

**Files:**
- Modify: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Board` from Task 1.
- Produces: `func (b *Board) CompleteRows() []int` (ascending row indices, `nil` when none), `func (b *Board) ClearRows(rows []int)`.

- [ ] **Step 1: Write the failing test**

```go
func fillRow(b *Board, y int, c Cell) {
	for x := 0; x < Width; x++ {
		b.Set(x, y, c)
	}
}

func TestCompleteRowsFindsFullRowsAscending(t *testing.T) {
	var b Board
	if got := b.CompleteRows(); len(got) != 0 {
		t.Fatalf("empty board returned %v", got)
	}
	fillRow(&b, 21, Cell(1))
	fillRow(&b, 19, Cell(2))
	got := b.CompleteRows()
	if len(got) != 2 || got[0] != 19 || got[1] != 21 {
		t.Fatalf("CompleteRows() = %v, want [19 21]", got)
	}
}

func TestCompleteRowsIgnoresRowWithAGap(t *testing.T) {
	var b Board
	fillRow(&b, 21, Cell(1))
	b.Set(4, 21, Empty)
	if got := b.CompleteRows(); len(got) != 0 {
		t.Fatalf("row with a gap reported complete: %v", got)
	}
}

func TestClearRowsCollapsesRowsAbove(t *testing.T) {
	var b Board
	fillRow(&b, 21, Cell(1)) // full, will clear
	b.Set(0, 20, Cell(7))    // lone marker above it
	b.ClearRows([]int{21})
	if b.At(0, 21) != Cell(7) {
		t.Errorf("marker did not fall to row 21: got %v", b.At(0, 21))
	}
	if b.At(0, 20) != Empty {
		t.Errorf("row 20 should be empty after collapse, got %v", b.At(0, 20))
	}
}

func TestClearRowsHandlesFourAtOnce(t *testing.T) {
	var b Board
	for y := 18; y <= 21; y++ {
		fillRow(&b, y, Cell(1))
	}
	b.Set(3, 17, Cell(5))
	b.ClearRows([]int{18, 19, 20, 21})
	if b.At(3, 21) != Cell(5) {
		t.Errorf("marker should land on row 21, got %v at (3,21)", b.At(3, 21))
	}
	if len(b.CompleteRows()) != 0 {
		t.Error("no complete rows should remain")
	}
	for y := 0; y <= 20; y++ {
		for x := 0; x < Width; x++ {
			if b.At(x, y) != Empty {
				t.Fatalf("cell (%d,%d) should be empty after collapse", x, y)
			}
		}
	}
}

func TestClearRowsWithNonAdjacentRows(t *testing.T) {
	var b Board
	fillRow(&b, 21, Cell(1))
	fillRow(&b, 19, Cell(2))
	b.Set(0, 20, Cell(9))
	b.ClearRows([]int{19, 21})
	if b.At(0, 21) != Cell(9) {
		t.Fatalf("row 20's marker should end at row 21, got %v", b.At(0, 21))
	}
}

func TestClearRowsWithEmptySliceIsNoOp(t *testing.T) {
	var b Board
	b.Set(2, 15, Cell(3))
	b.ClearRows(nil)
	if b.At(2, 15) != Cell(3) {
		t.Fatal("ClearRows(nil) must not move anything")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run 'TestCompleteRows|TestClearRows' -v`
Expected: FAIL — undefined: `CompleteRows`, `ClearRows`.

- [ ] **Step 3: Implement `CompleteRows` and `ClearRows` in `board.go`**

`ClearRows` copies rows from bottom to top, skipping cleared rows, then blanks the leftover rows at the top. It must be correct for non-adjacent cleared rows, so a write cursor walking upward from `Height-1` is the natural shape.

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/game/ -run 'TestCompleteRows|TestClearRows' -v`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): row completion detection and collapse"
```

---

### Task 6: Scoring and level progression

**Files:**
- Create: `internal/game/scoring.go`
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Produces: `func LineScore(lines, level int) int`, `func ComboBonus(combo, level int) int`, `func LevelForLines(lines int) int`, `const SoftDropPoints = 1`, `const HardDropPoints = 2`.

- [ ] **Step 1: Write the failing test**

```go
package game

import "testing"

func TestLineScoreBaseValues(t *testing.T) {
	cases := []struct{ lines, level, want int }{
		{0, 1, 0},
		{1, 1, 100},
		{2, 1, 300},
		{3, 1, 500},
		{4, 1, 800},
		{1, 7, 700},
		{4, 13, 10400},
	}
	for _, c := range cases {
		if got := LineScore(c.lines, c.level); got != c.want {
			t.Errorf("LineScore(%d,%d) = %d, want %d", c.lines, c.level, got, c.want)
		}
	}
}

func TestComboBonusStartsAtComboTwo(t *testing.T) {
	cases := []struct{ combo, level, want int }{
		{0, 5, 0},
		{1, 5, 0}, // a lone clear earns no combo bonus (§49.1)
		{2, 1, 50},
		{2, 5, 250},
		{7, 3, 900},
	}
	for _, c := range cases {
		if got := ComboBonus(c.combo, c.level); got != c.want {
			t.Errorf("ComboBonus(%d,%d) = %d, want %d", c.combo, c.level, got, c.want)
		}
	}
}

func TestLevelForLines(t *testing.T) {
	cases := []struct{ lines, want int }{
		{0, 1}, {9, 1}, {10, 2}, {19, 2}, {20, 3}, {127, 13},
	}
	for _, c := range cases {
		if got := LevelForLines(c.lines); got != c.want {
			t.Errorf("LevelForLines(%d) = %d, want %d", c.lines, got, c.want)
		}
	}
}

func TestDropPointConstants(t *testing.T) {
	if SoftDropPoints != 1 || HardDropPoints != 2 {
		t.Fatalf("drop points = %d,%d; want 1,2", SoftDropPoints, HardDropPoints)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run 'TestLineScore|TestComboBonus|TestLevelForLines|TestDropPoint' -v`
Expected: FAIL — undefined: `LineScore`, `ComboBonus`, `LevelForLines`.

- [ ] **Step 3: Implement `scoring.go`**

Base values `{0, 100, 300, 500, 800}` indexed by line count, multiplied by level; `LineScore` returns 0 for any count outside `0..4`. `LevelForLines` is `lines/LinesPerLevel + 1`. `ComboBonus` returns 0 when `combo < 2`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/game/ -run 'TestLineScore|TestComboBonus|TestLevelForLines|TestDropPoint' -v`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/game/scoring.go internal/game/scoring_test.go
git commit -m "feat(game): line, combo, drop, and level scoring rules"
```

---

### Task 7: Event vocabulary

**Files:**
- Create: `internal/game/events.go`
- Test: `internal/game/events_test.go`

**Interfaces:**
- Consumes: `Piece` from Task 2.
- Produces:

```go
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

// Event is what the engine tells the outside world happened. FX consume these
// and may never write back (§14).
type Event struct {
	Kind     EventKind
	Piece    Piece // the piece involved, where meaningful
	Rows     []int // EventLinesCleared: cleared rows, ascending
	Distance int   // EventPieceHardDropped: cells fallen
	Value    int   // EventComboChanged: new combo. EventLevelChanged: new level.
}

func (k EventKind) String() string
```

- [ ] **Step 1: Write the failing test**

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
		if s == "" || seen[s] {
			t.Fatalf("EventKind %d has empty or duplicate name %q", k, s)
		}
		seen[s] = true
	}
	if EventPieceMoved.String() != "PieceMoved" {
		t.Errorf("EventPieceMoved.String() = %q, want %q", EventPieceMoved.String(), "PieceMoved")
	}
	if EventGameOver.String() != "GameOver" {
		t.Errorf("EventGameOver.String() = %q, want %q", EventGameOver.String(), "GameOver")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run TestEventKind -v`
Expected: FAIL — undefined: `EventKind`.

- [ ] **Step 3: Implement `events.go`**

Names in `String()` match §14's list verbatim: `PieceMoved`, `PieceRotated`, `PieceHardDropped`, `PieceLocked`, `HoldUsed`, `LinesCleared`, `ComboChanged`, `LevelChanged`, `GameOver`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/game/ -run TestEventKind -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/game/events.go internal/game/events_test.go
git commit -m "feat(game): event vocabulary emitted by the engine"
```

---

### Task 8: Game state, spawning, and player movement

**Files:**
- Create: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces:

```go
type Game struct {
	Board   Board
	Active  Piece
	Hold    *PieceKind
	CanHold bool
	Next    []PieceKind
	Bag     Bag

	Score, Lines, Level, Combo int

	GravityAccumulator time.Duration
	LockAccumulator    time.Duration
	LockResets         int
	Grounded           bool
	Over               bool

	Seed int64
	rng  *rand.Rand
}

func New(seed int64) *Game
func (g *Game) MoveLeft() []Event
func (g *Game) MoveRight() []Event
func (g *Game) RotateCW() []Event
func (g *Game) RotateCCW() []Event
func (g *Game) Ghost() Piece
func (g *Game) Restart()
```

`New` seeds `rng` with `rand.New(rand.NewSource(seed))`, records `Seed`, fills `Next` to `NextQueueLen`, spawns the first piece, sets `Level = 1` and `CanHold = true`.

- [ ] **Step 1: Write the failing test**

```go
package game

import "testing"

func TestNewGameInitialState(t *testing.T) {
	g := New(99)
	if g.Level != 1 || g.Score != 0 || g.Lines != 0 || g.Combo != 0 {
		t.Errorf("stats = %d/%d/%d/%d, want level 1 and zeros", g.Level, g.Score, g.Lines, g.Combo)
	}
	if len(g.Next) != NextQueueLen {
		t.Errorf("len(Next) = %d, want %d", len(g.Next), NextQueueLen)
	}
	if g.Hold != nil || !g.CanHold {
		t.Error("a new game has no held piece and may hold")
	}
	if g.Over {
		t.Error("a new game is not over")
	}
	if g.Seed != 99 {
		t.Errorf("Seed = %d, want 99", g.Seed)
	}
	if !g.Board.Fits(g.Active) {
		t.Error("the first piece must fit on an empty board")
	}
}

func TestMoveLeftAndRightEmitPieceMoved(t *testing.T) {
	g := New(1)
	startX := g.Active.X
	evs := g.MoveLeft()
	if g.Active.X != startX-1 {
		t.Fatalf("X = %d, want %d", g.Active.X, startX-1)
	}
	if len(evs) != 1 || evs[0].Kind != EventPieceMoved {
		t.Fatalf("events = %v, want one PieceMoved", evs)
	}
	g.MoveRight()
	if g.Active.X != startX {
		t.Fatalf("X = %d after moving back, want %d", g.Active.X, startX)
	}
}

func TestBlockedMoveChangesNothingAndEmitsNothing(t *testing.T) {
	g := New(1)
	for i := 0; i < 20; i++ {
		g.MoveLeft()
	}
	before := g.Active
	if evs := g.MoveLeft(); len(evs) != 0 {
		t.Fatalf("blocked move emitted %v", evs)
	}
	if g.Active != before {
		t.Fatalf("blocked move changed the piece: %+v -> %+v", before, g.Active)
	}
}

func TestRotateEmitsPieceRotatedAndFailureEmitsNothing(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: T, Rotation: 0, X: 4, Y: 10}
	evs := g.RotateCW()
	if len(evs) != 1 || evs[0].Kind != EventPieceRotated {
		t.Fatalf("events = %v, want one PieceRotated", evs)
	}
	if g.Active.Rotation != 1 {
		t.Fatalf("Rotation = %d, want 1", g.Active.Rotation)
	}
	g.RotateCCW()
	if g.Active.Rotation != 0 {
		t.Fatalf("Rotation = %d after CCW, want 0", g.Active.Rotation)
	}
}

func TestGhostIsTheActivePieceAtItsLandingPosition(t *testing.T) {
	g := New(1)
	ghost := g.Ghost()
	if ghost.Kind != g.Active.Kind || ghost.Rotation != g.Active.Rotation || ghost.X != g.Active.X {
		t.Fatalf("ghost %+v does not match active %+v", ghost, g.Active)
	}
	if ghost.Y != g.Active.Y+DropDistance(&g.Board, g.Active) {
		t.Fatalf("ghost Y = %d, want landing row %d", ghost.Y, g.Active.Y+DropDistance(&g.Board, g.Active))
	}
	if !g.Board.Fits(ghost) {
		t.Fatal("the ghost position must fit")
	}
}

func TestRestartResetsEverythingAndReusesTheSeed(t *testing.T) {
	g := New(4242)
	g.Score, g.Lines, g.Level, g.Combo = 500, 12, 3, 4
	fillRow(&g.Board, 21, Cell(1))
	g.Over = true
	kind := T
	g.Hold = &kind
	g.Restart()
	if g.Score != 0 || g.Lines != 0 || g.Level != 1 || g.Combo != 0 || g.Over {
		t.Errorf("stats not reset: %+v", g)
	}
	if g.Hold != nil || !g.CanHold {
		t.Error("hold not reset")
	}
	if len(g.Board.CompleteRows()) != 0 || g.Board.At(0, 21) != Empty {
		t.Error("board not cleared")
	}
	fresh := New(4242)
	if g.Active.Kind != fresh.Active.Kind {
		t.Errorf("restart piece %v != fresh piece %v; restart must reuse the seed", g.Active.Kind, fresh.Active.Kind)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run 'TestNewGame|TestMove|TestBlockedMove|TestRotateEmits|TestGhost|TestRestart' -v`
Expected: FAIL — undefined: `New`.

- [ ] **Step 3: Implement `game.go`: `New`, `Restart`, `MoveLeft`, `MoveRight`, `RotateCW`, `RotateCCW`, `Ghost`, and unexported `spawnNext()`**

`spawnNext` pops `Next[0]`, refills the queue from `Bag` to `NextQueueLen`, sets `Active = Spawn(kind)`, resets `GravityAccumulator`, `LockAccumulator`, `LockResets`, and `Grounded`, and sets `CanHold = true`. Movement and rotation succeed only when the result `Fits`; a successful one while `Grounded` also resets the lock timer (Task 9 adds that call, so leave a single helper `noteGroundedAction()` here that Task 9 fills in — or implement it now: if `Grounded && LockResets < MaxLockResets`, zero `LockAccumulator` and increment `LockResets`). Every method returns `nil` when `g.Over`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/game/ -run 'TestNewGame|TestMove|TestBlockedMove|TestRotateEmits|TestGhost|TestRestart' -v`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game state, spawning, movement, rotation, ghost, restart"
```

---

### Task 9: Gravity, locking, line clears, and game over

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: Task 8's `Game`.
- Produces: `func (g *Game) Advance(dt time.Duration) []Event`, `func (g *Game) SoftDrop() []Event`, `func (g *Game) HardDrop() []Event`, `func (g *Game) lock() []Event`.

Advance is the only clock-facing method and it never calls `time.Now()` (§49.2). Its shape:

```text
Advance(dt):
  if Over: return nil
  Grounded = !Fits(Active moved down 1)
  if Grounded:
      LockAccumulator += dt
      if LockAccumulator >= LockDelay: return lock()
      return nil
  GravityAccumulator += dt
  for GravityAccumulator >= DropInterval(Level):
      GravityAccumulator -= DropInterval(Level)
      if Fits(Active moved down 1):
          Active.Y++; emit PieceMoved
      else:
          Grounded = true; LockAccumulator = 0; LockResets = 0; break
  return events
```

`lock()` is §12's pipeline: commit the piece cells as `Cell(Kind + 1)`, emit `PieceLocked`; find complete rows and if any, clear them, add `LineScore + ComboBonus`, add to `Lines`, bump `Combo`, emit `LinesCleared` and `ComboChanged`, and if `LevelForLines(Lines)` differs from `Level`, update it and emit `LevelChanged`; if none, reset `Combo` to 0 and emit `ComboChanged` only if it was non-zero. Then spawn the next piece; if it does not `Fit`, set `Over = true` and emit `GameOver`.

- [ ] **Step 1: Write the failing test**

```go
import "time"

func TestAdvanceDropsAfterOneInterval(t *testing.T) {
	g := New(1)
	startY := g.Active.Y
	if evs := g.Advance(DropInterval(1) - time.Millisecond); len(evs) != 0 || g.Active.Y != startY {
		t.Fatalf("piece moved before the interval elapsed: Y=%d evs=%v", g.Active.Y, evs)
	}
	evs := g.Advance(2 * time.Millisecond)
	if g.Active.Y != startY+1 {
		t.Fatalf("Y = %d, want %d", g.Active.Y, startY+1)
	}
	if len(evs) != 1 || evs[0].Kind != EventPieceMoved {
		t.Fatalf("events = %v, want one PieceMoved", evs)
	}
}

func TestAdvanceWithALargeDtDropsMultipleRowsWithoutSkippingTheFloor(t *testing.T) {
	g := New(1)
	evs := g.Advance(5 * time.Second) // ~6 intervals at level 1
	moves := 0
	for _, e := range evs {
		if e.Kind == EventPieceMoved {
			moves++
		}
	}
	if moves < 5 || moves > 7 {
		t.Fatalf("got %d moves from 5s at level 1, want ~6", moves)
	}
	if !g.Board.Fits(g.Active) {
		t.Fatal("piece must still fit after a large dt")
	}
	// A dt long enough to cross the whole board must not push the piece through
	// the floor, and must never leave it overlapping locked cells.
	g2 := New(1)
	g2.Advance(10 * time.Minute)
	if !g2.Board.Fits(g2.Active) {
		t.Fatal("piece must fit after an enormous dt")
	}
	if g2.Active.Y+DropDistance(&g2.Board, g2.Active) != g2.Active.Y && !g2.Grounded {
		t.Log("piece is mid-air but not grounded, which is fine")
	}
}

func TestAdvanceZeroDtChangesNothing(t *testing.T) {
	g := New(1)
	before := *g
	if evs := g.Advance(0); len(evs) != 0 {
		t.Fatalf("Advance(0) emitted %v", evs)
	}
	if g.Active != before.Active || g.GravityAccumulator != before.GravityAccumulator {
		t.Fatal("Advance(0) mutated state")
	}
}

func TestGroundedPieceLocksAfterLockDelay(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: O, X: 4, Y: Height - 2}
	if evs := g.Advance(LockDelay - time.Millisecond); len(evs) != 0 {
		t.Fatalf("locked too early: %v", evs)
	}
	evs := g.Advance(2 * time.Millisecond)
	kinds := map[EventKind]bool{}
	for _, e := range evs {
		kinds[e.Kind] = true
	}
	if !kinds[EventPieceLocked] {
		t.Fatalf("events = %v, want a PieceLocked", evs)
	}
	if g.Board.At(5, Height-1) == Empty {
		t.Fatal("locked cells were not committed to the board")
	}
}

func TestMovementWhileGroundedResetsLockTimerUpToTheCap(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: O, X: 4, Y: Height - 2}
	g.Advance(LockDelay - 10*time.Millisecond)
	g.MoveLeft()
	if g.LockAccumulator != 0 {
		t.Fatalf("LockAccumulator = %v after a grounded move, want 0", g.LockAccumulator)
	}
	if g.LockResets != 1 {
		t.Fatalf("LockResets = %d, want 1", g.LockResets)
	}
	for i := 0; i < MaxLockResets+5; i++ {
		g.Advance(10 * time.Millisecond)
		g.MoveRight()
		g.MoveLeft()
	}
	if g.LockResets > MaxLockResets {
		t.Fatalf("LockResets = %d, want it capped at %d", g.LockResets, MaxLockResets)
	}
	// With the cap reached, the piece must lock rather than stall forever.
	g.Advance(LockDelay + time.Millisecond)
	if !g.Grounded && g.Active.Y == Height-2 {
		t.Fatal("piece stalled past the reset cap")
	}
}

func TestSoftDropScoresOnePointPerCell(t *testing.T) {
	g := New(1)
	before := g.Active.Y
	g.SoftDrop()
	if g.Active.Y != before+1 {
		t.Fatalf("Y = %d, want %d", g.Active.Y, before+1)
	}
	if g.Score != SoftDropPoints {
		t.Fatalf("Score = %d, want %d", g.Score, SoftDropPoints)
	}
	g.Active = Piece{Kind: O, X: 4, Y: Height - 2}
	scoreBefore := g.Score
	g.SoftDrop() // grounded: no movement, no points
	if g.Score != scoreBefore {
		t.Fatalf("blocked soft drop scored %d points", g.Score-scoreBefore)
	}
}

func TestHardDropScoresTwoPerCellAndLocksImmediately(t *testing.T) {
	g := New(1)
	p := g.Active
	dist := DropDistance(&g.Board, p)
	evs := g.HardDrop()
	var dropped *Event
	for i := range evs {
		if evs[i].Kind == EventPieceHardDropped {
			dropped = &evs[i]
		}
	}
	if dropped == nil {
		t.Fatalf("events = %v, want a PieceHardDropped", evs)
	}
	if dropped.Distance != dist {
		t.Fatalf("Distance = %d, want %d", dropped.Distance, dist)
	}
	if g.Score != dist*HardDropPoints {
		t.Fatalf("Score = %d, want %d", g.Score, dist*HardDropPoints)
	}
	locked := false
	for _, e := range evs {
		if e.Kind == EventPieceLocked {
			locked = true
		}
	}
	if !locked {
		t.Fatal("a hard drop must lock the piece in the same call")
	}
	if g.Active.Kind == p.Kind && g.Active.Y == p.Y+dist {
		t.Fatal("a new piece should have spawned")
	}
}

func TestHardDropOnAGroundedPieceScoresZeroAndStillLocks(t *testing.T) {
	g := New(1)
	g.Active = Piece{Kind: O, X: 4, Y: Height - 2}
	evs := g.HardDrop()
	if g.Score != 0 {
		t.Fatalf("Score = %d, want 0 for a zero-distance hard drop", g.Score)
	}
	var sawDrop, sawLock bool
	for _, e := range evs {
		switch e.Kind {
		case EventPieceHardDropped:
			sawDrop = true
			if e.Distance != 0 {
				t.Errorf("Distance = %d, want 0", e.Distance)
			}
		case EventPieceLocked:
			sawLock = true
		}
	}
	if !sawDrop || !sawLock {
		t.Fatalf("events = %v, want both PieceHardDropped and PieceLocked", evs)
	}
}

func TestSingleLineClearScoresAndCountsLines(t *testing.T) {
	g := New(1)
	fillRow(&g.Board, Height-1, Cell(1))
	g.Board.Set(4, Height-1, Empty)
	g.Board.Set(5, Height-1, Empty)
	g.Active = Piece{Kind: O, X: 4, Y: Height - 2}
	evs := g.HardDrop()
	var cleared *Event
	for i := range evs {
		if evs[i].Kind == EventLinesCleared {
			cleared = &evs[i]
		}
	}
	if cleared == nil {
		t.Fatalf("events = %v, want LinesCleared", evs)
	}
	if len(cleared.Rows) != 1 || cleared.Rows[0] != Height-1 {
		t.Fatalf("Rows = %v, want [%d]", cleared.Rows, Height-1)
	}
	if g.Lines != 1 {
		t.Fatalf("Lines = %d, want 1", g.Lines)
	}
	if g.Score != 100 { // 100 x level 1, no combo bonus at combo 1
		t.Fatalf("Score = %d, want 100", g.Score)
	}
	if g.Combo != 1 {
		t.Fatalf("Combo = %d, want 1", g.Combo)
	}
}

func TestComboIncrementsThenResetsOnANonClearingPlacement(t *testing.T) {
	g := New(1)
	clearOneRow := func() {
		fillRow(&g.Board, Height-1, Cell(1))
		g.Board.Set(4, Height-1, Empty)
		g.Board.Set(5, Height-1, Empty)
		g.Active = Piece{Kind: O, X: 4, Y: Height - 2}
		g.HardDrop()
	}
	clearOneRow()
	scoreAfterFirst := g.Score
	clearOneRow()
	if g.Combo != 2 {
		t.Fatalf("Combo = %d, want 2", g.Combo)
	}
	// second clear: 100 base + 50 x (2-1) x level 1 = 150
	if g.Score-scoreAfterFirst != 150 {
		t.Fatalf("second clear scored %d, want 150", g.Score-scoreAfterFirst)
	}
	g.Active = Piece{Kind: O, X: 0, Y: 0}
	evs := g.HardDrop()
	if g.Combo != 0 {
		t.Fatalf("Combo = %d after a non-clearing placement, want 0", g.Combo)
	}
	var sawComboChanged bool
	for _, e := range evs {
		if e.Kind == EventComboChanged && e.Value == 0 {
			sawComboChanged = true
		}
	}
	if !sawComboChanged {
		t.Fatalf("events = %v, want ComboChanged with Value 0", evs)
	}
}

func TestFourLineClearScoresEightHundredTimesLevel(t *testing.T) {
	g := New(1)
	for y := Height - 4; y < Height; y++ {
		fillRow(&g.Board, y, Cell(1))
		g.Board.Set(0, y, Empty)
	}
	g.Active = Piece{Kind: I, Rotation: 1, X: -2, Y: Height - 4} // vertical I in column 0
	if !g.Board.Fits(g.Active) {
		t.Skip("adjust the I placement: precondition failed")
	}
	evs := g.HardDrop()
	for _, e := range evs {
		if e.Kind == EventLinesCleared && len(e.Rows) != 4 {
			t.Fatalf("Rows = %v, want 4 rows", e.Rows)
		}
	}
	if g.Lines != 4 {
		t.Fatalf("Lines = %d, want 4", g.Lines)
	}
	if g.Score < 800 {
		t.Fatalf("Score = %d, want at least 800", g.Score)
	}
}

func TestLevelRisesEveryTenLinesAndEmitsLevelChanged(t *testing.T) {
	g := New(1)
	g.Lines = 9
	fillRow(&g.Board, Height-1, Cell(1))
	g.Board.Set(4, Height-1, Empty)
	g.Board.Set(5, Height-1, Empty)
	g.Active = Piece{Kind: O, X: 4, Y: Height - 2}
	evs := g.HardDrop()
	if g.Level != 2 {
		t.Fatalf("Level = %d, want 2 at %d lines", g.Level, g.Lines)
	}
	for _, e := range evs {
		if e.Kind == EventLevelChanged {
			if e.Value != 2 {
				t.Fatalf("LevelChanged.Value = %d, want 2", e.Value)
			}
			return
		}
	}
	t.Fatalf("events = %v, want a LevelChanged", evs)
}

func TestBlockedSpawnEndsTheGame(t *testing.T) {
	g := New(1)
	for y := 0; y < Height; y++ {
		fillRow(&g.Board, y, Cell(1))
		g.Board.Set(0, y, Empty) // leave a column so the active piece can exist
	}
	g.Active = Piece{Kind: I, Rotation: 1, X: -2, Y: Height - 4}
	evs := g.HardDrop()
	if !g.Over {
		t.Fatal("a blocked spawn must set Over")
	}
	for _, e := range evs {
		if e.Kind == EventGameOver {
			return
		}
	}
	t.Fatalf("events = %v, want a GameOver", evs)
}

func TestNoInputMutatesAFinishedGame(t *testing.T) {
	g := New(1)
	g.Over = true
	before := *g
	for _, call := range []func() []Event{g.MoveLeft, g.MoveRight, g.RotateCW, g.RotateCCW, g.SoftDrop, g.HardDrop} {
		if evs := call(); len(evs) != 0 {
			t.Errorf("a call on a finished game emitted %v", evs)
		}
	}
	g.Advance(time.Second)
	if g.Active != before.Active || g.Score != before.Score || g.Board != before.Board {
		t.Fatal("a finished game was mutated")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -v`
Expected: FAIL — undefined: `Advance`, `SoftDrop`, `HardDrop`.

- [ ] **Step 3: Implement `Advance`, `SoftDrop`, `HardDrop`, and `lock` in `game.go`**

Follow the pseudocode and the `lock()` pipeline above. `SoftDrop` moves down one cell if it fits, adding `SoftDropPoints` and emitting `PieceMoved`; nothing otherwise. `HardDrop` computes `DropDistance`, adds `distance × HardDropPoints`, sets `Active.Y += distance`, emits `PieceHardDropped` with `Piece` set to the pre-drop piece and `Distance` set, then appends `lock()`'s events.

- [ ] **Step 4: Run the whole engine suite to verify it passes**

Run: `go test ./internal/game/ -v`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): gravity, lock delay, line clears, combo, level, game over"
```

---

### Task 10: Hold

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/hold_test.go`

**Interfaces:**
- Consumes: Task 9's `Game`.
- Produces: `func (g *Game) UseHold() []Event`.

- [ ] **Step 1: Write the failing test**

```go
package game

import "testing"

func TestFirstHoldStoresActiveAndSpawnsFromTheQueue(t *testing.T) {
	g := New(1)
	held := g.Active.Kind
	wantNext := g.Next[0]
	evs := g.UseHold()
	if g.Hold == nil || *g.Hold != held {
		t.Fatalf("Hold = %v, want %v", g.Hold, held)
	}
	if g.Active.Kind != wantNext {
		t.Fatalf("Active = %v, want the queue head %v", g.Active.Kind, wantNext)
	}
	if len(g.Next) != NextQueueLen {
		t.Fatalf("len(Next) = %d, want %d", len(g.Next), NextQueueLen)
	}
	if len(evs) != 1 || evs[0].Kind != EventHoldUsed {
		t.Fatalf("events = %v, want one HoldUsed", evs)
	}
}

func TestSecondHoldSwapsAndReturnsSpawnRotation(t *testing.T) {
	g := New(1)
	g.UseHold()
	g.RotateCW()
	g.MoveLeft()
	activeBefore := g.Active.Kind
	heldBefore := *g.Hold
	g.CanHold = true // allow a second swap for this test
	g.UseHold()
	if *g.Hold != activeBefore {
		t.Fatalf("Hold = %v, want %v", *g.Hold, activeBefore)
	}
	if g.Active.Kind != heldBefore {
		t.Fatalf("Active = %v, want %v", g.Active.Kind, heldBefore)
	}
	if g.Active != Spawn(heldBefore) {
		t.Fatalf("Active = %+v, want spawn state %+v", g.Active, Spawn(heldBefore))
	}
}

func TestSecondHoldBeforeLockIsBlocked(t *testing.T) {
	g := New(1)
	g.UseHold()
	if g.CanHold {
		t.Fatal("CanHold must be false right after a hold")
	}
	before := g.Active
	heldBefore := *g.Hold
	if evs := g.UseHold(); len(evs) != 0 {
		t.Fatalf("second hold emitted %v", evs)
	}
	if g.Active != before || *g.Hold != heldBefore {
		t.Fatal("a blocked hold changed state")
	}
}

func TestHoldIsRestoredAfterALock(t *testing.T) {
	g := New(1)
	g.UseHold()
	g.HardDrop()
	if !g.CanHold {
		t.Fatal("CanHold must be true again after the piece locks")
	}
}

func TestHoldOnAFinishedGameDoesNothing(t *testing.T) {
	g := New(1)
	g.Over = true
	if evs := g.UseHold(); len(evs) != 0 || g.Hold != nil {
		t.Fatalf("hold worked on a finished game: evs=%v hold=%v", evs, g.Hold)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/game/ -run TestHold -run 'TestFirstHold|TestSecondHold|TestHold' -v`
Expected: FAIL — undefined: `UseHold`.

- [ ] **Step 3: Implement `UseHold` in `game.go`**

Returns `nil` when `g.Over` or `!g.CanHold`. With an empty hold, store `Active.Kind` and spawn from the queue; otherwise swap, setting `Active = Spawn(previouslyHeld)`. Either way set `CanHold = false`, reset the gravity/lock accumulators and `LockResets`, and emit one `EventHoldUsed` whose `Piece` is the outgoing piece (Plan 2's quantum-storage effect needs to know what left).

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/game/ -run 'TestFirstHold|TestSecondHold|TestHold' -v`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/game/game.go internal/game/hold_test.go
git commit -m "feat(game): hold with one-use-per-piece rule"
```

---

### Task 11: Determinism replay test

**Files:**
- Test: `internal/game/determinism_test.go`

**Interfaces:**
- Consumes: the whole engine.
- Produces: nothing (test-only). This is §40's replay test and it is what makes §35 checkable.

- [ ] **Step 1: Write the failing test**

```go
package game

import (
	"reflect"
	"testing"
	"time"
)

type step struct {
	action string // "left","right","cw","ccw","soft","hard","hold",""
	dt     time.Duration
}

// canned is a fixed (input, dt) stream: the timing is an input, per §49.2.
var canned = []step{
	{"", 120 * time.Millisecond}, {"left", 0}, {"cw", 0}, {"", 300 * time.Millisecond},
	{"right", 0}, {"soft", 0}, {"hard", 0}, {"", 90 * time.Millisecond},
	{"hold", 0}, {"ccw", 0}, {"left", 0}, {"left", 0}, {"", 850 * time.Millisecond},
	{"hard", 0}, {"", 40 * time.Millisecond}, {"cw", 0}, {"hard", 0},
	{"hold", 0}, {"", 1200 * time.Millisecond}, {"right", 0}, {"hard", 0},
	{"", 2 * time.Second}, {"soft", 0}, {"soft", 0}, {"hard", 0},
	{"", 700 * time.Millisecond}, {"cw", 0}, {"cw", 0}, {"hard", 0},
}

func replay(seed int64) (*Game, []Event) {
	g := New(seed)
	var log []Event
	for _, s := range canned {
		if s.dt > 0 {
			log = append(log, g.Advance(s.dt)...)
		}
		switch s.action {
		case "left":
			log = append(log, g.MoveLeft()...)
		case "right":
			log = append(log, g.MoveRight()...)
		case "cw":
			log = append(log, g.RotateCW()...)
		case "ccw":
			log = append(log, g.RotateCCW()...)
		case "soft":
			log = append(log, g.SoftDrop()...)
		case "hard":
			log = append(log, g.HardDrop()...)
		case "hold":
			log = append(log, g.UseHold()...)
		}
	}
	return g, log
}

func TestSameSeedAndInputsReproduceTheSameState(t *testing.T) {
	a, logA := replay(8675309)
	b, logB := replay(8675309)
	if a.Board != b.Board {
		t.Error("boards diverged")
	}
	if a.Score != b.Score || a.Lines != b.Lines || a.Level != b.Level || a.Combo != b.Combo {
		t.Errorf("stats diverged: %d/%d/%d/%d vs %d/%d/%d/%d",
			a.Score, a.Lines, a.Level, a.Combo, b.Score, b.Lines, b.Level, b.Combo)
	}
	if a.Active != b.Active || !reflect.DeepEqual(a.Next, b.Next) {
		t.Error("active piece or next queue diverged")
	}
	if !reflect.DeepEqual(logA, logB) {
		t.Errorf("event logs diverged: %d vs %d events", len(logA), len(logB))
	}
}

func TestADifferentSeedProducesADifferentGame(t *testing.T) {
	a, _ := replay(8675309)
	b, _ := replay(11111)
	if a.Board == b.Board && a.Score == b.Score {
		t.Fatal("different seeds produced an identical game")
	}
}

func TestReplayActuallyExercisedTheGame(t *testing.T) {
	g, log := replay(8675309)
	if len(log) < 20 {
		t.Fatalf("only %d events; the canned stream is too weak to be evidence", len(log))
	}
	locks := 0
	for _, e := range log {
		if e.Kind == EventPieceLocked {
			locks++
		}
	}
	if locks < 5 {
		t.Fatalf("only %d locks; the canned stream should place several pieces", locks)
	}
	if g.Score == 0 {
		t.Fatal("replay scored nothing")
	}
}
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `go test ./internal/game/ -run 'TestSameSeed|TestADifferentSeed|TestReplayActually' -v`
Expected: PASS. If `TestReplayActuallyExercisedTheGame` fails, extend `canned` with more steps rather than weakening the assertion. (This task's test may pass first try, since Tasks 1–10 built the behavior; its job is to pin determinism against future changes.)

- [ ] **Step 3: Run the full engine suite with the race detector and repeated runs**

Run: `go test ./internal/game/ -race -count=3`
Expected: PASS. Repeated runs catch map-iteration order or unseeded-RNG leaks into game logic.

- [ ] **Step 4: Commit**

```bash
gofmt -l . && git add internal/game/determinism_test.go
git commit -m "test(game): canned replay pins seed and timing determinism"
```

---

### Task 12: Canvas, palette, and layout

**Files:**
- Create: `internal/render/canvas.go`, `internal/render/palette.go`, `internal/render/layout.go`
- Test: `internal/render/canvas_test.go`, `internal/render/layout_test.go`

**Interfaces:**
- Consumes: `game.PieceKind`.
- Produces:

```go
// canvas.go — the surface every render step paints onto.
type Canvas struct { W, H int /* unexported cells */ }
func NewCanvas(w, h int) *Canvas
func (c *Canvas) Set(x, y int, glyph rune, style lipgloss.Style)      // out-of-bounds is a no-op
func (c *Canvas) SetString(x, y int, s string, style lipgloss.Style)  // writes runes rightward, clipping
func (c *Canvas) Fill(glyph rune, style lipgloss.Style)
func (c *Canvas) Plain() string   // rows joined by "\n", no ANSI: the golden-test view
func (c *Canvas) String() string  // styled output

// palette.go
type Mode int
const (ModeFull Mode = iota; ModeReduced; ModeASCII)
type Glyphs struct { Block, Ghost, Empty string } // each exactly 2 columns wide
func GlyphsFor(m Mode) Glyphs
type Palette struct { Mode Mode }
func NewPalette(m Mode) Palette
func (p Palette) Piece(k game.PieceKind, active bool) lipgloss.Style
func (p Palette) Dim() lipgloss.Style
func (p Palette) Border() lipgloss.Style
func (p Palette) Accent() lipgloss.Style

// layout.go
type Rect struct { X, Y, W, H int }
func (r Rect) Empty() bool
type LayoutMode int
const (LayoutTooSmall LayoutMode = iota; LayoutSmall; LayoutMedium; LayoutWide)
type Layout struct {
	Mode           LayoutMode
	TermW, TermH   int
	Board          Rect // interior only: 20 cols x 20 rows
	Hold, Next, Stats, Mission, Controls, Title Rect
	NextCount      int
	ShowStatLabels bool
}
func Compute(termW, termH int) Layout
const MinWidth, MinHeight = 40, 24
```

Layout rules, which the golden tests in Task 16 then freeze:

| Mode | Requires | Board interior | Side panels | Extras |
|---|---|---|---|---|
| Wide | `w >= 64 && h >= 26` | 20×20, horizontally centered | HOLD + stats left, NEXT right | title row, mission row, controls row |
| Medium | `w >= 50 && h >= 24` | 20×20 | compact HUD column right (NEXT 5, stats, hold) | mission row if `h >= 25`, controls row |
| Small | `w >= 40 && h >= 24` | 20×20 | NEXT (3) beside the board, score value beside it | controls row; mission row only if `h >= 24 + 1`; no title; `ShowStatLabels=false` |
| TooSmall | anything less | zero Rect | zero Rects | — |

Height budget (§49.3 drop order — title goes first, then mission, then stat labels): board frame 22 rows and the controls row are mandatory (23 rows). NEXT never stacks above or below the board.

- [ ] **Step 1: Write the failing canvas test**

```go
package render

import (
	"strings"
	"testing"

	"charm.land/lipgloss/v2"
)

func TestCanvasStartsBlankAndPlainHasExactDimensions(t *testing.T) {
	c := NewCanvas(6, 3)
	rows := strings.Split(c.Plain(), "\n")
	if len(rows) != 3 {
		t.Fatalf("got %d rows, want 3", len(rows))
	}
	for i, r := range rows {
		if len([]rune(r)) != 6 {
			t.Errorf("row %d has %d runes, want 6", i, len([]rune(r)))
		}
		if strings.TrimSpace(r) != "" {
			t.Errorf("row %d is not blank: %q", i, r)
		}
	}
}

func TestCanvasSetAndSetStringPaintAtCoordinates(t *testing.T) {
	c := NewCanvas(8, 2)
	c.Set(0, 0, 'X', lipgloss.NewStyle())
	c.SetString(2, 1, "hey", lipgloss.NewStyle())
	rows := strings.Split(c.Plain(), "\n")
	if rows[0][0] != 'X' {
		t.Errorf("row 0 = %q, want X first", rows[0])
	}
	if !strings.HasPrefix(rows[1], "  hey") {
		t.Errorf("row 1 = %q, want \"  hey\" prefix", rows[1])
	}
}

func TestCanvasClipsInsteadOfPanicking(t *testing.T) {
	c := NewCanvas(4, 2)
	c.Set(-1, 0, 'A', lipgloss.NewStyle())
	c.Set(0, -5, 'B', lipgloss.NewStyle())
	c.Set(99, 99, 'C', lipgloss.NewStyle())
	c.SetString(2, 0, "overflowing", lipgloss.NewStyle())
	c.SetString(-3, 1, "left", lipgloss.NewStyle())
	rows := strings.Split(c.Plain(), "\n")
	for _, r := range rows {
		if len([]rune(r)) != 4 {
			t.Fatalf("clipping changed row width: %q", r)
		}
	}
	if strings.ContainsAny(c.Plain(), "ABC") {
		t.Error("out-of-bounds writes leaked into the canvas")
	}
}

func TestZeroSizedCanvasIsUsable(t *testing.T) {
	c := NewCanvas(0, 0)
	c.Set(0, 0, 'X', lipgloss.NewStyle())
	c.Fill('.', lipgloss.NewStyle())
	if got := c.Plain(); got != "" {
		t.Fatalf("Plain() = %q, want empty", got)
	}
	_ = c.String()
	neg := NewCanvas(-4, -2)
	if neg.W != 0 || neg.H != 0 {
		t.Fatalf("negative dimensions became %dx%d, want 0x0", neg.W, neg.H)
	}
}

func TestStringCarriesStylingAndPlainDoesNot(t *testing.T) {
	c := NewCanvas(3, 1)
	c.Set(1, 0, 'Q', lipgloss.NewStyle().Foreground(lipgloss.Color("201")))
	if strings.Contains(c.Plain(), "\x1b") {
		t.Error("Plain() must contain no ANSI escapes")
	}
	if !strings.Contains(c.String(), "Q") {
		t.Error("String() lost the glyph")
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/render/ -run TestCanvas -run 'TestCanvas|TestZeroSized|TestString' -v`
Expected: FAIL — undefined: `NewCanvas`.

- [ ] **Step 3: Implement `canvas.go` and `palette.go`**

`NewCanvas` clamps negative dimensions to 0 and allocates one `[]cell` of `w*h`. `String()` walks each row and coalesces runs of adjacent cells that share a style into a single `style.Render(run)` call, so a frame emits a handful of escape sequences per row instead of one per cell (§38). `Plain()` writes glyphs only. Blank cells hold `' '`.

`GlyphsFor`: `ModeFull` and `ModeReduced` give `Block: "██"`, `Ghost: "░░"`, `Empty: "  "`; `ModeASCII` gives `Block: "[]"`, `Ghost: "··"` → no: ASCII ghost is `".."`. Use §49.4's `··` for full/reduced-adjacent modes and, since `·` is not ASCII, `ModeASCII` uses `Ghost: ".."`. Record that refinement in a comment: §49.4's ASCII ghost `··` is non-ASCII, so ASCII mode uses `..`, which is the same two-column shape.

`Palette.Piece` colors from §26's neon space palette: I plasma cyan, J deep electric blue, L solar orange, O stellar gold, S alien green, T ultraviolet, Z supernova pink. `active` returns the same hue one step brighter (§49.4). `ModeReduced` returns 256-color equivalents; `ModeASCII` returns basic ANSI colors.

- [ ] **Step 4: Run it to verify it passes**

Run: `go test ./internal/render/ -run 'TestCanvas|TestZeroSized|TestString' -v`
Expected: PASS (5 tests).

- [ ] **Step 5: Write the failing layout test**

```go
package render

import "testing"

func TestComputeSelectsModesByTerminalSize(t *testing.T) {
	cases := []struct {
		w, h int
		want LayoutMode
	}{
		{100, 40, LayoutWide},
		{64, 26, LayoutWide},
		{63, 26, LayoutMedium},
		{50, 24, LayoutMedium},
		{49, 24, LayoutSmall},
		{40, 24, LayoutSmall},
		{39, 24, LayoutTooSmall},
		{40, 23, LayoutTooSmall},
	}
	for _, c := range cases {
		if got := Compute(c.w, c.h).Mode; got != c.want {
			t.Errorf("Compute(%d,%d).Mode = %v, want %v", c.w, c.h, got, c.want)
		}
	}
}

func TestBoardInteriorIsAlwaysTwentyByTwenty(t *testing.T) {
	for _, c := range [][2]int{{40, 24}, {50, 24}, {64, 26}, {120, 50}, {400, 120}} {
		l := Compute(c[0], c[1])
		if l.Board.W != 20 || l.Board.H != 20 {
			t.Errorf("Compute(%d,%d).Board = %dx%d, want 20x20", c[0], c[1], l.Board.W, l.Board.H)
		}
	}
}

func TestDegenerateSizesReturnTooSmallWithoutNegativeRects(t *testing.T) {
	for _, c := range [][2]int{{0, 0}, {1, 1}, {-5, -5}, {0, 40}, {40, 0}} {
		l := Compute(c[0], c[1])
		if l.Mode != LayoutTooSmall {
			t.Errorf("Compute(%d,%d).Mode = %v, want LayoutTooSmall", c[0], c[1], l.Mode)
		}
		for name, r := range map[string]Rect{
			"board": l.Board, "hold": l.Hold, "next": l.Next,
			"stats": l.Stats, "mission": l.Mission, "controls": l.Controls, "title": l.Title,
		} {
			if r.W < 0 || r.H < 0 {
				t.Errorf("Compute(%d,%d).%s = %+v has a negative dimension", c[0], c[1], name, r)
			}
		}
	}
}

func TestPanelsNeverOverlapTheBoardOrEachOther(t *testing.T) {
	for _, c := range [][2]int{{40, 24}, {50, 25}, {64, 26}, {100, 40}, {200, 60}} {
		l := Compute(c[0], c[1])
		rects := []struct {
			name string
			r    Rect
		}{
			{"board", Rect{l.Board.X - 1, l.Board.Y - 1, l.Board.W + 2, l.Board.H + 2}}, // include the frame
			{"hold", l.Hold}, {"next", l.Next}, {"stats", l.Stats},
			{"mission", l.Mission}, {"controls", l.Controls}, {"title", l.Title},
		}
		for i := 0; i < len(rects); i++ {
			for j := i + 1; j < len(rects); j++ {
				a, b := rects[i], rects[j]
				if a.r.Empty() || b.r.Empty() {
					continue
				}
				if a.r.X < b.r.X+b.r.W && b.r.X < a.r.X+a.r.W &&
					a.r.Y < b.r.Y+b.r.H && b.r.Y < a.r.Y+a.r.H {
					t.Errorf("at %dx%d, %s %+v overlaps %s %+v", c[0], c[1], a.name, a.r, b.name, b.r)
				}
			}
		}
	}
}

func TestEverythingFitsInsideTheTerminal(t *testing.T) {
	for _, c := range [][2]int{{40, 24}, {50, 24}, {64, 26}, {80, 30}, {400, 120}} {
		l := Compute(c[0], c[1])
		for name, r := range map[string]Rect{
			"board": l.Board, "hold": l.Hold, "next": l.Next, "stats": l.Stats,
			"mission": l.Mission, "controls": l.Controls, "title": l.Title,
		} {
			if r.Empty() {
				continue
			}
			if r.X < 0 || r.Y < 0 || r.X+r.W > c[0] || r.Y+r.H > c[1] {
				t.Errorf("at %dx%d, %s %+v escapes the terminal", c[0], c[1], name, r)
			}
		}
	}
}

func TestSmallModeDropOrderFollowsSection493(t *testing.T) {
	small := Compute(40, 24)
	if !small.Title.Empty() {
		t.Error("small mode must drop the title border first")
	}
	if small.ShowStatLabels {
		t.Error("small mode must drop stat labels")
	}
	if small.NextCount != 3 {
		t.Errorf("small NextCount = %d, want 3", small.NextCount)
	}
	if small.Controls.Empty() {
		t.Error("controls are one of the last two things standing")
	}
	wide := Compute(100, 40)
	if wide.NextCount != 5 {
		t.Errorf("wide NextCount = %d, want 5", wide.NextCount)
	}
	if !wide.ShowStatLabels || wide.Title.Empty() || wide.Mission.Empty() {
		t.Error("wide mode keeps title, mission, and stat labels")
	}
}

func TestNextIsBesideTheBoardNeverAboveOrBelow(t *testing.T) {
	for _, c := range [][2]int{{40, 24}, {50, 24}, {64, 26}, {120, 40}} {
		l := Compute(c[0], c[1])
		if l.Next.Empty() {
			t.Fatalf("at %dx%d NEXT is missing; §31 ranks it second", c[0], c[1])
		}
		if l.Next.X+l.Next.W <= l.Board.X || l.Next.X >= l.Board.X+l.Board.W {
			continue // beside the board: good
		}
		t.Errorf("at %dx%d NEXT %+v shares columns with the board %+v", c[0], c[1], l.Next, l.Board)
	}
}

func TestBoardIsCenteredInAVeryWideTerminal(t *testing.T) {
	l := Compute(400, 120)
	leftGap := l.Board.X
	rightGap := 400 - (l.Board.X + l.Board.W)
	if leftGap < 10 || rightGap < 10 {
		t.Fatalf("board not centered: gaps %d/%d", leftGap, rightGap)
	}
}
```

- [ ] **Step 6: Run it to verify it fails**

Run: `go test ./internal/render/ -run 'TestCompute|TestBoard|TestDegenerate|TestPanels|TestEverything|TestSmallMode|TestNextIs' -v`
Expected: FAIL — undefined: `Compute`.

- [ ] **Step 7: Implement `layout.go`**

Follow the mode table above. `Compute` returns `Layout{Mode: LayoutTooSmall, TermW: w, TermH: h}` with zero Rects whenever `w < MinWidth || h < MinHeight` (which also covers zero and negative input). In the other modes: reserve the mandatory rows first (board frame 22, controls 1), then add mission and title while rows remain, then center the whole block horizontally and vertically.

- [ ] **Step 8: Run it to verify it passes**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
gofmt -l . && git add internal/render/
git commit -m "feat(render): styled canvas, neon palette, responsive layout"
```

---

### Task 13: Board rendering

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: `Canvas`, `Palette`, `Glyphs`, `Layout` from Task 12; `game.Game`.
- Produces: `func DrawBoard(c *Canvas, g *game.Game, l Layout, p Palette)` — paints the frame, the locked cells, the ghost, and the active piece for the 20 visible rows.

`DrawBoard` reads `g` and never writes to it. Draw order is §37 steps 3–5 and 7: locked cells, then ghost, then active piece, then the border frame. Ghost cells are skipped wherever a locked cell or an active-piece cell already sits (§10: the ghost must never obscure locked blocks).

- [ ] **Step 1: Write the failing test**

```go
package render

import (
	"strings"
	"testing"

	"cosmic-tetris/internal/game"
)

func drawn(g *game.Game, w, h int, m Mode) []string {
	l := Compute(w, h)
	c := NewCanvas(w, h)
	DrawBoard(c, g, l, NewPalette(m))
	return strings.Split(c.Plain(), "\n")
}

func TestBoardFrameIsDrawnAtTheLayoutRect(t *testing.T) {
	g := game.New(1)
	l := Compute(100, 40)
	rows := drawn(g, 100, 40, ModeFull)
	top := []rune(rows[l.Board.Y-1])
	if top[l.Board.X-1] != '╔' {
		t.Errorf("top-left corner = %q, want ╔", top[l.Board.X-1])
	}
	if top[l.Board.X+l.Board.W] != '╗' {
		t.Errorf("top-right corner = %q, want ╗", top[l.Board.X+l.Board.W])
	}
	bottom := []rune(rows[l.Board.Y+l.Board.H])
	if bottom[l.Board.X-1] != '╚' || bottom[l.Board.X+l.Board.W] != '╝' {
		t.Error("bottom corners are wrong")
	}
	for y := l.Board.Y; y < l.Board.Y+l.Board.H; y++ {
		r := []rune(rows[y])
		if r[l.Board.X-1] != '║' || r[l.Board.X+l.Board.W] != '║' {
			t.Fatalf("row %d is missing its side walls: %q", y, rows[y])
		}
	}
}

func TestLockedCellsAppearAtTheRightPlace(t *testing.T) {
	g := game.New(1)
	g.Board.Set(0, game.Height-1, game.Cell(1)) // bottom-left visible cell
	l := Compute(100, 40)
	rows := drawn(g, 100, 40, ModeFull)
	bottomRow := []rune(rows[l.Board.Y+l.Board.H-1])
	got := string(bottomRow[l.Board.X : l.Board.X+2])
	if got != GlyphsFor(ModeFull).Block {
		t.Fatalf("bottom-left cell = %q, want %q", got, GlyphsFor(ModeFull).Block)
	}
}

func TestHiddenRowsAreNotRendered(t *testing.T) {
	g := game.New(1)
	g.Board.Set(0, 0, game.Cell(1)) // hidden spawn row
	g.Board.Set(0, 1, game.Cell(1))
	g.Active = game.Piece{Kind: game.O, X: 8, Y: game.Height - 2}
	l := Compute(100, 40)
	rows := drawn(g, 100, 40, ModeFull)
	firstVisible := []rune(rows[l.Board.Y])
	if string(firstVisible[l.Board.X:l.Board.X+2]) == GlyphsFor(ModeFull).Block {
		t.Fatal("a hidden-row cell leaked into the first visible row")
	}
}

func TestGhostIsDrawnBelowTheActivePiece(t *testing.T) {
	g := game.New(1)
	g.Active = game.Piece{Kind: game.O, X: 4, Y: 5}
	rows := drawn(g, 100, 40, ModeFull)
	joined := strings.Join(rows, "\n")
	if !strings.Contains(joined, GlyphsFor(ModeFull).Ghost) {
		t.Fatal("no ghost glyphs rendered")
	}
	l := Compute(100, 40)
	// the ghost sits on the floor row, the active piece does not
	floor := []rune(rows[l.Board.Y+l.Board.H-1])
	if string(floor[l.Board.X+8:l.Board.X+10]) == GlyphsFor(ModeFull).Empty {
		t.Log("ghost column depends on the piece; assert only that ghosts exist")
	}
}

func TestGhostNeverOverwritesLockedOrActiveCells(t *testing.T) {
	g := game.New(1)
	g.Active = game.Piece{Kind: game.O, X: 4, Y: game.Height - 2} // grounded: ghost == active
	for x := 0; x < game.Width; x++ {
		g.Board.Set(x, game.Height-1, game.Cell(3))
	}
	g.Board.Set(5, game.Height-1, game.Empty)
	g.Board.Set(6, game.Height-1, game.Empty)
	rows := drawn(g, 100, 40, ModeFull)
	l := Compute(100, 40)
	bottom := []rune(rows[l.Board.Y+l.Board.H-1])
	for x := 0; x < game.Width; x++ {
		cell := string(bottom[l.Board.X+x*2 : l.Board.X+x*2+2])
		if cell == GlyphsFor(ModeFull).Ghost {
			t.Fatalf("ghost glyph drawn over an occupied cell at column %d", x)
		}
	}
}

func TestAsciiModeEmitsOnlyAsciiForTheBoardBody(t *testing.T) {
	g := game.New(1)
	g.Board.Set(3, game.Height-1, game.Cell(2))
	l := Compute(100, 40)
	c := NewCanvas(100, 40)
	DrawBoard(c, g, l, NewPalette(ModeASCII))
	rows := strings.Split(c.Plain(), "\n")
	for y := l.Board.Y; y < l.Board.Y+l.Board.H; y++ {
		body := string([]rune(rows[y])[l.Board.X : l.Board.X+l.Board.W])
		for _, r := range body {
			if r > 127 {
				t.Fatalf("row %d contains non-ASCII rune %q in ASCII mode", y, r)
			}
		}
	}
}

func TestDrawBoardDoesNotMutateGameState(t *testing.T) {
	g := game.New(7)
	before := *g
	c := NewCanvas(100, 40)
	DrawBoard(c, g, Compute(100, 40), NewPalette(ModeFull))
	if g.Board != before.Board || g.Active != before.Active || g.Score != before.Score {
		t.Fatal("DrawBoard mutated the game")
	}
}

func TestDrawBoardOnATooSmallLayoutIsANoOp(t *testing.T) {
	g := game.New(1)
	c := NewCanvas(20, 10)
	DrawBoard(c, g, Compute(20, 10), NewPalette(ModeFull))
	if strings.TrimSpace(c.Plain()) != "" {
		t.Fatal("DrawBoard painted something on a too-small layout")
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/render/ -run 'TestBoardFrame|TestLocked|TestHidden|TestGhost|TestAscii|TestDrawBoard' -v`
Expected: FAIL — undefined: `DrawBoard`.

- [ ] **Step 3: Implement `DrawBoard` in `board.go`**

Visible row `y` of the board maps to canvas row `l.Board.Y + (y - game.HiddenRows)`; board column `x` maps to canvas column `l.Board.X + x*2`. Frame runes: `╔ ═ ╗ ║ ╚ ╝` (ASCII mode: `+ - + | + +`). Return immediately when `l.Mode == LayoutTooSmall`.

- [ ] **Step 4: Run it to verify it passes**

Run: `go test ./internal/render/ -run 'TestBoardFrame|TestLocked|TestHidden|TestGhost|TestAscii|TestDrawBoard' -v`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): board frame, locked cells, ghost, active piece"
```

---

### Task 14: HUD and overlays

**Files:**
- Create: `internal/render/hud.go`
- Test: `internal/render/hud_test.go`

**Interfaces:**
- Consumes: Tasks 12–13.
- Produces: `func DrawHUD(c *Canvas, g *game.Game, l Layout, p Palette)` (HOLD, NEXT, stats, controls, and the title when the layout keeps them), `func DrawMission(c *Canvas, text string, l Layout, p Palette)`, `func DrawOverlay(c *Canvas, lines []string, l Layout, p Palette)` (centered bordered panel), `func TooSmallNotice(termW, termH int) string`.

Copy fixed by the spec: the controls line is `←→ move   ↑ rotate   ↓ descend   SPACE YEET   C hold   ? help` (§4). Stat labels are `SCORE`, `LINES`, `LEVEL` (§4). Score renders zero-padded to 8 digits (`00129340`), lines to 3 (`042`), level to 2 (`07`). The title reads `✦ COSMIC TETRIS` with `LOCAL UNIVERSE <4 hex digits of the seed, uppercase>` on the right (§4). `TooSmallNotice` renders §31's text verbatim:

```text
THIS UNIVERSE IS TOO SMALL

resize terminal to continue

current: 34 × 19
needed: approximately 40 × 24
```

- [ ] **Step 1: Write the failing test**

```go
package render

import (
	"strings"
	"testing"

	"cosmic-tetris/internal/game"
)

func hudPlain(g *game.Game, w, h int, m Mode) string {
	l := Compute(w, h)
	c := NewCanvas(w, h)
	DrawHUD(c, g, l, NewPalette(m))
	return c.Plain()
}

func TestWideHudShowsLabelsAndZeroPaddedStats(t *testing.T) {
	g := game.New(0x7F3A)
	g.Score, g.Lines, g.Level = 129340, 42, 7
	out := hudPlain(g, 100, 40, ModeFull)
	for _, want := range []string{"SCORE", "00129340", "LINES", "042", "LEVEL", "07", "HOLD", "NEXT"} {
		if !strings.Contains(out, want) {
			t.Errorf("wide HUD missing %q", want)
		}
	}
}

func TestControlsLineIsPresent(t *testing.T) {
	g := game.New(1)
	out := hudPlain(g, 100, 40, ModeFull)
	for _, want := range []string{"move", "rotate", "YEET", "hold", "help"} {
		if !strings.Contains(out, want) {
			t.Errorf("controls line missing %q", want)
		}
	}
}

func TestTitleCarriesTheSeedAsHex(t *testing.T) {
	g := game.New(0x7F3A)
	out := hudPlain(g, 100, 40, ModeFull)
	if !strings.Contains(out, "COSMIC TETRIS") {
		t.Error("title missing")
	}
	if !strings.Contains(out, "7F3A") {
		t.Errorf("title missing the universe id 7F3A:\n%s", out)
	}
}

func TestSmallHudDropsLabelsButKeepsValues(t *testing.T) {
	g := game.New(1)
	g.Score, g.Lines = 4200, 42
	out := hudPlain(g, 40, 24, ModeFull)
	if strings.Contains(out, "LINES") || strings.Contains(out, "SCORE") {
		t.Errorf("small HUD kept a stat label:\n%s", out)
	}
	if !strings.Contains(out, "00004200") {
		t.Errorf("small HUD dropped the score value:\n%s", out)
	}
}

func TestNextQueueShowsFiveWideAndThreeSmall(t *testing.T) {
	countPieces := func(w, h int) int {
		g := game.New(1)
		l := Compute(w, h)
		c := NewCanvas(w, h)
		DrawHUD(c, g, l, NewPalette(ModeFull))
		rows := strings.Split(c.Plain(), "\n")
		blocks := 0
		for y := l.Next.Y; y < l.Next.Y+l.Next.H && y < len(rows); y++ {
			blocks += strings.Count(string([]rune(rows[y])[l.Next.X:min(l.Next.X+l.Next.W, len([]rune(rows[y])))]), GlyphsFor(ModeFull).Block)
		}
		return blocks
	}
	wide := countPieces(100, 40)
	small := countPieces(40, 24)
	if wide < 5*4 {
		t.Errorf("wide NEXT drew %d block glyphs, want at least %d (5 pieces x 4 cells)", wide, 5*4)
	}
	if small >= wide {
		t.Errorf("small NEXT drew %d glyphs, wide drew %d; small should show fewer pieces", small, wide)
	}
}

func TestHeldPieceIsRenderedWhenSet(t *testing.T) {
	g := game.New(1)
	out := hudPlain(g, 100, 40, ModeFull)
	emptyHold := strings.Count(out, GlyphsFor(ModeFull).Block)
	g.UseHold()
	withHold := strings.Count(hudPlain(g, 100, 40, ModeFull), GlyphsFor(ModeFull).Block)
	if withHold <= emptyHold {
		t.Fatalf("holding a piece did not add glyphs (%d -> %d)", emptyHold, withHold)
	}
}

func TestMissionLineIsClippedToItsRect(t *testing.T) {
	g := game.New(1)
	l := Compute(100, 40)
	c := NewCanvas(100, 40)
	long := strings.Repeat("WE HAVE EXCEEDED THE RECOMMENDED NUMBER OF BLOCKS ", 10)
	DrawMission(c, long, l, NewPalette(ModeFull))
	rows := strings.Split(c.Plain(), "\n")
	for i, r := range rows {
		if len([]rune(r)) != 100 {
			t.Fatalf("row %d is %d runes wide, want 100", i, len([]rune(r)))
		}
	}
	for y := 0; y < 40; y++ {
		if y == l.Mission.Y {
			continue
		}
		if strings.Contains(rows[y], "EXCEEDED") {
			t.Fatalf("mission text leaked onto row %d", y)
		}
	}
	_ = g
}

func TestOverlayIsCenteredAndBordered(t *testing.T) {
	l := Compute(100, 40)
	c := NewCanvas(100, 40)
	DrawOverlay(c, []string{"TEMPORAL SUSPENSION", "", "SPACE IS PAUSED", "", "p  resume"}, l, NewPalette(ModeFull))
	out := c.Plain()
	if !strings.Contains(out, "TEMPORAL SUSPENSION") || !strings.Contains(out, "p  resume") {
		t.Fatal("overlay content missing")
	}
	if !strings.ContainsAny(out, "╭╮╰╯│─") {
		t.Fatal("overlay has no border")
	}
	rows := strings.Split(out, "\n")
	for i, r := range rows {
		if len([]rune(r)) != 100 {
			t.Fatalf("overlay changed row %d width to %d", i, len([]rune(r)))
		}
	}
}

func TestTooSmallNoticeReportsBothSizes(t *testing.T) {
	out := TooSmallNotice(34, 19)
	for _, want := range []string{"THIS UNIVERSE IS TOO SMALL", "resize terminal to continue", "34", "19", "40", "24"} {
		if !strings.Contains(out, want) {
			t.Errorf("notice missing %q:\n%s", want, out)
		}
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/render/ -run 'TestWideHud|TestControls|TestTitle|TestSmallHud|TestNextQueue|TestHeld|TestMission|TestOverlay|TestTooSmall' -v`
Expected: FAIL — undefined: `DrawHUD`.

- [ ] **Step 3: Implement `hud.go`**

Each panel paints inside its `Rect` and clips at the rect edges — never past them. Mini-piece previews for HOLD and NEXT draw `Shape(kind, 0)` into a 4×2-row cell block, using the piece's own color. Zero-width or empty Rects are skipped.

- [ ] **Step 4: Run it to verify it passes**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/render/hud.go internal/render/hud_test.go
git commit -m "feat(render): HUD panels, mission line, overlays, too-small notice"
```

---

### Task 15: The frame pipeline

**Files:**
- Create: `internal/render/render.go`
- Test: `internal/render/render_test.go`

**Interfaces:**
- Consumes: Tasks 12–14.
- Produces:

```go
type Scene struct {
	Game     *game.Game
	Mode     Mode
	Width    int
	Height   int
	Paused   bool
	Overlay  []string // non-nil draws a centered panel over everything
	Mission  string
}
func Frame(s Scene) string
```

`Frame` is §37's pipeline minus the FX steps, which Plan 2 inserts: compute layout → too-small short-circuit → board → HUD → mission → overlay. Plan 2 will extend `Scene` with an `*fx.World` and add the composite steps; keeping the pipeline in one function is what makes that a small change.

- [ ] **Step 1: Write the failing test**

```go
package render

import (
	"strings"
	"testing"

	"cosmic-tetris/internal/game"
)

func TestFrameOutputHasExactTerminalDimensions(t *testing.T) {
	for _, c := range [][2]int{{40, 24}, {50, 25}, {80, 30}, {200, 60}} {
		out := Frame(Scene{Game: game.New(1), Mode: ModeFull, Width: c[0], Height: c[1]})
		rows := strings.Split(stripANSI(out), "\n")
		if len(rows) != c[1] {
			t.Errorf("at %dx%d got %d rows, want %d", c[0], c[1], len(rows), c[1])
		}
		for i, r := range rows {
			if len([]rune(r)) != c[0] {
				t.Errorf("at %dx%d row %d is %d runes, want %d", c[0], c[1], i, len([]rune(r)), c[0])
			}
		}
	}
}

func TestFrameShowsTheTooSmallNoticeBelowMinimum(t *testing.T) {
	out := stripANSI(Frame(Scene{Game: game.New(1), Mode: ModeFull, Width: 34, Height: 19}))
	if !strings.Contains(out, "THIS UNIVERSE IS TOO SMALL") {
		t.Fatalf("expected the too-small notice, got:\n%s", out)
	}
	if strings.Contains(out, "╔") {
		t.Error("the board should not render below the minimum size")
	}
}

func TestFrameNeverPanicsAcrossASweepOfSizes(t *testing.T) {
	g := game.New(3)
	for w := 0; w <= 90; w++ {
		for h := 0; h <= 40; h++ {
			func() {
				defer func() {
					if r := recover(); r != nil {
						t.Fatalf("Frame panicked at %dx%d: %v", w, h, r)
					}
				}()
				Frame(Scene{Game: g, Mode: ModeFull, Width: w, Height: h})
			}()
		}
	}
}

func TestFrameDoesNotMutateTheGame(t *testing.T) {
	g := game.New(5)
	before := *g
	Frame(Scene{Game: g, Mode: ModeFull, Width: 80, Height: 30, Mission: "NOMINALISH"})
	if g.Board != before.Board || g.Active != before.Active || g.Score != before.Score || g.Level != before.Level {
		t.Fatal("Frame mutated the game")
	}
}

func TestOverlayDrawsOverTheBoard(t *testing.T) {
	out := stripANSI(Frame(Scene{
		Game: game.New(1), Mode: ModeFull, Width: 80, Height: 30,
		Overlay: []string{"TEMPORAL SUSPENSION", "SPACE IS PAUSED", "p  resume"},
	}))
	if !strings.Contains(out, "TEMPORAL SUSPENSION") {
		t.Fatal("overlay not rendered")
	}
}

func TestAsciiModeFrameIsEntirelyAscii(t *testing.T) {
	out := stripANSI(Frame(Scene{Game: game.New(1), Mode: ModeASCII, Width: 80, Height: 30, Mission: "NOMINALISH"}))
	for _, r := range out {
		if r > 127 && r != '\n' {
			t.Fatalf("non-ASCII rune %q in ASCII-mode frame", r)
		}
	}
}
```

- [ ] **Step 2: Add the ANSI stripper the golden tests need**

Create `internal/render/strip_test.go` with `func stripANSI(s string) string` that removes CSI sequences (`\x1b[` … final byte in `@`–`~`). Keep it in a `_test.go` file: it is test infrastructure, not product code.

- [ ] **Step 3: Run the test to verify it fails**

Run: `go test ./internal/render/ -run 'TestFrame|TestOverlayDraws|TestAsciiModeFrame' -v`
Expected: FAIL — undefined: `Frame`, `Scene`.

- [ ] **Step 4: Implement `Frame` in `render.go`**

When `Compute` returns `LayoutTooSmall`, paint `TooSmallNotice(s.Width, s.Height)` centered on a blank canvas and return that. Otherwise run the pipeline in order and return `c.String()`. Every returned string has exactly `s.Height` rows of exactly `s.Width` columns (0-sized terminals return `""`).

- [ ] **Step 5: Run it to verify it passes**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
gofmt -l . && git add internal/render/render.go internal/render/render_test.go internal/render/strip_test.go
git commit -m "feat(render): frame pipeline with too-small and overlay handling"
```

---

### Task 16: Bubble Tea app, keys, and CLI

**Files:**
- Create: `internal/app/keys.go`, `internal/app/messages.go`, `internal/app/model.go`, `internal/app/update.go`, `cmd/cosmic-tetris/main.go`
- Test: `internal/app/update_test.go`

**Interfaces:**
- Consumes: `game` and `render`.
- Produces:

```go
// messages.go
type FrameMsg struct{ Now time.Time }
const FrameInterval = 16 * time.Millisecond // ~60 Hz (§36)
const MaxFrameDt = 100 * time.Millisecond   // stall clamp (Review Focus 1)
func Tick() tea.Cmd

// keys.go
type KeyMap struct {
	Left, Right, SoftDrop, RotateCW, RotateCCW, HardDrop, Hold, Pause, Restart, Help, Quit key.Binding
}
func DefaultKeyMap() KeyMap
func (k KeyMap) ShortHelp() []key.Binding
func (k KeyMap) FullHelp() [][]key.Binding

// model.go
type AppState int
const (StatePlaying AppState = iota; StatePaused; StateGameOver)
type Options struct {
	Seed          int64
	Mode          render.Mode
	NoFX          bool
	ReducedMotion bool
}
type Model struct {
	Game      *game.Game
	Width     int
	Height    int
	State     AppState
	ShowHelp  bool
	LastFrame time.Time
	Keys      KeyMap
	Opts      Options
}
func New(opts Options) Model
func (m Model) Init() tea.Cmd
func (m Model) View() string

// update.go
func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd)
```

`Model.Game` is a pointer, not §34's value field: a `Game` holds a `*rand.Rand`, so copying the struct on every `Update` would share RNG state across copies and make ownership ambiguous. `GravityMsg` from §36 is deliberately absent — §36 also says to prefer one animation clock, so gravity advances from `FrameMsg`'s `dt` (§49.2).

Key repeat for held left/right comes from terminal auto-repeat: each repeat arrives as its own `tea.KeyMsg` and is applied the moment it arrives, so input never waits for a tick (§8, §36).

- [ ] **Step 1: Write the failing test**

```go
package app

import (
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"
	"cosmic-tetris/internal/game"
	"cosmic-tetris/internal/render"
)

func keyMsg(s string) tea.KeyMsg { return tea.KeyPressMsg{Code: rune(s[0]), Text: s} }

func newModel() Model { return New(Options{Seed: 1, Mode: render.ModeFull}) }

func TestArrowAndViKeysMovePieceImmediately(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	startX := m.Game.Active.X
	next, _ := m.Update(keyMsg("h"))
	m = next.(Model)
	if m.Game.Active.X != startX-1 {
		t.Fatalf("X = %d after 'h', want %d", m.Game.Active.X, startX-1)
	}
	next, _ = m.Update(keyMsg("l"))
	m = next.(Model)
	if m.Game.Active.X != startX {
		t.Fatalf("X = %d after 'l', want %d", m.Game.Active.X, startX)
	}
}

func TestSpaceHardDropsAndKeysWorkWithoutAnyTick(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	kind := m.Game.Active.Kind
	next, _ := m.Update(tea.KeyPressMsg{Code: ' ', Text: " "})
	m = next.(Model)
	if m.Game.Score == 0 && m.Game.Active.Kind == kind {
		t.Fatal("space did not hard drop")
	}
}

func TestPauseTogglesStateAndFreezesGravity(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	next, _ := m.Update(keyMsg("p"))
	m = next.(Model)
	if m.State != StatePaused {
		t.Fatalf("State = %v, want StatePaused", m.State)
	}
	beforeY := m.Game.Active.Y
	m.LastFrame = time.Now().Add(-2 * time.Second)
	next, _ = m.Update(FrameMsg{Now: time.Now()})
	m = next.(Model)
	if m.Game.Active.Y != beforeY {
		t.Fatal("gravity ran while paused")
	}
	next, _ = m.Update(keyMsg("p"))
	if next.(Model).State != StatePlaying {
		t.Fatal("p did not resume")
	}
}

func TestMovementKeysAreIgnoredWhilePaused(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	next, _ := m.Update(keyMsg("p"))
	m = next.(Model)
	before := *m.Game
	for _, k := range []string{"h", "l", "j", "x", "z", "c", " "} {
		next, _ = m.Update(keyMsg(k))
		m = next.(Model)
	}
	if m.Game.Active != before.Active || m.Game.Score != before.Score || m.Game.Board != before.Board {
		t.Fatal("a key mutated the game while paused")
	}
}

func TestKeysAreIgnoredAfterGameOver(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	m.Game.Over = true
	m.State = StateGameOver
	before := *m.Game
	for _, k := range []string{"h", "l", "j", "x", "z", "c", " "} {
		next, _ := m.Update(keyMsg(k))
		m = next.(Model)
	}
	if m.Game.Active != before.Active || m.Game.Score != before.Score {
		t.Fatal("a key mutated a finished game")
	}
}

func TestRestartWorksFromPlayingAndGameOver(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	m.Update(keyMsg(" "))
	m.State = StateGameOver
	m.Game.Over = true
	next, _ := m.Update(keyMsg("r"))
	m = next.(Model)
	if m.State != StatePlaying || m.Game.Over || m.Game.Score != 0 {
		t.Fatalf("restart left State=%v Over=%v Score=%d", m.State, m.Game.Over, m.Game.Score)
	}
}

func TestGameOverTransitionsStateOnItsOwn(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	for y := 0; y < game.Height; y++ {
		for x := 0; x < game.Width; x++ {
			if x != 0 {
				m.Game.Board.Set(x, y, game.Cell(1))
			}
		}
	}
	m.Game.Active = game.Piece{Kind: game.I, Rotation: 1, X: -2, Y: game.Height - 4}
	next, _ := m.Update(tea.KeyPressMsg{Code: ' ', Text: " "})
	m = next.(Model)
	if m.State != StateGameOver {
		t.Fatalf("State = %v after a fatal placement, want StateGameOver", m.State)
	}
}

func TestFrameDtIsClampedSoAStallDoesNotAvalanche(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	m.Game.Level = 15
	startY := m.Game.Active.Y
	m.LastFrame = time.Now().Add(-30 * time.Second) // a long suspend
	next, _ := m.Update(FrameMsg{Now: time.Now()})
	m = next.(Model)
	maxRows := int(MaxFrameDt/game.DropInterval(15)) + 1
	if m.Game.Active.Y-startY > maxRows && !m.Game.Over {
		t.Fatalf("piece fell %d rows from one stalled frame; clamp allows at most %d",
			m.Game.Active.Y-startY, maxRows)
	}
}

func TestFrameAdvancesGravityOverTime(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	startY := m.Game.Active.Y
	now := time.Now()
	for i := 0; i < 80; i++ { // 80 x 16ms ~ 1.28s: at least one drop at level 1
		m.LastFrame = now
		now = now.Add(16 * time.Millisecond)
		next, _ := m.Update(FrameMsg{Now: now})
		m = next.(Model)
	}
	if m.Game.Active.Y <= startY {
		t.Fatalf("Y = %d after ~1.3s, want more than %d", m.Game.Active.Y, startY)
	}
}

func TestResizeIsStoredAndDegenerateSizesDoNotPanic(t *testing.T) {
	m := newModel()
	for _, s := range []tea.WindowSizeMsg{{Width: 80, Height: 30}, {Width: 0, Height: 0}, {Width: 1, Height: 1}, {Width: 400, Height: 120}} {
		next, _ := m.Update(s)
		m = next.(Model)
		if m.Width != s.Width || m.Height != s.Height {
			t.Fatalf("size not stored: got %dx%d want %dx%d", m.Width, m.Height, s.Width, s.Height)
		}
		if got := m.View(); got == "" && s.Width > 0 {
			t.Fatalf("View() empty at %dx%d", s.Width, s.Height)
		}
	}
}

func TestHelpTogglesAndQuitReturnsQuitCmd(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	next, _ := m.Update(keyMsg("?"))
	m = next.(Model)
	if !m.ShowHelp {
		t.Error("? did not open help")
	}
	next, _ = m.Update(keyMsg("?"))
	if next.(Model).ShowHelp {
		t.Error("? did not close help")
	}
	_, cmd := m.Update(keyMsg("q"))
	if cmd == nil {
		t.Fatal("q must return a command (tea.Quit)")
	}
}

func TestPausedViewShowsTheSuspensionOverlay(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	next, _ := m.Update(keyMsg("p"))
	m = next.(Model)
	if got := m.View(); !contains(got, "TEMPORAL SUSPENSION") {
		t.Fatalf("paused view lacks the overlay:\n%s", got)
	}
}

func TestGameOverViewShowsScoreAndOptions(t *testing.T) {
	m := newModel()
	m.Width, m.Height = 80, 30
	m.Game.Score, m.Game.Lines, m.Game.Level = 483200, 127, 13
	m.State = StateGameOver
	out := m.View()
	for _, want := range []string{"UNIVERSE EXPIRED", "483", "127", "13", "REBOOT UNIVERSE"} {
		if !contains(out, want) {
			t.Errorf("game-over view missing %q", want)
		}
	}
}
```

Add a small `contains` helper in the test file that strips ANSI before calling `strings.Contains` (reuse the same CSI-stripping logic as `render`'s test helper).

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/app/ -v`
Expected: FAIL — undefined: `New`, `Model`, `FrameMsg`.

- [ ] **Step 3: Implement `keys.go` and `messages.go`**

Bindings per §8, including the WASD aliases: Left `left`/`h`/`a`, Right `right`/`l`/`d`, SoftDrop `down`/`j`/`s`, RotateCW `up`/`k`/`x`/`w`, RotateCCW `z`, HardDrop `space`, Hold `c`, Pause `p`, Restart `r`, Help `?`, Quit `q`/`esc`. Help text per §39's flight-manual wording. `Tick()` returns `tea.Tick(FrameInterval, func(t time.Time) tea.Msg { return FrameMsg{Now: t} })`.

- [ ] **Step 4: Implement `model.go` and `update.go`**

`Init` returns `Tick()`. `Update` handles: `tea.WindowSizeMsg` (store dimensions); `FrameMsg` (compute `dt = msg.Now.Sub(m.LastFrame)`, clamp to `MaxFrameDt`, clamp negatives to 0, set `LastFrame`, and — only when `State == StatePlaying` — call `m.Game.Advance(dt)`; if the game reports `Over`, set `StateGameOver`; always return `Tick()`); `tea.KeyMsg` (Quit always; Restart always; Help always; Pause when playing or paused; everything else only when `State == StatePlaying`, and after each call check `m.Game.Over`).

`View` builds a `render.Scene`: `Overlay` is §30's pause panel when paused, §39's flight manual when `ShowHelp`, and §28's final panel when `StateGameOver` (`UNIVERSE EXPIRED`, comma-grouped score, lines, level, `r REBOOT UNIVERSE`, `q ACCEPT COSMIC DEATH`). Help wins over pause when both apply.

- [ ] **Step 5: Run it to verify it passes**

Run: `go test ./internal/app/ -v`
Expected: PASS.

- [ ] **Step 6: Implement `cmd/cosmic-tetris/main.go`**

Parse with `flag`: `--seed int64` (default: a time-derived value, the one place a clock is legitimate), `--ascii`, `--no-fx`, `--reduced-motion`, and `flag.Usage` copy naming all five (§49.5). Build `app.Options`, then `tea.NewProgram(app.New(opts), tea.WithAltScreen())` and `Run()`. Exit non-zero with the error on failure.

- [ ] **Step 7: Verify the binary builds, the flags parse, and the game runs**

Run: `go build ./... && go vet ./... && go run ./cmd/cosmic-tetris --help`
Expected: build and vet clean; usage text lists `--seed`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help`.

- [ ] **Step 8: Commit**

```bash
gofmt -l . && git add internal/app/ cmd/
git commit -m "feat(app): bubble tea model, key handling, CLI flags"
```

---

### Task 17: Golden layout snapshots

**Files:**
- Test: `internal/render/golden_test.go`
- Create: `internal/render/testdata/*.txt` (generated)

**Interfaces:**
- Consumes: `render.Frame`.
- Produces: the binding layout contract of §41 and §49.7.

- [ ] **Step 1: Write the failing golden test**

```go
package render

import (
	"flag"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"cosmic-tetris/internal/game"
)

var update = flag.Bool("update", false, "rewrite golden files")

// fixture builds a deterministic mid-game position: no clocks, no RNG surprises.
func fixture() *game.Game {
	g := game.New(0x7F3A)
	g.Score, g.Lines, g.Level, g.Combo = 129340, 42, 7, 3
	for x := 0; x < game.Width-3; x++ {
		g.Board.Set(x, game.Height-1, game.Cell(int(game.T)+1))
		g.Board.Set(x, game.Height-2, game.Cell(int(game.S)+1))
	}
	g.Board.Set(0, game.Height-3, game.Cell(int(game.Z)+1))
	g.Active = game.Piece{Kind: game.T, Rotation: 0, X: 3, Y: 8}
	held := game.O
	g.Hold = &held
	return g
}

func assertGolden(t *testing.T, name string, out string) {
	t.Helper()
	path := filepath.Join("testdata", name+".txt")
	plain := stripANSI(out)
	if *update {
		if err := os.MkdirAll("testdata", 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(plain), 0o644); err != nil {
			t.Fatal(err)
		}
		return
	}
	want, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("missing golden %s (run: go test ./internal/render -update): %v", path, err)
	}
	if string(want) != plain {
		t.Errorf("golden %s mismatch\n--- want ---\n%s\n--- got ---\n%s", name, want, plain)
	}
}

func TestGoldenLayouts(t *testing.T) {
	cases := []struct {
		name  string
		scene Scene
	}{
		{"wide", Scene{Game: fixture(), Mode: ModeFull, Width: 80, Height: 30, Mission: "GRAVITY TAX INCREASED"}},
		{"medium", Scene{Game: fixture(), Mode: ModeFull, Width: 54, Height: 26, Mission: "NOMINALISH"}},
		{"small", Scene{Game: fixture(), Mode: ModeFull, Width: 40, Height: 24}},
		{"toosmall", Scene{Game: fixture(), Mode: ModeFull, Width: 34, Height: 19}},
		{"ascii", Scene{Game: fixture(), Mode: ModeASCII, Width: 80, Height: 30, Mission: "NOMINALISH"}},
		{"paused", Scene{Game: fixture(), Mode: ModeFull, Width: 80, Height: 30, Paused: true,
			Overlay: []string{"TEMPORAL SUSPENSION", "", "SPACE IS PAUSED", "", "p  resume"}}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) { assertGolden(t, c.name, Frame(c.scene)) })
	}
}

func TestGoldensSatisfyTheLayoutInvariants(t *testing.T) {
	entries, err := filepath.Glob(filepath.Join("testdata", "*.txt"))
	if err != nil || len(entries) == 0 {
		t.Fatalf("no golden files found: %v", err)
	}
	for _, path := range entries {
		b, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		rows := strings.Split(string(b), "\n")
		width := len([]rune(rows[0]))
		for i, r := range rows {
			if len([]rune(r)) != width {
				t.Errorf("%s: row %d is %d runes, want %d (ragged output means overlap)", path, i, len([]rune(r)), width)
			}
		}
		if filepath.Base(path) == "toosmall.txt" {
			continue
		}
		// Every board row must have exactly 20 interior columns between its walls.
		for _, r := range rows {
			if !strings.ContainsAny(r, "║|") {
				continue
			}
			left := strings.IndexAny(r, "║|")
			right := strings.LastIndexAny(r, "║|")
			if left == right {
				continue
			}
			interior := len([]rune(string([]rune(r)[left+1 : right])))
			if interior != 20 {
				t.Errorf("%s: a board row has %d interior columns, want 20: %q", path, interior, r)
			}
		}
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `go test ./internal/render/ -run TestGolden -v`
Expected: FAIL — missing golden files in `testdata/`.

- [ ] **Step 3: Generate the goldens and read every one**

Run: `go test ./internal/render/ -run TestGoldenLayouts -update`
Then read each file in `internal/render/testdata/`. Confirm by eye: nothing overlaps, the board is 20 interior columns by 20 rows, the HUD does not run into the board, `small.txt` has no title row and no stat labels, `ascii.txt` contains no non-ASCII bytes. If any of those are wrong, the bug is in Tasks 12–15 — fix the code and regenerate, never hand-edit a golden.

- [ ] **Step 4: Run the full suite to verify it passes**

Run: `go test ./... -v`
Expected: PASS across `internal/game`, `internal/render`, `internal/app`.

- [ ] **Step 5: Commit**

```bash
gofmt -l . && git add internal/render/golden_test.go internal/render/testdata/
git commit -m "test(render): golden layout snapshots for wide, medium, small, ascii, paused"
```

---

### Task 18: README, LICENSE, and Plan 1 acceptance

**Files:**
- Create: `README.md`, `LICENSE`

**Interfaces:**
- Consumes: the whole build.
- Produces: nothing code-facing.

- [ ] **Step 1: Write `README.md`**

Sections: what it is (one paragraph, in the spec's voice), `go run ./cmd/cosmic-tetris`, the five CLI flags from §49.5, the controls table from §8, and a short architecture note naming the four `internal` packages and the rule that FX never modify game state.

- [ ] **Step 2: Add `LICENSE`**

MIT, copyright the repository owner.

- [ ] **Step 3: Verify the acceptance criteria this plan owns**

Run: `go build ./... && go vet ./... && go test ./... -race`
Then play it: `go run ./cmd/cosmic-tetris --seed 1234`. Confirm by hand, and note each in the commit body: controls feel immediate; resizing the window mid-play never crashes and switches layouts; hold, ghost, and the next queue work; gravity speeds up as the level rises; pause and restart work; `--ascii` renders a playable board; game over shows the panel and `r` reboots.

- [ ] **Step 4: Commit**

```bash
gofmt -l . && git add README.md LICENSE
git commit -m "docs: README and LICENSE; Plan 1 acceptance verified"
```

---

## What Plan 1 deliberately leaves out

These belong to Plans 2 and 3 and are already accounted for there: starfield, animated border, piece trails, mission-control message generation (Plan 1 renders whatever string it is handed), particles, hard-drop impact, line-clear supernova, screen shake, shockwaves, hyperdrive, the four-line sequence, combo escalation, level-up notification, the boot sequence, the game-over black hole, the help overlay's final styling, and `--no-fx` / `--reduced-motion` actually suppressing anything (Plan 1 only parses and stores them).
