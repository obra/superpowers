### Task 2: Board, collision, and row collapse

**Files:**
- Create: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Piece`, `PieceKind`, `Piece.Cells()` (Task 1).
- Produces:
```go
const (Width = 10; Height = 22; VisibleRows = 20; HiddenRows = 2)

type Cell uint8
const Empty Cell = 0
func CellFor(k PieceKind) Cell          // Cell(k) + 1
func (c Cell) Kind() (PieceKind, bool)  // false when Empty

type Board struct { Cells [Height][Width]Cell }

func (b *Board) At(x, y int) Cell             // Empty when out of range
func (b *Board) Blocked(x, y int) bool        // true if filled, or x outside [0,Width), or y >= Height; false for y < 0
func (b *Board) Collides(p Piece) bool        // any of p's cells Blocked
func (b *Board) Place(p Piece)                // writes CellFor(p.Kind) at each of p's in-range cells
func (b *Board) CompleteRows() []int          // ascending row indices, all Width cells filled
func (b *Board) ClearRows(rows []int)         // removes those rows, everything above falls, top rows become Empty
```

`Blocked` returning false above the top (`y < 0`) is what lets a piece spawn and rotate partly above the board without an out-of-range panic.

- [ ] **Step 1: Write the failing test**

`internal/game/board_test.go`:

```go
func TestBlockedBounds(t *testing.T)
// empty board: Blocked(-1, 5) == true; Blocked(Width, 5) == true; Blocked(3, Height) == true
// Blocked(3, -1) == false; Blocked(3, 5) == false

func TestCollidesWithFilledCell(t *testing.T)
// Place a T at X=3,Y=10; a second identical piece Collides; the same piece at Y=6 does not

func TestCellRoundTrip(t *testing.T)
// for each kind: CellFor(k).Kind() returns (k, true); Empty.Kind() returns (_, false)

func TestCompleteRowsAscending(t *testing.T)
// fill rows 21 and 19 entirely, plus 4 cells of row 20
// CompleteRows() == []int{19, 21}

func TestClearRowsNonContiguous(t *testing.T)   // Review Focus
// fill rows 5 and 9 completely; put a single marker cell at (0,7) and (0,4)
// ClearRows([]int{5, 9})
// row 9 now holds what was row 7 (marker at (0,9)), row 6 holds old row 4 (marker at (0,6))
// rows 0 and 1 are entirely Empty; total filled cell count dropped by exactly 2*Width

func TestClearRowsBottomOnly(t *testing.T)
// fill row 21; marker at (2,20); ClearRows([]int{21}); marker is now at (2,21)

func TestPlaceIgnoresCellsAboveTop(t *testing.T)
// Place a piece with Y=-1 does not panic and writes only its y>=0 cells
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/game/ -run TestBlocked -v`
Expected: FAIL — `undefined: Board`.

- [ ] **Step 3: Implement `internal/game/board.go`**

`ClearRows` is the one place worth care: copy surviving rows downward from the bottom up in a single pass so non-contiguous input is handled without repeated shifting.

- [ ] **Step 4: Run the tests**

Run: `go test ./internal/game/ -v`
Expected: PASS, including Task 1's tests.

- [ ] **Step 5: Commit**

```bash
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board storage, collision, and row collapse"
```
