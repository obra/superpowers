### Task 3: Board rendering — border, locked cells, ghost, active piece

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: `Canvas`, `Paint`, `Options`, palette functions (Task 1); `Layout`
  (Task 2); `game.Game`, `game.Board`, `game.Piece`, `game.GhostY` (plan 1).
- Produces:
  ```go
  // DrawBoard paints the border box, locked cells, ghost, and active piece.
  // borderPhase in [0,1) drives BorderPaint; callers pass 0 until plan 3.
  func DrawBoard(c *Canvas, l Layout, g *game.Game, opt Options, borderPhase float64)

  // CellOrigin maps a logical board cell to its terminal column/row inside the
  // border box. Plan 3 uses it to place board-local particles and trails.
  func CellOrigin(l Layout, x, y int) (col, row int)
  ```
  Border glyphs (§25): `╔ ═ ╗ ║ ╚ ╝` in full/reduced; `+ - + | + +` in ASCII.
  Draw order (§37): border, locked, ghost, active — so the active piece is never
  obscured and ghost cells never overwrite locked cells.

- [ ] **Step 1: Write the failing tests in `internal/render/board_test.go`**

```go
func TestCellOriginMapsToTwoColumnCells(t *testing.T)
// l := Compute(80,30)
// CellOrigin(l, 0, 2) == (l.BoardX+1, l.BoardY+1)      // first visible row
// CellOrigin(l, 1, 2) == (l.BoardX+3, l.BoardY+1)      // 2 columns per cell
// CellOrigin(l, 9, 21) == (l.BoardX+19, l.BoardY+20)   // last visible cell

func TestBorderBoxIsDrawn(t *testing.T)
// ANSI-stripped: the board's top row is "╔" + 20×"═" + "╗", the bottom is
// "╚"+...+"╝", and each of the 20 middle rows starts and ends with "║"

func TestASCIIBorderUsesASCIIOnly(t *testing.T)
// same shape with + - | and every rune < 128

func TestLockedCellsRenderWithTheirKindPaint(t *testing.T)
// commit a KindT piece low on the board, DrawBoard, then assert the two
// terminal columns at CellOrigin of each cell hold the block glyph and
// KindPaint(KindT, mode, false)

func TestHiddenRowsAreNotRendered(t *testing.T)
// fill board rows 0 and 1 (the spawn rows); the rendered box contains no block
// glyph anywhere

func TestActivePieceRendersBrighterThanLocked(t *testing.T)
// a locked KindI and an active KindI: the active cells' Paint is
// KindPaint(KindI,mode,true), the locked cells' is (…,false)

func TestGhostDrawnAtLandingPosition(t *testing.T)
// empty board, active KindO near the top: ghost glyphs appear at the rows
// corresponding to GhostY(), with GhostPaint

func TestGhostNeverObscuresLockedBlocks(t *testing.T)   // §10
// stack locked cells directly under the active piece so the ghost rests on
// them: every locked cell still shows its block glyph, not a ghost glyph

func TestGhostNeverObscuresTheActivePiece(t *testing.T)
// active piece already at GhostY(): the cells show the active glyph/paint

func TestGhostHiddenInNoFXMode(t *testing.T)
// opt.NoFX does NOT hide the ghost — it is gameplay, not an effect:
// assert ghost glyphs are still present with NoFX true

func TestDrawBoardDoesNotMutateGame(t *testing.T)   // §37
// snapshot *g (board, active, score) before and after DrawBoard; assert equal

func TestDrawBoardOnTooSmallLayoutIsANoOp(t *testing.T)
// Compute(10,10) -> DrawBoard does not panic and leaves the canvas blank
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'Board|Ghost|Active|CellOrigin|Border' -v`
Expected: build failure — `undefined: DrawBoard`.

- [ ] **Step 3: Implement `internal/render/board.go`**

Iterate visible rows `y = game.HiddenRows .. game.Height-1`, mapping through
`CellOrigin`, writing glyphs with `SetString`. Skip ghost cells whose board cell
is filled or belongs to the active piece. Return early when `l.TooSmall`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): board border, locked cells, ghost, and active piece"
```
