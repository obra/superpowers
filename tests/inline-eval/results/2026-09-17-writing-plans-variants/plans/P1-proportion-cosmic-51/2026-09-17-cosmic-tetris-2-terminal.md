# Cosmic Tetris — Plan 2: Playable Terminal Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the headless engine from Plan 1 into a genuinely good, immediately playable terminal game: Bubble Tea event loop, responsive keys, board/ghost/hold/next/HUD rendering, adaptive layout down to 40×24, pause, restart, help, game over, ASCII fallback, and ANSI-stripped golden layout tests.

**Architecture:** Three packages on top of `internal/game`. `internal/app` owns the Bubble Tea `Model` — one 60 Hz frame clock, elapsed time handed to `game.Advance(dt)`, keys handled the instant they arrive. `internal/render` is a pure function of a `render.Scene` value to a string; it never sees the `Model` and never mutates anything, which is what makes the golden tests trivial. `cmd/cosmic-tetris` parses flags and starts the program. No FX yet — that is Plan 3 — but the seams FX plugs into (a `Scene.FX` field, a status line, an intensity notion) are placed here.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2 v2.0.9`, `charm.land/lipgloss/v2 v2.0.6`, `charm.land/bubbles/v2 v2.2.1`, `github.com/charmbracelet/x/ansi` (test-only, for stripping ANSI in golden tests).

**Spec:** `design.md` (this plan implements §4, §5 rendering, §8, §10 rendering, §25 static border, §26, §28 final panel, §30, §31, §32, §33, §34, §36, §37, §39, §41, §42 Phase 2, §46, and pinned decisions §49.3, §49.4, §49.7)

## Global Constraints

- Use these import paths, no others, for the TUI: `charm.land/bubbletea/v2`, `charm.land/lipgloss/v2`, `charm.land/bubbles/v2`.
- Bubble Tea v2 API facts, verified against v2.0.9 — do not write v1 code:
  - `Model` is `Init() tea.Cmd`, `Update(tea.Msg) (tea.Model, tea.Cmd)`, `View() tea.View`.
  - `tea.View` is a struct. Build it with `v := tea.NewView(s)`, then `v.AltScreen = true`. There is **no** `tea.WithAltScreen` option in v2.
  - Key presses arrive as `tea.KeyPressMsg` (not `tea.KeyMsg`, which is an interface in v2). It has a `String()` method, so `key.Matches(msg, binding)` from `bubbles/v2/key` works directly.
  - Resize arrives as `tea.WindowSizeMsg{Width, Height int}`.
  - Available program options include `tea.WithFPS(int)`, `tea.WithInput`, `tea.WithOutput`, `tea.WithColorProfile`, `tea.WithWindowSize`, `tea.WithoutRenderer`.
  - `lipgloss.Color("#RRGGBB")` returns a `color.Color`; `Style.Foreground` takes a `color.Color`.
- Do not abstract Bubble Tea behind a homegrown framework (§3). `internal/app` is a Bubble Tea model, plainly.
- Rendering never mutates game state (§37). `internal/render` takes values, returns a string, and holds no mutable package state.
- One animation clock. §36 says "prefer one animation clock and accumulated elapsed time rather than spawning multiple timing loops" — so there is a single `FrameMsg` at ~60 Hz and **no** separate `GravityMsg` loop; gravity comes from the same `dt`. Input is handled in `Update` on arrival and never waits for a tick (§8, §44).
- One logical block is 2 terminal columns × 1 terminal row (§5). Every glyph string the renderer emits for a cell is exactly 2 columns wide, in every mode.
- Glyphs are pinned (§49.4): blocks `██` (`[]` in ASCII), ghost `░░` (`··` in ASCII). Pieces use a bright foreground on filled glyphs — never a foreground+background pair. The active piece renders one step brighter than locked cells.
- Piece color identities (§26): I plasma cyan, J deep electric blue, L solar orange, O stellar gold, S alien green, T ultraviolet, Z supernova pink/red.
- Minimum usable terminal 40×24. Below it, show the too-small notice with current and needed sizes (§31). Resizing must never panic (§31).
- Small-terminal drop order (§49.3), in order as height runs out: title border, then mission control, then stat labels (values stay). NEXT never stacks above or below the board — it sits beside the board and truncates to 3 pieces at small sizes. Board and controls are the last two elements standing.
- CLI surface, exactly (§49.5): `cosmic-tetris`, `--seed N`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help`. Nothing else.
- The §4 wide-layout mockup is intent, not geometry (§49.7). The ANSI-stripped golden tests are the binding layout contract.
- Do not build: networking, profiles, achievements, plugins, a database, high-score persistence.
- Commit after every task. Every task ends with `go test ./...` green and `go vet ./...` clean.

## Review Focus

Five things a real player will hit that no obvious task test covers. Each has a test added to the task that owns the code.

1. **A zero size before the first `WindowSizeMsg`.** Bubble Tea's first `View()` can run at 0×0; centering math there divides and subtracts into negatives. It must render the too-small notice, not panic. → Task 5.
2. **The first frame's `dt`.** A zero-valued `LastFrame` makes the first elapsed time enormous (year 1 to now), which would instantly slam the first piece to the floor. The first `FrameMsg` must seed the clock and every `dt` must be clamped. → Task 6.
3. **Keys arriving faster than frames.** Three lefts inside one 16ms frame must all move the piece — the key path must not be gated on, batched into, or debounced by the frame clock. → Task 6.
4. **A score wider than its HUD column.** `9,999,999` and `LINES 1234` must not widen the stats column and shove the board sideways or off the right edge. → Task 4.
5. **Odd leftover space when centering.** Widths and heights that don't divide evenly (41 columns, 25 rows) must still place the board fully inside the frame with no line exceeding the terminal width. → Task 5.

---

## File Structure

| File | Responsibility |
|---|---|
| `cmd/cosmic-tetris/main.go` | Flag parsing, `Options`, mode detection, program start, exit codes. |
| `internal/app/keys.go` | `KeyMap` of `bubbles/v2/key.Binding`s, including WASD aliases and the help bindings. |
| `internal/app/messages.go` | `FrameMsg`, the frame-tick command, frame interval and dt-clamp constants. |
| `internal/app/model.go` | `Model`, `AppState`, `NewModel`, `Init`, `View`, and the `Model → render.Scene` projection. |
| `internal/app/update.go` | `Update`: key dispatch, frame advance, resize, pause/restart/help/quit state transitions. |
| `internal/render/palette.go` | `Mode`, `DetectMode`, `Glyphs`, `Palette`, per-kind styles, HUD/border/text styles. |
| `internal/render/board.go` | Board panel: locked cells, ghost, active piece, border box. |
| `internal/render/hud.go` | HOLD box, NEXT queue, stats block, mission-control line, controls line, overlay panels. |
| `internal/render/layout.go` | `Layout`, `Plan(width, height)`, breakpoints, drop order, too-small notice. |
| `internal/render/render.go` | `Scene`, `Overlay`, `Render(Scene) string` — assembles the panels per §37's order. |
| `internal/render/testdata/*.golden` | Golden ANSI-stripped frames for the seven §41 scenarios. |

---

## Task 1: CLI, options, and a Bubble Tea program that runs and quits

**Files:**
- Create: `cmd/cosmic-tetris/main.go`, `cmd/cosmic-tetris/main_test.go`, `internal/app/keys.go`, `internal/app/keys_test.go`, `internal/app/messages.go`, `internal/app/model.go`, `internal/app/update.go`, `internal/app/update_test.go`
- Modify: `go.mod` (add the three Charm modules)

**Interfaces:**
- Consumes: `game.New`, `game.Game` (Plan 1).
- Produces:
  ```go
  // cmd/cosmic-tetris
  type Options struct {
      Seed          int64 // 0 means "pick one from the clock at startup"
      ASCII         bool
      NoFX          bool
      ReducedMotion bool
  }

  // ParseArgs parses argv (without the program name). done==true means the
  // program should exit 0 immediately (--help was requested).
  func ParseArgs(args []string, out io.Writer) (opts Options, done bool, err error)

  // internal/app
  type AppState uint8
  const (
      StatePlaying AppState = iota
      StatePaused
      StateGameOver
  )

  type Options struct { // app's copy; main converts into it
      Seed          int64
      ASCII         bool
      NoFX          bool
      ReducedMotion bool
  }

  type Model struct {
      Game *game.Game
      Opts Options

      Width, Height int
      State         AppState
      ShowHelp      bool

      LastFrame time.Time
      Keys      KeyMap
      Help      help.Model
      Mode      render.Mode

      Status string // mission-control text; Plan 3 drives it
  }

  func NewModel(o Options, mode render.Mode) Model
  func (m Model) Init() tea.Cmd
  func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd)
  func (m Model) View() tea.View

  type KeyMap struct {
      Left, Right, SoftDrop, RotateCW, RotateCCW, HardDrop,
      Hold, Pause, Restart, Help, Quit key.Binding
  }
  func DefaultKeyMap() KeyMap
  func (k KeyMap) ShortHelp() []key.Binding
  func (k KeyMap) FullHelp() [][]key.Binding

  // messages.go
  const (
      FrameInterval = 16 * time.Millisecond // ~60 Hz (§36)
      MaxFrameDelta = 100 * time.Millisecond // dt clamp (Review Focus #2)
  )
  type FrameMsg struct{ Now time.Time }
  func frameTick() tea.Cmd // tea.Tick(FrameInterval, func(t time.Time) tea.Msg { return FrameMsg{t} })
  ```

**Key bindings (§8), exact key strings:**

| Binding | Keys | Help text |
|---|---|---|
| Left | `left`, `h`, `a` | `move spacecraft` |
| Right | `right`, `l`, `d` | (shares the row with Left) |
| SoftDrop | `down`, `j`, `s` | `accelerate doom` |
| RotateCW | `up`, `k`, `x`, `w` | `rotate geometry` |
| RotateCCW | `z` | `rotate other way` |
| HardDrop | `space` (`" "`) | `YEET` |
| Hold | `c` | `quantum storage` |
| Pause | `p` | `suspend spacetime` |
| Restart | `r` | `reboot universe` |
| Help | `?` | `close this nonsense` |
| Quit | `q`, `esc`, `ctrl+c` | `abandon mission` |

Repeat movement while a key is held (§8) needs nothing special: terminals send auto-repeat as a stream of `KeyPressMsg`, and because Task 6 handles keys on arrival rather than on the tick, repeats already flow through. Do not implement a key-repeat timer.

- [ ] **Step 1: Add the dependencies**

```bash
go get charm.land/bubbletea/v2@v2.0.9 charm.land/lipgloss/v2@v2.0.6 charm.land/bubbles/v2@v2.2.1
```

- [ ] **Step 2: Write the failing tests**

`cmd/cosmic-tetris/main_test.go`:

```go
func TestParseArgsDefaults(t *testing.T)
// ParseArgs(nil, io.Discard): no error, done false, all bools false, Seed == 0

func TestParseArgsEveryFlag(t *testing.T)
// []string{"--seed","1234","--ascii","--no-fx","--reduced-motion"} =>
// Seed 1234, ASCII, NoFX, ReducedMotion all true

func TestParseArgsHelpExitsQuietly(t *testing.T)
// []string{"--help"}: done true, err nil, and the buffer mentions
// "--seed", "--ascii", "--no-fx", "--reduced-motion"

func TestParseArgsRejectsUnknownFlag(t *testing.T)
// []string{"--warp-drive"}: err != nil

func TestParseArgsRejectsNonNumericSeed(t *testing.T)
// []string{"--seed","banana"}: err != nil
```

`internal/app/keys_test.go`:

```go
func TestEveryDocumentedKeyMatchesItsBinding(t *testing.T)
// table of {key string, want *key.Binding} covering all keys in the table above;
// build tea.KeyPressMsg{Code: 'h'} style values (use tea.KeyPressMsg{Code: rune}
// for letters, and Code: tea.KeyLeft etc. for named keys) and assert
// key.Matches(msg, binding) is true

func TestWASDAliasesMatchTheirDirections(t *testing.T)
// 'a'->Left, 'd'->Right, 's'->SoftDrop, 'w'->RotateCW

func TestFullHelpCoversEveryBinding(t *testing.T)
// flattening FullHelp() yields every binding in KeyMap exactly once
```

`internal/app/update_test.go`:

```go
func TestQuitKeyReturnsQuitCommand(t *testing.T)
// m.Update(tea.KeyPressMsg{Code: 'q'}) returns a non-nil Cmd whose result is tea.QuitMsg
```

- [ ] **Step 3: Run the tests and confirm they fail**

Run: `go test ./cmd/... ./internal/app/ -v`
Expected: build failures — `undefined: ParseArgs`, `undefined: DefaultKeyMap`.

- [ ] **Step 4: Implement**

- `main.go`: `ParseArgs` with a `flag.FlagSet` in `ContinueOnError` mode and a custom `Usage` that prints the §46 CLI surface. `main` calls `ParseArgs(os.Args[1:], os.Stderr)`, exits 0 on `done`, exits 2 with the error on failure, resolves `Seed == 0` to `time.Now().UnixNano()` (the *only* clock read outside `app`), calls `render.DetectMode` (Task 2 — stub it as `render.ModeFull` for now and wire it in Task 2), builds the model, and runs `tea.NewProgram(m, tea.WithFPS(60))`.
- `keys.go`: `DefaultKeyMap` per the table, `ShortHelp`/`FullHelp`.
- `messages.go`: constants and `frameTick`.
- `model.go`: `NewModel`, `Init` returning `frameTick()`, and a `View` that for now returns `tea.NewView("cosmic tetris")` with `AltScreen = true`.
- `update.go`: handle `tea.WindowSizeMsg` (store size), `tea.KeyPressMsg` for Quit only, and `FrameMsg` by re-arming `frameTick()`. Everything else falls through unchanged.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `go test ./... -v && go vet ./... && go build ./...`
Expected: PASS, clean, builds.

- [ ] **Step 6: See it run**

Run: `go run ./cmd/cosmic-tetris` — expect an alt-screen with `cosmic tetris`, and `q` exits cleanly leaving the terminal usable. Then `go run ./cmd/cosmic-tetris --help` and `--seed 1234 --ascii`.

- [ ] **Step 7: Commit**

```bash
git add go.mod go.sum cmd internal/app
git commit -m "feat(app): CLI flags, key map, Bubble Tea skeleton with one frame clock"
```

---

## Task 2: Palette, glyphs, and render-mode detection

**Files:**
- Create: `internal/render/palette.go`, `internal/render/palette_test.go`
- Modify: `cmd/cosmic-tetris/main.go` (call the real `DetectMode`)

**Interfaces:**
- Consumes: `game.PieceKind`.
- Produces:
  ```go
  type Mode uint8
  const (
      ModeFull    Mode = iota // Unicode + truecolor
      ModeReduced             // Unicode + 256 color
      ModeASCII              // ASCII glyphs, limited color
  )
  func (m Mode) String() string

  // DetectMode picks a mode from the environment. forceASCII wins outright.
  // COLORTERM of "truecolor" or "24bit" => ModeFull; a TERM containing
  // "256color" => ModeReduced; TERM of "dumb" or empty => ModeASCII;
  // anything else => ModeReduced.
  func DetectMode(getenv func(string) string, forceASCII bool) Mode

  type Glyphs struct {
      Block string // "██" / "[]"
      Ghost string // "░░" / "··"
      Empty string // "  " in every mode
      Border lipgloss.Border // DoubleBorder in Unicode modes, ASCIIBorder in ASCII
  }
  func GlyphsFor(m Mode) Glyphs

  type Palette struct{ mode Mode }
  func PaletteFor(m Mode) Palette

  // Piece returns the style for a cell of kind k; active cells render one step
  // brighter than locked ones (§49.4).
  func (p Palette) Piece(k game.PieceKind, active bool) lipgloss.Style
  func (p Palette) Ghost() lipgloss.Style
  func (p Palette) Border() lipgloss.Style
  func (p Palette) Label() lipgloss.Style   // dim HUD labels
  func (p Palette) Value() lipgloss.Style   // bright HUD numbers
  func (p Palette) Title() lipgloss.Style
  func (p Palette) Status() lipgloss.Style  // mission-control line
  func (p Palette) Dim() lipgloss.Style     // controls line
  ```

**Colors (locked/active hex pairs, neon space palette per §26):**

```text
I  #22d3ee / #a5f3fc     plasma cyan
J  #3b82f6 / #93c5fd     deep electric blue
L  #f97316 / #fdba74     solar orange
O  #fbbf24 / #fde68a     stellar gold
S  #22c55e / #86efac     alien green
T  #a855f7 / #d8b4fe     ultraviolet
Z  #f43f5e / #fda4af     supernova pink/red
ghost  #4b5563           dim slate
border #7c3aed           deep violet (Plan 3 animates this)
```

In `ModeASCII`, `Piece` returns styles from a two-color set (bright white for active, plain default for locked) so nothing depends on 256-color support.

- [ ] **Step 1: Write the failing tests**

`internal/render/palette_test.go`:

```go
func TestDetectMode(t *testing.T)
// table: {COLORTERM:"truecolor"}=>ModeFull; {TERM:"xterm-256color"}=>ModeReduced;
// {TERM:"dumb"}=>ModeASCII; {}=>ModeASCII; forceASCII=true with truecolor=>ModeASCII

func TestEveryCellGlyphIsTwoColumnsWide(t *testing.T)
// for each mode: lipgloss.Width(g.Block)==2, Ghost==2, Empty==2

func TestASCIIGlyphsAreASCIIOnly(t *testing.T)
// GlyphsFor(ModeASCII): every rune in Block, Ghost, Empty is < 128

func TestPieceStyleDiffersPerKindAndBrightness(t *testing.T)
// in ModeFull: the rendered Block for all seven kinds yields seven distinct
// strings; Piece(k,true) differs from Piece(k,false) for every kind

func TestStyledBlockKeepsItsWidth(t *testing.T)
// for each mode and kind: lipgloss.Width(Piece(k,true).Render(g.Block)) == 2
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/render/ -v`
Expected: build failure — `undefined: DetectMode`.

- [ ] **Step 3: Implement `palette.go`, and call `DetectMode(os.Getenv, opts.ASCII)` from `main.go`**

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/palette.go internal/render/palette_test.go cmd/cosmic-tetris/main.go
git commit -m "feat(render): neon palette, glyph sets, render-mode detection"
```

---

## Task 3: Board panel — locked cells, ghost, active piece, border

**Files:**
- Create: `internal/render/board.go`, `internal/render/board_test.go`

**Interfaces:**
- Consumes: `Palette`, `Glyphs`, `Mode` (Task 2); `game.Board`, `game.Piece`, `game.VisibleRows`, `game.HiddenRows` (Plan 1).
- Produces:
  ```go
  // BoardCells renders the 20 visible rows as plain cell rows (no border),
  // each exactly BoardInnerWidth columns wide. Ghost cells are drawn only where
  // the board is empty and the active piece is not (§10: the ghost must never
  // obscure locked blocks or the active piece).
  func BoardCells(b game.Board, active, ghost game.Piece, showPiece bool, p Palette, g Glyphs) []string

  const (
      BoardInnerWidth  = game.BoardWidth * 2 // 20
      BoardInnerHeight = game.VisibleRows    // 20
      BoardOuterWidth  = BoardInnerWidth + 2 // 22, with border
      BoardOuterHeight = BoardInnerHeight + 2
  )

  // BoardPanel wraps BoardCells in the board border box.
  func BoardPanel(rows []string, p Palette, g Glyphs) string
  ```

**Design notes:** iterate visible rows `y = game.HiddenRows .. game.BoardHeight-1`. Precedence per cell: active piece (when `showPiece`) > locked cell > ghost > empty. Build each row into a `strings.Builder`; reuse one builder across rows.

- [ ] **Step 1: Write the failing tests**

`internal/render/board_test.go`:

```go
func TestBoardCellsDimensions(t *testing.T)
// empty board, ModeFull: len(rows)==20 and lipgloss.Width(row)==20 for every row

func TestBoardCellsDimensionsInEveryMode(t *testing.T)
// same assertion for ModeReduced and ModeASCII

func TestLockedCellsAppearInTheRightPlace(t *testing.T)
// fill (0,21) and (9,21): stripped last row starts with the block glyph,
// ends with the block glyph, and the 16 middle columns are spaces

func TestHiddenRowsAreNotRendered(t *testing.T)
// fill row 1 (hidden) only: every rendered row is blank

func TestGhostDoesNotOverwriteLockedCells(t *testing.T)
// lock cells where the ghost would land, then render: the stripped output
// contains no ghost glyph at those columns

func TestActiveDrawsOverGhost(t *testing.T)
// active and ghost at the same Y: those rows show block glyphs, not ghost glyphs

func TestShowPieceFalseHidesActiveButKeepsLocked(t *testing.T)

func TestBoardPanelIsTwentyTwoByTwentyTwo(t *testing.T)
// stripped BoardPanel: 22 lines, each 22 columns wide
```

Add a shared test helper (used again in Tasks 5 and 7):

```go
// boardFromASCII builds a game.Board from 22 strings of 10 characters,
// '.' empty and any of "IJLOSTZ" a locked cell of that kind.
func boardFromASCII(t *testing.T, rows []string) game.Board
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/render/ -run TestBoard -v`
Expected: build failure — `undefined: BoardCells`.

- [ ] **Step 3: Implement `board.go`**

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): board panel with ghost and active-piece precedence"
```

---

## Task 4: HUD — hold, next, stats, status, controls, overlays

**Files:**
- Create: `internal/render/hud.go`, `internal/render/hud_test.go`

**Interfaces:**
- Consumes: Tasks 2–3.
- Produces:
  ```go
  const (
      SideColumnWidth = 10 // HOLD / NEXT / stats columns are exactly this wide
      MiniGridWidth   = 8  // a 4x2 piece preview: 8 columns, 2 rows
      MiniGridHeight  = 2
  )

  // MiniPiece renders kind k as a MiniGridWidth × MiniGridHeight preview at
  // spawn rotation, left-aligned and padded to exact size.
  func MiniPiece(k game.PieceKind, p Palette, g Glyphs) []string

  // HoldBox renders the HOLD label (when showLabel) plus the held piece, or an
  // empty grid when hold is nil.
  func HoldBox(hold *game.PieceKind, showLabel bool, p Palette, g Glyphs) []string

  // NextBox renders up to count upcoming pieces (§49.3 truncates to 3 at small
  // sizes) with a blank row between previews.
  func NextBox(next []game.PieceKind, count int, showLabel bool, p Palette, g Glyphs) []string

  // StatsBox renders SCORE / LINES / LEVEL. With showLabels false, only the
  // values are rendered (§49.3). Values are clamped to SideColumnWidth columns.
  func StatsBox(score, lines, level int, showLabels bool, p Palette) []string

  // StatusLine renders the mission-control channel: "☄ MISSION CONTROL: TEXT",
  // truncated to width. In ASCII mode the comet becomes ">".
  func StatusLine(text string, width int, p Palette, m Mode) string

  // ControlsLine renders the one-line control hint, dropping items from the
  // right until it fits width.
  func ControlsLine(width int, p Palette, m Mode) string

  // TitleBar renders "╭─ ✦ COSMIC TETRIS ── LOCAL UNIVERSE <seed hex> ─╮" style
  // chrome at the given width (ASCII mode uses "+-" characters).
  func TitleBar(seed int64, width int, p Palette, g Glyphs, m Mode) string

  // Panel renders a centered bordered overlay from title plus body lines.
  func Panel(title string, body []string, p Palette, g Glyphs) string

  func PausePanel(p Palette, g Glyphs) string            // §30 copy
  func GameOverPanel(score, lines, level int, p Palette, g Glyphs) string // §28 copy
  func HelpPanel(body string, p Palette, g Glyphs) string // §39, body from bubbles help
  ```

**Copy, verbatim from the spec:**
- Pause panel: title `TEMPORAL SUSPENSION`, body `SPACE IS PAUSED`, blank, `p  resume`.
- Game over panel: title `UNIVERSE EXPIRED`, then `SCORE  <n>`, `LINES  <n>`, `LEVEL  <n>`, blank, `r  REBOOT UNIVERSE`, `q  ACCEPT COSMIC DEATH`, and the subtitle `CAUSE: EXCESSIVE GEOMETRY`. Format the score with thousands separators (`483,200`).
- Help panel title: `FLIGHT MANUAL`, body from `help.Model.View(KeyMap)` in the app layer — `HelpPanel` just frames a pre-rendered string.
- Controls line: `←→ move   ↑ rotate   ↓ descend   SPACE YEET   C hold   ? help` (ASCII mode: `<> move  ^ rotate  v descend  SPACE YEET  C hold  ? help`).
- Status line default text: `NOMINALISH`.

- [ ] **Step 1: Write the failing tests**

`internal/render/hud_test.go`:

```go
func TestMiniPieceIsExactlyEightByTwo(t *testing.T)
// for all seven kinds in all three modes: 2 rows, each 8 columns wide

func TestHoldBoxEmptyKeepsItsFootprint(t *testing.T)
// HoldBox(nil, true, ...) and HoldBox(&kindT, true, ...) have equal line counts
// and equal per-line widths

func TestNextBoxHonoursCount(t *testing.T)
// count 5 shows five previews; count 3 shows three; a next slice shorter than
// count renders only what exists without panicking

func TestStatsBoxLabelsCanBeDropped(t *testing.T)
// showLabels true contains "SCORE"; false does not but still contains the digits

// Review Focus #4
func TestStatsBoxWidthIsFixedForHugeValues(t *testing.T)
// score 9_999_999, lines 1234, level 99: every stripped line is at most
// SideColumnWidth columns wide, in both label modes

func TestStatusLineTruncatesToWidth(t *testing.T)
// a 200-character message at width 30: stripped width == 30 exactly

func TestStatusLineIsASCIIInASCIIMode(t *testing.T)
// every rune < 128

func TestControlsLineNeverExceedsWidth(t *testing.T)
// widths 20, 30, 40, 64, 120: stripped width <= the requested width, and at
// width 40+ the output still mentions "YEET"

func TestPanelsContainTheirSpecCopy(t *testing.T)
// PausePanel contains "TEMPORAL SUSPENSION" and "SPACE IS PAUSED";
// GameOverPanel(483200,127,13,...) contains "UNIVERSE EXPIRED", "483,200",
// "127", "13", "REBOOT UNIVERSE", "ACCEPT COSMIC DEATH", "CAUSE: EXCESSIVE GEOMETRY"

func TestPanelsAreRectangular(t *testing.T)
// for each panel: all stripped lines have equal width
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/render/ -run 'TestMini|TestHold|TestNext|TestStats|TestStatus|TestControls|TestPanels' -v`
Expected: build failure — `undefined: MiniPiece`.

- [ ] **Step 3: Implement `hud.go`**

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/hud.go internal/render/hud_test.go
git commit -m "feat(render): HUD boxes, status and controls lines, overlay panels"
```

---

## Task 5: Layout planner and the full frame assembler

**Files:**
- Create: `internal/render/layout.go`, `internal/render/layout_test.go`, `internal/render/render.go`, `internal/render/render_test.go`

**Interfaces:**
- Consumes: Tasks 2–4.
- Produces:
  ```go
  type LayoutKind uint8
  const (
      LayoutTooSmall LayoutKind = iota
      LayoutSmall
      LayoutMedium
      LayoutWide
  )

  const (
      MinWidth  = 40
      MinHeight = 24
  )

  type Layout struct {
      Kind               LayoutKind
      ShowTitle          bool // §49.3 drop 1
      ShowMissionControl bool // §49.3 drop 2
      ShowStatLabels     bool // §49.3 drop 3
      ShowHold           bool
      NextCount          int  // 5 wide/medium, 3 small
      SideBySideStats    bool // stats beside the board (wide) vs above it (medium/small)
      Width, Height      int
  }

  // Plan chooses a layout for the terminal size. Breakpoints:
  //   width < MinWidth || height < MinHeight        => LayoutTooSmall
  //   width >= 64 && height >= 28                   => LayoutWide
  //   width >= 48 && height >= 26                   => LayoutMedium
  //   otherwise                                     => LayoutSmall
  // Then elements are dropped by §49.3 order until the content fits Height:
  // title first, then mission control, then stat labels.
  func Plan(width, height int) Layout

  // TooSmallNotice renders the §31 notice with the current and needed sizes.
  func TooSmallNotice(width, height int, p Palette) string

  type Overlay uint8
  const (
      OverlayNone Overlay = iota
      OverlayPause
      OverlayGameOver
      OverlayHelp
  )

  type Scene struct {
      Board     game.Board
      Active    game.Piece
      Ghost     game.Piece
      ShowPiece bool

      Hold *game.PieceKind
      Next []game.PieceKind

      Score, Lines, Level, Combo int
      Seed                       int64

      Status  string
      Overlay Overlay
      HelpBody string // pre-rendered by the app from bubbles help

      Mode          Mode
      Width, Height int
  }

  // Render produces the whole frame. It follows §37's order, never mutates its
  // input, and guarantees: no line wider than Scene.Width, and no more lines
  // than Scene.Height.
  func Render(s Scene) string
  ```

**Design notes:** compute the required height as `BoardOuterHeight (22) + 1 controls + optional title + optional mission control`; drop in §49.3 order while it exceeds `Height`. NEXT and HOLD always live beside the board, never above or below it (§49.3). Assemble with `lipgloss.JoinHorizontal`/`JoinVertical` and center the board block with `lipgloss.Place`. Overlays are drawn last, centered over the assembled frame — Plan 3 keeps this seam by compositing FX before overlays.

**A note on the `FX` seam:** Plan 3 adds one field, `FX *fx.Overlay`, to `Scene` and one compositing step to `Render`. Do not add it now, but keep `Render` structured as "build panels → join → composite → overlay" so that step has a place to go.

- [ ] **Step 1: Write the failing tests**

`internal/render/layout_test.go`:

```go
func TestPlanBreakpoints(t *testing.T)
// table: (100,40)=>LayoutWide; (64,28)=>LayoutWide; (50,26)=>LayoutMedium;
// (40,24)=>LayoutSmall; (39,24)=>LayoutTooSmall; (40,23)=>LayoutTooSmall

// Review Focus #1
func TestPlanAtZeroSizeIsTooSmall(t *testing.T)
// (0,0) and (0,50) and (50,0) => LayoutTooSmall, no panic

func TestSmallLayoutDropsElementsInSpecOrder(t *testing.T)
// at (40,24): ShowTitle false, ShowMissionControl false, NextCount 3.
// at (48,26): ShowStatLabels true. Assert the drop order by walking heights
// 24..30 at width 64 and checking that ShowTitle never becomes true before
// ShowMissionControl does, which never becomes true before ShowStatLabels does.

func TestTooSmallNoticeStatesBothSizes(t *testing.T)
// TooSmallNotice(34,19,...) contains "THIS UNIVERSE IS TOO SMALL",
// "34", "19", "40", "24"
```

`internal/render/render_test.go`:

```go
func TestRenderFitsTheFrame(t *testing.T)
// helper demoScene(w,h) built from boardFromASCII; for sizes
// (40,24),(48,26),(64,28),(80,30),(120,50),(200,60) and all three modes:
// every stripped line width <= w, and the stripped line count <= h

// Review Focus #5
func TestRenderFitsOddSizes(t *testing.T)
// same assertions for (41,25),(43,27),(65,29),(81,31),(99,45)

func TestRenderNeverPanicsAcrossEverySize(t *testing.T)
// nested loop w in 1..120, h in 1..48, ModeFull: call Render and assert no panic
// and the frame-fitting invariants. Keep it fast: no golden comparison.

func TestRenderBelowMinimumShowsTheNotice(t *testing.T)
// (30,15): output contains "TOO SMALL" and does not contain the board border glyph

func TestRenderContainsTheBoardAtEverySize(t *testing.T)
// for each size at or above the minimum, the stripped output contains a run of
// 20 board-interior columns (assert BoardOuterWidth appears by locating a line
// with the border corner glyph and checking its width)

func TestRenderDoesNotMutateItsScene(t *testing.T)
// snapshot the Scene (including a deep compare of Board and Next) before and
// after Render; assert equality with reflect.DeepEqual

func TestOverlaysReplaceNothingBelowThem(t *testing.T)
// with OverlayPause: output still has the same line count as OverlayNone
// and contains "TEMPORAL SUSPENSION"
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/render/ -run 'TestPlan|TestTooSmall|TestRender|TestOverlays' -v`
Expected: build failure — `undefined: Plan`, `undefined: Render`.

- [ ] **Step 3: Implement `layout.go` and `render.go`**

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./... -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/render/layout.go internal/render/layout_test.go internal/render/render.go internal/render/render_test.go
git commit -m "feat(render): adaptive layout planner and frame assembler"
```

---

## Task 6: Wire the model — play, pause, restart, help, game over

**Files:**
- Modify: `internal/app/model.go`, `internal/app/update.go`
- Test: `internal/app/update_test.go` (extend)

**Interfaces:**
- Consumes: `render.Render`, `render.Scene`, `render.Plan` (Task 5); the engine's input methods (Plan 1).
- Produces:
  ```go
  // Scene projects the model into a render.Scene. Pure: no mutation.
  func (m Model) Scene() render.Scene

  // advance applies clamped elapsed time to the game and returns the events.
  // Plan 3 feeds those events to the FX world here.
  func (m *Model) advance(now time.Time) []game.Event
  ```

**Update behavior, exactly:**

- `tea.WindowSizeMsg`: store `Width`/`Height`. No other side effects.
- `tea.KeyPressMsg`, handled immediately, before any tick bookkeeping:
  - Quit → `tea.Quit`.
  - Help → toggle `ShowHelp`. While `ShowHelp` is true, only Help, Quit, and Pause are live.
  - Pause → toggle `StatePlaying` ⇄ `StatePaused` (ignored in `StateGameOver`).
  - Restart → `m.Game.Restart(newSeed)` where `newSeed` is the current `m.Game.Seed` (a deterministic reboot of the same universe; the seed is a CLI contract), then `State = StatePlaying`, clear `ShowHelp`.
  - Movement / rotation / drops / hold → only in `StatePlaying`; call the matching engine method and keep the returned events (Plan 3 consumes them).
- `FrameMsg`:
  1. If `LastFrame.IsZero()`, set `LastFrame = msg.Now` and re-arm the tick without advancing anything (Review Focus #2).
  2. `dt := msg.Now.Sub(m.LastFrame)`; clamp to `[0, MaxFrameDelta]`; `LastFrame = msg.Now`.
  3. In `StatePlaying`, `events := m.Game.Advance(dt)`; if any event is `EventGameOver`, set `State = StateGameOver`.
  4. Re-arm `frameTick()`.
- `View`: if `ShowHelp`, overlay `OverlayHelp` with `m.Help.View(m.Keys)` as the body; else pick the overlay from `State`. Always `AltScreen = true`.

- [ ] **Step 1: Write the failing tests**

Extend `internal/app/update_test.go`. Helper:

```go
// press feeds a key to the model and returns the updated Model.
func press(t *testing.T, m Model, code rune) Model
// frame feeds a FrameMsg at m.LastFrame + d.
func frame(t *testing.T, m Model, d time.Duration) Model
// newTestModel returns a model sized 80x30 with a fixed seed whose clock is
// already seeded (one zero-delta frame already applied).
func newTestModel(t *testing.T) Model
```

```go
// Review Focus #2
func TestFirstFrameSeedsTheClockWithoutAdvancing(t *testing.T)
// NewModel then Update(FrameMsg{time.Now()}): Game.Snapshot() is unchanged from
// a fresh game and LastFrame is non-zero

func TestFrameDeltaIsClamped(t *testing.T)
// a FrameMsg 10 seconds after the previous one advances the game by no more
// than MaxFrameDelta worth of gravity: assert the active piece's Y moved by 0
// (100ms < the 800ms level-1 interval)

// Review Focus #3
func TestThreeKeysInsideOneFrameAllApply(t *testing.T)
// record Active.X, press left three times with no FrameMsg between them:
// X decreased by exactly 3

func TestMovementKeysDriveTheEngine(t *testing.T)
// left/right change X; 'x' changes Rotation; 'z' rotates the other way;
// down increases Score by 1; space locks a piece (board gains 4 filled cells)

func TestHoldKeyStoresAPiece(t *testing.T)
// 'c': Game.Hold becomes non-nil

func TestPauseFreezesGameplay(t *testing.T)
// 'p' then a 1-second-worth sequence of clamped frames: Game.Snapshot() unchanged;
// 'p' again then frames: the piece falls

func TestPausedInputIsIgnored(t *testing.T)
// while paused, left/right/space/hold change nothing

func TestHelpTogglesAndBlocksGameplayKeys(t *testing.T)
// '?' sets ShowHelp; left does not move the piece; '?' clears it; left works again

func TestRestartResetsToAFreshUniverse(t *testing.T)
// play some frames and a hard drop, then 'r': Score 0, Lines 0, empty board,
// State StatePlaying, same Seed

func TestGameOverTransitionsStateAndStopsGameplay(t *testing.T)
// force game over by filling the model's board (m.Game.Board = boardFromASCII-like
// solid rows) and driving frames: State becomes StateGameOver; further left
// presses change nothing; 'r' restarts

func TestViewIsAltScreenAndNonEmptyInEveryState(t *testing.T)
// for StatePlaying, StatePaused, StateGameOver and ShowHelp: View().AltScreen is
// true and View().Content is non-empty

func TestViewAtZeroSizeDoesNotPanic(t *testing.T)
// a model with Width 0, Height 0: View() returns the too-small notice
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/app/ -v`
Expected: FAIL — keys not wired, no clamping, `undefined: (Model).Scene`.

- [ ] **Step 3: Implement the model wiring**

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `go test ./... -v && go vet ./...`
Expected: PASS, clean.

- [ ] **Step 5: Play it**

Run: `go run ./cmd/cosmic-tetris --seed 1234`. Confirm by hand: pieces fall and speed up as levels rise, all documented keys work, held keys repeat, hard drop lands instantly, ghost shows the landing spot, a completed row disappears, `p` pauses, `?` opens the manual, `r` restarts, `q` exits cleanly. Resize the window while playing — repeatedly, including down past 40×24 and back — and confirm it never garbles or crashes. Then `go run ./cmd/cosmic-tetris --ascii` and confirm it is playable with ASCII glyphs.

- [ ] **Step 6: Commit**

```bash
git add internal/app
git commit -m "feat(app): playable game loop with pause, restart, help, game over"
```

---

## Task 7: Golden layout snapshot tests

**Files:**
- Create: `internal/render/golden_test.go`, `internal/render/testdata/*.golden`

**Interfaces:**
- Consumes: `Render`, `Scene` (Task 5).
- Produces: the binding layout contract for §41 (and for Plan 3, which must not break it).

**Design notes:** golden tests compare `ansi.Strip(Render(scene))` so they test geometry and copy, not color. Every scene is built from a fixed board literal — never from a live game — so they are stable. Add `-update` to rewrite.

The seven scenarios from §41: `wide`, `medium`, `small`, `pause`, `gameover`, `help`, `ascii`.

- [ ] **Step 1: Write the failing tests**

`internal/render/golden_test.go`:

```go
var updateGolden = flag.Bool("update", false, "rewrite golden files")

// fixtureScene returns a deterministic scene: a board with a partial stack
// (built with boardFromASCII from Task 3), an active T at (4,8) with its ghost
// at the landing row, a held O, a next queue of I,J,L,S,Z, score 129340,
// lines 42, level 7, combo 3, seed 0x7F3A, status "GRAVITY TAX INCREASED".
func fixtureScene(mode Mode, w, h int, overlay Overlay) Scene

func TestGoldenLayouts(t *testing.T)
// table of the seven cases:
//   wide     ModeFull    100x36  OverlayNone
//   medium   ModeFull     56x27  OverlayNone
//   small    ModeFull     40x24  OverlayNone
//   pause    ModeFull    100x36  OverlayPause
//   gameover ModeFull    100x36  OverlayGameOver
//   help     ModeFull    100x36  OverlayHelp (HelpBody: a fixed 6-line string)
//   ascii    ModeASCII   100x36  OverlayNone
// each subtest: got := ansi.Strip(Render(scene)); compare to
// testdata/<name>.golden, writing it when -update is set.
// Then assert the structural invariants on `got` regardless of the golden:
//   - no line exceeds the scene width
//   - line count does not exceed the scene height
//   - the board's 22-column border box appears intact (find the line containing
//     the top-left border corner and assert its width and that the matching
//     bottom corner line exists exactly 21 lines later)
//   - the HUD does not intrude into the board interior: for every board row,
//     the 20 interior columns contain only block, ghost, or space glyphs
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `go test ./internal/render/ -run TestGoldenLayouts -v`
Expected: FAIL — golden files missing.

- [ ] **Step 3: Record the goldens and read every one of them**

Run: `go test ./internal/render/ -run TestGoldenLayouts -update && go test ./internal/render/ -run TestGoldenLayouts -v`

Then open all seven files and check them by eye against §4's intent: the board is the visual center, nothing overlaps, the HUD reads cleanly, the small layout has dropped the title and mission control, the ASCII one contains no Unicode. Fix the renderer and re-record if any of that is wrong — a golden file you have not read is not a test.

- [ ] **Step 4: Confirm the goldens are stable**

Run: `go test ./internal/render/ -count=3 -v`
Expected: PASS all three runs (catches map-iteration or time-dependent output).

- [ ] **Step 5: Commit**

```bash
git add internal/render/golden_test.go internal/render/testdata
git commit -m "test(render): golden ANSI-stripped layout snapshots for seven scenarios"
```

---

## Done when

- `go test ./... -v` passes, `go vet ./...` is silent, `go build ./...` succeeds.
- `cosmic-tetris`, `--seed N`, `--ascii`, `--no-fx`, `--reduced-motion`, and `--help` all run. (`--no-fx` and `--reduced-motion` parse and are stored but have nothing to suppress until Plan 3 — that is expected.)
- The game is playable start to game over: gravity accelerates, hold works once per piece, the ghost is accurate, the next queue shows five, lines clear, pause and restart work, the help overlay opens.
- Controls feel immediate: a key press moves the piece without waiting for the next frame.
- Resizing live — including below 40×24 and back — never panics and never garbles the frame.
- Seven golden layout files exist, have been read by a human, and pass three consecutive runs.
