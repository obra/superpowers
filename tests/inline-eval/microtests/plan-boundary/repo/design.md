# COSMIC TETRIS

## Terminal Gravity Incident

**Build spec · v1**

> A falling-block puzzle game occurring during a completely unnecessary cosmological emergency.

---

# 1. Product

Build a fast, polished, extremely cosmic falling-block game entirely inside the terminal.

The fundamental game should be immediately recognizable:

* falling tetrominoes
* rotate / move / drop
* completed rows disappear
* increasing gravity
* hold
* next-piece queue
* ghost piece
* score / level / lines
* game over when the stack reaches orbit

But the presentation should be **wildly more dramatic than the underlying mechanics justify**.

Think:

**Tetris × NASA mission control × demoscene × 1980s planetarium × rogue AI × terminal nerd shit.**

The experience should make somebody say:

> "Why the fuck does terminal Tetris have particle physics?"

That is success.

---

# 2. Design principles

In priority order:

1. **Feels excellent to play**
2. **Looks unbelievable for a TUI**
3. **Simple architecture**
4. **Deterministic game engine**
5. **Effects never contaminate gameplay logic**
6. **Funny without becoming annoying**
7. **Still works in a mediocre terminal**
8. **Easy for an agent to understand and modify**

Do not turn this into an engine project.

Do not build networking.

Do not build profiles.

Do not build achievements.

Do not build a plugin system.

Do not build a database.

Build an outrageously good terminal game.

---

# 3. Technology

Language:

```text
Go
```

UI:

```text
Bubble Tea v2
Lip Gloss v2
Bubbles v2
```

Use:

```text
charm.land/bubbletea/v2
charm.land/lipgloss/v2
charm.land/bubbles/v2
```

Use Bubble Tea as the application/event loop.

Use Lip Gloss aggressively for:

* colors
* borders
* gradients
* layout
* text styling
* adaptive rendering

Use Bubbles only where it actually helps:

* key bindings
* help
* boot spinner

Do **not** abstract Bubble Tea away behind some homegrown framework.

---

# 4. The visual target

The terminal should feel alive even when the player isn't doing anything.

Example wide layout:

```text
╭─ ✦ COSMIC TETRIS ───────────── LOCAL UNIVERSE 7F3A ─────────────╮
│                                                                  │
│  HOLD                 ✦ VELOCITY: 03            NEXT            │
│                                                                  │
│   ██                    ╔════════════════════╗     ████           │
│   ████                  ║  ·       ˚    ✧   ║       ████         │
│                         ║        ██          ║                    │
│  SCORE                  ║      ██████        ║     ██████         │
│  00129340                ║      ██            ║       ██           │
│                         ║                    ║                    │
│  LINES                  ║          ░░        ║      ████          │
│  042                    ║        ░░░░        ║    ████            │
│                         ║      ████████      ║                    │
│  LEVEL                  ║    ████████████    ║      ██            │
│  07                     ║  ████████████████  ║    ██████          │
│                         ╚════════════════════╝                    │
│                                                                  │
│  ☄ MISSION CONTROL: GRAVITY TAX INCREASED                       │
│                                                                  │
│  ←→ move   ↑ rotate   ↓ descend   SPACE YEET   C hold   ? help   │
╰──────────────────────────────────────────────────────────────────╯
```

The board is the visual center.

Everything else supports it.

---

# 5. Board representation

Logical board:

```text
width:  10
height: 22
visible rows: 20
hidden spawn rows: 2
```

Each logical block should normally occupy:

```text
2 terminal columns × 1 terminal row
```

Example:

```text
██
```

This makes cells appear approximately square.

Fallback ASCII:

```text
[]
```

Ghost cells:

```text
░░
```

or:

```text
··
```

Never use visual effects as collision data.

---

# 6. Pieces

Implement seven standard tetromino families:

```text
I J L O S T Z
```

Each piece has:

```go
type Piece struct {
    Kind     PieceKind
    Rotation int
    X        int
    Y        int
}
```

Use four predefined rotations per piece.

`O` may remain visually identical through rotation.

Piece generation uses a **7-bag**:

1. put one of every piece into a bag
2. shuffle it
3. consume the bag
4. refill when empty

Maintain enough future pieces to render the next **five**.

---

# 7. Rotation

Use a simple predictable wall-kick implementation rather than reproducing a huge rotation ruleset.

When rotating, test offsets in this order:

```text
( 0, 0)
(-1, 0)
( 1, 0)
(-2, 0)
( 2, 0)
( 0,-1)
(-1,-1)
( 1,-1)
```

Accept the first valid position.

If none are valid:

```text
rotation fails
```

This gives forgiving terminal gameplay without making rotation a subsystem.

---

# 8. Controls

Primary:

```text
← / h       left
→ / l       right
↓ / j       soft drop
↑ / k / x   clockwise rotate
z           counter-clockwise rotate
space       hard drop
c           hold
p           pause
r           restart
?           toggle help
q / esc     quit
```

Optional WASD aliases:

```text
a left
d right
s down
w rotate
```

Holding left/right should support repeated movement.

Input should feel responsive independently from the animation tick.

---

# 9. Hold

One held piece.

Rules:

* `c` swaps active piece with hold
* if hold is empty, store active piece and spawn next
* hold can only happen once before the active piece locks
* newly spawned held pieces return to spawn rotation

Visual effect:

### QUANTUM STORAGE

The outgoing piece should appear to get:

```text
compressed → streaked sideways → disappear
```

while the incoming piece briefly flashes into existence.

Duration:

```text
~120ms
```

Gameplay does not wait for the animation.

---

# 10. Ghost piece

> Glyph pinned in §49.4: `░░` in full/reduced mode, `··` in ASCII.

Compute landing position of the active piece.

Render it underneath the active piece using dim/transparent-looking cells.

Example:

```text
░░░░
  ░░░░
```

Ghost rendering must never obscure locked blocks.

---

# 11. Gravity

Gravity operates independently of render FPS.

Suggested drop interval:

```text
level 1: ~800ms
```

Then:

```text
interval = 800ms * 0.86^(level-1)
```

Clamp approximately around:

```text
60ms
```

Increase level every:

```text
10 cleared lines
```

Soft drop:

```text
+1 point / cell
```

Hard drop:

```text
+2 points / cell
```

---

# 12. Locking

When the piece can no longer descend:

```text
lock delay = 500ms
```

A successful movement or rotation while grounded resets the lock timer.

Prevent infinite stalling:

```text
max lock resets = 15
```

After locking:

1. commit piece
2. detect complete rows
3. clear rows
4. update score
5. trigger FX event
6. spawn next piece

---

# 13. Scoring

> Combo indexing and the exact bonus formula are pinned in §49.1.

Base clear values:

```text
1 line     100 × level
2 lines    300 × level
3 lines    500 × level
4 lines    800 × level
```

Combo:

```text
consecutive clearing placements increase combo
empty placement resets combo
```

Bonus:

```text
50 × combo × level
```

The HUD should value readability over explaining the scoring system.

---

# 14. Cosmic effects system

This is the important part.

Effects are their own independent simulation:

```text
GameState
    ↓ emits events
FXWorld
    ↓ simulates spectacle
Renderer
```

The FX system may observe game events.

It may **never modify GameState**.

Example events:

```go
PieceMoved
PieceRotated
PieceHardDropped
PieceLocked
HoldUsed
LinesCleared
ComboChanged
LevelChanged
GameOver
```

---

# 15. Starfield

There should always be space behind/around the game.

Particles:

```text
.  ·  ˚  ✦  ✧  *
```

Maintain approximately three depth layers.

### Far stars

```text
very slow
dim
mostly .
```

### Mid stars

```text
medium movement
· ˚
```

### Near stars

```text
fast
bright
✦ ✧
```

Stars drift downward slowly under normal conditions.

As gravity/level increases:

```text
star velocity subtly increases
```

Never make the background so busy that the board becomes harder to read.

---

# 16. Hyperdrive

Certain events temporarily accelerate the starfield.

Triggers:

```text
four-line clear
large combo
new high score
```

Sequence:

```text
0ms      stars pause
50ms     stars stretch
100ms    stars accelerate violently
500ms    peak speed
800ms    decay
1100ms   normal
```

It should look like the terminal entered hyperspace for absolutely no reason.

---

# 17. Piece trails

Moving pieces leave extremely short-lived ion trails.

Example:

```text
██        active
▓▓        1 frame ago
▒▒        2 frames ago
░░        3 frames ago
```

Trail lifetime:

```text
~100–160ms
```

Hard drops produce a stronger vertical trail.

Trails are FX only.

---

# 18. Hard-drop impact

Hard drop needs to feel **ridiculous**.

Upon impact:

### 1. Vertical ion trail

Draw fading traces through the cells the piece crossed.

### 2. Impact particles

Emit debris from the contact area:

```text
·
*
✦
+
```

### 3. Screen shake

For approximately:

```text
80ms
```

shift the rendered board by one terminal cell using a deterministic shake pattern.

Example:

```text
0,+1
-1,0
+1,0
0,-1
0,0
```

Do not make the entire terminal unreadable.

### 4. Border flash

Board border briefly becomes extremely bright.

Hard drop should feel like dropping a refrigerator from orbit.

---

# 19. Line-clear animation

Do **not** instantly remove completed lines visually.

Gameplay state may already know the result, but rendering gets a short animation.

Total:

```text
~220ms
```

Sequence:

### Phase A — critical mass

```text
████████████████████
```

becomes:

```text
▓▓▓▓▓████████▓▓▓▓▓▓
```

### Phase B — supernova

Explosion moves from center outward:

```text
░░░▓▓██✦✦██▓▓░░░
```

### Phase C — collapse

The line fragments into debris:

```text
   ·  *   ✦    ·
```

Then rows collapse.

Particles should inherit some horizontal velocity from their location relative to center.

---

# 20. Four-line clear

A four-line clear is a **major astronomical event**.

Trigger simultaneously:

* hyperdrive
* larger screen shake
* border gradient pulse
* particle eruption
* HUD flash
* temporary star density increase
* giant banner

Banner examples:

```text
✦ EVENT HORIZON ✦
```

```text
QUADRUPLE COSMIC INCIDENT
```

```text
FOUR ROWS HAVE LEFT THE CHAT
```

```text
SPACE-TIME HAS FILED A COMPLAINT
```

Banner appears for roughly:

```text
700ms
```

It must not block gameplay input.

---

# 21. Combos

Combos progressively destabilize the universe.

### combo 2

small sparks

### combo 3

meteor particles

### combo 4

HUD begins pulsing

### combo 5+

the game starts behaving like Mission Control has lost control of the mission

Examples:

```text
COMBO 5 // UNAUTHORIZED ORBITAL MANEUVER
```

```text
COMBO 6 // STRUCTURAL REALITY FAILURE
```

```text
COMBO 7 // NASA DENIES EVERYTHING
```

Effects intensify.

Board readability remains sacred.

---

# 22. Level-up event

When gravity increases:

```text
╭──────────────────────────────╮
│  GRAVITY ANOMALY DETECTED   │
│          LEVEL 08            │
╰──────────────────────────────╯
```

Possible subtitles:

```text
GRAVITY TAX INCREASED
```

```text
LOCAL PHYSICS UPDATED WITHOUT CONSENT
```

```text
PLEASE SECURE ALL LOOSE TETROMINOES
```

The notification slides/fades away without pausing the game.

---

# 23. Particle physics

Use a tiny terminal-space physics simulation.

```go
type Particle struct {
    X, Y       float64
    VX, VY     float64
    Life       float64
    MaxLife    float64
    Glyph      rune
    Brightness float64
}
```

Per animation step:

```text
position += velocity × dt
velocity += acceleration × dt
velocity *= drag
life -= dt
```

Typical forces:

```text
gravity
drag
radial explosion force
random angular variation
```

Convert floating positions to terminal cells during render.

This simulation does not need collision detection.

Particles die when:

```text
life <= 0
```

or outside the viewport.

---

# 24. Shockwaves

Large events create a radial shockwave.

Because this is a terminal, fake the geometry.

Represent expanding rings using glyph groups:

```text
·
○
◌
◯
```

or partial particles arranged around an approximate ellipse.

Shockwaves last:

```text
~300ms
```

Use sparingly.

---

# 25. Board border

The board itself should feel like a piece of sci-fi machinery.

Normal:

```text
╔════════════════════╗
║                    ║
╚════════════════════╝
```

Color should slowly shift over time.

Possible palette:

```text
deep violet
electric cyan
magenta
stellar blue
hot white
```

The shift should be subtle.

During major events:

```text
gradient moves rapidly around border
```

The border is effectively the game's "energy state indicator."

---

# 26. Piece colors

> Pinned in §49.4: filled block glyphs with a bright foreground, not the fg+bg alternative.

Pieces should have distinct identities without looking like a rainbow toy.

Use a coherent **neon space palette**.

Example intent:

```text
I  plasma cyan
J  deep electric blue
L  solar orange
O  stellar gold
S  alien green
T  ultraviolet
Z  supernova pink/red
```

Each cell can have:

```text
bright foreground
dark related background
```

or use filled block glyphs.

Locked pieces should remain visually rich while the active piece is slightly brighter.

---

# 27. Mission Control

Bottom of screen contains a one-line status channel.

Example:

```text
☄ MISSION CONTROL: NOMINALISH
```

Messages are triggered by events.

Examples:

```text
GRAVITY REMAINS MOSTLY LEGAL
```

```text
TETROMINO INJECTION SUCCESSFUL
```

```text
STRUCTURAL VIBES: QUESTIONABLE
```

```text
LOCAL UNIVERSE STABLE*
```

```text
* DEFINITION OF STABLE UNDER REVIEW
```

```text
MOON NOTIFIED
```

```text
ORBITAL OSHA HAS ENTERED THE CHAT
```

```text
WE HAVE EXCEEDED THE RECOMMENDED NUMBER OF BLOCKS
```

```text
PHYSICS TEAM SAYS KEEP GOING
```

Do not rotate messages constantly.

Trigger them contextually and give them time to breathe.

---

# 28. Game over

Game over should be theatrical.

Do not instantly replace the board.

Sequence:

### 0–300ms

Everything freezes.

```text
SIGNAL LOST
```

### 300–900ms

Blocks start falling inward toward the center.

### 900–1300ms

Board collapses into a simulated black hole:

```text
          ·
        ˚
       \ | /
     --- ● ---
       / | \
         *
```

### final

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

Possible subtitle:

```text
CAUSE: EXCESSIVE GEOMETRY
```

---

# 29. Boot screen

Start with approximately one second of excessive drama.

```text
           ✦

     C O S M I C

       T E T R I S

  INITIALIZING LOCAL UNIVERSE...

      gravity ........ OK
      spacetime ...... OK
      tetrominoes .... QUESTIONABLE
```

Then:

```text
UNIVERSE ONLINE
```

and immediately start.

Any key skips the boot sequence.

No menu is required.

---

# 30. Pause

Pause should freeze:

* gameplay
* gameplay-related particles

Background stars may continue drifting very slowly.

Overlay:

```text
╭────────────────────────────╮
│     TEMPORAL SUSPENSION    │
│                            │
│       SPACE IS PAUSED      │
│                            │
│       p  resume            │
╰────────────────────────────╯
```

---

# 31. Adaptive terminal layout

> The drop order at the 40×24 minimum is pinned in §49.3.

### Large terminal

```text
HOLD | BOARD | NEXT
stats beside board
mission control below
```

### Medium terminal

```text
BOARD | compact HUD
mission control below
```

### Small terminal

Prioritize:

1. board
2. next
3. score
4. controls

Effects automatically reduce outside the board.

Minimum usable target:

```text
~40 columns
~24 rows
```

Below minimum:

```text
THIS UNIVERSE IS TOO SMALL

resize terminal to continue

current: 34 × 19
needed: approximately 40 × 24
```

Handle resize events live.

Never crash from terminal resizing.

---

# 32. Rendering modes

Detect capabilities where practical.

### Full

```text
Unicode
truecolor
particles
gradients
all effects
```

### Reduced

```text
Unicode
256 color
simplified gradients
```

### ASCII

```text
ASCII glyphs
limited colors
no special Unicode assumptions
```

Command:

```bash
cosmic-tetris --ascii
```

Also support:

```bash
cosmic-tetris --no-fx
```

The boring mode should still be a good game.

---

# 33. Architecture

Keep the repository obvious.

```text
cosmic-tetris/
├── cmd/
│   └── cosmic-tetris/
│       └── main.go
│
├── internal/
│   ├── game/
│   │   ├── game.go
│   │   ├── board.go
│   │   ├── piece.go
│   │   ├── bag.go
│   │   ├── scoring.go
│   │   └── rules.go
│   │
│   ├── app/
│   │   ├── model.go
│   │   ├── update.go
│   │   ├── messages.go
│   │   └── keys.go
│   │
│   ├── render/
│   │   ├── render.go
│   │   ├── board.go
│   │   ├── layout.go
│   │   ├── hud.go
│   │   └── palette.go
│   │
│   ├── fx/
│   │   ├── world.go
│   │   ├── particle.go
│   │   ├── starfield.go
│   │   └── events.go
│   │
│   └── flavor/
│       └── messages.go
│
├── go.mod
├── README.md
└── LICENSE
```

Do not create more architecture than this unless genuinely necessary.

---

# 34. Core state

> RNG ownership is pinned in §49.6: `Game` holds its own `*rand.Rand`; `Seed` is for display and restart.

Conceptually:

```go
type Model struct {
    Game   game.Game
    FX     fx.World

    Width  int
    Height int

    State AppState

    LastFrame time.Time
    Keys      KeyMap
}
```

Game:

```go
type Game struct {
    Board   Board
    Active  Piece
    Hold    *PieceKind
    CanHold bool

    Next []PieceKind
    Bag  Bag

    Score int
    Lines int
    Level int
    Combo int

    GravityAccumulator time.Duration
    LockAccumulator    time.Duration

    Seed int64
}
```

---

# 35. Determinism

> Pinned in §49.2: the engine advances via `Advance(dt)` and never calls `time.Now()`.

Game logic must be deterministic.

Provide:

```bash
cosmic-tetris --seed 8675309
```

Given:

```text
same seed
same player input sequence
same timing inputs
```

the logical game state should be reproducible.

FX randomness uses a **different RNG**.

This keeps particle randomness from affecting piece order.

Very important.

---

# 36. Bubble Tea event model

Use messages such as:

```go
type FrameMsg struct {
    Now time.Time
}

type GravityMsg struct {
    Now time.Time
}

type GameEventMsg struct {
    Event game.Event
}
```

Prefer one animation clock and accumulated elapsed time rather than spawning multiple timing loops.

Target visual updates around:

```text
60 Hz
```

Gameplay gravity remains elapsed-time based.

Input should not wait for ticks.

---

# 37. Render pipeline

Each frame:

```text
1. compute responsive layout

2. render background starfield

3. render locked board

4. render ghost piece

5. render active piece

6. composite board-local FX

7. render board border

8. render HOLD / NEXT / stats

9. composite global FX

10. render banners

11. render mission-control line

12. render controls/help
```

The rendering process must not mutate game state.

---

# 38. Performance rules

Do not:

```text
spawn a goroutine per particle
spawn a goroutine per frame
reconstruct huge objects unnecessarily
perform filesystem operations during gameplay
log synchronously every frame
```

A few hundred particles should be trivial.

Use reusable slices where useful.

Avoid premature optimization.

The terminal is the bottleneck, not particle arithmetic.

---

# 39. Help

`?` displays an overlay.

Use the Bubbles key/help primitives.

Example:

```text
╭─ FLIGHT MANUAL ─────────────────────╮
│                                     │
│ ← → / h l       move spacecraft     │
│ ↓ / j           accelerate doom     │
│ ↑ / k / x       rotate geometry     │
│ z               rotate other way    │
│ SPACE           YEET                │
│ c               quantum storage     │
│ p               suspend spacetime   │
│ r               reboot universe     │
│ q               abandon mission     │
│                                     │
│ ?               close this nonsense │
╰─────────────────────────────────────╯
```

---

# 40. Tests

Game logic receives the serious testing.

At minimum test:

### Board

* collision
* bounds
* row completion
* row removal
* collapse

### Pieces

* every rotation
* wall kicks
* failed rotation
* spawn position

### Bag

* every bag contains all seven piece types exactly once
* seeded generation is reproducible

### Hold

* initial hold
* swap
* second hold blocked
* hold restored after lock

### Drop

* soft drop
* hard drop
* landing position
* lock

### Score

* line values
* combo behavior
* drop scoring
* level progression

### Game over

* blocked spawn
* correct state transition

### Determinism

Replay a canned input stream and assert final game state.

Effects need only lightweight behavioral tests.

Do not attempt to pixel-test particle positions across the entire animation.

---

# 41. Renderer tests

Have several golden/snapshot tests for ANSI-stripped output:

```text
wide layout
medium layout
small layout
pause
game over
help
ASCII mode
```

Main goals:

```text
nothing overlaps
board dimensions stay correct
resize doesn't panic
HUD doesn't corrupt board
```

---

# 42. Build order

## Phase 1 — game engine

Build headless:

```text
pieces
board
bag
movement
rotation
gravity
locking
line clearing
hold
scoring
game over
```

Tests must pass before proceeding.

## Phase 2 — playable terminal

Add:

```text
Bubble Tea
keyboard
board rendering
HUD
next queue
hold
ghost
resize
```

At this point it should already be a genuinely good game.

## Phase 3 — cosmic foundation

Add:

```text
palette
starfield
animated border
piece trails
mission control
```

## Phase 4 — violence

Add:

```text
hard-drop impact
particles
line supernova
screen shake
shockwaves
hyperdrive
four-line sequence
```

## Phase 5 — absurd polish

Add:

```text
boot sequence
game-over black hole
responsive FX
help
ASCII fallback
flavor tuning
```

---

# 43. Coolness acceptance test

A build is **not complete** merely because gameplay works.

Within the first 30 seconds of normal play, the player should probably see:

```text
moving starfield
animated board border
piece trails
hard-drop impact
particles
mission-control commentary
```

Within the first completed line:

```text
supernova clear animation
debris
border reaction
```

A four-line clear must produce an immediate:

```text
LOL WHAT THE FUCK
```

reaction.

That is an actual product requirement.

---

# 44. Restraint rules

Effects must obey these constraints.

### Never obscure the active piece.

### Never make controls lag.

### Never delay gameplay for animation.

### Never require reading flavor text.

### Never use random effects that alter gameplay.

### Never make screen shake exceed roughly one cell.

### Never allow particles to permanently alter the rendered board.

### Never let comedy overwhelm playability.

The game is cosmic.

The controls are serious.

---

# 45. Optional tiny details

These are cheap and encouraged.

Idle board occasionally gets a tiny shooting star:

```text
          ·
       ·
    ✦
```

Extremely rare status line:

```text
MISSION CONTROL: DID YOU KNOW YOU'RE IN A TERMINAL?
```

Score rollover gets:

```text
NUMBER BECAME BIGGER
```

Hard dropping an `I` piece vertically:

```text
KINETIC ROD DEPLOYED
```

Holding an `O`:

```text
CUBE ADJACENT OBJECT SECURED
```

Long idle before first move:

```text
MISSION CONTROL: CAPTAIN?
```

But these should remain occasional.

---

# 46. CLI

> Pinned in §49.5: `--reduced-motion` ships.

Keep it tiny.

```text
cosmic-tetris
cosmic-tetris --seed 1234
cosmic-tetris --ascii
cosmic-tetris --no-fx
cosmic-tetris --help
```

Possible:

```text
--reduced-motion
```

Nothing else is necessary.

---

# 47. Definition of done

The project is done when:

* the complete game is playable from start through game over
* controls feel immediate
* resizing works
* hold works
* ghost works
* next queue works
* piece generation is deterministic
* game RNG and FX RNG are isolated
* line clearing is correct
* gravity increases
* pause works
* restart works
* ASCII fallback works
* no-FX mode works
* game logic has comprehensive unit tests
* renderer has representative snapshot tests
* terminal output does not visibly flicker under normal conditions
* animations never block input
* effects never modify game state
* four-line clears are gloriously excessive
* game-over collapses the universe into a black hole
* the game is fun even with effects disabled
* the game is **much funnier with effects enabled**

---

# 48. The standard

Do not make:

> Tetris implemented with Bubble Tea.

Make:

> **a tiny terminal arcade game that happens to use falling tetrominoes, while the universe increasingly loses its shit around the player.**

The codebase should be small enough to understand in an afternoon.

The game should look like it had a completely irresponsible special-effects budget.

**That is Cosmic Tetris.**


---

# 49. Pinned decisions

Sections 1–48 left a handful of choices open — coin-flips and "possible:"
options rather than design questions. They are resolved here so implementation
and tests agree. Where this section and an earlier one differ, this section
wins.

## 49.1 Combo indexing and bonus (resolves §13)

Combo counts consecutive placements that clear at least one line. The first
clearing placement sets combo to 1. A placement that clears nothing resets
combo to 0.

Combo bonus:

```text
bonus = 50 × (combo - 1) × level
```

A lone clear therefore earns no combo bonus, and the bonus first appears at
combo 2 — which is exactly where §21 starts escalating the effects.

## 49.2 The engine never reads a clock (resolves §35)

`internal/game` exposes:

```go
func (g *Game) Advance(dt time.Duration) []Event
```

Nothing under `internal/game` calls `time.Now()`. Bubble Tea owns the clock and
passes elapsed time inward.

This is what makes §35's promise testable. "Same seed + same input sequence +
same timing inputs reproduces the state" is only checkable if timing is an
input, and `dt` is how it becomes one. §40's replay test feeds a canned
`(input, dt)` stream and asserts the final state.

## 49.3 Small-terminal drop order (resolves §31)

The full chrome does not fit the 40×24 minimum: 20 visible board rows + 2
border rows + title + mission control + controls needs 25+ rows. Elements are
dropped in this order as height runs out:

```text
1. title border      (first to go)
2. mission control
3. stats labels      (values stay, labels go: "042" not "LINES 042")
```

NEXT never stacks above or below the board — at small sizes it moves beside the
board and truncates to 3 upcoming pieces. Board and controls are the last two
things standing. Below 40×24, show the too-small notice from §31.

## 49.4 Glyph choices (resolves §10, §26)

```text
ghost, full/reduced mode:   ░░
ghost, ASCII mode:          ··
pieces, all modes:          filled block glyphs (██ / [] in ASCII)
```

Pieces use filled glyphs with a bright foreground, not the foreground+background
pairing §26 offers as an alternative. Active piece renders one step brighter
than locked cells.

## 49.5 `--reduced-motion` ships (resolves §46)

It is in, not "possible". It costs roughly ten lines given the effect-intensity
scaling §44 already requires, and it is the flag that keeps this playable for
anyone who gets motion sick. It suppresses screen shake, hyperdrive
acceleration, and shockwaves while leaving color, trails, and particles alone.

Final CLI surface:

```text
cosmic-tetris
cosmic-tetris --seed 1234
cosmic-tetris --ascii
cosmic-tetris --no-fx
cosmic-tetris --reduced-motion
cosmic-tetris --help
```

## 49.6 RNG ownership (resolves §34)

`Seed int64` alone cannot carry RNG state across a replay, so `Game` owns its
generator:

```go
type Game struct {
    // ...
    Seed int64       // recorded for display and restart
    rng  *rand.Rand  // game RNG: drives the 7-bag, nothing else
}
```

`fx.World` holds a second, independent `*rand.Rand`. The two never share.
Crossing them makes piece order depend on particle counts, which breaks §35.

## 49.7 The §4 mockup is intent, not geometry

The wide-layout mockup in §4 does not align — its right border is ragged and its
`║` columns drift. It communicates mood and element placement. The
ANSI-stripped golden tests in §41 are the binding layout contract.
