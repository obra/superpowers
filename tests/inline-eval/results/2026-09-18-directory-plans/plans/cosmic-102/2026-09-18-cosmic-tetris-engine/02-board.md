### Task 2: Board — collision, bounds, row completion, collapse

**Files:**
- Create: `internal/game/board.go`
- Test: `internal/game/board_test.go`

**Interfaces:**
- Consumes: `Piece`, `PieceKind` (Task 1).
- Produces:
  ```go
  const (
      Width       = 10
      Height      = 22
      VisibleRows = 20
      HiddenRows  = 2   // Height - VisibleRows
  )

  type Cell struct {
      Filled bool
      Kind   PieceKind
  }

  type Board struct {
      Cells [Height][Width]Cell
  }

  func (b *Board) InBounds(x, y int) bool
  func (b *Board) At(x, y int) Cell                  // zero Cell when out of bounds
  func (b *Board) Fits(p Piece) bool                 // all cells in bounds and empty
  func (b *Board) Commit(p Piece)                    // fill p's cells with p.Kind
  func (b *Board) FullRows() []int                   // ascending row indices
  func (b *Board) ClearRows(rows []int)              // remove and collapse from above
  func (b *Board) RowEmpty(y int) bool
  ```

- [ ] **Step 1: Write the failing tests in `internal/game/board_test.go`**

Use a helper that builds a board from strings so cases read clearly — `#` filled,
`.` empty, one string per row, bottom row last:

```go
func boardFrom(rows ...string) *Board   // panics on malformed input; test helper
```

```go
func TestInBoundsRejectsOutsideGeometry(t *testing.T)
// (0,0) and (9,21) in bounds; (-1,0), (10,0), (0,-1), (0,22) out

func TestFitsRejectsSideWalls(t *testing.T)
// Piece{KindI,0,-1,5} does not fit (x=-1); Piece{KindI,0,7,5} does not fit (x=10)

func TestFitsRejectsFloor(t *testing.T)
// Piece{KindO,0,4,21} does not fit: its lower row is y=22

func TestFitsRejectsOccupiedCell(t *testing.T)
// board with (4,20) filled; Piece{KindO,0,4,19} does not fit, Piece{KindO,0,0,19} does

func TestCommitStoresKind(t *testing.T)
// after Commit(Piece{KindT,0,4,5}): At(5,5).Filled && At(5,5).Kind == KindT,
// At(4,5) not filled

func TestFullRowsFindsCompleteRowsAscending(t *testing.T)
// board whose rows 19 and 21 are all '#' and row 20 has one gap
// -> FullRows() == []int{19, 21}

func TestFullRowsEmptyWhenNoneComplete(t *testing.T)   // returns empty/nil slice

func TestClearRowsCollapsesFromAbove(t *testing.T)
// rows (bottom three): "..........", "##########", "#........."
// ClearRows([]int{20}) leaves bottom two rows "..........", "#........."
// and the row above them empty

func TestClearRowsHandlesFourAtOnce(t *testing.T)
// four full rows at 18..21 with a single filled cell at (0,17)
// after ClearRows: (0,21) filled, rows 0..20 empty

func TestClearRowsNonContiguous(t *testing.T)
// full rows 19 and 21, with (0,20) filled and (1,18) filled
// after ClearRows([]int{19,21}): (0,21) filled, (1,20) filled, nothing else
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/game/ -run Board -v`
Expected: build failure — `undefined: Board`.

- [ ] **Step 3: Implement `internal/game/board.go`**

`ClearRows` walks from the bottom upward with a write cursor and a read cursor,
skipping rows in the cleared set, then zeroes the rows above the write cursor.
`FullRows` scans every row including the hidden ones.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/game/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/game/board.go internal/game/board_test.go
git commit -m "feat(game): board collision, row completion, and collapse"
```
