### Task 3: Responsive layout decisions

**Files:**
- Create: `internal/render/layout.go`
- Test: `internal/render/layout_test.go`

**Interfaces:**
- Consumes: `Scene` (Task 2).
- Produces:
```go
type LayoutKind uint8
const (LayoutSmall LayoutKind = iota; LayoutMedium; LayoutWide)

type Layout struct {
    Kind            LayoutKind
    TooSmall        bool
    BoardLeft       int   // column where the board box starts (board is centred)
    BoardWidth      int   // always BoardCols + 2 == 22
    ShowTitle       bool
    ShowMission     bool
    ShowStatLabels  bool
    NextCount       int   // 5 wide/medium, 3 small
    SidePanelWidth  int   // columns available to each side column; 0 in LayoutSmall
}

const (
    MinWidth  = 40
    MinHeight = 24
    BoardCols = 2 * game.Width   // 20
)

func Compute(width, height int) Layout
func TooSmallNotice(width, height int) string
```

Thresholds, pinned so the goldens and the drop order agree (§31, §49.3):

```text
TooSmall:        width < 40 || height < 24
LayoutWide:      width >= 64
LayoutMedium:    width >= 46
LayoutSmall:     otherwise
ShowTitle:       height >= 27      (first to go)
ShowMission:     height >= 26
ShowStatLabels:  height >= 25
SidePanelWidth:  (width - BoardWidth) / 2 - 1, floored at 0; 0 in LayoutSmall
NextCount:       3 in LayoutSmall, else 5
```

NEXT never stacks above or below the board; in `LayoutSmall` it sits beside the board truncated to 3 pieces (§49.3). Board and controls are the last two elements standing. `BoardLeft` centres the 22-column board box and is always even-aligned so a 2-column cell never straddles a boundary.

`TooSmallNotice` renders §31's text with the live numbers:

```text
THIS UNIVERSE IS TOO SMALL

resize terminal to continue

current: 34 × 19
needed: approximately 40 × 24
```

- [ ] **Step 1: Write the failing test**

`internal/render/layout_test.go`:

```go
func TestComputeKinds(t *testing.T)
// (80,30) -> LayoutWide; (50,30) -> LayoutMedium; (42,26) -> LayoutSmall

func TestComputeTooSmall(t *testing.T)
// (39,30), (80,23), (34,19) all have TooSmall == true
// (40,24) has TooSmall == false

func TestDegenerateSizes(t *testing.T)   // Review Focus
// (0,0), (1,1), (-5,-5) return TooSmall == true, and every int field is >= 0
// TooSmallNotice(0,0) returns a non-empty string containing "current: 0 × 0"

func TestHeightDropOrder(t *testing.T)   // Review Focus
// height 30: ShowTitle && ShowMission && ShowStatLabels
// height 26: !ShowTitle && ShowMission && ShowStatLabels
// height 25: !ShowTitle && !ShowMission && ShowStatLabels
// height 24: !ShowTitle && !ShowMission && !ShowStatLabels

func TestNextCountShrinks(t *testing.T)
// LayoutWide and LayoutMedium: NextCount == 5; LayoutSmall: NextCount == 3

func TestBoardIsCentredAndEven(t *testing.T)   // Review Focus
// widths 40..120, including odd ones: BoardLeft is even, BoardLeft >= 0,
// and BoardLeft + BoardWidth <= width

func TestHugeTerminalKeepsBoardWidth(t *testing.T)   // Review Focus
// Compute(300, 100).BoardWidth == BoardWidth and Kind == LayoutWide
// SidePanelWidth is bounded (<= 40) so the HUD stays next to the board
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -run TestCompute -v`
Expected: FAIL — `undefined: Compute`.

- [ ] **Step 3: Implement `internal/render/layout.go`**

Clamp negative inputs to 0 before any arithmetic, and cap `SidePanelWidth` at 40 so an enormous terminal does not push the HUD to the screen edges.

- [ ] **Step 4: Run the tests**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/layout.go internal/render/layout_test.go
git commit -m "feat(render): responsive layout thresholds and too-small notice"
```
