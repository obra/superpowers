### Task 7: Boot sequence

**Files:**
- Create: `internal/render/boot.go`
- Modify: `internal/render/render.go` (`PhaseBoot` renders the boot screen)
- Modify: `internal/app/update.go` (boot phase, skip on any key)
- Test: `internal/render/boot_test.go`
- Test: `internal/app/boot_test.go`

**Interfaces:**
- Consumes: `Scene`, `Phase`, `Palette`, `Elapsed` (plan 2); `overlayCentre` (plan 2 Task 8); `Model`, `handleKey`, `handleFrame` (plan 2 Task 7).
- Produces:
```go
// render
const BootTotal = 1000 * time.Millisecond   // §29: about one second of excessive drama
func bootScreen(s Scene, p Palette) string  // uses s.Elapsed to reveal lines
```

Boot copy, verbatim (§29), revealed by elapsed time:

```text
0ms      ✦
150ms    C O S M I C
300ms      T E T R I S
450ms    INITIALIZING LOCAL UNIVERSE...
600ms        gravity ........ OK
700ms        spacetime ...... OK
800ms        tetrominoes .... QUESTIONABLE
900ms    UNIVERSE ONLINE
1000ms   -> PhasePlaying
```

App behaviour: `Model.New` starts in `render.PhaseBoot`; `handleFrame` switches to `PhasePlaying` once `Elapsed >= BootTotal` and **does not advance the game** before then; any key press during boot skips straight to `PhasePlaying` (§29). Quit still quits. There is no menu.

The boot screen renders on the live starfield — that is why it costs nothing extra and looks like a planetarium warming up.

- [ ] **Step 1: Write the failing test**

`internal/render/boot_test.go`:

```go
func TestBootRevealsLinesOverTime(t *testing.T)
// Elapsed 0: contains "✦", not "C O S M I C"
// Elapsed 200ms: contains "C O S M I C", not "T E T R I S"
// Elapsed 650ms: contains "gravity ........ OK", not "spacetime"
// Elapsed 950ms: contains "UNIVERSE ONLINE" and "tetrominoes .... QUESTIONABLE"

func TestBootKeepsFrameSize(t *testing.T)
// PhaseBoot at 80×30, 46×26 and 40×24: exactly h lines of w columns

func TestBootASCII(t *testing.T)
// ModeASCII: only ASCII bytes, and the title text is still present

func TestBootGolden(t *testing.T)
// golden(t, "boot", Render(scene with Phase PhaseBoot, Elapsed 950ms, 80×30))
```

`internal/app/boot_test.go`:

```go
func TestStartsInBootPhase(t *testing.T)
// New(Config{Seed: 1, FX: true}).Phase == render.PhaseBoot

func TestBootDoesNotAdvanceGame(t *testing.T)
// handleFrame(+500ms) during boot: the active piece has not moved
// Phase is still PhaseBoot

func TestBootEndsAfterBootTotal(t *testing.T)
// handleFrame(+BootTotal + 16ms): Phase == render.PhasePlaying

func TestAnyKeySkipsBoot(t *testing.T)   // Review Focus
// handleKey("x") during boot: Phase == render.PhasePlaying immediately
// handleKey("q") during boot returns a quit command instead

func TestBootSkipDoesNotApplyTheKeyToTheGame(t *testing.T)
// handleKey("left") during boot skips the boot and leaves Active.X unchanged
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/render/ -run TestBootReveals -v`
Expected: FAIL — `undefined: bootScreen`.

- [ ] **Step 3: Implement `internal/render/boot.go` and the app's boot phase**

Keep the reveal schedule as a `[]struct{At time.Duration; Line string}` table so the copy and the timing are one thing.

This changes what `app.New` returns: plan 2's tests assume a fresh `Model` is in `PhasePlaying`. Add a test helper in `internal/app` — `newPlaying(cfg Config) *Model`, which builds a model and skips the boot — and switch the existing plan-2 tests to it rather than weakening the boot behaviour.

- [ ] **Step 4: Generate and read the boot golden**

Run: `go test ./internal/render/ -run TestBootGolden -update`, then read `testdata/boot.txt`.

- [ ] **Step 5: Run the tests and watch it boot**

Run: `go test ./... && go vet ./...` — PASS, clean.
Run: `go run ./cmd/cosmic-tetris` twice: once letting the boot play, once mashing a key to skip it.

- [ ] **Step 6: Commit**

```bash
git add internal/render internal/app
git commit -m "feat(render): one second of excessive boot drama, skippable"
```
