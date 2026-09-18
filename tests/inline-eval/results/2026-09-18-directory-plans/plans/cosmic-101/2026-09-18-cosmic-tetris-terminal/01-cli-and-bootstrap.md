### Task 1: CLI flags, config, and program bootstrap

**Files:**
- Create: `cmd/cosmic-tetris/main.go`
- Create: `internal/app/config.go`
- Create: `internal/render/palette.go` (only `Mode` and its constants; colors arrive in Task 3)
- Test: `internal/app/config_test.go`

**Interfaces:**
- Consumes: `game.New` (plan 1 Task 6).
- Produces:
```go
// internal/render/palette.go
type Mode uint8
const (ModeFull Mode = iota; ModeReduced; ModeASCII)

// internal/app/config.go
type Config struct {
    Seed          int64      // 0 from flags means "pick one at startup"
    Mode          render.Mode
    FX            bool       // false with --no-fx
    ReducedMotion bool
}
func ParseFlags(args []string) (Config, string, error)  // args excludes argv[0];
                                                        // the string is help text to print (non-empty for --help)
func Default() Config                                   // Mode: ModeFull, FX: true, ReducedMotion: false
```

`--ascii` sets `Mode: ModeASCII`. `ModeReduced` is not reachable from a flag; Task 3 selects it from terminal capability. When `--seed` is absent, `main` fills `Seed` with `time.Now().UnixNano()` — the engine still never reads a clock, it just receives a number.

- [ ] **Step 1: Add the Charm dependencies and confirm the v2 API**

Run: `go get charm.land/bubbletea/v2@latest charm.land/lipgloss/v2@latest charm.land/bubbles/v2@latest`
Then run `go doc charm.land/bubbletea/v2 Model`, `go doc charm.land/bubbletea/v2 KeyPressMsg`, and `go doc charm.land/bubbletea/v2 WindowSizeMsg`. Use the signatures the installed version actually declares throughout this plan; where a step names a Bubble Tea type, match it to what `go doc` shows.

- [ ] **Step 2: Write the failing test**

`internal/app/config_test.go`:

```go
func TestParseFlagsDefaults(t *testing.T)
// ParseFlags(nil) == Default(), no help text, no error

func TestParseFlagsAll(t *testing.T)
// ParseFlags([]string{"--seed", "1234", "--ascii", "--no-fx", "--reduced-motion"})
// == Config{Seed: 1234, Mode: render.ModeASCII, FX: false, ReducedMotion: true}

func TestParseFlagsHelp(t *testing.T)
// ParseFlags([]string{"--help"}) returns non-empty help text and no error
// the help text mentions every flag: --seed, --ascii, --no-fx, --reduced-motion, --help

func TestParseFlagsUnknown(t *testing.T)
// ParseFlags([]string{"--turbo"}) returns a non-nil error
```

- [ ] **Step 3: Run test to verify it fails**

Run: `go test ./internal/app/ -v`
Expected: FAIL — `undefined: ParseFlags`.

- [ ] **Step 4: Implement `ParseFlags` with `flag.NewFlagSet`**

Set the flag set's output to an `io.Writer` you control so `--help` returns text instead of printing and exiting.

- [ ] **Step 5: Implement `cmd/cosmic-tetris/main.go`**

Parse `os.Args[1:]`; on error print it to stderr and exit 2; on help print the text and exit 0; otherwise fill an unset seed from `time.Now().UnixNano()`, build the model (Task 2 supplies `app.New(cfg)` — for now call `game.New(cfg.Seed)` and start a placeholder model that quits on any key), and run the program with the alt screen enabled.

- [ ] **Step 6: Run the tests and build**

Run: `go test ./... && go build ./...`
Expected: PASS and a clean build.

- [ ] **Step 7: Commit**

```bash
git add go.mod go.sum cmd internal/app/config.go internal/app/config_test.go internal/render/palette.go
git commit -m "feat(app): CLI flags, config, and Bubble Tea bootstrap"
```
