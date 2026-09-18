### Task 2: Adaptive layout

**Files:**
- Create: `internal/render/layout.go`
- Test: `internal/render/layout_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```go
  const (
      MinWidth   = 40
      MinHeight  = 24
      BoardBoxW  = 22   // 20 columns + 2 border columns
      BoardBoxH  = 22   // 20 visible rows + 2 border rows
  )

  type Tier int
  const (TierSmall Tier = iota; TierMedium; TierWide)

  type Layout struct {
      Width, Height int
      TooSmall      bool
      Tier          Tier

      ShowTitle          bool
      ShowMissionControl bool
      ShowStatLabels     bool
      NextCount          int   // 5, or 3 at TierSmall

      BoardX, BoardY int  // top-left of the board's border box
      LeftX, LeftW   int  // HOLD + stats column; LeftW == 0 when absent
      RightX, RightW int  // NEXT column (plus stats when LeftW == 0)
      MissionY       int  // -1 when hidden
      ControlsY      int
      TitleY         int  // -1 when hidden
  }

  func Compute(width, height int) Layout
  ```
  Pinned rules — these are the numbers, and Task 9's goldens depend on them:

  - `TooSmall` when `width < MinWidth || height < MinHeight`. Every other field
    is zero-valued in that case.
  - Tier: `TierWide` at `width >= 64`, `TierMedium` at `width >= 50`, else
    `TierSmall`.
  - Row budget, dropped in §49.3's order as height shrinks: title frame costs 2
    rows, mission control 1, controls 1, board 22.
    `ShowTitle = height >= 26`; `ShowMissionControl = height >= 25`;
    `ShowStatLabels = height >= 27 && width >= 52`.
  - `ControlsY = height - 1`. `MissionY = height - 2` when shown, else `-1`.
    `TitleY = 0` when shown, else `-1`.
  - `BoardY = (ShowTitle ? 1 : 0) + (height - needed)/2`, where
    `needed = 22 + 1 + (mission?1:0) + (title?2:0)`.
  - `TierWide`: `BoardX = (width - BoardBoxW)/2`, `LeftW = 14`,
    `LeftX = max(0, BoardX-LeftW-1)`, `RightX = BoardX+BoardBoxW+1`,
    `RightW = min(14, width-RightX)`.
  - `TierMedium` and `TierSmall`: `BoardX = 1`, `LeftW = 0`, `LeftX = 0`,
    `RightX = BoardX + BoardBoxW + 1`, `RightW = width - RightX`.
  - `NextCount = 3` at `TierSmall`, else `5`.

- [ ] **Step 1: Write the failing tests in `internal/render/layout_test.go`**

```go
func TestTooSmallBelowMinimum(t *testing.T)
// TooSmall is true for (39,24), (40,23), (0,0), (1,1), (200,3), (34,19)
// TooSmall is false for (40,24) and (200,60)

func TestDegenerateSizesDoNotPanic(t *testing.T)
// Compute for (0,0), (-5,-5), (1,1), (0,100), (100,0): no panic, TooSmall true

func TestTierBoundaries(t *testing.T)
// (49,30) -> TierSmall... assert: width 40..49 TierSmall, 50..63 TierMedium,
// 64+ TierWide

func TestRowDropOrder(t *testing.T)   // §49.3
// height 24: !ShowTitle, !ShowMissionControl, !ShowStatLabels
// height 25: !ShowTitle, ShowMissionControl
// height 26: ShowTitle, ShowMissionControl, !ShowStatLabels
// height 27 with width 52: ShowStatLabels
// height 27 with width 40: !ShowStatLabels

func TestNextCountTruncatesAtSmall(t *testing.T)
// (40,30).NextCount == 3; (50,30).NextCount == 5; (80,30).NextCount == 5

func TestBoardAlwaysFitsInsideTheTerminal(t *testing.T)
// for every width 40..200 and height 24..60:
//   BoardX >= 0 && BoardX+BoardBoxW <= Width
//   BoardY >= 0 && BoardY+BoardBoxH <= Height
//   ControlsY < Height && BoardY+BoardBoxH <= ControlsY

func TestColumnsDoNotOverlapTheBoard(t *testing.T)
// for the same sweep: LeftX+LeftW <= BoardX (when LeftW > 0) and
// RightX >= BoardX+BoardBoxW and RightX+RightW <= Width

func TestWideLayoutHasBothColumns(t *testing.T)
// (80,30): LeftW == 14 && RightW == 14 && Tier == TierWide

func TestMediumAndSmallHaveOnlyTheRightColumn(t *testing.T)
// (50,30) and (40,30): LeftW == 0 && RightW > 0

func TestMissionAndControlsRowsNeverCollide(t *testing.T)
// whenever MissionY >= 0: MissionY == ControlsY-1
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'Layout|Tier|TooSmall|Board|Column|Mission|Next|Degenerate|RowDrop' -v`
Expected: build failure — `undefined: Compute`.

- [ ] **Step 3: Implement `internal/render/layout.go`**

Straight-line computation in the order the pinned rules are listed. Clamp
negative inputs to zero before the `TooSmall` check.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/layout.go internal/render/layout_test.go
git commit -m "feat(render): adaptive layout with pinned small-terminal drop order"
```
