### Task 8: CLI and `main`

**Files:**
- Create: `cmd/cosmic-tetris/main.go`
- Create: `cmd/cosmic-tetris/flags.go`
- Create: `README.md`
- Create: `LICENSE`
- Test: `cmd/cosmic-tetris/flags_test.go`

**Interfaces:**
- Consumes: `app.NewModel`, `render.Options`, `game.New`.
- Produces:
  ```go
  type config struct {
      Seed          int64
      Mode          render.Mode
      NoFX          bool
      ReducedMotion bool
  }
  // parseFlags is separated from main so it is testable; it never exits.
  func parseFlags(args []string, out io.Writer) (config, error)
  ```
  Flag surface, exactly (§49.5):
  - `--seed N` (int64). Default: a nanosecond-derived seed, so a plain run varies.
  - `--ascii` → `render.ModeASCII`.
  - `--no-fx` → `Options.NoFX`.
  - `--reduced-motion` → `Options.ReducedMotion`.
  - `--help` → usage to `out`, no error, and `main` exits 0.

  Mode detection when `--ascii` is absent: `ModeFull` when
  `lipgloss`/termenv reports truecolor, otherwise `ModeReduced` (§32). Detection
  lives in `main`, not in `parseFlags`, so tests stay hermetic.

- [ ] **Step 1: Write the failing tests in `cmd/cosmic-tetris/flags_test.go`**

```go
func TestDefaultsAreFullFXAndRandomSeed(t *testing.T)
// parseFlags(nil, io.Discard): !NoFX, !ReducedMotion, Mode == ModeFull,
// Seed != 0, and two calls a nanosecond apart differ

func TestSeedFlagIsExact(t *testing.T)
// --seed 8675309 -> Seed == 8675309; --seed -1 -> Seed == -1

func TestEachFlagSetsItsField(t *testing.T)
// --ascii -> ModeASCII; --no-fx -> NoFX; --reduced-motion -> ReducedMotion

func TestFlagsCombine(t *testing.T)
// --ascii --no-fx --reduced-motion --seed 5 sets all four

func TestHelpWritesUsageWithoutError(t *testing.T)
// --help: err == nil and the buffer names every one of the five flags

func TestUnknownFlagIsAnError(t *testing.T)
// --warp-drive returns a non-nil error and does not panic

func TestNoUndocumentedFlagsExist(t *testing.T)   // §46 "nothing else is necessary"
// walk the FlagSet: exactly {seed, ascii, no-fx, reduced-motion}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./cmd/... -v`
Expected: build failure — `undefined: parseFlags`.

- [ ] **Step 3: Implement `flags.go` and `main.go`**

`parseFlags` builds a `flag.FlagSet` with `ContinueOnError` and its output set to
`out`. `main` parses, builds `game.New(cfg.Seed)` and
`app.NewModel(g, render.Options{...})`, then runs
`tea.NewProgram(m, tea.WithAltScreen())`. On a parse error: message to stderr,
exit 2.

- [ ] **Step 4: Run the tests and play the game**

Run: `go test ./... && go build ./... && ./cosmic-tetris --seed 1`
Expected: tests pass; the game is playable — pieces fall, move, rotate, hold,
ghost tracks the landing spot, lines clear, pause and restart work, `q` exits
cleanly with the terminal restored. Also run `./cosmic-tetris --ascii` and
confirm it is playable with no Unicode blocks.

- [ ] **Step 5: Write `README.md` and `LICENSE`**

README: one-paragraph description, install/run, the five flags, the §8 key table,
and a note that `internal/game` is deterministic and clock-free. LICENSE: MIT,
copyright Jesse Vincent, 2026.

- [ ] **Step 6: Commit**

```bash
git add cmd/ README.md LICENSE
git commit -m "feat(cli): flags, main, README, and license"
```
