### Task 10: Mission control, contextual flavor, and the tiny details

**Files:**
- Create: `internal/fx/mission.go`
- Modify: `internal/flavor/messages.go` (the §27 and §45 tables)
- Modify: `internal/app/model.go` (`Frame.Status` comes from the world)
- Test: `internal/fx/mission_test.go`
- Test: `internal/flavor/contextual_test.go`

**Interfaces:**
- Consumes: `World`, `Snapshot`, `StatusMinLife` (Task 1); `flavor` (Task 9).
- Produces:
  ```go
  // flavor — takes plain values, never an fx type: fx imports flavor, so a
  // flavor function referencing fx.Snapshot would be an import cycle.
  func Contextual(e game.Event, prevScore, score int) (string, bool)  // §45 specials
  func Rare(rng *rand.Rand) (string, bool)                        // ~1-in-400
  // tables: the nine §27 status lines, plus §45's
  //   "KINETIC ROD DEPLOYED"            (vertical I hard-dropped)
  //   "CUBE ADJACENT OBJECT SECURED"    (O held)
  //   "NUMBER BECAME BIGGER"            (score crosses a power of ten)
  //   "CAPTAIN?"                        (30s idle before the first move)
  //   "DID YOU KNOW YOU'RE IN A TERMINAL?"  (rare)

  // fx
  func (w *World) Status() string      // current mission-control text
  func (w *World) ShootingStar() (Particle, bool)   // §45 idle detail
  ```
  Pinned (§27): a message holds for at least `StatusMinLife` (2500ms) before
  another may replace it — messages get time to breathe and do not rotate
  constantly. A contextual message (§45) may pre-empt an expired message but
  never a live one. Default text at start: `NOMINALISH`. Idle detail: after 8s
  with no movement event, emit one shooting star per ~6s (a fast near-layer
  particle crossing diagonally); after 30s of no movement at all, the status
  becomes `CAPTAIN?`.

  `Contextual` reads the piece kind and rotation from `e.Piece`, which the engine
  fills for `PieceHardDropped` and `HoldUsed`; the two score arguments are how
  the rollover case (§45) is detected without `flavor` knowing about `fx`.

- [ ] **Step 1: Write the failing tests in `internal/flavor/contextual_test.go`**

```go
func TestKineticRodOnVerticalIHardDrop(t *testing.T)   // §45
// PieceHardDropped with a vertical KindI -> "KINETIC ROD DEPLOYED"
// a horizontal I, or any other kind, -> no contextual message

func TestCubeAdjacentOnHoldingO(t *testing.T)
// HoldUsed with KindO -> "CUBE ADJACENT OBJECT SECURED"; other kinds -> none

func TestNumberBecameBiggerOnScoreRollover(t *testing.T)
// score 9,800 -> 10,400 triggers; 10,400 -> 11,000 does not

func TestRareMessageIsRare(t *testing.T)
// over 10,000 draws from seed 3: Rare() fires between 5 and 60 times

func TestStatusTableMatchesTheSpec(t *testing.T)
// the §27 table contains all nine lines verbatim, including
// "LOCAL UNIVERSE STABLE*" and "* DEFINITION OF STABLE UNDER REVIEW"
```

- [ ] **Step 2: Write the failing tests in `internal/fx/mission_test.go`**

```go
func TestInitialStatus(t *testing.T)   // Status() == "NOMINALISH"

func TestEventChangesTheStatus(t *testing.T)
// Observe(LinesCleared{Count:1}) -> Status() differs from the initial text

func TestStatusHoldsForItsMinimumLife(t *testing.T)   // §27
// after a status change, Observe five more events over 1s: Status() unchanged;
// after Advance past StatusMinLife a new event may replace it

func TestContextualMessagePreemptsOnlyExpiredMessages(t *testing.T)
// live message + a vertical-I hard drop within 1s -> unchanged
// same after StatusMinLife -> "KINETIC ROD DEPLOYED"

func TestIdleProducesShootingStars(t *testing.T)   // §45
// no events for 8s: at least one shooting star appears within the next 7s,
// and at most 3 over 20s

func TestLongIdleAsksForTheCaptain(t *testing.T)
// 30s with no movement event -> Status() == "CAPTAIN?"

func TestActivityStopsTheIdleDetails(t *testing.T)
// a PieceMoved every second for 40s: no "CAPTAIN?", no shooting stars

func TestStatusIsStableAcrossFramesWithoutEvents(t *testing.T)
// 120 Advance(16ms) calls with no events: Status() never changes mid-hold

func TestDisabledWorldStatusIsTheDefault(t *testing.T)
// !Enabled: Status() == "NOMINALISH" always — the no-FX game still has a
// sane status line rather than an empty one
```

- [ ] **Step 3: Run both test files to verify they fail**

Run: `go test ./internal/fx/ ./internal/flavor/ -run 'Status|Mission|Contextual|Rare|Idle|Kinetic|Cube|Number' -v`
Expected: FAIL — `undefined: Contextual`.

- [ ] **Step 4: Implement `flavor` additions, `fx/mission.go`, and the app wiring**

`app.Model.View` sets `Frame.Status = m.FX.Status()` (falling back to
`"NOMINALISH"` when `FX` is nil). Remove `Model.Status` if nothing else uses it.

- [ ] **Step 5: Run the tests and watch the channel**

Run: `go test ./... && ./cosmic-tetris --seed 1`
Expected: the status line comments on what you did, then sits still long enough
to read. Play for two minutes and confirm it never flickers between messages.

- [ ] **Step 6: Commit**

```bash
git add internal/fx/mission.go internal/fx/mission_test.go internal/flavor/ internal/app/
git commit -m "feat(fx): mission-control channel with contextual and rare flavor"
```
