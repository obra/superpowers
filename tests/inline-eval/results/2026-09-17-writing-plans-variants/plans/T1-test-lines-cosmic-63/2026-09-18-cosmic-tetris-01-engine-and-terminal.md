# Cosmic Tetris, Plan 1: Engine and Playable Terminal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic headless tetromino engine and a genuinely good Bubble Tea terminal game on top of it — board, ghost, hold, next queue, HUD, pause, help, resize, restart — with no cosmic effects yet.

**Architecture:** `internal/game` is a pure, clock-free simulation: every mutator returns `[]Event` and time enters only through `Advance(dt)`. `internal/render` is a pure function from a `Scene` value to a string and never mutates game state. `internal/app` owns the Bubble Tea program, the single ~60Hz frame clock, and key handling. Dependencies point one way: `app → render → game`, and `app → game`.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`. Standard library `math/rand` for the game RNG. No other dependencies.

**Spec:** `design.md` (this repo root). Sections 5–13, 31–41, 42 Phases 1–2, 46, 49.

**Follow-on plans:** Plan 2 (`plans/2026-09-18-cosmic-tetris-02-cosmic-effects.md`) adds `internal/fx` and `internal/flavor`. Plan 3 (`plans/2026-09-18-cosmic-tetris-03-theatrics-and-polish.md`) adds boot, game-over collapse, and final polish. This plan must leave the seams those plans plug into: a `render.Scene` with an unused `FX` field and an `Options` struct that already parses `--no-fx` and `--reduced-motion`.

## Global Constraints

- Language: Go. Module path: `github.com/jessev/cosmic-tetris` (local scratch repo, no remote; the path just has to be stable).
- UI libraries, exact import paths: `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`. Do not abstract Bubble Tea behind a homegrown framework (§3).
- Board geometry, exact: `width 10`, `height 22`, `visible rows 20`, `hidden spawn rows 2` (§5).
- One logical block renders as **2 terminal columns × 1 terminal row** (§5).
- Nothing under `internal/game` may call `time.Now()`. The engine advances only via `func (g *Game) Advance(dt time.Duration) []Event` (§49.2).
- `Game` owns its own `rng *rand.Rand`, which drives the 7-bag and nothing else. `Seed int64` is recorded for display and restart only (§49.6).
- Rendering must not mutate game state (§37).
- Repository layout is fixed by §33. Do not add packages beyond `game`, `app`, `render`, `fx`, `flavor` under `internal/`.
- Do not build: networking, profiles, achievements, a plugin system, a database (§2).
- No goroutine per particle or per frame; no filesystem operations during gameplay (§38).
- Where §49 and an earlier section differ, §49 wins.
- Minimum usable terminal: ~40 columns × 24 rows (§31). Never crash on resize.
- Every task ends with tests passing and a commit. `go vet ./...` and `gofmt -l .` must be clean before each commit.

## Review Focus

These are inputs the spec implies but never names. Each line's test is assigned to the task that owns the code.

1. **Degenerate terminal sizes.** A `WindowSizeMsg` of `0×0` (some terminals send this on startup or when a pane is hidden) must render the too-small notice, not panic or divide by zero. → Task 12.
2. **Rotation kicked above the top of the board.** Kick offsets include `(0,-1)`, `(-1,-1)`, `(1,-1)`, so a piece at spawn row 0 can be tested at `y == -1`. `Board.Collides` must treat negative `y` as a collision, not index a slice out of range. → Task 2.
3. **A very large `dt`.** Laptop sleep or a suspended terminal means `Advance` is called with tens of seconds. It must not silently drop the piece 40 rows or spin. Cap gravity steps per call. → Task 7.
4. **Bad CLI input.** `--seed abc` must exit with a message and a non-zero status, not panic; `--seed 0` must be a valid seed, not treated as "unset". → Task 18.
5. **Inputs that arrive in the wrong state.** Movement, rotation, hold, and drops pressed while paused or after game over must be no-ops that leave score and board untouched. → Task 17.

---

## File Structure

| File | Responsibility |
|---|---|
| `go.mod`, `go.sum` | Module and pinned deps |
| `cmd/cosmic-tetris/main.go` | Flag parsing, program start |
| `internal/game/piece.go` | `PieceKind`, `Piece`, the rotation shape table, `Cells()` |
| `internal/game/board.go` | Grid storage, bounds, collision, lock, row completion/clear/collapse |
| `internal/game/bag.go` | 7-bag generator |
| `internal/game/rules.go` | Gravity curve, lock timings, kick offset order, spawn position |
| `internal/game/scoring.go` | Line values, combo bonus, level progression |
| `internal/game/events.go` | `EventKind`, `Event` |
| `internal/game/game.go` | `Game` state and every mutator, including `Advance(dt)` |
| `internal/render/palette.go` | `Mode`, glyph tables, piece colors, border style |
| `internal/render/layout.go` | `Layout`, `Compute(w, h)`, element drop order |
| `internal/render/board.go` | Board panel: locked cells, ghost, active piece, border |
| `internal/render/hud.go` | HOLD, NEXT, stats, mission-control line, control hints |
| `internal/render/overlay.go` | Pause, help, game-over, too-small panels |
| `internal/render/render.go` | `Scene`, `Render(Scene) string` composition |
| `internal/app/keys.go` | `KeyMap` built from `bubbles/key` |
| `internal/app/messages.go` | `FrameMsg`, the frame command |
| `internal/app/model.go` | `Model`, `Init`, `View`, `Options` |
| `internal/app/update.go` | `Update`: frame ticks, keys, resize, state transitions |
| `README.md`, `LICENSE` | Docs |

`internal/render/overlay.go` is one file beyond §33's listing; it exists because pause/help/game-over/too-small panels are one responsibility that would otherwise bloat `hud.go`.

---

### Task 1: Module scaffold and the piece shape table

**Files:**
- Create: `go.mod`, `internal/game/piece.go`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces: `type PieceKind uint8` with constants `KindI, KindJ, KindL, KindO, KindS, KindT, KindZ` and `AllKinds [7]PieceKind`; `func (k PieceKind) String() string` returning `"I" "J" "L" "O" "S" "T" "Z"`; `type Cell struct { X, Y int }`; `type Piece struct { Kind PieceKind; Rotation int; X, Y int }`; `func (p Piece) Cells() [4]Cell`; `func (p Piece) Rotated(delta int) Piece`.

- [ ] **Step 1: Initialize the module**

```bash
go mod init github.com/jessev/cosmic-tetris
go get charm.land/bubbletea/v2@latest charm.land/lipgloss/v2@latest charm.land/bubbles/v2@latest
```

Commit `go.mod`/`go.sum` as part of Step 6.

- [ ] **Step 2: Write the failing tests in `internal/game/piece_test.go`**

- `TestCellsSpawnI`: `Piece{KindI, 0, 3, 0}.Cells()` -> `{{3,1},{4,1},{5,1},{6,1}}`
- `TestCellsSpawnT`: `Piece{KindT, 0, 3, 0}.Cells()` -> `{{4,0},{3,1},{4,1},{5,1}}`
- `TestEveryRotationHasFourDistinctCells`: for all 7 kinds × 4 rotations, `Cells()` yields 4 cells, all distinct, all with `0 <= X < 4` and `0 <= Y < 4` before translation (test with `X==0, Y==0`)
- `TestORotationIsIdentical`: `Piece{KindO, r, 0, 0}.Cells()` is equal for `r` in `0..3`
- `TestRotatedWraps`: `Piece{KindT, 3, 0, 0}.Rotated(1).Rotation` -> `0`; `Piece{KindT, 0, 0, 0}.Rotated(-1).Rotation` -> `3`; `Rotated` leaves `Kind`, `X`, `Y` unchanged
- `TestStringNames`: `KindI.String()` -> `"I"`, `KindZ.String()` -> `"Z"`

- [ ] **Step 3: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestCells -v`
Expected: build failure, `undefined: Piece`.

- [ ] **Step 4: Implement `internal/game/piece.go`**

`Cells()` translates the shape offsets by `p.X, p.Y`. The shape table is data the spec does not fix, so it is pinned here — every later task's expected coordinates depend on these exact offsets. Each entry is the four occupied cells inside a 4×4 box, `X` rightward, `Y` downward, indexed `[kind][rotation]`:

```go
var shapes = [7][4][4]Cell{
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
		{{1, 0}, {0, 1}, {1, 1}, {0, 2}},
	},
	KindZ: {
		{{0, 0}, {1, 0}, {1, 1}, {2, 1}},
		{{2, 0}, {1, 1}, {2, 1}, {1, 2}},
		{{0, 1}, {1, 1}, {1, 2}, {2, 2}},
		{{1, 0}, {0, 1}, {1, 1}, {0, 2}},
	},
}
```

`Rotated(delta)` normalizes with `((p.Rotation+delta)%4 + 4) % 4`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add go.mod go.sum internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): tetromino kinds and rotation shape table"
```

---

### Task 2: Board — bounds, collision, lock, row clearing

**Files:**
- Create: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Piece`, `PieceKind`, `Cell` from Task 1.
- Produces: constants `Width = 10`, `Height = 22`, `HiddenRows = 2`, `VisibleRows = 20`; `type CellState struct { Filled bool; Kind PieceKind }`; `type Board struct { Cells [Height][Width]CellState }`; `func (b *Board) At(x, y int) CellState`; `func (b *Board) InBounds(x, y int) bool`; `func (b *Board) Collides(p Piece) bool`; `func (b *Board) Lock(p Piece)`; `func (b *Board) CompleteRows() []int`; `func (b *Board) ClearRows(rows []int)`.

- [ ] **Step 1: Write the failing tests in `internal/game/board_test.go`**

Use a helper `fillRow(b *Board, y int, gaps ...int)` in the test file that fills row `y` with `KindI` except at the listed columns.

- `TestInBounds`: `(0,0)` -> true; `(9,21)` -> true; `(-1,0)`, `(10,0)`, `(0,22)` -> false
- `TestInBoundsRejectsNegativeY`: `InBounds(4,-1)` -> false
- `TestCollidesWithWalls`: `Piece{KindI,0,-1,0}` -> true (cell `X == -1`); `Piece{KindI,0,7,0}` -> true (cell `X == 10`); `Piece{KindI,0,6,0}` -> false
- `TestCollidesWithFloor`: `Piece{KindO,0,3,21}` -> true (cell `Y == 22`); `Piece{KindO,0,3,20}` -> false
- `TestCollidesAboveCeiling`: `Piece{KindI,1,3,-2}` -> true (cell `Y == -2`) — **Review Focus 2**; must return `true`, not panic
- `TestCollidesWithLockedCell`: fill `(4,20)`; `Piece{KindO,0,3,19}` -> true; `Piece{KindO,0,6,19}` -> false
- `TestLockWritesKind`: `Lock(Piece{KindT,0,3,0})` then `At(4,0).Filled` -> true and `At(4,0).Kind` -> `KindT`; `At(0,0).Filled` -> false
- `TestCompleteRowsEmpty`: fresh board -> `nil` or empty slice
- `TestCompleteRowsAscending`: fill rows 21 and 19 fully -> `[]int{19, 21}`
- `TestCompleteRowsIgnoresGap`: `fillRow(b, 21, 5)` -> empty
- `TestClearRowsCollapses`: fill row 21 fully; fill `(0,20)` only; `ClearRows([]int{21})`; then row 21 has exactly `(0,21)` filled and row 20 is empty
- `TestClearRowsMultipleNonAdjacent`: fill rows 21 and 19 fully, set `(3,20)`; `ClearRows([]int{19,21})`; then `(3,21)` filled, rows 0..20 empty
- `TestClearRowsPreservesKinds`: after a collapse, the surviving cell keeps its original `Kind`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestBoard -v` (and the other new names)
Expected: build failure, `undefined: Board`.

- [ ] **Step 3: Implement `internal/game/board.go`**

`Collides` returns true if any of `p.Cells()` is `!InBounds` or already `Filled`. `ClearRows` copies rows downward from the bottom and zeroes the vacated top rows; it must tolerate the input slice in any order (sort a copy) and must not mutate the caller's slice.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board collision, locking, and row collapse"
```

---

### Task 3: 7-bag piece generator

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `AllKinds` from Task 1.
- Produces: `type Bag struct { ... }`; `func NewBag(rng *rand.Rand) *Bag`; `func (b *Bag) Next() PieceKind`.

- [ ] **Step 1: Write the failing tests in `internal/game/bag_test.go`**

- `TestEachBagContainsAllSevenOnce`: draw 70 kinds from `NewBag(rand.New(rand.NewSource(1)))`; every consecutive group of 7 contains each of the 7 kinds exactly once
- `TestSeededBagIsReproducible`: two bags from `rand.NewSource(8675309)` produce identical first 21 draws
- `TestDifferentSeedsDiffer`: bags from seeds 1 and 2 differ within the first 21 draws
- `TestBagShuffles`: across 100 bags from seed 99, the first drawn kind is not always the same value

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestBag -v` / `-run TestEachBag -v`
Expected: build failure, `undefined: NewBag`.

- [ ] **Step 3: Implement `internal/game/bag.go`**

Hold a `[]PieceKind` remainder and an index. On exhaustion, refill with `AllKinds` and shuffle with `rng.Shuffle`. The bag never reads a clock and never creates its own RNG — the caller supplies it (§49.6).

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag piece generator"
```

---

### Task 4: Rules and scoring tables

**Files:**
- Create: `internal/game/rules.go`, `internal/game/scoring.go`
- Test: `internal/game/rules_test.go`, `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: `Cell` from Task 1.
- Produces: `const SpawnX = 3`, `SpawnY = 0`; `const BaseGravity = 800 * time.Millisecond`, `MinGravity = 60 * time.Millisecond`, `GravityFactor = 0.86`; `const LockDelay = 500 * time.Millisecond`, `MaxLockResets = 15`, `MaxGravityStepsPerAdvance = 40`, `LinesPerLevel = 10`; `var KickOffsets = [8]Cell{...}`; `func GravityInterval(level int) time.Duration`; `func LineScore(lines, level int) int`; `func ComboBonus(combo, level int) int`; `func LevelForLines(lines int) int`.

- [ ] **Step 1: Write the failing tests in `internal/game/rules_test.go`**

- `TestGravityIntervalLevel1`: `GravityInterval(1)` -> `800 * time.Millisecond`
- `TestGravityIntervalDecays`: `GravityInterval(2)` -> `688 * time.Millisecond` (800 × 0.86, truncated to ms); `GravityInterval(3)` is within 1ms of `591 * time.Millisecond`
- `TestGravityIntervalClampsAtFloor`: `GravityInterval(30)` -> `60 * time.Millisecond`; `GravityInterval(1000)` -> `60 * time.Millisecond`
- `TestGravityIntervalMonotonic`: for `level` 1..40, `GravityInterval(level+1) <= GravityInterval(level)`
- `TestGravityIntervalGuardsLowLevels`: `GravityInterval(0)` and `GravityInterval(-5)` -> `800 * time.Millisecond` (treat as level 1)
- `TestKickOrder`: `KickOffsets` -> `{{0,0},{-1,0},{1,0},{-2,0},{2,0},{0,-1},{-1,-1},{1,-1}}` exactly, in that order (§7)

- [ ] **Step 2: Write the failing tests in `internal/game/scoring_test.go`**

- `TestLineScoreValues`: `LineScore(1,1)`->100, `LineScore(2,1)`->300, `LineScore(3,1)`->500, `LineScore(4,1)`->800
- `TestLineScoreScalesWithLevel`: `LineScore(4,7)` -> 5600; `LineScore(1,13)` -> 1300
- `TestLineScoreZero`: `LineScore(0,5)` -> 0
- `TestComboBonusFirstClearIsFree`: `ComboBonus(1,5)` -> 0 (§49.1)
- `TestComboBonusFormula`: `ComboBonus(2,1)` -> 50; `ComboBonus(5,3)` -> 600
- `TestComboBonusZeroCombo`: `ComboBonus(0,9)` -> 0
- `TestLevelForLines`: `LevelForLines(0)`->1, `LevelForLines(9)`->1, `LevelForLines(10)`->2, `LevelForLines(127)`->13

- [ ] **Step 3: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestGravity|TestLine|TestCombo|TestLevel|TestKick' -v`
Expected: build failure, `undefined: GravityInterval`.

- [ ] **Step 4: Implement `internal/game/rules.go` and `internal/game/scoring.go`**

`GravityInterval` computes `BaseGravity * math.Pow(GravityFactor, level-1)`, truncates to whole milliseconds, and clamps to `MinGravity`. `LineScore` uses a `[5]int{0,100,300,500,800}` table times level; more than 4 lines cannot occur, so index 4 is the cap.

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/game/rules.go internal/game/scoring.go internal/game/rules_test.go internal/game/scoring_test.go
git commit -m "feat(game): gravity curve, kick order, and scoring tables"
```

---

### Task 5: Game state, spawning, and horizontal movement

**Files:**
- Create: `internal/game/events.go`, `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces:
  - `type EventKind uint8` with constants, in this order: `PieceMoved, PieceRotated, PieceHardDropped, PieceLocked, HoldUsed, LinesCleared, ComboChanged, LevelChanged, GameOver` (§14); `func (k EventKind) String() string`.
  - `type Event struct { Kind EventKind; Piece Piece; Rows []int; Cells int; Value int }` — `Rows` set on `LinesCleared` (ascending cleared row indices), `Cells` set on `PieceHardDropped` (rows fallen), `Value` set on `ComboChanged` (new combo) and `LevelChanged` (new level).
  - `type Game struct { Board Board; Active Piece; Hold *PieceKind; CanHold bool; Next []PieceKind; Bag *Bag; Score, Lines, Level, Combo int; GravityAccumulator, LockAccumulator time.Duration; Seed int64; ... unexported: rng *rand.Rand, lockResets int, over bool }`
  - `func New(seed int64) *Game`; `func (g *Game) Over() bool`; `func (g *Game) MoveLeft() []Event`; `func (g *Game) MoveRight() []Event`.
  - `const NextQueueLen = 5` (§6: keep enough future pieces to render five).

- [ ] **Step 1: Write the failing tests in `internal/game/game_test.go`**

- `TestNewInitialState`: `New(1)` -> `Score == 0`, `Lines == 0`, `Level == 1`, `Combo == 0`, `Hold == nil`, `CanHold == true`, `Over() == false`, `Seed == 1`, `len(Next) == 5`
- `TestNewSpawnsAtSpawnPosition`: `New(1).Active` -> `Rotation == 0`, `X == SpawnX`, `Y == SpawnY`
- `TestNewIsSeeded`: `New(42).Active.Kind == New(42).Active.Kind` and the two games' `Next` slices are equal
- `TestMoveLeftShiftsAndEmits`: from `New(1)`, `MoveLeft()` -> one event of kind `PieceMoved`, `Active.X == SpawnX-1`
- `TestMoveRightShiftsAndEmits`: `MoveRight()` -> `Active.X == SpawnX+1`, one `PieceMoved`
- `TestMoveBlockedByWallEmitsNothing`: call `MoveLeft()` until `X` stops changing; the blocked call returns zero events and leaves `X` unchanged
- `TestMoveBlockedByStack`: lock a column of cells beside the piece, assert the move toward it returns no events

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestNew|TestMove' -v`
Expected: build failure, `undefined: New`.

- [ ] **Step 3: Implement `internal/game/events.go` and the state/spawn/move parts of `internal/game/game.go`**

`New(seed)` creates `rand.New(rand.NewSource(seed))`, a bag from it, refills `Next` to `NextQueueLen`, and spawns the first piece. Add an unexported `func (g *Game) spawn() []Event` that pops `Next[0]`, refills from the bag, sets `Active` to `Piece{kind, 0, SpawnX, SpawnY}`, resets `CanHold`, `LockAccumulator`, `lockResets`, and — if the spawn collides — sets `over` and returns a `GameOver` event. Movement helpers try a candidate `Piece` and commit only if `!g.Board.Collides(candidate)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/events.go internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game state, spawning, and horizontal movement"
```

---

### Task 6: Rotation with wall kicks

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/rotation_test.go`

**Interfaces:**
- Consumes: `KickOffsets` (Task 4), `Game` (Task 5).
- Produces: `func (g *Game) RotateCW() []Event`, `func (g *Game) RotateCCW() []Event`.

- [ ] **Step 1: Write the failing tests in `internal/game/rotation_test.go`**

Use a helper `gameWith(kind PieceKind, rot, x, y int) *Game` in the test file that builds `New(1)` and overwrites `Active`.

- `TestRotateCWAdvancesRotation`: T at `(3,5)` rotation 0 -> `RotateCW()` yields one `PieceRotated`, `Active.Rotation == 1`
- `TestRotateCCWWraps`: T at rotation 0 -> `RotateCCW()` -> `Rotation == 3`
- `TestRotateKicksOffLeftWall`: I at rotation 1, `X == -2`, `Y == 5` (its vertical column sits at board column 0); `RotateCW()` succeeds and the resulting cells are all in bounds
- `TestRotateKicksOffRightWall`: place a piece so that plain rotation would put a cell at `X == 10`; assert rotation succeeds and `Active.X` moved left by the first kick offset that works, following `KickOffsets` order
- `TestRotateTriesOffsetsInOrder`: place a T where offset `(0,0)` and `(-1,0)` are both blocked but `(1,0)` is free; assert `Active.X == startX+1`
- `TestRotateFailsWhenNoOffsetWorks`: fill the whole board except the 4 cells the piece occupies; `RotateCW()` returns zero events and leaves `Active` byte-identical
- `TestRotateOIsAlwaysAccepted`: O anywhere with room -> rotation succeeds and cells are unchanged
- `TestRotateNeverLeavesBoard`: for all 7 kinds at every `X` in `-2..11` and `Y` in `0..21` on an empty board, if `RotateCW()` returns an event then all resulting cells satisfy `Board.InBounds`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestRotate -v`
Expected: FAIL, `undefined: RotateCW`.

- [ ] **Step 3: Implement `RotateCW`/`RotateCCW` in `internal/game/game.go`**

Both delegate to an unexported `rotate(delta int) []Event` that walks `KickOffsets` in order, testing `Piece{Kind, newRot, X+off.X, Y+off.Y}`, and accepts the first non-colliding candidate. On success also apply the grounded lock-timer reset from Task 7 (add that call when Task 7 lands; for now just emit `PieceRotated`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/rotation_test.go
git commit -m "feat(game): forgiving wall-kick rotation"
```

---

### Task 7: `Advance(dt)` — gravity, lock delay, line clears, level, game over

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/advance_test.go`

**Interfaces:**
- Consumes: `GravityInterval`, `LockDelay`, `MaxLockResets`, `MaxGravityStepsPerAdvance`, `LinesPerLevel`, `LineScore`, `ComboBonus`, `LevelForLines`.
- Produces: `func (g *Game) Advance(dt time.Duration) []Event`; unexported `func (g *Game) grounded() bool`, `func (g *Game) lockPiece() []Event`, `func (g *Game) resetLockTimer()`.

- [ ] **Step 1: Write the failing tests in `internal/game/advance_test.go`**

- `TestAdvanceBelowIntervalDoesNothing`: `Advance(100*time.Millisecond)` on `New(1)` -> zero events, `Active.Y` unchanged
- `TestAdvanceOneIntervalDropsOneRow`: `Advance(800*time.Millisecond)` -> one `PieceMoved`, `Active.Y == SpawnY+1`
- `TestAdvanceAccumulatesRemainder`: two calls of `500ms` -> exactly one row dropped, `GravityAccumulator == 200*time.Millisecond`
- `TestAdvanceUsesLevelInterval`: with `Level` set to 5, `Advance(GravityInterval(5))` drops exactly one row
- `TestAdvanceCapsCatchUp`: `Advance(60*time.Second)` on `New(1)` -> at most `MaxGravityStepsPerAdvance` `PieceMoved` events, `GravityAccumulator` back below one interval, no panic — **Review Focus 3**
- `TestGroundedStartsLockTimer`: drop a piece to the floor, then `Advance(100ms)` -> `LockAccumulator == 100ms`, no `PieceLocked`
- `TestLockAfterLockDelay`: grounded piece, `Advance(LockDelay)` -> events contain `PieceLocked`, the piece's cells are now `Filled` on the board, a new piece has spawned
- `TestMovementResetsLockTimer`: grounded piece, `Advance(300ms)`, `MoveLeft()` -> `LockAccumulator == 0`
- `TestRotationResetsLockTimer`: same with `RotateCW()`
- `TestLockResetsAreCapped`: grounded piece; alternate `MoveLeft`/`MoveRight` 20 times with `Advance(100ms)` between; after the 15th reset the timer no longer resets and the piece locks — **spec §12**
- `TestLockClearsCompleteRow`: fill row 21 except columns 3–4, drop an O into the gap, force lock -> events contain `LinesCleared` with `Rows == []int{21}`, `Lines == 1`, `Score == 100`
- `TestLockScoresFourLines`: build four rows with a 1-wide well at column 0, hard-lock a vertical I -> `LinesCleared` with 4 rows, `Score` includes `LineScore(4, level)`
- `TestComboIncrementsAndEmits`: two consecutive clearing locks -> `ComboChanged` with `Value 1` then `Value 2`; second lock's score includes `ComboBonus(2, level)`
- `TestComboResetsOnEmptyPlacement`: clearing lock then non-clearing lock -> `ComboChanged` with `Value 0`, and no bonus added
- `TestNoComboEventWhenAlreadyZero`: two non-clearing locks -> no `ComboChanged` events at all
- `TestLevelUpEveryTenLines`: clear lines until `Lines == 10` -> events contain `LevelChanged` with `Value 2`, `Level == 2`
- `TestGameOverOnBlockedSpawn`: fill rows 0–1 fully except one column, force a lock so the next spawn collides -> events contain `GameOver`, `Over()` -> true
- `TestAdvanceAfterGameOverIsInert`: after `GameOver`, `Advance(5*time.Second)` -> zero events, `Score` unchanged
- `TestAdvanceZeroAndNegativeDt`: `Advance(0)` and `Advance(-1*time.Second)` -> zero events, accumulator unchanged

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestAdvance|TestLock|TestCombo|TestLevelUp|TestGameOver|TestGrounded' -v`
Expected: FAIL, `undefined: Advance`.

- [ ] **Step 3: Implement `Advance` and locking in `internal/game/game.go`**

Order of operations inside `Advance`, since the tests pin it and it is not derivable from the signature:

```
if over || dt <= 0: return nil
GravityAccumulator += dt
steps := 0
for GravityAccumulator >= GravityInterval(Level) && steps < MaxGravityStepsPerAdvance:
    GravityAccumulator -= GravityInterval(Level)
    steps++
    if !grounded(): move down 1, emit PieceMoved, LockAccumulator = 0
    else: break
if GravityAccumulator >= GravityInterval(Level): GravityAccumulator = 0   // catch-up cap
if grounded():
    LockAccumulator += dt
    if LockAccumulator >= LockDelay: append lockPiece()...
```

`lockPiece` performs §12's sequence exactly: commit, `CompleteRows`, `ClearRows`, update score/lines/combo/level, emit `PieceLocked` then `LinesCleared` then `ComboChanged` then `LevelChanged`, then `spawn()`. `resetLockTimer` zeroes `LockAccumulator` and increments `lockResets` only while `grounded()` and `lockResets < MaxLockResets`. Wire `resetLockTimer` into `MoveLeft`, `MoveRight`, `RotateCW`, `RotateCCW`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/advance_test.go
git commit -m "feat(game): elapsed-time gravity, lock delay, clears, and game over"
```

---

### Task 8: Soft drop, hard drop, and ghost landing position

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/drop_test.go`

**Interfaces:**
- Consumes: `Game`, `lockPiece` (Task 7).
- Produces: `func (g *Game) SoftDrop() []Event`, `func (g *Game) HardDrop() []Event`, `func (g *Game) GhostY() int`.

- [ ] **Step 1: Write the failing tests in `internal/game/drop_test.go`**

- `TestSoftDropMovesOneRowAndScores`: `New(1).SoftDrop()` -> one `PieceMoved`, `Active.Y == SpawnY+1`, `Score == 1`
- `TestSoftDropResetsGravityAccumulator`: `Advance(400ms)` then `SoftDrop()` -> `GravityAccumulator == 0`
- `TestSoftDropWhenGroundedDoesNotScore`: grounded piece -> `SoftDrop()` returns zero events, `Score` unchanged
- `TestGhostYOnEmptyBoard`: `New(1)`; `GhostY()` equals the largest `Y` for which the active piece does not collide (compute it in the test by stepping down)
- `TestGhostYRespectsStack`: fill row 21 fully; `GhostY()` for an O at `X==3` -> the row that rests on top of it
- `TestGhostYEqualsCurrentWhenGrounded`: grounded piece -> `GhostY() == Active.Y`
- `TestHardDropScoresTwoPerCell`: from `New(1)`, record `d := GhostY() - Active.Y`, then `HardDrop()` -> `Score` increased by `2*d` plus any line-clear score
- `TestHardDropEmitsEventOrder`: `HardDrop()` events start with `PieceHardDropped` (with `Cells == d`) and then contain `PieceLocked`
- `TestHardDropLocksImmediately`: after `HardDrop()`, the dropped piece's cells are `Filled` and a fresh piece has spawned, without any `Advance` call
- `TestHardDropWhenGroundedStillLocks`: grounded piece -> `HardDrop()` emits `PieceHardDropped` with `Cells == 0` and locks
- `TestHardDropAtGameOverIsInert`: after game over, `HardDrop()` -> zero events

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestSoftDrop|TestHardDrop|TestGhost' -v`
Expected: FAIL, `undefined: SoftDrop`.

- [ ] **Step 3: Implement the three methods in `internal/game/game.go`**

`GhostY` walks a copy of `Active` downward until the next step collides; it must not mutate `g`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/drop_test.go
git commit -m "feat(game): soft drop, hard drop, and ghost landing position"
```

---

### Task 9: Hold

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/hold_test.go`

**Interfaces:**
- Consumes: `Game`, `spawn` (Task 5).
- Produces: `func (g *Game) HoldPiece() []Event` (named `HoldPiece` because the `Hold` field already occupies `Hold`).

- [ ] **Step 1: Write the failing tests in `internal/game/hold_test.go`**

- `TestFirstHoldStoresAndSpawnsNext`: `New(1)`; record `first := Active.Kind` and `queued := Next[0]`; `HoldPiece()` -> one `HoldUsed` event, `*Hold == first`, `Active.Kind == queued`, `CanHold == false`
- `TestHoldSwapsWithStoredPiece`: hold, lock a piece, then hold again -> the two kinds swap, `Active.Kind` is the previously held kind
- `TestSecondHoldBlockedBeforeLock`: `HoldPiece()` twice without locking -> second call returns zero events and leaves state unchanged
- `TestHoldRestoredAfterLock`: hold, then `HardDrop()` -> `CanHold == true`
- `TestHeldPieceReturnsToSpawnRotation`: rotate the active piece twice, hold it, lock, hold again -> `Active.Rotation == 0`, `Active.X == SpawnX`, `Active.Y == SpawnY`
- `TestHoldDoesNotConsumeExtraQueue`: after a swap-style hold, `len(Next) == NextQueueLen`
- `TestHoldAtGameOverIsInert`: after game over, `HoldPiece()` -> zero events
- `TestHoldIntoBlockedSpawnEndsGame`: fill rows 0–1 so any spawn collides, then `HoldPiece()` -> events contain `GameOver`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestHold -v`
Expected: FAIL, `undefined: HoldPiece`.

- [ ] **Step 3: Implement `HoldPiece` in `internal/game/game.go`**

Empty hold: store `Active.Kind`, then `spawn()`. Non-empty: swap `*Hold` with `Active.Kind` and reset the active piece to `Piece{kind, 0, SpawnX, SpawnY}`, re-checking collision so a blocked swap ends the game. Set `CanHold = false` and emit `HoldUsed` in both paths.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/hold_test.go
git commit -m "feat(game): hold with one-per-piece restriction"
```

---

### Task 10: Determinism replay test

**Files:**
- Test: `internal/game/determinism_test.go`

**Interfaces:**
- Consumes: the whole `game` API.
- Produces: nothing (test-only). This task is the proof of §35 and §49.2.

- [ ] **Step 1: Write the failing test in `internal/game/determinism_test.go`**

Define a table of steps in the test file: `type step struct { key string; dt time.Duration }` where `key` is one of `"" "left" "right" "cw" "ccw" "soft" "hard" "hold"`, and a `replay(seed int64, steps []step) *Game` helper that applies the key then `Advance(dt)`.

- `TestReplayIsReproducible`: a hand-written stream of ~200 mixed steps run twice from seed `8675309` -> identical `Score`, `Lines`, `Level`, `Combo`, `Board.Cells`, `Active`, `Hold`, `Next`
- `TestReplayDiffersBySeed`: same stream from seeds `1` and `2` -> the boards differ
- `TestReplayReachesGameOver`: a stream of 400 `{"hard", 0}` steps -> `Over()` is true and the run produced exactly one `GameOver` event
- `TestNoClockReadsInGamePackage`: walk `internal/game/*.go` with `go/parser` and assert no `time.Now` selector appears in non-test files — **§49.2 made mechanical**
- `TestGameRNGIsNotShared`: two games from the same seed, where one has 10 000 extra calls made to an unrelated `rand.Rand`, still produce identical `Next` queues

- [ ] **Step 2: Run tests to verify they fail (or fail meaningfully)**

Run: `go test ./internal/game/ -run 'TestReplay|TestNoClock|TestGameRNG' -v`
Expected: FAIL until the helper compiles and the assertions hold. If `TestNoClockReadsInGamePackage` fails, remove the clock read rather than relaxing the test.

- [ ] **Step 3: Fix any determinism defect the replay exposes**

Likely culprits: map iteration order, a `time.Now()` slipped into `game`, or a shared package-level RNG.

- [ ] **Step 4: Run the full engine suite**

Run: `go test ./internal/game/ -count=2 -v`
Expected: PASS twice (`-count=2` catches state leaking through package-level variables).

- [ ] **Step 5: Commit**

```bash
git add internal/game/determinism_test.go
git commit -m "test(game): canned-replay determinism proof"
```

---

### Task 11: Render modes, glyphs, and palette

**Files:**
- Create: `internal/render/palette.go`
- Test: `internal/render/palette_test.go`

**Interfaces:**
- Consumes: `game.PieceKind`.
- Produces:
  - `type Mode uint8` with `ModeFull, ModeReduced, ModeASCII`; `func ParseMode(ascii bool) Mode` (returns `ModeASCII` when `ascii` is true, else detects: `ModeFull` when `lipgloss` reports truecolor, `ModeReduced` otherwise).
  - `type Glyphs struct { Block, Ghost, Empty string; BorderTL, BorderTR, BorderBL, BorderBR, BorderH, BorderV string }`
  - `func GlyphsFor(m Mode) Glyphs`
  - `func PieceColor(k game.PieceKind, m Mode) lipgloss.Color`
  - `func LockedStyle(k game.PieceKind, m Mode) lipgloss.Style`, `func ActiveStyle(k game.PieceKind, m Mode) lipgloss.Style`, `func GhostStyle(m Mode) lipgloss.Style`
  - `func BorderColor(m Mode, energy float64) lipgloss.Color` — `energy` in `[0,1]`; Plan 1 always passes `0`, Plan 2 animates it.

- [ ] **Step 1: Write the failing tests in `internal/render/palette_test.go`**

- `TestGlyphWidths`: for each mode, `Block`, `Ghost`, and `Empty` all have `lipgloss.Width` of exactly 2 (§5: 2 columns per cell)
- `TestFullGlyphs`: `GlyphsFor(ModeFull).Block` -> `"██"`, `.Ghost` -> `"░░"` (§49.4)
- `TestReducedGlyphsMatchFull`: `GlyphsFor(ModeReduced)` block/ghost equal `ModeFull`'s (§49.4 pins ghost `░░` for full **and** reduced)
- `TestASCIIGlyphs`: `GlyphsFor(ModeASCII).Block` -> `"[]"`, `.Ghost` -> `"··"` (§49.4, verbatim)
- `TestASCIIBorders`: `GlyphsFor(ModeASCII)` border runes are `+ - |` only
- `TestASCIIIsSevenBitExceptGhost`: in `ModeASCII`, every rune of every `Glyphs` field except `Ghost` is `< 128`
- `TestParseModeASCIIFlagWins`: `ParseMode(true)` -> `ModeASCII`
- `TestPieceColorsAreDistinct`: the 7 `PieceColor(k, ModeFull)` values are pairwise different
- `TestActiveBrighterThanLocked`: for each kind, `ActiveStyle` and `LockedStyle` produce different foreground colors (§49.4: active renders one step brighter)
- `TestBorderColorStableAtZeroEnergy`: `BorderColor(m, 0)` is equal across repeated calls (no hidden clock)

Note for the implementer: §49.4 pins the ASCII-mode ghost as `··` (U+00B7), which is Latin-1 rather than 7-bit ASCII. §49 wins over §32's "no special Unicode assumptions", so ship `··` — it is the single non-7-bit glyph in ASCII mode, and `TestASCIIIsSevenBitExceptGhost` is what keeps it the only one. It is still 1 column wide per rune, so widths are unaffected. Mention the exception in the README.

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -v`
Expected: build failure, `undefined: GlyphsFor`.

- [ ] **Step 3: Implement `internal/render/palette.go`**

Neon space palette per §26, as hex for `ModeFull` and the nearest ANSI-256 index for `ModeReduced`: I plasma cyan, J deep electric blue, L solar orange, O stellar gold, S alien green, T ultraviolet, Z supernova pink. Locked cells use the base color; active cells use a lighter variant.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/palette.go internal/render/palette_test.go
git commit -m "feat(render): render modes, glyph tables, and neon palette"
```

---

### Task 12: Responsive layout

**Files:**
- Create: `internal/render/layout.go`
- Test: `internal/render/layout_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type LayoutKind uint8` with `KindTooSmall, KindSmall, KindMedium, KindWide`
  - `type Layout struct { Kind LayoutKind; Width, Height int; ShowTitleBorder, ShowMissionControl, ShowStatLabels, ShowHold bool; NextCount int }`
  - `func Compute(width, height int) Layout`
  - `const MinWidth = 40`, `MinHeight = 24`

- [ ] **Step 1: Write the failing tests in `internal/render/layout_test.go`**

The thresholds below are this plan's concrete reading of §31 and §49.3's drop order; the tests are the contract.

- `TestComputeTooSmall`: `Compute(34,19).Kind` -> `KindTooSmall`; also `Compute(39,40)` and `Compute(80,23)` -> `KindTooSmall`
- `TestComputeZeroSize`: `Compute(0,0).Kind` -> `KindTooSmall`, and no field is negative — **Review Focus 1**
- `TestComputeNegativeSize`: `Compute(-5,-5).Kind` -> `KindTooSmall`, no panic
- `TestComputeSmall`: `Compute(40,24)` -> `KindSmall`, `NextCount == 3`, `ShowHold == false`, `ShowTitleBorder == false`, `ShowMissionControl == false`, `ShowStatLabels == false`
- `TestComputeMedium`: `Compute(50,26)` -> `KindMedium`, `NextCount == 3`, `ShowHold == false`, `ShowMissionControl == true`, `ShowTitleBorder == false`
- `TestComputeWide`: `Compute(80,30)` -> `KindWide`, `NextCount == 5`, `ShowHold == true`, `ShowTitleBorder == true`, `ShowMissionControl == true`, `ShowStatLabels == true`
- `TestDropOrderByHeight`: at `width == 80`, as height goes 30→27→26→25→24: `ShowTitleBorder` turns off first (at 26), then `ShowMissionControl` (at 25), then `ShowStatLabels` (at 24) — §49.3's exact order
- `TestNextNeverStacksVertically`: for every size from `(40,24)` to `(120,50)`, `NextCount > 0` (NEXT is never dropped; §49.3 says it moves beside the board and truncates to 3)
- `TestComputeIsMonotonic`: growing either dimension never turns a `Show*` flag from true to false and never lowers `NextCount`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run TestCompute -v`
Expected: FAIL, `undefined: Compute`.

- [ ] **Step 3: Implement `Compute` in `internal/render/layout.go`**

Thresholds, pinned:

```
TooSmall            : width < MinWidth || height < MinHeight
KindWide            : width >= 60
KindMedium          : width >= 46
KindSmall           : otherwise
ShowHold, NextCount : width >= 60 -> true, 5   ; else false, 3
ShowTitleBorder     : height >= 27
ShowMissionControl  : height >= 26
ShowStatLabels      : height >= 25
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/layout.go internal/render/layout_test.go
git commit -m "feat(render): responsive layout with pinned element drop order"
```

---

### Task 13: Board panel rendering

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: `game.Game`, `game.Board`, `Glyphs`, styles (Task 11).
- Produces: `type BoardView struct { Game *game.Game; Mode Mode; ShowGhost bool; ShakeX, ShakeY int; BorderEnergy float64 }`; `func RenderBoard(v BoardView) string`. Returns exactly `VisibleRows + 2` lines, each `game.Width*2 + 2` display columns wide.

- [ ] **Step 1: Write the failing tests in `internal/render/board_test.go`**

Add a test helper `stripANSI(s string) string` (regexp `\x1b\[[0-9;]*m`) in this file; later tasks reuse it.

- `TestBoardDimensions`: `RenderBoard` output stripped of ANSI has 22 lines, each with `lipgloss.Width == 22`
- `TestBoardOnlyShowsVisibleRows`: lock a piece into hidden row 0 only; the rendered board contains no block glyph
- `TestBoardShowsLockedCells`: lock an O at `(3,20)`; the two bottom-ish rows contain `██` at the expected column offsets
- `TestBoardShowsActivePiece`: the active piece's cells appear once it is in visible rows
- `TestGhostBelowActive`: with `ShowGhost: true` on an empty board, the ghost glyph `░░` appears at the `GhostY()` rows
- `TestGhostNeverOverwritesLockedCells`: fill row 21; assert row 21's stripped text contains no ghost glyph (§10)
- `TestGhostSuppressed`: `ShowGhost: false` -> no ghost glyph anywhere
- `TestGhostHiddenWhenGrounded`: grounded piece -> no ghost glyph (ghost and active coincide, active wins)
- `TestShakeShiftsWithoutChangingWidth`: `ShakeX: 1, ShakeY: -1` -> still 22 lines of width 22 (§44: shake never exceeds one cell and never resizes the panel)
- `TestASCIIBoardIsSevenBitExceptGhost`: with `Mode: ModeASCII`, every rune in the stripped output is `< 128` except `·` (the §49.4 ghost exception)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run TestBoard -v`
Expected: FAIL, `undefined: RenderBoard`.

- [ ] **Step 3: Implement `RenderBoard` in `internal/render/board.go`**

Build a `[VisibleRows][Width]` scratch grid of `{glyph, style}`, painted in §37's order: locked cells, then ghost (only into empty cells), then active piece. Then wrap in the border using `Glyphs` border runes styled with `BorderColor(mode, v.BorderEnergy)`. `ShakeX/ShakeY` shift the *contents* inside the fixed-size border. Must not mutate `v.Game`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): board panel with ghost, active piece, and shake offset"
```

---

### Task 14: HUD panels

**Files:**
- Create: `internal/render/hud.go`
- Test: `internal/render/hud_test.go`

**Interfaces:**
- Consumes: `game.Game`, `Layout`, `Glyphs`.
- Produces:
  - `func RenderHold(g *game.Game, m Mode, width int) string`
  - `func RenderNext(g *game.Game, m Mode, count, width int) string`
  - `func RenderStats(g *game.Game, l Layout) string`
  - `func RenderMissionControl(text string, width int) string`
  - `func RenderControls(l Layout) string`
  - `func RenderTitle(seed int64, width int) string`

- [ ] **Step 1: Write the failing tests in `internal/render/hud_test.go`**

- `TestHoldEmpty`: `RenderHold` with `Hold == nil` -> contains the label `HOLD` and no block glyph
- `TestHoldShowsPiece`: after a hold, the held kind's mini-shape appears
- `TestNextShowsRequestedCount`: `RenderNext(g, ModeFull, 5, 12)` shows 5 distinct mini-pieces; `count == 3` shows 3
- `TestNextCountClampedToQueue`: `count == 99` does not panic and shows at most `len(g.Next)`
- `TestStatsWithLabels`: `Layout{ShowStatLabels: true}` -> output contains `SCORE`, `LINES`, `LEVEL`
- `TestStatsWithoutLabels`: `ShowStatLabels: false` -> output contains the values but none of those three words (§49.3: `"042"` not `"LINES 042"`)
- `TestStatsZeroPadding`: `Score == 129340` renders as `00129340`; `Lines == 42` renders as `042`; `Level == 7` renders as `07` (§4's mockup)
- `TestStatsLargeScoreDoesNotTruncate`: `Score == 999999999` renders all 9 digits
- `TestMissionControlPrefix`: `RenderMissionControl("NOMINALISH", 60)` contains `MISSION CONTROL: NOMINALISH`
- `TestMissionControlTruncates`: a 200-character message rendered at `width == 40` -> `lipgloss.Width` of the stripped result is exactly 40, no wrap to a second line
- `TestMissionControlEmpty`: `RenderMissionControl("", 40)` -> a single blank line of width 40, not the prefix alone
- `TestControlsFitWidth`: for `Compute(w,30)` at `w` in `{40,50,60,80,120}`, `RenderControls` stripped width `<= w` and is a single line
- `TestControlsSmallIsAbbreviated`: at `KindSmall`, controls are shorter than at `KindWide`
- `TestTitleShowsSeedHex`: `RenderTitle(0x7F3A, 66)` contains `COSMIC TETRIS` and `7F3A` (§4's `LOCAL UNIVERSE 7F3A` is the seed in hex)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestHold|TestNext|TestStats|TestMission|TestControls|TestTitle' -v`
Expected: FAIL, `undefined: RenderHold`.

- [ ] **Step 3: Implement `internal/render/hud.go`**

Mini-piece rendering reuses `game.Piece{kind, 0, 0, 0}.Cells()` into a 4×2 glyph block. Control hints, exact copy: wide is `←→ move   ↑ rotate   ↓ descend   SPACE YEET   C hold   ? help`; small drops to `←→ ↑ ↓ SPACE  c  p  ?`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/hud.go internal/render/hud_test.go
git commit -m "feat(render): HOLD, NEXT, stats, mission-control, and control hints"
```

---

### Task 15: Scene composition and golden tests

**Files:**
- Create: `internal/render/render.go`, `internal/render/overlay.go`
- Test: `internal/render/render_test.go`, `internal/render/testdata/*.golden`

**Interfaces:**
- Consumes: Tasks 11–14.
- Produces:
  - `type Overlay uint8` with `OverlayNone, OverlayPause, OverlayHelp, OverlayGameOver, OverlayBoot`
  - `type Scene struct { Game *game.Game; Mode Mode; Overlay Overlay; Width, Height int; MissionControl string; FX FXView }`
  - `type FXView interface { Stars() []StarCell; Particles() []ParticleCell; ShakeOffset() (int, int); BorderEnergy() float64; BorderPhase() float64; Banner() (BannerView, bool) }`
  - the cell and view types this interface traffics in, all owned by `render` so that `fx` depends on `render` and never the reverse: `type StarCell struct { X, Y int; Glyph rune; Dim int }`, `type ParticleCell struct { X, Y int; Glyph rune; Bright int }`, `type BannerView struct { Kind uint8; Title, Subtitle string; Age, Life time.Duration }`.
  - Plan 1 always passes a nil `FX`; Plan 2 implements this interface on `*fx.World`. Every use site must be nil-guarded. Plans 2 and 3 each **add** methods to `FXView` (trails, supernovae, shockwaves, collapse) and fields to `BoardView`; they never change the ones declared here.
  - `func Render(s Scene) string`
  - `func RenderTooSmall(width, height int) string`
  - `func RenderPause(width, height int) string`, `func RenderHelp(width, height int) string`, `func RenderGameOver(g *game.Game, width, height int) string`

- [ ] **Step 1: Write the failing tests in `internal/render/render_test.go`**

Add a `-update` flag helper that rewrites goldens, and a `scene(w, h int, opts...) Scene` helper that builds a deterministic game: `game.New(0x7F3A)`, then a fixed script of moves and hard drops so the board is non-empty and identical every run.

- `TestGoldenWide`: `Render(scene(80,30))`, ANSI-stripped, matches `testdata/wide.golden`
- `TestGoldenMedium`: `50×26` matches `testdata/medium.golden`
- `TestGoldenSmall`: `40×24` matches `testdata/small.golden`
- `TestGoldenTooSmall`: `34×19` matches `testdata/toosmall.golden` and contains `THIS UNIVERSE IS TOO SMALL`, `current: 34 × 19`, `needed: approximately 40 × 24`
- `TestGoldenPause`: `Overlay: OverlayPause` matches `testdata/pause.golden` and contains `TEMPORAL SUSPENSION` and `SPACE IS PAUSED`
- `TestGoldenHelp`: `Overlay: OverlayHelp` matches `testdata/help.golden` and contains `FLIGHT MANUAL`
- `TestGoldenGameOver`: `Overlay: OverlayGameOver` matches `testdata/gameover.golden` and contains `UNIVERSE EXPIRED`, `r  REBOOT UNIVERSE`, `q  ACCEPT COSMIC DEATH`
- `TestGoldenASCII`: `Mode: ModeASCII` at `80×30` matches `testdata/ascii.golden`, all runes `< 128` except the `·` ghost
- `TestRenderNeverExceedsBounds`: for every size in `40..120 × 24..50` (step 7), every line's `lipgloss.Width <= Width` and the line count is `<= Height`
- `TestRenderNeverPanicsOnAnySize`: for `w` in `0..120` and `h` in `0..50` (step 3), `Render` returns without panic — **Review Focus 1**
- `TestRenderDoesNotMutateGame`: snapshot `*Scene.Game` (deep-compare `Board.Cells`, `Active`, `Score`, `Next`) before and after `Render` -> unchanged (§37)
- `TestRenderWithNilFX`: `Scene{FX: nil}` renders normally (the Plan 1 path)
- `TestBoardIntactUnderOverlays`: with each overlay, the board's 22 rows still appear at their layout position for the rows the overlay does not cover; the overlay must not corrupt board width (§41)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run TestGolden -v`
Expected: FAIL, `undefined: Render`.

- [ ] **Step 3: Implement `internal/render/render.go` and `internal/render/overlay.go`**

`Render` follows §37's order, skipping steps 2/6/9/10 while `FX` is nil: compute layout (bail to `RenderTooSmall` on `KindTooSmall`), render board, join HUD columns with `lipgloss.JoinHorizontal`, stack title/body/mission-control/controls with `lipgloss.JoinVertical`, then `lipgloss.Place` any overlay on top. Overlay panel copy comes verbatim from §28, §30, §31, §39.

- [ ] **Step 4: Generate the goldens, read them, then verify**

```bash
go test ./internal/render/ -run TestGolden -update
git diff --stat internal/render/testdata
go test ./internal/render/ -v
```

Open each golden and confirm by eye: nothing overlaps, the board is 22×22, the HUD does not intrude into the border (§41). Fix the renderer, not the golden, if it looks wrong.

- [ ] **Step 5: Commit**

```bash
git add internal/render/render.go internal/render/overlay.go internal/render/render_test.go internal/render/testdata
git commit -m "feat(render): scene composition, overlays, and golden layout tests"
```

---

### Task 16: Bubble Tea model, keys, and the frame clock

**Files:**
- Create: `internal/app/keys.go`, `internal/app/messages.go`, `internal/app/model.go`, `internal/app/update.go`
- Test: `internal/app/update_test.go`

**Interfaces:**
- Consumes: `game`, `render`.
- Produces:
  - `type AppState uint8` with `StatePlaying, StatePaused, StateGameOver` (Plan 3 adds `StateBoot`)
  - `type Options struct { Seed int64; ASCII, NoFX, ReducedMotion bool }`
  - `type Model struct { Game *game.Game; Opts Options; Mode render.Mode; Width, Height int; State AppState; ShowHelp bool; MissionControl string; LastFrame time.Time; Keys KeyMap }`
  - `func New(opts Options) Model`; `func (m Model) Init() (tea.Model, tea.Cmd)`; `func (m Model) Update(tea.Msg) (tea.Model, tea.Cmd)`; `func (m Model) View() string`
  - `type FrameMsg struct { Now time.Time }`; `func frameCmd() tea.Cmd` at `FrameInterval = 16 * time.Millisecond` (~60Hz)
  - `type KeyMap struct { Left, Right, SoftDrop, RotateCW, RotateCCW, HardDrop, Hold, Pause, Restart, Help, Quit key.Binding }`; `func DefaultKeyMap() KeyMap`; `func (k KeyMap) ShortHelp() []key.Binding`; `func (k KeyMap) FullHelp() [][]key.Binding`

  §36 lists a separate `GravityMsg`. This plan deliberately defines only `FrameMsg` and derives gravity from accumulated `dt`, which is what §36's own prose asks for ("prefer one animation clock … rather than spawning multiple timing loops") and what §49.2 requires.

- [ ] **Step 1: Write the failing tests in `internal/app/update_test.go`**

Drive `Update` directly with messages; no terminal needed.

- `TestKeyBindings`: `DefaultKeyMap()` matches §8 exactly — left: `left,h,a`; right: `right,l,d`; soft drop: `down,j,s`; rotate CW: `up,k,x,w`; rotate CCW: `z`; hard drop: `space`; hold: `c`; pause: `p`; restart: `r`; help: `?`; quit: `q,esc`
- `TestFrameMsgAdvancesGame`: send `FrameMsg` with a `Now` 800ms after `LastFrame` -> the active piece dropped one row
- `TestFrameMsgSchedulesNextFrame`: `Update(FrameMsg{})` returns a non-nil `tea.Cmd`
- `TestFirstFrameDoesNotJumpTheGame`: `New` leaves `LastFrame` zero; the first `FrameMsg` must advance the game by at most one gravity step — **guards against a multi-year `dt` on startup**
- `TestKeyMovesImmediately`: a left-key `tea.KeyPressMsg` changes `Active.X` in the same `Update`, with no `FrameMsg` in between (§8: input must not wait for ticks)
- `TestHeldKeyRepeats`: three consecutive left-key messages move the piece three columns (§8: repeated movement)
- `TestWindowSizeMsgStored`: `tea.WindowSizeMsg{Width:100,Height:40}` -> `Width == 100`, `Height == 40`
- `TestResizeToTinyDoesNotPanic`: `WindowSizeMsg{0,0}` then `View()` -> the too-small notice, no panic — **Review Focus 1**
- `TestResizeSequenceNeverPanics`: replay 50 random sizes in `0..200 × 0..80` through `Update`, calling `View()` after each -> no panic (§31: never crash from resizing)
- `TestQuitReturnsQuitCmd`: `q` -> the returned cmd is `tea.Quit`
- `TestViewMatchesRenderer`: `View()` equals `render.Render` on the model's scene (assert equality against a directly built `Scene`, so the mapping stays honest)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ -v`
Expected: build failure, `undefined: New`.

- [ ] **Step 3: Implement the four `internal/app` files**

`Update` handles `FrameMsg` by computing `dt := msg.Now.Sub(m.LastFrame)`, clamping to `[0, 250ms]` when `LastFrame` is zero or the gap is implausible, calling `m.Game.Advance(dt)`, storing `LastFrame`, and returning `frameCmd()`. Key handling switches on `key.Matches` and calls the matching `game` mutator. Consume returned `[]game.Event` and discard them for now — Plan 2 routes them to `fx` and `flavor`; leave a single `m.handleEvents(events)` seam so Plan 2 has one place to edit.

Bubble Tea v2 note: `Init` returns `(tea.Model, tea.Cmd)` and key presses arrive as `tea.KeyPressMsg`. If the compiler disagrees, follow the installed version's API rather than this line.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/app/ -v && go test ./... `
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/app
git commit -m "feat(app): Bubble Tea model, key map, and single 60Hz frame clock"
```

---

### Task 17: Pause, help, restart, and game-over state gating

**Files:**
- Modify: `internal/app/update.go`, `internal/app/model.go`
- Test: `internal/app/state_test.go`

**Interfaces:**
- Consumes: Task 16.
- Produces: `func (m *Model) Restart()`; `func (m Model) overlay() render.Overlay`.

- [ ] **Step 1: Write the failing tests in `internal/app/state_test.go`**

- `TestPauseTogglesState`: `p` -> `StatePaused`; `p` again -> `StatePlaying`
- `TestPausedFrameDoesNotAdvanceGame`: while paused, a `FrameMsg` with 5s of `dt` leaves `Active.Y` and `Score` unchanged (§30)
- `TestPausedStillSchedulesFrames`: while paused, `Update(FrameMsg{})` still returns a non-nil cmd (§30: background stars keep drifting)
- `TestPausedIgnoresGameplayKeys`: while paused, left/right/rotate/hard-drop/hold change nothing — **Review Focus 5**
- `TestPausedAcceptsPauseRestartQuitHelp`: while paused, `p`, `r`, `q`, `?` all still work
- `TestHelpTogglesWithoutPausing`: `?` -> `ShowHelp == true` and `State` stays `StatePlaying`; `?` again -> false
- `TestHelpOverlayWins`: with `ShowHelp` true and `State == StatePaused`, `overlay()` -> `OverlayHelp`
- `TestGameOverStateEntered`: force game over through `Advance` -> `State == StateGameOver`, `overlay()` -> `OverlayGameOver`
- `TestGameOverIgnoresGameplayKeys`: after game over, gameplay keys change nothing; `Score` frozen — **Review Focus 5**
- `TestRestartResetsEverything`: after a game with score and locked cells, `r` -> `Score == 0`, `Lines == 0`, `Level == 1`, empty board, `State == StatePlaying`
- `TestRestartReusesSeed`: `r` produces the same first piece sequence as the original run (§34: `Seed` is kept for restart)
- `TestRestartFromGameOver`: `r` after game over -> `StatePlaying` and a playable game

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ -run 'TestPause|TestHelp|TestGameOver|TestRestart' -v`
Expected: FAIL.

- [ ] **Step 3: Implement state gating in `internal/app`**

Route every gameplay key through a single guard: gameplay input applies only when `State == StatePlaying`. `Restart` rebuilds `m.Game = game.New(m.Opts.Seed)` and resets `State`, `ShowHelp`, `MissionControl`, `LastFrame`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/app
git commit -m "feat(app): pause, help, restart, and game-over input gating"
```

---

### Task 18: CLI entrypoint and README

**Files:**
- Create: `cmd/cosmic-tetris/main.go`, `README.md`, `LICENSE`
- Test: `cmd/cosmic-tetris/main_test.go`

**Interfaces:**
- Consumes: `app.Options`, `app.New`.
- Produces: `func parseArgs(args []string, stderr io.Writer) (app.Options, error)` — separated from `main` so it is testable; `main` calls it, then `tea.NewProgram(app.New(opts), tea.WithAltScreen())`.

- [ ] **Step 1: Write the failing tests in `cmd/cosmic-tetris/main_test.go`**

- `TestParseDefaults`: `parseArgs(nil, io.Discard)` -> no error, `ASCII == false`, `NoFX == false`, `ReducedMotion == false`, and `Seed != 0` (a random seed when unspecified)
- `TestParseSeed`: `--seed 1234` -> `Seed == 1234`
- `TestParseSeedZeroIsValid`: `--seed 0` -> `Seed == 0`, no error — **Review Focus 4**
- `TestParseSeedNegative`: `--seed -9` -> `Seed == -9`, no error
- `TestParseBadSeed`: `--seed abc` -> a non-nil error; no panic — **Review Focus 4**
- `TestParseFlags`: `--ascii`, `--no-fx`, `--reduced-motion` each set their field; all three together set all three
- `TestParseUnknownFlag`: `--warp-drive` -> non-nil error
- `TestParseHelpText`: `--help` returns `flag.ErrHelp` and the written usage lists exactly the five flags of §49.5 (`--seed`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help`)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./cmd/... -v`
Expected: FAIL, `undefined: parseArgs`.

- [ ] **Step 3: Implement `cmd/cosmic-tetris/main.go`**

Use `flag.NewFlagSet` with `flag.ContinueOnError` and its output set to the passed `stderr`. Default seed: `time.Now().UnixNano()` — this is the one clock read in the program outside Bubble Tea, and it is outside `internal/game`. `main` exits 2 on a parse error, 0 on `--help`.

`--no-fx` and `--reduced-motion` parse and are stored in `Options` but have no effect until Plan 2; note that in the README so the flag surface is stable from the first release (§49.5).

- [ ] **Step 4: Write `README.md` and `LICENSE`, then verify the binary runs**

README: one-paragraph pitch, build/run instructions, the five-flag CLI surface, the controls table from §8, the ASCII-ghost deviation noted in Task 11, and a "what's not built yet" line pointing at Plans 2 and 3. `LICENSE`: MIT, copyright Jesse Vincent.

```bash
go build ./... && go vet ./... && gofmt -l . && go test ./... -count=1
go run ./cmd/cosmic-tetris --seed 1 --help
```

Expected: build clean, `gofmt -l` prints nothing, all tests pass, `--help` prints the five flags. Then play it for a minute: `go run ./cmd/cosmic-tetris --seed 8675309`. It should already be a good game (§42 Phase 2).

- [ ] **Step 5: Commit**

```bash
git add cmd README.md LICENSE
git commit -m "feat(cli): flag parsing, entrypoint, and README"
```

---

## Done when

- `go test ./... -count=2` passes; `go vet ./...` and `gofmt -l .` are clean.
- `go run ./cmd/cosmic-tetris` is playable start to game over with working move, rotate, soft/hard drop, hold, ghost, next queue, pause, help, restart, resize.
- `internal/game` contains no `time.Now()` and no `fx` import.
- Golden tests cover wide, medium, small, too-small, pause, help, game-over, and ASCII layouts.
- `render.Scene.FX` and `app.Model.handleEvents` exist as the seams Plan 2 fills.
