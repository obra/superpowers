### Task 6: Render pipeline and golden layout tests

**Files:**
- Modify: `internal/render/render.go` (adds the pipeline to Task 2's types)
- Test: `internal/render/render_test.go`
- Create: `internal/render/testdata/` (golden files, written by the test's `-update` flag)

**Interfaces:**
- Consumes: everything from Tasks 2–5.
- Produces:
```go
func Render(s Scene) string
// The single entry point the app calls. Never mutates s.Game.
```

Pipeline order, §37 steps 1 and 3–8 and 11–12 (steps 2, 6, 9, 10 — starfield, board FX, global FX, banners — are composited by plan 3 and plan 4, which insert into this same function):

```text
1. l := Compute(s.Width, s.Height); if l.TooSmall return TooSmallNotice(...)
2. board := borderBox(boardPanel(s, p), p, borderPhase(s))
3. left  := holdPanel + statsPanel      (LayoutWide/LayoutMedium only)
4. right := nextPanel
5. join the three columns horizontally at l.BoardLeft
6. prepend titleLine when l.ShowTitle
7. append missionLine when l.ShowMission
8. append controlsLine (always)
9. pad the result to exactly s.Height lines and s.Width columns
```

`borderPhase(s Scene) float64` returns `0` in this plan; plan 3 makes it a function of `s.Elapsed`. In `LayoutSmall` the side columns collapse to the NEXT previews beside the board and stats render under the board's bottom border in value-only form.

The final output is always exactly `s.Height` lines, each exactly `s.Width` columns — that invariant is what stops flicker and stray scrollback.

- [ ] **Step 1: Write the failing test**

`internal/render/render_test.go`:

```go
var update = flag.Bool("update", false, "rewrite golden files")

func golden(t *testing.T, name, got string)
// compares stripANSI(got) against testdata/<name>.txt; rewrites it when -update is set

func TestRenderGoldens(t *testing.T)
// a deterministic scene: g := game.New(8675309), then a fixed script of
//   ~12 Apply/Advance calls (recorded in the test) so the board has locked cells,
//   a hold, a non-zero score, and Mission set to "GRAVITY REMAINS MOSTLY LEGAL"
// subtests, each with its own golden file:
//   "wide"    80×30
//   "medium"  50×28
//   "small"   42×24
//   "ascii"   80×30 with Opts.Mode = ModeASCII
//   "toosmall" 34×19

func TestRenderExactDimensions(t *testing.T)
// for sizes (40,24) (41,25) (46,26) (64,27) (80,30) (120,40) (300,100):
//   Render returns exactly h lines, each exactly w columns (ANSI-stripped)

func TestHugeTerminalDoesNotStretchBoard(t *testing.T)   // Review Focus
// Render at 300×100: the row containing the board's top border has exactly one
//   run of 22 border columns, and that run starts at Compute(300,100).BoardLeft

func TestRenderDoesNotMutateGame(t *testing.T)
// before := g.Snapshot(); Render(scene) twice; g.Snapshot() equals before

func TestRenderIsStableForSameScene(t *testing.T)
// two Render calls on the same Scene return byte-identical strings
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -run TestRenderGoldens -v`
Expected: FAIL — `undefined: Render`.

- [ ] **Step 3: Implement `Render` and `borderPhase` in `internal/render/render.go`**

Compose columns with `lipgloss.JoinHorizontal`/`JoinVertical`, then apply one final width/height clamp.

- [ ] **Step 4: Generate and read the goldens**

Run: `go test ./internal/render/ -run TestRenderGoldens -update`
Then open each file in `internal/render/testdata/` and check by eye: nothing overlaps, the board is 20×20 cells inside a 22×22 box, the HUD sits beside it, no line exceeds the terminal width, and the small layout still shows board, NEXT (3), score values, and controls. Fix the renderer and regenerate if any of that is wrong — do not accept a golden you have not read.

- [ ] **Step 5: Run the full suite**

Run: `go test ./... && go vet ./...`
Expected: PASS, clean.

- [ ] **Step 6: Commit**

```bash
git add internal/render/render.go internal/render/render_test.go internal/render/testdata
git commit -m "feat(render): frame pipeline with golden layout tests"
```
