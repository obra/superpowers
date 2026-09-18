### Task 13: Integration, FX goldens, and the definition of done

**Files:**
- Modify: `internal/render/render.go` (final pipeline order)
- Modify: `internal/render/golden_test.go` (FX cases)
- Create: `internal/render/testdata/fx-*.golden`
- Create: `internal/app/integration_test.go`
- Modify: `README.md`
- Test: `internal/fx/isolation_test.go` (cross-RNG determinism)

**Interfaces:**
- Consumes: everything from plans 1–3.
- Produces: the §37 pipeline order, frozen by tests; the §47 audit.

Final `Render` order (§37), asserted by this task:
1. layout → 2. starfield → 3. locked board → 4. ghost → 5. active piece →
6. board-local FX (trails, line clears) → 7. border → 8. HOLD/NEXT/stats →
9. global FX (particles, shockwaves) → 10. banners → 11. mission control →
12. controls/help. Boot and the too-small notice short-circuit before step 2;
overlays draw last.

- [ ] **Step 1: Write the failing cross-RNG determinism test in `internal/fx/isolation_test.go`**

```go
func TestFXActivityCannotChangePieceOrder(t *testing.T)   // §35, §49.6
// two identical (game, world) pairs from seed 8675309, driven by the same
// input/dt script; in the second, additionally emit 500 particles, 20
// shockwaves, and 10 hyperdrives between steps.
// Assert: identical Active, Next, Board, and Score at the end.

func TestGameAndFXSeedsDiffer(t *testing.T)
// the seed main.go derives for fx is not equal to the game seed
```

- [ ] **Step 2: Write the failing pipeline and mode tests, extending `golden_test.go`**

```go
var fxCases = []struct{ name string; w, h int; mode Mode; opts Options }{
    {"fx-wide", 80, 30, ModeFull, Options{}},
    {"fx-nofx", 80, 30, ModeFull, Options{NoFX: true}},
    {"fx-reduced", 80, 30, ModeFull, Options{ReducedMotion: true}},
    {"fx-ascii", 80, 30, ModeASCII, Options{}},
    {"fx-small", 40, 24, ModeFull, Options{}},
}

func TestFXGolden(t *testing.T)
// each case uses fixtureGame(t) plus fixtureWorld(t) — a world advanced through
// a fixed script (hard drop, a 4-line clear, a level-up) to a fixed Elapsed,
// so the frame is deterministic. Compare ANSI-stripped against testdata.

func TestNoFXFrameEqualsPlanTwoFrame(t *testing.T)   // §47 "fun with FX off"
// Options{NoFX:true} with a disabled world renders byte-identically to
// Render(Frame{FX:nil}) for the same game and layout

func TestReducedMotionHasNoShakeAtAnySample(t *testing.T)   // §49.5
// drive 200 frames of heavy events: Shake() is (0,0) every frame, no
// shockwaves exist, and the board's border glyph never moves

func TestFXNeverCorruptsTheBoard(t *testing.T)   // §41, §44
// across 500 frames of heavy events at 40x24, 56x27 and 80x30:
// every frame has exact line count and width, exactly one board box of the
// right size, and every cell inside the box holds a block, ghost, trail,
// clear-animation or blank glyph — nothing else

func TestPipelineOrderIsFrozen(t *testing.T)
// a board cell covered by all of {locked block, ghost, trail, particle,
// shockwave} shows the locked block; a cell with {ghost, trail, particle}
// shows the ghost; a cell with {trail, particle} shows the trail
```

- [ ] **Step 3: Write the failing end-to-end test in `internal/app/integration_test.go`**

```go
func TestInputNeverBlocksDuringEffects(t *testing.T)   // §20, §44
// trigger a four-line clear, then within the banner's life send 10 left
// presses interleaved with FrameMsgs: all 10 moved the piece

func TestFrameBudgetUnderHeavyFX(t *testing.T)   // §38
// with 600 live particles, 2 shockwaves, 3 banners and a clear animation at
// 80x30: benchmark-style assertion that one Update(FrameMsg)+View() pair takes
// under 8ms on this machine (half the 16ms frame)

func TestFXNeverModifiesGameState(t *testing.T)   // §14, §47
// deep-copy the game before a heavy FX sequence driven only through
// Observe/Advance; assert the copy still matches

func TestFullSessionDoesNotPanic(t *testing.T)
// scripted 3-minute session (seeded inputs, 16ms frames) through game over and
// restart, with resizes at random frames: no panic, ends in StatePlaying
```

- [ ] **Step 4: Run all three groups to verify they fail**

Run: `go test ./... -run 'FXGolden|Pipeline|Integration|Determinism|NoFX|Reduced' -v`
Expected: FAIL — missing goldens and missing pipeline ordering.

- [ ] **Step 5: Fix the pipeline, record the goldens, and read them**

Run: `go test ./internal/render/ -run FXGolden -update && go test ./... -race`
Expected: PASS. Open each `fx-*.golden` and confirm nothing overlaps the board.

- [ ] **Step 6: Walk the coolness acceptance test (§43)**

Play `./cosmic-tetris` and tick each item off explicitly:
- within 30 seconds: moving starfield, animated border, piece trails, hard-drop
  impact, particles, mission-control commentary
- within the first completed line: supernova clear, debris, border reaction
- a four-line clear produces the §43 reaction

If any item is missing or weak, fix it before continuing — §43 is a product
requirement, not a suggestion.

- [ ] **Step 7: Walk the definition of done (§47)**

Check each of §47's bullets against the built game, then record the result in
`README.md` as a short "Definition of done" section with the flags and modes that
were verified. Confirm in particular: no visible flicker, animations never block
input, effects never modify game state, the game is fun with `--no-fx` and much
funnier without it.

- [ ] **Step 8: Final verification and commit**

Run: `gofmt -l . && go vet ./... && go test ./... -race -count=2 -cover`
Expected: no formatting diffs, no vet findings, all tests pass twice.

```bash
git add -A
git commit -m "test: FX goldens, pipeline order, and the §43/§47 acceptance audit"
```
