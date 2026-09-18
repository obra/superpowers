### Task 9: Golden snapshots and the resize sweep

**Files:**
- Create: `internal/render/golden_test.go`
- Create: `internal/render/testdata/*.golden`
- Test: `internal/render/resize_test.go`

**Interfaces:**
- Consumes: `Render`, `Frame`, `Compute`, `Options` (Tasks 1–7).
- Produces: the binding layout contract (§41, §49.7). Later plans re-record
  these goldens only when a deliberate layout change says so.

Each case renders a **fixed** game state so the golden is stable: build it with
`game.New(4242)` plus a scripted sequence of moves and `Advance` calls in a
helper `fixtureGame(t)` — no clock, no live RNG, `BorderPhase: 0`.

- [ ] **Step 1: Write the failing golden test in `internal/render/golden_test.go`**

```go
var cases = []struct{
    name          string
    w, h          int
    mode          Mode
    overlay       Overlay
}{
    {"wide", 80, 30, ModeFull, OverlayNone},
    {"medium", 56, 27, ModeFull, OverlayNone},
    {"small", 40, 24, ModeFull, OverlayNone},
    {"pause", 80, 30, ModeFull, OverlayPaused},
    {"gameover", 80, 30, ModeFull, OverlayGameOver},
    {"help", 80, 30, ModeFull, OverlayHelp},
    {"ascii", 80, 30, ModeASCII, OverlayNone},
    {"toosmall", 34, 19, ModeFull, OverlayNone},
}

func TestGolden(t *testing.T)
// for each case: got := stripANSI(Render(frame)); compare against
// testdata/<name>.golden; -update rewrites the files

func TestGoldenInvariants(t *testing.T)   // §41's four goals
// for each case's output:
//   - exactly h lines
//   - every line exactly w display columns wide (uniseg/rune width, not bytes)
//   - when not too-small: exactly one board top-border row and one bottom row,
//     each 22 columns wide, and 20 rows between them whose first and last
//     glyph are the vertical border
//   - no HUD text intrudes between a row's two border glyphs
```

Add the `-update` flag: `var update = flag.Bool("update", false, "rewrite goldens")`.

- [ ] **Step 2: Run the golden test to verify it fails**

Run: `go test ./internal/render/ -run Golden -v`
Expected: FAIL — missing `testdata/*.golden` files.

- [ ] **Step 3: Record the goldens, then read every one of them**

Run: `go test ./internal/render/ -run Golden -update && go test ./internal/render/ -run Golden -v`
Expected: PASS. Then open each `.golden` file and check by eye that it looks like
§4's layout: board centered, HOLD and stats left, NEXT right, mission control and
controls at the bottom, nothing overlapping. Fix the renderer (not the golden) if
it does not.

- [ ] **Step 4: Write the resize sweep in `internal/render/resize_test.go`**

```go
func TestRenderNeverPanicsAcrossSizes(t *testing.T)
// every width 0..120 × every height 0..48, all three modes, all four overlays:
// Render must not panic and must return exactly max(h,0) lines... for h == 0
// it returns ""

func TestNoLineExceedsTerminalWidth(t *testing.T)
// same sweep: every ANSI-stripped line's display width <= w
// (a single over-wide line wraps and destroys the board)

func TestResizeSequenceIsStateless(t *testing.T)
// render 80x30, then 40x24, then 80x30 again with the same game: the first and
// third outputs are byte-identical
```

- [ ] **Step 5: Run the full suite**

Run: `go vet ./... && go test ./... -race`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/render/golden_test.go internal/render/testdata internal/render/resize_test.go
git commit -m "test(render): golden layout contract and full resize sweep"
```

- [ ] **Step 7: Confirm the Phase 2 gate (§42)**

Play `./cosmic-tetris` for a few minutes and confirm §42's claim: it is already a
genuinely good game. Controls immediate, ghost useful, next queue readable,
resize smooth, no flicker. Only then start plan 3.
