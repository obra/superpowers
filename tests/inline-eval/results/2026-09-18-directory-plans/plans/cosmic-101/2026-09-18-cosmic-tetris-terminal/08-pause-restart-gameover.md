### Task 8: Pause overlay, restart, and the game-over panel

**Files:**
- Modify: `internal/render/render.go` (overlay dispatch by `Scene.Phase`)
- Create: `internal/render/overlay.go`
- Test: `internal/render/overlay_test.go`
- Test: `internal/render/render_test.go` (two more golden subtests)

**Interfaces:**
- Consumes: `Scene`, `Phase`, `Palette` (Task 2); `Render` (Task 6); `Game.Snapshot` (plan 1 Task 8).
- Produces:
```go
func pauseOverlay(s Scene, p Palette) string
func gameOverPanel(s Scene, p Palette) string
func overlayCentre(frame, panel string, width, height int) string
// draws panel centred over frame without changing frame's line count or width
```

`Render` composes the normal frame first, then overlays: `PhasePaused` gets `pauseOverlay`, `PhaseGameOver` gets `gameOverPanel`. `PhaseBoot` and `PhaseHelp` render as `PhasePlaying` in this plan; plan 4 fills them in.

Pinned copy (§30, §28):

```text
╭────────────────────────────╮
│     TEMPORAL SUSPENSION    │
│                            │
│       SPACE IS PAUSED      │
│                            │
│       p  resume            │
╰────────────────────────────╯
```

```text
╭──────────────────────────────╮
│                              │
│      UNIVERSE EXPIRED        │
│                              │
│      SCORE  483,200          │
│      LINES  127              │
│      LEVEL  13               │
│                              │
│   r  REBOOT UNIVERSE         │
│   q  ACCEPT COSMIC DEATH     │
│                              │
╰──────────────────────────────╯
```

Game-over numbers come from the live game with thousands separators on `SCORE` (`483,200`) and plain integers on `LINES`/`LEVEL`. The panel's subtitle line reads `CAUSE: EXCESSIVE GEOMETRY`. In `ModeASCII` the rounded box characters become `+`, `-`, `|`.

`overlayCentre` is the invariant that matters: the frame it returns has the same number of lines and the same width as the frame it was given, whatever the panel's size, and a panel wider or taller than the terminal is truncated rather than allowed to reflow.

- [ ] **Step 1: Write the failing test**

`internal/render/overlay_test.go`:

```go
func TestPauseOverlayContent(t *testing.T)
// contains "TEMPORAL SUSPENSION", "SPACE IS PAUSED", "p  resume"

func TestGameOverPanelContent(t *testing.T)
// Score 483200, Lines 127, Level 13
// contains "UNIVERSE EXPIRED", "483,200", "127", "13",
//   "r  REBOOT UNIVERSE", "q  ACCEPT COSMIC DEATH", "CAUSE: EXCESSIVE GEOMETRY"

func TestOverlayPreservesFrameSize(t *testing.T)
// frame := Render(scene at 80×30); out := overlayCentre(frame, pauseOverlay(...), 80, 30)
// stripANSI(out) is 30 lines of exactly 80 columns

func TestOverlayAtMinimumSize(t *testing.T)
// same at 40×24: still 24 lines of 40 columns, and the panel is truncated, not wrapped

func TestOverlayNarrowerThanPanel(t *testing.T)
// Render a PhaseGameOver scene at 40×24: output is 24 lines of 40 columns,
//   and the line count does not grow even though the panel is 32 columns wide
```

`internal/render/render_test.go` — add to `TestRenderGoldens`:

```go
//   "pause"    80×30 with Phase = PhasePaused
//   "gameover" 80×30 with Phase = PhaseGameOver
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -run TestPauseOverlay -v`
Expected: FAIL — `undefined: pauseOverlay`.

- [ ] **Step 3: Implement `internal/render/overlay.go` and the `Render` dispatch**

`overlayCentre` splits the frame into lines and replaces the panel's span in each affected line, then re-clamps to `width`/`height`.

- [ ] **Step 4: Generate and read the two new goldens**

Run: `go test ./internal/render/ -run TestRenderGoldens -update`, then read `testdata/pause.txt` and `testdata/gameover.txt`: the panel is centred, the board is still visible around it, and no line is longer than 80 columns.

- [ ] **Step 5: Run the full suite and play the game to a real game over**

Run: `go test ./... && go vet ./...` — PASS, clean.
Run: `go run ./cmd/cosmic-tetris --seed 1234`, stack to the top, confirm the panel appears and `r` reboots into a fresh universe.

- [ ] **Step 6: Commit**

```bash
git add internal/render
git commit -m "feat(render): pause overlay and game-over panel"
```
