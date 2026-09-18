# Cosmic Tetris — Plan 1: Headless Game Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `internal/game`, a fully tested, headless, deterministic falling-block engine with no rendering, no clock reads, and no dependencies outside the standard library.

**Architecture:** One package, six files, no interfaces. A `Game` value owns a `Board`, an active `Piece`, a 7-bag, and two time accumulators. The outside world drives it with exactly two calls: `Apply(Input)` for a player action and `Advance(dt)` for elapsed time. Both return `[]Event` describing what happened, which the FX layer (Plan 3) later consumes read-only. Nothing in this package reads a clock or touches a terminal.

**Tech Stack:** Go 1.26, standard library only (`math`, `math/rand`, `time` for `time.Duration` arithmetic).

**Spec:** `design.md` (this plan implements §5–§13, §34, §35, §40 Board/Pieces/Bag/Hold/Drop/Score/Game over/Determinism, §49.1, §49.2, §49.4 board dimensions, §49.6)

**Plan 2** (`plans/2026-09-17-cosmic-tetris-2-terminal.md`) builds the Bubble Tea app and renderer on top of this package. **Plan 3** (`plans/2026-09-17-cosmic-tetris-3-cosmic-fx.md`) builds the FX layer. Both consume the exact type and function names pinned here; do not rename anything in this plan without updating them.

## Global Constraints

- Module path: `cosmic-tetris`. Go directive: `go 1.26`.
- `internal/game` imports **only** the standard library. No Bubble Tea, no Lip Gloss, no rendering concerns (design.md §14, §33).
- Nothing under `internal/game` calls `time.Now()`, `time.Since()`, `time.Tick`, or any other clock. Elapsed time arrives as the `dt` argument to `Advance` (§49.2).
- Randomness comes only from the `*rand.Rand` stored on `Game`, created with `rand.New(rand.NewSource(seed))` from `math/rand` (not `math/rand/v2`). It drives the 7-bag and nothing else (§49.6).
- Board is 10 wide × 22 tall; rows 0–1 are hidden spawn rows, rows 2–21 are the 20 visible rows. `y` increases **downward** (§5).
- Every exported function is pure or mutates only the receiver. No package-level mutable state.
- Run `gofmt -l .` before every commit; it must print nothing.

## Review Focus

These are input classes the spec implies but never names. Each has a test pinned in the task that owns the code.

- **Enormous `dt`** (laptop lid closed, debugger pause, CI stall): a single `Advance(10s)` must not teleport the piece to the floor. `dt` is clamped to `MaxAdvanceStep` (250ms) per call — Task 7.
- **Zero or negative `dt`** (clock skew, duplicate frame): must change nothing and return no events — Task 7.
- **Wall kicks at the boundaries**: no kick may place a cell at `x < 0`, `x >= 10`, or `y >= 22`; `y < 0` is legal empty space above the board — Tasks 2 and 6.
- **Very high level**: `GravityInterval(100)` must clamp at 60ms and never return zero or negative — Task 4.
- **Hold whose incoming piece cannot spawn** (stack reaching the ceiling): game over, never an active piece overlapping locked cells — Task 9.

---

## File Structure

| File | Responsibility |
|---|---|
| `go.mod` | module `cosmic-tetris`, `go 1.26` |
| `internal/game/piece.go` | `PieceKind`, `Point`, `Piece`, base shape table, rotation, spawn position |
| `internal/game/board.go` | `Cell`, `Board`, bounds/collision/lock/row completion/row clearing |
| `internal/game/bag.go` | `Bag`, seeded 7-bag generation |
| `internal/game/scoring.go` | score/level/gravity pure functions and all tuning constants |
| `internal/game/events.go` | `EventKind`, `Event` |
| `internal/game/game.go` | `Game`, `Input`, `New`, `Apply`, `Advance`, `GhostY`, `Restart`, spawn/lock internals |
| `internal/game/rules.go` | rotation kick table and the kick-resolution helper |

Tests live beside their subject: `piece_test.go`, `board_test.go`, `bag_test.go`, `scoring_test.go`, `game_test.go`, `hold_test.go`, `determinism_test.go`.

---

### Task 1: Module bootstrap, pieces, and rotation

**Files:**
- Create: `go.mod`, `internal/game/piece.go`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```go
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
  const KindCount = 7
  func (k PieceKind) String() string      // "I","J","L","O","S","T","Z"
  func AllKinds() [KindCount]PieceKind

  type Point struct{ X, Y int }

  type Piece struct {
      Kind     PieceKind
      Rotation int // 0..3, always normalized
      X, Y     int // top-left corner of the piece's square bounding box, board coords
  }

  func BoxSize(k PieceKind) int           // KindI: 4, KindO: 2, all others: 3
  func (p Piece) Cells() [4]Point         // the 4 occupied cells in board coords
  func SpawnPiece(k PieceKind) Piece      // Rotation 0, Y = 1, X = (Width-BoxSize(k))/2
  ```

- [ ] **Step 1: Create `go.mod`**

```bash
go mod init cosmic-tetris
```

Then edit the `go` directive to `go 1.26` if `go mod init` wrote a different patch-level form.

- [ ] **Step 2: Write the failing tests in `internal/game/piece_test.go`**

Rotation 0 shapes, asserted as `Cells()` sets for a piece at `X:0, Y:0` (order-independent comparison — sort the points or compare as a `map[Point]bool`):

- `test_shape_I_rot0`: `Piece{KindI,0,0,0}.Cells()` -> `{0,1},{1,1},{2,1},{3,1}`
- `test_shape_J_rot0`: -> `{0,0},{0,1},{1,1},{2,1}`
- `test_shape_L_rot0`: -> `{2,0},{0,1},{1,1},{2,1}`
- `test_shape_O_rot0`: -> `{0,0},{1,0},{0,1},{1,1}`
- `test_shape_S_rot0`: -> `{1,0},{2,0},{0,1},{1,1}`
- `test_shape_T_rot0`: -> `{1,0},{0,1},{1,1},{2,1}`
- `test_shape_Z_rot0`: -> `{0,0},{1,0},{1,1},{2,1}`
- `test_rotation_is_clockwise_in_box`: for every kind and every `r` in 0..3, each cell of rotation `r` equals `(N-1-y, x)` applied `r` times to the matching rotation-0 cell, where `N = BoxSize(kind)`. Assert by computing the expected set from the rotation-0 set.
- `test_all_rotations_have_four_cells`: for every kind, every `r` in 0..3, `len(unique(Cells()))` -> `4`
- `test_all_rotations_stay_in_box`: every cell of every rotation satisfies `0 <= x-p.X < N` and `0 <= y-p.Y < N`
- `test_O_rotation_invariant`: `Piece{KindO,r,0,0}.Cells()` is the same set for all `r` in 0..3
- `test_rotation_normalized`: `Piece{KindT,4,0,0}.Cells()` equals `Piece{KindT,0,0,0}.Cells()`, and `Rotation: -1` equals `Rotation: 3`
- `test_cells_translate_with_position`: `Piece{KindT,0,3,5}.Cells()` equals rotation-0 cells each offset by `(3,5)`
- `test_spawn_positions`: `SpawnPiece(KindI)` -> `Piece{KindI,0,3,1}`; `SpawnPiece(KindO)` -> `Piece{KindO,0,4,1}`; `SpawnPiece(KindT)` -> `Piece{KindT,0,3,1}`
- `test_spawn_touches_visible_row`: for every kind, the maximum `Cells()[i].Y` of `SpawnPiece(k)` is `>= 2` (the piece is partially visible the instant it spawns)
- `test_kind_string`: `KindZ.String()` -> `"Z"`

- [ ] **Step 3: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestShape -v`
Expected: FAIL — undefined: `Piece`, `KindI`, …

- [ ] **Step 4: Implement `internal/game/piece.go`**

Store base shapes as a `[KindCount][4]Point` table of rotation-0 cells relative to the bounding box. `Cells()` rotates each base cell `Rotation & 3` times with the clockwise-in-box transform `(x, y) -> (N-1-y, x)`, then adds `p.X, p.Y`.

`Width` is defined in Task 2's `board.go`; for this task declare it in `board.go` early or inline the value `10` in `SpawnPiece` and fix it up in Task 2. Prefer creating `board.go` now with just the dimension constants.

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS (all piece tests)

- [ ] **Step 6: Commit**

```bash
git add go.mod internal/game/piece.go internal/game/board.go internal/game/piece_test.go
git commit -m "feat(game): tetromino shapes, rotation, and spawn positions"
```

---

### Task 2: Board — bounds, collision, locking, row clearing

**Files:**
- Modify: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Piece`, `Point`, `PieceKind` (Task 1).
- Produces:
  ```go
  const (
      Width       = 10
      Height      = 22
      HiddenRows  = 2
      VisibleRows = 20 // Height - HiddenRows
  )

  type Cell int8
  const CellEmpty Cell = -1
  func CellOf(k PieceKind) Cell
  func (c Cell) Empty() bool
  func (c Cell) Kind() PieceKind // undefined for CellEmpty

  type Board struct {
      Cells [Height][Width]Cell
  }

  func NewBoard() Board                       // every cell CellEmpty
  func (b *Board) At(x, y int) Cell            // CellEmpty when out of range
  func (b *Board) Blocked(x, y int) bool       // true if x<0 || x>=Width || y>=Height || cell filled; false when y<0
  func (b *Board) Collides(p Piece) bool
  func (b *Board) Lock(p Piece)
  func (b *Board) RowFilled(y int) bool
  func (b *Board) CompleteRows() []int         // ascending y, nil when none
  func (b *Board) ClearRows(rows []int)        // collapse survivors downward, new CellEmpty rows at top
  func (b *Board) TopFilledRow() int           // lowest y that has any filled cell, Height when empty
  ```

- [ ] **Step 1: Write the failing tests in `internal/game/board_test.go`**

Use a helper `boardFromRows(t *testing.T, rows ...string) Board` that reads bottom-up strings of length 10 where `.` is empty and any other rune is a filled cell of `KindT`, so tests read as pictures.

- `test_new_board_empty`: every cell of `NewBoard()` is `CellEmpty`; `TopFilledRow()` -> `22`
- `test_blocked_left_wall`: `Blocked(-1, 10)` -> `true`
- `test_blocked_right_wall`: `Blocked(10, 10)` -> `true`
- `test_blocked_floor`: `Blocked(0, 22)` -> `true`
- `test_above_board_is_free`: `Blocked(0, -1)` -> `false` and `Blocked(0, -5)` -> `false`
- `test_blocked_filled_cell`: after `Lock`, the locked cells report `Blocked` -> `true`
- `test_at_out_of_range`: `At(-1, 0)`, `At(0, 22)`, `At(99, 99)` -> `CellEmpty`
- `test_collides_with_floor`: `Piece{KindO,0,0,20}` (cells at y 20,21) -> `Collides` `false`; `Y:21` (cells at y 21,22) -> `true`
- `test_collides_with_wall`: `Piece{KindO,0,9,0}` -> `true` (cell x 10)
- `test_collides_with_stack`: board with row 21 filled at x 0..3; `Piece{KindO,0,0,20}` -> `true`
- `test_no_collision_above_board`: `Piece{KindI,0,3,-2}` on an empty board -> `false`
- `test_lock_writes_kind`: `Lock(Piece{KindS,0,0,20})` then `At(1,20).Kind()` -> `KindS`
- `test_row_filled`: a row with 9 of 10 cells -> `false`; all 10 -> `true`
- `test_complete_rows_ascending`: rows 19 and 21 full -> `[]int{19, 21}`
- `test_complete_rows_none`: empty board -> `nil`
- `test_clear_single_row_collapses`: rows 20 (partial: x0 only) and 21 (full); `ClearRows([]int{21})` -> the partial content that was at 20 is now at 21, row 20 empty
- `test_clear_multiple_non_adjacent`: rows 18 and 20 full, row 19 holds a marker at x5, row 21 holds a marker at x9; after `ClearRows([]int{18,20})` the x9 marker is at row 21 and the x5 marker at row 20, rows 0..19 have no markers
- `test_clear_four_rows`: rows 18..21 full, row 17 has a marker at x0; `ClearRows([]int{18,19,20,21})` -> marker now at row 21, `CompleteRows()` -> `nil`
- `test_clear_leaves_top_rows_empty`: after clearing 4 rows, rows 0..3 are all `CellEmpty`
- `test_top_filled_row`: marker at row 15 only -> `TopFilledRow()` -> `15`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestBoard -v`
Expected: FAIL — undefined: `NewBoard`, `Blocked`, …

- [ ] **Step 3: Implement the board in `internal/game/board.go`**

`ClearRows` is the only non-obvious one: walk a write cursor from `Height-1` upward and a read cursor from `Height-1` upward, skipping read rows that are in `rows`; fill remaining rows above the write cursor with `CellEmpty`. `Collides` returns true if any of `p.Cells()` is `Blocked`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board bounds, collision, locking, and row clearing"
```

---

### Task 3: Seeded 7-bag

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `AllKinds` (Task 1).
- Produces:
  ```go
  type Bag struct {
      rng       *rand.Rand
      remaining []PieceKind
  }
  func NewBag(rng *rand.Rand) Bag
  func (b *Bag) Next() PieceKind
  func (b *Bag) Remaining() int
  ```

- [ ] **Step 1: Write the failing tests in `internal/game/bag_test.go`**

- `test_first_bag_contains_each_kind_once`: draw 7 from `NewBag(rand.New(rand.NewSource(1)))`, sort -> `[I J L O S T Z]`
- `test_every_bag_contains_each_kind_once`: draw 70, each consecutive group of 7 sorts to all seven kinds
- `test_same_seed_same_sequence`: two bags with seed `8675309` produce identical 70-draw sequences
- `test_different_seed_differs`: seed `1` and seed `2` produce different 70-draw sequences
- `test_remaining_counts_down`: fresh bag `Remaining()` -> `7`; after one `Next()` -> `6`; after 7 -> `7` again (refilled lazily is also acceptable if `Remaining()` reports `0` after 7 draws and `7` after the 8th — pin the lazy form: refill happens inside `Next` when empty, so after exactly 7 draws `Remaining()` -> `0`)
- `test_bag_is_shuffled`: over seeds 1..50, the first-7 sequence is not always the same ordering (at least 2 distinct orderings observed)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestBag -v`
Expected: FAIL — undefined: `NewBag`

- [ ] **Step 3: Implement `internal/game/bag.go`**

Do not use `rng.Shuffle`; use this explicit Fisher–Yates so the sequence is pinned to `Intn` calls and cannot drift with standard-library internals:

```go
func (b *Bag) refill() {
    b.remaining = append(b.remaining[:0], KindI, KindJ, KindL, KindO, KindS, KindT, KindZ)
    for i := len(b.remaining) - 1; i > 0; i-- {
        j := b.rng.Intn(i + 1)
        b.remaining[i], b.remaining[j] = b.remaining[j], b.remaining[i]
    }
}
```

`Next` refills when `len(remaining) == 0`, then pops the last element.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag piece generator"
```

---

### Task 4: Scoring, level, and gravity functions

**Files:**
- Create: `internal/game/scoring.go`
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```go
  const (
      BaseGravityInterval   = 800 * time.Millisecond
      MinGravityInterval    = 60 * time.Millisecond
      GravityDecay          = 0.86
      LinesPerLevel         = 10
      LockDelay             = 500 * time.Millisecond
      MaxLockResets         = 15
      MaxAdvanceStep        = 250 * time.Millisecond
      SoftDropPointsPerCell = 1
      HardDropPointsPerCell = 2
      NextQueueLen          = 5
  )

  func LineScore(lines, level int) int      // 0 for lines<=0 or lines>4
  func ComboBonus(combo, level int) int     // 0 when combo < 2
  func LevelFor(linesCleared int) int       // linesCleared/LinesPerLevel + 1
  func GravityInterval(level int) time.Duration
  ```

- [ ] **Step 1: Write the failing tests in `internal/game/scoring_test.go`**

- `test_line_score_level_1`: `LineScore(1,1)` -> `100`; `LineScore(2,1)` -> `300`; `LineScore(3,1)` -> `500`; `LineScore(4,1)` -> `800`
- `test_line_score_scales_with_level`: `LineScore(4,7)` -> `5600`; `LineScore(1,13)` -> `1300`
- `test_line_score_zero_and_out_of_range`: `LineScore(0,5)` -> `0`; `LineScore(5,5)` -> `0`; `LineScore(-1,5)` -> `0`
- `test_combo_bonus_first_clear_is_free`: `ComboBonus(0,3)` -> `0`; `ComboBonus(1,3)` -> `0` (§49.1: a lone clear earns no combo bonus)
- `test_combo_bonus_starts_at_two`: `ComboBonus(2,1)` -> `50`; `ComboBonus(2,4)` -> `200`; `ComboBonus(5,3)` -> `600`
- `test_level_for_lines`: `LevelFor(0)` -> `1`; `LevelFor(9)` -> `1`; `LevelFor(10)` -> `2`; `LevelFor(29)` -> `3`; `LevelFor(130)` -> `14`
- `test_gravity_level_1`: `GravityInterval(1)` -> `800 * time.Millisecond`
- `test_gravity_decays`: `GravityInterval(2)` is within 1ms of `688 * time.Millisecond`; `GravityInterval(5)` is within 1ms of `437 * time.Millisecond`
- `test_gravity_monotonic`: for `level` 1..40, `GravityInterval(level+1) <= GravityInterval(level)`
- `test_gravity_clamped`: `GravityInterval(100)` -> `MinGravityInterval`; `GravityInterval(1000)` -> `MinGravityInterval`
- `test_gravity_never_zero`: for `level` 1..1000, `GravityInterval(level) >= MinGravityInterval`
- `test_gravity_below_level_one`: `GravityInterval(0)` -> `BaseGravityInterval` (defensive clamp on the low end too)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestGravity -v`
Expected: FAIL — undefined: `GravityInterval`

- [ ] **Step 3: Implement `internal/game/scoring.go`**

`GravityInterval` computes `float64(BaseGravityInterval) * math.Pow(GravityDecay, float64(level-1))`, truncates to `time.Duration`, then clamps to `[MinGravityInterval, BaseGravityInterval]`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/scoring.go internal/game/scoring_test.go
git commit -m "feat(game): scoring, level progression, and gravity curve"
```

---

### Task 5: Events, `Game` construction, next queue, and ghost

**Files:**
- Create: `internal/game/events.go`, `internal/game/game.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces:
  ```go
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
  func (k EventKind) String() string // "PieceMoved", "PieceRotated", ... "GameOver"

  // Event is the engine's only outbound channel. Plan 3's fx.World consumes
  // these and may never touch Game itself (design.md §14).
  type Event struct {
      Kind  EventKind
      Piece Piece   // the piece involved, in its post-action state
      Cells []Point // Locked: the 4 locked cells. HardDropped: every cell traversed, top row first.
      Rows  []int   // LinesCleared: cleared row indices, ascending, pre-collapse coordinates.
      Value int     // LinesCleared: row count. ComboChanged: new combo. LevelChanged: new level. HardDropped: cells fallen.
  }

  type Game struct {
      Board   Board
      Active  Piece
      Hold    *PieceKind
      CanHold bool
      Next    []PieceKind // always NextQueueLen long
      Bag     Bag

      Score int
      Lines int
      Level int
      Combo int

      GravityAccumulator time.Duration
      LockAccumulator    time.Duration
      Grounded           bool
      LockResets         int
      Over               bool

      Seed int64
      rng  *rand.Rand
  }

  func New(seed int64) *Game
  func (g *Game) GhostY() int      // Active.Y of the piece dropped as far as it will go
  func (g *Game) DropDistance() int // cells between Active.Y and GhostY()
  ```

- [ ] **Step 1: Write the failing tests in `internal/game/game_test.go`**

- `test_new_game_defaults`: `New(1)` -> `Level` 1, `Score` 0, `Lines` 0, `Combo` 0, `Over` false, `Hold` nil, `CanHold` true, `Seed` 1
- `test_new_game_next_queue_length`: `len(g.Next)` -> `5`
- `test_new_game_active_is_spawned`: `g.Active` equals `SpawnPiece(g.Active.Kind)`
- `test_new_game_board_empty`: `g.Board.TopFilledRow()` -> `22`
- `test_new_game_reproducible`: `New(42)` twice -> same `Active.Kind` and same `Next` slice
- `test_game_and_bag_share_one_rng`: draining `g.Next` via repeated spawns for seed 42 yields the same kind sequence as `NewBag(rand.New(rand.NewSource(42)))` drawn 20 times (the queue is filled from the same generator in the same order)
- `test_ghost_on_empty_board`: `New(1)` with `Active = SpawnPiece(KindO)` -> `GhostY()` -> `20` (the O box bottom rests on row 21)
- `test_ghost_on_stack`: board with row 21 filled at x 4..5, `Active = SpawnPiece(KindO)` (x 4..5) -> `GhostY()` -> `19`
- `test_ghost_does_not_move_active`: calling `GhostY()` twice leaves `g.Active` unchanged
- `test_drop_distance`: with `Active.Y == 1` and `GhostY() == 20` -> `DropDistance()` -> `19`
- `test_event_kind_string`: `EventLinesCleared.String()` -> `"LinesCleared"`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestNewGame -v`
Expected: FAIL — undefined: `New`

- [ ] **Step 3: Implement `events.go` and the construction half of `game.go`**

`New(seed)` creates the rng, the bag, fills `Next` with `NextQueueLen` kinds, then calls the unexported `spawn()`.

`spawn()` is used by Tasks 7–10 as well, so implement it fully now:

```go
// spawn pops Next[0], refills the queue from the bag, resets the per-piece
// state, and reports GameOver if the new piece cannot be placed.
func (g *Game) spawn() []Event
```
It sets `Active = SpawnPiece(kind)`, `CanHold = true`, zeroes `GravityAccumulator`, `LockAccumulator`, `LockResets`, and `Grounded`. If `g.Board.Collides(g.Active)` it sets `g.Over = true` and returns one `Event{Kind: EventGameOver, Piece: g.Active}`; otherwise it returns `nil`.

`GhostY` copies `Active` into a local and steps `Y` down while the copy does not collide.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/events.go internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game state, event type, next queue, and ghost position"
```

---

### Task 6: `Apply` — movement, soft drop, and rotation with wall kicks

**Files:**
- Create: `internal/game/rules.go`
- Modify: `internal/game/game.go`
- Test: `internal/game/game_test.go` (append)

**Interfaces:**
- Consumes: `Game`, `Event`, `Board.Collides`, `SoftDropPointsPerCell`.
- Produces:
  ```go
  type Input int
  const (
      InputNone Input = iota
      InputLeft
      InputRight
      InputSoftDrop
      InputHardDrop   // implemented in Task 8
      InputRotateCW
      InputRotateCCW
      InputHold       // implemented in Task 9
  )

  func (g *Game) Apply(in Input) []Event

  // rules.go
  var KickOffsets = [8]Point{{0,0},{-1,0},{1,0},{-2,0},{2,0},{0,-1},{-1,-1},{1,-1}}
  func TryRotate(b *Board, p Piece, delta int) (Piece, bool)
  ```
  `Y` grows downward, so `{0,-1}` lifts the piece one row (design.md §7).

- [ ] **Step 1: Write the failing tests in `internal/game/game_test.go`**

- `test_move_left`: `Apply(InputLeft)` decrements `Active.X` by 1 and returns one `EventPieceMoved` whose `Piece` is the new position
- `test_move_right`: symmetric
- `test_move_left_blocked_by_wall`: with `Active.X` such that the leftmost cell is at x 0, `Apply(InputLeft)` returns `nil` and `Active.X` is unchanged
- `test_move_right_blocked_by_wall`: symmetric at x 9
- `test_move_blocked_by_stack`: a filled column beside the piece blocks the move, returns `nil`
- `test_soft_drop_moves_and_scores`: `Apply(InputSoftDrop)` increments `Active.Y`, adds `1` to `Score`, returns one `EventPieceMoved`
- `test_soft_drop_at_floor`: piece already resting -> returns `nil`, `Score` unchanged, `Active.Y` unchanged
- `test_input_none_is_noop`: `Apply(InputNone)` -> `nil`, no field changes
- `test_rotate_cw_free_space`: `Active.Rotation` goes 0 -> 1 and one `EventPieceRotated` is returned
- `test_rotate_ccw_free_space`: rotation goes 0 -> 3
- `test_rotate_wall_kick_left_wall`: an `I` at `X:-1` rotated so it would poke through the left wall is kicked right and succeeds; final cells all satisfy `0 <= x < 10`
- `test_rotate_wall_kick_right_wall`: mirror case at the right wall
- `test_rotate_kick_upward`: a `T` resting on the floor whose rotation needs `(0,-1)` succeeds with `Y` one row higher
- `test_rotate_kick_order`: a `T` in a pocket where both `(-1,0)` and `(1,0)` would work ends up at the `(-1,0)` position (offsets are tried in `KickOffsets` order and the first valid one wins)
- `test_rotate_fails_when_boxed_in`: a `T` fully surrounded by locked cells -> `Apply(InputRotateCW)` returns `nil`, `Rotation` unchanged
- `test_rotate_o_is_noop_but_succeeds`: `KindO` rotation changes `Rotation` and returns `EventPieceRotated`; cells are unchanged
- `test_kick_never_leaves_board`: for every kind, every rotation, and every `X` in `-2..11` and `Y` in `-2..21` on an empty board, if `TryRotate` reports success then every resulting cell satisfies `0 <= x < 10` and `y < 22`
- `test_apply_noop_when_over`: with `g.Over = true`, every `Input` returns `nil` and changes nothing

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestMove -v`
Expected: FAIL — undefined: `Apply`, `TryRotate`

- [ ] **Step 3: Implement `rules.go` and `Apply` in `game.go`**

`TryRotate` builds the rotated candidate, then for each offset in `KickOffsets` in order returns the first candidate that does not collide.

`Apply` dispatches on `Input`. Every successful move or rotation while `g.Grounded` also calls the shared helper `resetLockTimer()` (Task 7 owns it; declare it here as a method that zeroes `LockAccumulator` and increments `LockResets` when `LockResets < MaxLockResets`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/rules.go internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): movement, soft drop, and forgiving wall kicks"
```

---

### Task 7: `Advance` — gravity, lock delay, line clears, and scoring

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/game_test.go` (append)

**Interfaces:**
- Consumes: `GravityInterval`, `LockDelay`, `MaxLockResets`, `MaxAdvanceStep`, `LineScore`, `ComboBonus`, `LevelFor`, `Board.CompleteRows`, `Board.ClearRows`, `spawn`.
- Produces:
  ```go
  func (g *Game) Advance(dt time.Duration) []Event
  func (g *Game) resetLockTimer()          // used by Apply (Task 6)
  func (g *Game) lockActive() []Event      // used by HardDrop (Task 8)
  ```
  Event order emitted by `lockActive`: `EventPieceLocked`, then (if rows cleared) `EventLinesCleared`, then `EventComboChanged` when the combo value changed, then `EventLevelChanged` when the level changed, then any events from `spawn` (i.e. `EventGameOver`).

- [ ] **Step 1: Write the failing tests in `internal/game/game_test.go`**

- `test_advance_below_interval_does_not_drop`: `Advance(100ms)` at level 1 -> `Active.Y` unchanged, `nil` events, `GravityAccumulator` 100ms
- `test_advance_at_interval_drops_one`: `Advance(800ms)` -> `Active.Y` +1, one `EventPieceMoved`
- `test_advance_accumulates_across_calls`: eight `Advance(100ms)` calls -> exactly one drop total
- `test_advance_multiple_steps_in_one_call`: at `Level` 20 (interval 60ms) `Advance(250ms)` -> `Active.Y` +4
- `test_advance_clamps_huge_dt`: on an empty board at level 1, `Advance(10*time.Second)` -> `Active.Y` +0 and the piece has not locked; `GravityAccumulator` <= `MaxAdvanceStep`
- `test_advance_zero_dt`: `Advance(0)` -> `nil`, no field changes
- `test_advance_negative_dt`: `Advance(-5*time.Second)` -> `nil`, no field changes, `GravityAccumulator` unchanged
- `test_gravity_does_not_score`: after several dropping `Advance` calls, `Score` -> `0`
- `test_grounded_starts_lock_timer`: piece resting on the floor, `Advance(100ms)` -> `Grounded` true, `LockAccumulator` 100ms, piece not locked
- `test_locks_after_lock_delay`: resting piece, `Advance(500ms)` -> `EventPieceLocked` emitted, board has the cells, a new piece is active
- `test_move_resets_lock_timer`: resting piece, `Advance(400ms)`, `Apply(InputLeft)` -> `LockAccumulator` 0, `LockResets` 1; a further `Advance(400ms)` does not lock
- `test_rotation_resets_lock_timer`: same with `InputRotateCW`
- `test_failed_move_does_not_reset_lock_timer`: resting piece against a wall, `Advance(400ms)`, a blocked `Apply(InputLeft)` -> `LockAccumulator` still 400ms, `LockResets` 0
- `test_lock_resets_capped`: alternate `Apply(InputLeft)`/`Apply(InputRight)` with `Advance(10ms)` between them 30 times -> `LockResets` -> `15` and the piece has locked
- `test_lock_clears_single_row`: pre-fill row 21 leaving one gap, drop a piece into it -> `EventLinesCleared` with `Rows` `[21]`, `Value` 1; `Lines` 1; `Score` `100`
- `test_lock_clears_four_rows`: build a well and clear 4 rows with an `I` -> `Rows` has 4 entries ascending, `Value` 4, `Score` `800`
- `test_combo_sequence`: two consecutive clearing placements at level 1 clearing one row each -> `Score` `100 + (100 + 50)` = `250`; `Combo` -> `2`; `EventComboChanged` `Value` 2
- `test_combo_resets_on_empty_placement`: after a clear, a placement clearing nothing -> `Combo` -> `0` and one `EventComboChanged` with `Value` 0
- `test_no_combo_event_when_unchanged`: two consecutive non-clearing placements -> only the first emits `EventComboChanged`
- `test_level_up_at_ten_lines`: clear 10 lines total -> `Level` 2 and one `EventLevelChanged` with `Value` 2
- `test_level_changes_gravity`: after reaching `Level` 2, `Advance(700ms)` drops the piece (interval is now 688ms)
- `test_locked_cells_keep_kind`: locking a `KindS` piece leaves `KindS` cells on the board
- `test_can_hold_restored_after_lock`: set `CanHold` false, lock a piece -> `CanHold` -> `true`
- `test_advance_noop_when_over`: with `Over` true, `Advance(1s)` -> `nil`, nothing changes

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestAdvance -v`
Expected: FAIL — undefined: `Advance`

- [ ] **Step 3: Implement `Advance`, `resetLockTimer`, and `lockActive`**

```go
func (g *Game) Advance(dt time.Duration) []Event {
    if g.Over || dt <= 0 {
        return nil
    }
    if dt > MaxAdvanceStep {
        dt = MaxAdvanceStep
    }
    // Gravity: accumulate, then step down while a full interval is banked.
    // Lock: when the piece cannot descend, accumulate LockAccumulator and
    // call lockActive once it reaches LockDelay. Reset LockAccumulator to 0
    // and Grounded to false whenever the piece does descend.
}
```

`lockActive` runs the §12 order: `Board.Lock`, `CompleteRows`, `ClearRows`, update `Lines`/`Score`/`Combo`/`Level`, emit events in the order pinned in the Interfaces block, then `spawn()`.

Combo rule (§49.1): a placement clearing ≥1 row sets `Combo++`; a placement clearing none sets `Combo = 0`. Score for a clearing placement is `LineScore(n, level) + ComboBonus(newCombo, level)`, using the level **before** the level-up from these lines.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): gravity, lock delay, line clears, scoring, and level-up"
```

---

### Task 8: Hard drop

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/game_test.go` (append)

**Interfaces:**
- Consumes: `GhostY`, `DropDistance`, `lockActive`, `HardDropPointsPerCell`.
- Produces: `InputHardDrop` handling inside `Apply`. Emits `EventPieceHardDropped` (with `Cells` = every cell the piece occupied on the way down, topmost row first, and `Value` = cells fallen) **before** the `lockActive` events. Locking is immediate — no lock delay after a hard drop.

- [ ] **Step 1: Write the failing tests in `internal/game/game_test.go`**

- `test_hard_drop_lands_at_ghost`: on an empty board, `Apply(InputHardDrop)` puts the locked cells where `GhostY()` predicted
- `test_hard_drop_scores_two_per_cell`: dropping 19 cells -> `Score` gains `38` plus any line-clear score
- `test_hard_drop_locks_immediately`: after `Apply(InputHardDrop)` a different piece is active and the board holds the dropped one, with no `Advance` call
- `test_hard_drop_event_order`: returned kinds -> `[PieceHardDropped, PieceLocked, ComboChanged]` for a non-clearing drop on an empty board
- `test_hard_drop_traversed_cells`: dropping an `O` from `Y:1` to `Y:20` -> `Cells` contains one entry per cell per row crossed, `Cells[0].Y` is the topmost, and `len(Cells)` -> `2 * 21`
- `test_hard_drop_zero_distance`: a piece already resting -> `Value` 0, no score gained, still locks
- `test_hard_drop_onto_stack`: with a 5-row stack, the piece lands directly on top of it
- `test_hard_drop_clears_lines`: hard drop into a gap that completes a row -> `EventLinesCleared` follows `EventPieceLocked`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestHardDrop -v`
Expected: FAIL

- [ ] **Step 3: Implement hard drop in `Apply`**

Compute `dist := g.DropDistance()`, collect traversed cells row by row from the starting `Y` through the landing `Y`, add `dist * HardDropPointsPerCell` to `Score`, set `Active.Y = GhostY()`, emit `EventPieceHardDropped`, then append `lockActive()`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): hard drop with traversal cells and drop scoring"
```

---

### Task 9: Hold

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/hold_test.go`

**Interfaces:**
- Consumes: `Hold`, `CanHold`, `SpawnPiece`, `spawn`.
- Produces: `InputHold` handling inside `Apply`. Emits `EventHoldUsed` whose `Piece` is the **outgoing** piece (the one being stored), followed by `EventGameOver` if the incoming piece cannot be placed.

- [ ] **Step 1: Write the failing tests in `internal/game/hold_test.go`**

- `test_first_hold_stores_and_spawns_next`: `Hold` nil, active is `K`, `Next[0]` is `M`; `Apply(InputHold)` -> `*Hold` `K`, `Active.Kind` `M`, `Next` still length 5, one `EventHoldUsed` with `Piece.Kind` `K`
- `test_hold_swaps`: with `Hold` = `KindO` and active `KindT`, `Apply(InputHold)` -> `Active.Kind` `KindO`, `*Hold` `KindT`, next queue untouched
- `test_held_piece_returns_at_spawn_rotation`: hold a piece with `Rotation: 2`, swap it back in -> `Active` equals `SpawnPiece(kind)` (rotation 0, spawn X/Y)
- `test_second_hold_blocked`: two `Apply(InputHold)` in a row -> the second returns `nil` and changes nothing
- `test_hold_available_again_after_lock`: hold, hard drop, hold -> the second hold succeeds
- `test_hold_resets_lock_state`: grounded piece with `LockAccumulator` 300ms and `LockResets` 4; `Apply(InputHold)` -> both zero, `Grounded` false
- `test_hold_does_not_consume_bag`: record `Next` before a swap-style hold -> unchanged afterwards
- `test_hold_game_over_when_incoming_blocked`: fill rows 0..3 except the columns the incoming piece needs, so the swapped-in piece collides at spawn -> `Over` true, last event kind `EventGameOver`, and the board still contains no overlapping cells from the incoming piece
- `test_hold_noop_when_over`: `Over` true -> `nil`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestHold -v`
Expected: FAIL

- [ ] **Step 3: Implement hold in `Apply`**

On `InputHold` with `CanHold`: capture the outgoing kind, then either store it and call `spawn()` (empty hold) or replace `Active` with `SpawnPiece(*Hold)` and store the outgoing kind. Set `CanHold = false`, zero the per-piece timers, and check `Board.Collides(g.Active)` for the swap path — on collision set `g.Over = true` and append `EventGameOver`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/hold_test.go
git commit -m "feat(game): hold with once-per-piece rule and spawn-collision game over"
```

---

### Task 10: Game over and restart

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/game_test.go` (append)

**Interfaces:**
- Consumes: `spawn`, `New`.
- Produces:
  ```go
  func (g *Game) Restart()  // same Seed, fresh rng, fresh board and queue
  ```
  `Restart` reseeds from `g.Seed` so a `--seed` run replays identically after `r`.

- [ ] **Step 1: Write the failing tests in `internal/game/game_test.go`**

- `test_top_out_by_lock`: fill rows 2..21 in columns 3..6 to the ceiling, then hard drop until the next spawn collides -> `Over` true and an `EventGameOver` was returned by the call that locked
- `test_game_over_event_is_last`: the returned slice from the fatal placement ends with `EventGameOver`
- `test_no_events_after_game_over`: `Apply(InputLeft)`, `Apply(InputHardDrop)`, `Advance(1s)` all return `nil` once `Over`
- `test_restart_resets_state`: after scoring and clearing, `Restart()` -> `Score` 0, `Lines` 0, `Level` 1, `Combo` 0, `Over` false, `Hold` nil, `CanHold` true, `Board.TopFilledRow()` 22, `len(Next)` 5
- `test_restart_replays_same_seed`: record the first 20 spawned kinds of `New(99)`, `Restart()`, record 20 again -> identical
- `test_restart_keeps_seed`: `Seed` is unchanged by `Restart()`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestRestart -v`
Expected: FAIL — undefined: `Restart`

- [ ] **Step 3: Implement `Restart`**

Assign `*g = *New(g.Seed)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/game_test.go
git commit -m "feat(game): game over on blocked spawn and seed-preserving restart"
```

---

### Task 11: Determinism replay test

**Files:**
- Create: `internal/game/determinism_test.go`
- Test: same file

**Interfaces:**
- Consumes: `New`, `Apply`, `Advance`, `Input`.
- Produces: nothing exported. This task's deliverable is the proof of design.md §35 and §49.2.

- [ ] **Step 1: Write the failing tests in `internal/game/determinism_test.go`**

Define a step type and a canned script:

```go
type step struct {
    in Input
    dt time.Duration
}
```

The script is a deterministic pseudo-script generated inside the test from a fixed `rand.New(rand.NewSource(7))` **that is separate from the game's rng** — it picks 4000 steps, each an `Input` from the full set plus a `dt` in `{0, 16ms, 33ms, 250ms}`.

- `test_replay_is_reproducible`: run the script against `New(8675309)` twice; assert equal `Score`, `Lines`, `Level`, `Combo`, `Over`, `Active`, `Hold`, `Next`, and `Board.Cells`
- `test_replay_differs_by_seed`: the same script against `New(1)` and `New(2)` produces different final `Board.Cells`
- `test_replay_event_stream_is_reproducible`: concatenate `EventKind` values from every call in both runs -> identical slices
- `test_replay_reaches_game_over`: the 4000-step script ends with `Over` true (if it does not, extend the script length until it does, and pin that length in the test)
- `test_engine_never_reads_the_clock`: a source check — walk every `.go` file in `internal/game` that is not a `_test.go` file and assert none contains `time.Now`, `time.Since`, `time.Tick`, or `time.After`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestReplay -v`
Expected: FAIL (or PASS trivially if the script is empty — verify the assertions are real by temporarily seeding the second run differently)

- [ ] **Step 3: Fix any determinism leak the test exposes**

Likely culprits if it fails: map iteration order in event construction, a shared slice aliased across events, or `rng` used for anything other than the bag.

- [ ] **Step 4: Run the whole suite with the race detector**

Run: `go test ./... -race -count=2`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/determinism_test.go
git commit -m "test(game): canned replay proves seeded determinism and clock isolation"
```

---

## Done when

- `go test ./... -race` passes and `gofmt -l .` is silent.
- `internal/game` has no imports outside the standard library.
- Every §40 engine bullet (Board, Pieces, Bag, Hold, Drop, Score, Game over, Determinism) has named tests.
- Plan 2 can be started against the exact signatures in the Interfaces blocks above.
