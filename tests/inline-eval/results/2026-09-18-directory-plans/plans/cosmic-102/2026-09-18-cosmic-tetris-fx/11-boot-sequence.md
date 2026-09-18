### Task 11: Boot sequence

**Files:**
- Create: `internal/fx/boot.go`
- Modify: `internal/render/fxdraw.go` (add `DrawBoot`)
- Modify: `internal/render/render.go` (boot replaces the frame entirely)
- Modify: `internal/app/model.go`, `internal/app/update.go` (`StateBoot`)
- Test: `internal/fx/boot_test.go`
- Test: `internal/render/boot_test.go`
- Test: `internal/app/boot_test.go`

**Interfaces:**
- Consumes: `World`, `BootTotal` (Task 1); `AppState` (plan 2 Task 5).
- Produces:
  ```go
  // fx
  type Boot struct {
      Progress float64   // 0..1 through BootTotal
      Lines    []string  // the check lines revealed so far
      Online   bool      // true in the final beat
  }
  func (w *World) Boot() (Boot, bool)
  func (w *World) SkipBoot()

  // app: AppState gains StateBoot, which is now the initial state
  // render: Frame gains nothing; Render checks Frame.FX's Boot state first
  func DrawBoot(c *Canvas, w *fx.World, opt Options)
  ```
  Pinned (§29): `BootTotal` is 1000ms. Content, in reveal order at 0/250/450/650ms:
  ```
             ✦

       C O S M I C

         T E T R I S

    INITIALIZING LOCAL UNIVERSE...

        gravity ........ OK
        spacetime ...... OK
        tetrominoes .... QUESTIONABLE
  ```
  then `UNIVERSE ONLINE` at 850ms, and play starts at 1000ms. **Any key skips**
  (§29), moving straight to `StatePlaying`. No menu. A `bubbles/v2/spinner` sits
  beside `INITIALIZING LOCAL UNIVERSE...`. With `--no-fx` the boot screen is
  skipped entirely — the game starts immediately.

- [ ] **Step 1: Write the failing tests in `internal/fx/boot_test.go`**

```go
func TestBootRevealsLinesOverTime(t *testing.T)
// at 0ms: the ✦ and title only
// at 300ms: "INITIALIZING LOCAL UNIVERSE..." present
// at 500ms: the gravity line; 700ms: spacetime; 700ms+: tetrominoes
// at 900ms: Online is true

func TestBootFinishesAtOneSecond(t *testing.T)
// Boot() reports absent after Advance(BootTotal + 1ms)

func TestBootCopyIsExact(t *testing.T)
// the revealed lines match the §29 text verbatim, including
// "tetrominoes .... QUESTIONABLE" and "UNIVERSE ONLINE"

func TestSkipBootEndsItImmediately(t *testing.T)

func TestDisabledWorldHasNoBoot(t *testing.T)
```

- [ ] **Step 2: Write the failing render test in `internal/render/boot_test.go`**

```go
func TestBootFrameReplacesEverything(t *testing.T)
// while booting: the frame contains "C O S M I C" and no board border glyph

func TestBootFitsTheMinimumTerminal(t *testing.T)
// 40x24: every line fits; the frame has exactly 24 lines

func TestBootOnTooSmallTerminalShowsTheNotice(t *testing.T)
// 30x18 while booting: the too-small notice wins
```

- [ ] **Step 3: Write the failing app test in `internal/app/boot_test.go`**

```go
func TestModelStartsInStateBoot(t *testing.T)

func TestAnyKeySkipsBoot(t *testing.T)   // §29
// handleKey("x") during StateBoot -> StatePlaying, and the key does not also
// rotate the piece

func TestQuitStillWorksDuringBoot(t *testing.T)   // "q" quits, not skips

func TestBootEndsOnItsOwnAfterOneSecond(t *testing.T)
// FrameMsgs totalling 1s -> StatePlaying

func TestGravityDoesNotRunDuringBoot(t *testing.T)
// after 1s of boot frames the active piece is still at its spawn row

func TestNoFXStartsPlayingImmediately(t *testing.T)
// a model built with a disabled world begins in StatePlaying
```

- [ ] **Step 4: Run the three test files to verify they fail**

Run: `go test ./... -run Boot -v`
Expected: FAIL — `undefined: StateBoot`.

- [ ] **Step 5: Implement `boot.go`, `DrawBoot`, and the `StateBoot` handling**

`Render` checks boot before anything else (after the too-small check). In
`update.go`, `StateBoot` consumes every key as a skip except quit, and `advance`
does not call `game.Advance` while booting.

- [ ] **Step 6: Run the tests and watch it boot**

Run: `go test ./... && ./cosmic-tetris`
Expected: about one second of excessive drama, then play. Pressing a key during
it jumps straight to the game.

- [ ] **Step 7: Commit**

```bash
git add internal/fx/boot.go internal/fx/boot_test.go internal/render/ internal/app/
git commit -m "feat(fx): one second of excessive boot drama, skippable"
```
