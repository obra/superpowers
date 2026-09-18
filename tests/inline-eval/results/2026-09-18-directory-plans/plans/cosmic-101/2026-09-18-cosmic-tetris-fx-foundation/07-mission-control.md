### Task 7: Mission Control channel

**Files:**
- Create: `internal/flavor/messages.go`
- Modify: `internal/app/model.go`, `internal/app/update.go` (own a `flavor.Channel`, fill `Scene.Mission`)
- Test: `internal/flavor/messages_test.go`
- Test: `internal/app/mission_test.go`

**Interfaces:**
- Consumes: `game.Event`, `game.EventKind`, `game.PieceKind` (plan 1).
- Produces:
```go
package flavor

const (
    MinHold  = 1800 * time.Millisecond  // a message gets this long to breathe (§27)
    MaxHold  = 6 * time.Second          // then it fades to the idle line
    IdleWait = 12 * time.Second         // long idle before the first move (§45)
)

type Channel struct { rng *rand.Rand /* current, priority, shown, sinceInput */ }
func NewChannel(rng *rand.Rand) *Channel
func (c *Channel) Observe(evs []game.Event, score int)
func (c *Channel) Step(dt time.Duration)
func (c *Channel) Line() string   // "" when there is nothing to say
```

Priority, highest first. A new message replaces the current one only when its priority is higher, or when the current one has been shown for at least `MinHold`:

```text
5  GameOver
4  LevelChanged, LinesCleared with 4 rows
3  ComboChanged with Value >= 2
2  LinesCleared with 1–3 rows
1  HoldUsed, PieceHardDropped
0  idle / ambient
```

Message pools, verbatim from the spec. Ambient (§27):

```text
NOMINALISH
GRAVITY REMAINS MOSTLY LEGAL
STRUCTURAL VIBES: QUESTIONABLE
LOCAL UNIVERSE STABLE*
* DEFINITION OF STABLE UNDER REVIEW
PHYSICS TEAM SAYS KEEP GOING
WE HAVE EXCEEDED THE RECOMMENDED NUMBER OF BLOCKS
ORBITAL OSHA HAS ENTERED THE CHAT
MOON NOTIFIED
```

Lock: `TETROMINO INJECTION SUCCESSFUL`. Combo (§21), `Value` substituted: `COMBO %d // UNAUTHORIZED ORBITAL MANEUVER`, `COMBO %d // STRUCTURAL REALITY FAILURE`, `COMBO %d // NASA DENIES EVERYTHING`. Level-up (§22): `GRAVITY TAX INCREASED`, `LOCAL PHYSICS UPDATED WITHOUT CONSENT`, `PLEASE SECURE ALL LOOSE TETROMINOES`.

Conditional one-offs (§45), each checked against the events and score it is handed:

```text
hard drop of a vertical I piece      KINETIC ROD DEPLOYED
HoldUsed with an O piece             CUBE ADJACENT OBJECT SECURED
score crosses a power of ten         NUMBER BECAME BIGGER
no input for IdleWait                CAPTAIN?
1-in-200 roll on any ambient pick    DID YOU KNOW YOU'RE IN A TERMINAL?
```

The channel never rotates messages on a timer alone (§27): ambient lines are picked when the current message expires at `MaxHold`, and the pool is shuffled so the same line does not repeat twice running.

App wiring: `Model` gains `Flavor *flavor.Channel`, built with `rand.New(rand.NewSource(cfg.Seed+2))` (§49.6's third stream), fed the same event slices FX gets and stepped with the frame `dt`. Each frame sets the existing `Model.Mission string` field from `m.Flavor.Line()`, so `Scene()` is unchanged from plan 2.

- [ ] **Step 1: Write the failing test**

`internal/flavor/messages_test.go`:

```go
func TestLockProducesMessage(t *testing.T)
// Observe([]game.Event{{Kind: game.PieceLocked}}, 0)
// Line() == "TETROMINO INJECTION SUCCESSFUL"

func TestComboMessageIncludesCount(t *testing.T)
// Observe ComboChanged{Value: 5}: Line() starts with "COMBO 5 // "

func TestHigherPriorityInterruptsImmediately(t *testing.T)
// Observe PieceLocked, then Observe LevelChanged{Value: 8} with no Step in between
// Line() is a level-up message, not the lock message

func TestLowerPriorityWaitsForMinHold(t *testing.T)
// Observe LevelChanged, then Observe PieceLocked: Line() is still the level-up message
// Step(MinHold), Observe PieceLocked again: Line() is now the lock message

func TestBurstOfEventsShowsOneLine(t *testing.T)   // Review Focus
// Observe a 20-event slice (4-row LinesCleared, ComboChanged 6, LevelChanged, 17 PieceMoved)
// Line() is a single non-empty string, and it stays byte-identical across
//   Step(16ms) × 100 (under MinHold) — no flicker

func TestAmbientAfterMaxHold(t *testing.T)
// Observe PieceLocked; Step(MaxHold + time.Second)
// Line() is one of the ambient pool strings

func TestAmbientDoesNotRepeatConsecutively(t *testing.T)
// force 20 ambient rotations: no two consecutive lines are equal

func TestIdleCaptainMessage(t *testing.T)
// fresh channel, no events, Step(IdleWait + time.Second): Line() == "CAPTAIN?"
// after any event, the idle timer resets and CAPTAIN? does not reappear

func TestKineticRodOnVerticalI(t *testing.T)
// Observe PieceHardDropped with Piece{Kind: game.KindI, Rotation: 1}
// Line() == "KINETIC ROD DEPLOYED"
// the same event with Rotation 0 does not produce it

func TestCubeAdjacentOnHoldingO(t *testing.T)
// Observe HoldUsed with Piece{Kind: game.KindO}: Line() == "CUBE ADJACENT OBJECT SECURED"

func TestNumberBecameBigger(t *testing.T)
// Observe(LinesCleared, score 9800) then Observe(LinesCleared, score 10200)
// Line() == "NUMBER BECAME BIGGER"

func TestSeededChannelIsReproducible(t *testing.T)
// two channels from the same seed and the same event/Step script produce identical lines
```

`internal/app/mission_test.go`:

```go
func TestSceneCarriesMissionLine(t *testing.T)
// m := New(Config{Seed: 1, FX: true}); m.handleKey("space")
// m.Scene().Mission is non-empty, and View() contains "MISSION CONTROL"

func TestMissionRNGIsSeparate(t *testing.T)
// two models, same seed, identical input scripts: identical mission lines
// and identical piece order (the three RNG streams stay independent)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/flavor/ -v`
Expected: FAIL — package does not exist.

- [ ] **Step 3: Implement `internal/flavor/messages.go` and the app wiring**

Keep the pools as package-level `[]string` and the conditional checks as a small ordered list of predicates over the event slice, so adding a joke later is one line.

- [ ] **Step 4: Run the tests**

Run: `go test ./... && go vet ./...`
Expected: PASS, clean.

- [ ] **Step 5: Confirm the Phase 3 result against the spec**

Run: `go run ./cmd/cosmic-tetris --seed 1234` and play 30 seconds. Per §43 you should see, without trying: a moving starfield, an animated board border, piece trails, and Mission Control commentary. Effects are visible but the board is never harder to read. If any of the four is missing or the board is noisy, fix it before moving to plan 4.

- [ ] **Step 6: Commit**

```bash
git add internal/flavor internal/app
git commit -m "feat(flavor): Mission Control channel with priorities and hold times"
```
