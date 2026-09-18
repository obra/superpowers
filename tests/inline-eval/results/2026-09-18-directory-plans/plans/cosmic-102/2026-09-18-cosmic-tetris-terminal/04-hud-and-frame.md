### Task 4: HUD, title, mission-control line, and the `Render(Frame)` entry point

**Files:**
- Create: `internal/render/hud.go`
- Create: `internal/render/render.go`
- Test: `internal/render/hud_test.go`

**Interfaces:**
- Consumes: `Canvas`, palette (Task 1); `Layout` (Task 2); `DrawBoard` (Task 3).
- Produces:
  ```go
  // hud.go
  func DrawHUD(c *Canvas, l Layout, g *game.Game, opt Options)
  func DrawTitle(c *Canvas, l Layout, opt Options, universe string)
  func DrawMissionControl(c *Canvas, l Layout, opt Options, status string)
  func DrawControls(c *Canvas, l Layout, opt Options)
  func DrawTooSmall(c *Canvas, opt Options, width, height int)
  func UniverseLabel(seed int64) string   // 4 uppercase hex digits of seed&0xFFFF

  // render.go — the single entry point; plan 3 adds FX and Overlay fields
  type Frame struct {
      Game        *game.Game
      Layout      Layout
      Opts        Options
      Status      string   // mission-control text, without the prefix
      BorderPhase float64  // 0 until plan 3
  }
  func Render(f Frame) string
  ```
  Exact copy, pinned (ASCII mode substitutes the bracketed alternative):

  - Title: `✦ COSMIC TETRIS` at `LeftX`-or-1, and `LOCAL UNIVERSE <label>`
    right-aligned on `TitleY`. [ASCII: `* COSMIC TETRIS`]
  - Above the board: `✦ VELOCITY: 03` (level, zero-padded to 2). [ASCII: `* VELOCITY: 03`]
  - Stats: `SCORE` / `00129340` (8 digits, zero-padded), `LINES` / `042`
    (3 digits), `LEVEL` / `07` (2 digits). With `ShowStatLabels` false the
    labels are omitted and only the values render (§49.3).
  - `HOLD` and `NEXT` headers over 8-column × 2-row piece previews, one preview
    per upcoming piece up to `l.NextCount`.
  - Mission control: `☄ MISSION CONTROL: <status>`, truncated to the terminal
    width. [ASCII: `> MISSION CONTROL: <status>`]
  - Controls: `←→ move   ↑ rotate   ↓ descend   SPACE YEET   C hold   ? help`,
    truncated from the right at narrow widths. [ASCII: `<> move  ^ rotate  v descend  SPACE YEET  C hold  ? help`]
  - Too-small notice, centered (§31):
    ```
    THIS UNIVERSE IS TOO SMALL

    resize terminal to continue

    current: 34 × 19
    needed: approximately 40 × 24
    ```
    [ASCII: `x` in place of `×`]

- [ ] **Step 1: Write the failing tests in `internal/render/hud_test.go`**

```go
func TestUniverseLabel(t *testing.T)
// UniverseLabel(0x7F3A) == "7F3A"; UniverseLabel(1) == "0001";
// UniverseLabel(0x1234ABCD) == "ABCD"; UniverseLabel(-1) == "FFFF"

func TestStatsZeroPadding(t *testing.T)
// Score 129340 renders "00129340"; Lines 42 -> "042"; Level 7 -> "07"
// Score 1234567890 renders in full without truncation (no lost digits)

func TestStatLabelsDroppedWhenLayoutSaysSo(t *testing.T)   // §49.3
// with ShowStatLabels false the output contains "042" but not "LINES"

func TestHoldSlotEmptyAndOccupied(t *testing.T)
// empty hold: "HOLD" header present, no block glyphs in the hold preview area
// after UseHold(): the held kind's glyphs appear with its KindPaint

func TestNextQueueShowsLayoutCount(t *testing.T)
// TierWide: 5 previews rendered; TierSmall: exactly 3   (§49.3)

func TestNextNeverStacksAboveOrBelowTheBoard(t *testing.T)   // §49.3
// at every width 40..80: every NEXT glyph's column is >= BoardX+BoardBoxW

func TestMissionControlLinePrefix(t *testing.T)
// full mode line starts with "☄ MISSION CONTROL: "; ASCII with "> MISSION CONTROL: "
// a 400-char status is truncated to the terminal width, never wrapped

func TestMissionControlOmittedWhenHidden(t *testing.T)
// Compute(60,24) has MissionY == -1: output contains no "MISSION CONTROL"

func TestControlsLineTruncatesNotWraps(t *testing.T)
// at width 40 the controls row is exactly one line and <= 40 display columns

func TestTooSmallNoticeReportsBothSizes(t *testing.T)
// DrawTooSmall(c, opt, 34, 19) contains "THIS UNIVERSE IS TOO SMALL",
// "current: 34 × 19", "needed: approximately 40 × 24"

func TestRenderProducesExactlyHeightLines(t *testing.T)
// for (40,24), (56,26), (80,30), (200,60), (10,10): the returned string,
// ANSI-stripped, has exactly Height lines, each <= Width display columns

func TestRenderOnTooSmallShowsOnlyTheNotice(t *testing.T)
// (30,20): output contains the notice and no board border glyph

func TestRenderDoesNotMutateGame(t *testing.T)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/render/ -run 'HUD|Universe|Stats|Hold|Next|Mission|Controls|TooSmall|Render' -v`
Expected: build failure — `undefined: Render`.

- [ ] **Step 3: Implement `internal/render/hud.go`**

Piece previews reuse `BlockGlyph` and `KindPaint` with `Offsets(kind, 0)`,
drawn into an 8×2 box so every kind aligns. Build the ASCII/Unicode copy pairs
as a small table keyed by `Mode` rather than branching at each call site.

- [ ] **Step 4: Implement `Render` in `internal/render/render.go`**

`Render` allocates a `Canvas` of the layout's size and calls, in §37's order:
too-small notice (and return), title, `DrawBoard`, `DrawHUD`,
`DrawMissionControl`, `DrawControls`. Plan 3 inserts its FX compositing steps
here.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/render/hud.go internal/render/render.go internal/render/hud_test.go
git commit -m "feat(render): HUD, title, mission-control line, frame entry point"
```
