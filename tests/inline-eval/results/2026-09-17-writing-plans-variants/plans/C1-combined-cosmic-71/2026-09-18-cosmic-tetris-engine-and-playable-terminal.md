# Cosmic Tetris — Engine & Playable Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic headless game engine and the playable Bubble Tea terminal UI for Cosmic Tetris — design.md Phase 1 + Phase 2, the milestone the spec calls "already a genuinely good game."

**Architecture:** `internal/game` is a pure, clock-free engine advanced by `Advance(dt)` that returns a slice of `Event`s; it owns the only RNG that touches piece order. `internal/render` is a set of pure functions that turn a read-only `Scene` into a string. `internal/app` is the Bubble Tea model that owns the clock, translates key presses into engine calls immediately, and calls the renderer. No FX yet: the event stream and the `Scene` struct are the seams the cosmic-effects plan plugs into.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`, `github.com/charmbracelet/x/ansi` (test-only, for ANSI stripping).

**Spec:** `design.md` (sections cited per task; §49 wins any conflict with §1–48)

## Scope of this plan vs. the next one

This plan delivers design.md §42 Phase 1 and Phase 2 in full: engine, keyboard, board rendering, HUD, next queue, hold, ghost, resize, pause, help, game-over panel, restart, ASCII mode, CLI. Result: a complete, deterministic, playable game with snapshot tests.

**Deliberately deferred to a second plan** (design.md §42 Phases 3–5 — `internal/fx`, `internal/flavor`, starfield, trails, particles, supernova clears, screen shake, hyperdrive, four-line sequence, shockwaves, animated border gradient, §9's QUANTUM STORAGE hold animation, boot sequence, black-hole game over, mission-control message rotation and §45's rare flavour lines): the FX system is an independent subsystem that only observes the event stream (§14), and what this plan's execution teaches about the event stream should shape it.

Two seams are built here for that plan and are otherwise inert:
- `--no-fx` and `--reduced-motion` parse into `app.Config` fields that nothing reads yet (§49.5 fixes the CLI surface, so it ships whole).
- `render.Scene.Mission` carries the mission-control line; this plan feeds it one constant string so the row is laid out and golden-tested.

## Global Constraints

- Module path `cosmic-tetris`; `go 1.26` in `go.mod`. Packages import as `cosmic-tetris/internal/game` etc.
- Pinned dependency versions, exactly these and nothing else beyond the standard library: `charm.land/bubbletea/v2 v2.0.9`, `charm.land/lipgloss/v2 v2.0.6`, `charm.land/bubbles/v2 v2.2.1`, `github.com/charmbracelet/x/ansi v0.11.8`.
- `internal/game` must not import `bubbletea`, `lipgloss`, `bubbles`, `internal/render`, or `internal/app`; must never call `time.Now()`; must never touch the filesystem or spawn a goroutine (§49.2, §38).
- Rendering must not mutate game state (§37). `render` functions take `*game.Game` and only read.
- Game RNG and FX RNG never share a generator (§35, §49.6). In this plan only the game RNG exists: `Game.rng`, unexported, seeded from `Game.Seed`, driving the 7-bag and nothing else.
- Board geometry: width 10, height 22, rows 0–1 hidden spawn rows, rows 2–21 visible (§5). Row 0 is the top; `+y` is downward.
- One logical cell renders as 2 terminal columns × 1 terminal row (§5).
- Bubble Tea v2 API facts (verified against v2.0.9, differs from v1): `Model` is `Init() tea.Cmd`, `Update(tea.Msg) (tea.Model, tea.Cmd)`, `View() tea.View`. Build the view with `tea.NewView(s)` and set `AltScreen: true` on it — there is no `WithAltScreen` program option in v2. Key presses arrive as `tea.KeyPressMsg`, resizes as `tea.WindowSizeMsg`, quit is the `tea.Quit` command.
- Key binding strings are what `tea.KeyPressMsg.String()` produces (verified): the space bar is `"space"` — not `" "` — and the others used here are `"left"`, `"right"`, `"up"`, `"down"`, `"esc"`, `"ctrl+c"`, and the bare letter for printable keys.
- Do not build: networking, profiles, achievements, plugins, a database, a homegrown framework over Bubble Tea (§2, §3).
- `gofmt -l .` prints nothing, `go vet ./...` is clean, and `go test ./...` passes at the end of every task.
- Commit at the end of every task; conventional-commit subject lines.

## Review Focus

Five input classes the spec implies but that no happy-path task exercises. Each has a test assigned to the task that owns the code.

1. **Terminal size of 0×0 or below the 40×24 minimum** — Bubble Tea's first `Update` can arrive before any `WindowSizeMsg`, so the model renders at 0×0. Expected: the too-small notice from §31, never a panic or a divide-by-zero. (Tasks 12 and 14.)
2. **A very large `dt`** — laptop sleep, SIGSTOP/SIGCONT, or a debugger pause makes the next frame's elapsed time seconds long. Expected: at most one drop interval's worth of catch-up, not a piece teleporting to the floor. (Task 5.)
3. **Keys pressed while paused, while the help overlay is open, and after game over** — Expected: movement keys mutate nothing while paused or over; `p`/`r`/`q`/`?` still work as specified; `ctrl+c` always quits. (Task 14.)
4. **A wall kick that would push a piece above row 0 or past a column edge** — the §7 offset list includes `(0,-1)` and `(±2,0)`, which point outside the board near the spawn rows. Expected: those candidates are rejected as invalid, no index-out-of-range. (Tasks 2 and 4.)
5. **A spawn position that is already occupied, including the spawn caused by `c` (hold)** — Expected: exactly one `GameOver` event, state moves to over, the blocked piece never overlaps locked cells, `Advance` afterwards is a no-op, and `r` recovers. (Tasks 8 and 9.)

---

## File Structure

Matches design.md §33; nothing beyond it except `overlays.go` (pause/help/game-over panels, kept out of `hud.go` so neither file grows unwieldy) and `_test.go` files.

```text
cosmic-tetris/
├── cmd/cosmic-tetris/main.go      CLI flags, program bootstrap
├── internal/game/
│   ├── piece.go       PieceKind, Piece, shape table, rotation derivation
│   ├── board.go       Board storage, collision, bounds, row completion/clear/collapse
│   ├── bag.go         7-bag generator over the game RNG
│   ├── rules.go       constants + pure rule functions (drop interval, level)
│   ├── scoring.go     line values, combo bonus
│   └── game.go        Game state, inputs, Advance(dt), events, game over, restart
├── internal/app/
│   ├── keys.go        KeyMap (bubbles/key) + help.KeyMap implementation
│   ├── messages.go    FrameMsg + frame command
│   ├── model.go       Model, New, View
│   └── update.go      Update: keys, resize, frame
├── internal/render/
│   ├── palette.go     Mode, glyphs, piece/border styles
│   ├── board.go       visible board rows incl. ghost + active piece
│   ├── hud.go         HOLD / NEXT / stats / mission / controls panels
│   ├── overlays.go    pause, help, game-over panels + centering
│   ├── layout.go      size tiers and chrome drop order
│   └── render.go      Scene, Render, UniverseTag
├── go.mod / go.sum
├── README.md
└── LICENSE
```

---

### Task 1: Module scaffold, piece kinds, shapes, rotations

**Files:**
- Create: `go.mod`, `internal/game/piece.go`
- Test: `internal/game/piece_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces: `type PieceKind uint8`; `const (KindNone PieceKind = iota; KindI; KindJ; KindL; KindO; KindS; KindT; KindZ)`; `var AllKinds = [7]PieceKind{KindI, KindJ, KindL, KindO, KindS, KindT, KindZ}`; `func (k PieceKind) String() string` (returns `"I"`…`"Z"`, `""` for `KindNone`); `type Piece struct { Kind PieceKind; Rotation int; X int; Y int }`; `func Spawn(k PieceKind) Piece`; `func (p Piece) Cells() [4][2]int` (board coordinates, `[i] = {x, y}`); `func (p Piece) Rotated(dir int) Piece` (`dir` +1 CW, −1 CCW; rotation kept in `0..3`); `func BoxSize(k PieceKind) int`.

- [ ] **Step 1: Write the failing tests**

```go
func TestSpawnCells(t *testing.T) {
    // spawn X: 4 for O, 3 for every other kind; spawn Y: 0; all spawns sit in the hidden rows.
    want := map[PieceKind][4][2]int{
        KindI: {{3, 1}, {4, 1}, {5, 1}, {6, 1}},
        KindJ: {{3, 0}, {3, 1}, {4, 1}, {5, 1}},
        KindL: {{5, 0}, {3, 1}, {4, 1}, {5, 1}},
        KindO: {{4, 0}, {5, 0}, {4, 1}, {5, 1}},
        KindS: {{4, 0}, {5, 0}, {3, 1}, {4, 1}},
        KindT: {{4, 0}, {3, 1}, {4, 1}, {5, 1}},
        KindZ: {{3, 0}, {4, 0}, {4, 1}, {5, 1}},
    }
    // compare sorted cell sets for each kind
}

func TestRotationDerivation(t *testing.T) {
    // I at rotation 1 is a vertical bar in box column 2:
    //   Spawn(KindI).Rotated(1) cells == {{5,0},{5,1},{5,2},{5,3}}
    // T at rotation 1 is a vertical bar in box column 1 with the nub to the right:
    //   Spawn(KindT).Rotated(1) cells == {{4,0},{4,1},{5,1},{4,2}}
}

func TestORotationIsIdentity(t *testing.T) {
    // all four rotations of O have the same cell set
}

func TestRotationWrapsAndIsReversible(t *testing.T) {
    // for every kind: Rotated(1) four times == rotation 0 and the original cell set
    // for every kind: Rotated(1).Rotated(-1) == the original piece
    // Rotated(-1) from rotation 0 yields Rotation == 3 (never negative)
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestSpawn|TestRotation|TestORotation' -v`
Expected: FAIL — package/identifiers undefined.

- [ ] **Step 3: Create `go.mod` and pin dependencies**

```bash
go mod init cosmic-tetris
go get charm.land/bubbletea/v2@v2.0.9 charm.land/lipgloss/v2@v2.0.6 charm.land/bubbles/v2@v2.2.1 github.com/charmbracelet/x/ansi@v0.11.8
```

- [ ] **Step 4: Implement `internal/game/piece.go`**

Spawn shapes, given as the occupied offsets inside each kind's bounding box (§6 — seven families, four rotations each):

```text
kind  box  rotation-0 offsets (x,y within box)
I     4    (0,1) (1,1) (2,1) (3,1)
J     3    (0,0) (0,1) (1,1) (2,1)
L     3    (2,0) (0,1) (1,1) (2,1)
O     2    (0,0) (1,0) (0,1) (1,1)
S     3    (1,0) (2,0) (0,1) (1,1)
T     3    (1,0) (0,1) (1,1) (2,1)
Z     3    (0,0) (1,0) (1,1) (2,1)
```

Rotations 1–3 are derived, not tabulated: one clockwise step inside the box is `(x, y) -> (box-1-y, x)`. Precompute all four rotations per kind once into a package-level `[8][4][4][2]int` table in an `init`, so `Cells()` is a table lookup plus adding `p.X`/`p.Y`. `Spawn` sets `Rotation: 0`, `Y: 0`, `X: 4` for `KindO` and `X: 3` otherwise.

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add go.mod go.sum internal/game/piece.go internal/game/piece_test.go
git commit -m "feat(game): tetromino kinds, shape table and derived rotations"
```

---

### Task 2: Board — collision, bounds, row completion, clear and collapse

**Files:**
- Create: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `Piece`, `Piece.Cells()` (Task 1).
- Produces: `const (Width = 10; Height = 22; HiddenRows = 2; VisibleRows = 20)`; `type Board struct { Cells [Height][Width]PieceKind }`; `func (b *Board) At(x, y int) PieceKind`; `func (b *Board) Set(x, y int, k PieceKind)`; `func (b *Board) InBounds(x, y int) bool`; `func (b *Board) Fits(p Piece) bool` (every cell in bounds and empty); `func (b *Board) Commit(p Piece)`; `func (b *Board) CompleteRows() []int` (ascending row order); `func (b *Board) ClearRows(rows []int)`; `func (b *Board) RowFilled(y int) bool`.

- [ ] **Step 1: Write the failing tests**

```go
func TestFitsRejectsOutOfBounds(t *testing.T) {
    // empty board: Spawn(KindI) with X = -1 does not fit; with X = 7 does not fit (cells reach x = 10)
    // a piece whose cells sit at y = -1 does not fit (Review Focus 4: kick offsets point above row 0)
    // Fits must not panic for X = -50, X = 50, Y = -5, Y = 100
}

func TestFitsRejectsOccupiedCells(t *testing.T) {
    // Set(4, 5, KindZ); a T piece positioned to overlap (4,5) does not fit; one row above fits
}

func TestCompleteRowsAscending(t *testing.T) {
    // fill rows 21 and 19 completely, leave one hole in row 20
    // CompleteRows() == []int{19, 21}
}

func TestClearRowsCollapses(t *testing.T) {
    // fill row 21 with KindI, put a single KindT at (0, 20)
    // ClearRows([]int{21}) leaves the T at (0, 21) and row 20 empty
}

func TestClearRowsMultipleNonAdjacent(t *testing.T) {
    // markers: (0,18)=KindS, rows 19 and 21 full, (9,20)=KindL
    // after ClearRows([]int{19,21}): S at (0,20), L at (9,21), rows 0..19 empty
}

func TestClearRowsInHiddenRows(t *testing.T) {
    // fill row 1 (a hidden spawn row) completely; CompleteRows() includes 1; ClearRows clears it
    // and everything below shifts correctly, with row 0 left empty
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestFits -v`
Expected: FAIL — `Board` undefined.

- [ ] **Step 3: Implement `internal/game/board.go`**

`ClearRows` collapses by copying surviving rows downward from the bottom (single pass, no allocation per row); it assumes `rows` is ascending, as `CompleteRows` returns it. `At` returns `KindNone` for out-of-bounds coordinates so callers never index blind.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board collision, row completion, clear and collapse"
```

---

### Task 3: 7-bag piece generator

**Files:**
- Create: `internal/game/bag.go`
- Test: `internal/game/bag_test.go`

**Interfaces:**
- Consumes: `PieceKind`, `AllKinds` (Task 1).
- Produces: `type Bag struct { ... }`; `func NewBag(rng *rand.Rand) *Bag`; `func (b *Bag) Next() PieceKind` (refills and shuffles when empty).

- [ ] **Step 1: Write the failing tests**

```go
func TestEachBagContainsAllSevenKindsOnce(t *testing.T) {
    // draw 70 pieces; every consecutive group of 7 contains each of AllKinds exactly once
}

func TestSeededBagIsReproducible(t *testing.T) {
    // two bags over rand.New(rand.NewSource(8675309)) produce identical 70-piece sequences
}

func TestDifferentSeedsDiffer(t *testing.T) {
    // seeds 1 and 2 produce different 70-piece sequences (guards against an unshuffled bag)
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestBag -v` (and the three names above)
Expected: FAIL — `NewBag` undefined.

- [ ] **Step 3: Implement `internal/game/bag.go`**

Hold a `[]PieceKind` buffer and an index; refill from `AllKinds` and shuffle with `rng.Shuffle` when exhausted. Use `math/rand` (`*rand.Rand`) — not `math/rand/v2`, whose `*rand.Rand` is not seedable from a plain `int64` in the same way, and not the global source.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/bag.go internal/game/bag_test.go
git commit -m "feat(game): seeded 7-bag piece generator"
```

---

### Task 4: Game state, next queue, movement, rotation with wall kicks

**Files:**
- Create: `internal/game/game.go`, `internal/game/rules.go`
- Test: `internal/game/game_test.go`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces:

```go
type State int
const (StatePlaying State = iota; StateOver)

type EventType int
const (
    PieceSpawned EventType = iota
    PieceMoved
    PieceRotated
    PieceHardDropped
    PieceLocked
    HoldUsed
    LinesCleared
    ComboChanged
    LevelChanged
    GameOver
)

// Value carries the one number an event needs: cells fallen (PieceHardDropped),
// number of rows (LinesCleared), the new combo (ComboChanged), the new level
// (LevelChanged); zero otherwise. Rows is set only for LinesCleared.
type Event struct {
    Type  EventType
    Piece Piece
    Rows  []int
    Value int
}

type Game struct {
    Board   Board
    Active  Piece
    Hold    *PieceKind
    CanHold bool
    Next    []PieceKind
    Score   int
    Lines   int
    Level   int
    Combo   int
    State   State
    GravityAccumulator time.Duration
    LockAccumulator    time.Duration
    LockResets         int
    Seed int64
    bag  *Bag
    rng  *rand.Rand
}

const NextQueueLen = 5

func New(seed int64) *Game
func (g *Game) MoveLeft() []Event
func (g *Game) MoveRight() []Event
func (g *Game) RotateCW() []Event
func (g *Game) RotateCCW() []Event
```

`NextQueueLen` is 5 per §6 ("render the next five"); `Game.Next` is kept at exactly that length.

- [ ] **Step 1: Write the failing tests**

```go
func TestNewGameInitialState(t *testing.T) {
    g := New(8675309)
    // len(g.Next) == NextQueueLen; g.Level == 1; g.Score == 0; g.Lines == 0; g.Combo == 0
    // g.CanHold == true; g.Hold == nil; g.State == StatePlaying
    // g.Active equals Spawn(firstKind) for the bag's first kind, and g.Seed == 8675309
}

func TestMoveWithinBoundsEmitsPieceMoved(t *testing.T) {
    // MoveLeft from spawn returns one PieceMoved event and decrements Active.X
    // MoveLeft repeatedly until the piece touches the wall: the next call returns nil and X is unchanged
}

func TestRotateUsesKickOffsetsInOrder(t *testing.T) {
    // place an I piece flush against the left wall at rotation 1, then rotate:
    // rotation 0 at the same X does not fit, so the (+1,0) candidate is accepted
    // assert the resulting X equals the (+1,0) candidate, not the (-1,0) or (-2,0) one
}

func TestRotationFailsWhenNoOffsetFits(t *testing.T) {
    // box an S piece in with locked cells so no candidate fits:
    // RotateCW returns nil and the piece is byte-for-byte unchanged
}

func TestRotationNearTopDoesNotEscapeBoard(t *testing.T) {
    // Review Focus 4: with Active at Y = 0, RotateCW never yields a piece with a cell at y < 0
    // and never panics; try every kind at every rotation at Y = 0 and at both X extremes
}

func TestNextQueueRefills(t *testing.T) {
    // consume 30 pieces via repeated spawnNext; len(g.Next) stays == NextQueueLen after each
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestNewGame|TestMove|TestRotat|TestNextQueue' -v`
Expected: FAIL — `New` undefined.

- [ ] **Step 3: Implement `internal/game/rules.go`**

Constants and pure rule helpers only (no methods on `Game`):

```go
const (
    BaseDropInterval = 800 * time.Millisecond
    MinDropInterval  = 60 * time.Millisecond
    DropFactor       = 0.86
    LockDelay        = 500 * time.Millisecond
    MaxLockResets    = 15
    MaxAdvanceStep   = 100 * time.Millisecond
    LinesPerLevel    = 10
)

// KickOffsets is §7's candidate list, in order, as (dx, dy) in board coordinates
// where +y is downward — so (0,-1) lifts the piece one row.
var KickOffsets = [8][2]int{{0, 0}, {-1, 0}, {1, 0}, {-2, 0}, {2, 0}, {0, -1}, {-1, -1}, {1, -1}}
```

- [ ] **Step 4: Implement `internal/game/game.go` (state, spawn, movement, rotation)**

`New` builds the RNG with `rand.New(rand.NewSource(seed))`, the bag over it, fills `Next` to `NextQueueLen`, and spawns the first piece. Add unexported `spawnNext() []Event` (pops `Next`, refills from the bag, sets `Active = Spawn(kind)`, resets `CanHold`, `LockAccumulator`, `LockResets`; emits `PieceSpawned` — Task 9 adds the blocked-spawn branch) and `tryMove(dx, dy int) bool`.

Rotation: build the candidate from `Active.Rotated(dir)`, then try `KickOffsets` in order, accepting the first whose piece `Fits`; emit `PieceRotated`, else return `nil`.

Grounded-state lock reset (§12) belongs to successful moves and rotations: after a successful `MoveLeft`/`MoveRight`/`RotateCW`/`RotateCCW`, if the piece cannot descend and `LockResets < MaxLockResets`, set `LockAccumulator = 0` and increment `LockResets`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add internal/game/game.go internal/game/rules.go internal/game/game_test.go
git commit -m "feat(game): game state, next queue, movement and kicked rotation"
```

---

### Task 5: Gravity and locking via `Advance(dt)`

**Files:**
- Modify: `internal/game/game.go`, `internal/game/rules.go`
- Test: `internal/game/advance_test.go`

**Interfaces:**
- Consumes: Task 4.
- Produces: `func DropInterval(level int) time.Duration` (in `rules.go`); `func (g *Game) Advance(dt time.Duration) []Event`; `func (g *Game) Grounded() bool`; unexported `func (g *Game) lock() []Event`.

`lock()` in this task commits the piece and spawns the next one; Task 6 extends it with clearing and scoring.

- [ ] **Step 1: Write the failing tests**

```go
func TestDropIntervalCurve(t *testing.T) {
    // level 1 == 800ms; level 2 == 800ms*0.86 (688ms, rounded); level 40 clamps to MinDropInterval
    // DropInterval is monotonically non-increasing for levels 1..50 and never below MinDropInterval
}

func TestAdvanceDropsOnePerInterval(t *testing.T) {
    // Advance(799ms) at level 1 emits no PieceMoved and leaves Y unchanged
    // a further Advance(1ms) emits exactly one PieceMoved and Y increases by 1
}

func TestAdvanceIsElapsedTimeBasedNotCallBased(t *testing.T) {
    // 80 calls of Advance(10ms) and one call of Advance(800ms) produce the same Y
}

func TestAdvanceClampsHugeDt(t *testing.T) {
    // Review Focus 2: from spawn, Advance(10*time.Second) at level 1 moves the piece
    // by at most one row and does not lock it; State stays StatePlaying
}

func TestLockAfterLockDelay(t *testing.T) {
    // drop a piece to the floor, then Advance(499ms): no PieceLocked
    // Advance(1ms): PieceLocked then PieceSpawned, and the old piece's cells are on the board
}

func TestMovementWhileGroundedResetsLockTimer(t *testing.T) {
    // grounded piece, Advance(400ms), MoveLeft, Advance(400ms) -> not locked yet
}

func TestLockResetsAreCapped(t *testing.T) {
    // grounded piece; alternate MoveLeft/MoveRight with Advance(400ms) more than
    // MaxLockResets times; the piece locks anyway
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestDropInterval|TestAdvance|TestLock|TestMovementWhile' -v`
Expected: FAIL — `Advance` undefined.

- [ ] **Step 3: Implement `DropInterval` and `Advance`**

`DropInterval(level)` = `BaseDropInterval * DropFactor^(level-1)` via `math.Pow`, floored at `MinDropInterval`, truncated to whole milliseconds so the curve is exactly reproducible across platforms.

`Advance(dt)` in this exact order (this is the engine's whole clock contract; nothing in it may read a clock):

```text
1. if State != StatePlaying: return nil
2. if dt > MaxAdvanceStep: dt = MaxAdvanceStep      // Review Focus 2
3. if Grounded():
     LockAccumulator += dt
     GravityAccumulator = 0
     if LockAccumulator >= LockDelay: return g.lock()
     return nil
4. LockAccumulator = 0
   GravityAccumulator += dt
   for GravityAccumulator >= DropInterval(Level):
       GravityAccumulator -= DropInterval(Level)
       if !tryMove(0, 1): break
       emit PieceMoved
```

`lock()` for now: emit `PieceLocked` with the committed piece, `Board.Commit`, then append `spawnNext()`'s events.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/rules.go internal/game/advance_test.go
git commit -m "feat(game): elapsed-time gravity and lock delay via Advance(dt)"
```

---

### Task 6: Line clearing, scoring, combo and level

**Files:**
- Create: `internal/game/scoring.go`
- Modify: `internal/game/game.go` (`lock()`)
- Test: `internal/game/scoring_test.go`

**Interfaces:**
- Consumes: Tasks 2, 5.
- Produces: `func LineScore(lines, level int) int`; `func ComboBonus(combo, level int) int`; `func LevelFor(lines int) int`.

- [ ] **Step 1: Write the failing tests**

```go
func TestLineScoreValues(t *testing.T) {
    // level 1: 0,100,300,500,800 for 0..4 lines; level 7 multiplies each by 7 (§13)
}

func TestComboBonus(t *testing.T) {
    // §49.1: bonus = 50*(combo-1)*level; combo 0 and 1 -> 0; combo 2 level 3 -> 300
}

func TestLevelFor(t *testing.T) {
    // 0 lines -> 1; 9 -> 1; 10 -> 2; 19 -> 2; 20 -> 3
}

func TestLockClearsLinesAndScores(t *testing.T) {
    // fill row 21 except one column, drop the fitting piece in, lock:
    // events contain LinesCleared with Rows == []int{21} and Value == 1,
    // and ComboChanged with Value == 1; Lines == 1; Score == 100 (level 1, no combo bonus)
}

func TestComboAccumulatesAndResets(t *testing.T) {
    // two clearing placements in a row: second placement's Score gain includes
    // 50*(2-1)*level; a placement that clears nothing emits ComboChanged with Value == 0
}

func TestLevelChangedEventAtTenLines(t *testing.T) {
    // cross 10 cleared lines: exactly one LevelChanged with Value == 2 is emitted
    // and the next DropInterval(g.Level) is shorter
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestLineScore|TestCombo|TestLevel|TestLockClears' -v`
Expected: FAIL — `LineScore` undefined.

- [ ] **Step 3: Implement `scoring.go` and extend `lock()`**

`lock()` order per §12: commit → `CompleteRows` → if non-empty `ClearRows`, `Lines += n`, `Combo++`, `Score += LineScore(n, Level) + ComboBonus(Combo, Level)`; if empty and `Combo != 0`, `Combo = 0` and emit `ComboChanged{Value: 0}` → recompute `Level = LevelFor(Lines)` and emit `LevelChanged` only when it changed → `spawnNext()`. Event order within the returned slice: `PieceLocked`, `LinesCleared`, `ComboChanged`, `LevelChanged`, `PieceSpawned`. The FX plan depends on that order, so assert it in `TestLockClearsLinesAndScores`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/scoring.go internal/game/game.go internal/game/scoring_test.go
git commit -m "feat(game): line clearing, scoring, combo and level progression"
```

---

### Task 7: Soft drop, hard drop, ghost landing

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/drop_test.go`

**Interfaces:**
- Consumes: Tasks 5, 6.
- Produces: `func (g *Game) SoftDrop() []Event`; `func (g *Game) HardDrop() []Event`; `func (g *Game) GhostPiece() Piece` (the active piece at its landing row; equal to `Active` when already grounded).

- [ ] **Step 1: Write the failing tests**

```go
func TestSoftDropScoresOnePerCell(t *testing.T) {
    // five SoftDrop calls from spawn: Y increases by 5, Score == 5, five PieceMoved events
    // SoftDrop resets GravityAccumulator to 0
    // SoftDrop on a grounded piece returns nil and does not change Score
}

func TestHardDropScoresTwoPerCellAndLocks(t *testing.T) {
    // from spawn on an empty board: HardDrop emits PieceHardDropped with
    // Value == cells fallen, then PieceLocked, then PieceSpawned
    // Score == 2 * cells fallen; the dropped piece's cells are on the board
}

func TestHardDropOnGroundedPieceLocksWithoutScore(t *testing.T) {
    // grounded piece: HardDrop emits PieceHardDropped with Value == 0 and locks; Score unchanged
}

func TestGhostPieceLandsOnStack(t *testing.T) {
    // with a locked block at (4,21), the ghost of a piece in column 4 rests at row 20,
    // shares Kind/Rotation/X with Active, and never overlaps a locked cell
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestSoftDrop|TestHardDrop|TestGhost' -v`
Expected: FAIL — `SoftDrop` undefined.

- [ ] **Step 3: Implement the three methods**

`GhostPiece` walks a copy of `Active` down while `Fits` holds. `HardDrop` computes the fall distance from `GhostPiece`, moves there, scores `2 × cells`, emits `PieceHardDropped`, then locks immediately in the same call (no lock delay). All three return `nil` when `State != StatePlaying`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/drop_test.go
git commit -m "feat(game): soft drop, hard drop and ghost landing position"
```

---

### Task 8: Hold

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/hold_test.go`

**Interfaces:**
- Consumes: Tasks 4–7.
- Produces: `func (g *Game) UseHold() []Event`.

- [ ] **Step 1: Write the failing tests**

```go
func TestFirstHoldStoresActiveAndSpawnsNext(t *testing.T) {
    // Hold is nil: UseHold emits HoldUsed then PieceSpawned
    // *g.Hold == the old Active.Kind; the new Active is Spawn(oldNext[0]); CanHold == false
}

func TestSecondHoldBlockedBeforeLock(t *testing.T) {
    // immediately calling UseHold again returns nil and changes nothing
}

func TestHoldSwapsAndResetsRotation(t *testing.T) {
    // hold a piece, lock the active one, rotate the new active twice, then UseHold:
    // the piece coming out of hold is at Rotation 0 and its spawn X/Y (§9)
}

func TestHoldAllowedAgainAfterLock(t *testing.T) {
    // after a lock, CanHold == true and UseHold works again
}

func TestHoldIntoBlockedSpawnEndsGame(t *testing.T) {
    // Review Focus 5: fill the spawn rows so the held piece cannot be placed;
    // UseHold emits GameOver exactly once, State == StateOver, and no locked cell was overwritten
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run TestHold -v` (plus `TestFirstHold`, `TestSecondHold`)
Expected: FAIL — `UseHold` undefined.

- [ ] **Step 3: Implement `UseHold`**

Guard on `State`/`CanHold`. Empty hold: store `Active.Kind`, then `spawnNext()`. Non-empty: swap kinds and place the incoming kind via the same spawn path so the blocked-spawn check in Task 9 applies uniformly. Set `CanHold = false`; `spawnNext` restores it on the next lock.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/hold_test.go
git commit -m "feat(game): hold with once-per-piece limit and spawn-rotation reset"
```

---

### Task 9: Game over, restart, and the determinism replay test

**Files:**
- Modify: `internal/game/game.go`
- Test: `internal/game/gameover_test.go`, `internal/game/determinism_test.go`

**Interfaces:**
- Consumes: Tasks 4–8.
- Produces: `func (g *Game) Restart()` (resets to `New(g.Seed)` state in place, including the RNG); `func (g *Game) Snapshot() string` (stable one-line digest of `Board`, `Active`, `Hold`, `Next`, `Score`, `Lines`, `Level`, `Combo`, `State` — used by tests and nothing else).

- [ ] **Step 1: Write the failing tests**

```go
func TestBlockedSpawnEndsGame(t *testing.T) {
    // fill rows 0..3 across the spawn columns, force a lock:
    // exactly one GameOver event; State == StateOver; no PieceSpawned after it
}

func TestInputsAndAdvanceAreNoOpsAfterGameOver(t *testing.T) {
    // Review Focus 5: after game over, MoveLeft/MoveRight/RotateCW/RotateCCW/SoftDrop/
    // HardDrop/UseHold/Advance(1s) all return nil and leave Snapshot() unchanged
}

func TestRestartRestoresSeededStart(t *testing.T) {
    // play a while, Restart(), compare Snapshot() with New(sameSeed).Snapshot()
}

func TestReplayIsDeterministic(t *testing.T) {
    // a canned script of ~200 steps, each either an input or an Advance(dt):
    //   type step struct{ key string; dt time.Duration }
    // run it twice against New(8675309); Snapshot() matches, and the concatenated
    // event type sequence matches
    // also assert the exact final Score/Lines/Level as literals, so a rules change
    // that silently alters replays fails here
}

func TestReplayDiffersBySeed(t *testing.T) {
    // the same script against New(1) yields a different Snapshot()
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/game/ -run 'TestBlockedSpawn|TestInputsAndAdvance|TestRestart|TestReplay' -v`
Expected: FAIL — `Restart` undefined.

- [ ] **Step 3: Implement the blocked-spawn branch, `Restart` and `Snapshot`**

In `spawnNext`: if the spawned piece does not `Fit`, set `State = StateOver` and emit `GameOver` instead of `PieceSpawned`, leaving the board untouched. Add the `State != StatePlaying` guard to every input method (some already have it from Tasks 5/7/8 — make it uniform).

Write the replay script as a table in the test, and drive it through a small helper that maps a key string to the matching method, so the same table can be reused by later plans.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/game/ -v -count=1`
Expected: PASS. Engine is now complete per §42 Phase 1; do not start Phase 2 until this is green.

- [ ] **Step 5: Commit**

```bash
git add internal/game/game.go internal/game/gameover_test.go internal/game/determinism_test.go
git commit -m "feat(game): game over, restart and deterministic replay coverage"
```

---

### Task 10: Render modes, glyphs and palette

**Files:**
- Create: `internal/render/palette.go`
- Test: `internal/render/palette_test.go`

**Interfaces:**
- Consumes: `game.PieceKind`.
- Produces: `type Mode int`; `const (ModeFull Mode = iota; ModeReduced; ModeASCII)`; `func BlockGlyph(m Mode) string`; `func GhostGlyph(m Mode) string`; `func PieceStyle(k game.PieceKind, m Mode, active bool) lipgloss.Style`; `func GhostStyle(m Mode) lipgloss.Style`; `func BorderStyle(m Mode) lipgloss.Style`; `func Border(m Mode) lipgloss.Border`; `func EmptyCell() string` (two spaces).

- [ ] **Step 1: Write the failing tests**

```go
func TestGlyphsPerMode(t *testing.T) {
    // §49.4: BlockGlyph is "██" in full and reduced, "[]" in ASCII
    //        GhostGlyph is "░░" in full and reduced, "··" in ASCII
    // every glyph is exactly 2 terminal columns wide (lipgloss.Width == 2)
}

func TestASCIIModeGlyphsAreASCIIOnly(t *testing.T) {
    // every rune of BlockGlyph/GhostGlyph/EmptyCell and of Border(ModeASCII)'s
    // eight sides is < 128 in ModeASCII
}

func TestActivePieceIsBrighterThanLocked(t *testing.T) {
    // §49.4: for each of the seven kinds, PieceStyle(k, ModeFull, true) renders a
    // different foreground than PieceStyle(k, ModeFull, false), and the active
    // colour is the lighter of the two (compare RGB luminance)
}

func TestEveryKindHasADistinctColour(t *testing.T) {
    // the seven locked foregrounds in ModeFull are pairwise different
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -v`
Expected: FAIL — package undefined.

- [ ] **Step 3: Implement `palette.go`**

Neon space palette (§26), locked colour per kind:

```text
I plasma cyan          #22d3ee      ASCII ANSI 6
J deep electric blue   #3b5bff      ASCII ANSI 4
L solar orange         #ff8a1f      ASCII ANSI 1
O stellar gold         #ffc83d      ASCII ANSI 3
S alien green          #4ade80      ASCII ANSI 2
T ultraviolet          #a855f7      ASCII ANSI 5
Z supernova pink       #ff3d7f      ASCII ANSI 9
```

Colours come from `lipgloss.Color("#22d3ee")` for the hex values and `lipgloss.Color("6")` for the ASCII-mode ANSI indices. Active cells are `lipgloss.Lighten(base, 0.25)` (percent is 0–1) — one step brighter, filled glyph with a bright foreground and no background (§49.4 rejects the fg+bg pairing). Ghost is `#475569`, faint. Border is `#6d28d9` (deep violet) with `lipgloss.NormalBorder`-style box drawing: `Border(ModeFull)` returns a `lipgloss.Border` with `╔ ╗ ╚ ╝ ═ ║` (§25); `Border(ModeASCII)` returns `+ + + + - |`. `ModeReduced` shares the full palette — the terminal's colour profile downsamples it, and the gradient simplification §32 asks for lands in the FX plan, which owns gradients.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/palette.go internal/render/palette_test.go
git commit -m "feat(render): render modes, glyph sets and neon piece palette"
```

---

### Task 11: Board rendering with ghost and active piece

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: Task 10, `game.Game`, `game.GhostPiece`.
- Produces: `func BoardRows(g *game.Game, m Mode) []string` (exactly `game.VisibleRows` strings, each `game.Width * 2` columns wide, board rows `game.HiddenRows`..`game.Height-1`); `func BoardBox(g *game.Game, m Mode) []string` (the rows wrapped in the §25 border: `game.VisibleRows + 2` strings, each `game.Width*2 + 2` wide).

- [ ] **Step 1: Write the failing tests**

All assertions run on `ansi.Strip` of the output.

```go
func TestBoardRowsGeometry(t *testing.T) {
    // len(BoardRows(g, ModeFull)) == game.VisibleRows
    // every stripped row has lipgloss.Width == game.Width*2
}

func TestLockedCellsRender(t *testing.T) {
    // a locked KindI at (0,21) renders BlockGlyph at columns 0..1 of the last row
}

func TestHiddenRowsAreNotRendered(t *testing.T) {
    // a locked cell at (0,1) (hidden row) appears nowhere in the output
}

func TestGhostRendersBelowActive(t *testing.T) {
    // on an empty board the active piece's cells render with BlockGlyph and the
    // ghost's cells with GhostGlyph; the ghost never overwrites an active cell
}

func TestGhostNeverObscuresLockedCells(t *testing.T) {
    // with locked cells directly under the active piece, every locked cell still
    // renders BlockGlyph (§10)
}

func TestBoardBoxDimensions(t *testing.T) {
    // len == game.VisibleRows+2; every stripped line has width game.Width*2+2;
    // the corners match Border(m) for ModeFull and ModeASCII
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run TestBoard -v`
Expected: FAIL — `BoardRows` undefined.

- [ ] **Step 3: Implement `board.go`**

Compose into a `[game.VisibleRows][game.Width]cell` scratch grid in draw order — locked cells, then ghost (only into empty cells), then active (§37 steps 3–5) — then style each cell once per row with a `strings.Builder`. Skip any cell whose board row is `< game.HiddenRows`. Never read a glyph back to decide state: the grid, not the string, is the source of truth (§5, "never use visual effects as collision data").

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): board rendering with ghost, active piece and border"
```

---

### Task 12: Layout tiers, HUD panels, and `Render(Scene)`

**Files:**
- Create: `internal/render/layout.go`, `internal/render/hud.go`, `internal/render/render.go`
- Test: `internal/render/layout_test.go`, `internal/render/hud_test.go`, `internal/render/render_test.go`, `internal/render/testdata/*.txt`

**Interfaces:**
- Consumes: Tasks 10, 11.
- Produces:

```go
// layout.go
type Tier int
const (TierTooSmall Tier = iota; TierSmall; TierMedium; TierWide)
type Chrome struct {
    Title      bool
    Mission    bool
    StatLabels bool
    NextCount  int
    Hold       bool
}
func PickTier(w, h int) Tier
func ChromeFor(t Tier, h int) Chrome
func TooSmallNotice(w, h int) string

// hud.go
func HoldPanel(g *game.Game, m Mode, labels bool) []string
func NextPanel(g *game.Game, m Mode, count int, labels bool) []string
func StatsPanel(g *game.Game, labels bool) []string
func MiniPiece(k game.PieceKind, m Mode) []string   // 2 rows × 8 columns
func MissionLine(msg string, width int, m Mode) string
func ControlsLine(hint string, width int, m Mode) string
func TitleLine(universe string, width int, m Mode) string

// render.go
type Scene struct {
    Game         *game.Game
    Width        int
    Height       int
    Mode         Mode
    Paused       bool
    Over         bool
    Help         bool
    Universe     string
    Mission      string
    ControlsHint string
    HelpBody     string
}
func Render(s Scene) string
func UniverseTag(seed int64) string
const DefaultMission = "NOMINALISH"
```

`Render` ignores `Paused`/`Over`/`Help` in this task; Task 13 adds the overlays.

- [ ] **Step 1: Write the failing tests**

```go
func TestPickTier(t *testing.T) {
    // §31/§49.3 thresholds:
    //   w < 40 || h < 24        -> TierTooSmall   (incl. 0x0 and negative values, Review Focus 1)
    //   w >= 62 && h >= 26      -> TierWide
    //   w >= 46                 -> TierMedium
    //   otherwise               -> TierSmall
    // table-driven, including the exact boundary pairs 39x24, 40x23, 40x24, 45x25, 46x24, 61x26, 62x26, 62x25
}

func TestChromeDropOrder(t *testing.T) {
    // §49.3: as height runs out the title border goes first, then mission control,
    // then stats labels (values stay)
    //   h >= 25 -> Title true, Mission true
    //   h == 24 -> Title false, Mission true
    // TierSmall -> StatLabels false, NextCount 3, Hold false
    // TierMedium -> StatLabels true, NextCount 3
    // TierWide -> StatLabels true, NextCount 5, Hold true
}

func TestTooSmallNoticeCopy(t *testing.T) {
    // contains "THIS UNIVERSE IS TOO SMALL", "resize terminal to continue",
    // "current: 34 × 19" for (34,19), and "needed: approximately 40 × 24"
}

func TestMiniPieceGeometry(t *testing.T) {
    // every kind renders 2 rows of exactly 8 columns stripped
}

func TestStatsPanelLabelsToggle(t *testing.T) {
    // labels true  -> lines include "SCORE", "LINES", "LEVEL" and the values
    // labels false -> the values appear and the words do not (§49.3)
    // score is zero-padded to 8 digits and lines/level to 3 and 2 (§4 mockup)
}

func TestNextPanelHonoursCount(t *testing.T) {
    // count 3 shows three previews, count 5 shows five, in queue order
}

func TestRenderFitsTheTerminal(t *testing.T) {
    // the load-bearing invariant (§41): for w in 20..100 and h in 10..40,
    // Render never panics, the stripped output has at most h lines, and every
    // stripped line has lipgloss.Width <= w
}

func TestRenderZeroSizeShowsNotice(t *testing.T) {
    // Review Focus 1: Scene with Width 0, Height 0 renders the too-small notice
}

func TestRenderNeverMutatesGame(t *testing.T) {
    // Snapshot() before == Snapshot() after Render for all three tiers (§37)
}

func TestGoldenLayouts(t *testing.T) {
    // ANSI-stripped goldens for fixtureScene at 80x30 (wide), 50x26 (medium),
    // 40x24 (small) and 80x30 in ModeASCII, compared against testdata/*.txt,
    // regenerated with -update
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestPickTier|TestChrome|TestRender|TestGolden' -v`
Expected: FAIL — `PickTier` undefined.

- [ ] **Step 3: Implement `layout.go`**

`PickTier` clamps nothing and compares as tabled above. `ChromeFor` applies §49.3's drop order. NEXT never stacks above or below the board — at `TierSmall` it sits beside the board truncated to 3 (§49.3) — and board plus controls are the last two rows standing.

- [ ] **Step 4: Implement `hud.go`**

`MiniPiece` renders a kind's rotation-0 cells into a 4×2 logical grid (8 terminal columns). `TitleLine` renders `╭─ ✦ COSMIC TETRIS ── LOCAL UNIVERSE <tag> ─╮`-style chrome padded to `width`, truncating the tag section first when space is tight. `MissionLine` prefixes `☄ MISSION CONTROL: ` (ASCII mode: `> MISSION CONTROL: `) and truncates to `width`. Every function in this file returns strings whose stripped width is exactly the width it was given, so the composition in `Render` cannot overflow.

- [ ] **Step 5: Implement `render.go`**

`Render` runs §37's steps 1, 3–5, 7, 8, 11, 12 (the FX steps land in the next plan): pick the tier, bail to `TooSmallNotice` for `TierTooSmall`, build the board box, join the side columns with `lipgloss.JoinHorizontal`, stack title/body/mission/controls with `lipgloss.JoinVertical`, then truncate to `Height` lines as a final guard. `UniverseTag(seed)` returns `fmt.Sprintf("%04X", uint16(seed))` so the §4 title tag is seed-derived and reproducible.

Write `fixtureScene(w, h int, m Mode) Scene` in `render_test.go`: `game.New(8675309)`, then a fixed script of moves, hard drops and `Advance` calls that leaves a partial stack, a held piece and a non-zero score. Every golden test uses it, so goldens change only when rendering changes. Treat §4's mockup as intent, not geometry (§49.7) — these goldens are the binding contract.

- [ ] **Step 6: Run tests to verify they pass**

Run: `go test ./internal/render/ -v` (first `go test ./internal/render/ -run TestGolden -update` to write `testdata`, then read each golden and confirm nothing overlaps and the board is intact)
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add internal/render/layout.go internal/render/hud.go internal/render/render.go internal/render/*_test.go internal/render/testdata
git commit -m "feat(render): adaptive layout tiers, HUD panels and scene renderer"
```

---

### Task 13: Pause, help and game-over overlays

**Files:**
- Create: `internal/render/overlays.go`
- Modify: `internal/render/render.go` (compose overlays)
- Test: `internal/render/overlays_test.go`, `internal/render/testdata/*.txt`

**Interfaces:**
- Consumes: Task 12.
- Produces: `func PauseOverlay(m Mode) []string`; `func HelpOverlay(body string, m Mode) []string`; `func GameOverOverlay(g *game.Game, m Mode) []string`; `func Overlay(base []string, panel []string) []string` (centres `panel` over `base`, returning the same line count and widths).

- [ ] **Step 1: Write the failing tests**

```go
func TestPauseOverlayCopy(t *testing.T) {
    // §30: contains "TEMPORAL SUSPENSION", "SPACE IS PAUSED", "p  resume"
}

func TestGameOverOverlayCopy(t *testing.T) {
    // §28: contains "UNIVERSE EXPIRED", "r  REBOOT UNIVERSE", "q  ACCEPT COSMIC DEATH"
    // and the game's Score/Lines/Level values, score thousands-separated (483,200)
}

func TestHelpOverlayFramesBody(t *testing.T) {
    // §39: contains "FLIGHT MANUAL" and every line of the body passed in
}

func TestOverlayPreservesDimensions(t *testing.T) {
    // Overlay returns the same number of lines as base and every stripped line
    // keeps its original width; a panel larger than base is truncated, not overflowed
}

func TestRenderComposesOverlays(t *testing.T) {
    // Scene{Paused: true} contains "TEMPORAL SUSPENSION" and still has <= Height lines
    // Scene{Over: true} contains "UNIVERSE EXPIRED"
    // Scene{Help: true, HelpBody: "x  y"} contains "FLIGHT MANUAL"
    // Over wins over Paused when both are set
}

func TestGoldenOverlays(t *testing.T) {
    // ANSI-stripped goldens at 80x30 for pause, game over and help
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run 'TestPause|TestGameOver|TestHelp|TestOverlay' -v`
Expected: FAIL — `PauseOverlay` undefined.

- [ ] **Step 3: Implement `overlays.go` and wire it into `Render`**

Panels are bordered with `Border(m)` via `lipgloss.NewStyle().Border(...)`. `Overlay` splices panel lines into the centre of the base line-by-line, using `lipgloss.PlaceHorizontal` on the panel so the composite keeps exact widths. In `Render`, apply overlays after step 8 and before the final height truncation; precedence is `Over` > `Paused` > `Help`.

Exact copy, from §28 and §30 (reproduce verbatim, including the subtitle `CAUSE: EXCESSIVE GEOMETRY`):

```text
UNIVERSE EXPIRED / SCORE / LINES / LEVEL / r  REBOOT UNIVERSE / q  ACCEPT COSMIC DEATH
TEMPORAL SUSPENSION / SPACE IS PAUSED / p  resume
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/overlays.go internal/render/render.go internal/render/overlays_test.go internal/render/testdata
git commit -m "feat(render): pause, help and game-over overlays"
```

---

### Task 14: Bubble Tea model, key map and frame clock

**Files:**
- Create: `internal/app/keys.go`, `internal/app/messages.go`, `internal/app/model.go`, `internal/app/update.go`
- Test: `internal/app/update_test.go`, `internal/app/keys_test.go`

**Interfaces:**
- Consumes: `game` (Tasks 1–9), `render` (Tasks 10–13).
- Produces:

```go
type Config struct {
    Seed          int64
    ASCII         bool
    NoFX          bool          // parsed here, consumed by the FX plan
    ReducedMotion bool          // parsed here, consumed by the FX plan
}

type KeyMap struct {
    Left, Right, SoftDrop, RotateCW, RotateCCW, HardDrop,
    Hold, Pause, Restart, Help, Quit key.Binding
}
func DefaultKeyMap() KeyMap
func (k KeyMap) ShortHelp() []key.Binding
func (k KeyMap) FullHelp() [][]key.Binding

type FrameMsg struct{ Now time.Time }
const FrameInterval = 16 * time.Millisecond
func FrameCmd() tea.Cmd

type Model struct { ... }          // Game *game.Game, cfg Config, w/h int, paused, over, showHelp, keys, help help.Model, last time.Time
func New(cfg Config) *Model
func (m *Model) Init() tea.Cmd
func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd)
func (m *Model) View() tea.View
func (m *Model) Scene() render.Scene
```

- [ ] **Step 1: Write the failing tests**

Tests drive `Update` directly with synthesised messages — no terminal needed. Build key presses as `tea.KeyPressMsg{Code: 'c'}` / `{Code: tea.KeyLeft}` and use a helper `press(m, "c")`.

```go
func TestKeyMapCoversSpecBindings(t *testing.T) {
    // §8: left has "left","h","a"; right "right","l","d"; soft drop "down","j","s";
    // rotate CW "up","k","x","w"; CCW "z"; hard drop "space"; hold "c"; pause "p";
    // restart "r"; help "?"; quit "q","esc","ctrl+c"
    // FullHelp descriptions match §39 exactly ("move spacecraft", "accelerate doom",
    // "rotate geometry", "rotate other way", "YEET", "quantum storage",
    // "suspend spacetime", "reboot universe", "abandon mission", "close this nonsense")
}

func TestMovementKeysActImmediately(t *testing.T) {
    // a left press changes Active.X without any FrameMsg in between (§8/§36)
}

func TestFrameMsgAdvancesByElapsedTime(t *testing.T) {
    // first FrameMsg only seeds the clock (dt 0, nothing moves)
    // a FrameMsg 800ms later moves the piece down exactly one row
    // Update always returns a fresh FrameCmd so the clock never stops
}

func TestPauseFreezesGameplay(t *testing.T) {
    // Review Focus 3: after "p", a FrameMsg 5s later leaves Snapshot() unchanged,
    // and left/right/space/c change nothing; a second "p" resumes and the clock
    // does not apply the paused interval as a jump
}

func TestGameOverIgnoresGameplayKeys(t *testing.T) {
    // Review Focus 3: force game over, then movement keys and FrameMsgs change nothing;
    // "r" restarts to the seeded start state; "q" returns the quit command
}

func TestHelpToggleDoesNotPause(t *testing.T) {
    // "?" sets showHelp and gameplay still advances on FrameMsg; "?" again clears it
}

func TestCtrlCQuits(t *testing.T) {
    // Review Focus 3: ctrl+c returns a non-nil quit command in every state
}

func TestResizeIsStoredAndNeverPanics(t *testing.T) {
    // WindowSizeMsg{0,0} then {34,19} then {200,60} then {80,30}: no panic,
    // View() is non-empty at each step (§31 "never crash from terminal resizing")
}

func TestViewBeforeFirstWindowSizeMsg(t *testing.T) {
    // Review Focus 1: View() on a fresh model (size 0x0) renders the too-small notice
}

func TestViewUsesAltScreen(t *testing.T) {
    // View().AltScreen == true
}

func TestASCIIConfigSelectsASCIIMode(t *testing.T) {
    // Config{ASCII: true} -> Scene().Mode == render.ModeASCII; otherwise ModeFull
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ -v`
Expected: FAIL — package undefined.

- [ ] **Step 3: Implement `keys.go` and `messages.go`**

`DefaultKeyMap` uses `key.NewBinding(key.WithKeys(...), key.WithHelp(...))`. Dispatch with `key.Matches(keyMsg, binding)` — in bubbles v2 it is generic over `fmt.Stringer`, and `tea.KeyPressMsg` satisfies it. `FrameCmd` is `tea.Tick(FrameInterval, func(t time.Time) tea.Msg { return FrameMsg{Now: t} })`.

Repeated movement while a key is held (§8) comes from the terminal's own auto-repeat — each repeat arrives as another `KeyPressMsg` and is applied immediately. No repeat timer, no extra state.

- [ ] **Step 4: Implement `model.go` and `update.go`**

`New` builds `game.New(cfg.Seed)` and a `help.Model`. `Init` returns `FrameCmd()`. `Update`:
- `tea.WindowSizeMsg`: store `Width`/`Height`.
- `tea.KeyPressMsg`: quit and `ctrl+c` first, then state guards — when `over`, only restart/quit/help act; when `paused`, only pause/quit/help/restart act; otherwise dispatch gameplay bindings. Discard the returned `[]game.Event` for now with a comment naming the FX plan as its consumer.
- `FrameMsg`: `dt = msg.Now.Sub(m.last)` (zero when `m.last.IsZero()`), store `m.last = msg.Now`, call `Advance(dt)` only when playing and not paused, set `m.over` when `Game.State == game.StateOver`, and always return `FrameCmd()`. Resuming from pause sets `m.last` to the resume frame so the paused span is never applied.

`View` returns `tea.View{Content: render.Render(m.Scene()), AltScreen: true}`. `Scene` fills `Mission: render.DefaultMission`, `Universe: render.UniverseTag(m.Game.Seed)`, `ControlsHint: m.help.ShortHelpView(m.keys.ShortHelp())`, and `HelpBody: m.help.FullHelpView(m.keys.FullHelp())`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `go test ./... -count=1`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add internal/app internal/app/*_test.go
git commit -m "feat(app): Bubble Tea model, key map, frame clock and state handling"
```

---

### Task 15: CLI entrypoint, docs, and playable smoke test

**Files:**
- Create: `cmd/cosmic-tetris/main.go`, `README.md`, `LICENSE`
- Test: `cmd/cosmic-tetris/main_test.go`

**Interfaces:**
- Consumes: `app.Config`, `app.New` (Task 14).
- Produces: `func parseFlags(args []string, now func() int64) (app.Config, error)`; `func main()`.

`parseFlags` takes a seed source so its default can be tested without a clock.

- [ ] **Step 1: Write the failing tests**

```go
func TestParseFlags(t *testing.T) {
    // §49.5 final surface: no flags -> Seed from now(), ASCII/NoFX/ReducedMotion false
    // --seed 1234 -> Seed 1234; --ascii -> ASCII; --no-fx -> NoFX; --reduced-motion -> ReducedMotion
    // an unknown flag returns an error
}

func TestUsageListsExactlyTheSupportedFlags(t *testing.T) {
    // the usage text names --seed, --ascii, --no-fx, --reduced-motion, --help and nothing else
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./cmd/cosmic-tetris/ -v`
Expected: FAIL — `parseFlags` undefined.

- [ ] **Step 3: Implement `main.go`**

`flag.NewFlagSet` with the five flags; default seed `time.Now().UnixNano()` (main may read the clock — the engine may not). `main` builds the model and runs `tea.NewProgram(app.New(cfg)).Run()`, exiting non-zero with the error on `stderr`.

- [ ] **Step 4: Run the tests and the whole suite**

Run: `go test ./... -count=1 && gofmt -l . && go vet ./...`
Expected: PASS, no gofmt output, no vet findings.

- [ ] **Step 5: Play it**

Run: `go run ./cmd/cosmic-tetris --seed 8675309`
Confirm by hand, then again with `--ascii` and in an 80×24 and a 38×18 window: pieces fall and respond instantly, ghost tracks the active piece, hold swaps, lines clear, level rises, `p` pauses, `?` opens the manual, `r` restarts, `q` quits cleanly and leaves the terminal usable, resizing mid-game never corrupts the board, and a window under 40×24 shows the notice.

- [ ] **Step 6: Write `README.md` and `LICENSE`**

README: what it is, `go build ./cmd/cosmic-tetris`, the five flags, the §8 key table, and a short "Architecture" section stating the three rules a future contributor must not break — the engine never reads a clock, rendering never mutates state, game RNG and FX RNG stay separate. `LICENSE`: MIT, copyright Jesse Vincent.

- [ ] **Step 7: Commit**

```bash
git add cmd README.md LICENSE
git commit -m "feat(cli): flags, entrypoint and docs for the playable build"
```

---

## Done when

Design.md §47's checklist, restricted to what this plan covers: playable from start through game over, immediate controls, resize works, hold works, ghost works, next queue works, deterministic piece generation, correct line clearing, rising gravity, pause works, restart works, ASCII fallback works, engine has comprehensive unit tests, renderer has representative snapshot tests, animations never block input, effects never modify game state (there are none yet, and the seam enforces it), and the game is fun with effects disabled.

Not covered here, by design: the cosmic-effects items of §43 and §47 (starfield, trails, particles, supernova clears, hard-drop impact, hyperdrive, four-line excess, black-hole game over, boot sequence, mission-control commentary). They are the second plan.
