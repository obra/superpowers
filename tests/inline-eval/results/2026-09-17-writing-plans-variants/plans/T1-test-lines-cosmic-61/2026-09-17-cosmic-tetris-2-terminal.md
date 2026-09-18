# Cosmic Tetris — Plan 2: Playable Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Plan 1's engine into a genuinely good, fully playable terminal game — keyboard control, board, ghost, hold, next queue, HUD, pause, help, restart, game over, live resize, ASCII fallback — with no cosmic effects yet.

**Architecture:** Three layers, one direction of dependency: `internal/game` (Plan 1) ← `internal/render` ← `internal/app` ← `cmd/cosmic-tetris`. The renderer never mutates game state; it draws into a `render.Canvas` (a rune + foreground-color grid) and returns one string. Drawing cell-by-cell into a canvas rather than nesting Lip Gloss boxes is deliberate: it makes the §41 golden tests exact, and it is what lets Plan 3 paint a starfield behind the board and shift the board by one cell without re-laying-out anything. Lip Gloss still owns all color and styling; Bubble Tea stays visible as the event loop.

**Tech Stack:** Go 1.26, `charm.land/bubbletea/v2` v2.0.9, `charm.land/lipgloss/v2` v2.0.6, `charm.land/bubbles/v2` v2.2.1, `github.com/charmbracelet/x/ansi` (width measurement and ANSI stripping in tests).

**Spec:** `design.md` (this plan implements §4, §8, §9 mechanics, §10, §26 colors, §28 final panel, §30, §31, §32, §33, §36, §37, §39, §41, §42 Phase 2, §46 partial, §49.3, §49.4, §49.7)

**Depends on:** `plans/2026-09-17-cosmic-tetris-1-engine.md` — completed, with `internal/game` exporting the signatures in its Interfaces blocks.
**Followed by:** `plans/2026-09-17-cosmic-tetris-3-cosmic-fx.md`, which adds `internal/fx`, `internal/flavor`, `--no-fx`, and `--reduced-motion`.

## Verified library facts

These were checked against the actual modules; do not substitute v1 idioms.

- `tea.Model` is `Init() tea.Cmd`, `Update(tea.Msg) (tea.Model, tea.Cmd)`, **`View() tea.View`** — not `View() string`. Build one with `v := tea.NewView(s)`.
- Full-window mode is a field, not a command: `v.AltScreen = true` on the returned `tea.View`.
- Key presses arrive as `tea.KeyPressMsg` (a `Key` with `Code rune`, `Text string`, `Mod`, `IsRepeat`). Its `String()` yields `"left"`, `"space"`, `"ctrl+c"`, `"h"`, and so on, so `key.Matches(msg, bindings...)` from `charm.land/bubbles/v2/key` works directly on it.
- The terminal's color capability arrives once at startup as `tea.ColorProfileMsg` wrapping a `colorprofile.Profile` (`TrueColor`, `ANSI256`, `ANSI`, `ASCII`, `NoTTY`, `Unknown`).
- Timers: `tea.Tick(d, func(time.Time) tea.Msg)`. Resize: `tea.WindowSizeMsg{Width, Height}`. Quit: `tea.Quit`.
- `lipgloss.Color("#22E4F7")` returns a comparable `color.Color`; `lipgloss.NewStyle().Foreground(c).Bold(b).Render(s)` styles a string.
- `ansi.Strip(s)` and `ansi.StringWidth(s)` come from `github.com/charmbracelet/x/ansi`.

## Global Constraints

- Dependency direction is `game ← render ← app ← cmd`. `internal/render` must not import `internal/app`; `internal/game` must not import anything of ours (design.md §33).
- The renderer must not mutate game state (§37). Every render entry point takes `*game.Game` and only reads it.
- One animation clock. There is exactly one recurring `tea.Tick` in the program, at 60 Hz, producing `app.FrameMsg`. Gravity is driven by passing the measured `dt` to `game.Advance` (§36). Deliberate deviation from §36's sketch: there is no separate `GravityMsg` and no `GameEventMsg` round trip — §36's own "prefer one animation clock and accumulated elapsed time rather than spawning multiple timing loops" is the binding instruction.
- Key presses are handled in the `Update` that receives them and never wait for a tick (§8, §44).
- Auto-repeat for held left/right comes from the terminal's own key repeat (repeated `tea.KeyPressMsg`). No DAS/ARR timers and no key-release handling.
- Every glyph the game draws must have display width 1 as measured by `ansi.StringWidth`; a logical block is two width-1 runes (§5).
- Minimum usable terminal is 40×24. Below that, draw the §31 notice. Resizing must never panic (§31).
- All copy that the spec quotes verbatim (§28 game-over panel, §30 pause panel, §31 too-small notice, §39 help overlay) is reproduced exactly, including capitalisation.
- Run `gofmt -l .` and `go vet ./...` before every commit; both must be silent.

## Review Focus

Input classes the spec implies but never names. Each has a test pinned in the task that owns the code.

- **A zero-size or 1×1 window** (size unknown before the first `WindowSizeMsg`, some CI terminals, `WithoutRenderer` tests): must draw the too-small notice rather than panic or divide by zero — Tasks 4, 7, 8.
- **Resize below the minimum mid-game and back up**: game state and score survive, no panic, the tick keeps running — Task 8.
- **A very large window (300×100)**: the board stays centered, no rendered line exceeds the window width, panels do not stretch — Tasks 4, 7.
- **Keys that mean nothing in the current state**: `ctrl+c` always quits; gameplay keys do nothing while paused, while the help overlay is up, or after game over; unknown keys are ignored — Tasks 8, 9.
- **Line width in every render mode**: after `ansi.Strip`, every row of the frame is exactly `Width` display columns in Full, Reduced, and ASCII mode — Tasks 3, 7.

---

## File Structure

| File | Responsibility |
|---|---|
| `cmd/cosmic-tetris/main.go` | flag parsing, `tea.NewProgram`, exit codes |
| `internal/app/model.go` | `Config`, `State`, `Model`, `New`, `Init`, `View` |
| `internal/app/update.go` | `Update`: key dispatch, frame clock, resize, color profile |
| `internal/app/messages.go` | `FrameMsg`, `FrameInterval`, `frameCmd` |
| `internal/app/keys.go` | `KeyMap`, `DefaultKeyMap`, help bindings |
| `internal/render/palette.go` | `Mode`, `ModeForProfile`, glyphs, `Palette` colors, `Dim` |
| `internal/render/canvas.go` | `Canvas`, `Set`/`SetString`/`Box`/`Plain`/`String`, box-char sets |
| `internal/render/layout.go` | `Tier`, `Layout`, `Compute`, all geometry constants |
| `internal/render/board.go` | board border, locked cells, ghost, active piece |
| `internal/render/hud.go` | title, hold, next, stats, controls, mission-control line |
| `internal/render/overlay.go` | centered panels: pause, help, game over, too-small |
| `internal/render/render.go` | `Scene`, `Render` — the §37 pipeline |
| `README.md` | what it is, how to run, keys, flags |

Tests: `internal/render/{canvas,layout,board,hud,glyphs,render}_test.go` with goldens under `internal/render/testdata/`, and `internal/app/{update,keys}_test.go`.

---

### Task 1: Dependencies and a Bubble Tea v2 smoke program

**Files:**
- Modify: `go.mod`
- Create: `cmd/cosmic-tetris/main.go`, `internal/app/model.go`, `internal/app/messages.go`
- Test: `internal/app/model_test.go`

**Interfaces:**
- Consumes: `game.New` (Plan 1).
- Produces:
  ```go
  // internal/app/messages.go
  const FrameInterval = time.Second / 60
  type FrameMsg struct{ Now time.Time }
  func frameCmd() tea.Cmd

  // internal/app/model.go
  type Config struct {
      Seed          int64
      SeedFixed     bool // true when --seed was given: restart reuses Seed
      ASCII         bool
      NoFX          bool // consumed by Plan 3
      ReducedMotion bool // consumed by Plan 3
  }

  type State int
  const (
      StatePlaying State = iota
      StatePaused
      StateGameOver
  )

  type Model struct {
      Cfg           Config
      Game          *game.Game
      Width, Height int
      Mode          render.Mode
      State         State
      ShowHelp      bool
      LastFrame     time.Time
      Keys          KeyMap
  }

  func New(cfg Config) Model
  func (m Model) Init() tea.Cmd
  func (m Model) Update(tea.Msg) (tea.Model, tea.Cmd)
  func (m Model) View() tea.View
  ```
  This task's `Update` handles only `tea.WindowSizeMsg`, `FrameMsg`, and a `q`/`ctrl+c` quit; `View` returns a placeholder string containing the score. Tasks 5–10 fill it in.

- [ ] **Step 1: Add the dependencies**

```bash
go get charm.land/bubbletea/v2@v2.0.9 charm.land/lipgloss/v2@v2.0.6 charm.land/bubbles/v2@v2.2.1 github.com/charmbracelet/x/ansi
```

- [ ] **Step 2: Write the failing tests in `internal/app/model_test.go`**

- `test_new_model_defaults`: `New(Config{Seed: 5})` -> `State` `StatePlaying`, `ShowHelp` false, `Game.Seed` 5, `Mode` `render.ModeReduced` (the pre-`ColorProfileMsg` default)
- `test_init_returns_a_command`: `Init()` -> non-nil
- `test_window_size_msg_stored`: `Update(tea.WindowSizeMsg{Width: 80, Height: 30})` -> `Width` 80, `Height` 30
- `test_frame_msg_returns_next_tick`: `Update(FrameMsg{Now: time.Now()})` -> non-nil `tea.Cmd`
- `test_first_frame_has_zero_dt`: fresh model (zero `LastFrame`), `Update(FrameMsg{Now: T})` -> `Game.GravityAccumulator` 0 and `LastFrame` == `T`
- `test_second_frame_advances`: after the first frame at `T`, `Update(FrameMsg{Now: T.Add(900*time.Millisecond)})` -> the active piece's `Y` increased by 1
- `test_quit_key`: `Update(tea.KeyPressMsg{Code: 'q'})` returns a command; invoking it yields `tea.QuitMsg`
- `test_ctrl_c_quits`: `tea.KeyPressMsg{Code: 'c', Mod: tea.ModCtrl}` likewise
- `test_view_does_not_panic_at_zero_size`: `New(Config{}).View()` does not panic and returns a non-empty `Content`

- [ ] **Step 3: Run tests to verify they fail**

Run: `go test ./internal/app/ -v`
Expected: FAIL — undefined: `New`, `FrameMsg`

- [ ] **Step 4: Implement the three files**

`frameCmd` is `tea.Tick(FrameInterval, func(t time.Time) tea.Msg { return FrameMsg{Now: t} })`. In the `FrameMsg` branch: if `LastFrame.IsZero()` use `dt = 0`, else `dt = msg.Now.Sub(m.LastFrame)`; store `LastFrame`; call `m.Game.Advance(dt)` when `State == StatePlaying`; always return `frameCmd()`.

`main.go` for now: `app.New(app.Config{Seed: time.Now().UnixNano()})`, `tea.NewProgram(m)`, `p.Run()`, exit 1 with the error on stderr. Flags come in Task 11.

`View()` returns `tea.NewView(fmt.Sprintf("cosmic tetris — score %d", m.Game.Score))` with `AltScreen = true`.

- [ ] **Step 5: Run tests and build**

Run: `go test ./... -v && go build ./...`
Expected: PASS, binary builds

- [ ] **Step 6: Run the program by hand to confirm the loop and altscreen work**

Run: `go run ./cmd/cosmic-tetris` — the screen clears, the placeholder line shows, `q` exits cleanly and restores the terminal.

- [ ] **Step 7: Commit**

```bash
git add go.mod go.sum cmd internal/app
git commit -m "feat(app): bubble tea v2 program skeleton with a single 60Hz frame clock"
```

---

### Task 2: Render modes, glyphs, and palette

**Files:**
- Create: `internal/render/palette.go`
- Test: `internal/render/palette_test.go`, `internal/render/glyphs_test.go`

**Interfaces:**
- Consumes: `game.PieceKind`, `game.KindCount`.
- Produces:
  ```go
  type Mode int
  const (
      ModeFull Mode = iota
      ModeReduced
      ModeASCII
  )
  func (m Mode) String() string
  func ModeForProfile(p colorprofile.Profile, forceASCII bool) Mode

  const CellCols = 2 // terminal columns per logical block (§5)

  type Glyphs struct {
      Block  [CellCols]rune // '█','█'  | ASCII '[' ,']'
      Ghost  [CellCols]rune // '░','░'  | ASCII '·','·'  (§49.4)
      Empty  [CellCols]rune // ' ',' '
      Box    BoxChars       // BoxDouble for the board | BoxASCII
      Panel  BoxChars       // BoxRound for panels    | BoxASCII
      Comet  rune           // '☄' | '*'
  }
  func GlyphsFor(m Mode) Glyphs

  type Palette struct {
      Locked      [game.KindCount]color.Color
      Active      [game.KindCount]color.Color
      Ghost       color.Color
      Border      color.Color   // resting border color
      BorderCycle []color.Color // §25 palette, used by Plan 3
      Label       color.Color
      Value       color.Color
      Mission     color.Color
      Banner      color.Color
      Dimmed      color.Color
  }
  func NewPalette(m Mode) Palette
  func Dim(c color.Color, f float64) color.Color   // scale RGB by f, clamped to [0,1]
  func Lerp(a, b color.Color, t float64) color.Color
  ```

Pinned colors (§26, §49.4 — filled glyphs with a bright foreground, no background pairing):

| Kind | Locked | Active |
|---|---|---|
| I plasma cyan | `#22E4F7` | `#9FF7FF` |
| J deep electric blue | `#3B5BFF` | `#93A7FF` |
| L solar orange | `#FF8A2B` | `#FFC08A` |
| O stellar gold | `#FFD447` | `#FFEBA3` |
| S alien green | `#43F58A` | `#A6FFC9` |
| T ultraviolet | `#A855F7` | `#D6ADFF` |
| Z supernova pink | `#FF3D77` | `#FF9BB8` |

Others: `Ghost #4A5470`, `Border #6D28D9`, `Label #7C8AA5`, `Value #E8F0FF`, `Mission #9FF7FF`, `Banner #FFEBA3`, `Dimmed #3A4256`. `BorderCycle` = `#6D28D9` (deep violet), `#22E4F7` (electric cyan), `#FF3DE0` (magenta), `#3B5BFF` (stellar blue), `#F5F9FF` (hot white).

All three modes use the same hex values — the terminal's color profile downsamples them. What changes per mode is glyphs (§32 "no special Unicode assumptions"), not the palette.

- [ ] **Step 1: Write the failing tests in `internal/render/palette_test.go` and `glyphs_test.go`**

- `test_mode_for_truecolor`: `ModeForProfile(colorprofile.TrueColor, false)` -> `ModeFull`
- `test_mode_for_256`: `colorprofile.ANSI256` -> `ModeReduced`
- `test_mode_for_ansi`: `colorprofile.ANSI` -> `ModeReduced`
- `test_mode_for_ascii_profile`: `colorprofile.ASCII` -> `ModeASCII`; `colorprofile.NoTTY` -> `ModeASCII`; `colorprofile.Unknown` -> `ModeASCII`
- `test_force_ascii_wins`: `ModeForProfile(colorprofile.TrueColor, true)` -> `ModeASCII`
- `test_glyphs_full_mode`: `GlyphsFor(ModeFull).Block` -> `{'█','█'}`; `.Ghost` -> `{'░','░'}`
- `test_glyphs_ascii_mode`: `.Block` -> `{'[',']'}`; `.Ghost` -> `{'·','·'}`; `.Box` -> `BoxASCII`; `.Comet` -> `'*'`. (§49.4 pins the ASCII ghost as `··` — U+00B7 is the one non-ASCII rune the spec deliberately keeps in ASCII mode.)
- `test_all_glyphs_are_single_width`: for every mode, every rune in `GlyphsFor(m)` plus every rune used by `BoxDouble`, `BoxRound`, `BoxASCII` satisfies `ansi.StringWidth(string(r))` -> `1`
- `test_palette_has_a_color_per_kind`: for every kind, `Locked[k]` and `Active[k]` are non-nil and differ from each other
- `test_active_is_brighter_than_locked`: for every kind, the sum of the RGBA components of `Active[k]` exceeds that of `Locked[k]` (§49.4)
- `test_border_cycle_length`: `len(BorderCycle)` -> `5`
- `test_dim_halves`: `Dim(lipgloss.Color("#808080"), 0.5)` -> RGB components within 1 of `0x40`
- `test_dim_clamps`: `Dim(c, 2.0)` never exceeds `0xFFFF` per component; `Dim(c, -1)` -> black
- `test_lerp_endpoints`: `Lerp(a, b, 0)` == `a`'s components; `Lerp(a, b, 1)` == `b`'s components; `t=0.5` is between

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -v`
Expected: FAIL — undefined: `ModeForProfile`

- [ ] **Step 3: Implement `internal/render/palette.go`**

`Dim`/`Lerp` work on the 16-bit values from `color.Color.RGBA()` and return `color.RGBA` (remember `RGBA()` returns alpha-premultiplied 16-bit values; divide by 257 to get 8-bit).

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/palette.go internal/render/palette_test.go internal/render/glyphs_test.go
git commit -m "feat(render): render modes, single-width glyph sets, neon space palette"
```

---

### Task 3: The canvas

**Files:**
- Create: `internal/render/canvas.go`
- Test: `internal/render/canvas_test.go`

**Interfaces:**
- Consumes: `Palette` colors.
- Produces:
  ```go
  type Attr uint8
  const (
      AttrBold Attr = 1 << iota
      AttrFaint
  )

  type BoxChars struct{ TL, TR, BL, BR, H, V rune }
  var (
      BoxDouble = BoxChars{'╔', '╗', '╚', '╝', '═', '║'}
      BoxRound  = BoxChars{'╭', '╮', '╰', '╯', '─', '│'}
      BoxASCII  = BoxChars{'+', '+', '+', '+', '-', '|'}
  )

  type Canvas struct {
      W, H int
      // unexported cell grid
  }
  func NewCanvas(w, h int) *Canvas                                   // clamps negatives to 0
  func (c *Canvas) Clear()
  func (c *Canvas) Set(x, y int, r rune, fg color.Color, a Attr)      // silently clips out-of-bounds
  func (c *Canvas) SetString(x, y int, s string, fg color.Color, a Attr) // left to right, clipped
  func (c *Canvas) SetCentered(y int, s string, fg color.Color, a Attr)  // centered horizontally, clipped
  func (c *Canvas) Box(x, y, w, h int, b BoxChars, fg color.Color, a Attr) // border only, interior untouched
  func (c *Canvas) FillRect(x, y, w, h int, r rune, fg color.Color, a Attr)
  func (c *Canvas) At(x, y int) (rune, color.Color, Attr)             // (' ', nil, 0) out of bounds
  func (c *Canvas) Plain() []string                                    // H rows, no ANSI, exactly W runes each
  func (c *Canvas) String() string                                     // H styled rows joined by "\n"
  ```

- [ ] **Step 1: Write the failing tests in `internal/render/canvas_test.go`**

- `test_new_canvas_is_blank`: `NewCanvas(4,2).Plain()` -> `["    ", "    "]`
- `test_new_canvas_negative_size`: `NewCanvas(-5,-5)` -> `W` 0, `H` 0, `Plain()` -> empty slice, and `Set(0,0,'x',nil,0)` does not panic
- `test_set_and_at`: `Set(1,1,'X',c,AttrBold)`; `At(1,1)` -> `'X'`, same color, `AttrBold`
- `test_set_out_of_bounds_is_ignored`: `Set(-1,0,...)`, `Set(0,-1,...)`, `Set(99,0,...)`, `Set(0,99,...)` leave `Plain()` unchanged and do not panic
- `test_set_string_clips_at_right_edge`: on a 4-wide canvas, `SetString(2,0,"abcd",...)` -> row 0 `Plain()` is `"  ab"`
- `test_set_string_negative_x_clips_left`: `SetString(-2,0,"abcd",...)` -> `"cd  "`
- `test_set_string_multibyte`: `SetString(0,0,"██✦",...)` on a 4-wide canvas -> `Plain()[0]` has 3 runes plus a space, and `ansi.StringWidth(Plain()[0])` -> `4`
- `test_set_centered`: `SetCentered(0,"ab",...)` on width 6 -> `"  ab  "`
- `test_set_centered_too_long`: a 10-rune string on width 4 -> exactly 4 runes, no panic
- `test_box_draws_border_only`: `Box(0,0,4,3,BoxRound,...)` -> `["╭──╮","│  │","╰──╯"]`
- `test_box_minimum_size`: `Box(0,0,1,1,...)` and `Box(0,0,0,0,...)` do not panic
- `test_box_clipped_at_edge`: a box starting at `x = W-2` draws only its visible columns
- `test_fill_rect`: `FillRect(1,0,2,2,'#',...)` -> `["·##·"...]` pattern as expected (use `.` placeholders in the assertion by pre-filling)
- `test_plain_rows_have_exact_width`: for a canvas painted with a mixture of glyphs, every `Plain()` row has `ansi.StringWidth` equal to `W`
- `test_string_strips_to_plain`: `ansi.Strip(c.String())` split on `"\n"` equals `Plain()`
- `test_string_coalesces_runs`: a row of 20 identically-colored `'█'` produces at most 2 SGR sequences in that row (count `"\x1b["` occurrences) — proves adjacent same-style cells share one `Render` call
- `test_string_row_count`: `strings.Count(c.String(), "\n")` -> `H-1`
- `test_clear_resets`: after painting, `Clear()` -> `Plain()` all spaces

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run TestCanvas -v`
Expected: FAIL — undefined: `NewCanvas`

- [ ] **Step 3: Implement `internal/render/canvas.go`**

Cells are `struct{ r rune; fg color.Color; a Attr }` in a single `[]cell` of length `W*H`. `String()` walks each row, grouping consecutive cells whose `fg` and `a` are equal (`color.Color` values from `lipgloss.Color` are comparable), and renders each run with one `lipgloss.NewStyle()` call; a run with `fg == nil` and `a == 0` is emitted unstyled.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/canvas.go internal/render/canvas_test.go
git commit -m "feat(render): rune+color canvas with clipping, boxes, and style coalescing"
```

---

### Task 4: Adaptive layout

**Files:**
- Create: `internal/render/layout.go`
- Test: `internal/render/layout_test.go`

**Interfaces:**
- Consumes: `game.Width`, `game.VisibleRows`, `CellCols`.
- Produces:
  ```go
  const (
      BoardCols  = game.Width * CellCols // 20
      BoardRows  = game.VisibleRows      // 20
      BoardBoxW  = BoardCols + 2         // 22
      BoardBoxH  = BoardRows + 2         // 22
      PanelW     = 10                    // interior 8 = widest piece (4 cells)
      HoldBoxH   = 4                     // interior 2
      StatsBoxH  = 6                     // 3 label+value pairs
      StatsBoxHNoLabels = 3
      MinWidth   = 40
      MinHeight  = 24
  )

  type Tier int
  const (
      TierTooSmall Tier = iota
      TierSmall
      TierMedium
      TierWide
  )

  type Rect struct{ X, Y, W, H int }

  type Layout struct {
      Tier          Tier
      Width, Height int
      Board         Rect // the board box including its border
      Hold          Rect // zero W/H when hidden
      Next          Rect
      Stats         Rect
      Frame         Rect // the outer title frame; zero when hidden
      MissionY      int  // -1 when hidden
      ControlsY     int
      ShowTitle     bool
      ShowHold      bool
      ShowStatLabels bool
      ShowMission   bool
      NextCount     int // 5 at Medium/Wide, 3 at Small
  }

  func Compute(width, height int) Layout
  ```

Pinned rules:

```text
Tier:      width < 40 || height < 24            -> TierTooSmall
           width >= 64 && height >= 27          -> TierWide
           width >= 50 && height >= 25          -> TierMedium
           otherwise                            -> TierSmall

Drop order as height runs out (§49.3):
  ShowTitle      = height >= 27
  ShowMission    = height >= 25
  ShowStatLabels = height >= 25
  controls       = always

ShowHold  = Tier >= TierMedium
NextCount = 5 at Medium/Wide, 3 at Small   (NEXT is always beside the board, never above or below it)

Vertical stack:  Board.Y = 1 if ShowTitle else 0
                 y = Board.Y + BoardBoxH
                 MissionY = y then y++      (when ShowMission)
                 ControlsY = y
                 Frame = {0, 0, width, height} when ShowTitle

Horizontal:      leftW    = PanelW+1 when ShowHold, else 0
                 contentW = leftW + BoardBoxW + PanelW + 1
                 x0       = max(0, (width - contentW) / 2)
                 Hold  = {x0, Board.Y, PanelW, HoldBoxH}
                 Board = {x0 + leftW, Board.Y, BoardBoxW, BoardBoxH}
                 Next  = {Board.X + BoardBoxW + 1, Board.Y, PanelW, 2 + 3*NextCount - 1}
                 Stats = {Hold.X or Next.X when no hold, panel bottom + 1, PanelW,
                          StatsBoxH or StatsBoxHNoLabels}
```

- [ ] **Step 1: Write the failing tests in `internal/render/layout_test.go`**

- `test_too_small_width`: `Compute(39,40).Tier` -> `TierTooSmall`
- `test_too_small_height`: `Compute(80,23).Tier` -> `TierTooSmall`
- `test_zero_size`: `Compute(0,0).Tier` -> `TierTooSmall`, and no field is negative
- `test_negative_size`: `Compute(-5,-5)` does not panic and reports `TierTooSmall`
- `test_minimum_is_small`: `Compute(40,24).Tier` -> `TierSmall`
- `test_medium_threshold`: `Compute(50,25).Tier` -> `TierMedium`; `Compute(49,25)` -> `TierSmall`
- `test_wide_threshold`: `Compute(64,27).Tier` -> `TierWide`; `Compute(63,27)` -> `TierMedium`
- `test_small_hides_hold`: `Compute(40,24).ShowHold` -> `false`; `NextCount` -> `3`
- `test_small_hides_title_and_mission`: `Compute(40,24)` -> `ShowTitle` false, `ShowMission` false, `MissionY` -1, `ShowStatLabels` false
- `test_medium_shows_mission_not_title`: `Compute(50,25)` -> `ShowTitle` false, `ShowMission` true
- `test_wide_shows_everything`: `Compute(80,30)` -> `ShowTitle` true, `ShowMission` true, `ShowHold` true, `NextCount` 5
- `test_board_dimensions_never_change`: for every `(w,h)` in a sweep of 40..200 × 24..60, `Board.W` -> `22` and `Board.H` -> `22`
- `test_nothing_overlaps`: for the same sweep, the `Board`, `Hold`, `Next`, `Stats` rects (skipping zero-sized ones) are pairwise non-intersecting, and no rect intersects the `MissionY` or `ControlsY` rows
- `test_everything_inside_the_window`: for the same sweep, every rect satisfies `X >= 0`, `Y >= 0`, `X+W <= width`, `Y+H <= height`; `ControlsY < height`
- `test_board_centered_when_wide`: `Compute(300,100)` -> the gap left of `Hold` is within 1 of the gap right of `Next`
- `test_huge_window_does_not_stretch_panels`: `Compute(300,100).Next.W` -> `10`
- `test_controls_below_board`: for the sweep, `ControlsY >= Board.Y + Board.H`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run TestLayout -v`
Expected: FAIL — undefined: `Compute`

- [ ] **Step 3: Implement `internal/render/layout.go`**

Return early with `Tier: TierTooSmall` and everything else zeroed (`MissionY: -1`) when below the minimum.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/layout.go internal/render/layout_test.go
git commit -m "feat(render): responsive layout tiers with the pinned small-terminal drop order"
```

---

### Task 5: Board rendering — border, locked cells, ghost, active piece

**Files:**
- Create: `internal/render/board.go`
- Test: `internal/render/board_test.go`

**Interfaces:**
- Consumes: `Canvas`, `Layout`, `Palette`, `Glyphs`, `game.Game`, `game.GhostY`.
- Produces:
  ```go
  // DrawBoard paints the board box, locked cells, ghost, and active piece.
  // offX/offY shift only the board contents and border (Plan 3's screen shake);
  // pass 0,0 here. border is the border color for this frame.
  // (Plan 3 Task 5 replaces the single `border color.Color` parameter with the
  // animated `phase, flash float64` pair; nothing else in this signature moves.)
  func DrawBoard(c *Canvas, l Layout, p Palette, g *Glyphs, gm *game.Game, border color.Color, offX, offY int)

  // BoardCellOrigin maps a board cell to the top-left screen column/row of its
  // two-column glyph. Hidden rows map above the box interior.
  func BoardCellOrigin(l Layout, bx, by int) (x, y int)
  ```
  Formula: `x = l.Board.X + 1 + bx*CellCols`, `y = l.Board.Y + 1 + (by - game.HiddenRows)`. Plan 3 reuses this to place FX in board space.

- [ ] **Step 1: Write the failing tests in `internal/render/board_test.go`**

Helper: `paint(t, w, h, mode, gm) []string` builds a canvas of `w×h`, computes the layout, calls `DrawBoard`, returns `Plain()`.

- `test_board_box_drawn`: on an 80×30 canvas the top-left of the board box is `'╔'` and the bottom-right is `'╝'`
- `test_board_interior_is_twenty_by_twenty`: the interior region is 20 columns × 20 rows and, on an empty board with the active piece removed from view, all spaces
- `test_hidden_rows_not_drawn`: lock a cell at board row 1 (hidden) -> no glyph appears anywhere in the interior
- `test_locked_cell_position`: lock a cell at board `(0,21)` -> the interior's bottom-left two columns are `'█','█'`
- `test_locked_cell_rightmost`: lock at `(9,21)` -> the bottom-right two interior columns are filled
- `test_locked_cell_color`: lock a `KindS` cell; `At` on that column reports `p.Locked[game.KindS]`
- `test_active_piece_drawn_brighter`: the active piece's cells report `p.Active[kind]`, not `p.Locked[kind]`
- `test_ghost_drawn_at_landing`: with the active piece high on an empty board, the two interior columns at `GhostY()`'s bottom row are `'░','░'` in `p.Ghost`
- `test_ghost_never_covers_locked`: pre-fill the row under the piece; assert no `'░'` appears on a cell that holds a locked block (§10)
- `test_active_covers_ghost`: when the piece is already at its landing row, the cells show the block glyph, not the ghost glyph
- `test_ascii_mode_glyphs`: in `ModeASCII` a locked cell renders `'[' ,']'` and the box corner is `'+'`
- `test_offset_shifts_everything`: `DrawBoard` with `offX: 1, offY: -1` moves the box corner one column right and one row up
- `test_offset_clips_at_edges`: `offX: 5` on a canvas only 2 columns wider than the layout does not panic and does not wrap glyphs to the next row (compare row widths)
- `test_does_not_mutate_game`: snapshot `*gm` (including `Board.Cells`) before and after `DrawBoard` -> `reflect.DeepEqual` true

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run TestBoard -v`
Expected: FAIL — undefined: `DrawBoard`

- [ ] **Step 3: Implement `internal/render/board.go`**

Draw order inside the function follows §37 steps 3–5: locked cells, then ghost (skipping cells that already hold a locked block or that the active piece occupies), then the active piece, then the border box last so it is never overdrawn.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/board.go internal/render/board_test.go
git commit -m "feat(render): board border, locked cells, ghost piece, and active piece"
```

---

### Task 6: HUD — title, hold, next, stats, controls, mission line

**Files:**
- Create: `internal/render/hud.go`
- Test: `internal/render/hud_test.go`

**Interfaces:**
- Consumes: `Canvas`, `Layout`, `Palette`, `Glyphs`, `game.Game`, `game.PieceKind`.
- Produces:
  ```go
  func DrawFrame(c *Canvas, l Layout, p Palette, g *Glyphs, seed int64, border color.Color)
  func DrawHold(c *Canvas, l Layout, p Palette, g *Glyphs, hold *game.PieceKind)
  func DrawNext(c *Canvas, l Layout, p Palette, g *Glyphs, next []game.PieceKind)
  func DrawStats(c *Canvas, l Layout, p Palette, gm *game.Game)
  func DrawControls(c *Canvas, l Layout, p Palette)
  func DrawMission(c *Canvas, l Layout, p Palette, g *Glyphs, msg string)
  func UniverseID(seed int64) string // fmt.Sprintf("%04X", uint16(seed))
  func DrawPieceMini(c *Canvas, x, y int, p Palette, g *Glyphs, k game.PieceKind) // 2-row, ≤8-column preview
  ```

Pinned copy:
- Title (drawn into the frame's top border, `ShowTitle` only): `─ ✦ COSMIC TETRIS ` then dashes, then ` LOCAL UNIVERSE <id> ` then dashes to the right corner, where `<id>` is `UniverseID(seed)`.
- Panel labels: `HOLD`, `NEXT`, `SCORE`, `LINES`, `LEVEL` — drawn only when `ShowStatLabels`.
- Stat values: `fmt.Sprintf("%08d", Score)`, `fmt.Sprintf("%03d", Lines)`, `fmt.Sprintf("%02d", Level)`.
- Controls line: `←→ move   ↑ rotate   ↓ descend   SPACE YEET   C hold   ? help` in Full/Reduced; `<> move   ^ rotate   v descend   SPACE YEET   C hold   ? help` in ASCII. Truncated from the right to fit.
- Mission line: `<comet> MISSION CONTROL: <msg>`, truncated to fit; nothing drawn when `msg` is empty.

- [ ] **Step 1: Write the failing tests in `internal/render/hud_test.go`**

- `test_universe_id`: `UniverseID(0x7F3A)` -> `"7F3A"`; `UniverseID(-1)` -> `"FFFF"`
- `test_frame_title_present`: on 80×30 the top border row contains `"COSMIC TETRIS"` and `"LOCAL UNIVERSE"`
- `test_frame_row_width_exact`: every row of `Plain()` after `DrawFrame` has width equal to the canvas width
- `test_hold_empty`: `DrawHold(..., nil)` draws the panel box and the `HOLD` label, and its interior is blank
- `test_hold_shows_piece`: with `KindT`, block glyphs appear inside the hold panel in `p.Locked[KindT]`
- `test_next_draws_five`: `DrawNext` with 5 kinds and `NextCount` 5 -> five distinct 2-row previews, all inside `l.Next`
- `test_next_truncates_to_count`: with `NextCount` 3 and a 5-kind slice, only 3 previews are drawn and nothing is written below `l.Next`
- `test_next_short_slice`: a 1-kind slice does not panic
- `test_stats_values_formatted`: score 129340 -> `"00129340"` appears; lines 42 -> `"042"`; level 7 -> `"07"`
- `test_stats_labels_hidden`: with `ShowStatLabels` false, `"LINES"` does not appear but `"042"` does (§49.3)
- `test_controls_line_present`: the `ControlsY` row contains `"hold"` and `"help"`
- `test_controls_truncated_not_wrapped`: at width 40 the controls row is exactly 40 columns and no text appears on the following row
- `test_controls_ascii_mode`: in `ModeASCII` the controls row contains no rune outside U+0000..U+007F
- `test_mission_line`: `DrawMission(..., "NOMINALISH")` -> the `MissionY` row contains `"MISSION CONTROL: NOMINALISH"`
- `test_mission_empty_draws_nothing`: with `""` the `MissionY` row is all spaces
- `test_mission_long_message_truncated`: a 200-character message leaves the row exactly the canvas width
- `test_hud_never_writes_into_the_board`: paint the board with a sentinel via `FillRect` over `l.Board`, run every HUD draw, and assert every cell inside `l.Board` still holds the sentinel (§41 "HUD doesn't corrupt board")

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run TestHud -v`
Expected: FAIL — undefined: `DrawHold`

- [ ] **Step 3: Implement `internal/render/hud.go`**

`DrawPieceMini` centers the kind's rotation-0 cells in an 8-column, 2-row region using `game.SpawnPiece(k).Cells()` normalized to the box.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/render/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/render/hud.go internal/render/hud_test.go
git commit -m "feat(render): title frame, hold/next panels, stats, controls, mission line"
```

---

### Task 7: Frame assembly, too-small notice, and golden snapshots

**Files:**
- Create: `internal/render/render.go`, `internal/render/overlay.go`, `internal/render/testdata/*.golden`
- Test: `internal/render/render_test.go`
- Modify: `internal/app/model.go` (`View` calls `render.Render`)

**Interfaces:**
- Consumes: everything from Tasks 2–6.
- Produces:
  ```go
  // Scene is the complete input to a frame. Plan 3 adds FX, Booting, and
  // BootElapsed fields; nothing else about this struct changes.
  type Scene struct {
      Game     *game.Game
      Width    int
      Height   int
      Mode     Mode
      Paused   bool
      ShowHelp bool
      GameOver bool
      Seed     int64
      Mission  string
  }

  func Render(s Scene) string

  // overlay.go
  func DrawPanel(c *Canvas, p Palette, g *Glyphs, title string, lines []string) Rect // centered, clipped
  func DrawTooSmall(c *Canvas, p Palette, w, h int)
  ```

`Render` follows §37: compute layout; if `TierTooSmall`, draw only the notice and return. Otherwise draw frame, board, hold, next, stats, mission, controls, then overlays. Plan 3 inserts starfield before the board and FX composites after it, at the numbered §37 slots.

Pinned §31 notice copy (centered, one blank row between blocks):

```text
THIS UNIVERSE IS TOO SMALL

resize terminal to continue

current: 34 × 19
needed: approximately 40 × 24
```

- [ ] **Step 1: Write the failing tests in `internal/render/render_test.go`**

Fixture: `fixtureScene(t, w, h, mode Mode) Scene` uses `game.New(8675309)` then applies this exact script so the board has content — `[]game.Input{InputLeft, InputLeft, InputHardDrop, InputRight, InputRotateCW, InputHardDrop, InputHold, InputHardDrop, InputRotateCCW, InputHardDrop, InputRight, InputRight, InputHardDrop}` with `Advance(120*time.Millisecond)` between each — and sets `Mission: "GRAVITY REMAINS MOSTLY LEGAL"`.

Golden tests compare `ansi.Strip(Render(scene))` against `testdata/<name>.golden`, regenerated with `go test ./internal/render/ -update`:

- `test_golden_wide`: 80×30
- `test_golden_medium`: 54×26
- `test_golden_small`: 40×24
- `test_golden_ascii`: 80×30 in `ModeASCII`
- `test_golden_too_small`: 34×19 — the golden contains the §31 copy including `current: 34 × 19`
- `test_golden_pause`: 80×30 with `Paused: true`
- `test_golden_help`: 80×30 with `ShowHelp: true`
- `test_golden_game_over`: 80×30 with `GameOver: true`

Plus invariants that do not depend on goldens:

- `test_every_row_is_exactly_width`: for `(w,h)` in `{40×24, 54×26, 80×30, 300×100, 34×19, 1×1, 0×0}` and all three modes, every line of `ansi.Strip(Render(s))` has `ansi.StringWidth` equal to `w` (or the output is empty when `w == 0`)
- `test_row_count_is_exactly_height`: same sweep, line count equals `h`
- `test_zero_size_no_panic`: `Render` with `Width: 0, Height: 0` returns `""` and does not panic
- `test_one_by_one_no_panic`: `Width: 1, Height: 1` does not panic
- `test_resize_sweep_no_panic`: every `(w,h)` in 0..90 × 0..40 renders without panicking
- `test_render_does_not_mutate_game`: deep-equal the `game.Game` before and after `Render` (§37)
- `test_overlays_do_not_change_size`: the pause, help, and game-over renders have the same line count and width as the plain render
- `test_help_contains_flight_manual`: the help render contains `"FLIGHT MANUAL"` and every §39 row label (`"YEET"`, `"quantum storage"`, `"suspend spacetime"`, `"reboot universe"`, `"abandon mission"`)
- `test_pause_contains_copy`: contains `"TEMPORAL SUSPENSION"` and `"SPACE IS PAUSED"`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/render/ -run TestGolden -v`
Expected: FAIL — undefined: `Render`

- [ ] **Step 3: Implement `render.go` and `overlay.go`**

The overlay panels' exact contents come from §30 (pause), §39 (help), and §28 (game over, wired in Task 10). Build them with `DrawPanel`, which sizes the box to the longest line plus padding and centers it in the canvas.

- [ ] **Step 4: Generate and eyeball the goldens, then verify**

Run: `go test ./internal/render/ -update && go test ./internal/render/ -v`
Expected: PASS. Read `testdata/wide.golden` and `testdata/small.golden` yourself: nothing overlaps, the board is 20×20 inside a 22×22 box, panels sit beside it, the controls line is the bottom row of content.

- [ ] **Step 5: Wire `app.Model.View` to `render.Render`**

Replace the placeholder view with a `render.Scene` built from the model: `Paused: m.State == StatePaused`, `GameOver: m.State == StateGameOver`, `ShowHelp: m.ShowHelp`, `Seed: m.Cfg.Seed`. Keep `AltScreen = true`.

- [ ] **Step 6: Run everything**

Run: `go test ./... -v && go run ./cmd/cosmic-tetris`
Expected: PASS, and a real board appears in the terminal.

- [ ] **Step 7: Commit**

```bash
git add internal/render internal/app/model.go
git commit -m "feat(render): frame pipeline, too-small notice, and golden layout snapshots"
```

---

### Task 8: Keys, input dispatch, resize, and the frame clock

**Files:**
- Create: `internal/app/keys.go`, `internal/app/update.go`
- Modify: `internal/app/model.go`
- Test: `internal/app/keys_test.go`, `internal/app/update_test.go`

**Interfaces:**
- Consumes: `game.Apply`, `game.Advance`, `render.ModeForProfile`, `FrameMsg`.
- Produces:
  ```go
  type KeyMap struct {
      Left, Right, SoftDrop, RotateCW, RotateCCW, HardDrop,
      Hold, Pause, Restart, Help, Quit key.Binding
  }
  func DefaultKeyMap() KeyMap
  func (k KeyMap) ShortHelp() []key.Binding
  func (k KeyMap) FullHelp() [][]key.Binding
  func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) // full version
  ```

Pinned bindings (§8 plus the optional WASD aliases):

```text
Left       left, h, a
Right      right, l, d
SoftDrop   down, j, s
RotateCW   up, k, x, w
RotateCCW  z
HardDrop   space, " "
Hold       c
Pause      p
Restart    r
Help       ?
Quit       q, esc, ctrl+c
```

- [ ] **Step 1: Write the failing tests in `internal/app/keys_test.go` and `update_test.go`**

Helper: `press(m Model, code rune) Model` and `pressKey(m Model, k tea.KeyPressMsg) (Model, tea.Cmd)`.

- `test_binding_keys`: `DefaultKeyMap().Left.Keys()` -> `["left","h","a"]`; `HardDrop.Keys()` contains `"space"`
- `test_full_help_has_every_action`: `FullHelp()` flattened has 11 bindings, each with a non-empty help description
- `test_left_moves_piece`: `tea.KeyPressMsg{Code: tea.KeyLeft}` -> `Active.X` decreases by 1
- `test_h_moves_piece`: `Code: 'h'` behaves identically
- `test_a_alias`: `Code: 'a'` behaves identically
- `test_right_and_aliases`: `tea.KeyLeft`/`'l'`/`'d'` mirror
- `test_soft_drop_scores`: `tea.KeyDown` -> `Score` 1
- `test_rotate_cw_and_aliases`: `tea.KeyUp`, `'k'`, `'x'`, `'w'` each advance `Rotation` by 1
- `test_rotate_ccw`: `'z'` -> `Rotation` 3
- `test_space_hard_drops`: `tea.KeyPressMsg{Code: tea.KeySpace}` -> the piece locks (board gains cells, a new piece is active)
- `test_c_holds`: `'c'` -> `Hold` non-nil
- `test_unknown_key_ignored`: `'§'` and `tea.KeyPressMsg{Code: tea.KeyF5}` change nothing and return no command
- `test_input_does_not_wait_for_a_tick`: five `Left` presses with no `FrameMsg` between them -> `Active.X` moved 5 (§44)
- `test_frame_advances_gravity`: frames at `T` and `T+900ms` -> the piece dropped exactly once at level 1
- `test_frame_clamped_dt_is_engine_side`: a frame 10 s after the previous one does not lock the piece (relies on Plan 1's `MaxAdvanceStep`)
- `test_frame_always_returns_tick`: the returned command is non-nil in every state, including `StateGameOver`
- `test_color_profile_sets_mode`: `tea.ColorProfileMsg{Profile: colorprofile.TrueColor}` -> `Mode` `ModeFull`; with `Cfg.ASCII` true -> `ModeASCII`
- `test_resize_updates_size`: `tea.WindowSizeMsg{Width: 100, Height: 40}` -> stored
- `test_resize_below_minimum_preserves_game`: score and board are unchanged by a `30×10` resize, `View()` contains `"TOO SMALL"`, and a subsequent `80×30` resize renders the board again with the same score
- `test_resize_sweep_no_panic`: feed 200 random `WindowSizeMsg` sizes in 0..200 × 0..80, rendering `View()` after each -> no panic
- `test_ctrl_c_quits_from_every_state`: playing, paused, and game over each return a command yielding `tea.QuitMsg`
- `test_render_from_view_does_not_mutate_game`: deep-equal the game before and after `View()`

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ -v`
Expected: FAIL — undefined: `DefaultKeyMap`

- [ ] **Step 3: Implement `keys.go` and the full `update.go`**

Map bindings to `game.Input` values and call `m.Game.Apply` once per matched press. Gameplay keys are handled only when `m.State == StatePlaying && !m.ShowHelp`. After any `Apply` or `Advance`, set `m.State = StateGameOver` when `m.Game.Over`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Play it**

Run: `go run ./cmd/cosmic-tetris` — move, rotate, soft drop, hard drop, hold, clear a line, watch the level rise. Hold left and confirm the piece walks across from terminal auto-repeat.

- [ ] **Step 6: Commit**

```bash
git add internal/app
git commit -m "feat(app): key bindings, immediate input dispatch, resize, and gravity clock"
```

---

### Task 9: Pause, help, and restart

**Files:**
- Modify: `internal/app/update.go`, `internal/render/overlay.go`, `internal/render/render.go`
- Test: `internal/app/update_test.go` (append), `internal/render/render_test.go` (append)

**Interfaces:**
- Consumes: `State`, `game.Restart`.
- Produces: `p` toggles `StatePlaying`/`StatePaused`; `?` toggles `ShowHelp`; `r` restarts. Pause freezes gameplay: while `StatePaused`, `FrameMsg` does not call `Advance`.

Pinned copy — pause (§30) and help (§39) exactly as written in the spec, including `TEMPORAL SUSPENSION`, `SPACE IS PAUSED`, `p  resume`, `FLIGHT MANUAL`, `move spacecraft`, `accelerate doom`, `rotate geometry`, `rotate other way`, `YEET`, `quantum storage`, `suspend spacetime`, `reboot universe`, `abandon mission`, `close this nonsense`.

- [ ] **Step 1: Write the failing tests**

- `test_pause_toggles`: `'p'` -> `StatePaused`; again -> `StatePlaying`
- `test_paused_freezes_gravity`: pause, then frames spanning 5 s -> the active piece has not moved and `Score` is unchanged
- `test_paused_ignores_gameplay_keys`: while paused, left/right/rotate/hard drop/hold change nothing
- `test_paused_view_shows_overlay`: `View().Content` contains `"TEMPORAL SUSPENSION"`
- `test_help_toggles`: `'?'` -> `ShowHelp` true; again -> false
- `test_help_ignores_gameplay_keys`: with help open, gameplay keys change nothing, but `'?'` closes it
- `test_help_does_not_pause`: with help open, a frame spanning 900 ms still drops the piece (§20/§44: overlays never block gameplay) — pin this as the intended behavior: the help overlay is non-modal for gravity
- `test_restart_resets_score`: score some points, `'r'` -> `Score` 0, `State` `StatePlaying`, `ShowHelp` false
- `test_restart_from_paused`: `'r'` while paused -> `StatePlaying`
- `test_restart_reuses_fixed_seed`: `Cfg{Seed: 7, SeedFixed: true}`, record the first 5 `Next` kinds, restart -> identical
- `test_restart_draws_new_seed_when_unfixed`: `Cfg{SeedFixed: false}` -> after restart `Game.Seed` differs from before (allow a retry loop against clock granularity)
- `test_golden_pause_regenerated` and `test_golden_help_regenerated`: the Task 7 goldens still match

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/app/ -run TestPause -v`
Expected: FAIL

- [ ] **Step 3: Implement pause, help, and restart**

Restart with `SeedFixed` calls `m.Game.Restart()`; without it, `m.Game = game.New(time.Now().UnixNano())` and `m.Cfg.Seed` is updated so the title's universe ID changes too.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/app internal/render
git commit -m "feat(app): pause, non-modal help overlay, and restart"
```

---

### Task 10: Game over panel

**Files:**
- Modify: `internal/app/update.go`, `internal/render/overlay.go`
- Test: `internal/app/update_test.go` (append), `internal/render/render_test.go` (append)

**Interfaces:**
- Consumes: `game.Over`, `DrawPanel`.
- Produces: `func DrawGameOver(c *Canvas, p Palette, g *Glyphs, gm *game.Game) Rect`.

Pinned copy (§28 final panel), with `SCORE`/`LINES`/`LEVEL` values from the game and thousands separators as shown in the spec (`483,200`):

```text
UNIVERSE EXPIRED

SCORE  483,200
LINES  127
LEVEL  13

r  REBOOT UNIVERSE
q  ACCEPT COSMIC DEATH
```

Subtitle line under the title: `CAUSE: EXCESSIVE GEOMETRY`.

- [ ] **Step 1: Write the failing tests**

- `test_game_over_state_entered`: drive the engine to `Over` through `Update` calls -> `State` `StateGameOver`
- `test_game_over_freezes_gravity`: further frames leave `Score` and the board unchanged
- `test_game_over_ignores_gameplay_keys`: left/rotate/hard drop/hold change nothing
- `test_game_over_accepts_r`: `'r'` -> `StatePlaying`, `Score` 0
- `test_game_over_accepts_q`: `'q'` -> quit command
- `test_game_over_panel_copy`: the render contains `"UNIVERSE EXPIRED"`, `"CAUSE: EXCESSIVE GEOMETRY"`, `"REBOOT UNIVERSE"`, `"ACCEPT COSMIC DEATH"`
- `test_game_over_shows_stats`: with score 483200, lines 127, level 13 -> contains `"483,200"`, `"127"`, `"13"`
- `test_thousands_separator`: score 1000 -> `"1,000"`; score 0 -> `"0"`; score 1234567 -> `"1,234,567"`
- `test_game_over_panel_fits_small_terminal`: at 40×24 the panel is fully inside the window and the frame's line widths are unchanged

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./... -run TestGameOver -v`
Expected: FAIL

- [ ] **Step 3: Implement the panel and the state transition**

Write the thousands separator as a small helper in `overlay.go`; do not add a dependency for it.

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/app internal/render
git commit -m "feat(render): game over panel with final stats"
```

---

### Task 11: CLI flags and README

**Files:**
- Modify: `cmd/cosmic-tetris/main.go`
- Create: `README.md`, `LICENSE`
- Test: `cmd/cosmic-tetris/main_test.go`

**Interfaces:**
- Consumes: `app.Config`.
- Produces:
  ```go
  func parseFlags(args []string, stderr io.Writer) (app.Config, bool, error) // (cfg, showHelp, err)
  const usage = `...`
  ```
  Flags in this plan: `--seed`, `--ascii`, `--help`. `--no-fx` and `--reduced-motion` are added by Plan 3 Task 16; `usage` and `Config` already have the fields, so that task only wires them.

- [ ] **Step 1: Write the failing tests in `cmd/cosmic-tetris/main_test.go`**

- `test_no_flags_random_seed`: `parseFlags(nil, io.Discard)` -> `SeedFixed` false, `Seed` non-zero
- `test_seed_flag`: `["--seed","1234"]` -> `Seed` 1234, `SeedFixed` true
- `test_seed_flag_equals_form`: `["--seed=1234"]` -> same
- `test_seed_flag_invalid`: `["--seed","banana"]` -> error, non-nil
- `test_ascii_flag`: `["--ascii"]` -> `ASCII` true
- `test_help_flag`: `["--help"]` -> `showHelp` true
- `test_unknown_flag_errors`: `["--warp-drive"]` -> error
- `test_usage_lists_every_flag`: `usage` contains `--seed`, `--ascii`, `--no-fx`, `--reduced-motion`, `--help` (§49.5's final CLI surface)

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./cmd/... -v`
Expected: FAIL — undefined: `parseFlags`

- [ ] **Step 3: Implement flag parsing with the standard `flag` package**

Use a `flag.NewFlagSet` with `flag.ContinueOnError` and its output set to the passed writer so tests stay quiet. On `--help`, print `usage` to stdout and exit 0.

- [ ] **Step 4: Write `README.md` and `LICENSE`**

README: one-paragraph description, `go run ./cmd/cosmic-tetris`, the §8 control table, the §49.5 flag list, and a note that `internal/game` is deterministic and clock-free. LICENSE: MIT with the current year.

- [ ] **Step 5: Verify the whole thing**

Run: `go test ./... -race && go vet ./... && gofmt -l . && go run ./cmd/cosmic-tetris --seed 8675309`
Expected: tests pass, vet and gofmt silent, and two runs with the same seed deal the same opening pieces.

- [ ] **Step 6: Commit**

```bash
git add cmd README.md LICENSE
git commit -m "feat(cli): --seed, --ascii, --help, plus README and license"
```

---

## Done when

- `go test ./... -race` passes; `go vet ./...` and `gofmt -l .` are silent.
- The game is playable start through game over with immediate controls, working hold, ghost, next queue, pause, restart, and help.
- Resizing between 20×10 and 300×100 never panics and the too-small notice appears below 40×24.
- `--ascii` produces a readable board with no non-ASCII runes except §49.4's pinned ghost glyph.
- Goldens exist for wide, medium, small, ASCII, too-small, pause, help, and game over.
- Plan 3 can begin: `render.Scene` and `render.BoardCellOrigin` are the seams it extends.
