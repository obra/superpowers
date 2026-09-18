### Task 9: Help overlay, mode guarantees, README, and the done pass

**Files:**
- Create: `internal/render/help.go`
- Modify: `internal/render/render.go` (`PhaseHelp`)
- Modify: `internal/app/update.go` (`?` toggles help without pausing gameplay)
- Create: `README.md`
- Create: `LICENSE`
- Test: `internal/render/help_test.go`
- Test: `internal/render/modes_test.go`
- Test: `internal/app/help_test.go`

**Interfaces:**
- Consumes: `KeyMap` (plan 2 Task 7); `overlayCentre` (plan 2 Task 8); `Render` (plan 2 Task 6).
- Produces:
```go
func helpOverlay(s Scene, p Palette, k []KeyHelp) string
type KeyHelp struct { Keys, Description string }
// app supplies the rows from its bubbles key.Binding help text
func (k KeyMap) Help() []render.KeyHelp
```

Help copy, verbatim (§39), rendered inside a `╭─ FLIGHT MANUAL ─╮` box:

```text
← → / h l       move spacecraft
↓ / j           accelerate doom
↑ / k / x       rotate geometry
z               rotate other way
SPACE           YEET
c               quantum storage
p               suspend spacetime
r               reboot universe
q               abandon mission
?               close this nonsense
```

`?` toggles `PhaseHelp` from `PhasePlaying` and back. Help does **not** pause the game — gravity keeps running behind the overlay, matching §44's "never delay gameplay for animation"; the player who wants to stop presses `p`.

- [ ] **Step 1: Write the failing test**

`internal/render/help_test.go`:

```go
func TestHelpContent(t *testing.T)
// the overlay contains "FLIGHT MANUAL", "move spacecraft", "accelerate doom",
//   "YEET", "quantum storage", "suspend spacetime", "reboot universe",
//   "abandon mission", "close this nonsense"

func TestHelpKeepsFrameSize(t *testing.T)
// PhaseHelp at 80×30, 46×26, 40×24: exactly h lines of w columns

func TestHelpGolden(t *testing.T)
// golden(t, "help", Render(PhaseHelp scene at 80×30))
```

`internal/render/modes_test.go`:

```go
func TestASCIIModeIsASCIIOnly(t *testing.T)
// a scene with every effect live at once (particles, trails, a line anim, a shockwave,
//   a banner, hyperdrive stretch, mid-shake) in ModeASCII:
// every byte of Render's output is < 0x80, except the pinned ghost glyph "··" (§49.4)
// asserted across PhasePlaying, PhaseHelp, PhasePaused, PhaseGameOver, PhaseBoot

func TestNoFXModeIsStill(t *testing.T)
// Scene with FX == nil across all five phases: Render never panics, dimensions are exact,
//   and two consecutive calls with the same Elapsed are byte-identical

func TestReducedMotionFrameHasNoShakeOrRings(t *testing.T)
// a reduced-motion world after a four-line clear and a hard drop:
// ShakeOffset() == (0,0), Shockwaves() empty, HyperdriveFactor() == 1.0
// the board box occupies the same columns as in the calm frame

func TestModeGoldens(t *testing.T)
// golden files "fx-ascii", "fx-nofx", "fx-reduced" — one frame each from a fixed
//   seed at a fixed Elapsed with the same event script, at 80×30

func TestAllPhasesAtMinimumSize(t *testing.T)
// every phase × every mode at 40×24: exactly 24 lines of 40 columns, no panic
```

`internal/app/help_test.go`:

```go
func TestHelpToggles(t *testing.T)
// handleKey("?"): Phase == render.PhaseHelp; again: PhasePlaying

func TestHelpDoesNotPauseGravity(t *testing.T)
// open help, handleFrame(+800ms): the active piece moved down one row

func TestPauseStillWorksFromHelp(t *testing.T)
// from PhaseHelp, handleKey("p"): Phase == render.PhasePaused
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -run TestHelpContent -v`
Expected: FAIL — `undefined: helpOverlay`.

- [ ] **Step 3: Implement the help overlay and the `?` toggle**

Build the rows from the `key.Binding` help text already on `KeyMap` (§39 says to use the Bubbles key/help primitives) and override the descriptions with the copy above.

- [ ] **Step 4: Generate and read the mode goldens**

Run: `go test ./internal/render/ -update`, then read `testdata/help.txt`, `fx-ascii.txt`, `fx-nofx.txt`, `fx-reduced.txt`. Each must show a clean, non-overlapping frame.

- [ ] **Step 5: Write `README.md` and `LICENSE`**

README: what it is, `go run ./cmd/cosmic-tetris`, the five flags with one line each, the §8 controls table, and a short architecture note naming the four packages and the rule that FX never modifies game state. LICENSE: MIT, current year.

- [ ] **Step 6: Walk §47's definition of done**

Run `go test ./... && go vet ./...` — PASS, clean. Then play each of these and tick them off in the commit message, fixing anything that fails:

```text
playable start through game over      controls feel immediate
resizing works                        hold works
ghost works                           next queue works
piece generation is deterministic     game RNG and FX RNG are isolated
line clearing is correct              gravity increases
pause works                           restart works
ASCII fallback works                  no-FX mode works
comprehensive game unit tests         representative snapshot tests
no visible flicker                    animations never block input
effects never modify game state       four-line clears are gloriously excessive
game over collapses the universe      fun with effects off
much funnier with effects on
```

Also confirm §43: within 30 seconds of normal play you see a moving starfield, an animated border, trails, a hard-drop impact, particles, and Mission Control commentary.

- [ ] **Step 7: Commit**

```bash
git add internal/render internal/app README.md LICENSE
git commit -m "feat: flight manual, mode guarantees, README, and the done pass"
```
