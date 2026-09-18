### Task 4: Board, ghost, and active piece rendering

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: `Scene`, `Palette`, `Glyphs` (Task 2); `Layout`, `BoardCols` (Task 3); `game.Board`, `game.Piece`, `Game.Ghost`, `game.Width/Height/HiddenRows` (plan 1).
- Produces:
```go
func boardPanel(s Scene, p Palette) string
// 20 lines × 20 columns of cell glyphs, no border, no padding

func borderBox(content string, p Palette, phase float64) string
// wraps content in the §25 frame: ╔═╗ ║ ╚═╝ in ModeFull/ModeReduced, +-| in ModeASCII
```

Paint order inside `boardPanel`, which is §37 steps 3–5 for the board's own cells: locked cells, then the ghost piece, then the active piece. Ghost cells are only drawn where the board is empty, so a ghost can never obscure a locked block (§10). The active piece is drawn last and always wins (§44).

Only the 20 visible rows (`y = game.HiddenRows .. game.Height-1`) appear. A piece cell with `y < game.HiddenRows` is simply not drawn.

- [ ] **Step 1: Write the failing test**

`internal/render/board_test.go`:

```go
func TestBoardPanelDimensions(t *testing.T)
// s := testScene(game.New(1), 80, 30)   // helper: builds a Scene with ModeFull, FX off
// out := stripANSI(boardPanel(s, NewPalette(ModeFull)))
// 20 lines; every line is exactly BoardCols (20) columns wide by lipgloss.Width

func TestBoardPanelDrawsLockedCells(t *testing.T)
// write a cell at (0,21) directly into s.Game.Board.Cells
// the last line starts with "██" and the rest of that line is spaces

func TestGhostDoesNotObscureLockedBlocks(t *testing.T)
// fill row 21 entirely, leave the active piece high above it
// the ghost rests on row 20; line 21 (the filled row) contains no "░░"

func TestActivePieceDrawnOverGhost(t *testing.T)
// place the active piece one row above its landing row
// the active piece's own cells render as "██", not "░░"

func TestHiddenRowsNotRendered(t *testing.T)
// a fresh game's active piece sits in rows 0..1 (hidden)
// the panel contains no block glyph at all

func TestASCIIModeGlyphs(t *testing.T)
// same scene in ModeASCII: locked cells render "[]", ghost renders "··",
// and every line is still exactly 20 columns wide

func TestBorderBoxDimensions(t *testing.T)
// borderBox(boardPanel(...), p, 0) is 22 lines of 22 columns
// ModeFull corners are ╔ ╗ ╚ ╝; ModeASCII corners are all "+"
```

Add the two shared helpers to this file (later tasks and plans reuse them):

```go
func testScene(g *game.Game, w, h int) Scene   // Phase: PhasePlaying, Opts: {ModeFull, FX: false}
func stripANSI(s string) string                // regexp: \x1b\[[0-9;?]*[ -/]*[@-~]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -run TestBoardPanel -v`
Expected: FAIL — `undefined: boardPanel`.

- [ ] **Step 3: Implement `internal/render/board.go`**

Build each row into a `strings.Builder` over a `[game.Width]` scratch array of `{Cell, active bool}` so styling happens once per cell and the paint order stays obvious.

- [ ] **Step 4: Run the tests**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): board, ghost, and active piece rendering"
```
